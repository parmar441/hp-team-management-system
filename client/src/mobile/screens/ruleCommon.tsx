import { Plus, X } from "lucide-react";
import { Pill } from "../ui";

export const FIELD_LABEL: Record<string, string> = {
  mandal: "State (mandal)", gender: "Gender", country: "Country", ageRange: "Age range",
};

export interface RuleLike { _id: string; field: string; matchValue: string; priority: number }

export function matchLabel(field: string, value: string) {
  if (field === "gender") return value === "M" ? "Male" : value === "F" ? "Female" : value;
  return value;
}

export function RuleRows({ rules, canEdit, onDelete }: {
  rules: RuleLike[]; canEdit: boolean; onDelete: (id: string) => void;
}) {
  if (rules.length === 0) {
    return <p className="text-[12.5px] text-[var(--m-faint)] py-1">No rules yet.</p>;
  }
  return (
    <div className="space-y-2">
      {rules.map((r) => (
        <div key={r._id} className="flex items-center gap-2 rounded-[11px] px-3 py-2.5" style={{ background: "var(--m-inset)" }}>
          <span className="text-[13px] flex-1 min-w-0">
            <span className="text-[var(--m-muted)]">{FIELD_LABEL[r.field] ?? r.field} is </span>
            <span className="font-semibold text-[var(--m-text)]">{matchLabel(r.field, r.matchValue)}</span>
          </span>
          <Pill tone="accent">P{r.priority}</Pill>
          {canEdit && (
            <button onClick={() => onDelete(r._id)} className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--m-faint)]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function AddRuleButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="mt-2 w-full h-[42px] rounded-[11px] border border-dashed text-[13px] font-semibold flex items-center justify-center gap-1.5"
      style={{ borderColor: "var(--m-card-border)", color: "var(--m-muted)" }}>
      <Plus className="w-4 h-4" /> Add rule
    </button>
  );
}
