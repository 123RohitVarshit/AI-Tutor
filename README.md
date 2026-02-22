# AI Tutor - Placement Preparation Platform

An intelligent, microservices-based AI Tutor designed specifically for Indian engineering students preparing for placements. It provides complete, structured, and duration-controlled walkthroughs on technical topics (DSA, MERN, System Design, etc.) along with automatically generated Audio Text-to-Speech (TTS).

## 🏗️ Architecture

The project is broken down into a modern microservices architecture to ensure high performance, separation of concerns, and robust Server-Sent Events (SSE) streaming.

```text
+-------------------+
|  React Frontend   | (Port 5173)
+--------+----------+
         | 
         | POST /api/tutor
         v
+--------+----------+
|Node.js API Gateway| (Port 5000)
+--------+----------+
         |
         | POST /run
         v
+--------+----------+      +---------------------------+
| Python FastAPI +  | ──►  | 1. Supervisor (Groq)      | --(validates query)
| LangGraph Server  |      +---------------------------+
|    (Port 8000)    | ──►  | 2. Researcher (Voyage AI) | --(builds context)
+--------+----------+      +-------------+-------------+
         |                               |
         | Stream text (Groq)            | searches
         v                               v
+--------+----------+      +-------------+-------------+
|Node.js API Gateway|      | MongoDB Atlas Vector DB   |
+--------+----------+      +---------------------------+
         |
         | 1. Streams SSE Text to Frontend
         | 2. Calls Google TTS when text finishes
         v
+-------------------+
|  React Frontend   | (Displays Streamed Markdown + Audio)
+-------------------+
```

### Components
1. **Frontend (React + Vite)**: A sleek, dark-themed UI that captures user input (Topic & Duration), securely proxies requests to the Node gateway, and renders streaming Markdown content.
2. **API Gateway (Node.js + Express)**: Acts as the secure middleman. It streams text tokens smoothly directly from the Python service to the user's browser via native `fetch`, and computes the Text-to-Speech audio in the background once the text generation completes.
3. **AI Service (Python + FastAPI + LangGraph)**: The heavy-lifter. 
   - Uses **LangGraph** to apply strict guardrails (rejecting non-placement queries) and perform RAG (Retrieval-Augmented Generation) using **MongoDB Atlas Vector Search** and **Voyage AI** embeddings.
   - Bypasses LangGraph state bottlenecks by directly streaming tokens from **Groq** back to the gateway.

## 🚀 Features
- **Strict Guardrails**: Refuses to answer off-topic queries (e.g., "Tell me a recipe", "Write a poem").
- **Dynamic Content Scaling**: Generates content proportional to the selected "Duration" (2 to 5 minutes ≈ 300 to 750 words).
- **RAG Powered**: Embeds and searches real placement prep materials to ground the AI responses in factual, structured knowledge.
- **Audio Walkthroughs**: Generates listenable audio of the entire generated walkthrough.
- **Real-time Streaming**: Uses SSE to stream text byte-by-byte to the UI, providing a fast, ChatGPT-like experience.

---

## ⚙️ Local Setup Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- MongoDB Atlas Account (Free Cluster)
- Groq API Key (Free)
- Voyage AI API Key (Free)

### 1. Database Setup (MongoDB Atlas)
1. Create a free MongoDB Atlas cluster.
2. Get your connection string (`mongodb+srv://...`).
3. In your Atlas UI, create an Atlas Vector Search Index. Name it `vector_index` on the `ai_tutor.knowledge_base` namespace using the following JSON definition:
   ```json
   {
     "fields": [
       {
         "numDimensions": 512,
         "path": "embedding",
         "similarity": "cosine",
         "type": "vector"
       }
     ]
   }
   ```

### 2. Python AI Service Setup
Open a terminal in the `python-service` directory.

```bash
cd python-service

# Create and activate virtual environment
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from the example
cp .env.example .env
```
Fill in the `.env` file with your `GROQ_API_KEY`, `VOYAGE_API_KEY`, and `MONGODB_URI`.

*(Optional but recommended) Run data ingestion to populate MongoDB with the RAG database:*
```bash
python scripts/ingest_data.py
```

**Start the FastAPI Server:**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Node.js API Gateway Setup
Open a new terminal in the `backend` directory.

```bash
cd backend

# Install dependencies
npm install

# Create .env file from the example
cp .env.example .env
```
*(No API keys needed here, just the MongoDB URI if using DB features)*

**Start the Node server:**
```bash
npm run dev
```

### 4. React Frontend Setup
Open a new terminal in the `frontend` directory.

```bash
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

Navigate to **http://localhost:5173** in your browser.

---

## 🛠️ Testing the Application
1. **Valid Query**: Type `Explain React Hooks` and set duration to `3 min`. Watch the text stream in real-time, followed by the appearance of the Audio Player.
2. **Invalid Query**: Type `How to bake a cake` and attempt to generate. The guardrails will immediately reject the request.
3. **Duration Scale**: Type `System Design Basics` at `2 min`, and then again at `5 min`. Observe the stark difference in detail and length.

## 📄 License
Open source under the MIT License. Created for the Cantilever Labs AI Tutor assignment.
