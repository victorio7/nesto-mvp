import { CheckCircle2, MessageCircle, Zap, Eye } from "lucide-react";
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
          Vous serez prevenu par WhatsApp ou email des que Clapy sera pret.
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
            Contacter l'équipe Clapy
          </a>
        </div>
      </section>
    </main>
  );
}

export function ClientReadyScreen({ firstName }: { firstName: string }) {
  const greeting = getGreeting();
  const actions = [
    { icon: MessageCircle, title: "Messages", description: "Consultez vos echanges", href: "/messages/analyze" },
    { icon: Zap, title: "Prospects chauds", description: "A suivre en priorite", href: "/contacts" },
    { icon: Eye, title: "Biens nouveaux", description: "A qualifier", href: "/properties" }
  ];

  return (
    <main className="min-h-screen bg-[#fbfaf5] px-5 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        {/* Greeting */}
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-normal text-wood">{greeting.timeOfDay}</p>
          <h1 className="mt-2 text-4xl font-black text-ink sm:text-5xl">Bonjour {firstName} 👋</h1>
          <p className="mt-3 text-lg text-gray-700">{greeting.message}</p>
        </div>

        {/* Priority Actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="group rounded-lg border border-line bg-white p-6 shadow-panel transition hover:shadow-lg hover:border-pine"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">{action.description}</p>
                    <h3 className="mt-1 text-xl font-black text-ink group-hover:text-pine">{action.title}</h3>
                  </div>
                  <Icon className="text-pine" size={24} />
                </div>
              </Link>
            );
          })}
        </div>

        {/* WhatsApp CTA */}
        <div className="rounded-lg border-2 border-pine bg-white p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="grid size-14 place-items-center rounded-full bg-[#10b981]/10">
              <MessageCircle className="text-pine" size={28} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-ink">Pour agir maintenant</h2>
          <p className="mt-2 text-gray-700">Utilisez WhatsApp pour relancer, valider ou demander une action. Clapy vous ecoute.</p>
          <a
            href={NESTO_WHATSAPP_CONTACT_URL}
            target="_blank"
            rel="noreferrer"
            className="focus-ring mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#10b981] px-6 py-3 font-semibold text-white transition hover:bg-[#059669]"
          >
            <MessageCircle size={18} />
            Ouvrir WhatsApp
          </a>
        </div>

        {/* Quick Links */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/dashboard"
            className="focus-ring rounded-lg bg-white px-6 py-3 font-semibold text-ink ring-1 ring-line transition hover:bg-[#fbfaf7]"
          >
            Voir ma memoire
          </Link>
          <Link
            href="/settings/autonomy"
            className="focus-ring rounded-lg px-6 py-3 font-semibold text-ink transition hover:bg-white/70"
          >
            Parametres
          </Link>
        </div>
      </div>
    </main>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return { timeOfDay: "Bonne journee", message: "Voici vos 3 priorites du jour pour gerer vos prospects et biens." };
  } else if (hour < 18) {
    return { timeOfDay: "Bon apres-midi", message: "Continuons a avancer sur vos priorites." };
  } else {
    return { timeOfDay: "Bonsoir", message: "Un dernier coup d'oeil sur ce qui s'est passe aujourd'hui ?" };
  }
}
