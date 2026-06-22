import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { StatusBadge } from "@/components/StatusBadge";
import { getNestoData } from "@/lib/nesto-data";

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getNestoData();
  const property = data.properties.find((item) => item.id === id);
  if (!property) notFound();

  const matches = data.matches.filter((match) => match.property_id === property.id);

  return (
    <AppShell>
      <PageHeader
        title={property.title}
        description={property.description}
        actions={<><Button variant="secondary">Modifier</Button><Button>Lancer matching</Button></>}
      />

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Fiche bien">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Transaction", property.listing_type],
              ["Categorie", property.category],
              ["Ville", property.city],
              ["Quartier", property.district || "-"],
              ["Prix", `${property.price.toLocaleString("fr-FR")} F`],
              ["Surface", property.surface ? `${property.surface} m2` : "-"],
              ["Chambres", property.bedrooms ?? "-"],
              ["Disponible le", property.available_from || "-"],
              ["Animaux", property.pets_allowed],
              ["Source", property.source_type]
            ].map(([label, value]) => (
              <div className="rounded-md border border-line p-3" key={label}>
                <p className="text-xs font-bold uppercase tracking-normal text-gray-500">{label}</p>
                <p className="mt-1 font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4"><StatusBadge label={property.status} /></div>
        </Panel>

        <Panel title="Prospects compatibles">
          <div className="space-y-3">
            {matches.map((match) => (
              <div className="rounded-md border border-line p-3" key={match.id}>
                <div className="flex items-center justify-between">
                  <p className="font-bold">{getContactName(match.contact_id, data)}</p>
                  <StatusBadge label={`${match.score}/100`} tone={match.score > 88 ? "hot" : "proposed"} />
                </div>
                <p className="mt-1 text-xs text-gray-500">{match.reasons.join(", ")}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function getContactName(contactId: string, data: Awaited<ReturnType<typeof getNestoData>>) {
  const contact = data.contacts.find((item) => item.id === contactId);
  return contact ? `${contact.first_name} ${contact.last_name}`.trim() : "Prospect";
}
