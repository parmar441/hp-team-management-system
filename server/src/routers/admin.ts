import { z } from "zod";
import { router, adminProcedure } from "../trpc.js";
import {
  listUsers,
  setUserRole,
  getZoneAssignments,
  assignZone,
  removeZone,
  getAreaAssignments,
  assignArea,
  removeArea,
  removeAllAreasForUser,
  removeAllAreasForUserZone,
  bulkAssignZoneArea,
  getZoneSummary,
  listAuditLog,
} from "../helpers.js";

export const adminRouter = router({
  listUsers: adminProcedure.query(async () => {
    return listUsers();
  }),

  setRole: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["user", "admin", "zone_lead", "area_lead"]),
      })
    )
    .mutation(async ({ input }) => {
      await setUserRole(input.userId, input.role);
      return { success: true };
    }),

  zoneAssignments: adminProcedure.query(async () => {
    return getZoneAssignments();
  }),

  assignZone: adminProcedure
    .input(z.object({ userId: z.number(), zone: z.string() }))
    .mutation(async ({ input }) => {
      await assignZone(input.userId, input.zone);
      return { success: true };
    }),

  removeZone: adminProcedure
    .input(z.object({ userId: z.number(), zone: z.string() }))
    .mutation(async ({ input }) => {
      await removeZone(input.userId, input.zone);
      return { success: true };
    }),

  zoneSummary: adminProcedure.query(async () => {
    return getZoneSummary();
  }),

  areaAssignments: adminProcedure.query(async () => {
    return getAreaAssignments();
  }),

  assignArea: adminProcedure
    .input(z.object({ userId: z.number(), zone: z.string(), area: z.string() }))
    .mutation(async ({ input }) => {
      await assignArea(input.userId, input.zone, input.area);
      return { success: true };
    }),

  removeArea: adminProcedure
    .input(z.object({ userId: z.number(), zone: z.string(), area: z.string() }))
    .mutation(async ({ input }) => {
      await removeArea(input.userId, input.zone, input.area);
      return { success: true };
    }),

  removeAllAreasForUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await removeAllAreasForUser(input.userId);
      return { success: true };
    }),

  removeAllAreasForUserZone: adminProcedure
    .input(z.object({ userId: z.number(), zone: z.string() }))
    .mutation(async ({ input }) => {
      await removeAllAreasForUserZone(input.userId, input.zone);
      return { success: true };
    }),

  bulkAssignZoneArea: adminProcedure
    .input(
      z.object({
        userIds: z.array(z.number()),
        zone: z.string(),
        area: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await bulkAssignZoneArea(input.userIds, input.zone, input.area);
      return { success: true };
    }),

  auditLog: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      return listAuditLog(input.limit, input.offset);
    }),
});
