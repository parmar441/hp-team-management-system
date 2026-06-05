import { useState } from "react";
import {
  useAdminUsers, useUpdateUserRole, useCreateUser, useResetUserPassword, useDeleteUser,
  useZoneAssignments, useCreateZoneAssignment, useDeleteZoneAssignment,
  useAreaAssignments, useCreateAreaAssignment, useDeleteAreaAssignment,
  useAuditLog, useCreateCredential,
  useCreateHotelPersonCredential, useDeleteHotelPersonCredential, useRegenerateHotelPersonPassword,
  useHotelPersonAssignments, useCreateHotelPersonAssignment, useDeleteHotelPersonAssignment,
} from "../hooks/useAdmin";
import { useTournaments } from "../hooks/useTournaments";
import { useDynamicZoneNames } from "../hooks/useDynamicZones";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import { useToast } from "../components/ui/toaster";
import {
  Settings, Users, MapPin, ClipboardList, KeyRound, Trash2,
  ChevronLeft, ChevronRight, Hotel, RefreshCw, CheckCircle2, AlertCircle,
  UserPlus, Eye, EyeOff, X,
} from "lucide-react";

type AdminTab = "users" | "zones" | "areas" | "audit" | "credentials" | "hotel-persons";

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("users");

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
    { id: "zones", label: "Zone Assignments", icon: <MapPin className="w-4 h-4" /> },
    { id: "areas", label: "Area Assignments", icon: <MapPin className="w-4 h-4" /> },
    { id: "audit", label: "Audit Log", icon: <ClipboardList className="w-4 h-4" /> },
    { id: "credentials", label: "Credentials", icon: <KeyRound className="w-4 h-4" /> },
    { id: "hotel-persons", label: "Hotel Persons", icon: <Hotel className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <Settings className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500">Manage users, roles, assignments, and credentials</p>
        </div>
      </div>

      {/* Tabs — horizontally scrollable on mobile */}
      <div className="border-b border-gray-200 -mx-6 px-6 lg:mx-0 lg:px-0">
        <div className="flex gap-0.5 overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex-shrink-0 ${
                tab === t.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "users" && <UsersTab />}
      {tab === "zones" && <ZonesTab />}
      {tab === "areas" && <AreasTab />}
      {tab === "audit" && <AuditTab />}
      {tab === "credentials" && <CredentialsTab />}
      {tab === "hotel-persons" && <HotelPersonsTab />}
    </div>
  );
}

const ROLES = ["user", "admin", "zone_lead", "area_lead", "hotel_person"] as const;

