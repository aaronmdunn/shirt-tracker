/**
 * Netlify Edge Function — Geo-blocking
 *
 * Blocks requests from countries commonly associated with automated
 * scanning and probing traffic. Runs at the edge before the request
 * reaches the origin, so blocked requests consume minimal resources.
 *
 * To add or remove countries, edit the BLOCKED_COUNTRIES set below.
 * Uses ISO 3166-1 alpha-2 country codes.
 */

const BLOCKED_COUNTRIES = new Set([
  "CN", // China
  "RU", // Russia
  "KP", // North Korea
  "IR", // Iran
  "VN", // Vietnam
  "ID", // Indonesia
  "RO", // Romania
  "NG", // Nigeria
  "UA", // Ukraine
]);

export default async (request, context) => {
  const country = context.geo?.country?.code;

  if (country && BLOCKED_COUNTRIES.has(country)) {
    return new Response("Access denied", { status: 403 });
  }

  // Country not blocked — continue to origin
  return context.next();
};

export const config = {
  path: "/*",
};
