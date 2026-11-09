/**
 * Demo data store.
 *
 * Everything (menu, orders, staff, expenses, messages, settings, traffic) lives in one
 * object persisted to localStorage, so the full site and dashboard work with zero backend
 * setup. Open the site in one tab and /admin in another: orders placed on the site show
 * up on the dashboard instantly (the `storage` event syncs tabs).
 *
 * To go live, swap these actions for Supabase calls — the schema in
 * supabase/migrations mirrors these types one-to-one.
 */
import { useSyncExternalStore } from "react";
import { DEFAULT_MENU, DEFAULT_SETTINGS, OPTION_GROUPS } from "./menu-data";
import { dayKey, round2 } from "./format";
import type {
  Expense, ExpenseCategory, Message, MenuItem, Order, OrderLine, OrderSource, OrderStatus, OrderType,
  PaymentMethod, Settings, Staff, StoreState, TrafficDay,
} from "./types";

const KEY = "khan-house-store-v1";
const VERSION = 1;

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

/* ------------------------------------------------------------------ seed data */

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Aisha", "Omar", "Jordan", "Priya", "Marcus", "Sara", "Daniel", "Fatima", "Chris", "Layla", "Tyler", "Hassan", "Emily", "Yusuf", "Brandon", "Noor", "Kevin", "Maya", "Ali", "Jessica", "Zain", "Ashley", "Bilal", "Rachel", "Imran", "Taylor", "Hamza", "Nicole", "Samir", "Megan"];
const LAST = ["Rahman", "Smith", "Patel", "Johnson", "Khan", "Williams", "Ahmed", "Brown", "Ali", "Davis", "Hussain", "Miller", "Chaudhry", "Wilson", "Malik", "Moore", "Siddiqui", "Taylor", "Qureshi", "Anderson"];
const STREETS = ["Salem St", "Olive Chapel Rd", "Apex Peakway", "Ten Ten Rd", "Kelly Rd", "Beaver Creek Commons Dr", "Center St", "Laura Duncan Rd", "Hunter St", "Green Oaks Pkwy"];

const POPULARITY: Record<string, number> = {
  "chicken-over-rice": 10, "chicken-lamb-mix": 9, "hibachi-chicken": 9, "hibachi-chicken-shrimp": 7, "chicken-gyro": 7,
  "lamb-gyro": 5, "hibachi-shrimp": 5, "falafel-over-rice": 4, "seekh-kebabs-rice": 4, "wings-6": 6,
  "teriyaki-chicken": 4, "teriyaki-shrimp": 3, "teriyaki-chicken-shrimp": 3, "kebab-wrap": 3, "falafel-sandwich": 3, "shrimp-dumplings-6": 4,
};

function pickWeighted<T>(r: () => number, items: T[], weight: (t: T) => number) {
  const total = items.reduce((a, t) => a + weight(t), 0);
  let x = r() * total;
  for (const t of items) { x -= weight(t); if (x <= 0) return t; }
  return items[items.length - 1];
}

export function priceOrder(items: OrderLine[], type: OrderType, tip: number, s: Settings) {
  const subtotal = round2(items.reduce((a, l) => a + l.unitPrice * l.quantity, 0));
  const deliveryFee = type === "delivery" && subtotal < s.freeDeliveryOver ? s.deliveryFee : 0;
  const tax = round2(subtotal * (s.taxRate / 100));
  return { subtotal, deliveryFee, tax, tip: round2(tip), discount: 0, total: round2(subtotal + deliveryFee + tax + tip) };
}

