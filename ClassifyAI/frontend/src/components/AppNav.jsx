import Icon from "./Icon";

export const PAGES = [
  { id: "assess", label: "Assess", icon: "gauge" },
  { id: "batch", label: "Batch", icon: "layers" },
  { id: "models", label: "Models", icon: "chart" },
  { id: "data", label: "Data", icon: "shield" },
  { id: "history", label: "History", icon: "clock" },
];

export function BrandMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="brand-mark">
      <rect width="32" height="32" rx="9" />
      <path d="M7 21a9 9 0 1 1 18 0" />
      <path d="M16 21l5-7" className="needle" />
    </svg>
  );
}

// Left rail on wide screens, tab bar along the bottom on phones.
export default function AppNav({ route, onNavigate, historyCount }) {
  return (
    <nav className="nav" aria-label="Main">
      <a className="brand" href="#/assess" onClick={() => onNavigate("assess")}>
        <BrandMark />
        <span><strong>Default</strong><small>Loan risk desk</small></span>
      </a>
      <ul>
        {PAGES.map((p) => (
          <li key={p.id}>
            <a href={`#/${p.id}`} className={route === p.id ? "is-active" : ""} aria-current={route === p.id ? "page" : undefined}>
              <Icon name={p.icon} size={19} />
              <span>{p.label}</span>
              {p.id === "history" && historyCount > 0 && <em className="count">{historyCount}</em>}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
