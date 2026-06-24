import { AppShell } from "@/components/AppShell";
import { ClientWaitingScreen } from "@/components/ClientAccessScreens";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { getClientAccessState } from "@/lib/client-access-state";
import { ImportPropertyForm } from "./ImportPropertyForm";

export default async function ImportPropertyPage() {
  const accessState = await getClientAccessState();
  if (accessState.status !== "installed") return <ClientWaitingScreen firstName={accessState.firstName} />;

  return (
    <AppShell>
      <PageHeader
        title="Importer un bien"
        description="Collez une URL ou le contenu d'une annonce. La V1 simule le fetch et structure les donnees en brouillon."
      />
      <Panel title="Extraction d'annonce">
        <ImportPropertyForm />
      </Panel>
    </AppShell>
  );
}
