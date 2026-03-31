/* @vitest-environment jsdom */
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardRouter from "./DashboardRouter";

vi.mock("@/hooks/auth/useAuth", () => ({
  useAuth: () => ({ isPharmacist: false, profile: { role: "doctor" } }),
}));

vi.mock("@/hooks/dashboard/useDashboardParams", () => ({
  default: () => ({
    params: { view: "home", section: "", profileTab: "personal", ordersTab: "orders" },
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams("view=home"), vi.fn()] as const,
  };
});

vi.mock("@/components/dashboard/views", () => ({
  ProfileView: ({ userRole }: { userRole: string }) => <div>profile-{userRole}</div>,
  SettingsView: ({ userRole }: { userRole: string }) => <div>settings-{userRole}</div>,
  OrdersView: ({ userRole }: { userRole: string }) => <div>orders-{userRole}</div>,
  PrescriptionsView: ({ userRole }: { userRole: string }) => (
    <div>prescriptions-{userRole}</div>
  ),
  HomeView: ({ userRole }: { userRole: string }) => <div>home-{userRole}</div>,
  PharmacyView: ({ userRole }: { userRole: string }) => <div>pharmacy-{userRole}</div>,
  WorkplacesView: () => <div>workplaces</div>,
}));

vi.mock("@/components/dashboard/views/TeleconsultationsView", () => ({
  default: ({ userRole }: { userRole: string }) => <div>tele-{userRole}</div>,
}));

vi.mock("@/components/dashboard/views/doctor/DoctorPatientView", () => ({
  default: () => <div>doctor-patients</div>,
}));
vi.mock("@/components/dashboard/views/doctor/DoctorPrescriptionsView", () => ({
  default: () => <div>doctor-prescriptions</div>,
}));
vi.mock("@/components/dashboard/views/doctor/DoctorTeleconsultationsView", () => ({
  default: () => <div>doctor-tele</div>,
}));
vi.mock("@/components/dashboard/views/doctor/DoctorAppointmentsView", () => ({
  default: () => <div>doctor-appointments</div>,
}));
vi.mock("@/components/dashboard/views/NotificationsView", () => ({
  default: ({ userRole }: { userRole: string }) => <div>notifications-{userRole}</div>,
}));

describe("DashboardRouter patient mode", () => {
  it("renders patient home view when forcePatientView is true for doctor", () => {
    render(<DashboardRouter userRole="doctor" forcePatientView />);
    expect(screen.getByText("home-patient")).toBeTruthy();
  });
});

