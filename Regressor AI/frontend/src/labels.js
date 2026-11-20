// Everything the interface says about the data lives here.
// Anything missing falls back to the raw column name / raw value.

export const FIELD_LABELS = {
  Job_Title: "Job title",
  Job_Family: "Job family",
  Job_Level: "Job level",
  Experience_Years: "Experience (years)",
  Industry_Experience_Years: "Industry experience (years)",
  Years_in_Current_Role: "Years in current role",
  Years_at_Company: "Years at company",
  Education_Level: "Education",
  Field_of_Study: "Field of study",
  Certifications_Count: "Certifications",
  Technical_Skills_Count: "Technical skills",
  Management_Responsibility: "Manages people",
  Team_Size_Managed: "Team size managed",
  Company_Size: "Company size",
  Employee_Count: "Company headcount",
  Company_Type: "Company type",
  Employment_Type: "Employment type",
  Working_Hours_Per_Week: "Working hours / week",
  Remote_Work_Type: "Work location",
  Performance_Rating: "Performance rating (0\u20135)",
  Job_Grade: "Job grade",
  Job_Evaluation_Score: "Job evaluation score",
  Local_Median_Salary: "Local median salary (PKR)",
  Inflation_Rate: "Inflation rate (%)",
};

export const fieldLabel = (col) =>
  FIELD_LABELS[col] ?? col.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

// The dataset's categories are already readable, so values are shown as they are.
export const valueLabel = (_col, value) => String(value);

// Required by the API. Everything else is optional and filled in automatically when blank.
export const CORE_FIELDS = ["Job_Title", "Job_Level", "Experience_Years", "Education_Level", "City"];

// Fields the backend expects as whole numbers.
export const INTEGER_FIELDS = new Set([
  "Certifications_Count", "Technical_Skills_Count", "Team_Size_Managed",
  "Employee_Count", "Working_Hours_Per_Week", "Year",
]);

// How the estimate form is organised. Fields not listed land in "Other details".
export const ESSENTIALS = ["Job_Title", "Job_Level", "Experience_Years", "Education_Level", "City"];

export const OPTIONAL_GROUPS = [
  {
    id: "role",
    title: "Role and skills",
    hint: "What the person does and how long they have done it.",
    fields: [
      "Job_Family", "Department", "Field_of_Study", "Industry_Experience_Years", "Years_in_Current_Role",
      "Years_at_Company", "Job_Grade", "Job_Evaluation_Score", "Performance_Rating",
      "Certifications_Count", "Technical_Skills_Count",
    ],
  },
  {
    id: "work",
    title: "Management and work pattern",
    hint: "Team responsibility, contract type and hours.",
    fields: ["Management_Responsibility", "Team_Size_Managed", "Employment_Type", "Remote_Work_Type", "Working_Hours_Per_Week"],
  },
  {
    id: "company",
    title: "Company",
    hint: "The employer and where it operates.",
    fields: ["Industry", "Company_Size", "Company_Type", "Employee_Count", "Region"],
  },
  {
    id: "market",
    title: "Market context",
    hint: "Local pay levels and timing.",
    fields: ["Local_Median_Salary", "Inflation_Rate", "Year"],
  },
];

// Short hints shown under some fields.
export const FIELD_HINTS = {
  Experience_Years: "Total years of work experience.",
  Performance_Rating: "From 0 to 5.",
  Local_Median_Salary: "Typical monthly salary in the area, in PKR.",
  Job_Grade: "Internal pay grade of the role.",
  Job_Evaluation_Score: "Points score for how demanding the role is.",
  Employee_Count: "Number of people the company employs.",
  Team_Size_Managed: "People who report to this person.",
};

export const MODEL_NOTES = {
  linear_regression: "Adds up weighted inputs. Simple, fast and easy to explain.",
  ridge: "Linear regression with a penalty that keeps the weights modest.",
  lasso: "Linear regression that can switch unhelpful inputs off completely.",
  decision_tree: "A single tree of yes/no questions. Easy to read, easy to overfit.",
  random_forest: "Many decision trees averaged together. Flexible, harder to explain.",
  svr: "Fits a smooth curve inside a tolerance band. Can pull extreme salaries toward the middle.",
};

// One colour per model so charts stay consistent across pages (see styles/tokens.css).
export const MODEL_COLORS = {
  linear_regression: "var(--m3)",
  ridge: "var(--m1)",
  lasso: "var(--m2)",
  decision_tree: "var(--m5)",
  random_forest: "var(--m6)",
  svr: "var(--m4)",
};
export const modelColor = (id) => MODEL_COLORS[id] ?? "var(--accent)";

// Metric keys match the rows returned by GET /model-info. "min" means lower is better.
export const METRICS = [
  { key: "r2", short: "R\u00B2", title: "R\u00B2", better: "max", unit: "", help: "The share of salary differences the model explains. 1.0 is perfect, 0 is no better than always guessing the average." },
  { key: "mae", short: "MAE", title: "Mean absolute error", better: "min", unit: "PKR", help: "The average size of a mistake, in PKR per month. This is the \u201Ctypical range\u201D shown around each estimate." },
  { key: "rmse", short: "RMSE", title: "Root mean squared error", better: "min", unit: "PKR", help: "Like MAE but large mistakes count extra, so it is always at least as big as MAE." },
  { key: "mape", short: "MAPE", title: "Mean absolute percentage error", better: "min", unit: "%", help: "The average mistake as a percentage of the true salary." },
  { key: "cv_rmse", short: "CV RMSE", title: "Cross-validated RMSE", better: "min", unit: "PKR", help: "RMSE measured on the training data using cross-validation. The best model is the one with the lowest value." },
];

export const PRESETS = {
  entry: {
    label: "Entry-level example",
    values: {
      Job_Title: "Receptionist", Job_Level: "Junior", Experience_Years: 1,
      Education_Level: "Intermediate", City: "Multan",
      Management_Responsibility: "No", Team_Size_Managed: 0,
    },
  },
  senior: {
    label: "Senior example",
    values: {
      Job_Title: "Software Engineer", Job_Level: "Director", Experience_Years: 18,
      Education_Level: "Master's", City: "Karachi", Company_Type: "Multinational",
      Management_Responsibility: "Yes", Team_Size_Managed: 40,
    },
  },
};
