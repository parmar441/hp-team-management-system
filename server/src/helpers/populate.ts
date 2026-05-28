// Pre-defined population paths
export const POPULATE = {
  teamWithMembers: { path: "members" },
  slotWithTeam: { path: "teamId", populate: { path: "members" } },
  slotFull: [
    { path: "tournamentId" },
    { path: "teamId", populate: { path: "members" } },
  ],
  zoneRuleWithZone: { path: "zoneId" },
  areaRuleWithArea: { path: "areaId" },
  credentialWithUser: { path: "userId" },
};
