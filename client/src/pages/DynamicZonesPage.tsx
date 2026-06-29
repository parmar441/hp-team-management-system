import { useMemo, useState } from "react";
import {
  useDynamicZones, useCreateZone, useUpdateZone, useDeleteZone,
  useAddZoneRule, useDeleteZoneRule, useReapplyZoneRules,
  type DynamicZone, type DynamicZoneRule,
} from "../hooks/useDynamicZones";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import { useToast } from "../components/ui/toaster";
import { PageContainer, PageHeader } from "../components/ui/page";
import { MapPin, Plus, Trash2, RefreshCw, Search, Star, X } from "lucide-react";

const ZONE_FIELDS = ["gender", "mandal", "country", "ageRange"] as const;

/** Expand a stored matchValue ("AUSTIN+DALLAS") into readable OR tokens. */
function prettyCondition(field: string, value: string): { multi: boolean; text: string } {
  const tokens = value.split(/[+,]/).map((s) => s.trim()).filter(Boolean);
  const vals = tokens.map((t) => {
    if (field === "gender") {
      const l = t.toLowerCase();
      return l === "m" || l === "male" ? "Male" : l === "f" || l === "female" ? "Female" : t;
    }
    return t;
  });
  return { multi: vals.length > 1, text: vals.join(", ") };
}

