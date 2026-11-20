import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "./Icon";

// Ctrl/Cmd + K. Type to filter, arrow keys to move, Enter to run, Escape to close.
export default function CommandPalette({ open, onClose, commands }) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const input = useRef(null);

  useEffect(() => {
    if (open) { setQuery(""); setIndex(0); setTimeout(() => input.current?.focus(), 0); }
  }, [open]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return commands.filter((c) => !q || `${c.label} ${c.keywords ?? ""}`.toLowerCase().includes(q));
  }, [commands, query]);

  if (!open) return null;

  const run = (c) => { onClose(); c.run(); };

  function onKeyDown(e) {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") { e.preventDefault(); setIndex((i) => Math.min(i + 1, matches.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && matches[index]) { e.preventDefault(); run(matches[index]); }
  }

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKeyDown}>
        <div className="palette-search">
          <Icon name="search" size={18} />
          <input ref={input} value={query} onChange={(e) => { setQuery(e.target.value); setIndex(0); }}
            placeholder="Go to a page or run an action" aria-label="Search commands" />
          <kbd>Esc</kbd>
        </div>
        <ul role="listbox">
          {matches.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === index}>
              <button className={i === index ? "is-active" : ""} onMouseEnter={() => setIndex(i)} onClick={() => run(c)}>
                <Icon name={c.icon} size={17} />
                <span>{c.label}</span>
                {c.hint && <small>{c.hint}</small>}
              </button>
            </li>
          ))}
          {!matches.length && <li className="palette-empty">No command matches &ldquo;{query}&rdquo;.</li>}
        </ul>
      </div>
    </div>
  );
}
