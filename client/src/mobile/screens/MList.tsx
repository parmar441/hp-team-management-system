import { useState } from "react";
import { Download, List as ListIcon, Search } from "lucide-react";
import { usePeople, type Person } from "../../hooks/usePeople";
import { useDebounce } from "../../hooks/useDebounce";
import { Avatar, Pill, ScreenHeader, EmptyState, Spinner, useToast } from "../ui";
import { downloadCSV } from "../../lib/utils";

export default function MList() {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 350);
  const { data, isLoading } = usePeople({ search: debounced, pageSize: 200 });
  const people: Person[] = data?.people ?? [];

  function exportCSV() {
    const rows = [["Name", "Zone", "Area", "ACO"].join(",")];
    for (const p of people) rows.push([`${p.firstName} ${p.lastName || ""}`.trim(), p.zone || "", p.area || "", p.acoNeeded].join(","));
    downloadCSV(rows.join("\n"), "registry.csv");
    toast("List exported");
  }

  return (
    <div className="pt-2">
      <ScreenHeader title="List" subtitle={`${data?.total ?? people.length} members`}
        action={
          <button onClick={exportCSV} className="inline-flex items-center gap-1.5 h-[40px] px-4 rounded-full text-[13px] font-semibold border"
            style={{ borderColor: "var(--m-card-border)", color: "var(--m-text)" }}>
            <Download className="w-4 h-4" /> Export
          </button>
        } />

      <div className="relative mb-3">
        <Search className="w-[18px] h-[18px] absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--m-faint)]" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name…"
          className="w-full h-[48px] pl-11 pr-4 rounded-[14px] border text-[15px] outline-none placeholder:text-[var(--m-faint)] focus:border-[var(--m-accent-border)]"
          style={{ background: "var(--m-card)", borderColor: "var(--m-card-border)", color: "var(--m-text)" }} />
      </div>

      {isLoading ? <div className="flex justify-center pt-16"><Spinner className="w-6 h-6" /></div>
        : people.length === 0 ? <EmptyState icon={<ListIcon className="w-6 h-6" />} title="No members found" />
        : (
          <div className="rounded-[18px] border overflow-hidden" style={{ background: "var(--m-card)", borderColor: "var(--m-card-border)" }}>
            {people.map((p, i) => {
              const name = `${p.firstName} ${p.lastName || ""}`.trim();
              return (
                <div key={p._id} className="flex items-center gap-2.5 px-[15px] py-2.5"
                  style={i > 0 ? { borderTop: "1px solid var(--m-card-border)" } : undefined}>
                  <Avatar name={name} size={34} radius={11} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold truncate">{name}</p>
                    <p className="text-[11.5px] text-[var(--m-faint)] truncate">{[p.zone, p.area].filter(Boolean).join(" · ") || "Unassigned"}</p>
                  </div>
                  <Pill tone={p.acoNeeded === "Yes" ? "emerald" : "neutral"}>{p.acoNeeded === "Yes" ? "ACO" : "—"}</Pill>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
