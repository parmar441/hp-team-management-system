import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { useDynamicZoneNames } from "../../hooks/useDynamicZones";
import { useDynamicAreas } from "../../hooks/useDynamicAreas";

export type PFilters = {
  zone: string; area: string; gender: string; country: string; aco: string; checkedIn: string;
};
export const EMPTY_PFILTERS: PFilters = { zone: "", area: "", gender: "", country: "", aco: "", checkedIn: "" };

function FilterSelect({ value, placeholder, options, onChange, width = "w-36" }: {
  value: string; placeholder: string; options: { value: string; label: string }[]; onChange: (v: string) => void; width?: string;
}) {
  return (
    <Select value={value || "all"} onValueChange={(v) => onChange(v === "all" ? "" : v)}>
      <SelectTrigger className={`${width} rounded-xl border-gray-200 text-sm`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

/**
 * Shared desktop filter bar mirroring the mobile People filters:
 * Zone, Area, Gender, Country, ACO, Check-in. Hide any with `hide`.
 */
export function PeopleFilterBar({ value, onChange, hide = [] }: {
  value: PFilters; onChange: (v: PFilters) => void; hide?: (keyof PFilters)[];
}) {
  const { data: zoneNames } = useDynamicZoneNames();
  const { data: areas } = useDynamicAreas();
  const set = (k: keyof PFilters, v: string) => onChange({ ...value, [k]: v });
  const show = (k: keyof PFilters) => !hide.includes(k);

  return (
    <div className="flex flex-wrap gap-2">
      {show("zone") && (
        <FilterSelect value={value.zone} placeholder="All zones" onChange={(v) => set("zone", v)}
          options={(zoneNames ?? []).map((z: string) => ({ value: z, label: z }))} />
      )}
      {show("area") && (
        <FilterSelect value={value.area} placeholder="All areas" onChange={(v) => set("area", v)}
          options={(areas ?? []).map((a: any) => ({ value: a.name, label: a.name }))} />
      )}
      {show("gender") && (
        <FilterSelect value={value.gender} placeholder="All genders" onChange={(v) => set("gender", v)} width="w-32"
          options={[{ value: "M", label: "M" }, { value: "F", label: "F" }]} />
      )}
      {show("country") && (
        <FilterSelect value={value.country} placeholder="All countries" onChange={(v) => set("country", v)} width="w-36"
          options={[{ value: "USA", label: "USA" }, { value: "Canada", label: "Canada" }, { value: "Other", label: "Other" }]} />
      )}
      {show("aco") && (
        <FilterSelect value={value.aco} placeholder="Utaro: all" onChange={(v) => set("aco", v)} width="w-32"
          options={[{ value: "Yes", label: "Utaro players" }, { value: "No", label: "Non-Utaro" }]} />
      )}
      {show("checkedIn") && (
        <FilterSelect value={value.checkedIn} placeholder="Check-in: all" onChange={(v) => set("checkedIn", v)} width="w-40"
          options={[{ value: "Yes", label: "Checked in" }, { value: "No", label: "Not checked in" }]} />
      )}
    </div>
  );
}