function seedOrders(menu: MenuItem[], settings: Settings, now: Date) {
  const r = rng(20241109);
  const orders: Order[] = [];
  const traffic: Record<string, TrafficDay> = {};
  let seq = 1000;
  const DAYS = 45;
  const hourWeights = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 10, 9, 5, 3, 3, 5, 9, 10, 7, 3];

  for (let d = DAYS; d >= 0; d--) {
    const day = new Date(now);
    day.setDate(now.getDate() - d);
    day.setHours(0, 0, 0, 0);
    const dow = day.getDay();
    const growth = 0.75 + (0.25 * (DAYS - d)) / DAYS; // business trending up
    const base = (dow === 5 || dow === 6 ? 46 : dow === 0 ? 38 : 28) * growth;
    let count = Math.round(base * (0.8 + r() * 0.4));
    if (d === 0) {
      const share = hourWeights.slice(0, now.getHours() + 1).reduce((a, b) => a + b, 0) / hourWeights.reduce((a, b) => a + b, 0);
      count = Math.round(count * share);
    }
    for (let n = 0; n < count; n++) {
      const hour = pickWeighted(r, hourWeights.map((w, h) => ({ w, h })), (x) => x.w).h;
      const at = new Date(day);
      at.setHours(hour, Math.floor(r() * 60), Math.floor(r() * 60));
      if (d === 0 && at > now) at.setTime(now.getTime() - Math.floor(r() * 50) * 60_000 - 60_000);

      const lineCount = 1 + (r() < 0.45 ? 1 : 0) + (r() < 0.18 ? 1 : 0);
      const items: OrderLine[] = [];
      for (let l = 0; l < lineCount; l++) {
        const m = pickWeighted(r, menu, (x) => POPULARITY[x.id] ?? 2);
        const opts: string[] = [];
        let extra = 0;
        for (const gid of m.optionGroups) {
          const g = OPTION_GROUPS[gid];
          if (g.type === "one" && (g.required || r() < 0.5)) {
            const c = g.choices[Math.floor(r() * g.choices.length)];
            opts.push(c.label); extra += c.price;
          } else if (g.type === "many" && r() < 0.35) {
            const c = g.choices[Math.floor(r() * g.choices.length)];
            opts.push(c.label); extra += c.price;
          }
        }
        items.push({ itemId: m.id, name: m.name, category: m.category, quantity: r() < 0.82 ? 1 : 2, unitPrice: round2(m.price + extra), options: opts, instructions: "" });
      }

      const sourceRoll = r();
      const source: OrderSource = sourceRoll < 0.52 ? "website" : sourceRoll < 0.72 ? "doordash" : sourceRoll < 0.92 ? "walk-in" : "phone";
      const type: OrderType = source === "website" && r() < 0.32 ? "delivery" : source === "doordash" ? "delivery" : "pickup";
      const payment: PaymentMethod = source === "walk-in" && r() < 0.4 ? "cash" : "card";
      const pre = priceOrder(items, type, 0, settings);
      const tip = source === "doordash" ? 0 : r() < 0.6 ? round2(pre.subtotal * [0.1, 0.15, 0.18, 0.2][Math.floor(r() * 4)]) : 0;
      const priced = priceOrder(items, type, tip, settings);

      const ageMin = (now.getTime() - at.getTime()) / 60_000;
      let status: OrderStatus = "completed";
      if (r() < 0.025) status = "cancelled";
      else if (d === 0 && ageMin < 8) status = "new";
      else if (d === 0 && ageMin < 15) status = "accepted";
      else if (d === 0 && ageMin < 28) status = "preparing";
      else if (d === 0 && ageMin < 40) status = type === "delivery" ? "out_for_delivery" : "ready";

      const name = `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`;
      const phoneTail = String(Math.floor(r() * 9000 + 1000));
      seq++;
      orders.push({
        id: `seed-${seq}`, number: `KH-${seq}`, createdAt: at.toISOString(), type, source,
        customer: { name, phone: `(919) 5${String(Math.floor(r() * 90 + 10))}-${phoneTail}`, email: `${name.split(" ")[0].toLowerCase()}${phoneTail.slice(0, 2)}@example.com` },
        address: type === "delivery" ? `${Math.floor(r() * 2400 + 100)} ${STREETS[Math.floor(r() * STREETS.length)]}, Apex, NC 2750${r() < 0.5 ? 2 : 9}` : null,
        scheduledFor: null, items, ...priced, payment,
        paymentStatus: status === "cancelled" ? "refunded" : payment === "cash" && status !== "completed" ? "unpaid" : "paid",
        status, notes: "", history: [{ status: "new", at: at.toISOString(), by: "Customer" }],
      });
    }
    const dayOrders = orders.filter((o) => dayKey(o.createdAt) === dayKey(day) && o.source === "website").length;
    const visits = Math.round(dayOrders * (9 + r() * 5)) + 20;
    traffic[dayKey(day)] = {
      visits, menuViews: Math.round(visits * (0.55 + r() * 0.1)),
      carts: Math.round(dayOrders * (2 + r() * 0.6)), checkouts: Math.round(dayOrders * (1.2 + r() * 0.15)),
    };
  }
  return { orders: orders.reverse(), traffic, seq };
}

