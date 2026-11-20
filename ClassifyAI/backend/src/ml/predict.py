"""Load saved models and turn one loan application into a prediction."""
import json

import joblib
import pandas as pd

from src.ml.data import ROOT, load_config, raw_feature_columns

THRESHOLD = 0.5  # probability at or above this = "Default"

# Human-friendly names shown in the website.
DISPLAY = {
    "random_forest": "Random Forest",
    "decision_tree": "Decision Tree",
    "logistic_regression": "Logistic Regression",
    "svm": "SVM (Linear, Calibrated)",
    "naive_bayes": "Naive Bayes",
}

# Small caches so we read each file from disk only once.
_config = {}
_models = {}


def get_config() -> dict:
    if not _config:
        _config.update(load_config())
    return _config


def pretty(name: str) -> str:
    return DISPLAY.get(name, name.replace("_", " ").title())


def metadata() -> dict:
    """Read models/metadata.json (created by training)."""
    path = ROOT / get_config()["paths"]["metadata"]
    if not path.exists():
        raise FileNotFoundError("metadata.json not found. Run: make train")
    return json.loads(path.read_text(encoding="utf-8"))


def available_models() -> list[str]:
    """Names of the models whose .joblib file exists on disk."""
    paths = get_config()["paths"]["models"]
    return [name for name, path in paths.items() if (ROOT / path).exists()]


def load_model(name: str):
    """Load a model once, then reuse it from the cache."""
    if name not in _models:
        path = get_config()["paths"]["models"].get(name)
        if path is None or not (ROOT / path).exists():
            raise KeyError(name)
        _models[name] = joblib.load(ROOT / path)
    return _models[name]


def risk_level(probability: float) -> str:
    if probability < 0.33:
        return "Low"
    if probability < 0.66:
        return "Medium"
    return "High"


def make_row(payload: dict) -> pd.DataFrame:
    """Build a one-row table in the column order the model was trained on.
    Fields that were not sent become None and are filled in by the imputers."""
    columns = raw_feature_columns(get_config())
    return pd.DataFrame([{col: payload.get(col) for col in columns}])


def score(name: str, row: pd.DataFrame) -> dict:
    probability = float(load_model(name).predict_proba(row)[0, 1])
    return {
        "prediction": "Default" if probability >= THRESHOLD else "No default",
        "default_probability": round(probability, 4),
        "risk_level": risk_level(probability),
        "model": name,
    }


def predict(payload: dict) -> dict:
    """Score one application with one model (the best one if none is named)."""
    payload = dict(payload)
    name = payload.pop("model", None) or metadata()["best_model"]
    return score(name, make_row(payload))


def predict_all(payload: dict) -> list[dict]:
    """Score one application with every saved model."""
    payload = dict(payload)
    payload.pop("model", None)
    row = make_row(payload)
    return [score(name, row) for name in available_models()]
