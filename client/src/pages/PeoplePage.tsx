import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  UserPlus,
  Trash2,
  Edit,
  Upload,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Crown,
} from "lucide-react";
import { cn, downloadCSV, parseCSVRow } from "@/lib/utils";

const ZONES = ["North", "South", "East", "West", "Central"] as const;
const GENDERS = ["M", "F"] as const;
const AGE_GROUPS = ["Child", "Teen", "Adult", "Senior"] as const;

const ZONE_AREAS: Record<string, string[]> = {
  North: ["Delhi", "Chandigarh", "Lucknow", "Jaipur", "Amritsar"],
  South: ["Chennai", "Bangalore", "Hyderabad", "Kochi", "Coimbatore"],
  East: ["Kolkata", "Bhubaneswar", "Patna", "Ranchi", "Guwahati"],
  West: ["Mumbai", "Pune", "Ahmedabad", "Surat", "Nagpur"],
  Central: ["Indore", "Bhopal", "Raipur", "Jabalpur", "Gwalior"],
};

const ZONE_COLORS: Record<string, string> = {
  North: "blue",
  South: "emerald",
  East: "amber",
  West: "purple",
  Central: "rose",
};

type PersonForm = {
  name: string;
  gender: "M" | "F";
  ageGroup: "Child" | "Teen" | "Adult" | "Senior";
  zone: typeof ZONES[number];
  stay: boolean;
  area: string;
  location: string;
  country: string;
  category: string;
  note: string;
};

const emptyForm: PersonForm = {
  name: "",
  gender: "M",
  ageGroup: "Adult",
  zone: "North",
  stay: false,
  area: "",
  location: "",
  country: "",
  category: "",
  note: "",
};

