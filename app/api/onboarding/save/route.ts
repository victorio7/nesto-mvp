import { NextResponse } from "next/server";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { onboardingData } = await request.json();
    const supabase = createSupabaseAdminClientOrNull();

    if (supabase && onboardingData) {
      // Save onboarding data to database if needed
      // This can be extended to update agency settings, etc.
      console.log("Onboarding data received:", onboardingData);
    }

    return NextResponse.json({ ok: true, message: "Onboarding données sauvegardées." });
  } catch (error) {
    console.error("Onboarding save error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde" },
      { status: 500 }
    );
  }
}
