import { useState } from "react";
import { useCreatePerson, type Person } from "../hooks/usePeople";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { UserPlus, CheckCircle } from "lucide-react";

const EMPTY: Partial<Person> = {
  firstName: "", lastName: "", email: "", phone: "", city: "", state: "", country: "",
  gender: "M", mandal: "", ageRange: "15-45", acoNeeded: "No", memberId: "", familyId: "",
  category: "", note: "",
};

export default function RegistrationPage() {
  const [form, setForm] = useState(EMPTY);
  const [success, setSuccess] = useState(false);
  const createPerson = useCreatePerson();

  const f = (k: keyof Person) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createPerson.mutateAsync(form);
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setForm(EMPTY); }, 3000);
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600">
          <UserPlus className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registration</h1>
          <p className="text-sm text-gray-500">Register a new individual. Zone and area are assigned automatically.</p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-3 bg-green-50 text-green-700 px-4 py-3 rounded-xl border border-green-200">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">Person registered successfully! Zone will be assigned automatically.</p>
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 shadow-sm bg-white">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
        </div>
        <div className="px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                <input
                  value={form.firstName || ""}
                  onChange={f("firstName")}
                  placeholder="First name"
                  required
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  value={form.lastName || ""}
                  onChange={f("lastName")}
                  placeholder="Last name"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={form.email || ""}
                  onChange={f("email")}
                  placeholder="Email address"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  value={form.phone || ""}
                  onChange={f("phone")}
                  placeholder="Phone number"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Gender *</label>
                <Select value={form.gender} onValueChange={(v) => setForm((p) => ({ ...p, gender: v as any }))}>
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">ACO Needed *</label>
                <Select value={form.acoNeeded} onValueChange={(v) => setForm((p) => ({ ...p, acoNeeded: v as any }))}>
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Age Range</label>
                <Select value={form.ageRange} onValueChange={(v) => setForm((p) => ({ ...p, ageRange: v }))}>
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["0-6", "7-14", "15-45", "46-65", "65+"].map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Mandal (State)</label>
                <input
                  value={form.mandal || ""}
                  onChange={f("mandal")}
                  placeholder="e.g. New Jersey"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  value={form.city || ""}
                  onChange={f("city")}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input
                  value={form.country || ""}
                  onChange={f("country")}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Member ID</label>
                <input
                  value={form.memberId || ""}
                  onChange={f("memberId")}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Family ID</label>
                <input
                  value={form.familyId || ""}
                  onChange={f("familyId")}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input
                  value={form.category || ""}
                  onChange={f("category")}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Note</label>
                <input
                  value={form.note || ""}
                  onChange={f("note")}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setForm(EMPTY)}
                className="px-4 py-2.5 text-sm font-medium border border-gray-200 bg-white rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={createPerson.isPending}
                className="px-5 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createPerson.isPending ? "Registering..." : "Register Person"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
