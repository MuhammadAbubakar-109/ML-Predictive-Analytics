// Turns what the person typed into what the API expects, and checks it first.
import { CORE_FIELDS, INTEGER_FIELDS, PRESETS } from "../labels";

// Rules that mirror backend/src/api/schemas.py. The API is the final judge.
const RULES = {
  Experience_Years: { min: 0, max: 60, text: "Enter a number from 0 to 60." },
  Performance_Rating: { min: 0, max: 5, text: "Enter a rating from 0 to 5." },
};

// Core fields start with typical values. Optional fields start blank, which means "Auto":
// the backend fills them in with the typical value from the training data.
export function initialValues(options, models) {
  const values = { model: models.best_model };
  for (const col of CORE_FIELDS) {
    if (options.numeric[col]) values[col] = String(options.numeric[col].median);
    else values[col] = options.defaults_categorical?.[col] ?? options.categorical[col]?.[0] ?? "";
  }
  for (const col of [...Object.keys(options.numeric), ...Object.keys(options.categorical)]) {
    if (!(col in values)) values[col] = "";
  }
  return values;
}

// Keep only saved values that still make sense (for example after the data changed).
export function sanitize(saved, options, models) {
  const base = initialValues(options, models);
  if (!saved || typeof saved !== "object") return base;
  const out = { ...base };
  for (const col of Object.keys(options.numeric)) {
    const raw = saved[col];
    if (raw === "" && !CORE_FIELDS.includes(col)) out[col] = "";
    else if (raw !== undefined && raw !== "" && !Number.isNaN(Number(raw))) out[col] = String(raw);
  }
  for (const [col, choices] of Object.entries(options.categorical)) {
    if (choices.includes(saved[col])) out[col] = saved[col];
    else if (saved[col] === "" && !CORE_FIELDS.includes(col)) out[col] = "";
  }
  if (models.models.some((m) => m.id === saved.model)) out.model = saved.model;
  return out;
}

export function applyPreset(values, key, options) {
  const next = { ...values };
  for (const [col, val] of Object.entries(PRESETS[key].values)) {
    if (options.numeric[col]) {
      const { min, max } = options.numeric[col];
      next[col] = String(Math.min(Math.max(val, min), max));
    } else if (options.categorical[col]?.includes(val)) {
      next[col] = val; // skip values this dataset does not contain
    }
  }
  return next;
}

// Blank fields are left out completely, so the backend treats them as "not provided".
export function buildPayload(values, options) {
  const payload = {};
  for (const [col, raw] of Object.entries(values)) {
    if (raw === "" || raw == null) continue;
    if (options.numeric[col]) {
      const n = Number(raw);
      payload[col] = INTEGER_FIELDS.has(col) ? Math.round(n) : n;
    } else {
      payload[col] = raw;
    }
  }
  return payload;
}

export function validate(values, options) {
  const errors = {};
  for (const col of Object.keys(options.numeric)) {
    const raw = values[col];
    const blank = raw === "" || raw == null;
    if (blank) {
      if (CORE_FIELDS.includes(col)) errors[col] = "Enter a number.";
      continue;
    }
    const n = Number(raw);
    const rule = RULES[col];
    if (Number.isNaN(n)) errors[col] = "Enter a number.";
    else if (rule && (n < rule.min || n > rule.max)) errors[col] = rule.text;
  }
  return errors;
}

// Soft warning: allowed by the API, but outside what the models saw while training.
export function rangeWarning(col, raw, options) {
  const stats = options.numeric[col];
  const n = Number(raw);
  if (!stats || raw === "" || Number.isNaN(n)) return "";
  if (n < stats.min || n > stats.max) {
    return `Outside the training range (${stats.min.toLocaleString()} to ${stats.max.toLocaleString()}). The model may be unreliable here.`;
  }
  return "";
}

export const countFilled = (fields, values) => fields.filter((f) => values[f] !== "" && values[f] != null).length;
