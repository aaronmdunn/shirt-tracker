/**
 * admin-ui.mjs — Serves the admin panel UI code ONLY to verified admins.
 *
 * Security model:
 *   1. Extracts the Bearer JWT from the Authorization header.
 *   2. Resolves the user via Supabase /auth/v1/user (proves the token is valid).
 *   3. Compares user.id against the ADMIN_USER_ID env var.
 *   4. If all checks pass, returns the admin UI JavaScript as text/javascript.
 *   5. Otherwise returns 403 — non-admins never receive the code.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

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
 * The admin UI code, returned as a JavaScript string.
 *
 * This code is injected via <script> tag and runs in global scope.
 * Since app.js variables are block-scoped inside a try{}, the injected
 * code reads dependencies from window.__adminBridge (set by the stub
 * in app.js just before injection, and deleted immediately after).
 */
const adminUiScript = `
(function () {
  // --- Admin Panel (dynamically loaded) ---

  var bridge = window.__adminBridge;
  if (!bridge) return;
  var openDialog = bridge.openDialog;
  var closeDialog = bridge.closeDialog;
  var resetDialogScroll = bridge.resetDialogScroll;
  var changelogLink = bridge.changelogLink;
  var NETLIFY_BASE = bridge.NETLIFY_BASE;
  var APP_VERSION = bridge.APP_VERSION;
  var supabase = bridge.supabase;
  var currentUser = bridge.currentUser;
  delete window.__adminBridge;

  // Build the dialog element
  var dialog = document.createElement("dialog");
  dialog.id = "admin-dialog";
  dialog.style.cssText = "max-width:780px; width:92vw;";

  var dialogBody = document.createElement("div");
  dialogBody.className = "dialog-body";
  dialogBody.style.cssText = "max-height:70vh; overflow-y:auto;";

  var heading = document.createElement("h3");
  heading.textContent = "Admin Panel";
  dialogBody.appendChild(heading);

  var statsContent = document.createElement("div");
  statsContent.id = "admin-stats-content";
  dialogBody.appendChild(statsContent);
  dialog.appendChild(dialogBody);

  var actions = document.createElement("div");
  actions.className = "dialog-actions";

  var refreshBtn = document.createElement("button");
  refreshBtn.type = "button";
  refreshBtn.className = "btn secondary";
  refreshBtn.textContent = "Refresh";
  actions.appendChild(refreshBtn);

  var closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "btn";
  closeBtn.textContent = "Close";
  actions.appendChild(closeBtn);

  dialog.appendChild(actions);
  document.body.appendChild(dialog);

  // --- Helper functions ---

  var formatAdminDate = function (dateStr) {
    if (!dateStr) return "Never";
    try {
      var d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Unknown";
      return d.toLocaleString();
    } catch (e) {
      return "Unknown";
    }
  };

  var renderAdminStats = function (data) {
    statsContent.textContent = "";

    var summary = document.createElement("div");
    summary.style.cssText = "display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:18px;";

    var addCard = function (label, value) {
      var card = document.createElement("div");
      card.style.cssText = "background:var(--surface, #f5f5f5); border-radius:8px; padding:12px; text-align:center;";
      var valEl = document.createElement("div");
      valEl.style.cssText = "font-size:1.4rem; font-weight:700; margin-bottom:2px;";
      valEl.textContent = value;
      card.appendChild(valEl);
      var labelEl = document.createElement("div");
      labelEl.style.cssText = "font-size:0.75rem; color:var(--muted, #888);";
      labelEl.textContent = label;
      card.appendChild(labelEl);
      summary.appendChild(card);
    };

    addCard("Total Users", String(data.totalUsers));
    addCard("Users with Data", String(data.totalShirtStateRows));
    addCard("Total Items", String(data.totalItems));
    addCard("App Version", "v" + APP_VERSION);

    statsContent.appendChild(summary);

    var backupLine = document.createElement("div");
    backupLine.style.cssText = "font-size:0.82rem; color:var(--muted, #888); margin-bottom:14px; text-align:center;";
    backupLine.textContent = "Last backup: " + formatAdminDate(data.lastBackup);
    statsContent.appendChild(backupLine);

    var perUserHeading = document.createElement("div");
    perUserHeading.style.cssText = "font-weight:700; font-size:0.9rem; margin-bottom:8px;";
    perUserHeading.textContent = "Per-User Breakdown";
    statsContent.appendChild(perUserHeading);

    var table = document.createElement("table");
    table.style.cssText = "width:100%; border-collapse:collapse; font-size:0.8rem;";
    var thead = document.createElement("thead");
    var headerRow = document.createElement("tr");
    ["Email", "Items", "Last Sync", "Signed Up"].forEach(function (text) {
      var th = document.createElement("th");
      th.style.cssText = "text-align:left; padding:6px 8px; border-bottom:2px solid var(--border, #ddd); font-weight:600; white-space:nowrap;";
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    if (data.users && data.users.length > 0) {
      data.users.forEach(function (user) {
        var tr = document.createElement("tr");
        var emailTd = document.createElement("td");
        emailTd.style.cssText = "padding:5px 8px; border-bottom:1px solid var(--border, #eee); max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;";
        emailTd.textContent = user.email;
        tr.appendChild(emailTd);

        var itemsTd = document.createElement("td");
        itemsTd.style.cssText = "padding:5px 8px; border-bottom:1px solid var(--border, #eee); text-align:center;";
        itemsTd.textContent = String(user.items);
        tr.appendChild(itemsTd);

        var syncTd = document.createElement("td");
        syncTd.style.cssText = "padding:5px 8px; border-bottom:1px solid var(--border, #eee); white-space:nowrap;";
        syncTd.textContent = formatAdminDate(user.lastSync);
        tr.appendChild(syncTd);

        var createdTd = document.createElement("td");
        createdTd.style.cssText = "padding:5px 8px; border-bottom:1px solid var(--border, #eee); white-space:nowrap;";
        createdTd.textContent = formatAdminDate(user.createdAt);
        tr.appendChild(createdTd);

        tbody.appendChild(tr);
      });
    } else {
      var tr = document.createElement("tr");
      var td = document.createElement("td");
      td.setAttribute("colspan", "4");
      td.style.cssText = "padding:12px 8px; text-align:center; color:var(--muted, #888);";
      td.textContent = "No user data found.";
      tr.appendChild(td);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    var tableWrap = document.createElement("div");
    tableWrap.style.cssText = "overflow-x:auto;";
    tableWrap.appendChild(table);
    statsContent.appendChild(tableWrap);
  };

  var loadAdminStats = function () {
    statsContent.textContent = "";
    var loading = document.createElement("div");
    loading.style.cssText = "text-align:center; padding:24px; color:var(--muted, #888);";
    loading.textContent = "Loading admin stats\\u2026";
    statsContent.appendChild(loading);

    (async function () {
      try {
        if (!supabase || !currentUser) {
          throw new Error("Not authenticated");
        }
        var sessionData = (await supabase.auth.getSession()).data;
        var token = sessionData && sessionData.session ? sessionData.session.access_token : null;
        if (!token) {
          throw new Error("No auth token available");
        }
        var response = await fetch(NETLIFY_BASE + "/.netlify/functions/admin-stats", {
          headers: { Authorization: "Bearer " + token },
        });
        if (!response.ok) {
          var err = await response.json().catch(function () { return {}; });
          throw new Error(err.error || "Request failed (" + response.status + ")");
        }
        var data = await response.json();
        renderAdminStats(data);
      } catch (error) {
        statsContent.textContent = "";
        var errEl = document.createElement("div");
        errEl.style.cssText = "text-align:center; padding:24px; color:#c0392b;";
        errEl.textContent = "Failed to load stats: " + (error.message || "Unknown error");
        statsContent.appendChild(errEl);
      }
    })();
  };

  // --- Wire up event listeners ---

  closeBtn.addEventListener("click", function () {
    closeDialog(dialog);
  });

  refreshBtn.addEventListener("click", function () {
    loadAdminStats();
  });

  // --- Inject the Admin Panel link ---

  var changelogLinkContainer = changelogLink
    ? changelogLink.closest(".event-log-link")
    : null;
  if (changelogLinkContainer) {
    var adminLinkDiv = document.createElement("div");
    adminLinkDiv.className = "event-log-link";
    var adminAnchor = document.createElement("a");
    adminAnchor.href = "#";
    adminAnchor.id = "admin-panel-link";
    adminAnchor.textContent = "Admin Panel";
    adminAnchor.addEventListener("click", function (event) {
      event.preventDefault();
      loadAdminStats();
      openDialog(dialog);
      resetDialogScroll(dialog);
    });
    adminLinkDiv.appendChild(adminAnchor);
    changelogLinkContainer.insertAdjacentElement("afterend", adminLinkDiv);
  }

  // --- End Admin Panel ---
})();
`;

export const handler = async (event) => {
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

  const admin = await verifyAdmin(
    event.headers.authorization || event.headers.Authorization
  );
  if (!admin) {
    return {
      statusCode: 403,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Forbidden" }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: adminUiScript,
  };
};
