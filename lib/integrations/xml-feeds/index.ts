import type { PropertySource } from "@/lib/types";

export async function fetchXmlFeed(source: PropertySource) {
  return {
    source_id: source.id,
    listings: [],
    simulated: true
  };
}
