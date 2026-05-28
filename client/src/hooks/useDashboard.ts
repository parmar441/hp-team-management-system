import { useQuery } from "@tanstack/react-query";
import api from "../api/client";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => api.get("/dashboard/stats").then((r) => r.data),
  });
}

export function useEnhancedStats() {
  return useQuery({
    queryKey: ["dashboard", "enhanced-stats"],
    queryFn: () => api.get("/dashboard/enhanced-stats").then((r) => r.data),
  });
}

export function useTreeStats() {
  return useQuery({
    queryKey: ["dashboard", "tree-stats"],
    queryFn: () => api.get("/dashboard/tree-stats").then((r) => r.data),
  });
}
