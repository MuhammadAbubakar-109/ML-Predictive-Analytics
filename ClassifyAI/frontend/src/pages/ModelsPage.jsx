import { useMemo, useState } from "react";
import ConfusionMatrix from "../charts/ConfusionMatrix";
import MetricBars from "../charts/MetricBars";
import RadarChart from "../charts/RadarChart";
import ScatterChart from "../charts/ScatterChart";
import ModelComparison from "../components/ModelComparison";
import PageHeader from "../components/PageHeader";
import Segmented from "../components/Segmented";
import { useApp } from "../context/AppContext";
import { METRICS, modelColor } from "../labels";
import { dateTime, metric, num, pct } from "../utils/format";

const RADAR_AXES = [
  { key: "test_accuracy", label: "Accuracy" },
  { key: "test_precision", label: "Precision" },
  { key: "test_recall", label: "Recall" },
  { key: "test_f1", label: "F1" },
  { key: "test_roc_auc", label: "ROC-AUC" },
];

export default function ModelsPage() {
  const { info, modelName } = useApp();
  const rows = info.comparison;
  const [metricKey, setMetricKey] = useState("test_roc_auc");
  const [shown, setShown] = useState(() => rows.map((r) => r.model));
  const [matrixId, setMatrixId] = useState(info.best_model);

  const chosen = rows.find((r) => r.model === info.best_model) ?? rows[0];
  const testSize = rows[0].test_confusion_matrix.flat().reduce((a, b) => a + b, 0);
  const activeMetric = METRICS.find((m) => m.key === metricKey);
  const matrixRow = rows.find((r) => r.model === matrixId) ?? rows[0];
  const [, [missed, caught]] = matrixRow.test_confusion_matrix;

  // Plain-language insight, calculated from the numbers rather than written by hand.
  const insight = useMemo(() => {
    const cautious = rows.reduce((a, b) => (b.test_precision > a.test_precision ? b : a));
    const thorough = rows.reduce((a, b) => (b.test_recall > a.test_recall ? b : a));
    if (cautious.model === thorough.model) return null;
    return `${modelName(cautious.model)} is the most cautious: when it flags a default it is right ${pct(cautious.test_precision, 0)} of the time, but it only catches ${pct(cautious.test_recall, 0)} of real defaults. ${modelName(thorough.model)} catches the most (${pct(thorough.test_recall, 0)}) at lower precision (${pct(thorough.test_precision, 0)}).`;
  }, [rows, modelName]);

  const toggle = (id) =>
    setShown((s) => (s.includes(id) ? (s.length > 1 ? s.filter((x) => x !== id) : s) : [...s, id]));

  return (
    <>
      <PageHeader title="Model lab">
        Five classifiers were tuned with cross-validation and scored on loans they never saw. Explore how they compare and where each one fails.
      </PageHeader>

      <section className="stat-strip" aria-label="Training summary">
        <div><span className="stat-label">Selected model</span><strong>{modelName(info.best_model)}</strong><small>highest cross-validated ROC-AUC</small></div>
        <div><span className="stat-label">Test ROC-AUC</span><strong>{metric(chosen.test_roc_auc)}</strong><small>0.5 is a coin flip</small></div>
        <div><span className="stat-label">Test loans</span><strong>{num(testSize)}</strong><small>held back from training</small></div>
        <div><span className="stat-label">Trained</span><strong>{dateTime(info.trained_at)}</strong><small>on {num(info.n_rows)} loans</small></div>
      </section>

      <div className="split">
        <section className="panel">
          <div className="panel-head">
            <h2>Leaderboard</h2>
            <Segmented label="Metric" value={metricKey} onChange={setMetricKey} className="segmented-wrap"
              options={METRICS.map((m) => ({ value: m.key, label: m.short }))} />
          </div>
          <MetricBars rows={rows.map((r) => ({ id: r.model, name: modelName(r.model), value: r[metricKey] }))} />
          <p className="panel-note"><strong>{activeMetric.title}.</strong> {activeMetric.help}</p>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Precision against recall</h2></div>
          <ScatterChart xLabel="Recall (defaults caught)" yLabel="Precision (flags that are right)"
            points={rows.map((r) => ({ id: r.model, name: modelName(r.model), x: r.test_recall, y: r.test_precision }))} />
          {insight && <p className="panel-note">{insight}</p>}
        </section>
      </div>

      <div className="split">
        <section className="panel">
          <div className="panel-head"><h2>Shape of each model</h2></div>
          <RadarChart axes={RADAR_AXES} min={0.4} series={rows.filter((r) => shown.includes(r.model)).map((r) => ({
            id: r.model, values: Object.fromEntries(RADAR_AXES.map((a) => [a.key, r[a.key]])),
          }))} />
          <div className="legend" role="group" aria-label="Models shown in the radar chart">
            {rows.map((r) => (
              <button key={r.model} type="button" className={`legend-item${shown.includes(r.model) ? " is-on" : ""}`}
                aria-pressed={shown.includes(r.model)} onClick={() => toggle(r.model)}>
                <i style={{ background: modelColor(r.model) }} />{modelName(r.model)}
              </button>
            ))}
          </div>
          <p className="panel-note">The centre of the chart is 0.40, not zero, so small differences are easier to see.</p>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Where it goes wrong</h2>
            <div className="select-wrap select-sm">
              <select aria-label="Model for the confusion matrix" value={matrixId} onChange={(e) => setMatrixId(e.target.value)}>
                {rows.map((r) => <option key={r.model} value={r.model}>{modelName(r.model)}</option>)}
              </select>
            </div>
          </div>
          <ConfusionMatrix matrix={matrixRow.test_confusion_matrix} />
          <p className="panel-note">
            Of {num(missed + caught)} loans that really defaulted, {modelName(matrixId)} caught {num(caught)} ({pct(caught / (missed + caught))}) and missed {num(missed)}.
            Each missed default is usually costlier than a rejected good loan.
          </p>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head"><h2>Full results</h2></div>
        <ModelComparison info={info} modelName={modelName} />
        <p className="panel-note">
          Sorted by cross-validated ROC-AUC by default; click a column to re-sort. The decision threshold is 0.5. In a real lending setting it
          should be tuned to the relative cost of missed defaults and rejected good loans.
        </p>
      </section>
    </>
  );
}
