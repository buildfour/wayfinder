export function getPublicBaseUrl(request?: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (request) {
    const host = request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") ?? "http";
    if (host) return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}

export function getTourShareUrl(baseUrl: string, tourId: string): string {
  return `${baseUrl}/tour/${tourId}`;
}

export function getTourEmbedUrl(baseUrl: string, tourId: string): string {
  return `${baseUrl}/tour/${tourId}/embed`;
}

export function buildEmbedSnippet(embedUrl: string, title: string): string {
  return `<iframe
  src="${embedUrl}"
  title="${escapeAttr(title)} — Wayfinder Tour"
  width="100%"
  height="640"
  frameborder="0"
  allow="clipboard-write"
  style="border:1px solid #1a1a2e;border-radius:8px;background:#04040a;"
></iframe>`;
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
