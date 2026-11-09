import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, sub, image, children }: { eyebrow: string; title: ReactNode; sub?: string; image: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-ink pb-16 pt-40 text-white md:pb-20 md:pt-48">
      <img src={image} alt="" className="hero-zoom absolute inset-0 h-full w-full object-cover opacity-45" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent" />
      <div className="hero-copy relative mx-auto max-w-7xl px-6 md:px-8">
        <p className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.35em] text-gold"><span className="h-0.5 w-8 bg-fire-gradient" />{eyebrow}</p>
        <h1 className="mt-4 font-display text-6xl leading-[0.92] tracking-wide md:text-8xl">{title}</h1>
        {sub && <p className="mt-5 max-w-2xl text-lg text-white/75">{sub}</p>}
        {children}
      </div>
    </section>
  );
}
