import { useMemo, useRef, useState } from "react";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import PageHeader from "../components/PageHeader";
import Segmented from "../components/Segmented";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { CORE_FIELDS, INTEGER_FIELDS, PRESETS } from "../labels";
import { predictSalary } from "../services/api";
import { downloadText, parseCsv, toCsv } from "../utils/csv";
import { compactPkr, num, pkr } from "../utils/format";
import { applyPreset, initialValues } from "../utils/payload";

const MAX_ROWS = 500;
const PAGE_SIZE = 25;
const PARALLEL = 6;
const BINS = 8;

export default function BatchPage() {
  const { models, options, modelName } = useApp();
  const toast = useToast();
  const cancel = useRef(false);

  const [file, setFile] = useState(null); // { name, headers, rows, payloads, ignored, truncated, total }
  const [model, setModel] = useState(models.best_model);
  const [status, setStatus] = useState("idle"); // idle | running | done
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [order, setOrder] = useState("file");
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const columns = useMemo(() => [...Object.keys(options.numeric), ...Object.keys(options.categorical)], [options]);

  async function load(f) {
    setError("");
    if (!f) return;
    try {
      const { headers, rows } = parseCsv(await f.text());
      const missing = CORE_FIELDS.filter((c) => !headers.includes(c));
      if (missing.length) throw new Error(`Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`);
      if (!rows.length) throw new Error("The file has a header but no rows.");

      const truncated = rows.length > MAX_ROWS;
      const used = rows.slice(0, MAX_ROWS);
      const payloads = used.map((cells) => {
        const body = {};
        headers.forEach((h, i) => {
          const raw = (cells[i] ?? "").trim();
          if (!columns.includes(h) || raw === "") return;
          if (options.numeric[h]) body[h] = INTEGER_FIELDS.has(h) ? Math.round(Number(raw)) : Number(raw);
          else body[h] = raw;
        });
        return body;
      });
      setFile({ name: f.name, headers, rows: used, payloads, ignored: headers.filter((h) => !columns.includes(h)), truncated, total: rows.length });
      setResults([]); setStatus("idle"); setProgress(0); setPage(0); setOrder("file");
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
        try { out[i] = { ok: true, ...(await predictSalary({ ...file.payloads[i], model })) }; }
        catch (e) { out[i] = { ok: false, error: e.message }; }
        setProgress(++done);
      }
    };
    await Promise.all(Array.from({ length: PARALLEL }, worker));
    setResults(out.map((r) => r ?? { ok: false, error: "Stopped before this row" }));
    setStatus("done");
    if (!cancel.current) toast.success(`Estimated ${out.length} salaries`);
  }

  function template() {
    const rows = ["entry", "senior"].map((k) => {
      const filled = applyPreset(initialValues(options, models), k, options);
      // Only the essentials and the details a preset sets are useful in a template.
      const keep = new Set([...CORE_FIELDS, ...Object.keys(PRESETS[k].values)]);
      return Object.fromEntries(Object.entries(filled).filter(([c]) => keep.has(c) && c !== "model"));
    });
    const cols = [...CORE_FIELDS, ...columns.filter((c) => !CORE_FIELDS.includes(c))];
    downloadText("employee-profiles-template.csv", toCsv(rows, cols));
  }

  function exportResults() {
    const rows = file.rows.map((cells, i) => {
      const row = Object.fromEntries(file.headers.map((h, j) => [h, cells[j]]));
      const r = results[i];
      return {
        ...row,
        monthly_salary_pkr: r?.ok ? r.monthly_salary_pkr : "",
        annual_salary_pkr: r?.ok ? r.annual_salary_pkr : "",
        range_low_pkr: r?.ok ? r.range_low_pkr : "",
        range_high_pkr: r?.ok ? r.range_high_pkr : "",
        error: r?.ok ? "" : r?.error ?? "",
      };
    });
    downloadText("estimated-salaries.csv", toCsv(rows, [...file.headers, "monthly_salary_pkr", "annual_salary_pkr", "range_low_pkr", "range_high_pkr", "error"]));
  }

  const scored = results.filter((r) => r.ok);
  const failed = results.length - scored.length;
  const salaries = scored.map((r) => r.monthly_salary_pkr);
  const total = salaries.reduce((a, b) => a + b, 0);
  const average = salaries.length ? total / salaries.length : 0;
  const lowest = salaries.length ? Math.min(...salaries) : 0;
  const highest = salaries.length ? Math.max(...salaries) : 0;

  // A simple histogram of the estimated salaries.
  const bins = useMemo(() => {
    if (!salaries.length) return [];
    const width = (highest - lowest) / BINS || 1;
    const counts = Array.from({ length: BINS }, (_, i) => ({ from: lowest + i * width, count: 0 }));
    salaries.forEach((s) => { counts[Math.min(Math.floor((s - lowest) / width), BINS - 1)].count++; });
    return counts;
  }, [salaries, lowest, highest]);
  const tallest = Math.max(...bins.map((b) => b.count), 1);

  const ordered = results.map((r, i) => ({ r, i }));
  if (order !== "file") {
    ordered.sort((a, b) => {
      const av = a.r.ok ? a.r.monthly_salary_pkr : -1;
      const bv = b.r.ok ? b.r.monthly_salary_pkr : -1;
      return order === "high" ? bv - av : av - bv;
    });
  }
  const pages = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE));
  const slice = ordered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Batch estimates"
        actions={<button className="btn btn-sm" onClick={template}><Icon name="download" size={15} /> Download template</button>}
      >
        Estimate many salaries at once from a CSV file. The file never leaves your computer except for the calls to your own API.
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
            <small>{num(file.rows.length)} profiles ready. Drop another file to replace it.</small>
          </span>
        ) : (
          <span>
            <strong>Drop a CSV file here, or choose one</strong>
            <small>Required columns: {CORE_FIELDS.join(", ")}. Other columns are optional.</small>
          </span>
        )}
      </label>

      {file && (file.truncated || file.ignored.length > 0) && (
        <p className="inline-warning">
          {file.truncated && `Only the first ${MAX_ROWS} of ${num(file.total)} rows will be estimated. `}
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
            <button className="btn btn-primary" onClick={run}><Icon name="play" size={16} /> Estimate {num(file.rows.length)} salaries</button>
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
          Upload a CSV to see every salary estimated, summarised and ready to export.
        </EmptyState>
      )}

      {status === "done" && results.length > 0 && (
        <>
          <section className="stat-strip" aria-label="Batch summary">
            <div><span className="stat-label">Estimated</span><strong>{num(scored.length)}</strong><small>{failed ? `${failed} failed` : "no failures"}</small></div>
            <div><span className="stat-label">Average monthly</span><strong>{pkr(average)}</strong><small>{modelName(model)}</small></div>
            <div><span className="stat-label">Total monthly payroll</span><strong>{pkr(total)}</strong><small>sum of all estimates</small></div>
            <div><span className="stat-label">Lowest to highest</span><strong>{compactPkr(lowest)} to {compactPkr(highest)}</strong><small>per month</small></div>
          </section>

          <section className="panel">
            <div className="panel-head"><h2>Spread of estimates</h2></div>
            <div className="histogram" role="img" aria-label="Histogram of estimated monthly salaries">
              {bins.map((b, i) => (
                <div key={i} className="histogram-col" title={`${b.count} from ${pkr(b.from)}`}>
                  <span className="histogram-count">{b.count || ""}</span>
                  <span className="histogram-bar" style={{ height: `${(b.count / tallest) * 100}%` }} />
                  <span className="histogram-label">{compactPkr(b.from)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel table-panel">
            <div className="panel-head">
              <Segmented label="Sort results" value={order} onChange={(v) => { setOrder(v); setPage(0); }} className="segmented-wrap"
                options={[{ value: "file", label: "File order" }, { value: "high", label: "Highest first" }, { value: "low", label: "Lowest first" }]} />
              <button className="btn btn-sm" onClick={exportResults}><Icon name="download" size={15} /> Export estimates CSV</button>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th className="num">Row</th><th>Job title</th><th>Level</th><th className="num">Experience</th><th className="num">Monthly (PKR)</th><th className="num">Typical range</th></tr>
                </thead>
                <tbody>
                  {slice.map(({ r, i }) => (
                    <tr key={i}>
                      <td className="num">{i + 1}</td>
                      <td>{file.payloads[i].Job_Title}</td>
                      <td>{file.payloads[i].Job_Level}</td>
                      <td className="num">{file.payloads[i].Experience_Years} yrs</td>
                      {r.ok ? (
                        <>
                          <td className="num"><strong>{num(r.monthly_salary_pkr)}</strong></td>
                          <td className="num muted-text">{compactPkr(r.range_low_pkr)} to {compactPkr(r.range_high_pkr)}</td>
                        </>
                      ) : (
                        <td colSpan={2} className="cell-error">{r.error}</td>
                      )}
                    </tr>
                  ))}
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
