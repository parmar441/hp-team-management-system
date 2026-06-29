import { useMemo, useState } from "react";
import {
  Search, SlidersHorizontal, MoreVertical, Check, X, Trash2, Eye, UserCheck, ToggleLeft,
} from "lucide-react";
import {
  usePeople, useToggleAco, useToggleCheckIn, useDeletePerson,
  useBulkDeletePeople, useBulkToggleAco, useBulkCheckIn, type Person, type PeopleFilters,
} from "../../hooks/usePeople";
import { useDynamicZoneNames } from "../../hooks/useDynamicZones";
import { useDynamicAreas } from "../../hooks/useDynamicAreas";
import { useMe } from "../../hooks/useAuth";
import { useDebounce } from "../../hooks/useDebounce";
import { Pill, ScreenHeader, Sheet, EmptyState, CardSkeletons, PrimaryButton, useToast } from "../ui";

interface Filters { zone: string; area: string; gender: string; country: string; aco: string; checkedIn: string }
const EMPTY_FILTERS: Filters = { zone: "", area: "", gender: "", country: "", aco: "", checkedIn: "" };

function fullName(p: Person) {
  return p.fullName || `${p.firstName} ${p.lastName || ""}`.trim();
}

function ChipRow<T extends string>({ label, options, value, onChange }: {
  label: string; options: { value: T; label: string }[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="mb-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--m-faint)] mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button key={o.value} onClick={() => onChange(active ? "" : o.value)}
              className="px-3.5 py-2 rounded-[11px] text-[13px] font-semibold border transition-colors active:scale-[0.98]"
              style={active
                ? { background: "var(--m-accent-soft)", color: "var(--m-accent)", borderColor: "var(--m-accent-border)" }
                : { background: "var(--m-inset)", color: "var(--m-muted)", borderColor: "transparent" }}>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function MPeople() {
  const toast = useToast();
  const { data: me } = useMe();
  const isAdmin = me?.user?.role === "admin";

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionPerson, setActionPerson] = useState<Person | null>(null);
  const [detailPerson, setDetailPerson] = useState<Person | null>(null);

  const debounced = useDebounce(query, 350);
  const serverFilters: PeopleFilters = {
    search: debounced,
    zone: filters.zone,
    area: filters.area,
    gender: filters.gender,
    country: filters.country,
    acoNeeded: filters.aco,
    pageSize: 200,
  };
  const { data, isLoading } = usePeople(serverFilters);
  const { data: zoneNames } = useDynamicZoneNames();
  const { data: areas } = useDynamicAreas();

  const toggleAco = useToggleAco();
  const toggleCheckIn = useToggleCheckIn();
  const deletePerson = useDeletePerson();
  const bulkDelete = useBulkDeletePeople();
  const bulkAco = useBulkToggleAco();
  const bulkCheckIn = useBulkCheckIn();

  const all: Person[] = data?.people ?? [];
  const people = useMemo(
    () => (filters.checkedIn ? all.filter((p) => (p.checkedIn === "Yes" ? "Yes" : "No") === filters.checkedIn) : all),
    [all, filters.checkedIn],
  );

  const activeCount = Object.values(filters).filter(Boolean).length;
  const zoneOpts = (zoneNames ?? []).map((z: string) => ({ value: z, label: z }));
  const areaOpts = (areas ?? []).map((a: any) => ({ value: a.name as string, label: a.name as string }));

  function setF(k: keyof Filters, v: string) { setFilters((f) => ({ ...f, [k]: v })); }

  function toggleSelect(id: string) {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function exitSelect() { setSelectMode(false); setSelected(new Set()); }

  return (
    <div className="pt-2">
      <ScreenHeader
        title="People"
        subtitle={`${data?.total ?? people.length} registered members`}
        action={
          <button onClick={() => setFilterOpen(true)} aria-label="Filters"
            className="relative w-[42px] h-[42px] rounded-[13px] flex items-center justify-center active:scale-95"
            style={{ background: "var(--m-card)", border: "1px solid var(--m-card-border)" }}>
            <SlidersHorizontal className="w-[18px] h-[18px] text-[var(--m-text)]" />
            {activeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                style={{ background: "var(--m-accent)" }}>{activeCount}</span>
            )}
          </button>
        }
      />

      {/* Search */}
      <div className="relative mb-3">
        <Search className="w-[18px] h-[18px] absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--m-faint)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, city, member ID…"
          className="w-full h-[50px] pl-11 pr-4 rounded-[14px] border text-[15px] outline-none placeholder:text-[var(--m-faint)] focus:border-[var(--m-accent-border)]"
          style={{ background: "var(--m-card)", borderColor: "var(--m-card-border)", color: "var(--m-text)" }}
        />
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {(Object.keys(filters) as (keyof Filters)[]).filter((k) => filters[k]).map((k) => (
            <button key={k} onClick={() => setF(k, "")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold"
              style={{ background: "var(--m-accent-soft)", color: "var(--m-accent)" }}>
              {filters[k]} <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      {/* Showing + Select toggle */}
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--m-faint)]">Showing {people.length}</span>
        {isAdmin && (
          <button onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}
            className="text-[13px] font-semibold" style={{ color: "var(--m-accent)" }}>
            {selectMode ? "Done" : "Select"}
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <CardSkeletons count={6} />
      ) : people.length === 0 ? (
        <EmptyState icon={<Search className="w-6 h-6" />} title="No people found"
          hint={activeCount || query ? "Try adjusting your filters" : "Register a person to get started"} />
      ) : (
        <div className="space-y-[11px] pb-2 m-stagger">
          {people.map((p) => {
            const sel = selected.has(p._id);
            const checked = p.checkedIn === "Yes";
            return (
              <div key={p._id}
                onClick={() => (selectMode ? toggleSelect(p._id) : setDetailPerson(p))}
                className="m-sheen m-press rounded-[18px] border p-[15px]"
                style={{ backgroundColor: "var(--m-card)", borderColor: sel ? "var(--m-accent-border)" : "var(--m-card-border)", boxShadow: sel ? "var(--m-glow)" : "var(--m-shadow-card)" }}>
                <div className="flex items-center gap-3">
                  {selectMode && (
                    <span className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 border"
                      style={sel
                        ? { background: "var(--m-accent)", borderColor: "var(--m-accent)" }
                        : { background: "transparent", borderColor: "var(--m-card-border)" }}>
                      {sel && <Check className="w-4 h-4 text-white" />}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[15.5px] font-bold leading-tight truncate">{fullName(p)}</p>
                    <p className="text-[12.5px] font-medium text-[var(--m-muted)] truncate">
                      {[p.city, p.state].filter(Boolean).join(", ") || "—"}
                    </p>
                  </div>
                  {checked && (
                    <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--m-sky-bg)", color: "var(--m-sky-fg)" }}>
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {!selectMode && (
                    <button onClick={(e) => { e.stopPropagation(); setActionPerson(p); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[var(--m-muted)]">
                      <MoreVertical className="w-[18px] h-[18px]" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  {p.zone && <Pill tone="accent">{p.zone}</Pill>}
                  <Pill tone={p.acoNeeded === "Yes" ? "emerald" : "neutral"}>
                    <span className="opacity-70">ACO</span> {p.acoNeeded}
                  </Pill>
                  <span className="text-[12px] text-[var(--m-faint)]">
                    {[p.area, p.gender === "M" ? "Male" : "Female"].filter(Boolean).join(" · ")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk bar */}
      {selectMode && selected.size > 0 && (
        <div className="fixed left-4 right-4 z-40 flex items-center gap-2 px-3 py-2.5 rounded-[16px] shadow-2xl"
          style={{ bottom: "calc(80px + env(safe-area-inset-bottom,0px) + 14px)", background: "var(--m-card)", border: "1px solid var(--m-accent-border)" }}>
          <span className="text-[13px] font-bold px-1">{selected.size} selected</span>
          <div className="flex-1" />
          <button onClick={() => bulkCheckIn.mutate({ ids: [...selected], checkedIn: "Yes" }, { onSuccess: () => { toast("Checked in"); exitSelect(); } })}
            className="px-3 py-2 rounded-lg text-[12.5px] font-semibold" style={{ background: "var(--m-sky-bg)", color: "var(--m-sky-fg)" }}>Check in</button>
          <button onClick={() => bulkAco.mutate({ ids: [...selected], acoNeeded: "Yes" }, { onSuccess: () => { toast("ACO set to Yes"); exitSelect(); } })}
            className="px-3 py-2 rounded-lg text-[12.5px] font-semibold" style={{ background: "var(--m-aco-bg)", color: "var(--m-aco-fg)" }}>ACO</button>
          <button onClick={() => bulkDelete.mutate([...selected], { onSuccess: () => { toast(`${selected.size} deleted`); exitSelect(); } })}
            className="px-3 py-2 rounded-lg text-[12.5px] font-semibold" style={{ background: "var(--m-rose-bg)", color: "var(--m-rose-fg)" }}>Delete</button>
        </div>
      )}

      {/* Filter sheet */}
      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)}
        title={<p className="m-serif text-[20px] font-bold">Filters</p>}
        footer={
          <div className="flex gap-3">
            <button onClick={() => setFilters(EMPTY_FILTERS)}
              className="px-5 h-[52px] rounded-[15px] text-[15px] font-semibold border"
              style={{ borderColor: "var(--m-card-border)", color: "var(--m-muted)" }}>Reset</button>
            <div className="flex-1"><PrimaryButton onClick={() => setFilterOpen(false)}>Show {people.length} people</PrimaryButton></div>
          </div>
        }>
        {zoneOpts.length > 0 && <ChipRow label="Zone" options={zoneOpts} value={filters.zone} onChange={(v) => setF("zone", v)} />}
        {areaOpts.length > 0 && <ChipRow label="Area" options={areaOpts} value={filters.area} onChange={(v) => setF("area", v)} />}
        <ChipRow label="Gender" options={[{ value: "M", label: "Male" }, { value: "F", label: "Female" }]} value={filters.gender} onChange={(v) => setF("gender", v)} />
        <ChipRow label="Country" options={[{ value: "USA", label: "USA" }, { value: "Canada", label: "Canada" }]} value={filters.country} onChange={(v) => setF("country", v)} />
        <ChipRow label="ACO participation" options={[{ value: "Yes", label: "ACO player" }, { value: "No", label: "Non-ACO" }]} value={filters.aco} onChange={(v) => setF("aco", v)} />
        <ChipRow label="Check-in status" options={[{ value: "Yes", label: "Checked in" }, { value: "No", label: "Not checked in" }]} value={filters.checkedIn} onChange={(v) => setF("checkedIn", v)} />
      </Sheet>

      {/* Action sheet */}
      <Sheet open={!!actionPerson} onClose={() => setActionPerson(null)}
        title={actionPerson && (
          <div className="flex items-center gap-3">
            <div><p className="text-[15px] font-bold leading-tight">{fullName(actionPerson)}</p>
              <p className="text-[12px] text-[var(--m-muted)]">{actionPerson.zone || "Unassigned"}</p></div>
          </div>
        )}>
        {actionPerson && (
          <div className="space-y-1.5 pb-2">
            <ActionRow icon={<Eye className="w-[18px] h-[18px]" />} label="View full details"
              onClick={() => { setDetailPerson(actionPerson); setActionPerson(null); }} />
            {isAdmin && <>
              <ActionRow icon={<UserCheck className="w-[18px] h-[18px]" />}
                label={actionPerson.checkedIn === "Yes" ? "Mark not checked in" : "Check in"}
                onClick={() => toggleCheckIn.mutate(actionPerson._id, { onSuccess: () => { toast("Check-in updated"); setActionPerson(null); } })} />
              <ActionRow icon={<ToggleLeft className="w-[18px] h-[18px]" />}
                label={`Set ACO to ${actionPerson.acoNeeded === "Yes" ? "No" : "Yes"}`}
                onClick={() => {
                  const next = actionPerson.acoNeeded === "Yes" ? "No" : "Yes";
                  toggleAco.mutate({ id: actionPerson._id, acoNeeded: next }, {
                    onSuccess: () => { toast(next === "No" ? "ACO set to No — removed from team" : "ACO set to Yes"); setActionPerson(null); },
                  });
                }} />
              <ActionRow danger icon={<Trash2 className="w-[18px] h-[18px]" />} label="Delete person"
                onClick={() => deletePerson.mutate(actionPerson._id, { onSuccess: () => { toast("Person deleted"); setActionPerson(null); } })} />
            </>}
          </div>
        )}
      </Sheet>

      {/* Detail sheet */}
      <Sheet open={!!detailPerson} onClose={() => setDetailPerson(null)}>
        {detailPerson && <PersonDetail p={detailPerson} isAdmin={!!isAdmin}
          onCheckIn={() => toggleCheckIn.mutate(detailPerson._id, { onSuccess: () => { toast("Check-in updated"); setDetailPerson(null); } })}
          onAco={() => {
            const next = detailPerson.acoNeeded === "Yes" ? "No" : "Yes";
            toggleAco.mutate({ id: detailPerson._id, acoNeeded: next }, { onSuccess: () => { toast(next === "No" ? "ACO set to No — removed from team" : "ACO set to Yes"); setDetailPerson(null); } });
          }} />}
      </Sheet>
    </div>
  );
}

function ActionRow({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 h-[50px] px-3 rounded-[13px] active:brightness-95"
      style={{ background: "var(--m-inset)", color: danger ? "var(--m-rose-fg)" : "var(--m-text)" }}>
      {icon}<span className="text-[14.5px] font-semibold">{label}</span>
    </button>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: "var(--m-card-border)" }}>
      <span className="text-[12.5px] text-[var(--m-faint)]">{label}</span>
      <span className="text-[13.5px] font-medium text-[var(--m-text)] text-right max-w-[60%] truncate">{value || "—"}</span>
    </div>
  );
}

function PersonDetail({ p, isAdmin, onCheckIn, onAco }: {
  p: Person; isAdmin: boolean; onCheckIn: () => void; onAco: () => void;
}) {
  const name = fullName(p);
  return (
    <div className="pb-3">
      <div className="flex flex-col items-center text-center pt-1 pb-4">
        <p className="m-serif text-[23px] font-bold mt-3 leading-tight">{name}</p>
        <p className="text-[13px] text-[var(--m-muted)]">{[p.city, p.state].filter(Boolean).join(", ") || "—"}</p>
        <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
          {p.zone && <Pill tone="accent">{p.zone}</Pill>}
          <Pill tone={p.acoNeeded === "Yes" ? "emerald" : "neutral"}>ACO {p.acoNeeded}</Pill>
          <Pill tone={p.checkedIn === "Yes" ? "sky" : "neutral"}>{p.checkedIn === "Yes" ? "Checked in" : "Not checked in"}</Pill>
        </div>
      </div>
      <div>
        <Field label="Member ID" value={p.memberId} />
        <Field label="Family ID" value={p.familyId} />
        <Field label="Gender" value={p.gender === "M" ? "Male" : "Female"} />
        <Field label="Age range" value={p.ageRange} />
        <Field label="Category" value={p.category} />
        <Field label="Email" value={p.email} />
        <Field label="Phone" value={p.phone} />
        <Field label="City" value={p.city} />
        <Field label="State" value={p.state} />
        <Field label="Country" value={p.country} />
        <Field label="Mandal" value={p.mandal} />
        <Field label="Zone" value={p.zone} />
        <Field label="Area" value={p.area} />
      </div>
      {isAdmin && (
        <div className="flex gap-3 mt-4">
          <button onClick={onCheckIn} className="flex-1 h-[50px] rounded-[14px] text-[14px] font-semibold"
            style={{ background: "var(--m-sky-bg)", color: "var(--m-sky-fg)" }}>
            {p.checkedIn === "Yes" ? "Mark not checked in" : "Check in"}
          </button>
          <button onClick={onAco} className="flex-1 h-[50px] rounded-[14px] text-[14px] font-semibold"
            style={{ background: "var(--m-aco-bg)", color: "var(--m-aco-fg)" }}>
            Set ACO to {p.acoNeeded === "Yes" ? "No" : "Yes"}
          </button>
        </div>
      )}
    </div>
  );
}
