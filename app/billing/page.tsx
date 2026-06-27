import { CheckCircle2, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { ClientWaitingScreen } from "@/components/ClientAccessScreens";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { StatusBadge } from "@/components/StatusBadge";
import { demoSubscription } from "@/lib/demo-data";
import { getClientAccessState } from "@/lib/client-access-state";
import { BillingCheckout } from "./BillingCheckout";

const included = [
  "Assistant immobilier",
  "connexion WhatsApp accompagnee",
  "connexion site agence",
  "base prospects intelligente",
  "matching prospects/biens",
  "relances intelligentes",
  "votre validation depuis WhatsApp",
  "support installation"
];

export default async function BillingPage() {
  const accessState = await getClientAccessState();
  if (accessState.status !== "installed") return <ClientWaitingScreen firstName={accessState.firstName} />;

  return (
    <AppShell>
      <PageHeader
        title="Demarrer avec Clapy"
        description="Un bras droit commercial pour suivre vos prospects, vos biens et vos relances depuis WhatsApp."
      />
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Clapy Assistant Immobilier" eyebrow="99 euros / mois">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-5xl font-black">{demoSubscription.monthly_price} €</span>
            <span className="font-bold text-gray-600">/mois</span>
            <StatusBadge label={demoSubscription.status} tone="pending" />
          </div>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Offre de lancement : 1 mois gratuit, installation accompagnee incluse, puis {demoSubscription.monthly_price} €/mois sans engagement.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {included.map((item) => (
              <div className="flex items-center gap-2 text-sm font-semibold" key={item}>
                <CheckCircle2 className="text-pine" size={17} />
                {item}
              </div>
            ))}
          </div>
          <div className="mt-7">
            <BillingCheckout />
          </div>
        </Panel>
        <Panel title="Installation accompagnee">
          <p className="leading-7 text-gray-600">
            La connexion WhatsApp peut demander quelques reglages. Au demarrage, notre equipe accompagne l'installation pour eviter toute friction.
          </p>
          <div className="mt-5 rounded-md border border-line bg-[#fbfaf5] p-4">
            <p className="font-black">Connexion WhatsApp accompagnee par notre equipe.</p>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Vous activez le mois gratuit, remplissez l'installation, puis finalisez WhatsApp avec un conseiller.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button href="/installation">Continuer l'installation</Button>
            <Button href="/installation" variant="secondary">
              <MessageCircle size={16} /> Parler a un conseiller
            </Button>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
