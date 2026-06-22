import { Copy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { StatusBadge } from "@/components/StatusBadge";
import { demoContacts, demoMatches, demoProperties, getContact, getProperty } from "@/lib/demo-data";
import { generateFollowupFallback } from "@/lib/ai/followup-generator";

export default function FollowupsPage() {
  const followups = demoMatches.map((match) => {
    const contact = getContact(match.contact_id) ?? demoContacts[0];
    const property = getProperty(match.property_id) ?? demoProperties[0];
    return { match, contact, property, message: generateFollowupFallback(contact, property) };
  });

  return (
    <AppShell>
      <PageHeader
        title="Relances preparees"
        description="Nesto prepare les messages et vous les fait valider depuis WhatsApp."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        {followups.map(({ match, contact, property, message }) => (
          <Panel key={match.id}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-black">{contact.first_name} - {property.title}</h2>
                <p className="text-sm text-gray-600">Match {match.score}/100</p>
              </div>
              <StatusBadge label={match.status} />
            </div>
            <p className="rounded-md border border-line bg-[#fbfaf7] p-4 text-sm leading-6">{message}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button>Valider</Button>
              <Button variant="secondary">Modifier</Button>
              <Button variant="danger">Refuser</Button>
              <Button variant="secondary"><Copy size={16} /> Copier</Button>
            </div>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}
