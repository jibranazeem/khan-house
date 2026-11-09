import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bike, Clock, Download, Printer, Search, Store } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { btnDark, btnGhost, btnPrimary, downloadCsv, Empty, field, PageHeader, Segmented } from "@/components/admin/ui";
import { SOURCE_LABEL } from "@/lib/analytics";
import { BRAND } from "@/lib/brand";
import { fmtDateTime, fmtTime, money, STATUS_LABEL, STATUS_STYLE, to12h } from "@/lib/format";
import { useSession } from "@/lib/auth";
import { markOrderPaid, updateOrderStatus, useStore } from "@/lib/store";
import type { Order, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/orders")({ component: Orders });

const COLUMNS: { key: string; title: string; statuses: OrderStatus[]; tone: string }[] = [
  { key: "new", title: "Incoming", statuses: ["new"], tone: "bg-fire" },
  { key: "accepted", title: "Accepted", statuses: ["accepted"], tone: "bg-ember" },
  { key: "preparing", title: "On the grill", statuses: ["preparing"], tone: "bg-gold" },
  { key: "ready", title: "Ready / Out", statuses: ["ready", "out_for_delivery"], tone: "bg-leaf" },
];

function nextStep(o: Order): { label: string; to: OrderStatus } | null {
  switch (o.status) {
    case "new": return { label: "Accept", to: "accepted" };
    case "accepted": return { label: "Start cooking", to: "preparing" };
    case "preparing": return o.type === "delivery" ? { label: "Out for delivery", to: "out_for_delivery" } : { label: "Mark ready", to: "ready" };
    case "ready": return { label: "Picked up", to: "completed" };
    case "out_for_delivery": return { label: "Delivered", to: "completed" };
    default: return null;
  }
}

/** Re-render every 30s so "minutes waiting" stays fresh. */
function useTick(ms = 30_000) {
  const [, set] = useState(0);
  useEffect(() => { const t = setInterval(() => set((n) => n + 1), ms); return () => clearInterval(t); }, [ms]);
}

function Orders() {
  const { user } = useSession();
  const orders = useStore((s) => s.orders);
  const [view, setView] = useState<"board" | "list">("board");
  const [open, setOpen] = useState<string | null>(null);
  const selected = orders.find((o) => o.id === open) ?? null;
  const active = orders.filter((o) => ["new", "accepted", "preparing", "ready", "out_for_delivery"].includes(o.status));
  const today = new Date().toDateString();
  const doneToday = orders.filter((o) => o.status === "completed" && new Date(o.createdAt).toDateString() === today).length;
  useTick();

  const move = (o: Order, to: OrderStatus) => {
    updateOrderStatus(o.id, to, user?.name ?? "Staff");
    toast.success(`${o.number} → ${STATUS_LABEL[to]}`);
  };

  return (
    <>
      <PageHeader title="Orders" sub={`${active.length} active · ${doneToday} completed today`}
        actions={<Segmented value={view} onChange={setView} options={[{ value: "board", label: "Live board" }, { value: "list", label: "All orders" }]} />} />
      {view === "board" ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {COLUMNS.map((c) => {
            const list = active.filter((o) => c.statuses.includes(o.status)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
            return (
              <section key={c.key} className="flex min-h-[300px] flex-col rounded-2xl bg-muted/60 ring-1 ring-border">
                <header className="flex items-center gap-2 px-4 py-3">
                  <span className={cn("h-2.5 w-2.5 rounded-full", c.tone)} />
                  <h2 className="font-bold">{c.title}</h2>
                  <span className="ml-auto rounded-full bg-card px-2 py-0.5 text-xs font-bold ring-1 ring-border">{list.length}</span>
                </header>
                <div className="flex-1 space-y-3 px-3 pb-3">
                  {list.map((o) => <Ticket key={o.id} o={o} onOpen={() => setOpen(o.id)} onMove={move} />)}
                  {!list.length && <p className="py-8 text-center text-xs text-muted-foreground">Nothing here</p>}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <OrderList orders={orders} onOpen={setOpen} />
      )}
      <OrderDialog order={selected} onClose={() => setOpen(null)} onMove={move} />
    </>
  );
}

function Ticket({ o, onOpen, onMove }: { o: Order; onOpen: () => void; onMove: (o: Order, to: OrderStatus) => void }) {
  const mins = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60_000);
  const late = mins >= 25 && o.status !== "ready" && o.status !== "out_for_delivery";
  const step = nextStep(o);
  return (
    <article className={cn("rounded-xl bg-card p-4 shadow-sm ring-1 ring-border", o.status === "new" && "ring-2 ring-fire")}>
      <button onClick={onOpen} className="block w-full text-left">
        <div className="flex items-center gap-2">
          <span className="font-extrabold">{o.number}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold">{o.type === "delivery" ? <Bike className="h-3 w-3" /> : <Store className="h-3 w-3" />}{o.type === "delivery" ? "Delivery" : "Pickup"}</span>
          <span className={cn("ml-auto inline-flex items-center gap-1 text-xs font-bold", late ? "text-fire" : "text-muted-foreground")}><Clock className="h-3 w-3" />{mins}m</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{o.customer.name} · {SOURCE_LABEL[o.source]}{o.scheduledFor && <b className="text-ink"> · for {to12h(o.scheduledFor)}</b>}</p>
        <ul className="mt-3 space-y-1 border-t border-dashed border-border pt-3 text-sm">
          {o.items.map((l, n) => (
            <li key={n}><b>{l.quantity}×</b> {l.name}{l.options.length > 0 && <span className="block pl-5 text-xs text-muted-foreground">{l.options.join(", ")}</span>}{l.instructions && <span className="block pl-5 text-xs italic text-fire">“{l.instructions}”</span>}</li>
          ))}
        </ul>
        {o.notes && <p className="mt-2 rounded-lg bg-gold/15 px-2 py-1 text-xs">📝 {o.notes}</p>}
      </button>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-sm font-bold tabular-nums">{money(o.total)}</span>
        {o.paymentStatus === "unpaid" && <span className="rounded-full bg-gold/25 px-2 py-0.5 text-[10px] font-bold uppercase">Unpaid</span>}
        <div className="ml-auto flex gap-1.5">
          {o.status === "new" && <button onClick={() => onMove(o, "cancelled")} className={cn(btnGhost, "px-3 py-1.5 text-xs")}>Reject</button>}
          {step && <button onClick={() => onMove(o, step.to)} className={cn(o.status === "new" ? btnPrimary : btnDark, "px-3 py-1.5 text-xs")}>{step.label}</button>}
        </div>
      </div>
    </article>
  );
}

function OrderList({ orders, onOpen }: { orders: Order[]; onOpen: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [limit, setLimit] = useState(50);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return orders.filter((o) => (status === "all" || o.status === status) && (!t || o.number.toLowerCase().includes(t) || o.customer.name.toLowerCase().includes(t) || o.customer.phone.includes(t)));
  }, [orders, q, status]);
  const exportCsv = () => downloadCsv("khan-house-orders.csv", [
    ["Order", "Date", "Customer", "Phone", "Type", "Source", "Items", "Subtotal", "Tax", "Tip", "Delivery", "Total", "Payment", "Status"],
    ...rows.map((o) => [o.number, fmtDateTime(o.createdAt), o.customer.name, o.customer.phone, o.type, o.source, o.items.map((l) => `${l.quantity}x ${l.name}`).join("; "), o.subtotal, o.tax, o.tip, o.deliveryFee, o.total, `${o.payment} (${o.paymentStatus})`, o.status]),
  ]);
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
        <label className="relative min-w-[200px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order #, name or phone" className={cn(field, "pl-9")} /></label>
        <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | "all")} className={cn(field, "w-auto")}>
          <option value="all">All statuses</option>
          {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <button onClick={exportCsv} className={btnGhost}><Download className="h-4 w-4" />Export CSV</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border">{["Order", "Placed", "Customer", "Type", "Source", "Total", "Payment", "Status"].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.slice(0, limit).map((o) => (
              <tr key={o.id} onClick={() => onOpen(o.id)} className="cursor-pointer hover:bg-muted/50">
                <td className="px-4 py-3 font-bold">{o.number}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDateTime(o.createdAt)}</td>
                <td className="px-4 py-3">{o.customer.name}</td>
                <td className="px-4 py-3 capitalize">{o.type}</td>
                <td className="px-4 py-3">{SOURCE_LABEL[o.source]}</td>
                <td className="px-4 py-3 font-bold tabular-nums">{money(o.total)}</td>
                <td className="px-4 py-3 capitalize">{o.payment} · <span className={o.paymentStatus === "paid" ? "text-[oklch(0.42_0.12_145)]" : "text-fire"}>{o.paymentStatus}</span></td>
                <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", STATUS_STYLE[o.status])}>{STATUS_LABEL[o.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty>No orders match.</Empty>}
      </div>
      {rows.length > limit && <div className="border-t border-border p-3 text-center"><button onClick={() => setLimit((l) => l + 100)} className={btnGhost}>Show more ({rows.length - limit} left)</button></div>}
    </div>
  );
}

