import { useState } from "react";
import ReactMarkdown from "react-markdown";
import "./index.css";

function App() {
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [streamContent, setStreamContent] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [media, setMedia] = useState({ audioBase64: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setStreamContent("");
    setIsValid(true);
    setRejectionReason("");
    setMedia({ audioBase64: null });
    setResult({ duration }); // Store duration for UI display

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, duration }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop(); // Keep the last incomplete chunk in buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const data = JSON.parse(line);

            if (data.event === "error") {
              if (data.is_valid === false) {
                setIsValid(false);
                setRejectionReason(data.rejection_reason);
              } else {
                setError(data.error || "An error occurred.");
              }
            } else if (data.event === "token") {
              setStreamContent(prev => prev + data.text);
            } else if (data.event === "media") {
              setMedia({
                audioBase64: data.audioBase64,
              });
            }
          } catch (err) {
            // Ignore parse errors from partial chunks
          }
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-text">AI<span className="logo-accent">Tutor</span></span>
          </div>
          <p className="header-subtitle">Your intelligent placement preparation guide</p>
        </div>
      </header>

      <main className="main">
        {/* Input Form */}
        <section className="form-card">
          <h2 className="form-title">What would you like to learn?</h2>
          <form onSubmit={handleSubmit} className="form">
            <div className="input-group">
              <label className="label">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Explain React Hooks, System Design, Dynamic Programming..."
                className="input"
                disabled={loading}
              />
            </div>

            <div className="slider-group">
              <label className="label">
                Duration: <span className="duration-badge">{duration} min</span>
                <span className="duration-words">≈ {duration * 150} words</span>
              </label>
              <input
                type="range"
                min="2"
                max="5"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="slider"
                disabled={loading}
              />
              <div className="slider-labels">
                <span>2 min</span>
                <span>3 min</span>
                <span>4 min</span>
                <span>5 min</span>
              </div>
            </div>

            <button type="submit" className="btn-submit" disabled={loading || !topic.trim()}>
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner" />
                  Generating walkthrough...
                </span>
              ) : (
                "Generate Walkthrough"
              )}
            </button>
          </form>
        </section>

        {/* Error */}
        {error && (
          <div className="error-card">
            <span className="error-icon">Error:</span> {error}
          </div>
        )}

        {/* Rejected query */}
        {!isValid && (
          <div className="rejection-card">
            {/* No icon needed */}
            <h3>Off-Topic Query Detected</h3>
            <p>{rejectionReason}</p>
            <p className="rejection-hint">Please ask about placement-related topics like DSA, MERN Stack, System Design, or Aptitude.</p>
          </div>
        )}

        {/* Valid result (Streaming or complete) */}
        {isValid && (streamContent || loading) && (
          <div className="result-section">

            {/* Markdown content streams in FIRST */}
            <div className="content-card">
              <div className="content-header">
                <h3 className="section-title">
                  Walkthrough
                  {loading && <span className="spinner" style={{ display: 'inline-block', marginLeft: '10px', width: '12px', height: '12px' }} />}
                </h3>
                <span className="duration-tag">~{result?.duration || duration} min read</span>
              </div>
              <div className="markdown-body">
                <ReactMarkdown>{streamContent}</ReactMarkdown>
              </div>
            </div>



            {/* Audio (loads after streaming finishes) */}
            {media.audioBase64 && (
              <div className="audio-card">
                <h3 className="section-title">Audio Walkthrough</h3>
                <audio
                  controls
                  className="audio-player"
                  src={`data:audio/mp3;base64,${media.audioBase64}`}
                />
              </div>
            )}

          </div>
        )}
      </main>

      <footer className="footer">
        <p>Built using LangGraph · Groq · Voyage AI · MongoDB Atlas</p>
      </footer>
    </div>
  );
}

export default App;
