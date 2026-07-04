# interview-ai-service/Dockerfile — Production Python AI service
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (ffmpeg is required for audio processing)
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Copy the entire repository (context is root)
COPY . .

# Install Python dependencies from the service folder
RUN pip install --no-cache-dir -r interview-ai-service/requirements.txt

# Download the required spaCy model
RUN python -m spacy download en_core_web_sm

# Set working directory to the service folder so uvicorn finds main:app
WORKDIR /app/interview-ai-service

# Render assigns PORT dynamically; use shell form to expand $PORT
EXPOSE ${PORT:-8000}

# Run the service via uvicorn with dynamic PORT
CMD ["sh", "-c", "python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
