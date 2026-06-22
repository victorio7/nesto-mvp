import Link from "next/link";
import { ArrowRight, Building2, UsersRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { StatusBadge } from "@/components/StatusBadge";
import { getNestoData, type PropertyMemory } from "@/lib/nesto-data";

export const dynamic = "force-dynamic";

const filters = [
  "Biens de l'agence",
  "Ajoutes par un collegue",
  "Compatibles avec mes prospects",
  "Disponibles",
  "Loues / vendus"
];

export default async function PropertiesPage() {
  const data = await getNestoData();

  return (
    <AppShell>
      <PageHeader
        title="Biens"
        description="Les biens connus par Nesto : vos biens, ceux de l'agence et ceux detectes depuis les sources connectees."
        actions={<Button href="/properties/import" variant="secondary">Importer depuis URL</Button>}
      />

      <Panel eyebrow="Filtres simples" title="Voir les biens utiles">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <span className="rounded-md border border-line bg-[#fbfaf5] px-3 py-2 text-xs font-black text-gray-700" key={filter}>
              {filter}
            </span>
          ))}
        </div>
      </Panel>

      {data.error ? <DataNotice message="Certaines donnees Supabase ne sont pas disponibles. Les biens reapparaitront automatiquement des que la synchronisation revient." /> : null}

      <div className="mt-6 grid gap-4">
        {data.properties.length ? (
          data.properties.map((property) => (
            <PropertyMemoryCard key={property.id} property={property} />
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </AppShell>
  );
}

function PropertyMemoryCard({ property }: { property: PropertyMemory }) {
  const sourceAgent = property.source_agent_name ?? (property.source_type === "agency_website" ? "Agence" : "Vous");

  return (
    <Link
      className="block rounded-md border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-panel"
      href={`/properties/${property.id}`}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_1.25fr_0.85fr] lg:items-center">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-md bg-pine text-white">
            <Building2 size={20} />
          </span>
          <div>
            <h2 className="text-lg font-black">{property.title}</h2>
            <p className="mt-1 text-sm font-semibold text-gray-600">
              {property.city} {property.district ? `- ${property.district}` : ""} - {formatPrice(property.price)} F
            </p>
            <div className="mt-3">
              <StatusBadge label={property.status} tone={property.status === "available" ? "validated" : "pending"} />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <Info label="Type" value={`${property.listing_type} / ${property.category}`} />
          <Info label="Source" value={formatSource(property.source_type)} />
          <Info label="Agent source" value={sourceAgent} />
          <Info label="Prospects compatibles" value={String(property.compatibleCount)} />
        </div>

        <div className="rounded-md border border-line bg-[#fbfaf5] p-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-normal text-gray-500">
            <UsersRound size={14} /> Meilleur prospect
          </div>
          <p className="mt-1 text-sm font-bold leading-6">{property.bestContactName ?? "-"}</p>
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-black text-pine">
            Voir le bien <ArrowRight size={13} />
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
      Aucun bien pour le moment. Quand Nesto detecte ou importe un bien de l'agence, il apparait ici avec les prospects compatibles.
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

function formatSource(source: string) {
  const labels: Record<string, string> = {
    manual: "Manuel",
    agency_website: "Site agence",
    facebook: "Facebook",
    crm: "CRM agence",
    email: "Email",
    xml_feed: "Flux XML"
  };
  return labels[source] ?? source;
}

function formatPrice(value: number) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
