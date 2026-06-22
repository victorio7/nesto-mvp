import { NextResponse } from "next/server";
import { persistSimulatorScenario } from "@/lib/simulator/supabase-memory";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const source = String(body.source ?? "colleague");
  const scenario = source === "personal" ? "new_property_personal" : "new_property_colleague";
  const result = await persistSimulatorScenario(scenario);
  return NextResponse.json(result);
}
