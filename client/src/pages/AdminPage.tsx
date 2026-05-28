import { useState } from "react";
import {
  useAdminUsers,
  useUpdateUserRole,
  useZoneAssignments,
  useCreateZoneAssignment,
  useDeleteZoneAssignment,
  useAreaAssignments,
  useCreateAreaAssignment,
  useDeleteAreaAssignment,
  useAuditLog,
  useCreateCredential,
} from "../hooks/useAdmin";
import { useDynamicZoneNames } from "../hooks/useDynamicZones";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Settings,
  Users,
  MapPin,
  ClipboardList,
  KeyRound,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type AdminTab = "users" | "zones" | "areas" | "audit" | "credentials";

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("users");

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
    {
      id: "zones",
      label: "Zone Assignments",
      icon: <MapPin className="w-4 h-4" />,
    },
    {
      id: "areas",
      label: "Area Assignments",
      icon: <MapPin className="w-4 h-4" />,
    },
    {
      id: "audit",
      label: "Audit Log",
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      id: "credentials",
      label: "Credentials",
      icon: <KeyRound className="w-4 h-4" />,
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Settings className="w-6 h-6 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "users" && <UsersTab />}
      {tab === "zones" && <ZonesTab />}
      {tab === "areas" && <AreasTab />}
      {tab === "audit" && <AuditTab />}
      {tab === "credentials" && <CredentialsTab />}
    </div>
  );
}

