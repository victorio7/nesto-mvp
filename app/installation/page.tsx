import Link from "next/link";
import { getInstallationData } from "@/lib/installation-data";
import { NESTO_WHATSAPP_CONTACT_URL } from "@/lib/nesto-contact";
import { InstallationClient } from "./InstallationClient";

export const dynamic = "force-dynamic";

export default async function InstallationPage({
  searchParams
}: {
  searchParams: Promise<{ trial?: string; payment?: string; edit?: string }>;
}) {
  const params = await searchParams;
  const data = await getInstallationData();
  const isInstalled = data.dashboardUnlocked;
  const isEditingInstalledProfile = params.edit === "true";

  return (
    <main className="min-h-screen bg-[#fbfaf5] px-5 py-8 text-ink sm:py-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="text-center">
          <Link className="inline-flex items-center gap-2 text-sm font-black text-pine" href="/">
            <span className="grid size-9 place-items-center rounded-md bg-pine text-white">N</span>
            Nesto
          </Link>
          <p className="mt-5 text-xs font-black uppercase tracking-normal text-wood">Installation accompagnee</p>
          <h1 className="mt-2 text-3xl font-black text-ink sm:text-4xl">Bienvenue dans l'installation de Nesto.</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-gray-700">
            Votre essai gratuit est active. Renseignez d'abord vos outils principaux, puis notre equipe verifiera votre installation.
          </p>
          <p className="mt-2 text-sm font-semibold text-gray-700">WhatsApp agit. Le dashboard memorise.</p>
        </header>

        {isInstalled && !isEditingInstalledProfile ? <InstalledCard /> : null}

        {params.trial === "active" || params.payment === "simulated" ? (
          <p className="mx-auto w-full max-w-2xl rounded-md border border-[#bbf7d0] bg-white p-3 text-center text-sm font-bold text-[#166534]">
            Mois gratuit active. Passons maintenant a l'installation accompagnee.
          </p>
        ) : null}
        {data.error ? (
          <p className="mx-auto w-full max-w-2xl rounded-md border border-[#fde68a] bg-white p-3 text-center text-sm font-semibold text-[#92400e]">
            Certaines informations ne sont pas encore synchronisees. Vous pouvez continuer, Nesto gardera un mode simple.
          </p>
        ) : null}

        {!isInstalled || isEditingInstalledProfile ? (
          <InstallationClient initialData={data} />
        ) : null}
      </div>
    </main>
  );
}

function InstalledCard() {
  return (
    <section className="mx-auto w-full max-w-2xl rounded-lg border border-line bg-white p-6 text-center shadow-panel sm:p-8">
      <p className="text-xs font-black uppercase tracking-normal text-wood">Nesto est installe</p>
      <h2 className="mt-2 text-2xl font-black text-ink">Votre assistant est deja pret.</h2>
      <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-gray-700">
        Vous pouvez modifier vos informations ou demander l'aide de l'equipe pour ajouter une connexion.
      </p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <a
          className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-ink ring-1 ring-line transition hover:bg-[#fbfaf7]"
          href="/installation?edit=true"
        >
          Modifier mes informations
        </a>
        <a
          className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white/70"
          href={NESTO_WHATSAPP_CONTACT_URL}
          rel="noreferrer"
          target="_blank"
        >
          Demander l'aide de l'equipe
        </a>
        <a
          className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md bg-pine px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#185848]"
          href="/dashboard"
        >
          Retour a ma memoire Nesto
        </a>
      </div>
    </section>
  );
}
