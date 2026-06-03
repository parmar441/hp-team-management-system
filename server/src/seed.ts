import "dotenv/config";
import mongoose from "mongoose";
import { TournamentSlot } from "./models/TournamentSlot.js";
import { Tournament } from "./models/Tournament.js";
import { Team } from "./models/Team.js";
import { Person } from "./models/Person.js";
import { HotelRoom } from "./models/HotelRoom.js";
import { HotelPersonAssignment } from "./models/HotelPersonAssignment.js";
import { LeadCredential } from "./models/LeadCredential.js";
import { ZoneAssignment } from "./models/ZoneAssignment.js";
import { AreaAssignment } from "./models/AreaAssignment.js";
import { DynamicZoneRule } from "./models/DynamicZoneRule.js";
import { DynamicAreaRule } from "./models/DynamicAreaRule.js";
import { DynamicZone } from "./models/DynamicZone.js";
import { DynamicArea } from "./models/DynamicArea.js";
import { User } from "./models/User.js";
import { AuditLog } from "./models/AuditLog.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hp-team-management";

const STATES_DISTRIBUTION = [
  { state: "New Jersey", count: 10 },
  { state: "California", count: 10 },
  { state: "Texas", count: 10 },
  { state: "Ohio", count: 5 },
  { state: "Illinois", count: 5 },
  { state: "Washington", count: 5 },
  { state: "Michigan", count: 5 },
  { state: "Florida", count: 5 },
  { state: "North Carolina", count: 5 },
  { state: "Massachusetts", count: 5 },
];

const AGE_RANGES_DISTRIBUTION = [
  { range: "0-6", count: 4 },
  { range: "7-14", count: 5 },
  { range: "15-45", count: 59 },
  { range: "46-65", count: 24 },
  { range: "65+", count: 8 },
];

const FIRST_NAMES_M = ["Raj", "Amit", "Sanjay", "Vikram", "Arun", "Ravi", "Suresh", "Kiran", "Nikhil", "Rohan",
  "Aarav", "Arjun", "Ayaan", "Dhruv", "Kabir", "Krish", "Om", "Reyansh", "Shiv", "Vihaan"];
const FIRST_NAMES_F = ["Priya", "Anjali", "Meera", "Sunita", "Kavita", "Neha", "Pooja", "Ria", "Sneha", "Swati",
  "Aanya", "Aditi", "Diya", "Isha", "Kavya", "Kritika", "Mansi", "Nisha", "Riya", "Shruti"];
const LAST_NAMES = ["Patel", "Shah", "Sharma", "Gupta", "Mehta", "Desai", "Joshi", "Trivedi", "Pandya", "Parikh",
  "Rao", "Reddy", "Naidu", "Pillai", "Nair", "Kumar", "Singh", "Verma", "Mishra", "Agarwal"];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // 1. Clear all 15 collections except admin user
  await Promise.all([
    TournamentSlot.deleteMany({}),
    Tournament.deleteMany({}),
    Team.deleteMany({}),
    Person.deleteMany({}),
    HotelRoom.deleteMany({}),
    HotelPersonAssignment.deleteMany({}),
    LeadCredential.deleteMany({}),
    ZoneAssignment.deleteMany({}),
    AreaAssignment.deleteMany({}),
    DynamicZoneRule.deleteMany({}),
    DynamicAreaRule.deleteMany({}),
    DynamicZone.deleteMany({}),
    DynamicArea.deleteMany({}),
    User.deleteMany({ role: { $ne: "admin" } }),
    AuditLog.deleteMany({}),
  ]);

  console.log("Cleared collections");

  // 2. Create 100 people with realistic distribution
  const ageRangePool: string[] = [];
  for (const { range, count } of AGE_RANGES_DISTRIBUTION) {
    for (let i = 0; i < count; i++) ageRangePool.push(range);
  }

  const statePool: string[] = [];
  for (const { state, count } of STATES_DISTRIBUTION) {
    for (let i = 0; i < count; i++) statePool.push(state);
  }
  // Fill remaining 35 with other states
  const OTHER_STATES = ["Georgia", "Virginia", "Pennsylvania", "Arizona", "Colorado", "Nevada", "Oregon", "Minnesota", "Wisconsin", "Maryland"];
  for (let i = 0; i < 35; i++) statePool.push(randomChoice(OTHER_STATES));

  const people = [];
  for (let i = 0; i < 100; i++) {
    const gender = i < 50 ? "M" : "F";
    const firstName = gender === "M" ? randomChoice(FIRST_NAMES_M) : randomChoice(FIRST_NAMES_F);
    const lastName = randomChoice(LAST_NAMES);
    const acoNeeded = Math.random() < 0.92 ? "Yes" : "No";
    const mandal = statePool[i];
    const ageRange = ageRangePool[i];

    people.push({
      firstName,
      lastName,
      gender,
      mandal,
      ageRange,
      acoNeeded,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      city: "Sample City",
      state: mandal,
      country: "USA",
      name: `${firstName} ${lastName}`,
    });
  }

  const createdPeople = await Person.insertMany(people);
  console.log(`Created ${createdPeople.length} people`);

  console.log("Seed completed! 100 people created.");
  console.log("Run zone reapply after configuring zones to assign zone/area.");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
