import { Link } from "@tanstack/react-router";
import { Clock, Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { BRAND, SOCIAL } from "@/lib/brand";
import { to12h } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Logo } from "./Logo";

export function TikTok({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
    </svg>
  );
}

/** Groups consecutive days with identical hours: "Mon – Sun · 11:00 am – 9:10 pm". */
export function useHoursSummary() {
  const hours = useStore((s) => s.settings.hours);
  const rows: { days: string; text: string }[] = [];
  hours.forEach((h, i) => {
    const text = h.closed ? "Closed" : `${to12h(h.open)} – ${to12h(h.close)}`;
    const last = rows[rows.length - 1];
    const short = h.day.slice(0, 3);
    if (last && last.text === text && i > 0) last.days = `${last.days.split(" – ")[0]} – ${short}`;
    else rows.push({ days: short, text });
  });
  return rows;
}

export function SiteFooter() {
  const hours = useHoursSummary();
  const icons = [
    { href: SOCIAL.instagram, label: "Instagram", Icon: Instagram },
    { href: SOCIAL.facebook, label: "Facebook", Icon: Facebook },
    { href: SOCIAL.tiktok, label: "TikTok", Icon: TikTok },
  ];
  return (
    <footer className="relative overflow-hidden bg-ink text-white no-print">
      <div className="grain pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-fire/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-2 md:px-8 lg:grid-cols-[1.4fr_1fr_1.1fr_1.1fr]">
        <div>
          <Logo className="text-xl" />
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-ember">{BRAND.tagline}</p>
          <p className="mt-5 max-w-sm leading-relaxed text-white/65">{BRAND.slogan} 100% halal hibachi and Mediterranean plates, cooked to order in {BRAND.area}.</p>
          <div className="mt-6 flex gap-3">
            {icons.map(({ href, label, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:border-fire hover:bg-fire hover:text-white">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="font-display text-xl tracking-wider text-ember">Explore</p>
          <ul className="mt-4 space-y-2.5 text-white/75">
            <li><Link to="/menu" className="hover:text-white">Order Online</Link></li>
            <li><Link to="/catering" className="hover:text-white">Catering &amp; Events</Link></li>
            <li><Link to="/about" className="hover:text-white">Our Story</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link to="/track" className="hover:text-white">Track an Order</Link></li>
            <li><a href={SOCIAL.doordash} target="_blank" rel="noreferrer" className="hover:text-white">Find us on DoorDash</a></li>
          </ul>
        </div>
        <div>
          <p className="font-display text-xl tracking-wider text-ember">Hours</p>
          <ul className="mt-4 space-y-2.5 text-white/75">
            {hours.map((h) => (
              <li key={h.days} className="flex items-start gap-3"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-ember" /><span><span className="text-white">{h.days}</span><br />{h.text}</span></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-display text-xl tracking-wider text-ember">Get in Touch</p>
          <div className="mt-4 space-y-3 text-white/75">
            <a href={BRAND.phoneHref} className="flex items-center gap-3 hover:text-white"><Phone className="h-4 w-4 text-ember" />{BRAND.phone}</a>
            <a href={`mailto:${BRAND.email}`} className="flex items-center gap-3 hover:text-white"><Mail className="h-4 w-4 text-ember" />{BRAND.email}</a>
            <p className="flex items-center gap-3"><MapPin className="h-4 w-4 text-ember" />{BRAND.city}, {BRAND.region}</p>
            <a href={SOCIAL.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-white"><Instagram className="h-4 w-4 text-ember" />@{BRAND.instagramHandle}</a>
          </div>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-white/45 sm:flex-row md:px-8">
          <p>© {new Date().getFullYear()} {BRAND.name}. All rights reserved. · 100% Halal</p>
          <Link to="/admin/login" className="hover:text-white/80">Staff login</Link>
        </div>
      </div>
    </footer>
  );
}
