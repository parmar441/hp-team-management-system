import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";

export interface DynamicZone {
  _id: string;
  name: string;
  isDefault: boolean;
  rules?: DynamicZoneRule[];
}

export interface DynamicZoneRule {
  _id: string;
  zoneId: string;
  field: "gender" | "mandal" | "country" | "ageRange";
  matchValue: string;
  priority: number;
}

export function useDynamicZones() {
  return useQuery({
    queryKey: ["dynamic-zones"],
    queryFn: () => api.get("/dynamic-zones").then((r) => r.data),
  });
}

export function useDynamicZoneNames() {
  return useQuery({
    queryKey: ["dynamic-zones", "names"],
    queryFn: () => api.get("/dynamic-zones/names").then((r) => r.data),
  });
}

export function useCreateZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; isDefault?: boolean }) =>
      api.post("/dynamic-zones", data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dynamic-zones"] }),
  });
}

export function useUpdateZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DynamicZone> }) =>
      api.put(`/dynamic-zones/${id}`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dynamic-zones"] }),
  });
}

export function useDeleteZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/dynamic-zones/${id}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dynamic-zones"] }),
  });
}

export function useAddZoneRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ zoneId, data }: { zoneId: string; data: Omit<DynamicZoneRule, "_id" | "zoneId"> }) =>
      api.post(`/dynamic-zones/${zoneId}/rules`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dynamic-zones"] }),
  });
}

export function useUpdateZoneRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; data: Partial<DynamicZoneRule> }) =>
      api.put(`/dynamic-zones/rules/${ruleId}`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dynamic-zones"] }),
  });
}

export function useDeleteZoneRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => api.delete(`/dynamic-zones/rules/${ruleId}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dynamic-zones"] }),
  });
}

export function useReapplyZoneRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/dynamic-zones/reapply").then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
