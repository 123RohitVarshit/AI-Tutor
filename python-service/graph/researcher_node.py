import os
import re
from voyageai import Client as VoyageClient
from voyageai import Client as VoyageClient
from dotenv import load_dotenv
from db.mongodb import get_collection
from graph.state import TutorState

load_dotenv()

voyage_client = VoyageClient(api_key=os.getenv("VOYAGE_API_KEY"))
voyage_client = VoyageClient(api_key=os.getenv("VOYAGE_API_KEY"))


async def researcher_node(state: TutorState):
    print(f"Researcher: generating content for '{state['user_query']}'")
    try:
        # 1. Embed the user query with Voyage AI
        embed_response = voyage_client.embed(
            texts=[state["user_query"]],
            model="voyage-3-lite",
        )
        query_embedding = embed_response.embeddings[0]

        # 2. MongoDB Atlas Vector Search — top 5 relevant chunks
        collection = get_collection()
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": query_embedding,
                    "numCandidates": 50,
                    "limit": 5,
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "content": 1,
                    "topic": 1,
                }
            }
        ]
        docs = list(collection.aggregate(pipeline))
        context = "\n\n---\n\n".join(d["content"] for d in docs)
        print(f"Retrieved {len(docs)} relevant chunks from MongoDB")

        # 3. Target word count based on duration
        target_words = state["duration"] * 150

        # 4. Generate structured markdown walkthrough via Groq
        system_prompt = f"""You are an expert placement preparation tutor for engineering students in India.
Generate a clear, structured, step-by-step walkthrough on the requested topic.

Guidelines:
- Write approximately {target_words} words (for a {state['duration']}-minute read at 150 wpm)
- Use Markdown: headers (##, ###), bullet points, code blocks where relevant
- Structure as a step-by-step walkthrough with practical examples
- Keep language clear and beginner-friendly
- End with 2-3 key takeaways"""

        user_message = f"""Topic: {state['user_query']}

Relevant context from knowledge base:
{context if context else "No specific context found. Generate from your own knowledge."}

Create a {state['duration']}-minute placement prep walkthrough."""

        return {"system_prompt": system_prompt, "user_message": user_message}

    except Exception as e:
        print(f"Researcher error: {e}")
        return {
            "error": str(e),
        }
