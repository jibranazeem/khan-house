import { useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { OPTION_GROUPS } from "@/lib/menu-data";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";
import { track } from "@/lib/store";
import type { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TagPill } from "./MenuItemCard";

/** Customize-and-add dialog: required/optional option groups, quantity and notes. */
export function ItemDialog({ item, onClose }: { item: MenuItem | null; onClose: () => void }) {
  const { add, setOpen } = useCart();
  const groups = useMemo(() => (item?.optionGroups ?? []).map((g) => OPTION_GROUPS[g]).filter(Boolean), [item]);
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!item) return;
    // Pre-select the first choice of every required single-choice group.
    setPicked(Object.fromEntries(groups.map((g) => [g.id, g.type === "one" && g.required ? [g.choices[0].label] : []])));
    setQty(1);
    setNotes("");
  }, [item, groups]);

  if (!item) return null;
  const extras = groups.reduce((a, g) => a + g.choices.filter((c) => picked[g.id]?.includes(c.label)).reduce((x, c) => x + c.price, 0), 0);
  const unit = item.price + extras;

  const toggle = (gid: string, label: string, type: "one" | "many", required: boolean) =>
    setPicked((p) => {
      const cur = p[gid] ?? [];
      if (type === "one") return { ...p, [gid]: cur[0] === label && !required ? [] : [label] };
      return { ...p, [gid]: cur.includes(label) ? cur.filter((x) => x !== label) : [...cur, label] };
    });

  const addToCart = () => {
    const options = groups.flatMap((g) => picked[g.id] ?? []);
    add({ itemId: item.id, name: item.name, category: item.category, image: item.image, unitPrice: unit, quantity: qty, options, instructions: notes.trim() });
    track.addToCart();
    toast.success(`${item.name} added`, { action: { label: "View cart", onClick: () => setOpen(true) } });
    onClose();
  };

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="max-h-[calc(92vh-84px)] overflow-y-auto">
          <div className="relative aspect-[16/9] bg-coal">
            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-1.5">{item.tags.map((t) => <TagPill key={t} tag={t} />)}</div>
            <DialogTitle className="mt-2 font-display text-4xl tracking-wide text-ink">{item.name}</DialogTitle>
            <DialogDescription className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</DialogDescription>
            <p className="mt-3 text-xl font-extrabold">{money(item.price)}</p>

            {groups.map((g) => (
              <fieldset key={g.id} className="mt-6">
                <legend className="flex w-full items-center justify-between">
                  <span className="font-bold text-ink">{g.name}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", g.required ? "bg-fire/10 text-fire" : "bg-muted text-muted-foreground")}>
                    {g.required ? "Required" : g.type === "many" ? "Optional · pick any" : "Optional"}
                  </span>
                </legend>
                <div className="mt-2 divide-y divide-border rounded-xl border border-border">
                  {g.choices.map((c) => {
                    const on = picked[g.id]?.includes(c.label) ?? false;
                    return (
                      <label key={c.label} className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm transition hover:bg-muted/60">
                        <input type={g.type === "one" ? "radio" : "checkbox"} name={g.id} checked={on} onChange={() => toggle(g.id, c.label, g.type, g.required)}
                          onClick={() => g.type === "one" && on && !g.required && toggle(g.id, c.label, g.type, g.required)}
                          className="h-4 w-4 accent-[var(--fire)]" />
                        <span className="flex-1">{c.label}</span>
                        {c.price > 0 && <span className="text-muted-foreground">+{money(c.price)}</span>}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}

            <label className="mt-6 block">
              <span className="font-bold text-ink">Special instructions</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200} rows={2} placeholder="e.g. no onions, sauce on the side"
                className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-fire focus:ring-2 focus:ring-fire/20" />
            </label>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-border bg-card p-4">
          <div className="flex items-center rounded-full border border-border">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="flex h-11 w-11 items-center justify-center"><Minus className="h-4 w-4" /></button>
            <span className="w-6 text-center font-bold tabular-nums">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Increase quantity" className="flex h-11 w-11 items-center justify-center"><Plus className="h-4 w-4" /></button>
          </div>
          <button onClick={addToCart} className="flex h-12 flex-1 items-center justify-between rounded-full bg-fire px-6 font-bold text-white transition hover:bg-fire-deep">
            <span>Add to order</span><span className="tabular-nums">{money(unit * qty)}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
