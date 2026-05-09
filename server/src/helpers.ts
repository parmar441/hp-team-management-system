import { and, eq, gte, ilike, inArray, isNull, like, ne, or, sql } from "drizzle-orm";
import { db } from "./db.js";
import {
  people,
  teams,
  teamMembers,
  hotels,
  hotelSlots,
  auditLog,
  users,
  zoneAssignments,
  areaAssignments,
  type Person,
  type InsertPerson,
  type Team,
  type Hotel,
  type InsertHotel,
} from "./schema.js";

// ── Sanitize ──────────────────────────────────────────────────────────────────
export function sanitizePersonInput<T extends Record<string, unknown>>(input: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (typeof v === "string") {
      const trimmed = v.trim();
      out[k] = trimmed === "" ? null : trimmed;
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

// ── People ────────────────────────────────────────────────────────────────────
export interface ListPeopleOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  zones?: string[];
  areas?: string[];
  gender?: string;
  ageGroup?: string;
  stay?: boolean;
  country?: string;
  category?: string;
}

export async function listPeople(opts: ListPeopleOptions = {}) {
  const {
    page = 1,
    pageSize = 50,
    search,
    zones,
    areas,
    gender,
    ageGroup,
    stay,
    country,
    category,
  } = opts;

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        like(people.name, `%${search}%`),
        like(people.area, `%${search}%`),
        like(people.location, `%${search}%`),
        like(people.country, `%${search}%`),
        like(people.note, `%${search}%`)
      )
    );
  }
  if (zones && zones.length > 0) {
    conditions.push(inArray(people.zone, zones as any[]));
  }
  if (areas && areas.length > 0) {
    conditions.push(inArray(people.area, areas as any[]));
  }
  if (gender) {
    conditions.push(eq(people.gender, gender as any));
  }
  if (ageGroup) {
    conditions.push(eq(people.ageGroup, ageGroup as any));
  }
  if (stay !== undefined) {
    conditions.push(eq(people.stay, stay));
  }
  if (country) {
    conditions.push(like(people.country, `%${country}%`));
  }
  if (category) {
    conditions.push(like(people.category, `%${category}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(people)
      .where(where)
      .limit(pageSize)
      .offset(offset)
      .orderBy(people.name),
    db.select({ count: sql<number>`count(*)` }).from(people).where(where),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return { data: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function createPerson(input: InsertPerson) {
  const sanitized = sanitizePersonInput(input);
  const [result] = await db.insert(people).values(sanitized as InsertPerson).$returningId();
  const created = await db.select().from(people).where(eq(people.id, result.id));
  return created[0];
}

export async function updatePerson(
  id: number,
  input: Partial<InsertPerson>,
  expectedUpdatedAt?: Date
) {
  if (expectedUpdatedAt) {
    const current = await db.select().from(people).where(eq(people.id, id)).limit(1);
    if (!current[0]) throw new Error("Person not found");
    const dbTime = current[0].updatedAt?.getTime();
    const expectedTime = expectedUpdatedAt.getTime();
    if (dbTime && Math.abs(dbTime - expectedTime) > 1000) {
      throw new Error("Conflict: record was modified by another user");
    }
  }
  const sanitized = sanitizePersonInput(input);
  await db.update(people).set(sanitized as Partial<InsertPerson>).where(eq(people.id, id));
  const updated = await db.select().from(people).where(eq(people.id, id)).limit(1);
  return updated[0];
}

export async function deletePerson(id: number) {
  // Remove from team members first
  await db.delete(teamMembers).where(eq(teamMembers.personId, id));
  // Then check if any team is now below 2 members and handle auto cleanup
  await db.delete(people).where(eq(people.id, id));
}

export async function bulkCreatePeople(inputs: InsertPerson[]) {
  if (inputs.length === 0) return [];
  const sanitized = inputs.map((i) => sanitizePersonInput(i));
  await db.insert(people).values(sanitized as InsertPerson[]);
}

export async function bulkDeletePeople(ids: number[]) {
  if (ids.length === 0) return;
  await db.delete(teamMembers).where(inArray(teamMembers.personId, ids));
  await db.delete(people).where(inArray(people.id, ids));
}

export async function bulkToggleStay(ids: number[], stay: boolean) {
  if (ids.length === 0) return;
  if (!stay) {
    // Remove from teams if setting stay=false
    await db.delete(teamMembers).where(inArray(teamMembers.personId, ids));
  }
  await db.update(people).set({ stay }).where(inArray(people.id, ids));
}

export async function bulkUpdatePeopleFields(
  ids: number[],
  fields: { zone?: string; area?: string | null; category?: string | null }
) {
  if (ids.length === 0) return;
  const update: Partial<InsertPerson> = {};
  if (fields.zone !== undefined) update.zone = fields.zone as any;
  if (fields.area !== undefined) update.area = fields.area ?? undefined;
  if (fields.category !== undefined) update.category = fields.category ?? undefined;
  await db.update(people).set(update).where(inArray(people.id, ids));
}

export async function toggleStay(id: number) {
  const person = await db.select().from(people).where(eq(people.id, id)).limit(1);
  if (!person[0]) throw new Error("Person not found");
  const newStay = !person[0].stay;
  if (!newStay) {
    // Remove from teams
    await db.delete(teamMembers).where(eq(teamMembers.personId, id));
  }
  await db.update(people).set({ stay: newStay }).where(eq(people.id, id));
  return { ...person[0], stay: newStay };
}

export async function setTeamLead(id: number) {
  const person = await db.select().from(people).where(eq(people.id, id)).limit(1);
  if (!person[0]) throw new Error("Person not found");
  const newVal = !person[0].isTeamLead;
  await db.update(people).set({ isTeamLead: newVal }).where(eq(people.id, id));
  return { ...person[0], isTeamLead: newVal };
}

export async function getTeamLeads() {
  return db.select().from(people).where(eq(people.isTeamLead, true)).orderBy(people.name);
}

// ── Teams ─────────────────────────────────────────────────────────────────────
export async function listTeams(zones?: string[], areas?: string[]) {
  const allTeams = await db.select().from(teams).orderBy(teams.name);
  const allMembers = await db
    .select({ teamId: teamMembers.teamId, person: people })
    .from(teamMembers)
    .innerJoin(people, eq(teamMembers.personId, people.id));

  const memberMap = new Map<number, Person[]>();
  for (const row of allMembers) {
    const list = memberMap.get(row.teamId) ?? [];
    list.push(row.person);
    memberMap.set(row.teamId, list);
  }

  let result = allTeams.map((t) => ({ ...t, members: memberMap.get(t.id) ?? [] }));

  if (zones && zones.length > 0) {
    result = result.filter((t) => t.zone && zones.includes(t.zone));
  }
  if (areas && areas.length > 0) {
    result = result.filter((t) =>
      (memberMap.get(t.id) ?? []).some((m) => m.area && areas.includes(m.area))
    );
  }

  return result;
}

export async function getTeamById(id: number) {
  const team = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
  if (!team[0]) return null;
  const members = await db
    .select({ person: people })
    .from(teamMembers)
    .innerJoin(people, eq(teamMembers.personId, people.id))
    .where(eq(teamMembers.teamId, id));
  return { ...team[0], members: members.map((m) => m.person) };
}

export async function getNextTeamNumber(): Promise<number> {
  const allTeams = await db.select({ name: teams.name }).from(teams);
  const nums = allTeams
    .map((t) => {
      const m = t.name.match(/^Team\s+(\d+)$/i);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => n > 0);
  if (nums.length === 0) return 1;
  let n = 1;
  while (nums.includes(n)) n++;
  return n;
}

export async function listAvailablePeople(zones?: string[]) {
  // stay=true and not on any team
  const assignedIds = await db
    .select({ personId: teamMembers.personId })
    .from(teamMembers);
  const assignedSet = new Set(assignedIds.map((r) => r.personId));

  const conditions = [eq(people.stay, true)];
  if (zones && zones.length > 0) {
    conditions.push(inArray(people.zone, zones as any[]));
  }

  const all = await db
    .select()
    .from(people)
    .where(and(...conditions))
    .orderBy(people.name);

  return all.filter((p) => !assignedSet.has(p.id));
}

export async function getAssignedPersonIds(): Promise<number[]> {
  const rows = await db.select({ personId: teamMembers.personId }).from(teamMembers);
  return rows.map((r) => r.personId);
}

export async function createTeam(
  memberIds: number[],
  name?: string,
  createdByUserId?: number,
  allowedZones?: string[]
) {
  if (memberIds.length < 2 || memberIds.length > 8) {
    throw new Error("Team must have 2–8 members");
  }

  const members = await db
    .select()
    .from(people)
    .where(inArray(people.id, memberIds));

  if (members.length !== memberIds.length) {
    throw new Error("Some members not found");
  }

  const zones = [...new Set(members.map((m) => m.zone))];
  if (zones.length > 1) throw new Error("All members must be from the same zone");

  const zone = zones[0];
  if (allowedZones && !allowedZones.includes(zone)) {
    throw new Error("You don't have access to this zone");
  }

  const notStay = members.filter((m) => !m.stay);
  if (notStay.length > 0) {
    throw new Error(`These members don't have stay=true: ${notStay.map((m) => m.name).join(", ")}`);
  }

  // Check not already on a team
  const existingMembers = await db
    .select()
    .from(teamMembers)
    .where(inArray(teamMembers.personId, memberIds));
  if (existingMembers.length > 0) {
    throw new Error("Some members are already on a team");
  }

  const teamName = name?.trim() || `Team ${await getNextTeamNumber()}`;

  const [result] = await db
    .insert(teams)
    .values({ name: teamName, zone: zone as any, createdByUserId })
    .$returningId();

  await db.insert(teamMembers).values(memberIds.map((pid) => ({ teamId: result.id, personId: pid })));

  return getTeamById(result.id);
}

export async function updateTeam(
  id: number,
  name?: string,
  memberIds?: number[],
  allowedZones?: string[]
) {
  const existing = await getTeamById(id);
  if (!existing) throw new Error("Team not found");

  if (allowedZones && existing.zone && !allowedZones.includes(existing.zone)) {
    throw new Error("You don't have access to this team's zone");
  }

  if (name) {
    await db.update(teams).set({ name }).where(eq(teams.id, id));
  }

  if (memberIds) {
    if (memberIds.length < 2 || memberIds.length > 8) {
      throw new Error("Team must have 2–8 members");
    }

    const members = await db
      .select()
      .from(people)
      .where(inArray(people.id, memberIds));

    if (members.length !== memberIds.length) throw new Error("Some members not found");

    const zones = [...new Set(members.map((m) => m.zone))];
    if (zones.length > 1) throw new Error("All members must be from the same zone");

    const zone = zones[0];
    if (allowedZones && !allowedZones.includes(zone)) {
      throw new Error("You don't have access to this zone");
    }

    const notStay = members.filter((m) => !m.stay);
    if (notStay.length > 0) throw new Error("All members must have stay=true");

    // Check existing members of OTHER teams
    const currentMemberIds = existing.members.map((m) => m.id);
    const newMemberIds = memberIds.filter((id) => !currentMemberIds.includes(id));
    if (newMemberIds.length > 0) {
      const alreadyOnTeam = await db
        .select()
        .from(teamMembers)
        .where(and(inArray(teamMembers.personId, newMemberIds), ne(teamMembers.teamId, id)));
      if (alreadyOnTeam.length > 0) throw new Error("Some members are already on another team");
    }

    await db.delete(teamMembers).where(eq(teamMembers.teamId, id));
    await db.insert(teamMembers).values(memberIds.map((pid) => ({ teamId: id, personId: pid })));
    await db.update(teams).set({ zone: zone as any }).where(eq(teams.id, id));
  }

  return getTeamById(id);
}

export async function deleteTeam(id: number) {
  // Release hotel slots
  await db.update(hotelSlots).set({ teamId: null }).where(eq(hotelSlots.teamId, id));
  // Remove members
  await db.delete(teamMembers).where(eq(teamMembers.teamId, id));
  // Delete team
  await db.delete(teams).where(eq(teams.id, id));
}

export async function movePlayerBetweenTeams(
  personId: number,
  sourceTeamId: number,
  destTeamId: number
) {
  const [sourceTeam, destTeam] = await Promise.all([
    getTeamById(sourceTeamId),
    getTeamById(destTeamId),
  ]);

  if (!sourceTeam) throw new Error("Source team not found");
  if (!destTeam) throw new Error("Destination team not found");

  if (sourceTeam.members.length <= 2) {
    throw new Error("Source team would go below minimum 2 members");
  }
  if (destTeam.members.length >= 6) {
    throw new Error("Destination team is at maximum capacity (6) for moves");
  }

  const person = sourceTeam.members.find((m) => m.id === personId);
  if (!person) throw new Error("Person not found in source team");

  if (destTeam.zone && person.zone !== destTeam.zone) {
    throw new Error("Cannot move player to a team in a different zone");
  }

  await db
    .update(teamMembers)
    .set({ teamId: destTeamId })
    .where(and(eq(teamMembers.personId, personId), eq(teamMembers.teamId, sourceTeamId)));

  // Update destination team zone if needed
  if (!destTeam.zone) {
    await db.update(teams).set({ zone: person.zone as any }).where(eq(teams.id, destTeamId));
  }
}

// ── Hotels ────────────────────────────────────────────────────────────────────
async function createSlotsForHotel(hotelId: number, count: number, startFrom = 1) {
  const slots = [];
  for (let i = startFrom; i <= count; i++) {
    slots.push({ hotelId, slotNumber: i });
  }
  if (slots.length > 0) {
    await db.insert(hotelSlots).values(slots);
  }
}

export async function listHotels() {
  const allHotels = await db.select().from(hotels).orderBy(hotels.name);
  const allSlots = await db
    .select({
      slot: hotelSlots,
      team: teams,
    })
    .from(hotelSlots)
    .leftJoin(teams, eq(hotelSlots.teamId, teams.id))
    .orderBy(hotelSlots.slotNumber);

  return allHotels.map((h) => ({
    ...h,
    slots: allSlots
      .filter((s) => s.slot.hotelId === h.id)
      .map((s) => ({ ...s.slot, team: s.team })),
  }));
}

export async function getHotelById(id: number) {
  const hotel = await db.select().from(hotels).where(eq(hotels.id, id)).limit(1);
  if (!hotel[0]) return null;

  const slots = await db
    .select({ slot: hotelSlots, team: teams })
    .from(hotelSlots)
    .leftJoin(teams, eq(hotelSlots.teamId, teams.id))
    .where(eq(hotelSlots.hotelId, id))
    .orderBy(hotelSlots.slotNumber);

  return {
    ...hotel[0],
    slots: slots.map((s) => ({ ...s.slot, team: s.team })),
  };
}

export async function createHotel(input: InsertHotel) {
  const [result] = await db.insert(hotels).values(input).$returningId();
  await createSlotsForHotel(result.id, input.totalSlots ?? 8);
  return getHotelById(result.id);
}

export async function updateHotel(id: number, input: Partial<InsertHotel>) {
  const existing = await db.select().from(hotels).where(eq(hotels.id, id)).limit(1);
  if (!existing[0]) throw new Error("Hotel not found");

  await db.update(hotels).set(input).where(eq(hotels.id, id));

  if (input.totalSlots && input.totalSlots > existing[0].totalSlots) {
    // Add new slots
    await createSlotsForHotel(id, input.totalSlots, existing[0].totalSlots + 1);
  } else if (input.totalSlots && input.totalSlots < existing[0].totalSlots) {
    // Remove extra slots (only empty ones from the end)
    const extraSlots = await db
      .select()
      .from(hotelSlots)
      .where(
        and(
          eq(hotelSlots.hotelId, id),
          isNull(hotelSlots.teamId),
          sql`${hotelSlots.slotNumber} > ${input.totalSlots}`
        )
      );
    if (extraSlots.length > 0) {
      await db
        .delete(hotelSlots)
        .where(
          inArray(
            hotelSlots.id,
            extraSlots.map((s) => s.id)
          )
        );
    }
  }

  return getHotelById(id);
}

export async function deleteHotel(id: number) {
  await db.delete(hotelSlots).where(eq(hotelSlots.hotelId, id));
  await db.delete(hotels).where(eq(hotels.id, id));
}

export async function assignTeamToSlot(slotId: number, teamId: number) {
  const slot = await db.select().from(hotelSlots).where(eq(hotelSlots.id, slotId)).limit(1);
  if (!slot[0]) throw new Error("Slot not found");
  if (slot[0].teamId) throw new Error("Slot already occupied");

  // Check team not already in this hotel
  const hotelId = slot[0].hotelId;
  const existing = await db
    .select()
    .from(hotelSlots)
    .where(and(eq(hotelSlots.hotelId, hotelId), eq(hotelSlots.teamId, teamId)));
  if (existing.length > 0) throw new Error("Team already assigned to this hotel");

  await db.update(hotelSlots).set({ teamId }).where(eq(hotelSlots.id, slotId));
}

export async function unassignTeamFromSlot(slotId: number) {
  await db.update(hotelSlots).set({ teamId: null, roomNumber: null }).where(eq(hotelSlots.id, slotId));
}

export async function listAvailableTeamsForHotel(hotelId: number) {
  const assignedInHotel = await db
    .select({ teamId: hotelSlots.teamId })
    .from(hotelSlots)
    .where(and(eq(hotelSlots.hotelId, hotelId), sql`${hotelSlots.teamId} IS NOT NULL`));

  const assignedIds = assignedInHotel.map((r) => r.teamId!);

  let query = db.select().from(teams);
  if (assignedIds.length > 0) {
    query = query.where(
      sql`${teams.id} NOT IN (${sql.join(assignedIds.map((id) => sql`${id}`), sql`, `)})`
    ) as any;
  }

  return query.orderBy(teams.name);
}

// ── Assignments ───────────────────────────────────────────────────────────────
export async function listAssignments(zones?: string[]) {
  const allHotels = await db.select().from(hotels).orderBy(hotels.name);

  const slotsQuery = await db
    .select({
      slot: hotelSlots,
      team: teams,
    })
    .from(hotelSlots)
    .leftJoin(teams, eq(hotelSlots.teamId, teams.id))
    .orderBy(hotelSlots.slotNumber);

  const memberRows = await db
    .select({ teamId: teamMembers.teamId, person: people })
    .from(teamMembers)
    .innerJoin(people, eq(teamMembers.personId, people.id));

  const memberMap = new Map<number, Person[]>();
  for (const row of memberRows) {
    const list = memberMap.get(row.teamId) ?? [];
    list.push(row.person);
    memberMap.set(row.teamId, list);
  }

  return allHotels.map((h) => ({
    ...h,
    slots: slotsQuery
      .filter((s) => s.slot.hotelId === h.id && s.slot.teamId !== null)
      .filter((s) => {
        if (!zones || zones.length === 0) return true;
        return s.team?.zone && zones.includes(s.team.zone);
      })
      .map((s) => ({
        ...s.slot,
        team: s.team
          ? { ...s.team, members: memberMap.get(s.team.id) ?? [] }
          : null,
      })),
  }));
}

export async function updateSlotRoomNumber(slotId: number, roomNumber: string | null) {
  await db.update(hotelSlots).set({ roomNumber }).where(eq(hotelSlots.id, slotId));
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export async function getDashboardStats(zones?: string[]) {
  const conditions = zones && zones.length > 0 ? [inArray(people.zone, zones as any[])] : [];

  const [
    totalPeople,
    stayPeople,
    teamMemberCount,
    totalTeams,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(people)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
    db
      .select({ count: sql<number>`count(*)` })
      .from(people)
      .where(
        conditions.length > 0
          ? and(eq(people.stay, true), ...conditions)
          : eq(people.stay, true)
      ),
    db
      .select({ count: sql<number>`count(distinct ${teamMembers.personId})` })
      .from(teamMembers)
      .innerJoin(people, eq(teamMembers.personId, people.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined),
    db.select({ count: sql<number>`count(*)` }).from(teams),
  ]);

  return {
    totalPeople: Number(totalPeople[0]?.count ?? 0),
    stay: Number(stayPeople[0]?.count ?? 0),
    assignedToTeams: Number(teamMemberCount[0]?.count ?? 0),
    totalTeams: Number(totalTeams[0]?.count ?? 0),
  };
}

export async function getEnhancedDashboardStats() {
  const allPeople = await db.select().from(people);
  const allTeams = await db.select().from(teams);
  const allMembers = await db.select().from(teamMembers);
  const allHotels = await db.select().from(hotels);
  const allSlots = await db.select().from(hotelSlots);

  const assignedPersonIds = new Set(allMembers.map((m) => m.personId));

  const acoCount = allPeople.filter((p) => p.stay).length;
  const assignedToTeamCount = allPeople.filter((p) => assignedPersonIds.has(p.id)).length;
  const acoUnassignedCount = allPeople.filter(
    (p) => p.stay && !assignedPersonIds.has(p.id)
  ).length;

  const filledSlots = allSlots.filter((s) => s.teamId !== null).length;
  const roomAssigned = allSlots.filter((s) => s.teamId !== null && s.roomNumber !== null).length;

  // Per-zone stats
  const ZONES = ["North", "South", "East", "West", "Central"];
  const teamZoneMap = new Map(allTeams.map((t) => [t.id, t.zone]));

  // Slot assignment per team
  const teamSlotMap = new Map<number, { hotelName: string; roomNumber: string | null }[]>();
  for (const slot of allSlots) {
    if (slot.teamId) {
      const hotel = allHotels.find((h) => h.id === slot.hotelId);
      const list = teamSlotMap.get(slot.teamId) ?? [];
      list.push({ hotelName: hotel?.name ?? "", roomNumber: slot.roomNumber });
      teamSlotMap.set(slot.teamId, list);
    }
  }

  const assignedTeamIds = new Set(allSlots.filter((s) => s.teamId).map((s) => s.teamId!));

  const zoneTeamComparison = ZONES.map((zone) => {
    const zonePeople = allPeople.filter((p) => p.zone === zone);
    const zoneAco = zonePeople.filter((p) => p.stay);
    const zoneTeams = allTeams.filter((t) => t.zone === zone);
    const zoneAssigned = zoneTeams.filter((t) => assignedTeamIds.has(t.id));
    return {
      zone,
      people: zonePeople.length,
      acoCount: zoneAco.length,
      teams: zoneTeams.length,
      assigned: zoneAssigned.length,
      unassigned: zoneTeams.length - zoneAssigned.length,
    };
  });

  const hotelOccupancy = allHotels.map((h) => {
    const hotelSlotList = allSlots.filter((s) => s.hotelId === h.id);
    const filled = hotelSlotList.filter((s) => s.teamId !== null);

    // Zone breakdown
    const zoneSlots: Record<string, number> = {};
    for (const slot of filled) {
      if (slot.teamId) {
        const zone = teamZoneMap.get(slot.teamId);
        if (zone) {
          zoneSlots[zone] = (zoneSlots[zone] ?? 0) + 1;
        }
      }
    }

    return {
      name: h.name,
      total: h.totalSlots,
      filled: filled.length,
      zoneSlots,
    };
  });

  return {
    acoCount,
    assignedToTeamCount,
    acoUnassignedCount,
    filledSlots,
    roomAssigned,
    totalPeople: allPeople.length,
    totalTeams: allTeams.length,
    zoneTeamComparison,
    hotelOccupancy,
  };
}

// ── Users / Admin ─────────────────────────────────────────────────────────────
export async function listUsers() {
  return db.select().from(users).orderBy(users.name);
}

export async function getUserByOpenId(openId: string) {
  const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return rows[0] ?? null;
}

export async function createUser(input: {
  openId: string;
  name?: string;
  email?: string;
  loginMethod?: string;
}) {
  const [result] = await db
    .insert(users)
    .values({ ...input, lastSignedIn: new Date() })
    .$returningId();
  const user = await db.select().from(users).where(eq(users.id, result.id)).limit(1);
  return user[0];
}

export async function setUserRole(userId: number, role: string) {
  await db.update(users).set({ role: role as any }).where(eq(users.id, userId));
}

export async function getZoneAssignments() {
  return db.select().from(zoneAssignments);
}

export async function assignZone(userId: number, zone: string) {
  // Check max 10 leads per zone
  const existing = await db
    .select()
    .from(zoneAssignments)
    .where(eq(zoneAssignments.zone, zone as any));
  if (existing.length >= 10) throw new Error("Maximum 10 zone leads per zone");

  await db
    .insert(zoneAssignments)
    .values({ userId, zone: zone as any })
    .onDuplicateKeyUpdate({ set: { zone: zone as any } });
}

export async function removeZone(userId: number, zone: string) {
  await db
    .delete(zoneAssignments)
    .where(and(eq(zoneAssignments.userId, userId), eq(zoneAssignments.zone, zone as any)));
}

export async function getAreaAssignments() {
  return db.select().from(areaAssignments);
}

export async function assignArea(userId: number, zone: string, area: string) {
  await db
    .insert(areaAssignments)
    .values({ userId, zone: zone as any, area })
    .onDuplicateKeyUpdate({ set: { area } });
}

export async function removeArea(userId: number, zone: string, area: string) {
  await db
    .delete(areaAssignments)
    .where(
      and(
        eq(areaAssignments.userId, userId),
        eq(areaAssignments.zone, zone as any),
        eq(areaAssignments.area, area)
      )
    );
}

export async function removeAllAreasForUser(userId: number) {
  await db.delete(areaAssignments).where(eq(areaAssignments.userId, userId));
}

export async function removeAllAreasForUserZone(userId: number, zone: string) {
  await db
    .delete(areaAssignments)
    .where(and(eq(areaAssignments.userId, userId), eq(areaAssignments.zone, zone as any)));
}

export async function bulkAssignZoneArea(
  userIds: number[],
  zone: string,
  area: string
) {
  for (const userId of userIds) {
    await assignArea(userId, zone, area);
  }
}

export async function getZoneSummary() {
  const ZONES = ["North", "South", "East", "West", "Central"];
  const allZoneAssignments = await db.select().from(zoneAssignments);
  return ZONES.map((zone) => ({
    zone,
    count: allZoneAssignments.filter((a) => a.zone === zone).length,
  }));
}

export async function getUserZones(userId: number) {
  const rows = await db
    .select()
    .from(zoneAssignments)
    .where(eq(zoneAssignments.userId, userId));
  return rows.map((r) => r.zone);
}

export async function getUserAreas(userId: number) {
  return db.select().from(areaAssignments).where(eq(areaAssignments.userId, userId));
}

// ── Audit Log ─────────────────────────────────────────────────────────────────
export async function createAuditLogEntries(
  entries: Array<{
    userId: number;
    userName: string;
    userRole: string;
    action: "create" | "update" | "delete";
    targetId: number;
    targetName: string;
    field?: string;
    oldValue?: string;
    newValue?: string;
  }>
) {
  if (entries.length === 0) return;
  await db.insert(auditLog).values(entries);
}

export async function listAuditLog(limit = 50, offset = 0) {
  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(auditLog)
      .orderBy(sql`${auditLog.createdAt} DESC`)
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(auditLog),
  ]);

  return {
    data: rows,
    total: Number(countResult[0]?.count ?? 0),
  };
}

