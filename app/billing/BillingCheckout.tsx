"use client";

import { useState } from "react";

export function BillingCheckout() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function startCheckout() {
    setLoading(true);
    const response = await fetch("/api/billing/checkout", { method: "POST" });
    const session = await response.json();
    setMessage(
      session.mode === "simulated"
        ? "Mois gratuit active en mode MVP. Vous pouvez continuer l'installation accompagnee."
        : "Session Stripe preparee."
    );
    window.location.href = session.url;
  }

  return (
    <div>
      <button
        className="focus-ring inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-pine px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#123f32] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={loading}
        onClick={startCheckout}
        type="button"
      >
        {loading ? "Preparation..." : "Activer mon mois gratuit"}
      </button>
      <a
        className="focus-ring mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-ink ring-1 ring-line transition hover:bg-[#fbfaf7]"
        href="/installation?payment=simulated"
      >
        Continuer en mode test
      </a>
      {message ? <p className="mt-3 text-sm font-semibold text-pine">{message}</p> : null}
    </div>
  );
}
