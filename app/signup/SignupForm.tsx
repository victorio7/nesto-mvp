"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

const PINE = "#174f3f";
const PINE_DARK = "#0f3a2e";
const PINE_LIGHT = "#1f5f4f";
const GRAY_LIGHT = "#f3f4f6";
const GRAY_BORDER = "#e5e7eb";
const BG = "#faf9f7";

export function SignupForm() {
  const [form, setForm] = useState({
    email: "",
    phone: "",
    password: "",
    agencyName: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setError("");

    const v = {
      email: form.email.trim(),
      phone: form.phone.trim(),
      agencyName: form.agencyName.trim(),
      password: form.password,
    };

    if (!v.email || !v.phone || !v.agencyName || !v.password) {
      setError("Renseignez tous les champs obligatoires.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) {
      setError("Adresse email invalide.");
      return;
    }
    if (v.password.length < 8) {
      setError("Mot de passe : 8 caractères minimum.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...v,
          fullName: v.email.split("@")[0]
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Une erreur est survenue.");
        setLoading(false);
        return;
      }

      const data = await res.json().catch(() => null);
      if (!data?.ok) {
        setError(data?.error || "Une erreur est survenue.");
        setLoading(false);
        return;
      }

      window.location.href = "/installation?trial=active";

    } catch {
      setError("Connexion impossible. Réessayez.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: BG,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem"
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: 0,
        width: "100%",
        maxWidth: "1200px",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
        background: "white"
      }}>

        {/* Colonne gauche - Logo et messaging */}
        {!isMobile && (
          <div style={{
            padding: "4rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            background: BG,
            gap: "3rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{
                width: 48,
                height: 48,
                background: PINE,
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 700,
                fontSize: 22
              }}>
                N
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>Nesto</div>
                <div style={{ fontSize: 12, color: "#7a7a6e", marginTop: "2px" }}>Bras droit commercial</div>
              </div>
            </div>

            <div>
              <h1 style={{
                fontSize: 36,
                fontWeight: 700,
                color: "#111827",
                lineHeight: 1.3,
                margin: 0
              }}>
                L&apos;assistant qui ne laisse rien passer.
              </h1>
              <p style={{
                fontSize: 16,
                color: "#5a5a52",
                marginTop: "1.5rem",
                lineHeight: 1.6,
                margin: "1.5rem 0 0"
              }}>
                Nesto mémorise vos prospects, prépare vos relances et vous alerte au bon moment — depuis WhatsApp.
              </p>
            </div>
          </div>
        )}

        {/* Colonne droite - Formulaire */}
        <div style={{
          padding: isMobile ? "2.5rem 1.5rem" : "4rem 3rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center"
        }}>
          <div style={{ maxWidth: "100%", width: "100%" }}>
            {isMobile && (
              <div style={{ marginBottom: "2rem", textAlign: "center" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  marginBottom: "1.5rem"
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    background: PINE,
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 700,
                    fontSize: 18
                  }}>
                    N
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Nesto</div>
                </div>
              </div>
            )}

            <p style={{
              fontSize: 12,
              fontWeight: 600,
              color: PINE,
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              margin: "0 0 12px"
            }}>
              Créer mon espace
            </p>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#111827",
              margin: "0 0 8px"
            }}>
              Démarrer avec Nesto
            </h2>
            <p style={{
              fontSize: 15,
              color: "#7a7a6e",
              margin: "0 0 2rem"
            }}>
              4 champs. 2 minutes. C&apos;est parti.
            </p>

            <form onSubmit={handleSubmit} noValidate style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem"
            }}>
              <button
                type="button"
                style={{
                  height: "52px",
                  background: GRAY_LIGHT,
                  border: `1px solid ${GRAY_BORDER}`,
                  borderRadius: "12px",
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#111827",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e5e7eb";
                  e.currentTarget.style.borderColor = "#d1d5db";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = GRAY_LIGHT;
                  e.currentTarget.style.borderColor = GRAY_BORDER;
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <text x="2" y="18" fontSize="16" fontWeight="bold">G</text>
                </svg>
                Continuer avec Google
              </button>

              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                margin: "0.5rem 0"
              }}>
                <div style={{ flex: 1, height: "1px", background: GRAY_BORDER }} />
                <span style={{ fontSize: 12, color: "#9ca3af" }}>ou</span>
                <div style={{ flex: 1, height: "1px", background: GRAY_BORDER }} />
              </div>

              {[
                { label: "Email", key: "email", placeholder: "vous@agence.fr", type: "email" },
                { label: "Numéro WhatsApp", key: "phone", placeholder: "+689 XX XX XX", type: "tel" },
                { label: "Nom de l'agence", key: "agencyName", placeholder: "Votre agence", type: "text" },
                { label: "Mot de passe", key: "password", placeholder: "8 caractères min.", type: "password" },
              ].map(({ label, key, placeholder, type }) => (
                <label key={key} style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}>
                  <span style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151"
                  }}>
                    {label}
                  </span>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    style={{
                      height: "50px",
                      borderRadius: "12px",
                      border: `1px solid ${GRAY_BORDER}`,
                      padding: "0 14px",
                      fontSize: 14,
                      background: "#fafbfc",
                      outline: "none",
                      fontFamily: "inherit",
                      transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = PINE}
                    onBlur={(e) => e.currentTarget.style.borderColor = GRAY_BORDER}
                  />
                </label>
              ))}

              {error && (
                <p style={{
                  background: "#fef2f2",
                  border: "1px solid #fca5a5",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  fontSize: 13,
                  color: "#991b1b",
                  margin: 0
                }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  height: "52px",
                  background: loading ? PINE_LIGHT : PINE,
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                  marginTop: "0.5rem",
                  opacity: loading ? 0.8 : 1
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.background = PINE_DARK)}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.background = PINE)}
              >
                {loading ? "Création en cours…" : "Créer mon compte →"}
              </button>

              <p style={{
                textAlign: "center",
                fontSize: 13,
                color: "#7a7a6e",
                margin: "1.5rem 0 0"
              }}>
                Déjà inscrit ?{" "}
                <Link href="/login" style={{
                  color: PINE,
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "color 0.2s"
                }}>
                  Se connecter
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
