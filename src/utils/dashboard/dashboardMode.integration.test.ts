import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";
import {
  getPreferredDashboardMode,
  setPreferredDashboardMode,
} from "./dashboardMode";

function installWindowStorage() {
  const store = new Map<string, string>();
  (globalThis as unknown as { window: Window }).window = {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
      key: () => null,
      length: 0,
    },
  } as unknown as Window;
}

describe("dashboard mode persistence flow", () => {
  beforeEach(() => {
    installWindowStorage();
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  it("doctor keeps patient mode after reload", () => {
    // Simulate switcher toggle to patient mode.
    setPreferredDashboardMode("doctor", "patient");

    // Simulate reload and dashboard navigation resolution.
    expect(getPreferredDashboardMode("doctor")).toBe("patient");
    expect(getDashboardRouteByRole("doctor")).toBe("/dashboard?mode=patient");
  });

  it("doctor in role mode resolves to new doctor home", () => {
    setPreferredDashboardMode("doctor", "patient");
    setPreferredDashboardMode("doctor", "role");
    expect(getPreferredDashboardMode("doctor")).toBe("role");
    expect(getDashboardRouteByRole("doctor")).toBe("/doctor/doctor-dashboard");
  });

  it("pharmacist keeps role mode after toggling back", () => {
    setPreferredDashboardMode("pharmacist", "patient");
    setPreferredDashboardMode("pharmacist", "role");

    expect(getPreferredDashboardMode("pharmacist")).toBe("role");
    expect(getDashboardRouteByRole("pharmacist")).toBe("/dashboard");
  });
});

