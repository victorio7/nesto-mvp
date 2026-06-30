import { NextResponse } from "next/server";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createSupabaseAdminClientOrNull();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  try {
    // Check agencies
    const { data: agencies, error: agenciesError } = await supabase
      .from("agencies")
      .select("id, name")
      .limit(5);

    // Check messages
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("id, direction, sender_type, raw_content")
      .order("created_at", { ascending: false })
      .limit(10);

    // Check contacts
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("id, phone, source_channel")
      .order("created_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      status: "ok",
      agencies: {
        count: agencies?.length || 0,
        data: agencies,
        error: agenciesError?.message,
      },
      messages: {
        count: messages?.length || 0,
        data: messages?.map((m) => ({
          id: m.id,
          direction: m.direction,
          sender_type: m.sender_type,
          preview: m.raw_content?.substring(0, 50),
        })),
        error: messagesError?.message,
      },
      contacts: {
        count: contacts?.length || 0,
        data: contacts,
        error: contactsError?.message,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
