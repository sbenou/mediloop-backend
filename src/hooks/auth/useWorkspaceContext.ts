import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type ActiveContextSelection,
  clearStoredActiveContext,
  fetchMyContexts,
  getStoredActiveContext,
  resolveDefaultContext,
  setStoredActiveContext,
  type WorkspaceMembershipContext,
} from "@/lib/activeContext";
import { useAuth } from "@/hooks/auth/useAuth";

export function useWorkspaceContext() {
  const { isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [memberships, setMemberships] = useState<WorkspaceMembershipContext[]>(
    [],
  );
  const [active, setActive] = useState<ActiveContextSelection | null>(
    getStoredActiveContext(),
  );

  const refreshContexts = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    setIsLoading(true);
    try {
      const data = await fetchMyContexts();
      setMemberships(data.memberships || []);

      const stored = getStoredActiveContext();
      const validStored = stored
        ? data.memberships.some(
            (m) =>
              m.membership_id === stored.membershipId &&
              m.tenant_id === stored.tenantId &&
              m.is_active &&
              m.status === "active",
          )
        : false;

      if (validStored && stored) {
        setActive(stored);
      } else {
        const fallback = resolveDefaultContext(
          data.memberships || [],
          data.current_context,
        );
        if (fallback) {
          setStoredActiveContext(fallback);
          setActive(fallback);
        } else {
          clearStoredActiveContext();
          setActive(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  const setActiveContext = useCallback(
    (next: ActiveContextSelection) => {
      setStoredActiveContext(next);
      setActive(next);
    },
    [],
  );

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setMemberships([]);
      setActive(null);
      clearStoredActiveContext();
      return;
    }
    void refreshContexts();
  }, [isAuthenticated, user?.id, refreshContexts]);

  const activeMembership = useMemo(() => {
    if (!active) return null;
    return (
      memberships.find(
        (m) =>
          m.membership_id === active.membershipId &&
          m.tenant_id === active.tenantId,
      ) || null
    );
  }, [memberships, active]);

  return {
    isLoading,
    memberships,
    activeContext: active,
    activeMembership,
    setActiveContext,
    refreshContexts,
  };
}
