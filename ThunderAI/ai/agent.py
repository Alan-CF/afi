import json
from ai.ai_client import client as ai_client
from sb.functions import search_products, get_active_cart, authenticate_user, get_chat_history, save_chat_message
from ai.context import tools, system_prompt

def run_agent(user_message: str, jwt_token: str = None):
    user_id = authenticate_user(jwt_token)

    messages = [
        {"role": "system", "content": system_prompt},
        *get_chat_history(user_id),
        {"role": "user", "content": user_message}
    ]

    while True:
        response = ai_client.chat.completions.create(
            model="qwen-plus", 
            messages=messages, 
            tools=tools
        ).choices[0].message

        messages.append(response)
        
        if not response.tool_calls:
            save_chat_message(user_id, user_message, "user")
            save_chat_message(user_id, response.content, "assistant")
            return response.content
            
        for tool in response.tool_calls:
            name, args = tool.function.name, json.loads(tool.function.arguments)
            try:
                if name == "search_products":
                    print("getting product")
                    res = search_products(args.get("product"))
                elif name == "get_active_cart":
                    res = get_active_cart(user_id)
                else:
                    res = "Unknown function"
            except Exception as e:
                res = f"Error: {e}"
                print(res)

            messages.append({
                "role": "tool", 
                "tool_call_id": tool.id, 
                "name": name, 
                "content": json.dumps(res)
            })

