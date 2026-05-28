import { useDashboardStats, useTreeStats } from "../hooks/useDashboard";
import { useMe } from "../hooks/useAuth";
import { Users, UsersRound, Hotel, ClipboardList, TrendingUp, MapPin, Activity, ArrowUpRight } from "lucide-react";

function StatCard({
  label, value, icon, sub, color, trend,
}: {
  label: string;
  value?: number | string;
  icon: React.ReactNode;
  sub?: string;
  color: string;
  trend?: string;
}) {
  const loading = value === undefined;
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <ArrowUpRight className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <div>
        {loading ? (
          <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse mb-1" />
        ) : (
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        )}
        <p className="text-sm font-medium text-gray-600">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function ZoneCard({ zone }: { zone: any }) {
  const total = zone.areas?.reduce((sum: number, a: any) => sum + a.count, 0) || 0;
  const colors = ["bg-indigo-500", "bg-purple-500", "bg-blue-500", "bg-cyan-500", "bg-teal-500", "bg-emerald-500"];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{zone.zone || "Unassigned"}</p>
            {zone.isDefault && (
              <span className="text-xs text-gray-400">Default Zone</span>
            )}
          </div>
        </div>
        <span className="text-2xl font-bold text-gray-900">{total}</span>
      </div>

      {zone.areas && zone.areas.length > 0 && (
        <div className="space-y-2">
          {zone.areas.map((area: any, i: number) => {
            const pct = total > 0 ? (area.count / total) * 100 : 0;
            return (
              <div key={area._id || i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">{area._id || "No Area"}</span>
                  <span className="font-medium text-gray-800">{area.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colors[i % colors.length]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(!zone.areas || zone.areas.length === 0) && (
        <p className="text-xs text-gray-400 text-center py-2">No people assigned yet</p>
      )}
    </div>
  );
}

export default function HomePage() {
  const { data: statsData, isLoading } = useDashboardStats();
  const { data: treeData, isLoading: treeLoading } = useTreeStats();
  const { data: meData } = useMe();

  const user = meData?.user;
  const stats = statsData;
  const tree = treeData?.tree ?? [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {(user?.name || user?.email || "User").split(" ")[0]}
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            System is live — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 capitalize">
          {user?.role?.replace(/_/g, " ") || "User"}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total People"
          value={isLoading ? undefined : stats?.totalPeople ?? 0}
          icon={<Users className="w-6 h-6 text-indigo-600" />}
          color="bg-indigo-50"
          sub="Registered members"
        />
        <StatCard
          label="ACO Players"
          value={isLoading ? undefined : stats?.acoPlayers ?? 0}
          icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
          color="bg-emerald-50"
          sub={`${stats?.nonAcoPlayers ?? 0} non-ACO players`}
        />
        <StatCard
          label="Teams Formed"
          value={isLoading ? undefined : stats?.totalTeams ?? 0}
          icon={<UsersRound className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50"
          sub="Active teams"
        />
        <StatCard
          label="Hotels"
          value={isLoading ? undefined : stats?.totalHotels ?? 0}
          icon={<Hotel className="w-6 h-6 text-orange-600" />}
          color="bg-orange-50"
          sub={`${stats?.assignedSlots ?? 0} slots assigned`}
        />
      </div>

      {/* ACO Progress Bar */}
      {!isLoading && stats && (stats.totalPeople ?? 0) > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">ACO vs Non-ACO Breakdown</h3>
              <p className="text-sm text-gray-400">Distribution across all registered members</p>
            </div>
            <ClipboardList className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {[
              { label: "ACO Players", count: stats.acoPlayers ?? 0, color: "bg-indigo-500", textColor: "text-indigo-600" },
              { label: "Non-ACO", count: stats.nonAcoPlayers ?? 0, color: "bg-gray-300", textColor: "text-gray-500" },
            ].map((item) => {
              const pct = stats.totalPeople ? (item.count / stats.totalPeople) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700">{item.label}</span>
                    <span className={`font-semibold ${item.textColor}`}>{item.count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Zone/Area Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Zone Breakdown</h2>
            <p className="text-sm text-gray-500">People distribution across configured zones</p>
          </div>
          <MapPin className="w-5 h-5 text-gray-400" />
        </div>

        {treeLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="h-32 bg-gray-50 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        ) : tree.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tree.map((zone: any) => <ZoneCard key={zone.zone} zone={zone} />)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-1">No zones configured</h3>
            <p className="text-sm text-gray-400">Go to <strong>Zones</strong> in the sidebar to set up dynamic zones and areas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
