from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from cors_config import get_cors_config
from routers.transcription import router as transcription_router
from routers.evaluation import router as evaluation_router


app = FastAPI(
    title="Interview AI Service",
    description="Python AI microservice for the SkillsSphere AI Interview Engine. Handles speech-to-text transcription and answer evaluation.",
    version="1.0.0",
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response

# Allow only configured trusted browser origins.
app.add_middleware(
    CORSMiddleware,
    **get_cors_config(),
)


@app.get("/health")
async def health_check():
    """Health check endpoint for the Node.js backend to verify service availability."""
    return {"status": "ok", "service": "interview-ai-service"}


@app.get("/api/health")
async def api_health_check():
    """Health check endpoint under the same /api prefix used by service routers."""
    return {"status": "ok", "service": "interview-ai-service", "prefix": "/api"}


@app.middleware("http")
async def log_404_path(request: Request, call_next):
    response = await call_next(request)
    if response.status_code == 404:
        # Helpful when Node calls the wrong path (e.g. /evaluate vs /api/evaluate)
        print(f"[interview-ai-service] 404 Not Found: {request.method} {request.url}")
    return response


@app.get("/api/routes")
async def routes():
    """Return the expected public routes for Node clients.

    This helps prevent route prefix mismatches like:
    - calling /evaluate instead of /api/evaluate
    - calling /transcribe instead of /api/transcribe
    """
    return {
        "service": "interview-ai-service",
        "routes": {
            "health": "/api/health",
            "evaluate": "/api/evaluate",
            "transcribe": "/api/transcribe",
            "transcription_ws": "/api/ws/transcribe",
        }
    }


from routers.interview import router as interview_router

# Register routers
app.include_router(transcription_router, prefix="/api")
app.include_router(evaluation_router, prefix="/api")
app.include_router(interview_router, prefix="/api")

