import Link from "next/link";
import { ArrowRight, Flame, Search, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ClientWaitingScreen } from "@/components/ClientAccessScreens";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { StatusBadge } from "@/components/StatusBadge";
import { getClientAccessState } from "@/lib/client-access-state";
import { getClapyData } from "@/lib/nesto-data";
import type { Contact } from "@/lib/types";

export const dynamic = "force-dynamic";

const filters = [
  "Tous",
  "Chauds",
  "A relancer",
  "Fiches incompletes",
  "Location",
  "Achat",
  "Proprietaires"
];

export default async function ContactsPage() {
  const accessState = await getClientAccessState();
  if (accessState.status !== "installed") return <ClientWaitingScreen firstName={accessState.firstName} />;

  const data = await getClapyData();

  return (
    <AppShell>
      <PageHeader
        title="Contacts"
        description="La base prospects que Clapy organise pour vous. Vous consultez, corrigez si besoin, mais l'action quotidienne reste dans WhatsApp."
      />

      <Panel eyebrow="Filtres simples" title="Retrouver rapidement les bons profils">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <span className="rounded-md border border-line bg-[#fbfaf5] px-3 py-2 text-xs font-black text-gray-700" key={filter}>
              {filter}
            </span>
          ))}
        </div>
      </Panel>

      {data.error ? <DataNotice message="Certaines donnees Supabase ne sont pas disponibles. La base prospects reste consultable des que la synchronisation revient." /> : null}

      <div className="mt-6 grid gap-4">
        {data.contacts.length ? (
          data.contacts.map((contact) => (
            <ContactMemoryCard
              contact={contact}
              key={contact.id}
              latestInteraction={data.latestInteractionByContactId[contact.id]}
            />
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </AppShell>
  );
}

function ContactMemoryCard({ contact, latestInteraction }: { contact: Contact; latestInteraction?: string }) {
  return (
    <Link
      className="block rounded-md border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-panel"
      href={`/contacts/${contact.id}`}
    >
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.4fr_0.8fr] lg:items-center">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-md bg-pine text-white">
            <UserRound size={20} />
          </span>
          <div>
            <h2 className="text-lg font-black">
              {contact.first_name} {contact.last_name}
            </h2>
            <p className="mt-1 text-sm font-semibold text-gray-600">{formatProject(contact.project_type)}</p>
            <div className="mt-3 flex items-center gap-2">
              {contact.status === "hot" ? <Flame className="text-wood" size={16} /> : <Search className="text-pine" size={16} />}
              <StatusBadge label={contact.status} tone={contact.status === "hot" ? "validated" : "pending"} />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <Info label="Recherche" value={formatSearch(contact)} />
          <Info label="Budget" value={contact.max_budget ? `${formatPrice(contact.max_budget)} F` : "-"} />
          <Info label="Secteur" value={contact.desired_district ? `${contact.desired_city} - ${contact.desired_district}` : contact.desired_city || "-"} />
          <Info label="Urgence" value={contact.urgency} />
          <Info label="Infos manquantes" value={contact.missing_fields.length ? `${contact.missing_fields.length} a completer` : "Complet"} />
          <Info label="Derniere interaction" value={formatDate(latestInteraction || contact.updated_at)} />
        </div>

        <div className="rounded-md border border-line bg-[#fbfaf5] p-3">
          <p className="text-xs font-black uppercase tracking-normal text-gray-500">Prochaine action</p>
          <p className="mt-1 text-sm font-bold leading-6">
            {contact.missing_fields.length ? "Completer la fiche" : contact.status === "hot" ? "Surveiller les biens" : "Relancer au bon moment"}
          </p>
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-black text-pine">
            Voir la fiche <ArrowRight size={13} />
          </p>
        </div>
      </div>
    </Link>
  );
}

function DataNotice({ message }: { message: string }) {
  return (
    <div className="mt-6 rounded-md border border-line bg-white p-4 text-sm font-semibold leading-6 text-gray-700">
      {message}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-md border border-line bg-white p-6 text-sm font-semibold leading-6 text-gray-600 shadow-sm">
      Aucun contact pour le moment. Quand un prospect ecrit ou quand vous envoyez un resume d'appel a Clapy, sa fiche apparait ici.
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-normal text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-ink">{value}</p>
    </div>
  );
}

function formatProject(project: string) {
  const labels: Record<string, string> = {
    rental_search: "Recherche location",
    purchase_search: "Recherche achat",
    sale_project: "Projet vendeur",
    rental_project: "Proprietaire bailleur",
    unknown: "Projet a qualifier"
  };
  return labels[project] ?? project;
}

function formatSearch(contact: Contact) {
  const propertyType = contact.desired_property_type || "bien";
  const city = contact.desired_city ? ` a ${contact.desired_city}` : "";
  return `${propertyType}${city}`;
}

function formatPrice(value: number) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formatDate(value: string) {
  if (!value) return "Recente";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(value));
}
