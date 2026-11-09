import { CATEGORY_NAME } from "./menu-data";
import { dayKey, round2 } from "./format";
import type { Order, OrderSource, StoreState } from "./types";

export type Range = "today" | "7d" | "30d";
export const RANGE_DAYS: Record<Range, number> = { today: 1, "7d": 7, "30d": 30 };
export const RANGE_LABEL: Record<Range, string> = { today: "Today", "7d": "7 days", "30d": "30 days" };

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

/** [start, end) for the current period and the one before it. */
export function periods(range: Range, now = new Date()) {
  const days = RANGE_DAYS[range];
  const end = range === "today" ? now : new Date(startOfDay(now).getTime() + 864e5);
  const start = new Date(startOfDay(now).getTime() - (days - 1) * 864e5);
  const prevStart = new Date(start.getTime() - days * 864e5);
  // For "today", compare against the same time-of-day yesterday.
  const prevEnd = range === "today" ? new Date(now.getTime() - 864e5) : start;
  return { start, end, prevStart, prevEnd, days };
}

export const inRange = (o: Order, a: Date, b: Date) => { const t = new Date(o.createdAt).getTime(); return t >= a.getTime() && t < b.getTime(); };
export const counted = (o: Order) => o.status !== "cancelled";

export function summarize(orders: Order[]) {
  const ok = orders.filter(counted);
  const sales = round2(ok.reduce((a, o) => a + o.subtotal, 0));
  return {
    orders: ok.length,
    sales,
    gross: round2(ok.reduce((a, o) => a + o.total, 0)),
    tax: round2(ok.reduce((a, o) => a + o.tax, 0)),
    tips: round2(ok.reduce((a, o) => a + o.tip, 0)),
    deliveryFees: round2(ok.reduce((a, o) => a + o.deliveryFee, 0)),
    refunds: round2(orders.filter((o) => o.paymentStatus === "refunded").reduce((a, o) => a + o.total, 0)),
    cancelled: orders.length - ok.length,
    aov: ok.length ? round2(sales / ok.length) : 0,
    cash: round2(ok.filter((o) => o.payment === "cash").reduce((a, o) => a + o.total, 0)),
    card: round2(ok.filter((o) => o.payment === "card").reduce((a, o) => a + o.total, 0)),
  };
}

export const pct = (cur: number, prev: number) => (prev ? ((cur - prev) / prev) * 100 : null);

export function trafficIn(s: StoreState, a: Date, b: Date) {
  const t = { visits: 0, menuViews: 0, carts: 0, checkouts: 0 };
  for (let d = new Date(startOfDay(a)); d < b; d = new Date(d.getTime() + 864e5)) {
    const x = s.traffic[dayKey(d)];
    if (x) { t.visits += x.visits; t.menuViews += x.menuViews; t.carts += x.carts; t.checkouts += x.checkouts; }
  }
  return t;
}

/** Daily (or hourly for "today") sales series. */
export function salesSeries(orders: Order[], range: Range, now = new Date()) {
  if (range === "today") {
    return Array.from({ length: 12 }, (_, i) => {
      const h = 10 + i;
      const os = orders.filter((o) => counted(o) && new Date(o.createdAt).getHours() === h);
      return { label: `${((h + 11) % 12) + 1}${h >= 12 ? "p" : "a"}`, sales: round2(os.reduce((a, o) => a + o.subtotal, 0)), orders: os.length };
    });
  }
  const { start, days } = periods(range, now);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start.getTime() + i * 864e5);
    const k = dayKey(d);
    const os = orders.filter((o) => counted(o) && dayKey(o.createdAt) === k);
    return { key: k, label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), sales: round2(os.reduce((a, o) => a + o.subtotal, 0)), orders: os.length };
  });
}

export function topItems(orders: Order[], n = 6) {
  const m = new Map<string, { name: string; qty: number; sales: number }>();
  orders.filter(counted).forEach((o) => o.items.forEach((l) => {
    const x = m.get(l.itemId) ?? { name: l.name, qty: 0, sales: 0 };
    x.qty += l.quantity; x.sales += l.unitPrice * l.quantity;
    m.set(l.itemId, x);
  }));
  return [...m.values()].sort((a, b) => b.sales - a.sales).slice(0, n).map((x) => ({ ...x, sales: round2(x.sales) }));
}

export function byCategory(orders: Order[]) {
  const m = new Map<string, number>();
  orders.filter(counted).forEach((o) => o.items.forEach((l) => m.set(l.category, (m.get(l.category) ?? 0) + l.unitPrice * l.quantity)));
  return [...m.entries()].map(([k, v]) => ({ name: CATEGORY_NAME[k as keyof typeof CATEGORY_NAME] ?? k, sales: round2(v) })).sort((a, b) => b.sales - a.sales);
}

export const SOURCE_LABEL: Record<OrderSource, string> = { website: "Website", doordash: "DoorDash", "walk-in": "Walk-in", phone: "Phone" };
export function bySource(orders: Order[]) {
  const ok = orders.filter(counted);
  return (Object.keys(SOURCE_LABEL) as OrderSource[]).map((s) => {
    const os = ok.filter((o) => o.source === s);
    return { name: SOURCE_LABEL[s], orders: os.length, sales: round2(os.reduce((a, o) => a + o.subtotal, 0)) };
  });
}

export function byHour(orders: Order[]) {
  return Array.from({ length: 12 }, (_, i) => {
    const h = 10 + i;
    return { label: `${((h + 11) % 12) + 1}${h >= 12 ? "p" : "a"}`, orders: orders.filter((o) => counted(o) && new Date(o.createdAt).getHours() === h).length };
  });
}
