"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export function SignupForm() {
  const [form, setForm] = useState({
    email: "",
    phone: "",
    password: "",
    agencyName: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
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
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "100vh", background: "#f7f5ef" }}>

      {/* Gauche */}
      <div style={{ padding: "3rem 2.5rem", display: "flex", flexDirection: "column", justifyContent: "center", gap: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: 44, height: 44, background: "#10b981", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 20 }}>N</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: "#1a1a1a" }}>Nesto</div>
            <div style={{ fontSize: 12, color: "#7a7a6e" }}>Votre bras droit commercial</div>
          </div>
        </div>

        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2, margin: 0 }}>
            L&apos;assistant qui ne laisse rien passer.
          </h1>
          <p style={{ fontSize: 15, color: "#5a5a52", marginTop: 14, lineHeight: 1.6 }}>
            Nesto mémorise vos prospects, prépare vos relances et vous alerte au bon moment — depuis WhatsApp.
          </p>
        </div>

      </div>

      {/* Droite */}
      <div style={{ background: "white", display: "flex", flexDirection: "column", justifyContent: "center", padding: "2.5rem 3rem" }}>
        <div style={{ maxWidth: 420, width: "100%" }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.8px", margin: "0 0 8px" }}>Créer mon espace</p>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1a", margin: "0 0 6px" }}>Démarrer avec Nesto</h2>
          <p style={{ fontSize: 14, color: "#7a7a6e", margin: "0 0 28px" }}>4 champs. 2 minutes. C&apos;est parti.</p>

          <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <button
              type="button"
              style={{
                height: 50,
                background: "#f3f4f6",
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                fontSize: 15,
                fontWeight: 500,
                color: "#1a1a1a",
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
                e.currentTarget.style.background = "#f3f4f6";
                e.currentTarget.style.borderColor = "#e5e7eb";
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <text x="2" y="18" fontSize="16" fontWeight="bold">G</text>
              </svg>
              Continuer avec Google
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0" }}>
              <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
              <span style={{ fontSize: 12, color: "#9ca3af" }}>ou</span>
              <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
            </div>

            {[
              { label: "Email", key: "email", placeholder: "vous@agence.fr", type: "email" },
              { label: "Numéro WhatsApp", key: "phone", placeholder: "+689 XX XX XX", type: "tel" },
              { label: "Nom de l'agence", key: "agencyName", placeholder: "Votre agence", type: "text" },
              { label: "Mot de passe", key: "password", placeholder: "8 caractères min.", type: "password" },
            ].map(({ label, key, placeholder, type }) => (
              <label key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{label}</span>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  style={{ height: 48, borderRadius: 12, border: "1px solid #e5e7eb", padding: "0 14px", fontSize: 14, background: "#f9fafb", outline: "none", fontFamily: "inherit", transition: "border-color 0.2s" }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#10b981"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
                />
              </label>
            ))}

            {error && (
              <p style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "#991b1b", margin: 0 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                height: 50,
                background: loading ? "#6ee7b7" : "#10b981",
                color: "white",
                border: "none",
                borderRadius: 16,
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s",
                marginTop: 4
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "#059669")}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "#10b981")}
            >
              {loading ? "Création en cours…" : "Créer mon compte →"}
            </button>

            <p style={{ textAlign: "center", fontSize: 13, color: "#7a7a6e", margin: "16px 0 0" }}>
              Déjà inscrit ?{" "}
              <Link href="/login" style={{ color: "#10b981", fontWeight: 600, textDecoration: "none" }}>Se connecter</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
