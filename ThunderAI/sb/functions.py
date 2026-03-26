import jwt
import requests
from .supabase_client import supabase
import os

def _get_user_id(jwt_token: str):
    token = jwt_token.replace("Bearer ", "")
    user_id = jwt.decode(token, options={"verify_signature": False}).get("sub")
    return user_id

def _get_embedding(product: str):
    response = requests.post(
        "https://api.voyageai.com/v1/embeddings",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {os.getenv('VOYAGE_API_KEY')}",
        },
        json={
            "input": [product],
            "model": "voyage-3",
        },
    )
    return response.json()["data"][0]["embedding"]

def get_active_cart(jwt_token: str):
    user_id = _get_user_id(jwt_token)

    return (
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

def search_products(product: str):
    embedding = _get_embedding(product)
    return (
        supabase.rpc("search_products", 
            {
                "pEmbedding": embedding,
                "pTopN": 5
            }
        )
        .execute()
        .data
    )
    
    
