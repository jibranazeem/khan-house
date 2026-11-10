import { createFileRoute } from "@tanstack/react-router";
import { Clock, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { InquiryForm } from "@/components/site/InquiryForm";
import { useHoursSummary } from "@/components/site/SiteFooter";
import { BRAND, SOCIAL } from "@/lib/brand";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: `Contact — ${BRAND.name}` }, { name: "description", content: `Call, email or message ${BRAND.name} in ${BRAND.area}.` }] }),
  component: Contact,
});

function Contact() {
  const hours = useHoursSummary();
  const note = useStore((s) => s.settings.locationNote);
  const rows = [
    { Icon: Phone, label: "Call or text", value: BRAND.phone, href: BRAND.phoneHref },
    { Icon: Mail, label: "Email", value: BRAND.email, href: `mailto:${BRAND.email}` },
    { Icon: Instagram, label: "Instagram", value: `@${BRAND.instagramHandle}`, href: SOCIAL.instagram },
    { Icon: MapPin, label: "Find us · Get directions", value: BRAND.address, href: BRAND.mapsUrl },
  ];
  return (
    <>
      <PageHero eyebrow="Say hello" image="/images/hero/shawarma.jpg" title={<>Get in <span className="text-fire-gradient">Touch</span></>}
        sub="Questions, feedback, catering or an issue with an order — we'd love to hear from you." />
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:px-8 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          {rows.map(({ Icon, label, value, href }) => (
            <a key={label} href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer"
              className="flex items-center gap-4 rounded-2xl bg-card p-5 ring-1 ring-border transition hover:ring-fire/40">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-ember"><Icon className="h-5 w-5" /></span>
              <span><span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span><span className="font-bold">{value}</span></span>
            </a>
          ))}
          <div className="rounded-2xl bg-ink p-6 text-white">
            <p className="flex items-center gap-2 font-display text-2xl tracking-wide"><Clock className="h-5 w-5 text-ember" />Hours</p>
            <ul className="mt-3 space-y-1.5 text-sm text-white/75">{hours.map((h) => <li key={h.days} className="flex justify-between"><span>{h.days}</span><span>{h.text}</span></li>)}</ul>
            <p className="mt-4 text-xs text-white/50">{note}</p>
          </div>
        </div>
        <InquiryForm />
      </section>
    </>
  );
}
