# Use a lightweight python image
FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set up user with UID 1000 for Hugging Face Spaces security compliance
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Copy requirements and install
COPY --chown=user backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir beautifulsoup4

# Pre-download and cache Hugging Face classification model weights
# This ensures Hugging Face Space starts instantly and behaves reliably at runtime
RUN python -c "from transformers import pipeline; pipeline('zero-shot-classification', model='facebook/bart-large-mnli')"

# Copy backend files
COPY --chown=user backend/main.py main.py
COPY --chown=user backend/model model/

# Copy frontend static files to a 'static' directory inside the container
COPY --chown=user frontend/index.html static/index.html
COPY --chown=user frontend/script.js static/script.js

# Copy chrome-extension folder for zip download bundler
COPY --chown=user chrome-extension chrome-extension/

# Expose port 7860 for Hugging Face Spaces
EXPOSE 7860

# Command to run uvicorn on port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
