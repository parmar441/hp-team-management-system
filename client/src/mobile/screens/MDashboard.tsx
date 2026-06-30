import { useState } from "react";
import { Hotel } from "lucide-react";
import { useDashboardOverview } from "../../hooks/useDashboard";
import { useDynamicZoneNames } from "../../hooks/useDynamicZones";
import { useDynamicAreas } from "../../hooks/useDynamicAreas";
import { ScreenHeader, Card, Pill, CardSkeletons } from "../ui";

const ROWS = [
  { key: "people", label: "People", dot: "var(--m-faint)" },
  { key: "aco",    label: "Utaro",  dot: "#9ca3af" },
  { key: "teams",  label: "Teams",  dot: "var(--m-amber-fg)" },
  { key: "hotels", label: "Hotels", dot: "var(--m-sky-fg)" },
  { key: "rooms",  label: "Rooms",  dot: "var(--m-aco-fg)" },
] as const;

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

function Dropdown({ value, onChange, allLabel, options }: {
  value: string; onChange: (v: string) => void; allLabel: string; options: string[];
}) {
  return (
    <div className="relative flex-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[42px] pl-3.5 pr-8 rounded-[13px] border text-[13.5px] font-semibold outline-none appearance-none"
        style={{ background: "var(--m-card)", borderColor: "var(--m-card-border)", color: value ? "var(--m-text)" : "var(--m-muted)" }}
      >
        <option value="">{allLabel}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--m-faint)] text-[10px]">▼</span>
    </div>
  );
}

export default function MDashboard() {
  const [zone, setZone] = useState("");
  const [area, setArea] = useState("");
  const { data, isLoading } = useDashboardOverview(zone, area);
  const { data: zoneNames } = useDynamicZoneNames();
  const { data: areas } = useDynamicAreas();

  const counts = data?.counts;
  const peopleTotal = data?.peopleTotal ?? 0;
  const notCheckedIn = peopleTotal - (data?.checkedInTotal ?? 0);
  const areaNames = (areas ?? []).map((a: any) => a.name as string);

  return (
    <div className="pt-2">
      <ScreenHeader title="Dashboard" subtitle="Group, teams & hotel assignments" />

      {/* Filters */}
      <div className="flex gap-2.5 mb-[14px]">
        <Dropdown value={zone} onChange={setZone} allLabel="All Zones" options={zoneNames ?? []} />
        <Dropdown value={area} onChange={setArea} allLabel="All Areas" options={areaNames} />
      </div>

      {/* Status */}
      <Card className="!p-0 overflow-hidden">
        <div className="flex items-center px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-wide text-[var(--m-faint)]"
          style={{ borderBottom: "1px solid var(--m-card-border)" }}>
          <span className="flex-1">Status</span>
          <span className="w-20 text-right">Count</span>
          <span className="w-24 text-right">Checked in</span>
        </div>
        {ROWS.map((r, i) => {
          const c = counts?.[r.key] ?? { count: 0, checkedIn: 0 };
          return (
            <div key={r.key} className="flex items-center px-4 py-3"
              style={i > 0 ? { borderTop: "1px solid var(--m-card-border)" } : undefined}>
              <span className="flex-1 inline-flex items-center gap-2.5 text-[14.5px] font-semibold">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.dot }} /> {r.label}
              </span>
              <span className="w-20 text-right text-[13.5px] tabular-nums">
                <span className="font-bold">{c.count}</span> <span className="text-[var(--m-faint)]">({pct(c.count, peopleTotal)}%)</span>
              </span>
              <span className="w-24 text-right text-[13.5px] tabular-nums">
                <span className="font-bold">{c.checkedIn}</span> <span className="text-[var(--m-faint)]">({pct(c.checkedIn, c.count)}%)</span>
              </span>
            </div>
          );
        })}
        <div className="px-4 py-3 text-[12.5px] flex flex-wrap items-center gap-x-2 gap-y-0.5"
          style={{ borderTop: "1px solid var(--m-card-border)", background: "var(--m-inset)" }}>
          <span className="text-[var(--m-muted)]">Checked In: <span className="font-bold text-[var(--m-text)]">{data?.checkedInTotal ?? 0}</span> / {peopleTotal}</span>
          <span className="text-[var(--m-faint)]">·</span>
          <span className="text-[var(--m-muted)]">Not Checked In: <span className="font-bold" style={{ color: "var(--m-rose-fg)" }}>{notCheckedIn}</span></span>
        </div>
      </Card>

      {/* Hotel Overview */}
      <p className="text-[13.5px] font-bold mt-6 mb-2.5 px-0.5">Hotel Overview</p>
      {isLoading ? <CardSkeletons count={3} height={84} />
        : (data?.hotels ?? []).length === 0 ? (
          <Card><div className="flex flex-col items-center text-center py-6">
            <Hotel className="w-7 h-7 mb-2 text-[var(--m-faint)]" />
            <p className="text-[13.5px] text-[var(--m-muted)]">No hotels yet</p>
          </div></Card>
        ) : (
          <div className="space-y-[11px]">
            {(data?.hotels ?? []).map((h) => (
              <Card key={h.id}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[15.5px] font-bold truncate">{h.name}</p>
                  <span className="text-[12px] text-[var(--m-faint)] flex-shrink-0 tabular-nums">
                    <span className="font-semibold text-[var(--m-muted)]">{h.remaining}</span>/{h.totalSlots} left
                  </span>
                </div>
                <div className="mt-2.5">
                  {h.zones.length === 0 ? (
                    <span className="text-[12.5px] text-[var(--m-faint)]">No assignments yet</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {h.zones.map((z) => <Pill key={z.zone} tone="accent">{z.zone} — {z.slots}</Pill>)}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
}
