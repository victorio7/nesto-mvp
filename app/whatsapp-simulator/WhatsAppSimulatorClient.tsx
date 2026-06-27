"use client";

import { useEffect, useState } from "react";
import { Bot, BriefcaseBusiness, MessageCircle, Send, Smartphone } from "lucide-react";
import { Button } from "@/components/Button";
import { Panel } from "@/components/Panel";

type ChatMessage = {
  from: string;
  text: string;
  channel?: "whatsapp_prospect" | "whatsapp_agent" | "system";
};

type SimulatorResponse = {
  prospectConversation: ChatMessage[];
  agentConversation: ChatMessage[];
  result: {
    action: string;
    records: Record<string, unknown>;
    timeline: string[];
    details?: Record<string, unknown>;
  };
  supabase?: {
    configured: boolean;
    persisted: boolean;
    message: string;
    error?: string;
  };
};

type SupabaseMemoryState = {
  configured: boolean;
  persisted: boolean;
  message: string;
  openai_configured?: boolean;
  error?: string;
  counts: {
    contacts: number;
    properties: number;
    messages: number;
    matches: number;
    actions: number;
  };
};

type SupabaseWriteStatus = NonNullable<SimulatorResponse["supabase"]>;

const commands = [
  "Nouveau contact : ...",
  "Qui relancer aujourd'hui ?",
  "Quels biens sont nouveaux ?",
  "Trouve les prospects pour le F3 Punaauia",
  "Valide",
  "Refuse",
  "Details",
  "Relance demain"
];

const scenarios = [
  { key: "prospect_message", label: "A. Prospect entrant", tone: "primary" },
  { key: "call_summary", label: "B. Resume d'appel", tone: "primary" },
  { key: "new_property_personal", label: "C. Bien personnel", tone: "primary" },
  { key: "new_property_colleague", label: "D. Bien de Marc", tone: "primary" },
  { key: "agent_command_validate", label: "E. Valider : 1", tone: "secondary" },
  { key: "agent_command_details", label: "F. Details : 2", tone: "secondary" },
  { key: "complete_flow", label: "Scenario complet", tone: "secondary" }
] as const;

const scenarioEndpoints: Record<string, { url: string; body?: Record<string, unknown> }> = {
  prospect_message: { url: "/api/simulator/prospect-message" },
  call_summary: { url: "/api/simulator/call-summary" },
  new_property_personal: { url: "/api/simulator/property-detected", body: { source: "personal" } },
  new_property_colleague: { url: "/api/simulator/property-detected", body: { source: "colleague" } },
  agent_command_validate: { url: "/api/simulator/agent-command" },
  agent_command_details: { url: "/api/simulator/agent-command" },
  complete_flow: { url: "/api/whatsapp-simulator", body: { scenario: "complete_flow" } }
};

