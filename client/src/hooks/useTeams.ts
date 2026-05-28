import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import type { Person } from "./usePeople";

export interface Team {
  _id: string;
  name: string;
  zone?: string;
  members: Person[];
  memberCount?: number;
  isFull?: boolean;
  isEmpty?: boolean;
  createdAt?: string;
}

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: () => api.get("/teams").then((r) => r.data),
  });
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: ["teams", id],
    queryFn: () => api.get(`/teams/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useAvailablePeople() {
  return useQuery({
    queryKey: ["teams", "available-people"],
    queryFn: () => api.get("/teams/available-people").then((r) => r.data),
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { members: string[]; zone?: string }) =>
      api.post("/teams", data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Team> & { members?: string[] } }) =>
      api.put(`/teams/${id}`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/teams/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useAddTeamMembers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, members }: { id: string; members: string[] }) =>
      api.patch(`/teams/${id}/add-members`, { members }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });
}

export function useRemoveTeamMembers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, members }: { id: string; members: string[] }) =>
      api.patch(`/teams/${id}/remove-members`, { members }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });
}
