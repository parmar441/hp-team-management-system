import api from "../api/client";
import { useQuery } from "@tanstack/react-query";
import { useDeleteTeam, type Team } from "../hooks/useTeams";
import type { Person } from "../hooks/usePeople";
import { personName } from "../lib/utils";
import { UsersRound, Trash2, MapPin } from "lucide-react";

export default function MyTeamsPage() {
  const { data: myZonesData, isLoading: zonesLoading } = useQuery({
    queryKey: ["team-lead", "my-zones"],
    queryFn: () => api.get("/team-lead/my-zones").then((r) => r.data),
  });

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["team-lead", "teams"],
    queryFn: () => api.get("/team-lead/teams").then((r) => r.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ["team-lead", "stats"],
    queryFn: () => api.get("/team-lead/stats").then((r) => r.data),
  });

  const deleteTeam = useDeleteTeam();

  const myZones = myZonesData ?? [];
  const myTeams: Team[] = teams ?? [];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-100 rounded-xl">
          <UsersRound className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Teams</h1>
          <p className="text-sm text-gray-500">Zone/Area Lead view — managing assigned zones</p>
        </div>
      </div>

      {/* Zone Summary Badges */}
      {myZones.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {myZones.map((a: any) => (
            <span
              key={a._id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700"
            >
              <MapPin className="w-3 h-3" />
              Zone: {a.zone}
            </span>
          ))}
        </div>
      )}

      {/* Stat Cards */}
      {statsData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">People</span>
              <div className="p-2 bg-indigo-50 rounded-lg">
                <UsersRound className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{statsData.totalPeople}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">Utaro Players</span>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <UsersRound className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{statsData.acoPlayers}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">Teams</span>
              <div className="p-2 bg-amber-50 rounded-lg">
                <UsersRound className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{statsData.totalTeams}</p>
          </div>
        </div>
      )}

      {/* Teams Grid */}
      {teamsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="h-5 w-32 bg-gray-100 rounded-lg animate-pulse mb-3" />
              <div className="h-4 w-20 bg-gray-100 rounded-lg animate-pulse mb-4" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-3 w-3/4 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-3 w-5/6 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : myTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <UsersRound className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No teams yet</h3>
          <p className="text-sm text-gray-500">No teams in your assigned zones yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myTeams.map((team) => (
            <div
              key={team._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900">{team.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                    {team.members.length}/8
                  </span>
                  <button
                    onClick={() => deleteTeam.mutate(team._id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Zone Badge */}
              {team.zone && (
                <span className="inline-flex items-center gap-1 w-fit px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 mb-3">
                  <MapPin className="w-3 h-3" />
                  {team.zone}
                </span>
              )}

              {/* Member List */}
              <ul className="space-y-1.5 mt-auto">
                {team.members.map((m: Person) => (
                  <li key={m._id} className="text-sm text-gray-500">
                    {personName(m)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
