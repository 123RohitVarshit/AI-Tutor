import googleTTS from "google-tts-api";
import dotenv from "dotenv";
dotenv.config();

// Pollinations.ai - completely free, no API key needed
function getImageUrl(imagePrompt) {
    const encoded = encodeURIComponent(
        `educational diagram: ${imagePrompt}, clean illustration, flat design, blue and white color scheme`
    );
    return `https://image.pollinations.ai/prompt/${encoded}?width=800&height=500&nologo=true`;
}

// Split long text into chunks for Google TTS (200 char limit per request)
async function textToAudioBase64(text) {
    try {
        // Clean text: remove markdown symbols for better audio
        const cleanText = text
            .replace(/#{1,6}\s/g, "") // headers
            .replace(/\*\*/g, "")      // bold
            .replace(/\*/g, "")        // italic
            .replace(/`{1,3}/g, "")    // code blocks
            .replace(/[-*+]\s/g, "")   // list bullets
            .replace(/\n{2,}/g, ". ")  // paragraph breaks to pauses
            .replace(/\n/g, " ")
            .trim();

        // Limit to 2 minutes of audio max (~300 words, ~1800 chars) to avoid timeout
        const maxChars = 1800;
        const truncated = cleanText.length > maxChars
            ? cleanText.slice(0, maxChars) + "... For the complete walkthrough, read the text above."
            : cleanText;

        // google-tts-api handles chunking automatically via getAllAudioUrls
        const urls = googleTTS.getAllAudioUrls(truncated, {
            lang: "en",
            slow: false,
            host: "https://translate.google.com",
        });

        // Fetch all audio chunks and combine into one base64 buffer
        const audioChunks = await Promise.all(
            urls.map(async ({ url }) => {
                const res = await fetch(url, {
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    },
                });
                if (!res.ok) throw new Error(`TTS fetch failed: ${res.status}`);
                const buffer = await res.arrayBuffer();
                return Buffer.from(buffer);
            })
        );

        const combined = Buffer.concat(audioChunks);
        return combined.toString("base64");
    } catch (error) {
        console.error("TTS error:", error.message);
        return null; // Return null if TTS fails — frontend handles gracefully
    }
}

export async function mediaNode(state) {
    console.log("🎨 Media Node: Generating image and audio...");

    try {
        // Run image URL generation and TTS in parallel
        const [imageUrl, audioBase64] = await Promise.all([
            Promise.resolve(getImageUrl(state.imagePrompt)),
            textToAudioBase64(state.content),
        ]);

        console.log("🖼️  Image URL generated");
        console.log(audioBase64 ? "🔊 Audio generated successfully" : "⚠️  Audio generation failed (graceful fallback)");

        return {
            ...state,
            imageUrl,
            audioBase64: audioBase64 || "",
        };
    } catch (error) {
        console.error("Media node error:", error);
        return {
            ...state,
            imageUrl: getImageUrl(state.imagePrompt || "education technology"),
            audioBase64: "",
            error: error.message,
        };
    }
}
