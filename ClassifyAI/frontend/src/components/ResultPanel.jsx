import AllModelsResult from "./AllModelsResult";
import PredictionResult from "./PredictionResult";
import Segmented from "./Segmented";
import SensitivityPanel from "./SensitivityPanel";

const TABS = [
  { value: "score", label: "Score" },
  { value: "all", label: "All models" },
  { value: "whatif", label: "What-if" },
];

// The dark "instrument" on the right of the assessment page. Holds the three result views.
export default function ResultPanel({
  tab, setTab, busy, loadingModel, result, previous, payload, allResults,
  options, modelName, onCompareAll,
}) {
  return (
    <aside className="instrument" aria-label="Assessment result">
      <Segmented role="tablist" label="Result views" options={TABS} value={tab} onChange={setTab} className="segmented-panel" />
      <div className="instrument-body" role="tabpanel">
        {tab === "score" && (
          <PredictionResult
            result={result} previous={previous} payload={payload}
            loading={busy === "predict"} loadingModel={loadingModel} modelName={modelName}
          />
        )}
        {tab === "all" && (
          <AllModelsResult
            results={allResults} loading={busy === "all"} modelName={modelName}
            onRun={onCompareAll} disabled={busy !== null}
          />
        )}
        {tab === "whatif" && (
          <SensitivityPanel
            payload={payload} options={options}
            model={result?.model ?? payload?.model} modelName={modelName}
          />
        )}
      </div>
    </aside>
  );
}
