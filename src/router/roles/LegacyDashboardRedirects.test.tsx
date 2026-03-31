/* @vitest-environment jsdom */
import React from "react";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProtectedDoctorDashboard from "./ProtectedDoctorDashboard";
import ProtectedPharmacyDashboard from "./ProtectedPharmacyDashboard";

const navigateMock = vi.fn();
const authState = { isLoading: false, userRole: "doctor" as string | null };

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/hooks/auth/useAuth", () => ({
  useAuth: () => authState,
}));

describe("legacy dashboard redirects", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    window.localStorage.clear();
  });

  it("redirects /doctor/dashboard to canonical resolved dashboard", () => {
    authState.userRole = "doctor";
    window.localStorage.setItem(
      "mediloop.dashboard_mode_by_role",
      JSON.stringify({ doctor: "patient" }),
    );
    render(<ProtectedDoctorDashboard />);
    expect(navigateMock).toHaveBeenCalledWith("/dashboard?mode=patient", {
      replace: true,
    });
  });

  it("redirects /pharmacy/dashboard to canonical resolved dashboard", () => {
    authState.userRole = "pharmacist";
    render(<ProtectedPharmacyDashboard />);
    expect(navigateMock).toHaveBeenCalledWith("/dashboard", { replace: true });
  });
});

