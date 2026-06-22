import "server-only";
import { getInstallationData } from "@/lib/installation-data";

export type ClientAccessStatus = "installation_incomplete" | "waiting_team_validation" | "installed";

export type ClientAccessState = {
  status: ClientAccessStatus;
  firstName: string;
  installationReadyForTeam: boolean;
  dashboardUnlocked: boolean;
};

const passedStatuses = new Set(["connected", "skipped"]);

export async function getClientAccessState(): Promise<ClientAccessState> {
  const installation = await getInstallationData();
  const firstName = installation.agency.agentName.split(/\s+/).filter(Boolean)[0] || "bonjour";
  const requiredStepsDone = [
    installation.whatsappProspect.status,
    installation.whatsappAgent.status,
    installation.website.status
  ].every((status) => passedStatuses.has(status));
  const finalTestRequested = installation.steps.final_test === "in_progress" || installation.steps.final_test === "connected";

  if (installation.dashboardUnlocked) {
    return {
      status: "installed",
      firstName,
      installationReadyForTeam: true,
      dashboardUnlocked: true
    };
  }

  if (!requiredStepsDone || !finalTestRequested) {
    return {
      status: "installation_incomplete",
      firstName,
      installationReadyForTeam: false,
      dashboardUnlocked: false
    };
  }

  return {
    status: "waiting_team_validation",
    firstName,
    installationReadyForTeam: true,
    dashboardUnlocked: false
  };
}
