
/** Copia `value` moviendo solo las fechas que siguen idénticas al dato de ejemplo. */
export function rebaseUnchanged(value: unknown, seed: unknown, move: (text: string) => string): unknown {
  if (typeof value === "string") return value === seed ? move(value) : value;
  if (Array.isArray(value)) {
    if (!Array.isArray(seed)) return value;
    const hasId = (item: unknown): item is { id: unknown } => typeof item === "object" && item !== null && "id" in item;
    return value.map((item, index) => {
      const match = hasId(item) ? seed.find((s) => hasId(s) && s.id === item.id) : seed[index];
      return match === undefined ? item : rebaseUnchanged(item, match, move);
    });
  }
  if (typeof value === "object" && value !== null) {
    if (typeof seed !== "object" || seed === null) return value;
    const seedRecord = seed as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, key in seedRecord ? rebaseUnchanged(item, seedRecord[key], move) : item])
    );
  }
  return value;
}


