// Turns what the person typed into what the API expects, and checks it first.

export const INTEGER_FIELDS = new Set(["Credit_Score"]);

// These rules mirror backend/src/api/schemas.py. The API is the final judge.
const RULES = {
  loan_amount: { min: 0, exclusive: true, text: "Enter an amount greater than 0." },
  income: { min: 0, text: "Enter 0 or more." },
  Credit_Score: { min: 300, max: 900, text: "Enter a score between 300 and 900." },
  term: { min: 0, exclusive: true, text: "Enter a number of months greater than 0." },
  dtir1: { min: 0, text: "Enter 0 or more." },
};

export const PRESETS = {
  low: {
    label: "Low-risk example",
    values: {
      loan_amount: 206500, income: 9000, Credit_Score: 820, dtir1: 25, term: 360,
      approv_in_adv: "pre", business_or_commercial: "nob/c",
      Neg_ammortization: "not_neg", interest_only: "not_int",
      lump_sum_payment: "not_lpsm", occupancy_type: "pr",
    },
  },
  high: {
    label: "High-risk example",
    values: {
      loan_amount: 1500000, income: 2000, Credit_Score: 520, dtir1: 55, term: 360,
      approv_in_adv: "nopre", business_or_commercial: "b/c",
      Neg_ammortization: "neg_amm", interest_only: "int_only",
      lump_sum_payment: "lpsm", occupancy_type: "ir",
    },
  },
};

// Typical values: the median for numbers and the most common choice for categories.
export function initialValues(options, models) {
  const values = { model: models.best_model };
  for (const [col, stats] of Object.entries(options.numeric)) {
    values[col] = String(Math.round(stats.median * 100) / 100);
  }
  for (const [col, choices] of Object.entries(options.categorical)) {
    values[col] = options.defaults_categorical?.[col] ?? choices[0] ?? "";
  }
  return values;
}

// Keep only values that still make sense for the current data (e.g. after retraining).
export function sanitize(saved, options, models) {
  const base = initialValues(options, models);
  if (!saved || typeof saved !== "object") return base;
  const out = { ...base };
  for (const col of Object.keys(options.numeric)) {
    if (saved[col] !== undefined && saved[col] !== "" && !Number.isNaN(Number(saved[col]))) {
      out[col] = String(saved[col]);
    }
  }
  for (const [col, choices] of Object.entries(options.categorical)) {
    if (choices.includes(saved[col])) out[col] = saved[col];
  }
  if (models.models.some((m) => m.id === saved.model)) out.model = saved.model;
  return out;
}

export function applyPreset(values, preset, options) {
  const next = { ...values };
  for (const [key, val] of Object.entries(preset.values)) {
    if (options.numeric[key]) {
      const { min, max } = options.numeric[key];
      next[key] = String(Math.min(Math.max(val, min), max));
    } else if (options.categorical[key]?.includes(val)) {
      next[key] = val; // skip values this dataset does not contain
    }
  }
  return next;
}

export function buildPayload(values, options) {
  const payload = { ...values };
  for (const col of Object.keys(options.numeric)) {
    const n = Number(values[col]);
    payload[col] = INTEGER_FIELDS.has(col) ? Math.round(n) : n;
  }
  return payload;
}

export function validate(values, options) {
  const errors = {};
  for (const col of Object.keys(options.numeric)) {
    const raw = values[col];
    const n = Number(raw);
    const rule = RULES[col];
    if (raw === "" || raw == null || Number.isNaN(n)) {
      errors[col] = "Enter a number.";
    } else if (rule) {
      const tooLow = rule.exclusive ? n <= rule.min : n < rule.min;
      if (tooLow || (rule.max != null && n > rule.max)) errors[col] = rule.text;
    }
  }
  return errors;
}

// Soft warning: legal for the API, but outside what the models saw while training.
export function rangeWarning(col, raw, options) {
  const stats = options.numeric[col];
  const n = Number(raw);
  if (!stats || raw === "" || Number.isNaN(n)) return "";
  if (n < stats.min || n > stats.max) {
    return `Outside the training range (${stats.min.toLocaleString()} to ${stats.max.toLocaleString()}). The model may be unreliable here.`;
  }
  return "";
}
