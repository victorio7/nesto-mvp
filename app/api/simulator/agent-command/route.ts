import { NextResponse } from "next/server";
import { persistSimulatorScenario } from "@/lib/simulator/supabase-memory";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const rawCommand = String(body.rawCommand ?? "1");
  const normalized = rawCommand.trim().toLowerCase();
  const scenario = ["2", "details", "détails"].includes(normalized) ? "agent_command_details" : "agent_command_validate";
  const result = await persistSimulatorScenario(scenario, rawCommand);
  return NextResponse.json(result);
}
