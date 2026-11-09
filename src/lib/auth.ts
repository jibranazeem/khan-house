import { useSyncExternalStore } from "react";
import { readStore, touchLogin, useStore } from "./store";
import type { Role, Staff } from "./types";

/** What each role can open in the dashboard. */
export const PERMISSIONS = {
  overview: ["owner", "manager"],
  orders: ["owner", "manager", "cashier", "kitchen"],
  menu: ["owner", "manager"],
  finance: ["owner", "manager"],
  customers: ["owner", "manager", "cashier"],
  messages: ["owner", "manager", "cashier"],
  staff: ["owner"],
  settings: ["owner", "manager"],
} satisfies Record<string, Role[]>;
export type Permission = keyof typeof PERMISSIONS;

export const ROLE_INFO: Record<Role, { summary: string; can: string[] }> = {
  owner: { summary: "Full access, including staff, roles and finances.", can: ["Everything", "Add/remove staff & change roles", "Finance & expenses", "Store settings"] },
  manager: { summary: "Runs the day: orders, menu, finances and settings.", can: ["Dashboard & reports", "Orders", "Menu & 86 items", "Finance & expenses", "Settings"] },
  cashier: { summary: "Front of house: takes and hands off orders.", can: ["Orders", "Customers", "Messages & catering"] },
  kitchen: { summary: "Kitchen display only: moves tickets through the line.", can: ["Orders (kitchen view)"] },
};

export const can = (role: Role | undefined, p: Permission) => !!role && (PERMISSIONS[p] as Role[]).includes(role);

/** First page a role lands on after signing in. */
export const homeFor = (role: Role) => (can(role, "overview") ? "/admin" : "/admin/orders");

const SESSION_KEY = "khan-house-session";
const listeners = new Set<() => void>();
let cached: string | null | undefined;

function getSessionId() {
  if (typeof window === "undefined") return null;
  if (cached === undefined) {
    try { cached = localStorage.getItem(SESSION_KEY); } catch { cached = null; }
  }
  return cached;
}
function setSessionId(id: string | null) {
  cached = id;
  try { if (id) localStorage.setItem(SESSION_KEY, id); else localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function signIn(email: string, password: string): Staff {
  const user = readStore().staff.find((s) => s.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.password !== password) throw new Error("Email or password is incorrect.");
  if (!user.active) throw new Error("This account has been deactivated. Ask the owner to re-enable it.");
  setSessionId(user.id);
  touchLogin(user.id);
  return user;
}
export const signOut = () => setSessionId(null);

/** The signed-in staff member (undefined while reading storage on first client render). */
export function useSession() {
  const id = useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    getSessionId,
    () => null,
  );
  const staff = useStore((s) => s.staff);
  const hydrated = useSyncExternalStore(() => () => {}, () => true, () => false);
  const user = id ? staff.find((s) => s.id === id && s.active) ?? null : null;
  return { user, ready: hydrated };
}
