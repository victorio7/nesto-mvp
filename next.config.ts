import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep `next dev` isolated from `next build`: both commands may run during
  // MVP verification and must never overwrite each other's Webpack output.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  typedRoutes: false,
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : "https://*.supabase.co";
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      `connect-src 'self' ${supabaseOrigin} https://*.supabase.co https://api.stripe.com https://checkout.stripe.com http://127.0.0.1:* http://localhost:*`,
      "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "form-action 'self' https://checkout.stripe.com",
      "upgrade-insecure-requests"
    ].join("; ");

    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.stripe.com\")"
      }
    ];

    return [
      {
        source: "/(.*)",
        headers: isDev ? securityHeaders : [...securityHeaders, { key: "Content-Security-Policy", value: csp }]
      }
    ];
  }
};

export default nextConfig;
