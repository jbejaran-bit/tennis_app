"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { readStored, updateStored } from "./storage";
export type SaveLocal<T> = (change: T | ((current: T) => T)) => boolean;
export function useLocalData<T>(
  key: string,
  initial: T,
  validate: (value: unknown) => value is T,
) {
  const initialRef = useRef(initial);
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const read = () => {
      try {
        setValue(readStored(localStorage, key, initialRef.current, validate));
        setError("");
      } catch {
        setError(
          "Saved data could not be opened. It has not been overwritten.",
        );
      } finally {
        setReady(true);
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === key || e.key === null) read();
    };
    const onLocal = (e: Event) => {
      if ((e as CustomEvent).detail === key) read();
    };
    read();
    window.addEventListener("storage", onStorage);
    window.addEventListener("baseline-data", onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("baseline-data", onLocal);
    };
  }, [key, validate]);
  const save: SaveLocal<T> = useCallback(
    (change) => {
      try {
        const next = updateStored(
          localStorage,
          key,
          initialRef.current,
          validate,
          change,
        );
        setValue(next);
        setError("");
        window.dispatchEvent(new CustomEvent("baseline-data", { detail: key }));
        return true;
      } catch {
        setError(
          "Could not save. Check device storage or export a backup. Existing saved data has been kept.",
        );
        return false;
      }
    },
    [key, validate],
  );
  return { value, save, ready, error };
}
