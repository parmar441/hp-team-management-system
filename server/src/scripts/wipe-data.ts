/**
 * Wipe all operational data from the database while preserving login access.
 *
 * KEEPS:   users, leadcredentials   (so everyone can still sign in)
 * CLEARS:  every other collection   (people, teams, tournaments, assignments,
 *          zones/areas + rules, hotel rooms, audit logs, …)
 *
 * Documents are removed with deleteMany({}) so collection indexes are preserved.
 * Run with:  npx tsx src/scripts/wipe-data.ts
 */
import "dotenv/config";
import mongoose from "mongoose";

const KEEP = new Set(["users", "leadcredentials"]);

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  await mongoose.connect(uri);
  const db = mongoose.connection.db!;
  const host = mongoose.connection.host;
  const dbName = mongoose.connection.name;
  console.log(`Connected to ${host} / db "${dbName}"`);

  const collections = await db.listCollections().toArray();
  let cleared = 0;
  let keptDocs = 0;

  for (const { name } of collections) {
    const coll = db.collection(name);
    if (KEEP.has(name)) {
      const n = await coll.countDocuments();
      keptDocs += n;
      console.log(`  keep   ${name.padEnd(28)} (${n} docs untouched)`);
      continue;
    }
    const before = await coll.countDocuments();
    const { deletedCount } = await coll.deleteMany({});
    cleared += deletedCount ?? 0;
    console.log(`  clear  ${name.padEnd(28)} (${deletedCount}/${before} deleted)`);
  }

  console.log(`\n✅ Done. Cleared ${cleared} documents; kept ${keptDocs} login docs across ${[...KEEP].join(", ")}.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Wipe failed:", err);
  process.exit(1);
});
