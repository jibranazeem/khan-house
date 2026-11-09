import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { sendMessage } from "@/lib/store";
import type { MessageType } from "@/lib/types";
import { cn } from "@/lib/utils";

const input = "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-fire focus:ring-2 focus:ring-fire/20";

/** Contact + catering form. Submissions land in the dashboard's Messages inbox. */
export function InquiryForm({ catering = false, className }: { catering?: boolean; className?: string }) {
  const [type, setType] = useState<MessageType>(catering ? "Catering" : "General");
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "", eventDate: "", guests: "" });
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const isCatering = type === "Catering";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setState("busy");
    setTimeout(() => {
      sendMessage({
        type, name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), message: f.message.trim(),
        eventDate: isCatering && f.eventDate ? f.eventDate : null, guests: isCatering && f.guests ? Number(f.guests) : null,
      });
      setState("done");
    }, 600);
  };

  if (state === "done") {
    return (
      <div className={cn("flex flex-col items-center justify-center rounded-3xl bg-card p-10 text-center ring-1 ring-border", className)}>
        <CheckCircle2 className="h-14 w-14 text-leaf" />
        <p className="mt-4 font-display text-4xl tracking-wide">Message received!</p>
        <p className="mt-2 max-w-sm text-muted-foreground">{isCatering ? "We'll reach out within one business day with a custom catering quote." : "Thanks for reaching out — we'll get back to you shortly."}</p>
        <button onClick={() => { setState("idle"); setF({ name: "", email: "", phone: "", message: "", eventDate: "", guests: "" }); }} className="mt-6 text-sm font-bold text-fire">Send another</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cn("rounded-3xl bg-card p-6 shadow-[0_30px_60px_-40px_rgba(0,0,0,.6)] ring-1 ring-border md:p-8", className)}>
      {!catering && (
        <div className="mb-5 flex flex-wrap gap-2">
          {(["General", "Catering", "Order Issue", "Feedback"] as MessageType[]).map((t) => (
            <button type="button" key={t} onClick={() => setType(t)}
              className={cn("rounded-full border px-4 py-1.5 text-sm font-bold transition", type === t ? "border-fire bg-fire text-white" : "border-border hover:border-fire/50")}>{t}</button>
          ))}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="mb-1.5 block text-sm font-semibold">Name</span><input required minLength={2} value={f.name} onChange={set("name")} className={input} autoComplete="name" /></label>
        <label className="block"><span className="mb-1.5 block text-sm font-semibold">Phone</span><input type="tel" value={f.phone} onChange={set("phone")} className={input} autoComplete="tel" /></label>
        <label className="block sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold">Email</span><input required type="email" value={f.email} onChange={set("email")} className={input} autoComplete="email" /></label>
        {isCatering && (
          <>
            <label className="block"><span className="mb-1.5 block text-sm font-semibold">Event date</span><input type="date" value={f.eventDate} onChange={set("eventDate")} className={input} /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-semibold">Guests (approx.)</span><input type="number" min={10} max={2000} value={f.guests} onChange={set("guests")} className={input} /></label>
          </>
        )}
        <label className="block sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold">{isCatering ? "Tell us about your event" : "Message"}</span>
          <textarea required minLength={5} rows={5} value={f.message} onChange={set("message")} className={input}
            placeholder={isCatering ? "Type of event, location, menu ideas, setup needs…" : "How can we help?"} />
        </label>
      </div>
      <button disabled={state === "busy"} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-fire py-3.5 font-bold uppercase tracking-wider text-white transition hover:bg-fire-deep disabled:opacity-60">
        {state === "busy" && <Loader2 className="h-4 w-4 animate-spin" />}{isCatering ? "Request a Quote" : "Send Message"}
      </button>
    </form>
  );
}
