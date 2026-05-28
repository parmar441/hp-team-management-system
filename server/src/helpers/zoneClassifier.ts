import { DynamicZone } from "../models/DynamicZone.js";
import { DynamicZoneRule } from "../models/DynamicZoneRule.js";
import { DynamicArea } from "../models/DynamicArea.js";
import { DynamicAreaRule } from "../models/DynamicAreaRule.js";
import { Person } from "../models/Person.js";

interface PersonLike {
  _id: any;
  gender?: string | null;
  mandal?: string | null;
  country?: string | null;
  ageRange?: string | null;
  zone?: string | null;
}

function matchesRule(person: PersonLike, field: string, matchValue: string): boolean {
  const val = (person as any)[field];
  if (!val) return false;
  return val.toLowerCase() === matchValue.toLowerCase();
}

export async function classifyPersonZone(person: PersonLike): Promise<string | null> {
  const rules = await DynamicZoneRule.find().sort({ priority: -1 }).populate("zoneId");
  for (const rule of rules) {
    if (matchesRule(person, rule.field, rule.matchValue)) {
      const zone = rule.zoneId as any;
      return zone?.name ?? null;
    }
  }
  // fallback to default zone
  const defaultZone = await DynamicZone.findOne({ isDefault: true });
  return defaultZone?.name ?? null;
}

export async function classifyPersonArea(person: PersonLike, zoneName: string): Promise<string | null> {
  const zone = await DynamicZone.findOne({ name: zoneName });
  if (!zone) return null;

  const areas = await DynamicArea.find({ zoneId: zone._id });
  for (const area of areas) {
    const rules = await DynamicAreaRule.find({ areaId: area._id }).sort({ priority: -1 });
    for (const rule of rules) {
      if (matchesRule(person, rule.field, rule.matchValue)) {
        return area.name;
      }
    }
  }
  return null;
}

export async function reapplyAllZoneRules(): Promise<{ updated: number }> {
  const people = await Person.find();
  let updated = 0;
  for (const person of people) {
    const zone = await classifyPersonZone(person);
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
