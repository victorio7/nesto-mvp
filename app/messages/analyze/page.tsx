import { AppShell } from "@/components/AppShell";
import { ClientWaitingScreen } from "@/components/ClientAccessScreens";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { getClientAccessState } from "@/lib/client-access-state";
import { AnalyzeMessageForm } from "./AnalyzeMessageForm";

export default async function AnalyzeMessagePage() {
  const accessState = await getClientAccessState();
  if (accessState.status !== "installed") return <ClientWaitingScreen firstName={accessState.firstName} />;

  return (
    <AppShell>
      <PageHeader
        title="Test d'analyse de message"
        description="Page interne de test. En production, Clapy analyse automatiquement les nouveaux echanges depuis WhatsApp."
      />
      <Panel title="Analyse IA">
        <AnalyzeMessageForm />
      </Panel>
    </AppShell>
  );
}
