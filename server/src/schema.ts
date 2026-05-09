import {
  mysqlTable,
  int,
  varchar,
  text,
  boolean,
  timestamp,
  mysqlEnum,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const ZONES = ["North", "South", "East", "West", "Central"] as const;
export const GENDERS = ["M", "F"] as const;
export const AGE_GROUPS = ["Child", "Teen", "Adult", "Senior"] as const;
export const HOTEL_STATUSES = ["upcoming", "not_available", "available"] as const;
export const ROLES = ["user", "admin", "zone_lead", "area_lead"] as const;
export const ACTIONS = ["create", "update", "delete"] as const;

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  openId: varchar("open_id", { length: 64 }).unique().notNull(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: mysqlEnum("role", ROLES).default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  lastSignedIn: timestamp("last_signed_in"),
});

export const zoneAssignments = mysqlTable(
  "zone_assignments",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id").notNull(),
    zone: mysqlEnum("zone", ZONES).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    userZoneIdx: uniqueIndex("zone_assignments_user_zone_idx").on(t.userId, t.zone),
  })
);

export const areaAssignments = mysqlTable(
  "area_assignments",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id").notNull(),
    zone: mysqlEnum("zone", ZONES).notNull(),
    area: varchar("area", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    userZoneAreaIdx: uniqueIndex("area_assignments_user_zone_area_idx").on(t.userId, t.zone, t.area),
  })
);

export const people = mysqlTable("people", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  gender: mysqlEnum("gender", GENDERS).notNull(),
  ageGroup: mysqlEnum("age_group", AGE_GROUPS).notNull(),
  zone: mysqlEnum("zone", ZONES).notNull(),
  stay: boolean("stay").default(false).notNull(),
  isTeamLead: boolean("is_team_lead").default(false).notNull(),
  area: varchar("area", { length: 255 }),
  location: varchar("location", { length: 255 }),
  country: varchar("country", { length: 255 }),
  category: varchar("category", { length: 255 }),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const teams = mysqlTable("teams", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  zone: mysqlEnum("zone", ZONES),
  createdByUserId: int("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const teamMembers = mysqlTable("team_members", {
  id: int("id").primaryKey().autoincrement(),
  teamId: int("team_id").notNull(),
  personId: int("person_id").notNull(),
});

export const hotels = mysqlTable("hotels", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  totalSlots: int("total_slots").default(8).notNull(),
  status: mysqlEnum("status", HOTEL_STATUSES).default("upcoming").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const hotelSlots = mysqlTable(
  "hotel_slots",
  {
    id: int("id").primaryKey().autoincrement(),
    hotelId: int("hotel_id").notNull(),
    slotNumber: int("slot_number").notNull(),
    teamId: int("team_id"),
    roomNumber: varchar("room_number", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (t) => ({
    hotelSlotIdx: uniqueIndex("hotel_slots_hotel_slot_idx").on(t.hotelId, t.slotNumber),
  })
);

export const auditLog = mysqlTable("audit_log", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  userName: varchar("user_name", { length: 255 }).notNull(),
  userRole: varchar("user_role", { length: 50 }).notNull(),
  action: mysqlEnum("action", ACTIONS).notNull(),
  targetId: int("target_id").notNull(),
  targetName: varchar("target_name", { length: 255 }).notNull(),
  field: varchar("field", { length: 100 }),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Person = typeof people.$inferSelect;
export type InsertPerson = typeof people.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Hotel = typeof hotels.$inferSelect;
export type InsertHotel = typeof hotels.$inferInsert;
export type HotelSlot = typeof hotelSlots.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
export type ZoneAssignment = typeof zoneAssignments.$inferSelect;
export type AreaAssignment = typeof areaAssignments.$inferSelect;
