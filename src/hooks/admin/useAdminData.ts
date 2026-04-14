import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserProfile } from "@/types/user";
import { toast } from "@/components/ui/use-toast";
import {
  fetchAdminProfiles,
  patchAdminProfileRole,
} from "@/services/adminApi";

export const useAdminData = (userProfile: UserProfile | null) => {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error, isError } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      if (!userProfile || userProfile.role !== "superadmin") {
        throw new Error("Not authorized to fetch admin data");
      }
      return fetchAdminProfiles();
    },
    enabled: Boolean(userProfile?.role === "superadmin"),
    staleTime: 1000 * 60,
    retry: false,
    meta: {
      errorMessage: "Failed to load admin data. Please try again.",
    },
  });

  useEffect(() => {
    if (!isError || !error) return;
    toast({
      variant: "destructive",
      title: "Error",
      description:
        error instanceof Error
          ? error.message
          : "Failed to load admin data. Please try again.",
    });
  }, [isError, error]);

  const updateUserRole = async (
    userId: string,
    newRole: UserProfile["role"],
  ) => {
    await patchAdminProfileRole(userId, newRole);
    await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  };

  return {
    users,
    isLoading,
    error,
    updateUserRole,
  };
};
