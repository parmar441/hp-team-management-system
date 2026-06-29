import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, UserPlus, MapPin, Map, Users, List,
  UsersRound, Hotel, ClipboardList, FileText, Settings,
  MessageSquare, LogOut, Menu, X, ChevronRight, DoorOpen,
} from "lucide-react";
import { useMe, useLogout } from "../../hooks/useAuth";
import { useIsMobile } from "../../hooks/useIsMobile";
import MobileLayout from "../../mobile/MobileLayout";

interface NavItem { label: string; to: string; icon: React.ReactNode }
interface NavSection { label?: string; items: NavItem[] }

function getNavSections(role: string): NavSection[] {
  const base: NavItem = { label: "Dashboard", to: "/", icon: <LayoutDashboard className="w-[18px] h-[18px]" /> };

  if (role === "admin") return [
    { items: [base] },
    { label: "Setup", items: [
      { label: "Registration", to: "/registration", icon: <UserPlus className="w-[18px] h-[18px]" /> },
      { label: "Zones", to: "/dynamic-zones", icon: <MapPin className="w-[18px] h-[18px]" /> },
      { label: "Areas", to: "/dynamic-areas", icon: <Map className="w-[18px] h-[18px]" /> },
    ]},
    { label: "Workflow", items: [
      { label: "People", to: "/people", icon: <Users className="w-[18px] h-[18px]" /> },
      { label: "List", to: "/list", icon: <List className="w-[18px] h-[18px]" /> },
      { label: "Teams", to: "/teams", icon: <UsersRound className="w-[18px] h-[18px]" /> },
      { label: "Hotels", to: "/tournaments", icon: <Hotel className="w-[18px] h-[18px]" /> },
      { label: "Rooms", to: "/rooms", icon: <DoorOpen className="w-[18px] h-[18px]" /> },
      { label: "Assignments", to: "/assignments", icon: <ClipboardList className="w-[18px] h-[18px]" /> },
      { label: "Final List", to: "/final-list", icon: <FileText className="w-[18px] h-[18px]" /> },
    ]},
    { label: "Admin", items: [
      { label: "Admin Panel", to: "/admin", icon: <Settings className="w-[18px] h-[18px]" /> },
      { label: "AI Assistant", to: "/search-assistant", icon: <MessageSquare className="w-[18px] h-[18px]" /> },
    ]},
  ];

  if (role === "zone_lead") return [
    { items: [base, { label: "Areas", to: "/dynamic-areas", icon: <Map className="w-[18px] h-[18px]" /> }] },
    { label: "Workflow", items: [
      { label: "People", to: "/people", icon: <Users className="w-[18px] h-[18px]" /> },
      { label: "List", to: "/list", icon: <List className="w-[18px] h-[18px]" /> },
      { label: "Teams", to: "/teams", icon: <UsersRound className="w-[18px] h-[18px]" /> },
      { label: "Assignments", to: "/assignments", icon: <ClipboardList className="w-[18px] h-[18px]" /> },
      { label: "Final List", to: "/final-list", icon: <FileText className="w-[18px] h-[18px]" /> },
    ]},
    { label: "Tools", items: [{ label: "AI Assistant", to: "/search-assistant", icon: <MessageSquare className="w-[18px] h-[18px]" /> }] },
  ];

  if (role === "area_lead") return [
    { items: [base] },
    { label: "Workflow", items: [
      { label: "People", to: "/people", icon: <Users className="w-[18px] h-[18px]" /> },
      { label: "List", to: "/list", icon: <List className="w-[18px] h-[18px]" /> },
      { label: "Teams", to: "/teams", icon: <UsersRound className="w-[18px] h-[18px]" /> },
      { label: "Assignments", to: "/assignments", icon: <ClipboardList className="w-[18px] h-[18px]" /> },
      { label: "Final List", to: "/final-list", icon: <FileText className="w-[18px] h-[18px]" /> },
    ]},
    { label: "Tools", items: [{ label: "AI Assistant", to: "/search-assistant", icon: <MessageSquare className="w-[18px] h-[18px]" /> }] },
  ];

  if (role === "hotel_person") return [
    { items: [base] },
    { label: "Workflow", items: [{ label: "Rooms", to: "/rooms", icon: <DoorOpen className="w-[18px] h-[18px]" /> }] },
    { label: "Tools", items: [{ label: "AI Assistant", to: "/search-assistant", icon: <MessageSquare className="w-[18px] h-[18px]" /> }] },
  ];

  return [
    { items: [base] },
    { label: "Workflow", items: [{ label: "Assignments", to: "/assignments", icon: <ClipboardList className="w-[18px] h-[18px]" /> }] },
    { label: "Tools", items: [{ label: "AI Assistant", to: "/search-assistant", icon: <MessageSquare className="w-[18px] h-[18px]" /> }] },
  ];
}

