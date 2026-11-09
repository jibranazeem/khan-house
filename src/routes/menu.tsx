import { createFileRoute, useLocation } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingBag } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { MenuRowCard } from "@/components/site/MenuItemCard";
import { ItemDialog } from "@/components/site/ItemDialog";
import { CATEGORIES } from "@/lib/menu-data";
import { BRAND } from "@/lib/brand";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";
import { track, useStore } from "@/lib/store";
import type { MenuItem, MenuTag } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: `Menu & Online Ordering — ${BRAND.name} ${BRAND.area}` },
      { name: "description", content: "Order halal chicken over rice, chicken & lamb mix, hibachi chicken & shrimp, gyros, wings and more for pickup or delivery." },
    ],
  }),
  component: MenuPage,
});

const FILTERS: { tag: MenuTag | "all"; label: string }[] = [
  { tag: "all", label: "All" }, { tag: "popular", label: "Popular" }, { tag: "spicy", label: "Spicy" }, { tag: "vegetarian", label: "Vegetarian" },
];

function MenuPage() {
  const menu = useStore((s) => s.menu);
  const accepting = useStore((s) => s.settings.acceptingOrders);
  const { hash } = useLocation();
  const { count, subtotal, setOpen } = useCart();
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<MenuTag | "all">("all");
  const [active, setActive] = useState<string>(CATEGORIES[0].id);

  useEffect(() => { track.menuView(); }, []);
  useEffect(() => {
    if (hash) setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [hash]);

  // Highlight the category tab for the section in view.
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) setActive(vis.target.id);
    }, { rootMargin: "-140px 0px -60% 0px" });
    CATEGORIES.forEach((c) => { const el = document.getElementById(c.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return menu.filter((m) =>
      (filter === "all" || m.tags.includes(filter)) &&
      (!term || m.name.toLowerCase().includes(term) || m.description.toLowerCase().includes(term)));
  }, [menu, q, filter]);

  return (
    <>
      <PageHero eyebrow="Order Online · Pickup or Delivery" title={<>Our <span className="text-fire-gradient">Menu</span></>}
        sub="Everything is 100% halal and cooked to order. Tap any dish to customize it." image="/images/hero/mixed-grill.jpg" />

      <div className="z-30 border-b border-border bg-cream/95 backdrop-blur md:sticky md:top-[calc(4rem+36px)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-8">
          <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
            {CATEGORIES.map((c) => (
              <a key={c.id} href={`#${c.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(c.id)?.scrollIntoView({ behavior: "smooth" }); }}
                className={cn("whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition", active === c.id ? "bg-ink text-white" : "text-ink/70 hover:bg-ink/5")}>
                {c.name}
              </a>
            ))}
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <div className="no-scrollbar flex gap-1 overflow-x-auto">
              {FILTERS.map((f) => (
                <button key={f.tag} onClick={() => setFilter(f.tag)}
                  className={cn("whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition", filter === f.tag ? "border-fire bg-fire text-white" : "border-border bg-card text-ink/70 hover:border-fire/50")}>
                  {f.label}
                </button>
              ))}
            </div>
            <label className="relative basis-full md:ml-auto md:w-56 md:basis-auto">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the menu" aria-label="Search the menu"
                className="h-9 w-full rounded-full border border-input bg-card pl-9 pr-3 text-sm outline-none focus:border-fire focus:ring-2 focus:ring-fire/20" />
            </label>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-28 pt-10 md:px-8">
        {!accepting && (
          <div className="mb-8 rounded-2xl border border-fire/30 bg-fire/5 p-4 text-sm text-ink">
            <b>Online ordering is paused right now.</b> You can still browse — call <a className="font-bold text-fire" href={BRAND.phoneHref}>{BRAND.phone}</a> to order.
          </div>
        )}
        {CATEGORIES.map((c) => {
          const items = visible.filter((m) => m.category === c.id).sort((a, b) => a.sort - b.sort);
          return (
            <section key={c.id} id={c.id} className="scroll-mt-48 pb-14">
              <div className="mb-6 flex items-end justify-between gap-4 border-b-2 border-ink pb-3">
                <div>
                  <h2 className="font-display text-5xl tracking-wide text-ink">{c.name}</h2>
                  <p className="text-sm text-muted-foreground">{c.blurb}</p>
                </div>
                <span className="hidden font-display text-2xl text-fire sm:block">{items.length} items</span>
              </div>
              {items.length ? (
                <div className="grid gap-5 md:grid-cols-2">
                  {items.map((m) => <MenuRowCard key={m.id} item={m} onSelect={setSelected} />)}
                </div>
              ) : (
                <p className="py-6 text-sm text-muted-foreground">No matches in {c.name}.</p>
              )}
            </section>
          );
        })}
      </div>

      {count > 0 && (
        <button onClick={() => setOpen(true)}
          className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-between rounded-full bg-fire px-6 py-4 font-bold text-white shadow-[0_20px_40px_-15px_var(--fire)] md:left-auto md:right-8 md:w-96">
          <span className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" />View order · {count}</span>
          <span className="tabular-nums">{money(subtotal)}</span>
        </button>
      )}
      <ItemDialog item={selected} onClose={() => setSelected(null)} />
    </>
  );
}
