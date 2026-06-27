"use client";

import { useState } from "react";
import { ArrowRight, MessageCircle, Mail, Building2, Facebook, Instagram } from "lucide-react";
import Link from "next/link";

type Step = "whatsapp_pro" | "whatsapp_personal" | "email_website" | "facebook" | "instagram";

const STEPS: { key: Step; title: string; icon: typeof MessageCircle; required: boolean }[] = [
  { key: "whatsapp_pro", title: "WhatsApp professionnel", icon: MessageCircle, required: true },
  { key: "whatsapp_personal", title: "WhatsApp personnel", icon: MessageCircle, required: true },
  { key: "email_website", title: "Email & Site agence", icon: Mail, required: true },
  { key: "facebook", title: "Facebook / Messenger", icon: Facebook, required: false },
  { key: "instagram", title: "Instagram", icon: Instagram, required: false },
];

export function OnboardingClient() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [values, setValues] = useState({
    whatsapp_pro: "",
    whatsapp_personal: "",
    email: "",
    website: "",
    facebook: "",
    instagram: "",
  });
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);

  const currentStep = STEPS[currentIndex];
  const progress = ((currentIndex + 1) / STEPS.length) * 100;
  const isLastStep = currentIndex === STEPS.length - 1;
  const isOptional = !currentStep.required;

  const handleNext = async () => {
    if (currentIndex < STEPS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    if (isOptional && currentIndex < STEPS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await fetch("/api/onboarding/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingData: values }),
      });
      setCompleted(true);
      setTimeout(() => {
        window.location.href = "/installation?trial=active";
      }, 2000);
    } catch {
      setSaving(false);
    }
  };

  if (completed) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#faf9f7"
      }}>
        <div style={{
          textAlign: "center",
          padding: "2rem"
        }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", margin: 0 }}>
            Parfait ! Bienvenue dans Clapy.
          </h1>
          <p style={{
            fontSize: 14,
            color: "#7a7a6e",
            marginTop: "1rem"
          }}>
            Vous allez être redirigé vers votre espace...
          </p>
        </div>
      </div>
    );
  }

  const CurrentIcon = currentStep.icon;

  return (
    <main style={{
      minHeight: "100vh",
      background: "#faf9f7",
      padding: "2rem 1rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "600px",
        background: "white",
        borderRadius: "16px",
        padding: "3rem 2rem",
        boxShadow: "0 20px 60px rgba(0,0,0,0.08)"
      }}>
        {/* Progress Bar */}
        <div style={{ marginBottom: "3rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#8a623f", margin: 0 }}>
              Étape {currentIndex + 1} sur {STEPS.length}
            </p>
            <p style={{
              fontSize: 12,
              fontWeight: 600,
              color: currentStep.required ? "#174f3f" : "#7a7a6e",
              margin: 0
            }}>
              {currentStep.required ? "Obligatoire" : "Optionnel"}
            </p>
          </div>
          <div style={{
            height: "6px",
            background: "#e5e7eb",
            borderRadius: "3px",
            overflow: "hidden"
          }}>
            <div style={{
              height: "100%",
              background: "#174f3f",
              width: `${progress}%`,
              transition: "width 0.3s ease"
            }} />
          </div>
        </div>

        {/* Content */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{
              width: 44,
              height: 44,
              background: "#edf7f1",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#174f3f"
            }}>
              <CurrentIcon size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
                {currentStep.title}
              </h2>
            </div>
          </div>

          {/* Step-specific description and input */}
          <div style={{
            background: "#faf9f7",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "1.5rem"
          }}>
            {currentStep.key === "whatsapp_pro" && (
              <>
                <p style={{ fontSize: 14, color: "#5a5a52", margin: "0 0 1rem" }}>
                  Le numéro où vos clients vous écrivent pour demander des informations.
                </p>
                <input
                  type="tel"
                  placeholder="+689 XX XX XX"
                  value={values.whatsapp_pro}
                  onChange={(e) => setValues({ ...values, whatsapp_pro: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    fontSize: 14,
                    fontFamily: "inherit",
                    boxSizing: "border-box"
                  }}
                />
              </>
            )}

            {currentStep.key === "whatsapp_personal" && (
              <>
                <p style={{ fontSize: 14, color: "#5a5a52", margin: "0 0 1rem" }}>
                  Votre numéro personnel pour recevoir les alertes de Clapy.
                </p>
                <input
                  type="tel"
                  placeholder="+689 XX XX XX"
                  value={values.whatsapp_personal}
                  onChange={(e) => setValues({ ...values, whatsapp_personal: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    fontSize: 14,
                    fontFamily: "inherit",
                    boxSizing: "border-box"
                  }}
                />
              </>
            )}

            {currentStep.key === "email_website" && (
              <>
                <p style={{ fontSize: 14, color: "#5a5a52", margin: "0 0 1.5rem" }}>
                  Votre email professionnel et le site de votre agence.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <input
                    type="email"
                    placeholder="agent@agence.fr"
                    value={values.email}
                    onChange={(e) => setValues({ ...values, email: e.target.value })}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: "1px solid #e5e7eb",
                      fontSize: 14,
                      fontFamily: "inherit",
                      boxSizing: "border-box"
                    }}
                  />
                  <input
                    type="url"
                    placeholder="https://votre-agence.fr"
                    value={values.website}
                    onChange={(e) => setValues({ ...values, website: e.target.value })}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: "1px solid #e5e7eb",
                      fontSize: 14,
                      fontFamily: "inherit",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </>
            )}

            {currentStep.key === "facebook" && (
              <>
                <p style={{ fontSize: 14, color: "#5a5a52", margin: "0 0 1rem" }}>
                  Votre page Facebook ou compte Messenger (optionnel).
                </p>
                <input
                  type="text"
                  placeholder="facebook.com/votreagence"
                  value={values.facebook}
                  onChange={(e) => setValues({ ...values, facebook: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    fontSize: 14,
                    fontFamily: "inherit",
                    boxSizing: "border-box"
                  }}
                />
              </>
            )}

            {currentStep.key === "instagram" && (
              <>
                <p style={{ fontSize: 14, color: "#5a5a52", margin: "0 0 1rem" }}>
                  Votre compte Instagram (optionnel).
                </p>
                <input
                  type="text"
                  placeholder="@votreagence"
                  value={values.instagram}
                  onChange={(e) => setValues({ ...values, instagram: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    fontSize: 14,
                    fontFamily: "inherit",
                    boxSizing: "border-box"
                  }}
                />
              </>
            )}
          </div>

          {/* Encouraging message */}
          <p style={{
            fontSize: 13,
            color: "#7a7a6e",
            margin: 0,
            fontStyle: "italic"
          }}>
            💡 {currentIndex === 0 ? "Commençons par l'essentiel." : "Vous êtes presque là !"}
          </p>
        </div>

        {/* Buttons */}
        <div style={{
          display: "flex",
          gap: "1rem",
          flexDirection: "column"
        }}>
          <button
            onClick={handleNext}
            disabled={saving}
            style={{
              padding: "12px 16px",
              background: "#174f3f",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s",
              opacity: saving ? 0.8 : 1
            }}
            onMouseEnter={(e) => !saving && (e.currentTarget.style.background = "#0f3a2e")}
            onMouseLeave={(e) => !saving && (e.currentTarget.style.background = "#174f3f")}
          >
            {isLastStep ? (
              <>
                {saving ? "Finalisation…" : "Finaliser"}
              </>
            ) : (
              <>
                Continuer <ArrowRight size={16} />
              </>
            )}
          </button>

          {isOptional && (
            <button
              onClick={handleSkip}
              disabled={saving}
              style={{
                padding: "12px 16px",
                background: "white",
                color: "#174f3f",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s"
              }}
            >
              Passer cette étape
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
