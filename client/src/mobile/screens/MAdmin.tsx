import { useMemo, useState } from "react";
import { Plus, Trash2, KeyRound, Settings, X } from "lucide-react";
import {
  useAdminUsers, useHotelPersonAssignments, useCreateHotelPersonCredential,
  useRegenerateHotelPersonPassword, useDeleteHotelPersonCredential,
  useCreateHotelPersonAssignment, useDeleteHotelPersonAssignment,
} from "../../hooks/useAdmin";
import { useTournaments } from "../../hooks/useTournaments";
import { ScreenHeader, Sheet, EmptyState, Spinner, useToast } from "../ui";

function rand(len: number) {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function MAdmin() {
  const toast = useToast();
  const { data: users, isLoading } = useAdminUsers();
  const { data: assignments } = useHotelPersonAssignments();
  const { data: hotels } = useTournaments();
  const createCred = useCreateHotelPersonCredential();
  const regenPw = useRegenerateHotelPersonPassword();
  const deleteCred = useDeleteHotelPersonCredential();
  const assignHotel = useCreateHotelPersonAssignment();
  const removeAssign = useDeleteHotelPersonAssignment();

  const [assignFor, setAssignFor] = useState<string | null>(null);

  const accounts = useMemo(() => ((users ?? []) as any[]).filter((u) => u.role === "hotel_person"), [users]);
  const byUser = useMemo(() => {
    const m = new Map<string, any[]>();
    for (const a of (assignments ?? []) as any[]) {
      const uid = a.userId?._id ?? a.userId;
      if (!uid) continue;
      m.set(uid, [...(m.get(uid) ?? []), a]);
    }
    return m;
  }, [assignments]);

  function generate() {
    const username = `hotel_${rand(4)}`;
    const password = rand(8);
    createCred.mutate({ username, password }, {
      onSuccess: () => toast(`Created ${username} · pw: ${password}`),
      onError: () => toast("Failed to create account"),
    });
  }

  return (
    <div className="pt-2">
      <ScreenHeader title="Admin Panel" subtitle="Manage hotel person accounts" />

      <div className="flex items-center justify-between mb-3 px-0.5">
        <p className="text-[13.5px] font-bold">Hotel Persons</p>
        <button onClick={generate} disabled={createCred.isPending}
          className="inline-flex items-center gap-1.5 h-[36px] px-3.5 rounded-full text-[12.5px] font-bold"
          style={{ background: "var(--m-accent)", color: "#fff" }}>
          <Plus className="w-4 h-4" /> Generate
        </button>
      </div>

      {isLoading ? <div className="flex justify-center pt-16"><Spinner className="w-6 h-6" /></div>
        : accounts.length === 0 ? <EmptyState icon={<Settings className="w-6 h-6" />} title="No hotel persons" hint="Tap Generate to create one" />
        : (
          <div className="space-y-[11px]">
            {accounts.map((u) => {
              const hotelsFor = byUser.get(u._id) ?? [];
              return (
                <div key={u._id} className="rounded-[18px] border p-[15px]" style={{ background: "var(--m-card)", borderColor: "var(--m-card-border)" }}>
                  <div className="flex items-center gap-3">
                    <span className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center font-bold text-[15px]"
                      style={{ background: "var(--m-accent-soft)", color: "var(--m-accent)" }}>
                      {(u.credentialUsername || u.name || "H").slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14.5px] font-bold font-mono truncate">{u.credentialUsername || u.name}</p>
                      <p className="text-[12px] text-[var(--m-muted)]">Hotel person account</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {hotelsFor.map((a) => (
                      <span key={a._id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold" style={{ background: "var(--m-inset)", color: "var(--m-muted)" }}>
                        {a.hotelId?.name || "Hotel"}
                        <button onClick={() => removeAssign.mutate(a._id, { onSuccess: () => toast("Hotel removed") })}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    <button onClick={() => setAssignFor(u._id)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-semibold border border-dashed"
                      style={{ borderColor: "var(--m-card-border)", color: "var(--m-accent)" }}>
                      <Plus className="w-3 h-3" /> Hotel
                    </button>
                  </div>

                  <div className="flex gap-2.5 mt-3">
                    <button onClick={() => { const pw = rand(8); u.credentialId && regenPw.mutate({ id: u.credentialId, password: pw }, { onSuccess: () => toast(`New pw: ${pw}`) }); }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 h-[44px] rounded-[13px] text-[13px] font-semibold" style={{ background: "var(--m-inset)", color: "var(--m-text)" }}>
                      <KeyRound className="w-4 h-4" /> Regenerate
                    </button>
                    <button onClick={() => u.credentialId && deleteCred.mutate(u.credentialId, { onSuccess: () => toast("Account deleted") })}
                      className="w-[46px] h-[44px] rounded-[13px] flex items-center justify-center" style={{ background: "var(--m-rose-bg)", color: "var(--m-rose-fg)" }}>
                      <Trash2 className="w-[18px] h-[18px]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      <Sheet open={!!assignFor} onClose={() => setAssignFor(null)} title={<p className="m-serif text-[20px] font-bold">Assign hotel</p>}>
        <div className="space-y-1.5 pb-2">
          {((hotels ?? []) as any[]).length === 0 ? <p className="text-[13px] text-[var(--m-muted)] py-3">No hotels available.</p>
            : ((hotels ?? []) as any[]).map((h) => (
              <button key={h._id} onClick={() => assignFor && assignHotel.mutate({ userId: assignFor, hotelId: h._id }, { onSuccess: () => { toast("Hotel assigned"); setAssignFor(null); }, onError: () => toast("Already assigned") })}
                className="w-full text-left p-3 rounded-[12px] text-[14px] font-semibold" style={{ background: "var(--m-inset)" }}>
                {h.name}
              </button>
            ))}
        </div>
      </Sheet>
    </div>
  );
}
