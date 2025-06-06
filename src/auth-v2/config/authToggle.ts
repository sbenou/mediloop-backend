
// Auth system toggle configuration
export interface AuthToggleConfig {
  useNewAuthService: boolean;
  allowRuntimeToggle: boolean;
}

const DEFAULT_CONFIG: AuthToggleConfig = {
  useNewAuthService: false, // Default to legacy system for safety
  allowRuntimeToggle: true, // Allow runtime switching via localStorage
};

export const getAuthToggleConfig = (): AuthToggleConfig => {
  if (typeof window === 'undefined') {
    return DEFAULT_CONFIG;
  }

  // Check localStorage for runtime toggle
  const runtimeToggle = localStorage.getItem('auth-system-toggle');
  if (runtimeToggle !== null) {
    return {
      ...DEFAULT_CONFIG,
      useNewAuthService: runtimeToggle === 'new',
    };
  }

  return DEFAULT_CONFIG;
};

export const setAuthSystemToggle = (useNew: boolean) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth-system-toggle', useNew ? 'new' : 'legacy');
    console.log(`Auth system switched to: ${useNew ? 'new' : 'legacy'}`);
  }
};

// Debug helper - accessible from browser console
if (typeof window !== 'undefined') {
  (window as any).toggleAuthSystem = (useNew: boolean) => {
    setAuthSystemToggle(useNew);
    window.location.reload();
  };
}