function printTicket(o: Order) {
  const w = window.open("", "_blank", "width=380,height=640");
  if (!w) return toast.error("Allow pop-ups to print tickets.");
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  w.document.write(`<!doctype html><html><head><title>${o.number}</title><style>body{font:14px/1.4 ui-monospace,monospace;margin:16px;width:300px}h1{font-size:20px;margin:0}hr{border:0;border-top:1px dashed #000;margin:10px 0}.r{display:flex;justify-content:space-between}.s{font-size:12px;color:#444;padding-left:16px}</style></head><body>
  <h1>${BRAND.name.toUpperCase()}</h1><div>${BRAND.phone}</div><hr/>
  <div class="r"><b>${o.number}</b><b>${o.type.toUpperCase()}</b></div><div>${fmtDateTime(o.createdAt)}${o.scheduledFor ? ` · FOR ${to12h(o.scheduledFor)}` : " · ASAP"}</div>
  <div>${esc(o.customer.name)} · ${esc(o.customer.phone)}</div>${o.address ? `<div>${esc(o.address)}</div>` : ""}<hr/>
  ${o.items.map((l) => `<div class="r"><span>${l.quantity}x ${esc(l.name)}</span><span>${money(l.unitPrice * l.quantity)}</span></div>${l.options.length ? `<div class="s">${esc(l.options.join(", "))}</div>` : ""}${l.instructions ? `<div class="s">** ${esc(l.instructions)}</div>` : ""}`).join("")}
  ${o.notes ? `<hr/><div>NOTE: ${esc(o.notes)}</div>` : ""}<hr/>
  <div class="r"><span>Subtotal</span><span>${money(o.subtotal)}</span></div>${o.deliveryFee ? `<div class="r"><span>Delivery</span><span>${money(o.deliveryFee)}</span></div>` : ""}
  <div class="r"><span>Tax</span><span>${money(o.tax)}</span></div><div class="r"><span>Tip</span><span>${money(o.tip)}</span></div>
  <div class="r"><b>TOTAL</b><b>${money(o.total)}</b></div><div>${o.payment.toUpperCase()} · ${o.paymentStatus.toUpperCase()}</div><hr/><div style="text-align:center">Thank you!</div>
  <script>window.onload=()=>{window.print()}</script></body></html>`);
  w.document.close();
}

