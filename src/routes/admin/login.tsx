import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { homeFor, signIn, useSession } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/format";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/admin/login")({ component: Login });

const DEMO: { role: Role; email: string; password: string }[] = [
  { role: "owner", email: "owner@khanhouse.co", password: "owner123" },
  { role: "manager", email: "manager@khanhouse.co", password: "manager123" },
  { role: "cashier", email: "cashier@khanhouse.co", password: "cashier123" },
  { role: "kitchen", email: "kitchen@khanhouse.co", password: "kitchen123" },
];

function Login() {
  const navigate = useNavigate();
  const { user, ready } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (ready && user) navigate({ to: homeFor(user.role), replace: true }); }, [ready, user, navigate]);

  const submit = (e: FormEvent, creds?: { email: string; password: string }) => {
    e.preventDefault();
    setBusy(true); setError("");
    setTimeout(() => {
      try {
        const u = signIn(creds?.email ?? email, creds?.password ?? password);
        navigate({ to: homeFor(u.role) });
      } catch (err) {
        setError((err as Error).message); setBusy(false);
      }
    }, 300);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-4 py-12">
      <img src="/images/hero/skewers.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/90 to-fire-deep/40" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="mx-auto mb-8 block w-fit text-2xl"><Logo /></Link>
        <form onSubmit={submit} className="rounded-3xl bg-card p-8 shadow-2xl">
          <h1 className="font-display text-4xl tracking-wide">Staff Sign In</h1>
          <p className="text-sm text-muted-foreground">Orders, menu, finance and team — all in one place.</p>
          <label className="mt-6 block"><span className="mb-1.5 block text-sm font-semibold">Email</span>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" className="w-full rounded-xl border border-input px-3.5 py-2.5 text-sm outline-none focus:border-fire focus:ring-2 focus:ring-fire/20" /></label>
          <label className="mt-4 block"><span className="mb-1.5 block text-sm font-semibold">Password</span>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="w-full rounded-xl border border-input px-3.5 py-2.5 text-sm outline-none focus:border-fire focus:ring-2 focus:ring-fire/20" /></label>
          {error && <p className="mt-3 rounded-lg bg-fire/10 px-3 py-2 text-sm text-fire">{error}</p>}
          <button disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-fire py-3 font-bold uppercase tracking-wider text-white hover:bg-fire-deep disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}Sign In
          </button>
        </form>
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5 text-white backdrop-blur">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Demo accounts — one click to try each role</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {DEMO.map((d) => (
              <button key={d.role} onClick={(e) => submit(e, d)} className="rounded-xl bg-white/10 px-3 py-2 text-left text-sm transition hover:bg-fire">
                <span className="block font-bold">{ROLE_LABEL[d.role]}</span>
                <span className="block truncate text-[11px] text-white/60">{d.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
