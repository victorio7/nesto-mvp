"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Mail, MessageCircle, PlayCircle, Share2, Building2 } from "lucide-react";
import { Button } from "@/components/Button";
import type { InstallationData, SimpleInstallStatus } from "@/lib/installation-data";
import { NESTO_WHATSAPP_CONTACT_URL } from "@/lib/nesto-contact";

type WizardKey = "whatsapp_prospect" | "whatsapp_agent" | "professional_email" | "agency_website" | "social_sources" | "confirmation";
type SaveAction = "continue" | "help" | "test" | "skip";

type FieldConfig = {
  key: string;
  label: string;
  value: string;
  placeholder: string;
  optional?: boolean;
};

type WizardStep = {
  key: WizardKey;
  title: string;
  description: string;
  status: SimpleInstallStatus;
  icon: typeof MessageCircle;
  fields: FieldConfig[];
  primaryLabel: string;
  skipLabel?: string;
};

export function InstallationClient({
  initialData
}: {
  initialData: InstallationData;
}) {
  const initialSteps = useMemo(() => buildSteps(initialData), [initialData]);
  const [steps, setSteps] = useState(initialSteps);
  const [currentIndex, setCurrentIndex] = useState(() => firstOpenStepIndex(initialSteps));
  const [saving, setSaving] = useState(false);
  const [finalRequested, setFinalRequested] = useState(initialData.steps.final_test === "in_progress");
  const currentStep = steps[currentIndex] ?? steps[0];
  const CurrentIcon = currentStep.icon;
  const progress = Math.round(((currentIndex + 1) / steps.length) * 100);
  const isConfirmation = currentStep.key === "confirmation";
  const requiredMissing = currentStep.fields.some((field) => !field.optional && !field.value.trim());

  function updateField(fieldKey: string, value: string) {
    setSteps((current) =>
      current.map((step, index) =>
        index === currentIndex
          ? {
              ...step,
              fields: step.fields.map((field) => field.key === fieldKey ? { ...field, value } : field)
            }
          : step
      )
    );
  }

  async function saveCurrentStep(action: SaveAction, options?: { skip?: boolean }) {
    if (!currentStep) return;
    setSaving(true);

    const result = await saveSingleStep(currentStep, options?.skip ? "skip" : action);

    const nextStatus: SimpleInstallStatus = action === "help" ? "needs_help" : action === "test" ? "in_progress" : options?.skip ? "skipped" : "connected";
    setSteps((current) => current.map((item, index) => index === currentIndex ? { ...item, status: nextStatus } : item));
    setSaving(false);

    if (action === "test") {
      setFinalRequested(true);
      return;
    }

    if (action !== "help" && currentIndex < steps.length - 1) {
      setCurrentIndex((index) => index + 1);
    }
  }

  if (finalRequested) {
    return <WaitingCard onEdit={() => setFinalRequested(false)} />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <section className="rounded-lg border border-line bg-white p-5 shadow-panel sm:p-7">
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-normal text-wood">Étape {currentIndex + 1} sur {steps.length}</p>
            <p className="text-xs font-black text-pine">{statusLabel(currentStep.status)}</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#edf1ea]">
            <div className="h-full rounded-full bg-pine transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-md bg-pine text-white">
            <CurrentIcon size={22} />
          </span>
          <div>
            <h2 className="text-2xl font-black text-ink">{currentStep.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-gray-600">{currentStep.description}</p>
          </div>
        </div>

        {isConfirmation ? <ConfirmationContent /> : (
          <div className="mt-6 grid gap-4">
            {currentStep.fields.map((field) => (
              <label className="block text-sm font-bold text-ink" key={field.key}>
                {field.label}
                {field.optional ? <span className="ml-1 font-semibold text-gray-500">(facultatif)</span> : null}
                <input
                  className="mt-2 w-full rounded-md border border-line bg-white px-3 py-3 text-sm focus-ring"
                  onChange={(event) => updateField(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  value={field.value}
                />
              </label>
            ))}
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          {isConfirmation ? (
            <Button onClick={() => saveCurrentStep("test")} disabled={saving}>
              <PlayCircle size={16} /> {saving ? "Demande en cours..." : "Demander le test final"}
            </Button>
          ) : (
            <Button onClick={() => saveCurrentStep("continue")} disabled={saving || requiredMissing}>
              {saving ? "Enregistrement..." : currentStep.primaryLabel} <ArrowRight size={16} />
            </Button>
          )}

          {currentStep.skipLabel ? (
            <Button onClick={() => saveCurrentStep("skip", { skip: true })} variant="ghost" disabled={saving}>
              {currentStep.skipLabel}
            </Button>
          ) : null}

          {!isConfirmation ? (
            <button
              onClick={() => saveCurrentStep("help")}
              disabled={saving}
              className="text-xs font-medium text-gray-400 hover:text-pine disabled:opacity-50"
              type="button"
            >
              Besoin d'aide ?
            </button>
          ) : null}
        </div>

        {requiredMissing && !isConfirmation ? (
          <p className="mt-3 text-xs font-semibold text-gray-500">Ce champ est nécessaire pour continuer. L'équipe peut aussi vous aider.</p>
        ) : null}
      </section>
    </div>
  );
}

export function FinalTestButton() {
  const [saving, setSaving] = useState(false);

  async function requestFinalTest() {
    setSaving(true);
    await fetch("/api/installation/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stepKey: "final_test",
        action: "test",
        data: {
          requested: "yes"
        }
      })
    });
    setSaving(false);
  }

  return (
    <div className="mt-4">
      <Button onClick={requestFinalTest}>
        <PlayCircle size={16} /> {saving ? "Demande en cours..." : "Demander le test final"}
      </Button>
    </div>
  );
}

function ConfirmationContent() {
  return (
    <div className="mt-6 rounded-md border border-wood/25 bg-[#fffaf0] p-4">
      <div className="flex gap-3">
        <CheckCircle2 className="mt-0.5 shrink-0 text-pine" size={20} />
        <div className="text-sm font-semibold text-gray-700">
          <p className="font-black text-ink">Tout est bon ! Vérification en cours.</p>
          <p>L'équipe vous contacte par WhatsApp. Délai moyen : moins de 24h.</p>
        </div>
      </div>
    </div>
  );
}

function WaitingCard({ onEdit }: { onEdit: () => void }) {
  return (
    <div className="mx-auto max-w-2xl">
      <section className="rounded-lg border border-line bg-white p-6 text-center shadow-panel sm:p-8">
        <span className="mx-auto grid size-12 place-items-center rounded-md bg-pine text-white">
          <CheckCircle2 size={22} />
        </span>
        <p className="mt-5 text-xs font-black uppercase tracking-normal text-wood">Installation en cours</p>
        <h2 className="mt-2 text-2xl font-black text-ink">Vérification en cours.</h2>
        <p className="mx-auto mt-3 max-w-md text-sm font-semibold text-gray-700">
          WhatsApp ou email dès que c'est prêt. Délai : moins de 24h.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={onEdit} variant="secondary">Modifier mes infos</Button>
          <a
            className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white/70"
            href={NESTO_WHATSAPP_CONTACT_URL}
            rel="noreferrer"
            target="_blank"
          >
            Contacter l'équipe
          </a>
        </div>
      </section>
    </div>
  );
}

async function saveSingleStep(step: WizardStep, action: SaveAction) {
  const stepKey = step.key === "confirmation" ? "final_test" : step.key;

  return postInstallStep({
    stepKey,
    action,
    data: Object.fromEntries(step.fields.map((field) => [field.key, field.value]))
  });
}

async function postInstallStep(payload: { stepKey: string; action: SaveAction; data: Record<string, string> }) {
  const response = await fetch("/api/installation/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return response.json().catch(() => ({})) as Promise<{ persisted?: boolean; message?: string }>;
}

function buildSteps(data: InstallationData): WizardStep[] {
  return [
    {
      key: "whatsapp_prospect",
      title: "WhatsApp professionnel",
      description: "Numéro où vos prospects vous écrivent.",
      status: data.whatsappProspect.status,
      icon: MessageCircle,
      primaryLabel: "Continuer",
      fields: [
        { key: "businessPhone", label: "Numéro WhatsApp professionnel", value: data.whatsappProspect.phone, placeholder: "+689 ..." }
      ]
    },
    {
      key: "whatsapp_agent",
      title: "WhatsApp agent",
      description: "Pour recevoir les alertes Nesto.",
      status: data.whatsappAgent.status,
      icon: MessageCircle,
      primaryLabel: "Continuer",
      fields: [
        { key: "agentPhone", label: "Numéro WhatsApp personnel ou interne", value: data.whatsappAgent.phone || data.agency.phone, placeholder: "+689 ..." }
      ]
    },
    {
      key: "professional_email",
      title: "Email professionnel",
      description: "Email de réception des demandes.",
      status: data.professionalEmail.status,
      icon: Mail,
      primaryLabel: "Continuer",
      skipLabel: "Passer cette étape",
      fields: [
        { key: "email", label: "Email professionnel", value: data.professionalEmail.email || data.agency.email, placeholder: "agent@agence.fr", optional: true }
      ]
    },
    {
      key: "agency_website",
      title: "Site de l'agence",
      description: "URL de votre site agence.",
      status: data.website.status,
      icon: Building2,
      primaryLabel: "Continuer",
      fields: [
        { key: "websiteUrl", label: "URL du site agence", value: data.website.websiteUrl || data.agency.websiteUrl, placeholder: "https://votre-agence.fr" }
      ]
    },
    {
      key: "social_sources",
      title: "Réseaux sociaux",
      description: "Vos comptes où arrivent des demandes.",
      status: data.socialSources.status,
      icon: Share2,
      primaryLabel: "Continuer",
      skipLabel: "Passer cette étape",
      fields: [
        { key: "facebookMessenger", label: "Messenger / Facebook", value: data.socialSources.facebookMessenger, placeholder: "Page ou profil", optional: true },
        { key: "instagram", label: "Instagram", value: data.socialSources.instagram, placeholder: "@votrecompte", optional: true },
        { key: "tiktok", label: "TikTok", value: data.socialSources.tiktok, placeholder: "Sur demande", optional: true }
      ]
    },
    {
      key: "confirmation",
      title: "Confirmation",
      description: "Lancer la vérification par l'équipe.",
      status: data.steps.final_test ?? "todo",
      icon: CheckCircle2,
      primaryLabel: "Demander le test final",
      fields: []
    }
  ];
}

function firstOpenStepIndex(steps: WizardStep[]) {
  const index = steps.findIndex((step) => step.key !== "confirmation" && !isPassedStatus(step.status));
  return index >= 0 ? index : steps.length - 1;
}

function isPassedStatus(status: SimpleInstallStatus) {
  return status === "connected" || status === "skipped";
}

function statusLabel(status: SimpleInstallStatus) {
  const labels = {
    todo: "À faire",
    in_progress: "En cours",
    connected: "Reçu",
    needs_help: "Besoin d'aide",
    skipped: "Passé"
  };
  return labels[status];
}
