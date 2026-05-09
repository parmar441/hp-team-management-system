import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, UserCheck, UsersRound, Building2, Key } from "lucide-react";
import { cn } from "@/lib/utils";

function PipelineStep({
  label,
  count,
  total,
  color,
  icon: Icon,
  isLast = false,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  icon: React.ElementType;
  isLast?: boolean;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className={cn("flex flex-col items-center p-4 rounded-xl border min-w-[130px]", color)}>
        <Icon className="h-5 w-5 mb-1" />
        <span className="text-2xl font-bold">{count.toLocaleString()}</span>
        <span className="text-xs font-medium mt-0.5">{label}</span>
        <span className="text-xs opacity-70">{pct}%</span>
      </div>
      {!isLast && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
    </div>
  );
}

const ZONE_COLORS: Record<string, string> = {
  North: "bg-blue-100 text-blue-700",
  South: "bg-emerald-100 text-emerald-700",
  East: "bg-amber-100 text-amber-700",
  West: "bg-purple-100 text-purple-700",
  Central: "bg-rose-100 text-rose-700",
};

export default function HomePage() {
  const { user } = useAuth();
  const { data: enhanced, isLoading } = trpc.dashboard.enhancedStats.useQuery();

  if (user?.role === "zone_lead") {
    return <TeamLeadDashboard />;
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-32" />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const d = enhanced;
  if (!d) return null;

  const total = d.totalPeople;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of the accommodation pipeline
        </p>
      </div>

      {/* Pipeline Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workflow Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 items-center">
            <PipelineStep
              label="Total People"
              count={d.totalPeople}
              total={total}
              color="bg-slate-100 text-slate-700 border-slate-200"
              icon={Users}
            />
            <PipelineStep
              label="ACO Players"
              count={d.acoCount}
              total={total}
              color="bg-blue-50 text-blue-700 border-blue-200"
              icon={UserCheck}
            />
            <PipelineStep
              label="In Teams"
              count={d.assignedToTeamCount}
              total={total}
              color="bg-amber-50 text-amber-700 border-amber-200"
              icon={UsersRound}
            />
            <PipelineStep
              label="Hotel Assigned"
              count={d.filledSlots}
              total={total}
              color="bg-purple-50 text-purple-700 border-purple-200"
              icon={Building2}
            />
            <PipelineStep
              label="Room Assigned"
              count={d.roomAssigned ?? 0}
              total={total}
              color="bg-emerald-50 text-emerald-700 border-emerald-200"
              icon={Key}
              isLast
            />
          </div>
        </CardContent>
      </Card>

      {/* Zone Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Zone Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-semibold">Zone</th>
                  <th className="text-right py-2 font-semibold">Total People</th>
                  <th className="text-right py-2 font-semibold">ACO Yes</th>
                  <th className="text-right py-2 font-semibold">In Teams</th>
                  <th className="text-right py-2 font-semibold">Hotel Assigned</th>
                  <th className="text-right py-2 font-semibold">Unassigned</th>
                </tr>
              </thead>
              <tbody>
                {d.zoneTeamComparison.map((z) => (
                  <tr key={z.zone} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-2">
                      <Badge
                        className={cn("text-xs", ZONE_COLORS[z.zone])}
                        variant="outline"
                      >
                        {z.zone}
                      </Badge>
                    </td>
                    <td className="text-right py-2">{z.people}</td>
                    <td className="text-right py-2">{z.acoCount}</td>
                    <td className="text-right py-2">{z.teams}</td>
                    <td className="text-right py-2">{z.assigned}</td>
                    <td className="text-right py-2">
                      <span className={z.unassigned > 0 ? "text-amber-600 font-medium" : ""}>
                        {z.unassigned}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Hotel Overview */}
      {d.hotelOccupancy.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hotel Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-semibold">Hotel Name</th>
                    <th className="text-right py-2 font-semibold">Total Slots</th>
                    <th className="text-right py-2 font-semibold">Filled</th>
                    <th className="text-right py-2 font-semibold">Remaining</th>
                    <th className="text-left py-2 font-semibold pl-4">Zone Breakdown</th>
                  </tr>
                </thead>
                <tbody>
                  {d.hotelOccupancy.map((h) => (
                    <tr key={h.name} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2 font-medium">{h.name}</td>
                      <td className="text-right py-2">{h.total}</td>
                      <td className="text-right py-2">{h.filled}</td>
                      <td className="text-right py-2">
                        <span className={h.total - h.filled > 0 ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
                          {h.total - h.filled}
                        </span>
                      </td>
                      <td className="py-2 pl-4">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(h.zoneSlots).map(([zone, count]) => (
                            <Badge
                              key={zone}
                              className={cn("text-xs", ZONE_COLORS[zone])}
                              variant="outline"
                            >
                              {zone}: {count}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TeamLeadDashboard() {
  const { data: stats, isLoading } = trpc.teamLead.stats.useQuery();
  const { data: zones } = trpc.teamLead.myZones.useQuery();

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Zone Dashboard</h1>
        <div className="flex flex-wrap gap-2 mt-2">
          {(zones ?? []).map((z) => (
            <Badge key={z} className={cn("text-sm", ZONE_COLORS[z])} variant="outline">
              {z} Zone
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total People", value: stats?.totalPeople ?? 0, icon: Users, color: "text-slate-700" },
          { label: "ACO Players", value: stats?.stay ?? 0, icon: UserCheck, color: "text-blue-600" },
          { label: "In Teams", value: stats?.assignedToTeams ?? 0, icon: UsersRound, color: "text-amber-600" },
          { label: "Teams", value: stats?.totalTeams ?? 0, icon: Building2, color: "text-purple-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <s.icon className={cn("h-6 w-6", s.color)} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
