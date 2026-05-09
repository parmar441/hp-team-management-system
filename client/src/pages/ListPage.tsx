import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, Download, Users, X } from "lucide-react";
import { cn, downloadCSV } from "@/lib/utils";

const ZONES = ["North", "South", "East", "West", "Central"] as const;
const ZONE_AREAS: Record<string, string[]> = {
  North: ["Delhi", "Chandigarh", "Lucknow", "Jaipur", "Amritsar"],
  South: ["Chennai", "Bangalore", "Hyderabad", "Kochi", "Coimbatore"],
  East: ["Kolkata", "Bhubaneswar", "Patna", "Ranchi", "Guwahati"],
  West: ["Mumbai", "Pune", "Ahmedabad", "Surat", "Nagpur"],
  Central: ["Indore", "Bhopal", "Raipur", "Jabalpur", "Gwalior"],
};

export default function ListPage() {
  const { user } = useAuth();
  const role = user?.role ?? "user";
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");
  const [filterZone, setFilterZone] = useState<string>("");
  const [filterArea, setFilterArea] = useState<string>("");
  const [unassignedOnly, setUnassignedOnly] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [teamName, setTeamName] = useState("");

  const { data: allPeopleResult, isLoading } = trpc.people.list.useQuery({
    pageSize: 400,
    stay: true,
    search: search || undefined,
    zones: filterZone ? [filterZone] : undefined,
    areas: filterArea ? [filterArea] : undefined,
  });

  const { data: assignedIds } = trpc.teams.availablePeople.useQuery(
    { zones: filterZone ? [filterZone] : undefined }
  );

  const createTeamMutation = trpc.teams.create.useMutation({
    onSuccess: () => {
      utils.teams.list.invalidate();
      utils.people.list.invalidate();
      toast.success("Team created!");
      setSelectMode(false);
      setSelectedIds([]);
      setTeamName("");
    },
    onError: (err) => toast.error(err.message),
  });

  const allPeople = allPeopleResult?.data ?? [];
  const assignedSet = new Set((assignedIds ?? []).map((p: any) => p.id));

  const filtered = allPeople.filter((p) => {
    if (unassignedOnly && assignedSet.has(p.id)) return false;
    return true;
  });

  const toggleCard = (id: number) => {
    if (!selectMode) return;
    if (selectedIds.includes(id)) {
      setSelectedIds((s) => s.filter((x) => x !== id));
    } else if (selectedIds.length < 8) {
      setSelectedIds((s) => [...s, id]);
    } else {
      toast.error("Maximum 8 members per team");
    }
  };

  const handleCreateTeam = () => {
    if (selectedIds.length < 2) {
      toast.error("Select at least 2 people");
      return;
    }
    createTeamMutation.mutate({ memberIds: selectedIds, name: teamName || undefined });
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Gender", "Age Group", "Zone", "Area", "Category", "Note"];
    const csvRows = filtered.map((p) => [
      p.name, p.gender, p.ageGroup, p.zone,
      p.area ?? "", p.category ?? "", p.note ?? "",
    ].map((v) => `"${v}"`).join(","));
    downloadCSV([headers.join(","), ...csvRows].join("\n"), "aco-players.csv");
  };

  const availableAreas = filterZone ? ZONE_AREAS[filterZone] ?? [] : [];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">ACO Players</h1>
          <p className="text-muted-foreground text-sm">
            {filtered.length} {unassignedOnly ? "unassigned" : "total"} ACO players
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          {!selectMode ? (
            <Button size="sm" onClick={() => setSelectMode(true)}>
              <Users className="h-4 w-4" />
              Create Team
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectMode(false);
                setSelectedIds([]);
                setTeamName("");
              }}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 w-48"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {role === "admin" && (
          <Select
            value={filterZone || "__all__"}
            onValueChange={(v) => { setFilterZone(v === "__all__" ? "" : v); setFilterArea(""); }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Zones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Zones</SelectItem>
              {ZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {availableAreas.length > 0 && (
          <Select
            value={filterArea || "__all__"}
            onValueChange={(v) => setFilterArea(v === "__all__" ? "" : v)}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Areas</SelectItem>
              {availableAreas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        <div className="flex items-center gap-2 border border-border rounded-md px-3">
          <button
            className={cn(
              "py-1.5 px-2 text-sm rounded transition-colors",
              unassignedOnly ? "bg-primary text-white" : "hover:bg-muted"
            )}
            onClick={() => setUnassignedOnly(true)}
          >
            Unassigned Only
          </button>
          <button
            className={cn(
              "py-1.5 px-2 text-sm rounded transition-colors",
              !unassignedOnly ? "bg-primary text-white" : "hover:bg-muted"
            )}
            onClick={() => setUnassignedOnly(false)}
          >
            All ACO
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(15)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No ACO players found
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((person) => {
            const isSelected = selectedIds.includes(person.id);
            const isAssigned = !unassignedOnly && assignedSet.has(person.id);
            return (
              <div
                key={person.id}
                onClick={() => toggleCard(person.id)}
                className={cn(
                  "p-3 rounded-xl border transition-all",
                  selectMode && !isAssigned ? "cursor-pointer" : "",
                  isSelected
                    ? "border-primary bg-primary/10 ring-2 ring-primary"
                    : isAssigned
                    ? "border-border bg-muted/50 opacity-60"
                    : "border-border bg-card hover:border-primary/40",
                  selectMode && !isSelected && !isAssigned ? "hover:bg-primary/5" : ""
                )}
              >
                <div className="flex flex-wrap gap-1 mb-2">
                  <Badge variant={person.gender === "M" ? "blue" : "pink"} className="text-xs">
                    {person.gender}
                  </Badge>
                  <Badge
                    variant={
                      person.ageGroup === "Child" ? "teal"
                      : person.ageGroup === "Teen" ? "secondary"
                      : person.ageGroup === "Senior" ? "orange"
                      : "slate"
                    }
                    className="text-xs"
                  >
                    {person.ageGroup}
                  </Badge>
                  {person.category && (
                    <Badge variant="purple" className="text-xs">{person.category}</Badge>
                  )}
                </div>
                <p className="font-medium text-sm leading-tight">{person.name}</p>
                {person.area && (
                  <p className="text-xs text-muted-foreground mt-0.5">{person.area}</p>
                )}
                {person.note && (
                  <p className="text-xs text-muted-foreground mt-0.5 italic truncate">{person.note}</p>
                )}
                {isAssigned && (
                  <Badge variant="slate" className="text-xs mt-1">In Team</Badge>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Create Team Bar */}
      {selectMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-xl p-4 z-40 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">
            {selectedIds.length} selected{selectedIds.length < 2 ? " (min 2)" : selectedIds.length >= 8 ? " (max 8)" : ""}
          </span>
          <Input
            className="w-48"
            placeholder="Team name (optional)"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
          <Button
            onClick={handleCreateTeam}
            disabled={selectedIds.length < 2 || createTeamMutation.isPending}
          >
            Create Team ({selectedIds.length})
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSelectMode(false);
              setSelectedIds([]);
              setTeamName("");
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