export function WhatsAppSimulatorClient() {
  const [prospectMessages, setProspectMessages] = useState<ChatMessage[]>([]);
  const [agentMessages, setAgentMessages] = useState<ChatMessage[]>([]);
  const [result, setResult] = useState<SimulatorResponse["result"] | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [memory, setMemory] = useState<SupabaseMemoryState | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseWriteStatus | null>(null);
  const [rawCommand, setRawCommand] = useState("1");
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    void refreshMemory();
  }, []);

  async function runScenario(scenario: string) {
    setLoading(scenario);
    const endpoint = scenarioEndpoints[scenario] ?? { url: "/api/whatsapp-simulator", body: { scenario } };
    const scenarioCommand = scenario === "agent_command_details" ? "2" : scenario === "agent_command_validate" ? rawCommand || "1" : rawCommand;
    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(endpoint.body ?? {}), rawCommand: scenarioCommand })
    });
    const data = (await response.json()) as SimulatorResponse;
    setProspectMessages(data.prospectConversation);
    setAgentMessages(data.agentConversation);
    setResult(data.result);
    setSupabaseStatus(data.supabase ?? null);
    setHistory((current) => [
      `${new Date().toLocaleTimeString("fr-FR")} - ${String(data.result.action ?? "Scenario execute")}`,
      ...current
    ]);
    await refreshMemory();
    setLoading(null);
  }

  async function refreshMemory() {
    const response = await fetch("/api/simulator/state", { cache: "no-store" });
    const data = (await response.json()) as SupabaseMemoryState;
    setMemory(data);
  }

  return (
    <div className="space-y-6">
      <Panel
        eyebrow="Mode demonstration"
        title="Flux WhatsApp prospect + WhatsApp agent"
      >
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm leading-6 text-gray-600">
              Ce test interne montre le fonctionnement cible : les prospects ecrivent au WhatsApp professionnel,
              Clapy travaille en arriere-plan, puis les validations importantes arrivent sur le WhatsApp interne de l'agent.
              En production, l'agent n'a pas besoin d'utiliser cette page.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ChannelCard
                icon={BriefcaseBusiness}
                label="WhatsApp professionnel"
                text="Canal ou les prospects ecrivent a l'agence ou a l'agent."
              />
              <ChannelCard
                icon={Smartphone}
                label="WhatsApp agent"
                text="Canal interne ou Clapy alerte l'agent et recoit les validations."
              />
            </div>
          </div>
          <div className="grid gap-3">
            <label className="text-sm font-bold">
              Commande agent a tester
              <input
                className="mt-2 w-full rounded-md border border-line px-3 py-3 focus-ring"
                onChange={(event) => setRawCommand(event.target.value)}
                value={rawCommand}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {scenarios.map((scenario) => (
                <Button
                  key={scenario.key}
                  onClick={() => runScenario(scenario.key)}
                  variant={scenario.tone}
                >
                  {loading === scenario.key ? "Simulation..." : scenario.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <Panel eyebrow="Memoire persistante" title="Memoire Supabase">
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-md border border-line bg-[#fbfaf5] p-4">
            {supabaseStatus?.persisted ? (
              <p className="mb-3 rounded-md border border-pine/20 bg-[#f4fbf7] px-3 py-2 text-sm font-black text-pine">
                Enregistre dans Supabase
              </p>
            ) : null}
            {supabaseStatus && !supabaseStatus.persisted ? (
              <p className="mb-3 rounded-md border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-sm font-black text-[#92400e]">
                Simulation locale : non enregistre dans Supabase
              </p>
            ) : null}
            <p className="font-black">{memory?.message ?? "Verification de Supabase..."}</p>
            {memory?.error ? <p className="mt-2 text-sm leading-6 text-[#991b1b]">{memory.error}</p> : null}
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Les scenarios ecrivent cote serveur dans Supabase quand la configuration et le schema sont disponibles. Sans OpenAI
              ou sans Supabase accessible, Clapy utilise les donnees locales de demonstration.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-5">
            <MemoryMetric label="Contacts" value={memory?.counts.contacts ?? 0} />
            <MemoryMetric label="Biens" value={memory?.counts.properties ?? 0} />
            <MemoryMetric label="Messages" value={memory?.counts.messages ?? 0} />
            <MemoryMetric label="Matches" value={memory?.counts.matches ?? 0} />
            <MemoryMetric label="Actions" value={memory?.counts.actions ?? 0} />
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <ConversationPanel
          empty="Lancez le scenario A pour simuler un message entrant sur le WhatsApp professionnel."
          icon={MessageCircle}
          messages={prospectMessages}
          title="1. Conversation prospect"
          subtitle="WhatsApp professionnel de l'agence ou de l'agent"
        />
        <ConversationPanel
          empty="Lancez les scenarios B a F pour simuler les alertes et commandes sur le WhatsApp interne de l'agent."
          icon={Bot}
          messages={agentMessages}
          title="2. Conversation agent avec Clapy"
          subtitle="WhatsApp personnel ou interne de l'agent"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Panel title="Resultat metier">
          {result ? (
            <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="rounded-md border border-pine/20 bg-[#f4fbf7] p-4 text-sm font-black leading-6 text-pine">
                  {result.action}
                </p>
                {supabaseStatus?.persisted ? (
                  <p className="mt-3 rounded-md border border-pine/20 bg-white p-3 text-sm font-black leading-6 text-pine">
                    Enregistre dans Supabase. Les compteurs et les pages Contacts/Biens se mettent a jour avec les donnees persistantes.
                  </p>
                ) : null}
                <div className="mt-4 space-y-2">
                  {result.timeline.map((item) => (
                    <div className="flex gap-3 rounded-md border border-line bg-[#fbfaf5] p-3 text-sm font-semibold leading-6" key={item}>
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-pine" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-line bg-[#fbfaf5] p-4">
                <p className="font-black">Ce que Clapy a traite</p>
                <div className="mt-3 grid gap-2">
                  {summarizeRecords(result.records).map((item) => (
                    <p className="rounded-md bg-white px-3 py-2 text-sm font-semibold leading-6 text-gray-700" key={item}>
                      {item}
                    </p>
                  ))}
                </div>
                {process.env.NODE_ENV !== "production" ? (
                  <details className="mt-4 rounded-md border border-line bg-white p-3">
                    <summary className="cursor-pointer text-xs font-black uppercase tracking-normal text-gray-500">
                      Debug technique
                    </summary>
                    <pre className="mt-3 max-h-[320px] overflow-auto rounded-md bg-ink p-4 text-xs leading-5 text-white">
                      {JSON.stringify(result.records, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="min-h-72 rounded-md bg-ink p-4 text-sm leading-6 text-white">
              Le resultat de l'analyse, de la creation de fiche, du matching ou de la validation apparaitra ici.
            </p>
          )}
        </Panel>

        <Panel title="Commandes WhatsApp possibles">
          <div className="grid gap-2">
            {commands.map((command) => (
              <div className="flex items-center gap-2 rounded-md border border-line bg-[#fbfaf5] px-3 py-2 text-sm font-semibold" key={command}>
                <Send className="text-pine" size={15} />
                {command}
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-md border border-line p-4">
            <p className="font-black">Historique simulateur</p>
            <div className="mt-3 space-y-2">
              {history.length ? (
                history.map((entry) => (
                  <p className="rounded-md bg-[#fbfaf5] px-3 py-2 text-xs text-gray-600" key={entry}>
                    {entry}
                  </p>
                ))
              ) : (
                <p className="text-sm text-gray-600">Aucune action lancee.</p>
              )}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function summarizeRecords(records: Record<string, unknown>) {
  const labels: string[] = [];
  const contact = getRecord(records.contact);
  const property = getRecord(records.property);
  const match = getRecord(records.match);
  const action = getRecord(records.action);

  if (contact) labels.push(`Contact : ${text(contact.first_name) || "prospect"} ${text(contact.last_name)}`.trim());
  if (property) labels.push(`Bien : ${text(property.title) || "bien detecte"}`);
  if (match) labels.push(`Matching : ${text(match.score) || "0"} % de compatibilite`);
  if (action) labels.push(`Action : ${text(action.title) || "proposition creee"}`);

  return labels.length ? labels : ["Scenario execute. Les informations utiles sont visibles dans les conversations et l'historique."];
}

function getRecord(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function text(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function MemoryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-line bg-white p-4 text-center">
      <p className="text-2xl font-black text-pine">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-normal text-gray-500">{label}</p>
    </div>
  );
}

function ChannelCard({
  icon: Icon,
  label,
  text
}: {
  icon: typeof Smartphone;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-md border border-line bg-[#fbfaf5] p-4">
      <Icon className="text-pine" size={20} />
      <p className="mt-3 font-black">{label}</p>
      <p className="mt-1 text-sm leading-6 text-gray-600">{text}</p>
    </div>
  );
}

function ConversationPanel({
  empty,
  icon: Icon,
  messages,
  subtitle,
  title
}: {
  empty: string;
  icon: typeof MessageCircle;
  messages: ChatMessage[];
  subtitle: string;
  title: string;
}) {
  return (
    <Panel title={title}>
      <p className="mb-4 text-sm font-semibold leading-6 text-gray-600">{subtitle}</p>
      <div className="min-h-[30rem] rounded-md border border-line bg-[#efe7d7] p-4">
        {messages.length ? (
          <div className="space-y-3">
            {messages.map((message, index) => {
              const isClapy = message.from === "Clapy";
              const isSystem = message.from === "Site agence";
              return (
                <div className={`flex ${isClapy || isSystem ? "justify-start" : "justify-end"}`} key={`${message.from}-${index}`}>
                  <div
                    className={`max-w-[88%] rounded-md p-3 text-sm leading-6 shadow-panel ${
                      isSystem ? "bg-[#fff7df] text-ink" : isClapy ? "bg-white text-ink" : "bg-pine text-white"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-normal opacity-70">
                      <Icon size={14} />
                      {message.from}
                    </div>
                    {message.text}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-md bg-white p-4 text-sm leading-6 text-gray-600">{empty}</p>
        )}
      </div>
    </Panel>
  );
}
