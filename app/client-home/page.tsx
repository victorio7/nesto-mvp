import { redirect } from "next/navigation";
import { ClientReadyScreen, ClientWaitingScreen } from "@/components/ClientAccessScreens";
import { getClientAccessState } from "@/lib/client-access-state";

export const dynamic = "force-dynamic";

export default async function ClientHomePage() {
  const state = await getClientAccessState();

  if (state.status === "installation_incomplete") {
    redirect("/installation");
  }

  if (state.status === "waiting_team_validation") {
    return <ClientWaitingScreen firstName={state.firstName} />;
  }

  return <ClientReadyScreen firstName={state.firstName} />;
}
