import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, ChefHat, ExternalLink, Inbox, LayoutDashboard, LogOut, Menu as MenuIcon, Settings, ShieldCheck, UtensilsCrossed, Users, Wallet, X } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { useNewOrderAlerts } from "@/hooks/use-new-order-alerts";
import { can, homeFor, signOut, useSession, type Permission } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Staff } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Khan House — Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const NAV: { to: string; label: string; Icon: typeof LayoutDashboard; perm: Permission }[] = [
  { to: "/admin", label: "Overview", Icon: LayoutDashboard, perm: "overview" },
  { to: "/admin/orders", label: "Orders", Icon: ChefHat, perm: "orders" },
  { to: "/admin/menu", label: "Menu", Icon: UtensilsCrossed, perm: "menu" },
  { to: "/admin/finance", label: "Finance", Icon: Wallet, perm: "finance" },
  { to: "/admin/customers", label: "Customers", Icon: Users, perm: "customers" },
  { to: "/admin/messages", label: "Messages", Icon: Inbox, perm: "messages" },
  { to: "/admin/staff", label: "Staff & Roles", Icon: ShieldCheck, perm: "staff" },
  { to: "/admin/settings", label: "Settings", Icon: Settings, perm: "settings" },
];

function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, ready } = useSession();
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (ready && !user && !isLogin) navigate({ to: "/admin/login", replace: true });
  }, [ready, user, isLogin, navigate]);

  if (isLogin) return <Outlet />;
  if (!ready || !user) return <div className="flex min-h-screen items-center justify-center bg-ink"><Logo className="animate-pulse text-2xl" /></div>;
  return <Shell user={user} />;
}

function Shell({ user }: { user: Staff }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const newCount = useNewOrderAlerts();
  const unread = useStore((s) => s.messages.filter((m) => !m.read).length);
  const accepting = useStore((s) => s.settings.acceptingOrders);
  useEffect(() => setOpen(false), [pathname]);

  const current = NAV.filter((n) => n.to === "/admin" ? pathname === "/admin" || pathname === "/admin/" : pathname.startsWith(n.to))[0];
  const allowed = !current || can(user.role, current.perm);
  const items = NAV.filter((n) => can(user.role, n.perm));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Link to="/" className="text-sm"><Logo /></Link>
        <button className="text-white/70 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
      </div>
      <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs">
        <span className={cn("h-2 w-2 rounded-full", accepting ? "bg-leaf pulse-ring" : "bg-white/40")} />
        <span className="text-white/80">{accepting ? "Accepting online orders" : "Online ordering paused"}</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ to, label, Icon }) => {
          const active = current?.to === to;
          const badge = to === "/admin/orders" ? newCount : to === "/admin/messages" ? unread : 0;
          return (
            <Link key={to} to={to} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition", active ? "bg-fire text-white" : "text-white/70 hover:bg-white/5 hover:text-white")}>
              <Icon className="h-[18px] w-[18px]" />{label}
              {badge > 0 && <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold", active ? "bg-white text-fire" : "bg-fire text-white")}>{badge}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <a href="/" target="_blank" rel="noreferrer" className="mb-3 flex items-center gap-2 text-xs text-white/60 hover:text-white"><ExternalLink className="h-3.5 w-3.5" />View live website</a>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-fire-gradient font-bold text-ink">{user.name[0]}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="text-xs text-white/50">{ROLE_LABEL[user.role]}</p>
          </div>
          <button onClick={() => { signOut(); navigate({ to: "/admin/login" }); }} aria-label="Sign out" className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-smoke">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-ink lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-ink">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-smoke/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2"><MenuIcon className="h-5 w-5" /></button>
          <span className="font-display text-2xl tracking-wide">{current?.label ?? "Dashboard"}</span>
          {newCount > 0 && <Link to="/admin/orders" className="ml-auto rounded-full bg-fire px-3 py-1 text-xs font-bold text-white">{newCount} new</Link>}
        </header>
        <main className="mx-auto max-w-[1400px] p-4 md:p-8">
          {allowed ? <Outlet /> : (
            <div className="mx-auto mt-20 max-w-md rounded-2xl bg-card p-8 text-center ring-1 ring-border">
              <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 font-display text-3xl tracking-wide">No access</p>
              <p className="mt-2 text-sm text-muted-foreground">Your role ({ROLE_LABEL[user.role]}) can't open this page. Ask the owner if you need access.</p>
              <Link to={homeFor(user.role)} className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white">Go to my dashboard</Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
