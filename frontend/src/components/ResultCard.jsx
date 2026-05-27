export default function ResultCard({ result }) {
  const isReal = result.prediction === "REAL";
  const color = isReal ? "#2c5f4a" : "#c0392b";
  const bg    = isReal ? "#e8f5ee" : "#fdecea";

  return (
    <div style={{ ...styles.card, background: bg, borderLeft: `4px solid ${color}` }}>
      <div style={styles.top}>
        <span style={{ ...styles.badge, background: color }}>
          {isReal ? "✅ REAL" : "❌ FAKE"}
        </span>
        <span style={styles.conf}>{result.confidence}% confidence</span>
      </div>

      <p style={styles.verdict}>{result.verdict}</p>

      <div style={styles.bars}>
        <div style={styles.barRow}>
          <span style={styles.barLabel}>Real</span>
          <div style={styles.barBg}>
            <div style={{ ...styles.barFill, width: `${result.real_score}%`, background: "#2c5f4a" }} />
          </div>
          <span style={styles.barPct}>{result.real_score}%</span>
        </div>
        <div style={styles.barRow}>
          <span style={styles.barLabel}>Fake</span>
          <div style={styles.barBg}>
            <div style={{ ...styles.barFill, width: `${result.fake_score}%`, background: "#c0392b" }} />
          </div>
          <span style={styles.barPct}>{result.fake_score}%</span>
        </div>
      </div>

      <div style={styles.signals}>
        <span>✅ Credibility markers: <b>{result.credibility_signals.positive_markers}</b></span>
        <span>⚠️ Sensational markers: <b>{result.credibility_signals.negative_markers}</b></span>
      </div>
    </div>
  );
}

const styles = {
  card: { marginTop: 20, borderRadius: 12, padding: 20 },
  top: { display: "flex", alignItems: "center", gap: 14, marginBottom: 8 },
  badge: { color: "white", borderRadius: 6, padding: "4px 12px", fontWeight: 700, fontSize: 14 },
  conf: { color: "#4a4845", fontSize: 14 },
  verdict: { color: "#4a4845", fontSize: 13, marginBottom: 14 },
  bars: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 },
  barRow: { display: "flex", alignItems: "center", gap: 10 },
  barLabel: { width: 32, fontSize: 12, color: "#8c8985" },
  barBg: { flex: 1, background: "#e0ddd8", borderRadius: 4, height: 8, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4, transition: "width 0.5s ease" },
  barPct: { width: 40, fontSize: 12, color: "#4a4845", textAlign: "right" },
  signals: { display: "flex", gap: 20, fontSize: 13, color: "#4a4845" }
};
