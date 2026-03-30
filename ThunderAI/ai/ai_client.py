import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get('LLM_API_KEY')
if not api_key:
    raise ValueError("LLM_API_KEY not found.")

client = OpenAI(
    api_key=api_key, 
    base_url="https://dashscope-us.aliyuncs.com/compatible-mode/v1"
)
