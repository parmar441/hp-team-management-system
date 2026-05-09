import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Plus, Trash2, Shield } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";

const ZONES = ["North", "South", "East", "West", "Central"] as const;
const ZONE_AREAS: Record<string, string[]> = {
  North: ["Delhi", "Chandigarh", "Lucknow", "Jaipur", "Amritsar"],
  South: ["Chennai", "Bangalore", "Hyderabad", "Kochi", "Coimbatore"],
  East: ["Kolkata", "Bhubaneswar", "Patna", "Ranchi", "Guwahati"],
  West: ["Mumbai", "Pune", "Ahmedabad", "Surat", "Nagpur"],
  Central: ["Indore", "Bhopal", "Raipur", "Jabalpur", "Gwalior"],
};

const ROLE_COLORS: Record<string, string> = {
  admin: "blue",
  zone_lead: "purple",
  area_lead: "amber",
  user: "slate",
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"users" | "audit">("users");

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold font-display">Admin Panel</h1>
        <p className="text-muted-foreground text-sm">Manage users, roles, and assignments</p>
      </div>

      <div className="flex border-b border-border">
        {(["users", "audit"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "users" ? "Users & Roles" : "Audit Log"}
          </button>
        ))}
      </div>

      {activeTab === "users" ? <UsersSection /> : <AuditLogSection />}
    </div>
  );
}

