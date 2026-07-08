export function toJson<T>(value: T | undefined): string | null {
  return value === undefined ? null : JSON.stringify(value);
}

export function fromJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
