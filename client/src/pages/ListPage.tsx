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
      p.zone || "", p.area || "", p.mandal || "", p.ageRange || "",
    ].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "aco-list.csv";
    a.click();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <List className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            </div>
            <span className="truncate">ACO Player List</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} ACO players</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-2.5 sm:px-4 py-2.5 text-sm font-medium border border-gray-200 bg-white rounded-xl text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={zoneFilter} onValueChange={(v) => { setZoneFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44 rounded-xl border-gray-200">
            <SelectValue placeholder="All zones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All zones</SelectItem>
            {(zoneNames ?? []).map((z: string) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">#</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Zone</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Area</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mandal</th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Age Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-3 sm:px-4 py-3"><div className="h-4 w-6 bg-gray-100 rounded-lg animate-pulse" /></td>
                    <td className="px-3 sm:px-4 py-3"><div className="h-4 w-32 bg-gray-100 rounded-lg animate-pulse" /></td>
                    {[1,2,3,4,5].map((j) => (
                      <td key={j} className={`px-4 py-3 ${j <= 2 ? "hidden sm:table-cell" : j <= 4 ? "hidden md:table-cell" : "hidden lg:table-cell"}`}>
                        <div className="h-4 w-16 bg-gray-100 rounded-lg animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : people.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <List className="w-7 h-7 text-gray-400" />
                      </div>
                      <p className="text-gray-900 font-medium">No ACO players found</p>
                      <p className="text-sm text-gray-500">Try adjusting your search or filter</p>
                    </div>
                  </td>
                </tr>
              ) : (
                people.map((p, idx) => (
                  <tr key={p._id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-3 sm:px-4 py-3 text-gray-400 text-xs tabular-nums">{(page - 1) * 50 + idx + 1}</td>
                    <td className="px-3 sm:px-4 py-3">
                      <p className="font-medium text-gray-900 whitespace-nowrap">{`${p.firstName} ${p.lastName || ""}`.trim()}</p>
                      {/* Show key info inline on mobile where columns are hidden */}
                      <p className="text-xs text-gray-400 mt-0.5 sm:hidden">
                        {[p.gender === "M" ? "Male" : "Female", p.zone, p.mandal].filter(Boolean).join(" · ")}
                      </p>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p.gender === "M" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"
                      }`}>
                        {p.gender === "M" ? "Male" : "Female"}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-gray-500 whitespace-nowrap">{p.zone || "—"}</td>
                    <td className="hidden md:table-cell px-4 py-3 text-gray-500 whitespace-nowrap">{p.area || "—"}</td>
                    <td className="hidden md:table-cell px-4 py-3 text-gray-500 whitespace-nowrap">{p.mandal || "—"}</td>
                    <td className="hidden lg:table-cell px-4 py-3 text-gray-500 whitespace-nowrap">{p.ageRange || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 50 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs sm:text-sm text-gray-500">
              {(page - 1) * 50 + 1}–{Math.min(page * 50, total)}
              <span className="hidden sm:inline"> of {total}</span>
            </p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-sm font-medium border border-gray-200 bg-white rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline">Previous</span>
              </button>
              <button disabled={page * 50 >= total} onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-sm font-medium border border-gray-200 bg-white rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <span className="hidden sm:inline">Next</span><ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
