// Everything the interface says about the data lives here.
// Anything missing falls back to the raw column name / raw value.

export const FIELD_LABELS = {
  loan_amount: "Loan amount",
  term: "Term (months)",
  income: "Monthly income",
  dtir1: "Debt-to-income ratio (%)",
  Credit_Score: "Credit score",
  approv_in_adv: "Pre-approved",
  business_or_commercial: "Business / commercial",
  Neg_ammortization: "Negative amortization",
  interest_only: "Interest-only",
  lump_sum_payment: "Lump-sum payment",
  co_applicant_credit_type: "Co-applicant credit bureau",
  credit_type: "Credit bureau",
  submission_of_application: "Application submitted to institution",
  Credit_Worthiness: "Credit worthiness class",
  loan_limit: "Loan limit type",
  open_credit: "Open credit",
  occupancy_type: "Occupancy",
  total_units: "Units in property",
  loan_type: "Loan type",
  loan_purpose: "Loan purpose",
  age: "Applicant age",
  Gender: "Gender",
  Region: "Region",
};

export const VALUE_LABELS = {
  loan_limit: { cf: "Conforming", ncf: "Non-conforming" },
  approv_in_adv: { pre: "Pre-approved", nopre: "Not pre-approved" },
  open_credit: { opc: "Open credit", nopc: "No open credit" },
  business_or_commercial: { "b/c": "Business / commercial", "nob/c": "Not business / commercial" },
  Neg_ammortization: { neg_amm: "Negative amortization", not_neg: "No negative amortization" },
  interest_only: { int_only: "Interest-only", not_int: "Not interest-only" },
  lump_sum_payment: { lpsm: "Lump-sum payment", not_lpsm: "No lump-sum payment" },
  occupancy_type: { pr: "Primary residence", sr: "Secondary residence", ir: "Investment property" },
  total_units: { "1U": "1 unit", "2U": "2 units", "3U": "3 units", "4U": "4 units" },
  credit_type: { CIB: "CIB", CRIF: "CRIF", EQUI: "Equifax", EXP: "Experian" },
  co_applicant_credit_type: { CIB: "CIB", EXP: "Experian" },
  submission_of_application: { to_inst: "Submitted to institution", not_inst: "Not submitted" },
  loan_type: { type1: "Type 1", type2: "Type 2", type3: "Type 3" },
  loan_purpose: { p1: "Purpose 1", p2: "Purpose 2", p3: "Purpose 3", p4: "Purpose 4" },
  Credit_Worthiness: { l1: "Class 1", l2: "Class 2" },
  Region: { central: "Central", North: "North", "North-East": "North-east", south: "South" },
};

export const fieldLabel = (col) =>
  FIELD_LABELS[col] ?? col.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

export const valueLabel = (col, value) => VALUE_LABELS[col]?.[value] ?? String(value);

// How the assessment form is organised. Fields not listed here land in "Other details".
export const FIELD_GROUPS = [
  {
    id: "applicant",
    title: "Applicant",
    hint: "Who is applying and how their credit looks.",
    fields: ["age", "Gender", "income", "Credit_Score", "credit_type", "co_applicant_credit_type", "Credit_Worthiness"],
  },
  {
    id: "loan",
    title: "Loan",
    hint: "What is being borrowed and how it was requested.",
    fields: ["loan_amount", "term", "dtir1", "loan_type", "loan_purpose", "loan_limit", "approv_in_adv", "submission_of_application"],
  },
  {
    id: "structure",
    title: "Repayment structure",
    hint: "Special features of how the loan is repaid.",
    fields: ["Neg_ammortization", "interest_only", "lump_sum_payment", "open_credit", "business_or_commercial"],
  },
  {
    id: "property",
    title: "Property and region",
    hint: "Where the property is and how it will be used.",
    fields: ["occupancy_type", "total_units", "Region"],
  },
];

// Short hints shown under some fields.
export const FIELD_HINTS = {
  income: "Per month, before tax.",
  dtir1: "Monthly debt payments divided by monthly income.",
  term: "Loan length in months.",
  Credit_Score: "Between 300 and 900.",
};

// Why each column was removed from training (taken from configs/config.yaml).
export const EXCLUSION_REASONS = {
  rate_of_interest: "set-after-approval",
  Interest_rate_spread: "set-after-approval",
  Upfront_charges: "set-after-approval",
  LTV: "missing-on-defaults",
  property_value: "missing-on-defaults",
  construction_type: "constant",
  Secured_by: "constant",
  Security_Type: "constant",
};

export const EXCLUSION_GROUPS = {
  "set-after-approval": {
    title: "Decided after approval",
    text: "These values are set once a loan is approved, so they do not exist when a new application arrives. They are missing for almost every defaulted loan, which quietly reveals the answer.",
  },
  "missing-on-defaults": {
    title: "Missing only on defaulted loans",
    text: "The same artefact: the data is blank almost only where the loan defaulted, so a model could learn \u201Cblank means default\u201D.",
  },
  constant: {
    title: "Almost never different",
    text: "The value is identical in 99.98% of rows, so it carries no signal.",
  },
};

export const MODEL_NOTES = {
  random_forest: "Many decision trees vote together. Strong on mixed data, harder to explain.",
  decision_tree: "A single tree of yes/no questions. Easy to read, easy to overfit.",
  logistic_regression: "A weighted sum turned into a probability. Simple, fast, a useful baseline.",
  svm: "A linear boundary between classes, calibrated so it can output probabilities.",
  naive_bayes: "Multiplies independent clues. Very fast but assumes features do not interact.",
};

// One colour per model so charts stay consistent across pages (see styles/tokens.css).
export const MODEL_COLORS = {
  random_forest: "var(--m1)",
  decision_tree: "var(--m2)",
  logistic_regression: "var(--m3)",
  svm: "var(--m4)",
  naive_bayes: "var(--m5)",
};
export const modelColor = (id) => MODEL_COLORS[id] ?? "var(--accent)";

export const METRICS = [
  { key: "test_roc_auc", short: "ROC-AUC", title: "ROC-AUC", help: "How well the model ranks defaults above repaid loans. 0.5 is a coin flip, 1.0 is perfect." },
  { key: "test_f1", short: "F1", title: "F1 score", help: "Balance of precision and recall for the default class." },
  { key: "test_precision", short: "Precision", title: "Precision", help: "When the model says default, how often it is right." },
  { key: "test_recall", short: "Recall", title: "Recall", help: "Of all real defaults, how many the model catches." },
  { key: "test_accuracy", short: "Accuracy", title: "Accuracy", help: "Share of all loans classified correctly. Misleading when classes are unbalanced." },
];
