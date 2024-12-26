import { useState, useEffect } from 'react';

export const useStorageState = <T>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    const getStoredValue = async () => {
      try {
        const result = await chrome.storage.local.get([key]);
        if (result[key]) {
          setValue(result[key]);
        }
      } catch (error) {
        console.error('Failed to get stored value:', error);
      }
    };

    getStoredValue();
  }, [key]);

  const updateValue = async (newValue: T) => {
    try {
      setValue(newValue);
      await chrome.storage.local.set({ [key]: newValue });
    } catch (error) {
      console.error('Failed to update stored value:', error);
    }
  };

  return [value, updateValue] as const;
}; 