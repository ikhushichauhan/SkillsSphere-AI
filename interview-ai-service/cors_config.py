import os


DEFAULT_ALLOWED_ORIGINS = (
    "http://localhost:5174",
    "http://localhost:5173",
)


def _parse_bool(value, default=False):
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _parse_origins(value):
    if not value:
        return []
    return [origin.strip() for origin in value.split(",") if origin.strip()]


def get_allowed_origins(environ=None):
    env = environ or os.environ
    configured = _parse_origins(env.get("INTERVIEW_AI_ALLOWED_ORIGINS"))
    if configured:
        return configured

    frontend_url = env.get("FRONTEND_URL")
    if frontend_url:
        return [frontend_url.strip()]

    return list(DEFAULT_ALLOWED_ORIGINS)


def get_cors_config(environ=None):
    env = environ or os.environ
    allow_origins = get_allowed_origins(env)
    allow_credentials = _parse_bool(
        env.get("INTERVIEW_AI_CORS_ALLOW_CREDENTIALS"),
        default=True,
    )

    if allow_credentials and "*" in allow_origins:
        raise ValueError(
            "INTERVIEW_AI_ALLOWED_ORIGINS cannot include '*' when credentials are enabled"
        )

    return {
        "allow_origins": allow_origins,
        "allow_credentials": allow_credentials,
        "allow_methods": ["GET", "POST"],
        "allow_headers": ["Authorization", "Content-Type"],
    }
