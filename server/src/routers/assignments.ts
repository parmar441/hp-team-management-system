import { z } from "zod";
import { router, scopedProcedure, adminProcedure } from "../trpc.js";
import { listAssignments, updateSlotRoomNumber } from "../helpers.js";

export const assignmentsRouter = router({
  list: scopedProcedure
    .input(z.object({ zones: z.array(z.string()).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const { scopedZones } = ctx as any;
      let zones = input?.zones ?? [];
      if (scopedZones.length > 0) {
        zones = zones.length > 0 ? zones.filter((z: string) => scopedZones.includes(z)) : scopedZones;
      }
      return listAssignments(zones.length > 0 ? zones : undefined);
    }),

  updateRoomNumber: adminProcedure
    .input(z.object({ slotId: z.number(), roomNumber: z.string().nullable() }))
    .mutation(async ({ input }) => {
      await updateSlotRoomNumber(input.slotId, input.roomNumber);
      return { success: true };
    }),
});
