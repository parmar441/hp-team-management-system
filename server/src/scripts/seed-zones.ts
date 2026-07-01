/**
 * Seed zone rules from the provided spreadsheet.
 * Each zone = a name + AND-ed conditions; within a condition, "+" means OR.
 * Idempotent: re-running replaces each named zone and its rules.
 *
 * Run:  npx tsx src/scripts/seed-zones.ts
 */
import "dotenv/config";
import mongoose from "mongoose";
import { DynamicZone } from "../models/DynamicZone.js";
import { DynamicZoneRule } from "../models/DynamicZoneRule.js";

type Cond = { field: "country" | "gender" | "mandal" | "ageRange"; matchValue: string };
const ZONES: { name: string; conds: Cond[] }[] = [
  { name: "LASF", conds: [{ field: "country", matchValue: "us" }, { field: "mandal", matchValue: "ARIZONA+LOS_ANGELES+SAN_FRANCISCO" }] },
  { name: "GA", conds: [{ field: "country", matchValue: "us" }, { field: "mandal", matchValue: "ATLANTA" }] },
  { name: "TX", conds: [{ field: "country", matchValue: "us" }, { field: "mandal", matchValue: "AUSTIN+DALLAS+HOUSTON+HOUSTON_CLEAR_LAKE+HOUSTON_SPRING+HOUSTON_TMC+san_antonio" }] },
  { name: "Bensalem", conds: [{ field: "country", matchValue: "us" }, { field: "mandal", matchValue: "BENSALEM+CHERRYHILL-ATLANTIC_CITY+HERSHEY+PITTSBURGH+SCRANTON" }] },
  { name: "Boston", conds: [{ field: "country", matchValue: "us" }, { field: "mandal", matchValue: "BOSTON+BOSTON_1+BOSTON_2" }] },
  { name: "Chicago", conds: [{ field: "country", matchValue: "us" }, { field: "mandal", matchValue: "CHICAGO" }] },
  { name: "Clifton", conds: [{ field: "country", matchValue: "us" }, { field: "gender", matchValue: "Male" }, { field: "mandal", matchValue: "CLIFTON+CLIFTON-PASSAIC+PASSAIC" }] },
  { name: "Columbus", conds: [{ field: "country", matchValue: "us" }, { field: "mandal", matchValue: "COLUMBUS" }] },
  { name: "CT", conds: [{ field: "country", matchValue: "us" }, { field: "mandal", matchValue: "CONNECTICUT-ALBANY" }] },
  { name: "Detroit", conds: [{ field: "country", matchValue: "us" }, { field: "mandal", matchValue: "DETROIT" }] },
  { name: "Edison", conds: [{ field: "country", matchValue: "us" }, { field: "gender", matchValue: "Male" }, { field: "mandal", matchValue: "EDISON" }] },
  { name: "JC", conds: [{ field: "country", matchValue: "us" }, { field: "gender", matchValue: "Male" }, { field: "mandal", matchValue: "JERSEY_CITY+JERSEY_CITY_1+JERSEY_CITY_2" }] },
  { name: "Parsippany", conds: [{ field: "country", matchValue: "us" }, { field: "gender", matchValue: "Male" }, { field: "mandal", matchValue: "LAKE_HIAWATHA+LAKE_PARSIPPANY+PARSIPPANY" }] },
  { name: "VA", conds: [{ field: "country", matchValue: "us" }, { field: "mandal", matchValue: "TENNESSEE+VIRGINIA+VIRGINIA_2" }] },
  { name: "NC", conds: [{ field: "country", matchValue: "us" }, { field: "mandal", matchValue: "CHARLOTTE" }] },
  { name: "NJ Benos", conds: [{ field: "country", matchValue: "us" }, { field: "gender", matchValue: "Female" }, { field: "mandal", matchValue: "CLIFTON+CLIFTON-PASSAIC+PASSAIC+EDISON+JERSEY_CITY+JERSEY_CITY_1+JERSEY_CITY_2+LAKE_HIAWATHA+LAKE_PARSIPPANY+PARSIPPANY" }] },
  { name: "Canada", conds: [{ field: "country", matchValue: "ca" }] },
  { name: "International", conds: [{ field: "country", matchValue: "gb+pa+in" }] },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  let zonesCreated = 0, rulesCreated = 0;
  for (const z of ZONES) {
    const existing = await DynamicZone.findOne({ name: z.name });
    if (existing) {
      await DynamicZoneRule.deleteMany({ zoneId: existing._id });
      await DynamicZone.deleteOne({ _id: existing._id });
    }
    const zone = await DynamicZone.create({ name: z.name, isDefault: false, priority: 0 });
    zonesCreated++;
    for (const c of z.conds) {
      await DynamicZoneRule.create({ zoneId: zone._id, field: c.field, matchValue: c.matchValue, priority: 0 });
      rulesCreated++;
    }
    console.log(`  ${z.name.padEnd(14)} ${z.conds.map((c) => `${c.field}=${c.matchValue}`).join("  AND  ")}`);
  }
  console.log(`\n✅ ${zonesCreated} zones, ${rulesCreated} rules seeded. Total zones now: ${await DynamicZone.countDocuments()}`);
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