function PersonFormDialog({
  open,
  onClose,
  initial,
  personId,
  isEdit,
  userRole,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Partial<PersonForm>;
  personId?: number;
  isEdit?: boolean;
  userRole: string;
}) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState<PersonForm>({ ...emptyForm, ...initial });
  const [errors, setErrors] = useState<Partial<PersonForm>>({});

  const createMutation = trpc.people.create.useMutation({
    onSuccess: () => {
      utils.people.list.invalidate();
      toast.success("Person added successfully");
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.people.update.useMutation({
    onSuccess: () => {
      utils.people.list.invalidate();
      toast.success("Person updated");
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const validate = () => {
    const errs: Partial<PersonForm> = {};
    if (!form.name.trim()) errs.name = "Name is required" as any;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const data = {
      name: form.name.trim(),
      gender: form.gender,
      ageGroup: form.ageGroup,
      zone: form.zone,
      stay: form.stay,
      area: form.area || null,
      location: form.location || null,
      country: form.country || null,
      category: form.category || null,
      note: form.note || null,
    };

    if (isEdit && personId) {
      const allowed = userRole === "admin"
        ? data
        : userRole === "zone_lead"
        ? { area: data.area, category: data.category, note: data.note }
        : { category: data.category, note: data.note };
      updateMutation.mutate({ id: personId, data: allowed as any });
    } else {
      createMutation.mutate(data as any);
    }
  };

  const canEdit = (field: string) => {
    if (userRole === "admin") return true;
    if (userRole === "zone_lead") return ["area", "category", "note"].includes(field);
    if (userRole === "area_lead") return ["category", "note"].includes(field);
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Person" : "Add New Person"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <Label>Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={isEdit && !canEdit("name")}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-xs text-destructive">{String(errors.name)}</p>}
          </div>

          <div className="space-y-2">
            <Label>Gender *</Label>
            <Select
              value={form.gender}
              onValueChange={(v) => setForm({ ...form, gender: v as any })}
              disabled={isEdit && !canEdit("gender")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Male (M)</SelectItem>
                <SelectItem value="F">Female (F)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Age Group *</Label>
            <Select
              value={form.ageGroup}
              onValueChange={(v) => setForm({ ...form, ageGroup: v as any })}
              disabled={isEdit && !canEdit("ageGroup")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGE_GROUPS.map((ag) => (
                  <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Zone *</Label>
            <Select
              value={form.zone}
              onValueChange={(v) => setForm({ ...form, zone: v as any, area: "" })}
              disabled={isEdit && !canEdit("zone")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ZONES.map((z) => (
                  <SelectItem key={z} value={z}>{z}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Area</Label>
            <Select
              value={form.area || "__none__"}
              onValueChange={(v) => setForm({ ...form, area: v === "__none__" ? "" : v })}
              disabled={isEdit && !canEdit("area")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— None —</SelectItem>
                {(ZONE_AREAS[form.zone] ?? []).map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              disabled={isEdit && !canEdit("location")}
            />
          </div>

          <div className="space-y-2">
            <Label>Country</Label>
            <Input
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              disabled={isEdit && !canEdit("country")}
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              disabled={isEdit && !canEdit("category")}
            />
          </div>

          <div className="space-y-2 col-span-2">
            <Label>Note</Label>
            <Textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              disabled={isEdit && !canEdit("note")}
              rows={2}
            />
          </div>

          {!isEdit && (
            <div className="flex items-center gap-2">
              <Switch
                checked={form.stay}
                onCheckedChange={(v) => setForm({ ...form, stay: v })}
              />
              <Label>ACO (Stay)</Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {isEdit ? "Save Changes" : "Add Person"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PeoplePage() {
  const { user } = useAuth();
  const role = user?.role ?? "user";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterZone, setFilterZone] = useState<string>("");
  const [filterGender, setFilterGender] = useState<string>("");
  const [filterAge, setFilterAge] = useState<string>("");
  const [filterStay, setFilterStay] = useState<string>("");
  const [filterArea, setFilterArea] = useState<string>("");

  const [selected, setSelected] = useState<number[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editPerson, setEditPerson] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkStayOpen, setBulkStayOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.people.list.useQuery({
    page,
    pageSize: 50,
    search: search || undefined,
    zones: filterZone ? [filterZone] : undefined,
    gender: filterGender || undefined,
    ageGroup: filterAge || undefined,
    stay: filterStay === "yes" ? true : filterStay === "no" ? false : undefined,
    areas: filterArea ? [filterArea] : undefined,
  });

  const toggleStayMutation = trpc.people.toggleStay.useMutation({
    onMutate: async ({ id }) => {
      await utils.people.list.cancel();
      const prev = utils.people.list.getData({
        page, pageSize: 50,
        search: search || undefined,
        zones: filterZone ? [filterZone] : undefined,
        gender: filterGender || undefined,
        ageGroup: filterAge || undefined,
        stay: filterStay === "yes" ? true : filterStay === "no" ? false : undefined,
      });
      utils.people.list.setData(
        {
          page, pageSize: 50,
          search: search || undefined,
          zones: filterZone ? [filterZone] : undefined,
        },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((p) =>
              p.id === id ? { ...p, stay: !p.stay } : p
            ),
          };
        }
      );
      return { prev };
    },
    onError: (err, _, ctx) => {
      if (ctx?.prev) utils.people.list.setData({ page, pageSize: 50 }, ctx.prev as any);
      toast.error(err.message);
    },
    onSettled: () => utils.people.list.invalidate(),
  });

  const deleteMutation = trpc.people.delete.useMutation({
    onSuccess: () => {
      utils.people.list.invalidate();
      toast.success("Person deleted");
      setDeleteId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const bulkDeleteMutation = trpc.people.bulkDelete.useMutation({
    onSuccess: () => {
      utils.people.list.invalidate();
      toast.success(`${selected.length} people deleted`);
      setSelected([]);
      setBulkDeleteOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const bulkCreateMutation = trpc.people.bulkCreate.useMutation({
    onSuccess: (data) => {
      utils.people.list.invalidate();
      toast.success(`Imported people successfully`);
    },
    onError: (err) => toast.error(err.message),
  });

  const bulkToggleMutation = trpc.people.bulkToggleStay.useMutation({
    onSuccess: (_, vars) => {
      utils.people.list.invalidate();
      toast.success(`Updated ${selected.length} people`);
      setSelected([]);
      setBulkStayOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const setTeamLeadMutation = trpc.people.setTeamLead.useMutation({
    onSuccess: () => {
      utils.people.list.invalidate();
      toast.success("Team lead status updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const someSelected = selected.length > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected((s) => s.filter((id) => !rows.some((r) => r.id === id)));
    } else {
      setSelected((s) => [...new Set([...s, ...rows.map((r) => r.id)])]);
    }
  };

  const toggleOne = (id: number) => {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Gender", "Age Group", "Zone", "Stay", "Area", "Location", "Country", "Category", "Note"];
    const csvRows = rows.map((p) => [
      p.name, p.gender, p.ageGroup, p.zone,
      p.stay ? "Yes" : "No",
      p.area ?? "", p.location ?? "", p.country ?? "",
      p.category ?? "", p.note ?? "",
    ].map((v) => `"${v}"`).join(","));
    downloadCSV([headers.join(","), ...csvRows].join("\n"), "people.csv");
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      toast.error("CSV must have a header row and at least one data row");
      return;
    }

    const errors: string[] = [];
    const valid: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVRow(lines[i]);
      if (cols.length < 4) { errors.push(`Row ${i}: too few columns`); continue; }
      const [name, gender, ageGroup, zone, stay, area, location, country, category, note] = cols;
      if (!name) { errors.push(`Row ${i}: name is required`); continue; }
      if (!["M", "F"].includes(gender)) { errors.push(`Row ${i}: invalid gender "${gender}"`); continue; }
      if (!["Child", "Teen", "Adult", "Senior"].includes(ageGroup)) { errors.push(`Row ${i}: invalid age group`); continue; }
      if (!["North", "South", "East", "West", "Central"].includes(zone)) { errors.push(`Row ${i}: invalid zone`); continue; }
      valid.push({
        name, gender, ageGroup, zone,
        stay: ["yes", "true", "1"].includes((stay ?? "").toLowerCase()),
        area: area || null, location: location || null, country: country || null,
        category: category || null, note: note || null,
      });
    }

    if (errors.length > 0) {
      toast.error(`${errors.length} rows had errors. ${valid.length} valid rows found.`);
    }

    if (valid.length > 0) {
      bulkCreateMutation.mutate({ people: valid });
      toast.success(`Importing ${valid.length} people...`);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const availableAreas = filterZone ? ZONE_AREAS[filterZone] ?? [] : [];

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">People</h1>
          <p className="text-muted-foreground text-sm">{total.toLocaleString()} total</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {role === "admin" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImportCSV}
              />
            </>
          )}
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          {role === "admin" && (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Add Person
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 w-48"
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {role === "admin" && (
          <Select value={filterZone || "__all__"} onValueChange={(v) => { setFilterZone(v === "__all__" ? "" : v); setFilterArea(""); setPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Zones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Zones</SelectItem>
              {ZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {(role === "admin" || role === "zone_lead") && availableAreas.length > 0 && (
          <Select value={filterArea || "__all__"} onValueChange={(v) => { setFilterArea(v === "__all__" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Areas</SelectItem>
              {availableAreas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        <Select value={filterGender || "__all__"} onValueChange={(v) => { setFilterGender(v === "__all__" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            <SelectItem value="M">Male</SelectItem>
            <SelectItem value="F">Female</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterAge || "__all__"} onValueChange={(v) => { setFilterAge(v === "__all__" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Age Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Ages</SelectItem>
            {AGE_GROUPS.map((ag) => <SelectItem key={ag} value={ag}>{ag}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterStay || "__all__"} onValueChange={(v) => { setFilterStay(v === "__all__" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Stay" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            <SelectItem value="yes">ACO Yes</SelectItem>
            <SelectItem value="no">ACO No</SelectItem>
          </SelectContent>
        </Select>

        {(filterZone || filterGender || filterAge || filterStay || filterArea || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterZone(""); setFilterGender(""); setFilterAge("");
              setFilterStay(""); setFilterArea(""); setSearch(""); setPage(1);
            }}
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Bulk Actions */}
      {someSelected && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <span className="text-sm font-medium">{selected.length} selected</span>
          <Button size="sm" variant="outline" onClick={() => setBulkStayOpen(true)}>
            Toggle ACO
          </Button>
          {role === "admin" && (
            <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="p-3 text-left font-semibold">Name</th>
                <th className="p-3 text-left font-semibold">Gender</th>
                <th className="p-3 text-left font-semibold">Age</th>
                <th className="p-3 text-left font-semibold">Zone</th>
                <th className="p-3 text-left font-semibold">Area</th>
                <th className="p-3 text-left font-semibold">Country</th>
                <th className="p-3 text-left font-semibold">Category</th>
                <th className="p-3 text-left font-semibold">ACO</th>
                <th className="p-3 text-left font-semibold">Note</th>
                <th className="p-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [...Array(10)].map((_, i) => (
                    <tr key={i} className="border-t border-border">
                      {[...Array(11)].map((_, j) => (
                        <td key={j} className="p-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map((person) => (
                    <tr
                      key={person.id}
                      className="border-t border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-3">
                        <Checkbox
                          checked={selected.includes(person.id)}
                          onCheckedChange={() => toggleOne(person.id)}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          {person.isTeamLead && (
                            <span title="Team Lead"><Crown className="h-3.5 w-3.5 text-amber-500" /></span>
                          )}
                          <span className="font-medium">{person.name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={person.gender === "M" ? "blue" : "pink"} className="text-xs">
                          {person.gender}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            person.ageGroup === "Child" ? "teal"
                            : person.ageGroup === "Teen" ? "secondary"
                            : person.ageGroup === "Senior" ? "orange"
                            : "slate"
                          }
                          className="text-xs"
                        >
                          {person.ageGroup}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={ZONE_COLORS[person.zone] as any || "outline"}
                          className="text-xs"
                        >
                          {person.zone}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{person.area ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">{person.country ?? "—"}</td>
                      <td className="p-3">
                        {person.category && (
                          <Badge variant="purple" className="text-xs">
                            {person.category}
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <Switch
                          checked={person.stay}
                          onCheckedChange={() => toggleStayMutation.mutate({ id: person.id })}
                          className="scale-90"
                        />
                      </td>
                      <td className="p-3 max-w-[150px] truncate text-muted-foreground text-xs">
                        {person.note ?? "—"}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          {role === "admin" && (
                            <button
                              onClick={() => setTeamLeadMutation.mutate({ id: person.id })}
                              className={cn(
                                "p-1.5 rounded hover:bg-amber-100 transition-colors",
                                person.isTeamLead ? "text-amber-500" : "text-muted-foreground"
                              )}
                              title="Toggle team lead"
                            >
                              <Crown className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setEditPerson(person)}
                            className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          {role === "admin" && (
                            <button
                              onClick={() => setDeleteId(person.id)}
                              className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-3 border-t border-border bg-muted/30">
          <span className="text-sm text-muted-foreground">
            Showing {((page - 1) * 50) + 1}–{Math.min(page * 50, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      {addOpen && (
        <PersonFormDialog
          open={addOpen}
          onClose={() => setAddOpen(false)}
          userRole={role}
        />
      )}
      {editPerson && (
        <PersonFormDialog
          open={!!editPerson}
          onClose={() => setEditPerson(null)}
          initial={{
            name: editPerson.name,
            gender: editPerson.gender,
            ageGroup: editPerson.ageGroup,
            zone: editPerson.zone,
            stay: editPerson.stay,
            area: editPerson.area ?? "",
            location: editPerson.location ?? "",
            country: editPerson.country ?? "",
            category: editPerson.category ?? "",
            note: editPerson.note ?? "",
          }}
          personId={editPerson.id}
          isEdit
          userRole={role}
        />
      )}

      {/* Delete Confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Person</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this person. They will be removed from any teams.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirm */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.length} People</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selected.length} selected people. They will be removed from any teams.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => bulkDeleteMutation.mutate({ ids: selected })}
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Toggle Stay */}
      <AlertDialog open={bulkStayOpen} onOpenChange={setBulkStayOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Toggle ACO for {selected.length} People</AlertDialogTitle>
            <AlertDialogDescription>
              Set ACO status for all selected people.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => bulkToggleMutation.mutate({ ids: selected, stay: false })}>
              Set ACO = No
            </AlertDialogAction>
            <AlertDialogAction onClick={() => bulkToggleMutation.mutate({ ids: selected, stay: true })}>
              Set ACO = Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