function UsersTab() {
  const { data: users, isLoading } = useAdminUsers();
  const updateRole = useUpdateUserRole();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50/80">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Name / Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              OpenID
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Role
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Last Sign In
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-full bg-gray-100 rounded-lg animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            : (users ?? []).map((u: any) => (
                <tr
                  key={u._id}
                  className="hover:bg-indigo-50/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {u.name || u.email || u.openId}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                    {u.openId}
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={u.role}
                      onValueChange={(role) =>
                        updateRole.mutate({ id: u._id, role })
                      }
                    >
                      <SelectTrigger className="h-8 w-36 text-xs rounded-lg border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["user", "admin", "zone_lead", "area_lead"].map(
                          (r) => (
                            <SelectItem key={r} value={r}>
                              {r.replace("_", " ")}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {u.lastSignedIn
                      ? new Date(u.lastSignedIn).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

function ZonesTab() {
  const { data: assignments, isLoading } = useZoneAssignments();
  const { data: users } = useAdminUsers();
  const { data: zoneNames } = useDynamicZoneNames();
  const createAssignment = useCreateZoneAssignment();
  const deleteAssignment = useDeleteZoneAssignment();
  const [form, setForm] = useState({ userId: "", zone: "" });

  return (
    <div className="space-y-5">
      {/* Assign form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Assign User to Zone
        </h3>
        <div className="flex gap-3">
          <Select
            value={form.userId}
            onValueChange={(v) => setForm((f) => ({ ...f, userId: v }))}
          >
            <SelectTrigger className="flex-1 rounded-xl border-gray-200 text-sm h-[42px]">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {(users ?? []).map((u: any) => (
                <SelectItem key={u._id} value={u._id}>
                  {u.name || u.email || u.openId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={form.zone}
            onValueChange={(v) => setForm((f) => ({ ...f, zone: v }))}
          >
            <SelectTrigger className="flex-1 rounded-xl border-gray-200 text-sm h-[42px]">
              <SelectValue placeholder="Select zone" />
            </SelectTrigger>
            <SelectContent>
              {(zoneNames ?? []).map((z: string) => (
                <SelectItem key={z} value={z}>
                  {z}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            disabled={
              !form.userId || !form.zone || createAssignment.isPending
            }
            onClick={() => {
              createAssignment.mutate(form);
              setForm({ userId: "", zone: "" });
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Assign
          </button>
        </div>
      </div>

      {/* Assignments table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Zone
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 3 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-full bg-gray-100 rounded-lg animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : (assignments ?? []).map((a: any) => (
                  <tr
                    key={a._id}
                    className="hover:bg-indigo-50/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {a.userId?.name || a.userId?.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {a.zone}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteAssignment.mutate(a._id)}
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
    </div>
  );
}

function AreasTab() {
  const { data: assignments, isLoading } = useAreaAssignments();
  const { data: users } = useAdminUsers();
  const { data: zoneNames } = useDynamicZoneNames();
  const createAssignment = useCreateAreaAssignment();
  const deleteAssignment = useDeleteAreaAssignment();
  const [form, setForm] = useState({ userId: "", zone: "", area: "" });

  return (
    <div className="space-y-5">
      {/* Assign form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Assign User to Area
        </h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <Select
              value={form.userId}
              onValueChange={(v) => setForm((f) => ({ ...f, userId: v }))}
            >
              <SelectTrigger className="flex-1 rounded-xl border-gray-200 text-sm h-[42px]">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {(users ?? []).map((u: any) => (
                  <SelectItem key={u._id} value={u._id}>
                    {u.name || u.email || u.openId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={form.zone}
              onValueChange={(v) => setForm((f) => ({ ...f, zone: v }))}
            >
              <SelectTrigger className="flex-1 rounded-xl border-gray-200 text-sm h-[42px]">
                <SelectValue placeholder="Select zone" />
              </SelectTrigger>
              <SelectContent>
                {(zoneNames ?? []).map((z: string) => (
                  <SelectItem key={z} value={z}>
                    {z}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3">
            <input
              placeholder="Area name"
              value={form.area}
              onChange={(e) =>
                setForm((f) => ({ ...f, area: e.target.value }))
              }
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              disabled={
                !form.userId ||
                !form.zone ||
                !form.area ||
                createAssignment.isPending
              }
              onClick={() => {
                createAssignment.mutate(form);
                setForm({ userId: "", zone: "", area: "" });
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Assign
            </button>
          </div>
        </div>
      </div>

      {/* Assignments table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Zone
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Area
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-full bg-gray-100 rounded-lg animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : (assignments ?? []).map((a: any) => (
                  <tr
                    key={a._id}
                    className="hover:bg-indigo-50/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {a.userId?.name || a.userId?.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {a.zone}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                        {a.area}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteAssignment.mutate(a._id)}
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
            <tr className="bg-gray-50/80">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Target
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Field
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Change
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-full bg-gray-100 rounded-lg animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : logs.map((log: any) => (
                  <tr
                    key={log._id}
                    className="hover:bg-indigo-50/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {log.userName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          actionColors[log.action] ||
                          "bg-gray-50 text-gray-700"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {log.targetName}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {log.field || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {log.oldValue && log.newValue ? (
                        <span>
                          {log.oldValue}{" "}
                          <span className="text-gray-300">→</span>{" "}
                          {log.newValue}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {total > 50 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing {(auditPage - 1) * 50 + 1}–
            {Math.min(auditPage * 50, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={auditPage === 1}
              onClick={() => setAuditPage((p) => p - 1)}
              className="inline-flex items-center gap-1.5 border border-gray-200 bg-white rounded-xl px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              disabled={auditPage * 50 >= total}
              onClick={() => setAuditPage((p) => p + 1)}
              className="inline-flex items-center gap-1.5 border border-gray-200 bg-white rounded-xl px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CredentialsTab() {
  const { data: users } = useAdminUsers();
  const createCredential = useCreateCredential();
  const [form, setForm] = useState({ userId: "", username: "", password: "" });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await createCredential.mutateAsync(form);
      setSuccess(`Credentials created for "${form.username}"`);
      setForm({ userId: "", username: "", password: "" });
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to create credentials");
    }
  }

  return (
    <div className="max-w-md">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-5">
          Create Lead Credentials
        </h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              User *
            </label>
            <Select
              value={form.userId}
              onValueChange={(v) => setForm((f) => ({ ...f, userId: v }))}
            >
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
            <label className="block text-sm font-medium text-gray-700">
              Username *
            </label>
            <input
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value }))
              }
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Password *
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={createCredential.isPending}
          >
            {createCredential.isPending
              ? "Creating..."
              : "Create Credentials"}
          </button>
        </form>
      </div>
    </div>
  );
}
