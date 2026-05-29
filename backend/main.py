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
    result = classify_text(req.text)
    return result

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

