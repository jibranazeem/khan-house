import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Flame, HandHeart, ShieldCheck, Sparkles } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Eyebrow } from "@/components/site/Eyebrow";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: `Our Story — ${BRAND.name}` }, { name: "description", content: `The story behind ${BRAND.name}: halal hibachi and Mediterranean fusion in ${BRAND.area}.` }] }),
  component: About,
});

const VALUES = [
  { Icon: ShieldCheck, title: "100% Halal", text: "Every protein is certified halal. No exceptions, no shortcuts — so everyone at the table can dig in." },
  { Icon: Flame, title: "Cooked to Order", text: "Nothing sits under a heat lamp. Your plate hits the grill when your order comes in." },
  { Icon: Sparkles, title: "Bold Fusion", text: "Hibachi technique, Mediterranean spice. Two traditions we love, served side by side." },
  { Icon: HandHeart, title: "Local Love", text: `Born and raised in ${BRAND.city}. We feed our neighbors, cater their celebrations and show up for the community.` },
];

function About() {
  return (
    <>
      <PageHero eyebrow="Our Story" image="/images/hero/grill.jpg" title={<>Elevated Grilling.<br /><span className="text-fire-gradient">Unforgettable Taste.</span></>} />
      <section className="bg-cream py-24 md:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 md:px-8 lg:grid-cols-2">
          <Reveal>
            <Eyebrow>Who We Are</Eyebrow>
            <h2 className="mt-5 font-display text-5xl leading-[0.95] tracking-wide md:text-6xl">A House Built Around the Grill</h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted-foreground">
              <p>{BRAND.name} started with a simple idea: the comfort of a New York-style halal platter and the sizzle of a hibachi grill deserve to be on the same menu.</p>
              <p>We marinate our chicken and lamb in-house, mix our white sauce from scratch and sear every order fresh. The result is food that's fast without ever feeling fast-food.</p>
              <p>Whether you're grabbing a gyro on your lunch break or feeding 200 guests at a wedding, you get the same fire, the same flavor and the same care.</p>
            </div>
            <Link to="/menu" className="mt-8 inline-flex items-center gap-2 rounded-full bg-fire px-8 py-4 font-bold uppercase tracking-wider text-white transition hover:bg-fire-deep">See the Menu<ArrowRight className="h-4 w-4" /></Link>
          </Reveal>
          <div className="grid grid-cols-[1fr_0.8fr] gap-4">
            <Reveal delay={1} className="row-span-2"><img src="/images/menu/chicken-lamb-mix.jpg" alt="Chicken and lamb mix platter" loading="lazy" className="aspect-[3/4] h-full w-full rounded-3xl object-cover" /></Reveal>
            <Reveal delay={2}><img src="/images/menu/hibachi-shrimp.jpg" alt="Hibachi chicken and shrimp" loading="lazy" className="aspect-square w-full rounded-3xl object-cover" /></Reveal>
            <Reveal delay={3}><img src="/images/menu/lamb-gyro.jpg" alt="Lamb gyro" loading="lazy" className="aspect-square w-full rounded-3xl object-cover" /></Reveal>
          </div>
        </div>
      </section>
      <section className="bg-ink py-24 text-white md:py-28">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <Reveal className="text-center"><Eyebrow light>What We Stand For</Eyebrow><h2 className="mt-5 font-display text-5xl tracking-wide md:text-7xl">Our Promise</h2></Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ Icon, title, text }, n) => (
              <Reveal key={title} delay={(n % 4) as 0 | 1 | 2 | 3} className="rounded-3xl border border-white/10 bg-white/5 p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fire-gradient text-ink"><Icon className="h-6 w-6" /></span>
                <h3 className="mt-5 font-display text-3xl tracking-wide">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
