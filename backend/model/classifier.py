from transformers import pipeline
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

_pipe = None

def get_pipeline():
    global _pipe
    if _pipe is None:
        # Using a zero-shot classifier as a stand-in for the fine-tuned model
        # Replace with your fine-tuned model path after training
        _pipe = pipeline(
            "zero-shot-classification",
            model="facebook/bart-large-mnli"
        )
    return _pipe

CREDIBILITY_MARKERS = {
    "high": ["according to", "study shows", "researchers found", "data indicates",
             "official statement", "confirmed by", "published in"],
    "low":  ["shocking", "you won't believe", "they don't want you to know",
             "secret", "cover up", "breaking!", "exposed!!", "mainstream media won't"]
}

DOMAIN_TRUST_REGISTRY = {
    # High-credibility established sources (90-98%)
    "reuters.com": {"trust": 98, "bias": "Neutral / Least Biased"},
    "apnews.com": {"trust": 98, "bias": "Neutral / Least Biased"},
    "bbc.com": {"trust": 95, "bias": "Neutral / Balanced"},
    "bbc.co.uk": {"trust": 95, "bias": "Neutral / Balanced"},
    "nytimes.com": {"trust": 93, "bias": "Center-Left"},
    "washingtonpost.com": {"trust": 93, "bias": "Center-Left"},
    "theguardian.com": {"trust": 92, "bias": "Center-Left"},
    "wsj.com": {"trust": 94, "bias": "Center-Right"},
    "economist.com": {"trust": 94, "bias": "Center-Right"},
    "npr.org": {"trust": 93, "bias": "Center-Left"},
    "bloomberg.com": {"trust": 94, "bias": "Neutral / Balanced"},
    
    # Questionable or Satirical sources (10-40%)
    "theonion.com": {"trust": 15, "bias": "Satire / Parody"},
    "babylonbee.com": {"trust": 15, "bias": "Satire / Parody"},
    "infowars.com": {"trust": 10, "bias": "Conspiracy / Extreme Right"},
    "naturalnews.com": {"trust": 12, "bias": "Pseudoscience / Extreme Right"},
    "breitbart.com": {"trust": 40, "bias": "Extreme Right / Loaded Language"},
}

def resolve_domain_trust(domain):
    if not domain:
        return 75.0, "N/A (Raw Text)" # Default for raw text submissions
        
    # Check exact match
    if domain in DOMAIN_TRUST_REGISTRY:
        info = DOMAIN_TRUST_REGISTRY[domain]
        return info["trust"], info["bias"]
        
    # Check partial subdomain matches (e.g. news.bbc.co.uk -> bbc.co.uk)
    for k, v in DOMAIN_TRUST_REGISTRY.items():
        if domain.endswith("." + k) or domain == k:
            return v["trust"], v["bias"]
            
    # TLD fallback authority
    if domain.endswith(".gov"):
        return 95.0, "Government Source (Highly Factual)"
    elif domain.endswith(".edu"):
        return 92.0, "Educational Institution (Academic)"
    elif domain.endswith(".org"):
        return 80.0, "Organizational Source"
        
    # General default trust for unknown domains
    return 65.0, "Unknown Domain (Exercise Caution)"

def preprocess(text):
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:512]  # BERT token limit

def get_credibility_signals(text):
    text_lower = text.lower()
    high = sum(1 for m in CREDIBILITY_MARKERS["high"] if m in text_lower)
    low  = sum(1 for m in CREDIBILITY_MARKERS["low"]  if m in text_lower)
    return high, low

def scrape_article_text(url):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        res = requests.get(url, headers=headers, timeout=5)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, "html.parser")
            # Extract paragraphs and headers
            paragraphs = [p.get_text().strip() for p in soup.find_all(["p", "h1", "h2"])]
            text = " ".join(paragraphs)
            # Clean up whitespace
            text = re.sub(r"\s+", " ", text).strip()
            if len(text) > 10:
                return text
    except Exception as e:
        print(f"Scraping failed: {e}")
    return ""

