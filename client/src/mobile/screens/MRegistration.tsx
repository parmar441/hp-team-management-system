import { useRef, useState } from "react";
import { Upload, Download, Users, Plus } from "lucide-react";
import { useCreatePerson, useBulkImportPeople, usePeople, type Person } from "../../hooks/usePeople";
import { parseCSVRow, downloadCSV } from "../../lib/utils";
import { Avatar, Pill, ScreenHeader, IconButton, Sheet, Label, TextInput, ChipGroup, PrimaryButton, Card, CardSkeletons, EmptyState, useToast } from "../ui";

const TEMPLATE_CSV =
  "firstName,lastName,email,phone,gender,mandal,country,ageRange,acoNeeded,city,state,memberId,familyId,category\n" +
  "Aarav,Patel,aarav@example.com,5550100,M,EDISON,us,15-45,Yes,Edison,New Jersey,M001,F100,\n" +
  "Priya,Shah,,,F,JERSEY_CITY,us,15-45,No,Jersey City,New Jersey,,,";

const EMPTY: Partial<Person> = {
  firstName: "", lastName: "", email: "", phone: "", familyId: "", city: "", state: "",
  country: "USA", gender: "M", ageRange: "15-45", acoNeeded: "No", mandal: "",
};

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

function fullName(p: Person) { return p.fullName || `${p.firstName} ${p.lastName || ""}`.trim(); }

export default function MRegistration() {
  const toast = useToast();
  const createPerson = useCreatePerson();
  const bulkImport = useBulkImportPeople();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Partial<Person>>(EMPTY);
  const [formOpen, setFormOpen] = useState(false);

  const { data, isLoading } = usePeople({ pageSize: 200 });
  const people: Person[] = data?.people ?? [];
  const total = data?.total ?? people.length;

  const set = (k: keyof Person, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const input = (k: keyof Person) => ({
    value: (form[k] as string) || "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value),
  });

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
        action={<IconButton onClick={() => { setForm(EMPTY); setFormOpen(true); }} aria-label="Add member"><Plus className="w-5 h-5" /></IconButton>} />

      {/* Bulk import */}
      <Card className="mb-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--m-accent-soft)", color: "var(--m-accent)" }}>
            <Upload className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold leading-tight">Bulk import</p>
            <p className="text-[12px] text-[var(--m-muted)] mt-0.5">CSV with a header row (firstName, lastName, gender, mandal, country…)</p>
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
            <div><Label>State (mandal)</Label><TextInput placeholder="New Jersey" value={form.mandal || ""}
              onChange={(e) => setForm((f) => ({ ...f, mandal: e.target.value, state: e.target.value }))} /></div>
          </div>
          <div><Label>Country</Label>
            <ChipGroup value={(form.country as string) || ""} onChange={(v) => set("country", v)}
              options={[{ value: "USA", label: "USA" }, { value: "Canada", label: "Canada" }, { value: "Other", label: "Other" }]} />
          </div>
          <div><Label>Gender</Label>
            <ChipGroup value={form.gender || ""} onChange={(v) => set("gender", v)}
              options={[{ value: "M", label: "Male" }, { value: "F", label: "Female" }]} />
          </div>
          <div><Label>Age range</Label>
            <ChipGroup value={form.ageRange || ""} onChange={(v) => set("ageRange", v)}
              options={["0-6", "7-14", "15-45", "46-65", "65+"].map((r) => ({ value: r, label: r }))} />
          </div>
          <div><Label>ACO participation</Label>
            <ChipGroup value={form.acoNeeded || ""} onChange={(v) => set("acoNeeded", v)}
              options={[{ value: "Yes", label: "ACO player" }, { value: "No", label: "Non-ACO" }]} />
          </div>
        </div>
      </Sheet>

      {/* Registered members list */}
      <div className="flex items-center justify-between mt-6 mb-2.5 px-0.5">
        <p className="text-[13.5px] font-bold">Registered members</p>
        <span className="text-[12px] font-semibold text-[var(--m-faint)] tabular-nums">{total}</span>
      </div>
      {isLoading ? <CardSkeletons count={4} height={64} />
        : people.length === 0 ? <EmptyState icon={<Users className="w-6 h-6" />} title="No members yet" hint="Register someone above to get started" />
        : (
          <div className="space-y-2">
            {people.map((p) => (
              <div key={p._id} className="m-sheen flex items-center gap-3 rounded-[14px] border p-2.5"
                style={{ backgroundColor: "var(--m-card)", borderColor: "var(--m-card-border)", boxShadow: "var(--m-shadow-card)" }}>
                <Avatar name={fullName(p)} size={36} radius={11} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold truncate">{fullName(p)}</p>
                  <p className="text-[12px] text-[var(--m-muted)] truncate">{[p.zone, p.mandal].filter(Boolean).join(" · ") || "Unassigned"}</p>
                </div>
                <Pill tone={p.acoNeeded === "Yes" ? "emerald" : "neutral"}>{p.acoNeeded === "Yes" ? "ACO" : "—"}</Pill>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
