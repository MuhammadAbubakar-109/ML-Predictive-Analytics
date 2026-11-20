import { useCallback, useEffect, useState } from "react";

export const ROUTES = ["assess", "batch", "models", "data", "history"];

const read = () => {
  const name = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return ROUTES.includes(name) ? name : "assess";
};

// A very small router: the page is whatever comes after "#/" in the address.
export default function useHashRoute() {
  const [route, setRoute] = useState(read);

  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const navigate = useCallback((name) => {
    window.location.hash = `/${name}`;
  }, []);

  return [route, navigate];
}
