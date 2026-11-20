import { useMemo, useState } from "react";
import GroupedBars from "../charts/GroupedBars";
import MetricBars from "../charts/MetricBars";
import ScatterChart from "../charts/ScatterChart";
import ModelComparison from "../components/ModelComparison";
import PageHeader from "../components/PageHeader";
import Segmented from "../components/Segmented";
import { useApp } from "../context/AppContext";
import { METRICS } from "../labels";
import { compactPkr, dateTime, num, pkr } from "../utils/format";

const formatMetric = (key, v) => (key === "r2" ? v.toFixed(3) : key === "mape" ? `${v.toFixed(1)}%` : num(v));

export default function ModelsPage() {
  const { info, modelName } = useApp();
  const rows = info.comparison;
  const [metricKey, setMetricKey] = useState("r2");

  const chosen = rows.find((r) => r.model === info.best_model) ?? rows[0];
  const activeMetric = METRICS.find((m) => m.key === metricKey);
  const testRows = Math.ceil(info.n_rows * info.test_size);

  // Plain-language insight, calculated from the numbers rather than written by hand.
  const insight = useMemo(() => {
    const bestFit = rows.reduce((a, b) => (b.r2 > a.r2 ? b : a));
    const smallest = rows.reduce((a, b) => (b.mae < a.mae ? b : a));
    const worst = rows.reduce((a, b) => (b.mae > a.mae ? b : a));
    const lead = bestFit.model === smallest.model
      ? `${modelName(bestFit.model)} leads on both fit (R\u00B2 ${bestFit.r2.toFixed(3)}) and typical error (${pkr(smallest.mae)}).`
      : `${modelName(bestFit.model)} fits best (R\u00B2 ${bestFit.r2.toFixed(3)}) while ${modelName(smallest.model)} has the smallest typical error (${pkr(smallest.mae)}).`;
    return `${lead} ${modelName(worst.model)} is the least precise, off by ${pkr(worst.mae)} on average.`;
  }, [rows, modelName]);

  return (
    <>
      <PageHeader title="Model lab">
        {rows.length} regressors were tuned with cross-validation and scored on salaries they never saw. Explore how they compare and where each one struggles.
      </PageHeader>

      <section className="stat-strip" aria-label="Training summary">
        <div><span className="stat-label">Selected model</span><strong>{modelName(info.best_model)}</strong><small>lowest cross-validated RMSE</small></div>
        <div><span className="stat-label">Test R&sup2;</span><strong>{chosen.r2.toFixed(3)}</strong><small>1.0 would be a perfect fit</small></div>
        <div>
          <span className="stat-label">Typical error</span><strong>{pkr(chosen.mae)}</strong>
          <small>{info.target_mean ? `${((chosen.mae / info.target_mean) * 100).toFixed(0)}% of the average salary` : "per month"}</small>
        </div>
        <div><span className="stat-label">Trained</span><strong>{dateTime(info.trained_at)}</strong><small>on {num(info.n_rows)} rows, {num(testRows)} held out</small></div>
      </section>

      <div className="split">
        <section className="panel">
          <div className="panel-head">
            <h2>Leaderboard</h2>
            <Segmented label="Metric" value={metricKey} onChange={setMetricKey} className="segmented-wrap"
              options={METRICS.map((m) => ({ value: m.key, label: m.short }))} />
          </div>
          <MetricBars
            better={activeMetric.better} fullScale={metricKey === "r2" ? 1 : undefined}
            format={(v) => formatMetric(metricKey, v)}
            rows={rows.map((r) => ({ id: r.model, name: modelName(r.model), value: r[metricKey] }))}
          />
          <p className="panel-note">
            <strong>{activeMetric.title}.</strong> {activeMetric.help} {activeMetric.better === "min" ? "Lower is better." : "Higher is better."}
          </p>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Error against fit</h2></div>
          <ScatterChart
            xLabel="Typical error, MAE (PKR)" yLabel="R² (fit)"
            formatX={compactPkr} formatY={(v) => v.toFixed(2)}
            points={rows.map((r) => ({ id: r.model, name: modelName(r.model), x: r.mae, y: r.r2 }))}
          />
          <p className="panel-note">The best models sit at the top left: a high fit with a small typical error. {insight}</p>
        </section>
      </div>

      <div className="split">
        <section className="panel">
          <div className="panel-head"><h2>Does it hold up on new data?</h2></div>
          <GroupedBars
            labelA="Cross-validation RMSE" labelB="Test RMSE"
            rows={rows.map((r) => ({ id: r.model, name: modelName(r.model), a: r.cv_rmse, b: r.rmse }))}
          />
          <p className="panel-note">
            Two bars of similar length mean the model behaves the same on data it has never seen. A test bar much longer than its
            cross-validation bar would suggest overfitting.
          </p>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Reading the numbers</h2></div>
          <dl className="explain">
            <div><dt>MAE {pkr(chosen.mae)}</dt><dd>On average the selected model is this far from the true monthly salary. It sets the typical range shown around every estimate.</dd></div>
            <div><dt>RMSE {pkr(chosen.rmse)}</dt><dd>Larger than MAE because big misses count extra. A wide gap between the two means a few estimates are far off.</dd></div>
            <div><dt>MAPE {chosen.mape.toFixed(1)}%</dt><dd>The same average mistake expressed as a share of the true salary.</dd></div>
          </dl>
          <p className="panel-note">
            SVR tends to pull very junior and very senior profiles toward the middle. The <em>All models</em> tab on the estimate page makes this
            visible, and Ridge or Lasso are the safer choice for the extremes.
          </p>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head"><h2>Full results</h2></div>
        <ModelComparison info={info} modelName={modelName} />
        <p className="panel-note">
          Click a column to re-sort. Errors are in PKR per month, measured on the held-out test set.
          {info.log_target && " Each model learns the logarithm of salary and converts its answer back to PKR, because salaries are right-skewed."}
        </p>
      </section>
    </>
  );
}
