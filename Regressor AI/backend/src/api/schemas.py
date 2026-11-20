"""Shapes of the data that goes into and comes out of the API."""
from pydantic import BaseModel, ConfigDict, Field


class PredictRequest(BaseModel):
    """One employee profile. The five core fields are required; the rest are optional
    and are filled in automatically when missing."""

    model_config = ConfigDict(extra="ignore", protected_namespaces=())

    # Which saved model to use. Leave empty to use the best one.
    model: str | None = None

    # Core fields (required)
    Job_Title: str
    Job_Level: str
    Experience_Years: float = Field(ge=0, le=60)
    Education_Level: str
    City: str

    # Optional text fields
    Job_Family: str | None = None
    Department: str | None = None
    Industry: str | None = None
    Field_of_Study: str | None = None
    Management_Responsibility: str | None = None
    Company_Size: str | None = None
    Company_Type: str | None = None
    Region: str | None = None
    Employment_Type: str | None = None
    Remote_Work_Type: str | None = None

    # Optional number fields
    Industry_Experience_Years: float | None = None
    Years_in_Current_Role: float | None = None
    Years_at_Company: float | None = None
    Certifications_Count: int | None = None
    Technical_Skills_Count: int | None = None
    Team_Size_Managed: int | None = None
    Employee_Count: int | None = None
    Working_Hours_Per_Week: int | None = None
    Performance_Rating: float | None = Field(default=None, ge=0, le=5)
    Job_Grade: float | None = None
    Job_Evaluation_Score: float | None = None
    Local_Median_Salary: float | None = None
    Inflation_Rate: float | None = None
    Year: int | None = None


class PredictResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    model: str
    monthly_salary_pkr: float
    annual_salary_pkr: float
    range_low_pkr: float
    range_high_pkr: float


class ModelPrediction(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    model: str
    monthly_salary_pkr: float
    annual_salary_pkr: float


class PredictAllResponse(BaseModel):
    results: list[ModelPrediction]
