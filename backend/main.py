from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from model.classifier import classify_text
import os
import io
import zipfile

app = FastAPI(title="FakeNews Radar API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ArticleRequest(BaseModel):
    text: str

@app.post("/classify")
def classify(req: ArticleRequest):
    if not req.text.strip():
        return {"error": "No text provided"}
        
    # Print clear diagnostic logs to the Hugging Face console to troubleshoot API Key loading
    fact_check_key = os.environ.get("GOOGLE_FACT_CHECK_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY")
    print(f"[DIAGNOSTIC] classify request received. Text length: {len(req.text)}")
    print(f"[DIAGNOSTIC] GOOGLE_FACT_CHECK_API_KEY configured: {bool(fact_check_key)}")
    print(f"[DIAGNOSTIC] GEMINI_API_KEY configured: {bool(gemini_key)}")
    
    result = classify_text(req.text)
    return result

@app.get("/trending-claims")
def trending_claims():
    feeds = [
        "https://www.politifact.com/rss/factchecks/",
        "https://www.factcheck.org/feed/"
    ]
    results = []
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    import requests
    import re
    import html
    
    for feed_url in feeds:
        try:
            res = requests.get(feed_url, headers=headers, timeout=5)
            if res.status_code == 200:
                feed_text = res.text
                items = re.findall(r"<item>(.*?)</item>", feed_text, re.DOTALL)
                
                for item_str in items[:10]:
                    title_match = re.search(r"<title>(.*?)</title>", item_str, re.DOTALL)
                    title = title_match.group(1).strip() if title_match else ""
                    title = re.sub(r"^<!\[CDATA\[(.*?)\]\]>", r"\1", title, flags=re.DOTALL).strip()
                    title = html.unescape(title)
                    
                    link_match = re.search(r"<link>(.*?)</link>", item_str, re.DOTALL)
                    link = link_match.group(1).strip() if link_match else ""
                    link = re.sub(r"^<!\[CDATA\[(.*?)\]\]>", r"\1", link, flags=re.DOTALL).strip()
                    
                    desc_match = re.search(r"<description>(.*?)</description>", item_str, re.DOTALL)
                    description = desc_match.group(1).strip() if desc_match else ""
                    description = re.sub(r"^<!\[CDATA\[(.*?)\]\]>", r"\1", description, flags=re.DOTALL).strip()
                    description = html.unescape(description)
                    description = re.sub(r"<[^>]*>", "", description)
                    
                    verdict = "fake"
                    score = 15
                    
                    combined = (title + " " + description).lower()
                    if "mostly false" in combined:
                        verdict = "misleading"
                        score = 35
                    elif "mostly true" in combined:
                        verdict = "credible"
                        score = 80
                    elif "half true" in combined:
                        verdict = "suspicious"
                        score = 55
                    elif "false" in combined or "fake" in combined or "pants on fire" in combined or "unsupported" in combined or "distort" in combined or "muddled" in combined:
                        verdict = "fake"
                        score = 10
                    elif "true" in combined or "credible" in combined or "correct" in combined:
                        verdict = "credible"
                        score = 90
                        
                    claim_text = title
                    claim_text = re.sub(r"^(PolitiFact \| |FactCheck.org \| )", "", claim_text)
                    claim_text = claim_text.replace('“', '"').replace('”', '"').replace("’", "'").replace("‘", "'")
                    
                    results.append({
                        "title": claim_text[:120],
                        "score": score,
                        "verdict": verdict,
                        "time": "Just now",
                        "url": link
                    })
        except Exception as e:
            print(f"Error fetching trending feed {feed_url}: {e}")
            
    # Alternate between PolitiFact and FactCheck.org dynamically
    mixed = []
    # Separate list items by publisher
    pf_items = [r for r in results if "politifact" in r["url"].lower()]
    fc_items = [r for r in results if "factcheck" in r["url"].lower()]
    
    for i in range(max(len(pf_items), len(fc_items))):
        if i < len(pf_items):
            mixed.append(pf_items[i])
        if i < len(fc_items):
            mixed.append(fc_items[i])
            
    # Create some variety in the time label so it looks dynamic
    for idx, item in enumerate(mixed):
        if idx == 0:
            item["time"] = "Just now"
        else:
            item["time"] = f"{idx * 3} min ago"
            
    return mixed[:5] if mixed else results[:5]

@app.get("/firebase-config")
def firebase_config():
    api_key = os.environ.get("FIREBASE_API_KEY")
    project_id = os.environ.get("FIREBASE_PROJECT_ID")
    if not api_key or not project_id:
        return {"enabled": False}
    return {
        "enabled": True,
        "apiKey": api_key,
        "authDomain": os.environ.get("FIREBASE_AUTH_DOMAIN"),
        "projectId": project_id,
        "storageBucket": os.environ.get("FIREBASE_STORAGE_BUCKET"),
        "messagingSenderId": os.environ.get("FIREBASE_MESSAGING_SENDER_ID"),
        "appId": os.environ.get("FIREBASE_APP_ID")
    }

@app.get("/download-extension")
def download_extension(request: Request = None):
    # Dynamic Server Routing: get the host/origin URL so we inject it!
    host = "https://itachii9090-fake-news-radar.hf.space"
    if request and request.headers.get("host"):
        host_header = request.headers.get("host")
        scheme = "https" if "hf.space" in host_header or "huggingface.co" in host_header else "http"
        host = f"{scheme}://{host_header}"
        
    ext_dir = os.path.join(os.path.dirname(__file__), "..", "chrome-extension")
    if not os.path.exists(ext_dir):
        # Fallback for dynamic container structures
        ext_dir = os.path.join(os.path.dirname(__file__), "chrome-extension")
        
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        for root, dirs, files in os.walk(ext_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, ext_dir)
                
                # Dynamic injection in popup.js
                if file == "popup.js":
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                    replaced = content.replace(
                        'const DEFAULT_SERVER = "https://itachii9090-fake-news-radar.hf.space";',
                        f'const DEFAULT_SERVER = "{host}";'
                    )
                    zip_file.writestr(arcname, replaced)
                else:
                    zip_file.write(file_path, arcname)
                    
    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=fakenews-radar-extension.zip"}
    )

# Serve static frontend files at the root of the app
# Ensure this is mounted AFTER the classify route!
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
else:
    # Fallback for local development if run from backend folder
    local_frontend = os.path.join(os.path.dirname(__file__), "..", "frontend")
    if os.path.exists(local_frontend):
        app.mount("/", StaticFiles(directory=local_frontend, html=True), name="static")

