import { useMemo, useRef, useState } from "react";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import PageHeader from "../components/PageHeader";
import Segmented from "../components/Segmented";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { predict } from "../services/api";
import { downloadText, parseCsv, toCsv } from "../utils/csv";
import { num, pct } from "../utils/format";
import { PRESETS, applyPreset, initialValues } from "../utils/payload";
import { riskBand } from "../utils/risk";

const REQUIRED = ["loan_amount", "income", "Credit_Score", "age", "loan_type", "loan_purpose"];
const MAX_ROWS = 500;
const PAGE_SIZE = 25;
const PARALLEL = 6;

export default function BatchPage() {
  const { models, options, modelName } = useApp();
  const toast = useToast();
  const cancel = useRef(false);

  const [file, setFile] = useState(null); // { name, headers, rows, payloads, ignored, truncated }
  const [model, setModel] = useState(models.best_model);
  const [status, setStatus] = useState("idle"); // idle | running | done
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const columns = useMemo(() => [...Object.keys(options.numeric), ...Object.keys(options.categorical)], [options]);

  async function load(f) {
    setError("");
    if (!f) return;
    try {
      const { headers, rows } = parseCsv(await f.text());
      const missing = REQUIRED.filter((c) => !headers.includes(c));
      if (missing.length) throw new Error(`Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`);
      if (!rows.length) throw new Error("The file has a header but no rows.");

      const truncated = rows.length > MAX_ROWS;
      const used = rows.slice(0, MAX_ROWS);
      const payloads = used.map((cells) => {
        const body = {};
        headers.forEach((h, i) => {
          const raw = (cells[i] ?? "").trim();
          if (!columns.includes(h) || raw === "") return;
          body[h] = options.numeric[h] ? (h === "Credit_Score" ? Math.round(Number(raw)) : Number(raw)) : raw;
        });
        return body;
      });
      setFile({ name: f.name, headers, rows: used, payloads, ignored: headers.filter((h) => !columns.includes(h)), truncated, total: rows.length });
      setResults([]); setStatus("idle"); setProgress(0); setPage(0); setFilter("all");
    } catch (e) {
      setFile(null);
      setError(e.message);
    }
  }

  async function run() {
    cancel.current = false;
    setStatus("running"); setProgress(0); setResults([]); setPage(0);
    const out = new Array(file.payloads.length);
    let next = 0;
    let done = 0;
    const worker = async () => {
      while (!cancel.current) {
        const i = next++;
        if (i >= file.payloads.length) return;
        try { out[i] = { ok: true, ...(await predict({ ...file.payloads[i], model })) }; }
        catch (e) { out[i] = { ok: false, error: e.message }; }
        setProgress(++done);
      }
    };
    await Promise.all(Array.from({ length: PARALLEL }, worker));
    setResults(out.map((r, i) => r ?? { ok: false, error: "Cancelled", index: i }));
    setStatus("done");
    if (!cancel.current) toast.success(`Scored ${out.length} applications`);
  }

  function template() {
    const rows = ["low", "high"].map((k) => applyPreset(initialValues(options, models), PRESETS[k], options));
    downloadText("loan-applications-template.csv", toCsv(rows, columns));
  }

  function exportResults() {
    const rows = file.rows.map((cells, i) => {
      const row = Object.fromEntries(file.headers.map((h, j) => [h, cells[j]]));
      const r = results[i];
      return { ...row, default_probability: r?.ok ? r.default_probability : "", risk_level: r?.ok ? r.risk_level : "", prediction: r?.ok ? r.prediction : "", error: r?.ok ? "" : r?.error ?? "" };
    });
    downloadText("scored-applications.csv", toCsv(rows, [...file.headers, "default_probability", "risk_level", "prediction", "error"]));
  }

  const scored = results.filter((r) => r.ok);
  const failed = results.length - scored.length;
  const counts = { low: 0, medium: 0, high: 0 };
  scored.forEach((r) => { counts[riskBand(r.default_probability)]++; });
  const defaults = scored.filter((r) => r.prediction === "Default").length;
  const average = scored.length ? scored.reduce((a, r) => a + r.default_probability, 0) / scored.length : 0;

  const visible = results
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => filter === "all" || (filter === "error" ? !r.ok : r.ok && riskBand(r.default_probability) === filter));
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const slice = visible.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Batch scoring"
        actions={<button className="btn btn-sm" onClick={template}><Icon name="download" size={15} /> Download template</button>}
      >
        Score many applications at once from a CSV file. The file never leaves your computer except for the calls to your own API.
      </PageHeader>

      {error && <div className="alert" role="alert">{error}</div>}

      <label
        className={`dropzone${dragging ? " is-dragging" : ""}${file ? " has-file" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); load(e.dataTransfer.files[0]); }}
      >
        <input type="file" accept=".csv,text/csv" onChange={(e) => { load(e.target.files[0]); e.target.value = ""; }} />
        <Icon name={file ? "file" : "upload"} size={26} />
        {file ? (
          <span>
            <strong>{file.name}</strong>
            <small>{num(file.rows.length)} applications ready. Drop another file to replace it.</small>
          </span>
        ) : (
          <span>
            <strong>Drop a CSV file here, or choose one</strong>
            <small>Required columns: {REQUIRED.join(", ")}. Other columns are optional.</small>
          </span>
        )}
      </label>

      {file && (file.truncated || file.ignored.length > 0) && (
        <p className="inline-warning">
          {file.truncated && `Only the first ${MAX_ROWS} of ${num(file.total)} rows will be scored. `}
          {file.ignored.length > 0 && `Ignored columns: ${file.ignored.join(", ")}.`}
        </p>
      )}

      {file && (
        <div className="batch-controls">
          <div className="field">
            <label htmlFor="batch-model">Model</label>
            <div className="select-wrap">
              <select id="batch-model" value={model} onChange={(e) => setModel(e.target.value)} disabled={status === "running"}>
                {models.models.map((m) => <option key={m.id} value={m.id}>{m.name}{m.is_best ? " (best)" : ""}</option>)}
              </select>
            </div>
          </div>
          {status === "running" ? (
            <button className="btn" onClick={() => { cancel.current = true; }}>Stop</button>
          ) : (
            <button className="btn btn-primary" onClick={run}><Icon name="play" size={16} /> Score {num(file.rows.length)} applications</button>
          )}
          {status === "running" && (
            <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={file.rows.length} aria-valuenow={progress}>
              <span style={{ width: `${(progress / file.rows.length) * 100}%` }} />
              <small>{progress} of {file.rows.length}</small>
            </div>
          )}
        </div>
      )}

      {!file && !error && (
        <EmptyState icon="layers" title="Nothing loaded yet"
          action={<button className="btn btn-sm" onClick={template}>Get a template with two example rows</button>}>
          Upload a CSV to see every application scored, grouped by risk and ready to export.
        </EmptyState>
      )}

      {status === "done" && results.length > 0 && (
        <>
          <section className="stat-strip" aria-label="Batch summary">
            <div><span className="stat-label">Scored</span><strong>{num(scored.length)}</strong><small>{failed ? `${failed} failed` : "no failures"}</small></div>
            <div><span className="stat-label">Predicted defaults</span><strong>{num(defaults)}</strong><small>{scored.length ? pct(defaults / scored.length) : "0%"} of scored</small></div>
            <div><span className="stat-label">Average probability</span><strong>{pct(average)}</strong><small>{modelName(model)}</small></div>
            <div className="stat-split">
              <span className="stat-label">Risk mix</span>
              <div className="mix" role="img" aria-label={`Low ${counts.low}, medium ${counts.medium}, high ${counts.high}`}>
                {["low", "medium", "high"].map((b) => counts[b] > 0 && <span key={b} className={`band-${b}`} style={{ flexGrow: counts[b] }}>{counts[b]}</span>)}
              </div>
            </div>
          </section>

          <section className="panel table-panel">
            <div className="panel-head">
              <Segmented label="Filter results" value={filter} onChange={(v) => { setFilter(v); setPage(0); }} className="segmented-wrap"
                options={[{ value: "all", label: "All" }, { value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, ...(failed ? [{ value: "error", label: "Failed" }] : [])]} />
              <button className="btn btn-sm" onClick={exportResults}><Icon name="download" size={15} /> Export scored CSV</button>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th className="num">Row</th><th className="num">Loan amount</th><th className="num">Income</th><th className="num">Credit score</th><th>Probability</th><th>Verdict</th></tr>
                </thead>
                <tbody>
                  {slice.map(({ r, i }) => (
                    <tr key={i}>
                      <td className="num">{i + 1}</td>
                      <td className="num">{num(file.payloads[i].loan_amount)}</td>
                      <td className="num">{num(file.payloads[i].income)}</td>
                      <td className="num">{file.payloads[i].Credit_Score}</td>
                      {r.ok ? (
                        <>
                          <td><span className={`prob-cell band-${riskBand(r.default_probability)}`}><span className="prob-bar"><span style={{ width: `${r.default_probability * 100}%` }} /></span>{pct(r.default_probability)}</span></td>
                          <td><span className={`badge band-${r.risk_level.toLowerCase()}`}>{r.prediction}</span></td>
                        </>
                      ) : (
                        <td colSpan={2} className="cell-error">{r.error}</td>
                      )}
                    </tr>
                  ))}
                  {!slice.length && <tr><td colSpan={6} className="cell-empty">No rows match this filter.</td></tr>}
                </tbody>
              </table>
            </div>
            {pages > 1 && (
              <div className="pager">
                <button className="btn btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
                <span>Page {page + 1} of {pages}</span>
                <button className="btn btn-sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
