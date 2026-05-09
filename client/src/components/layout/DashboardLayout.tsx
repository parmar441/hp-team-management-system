import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  List,
  UsersRound,
  Building2,
  ClipboardList,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SIDEBAR_DEFAULT = 280;
const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 480;

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["admin", "zone_lead", "area_lead", "user"] },
];

const WORKFLOW_ITEMS: NavItem[] = [
  { label: "People", href: "/people", icon: Users, roles: ["admin", "zone_lead", "area_lead"] },
  { label: "List", href: "/list", icon: List, roles: ["admin", "zone_lead", "area_lead"] },
  { label: "Teams", href: "/teams", icon: UsersRound, roles: ["admin", "zone_lead", "area_lead"] },
  { label: "Hotels", href: "/hotels", icon: Building2, roles: ["admin"] },
  { label: "Assignments", href: "/assignments", icon: ClipboardList, roles: ["admin", "zone_lead", "area_lead"] },
  { label: "Final List", href: "/final-list", icon: FileText, roles: ["admin", "zone_lead", "area_lead"] },
];

const SETTINGS_ITEMS: NavItem[] = [
  { label: "Admin Panel", href: "/admin", icon: Settings, roles: ["admin"] },
];

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const [location] = useLocation();
  const isActive =
    item.href === "/"
      ? location === "/"
      : location.startsWith(item.href);

  const Icon = item.icon;

  return (
    <Link href={item.href}>
      <a
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px]",
          isActive
            ? "bg-[--color-sidebar-accent] text-white"
            : "text-[--color-sidebar-foreground] hover:bg-[--color-sidebar-accent] hover:text-white"
        )}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </a>
    </Link>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = localStorage.getItem("sidebarWidth");
    return stored ? parseInt(stored, 10) : SIDEBAR_DEFAULT;
  });
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const resizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  useEffect(() => {
    localStorage.setItem("sidebarWidth", String(sidebarWidth));
  }, [sidebarWidth]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    resizing.current = true;
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [sidebarWidth]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizing.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidth.current + delta));
      setSidebarWidth(newWidth);
    };
    const onMouseUp = () => {
      resizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
  };

  if (!user) return null;

  const role = user.role;
  const visibleWorkflow = WORKFLOW_ITEMS.filter((item) => item.roles.includes(role));
  const visibleSettings = SETTINGS_ITEMS.filter((item) => item.roles.includes(role));
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const roleColors: Record<string, string> = {
    admin: "blue",
    zone_lead: "purple",
    area_lead: "amber",
    user: "slate",
  };

  const sidebarContent = (
    <div
      className="flex flex-col h-full bg-[--color-sidebar] text-[--color-sidebar-foreground]"
      style={{ width: collapsed ? 64 : sidebarWidth }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!collapsed && (
          <h1 className="text-lg font-bold font-display text-white truncate">
            Accommodation Seva
          </h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-[--color-sidebar-accent] text-[--color-sidebar-foreground] transition-colors ml-auto"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleNav.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} />
        ))}

        {visibleWorkflow.length > 0 && (
          <>
            {!collapsed && (
              <p className="text-xs font-semibold uppercase tracking-wider text-[--color-sidebar-foreground]/50 px-3 pt-4 pb-1">
                Workflow
              </p>
            )}
            {collapsed && <div className="border-t border-white/10 my-2" />}
            {visibleWorkflow.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} />
            ))}
          </>
        )}

        {visibleSettings.length > 0 && (
          <>
            {!collapsed && (
              <p className="text-xs font-semibold uppercase tracking-wider text-[--color-sidebar-foreground]/50 px-3 pt-4 pb-1">
                Settings
              </p>
            )}
            {collapsed && <div className="border-t border-white/10 my-2" />}
            {visibleSettings.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} />
            ))}
          </>
        )}
      </nav>

      {/* User Profile */}
      <div className="border-t border-white/10 p-3">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
            {(user.name ?? user.email ?? "U")[0]?.toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.name ?? user.email}
              </p>
              <Badge
                variant={roleColors[role] as any}
                className="text-xs mt-0.5"
              >
                {role.replace("_", " ")}
              </Badge>
            </div>
          )}
        </div>
        <div className={cn("flex gap-1 mt-2", collapsed ? "flex-col items-center" : "flex-row")}>
          <button
            onClick={toggleDark}
            className="p-2 rounded-md hover:bg-[--color-sidebar-accent] text-[--color-sidebar-foreground] transition-colors"
            title={darkMode ? "Light mode" : "Dark mode"}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-md hover:bg-[--color-sidebar-accent] text-[--color-sidebar-foreground] transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex relative shrink-0">
        {sidebarContent}
        {/* Resize handle */}
        {!collapsed && (
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 transition-colors"
            onMouseDown={handleMouseDown}
          />
        )}
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-[280px]">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center gap-3 p-4 border-b border-border bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold font-display truncate">
            Accommodation Seva
          </h1>
        </div>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
