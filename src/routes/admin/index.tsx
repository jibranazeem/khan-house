import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, DollarSign, Percent, Receipt, ShoppingCart } from "lucide-react";
import { ChartTip, CHART, Kpi, PageHeader, Panel, Segmented } from "@/components/admin/ui";
import { byCategory, byHour, bySource, inRange, pct, periods, RANGE_LABEL, salesSeries, summarize, topItems, trafficIn, type Range } from "@/lib/analytics";
import { fmtTime, money, money0, STATUS_LABEL, STATUS_STYLE } from "@/lib/format";
import { useSession } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({ component: Overview });

function Overview() {
  const s = useStore((x) => x);
  const { user } = useSession();
  const [range, setRange] = useState<Range>("7d");

  const d = useMemo(() => {
    const p = periods(range);
    const cur = s.orders.filter((o) => inRange(o, p.start, p.end));
    const prev = s.orders.filter((o) => inRange(o, p.prevStart, p.prevEnd));
    const a = summarize(cur), b = summarize(prev);
    const t = trafficIn(s, p.start, p.end), tp = trafficIn(s, p.prevStart, p.prevEnd);
    const web = cur.filter((o) => o.source === "website" && o.status !== "cancelled").length;
    const webPrev = prev.filter((o) => o.source === "website" && o.status !== "cancelled").length;
    const conv = t.visits ? (web / t.visits) * 100 : 0;
    const convPrev = tp.visits ? (webPrev / tp.visits) * 100 : 0;
    return { cur, a, b, t, web, conv, convPrev, series: salesSeries(cur, range), top: topItems(cur), cats: byCategory(cur), sources: bySource(cur), hours: byHour(cur) };
  }, [s, range]);

  const live = s.orders.filter((o) => ["new", "accepted", "preparing", "ready", "out_for_delivery"].includes(o.status));
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const funnel = [
    { label: "Site visits", v: d.t.visits },
    { label: "Viewed menu", v: d.t.menuViews },
    { label: "Added to cart", v: d.t.carts },
    { label: "Started checkout", v: d.t.checkouts },
    { label: "Placed order", v: d.web },
  ];

  return (
    <>
      <PageHeader title={`${greet}, ${user?.name.split(" ")[0] ?? ""}`} sub={`Here's how ${RANGE_LABEL[range].toLowerCase()} looks at Khan House.`}
        actions={<Segmented value={range} onChange={setRange} options={[{ value: "today", label: "Today" }, { value: "7d", label: "7 days" }, { value: "30d", label: "30 days" }]} />} />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi label="Net sales" value={money0(d.a.sales)} delta={pct(d.a.sales, d.b.sales)} hint="vs previous period" icon={<DollarSign className="h-4 w-4" />} />
        <Kpi label="Orders" value={String(d.a.orders)} delta={pct(d.a.orders, d.b.orders)} hint={`${d.a.cancelled} cancelled`} icon={<Receipt className="h-4 w-4" />} />
        <Kpi label="Avg order value" value={money(d.a.aov)} delta={pct(d.a.aov, d.b.aov)} icon={<ShoppingCart className="h-4 w-4" />} />
        <Kpi label="Web conversion" value={`${d.conv.toFixed(1)}%`} delta={pct(d.conv, d.convPrev)} hint={`${d.t.visits.toLocaleString()} visits`} icon={<Percent className="h-4 w-4" />} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Panel title="Net sales" sub={range === "today" ? "By hour, today" : `Per day, last ${RANGE_LABEL[range]}`}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.series} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.fire} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={CHART.fire} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: CHART.axis }} minTickGap={16} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: CHART.axis }} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} width={48} />
                <Tooltip content={<ChartTip fmt={money} />} cursor={{ stroke: CHART.axis, strokeDasharray: 4 }} />
                <Area type="monotone" dataKey="sales" name="Net sales" stroke={CHART.fire} strokeWidth={2} fill="url(#salesFill)" activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Live orders" sub="Right now" actions={<Link to="/admin/orders" className="inline-flex items-center gap-1 text-xs font-bold text-fire">Open board<ArrowRight className="h-3 w-3" /></Link>} bodyClass="p-0">
          <div className="grid grid-cols-3 divide-x divide-border border-b border-border text-center">
            {(["new", "preparing", "ready"] as const).map((st) => (
              <div key={st} className="py-4">
                <p className="text-3xl font-extrabold tabular-nums">{live.filter((o) => (st === "preparing" ? o.status === "preparing" || o.status === "accepted" : st === "ready" ? o.status === "ready" || o.status === "out_for_delivery" : o.status === st)).length}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{st === "new" ? "New" : st === "preparing" ? "In progress" : "Ready / out"}</p>
              </div>
            ))}
          </div>
          <ul className="max-h-[232px] divide-y divide-border overflow-y-auto">
            {live.slice(0, 8).map((o) => (
              <li key={o.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className="font-bold">{o.number}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{o.customer.name}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", STATUS_STYLE[o.status])}>{STATUS_LABEL[o.status]}</span>
              </li>
            ))}
            {!live.length && <li className="px-5 py-8 text-center text-sm text-muted-foreground">No active orders.</li>}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title="Top sellers" sub="By net sales">
          <ul className="space-y-3">
            {d.top.map((t) => (
              <li key={t.name}>
                <div className="flex justify-between text-sm"><span className="font-semibold">{t.name}</span><span className="tabular-nums text-muted-foreground">{t.qty} sold · <b className="text-ink">{money0(t.sales)}</b></span></div>
                <div className="mt-1.5 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-fire" style={{ width: `${(t.sales / (d.top[0]?.sales || 1)) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Website conversion funnel" sub={`${RANGE_LABEL[range]} · ${d.conv.toFixed(1)}% of visitors order`}>
          <ul className="space-y-2.5">
            {funnel.map((f, n) => (
              <li key={f.label}>
                <div className="flex justify-between text-sm"><span className="font-semibold">{f.label}</span>
                  <span className="tabular-nums text-muted-foreground">{f.v.toLocaleString()}{n > 0 && funnel[n - 1].v ? <span className="ml-2 text-xs">({((f.v / funnel[n - 1].v) * 100).toFixed(0)}%)</span> : null}</span></div>
                <div className="mt-1 h-6 rounded-md bg-muted"><div className="h-6 rounded-md bg-fire/85" style={{ width: `${Math.max(2, (f.v / (funnel[0].v || 1)) * 100)}%` }} /></div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Orders by hour" sub="When the rush hits">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.hours} margin={{ left: -20, right: 0, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: CHART.axis }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: CHART.axis }} allowDecimals={false} />
                <Tooltip content={<ChartTip fmt={(n) => `${n} orders`} />} cursor={{ fill: "rgba(0,0,0,.04)" }} />
                <Bar dataKey="orders" name="Orders" fill={CHART.fire} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Sales by channel">
          <ul className="space-y-3">
            {d.sources.map((x) => (
              <li key={x.name}>
                <div className="flex justify-between text-sm"><span className="font-semibold">{x.name}</span><span className="tabular-nums text-muted-foreground">{x.orders} orders · <b className="text-ink">{money0(x.sales)}</b></span></div>
                <div className="mt-1.5 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-ink" style={{ width: `${(x.sales / (d.a.sales || 1)) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Sales by category">
          <ul className="space-y-3">
            {d.cats.map((x) => (
              <li key={x.name}>
                <div className="flex justify-between text-sm"><span className="font-semibold">{x.name}</span><span className="tabular-nums"><b>{money0(x.sales)}</b> <span className="text-xs text-muted-foreground">({((x.sales / (d.a.sales || 1)) * 100).toFixed(0)}%)</span></span></div>
                <div className="mt-1.5 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-ember" style={{ width: `${(x.sales / (d.a.sales || 1)) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Recent orders" actions={<Link to="/admin/orders" className="text-xs font-bold text-fire">View all</Link>} bodyClass="p-0">
          <ul className="divide-y divide-border">
            {d.cur.slice(0, 7).map((o) => (
              <li key={o.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                <span className="w-16 font-bold">{o.number}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{o.customer.name} · {fmtTime(o.createdAt)}</span>
                <span className="font-bold tabular-nums">{money(o.total)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
