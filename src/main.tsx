import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeI18n } from "./i18n/config";

// Import auth toggle to ensure it's initialized
import "./auth-v2/config/authToggle";
import { setAuthSystemToggle } from "./auth-v2/config/authToggle";

// ✨ NEW: Import and expose feature flags globally
import { featureFlags } from "./lib/featureFlags";

// Make feature flags available in browser console
if (typeof window !== "undefined") {
  (window as any).featureFlags = featureFlags;
  console.log("✅ Feature flags available in console as: featureFlags");
}

// ✨ NEW: Enable V2 features (for testing/development)
// Comment these out when you want to test legacy behavior
featureFlags.enable("useSessionRefreshV2");
featureFlags.enable("useMultiTabSyncV2");
console.log("✅ V2 Session Management Enabled:", {
  sessionRefresh: featureFlags.isEnabled("useSessionRefreshV2"),
  multiTabSync: featureFlags.isEnabled("useMultiTabSyncV2"),
});

// ✨ NEW: Enable V2 Login/Signup UI
setAuthSystemToggle(true);
console.log("✅ V2 Auth UI Enabled: Login and Signup will use V2 pages");

// Initialize i18n before rendering the app
initializeI18n();

console.log("main.tsx is executing - Initializing React application");

// Make sure we have a root element before trying to render
const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} else {
  console.error("Root element not found!");
}
