import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, TrendingUp, UsersRound, Hotel, UserPlus, ClipboardList, Sparkles, FileText, ChevronRight } from "lucide-react";
import { useDashboardStats } from "../../hooks/useDashboard";
import { usePeople, type Person } from "../../hooks/usePeople";
import { useMe } from "../../hooks/useAuth";
import { Card, Skeleton } from "../ui";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin", zone_lead: "Zone Lead", area_lead: "Area Lead", hotel_person: "Hotel Person", user: "User",
};

type Tone = { bg: string; fg: string };
const TONES: Record<string, Tone> = {
  indigo:  { bg: "var(--m-accent-soft)", fg: "var(--m-accent)" },
  emerald: { bg: "var(--m-aco-bg)",      fg: "var(--m-aco-fg)" },
  sky:     { bg: "var(--m-sky-bg)",      fg: "var(--m-sky-fg)" },
  amber:   { bg: "var(--m-amber-bg)",    fg: "var(--m-amber-fg)" },
};

function StatCard({ icon, value, label, tone, loading }: {
  icon: React.ReactNode; value?: number; label: string; tone: Tone; loading?: boolean;
}) {
  return (
    <Card className="!p-[15px]">
      <div className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center mb-3"
        style={{ background: tone.bg, color: tone.fg }}>
        {icon}
      </div>
      {loading
        ? <Skeleton className="h-7 w-12 rounded-lg mb-1" />
        : <p className="m-serif text-[28px] font-extrabold leading-none tabular-nums">{value ?? 0}</p>}
      <p className="text-[12.5px] font-medium text-[var(--m-muted)] mt-1.5">{label}</p>
    </Card>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Card onClick={onClick} className="flex items-center gap-3 !py-3.5">
      <span className="m-grad-accent w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0 text-white">
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
  const firstName = (me?.user?.name || me?.user?.email || "there").split(/[\s@]/)[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
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
      {/* Hero */}
      <div className="m-grad-accent m-glow relative overflow-hidden rounded-[22px] p-5 mb-[14px]">
        <div className="absolute -right-8 -top-10 w-36 h-36 rounded-full bg-white/15 blur-2xl pointer-events-none" />
        <div className="absolute -left-6 -bottom-12 w-28 h-28 rounded-full bg-black/10 blur-2xl pointer-events-none" />
        <p className="relative text-white/85 text-[13px] font-medium">{greeting}, {firstName}</p>
        <h1 className="relative m-serif text-white text-[27px] font-extrabold leading-tight mt-0.5">Dashboard</h1>
        <div className="relative mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white text-[12px] font-semibold backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          {ROLE_LABEL[role] ?? "User"}
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-[11px] m-stagger">
        <StatCard icon={<Users className="w-[18px] h-[18px]" />} value={stats?.totalPeople} label="Registered" tone={TONES.indigo} loading={isLoading} />
        <StatCard icon={<TrendingUp className="w-[18px] h-[18px]" />} value={stats?.acoPlayers} label="ACO players" tone={TONES.emerald} loading={isLoading} />
        <StatCard icon={<UsersRound className="w-[18px] h-[18px]" />} value={stats?.totalTeams} label="Teams" tone={TONES.sky} loading={isLoading} />
        <StatCard icon={<Hotel className="w-[18px] h-[18px]" />} value={stats?.totalHotels} label="Hotels" tone={TONES.amber} loading={isLoading} />
      </div>

      {/* Check-in by zone */}
      <Card className="mt-[11px]">
        <div className="flex items-center justify-between mb-3.5">
          <p className="text-[13.5px] font-bold">Check-in by zone</p>
          <span className="text-[11px] font-semibold text-[var(--m-faint)]">Live</span>
        </div>
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
                    <div className="m-bar-fill m-grad-accent h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Quick actions */}
      <p className="text-[13.5px] font-bold mt-6 mb-2.5 px-0.5">Quick actions</p>
      <div className="grid grid-cols-1 gap-[11px] m-stagger">
        <QuickAction icon={<UserPlus className="w-[18px] h-[18px]" />} label="Register person" onClick={() => navigate("/registration")} />
        <QuickAction icon={<ClipboardList className="w-[18px] h-[18px]" />} label="Assignments" onClick={() => navigate("/assignments")} />
        <QuickAction icon={<Sparkles className="w-[18px] h-[18px]" />} label="Search Assistant" onClick={() => navigate("/search-assistant")} />
        <QuickAction icon={<FileText className="w-[18px] h-[18px]" />} label="Final List" onClick={() => navigate("/final-list")} />
      </div>
    </div>
  );
}
