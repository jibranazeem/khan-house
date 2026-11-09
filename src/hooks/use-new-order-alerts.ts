import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { money } from "@/lib/format";
import { useStore } from "@/lib/store";

let audio: AudioContext | null = null;

/** Browsers only allow audio after a user gesture, so the context is created on first interaction. */
function unlockAudio() {
  if (audio || typeof window === "undefined") return;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (Ctx) audio = new Ctx();
}

export function playChime() {
  if (!audio) return;
  if (audio.state === "suspended") audio.resume().catch(() => {});
  const now = audio.currentTime;
  [0, 0.16, 0.32].forEach((offset, n) => {
    const osc = audio!.createOscillator();
    const gain = audio!.createGain();
    osc.type = "triangle";
    osc.frequency.value = [784, 988, 1319][n];
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.3, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.22);
    osc.connect(gain).connect(audio!.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.24);
  });
}

/** Toast + chime whenever a new order arrives (from this tab or any other). Returns the count of new orders. */
export function useNewOrderAlerts() {
  const navigate = useNavigate();
  const fresh = useStore((s) => s.orders.filter((o) => o.status === "new"));
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    return () => { window.removeEventListener("pointerdown", unlockAudio); window.removeEventListener("keydown", unlockAudio); };
  }, []);

  const ids = fresh.map((o) => o.id).join(",");
  useEffect(() => {
    if (!seen.current) { seen.current = new Set(fresh.map((o) => o.id)); return; }
    const added = fresh.filter((o) => !seen.current!.has(o.id));
    added.forEach((o) => seen.current!.add(o.id));
    if (!added.length) return;
    playChime();
    added.slice(0, 3).forEach((o) => toast.success(`New order ${o.number}`, {
      description: `${o.customer.name} · ${o.type} · ${money(o.total)}`,
      duration: 15_000,
      action: { label: "View", onClick: () => navigate({ to: "/admin/orders" }) },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the id list
  }, [ids]);

  return fresh.length;
}
