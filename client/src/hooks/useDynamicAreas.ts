import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";

export interface DynamicArea {
  _id: string;
  name: string;
  zoneId?: string | { _id: string; name: string };
  rules?: DynamicAreaRule[];
}

export interface DynamicAreaRule {
  _id: string;
  areaId: string;
  field: "gender" | "mandal" | "ageRange";
  matchValue: string;
  priority: number;
}

export function useDynamicAreas() {
  return useQuery({
    queryKey: ["dynamic-areas"],
    queryFn: () => api.get("/dynamic-areas").then((r) => r.data),
  });
}

export function useCreateArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; zoneId?: string }) =>
      api.post("/dynamic-areas", data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dynamic-areas"] }),
  });
}

export function useUpdateArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DynamicArea> }) =>
      api.put(`/dynamic-areas/${id}`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dynamic-areas"] }),
  });
}

export function useDeleteArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/dynamic-areas/${id}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dynamic-areas"] }),
  });
}

export function useAddAreaRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ areaId, data }: { areaId: string; data: Omit<DynamicAreaRule, "_id" | "areaId"> }) =>
      api.post(`/dynamic-areas/${areaId}/rules`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dynamic-areas"] }),
  });
}

export function useDeleteAreaRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => api.delete(`/dynamic-areas/rules/${ruleId}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dynamic-areas"] }),
  });
}

export function useReapplyAreaRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/dynamic-areas/reapply").then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