def classify_text(text):
    # Detect if input is a URL
    url_match = re.match(r"^https?://\S+", text.strip())
    original_input = text
    domain = None
    if url_match:
        url = url_match.group(0)
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        scraped = scrape_article_text(url)
        if scraped:
            text = scraped  # Classify the actual news article body!
            
    cleaned = preprocess(text)
    if not cleaned.strip():
        # Fallback to prevent BERT empty token crash
        cleaned = "news article content " + original_input
        
    pipe = get_pipeline()

    result = pipe(cleaned, candidate_labels=["real news", "fake news"])
    labels = result["labels"]
    scores = result["scores"]

    label_map = dict(zip(labels, scores))
    real_score = label_map.get("real news", 0.5)
    fake_score = label_map.get("fake news", 0.5)

    high_markers, low_markers = get_credibility_signals(text)

    # Adjust score based on linguistic signals
    if high_markers > low_markers:
        real_score = min(real_score + 0.05 * high_markers, 0.98)
    elif low_markers > high_markers:
        fake_score = min(fake_score + 0.05 * low_markers, 0.98)

    prediction = "REAL" if real_score > fake_score else "FAKE"
    confidence = round(max(real_score, fake_score) * 100, 1)

    if confidence >= 80:
        verdict = "High confidence"
    elif confidence >= 60:
        verdict = "Moderate confidence"
    else:
        verdict = "Low confidence — review manually"

    # Compute advanced linguistic metrics
    source_trust, source_bias = resolve_domain_trust(domain)
    
    # 1. Evidence (Citations / Factual Indicators)
    numbers_count = len(re.findall(r"\b\d+(?:[\.,]\d+)?%?\b", text))
    evidence_score = min(20 * high_markers + 5 * numbers_count + 15, 95)
    if not text.strip():
        evidence_score = 50
        
    # 2. Bias / Sensationalism (Writing Tone)
    exclamations = text.count("!")
    caps_words = sum(1 for w in text.split() if w.isupper() and len(w) > 2)
    sensationalism_score = min(25 * low_markers + 15 * exclamations + 10 * caps_words, 100)
    bias_score = max(0, 100 - sensationalism_score)
    
    # 3. Clickbait Score
    clickbait_phrase_count = sum(1 for p in ["you won't believe", "shocking details", "what they don't", "secret revealed", "will blow your", "will make you"] if p in text.lower())
    is_headline_question = 1 if (text.strip().endswith("?") and len(text.split()) < 15) else 0
    clickbait_score = min(40 * clickbait_phrase_count + 35 * is_headline_question + 10 * caps_words + 15 * (exclamations > 0), 100)

    # 4. Consistency & Accuracy (Derived from predictions)
    credibility_pct = round(real_score * 100, 1) if prediction == 'REAL' else round(100 - fake_score * 100, 1)
    credibility_pct = max(0.0, min(100.0, credibility_pct))
    
    consistency_score = confidence
    transparency_score = min(15 * high_markers + 30, 95)

    # Build genuine radar values
    radar_values = [
        source_trust / 100.0,         # 1. Source
        evidence_score / 100.0,       # 2. Evidence
        bias_score / 100.0,           # 3. Bias
        consistency_score / 100.0,    # 4. Consistency
        transparency_score / 100.0,   # 5. Transparency
        credibility_pct / 100.0       # 6. Accuracy
    ]
    radar_values = [round(max(0.15, min(0.95, v)), 2) for v in radar_values]

    return {
        "prediction": prediction,
        "confidence": confidence,
        "verdict": verdict,
        "real_score": round(real_score * 100, 1),
        "fake_score": round(fake_score * 100, 1),
        "credibility_signals": {
            "positive_markers": high_markers,
            "negative_markers": low_markers
        },
        "analytics": {
            "source_trust": round(source_trust, 1),
            "citation_density": round(evidence_score, 1),
            "bias_score": round(bias_score, 1),
            "clickbait_score": round(clickbait_score, 1),
            "source_bias_label": source_bias,
            "radar_values": radar_values
        }
    }
