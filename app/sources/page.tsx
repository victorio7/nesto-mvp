import { CalendarDays, Globe2, Instagram, Mail, MessageCircle, Plug, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ClientWaitingScreen } from "@/components/ClientAccessScreens";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { StatusBadge } from "@/components/StatusBadge";
import { getClientAccessState } from "@/lib/client-access-state";
import { NESTO_WHATSAPP_CONTACT_URL } from "@/lib/nesto-contact";
import { getInstallationData, type SimpleInstallStatus } from "@/lib/installation-data";
import { getNestoData } from "@/lib/nesto-data";

export const dynamic = "force-dynamic";

type ClientConnection = {
  title: string;
  description: string;
  status: SimpleInstallStatus | "optional";
  icon: typeof MessageCircle;
  detail?: string;
};

export default async function SourcesPage() {
  const accessState = await getClientAccessState();
  if (accessState.status !== "installed") return <ClientWaitingScreen firstName={accessState.firstName} />;

  const [installation, nestoData] = await Promise.all([getInstallationData(), getNestoData()]);
  const calendarStatus = statusFromLiveConnection(nestoData.connections.find((item) => item.integration_type === "google_calendar")?.status);
  const connections: ClientConnection[] = [
    {
      title: "WhatsApp professionnel",
      description: "Le numero ou vos prospects vous ecrivent.",
      status: installation.whatsappProspect.status,
      icon: MessageCircle,
      detail: installation.whatsappProspect.phone
    },
    {
      title: "WhatsApp agent",
      description: "Le numero ou Nesto vous envoie les alertes importantes.",
      status: installation.whatsappAgent.status,
      icon: MessageCircle,
      detail: installation.whatsappAgent.phone
    },
    {
      title: "Site agence",
      description: "La source que Nesto surveille pour detecter les nouveaux biens.",
      status: installation.website.status,
      icon: Globe2,
      detail: safeClientDetail(installation.website.websiteUrl, "Adresse recue")
    },
    {
      title: "Email",
      description: "L'adresse ou arrivent vos demandes et echanges importants.",
      status: installation.professionalEmail.status,
      icon: Mail,
      detail: safeClientDetail(installation.professionalEmail.email, "Email recu")
    },
    {
      title: "Calendrier",
      description: "Utile pour preparer les rappels et les rendez-vous.",
      status: calendarStatus,
      icon: CalendarDays
    },
    {
      title: "Messenger / Instagram / Facebook",
      description: "Les reseaux ou vous recevez aussi des demandes.",
      status: installation.socialSources.status,
      icon: Instagram,
      detail: safeClientDetail(socialDetail(installation), "Informations recues")
    },
    {
      title: "TikTok",
      description: "Facultatif, sur demande si ce canal devient utile pour vous.",
      status: installation.socialSources.tiktok ? installation.socialSources.status : "optional",
      icon: Plug,
      detail: safeClientDetail(installation.socialSources.tiktok, "Information recue")
    }
  ];

  return (
    <AppShell>
      <PageHeader
        title="Connexions"
        description="Verifiez simplement les outils relies a Nesto. Si une connexion manque, l'equipe Nesto vous accompagne."
      />

      {installation.error ? (
        <p className="mb-5 rounded-md border border-[#fde68a] bg-[#fffbeb] p-3 text-sm font-semibold text-[#92400e]">
          Certaines connexions ne sont pas encore synchronisees. L'equipe Nesto garde le suivi de votre installation.
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Vos connexions Nesto">
          <div className="grid gap-3">
            {connections.map((connection) => (
              <ConnectionCard connection={connection} key={connection.title} />
            ))}
          </div>
        </Panel>

        <Panel title="Besoin d'une connexion en plus ?">
          <div className="rounded-md border border-wood/25 bg-[#fffaf0] p-4">
            <p className="text-sm font-black text-ink">Nesto s'occupe de la partie technique avec vous.</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-gray-700">
              Vous n'avez pas besoin de configurer quoi que ce soit seul. Dites a l'equipe Nesto quelle connexion manque, et nous vous aidons a la finaliser.
            </p>
            <a
              className="focus-ring mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-pine px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#185848]"
              href={NESTO_WHATSAPP_CONTACT_URL}
              rel="noreferrer"
              target="_blank"
            >
              <Send size={16} /> Demander l'aide de l'equipe Nesto
            </a>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function ConnectionCard({ connection }: { connection: ClientConnection }) {
  const Icon = connection.icon;
  const missing = connection.status === "todo" || connection.status === "needs_help";
  return (
    <div className="rounded-md border border-line bg-[#fbfaf5] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-white text-pine ring-1 ring-line">
            <Icon size={18} />
          </span>
          <div>
            <p className="font-black text-ink">{connection.title}</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-gray-600">{connection.description}</p>
            {connection.detail ? <p className="mt-2 text-sm font-black text-pine">{connection.detail}</p> : null}
          </div>
        </div>
        <StatusBadge label={statusLabel(connection.status)} tone={statusTone(connection.status)} />
      </div>
      {missing ? (
        <a
          className="focus-ring mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-ink ring-1 ring-line transition hover:bg-[#fbfaf7]"
          href={NESTO_WHATSAPP_CONTACT_URL}
          rel="noreferrer"
          target="_blank"
        >
          Demander l'aide de l'equipe Nesto
        </a>
      ) : null}
    </div>
  );
}

function statusFromLiveConnection(status: string | undefined): SimpleInstallStatus {
  if (status === "connected") return "connected";
  if (status === "pending") return "in_progress";
  if (status === "error") return "needs_help";
  return "todo";
}

function socialDetail(installation: Awaited<ReturnType<typeof getInstallationData>>) {
  return [installation.socialSources.facebookMessenger, installation.socialSources.instagram].filter(Boolean).join(" - ");
}

function safeClientDetail(value: string, fallback: string) {
  if (!value) return "";
  const lower = value.toLowerCase();
  const technicalWords = ["sitemap", "xml", "api", "feed", "token", "webhook"];
  if (technicalWords.some((word) => lower.includes(word))) return fallback;
  return value;
}

function statusLabel(status: ClientConnection["status"]) {
  const labels = {
    connected: "connecte",
    in_progress: "en verification",
    needs_help: "besoin d'aide",
    skipped: "non renseigne",
    todo: "a connecter",
    optional: "facultatif"
  };
  return labels[status];
}

function statusTone(status: ClientConnection["status"]) {
  if (status === "connected") return "validated";
  if (status === "needs_help") return "failed";
  return "pending";
}
