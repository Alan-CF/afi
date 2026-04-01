import jwt
import requests
from .supabase_client import supabase
import os


def _get_embedding(product: str):
    api_key = os.getenv("VOYAGE_API_KEY")
    if not api_key:
        raise ValueError("VOYAGE_API_KEY not set in environment variables")
    
    response = requests.post(
        "https://api.voyageai.com/v1/embeddings",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        json={
            "input": [product],
            "model": "voyage-3",
        },
    )
    return response.json()["data"][0]["embedding"]

def get_active_cart(user_id: str):

    data = (
        supabase.table("shopping_carts")
        .select(
            "id, "
            "shopping_cart_items ("
            "  priced_product_id, "
            "  product_pricing ("
            "    price, discount, "
            "    product_catalog (name, description, image_url, product_details)"
            "  )"
            ")"
        )
        .eq("cart_status", "active")
        .eq("profile_id", user_id)
        .execute()
        .data
    )
    return data

def search_products(product: str):
    embedding = _get_embedding(product)

    top_products = supabase.rpc("get_top_products", 
            {
                "query_embedding": embedding,
                "top_n": 5
            }
        ).execute().data
    return top_products
    
def authenticate_user(jwt_token: str):
    token = jwt_token.replace("Bearer ", "")
    supabase.postgrest.auth(token)
    return jwt.decode(token, options={"verify_signature": False})["sub"]

def get_chat_history(user_id: str):

    data = (
        supabase.table("thunder_conversations")
        .select("role, content")
        .eq("profile_id", user_id)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
        .data
    )
    return data

def save_chat_message(user_id: str, message: str, role: str):
    supabase.table("thunder_conversations").insert({
        "profile_id": user_id,
        "content": message,
        "role": role
    }).execute()