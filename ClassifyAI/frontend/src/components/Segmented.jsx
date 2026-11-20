// A row of mutually exclusive buttons. Use role="tablist" for tabs, "radiogroup" for choices.
export default function Segmented({ options, value, onChange, label, role = "radiogroup", className = "" }) {
  const isTabs = role === "tablist";

  function onKeyDown(e) {
    const i = options.findIndex((o) => o.value === value);
    let next = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % options.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + options.length) % options.length;
    else return;
    e.preventDefault();
    onChange(options[next].value);
    e.currentTarget.querySelectorAll("button")[next]?.focus();
  }

  return (
    <div className={`segmented ${className}`} role={role} aria-label={label} onKeyDown={onKeyDown}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value} type="button"
            role={isTabs ? "tab" : "radio"}
            aria-selected={isTabs ? active : undefined}
            aria-checked={isTabs ? undefined : active}
            tabIndex={active ? 0 : -1}
            className={`segmented-item${active ? " is-active" : ""}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
