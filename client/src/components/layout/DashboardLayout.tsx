import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  UserPlus,
  MapPin,
  Map,
  Users,
  List,
  UsersRound,
  Hotel,
  ClipboardList,
  FileText,
  Settings,
  MessageSquare,
  LogOut,
  Menu,
  X,
  ChevronRight,
  DoorOpen,
} from "lucide-react";
import { useMe, useLogout } from "../../hooks/useAuth";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

function getNavSections(role: string): NavSection[] {
  const base: NavItem = { label: "Dashboard", to: "/", icon: <LayoutDashboard className="w-[18px] h-[18px]" /> };

  if (role === "admin") {
    return [
      { items: [base] },
      {
        label: "Setup",
        items: [
          { label: "Registration", to: "/registration", icon: <UserPlus className="w-[18px] h-[18px]" /> },
          { label: "Zones", to: "/dynamic-zones", icon: <MapPin className="w-[18px] h-[18px]" /> },
          { label: "Areas", to: "/dynamic-areas", icon: <Map className="w-[18px] h-[18px]" /> },
        ],
      },
      {
        label: "Workflow",
        items: [
          { label: "People", to: "/people", icon: <Users className="w-[18px] h-[18px]" /> },
          { label: "List", to: "/list", icon: <List className="w-[18px] h-[18px]" /> },
          { label: "Teams", to: "/teams", icon: <UsersRound className="w-[18px] h-[18px]" /> },
          { label: "Hotels", to: "/tournaments", icon: <Hotel className="w-[18px] h-[18px]" /> },
          { label: "Rooms", to: "/rooms", icon: <DoorOpen className="w-[18px] h-[18px]" /> },
          { label: "Assignments", to: "/assignments", icon: <ClipboardList className="w-[18px] h-[18px]" /> },
          { label: "Final List", to: "/final-list", icon: <FileText className="w-[18px] h-[18px]" /> },
        ],
      },
      {
        label: "Admin",
        items: [
          { label: "Admin Panel", to: "/admin", icon: <Settings className="w-[18px] h-[18px]" /> },
          { label: "AI Assistant", to: "/search-assistant", icon: <MessageSquare className="w-[18px] h-[18px]" /> },
        ],
      },
    ];
  }

  if (role === "zone_lead") {
    return [
      { items: [base, { label: "Areas", to: "/dynamic-areas", icon: <Map className="w-[18px] h-[18px]" /> }] },
      {
        label: "Workflow",
        items: [
          { label: "People", to: "/people", icon: <Users className="w-[18px] h-[18px]" /> },
          { label: "List", to: "/list", icon: <List className="w-[18px] h-[18px]" /> },
          { label: "Teams", to: "/teams", icon: <UsersRound className="w-[18px] h-[18px]" /> },
          { label: "Assignments", to: "/assignments", icon: <ClipboardList className="w-[18px] h-[18px]" /> },
          { label: "Final List", to: "/final-list", icon: <FileText className="w-[18px] h-[18px]" /> },
        ],
      },
      { label: "Tools", items: [{ label: "AI Assistant", to: "/search-assistant", icon: <MessageSquare className="w-[18px] h-[18px]" /> }] },
    ];
  }

  if (role === "area_lead") {
    return [
      { items: [base] },
      {
        label: "Workflow",
        items: [
          { label: "People", to: "/people", icon: <Users className="w-[18px] h-[18px]" /> },
          { label: "List", to: "/list", icon: <List className="w-[18px] h-[18px]" /> },
          { label: "Teams", to: "/teams", icon: <UsersRound className="w-[18px] h-[18px]" /> },
          { label: "Assignments", to: "/assignments", icon: <ClipboardList className="w-[18px] h-[18px]" /> },
          { label: "Final List", to: "/final-list", icon: <FileText className="w-[18px] h-[18px]" /> },
        ],
      },
      { label: "Tools", items: [{ label: "AI Assistant", to: "/search-assistant", icon: <MessageSquare className="w-[18px] h-[18px]" /> }] },
    ];
  }

  if (role === "hotel_person") {
    return [
      { items: [base] },
      { label: "Workflow", items: [{ label: "Rooms", to: "/rooms", icon: <DoorOpen className="w-[18px] h-[18px]" /> }] },
      { label: "Tools", items: [{ label: "AI Assistant", to: "/search-assistant", icon: <MessageSquare className="w-[18px] h-[18px]" /> }] },
    ];
  }

  return [
    { items: [base] },
    { label: "Workflow", items: [{ label: "Assignments", to: "/assignments", icon: <ClipboardList className="w-[18px] h-[18px]" /> }] },
    { label: "Tools", items: [{ label: "AI Assistant", to: "/search-assistant", icon: <MessageSquare className="w-[18px] h-[18px]" /> }] },
  ];
}

const roleBadges: Record<string, { label: string; cls: string }> = {
  admin: { label: "Admin", cls: "bg-violet-500/20 text-violet-300" },
  zone_lead: { label: "Zone Lead", cls: "bg-sky-500/20 text-sky-300" },
  area_lead: { label: "Area Lead", cls: "bg-cyan-500/20 text-cyan-300" },
  hotel_person: { label: "Hotel Person", cls: "bg-amber-500/20 text-amber-300" },
  team_lead: { label: "Team Lead", cls: "bg-emerald-500/20 text-emerald-300" },
  user: { label: "User", cls: "bg-gray-500/20 text-gray-400" },
};

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
    <div className="flex flex-col h-full bg-[#0f172a]">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <UsersRound className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-white font-semibold text-[13px]">HP Team Manager</p>
            <p className="text-slate-500 text-[11px]">Management System</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.label && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onClose}
                      className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                        active
                          ? "bg-indigo-600/15 text-white"
                          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                      }`}
                    >
                      <span className={`transition-colors flex-shrink-0 ${active ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-400"}`}>
                        {item.icon}
                      </span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {active && <ChevronRight className="w-3 h-3 text-indigo-400/60" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="px-3 pb-3 pt-2 border-t border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[13px] font-medium truncate leading-tight">{user?.name || user?.email || "User"}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold mt-0.5 inline-block uppercase tracking-wide ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] rounded-lg transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[260px] flex-shrink-0 flex-col border-r border-gray-200/60">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[260px] shadow-2xl animate-fadeIn">
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-gray-200 shadow-soft flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <UsersRound className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">HP Team Manager</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
