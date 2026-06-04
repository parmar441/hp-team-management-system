import { useState, useRef } from "react";
import { useMe } from "../hooks/useAuth";
import { useTournaments } from "../hooks/useTournaments";
import { useHotelRoomsWithStatus, useAddHotelRooms, useDeleteHotelRoom, useDeleteAllHotelRooms, useImportHotelRooms } from "../hooks/useHotelRooms";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import { useToast } from "../components/ui/toaster";
import { DoorOpen, Plus, Upload, Trash2, X, Hotel } from "lucide-react";

export default function RoomsPage() {
  const toast = useToast();
  const { data: me } = useMe();
  const { data: hotels } = useTournaments();
  const [selectedHotel, setSelectedHotel] = useState<string>("");
  const [roomInput, setRoomInput] = useState("");
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: rooms, isLoading } = useHotelRoomsWithStatus(selectedHotel || undefined);
  const addRooms = useAddHotelRooms();
  const deleteRoom = useDeleteHotelRoom();
  const deleteAll = useDeleteAllHotelRooms();
  const importRooms = useImportHotelRooms();

  const roomsList = Array.isArray(rooms) ? rooms : [];
  const assigned = roomsList.filter((r: any) => r.isAssigned).length;
  const available = roomsList.filter((r: any) => !r.isAssigned).length;
  const total = roomsList.length;

  const selectedHotelName = (hotels ?? []).find((h: any) => h._id === selectedHotel)?.name;

  function handleAdd() {
    if (!selectedHotel || !roomInput.trim()) return;
    addRooms.mutate({ hotelId: selectedHotel, roomNumbers: roomInput }, {
      onSuccess: () => {
        toast.success("Rooms added successfully");
        setRoomInput("");
      },
      onError: () => toast.error("Failed to add rooms"),
    });
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedHotel) return;
    importRooms.mutate({ hotelId: selectedHotel, file }, {
      onSuccess: () => toast.success("Rooms imported successfully"),
      onError: () => toast.error("Failed to import rooms"),
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  const canEdit = me?.user?.role !== "user";

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center">
              <DoorOpen className="w-5 h-5 text-teal-600" />
            </div>
            Room Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Pre-define room numbers per hotel for team assignments</p>
        </div>
      </div>

      {/* Hotel Selector + Controls */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Select Hotel</label>
          <Select value={selectedHotel} onValueChange={setSelectedHotel}>
            <SelectTrigger className="w-full sm:w-72 rounded-xl border-gray-200 text-sm h-[42px]">
              <Hotel className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Choose a hotel..." />
            </SelectTrigger>
            <SelectContent>
              {(hotels ?? []).map((h: any) => (
                <SelectItem key={h._id} value={h._id}>{h.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedHotel && canEdit && (
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Add Rooms</label>
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-1 min-w-[220px] gap-2">
                <input
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  placeholder="e.g. 101, 102, 103 or 101-120"
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
                />
                <button
                  onClick={handleAdd}
                  disabled={addRooms.isPending || !roomInput.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-4 h-4" /> {addRooms.isPending ? "Adding..." : "Add"}
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileRef}
                  className="hidden"
                  accept=".csv,.txt,.xlsx,.xls"
                  onChange={handleImport}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={importRooms.isPending}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" /> {importRooms.isPending ? "Importing..." : "Import CSV"}
                </button>
                {total > 0 && (
                  <button
                    onClick={() => setShowDeleteAll(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete All
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rooms Grid */}
      {selectedHotel && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Hotel Summary Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{selectedHotelName} — Rooms</h2>
              <p className="text-xs text-gray-400 mt-0.5">{total} total · {assigned} assigned · {available} available</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border-2 border-emerald-500 inline-block" /> Assigned
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border-2 border-gray-300 inline-block" /> Available
              </span>
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-9 w-16 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : roomsList.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <DoorOpen className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-sm">No rooms defined yet</p>
                <p className="text-gray-400 text-xs mt-1">Add room numbers above to get started</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {roomsList.map((room: any) => (
                  <div
                    key={room._id}
                    className={`group relative inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl border-2 transition-all ${
                      room.isAssigned
                        ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                        : "border-gray-300 text-gray-600 bg-white hover:border-gray-400"
                    }`}
                  >
                    {room.roomNumber}
                    {canEdit && !room.isAssigned && (
                      <button
                        onClick={() => deleteRoom.mutate(room._id, {
                          onSuccess: () => toast.success(`Room ${room.roomNumber} removed`),
                          onError: () => toast.error("Failed to remove room"),
                        })}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                        title="Remove room"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {room.isAssigned && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedHotel && (hotels ?? []).length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Hotel className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-700 mb-1">No hotels yet</h3>
          <p className="text-sm text-gray-400">Add hotels in the Hotels page first, then manage their rooms here.</p>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteAll}
        onOpenChange={setShowDeleteAll}
        title="Delete All Rooms"
        description={`All ${total} rooms for ${selectedHotelName || "this hotel"} will be permanently deleted. Only unassigned rooms will be removed — assigned rooms are protected.`}
        confirmLabel="Delete All Rooms"
        onConfirm={() => {
          deleteAll.mutate(selectedHotel, {
            onSuccess: () => { toast.success("All rooms deleted"); setShowDeleteAll(false); },
            onError: () => { toast.error("Failed to delete rooms"); setShowDeleteAll(false); },
          });
        }}
        loading={deleteAll.isPending}
      />
    </div>
  );
}
