import { useState } from "react";
import {
  useDynamicAreas, useCreateArea, useDeleteArea,
  useAddAreaRule, useDeleteAreaRule, useReapplyAreaRules,
  type DynamicArea, type DynamicAreaRule,
} from "../hooks/useDynamicAreas";
import { useDynamicZoneNames } from "../hooks/useDynamicZones";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Map, Plus, Trash2, RefreshCw } from "lucide-react";

const AREA_FIELDS = ["gender", "mandal", "ageRange"] as const;

export default function DynamicAreasPage() {
  const { data: areas, isLoading } = useDynamicAreas();
  const { data: zoneNames } = useDynamicZoneNames();
  const createArea = useCreateArea();
  const deleteArea = useDeleteArea();
  const addRule = useAddAreaRule();
  const deleteRule = useDeleteAreaRule();
  const reapply = useReapplyAreaRules();

  const [showCreate, setShowCreate] = useState(false);
  const [newArea, setNewArea] = useState({ name: "", zoneId: "" });
  const [addingRuleTo, setAddingRuleTo] = useState<string | null>(null);
  const [newRule, setNewRule] = useState({ field: "mandal" as typeof AREA_FIELDS[number], matchValue: "", priority: 0 });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Map className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dynamic Areas</h1>
            <p className="text-gray-500 text-sm">Configure areas and field-to-area mapping rules</p>
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
            <Plus className="w-4 h-4" /> Add Area
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
      ) : (areas ?? []).length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Map className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-900 font-semibold text-lg">No areas yet</p>
          <p className="text-gray-500 text-sm mt-1">Create areas to organize people within zones.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(areas ?? []).map((area: DynamicArea) => {
            const zoneName = typeof area.zoneId === "object" ? (area.zoneId as any).name : area.zoneId;
            return (
              <div key={area._id} className="rounded-2xl border border-gray-100 shadow-sm bg-white">
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-900 font-semibold">{area.name}</span>
                    {zoneName && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        {zoneName}
                      </span>
                    )}
                  </div>
                  <button
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    onClick={() => deleteArea.mutate(area._id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
                <div className="px-6 py-4 space-y-3">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Rules</p>
                  {(area.rules ?? []).length === 0 ? (
                    <p className="text-sm text-gray-400">No rules yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {(area.rules ?? []).sort((a, b) => b.priority - a.priority).map((rule: DynamicAreaRule) => (
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

                  {addingRuleTo === area._id ? (
                    <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                      <p className="text-xs font-semibold text-gray-900">Add Rule</p>
                      <div className="flex gap-2">
                        <Select value={newRule.field} onValueChange={(v) => setNewRule((r) => ({ ...r, field: v as any }))}>
                          <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {AREA_FIELDS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <input
                          placeholder="Match value"
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
                            await addRule.mutateAsync({ areaId: area._id, data: newRule });
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
                      onClick={() => setAddingRuleTo(area._id)}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Rule
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Area</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Area Name *</label>
              <input
                value={newArea.name}
                onChange={(e) => setNewArea((a) => ({ ...a, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Zone (optional)</label>
              <Select value={newArea.zoneId} onValueChange={(v) => setNewArea((a) => ({ ...a, zoneId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
                <SelectContent>
                  {(zoneNames ?? []).map((z: string) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                </SelectContent>
              </Select>
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
                disabled={!newArea.name || createArea.isPending}
                onClick={async () => {
                  await createArea.mutateAsync({ name: newArea.name, zoneId: newArea.zoneId || undefined });
                  setNewArea({ name: "", zoneId: "" });
                  setShowCreate(false);
                }}
              >
                Create Area
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
