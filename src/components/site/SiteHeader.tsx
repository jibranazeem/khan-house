import { Link, useLocation } from "@tanstack/react-router";
import { Menu as MenuIcon, Phone, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { BRAND } from "@/lib/brand";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/catering", label: "Catering" },
  { to: "/about", label: "Our Story" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const { count, setOpen } = useCart();
  const { pathname } = useLocation();
  const announcement = useStore((s) => s.settings.announcement);
  const accepting = useStore((s) => s.settings.acceptingOrders);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Every storefront page opens on a dark banner, so the header starts transparent.
  const overHero = !scrolled && !mobile;

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setMobile(false), [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 no-print">
      {(announcement || !accepting) && (
        <div className={cn("px-4 py-2 text-center text-xs font-medium tracking-wide text-white", accepting ? "bg-fire" : "bg-ash")}>
          {accepting ? announcement : "Online ordering is paused right now — give us a call to order."}
        </div>
      )}
      <div className={cn("transition-all duration-500", overHero ? "bg-transparent py-2" : "border-b border-white/10 bg-ink/95 py-0.5 shadow-[0_10px_30px_-20px_rgba(0,0,0,.8)] backdrop-blur-lg")}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
          <Link to="/" className="text-base md:text-lg"><Logo /></Link>
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
                className="relative text-sm font-semibold uppercase tracking-[0.16em] text-white/80 transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:bg-fire after:transition-all hover:text-white hover:after:w-full"
                activeProps={{ className: "text-white after:w-full" }}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <a href={BRAND.phoneHref} className="mr-2 hidden items-center gap-2 text-sm font-semibold text-white/80 hover:text-white xl:inline-flex">
              <Phone className="h-4 w-4 text-ember" />{BRAND.phone}
            </a>
            <button onClick={() => setOpen(true)} aria-label={`Open cart (${count} items)`}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-fire px-1 text-[11px] font-bold text-white">{count}</span>}
            </button>
            <Link to="/menu" className="ml-1 hidden rounded-full bg-fire px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-[0_10px_30px_-10px_var(--fire)] transition hover:bg-fire-deep sm:inline-flex">
              Order Now
            </Link>
            <button className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white lg:hidden" onClick={() => setMobile(!mobile)} aria-label="Toggle menu" aria-expanded={mobile}>
              {mobile ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {mobile && (
          <nav className="border-t border-white/10 bg-ink px-4 pb-6 pt-2 lg:hidden">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }} className="block border-b border-white/10 px-2 py-3.5 font-display text-2xl tracking-wider text-white/85" activeProps={{ className: "text-ember" }}>{n.label}</Link>
            ))}
            <a href={BRAND.phoneHref} className="flex items-center gap-2 px-2 py-4 text-white/80"><Phone className="h-4 w-4 text-ember" />{BRAND.phone}</a>
            <Link to="/menu" className="mt-2 block w-full rounded-full bg-fire py-3 text-center font-bold uppercase tracking-wider text-white">Order Now</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
