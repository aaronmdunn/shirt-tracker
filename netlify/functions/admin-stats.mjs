const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
const BACKUP_BUCKET = process.env.SUPABASE_BACKUP_BUCKET || "shirt-tracker-backups";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const buildHeaders = (token) => ({
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${token || SUPABASE_SERVICE_ROLE_KEY}`,
});

/**
 * Verify the caller's Supabase JWT and confirm they are the admin.
 * Returns the user object on success, or null on failure.
 */
const verifyAdmin = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  if (!token) return null;

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return null;

  const user = await response.json();
  if (!user || user.id !== ADMIN_USER_ID) return null;
  return user;
};

/**
 * Fetch all rows from shirt_state (using service role to bypass RLS).
 */
const fetchAllShirtState = async () => {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/shirt_state?select=user_id,data,updated_at`,
    {
      headers: {
        ...buildHeaders(),
        Accept: "application/json",
      },
    }
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`shirt_state fetch failed: ${response.status} ${body}`);
  }
  return response.json();
};

/**
 * Fetch all auth users (paginated — Supabase returns max 1000 per page).
 */
const fetchAllUsers = async () => {
  const users = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
      {
        headers: buildHeaders(),
      }
    );
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Users fetch failed: ${response.status} ${body}`);
    }
    const data = await response.json();
    const batch = Array.isArray(data) ? data : data.users || [];
    users.push(...batch);
    if (batch.length < perPage) break;
    page++;
  }

  return users;
};

/**
 * Fetch the most recent backup file from storage to get last backup timestamp.
 */
const fetchLastBackupTimestamp = async () => {
  // List objects in the backups/ prefix, sorted by name descending (newest first), limit 1
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/list/${BACKUP_BUCKET}`,
    {
      method: "POST",
      headers: {
        ...buildHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prefix: "backups/",
        limit: 1,
        offset: 0,
        sortBy: { column: "name", order: "desc" },
      }),
    }
  );

  if (!response.ok) return null;

  const files = await response.json();
  if (!Array.isArray(files) || files.length === 0) return null;

  // The filename is like "2026-02-27T01-00-00-123Z.json"
  // created_at from storage metadata is the actual upload time
  return files[0].created_at || files[0].updated_at || null;
};

/**
 * Count items across all tabs in a user's cloud data payload.
 *
 * Cloud payload structure (from buildCloudPayload):
 *   { tabStates: { tabId: { rows: [...] } }, wishlist: { tabStates: { tabId: { rows: [...] } } } }
 */
const countItems = (data) => {
  if (!data) return 0;
  let total = 0;

  // Count inventory rows from tabStates
  const invStates = data.tabStates;
  if (invStates && typeof invStates === "object") {
    for (const tabId of Object.keys(invStates)) {
      const tabData = invStates[tabId];
      if (tabData && Array.isArray(tabData.rows)) {
        total += tabData.rows.length;
      }
    }
  }

  // Count wishlist rows from wishlist.tabStates
  const wl = data.wishlist;
  if (wl && wl.tabStates && typeof wl.tabStates === "object") {
    for (const tabId of Object.keys(wl.tabStates)) {
      const tabData = wl.tabStates[tabId];
      if (tabData && Array.isArray(tabData.rows)) {
        total += tabData.rows.length;
      }
    }
  }

  return total;
};

export const handler = async (event) => {
  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_USER_ID) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Server configuration error" }),
    };
  }

  // Verify the caller is the admin — this is the REAL security gate
  const admin = await verifyAdmin(event.headers.authorization || event.headers.Authorization);
  if (!admin) {
    return {
      statusCode: 403,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Forbidden" }),
    };
  }

  try {
    // Fetch data in parallel for speed
    const [users, shirtStateRows, lastBackup] = await Promise.all([
      fetchAllUsers(),
      fetchAllShirtState(),
      fetchLastBackupTimestamp(),
    ]);

    // Build per-user breakdown
    const userMap = new Map();
    for (const user of users) {
      userMap.set(user.id, {
        id: user.id,
        email: user.email || "(no email)",
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at,
        items: 0,
        lastSync: null,
      });
    }

    // Enrich with shirt_state data
    for (const row of shirtStateRows) {
      const entry = userMap.get(row.user_id);
      const items = countItems(row.data);
      if (entry) {
        entry.items = items;
        entry.lastSync = row.updated_at;
      } else {
        // User has data but wasn't in auth list (shouldn't happen, but handle gracefully)
        userMap.set(row.user_id, {
          id: row.user_id,
          email: "(unknown)",
          createdAt: null,
          lastSignIn: null,
          items: items,
          lastSync: row.updated_at,
        });
      }
    }

    const breakdown = Array.from(userMap.values())
      .sort((a, b) => b.items - a.items);

    const totalItems = breakdown.reduce((sum, u) => sum + u.items, 0);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        totalUsers: users.length,
        totalShirtStateRows: shirtStateRows.length,
        totalItems,
        lastBackup,
        users: breakdown,
      }),
    };
  } catch (error) {
    console.error("Admin stats error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Failed to fetch admin stats" }),
    };
  }
};
