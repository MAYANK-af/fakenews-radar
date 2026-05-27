from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from model.classifier import classify_text
import os

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

