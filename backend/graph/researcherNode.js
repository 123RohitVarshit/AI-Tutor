import Groq from "groq-sdk";
import VoyageAI from "voyageai";
import { getDB } from "../db/mongodb.js";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const voyage = new VoyageAI({ apiKey: process.env.VOYAGE_API_KEY });

export async function researcherNode(state) {
    console.log("📚 Researcher Node: Fetching context and generating content...");

    try {
        const db = getDB();
        const collection = db.collection("placement_docs");

        // 1. Embed the user query using Voyage AI
        const embeddingResponse = await voyage.embed({
            input: state.userQuery,
            model: "voyage-3-lite",
        });
        const queryEmbedding = embeddingResponse.data[0].embedding;

        // 2. MongoDB Atlas Vector Search
        const pipeline = [
            {
                $vectorSearch: {
                    index: "vector_index",
                    path: "embedding",
                    queryVector: queryEmbedding,
                    numCandidates: 50,
                    limit: 5,
                },
            },
            {
                $project: {
                    _id: 0,
                    content: 1,
                    topic: 1,
                    subtopic: 1,
                    score: { $meta: "vectorSearchScore" },
                },
            },
        ];

        const docs = await collection.aggregate(pipeline).toArray();
        const context = docs.map((d) => d.content).join("\n\n---\n\n");

        console.log(`📚 Retrieved ${docs.length} relevant documents`);

        // 3. Calculate target word count from duration
        const targetWords = state.duration * 150;

        // 4. Generate structured walkthrough using Groq
        const systemPrompt = `You are an expert placement preparation tutor for engineering students in India.
Your goal is to create a clear, structured, and educational walkthrough on the requested topic.

Guidelines:
- Write approximately ${targetWords} words (for a ${state.duration}-minute read at 150 wpm)
- Use Markdown formatting with clear headers (##, ###)
- Structure the content as a step-by-step walkthrough
- Include practical examples and code snippets where relevant
- Keep language clear and beginner-friendly
- End with 2-3 key takeaways

At the very end of your response, on a new line, write:
IMAGE_PROMPT: [a concise 10-15 word image description for generating a relevant educational diagram]`;

        const userMessage = `Topic: ${state.userQuery}

Relevant Context from Knowledge Base:
${context || "No specific context found. Generate from your knowledge."}

Please create a ${state.duration}-minute placement prep walkthrough on this topic.`;

        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage },
            ],
            temperature: 0.7,
            max_tokens: Math.round(targetWords * 2.5), // generous token budget
        });

        const fullContent = response.choices[0].message.content.trim();

        // 5. Extract imagePrompt from end of response
        const imageLine = fullContent.match(/IMAGE_PROMPT:\s*(.+)$/m);
        const imagePrompt = imageLine
            ? imageLine[1].trim()
            : `${state.userQuery} concept diagram educational illustration`;

        // Remove the IMAGE_PROMPT line from the displayed content
        const content = fullContent.replace(/IMAGE_PROMPT:.*$/m, "").trim();

        console.log(`📚 Generated ~${content.split(" ").length} words`);
        console.log(`🎨 Image prompt: ${imagePrompt}`);

        return {
            ...state,
            content,
            imagePrompt,
        };
    } catch (error) {
        console.error("Researcher node error:", error);
        return {
            ...state,
            content: "Error generating content. Please try again.",
            imagePrompt: "educational technology concept",
            error: error.message,
        };
    }
}
