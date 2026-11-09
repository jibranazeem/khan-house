import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, Check, Flame, GraduationCap, Heart, PartyPopper, Trophy } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { InquiryForm } from "@/components/site/InquiryForm";
import { Eyebrow } from "@/components/site/Eyebrow";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/catering")({
  head: () => ({
    meta: [
      { title: `Halal Catering in ${BRAND.area} — ${BRAND.name}` },
      { name: "description", content: "Halal hibachi and Mediterranean catering for offices, weddings, graduations and game days around Apex and the Triangle." },
    ],
  }),
  component: Catering,
});

const PACKAGES = [
  { name: "Platter Spread", per: "from $15 / guest", desc: "Chicken over rice, chicken & lamb mix and falafel trays with salad, rice and sauces.", items: ["Choice of 2 proteins", "Yellow rice & fresh salad", "White & hot sauce", "Plates, cutlery, napkins"] },
  { name: "Hibachi Feast", per: "from $18 / guest", desc: "Hibachi chicken & shrimp with fried rice, veggies and yum yum — crowd favorite.", items: ["Hibachi chicken & shrimp", "Fried rice & vegetables", "Yum yum & teriyaki", "Chafing dishes included"], hot: true },
  { name: "Live Grill", per: "custom quote", desc: "We bring the grill and cook on-site. Perfect for weddings, festivals and big celebrations.", items: ["Cooked fresh on-site", "Full menu available", "Service staff", "100+ guests"] },
];

const EVENTS = [
  { Icon: Briefcase, label: "Office lunches" }, { Icon: Heart, label: "Weddings & mehndi" }, { Icon: GraduationCap, label: "Graduations" },
  { Icon: Trophy, label: "Game days" }, { Icon: PartyPopper, label: "Birthdays" }, { Icon: Flame, label: "Festivals & Eid" },
];

function Catering() {
  return (
    <>
      <PageHero eyebrow="Catering & Events" image="/images/hero/kebab-plate.jpg"
        title={<>Halal Catering<br /><span className="text-fire-gradient">Done Right</span></>}
        sub="Big flavor for big groups. Tell us about your event and we'll build a menu that fits your crowd and your budget." />

      <section className="bg-cream py-20">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <Reveal className="no-scrollbar flex justify-start gap-3 overflow-x-auto pb-2 md:justify-center">
            {EVENTS.map(({ Icon, label }) => (
              <span key={label} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-card px-5 py-2.5 text-sm font-bold ring-1 ring-border"><Icon className="h-4 w-4 text-fire" />{label}</span>
            ))}
          </Reveal>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {PACKAGES.map((p, n) => (
              <Reveal key={p.name} delay={n as 0 | 1 | 2}>
                <div className={`relative flex h-full flex-col rounded-3xl p-8 ${p.hot ? "bg-ink text-white" : "bg-card ring-1 ring-border"}`}>
                  {p.hot && <span className="absolute -top-3 left-8 rounded-full bg-fire-gradient px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink">Most popular</span>}
                  <p className="font-display text-4xl tracking-wide">{p.name}</p>
                  <p className={`mt-1 font-bold ${p.hot ? "text-gold" : "text-fire"}`}>{p.per}</p>
                  <p className={`mt-4 text-sm leading-relaxed ${p.hot ? "text-white/70" : "text-muted-foreground"}`}>{p.desc}</p>
                  <ul className="mt-6 space-y-2.5 text-sm">
                    {p.items.map((i) => <li key={i} className="flex items-center gap-2"><Check className={`h-4 w-4 ${p.hot ? "text-ember" : "text-fire"}`} />{i}</li>)}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">Package prices are starting points — final quotes depend on menu, guest count and location.</p>
        </div>
      </section>

      <section className="bg-smoke py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:px-8 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <Eyebrow>Get a Quote</Eyebrow>
            <h2 className="mt-5 font-display text-5xl leading-[0.95] tracking-wide md:text-6xl">Let's Plan Your <span className="text-fire-gradient">Event</span></h2>
            <p className="mt-5 text-lg text-muted-foreground">Share a few details and we'll get back to you within one business day. Need it sooner? Call <a href={BRAND.phoneHref} className="font-bold text-fire">{BRAND.phone}</a>.</p>
            <ol className="mt-8 space-y-4">
              {["Tell us the date, headcount and vibe", "We send a custom menu & quote", "We cook, deliver and set up — you enjoy"].map((s, n) => (
                <li key={s} className="flex items-center gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink font-display text-xl text-ember">{n + 1}</span><span className="font-semibold">{s}</span></li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={1}><InquiryForm catering /></Reveal>
        </div>
      </section>
    </>
  );
}
