"""Train every model in config.yaml, compare them and save the results.

Run with:  python -m src.ml.train      (or:  make train)
"""
import importlib
import json
import time
from datetime import datetime, timezone

import joblib
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import GridSearchCV, StratifiedKFold
from sklearn.pipeline import Pipeline

from src.ml.data import ROOT, load_config, load_data, raw_feature_columns, split
from src.ml.evaluate import classification_metrics
from src.ml.features import build_preprocessor


def get_class(dotted_path: str):
    """Turn 'sklearn.tree.DecisionTreeClassifier' (text) into the real class."""
    module_name, class_name = dotted_path.rsplit(".", 1)
    return getattr(importlib.import_module(module_name), class_name)


def build_pipeline(spec: dict, cfg: dict):
    """Create preprocessing + model, and the parameter grid to search."""
    model = get_class(spec["class"])(**spec.get("fixed", {}))
    prefix = "model__"

    if spec.get("calibrate"):
        # LinearSVC has no predict_proba, so we wrap it to get probabilities.
        model = CalibratedClassifierCV(model, cv=3)
        prefix = "model__estimator__"

    pipeline = Pipeline([("prep", build_preprocessor(cfg)), ("model", model)])
    grid = {prefix + name: values for name, values in spec.get("params", {}).items()}
    return pipeline, grid


def train_one(name: str, spec: dict, cfg: dict, data: tuple, cv) -> tuple[dict, object]:
    """Tune one model with GridSearchCV, test it, and return (result row, fitted model)."""
    X_train, X_test, y_train, y_test = data
    pipeline, grid = build_pipeline(spec, cfg)

    search = GridSearchCV(pipeline, grid, cv=cv, scoring=cfg["training"]["scoring"], n_jobs=-1)
    started = time.time()
    search.fit(X_train, y_train)
    seconds = round(time.time() - started, 1)

    metrics = classification_metrics(
        y_test, search.predict(X_test), search.predict_proba(X_test)[:, 1]
    )
    row = {
        "model": name,
        "cv_score": float(search.best_score_),
        "best_params": {key.split("__")[-1]: val for key, val in search.best_params_.items()},
        "seconds": seconds,
        **{f"test_{key}": val for key, val in metrics.items()},
    }
    print(
        f"{name:20s} CV-AUC {row['cv_score']:.4f} | acc {metrics['accuracy']:.3f} "
        f"| prec {metrics['precision']:.3f} | rec {metrics['recall']:.3f} "
        f"| F1 {metrics['f1']:.3f} | AUC {metrics['roc_auc']:.4f} | {seconds}s"
    )
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
    df = load_data(cfg)
    data = split(df, cfg)
    X_train, X_test, y_train, _ = data
    print(
        f"Rows: {len(df):,} | train: {len(X_train):,} | test: {len(X_test):,} "
        f"| default rate: {y_train.mean():.1%}"
    )

    cv = StratifiedKFold(
        cfg["training"]["cv_folds"], shuffle=True, random_state=cfg["split"]["random_state"]
    )

    # 1) Train all models.
    results, fitted = [], {}
    for name, spec in cfg["models"].items():
        row, model = train_one(name, spec, cfg, data, cv)
        results.append(row)
        fitted[name] = model

    # 2) Best model = highest cross-validated score.
    best = max(results, key=lambda r: r["cv_score"])["model"]
    print(f"\nBest model: {best}")

    # 3) Save every model, plus a copy of the best one as models/model.joblib.
    (ROOT / "models").mkdir(exist_ok=True)
    for name, model in fitted.items():
        joblib.dump(model, ROOT / cfg["paths"]["models"][name])
    joblib.dump(fitted[best], ROOT / cfg["paths"]["model"])

    # 4) Save the information the API and the website show.
    target = cfg["data"]["target"]
    metadata = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "best_model": best,
        "target": target,
        "features": raw_feature_columns(cfg),
        "excluded_leaky_columns": cfg["data"]["drop_columns"],
        "n_rows": len(df),
        "default_rate": float(df[target].mean()),
        "comparison": sorted(results, key=lambda r: -r["cv_score"]),
        "options": build_options(df, cfg),
    }
    with open(ROOT / cfg["paths"]["metadata"], "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, default=str)

    summary = pd.DataFrame(results).drop(columns=["best_params", "test_confusion_matrix"])
    summary.to_csv(ROOT / "models" / "comparison.csv", index=False)
    print(f"Saved models and metadata to: {ROOT / 'models'}")


if __name__ == "__main__":
    main()
