import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";

export interface User {
  _id: string;
  openId: string;
  name?: string;
  email?: string;
  role: "user" | "admin" | "zone_lead" | "area_lead";
  lastSignedIn?: string;
}

export function useMe() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.get("/auth/me").then((r) => r.data),
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { username: string; password: string }) =>
      api.post("/auth/login", data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auth"] }),
  });
}

export function useLocalLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; email: string }) =>
      api.post("/auth/local-login", data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auth"] }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/auth/logout").then((r) => r.data),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useMyAssignments() {
  return useQuery({
    queryKey: ["auth", "my-assignments"],
    queryFn: () => api.get("/auth/my-assignments").then((r) => r.data),
  });
}
