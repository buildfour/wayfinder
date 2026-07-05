import * as cheerio from "cheerio";

export function extractFromHtml(html: string, url: string) {
  const $ = cheerio.load(html);

  $("script, style, nav, footer, header, aside, noscript, iframe").remove();

  const title =
    $("meta[property='og:title']").attr("content") ||
    $("title").first().text().trim() ||
    new URL(url).hostname;

  const ogDesc = $("meta[property='og:description']").attr("content")?.trim();
  const metaDesc = $("meta[name='description']").attr("content")?.trim();

  const bodyText = $("article").text().trim() || $("main").text().trim() || $("body").text().trim();
  const text = normalizeText(bodyText);

  const excerpt =
    ogDesc ||
    metaDesc ||
    text.split(/\n+/).find((p) => p.length > 40)?.slice(0, 280) ||
    text.slice(0, 280);

  return { title, text, excerpt };
}

export function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function buildExcerpt(text: string, maxLen = 280): string {
  const first = text.split(/\n+/).find((p) => p.trim().length > 30)?.trim();
  if (!first) return text.slice(0, maxLen);
  return first.length > maxLen ? first.slice(0, maxLen) + "…" : first;
}
