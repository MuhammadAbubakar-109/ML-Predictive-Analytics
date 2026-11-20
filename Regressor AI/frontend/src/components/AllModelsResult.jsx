import SalaryStrip from "../charts/SalaryStrip";
import { modelColor } from "../labels";
import { num, pkr } from "../utils/format";
import EmptyState from "./EmptyState";

export default function AllModelsResult({ results, loading, onRun, modelName, disabled, bestModel }) {
  if (!results) {
    return (
      <EmptyState icon="layers" title={loading ? "Estimating with every model…" : "See how much the models agree"}
        action={!loading && <button className="btn btn-sm" onClick={onRun} disabled={disabled}>Compare all models</button>}>
        {loading ? "This takes a moment." : "Runs the same profile through every trained model and plots the answers on one salary scale."}
      </EmptyState>
    );
  }

  const values = results.map((r) => r.monthly_salary_pkr);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const middle = [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const spread = middle > 0 ? (hi - lo) / middle : 0;
  const reference = results.find((r) => r.model === bestModel)?.monthly_salary_pkr ?? middle;

  return (
    <div className="all-models">
      <SalaryStrip rows={results.map((r) => ({ id: r.model, name: modelName(r.model), value: r.monthly_salary_pkr }))} />
      <p className="result-note">
        Lowest <strong>{pkr(lo)}</strong>, highest <strong>{pkr(hi)}</strong>, a gap of {pkr(hi - lo)} per month.
        {spread > 0.5 && " The models disagree a lot on this profile, so treat the estimate with caution."}
      </p>
      <table className="mini-table">
        <thead><tr><th>Model</th><th className="num">Monthly (PKR)</th><th className="num">vs best</th></tr></thead>
        <tbody>
          {results.map((r) => {
            const diff = r.monthly_salary_pkr - reference;
            return (
              <tr key={r.model}>
                <td><i className="dot" style={{ background: modelColor(r.model) }} />{modelName(r.model)}{r.model === bestModel && <span className="badge">best</span>}</td>
                <td className="num">{num(r.monthly_salary_pkr)}</td>
                <td className="num">{r.model === bestModel ? "\u2013" : `${diff >= 0 ? "+" : "\u2212"}${num(Math.abs(diff))}`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
