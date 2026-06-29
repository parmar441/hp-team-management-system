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

export interface DashboardOverview {
  counts: {
    people: { count: number; checkedIn: number };
    aco: { count: number; checkedIn: number };
    teams: { count: number; checkedIn: number };
    hotels: { count: number; checkedIn: number };
    rooms: { count: number; checkedIn: number };
  };
  checkedInTotal: number;
  peopleTotal: number;
  hotels: { id: string; name: string; totalSlots: number; occupied: number; remaining: number; zones: { zone: string; slots: number }[] }[];
}

export function useDashboardOverview(zone?: string, area?: string) {
  return useQuery<DashboardOverview>({
    queryKey: ["dashboard", "overview", zone ?? "", area ?? ""],
    queryFn: () => api.get("/dashboard/overview", { params: { zone: zone || undefined, area: area || undefined } }).then((r) => r.data),
  });
}
