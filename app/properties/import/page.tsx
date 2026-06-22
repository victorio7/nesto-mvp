import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { ImportPropertyForm } from "./ImportPropertyForm";

export default function ImportPropertyPage() {
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
