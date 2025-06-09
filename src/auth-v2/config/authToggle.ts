
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
    // Trigger storage event to update other components
    window.dispatchEvent(new Event('storage'));
  }
};

// Debug helper - accessible from browser console
if (typeof window !== 'undefined') {
  // Make sure the function is properly attached to window
  (window as any).toggleAuthSystem = (useNew: boolean) => {
    console.log(`Toggling auth system to: ${useNew ? 'new (V2)' : 'legacy'}`);
    setAuthSystemToggle(useNew);
    console.log('Please refresh the page to see the changes');
  };
  
  // Also expose the config getter for debugging
  (window as any).getAuthConfig = () => {
    return getAuthToggleConfig();
  };
  
  console.log('Auth toggle functions available:');
  console.log('- toggleAuthSystem(true) - Switch to V2');
  console.log('- toggleAuthSystem(false) - Switch to legacy');
  console.log('- getAuthConfig() - Check current config');
}
