import { useEffect, useRef } from "react";

// bindings: [{ key: "k", mod: true, handler: fn }]   (mod = Ctrl on Windows/Linux, Cmd on Mac)
export default function useHotkeys(bindings) {
  const ref = useRef(bindings);
  ref.current = bindings;

  useEffect(() => {
    const onKeyDown = (e) => {
      for (const b of ref.current) {
        const modOk = b.mod ? e.ctrlKey || e.metaKey : !(e.ctrlKey || e.metaKey);
        if (modOk && e.key.toLowerCase() === b.key) {
          e.preventDefault();
          b.handler(e);
          return;
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
