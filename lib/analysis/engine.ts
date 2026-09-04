// Deterministic HTML analysis engine (plan §13, Level 1 — no AI).
// Everything here is computed from the archived HTML with fixed formulas.
// Results are observations (FACTS), not interpretations.

import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import type { SnapshotMetrics, TechSignal } from "@/lib/types";
import { ANALYSIS_VERSION } from "@/lib/types";

const MAX_HTML_BYTES = 5 * 1024 * 1024; // analyze at most 5 MB

function countMatches(text: string, re: RegExp): number {
  const m = text.match(re);
  return m ? m.length : 0;
}

function collectColors($: CheerioAPI): Set<string> {
  const colors = new Set<string>();
  const HEX = /#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/gi;
  const RGB = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g;

  $("[style]").each((_, el) => {
    const style = $(el).attr("style") ?? "";
    for (const c of style.match(HEX) ?? []) colors.add(c.toLowerCase());
    for (const c of style.match(RGB) ?? []) colors.add(c.replace(/\s+/g, ""));
  });
  $("style").each((_, el) => {
    const css = $(el).text();
    for (const c of css.match(HEX) ?? []) colors.add(c.toLowerCase());
    for (const c of css.match(RGB) ?? []) colors.add(c.replace(/\s+/g, ""));
  });
  return colors;
}

interface WalkNode {
  type: string;
  children?: WalkNode[];
}

function domDepth($: CheerioAPI): number {
  let max = 0;
  const walk = (el: WalkNode, depth: number) => {
    if (depth > max) max = depth;
    for (const child of el.children ?? []) {
      if (child.type === "tag") walk(child, depth + 1);
    }
  };
  const body = $("body")[0] ?? $("html")[0];
  if (body) walk(body, 1);
  return max;
}

interface SignalPattern {
  name: string;
  category: TechSignal["category"];
  confidence: TechSignal["confidence"];
  evidence: string;
  re: RegExp;
}

