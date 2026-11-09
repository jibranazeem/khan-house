import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const CHART = { fire: "#D9262B", blue: "#2F6FB0", grid: "#ece7e1", axis: "#8a817a" };

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl tracking-wide text-ink md:text-5xl">{title}</h1>
        {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, sub, actions, children, className, bodyClass }: { title?: string; sub?: string; actions?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cn("rounded-2xl bg-card ring-1 ring-border", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div><h2 className="font-bold text-ink">{title}</h2>{sub && <p className="text-xs text-muted-foreground">{sub}</p>}</div>
          {actions}
        </div>
      )}
      <div className={cn("p-5", bodyClass)}>{children}</div>
    </section>
  );
}

export function Kpi({ label, value, delta, hint, icon }: { label: string; value: string; delta?: number | null; hint?: string; icon?: ReactNode }) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>{icon}
      </div>
      <p className="mt-2 text-3xl font-extrabold tabular-nums text-ink">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {delta != null && Number.isFinite(delta) && (
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-bold", up ? "bg-leaf/15 text-[oklch(0.42_0.12_145)]" : "bg-fire/10 text-fire")}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex rounded-full bg-card p-1 ring-1 ring-border">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={cn("rounded-full px-3.5 py-1.5 text-xs font-bold transition", value === o.value ? "bg-ink text-white" : "text-muted-foreground hover:text-ink")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const btn = "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition disabled:opacity-50";
export const btnPrimary = cn(btn, "bg-fire text-white hover:bg-fire-deep");
export const btnDark = cn(btn, "bg-ink text-white hover:bg-coal");
export const btnGhost = cn(btn, "bg-card text-ink ring-1 ring-border hover:ring-ink/30");
export const field = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-fire focus:ring-2 focus:ring-fire/20";

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>;
}

/** Tooltip body shared by all charts. */
export function ChartTip({ active, payload, label, fmt }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; fmt: (n: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-ink px-3 py-2 text-xs text-white shadow-lg">
      <p className="mb-1 font-bold">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: p.color }} />{p.name}: <b className="tabular-nums">{fmt(p.value)}</b></p>
      ))}
    </div>
  );
}

export function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}
