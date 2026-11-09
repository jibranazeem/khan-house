import { cn } from "@/lib/utils";

export function Eyebrow({ children, light }: { children: string; light?: boolean }) {
  return (
    <p className={cn("inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.35em]", light ? "text-gold" : "text-fire")}>
      <span className="h-0.5 w-8 bg-fire-gradient" />{children}
    </p>
  );
}
