import { router } from "../trpc.js";
import { peopleRouter } from "./people.js";
import { teamsRouter } from "./teams.js";
import { hotelsRouter } from "./hotels.js";
import { assignmentsRouter } from "./assignments.js";
import { adminRouter } from "./admin.js";
import { dashboardRouter } from "./dashboard.js";
import { teamLeadRouter } from "./teamLead.js";
import { finalListRouter } from "./finalList.js";

export const appRouter = router({
  people: peopleRouter,
  teams: teamsRouter,
  hotels: hotelsRouter,
  assignments: assignmentsRouter,
  admin: adminRouter,
  dashboard: dashboardRouter,
  teamLead: teamLeadRouter,
  finalList: finalListRouter,
});

export type AppRouter = typeof appRouter;
