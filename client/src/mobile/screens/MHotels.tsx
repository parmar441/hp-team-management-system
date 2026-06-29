import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Hotel, Trash2 } from "lucide-react";
import { useTournaments, useCreateTournament, useDeleteTournament, type Tournament } from "../../hooks/useTournaments";
import { useAssignments } from "../../hooks/useAssignments";
import { useMe } from "../../hooks/useAuth";
import { ScreenHeader, IconButton, Pill, Sheet, Label, TextInput, ChipGroup, PrimaryButton, EmptyState, CardSkeletons, useToast } from "../ui";

const STATUS: Record<Tournament["status"], { tone: "emerald" | "amber" | "rose"; label: string }> = {
  available: { tone: "emerald", label: "Available" },
  upcoming: { tone: "amber", label: "Upcoming" },
  not_available: { tone: "rose", label: "Not available" },
};

export default function MHotels() {
  const toast = useToast();
  const navigate = useNavigate();
  const isAdmin = useMe().data?.user?.role === "admin";
  const { data: hotels, isLoading } = useTournaments();
  const { data: slots } = useAssignments();
  const createHotel = useCreateTournament();
  const deleteHotel = useDeleteTournament();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", totalSlots: "8", status: "upcoming" as Tournament["status"] });

  const occupied = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of (slots ?? []) as any[]) {
      const id = s.tournamentId?._id ?? s.tournamentId;
      if (id && s.teamId) m.set(id, (m.get(id) ?? 0) + 1);
    }
    return m;
  }, [slots]);

  const list: Tournament[] = hotels ?? [];

  function create() {
    if (!form.name.trim()) { toast("Hotel name required"); return; }
    createHotel.mutate({ ...form, totalSlots: parseInt(form.totalSlots) || 8 }, {
      onSuccess: () => { toast("Hotel added"); setOpen(false); setForm({ name: "", address: "", totalSlots: "8", status: "upcoming" }); },
      onError: () => toast("Failed to add hotel"),
    });
  }

  return (
    <div className="pt-2">
      <ScreenHeader title="Hotels" subtitle={`${list.length} venues`}
        action={isAdmin && <IconButton onClick={() => setOpen(true)} aria-label="Add hotel"><Plus className="w-5 h-5" /></IconButton>} />

      {isLoading ? <CardSkeletons count={4} height={116} />
        : list.length === 0 ? <EmptyState icon={<Hotel className="w-6 h-6" />} title="No hotels yet" hint={isAdmin ? "Tap + to add a venue" : undefined} />
        : (
          <div className="space-y-[11px] m-stagger">
            {list.map((h) => {
              const occ = occupied.get(h._id) ?? 0;
              const pct = h.totalSlots > 0 ? (occ / h.totalSlots) * 100 : 0;
              const st = STATUS[h.status];
              return (
                <div key={h._id} onClick={() => navigate("/assignments")}
                  className="m-sheen m-press rounded-[18px] border p-[15px] cursor-pointer"
                  style={{ backgroundColor: "var(--m-card)", borderColor: "var(--m-card-border)", boxShadow: "var(--m-shadow-card)" }}>
                  <div className="flex items-start gap-3">
                    <span className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--m-accent-soft)", color: "var(--m-accent)" }}>
                      <Hotel className="w-5 h-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[16.5px] font-bold truncate">{h.name}</p>
                      {h.address && <p className="text-[12.5px] text-[var(--m-muted)] truncate mt-0.5">{h.address}</p>}
                    </div>
                    <Pill tone={st.tone}>{st.label}</Pill>
                    {isAdmin && (
                      <button onClick={(e) => { e.stopPropagation(); deleteHotel.mutate(h._id, { onSuccess: () => toast("Hotel deleted") }); }}
                        className="text-[var(--m-faint)] p-0.5"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3 mb-1.5">
                    <span className="text-[12.5px] font-medium text-[var(--m-muted)]">{occ} / {h.totalSlots} slots filled</span>
                    <span className="text-[12px] font-semibold text-[var(--m-faint)] tabular-nums">{Math.round(pct)}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--m-track)" }}>
                    <div className="m-bar-fill m-grad-accent h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

      <Sheet open={open} onClose={() => setOpen(false)} title={<p className="m-serif text-[20px] font-bold">Add hotel</p>}
        footer={<PrimaryButton onClick={create} disabled={createHotel.isPending}>Create hotel</PrimaryButton>}>
        <div className="space-y-4 pb-2">
          <div><Label>Hotel name</Label><TextInput placeholder="Hotel name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div><Label>Address</Label><TextInput placeholder="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></div>
          <div><Label>Total slots</Label><TextInput type="number" value={form.totalSlots} onChange={(e) => setForm((f) => ({ ...f, totalSlots: e.target.value }))} /></div>
          <div><Label>Status</Label>
            <ChipGroup value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: (v || "upcoming") as Tournament["status"] }))}
              options={[{ value: "upcoming", label: "Upcoming" }, { value: "available", label: "Available" }, { value: "not_available", label: "Not available" }]} />
          </div>
        </div>
      </Sheet>
    </div>
  );
}