function OrderDialog({ order: o, onClose, onMove }: { order: Order | null; onClose: () => void; onMove: (o: Order, to: OrderStatus) => void }) {
  if (!o) return null;
  const step = nextStep(o);
  const closed = o.status === "completed" || o.status === "cancelled";
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <div className="flex flex-wrap items-center gap-2 pr-6">
          <DialogTitle className="font-display text-4xl tracking-wide">{o.number}</DialogTitle>
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", STATUS_STYLE[o.status])}>{STATUS_LABEL[o.status]}</span>
        </div>
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer</p>
            <p className="font-semibold">{o.customer.name}</p>
            <a href={`tel:${o.customer.phone}`} className="block text-fire">{o.customer.phone}</a>
            <a href={`mailto:${o.customer.email}`} className="block text-muted-foreground">{o.customer.email}</a>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fulfilment</p>
            <p className="font-semibold capitalize">{o.type} · {o.scheduledFor ? `scheduled ${to12h(o.scheduledFor)}` : "ASAP"}</p>
            {o.address && <p className="text-muted-foreground">{o.address}</p>}
            <p className="text-muted-foreground">via {SOURCE_LABEL[o.source]} · {fmtDateTime(o.createdAt)}</p>
          </div>
        </div>
        <ul className="divide-y divide-border rounded-xl border border-border text-sm">
          {o.items.map((l, n) => (
            <li key={n} className="flex justify-between gap-3 px-4 py-2.5">
              <span><b>{l.quantity}×</b> {l.name}{l.options.length > 0 && <span className="block text-xs text-muted-foreground">{l.options.join(", ")}</span>}{l.instructions && <span className="block text-xs italic text-fire">“{l.instructions}”</span>}</span>
              <span className="tabular-nums">{money(l.unitPrice * l.quantity)}</span>
            </li>
          ))}
        </ul>
        {o.notes && <p className="rounded-lg bg-gold/15 px-3 py-2 text-sm">📝 {o.notes}</p>}
        <dl className="space-y-1 text-sm">
          {[["Subtotal", o.subtotal], ["Delivery", o.deliveryFee], ["Tax", o.tax], ["Tip", o.tip]].map(([k, v]) => <div key={k} className="flex justify-between text-muted-foreground"><dt>{k}</dt><dd className="tabular-nums">{money(v as number)}</dd></div>)}
          <div className="flex justify-between border-t border-border pt-1 text-base font-extrabold"><dt>Total</dt><dd>{money(o.total)}</dd></div>
          <p className="text-xs capitalize text-muted-foreground">{o.payment} · {o.paymentStatus}</p>
        </dl>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">History</p>
          <ol className="mt-2 space-y-1 text-xs">
            {o.history.map((h, n) => <li key={n} className="flex gap-2"><span className="w-16 text-muted-foreground">{fmtTime(h.at)}</span><span className="font-semibold">{STATUS_LABEL[h.status]}</span><span className="text-muted-foreground">by {h.by}</span></li>)}
          </ol>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <button onClick={() => printTicket(o)} className={btnGhost}><Printer className="h-4 w-4" />Print ticket</button>
          {o.paymentStatus === "unpaid" && !closed && <button onClick={() => { markOrderPaid(o.id); toast.success("Marked as paid"); }} className={btnGhost}>Mark paid</button>}
          {!closed && <button onClick={() => onMove(o, "cancelled")} className={cn(btnGhost, "text-fire")}>Cancel & refund</button>}
          {step && <button onClick={() => onMove(o, step.to)} className={cn(btnPrimary, "ml-auto")}>{step.label}</button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
