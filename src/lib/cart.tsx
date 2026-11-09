import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CategoryId } from "./types";

export type CartLine = {
  key: string; itemId: string; name: string; category: CategoryId; image: string;
  unitPrice: number; quantity: number; options: string[]; instructions: string;
};

type Ctx = {
  lines: CartLine[]; count: number; subtotal: number; ready: boolean;
  add: (l: Omit<CartLine, "key">) => void;
  update: (key: string, patch: Partial<CartLine>) => void;
  remove: (key: string) => void; clear: () => void;
  open: boolean; setOpen: (o: boolean) => void;
};
const CartCtx = createContext<Ctx | null>(null);
const KEY = "khan-house-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  // Don't write until the saved cart has been read, or the initial empty state overwrites it.
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try { const s = localStorage.getItem(KEY); if (s) setLines(JSON.parse(s)); } catch { /* start empty */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* keep in memory */ }
  }, [lines, loaded]);

  const value = useMemo<Ctx>(() => ({
    lines, ready: loaded,
    count: lines.reduce((a, l) => a + l.quantity, 0),
    subtotal: lines.reduce((a, l) => a + l.unitPrice * l.quantity, 0),
    add: (l) => setLines((prev) => {
      const sig = l.itemId + JSON.stringify(l.options) + l.instructions;
      const ex = prev.find((p) => p.itemId + JSON.stringify(p.options) + p.instructions === sig);
      if (ex) return prev.map((p) => (p === ex ? { ...p, quantity: p.quantity + l.quantity } : p));
      return [...prev, { ...l, key: Math.random().toString(36).slice(2) + Date.now().toString(36) }];
    }),
    update: (key, patch) => setLines((p) => p.map((l) => (l.key === key ? { ...l, ...patch } : l))),
    remove: (key) => setLines((p) => p.filter((l) => l.key !== key)),
    clear: () => setLines([]),
    open, setOpen,
  }), [lines, open, loaded]);
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside provider");
  return c;
}