function UsersTab() {
  const toast = useToast();
  const { data: users, isLoading } = useAdminUsers();
  const updateRole = useUpdateUserRole();
  const createUser = useCreateUser();
  const resetPassword = useResetUserPassword();

  const deleteUser = useDeleteUser();

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", role: "user", username: "", password: "" });
  const [showCreatePw, setShowCreatePw] = useState(false);

  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPw, setResetPw] = useState("");
  const [showResetPw, setShowResetPw] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function handleCreate(e: React.SyntheticEvent) {
    e.preventDefault();
    try {
      const payload = { ...createForm, email: createForm.email || undefined };
      await createUser.mutateAsync(payload);
      toast.success(`User "${createForm.name}" created with username "${createForm.username}"`);
      setCreateForm({ name: "", email: "", role: "user", username: "", password: "" });
      setShowCreate(false);
      setShowCreatePw(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to create user");
    }
  }

  async function handleResetPassword(userId: string) {
    if (resetPw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    try {
      await resetPassword.mutateAsync({ id: userId, password: resetPw });
      toast.success("Password reset successfully");
      setResetId(null);
      setResetPw("");
      setShowResetPw(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to reset password");
    }
  }

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <div className="space-y-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">All Users</h3>
          <p className="text-xs text-gray-400 mt-0.5">{(users ?? []).length} total</p>
        </div>
        <button
          onClick={() => { setShowCreate((v) => !v); setShowCreatePw(false); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* Create User Form */}
      {showCreate && (
        <div className="border-b border-gray-100 bg-indigo-50/40 px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-900">New User Details</h4>
            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">Name *</label>
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="Full name"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Optional"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">Role *</label>
              <Select value={createForm.role} onValueChange={(v) => setCreateForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger className="w-full rounded-xl border-gray-200 text-sm h-[42px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">Username *</label>
              <input
                value={createForm.username}
                onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))}
                required
                placeholder="Login username"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-1 lg:col-span-1">
              <label className="block text-xs font-medium text-gray-700">Password *</label>
              <div className="relative">
                <input
                  type={showCreatePw ? "text" : "password"}
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCreatePw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3 pt-1">
              <button
                type="submit"
                disabled={createUser.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createUser.isPending ? "Creating..." : "Create User"}
              </button>
              <button
                type="button"
                onClick={() => { setShowCreate(false); setShowCreatePw(false); }}
                className="border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name / Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Username</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Sign In</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-full bg-gray-100 rounded-lg animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : (users ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">No users found</td>
                </tr>
              ) : (users ?? []).map((u: any) => (
                <>
                  <tr key={u._id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                          {(u.name || u.email || u.openId || "?")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate">{u.name || u.openId}</div>
                          {u.email && <div className="text-xs text-gray-400 truncate">{u.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                      {u.credentialUsername || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={u.role}
                        onValueChange={(role) =>
                          updateRole.mutate({ id: u._id, role }, {
                            onSuccess: () => toast.success(`Role updated to "${role.replace(/_/g, " ")}"`),
                            onError: () => toast.error("Failed to update role"),
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-36 text-xs rounded-lg border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {u.credentialId && (
                          <button
                            onClick={() => {
                              if (resetId === u._id) { setResetId(null); setResetPw(""); setShowResetPw(false); }
                              else { setResetId(u._id); setResetPw(""); setShowResetPw(false); }
                            }}
                            title="Reset password"
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                              resetId === u._id
                                ? "bg-amber-100 text-amber-600"
                                : "hover:bg-amber-50 text-gray-400 hover:text-amber-600"
                            }`}
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteId(u._id)}
                          title="Delete user"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {resetId === u._id && (
                    <tr key={`${u._id}-reset`} className="bg-amber-50/40">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs font-medium text-amber-700">Reset password for <strong>{u.credentialUsername}</strong>:</span>
                          <div className="relative">
                            <input
                              type={showResetPw ? "text" : "password"}
                              value={resetPw}
                              onChange={(e) => setResetPw(e.target.value)}
                              placeholder="New password (min 8)"
                              className="pl-3 pr-9 py-1.5 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent w-52"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setShowResetPw((v) => !v)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showResetPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <button
                            onClick={() => handleResetPassword(u._id)}
                            disabled={resetPassword.isPending}
                            className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-3.5 py-1.5 text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {resetPassword.isPending ? "Saving..." : "Save Password"}
                          </button>
                          <button
                            onClick={() => { setResetId(null); setResetPw(""); setShowResetPw(false); }}
                            className="text-xs text-gray-400 hover:text-gray-600 px-1"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete User"
        description="This will permanently delete this user along with their credentials, zone assignments, and area assignments. This action cannot be undone."
        confirmLabel="Delete User"
        onConfirm={() => {
          if (!deleteId) return;
          deleteUser.mutate(deleteId, {
            onSuccess: () => { toast.success("User deleted"); setDeleteId(null); setResetId(null); },
            onError: () => { toast.error("Failed to delete user"); setDeleteId(null); },
          });
        }}
        loading={deleteUser.isPending}
      />
    </div>
  );
}

function ZonesTab() {
  const toast = useToast();
  const { data: assignments, isLoading } = useZoneAssignments();
  const { data: users } = useAdminUsers();
  const { data: zoneNames } = useDynamicZoneNames();
  const createAssignment = useCreateZoneAssignment();
  const deleteAssignment = useDeleteZoneAssignment();
  const [form, setForm] = useState({ userId: "", zone: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Assign User to Zone</h3>
        <div className="flex flex-wrap gap-3">
          <Select value={form.userId} onValueChange={(v) => setForm((f) => ({ ...f, userId: v }))}>
            <SelectTrigger className="flex-1 min-w-[180px] rounded-xl border-gray-200 text-sm h-[42px]">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {(users ?? []).map((u: any) => (
                <SelectItem key={u._id} value={u._id}>{u.name || u.email || u.openId}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={form.zone} onValueChange={(v) => setForm((f) => ({ ...f, zone: v }))}>
            <SelectTrigger className="flex-1 min-w-[180px] rounded-xl border-gray-200 text-sm h-[42px]">
              <SelectValue placeholder="Select zone" />
            </SelectTrigger>
            <SelectContent>
              {(zoneNames ?? []).map((z: string) => (
                <SelectItem key={z} value={z}>{z}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            disabled={!form.userId || !form.zone || createAssignment.isPending}
            onClick={() => {
              createAssignment.mutate(form, {
                onSuccess: () => { toast.success("Zone assignment created"); setForm({ userId: "", zone: "" }); },
                onError: () => toast.error("Failed to create assignment"),
              });
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createAssignment.isPending ? "Assigning..." : "Assign"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Zone</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 3 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 w-full bg-gray-100 rounded-lg animate-pulse" /></td>
                  ))}</tr>
                ))
              : (assignments ?? []).length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-gray-400">No zone assignments yet</td></tr>
              ) : (assignments ?? []).map((a: any) => (
                <tr key={a._id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.userId?.name || a.userId?.email || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{a.zone}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteId(a._id)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Remove Zone Assignment"
        description="This user will lose access to this zone's data. This action cannot be undone."
        confirmLabel="Remove"
        onConfirm={() => {
          if (!deleteId) return;
          deleteAssignment.mutate(deleteId, {
            onSuccess: () => { toast.success("Zone assignment removed"); setDeleteId(null); },
            onError: () => { toast.error("Failed to remove assignment"); setDeleteId(null); },
          });
        }}
        loading={deleteAssignment.isPending}
      />
    </div>
  );
}

function AreasTab() {
  const toast = useToast();
  const { data: assignments, isLoading } = useAreaAssignments();
  const { data: users } = useAdminUsers();
  const { data: zoneNames } = useDynamicZoneNames();
  const createAssignment = useCreateAreaAssignment();
  const deleteAssignment = useDeleteAreaAssignment();
  const [form, setForm] = useState({ userId: "", zone: "", area: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Assign User to Area</h3>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <Select value={form.userId} onValueChange={(v) => setForm((f) => ({ ...f, userId: v }))}>
              <SelectTrigger className="flex-1 min-w-[180px] rounded-xl border-gray-200 text-sm h-[42px]">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {(users ?? []).map((u: any) => (
                  <SelectItem key={u._id} value={u._id}>{u.name || u.email || u.openId}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.zone} onValueChange={(v) => setForm((f) => ({ ...f, zone: v }))}>
              <SelectTrigger className="flex-1 min-w-[180px] rounded-xl border-gray-200 text-sm h-[42px]">
                <SelectValue placeholder="Select zone" />
              </SelectTrigger>
              <SelectContent>
                {(zoneNames ?? []).map((z: string) => (
                  <SelectItem key={z} value={z}>{z}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              placeholder="Area name (e.g. Northeast)"
              value={form.area}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
              className="flex-1 min-w-[180px] px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              disabled={!form.userId || !form.zone || !form.area || createAssignment.isPending}
              onClick={() => {
                createAssignment.mutate(form, {
                  onSuccess: () => { toast.success("Area assignment created"); setForm({ userId: "", zone: "", area: "" }); },
                  onError: () => toast.error("Failed to create assignment"),
                });
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createAssignment.isPending ? "Assigning..." : "Assign"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Zone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Area</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 4 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 w-full bg-gray-100 rounded-lg animate-pulse" /></td>
                  ))}</tr>
                ))
              : (assignments ?? []).length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">No area assignments yet</td></tr>
              ) : (assignments ?? []).map((a: any) => (
                <tr key={a._id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.userId?.name || a.userId?.email || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{a.zone}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">{a.area}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteId(a._id)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Remove Area Assignment"
        description="This user will lose access to this area's data."
        confirmLabel="Remove"
        onConfirm={() => {
          if (!deleteId) return;
          deleteAssignment.mutate(deleteId, {
            onSuccess: () => { toast.success("Area assignment removed"); setDeleteId(null); },
            onError: () => { toast.error("Failed to remove assignment"); setDeleteId(null); },
          });
        }}
        loading={deleteAssignment.isPending}
      />
    </div>
  );
}

function AuditTab() {
  const [auditPage, setAuditPage] = useState(1);
  const { data, isLoading } = useAuditLog({ page: auditPage });
  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;

  const actionColors: Record<string, string> = {
    delete: "bg-red-50 text-red-700",
    create: "bg-green-50 text-green-700",
    update: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Target</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Field</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 w-full bg-gray-100 rounded-lg animate-pulse" /></td>
                  ))}</tr>
                ))
              : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">No audit logs yet</td></tr>
              ) : logs.map((log: any) => (
                <tr key={log._id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{log.userName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionColors[log.action] || "bg-gray-50 text-gray-700"}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{log.targetName}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{log.field || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {log.oldValue && log.newValue
                      ? <span>{log.oldValue} <span className="text-gray-300">→</span> {log.newValue}</span>
                      : "—"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {total > 50 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing {(auditPage - 1) * 50 + 1}–{Math.min(auditPage * 50, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={auditPage === 1}
              onClick={() => setAuditPage((p) => p - 1)}
              className="inline-flex items-center gap-1.5 border border-gray-200 bg-white rounded-xl px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              disabled={auditPage * 50 >= total}
              onClick={() => setAuditPage((p) => p + 1)}
              className="inline-flex items-center gap-1.5 border border-gray-200 bg-white rounded-xl px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CredentialsTab() {
  const toast = useToast();
  const { data: users } = useAdminUsers();
  const createCredential = useCreateCredential();
  const [form, setForm] = useState({ userId: "", username: "", password: "" });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createCredential.mutateAsync(form);
      toast.success(`Credentials created for "${form.username}"`);
      setForm({ userId: "", username: "", password: "" });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to create credentials");
    }
  }

  return (
    <div className="max-w-md">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Create Lead Credentials</h3>
        <p className="text-xs text-gray-400 mb-5">Assign a username and password for a user to log in as a Zone/Area lead.</p>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">User *</label>
            <Select value={form.userId} onValueChange={(v) => setForm((f) => ({ ...f, userId: v }))}>
              <SelectTrigger className="w-full rounded-xl border-gray-200 text-sm h-[42px]">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {(users ?? []).map((u: any) => (
                  <SelectItem key={u._id} value={u._id}>
                    {u.name || u.email || u.openId} ({u.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Username *</label>
            <input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              required
              placeholder="e.g. zone_lead_nj"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Password *</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              placeholder="Minimum 8 characters"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={createCredential.isPending}
          >
            {createCredential.isPending ? "Creating..." : "Create Credentials"}
          </button>
        </form>
      </div>
    </div>
  );
}

function HotelPersonsTab() {
  const toast = useToast();
  const { data: users } = useAdminUsers();
  const { data: hotels } = useTournaments();
  const { data: assignments, isLoading: assignmentsLoading } = useHotelPersonAssignments();
  const createCredential = useCreateHotelPersonCredential();
  const deleteCredential = useDeleteHotelPersonCredential();
  const regeneratePassword = useRegenerateHotelPersonPassword();
  const createAssignment = useCreateHotelPersonAssignment();
  const deleteAssignment = useDeleteHotelPersonAssignment();

  const [credForm, setCredForm] = useState({ username: "", password: "" });
  const [assignForm, setAssignForm] = useState({ userId: "", hotelId: "" });
  const [regenForm, setRegenForm] = useState<{ id: string; password: string } | null>(null);
  const [deletePersonId, setDeletePersonId] = useState<string | null>(null);
  const [deleteAssignId, setDeleteAssignId] = useState<string | null>(null);

  const hotelPersonUsers = (users ?? []).filter((u: any) => u.role === "hotel_person");

  async function handleCreateCredential(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createCredential.mutateAsync(credForm);
      toast.success(`Hotel person "${credForm.username}" created`);
      setCredForm({ username: "", password: "" });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to create hotel person");
    }
  }

  async function handleAssignHotel(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createAssignment.mutateAsync(assignForm);
      toast.success("Hotel assigned successfully");
      setAssignForm({ userId: "", hotelId: "" });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to assign hotel");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Generate Credentials */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Create Hotel Person Account</h3>
          <p className="text-xs text-gray-400 mb-4">Creates a new hotel_person user with login credentials.</p>
          <form onSubmit={handleCreateCredential} className="space-y-3">
            <input
              value={credForm.username}
              onChange={(e) => setCredForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="Username"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <input
              type="password"
              value={credForm.password}
              onChange={(e) => setCredForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Password"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={createCredential.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {createCredential.isPending ? "Creating..." : "Create Account"}
            </button>
          </form>
        </div>

        {/* Assign Hotel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Assign Hotel to Person</h3>
          <p className="text-xs text-gray-400 mb-4">Link a hotel person to a specific hotel they manage.</p>
          <form onSubmit={handleAssignHotel} className="space-y-3">
            <Select value={assignForm.userId} onValueChange={(v) => setAssignForm((f) => ({ ...f, userId: v }))}>
              <SelectTrigger className="rounded-xl border-gray-200 text-sm h-[42px]">
                <SelectValue placeholder="Select hotel person" />
              </SelectTrigger>
              <SelectContent>
                {hotelPersonUsers.map((u: any) => (
                  <SelectItem key={u._id} value={u._id}>{u.name || u.openId}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assignForm.hotelId} onValueChange={(v) => setAssignForm((f) => ({ ...f, hotelId: v }))}>
              <SelectTrigger className="rounded-xl border-gray-200 text-sm h-[42px]">
                <SelectValue placeholder="Select hotel" />
              </SelectTrigger>
              <SelectContent>
                {(hotels ?? []).map((h: any) => (
                  <SelectItem key={h._id} value={h._id}>{h.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="submit"
              disabled={!assignForm.userId || !assignForm.hotelId || createAssignment.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {createAssignment.isPending ? "Assigning..." : "Assign Hotel"}
            </button>
          </form>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Hotel Person Assignments</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Hotel Person</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Hotel</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {assignmentsLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 3 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 w-full bg-gray-100 rounded-lg animate-pulse" /></td>
                  ))}</tr>
                ))
              : (assignments ?? []).length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-gray-400">No assignments yet</td></tr>
              ) : (assignments ?? []).map((a: any) => (
                <tr key={a._id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.userId?.name || a.userId?.openId || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                      {a.hotelId?.name || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteAssignId(a._id)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* All Hotel Persons */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">All Hotel Persons</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Assigned Hotels</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {hotelPersonUsers.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-gray-400">No hotel persons created yet</td></tr>
            ) : hotelPersonUsers.map((u: any) => {
              const userAssignments = (assignments ?? []).filter((a: any) => a.userId?._id === u._id);
              return (
                <tr key={u._id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name || u.openId}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {userAssignments.length > 0
                        ? userAssignments.map((a: any) => (
                            <span key={a._id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                              {a.hotelId?.name || "—"}
                            </span>
                          ))
                        : <span className="text-gray-400 text-xs">No hotels assigned</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {regenForm?.id === u._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="password"
                            value={regenForm?.password ?? ""}
                            onChange={(e) => setRegenForm({ id: u._id, password: e.target.value })}
                            placeholder="New password"
                            className="w-32 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            onClick={async () => {
                              if (!regenForm) return;
                              try {
                                await regeneratePassword.mutateAsync({ id: u._id, password: regenForm.password });
                                toast.success("Password updated");
                                setRegenForm(null);
                              } catch {
                                toast.error("Failed to update password");
                              }
                            }}
                            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setRegenForm(null)} className="text-xs text-gray-400 hover:text-gray-600 px-1">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRegenForm({ id: u._id, password: "" })}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Reset password"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setDeletePersonId(u._id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete hotel person"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteAssignId !== null}
        onOpenChange={(open) => !open && setDeleteAssignId(null)}
        title="Remove Hotel Assignment"
        description="This hotel person will no longer have access to this hotel."
        confirmLabel="Remove"
        onConfirm={() => {
          if (!deleteAssignId) return;
          deleteAssignment.mutate(deleteAssignId, {
            onSuccess: () => { toast.success("Assignment removed"); setDeleteAssignId(null); },
            onError: () => { toast.error("Failed to remove assignment"); setDeleteAssignId(null); },
          });
        }}
        loading={deleteAssignment.isPending}
      />

      <ConfirmDialog
        open={deletePersonId !== null}
        onOpenChange={(open) => !open && setDeletePersonId(null)}
        title="Delete Hotel Person"
        description="This will permanently delete this hotel person account and all their hotel assignments. They will no longer be able to log in."
        confirmLabel="Delete Account"
        onConfirm={() => {
          if (!deletePersonId) return;
          deleteCredential.mutate(deletePersonId, {
            onSuccess: () => { toast.success("Hotel person deleted"); setDeletePersonId(null); },
            onError: () => { toast.error("Failed to delete hotel person"); setDeletePersonId(null); },
          });
        }}
        loading={deleteCredential.isPending}
      />
    </div>
  );
}
