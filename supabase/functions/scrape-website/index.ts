import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import {
  TONE_ADJECTIVES,
  QUALITY_ADJECTIVES,
  STYLE_ADJECTIVES,
  VALUE_ADJECTIVES,
  EXPERIENCE_ADJECTIVES,
  ALL_ADJECTIVES,
} from "./adjectives.ts";

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
}

// Function to extract adjectives and descriptive phrases
function extractDescriptiveContent(text: string): {
  adjectives: string[];
  phrases: string[];
  tone: string[];
  qualities: string[];
  style: string[];
  value: string[];
  experience: string[];
} {
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

  return {
    adjectives: foundAdjectives,
    phrases: descriptivePhrases,
    tone,
    qualities,
    style,
    value,
    experience,
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
    const { adjectives, phrases, tone, qualities, style, value, experience } =
      extractDescriptiveContent(mainContent);

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
