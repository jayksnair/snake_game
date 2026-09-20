// Lightweight fetch wrapper.
// VITE_API_URL can override; defaults to a relative /api/v1 path which works
// both locally (Vite proxy → localhost:8000) and on Vercel (routed to the
// serverless function).
const BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${method} ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const apiClient = {
  get:  <T>(path: string)                 => request<T>('GET',  path),
  post: <T>(path: string, body: unknown)  => request<T>('POST', path, body),
};