function getMobileNavItems(role: string): NavItem[] {
  if (role === "admin") return [
    { label: "Home", to: "/", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "People", to: "/people", icon: <Users className="w-5 h-5" /> },
    { label: "Hotels", to: "/tournaments", icon: <Hotel className="w-5 h-5" /> },
    { label: "Admin", to: "/admin", icon: <Settings className="w-5 h-5" /> },
  ];
  if (role === "zone_lead" || role === "area_lead") return [
    { label: "Home", to: "/", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "People", to: "/people", icon: <Users className="w-5 h-5" /> },
    { label: "Teams", to: "/teams", icon: <UsersRound className="w-5 h-5" /> },
    { label: "Final List", to: "/final-list", icon: <FileText className="w-5 h-5" /> },
  ];
  if (role === "hotel_person") return [
    { label: "Home", to: "/", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Rooms", to: "/rooms", icon: <DoorOpen className="w-5 h-5" /> },
  ];
  return [
    { label: "Home", to: "/", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Assignments", to: "/assignments", icon: <ClipboardList className="w-5 h-5" /> },
  ];
}

const roleBadges: Record<string, { label: string; cls: string }> = {
  admin:        { label: "Admin",        cls: "bg-violet-500/20 text-violet-300 border border-violet-500/20" },
  zone_lead:    { label: "Zone Lead",    cls: "bg-sky-500/20 text-sky-300 border border-sky-500/20" },
  area_lead:    { label: "Area Lead",    cls: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/20" },
  hotel_person: { label: "Hotel Coordinator", cls: "bg-amber-500/20 text-amber-300 border border-amber-500/20" },
  team_lead:    { label: "Team Lead",    cls: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/20" },
  user:         { label: "User",         cls: "bg-slate-500/20 text-slate-400 border border-slate-500/20" },
};

function isActive(itemTo: string, pathname: string) {
  return itemTo === "/" ? pathname === "/" : pathname.startsWith(itemTo);
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { data } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();

  const user = data?.user;
  const role = user?.role || "user";
  const sections = getNavSections(role);
  const badge = roleBadges[role] ?? roleBadges.user;
  const initials = (user?.name || user?.email || "U").slice(0, 2).toUpperCase();

  function handleLogout() {
    logout.mutate(undefined, { onSuccess: () => navigate("/login") });
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "linear-gradient(180deg, #0d1424 0%, #0f172a 100%)" }}>
      {/* Brand */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/[0.07] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-indigo-500/30 blur-md" />
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg">
              <Hotel className="w-[18px] h-[18px] text-white" />
            </div>
          </div>
          <div className="leading-tight">
            <p className="text-white font-bold text-[14px] tracking-tight">Accommodation</p>
            <p className="text-slate-500 text-[11px]">Management System</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/[0.07] text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 no-scrollbar">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.label && (
              <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 select-none">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.to, location.pathname);
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onClose}
                      className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                        active
                          ? "bg-indigo-500/[0.18] text-white"
                          : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                      }`}
                    >
                      {/* Active left indicator */}
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-400 rounded-r-full" />
                      )}
                      <span className={`flex-shrink-0 transition-colors ${active ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                        {item.icon}
                      </span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {active && <ChevronRight className="w-3 h-3 text-indigo-400/50 flex-shrink-0" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="px-3 pb-3 pt-2 border-t border-white/[0.07] flex-shrink-0 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0 shadow-md">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[13px] font-semibold truncate leading-tight">{user?.name || user?.email || "User"}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold mt-0.5 inline-block uppercase tracking-wide ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-slate-500 hover:text-red-400 hover:bg-red-500/[0.08] rounded-xl transition-all duration-150 group"
        >
          <LogOut className="w-4 h-4 group-hover:text-red-400" />
          Sign out
        </button>
      </div>
    </div>
  );
}

function MobileBottomNav({ onMoreClick }: { onMoreClick: () => void }) {
  const { data } = useMe();
  const location = useLocation();
  const role = data?.user?.role || "user";
  const items = getMobileNavItems(role);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
      <div className="flex items-stretch h-16 pb-safe">
        {items.map((item) => {
          const active = isActive(item.to, location.pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center gap-1 flex-1 relative transition-colors"
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-600 rounded-full" />
              )}
              <div className={`p-1.5 rounded-xl transition-all ${active ? "bg-indigo-50" : ""}`}>
                <span className={active ? "text-indigo-600" : "text-gray-400"}>
                  {item.icon}
                </span>
              </div>
              <span className={`text-[10px] font-semibold leading-none ${active ? "text-indigo-600" : "text-gray-400"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
        {/* More button */}
        <button
          onClick={onMoreClick}
          className="flex flex-col items-center justify-center gap-1 flex-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <div className="p-1.5">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-semibold leading-none">More</span>
        </button>
      </div>
    </nav>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  // On phone/narrow viewports, render the dedicated dark mobile app instead of
  // the desktop dashboard chrome. Desktop layout is left untouched.
  if (isMobile) return <MobileLayout />;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f1f4f9]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[256px] flex-shrink-0 flex-col border-r border-white/[0.06]">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-[272px] shadow-2xl animate-slideInLeft">
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-gray-200/70 shadow-sm flex-shrink-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-sm">
              <Hotel className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-[15px] tracking-tight">Accommodation</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable content — pb-20 on mobile for bottom nav clearance */}
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="page-enter">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav onMoreClick={() => setSidebarOpen(true)} />
    </div>
  );
}
