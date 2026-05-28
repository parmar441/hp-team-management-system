/**
 * Run once to create (or reset) the single admin account.
 * Usage from /server directory:
 *   npx tsx src/scripts/seed-admin.ts
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { LeadCredential } from "../models/LeadCredential.js";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/hp-team-management";

// ── Credentials — change these before running ──────────────────────────────
const ADMIN_USERNAME = "hpadmin";
const ADMIN_PASSWORD = "HP@Team2024";
const ADMIN_NAME     = "HP Admin";
const ADMIN_EMAIL    = "admin@hpteam.com";
// ───────────────────────────────────────────────────────────────────────────

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  // Remove any existing admin users + their credentials
  const existing = await User.find({ role: "admin" });
  for (const u of existing) {
    await LeadCredential.deleteMany({ userId: u._id });
    await User.deleteOne({ _id: u._id });
    console.log(`🗑  Removed old admin: ${u.name || u.email || u.openId}`);
  }

  // Create the admin User record
  const openId = `local:${ADMIN_EMAIL.toLowerCase()}`;
  const user = await User.create({
    openId,
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    loginMethod: "local",
    role: "admin",
    lastSignedIn: new Date(),
  });
  console.log(`👤 Created admin user: ${user.name} (${user._id})`);

  // Hash password and create credential
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await LeadCredential.create({
    userId: user._id,
    username: ADMIN_USERNAME,
    passwordHash,
    createdBy: user._id,
  });

  console.log("\n========================================");
  console.log("  ✅  Admin account ready");
  console.log("----------------------------------------");
  console.log(`  Username : ${ADMIN_USERNAME}`);
  console.log(`  Password : ${ADMIN_PASSWORD}`);
  console.log("========================================\n");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