function seedExpenses(now: Date): Expense[] {
  const r = rng(77);
  const out: Expense[] = [];
  const add = (daysAgo: number, category: ExpenseCategory, amount: number, note: string) => {
    const d = new Date(now); d.setDate(now.getDate() - daysAgo);
    out.push({ id: uid(), date: dayKey(d), category, amount: round2(amount), note });
  };
  for (let w = 0; w < 7; w++) {
    add(w * 7 + 1, "Food & Ingredients", 1450 + r() * 400, "Restaurant Depot — chicken, lamb, rice, produce");
    add(w * 7 + 4, "Food & Ingredients", 620 + r() * 200, "Halal meat supplier");
    add(w * 7 + 2, "Packaging", 140 + r() * 60, "Clamshells, bags, sauce cups");
    add(w * 7 + 3, "Fuel & Propane", 120 + r() * 50, "Propane + generator fuel");
    add(w * 7 + 5, "Payroll", 1650 + r() * 250, "Weekly staff payroll");
  }
  add(12, "Permits & Fees", 325, "County health permit renewal");
  add(20, "Maintenance", 410, "Flat-top grill service");
  add(9, "Marketing", 180, "Instagram promotion");
  add(30, "Marketing", 95, "Printed menus");
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

function seedStaff(now: Date): Staff[] {
  const at = new Date(now.getTime() - 90 * 864e5).toISOString();
  return [
    { id: "staff-owner", name: "Khan (Owner)", email: "owner@khanhouse.co", password: "owner123", role: "owner", active: true, createdAt: at, lastLogin: null },
    { id: "staff-manager", name: "Adeel Malik", email: "manager@khanhouse.co", password: "manager123", role: "manager", active: true, createdAt: at, lastLogin: null },
    { id: "staff-cashier", name: "Sana Ahmed", email: "cashier@khanhouse.co", password: "cashier123", role: "cashier", active: true, createdAt: at, lastLogin: null },
    { id: "staff-kitchen", name: "Bilal Hussain", email: "kitchen@khanhouse.co", password: "kitchen123", role: "kitchen", active: true, createdAt: at, lastLogin: null },
  ];
}

function seedMessages(now: Date): Message[] {
  const ago = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString();
  const inDays = (d: number) => dayKey(new Date(now.getTime() + d * 864e5));
  return [
    { id: uid(), createdAt: ago(3), name: "Jennifer Lowe", email: "jlowe@example.com", phone: "(919) 555-0142", type: "Catering", message: "Hi! We'd love hibachi chicken & shrimp plus chicken over rice for our office lunch. Can you do a buffet setup?", eventDate: inDays(12), guests: 45, read: false },
    { id: uid(), createdAt: ago(20), name: "Ahmed Raza", email: "ahmed.r@example.com", phone: "(919) 555-0178", type: "Catering", message: "Looking for a halal caterer for a wedding mehndi night. Mixed grill platters for around 120 guests.", eventDate: inDays(34), guests: 120, read: false },
    { id: uid(), createdAt: ago(46), name: "Chris Duncan", email: "cduncan@example.com", phone: "", type: "Feedback", message: "Best chicken over rice in the Triangle, hands down. The white sauce is unreal.", eventDate: null, guests: null, read: true },
    { id: uid(), createdAt: ago(70), name: "Maria Lopez", email: "maria@example.com", phone: "(919) 555-0111", type: "General", message: "Do you have gluten-free options? Asking for my daughter.", eventDate: null, guests: null, read: true },
  ];
}

export function createSeedState(now = new Date()): StoreState {
  const menu = DEFAULT_MENU.map((m) => ({ ...m }));
  const settings = structuredClone(DEFAULT_SETTINGS);
  const { orders, traffic, seq } = seedOrders(menu, settings, now);
  return { version: VERSION, seq, menu, orders, staff: seedStaff(now), expenses: seedExpenses(now), messages: seedMessages(now), settings, traffic };
}

/** What the server renders: the real menu and settings, no customer data. */
const SERVER_STATE: StoreState = {
  version: VERSION, seq: 1000, menu: DEFAULT_MENU, orders: [], staff: [], expenses: [], messages: [], settings: DEFAULT_SETTINGS, traffic: {},
};

/* ------------------------------------------------------------------ store core */

let state: StoreState | null = null;
const getServerState = () => SERVER_STATE;
const listeners = new Set<() => void>();

function load(): StoreState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoreState;
      if (parsed.version === VERSION) return parsed;
    }
  } catch { /* storage blocked or corrupt — fall back to fresh seed */ }
  const fresh = createSeedState();
  persist(fresh);
  return fresh;
}

function persist(s: StoreState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage full or blocked: keep in memory */ }
}

function getState(): StoreState {
  if (typeof window === "undefined") return SERVER_STATE;
  if (!state) state = load();
  return state;
}

function setState(fn: (s: StoreState) => StoreState) {
  state = fn(getState());
  persist(state);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY || !e.newValue) return;
    try { state = JSON.parse(e.newValue); listeners.forEach((x) => x()); } catch { /* ignore */ }
  };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
}

export function useStore<T>(select: (s: StoreState) => T): T {
  // Snapshot the whole (referentially stable) state, then select during render, so
  // selectors may freely return new arrays/objects.
  const s = useSyncExternalStore(subscribe, getState, getServerState);
  return select(s);
}
export const readStore = getState;

/* ------------------------------------------------------------------ actions */

const now = () => new Date().toISOString();

function bumpTraffic(field: keyof TrafficDay) {
  if (typeof window === "undefined") return;
  setState((s) => {
    const k = dayKey(new Date());
    const day = s.traffic[k] ?? { visits: 0, menuViews: 0, carts: 0, checkouts: 0 };
    return { ...s, traffic: { ...s.traffic, [k]: { ...day, [field]: day[field] + 1 } } };
  });
}

