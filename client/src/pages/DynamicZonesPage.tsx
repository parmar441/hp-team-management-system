import { useState } from "react";
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
import { MapPin, Plus, Trash2, RefreshCw } from "lucide-react";

const ZONE_FIELDS = ["gender", "mandal", "country", "ageRange"] as const;

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

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dynamic Zones</h1>
            <p className="text-gray-500 text-sm">Configure zones and field-to-zone mapping rules</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="border border-gray-200 bg-white rounded-xl hover:bg-gray-50 text-gray-600 px-4 py-2.5 text-sm font-semibold transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
            disabled={reapply.isPending}
            onClick={() => reapply.mutate(undefined, {
              onSuccess: () => toast.success("Zone rules reapplied — people reassigned"),
              onError: () => toast.error("Failed to reapply zone rules"),
            })}
          >
            <RefreshCw className={`w-4 h-4 ${reapply.isPending ? "animate-spin" : ""}`} />
            Reapply Rules
          </button>
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors inline-flex items-center gap-1.5"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="w-4 h-4" /> Add Zone
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-100 shadow-sm bg-white p-6">
              <div className="bg-gray-100 rounded-lg animate-pulse h-32 w-full" />
            </div>
          ))}
        </div>
      ) : (zones ?? []).length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-900 font-semibold text-lg">No zones yet</p>
          <p className="text-gray-500 text-sm mt-1">Create your first zone to start assigning people automatically.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Add First Zone
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {(zones ?? []).map((zone: DynamicZone) => (
            <div key={zone._id} className="rounded-2xl border border-gray-100 shadow-sm bg-white">
              <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-violet-600" />
                  </div>
                  <span className="text-gray-900 font-semibold">{zone.name}</span>
                  {zone.isDefault && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                      Default
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{(zone.rules ?? []).length} rules</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 text-xs">Default zone</span>
                    <Switch
                      checked={zone.isDefault}
                      onCheckedChange={(checked) => updateZone.mutate(
                        { id: zone._id, data: { isDefault: checked } },
                        { onSuccess: () => toast.info(`${zone.name} ${checked ? "set as" : "removed from"} default`), }
                      )}
                    />
                  </div>
                  <button
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    onClick={() => setDeleteZoneId(zone._id)}
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Rules — higher priority wins</p>
                {(zone.rules ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No rules yet — all people match this zone if it's the default.</p>
                ) : (
                  <div className="space-y-2">
                    {[...(zone.rules ?? [])].sort((a, b) => b.priority - a.priority).map((rule: DynamicZoneRule) => (
                      <div key={rule._id} className="flex items-center gap-3 text-sm bg-gray-50 rounded-xl px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700">{rule.field}</span>
                        <span className="text-gray-400">=</span>
                        <span className="font-medium text-gray-900">{rule.matchValue}</span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">P{rule.priority}</span>
                        <button
                          className="ml-auto p-1 rounded-lg hover:bg-red-50 transition-colors"
                          onClick={() => setDeleteRuleId(rule._id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {addingRuleTo === zone._id ? (
                  <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/80">
                    <p className="text-xs font-semibold text-gray-900">Add Rule to {zone.name}</p>
                    <div className="flex flex-wrap gap-2">
                      <Select value={newRule.field} onValueChange={(v) => setNewRule((r) => ({ ...r, field: v as any }))}>
                        <SelectTrigger className="flex-1 min-w-[120px] rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ZONE_FIELDS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <input
                        placeholder="Match value (e.g. NJ)"
                        value={newRule.matchValue}
                        onChange={(e) => setNewRule((r) => ({ ...r, matchValue: e.target.value }))}
                        className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
                      />
                      <input
                        type="number"
                        placeholder="Priority"
                        value={newRule.priority}
                        onChange={(e) => setNewRule((r) => ({ ...r, priority: parseInt(e.target.value, 10) || 0 }))}
                        className="w-24 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="border border-gray-200 bg-white rounded-xl hover:bg-gray-50 text-gray-600 px-4 py-2 text-sm font-semibold transition-colors"
                        onClick={() => setAddingRuleTo(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
                        disabled={!newRule.matchValue || addRule.isPending}
                        onClick={async () => {
                          try {
                            await addRule.mutateAsync({ zoneId: zone._id, data: newRule });
                            toast.success("Rule added");
                            setAddingRuleTo(null);
                            setNewRule({ field: "mandal", matchValue: "", priority: 0 });
                          } catch {
                            toast.error("Failed to add rule");
                          }
                        }}
                      >
                        {addRule.isPending ? "Adding..." : "Add Rule"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="border border-gray-200 bg-white rounded-xl hover:bg-gray-50 text-gray-600 px-4 py-2 text-sm font-semibold transition-colors inline-flex items-center gap-1.5"
                    onClick={() => setAddingRuleTo(zone._id)}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Rule
                  </button>
                )}
              </div>
            </div>
          ))}
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
        title="Delete Rule"
        description="This mapping rule will be removed. People who matched via this rule will need to be reassigned by reapplying rules."
        confirmLabel="Delete Rule"
        onConfirm={() => {
          if (!deleteRuleId) return;
          deleteRule.mutate(deleteRuleId, {
            onSuccess: () => { toast.success("Rule deleted"); setDeleteRuleId(null); },
            onError: () => { toast.error("Failed to delete rule"); setDeleteRuleId(null); },
          });
        }}
        loading={deleteRule.isPending}
      />
    </div>
  );
}