export default function DynamicZonesPage() {
  const toast = useToast();
  const { data: zones, isLoading } = useDynamicZones();
  const createZone = useCreateZone();
  const updateZone = useUpdateZone();
  const deleteZone = useDeleteZone();
  const addRule = useAddZoneRule();
  const deleteRule = useDeleteZoneRule();
  const reapply = useReapplyZoneRules();

  const [showCreate, setShowCreate] = useState(false);
  const [newZone, setNewZone] = useState({ name: "", isDefault: false });
  const [addingRuleTo, setAddingRuleTo] = useState<string | null>(null);
  const [newRule, setNewRule] = useState({ field: "mandal" as typeof ZONE_FIELDS[number], matchValue: "", priority: 0 });
  const [deleteZoneId, setDeleteZoneId] = useState<string | null>(null);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const allZones: DynamicZone[] = zones ?? [];
  const totalRules = allZones.reduce((sum, z) => sum + (z.rules ?? []).length, 0);
  const defaultZone = allZones.find((z) => z.isDefault);

  const visibleZones = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allZones;
    return allZones.filter((z) => z.name.toLowerCase().includes(q));
  }, [allZones, search]);

  return (
    <PageContainer width="wide">
      <PageHeader
        icon={<MapPin className="w-5 h-5" />}
        tone="violet"
        title="Zones"
        subtitle="Map people into zones with field-based rules"
        actions={
          <>
            <div className="relative flex-1 sm:flex-initial min-w-[160px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search zones…"
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 text-gray-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              className="border border-gray-200 bg-white rounded-xl hover:bg-gray-50 text-gray-600 px-3 sm:px-4 py-2.5 text-sm font-semibold transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
              disabled={reapply.isPending}
              onClick={() => reapply.mutate(undefined, {
                onSuccess: () => toast.success("Zone rules reapplied — people reassigned"),
                onError: () => toast.error("Failed to reapply zone rules"),
              })}
            >
              <RefreshCw className={`w-4 h-4 ${reapply.isPending ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Reapply</span>
            </button>
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-3 sm:px-4 py-2.5 text-sm font-semibold transition-colors inline-flex items-center gap-1.5"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="w-4 h-4" /> Add Zone
            </button>
          </>
        }
      />

      {/* Summary bar */}
      {!isLoading && allZones.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-500 border-y border-gray-100 py-2.5">
          <span><span className="font-semibold text-gray-900">{allZones.length}</span> zone{allZones.length !== 1 && "s"}</span>
          <span className="text-gray-300">•</span>
          <span><span className="font-semibold text-gray-900">{totalRules}</span> condition{totalRules !== 1 && "s"}</span>
          <span className="text-gray-300">•</span>
          <span className="inline-flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-indigo-500" />
            Default: <span className="font-semibold text-gray-900">{defaultZone ? defaultZone.name : "none set"}</span>
          </span>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-gray-100 shadow-sm bg-white p-4">
              <div className="bg-gray-100 rounded-lg animate-pulse h-24 w-full" />
            </div>
          ))}
        </div>
      ) : allZones.length === 0 ? (
        <EmptyState onAdd={() => setShowCreate(true)} />
      ) : visibleZones.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <Search className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-700">No zones match “{search}”</p>
          <button onClick={() => setSearch("")} className="mt-2 text-sm text-indigo-600 hover:underline">Clear search</button>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start">
          {visibleZones.map((zone) => {
            const rules = [...(zone.rules ?? [])].sort((a, b) => b.priority - a.priority);
            return (
              <div key={zone._id} className="rounded-xl border border-gray-100 shadow-sm bg-white flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                {/* Card header */}
                <div className="px-3 py-2.5 flex items-start justify-between gap-2 border-b border-gray-100 bg-gradient-to-br from-violet-50/60 to-transparent">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-gray-900 font-semibold truncate">{zone.name}</span>
                        {zone.isDefault && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 text-indigo-700 flex-shrink-0">
                            <Star className="w-2.5 h-2.5" /> Default
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400">{zone.isDefault ? "fallback zone" : `${rules.length} condition${rules.length !== 1 ? "s" : ""}`}</span>
                    </div>
                  </div>
                  <button
                    className="p-1 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                    title="Delete zone"
                    onClick={() => setDeleteZoneId(zone._id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                  </button>
                </div>

                {/* Default toggle */}
                <label className="px-3 py-2 flex items-center justify-between gap-2 border-b border-gray-50 cursor-pointer">
                  <span className="text-[11px] text-gray-500">Default zone</span>
                  <Switch
                    checked={zone.isDefault}
                    onCheckedChange={(checked) => updateZone.mutate(
                      { id: zone._id, data: { isDefault: checked } },
                      { onSuccess: () => toast.info(`${zone.name} ${checked ? "set as" : "removed from"} default`) }
                    )}
                  />
                </label>

                {/* Rules */}
                <div className="px-3 py-2.5 flex flex-col gap-2 flex-1">
                  {zone.isDefault ? (
                    <p className="text-xs text-gray-400 italic py-0.5">Fallback — anyone not matched by another zone lands here.</p>
                  ) : rules.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-0.5">No conditions yet.</p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {rules.map((rule: DynamicZoneRule, i: number) => {
                        const c = prettyCondition(rule.field, rule.matchValue);
                        return (
                          <div key={rule._id}>
                            {i > 0 && (
                              <div className="flex items-center gap-2 py-0.5">
                                <span className="text-[9px] font-bold tracking-widest text-gray-400">AND</span>
                                <span className="flex-1 h-px bg-gray-100" />
                              </div>
                            )}
                            <div className="group flex items-start gap-1.5 text-xs bg-gray-50 rounded-lg px-2 py-1.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-700 flex-shrink-0">{rule.field}</span>
                              <span className="text-gray-400 flex-shrink-0">{c.multi ? "is one of" : "is"}</span>
                              <span className="font-medium text-gray-900 flex-1 break-words">{c.text}</span>
                              <button
                                className="p-0.5 rounded hover:bg-red-50 transition-colors opacity-60 group-hover:opacity-100 flex-shrink-0"
                                onClick={() => setDeleteRuleId(rule._id)}
                              >
                                <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {zone.isDefault ? null : addingRuleTo === zone._id ? (
                    <RuleForm
                      fields={ZONE_FIELDS}
                      value={newRule}
                      onChange={setNewRule}
                      pending={addRule.isPending}
                      onCancel={() => setAddingRuleTo(null)}
                      onSubmit={async () => {
                        try {
                          await addRule.mutateAsync({ zoneId: zone._id, data: { ...newRule, priority: 0 } });
                          toast.success("Condition added");
                          setAddingRuleTo(null);
                          setNewRule({ field: "mandal", matchValue: "", priority: 0 });
                        } catch {
                          toast.error("Failed to add condition");
                        }
                      }}
                    />
                  ) : (
                    <button
                      className="mt-auto w-full border border-dashed border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/40 text-gray-500 hover:text-indigo-600 px-3 py-1.5 text-xs font-medium transition-colors inline-flex items-center justify-center gap-1.5"
                      onClick={() => { setAddingRuleTo(zone._id); setNewRule({ field: "mandal", matchValue: "", priority: 0 }); }}
                    >
                      <Plus className="w-3 h-3" /> Add condition
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Zone Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Zone</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Zone Name *</label>
              <input
                value={newZone.name}
                onChange={(e) => setNewZone((z) => ({ ...z, name: e.target.value }))}
                placeholder="e.g. Northeast, West Coast"
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <Switch checked={newZone.isDefault} onCheckedChange={(v) => setNewZone((z) => ({ ...z, isDefault: v }))} />
              <div>
                <p className="text-sm font-medium text-gray-700">Set as default zone</p>
                <p className="text-xs text-gray-400">People who don't match any rule go here</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                className="border border-gray-200 bg-white rounded-xl hover:bg-gray-50 text-gray-600 px-4 py-2.5 text-sm font-semibold transition-colors"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                disabled={!newZone.name || createZone.isPending}
                onClick={async () => {
                  try {
                    await createZone.mutateAsync(newZone);
                    toast.success(`Zone "${newZone.name}" created`);
                    setNewZone({ name: "", isDefault: false });
                    setShowCreate(false);
                  } catch {
                    toast.error("Failed to create zone");
                  }
                }}
              >
                {createZone.isPending ? "Creating..." : "Create Zone"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Zone Confirmation */}
      <ConfirmDialog
        open={deleteZoneId !== null}
        onOpenChange={(open) => !open && setDeleteZoneId(null)}
        title="Delete Zone"
        description="This zone and all its rules will be permanently deleted. People currently assigned to this zone will be unassigned. This action cannot be undone."
        confirmLabel="Delete Zone"
        onConfirm={() => {
          if (!deleteZoneId) return;
          deleteZone.mutate(deleteZoneId, {
            onSuccess: () => { toast.success("Zone deleted"); setDeleteZoneId(null); },
            onError: () => { toast.error("Failed to delete zone"); setDeleteZoneId(null); },
          });
        }}
        loading={deleteZone.isPending}
      />

      {/* Delete Rule Confirmation */}
      <ConfirmDialog
        open={deleteRuleId !== null}
        onOpenChange={(open) => !open && setDeleteRuleId(null)}
        title="Delete Condition"
        description="This condition will be removed from the zone. Reapply zones afterward to reassign affected people."
        confirmLabel="Delete Condition"
        onConfirm={() => {
          if (!deleteRuleId) return;
          deleteRule.mutate(deleteRuleId, {
            onSuccess: () => { toast.success("Rule deleted"); setDeleteRuleId(null); },
            onError: () => { toast.error("Failed to delete rule"); setDeleteRuleId(null); },
          });
        }}
        loading={deleteRule.isPending}
      />
    </PageContainer>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 text-center py-16 px-6">
      <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
        <MapPin className="w-7 h-7 text-violet-500" />
      </div>
      <p className="text-gray-900 font-semibold text-lg">No zones yet</p>
      <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">Create your first zone to start assigning people automatically based on field rules.</p>
      <button
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
      >
        <Plus className="w-4 h-4" /> Add First Zone
      </button>
    </div>
  );
}

interface RuleFormProps<F extends string> {
  fields: readonly F[];
  value: { field: F; matchValue: string; priority: number };
  onChange: (v: { field: F; matchValue: string; priority: number }) => void;
  pending: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

function RuleForm<F extends string>({ fields, value, onChange, pending, onCancel, onSubmit }: RuleFormProps<F>) {
  return (
    <div className="border border-indigo-100 rounded-xl p-3 space-y-2.5 bg-indigo-50/40">
      <Select value={value.field} onValueChange={(v) => onChange({ ...value, field: v as F, matchValue: "" })}>
        <SelectTrigger className="rounded-lg bg-white"><SelectValue /></SelectTrigger>
        <SelectContent>
          {fields.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
        </SelectContent>
      </Select>
      <input
        placeholder={value.field === "country" ? "us  or  gb+pa+in" : value.field === "gender" ? "Male  or  Female" : "AUSTIN+DALLAS+HOUSTON"}
        value={value.matchValue}
        autoFocus
        onChange={(e) => onChange({ ...value, matchValue: e.target.value })}
        onKeyDown={(e) => { if (e.key === "Enter" && value.matchValue && !pending) onSubmit(); }}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
      />
      <p className="text-[11px] text-gray-400 leading-snug">
        Join values with <span className="font-semibold text-gray-600">+</span> to match any (OR). Each condition you add must also match (AND).
      </p>
      <div className="flex gap-2">
        <button
          className="flex-1 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 text-gray-600 px-3 py-2 text-sm font-semibold transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
          disabled={!value.matchValue || pending}
          onClick={onSubmit}
        >
          {pending ? "Adding..." : "Add condition"}
        </button>
      </div>
    </div>
  );
}
