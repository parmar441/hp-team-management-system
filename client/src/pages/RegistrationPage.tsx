import { useRef, useState } from "react";
import { useCreatePerson, useBulkImportPeople, usePeople, type Person } from "../hooks/usePeople";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useToast } from "../components/ui/toaster";
import { parseCSVRow } from "../lib/utils";
import { UserPlus, CheckCircle, Upload, Users } from "lucide-react";

const EMPTY: Partial<Person> = {
  firstName: "", lastName: "", email: "", phone: "", city: "", state: "", country: "",
  gender: "M", mandal: "", ageRange: "15-45", acoNeeded: "No", memberId: "", familyId: "",
  category: "", note: "",
};

const inputCls = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";

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

export default function RegistrationPage() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [success, setSuccess] = useState(false);
  const createPerson = useCreatePerson();
  const bulkImport = useBulkImportPeople();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = usePeople({ pageSize: 200 });
  const people: Person[] = data?.people ?? [];
  const total = data?.total ?? people.length;

  const f = (k: keyof Person) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createPerson.mutateAsync(form);
      setSuccess(true);
      setForm(EMPTY);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      toast.error("Failed to register person");
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = parseCSV(await file.text());
      if (rows.length === 0) { toast.error("No rows found in the file"); return; }
      await bulkImport.mutateAsync(rows as any);
      toast.success(`${rows.length} people imported`);
    } catch {
      toast.error("Import failed. Check your CSV format.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600">
          <UserPlus className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registration</h1>
          <p className="text-sm text-gray-500">Add members one at a time or import in bulk. Zone and area are assigned automatically.</p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-3 bg-green-50 text-green-700 px-4 py-3 rounded-xl border border-green-200">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">Person registered successfully! Zone will be assigned automatically.</p>
        </div>
      )}

      {/* Bulk import */}
      <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
          <Upload className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Bulk import</p>
          <p className="text-xs text-gray-500 mt-0.5">Upload a CSV with a header row (firstName, lastName, gender, mandal, country, ageRange, acoNeeded…). Each row is registered and auto-classified.</p>
        </div>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={bulkImport.isPending}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex-shrink-0"
        >
          <Upload className="w-4 h-4" /> {bulkImport.isPending ? "Importing…" : "Choose CSV"}
        </button>
      </div>

      {/* Single registration form */}
      <div className="rounded-2xl border border-gray-100 shadow-sm bg-white">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Add one member</h2>
        </div>
        <div className="px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                <input value={form.firstName || ""} onChange={f("firstName")} placeholder="First name" required className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input value={form.lastName || ""} onChange={f("lastName")} placeholder="Last name" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={form.email || ""} onChange={f("email")} placeholder="Email address" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input value={form.phone || ""} onChange={f("phone")} placeholder="Phone number" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Gender *</label>
                <Select value={form.gender} onValueChange={(v) => setForm((p) => ({ ...p, gender: v as any }))}>
                  <SelectTrigger className="rounded-xl border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="M">Male</SelectItem><SelectItem value="F">Female</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">ACO Needed *</label>
                <Select value={form.acoNeeded} onValueChange={(v) => setForm((p) => ({ ...p, acoNeeded: v as any }))}>
                  <SelectTrigger className="rounded-xl border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Age Range</label>
                <Select value={form.ageRange} onValueChange={(v) => setForm((p) => ({ ...p, ageRange: v }))}>
                  <SelectTrigger className="rounded-xl border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["0-6", "7-14", "15-45", "46-65", "65+"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Mandal (State)</label>
                <input value={form.mandal || ""} onChange={(e) => setForm((p) => ({ ...p, mandal: e.target.value, state: e.target.value }))} placeholder="e.g. EDISON, ATLANTA" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input value={form.city || ""} onChange={f("city")} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input value={form.country || ""} onChange={f("country")} placeholder="us / ca / gb …" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Member ID</label>
                <input value={form.memberId || ""} onChange={f("memberId")} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Family ID</label>
                <input value={form.familyId || ""} onChange={f("familyId")} className={inputCls} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input value={form.category || ""} onChange={f("category")} className={inputCls} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Note</label>
                <input value={form.note || ""} onChange={f("note")} className={inputCls} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setForm(EMPTY)}
                className="px-4 py-2.5 text-sm font-medium border border-gray-200 bg-white rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
                Reset
              </button>
              <button type="submit" disabled={createPerson.isPending}
                className="px-5 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {createPerson.isPending ? "Registering..." : "Register Person"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Registered members list */}
      <div className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" /> Registered members
          </h2>
          <span className="text-xs font-semibold text-gray-500 tabular-nums">{total}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="hidden sm:table-cell px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Gender</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Zone</th>
                <th className="hidden md:table-cell px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Mandal</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">ACO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-2.5"><div className="h-4 w-20 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : people.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">No members registered yet.</td></tr>
              ) : (
                people.map((p) => (
                  <tr key={p._id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">{`${p.firstName} ${p.lastName || ""}`.trim()}</td>
                    <td className="hidden sm:table-cell px-4 py-2.5 text-gray-500">{p.gender === "M" ? "Male" : "Female"}</td>
                    <td className="px-4 py-2.5">
                      {p.zone
                        ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700">{p.zone}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="hidden md:table-cell px-4 py-2.5 text-gray-500">{p.mandal || "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.acoNeeded === "Yes" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {p.acoNeeded}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