function UsersSection() {
  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.admin.listUsers.useQuery();
  const { data: zoneAssignments } = trpc.admin.zoneAssignments.useQuery();
  const { data: areaAssignments } = trpc.admin.areaAssignments.useQuery();

  const setRoleMutation = trpc.admin.setRole.useMutation({
    onSuccess: () => {
      utils.admin.listUsers.invalidate();
      toast.success("Role updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const assignZoneMutation = trpc.admin.assignZone.useMutation({
    onSuccess: () => {
      utils.admin.zoneAssignments.invalidate();
      toast.success("Zone assigned");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeZoneMutation = trpc.admin.removeZone.useMutation({
    onSuccess: () => {
      utils.admin.zoneAssignments.invalidate();
      toast.success("Zone removed");
    },
    onError: (err) => toast.error(err.message),
  });

  const assignAreaMutation = trpc.admin.assignArea.useMutation({
    onSuccess: () => {
      utils.admin.areaAssignments.invalidate();
      toast.success("Area assigned");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeAreaMutation = trpc.admin.removeArea.useMutation({
    onSuccess: () => {
      utils.admin.areaAssignments.invalidate();
      toast.success("Area removed");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;
  }

  const allUsers = users ?? [];
  const admins = allUsers.filter((u) => u.role === "admin");
  const zoneLeads = allUsers.filter((u) => u.role === "zone_lead");
  const areaLeads = allUsers.filter((u) => u.role === "area_lead");
  const regularUsers = allUsers.filter((u) => u.role === "user");

  const getUserZones = (userId: number) =>
    (zoneAssignments ?? []).filter((z) => z.userId === userId).map((z) => z.zone);

  const getUserAreas = (userId: number) =>
    (areaAssignments ?? []).filter((a) => a.userId === userId);

  const UserRow = ({ user }: { user: any }) => {
    const [selectedZone, setSelectedZone] = useState<string>("");
    const [selectedArea, setSelectedArea] = useState<string>("");
    const zones = getUserZones(user.id);
    const areas = getUserAreas(user.id);

    return (
      <div className="p-4 border border-border rounded-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium">{user.name ?? "Unknown"}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={ROLE_COLORS[user.role] as any} className="text-xs">
              {user.role.replace("_", " ")}
            </Badge>
            <Select
              value={user.role}
              onValueChange={(role) => setRoleMutation.mutate({ userId: user.id, role: role as any })}
            >
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="zone_lead">Zone Lead</SelectItem>
                <SelectItem value="area_lead">Area Lead</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Zone assignments */}
        {(user.role === "zone_lead" || user.role === "admin") && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Zone Assignments</p>
            <div className="flex flex-wrap gap-1">
              {zones.map((z) => (
                <div key={z} className="flex items-center gap-1 bg-muted rounded px-2 py-0.5">
                  <span className="text-xs">{z}</span>
                  <button
                    onClick={() => removeZoneMutation.mutate({ userId: user.id, zone: z })}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Select value={selectedZone || "__none__"} onValueChange={(v) => setSelectedZone(v === "__none__" ? "" : v)}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue placeholder="Add zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select zone</SelectItem>
                  {ZONES.filter((z) => !zones.includes(z)).map((z) => (
                    <SelectItem key={z} value={z}>{z}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                disabled={!selectedZone}
                onClick={() => {
                  if (selectedZone) {
                    assignZoneMutation.mutate({ userId: user.id, zone: selectedZone });
                    setSelectedZone("");
                  }
                }}
              >
                <Plus className="h-3 w-3" />
                Assign
              </Button>
            </div>
          </div>
        )}

        {/* Area assignments */}
        {(user.role === "area_lead") && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Area Assignments</p>
            <div className="flex flex-wrap gap-1">
              {areas.map((a) => (
                <div key={`${a.zone}-${a.area}`} className="flex items-center gap-1 bg-muted rounded px-2 py-0.5">
                  <span className="text-xs">{a.zone}: {a.area}</span>
                  <button
                    onClick={() => removeAreaMutation.mutate({ userId: user.id, zone: a.zone, area: a.area })}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={selectedZone || "__none__"} onValueChange={(v) => { setSelectedZone(v === "__none__" ? "" : v); setSelectedArea(""); }}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue placeholder="Zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select zone</SelectItem>
                  {ZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                </SelectContent>
              </Select>
              {selectedZone && (
                <Select value={selectedArea || "__none__"} onValueChange={(v) => setSelectedArea(v === "__none__" ? "" : v)}>
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue placeholder="Area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select area</SelectItem>
                    {(ZONE_AREAS[selectedZone] ?? []).map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                disabled={!selectedZone || !selectedArea}
                onClick={() => {
                  if (selectedZone && selectedArea) {
                    assignAreaMutation.mutate({ userId: user.id, zone: selectedZone, area: selectedArea });
                    setSelectedArea("");
                  }
                }}
              >
                <Plus className="h-3 w-3" />
                Assign
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const Section = ({ title, users, icon: Icon, count }: { title: string; users: any[]; icon: any; count: number }) => {
    const [open, setOpen] = useState(true);
    return (
      <div className="space-y-2">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 w-full text-left p-2 hover:bg-muted/50 rounded-lg transition-colors"
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{title}</span>
          <Badge variant="secondary" className="text-xs">{count}</Badge>
        </button>
        {open && (
          <div className="pl-6 space-y-2">
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No users in this category</p>
            ) : (
              users.map((u) => <UserRow key={u.id} user={u} />)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Section title="Admins" users={admins} icon={Shield} count={admins.length} />
      <Section title="Zone Leads" users={zoneLeads} icon={Shield} count={zoneLeads.length} />
      <Section title="Area Leads" users={areaLeads} icon={Shield} count={areaLeads.length} />
      <Section title="Regular Users" users={regularUsers} icon={Shield} count={regularUsers.length} />
    </div>
  );
}

function AuditLogSection() {
  const [page, setPage] = useState(0);
  const limit = 50;
  const { data, isLoading } = trpc.admin.auditLog.useQuery({ limit, offset: page * limit });

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-2">{[...Array(10)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left font-semibold">Time</th>
                  <th className="p-3 text-left font-semibold">User</th>
                  <th className="p-3 text-left font-semibold">Role</th>
                  <th className="p-3 text-left font-semibold">Action</th>
                  <th className="p-3 text-left font-semibold">Target</th>
                  <th className="p-3 text-left font-semibold">Field</th>
                  <th className="p-3 text-left font-semibold">Old Value</th>
                  <th className="p-3 text-left font-semibold">New Value</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((log) => (
                  <tr key={log.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="p-3 text-xs">{log.userName}</td>
                    <td className="p-3">
                      <Badge variant={ROLE_COLORS[log.userRole] as any || "slate"} className="text-xs">
                        {log.userRole}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={log.action === "delete" ? "destructive" : log.action === "create" ? "emerald" : "blue"}
                        className="text-xs"
                      >
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs">{log.targetName}</td>
                    <td className="p-3 text-xs text-muted-foreground">{log.field ?? "—"}</td>
                    <td className="p-3 text-xs text-muted-foreground max-w-[100px] truncate">
                      {log.oldValue ?? "—"}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground max-w-[100px] truncate">
                      {log.newValue ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-3 border-t border-border bg-muted/30">
            <span className="text-sm text-muted-foreground">
              {data?.total ?? 0} total entries
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * limit >= (data?.total ?? 0)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
