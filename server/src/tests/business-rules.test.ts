import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../db.js";
import {
  people,
  teams,
  teamMembers,
  hotelSlots,
  hotels,
} from "../schema.js";
import {
  createPerson,
  createTeam,
  updateTeam,
  deleteTeam,
  deletePerson,
  toggleStay,
  listAvailablePeople,
  getTeamById,
  createHotel,
  assignTeamToSlot,
  getHotelById,
} from "../helpers.js";
import { eq, sql } from "drizzle-orm";

// Clean up tables before tests
beforeAll(async () => {
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
  await db.execute(sql`TRUNCATE TABLE audit_log`);
  await db.execute(sql`TRUNCATE TABLE hotel_slots`);
  await db.execute(sql`TRUNCATE TABLE hotels`);
  await db.execute(sql`TRUNCATE TABLE team_members`);
  await db.execute(sql`TRUNCATE TABLE teams`);
  await db.execute(sql`TRUNCATE TABLE people`);
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
});

afterAll(async () => {
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
  await db.execute(sql`TRUNCATE TABLE audit_log`);
  await db.execute(sql`TRUNCATE TABLE hotel_slots`);
  await db.execute(sql`TRUNCATE TABLE hotels`);
  await db.execute(sql`TRUNCATE TABLE team_members`);
  await db.execute(sql`TRUNCATE TABLE teams`);
  await db.execute(sql`TRUNCATE TABLE people`);
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
});

describe("People CRUD", () => {
  it("creates a person", async () => {
    const person = await createPerson({
      name: "Test User",
      gender: "M",
      ageGroup: "Adult",
      zone: "North",
      stay: false,
      isTeamLead: false,
    });
    expect(person).toBeDefined();
    expect(person?.name).toBe("Test User");
    expect(person?.zone).toBe("North");
  });

  it("sanitizes person input (trims strings)", async () => {
    const person = await createPerson({
      name: "  Padded Name  ",
      gender: "F",
      ageGroup: "Teen",
      zone: "South",
      stay: false,
      isTeamLead: false,
      area: "",
    });
    expect(person?.name).toBe("Padded Name");
    expect(person?.area).toBeNull();
  });
});

describe("Team Creation Business Rules", () => {
  let p1Id: number;
  let p2Id: number;
  let p3Id: number;
  let differentZoneId: number;

  beforeAll(async () => {
    const p1 = await createPerson({ name: "Player One", gender: "M", ageGroup: "Adult", zone: "North", stay: true, isTeamLead: false });
    const p2 = await createPerson({ name: "Player Two", gender: "F", ageGroup: "Adult", zone: "North", stay: true, isTeamLead: false });
    const p3 = await createPerson({ name: "Player Three", gender: "M", ageGroup: "Teen", zone: "North", stay: true, isTeamLead: false });
    const pd = await createPerson({ name: "Player Different", gender: "M", ageGroup: "Adult", zone: "South", stay: true, isTeamLead: false });
    p1Id = p1!.id;
    p2Id = p2!.id;
    p3Id = p3!.id;
    differentZoneId = pd!.id;
  });

  it("creates a team with 2+ members from same zone", async () => {
    const team = await createTeam([p1Id, p2Id]);
    expect(team).toBeDefined();
    expect(team?.members.length).toBe(2);
    expect(team?.zone).toBe("North");
  });

  it("rejects team with fewer than 2 members", async () => {
    await expect(createTeam([p3Id])).rejects.toThrow();
  });

  it("enforces same-zone rule", async () => {
    await expect(createTeam([p3Id, differentZoneId])).rejects.toThrow(
      /same zone/i
    );
  });

  it("requires stay=true for all members", async () => {
    const noStay = await createPerson({ name: "No Stay", gender: "M", ageGroup: "Adult", zone: "North", stay: false, isTeamLead: false });
    await expect(createTeam([p3Id, noStay!.id])).rejects.toThrow(/stay=true/i);
    await deletePerson(noStay!.id);
  });
});

describe("Team Size Validation", () => {
  it("rejects more than 8 members", async () => {
    const ids: number[] = [];
    for (let i = 0; i < 9; i++) {
      const p = await createPerson({ name: `BigTeam${i}`, gender: "M", ageGroup: "Adult", zone: "East", stay: true, isTeamLead: false });
      ids.push(p!.id);
    }
    await expect(createTeam(ids)).rejects.toThrow();
    for (const id of ids) await deletePerson(id);
  });
});

