
"""The web API. It only receives requests and calls the code in src/ml/predict.py."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from src.api.config import settings
from src.api.schemas import PredictRequest, PredictResponse
from src.ml import predict as engine


# Initialize FastAPI.
# Vercel forwards /api/... without removing the prefix.
app = FastAPI(
    title=settings.app_name,
    version="1.0.0"
)


# CORS configuration.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_metadata() -> dict:
    """Return metadata.json or a clear 503 error if models are unavailable."""
    try:
        return engine.metadata()
    except FileNotFoundError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error)
        )


def check_model_name(name: str | None) -> None:
    """Return a 400 error if the requested model does not exist."""
    available = engine.available_models()

    if name is not None and name not in available:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown model '{name}'. Available: {available}"
        )


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "models_loaded": engine.available_models()
    }


# --------------------------------------------------
# AVAILABLE MODELS
# --------------------------------------------------

@app.get("/api/models")
def list_models():
    best = get_metadata()["best_model"]

    models = [
        {
            "id": name,
            "name": engine.pretty(name),
            "is_best": name == best
        }
        for name in engine.available_models()
    ]

    return {
        "best_model": best,
        "models": models
    }


# --------------------------------------------------
# PREDICTION OPTIONS
# --------------------------------------------------

@app.get("/api/options")
def options():
    return get_metadata()["options"]


# --------------------------------------------------
# MODEL INFORMATION
# --------------------------------------------------

@app.get("/api/model-info")
def model_info():
    meta = get_metadata()

    keys = [
        "trained_at",
        "best_model",
        "target",
        "features",
        "excluded_leaky_columns",
        "n_rows",
        "default_rate",
        "comparison",
    ]

    return {
        key: meta[key]
        for key in keys
    }


# --------------------------------------------------
# SINGLE MODEL PREDICTION
# --------------------------------------------------

@app.post(
    "/api/predict",
    response_model=PredictResponse
)
def predict(request: PredictRequest):
    check_model_name(request.model)

    return engine.predict(
        request.model_dump()
    )


# --------------------------------------------------
# ALL MODEL PREDICTIONS
# --------------------------------------------------

@app.post("/api/predict-all")
def predict_all(request: PredictRequest):
    return {
        "results": engine.predict_all(
            request.model_dump()
        )
    }
