import pytest
from fastapi.testclient import TestClient

from src.api.main import app
from src.ml.data import ROOT

# These tests need the trained models, so they are skipped until you run `make train`.
pytestmark = pytest.mark.skipif(
    not (ROOT / "models" / "model.joblib").exists(), reason="run `make train` first"
)
client = TestClient(app)

# Only the six required fields.
PAYLOAD = {
    "loan_amount": 300000, "income": 6000, "Credit_Score": 720,
    "age": "35-44", "loan_type": "type1", "loan_purpose": "p3",
}


def test_health():
    body = client.get("/health").json()
    assert body["status"] == "ok"
    assert len(body["models_loaded"]) >= 1


def test_models_list_contains_one_best_model():
    body = client.get("/models").json()
    assert sum(m["is_best"] for m in body["models"]) == 1


def test_predict_response_shape():
    response = client.post("/predict", json=PAYLOAD)
    assert response.status_code == 200
    body = response.json()
    assert 0 <= body["default_probability"] <= 1
    assert body["prediction"] in {"Default", "No default"}
    assert body["risk_level"] in {"Low", "Medium", "High"}


def test_accepts_optional_fields_and_model_choice():
    models = client.get("/models").json()["models"]
    extra = {"dtir1": 40, "Region": "North", "term": 360, "model": models[0]["id"]}
    response = client.post("/predict", json={**PAYLOAD, **extra})
    assert response.status_code == 200
    assert response.json()["model"] == models[0]["id"]


def test_predict_all_returns_one_result_per_model():
    results = client.post("/predict-all", json=PAYLOAD).json()["results"]
    assert len(results) == len(client.get("/models").json()["models"])


def test_unknown_model_is_rejected():
    response = client.post("/predict", json={**PAYLOAD, "model": "does_not_exist"})
    assert response.status_code == 400


def test_validation_errors():
    assert client.post("/predict", json={"loan_amount": 1}).status_code == 422
    assert client.post("/predict", json={**PAYLOAD, "Credit_Score": 100}).status_code == 422


def test_options_and_model_info():
    assert "loan_type" in client.get("/options").json()["categorical"]
    info = client.get("/model-info").json()
    assert info["comparison"][0]["test_roc_auc"] > 0.5
    assert "rate_of_interest" in info["excluded_leaky_columns"]
