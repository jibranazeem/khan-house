import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Bike, Check, ChefHat, CircleCheckBig, PackageCheck, Phone, Receipt, Search, XCircle } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { BRAND } from "@/lib/brand";
import { fmtTime, money, STATUS_LABEL, to12h } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Order, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/track")({
  validateSearch: z.object({ order: z.string().optional(), placed: z.boolean().optional() }),
  head: () => ({ meta: [{ title: `Track Your Order — ${BRAND.name}` }, { name: "robots", content: "noindex" }] }),
  component: TrackPage,
});

function TrackPage() {
  const { order: number, placed } = Route.useSearch();
  const navigate = useNavigate();
  const order = useStore((s) => (number ? s.orders.find((o) => o.number.toLowerCase() === number.trim().toLowerCase()) : undefined));
  const [q, setQ] = useState(number ?? "");

  return (
    <>
      <PageHero eyebrow={placed ? "Order received" : "Live order status"} image="/images/hero/noodles.jpg"
        title={placed && order ? <>Thanks, <span className="text-fire-gradient">{order.customer.name.split(" ")[0]}!</span></> : <>Track Your <span className="text-fire-gradient">Order</span></>}
        sub={placed && order ? `Order ${order.number} is in. This page updates live as the grill team works on it.` : "Enter your order number (e.g. KH-1234) from your confirmation."} />
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <form onSubmit={(e) => { e.preventDefault(); navigate({ to: "/track", search: { order: q.trim().toUpperCase() } }); }} className="mb-10 flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="KH-1234" aria-label="Order number"
            className="h-12 flex-1 rounded-full border border-input bg-card px-5 text-sm uppercase outline-none focus:border-fire focus:ring-2 focus:ring-fire/20" />
          <button className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-bold text-white"><Search className="h-4 w-4" />Track</button>
        </form>
        {number && !order && <p className="rounded-2xl bg-card p-6 text-center text-muted-foreground ring-1 ring-border">We couldn't find order <b>{number}</b> on this device. Double-check the number or call <a href={BRAND.phoneHref} className="font-bold text-fire">{BRAND.phone}</a>.</p>}
        {order && <OrderStatusCard order={order} />}
      </div>
    </>
  );
}

function steps(o: Order): { status: OrderStatus; label: string; Icon: typeof Check }[] {
  return [
    { status: "new", label: "Received", Icon: Receipt },
    { status: "accepted", label: "Confirmed", Icon: Check },
    { status: "preparing", label: "On the grill", Icon: ChefHat },
    o.type === "delivery"
      ? { status: "out_for_delivery", label: "Out for delivery", Icon: Bike }
      : { status: "ready", label: "Ready for pickup", Icon: PackageCheck },
    { status: "completed", label: o.type === "delivery" ? "Delivered" : "Picked up", Icon: CircleCheckBig },
  ];
}

function OrderStatusCard({ order }: { order: Order }) {
  const s = steps(order);
  const rank = (st: OrderStatus) => (st === "ready" && order.type === "delivery" ? 2.5 : s.findIndex((x) => x.status === st));
  const current = rank(order.status);
  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-[0_30px_60px_-40px_rgba(0,0,0,.6)] ring-1 ring-border">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-ink px-6 py-5 text-white md:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold">Order {order.number}</p>
          <p className="font-display text-4xl tracking-wide">{order.status === "cancelled" ? "Cancelled" : STATUS_LABEL[order.status]}</p>
        </div>
        <div className="text-right text-sm text-white/70">
          <p>{order.type === "pickup" ? "Pickup" : "Delivery"} · {order.scheduledFor ? `Scheduled ${to12h(order.scheduledFor)}` : "ASAP"}</p>
          <p>Placed {fmtTime(order.createdAt)}</p>
        </div>
      </div>
      {order.status === "cancelled" ? (
        <div className="flex items-center gap-3 p-8 text-muted-foreground"><XCircle className="h-6 w-6 text-fire" />This order was cancelled. Any payment has been refunded. Questions? Call {BRAND.phone}.</div>
      ) : (
        <ol className="grid grid-cols-5 gap-1 px-4 py-8 md:px-8">
          {s.map((st, n) => {
            const done = n <= current;
            const now = Math.floor(current) === n && order.status !== "completed";
            return (
              <li key={st.status} className="relative flex flex-col items-center text-center">
                {n > 0 && <span className={cn("absolute right-1/2 top-6 h-1 w-full -translate-y-1/2", n <= current ? "bg-fire" : "bg-border")} />}
                <span className={cn("relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 transition", done ? "border-fire bg-fire text-white" : "border-border bg-card text-muted-foreground", now && "pulse-ring")}>
                  <st.Icon className="h-5 w-5" />
                </span>
                <span className={cn("mt-2 text-[11px] font-bold uppercase tracking-wide sm:text-xs", done ? "text-ink" : "text-muted-foreground")}>{st.label}</span>
              </li>
            );
          })}
        </ol>
      )}
      <div className="grid gap-6 border-t border-border p-6 md:grid-cols-2 md:p-8">
        <ul className="space-y-2 text-sm">
          {order.items.map((l, n) => (
            <li key={n} className="flex justify-between gap-3">
              <span><b>{l.quantity}×</b> {l.name}{l.options.length > 0 && <span className="block text-xs text-muted-foreground">{l.options.join(" · ")}</span>}</span>
              <span className="tabular-nums">{money(l.unitPrice * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
          {order.deliveryFee > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd>{money(order.deliveryFee)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted-foreground">Tax</dt><dd>{money(order.tax)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Tip</dt><dd>{money(order.tip)}</dd></div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-extrabold"><dt>Total</dt><dd>{money(order.total)}</dd></div>
          <p className="pt-2 text-xs text-muted-foreground">{order.paymentStatus === "paid" ? "Paid online" : order.paymentStatus === "refunded" ? "Refunded" : "Pay at pickup"}{order.address ? ` · Delivering to ${order.address}` : ""}</p>
        </dl>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/50 px-6 py-4 text-sm md:px-8">
        <a href={BRAND.phoneHref} className="inline-flex items-center gap-2 font-bold text-fire"><Phone className="h-4 w-4" />Questions? {BRAND.phone}</a>
        <Link to="/menu" className="font-bold text-ink hover:text-fire">Order again →</Link>
      </div>
    </div>
  );
}
