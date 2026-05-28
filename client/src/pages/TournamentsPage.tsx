import { useState } from "react";
import { useTournaments, useCreateTournament, useDeleteTournament, useTournament, useAssignTeam, useUnassignTeam, useUpdateSlotRoom, useAvailableTeams, type Tournament, type TournamentSlot } from "../hooks/useTournaments";
import type { Team } from "../hooks/useTeams";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Hotel, Plus, Trash2, ChevronRight, DoorOpen, Edit2, Check, X, ArrowLeft } from "lucide-react";

function SlotRow({ slot, tournamentId }: { slot: TournamentSlot; tournamentId: string }) {
  const assignTeam = useAssignTeam();
  const unassignTeam = useUnassignTeam();
  const updateRoom = useUpdateSlotRoom();
  const { data: availableTeams } = useAvailableTeams(tournamentId);
  const [editRoom, setEditRoom] = useState(false);
  const [room, setRoom] = useState(slot.roomNumber || "");
  const [showAssign, setShowAssign] = useState(false);

  const team = slot.teamId as Team | null;

  return (
    <tr className="divide-y divide-gray-50 hover:bg-indigo-50/30 transition-colors">
      <td className="px-4 py-3 text-sm text-gray-500">#{slot.slotNumber}</td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{team ? team.name : <span className="text-gray-400">Vacant</span>}</td>
      <td className="px-4 py-3 text-sm text-gray-500">{team?.zone || "—"}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{team ? `${team.members?.length ?? 0} members` : "—"}</td>
      <td className="px-4 py-3">
        {editRoom ? (
          <div className="flex items-center gap-1">
            <input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="h-7 w-24 text-sm px-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
            <button onClick={async () => { await updateRoom.mutateAsync({ slotId: slot._id, roomNumber: room }); setEditRoom(false); }} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
            <button onClick={() => setEditRoom(false)} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <button onClick={() => setEditRoom(true)} className="flex items-center gap-1 text-sm group">
            <DoorOpen className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500 group-hover:text-gray-900">{slot.roomNumber || "Set room"}</span>
            <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-gray-400" />
          </button>
        )}
      </td>
      <td className="px-4 py-3 relative">
        {team ? (
          <button
            onClick={() => unassignTeam.mutate({ tournamentId, slotId: slot._id })}
            className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            <X className="w-3.5 h-3.5" /> Remove
          </button>
        ) : (
          <>
            <button
              onClick={() => setShowAssign(true)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium border border-gray-200 bg-white rounded-xl hover:bg-gray-50 text-gray-700 transition-colors"
            >
              Assign Team
            </button>
            {showAssign && (
              <div className="absolute z-10 bg-white border border-gray-100 rounded-xl shadow-lg p-3 mt-1 w-56">
                <p className="text-xs font-medium text-gray-700 mb-2">Select team:</p>
                {(availableTeams ?? []).slice(0, 10).map((t: Team) => (
                  <button
                    key={t._id}
                    className="w-full text-left text-sm px-2 py-1.5 hover:bg-indigo-50 rounded-lg text-gray-700 transition-colors"
                    onClick={async () => { await assignTeam.mutateAsync({ tournamentId, slotId: slot._id, teamId: t._id }); setShowAssign(false); }}
                  >
                    {t.name} <span className="text-xs text-gray-400">({t.members?.length ?? 0} members)</span>
                  </button>
                ))}
                {(availableTeams ?? []).length === 0 && (
                  <p className="text-xs text-gray-400 py-1">No teams available</p>
                )}
              </div>
            )}
          </>
        )}
      </td>
    </tr>
  );
}

function TournamentDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { data, isLoading } = useTournament(id);
  const tournament: Tournament = data?.tournament;
  const slots: TournamentSlot[] = data?.slots ?? [];
  const occupied = slots.filter((s) => s.teamId != null).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-5 w-40 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-4 w-24 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{tournament?.name}</h2>
            <p className="text-sm text-gray-500">{occupied}/{tournament?.totalSlots} slots occupied</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Slot</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Team</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Zone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Members</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Room</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 w-full bg-gray-100 rounded-lg animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : (
                slots.map((slot) => <SlotRow key={slot._id} slot={slot} tournamentId={id} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function TournamentsPage() {
  const { data: tournaments, isLoading } = useTournaments();
  const createTournament = useCreateTournament();
  const deleteTournament = useDeleteTournament();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<{ name: string; address: string; totalSlots: string; status: "upcoming" | "not_available" | "available" }>({ name: "", address: "", totalSlots: "8", status: "upcoming" });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createTournament.mutateAsync({ ...form, totalSlots: parseInt(form.totalSlots, 10) });
    setShowCreate(false);
    setForm({ name: "", address: "", totalSlots: "8", status: "upcoming" });
  }

  if (selectedId) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <TournamentDetail id={selectedId} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Hotel className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hotels</h1>
            <p className="text-sm text-gray-500">{tournaments?.length ?? 0} hotels registered</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Hotel
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="space-y-3">
                <div className="h-5 w-32 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-4 w-48 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-4 w-20 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (tournaments ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Hotel className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No hotels yet</h3>
          <p className="text-sm text-gray-500">Add your first hotel to start managing slots.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(tournaments ?? []).map((t: Tournament) => (
            <div
              key={t._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer p-5"
              onClick={() => setSelectedId(t._id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Hotel className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{t.name}</h3>
                    {t.address && <p className="text-xs text-gray-500 mt-0.5">{t.address}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    t.status === "available" ? "bg-green-50 text-green-700" :
                    t.status === "upcoming" ? "bg-blue-50 text-blue-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {t.status.replace("_", " ")}
                  </span>
                  <button
                    onClick={() => deleteTournament.mutate(t._id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <span className="text-sm text-gray-500">{t.totalSlots} total slots</span>
                <span className="text-sm text-indigo-600 font-medium flex items-center gap-0.5">
                  View slots <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Hotel</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Hotel Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter hotel name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Address</label>
              <input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter address"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Total Slots</label>
              <input
                type="number"
                min="1"
                max="100"
                value={form.totalSlots}
                onChange={(e) => setForm((f) => ({ ...f, totalSlots: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as typeof f.status }))}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="not_available">Not Available</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm font-medium border border-gray-200 bg-white rounded-xl hover:bg-gray-50 text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createTournament.isPending}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {createTournament.isPending ? "Creating..." : "Create Hotel"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
