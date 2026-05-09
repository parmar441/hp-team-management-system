import { Suspense, lazy } from "react";
import { Route, Switch, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, createTRPCClient } from "@/lib/trpc";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Toaster } from "sonner";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const PeoplePage = lazy(() => import("@/pages/PeoplePage"));
const ListPage = lazy(() => import("@/pages/ListPage"));
const TeamsPage = lazy(() => import("@/pages/TeamsPage"));
const HotelsPage = lazy(() => import("@/pages/HotelsPage"));
const AssignmentsPage = lazy(() => import("@/pages/AssignmentsPage"));
const FinalListPage = lazy(() => import("@/pages/FinalListPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));

const PageLoader = () => (
  <div className="flex h-full items-center justify-center">
    <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
  </div>
);

function RequireAuth({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Redirect to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold font-display">Access Denied</h2>
          <p className="text-muted-foreground mt-2">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (!user) {
    return (
      <Switch>
        <Route path="/login">
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        </Route>
        <Route>
          <Redirect to="/login" />
        </Route>
      </Switch>
    );
  }

  return (
    <DashboardLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/">
            <HomePage />
          </Route>

          <Route path="/people">
            <RequireAuth allowedRoles={["admin", "zone_lead", "area_lead"]}>
              <PeoplePage />
            </RequireAuth>
          </Route>

          <Route path="/list">
            <RequireAuth allowedRoles={["admin", "zone_lead", "area_lead"]}>
              <ListPage />
            </RequireAuth>
          </Route>

          <Route path="/teams">
            <RequireAuth allowedRoles={["admin", "zone_lead", "area_lead"]}>
              <TeamsPage />
            </RequireAuth>
          </Route>

          <Route path="/hotels">
            <RequireAuth allowedRoles={["admin"]}>
              <HotelsPage />
            </RequireAuth>
          </Route>

          <Route path="/assignments">
            <RequireAuth allowedRoles={["admin", "zone_lead", "area_lead"]}>
              <AssignmentsPage />
            </RequireAuth>
          </Route>

          <Route path="/final-list">
            <RequireAuth allowedRoles={["admin", "zone_lead", "area_lead"]}>
              <FinalListPage />
            </RequireAuth>
          </Route>

          <Route path="/admin">
            <RequireAuth allowedRoles={["admin"]}>
              <AdminPage />
            </RequireAuth>
          </Route>

          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      </Suspense>
    </DashboardLayout>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const trpcClient = createTRPCClient();

export default function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
