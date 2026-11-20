export function buildCurl(baseUrl, path, payload) {
  return `curl -X POST ${baseUrl}${path} \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(payload)}'`;
}
