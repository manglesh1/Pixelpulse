"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { http } from "@/lib/http";
import { cn } from "@/lib/utils";
import {
  Home,
  Gamepad2,
  Grid3X3,
  Users,
  Trophy,
  Zap,
  Cog,
  BarChart3,
  Shield,
  LogOut,
  MapPin,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

type User = { email: string; role: "admin" | "user" | "manager" };

const MAIN_NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/games-variants", label: "Game Variants", icon: Grid3X3 },
  { href: "/players", label: "Players", icon: Users },
  { href: "/player-scores", label: "Player Scores", icon: Trophy },
  { href: "/smart-devices", label: "Smart Devices", icon: Zap },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/config", label: "Config", icon: Cog },
  { href: "/locations", label: "Locations", icon: MapPin },
] as const;

const SECONDARY_NAV = [
  { href: "/settings", label: "Settings", icon: Cog },
] as const;

const COLLAPSED_WIDTH = 90;
const EXPANDED_WIDTH = 256;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(false);

  function applySidebarWidth(isCollapsed: boolean) {
    const w = isCollapsed ? `${COLLAPSED_WIDTH}px` : `${EXPANDED_WIDTH}px`;
    document.documentElement.style.setProperty("--sidebar-w", w);
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await http.get("/me", { withCredentials: true });
        setUser(res.data);
      } catch {
        setUser(null);
      }
    })();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pp.sidebar.collapsed");
      const v = raw === "1";
      setCollapsed(v);
      applySidebarWidth(v);
    } catch {}
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("pp.sidebar.collapsed", next ? "1" : "0");
      } catch {}
      applySidebarWidth(next);
      return next;
    });
  }

  async function onLogout() {
    try {
      setLoadingLogout(true);
      await http.post("/logout", {}, { withCredentials: true });
      router.push("/login");
    } finally {
      setLoadingLogout(false);
    }
  }

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r bg-background md:block transition-[width] duration-200"
        )}
        style={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
      >
        {/* Brand + collapse button */}
        <div className="px-3 py-3 border-b">
          <div
            className={cn(
              "flex items-center",
              collapsed ? "justify-center" : "justify-between"
            )}
          >
            <div
              className={cn(
                "flex items-center gap-2",
                collapsed && "justify-center"
              )}
            >
              <Image
                src="/logo.svg"
                alt="Pixelpulse"
                width={24}
                height={24}
                className="shrink-0"
              />
              {!collapsed && (
                <div className="text-sm font-medium text-muted-foreground">
                  Pixelpulse Admin
                </div>
              )}
            </div>
            {!collapsed ? (
              <button
                aria-label="Collapse sidebar"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted/60"
                onClick={toggleCollapsed}
                title="Collapse"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            ) : (
              <button
                aria-label="Expand sidebar"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted/60 absolute right-1"
                onClick={toggleCollapsed}
                title="Expand"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Main */}
        <Section title="Main" collapsed={collapsed}>
          <nav className="px-2 py-2 space-y-1">
            {MAIN_NAV.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href || pathname?.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    collapsed ? "justify-center" : "",
                    active
                      ? "bg-blue-900 text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  title={collapsed ? label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              );
            })}
          </nav>
        </Section>

        {/* Admin */}
        {user?.role === "admin" && (
          <Section title="Admin" collapsed={collapsed}>
            <nav className="px-2 py-2 space-y-1">
              <Link
                href="/admin-page"
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  collapsed ? "justify-center" : "",
                  pathname?.startsWith("/admin-page")
                    ? "bg-indigo-600 text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                title={collapsed ? "Admin" : undefined}
              >
                <Shield className="h-4 w-4" />
                {!collapsed && <span className="truncate">Admin</span>}
              </Link>
            </nav>
          </Section>
        )}

        {/* Settings */}
        <Section title="Settings" collapsed={collapsed}>
          <nav className="px-2 py-2 space-y-1">
            {SECONDARY_NAV.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href || pathname?.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    collapsed ? "justify-center" : "",
                    active
                      ? "bg-indigo-600 text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  title={collapsed ? label : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              );
            })}
          </nav>
        </Section>

        {/* Account footer */}
        <div className="absolute inset-x-0 bottom-0 px-3 py-3 border-t">
          {user ? (
            collapsed ? (
              <div className="flex items-center justify-center">
                <button
                  onClick={onLogout}
                  className="inline-flex items-center gap-1 rounded-md p-2 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  aria-label="Logout"
                  disabled={loadingLogout}
                  title={`Logout ${user.email}`}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.email}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.role}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  aria-label="Logout"
                  disabled={loadingLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            )
          ) : (
            <Link
              href="/login"
              className={cn(
                "rounded-md text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                collapsed ? "block text-center py-2" : "block px-3 py-2"
              )}
              title={collapsed ? "Login" : undefined}
            >
              {collapsed ? <span>Login</span> : "Login"}
            </Link>
          )}
        </div>
      </aside>

      {/* MOBILE BOTTOM BAR */}
      <MobileBottomBar user={user} onLogout={onLogout} />
    </>
  );
}

