import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, TrendingUp, UsersRound, Hotel, UserPlus, ClipboardList, Sparkles, FileText, ChevronRight } from "lucide-react";
import { useDashboardStats } from "../../hooks/useDashboard";
import { usePeople, type Person } from "../../hooks/usePeople";
import { useMe } from "../../hooks/useAuth";
import { Card, Spinner } from "../ui";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin", zone_lead: "Zone Lead", area_lead: "Area Lead", hotel_person: "Hotel Person", user: "User",
};

function StatCard({ icon, value, label, loading }: { icon: React.ReactNode; value?: number; label: string; loading?: boolean }) {
  return (
    <Card className="!p-[15px]">
      <div className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center mb-3"
        style={{ background: "var(--m-accent-soft)", color: "var(--m-accent)" }}>
        {icon}
      </div>
      {loading
        ? <div className="h-7 w-12 rounded-lg animate-pulse mb-1" style={{ background: "var(--m-inset)" }} />
        : <p className="m-serif text-[28px] font-extrabold leading-none tabular-nums">{value ?? 0}</p>}
      <p className="text-[12.5px] font-medium text-[var(--m-muted)] mt-1.5">{label}</p>
    </Card>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Card onClick={onClick} className="flex items-center gap-3 !py-3.5">
      <span className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
        style={{ background: "var(--m-accent-soft)", color: "var(--m-accent)" }}>
        {icon}
      </span>
      <span className="text-[13.5px] font-semibold flex-1">{label}</span>
      <ChevronRight className="w-4 h-4 text-[var(--m-faint)]" />
    </Card>
  );
}

export default function MDashboard() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: peopleData } = usePeople({ pageSize: 200 });

  const role = me?.user?.role ?? "user";
  const people: Person[] = peopleData?.people ?? [];

  const byZone = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    for (const p of people) {
      const z = p.zone || "Unassigned";
      const cur = map.get(z) ?? { total: 0, done: 0 };
      cur.total += 1;
      if (p.checkedIn === "Yes") cur.done += 1;
      map.set(z, cur);
    }
    return [...map.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 6);
  }, [people]);

  return (
    <div className="pt-2">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[13px] font-medium text-[var(--m-muted)]">Welcome back</p>
          <h1 className="m-serif font-extrabold text-[28px] leading-none tracking-[-0.5px] mt-1">Dashboard</h1>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
          style={{ background: "var(--m-accent-soft)", color: "var(--m-accent)" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--m-accent)" }} />
          {ROLE_LABEL[role] ?? "User"}
        </span>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-[11px]">
        <StatCard icon={<Users className="w-[18px] h-[18px]" />} value={stats?.totalPeople} label="Registered" loading={isLoading} />
        <StatCard icon={<TrendingUp className="w-[18px] h-[18px]" />} value={stats?.acoPlayers} label="ACO players" loading={isLoading} />
        <StatCard icon={<UsersRound className="w-[18px] h-[18px]" />} value={stats?.totalTeams} label="Teams" loading={isLoading} />
        <StatCard icon={<Hotel className="w-[18px] h-[18px]" />} value={stats?.totalHotels} label="Hotels" loading={isLoading} />
      </div>

      {/* Check-in by zone */}
      <Card className="mt-[11px]">
        <p className="text-[13.5px] font-bold mb-3.5">Check-in by zone</p>
        {byZone.length === 0 ? (
          <p className="text-[13px] text-[var(--m-muted)] py-2">No people registered yet.</p>
        ) : (
          <div className="space-y-3">
            {byZone.map(([zone, { total, done }]) => {
              const pct = total > 0 ? (done / total) * 100 : 0;
              return (
                <div key={zone}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12.5px] font-medium text-[var(--m-muted)] truncate mr-2">{zone}</span>
                    <span className="text-[12px] font-semibold tabular-nums text-[var(--m-faint)]">{done}/{total}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--m-track)" }}>
                    <div className="m-bar-fill h-full rounded-full" style={{ width: `${pct}%`, background: "var(--m-accent)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Quick actions */}
      <p className="text-[13.5px] font-bold mt-6 mb-2.5 px-0.5">Quick actions</p>
      <div className="grid grid-cols-1 gap-[11px]">
        <QuickAction icon={<UserPlus className="w-[18px] h-[18px]" />} label="Register person" onClick={() => navigate("/registration")} />
        <QuickAction icon={<ClipboardList className="w-[18px] h-[18px]" />} label="Assignments" onClick={() => navigate("/assignments")} />
        <QuickAction icon={<Sparkles className="w-[18px] h-[18px]" />} label="Search Assistant" onClick={() => navigate("/search-assistant")} />
        <QuickAction icon={<FileText className="w-[18px] h-[18px]" />} label="Final List" onClick={() => navigate("/final-list")} />
      </div>

      {isLoading && (
        <div className="flex justify-center pt-6"><Spinner className="w-5 h-5" /></div>
      )}
    </div>
  );
}
