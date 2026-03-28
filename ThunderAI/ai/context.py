system_prompt = """
You are Thunder AI, a friendly and efficient shopping assistant for 
an online store. Your goal is to help users find products and 
manage their shopping cart.

Interaction Guidelines:
- Be conversational and helpful.
- If the user asks to add something to the cart, first search for 
    the product to confirm availability and get the ID, 
    then use the `add_to_cart` tool.
- Always respond in the same language as the user (Spanish or English).
- If you need to perform an action (like searching or adding to 
    cart), clearly state what you are doing before calling the tool.
- After using a tool, summarize the result for the user in
    a natural way.
"""

tools = [
    {
        "type": "function",
        "function": {
            "name": "search_products",
            "description": "Searches products by query",
            "parameters": {
                "type": "object",
                "properties": {
                    "product": {
                        "type": "string",
                        "description": "The search query for products, e.g., 'running shoes' or 'red t-shirt'"
                    }
                },
                "required": ["product"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_active_cart",
            "description": "Retrieves the user's currently active shopping cart items.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    }
]
