
import { useState, useEffect } from 'react';
import { getAuthToggleConfig, setAuthSystemToggle } from '../config/authToggle';

export const useAuthToggle = () => {
  const [config, setConfig] = useState(getAuthToggleConfig());

  useEffect(() => {
    // Listen for storage changes to sync across tabs
    const handleStorageChange = () => {
      setConfig(getAuthToggleConfig());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleAuthSystem = (useNew: boolean) => {
    setAuthSystemToggle(useNew);
    setConfig(getAuthToggleConfig());
  };

  return {
    useNewAuthService: config.useNewAuthService,
    allowRuntimeToggle: config.allowRuntimeToggle,
    toggleAuthSystem,
  };
};
