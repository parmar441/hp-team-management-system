import { router, scopedProcedure } from "../trpc.js";
import { getDashboardStats, getEnhancedDashboardStats } from "../helpers.js";

export const dashboardRouter = router({
  stats: scopedProcedure.query(async ({ ctx }) => {
    const { scopedZones } = ctx as any;
    return getDashboardStats(scopedZones.length > 0 ? scopedZones : undefined);
  }),

  enhancedStats: scopedProcedure.query(async () => {
    return getEnhancedDashboardStats();
  }),
});
