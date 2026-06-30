import { useState } from "react";
import { usePeople, useCreatePerson, useUpdatePerson, useDeletePerson, useToggleAco, useBulkDeletePeople, type Person } from "../hooks/usePeople";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import { useToast } from "../components/ui/toaster";
import { PageContainer, PageHeader } from "../components/ui/page";
import { PeopleFilterBar, EMPTY_PFILTERS, type PFilters } from "../components/ui/people-filters";
import { useDebounce } from "../hooks/useDebounce";
import { personName, genderLabel } from "../lib/utils";
import { Users, Download, Trash2, Edit2, Search, ChevronLeft, ChevronRight } from "lucide-react";

const EMPTY_PERSON: Partial<Person> = {
  firstName: "", lastName: "", email: "", phone: "", city: "", state: "", country: "",
  gender: "M", mandal: "", ageRange: "15-45", acoNeeded: "No", category: "", note: "",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-300 transition-all";
const selectTriggerCls = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-auto";

function PersonForm({ initial, onSave, onCancel, loading }: {
  initial: Partial<Person>;
  onSave: (data: Partial<Person>) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [form, setForm] = useState(initial);
  const f = (k: keyof Person) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name *">
          <input className={inputCls} value={form.firstName || ""} onChange={f("firstName")} placeholder="First name" required />
        </Field>
        <Field label="Last Name">
          <input className={inputCls} value={form.lastName || ""} onChange={f("lastName")} placeholder="Last name" />
        </Field>
        <Field label="Email">
          <input className={inputCls} type="email" value={form.email || ""} onChange={f("email")} placeholder="email@example.com" />
        </Field>
        <Field label="Phone">
          <input className={inputCls} value={form.phone || ""} onChange={f("phone")} placeholder="+1 (555) 000-0000" />
        </Field>
        <Field label="Gender *">
          <Select value={form.gender} onValueChange={(v) => setForm((p) => ({ ...p, gender: v as any }))}>
            <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="M">M</SelectItem><SelectItem value="F">F</SelectItem></SelectContent>
          </Select>
        </Field>
        <Field label="Utaro Needed *">
          <Select value={form.acoNeeded} onValueChange={(v) => setForm((p) => ({ ...p, acoNeeded: v as any }))}>
            <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
          </Select>
        </Field>
        <Field label="Age Range">
          <Select value={form.ageRange} onValueChange={(v) => setForm((p) => ({ ...p, ageRange: v }))}>
            <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
            <SelectContent>
              {["0-6", "7-14", "15-45", "46-65", "65+"].map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Mandal">
          <input className={inputCls} value={form.mandal || ""} onChange={f("mandal")} placeholder="e.g. EDISON" />
        </Field>
        <Field label="State">
          <input className={inputCls} value={form.state || ""} onChange={f("state")} placeholder="New Jersey" />
        </Field>
        <Field label="City">
          <input className={inputCls} value={form.city || ""} onChange={f("city")} placeholder="City" />
        </Field>
        <Field label="Country">
          <input className={inputCls} value={form.country || ""} onChange={f("country")} placeholder="USA" />
        </Field>
        <Field label="Member ID">
          <input className={inputCls} value={form.memberId || ""} onChange={f("memberId")} placeholder="Optional" />
        </Field>
        <Field label="Family ID">
          <input className={inputCls} value={form.familyId || ""} onChange={f("familyId")} placeholder="Optional" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Category">
            <input className={inputCls} value={form.category || ""} onChange={f("category")} placeholder="Category" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Note">
            <textarea className={`${inputCls} resize-none`} rows={2} value={form.note || ""} onChange={f("note")} placeholder="Any notes..." />
          </Field>
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="button" onClick={() => onSave(form)} disabled={loading} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
          {loading ? "Saving..." : "Save Person"}
        </button>
      </div>
    </div>
  );
}

function AcoBadge({ value, onClick }: { value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title="Click to toggle Utaro status"
      className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:opacity-80 ${
        value === "Yes" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}>
      {value === "Yes" ? "Yes" : "No"}
    </button>
  );
}

export default function PeoplePage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<PFilters>(EMPTY_PFILTERS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const query = {
    search: debouncedSearch, zone: filters.zone, area: filters.area, gender: filters.gender,
    country: filters.country, acoNeeded: filters.aco, checkedIn: filters.checkedIn, page, pageSize: 50,
  };
  const { data, isLoading } = usePeople(query);

  const createPerson = useCreatePerson();
  const updatePerson = useUpdatePerson();
  const deletePerson = useDeletePerson();
  const toggleAco = useToggleAco();
  const bulkDelete = useBulkDeletePeople();

  const people: Person[] = data?.people ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 50);

  function toggleSelect(id: string) {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setSelected(selected.size === people.length ? new Set() : new Set(people.map((p) => p._id)));
  }

  function exportCSV() {
    const headers = ["firstName", "lastName", "email", "phone", "gender", "acoNeeded", "zone", "area", "mandal", "ageRange"];
    const rows = people.map((p) => headers.map((h) => (p as any)[h] || "").join(","));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" }));
    a.download = "people.csv";
    a.click();
    toast.success("CSV exported");
  }

  const hasFilters = !!search || Object.values(filters).some(Boolean);

  return (
    <PageContainer>
      <PageHeader
        icon={<Users className="w-5 h-5" />}
        title="People"
        subtitle={`${total} registered members`}
        actions={
          <button onClick={exportCSV} title="Export CSV"
            className="flex items-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        }
      />

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        <div className="relative flex-1 min-w-0 sm:min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
            placeholder="Search by name, email, mandal..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <PeopleFilterBar value={filters} onChange={(v) => { setFilters(v); setPage(1); }} />
        {hasFilters && (
          <button onClick={() => { setSearch(""); setFilters(EMPTY_PFILTERS); setPage(1); }}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 whitespace-nowrap">
            Clear filters
          </button>
        )}
        {selected.size > 0 && (
          <button onClick={() => setShowBulkDeleteConfirm(true)}
            className="sm:ml-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete {selected.size}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="p-3 sm:p-4 text-left w-10 sm:w-12">
                  <input type="checkbox" checked={selected.size === people.length && people.length > 0}
                    onChange={toggleAll} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                </th>
                <th className="p-3 sm:p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                {/* Hidden on mobile */}
                <th className="hidden sm:table-cell p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">City</th>
                <th className="hidden md:table-cell p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Zone</th>
                <th className="hidden lg:table-cell p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Area</th>
                <th className="p-3 sm:p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Utaro</th>
                <th className="hidden lg:table-cell p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Mandal</th>
                <th className="p-3 sm:p-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {[10, 140, 80, 80, 80, 60, 80, 60].map((w, j) => (
                      <td key={j} className={`p-3 sm:p-4 ${j === 2 ? "hidden sm:table-cell" : j === 3 ? "hidden md:table-cell" : j === 4 || j === 6 ? "hidden lg:table-cell" : ""}`}>
                        <div className="h-4 bg-gray-100 rounded-lg animate-pulse" style={{ width: `${w}px` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : people.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No people found</p>
                    <p className="text-gray-400 text-xs mt-1">{hasFilters ? "Try adjusting your filters" : "Click Add Person to get started"}</p>
                  </td>
                </tr>
              ) : (
                people.map((p) => (
                  <tr key={p._id} className={`hover:bg-indigo-50/30 transition-colors ${selected.has(p._id) ? "bg-indigo-50/50" : ""}`}>
                    <td className="p-3 sm:p-4">
                      <input type="checkbox" checked={selected.has(p._id)} onChange={() => toggleSelect(p._id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{personName(p)}</p>
                          {/* Show zone/mandal inline on mobile where those columns are hidden */}
                          {(p.zone || p.mandal) && (
                            <p className="text-xs text-gray-400 mt-0.5 sm:hidden">
                              {[p.zone, p.mandal].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Responsive columns */}
                    <td className="hidden sm:table-cell p-4 text-gray-600 text-xs">{p.city || "—"}</td>
                    <td className="hidden md:table-cell p-4">
                      {p.zone
                        ? <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">{p.zone}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="hidden lg:table-cell p-4 text-gray-500 text-xs">{p.area || "—"}</td>
                    <td className="p-3 sm:p-4">
                      <AcoBadge value={p.acoNeeded}
                        onClick={() => toggleAco.mutate({ id: p._id, acoNeeded: p.acoNeeded === "Yes" ? "No" : "Yes" }, {
                          onSuccess: () => toast.success("Utaro status updated"),
                          onError: () => toast.error("Failed to update Utaro status"),
                        })}
                      />
                    </td>
                    <td className="hidden lg:table-cell p-4 text-gray-500 text-xs">{p.mandal || "—"}</td>
                    <td className="p-3 sm:p-4">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditPerson(p); setShowForm(true); }}
                          className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit person">
                          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(p._id)}
                          className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete person">
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 50 && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs sm:text-sm text-gray-500">
              <span className="font-medium text-gray-700">{(page - 1) * 50 + 1}–{Math.min(page * 50, total)}</span>
              <span className="hidden sm:inline"> of </span>
              <span className="hidden sm:inline font-medium text-gray-700">{total}</span>
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline">Prev</span>
              </button>
              <span className="text-xs sm:text-sm text-gray-500">{page}/{totalPages}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <span className="hidden sm:inline">Next</span><ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{editPerson ? "Edit Person" : "Add New Person"}</DialogTitle>
          </DialogHeader>
          <PersonForm
            initial={editPerson ?? EMPTY_PERSON}
            loading={createPerson.isPending || updatePerson.isPending}
            onCancel={() => setShowForm(false)}
            onSave={async (data) => {
              try {
                if (editPerson) {
                  await updatePerson.mutateAsync({ id: editPerson._id, data });
                  toast.success("Person updated");
                } else {
                  await createPerson.mutateAsync(data);
                  toast.success("Person added");
                }
                setShowForm(false);
              } catch {
                toast.error(editPerson ? "Failed to update person" : "Failed to add person");
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Person"
        description="This person will be permanently removed including any team memberships. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleteTarget) return;
          deletePerson.mutate(deleteTarget, {
            onSuccess: () => { toast.success("Person deleted"); setDeleteTarget(null); },
            onError: () => { toast.error("Failed to delete person"); setDeleteTarget(null); },
          });
        }}
        loading={deletePerson.isPending}
      />

      <ConfirmDialog
        open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}
        title={`Delete ${selected.size} People`}
        description={`Permanently delete ${selected.size} people. This cannot be undone.`}
        confirmLabel={`Delete ${selected.size} People`}
        onConfirm={() => {
          bulkDelete.mutate([...selected], {
            onSuccess: () => { toast.success(`${selected.size} people deleted`); setSelected(new Set()); setShowBulkDeleteConfirm(false); },
            onError: () => { toast.error("Bulk delete failed"); setShowBulkDeleteConfirm(false); },
          });
        }}
        loading={bulkDelete.isPending}
      />
    </PageContainer>
  );
}
