import { NextResponse } from "next/server";
import { persistSimulatorScenario } from "@/lib/simulator/supabase-memory";
import type { SimulatorScenario } from "@/lib/prototype/whatsapp-simulator";

export async function POST(request: Request) {
  const body = await request.json();
  const scenario = String(body.scenario ?? "") as SimulatorScenario;
  const rawCommand = String(body.rawCommand ?? "1");

  return NextResponse.json(await persistSimulatorScenario(scenario, rawCommand));
}
