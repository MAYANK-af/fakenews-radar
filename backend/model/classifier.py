from transformers import pipeline
import re
import requests
from bs4 import BeautifulSoup

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
    if url_match:
        url = url_match.group(0)
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

    return {
        "prediction": prediction,
        "confidence": confidence,
        "verdict": verdict,
        "real_score": round(real_score * 100, 1),
        "fake_score": round(fake_score * 100, 1),
        "credibility_signals": {
            "positive_markers": high_markers,
            "negative_markers": low_markers
        }
    }
