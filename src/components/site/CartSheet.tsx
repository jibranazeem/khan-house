import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";
import { useStore } from "@/lib/store";

export function CartSheet() {
  const { lines, open, setOpen, update, remove, subtotal, count } = useCart();
  const settings = useStore((s) => s.settings);
  const toFree = settings.freeDeliveryOver - subtotal;
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col gap-0 bg-cream p-0 sm:max-w-md">
        <SheetHeader className="bg-ink px-6 py-5 text-left">
          <SheetTitle className="font-display text-3xl tracking-wide text-white">Your Order</SheetTitle>
          <SheetDescription className="text-white/60">{count === 0 ? "Nothing here yet" : `${count} item${count === 1 ? "" : "s"}`}</SheetDescription>
        </SheetHeader>
        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-fire/10"><ShoppingBag className="h-9 w-9 text-fire" /></span>
            <p className="font-display text-3xl tracking-wide text-ink">Hungry?</p>
            <p className="text-sm text-muted-foreground">Add a platter, a gyro or some wings to get started.</p>
            <Link to="/menu" onClick={() => setOpen(false)} className="rounded-full bg-fire px-6 py-3 text-sm font-bold uppercase tracking-wider text-white">Browse the Menu</Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border overflow-y-auto px-6">
              {lines.map((l) => (
                <li key={l.key} className="flex gap-4 py-5">
                  <img src={l.image} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <p className="font-bold leading-tight text-ink">{l.name}</p>
                      <button onClick={() => remove(l.key)} aria-label={`Remove ${l.name}`} className="text-muted-foreground transition hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    {l.options.length > 0 && <p className="mt-0.5 text-xs text-muted-foreground">{l.options.join(" · ")}</p>}
                    {l.instructions && <p className="mt-0.5 text-xs italic text-muted-foreground">“{l.instructions}”</p>}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-border bg-card">
                        <button className="p-2" aria-label="Decrease quantity" onClick={() => (l.quantity > 1 ? update(l.key, { quantity: l.quantity - 1 }) : remove(l.key))}><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-7 text-center text-sm font-semibold">{l.quantity}</span>
                        <button className="p-2" aria-label="Increase quantity" onClick={() => update(l.key, { quantity: Math.min(20, l.quantity + 1) })}><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <p className="font-bold text-ink">{money(l.unitPrice * l.quantity)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-border bg-card px-6 py-5">
              <div className="flex items-baseline justify-between"><span className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Subtotal</span><span className="text-2xl font-extrabold text-ink">{money(subtotal)}</span></div>
              {settings.deliveryEnabled && (
                <p className="text-xs text-muted-foreground">
                  {toFree > 0 ? <>Add <b className="text-ink">{money(toFree)}</b> more for free delivery.</> : <>You've unlocked <b className="text-leaf">free delivery</b>.</>}
                </p>
              )}
              <Link to="/checkout" onClick={() => setOpen(false)} className="block rounded-full bg-fire py-3.5 text-center font-bold uppercase tracking-wider text-white transition hover:bg-fire-deep">Checkout</Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
