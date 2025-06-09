
// Auth system toggle configuration
export interface AuthToggleConfig {
  useNewAuthService: boolean;
  allowRuntimeToggle: boolean;
}

const DEFAULT_CONFIG: AuthToggleConfig = {
  useNewAuthService: false, // Always default to legacy system
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

  // Always return legacy as default
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

// Define the toggle function
const toggleAuthSystem = (useNew: boolean) => {
  console.log(`Toggling auth system to: ${useNew ? 'new (V2)' : 'legacy'}`);
  setAuthSystemToggle(useNew);
  console.log('Please refresh the page to see the changes');
};

// Define the config getter
const getAuthConfig = () => {
  return getAuthToggleConfig();
};

// Global functions setup with explicit window assignment
const setupGlobalFunctions = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Explicitly assign to window with type assertion
    (window as any).toggleAuthSystem = toggleAuthSystem;
    (window as any).getAuthConfig = getAuthConfig;
    
    // Also assign to globalThis as a fallback
    (globalThis as any).toggleAuthSystem = toggleAuthSystem;
    (globalThis as any).getAuthConfig = getAuthConfig;
    
    console.log('Auth toggle functions available:');
    console.log('- toggleAuthSystem(true) - Switch to V2');
    console.log('- toggleAuthSystem(false) - Switch to legacy');
    console.log('- getAuthConfig() - Check current config');
    
    // Test that the functions are actually accessible
    console.log('Function test:', typeof (window as any).toggleAuthSystem);
    
    // Log current config
    console.log('Current auth config:', getAuthConfig());
  } catch (error) {
    console.error('Error setting up global auth functions:', error);
  }
};

// Set up immediately if window is available
if (typeof window !== 'undefined') {
  setupGlobalFunctions();
}

// Also set up on DOMContentLoaded as a fallback
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupGlobalFunctions);
  } else {
    // DOM is already loaded, set up immediately
    setupGlobalFunctions();
  }
}

// Export the functions so they can be used programmatically too
export { toggleAuthSystem, getAuthConfig };
