import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { ClientWaitingScreen } from "@/components/ClientAccessScreens";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { StatusBadge } from "@/components/StatusBadge";
import { demoAiActions, getContactName, getPropertyTitle } from "@/lib/demo-data";
import { getClientAccessState } from "@/lib/client-access-state";

export default async function ActionsPage() {
  const accessState = await getClientAccessState();
  if (accessState.status !== "installed") return <ClientWaitingScreen firstName={accessState.firstName} />;

  return (
    <AppShell>
      <PageHeader
        title="Actions proposees"
        description="Les decisions importantes demandent votre validation, le plus souvent directement depuis WhatsApp."
      />
      <div className="space-y-4">
        {demoAiActions.map((action) => (
          <Panel key={action.id}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <StatusBadge label={action.priority} tone={action.priority} />
                  <StatusBadge label={action.status} />
                  {action.requires_validation ? <StatusBadge label="validation requise" tone="pending" /> : <StatusBadge label="automatisable" tone="qualified" />}
                </div>
                <h2 className="text-lg font-black">{action.title}</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">{action.summary}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {action.contact_id ? getContactName(action.contact_id) : "Aucun contact"} - {action.property_id ? getPropertyTitle(action.property_id) : "Aucun bien"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button>Valider</Button>
                <Button variant="secondary">Modifier</Button>
                <Button variant="danger">Refuser</Button>
              </div>
            </div>
            <p className="mt-4 rounded-md border border-line bg-[#fbfaf7] p-4 text-sm leading-6">{action.proposed_message}</p>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}
