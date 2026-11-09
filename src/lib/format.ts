import type { OrderStatus, Role } from "./types";

export const money = (n: number) => `$${(Math.round(n * 100) / 100).toFixed(2)}`;
export const money0 = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
export const round2 = (n: number) => Math.round(n * 100) / 100;

export const dayKey = (d: Date | string) => {
  const x = typeof d === "string" ? new Date(d) : d;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

export const timeAgo = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export const to12h = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New", accepted: "Accepted", preparing: "Preparing", ready: "Ready",
  out_for_delivery: "Out for Delivery", completed: "Completed", cancelled: "Cancelled",
};

export const STATUS_STYLE: Record<OrderStatus, string> = {
  new: "bg-fire text-white",
  accepted: "bg-ember/15 text-[oklch(0.5_0.17_45)]",
  preparing: "bg-gold/25 text-[oklch(0.45_0.11_75)]",
  ready: "bg-leaf/15 text-[oklch(0.42_0.12_145)]",
  out_for_delivery: "bg-sky-100 text-sky-800",
  completed: "bg-neutral-100 text-neutral-600",
  cancelled: "bg-neutral-200 text-neutral-500 line-through",
};

export const ROLE_LABEL: Record<Role, string> = { owner: "Owner", manager: "Manager", cashier: "Cashier", kitchen: "Kitchen" };
