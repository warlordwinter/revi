import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";

// Tone adjectives - describes the overall tone of the content
const TONE_ADJECTIVES = [
  "professional",
  "friendly",
  "formal",
  "casual",
  "modern",
  "traditional",
  "warm",
  "welcoming",
  "serious",
  "playful",
  "humorous",
  "authoritative",
  "conversational",
  "technical",
  "academic",
  "approachable",
  "engaging",
];

// Quality adjectives - describes the quality or standard
const QUALITY_ADJECTIVES = [
  "reliable",
  "trusted",
  "expert",
  "innovative",
  "quality",
  "excellent",
  "outstanding",
  "superior",
  "premium",
  "high-quality",
  "first-class",
  "top-tier",
  "exceptional",
  "unparalleled",
  "unmatched",
  "superior",
  "world-class",
  "award-winning",
  "certified",
  "accredited",
];

// Style adjectives - describes the style or approach
const STYLE_ADJECTIVES = [
  "modern",
  "traditional",
  "premium",
  "luxury",
  "affordable",
  "budget",
  "contemporary",
  "classic",
  "elegant",
  "sophisticated",
  "minimalist",
  "cutting-edge",
  "avant-garde",
  "trendy",
  "timeless",
  "innovative",
  "revolutionary",
  "groundbreaking",
  "pioneering",
];

// Value adjectives - describes the value proposition
const VALUE_ADJECTIVES = [
  "affordable",
  "cost-effective",
  "budget-friendly",
  "premium",
  "luxury",
  "exclusive",
  "high-end",
  "economical",
  "reasonable",
  "competitive",
  "value-driven",
  "cost-efficient",
  "budget-conscious",
  "premium-priced",
];

// Experience adjectives - describes the user experience
const EXPERIENCE_ADJECTIVES = [
  "seamless",
  "intuitive",
  "user-friendly",
  "convenient",
  "efficient",
  "streamlined",
  "smooth",
  "effortless",
  "simple",
  "straightforward",
  "accessible",
  "responsive",
  "interactive",
  "engaging",
  "immersive",
];

// All adjectives combined
const ALL_ADJECTIVES = [
  ...TONE_ADJECTIVES,
  ...QUALITY_ADJECTIVES,
  ...STYLE_ADJECTIVES,
  ...VALUE_ADJECTIVES,
  ...EXPERIENCE_ADJECTIVES,
];

interface ScrapeRequest {
  url: string;
}

interface ScrapeResponse {
  title: string;
  meta_description: string | null;
  main_content: string;
  adjectives: string[];
  descriptive_phrases: string[];
  tone: string[];
  key_qualities: string[];
  content_style: string[];
  value_proposition: string[];
  user_experience: string[];
  synonyms: Record<string, string[]>;
}

// Function to get synonyms from Datamuse API
async function getSynonyms(word: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://api.datamuse.com/words?rel_syn=${word}&max=5`
    );
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data.map((item: { word: string }) => item.word);
  } catch (error) {
    console.error(`Error fetching synonyms for ${word}:`, error);
    return [];
  }
}

// Function to extract adjectives and descriptive phrases
async function extractDescriptiveContent(text: string): Promise<{
  adjectives: string[];
  phrases: string[];
  tone: string[];
  qualities: string[];
  style: string[];
  value: string[];
  experience: string[];
  synonyms: Record<string, string[]>;
}> {
  const words = text.toLowerCase().split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  // Find adjectives that match our lists
  const foundAdjectives = ALL_ADJECTIVES.filter((adj) =>
    text.toLowerCase().includes(adj)
  );

  // Extract phrases that contain our adjectives
  const descriptivePhrases = sentences.filter((sentence) =>
    ALL_ADJECTIVES.some((adj) => sentence.toLowerCase().includes(adj))
  );

  // Categorize found adjectives
  const tone = foundAdjectives.filter((adj) => TONE_ADJECTIVES.includes(adj));
  const qualities = foundAdjectives.filter((adj) =>
    QUALITY_ADJECTIVES.includes(adj)
  );
  const style = foundAdjectives.filter((adj) => STYLE_ADJECTIVES.includes(adj));
  const value = foundAdjectives.filter((adj) => VALUE_ADJECTIVES.includes(adj));
  const experience = foundAdjectives.filter((adj) =>
    EXPERIENCE_ADJECTIVES.includes(adj)
  );

  // Get synonyms for found adjectives
  const synonyms: Record<string, string[]> = {};
  for (const adj of foundAdjectives) {
    synonyms[adj] = await getSynonyms(adj);
  }

  return {
    adjectives: foundAdjectives,
    phrases: descriptivePhrases,
    tone,
    qualities,
    style,
    value,
    experience,
    synonyms,
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      throw new Error("Method not allowed");
    }

    // Parse request body
    const { url } = (await req.json()) as ScrapeRequest;

    if (!url) {
      throw new Error("URL is required");
    }

    // Fetch the webpage
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    if (!doc) {
      throw new Error("Failed to parse HTML");
    }

    // Extract title
    const title = doc.querySelector("title")?.textContent || "No title found";

    // Extract meta description
    const metaDescription =
      doc.querySelector('meta[name="description"]')?.getAttribute("content") ||
      null;

    // Focus on content-rich sections
    const contentSections = [
      ...doc.querySelectorAll("p"),
      ...doc.querySelectorAll("article"),
      ...doc.querySelectorAll("section"),
      ...doc.querySelectorAll('[class*="about"]'),
      ...doc.querySelectorAll('[class*="description"]'),
      ...doc.querySelectorAll('[class*="content"]'),
    ];

    // Combine all text content
    const mainContent = contentSections
      .map((el) => el.textContent)
      .join(" ")
      .trim();

    // Extract descriptive content
    const {
      adjectives,
      phrases,
      tone,
      qualities,
      style,
      value,
      experience,
      synonyms,
    } = await extractDescriptiveContent(mainContent);

    const result: ScrapeResponse = {
      title,
      meta_description: metaDescription,
      main_content: mainContent,
      adjectives: [...new Set(adjectives)], // Remove duplicates
      descriptive_phrases: [...new Set(phrases)], // Remove duplicates
      tone: [...new Set(tone)],
      key_qualities: [...new Set(qualities)],
      content_style: [...new Set(style)],
      value_proposition: [...new Set(value)],
      user_experience: [...new Set(experience)],
      synonyms,
    };

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status:
          error instanceof Error && error.message === "Method not allowed"
            ? 405
            : 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
