import { Bot, LockKeyhole } from "lucide-react";
import { Button } from "@/components/Button";
import { isTeamAccessEnabled } from "@/lib/team-auth";
import { loginTeam } from "./actions";

export const dynamic = "force-dynamic";

export default async function TeamLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; next?: string; reserved?: string }>;
}) {
  const params = await searchParams;
  const enabled = isTeamAccessEnabled();

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-10">
      <section className="w-full max-w-md rounded-md border border-line bg-white p-6 shadow-panel">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-md bg-pine text-white">
            <Bot size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-black text-ink">Accès équipe Nesto</h1>
            <p className="mt-1 text-sm font-semibold text-gray-600">Espace interne réservé.</p>
          </div>
        </div>

        {!enabled ? (
          <div className="rounded-md border border-[#fde68a] bg-[#fffbeb] p-4">
            <div className="flex gap-3">
              <LockKeyhole className="shrink-0 text-wood" size={20} />
              <div>
                <h2 className="font-black">Accès réservé à l’équipe Nesto</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-gray-700">
                  Cette zone interne est désactivée sur cet environnement.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form action={loginTeam} className="space-y-4">
            <input name="next" type="hidden" value={params.next || "/team/installations"} />
            <label className="block text-sm font-bold">
              Code équipe
              <input
                autoComplete="off"
                className="mt-2 w-full rounded-md border border-line px-3 py-2 focus-ring"
                name="teamCode"
                placeholder="Code interne temporaire"
                type="password"
              />
            </label>

            {params.error ? (
              <p className="rounded-md border border-[#fecaca] bg-[#fef2f2] p-3 text-sm font-bold text-[#991b1b]">
                Code incorrect.
              </p>
            ) : null}

            {params.reserved ? (
              <p className="rounded-md border border-[#fde68a] bg-[#fffbeb] p-3 text-sm font-bold text-[#92400e]">
                Connectez-vous avec le code équipe pour accéder à cette zone.
              </p>
            ) : null}

            <Button className="w-full" type="submit">Entrer</Button>
          </form>
        )}
      </section>
    </main>
  );
}
