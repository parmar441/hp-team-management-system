import { useRef, useState } from "react";
import { useCreatePerson, useBulkImportPeople, usePeople, type Person } from "../hooks/usePeople";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useToast } from "../components/ui/toaster";
import { PeopleFilterBar, EMPTY_PFILTERS, type PFilters } from "../components/ui/people-filters";
import { useDebounce } from "../hooks/useDebounce";
import { parseCSVRow, downloadCSV, capitalizeName, genderLabel } from "../lib/utils";
import { UserPlus, CheckCircle, Upload, Download, Users, Plus, Search } from "lucide-react";

const TEMPLATE_CSV =
  "firstName,lastName,email,phone,gender,mandal,country,ageRange,acoNeeded,city,state,memberId,familyId,category\n" +
  "Aarav,Patel,aarav@example.com,5550100,M,EDISON,us,15-45,Yes,Edison,New Jersey,M001,F100,\n" +
  "Priya,Shah,,,F,JERSEY_CITY,us,15-45,No,Jersey City,New Jersey,,,";

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
  const [showForm, setShowForm] = useState(false);
  const createPerson = useCreatePerson();
  const bulkImport = useBulkImportPeople();
  const fileRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<PFilters>(EMPTY_PFILTERS);
  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = usePeople({
    pageSize: 200, search: debouncedSearch, zone: filters.zone, area: filters.area,
    gender: filters.gender, country: filters.country, acoNeeded: filters.aco, checkedIn: filters.checkedIn,
  });
  const people: Person[] = data?.people ?? [];
  const total = data?.total ?? people.length;
  const hasFilters = !!search || Object.values(filters).some(Boolean);

  const f = (k: keyof Person) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createPerson.mutateAsync(form);
      setSuccess(true);
      setForm(EMPTY);
      setShowForm(false);
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
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex-shrink-0">
            <UserPlus className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">Registration</h1>
            <p className="text-sm text-gray-500">Add members one at a time or import in bulk. Zone and area are assigned automatically.</p>
          </div>
        </div>
        <button
          onClick={() => { setForm(EMPTY); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add member</span><span className="sm:hidden">Add</span>
        </button>
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
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => downloadCSV(TEMPLATE_CSV, "registration-template.csv")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> Template
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={bulkImport.isPending}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" /> {bulkImport.isPending ? "Importing…" : "Choose CSV"}
          </button>
        </div>
      </div>

      {/* Add member dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle className="text-lg font-bold">Add member</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
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
                  <SelectContent><SelectItem value="M">M</SelectItem><SelectItem value="F">F</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Utaro Needed *</label>
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
                <label className="block text-sm font-medium text-gray-700">Mandal</label>
                <input value={form.mandal || ""} onChange={f("mandal")} placeholder="e.g. EDISON, ATLANTA" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input value={form.state || ""} onChange={f("state")} placeholder="e.g. New Jersey" className={inputCls} />
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
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2.5 text-sm font-medium border border-gray-200 bg-white rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={createPerson.isPending}
                className="px-5 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {createPerson.isPending ? "Registering..." : "Register Person"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        <div className="relative flex-1 min-w-0 sm:min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
            placeholder="Search by name, email, mandal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <PeopleFilterBar value={filters} onChange={setFilters} />
        {hasFilters && (
          <button onClick={() => { setSearch(""); setFilters(EMPTY_PFILTERS); }}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 whitespace-nowrap">
            Clear filters
          </button>
        )}
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
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">FirstName</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">LastName</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">City</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">State</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Country</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Gender</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Mandal</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">FamilyId</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Age Range</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">MemberId</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Utaro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 11 }).map((_, j) => (
                    <td key={j} className="px-4 py-2.5"><div className="h-4 w-20 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : people.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-sm text-gray-400">{hasFilters ? "No members match your filters." : "No members registered yet."}</td></tr>
              ) : (
                people.map((p) => (
                  <tr key={p._id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">{capitalizeName(p.firstName) || "—"}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">{capitalizeName(p.lastName) || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-500">{p.city || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-500">{p.state || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-500">{p.country || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-500">{genderLabel(p.gender)}</td>
                    <td className="px-4 py-2.5 text-gray-500">{p.mandal || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-500">{p.familyId || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-500">{p.ageRange || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-500">{p.memberId || "—"}</td>
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
