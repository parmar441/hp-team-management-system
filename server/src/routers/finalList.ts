import { router, scopedProcedure } from "../trpc.js";
import { getFinalList } from "../helpers.js";

export const finalListRouter = router({
  list: scopedProcedure.query(async ({ ctx }) => {
    const { scopedZones } = ctx as any;
    const all = await getFinalList();
    if (scopedZones.length > 0) {
      return all.filter((p) => scopedZones.includes(p.zone));
    }
    return all;
  }),
});
