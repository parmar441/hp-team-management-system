import { useMemo, useRef, useState } from "react";
import { Plus, Trash2, KeyRound, Settings, X, ChevronRight, Upload, Download } from "lucide-react";
import {
  useAdminUsers, useUpdateUserRole, useBulkImportUsers,
  useZoneAssignments, useCreateZoneAssignment, useDeleteZoneAssignment,
  useAreaAssignments, useCreateAreaAssignment, useDeleteAreaAssignment,
  useHotelPersonAssignments, useCreateHotelPersonCredential,
  useRegenerateHotelPersonPassword, useDeleteHotelPersonCredential,
  useCreateHotelPersonAssignment, useDeleteHotelPersonAssignment,
} from "../../hooks/useAdmin";
import { useDynamicZoneNames } from "../../hooks/useDynamicZones";
import { useDynamicAreas, type DynamicArea } from "../../hooks/useDynamicAreas";
import { useTournaments } from "../../hooks/useTournaments";
import { parseCsvToObjects, downloadCSV } from "../../lib/utils";
import { Avatar, Pill, ScreenHeader, Sheet, EmptyState, CardSkeletons, useToast } from "../ui";

const USER_TEMPLATE_CSV =
  "name,email,role\n" +
  "John Doe,john@example.com,zone_lead\n" +
  "Jane Smith,jane@example.com,user";

const ROLES = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
  { value: "zone_lead", label: "Zone Lead" },
  { value: "area_lead", label: "Area Lead" },
  { value: "hotel_person", label: "Hotel Coordinator" },
];
const roleLabel = (r: string) => ROLES.find((x) => x.value === r)?.label ?? r;

