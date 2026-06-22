"use client";

import Link from "next/link";
import { useState } from "react";

export function LoginForm({ nextPath = "/dashboard" }: { nextPath?: string }) {
  const [email, setEmail] = useState("marie@nextimmo.pf");
  const [loading, setLoading] = useState(false);

  async function login() {
    setLoading(true);
    await fetch("/api/auth/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    window.location.href = nextPath;
  }

  return (
    <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
      <div className="rounded-md border border-wood/25 bg-[#fffaf0] p-3 text-sm font-semibold leading-6 text-gray-700">
        <p className="font-black text-ink">Mode demo : entrez l'email du compte test.</p>
        <p className="mt-1">Le mot de passe n'est pas verifie pendant le MVP local.</p>
      </div>
      <label className="block text-sm font-bold">
        Email
        <input
          className="mt-2 w-full rounded-md border border-line px-3 py-2 focus-ring"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="agent@agence.fr"
          type="email"
          value={email}
        />
      </label>
      <label className="block text-sm font-bold">
        Mot de passe <span className="font-semibold text-gray-500">(mode demo)</span>
        <input className="mt-2 w-full rounded-md border border-line px-3 py-2 focus-ring" placeholder="Laissez vide ou saisissez un texte" type="password" />
      </label>
      <button
        className="focus-ring inline-flex min-h-10 w-full items-center justify-center rounded-md bg-pine px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#123f32]"
        disabled={loading}
        onClick={login}
        type="button"
      >
        {loading ? "Connexion..." : "Entrer dans l'espace securise"}
      </button>
      <p className="text-center text-sm text-gray-600">
        Pas encore de compte ? <Link className="font-bold text-pine" href="/signup">Demander une demo</Link>
      </p>
    </form>
  );
}
