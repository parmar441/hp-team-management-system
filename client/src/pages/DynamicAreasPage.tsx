import { useState } from "react";
import {
  useDynamicAreas, useCreateArea, useDeleteArea,
  useAddAreaRule, useDeleteAreaRule, useReapplyAreaRules,
  type DynamicArea, type DynamicAreaRule,
} from "../hooks/useDynamicAreas";
import { useDynamicZoneNames } from "../hooks/useDynamicZones";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import { useToast } from "../components/ui/toaster";
import { Map, Plus, Trash2, RefreshCw } from "lucide-react";

const AREA_FIELDS = ["gender", "mandal", "ageRange"] as const;

export default function DynamicAreasPage() {
  const toast = useToast();
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
  const [deleteAreaId, setDeleteAreaId] = useState<string | null>(null);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Map className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dynamic Areas</h1>
            <p className="text-gray-500 text-sm">Configure areas and field-to-area mapping rules within zones</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            className="border border-gray-200 bg-white rounded-xl hover:bg-gray-50 text-gray-600 px-3 sm:px-4 py-2.5 text-sm font-semibold transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
            disabled={reapply.isPending}
            onClick={() => reapply.mutate(undefined, {
              onSuccess: () => toast.success("Area rules reapplied — people reassigned"),
              onError: () => toast.error("Failed to reapply area rules"),
            })}
          >
            <RefreshCw className={`w-4 h-4 ${reapply.isPending ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Reapply Rules</span>
            <span className="sm:hidden">Reapply</span>
          </button>
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-3 sm:px-4 py-2.5 text-sm font-semibold transition-colors inline-flex items-center gap-1.5"
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
          <button
            onClick={() => setShowCreate(true)}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Add First Area
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {(areas ?? []).map((area: DynamicArea) => {
            const zoneName = typeof area.zoneId === "object" ? (area.zoneId as any).name : area.zoneId;
            return (
              <div key={area._id} className="rounded-2xl border border-gray-100 shadow-sm bg-white">
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Map className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-gray-900 font-semibold">{area.name}</span>
                    {zoneName && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">{zoneName}</span>
                    )}
                    <span className="text-xs text-gray-400">{(area.rules ?? []).length} rules</span>
                  </div>
                  <button
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    onClick={() => setDeleteAreaId(area._id)}
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>

                <div className="px-6 py-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Rules</p>
                  {(area.rules ?? []).length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No rules yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {[...(area.rules ?? [])].sort((a, b) => b.priority - a.priority).map((rule: DynamicAreaRule) => (
                        <div key={rule._id} className="flex items-center gap-3 text-sm bg-gray-50 rounded-xl px-4 py-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">{rule.field}</span>
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

                  {addingRuleTo === area._id ? (
                    <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/80">
                      <p className="text-xs font-semibold text-gray-900">Add Rule to {area.name}</p>
                      <div className="flex flex-wrap gap-2">
                        <Select value={newRule.field} onValueChange={(v) => setNewRule((r) => ({ ...r, field: v as any }))}>
                          <SelectTrigger className="flex-1 min-w-[120px] rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {AREA_FIELDS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <input
                          placeholder="Match value"
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
                              await addRule.mutateAsync({ areaId: area._id, data: newRule });
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

      {/* Create Area Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Area</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Area Name *</label>
              <input
                value={newArea.name}
                onChange={(e) => setNewArea((a) => ({ ...a, name: e.target.value }))}
                placeholder="e.g. North Jersey, Silicon Valley"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Zone (optional)</label>
              <Select value={newArea.zoneId} onValueChange={(v) => setNewArea((a) => ({ ...a, zoneId: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select zone" /></SelectTrigger>
                <SelectContent>
                  {(zoneNames ?? []).map((z: string) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                </SelectContent>
              </Select>
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
                disabled={!newArea.name || createArea.isPending}
                onClick={async () => {
                  try {
                    await createArea.mutateAsync({ name: newArea.name, zoneId: newArea.zoneId || undefined });
                    toast.success(`Area "${newArea.name}" created`);
                    setNewArea({ name: "", zoneId: "" });
                    setShowCreate(false);
                  } catch {
                    toast.error("Failed to create area");
                  }
                }}
              >
                {createArea.isPending ? "Creating..." : "Create Area"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteAreaId !== null}
        onOpenChange={(open) => !open && setDeleteAreaId(null)}
        title="Delete Area"
        description="This area and all its rules will be permanently deleted. People assigned to this area will be unassigned."
        confirmLabel="Delete Area"
        onConfirm={() => {
          if (!deleteAreaId) return;
          deleteArea.mutate(deleteAreaId, {
            onSuccess: () => { toast.success("Area deleted"); setDeleteAreaId(null); },
            onError: () => { toast.error("Failed to delete area"); setDeleteAreaId(null); },
          });
        }}
        loading={deleteArea.isPending}
      />

      <ConfirmDialog
        open={deleteRuleId !== null}
        onOpenChange={(open) => !open && setDeleteRuleId(null)}
        title="Delete Rule"
        description="This mapping rule will be removed."
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
