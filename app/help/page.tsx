import { HelpCircle, MessageCircle, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ClientWaitingScreen } from "@/components/ClientAccessScreens";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { getClientAccessState } from "@/lib/client-access-state";
import { NESTO_WHATSAPP_CONTACT_URL } from "@/lib/nesto-contact";

export default async function HelpPage() {
  const accessState = await getClientAccessState();
  if (accessState.status !== "installed") return <ClientWaitingScreen firstName={accessState.firstName} />;

  return (
    <AppShell>
      <PageHeader
        title="Aide"
        description="Nesto se pilote depuis WhatsApp. Cette page sert simplement a vous rappeler quoi demander et comment joindre l'equipe."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <Panel title="Commandes utiles sur WhatsApp">
          <div className="grid gap-3">
            {[
              "Qui dois-je relancer aujourd'hui ?",
              "Trouve les prospects pour le F3 Punaauia.",
              "Quels biens sont nouveaux ?",
              "Valide.",
              "Details.",
              "Relance demain."
            ].map((command) => (
              <p className="rounded-md border border-line bg-[#fbfaf5] px-4 py-3 text-sm font-black text-ink" key={command}>
                {command}
              </p>
            ))}
          </div>
        </Panel>

        <Panel title="Contacter l'equipe Nesto">
          <div className="rounded-md border border-wood/25 bg-[#fffaf0] p-4">
            <div className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-pine text-white">
                <HelpCircle size={18} />
              </span>
              <div>
                <p className="font-black text-ink">Une connexion manque ?</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-gray-700">
                  Envoyez un message a l'equipe Nesto. Nous vous accompagnons pour finaliser vos outils sans jargon technique.
                </p>
              </div>
            </div>
            <a
              className="focus-ring mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-pine px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#185848]"
              href={NESTO_WHATSAPP_CONTACT_URL}
              rel="noreferrer"
              target="_blank"
            >
              <MessageCircle size={16} /> Contacter l'equipe Nesto
            </a>
          </div>
        </Panel>

        <Panel title="Rappel important">
          <div className="flex gap-3 rounded-md border border-line bg-[#fbfaf5] p-4">
            <Send className="mt-0.5 shrink-0 text-pine" size={18} />
            <p className="text-sm font-semibold leading-6 text-gray-700">
              WhatsApp agit. Le dashboard memorise. Pour agir, valider ou demander une relance, utilisez WhatsApp.
            </p>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
