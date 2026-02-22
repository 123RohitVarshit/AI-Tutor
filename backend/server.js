import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import { generateAudioBase64 } from "./services/ttsService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Node.js API Gateway" });
});

// Main tutor endpoint
app.post("/api/tutor", async (req, res) => {
  try {
    const { topic, duration } = req.body;

    if (!topic || topic.trim() === "") {
      return res.status(400).json({ error: "Topic is required" });
    }

    const durationNum = Math.min(5, Math.max(2, Number(duration) || 3));

    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    console.log(`[Node.js] Forwarding request to Python: "${topic}" (${durationNum}m)`);

    // 1. Call Python LangGraph service using native fetch for streaming
    const pythonRes = await fetch(`${PYTHON_SERVICE_URL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_query: topic.trim(), duration: durationNum }),
    });

    if (!pythonRes.ok) {
      console.error(`[Node.js] Python service returned error: ${pythonRes.status}`);
      return res.status(pythonRes.status).json({ error: "AI pipeline error" });
    }

    console.log(`[Node.js] Connected to Python stream. Forwarding stream to React...`);

    // 2. Process the stream
    let buffer = "";
    const reader = pythonRes.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const textChunk = decoder.decode(value, { stream: true });
      process.stdout.write("."); // Print dots to show active streaming in terminal

      // Pass the raw tokens straight to the frontend immediately
      res.write(textChunk);

      // Buffer for JSON parsing to intercept "done"
      buffer += textChunk;
      const lines = buffer.split("\n\n");
      buffer = lines.pop(); // Keep the last incomplete chunk in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            if (data.event === "done" && data.is_valid) {
              console.log(`\n[Node.js] Text complete! Generating audio in background...`);
              // Now generate media asynchronously using the full content
              generateAudioBase64(data.content).then((audioBase64) => {
                console.log(`[Node.js] Audio generated. Sending final payload to React.`);
                // Send a final media event to the frontend
                res.write(JSON.stringify({
                  event: "media",
                  audioBase64,
                  duration: durationNum
                }) + "\n\n");
                res.end();
              }).catch(err => {
                console.error("\n[Node.js] Audio generation error:", err);
                res.end();
              });
              return; // We called res.end() inside the promise
            }
          } catch (e) {
            // Ignore parse errors on partial/invalid chunks
          }
        }
      }
    }

    console.log(`\n[Node.js] Stream ended naturally.`);
    // If it reaches here without a 'done' event, end the response
    res.end();

  } catch (err) {
    console.error("Gateway error:", err.message);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Node.js API Gateway running at http://localhost:${PORT}`);
  console.log(`   Proxying AI requests to Python service at ${PYTHON_SERVICE_URL}`);
});
