// Fake News Radar - Extension popup client controller

// The backend ZIP bundler dynamically replaces this domain on download!
const DEFAULT_SERVER = "https://itachii9090-fake-news-radar.hf.space";

document.addEventListener('DOMContentLoaded', async () => {
  const textInput = document.getElementById('scanText');
  const analyzeBtn = document.getElementById('btnAnalyzeBtn');
  const clearBtn = document.getElementById('btnClearBtn');
  const loader = document.getElementById('loadingOverlay');
  const results = document.getElementById('resultSection');

  // Load selection text from context menu trigger
  chrome.storage.local.get('selectedText', (data) => {
    if (data.selectedText) {
      textInput.value = data.selectedText;
      
      // Clear badge notification
      chrome.action.setBadgeText({ text: "" });
      
      // Clear selected state so it doesn't loop
      chrome.storage.local.remove('selectedText');
      
      // Trigger automatic scan immediately on popup open
      analyzeBtn.click();
    }
  });

  clearBtn.addEventListener('click', () => {
    textInput.value = '';
    results.classList.add('hidden');
  });

  analyzeBtn.addEventListener('click', async () => {
    const text = textInput.value.trim();
    if (!text) return;

    loader.classList.remove('hidden');
    results.classList.add('hidden');
    analyzeBtn.disabled = true;

    try {
      // Dynamic Server Routing (checks if custom settings exist, otherwise defaults)
      const settings = await getLocalStorage(['customServerUrl']);
      const serverUrl = settings.customServerUrl || DEFAULT_SERVER;

      const response = await fetch(`${serverUrl}/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      if (!response.ok) throw new Error("Verification server error");

      const data = await response.json();
      displayResults(data);
    } catch (err) {
      console.error(err);
      alert("Could not connect to Fake News Radar server. Ensure you have an active network connection.");
    } finally {
      loader.classList.add('hidden');
      analyzeBtn.disabled = false;
    }
  });
});

function displayResults(data) {
  const scoreArc = document.getElementById('scoreArc');
  const scoreNum = document.getElementById('scoreNumber');
  const label = document.getElementById('verdictLabel');
  const details = document.getElementById('verdictExplanation');
  const toneText = document.getElementById('metricTone');
  const citationText = document.getElementById('metricCitations');
  const clickbaitText = document.getElementById('metricClickbait');
  const barTone = document.getElementById('barTone');
  const barCitations = document.getElementById('barCitations');
  const barClickbait = document.getElementById('barClickbait');
  const results = document.getElementById('resultSection');

  const score = data.prediction === 'REAL' ? data.real_score : (100 - data.fake_score);
  const credibilityPct = parseFloat(score.toFixed(1));

  // Render text content
  scoreNum.textContent = `${credibilityPct}%`;
  
  // Set Verdict labels and color styles
  if (credibilityPct >= 70) {
    label.className = "verdict-label tag-credible";
    label.textContent = "Credible";
    scoreArc.style.stroke = "#00ff88";
    details.textContent = "This content shows strong alignment with established objective journalistic standards.";
  } else if (credibilityPct >= 45) {
    label.className = "verdict-label tag-suspicious";
    label.textContent = "Suspicious";
    scoreArc.style.stroke = "#00d4ff";
    details.textContent = "Linguistic checks show loaded triggers. Suggest verifying with alternate sources.";
  } else {
    label.className = "verdict-label tag-fake";
    label.textContent = "Highly Misleading";
    scoreArc.style.stroke = "#ff3366";
    details.textContent = "Critical alert! Multiple sensationalism structures and disinformation patterns detected.";
  }

  // Draw circle SVG arc gauge (circumference = 201)
  const offset = 201 - (credibilityPct / 100) * 201;
  scoreArc.style.strokeDashoffset = offset;

  // Render metrics text
  const biasVal = data.analytics ? Math.round(100 - data.analytics.bias_score) : 25;
  const citationVal = data.analytics ? Math.round(data.analytics.citation_density) : 30;
  const clickbaitVal = data.analytics ? Math.round(data.analytics.clickbait_score) : 10;

  toneText.textContent = `${biasVal}% Subjective`;
  citationText.textContent = `${citationVal}%`;
  clickbaitText.textContent = `${clickbaitVal}%`;

  // Animate Metric Bars
  results.classList.remove('hidden');
  
  setTimeout(() => {
    barTone.style.width = `${biasVal}%`;
    barCitations.style.width = `${citationVal}%`;
    barClickbait.style.width = `${clickbaitVal}%`;
  }, 100);
}

// Local storage helper using chrome compatibility
function getLocalStorage(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, resolve);
  });
}
