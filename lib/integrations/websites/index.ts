import { parsePropertyWithAI } from "@/lib/ai/property-parser";
import type { PropertySource } from "@/lib/types";

export type AgencyWebsiteSourceTestResult = {
  status: "source_valid" | "listings_detected" | "no_listing_detected" | "error";
  message: string;
  detected_count: number;
  sample_urls: string[];
};

export async function fetchWebsiteListings(sourceUrl: string) {
  return {
    sourceUrl,
    links: [] as string[],
    simulated: true
  };
}

export function detectNewListingLinks(previousLinks: string[], currentLinks: string[]) {
  const previous = new Set(previousLinks);
  return currentLinks.filter((link) => !previous.has(link));
}

export async function extractListingContent(url: string) {
  return {
    url,
    rawContent: "",
    simulated: true
  };
}

export async function checkPropertySource(source: PropertySource) {
  const listings = await fetchWebsiteListings(source.source_url);
  return {
    source_id: source.id,
    status: "success" as const,
    checked_at: new Date().toISOString(),
    detected_count: listings.links.length,
    error_message: null
  };
}

export async function parseListingToProperty(rawContent: string, sourceUrl: string) {
  return parsePropertyWithAI(rawContent, sourceUrl);
}

export function detectPropertyChanges(
  previous: Record<string, unknown>,
  next: Record<string, unknown>
) {
  return Object.keys(next)
    .filter((key) => previous[key] !== next[key])
    .map((key) => ({
      field: key,
      old_value: previous[key],
      new_value: next[key]
    }));
}

export async function testAgencyWebsiteSource(sourceUrl: string): Promise<AgencyWebsiteSourceTestResult> {
  if (!sourceUrl.trim()) {
    return {
      status: "error",
      message: "URL manquante.",
      detected_count: 0,
      sample_urls: []
    };
  }

  try {
    const parsedUrl = new URL(sourceUrl);
    const likelyListingPage = /location|vente|bien|annonce|property|real-estate/i.test(parsedUrl.pathname);
    const samples = likelyListingPage ? [sourceUrl] : [];

    return {
      status: likelyListingPage ? "listings_detected" : "source_valid",
      message: likelyListingPage
        ? "Source valide : des annonces semblent presentes sur cette page."
        : "Source valide : aucune annonce detectee dans la simulation V1.",
      detected_count: samples.length,
      sample_urls: samples
    };
  } catch {
    return {
      status: "error",
      message: "URL invalide ou inaccessible.",
      detected_count: 0,
      sample_urls: []
    };
  }
}
