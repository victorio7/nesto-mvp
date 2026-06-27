import type { SupabaseClient } from "@supabase/supabase-js";

export type MessageChannel = "whatsapp" | "messenger" | "email" | "instagram";
export type MessageDirection = "inbound" | "outbound";
export type MessageStatus = "received" | "processed" | "replied" | "archived";

export interface StoredMessage {
  id: string;
  channel: MessageChannel;
  external_id?: string;
  direction: MessageDirection;
  sender_phone?: string;
  sender_id?: string;
  sender_email?: string;
  content: string;
  subject?: string;
  agency_id: string;
  agent_id?: string;
  timestamp: string;
  status: MessageStatus;
  raw_data?: Record<string, unknown>;
}

export async function storeMessage(
  supabase: SupabaseClient,
  message: Omit<StoredMessage, "id" | "timestamp" | "created_at" | "updated_at">
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        ...message,
        timestamp: new Date().toISOString()
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error storing message:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error("Message storage exception:", error);
    return { success: false, error: String(error) };
  }
}

export async function getUnprocessedMessages(
  supabase: SupabaseClient,
  agencyId: string,
  channel?: MessageChannel
): Promise<StoredMessage[]> {
  try {
    let query = supabase
      .from("messages")
      .select("*")
      .eq("agency_id", agencyId)
      .eq("status", "received")
      .neq("status", "archived")
      .order("timestamp", { ascending: false })
      .limit(100);

    if (channel) {
      query = query.eq("channel", channel);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching unprocessed messages:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Message fetch exception:", error);
    return [];
  }
}

export async function updateMessageStatus(
  supabase: SupabaseClient,
  messageId: string,
  status: MessageStatus,
  agentId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: Record<string, unknown> = {
      status,
      processed_at: new Date().toISOString()
    };

    if (agentId) {
      updateData.agent_id = agentId;
    }

    const { error } = await supabase
      .from("messages")
      .update(updateData)
      .eq("id", messageId);

    if (error) {
      console.error("Error updating message status:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Message update exception:", error);
    return { success: false, error: String(error) };
  }
}

export async function getMessagesByChannel(
  supabase: SupabaseClient,
  agencyId: string,
  channel: MessageChannel
): Promise<StoredMessage[]> {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("agency_id", agencyId)
      .eq("channel", channel)
      .order("timestamp", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching messages by channel:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Message fetch exception:", error);
    return [];
  }
}