function rand(len: number) {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
function uid(a: any) { return a?.userId?._id ?? a?.userId; }

/** Inline "add" dropdown that fires once on select then resets. */
function AddSelect({ label, options, onPick }: {
  label: string; options: { value: string; label: string }[]; onPick: (v: string) => void;
}) {
  return (
    <select
      value=""
      onChange={(e) => { if (e.target.value) onPick(e.target.value); e.currentTarget.value = ""; }}
      className="h-[34px] pl-3 pr-7 rounded-[10px] border border-dashed text-[12.5px] font-semibold outline-none appearance-none"
      style={{ background: "transparent", borderColor: "var(--m-accent-border)", color: "var(--m-accent)" }}
    >
      <option value="">{label}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export default function MAdmin() {
  const toast = useToast();
  const [tab, setTab] = useState<"users" | "hotels">("users");
  const { data: users, isLoading } = useAdminUsers();

  return (
    <div className="pt-2">
      <ScreenHeader title="Admin Panel" subtitle="Manage users, roles & accounts" />

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(["users", "hotels"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 h-[40px] rounded-[12px] text-[13.5px] font-bold transition-colors"
            style={tab === t
              ? { background: "var(--m-accent-soft)", color: "var(--m-accent)", border: "1px solid var(--m-accent-border)" }
              : { background: "var(--m-card)", color: "var(--m-muted)", border: "1px solid var(--m-card-border)" }}>
            {t === "users" ? "Users & Roles" : "Hotel Coordinators"}
          </button>
        ))}
      </div>

      {tab === "users"
        ? <UsersTab users={(users ?? []) as any[]} isLoading={isLoading} toast={toast} />
        : <HotelPersonsTab users={(users ?? []) as any[]} isLoading={isLoading} toast={toast} />}
    </div>
  );
}

/* ── Users & roles ─────────────────────────────────────────── */
function UsersTab({ users, isLoading, toast }: { users: any[]; isLoading: boolean; toast: (m: string) => void }) {
  const updateRole = useUpdateUserRole();
  const { data: zoneAssign } = useZoneAssignments();
  const { data: areaAssign } = useAreaAssignments();
  const createZone = useCreateZoneAssignment();
  const deleteZone = useDeleteZoneAssignment();
  const createArea = useCreateAreaAssignment();
  const deleteArea = useDeleteAreaAssignment();
  const bulkImport = useBulkImportUsers();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: zoneNames } = useDynamicZoneNames();
  const { data: areas } = useDynamicAreas();

  const [active, setActive] = useState<any | null>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = parseCsvToObjects(await file.text());
      if (rows.length === 0) { toast("No rows found in file"); return; }
      const res = await bulkImport.mutateAsync(rows.map((r) => ({ name: r.name, email: r.email, role: r.role })));
      toast(`${res.created} created · ${res.updated} updated`);
    } catch { toast("Import failed — check the CSV"); }
    if (fileRef.current) fileRef.current.value = "";
  }
  const role = active?.role as string | undefined;

  const myZones = useMemo(() => ((zoneAssign ?? []) as any[]).filter((a) => uid(a) === active?._id), [zoneAssign, active]);
  const myAreas = useMemo(() => ((areaAssign ?? []) as any[]).filter((a) => uid(a) === active?._id), [areaAssign, active]);

  const assignedZoneNames = new Set(myZones.map((a) => a.zone));
  const zoneOpts = (zoneNames ?? []).filter((z: string) => !assignedZoneNames.has(z)).map((z: string) => ({ value: z, label: z }));
  const areaOpts = ((areas ?? []) as DynamicArea[]).map((a) => ({ value: a._id, label: a.name }));

  function pickArea(areaId: string) {
    const a = ((areas ?? []) as DynamicArea[]).find((x) => x._id === areaId);
    if (!a || !active) return;
    const zone = typeof a.zoneId === "object" ? a.zoneId?.name ?? "" : "";
    createArea.mutate({ userId: active._id, zone, area: a.name }, {
      onSuccess: () => toast("Area assigned"), onError: () => toast("Already assigned"),
    });
  }

  return (
    <>
      <div className="flex gap-2.5 mb-3">
        <button onClick={() => downloadCSV(USER_TEMPLATE_CSV, "users-template.csv")}
          className="m-press h-[40px] px-3.5 rounded-[12px] border text-[12.5px] font-semibold flex items-center gap-1.5"
          style={{ borderColor: "var(--m-card-border)", color: "var(--m-muted)" }}>
          <Download className="w-4 h-4" /> Template
        </button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImport} />
        <button onClick={() => fileRef.current?.click()} disabled={bulkImport.isPending}
          className="m-press flex-1 h-[40px] rounded-[12px] border border-dashed text-[12.5px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
          style={{ borderColor: "var(--m-accent-border)", color: "var(--m-accent)" }}>
          <Upload className="w-4 h-4" /> {bulkImport.isPending ? "Importing…" : "Choose CSV"}
        </button>
      </div>
      {isLoading ? <CardSkeletons count={6} height={64} />
        : users.length === 0 ? <EmptyState icon={<Settings className="w-6 h-6" />} title="No users yet" />
        : (
      <div className="space-y-2">
        {users.map((u) => (
          <button key={u._id} onClick={() => setActive(u)}
            className="m-sheen m-press w-full flex items-center gap-3 rounded-[14px] border p-3 text-left"
            style={{ backgroundColor: "var(--m-card)", borderColor: "var(--m-card-border)", boxShadow: "var(--m-shadow-card)" }}>
            <Avatar name={u.name || u.email || u.credentialUsername || "U"} size={38} radius={11} />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold truncate">{u.name || u.credentialUsername || u.email || "User"}</p>
              <p className="text-[12px] text-[var(--m-muted)] truncate">{u.email || u.openId}</p>
            </div>
            <Pill tone={u.role === "admin" ? "accent" : u.role === "user" ? "neutral" : "sky"}>{roleLabel(u.role)}</Pill>
            <ChevronRight className="w-4 h-4 text-[var(--m-faint)] flex-shrink-0" />
          </button>
        ))}
      </div>
        )}

      {/* Role + assignment sheet */}
      <Sheet open={!!active} onClose={() => setActive(null)}
        title={active && (
          <div className="flex items-center gap-3">
            <Avatar name={active.name || active.email || "U"} size={36} />
            <div className="min-w-0"><p className="text-[15px] font-bold leading-tight truncate">{active.name || active.credentialUsername || "User"}</p>
              <p className="text-[12px] text-[var(--m-muted)] truncate">{active.email || active.openId}</p></div>
          </div>
        )}>
        {active && (
          <div className="space-y-5 pb-2">
            <div>
              <p className="text-[12px] font-semibold text-[var(--m-muted)] mb-2">Role</p>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((r) => {
                  const on = role === r.value;
                  return (
                    <button key={r.value}
                      onClick={() => updateRole.mutate({ id: active._id, role: r.value }, {
                        onSuccess: () => { setActive({ ...active, role: r.value }); toast(`Role set to ${r.label}`); },
                        onError: () => toast("Failed to update role"),
                      })}
                      className="px-3.5 py-2 rounded-[11px] text-[13px] font-semibold border transition-colors"
                      style={on
                        ? { background: "var(--m-accent-soft)", color: "var(--m-accent)", borderColor: "var(--m-accent-border)" }
                        : { background: "var(--m-inset)", color: "var(--m-muted)", borderColor: "transparent" }}>
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {role === "zone_lead" && (
              <div>
                <p className="text-[12px] font-semibold text-[var(--m-muted)] mb-2">Assigned zones</p>
                <div className="flex flex-wrap gap-2 items-center">
                  {myZones.map((a) => (
                    <span key={a._id} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] text-[12.5px] font-semibold" style={{ background: "var(--m-inset)", color: "var(--m-text)" }}>
                      {a.zone}
                      <button onClick={() => deleteZone.mutate(a._id, { onSuccess: () => toast("Zone removed") })}><X className="w-3 h-3 text-[var(--m-faint)]" /></button>
                    </span>
                  ))}
                  {zoneOpts.length > 0 && (
                    <AddSelect label="+ Add zone…" options={zoneOpts}
                      onPick={(z) => createZone.mutate({ userId: active._id, zone: z }, { onSuccess: () => toast("Zone assigned"), onError: () => toast("Already assigned") })} />
                  )}
                </div>
                {myZones.length === 0 && <p className="text-[12px] text-[var(--m-faint)] mt-1.5">No zones yet — this lead sees nothing until assigned.</p>}
              </div>
            )}

            {role === "area_lead" && (
              <div>
                <p className="text-[12px] font-semibold text-[var(--m-muted)] mb-2">Assigned areas</p>
                <div className="flex flex-wrap gap-2 items-center">
                  {myAreas.map((a) => (
                    <span key={a._id} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] text-[12.5px] font-semibold" style={{ background: "var(--m-inset)", color: "var(--m-text)" }}>
                      {a.zone} · {a.area}
                      <button onClick={() => deleteArea.mutate(a._id, { onSuccess: () => toast("Area removed") })}><X className="w-3 h-3 text-[var(--m-faint)]" /></button>
                    </span>
                  ))}
                  {areaOpts.length > 0 && <AddSelect label="+ Add area…" options={areaOpts} onPick={pickArea} />}
                </div>
                {myAreas.length === 0 && <p className="text-[12px] text-[var(--m-faint)] mt-1.5">No areas yet — this lead sees nothing until assigned.</p>}
              </div>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}

/* ── Hotel coordinators ─────────────────────────────────────────── */
function HotelPersonsTab({ users, isLoading, toast }: { users: any[]; isLoading: boolean; toast: (m: string) => void }) {
  const { data: assignments } = useHotelPersonAssignments();
  const { data: hotels } = useTournaments();
  const createCred = useCreateHotelPersonCredential();
  const regenPw = useRegenerateHotelPersonPassword();
  const deleteCred = useDeleteHotelPersonCredential();
  const assignHotel = useCreateHotelPersonAssignment();
  const removeAssign = useDeleteHotelPersonAssignment();
  const [assignFor, setAssignFor] = useState<string | null>(null);

  const accounts = useMemo(() => users.filter((u) => u.role === "hotel_person"), [users]);
  const byUser = useMemo(() => {
    const m = new Map<string, any[]>();
    for (const a of (assignments ?? []) as any[]) { const u = uid(a); if (u) m.set(u, [...(m.get(u) ?? []), a]); }
    return m;
  }, [assignments]);

  function generate() {
    const username = `hotel_${rand(4)}`;
    const password = rand(8);
    createCred.mutate({ username, password }, { onSuccess: () => toast(`Created ${username} · pw: ${password}`), onError: () => toast("Failed to create account") });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3 px-0.5">
        <p className="text-[13.5px] font-bold">Hotel Coordinators</p>
        <button onClick={generate} disabled={createCred.isPending}
          className="m-grad-accent m-glow inline-flex items-center gap-1.5 h-[36px] px-3.5 rounded-full text-[12.5px] font-bold text-white">
          <Plus className="w-4 h-4" /> Generate
        </button>
      </div>

      {isLoading ? <CardSkeletons count={3} height={120} />
        : accounts.length === 0 ? <EmptyState icon={<Settings className="w-6 h-6" />} title="No hotel coordinators" hint="Tap Generate to create one" />
        : (
          <div className="space-y-[11px]">
            {accounts.map((u) => {
              const hotelsFor = byUser.get(u._id) ?? [];
              return (
                <div key={u._id} className="m-sheen rounded-[18px] border p-[15px]" style={{ backgroundColor: "var(--m-card)", borderColor: "var(--m-card-border)", boxShadow: "var(--m-shadow-card)" }}>
                  <div className="flex items-center gap-3">
                    <span className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center font-bold text-[15px]" style={{ background: "var(--m-accent-soft)", color: "var(--m-accent)" }}>
                      {(u.credentialUsername || u.name || "H").slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14.5px] font-bold font-mono truncate">{u.credentialUsername || u.name}</p>
                      <p className="text-[12px] text-[var(--m-muted)]">Hotel coordinator account</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {hotelsFor.map((a) => (
                      <span key={a._id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold" style={{ background: "var(--m-inset)", color: "var(--m-muted)" }}>
                        {a.hotelId?.name || "Hotel"}
                        <button onClick={() => removeAssign.mutate(a._id, { onSuccess: () => toast("Hotel removed") })}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    <button onClick={() => setAssignFor(u._id)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-semibold border border-dashed" style={{ borderColor: "var(--m-card-border)", color: "var(--m-accent)" }}>
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
    </>
  );
}
