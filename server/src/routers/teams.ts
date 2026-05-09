import { z } from "zod";
import { router, publicProcedure, scopedProcedure } from "../trpc.js";
import {
  listTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  listAvailablePeople,
  movePlayerBetweenTeams,
} from "../helpers.js";

export const teamsRouter = router({
  list: scopedProcedure
    .input(
      z.object({
        zones: z.array(z.string()).optional(),
        areas: z.array(z.string()).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { scopedZones, scopedAreas } = ctx as any;
      let zones = input?.zones ?? [];
      let areas = input?.areas ?? [];

      if (scopedZones.length > 0) {
        zones = zones.length > 0 ? zones.filter((z: string) => scopedZones.includes(z)) : scopedZones;
      }
      if (scopedAreas.length > 0) {
        areas = areas.length > 0 ? areas.filter((a: string) => scopedAreas.includes(a)) : scopedAreas;
      }

      return listTeams(zones.length > 0 ? zones : undefined, areas.length > 0 ? areas : undefined);
    }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getTeamById(input.id);
    }),

  create: publicProcedure
    .input(
      z.object({
        memberIds: z.array(z.number()).min(2).max(8),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      return createTeam(input.memberIds, input.name, userId);
    }),

  availablePeople: publicProcedure
    .input(z.object({ zones: z.array(z.string()).optional() }).optional())
    .query(async ({ input }) => {
      return listAvailablePeople(input?.zones);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        memberIds: z.array(z.number()).min(2).max(8).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return updateTeam(input.id, input.name, input.memberIds);
    }),

  movePlayer: publicProcedure
    .input(
      z.object({
        personId: z.number(),
        sourceTeamId: z.number(),
        destTeamId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await movePlayerBetweenTeams(input.personId, input.sourceTeamId, input.destTeamId);
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteTeam(input.id);
      return { success: true };
    }),
});
