import { useMemo, useState } from "react";
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
import { PageContainer, PageHeader } from "../components/ui/page";
import { Map, Plus, Trash2, RefreshCw, Search, X } from "lucide-react";

const AREA_FIELDS = ["gender", "mandal", "ageRange"] as const;

const zoneNameOf = (area: DynamicArea) =>
  typeof area.zoneId === "object" && area.zoneId ? (area.zoneId as any).name : (area.zoneId as string | undefined);

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
  const [search, setSearch] = useState("");

  const allAreas: DynamicArea[] = areas ?? [];
  const totalRules = allAreas.reduce((sum, a) => sum + (a.rules ?? []).length, 0);
  const zonesCovered = new Set(allAreas.map(zoneNameOf).filter(Boolean)).size;

  const visibleAreas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allAreas;
    return allAreas.filter((a) =>
      a.name.toLowerCase().includes(q) || (zoneNameOf(a) ?? "").toLowerCase().includes(q)
    );
  }, [allAreas, search]);

  return (
    <PageContainer width="wide">
      <PageHeader
        icon={<Map className="w-5 h-5" />}
        tone="emerald"
        title="Areas"
        subtitle="Organize people into areas within zones using field rules"
        actions={
          <>
            <div className="relative flex-1 sm:flex-initial min-w-[160px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search areas or zones…"
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
                onSuccess: () => toast.success("Area rules reapplied — people reassigned"),
                onError: () => toast.error("Failed to reapply area rules"),
              })}
            >
              <RefreshCw className={`w-4 h-4 ${reapply.isPending ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Reapply</span>
            </button>
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-3 sm:px-4 py-2.5 text-sm font-semibold transition-colors inline-flex items-center gap-1.5"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="w-4 h-4" /> Add Area
            </button>
          </>
        }
      />

      {/* Summary bar */}
      {!isLoading && allAreas.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-500 border-y border-gray-100 py-2.5">
          <span><span className="font-semibold text-gray-900">{allAreas.length}</span> area{allAreas.length !== 1 && "s"}</span>
          <span className="text-gray-300">•</span>
          <span><span className="font-semibold text-gray-900">{totalRules}</span> rule{totalRules !== 1 && "s"}</span>
          <span className="text-gray-300">•</span>
          <span>across <span className="font-semibold text-gray-900">{zonesCovered}</span> zone{zonesCovered !== 1 && "s"}</span>
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
      ) : allAreas.length === 0 ? (
        <EmptyState onAdd={() => setShowCreate(true)} />
      ) : visibleAreas.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <Search className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-700">No areas match “{search}”</p>
          <button onClick={() => setSearch("")} className="mt-2 text-sm text-indigo-600 hover:underline">Clear search</button>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start">
          {visibleAreas.map((area) => {
            const zoneName = zoneNameOf(area);
            const rules = [...(area.rules ?? [])].sort((a, b) => b.priority - a.priority);
            return (
              <div key={area._id} className="rounded-xl border border-gray-100 shadow-sm bg-white flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                {/* Card header */}
                <div className="px-3 py-2.5 flex items-start justify-between gap-2 border-b border-gray-100 bg-gradient-to-br from-emerald-50/60 to-transparent">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Map className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-gray-900 font-semibold truncate">{area.name}</span>
                        {zoneName && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 flex-shrink-0">{zoneName}</span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400">{rules.length} rule{rules.length !== 1 && "s"}</span>
                    </div>
                  </div>
                  <button
                    className="p-1 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                    title="Delete area"
                    onClick={() => setDeleteAreaId(area._id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                  </button>
                </div>

                {/* Rules */}
                <div className="px-3 py-2.5 flex flex-col gap-2 flex-1">
                  {rules.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-0.5">No rules yet.</p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {rules.map((rule: DynamicAreaRule) => (
                        <div key={rule._id} className="group flex items-center gap-1.5 text-xs bg-gray-50 rounded-lg px-2 py-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">{rule.field}</span>
                          <span className="text-gray-400">=</span>
                          <span className="font-medium text-gray-900 truncate flex-1">{rule.matchValue}</span>
                          <span className="px-1 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700">P{rule.priority}</span>
                          <button
                            className="p-0.5 rounded hover:bg-red-50 transition-colors opacity-60 group-hover:opacity-100"
                            onClick={() => setDeleteRuleId(rule._id)}
                          >
                            <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {addingRuleTo === area._id ? (
                    <RuleForm
                      fields={AREA_FIELDS}
                      value={newRule}
                      onChange={setNewRule}
                      pending={addRule.isPending}
                      onCancel={() => setAddingRuleTo(null)}
                      onSubmit={async () => {
                        try {
                          await addRule.mutateAsync({ areaId: area._id, data: newRule });
                          toast.success("Rule added");
                          setAddingRuleTo(null);
                          setNewRule({ field: "mandal", matchValue: "", priority: 0 });
                        } catch {
                          toast.error("Failed to add rule");
                        }
                      }}
                    />
                  ) : (
                    <button
                      className="mt-auto w-full border border-dashed border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/40 text-gray-500 hover:text-indigo-600 px-3 py-1.5 text-xs font-medium transition-colors inline-flex items-center justify-center gap-1.5"
                      onClick={() => { setAddingRuleTo(area._id); setNewRule({ field: "mandal", matchValue: "", priority: 0 }); }}
                    >
                      <Plus className="w-3 h-3" /> Add Rule
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
                autoFocus
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
    </PageContainer>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 text-center py-16 px-6">
      <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
        <Map className="w-7 h-7 text-emerald-500" />
      </div>
      <p className="text-gray-900 font-semibold text-lg">No areas yet</p>
      <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">Create areas to organize people within zones based on field rules.</p>
      <button
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
      >
        <Plus className="w-4 h-4" /> Add First Area
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
      <div className="grid grid-cols-2 gap-2">
        <Select value={value.field} onValueChange={(v) => onChange({ ...value, field: v as F })}>
          <SelectTrigger className="rounded-lg bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            {fields.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
        <input
          type="number"
          placeholder="Priority"
          value={value.priority}
          onChange={(e) => onChange({ ...value, priority: parseInt(e.target.value, 10) || 0 })}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
        />
      </div>
      <input
        placeholder="Match value"
        value={value.matchValue}
        autoFocus
        onChange={(e) => onChange({ ...value, matchValue: e.target.value })}
        onKeyDown={(e) => { if (e.key === "Enter" && value.matchValue && !pending) onSubmit(); }}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
      />
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
          {pending ? "Adding..." : "Add Rule"}
        </button>
      </div>
    </div>
  );
}
