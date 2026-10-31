"""Feature engineering and preprocessing (the steps that run before every model)."""
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, OneHotEncoder, StandardScaler


def add_engineered(X: pd.DataFrame) -> pd.DataFrame:
    """Add one new column: loan_to_income = loan_amount / income."""
    X = X.copy()
    income = pd.to_numeric(X["income"], errors="coerce")
    loan = pd.to_numeric(X["loan_amount"], errors="coerce")

    # Income of 0 (or missing) would divide by zero, so we leave it empty (NaN).
    # The median imputer below fills NaN values later.
    ratio = loan / income.where(income > 0)
    X["loan_to_income"] = ratio.replace([np.inf, -np.inf], np.nan)
    return X


def build_preprocessor(cfg: dict) -> Pipeline:
    """Build: engineer features -> fill missing values -> scale numbers / one-hot text."""
    features = cfg["features"]
    use_indicators = bool(cfg["training"].get("missing_indicators", False))
    numeric_cols = list(features["numeric"]) + list(features.get("engineered", []))

    # Numbers: fill gaps with the median, then scale to a similar range.
    numeric_steps = Pipeline([
        ("impute", SimpleImputer(strategy="median", add_indicator=use_indicators)),
        ("scale", StandardScaler()),
    ])

    # Categories: fill gaps with the most common value, then one-hot encode.
    # sparse_output=False because GaussianNB cannot read sparse data.
    categorical_steps = Pipeline([
        ("impute", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])

    columns = ColumnTransformer([
        ("num", numeric_steps, numeric_cols),
        ("cat", categorical_steps, list(features["categorical"])),
    ])

    return Pipeline([
        ("engineer", FunctionTransformer(add_engineered, validate=False)),
        ("columns", columns),
    ])
