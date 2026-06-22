import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { AnalyzeMessageForm } from "./AnalyzeMessageForm";

export default function AnalyzeMessagePage() {
  return (
    <AppShell>
      <PageHeader
        title="Test d'analyse de message"
        description="Page interne de test. En production, Nesto analyse automatiquement les nouveaux echanges depuis WhatsApp."
      />
      <Panel title="Analyse IA">
        <AnalyzeMessageForm />
      </Panel>
    </AppShell>
  );
}
