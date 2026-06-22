import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { WhatsAppSimulatorClient } from "./WhatsAppSimulatorClient";

export default function WhatsAppSimulatorPage() {
  return (
    <AppShell>
      <PageHeader
        title="Simulateur WhatsApp"
        description="Ce simulateur permet de tester le fonctionnement avant la connexion reelle a WhatsApp. C'est un outil de demonstration interne : le client final pilotera Nesto directement depuis WhatsApp."
      />
      <WhatsAppSimulatorClient />
    </AppShell>
  );
}
