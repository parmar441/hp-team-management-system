import { useState } from "react";
import { Plus, RefreshCw, Map } from "lucide-react";
import {
  useDynamicAreas, useCreateArea, useDeleteArea, useAddAreaRule, useDeleteAreaRule, useReapplyAreaRules,
  type DynamicArea,
} from "../../hooks/useDynamicAreas";
import { useDynamicZones, type DynamicZone } from "../../hooks/useDynamicZones";
import { useMe } from "../../hooks/useAuth";
import { ScreenHeader, IconButton, Card, Pill, Sheet, Label, TextInput, ChipGroup, PrimaryButton, EmptyState, Spinner, useToast } from "../ui";
import { RuleRows, AddRuleButton, FIELD_LABEL } from "./ruleCommon";

const FIELDS = ["mandal", "gender", "ageRange"] as const;

function zoneName(area: DynamicArea): string | undefined {
  if (!area.zoneId) return undefined;
  return typeof area.zoneId === "string" ? undefined : area.zoneId.name;
}

export default function MAreas() {
  const toast = useToast();
  const isAdmin = useMe().data?.user?.role === "admin";
  const { data: areas, isLoading } = useDynamicAreas();
  const { data: zones } = useDynamicZones();
  const createArea = useCreateArea();
  const deleteArea = useDeleteArea();
  const addRule = useAddAreaRule();
  const deleteRule = useDeleteAreaRule();
  const reapply = useReapplyAreaRules();

  const [newOpen, setNewOpen] = useState(false);
  const [name, setName] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [ruleFor, setRuleFor] = useState<DynamicArea | null>(null);
  const [rule, setRule] = useState({ field: "mandal" as typeof FIELDS[number], matchValue: "", priority: 10 });

  const list: DynamicArea[] = areas ?? [];
  const zoneList: DynamicZone[] = zones ?? [];

  function create() {
    if (!name.trim()) { toast("Name required"); return; }
    createArea.mutate({ name: name.trim(), zoneId: zoneId || undefined }, {
      onSuccess: () => { toast("Area created"); setNewOpen(false); setName(""); setZoneId(""); },
      onError: () => toast("Failed to create area"),
    });
  }
  function addNewRule() {
    if (!ruleFor || !rule.matchValue.trim()) { toast("Match value required"); return; }
    addRule.mutate({ areaId: ruleFor._id, data: rule }, {
      onSuccess: () => { toast("Rule added"); setRuleFor(null); setRule({ field: "mandal", matchValue: "", priority: 10 }); },
      onError: () => toast("Failed to add rule"),
    });
  }

  return (
    <div className="pt-2">
      <ScreenHeader title="Areas" subtitle="Field-based area rules"
        action={isAdmin && <>
          <button onClick={() => reapply.mutate(undefined, { onSuccess: () => toast("Rules reapplied") })} aria-label="Reapply"
            className="w-[42px] h-[42px] rounded-[13px] flex items-center justify-center" style={{ background: "var(--m-card)", border: "1px solid var(--m-card-border)" }}>
            <RefreshCw className={`w-[18px] h-[18px] ${reapply.isPending ? "animate-spin" : ""}`} />
          </button>
          <IconButton onClick={() => setNewOpen(true)} aria-label="Add area"><Plus className="w-5 h-5" /></IconButton>
        </>} />

      {isLoading ? <div className="flex justify-center pt-16"><Spinner className="w-6 h-6" /></div>
        : list.length === 0 ? <EmptyState icon={<Map className="w-6 h-6" />} title="No areas yet" hint={isAdmin ? "Tap + to create one" : undefined} />
        : (
          <div className="space-y-[11px]">
            {list.map((a) => (
              <Card key={a._id}>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-[16.5px] font-bold flex-1 truncate">{a.name}</p>
                  {zoneName(a) && <Pill tone="neutral">{zoneName(a)}</Pill>}
                  <span className="text-[12px] text-[var(--m-faint)]">{(a.rules ?? []).length} rules</span>
                </div>
                <RuleRows rules={(a.rules ?? []) as any} canEdit={!!isAdmin}
                  onDelete={(id) => deleteRule.mutate(id, { onSuccess: () => toast("Rule deleted") })} />
                {isAdmin && <AddRuleButton onClick={() => setRuleFor(a)} />}
                {isAdmin && (
                  <button onClick={() => deleteArea.mutate(a._id, { onSuccess: () => toast("Area deleted") })}
                    className="mt-2 text-[12.5px] font-semibold" style={{ color: "var(--m-rose-fg)" }}>Delete area</button>
                )}
              </Card>
            ))}
          </div>
        )}

      <Sheet open={newOpen} onClose={() => setNewOpen(false)} title={<p className="m-serif text-[20px] font-bold">New area</p>}
        footer={<PrimaryButton onClick={create} disabled={createArea.isPending}>Create area</PrimaryButton>}>
        <div className="space-y-4 pb-2">
          <div><Label>Area name</Label><TextInput placeholder="e.g. Area 1" value={name} onChange={(e) => setName(e.target.value)} /></div>
          {zoneList.length > 0 && (
            <div><Label>Zone</Label>
              <ChipGroup value={zoneId} allowEmpty onChange={setZoneId}
                options={zoneList.map((z) => ({ value: z._id, label: z.name }))} /></div>
          )}
        </div>
      </Sheet>

      <Sheet open={!!ruleFor} onClose={() => setRuleFor(null)} title={<p className="m-serif text-[20px] font-bold">Add rule</p>}
        footer={<PrimaryButton onClick={addNewRule} disabled={addRule.isPending}>Add rule</PrimaryButton>}>
        <div className="space-y-4 pb-2">
          <div><Label>Field</Label>
            <ChipGroup value={rule.field} onChange={(v) => setRule((r) => ({ ...r, field: (v || "mandal") as typeof FIELDS[number] }))}
              options={FIELDS.map((f) => ({ value: f, label: FIELD_LABEL[f] }))} />
          </div>
          <div><Label>Match value</Label>
            <TextInput placeholder={rule.field === "gender" ? "M or F" : "Value"} value={rule.matchValue}
              onChange={(e) => setRule((r) => ({ ...r, matchValue: e.target.value }))} /></div>
          <div><Label>Priority</Label>
            <TextInput type="number" value={String(rule.priority)} onChange={(e) => setRule((r) => ({ ...r, priority: parseInt(e.target.value) || 0 }))} /></div>
        </div>
      </Sheet>
    </div>
  );
}
