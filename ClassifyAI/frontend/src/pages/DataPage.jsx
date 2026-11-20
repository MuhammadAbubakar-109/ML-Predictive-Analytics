import PageHeader from "../components/PageHeader";
import { useApp } from "../context/AppContext";
import { EXCLUSION_GROUPS, EXCLUSION_REASONS, FIELD_GROUPS, fieldLabel } from "../labels";
import { num, pct } from "../utils/format";
import { LOW_BELOW, MEDIUM_BELOW, DECISION } from "../utils/risk";

const PIPELINE = [
  ["Application", "The fields you enter"],
  ["Add loan-to-income", "Loan amount divided by income"],
  ["Fill gaps", "Median for numbers, most common value for categories"],
  ["Scale and encode", "Numbers standardised, categories one-hot encoded"],
  ["Model", "Returns a probability of default"],
  ["Risk band", "Low, medium or high"],
];

export default function DataPage() {
  const { info, options } = useApp();
  const testSize = info.comparison[0].test_confusion_matrix.flat().reduce((a, b) => a + b, 0);
  const featureCount = info.features.length;

  const grouped = {};
  for (const col of info.excluded_leaky_columns) {
    const key = EXCLUSION_REASONS[col] ?? "other";
    (grouped[key] ??= []).push(col);
  }

  return (
    <>
      <PageHeader title="Data and safeguards">
        What the models learned from, what was deliberately kept away from them, and how an application becomes a score.
      </PageHeader>

      <section className="stat-strip" aria-label="Dataset summary">
        <div><span className="stat-label">Loans</span><strong>{num(info.n_rows)}</strong><small>after removing unlabelled rows</small></div>
        <div><span className="stat-label">Default rate</span><strong>{pct(info.default_rate)}</strong><small>balanced class weights where supported</small></div>
        <div><span className="stat-label">Inputs</span><strong>{featureCount}</strong><small>{Object.keys(options.numeric).length} numeric, {Object.keys(options.categorical).length} categorical</small></div>
        <div><span className="stat-label">Held-out test</span><strong>{num(testSize)}</strong><small>{pct(testSize / info.n_rows, 0)} of loans, never trained on</small></div>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>Class balance</h2></div>
        <div className="balance" role="img" aria-label={`${pct(info.default_rate)} of loans defaulted`}>
          <span className="balance-repaid" style={{ width: `${(1 - info.default_rate) * 100}%` }}>Repaid {pct(1 - info.default_rate)}</span>
          <span className="balance-default" style={{ width: `${info.default_rate * 100}%` }}>Default {pct(info.default_rate)}</span>
        </div>
        <p className="panel-note">
          Only about one loan in four defaults, so a model that always answers &ldquo;no default&rdquo; would already be right three times in four.
          That is why precision, recall and ROC-AUC matter more than accuracy here.
        </p>
      </section>

      <section className="panel leak">
        <div className="panel-head"><h2>Data leakage: what was kept out</h2></div>
        <p className="lede">
          Some columns reveal the outcome because they are only filled in after a loan is decided. Training on them gives roughly 99% accuracy that would
          collapse on a real application, so {info.excluded_leaky_columns.length} columns are excluded, and a test guards against adding them back.
        </p>
        <div className="leak-grid">
          {Object.entries(grouped).map(([key, cols]) => {
            const group = EXCLUSION_GROUPS[key] ?? { title: "Other exclusions", text: "Removed in configs/config.yaml." };
            return (
              <div className="leak-group" key={key}>
                <h3>{group.title}</h3>
                <p>{group.text}</p>
                <div className="tag-row">{cols.map((c) => <code key={c}>{c}</code>)}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>From application to score</h2></div>
        <ol className="pipeline">
          {PIPELINE.map(([title, text]) => (
            <li key={title}><strong>{title}</strong><span>{text}</span></li>
          ))}
        </ol>
      </section>

      <div className="split">
        <section className="panel">
          <div className="panel-head"><h2>Inputs the models use</h2></div>
          {FIELD_GROUPS.map((g) => (
            <div className="feature-group" key={g.id}>
              <h3>{g.title}</h3>
              <div className="tag-row">
                {g.fields.filter((f) => info.features.includes(f)).map((f) => (
                  <span key={f} className={`tag${options.numeric[f] ? " is-numeric" : ""}`} title={options.numeric[f] ? "Numeric" : "Categorical"}>{fieldLabel(f)}</span>
                ))}
              </div>
            </div>
          ))}
          <p className="panel-note">Filled tags are numeric inputs. The models also derive <code>loan_to_income</code> from two of them.</p>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>How to read a score</h2></div>
          <div className="bands">
            <div className="band-row band-low"><i /><span><strong>Low risk</strong> below {pct(LOW_BELOW, 0)}</span></div>
            <div className="band-row band-medium"><i /><span><strong>Medium risk</strong> {pct(LOW_BELOW, 0)} to {pct(MEDIUM_BELOW, 0)}</span></div>
            <div className="band-row band-high"><i /><span><strong>High risk</strong> {pct(MEDIUM_BELOW, 0)} and above</span></div>
          </div>
          <p className="panel-note">
            The verdict is separate from the band: a loan is predicted to default when its probability reaches {pct(DECISION, 0)}.
            A probability describes the model&rsquo;s confidence from past data. It is not a guarantee about one borrower.
          </p>
        </section>
      </div>
    </>
  );
}
