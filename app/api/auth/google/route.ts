import { NextResponse } from "next/server";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseAdminClientOrNull();
    if (!supabase) {
      return NextResponse.json(
        { error: "Configuration indisponible" },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${baseUrl}/auth/callback?next=/onboarding`,
      },
    });

    if (error || !data?.url) {
      console.error("Google OAuth error:", error);
      return NextResponse.json(
        { error: "Impossible de configurer Google Auth" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.url });
  } catch (error) {
    console.error("Google auth route error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la configuration Google" },
      { status: 500 }
    );
  }
}
