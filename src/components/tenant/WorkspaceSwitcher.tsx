import { useMemo } from "react";
import { useWorkspaceContext } from "@/hooks/auth/useWorkspaceContext";

export default function WorkspaceSwitcher() {
  const { memberships, activeContext, setActiveContext, isLoading } =
    useWorkspaceContext();

  const activeMemberships = useMemo(
    () => memberships.filter((m) => m.is_active && m.status === "active"),
    [memberships],
  );

  if (isLoading || activeMemberships.length <= 1) {
    return null;
  }

  const currentValue = activeContext?.membershipId || "";

  return (
    <select
      className="h-8 rounded border border-input bg-background px-2 text-xs md:text-sm"
      aria-label="Workspace switcher"
      value={currentValue}
      onChange={(e) => {
        const membershipId = e.target.value;
        const match = activeMemberships.find(
          (m) => m.membership_id === membershipId,
        );
        if (!match) return;
        setActiveContext({
          membershipId: match.membership_id,
          tenantId: match.tenant_id,
        });
      }}
    >
      {activeMemberships.map((m) => (
        <option key={m.membership_id} value={m.membership_id}>
          {m.tenant.name} ({m.role})
        </option>
      ))}
    </select>
  );
}
