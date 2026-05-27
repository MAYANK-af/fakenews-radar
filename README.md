---
title: Fake News Radar
emoji: 📡
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# 📡 FakeNews Radar

A real-time misinformation detection web app. Paste any news article, URL, or headline and it analyzes its credibility, linguistic bias, and emotional sensation triggers.

Powered by a Zero-Shot classification pipeline inside a compliance-grade Docker Space on Hugging Face.

## 🎯 Features
- Classifies news articles as **REAL** or **FAKE** with a confidence score.
- Dynamic **trigonometric sweep radar canvas animation**.
- Dynamic **6-axis spider/radar credibility chart** visualizing Source Trust, Evidence, Bias, Consistency, Transparency, and Accuracy.
- **BeautifulSoup4-based HTML scraping**: Enter a link (e.g. from BBC) and the backend will automatically parse the article body and analyze it.
- Full scan history stored locally with verdict filters.
- Responsive mobile adaptation.