export const track = {
  visit: () => {
    try { if (sessionStorage.getItem("kh-visit")) return; sessionStorage.setItem("kh-visit", "1"); } catch { /* ignore */ }
    bumpTraffic("visits");
  },
  menuView: () => bumpTraffic("menuViews"),
  addToCart: () => bumpTraffic("carts"),
  checkout: () => bumpTraffic("checkouts"),
};

export type NewOrderInput = {
  type: OrderType;
  customer: { name: string; phone: string; email: string };
  address: string | null;
  scheduledFor: string | null;
  items: OrderLine[];
  tip: number;
  payment: PaymentMethod;
  notes: string;
  source?: OrderSource;
};

export function placeOrder(input: NewOrderInput): Order {
  const s = getState();
  if (!s.settings.acceptingOrders) throw new Error("We're not taking online orders right now. Please call us.");
  // Re-price from the menu so stale cart prices are never trusted.
  const items = input.items.map((l) => {
    const m = s.menu.find((x) => x.id === l.itemId);
    if (!m || !m.available) throw new Error(`${l.name} is no longer available. Please remove it from your cart.`);
    const extra = l.options.reduce((a, label) => {
      for (const gid of m.optionGroups) {
        const c = OPTION_GROUPS[gid]?.choices.find((x) => x.label === label);
        if (c) return a + c.price;
      }
      return a;
    }, 0);
    return { ...l, name: m.name, category: m.category, unitPrice: round2(m.price + extra) };
  });
  const priced = priceOrder(items, input.type, input.tip, s.settings);
  const seq = s.seq + 1;
  const order: Order = {
    id: uid(), number: `KH-${seq}`, createdAt: now(), type: input.type, source: input.source ?? "website",
    customer: input.customer, address: input.address, scheduledFor: input.scheduledFor, items, ...priced,
    payment: input.payment, paymentStatus: input.payment === "card" ? "paid" : "unpaid",
    status: "new", notes: input.notes, history: [{ status: "new", at: now(), by: "Customer" }],
  };
  setState((st) => ({ ...st, seq, orders: [order, ...st.orders] }));
  return order;
}

export function updateOrderStatus(id: string, status: OrderStatus, by: string) {
  setState((s) => ({
    ...s,
    orders: s.orders.map((o) => o.id !== id ? o : {
      ...o, status,
      paymentStatus: status === "cancelled" && o.paymentStatus === "paid" ? "refunded" : status === "completed" && o.payment === "cash" ? "paid" : o.paymentStatus,
      history: [...o.history, { status, at: now(), by }],
    }),
  }));
}

export function markOrderPaid(id: string) {
  setState((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, paymentStatus: "paid" } : o)) }));
}

export function saveMenuItem(item: MenuItem) {
  setState((s) => ({ ...s, menu: s.menu.some((m) => m.id === item.id) ? s.menu.map((m) => (m.id === item.id ? item : m)) : [...s.menu, item] }));
}
export function deleteMenuItem(id: string) {
  setState((s) => ({ ...s, menu: s.menu.filter((m) => m.id !== id) }));
}

export function saveSettings(patch: Partial<Settings>) {
  setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
}

export function saveStaff(member: Staff) {
  setState((s) => ({ ...s, staff: s.staff.some((x) => x.id === member.id) ? s.staff.map((x) => (x.id === member.id ? member : x)) : [...s.staff, member] }));
}
export function deleteStaff(id: string) {
  setState((s) => ({ ...s, staff: s.staff.filter((x) => x.id !== id) }));
}

export function addExpense(e: Omit<Expense, "id">) {
  setState((s) => ({ ...s, expenses: [{ ...e, id: uid() }, ...s.expenses].sort((a, b) => b.date.localeCompare(a.date)) }));
}
export function deleteExpense(id: string) {
  setState((s) => ({ ...s, expenses: s.expenses.filter((x) => x.id !== id) }));
}

export function sendMessage(m: Omit<Message, "id" | "createdAt" | "read">) {
  setState((s) => ({ ...s, messages: [{ ...m, id: uid(), createdAt: now(), read: false }, ...s.messages] }));
}
export function setMessageRead(id: string, read: boolean) {
  setState((s) => ({ ...s, messages: s.messages.map((x) => (x.id === id ? { ...x, read } : x)) }));
}
export function deleteMessage(id: string) {
  setState((s) => ({ ...s, messages: s.messages.filter((x) => x.id !== id) }));
}

export function touchLogin(id: string) {
  setState((s) => ({ ...s, staff: s.staff.map((x) => (x.id === id ? { ...x, lastLogin: now() } : x)) }));
}

export function resetDemoData() {
  setState(() => createSeedState());
}

export { uid };
