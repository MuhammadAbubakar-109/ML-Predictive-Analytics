"""Shapes of the data that goes into and comes out of the API."""
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class PredictRequest(BaseModel):
    """One loan application. The first six fields are required; the rest are optional."""

    model_config = ConfigDict(extra="ignore")

    # Which model to use. Leave empty to use the best one.
    model: str | None = None

    # Required fields
    loan_amount: float = Field(gt=0)
    income: float = Field(ge=0, description="Monthly income")
    Credit_Score: int = Field(ge=300, le=900)
    age: str
    loan_type: str
    loan_purpose: str

    # Optional fields (missing values are filled in automatically)
    term: float | None = Field(default=None, gt=0, description="Loan term in months")
    dtir1: float | None = Field(default=None, ge=0, description="Debt-to-income ratio (%)")
    loan_limit: str | None = None
    Gender: str | None = None
    approv_in_adv: str | None = None
    Credit_Worthiness: str | None = None
    open_credit: str | None = None
    business_or_commercial: str | None = None
    Neg_ammortization: str | None = None
    interest_only: str | None = None
    lump_sum_payment: str | None = None
    occupancy_type: str | None = None
    total_units: str | None = None
    credit_type: str | None = None
    co_applicant_credit_type: str | None = None
    submission_of_application: str | None = None
    Region: str | None = None


class PredictResponse(BaseModel):
    prediction: Literal["Default", "No default"]
    default_probability: float
    risk_level: Literal["Low", "Medium", "High"]
    model: str
