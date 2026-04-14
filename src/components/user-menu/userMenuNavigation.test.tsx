/* @vitest-environment jsdom */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUserMenuNavigation } from "./userMenuNavigation";

const navigateMock = vi.fn();
const locationMock = { pathname: "/", search: "" };
const authState = { isPharmacist: false, userRole: "doctor" };

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => locationMock,
  };
});

vi.mock("@/hooks/auth/useAuth", () => ({
  useAuth: () => authState,
}));

describe("useUserMenuNavigation", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    locationMock.pathname = "/";
    locationMock.search = "";
    authState.userRole = "doctor";
    authState.isPharmacist = false;
    window.localStorage.setItem(
      "mediloop.dashboard_mode_by_role",
      JSON.stringify({ doctor: "patient" }),
    );
  });

  it("routes dashboard click through role resolver", () => {
    const { result } = renderHook(() => useUserMenuNavigation());
    act(() => {
      result.current.handleNavigation("/dashboard");
    });

    expect(navigateMock).toHaveBeenCalledWith("/dashboard?mode=patient", {
      replace: false,
      state: { preserveAuth: true, keepSidebar: true },
    });
  });

  it("routes doctor dashboard click to new doctor home when in role mode", () => {
    window.localStorage.removeItem("mediloop.dashboard_mode_by_role");
    const { result } = renderHook(() => useUserMenuNavigation());
    act(() => {
      result.current.handleNavigation("/dashboard");
    });

    expect(navigateMock).toHaveBeenCalledWith("/doctor/doctor-dashboard", {
      replace: false,
      state: { preserveAuth: true, keepSidebar: true },
    });
  });

  it("routes pharmacist dashboard click to canonical dashboard route", () => {
    authState.userRole = "pharmacist";
    authState.isPharmacist = true;
    window.localStorage.setItem(
      "mediloop.dashboard_mode_by_role",
      JSON.stringify({ pharmacist: "role" }),
    );

    const { result } = renderHook(() => useUserMenuNavigation());
    act(() => {
      result.current.handleNavigation("/dashboard");
    });

    expect(navigateMock).toHaveBeenCalledWith("/dashboard", {
      replace: false,
      state: { preserveAuth: true, keepSidebar: true },
    });
  });
});

