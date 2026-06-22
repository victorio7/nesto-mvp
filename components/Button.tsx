import { clsx } from "clsx";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variants = {
  primary: "bg-pine text-white hover:bg-[#185848]",
  secondary: "bg-white text-ink ring-1 ring-line hover:bg-[#fbfaf7]",
  ghost: "text-ink hover:bg-white/70",
  danger: "bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca]"
};

export function Button({
  children,
  href,
  variant = "primary",
  className,
  type = "button",
  ...buttonProps
}: ButtonProps) {
  const classes = clsx(
    "focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition",
    variants[variant],
    className
  );

  if (href) {
    if (href.startsWith("/")) {
      return (
        <Link className={classes} href={href}>
          {children}
        </Link>
      );
    }

    return (
      <a className={classes} href={href}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} type={type} {...buttonProps}>
      {children}
    </button>
  );
}
