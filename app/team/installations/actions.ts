"use server";

import { revalidatePath } from "next/cache";
import {
  updateTeamInstallationStatus,
  updateTeamInstallationTestStatus,
  type TeamInstallStatus
} from "@/lib/team-installations-data";

const allowedStatuses = new Set<TeamInstallStatus>([
  "in_progress",
  "blocked",
  "ready_to_test",
  "installed"
]);

export async function setTeamInstallationStatus(formData: FormData) {
  const installationId = String(formData.get("installationId") ?? formData.get("agencyId") ?? "");
  const status = String(formData.get("status") ?? "") as TeamInstallStatus;

  if (!installationId || !allowedStatuses.has(status)) return;

  await updateTeamInstallationStatus(installationId, status);
  revalidatePath("/team/installations");
  revalidatePath(`/team/installations/${installationId}`);
  revalidatePath("/dashboard");
}

export async function keepTeamInstallationActive(formData: FormData) {
  const installationId = String(formData.get("installationId") ?? "");
  if (!installationId) return;

  await updateTeamInstallationTestStatus(installationId, "active_test");
  revalidatePath("/team/installations");
  revalidatePath(`/team/installations/${installationId}`);
}
