/**
 * Admin Domain Query Hooks
 * 
 * Includes hooks for user management, statistics, and admin actions.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/utils/api/admin";
import { queryKeys } from "./queryKeys";
import { useInvalidateQueries } from "./useQueryHelpers";

/**
 * Hook to fetch admin user statistics
 */
export function useAdminUserStats(enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.stats(),
    queryFn: () => adminApi.getUserStats(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch all users (admin view)
 */
export function useAdminUsers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.lists(),
    queryFn: () => adminApi.getAllUsers(),
    enabled,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to create a new user (admin action)
 */
export function useAdminCreateUser() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateQueries();

  return useMutation({
    mutationFn: (userData: any) => adminApi.users.createUser(userData),
    onSuccess: () => {
      invalidate.invalidate(queryKeys.users.all());
    },
  });
}

/**
 * Hook to update a user (admin action)
 */
export function useAdminUpdateUser() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateQueries();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) => 
      adminApi.users.updateUser(userId, data),
    onSuccess: (_, variables) => {
      invalidate.invalidate(queryKeys.users.all());
      invalidate.invalidate(queryKeys.users.detail(variables.userId));
    },
  });
}

/**
 * Hook to delete a user (admin action)
 */
export function useAdminDeleteUser() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateQueries();

  return useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      invalidate.invalidate(queryKeys.users.all());
    },
  });
}

/**
 * Hook to grant admin privileges to a user
 */
export function useAdminSetAdmin() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateQueries();

  return useMutation({
    mutationFn: ({ userId, requesterId }: { userId: string; requesterId: string }) => 
      adminApi.setAdminUser(userId, requesterId),
    onSuccess: () => {
      invalidate.invalidate(queryKeys.users.all());
    },
  });
}

/**
 * Hook to remove admin privileges from a user
 */
export function useAdminRemoveAdmin() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateQueries();

  return useMutation({
    mutationFn: ({ userId, requesterId }: { userId: string; requesterId: string }) => 
      adminApi.removeAdminUser(userId, requesterId),
    onSuccess: () => {
      invalidate.invalidate(queryKeys.users.all());
    },
  });
}
