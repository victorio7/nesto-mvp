import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { StatusBadge } from "@/components/StatusBadge";
import { demoMatches, getContactName, getPropertyTitle } from "@/lib/demo-data";

export default function MatchesPage() {
  return (
    <AppShell>
      <PageHeader
        title="Matchings prospects - biens"
        description="Scores explicables bases sur budget, ville, type de bien, chambres, animaux, disponibilite et statut du bien."
      />
      <Panel>
        <DataTable
          columns={["Contact", "Bien", "Score", "Raisons", "Points bloquants", "Statut"]}
          rows={demoMatches.map((match) => [
            getContactName(match.contact_id),
            getPropertyTitle(match.property_id),
            <StatusBadge label={`${match.score}/100`} tone={match.score >= 90 ? "hot" : "proposed"} />,
            match.reasons.join(", "),
            match.blocking_points.length ? match.blocking_points.join(", ") : "-",
            <StatusBadge label={match.status} />
          ])}
        />
      </Panel>
    </AppShell>
  );
}
