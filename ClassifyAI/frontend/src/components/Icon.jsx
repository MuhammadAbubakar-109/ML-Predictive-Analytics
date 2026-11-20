// Small set of line icons (24x24, drawn with strokes so they inherit the text colour).
const PATHS = {
  gauge: ["M4.5 17a8 8 0 1 1 15 0", "M12 13l3.5-4.5", "M12 13.2a.4.4 0 1 0 0 .01"],
  layers: ["M12 3 3 8l9 5 9-5-9-5Z", "m3 13 9 5 9-5", "m3 17.5 9 5 9-5"],
  chart: ["M4 4v16h16", "m8 15 3.5-4 3 2.5L20 8"],
  shield: ["M12 3 5 6v5.5c0 4.2 2.9 7.4 7 9 4.1-1.6 7-4.8 7-9V6l-7-3Z", "m9 12 2.2 2.2L15.5 10"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 7.5V12l3 2"],
  search: ["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z", "m20 20-4-4"],
  sun: ["M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"],
  moon: ["M20.5 13.5A8.5 8.5 0 1 1 10.5 3.5a6.7 6.7 0 0 0 10 10Z"],
  monitor: ["M3 5h18v11H3z", "M8 20h8M12 16v4"],
  check: ["m5 12.5 4.5 4.5L19 7.5"],
  x: ["M6 6l12 12M18 6 6 18"],
  alert: ["M12 3.5 2.5 20h19L12 3.5Z", "M12 10v4.5", "M12 17.5v.01"],
  info: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 11v5", "M12 7.8v.01"],
  upload: ["M12 16V4", "m7 9 5-5 5 5", "M4 17v3h16v-3"],
  download: ["M12 4v12", "m7 11 5 5 5-5", "M4 20h16"],
  copy: ["M9 9h11v11H9z", "M5 15V5h10"],
  trash: ["M4 7h16", "M9 7V4h6v3", "m6 7 1 13h10l1-13"],
  refresh: ["M20 11a8 8 0 0 0-14.5-4M4 4v4h4", "M4 13a8 8 0 0 0 14.5 4M20 20v-4h-4"],
  play: ["M7 4.5v15l12-7.5-12-7.5Z"],
  sliders: ["M4 7h9M17 7h3M4 17h3M11 17h9", "M15 7a2 2 0 1 0 0 .01", "M9 17a2 2 0 1 0 0 .01"],
  up: ["M12 19V5", "m6 11 6-6 6 6"],
  down: ["M12 5v14", "m6 13 6 6 6-6"],
  chevron: ["m6 9 6 6 6-6"],
  external: ["M14 4h6v6", "M20 4 10 14", "M18 14v6H4V6h6"],
  command: ["M9 9V6.5A2.5 2.5 0 1 0 6.5 9H9Zm0 0h6m-6 0v6m6-6V6.5A2.5 2.5 0 1 1 17.5 9H15Zm0 0v6m0 0h2.5a2.5 2.5 0 1 1-2.5 2.5V15Zm0 0H9m0 0H6.5A2.5 2.5 0 1 0 9 17.5V15Z"],
  zap: ["M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z"],
  reset: ["M4 12a8 8 0 1 0 2.6-5.9", "M4 4v5h5"],
  terminal: ["m5 8 4 4-4 4", "M12 17h7"],
  file: ["M6 3h8l4 4v14H6z", "M14 3v4h4", "M9 13h6M9 17h6"],
  spark: ["M12 3v4M12 17v4M3 12h4M17 12h4", "m6.5 6.5 2.5 2.5M15 15l2.5 2.5M17.5 6.5 15 9M9 15l-2.5 2.5"],
  scale: ["M12 4v16M6 20h12", "M5 8h14", "m5 8-2.5 6a3 3 0 0 0 5 0L5 8Zm14 0-2.5 6a3 3 0 0 0 5 0L19 8Z"],
};

export default function Icon({ name, size = 18, className = "", ...rest }) {
  const paths = PATHS[name] ?? [];
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className={`icon ${className}`} aria-hidden="true" focusable="false" {...rest}
    >
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}
