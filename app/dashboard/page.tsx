import {
  Building2,
  CalendarDays,
  Clock3,
  Mail,
  MessageCircle,
  Plug,
  Sparkles,
  UserRound
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ClientWaitingScreen } from "@/components/ClientAccessScreens";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { StatusBadge } from "@/components/StatusBadge";
import { getClientAccessState } from "@/lib/client-access-state";
import { getClapyData } from "@/lib/nesto-data";

export const dynamic = "force-dynamic";

const connections = [
  { key: "whatsapp_prospect", title: "WhatsApp professionnel", icon: MessageCircle, status: "pending" },
  { key: "whatsapp_agent", title: "WhatsApp agent", icon: MessageCircle, status: "pending" },
  { key: "agency_website", title: "Site agence", icon: Building2, status: "connected" },
  { key: "gmail", title: "Email", icon: Mail, status: "not_connected" },
  { key: "google_calendar", title: "Calendrier", icon: CalendarDays, status: "not_connected" },
  { key: "messaging", title: "Messenger / Instagram / Facebook", icon: Plug, status: "not_connected" }
];

const statusLabels: Record<string, string> = {
  connected: "connecte",
  pending: "en attente",
  not_connected: "a connecter",
  error: "erreur"
};

export default async function DashboardPage() {
  const [data, accessState] = await Promise.all([getClapyData(), getClientAccessState()]);
  if (accessState.status !== "installed") return <ClientWaitingScreen firstName={accessState.firstName} />;
  const hotContacts = data.contacts.filter((contact) => contact.status === "hot").slice(0, 2);
  const incompleteContacts = data.contacts.filter((contact) => contact.missing_fields.length).slice(0, 2);
  const followupContacts = data.contacts.filter((contact) => ["followup", "qualified", "hot"].includes(contact.status)).slice(0, 2);
  const recentContacts = data.contacts.slice(0, 3);
  const watchedProperties = data.properties.slice(0, 3);
  const collaborationProperties = data.properties.filter((property) => property.source_agent_name).slice(0, 2);
  const latestMatches = data.matches.slice(0, 2);
  const latestActions = data.actions.slice(0, 4);

  return (
    <AppShell>
      <PageHeader
        title="Memoire Clapy"
        description="Votre memoire Clapy est consultable ici. Pour agir, valider ou demander une relance, utilisez WhatsApp."
      />

      <div className="mb-6 rounded-md border border-wood/25 bg-[#fffaf0] p-5">
        <p className="text-sm font-black uppercase tracking-normal text-wood">Simplement</p>
        <h2 className="mt-1 text-xl font-black">Clapy organise ce que vous n'avez pas le temps d'organiser.</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-700">
          Vous gerez la relation. Clapy memorise, relance et vous alerte au bon moment.
          Cette page sert uniquement a retrouver vos prospects, biens, opportunites et connexions.
        </p>
      </div>

      {data.error ? <DataNotice message="Certaines donnees Supabase ne sont pas disponibles. Clapy garde l'interface lisible pendant la synchronisation." /> : null}
      {data.empty && !data.error ? <DataNotice message="Clapy attend ses premieres donnees. Quand vos premiers echanges seront traites, votre memoire commerciale apparaitra ici." /> : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel eyebrow="A consulter" title="Contacts a suivre">
          <div className="grid gap-4 md:grid-cols-2">
            <MemoryGroup
              icon={UserRound}
              title="Prospects chauds"
              items={hotContacts.map((contact) => `${contact.first_name} ${contact.last_name} - ${formatSearch(contact)}`)}
              empty="Aucun prospect chaud pour le moment."
            />
            <MemoryGroup
              icon={Clock3}
              title="Fiches incompletes"
              items={incompleteContacts.map((contact) => `${contact.first_name} ${contact.last_name} - ${contact.missing_fields.length} infos manquantes`)}
              empty="Aucune fiche importante a completer."
            />
            <MemoryGroup
              icon={MessageCircle}
              title="A relancer"
              items={followupContacts.map((contact) => `${contact.first_name} ${contact.last_name} - ${nextContactAction(contact)}`)}
              empty="Aucune relance prioritaire."
            />
            <MemoryGroup
              icon={Sparkles}
              title="Derniers contacts crees"
              items={recentContacts.map((contact) => `${contact.first_name} ${contact.last_name}`)}
              empty="Aucun contact cree."
            />
          </div>
        </Panel>

        <Panel eyebrow="Clapy a detecte pour vous" title="Opportunites detectees">
          <div className="space-y-3">
            {latestActions.map((action) => (
              <Opportunity key={action.id} text={`${action.title}${action.summary ? ` - ${action.summary}` : ""}`} />
            ))}
            {latestMatches.map((match) => (
              <Opportunity key={match.id} text={formatMatchOpportunity(match, data)} />
            ))}
            {!latestActions.length && !latestMatches.length ? <EmptyLine text="Aucune opportunite detectee pour le moment." /> : null}
          </div>
        </Panel>

        <Panel eyebrow="Biens connus" title="Biens surveilles">
          <div className="grid gap-4 md:grid-cols-2">
            <MemoryGroup
              icon={Building2}
              title="Nouveaux biens agence"
              items={watchedProperties.slice(0, 2).map((property) => `${property.title} - ${formatPrice(property.price)} F`)}
              empty="Aucun bien surveille."
            />
            <MemoryGroup
              icon={Sparkles}
              title="Compatibles avec mes prospects"
              items={latestMatches.map((match) => `${getContactName(match.contact_id, data)} - ${match.score}%`)}
              empty="Aucun match detecte."
            />
            <MemoryGroup
              icon={UserRound}
              title="Ajoutes par un collegue"
              items={collaborationProperties.map((property) => `${property.source_agent_name} - ${property.title}`)}
              empty="Aucun bien collegue detecte."
            />
            <MemoryGroup icon={Clock3} title="Prix / statut changes" items={[]} empty="Aucun changement critique." />
          </div>
        </Panel>

        <Panel eyebrow="Outils relies" title="Connexions">
          <div className="grid gap-3 sm:grid-cols-2">
            {connections.map((connection) => {
              const Icon = connection.icon;
              const live = data.connections.find((item) => item.integration_type === connection.key);
              const status = live?.status ?? connection.status;
              return (
                <div className="rounded-md border border-line bg-[#fbfaf5] p-4" key={connection.key}>
                  <div className="flex items-start justify-between gap-3">
                    <Icon className="text-pine" size={18} />
                    <StatusBadge label={statusLabels[status]} tone={status === "connected" ? "validated" : status === "error" ? "failed" : "pending"} />
                  </div>
                  <p className="mt-3 text-sm font-black">{connection.title}</p>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function DataNotice({ message }: { message: string }) {
  return (
    <div className="mb-6 rounded-md border border-line bg-white p-4 text-sm font-semibold leading-6 text-gray-700">
      {message}
    </div>
  );
}

function MemoryGroup({
  empty,
  icon: Icon,
  items,
  title
}: {
  empty: string;
  icon: typeof MessageCircle;
  items: string[];
  title: string;
}) {
  return (
    <div className="rounded-md border border-line bg-[#fbfaf5] p-4">
      <div className="mb-3 flex items-center gap-2 font-black">
        <Icon className="text-pine" size={17} />
        {title}
      </div>
      <div className="space-y-2">
        {items.length ? items.map((item) => (
          <p className="rounded-md bg-white px-3 py-2 text-sm font-semibold leading-6 text-gray-700" key={item}>
            {item}
          </p>
        )) : <EmptyLine text={empty} />}
      </div>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="rounded-md bg-white px-3 py-2 text-sm font-semibold leading-6 text-gray-500">{text}</p>;
}

function Opportunity({ text }: { text: string }) {
  return (
    <div className="flex gap-3 rounded-md border border-line bg-[#fbfaf5] p-4">
      <Sparkles className="mt-0.5 shrink-0 text-wood" size={18} />
      <p className="text-sm font-semibold leading-6 text-gray-700">{text}</p>
    </div>
  );
}

function formatSearch(contact: { desired_property_type: string; desired_city: string }) {
  return `${contact.desired_property_type || "bien"} ${contact.desired_city ? `a ${contact.desired_city}` : ""}`;
}

function nextContactAction(contact: { missing_fields: string[]; status: string }) {
  if (contact.missing_fields.length) return "fiche a completer";
  if (contact.status === "hot") return "surveiller les biens";
  return "relancer au bon moment";
}

function formatMatchOpportunity(match: { contact_id: string; property_id: string; score: number }, data: Awaited<ReturnType<typeof getClapyData>>) {
  const contactName = getContactName(match.contact_id, data);
  const property = data.properties.find((item) => item.id === match.property_id);
  const propertyTitle = property?.title ?? "un bien";
  return `${propertyTitle} correspond a ${contactName} avec un score de ${match.score} %.`;
}

function getContactName(contactId: string, data: Awaited<ReturnType<typeof getClapyData>>) {
  const contact = data.contacts.find((item) => item.id === contactId);
  return contact ? `${contact.first_name} ${contact.last_name}`.trim() : "Contact";
}

function formatPrice(value: number) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
