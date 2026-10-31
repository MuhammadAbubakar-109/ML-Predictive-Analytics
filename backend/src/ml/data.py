"""Load the CSV file and split it into training and test sets."""
from pathlib import Path

import pandas as pd
import yaml
from sklearn.model_selection import train_test_split

# ROOT is the "backend" folder. All paths in config.yaml are relative to it.
ROOT = Path(__file__).resolve().parents[2]


def load_config() -> dict:
    """Read configs/config.yaml and return it as a normal Python dictionary."""
    with open(ROOT / "configs" / "config.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def raw_feature_columns(cfg: dict) -> list[str]:
    """Columns the API must receive (numeric first, then categorical)."""
    features = cfg["features"]
    return list(features["numeric"]) + list(features["categorical"])


def load_data(cfg: dict) -> pd.DataFrame:
    """Read the CSV, remove leaky columns and keep only the columns we need."""
    data_cfg = cfg["data"]
    target = data_cfg["target"]

    df = pd.read_csv(ROOT / data_cfg["path"], low_memory=False)
    df = df.rename(columns=data_cfg.get("rename", {}))
    df = df.drop(columns=data_cfg.get("drop_columns", []), errors="ignore")

    # A row without a label cannot be used for training.
    df = df.dropna(subset=[target]).copy()
    df[target] = df[target].astype(int)

    # Fail early with a clear message if a column from the config is missing.
    wanted = raw_feature_columns(cfg) + [target]
    missing = [col for col in wanted if col not in df.columns]
    if missing:
        raise KeyError(f"Columns missing from dataset: {missing}")

    return df[wanted].reset_index(drop=True)


def split(df: pd.DataFrame, cfg: dict):
    """Split into train/test. `stratify` keeps the default rate equal in both parts."""
    target = cfg["data"]["target"]
    X = df[raw_feature_columns(cfg)]
    y = df[target]
    return train_test_split(
        X,
        y,
        test_size=cfg["split"]["test_size"],
        random_state=cfg["split"]["random_state"],
        stratify=y,
    )
