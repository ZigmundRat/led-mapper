import { useCallback, useState } from "react";

export type StorageArea = "local" | "session";

const storageFor = (area: StorageArea) => (area === "local" ? localStorage : sessionStorage);

function read<T>(area: StorageArea, key: string, fallback: T, parse: (raw: string) => T | undefined): T {
  try {
    const raw = storageFor(area).getItem(key);
    return raw === null ? fallback : (parse(raw) ?? fallback);
  } catch {
    return fallback;
  }
}

/**
 * State mirrored to localStorage (or sessionStorage), kept only in this
 * browser. Storage can be unavailable (private windows, blocked site data);
 * the state still works.
 */
export function useStoredState<T>(
  key: string,
  fallback: T,
  parse: (raw: string) => T | undefined = (raw) => JSON.parse(raw) as T,
  serialize: (value: T) => string = JSON.stringify,
  area: StorageArea = "local"
) {
  const [value, setValue] = useState(() => read(area, key, fallback, parse));
  const set = useCallback(
    (next: T | undefined) => {
      setValue(next ?? fallback);
      try {
        if (next === undefined) storageFor(area).removeItem(key);
        else storageFor(area).setItem(key, serialize(next));
      } catch {
        // Not persisted; fine.
      }
    },
    // fallback / parse / serialize are expected to be stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, area]
  );
  return [value, set] as const;
}
