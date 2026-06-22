import { clsx } from "clsx";
import type { ReactNode } from "react";

export function Panel({
  children,
  className,
  title,
  eyebrow
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  eyebrow?: string;
}) {
  return (
    <section className={clsx("rounded-md border border-line bg-white p-5 shadow-panel", className)}>
      {eyebrow ? <p className="mb-1 text-xs font-bold uppercase tracking-normal text-pine">{eyebrow}</p> : null}
      {title ? <h2 className="mb-4 text-lg font-black text-ink">{title}</h2> : null}
      {children}
    </section>
  );
}
