# interview-ai-service/Dockerfile — Production Python AI service
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (ffmpeg is required for audio processing)
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Download the required spaCy model
RUN python -m spacy download en_core_web_sm

# Copy the rest of the application
COPY . .

# Railway assigns PORT dynamically; use shell form to expand $PORT
EXPOSE ${PORT:-8000}

# Run the service via uvicorn with dynamic PORT
CMD ["sh", "-c", "python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
