import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { btnGhost, downloadCsv, Empty, field, Kpi, PageHeader } from "@/components/admin/ui";
import { fmtDate, money, money0 } from "@/lib/format";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/customers")({ component: Customers });

function Customers() {
  const orders = useStore((s) => s.orders);
  const [q, setQ] = useState("");
  const customers = useMemo(() => {
    const m = new Map<string, { name: string; phone: string; email: string; orders: number; spent: number; first: string; last: string; items: Map<string, number> }>();
    orders.filter((o) => o.status !== "cancelled").forEach((o) => {
      const key = o.customer.phone.replace(/\D/g, "") || o.customer.email;
      const c = m.get(key) ?? { name: o.customer.name, phone: o.customer.phone, email: o.customer.email, orders: 0, spent: 0, first: o.createdAt, last: o.createdAt, items: new Map() };
      c.orders++; c.spent += o.total;
      if (o.createdAt < c.first) c.first = o.createdAt;
      if (o.createdAt > c.last) { c.last = o.createdAt; c.name = o.customer.name; }
      o.items.forEach((l) => c.items.set(l.name, (c.items.get(l.name) ?? 0) + l.quantity));
      m.set(key, c);
    });
    return [...m.values()].map((c) => ({ ...c, favorite: [...c.items.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—" })).sort((a, b) => b.spent - a.spent);
  }, [orders]);

  const t = q.trim().toLowerCase();
  const rows = customers.filter((c) => !t || c.name.toLowerCase().includes(t) || c.phone.includes(t) || c.email.toLowerCase().includes(t));
  const repeat = customers.filter((c) => c.orders > 1).length;
  const ltv = customers.length ? customers.reduce((a, c) => a + c.spent, 0) / customers.length : 0;

  return (
    <>
      <PageHeader title="Customers" sub="Everyone who has ordered, ranked by lifetime spend"
        actions={<button onClick={() => downloadCsv("khan-house-customers.csv", [["Name", "Phone", "Email", "Orders", "Lifetime spend", "Favorite", "Last order"], ...rows.map((c) => [c.name, c.phone, c.email, c.orders, c.spent.toFixed(2), c.favorite, fmtDate(c.last)])])} className={btnGhost}><Download className="h-4 w-4" />Export</button>} />
      <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi label="Customers" value={customers.length.toLocaleString()} />
        <Kpi label="Repeat customers" value={`${customers.length ? ((repeat / customers.length) * 100).toFixed(0) : 0}%`} hint={`${repeat} ordered 2+ times`} />
        <Kpi label="Avg lifetime value" value={money(ltv)} />
        <Kpi label="Top customer" value={money0(customers[0]?.spent ?? 0)} hint={customers[0]?.name} />
      </div>
      <div className="rounded-2xl bg-card ring-1 ring-border">
        <div className="border-b border-border p-4">
          <label className="relative block max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone or email" className={cn(field, "pl-9")} /></label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">{["Customer", "Contact", "Orders", "Lifetime spend", "Favorite", "Last order"].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.slice(0, 150).map((c) => (
                <tr key={c.phone + c.email}>
                  <td className="px-4 py-3 font-semibold">{c.name}{c.orders >= 5 && <span className="ml-2 rounded-full bg-gold/25 px-2 py-0.5 text-[10px] font-bold uppercase">Regular</span>}</td>
                  <td className="px-4 py-3 text-muted-foreground"><a href={`tel:${c.phone}`} className="block hover:text-fire">{c.phone}</a><span className="text-xs">{c.email}</span></td>
                  <td className="px-4 py-3 tabular-nums">{c.orders}</td>
                  <td className="px-4 py-3 font-bold tabular-nums">{money(c.spent)}</td>
                  <td className="px-4 py-3">{c.favorite}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.last)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <Empty>No customers found.</Empty>}
        </div>
      </div>
    </>
  );
}
