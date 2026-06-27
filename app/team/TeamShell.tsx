import Link from "next/link";
import { Bot, Building2, LogOut, SearchCheck, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { logoutTeam } from "./actions";

export function TeamShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" href="/team/installations">
            <span className="grid size-10 place-items-center rounded-md bg-pine text-white">
              <Bot size={21} />
            </span>
            <span>
              <span className="block text-lg font-black">Clapy Équipe</span>
              <span className="text-xs font-medium text-gray-500">Espace interne</span>
            </span>
          </Link>

          <nav className="flex flex-wrap gap-2 text-sm font-semibold">
            <Link className="inline-flex min-h-9 items-center gap-2 rounded-md bg-paper px-3 text-ink transition hover:bg-[#f4efe4]" href="/team/installations">
              <Building2 size={16} /> Installations à traiter
            </Link>
            <span className="inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-gray-500">
              <UsersRound size={16} /> Clients
            </span>
            <span className="inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-gray-500">
              <SearchCheck size={16} /> Sources à vérifier
            </span>
            <form action={logoutTeam}>
              <button
                className="inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-gray-700 transition hover:bg-paper"
                type="submit"
              >
                <LogOut size={16} /> Déconnexion
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
