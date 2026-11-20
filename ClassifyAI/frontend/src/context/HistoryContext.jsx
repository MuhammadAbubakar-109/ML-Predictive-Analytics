import { createContext, useCallback, useContext, useMemo } from "react";
import useLocalStorage from "../hooks/useLocalStorage";

const HistoryContext = createContext(null);
const MAX_ENTRIES = 100;

// Past assessments are kept in this browser only (localStorage). Nothing is sent anywhere.
export function HistoryProvider({ children }) {
  const [entries, setEntries] = useLocalStorage("lc.history", []);

  const add = useCallback(
    (payload, result) => {
      const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ts: Date.now(), payload, result };
      setEntries((list) => [entry, ...list].slice(0, MAX_ENTRIES));
    },
    [setEntries]
  );
  const remove = useCallback((id) => setEntries((list) => list.filter((e) => e.id !== id)), [setEntries]);
  const clear = useCallback(() => setEntries([]), [setEntries]);

  const value = useMemo(() => ({ entries, add, remove, clear }), [entries, add, remove, clear]);
  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export const useHistory = () => useContext(HistoryContext);
