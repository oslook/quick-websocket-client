import { useState, useEffect, useRef, useCallback } from 'react';

export const useStorageState = <T>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(initialValue);
  const loadedRef = useRef(false);
  const pendingRef = useRef<T | null>(null);

  useEffect(() => {
    const getStoredValue = async () => {
      try {
        const result = await chrome.storage.local.get([key]);
        if (result[key] !== undefined) {
          setValue(result[key]);
        }
      } catch (error) {
        console.error('Failed to get stored value:', error);
      } finally {
        loadedRef.current = true;
        if (pendingRef.current !== null) {
          const pending = pendingRef.current;
          pendingRef.current = null;
          setValue(pending);
          chrome.storage.local.set({ [key]: pending }).catch(console.error);
        }
      }
    };

    getStoredValue();
  }, [key]);

  const updateValue = useCallback(async (newValue: T) => {
    if (!loadedRef.current) {
      pendingRef.current = newValue;
      setValue(newValue);
      return;
    }
    try {
      setValue(newValue);
      await chrome.storage.local.set({ [key]: newValue });
    } catch (error) {
      console.error('Failed to update stored value:', error);
    }
  }, [key]);

  return [value, updateValue] as const;
}; 