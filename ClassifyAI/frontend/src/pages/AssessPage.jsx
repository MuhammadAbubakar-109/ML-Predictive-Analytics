import { useEffect, useRef, useState } from "react";
import InputForm from "../components/InputForm";
import PageHeader from "../components/PageHeader";
import ResultPanel from "../components/ResultPanel";
import { useApp } from "../context/AppContext";
import { useHistory } from "../context/HistoryContext";
import { useToast } from "../context/ToastContext";
import useHotkeys from "../hooks/useHotkeys";
import { predict, predictAll } from "../services/api";
import { PRESETS, applyPreset, buildPayload, initialValues, sanitize, validate } from "../utils/payload";

const STORAGE_KEY = "lc.form";

export default function AssessPage() {
  const { models, options, modelName, draft, setDraft } = useApp();
  const history = useHistory();
  const toast = useToast();
  const sideRef = useRef(null);

  // The form is remembered between visits.
  const [values, setValues] = useState(() => {
    try { return sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY)), options, models); }
    catch { return initialValues(options, models); }
  });
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); } catch { /* ignore */ }
  }, [values]);

  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState(null); // null | "predict" | "all"
  const [error, setError] = useState("");
  const [tab, setTab] = useState("score");
  const [result, setResult] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [payload, setPayload] = useState(null);
  const [allResults, setAllResults] = useState(null);

  const errors = showErrors ? validate(values, options) : {};

  // Other pages can ask this page to load values (reuse a past assessment, load an example...).
  useEffect(() => {
    if (!draft) return;
    if (draft.values) setValues(sanitize(draft.values, options, models));
    if (draft.preset) setValues((v) => applyPreset(v, PRESETS[draft.preset], options));
    if (draft.reset) setValues(initialValues(options, models));
    setShowErrors(false);
    setDraft(null);
  }, [draft, options, models, setDraft]);

  async function run(withAll) {
    const found = validate(values, options);
    if (Object.keys(found).length) {
      setShowErrors(true);
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }
    const body = buildPayload(values, options);
    setBusy(withAll ? "all" : "predict");
    setTab(withAll ? "all" : "score");
    setError("");
    if (window.innerWidth < 1100) sideRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    try {
      const [single, all] = await Promise.all([predict(body), withAll ? predictAll(body) : null]);
      if (result) setPrevious({ probability: result.default_probability, model: result.model });
      setResult(single);
      setPayload(body);
      setAllResults(all ? all.results : null);
      history.add(body, single);
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  useHotkeys([{ key: "enter", mod: true, handler: () => busy === null && run(false) }]);

  return (
    <>
      <PageHeader title="Assess a loan application">
        Estimate the chance that an applicant defaults, then check how stable that answer is across models and inputs.
      </PageHeader>

      {error && <div className="alert" role="alert">{error}</div>}

      <div className="assess-grid">
        <InputForm
          options={options} models={models} values={values} setValues={setValues}
          errors={errors} busy={busy}
          onSubmit={() => run(false)} onCompareAll={() => run(true)}
          onPreset={(key) => { setValues((v) => applyPreset(v, PRESETS[key], options)); setShowErrors(false); }}
          onReset={() => { setValues(initialValues(options, models)); setShowErrors(false); }}
        />
        <div className="assess-side" ref={sideRef}>
          <ResultPanel
            tab={tab} setTab={setTab} busy={busy} loadingModel={modelName(values.model)}
            result={result} previous={previous} payload={payload} allResults={allResults}
            options={options} modelName={modelName} onCompareAll={() => run(true)}
          />
        </div>
      </div>
    </>
  );
}
