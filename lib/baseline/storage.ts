/** Read before each write so a stale React render cannot overwrite another tab. */
export function readStored<T>(
  storage: Pick<Storage, "getItem">,
  key: string,
  initial: T,
  validate: (value: unknown) => value is T,
): T {
  const raw = storage.getItem(key);
  if (raw === null) return initial;
  const parsed: unknown = JSON.parse(raw);
  if (!validate(parsed)) throw new Error("Saved data is not valid.");
  return parsed;
}
export function updateStored<T>(
  storage: Pick<Storage, "getItem" | "setItem">,
  key: string,
  initial: T,
  validate: (value: unknown) => value is T,
  change: T | ((current: T) => T),
): T {
  const current = readStored(storage, key, initial, validate);
  const next =
    typeof change === "function"
      ? (change as (current: T) => T)(current)
      : change;
  if (!validate(next)) throw new Error("The update is not valid.");
  storage.setItem(key, JSON.stringify(next));
  return next;
}
export function mergeById<T extends { id: string }>(
  current: T[],
  incoming: T[],
): T[] {
  const seen = new Set(current.map((v) => v.id));
  const next = [...current];
  for (const item of incoming) {
    if (!seen.has(item.id)) {
      next.push(item);
      seen.add(item.id);
    }
  }
  return next;
}
