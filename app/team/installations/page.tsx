import { ArrowRight, Building2, Clock3, Phone, ShieldAlert, UserRound } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { StatusBadge } from "@/components/StatusBadge";
import { TeamStatusSubmitButton } from "@/components/TeamStatusSubmitButton";
import {
  checklistStatusLabel,
  getTeamInstallationsData,
  globalStatusLabel,
  type TeamChecklistStatus,
  type TeamInstallStatus,
  type TeamInstallation
} from "@/lib/team-installations-data";
import { TeamShell } from "../TeamShell";
import { keepTeamInstallationActive, setTeamInstallationStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function TeamInstallationsPage({
  searchParams
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const showHiddenTests = view === "tests";
  const data = await getTeamInstallationsData();
  const activeInstallations = sortByLastUpdate(
    data.installations.filter((installation) => !isTestInstallation(installation))
  );
  const hiddenTestInstallations = sortByLastUpdate(
    data.installations.filter(isTestInstallation)
  );
  const displayedInstallations = showHiddenTests ? hiddenTestInstallations : activeInstallations;

  return (
    <TeamShell>
      <PageHeader
        title="Installations à traiter"
        description="Vue interne equipe Clapy. Les clients gardent une experience simple ; ici, l'equipe voit quoi finaliser en priorite."
      />

      {!data.enabled ? <LockedNotice /> : null}
      {data.enabled && data.error ? <DataNotice message="Certaines donnees Supabase ne sont pas disponibles. La page reste utilisable avec les informations deja lues." /> : null}

      {data.enabled ? (
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-white p-3 shadow-sm">
            <div className="flex flex-wrap gap-2" aria-label="Filtrer les dossiers d'installation">
              <TeamViewLink
                active={!showHiddenTests}
                count={activeInstallations.length}
                href="/team/installations"
                label="Dossiers actifs"
              />
              <TeamViewLink
                active={showHiddenTests}
                count={hiddenTestInstallations.length}
                href="/team/installations?view=tests"
                label="Tests masqués"
              />
            </div>
            <p className="text-xs font-semibold text-gray-500">
              {showHiddenTests
                ? "Données de test conservées, sans encombrer le suivi client."
                : "Seuls les dossiers clients actifs sont affichés."}
            </p>
          </div>

          {displayedInstallations.length ? (
            displayedInstallations.map((installation) => (
              <InstallationCard installation={installation} key={installation.id} />
            ))
          ) : (
            <Panel>
              <p className="text-sm font-semibold leading-6 text-gray-600">
                {showHiddenTests
                  ? "Aucun ancien dossier de test n'est masqué."
                  : "Aucune installation à traiter pour le moment. Les nouveaux agents clients apparaîtront ici dès que leur espace Clapy sera créé."}
              </p>
            </Panel>
          )}
        </div>
      ) : null}
    </TeamShell>
  );
}

function isTestInstallation(installation: TeamInstallation) {
  if (installation.testStatus === "active_test") return false;

  const value = [
    installation.agentName,
    installation.email,
    installation.agencyName,
    installation.websiteUrl
  ].join(" ").toLowerCase();

  return [
    "@nesto.test",
    "nesto-test",
    "test@",
    "demo",
    "audit",
    "audit-",
    "mission",
    "mission-",
    "skip",
    "skip-",
    "test-"
  ].some((marker) => value.includes(marker));
}

function sortByLastUpdate(installations: TeamInstallation[]) {
  return [...installations].sort((left, right) => {
    return new Date(right.lastUpdated || 0).getTime() - new Date(left.lastUpdated || 0).getTime();
  });
}

function TeamViewLink({
  active,
  count,
  href,
  label
}: {
  active: boolean;
  count: number;
  href: string;
  label: string;
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-10 items-center gap-2 rounded-md px-4 text-sm font-black transition ${
        active
          ? "bg-pine text-white shadow-sm"
          : "border border-line bg-[#fbfaf5] text-ink hover:border-pine/30 hover:bg-[#f4efe4]"
      }`}
      href={href}
    >
      {label}
      <span
        className={`rounded-full px-2 py-0.5 text-xs ${
          active ? "bg-white/15 text-white" : "bg-white text-gray-600"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}

function InstallationCard({ installation }: { installation: TeamInstallation }) {
  return (
    <section className="rounded-md border border-line bg-white p-5 shadow-panel">
      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-md bg-pine text-white">
                <UserRound size={21} />
              </span>
              <div>
                <h2 className="text-xl font-black text-ink">{installation.agentName}</h2>
                <p className="mt-1 text-sm font-semibold text-gray-600">{installation.agencyName}</p>
              </div>
            </div>
            <StatusBadge label={globalStatusLabel(installation.globalStatus)} tone={globalStatusTone(installation.globalStatus)} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Info icon={Phone} label="Telephone" value={installation.phone || "-"} />
            <Info icon={UserRound} label="Email" value={installation.email || "-"} />
            <Info icon={Building2} label="Agence liee" value={installation.agencyName || "-"} />
            <Info icon={Building2} label="Site agence" value={installation.websiteUrl || "-"} />
            <Info icon={Clock3} label="Derniere mise a jour" value={formatDate(installation.lastUpdated)} />
          </div>

          <div className="mt-5 rounded-md border border-wood/25 bg-[#fffaf0] p-4">
            <p className="text-xs font-black uppercase tracking-normal text-wood">Prochaine action</p>
            <p className="mt-1 text-sm font-bold leading-6 text-ink">{installation.nextAction}</p>
          </div>

          {installation.installDetails.length ? (
            <div className="mt-5 rounded-md border border-line bg-[#fbfaf5] p-4">
              <p className="text-xs font-black uppercase tracking-normal text-gray-500">Informations recues</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {installation.installDetails.map((detail) => (
                  <div key={detail.label}>
                    <p className="text-xs font-black text-gray-500">{detail.label}</p>
                    <p className="mt-1 truncate text-sm font-bold text-ink">{detail.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <p className="mb-3 text-sm font-black">Checklist installation</p>
          <div className="grid gap-2 md:grid-cols-2">
            {installation.checklist.map((item) => (
              <ChecklistLine key={item.key} label={item.label} status={item.status} />
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button href={`/team/installations/${installation.id}`} variant="secondary">
              Voir le dossier <ArrowRight size={15} />
            </Button>
            {installation.testStatus !== "active_test" && isTestInstallation(installation) ? (
              <form action={keepTeamInstallationActive}>
                <input name="installationId" type="hidden" value={installation.id} />
                <TeamStatusSubmitButton text="Garder dans les actifs" variant="secondary" />
              </form>
            ) : null}
            <StatusButton installationId={installation.id} status="in_progress" text="Marquer en cours" />
            <StatusButton installationId={installation.id} status="blocked" text="Marquer besoin d'aide" variant="secondary" />
            <StatusButton installationId={installation.id} status="ready_to_test" text="Marquer pret a tester" variant="secondary" />
            <StatusButton installationId={installation.id} status="installed" text="Marquer installe" />
          </div>
        </div>
      </div>
    </section>
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

function ChecklistLine({ label, status }: { label: string; status: TeamChecklistStatus }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-[#fbfaf5] px-3 py-2">
      <span className="text-sm font-bold text-ink">{label}</span>
      <StatusBadge label={checklistStatusLabel(status)} tone={checklistStatusTone(status)} />
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
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

function LockedNotice() {
  return (
    <Panel>
      <div className="flex gap-3">
        <ShieldAlert className="shrink-0 text-wood" size={22} />
        <div>
          <h2 className="font-black">Acces equipe non active</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-gray-600">
            Activez la variable NESTO_TEAM_ACCESS=true cote serveur pour ouvrir cette page interne.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function DataNotice({ message }: { message: string }) {
  return (
    <div className="mb-6 rounded-md border border-[#fde68a] bg-[#fffbeb] p-4 text-sm font-semibold leading-6 text-[#92400e]">
      {message}
    </div>
  );
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

function formatDate(value: string) {
  if (!value) return "A confirmer";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
