"use client";

import {
  Bot,
  ContactRound,
  Gauge,
  HelpCircle,
  Home,
  Plug
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { href: "/dashboard", label: "Mémoire", icon: Gauge },
  { href: "/contacts", label: "Prospects", icon: ContactRound },
  { href: "/properties", label: "Biens", icon: Home },
  { href: "/sources", label: "Connexions", icon: Plug },
  { href: "/help", label: "Aide", icon: HelpCircle }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-line bg-white px-4 py-5 lg:block">
        <Link className="mb-7 flex items-center gap-3 px-2" href="/dashboard">
          <span className="grid size-10 place-items-center rounded-md bg-pine text-white">
            <Bot size={21} />
          </span>
          <span>
            <span className="block text-lg font-black">Nesto</span>
            <span className="text-xs font-medium text-gray-500">Votre bras droit commercial</span>
          </span>
        </Link>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className={`flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                  pathname === item.href || pathname.startsWith(`${item.href}/`) ? "bg-pine text-white" : "text-gray-700 hover:bg-paper hover:text-ink"
                }`}
                href={item.href}
                key={item.href}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur lg:hidden">
          <Link className="flex items-center gap-2 font-black" href="/dashboard">
            <Bot size={20} /> Nesto
          </Link>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
