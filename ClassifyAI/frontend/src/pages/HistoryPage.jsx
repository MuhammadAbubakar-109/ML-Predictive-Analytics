import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import Sparkline from "../charts/Sparkline";
import { useApp } from "../context/AppContext";
import { useHistory } from "../context/HistoryContext";
import { useToast } from "../context/ToastContext";
import { downloadText, toCsv } from "../utils/csv";
import { num, pct, timeAgo } from "../utils/format";
import { riskBand } from "../utils/risk";

export default function HistoryPage({ navigate }) {
  const { entries, remove, clear } = useHistory();
  const { modelName, setDraft } = useApp();
  const toast = useToast();

  function reuse(entry) {
    setDraft({ values: entry.payload });
    navigate("assess");
  }

  function exportCsv() {
    const columns = ["time", "model", "default_probability", "risk_level", "prediction", ...Object.keys(entries[0].payload).filter((k) => k !== "model")];
    const rows = entries.map((e) => ({
      time: new Date(e.ts).toISOString(), model: e.result.model,
      default_probability: e.result.default_probability, risk_level: e.result.risk_level,
      prediction: e.result.prediction, ...e.payload,
    }));
    downloadText("assessment-history.csv", toCsv(rows, columns));
    toast.success("History exported");
  }

  if (!entries.length) {
    return (
      <>
        <PageHeader title="History">Every assessment you run is saved here, in this browser only.</PageHeader>
        <EmptyState icon="clock" title="No assessments yet"
          action={<button className="btn btn-primary" onClick={() => navigate("assess")}>Run your first assessment</button>}>
          Results appear here so you can compare runs, reuse their inputs, or export them.
        </EmptyState>
      </>
    );
  }

  const probs = entries.map((e) => e.result.default_probability);
  const average = probs.reduce((a, b) => a + b, 0) / probs.length;
  const defaults = entries.filter((e) => e.result.prediction === "Default").length;

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
        {entries.length} saved {entries.length === 1 ? "assessment" : "assessments"}, stored only in this browser.
      </PageHeader>

      <section className="stat-strip" aria-label="History summary">
        <div><span className="stat-label">Average probability</span><strong>{pct(average)}</strong><small>across all saved runs</small></div>
        <div><span className="stat-label">Predicted defaults</span><strong>{defaults} of {entries.length}</strong><small>at the 50% decision line</small></div>
        <div className="stat-trend"><span className="stat-label">Trend, oldest to newest</span><Sparkline values={[...probs].reverse()} width={180} height={40} /></div>
      </section>

      <section className="panel table-panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th><th>Model</th><th>Probability</th><th>Verdict</th>
                <th className="num">Loan amount</th><th className="num">Income</th><th className="num">Credit score</th><th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const p = e.result.default_probability;
                return (
                  <tr key={e.id}>
                    <td title={new Date(e.ts).toLocaleString()}>{timeAgo(e.ts)}</td>
                    <td>{modelName(e.result.model)}</td>
                    <td>
                      <span className={`prob-cell band-${riskBand(p)}`}>
                        <span className="prob-bar"><span style={{ width: `${p * 100}%` }} /></span>
                        {pct(p)}
                      </span>
                    </td>
                    <td><span className={`badge band-${e.result.risk_level.toLowerCase()}`}>{e.result.prediction}</span></td>
                    <td className="num">{num(e.payload.loan_amount)}</td>
                    <td className="num">{num(e.payload.income)}</td>
                    <td className="num">{e.payload.Credit_Score}</td>
                    <td className="row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => reuse(e)}><Icon name="reset" size={14} /> Reuse inputs</button>
                      <button className="icon-btn" aria-label="Delete this assessment" onClick={() => remove(e.id)}><Icon name="trash" size={15} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
