import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { btnGhost, btnPrimary, ChartTip, CHART, downloadCsv, Empty, field, Kpi, PageHeader, Panel, Segmented } from "@/components/admin/ui";
import { inRange, periods, summarize, type Range } from "@/lib/analytics";
import { dayKey, money, money0, round2 } from "@/lib/format";
import { addExpense, deleteExpense, useStore } from "@/lib/store";
import type { ExpenseCategory } from "@/lib/types";

export const Route = createFileRoute("/admin/finance")({ component: Finance });

const EXPENSE_CATS: ExpenseCategory[] = ["Food & Ingredients", "Packaging", "Fuel & Propane", "Payroll", "Permits & Fees", "Maintenance", "Marketing", "Other"];
const CARD_FEE = (total: number) => total * 0.026 + 0.15; // Square in-person/online blended estimate per order
const DOORDASH_COMMISSION = 0.25;

function Finance() {
  const s = useStore((x) => x);
  const [range, setRange] = useState<Range>("30d");

  const d = useMemo(() => {
    const p = periods(range);
    const orders = s.orders.filter((o) => inRange(o, p.start, p.end));
    const sum = summarize(orders);
    const ok = orders.filter((o) => o.status !== "cancelled");
    const fees = round2(ok.filter((o) => o.payment === "card" && o.source !== "doordash").reduce((a, o) => a + CARD_FEE(o.total), 0));
    const commission = round2(ok.filter((o) => o.source === "doordash").reduce((a, o) => a + o.subtotal * DOORDASH_COMMISSION, 0));
    const startKey = dayKey(p.start);
    const expenses = s.expenses.filter((e) => e.date >= startKey && e.date <= dayKey(new Date()));
    const spent = round2(expenses.reduce((a, e) => a + e.amount, 0));
    const net = round2(sum.sales + sum.deliveryFees - fees - commission - spent);

    const daily = Array.from({ length: p.days }, (_, i) => {
      const day = new Date(p.start.getTime() + i * 864e5);
      const k = dayKey(day);
      const os = ok.filter((o) => dayKey(o.createdAt) === k);
      return {
        key: k, label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        orders: os.length, sales: round2(os.reduce((a, o) => a + o.subtotal, 0)), tax: round2(os.reduce((a, o) => a + o.tax, 0)),
        tips: round2(os.reduce((a, o) => a + o.tip, 0)), cash: round2(os.filter((o) => o.payment === "cash").reduce((a, o) => a + o.total, 0)),
        card: round2(os.filter((o) => o.payment === "card").reduce((a, o) => a + o.total, 0)),
        expenses: round2(expenses.filter((e) => e.date === k).reduce((a, e) => a + e.amount, 0)),
      };
    });
    // Weekly buckets read better than 30 thin daily bar pairs.
    const chart = range === "30d"
      ? Array.from({ length: Math.ceil(daily.length / 7) }, (_, w) => {
        const chunk = daily.slice(w * 7, w * 7 + 7);
        return { label: `Wk of ${chunk[0].label}`, Sales: round2(chunk.reduce((a, x) => a + x.sales, 0)), Expenses: round2(chunk.reduce((a, x) => a + x.expenses, 0)) };
      })
      : daily.map((x) => ({ label: x.label, Sales: x.sales, Expenses: x.expenses }));
    const byCat = EXPENSE_CATS.map((c) => ({ c, v: round2(expenses.filter((e) => e.category === c).reduce((a, e) => a + e.amount, 0)) })).filter((x) => x.v > 0).sort((a, b) => b.v - a.v);
    return { sum, fees, commission, spent, net, daily, chart, expenses, byCat };
  }, [s, range]);

  const exportCsv = () => downloadCsv(`khan-house-finance-${range}.csv`, [
    ["Date", "Orders", "Net sales", "Tax collected", "Tips", "Card", "Cash", "Expenses"],
    ...d.daily.map((x) => [x.key, x.orders, x.sales, x.tax, x.tips, x.card, x.cash, x.expenses]),
  ]);
  const margin = d.sum.sales ? (d.net / d.sum.sales) * 100 : 0;

  return (
    <>
      <PageHeader title="Finance" sub="Sales, taxes, tips, fees, expenses and profit"
        actions={<>
          <Segmented value={range} onChange={setRange} options={[{ value: "today", label: "Today" }, { value: "7d", label: "7 days" }, { value: "30d", label: "30 days" }]} />
          <button onClick={exportCsv} className={btnGhost}><Download className="h-4 w-4" />Export</button>
        </>} />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi label="Net sales" value={money0(d.sum.sales)} hint={`${d.sum.orders} orders`} />
        <Kpi label="Expenses" value={money0(d.spent)} hint={`${d.expenses.length} entries`} />
        <Kpi label="Est. profit" value={money0(d.net)} hint={`${margin.toFixed(1)}% margin`} />
        <Kpi label="Tax collected" value={money(d.sum.tax)} hint="Owed to NC DOR" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Panel title="Sales vs expenses" sub={range === "30d" ? "Weekly" : "Daily"}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.chart} margin={{ left: 0, right: 8, top: 8, bottom: 0 }} barGap={2}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: CHART.axis }} minTickGap={8} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: CHART.axis }} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} width={48} />
                <Tooltip content={<ChartTip fmt={money} />} cursor={{ fill: "rgba(0,0,0,.04)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Sales" fill={CHART.fire} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill={CHART.blue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Profit & loss" sub="Estimated for this period">
          <dl className="space-y-2 text-sm">
            <Line k="Net food sales" v={d.sum.sales} />
            <Line k="Delivery fees" v={d.sum.deliveryFees} />
            <Line k="Card processing (est. 2.6% + 15¢)" v={-d.fees} />
            <Line k={`DoorDash commission (est. ${DOORDASH_COMMISSION * 100}%)`} v={-d.commission} />
            {d.byCat.map((x) => <Line key={x.c} k={x.c} v={-x.v} muted />)}
            <div className="flex justify-between border-t-2 border-ink pt-2 text-base font-extrabold"><dt>Estimated profit</dt><dd className={d.net < 0 ? "text-fire" : ""}>{money(d.net)}</dd></div>
          </dl>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
            <Mini k="Tips (pass to staff)" v={money(d.sum.tips)} />
            <Mini k="Refunds" v={money(d.sum.refunds)} />
            <Mini k="Card payments" v={money0(d.sum.card)} />
            <Mini k="Cash payments" v={money0(d.sum.cash)} />
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.3fr]">
        <ExpensePanel />
        <Panel title="Daily breakdown" bodyClass="p-0">
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="sticky top-0 bg-card text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">{["Date", "Orders", "Sales", "Tax", "Tips", "Expenses"].map((h) => <th key={h} className="px-4 py-2.5 font-bold">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {[...d.daily].reverse().map((x) => (
                  <tr key={x.key}><td className="px-4 py-2">{x.label}</td><td className="px-4 py-2">{x.orders}</td><td className="px-4 py-2 font-semibold">{money(x.sales)}</td><td className="px-4 py-2">{money(x.tax)}</td><td className="px-4 py-2">{money(x.tips)}</td><td className="px-4 py-2">{x.expenses ? money(x.expenses) : "—"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}

function Line({ k, v, muted }: { k: string; v: number; muted?: boolean }) {
  return <div className={`flex justify-between ${muted ? "pl-3 text-muted-foreground" : ""}`}><dt>{k}</dt><dd className="tabular-nums">{v < 0 ? `−${money(-v)}` : money(v)}</dd></div>;
}
function Mini({ k, v }: { k: string; v: string }) {
  return <div><p className="text-xs text-muted-foreground">{k}</p><p className="font-bold tabular-nums">{v}</p></div>;
}

function ExpensePanel() {
  const expenses = useStore((s) => s.expenses);
  const [f, setF] = useState({ date: dayKey(new Date()), category: "Food & Ingredients" as ExpenseCategory, amount: "", note: "" });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const amount = Number(f.amount);
    if (!(amount > 0)) return toast.error("Enter an amount");
    addExpense({ date: f.date, category: f.category, amount: round2(amount), note: f.note.trim() });
    setF((p) => ({ ...p, amount: "", note: "" }));
    toast.success("Expense added");
  };
  return (
    <Panel title="Expenses" sub="Log purchases to track true profit" bodyClass="p-0">
      <form onSubmit={submit} className="grid grid-cols-2 gap-2 border-b border-border p-4 sm:grid-cols-[auto_1fr_100px]">
        <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={field} />
        <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as ExpenseCategory })} className={field}>{EXPENSE_CATS.map((c) => <option key={c}>{c}</option>)}</select>
        <input type="number" step="0.01" min={0} placeholder="$" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className={field} />
        <input placeholder="Note (supplier, what for…)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} className={`${field} col-span-2 sm:col-span-2`} />
        <button className={btnPrimary}><Plus className="h-4 w-4" />Add</button>
      </form>
      <ul className="max-h-[300px] divide-y divide-border overflow-y-auto">
        {expenses.slice(0, 60).map((e) => (
          <li key={e.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
            <span className="w-20 shrink-0 text-xs text-muted-foreground">{new Date(`${e.date}T12:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            <span className="min-w-0 flex-1"><span className="font-semibold">{e.category}</span><span className="block truncate text-xs text-muted-foreground">{e.note}</span></span>
            <span className="font-bold tabular-nums">{money(e.amount)}</span>
            <button onClick={() => deleteExpense(e.id)} aria-label="Delete expense" className="rounded p-1 text-muted-foreground hover:text-fire"><Trash2 className="h-3.5 w-3.5" /></button>
          </li>
        ))}
        {!expenses.length && <Empty>No expenses logged.</Empty>}
      </ul>
    </Panel>
  );
}
