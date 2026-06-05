import { useDashboardStats, useTreeStats } from "../hooks/useDashboard";
import { useMe } from "../hooks/useAuth";
import { Users, UsersRound, Hotel, ClipboardList, TrendingUp, MapPin, ArrowUpRight, Sparkles } from "lucide-react";

const ZONE_COLORS = [
  { bar: "bg-indigo-500",  badge: "bg-indigo-50 text-indigo-700" },
  { bar: "bg-violet-500",  badge: "bg-violet-50 text-violet-700" },
  { bar: "bg-blue-500",    badge: "bg-blue-50 text-blue-700" },
  { bar: "bg-cyan-500",    badge: "bg-cyan-50 text-cyan-700" },
  { bar: "bg-teal-500",    badge: "bg-teal-50 text-teal-700" },
  { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" },
];

interface StatCardProps {
  label: string;
  value?: number | string;
  icon: React.ReactNode;
  sub?: string;
  gradient: string;
  iconBg: string;
  trend?: string;
}

function StatCard({ label, value, icon, sub, gradient, iconBg, trend }: StatCardProps) {
  const loading = value === undefined;
  return (
    <div className={`relative bg-white rounded-2xl overflow-hidden shadow-sm border border-white/60 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5`}>
      {/* Top gradient bar */}
      <div className={`h-1 w-full ${gradient}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg} shadow-sm`}>
            {icon}
          </div>
          {trend && (
            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3" /> {trend}
            </span>
          )}
        </div>
        {loading ? (
          <div className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse mb-1" />
        ) : (
          <p className="text-[2rem] font-extrabold text-gray-900 leading-none mb-1.5 tabular-nums">{value}</p>
        )}
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ZoneCard({ zone, idx }: { zone: any; idx: number }) {
  const total = zone.areas?.reduce((sum: number, a: any) => sum + a.count, 0) || 0;
  const colors = ZONE_COLORS[idx % ZONE_COLORS.length];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg ${colors.badge} flex items-center justify-center flex-shrink-0`}>
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{zone.zone || "Unassigned"}</p>
            {zone.isDefault && <p className="text-[10px] text-gray-400 leading-none">Default Zone</p>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{total}</p>
          <p className="text-[10px] text-gray-400 leading-none">people</p>
        </div>
      </div>

      {zone.areas && zone.areas.length > 0 ? (
        <div className="space-y-2.5 mt-3 pt-3 border-t border-gray-50">
          {zone.areas.map((area: any, i: number) => {
            const pct = total > 0 ? (area.count / total) * 100 : 0;
            const c = ZONE_COLORS[i % ZONE_COLORS.length];
            return (
              <div key={area._id || i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 font-medium truncate mr-2">{area._id || "No Area"}</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${c.badge}`}>{area.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${c.bar} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-gray-50 text-center py-3">
          <p className="text-xs text-gray-400">No people assigned yet</p>
        </div>
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
  const firstName = (user?.name || user?.email || "there").split(" ")[0];
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const roleBadge = user?.role?.replace(/_/g, " ") || "User";

  return (
    <div className="p-5 lg:p-8 space-y-7 max-w-7xl mx-auto">

      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl p-6 lg:p-7 shadow-lg shadow-indigo-200">
        {/* Decorative blobs */}
        <div className="absolute top-[-30px] right-[-20px] w-48 h-48 rounded-full bg-white/[0.07] blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-20px] left-[30%] w-32 h-32 rounded-full bg-violet-400/20 blur-xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span className="text-indigo-200 text-sm font-medium">{today}</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight">
              {greeting}, {firstName}!
            </h1>
            <p className="text-indigo-200 text-sm mt-1.5">
              Here's what's happening with your accommodation system today.
            </p>
          </div>
          <span className="flex-shrink-0 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-white/[0.15] text-white border border-white/20 backdrop-blur-sm capitalize">
            {roleBadge}
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard
          label="Total People"
          value={isLoading ? undefined : stats?.totalPeople ?? 0}
          icon={<Users className="w-5 h-5 text-indigo-600" />}
          gradient="bg-gradient-to-r from-indigo-500 to-indigo-400"
          iconBg="bg-indigo-50"
          sub="Registered members"
        />
        <StatCard
          label="ACO Players"
          value={isLoading ? undefined : stats?.acoPlayers ?? 0}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          gradient="bg-gradient-to-r from-emerald-500 to-teal-400"
          iconBg="bg-emerald-50"
          sub={`${stats?.nonAcoPlayers ?? 0} non-ACO`}
        />
        <StatCard
          label="Teams Formed"
          value={isLoading ? undefined : stats?.totalTeams ?? 0}
          icon={<UsersRound className="w-5 h-5 text-blue-600" />}
          gradient="bg-gradient-to-r from-blue-500 to-blue-400"
          iconBg="bg-blue-50"
          sub="Active teams"
        />
        <StatCard
          label="Hotels"
          value={isLoading ? undefined : stats?.totalHotels ?? 0}
          icon={<Hotel className="w-5 h-5 text-violet-600" />}
          gradient="bg-gradient-to-r from-violet-500 to-purple-400"
          iconBg="bg-violet-50"
          sub={`${stats?.assignedSlots ?? 0} slots assigned`}
        />
      </div>

      {/* ACO Breakdown */}
      {!isLoading && stats && (stats.totalPeople ?? 0) > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-gray-900">ACO vs Non-ACO Breakdown</h3>
              <p className="text-sm text-gray-400 mt-0.5">Distribution across registered members</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: "ACO Players",    count: stats.acoPlayers ?? 0,    bar: "bg-gradient-to-r from-indigo-500 to-indigo-400",  text: "text-indigo-700",  bg: "bg-indigo-50" },
              { label: "Non-ACO",        count: stats.nonAcoPlayers ?? 0,  bar: "bg-gradient-to-r from-gray-300 to-gray-200",      text: "text-gray-600",    bg: "bg-gray-100" },
            ].map((item) => {
              const pct = stats.totalPeople ? (item.count / stats.totalPeople) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 tabular-nums">{item.count}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.bg} ${item.text}`}>{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${item.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Zone Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Zone Breakdown</h2>
            <p className="text-sm text-gray-400">People distribution across configured zones</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {treeLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="space-y-3 animate-pulse">
                  <div className="flex justify-between">
                    <div className="h-4 w-24 bg-gray-100 rounded-lg" />
                    <div className="h-6 w-8 bg-gray-100 rounded-lg" />
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full" />
                  <div className="h-2 w-3/4 bg-gray-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : tree.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
            {tree.map((zone: any, idx: number) => (
              <ZoneCard key={zone.zone} zone={zone} idx={idx} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="font-bold text-gray-800 mb-1">No zones configured</h3>
            <p className="text-sm text-gray-400">Go to <strong className="text-gray-600">Zones</strong> in the sidebar to set up dynamic zones and areas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
