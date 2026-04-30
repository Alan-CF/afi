import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { get_supabase_client } from "./sb_client.ts";

type ConversationRole = "user" | "assistant" | "system";

export type ChatHistoryMessage = {
  role: ConversationRole;
  content: string;
};

async function _get_embedding(product: string): Promise<number[]> {
  const api_key = Deno.env.get("VOYAGE_API_KEY");
  if (!api_key) {
    throw new Error("VOYAGE_API_KEY not set in environment variables");
  }

  const response = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${api_key}`,
    },
    body: JSON.stringify({
      input: [product],
      model: "voyage-3",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Voyage embeddings request failed (${response.status}): ${errorText}`,
    );
  }

  const data = await response.json();
  const embedding = data?.data?.[0]?.embedding;

  if (!Array.isArray(embedding)) {
    throw new Error("Voyage response does not contain a valid embedding");
  }

  return embedding as number[];
}

export async function get_active_cart(
  supabase: SupabaseClient,
  user_id: string,
) {
  const { data, error } = await supabase
    .from("shopping_carts")
    .select(
      "id, shopping_cart_items ( priced_product_id, product_pricing ( price, discount, product_catalog (name, description, image_url, product_details) ) )",
    )
    .eq("cart_status", "active")
    .eq("profile_id", user_id);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function search_products(
  supabase: SupabaseClient,
  product: string,
) {
  const embedding = await _get_embedding(product);

  const { data, error } = await supabase.rpc("get_top_products", {
    query_embedding: embedding,
    top_n: 5,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function authenticate_user(jwt_token: string): Promise<{
  user_id: string;
  supabase: SupabaseClient;
}> {
  const token = jwt_token.replace("Bearer ", "").trim();
  const supabase = get_supabase_client(`Bearer ${token}`);

  const { data: { user }, error } = await supabase.auth.getUser(token);
  console.log("Auth response:", { user, error });
  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return { user_id: user.id, supabase };
}

export async function get_chat_history(
  supabase: SupabaseClient,
  user_id: string,
): Promise<ChatHistoryMessage[]> {
  const { data, error } = await supabase
    .from("thunder_conversations")
    .select("role, content")
    .eq("profile_id", user_id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ChatHistoryMessage[];
}

export async function save_chat_message(
  supabase: SupabaseClient,
  user_id: string,
  message: string,
  role: "user" | "assistant",
) {
  const { error } = await supabase.from("thunder_conversations").insert({
    profile_id: user_id,
    content: message,
    role,
  });

  if (error) {
    throw new Error(error.message);
  }
}
