import numpy as np
import pytest

from src.ml.data import ROOT, load_config, load_data, raw_feature_columns, split
from src.ml.evaluate import classification_metrics
from src.ml.features import add_engineered, build_preprocessor

pytestmark = pytest.mark.skipif(
    not (ROOT / "data" / "raw" / "Loan_Default.csv").exists(),
    reason="put Loan_Default.csv in data/raw/ first",
)


@pytest.fixture(scope="module")
def cfg():
    return load_config()


@pytest.fixture(scope="module")
def df(cfg):
    return load_data(cfg)


def test_data_loads_with_binary_target(cfg, df):
    assert len(df) > 10_000
    assert set(df[cfg["data"]["target"]].unique()) == {0, 1}
    assert set(raw_feature_columns(cfg)) <= set(df.columns)


def test_no_leaky_columns_used_as_features(cfg):
    assert not set(cfg["data"]["drop_columns"]) & set(raw_feature_columns(cfg))


def test_split_is_stratified(cfg, df):
    _, _, y_train, y_test = split(df, cfg)
    assert abs(y_train.mean() - y_test.mean()) < 0.01


def test_loan_to_income_handles_zero_income(cfg, df):
    X_train, *_ = split(df, cfg)
    X = X_train.head(3).copy()
    X["income"] = [0.0, 1000.0, np.nan]
    X["loan_amount"] = 5000.0
    result = add_engineered(X)["loan_to_income"].tolist()
    assert np.isnan(result[0]) and result[1] == 5.0 and np.isnan(result[2])


def test_preprocessor_outputs_no_nans(cfg, df):
    X_train, *_ = split(df.sample(5000, random_state=0), cfg)
    out = build_preprocessor(cfg).fit_transform(X_train)
    assert out.shape[0] == len(X_train) and not np.isnan(out).any()


def test_metrics_perfect_prediction():
    y = np.array([0, 1, 1, 0])
    m = classification_metrics(y, y, y.astype(float))
    assert m["accuracy"] == 1 and m["f1"] == 1 and m["roc_auc"] == 1
