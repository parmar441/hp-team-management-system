import { useState } from "react";
import { useAssignments } from "../hooks/useAssignments";
import { useDynamicZoneNames } from "../hooks/useDynamicZones";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useDebounce } from "../hooks/useDebounce";
import { FileText, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function FinalListPage() {
  const { data: slots, isLoading } = useAssignments();
  const { data: zoneNames } = useDynamicZoneNames();
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [hotelFilter, setHotelFilter] = useState("");
  const debouncedSearch = useDebounce(search, 350);

  const allSlots = slots ?? [];
  const hotelNames = [
    ...new Set(
      allSlots
        .map((s: any) => s.tournamentId?.name as string)
        .filter(Boolean)
    ),
  ] as string[];

  const allRows: any[] = [];
  allSlots.forEach((slot: any) => {
    const team = slot.teamId;
    const hotel = slot.tournamentId;
    if (!team) return;
    (team.members ?? []).forEach((member: any) => {
      allRows.push({
        memberId: member._id,
        firstName: member.firstName,
        lastName: member.lastName || "",
        fullName: `${member.firstName} ${member.lastName || ""}`.trim(),
        gender: member.gender,
        zone: team.zone || member.zone || "",
        area: member.area || "",
        teamName: team.name,
        hotelName: hotel?.name || "",
        roomNumber: slot.roomNumber || "",
        mandal: member.mandal || "",
      });
    });
  });

  const filtered = allRows.filter((row) => {
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      if (
        !row.fullName.toLowerCase().includes(s) &&
        !row.mandal.toLowerCase().includes(s)
      )
        return false;
    }
    if (zoneFilter && row.zone !== zoneFilter) return false;
    if (hotelFilter && row.hotelName !== hotelFilter) return false;
    return true;
  });

  function exportCSV() {
    const headers = [
      "Name",
      "Gender",
      "Zone",
      "Area",
      "Team",
      "Hotel",
      "Room",
      "Mandal",
    ];
    const rows = filtered.map((r) =>
      [
        r.fullName,
        r.gender === "M" ? "Male" : "Female",
        r.zone,
        r.area,
        r.teamName,
        r.hotelName,
        r.roomNumber,
        r.mandal,
      ].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "final-list.csv";
    a.click();
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
            <FileText className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Final List</h1>
            <p className="text-sm text-gray-500">
              {filtered.length} people assigned to hotels
            </p>
          </div>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 border border-gray-200 bg-white rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Search by name or mandal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={zoneFilter}
          onValueChange={(v) => setZoneFilter(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-44 rounded-xl border-gray-200 text-sm h-[42px]">
            <SelectValue placeholder="All zones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All zones</SelectItem>
            {(zoneNames ?? []).map((z: string) => (
              <SelectItem key={z} value={z}>
                {z}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={hotelFilter}
          onValueChange={(v) => setHotelFilter(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-44 rounded-xl border-gray-200 text-sm h-[42px]">
            <SelectValue placeholder="All hotels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All hotels</SelectItem>
            {hotelNames.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Gender
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Zone
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Team
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Hotel
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Room
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Mandal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-full bg-gray-100 rounded-lg animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        No results found
                      </p>
                      <p className="text-sm text-gray-500">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => (
                  <tr
                    key={`${row.memberId}-${idx}`}
                    className="hover:bg-indigo-50/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-400 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.fullName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          row.gender === "M"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-purple-50 text-purple-700"
                        }`}
                      >
                        {row.gender === "M" ? "Male" : "Female"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {row.zone || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{row.teamName}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {row.hotelName}
                    </td>
                    <td className="px-4 py-3 font-medium text-indigo-600">
                      {row.roomNumber || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {row.mandal || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
