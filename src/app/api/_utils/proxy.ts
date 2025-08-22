const BACKEND = process.env.SGMM_BACKEND ?? "http://127.0.0.1:8000";

export async function proxyGet(path: string, init?: RequestInit) {
  const url = `${BACKEND}${path}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "x-sgmm-dev": "1", ...(init?.headers ?? {}) },
    ...init,
  });
  return res;
}

export async function tryProxyOr<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await proxyGet(path);
    if (!res.ok) return fallback;
    const json = (await res.json()) as T;
    return json ?? fallback;
  } catch {
    return fallback;
  }
}