const TECH_PATTERNS: SignalPattern[] = [
  { name: "jQuery", category: "javascript", confidence: "high", evidence: "script reference", re: /jquery[.\-/]/i },
  { name: "React", category: "framework", confidence: "medium", evidence: "markup or script reference", re: /react|_reactroot|data-reactroot/i },
  { name: "Angular", category: "framework", confidence: "medium", evidence: "script reference", re: /angular/i },
  { name: "Vue", category: "framework", confidence: "medium", evidence: "script reference", re: /vue(\.js|\.runtime|\.global)/i },
  { name: "Bootstrap", category: "framework", confidence: "medium", evidence: "css/script reference", re: /bootstrap(\.min)?\.(css|js)|bootstrap\/dist/i },
  { name: "WordPress", category: "framework", confidence: "high", evidence: "wp-content path", re: /wp-content|wp-includes/i },
  { name: "Adobe Flash", category: "media", confidence: "high", evidence: ".swf embed", re: /\.swf\b|application\/x-shockwave-flash/i },
  { name: "Java Applet", category: "media", confidence: "high", evidence: "applet tag", re: /<applet\b/i },
  { name: "Frames", category: "layout", confidence: "high", evidence: "frameset/frame tag", re: /<frameset\b|<frame\b/i },
  { name: "HTML5 doctype", category: "html", confidence: "high", evidence: "doctype declaration", re: /<!doctype\s+html>/i },
  { name: "Table layout", category: "layout", confidence: "low", evidence: "nested layout tables", re: /<table[^>]*(width|border|cellpadding)/i },
  { name: "Google Analytics", category: "analytics", confidence: "high", evidence: "tracking script", re: /google-analytics\.com|googletagmanager\.com|gtag\(|urchin/i },
  { name: "Web analytics", category: "analytics", confidence: "medium", evidence: "tracking script", re: /statcounter|clicky|matomo|piwik|segment\.com|mixpanel/i },
  { name: "Online advertising", category: "advertising", confidence: "medium", evidence: "ad network script", re: /adsbygoogle|doubleclick|googlesyndication|advertising\.com|adsystem/i },
  { name: "Web fonts", category: "fonts", confidence: "medium", evidence: "font service reference", re: /fonts\.googleapis|typekit|fonts\.forum/i },
  { name: "Embedded video", category: "media", confidence: "high", evidence: "video embed", re: /youtube\.com\/embed|<video\b|vimeo\.com\/\d|player\./i },
  { name: "Social widgets", category: "social", confidence: "medium", evidence: "social platform script", re: /platform\.twitter|connect\.facebook|widgets\.pinterest|addthis/i },
  { name: "AJAX", category: "javascript", confidence: "low", evidence: "xmlhttprequest usage", re: /xmlhttprequest/i },
  { name: "Responsive design", category: "css", confidence: "high", evidence: "viewport + media queries", re: /@media[^{]*\(/i },
  { name: "AI features", category: "javascript", confidence: "low", evidence: "AI service reference", re: /openai|chatgpt|copilot|gemini|chatbot|ai-assistant/i },
];

function detectTech(html: string, viewport: boolean): TechSignal[] {
  const signals: TechSignal[] = [];
  for (const p of TECH_PATTERNS) {
    if (p.re.test(html)) {
      signals.push({ name: p.name, category: p.category, confidence: p.confidence, evidence: p.evidence });
    }
  }
  // viewport meta is checked separately since it needs DOM parsing
  if (viewport) {
    signals.push({ name: "Mobile viewport", category: "css", confidence: "high", evidence: 'meta viewport tag' });
  }
  return signals;
}

export function analyzeHtml(rawHtml: string): SnapshotMetrics {
  const html = rawHtml.length > MAX_HTML_BYTES ? rawHtml.slice(0, MAX_HTML_BYTES) : rawHtml;
  const $ = cheerio.load(html);

  // --- text (without script/style noise) ---
  const $body = $("body").length ? $("body") : $("html");
  const textOnly = $body.clone();
  textOnly.find("script, style, noscript, template").remove();
  const text = textOnly.text().replace(/\s+/g, " ").trim();
  const words = text.split(" ").filter(Boolean);

  // --- content metrics ---
  const headingCount = $("h1, h2, h3, h4, h5, h6").length;
  const linkCount = $("a[href]").length;
  const imageCount = $("img").length;
  const videoCount = $("video, audio").length + $("iframe[src*='youtube'], iframe[src*='vimeo']").length;
  const formCount = $("form").length;
  const paragraphCount = $("p").length;

  // --- structure metrics ---
  const domNodes = $("*").length;
  const tableCount = $("table").length;
  const listCount = $("ul, ol").length;
  const viewport = $('meta[name="viewport"]').length > 0;

  // navigation: nav elements, [role=navigation], lists inside headers
  const navRegions =
    $("nav").length + $('[role="navigation"]').length + $("header ul, header ol").length;
  let navLinks = 0;
  $("nav a[href], [role='navigation'] a[href], header a[href]").each(() => {
    navLinks += 1;
  });

  // --- design metrics ---
  const distinctColors = collectColors($).size;
  const title = $("title").first().text().trim() || null;

  // --- text signals (plan §16): commerce / social / personal / AI wording ---
  // Lower-cased link text + buttons + headings carry the strongest intent.
  let intentText = "";
  $("a, button, input[type='submit'], h1, h2, h3, p").each((_, el) => {
    intentText += " " + ($(el).text() || $(el).attr("value") || "").toLowerCase();
  });
  const textSignals = {
    commerce: countMatches(intentText, /\b(buy|price|pricing|shop|cart|checkout|order now|add to cart|subscribe|free trial|deal|sale)\b/g),
    social: countMatches(intentText, /\b(share|tweet|follow|like us|follow us|comment|community|post|join the conversation)\b/g),
    personal: countMatches(intentText, /\b(sign in|log in|login|my account|create account|create profile|personalize|recommendations|for you)\b/g),
    ai: countMatches(intentText, /\b(chatbot|ai assistant|ask ai|chat with ai|copilot|gpt|summarize this)\b/g),
  };

  return {
    wordCount: words.length,
    paragraphCount,
    headingCount,
    linkCount,
    imageCount,
    videoCount,
    formCount,
    domNodes,
    domDepth: domDepth($),
    tableCount,
    listCount,
    navRegions,
    navLinks,
    distinctColors,
    // full payload size, even if analysis was truncated
    pageSizeBytes: Buffer.byteLength(rawHtml, "utf8"),
    title,
    techSignals: detectTech(html, viewport),
    textSignals,
  };
}

export { ANALYSIS_VERSION };
