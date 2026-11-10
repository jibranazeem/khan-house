import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { btnGhost, btnPrimary, field, PageHeader } from "@/components/admin/ui";
import { CATEGORIES, OPTION_GROUPS } from "@/lib/menu-data";
import { money } from "@/lib/format";
import { deleteMenuItem, saveMenuItem, useStore } from "@/lib/store";
import type { CategoryId, MenuItem, MenuTag } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/menu")({ component: MenuAdmin });

const TAGS: MenuTag[] = ["halal", "popular", "spicy", "vegetarian", "new"];
const IMAGES = ["chicken-lamb-mix", "chicken-over-rice", "seekh-kebabs", "falafel-over-rice", "hibachi-chicken", "hibachi-shrimp", "hibachi-chicken-shrimp", "lamb-over-rice", "chicken-gyro", "lamb-gyro", "kebab-wrap", "falafel-sandwich", "fries", "falafel-side", "wings", "shrimp-dumplings", "veggie-dumplings", "spring-rolls", "samosas"].map((n) => `/images/menu/${n}.jpg`);

const blank = (): MenuItem => ({ id: "", name: "", description: "", price: 9.99, category: "mediterranean", image: IMAGES[0], tags: ["halal"], available: true, featured: false, optionGroups: [], sort: 99 });

function MenuAdmin() {
  const menu = useStore((s) => s.menu);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const soldOut = menu.filter((m) => !m.available).length;

  return (
    <>
      <PageHeader title="Menu" sub={`${menu.length} items · ${soldOut} sold out (86'd) · changes go live on the website instantly`}
        actions={<button onClick={() => setEditing(blank())} className={btnPrimary}><Plus className="h-4 w-4" />Add item</button>} />
      <div className="space-y-6">
        {CATEGORIES.map((c) => {
          const items = menu.filter((m) => m.category === c.id).sort((a, b) => a.sort - b.sort);
          return (
            <section key={c.id} className="rounded-2xl bg-card ring-1 ring-border">
              <h2 className="border-b border-border px-5 py-3 font-display text-2xl tracking-wide">{c.name} <span className="text-base text-muted-foreground">· {items.length}</span></h2>
              <ul className="divide-y divide-border">
                {items.map((m) => (
                  <li key={m.id} className={cn("flex flex-wrap items-center gap-4 px-5 py-3", !m.available && "opacity-60")}>
                    <img src={m.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                    <div className="min-w-[180px] flex-1">
                      <p className="font-bold">{m.name} {m.featured && <Star className="inline h-3.5 w-3.5 fill-gold text-gold" />}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{m.description}</p>
                    </div>
                    <span className="w-20 font-bold tabular-nums">{money(m.price)}</span>
                    <label className="flex items-center gap-2 text-xs font-semibold">
                      <Switch checked={m.available} onCheckedChange={(v) => { saveMenuItem({ ...m, available: v }); toast.success(v ? `${m.name} is back on` : `${m.name} marked sold out`); }} />
                      {m.available ? "Available" : "Sold out"}
                    </label>
                    <div className="flex gap-1">
                      <button onClick={() => setEditing(m)} aria-label={`Edit ${m.name}`} className="rounded-lg p-2 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => { if (confirm(`Delete ${m.name}?`)) { deleteMenuItem(m.id); toast.success("Item deleted"); } }} aria-label={`Delete ${m.name}`} className="rounded-lg p-2 text-fire hover:bg-fire/10"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <ItemEditor item={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function ItemEditor({ item, onClose }: { item: MenuItem | null; onClose: () => void }) {
  const [f, setF] = useState<MenuItem | null>(item);
  const [last, setLast] = useState<MenuItem | null>(item);
  if (item !== last) { setLast(item); setF(item); }
  if (!f) return null;
  const set = <K extends keyof MenuItem>(k: K, v: MenuItem[K]) => setF({ ...f, [k]: v });

  const save = (e: FormEvent) => {
    e.preventDefault();
    const id = f.id || f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36).slice(-4);
    saveMenuItem({ ...f, id, name: f.name.trim(), description: f.description.trim(), price: Math.round(f.price * 100) / 100 });
    toast.success(f.id ? "Item updated" : "Item added");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogTitle className="font-display text-3xl tracking-wide">{f.id ? "Edit item" : "New item"}</DialogTitle>
        <form onSubmit={save} className="space-y-4">
          <label className="block"><span className="mb-1 block text-sm font-semibold">Name</span><input required value={f.name} onChange={(e) => set("name", e.target.value)} className={field} /></label>
          <label className="block"><span className="mb-1 block text-sm font-semibold">Description</span><textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} className={field} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1 block text-sm font-semibold">Price ($)</span><input required type="number" step="0.01" min={0} value={f.price} onChange={(e) => set("price", Number(e.target.value))} className={field} /></label>
            <label className="block"><span className="mb-1 block text-sm font-semibold">Category</span>
              <select value={f.category} onChange={(e) => set("category", e.target.value as CategoryId)} className={field}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          </div>
          <div>
            <span className="mb-1 block text-sm font-semibold">Photo</span>
            <div className="grid grid-cols-6 gap-2">
              {IMAGES.map((src) => (
                <button type="button" key={src} onClick={() => set("image", src)} className={cn("overflow-hidden rounded-lg ring-2", f.image === src ? "ring-fire" : "ring-transparent")}>
                  <img src={src} alt="" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
            <input value={f.image} onChange={(e) => set("image", e.target.value)} placeholder="…or paste an image URL" className={cn(field, "mt-2")} />
          </div>
          <div>
            <span className="mb-1 block text-sm font-semibold">Tags</span>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <button type="button" key={t} onClick={() => set("tags", f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t])}
                  className={cn("rounded-full border px-3 py-1 text-xs font-bold capitalize", f.tags.includes(t) ? "border-fire bg-fire text-white" : "border-border")}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1 block text-sm font-semibold">Customer options</span>
            <div className="flex flex-wrap gap-2">
              {Object.values(OPTION_GROUPS).map((g) => (
                <button type="button" key={g.id} onClick={() => set("optionGroups", f.optionGroups.includes(g.id) ? f.optionGroups.filter((x) => x !== g.id) : [...f.optionGroups, g.id])}
                  className={cn("rounded-full border px-3 py-1 text-xs font-bold", f.optionGroups.includes(g.id) ? "border-ink bg-ink text-white" : "border-border")}>{g.name}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm font-semibold"><Switch checked={f.available} onCheckedChange={(v) => set("available", v)} />Available</label>
            <label className="flex items-center gap-2 text-sm font-semibold"><Switch checked={f.featured} onCheckedChange={(v) => set("featured", v)} />Featured on homepage</label>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
            <button className={btnPrimary}>Save</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
