"use client";
import { useCallback, useEffect, useRef, useState } from "react";
export function useLocalData<T>(
  key: string,
  initial: T,
  validate: (v: unknown) => v is T,
) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const readFailed = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!validate(parsed)) throw new Error();
        setValue(parsed);
      }
    } catch {
      readFailed.current = true;
      setError("Saved data could not be opened. It has not been overwritten.");
    }
    setReady(true);
    // The storage key identifies the data; validators are module-level functions.
  }, [key, validate]);
  const save = useCallback(
    (next: T) => {
      if (readFailed.current) return false;
      try {
        localStorage.setItem(key, JSON.stringify(next));
        setValue(next);
        setError("");
        return true;
      } catch {
        setError(
          "Could not save on this device. Storage may be full or unavailable.",
        );
        return false;
      }
    },
    [key],
  );
  return { value, save, ready, error };
}
