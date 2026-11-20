"""Train every model in config.yaml, compare them, and save all of them.

Run with:  python -m src.ml.train      (or:  make train)
"""
import importlib
import json
import time
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import TransformedTargetRegressor
from sklearn.model_selection import GridSearchCV
from sklearn.pipeline import Pipeline

from src.ml.data import ROOT, feature_columns, load_config, load_data, split
from src.ml.evaluate import regression_metrics
from src.ml.features import build_preprocessor


def get_class(dotted_path: str):
    """Turn 'sklearn.linear_model.Ridge' (text) into the real class."""
    module_name, class_name = dotted_path.rsplit(".", 1)
    return getattr(importlib.import_module(module_name), class_name)


def build_pipeline(spec: dict, cfg: dict):
    """Create preprocessing + model, and the parameter grid to search."""
    model = get_class(spec["class"])(**spec.get("fixed", {}))
    pipeline = Pipeline([("prep", build_preprocessor(cfg)), ("model", model)])

    if cfg["training"]["log_target"]:
        # Salaries are right-skewed, so the model learns log(salary) and the
        # wrapper converts its answer back to PKR automatically.
        pipeline = TransformedTargetRegressor(
            regressor=pipeline, func=np.log1p, inverse_func=np.expm1
        )
        prefix = "regressor__model__"
    else:
        prefix = "model__"

    grid = {prefix + name: values for name, values in spec.get("params", {}).items()}
    return pipeline, grid


def train_one(name: str, spec: dict, cfg: dict, data: tuple):
    """Tune one model with GridSearchCV, test it, and return (result row, fitted model)."""
    X_train, X_test, y_train, y_test = data
    pipeline, grid = build_pipeline(spec, cfg)

    search = GridSearchCV(
        pipeline,
        grid,
        cv=cfg["training"]["cv_folds"],
        scoring="neg_root_mean_squared_error",
        n_jobs=-1,
    )
    started = time.time()
    search.fit(X_train, y_train)
    seconds = round(time.time() - started, 1)

    metrics = regression_metrics(y_test, search.predict(X_test))
    row = {
        "model": name,
        "cv_rmse": float(-search.best_score_),  # scikit-learn returns negative errors
        "best_params": {key.split("__")[-1]: val for key, val in search.best_params_.items()},
        "seconds": seconds,
        **{f"test_{key}": val for key, val in metrics.items()},
    }
    return row, search.best_estimator_


def build_options(df: pd.DataFrame, cfg: dict) -> dict:
    """Values the website needs to build its form (dropdown choices and number ranges)."""
    features = cfg["features"]
    return {
        "categorical": {
            c: sorted(df[c].dropna().unique().tolist()) for c in features["categorical"]
        },
        "numeric": {
            c: {
                "min": float(df[c].min()),
                "max": float(df[c].max()),
                "median": float(df[c].median()),
            }
            for c in features["numeric"]
        },
        "defaults_categorical": {c: df[c].mode().iloc[0] for c in features["categorical"]},
    }


def main() -> None:
    cfg = load_config()
    paths = cfg["paths"]

    # Every model needs a file path in the config.
    missing = set(cfg["models"]) - set(paths.get("models", {}))
    if missing:
        raise ValueError(f"Add paths.models entries in the config for: {sorted(missing)}")

    df = load_data(cfg)
    data = split(df, cfg)
    print(f"Rows: {len(df)} | train: {len(data[0])} | test: {len(data[1])}")
    (ROOT / "models").mkdir(exist_ok=True)

    # 1) Train all models. Each one is saved straight away, so a crash on a later
    #    model never loses the earlier ones.
    results, fitted = [], {}
    for name, spec in cfg["models"].items():
        row, model = train_one(name, spec, cfg, data)
        results.append(row)
        fitted[name] = model

        path = ROOT / paths["models"][name]
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, path, compress=3)
        print(
            f"{name:18s} CV-RMSE {row['cv_rmse']:>10,.0f} | test R2 {row['test_r2']:.4f} "
            f"| MAE {row['test_mae']:>9,.0f} | {row['seconds']}s | saved -> {paths['models'][name]}"
        )

    # 2) Best model = lowest cross-validated RMSE.
    best = min(results, key=lambda r: r["cv_rmse"])["model"]
    print(f"\nBest model: {best}")
    joblib.dump(fitted[best], ROOT / paths["model"], compress=3)

    # 3) Save the information the API and the website show.
    target = cfg["data"]["target"]
    metadata = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "best_model": best,
        "target": target,
        "features": feature_columns(cfg),
        "n_rows": len(df),
        "target_mean": float(df[target].mean()),
        "comparison": sorted(results, key=lambda r: r["cv_rmse"]),
        "options": build_options(df, cfg),
    }
    with open(ROOT / paths["metadata"], "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, default=str)

    summary = pd.DataFrame(results).drop(columns="best_params")
    summary.to_csv(ROOT / "models" / "comparison.csv", index=False)
    print(f"Saved {len(fitted)} models + {paths['model']}, {paths['metadata']}")


if __name__ == "__main__":
    main()
