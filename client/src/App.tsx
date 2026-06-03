import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMe } from "./hooks/useAuth";
import DashboardLayout from "./components/layout/DashboardLayout";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import PeoplePage from "./pages/PeoplePage";
import ListPage from "./pages/ListPage";
import TeamsPage from "./pages/TeamsPage";
import TournamentsPage from "./pages/TournamentsPage";
import AssignmentsPage from "./pages/AssignmentsPage";
import FinalListPage from "./pages/FinalListPage";
import AdminPage from "./pages/AdminPage";
import RegistrationPage from "./pages/RegistrationPage";
import DynamicZonesPage from "./pages/DynamicZonesPage";
import DynamicAreasPage from "./pages/DynamicAreasPage";
import SearchAssistantPage from "./pages/SearchAssistantPage";
import MyTeamsPage from "./pages/MyTeamsPage";
import TeamLeadDashboard from "./pages/TeamLeadDashboard";
import RoomsPage from "./pages/RoomsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { data, isLoading, isError } = useMe();
  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 gap-3">
      <div className="w-10 h-10 rounded-full border-[3px] border-gray-200 border-t-indigo-600 animate-spin" />
      <p className="text-sm text-gray-400 font-medium">Loading...</p>
    </div>
  );
  if (isError || !data?.user) return <Navigate to="/login" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function RoleRedirect() {
  const { data } = useMe();
  const role = data?.user?.role;
  if (role === "zone_lead" || role === "area_lead") return <TeamLeadDashboard />;
  return <HomePage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={<PrivateRoute><RoleRedirect /></PrivateRoute>} />
      <Route path="/registration" element={<PrivateRoute><RegistrationPage /></PrivateRoute>} />
      <Route path="/dynamic-zones" element={<PrivateRoute><DynamicZonesPage /></PrivateRoute>} />
      <Route path="/dynamic-areas" element={<PrivateRoute><DynamicAreasPage /></PrivateRoute>} />
      <Route path="/people" element={<PrivateRoute><PeoplePage /></PrivateRoute>} />
      <Route path="/list" element={<PrivateRoute><ListPage /></PrivateRoute>} />
      <Route path="/teams" element={<PrivateRoute><TeamsPage /></PrivateRoute>} />
      <Route path="/tournaments" element={<PrivateRoute><TournamentsPage /></PrivateRoute>} />
      <Route path="/assignments" element={<PrivateRoute><AssignmentsPage /></PrivateRoute>} />
      <Route path="/final-list" element={<PrivateRoute><FinalListPage /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
      <Route path="/rooms" element={<PrivateRoute><RoomsPage /></PrivateRoute>} />
      <Route path="/my-teams" element={<PrivateRoute><MyTeamsPage /></PrivateRoute>} />
      <Route path="/search-assistant" element={<PrivateRoute><SearchAssistantPage /></PrivateRoute>} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
