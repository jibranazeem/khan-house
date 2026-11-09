import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Check, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { btnGhost, btnPrimary, field, PageHeader, Panel } from "@/components/admin/ui";
import { PERMISSIONS, ROLE_INFO, useSession, type Permission } from "@/lib/auth";
import { ROLE_LABEL, timeAgo } from "@/lib/format";
import { deleteStaff, saveStaff, uid, useStore } from "@/lib/store";
import type { Role, Staff } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/staff")({ component: StaffPage });

const ROLES: Role[] = ["owner", "manager", "cashier", "kitchen"];
const PERM_LABEL: Record<Permission, string> = { overview: "Dashboard & reports", orders: "Orders", menu: "Menu", finance: "Finance", customers: "Customers", messages: "Messages", staff: "Staff & roles", settings: "Settings" };

function StaffPage() {
  const staff = useStore((s) => s.staff);
  const { user } = useSession();
  const [adding, setAdding] = useState(false);
  const owners = staff.filter((s) => s.role === "owner" && s.active).length;

  const changeRole = (m: Staff, role: Role) => {
    if (m.role === "owner" && role !== "owner" && owners <= 1) return toast.error("There must be at least one active owner.");
    saveStaff({ ...m, role });
    toast.success(`${m.name} is now ${ROLE_LABEL[role]}`);
  };
  const toggleActive = (m: Staff, active: boolean) => {
    if (m.id === user?.id) return toast.error("You can't deactivate yourself.");
    if (!active && m.role === "owner" && owners <= 1) return toast.error("There must be at least one active owner.");
    saveStaff({ ...m, active });
  };

  return (
    <>
      <PageHeader title="Staff & Roles" sub="Control who can see orders, money and settings"
        actions={<button onClick={() => setAdding(true)} className={btnPrimary}><Plus className="h-4 w-4" />Add team member</button>} />
      <div className="overflow-x-auto rounded-2xl bg-card ring-1 ring-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border">{["Team member", "Role", "Last sign-in", "Active", ""].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {staff.map((m) => (
              <tr key={m.id} className={cn(!m.active && "opacity-50")}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-bold text-white">{m.name[0]}</span>
                    <span><span className="block font-semibold">{m.name}{m.id === user?.id && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}</span><span className="text-xs text-muted-foreground">{m.email}</span></span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select value={m.role} onChange={(e) => changeRole(m, e.target.value as Role)} disabled={m.id === user?.id} className={cn(field, "w-36")}>
                    {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{m.lastLogin ? timeAgo(m.lastLogin) : "Never"}</td>
                <td className="px-4 py-3"><Switch checked={m.active} onCheckedChange={(v) => toggleActive(m, v)} /></td>
                <td className="px-4 py-3 text-right">
                  {m.id !== user?.id && (
                    <button onClick={() => { if (m.role === "owner" && owners <= 1) return toast.error("Can't remove the last owner."); if (confirm(`Remove ${m.name}?`)) { deleteStaff(m.id); toast.success("Removed"); } }}
                      aria-label={`Remove ${m.name}`} className="rounded-lg p-2 text-fire hover:bg-fire/10"><Trash2 className="h-4 w-4" /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Panel title="What each role can do" className="mt-6" bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Area</th>
                {ROLES.map((r) => <th key={r} className="px-4 py-3 text-center"><span className="block font-bold">{ROLE_LABEL[r]}</span><span className="block text-[11px] font-normal text-muted-foreground">{ROLE_INFO[r].summary}</span></th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(Object.keys(PERMISSIONS) as Permission[]).map((p) => (
                <tr key={p}>
                  <td className="px-4 py-2.5 font-semibold">{PERM_LABEL[p]}</td>
                  {ROLES.map((r) => (
                    <td key={r} className="px-4 py-2.5 text-center">
                      {(PERMISSIONS[p] as Role[]).includes(r)
                        ? <Check className="mx-auto h-4 w-4 text-[oklch(0.5_0.13_145)]" aria-label="Allowed" />
                        : <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label="Not allowed" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <AddStaff open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

function AddStaff({ open, onClose }: { open: boolean; onClose: () => void }) {
  const staff = useStore((s) => s.staff);
  const [f, setF] = useState({ name: "", email: "", role: "cashier" as Role, password: "" });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (staff.some((s) => s.email.toLowerCase() === f.email.trim().toLowerCase())) return toast.error("Someone already uses that email.");
    saveStaff({ id: uid(), name: f.name.trim(), email: f.email.trim().toLowerCase(), password: f.password, role: f.role, active: true, createdAt: new Date().toISOString(), lastLogin: null });
    toast.success(`${f.name} added as ${ROLE_LABEL[f.role]}`);
    setF({ name: "", email: "", role: "cashier", password: "" });
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="font-display text-3xl tracking-wide">Add team member</DialogTitle>
        <form onSubmit={submit} className="space-y-4">
          <label className="block"><span className="mb-1 block text-sm font-semibold">Full name</span><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={field} /></label>
          <label className="block"><span className="mb-1 block text-sm font-semibold">Email</span><input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={field} /></label>
          <label className="block"><span className="mb-1 block text-sm font-semibold">Temporary password</span><input required minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className={field} /></label>
          <div>
            <span className="mb-1 block text-sm font-semibold">Role</span>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button type="button" key={r} onClick={() => setF({ ...f, role: r })} className={cn("rounded-xl border-2 p-3 text-left", f.role === r ? "border-fire bg-fire/5" : "border-border")}>
                  <span className="block font-bold">{ROLE_LABEL[r]}</span><span className="block text-xs text-muted-foreground">{ROLE_INFO[r].summary}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
            <button className={btnPrimary}>Add member</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
