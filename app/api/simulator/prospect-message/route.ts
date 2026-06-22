import { NextResponse } from "next/server";
import { persistSimulatorScenario } from "@/lib/simulator/supabase-memory";

export async function POST() {
  const result = await persistSimulatorScenario("prospect_message");
  return NextResponse.json(result);
}
