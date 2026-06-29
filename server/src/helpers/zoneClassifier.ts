import { DynamicZone } from "../models/DynamicZone.js";
import { DynamicZoneRule } from "../models/DynamicZoneRule.js";
import { DynamicArea } from "../models/DynamicArea.js";
import { DynamicAreaRule } from "../models/DynamicAreaRule.js";
import { Person } from "../models/Person.js";

interface PersonLike {
  _id?: any;
  gender?: string | null;
  mandal?: string | null;
  country?: string | null;
  ageRange?: string | null;
  zone?: string | null;
}

/* ──────────────────────────────────────────────────────────────
   Value normalization — bridge rule vocabulary to stored data.
   - gender:  Male/Female  ↔  M/F
   - country: us/usa, ca/canada, gb/uk, in/india, pa/panama …
   ────────────────────────────────────────────────────────────── */
const COUNTRY_ALIASES: Record<string, string> = {
  us: "us", usa: "us", "u.s.": "us", "u.s.a.": "us", "united states": "us", america: "us",
  ca: "ca", canada: "ca",
  gb: "gb", uk: "gb", "u.k.": "gb", "great britain": "gb", england: "gb", "united kingdom": "gb",
  in: "in", india: "in",
  pa: "pa", panama: "pa",
};

function normValue(field: string, raw: unknown): string {
  const v = String(raw ?? "").trim().toLowerCase();
  if (!v) return "";
  if (field === "gender") {
    if (v === "male" || v === "m") return "m";
    if (v === "female" || v === "f") return "f";
    return v;
  }
  if (field === "country") return COUNTRY_ALIASES[v] ?? v;
  return v; // mandal, ageRange — compared case-insensitively as-is
}

/** Split a stored matchValue ("AUSTIN+DALLAS, HOUSTON") into normalized OR tokens. */
function splitValues(field: string, matchValue: string): string[] {
  return matchValue
    .split(/[+,]/)
    .map((s) => normValue(field, s))
    .filter(Boolean);
}

/** One condition matches when the person's (normalized) field value is one of the OR tokens. */
function conditionMatches(person: PersonLike, field: string, values: string[]): boolean {
  const pv = normValue(field, (person as any)[field]);
  if (!pv) return false;
  return values.includes(pv);
}

interface ZoneDef { name: string; priority: number; createdAt: number; conds: { field: string; values: string[] }[] }

async function loadZoneDefs(): Promise<{ zones: ZoneDef[]; defaultName: string | null }> {
  const [zones, rules, def] = await Promise.all([
    DynamicZone.find({ isDefault: { $ne: true } }),
    DynamicZoneRule.find(),
    DynamicZone.findOne({ isDefault: true }),
  ]);
  const byZone = new Map<string, { field: string; values: string[] }[]>();
  for (const r of rules) {
    const key = r.zoneId.toString();
    const arr = byZone.get(key) ?? [];
    arr.push({ field: r.field, values: splitValues(r.field, r.matchValue) });
    byZone.set(key, arr);
  }
  const defs: ZoneDef[] = zones.map((z) => ({
    name: z.name,
    priority: (z as any).priority ?? 0,
    createdAt: +new Date((z as any).createdAt ?? 0),
    conds: byZone.get(z._id.toString()) ?? [],
  }));
  // Higher priority first; tie-break by creation order (earlier wins).
  defs.sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt);
  return { zones: defs, defaultName: def?.name ?? null };
}

/** A zone matches when it has ≥1 condition and ALL of them match (AND). First match wins. */
function pickZone(person: PersonLike, defs: ZoneDef[], defaultName: string | null): string | null {
  for (const z of defs) {
    if (z.conds.length === 0) continue;
    if (z.conds.every((c) => conditionMatches(person, c.field, c.values))) return z.name;
  }
  return defaultName;
}

export async function classifyPersonZone(person: PersonLike): Promise<string | null> {
  const { zones, defaultName } = await loadZoneDefs();
  return pickZone(person, zones, defaultName);
}

export async function classifyPersonArea(person: PersonLike, zoneName: string): Promise<string | null> {
  const zone = await DynamicZone.findOne({ name: zoneName });
  if (!zone) return null;
  const areas = await DynamicArea.find({ zoneId: zone._id });
  for (const area of areas) {
    const rules = await DynamicAreaRule.find({ areaId: area._id }).sort({ priority: -1 });
    // Areas keep OR-across-rules semantics, now with multi-value support.
    for (const rule of rules) {
      if (conditionMatches(person, rule.field, splitValues(rule.field, rule.matchValue))) return area.name;
    }
  }
  return null;
}

export async function reapplyAllZoneRules(): Promise<{ updated: number }> {
  const { zones, defaultName } = await loadZoneDefs();
  const people = await Person.find();
  let updated = 0;
  for (const person of people) {
    const zone = pickZone(person, zones, defaultName);
    const area = zone ? await classifyPersonArea(person, zone) : null;
    await Person.updateOne({ _id: person._id }, { zone: zone ?? undefined, area: area ?? undefined });
    updated++;
  }
  return { updated };
}

export async function reapplyAllAreaRules(): Promise<{ updated: number }> {
  const people = await Person.find({ zone: { $exists: true, $ne: null } });
  let updated = 0;
  for (const person of people) {
    const area = person.zone ? await classifyPersonArea(person, person.zone) : null;
    await Person.updateOne({ _id: person._id }, { area: area ?? undefined });
    updated++;
  }
  return { updated };
}
