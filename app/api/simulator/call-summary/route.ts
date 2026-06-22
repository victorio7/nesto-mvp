import { NextResponse } from "next/server";
import { persistSimulatorScenario } from "@/lib/simulator/supabase-memory";

export async function POST() {
  const result = await persistSimulatorScenario("call_summary");
  return NextResponse.json(result);
}
