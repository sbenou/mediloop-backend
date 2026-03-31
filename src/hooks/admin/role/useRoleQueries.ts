
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Role } from "@/types/role";
import { fetchAdminRoles } from "@/services/adminApi";

export const useRoleQueries = () => {
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      return (await fetchAdminRoles()) as Role[];
    },
  });

  return {
    roles,
    isLoading,
    queryClient,
  };
};
