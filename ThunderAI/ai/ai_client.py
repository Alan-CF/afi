import os
from openai import OpenAI

client = OpenAI(api_key=os.environ.get('LLM_API_KEY'), base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1")
