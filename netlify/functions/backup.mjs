const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BACKUP_BUCKET = process.env.SUPABASE_BACKUP_BUCKET || "shirt-tracker-backups";
// Set BACKUP_SECRET in Netlify env vars. Any direct HTTP call must supply:
//   x-backup-secret: <value>
// Scheduled invocations from Netlify's cron send x-netlify-event: schedule and are always allowed.
const BACKUP_SECRET = process.env.BACKUP_SECRET;

const buildHeaders = () => ({
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
});

const ensureBucket = async () => {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      ...buildHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: SUPABASE_BACKUP_BUCKET, public: false }),
  });

  if (response.ok || response.status === 409) return;
  const body = await response.text();
  if (body.includes("already exists") || body.includes("Duplicate")) return;
  throw new Error(`Bucket create failed: ${response.status} ${body}`);
};

const fetchShirtState = async () => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/shirt_state?select=*`, {
    headers: {
      ...buildHeaders(),
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Fetch failed: ${response.status} ${body}`);
  }

  return response.json();
};

const uploadBackup = async (payload, objectPath) => {
  const safePath = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BACKUP_BUCKET}/${safePath}?upsert=true`,
    {
      method: "POST",
      headers: {
        ...buildHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Upload failed: ${response.status} ${body}`);
  }
};

// Netlify V2 function format — required for scheduled functions.
// Scheduled invocations arrive as a standard Request with the
// x-netlify-event: schedule header. Direct HTTP calls must present
// the correct x-backup-secret header when BACKUP_SECRET is configured.
export default async (req) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Missing Supabase environment variables", { status: 500 });
  }

  const isScheduled = req.headers.get("x-netlify-event") === "schedule";
  if (!isScheduled && BACKUP_SECRET) {
    const provided = req.headers.get("x-backup-secret");
    if (provided !== BACKUP_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  try {
    await ensureBucket();
    const rows = await fetchShirtState();
    const now = new Date();
    const dateStamp = now.toISOString().replace(/[:.]/g, "-");
    const objectPath = `backups/${dateStamp}.json`;
    const payload = {
      generatedAt: now.toISOString(),
      rowCount: Array.isArray(rows) ? rows.length : 0,
      rows,
    };
    await uploadBackup(payload, objectPath);
    return new Response(`Backup saved to ${objectPath}`, { status: 200 });
  } catch (error) {
    return new Response(`Backup failed: ${error.message}`, { status: 500 });
  }
};

export const config = {
  schedule: "0 1 * * *",
};
