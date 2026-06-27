import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createSupabaseAdminClientOrNull();

    if (!supabase) {
      console.error("Supabase not configured");
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    // Verify webhook signature
    const xHubSignature = request.headers.get("x-hub-signature-256");
    if (!verifyWebhookSignature(body, xHubSignature)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Signature validation failed" }, { status: 403 });
    }

    // Handle Meta Messenger webhook
    if (body.object === "page") {
      const pageEntries = body.entry || [];

      for (const entry of pageEntries) {
        const messagingEvents = entry.messaging || [];

        for (const event of messagingEvents) {
          // Handle incoming messages
          if (event.message && !event.message.is_echo) {
            const senderId = event.sender.id;
            const messageText = event.message.text || "";
            const messageId = event.message.mid;
            const recipientId = event.recipient.id;

            // Find agency by Meta page ID
            const agencyResult = await supabase
              .from("agencies")
              .select("id, name")
              .eq("meta_page_id", recipientId)
              .limit(1)
              .single();

            const agency = agencyResult.data;

            if (!agency) {
              console.log("No agency found for Meta page:", recipientId);
              continue;
            }

            // Store message in database
            const { error: insertError } = await supabase.from("messages").insert({
              channel: "messenger",
              external_id: messageId,
              sender_id: senderId,
              content: messageText,
              timestamp: new Date().toISOString(),
              agency_id: agency.id,
              direction: "inbound",
              raw_data: event
            });

            if (insertError) {
              console.error("Error storing Messenger message:", insertError);
              continue;
            }

            console.log("Messenger message stored:", {
              from: senderId,
              content: messageText,
              timestamp: new Date().toISOString()
            });
          }

          // Handle delivery confirmation
          if (event.delivery) {
            console.log("Message delivery confirmed:", event.delivery.mids);
          }

          // Handle read receipt
          if (event.read) {
            console.log("Message read:", event.read.watermark);
          }
        }
      }

      return NextResponse.json({ success: true, message: "Messenger webhook processed" });
    }

    return NextResponse.json({ error: "Invalid webhook format" }, { status: 400 });
  } catch (error) {
    console.error("Messenger webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Meta webhook verification
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const verifyToken = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  const expectedToken = process.env.META_VERIFY_TOKEN || "";

  if (mode === "subscribe" && verifyToken === expectedToken) {
    console.log("Messenger webhook verified");
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Invalid verify token" }, { status: 403 });
}

function verifyWebhookSignature(
  body: unknown,
  xHubSignature: string | null
): boolean {
  if (!xHubSignature) return false;

  const appSecret = process.env.META_APP_SECRET || "";
  if (!appSecret) return false;

  const bodyString = JSON.stringify(body);
  const hash = crypto
    .createHmac("sha256", appSecret)
    .update(bodyString)
    .digest("hex");

  const expectedSignature = `sha256=${hash}`;
  return expectedSignature === xHubSignature;
}
