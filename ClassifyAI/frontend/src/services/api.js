
// All communication with the FastAPI backend lives here.

// Local development:
// http://localhost:8000/api

// Vercel deployment:
// /api

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:8000/api"
).replace(/\/$/, "");

export { API_BASE };


async function request(path, options = {}) {
  let res;

  try {
    res = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new Error(
      `Cannot reach the API at ${API_BASE}. Please check that your backend is running.`
    );
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;

    try {
      const body = await res.json();

      if (Array.isArray(body.detail)) {
        message = body.detail
          .map((d) => {
            const location = d.loc?.slice(1).join(".") || "field";
            return `${location}: ${d.msg}`;
          })
          .join("; ");
      } else if (typeof body.detail === "string") {
        message = body.detail;
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return res.json();
}


// POST request helper
const post = (path, payload) =>
  request(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });


// GET endpoints
export const getHealth = () => request("/health");

export const getModels = () => request("/models");

export const getOptions = () => request("/options");

export const getModelInfo = () => request("/model-info");


// POST endpoints
export const predict = (payload) =>
  post("/predict", payload);

export const predictAll = (payload) =>
  post("/predict-all", payload);
