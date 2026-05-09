import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  router,
  publicProcedure,
  adminProcedure,
  scopedProcedure,
  protectedProcedure,
} from "../trpc.js";
import {
  listPeople,
  createPerson,
  updatePerson,
  deletePerson,
  bulkCreatePeople,
  bulkDeletePeople,
  bulkToggleStay,
  bulkUpdatePeopleFields,
  toggleStay,
  setTeamLead,
  getTeamLeads,
  createAuditLogEntries,
} from "../helpers.js";

const personInput = z.object({
  name: z.string().min(1),
  gender: z.enum(["M", "F"]),
  ageGroup: z.enum(["Child", "Teen", "Adult", "Senior"]),
  zone: z.enum(["North", "South", "East", "West", "Central"]),
  stay: z.boolean().optional(),
  isTeamLead: z.boolean().optional(),
  area: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export const peopleRouter = router({
  list: scopedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(400).default(50),
        search: z.string().optional(),
        zones: z.array(z.string()).optional(),
        areas: z.array(z.string()).optional(),
        gender: z.string().optional(),
        ageGroup: z.string().optional(),
        stay: z.boolean().optional(),
        country: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { scopedZones, scopedAreas } = ctx as any;

      // Merge scope with user filters
      let zones = input.zones ?? [];
      let areas = input.areas ?? [];

      if (scopedZones.length > 0) {
        zones = zones.length > 0 ? zones.filter((z) => scopedZones.includes(z)) : scopedZones;
      }
      if (scopedAreas.length > 0) {
        areas = areas.length > 0 ? areas.filter((a) => scopedAreas.includes(a)) : scopedAreas;
      }

      return listPeople({ ...input, zones, areas });
    }),

  create: adminProcedure.input(personInput).mutation(async ({ input }) => {
    return createPerson(input as any);
  }),

  toggleStay: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return toggleStay(input.id);
    }),

  update: scopedProcedure
    .input(
      z.object({
        id: z.number(),
        updatedAt: z.date().optional(),
        data: z.object({
          name: z.string().optional(),
          gender: z.enum(["M", "F"]).optional(),
          ageGroup: z.enum(["Child", "Teen", "Adult", "Senior"]).optional(),
          zone: z.enum(["North", "South", "East", "West", "Central"]).optional(),
          stay: z.boolean().optional(),
          isTeamLead: z.boolean().optional(),
          area: z.string().optional().nullable(),
          location: z.string().optional().nullable(),
          country: z.string().optional().nullable(),
          category: z.string().optional().nullable(),
          note: z.string().optional().nullable(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user!;
      let allowedData = { ...input.data };

      // Field-level access control
      if (user.role === "zone_lead") {
        allowedData = {
          area: input.data.area,
          category: input.data.category,
          note: input.data.note,
        } as any;
      } else if (user.role === "area_lead") {
        allowedData = {
          category: input.data.category,
          note: input.data.note,
        } as any;
      }

      // Get old values for audit log
      const { listPeople: lp } = await import("../helpers.js");
      const oldRecord = await (
        await import("../helpers.js")
      ).listPeople({ page: 1, pageSize: 1 });

      const updated = await updatePerson(input.id, allowedData as any, input.updatedAt);

      // Log changes
      const logEntries = [];
      for (const [field, newVal] of Object.entries(allowedData)) {
        if (newVal !== undefined) {
          logEntries.push({
            userId: user.id,
            userName: user.name ?? "Unknown",
            userRole: user.role,
            action: "update" as const,
            targetId: input.id,
            targetName: updated?.name ?? "",
            field,
            newValue: String(newVal ?? ""),
          });
        }
      }
      if (logEntries.length > 0) {
        await createAuditLogEntries(logEntries);
      }

      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deletePerson(input.id);
      return { success: true };
    }),

  bulkCreate: adminProcedure
    .input(
      z.object({
        people: z.array(personInput).max(500),
      })
    )
    .mutation(async ({ input }) => {
      await bulkCreatePeople(input.people as any[]);
      return { count: input.people.length };
    }),

  setTeamLead: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return setTeamLead(input.id);
    }),

  teamLeads: publicProcedure.query(async () => {
    return getTeamLeads();
  }),

  bulkDelete: publicProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      await bulkDeletePeople(input.ids);
      return { count: input.ids.length };
    }),

  bulkToggleStay: publicProcedure
    .input(z.object({ ids: z.array(z.number()), stay: z.boolean() }))
    .mutation(async ({ input }) => {
      await bulkToggleStay(input.ids, input.stay);
      return { count: input.ids.length };
    }),

  bulkUpdateFields: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
        zone: z.string().optional(),
        area: z.string().nullable().optional(),
        category: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await bulkUpdatePeopleFields(input.ids, {
        zone: input.zone,
        area: input.area,
        category: input.category,
      });
      return { count: input.ids.length };
    }),
});
