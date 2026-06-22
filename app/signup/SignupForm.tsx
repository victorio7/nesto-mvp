"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export function SignupForm() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agencyName: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setError("");

    const values = {
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      agencyName: form.agencyName.trim()
    };

    if (!values.firstName || !values.lastName || !values.email || !values.phone || !values.agencyName) {
      setError("Renseignez les champs obligatoires pour créer votre espace.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      setError("Saisissez une adresse email valide.");
      return;
    }

    if (values.password !== values.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (values.password.length < 8) {
      setError("Choisissez un mot de passe d'au moins 8 caractères.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          fullName: `${values.firstName} ${values.lastName}`.trim()
        })
      });
      const payload = await response.json().catch(() => null) as {
        error?: string;
        ok?: boolean;
        redirectTo?: string;
        success?: boolean;
      } | null;

      if (!response.ok || (!payload?.ok && !payload?.success)) {
        console.error("Nesto signup failed", {
          status: response.status,
          error: payload?.error ?? "Invalid API response"
        });
        setError("Une erreur est survenue. Vérifiez vos informations ou contactez l’équipe Nesto.");
        setLoading(false);
        return;
      }

      window.location.href = payload.redirectTo || "/installation?trial=active";
    } catch (signupError) {
      console.error("Nesto signup request failed", signupError);
      setError("Une erreur est survenue. Vérifiez vos informations ou contactez l’équipe Nesto.");
      setLoading(false);
    }
  }

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      noValidate
      onSubmit={submit}
    >
      <label className="block text-sm font-bold">
        Prenom
        <input
          className="mt-2 w-full rounded-md border border-line px-3 py-2 focus-ring"
          onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
          placeholder="Marie"
          required
          value={form.firstName}
        />
      </label>
      <label className="block text-sm font-bold">
        Nom
        <input
          className="mt-2 w-full rounded-md border border-line px-3 py-2 focus-ring"
          onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
          placeholder="Dupont"
          required
          value={form.lastName}
        />
      </label>
      <label className="block text-sm font-bold">
        Email
        <input
          className="mt-2 w-full rounded-md border border-line px-3 py-2 focus-ring"
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          placeholder="vous@agence.fr"
          required
          type="email"
          value={form.email}
        />
      </label>
      <label className="block text-sm font-bold">
        Numero WhatsApp
        <input
          className="mt-2 w-full rounded-md border border-line px-3 py-2 focus-ring"
          onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
          placeholder="+689..."
          required
          type="tel"
          value={form.phone}
        />
      </label>
      <label className="block text-sm font-bold">
        Mot de passe
        <input
          className="mt-2 w-full rounded-md border border-line px-3 py-2 focus-ring"
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          placeholder="Minimum 8 caracteres"
          required
          type="password"
          value={form.password}
        />
      </label>
      <label className="block text-sm font-bold">
        Confirmer le mot de passe
        <input
          className="mt-2 w-full rounded-md border border-line px-3 py-2 focus-ring"
          onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
          placeholder="Retapez votre mot de passe"
          required
          type="password"
          value={form.confirmPassword}
        />
      </label>
      <label className="block text-sm font-bold">
        Nom agence
        <input
          className="mt-2 w-full rounded-md border border-line px-3 py-2 focus-ring"
          onChange={(event) => setForm((current) => ({ ...current, agencyName: event.target.value }))}
          placeholder="Nom de votre agence"
          required
          value={form.agencyName}
        />
      </label>
      <div className="rounded-md border border-wood/25 bg-[#fffaf0] p-4 text-sm leading-6 text-gray-700 sm:col-span-2">
        <p className="font-black text-ink">Offre de lancement — 100 premiers agents</p>
        <p className="mt-1 font-black text-pine">1 mois gratuit</p>
        <p className="mt-1">Puis 99 €/mois, sans engagement.</p>
        <p className="mt-1 font-black text-pine">
          Votre mois gratuit commence lorsque Nesto est installé et prêt à être testé avec vous.
        </p>
        <p className="mt-2 rounded-md border border-line bg-white p-3 font-semibold text-gray-700">
          Pendant le MVP, aucun paiement n’est demandé. En production, la carte bancaire sera enregistrée pour activer l’essai gratuit.
        </p>
      </div>
      {error ? (
        <p className="rounded-md border border-[#fecaca] bg-[#fef2f2] p-3 text-sm font-semibold text-[#991b1b] sm:col-span-2" role="alert">
          {error}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <button
          className="focus-ring inline-flex min-h-10 w-full items-center justify-center rounded-md bg-pine px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#123f32]"
          disabled={loading}
          type="submit"
        >
          {loading ? "Création de votre espace…" : "Créer mon compte et continuer"}
        </button>
        <p className="mt-3 text-center text-xs font-semibold leading-5 text-gray-500">
          Deja inscrit ? <Link className="font-black text-pine" href="/login">Se connecter</Link>
        </p>
      </div>
    </form>
  );
}
