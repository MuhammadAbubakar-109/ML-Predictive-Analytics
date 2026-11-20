import Sparkline from "../charts/Sparkline";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import PageHeader from "../components/PageHeader";
import { useApp } from "../context/AppContext";
import { useHistory } from "../context/HistoryContext";
import { useToast } from "../context/ToastContext";
import { downloadText, toCsv } from "../utils/csv";
import { compactPkr, num, pkr, timeAgo } from "../utils/format";

export default function HistoryPage({ navigate }) {
  const { entries, remove, clear } = useHistory();
  const { modelName, setDraft } = useApp();
  const toast = useToast();

  function reuse(entry) {
    setDraft({ values: entry.payload });
    navigate("estimate");
  }

  function exportCsv() {
    const inputs = [...new Set(entries.flatMap((e) => Object.keys(e.payload)))].filter((k) => k !== "model");
    const columns = ["time", "model", "monthly_salary_pkr", "annual_salary_pkr", "range_low_pkr", "range_high_pkr", ...inputs];
    const rows = entries.map((e) => ({
      time: new Date(e.ts).toISOString(), model: e.result.model,
      monthly_salary_pkr: e.result.monthly_salary_pkr, annual_salary_pkr: e.result.annual_salary_pkr,
      range_low_pkr: e.result.range_low_pkr, range_high_pkr: e.result.range_high_pkr, ...e.payload,
    }));
    downloadText("estimate-history.csv", toCsv(rows, columns));
    toast.success("History exported");
  }

  if (!entries.length) {
    return (
      <>
        <PageHeader title="History">Every estimate you run is saved here, in this browser only.</PageHeader>
        <EmptyState icon="clock" title="No estimates yet"
          action={<button className="btn btn-primary" onClick={() => navigate("estimate")}>Run your first estimate</button>}>
          Results appear here so you can compare runs, reuse their inputs, or export them.
        </EmptyState>
      </>
    );
  }

  const salaries = entries.map((e) => e.result.monthly_salary_pkr);
  const average = salaries.reduce((a, b) => a + b, 0) / salaries.length;

  return (
    <>
      <PageHeader
        title="History"
        actions={
          <>
            <button className="btn btn-sm" onClick={exportCsv}><Icon name="download" size={15} /> Export CSV</button>
            <button className="btn btn-sm btn-danger" onClick={() => { clear(); toast.info("History cleared"); }}><Icon name="trash" size={15} /> Clear all</button>
          </>
        }
      >
        {entries.length} saved {entries.length === 1 ? "estimate" : "estimates"}, stored only in this browser.
      </PageHeader>

      <section className="stat-strip" aria-label="History summary">
        <div><span className="stat-label">Average estimate</span><strong>{pkr(average)}</strong><small>per month, across saved runs</small></div>
        <div><span className="stat-label">Highest</span><strong>{pkr(Math.max(...salaries))}</strong><small>per month</small></div>
        <div className="stat-trend"><span className="stat-label">Trend, oldest to newest</span><Sparkline values={[...salaries].reverse()} width={180} height={40} /></div>
      </section>

      <section className="panel table-panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th><th>Model</th><th>Profile</th><th className="num">Experience</th>
                <th className="num">Monthly (PKR)</th><th className="num">Typical range</th><th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td title={new Date(e.ts).toLocaleString()}>{timeAgo(e.ts)}</td>
                  <td>{modelName(e.result.model)}</td>
                  <td>{e.payload.Job_Title}<small className="cell-sub">{e.payload.Job_Level}, {e.payload.City}</small></td>
                  <td className="num">{e.payload.Experience_Years} yrs</td>
                  <td className="num"><strong>{num(e.result.monthly_salary_pkr)}</strong></td>
                  <td className="num muted-text">{compactPkr(e.result.range_low_pkr)} to {compactPkr(e.result.range_high_pkr)}</td>
                  <td className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => reuse(e)}><Icon name="reset" size={14} /> Reuse inputs</button>
                    <button className="icon-btn" aria-label="Delete this estimate" onClick={() => remove(e.id)}><Icon name="trash" size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
