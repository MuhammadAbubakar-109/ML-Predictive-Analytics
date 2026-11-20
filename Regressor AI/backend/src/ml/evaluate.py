"""Regression metrics, always calculated in the original PKR scale."""
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def regression_metrics(y_true, y_pred) -> dict:
    return {
        "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),  # big mistakes count more
        "mae": float(mean_absolute_error(y_true, y_pred)),  # average mistake in PKR
        "r2": float(r2_score(y_true, y_pred)),  # 1.0 = perfect, 0 = no better than the average
        "mape": float(np.mean(np.abs((y_true - y_pred) / y_true)) * 100),  # average mistake in %
    }
