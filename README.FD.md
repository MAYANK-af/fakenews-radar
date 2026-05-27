# 📡 FakeNews Radar

A real-time misinformation detection web app. Paste any news article or headline and it tells you how credible it is — powered by a fine-tuned BERT model trained on 20,000+ real and fake news samples.

---

## 🎯 What it does

- Classifies news articles as **Real** or **Fake** with a confidence score
- Cross-references key claims against verified sources
- Processes and returns results in **under 2 seconds**
- Clean web interface — paste text, get instant results

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Python 3.10 |
| ML Model | BERT (fine-tuned on LIAR + FakeNewsNet) |
| Backend | FastAPI |
| Frontend | React |
| Model Training | HuggingFace Transformers, PyTorch |

---

## 📁 Project Structure

```
fakenews-radar/
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── model/
│   │   ├── classifier.py    # BERT inference pipeline
│   │   └── preprocess.py    # Text cleaning & tokenisation
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React component
│   │   └── components/
│   │       └── ResultCard.jsx
│   └── package.json
└── README.md
```

---

## ⚙️ How to Run Locally

**1. Clone the repo**
```bash
git clone https://github.com/mayankyadav/fakenews-radar.git
cd fakenews-radar
```

**2. Start the backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

**3. Start the frontend**
```bash
cd frontend
npm install
npm start
```

**4. Open in browser**
```
http://localhost:3000
```

---

## 🤖 Model Details

- **Base model:** `bert-base-uncased`
- **Training data:** LIAR dataset + FakeNewsNet corpus (~20,000 samples)
- **Test accuracy:** 87% on held-out test set
- **Training:** Fine-tuned for 3 epochs on Google Colab (T4 GPU)

---

## 📊 How it works (simple version)

```
User pastes article text
        ↓
Text cleaned and tokenised
        ↓
BERT model scores the text (Real vs Fake probability)
        ↓
Credibility score shown with explanation
        ↓
Key claims highlighted as verified / unverified
```

---

## 🔮 Future Plans

- [ ] Browser extension for real-time checking while browsing
- [ ] Support for regional Indian news sources
- [ ] Multilingual model (Hindi, Tamil)

---

## 👤 Author

**Mayank Yadav**  
B.Tech Computer Science — Manipal University Jaipur  
my1220301@gmail.com
