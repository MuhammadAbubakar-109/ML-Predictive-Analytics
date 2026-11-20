import pytest
from fastapi.testclient import TestClient

from src.api.main import app
from src.ml.data import ROOT

pytestmark = pytest.mark.skipif(
    not (ROOT / "models" / "model.joblib").exists(), reason="run `make train` first"
)
client = TestClient(app)

PAYLOAD = {
    "Job_Title": "Network Engineer", "Job_Level": "Senior", "Experience_Years": 8,
    "Education_Level": "Bachelor's", "City": "Lahore",
}


def test_health_lists_models():
    body = client.get("/health").json()
    assert body["status"] == "ok" and len(body["models_loaded"]) >= 1


def test_models_endpoint_marks_best():
    body = client.get("/models").json()
    assert sum(m["is_best"] for m in body["models"]) == 1
    assert body["best_model"] in {m["id"] for m in body["models"]}


def test_predict_default_model():
    r = client.post("/predict", json=PAYLOAD)
    assert r.status_code == 200
    body = r.json()
    assert body["monthly_salary_pkr"] > 0
    assert body["annual_salary_pkr"] == pytest.approx(body["monthly_salary_pkr"] * 12, rel=1e-3)
    assert body["range_low_pkr"] <= body["monthly_salary_pkr"] <= body["range_high_pkr"]


def test_predict_each_model():
    for m in client.get("/models").json()["models"]:
        r = client.post("/predict", json={**PAYLOAD, "model": m["id"]})
        assert r.status_code == 200 and r.json()["model"] == m["id"]


def test_unknown_model_rejected():
    assert client.post("/predict", json={**PAYLOAD, "model": "nope"}).status_code == 400


def test_predict_all_returns_every_model():
    models = client.get("/models").json()["models"]
    results = client.post("/predict-all", json=PAYLOAD).json()["results"]
    assert {r["model"] for r in results} == {m["id"] for m in models}
    assert all(r["monthly_salary_pkr"] > 0 for r in results)


def test_senior_earns_more_than_junior():
    junior_in = {**PAYLOAD, "Job_Level": "Junior", "Experience_Years": 1}
    senior_in = {**PAYLOAD, "Job_Level": "Director", "Experience_Years": 15}
    junior = client.post("/predict", json=junior_in).json()
    senior = client.post("/predict", json=senior_in).json()
    assert senior["monthly_salary_pkr"] > junior["monthly_salary_pkr"]


def test_validation_error_on_missing_field():
    assert client.post("/predict", json={"Job_Title": "x"}).status_code == 422


def test_options_and_model_info():
    assert "Job_Title" in client.get("/options").json()["categorical"]
    info = client.get("/model-info").json()
    assert info["metrics"]["r2"] > 0.5 and len(info["comparison"]) >= 1
    assert info["target_mean"] > 0 and 0 < info["test_size"] < 1
    assert "Employee_ID" in info["excluded_columns"]
    assert isinstance(info["comparison"][0]["best_params"], dict)


def test_optional_fields_are_accepted():
    extra = {"Performance_Rating": 4.5, "Certifications_Count": 3, "Company_Type": "Multinational"}
    assert client.post("/predict", json={**PAYLOAD, **extra}).status_code == 200


def test_out_of_range_values_are_rejected():
    assert client.post("/predict", json={**PAYLOAD, "Experience_Years": 99}).status_code == 422
    assert client.post("/predict", json={**PAYLOAD, "Performance_Rating": 9}).status_code == 422
