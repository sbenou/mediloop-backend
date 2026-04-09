import { afterEach, describe, expect, it } from "vitest";
import { getDashboardRouteByRole } from "./getDashboardRouteByRole";

function mockWindowStorage() {
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
  return store;
}

describe("getDashboardRouteByRole", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  it("returns patient mode dashboard for doctor when stored preference is patient", () => {
    const store = mockWindowStorage();
    store.set(
      "mediloop.dashboard_mode_by_role",
      JSON.stringify({ doctor: "patient" }),
    );
    expect(getDashboardRouteByRole("doctor")).toBe("/dashboard?mode=patient");
  });

  it("returns new doctor home when doctor has no patient-mode preference", () => {
    mockWindowStorage();
    expect(getDashboardRouteByRole("doctor")).toBe("/doctor/doctor-dashboard");
  });

  it("returns role dashboard for pharmacist when no preference exists", () => {
    mockWindowStorage();
    expect(getDashboardRouteByRole("pharmacist")).toBe("/dashboard");
  });

  it("keeps superadmin route unchanged", () => {
    expect(getDashboardRouteByRole("superadmin")).toBe("/superadmin/dashboard");
  });
});

