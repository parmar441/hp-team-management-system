import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home, Users, UsersRound, Hotel, LayoutGrid, X,
  UserPlus, MapPin, Map, List, DoorOpen, ClipboardList, FileText, Settings, Sparkles, LogOut, Sun, Moon,
} from "lucide-react";

type Theme = "dark" | "light";
import { useMe, useLogout } from "../hooks/useAuth";
import { ToastProvider } from "./ui";

import MDashboard from "./screens/MDashboard";
import MPeople from "./screens/MPeople";
import MTeams from "./screens/MTeams";
import MHotels from "./screens/MHotels";
import MRegistration from "./screens/MRegistration";
import MZones from "./screens/MZones";
import MAreas from "./screens/MAreas";
import MList from "./screens/MList";
import MRooms from "./screens/MRooms";
import MAssignments from "./screens/MAssignments";
import MFinalList from "./screens/MFinalList";
import MAdmin from "./screens/MAdmin";
import MSearch from "./screens/MSearch";

type Role = "user" | "admin" | "zone_lead" | "area_lead" | "hotel_person";

interface NavItem { key: string; label: string; to: string; icon: React.ReactNode }

const ICON = (C: any) => <C className="w-[22px] h-[22px]" strokeWidth={2} />;

const SCREENS: Record<string, React.ComponentType> = {
  "/": MDashboard,
  "/people": MPeople,
  "/teams": MTeams,
  "/my-teams": MTeams,
  "/tournaments": MHotels,
  "/registration": MRegistration,
  "/dynamic-zones": MZones,
  "/dynamic-areas": MAreas,
  "/list": MList,
  "/rooms": MRooms,
  "/assignments": MAssignments,
  "/final-list": MFinalList,
  "/admin": MAdmin,
  "/search-assistant": MSearch,
};

/** Routes each role may reach (mirrors DashboardLayout RBAC). */
const ALLOWED: Record<Role, string[]> = {
  admin: ["/", "/people", "/teams", "/tournaments", "/registration", "/dynamic-zones", "/dynamic-areas", "/list", "/rooms", "/assignments", "/final-list", "/admin", "/search-assistant"],
  zone_lead: ["/", "/people", "/teams", "/dynamic-areas", "/list", "/assignments", "/final-list", "/search-assistant"],
  area_lead: ["/", "/people", "/teams", "/list", "/assignments", "/final-list", "/search-assistant"],
  hotel_person: ["/", "/rooms", "/search-assistant"],
  user: ["/", "/assignments", "/search-assistant"],
};

const ALL_MORE: NavItem[] = [
  { key: "registration", label: "Registration", to: "/registration", icon: ICON(UserPlus) },
  { key: "zones",        label: "Zones",        to: "/dynamic-zones", icon: ICON(MapPin) },
  { key: "areas",        label: "Areas",        to: "/dynamic-areas", icon: ICON(Map) },
  { key: "list",         label: "List",         to: "/list",          icon: ICON(List) },
  { key: "rooms",        label: "Rooms",        to: "/rooms",         icon: ICON(DoorOpen) },
  { key: "assignments",  label: "Assignments",  to: "/assignments",   icon: ICON(ClipboardList) },
  { key: "final",        label: "Final List",   to: "/final-list",    icon: ICON(FileText) },
  { key: "admin",        label: "Admin Panel",  to: "/admin",         icon: ICON(Settings) },
  { key: "search",       label: "Search Assistant", to: "/search-assistant", icon: ICON(Sparkles) },
];

function tabsForRole(role: Role): NavItem[] {
  const home: NavItem = { key: "home", label: "Home", to: "/", icon: ICON(Home) };
  if (role === "admin") return [
    home,
    { key: "people", label: "People", to: "/people", icon: ICON(Users) },
    { key: "teams", label: "Teams", to: "/teams", icon: ICON(UsersRound) },
    { key: "hotels", label: "Hotels", to: "/tournaments", icon: ICON(Hotel) },
  ];
  if (role === "zone_lead" || role === "area_lead") return [
    home,
    { key: "people", label: "People", to: "/people", icon: ICON(Users) },
    { key: "teams", label: "Teams", to: "/teams", icon: ICON(UsersRound) },
    { key: "final", label: "Final List", to: "/final-list", icon: ICON(FileText) },
  ];
  if (role === "hotel_person") return [
    home,
    { key: "rooms", label: "Rooms", to: "/rooms", icon: ICON(DoorOpen) },
    { key: "search", label: "Search", to: "/search-assistant", icon: ICON(Sparkles) },
  ];
  return [
    home,
    { key: "assignments", label: "Assignments", to: "/assignments", icon: ICON(ClipboardList) },
    { key: "search", label: "Search", to: "/search-assistant", icon: ICON(Sparkles) },
  ];
}

function isActive(to: string, pathname: string) {
  return to === "/" ? pathname === "/" : pathname.startsWith(to);
}

function NavButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-1 flex-1 m-press pt-1">
      <span className="flex items-center justify-center w-[52px] h-[30px] rounded-full transition-all duration-200"
        style={{ background: active ? "var(--m-accent-soft)" : "transparent", color: active ? "var(--m-accent)" : "var(--m-faint)" }}>
        {icon}
      </span>
      <span className="text-[10.5px] font-semibold leading-none transition-colors" style={{ color: active ? "var(--m-accent)" : "var(--m-faint)" }}>
        {label}
      </span>
    </button>
  );
}

