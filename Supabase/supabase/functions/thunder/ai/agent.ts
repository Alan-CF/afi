import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type ChatMessage, client } from "./ai_client.ts";
import {
  authenticate_user,
  get_active_cart,
  get_chat_history,
  save_chat_message,
  search_products,
} from "../sb/functions.ts";
import { get_supabase_client } from "../sb/sb_client.ts";
import { system_prompt, tools } from "./context.ts";
import { type Json, parsed_response } from "./response_validator.ts";

function parse_tool_args(raw_args: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw_args);
    return parsed && typeof parsed === "object"
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

export async function run_agent(
  user_message: string,
  jwt_token: string | null = null,
): Promise<Json | string> {
  let user_id = "anonymous";
  let supabase: SupabaseClient = get_supabase_client();

  if (jwt_token) {
    const auth_data = await authenticate_user(jwt_token);
    user_id = auth_data.user_id;
    supabase = auth_data.supabase;
  }

  const messages: ChatMessage[] = [
    { role: "system", content: system_prompt },
    ...await get_chat_history(supabase, user_id),
    { role: "user", content: user_message },
  ];

  while (true) {
    const response = (await client.chat.completions.create({
      model: "qwen-plus",
      messages,
      tools: tools as unknown as unknown[],
    })).choices[0].message;

    messages.push(response);

    if (!response.tool_calls || response.tool_calls.length === 0) {
      await save_chat_message(supabase, user_id, user_message, "user");

      if (response.content) {
        await save_chat_message(
          supabase,
          user_id,
          response.content,
          "assistant",
        );
        return parsed_response(response.content);
      }
    }

    for (const tool of response.tool_calls ?? []) {
      const name = tool.function.name;
      const args = parse_tool_args(tool.function.arguments);

      let res: unknown;
      try {
        if (name === "search_products") {
          console.log("getting product");
          res = await search_products(
            supabase,
            String(args.product ?? ""),
          );
        } else if (name === "get_active_cart") {
          res = await get_active_cart(supabase, user_id);
        } else {
          res = "Unknown function";
        }
      } catch (error) {
        res = `Error: ${
          error instanceof Error ? error.message : String(error)
        }`;
        console.error(res);
      }

      messages.push({
        role: "tool",
        tool_call_id: tool.id,
        name,
        content: JSON.stringify(res),
      });
    }
  }
}
