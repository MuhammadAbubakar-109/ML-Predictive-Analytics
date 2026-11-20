"""Preprocessing that runs before every model."""
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def build_preprocessor(cfg: dict) -> ColumnTransformer:
    """Numbers: fill gaps with the median, then scale. Text: fill gaps, then one-hot encode."""
    numeric_steps = Pipeline([
        # add_indicator=True also adds a "was this value missing?" column
        ("impute", SimpleImputer(strategy="median", add_indicator=True)),
        ("scale", StandardScaler()),
    ])
    categorical_steps = Pipeline([
        ("impute", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    return ColumnTransformer([
        ("num", numeric_steps, cfg["features"]["numeric"]),
        ("cat", categorical_steps, cfg["features"]["categorical"]),
    ])
