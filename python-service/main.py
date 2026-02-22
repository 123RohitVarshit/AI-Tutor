from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from graph.graph import tutor_graph
from graph.state import TutorState
import uvicorn
import json
import os
import re
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()
groq_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI(title="AI Tutor - Python Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


class TutorRequest(BaseModel):
    user_query: str
    duration: int = 3


async def generate_tutor_stream(user_query: str, duration: int):
    initial_state: TutorState = {
        "user_query": user_query,
        "duration": duration,
        "is_valid": False,
        "rejection_reason": "",
        "content": "",
        "system_prompt": "",
        "user_message": "",
        "error": None,
    }

    try:
        print(f"Starting graph for query: '{user_query}'")
        # 1. Run LangGraph (Supervisor -> Researcher)
        final_state = await tutor_graph.ainvoke(initial_state)

        # 2. Check validation or errors
        if not final_state.get("is_valid"):
            print("Query rejected by supervisor")
            yield json.dumps({
                "event": "error",
                "is_valid": False,
                "rejection_reason": final_state.get("rejection_reason")
            }) + "\n\n"
            return
            
        if final_state.get("error"):
            print(f"Graph error: {final_state['error']}")
            yield json.dumps({
                "event": "error",
                "error": final_state["error"]
            }) + "\n\n"
            return

        # 3. Stream from Groq directly
        print(f"LLM starting to stream...")
        target_words = duration * 150
        stream = await groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": final_state["system_prompt"]},
                {"role": "user", "content": final_state["user_message"]},
            ],
            temperature=0.7,
            max_tokens=int(target_words * 2.5),
            stream=True,
        )

        full_content = ""
        async for chunk in stream:
            content_chunk = chunk.choices[0].delta.content
            if content_chunk:
                full_content += content_chunk
                yield json.dumps({
                    "event": "token",
                    "text": content_chunk
                }) + "\n\n"

        # 4. Process final content
        print(f"Stream complete. Processing final output...")
        final_content = full_content.strip()

        # 5. Yield done event
        yield json.dumps({
            "event": "done",
            "content": final_content,
            "is_valid": True
        }) + "\n\n"

    except Exception as e:
        print(f"Fatal error in generator: {e}")
        yield json.dumps({
            "event": "error",
            "error": str(e)
        }) + "\n\n"


@app.get("/health")
def health():
    return {"status": "ok", "service": "AI Tutor Python Service"}


@app.post("/run")
async def run_tutor(request: TutorRequest):
    duration = max(2, min(5, request.duration))
    if not request.user_query.strip():
        raise HTTPException(status_code=400, detail="user_query is required")

    return StreamingResponse(
        generate_tutor_stream(user_query=request.user_query.strip(), duration=duration),
        media_type="text/event-stream"
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
