import pytest

from src.ml.data import feature_columns, load_config, load_data, split
from src.ml.evaluate import regression_metrics
from src.ml.features import build_preprocessor


@pytest.fixture(scope="module")
def cfg():
    return load_config()


def test_data_loads_and_has_features(cfg):
    df = load_data(cfg)
    assert len(df) > 1000
    assert set(feature_columns(cfg)) <= set(df.columns)
    assert (df[cfg["data"]["target"]] > 0).all()


def test_preprocessor_outputs_no_nans(cfg):
    X_train, _, _, _ = split(load_data(cfg), cfg)
    out = build_preprocessor(cfg).fit_transform(X_train)
    assert out.shape[0] == len(X_train)
    assert not (out != out).any()  # no NaN


def test_metrics_perfect_prediction():
    import numpy as np
    y = np.array([100.0, 200.0, 300.0])
    m = regression_metrics(y, y)
    assert m["rmse"] == 0 and m["r2"] == 1
