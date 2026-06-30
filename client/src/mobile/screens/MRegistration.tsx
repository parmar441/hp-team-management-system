import { useRef, useState } from "react";
import { Upload, Download, Users, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useCreatePerson, useBulkImportPeople, useInfinitePeople, type Person, type PeopleFilters } from "../../hooks/usePeople";
import { useDynamicZoneNames } from "../../hooks/useDynamicZones";
import { useDynamicAreas } from "../../hooks/useDynamicAreas";
import { useDebounce } from "../../hooks/useDebounce";
import { parseCSVRow, downloadCSV, personName, genderLabel } from "../../lib/utils";
import { Pill, ScreenHeader, IconButton, Sheet, Label, TextInput, ChipGroup, PrimaryButton, Card, CardSkeletons, EmptyState, LoadMore, useToast } from "../ui";

const TEMPLATE_CSV =
  "firstName,lastName,email,phone,gender,mandal,country,ageRange,acoNeeded,city,state,memberId,familyId,category\n" +
  "Aarav,Patel,aarav@example.com,5550100,M,EDISON,us,15-45,Yes,Edison,New Jersey,M001,F100,\n" +
  "Priya,Shah,,,F,JERSEY_CITY,us,15-45,No,Jersey City,New Jersey,,,";

const EMPTY: Partial<Person> = {
  firstName: "", lastName: "", email: "", phone: "", familyId: "", city: "", state: "",
  country: "USA", gender: "M", ageRange: "15-45", acoNeeded: "No", mandal: "",
};

interface Filters { zone: string; area: string; gender: string; country: string; aco: string; checkedIn: string }
const EMPTY_FILTERS: Filters = { zone: "", area: "", gender: "", country: "", aco: "", checkedIn: "" };

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVRow(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const vals = parseCSVRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { if (h) obj[h] = (vals[i] ?? "").trim(); });
    return obj;
  });
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

