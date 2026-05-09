import { db } from "./db.js";
import { people } from "./schema.js";
import { sql } from "drizzle-orm";

const ZONES = ["North", "South", "East", "West", "Central"] as const;
const GENDERS = ["M", "F"] as const;
const AGE_GROUPS = ["Child", "Teen", "Adult", "Senior"] as const;
const CATEGORIES = ["A", "B", "C", "D", "E"] as const;
const NOTES = [
  null,
  "Experienced player",
  "New member",
  "Needs accommodation",
  "Has special dietary requirements",
  "Returning volunteer",
  "First time participant",
  null,
  null,
  null,
];

const ZONE_AREAS: Record<string, string[]> = {
  North: ["Delhi", "Chandigarh", "Lucknow", "Jaipur", "Amritsar"],
  South: ["Chennai", "Bangalore", "Hyderabad", "Kochi", "Coimbatore"],
  East: ["Kolkata", "Bhubaneswar", "Patna", "Ranchi", "Guwahati"],
  West: ["Mumbai", "Pune", "Ahmedabad", "Surat", "Nagpur"],
  Central: ["Indore", "Bhopal", "Raipur", "Jabalpur", "Gwalior"],
};

const MALE_NAMES = [
  "Aarav", "Arjun", "Rohan", "Vikram", "Karan", "Rahul", "Amit", "Suresh",
  "Pranav", "Nikhil", "Deepak", "Sanjay", "Rajesh", "Manish", "Vivek",
  "Aditya", "Harsh", "Varun", "Ankit", "Gaurav", "Ravi", "Pradeep",
  "Sumit", "Akash", "Tarun", "Mohit", "Yash", "Kunal", "Shivam", "Mayank",
  "Sachin", "Rishi", "Parth", "Dev", "Ishan", "Shreyas", "Neeraj", "Tushar",
  "Vipul", "Kartik", "Lalit", "Hemant", "Ajay", "Vijay", "Pankaj",
  "Naresh", "Vinay", "Girish", "Ramesh", "Sunil", "Dhruv", "Om", "Ayaan",
  "Kabir", "Arnav", "Rehan", "Zaid", "Farhan", "Imran", "Asif",
  "Surya", "Tejas", "Abhinav", "Chetan", "Dhanush", "Elan", "Faruk",
  "Girish", "Hari", "Irfan", "Jagdish", "Kamal", "Lokesh", "Mohan",
  "Naren", "Om", "Parth", "Qasim", "Ritesh", "Sameer", "Tanvir",
  "Umesh", "Vinod", "Wasim", "Xerxes", "Yogesh", "Zubin",
];

const FEMALE_NAMES = [
  "Aarti", "Priya", "Kavya", "Ananya", "Sneha", "Pooja", "Neha", "Divya",
  "Ritu", "Meera", "Ankita", "Shreya", "Swati", "Pallavi", "Madhuri",
  "Sunita", "Rekha", "Geeta", "Sita", "Radha", "Uma", "Nisha", "Tanvi",
  "Simran", "Jasmine", "Fatima", "Zara", "Aisha", "Ruhi", "Shweta",
  "Kajal", "Preeti", "Jyoti", "Lalita", "Manisha", "Nandita", "Omi",
  "Payal", "Qudsia", "Rani", "Savita", "Tulsi", "Usha", "Varsha",
  "Warda", "Yamini", "Amrita", "Bhavna", "Chanda", "Deepika",
  "Ekta", "Falguni", "Gauri", "Harsha", "Indira", "Jayanti",
  "Kalpana", "Lavanya", "Mamta", "Nalini", "Ojaswini", "Pratibha",
  "Radhika", "Sarla", "Tara", "Urmila", "Vandana", "Ximena",
];

const COUNTRIES = ["India", "India", "India", "India", "USA", "UK", "Canada", "Australia"];
const LOCATIONS = [
  "Sector 7", "MG Road", "Park Street", "Linking Road", "Anna Nagar",
  "Indiranagar", "Koregaon Park", "Vasant Kunj", "Salt Lake", "Banjara Hills",
  null, null, null,
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  console.log("🌱 Seeding database with 150 people...");

  // Clear existing people
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
  await db.execute(sql`TRUNCATE TABLE team_members`);
  await db.execute(sql`TRUNCATE TABLE teams`);
  await db.execute(sql`TRUNCATE TABLE people`);
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);

  const peopleData = [];
  let maleIdx = 0;
  let femaleIdx = 0;

  for (let i = 0; i < 150; i++) {
    const zone = ZONES[i % ZONES.length];
    const gender = i % 3 === 0 ? "F" : "M"; // ~33% female
    const name = gender === "M"
      ? MALE_NAMES[maleIdx++ % MALE_NAMES.length]
      : FEMALE_NAMES[femaleIdx++ % FEMALE_NAMES.length];

    const areas = ZONE_AREAS[zone];
    const area = pickRandom(areas);
    const stay = Math.random() < 0.70; // 70% stay

    peopleData.push({
      name: `${name} ${["Kumar", "Singh", "Sharma", "Patel", "Verma", "Mehta", "Joshi", "Gupta", "Reddy", "Nair"][i % 10]}`,
      gender: gender as "M" | "F",
      ageGroup: pickRandom(AGE_GROUPS),
      zone,
      area,
      stay,
      isTeamLead: false,
      location: pickRandom(LOCATIONS) ?? undefined,
      country: pickRandom(COUNTRIES),
      category: pickRandom(CATEGORIES),
      note: pickRandom(NOTES) ?? undefined,
    });
  }

  // Batch insert
  const BATCH = 50;
  for (let i = 0; i < peopleData.length; i += BATCH) {
    const batch = peopleData.slice(i, i + BATCH);
    await db.insert(people).values(batch as any[]);
  }

  console.log(`✅ Inserted ${peopleData.length} people`);
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed error:", e);
  process.exit(1);
});
