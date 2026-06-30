import { useState } from "react";
import { usePeople, type Person } from "../hooks/usePeople";
import { useAvailablePeople, useCreateTeam } from "../hooks/useTeams";
import { PeopleFilterBar, EMPTY_PFILTERS, type PFilters } from "../components/ui/people-filters";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useToast } from "../components/ui/toaster";
import { useDebounce } from "../hooks/useDebounce";
import { personName, genderLabel } from "../lib/utils";
import { List, Download, Search, ChevronLeft, ChevronRight, Plus, CheckCircle2 } from "lucide-react";

export default function ListPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<PFilters>(EMPTY_PFILTERS);

  const debouncedSearch = useDebounce(search, 350);
  const { data, isLoading } = usePeople({
    acoNeeded: "Yes", search: debouncedSearch, zone: filters.zone, area: filters.area,
    gender: filters.gender, country: filters.country, checkedIn: filters.checkedIn, page, pageSize: 50,
  });

  const people: Person[] = data?.people ?? [];
  const total = data?.total ?? 0;

  // Create Team
  const { data: availablePeople } = useAvailablePeople();
  const createTeam = useCreateTeam();
  const available: Person[] = availablePeople ?? [];
  const [showCreate, setShowCreate] = useState(false);
  const [newSelected, setNewSelected] = useState<Set<string>>(new Set());
  const [teamSearch, setTeamSearch] = useState("");
  const filteredAvailable = available.filter((p) =>
    personName(p).toLowerCase().includes(teamSearch.toLowerCase())
  );

  function toggleNewSelect(id: string) {
    setNewSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function handleCreate() {
    if (newSelected.size < 2 || newSelected.size > 8) return;
    try {
      await createTeam.mutateAsync({ members: [...newSelected] });
      toast.success("Team created successfully");
    } catch {
      toast.error("Failed to create team");
    }
    setNewSelected(new Set());
    setTeamSearch("");
    setShowCreate(false);
  }

  function exportCSV() {
    const headers = ["Name", "Gender", "Zone", "Area", "Mandal", "Age Range"];
    const rows = people.map((p) => [
      personName(p),
      genderLabel(p.gender),
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
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Team</span>
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-2.5 sm:px-4 py-2.5 text-sm font-medium border border-gray-200 bg-white rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
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
        <PeopleFilterBar value={filters} onChange={(v) => { setFilters(v); setPage(1); }} hide={["aco"]} />
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
                      <p className="font-medium text-gray-900 whitespace-nowrap">{personName(p)}</p>
                      {/* Show key info inline on mobile where columns are hidden */}
                      <p className="text-xs text-gray-400 mt-0.5 sm:hidden">
                        {[genderLabel(p.gender), p.zone, p.mandal].filter(Boolean).join(" · ")}
                      </p>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p.gender === "M" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"
                      }`}>
                        {genderLabel(p.gender)}
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

      {/* Create Team Dialog */}
      <Dialog open={showCreate} onOpenChange={(v) => { setShowCreate(v); if (!v) { setNewSelected(new Set()); setTeamSearch(""); } }}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Create New Team</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">Select 2–8 Utaro players to form a team.</p>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
              placeholder="Search available players..."
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
            />
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
              {filteredAvailable.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  {available.length === 0 ? "No available Utaro players. Add people first." : "No players match your search."}
                </p>
              ) : (
                filteredAvailable.map((p) => (
                  <label key={p._id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSelected.has(p._id)}
                      onChange={() => toggleNewSelect(p._id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                      {(p.firstName?.[0] || "?").toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{personName(p)}</span>
                    {p.zone && <span className="ml-auto text-xs text-gray-400">{p.zone}</span>}
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-gray-500">
              {newSelected.size === 0 && <span>Select at least 2 players</span>}
              {newSelected.size >= 2 && newSelected.size <= 8 && (
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> {newSelected.size} selected
                </span>
              )}
              {newSelected.size > 8 && <span className="text-red-500 font-medium">Max 8 players per team</span>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowCreate(false); setNewSelected(new Set()); setTeamSearch(""); }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={newSelected.size < 2 || newSelected.size > 8 || createTeam.isPending}
                onClick={handleCreate}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
              >
                {createTeam.isPending ? "Creating..." : `Create Team (${newSelected.size})`}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
