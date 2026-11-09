import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Bike, CreditCard, Loader2, Lock, Store, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageHero } from "@/components/site/PageHero";
import { useCart } from "@/lib/cart";
import { BRAND } from "@/lib/brand";
import { money, round2, to12h } from "@/lib/format";
import { placeOrder, priceOrder, track, useStore } from "@/lib/store";
import type { OrderType, PaymentMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: `Checkout — ${BRAND.name}` }, { name: "robots", content: "noindex" }] }),
  component: Checkout,
});

const TIPS = [0, 10, 15, 20];

/** 15-minute slots from now + prep time until closing, today only. */
function useSlots() {
  const settings = useStore((s) => s.settings);
  return useMemo(() => {
    if (typeof window === "undefined") return [] as string[];
    const now = new Date();
    const today = settings.hours[(now.getDay() + 6) % 7];
    if (!today || today.closed) return [];
    const [ch, cm] = today.close.split(":").map(Number);
    const [oh, om] = today.open.split(":").map(Number);
    const close = new Date(now); close.setHours(ch, cm, 0, 0);
    const start = new Date(Math.max(now.getTime() + (settings.prepMinutes + 15) * 60_000, new Date(now).setHours(oh, om, 0, 0)));
    start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
    const out: string[] = [];
    for (const t = new Date(start); t <= close && out.length < 40; t.setMinutes(t.getMinutes() + 15))
      out.push(`${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`);
    return out;
  }, [settings]);
}

