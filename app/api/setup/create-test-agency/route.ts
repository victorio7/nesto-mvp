import { NextResponse } from "next/server";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = createSupabaseAdminClientOrNull();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("agencies")
      .insert({
        name: "Clapy Test",
      })
      .select("id, name")
      .single();

    if (error) {
      console.error("Error creating agency:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log("✅ Test agency created:", data);

    return NextResponse.json({
      success: true,
      agency: data,
      message: "Test agency created successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to create agency" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to create test agency",
  });
}
