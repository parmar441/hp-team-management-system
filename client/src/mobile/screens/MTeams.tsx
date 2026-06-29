import { useState } from "react";
import { Plus, X, UsersRound, Search, Check } from "lucide-react";
import {
  useTeams, useAvailablePeople, useCreateTeam, useDeleteTeam, useAddTeamMembers, useRemoveTeamMembers, type Team,
} from "../../hooks/useTeams";
import type { Person } from "../../hooks/usePeople";
import { useMe } from "../../hooks/useAuth";
import { Pill, ScreenHeader, Sheet, EmptyState, CardSkeletons, PrimaryButton, useToast } from "../ui";

function nm(p: Person) { return `${p.firstName} ${p.lastName || ""}`.trim(); }

function MemberPicker({ open, onClose, people, onConfirm, title, pending }: {
  open: boolean; onClose: () => void; people: Person[]; onConfirm: (ids: string[]) => void; title: string; pending?: boolean;
}) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const filtered = people.filter((p) => nm(p).toLowerCase().includes(q.toLowerCase()));
  function toggle(id: string) { setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  return (
    <Sheet open={open} onClose={() => { setSel(new Set()); onClose(); }}
      title={<p className="m-serif text-[20px] font-bold">{title}</p>}
      footer={<PrimaryButton disabled={sel.size < 1 || pending} onClick={() => onConfirm([...sel])}>Add {sel.size || ""} {sel.size === 1 ? "member" : "members"}</PrimaryButton>}>
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--m-faint)]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search available people…"
          className="w-full h-[44px] pl-9 pr-3 rounded-[12px] border text-[14px] outline-none"
          style={{ background: "var(--m-input)", borderColor: "var(--m-input-border)", color: "var(--m-text)" }} />
      </div>
      {filtered.length === 0 ? <p className="text-[13px] text-[var(--m-muted)] py-4 text-center">No available ACO players.</p> : (
        <div className="space-y-1.5 pb-2">
          {filtered.map((p) => {
            const on = sel.has(p._id);
            return (
              <button key={p._id} onClick={() => toggle(p._id)}
                className="w-full flex items-center gap-3 p-2.5 rounded-[12px]" style={{ background: "var(--m-inset)" }}>
                <span className="text-[14px] font-semibold flex-1 text-left truncate">{nm(p)}</span>
                {p.zone && <span className="text-[11px] text-[var(--m-faint)]">{p.zone}</span>}
                <span className="w-5 h-5 rounded-md flex items-center justify-center border"
                  style={on ? { background: "var(--m-accent)", borderColor: "var(--m-accent)" } : { borderColor: "var(--m-card-border)" }}>
                  {on && <Check className="w-3.5 h-3.5 text-white" />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}

export default function MTeams() {
  const toast = useToast();
  const isAdmin = useMe().data?.user?.role === "admin";
  const { data: teams, isLoading } = useTeams();
  const { data: available } = useAvailablePeople();
  const createTeam = useCreateTeam();
  const deleteTeam = useDeleteTeam();
  const addMembers = useAddTeamMembers();
  const removeMembers = useRemoveTeamMembers();

  const [createOpen, setCreateOpen] = useState(false);
  const [addTo, setAddTo] = useState<Team | null>(null);

  const list: Team[] = teams ?? [];
  const avail: Person[] = available ?? [];

  return (
    <div className="pt-2">
      <ScreenHeader title="Teams" subtitle={`${avail.length} ACO players available`}
        action={isAdmin && (
          <button onClick={() => setCreateOpen(true)}
            className="m-grad-accent m-glow m-press inline-flex items-center gap-1.5 h-[40px] px-4 rounded-full text-[13px] font-bold text-white">
            <Plus className="w-4 h-4" /> New
          </button>
        )} />

      {isLoading ? <CardSkeletons count={4} height={132} />
        : list.length === 0 ? <EmptyState icon={<UsersRound className="w-6 h-6" />} title="No teams yet" hint={isAdmin ? "Tap New to form a team" : undefined} />
        : (
          <div className="space-y-[11px] m-stagger">
            {list.map((t) => (
              <div key={t._id} className="m-sheen rounded-[18px] border p-[15px]" style={{ backgroundColor: "var(--m-card)", borderColor: "var(--m-card-border)", boxShadow: "var(--m-shadow-card)" }}>
                <div className="flex items-center gap-2 mb-2.5">
                  <p className="m-serif text-[19px] font-bold flex-1 truncate">{t.name}</p>
                  {t.zone && <Pill tone="accent">{t.zone}</Pill>}
                  <span className="text-[12px] font-semibold text-[var(--m-faint)] tabular-nums">{t.members.length} / 8</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "var(--m-track)" }}>
                  <div className="m-bar-fill m-grad-accent h-full rounded-full" style={{ width: `${(t.members.length / 8) * 100}%` }} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {t.members.map((m) => (
                    <span key={m._id} className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-[10px]" style={{ background: "var(--m-inset)" }}>
                      <span className="text-[12.5px] font-semibold">{nm(m)}</span>
                      {isAdmin && (
                        <button onClick={() => removeMembers.mutate({ id: t._id, members: [m._id] }, { onSuccess: () => toast("Member removed") })}
                          className="text-[var(--m-faint)]"><X className="w-3 h-3" /></button>
                      )}
                    </span>
                  ))}
                  {t.members.length === 0 && <span className="text-[12.5px] text-[var(--m-faint)] py-1">No members yet</span>}
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-4 mt-3">
                    {t.members.length < 8 && (
                      <button onClick={() => setAddTo(t)} className="text-[12.5px] font-semibold" style={{ color: "var(--m-accent)" }}>+ Add members</button>
                    )}
                    <button onClick={() => deleteTeam.mutate(t._id, { onSuccess: () => toast("Team deleted") })}
                      className="text-[12.5px] font-semibold" style={{ color: "var(--m-rose-fg)" }}>Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      <MemberPicker open={createOpen} onClose={() => setCreateOpen(false)} people={avail} title="New team" pending={createTeam.isPending}
        onConfirm={(ids) => createTeam.mutate({ members: ids }, { onSuccess: () => { toast("Team created"); setCreateOpen(false); }, onError: () => toast("Need 2–8 ACO players") })} />

      <MemberPicker open={!!addTo} onClose={() => setAddTo(null)} people={avail} title={`Add to ${addTo?.name ?? ""}`} pending={addMembers.isPending}
        onConfirm={(ids) => addTo && addMembers.mutate({ id: addTo._id, members: ids }, { onSuccess: () => { toast("Members added"); setAddTo(null); }, onError: () => toast("Failed to add members") })} />
    </div>
  );
}
