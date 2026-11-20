// All communication with the FastAPI backend lives in this file.
export const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request(path, options) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new Error(`Cannot reach the API at ${API_BASE}. Is the backend running?`);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (Array.isArray(body.detail)) {
        // FastAPI 422 validation errors: "field: message"
        message = body.detail.map((d) => `${d.loc.slice(1).join(".")}: ${d.msg}`).join("; ");
      } else if (typeof body.detail === "string") {
        message = body.detail;
      }
    } catch {
      /* keep the default message */
    }
    throw new Error(message);
  }
  return res.json();
}

const post = (path, payload) =>
  request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const getHealth = () => request("/health");
export const getModels = () => request("/models");
export const getOptions = () => request("/options");
export const getModelInfo = () => request("/model-info");
export const predictSalary = (payload) => post("/predict", payload);
export const predictAll = (payload) => post("/predict-all", payload);
