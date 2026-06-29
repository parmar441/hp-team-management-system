import { useState } from "react";
import { Plus, RefreshCw, MapPin } from "lucide-react";
import {
  useDynamicZones, useCreateZone, useDeleteZone, useAddZoneRule, useDeleteZoneRule, useReapplyZoneRules,
  type DynamicZone,
} from "../../hooks/useDynamicZones";
import { useMe } from "../../hooks/useAuth";
import { ScreenHeader, IconButton, Card, Pill, Sheet, Label, TextInput, ChipGroup, PrimaryButton, EmptyState, Spinner, useToast } from "../ui";
import { RuleRows, AddRuleButton, FIELD_LABEL } from "./ruleCommon";

const FIELDS = ["mandal", "gender", "country", "ageRange"] as const;

export default function MZones() {
  const toast = useToast();
  const isAdmin = useMe().data?.user?.role === "admin";
  const { data: zones, isLoading } = useDynamicZones();
  const createZone = useCreateZone();
  const deleteZone = useDeleteZone();
  const addRule = useAddZoneRule();
  const deleteRule = useDeleteZoneRule();
  const reapply = useReapplyZoneRules();

  const [newOpen, setNewOpen] = useState(false);
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [ruleFor, setRuleFor] = useState<DynamicZone | null>(null);
  const [rule, setRule] = useState({ field: "mandal" as typeof FIELDS[number], matchValue: "", priority: 10 });

  const list: DynamicZone[] = zones ?? [];

  function create() {
    if (!name.trim()) { toast("Name required"); return; }
    createZone.mutate({ name: name.trim(), isDefault }, {
      onSuccess: () => { toast("Zone created"); setNewOpen(false); setName(""); setIsDefault(false); },
      onError: () => toast("Failed to create zone"),
    });
  }
  function addNewRule() {
    if (!ruleFor || !rule.matchValue.trim()) { toast("Match value required"); return; }
    addRule.mutate({ zoneId: ruleFor._id, data: rule }, {
      onSuccess: () => { toast("Rule added"); setRuleFor(null); setRule({ field: "mandal", matchValue: "", priority: 10 }); },
      onError: () => toast("Failed to add rule"),
    });
  }

  return (
    <div className="pt-2">
      <ScreenHeader title="Zones" subtitle="Field-based zone rules"
        action={isAdmin && <>
          <button onClick={() => reapply.mutate(undefined, { onSuccess: () => toast("Rules reapplied") })} aria-label="Reapply"
            className="w-[42px] h-[42px] rounded-[13px] flex items-center justify-center" style={{ background: "var(--m-card)", border: "1px solid var(--m-card-border)" }}>
            <RefreshCw className={`w-[18px] h-[18px] ${reapply.isPending ? "animate-spin" : ""}`} />
          </button>
          <IconButton onClick={() => setNewOpen(true)} aria-label="Add zone"><Plus className="w-5 h-5" /></IconButton>
        </>} />

      {isLoading ? <div className="flex justify-center pt-16"><Spinner className="w-6 h-6" /></div>
        : list.length === 0 ? <EmptyState icon={<MapPin className="w-6 h-6" />} title="No zones yet" hint={isAdmin ? "Tap + to create one" : undefined} />
        : (
          <div className="space-y-[11px]">
            {list.map((z) => (
              <Card key={z._id}>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-[16.5px] font-bold flex-1 truncate">{z.name}</p>
                  {z.isDefault && <Pill tone="accent">DEFAULT</Pill>}
                  <span className="text-[12px] text-[var(--m-faint)]">{(z.rules ?? []).length} rules</span>
                </div>
                <RuleRows rules={(z.rules ?? []) as any} canEdit={!!isAdmin}
                  onDelete={(id) => deleteRule.mutate(id, { onSuccess: () => toast("Rule deleted") })} />
                {isAdmin && <AddRuleButton onClick={() => setRuleFor(z)} />}
                {isAdmin && (
                  <button onClick={() => deleteZone.mutate(z._id, { onSuccess: () => toast("Zone deleted") })}
                    className="mt-2 text-[12.5px] font-semibold" style={{ color: "var(--m-rose-fg)" }}>Delete zone</button>
                )}
              </Card>
            ))}
          </div>
        )}

      {/* New zone */}
      <Sheet open={newOpen} onClose={() => setNewOpen(false)} title={<p className="m-serif text-[20px] font-bold">New zone</p>}
        footer={<PrimaryButton onClick={create} disabled={createZone.isPending}>Create zone</PrimaryButton>}>
        <div className="space-y-4 pb-2">
          <div><Label>Zone name</Label><TextInput placeholder="e.g. Northeast" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <button onClick={() => setIsDefault((v) => !v)} className="flex items-center justify-between w-full">
            <span className="text-[14px] font-medium">Default zone</span>
            <span className="w-11 h-6 rounded-full p-0.5 transition-colors" style={{ background: isDefault ? "var(--m-accent)" : "var(--m-track)" }}>
              <span className="block w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: isDefault ? "translateX(20px)" : "none" }} />
            </span>
          </button>
        </div>
      </Sheet>

      {/* Add rule */}
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
