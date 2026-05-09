import { initTRPC, TRPCError } from "@trpc/server";
import { type Request, type Response } from "express";
import superjson from "superjson";
import { getUserZones, getUserAreas } from "./helpers.js";
import type { User } from "./schema.js";

export interface Context {
  req: Request;
  res: Response;
  user: User | null;
  assignedZones: string[];
  assignedAreas: Array<{ zone: string; area: string }>;
}

export async function createContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<Context> {
  const user = (req as any).session?.user as User | undefined;

  let assignedZones: string[] = [];
  let assignedAreas: Array<{ zone: string; area: string }> = [];

  if (user) {
    try {
      assignedZones = await getUserZones(user.id);
      const areas = await getUserAreas(user.id);
      assignedAreas = areas.map((a) => ({ zone: a.zone, area: a.area }));
    } catch {
      // ignore
    }
  }

  return { req, res, user: user ?? null, assignedZones, assignedAreas };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
  }
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const teamLeadProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
  }
  if (ctx.user.role !== "zone_lead" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Zone Lead access required" });
  }
  return next({ ctx: { ...ctx, user: ctx.user, assignedZones: ctx.assignedZones } });
});

export const scopedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
  }

  let effectiveZones: string[] = [];
  let effectiveAreas: string[] = [];

  const role = ctx.user.role;

  if (role === "admin") {
    // Admin sees everything — empty means no filter
    effectiveZones = [];
    effectiveAreas = [];
  } else if (role === "zone_lead") {
    effectiveZones = ctx.assignedZones;
    effectiveAreas = [];
  } else if (role === "area_lead") {
    effectiveZones = [...new Set(ctx.assignedAreas.map((a) => a.zone))];
    effectiveAreas = ctx.assignedAreas.map((a) => a.area);
  } else {
    // Regular user — only their own data (empty scope)
    effectiveZones = [];
    effectiveAreas = [];
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      scopedZones: effectiveZones,
      scopedAreas: effectiveAreas,
    },
  });
});
