# Employee Salary Prediction (Regression)

Full-stack ML project: predicts **monthly salary (PKR)** from job, experience and company details.
Six regressors are trained, tuned, compared and **all saved**. The FastAPI backend serves any of them
(or all at once), and the React website lets you estimate, compare, stress-test and batch-score.

## Models compared
Linear Regression · Ridge · Lasso · Decision Tree · Random Forest · SVR
(each tuned with `GridSearchCV`; salary is modelled on a log scale because it is right-skewed)

## Results (20% hold-out test set)
| Model | R² | MAE (PKR) | RMSE (PKR) |
|---|---|---|---|
| **Ridge (best, lowest CV-RMSE)** | 0.931 | 14,284 | 23,893 |
| Linear Regression | 0.931 | 14,284 | 23,905 |
| Lasso | 0.932 | 14,332 | 23,728 |
| SVR | 0.906 | 14,791 | 28,001 |
| Random Forest | 0.854 | 21,182 | 34,795 |
| Decision Tree | 0.752 | 28,069 | 45,363 |

Regenerated in `backend/models/metadata.json` and `comparison.csv` on every training run.

## Quick start
```bash
make install       # backend + frontend dependencies
make train         # optional: trained models are already included in backend/models/ (~2 min)
make test          # 14 tests
make api           # http://localhost:8000/docs
make ui            # http://localhost:5173   (run in a second terminal)
```
Without `make`, run these from the project folder:
```bash
cd backend && pip install -e ".[dev]" && python -m src.ml.train
cd backend && python -m uvicorn src.api.main:app --reload --port 8000
cd frontend && npm install && npm run dev
```
Or with Docker: `docker compose up --build`.

## Structure
```
Regression/
├── backend/                   # Python: ML + API (plain, commented code)
│   ├── src/
│   │   ├── ml/                # data · features · train · evaluate · predict
│   │   └── api/               # main · schemas · config (thin FastAPI layer)
│   ├── configs/config.yaml    # features, models, grids, artifact paths
│   ├── data/                  # raw/ processed/
│   ├── models/                # one .joblib per model + model.joblib (best) + metadata.json
│   ├── notebooks/             # exploration only
│   ├── tests/                 # test_ml.py · test_api.py
│   ├── Dockerfile · Makefile · pyproject.toml · .env.example
├── frontend/                  # React + Vite, no extra runtime libraries
│   └── src/
│       ├── pages/             # Estimate · Batch · Models · Data · History
│       ├── components/        # form, result panel, what-if, palette, nav, fields/
│       ├── charts/            # hand-built SVG/HTML: salary ruler, strip, line, bars, scatter...
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
| Estimate | Five essential fields plus optional details (blank = "Auto"), a salary ruler with the typical range, **All models** comparison, and a **What-if** view that changes one number or choice at a time |
| Batch | Upload a CSV, estimate every row, see the payroll total and spread, export the results |
| Models | Leaderboard, error-against-fit chart, cross-validation vs test check, sortable results table |
| Data | Dataset facts, the log-salary method, inputs used and columns left out |
| History | Every estimate (saved in your browser only), reusable and exportable |

Shortcuts: `Ctrl/Cmd + K` opens the command palette, `Ctrl/Cmd + Enter` runs an estimate. The theme follows your system or can be set to light/dark.

## API
| Endpoint | Purpose |
|---|---|
| `GET /health` | liveness + list of loaded model artifacts |
| `GET /models` | available models, marks the best one |
| `GET /options` | dropdown values and numeric ranges (the website form is built from this) |
| `GET /model-info` | best model, trained-at, average salary, test size, excluded columns and the full comparison (with best settings) |
| `POST /predict` | one prediction; optional `"model": "<id>"` (default: best). Returns monthly and annual salary and a typical range (± test MAE) |
| `POST /predict-all` | same input scored by every saved model |

Required fields: `Job_Title, Job_Level, Experience_Years, Education_Level, City`. Everything else is optional and imputed.

## Adding a model
Add an entry under `models:` in `backend/configs/config.yaml` **and** a path under `paths.models`, then retrain.
Optionally add a display name in `backend/src/ml/predict.py` (`DISPLAY`) and a colour in `frontend/src/labels.js`.

## Known limitation
SVR compresses extreme salaries (very junior or very senior profiles drift toward the middle). The
"All models" tab makes this visible; prefer Ridge/Lasso for the tails.
