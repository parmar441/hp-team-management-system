import api from "../api/client";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Users, UsersRound, MapPin, TrendingUp } from "lucide-react";

export default function TeamLeadDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["team-lead", "stats"],
    queryFn: () => api.get("/team-lead/stats").then((r) => r.data),
  });

  const { data: zonesData } = useQuery({
    queryKey: ["team-lead", "my-zones"],
    queryFn: () => api.get("/team-lead/my-zones").then((r) => r.data),
  });

  const zones = zonesData ?? [];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-100 rounded-xl">
          <LayoutDashboard className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Dashboard</h1>
          <p className="text-sm text-gray-500">Restricted to your assigned zones</p>
        </div>
      </div>

      {/* Assigned Zones */}
      {zones.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Assigned Zones</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {zones.map((a: any) => (
              <span
                key={a._id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700"
              >
                <MapPin className="w-3 h-3" />
                {a.zone}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Total People</span>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-9 w-20 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-gray-900">{stats?.totalPeople ?? 0}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Utaro Players</span>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-9 w-20 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-gray-900">{stats?.acoPlayers ?? 0}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Teams</span>
            <div className="p-2 bg-amber-50 rounded-lg">
              <UsersRound className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-9 w-20 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-gray-900">{stats?.totalTeams ?? 0}</p>
          )}
        </div>
      </div>
    </div>
  );
}
