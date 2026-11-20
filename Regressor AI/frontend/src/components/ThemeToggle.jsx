import Icon from "./Icon";

const ICON = { system: "monitor", light: "sun", dark: "moon" };
const LABEL = { system: "System", light: "Light", dark: "Dark" };

export default function ThemeToggle({ mode, onCycle }) {
  return (
    <button className="icon-btn icon-btn-lg" onClick={onCycle} title={`Theme: ${LABEL[mode]}. Click to change.`} aria-label={`Theme: ${LABEL[mode]}. Click to change.`}>
      <Icon name={ICON[mode]} size={18} />
    </button>
  );
}
