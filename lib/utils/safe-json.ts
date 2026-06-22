export function safeJsonParse<T>(value: unknown, fallback: T, label = "JSON") {
  if (typeof value !== "string") {
    return value === undefined || value === null ? fallback : (value as T);
  }

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  try {
    return JSON.parse(trimmed) as T;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[safeJsonParse] Invalid ${label}. Falling back.`, {
        error: error instanceof Error ? error.message : String(error),
        preview: trimmed.slice(0, 220)
      });
    }

    return fallback;
  }
}
