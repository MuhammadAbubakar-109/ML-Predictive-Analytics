"""The web API. It only receives requests and calls the code in src/ml/predict.py."""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from src.api.config import settings
from src.api.schemas import PredictAllResponse, PredictRequest, PredictResponse
from src.ml import predict as engine

app = FastAPI(title=settings.app_name, version="1.0.0")

# Allow the React website to call this API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

NOT_TRAINED = "Model not trained yet. Run: make train (or python -m src.ml.train)"


def get_metadata() -> dict:
    """Return metadata.json, or a clear 503 error if the models were not trained yet."""
    try:
        return engine.get_metadata()
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail=NOT_TRAINED)


def check_model_name(name: str | None) -> None:
    """Return a 400 error if the requested model does not exist."""
    available = engine.available_models()
    if name and name not in available:
        raise HTTPException(
            status_code=400, detail=f"Unknown model '{name}'. Available: {available}"
        )


@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": engine.available_models()}


@app.get("/models")
def list_models():
    best = get_metadata()["best_model"]
    models = [
        {"id": name, "name": engine.pretty(name), "is_best": name == best}
        for name in engine.available_models()
    ]
    return {"best_model": best, "models": models}


@app.get("/options")
def options():
    """Dropdown values and number ranges, so the website can build its form."""
    return get_metadata()["options"]


@app.get("/model-info")
def model_info():
    meta = get_metadata()
    cfg = engine.get_config()
    best = meta["comparison"][0]  # the list is sorted, best model first

    comparison = [
        {
            "model": row["model"],
            "cv_rmse": row["cv_rmse"],
            "r2": row["test_r2"],
            "mae": row["test_mae"],
            "rmse": row["test_rmse"],
            "mape": row["test_mape"],
            "seconds": row["seconds"],
            "best_params": row.get("best_params", {}),
        }
        for row in meta["comparison"]
    ]
    return {
        "best_model": meta["best_model"],
        "trained_at": meta["trained_at"],
        "n_rows": meta["n_rows"],
        "target": meta["target"],
        "target_mean": meta.get("target_mean"),
        "test_size": cfg["split"]["test_size"],
        "log_target": cfg["training"]["log_target"],
        "features": meta["features"],
        "excluded_columns": cfg["data"].get("drop_columns", []),
        "metrics": {key: best[f"test_{key}"] for key in ("rmse", "mae", "r2", "mape")},
        "comparison": comparison,
    }


@app.post("/predict", response_model=PredictResponse)
def predict_salary(request: PredictRequest):
    get_metadata()
    check_model_name(request.model)
    record = request.model_dump(exclude={"model"})
    return engine.predict(record, request.model)


@app.post("/predict-all", response_model=PredictAllResponse)
def predict_all(request: PredictRequest):
    get_metadata()
    record = request.model_dump(exclude={"model"})
    return {"results": engine.predict_all(record)}
