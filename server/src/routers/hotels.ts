import { z } from "zod";
import { router, adminProcedure } from "../trpc.js";
import {
  listHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
  assignTeamToSlot,
  unassignTeamFromSlot,
  listAvailableTeamsForHotel,
} from "../helpers.js";

export const hotelsRouter = router({
  list: adminProcedure.query(async () => {
    return listHotels();
  }),

  get: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getHotelById(input.id);
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        address: z.string().optional().nullable(),
        totalSlots: z.number().min(2).max(64).default(8),
        status: z.enum(["upcoming", "not_available", "available"]).default("upcoming"),
      })
    )
    .mutation(async ({ input }) => {
      return createHotel(input as any);
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        address: z.string().optional().nullable(),
        totalSlots: z.number().min(2).max(64).optional(),
        status: z.enum(["upcoming", "not_available", "available"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...rest } = input;
      return updateHotel(id, rest as any);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteHotel(input.id);
      return { success: true };
    }),

  assignTeam: adminProcedure
    .input(z.object({ slotId: z.number(), teamId: z.number() }))
    .mutation(async ({ input }) => {
      await assignTeamToSlot(input.slotId, input.teamId);
      return { success: true };
    }),

  unassignTeam: adminProcedure
    .input(z.object({ slotId: z.number() }))
    .mutation(async ({ input }) => {
      await unassignTeamFromSlot(input.slotId);
      return { success: true };
    }),

  availableTeams: adminProcedure
    .input(z.object({ hotelId: z.number() }))
    .query(async ({ input }) => {
      return listAvailableTeamsForHotel(input.hotelId);
    }),
});
