import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { demoAutonomySettings } from "@/lib/demo-data";

const labels: Record<string, string> = {
  auto_complete_missing_info: "Demander automatiquement les informations manquantes",
  auto_answer_faq: "Repondre automatiquement aux questions frequentes",
  auto_request_documents: "Demander automatiquement les documents",
  require_validation_for_visits: "Validation obligatoire pour confirmer une visite",
  require_validation_for_address: "Validation obligatoire pour envoyer une adresse exacte",
  require_validation_for_rejection: "Validation obligatoire pour refuser un dossier",
  require_validation_for_group_followups: "Validation obligatoire pour une relance groupee"
};

export default function AutonomyPage() {
  const settings = Object.entries(demoAutonomySettings).filter(([key]) => key !== "agency_id");

  return (
    <AppShell>
      <PageHeader
        title="Autonomie de l'assistant"
        description="Reglez ce que l'IA peut faire seule et ce qui doit toujours etre valide par un humain."
      />
      <Panel>
        <div className="space-y-3">
          {settings.map(([key, value]) => (
            <label className="flex min-h-14 items-center justify-between gap-4 rounded-md border border-line p-4" key={key}>
              <span className="font-semibold">{labels[key]}</span>
              <input className="size-5 accent-pine" type="checkbox" defaultChecked={Boolean(value)} />
            </label>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
