const MAX_TEXT_LENGTH = 5000;

export type ValidationResult<T> = {
  ok: true;
  value: T;
} | {
  ok: false;
  error: string;
};

export function sanitizeText(value: unknown, maxLength = MAX_TEXT_LENGTH) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeEmail(value: unknown) {
  const email = sanitizeText(value, 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "";
  return email;
}

export function validatePublicHttpUrl(value: unknown): ValidationResult<string> {
  const raw = sanitizeText(value, 2048);
  if (!raw) return { ok: false, error: "URL requise." };

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, error: "URL invalide." };
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return { ok: false, error: "Seules les URLs http et https sont autorisees." };
  }

  if (process.env.NODE_ENV === "production" && isLocalOrPrivateHost(url.hostname)) {
    return { ok: false, error: "Les URLs locales ou privees sont interdites en production." };
  }

  return { ok: true, value: url.toString() };
}

export function validateSignupInput(input: Record<string, unknown>) {
  const firstName = sanitizeText(input.firstName, 60);
  const lastName = sanitizeText(input.lastName, 60);
  const fullName = sanitizeText(input.fullName ?? input.name ?? `${firstName} ${lastName}`, 120);
  const email = sanitizeEmail(input.email);
  const phone = sanitizeText(input.phone ?? input.agentPhone, 80);
  const password = sanitizeText(input.password, 200);
  const confirmPassword = sanitizeText(input.confirmPassword, 200);
  const agencyName = sanitizeText(input.agencyName ?? input.agency, 160);

  if (!fullName) return { ok: false as const, error: "Nom requis." };
  if (!email) return { ok: false as const, error: "Email valide requis." };
  if (!phone) return { ok: false as const, error: "Numéro WhatsApp requis." };
  if (password.length < 8) return { ok: false as const, error: "Mot de passe de 8 caractères minimum requis." };
  if (password !== confirmPassword) return { ok: false as const, error: "Les mots de passe ne correspondent pas." };
  if (!agencyName) return { ok: false as const, error: "Nom d'agence requis." };

  return {
    ok: true as const,
    value: {
      fullName,
      email,
      phone,
      agencyName,
      websiteUrl: sanitizeText(input.websiteUrl ?? input.agencyWebsite, 2048)
    }
  };
}

function isLocalOrPrivateHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(host)) return true;
  if (host.endsWith(".local")) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  return false;
}
