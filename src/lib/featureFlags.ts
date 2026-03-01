/**
 * Feature Flags System
 * Controls gradual rollout of V2 features
 */

export interface FeatureFlags {
  // Authentication V2 features
  usePasswordResetV2: boolean;
  useSessionRefreshV2: boolean;
  useMultiTabSyncV2: boolean;

  // Future features
  useOTPLogin: boolean;
  useBiometricAuth: boolean;
}

// Default flags (can be overridden by environment or API)
const DEFAULT_FLAGS: FeatureFlags = {
  usePasswordResetV2: false,
  useSessionRefreshV2: false,
  useMultiTabSyncV2: false,
  useOTPLogin: false,
  useBiometricAuth: false,
};

// Environment-based overrides
const ENV_FLAGS: Partial<FeatureFlags> = {
  usePasswordResetV2: import.meta.env.VITE_ENABLE_PASSWORD_RESET_V2 === "true",
  useSessionRefreshV2:
    import.meta.env.VITE_ENABLE_SESSION_REFRESH_V2 === "true",
  useMultiTabSyncV2: import.meta.env.VITE_ENABLE_MULTI_TAB_SYNC_V2 === "true",
};

class FeatureFlagService {
  private flags: FeatureFlags;
  private listeners: Set<(flags: FeatureFlags) => void> = new Set();

  constructor() {
    this.flags = { ...DEFAULT_FLAGS, ...ENV_FLAGS };
    this.loadFromLocalStorage();
  }

  /**
   * Get current feature flags
   */
  getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(feature: keyof FeatureFlags): boolean {
    return this.flags[feature] ?? false;
  }

  /**
   * Enable a feature (for testing/development)
   */
  enable(feature: keyof FeatureFlags): void {
    this.updateFlag(feature, true);
  }

  /**
   * Disable a feature
   */
  disable(feature: keyof FeatureFlags): void {
    this.updateFlag(feature, false);
  }

  /**
   * Toggle a feature
   */
  toggle(feature: keyof FeatureFlags): void {
    this.updateFlag(feature, !this.flags[feature]);
  }

  /**
   * Update multiple flags at once
   */
  updateFlags(updates: Partial<FeatureFlags>): void {
    this.flags = { ...this.flags, ...updates };
    this.saveToLocalStorage();
    this.notifyListeners();
  }

  /**
   * Reset to default flags
   */
  reset(): void {
    this.flags = { ...DEFAULT_FLAGS, ...ENV_FLAGS };
    this.saveToLocalStorage();
    this.notifyListeners();
  }

  /**
   * Subscribe to flag changes
   */
  subscribe(callback: (flags: FeatureFlags) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Enable all V2 features at once (for testing)
   */
  enableAllV2(): void {
    this.updateFlags({
      usePasswordResetV2: true,
      useSessionRefreshV2: true,
      useMultiTabSyncV2: true,
    });
  }

  /**
   * Disable all V2 features (rollback to legacy)
   */
  disableAllV2(): void {
    this.updateFlags({
      usePasswordResetV2: false,
      useSessionRefreshV2: false,
      useMultiTabSyncV2: false,
    });
  }

  private updateFlag(feature: keyof FeatureFlags, value: boolean): void {
    this.flags[feature] = value;
    this.saveToLocalStorage();
    this.notifyListeners();
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem(
        "mediloop_feature_flags",
        JSON.stringify(this.flags),
      );
    } catch (error) {
      console.error("Failed to save feature flags:", error);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem("mediloop_feature_flags");
      if (stored) {
        const parsed = JSON.parse(stored);
        this.flags = { ...this.flags, ...parsed };
      }
    } catch (error) {
      console.error("Failed to load feature flags:", error);
    }
  }

  private notifyListeners(): void {
    const flags = this.getFlags();
    this.listeners.forEach((callback) => {
      try {
        callback(flags);
      } catch (error) {
        console.error("Feature flag listener error:", error);
      }
    });
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagService();

// Export for debugging in browser console
if (typeof window !== "undefined") {
  (window as any).featureFlags = featureFlags;
}
