import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Calls back once when the element first scrolls into view. */
export function useInView<T extends Element>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === "undefined") return setInView(true);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); io.disconnect(); }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [inView, threshold]);
  return [ref, inView] as const;
}

/** Fades its children up the first time they scroll into view. */
export function Reveal({ as: Tag = "div", className, delay = 0, children, id }: { as?: ElementType; className?: string; delay?: 0 | 1 | 2 | 3; children: ReactNode; id?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  return <Tag ref={ref} id={id} className={cn("reveal", delay && `reveal-delay-${delay}`, inView && "is-in", className)}>{children}</Tag>;
}
