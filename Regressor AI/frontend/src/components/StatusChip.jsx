import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { API_BASE } from "../services/api";
import { dateTime } from "../utils/format";
import Icon from "./Icon";

const STATE = {
  loading: { tone: "warn", text: "Connecting" },
  ready: { tone: "good", text: "API online" },
  empty: { tone: "warn", text: "No models" },
  error: { tone: "bad", text: "API offline" },
};

// Small connection indicator. Click it for details about the backend.
export default function StatusChip() {
  const { status, error, health, info, reload, modelName } = useApp();
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const s = STATE[status];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className="status" ref={box}>
      <button className={`status-chip tone-${s.tone}`} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="dialog">
        <i aria-hidden="true" /> {s.text}
      </button>
      {open && (
        <div className="popover" role="dialog" aria-label="API status">
          <dl>
            <div><dt>Address</dt><dd>{API_BASE}</dd></div>
            <div><dt>Models loaded</dt><dd>{health?.models_loaded?.length ? health.models_loaded.map(modelName).join(", ") : "None"}</dd></div>
            {info && <div><dt>Last trained</dt><dd>{dateTime(info.trained_at)}</dd></div>}
            {error && <div><dt>Problem</dt><dd>{error}</dd></div>}
          </dl>
          <div className="popover-actions">
            <button className="btn btn-sm" onClick={reload}><Icon name="refresh" size={14} /> Check again</button>
            <a className="btn btn-sm btn-ghost" href={`${API_BASE}/docs`} target="_blank" rel="noreferrer">API docs <Icon name="external" size={13} /></a>
          </div>
        </div>
      )}
    </div>
  );
}
