import { useState } from "react";
import { useAssignments, useUpdateAssignmentRoom } from "../hooks/useAssignments";
import { useDynamicZoneNames } from "../hooks/useDynamicZones";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ClipboardList, Hotel, DoorOpen, Edit2, Check, X, Download } from "lucide-react";

function RoomEditor({ slotId, current, onSaved }: { slotId: string; current?: string; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current || "");
  const update = useUpdateAssignmentRoom();

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-sm group">
        <DoorOpen className="w-4 h-4 text-gray-400" />
        <span className="text-gray-500 group-hover:text-gray-900">{current || "Set room"}</span>
        <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-gray-400" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-7 w-24 text-sm px-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        autoFocus
      />
      <button
        onClick={async () => { await update.mutateAsync({ slotId, roomNumber: value }); setEditing(false); onSaved(); }}
        className="text-green-600 hover:text-green-700"
      >
        <Check className="w-4 h-4" />
      </button>
      <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-700">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function AssignmentsPage() {
  const { data: slots, isLoading, refetch } = useAssignments();
  const { data: zoneNames } = useDynamicZoneNames();
  const [zoneFilter, setZoneFilter] = useState("");
  const [hotelFilter, setHotelFilter] = useState("");

  const allSlots = slots ?? [];
  const hotelNames = [...new Set(allSlots.map((s: any) => s.tournamentId?.name as string).filter(Boolean))] as string[];

  const filtered = allSlots.filter((s: any) => {
    if (zoneFilter && s.teamId?.zone !== zoneFilter) return false;
    if (hotelFilter && s.tournamentId?.name !== hotelFilter) return false;
    return true;
  });

  const byHotel: Record<string, any[]> = {};
  filtered.forEach((s: any) => {
    const hotelName = s.tournamentId?.name || "Unknown Hotel";
    if (!byHotel[hotelName]) byHotel[hotelName] = [];
    byHotel[hotelName].push(s);
  });

  function exportCSV() {
    const headers = ["Hotel", "Slot", "Room", "Team", "Zone", "Members"];
    const rows = filtered.map((s: any) => [
      s.tournamentId?.name || "",
      s.slotNumber,
      s.roomNumber || "",
      s.teamId?.name || "",
      s.teamId?.zone || "",
      s.teamId?.members?.map((m: any) => `${m.firstName} ${m.lastName || ""}`.trim()).join("; ") || "",
    ].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "assignments.csv";
    a.click();
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
            <p className="text-sm text-gray-500">{filtered.length} assigned slots</p>
          </div>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 bg-white text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="flex gap-3">
        <Select value={zoneFilter} onValueChange={(v) => setZoneFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-44 rounded-xl border-gray-200">
            <SelectValue placeholder="All zones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All zones</SelectItem>
            {(zoneNames ?? []).map((z: string) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={hotelFilter} onValueChange={(v) => setHotelFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-44 rounded-xl border-gray-200">
            <SelectValue placeholder="All hotels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All hotels</SelectItem>
            {hotelNames.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="space-y-3">
                <div className="h-4 w-28 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-4 w-full bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : Object.keys(byHotel).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <ClipboardList className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No assignments found</h3>
          <p className="text-sm text-gray-500">Assign teams to hotel slots in the Hotels page.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(byHotel).map(([hotelName, hotelSlots]) => (
            <div key={hotelName}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Hotel className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">{hotelName}</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  {hotelSlots.length} teams
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {hotelSlots.map((slot: any) => {
                  const team = slot.teamId;
                  return (
                    <div key={slot._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-indigo-200 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-900">{team?.name || "—"}</h4>
                        <RoomEditor slotId={slot._id} current={slot.roomNumber} onSaved={() => refetch()} />
                      </div>
                      {team?.zone && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 mb-2">
                          {team.zone}
                        </span>
                      )}
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {team?.members?.map((m: any) => `${m.firstName} ${m.lastName || ""}`.trim()).join(", ") || "No members"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
