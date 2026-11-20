import { useMemo, useState } from "react";
import { METRICS, MODEL_NOTES, modelColor } from "../labels";
import { metric } from "../utils/format";
import Icon from "./Icon";

const COLUMNS = [
  { key: "cv_score", label: "CV AUC" },
  ...METRICS.slice().reverse().map((m) => ({ key: m.key, label: m.short })),
  { key: "seconds", label: "Train time", format: (v) => `${v}s` },
];

// Sortable table of every model. The best value in each column is highlighted.
export default function ModelComparison({ info, modelName }) {
  const [sort, setSort] = useState({ key: "cv_score", dir: "desc" });
  const rows = useMemo(() => {
    const list = [...(info?.comparison ?? [])];
    list.sort((a, b) => (sort.dir === "desc" ? b[sort.key] - a[sort.key] : a[sort.key] - b[sort.key]));
    return list;
  }, [info, sort]);

  if (!rows.length) return null;

  const best = {};
  for (const c of COLUMNS) {
    const values = info.comparison.map((r) => r[c.key]);
    best[c.key] = c.key === "seconds" ? Math.min(...values) : Math.max(...values);
  }
  const toggle = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: key === "seconds" ? "asc" : "desc" }));

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Model</th>
            {COLUMNS.map((c) => (
              <th key={c.key} className="num" aria-sort={sort.key === c.key ? (sort.dir === "desc" ? "descending" : "ascending") : "none"}>
                <button className="th-btn" onClick={() => toggle(c.key)}>
                  {c.label}
                  {sort.key === c.key && <Icon name={sort.dir === "desc" ? "down" : "up"} size={13} />}
                </button>
              </th>
            ))}
            <th>Best settings</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.model}>
              <td>
                <span className="model-cell">
                  <i className="dot" style={{ background: modelColor(row.model) }} />
                  <span>
                    <strong>{modelName(row.model)}</strong>
                    {row.model === info.best_model && <span className="badge band-low">selected</span>}
                    <small>{MODEL_NOTES[row.model]}</small>
                  </span>
                </span>
              </td>
              {COLUMNS.map((c) => (
                <td key={c.key} className={`num${row[c.key] === best[c.key] ? " is-top" : ""}`}>
                  {c.format ? c.format(row[c.key]) : metric(row[c.key])}
                </td>
              ))}
              <td className="params">
                {Object.entries(row.best_params).map(([k, v]) => <code key={k}>{k}={String(v)}</code>)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
