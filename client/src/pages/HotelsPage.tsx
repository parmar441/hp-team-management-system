import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Building2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

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

function DraggableTeamChip({ team }: { team: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `team-${team.id}`,
    data: { teamId: team.id },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "px-3 py-2 rounded-lg border border-border bg-card text-sm cursor-grab active:cursor-grabbing select-none transition-all",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div className="font-medium">{team.name}</div>
      {team.zone && (
        <Badge variant={ZONE_COLORS[team.zone] as any} className="text-xs mt-0.5">
          {team.zone}
        </Badge>
      )}
    </div>
  );
}

function DroppableSlot({
  slot,
  hotelId,
  onUnassign,
}: {
  slot: any;
  hotelId: number;
  onUnassign: (slotId: number) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${slot.id}`,
    data: { slotId: slot.id, hotelId },
  });

  if (slot.teamId && slot.team) {
    return (
      <div className="flex items-center justify-between p-2 rounded-lg border border-border bg-card/80">
        <div>
          <span className="text-xs text-muted-foreground">#{slot.slotNumber}</span>
          <div className="font-medium text-sm">{slot.team.name}</div>
          {slot.team.zone && (
            <Badge variant={ZONE_COLORS[slot.team.zone] as any} className="text-xs">
              {slot.team.zone}
            </Badge>
          )}
        </div>
        <button
          onClick={() => onUnassign(slot.id)}
          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center justify-center p-2 rounded-lg border-2 border-dashed text-muted-foreground text-xs transition-all min-h-[52px]",
        isOver
          ? "border-primary bg-primary/10 text-primary"
          : "border-border hover:border-primary/50"
      )}
    >
      Slot {slot.slotNumber} — Drop here
    </div>
  );
}

export default function HotelsPage() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [filterZone, setFilterZone] = useState<string>("");
  const [addOpen, setAddOpen] = useState(false);
  const [editHotel, setEditHotel] = useState<any | null>(null);
  const [deleteHotelId, setDeleteHotelId] = useState<number | null>(null);
  const [activeTeam, setActiveTeam] = useState<any | null>(null);

  const { data: hotels, isLoading } = trpc.hotels.list.useQuery();

  const assignMutation = trpc.hotels.assignTeam.useMutation({
    onSuccess: () => {
      utils.hotels.list.invalidate();
      toast.success("Team assigned to slot");
    },
    onError: (err) => toast.error(err.message),
  });

  const unassignMutation = trpc.hotels.unassignTeam.useMutation({
    onSuccess: () => {
      utils.hotels.list.invalidate();
      toast.success("Team unassigned");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.hotels.delete.useMutation({
    onSuccess: () => {
      utils.hotels.list.invalidate();
      toast.success("Hotel deleted");
      setDeleteHotelId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  // Collect all assigned team IDs across all hotels
  const allAssignedTeamIds = new Set(
    (hotels ?? []).flatMap((h) => h.slots.map((s: any) => s.teamId).filter(Boolean))
  );

  // Available teams pool (teams not assigned to any hotel at all)
  const { data: allTeams } = trpc.teams.list.useQuery({});
  const poolTeams = (allTeams ?? []).filter((t) => !allAssignedTeamIds.has(t.id));
  const filteredPool = poolTeams.filter((t) => {
    if (filterZone && t.zone !== filterZone) return false;
    return true;
  });

  const handleDragStart = (event: DragStartEvent) => {
    const teamId = (event.active.data.current as any)?.teamId;
    if (teamId) {
      const team = poolTeams.find((t) => t.id === teamId);
      setActiveTeam(team ?? null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTeam(null);
    const teamId = (event.active.data.current as any)?.teamId;
    const slotId = (event.over?.data.current as any)?.slotId;
    if (teamId && slotId) {
      assignMutation.mutate({ slotId, teamId });
    }
  };

  const filteredHotels = (hotels ?? []).filter((h) =>
    !search || h.name.toLowerCase().includes(search.toLowerCase())
  );

  const ZONES = ["North", "South", "East", "West", "Central"];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Hotels</h1>
          <p className="text-muted-foreground text-sm">
            {(hotels ?? []).length} hotels
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Hotel
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 w-48"
          placeholder="Search hotels..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Hotels */}
          <div className="xl:col-span-3 space-y-4">
            {isLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)
            ) : filteredHotels.map((hotel) => (
              <div key={hotel.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">{hotel.name}</h3>
                      <Badge variant={STATUS_COLORS[hotel.status] as any} className="text-xs">
                        {hotel.status.replace("_", " ")}
                      </Badge>
                    </div>
                    {hotel.address && (
                      <p className="text-xs text-muted-foreground mt-0.5">{hotel.address}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {hotel.slots.filter((s: any) => s.teamId).length}/{hotel.totalSlots} slots filled
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditHotel(hotel)}
                      className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteHotelId(hotel.id)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {hotel.slots.map((slot: any) => (
                    <DroppableSlot
                      key={slot.id}
                      slot={slot}
                      hotelId={hotel.id}
                      onUnassign={(slotId) => unassignMutation.mutate({ slotId })}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Teams Pool */}
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-card p-4 sticky top-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Unassigned Teams</h3>
                <Badge variant="secondary">{filteredPool.length}</Badge>
              </div>

              <Select value={filterZone || "__all__"} onValueChange={(v) => setFilterZone(v === "__all__" ? "" : v)}>
                <SelectTrigger className="w-full mb-3">
                  <SelectValue placeholder="Filter by zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Zones</SelectItem>
                  {ZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                </SelectContent>
              </Select>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {filteredPool.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No unassigned teams
                  </p>
                ) : (
                  filteredPool.map((team) => (
                    <DraggableTeamChip key={team.id} team={team} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeTeam && (
            <div className="px-3 py-2 rounded-lg border border-primary bg-card text-sm shadow-lg">
              <div className="font-medium">{activeTeam.name}</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Add/Edit Hotel Dialog */}
      {(addOpen || editHotel) && (
        <HotelFormDialog
          open={addOpen || !!editHotel}
          hotel={editHotel}
          onClose={() => { setAddOpen(false); setEditHotel(null); }}
        />
      )}

      {/* Delete Confirm */}
      <AlertDialog
        open={deleteHotelId !== null}
        onOpenChange={(o) => !o && setDeleteHotelId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Hotel</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the hotel and all its slots. All team assignments will be released.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteHotelId && deleteMutation.mutate({ id: deleteHotelId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function HotelFormDialog({
  open,
  hotel,
  onClose,
}: {
  open: boolean;
  hotel?: any;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [name, setName] = useState(hotel?.name ?? "");
  const [address, setAddress] = useState(hotel?.address ?? "");
  const [totalSlots, setTotalSlots] = useState(hotel?.totalSlots ?? 8);
  const [status, setStatus] = useState(hotel?.status ?? "upcoming");

  const createMutation = trpc.hotels.create.useMutation({
    onSuccess: () => {
      utils.hotels.list.invalidate();
      toast.success("Hotel created");
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.hotels.update.useMutation({
    onSuccess: () => {
      utils.hotels.list.invalidate();
      toast.success("Hotel updated");
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    if (!name.trim()) { toast.error("Hotel name is required"); return; }
    if (hotel) {
      updateMutation.mutate({ id: hotel.id, name, address: address || null, totalSlots, status });
    } else {
      createMutation.mutate({ name, address: address || null, totalSlots, status: status as any });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{hotel ? "Edit Hotel" : "Add Hotel"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Hotel Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total Slots (2–64)</Label>
              <Input
                type="number"
                min={2}
                max={64}
                value={totalSlots}
                onChange={(e) => setTotalSlots(parseInt(e.target.value) || 8)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="not_available">Not Available</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {hotel ? "Save Changes" : "Create Hotel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
