import { ArrowLeft, Building2, MessageCircle, NotebookText, Plug, UserRound } from "lucide-react";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { StatusBadge } from "@/components/StatusBadge";
import { TeamStatusSubmitButton } from "@/components/TeamStatusSubmitButton";
import {
  checklistStatusLabel,
  getTeamInstallationById,
  globalStatusLabel,
  type TeamChecklistStatus,
  type TeamInstallStatus
} from "@/lib/team-installations-data";
import { TeamShell } from "../../TeamShell";
import { setTeamInstallationStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function TeamInstallationDetailPage({ params }: { params: Promise<{ agencyId: string }> }) {
  const { agencyId: installationId } = await params;
  const data = await getTeamInstallationById(installationId);
  const installation = data.installation;

  return (
    <TeamShell>
      <PageHeader
        title={installation ? installation.agentName : "Dossier agent"}
        description={installation ? `${installation.agencyName} - dossier installation agent` : "Vue interne equipe Nesto pour finaliser l'installation sans exposer de complexite au client."}
        actions={<Button href="/team/installations" variant="secondary"><ArrowLeft size={16} /> Retour</Button>}
      />

      {!data.enabled ? (
        <Panel>
          <p className="text-sm font-semibold leading-6 text-gray-600">
            Acces equipe non active. Activez NESTO_TEAM_ACCESS=true cote serveur.
          </p>
        </Panel>
      ) : null}

      {data.enabled && !installation ? (
        <Panel>
          <p className="text-sm font-semibold leading-6 text-gray-600">Installation introuvable.</p>
        </Panel>
      ) : null}

      {installation ? (
        <div className="grid gap-5">
          <Panel>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Info icon={UserRound} label="Agent client" value={installation.agentName} />
                <Info icon={Building2} label="Agence liee" value={installation.agencyName} />
                <Info icon={MessageCircle} label="Telephone" value={installation.phone || "-"} />
                <Info icon={Plug} label="Email" value={installation.email || "-"} />
              </div>
              <StatusBadge label={globalStatusLabel(installation.globalStatus)} tone={globalStatusTone(installation.globalStatus)} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusButton installationId={installation.id} status="in_progress" text="Marquer en cours" />
              <StatusButton installationId={installation.id} status="blocked" text="Marquer besoin d'aide" variant="secondary" />
              <StatusButton installationId={installation.id} status="ready_to_test" text="Marquer pret a tester" variant="secondary" />
              <StatusButton installationId={installation.id} status="installed" text="Marquer installe" />
            </div>
          </Panel>

          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <Panel eyebrow="Avancement" title="Checklist">
              <div className="grid gap-2">
                {installation.checklist.map((item) => (
                  <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-[#fbfaf5] px-3 py-2" key={item.key}>
                    <span className="text-sm font-bold">{item.label}</span>
                    <StatusBadge label={checklistStatusLabel(item.status)} tone={checklistStatusTone(item.status)} />
                  </div>
                ))}
              </div>
            </Panel>

            <Panel eyebrow="Equipe Nesto" title="Notes internes">
              <div className="rounded-md border border-line bg-[#fbfaf5] p-4">
                <div className="flex gap-3">
                  <NotebookText className="shrink-0 text-pine" size={18} />
                  <p className="text-sm font-semibold leading-6 text-gray-700">
                    {installation.notes || "Aucune note interne pour le moment. Le prochain statut sera enregistre dans l'historique d'installation."}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-md border border-wood/25 bg-[#fffaf0] p-4">
                <p className="text-xs font-black uppercase tracking-normal text-wood">Prochaine action</p>
                <p className="mt-1 text-sm font-bold leading-6">{installation.nextAction}</p>
              </div>
            </Panel>
          </div>

          <Panel eyebrow="Canaux" title="Canaux a connecter">
            {installation.connections.length ? (
              <DataTable
                columns={["Canal", "Statut", "Detail"]}
                rows={installation.connections.map((connection) => [
                  connection.label,
                  <StatusBadge key={`${connection.type}-status`} label={connection.status} tone={connection.status === "connected" ? "validated" : connection.status === "error" ? "failed" : "pending"} />,
                  connection.detail || "-"
                ])}
              />
            ) : (
              <EmptyLine text="Aucun canal configure pour le moment." />
            )}
          </Panel>

          <Panel eyebrow="Informations recues" title="Dossier transmis par l'agent">
            {installation.installDetails.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {installation.installDetails.map((detail) => (
                  <div className="rounded-md border border-line bg-[#fbfaf5] p-3" key={detail.label}>
                    <p className="text-xs font-black uppercase tracking-normal text-gray-500">{detail.label}</p>
                    <p className="mt-1 truncate text-sm font-bold text-ink">{detail.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyLine text="Aucune information supplementaire encore recue." />
            )}
          </Panel>

          <Panel eyebrow="Biens" title="Sources de biens">
            {installation.propertySources.length ? (
              <DataTable
                columns={["Nom", "Type", "Statut", "URL"]}
                rows={installation.propertySources.map((source) => [
                  source.name,
                  source.type,
                  <StatusBadge key={`${source.id}-status`} label={source.status} tone={source.status === "connected" ? "validated" : "pending"} />,
                  source.url
                ])}
              />
            ) : (
              <EmptyLine text="Aucune source de biens encore enregistree." />
            )}
          </Panel>

          <Panel eyebrow="A traiter" title="Actions restantes">
            <div className="grid gap-2 md:grid-cols-2">
              {installation.checklist
                .filter((item) => !["connected", "validated", "skipped"].includes(item.status))
                .map((item) => (
                  <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-[#fbfaf5] px-3 py-2" key={item.key}>
                    <span className="text-sm font-bold">{item.label}</span>
                    <StatusBadge label={checklistStatusLabel(item.status)} tone={checklistStatusTone(item.status)} />
                  </div>
                ))}
              {installation.checklist.every((item) => ["connected", "validated", "skipped"].includes(item.status)) ? (
                <EmptyLine text="Aucune action restante. Ce dossier est pret a etre suivi." />
              ) : null}
            </div>
          </Panel>

          <Panel eyebrow="Contexte" title="Agence liee">
            <div className="grid gap-3 sm:grid-cols-3">
              <Info icon={Building2} label="Agence" value={installation.agencyName} />
              <Info icon={Plug} label="Site agence" value={installation.websiteUrl || "-"} />
              <Info icon={UserRound} label="Dossier agent" value={installation.agentName} />
            </div>
          </Panel>

          <Panel eyebrow="Historique" title="Actions d'installation">
            {installation.history.length ? (
              <DataTable
                columns={["Action", "Statut", "Date"]}
                rows={installation.history.map((event) => [
                  event.label,
                  event.status,
                  event.date ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.date)) : "-"
                ])}
              />
            ) : (
              <EmptyLine text="Aucun historique d'installation pour le moment." />
            )}
          </Panel>
        </div>
      ) : null}
    </TeamShell>
  );
}

function StatusButton({
  installationId,
  status,
  text,
  variant = "primary"
}: {
  installationId: string;
  status: TeamInstallStatus;
  text: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <form action={setTeamInstallationStatus}>
      <input name="installationId" type="hidden" value={installationId} />
      <input name="status" type="hidden" value={status} />
      <TeamStatusSubmitButton text={text} variant={variant} />
    </form>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-[#fbfaf5] p-3">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-normal text-gray-500">
        <Icon className="text-pine" size={14} />
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-bold text-ink">{value}</p>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="rounded-md border border-line bg-[#fbfaf5] p-4 text-sm font-semibold leading-6 text-gray-600">{text}</p>;
}

function globalStatusTone(status: TeamInstallStatus) {
  if (status === "installed") return "validated";
  if (status === "blocked") return "failed";
  if (status === "ready_to_test") return "proposed";
  return "pending";
}

function checklistStatusTone(status: TeamChecklistStatus) {
  if (status === "validated" || status === "connected") return "validated";
  if (status === "needs_help") return "failed";
  if (status === "in_progress") return "pending";
  return "archived";
}
