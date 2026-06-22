import { Panel } from "@/components/Panel";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-paper px-4 py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-md border border-line bg-white p-6 shadow-panel">
          <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-line bg-[#fbfaf5] px-3 py-2 text-sm font-black">
            <span className="grid size-7 place-items-center rounded-md bg-pine text-white">N</span>
            Nesto
          </div>
          <h1 className="text-3xl font-black leading-tight text-ink sm:text-4xl">
            Démarrer avec Nesto
          </h1>
          <p className="mt-4 text-base leading-7 text-gray-600">
            Créez votre compte agent. Vous poursuivrez ensuite avec l’installation guidée.
          </p>
          <div className="mt-6 rounded-md border border-wood/25 bg-[#fffaf0] p-4">
            <p className="text-sm font-black uppercase tracking-normal text-wood">Offre de lancement — 100 premiers agents</p>
            <p className="mt-2 text-3xl font-black">1 mois gratuit</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-gray-700">
              Puis 99 €/mois, sans engagement. L’installation accompagnée est incluse.
            </p>
            <p className="mt-2 text-sm font-black leading-6 text-pine">
              Votre mois gratuit commence lorsque Nesto est installé et prêt à être testé avec vous.
            </p>
          </div>
          <div className="mt-5 grid gap-3 text-sm font-bold text-gray-700">
            <p>WhatsApp reste votre poste de commande.</p>
            <p>Votre dashboard est votre mémoire organisée.</p>
            <p>Vous gérez la relation. Nesto mémorise, relance et vous alerte au bon moment.</p>
            <p>Notre équipe vous accompagne pour l’installation.</p>
          </div>
        </section>

        <Panel className="w-full" title="Créer mon compte agent" eyebrow="Essai gratuit simulé">
          <SignupForm />
        </Panel>
      </div>
    </main>
  );
}
