import { useState, useEffect, useCallback } from "react";

const getStorageEventName = (key: string) => `local-storage:${key}`;

export function useLocalStorage<T>(key: string, initialValue: T) {
  const readValue = useCallback((): T => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(() => readValue());

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        window.dispatchEvent(
          new CustomEvent(getStorageEventName(key), { detail: valueToStore })
        );
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  useEffect(() => {
    const handleCustomUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<T>;
      setStoredValue(customEvent.detail);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === key) {
        setStoredValue(event.newValue ? JSON.parse(event.newValue) : initialValue);
      }
    };

    window.addEventListener(getStorageEventName(key), handleCustomUpdate as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        getStorageEventName(key),
        handleCustomUpdate as EventListener
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, [key, initialValue]);

  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);

  return [storedValue, setValue] as const;
}
