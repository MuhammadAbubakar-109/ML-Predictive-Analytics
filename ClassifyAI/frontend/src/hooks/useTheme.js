import { useCallback, useEffect, useState } from "react";
import useLocalStorage from "./useLocalStorage";

const ORDER = ["system", "light", "dark"];

export default function useTheme() {
  const [mode, setMode] = useLocalStorage("lc.theme", "system");
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setSystemDark(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (mode === "light" || mode === "dark") root.dataset.theme = mode;
    else delete root.dataset.theme;
  }, [mode]);

  const cycle = useCallback(
    () => setMode((m) => ORDER[(ORDER.indexOf(m) + 1) % ORDER.length]),
    [setMode]
  );
  const resolved = mode === "system" ? (systemDark ? "dark" : "light") : mode;

  return { mode, setMode, cycle, resolved };
}