export default function MRegistration() {
  const toast = useToast();
  const createPerson = useCreatePerson();
  const bulkImport = useBulkImportPeople();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Partial<Person>>(EMPTY);
  const [formOpen, setFormOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const debounced = useDebounce(query, 350);

  const serverFilters: PeopleFilters = {
    search: debounced, zone: filters.zone, area: filters.area, gender: filters.gender,
    country: filters.country, acoNeeded: filters.aco, checkedIn: filters.checkedIn, pageSize: 50,
  };
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfinitePeople(serverFilters);
  const { data: zoneNames } = useDynamicZoneNames();
  const { data: areas } = useDynamicAreas();
  const people: Person[] = data?.pages.flatMap((pg) => pg.people) ?? [];
  const total = data?.pages[0]?.total ?? people.length;

  const activeCount = Object.values(filters).filter(Boolean).length;
  const zoneOpts = (zoneNames ?? []).map((z: string) => ({ value: z, label: z }));
  const areaOpts = (areas ?? []).map((a: any) => ({ value: a.name as string, label: a.name as string }));

  const set = (k: keyof Person, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const input = (k: keyof Person) => ({
    value: (form[k] as string) || "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value),
  });
  function setF(k: keyof Filters, v: string) { setFilters((f) => ({ ...f, [k]: v })); }

  function submit() {
    if (!form.firstName?.trim()) { toast("First name is required"); return; }
    createPerson.mutate(form, {
      onSuccess: () => { toast("Person registered"); setForm(EMPTY); setFormOpen(false); },
      onError: () => toast("Failed to register"),
    });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = parseCSV(await file.text());
      if (rows.length === 0) { toast("No rows found in file"); return; }
      await bulkImport.mutateAsync(rows as any);
      toast(`${rows.length} people imported`);
    } catch {
      toast("Import failed — check the CSV format");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="pt-2 pb-4">
      <ScreenHeader title="Register" subtitle="Add members or import in bulk"
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => setFilterOpen(true)} aria-label="Filters"
              className="relative w-[42px] h-[42px] rounded-[13px] flex items-center justify-center active:scale-95"
              style={{ background: "var(--m-card)", border: "1px solid var(--m-card-border)" }}>
              <SlidersHorizontal className="w-[18px] h-[18px] text-[var(--m-text)]" />
              {activeCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                  style={{ background: "var(--m-accent)" }}>{activeCount}</span>
              )}
            </button>
            <IconButton onClick={() => { setForm(EMPTY); setFormOpen(true); }} aria-label="Add member"><Plus className="w-5 h-5" /></IconButton>
          </div>
        } />

      {/* Bulk import */}
      <Card className="mb-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--m-accent-soft)", color: "var(--m-accent)" }}>
            <Upload className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold leading-tight">Bulk import</p>
            <p className="text-[12px] text-[var(--m-muted)] mt-0.5">CSV with a header row (firstName, lastName, gender, mandal, state, country…)</p>
          </div>
        </div>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
        <div className="flex gap-2.5 mt-3">
          <button onClick={() => downloadCSV(TEMPLATE_CSV, "registration-template.csv")}
            className="m-press h-[44px] px-4 rounded-[12px] border text-[13px] font-semibold flex items-center justify-center gap-1.5 flex-shrink-0"
            style={{ borderColor: "var(--m-card-border)", color: "var(--m-muted)" }}>
            <Download className="w-4 h-4" /> Template
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={bulkImport.isPending}
            className="m-press flex-1 h-[44px] rounded-[12px] border border-dashed text-[13.5px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
            style={{ borderColor: "var(--m-accent-border)", color: "var(--m-accent)" }}>
            <Upload className="w-4 h-4" /> {bulkImport.isPending ? "Importing…" : "Choose CSV"}
          </button>
        </div>
      </Card>

      {/* Add member sheet */}
      <Sheet open={formOpen} onClose={() => setFormOpen(false)}
        title={<p className="m-serif text-[20px] font-bold">Add member</p>}
        footer={<PrimaryButton onClick={submit} disabled={createPerson.isPending}>
          {createPerson.isPending ? "Registering…" : "Register person"}
        </PrimaryButton>}>
        <div className="space-y-4 pb-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>First name *</Label><TextInput placeholder="First name" {...input("firstName")} /></div>
            <div><Label>Last name</Label><TextInput placeholder="Last name" {...input("lastName")} /></div>
          </div>
          <div><Label>Email</Label><TextInput type="email" placeholder="email@example.com" {...input("email")} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Phone</Label><TextInput placeholder="+1 555…" {...input("phone")} /></div>
            <div><Label>Family ID</Label><TextInput placeholder="Optional" {...input("familyId")} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>City</Label><TextInput placeholder="City" {...input("city")} /></div>
            <div><Label>Mandal</Label><TextInput placeholder="e.g. EDISON" {...input("mandal")} /></div>
          </div>
          <div><Label>State</Label><TextInput placeholder="New Jersey" {...input("state")} /></div>
          <div><Label>Country</Label>
            <ChipGroup value={(form.country as string) || ""} onChange={(v) => set("country", v)}
              options={[{ value: "USA", label: "USA" }, { value: "Canada", label: "Canada" }, { value: "Other", label: "Other" }]} />
          </div>
          <div><Label>Gender</Label>
            <ChipGroup value={form.gender || ""} onChange={(v) => set("gender", v)}
              options={[{ value: "M", label: "M" }, { value: "F", label: "F" }]} />
          </div>
          <div><Label>Age range</Label>
            <ChipGroup value={form.ageRange || ""} onChange={(v) => set("ageRange", v)}
              options={["0-6", "7-14", "15-45", "46-65", "65+"].map((r) => ({ value: r, label: r }))} />
          </div>
          <div><Label>Utaro participation</Label>
            <ChipGroup value={form.acoNeeded || ""} onChange={(v) => set("acoNeeded", v)}
              options={[{ value: "Yes", label: "Utaro player" }, { value: "No", label: "Non-Utaro" }]} />
          </div>
        </div>
      </Sheet>

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
        <ChipRow label="Gender" options={[{ value: "M", label: "M" }, { value: "F", label: "F" }]} value={filters.gender} onChange={(v) => setF("gender", v)} />
        <ChipRow label="Country" options={[{ value: "USA", label: "USA" }, { value: "Canada", label: "Canada" }]} value={filters.country} onChange={(v) => setF("country", v)} />
        <ChipRow label="Utaro participation" options={[{ value: "Yes", label: "Utaro player" }, { value: "No", label: "Non-Utaro" }]} value={filters.aco} onChange={(v) => setF("aco", v)} />
        <ChipRow label="Check-in status" options={[{ value: "Yes", label: "Checked in" }, { value: "No", label: "Not checked in" }]} value={filters.checkedIn} onChange={(v) => setF("checkedIn", v)} />
      </Sheet>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="w-[18px] h-[18px] absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--m-faint)]" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, city, member ID…"
          className="w-full h-[48px] pl-11 pr-4 rounded-[14px] border text-[15px] outline-none placeholder:text-[var(--m-faint)] focus:border-[var(--m-accent-border)]"
          style={{ background: "var(--m-card)", borderColor: "var(--m-card-border)", color: "var(--m-text)" }} />
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

      {/* Registered members list */}
      <div className="flex items-center justify-between mt-2 mb-2.5 px-0.5">
        <p className="text-[13.5px] font-bold">Registered members</p>
        <span className="text-[12px] font-semibold text-[var(--m-faint)] tabular-nums">{total}</span>
      </div>
      {isLoading ? <CardSkeletons count={4} height={84} />
        : people.length === 0 ? <EmptyState icon={<Users className="w-6 h-6" />} title="No members found" hint="Register someone above to get started" />
        : (
          <div className="space-y-2">
            {people.map((p) => (
              <div key={p._id} className="m-sheen rounded-[14px] border p-[13px]"
                style={{ backgroundColor: "var(--m-card)", borderColor: "var(--m-card-border)", boxShadow: "var(--m-shadow-card)" }}>
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold truncate">{personName(p)}</p>
                    <p className="text-[12px] text-[var(--m-muted)] truncate">{[p.city, p.state].filter(Boolean).join(", ") || "—"}</p>
                  </div>
                  <Pill tone={p.acoNeeded === "Yes" ? "emerald" : "neutral"}>
                    <span className="opacity-70">Utaro</span> {p.acoNeeded}
                  </Pill>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {p.zone && <Pill tone="accent">{p.zone}</Pill>}
                  <span className="text-[12px] text-[var(--m-faint)]">
                    {[genderLabel(p.gender), p.ageRange, p.area, p.mandal].filter(Boolean).join(" · ")}
                  </span>
                </div>
              </div>
            ))}
            <LoadMore onLoadMore={() => fetchNextPage()} hasMore={!!hasNextPage} loading={isFetchingNextPage} />
          </div>
        )}
    </div>
  );
}