function MoreSheet({ open, onClose, items, onNavigate, theme, onSetTheme }: {
  open: boolean; onClose: () => void; items: NavItem[]; onNavigate: (to: string) => void;
  theme: Theme; onSetTheme: (t: Theme) => void;
}) {
  const { data } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  if (!open) return null;
  const user = data?.user;
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div className="m-scrim absolute inset-0 bg-black/55" onClick={onClose} />
      <div className="m-sheet-panel relative max-h-[88%] flex flex-col rounded-t-[26px] border-t"
        style={{ background: "var(--m-sheet)", borderColor: "var(--m-card-border)" }}>
        <div className="pt-2.5 pb-1 flex justify-center">
          <span className="w-9 h-1 rounded-full" style={{ background: "var(--m-track)" }} />
        </div>
        <div className="flex items-center justify-between px-5 pt-1 pb-3">
          <p className="m-serif text-[20px] font-bold">More</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "var(--m-inset)", color: "var(--m-muted)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto m-no-scrollbar px-5 pb-[calc(env(safe-area-inset-bottom,0px)+18px)]">
          {items.length === 0 ? (
            <p className="text-[13px] text-[var(--m-muted)] py-6 text-center">No additional pages available.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {items.map((it) => (
                <button key={it.key} onClick={() => onNavigate(it.to)}
                  className="flex flex-col items-start gap-3 p-4 rounded-[16px] border active:brightness-95"
                  style={{ background: "var(--m-card)", borderColor: "var(--m-card-border)" }}>
                  <span className="w-10 h-10 rounded-[11px] flex items-center justify-center"
                    style={{ background: "var(--m-accent-soft)", color: "var(--m-accent)" }}>
                    {it.icon}
                  </span>
                  <span className="text-[13.5px] font-semibold text-[var(--m-text)]">{it.label}</span>
                </button>
              ))}
            </div>
          )}
          {/* Appearance */}
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--m-faint)] mt-5 mb-2 px-0.5">Appearance</p>
          <div className="flex items-center gap-1 p-1 rounded-[14px] border"
            style={{ background: "var(--m-card)", borderColor: "var(--m-card-border)" }}>
            {(["light", "dark"] as Theme[]).map((t) => {
              const on = theme === t;
              return (
                <button key={t} onClick={() => onSetTheme(t)}
                  className="flex-1 h-[42px] rounded-[11px] flex items-center justify-center gap-2 text-[13.5px] font-semibold transition-colors"
                  style={on ? { background: "var(--m-accent-soft)", color: "var(--m-accent)" } : { color: "var(--m-muted)" }}>
                  {t === "light" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} {t === "light" ? "Light" : "Dark"}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => logout.mutate(undefined, { onSuccess: () => navigate("/login") })}
            className="mt-3 w-full flex items-center justify-center gap-2 h-[48px] rounded-[14px] text-[14px] font-semibold border"
            style={{ background: "var(--m-card)", borderColor: "var(--m-card-border)", color: "var(--m-rose-fg)" }}>
            <LogOut className="w-4 h-4" /> Sign out{user?.name ? ` · ${user.name}` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MobileLayout() {
  const { data } = useMe();
  const role = (data?.user?.role ?? "user") as Role;
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() =>
    (typeof localStorage !== "undefined" && (localStorage.getItem("m-theme") as Theme)) || "dark");
  useEffect(() => { localStorage.setItem("m-theme", theme); }, [theme]);

  const allowed = ALLOWED[role] ?? ALLOWED.user;
  const tabs = tabsForRole(role);
  const moreItems = ALL_MORE.filter((it) => allowed.includes(it.to));

  const path = location.pathname;
  const Screen = SCREENS[path] ?? MDashboard;
  const canAccess = path === "/" || allowed.includes(path);

  function go(to: string) {
    setMoreOpen(false);
    if (to !== path) navigate(to);
  }

  const moreActive = !tabs.some((t) => isActive(t.to, path)) && path !== "/";

  return (
    <div className={theme === "light" ? "m-app m-light" : "m-app"}>
      <ToastProvider>
        {/* Scrollable screen content */}
        <div
          className="flex-1 overflow-y-auto m-no-scrollbar"
          style={{ paddingTop: "max(env(safe-area-inset-top,0px), 14px)", paddingBottom: "calc(80px + env(safe-area-inset-bottom,0px) + 16px)" }}
        >
          <div key={path} className="m-screen-enter px-5">
            {canAccess
              ? <Screen />
              : <div className="pt-24 text-center text-[14px] text-[var(--m-muted)]">You don't have access to this page.</div>}
          </div>
        </div>

        {/* Bottom tab bar */}
        <nav
          className="m-nav-blur absolute bottom-0 left-0 right-0 z-40 flex items-stretch border-t"
          style={{
            height: "calc(80px + env(safe-area-inset-bottom,0px))",
            paddingBottom: "env(safe-area-inset-bottom,0px)",
            borderColor: "var(--m-nav-border)",
          }}
        >
          {tabs.map((t) => (
            <NavButton key={t.key} label={t.label} icon={t.icon} active={isActive(t.to, path)} onClick={() => go(t.to)} />
          ))}
          <NavButton label="More" icon={ICON(LayoutGrid)} active={moreActive || moreOpen} onClick={() => setMoreOpen(true)} />
        </nav>

        <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} items={moreItems} onNavigate={go}
          theme={theme} onSetTheme={setTheme} />
      </ToastProvider>
    </div>
  );
}
