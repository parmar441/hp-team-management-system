import { useState } from "react";
import { Download, List as ListIcon, Search, Plus, Check } from "lucide-react";
import { useInfinitePeople, type Person } from "../../hooks/usePeople";
import { useAvailablePeople, useCreateTeam } from "../../hooks/useTeams";
import { useMe } from "../../hooks/useAuth";
import { useDebounce } from "../../hooks/useDebounce";
import { Pill, ScreenHeader, EmptyState, Spinner, LoadMore, Sheet, PrimaryButton, useToast } from "../ui";
import { downloadCSV, personName } from "../../lib/utils";

function MemberPicker({ open, onClose, people, onConfirm, pending }: {
  open: boolean; onClose: () => void; people: Person[]; onConfirm: (ids: string[]) => void; pending?: boolean;
}) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const filtered = people.filter((p) => personName(p).toLowerCase().includes(q.toLowerCase()));
  function toggle(id: string) { setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  return (
    <Sheet open={open} onClose={() => { setSel(new Set()); onClose(); }}
      title={<p className="m-serif text-[20px] font-bold">New team</p>}
      footer={<PrimaryButton disabled={sel.size < 2 || sel.size > 8 || pending} onClick={() => onConfirm([...sel])}>Create team {sel.size ? `(${sel.size})` : ""}</PrimaryButton>}>
      <p className="text-[12.5px] text-[var(--m-muted)] mb-3">Select 2–8 Utaro players to form a team.</p>
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--m-faint)]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search available people…"
          className="w-full h-[44px] pl-9 pr-3 rounded-[12px] border text-[14px] outline-none"
          style={{ background: "var(--m-input)", borderColor: "var(--m-input-border)", color: "var(--m-text)" }} />
      </div>
      {filtered.length === 0 ? <p className="text-[13px] text-[var(--m-muted)] py-4 text-center">No available Utaro players.</p> : (
        <div className="space-y-1.5 pb-2">
          {filtered.map((p) => {
            const on = sel.has(p._id);
            return (
              <button key={p._id} onClick={() => toggle(p._id)}
                className="w-full flex items-center gap-3 p-2.5 rounded-[12px]" style={{ background: "var(--m-inset)" }}>
                <span className="text-[14px] font-semibold flex-1 text-left truncate">{personName(p)}</span>
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

export default function MList() {
  const toast = useToast();
  const isAdmin = useMe().data?.user?.role === "admin";
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 350);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfinitePeople({ search: debounced, pageSize: 50 });
  const people: Person[] = data?.pages.flatMap((pg) => pg.people) ?? [];
  const total = data?.pages[0]?.total ?? people.length;

  const { data: available } = useAvailablePeople();
  const createTeam = useCreateTeam();
  const [createOpen, setCreateOpen] = useState(false);

  function exportCSV() {
    const rows = [["Name", "Zone", "Area", "Utaro"].join(",")];
    for (const p of people) rows.push([personName(p), p.zone || "", p.area || "", p.acoNeeded].join(","));
    downloadCSV(rows.join("\n"), "registry.csv");
    toast("List exported");
  }

  return (
    <div className="pt-2">
      <ScreenHeader title="List" subtitle={`${total} members`}
        action={
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button onClick={() => setCreateOpen(true)}
                className="m-grad-accent m-glow m-press inline-flex items-center gap-1.5 h-[40px] px-4 rounded-full text-[13px] font-bold text-white">
                <Plus className="w-4 h-4" /> Team
              </button>
            )}
            <button onClick={exportCSV} className="inline-flex items-center gap-1.5 h-[40px] px-4 rounded-full text-[13px] font-semibold border"
              style={{ borderColor: "var(--m-card-border)", color: "var(--m-text)" }}>
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        } />

      <div className="relative mb-3">
        <Search className="w-[18px] h-[18px] absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--m-faint)]" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name…"
          className="w-full h-[48px] pl-11 pr-4 rounded-[14px] border text-[15px] outline-none placeholder:text-[var(--m-faint)] focus:border-[var(--m-accent-border)]"
          style={{ background: "var(--m-card)", borderColor: "var(--m-card-border)", color: "var(--m-text)" }} />
      </div>

      {isLoading ? <div className="flex justify-center pt-16"><Spinner className="w-6 h-6" /></div>
        : people.length === 0 ? <EmptyState icon={<ListIcon className="w-6 h-6" />} title="No members found" />
        : (
          <div className="rounded-[18px] border overflow-hidden" style={{ background: "var(--m-card)", borderColor: "var(--m-card-border)" }}>
            {people.map((p, i) => (
              <div key={p._id} className="flex items-center gap-2.5 px-[15px] py-2.5"
                style={i > 0 ? { borderTop: "1px solid var(--m-card-border)" } : undefined}>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold truncate">{personName(p)}</p>
                  <p className="text-[11.5px] text-[var(--m-faint)] truncate">{[p.zone, p.area].filter(Boolean).join(" · ") || "Unassigned"}</p>
                </div>
                <Pill tone={p.acoNeeded === "Yes" ? "emerald" : "neutral"}>{p.acoNeeded === "Yes" ? "Utaro" : "—"}</Pill>
              </div>
            ))}
          </div>
        )}
      <LoadMore onLoadMore={() => fetchNextPage()} hasMore={!!hasNextPage} loading={isFetchingNextPage} />

      <MemberPicker open={createOpen} onClose={() => setCreateOpen(false)} people={available ?? []} pending={createTeam.isPending}
        onConfirm={(ids) => createTeam.mutate({ members: ids }, { onSuccess: () => { toast("Team created"); setCreateOpen(false); }, onError: () => toast("Need 2–8 Utaro players") })} />
    </div>
  );
}
