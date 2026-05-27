import { useState } from "react";
import ResultCard from "./components/ResultCard";

export default function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch("http://localhost:8000/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Could not connect to server. Make sure the backend is running.");
    }
    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>📡 FakeNews Radar</h1>
        <p style={styles.sub}>Paste a news article or headline below to check its credibility.</p>

        <textarea
          style={styles.textarea}
          placeholder="Paste article text or headline here..."
          value={text}
          onChange={e => setText(e.target.value)}
          rows={7}
        />

        <button
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Analysing..." : "Check Credibility"}
        </button>

        {error && <p style={styles.error}>{error}</p>}
        {result && <ResultCard result={result} />}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f0ede8", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  card: { background: "#fafaf8", borderRadius: 16, padding: 36, maxWidth: 680, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
  title: { fontSize: 26, fontWeight: 700, color: "#1c1c1a", marginBottom: 6 },
  sub: { color: "#8c8985", marginBottom: 20, fontSize: 14 },
  textarea: { width: "100%", padding: "14px 16px", borderRadius: 10, border: "1.5px solid #d0cdc8", fontSize: 14, fontFamily: "inherit", resize: "vertical", outline: "none", background: "white" },
  btn: { marginTop: 14, background: "#2c5f4a", color: "white", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%" },
  error: { color: "#c0392b", marginTop: 12, fontSize: 13 }
};
