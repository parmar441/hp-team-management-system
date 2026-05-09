import { useState } from "react";
import { trpc } from "@/lib/trpc";
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
import { Download, Search } from "lucide-react";
import { cn, downloadCSV } from "@/lib/utils";

const ZONES = ["North", "South", "East", "West", "Central"] as const;
const GENDERS = ["M", "F"] as const;
const AGE_GROUPS = ["Child", "Teen", "Adult", "Senior"] as const;

const ZONE_COLORS: Record<string, string> = {
  North: "blue",
  South: "emerald",
  East: "amber",
  West: "purple",
  Central: "rose",
};

const STATUS_BADGES: Record<string, { label: string; variant: string }> = {
  Unassigned: { label: "Unassigned", variant: "slate" },
  "In Team": { label: "In Team", variant: "amber" },
  "Hotel Assigned": { label: "Hotel Assigned", variant: "purple" },
  "Room Assigned": { label: "Room Assigned", variant: "emerald" },
};

export default function FinalListPage() {
  const [search, setSearch] = useState("");
  const [filterZone, setFilterZone] = useState<string>("");
  const [filterGender, setFilterGender] = useState<string>("");
  const [filterAge, setFilterAge] = useState<string>("");
  const [filterAco, setFilterAco] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const { data: items, isLoading } = trpc.finalList.list.useQuery();

  const filtered = (items ?? []).filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !(p.team?.name ?? "").toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filterZone && p.zone !== filterZone) return false;
    if (filterGender && p.gender !== filterGender) return false;
    if (filterAge && p.ageGroup !== filterAge) return false;
    if (filterAco === "yes" && !p.stay) return false;
    if (filterAco === "no" && p.stay) return false;
    if (filterStatus && p.pipelineStatus !== filterStatus) return false;
    return true;
  });

  const handleExportCSV = () => {
    const headers = ["#", "Name", "Zone", "Area", "Category", "Team", "Hotel", "Slot", "Room Number", "Status"];
    const rows = filtered.map((p, i) => [
      i + 1,
      p.name,
      p.zone,
      p.area ?? "",
      p.category ?? "",
      p.team?.name ?? "",
      p.hotel?.name ?? "",
      p.slot?.slotNumber ?? "",
      p.slot?.roomNumber ?? "",
      p.pipelineStatus,
    ].map((v) => `"${v}"`).join(","));
    downloadCSV([headers.join(","), ...rows].join("\n"), "final-list.csv");
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Final List</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} people</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

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

        <Select value={filterZone || "__all__"} onValueChange={(v) => setFilterZone(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Zones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Zones</SelectItem>
            {ZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterGender || "__all__"} onValueChange={(v) => setFilterGender(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            <SelectItem value="M">Male</SelectItem>
            <SelectItem value="F">Female</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterAge || "__all__"} onValueChange={(v) => setFilterAge(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Age Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Ages</SelectItem>
            {AGE_GROUPS.map((ag) => <SelectItem key={ag} value={ag}>{ag}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterAco || "__all__"} onValueChange={(v) => setFilterAco(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="ACO" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            <SelectItem value="yes">ACO Yes</SelectItem>
            <SelectItem value="no">ACO No</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus || "__all__"} onValueChange={(v) => setFilterStatus(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Pipeline Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Statuses</SelectItem>
            <SelectItem value="Unassigned">Unassigned</SelectItem>
            <SelectItem value="In Team">In Team</SelectItem>
            <SelectItem value="Hotel Assigned">Hotel Assigned</SelectItem>
            <SelectItem value="Room Assigned">Room Assigned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-left font-semibold w-10">#</th>
                <th className="p-3 text-left font-semibold">Name</th>
                <th className="p-3 text-left font-semibold">Zone</th>
                <th className="p-3 text-left font-semibold">Area</th>
                <th className="p-3 text-left font-semibold">Category</th>
                <th className="p-3 text-left font-semibold">Team</th>
                <th className="p-3 text-left font-semibold">Hotel</th>
                <th className="p-3 text-left font-semibold">Slot</th>
                <th className="p-3 text-left font-semibold">Room</th>
                <th className="p-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [...Array(10)].map((_, i) => (
                    <tr key={i} className="border-t border-border">
                      {[...Array(10)].map((_, j) => (
                        <td key={j} className="p-3"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : filtered.map((person, i) => {
                    const status = STATUS_BADGES[person.pipelineStatus];
                    return (
                      <tr
                        key={person.id}
                        className={cn(
                          "border-t border-border hover:bg-muted/30",
                          i % 2 === 0 ? "" : "bg-muted/5"
                        )}
                      >
                        <td className="p-3 text-muted-foreground">{i + 1}</td>
                        <td className="p-3 font-medium">{person.name}</td>
                        <td className="p-3">
                          <Badge variant={ZONE_COLORS[person.zone] as any} className="text-xs">
                            {person.zone}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{person.area ?? "—"}</td>
                        <td className="p-3">
                          {person.category && (
                            <Badge variant="purple" className="text-xs">{person.category}</Badge>
                          )}
                        </td>
                        <td className="p-3">{person.team?.name ?? "—"}</td>
                        <td className="p-3">{person.hotel?.name ?? "—"}</td>
                        <td className="p-3">{person.slot?.slotNumber ?? "—"}</td>
                        <td className="p-3">{person.slot?.roomNumber ?? "—"}</td>
                        <td className="p-3">
                          <Badge variant={status.variant as any} className="text-xs">
                            {status.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
