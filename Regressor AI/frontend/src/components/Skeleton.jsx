export default function Skeleton({ height = 16, width = "100%", radius = 8, style }) {
  return <span className="skeleton" style={{ height, width, borderRadius: radius, ...style }} aria-hidden="true" />;
}
