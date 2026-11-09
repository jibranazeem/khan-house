import { Flame, Leaf, Plus, Star } from "lucide-react";
import type { MenuItem, MenuTag } from "@/lib/types";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

const TAG: Record<MenuTag, { label: string; className: string; Icon?: typeof Flame }> = {
  halal: { label: "Halal", className: "bg-leaf/15 text-[oklch(0.42_0.12_145)]" },
  spicy: { label: "Spicy", className: "bg-fire/10 text-fire", Icon: Flame },
  popular: { label: "Popular", className: "bg-gold/25 text-[oklch(0.45_0.11_75)]", Icon: Star },
  vegetarian: { label: "Vegetarian", className: "bg-leaf/15 text-[oklch(0.42_0.12_145)]", Icon: Leaf },
  new: { label: "New", className: "bg-ember/15 text-[oklch(0.5_0.17_45)]" },
};

export function TagPill({ tag, dark }: { tag: MenuTag; dark?: boolean }) {
  const t = TAG[tag];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", dark ? "bg-white/10 text-gold" : t.className)}>
      {t.Icon && <t.Icon className="h-3 w-3" />}{t.label}
    </span>
  );
}

/** Large photo card used on the home page "favorites" grid. */
export function FeaturedCard({ item, onSelect }: { item: MenuItem; onSelect: (i: MenuItem) => void }) {
  return (
    <button onClick={() => onSelect(item)} disabled={!item.available}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-coal text-left text-white ring-1 ring-white/10 transition duration-500 hover:-translate-y-1.5 hover:ring-fire/60 disabled:opacity-60">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-coal via-coal/10 to-transparent" />
        <span className="absolute right-4 top-4 rounded-full bg-ink/80 px-3 py-1 font-display text-xl tracking-wide text-gold backdrop-blur">{money(item.price)}</span>
      </div>
      <div className="flex flex-1 flex-col p-6 pt-2">
        <div className="flex flex-wrap gap-1.5">{item.tags.filter((t) => t !== "halal").slice(0, 2).map((t) => <TagPill key={t} tag={t} dark />)}</div>
        <h3 className="mt-2 font-display text-3xl tracking-wide">{item.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/60">{item.description}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ember transition group-hover:gap-3">
          {item.available ? <>Add to order <Plus className="h-4 w-4" /></> : "Sold out today"}
        </span>
      </div>
    </button>
  );
}

/** Horizontal row card used on the menu page. */
export function MenuRowCard({ item, onSelect }: { item: MenuItem; onSelect: (i: MenuItem) => void }) {
  return (
    <button onClick={() => onSelect(item)} disabled={!item.available}
      className="group flex w-full items-stretch overflow-hidden rounded-2xl border border-border bg-card text-left shadow-[0_18px_40px_-30px_rgba(0,0,0,.5)] transition hover:-translate-y-0.5 hover:border-fire/40 hover:shadow-[0_25px_50px_-30px_rgba(200,30,30,.45)] disabled:cursor-not-allowed disabled:opacity-60">
      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-1.5">{item.tags.map((t) => <TagPill key={t} tag={t} />)}</div>
        <h3 className="mt-2 text-lg font-bold leading-snug text-ink">{item.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
        <div className="mt-auto flex items-center gap-3 pt-3">
          <span className="text-lg font-extrabold text-ink">{money(item.price)}</span>
          {!item.available && <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-semibold text-neutral-600">Sold out</span>}
        </div>
      </div>
      <div className="relative w-36 shrink-0 overflow-hidden sm:w-44">
        <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
        {item.available && (
          <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-lg transition group-hover:bg-fire group-hover:text-white">
            <Plus className="h-5 w-5" />
          </span>
        )}
      </div>
    </button>
  );
}
