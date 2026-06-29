import { useState } from "react";
import { useDashboardOverview } from "../hooks/useDashboard";
import { useDynamicZoneNames } from "../hooks/useDynamicZones";
import { useDynamicAreas } from "../hooks/useDynamicAreas";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Filter, Hotel } from "lucide-react";

const ROWS = [
  { key: "people", label: "People", dot: "bg-slate-400" },
  { key: "aco",    label: "ACO",    dot: "bg-gray-300" },
  { key: "teams",  label: "Teams",  dot: "bg-amber-500" },
  { key: "hotels", label: "Hotels", dot: "bg-blue-500" },
  { key: "rooms",  label: "Rooms",  dot: "bg-emerald-500" },
] as const;

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

export default function HomePage() {
  const [zone, setZone] = useState("");
  const [area, setArea] = useState("");
  const { data, isLoading } = useDashboardOverview(zone, area);
  const { data: zoneNames } = useDynamicZoneNames();
  const { data: areas } = useDynamicAreas();

  const counts = data?.counts;
  const peopleTotal = data?.peopleTotal ?? 0;
  const notCheckedIn = peopleTotal - (data?.checkedInTotal ?? 0);

  return (
    <div className="p-5 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your group, teams, and hotel assignments.</p>
      </div>

      {/* Status card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500">
            <Filter className="w-4 h-4" /> Filter:
          </span>
          <Select value={zone || "all"} onValueChange={(v) => setZone(v === "all" ? "" : v)}>
            <SelectTrigger className="w-44 rounded-xl border-gray-200"><SelectValue placeholder="All Zones" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              {(zoneNames ?? []).map((z: string) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={area || "all"} onValueChange={(v) => setArea(v === "all" ? "" : v)}>
            <SelectTrigger className="w-44 rounded-xl border-gray-200"><SelectValue placeholder="All Areas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {(areas ?? []).map((a: any) => <SelectItem key={a._id || a.name} value={a.name}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Status table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-right px-5 py-3">Count</th>
              <th className="text-right px-5 py-3">Checked In</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {ROWS.map((r) => {
              const c = counts?.[r.key] ?? { count: 0, checkedIn: 0 };
              return (
                <tr key={r.key} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-2.5 font-semibold text-gray-900">
                      <span className={`w-2.5 h-2.5 rounded-full ${r.dot}`} /> {r.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums">
                    {isLoading ? <span className="text-gray-300">…</span> : (
                      <><span className="font-bold text-gray-900">{c.count}</span> <span className="text-gray-400">({pct(c.count, peopleTotal)}%)</span></>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums">
                    {isLoading ? <span className="text-gray-300">…</span> : (
                      <><span className="font-bold text-gray-900">{c.checkedIn}</span> <span className="text-gray-400">({pct(c.checkedIn, c.count)}%)</span></>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Check-in summary */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/40 text-sm text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>Checked In: <span className="font-semibold text-gray-900">{data?.checkedInTotal ?? 0}</span> / {peopleTotal} people</span>
          <span className="text-gray-300">•</span>
          <span>Not Checked In: <span className="font-semibold text-rose-600">{notCheckedIn}</span></span>
        </div>
      </div>

      {/* Hotel Overview */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Hotel Overview</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80">
                <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Hotel Name</th>
                  <th className="text-right px-5 py-3 whitespace-nowrap">Total Slots</th>
                  <th className="text-right px-5 py-3">Remaining</th>
                  <th className="text-left px-5 py-3 whitespace-nowrap">Zone — Slots</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5"><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></td>
                    ))}</tr>
                  ))
                ) : (data?.hotels ?? []).length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400">
                    <Hotel className="w-7 h-7 mx-auto mb-2 text-gray-300" /> No hotels yet
                  </td></tr>
                ) : (
                  (data?.hotels ?? []).map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5 font-semibold text-gray-900 whitespace-nowrap">{h.name}</td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-gray-700">{h.totalSlots}</td>
                      <td className="px-5 py-3.5 text-right tabular-nums">
                        <span className={`font-semibold ${h.remaining === 0 ? "text-emerald-600" : "text-gray-900"}`}>{h.remaining}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {h.zones.length === 0 ? (
                          <span className="text-gray-400">No assignments yet</span>
                        ) : (
                          <span className="flex flex-wrap gap-1.5">
                            {h.zones.map((z) => (
                              <span key={z.zone} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700">
                                {z.zone} — {z.slots}
                              </span>
                            ))}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
