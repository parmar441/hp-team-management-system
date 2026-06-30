import { useEffect, useState } from "react";
import { ChevronRight, ClipboardList, Check } from "lucide-react";
import {
  useTournaments, useTournament, useAvailableTeams, useAssignTeam, useUnassignTeam, useUpdateSlotRoom,
  type TournamentSlot,
} from "../../hooks/useTournaments";
import { useAvailableRooms } from "../../hooks/useHotelRooms";
import type { Team } from "../../hooks/useTeams";
import { useMe } from "../../hooks/useAuth";
import { personName } from "../../lib/utils";
import { ScreenHeader, Sheet, EmptyState, CardSkeletons, PrimaryButton, TextInput, Label, useToast } from "../ui";

export default function MAssignments() {
  const toast = useToast();
  const isAdmin = useMe().data?.user?.role === "admin";
  const { data: hotels } = useTournaments();
  const [hotelId, setHotelId] = useState("");
  const hotelList = (hotels ?? []) as any[];
  useEffect(() => { if (!hotelId && hotelList.length) setHotelId(hotelList[0]._id); }, [hotelList, hotelId]);

  const { data, isLoading } = useTournament(hotelId);
  const { data: availableTeams } = useAvailableTeams(hotelId);
  const slots: TournamentSlot[] = data?.slots ?? [];
  const [active, setActive] = useState<TournamentSlot | null>(null);

  const unassignedTeams = (availableTeams ?? []).length;

  return (
    <div className="pt-2">
      <ScreenHeader title="Assignments" subtitle={`${unassignedTeams} teams not yet assigned`} />

      {hotelList.length > 0 && (
        <div className="flex gap-2 overflow-x-auto m-no-scrollbar pb-1 mb-4 -mx-5 px-5">
          {hotelList.map((h) => {
            const on = h._id === hotelId;
            return (
              <button key={h._id} onClick={() => setHotelId(h._id)}
                className="flex-shrink-0 px-3.5 py-2 rounded-[11px] text-[13px] font-semibold whitespace-nowrap"
                style={on ? { background: "var(--m-accent-soft)", color: "var(--m-accent)" } : { background: "var(--m-inset)", color: "var(--m-muted)" }}>
                {h.name}
              </button>
            );
          })}
        </div>
      )}

      {!hotelId ? <EmptyState icon={<ClipboardList className="w-6 h-6" />} title="No hotels" hint="Add a hotel first" />
        : isLoading ? <CardSkeletons count={6} height={82} />
        : slots.length === 0 ? <EmptyState icon={<ClipboardList className="w-6 h-6" />} title="No slots" />
        : (
          <div className="space-y-[11px] m-stagger">
            {slots.map((s) => {
              const team = s.teamId as Team | null;
              return (
                <button key={s._id} onClick={() => isAdmin && setActive(s)}
                  className="m-sheen m-press w-full text-left rounded-[18px] border p-[15px] flex items-center gap-3"
                  style={{ backgroundColor: "var(--m-card)", borderColor: "var(--m-card-border)", boxShadow: "var(--m-shadow-card)" }}>
                  <span className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 font-bold text-[14px]"
                    style={team ? { background: "var(--m-aco-bg)", color: "var(--m-aco-fg)" } : { background: "var(--m-inset)", color: "var(--m-faint)" }}>
                    {s.slotNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--m-faint)]">Slot {s.slotNumber}</p>
                    <p className="text-[15px] font-bold truncate">{team ? team.name : "Empty"}</p>
                    <p className="text-[12.5px] text-[var(--m-muted)] truncate">
                      {team ? `${team.members?.length ?? 0} members · ${s.roomNumber ? `Room ${s.roomNumber}` : "No room set"}` : "Tap to assign · No room set"}
                    </p>
                  </div>
                  {isAdmin && <ChevronRight className="w-5 h-5 text-[var(--m-faint)] flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

      <SlotSheet slot={active} tournamentId={hotelId} availableTeams={(availableTeams ?? []) as Team[]}
        onClose={() => setActive(null)} />
    </div>
  );
}

function SlotSheet({ slot, tournamentId, availableTeams, onClose }: {
  slot: TournamentSlot | null; tournamentId: string; availableTeams: Team[]; onClose: () => void;
}) {
  const toast = useToast();
  const assign = useAssignTeam();
  const unassign = useUnassignTeam();
  const updateRoom = useUpdateSlotRoom();
  const { data: rooms } = useAvailableRooms(tournamentId);
  const [room, setRoom] = useState("");

  useEffect(() => { setRoom(slot?.roomNumber || ""); }, [slot]);
  if (!slot) return null;
  const team = slot.teamId as Team | null;
  const roomOptions = (rooms ?? []).map((r: any) => (typeof r === "string" ? r : r.roomNumber)) as string[];

  return (
    <Sheet open={!!slot} onClose={onClose} title={<p className="m-serif text-[20px] font-bold">Slot {slot.slotNumber}</p>}
      footer={team ? (
        <PrimaryButton onClick={() => updateRoom.mutate({ slotId: slot._id, roomNumber: room }, { onSuccess: () => { toast("Room saved"); onClose(); } })}>
          Save room
        </PrimaryButton>
      ) : undefined}>
      {team ? (
        <div className="space-y-4 pb-2">
          <div className="rounded-[14px] p-3.5" style={{ background: "var(--m-inset)" }}>
            <p className="text-[15px] font-bold">{team.name}</p>
            <p className="text-[12.5px] text-[var(--m-muted)] mt-0.5">
              {team.members?.map((m) => personName(m)).join(", ") || "No members"}
            </p>
          </div>
          <div>
            <Label>Room</Label>
            {roomOptions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2.5">
                {roomOptions.map((rn) => (
                  <button key={rn} onClick={() => setRoom(rn)}
                    className="px-3 py-1.5 rounded-[10px] text-[13px] font-semibold"
                    style={room === rn ? { background: "var(--m-accent-soft)", color: "var(--m-accent)" } : { background: "var(--m-inset)", color: "var(--m-muted)" }}>
                    {rn}
                  </button>
                ))}
              </div>
            )}
            <TextInput placeholder="Room number" value={room} onChange={(e) => setRoom(e.target.value)} />
          </div>
          <button onClick={() => unassign.mutate({ tournamentId, slotId: slot._id }, { onSuccess: () => { toast("Team removed from slot"); onClose(); } })}
            className="w-full h-[48px] rounded-[14px] text-[14px] font-semibold" style={{ background: "var(--m-rose-bg)", color: "var(--m-rose-fg)" }}>
            Remove team
          </button>
        </div>
      ) : (
        <div className="space-y-1.5 pb-2">
          <p className="text-[12.5px] text-[var(--m-muted)] mb-1">Assign a team to this slot</p>
          {availableTeams.length === 0 ? <p className="text-[13px] text-[var(--m-faint)] py-3">No unassigned teams available.</p>
            : availableTeams.map((t) => (
              <button key={t._id} onClick={() => assign.mutate({ tournamentId, slotId: slot._id, teamId: t._id }, { onSuccess: () => { toast(`${t.name} assigned`); onClose(); } })}
                className="w-full flex items-center gap-3 p-3 rounded-[12px]" style={{ background: "var(--m-inset)" }}>
                <span className="text-[14px] font-semibold flex-1 text-left">{t.name}</span>
                <span className="text-[12px] text-[var(--m-faint)]">{t.members?.length ?? 0} members</span>
                <Check className="w-4 h-4 text-[var(--m-faint)]" />
              </button>
            ))}
        </div>
      )}
    </Sheet>
  );
}
