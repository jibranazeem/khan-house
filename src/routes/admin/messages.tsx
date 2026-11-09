import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, Mail, MailOpen, Phone, Trash2, Users } from "lucide-react";
import { btnGhost, btnPrimary, Empty, PageHeader, Segmented } from "@/components/admin/ui";
import { BRAND } from "@/lib/brand";
import { fmtDateTime, timeAgo } from "@/lib/format";
import { deleteMessage, setMessageRead, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/messages")({ component: Messages });

function Messages() {
  const messages = useStore((s) => s.messages);
  const [filter, setFilter] = useState<"all" | "unread" | "catering">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const rows = messages.filter((m) => filter === "all" || (filter === "unread" ? !m.read : m.type === "Catering"));
  const open = messages.find((m) => m.id === openId) ?? rows[0];

  const select = (id: string) => { setOpenId(id); setMessageRead(id, true); };

  return (
    <>
      <PageHeader title="Messages" sub="Contact form, catering requests and feedback"
        actions={<Segmented value={filter} onChange={setFilter} options={[{ value: "all", label: "All" }, { value: "unread", label: "Unread" }, { value: "catering", label: "Catering" }]} />} />
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          {rows.map((m) => (
            <li key={m.id}>
              <button onClick={() => select(m.id)} className={cn("block w-full px-4 py-3 text-left transition hover:bg-muted/50", open?.id === m.id && "bg-muted")}>
                <div className="flex items-center gap-2">
                  {!m.read && <span className="h-2 w-2 rounded-full bg-fire" />}
                  <span className={cn("truncate text-sm", !m.read ? "font-extrabold" : "font-semibold")}>{m.name}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">{timeAgo(m.createdAt)}</span>
                </div>
                <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", m.type === "Catering" ? "bg-fire/10 text-fire" : "bg-muted text-muted-foreground")}>{m.type}</span>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{m.message}</p>
              </button>
            </li>
          ))}
          {!rows.length && <Empty>Inbox zero 🎉</Empty>}
        </ul>
        {open ? (
          <article className="rounded-2xl bg-card p-6 ring-1 ring-border">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", open.type === "Catering" ? "bg-fire/10 text-fire" : "bg-muted text-muted-foreground")}>{open.type}</span>
                <h2 className="mt-2 font-display text-3xl tracking-wide">{open.name}</h2>
                <p className="text-xs text-muted-foreground">{fmtDateTime(open.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setMessageRead(open.id, !open.read)} className={btnGhost}>{open.read ? <><Mail className="h-4 w-4" />Mark unread</> : <><MailOpen className="h-4 w-4" />Mark read</>}</button>
                <button onClick={() => { deleteMessage(open.id); setOpenId(null); }} className={cn(btnGhost, "text-fire")} aria-label="Delete message"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            {open.type === "Catering" && (
              <div className="mt-4 flex flex-wrap gap-3">
                {open.eventDate && <span className="inline-flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm font-semibold"><CalendarDays className="h-4 w-4 text-fire" />{new Date(`${open.eventDate}T12:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>}
                {open.guests && <span className="inline-flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm font-semibold"><Users className="h-4 w-4 text-fire" />{open.guests} guests</span>}
              </div>
            )}
            <p className="mt-5 whitespace-pre-wrap leading-relaxed">{open.message}</p>
            <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
              <a href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: your ${open.type.toLowerCase()} message to ${BRAND.name}`)}`} className={btnPrimary}><Mail className="h-4 w-4" />Reply by email</a>
              {open.phone && <a href={`tel:${open.phone}`} className={btnGhost}><Phone className="h-4 w-4" />{open.phone}</a>}
            </div>
          </article>
        ) : <div className="rounded-2xl bg-card ring-1 ring-border"><Empty>Select a message.</Empty></div>}
      </div>
    </>
  );
}
