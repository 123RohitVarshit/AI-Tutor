import googleTTS from "google-tts-api";

export async function generateAudioBase64(text) {
    try {
        // Strip markdown for cleaner speech
        const cleanText = text
            .replace(/#{1,6}\s/g, "")
            .replace(/\*\*/g, "")
            .replace(/\*/g, "")
            .replace(/`{1,3}[^`]*`{1,3}/g, "")
            .replace(/```[\s\S]*?```/g, "")
            .replace(/[-*+]\s/g, "")
            .replace(/\n{2,}/g, ". ")
            .replace(/\n/g, " ")
            .trim();

        // Limit to ~1800 chars to avoid long fetch times
        const truncated =
            cleanText.length > 1800
                ? cleanText.slice(0, 1800) + ". Read the full walkthrough above."
                : cleanText;

        const urls = googleTTS.getAllAudioUrls(truncated, {
            lang: "en",
            slow: false,
            host: "https://translate.google.com",
        });

        const audioChunks = await Promise.all(
            urls.map(async ({ url }) => {
                const res = await fetch(url, {
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    },
                });
                if (!res.ok) throw new Error(`TTS request failed: ${res.status}`);
                return Buffer.from(await res.arrayBuffer());
            })
        );

        return Buffer.concat(audioChunks).toString("base64");
    } catch (err) {
        console.error("TTS error (graceful fallback):", err.message);
        return ""; // Frontend handles empty audio gracefully
    }
}
