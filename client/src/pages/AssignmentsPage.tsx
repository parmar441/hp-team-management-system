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
import { Search, Download, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ZONES = ["North", "South", "East", "West", "Central"] as const;
const ZONE_COLORS: Record<string, string> = {
  North: "blue",
  South: "emerald",
  East: "amber",
  West: "purple",
  Central: "rose",
};
const STATUS_COLORS: Record<string, string> = {
  upcoming: "amber",
  available: "emerald",
  not_available: "rose",
};

export default function AssignmentsPage() {
  const { user } = useAuth();
  const role = user?.role ?? "user";
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");
  const [filterZone, setFilterZone] = useState<string>("");

  const { data: assignments, isLoading } = trpc.assignments.list.useQuery({
    zones: filterZone ? [filterZone] : undefined,
  });

  const updateRoomMutation = trpc.assignments.updateRoomNumber.useMutation({
    onSuccess: () => {
      utils.assignments.list.invalidate();
      toast.success("Room number updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleRoomUpdate = (slotId: number, value: string) => {
    updateRoomMutation.mutate({ slotId, roomNumber: value.trim() || null });
  };

  const handleExportPdf = () => {
    window.open("/api/export/assignments-pdf", "_blank");
  };

  const filtered = (assignments ?? []).filter((h) => {
    if (search && !h.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).map((h) => ({
    ...h,
    slots: h.slots.filter((s: any) => {
      if (!s.team) return false;
      if (filterZone && s.team.zone !== filterZone) return false;
      return true;
    }),
  })).filter((h) => h.slots.length > 0);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Assignments</h1>
          <p className="text-muted-foreground text-sm">
            Hotel slot assignments with room numbers
          </p>
        </div>
        {role === "admin" && (
          <Button variant="outline" size="sm" onClick={handleExportPdf}>
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 w-48"
            placeholder="Search hotels..."
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

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No assignments found
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((hotel) => (
            <div key={hotel.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">{hotel.name}</h3>
                  <Badge variant={STATUS_COLORS[hotel.status] as any} className="text-xs">
                    {hotel.status.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {hotel.slots.length} assignment{hotel.slots.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {hotel.address && (
                  <p className="text-xs text-muted-foreground mt-1">{hotel.address}</p>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/20">
                    <tr>
                      <th className="p-3 text-left font-semibold w-16">Slot</th>
                      <th className="p-3 text-left font-semibold">Team</th>
                      <th className="p-3 text-left font-semibold">Members</th>
                      <th className="p-3 text-left font-semibold w-24">Zone</th>
                      <th className="p-3 text-left font-semibold w-36">Room Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotel.slots.map((slot: any, i: number) => (
                      <tr
                        key={slot.id}
                        className={cn(
                          "border-t border-border",
                          i % 2 === 0 ? "bg-card" : "bg-muted/10"
                        )}
                      >
                        <td className="p-3 text-muted-foreground">#{slot.slotNumber}</td>
                        <td className="p-3 font-medium">{slot.team?.name ?? "—"}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {(slot.team?.members ?? []).map((m: any) => (
                              <span key={m.id} className="text-xs text-muted-foreground">
                                {m.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          {slot.team?.zone && (
                            <Badge variant={ZONE_COLORS[slot.team.zone] as any} className="text-xs">
                              {slot.team.zone}
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
                          {role === "admin" ? (
                            <RoomInput
                              key={slot.id}
                              initialValue={slot.roomNumber ?? ""}
                              onSave={(val) => handleRoomUpdate(slot.id, val)}
                            />
                          ) : (
                            <span>{slot.roomNumber ?? "—"}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RoomInput({ initialValue, onSave }: { initialValue: string; onSave: (v: string) => void }) {
  const [value, setValue] = useState(initialValue);

  return (
    <input
      className="w-28 px-2 py-1 text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/50"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== initialValue) onSave(value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSave(value);
      }}
      placeholder="Room #"
      style={{ fontSize: "16px" }}
    />
  );
}
