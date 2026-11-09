import { cn } from "@/lib/utils";

/** Khan House wordmark: red roofline over KHAN (white/ink) and HOUSE (fire gradient). */
export function Logo({ className, dark = false, compact = false }: { className?: string; dark?: boolean; compact?: boolean }) {
  return (
    <span className={cn("inline-flex flex-col items-start leading-none", className)} aria-label="Khan House">
      <svg viewBox="0 0 120 22" className={cn("-mb-0.5 w-[4.6em] text-fire", compact && "hidden")} aria-hidden="true">
        <path d="M4 20 L60 3 L116 20" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="84" y="4" width="8" height="11" rx="1" fill="currentColor" />
      </svg>
      <span className="font-display text-[1.55em] italic tracking-wide">
        <span className={dark ? "text-ink" : "text-white"}>KHAN</span>{" "}
        <span className="text-fire-gradient">HOUSE</span>
      </span>
    </span>
  );
}
