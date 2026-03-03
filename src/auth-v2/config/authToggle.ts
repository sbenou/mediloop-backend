// Auth system toggle configuration
export interface AuthToggleConfig {
  useNewAuthService: boolean;
  allowRuntimeToggle: boolean;
}

const DEFAULT_CONFIG: AuthToggleConfig = {
  useNewAuthService: true, // Default to legacy system for safety
  allowRuntimeToggle: true, // Allow runtime switching via localStorage
};

export const getAuthToggleConfig = (): AuthToggleConfig => {
  if (typeof window === "undefined") {
    return DEFAULT_CONFIG;
  }

  // Check localStorage for runtime toggle
  const runtimeToggle = localStorage.getItem("auth-system-toggle");
  if (runtimeToggle !== null) {
    return {
      ...DEFAULT_CONFIG,
      useNewAuthService: runtimeToggle === "new",
    };
  }

  return DEFAULT_CONFIG;
};

export const setAuthSystemToggle = (useNew: boolean) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth-system-toggle", useNew ? "new" : "legacy");
    console.log(`Auth system switched to: ${useNew ? "new" : "legacy"}`);
    // Trigger storage event to update other components
    window.dispatchEvent(new Event("storage"));
  }
};

// Global functions for browser console debugging
const setupGlobalFunctions = () => {
  if (typeof window === "undefined") return;

  // Define the toggle function
  const toggleAuthSystem = (useNew: boolean) => {
    console.log(`Toggling auth system to: ${useNew ? "new (V2)" : "legacy"}`);
    setAuthSystemToggle(useNew);
    console.log("Please refresh the page to see the changes");
  };

  // Define the config getter
  const getAuthConfig = () => {
    return getAuthToggleConfig();
  };

  // Attach to window with error handling
  try {
    (window as any).toggleAuthSystem = toggleAuthSystem;
    (window as any).getAuthConfig = getAuthConfig;

    console.log("Auth toggle functions available:");
    console.log("- toggleAuthSystem(true) - Switch to V2");
    console.log("- toggleAuthSystem(false) - Switch to legacy");
    console.log("- getAuthConfig() - Check current config");
  } catch (error) {
    console.error("Error setting up global auth functions:", error);
  }
};

// Set up global functions immediately
setupGlobalFunctions();

// Also set up on DOMContentLoaded as a fallback
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupGlobalFunctions);
  } else {
    // DOM is already loaded
    setupGlobalFunctions();
  }
}
