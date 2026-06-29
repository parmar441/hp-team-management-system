import { useEffect, useState } from "react";
import { Plus, DoorOpen } from "lucide-react";
import { useTournaments } from "../../hooks/useTournaments";
import { useHotelRoomsWithStatus, useAddHotelRooms, useDeleteHotelRoom } from "../../hooks/useHotelRooms";
import { useMe } from "../../hooks/useAuth";
import { ScreenHeader, IconButton, Sheet, Label, TextInput, PrimaryButton, EmptyState, Spinner, useToast } from "../ui";

export default function MRooms() {
  const toast = useToast();
  const canEdit = useMe().data?.user?.role !== "user";
  const { data: hotels } = useTournaments();
  const [hotelId, setHotelId] = useState("");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");

  const hotelList = (hotels ?? []) as any[];
  useEffect(() => { if (!hotelId && hotelList.length) setHotelId(hotelList[0]._id); }, [hotelList, hotelId]);

  const { data: rooms, isLoading } = useHotelRoomsWithStatus(hotelId || undefined);
  const addRooms = useAddHotelRooms();
  const deleteRoom = useDeleteHotelRoom();

  const list = Array.isArray(rooms) ? rooms : [];
  const assigned = list.filter((r: any) => r.isAssigned).length;

  function add() {
    if (!hotelId || !input.trim()) { toast("Enter room numbers"); return; }
    addRooms.mutate({ hotelId, roomNumbers: input }, {
      onSuccess: () => { toast("Rooms added"); setInput(""); setOpen(false); },
      onError: () => toast("Failed to add rooms"),
    });
  }

  return (
    <div className="pt-2">
      <ScreenHeader title="Rooms" subtitle={`${assigned}/${list.length} rooms assigned`}
        action={canEdit && hotelId && <IconButton onClick={() => setOpen(true)} aria-label="Add rooms"><Plus className="w-5 h-5" /></IconButton>} />

      {/* Hotel tabs */}
      {hotelList.length > 0 && (
        <div className="flex gap-2 overflow-x-auto m-no-scrollbar pb-1 mb-4 -mx-5 px-5">
          {hotelList.map((h) => {
            const active = h._id === hotelId;
            return (
              <button key={h._id} onClick={() => setHotelId(h._id)}
                className="flex-shrink-0 px-3.5 py-2 rounded-[11px] text-[13px] font-semibold whitespace-nowrap"
                style={active
                  ? { background: "var(--m-accent-soft)", color: "var(--m-accent)" }
                  : { background: "var(--m-inset)", color: "var(--m-muted)" }}>
                {h.name}
              </button>
            );
          })}
        </div>
      )}

      {!hotelId ? <EmptyState icon={<DoorOpen className="w-6 h-6" />} title="No hotels" hint="Add a hotel first" />
        : isLoading ? <div className="flex justify-center pt-12"><Spinner className="w-6 h-6" /></div>
        : list.length === 0 ? <EmptyState icon={<DoorOpen className="w-6 h-6" />} title="No rooms defined" hint={canEdit ? "Tap + to add rooms" : undefined} />
        : (
          <div className="grid grid-cols-3 gap-2.5">
            {list.map((r: any) => (
              <div key={r._id}
                onClick={() => canEdit && !r.isAssigned && deleteRoom.mutate(r._id, { onSuccess: () => toast(`Room ${r.roomNumber} removed`) })}
                className="rounded-[14px] border p-3 flex flex-col items-center justify-center gap-1 aspect-square"
                style={r.isAssigned
                  ? { background: "var(--m-aco-bg)", borderColor: "transparent" }
                  : { background: "var(--m-card)", borderColor: "var(--m-card-border)" }}>
                <span className="m-serif text-[20px] font-bold" style={{ color: r.isAssigned ? "var(--m-aco-fg)" : "var(--m-text)" }}>{r.roomNumber}</span>
                <span className="text-[10.5px] font-semibold" style={{ color: r.isAssigned ? "var(--m-aco-fg)" : "var(--m-faint)" }}>
                  {r.isAssigned ? "Assigned" : "Available"}
                </span>
              </div>
            ))}
          </div>
        )}

      <Sheet open={open} onClose={() => setOpen(false)} title={<p className="m-serif text-[20px] font-bold">Add rooms</p>}
        footer={<PrimaryButton onClick={add} disabled={addRooms.isPending}>Add rooms</PrimaryButton>}>
        <div className="pb-2">
          <Label>Room numbers</Label>
          <TextInput placeholder="e.g. 101, 102, 103 or 101-120" value={input} onChange={(e) => setInput(e.target.value)} />
          <p className="text-[12px] text-[var(--m-faint)] mt-2">Enter individual numbers or a range.</p>
        </div>
      </Sheet>
    </div>
  );
}
