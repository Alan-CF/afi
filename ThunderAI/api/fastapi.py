from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import Optional

from ai.agent import run_agent

app = FastAPI()

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat_endpoint(request: ChatRequest, authorization: Optional[str] = Header(None)):
    try:
        reply = run_agent(request.message, jwt_token=authorization)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))