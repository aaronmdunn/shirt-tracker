const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://shirt-tracker.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Field length limits — prevents oversized payloads reaching Supabase
const MAX_NAME_LENGTH = 200;
const MAX_EMAIL_LENGTH = 254; // RFC 5321 max

export const handler = async (event) => {
  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error(`Missing env vars — SUPABASE_URL: ${!!SUPABASE_URL}, SUPABASE_SERVICE_ROLE_KEY: ${!!SUPABASE_SERVICE_ROLE_KEY}`);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Something went wrong. Please try again." }),
    };
  }

  // Parse body once and reuse throughout
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid request body" }),
    };
  }

  // Honeypot check (bot-field must be absent or empty) — checked before any real work
  if (body["bot-field"]) {
    // Silently succeed to not reveal bot detection
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true }),
    };
  }

  const name = (body.name || "").trim();
  const email = (body.email || "").trim();

  if (!name || !email) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Name and email are required" }),
    };
  }

  // Field length limits
  if (name.length > MAX_NAME_LENGTH) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Name is too long" }),
    };
  }
  if (email.length > MAX_EMAIL_LENGTH) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Email address is too long" }),
    };
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid email address" }),
    };
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/invite`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          data: { full_name: name },
        }),
      }
    );

    // 422 from Supabase means the user already exists — treat as success
    // to avoid revealing whether an email is registered
    if (response.ok || response.status === 422) {
      console.log(`Access request processed for: ${email}`);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ ok: true }),
      };
    }

    const errorBody = await response.text();
    console.error(`Supabase invite error ${response.status}: ${errorBody}`);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Something went wrong. Please try again." }),
    };
  } catch (err) {
    console.error("Invite fetch failed:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Failed to send invite" }),
    };
  }
};
