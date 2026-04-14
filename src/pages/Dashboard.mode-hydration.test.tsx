/* @vitest-environment jsdom */
import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import Dashboard from "./Dashboard";

const navigateMock = vi.fn();
const setSearchParamsMock = vi.fn();
const searchParams = new URLSearchParams("");
const authState = {
  isAuthenticated: true,
  isLoading: false,
  userRole: "doctor",
  profile: { role: "doctor" },
};

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearchParams: () => [searchParams, setSearchParamsMock] as const,
  };
});

vi.mock("@/hooks/auth/useAuth", () => ({
  useAuth: () => authState,
}));

vi.mock("@/hooks/auth/useWorkspaceContext", () => ({
  useWorkspaceContext: () => ({ activeContext: null }),
}));

vi.mock("@/components/dashboard/DashboardRouter", () => ({
  default: () => <div>dashboard-router</div>,
}));

vi.mock("@/components/layout/DoctorLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/layout/PatientLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/layout/UnifiedLayoutTemplate", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/auth/RequireRoleGuard", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/contexts/CartContext", () => ({
  CartProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/activity/ActivityFeed", () => ({
  ActivityFeed: () => <div>activity-feed</div>,
}));
vi.mock("@/components/activity/Advertisements", () => ({
  Advertisements: () => <div>ads</div>,
}));

describe("Dashboard mode hydration", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    setSearchParamsMock.mockReset();
    authState.userRole = "doctor";
    authState.profile.role = "doctor";
    searchParams.delete("mode");
    searchParams.delete("view");
    window.localStorage.setItem(
      "mediloop.dashboard_mode_by_role",
      JSON.stringify({ doctor: "patient" }),
    );
  });

  it("hydrates doctor patient mode from stored preference", () => {
    render(<Dashboard />);

    expect(setSearchParamsMock).toHaveBeenCalled();
    const [paramsArg, optionsArg] = setSearchParamsMock.mock.calls[0];
    expect(paramsArg.get("mode")).toBe("patient");
    expect(paramsArg.get("view")).toBe("home");
    expect(optionsArg).toEqual({ replace: true });
  });

  it("does not auto-hydrate pharmacist patient mode from localStorage (in-dashboard toggle only)", () => {
    authState.userRole = "pharmacist";
    authState.profile.role = "pharmacist";
    window.localStorage.setItem(
      "mediloop.dashboard_mode_by_role",
      JSON.stringify({ pharmacist: "patient" }),
    );

    render(<Dashboard />);

    expect(setSearchParamsMock).not.toHaveBeenCalled();
  });

  it("redirects doctor in role mode from /dashboard to new doctor home", () => {
    window.localStorage.removeItem("mediloop.dashboard_mode_by_role");
    render(<Dashboard />);
    expect(navigateMock).toHaveBeenCalledWith("/doctor/doctor-dashboard", { replace: true });
  });
});

