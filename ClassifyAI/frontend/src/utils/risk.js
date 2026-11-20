// These thresholds mirror backend/src/ml/predict.py (risk_level and THRESHOLD).
export const LOW_BELOW = 0.33;
export const MEDIUM_BELOW = 0.66;
export const DECISION = 0.5;

export const riskBand = (p) => (p < LOW_BELOW ? "low" : p < MEDIUM_BELOW ? "medium" : "high");

export const BAND_LABEL = { low: "Low", medium: "Medium", high: "High" };
