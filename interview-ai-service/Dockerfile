# interview-ai-service/Dockerfile — Production Python AI service
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (ffmpeg is required for audio processing)
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Copy the service files
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download the required spaCy model
RUN python -m spacy download en_core_web_sm

# Hugging Face Spaces mandates port 7860
EXPOSE 7860

# Run the service via uvicorn on port 7860
CMD ["sh", "-c", "python -m uvicorn main:app --host 0.0.0.0 --port 7860"]
