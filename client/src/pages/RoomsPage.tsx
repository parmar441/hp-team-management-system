import { useState, useRef } from "react";
import { useMe } from "../hooks/useAuth";
import { useTournaments } from "../hooks/useTournaments";
import {
  useHotelRoomsWithStatus,
  useAddHotelRooms,
  useDeleteHotelRoom,
  useDeleteAllHotelRooms,
  useImportHotelRooms,
} from "../hooks/useHotelRooms";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { X, Upload, Plus, Trash2 } from "lucide-react";

export default function RoomsPage() {
  const { data: me } = useMe();
  const { data: hotels } = useTournaments();
  const [selectedHotel, setSelectedHotel] = useState<string>("");
  const [roomInput, setRoomInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: rooms, isLoading } = useHotelRoomsWithStatus(selectedHotel || undefined);
  const addRooms = useAddHotelRooms();
  const deleteRoom = useDeleteHotelRoom();
  const deleteAll = useDeleteAllHotelRooms();
  const importRooms = useImportHotelRooms();

  const roomsList = Array.isArray(rooms) ? rooms : [];
  const assigned = roomsList.filter((r: any) => r.isAssigned).length;
  const total = roomsList.length;

  function handleAdd() {
    if (!selectedHotel || !roomInput.trim()) return;
    addRooms.mutate({ hotelId: selectedHotel, roomNumbers: roomInput }, {
      onSuccess: () => setRoomInput(""),
    });
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedHotel) return;
    importRooms.mutate({ hotelId: selectedHotel, file });
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Room Management</h1>
        <p className="text-sm text-gray-500 mt-1">Pre-define room numbers per hotel</p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-64">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Select Hotel</label>
          <Select value={selectedHotel} onValueChange={setSelectedHotel}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a hotel..." />
            </SelectTrigger>
            <SelectContent>
              {(hotels || []).map((h: any) => (
                <SelectItem key={h._id} value={h._id}>{h.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedHotel && (
          <>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Room Number(s)</label>
              <div className="flex gap-2">
                <Input
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  placeholder="e.g. 101, 102, 103"
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
                <Button onClick={handleAdd} disabled={addRooms.isPending || !roomInput.trim()} size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="file"
                ref={fileRef}
                className="hidden"
                accept=".csv,.txt,.xlsx,.xls"
                onChange={handleImport}
              />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={importRooms.isPending}>
                <Upload className="w-4 h-4 mr-1" /> Import CSV/Excel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteAll.mutate(selectedHotel)}
                disabled={deleteAll.isPending || total === 0}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Delete All
              </Button>
            </div>
          </>
        )}
      </div>

      {selectedHotel && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {(hotels || []).find((h: any) => h._id === selectedHotel)?.name || "Hotel"} — Rooms
              </CardTitle>
              <p className="text-sm text-gray-500">
                {assigned} assigned / {total} total rooms
              </p>
            </div>
            <div className="flex gap-4 text-xs text-gray-500 mt-2">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border-2 border-emerald-500 inline-block" /> Assigned
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border-2 border-gray-300 inline-block" /> Available
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-400 text-sm">Loading rooms...</p>
            ) : roomsList.length === 0 ? (
              <p className="text-gray-400 text-sm">No rooms defined for this hotel yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {roomsList.map((room: any) => (
                  <Badge
                    key={room._id}
                    variant="outline"
                    className={`text-sm px-3 py-1.5 ${
                      room.isAssigned
                        ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                        : "border-gray-300 text-gray-600"
                    }`}
                  >
                    {room.roomNumber}
                    {me?.user?.role !== "user" && (
                      <button
                        onClick={() => deleteRoom.mutate(room._id)}
                        className="ml-1.5 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
