import {
  Building2,
  CalendarDays,
  Mail,
  MessageCircle,
  Send,
  Share2,
  UserRound
} from "lucide-react";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { StatusBadge } from "@/components/StatusBadge";
import { demoAgency, demoUsers } from "@/lib/demo-data";

const installSteps = [
  {
    icon: UserRound,
    status: "connected" as const,
    title: "Vos informations agence",
    description: "Nom de l'agence, agent principal, telephone, email et zone."
  },
  {
    icon: MessageCircle,
    status: "needs_help" as const,
    title: "WhatsApp professionnel",
    description: "Le numero ou les prospects ecrivent a l'agence ou a l'agent."
  },
  {
    icon: MessageCircle,
    status: "in_progress" as const,
    title: "WhatsApp agent",
    description: "Le numero personnel ou interne ou Nesto envoie les alertes et recoit vos validations."
  },
  {
    icon: Building2,
    status: "connected" as const,
    title: "Site agence",
    description: "Nesto surveille les nouveaux biens publies par votre agence."
  },
  {
    icon: Share2,
    status: "todo" as const,
    title: "Email / calendrier / reseaux",
    description: "Email, calendrier, Messenger, Instagram et Facebook pourront etre branches progressivement."
  }
];

export default async function OnboardingPage({
  searchParams
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const params = await searchParams;

  return (
    <AppShell>
      <PageHeader
        title="Nesto s'installe avec vous, simplement."
        description="Notre equipe vous aide a connecter vos sources. Vous n'avez pas a gerer la partie technique."
        actions={
          <>
            <Button variant="secondary">
              <MessageCircle size={16} /> Continuer sur WhatsApp
            </Button>
            <Button>Demander l'aide a l'installation</Button>
          </>
        }
      />

      <Panel className="mb-6 border-wood/30 bg-[#fffaf0]">
        <h2 className="text-xl font-black">Nesto simplifie ce qui est complique.</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-700">
          Vous nous donnez les informations essentielles. Nous vous aidons a connecter WhatsApp, le site agence et les sources utiles.
          Ensuite, Nesto travaille dans WhatsApp.
        </p>
        {params.payment === "success" || params.payment === "simulated" ? (
          <p className="mt-4 rounded-md border border-pine/20 bg-white p-3 text-sm font-black text-pine">
            {params.payment === "success" ? "Paiement valide, passons a l'installation." : "Mode test active, passons a l'installation."}
          </p>
        ) : null}
      </Panel>

      <div className="grid gap-4">
        {installSteps.map((step, index) => (
          <InstallStep
            description={step.description}
            icon={step.icon}
            key={step.title}
            status={step.status}
            step={index + 1}
            title={step.title}
          >
            {index === 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nom agence" value={demoAgency.name} />
                <Field label="Nom agent" value={demoUsers[0].full_name} />
                <Field label="Telephone" value="+689 87 12 34 56" />
                <Field label="Email" value={demoUsers[0].email} />
              </div>
            ) : null}
            {index === 1 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Numero WhatsApp Business" value="+689 87 00 00 01" />
                <Field label="Usage" value="Messages prospects entrants" />
              </div>
            ) : null}
            {index === 2 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Numero agent" value="+689 87 12 34 56" />
                <Field label="Usage" value="Alertes, validations, commandes" />
              </div>
            ) : null}
            {index === 3 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="URL site agence" value={demoAgency.website_url} />
                <Field label="Page locations" value="https://mana-immo.example/locations" />
              </div>
            ) : null}
            {index === 4 ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <SimpleSource icon={Mail} label="Email" />
                <SimpleSource icon={CalendarDays} label="Calendrier" />
                <SimpleSource icon={Share2} label="Messenger / Instagram / Facebook" />
              </div>
            ) : null}
          </InstallStep>
        ))}
      </div>
    </AppShell>
  );
}

function InstallStep({
  children,
  description,
  icon: Icon,
  status,
  step,
  title
}: {
  children: ReactNode;
  description: string;
  icon: typeof MessageCircle;
  status: "todo" | "in_progress" | "connected" | "needs_help";
  step: number;
  title: string;
}) {
  return (
    <Panel>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-md bg-pine text-white">
            <Icon size={21} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-wood">Etape {step}</p>
            <h2 className="mt-1 text-xl font-black">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">{description}</p>
          </div>
        </div>
        <StatusBadge label={statusLabel(status)} tone={status === "connected" ? "validated" : "pending"} />
      </div>
      {children}
    </Panel>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <input className="mt-2 w-full rounded-md border border-line px-3 py-2 focus-ring" defaultValue={value} />
    </label>
  );
}

function SimpleSource({ icon: Icon, label }: { icon: typeof Mail; label: string }) {
  return (
    <div className="rounded-md border border-line bg-[#fbfaf5] p-4">
      <Icon className="text-pine" size={18} />
      <p className="mt-3 text-sm font-black">{label}</p>
      <p className="mt-1 text-xs font-semibold text-gray-500">Connexion accompagnee</p>
    </div>
  );
}

function statusLabel(status: "todo" | "in_progress" | "connected" | "needs_help") {
  const labels = {
    todo: "a faire",
    in_progress: "en cours",
    connected: "connecte",
    needs_help: "besoin d'aide"
  };
  return labels[status];
}
