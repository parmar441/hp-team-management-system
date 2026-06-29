import { Fragment } from "react";
import { Plus, X } from "lucide-react";

export const FIELD_LABEL: Record<string, string> = {
  mandal: "State (mandal)", gender: "Gender", country: "Country", ageRange: "Age range",
};

export interface RuleLike { _id: string; field: string; matchValue: string; priority: number }

/** Pretty-print a condition value, expanding "+"/"," OR-lists and gender codes. */
export function matchLabel(field: string, value: string) {
  const tokens = value.split(/[+,]/).map((s) => s.trim()).filter(Boolean);
  const pretty = tokens.map((t) => {
    if (field === "gender") {
      const l = t.toLowerCase();
      return l === "m" || l === "male" ? "Male" : l === "f" || l === "female" ? "Female" : t;
    }
    return t;
  });
  return pretty.join(" · ");
}

export function RuleRows({ rules, canEdit, onDelete }: {
  rules: RuleLike[]; canEdit: boolean; onDelete: (id: string) => void;
}) {
  if (rules.length === 0) {
    return <p className="text-[12.5px] text-[var(--m-faint)] py-1">No conditions yet.</p>;
  }
  return (
    <div className="space-y-1.5">
      {rules.map((r, i) => {
        const tokens = r.matchValue.split(/[+,]/).filter(Boolean);
        return (
          <Fragment key={r._id}>
            {i > 0 && (
              <div className="flex items-center gap-2 px-1">
                <span className="text-[9.5px] font-bold tracking-widest text-[var(--m-faint)]">AND</span>
                <span className="flex-1 h-px" style={{ background: "var(--m-card-border)" }} />
              </div>
            )}
            <div className="flex items-start gap-2 rounded-[11px] px-3 py-2.5" style={{ background: "var(--m-inset)" }}>
              <span className="text-[13px] flex-1 min-w-0 leading-snug">
                <span className="text-[var(--m-muted)]">{FIELD_LABEL[r.field] ?? r.field} {tokens.length > 1 ? "is one of " : "is "}</span>
                <span className="font-semibold text-[var(--m-text)]">{matchLabel(r.field, r.matchValue)}</span>
              </span>
              {canEdit && (
                <button onClick={() => onDelete(r._id)} className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--m-faint)] flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

export function AddRuleButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="mt-2 w-full h-[42px] rounded-[11px] border border-dashed text-[13px] font-semibold flex items-center justify-center gap-1.5"
      style={{ borderColor: "var(--m-card-border)", color: "var(--m-muted)" }}>
      <Plus className="w-4 h-4" /> Add condition
    </button>
  );
}
