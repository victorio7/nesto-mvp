import { NextResponse } from "next/server";
import { getSimulatorMemoryState } from "@/lib/simulator/supabase-memory";

export async function GET() {
  const result = await getSimulatorMemoryState();
  return NextResponse.json(result);
}
