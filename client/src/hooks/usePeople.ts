import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";

export interface Person {
  _id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  gender: "M" | "F";
  mandal?: string;
  familyId?: string;
  ageRange?: string;
  memberId?: string;
  acoNeeded: "Yes" | "No";
  checkedIn?: "Yes" | "No";
  zone?: string;
  area?: string;
  name?: string;
  category?: string;
  note?: string;
  fullName?: string;
  isAcoPlayer?: boolean;
  isCheckedIn?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PeopleFilters {
  search?: string;
  zone?: string;
  area?: string;
  gender?: string;
  country?: string;
  acoNeeded?: string;
  page?: number;
  pageSize?: number;
}

export function usePeople(filters: PeopleFilters = {}) {
  return useQuery({
    queryKey: ["people", filters],
    queryFn: () => api.get("/people", { params: filters }).then((r) => r.data),
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Person>) => api.post("/people", data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Person> }) =>
      api.put(`/people/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/people/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useToggleAco() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, acoNeeded }: { id: string; acoNeeded: "Yes" | "No" }) =>
      api.patch(`/people/${id}/toggle-aco`, { acoNeeded }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useBulkToggleAco() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, acoNeeded }: { ids: string[]; acoNeeded: "Yes" | "No" }) =>
      api.patch("/people/bulk-toggle-aco", { ids, acoNeeded }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useBulkDeletePeople() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => api.post("/people/bulk-delete", { ids }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useBulkImportPeople() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (people: Partial<Person>[]) => api.post("/people/bulk", { people }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useMovePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fromTeamId, toTeamId }: { id: string; fromTeamId?: string; toTeamId?: string }) =>
      api.patch(`/people/${id}/move`, { fromTeamId, toTeamId }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useToggleCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/people/${id}/check-in`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useBulkCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, checkedIn }: { ids: string[]; checkedIn: "Yes" | "No" }) =>
      api.patch("/people/bulk-check-in", { ids, checkedIn }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
