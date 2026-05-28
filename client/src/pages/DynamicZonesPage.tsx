import { useState } from "react";
import {
  useDynamicZones, useCreateZone, useUpdateZone, useDeleteZone,
  useAddZoneRule, useDeleteZoneRule, useReapplyZoneRules,
  type DynamicZone, type DynamicZoneRule,
} from "../hooks/useDynamicZones";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { MapPin, Plus, Trash2, RefreshCw } from "lucide-react";

const ZONE_FIELDS = ["gender", "mandal", "country", "ageRange"] as const;

export default function DynamicZonesPage() {
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
            onClick={() => reapply.mutate()}
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

      {reapply.isSuccess && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-2.5 rounded-xl">
          Rules reapplied successfully!
        </div>
      )}

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
          <p className="text-gray-500 text-sm mt-1">Create your first zone to start assigning people.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(zones ?? []).map((zone: DynamicZone) => (
            <div key={zone._id} className="rounded-2xl border border-gray-100 shadow-sm bg-white">
              <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-gray-900 font-semibold">{zone.name}</span>
                  {zone.isDefault && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Default zone:</span>
                    <Switch
                      checked={zone.isDefault}
                      onCheckedChange={(checked) => updateZone.mutate({ id: zone._id, data: { isDefault: checked } })}
                    />
                  </div>
                  <button
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    onClick={() => deleteZone.mutate(zone._id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              <div className="px-6 py-4 space-y-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Rules (higher priority wins)</p>
                {(zone.rules ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400">No rules yet.</p>
                ) : (
                  <div className="space-y-2">
                    {(zone.rules ?? []).sort((a, b) => b.priority - a.priority).map((rule: DynamicZoneRule) => (
                      <div key={rule._id} className="flex items-center gap-3 text-sm bg-gray-50 rounded-xl px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">{rule.field}</span>
                        <span className="text-gray-400">=</span>
                        <span className="font-medium text-gray-900">{rule.matchValue}</span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">P{rule.priority}</span>
                        <button
                          className="ml-auto p-1 rounded-lg hover:bg-red-50 transition-colors"
                          onClick={() => deleteRule.mutate(rule._id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {addingRuleTo === zone._id ? (
                  <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-900">Add Rule</p>
                    <div className="flex gap-2">
                      <Select value={newRule.field} onValueChange={(v) => setNewRule((r) => ({ ...r, field: v as any }))}>
                        <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ZONE_FIELDS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <input
                        placeholder="Match value (e.g. NJ)"
                        value={newRule.matchValue}
                        onChange={(e) => setNewRule((r) => ({ ...r, matchValue: e.target.value }))}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
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
                        className="border border-gray-200 bg-white rounded-xl hover:bg-gray-50 text-gray-600 px-4 py-2.5 text-sm font-semibold transition-colors"
                        onClick={() => setAddingRuleTo(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                        disabled={!newRule.matchValue || addRule.isPending}
                        onClick={async () => {
                          await addRule.mutateAsync({ zoneId: zone._id, data: newRule });
                          setAddingRuleTo(null);
                          setNewRule({ field: "mandal", matchValue: "", priority: 0 });
                        }}
                      >
                        Add Rule
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="border border-gray-200 bg-white rounded-xl hover:bg-gray-50 text-gray-600 px-4 py-2.5 text-sm font-semibold transition-colors inline-flex items-center gap-1.5"
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

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Zone</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Zone Name *</label>
              <input
                value={newZone.name}
                onChange={(e) => setNewZone((z) => ({ ...z, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={newZone.isDefault} onCheckedChange={(v) => setNewZone((z) => ({ ...z, isDefault: v }))} />
              <label className="text-sm text-gray-600">Set as default zone (catches unmatched people)</label>
            </div>
            <div className="flex gap-2 justify-end">
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
                  await createZone.mutateAsync(newZone);
                  setNewZone({ name: "", isDefault: false });
                  setShowCreate(false);
                }}
              >
                Create Zone
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
