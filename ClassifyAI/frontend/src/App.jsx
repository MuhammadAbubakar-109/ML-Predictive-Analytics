import { useMemo, useState } from "react";
import AppNav, { PAGES } from "./components/AppNav";
import CommandPalette from "./components/CommandPalette";
import EmptyState from "./components/EmptyState";
import ErrorBoundary from "./components/ErrorBoundary";
import Icon from "./components/Icon";
import Skeleton from "./components/Skeleton";
import StatusChip from "./components/StatusChip";
import ThemeToggle from "./components/ThemeToggle";
import { AppProvider, useApp } from "./context/AppContext";
import { HistoryProvider, useHistory } from "./context/HistoryContext";
import { ToastProvider } from "./context/ToastContext";
import useHashRoute from "./hooks/useHashRoute";
import useHotkeys from "./hooks/useHotkeys";
import useTheme from "./hooks/useTheme";
import AssessPage from "./pages/AssessPage";
import BatchPage from "./pages/BatchPage";
import DataPage from "./pages/DataPage";
import HistoryPage from "./pages/HistoryPage";
import ModelsPage from "./pages/ModelsPage";
import { API_BASE } from "./services/api";

function Loading() {
  return (
    <div className="loading" aria-busy="true" aria-label="Loading">
      <Skeleton height={34} width="42%" />
      <Skeleton height={16} width="64%" />
      <div className="loading-grid">
        <Skeleton height={420} radius={18} />
        <Skeleton height={420} radius={18} />
      </div>
    </div>
  );
}

function Problem({ status, error, reload }) {
  if (status === "empty") {
    return (
      <EmptyState icon="alert" title="The backend has no trained models yet"
        action={<button className="btn btn-primary" onClick={reload}><Icon name="refresh" size={16} /> Check again</button>}>
        Open a terminal in the project folder and run <code>make train</code>, then restart the API with <code>make api</code>.
      </EmptyState>
    );
  }
  return (
    <EmptyState icon="alert" title="Cannot reach the backend"
      action={<button className="btn btn-primary" onClick={reload}><Icon name="refresh" size={16} /> Try again</button>}>
      {error} Start it with <code>make api</code> and make sure it is listening at <code>{API_BASE}</code>.
    </EmptyState>
  );
}

function Shell() {
  const { status, error, reload, setDraft } = useApp();
  const { entries } = useHistory();
  const [route, navigate] = useHashRoute();
  const theme = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useHotkeys([{ key: "k", mod: true, handler: () => setPaletteOpen((o) => !o) }]);

  const commands = useMemo(
    () => [
      ...PAGES.map((p) => ({ id: `go-${p.id}`, label: `Go to ${p.label}`, icon: p.icon, hint: "Page", keywords: p.id, run: () => navigate(p.id) })),
      { id: "low", label: "Load the low-risk example", icon: "zap", hint: "Assess", keywords: "preset sample", run: () => { setDraft({ preset: "low" }); navigate("assess"); } },
      { id: "high", label: "Load the high-risk example", icon: "zap", hint: "Assess", keywords: "preset sample", run: () => { setDraft({ preset: "high" }); navigate("assess"); } },
      { id: "reset", label: "Reset the form to typical values", icon: "reset", hint: "Assess", keywords: "clear median", run: () => { setDraft({ reset: true }); navigate("assess"); } },
      { id: "theme", label: "Change theme", icon: "sun", hint: "System, light, dark", keywords: "dark light mode", run: theme.cycle },
      { id: "docs", label: "Open the API documentation", icon: "external", hint: "New tab", keywords: "swagger fastapi", run: () => window.open(`${API_BASE}/docs`, "_blank", "noopener") },
    ],
    [navigate, setDraft, theme.cycle]
  );

  const page = PAGES.find((p) => p.id === route);

  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <AppNav route={route} onNavigate={navigate} historyCount={entries.length} />

      <div className="stage">
        <div className="topbar">
          <span className="topbar-title">{page.label}</span>
          <button className="palette-trigger" onClick={() => setPaletteOpen(true)} aria-label="Open command palette">
            <Icon name="search" size={16} />
            <span>Search or jump to&hellip;</span>
            <kbd>Ctrl K</kbd>
          </button>
          <StatusChip />
          <ThemeToggle mode={theme.mode} onCycle={theme.cycle} />
        </div>

        <main id="main" className="main" tabIndex={-1}>
          {status === "loading" && <Loading />}
          {(status === "error" || status === "empty") && <Problem status={status} error={error} reload={reload} />}
          {status === "ready" && (
            <ErrorBoundary key={route}>
              {route === "assess" && <AssessPage />}
              {route === "batch" && <BatchPage />}
              {route === "models" && <ModelsPage />}
              {route === "data" && <DataPage />}
              {route === "history" && <HistoryPage navigate={navigate} />}
            </ErrorBoundary>
          )}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <HistoryProvider>
          <Shell />
        </HistoryProvider>
      </AppProvider>
    </ToastProvider>
  );
}
