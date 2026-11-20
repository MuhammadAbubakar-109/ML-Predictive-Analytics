"""Load the config and the CSV file, check it, and split it into train/test sets."""
from pathlib import Path

import numpy as np
import pandas as pd
import yaml
from sklearn.model_selection import train_test_split

# ROOT is the "backend" folder. All paths in config.yaml are relative to it.
ROOT = Path(__file__).resolve().parents[2]


def load_config(path: str | Path | None = None) -> dict:
    """Read configs/config.yaml and return it as a normal Python dictionary."""
    path = path or ROOT / "configs" / "config.yaml"
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)


def feature_columns(cfg: dict) -> list[str]:
    """Every input column: numeric first, then categorical."""
    return cfg["features"]["numeric"] + cfg["features"]["categorical"]


def load_data(cfg: dict) -> pd.DataFrame:
    df = pd.read_csv(ROOT / cfg["data"]["path"])
    return validate(df, cfg)


def validate(df: pd.DataFrame, cfg: dict) -> pd.DataFrame:
    """Stop early if a column is missing, and remove rows we cannot learn from."""
    target = cfg["data"]["target"]
    required = feature_columns(cfg) + [target]
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(f"Missing columns: {missing}")

    df = df.drop_duplicates().dropna(subset=[target])
    df = df[df[target] > 0]  # a salary must be above zero
    return df.reset_index(drop=True)


def clean_categories(X: pd.DataFrame, cfg: dict) -> pd.DataFrame:
    """Store text columns as plain objects with np.nan for gaps.
    This keeps the sklearn imputers working the same on every pandas version."""
    for col in cfg["features"]["categorical"]:
        X[col] = X[col].astype(object).where(X[col].notna(), np.nan)
    return X


def split(df: pd.DataFrame, cfg: dict):
    X = clean_categories(df[feature_columns(cfg)].copy(), cfg)
    y = df[cfg["data"]["target"]]
    return train_test_split(
        X,
        y,
        test_size=cfg["split"]["test_size"],
        random_state=cfg["split"]["random_state"],
    )
