// Backend base URL used by every API call.
// Empty string = same origin: in production CloudFront routes /api/*, /ws/* and /health to the backend,
// so the browser never needs a separate API domain (no CORS, HTTPS from CloudFront).
// For local development set VITE_API_BASE_URL in .env, e.g. http://localhost:5000
const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const API_BASE_URL: string = (raw ?? "").trim().replace(/\/+$/, "");
