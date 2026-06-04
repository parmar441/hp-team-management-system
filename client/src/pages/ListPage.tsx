import { useState } from "react";
import { usePeople, type Person } from "../hooks/usePeople";
import { useDynamicZoneNames } from "../hooks/useDynamicZones";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useDebounce } from "../hooks/useDebounce";
import { List, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function ListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");

  const debouncedSearch = useDebounce(search, 350);
  const { data, isLoading } = usePeople({ acoNeeded: "Yes", search: debouncedSearch, zone: zoneFilter, page, pageSize: 50 });
  const { data: zoneNames } = useDynamicZoneNames();

  const people: Person[] = data?.people ?? [];
  const total = data?.total ?? 0;

  function exportCSV() {
    const headers = ["Name", "Gender", "Zone", "Area", "Mandal", "Age Range"];
    const rows = people.map((p) => [
      `${p.firstName} ${p.lastName || ""}`.trim(),
      p.gender === "M" ? "Male" : "Female",
      p.zone || "",
      p.area || "",
      p.mandal || "",
      p.ageRange || "",
    ].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "aco-list.csv";
    a.click();
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600">
            <List className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ACO Player List</h1>
            <p className="text-sm text-gray-500">{total} ACO players (acoNeeded = "Yes")</p>
          </div>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 bg-white rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={zoneFilter} onValueChange={(v) => { setZoneFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-44 rounded-xl border-gray-200">
            <SelectValue placeholder="All zones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All zones</SelectItem>
            {(zoneNames ?? []).map((z: string) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Zone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Area</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mandal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Age Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-full bg-gray-100 rounded-lg animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : people.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                        <List className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-900 font-medium">No ACO players found</p>
                      <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filter</p>
                    </div>
                  </td>
                </tr>
              ) : (
                people.map((p, idx) => (
                  <tr key={p._id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{(page - 1) * 50 + idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{`${p.firstName} ${p.lastName || ""}`.trim()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p.gender === "M" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"
                      }`}>
                        {p.gender === "M" ? "Male" : "Female"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.zone || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{p.area || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{p.mandal || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{p.ageRange || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {total > 50 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-gray-200 bg-white rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                disabled={page * 50 >= total}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-gray-200 bg-white rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
