import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => api.get("/admin/users").then((r) => r.data),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; email?: string; role: string; username: string; password: string }) =>
      api.post("/admin/users", data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useResetUserPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.patch(`/admin/users/${id}/reset-password`, { password }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useZoneAssignments() {
  return useQuery({
    queryKey: ["admin", "zone-assignments"],
    queryFn: () => api.get("/admin/zone-assignments").then((r) => r.data),
  });
}

export function useCreateZoneAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; zone: string }) =>
      api.post("/admin/zone-assignments", data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useDeleteZoneAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/zone-assignments/${id}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useAreaAssignments() {
  return useQuery({
    queryKey: ["admin", "area-assignments"],
    queryFn: () => api.get("/admin/area-assignments").then((r) => r.data),
  });
}

export function useCreateAreaAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; zone: string; area: string }) =>
      api.post("/admin/area-assignments", data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useDeleteAreaAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/area-assignments/${id}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useAuditLog(params?: { userId?: string; action?: string; targetName?: string; page?: number }) {
  return useQuery({
    queryKey: ["admin", "audit-log", params],
    queryFn: () => api.get("/admin/audit-log", { params }).then((r) => r.data),
  });
}

export function useCreateCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; username: string; password: string }) =>
      api.post("/admin/credentials", data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useDeleteCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/credentials/${id}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
}

// ── Hotel Person Management ─────────────────────────────────────────────────

export function useCreateHotelPersonCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { username: string; password: string }) =>
      api.post("/admin/hotel-person/credentials", data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useDeleteHotelPersonCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/hotel-person/credentials/${id}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useRegenerateHotelPersonPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.patch(`/admin/hotel-person/credentials/${id}/regenerate`, { password }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useHotelPersonAssignments() {
  return useQuery({
    queryKey: ["admin", "hotel-person-assignments"],
    queryFn: () => api.get("/admin/hotel-person/assignments").then((r) => r.data),
  });
}

export function useCreateHotelPersonAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; hotelId: string }) =>
      api.post("/admin/hotel-person/assignments", data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useDeleteHotelPersonAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/hotel-person/assignments/${id}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
}
