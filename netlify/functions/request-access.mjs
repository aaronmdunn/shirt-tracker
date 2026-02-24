const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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
    console.error("Missing Supabase environment variables");
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Server configuration error" }),
    };
  }

  let name, email;
  try {
    const body = JSON.parse(event.body || "{}");
    name = (body.name || "").trim();
    email = (body.email || "").trim();
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid request body" }),
    };
  }

  if (!name || !email) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Name and email are required" }),
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

  // Honeypot check (bot-field must be absent or empty)
  try {
    const body = JSON.parse(event.body || "{}");
    if (body["bot-field"]) {
      // Silently succeed to not reveal bot detection
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ ok: true }),
      };
    }
  } catch {
    // ignore
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/invite`,
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
      body: JSON.stringify({ error: "Failed to send invite" }),
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
