import PageHeader from "../components/PageHeader";
import { useApp } from "../context/AppContext";
import { CORE_FIELDS, ESSENTIALS, OPTIONAL_GROUPS, fieldLabel } from "../labels";
import { num, pkr } from "../utils/format";

export default function DataPage() {
  const { info, options } = useApp();
  const featureCount = info.features.length;
  const testRows = Math.ceil(info.n_rows * info.test_size);
  const chosen = info.comparison.find((r) => r.model === info.best_model) ?? info.comparison[0];

  const pipeline = [
    ["Employee profile", "The details you enter"],
    ["Fill gaps", "Median for numbers, most common value for text, plus a \u201Cwas missing\u201D flag"],
    ["Scale and encode", "Numbers standardised, text turned into one-hot columns"],
    ["Model", info.log_target ? "Predicts the logarithm of salary" : "Predicts the salary"],
    ...(info.log_target ? [["Back to PKR", "The logarithm is converted into rupees"]] : []),
    ["Typical range", "Estimate plus or minus the model\u2019s average error"],
  ];

  const groups = [{ id: "core", title: "Essentials (required)", fields: ESSENTIALS }, ...OPTIONAL_GROUPS];

  return (
    <>
      <PageHeader title="Data and method">
        What the models learned from, which details they use, and how a profile becomes an estimate.
      </PageHeader>

      <section className="stat-strip" aria-label="Dataset summary">
        <div><span className="stat-label">Rows used</span><strong>{num(info.n_rows)}</strong><small>after removing duplicates and empty salaries</small></div>
        <div><span className="stat-label">Average salary</span><strong>{info.target_mean ? pkr(info.target_mean) : "\u2013"}</strong><small>per month, in the data</small></div>
        <div><span className="stat-label">Inputs</span><strong>{featureCount}</strong><small>{Object.keys(options.numeric).length} numeric, {Object.keys(options.categorical).length} text</small></div>
        <div><span className="stat-label">Held-out test</span><strong>{num(testRows)}</strong><small>{Math.round(info.test_size * 100)}% of rows, never trained on</small></div>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>From profile to estimate</h2></div>
        <ol className="pipeline">
          {pipeline.map(([title, text]) => (
            <li key={title}><strong>{title}</strong><span>{text}</span></li>
          ))}
        </ol>
        {info.log_target && (
          <p className="panel-note">
            <strong>Why a logarithm?</strong> Salaries are right-skewed: a few very high earners stretch the scale. Learning on a log scale
            makes percentage differences count equally for junior and senior roles, which usually suits pay data better.
          </p>
        )}
      </section>

      <div className="split">
        <section className="panel">
          <div className="panel-head"><h2>Inputs the models use</h2></div>
          {groups.map((g) => (
            <div className="feature-group" key={g.id}>
              <h3>{g.title}</h3>
              <div className="tag-row">
                {g.fields.filter((f) => info.features.includes(f)).map((f) => (
                  <span key={f} className={`tag${options.numeric[f] ? " is-numeric" : ""}${CORE_FIELDS.includes(f) ? " is-core" : ""}`}
                    title={options.numeric[f] ? "Numeric" : "Text choice"}>{fieldLabel(f)}</span>
                ))}
              </div>
            </div>
          ))}
          <p className="panel-note">Filled tags are numeric inputs. Only the five essentials are required; anything left blank is filled in with a typical value.</p>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Not used as inputs</h2></div>
          <p className="lede">
            {info.excluded_columns.length
              ? "These columns identify a person or never change, so they carry no information about pay:"
              : "Every column in the dataset is used."}
          </p>
          <div className="tag-row">{info.excluded_columns.map((c) => <code key={c}>{c}</code>)}</div>
          <div className="trust">
            <h3>How much to trust an estimate</h3>
            <p>
              The selected model is off by {pkr(chosen.mae)} per month on average (R&sup2; {chosen.r2.toFixed(3)}).
              It describes patterns in this dataset, so treat an estimate as a starting point for a conversation about pay, not as a verdict on what someone deserves.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
