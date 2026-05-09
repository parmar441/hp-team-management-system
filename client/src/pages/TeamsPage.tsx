import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, Edit, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ZONES = ["North", "South", "East", "West", "Central"] as const;
const ZONE_COLORS: Record<string, string> = {
  North: "blue",
  South: "emerald",
  East: "amber",
  West: "purple",
  Central: "rose",
};

export default function TeamsPage() {
  const { user } = useAuth();
  const role = user?.role ?? "user";
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");
  const [filterZone, setFilterZone] = useState<string>("");
  const [editTeam, setEditTeam] = useState<any | null>(null);
  const [deleteTeamId, setDeleteTeamId] = useState<number | null>(null);

  const { data: teams, isLoading } = trpc.teams.list.useQuery({
    zones: filterZone ? [filterZone] : undefined,
  });

  const deleteMutation = trpc.teams.delete.useMutation({
    onSuccess: () => {
      utils.teams.list.invalidate();
      toast.success("Team deleted");
      setDeleteTeamId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = (teams ?? []).filter((t) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Teams</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} teams</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 w-48"
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {role === "admin" && (
          <Select value={filterZone || "__all__"} onValueChange={(v) => setFilterZone(v === "__all__" ? "" : v)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Zones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Zones</SelectItem>
              {ZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Team Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No teams found. Create teams from the List page.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((team) => (
            <div key={team.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-base">{team.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {team.zone && (
                      <Badge variant={ZONE_COLORS[team.zone] as any || "outline"} className="text-xs">
                        {team.zone}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {team.members.length} member{team.members.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditTeam(team)}
                    className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  {role === "admin" && (
                    <button
                      onClick={() => setDeleteTeamId(team.id)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                {team.members.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-2 text-sm">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      m.gender === "M" ? "bg-blue-400" : "bg-pink-400"
                    )} />
                    <span>{m.name}</span>
                    {m.isTeamLead && (
                      <Badge variant="amber" className="text-xs py-0">Lead</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Team Dialog */}
      {editTeam && (
        <EditTeamDialog
          team={editTeam}
          onClose={() => setEditTeam(null)}
        />
      )}

      {/* Delete Confirm */}
      <AlertDialog
        open={deleteTeamId !== null}
        onOpenChange={(o) => !o && setDeleteTeamId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this team. All members will become unassigned and any hotel slot will be released.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTeamId && deleteMutation.mutate({ id: deleteTeamId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditTeamDialog({ team, onClose }: { team: any; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [name, setName] = useState(team.name);
  const [selectedIds, setSelectedIds] = useState<number[]>(team.members.map((m: any) => m.id));

  const { data: availPeople } = trpc.teams.availablePeople.useQuery(
    { zones: team.zone ? [team.zone] : undefined }
  );

  const allEligible = [
    ...team.members,
    ...(availPeople ?? []).filter((p: any) => !team.members.some((m: any) => m.id === p.id)),
  ];

  const updateMutation = trpc.teams.update.useMutation({
    onSuccess: () => {
      utils.teams.list.invalidate();
      toast.success("Team updated");
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMember = (id: number) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 2) {
        toast.error("Team must have at least 2 members");
        return;
      }
      setSelectedIds((s) => s.filter((x) => x !== id));
    } else {
      if (selectedIds.length >= 8) {
        toast.error("Maximum 8 members per team");
        return;
      }
      setSelectedIds((s) => [...s, id]);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({ id: team.id, name: name.trim() || undefined, memberIds: selectedIds });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Team Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>
              Members ({selectedIds.length}/8)
              <span className="text-xs text-muted-foreground ml-2">Min 2, max 8 from same zone</span>
            </Label>
            <div className="border border-border rounded-lg max-h-60 overflow-y-auto divide-y divide-border">
              {allEligible.map((p: any) => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedIds.includes(p.id)}
                    onCheckedChange={() => toggleMember(p.id)}
                  />
                  <span className="text-sm flex-1">{p.name}</span>
                  <div className="flex gap-1">
                    <Badge variant={p.gender === "M" ? "blue" : "pink"} className="text-xs">
                      {p.gender}
                    </Badge>
                    <Badge variant="slate" className="text-xs">{p.zone}</Badge>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={selectedIds.length < 2 || updateMutation.isPending}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
