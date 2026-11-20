export const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);

export const num = (n, digits = 0) =>
  Number(n).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

// 187400 -> "PKR 187,400"
export const pkr = (n) => `PKR ${Math.round(n).toLocaleString("en-US")}`;

// 187400 -> "187.4K", 1250000 -> "1.25M" (for chart axes)
export function compactPkr(n) {
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${+(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${+(n / 1e3).toFixed(abs >= 1e5 ? 0 : 1)}K`;
  return String(Math.round(n));
}

export const pct = (p, digits = 1) => `${(p * 100).toFixed(digits)}%`;

export const dateTime = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export function timeAgo(ts) {
  const seconds = Math.round((Date.now() - ts) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return new Date(ts).toLocaleDateString();
}

// Pick "nice" round numbers for the ends of an axis.
export function niceRange(lo, hi) {
  const span = hi - lo || Math.abs(hi) || 1;
  const step = Math.pow(10, Math.floor(Math.log10(span))) / 2;
  return [Math.floor((lo - span * 0.08) / step) * step, Math.ceil((hi + span * 0.08) / step) * step];
}
