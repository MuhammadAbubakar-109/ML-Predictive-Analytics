import { useEffect, useState } from "react";

// Like useState, but the value survives a page refresh.
export default function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? initial : JSON.parse(raw);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage can be full or blocked; the app still works without it */
    }
  }, [key, value]);

  return [value, setValue];
}
