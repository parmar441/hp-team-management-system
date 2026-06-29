import { useMemo } from "react";
import { Download, FileText } from "lucide-react";
import { useAssignments } from "../../hooks/useAssignments";
import { ScreenHeader, EmptyState, Spinner, useToast } from "../ui";
import { downloadCSV } from "../../lib/utils";

interface Group { teamName: string; hotelName: string; room: string; members: any[]; zone: string }

export default function MFinalList() {
  const toast = useToast();
  const { data: slots, isLoading } = useAssignments();

  const groups = useMemo<Group[]>(() => {
    const out: Group[] = [];
    for (const s of (slots ?? []) as any[]) {
      if (!s.teamId) continue;
      out.push({
        teamName: s.teamId.name,
        hotelName: s.tournamentId?.name || "",
        room: s.roomNumber || "",
        zone: s.teamId.zone || "",
        members: s.teamId.members ?? [],
      });
    }
    return out;
  }, [slots]);

  const placed = groups.reduce((n, g) => n + g.members.length, 0);

  function exportCSV() {
    const rows = [["Name", "Member ID", "Team", "Zone", "Hotel", "Room"].join(",")];
    for (const g of groups) for (const m of g.members) {
      rows.push([`${m.firstName} ${m.lastName || ""}`.trim(), m.memberId || "", g.teamName, g.zone, g.hotelName, g.room].join(","));
    }
    downloadCSV(rows.join("\n"), "final-list.csv");
    toast("Final list exported");
  }

  return (
    <div className="pt-2">
      <ScreenHeader title="Final List" subtitle={`${placed} people placed`}
        action={
          <button onClick={exportCSV} className="inline-flex items-center gap-1.5 h-[40px] px-4 rounded-full text-[13px] font-semibold border"
            style={{ borderColor: "var(--m-card-border)", color: "var(--m-text)" }}>
            <Download className="w-4 h-4" /> Export
          </button>
        } />

      {isLoading ? <div className="flex justify-center pt-16"><Spinner className="w-6 h-6" /></div>
        : groups.length === 0 ? <EmptyState icon={<FileText className="w-6 h-6" />} title="No placements yet" hint="Assign teams to hotel slots" />
        : (
          <div className="space-y-[11px]">
            {groups.map((g, i) => (
              <div key={i} className="rounded-[18px] border p-[15px]" style={{ background: "var(--m-card)", borderColor: "var(--m-card-border)" }}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="m-serif text-[18px] font-bold">{g.teamName}</p>
                  <div className="text-right">
                    <p className="text-[13px] font-semibold truncate max-w-[150px]">{g.hotelName || "—"}</p>
                    {g.room && <p className="text-[12px] text-[var(--m-faint)]">Room {g.room}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  {g.members.map((m: any) => {
                    const name = `${m.firstName} ${m.lastName || ""}`.trim();
                    return (
                      <div key={m._id} className="flex items-center gap-2.5">
                        <span className="text-[14px] font-semibold flex-1 truncate">{name}</span>
                        <span className="text-[12px] text-[var(--m-faint)]">{m.memberId || ""}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
