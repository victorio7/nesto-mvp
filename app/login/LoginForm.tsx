"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export function LoginForm({ nextPath = "/dashboard" }: { nextPath?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setError("");
    if (!email.trim() || !password) {
      setError("Renseignez votre email et votre mot de passe.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/demo-login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const payload = await response.json().catch(() => null) as { error?: string; ok?: boolean } | null;

      if (!response.ok || !payload?.ok) {
        setError(payload?.error ?? "Connexion impossible. Vérifiez vos informations.");
        setLoading(false);
        return;
      }

      window.location.href = nextPath;
    } catch (loginError) {
      console.error("Nesto login request failed", loginError);
      setError("Connexion impossible pour le moment. Réessayez dans un instant.");
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" noValidate onSubmit={login}>
      <label className="block text-sm font-bold">
        Email
        <input
          className="mt-2 w-full rounded-md border border-line px-3 py-2 focus-ring"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="agent@agence.fr"
          required
          type="email"
          value={email}
        />
      </label>
      <label className="block text-sm font-bold">
        Mot de passe
        <input
          autoComplete="current-password"
          className="mt-2 w-full rounded-md border border-line px-3 py-2 focus-ring"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Votre mot de passe"
          required
          type="password"
          value={password}
        />
      </label>
      {error ? (
        <p className="rounded-md border border-[#fecaca] bg-[#fef2f2] p-3 text-sm font-semibold text-[#991b1b]" role="alert">
          {error}
        </p>
      ) : null}
      <button
        className="focus-ring inline-flex min-h-10 w-full items-center justify-center rounded-md bg-pine px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#123f32]"
        disabled={loading}
        type="submit"
      >
        {loading ? "Connexion…" : "Entrer dans mon espace Nesto"}
      </button>
      <p className="text-center text-sm text-gray-600">
        Pas encore de compte ? <Link className="font-bold text-pine" href="/signup">Créer mon compte</Link>
      </p>
    </form>
  );
}
