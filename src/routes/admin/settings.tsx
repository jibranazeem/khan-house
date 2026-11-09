import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { btnGhost, btnPrimary, field, PageHeader, Panel } from "@/components/admin/ui";
import { resetDemoData, saveSettings, useStore } from "@/lib/store";
import type { Settings } from "@/lib/types";

export const Route = createFileRoute("/admin/settings")({ component: SettingsPage });

function SettingsPage() {
  const saved = useStore((s) => s.settings);
  const [f, setF] = useState<Settings>(saved);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setF((p) => ({ ...p, [k]: v }));
  const dirty = JSON.stringify(f) !== JSON.stringify(saved);

  const quick = (k: "acceptingOrders" | "pickupEnabled" | "deliveryEnabled", v: boolean) => {
    saveSettings({ [k]: v });
    setF((p) => ({ ...p, [k]: v }));
    toast.success("Saved — live on the website now");
  };

  return (
    <>
      <PageHeader title="Settings" sub="Ordering, pricing, hours and website messages"
        actions={<button disabled={!dirty} onClick={() => { saveSettings(f); toast.success("Settings saved"); }} className={btnPrimary}><Save className="h-4 w-4" />Save changes</button>} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Online ordering" sub="These switches apply instantly">
          <div className="space-y-4">
            <Toggle label="Accepting online orders" sub="Turn off when you're slammed, sold out or closed early" checked={f.acceptingOrders} onChange={(v) => quick("acceptingOrders", v)} />
            <Toggle label="Pickup" checked={f.pickupEnabled} onChange={(v) => quick("pickupEnabled", v)} />
            <Toggle label="Delivery" checked={f.deliveryEnabled} onChange={(v) => quick("deliveryEnabled", v)} />
          </div>
        </Panel>
        <Panel title="Pricing & timing">
          <div className="grid grid-cols-2 gap-4">
            <Num label="Sales tax (%)" value={f.taxRate} step={0.01} onChange={(v) => set("taxRate", v)} />
            <Num label="Typical prep time (min)" value={f.prepMinutes} onChange={(v) => set("prepMinutes", v)} />
            <Num label="Delivery fee ($)" value={f.deliveryFee} step={0.01} onChange={(v) => set("deliveryFee", v)} />
            <Num label="Free delivery over ($)" value={f.freeDeliveryOver} onChange={(v) => set("freeDeliveryOver", v)} />
            <Num label="Delivery radius (miles)" value={f.deliveryRadiusMiles} onChange={(v) => set("deliveryRadiusMiles", v)} />
          </div>
        </Panel>
        <Panel title="Website messages">
          <Field label="Announcement bar (leave empty to hide)"><input value={f.announcement} onChange={(e) => set("announcement", e.target.value)} className={field} /></Field>
          <Field label="Location note" className="mt-4"><textarea rows={2} value={f.locationNote} onChange={(e) => set("locationNote", e.target.value)} className={field} /></Field>
        </Panel>
        <Panel title="Opening hours">
          <ul className="space-y-2">
            {f.hours.map((h, i) => (
              <li key={h.day} className="flex flex-wrap items-center gap-3 text-sm">
                <span className="w-24 font-semibold">{h.day}</span>
                <input type="time" value={h.open} disabled={h.closed} onChange={(e) => set("hours", f.hours.map((x, n) => (n === i ? { ...x, open: e.target.value } : x)))} className={`${field} w-32`} />
                <span>–</span>
                <input type="time" value={h.close} disabled={h.closed} onChange={(e) => set("hours", f.hours.map((x, n) => (n === i ? { ...x, close: e.target.value } : x)))} className={`${field} w-32`} />
                <label className="ml-auto flex items-center gap-2 text-xs font-semibold"><Switch checked={!h.closed} onCheckedChange={(v) => set("hours", f.hours.map((x, n) => (n === i ? { ...x, closed: !v } : x)))} />{h.closed ? "Closed" : "Open"}</label>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Demo data" sub="This preview stores data in this browser" className="xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-2xl text-sm text-muted-foreground">Orders, menu edits, staff and settings are saved in this browser so the whole system can be tried without any setup. Reset to start over with 45 days of sample orders. Connecting the production database makes everything shared across devices.</p>
            <button onClick={() => { if (confirm("Reset all demo data? Your edits will be lost.")) { resetDemoData(); location.reload(); } }} className={btnGhost}><RotateCcw className="h-4 w-4" />Reset demo data</button>
          </div>
        </Panel>
      </div>
    </>
  );
}

function Toggle({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl bg-muted/60 px-4 py-3">
      <span><span className="block font-semibold">{label}</span>{sub && <span className="text-xs text-muted-foreground">{sub}</span>}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <label className={`block ${className ?? ""}`}><span className="mb-1 block text-sm font-semibold">{label}</span>{children}</label>;
}
function Num({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return <Field label={label}><input type="number" min={0} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className={field} /></Field>;
}
