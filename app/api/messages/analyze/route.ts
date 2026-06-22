import { NextResponse } from "next/server";
import { analyzeProspectMessageWithAI } from "@/lib/ai/prospect-analyzer";
import { demoAgency } from "@/lib/demo-data";

export async function POST(request: Request) {
  const body = await request.json();
  const rawMessage = String(body.rawMessage ?? "");

  if (!rawMessage.trim()) {
    return NextResponse.json({ error: "rawMessage is required" }, { status: 400 });
  }

  const analysis = await analyzeProspectMessageWithAI(rawMessage, `Agence: ${demoAgency.name}`);
  return NextResponse.json(analysis);
}
