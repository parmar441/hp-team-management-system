import { useState } from "react";
import { useTeams, useAvailablePeople, useCreateTeam, useDeleteTeam, useAddTeamMembers, useRemoveTeamMembers, type Team } from "../hooks/useTeams";
import type { Person } from "../hooks/usePeople";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import { useToast } from "../components/ui/toaster";
import { UsersRound, Plus, Trash2, UserMinus, UserPlus, Search, X, CheckCircle2 } from "lucide-react";

function getZoneColor(zone?: string | null) {
  if (!zone) return { bg: "bg-gray-100", text: "text-gray-500" };
  const hash = zone.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const palette = [
    { bg: "bg-indigo-100", text: "text-indigo-700" },
    { bg: "bg-purple-100", text: "text-purple-700" },
    { bg: "bg-blue-100", text: "text-blue-700" },
    { bg: "bg-cyan-100", text: "text-cyan-700" },
    { bg: "bg-teal-100", text: "text-teal-700" },
    { bg: "bg-emerald-100", text: "text-emerald-700" },
  ];
  return palette[hash % palette.length];
}

function TeamCard({
  team,
  onDelete,
  availablePeople,
}: {
  team: Team;
  onDelete: () => void;
  availablePeople: Person[];
}) {
  const toast = useToast();
  const addMembers = useAddTeamMembers();
  const removeMembers = useRemoveTeamMembers();
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const capacity = 8;
  const count = team.members.length;
  const pct = (count / capacity) * 100;
  const zoneColor = getZoneColor(team.zone);
  const isFull = count >= capacity;

  function toggleSelect(id: string) {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function handleAdd() {
    try {
      await addMembers.mutateAsync({ id: team._id, members: [...selected] });
      toast.success(`${selected.size} member${selected.size > 1 ? "s" : ""} added to ${team.name}`);
    } catch {
      toast.error("Failed to add members");
    }
    setSelected(new Set());
    setAdding(false);
    setSearch("");
  }

  const filtered = availablePeople.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {team.name?.slice(0, 2).toUpperCase() || "TM"}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{team.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                {team.zone && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${zoneColor.bg} ${zoneColor.text}`}>
                    {team.zone}
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isFull ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>
                  {count}/{capacity} {isFull ? "Full" : "slots"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Delete team"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isFull ? "bg-red-400" : "bg-indigo-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Members List */}
      <div className="px-5 py-3">
        {team.members.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-3">No members yet</p>
        ) : (
          <ul className="space-y-1.5">
            {team.members.map((m, i) => (
              <li key={m._id} className="flex items-center justify-between group py-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 flex-shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-sm font-medium text-gray-800">{`${m.firstName} ${m.lastName || ""}`.trim()}</p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {m.zone && <span className="text-xs text-gray-400">{m.zone}</span>}
                  <button
                    onClick={() => setRemovingMemberId(m._id)}
                    className="p-1 rounded text-gray-300 hover:text-red-500 transition-colors"
                    title="Remove member"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add Members Section */}
      {!isFull && (
        <div className="px-5 pb-5">
          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all"
            >
              <UserPlus className="w-4 h-4" /> Add Members
            </button>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <input
                  autoFocus
                  className="flex-1 text-sm outline-none placeholder-gray-400"
                  placeholder="Search people..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button onClick={() => { setAdding(false); setSelected(new Set()); setSearch(""); }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="max-h-36 overflow-y-auto divide-y divide-gray-50">
                {filtered.slice(0, 15).map((p) => (
                  <label key={p._id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.has(p._id)}
                      onChange={() => toggleSelect(p._id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{`${p.firstName} ${p.lastName || ""}`.trim()}</span>
                    {p.zone && <span className="text-xs text-gray-400 ml-auto">{p.zone}</span>}
                  </label>
                ))}
                {filtered.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">No available players found</p>
                )}
              </div>
              <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                <span className="text-xs text-gray-500">{selected.size} selected</span>
                <button
                  disabled={selected.size === 0 || addMembers.isPending}
                  onClick={handleAdd}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                >
                  {addMembers.isPending ? "Adding..." : <><CheckCircle2 className="w-3.5 h-3.5" /> Add</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Remove Member Confirmation */}
      <ConfirmDialog
        open={removingMemberId !== null}
        onOpenChange={(open) => !open && setRemovingMemberId(null)}
        title="Remove Member"
        description={`Remove this person from ${team.name}? They will become available for other teams.`}
        confirmLabel="Remove"
        onConfirm={() => {
          if (!removingMemberId) return;
          removeMembers.mutate({ id: team._id, members: [removingMemberId] }, {
            onSuccess: () => { toast.success("Member removed"); setRemovingMemberId(null); },
            onError: () => { toast.error("Failed to remove member"); setRemovingMemberId(null); },
          });
        }}
        loading={removeMembers.isPending}
      />
    </div>
  );
}

export default function TeamsPage() {
  const toast = useToast();
  const { data: teams, isLoading } = useTeams();
  const { data: availablePeople } = useAvailablePeople();
  const createTeam = useCreateTeam();
  const deleteTeam = useDeleteTeam();
  const [showCreate, setShowCreate] = useState(false);
  const [newSelected, setNewSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);

  const available: Person[] = availablePeople ?? [];
  const filtered = available.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  function toggleNewSelect(id: string) {
    setNewSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function handleCreate() {
    if (newSelected.size < 2) return;
    try {
      await createTeam.mutateAsync({ members: [...newSelected] });
      toast.success("Team created successfully");
    } catch {
      toast.error("Failed to create team");
    }
    setNewSelected(new Set());
    setSearch("");
    setShowCreate(false);
  }

  const teamList = teams ?? [];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <UsersRound className="w-5 h-5 text-blue-600" />
            </div>
            Teams
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {teamList.length} teams formed · {available.length} available players
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus className="w-4 h-4" /> Create Team
        </button>
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="h-32 bg-gray-50 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      ) : teamList.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <UsersRound className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-700 mb-1">No teams yet</h3>
          <p className="text-sm text-gray-400 mb-5">
            {available.length === 0
              ? "Add people with ACO status first, then create teams here."
              : "Create your first team by selecting 2–8 ACO players."}
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Create First Team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamList.map((team: Team) => (
            <TeamCard
              key={team._id}
              team={team}
              availablePeople={available}
              onDelete={() => setDeleteTeamId(team._id)}
            />
          ))}
        </div>
      )}

      {/* Create Team Dialog */}
      <Dialog open={showCreate} onOpenChange={(v) => { setShowCreate(v); if (!v) { setNewSelected(new Set()); setSearch(""); } }}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Create New Team</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">Select 2–8 ACO players to form a team.</p>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
              placeholder="Search available players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  {available.length === 0 ? "No available ACO players. Add people first." : "No players match your search."}
                </p>
              ) : (
                filtered.map((p) => (
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
                    <span className="text-sm font-medium text-gray-800">{`${p.firstName} ${p.lastName || ""}`.trim()}</span>
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
                onClick={() => { setShowCreate(false); setNewSelected(new Set()); setSearch(""); }}
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

      {/* Delete Team Confirmation */}
      <ConfirmDialog
        open={deleteTeamId !== null}
        onOpenChange={(open) => !open && setDeleteTeamId(null)}
        title="Delete Team"
        description="This team will be permanently deleted and all members will be released back to the available pool. Hotel slot assignments will also be removed."
        confirmLabel="Delete Team"
        onConfirm={() => {
          if (!deleteTeamId) return;
          deleteTeam.mutate(deleteTeamId, {
            onSuccess: () => { toast.success("Team deleted"); setDeleteTeamId(null); },
            onError: () => { toast.error("Failed to delete team"); setDeleteTeamId(null); },
          });
        }}
        loading={deleteTeam.isPending}
      />
    </div>
  );
}