function Checkout() {
  const { lines, ready, clear } = useCart();
  const settings = useStore((s) => s.settings);
  const navigate = useNavigate();
  const slots = useSlots();
  const [type, setType] = useState<OrderType>(settings.pickupEnabled ? "pickup" : "delivery");
  const [when, setWhen] = useState<"asap" | "later">("asap");
  const [slot, setSlot] = useState("");
  const [tipPct, setTipPct] = useState<number | "custom">(15);
  const [customTip, setCustomTip] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", email: "", street: "", unit: "", zip: "", notes: "" });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => { track.checkout(); }, []);
  useEffect(() => { if (slots.length && !slot) setSlot(slots[0]); }, [slots, slot]);

  const items = lines.map((l) => ({ itemId: l.itemId, name: l.name, category: l.category, quantity: l.quantity, unitPrice: l.unitPrice, options: l.options, instructions: l.instructions }));
  const base = priceOrder(items, type, 0, settings);
  const tip = tipPct === "custom" ? Math.max(0, Number(customTip) || 0) : round2((base.subtotal * tipPct) / 100);
  const totals = priceOrder(items, type, tip, settings);

  if (!ready) return <div className="min-h-screen bg-ink" />;
  if (!lines.length) {
    return (
      <>
        <PageHero eyebrow="Checkout" title="Your order is empty" image="/images/hero/skewers.jpg" />
        <div className="mx-auto max-w-md px-6 py-20 text-center">
          <p className="text-muted-foreground">Add something delicious first.</p>
          <Link to="/menu" className="mt-6 inline-flex rounded-full bg-fire px-8 py-3.5 font-bold uppercase tracking-wider text-white">Browse the Menu</Link>
        </div>
      </>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (f.phone.replace(/\D/g, "").length < 10) return toast.error("Please enter a valid phone number.");
    if (type === "delivery" && (f.street.trim().length < 4 || !/^\d{5}$/.test(f.zip.trim()))) return toast.error("Please enter a full delivery address and 5-digit ZIP.");
    if (when === "later" && !slot) return toast.error("Please pick a time.");
    setBusy(true);
    // Simulates the payment round-trip. In production this hands off to Square checkout.
    setTimeout(() => {
      try {
        const order = placeOrder({
          type, items, tip, payment, notes: f.notes.trim(),
          customer: { name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() },
          address: type === "delivery" ? `${f.street.trim()}${f.unit.trim() ? `, ${f.unit.trim()}` : ""}, ${BRAND.city}, NC ${f.zip.trim()}` : null,
          scheduledFor: when === "later" ? slot : null,
        });
        clear();
        navigate({ to: "/track", search: { order: order.number, placed: true } });
      } catch (err) {
        toast.error((err as Error).message);
        setBusy(false);
      }
    }, 900);
  };

  return (
    <>
      <PageHero eyebrow="Almost there" title={<>Check<span className="text-fire-gradient">out</span></>} image="/images/hero/skewers.jpg" />
      <form onSubmit={submit} className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:px-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <Card title="1. How do you want it?">
            <div className="grid grid-cols-2 gap-3">
              <Choice on={type === "pickup"} disabled={!settings.pickupEnabled} onClick={() => setType("pickup")} icon={<Store className="h-5 w-5" />} title="Pickup" sub={`Ready in ~${settings.prepMinutes} min`} />
              <Choice on={type === "delivery"} disabled={!settings.deliveryEnabled} onClick={() => setType("delivery")} icon={<Bike className="h-5 w-5" />} title="Delivery"
                sub={base.subtotal >= settings.freeDeliveryOver ? "Free delivery" : `${money(settings.deliveryFee)} · free over ${money(settings.freeDeliveryOver)}`} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Choice on={when === "asap"} onClick={() => setWhen("asap")} title="ASAP" sub="Start cooking now" />
              <Choice on={when === "later"} disabled={!slots.length} onClick={() => setWhen("later")} title="Schedule" sub={slots.length ? "Pick a time today" : "No more slots today"} />
            </div>
            {when === "later" && (
              <select value={slot} onChange={(e) => setSlot(e.target.value)} className={inputCls + " mt-3"} aria-label="Pickup or delivery time">
                {slots.map((s) => <option key={s} value={s}>{to12h(s)}</option>)}
              </select>
            )}
          </Card>

          <Card title="2. Your details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><input required minLength={2} maxLength={80} value={f.name} onChange={set("name")} autoComplete="name" className={inputCls} /></Field>
              <Field label="Phone"><input required type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" placeholder="(919) 555-0123" className={inputCls} /></Field>
              <Field label="Email (for your receipt)" className="sm:col-span-2"><input required type="email" value={f.email} onChange={set("email")} autoComplete="email" className={inputCls} /></Field>
              {type === "delivery" && (
                <>
                  <Field label="Street address" className="sm:col-span-2"><input required value={f.street} onChange={set("street")} autoComplete="street-address" className={inputCls} /></Field>
                  <Field label="Apt / suite (optional)"><input value={f.unit} onChange={set("unit")} className={inputCls} /></Field>
                  <Field label="ZIP code"><input required inputMode="numeric" maxLength={5} value={f.zip} onChange={set("zip")} autoComplete="postal-code" className={inputCls} /></Field>
                  <p className="text-xs text-muted-foreground sm:col-span-2">We deliver within about {settings.deliveryRadiusMiles} miles of {BRAND.city}.</p>
                </>
              )}
              <Field label="Order notes (optional)" className="sm:col-span-2"><textarea rows={2} maxLength={300} value={f.notes} onChange={set("notes")} placeholder="Allergies, gate code, extra napkins…" className={inputCls} /></Field>
            </div>
          </Card>

          <Card title="3. Tip the grill team">
            <div className="grid grid-cols-5 gap-2">
              {TIPS.map((t) => (
                <button type="button" key={t} onClick={() => setTipPct(t)} className={cn(pillCls, tipPct === t && pillOn)}>
                  {t === 0 ? "None" : `${t}%`}{t > 0 && <span className="block text-[10px] font-medium opacity-70">{money((base.subtotal * t) / 100)}</span>}
                </button>
              ))}
              <button type="button" onClick={() => setTipPct("custom")} className={cn(pillCls, tipPct === "custom" && pillOn)}>Custom</button>
            </div>
            {tipPct === "custom" && <input type="number" min={0} step="0.5" value={customTip} onChange={(e) => setCustomTip(e.target.value)} placeholder="Tip amount ($)" className={inputCls + " mt-3"} />}
          </Card>

          <Card title="4. Payment">
            <div className="grid gap-3 sm:grid-cols-2">
              <Choice on={payment === "card"} onClick={() => setPayment("card")} icon={<CreditCard className="h-5 w-5" />} title="Pay online now" sub="Secure card checkout" />
              <Choice on={payment === "cash"} disabled={type === "delivery"} onClick={() => setPayment("cash")} icon={<Wallet className="h-5 w-5" />} title="Pay at pickup" sub={type === "delivery" ? "Pickup orders only" : "Cash or card at the window"} />
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" />Demo mode — no card is charged. Live payments run through Square.</p>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="overflow-hidden rounded-3xl bg-ink text-white shadow-[0_30px_60px_-30px_rgba(0,0,0,.7)]">
            <div className="border-b border-white/10 px-6 py-5"><p className="font-display text-3xl tracking-wide">Order Summary</p></div>
            <ul className="max-h-72 divide-y divide-white/10 overflow-y-auto px-6">
              {lines.map((l) => (
                <li key={l.key} className="flex gap-3 py-4 text-sm">
                  <span className="font-bold text-ember">{l.quantity}×</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{l.name}</p>
                    {l.options.length > 0 && <p className="text-xs text-white/50">{l.options.join(" · ")}</p>}
                  </div>
                  <span className="tabular-nums">{money(l.unitPrice * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-white/10 px-6 py-5 text-sm">
              <Row k="Subtotal" v={money(totals.subtotal)} />
              {type === "delivery" && <Row k="Delivery" v={totals.deliveryFee ? money(totals.deliveryFee) : "Free"} />}
              <Row k={`Tax (${settings.taxRate}%)`} v={money(totals.tax)} />
              <Row k="Tip" v={money(totals.tip)} />
              <div className="flex justify-between border-t border-white/10 pt-3 text-lg font-extrabold"><dt>Total</dt><dd className="tabular-nums">{money(totals.total)}</dd></div>
            </dl>
            <div className="px-6 pb-6">
              <button disabled={busy || !settings.acceptingOrders} className="flex w-full items-center justify-center gap-2 rounded-full bg-fire py-4 font-bold uppercase tracking-wider text-white transition hover:bg-fire-deep disabled:opacity-60">
                {busy ? <><Loader2 className="h-5 w-5 animate-spin" />Placing order…</> : !settings.acceptingOrders ? "Ordering paused" : payment === "card" ? `Pay ${money(totals.total)}` : "Place Order"}
              </button>
              <Link to="/menu" className="mt-3 block text-center text-sm text-white/60 hover:text-white">← Add more items</Link>
            </div>
          </div>
        </aside>
      </form>
    </>
  );
}

const inputCls = "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-fire focus:ring-2 focus:ring-fire/20";
const pillCls = "rounded-xl border border-border bg-background px-2 py-2.5 text-sm font-bold transition hover:border-fire/50";
const pillOn = "border-fire bg-fire text-white hover:border-fire";

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-card p-6 shadow-[0_20px_40px_-35px_rgba(0,0,0,.5)] ring-1 ring-border md:p-7">
      <h2 className="mb-4 font-display text-3xl tracking-wide text-ink">{title}</h2>
      {children}
    </section>
  );
}
function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <label className={cn("block", className)}><span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>{children}</label>;
}
function Choice({ on, onClick, icon, title, sub, disabled }: { on: boolean; onClick: () => void; icon?: ReactNode; title: string; sub: string; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={on}
      className={cn("flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-40", on ? "border-fire bg-fire/5" : "border-border hover:border-fire/40")}>
      {icon && <span className={cn("mt-0.5", on ? "text-fire" : "text-muted-foreground")}>{icon}</span>}
      <span><span className="block font-bold text-ink">{title}</span><span className="block text-xs text-muted-foreground">{sub}</span></span>
    </button>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between text-white/75"><dt>{k}</dt><dd className="tabular-nums">{v}</dd></div>;
}
