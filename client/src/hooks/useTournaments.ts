import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import type { Team } from "./useTeams";

export interface Tournament {
  _id: string;
  name: string;
  address?: string;
  totalSlots: number;
  status: "upcoming" | "not_available" | "available";
  createdAt?: string;
}

export interface TournamentSlot {
  _id: string;
  tournamentId: string | Tournament;
  slotNumber: number;
  teamId: string | Team | null;
  roomNumber?: string;
  isOccupied?: boolean;
  hasRoom?: boolean;
}

export function useTournaments() {
  return useQuery({
    queryKey: ["tournaments"],
    queryFn: () => api.get("/tournaments").then((r) => r.data),
  });
}

export function useTournament(id: string) {
  return useQuery({
    queryKey: ["tournaments", id],
    queryFn: () => api.get(`/tournaments/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useAvailableTeams(tournamentId: string) {
  return useQuery({
    queryKey: ["tournaments", tournamentId, "available-teams"],
    queryFn: () => api.get(`/tournaments/${tournamentId}/available-teams`).then((r) => r.data),
    enabled: !!tournamentId,
  });
}

export function useCreateTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Tournament>) => api.post("/tournaments", data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tournaments"] }),
  });
}

export function useUpdateTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tournament> }) =>
      api.put(`/tournaments/${id}`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tournaments"] }),
  });
}

export function useDeleteTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tournaments/${id}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tournaments"] }),
  });
}

export function useAssignTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tournamentId, slotId, teamId }: { tournamentId: string; slotId: string; teamId: string }) =>
      api.patch(`/tournaments/${tournamentId}/assign-team`, { slotId, teamId }).then((r) => r.data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["tournaments", vars.tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

export function useUnassignTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tournamentId, slotId }: { tournamentId: string; slotId: string }) =>
      api.patch(`/tournaments/${tournamentId}/unassign-team`, { slotId }).then((r) => r.data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["tournaments", vars.tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

export function useUpdateSlotRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slotId, roomNumber }: { slotId: string; roomNumber: string }) =>
      api.patch(`/tournaments/slots/${slotId}/room`, { roomNumber }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}
