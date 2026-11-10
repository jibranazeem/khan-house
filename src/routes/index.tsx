import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, ChefHat, ChevronLeft, ChevronRight, Clock, Flame, Instagram, MapPin, Phone, ShieldCheck, ShoppingBag, Truck, Users } from "lucide-react";
import { Eyebrow } from "@/components/site/Eyebrow";
import { Reveal, useInView } from "@/components/site/Reveal";
import { FeaturedCard } from "@/components/site/MenuItemCard";
import { ItemDialog } from "@/components/site/ItemDialog";
import { useHoursSummary } from "@/components/site/SiteFooter";
import { BRAND, SOCIAL } from "@/lib/brand";
import { useStore } from "@/lib/store";
import type { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${BRAND.name} — Halal Hibachi & Mediterranean Fusion · ${BRAND.area}` },
      { name: "description", content: `Fire-grilled, 100% halal hibachi and Mediterranean plates in ${BRAND.area}. Order online for pickup or delivery.` },
      { property: "og:title", content: `${BRAND.name} · ${BRAND.area}` },
      { property: "og:description", content: BRAND.slogan },
    ],
  }),
  component: Home,
});

const SLIDES = [
  { image: "/images/hero/skewers.jpg", eyebrow: "100% Halal · Cooked to order", title: ["Fire-Grilled.", "Unforgettable."], sub: "Hibachi heat meets Mediterranean soul. Every plate seared fresh the moment you order.", cta: "Order Now" },
  { image: "/images/hero/mixed-grill.jpg", eyebrow: "Hibachi · Mediterranean · Fusion", title: ["Two Cuisines.", "One Grill."], sub: "Chicken over rice, lamb gyros, hibachi chicken & shrimp — your favorites from two worlds, in one order.", cta: "See the Menu" },
  { image: "/images/hero/noodles.jpg", eyebrow: "Straight off the flat-top", title: ["Sizzling", "Hibachi."], sub: "Garlic butter, soy glaze, smoky char and our yum yum sauce. Rice or noodles — your call.", cta: "Order Hibachi" },
  { image: "/images/hero/kebab-plate.jpg", eyebrow: "Catering & Events", title: ["Feed the", "Whole Crew."], sub: "Office lunches, weddings, game days — halal platters that make you the hero of the party.", cta: "Plan Catering", to: "/catering" as const },
];
const SLIDE_MS = 6500;

function Home() {
  const [selected, setSelected] = useState<MenuItem | null>(null);
  return (
    <>
      <Hero />
      <Marquee />
      <TwoWorlds />
      <Favorites onSelect={setSelected} />
      <Stats />
      <HowItWorks />
      <CateringBand />
      <VisitUs />
      <ItemDialog item={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function Embers() {
  // Fixed positions so server and client render the same markup.
  const dots = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    left: `${(i * 53) % 100}%`, size: 2 + ((i * 7) % 4), dur: 6 + ((i * 3) % 7), delay: (i * 1.3) % 8,
  })), []);
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
      {dots.map((d, i) => (
        <span key={i} className="ember-dot absolute bottom-0 rounded-full bg-ember shadow-[0_0_8px_2px_var(--ember)]"
          style={{ left: d.left, width: d.size, height: d.size, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }} />
      ))}
    </div>
  );
}

function Hero() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useCallback((n: number) => setI((n + SLIDES.length) % SLIDES.length), []);
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => go(i + 1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [i, paused, go]);

  return (
    <section className="relative h-[100svh] min-h-[600px] overflow-hidden bg-ink" aria-roledescription="carousel" aria-label="Featured"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {SLIDES.map((s, n) => (
        <div key={s.image} aria-hidden={n !== i} className={cn("absolute inset-0 transition-opacity duration-[1400ms] ease-in-out", n === i ? "z-[1] opacity-100" : "z-0 opacity-0")}>
          <img src={s.image} alt="" className={cn("h-full w-full object-cover", n === i && "hero-zoom")} fetchPriority={n === 0 ? "high" : "low"} />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/65 to-ink/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-ink/50" />
          {n === i && (
            <div className="absolute inset-0 z-20 mx-auto flex max-w-7xl items-center px-6 pb-20 pt-28 md:px-8">
              <div className="hero-copy max-w-4xl text-white">
                <p className="inline-flex items-center gap-2 rounded-full border border-ember/40 bg-ink/40 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-gold backdrop-blur">
                  <Flame className="flicker h-3.5 w-3.5 text-ember" />{s.eyebrow}
                </p>
                <h1 className="mt-6 font-display text-[3.3rem] leading-[0.9] tracking-wide sm:text-8xl lg:text-[8.5rem]">
                  <span className="block">{s.title[0]}</span>
                  <span className="block text-fire-gradient">{s.title[1]}</span>
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80 md:text-xl">{s.sub}</p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Link to={s.to ?? "/menu"} className="group inline-flex items-center gap-3 rounded-full bg-fire px-8 py-4 font-bold uppercase tracking-wider text-white shadow-[0_15px_40px_-12px_var(--fire)] transition hover:bg-fire-deep">
                    {s.cta}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>
                  <a href={BRAND.phoneHref} className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-4 font-bold uppercase tracking-wider text-white transition hover:border-white hover:bg-white/10">
                    <Phone className="h-4 w-4" />Call to order
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
      <Embers />

      <div className="absolute inset-x-0 bottom-8 z-20 mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 md:px-8">
        <div className="flex items-center gap-3">
          {SLIDES.map((s, n) => (
            <button key={s.image} onClick={() => go(n)} aria-label={`Go to slide ${n + 1}`} aria-current={n === i}
              className="relative h-1 w-8 overflow-hidden rounded-full bg-white/25 sm:w-12 md:w-16">
              {n === i && <span key={`${i}-${paused}`} className={cn("absolute inset-0 bg-fire-gradient", !paused && "hero-progress")} style={{ animationDuration: `${SLIDE_MS}ms` }} />}
            </button>
          ))}
          <span className="ml-2 whitespace-nowrap font-display text-lg tracking-widest text-white/70">0{i + 1} / 0{SLIDES.length}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => go(i - 1)} aria-label="Previous slide" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-white transition hover:border-fire hover:bg-fire"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={() => go(i + 1)} aria-label="Next slide" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-white transition hover:border-fire hover:bg-fire"><ChevronRight className="h-5 w-5" /></button>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const words = ["Chicken over Rice", "Hibachi Shrimp", "Lamb Gyro", "Chicken & Lamb Mix", "Lamb over Rice", "Falafel", "Seekh Kebabs", "Wings", "Samosas"];
  const row = [...words, ...words];
  return (
    <div className="overflow-hidden bg-fire-gradient py-4 text-ink">
      <div className="marquee flex w-max gap-8 whitespace-nowrap font-display text-3xl tracking-wider">
        {row.map((w, n) => <span key={n} className="flex items-center gap-8">{w}<Flame className="h-5 w-5" /></span>)}
      </div>
    </div>
  );
}

function TwoWorlds() {
  const cards = [
    { cat: "mediterranean", title: "Mediterranean", text: "Halal chicken, lamb and falafel over seasoned yellow rice, crisp salad and that white sauce everyone talks about.", image: "/images/menu/chicken-over-rice.jpg" },
    { cat: "hibachi", title: "Hibachi", text: "Seared on a screaming-hot flat-top with garlic butter and soy, sesame, scallions and a side of yum yum.", image: "/images/menu/hibachi-chicken.jpg" },
  ];
  return (
    <section className="relative bg-cream py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <Eyebrow>The Khan House Way</Eyebrow>
          <h2 className="mt-5 font-display text-5xl leading-[0.95] tracking-wide text-ink md:text-7xl">Where Hibachi Meets the <span className="text-fire-gradient">Mediterranean</span></h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            We took two of the best things to ever hit a grill and put them under one roof. Everything is 100% halal, marinated in-house and cooked to order — never sitting under a heat lamp.
          </p>
        </Reveal>
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {cards.map((c, n) => (
            <Reveal key={c.cat} delay={n as 0 | 1}>
              <Link to="/menu" hash={c.cat} className="group relative block aspect-[4/3] overflow-hidden rounded-3xl bg-ink md:aspect-[5/4]">
                <img src={c.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-8 text-white md:p-10">
                  <p className="font-display text-6xl tracking-wide md:text-7xl">{c.title}</p>
                  <p className="mt-3 max-w-md text-white/75">{c.text}</p>
                  <span className="mt-6 inline-flex items-center gap-2 font-bold uppercase tracking-wider text-ember transition group-hover:gap-4">Explore {c.title}<ArrowRight className="h-4 w-4" /></span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Favorites({ onSelect }: { onSelect: (i: MenuItem) => void }) {
  const items = useStore((s) => s.menu.filter((m) => m.featured).sort((a, b) => a.sort - b.sort).slice(0, 6));
  return (
    <section className="relative overflow-hidden bg-ink py-24 text-white md:py-32">
      <div className="grain pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-fire/25 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-6 md:px-8">
        <Reveal className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Eyebrow light>Fan Favorites</Eyebrow>
            <h2 className="mt-5 font-display text-5xl tracking-wide md:text-7xl">The Plates People <span className="text-fire-gradient">Come Back For</span></h2>
          </div>
          <Link to="/menu" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/25 px-6 py-3 font-bold uppercase tracking-wider transition hover:border-fire hover:bg-fire">Full Menu<ArrowRight className="h-4 w-4" /></Link>
        </Reveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, n) => <Reveal key={it.id} delay={(n % 3) as 0 | 1 | 2}><FeaturedCard item={it} onSelect={onSelect} /></Reveal>)}
        </div>
      </div>
    </section>
  );
}

function Counter({ to, suffix = "", start }: { to: number; suffix?: string; start: boolean }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return setV(to);
    let raf = 0;
    const t0 = performance.now(), dur = 1600;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, to]);
  return <>{v}{suffix}</>;
}

function Stats() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const menuCount = useStore((s) => s.menu.length);
  const prep = useStore((s) => s.settings.prepMinutes);
  const items = [
    { value: <Counter to={100} suffix="%" start={inView} />, label: "Halal, always" },
    { value: <Counter to={menuCount} start={inView} />, label: "Plates on the menu" },
    { value: <><Counter to={prep} start={inView} /> min</>, label: "Typical ready time" },
    { value: <Counter to={7} start={inView} />, label: "Days a week" },
  ];
  return (
    <section className="relative overflow-hidden bg-fire py-16 text-white md:py-20">
      <div className="grain pointer-events-none absolute inset-0 opacity-60" />
      <div ref={ref} className="relative mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-6 md:px-8 lg:grid-cols-4">
        {items.map((s, n) => (
          <div key={s.label} className={cn("border-white/25 text-center", n % 2 === 1 && "border-l", n === 2 && "lg:border-l")}>
            <p className="font-display text-6xl tabular-nums tracking-wide md:text-7xl">{s.value}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.25em] text-white/80 sm:text-sm">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { Icon: ShoppingBag, title: "Order Online", text: "Build your plate, pick your sauces and pay securely in under a minute." },
    { Icon: ChefHat, title: "We Fire It Up", text: "Your order hits our grill the moment it lands — nothing pre-made, nothing reheated." },
    { Icon: Truck, title: "Pickup or Delivery", text: "Grab it hot at the window or have it brought to your door around Apex." },
  ];
  return (
    <section className="bg-cream py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <Reveal className="text-center">
          <Eyebrow>Fast & Fresh</Eyebrow>
          <h2 className="mt-5 font-display text-5xl tracking-wide text-ink md:text-7xl">How It Works</h2>
        </Reveal>
        <div className="relative mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
          <div className="absolute left-[16%] right-[16%] top-12 hidden h-0.5 bg-gradient-to-r from-transparent via-fire/40 to-transparent md:block" />
          {steps.map(({ Icon, title, text }, n) => (
            <Reveal key={title} delay={n as 0 | 1 | 2} className="relative flex flex-col items-center text-center">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-ink shadow-[0_20px_40px_-20px_rgba(0,0,0,.6)]">
                <Icon className="h-9 w-9 text-ember" strokeWidth={1.6} />
                <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-fire font-display text-lg text-white">{n + 1}</span>
              </div>
              <h3 className="mt-7 font-display text-4xl tracking-wide text-ink">{title}</h3>
              <p className="mt-2 max-w-xs text-muted-foreground">{text}</p>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold text-ink/70">
          <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-leaf" />100% halal meat</span>
          <span className="inline-flex items-center gap-2"><Flame className="h-4 w-4 text-fire" />Cooked to order</span>
          <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-ember" />Live order tracking</span>
        </Reveal>
      </div>
    </section>
  );
}

function CateringBand() {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <img src="/images/hero/grill.jpg" alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-24 md:grid-cols-[1.3fr_1fr] md:px-8 md:py-32">
        <Reveal>
          <Eyebrow light>Catering & Events</Eyebrow>
          <h2 className="mt-5 font-display text-5xl leading-[0.95] tracking-wide md:text-7xl">Bring the Grill <span className="text-fire-gradient">to Your Event</span></h2>
          <p className="mt-6 max-w-xl text-lg text-white/75">From office lunches for 20 to weddings for 300 — halal platters, hibachi trays and gyro bars, set up and served hot.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/catering" className="inline-flex items-center gap-2 rounded-full bg-fire px-8 py-4 font-bold uppercase tracking-wider text-white transition hover:bg-fire-deep">Get a Quote<ArrowRight className="h-4 w-4" /></Link>
            <a href={BRAND.phoneHref} className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-4 font-bold uppercase tracking-wider transition hover:bg-white/10"><Phone className="h-4 w-4" />{BRAND.phone}</a>
          </div>
        </Reveal>
        <Reveal delay={1} className="grid grid-cols-2 gap-4">
          {[{ Icon: Users, k: "20–300+", v: "Guests served" }, { Icon: ShieldCheck, k: "Halal", v: "Every single bite" }, { Icon: Truck, k: "Delivered", v: "Set up & served" }, { Icon: Flame, k: "Live grill", v: "On-site option" }].map(({ Icon, k, v }) => (
            <div key={k} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <Icon className="h-6 w-6 text-ember" />
              <p className="mt-3 font-display text-3xl tracking-wide">{k}</p>
              <p className="text-sm text-white/60">{v}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function VisitUs() {
  const hours = useHoursSummary();
  const note = useStore((s) => s.settings.locationNote);
  return (
    <section className="bg-cream py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 md:px-8 lg:grid-cols-3">
        <Reveal className="rounded-3xl bg-card p-8 shadow-[0_25px_50px_-35px_rgba(0,0,0,.5)] ring-1 ring-border">
          <Clock className="h-8 w-8 text-fire" />
          <h3 className="mt-4 font-display text-4xl tracking-wide">Hours</h3>
          <ul className="mt-4 space-y-2">
            {hours.map((h) => <li key={h.days} className="flex justify-between gap-4 border-b border-border pb-2 text-sm"><span className="font-semibold">{h.days}</span><span className="text-muted-foreground">{h.text}</span></li>)}
          </ul>
        </Reveal>
        <Reveal delay={1} className="rounded-3xl bg-card p-8 shadow-[0_25px_50px_-35px_rgba(0,0,0,.5)] ring-1 ring-border">
          <MapPin className="h-8 w-8 text-fire" />
          <h3 className="mt-4 font-display text-4xl tracking-wide">Find Us</h3>
          <p className="mt-4 font-semibold">{BRAND.city}, {BRAND.region}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{note}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={BRAND.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-fire px-5 py-2.5 text-sm font-bold text-white transition hover:bg-fire-deep"><MapPin className="h-4 w-4" />Get directions</a>
            <a href={BRAND.phoneHref} className="inline-flex items-center gap-2 rounded-full px-2 py-2.5 text-sm font-bold text-fire"><Phone className="h-4 w-4" />{BRAND.phone}</a>
          </div>
        </Reveal>
        <Reveal delay={2} className="relative overflow-hidden rounded-3xl bg-ink p-8 text-white">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-fire/40 blur-3xl" />
          <Instagram className="relative h-8 w-8 text-ember" />
          <h3 className="relative mt-4 font-display text-4xl tracking-wide">Follow the Flame</h3>
          <p className="relative mt-4 text-sm leading-relaxed text-white/70">Specials, new drops and behind-the-grill moments. Tag us in your Khan House pics.</p>
          <a href={SOCIAL.instagram} target="_blank" rel="noreferrer" className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-fire-gradient px-6 py-3 font-bold text-ink">@{BRAND.instagramHandle}</a>
        </Reveal>
      </div>
    </section>
  );
}
