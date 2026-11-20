"""Load saved models and turn one employee profile into a salary estimate."""
import json

import joblib
import numpy as np
import pandas as pd

from src.ml.data import ROOT, feature_columns, load_config

# Human-friendly names shown in the website.
DISPLAY = {
    "linear_regression": "Linear Regression",
    "ridge": "Ridge",
    "lasso": "Lasso",
    "decision_tree": "Decision Tree",
    "random_forest": "Random Forest",
    "svr": "SVR",
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


def get_metadata() -> dict:
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


def make_row(record: dict) -> pd.DataFrame:
    """Build a one-row table in the column order the models were trained on.
    Fields that were not sent become empty and are filled in by the imputers."""
    cfg = get_config()
    row = pd.DataFrame([{col: record.get(col) for col in feature_columns(cfg)}])
    for col in cfg["features"]["numeric"]:
        row[col] = pd.to_numeric(row[col], errors="coerce")
    for col in cfg["features"]["categorical"]:
        row[col] = row[col].astype(object).where(row[col].notna(), np.nan)
    return row


def typical_error(name: str) -> float:
    """The model's average mistake (MAE) on the test set. Used as the +/- range."""
    for row in get_metadata()["comparison"]:
        if row["model"] == name:
            return float(row["test_mae"])
    return 0.0


def monthly_salary(name: str, row: pd.DataFrame) -> float:
    """Ask one model for a salary. A salary can never be negative."""
    return max(float(load_model(name).predict(row)[0]), 0.0)


def predict(record: dict, model_name: str | None = None) -> dict:
    """Estimate the monthly salary (PKR) with one model (the best one if none is named)."""
    name = model_name or get_metadata()["best_model"]
    monthly = monthly_salary(name, make_row(record))
    error = typical_error(name)
    return {
        "model": name,
        "monthly_salary_pkr": round(monthly),
        "annual_salary_pkr": round(monthly * 12),
        "range_low_pkr": round(max(monthly - error, 0)),
        "range_high_pkr": round(monthly + error),
    }


def predict_all(record: dict) -> list[dict]:
    """Estimate the salary with every saved model."""
    row = make_row(record)
    results = []
    for name in available_models():
        monthly = monthly_salary(name, row)
        results.append({
            "model": name,
            "monthly_salary_pkr": round(monthly),
            "annual_salary_pkr": round(monthly * 12),
        })
    return results
