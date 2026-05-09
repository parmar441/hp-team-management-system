import { z } from "zod";
import { router, protectedProcedure, teamLeadProcedure } from "../trpc.js";
import {
  getUserZones,
  listPeople,
  listTeams,
  listAvailablePeople,
  createTeam,
  updateTeam,
  deleteTeam,
  getDashboardStats,
} from "../helpers.js";

export const teamLeadRouter = router({
  myZones: protectedProcedure.query(async ({ ctx }) => {
    return getUserZones(ctx.user.id);
  }),

  people: teamLeadProcedure.query(async ({ ctx }) => {
    const zones = ctx.assignedZones;
    return listPeople({ zones, pageSize: 400 });
  }),

  teams: teamLeadProcedure.query(async ({ ctx }) => {
    const zones = ctx.assignedZones;
    return listTeams(zones);
  }),

  availablePeople: teamLeadProcedure.query(async ({ ctx }) => {
    const zones = ctx.assignedZones;
    return listAvailablePeople(zones);
  }),

  createTeam: teamLeadProcedure
    .input(
      z.object({
        memberIds: z.array(z.number()).min(2).max(8),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createTeam(input.memberIds, input.name, ctx.user.id, ctx.assignedZones);
    }),

  updateTeam: teamLeadProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        memberIds: z.array(z.number()).min(2).max(8).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return updateTeam(input.id, input.name, input.memberIds, ctx.assignedZones);
    }),

  deleteTeam: teamLeadProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const zones = ctx.assignedZones;
      // Verify team belongs to allowed zones
      const { getTeamById } = await import("../helpers.js");
      const team = await getTeamById(input.id);
      if (!team) throw new Error("Team not found");
      if (team.zone && !zones.includes(team.zone)) {
        throw new Error("You don't have access to this team");
      }
      await deleteTeam(input.id);
      return { success: true };
    }),

  stats: teamLeadProcedure.query(async ({ ctx }) => {
    return getDashboardStats(ctx.assignedZones);
  }),
});