function Section({
  title,
  children,
  collapsed,
}: {
  title: string;
  children: React.ReactNode;
  collapsed?: boolean;
}) {
  return (
    <section className="border-t first:border-t-0">
      {!collapsed ? (
        <div className="px-4 pt-3 text-xs font-medium tracking-wide text-muted-foreground/80">
          {title}
        </div>
      ) : (
        <div className="pt-3" />
      )}
      {children}
    </section>
  );
}

type TabOption = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "default" | "secondary";
};

function MobileBottomBar({
  user,
  onLogout,
}: {
  user: User | null;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  function isActive(path: string, routes: string[]) {
    return routes.some((r) =>
      r === "/" ? path === "/" : path === r || path.startsWith(r + "/")
    );
  }

  return (
    <div
      className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      <nav className="mx-auto grid max-w-xl grid-cols-5">
        <TabSheet
          label="Home"
          icon={Home}
          active={isActive(pathname ?? "", ["/", "/smart-devices", "/config"])}
          options={[
            { label: "Dashboard", href: "/", icon: Home },
            { label: "Smart Devices", href: "/smart-devices", icon: Zap },
            { label: "Config", href: "/config", icon: Cog },
            { label: "Locations", href: "/locations", icon: MapPin },
          ]}
        />

        <TabSheet
          label="Games"
          icon={Gamepad2}
          active={isActive(pathname ?? "", ["/games", "/games-variants"])}
          options={[
            { label: "All Games", href: "/games", icon: Gamepad2 },
            { label: "Game Variants", href: "/games-variants", icon: Grid3X3 },
          ]}
        />

        <TabSheet
          label="Players"
          icon={Users}
          active={isActive(pathname ?? "", ["/players", "/player-scores"])}
          options={[
            { label: "Players", href: "/players", icon: Users },
            { label: "Player Scores", href: "/player-scores", icon: Trophy },
          ]}
        />

        <TabSheet
          label="Analytics"
          icon={BarChart3}
          active={isActive(pathname ?? "", ["/analytics"])}
          options={[{ label: "Overview", href: "/analytics", icon: BarChart3 }]}
        />

        <TabSheet
          label="Account"
          icon={UserIcon}
          active={isActive(pathname ?? "", [
            "/settings",
            "/admin-page",
            "/login",
          ])}
          options={[
            ...(user
              ? [
                  { label: "Settings", href: "/settings", icon: Cog },
                  ...(user.role === "admin"
                    ? [
                        {
                          label: "Admin",
                          href: "/admin-page",
                          icon: Shield,
                        },
                      ]
                    : []),
                  {
                    label: "Logout",
                    onClick: onLogout,
                    icon: LogOut,
                    variant: "secondary" as const,
                  },
                ]
              : [
                  {
                    label: "Log in",
                    href: "/login",
                    icon: UserIcon,
                  },
                ]),
          ]}
        />
      </nav>
    </div>
  );
}

function TabSheet({
  label,
  icon: Icon,
  options,
  active,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  options: TabOption[];
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-2 text-xs",
            active
              ? "text-indigo-600"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label={label}
        >
          <Icon className="h-5 w-5" />
          <span className="truncate">{label}</span>
        </button>
      </SheetTrigger>

      <SheetContent side="bottom" className="max-h-[70vh]">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <SheetTitle className="text-base">{label}</SheetTitle>
          </div>
          <SheetDescription className="mt-1">
            Choose an option.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {options.map(
            ({ label: text, href, onClick, icon: OptIcon, variant }, idx) => {
              const Inner = (
                <div
                  className={cn(
                    "w-full rounded-md border px-3 py-2 text-center text-sm hover:bg-muted/50 flex items-center justify-center gap-2",
                    variant === "secondary" ? "bg-muted/30" : ""
                  )}
                >
                  {OptIcon ? <OptIcon className="h-4 w-4" /> : null}
                  <span className="truncate">{text}</span>
                </div>
              );

              if (href) {
                return (
                  <SheetClose asChild key={idx}>
                    <Link href={href}>{Inner}</Link>
                  </SheetClose>
                );
              }

              return (
                <SheetClose asChild key={idx}>
                  <button onClick={onClick} className="text-left">
                    {Inner}
                  </button>
                </SheetClose>
              );
            }
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
