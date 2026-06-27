import { notFound } from "next/navigation";
import { MessageSquareText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { ClientWaitingScreen } from "@/components/ClientAccessScreens";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { StatusBadge } from "@/components/StatusBadge";
import { getClientAccessState } from "@/lib/client-access-state";
import { getClapyData } from "@/lib/nesto-data";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const accessState = await getClientAccessState();
  if (accessState.status !== "installed") return <ClientWaitingScreen firstName={accessState.firstName} />;

  const { id } = await params;
  const data = await getClapyData();
  const contact = data.contacts.find((item) => item.id === id);
  if (!contact) notFound();

  const matches = data.matches.filter((match) => match.contact_id === contact.id);
  const presentFields = [
    ["Telephone", contact.phone],
    ["Email", contact.email],
    ["Ville", contact.desired_city],
    ["Quartier", contact.desired_district],
    ["Budget", contact.max_budget ? `${contact.max_budget.toLocaleString("fr-FR")} F` : ""],
    ["Situation", contact.professional_status],
    ["Revenus", contact.income ? `${contact.income.toLocaleString("fr-FR")} F` : ""],
    ["Documents", contact.documents_ready]
  ].filter(([, value]) => value);

  return (
    <AppShell>
      <PageHeader
        title={`${contact.first_name} ${contact.last_name}`}
        description={`${contact.contact_type} - ${contact.project_type}`}
        actions={<Button><MessageSquareText size={16} /> Generer un message pour completer la fiche</Button>}
      />

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Profil">
          <div className="grid gap-3 sm:grid-cols-2">
            {presentFields.map(([label, value]) => (
              <div className="rounded-md border border-line p-3" key={label}>
                <p className="text-xs font-bold uppercase tracking-normal text-gray-500">{label}</p>
                <p className="mt-1 font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <StatusBadge label={contact.status} />
            <StatusBadge label={`${contact.seriousness_score}/100`} tone={contact.seriousness_score > 80 ? "hot" : "qualified"} />
            <StatusBadge label={`Urgence ${contact.urgency}`} tone={contact.urgency} />
          </div>
          <label className="mt-5 block text-sm font-bold">
            Notes
            <textarea className="mt-2 min-h-28 w-full rounded-md border border-line p-3 focus-ring" defaultValue={contact.notes} />
          </label>
        </Panel>

        <Panel title="Informations manquantes">
          {contact.missing_fields.length ? (
            <ul className="space-y-2">
              {contact.missing_fields.map((field) => (
                <li className="rounded-md bg-[#fef3c7] px-3 py-2 text-sm font-semibold text-[#92400e]" key={field}>
                  {field}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">La fiche est complete pour le projet detecte.</p>
          )}
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Historique">
          <div className="space-y-3 text-sm">
            <p className="rounded-md border border-line p-3">Message entrant analyse depuis WhatsApp.</p>
            <p className="rounded-md border border-line p-3">Fiche enrichie automatiquement.</p>
            <p className="rounded-md border border-line p-3">Matching relance preparee.</p>
          </div>
        </Panel>
        <Panel title="Biens compatibles">
          <div className="space-y-3">
            {matches.map((match) => (
              <div className="rounded-md border border-line p-3" key={match.id}>
                <div className="flex items-center justify-between">
                  <p className="font-bold">{data.properties.find((property) => property.id === match.property_id)?.title ?? "Bien agence"}</p>
                  <StatusBadge label={`${match.score}/100`} tone="proposed" />
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
