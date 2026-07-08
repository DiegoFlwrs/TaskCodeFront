'use client';

type CacheEntry<T> = {
  data: T;
  expires: number;
  inflight?: Promise<T>;
};

const store = new Map<string, CacheEntry<unknown>>();

export const CACHE_TTL = {
  lists: 60_000,
  teams: 120_000,
  stats: 10 * 60_000,
  users: 5 * 60_000,
} as const;

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, expires: Date.now() + ttlMs });
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export async function fetchCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number,
  options?: { force?: boolean },
): Promise<T> {
  if (!options?.force) {
    const hit = getCached<T>(key);
    if (hit !== null) return hit;

    const inflight = store.get(key)?.inflight as Promise<T> | undefined;
    if (inflight) return inflight;
  }

  const promise = fetcher()
    .then((data) => {
      setCached(key, data, ttlMs);
      return data;
    })
    .finally(() => {
      const entry = store.get(key);
      if (entry?.inflight === promise) {
        delete entry.inflight;
      }
    });

  const existing = store.get(key);
  store.set(key, {
    data: existing?.data ?? (null as T),
    expires: existing?.expires ?? 0,
    inflight: promise,
  });

  return promise;
}
