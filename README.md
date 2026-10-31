# Loan Default Prediction

Full-stack ML project: predicts whether a loan applicant will **default** (`Status` = 1) from application details.
Five classifiers are trained and compared; the best (highest cross-validated ROC-AUC) is served via FastAPI and a React UI.

## Models compared
Logistic Regression · Decision Tree · Random Forest · Naive Bayes · SVM (linear, probability-calibrated)
Each is tuned with `GridSearchCV` (stratified 3-fold). Class imbalance (24.6% defaults) is handled with `class_weight="balanced"`.

## Results (20% stratified hold-out, 29,734 loans)
| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
| **Random Forest (selected)** | 0.875 | 0.798 | 0.660 | 0.722 | 0.879 |
| Decision Tree | 0.854 | 0.710 | 0.686 | 0.698 | 0.866 |
| Logistic Regression | 0.830 | 0.657 | 0.651 | 0.654 | 0.841 |
| SVM (linear) | 0.868 | 0.900 | 0.520 | 0.659 | 0.841 |
| Naive Bayes | 0.852 | 0.772 | 0.565 | 0.652 | 0.821 |

Precision/recall are for the *default* class. Regenerated in `models/metadata.json` and `models/comparison.csv` by `make train`.

## Data leakage — important
In the raw data, `rate_of_interest`, `Interest_rate_spread`, `Upfront_charges`, `LTV` and `property_value` are
missing (almost) **only for defaulted loans**. They are set after approval, so they are unavailable when scoring a
new application. Using them gives ~99% accuracy that would collapse in production. They are excluded via
`data.drop_columns` in `configs/config.yaml`, a test guards against re-adding them, and missing-value
indicator flags are disabled (`training.missing_indicators: false`).

## Quick start
```bash
make install      # python deps + npm install
make train        # trains all 5 models (~4 min), saves every model + metadata.json
make test         # pytest
make api          # http://localhost:8000/docs
make ui           # http://localhost:5173   (second terminal)
```
Docker: `make train && make up`.

## Structure
```
Classification/
├── backend/                   # Python: ML + API (plain, commented code)
│   ├── src/
│   │   ├── ml/                # data · features · train · evaluate · predict
│   │   └── api/               # main · schemas · config (thin FastAPI layer)
│   ├── configs/config.yaml    # features, leakage exclusions, models, grids
│   ├── data/                  # raw/ processed/  (git-ignored)
│   ├── models/                # one .joblib per model + model.joblib (best) + metadata.json
│   ├── notebooks/             # exploration only
│   ├── tests/                 # test_ml.py · test_api.py
│   ├── Dockerfile · Makefile · pyproject.toml · .env.example
├── frontend/                  # React + Vite, no extra runtime libraries
│   └── src/
│       ├── pages/             # Assess · Batch · Models · Data · History
│       ├── components/        # form, result panel, what-if, palette, nav, fields/
│       ├── charts/            # hand-built SVG: risk gauge, radar, scatter, matrix...
│       ├── context/ hooks/    # app data, history, toasts · theme, hotkeys, routing
│       ├── utils/ styles/     # payload, csv, formatting · design tokens + CSS
│       └── services/api.js · labels.js · App.jsx · main.jsx
├── .github/workflows/ci.yml
├── docker-compose.yml
├── Makefile                   # root shortcuts: make train / test / api / ui / up
└── README.md
```

## Website pages
| Page | What it does |
|---|---|
| Assess | Form with sliders and live checks, a risk dial, **All models** comparison, and a **What-if** sweep that changes one input at a time |
| Batch | Upload a CSV, score every row, filter by risk, export the scored file |
| Models | Leaderboard, precision-vs-recall, radar chart, confusion matrix, sortable results table |
| Data | Dataset facts, class balance, the data-leakage safeguards and the scoring pipeline |
| History | Every assessment (saved in your browser only), reusable and exportable |

Shortcuts: `Ctrl/Cmd + K` opens the command palette, `Ctrl/Cmd + Enter` runs an assessment. The theme follows your system or can be set to light/dark.

## API
| Endpoint | Purpose |
|---|---|
| `GET /health` | liveness + list of loaded models |
| `GET /models` | available models and which one is best |
| `GET /options` | dropdown values and numeric ranges |
| `GET /model-info` | selected model, comparison metrics, confusion matrices, excluded columns |
| `POST /predict` | required: loan_amount, income, Credit_Score, age, loan_type, loan_purpose; the rest optional (imputed); optional `model`. Returns `prediction` ("Default" / "No default"), `default_probability`, `risk_level` (Low <33%, Medium <66%, High) and `model` |
| `POST /predict-all` | same input, scored by every saved model |

## Notes
- RBF-kernel SVC is O(n²) and impractical on ~119k rows, so the SVM is a `LinearSVC` wrapped in `CalibratedClassifierCV`.
- The decision threshold is 0.5. In a real lending setting, tune it to the relative cost of missed defaults vs. rejected good loans.
- Add a model: add an entry under `models:` in the config and re-run `make train`.
