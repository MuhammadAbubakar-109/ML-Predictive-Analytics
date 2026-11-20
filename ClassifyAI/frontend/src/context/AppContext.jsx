import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getHealth, getModelInfo, getModels, getOptions } from "../services/api";

const AppContext = createContext(null);

const prettify = (id) => id.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

export function AppProvider({ children }) {
  const [state, setState] = useState({
    status: "loading", // loading | ready | empty | error
    error: "",
    models: null,
    options: null,
    info: null,
    health: null,
  });
  // A "draft" is a request from another page to change the assessment form
  // (for example "reuse this past assessment" or "load the high-risk example").
  const [draft, setDraft] = useState(null);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: "loading", error: "" }));
    try {
      const [models, options, info, health] = await Promise.all([
        getModels(), getOptions(), getModelInfo(), getHealth(),
      ]);
      setState({
        status: models.models.length ? "ready" : "empty",
        error: "", models, options, info, health,
      });
    } catch (e) {
      // The API answers with "Run: make train" when no models exist yet.
      const untrained = e.message.includes("make train");
      setState((s) => ({ ...s, status: untrained ? "empty" : "error", error: e.message }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const value = useMemo(() => {
    const modelName = (id) => state.models?.models.find((m) => m.id === id)?.name ?? prettify(id);
    return { ...state, reload: load, modelName, draft, setDraft };
  }, [state, load, draft]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