// ── Final List ────────────────────────────────────────────────────────────────
export async function getFinalList() {
  const allPeople = await db.select().from(people).orderBy(people.name);
  const allTeams = await db.select().from(teams);
  const allMembers = await db.select().from(teamMembers);
  const allHotels = await db.select().from(hotels);
  const allSlots = await db.select().from(hotelSlots);

  const personTeamMap = new Map<number, number>();
  for (const m of allMembers) {
    personTeamMap.set(m.personId, m.teamId);
  }

  const teamSlotMap = new Map<
    number,
    { hotel: (typeof allHotels)[0]; slot: (typeof allSlots)[0] }
  >();
  for (const slot of allSlots) {
    if (slot.teamId) {
      const hotel = allHotels.find((h) => h.id === slot.hotelId);
      if (hotel) {
        teamSlotMap.set(slot.teamId, { hotel, slot });
      }
    }
  }

  return allPeople.map((p) => {
    const teamId = personTeamMap.get(p.id);
    const team = teamId ? allTeams.find((t) => t.id === teamId) : undefined;
    const hotelAssignment = teamId ? teamSlotMap.get(teamId) : undefined;

    let status: "Unassigned" | "In Team" | "Hotel Assigned" | "Room Assigned" = "Unassigned";
    if (team) {
      status = "In Team";
      if (hotelAssignment) {
        status = "Hotel Assigned";
        if (hotelAssignment.slot.roomNumber) {
          status = "Room Assigned";
        }
      }
    }

    return {
      ...p,
      team: team ?? null,
      hotel: hotelAssignment?.hotel ?? null,
      slot: hotelAssignment?.slot ?? null,
      pipelineStatus: status,
    };
  });
}
