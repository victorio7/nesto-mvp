import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { NESTO_WHATSAPP_CONTACT_URL } from "@/lib/nesto-contact";

export function ClientWaitingScreen({ firstName }: { firstName: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fbfaf5] px-5 py-10 text-ink">
      <section className="w-full max-w-xl rounded-lg border border-line bg-white p-6 text-center shadow-panel sm:p-8">
        <span className="mx-auto grid size-12 place-items-center rounded-md bg-pine text-white">
          <CheckCircle2 size={22} />
        </span>
        <h1 className="mt-5 text-3xl font-black">Installation en cours</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-gray-700">
          Bonjour {firstName}, notre equipe finalise la connexion de vos outils.
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-gray-700">
          Vous serez prevenu par WhatsApp ou email des que Nesto sera pret.
        </p>
        <p className="mt-3 text-sm font-black text-pine">Delai moyen : moins de 24h.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-ink ring-1 ring-line transition hover:bg-[#fbfaf7]" href="/installation">
            Modifier mes informations
          </Link>
          <a
            className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white/70"
            href={NESTO_WHATSAPP_CONTACT_URL}
            rel="noreferrer"
            target="_blank"
          >
            Contacter l'equipe Nesto
          </a>
        </div>
      </section>
    </main>
  );
}

export function ClientReadyScreen({ firstName }: { firstName: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fbfaf5] px-5 py-10 text-ink">
      <section className="w-full max-w-xl rounded-lg border border-line bg-white p-6 text-center shadow-panel sm:p-8">
        <span className="mx-auto grid size-12 place-items-center rounded-md bg-pine text-white">
          <CheckCircle2 size={22} />
        </span>
        <h1 className="mt-5 text-3xl font-black">Felicitations {firstName}, Nesto est pret.</h1>
        <div className="mx-auto mt-4 grid max-w-md gap-2 text-sm font-semibold leading-6 text-gray-700">
          <p>Votre assistant Nesto est installe.</p>
          <p>Vous pouvez maintenant suivre votre memoire commerciale.</p>
          <p>Pour agir, valider ou demander une relance, utilisez WhatsApp.</p>
          <p>Le dashboard sert uniquement a consulter ce que Nesto memorise pour vous.</p>
        </div>
        <Link className="focus-ring mt-7 inline-flex min-h-10 items-center justify-center rounded-md bg-pine px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#185848]" href="/dashboard">
          Acceder a ma memoire Nesto
        </Link>
      </section>
    </main>
  );
}