describe("Cascading Deletions", () => {
  it("person delete removes them from team", async () => {
    const p1 = await createPerson({ name: "CascadeP1", gender: "M", ageGroup: "Adult", zone: "West", stay: true, isTeamLead: false });
    const p2 = await createPerson({ name: "CascadeP2", gender: "F", ageGroup: "Adult", zone: "West", stay: true, isTeamLead: false });
    const team = await createTeam([p1!.id, p2!.id]);
    expect(team?.members.length).toBe(2);

    await deletePerson(p1!.id);
    const updated = await getTeamById(team!.id);
    expect(updated?.members.length).toBe(1);
    await deleteTeam(team!.id);
    await deletePerson(p2!.id);
  });

  it("team delete releases hotel slots", async () => {
    const hotel = await createHotel({ name: "Test Hotel", totalSlots: 2, status: "available" });
    const p1 = await createPerson({ name: "HotelP1", gender: "M", ageGroup: "Adult", zone: "Central", stay: true, isTeamLead: false });
    const p2 = await createPerson({ name: "HotelP2", gender: "F", ageGroup: "Adult", zone: "Central", stay: true, isTeamLead: false });
    const team = await createTeam([p1!.id, p2!.id]);

    const hotelData = await getHotelById(hotel!.id);
    const slotId = hotelData!.slots[0].id;
    await assignTeamToSlot(slotId, team!.id);

    await deleteTeam(team!.id);

    const updatedHotel = await getHotelById(hotel!.id);
    const slot = updatedHotel!.slots.find((s) => s.id === slotId);
    expect(slot?.teamId).toBeNull();

    await deletePerson(p1!.id);
    await deletePerson(p2!.id);
  });
});

describe("Auto-release when stay=false", () => {
  it("removes person from team when stay toggled to false", async () => {
    const p1 = await createPerson({ name: "StayP1", gender: "M", ageGroup: "Adult", zone: "North", stay: true, isTeamLead: false });
    const p2 = await createPerson({ name: "StayP2", gender: "F", ageGroup: "Adult", zone: "North", stay: true, isTeamLead: false });
    const p3 = await createPerson({ name: "StayP3", gender: "M", ageGroup: "Adult", zone: "North", stay: true, isTeamLead: false });
    const team = await createTeam([p1!.id, p2!.id, p3!.id]);

    await toggleStay(p3!.id);

    const updated = await getTeamById(team!.id);
    const memberIds = updated?.members.map((m) => m.id) ?? [];
    expect(memberIds).not.toContain(p3!.id);

    await deleteTeam(team!.id);
    await deletePerson(p1!.id);
    await deletePerson(p2!.id);
    await deletePerson(p3!.id);
  });
});

describe("Bulk Operations", () => {
  it("bulk deletes multiple people", async () => {
    const p1 = await createPerson({ name: "BulkDel1", gender: "M", ageGroup: "Adult", zone: "South", stay: false, isTeamLead: false });
    const p2 = await createPerson({ name: "BulkDel2", gender: "F", ageGroup: "Adult", zone: "South", stay: false, isTeamLead: false });

    const { bulkDeletePeople } = await import("../helpers.js");
    await bulkDeletePeople([p1!.id, p2!.id]);

    const rows = await db.select().from(people).where(
      eq(people.name, "BulkDel1")
    );
    expect(rows.length).toBe(0);
  });
});

describe("Hotel Business Rules", () => {
  it("prevents assigning team to occupied slot", async () => {
    const h = await createHotel({ name: "No-Double Hotel", totalSlots: 2, status: "available" });
    const p1 = await createPerson({ name: "HP1", gender: "M", ageGroup: "Adult", zone: "East", stay: true, isTeamLead: false });
    const p2 = await createPerson({ name: "HP2", gender: "F", ageGroup: "Adult", zone: "East", stay: true, isTeamLead: false });
    const p3 = await createPerson({ name: "HP3", gender: "M", ageGroup: "Adult", zone: "East", stay: true, isTeamLead: false });
    const p4 = await createPerson({ name: "HP4", gender: "F", ageGroup: "Adult", zone: "East", stay: true, isTeamLead: false });

    const t1 = await createTeam([p1!.id, p2!.id]);
    const t2 = await createTeam([p3!.id, p4!.id]);

    const hotelData = await getHotelById(h!.id);
    const slotId = hotelData!.slots[0].id;
    await assignTeamToSlot(slotId, t1!.id);

    await expect(assignTeamToSlot(slotId, t2!.id)).rejects.toThrow(/occupied/i);

    await deleteTeam(t1!.id);
    await deleteTeam(t2!.id);
    await deletePerson(p1!.id);
    await deletePerson(p2!.id);
    await deletePerson(p3!.id);
    await deletePerson(p4!.id);
  });
});
