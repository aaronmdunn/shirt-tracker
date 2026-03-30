const showFatalError = (message) => {
  if (document.getElementById("fatal-error")) return;
  const banner = document.createElement("div");
  banner.id = "fatal-error";
  banner.className = "error-banner";
  banner.textContent = `App error: ${message}`;
  document.body.appendChild(banner);
};

window.addEventListener("error", (event) => {
  const message = event?.message || "Unknown error";
  showFatalError(message);
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event?.reason?.message || String(event?.reason || "Unknown rejection");
  // Don't show error banners for non-critical network failures (e.g. analytics, background sync)
  if (/NetworkError|Failed to fetch|Load failed/i.test(reason)) return;
  showFatalError(reason);
});

try {
const STORAGE_KEY = "shirts-db-v3";
const TAB_STORAGE_KEY = "shirts-tabs-v1";
const COLUMNS_KEY = "shirts-columns-v2";
const EVENT_LOG_KEY = "shirts-event-log-v1";
const EVENT_LOG_LIMIT = 200;
const INACTIVITY_LIMIT_MS = 24 * 60 * 60 * 1000;
const LAST_ACTIVITY_KEY = "shirts-last-activity";
const LAST_SYNC_KEY = "shirts-last-sync";
const LAST_CLOUD_UPDATE_KEY = "shirts-last-cloud-update";
const LAST_CHANGE_KEY = "shirts-last-change";
const APP_VERSION = "2.1.1";
const IS_WEB_BUILD = true;
const PLATFORM = "__PLATFORM__"; // replaced at build time with "desktop" or "mobile"
const NETLIFY_BASE = (window.__TAURI__ || window.__TAURI_INTERNALS__) ? "https://shirt-tracker.com" : "";
const LAST_COMMIT_DATE = "2026-02-03T12:43:59-05:00";
const APP_VERSION_KEY = "shirts-app-version";
const APP_UPDATE_KEY = "shirts-app-update-date";

const SIGNED_URL_CACHE_KEY = "shirts-signed-url-cache";
const SIGNED_URL_TTL_MS = 50 * 60 * 1000;
const WISHLIST_STORAGE_KEY = "wishlist-db-v1";
const WISHLIST_TAB_STORAGE_KEY = "wishlist-tabs-v1";
const WISHLIST_COLUMNS_KEY = "wishlist-columns-v1";
const APP_MODE_KEY = "shirts-app-mode";
const CURRENT_USER_KEY = "shirts-current-user";
const CUSTOM_TAGS_KEY = "shirts-custom-tags-v1";
const FOR_SALE_TAG = "For Sale";
const DELETED_ROWS_KEY = "shirts-deleted-rows-v1";
const DELETED_ROWS_PURGE_DAYS = 30;
const GOT_IT_LOG_KEY = "wishlist-got-it-log-v1";
const INSIGHTS_SNOOZE_KEY = "shirts-insights-snooze-v1";
const INSIGHTS_QUEUE_ACTIVITY_KEY = "shirts-insights-queue-activity-v1";
const NO_BUY_GAMIFY_KEY = "shirts-no-buy-gamify-v1";

const CHANGELOG = /* __CHANGELOG_INJECT__ */ [];

// --- Service Worker Cleanup ---
// The service worker was removed in v2.0.11. Unregister any leftover SW
// so returning users don't get stale cached pages.
if ("serviceWorker" in navigator && !(window.__TAURI__ || window.__TAURI_INTERNALS__)) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    for (const reg of regs) reg.unregister();
  });
}

const clearLegacyStorage = () => {
  try {
    localStorage.removeItem(TAB_STORAGE_KEY);
    localStorage.removeItem(COLUMNS_KEY);
    localStorage.removeItem("tab-logos-map");
  } catch (error) {
    // ignore
  }
  try {
    const prefix = `${STORAGE_KEY}:`;
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    // ignore
  }
};

const resetParam = (() => {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("reset") || params.get("fresh");
  } catch (error) {
    return "";
  }
})();

if (resetParam === "1") {
  clearLegacyStorage();
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("reset");
    url.searchParams.delete("fresh");
    window.history.replaceState({}, "", url.toString());
  } catch (error) {
    // ignore
  }
  window.location.reload();
}

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
};

const defaultRow = () => ({
  id: createId(),
  cells: {},
  tags: [],
  createdAt: new Date().toISOString(),
});

const PHOTO_DB = "shirt-tracker-photos";
const PHOTO_STORE = "photos";
const photoSrcCache = new Map();

let signedUrlCacheMemory = null;

const loadSignedUrlCache = () => {
  if (signedUrlCacheMemory) return signedUrlCacheMemory;
  if (!canUseLocalStorage()) return {};
  try {
    const stored = localStorage.getItem(SIGNED_URL_CACHE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    signedUrlCacheMemory = parsed && typeof parsed === "object" ? parsed : {};
    return signedUrlCacheMemory;
  } catch (error) {
    return {};
  }
};

const saveSignedUrlCache = (cache) => {
  signedUrlCacheMemory = cache;
  if (!canUseLocalStorage()) return;
  try {
    localStorage.setItem(SIGNED_URL_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    // ignore
  }
};

const getCachedSignedUrl = (key) => {
  const cache = loadSignedUrlCache();
  const entry = cache[key];
  if (!entry || !entry.url || !entry.expiresAt) return "";
  if (Date.now() > entry.expiresAt) return "";
  return entry.url;
};

const setCachedSignedUrl = (key, url) => {
  const cache = loadSignedUrlCache();
  cache[key] = { url, expiresAt: Date.now() + SIGNED_URL_TTL_MS };
  saveSignedUrlCache(cache);
};

const SUPABASE_URL = "https://jbmzsxbzqvgsasjhwuko.supabase.co";
const SUPABASE_KEY = "sb_publishable_Tv2JI_3n8Q9eaC05c4P40Q_vfZvLWZa";
const SUPABASE_BUCKET = "shirt-photos";
const supabase = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;
let currentUser = null;
let publicShareToken = "";
let publicShareLoaded = false;
let publicShareVisibility = { mode: "auto", columnIds: [] };
let isViewerSession = false;
let syncTimer = null;
let syncRetryTimer = null;
let isSyncing = false;
let syncRetryCount = 0;
let lastSyncErrorAt = 0;
let lastSyncErrorMessage = "";
const FORCE_FRESH_START = (() => {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("fresh") === "1";
  } catch (error) {
    return false;
  }
})();
let suppressShirtUpdate = false;
let photoMigrationDone = false;

const openPhotoDb = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(PHOTO_DB, 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(PHOTO_STORE)) {
      db.createObjectStore(PHOTO_STORE);
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const savePhotoBlob = async (blob) => {
  const db = await openPhotoDb();
  const id = createId();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, "readwrite");
    tx.objectStore(PHOTO_STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return id;
};

const loadPhotoBlob = async (id) => {
  const db = await openPhotoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, "readonly");
    const request = tx.objectStore(PHOTO_STORE).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

const getPhotoSrc = async (value) => {
  if (!value) return "";
  if (value.startsWith("data:")) return value;
  if (value.startsWith("idb:")) {
    if (photoSrcCache.has(value)) return photoSrcCache.get(value);
    const blob = await loadPhotoBlob(value.slice(4));
    const src = blob ? URL.createObjectURL(blob) : "";
    if (src) photoSrcCache.set(value, src);
    return src;
  }
  if (value.startsWith("supa:")) {
    if (!supabase) return "";
    if (photoSrcCache.has(value) && getCachedSignedUrl(value)) return photoSrcCache.get(value);
    if (photoSrcCache.has(value) && !getCachedSignedUrl(value)) photoSrcCache.delete(value);
    const cached = getCachedSignedUrl(value);
    if (cached) {
      photoSrcCache.set(value, cached);
      return cached;
    }
    const path = value.slice(5);
    if (!currentUser && publicShareToken) {
      const { data } = supabase
        .storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl(path);
      const publicUrl = data && data.publicUrl ? data.publicUrl : "";
      if (publicUrl) {
        photoSrcCache.set(value, publicUrl);
      }
      return publicUrl;
    }
    if (!currentUser) return "";
    const { data, error } = await supabase
      .storage
      .from(SUPABASE_BUCKET)
      .createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) return "";
    setCachedSignedUrl(value, data.signedUrl);
    photoSrcCache.set(value, data.signedUrl);
    return data.signedUrl;
  }
  return value;
};

const getLogoSrc = async (value) => {
  if (!value) return "";
  if (value.startsWith("data:")) return value;
  if (value.startsWith("supa:")) {
    if (!supabase) return "";
    if (photoSrcCache.has(value) && getCachedSignedUrl(value)) return photoSrcCache.get(value);
    if (photoSrcCache.has(value) && !getCachedSignedUrl(value)) photoSrcCache.delete(value);
    const cached = getCachedSignedUrl(value);
    if (cached) {
      photoSrcCache.set(value, cached);
      return cached;
    }
    const path = value.slice(5);
    if (!currentUser && publicShareToken) {
      const { data } = supabase
        .storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl(path);
      const publicUrl = data && data.publicUrl ? data.publicUrl : "";
      if (publicUrl) {
        photoSrcCache.set(value, publicUrl);
      }
      return publicUrl;
    }
    if (!currentUser) return "";
    const { data, error } = await supabase
      .storage
      .from(SUPABASE_BUCKET)
      .createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) return "";
    setCachedSignedUrl(value, data.signedUrl);
    photoSrcCache.set(value, data.signedUrl);
    return data.signedUrl;
  }
  return value;
};

const warmPhotoSrcCache = () => {
  const photoColumnIds = state.columns
    .filter((column) => column.type === "photo")
    .map((column) => column.id);
  if (photoColumnIds.length === 0) return;
  const rows = Array.isArray(state.rows) ? state.rows : [];
  rows.forEach((row) => {
    if (!row || !row.cells) return;
    photoColumnIds.forEach((columnId) => {
      const value = row.cells[columnId];
      if (!value || !value.startsWith("supa:")) return;
      if (photoSrcCache.has(value)) return;
      const cached = getCachedSignedUrl(value);
      if (cached) photoSrcCache.set(value, cached);
    });
  });
};

const prefetchPhotoSources = async () => {
  const photoColumnIds = state.columns
    .filter((column) => column.type === "photo")
    .map((column) => column.id);
  if (photoColumnIds.length === 0) return;
  const rows = Array.isArray(state.rows) ? state.rows : [];
  const pendingPaths = new Set();
  rows.forEach((row) => {
    if (!row || !row.cells) return;
    photoColumnIds.forEach((columnId) => {
      const value = row.cells[columnId];
      if (!value) return;
      if (value.startsWith("supa:")) {
        if (photoSrcCache.has(value)) return;
        pendingPaths.add(value.slice(5));
        return;
      }
      getPhotoSrc(value);
    });
  });
  if (!pendingPaths.size || !supabase) return;
  if (!currentUser && publicShareToken) {
    pendingPaths.forEach((path) => {
      const { data } = supabase
        .storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl(path);
      const publicUrl = data && data.publicUrl ? data.publicUrl : "";
      if (!publicUrl) return;
      const key = `supa:${path}`;
      photoSrcCache.set(key, publicUrl);
    });
    return;
  }
  if (!currentUser) return;
  const { data, error } = await supabase
    .storage
    .from(SUPABASE_BUCKET)
    .createSignedUrls(Array.from(pendingPaths), 3600);
  if (error || !Array.isArray(data)) return;
  data.forEach((item) => {
    if (!item || !item.path || !item.signedUrl) return;
    const key = `supa:${item.path}`;
    setCachedSignedUrl(key, item.signedUrl);
    photoSrcCache.set(key, item.signedUrl);
  });
};

const state = {
  columns: [],
  rows: [defaultRow()],
  columnWidths: {},
  sort: {
    columnId: null,
    direction: "asc",
  },
  filter: {
    columnId: "all",
    query: "",
  },
  readOnly: false,
};
const tabsState = {
  tabs: [],
  activeTabId: null,
  embeddedData: null,
  isEmbeddedBackup: false,
};

const SIZE_OPTIONS_DEFAULT = ["XS", "S", "M", "L", "XL", "2X", "3X", "4X", "5X", "NA"];

const getDefaultColumns = () => ([
  { id: createId(), name: "Condition", type: "select", options: ["NWT", "NWOT", "EUC", "Other"] },
  { id: createId(), name: "Name", type: "text", options: [] },
  { id: createId(), name: "Size", type: "select", options: SIZE_OPTIONS_DEFAULT.slice() },
  { id: createId(), name: "Type", type: "select", options: [] },
  { id: createId(), name: "Fandom", type: "select", options: [] },
  { id: createId(), name: "Price", type: "number", options: [] },
  { id: createId(), name: "Preview", type: "photo", options: [] },
  { id: createId(), name: "Notes", type: "notes", options: [] },
]);

const getWishlistDefaultColumns = () => ([
  { id: createId(), name: "Brand", type: "select", options: [] },
  { id: createId(), name: "Name", type: "text", options: [] },
  { id: createId(), name: "Type", type: "select", options: [] },
  { id: createId(), name: "Fandom", type: "select", options: [] },
  { id: createId(), name: "Size", type: "select", options: SIZE_OPTIONS_DEFAULT.slice() },
  { id: createId(), name: "Preview", type: "photo", options: [] },
  { id: createId(), name: "Notes", type: "notes", options: [] },
]);

const applyFreshUserDefaults = () => {
  setDefaultTabsState();
  const defaults = getDefaultColumns();
  state.columns = defaults.map((column) => ({ ...column }));
  state.rows = [defaultRow()];
  setGlobalColumns(defaults);
  try {
    localStorage.removeItem("tab-logos-map");
  } catch (error) {
    // ignore
  }
};
const columnOverrides = {
  fandomOptionsByTab: {},
  typeOptionsByTab: {},
  hiddenColumnsByTab: {},
};
let globalColumns = null;
let appMode = "inventory";
const savedModeState = { inventory: null, wishlist: null };
const modeSwitcher = document.getElementById("mode-switcher");
const sheetBody = document.getElementById("sheet-body");
const sheetColgroup = document.getElementById("sheet-colgroup");
const sheetHeadRow = document.getElementById("sheet-head-row");
const aboutVersion = document.getElementById("about-version");
const sheetTableScroll = document.getElementById("sheet-table-scroll");
const sheetTable = document.getElementById("sheet-table");
const tableScrollHint = document.getElementById("table-scroll-hint");
const columnManager = document.getElementById("column-manager");
const emptyState = document.getElementById("empty-state");
const tabBar = document.getElementById("tab-bar");
const addColumnButton = document.getElementById("add-column");
const addRowButton = document.getElementById("add-row");
const goBottomButton = document.getElementById("go-bottom");
const addRowBottomButton = document.getElementById("add-row-bottom");
const goTopButton = document.getElementById("go-top");
const deleteSelectedBottomButton = document.getElementById("delete-selected-bottom");
const authActionButton = document.getElementById("auth-action");
const authActionSignedOutButton = document.getElementById("auth-action-signedout");
const syncNowButton = document.getElementById("sync-now");
const verifyBackupButton = document.getElementById("verify-backup");
const exportCsvButton = document.getElementById("export-csv");
const importCsvButton = document.getElementById("import-csv");
const backupStatusText = document.getElementById("backup-status");
const unsavedStatusText = document.getElementById("unsaved-status");
const advancedDiagnosticsLink = document.getElementById("advanced-diagnostics-link");
const syncDiagnosticsDialog = document.getElementById("sync-diagnostics-dialog");
const syncDiagnosticsCloseButton = document.getElementById("sync-diagnostics-close");
const syncDiagnosticsContent = document.getElementById("sync-diagnostics-content");
const publicShareLinkInput = document.getElementById("public-share-link");
const copyShareLinkButton = document.getElementById("copy-share-link");
const bulkTagsButton = document.getElementById("bulk-tags");
const selectAllRowsButton = document.getElementById("select-all-rows");
const shareColumnsButton = document.getElementById("share-columns-button");
let copyShareSizingObserver = null;
const shareColumnsSummary = document.getElementById("share-columns-summary");
const shareColumnsDialog = document.getElementById("share-columns-dialog");
const shareColumnsList = document.getElementById("share-columns-list");
const shareColumnsCancel = document.getElementById("share-columns-cancel");
const shareColumnsSave = document.getElementById("share-columns-save");
const editProfileNameButton = document.getElementById("edit-profile-name");
const eventLogLink = document.getElementById("event-log-link");
const toggleColumnsButton = document.getElementById("toggle-columns");
const clearAllButton = document.getElementById("clear-all");
const undoClearButton = document.getElementById("undo-clear");
const filterColumnSelect = document.getElementById("filter-column");
const filterQueryInput = document.getElementById("filter-query");
const filterTagsSelect = document.getElementById("filter-tags");
const findBar = document.getElementById("find-bar");
const findBarInput = document.getElementById("find-bar-input");
const findBarCloseButton = document.getElementById("find-bar-close");
const clearFilterButton = document.getElementById("clear-filter");
const totalCountEl = document.getElementById("total-count");
const totalCostEl = document.getElementById("total-cost");
const footerActions = document.getElementById("footer-actions");
const footerStats = document.getElementById("footer-stats");
const totalsPanel = document.getElementById("totals-panel");
const shirtUpdateDateInput = document.getElementById("shirt-update-date");
const appUpdateDateInput = document.getElementById("app-update-date");
const footerVersionLine = document.getElementById("footer-version-line");
const iconCreditsDialog = document.getElementById("icon-credits-dialog");
const iconCreditsCloseButton = document.getElementById("icon-credits-close");
const creditsLink = document.getElementById("credits-link");
const legalDisclaimerDialog = document.getElementById("legal-disclaimer-dialog");
const legalDisclaimerCloseButton = document.getElementById("legal-disclaimer-close");
const legalDisclaimerLink = document.getElementById("legal-disclaimer-link");
const resetFreshButton = document.getElementById("reset-fresh");
const privacyPolicyDialog = document.getElementById("privacy-policy-dialog");
const privacyPolicyCloseButton = document.getElementById("privacy-policy-close");
const privacyPolicyLink = document.getElementById("privacy-policy-link");
const privacyContactLink = document.getElementById("privacy-contact-link");
const contactDialog = document.getElementById("contact-dialog");
const contactForm = document.querySelector('form[name="contact"]');
const contactFormMessage = document.getElementById("contact-form-message");
const contactCloseButton = document.getElementById("contact-close");
const contactLink = document.getElementById("contact-link");
const tagsDialog = document.getElementById("tags-dialog");
const tagsRowName = document.getElementById("tags-row-name");
const tagsInput = document.getElementById("tags-input");
const tagsAddButton = document.getElementById("tags-add");
const tagsSuggestions = document.getElementById("tags-suggestions");
const tagsList = document.getElementById("tags-list");
const tagsCloseButton = document.getElementById("tags-close");
const tagsMainView = document.getElementById("tags-main-view");
const tagsManageView = document.getElementById("tags-manage-view");
const tagsManageList = document.getElementById("tags-manage-list");
const tagsManageButton = document.getElementById("tags-manage-btn");
const bulkTagsDialog = document.getElementById("bulk-tags-dialog");
const bulkTagsCount = document.getElementById("bulk-tags-count");
const bulkTagsInput = document.getElementById("bulk-tags-input");
const bulkTagsAddButton = document.getElementById("bulk-tags-add");
const bulkTagsRemoveButton = document.getElementById("bulk-tags-remove");
const bulkTagsSuggestions = document.getElementById("bulk-tags-suggestions");
const bulkTagsCloseButton = document.getElementById("bulk-tags-close");
const appTitleEl = document.getElementById("app-title");
const appSubtitleEl = document.getElementById("app-subtitle");

const tabLogoPanel = document.getElementById("tab-logo-panel");
const topControls = document.getElementById("top-controls");
const dangerZone = document.querySelector(".danger-zone");
const authRow = document.querySelector(".auth-row");
const headerActions = document.querySelector(".header-actions");
const columnDialog = document.getElementById("column-dialog");
const columnForm = document.getElementById("column-form");
const columnDialogTitle = document.getElementById("column-dialog-title");
const columnNameInput = document.getElementById("column-name");
const columnTypeInput = document.getElementById("column-type");
const columnOptionsRow = document.getElementById("column-options-row");
const columnOptionsInput = document.getElementById("column-options");
const cancelColumnButton = document.getElementById("cancel-column");
const columnSubmitButton = document.getElementById("column-submit");
const tabDialog = document.getElementById("tab-dialog");
const tabForm = document.getElementById("tab-form");
const tabNameInput = document.getElementById("tab-name-input");
const tabSubmitButton = document.getElementById("tab-submit");
const tabCancelButton = document.getElementById("tab-cancel");
const tabDeleteDialog = document.getElementById("tab-delete-dialog");
const tabDeleteMessage = document.getElementById("tab-delete-message");
const tabDeleteCancel = document.getElementById("tab-delete-cancel");
const tabDeleteConfirm = document.getElementById("tab-delete-confirm");
const clearConfirmDialog = document.getElementById("clear-confirm-dialog");
const clearConfirmCancel = document.getElementById("clear-confirm-cancel");
const clearConfirmNext = document.getElementById("clear-confirm-next");
const clearFinalDialog = document.getElementById("clear-confirm-final-dialog");
const clearFinalCancel = document.getElementById("clear-final-cancel");
const clearFinalConfirm = document.getElementById("clear-final-confirm");
const aboutDialog = document.getElementById("about-dialog");
const aboutCloseButton = document.getElementById("about-close");
const helpDialog = document.getElementById("help-dialog");
const helpCloseButton = document.getElementById("help-close");
const helpButton = (() => {
  const btn = document.createElement("button");
  btn.id = "help-button";
  btn.type = "button";
  btn.className = "help-button";
  btn.textContent = "?";
  document.body.appendChild(btn);
  return btn;
})();
const authDialog = document.getElementById("auth-dialog");
const authForm = document.getElementById("auth-form");
const authNameRow = document.getElementById("auth-name-row");
const authNameInput = document.getElementById("auth-name");
const authEmailInput = document.getElementById("auth-email");
const authPasswordInput = document.getElementById("auth-password");
const authSendButton = document.getElementById("auth-send");
const authCloseButton = document.getElementById("auth-close");
const authMessage = document.getElementById("auth-message");
const setPasswordDialog = document.getElementById("set-password-dialog");
const setPasswordForm = document.getElementById("set-password-form");
const setPasswordInput = document.getElementById("set-password-input");
const setPasswordConfirm = document.getElementById("set-password-confirm");
const setPasswordMessage = document.getElementById("set-password-message");
const setPasswordSave = document.getElementById("set-password-save");
const requestAccessLink = document.getElementById("request-access-link");
const requestAccessDialog = document.getElementById("request-access-dialog");
const requestAccessForm = document.getElementById("request-access-form");
const requestAccessName = document.getElementById("request-access-name");
const requestAccessClose = document.getElementById("request-access-close");
const requestAccessThanks = document.getElementById("request-access-thanks");
const requestAccessThanksClose = document.getElementById("request-access-thanks-close");
const requestAccessMessage = document.getElementById("request-access-message");
const requestAccessSubmit = document.getElementById("request-access-submit");
const requestAccessBot = document.getElementById("request-access-bot");
const forgotPasswordLink = document.getElementById("forgot-password-link");
const resetPasswordDialog = document.getElementById("reset-password-dialog");
const resetPasswordEmailInput = document.getElementById("reset-password-email");
const resetPasswordMessage = document.getElementById("reset-password-message");
const resetPasswordSendButton = document.getElementById("reset-password-send");
const resetPasswordCloseButton = document.getElementById("reset-password-close");
const profileNameDialog = document.getElementById("profile-name-dialog");
const profileNameInput = document.getElementById("profile-name-input");
const profileNameSkipButton = document.getElementById("profile-name-skip");
const profileNameSaveButton = document.getElementById("profile-name-save");
const textPromptDialog = document.getElementById("text-prompt-dialog");
const textPromptTitle = document.getElementById("text-prompt-title");
const textPromptLabel = document.getElementById("text-prompt-label");
const textPromptInput = document.getElementById("text-prompt-input");
const textPromptCancelButton = document.getElementById("text-prompt-cancel");
const textPromptSaveButton = document.getElementById("text-prompt-save");
const csvImportDialog = document.getElementById("csv-import-dialog");
const csvImportColumns = document.getElementById("csv-import-columns");
const csvImportCancelButton = document.getElementById("csv-import-cancel");
const csvImportConfirmButton = document.getElementById("csv-import-confirm");
const csvImportSelectAllButton = document.getElementById("csv-import-select-all");
const csvImportSelectNoneButton = document.getElementById("csv-import-select-none");
const eventLogDialog = document.getElementById("event-log-dialog");
const eventLogList = document.getElementById("event-log-list");
const eventLogEmpty = document.getElementById("event-log-empty");
const eventLogSearch = document.getElementById("event-log-search");
const eventLogClearButton = document.getElementById("event-log-clear");
const eventLogCloseButton = document.getElementById("event-log-close");
const changelogDialog = document.getElementById("changelog-dialog");
const changelogList = document.getElementById("changelog-list");
const changelogCloseButton = document.getElementById("changelog-close");
const changelogLink = document.getElementById("changelog-link");
const statsDialog = document.getElementById("stats-dialog");
const statsContent = document.getElementById("stats-content");
const statsTitle = document.getElementById("stats-title");
const statsCloseButton = document.getElementById("stats-close");
const statsAdvancedButton = document.getElementById("stats-advanced");
const statsExportButton = document.getElementById("stats-export");
const statsInsightsButton = document.getElementById("stats-insights");
const statsNoBuyButton = document.getElementById("stats-no-buy");
const statsButton = document.getElementById("stats-button");
const recycleBinDialog = document.getElementById("recycle-bin-dialog");
const recycleBinList = document.getElementById("recycle-bin-list");
const recycleBinEmpty = document.getElementById("recycle-bin-empty");
const recycleBinCloseButton = document.getElementById("recycle-bin-close");
const recycleBinEmptyAllButton = document.getElementById("recycle-bin-empty-all");
const recycleBinLink = document.getElementById("recycle-bin-link");
const photoDialog = document.getElementById("photo-dialog");
const photoDialogImage = document.getElementById("photo-dialog-image");
const clearPhotoDialogButton = document.getElementById("clear-photo-dialog");
const closePhotoDialogButton = document.getElementById("close-photo-dialog");
const typeIconDialog = document.getElementById("type-icon-dialog");
const typeIconMessage = document.getElementById("type-icon-message");
const typeIconSelect = document.getElementById("type-icon-select");
const typeIconSkipButton = document.getElementById("type-icon-skip");
const typeIconSaveButton = document.getElementById("type-icon-save");

let columnEditId = null;
let sortTimer = null;
let deleteSelectedButton = null;
let pendingDeleteTabId = null;
let activeTagsRowId = null;
let lastClearSnapshot = null;
let latestStatsSnapshot = null;
const storageStatus = { ok: null };

const canUseLocalStorage = () => {
  if (storageStatus.ok !== null) return storageStatus.ok;
  try {
    const key = "__shirts_storage_test__";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    storageStatus.ok = true;
  } catch (error) {
    storageStatus.ok = false;
  }
  return storageStatus.ok;
};

const isShirtNameColumn = (column) => {
  const label = getColumnLabel(column).trim().toLowerCase();
  return label === "shirt name" || label === "name";
};

const normalizeNameColumnLabel = (column) => {
  if (!column) return false;
  const label = getColumnLabel(column).trim().toLowerCase();
  if (label !== "shirt name") return false;
  column.name = "Name";
  return true;
};

const normalizeNameColumns = (columns) => {
  if (!Array.isArray(columns)) return false;
  let changed = false;
  columns.forEach((column) => {
    if (normalizeNameColumnLabel(column)) changed = true;
  });
  return changed;
};

const normalizeNameColumnsInStorage = () => {
  if (!canUseLocalStorage() || !Array.isArray(tabsState.tabs) || !tabsState.tabs.length) return false;
  let changed = false;
  tabsState.tabs.forEach((tab) => {
    if (!tab || !tab.id) return;
    let parsed = null;
    try {
      const stored = localStorage.getItem(getStorageKey(tab.id));
      parsed = stored ? JSON.parse(stored) : null;
    } catch (error) {
      parsed = null;
    }
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.columns)) return;
    const tabChanged = normalizeNameColumns(parsed.columns);
    if (!tabChanged) return;
    changed = true;
    try {
      localStorage.setItem(getStorageKey(tab.id), JSON.stringify(parsed));
    } catch (error) {
      // ignore
    }
  });
  return changed;
};

const normalizeNameColumnsEverywhere = () => {
  let changed = normalizeNameColumns(state.columns);
  if (globalColumns) changed = normalizeNameColumns(globalColumns) || changed;
  if (changed && !state.readOnly) {
    saveState();
    if (globalColumns) saveColumnOverrides();
  }
  if (!state.readOnly && !isViewerSession) {
    normalizeNameColumnsInStorage();
  }
  return changed;
};

const normalizeSizeColumnOptions = (column) => {
  if (!column) return false;
  const label = getColumnLabel(column).trim().toLowerCase();
  if (label !== "size") return false;
  const current = (column.options || []).map((o) => String(o));
  const defaults = SIZE_OPTIONS_DEFAULT;
  const match = defaults.length === current.length && defaults.every((opt, i) => opt === current[i]);
  if (match) return false;
  column.options = defaults.slice();
  return true;
};

const normalizeSizeOptionsInColumns = (columns) => {
  if (!Array.isArray(columns)) return false;
  let changed = false;
  columns.forEach((column) => {
    if (normalizeSizeColumnOptions(column)) changed = true;
  });
  return changed;
};

const normalizeSizeOptionsInStorageForMode = (mode) => {
  if (!canUseLocalStorage()) return false;
  const tabsKey = mode === "wishlist" ? WISHLIST_TAB_STORAGE_KEY : TAB_STORAGE_KEY;
  const prefix = mode === "wishlist" ? WISHLIST_STORAGE_KEY : STORAGE_KEY;
  let tabs = [];
  try {
    const storedTabs = localStorage.getItem(tabsKey);
    const parsedTabs = storedTabs ? JSON.parse(storedTabs) : null;
    if (parsedTabs && Array.isArray(parsedTabs.tabs)) {
      tabs = parsedTabs.tabs;
    }
  } catch (error) {
    tabs = [];
  }
  let changed = false;
  tabs.forEach((tab) => {
    if (!tab || !tab.id) return;
    let parsed = null;
    try {
      const stored = localStorage.getItem(`${prefix}:${tab.id}`);
      parsed = stored ? JSON.parse(stored) : null;
    } catch (error) {
      parsed = null;
    }
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.columns)) return;
    const tabChanged = normalizeSizeOptionsInColumns(parsed.columns);
    if (!tabChanged) return;
    changed = true;
    try {
      localStorage.setItem(`${prefix}:${tab.id}`, JSON.stringify(parsed));
    } catch (error) {
      // ignore
    }
  });
  return changed;
};

const normalizeSizeOptionsInStoredGlobals = (mode) => {
  if (!canUseLocalStorage()) return false;
  const columnsKey = mode === "wishlist" ? WISHLIST_COLUMNS_KEY : COLUMNS_KEY;
  let parsed = null;
  try {
    const stored = localStorage.getItem(columnsKey);
    parsed = stored ? JSON.parse(stored) : null;
  } catch (error) {
    parsed = null;
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.globalColumns)) return false;
  const changed = normalizeSizeOptionsInColumns(parsed.globalColumns);
  if (!changed) return false;
  try {
    localStorage.setItem(columnsKey, JSON.stringify(parsed));
  } catch (error) {
    // ignore
  }
  return true;
};

const normalizeSizeOptionsEverywhere = () => {
  let changed = normalizeSizeOptionsInColumns(state.columns);
  if (globalColumns) changed = normalizeSizeOptionsInColumns(globalColumns) || changed;
  if (changed && !state.readOnly) {
    saveState();
    if (globalColumns) saveColumnOverrides();
  }
  if (!state.readOnly && !isViewerSession) {
    normalizeSizeOptionsInStorageForMode("inventory");
    normalizeSizeOptionsInStorageForMode("wishlist");
    normalizeSizeOptionsInStoredGlobals("inventory");
    normalizeSizeOptionsInStoredGlobals("wishlist");
  }
  return changed;
};

const getStorageKey = (tabId) => {
  const prefix = appMode === "wishlist" ? WISHLIST_STORAGE_KEY : STORAGE_KEY;
  return `${prefix}:${tabId || "default"}`;
};

const getActiveTabKey = () => appMode === "wishlist" ? WISHLIST_TAB_STORAGE_KEY : TAB_STORAGE_KEY;
const getActiveColumnsKey = () => appMode === "wishlist" ? WISHLIST_COLUMNS_KEY : COLUMNS_KEY;

const getActiveTabName = () => {
  const active = tabsState.tabs.find((tab) => tab.id === tabsState.activeTabId);
  return active ? active.name : "";
};

const getTabRowCount = (tabId) => {
  if (tabId === tabsState.activeTabId) return state.rows.length;
  try {
    const stored = localStorage.getItem(getStorageKey(tabId));
    if (!stored) return 0;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed.rows) ? parsed.rows.length : 0;
  } catch (error) {
    return 0;
  }
};

const loadEventLog = () => {
  try {
    const stored = localStorage.getItem(EVENT_LOG_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const saveEventLog = (entries) => {
  try {
    localStorage.setItem(EVENT_LOG_KEY, JSON.stringify(entries));
  } catch (error) {
    // ignore
  }
};

const loadDeletedRows = () => {
  try {
    const stored = localStorage.getItem(DELETED_ROWS_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const saveDeletedRows = (entries) => {
  try {
    localStorage.setItem(DELETED_ROWS_KEY, JSON.stringify(entries));
  } catch (error) {
    // ignore
  }
};

const purgeExpiredDeletedRows = () => {
  const entries = loadDeletedRows();
  const cutoff = Date.now() - DELETED_ROWS_PURGE_DAYS * 24 * 60 * 60 * 1000;
  const kept = entries.filter((entry) => new Date(entry.deletedAt).getTime() > cutoff);
  if (kept.length !== entries.length) {
    saveDeletedRows(kept);
  }
  return kept;
};

const addToDeletedRows = (rows, fromTabId, fromTabName, mode) => {
  const entries = loadDeletedRows();
  const now = new Date().toISOString();
  rows.forEach((row) => {
    entries.unshift({
      row: { id: row.id, cells: { ...(row.cells || {}) }, tags: Array.isArray(row.tags) ? [...row.tags] : [] },
      deletedAt: now,
      fromTabId,
      fromTabName,
      mode: mode || appMode,
      columns: state.columns.map((col) => ({ id: col.id, name: col.name, type: col.type, options: col.options ? [...col.options] : [] })),
    });
  });
  saveDeletedRows(entries);
};

const renderEventLog = (filterQuery) => {
  if (!eventLogList || !eventLogEmpty) return;
  const entries = loadEventLog();
  eventLogList.innerHTML = "";
  const query = (filterQuery || "").trim().toLowerCase();
  const filtered = query
    ? entries.filter((entry) => {
        const timeText = new Date(entry.at).toLocaleString();
        const searchable = [entry.action, entry.detail, entry.tabName, timeText]
          .filter(Boolean).join(" ").toLowerCase();
        return searchable.includes(query);
      })
    : entries;
  if (!filtered.length) {
    eventLogEmpty.style.display = "block";
    eventLogEmpty.textContent = query ? "No matching events." : "No events yet.";
    return;
  }
  eventLogEmpty.style.display = "none";
  filtered.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "event-log-item";
    const time = new Date(entry.at);
    const timeText = Number.isNaN(time.getTime()) ? entry.at : time.toLocaleString();
    const meta = document.createElement("div");
    meta.className = "event-log-time";
    const tabSuffix = entry.tabName ? ` - ${entry.tabName}` : "";
    meta.textContent = `${timeText}${tabSuffix}`;
    const message = document.createElement("div");
    message.textContent = entry.detail ? `${entry.action} - ${entry.detail}` : entry.action;
    item.appendChild(meta);
    item.appendChild(message);
    if (entry.snapshot) {
      item.setAttribute("data-has-snapshot", "true");
      const hint = document.createElement("div");
      hint.className = "event-log-expand-hint";
      hint.textContent = "Click for details";
      item.appendChild(hint);
      const snapDiv = document.createElement("div");
      snapDiv.className = "event-log-snapshot";
      const snapData = Array.isArray(entry.snapshot) ? entry.snapshot : [entry.snapshot];
      snapData.forEach((rowSnap, idx) => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "event-log-snapshot-row";
        if (snapData.length > 1) {
          const rowLabel = document.createElement("div");
          rowLabel.style.fontWeight = "600";
          rowLabel.style.marginBottom = "2px";
          rowLabel.textContent = "Row " + (idx + 1);
          rowDiv.appendChild(rowLabel);
        }
        Object.entries(rowSnap).forEach(([key, val]) => {
          const line = document.createElement("div");
          line.textContent = key + ": " + val;
          rowDiv.appendChild(line);
        });
        snapDiv.appendChild(rowDiv);
      });
      item.appendChild(snapDiv);
      item.addEventListener("click", () => {
        snapDiv.classList.toggle("open");
        hint.textContent = snapDiv.classList.contains("open") ? "Click to collapse" : "Click for details";
      });
    }
    eventLogList.appendChild(item);
  });
};

const snapshotRow = (row) => {
  if (!row || !row.cells) return {};
  const snap = {};
  state.columns.forEach((col) => {
    if (col.type === "photo") return;
    const label = getColumnLabel(col);
    const val = row.cells[col.id];
    if (val) snap[label] = String(val);
  });
  const tags = Array.isArray(row.tags) ? row.tags.filter(Boolean) : [];
  if (tags.length) snap["Tags"] = tags.join(", ");
  return snap;
};

const addEventLog = (action, detail = "", snapshot = null) => {
  const entries = loadEventLog();
  const entry = {
    id: createId(),
    at: new Date().toISOString(),
    action,
    detail,
    tabName: getActiveTabName(),
  };
  if (snapshot) entry.snapshot = snapshot;
  entries.unshift(entry);
  if (entries.length > EVENT_LOG_LIMIT) {
    entries.length = EVENT_LOG_LIMIT;
  }
  saveEventLog(entries);
  renderEventLog();
  scheduleSync();
};

const getShirtNameColumnId = () => {
  const column = state.columns.find((col) => isShirtNameColumn(col));
  return column ? column.id : null;
};

const getRowName = (row) => {
  if (!row || !row.cells) return "Untitled row";
  const nameColumnId = getShirtNameColumnId();
  if (!nameColumnId) return "Untitled row";
  const value = row.cells[nameColumnId];
  const name = String(value || "").trim();
  return name || "Untitled row";
};

const truncateLogValue = (value, max = 60) => {
  const text = String(value || "").trim();
  if (!text) return "empty";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
};

const isPhotoColumn = (column) => {
  if (!column) return false;
  if (column.type === "photo") return true;
  const label = getColumnLabel(column).trim().toLowerCase();
  return label === "preview";
};

const logRowChange = (rowId, columnId, prevValue, nextValue) => {
  if (suppressShirtUpdate) return;
  const column = state.columns.find((col) => col.id === columnId);
  if (!column) return;
  const prevText = truncateLogValue(prevValue);
  const nextText = truncateLogValue(nextValue);
  if (prevText === nextText) return;
  if (isShirtNameColumn(column)) {
    if (prevText === "empty" && nextText !== "empty") {
      addEventLog("Added row", nextText);
      return;
    }
    addEventLog("Renamed row", `${prevText} -> ${nextText}`);
    return;
  }
  const row = state.rows.find((item) => item.id === rowId);
  const rowName = getRowName(row);
  const label = getColumnLabel(column);
  if (isPhotoColumn(column)) {
    let change = "photo updated";
    if (!prevValue && nextValue) change = "photo added";
    if (prevValue && !nextValue) change = "photo removed";
    addEventLog("Updated row", `${rowName} - ${label}: ${change}`);
    return;
  }
  addEventLog("Updated row", `${rowName} - ${label}: ${prevText} -> ${nextText}`);
};

const formatRowNameList = (rows) => {
  const names = rows.map((row) => getRowName(row));
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;
};

const editStartValues = new Map();
const getEditKey = (rowId, columnId) => `${rowId}:${columnId}`;

const rememberEditStart = (rowId, columnId) => {
  if (!rowId || !columnId) return;
  const key = getEditKey(rowId, columnId);
  if (editStartValues.has(key)) return;
  const row = state.rows.find((item) => item.id === rowId);
  const value = row && row.cells ? row.cells[columnId] : "";
  editStartValues.set(key, value ?? "");
};

const consumeEditStart = (rowId, columnId) => {
  if (!rowId || !columnId) return null;
  const key = getEditKey(rowId, columnId);
  const value = editStartValues.get(key);
  editStartValues.delete(key);
  return value;
};

const saveTabsState = () => {
  try {
    sortTabs();
    localStorage.setItem(getActiveTabKey(), JSON.stringify(tabsState));
  } catch (error) {
    console.warn("Local storage unavailable", error);
  }
};

const loadColumnOverrides = () => {
  try {
    const stored = localStorage.getItem(getActiveColumnsKey());
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object") {
        if (parsed.fandomOptionsByTab) {
          columnOverrides.fandomOptionsByTab = parsed.fandomOptionsByTab;
        }
        if (parsed.typeOptionsByTab) {
          columnOverrides.typeOptionsByTab = parsed.typeOptionsByTab;
        }
        if (parsed.hiddenColumnsByTab) {
          columnOverrides.hiddenColumnsByTab = parsed.hiddenColumnsByTab;
        }
        if (parsed.brandOptionsByTab) {
          columnOverrides.brandOptionsByTab = parsed.brandOptionsByTab;
        }
        if (parsed.globalColumns) {
          globalColumns = parsed.globalColumns;
        }
      }
    }
  } catch (error) {
    console.warn("Local storage unavailable", error);
  }
};

const saveColumnOverrides = () => {
  try {
    localStorage.setItem(getActiveColumnsKey(), JSON.stringify({
      fandomOptionsByTab: columnOverrides.fandomOptionsByTab,
      typeOptionsByTab: columnOverrides.typeOptionsByTab,
      hiddenColumnsByTab: columnOverrides.hiddenColumnsByTab,
      brandOptionsByTab: columnOverrides.brandOptionsByTab || {},
      globalColumns,
    }));
  } catch (error) {
    console.warn("Local storage unavailable", error);
  }
};

const getHiddenColumnIds = () => {
  const tabId = tabsState.activeTabId;
  if (!tabId) return new Set();
  const ids = columnOverrides.hiddenColumnsByTab[tabId];
  return new Set(Array.isArray(ids) ? ids : []);
};

const getVisibleColumns = () => {
  const hidden = getHiddenColumnIds();
  if (hidden.size === 0) return state.columns;
  return state.columns.filter((col) => !hidden.has(col.id));
};

const setGlobalColumns = (columns) => {
  globalColumns = columns.map((column) => {
    const next = { ...column };
    const label = getColumnLabel(column).trim().toLowerCase();
    if (label === "fandom" || label === "type" || label === "brand") {
      next.options = [];
      next.type = "select";
    }
    return next;
  });
  saveColumnOverrides();
};

const applyGlobalColumns = () => {
  if (!globalColumns || !Array.isArray(globalColumns)) return;
  state.columns = globalColumns.map((column) => ({ ...column }));
};

const remapRowsToGlobalColumns = (previousColumns) => {
  if (!globalColumns || !Array.isArray(globalColumns) || !Array.isArray(previousColumns)) return;
  const prevMap = new Map(
    previousColumns.map((column) => [getColumnLabel(column).trim().toLowerCase(), column.id])
  );
  const nextMap = new Map(
    globalColumns.map((column) => [getColumnLabel(column).trim().toLowerCase(), column.id])
  );
  const idMap = new Map();
  prevMap.forEach((prevId, label) => {
    const nextId = nextMap.get(label);
    if (nextId) idMap.set(prevId, nextId);
  });
  state.rows = state.rows.map((row) => {
    if (!row.cells) return row;
    const nextCells = {};
    Object.keys(row.cells).forEach((key) => {
      const mapped = idMap.get(key);
      if (mapped) nextCells[mapped] = row.cells[key];
    });
    return { ...row, cells: nextCells };
  });
};

const ensureFandomInGlobalColumns = () => {
  if (!globalColumns || !Array.isArray(globalColumns)) return;
  const hasFandom = globalColumns.some(
    (column) => getColumnLabel(column).trim().toLowerCase() === "fandom"
  );
  if (hasFandom) return;
  const column = {
    id: createId(),
    name: "Fandom",
    type: "select",
    options: [],
  };
  globalColumns.push(column);
  setGlobalColumns(globalColumns);
};

const getEmbeddedTabs = () => {
  const embedded = document.getElementById("embedded-tabs");
  if (embedded && embedded.textContent && embedded.textContent.trim() !== "{}") {
    try {
      const parsed = JSON.parse(embedded.textContent);
      if (parsed && typeof parsed === "object") return parsed;
    } catch (error) {
      console.warn("Failed to load embedded tabs", error);
    }
  }
  return null;
};

const sortTabs = () => {
  // Manual tab order is user-defined (supports drag-and-drop reordering).
  // Keep current array order intact.
  tabsState.tabs = Array.isArray(tabsState.tabs) ? tabsState.tabs : [];
};

const setDefaultTabsState = () => {
  const tab = { id: createId(), name: "Shirts" };
  tabsState.tabs = [tab];
  tabsState.activeTabId = tab.id;
};

const shouldResetLegacyTabs = () => {
  const legacyNames = ["7-Strong", "Dixxon", "Park Candy", "Project Good", "Reyn Spooner", "RSVLTS"];
  if (!Array.isArray(tabsState.tabs) || tabsState.tabs.length !== legacyNames.length) return false;
  const names = tabsState.tabs.map((tab) => tab.name);
  if (!names.every((name) => legacyNames.includes(name))) return false;
  return !tabsState.tabs.some((tab) => {
    if (!tab || !tab.id) return false;
    try {
      const stored = localStorage.getItem(getStorageKey(tab.id));
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed?.columns) && parsed.columns.length > 0;
    } catch (error) {
      return false;
    }
  });
};

const clearLegacyTabStorage = () => {
  if (!Array.isArray(tabsState.tabs)) return;
  tabsState.tabs.forEach((tab) => {
    if (!tab || !tab.id) return;
    try {
      localStorage.removeItem(getStorageKey(tab.id));
    } catch (error) {
      // ignore
    }
  });
  try {
    localStorage.removeItem(TAB_STORAGE_KEY);
  } catch (error) {
    // ignore
  }
  try {
    localStorage.removeItem("tab-logos-map");
  } catch (error) {
    // ignore
  }
};

const loadTabsState = () => {
  let stored = null;
  try {
    stored = localStorage.getItem(TAB_STORAGE_KEY);
  } catch (error) {
    console.warn("Local storage unavailable", error);
  }
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object") {
        tabsState.tabs = Array.isArray(parsed.tabs) ? parsed.tabs : [];
        tabsState.activeTabId = parsed.activeTabId || (tabsState.tabs[0] && tabsState.tabs[0].id);
        tabsState.isEmbeddedBackup = false;
        sortTabs();
        if (shouldResetLegacyTabs()) {
          clearLegacyTabStorage();
          setDefaultTabsState();
          saveTabsState();
        }
        return;
      }
    } catch (error) {
      console.warn("Failed to load tabs", error);
    }
  }
  const embeddedTabs = getEmbeddedTabs();
  if (embeddedTabs && Array.isArray(embeddedTabs.tabs)) {
    tabsState.tabs = embeddedTabs.tabs;
    tabsState.activeTabId = embeddedTabs.activeTabId || (tabsState.tabs[0] && tabsState.tabs[0].id);
    tabsState.embeddedData = embeddedTabs.data && typeof embeddedTabs.data === "object"
      ? embeddedTabs.data
      : null;
    tabsState.isEmbeddedBackup = true;
    sortTabs();
    saveTabsState();
    if (shouldResetLegacyTabs()) {
      clearLegacyTabStorage();
      setDefaultTabsState();
      saveTabsState();
    }
    if (embeddedTabs.data && typeof embeddedTabs.data === "object") {
      tabsState.tabs.forEach((tab) => {
        const payload = embeddedTabs.data[tab.id];
        if (!payload) return;
        try {
          localStorage.setItem(getStorageKey(tab.id), JSON.stringify(payload));
        } catch (error) {
          console.warn("Local storage unavailable", error);
        }
      });
    }
    return;
  }
  setDefaultTabsState();
  saveTabsState();
};

const serializeState = () => ({
  columns: state.columns,
  rows: state.rows,
  columnWidths: state.columnWidths,
  sort: state.sort,
  filter: state.filter,
  readOnly: state.readOnly,
});

const saveState = () => {
  try {
    const key = getStorageKey(tabsState.activeTabId);
    localStorage.setItem(key, JSON.stringify(serializeState()));
  } catch (error) {
    console.warn("Local storage unavailable", error);
  }
  if (!canUseLocalStorage() && tabsState.embeddedData && tabsState.activeTabId) {
    tabsState.embeddedData[tabsState.activeTabId] = serializeState();
  }
  scheduleSync();
};

let shirtUpdateTimestamp = null;

const formatDateTimeLocal = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const setShirtUpdateTimestamp = (value) => {
  const iso = value instanceof Date ? value.toISOString() : value;
  shirtUpdateTimestamp = iso;
  if (shirtUpdateDateInput) {
    shirtUpdateDateInput.value = formatDateTimeLocal(iso);
  }
  updateHeaderSubtitle();
};

const loadShirtUpdateDate = () => {
  try {
    const stored = localStorage.getItem("shirt-update-date");
    if (stored) setShirtUpdateTimestamp(stored);
  } catch (error) {
    console.warn("Local storage unavailable", error);
  }
};

const updateShirtUpdateDate = () => {
  if (suppressShirtUpdate) return;
  const now = new Date();
  const value = now.toISOString();
  setShirtUpdateTimestamp(value);
  try {
    localStorage.setItem("shirt-update-date", value);
  } catch (error) {
    console.warn("Local storage unavailable", error);
  }
  setBackupTimestamp(LAST_CHANGE_KEY, now.getTime());
  updateUnsavedStatus();
};

const getOrCreatePublicShareId = () => {
  if (!canUseLocalStorage()) return "";
  try {
    const stored = localStorage.getItem(PUBLIC_SHARE_KEY);
    if (stored) return stored;
    const created = createId();
    localStorage.setItem(PUBLIC_SHARE_KEY, created);
    return created;
  } catch (error) {
    return "";
  }
};

const savePublicShareId = (value) => {
  if (!canUseLocalStorage()) return;
  if (!value) return;
  try {
    localStorage.setItem(PUBLIC_SHARE_KEY, value);
  } catch (error) {
    // ignore
  }
};

const buildPublicShareLink = (token) => {
  if (!token) return "";
  if (PUBLIC_SHARE_BASE_URL) {
    return `${PUBLIC_SHARE_BASE_URL.replace(/\/$/, "")}/?share=${token}`;
  }
  return `${window.location.origin}${window.location.pathname}?share=${token}`;
};

const updatePublicShareLink = () => {
  if (!publicShareLinkInput) return;
  if (!currentUser || isViewerSession) {
    publicShareLinkInput.value = "";
    return;
  }
  const token = getOrCreatePublicShareId();
  publicShareLinkInput.value = buildPublicShareLink(token);
};

const copyPublicShareLink = async () => {
  if (!publicShareLinkInput) return;
  const value = publicShareLinkInput.value;
  if (!value) return;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      publicShareLinkInput.select();
      document.execCommand("copy");
    }
  } catch (error) {
    // ignore
  }
};

const normalizePublicShareVisibility = (value) => {
  if (!value || typeof value !== "object") {
    return { mode: "auto", columnIds: [] };
  }
  const mode = ["auto", "all", "custom"].includes(value.mode)
    ? value.mode
    : "auto";
  const columnIds = Array.isArray(value.columnIds)
    ? value.columnIds.filter(Boolean)
    : [];
  return { mode, columnIds };
};

const loadPublicShareVisibility = () => {
  if (!canUseLocalStorage()) return { mode: "auto", columnIds: [] };
  try {
    const stored = localStorage.getItem(PUBLIC_SHARE_VISIBILITY_KEY);
    return normalizePublicShareVisibility(stored ? JSON.parse(stored) : null);
  } catch (error) {
    return { mode: "auto", columnIds: [] };
  }
};

const savePublicShareVisibility = (value) => {
  if (!canUseLocalStorage()) return;
  try {
    localStorage.setItem(
      PUBLIC_SHARE_VISIBILITY_KEY,
      JSON.stringify(normalizePublicShareVisibility(value))
    );
  } catch (error) {
    // ignore
  }
};

const getShareableColumns = () => {
  const columns = Array.isArray(globalColumns) && globalColumns.length
    ? globalColumns
    : state.columns;
  return columns.map((column) => ({
    id: column.id,
    label: getColumnLabel(column),
    isPrice: getColumnLabel(column).trim().toLowerCase() === "price",
  }));
};

const updatePublicShareSummary = () => {
  if (!shareColumnsButton) return;
  const setShareColumnsButtonLabel = (main, sub) => {
    const mainSpan = document.createElement("span");
    mainSpan.className = "share-columns-label";
    mainSpan.textContent = main;
    const subSpan = document.createElement("span");
    subSpan.className = "share-columns-sub";
    subSpan.textContent = sub;
    shareColumnsButton.innerHTML = "";
    shareColumnsButton.appendChild(mainSpan);
    shareColumnsButton.appendChild(subSpan);
    if (PLATFORM === "mobile") {
      scheduleCopyShareSizing();
    } else {
if (PLATFORM === "desktop") {
  applyDesktopHeaderInlineLayout();
}
if (PLATFORM === "mobile") {
  applyMobileHeaderInlineLayout();
  window.addEventListener("resize", () => { applyMobileHeaderInlineLayout(); });
  window.addEventListener("orientationchange", () => { applyMobileHeaderInlineLayout(); });
}
    }
  };
  if (!currentUser || isViewerSession) {
    setShareColumnsButtonLabel("Share Columns", "Selected: Hide Price");
    if (shareColumnsSummary) shareColumnsSummary.textContent = "";
    return;
  }
  const columns = getShareableColumns();
  const total = columns.length;
  if (!total) {
    setShareColumnsButtonLabel("Share Columns", "Selected: None");
    if (shareColumnsSummary) shareColumnsSummary.textContent = "";
    return;
  }
  if (publicShareVisibility.mode === "all") {
    setShareColumnsButtonLabel("Share Columns", "Selected: All");
    if (shareColumnsSummary) shareColumnsSummary.textContent = "";
    return;
  }
  if (publicShareVisibility.mode === "custom") {
    const selected = new Set(publicShareVisibility.columnIds || []);
    const count = columns.filter((column) => selected.has(column.id)).length;
    setShareColumnsButtonLabel("Share Columns", `Selected: ${count}/${total}`);
    if (shareColumnsSummary) shareColumnsSummary.textContent = "";
    return;
  }
  setShareColumnsButtonLabel("Share Columns", "Selected: Hide Price");
  if (shareColumnsSummary) shareColumnsSummary.textContent = "";
};

const renderShareColumnsDialog = () => {
  if (!shareColumnsList) return;
  const columns = getShareableColumns();
  const mode = publicShareVisibility.mode || "auto";
  const selected = new Set(
    mode === "custom"
      ? publicShareVisibility.columnIds || []
      : columns.filter((column) => !column.isPrice).map((column) => column.id)
  );
  const inputs = shareColumnsDialog
    ? shareColumnsDialog.querySelectorAll("input[name=share-columns-mode]")
    : [];
  inputs.forEach((input) => {
    input.checked = input.value === mode;
  });
  shareColumnsList.innerHTML = "";
  columns.forEach((column) => {
    const item = document.createElement("label");
    item.className = "share-columns-item";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = column.id;
    checkbox.checked = selected.has(column.id);
    checkbox.disabled = mode !== "custom";
    item.appendChild(checkbox);
    const text = document.createElement("span");
    text.textContent = column.label;
    item.appendChild(text);
    shareColumnsList.appendChild(item);
  });
};

const getSelectedShareMode = () => {
  if (!shareColumnsDialog) return "auto";
  const inputs = shareColumnsDialog.querySelectorAll("input[name=share-columns-mode]");
  let mode = "auto";
  inputs.forEach((input) => {
    if (input.checked) mode = input.value;
  });
  return mode;
};

const updateShareColumnsCheckboxes = () => {
  if (!shareColumnsList) return;
  const mode = getSelectedShareMode();
  const disabled = mode !== "custom";
  shareColumnsList.querySelectorAll("input[type=checkbox]").forEach((checkbox) => {
    checkbox.disabled = disabled;
  });
};

const openShareColumnsDialog = () => {
  if (!shareColumnsDialog) return;
  renderShareColumnsDialog();
  openDialog(shareColumnsDialog);
};

const saveShareColumnsSelection = () => {
  if (!shareColumnsDialog) return;
  const mode = getSelectedShareMode();
  const selected = [];
  if (mode === "custom" && shareColumnsList) {
    shareColumnsList.querySelectorAll("input[type=checkbox]").forEach((checkbox) => {
      if (checkbox.checked) selected.push(checkbox.value);
    });
  }
  publicShareVisibility = { mode, columnIds: selected };
  savePublicShareVisibility(publicShareVisibility);
  updatePublicShareSummary();
  if (currentUser && supabase && !isViewerSession) {
    syncToSupabase();
  }
  closeDialog(shareColumnsDialog);
};

const setAuthLoading = (isLoading) => {
  if (publicShareToken) {
    if (!isLoading && document.body) document.body.classList.add("ready");
    return;
  }
  if (!document.body) return;
  if (isLoading) {
    document.body.setAttribute("data-auth", "loading");
  } else if (document.body.getAttribute("data-auth") === "loading") {
    document.body.setAttribute("data-auth", "signed-out");
  }
  // Reveal the page once auth state is determined (prevents flash of signed-out layout)
  if (!isLoading) document.body.classList.add("ready");
  const signedOutLogin = document.querySelector(".signedout-login");
  if (signedOutLogin) {
    signedOutLogin.style.display = isLoading ? "none" : "";
  }
  const authLoading = document.getElementById("auth-loading");
  if (authLoading) {
    authLoading.style.display = isLoading ? "block" : "none";
    if (isLoading) {
      authLoading.style.textAlign = "center";
      authLoading.style.margin = "0 auto";
      authLoading.style.width = "100%";
    } else {
      authLoading.style.textAlign = "";
      authLoading.style.margin = "";
      authLoading.style.width = "";
    }
  }
  if (authActionSignedOutButton) {
    authActionSignedOutButton.style.display = isLoading ? "none" : "";
  }
};

const clearAppLocalStorage = () => {
  const keysToKeep = [CURRENT_USER_KEY, APP_VERSION_KEY, APP_UPDATE_KEY];
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !keysToKeep.includes(key) && !key.startsWith("sb-")) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } });
};

const handleUserSwitch = (userId) => {
  if (!userId) return;
  try {
    const previousUserId = localStorage.getItem(CURRENT_USER_KEY);
    if (previousUserId && previousUserId !== userId) {
      clearAppLocalStorage();
      appMode = "inventory";
      tabsState.tabs = [];
      tabsState.activeTabId = null;
      globalColumns = null;
      columnOverrides.fandomOptionsByTab = {};
      columnOverrides.typeOptionsByTab = {};
      columnOverrides.hiddenColumnsByTab = {};
      columnOverrides.brandOptionsByTab = {};
      state.columns = [];
      state.rows = [defaultRow()];
      state.columnWidths = {};
      state.sort = { columnId: null, direction: "asc" };
      state.filter = { columnId: "all", query: "" };
      state.readOnly = false;
      savedModeState.inventory = null;
      savedModeState.wishlist = null;
    }
    localStorage.setItem(CURRENT_USER_KEY, userId);
  } catch (error) { /* ignore */ }
};

const setAuthStatus = () => {
  if (publicShareToken) {
    applyPublicShareMode();
    return;
  }
  if (!supabase) {
    document.body.setAttribute("data-auth", "signed-out");
    document.body.setAttribute("data-viewer", "false");
    authActionButton.textContent = "Sign In";
    authActionButton.classList.remove("auth-signed-in");
    authActionButton.classList.add("auth-signed-out");
    if (PLATFORM === "mobile") {
      authActionButton.style.setProperty("display", "none", "important");
    } else {
      authActionButton.style.display = "inline-flex";
    }
    if (authActionSignedOutButton) {
      authActionSignedOutButton.textContent = "Sign In";
      authActionSignedOutButton.style.display = "inline-flex";
    }
    positionAuthAction();
    if (PLATFORM === "mobile") syncAuthActionSizing();
    if (syncNowButton) syncNowButton.disabled = true;
    if (verifyBackupButton) verifyBackupButton.disabled = true;
    updateUnsavedStatus();
    updateHeaderSubtitle();

    positionTotalCount();
    updateFooterVersionLine();
    return;
  }
  if (currentUser) {
    document.body.setAttribute("data-auth", "signed-in");
    state.readOnly = false;
    clearReadOnlyMode();
    authActionButton.textContent = "Sign Out";
    authActionButton.classList.remove("auth-signed-out");
    authActionButton.classList.add("auth-signed-in");
    positionAuthAction();
    if (PLATFORM === "mobile") {
      syncAuthActionSizing();
      authActionButton.style.setProperty("display", "inline-flex", "important");
    } else {
      authActionButton.style.display = "inline-flex";
    }
    if (authActionSignedOutButton) {
      authActionSignedOutButton.style.display = "none";
    }
    if (syncNowButton) syncNowButton.disabled = false;
    if (verifyBackupButton) verifyBackupButton.disabled = false;
    updateUnsavedStatus();
    updateHeaderSubtitle();

    positionTotalCount();
    updatePublicShareLink();
    updatePublicShareSummary();
    maybePromptProfileName();
    /* Ensure the mode switcher + Stats button are in the DOM.
       renderModeSwitcher() on desktop physically moves #stats-button into
       a dynamic #mode-switcher-inline div. If the user was previously
       signed out (or the page idled past inactivity), that div was
       destroyed and the Stats button left detached. Calling here
       guarantees the UI is rebuilt as soon as auth is confirmed,
       regardless of whether loadRemoteState() later skips
       applyCloudPayload() (timestamp guard, network error, etc.).
       The function is idempotent — safe to call twice if
       applyCloudPayload() also triggers it. */
    renderModeSwitcher();
  } else {
    document.body.setAttribute("data-auth", "signed-out");
    document.body.setAttribute("data-viewer", "false");
    authActionButton.textContent = "Sign In";
    authActionButton.classList.remove("auth-signed-in");
    authActionButton.classList.add("auth-signed-out");
    if (PLATFORM === "mobile") {
      authActionButton.style.setProperty("display", "none", "important");
    } else {
      authActionButton.style.display = "inline-flex";
    }
    if (authActionSignedOutButton) {
      authActionSignedOutButton.textContent = "Sign In";
      authActionSignedOutButton.style.display = "inline-flex";
    }
    positionAuthAction();
    if (PLATFORM === "mobile") {
      syncAuthActionSizing();
      authActionButton.style.setProperty("display", "none", "important");
    } else {
      authActionButton.style.display = "inline-flex";
    }
    if (syncNowButton) syncNowButton.disabled = true;
    if (verifyBackupButton) verifyBackupButton.disabled = true;
    updateUnsavedStatus();
    updateHeaderSubtitle();

    positionTotalCount();
    updatePublicShareLink();
    updatePublicShareSummary();
    applySignedOutState();
  }
};

const applyViewerRedactions = () => {
  if (!isViewerSession) return;
  const visibility = publicShareVisibility || { mode: "auto", columnIds: [] };
  const priceColumn = state.columns.find(
    (column) => getColumnLabel(column).trim().toLowerCase() === "price"
  );
  if (visibility.mode === "custom") {
    const allowed = new Set(visibility.columnIds || []);
    state.columns = state.columns.filter((column) => allowed.has(column.id));
    state.rows.forEach((row) => {
      if (!row.cells) return;
      Object.keys(row.cells).forEach((key) => {
        if (!allowed.has(key)) delete row.cells[key];
      });
    });
    if (Array.isArray(globalColumns)) {
      globalColumns = globalColumns.filter((column) => allowed.has(column.id));
    }
    if (priceColumn && !allowed.has(priceColumn.id) && totalCostEl) {
      totalCostEl.style.display = "none";
    }
    return;
  }
  if (visibility.mode === "all") {
    return;
  }
  if (priceColumn) {
    state.columns = state.columns.filter((column) => column.id !== priceColumn.id);
    state.rows.forEach((row) => {
      if (row.cells) delete row.cells[priceColumn.id];
    });
  }
  if (Array.isArray(globalColumns)) {
    globalColumns = globalColumns.filter(
      (column) => getColumnLabel(column).trim().toLowerCase() !== "price"
    );
  }
  if (totalCostEl) {
    totalCostEl.style.display = "none";
  }
};

const openDialog = (dialog) => {
  if (!dialog) return;
  if (dialog.showModal) {
    try {
      dialog.showModal();
      return;
    } catch (error) {
      // fallthrough
    }
  }
  if (PLATFORM === "mobile") dialog.style.display = "block";
  dialog.setAttribute("open", "");
};

const resetDialogScroll = (dialog) => {
  if (!dialog) return;
  const body = dialog.querySelector(".dialog-body");
  const reset = () => {
    dialog.scrollTop = 0;
    if (body) body.scrollTop = 0;
  };
  reset();
  requestAnimationFrame(reset);
  setTimeout(reset, 0);
  setTimeout(reset, 50);
};

const closeDialog = (dialog) => {
  if (!dialog) return;
  if (dialog.close) {
    dialog.close();
    return;
  }
  dialog.removeAttribute("open");
  if (PLATFORM === "mobile") dialog.style.display = "none";
};

const showTextPrompt = (title, label, defaultValue) => {
  return new Promise((resolve) => {
    if (!textPromptDialog || !textPromptInput) { resolve(null); return; }
    if (textPromptTitle) textPromptTitle.textContent = title || "Enter Value";
    if (textPromptLabel) textPromptLabel.textContent = label || "Value";
    textPromptInput.value = defaultValue || "";
    textPromptInput.placeholder = "";
    let resolved = false;
    const cleanup = () => {
      if (resolved) return;
      resolved = true;
      textPromptSaveButton.removeEventListener("click", onSave);
      textPromptCancelButton.removeEventListener("click", onCancel);
      textPromptInput.removeEventListener("keydown", onKeydown);
      textPromptDialog.removeEventListener("cancel", onDialogCancel);
    };
    const onSave = () => {
      const val = textPromptInput.value;
      cleanup();
      closeDialog(textPromptDialog);
      resolve(val);
    };
    const onCancel = () => {
      cleanup();
      closeDialog(textPromptDialog);
      resolve(null);
    };
    const onKeydown = (e) => {
      if (e.key === "Enter") { e.preventDefault(); onSave(); }
    };
    const onDialogCancel = (e) => {
      e.preventDefault();
      onCancel();
    };
    textPromptSaveButton.addEventListener("click", onSave);
    textPromptCancelButton.addEventListener("click", onCancel);
    textPromptInput.addEventListener("keydown", onKeydown);
    textPromptDialog.addEventListener("cancel", onDialogCancel);
    openDialog(textPromptDialog);
    textPromptInput.focus();
    textPromptInput.select();
  });
};

const clearNode = (node) => {
  if (!node) return;
  while (node.firstChild) node.removeChild(node.firstChild);
};

const showCsvImportDialog = (columns, tagsIndex) => {
  return new Promise((resolve) => {
    if (!csvImportDialog || !csvImportColumns || !csvImportConfirmButton || !csvImportCancelButton) {
      resolve(null);
      return;
    }
    let resolved = false;
    const cleanup = () => {
      if (resolved) return;
      resolved = true;
      csvImportConfirmButton.removeEventListener("click", onConfirm);
      csvImportCancelButton.removeEventListener("click", onCancel);
      csvImportDialog.removeEventListener("cancel", onDialogCancel);
      if (csvImportSelectAllButton) csvImportSelectAllButton.removeEventListener("click", onSelectAll);
      if (csvImportSelectNoneButton) csvImportSelectNoneButton.removeEventListener("click", onSelectNone);
    };
    const getSelectedIndices = () => {
      const selected = new Set();
      const inputs = csvImportColumns.querySelectorAll("input[type='checkbox']");
      inputs.forEach((input) => {
        if (!input.checked) return;
        const idx = Number.parseInt(input.value, 10);
        if (!Number.isNaN(idx)) selected.add(idx);
      });
      return selected;
    };
    const getMode = () => {
      const selected = document.querySelector("input[name='csv-import-mode']:checked");
      return selected ? selected.value : "append";
    };
    const onConfirm = () => {
      const selected = getSelectedIndices();
      if (selected.size === 0) {
        alert("Select at least one column to import.");
        return;
      }
      const mode = getMode();
      cleanup();
      closeDialog(csvImportDialog);
      resolve({ selected, mode, tagsIndex });
    };
    const onCancel = () => {
      cleanup();
      closeDialog(csvImportDialog);
      resolve(null);
    };
    const onDialogCancel = () => {
      onCancel();
    };
    const onSelectAll = () => {
      const inputs = csvImportColumns.querySelectorAll("input[type='checkbox']");
      inputs.forEach((input) => { input.checked = true; });
    };
    const onSelectNone = () => {
      const inputs = csvImportColumns.querySelectorAll("input[type='checkbox']");
      inputs.forEach((input) => { input.checked = false; });
    };
    clearNode(csvImportColumns);
    columns.forEach((entry) => {
      const label = document.createElement("label");
      label.style.display = "flex";
      label.style.alignItems = "center";
      label.style.gap = "8px";
      label.style.margin = "6px 0";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = String(entry.index);
      checkbox.checked = true;
      const text = document.createElement("span");
      text.textContent = entry.label;
      label.appendChild(checkbox);
      label.appendChild(text);
      csvImportColumns.appendChild(label);
    });
    csvImportConfirmButton.addEventListener("click", onConfirm);
    csvImportCancelButton.addEventListener("click", onCancel);
    csvImportDialog.addEventListener("cancel", onDialogCancel);
    if (csvImportSelectAllButton) csvImportSelectAllButton.addEventListener("click", onSelectAll);
    if (csvImportSelectNoneButton) csvImportSelectNoneButton.addEventListener("click", onSelectNone);
    openDialog(csvImportDialog);
    resetDialogScroll(csvImportDialog);
  });
};

const openTagsDialog = (rowId) => {
  if (state.readOnly || !tagsDialog) return;
  activeTagsRowId = rowId;
  if (tagsInput) tagsInput.value = "";
  renderTagsDialog();
  openDialog(tagsDialog);
  if (tagsInput) tagsInput.focus();
};

let bulkTagsSelectedIds = [];

const openBulkTagsDialog = () => {
  if (state.readOnly || !bulkTagsDialog) return;
  const ids = bulkTagsSelectedIds.length ? bulkTagsSelectedIds : getSelectedRowIds();
  if (!ids.length) return;
  bulkTagsSelectedIds = ids.slice();
  if (bulkTagsCount) bulkTagsCount.textContent = `${ids.length} rows selected`;
  if (bulkTagsInput) bulkTagsInput.value = "";
  renderBulkTagSuggestions("");
  openDialog(bulkTagsDialog);
  if (bulkTagsInput) bulkTagsInput.focus();
};

// Mobile dialog fallback for older browsers without native <dialog> support
if (PLATFORM === "mobile") {
  const applyDialogFallback = (dialog) => {
    if (!dialog) return;
    if (typeof dialog.showModal !== "function") {
      dialog.style.display = "none";
    }
  };
  document.querySelectorAll("dialog").forEach((dialog) => {
    applyDialogFallback(dialog);
  });
}

// Mobile toast notification (not available on desktop)
const showToast = (message) => {
  if (PLATFORM !== "mobile" || !message) return;
  let toast = document.getElementById("mobile-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "mobile-toast";
    toast.style.position = "fixed";
    toast.style.left = "50%";
    toast.style.bottom = "20px";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = "#111111";
    toast.style.color = "#ffffff";
    toast.style.padding = "8px 12px";
    toast.style.borderRadius = "999px";
    toast.style.fontSize = "0.8rem";
    toast.style.zIndex = "9999";
    toast.style.boxShadow = "0 6px 16px rgba(0,0,0,0.2)";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.2s ease";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  if (toast._hideTimer) {
    clearTimeout(toast._hideTimer);
  }
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
  });
  toast._hideTimer = setTimeout(() => {
    toast.style.opacity = "0";
  }, 1400);
};

const openEventLogDialog = () => {
  if (eventLogSearch) eventLogSearch.value = "";
  renderEventLog();
  openDialog(eventLogDialog);
};

const renderRecycleBin = () => {
  if (!recycleBinList || !recycleBinEmpty) return;
  const entries = loadDeletedRows();
  recycleBinList.innerHTML = "";
  if (!entries.length) {
    recycleBinEmpty.style.display = "block";
    recycleBinEmpty.textContent = "Recycle bin is empty.";
    if (recycleBinEmptyAllButton) recycleBinEmptyAllButton.style.display = "none";
    return;
  }
  recycleBinEmpty.style.display = "none";
  if (recycleBinEmptyAllButton) recycleBinEmptyAllButton.style.display = "";
  entries.forEach((entry, idx) => {
    const item = document.createElement("div");
    item.className = "recycle-bin-item";
    const row = entry.row || {};
    const cols = Array.isArray(entry.columns) ? entry.columns : [];
    const nameCol = cols.find((c) => c.name === "Name" || c.name === "Shirt Name");
    const name = nameCol && row.cells ? String(row.cells[nameCol.id] || "").trim() : "";
    const displayName = name || "Untitled row";
    const deletedDate = new Date(entry.deletedAt);
    const daysAgo = Math.floor((Date.now() - deletedDate.getTime()) / (24 * 60 * 60 * 1000));
    const daysLeft = Math.max(0, DELETED_ROWS_PURGE_DAYS - daysAgo);
    const modeLabel = entry.mode === "wishlist" ? "Wishlist" : "Inventory";
    const meta = document.createElement("div");
    meta.className = "recycle-bin-meta";
    meta.textContent = `${deletedDate.toLocaleDateString()} - ${entry.fromTabName || "Unknown tab"} (${modeLabel}) - ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`;
    const nameEl = document.createElement("div");
    nameEl.className = "recycle-bin-name";
    nameEl.textContent = displayName;
    const details = document.createElement("div");
    details.className = "recycle-bin-details";
    cols.forEach((col) => {
      if (col.type === "photo") return;
      const val = row.cells ? row.cells[col.id] : null;
      if (val) {
        const line = document.createElement("div");
        line.textContent = `${col.name}: ${val}`;
        details.appendChild(line);
      }
    });
    const tags = Array.isArray(row.tags) ? row.tags.filter(Boolean) : [];
    if (tags.length) {
      const tagLine = document.createElement("div");
      tagLine.textContent = "Tags: " + tags.join(", ");
      details.appendChild(tagLine);
    }
    const actions = document.createElement("div");
    actions.className = "recycle-bin-actions";
    const restoreBtn = document.createElement("button");
    restoreBtn.type = "button";
    restoreBtn.className = "btn secondary";
    restoreBtn.textContent = "Restore";
    restoreBtn.style.cssText = "padding:4px 10px; font-size:0.75rem;";
    restoreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      restoreDeletedRow(idx);
    });
    const permDeleteBtn = document.createElement("button");
    permDeleteBtn.type = "button";
    permDeleteBtn.className = "btn danger-btn";
    permDeleteBtn.textContent = "Delete Forever";
    permDeleteBtn.style.cssText = "padding:4px 10px; font-size:0.75rem;";
    let deleteArmed = false;
    let deleteTimer = null;
    permDeleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (deleteArmed) {
        clearTimeout(deleteTimer);
        permanentlyDeleteRow(idx);
        return;
      }
      deleteArmed = true;
      permDeleteBtn.textContent = "Are you sure?";
      deleteTimer = setTimeout(() => {
        deleteArmed = false;
        permDeleteBtn.textContent = "Delete Forever";
      }, 3000);
    });
    actions.appendChild(restoreBtn);
    actions.appendChild(permDeleteBtn);
    item.appendChild(meta);
    item.appendChild(nameEl);
    item.appendChild(details);
    item.appendChild(actions);
    item.addEventListener("click", () => {
      details.classList.toggle("open");
    });
    recycleBinList.appendChild(item);
  });
};

const restoreDeletedRow = (idx) => {
  const entries = loadDeletedRows();
  if (idx < 0 || idx >= entries.length) return;
  const entry = entries[idx];
  const row = entry.row;
  const targetMode = entry.mode || "inventory";
  const targetTabId = entry.fromTabId;
  const targetTabName = entry.fromTabName;
  const storagePrefix = targetMode === "wishlist" ? WISHLIST_STORAGE_KEY : STORAGE_KEY;
  const tabStorageKey = targetMode === "wishlist" ? WISHLIST_TAB_STORAGE_KEY : TAB_STORAGE_KEY;
  let tabs = [];
  try {
    const stored = localStorage.getItem(tabStorageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      tabs = Array.isArray(parsed.tabs) ? parsed.tabs : [];
    }
  } catch (error) { /* ignore */ }
  const tabExists = tabs.some((t) => t.id === targetTabId);
  let restoreTabId = tabExists ? targetTabId : null;
  if (!restoreTabId && tabs.length > 0) {
    restoreTabId = tabs[0].id;
  }
  if (!restoreTabId) {
    alert("No tabs available to restore to. Please create a tab first.");
    return;
  }
  const tabKey = `${storagePrefix}:${restoreTabId}`;
  try {
    const stored = localStorage.getItem(tabKey);
    const parsed = stored ? JSON.parse(stored) : null;
    if (parsed && typeof parsed === "object") {
      const rows = Array.isArray(parsed.rows) ? parsed.rows : [];
      const isOnlyDefault = rows.length === 1 && Object.values(rows[0].cells || {}).every((v) => !v);
      if (isOnlyDefault) {
        parsed.rows = [row];
      } else {
        parsed.rows.push(row);
      }
      localStorage.setItem(tabKey, JSON.stringify(parsed));
    } else {
      const cols = Array.isArray(entry.columns) ? entry.columns : (targetMode === "wishlist" ? getWishlistDefaultColumns() : getDefaultColumns());
      localStorage.setItem(tabKey, JSON.stringify({
        columns: cols,
        rows: [row],
        columnWidths: {},
        sort: { columnId: null, direction: "asc" },
        filter: { columnId: "all", query: "" },
        readOnly: false,
      }));
    }
  } catch (error) {
    console.warn("Failed to restore row to tab", error);
    return;
  }
  entries.splice(idx, 1);
  saveDeletedRows(entries);
  const restoredTabName = tabExists ? targetTabName : (tabs[0] ? tabs[0].name : "first tab");
  addEventLog("Restored row from recycle bin", getRowNameFromEntry(entry), null);
  if (targetMode === appMode && restoreTabId === tabsState.activeTabId) {
    loadState();
    ensureRowCells();
    renderRows();
    renderFooter();
  }
  scheduleSync();
  renderRecycleBin();
};

const getRowNameFromEntry = (entry) => {
  if (!entry || !entry.row || !entry.row.cells) return "Untitled row";
  const cols = Array.isArray(entry.columns) ? entry.columns : [];
  const nameCol = cols.find((c) => c.name === "Name" || c.name === "Shirt Name");
  if (!nameCol) return "Untitled row";
  const val = String(entry.row.cells[nameCol.id] || "").trim();
  return val || "Untitled row";
};

const permanentlyDeleteRow = (idx) => {
  const entries = loadDeletedRows();
  if (idx < 0 || idx >= entries.length) return;
  const entry = entries[idx];
  addEventLog("Permanently deleted from recycle bin", getRowNameFromEntry(entry), null);
  entries.splice(idx, 1);
  saveDeletedRows(entries);
  scheduleSync();
  renderRecycleBin();
};

const emptyRecycleBin = () => {
  const entries = loadDeletedRows();
  if (!entries.length) return;
  addEventLog("Emptied recycle bin", `${entries.length} item${entries.length !== 1 ? "s" : ""} removed`, null);
  saveDeletedRows([]);
  scheduleSync();
  renderRecycleBin();
};

const openRecycleBinDialog = () => {
  purgeExpiredDeletedRows();
  renderRecycleBin();
  openDialog(recycleBinDialog);
};

const updateLastActivity = () => {
  if (!canUseLocalStorage()) return;
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  } catch (error) {
    // ignore
  }
};

const setBackupTimestamp = (key, value) => {
  if (!canUseLocalStorage()) return;
  try {
    localStorage.setItem(key, String(value));
  } catch (error) {
    // ignore
  }
};

const getBackupTimestamp = (key) => {
  if (!canUseLocalStorage()) return null;
  try {
    const stored = localStorage.getItem(key);
    const value = stored ? Number(stored) : null;
    return Number.isFinite(value) ? value : null;
  } catch (error) {
    return null;
  }
};

const getLastActivity = () => {
  if (!canUseLocalStorage()) return null;
  try {
    const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
    const value = stored ? Number(stored) : null;
    return Number.isFinite(value) ? value : null;
  } catch (error) {
    return null;
  }
};

const handleInactivityCheck = async () => {
  if (!supabase || !currentUser) return;
  const last = getLastActivity();
  if (!last) {
    updateLastActivity();
    return;
  }
  const idleMs = Date.now() - last;
  if (idleMs >= INACTIVITY_LIMIT_MS) {
    await supabase.auth.signOut();
  }
};

const formatDateTime = (value) => {
  if (!value) return "unknown";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toLocaleString();
};

const getShareTokenFromUrl = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("share") || params.get("viewer");
    return token && token.trim() ? token.trim() : "";
  } catch (error) {
    return "";
  }
};

const applyPublicShareMode = () => {
  if (!publicShareToken) return;
  isViewerSession = true;
  state.readOnly = true;
  document.documentElement.setAttribute("data-public-share", "true");
  document.body.setAttribute("data-public-share", "true");
  document.body.setAttribute("data-auth", "signed-in");
  document.body.setAttribute("data-viewer", "true");
  if (PLATFORM === "desktop") {
    // Build the header layout first so DOM nodes exist, then hide auth buttons.
    applyDesktopHeaderInlineLayout();
  }
  if (authActionButton) {
    authActionButton.style.setProperty("display", "none", "important");
  }
  if (authActionSignedOutButton) {
    authActionSignedOutButton.style.setProperty("display", "none", "important");
  }
  const signedOutLogin = document.querySelector(".signedout-login");
  if (signedOutLogin) {
    signedOutLogin.style.display = "none";
  }
  setAuthLoading(false);
  if (shareColumnsButton) {
    shareColumnsButton.style.display = "none";
  }
  if (copyShareLinkButton) {
    copyShareLinkButton.style.display = "none";
  }
  if (bulkTagsButton) {
    bulkTagsButton.style.display = "none";
  }
  if (PLATFORM === "mobile") {
    if (syncNowButton) syncNowButton.disabled = true;
  } else {
    if (syncNowButton) syncNowButton.style.setProperty("display", "none", "important");
  }
  if (verifyBackupButton) verifyBackupButton.disabled = true;
  updateUnsavedStatus();
  updateHeaderSubtitle();
  positionTotalCount();
  applyReadOnlyMode();
  applyViewerRedactions();
};

const applyPublicSharePayload = (row) => {
  if (!row || !row.data) {
    console.warn("Public share data not found for token", publicShareToken);
    return;
  }
  publicShareLoaded = true;
  applyPublicShareMode();
  if (row.updated_at) {
    const parsed = Date.parse(row.updated_at);
    if (!Number.isNaN(parsed)) {
      setBackupTimestamp(LAST_CLOUD_UPDATE_KEY, parsed);
    }
  }
  suppressShirtUpdate = true;
  applyCloudPayload(row.data);
  suppressShirtUpdate = false;
  state.readOnly = true;
  applyReadOnlyMode();
  applyViewerRedactions();
  renderTable();
  renderFooter();
};

const isValidShareToken = (token) => {
  // Tokens are UUIDs generated by crypto.randomUUID() — reject anything that isn't UUID-shaped
  return typeof token === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
};

const loadPublicShareState = async (token) => {
  if (!supabase || !token) return;
  if (!isValidShareToken(token)) {
    console.warn("Invalid share token format — ignoring");
    return;
  }
  const { data, error } = await supabase
    .from("shirt_state")
    .select("data, updated_at, user_id")
    .filter("data->>publicShareId", "eq", token)
    .order("updated_at", { ascending: false })
    .limit(1);
  if (error || !data || !data.length) {
    console.warn("Failed to load public share state", error);
    return;
  }
  applyPublicSharePayload(data[0]);
};

const setBackupStatus = (message) => {
  if (!backupStatusText) return;
  backupStatusText.textContent = message;
};

const positionAuthAction = () => {
  if (!authActionButton) return;
  authActionButton.classList.remove("auth-compact");
  if (PLATFORM === "mobile") {
    const authSlot = document.getElementById("auth-action-cell");
    if (authSlot && authActionButton.parentElement !== authSlot) {
      authSlot.appendChild(authActionButton);
    }
  } else {
    const inlineCell = document.getElementById("auth-action-inline-cell");
    if (inlineCell) {
      if (authActionButton.parentElement !== inlineCell) {
        inlineCell.appendChild(authActionButton);
      }
      applyDesktopAuthButtonSizing();
      return;
    }
    if (authRow && authActionButton.parentElement !== authRow) {
      authRow.appendChild(authActionButton);
    }
    applyDesktopAuthButtonSizing();
  }
};

// --- Mobile-only layout helpers ---

const syncAuthActionSizing = () => {
  if (PLATFORM !== "mobile") return;
  if (!authActionButton || !syncNowButton) return;
  authActionButton.classList.remove("auth-compact");
  authActionButton.classList.remove("compact");
  const syncStyles = window.getComputedStyle(syncNowButton);
  authActionButton.style.setProperty("font-size", syncStyles.fontSize, "important");
  authActionButton.style.setProperty("padding", syncStyles.padding, "important");
  authActionButton.style.setProperty("min-width", syncStyles.minWidth, "important");
  authActionButton.style.setProperty("width", syncStyles.width, "important");
  authActionButton.style.setProperty("line-height", syncStyles.lineHeight, "important");
  authActionButton.style.setProperty("text-align", "center", "important");
  authActionButton.style.setProperty("justify-content", "center", "important");
  authActionButton.style.setProperty("box-sizing", "border-box", "important");
};

const syncCopyShareSizing = () => {
  if (PLATFORM !== "mobile") return;
  const copyShareButton = document.getElementById("copy-share-link");
  if (!copyShareButton || !shareColumnsButton) return;
  const shareStyles = window.getComputedStyle(shareColumnsButton);
  copyShareButton.style.setProperty("font-size", shareStyles.fontSize, "important");
  copyShareButton.style.setProperty("padding", shareStyles.padding, "important");
  copyShareButton.style.setProperty("min-width", shareStyles.minWidth, "important");
  copyShareButton.style.setProperty("width", shareStyles.width, "important");
  copyShareButton.style.setProperty("line-height", shareStyles.lineHeight, "important");
  copyShareButton.style.setProperty("height", shareStyles.height, "important");
  copyShareButton.style.setProperty("text-align", "center", "important");
  copyShareButton.style.setProperty("justify-content", "center", "important");
  copyShareButton.style.setProperty("box-sizing", "border-box", "important");
  copyShareButton.style.setProperty("white-space", "normal", "important");
};

const scheduleCopyShareSizing = () => {
  if (PLATFORM !== "mobile") return;
  syncCopyShareSizing();
  requestAnimationFrame(syncCopyShareSizing);
  setTimeout(syncCopyShareSizing, 80);
};

const setupCopyShareSizingObserver = () => {
  if (PLATFORM !== "mobile") return;
  if (copyShareSizingObserver || !shareColumnsButton || !copyShareLinkButton) return;
  if (typeof ResizeObserver === "function") {
    copyShareSizingObserver = new ResizeObserver(() => {
      scheduleCopyShareSizing();
    });
    copyShareSizingObserver.observe(shareColumnsButton);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      scheduleCopyShareSizing();
    });
  }
};

const applyMobileHeaderInlineLayout = () => {
  const table = document.querySelector("table.mobile-action-grid");
  if (!table) return;
  const tableWrap = document.getElementById("mobile-action-table-wrap");
  let inlineGrid = document.getElementById("mobile-action-inline-grid");
  if (!inlineGrid) {
    inlineGrid = document.createElement("div");
    inlineGrid.id = "mobile-action-inline-grid";
    if (tableWrap) {
      tableWrap.appendChild(inlineGrid);
    } else {
      table.parentNode.insertBefore(inlineGrid, table);
    }
    const addColumnButton = document.getElementById("add-column");
    const editColumnsButton = document.getElementById("toggle-columns");
    const chooseColumnsButton = document.getElementById("share-columns-button");
    const copyShareButton = document.getElementById("copy-share-link");
    const syncNowButton = document.getElementById("sync-now");
    const authActionButton = document.getElementById("auth-action");
    const statsBtn = document.getElementById("stats-button");
    const blankSlot = document.createElement("div");
    blankSlot.setAttribute("aria-hidden", "true");

    const rows = [
      [addColumnButton, editColumnsButton],
      [chooseColumnsButton, copyShareButton],
      [syncNowButton, authActionButton],
      [statsBtn],
    ];

    rows.forEach((rowButtons) => {
      const rowEl = document.createElement("div");
      rowEl.className = "mobile-action-inline-row";
      rowButtons.forEach((button) => {
        const cell = document.createElement("div");
        cell.className = "mobile-action-inline-cell";
        if (button) {
          if (button === authActionButton) {
            cell.id = "auth-action-inline-cell";
          }
          cell.appendChild(button);
        }
        rowEl.appendChild(cell);
      });
      inlineGrid.appendChild(rowEl);
    });

    table.style.display = "none";
  }

  if (headerActions) {
    headerActions.style.display = "flex";
    headerActions.style.flexDirection = "column";
    headerActions.style.alignItems = "stretch";
    headerActions.style.width = "100%";
    headerActions.style.gap = "12px";
  }

  if (dangerZone) {
    dangerZone.style.width = "100%";
    dangerZone.style.maxWidth = "100%";
    dangerZone.style.margin = "0 auto";
    dangerZone.style.alignItems = "stretch";
  }

  if (tableWrap) {
    tableWrap.style.width = "100%";
    tableWrap.style.display = "flex";
    tableWrap.style.justifyContent = "center";
  }

  inlineGrid.style.display = "flex";
  inlineGrid.style.flexDirection = "column";
  inlineGrid.style.gap = "8px";
  inlineGrid.style.width = "100%";
  inlineGrid.style.maxWidth = "560px";
  inlineGrid.style.margin = "0 auto";
  inlineGrid.style.boxSizing = "border-box";

  const rows = inlineGrid.querySelectorAll(".mobile-action-inline-row");
  rows.forEach((rowEl) => {
    rowEl.style.display = "flex";
    rowEl.style.gap = "8px";
    rowEl.style.width = "100%";
    rowEl.style.justifyContent = "center";
  });

  const cells = inlineGrid.querySelectorAll(".mobile-action-inline-cell");
  cells.forEach((cell) => {
    const isOnlyChild = cell.parentElement && cell.parentElement.querySelectorAll(".mobile-action-inline-cell").length === 1;
    cell.style.flex = "1 1 0";
    cell.style.maxWidth = isOnlyChild ? "100%" : "50%";
    cell.style.display = "flex";
    cell.style.justifyContent = "center";
    cell.style.alignItems = "center";
  });

  const buttons = inlineGrid.querySelectorAll(".btn");
  buttons.forEach((button) => {
    button.style.width = "100%";
    button.style.boxSizing = "border-box";
  });

  const blankCell = inlineGrid.querySelector("[aria-hidden='true']");
  if (blankCell) {
    blankCell.style.width = "100%";
    blankCell.style.minHeight = "36px";
  }

  positionAuthAction();
  syncAuthActionSizing();
  scheduleCopyShareSizing();
};

// --- Desktop-only layout helpers ---

function applyDesktopAuthButtonSizing() {
  if (PLATFORM !== "desktop") return;
  const syncNowButton = document.getElementById("sync-now");
  const authActionButton = document.getElementById("auth-action");
  [syncNowButton, authActionButton].forEach((button) => {
    if (!button) return;
    button.style.display = "inline-flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";
    button.style.textAlign = "center";
    button.style.setProperty("font-size", "12px", "important");
    button.style.setProperty("padding", "3px 8px", "important");
    button.style.setProperty("min-width", "0", "important");
    button.style.setProperty("width", "auto", "important");
    button.style.setProperty("line-height", "1.1", "important");
  });
}

function applyDesktopHeaderInlineLayout() {
  if (PLATFORM !== "desktop") return;
  const dangerZone = document.querySelector(".danger-zone");
  const headerActions = document.querySelector(".header-actions");
  if (!dangerZone) return;
  let inlineGrid = document.getElementById("desktop-action-inline-grid");
  const columnsRow = document.querySelector(".columns-row");
  const authRow = document.querySelector(".auth-row");
  const addColumnButton = document.getElementById("add-column");
  const editColumnsButton = document.getElementById("toggle-columns");
  const chooseColumnsButton = document.getElementById("share-columns-button");
  const syncNowButton = document.getElementById("sync-now");
  const authActionButton = document.getElementById("auth-action");

  if (!inlineGrid) {
    inlineGrid = document.createElement("div");
    inlineGrid.id = "desktop-action-inline-grid";
    dangerZone.insertBefore(inlineGrid, dangerZone.firstChild);
    if (columnsRow) columnsRow.style.display = "none";
    if (authRow) authRow.style.display = "none";

    const topRow = document.createElement("div");
    topRow.className = "desktop-action-inline-row";
    const bottomRow = document.createElement("div");
    bottomRow.className = "desktop-action-inline-row";

    const topButtons = [addColumnButton, editColumnsButton, chooseColumnsButton];
    topButtons.forEach((button) => {
      if (!button) return;
      topRow.appendChild(button);
    });

    const bottomButtons = [syncNowButton, authActionButton];
    bottomButtons.forEach((button) => {
      if (!button) return;
      if (button === authActionButton) {
        const cell = document.createElement("div");
        cell.id = "auth-action-inline-cell";
        cell.appendChild(button);
        bottomRow.appendChild(cell);
      } else {
        bottomRow.appendChild(button);
      }
    });

    inlineGrid.appendChild(topRow);
    inlineGrid.appendChild(bottomRow);
  }

  if (headerActions) {
    headerActions.style.display = "flex";
    headerActions.style.flexDirection = "column";
    headerActions.style.alignItems = "flex-end";
    headerActions.style.justifyContent = "flex-end";
    headerActions.style.width = "100%";
    headerActions.style.marginLeft = "auto";
  }

  if (dangerZone) {
    dangerZone.style.display = "flex";
    dangerZone.style.flexDirection = "column";
    dangerZone.style.alignItems = "flex-end";
    dangerZone.style.justifyContent = "flex-end";
    dangerZone.style.width = "100%";
  }

  inlineGrid.style.display = "flex";
  inlineGrid.style.flexDirection = "column";
  inlineGrid.style.alignItems = "flex-end";
  inlineGrid.style.gap = "8px";
  inlineGrid.style.width = "auto";

  const rows = inlineGrid.querySelectorAll(".desktop-action-inline-row");
  rows.forEach((rowEl) => {
    rowEl.style.display = "flex";
    rowEl.style.gap = "8px";
    rowEl.style.justifyContent = "flex-end";
    rowEl.style.alignItems = "center";
  });

  if (addColumnButton) {
    addColumnButton.style.minWidth = "140px";
    addColumnButton.style.textAlign = "center";
  }
  if (editColumnsButton) {
    editColumnsButton.style.minWidth = "140px";
    editColumnsButton.style.textAlign = "center";
  }
  if (chooseColumnsButton) {
    chooseColumnsButton.style.minWidth = "120px";
    chooseColumnsButton.style.padding = "6px 10px";
    chooseColumnsButton.style.fontSize = "0.75rem";
    chooseColumnsButton.style.lineHeight = "1.1";
    chooseColumnsButton.style.textAlign = "center";
    const label = chooseColumnsButton.querySelector(".share-columns-label");
    const sub = chooseColumnsButton.querySelector(".share-columns-sub");
    if (label) {
      label.style.fontSize = "0.75rem";
      label.style.fontWeight = "600";
    }
    if (sub) {
      sub.style.fontSize = "0.52rem";
      sub.style.fontWeight = "400";
    }
  }

  applyDesktopAuthButtonSizing();
  positionAuthAction();
}

// --- Apply initial layout ---
if (PLATFORM === "mobile") {
  requestAnimationFrame(applyMobileHeaderInlineLayout);
}

const positionTotalCount = () => {
  const target = PLATFORM === "mobile" ? totalsPanel : footerStats;
  if (!totalCountEl || !totalCostEl || !target) return;
  if (totalCountEl.parentElement !== target) {
    target.appendChild(totalCountEl);
  }
  if (totalCostEl.parentElement !== target) {
    target.appendChild(totalCostEl);
  }
};

const setUnsavedStatus = (message, status) => {
  if (!unsavedStatusText) return;
  unsavedStatusText.textContent = message;
  unsavedStatusText.style.display = "block";
  unsavedStatusText.classList.toggle("ok", status === "ok");
  unsavedStatusText.classList.toggle("alert", status === "alert");
};


const updateUnsavedStatus = () => {
  if (!unsavedStatusText) return;
  if (!supabase || !currentUser || isViewerSession) {
    setUnsavedStatus("Sign in to save and sync.", "ok");
    return;
  }
  const lastChange = getBackupTimestamp(LAST_CHANGE_KEY);
  const lastSync = getBackupTimestamp(LAST_SYNC_KEY);
  if (!lastSync) {
    setUnsavedStatus("No local save yet.", "ok");
    return;
  }
  const toleranceMs = 2 * 60 * 1000;
  if (lastChange && lastChange > lastSync + toleranceMs) {
    setUnsavedStatus("Unsaved local changes (not synced yet).", "alert");
    return;
  }
  setUnsavedStatus(`Last saved locally: ${formatDateTime(lastSync)}`, "ok");
};

const updateBackupStatusFromStorage = () => {
  if (!backupStatusText) return;
  const lastCloud = getBackupTimestamp(LAST_CLOUD_UPDATE_KEY);
  if (!lastCloud) {
  setBackupStatus("Cloud backup not checked yet.");
    updateUnsavedStatus();
    return;
  }
  setBackupStatus(`Last synced to cloud: ${formatDateTime(lastCloud)}`);
  updateUnsavedStatus();
};

const formatDiagnosticsTimestamp = (value) => {
  if (!value) return "unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return `${date.toLocaleString()} (${date.toISOString()})`;
};

const getSyncLagMs = (lastChange, lastSync) => {
  if (!lastChange || !lastSync) return null;
  return Math.max(0, lastChange - lastSync);
};

const renderSyncDiagnostics = () => {
  if (!syncDiagnosticsContent) return;
  const lastChange = getBackupTimestamp(LAST_CHANGE_KEY);
  const lastSync = getBackupTimestamp(LAST_SYNC_KEY);
  const lastCloud = getBackupTimestamp(LAST_CLOUD_UPDATE_KEY);
  const lagMs = getSyncLagMs(lastChange, lastSync);
  const lagText = lagMs === null ? "unknown" : `${Math.round(lagMs / 1000)}s`;
  const unsynced = lastChange && (!lastSync || lastChange > lastSync + 1000);
  const lines = [
    `Signed in: ${currentUser ? "yes" : "no"}`,
    `Viewer session: ${isViewerSession ? "yes" : "no"}`,
    `Sync in progress: ${isSyncing ? "yes" : "no"}`,
    `Debounce timer active: ${syncTimer ? "yes" : "no"}`,
    `Retry timer active: ${syncRetryTimer ? "yes" : "no"}`,
    `Pending unsynced edits: ${unsynced ? "yes" : "no"}`,
    `Retry attempts (since last success): ${syncRetryCount}`,
    `Sync lag: ${lagText}`,
    `Last local edit: ${formatDiagnosticsTimestamp(lastChange)}`,
    `Last successful cloud push: ${formatDiagnosticsTimestamp(lastSync)}`,
    `Last observed cloud update: ${formatDiagnosticsTimestamp(lastCloud)}`,
    `Last sync error: ${lastSyncErrorMessage || "none"}`,
    `Last sync error time: ${formatDiagnosticsTimestamp(lastSyncErrorAt)}`,
  ];
  syncDiagnosticsContent.textContent = lines.join("\n");
};

const updateAppUpdateDate = () => {
  if (!appUpdateDateInput) return;
  const parsed = new Date(LAST_COMMIT_DATE);
  appUpdateDateInput.value = Number.isNaN(parsed.getTime())
    ? ""
    : formatDateTimeLocal(parsed);
};

const updateFooterVersionLine = () => {
  if (!footerVersionLine) return;
  footerVersionLine.textContent = `Shirt Tracker ${APP_VERSION} © 2026 Aaron Dunn`;
};

const updateAboutVersionLine = () => {
  if (!aboutVersion) return;
  aboutVersion.textContent = `Shirt Tracker v${APP_VERSION}`;
};

updateFooterVersionLine();
updateAboutVersionLine();

const getShortVersion = () => {
  const parts = String(APP_VERSION).split(".");
  if (parts.length >= 2) return `${parts[0]}.${parts[1]}`;
  return APP_VERSION;
};

const TAB_LOGOS = {
  "7-Strong": "assets/brand-logos/7strong.png",
  Dixxon: "assets/brand-logos/dixxon.png",
  "Park Candy": "assets/brand-logos/parkcandy.png",
  "Project Good": "assets/brand-logos/projectgood.png",
  "Reyn Spooner": "assets/brand-logos/reynspooner.png",
  RSVLTS: "assets/brand-logos/rsvlts.png",
};

const loadLogoMap = () => {
  if (!canUseLocalStorage()) return {};
  try {
    const stored = localStorage.getItem("tab-logos-map");
    const parsed = stored ? JSON.parse(stored) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
};

const saveLogoMap = (map) => {
  if (!canUseLocalStorage()) return;
  try {
    localStorage.setItem("tab-logos-map", JSON.stringify(map));
  } catch (error) {
    // ignore
  }
};

const getCustomLogo = (tabId) => {
  if (!tabId) return "";
  const map = loadLogoMap();
  return map[tabId] || "";
};

const setCustomLogo = (tabId, value) => {
  if (!tabId) return;
  const map = loadLogoMap();
  map[tabId] = value;
  saveLogoMap(map);
};

let tabLogoRenderId = 0;

const updateTabLogo = async () => {
  if (!tabLogoPanel) return;
  if (appMode === "wishlist") {
    tabLogoPanel.style.display = "none";
    tabLogoPanel.innerHTML = "";
    return;
  }
  tabLogoPanel.style.display = "";
  const renderId = ++tabLogoRenderId;
  tabLogoPanel.innerHTML = "";
  const active = tabsState.tabs.find((tab) => tab.id === tabsState.activeTabId);
  if (!active) return;
  document.body.setAttribute("data-active-tab", active.name || "");
  const placeholder = document.createElement("div");
  placeholder.className = "tab-logo-placeholder";
  tabLogoPanel.appendChild(placeholder);
  const custom = getCustomLogo(active.id);
  const logoValue = custom || TAB_LOGOS[active.name];
  if (logoValue) {
    const img = document.createElement("img");
    const resolved = await getLogoSrc(logoValue);
    if (renderId !== tabLogoRenderId) return;
    img.src = resolved;
    img.alt = `${active.name} logo`;
    placeholder.remove();
    tabLogoPanel.appendChild(img);
  }
  const changeButton = document.createElement("button");
  changeButton.type = "button";
  changeButton.className = "btn secondary";
  changeButton.textContent = "Change Photo";
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";
  changeButton.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    const rawExt = (file.name.split(".").pop() || "png").toLowerCase();
    const compressed = await compressImage(file, rawExt, { maxDimension: 400 });
    if (supabase && currentUser) {
      const path = await uploadLogoToSupabase(compressed.blob, compressed.extension);
      if (path) {
        setCustomLogo(active.id, `supa:${path}`);
        updateTabLogo();
        return;
      }
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;
      setCustomLogo(active.id, result);
      updateTabLogo();
    };
    reader.readAsDataURL(compressed.blob);
  });
  tabLogoPanel.appendChild(changeButton);
  tabLogoPanel.appendChild(fileInput);
  if (renderId !== tabLogoRenderId) return;
};

const updateHeaderTitle = () => {
  if (!appTitleEl) return;
  const shortVersion = getShortVersion();
  if (PLATFORM === "mobile") {
    appTitleEl.innerHTML = `<picture><source srcset="assets/shirt-tracker-600.webp" type="image/webp"><img src="assets/shirt-tracker-600.png" alt="Shirt Tracker" width="600" height="173" style="max-width:min(500px, 90vw); width:100%; height:auto;"></picture>`;
  } else {
    appTitleEl.innerHTML = `<picture><source srcset="assets/shirt-tracker.webp" type="image/webp"><img src="assets/shirt-tracker.png" alt="Shirt Tracker" width="1000" height="289" style="max-width:min(500px, 90vw); height:auto; display:block; margin:0 auto; cursor:pointer;" title="Click to reload"></picture>`;
    appTitleEl.style.cursor = "pointer";
    appTitleEl.addEventListener("click", () => { location.reload(); });
  }
};

const formatDateOnly = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const getUserDisplayName = () => {
  if (!currentUser) return "";
  const meta = currentUser.user_metadata || {};
  const name = meta.full_name || meta.name || meta.display_name || "";
  return String(name || "").trim();
};

const hasPromptedProfileName = () => {
  if (currentUser) {
    const meta = currentUser.user_metadata || {};
    if (meta.display_name_skipped) return true;
  }
  if (!canUseLocalStorage()) return false;
  try {
    return localStorage.getItem(PROFILE_NAME_PROMPT_KEY) === "true";
  } catch (error) {
    return false;
  }
};

const setPromptedProfileName = () => {
  if (!canUseLocalStorage()) return;
  try {
    localStorage.setItem(PROFILE_NAME_PROMPT_KEY, "true");
  } catch (error) {
    // ignore
  }
};

const INVITE_FLOW_KEY = "shirt-tracker:invite-flow";
const inviteStorageStatus = { ok: null };
const canUseSessionStorage = () => {
  if (inviteStorageStatus.ok !== null) return inviteStorageStatus.ok;
  try {
    const key = "__shirt_invite_storage_test__";
    sessionStorage.setItem(key, "1");
    sessionStorage.removeItem(key);
    inviteStorageStatus.ok = true;
  } catch (error) {
    inviteStorageStatus.ok = false;
  }
  return inviteStorageStatus.ok;
};
const getInviteTypeFromUrl = () => {
  const hash = window.location.hash ? window.location.hash.replace(/^#/, "") : "";
  const hashParams = new URLSearchParams(hash);
  const searchParams = new URLSearchParams(window.location.search);
  return (hashParams.get("type") || searchParams.get("type") || "").toLowerCase();
};
const hasInviteInUrl = () => getInviteTypeFromUrl() === "invite";
const markInviteFlowSeen = () => {
  if (!hasInviteInUrl()) return;
  if (!canUseSessionStorage()) return;
  sessionStorage.setItem(INVITE_FLOW_KEY, "true");
};
const hasInviteFlow = () => {
  if (hasInviteInUrl()) return true;
  if (!canUseSessionStorage()) return false;
  return sessionStorage.getItem(INVITE_FLOW_KEY) === "true";
};
const clearInviteFlow = () => {
  if (!canUseSessionStorage()) return;
  sessionStorage.removeItem(INVITE_FLOW_KEY);
};
markInviteFlowSeen();

const maybePromptProfileName = () => {
  if (!supabase || !currentUser || isViewerSession) return;
  if (hasInviteFlow()) return;
  if (getUserDisplayName()) return;
  if (hasPromptedProfileName()) return;
  if (!profileNameDialog || !profileNameInput) return;
  profileNameInput.value = "";
  openDialog(profileNameDialog);
};

const updateHeaderSubtitle = () => {
  if (!appSubtitleEl) return;
  if (document.body.getAttribute("data-auth") === "signed-out") {
    appSubtitleEl.textContent = "An open-source, fan-made clothing inventory system for hobbyists.";
    return;
  }
  const dateValue = shirtUpdateTimestamp
    ? formatDateOnly(shirtUpdateTimestamp)
    : "not updated yet";
  const displayName = getUserDisplayName();
  appSubtitleEl.textContent = displayName
    ? `${displayName}'s Inventory as of ${dateValue}`
    : `Inventory as of ${dateValue}`;
};



const buildCloudPayload = () => {
  const inventoryTabs = appMode === "inventory" ? tabsState.tabs : (() => {
    try { const s = localStorage.getItem(TAB_STORAGE_KEY); return s ? JSON.parse(s).tabs || [] : []; } catch (e) { return []; }
  })();
  const inventoryActiveTabId = appMode === "inventory" ? tabsState.activeTabId : (() => {
    try { const s = localStorage.getItem(TAB_STORAGE_KEY); return s ? JSON.parse(s).activeTabId : null; } catch (e) { return null; }
  })();
  const inventoryTabStates = {};
  inventoryTabs.forEach((tab) => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}:${tab.id}`);
      if (stored) inventoryTabStates[tab.id] = JSON.parse(stored);
    } catch (error) { /* ignore */ }
  });
  const inventoryColumnOverrides = appMode === "inventory" ? columnOverrides : (() => {
    try { const s = localStorage.getItem(COLUMNS_KEY); return s ? JSON.parse(s) : {}; } catch (e) { return {}; }
  })();
  const inventoryGlobalColumns = appMode === "inventory" ? globalColumns : (() => {
    try { const s = localStorage.getItem(COLUMNS_KEY); return s ? JSON.parse(s).globalColumns || null : null; } catch (e) { return null; }
  })();

  const wishlistTabs = appMode === "wishlist" ? tabsState.tabs : (() => {
    try { const s = localStorage.getItem(WISHLIST_TAB_STORAGE_KEY); return s ? JSON.parse(s).tabs || [] : []; } catch (e) { return []; }
  })();
  const wishlistActiveTabId = appMode === "wishlist" ? tabsState.activeTabId : (() => {
    try { const s = localStorage.getItem(WISHLIST_TAB_STORAGE_KEY); return s ? JSON.parse(s).activeTabId : null; } catch (e) { return null; }
  })();
  const wishlistTabStates = {};
  wishlistTabs.forEach((tab) => {
    try {
      const stored = localStorage.getItem(`${WISHLIST_STORAGE_KEY}:${tab.id}`);
      if (stored) wishlistTabStates[tab.id] = JSON.parse(stored);
    } catch (error) { /* ignore */ }
  });
  const wishlistColOverrides = appMode === "wishlist" ? columnOverrides : (() => {
    try { const s = localStorage.getItem(WISHLIST_COLUMNS_KEY); return s ? JSON.parse(s) : {}; } catch (e) { return {}; }
  })();
  const wishlistGlobCols = appMode === "wishlist" ? globalColumns : (() => {
    try { const s = localStorage.getItem(WISHLIST_COLUMNS_KEY); return s ? JSON.parse(s).globalColumns || null : null; } catch (e) { return null; }
  })();

  const result = {
    tabs: inventoryTabs,
    activeTabId: inventoryActiveTabId,
    tabLogos: loadLogoMap(),
    eventLog: loadEventLog(),
    typeIconMap: loadTypeIconMap(),
    customTags: loadCustomTags(),
    tabStates: inventoryTabStates,
    columnOverrides: inventoryColumnOverrides,
    globalColumns: inventoryGlobalColumns,
    shirtUpdateDate: shirtUpdateTimestamp || null,
    publicShareId: getOrCreatePublicShareId(),
    publicShareVisibility,
    version: "2.1.1",
    deletedRows: purgeExpiredDeletedRows(),
  };
  if (wishlistTabs.length > 0) {
    result.wishlist = {
      tabs: wishlistTabs,
      activeTabId: wishlistActiveTabId,
      tabStates: wishlistTabStates,
      columnOverrides: wishlistColOverrides,
      globalColumns: wishlistGlobCols,
    };
  }
  // Include Got It log in cloud payload so it survives device/browser switches
  try {
    const gotItRaw = localStorage.getItem(GOT_IT_LOG_KEY);
    if (gotItRaw) result.gotItLog = JSON.parse(gotItRaw);
    const gotItTrimmed = localStorage.getItem(GOT_IT_LOG_KEY + ":trimmed");
    if (gotItTrimmed) result.gotItLogTrimmed = parseInt(gotItTrimmed, 10);
  } catch (e) { /* ignore */ }
  // Include no-buy game state in cloud payload for cross-device parity.
  try {
    const noBuyRaw = localStorage.getItem(NO_BUY_GAMIFY_KEY);
    if (noBuyRaw) {
      const parsed = JSON.parse(noBuyRaw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        result.noBuyGamify = parsed;
      }
    }
  } catch (e) { /* ignore */ }
  return result;
};

const enforceFixedDropdownDefaults = () => {
  const fixedDefaults = {
    condition: ["NWT", "NWOT", "EUC", "Other"],
    size: SIZE_OPTIONS_DEFAULT.slice(),
  };
  let changed = false;
  Object.entries(fixedDefaults).forEach(([label, defaults]) => {
    const col = state.columns.find((c) => getColumnLabel(c).trim().toLowerCase() === label);
    if (!col) return;
    const current = (col.options || []).map((o) => String(o));
    const match = defaults.length === current.length && defaults.every((opt, i) => opt === current[i]);
    if (!match) {
      col.options = defaults.slice();
      changed = true;
    }
  });
  if (changed) {
    setGlobalColumns(state.columns);
    saveState();
  }
};

const applyCloudPayload = (payload) => {
  if (!payload || typeof payload !== "object") return;
  if (Array.isArray(payload.tabs)) {
    if (appMode === "inventory") {
      const localActiveId = tabsState.activeTabId;
      tabsState.tabs = payload.tabs;
      const payloadActiveId = payload.activeTabId || (payload.tabs[0] && payload.tabs[0].id);
      if (localActiveId && payload.tabs.some((tab) => tab.id === localActiveId)) {
        tabsState.activeTabId = localActiveId;
      } else {
        tabsState.activeTabId = payloadActiveId;
      }
      saveTabsState();
    } else {
      try {
        localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify({ tabs: payload.tabs, activeTabId: payload.activeTabId }));
      } catch (error) { /* ignore */ }
    }
  }
  if (payload.tabLogos && typeof payload.tabLogos === "object") {
    saveLogoMap(payload.tabLogos);
  }
  if (Array.isArray(payload.eventLog)) {
    saveEventLog(payload.eventLog);
    renderEventLog();
  }
  if (payload.typeIconMap && typeof payload.typeIconMap === "object") {
    saveTypeIconMap(payload.typeIconMap);
  }
  if (Array.isArray(payload.customTags)) {
    saveCustomTags(payload.customTags);
  }
  if (Array.isArray(payload.deletedRows)) {
    saveDeletedRows(payload.deletedRows);
    purgeExpiredDeletedRows();
  }
  if (payload.publicShareId) {
    savePublicShareId(payload.publicShareId);
  }
  // Restore Got It log from cloud payload
  if (Array.isArray(payload.gotItLog)) {
    try {
      const existing = JSON.parse(localStorage.getItem(GOT_IT_LOG_KEY) || "[]");
      // Merge: cloud wins if local is empty, otherwise keep the longer log
      if (!existing.length || payload.gotItLog.length >= existing.length) {
        localStorage.setItem(GOT_IT_LOG_KEY, JSON.stringify(payload.gotItLog));
      }
    } catch (e) {
      localStorage.setItem(GOT_IT_LOG_KEY, JSON.stringify(payload.gotItLog));
    }
  }
  if (typeof payload.gotItLogTrimmed === "number" && payload.gotItLogTrimmed > 0) {
    const localTrimmed = parseInt(localStorage.getItem(GOT_IT_LOG_KEY + ":trimmed") || "0", 10);
    if (payload.gotItLogTrimmed >= localTrimmed) {
      localStorage.setItem(GOT_IT_LOG_KEY + ":trimmed", String(payload.gotItLogTrimmed));
    }
  }
  if (payload.noBuyGamify && typeof payload.noBuyGamify === "object" && !Array.isArray(payload.noBuyGamify)) {
    try {
      const localNoBuy = JSON.parse(localStorage.getItem(NO_BUY_GAMIFY_KEY) || "{}");
      const mergedNoBuy = mergeNoBuyGamifyState(localNoBuy, payload.noBuyGamify);
      localStorage.setItem(NO_BUY_GAMIFY_KEY, JSON.stringify(mergedNoBuy));
    } catch (error) {
      // fallback: cloud snapshot wins if merge fails
      try { localStorage.setItem(NO_BUY_GAMIFY_KEY, JSON.stringify(payload.noBuyGamify)); } catch (e) { /* ignore */ }
    }
  }
  if (payload.publicShareVisibility) {
    publicShareVisibility = normalizePublicShareVisibility(payload.publicShareVisibility);
    savePublicShareVisibility(publicShareVisibility);
    updatePublicShareSummary();
  }
  if (appMode === "inventory") {
    if (payload.columnOverrides) {
      columnOverrides.fandomOptionsByTab = payload.columnOverrides.fandomOptionsByTab || {};
      columnOverrides.typeOptionsByTab = payload.columnOverrides.typeOptionsByTab || {};
      columnOverrides.hiddenColumnsByTab = payload.columnOverrides.hiddenColumnsByTab || {};
      columnOverrides.brandOptionsByTab = payload.columnOverrides.brandOptionsByTab || {};
    }
    if (payload.globalColumns) {
      globalColumns = payload.globalColumns;
    }
    saveColumnOverrides();
  } else {
    if (payload.columnOverrides) {
      try {
        localStorage.setItem(COLUMNS_KEY, JSON.stringify({
          fandomOptionsByTab: payload.columnOverrides.fandomOptionsByTab || {},
          typeOptionsByTab: payload.columnOverrides.typeOptionsByTab || {},
          hiddenColumnsByTab: payload.columnOverrides.hiddenColumnsByTab || {},
          brandOptionsByTab: payload.columnOverrides.brandOptionsByTab || {},
          globalColumns: payload.globalColumns || null,
        }));
      } catch (error) { /* ignore */ }
    }
  }
  if (payload.tabStates && typeof payload.tabStates === "object") {
    Object.entries(payload.tabStates).forEach(([tabId, stateData]) => {
      try {
        localStorage.setItem(`${STORAGE_KEY}:${tabId}`, JSON.stringify(stateData));
      } catch (error) {
        // ignore
      }
    });
  }
  if (payload.wishlist) {
    if (Array.isArray(payload.wishlist.tabs)) {
      if (appMode === "wishlist") {
        const localActiveId = tabsState.activeTabId;
        tabsState.tabs = payload.wishlist.tabs;
        const payloadActiveId = payload.wishlist.activeTabId || (payload.wishlist.tabs[0] && payload.wishlist.tabs[0].id);
        if (localActiveId && payload.wishlist.tabs.some((tab) => tab.id === localActiveId)) {
          tabsState.activeTabId = localActiveId;
        } else {
          tabsState.activeTabId = payloadActiveId;
        }
        saveTabsState();
      } else {
        try {
          localStorage.setItem(WISHLIST_TAB_STORAGE_KEY, JSON.stringify({ tabs: payload.wishlist.tabs, activeTabId: payload.wishlist.activeTabId }));
        } catch (error) { /* ignore */ }
      }
    }
    if (appMode === "wishlist") {
      if (payload.wishlist.columnOverrides) {
        columnOverrides.fandomOptionsByTab = payload.wishlist.columnOverrides.fandomOptionsByTab || {};
        columnOverrides.typeOptionsByTab = payload.wishlist.columnOverrides.typeOptionsByTab || {};
        columnOverrides.hiddenColumnsByTab = payload.wishlist.columnOverrides.hiddenColumnsByTab || {};
        columnOverrides.brandOptionsByTab = payload.wishlist.columnOverrides.brandOptionsByTab || {};
      }
      if (payload.wishlist.globalColumns) {
        globalColumns = payload.wishlist.globalColumns;
      }
      saveColumnOverrides();
    } else {
      if (payload.wishlist.columnOverrides) {
        try {
          localStorage.setItem(WISHLIST_COLUMNS_KEY, JSON.stringify({
            fandomOptionsByTab: payload.wishlist.columnOverrides.fandomOptionsByTab || {},
            typeOptionsByTab: payload.wishlist.columnOverrides.typeOptionsByTab || {},
            hiddenColumnsByTab: payload.wishlist.columnOverrides.hiddenColumnsByTab || {},
            brandOptionsByTab: payload.wishlist.columnOverrides.brandOptionsByTab || {},
            globalColumns: payload.wishlist.globalColumns || null,
          }));
        } catch (error) { /* ignore */ }
      }
    }
    if (payload.wishlist.tabStates && typeof payload.wishlist.tabStates === "object") {
      Object.entries(payload.wishlist.tabStates).forEach(([tabId, stateData]) => {
        try {
          localStorage.setItem(`${WISHLIST_STORAGE_KEY}:${tabId}`, JSON.stringify(stateData));
        } catch (error) { /* ignore */ }
      });
    }
  }
  if (payload.shirtUpdateDate) {
    setShirtUpdateTimestamp(payload.shirtUpdateDate);
    try {
      localStorage.setItem("shirt-update-date", payload.shirtUpdateDate);
    } catch (error) {
      // ignore
    }
  }
  loadState();
  normalizeNameColumnsEverywhere();
  normalizeSizeOptionsEverywhere();
  applyTabFandomOptions();
  applyTabTypeOptions();
  applyTabBrandOptions();
  if (appMode === "wishlist") {
    enforceWishlistColumns();
    enforceWishlistDropdownDefaults();
  } else {
    enforceFixedDropdownDefaults();
  }
  resetFilterDefault();
  ensureRowCells();
  warmPhotoSrcCache();
  renderTable();
  applyReadOnlyMode();
  renderTabs();
  renderModeSwitcher();
  renderFooter();
  prefetchPhotoSources();
};

const SYNC_DEBOUNCE_MS = 1200;
const SYNC_RETRY_MS = 6000;

let insightsRefreshTimer = null;
const requestInsightsRefreshIfOpen = () => {
  window.clearTimeout(insightsRefreshTimer);
  insightsRefreshTimer = window.setTimeout(() => {
    const dialog = document.getElementById("insights-dialog");
    if (!dialog || !dialog.open) return;
    const simDateKey = String(dialog.getAttribute("data-sim-date-key") || localDateKeyFromDate(new Date()));
    const body = dialog.querySelector(".dialog-body");
    const previousScrollTop = body ? body.scrollTop : 0;
    openInsightsDialog(collectAllStats(), { simDateKey, preserveScroll: true, scrollTop: previousScrollTop });
  }, 120);
};

const scheduleSync = () => {
  if (!supabase || !currentUser) return;
  if (syncRetryTimer) {
    window.clearTimeout(syncRetryTimer);
    syncRetryTimer = null;
  }
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(syncToSupabase, SYNC_DEBOUNCE_MS);
  requestInsightsRefreshIfOpen();
};

const scheduleSyncRetry = () => {
  if (!supabase || !currentUser || isViewerSession) return;
  if (syncRetryTimer) return;
  syncRetryCount += 1;
  syncRetryTimer = window.setTimeout(() => {
    syncRetryTimer = null;
    syncToSupabase();
  }, SYNC_RETRY_MS);
  renderSyncDiagnostics();
};

const hasUnsyncedLocalChanges = () => {
  const lastChange = getBackupTimestamp(LAST_CHANGE_KEY);
  const lastSync = getBackupTimestamp(LAST_SYNC_KEY);
  if (!lastChange) return false;
  if (!lastSync) return true;
  return lastChange > lastSync + 1000;
};

const flushPendingSyncIfNeeded = async () => {
  if (!supabase || !currentUser || isViewerSession) return;
  if (syncTimer) {
    window.clearTimeout(syncTimer);
    syncTimer = null;
    await syncToSupabase();
    return;
  }
  if (hasUnsyncedLocalChanges()) {
    await syncToSupabase();
  }
};

const syncToSupabase = async () => {
  if (!supabase || !currentUser || isSyncing || isViewerSession) return;
  isSyncing = true;
  renderSyncDiagnostics();
  try {
    if (!photoMigrationDone) {
      await migrateLocalPhotosToSupabase();
      photoMigrationDone = true;
    }
    const payload = buildCloudPayload();
    const updatedAt = new Date().toISOString();
    const { error: upsertError } = await supabase.from("shirt_state").upsert({
      user_id: currentUser.id,
      data: payload,
      updated_at: updatedAt,
    });
    if (upsertError) {
      console.warn("Cloud sync failed", upsertError);
      lastSyncErrorAt = Date.now();
      lastSyncErrorMessage = upsertError.message || "Unknown upsert error";
      setUnsavedStatus("Cloud sync failed. Data is safe locally — will retry. If it persists, sign out and back in.", "alert");
      scheduleSyncRetry();
      renderSyncDiagnostics();
      return;
    }
    if (syncRetryTimer) {
      window.clearTimeout(syncRetryTimer);
      syncRetryTimer = null;
    }
    syncRetryCount = 0;
    lastSyncErrorAt = 0;
    lastSyncErrorMessage = "";
    const parsedUpdatedAt = Date.parse(updatedAt);
    setBackupTimestamp(LAST_SYNC_KEY, Number.isNaN(parsedUpdatedAt) ? Date.now() : parsedUpdatedAt);
    setBackupTimestamp(LAST_CLOUD_UPDATE_KEY, parsedUpdatedAt);
    updateUnsavedStatus();
    renderSyncDiagnostics();
  } catch (error) {
    console.warn("Sync failed", error);
    lastSyncErrorAt = Date.now();
    lastSyncErrorMessage = error && error.message ? error.message : String(error || "Unknown sync error");
    scheduleSyncRetry();
    renderSyncDiagnostics();
  } finally {
    isSyncing = false;
    renderSyncDiagnostics();
  }
};

const loadRemoteState = async () => {
  if (!supabase || !currentUser) return;
  if (FORCE_FRESH_START) {
    if (typeof applyFreshUserDefaults === "function") {
      applyFreshUserDefaults();
    }
    saveTabsState();
    saveState();
    updateTabLogo();
    await syncToSupabase();
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("fresh");
      window.history.replaceState({}, "", url.toString());
    } catch (error) {
      // ignore
    }
    return;
  }
  /* ── Part 1: Flush pending local changes before pulling ──
     If the user changed a cell (e.g. Condition dropdown) and the 1200ms
     sync debounce hasn't fired yet, push those changes NOW so the cloud
     has the latest data before we pull. Prevents the pull from blindly
     overwriting unsaved local edits. */
  if (syncTimer) {
    window.clearTimeout(syncTimer);
    syncTimer = null;
    await syncToSupabase();
  }
  const { data, error } = await supabase
    .from("shirt_state")
    .select("data, updated_at, user_id")
    .or(`user_id.eq.${currentUser.id},viewer_ids.cs.{${currentUser.id}}`)
    .maybeSingle();
  if (error) {
    console.warn("Failed to load remote state", error);
    return;
  }
  if (data && data.data) {
    isViewerSession = data.user_id !== currentUser.id;
    document.body.setAttribute("data-viewer", isViewerSession ? "true" : "false");
    if (isViewerSession) {
      document.body.setAttribute("data-auth", "signed-in");
    }
    positionAuthAction();
    positionTotalCount();
    /* ── Part 2: Timestamp guard — skip cloud overwrite if local is newer ──
       If our last successful push is more recent than the cloud row's
       updated_at, the local data is already ahead. Applying the cloud
       payload would revert recent edits (e.g. a Condition change that was
       pushed but hasn't round-tripped through this pull yet). Viewer
       sessions always apply the cloud data (it's someone else's data). */
    if (!isViewerSession && data.updated_at) {
      const cloudTime = Date.parse(data.updated_at);
      const lastSyncTime = getBackupTimestamp(LAST_SYNC_KEY);
      if (lastSyncTime && !Number.isNaN(cloudTime) && cloudTime <= lastSyncTime) {
        setBackupTimestamp(LAST_CLOUD_UPDATE_KEY, cloudTime);
        return;
      }
    }
    if (data.updated_at) {
      const parsed = Date.parse(data.updated_at);
      if (!Number.isNaN(parsed)) {
        setBackupTimestamp(LAST_CLOUD_UPDATE_KEY, parsed);
      }
    }
    suppressShirtUpdate = true;
    applyCloudPayload(data.data);
    suppressShirtUpdate = false;
    if (isViewerSession) {
      state.readOnly = true;
      applyReadOnlyMode();
      applyViewerRedactions();
      renderTable();
      renderFooter();
    }
  } else {
    if (typeof applyFreshUserDefaults === "function") {
      applyFreshUserDefaults();
    }
    saveTabsState();
    saveState();
    updateTabLogo();
    await syncToSupabase();
  }
};

/**
 * Compress an image blob by drawing it onto a canvas at a constrained size
 * and exporting as JPEG. Returns { blob, extension } with the compressed result,
 * or the original blob/extension if compression isn't needed or fails.
 *
 * @param {Blob} blob - The image file blob
 * @param {string} extension - Original file extension (e.g. "png", "jpg")
 * @param {object} [options]
 * @param {number} [options.maxDimension=1200] - Max width or height in pixels
 * @param {number} [options.quality=0.85] - JPEG quality (0–1)
 * @param {number} [options.skipBelowBytes=102400] - Skip compression for files under this size (default 100KB)
 */
const compressImage = (blob, extension, options = {}) => {
  const {
    maxDimension = 1200,
    quality = 0.85,
    skipBelowBytes = 102400,
  } = options;

  return new Promise((resolve) => {
    // Skip tiny images — not worth the canvas round-trip
    if (blob.size < skipBelowBytes) {
      resolve({ blob, extension });
      return;
    }

    // SVGs shouldn't be rasterized
    if (extension && extension.toLowerCase() === "svg") {
      resolve({ blob, extension });
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // Only downscale — never upscale
      if (width <= maxDimension && height <= maxDimension) {
        // Image is within bounds but may still be a large PNG/BMP — re-encode as JPEG
        if (blob.size < skipBelowBytes) {
          resolve({ blob, extension });
          return;
        }
      }

      // Calculate constrained dimensions preserving aspect ratio
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (result) => {
          if (result && result.size < blob.size) {
            resolve({ blob: result, extension: "jpg" });
          } else {
            // Compressed version is larger (rare) — keep original
            resolve({ blob, extension });
          }
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      // Can't decode — pass through unmodified
      resolve({ blob, extension });
    };

    img.src = url;
  });
};

const uploadPhotoToSupabase = async (blob, extension) => {
  if (!supabase || !currentUser) return null;
  const path = `${currentUser.id}/${createId()}.${extension}`;
  const { error } = await supabase
    .storage
    .from(SUPABASE_BUCKET)
    .upload(path, blob, { upsert: true });
  if (error) {
    console.warn("Photo upload failed", error);
    return null;
  }
  return path;
};

const uploadLogoToSupabase = async (blob, extension) => {
  if (!supabase || !currentUser) return null;
  const path = `${currentUser.id}/tab-logos/${createId()}.${extension}`;
  const { error } = await supabase
    .storage
    .from(SUPABASE_BUCKET)
    .upload(path, blob, { upsert: true });
  if (error) {
    console.warn("Logo upload failed", error);
    return null;
  }
  return path;
};

const migrateLocalPhotosToSupabase = async () => {
  if (!supabase || !currentUser) return;
  const migrateStatePhotos = async (tabState) => {
    if (!tabState || !Array.isArray(tabState.columns) || !Array.isArray(tabState.rows)) return false;
    const photoColumnIds = tabState.columns
      .filter((column) => column.type === "photo")
      .map((column) => column.id);
    if (photoColumnIds.length === 0) return false;
    let changed = false;
    for (const row of tabState.rows) {
      if (!row || !row.cells) continue;
      for (const columnId of photoColumnIds) {
        const value = row.cells[columnId];
        if (!value) continue;
        let blob = null;
        if (typeof value === "string" && value.startsWith("idb:")) {
          blob = await loadPhotoBlob(value.slice(4));
        } else if (typeof value === "string" && value.startsWith("data:")) {
          blob = await (await fetch(value)).blob();
        }
        if (blob) {
          const compressed = await compressImage(blob, "jpg");
          const path = await uploadPhotoToSupabase(compressed.blob, compressed.extension);
          if (path) {
            row.cells[columnId] = `supa:${path}`;
            changed = true;
          }
        }
      }
    }
    return changed;
  };

  let didMigrate = false;
  if (canUseLocalStorage() && Array.isArray(tabsState.tabs) && tabsState.tabs.length) {
    for (const tab of tabsState.tabs) {
      if (!tab || !tab.id) continue;
      let parsed = null;
      try {
        const stored = localStorage.getItem(getStorageKey(tab.id));
        parsed = stored ? JSON.parse(stored) : null;
      } catch (error) {
        parsed = null;
      }
      if (!parsed || typeof parsed !== "object") continue;
      const changed = await migrateStatePhotos(parsed);
      if (changed) {
        didMigrate = true;
        try {
          localStorage.setItem(getStorageKey(tab.id), JSON.stringify(parsed));
        } catch (error) {
          // ignore
        }
        if (tab.id === tabsState.activeTabId) {
          applyStatePayload(parsed);
          ensureRowCells();
          renderRows();
          renderFooter();
        }
      }
    }
  } else {
    const changed = await migrateStatePhotos(state);
    if (changed) {
      didMigrate = true;
      saveState();
    }
  }
  if (didMigrate) {
    saveTabsState();
  }
};

const loadState = () => {
  const embedded = document.getElementById("embedded-state");
  let embeddedState = null;
  if (embedded && embedded.textContent && embedded.textContent.trim() !== "{}") {
    try {
      const parsed = JSON.parse(embedded.textContent);
      if (parsed && typeof parsed === "object") {
        embeddedState = parsed;
      }
    } catch (error) {
      console.error("Failed to load embedded state", error);
    }
  }
  let stored = null;
  try {
    const key = getStorageKey(tabsState.activeTabId);
    stored = localStorage.getItem(key);
  } catch (error) {
    console.warn("Local storage unavailable", error);
  }
  const embeddedHasData = embeddedState && Array.isArray(embeddedState.columns) && embeddedState.columns.length > 0;
  if (embeddedState && embeddedState.readOnly) {
    state.columns = Array.isArray(embeddedState.columns) ? embeddedState.columns : [];
    state.rows = Array.isArray(embeddedState.rows) && embeddedState.rows.length
      ? embeddedState.rows
      : [defaultRow()];
    state.columnWidths = embeddedState.columnWidths && typeof embeddedState.columnWidths === "object"
      ? embeddedState.columnWidths
      : {};
    state.sort = embeddedState.sort || { columnId: null, direction: "asc" };
    state.filter = embeddedState.filter || { columnId: "all", query: "" };
    state.readOnly = true;
    return;
  }
  if (!stored) {
    const embeddedTabState = tabsState.embeddedData && tabsState.activeTabId
      ? tabsState.embeddedData[tabsState.activeTabId]
      : null;
    if (embeddedTabState) {
      state.columns = Array.isArray(embeddedTabState.columns) ? embeddedTabState.columns : [];
      state.rows = Array.isArray(embeddedTabState.rows) && embeddedTabState.rows.length
        ? embeddedTabState.rows
        : [defaultRow()];
      state.columnWidths = embeddedTabState.columnWidths && typeof embeddedTabState.columnWidths === "object"
        ? embeddedTabState.columnWidths
        : {};
      state.sort = embeddedTabState.sort || { columnId: null, direction: "asc" };
      state.filter = embeddedTabState.filter || { columnId: "all", query: "" };
      state.readOnly = tabsState.isEmbeddedBackup ? false : Boolean(embeddedTabState.readOnly);
      return;
    }
    if (embeddedState) {
      state.columns = Array.isArray(embeddedState.columns) ? embeddedState.columns : [];
      state.rows = Array.isArray(embeddedState.rows) && embeddedState.rows.length
        ? embeddedState.rows
        : [defaultRow()];
      state.columnWidths = embeddedState.columnWidths && typeof embeddedState.columnWidths === "object"
        ? embeddedState.columnWidths
        : {};
      state.sort = embeddedState.sort || { columnId: null, direction: "asc" };
      state.filter = embeddedState.filter || { columnId: "all", query: "" };
      state.readOnly = tabsState.isEmbeddedBackup ? false : Boolean(embeddedState.readOnly);
      return;
    }
    if (!state.columns.length) {
      state.columns = appMode === "wishlist" ? getWishlistDefaultColumns() : getDefaultColumns();
      state.rows = [defaultRow()];
      setGlobalColumns(state.columns);
      saveState();
    }
    return;
  }
  try {
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === "object") {
      const storedColumns = Array.isArray(parsed.columns) ? parsed.columns : [];
      const storedRows = Array.isArray(parsed.rows) ? parsed.rows : [];
      if (storedColumns.length === 0) {
        if (embeddedHasData) {
          state.columns = Array.isArray(embeddedState.columns) ? embeddedState.columns : [];
          state.rows = Array.isArray(embeddedState.rows) && embeddedState.rows.length
            ? embeddedState.rows
            : [defaultRow()];
        state.columnWidths = embeddedState.columnWidths && typeof embeddedState.columnWidths === "object"
          ? embeddedState.columnWidths
          : {};
        state.sort = embeddedState.sort || { columnId: null, direction: "asc" };
        state.filter = embeddedState.filter || { columnId: "all", query: "" };
        state.readOnly = tabsState.isEmbeddedBackup ? false : Boolean(embeddedState.readOnly);
      }
    } else {
      state.columns = storedColumns;
      state.rows = storedRows.length ? storedRows : [defaultRow()];
      state.columnWidths = parsed.columnWidths && typeof parsed.columnWidths === "object"
        ? parsed.columnWidths
        : {};
      state.sort = parsed.sort || { columnId: null, direction: "asc" };
      state.filter = parsed.filter || { columnId: "all", query: "" };
      state.readOnly = tabsState.isEmbeddedBackup ? false : Boolean(parsed.readOnly);
    }
    }
  } catch (error) {
    console.error("Failed to load state", error);
  }
};

const resetFilterDefault = () => {
  if (!state.filter || typeof state.filter !== "object") {
    state.filter = { columnId: "all", query: "" };
    return;
  }
  state.filter.columnId = "all";
  state.filter.query = "";
};

const migrateInlinePhotos = async () => {
  const photoColumnIds = state.columns
    .filter((column) => column.type === "photo")
    .map((column) => column.id);
  if (photoColumnIds.length === 0) return;
  let updated = false;
  for (const row of state.rows) {
    if (!row.cells) continue;
    for (const columnId of photoColumnIds) {
      const value = row.cells[columnId];
      if (typeof value === "string" && value.startsWith("data:")) {
        try {
          const blob = await (await fetch(value)).blob();
          const photoId = await savePhotoBlob(blob);
          row.cells[columnId] = `idb:${photoId}`;
          updated = true;
        } catch (error) {
          console.error("Failed to migrate photo", error);
        }
      }
    }
  }
  if (updated) saveState();
};

const applyReadOnlyMode = () => {
  if (!state.readOnly) return;
  document.body.setAttribute("data-readonly", "true");
  const controls = document.querySelectorAll(
    "#add-column, #add-row, #clear-all"
  );
  controls.forEach((button) => {
    button.disabled = true;
    button.setAttribute("aria-disabled", "true");
    button.style.pointerEvents = "none";
    button.style.opacity = "0.6";
  });
  const inputs = document.querySelectorAll("input, select, textarea, button.btn-icon");
  inputs.forEach((input) => {
    if (input.id === "filter-column" || input.id === "filter-query" || (PLATFORM === "desktop" && input.id === "find-bar-input")) {
      return;
    }
    if (input.closest("#auth-dialog") || input.closest("#request-access-dialog") || input.closest("#set-password-dialog") || input.closest("#share-columns-dialog") || input.closest("#contact-dialog") || input.closest("#profile-name-dialog") || input.closest("#text-prompt-dialog")) {
      return;
    }
    input.disabled = true;
    input.setAttribute("aria-disabled", "true");
  });
};

const clearReadOnlyMode = () => {
  document.body.removeAttribute("data-readonly");
  const controls = document.querySelectorAll(
    "#add-column, #add-row, #clear-all"
  );
  controls.forEach((button) => {
    button.disabled = false;
    button.removeAttribute("aria-disabled");
    button.style.pointerEvents = "";
    button.style.opacity = "";
  });
  const inputs = document.querySelectorAll("input, select, textarea, button.btn-icon");
  inputs.forEach((input) => {
    if (input.id === "filter-column" || input.id === "filter-query" || (PLATFORM === "desktop" && input.id === "find-bar-input")) {
      return;
    }
    if (input.closest("#auth-dialog") || input.closest("#request-access-dialog") || input.closest("#set-password-dialog") || input.closest("#share-columns-dialog")) {
      return;
    }
    input.disabled = false;
    input.removeAttribute("aria-disabled");
  });
};

let activePhotoTarget = null;

const openColumnDialog = (column = null) => {
  columnForm.reset();
  columnEditId = column ? column.id : null;
  if (column) {
    columnDialogTitle.textContent = "Edit Column";
    columnSubmitButton.textContent = "Save";
    columnNameInput.value = column.name || "";
    columnTypeInput.value = column.type || "text";
    if (column.type === "select") {
      columnOptionsRow.style.display = "block";
      columnOptionsInput.value = (column.options || []).join(", ");
    } else {
      columnOptionsRow.style.display = "none";
    }
  } else {
    columnDialogTitle.textContent = "Add Column";
    columnSubmitButton.textContent = "Add";
    columnOptionsRow.style.display = "none";
  }
  openDialog(columnDialog);
};

const openTabDialog = () => {
  tabForm.reset();
  openDialog(tabDialog);
  tabNameInput.focus();
};

const openTabDeleteDialog = (tabId) => {
  pendingDeleteTabId = tabId;
  const active = tabsState.tabs.find((tab) => tab.id === tabId);
  const name = active ? active.name : "this tab";
  tabDeleteMessage.textContent = `Delete "${name}"? This cannot be undone.`;
  openDialog(tabDeleteDialog);
};

const ensureRowCells = () => {
  state.rows.forEach((row) => {
    if (!row.cells) row.cells = {};
    if (!Array.isArray(row.tags)) row.tags = [];
    state.columns.forEach((column) => {
      if (!(column.id in row.cells)) {
        row.cells[column.id] = "";
      }
    });
  });
};

const getFandomColumn = () => state.columns.find(
  (column) => getColumnLabel(column).trim().toLowerCase() === "fandom"
);

const getTypeColumn = () => state.columns.find(
  (column) => getColumnLabel(column).trim().toLowerCase() === "type"
);

const pruneRowCells = () => {
  const columnIds = new Set(state.columns.map((column) => column.id));
  state.rows.forEach((row) => {
    if (!row.cells) return;
    Object.keys(row.cells).forEach((key) => {
      if (!columnIds.has(key)) delete row.cells[key];
    });
  });
  if (state.sort.columnId && !columnIds.has(state.sort.columnId)) {
    state.sort = { columnId: null, direction: "asc" };
  }
  if (state.filter.columnId && state.filter.columnId !== "all" && state.filter.columnId !== "tags" && !columnIds.has(state.filter.columnId)) {
    state.filter.columnId = "all";
  }
};

const applyTabFandomOptions = () => {
  const tabId = tabsState.activeTabId;
  if (!tabId) return;
  const column = getFandomColumn();
  if (!column) return;
  const options = columnOverrides.fandomOptionsByTab[tabId];
  column.options = Array.isArray(options) ? options.slice() : [];
};

const applyTabTypeOptions = () => {
  const tabId = tabsState.activeTabId;
  if (!tabId) return;
  const column = getTypeColumn();
  if (!column) return;
  const options = columnOverrides.typeOptionsByTab[tabId];
  column.options = Array.isArray(options) ? options.slice() : [];
};

const applyTabBrandOptions = () => {
  const tabId = tabsState.activeTabId;
  if (!tabId || !columnOverrides.brandOptionsByTab) return;
  const column = state.columns.find((c) => getColumnLabel(c).trim().toLowerCase() === "brand");
  if (!column) return;
  const options = columnOverrides.brandOptionsByTab[tabId];
  column.options = Array.isArray(options) ? options.slice() : [];
};

const removeBrandColumn = () => {
  const brandColumn = state.columns.find(
    (column) => getColumnLabel(column).trim().toLowerCase() === "brand"
  );
  if (!brandColumn) return false;
  state.columns = state.columns.filter((column) => column.id !== brandColumn.id);
  if (globalColumns && Array.isArray(globalColumns)) {
    globalColumns = globalColumns.filter((column) => column.id !== brandColumn.id);
    saveColumnOverrides();
  }
  state.rows.forEach((row) => {
    if (row.cells) delete row.cells[brandColumn.id];
  });
  if (state.sort.columnId === brandColumn.id) {
    state.sort = { columnId: null, direction: "asc" };
  }
  if (state.filter.columnId === brandColumn.id) {
    state.filter.columnId = "all";
  }
  if (state.columnWidths && state.columnWidths[brandColumn.id]) {
    delete state.columnWidths[brandColumn.id];
  }
  return true;
};

const removeColumnByLabel = (label) => {
  const target = state.columns.find(
    (column) => getColumnLabel(column).trim().toLowerCase() === label
  );
  if (!target) return false;
  state.columns = state.columns.filter((column) => column.id !== target.id);
  state.rows.forEach((row) => {
    if (row.cells) delete row.cells[target.id];
  });
  if (state.sort.columnId === target.id) {
    state.sort = { columnId: null, direction: "asc" };
  }
  if (state.filter.columnId === target.id) {
    state.filter.columnId = "all";
  }
  if (state.columnWidths && state.columnWidths[target.id]) {
    delete state.columnWidths[target.id];
  }
  return true;
};

const seedTabState = (tabId, baseState) => {
  try {
    localStorage.setItem(getStorageKey(tabId), JSON.stringify(baseState));
  } catch (error) {
    console.warn("Local storage unavailable", error);
  }
};

const createBlankStateFromCurrent = () => ({
  columns: (globalColumns || state.columns).map((column) => ({ ...column })),
  rows: [defaultRow()],
  columnWidths: { ...state.columnWidths },
  sort: { columnId: null, direction: "asc" },
  filter: { columnId: "all", query: "" },
  readOnly: false,
});

const applyStatePayload = (payload) => {
  state.columns = Array.isArray(payload.columns) ? payload.columns : [];
  state.rows = Array.isArray(payload.rows) && payload.rows.length
    ? payload.rows
    : [defaultRow()];
  state.columnWidths = payload.columnWidths && typeof payload.columnWidths === "object"
    ? payload.columnWidths
    : {};
  state.sort = payload.sort || { columnId: null, direction: "asc" };
  state.filter = payload.filter || { columnId: "all", query: "" };
  state.readOnly = Boolean(payload.readOnly);
};

const applySignedOutState = () => {
  setDefaultTabsState();
  applyStatePayload({
    columns: [],
    rows: [defaultRow()],
    columnWidths: {},
    sort: { columnId: null, direction: "asc" },
    filter: { columnId: "all", query: "" },
    readOnly: true,
  });
  globalColumns = null;
  shirtUpdateTimestamp = null;
  ensureFandomInState(state);
  setGlobalColumns(state.columns);
  applyTabFandomOptions();
  applyTabTypeOptions();
  applyTabBrandOptions();
  pruneRowCells();
  ensureRowCells();
  sortRows();
  renderTable();
  renderFooter();
  applyReadOnlyMode();
  renderTabs();
  renderModeSwitcher();
  updateHeaderSubtitle();
};

const ensureFandomInState = (targetState) => {
  const hasFandom = targetState.columns.some(
    (column) => getColumnLabel(column).trim().toLowerCase() === "fandom"
  );
  if (hasFandom) return false;
  const column = {
    id: createId(),
    name: "Fandom",
    type: "select",
    options: [],
  };
  targetState.columns.push(column);
  targetState.rows.forEach((row) => {
    if (!row.cells) row.cells = {};
    row.cells[column.id] = "";
  });
  return true;
};

const snapshotCurrentMode = () => ({
  tabs: JSON.parse(JSON.stringify(tabsState.tabs)),
  activeTabId: tabsState.activeTabId,
  columnOverrides: JSON.parse(JSON.stringify(columnOverrides)),
  globalColumns: globalColumns ? JSON.parse(JSON.stringify(globalColumns)) : null,
});

const restoreModeSnapshot = (snapshot) => {
  tabsState.tabs = snapshot.tabs;
  tabsState.activeTabId = snapshot.activeTabId;
  columnOverrides.fandomOptionsByTab = snapshot.columnOverrides.fandomOptionsByTab;
  columnOverrides.typeOptionsByTab = snapshot.columnOverrides.typeOptionsByTab;
  columnOverrides.hiddenColumnsByTab = snapshot.columnOverrides.hiddenColumnsByTab;
  columnOverrides.brandOptionsByTab = snapshot.columnOverrides.brandOptionsByTab || {};
  globalColumns = snapshot.globalColumns;
};

const initWishlistMode = () => {
  tabsState.tabs = [];
  tabsState.activeTabId = null;
  let stored = null;
  try {
    stored = localStorage.getItem(WISHLIST_TAB_STORAGE_KEY);
  } catch (error) { /* ignore */ }
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object") {
        tabsState.tabs = Array.isArray(parsed.tabs) ? parsed.tabs : [];
        tabsState.activeTabId = parsed.activeTabId || (tabsState.tabs[0] && tabsState.tabs[0].id);
        sortTabs();
      }
    } catch (error) {
      console.warn("Failed to load wishlist tabs", error);
    }
  }
  if (!tabsState.tabs.length) {
    const tab = { id: createId(), name: "Shirts" };
    tabsState.tabs = [tab];
    tabsState.activeTabId = tab.id;
    saveTabsState();
  }
  let colStored = null;
  try {
    colStored = localStorage.getItem(WISHLIST_COLUMNS_KEY);
  } catch (error) { /* ignore */ }
  if (colStored) {
    try {
      const parsed = JSON.parse(colStored);
      if (parsed && typeof parsed === "object") {
        if (parsed.fandomOptionsByTab) columnOverrides.fandomOptionsByTab = parsed.fandomOptionsByTab;
        if (parsed.typeOptionsByTab) columnOverrides.typeOptionsByTab = parsed.typeOptionsByTab;
        if (parsed.hiddenColumnsByTab) columnOverrides.hiddenColumnsByTab = parsed.hiddenColumnsByTab;
        if (parsed.brandOptionsByTab) columnOverrides.brandOptionsByTab = parsed.brandOptionsByTab;
        if (parsed.globalColumns) globalColumns = parsed.globalColumns;
      }
    } catch (error) { /* ignore */ }
  } else {
    columnOverrides.fandomOptionsByTab = {};
    columnOverrides.typeOptionsByTab = {};
    columnOverrides.hiddenColumnsByTab = {};
    columnOverrides.brandOptionsByTab = {};
    globalColumns = null;
  }
};

const switchAppMode = (nextMode) => {
  if (nextMode === appMode) return;
  saveState();
  savedModeState[appMode] = snapshotCurrentMode();
  appMode = nextMode;
  try {
    localStorage.setItem(APP_MODE_KEY, appMode);
  } catch (error) { /* ignore */ }
  const snapshot = savedModeState[nextMode];
  if (snapshot) {
    restoreModeSnapshot(snapshot);
  } else {
    if (nextMode === "wishlist") {
      initWishlistMode();
    } else {
      loadTabsState();
      loadColumnOverrides();
    }
  }
  if (!tabsState.activeTabId && tabsState.tabs[0]) {
    tabsState.activeTabId = tabsState.tabs[0].id;
    saveTabsState();
  }
  if (!snapshot) {
    state.columns = [];
    state.rows = [defaultRow()];
    state.columnWidths = {};
    state.sort = { columnId: null, direction: "asc" };
    state.filter = { columnId: "all", query: "" };
    state.readOnly = false;
  }
  loadState();
  normalizeNameColumnsEverywhere();
  normalizeSizeOptionsEverywhere();
  resetFilterDefault();
  if (appMode === "inventory" && removeBrandColumn()) {
    ensureRowCells();
    saveState();
  }
  if (globalColumns) {
    const previousColumns = state.columns.slice();
    ensureFandomInGlobalColumns();
    remapRowsToGlobalColumns(previousColumns);
    applyGlobalColumns();
  } else {
    ensureFandomInState(state);
    if (appMode === "wishlist" && !state.columns.length) {
      state.columns = getWishlistDefaultColumns();
      state.rows = [defaultRow()];
      setGlobalColumns(state.columns);
      saveState();
    } else {
      setGlobalColumns(state.columns);
    }
  }
  applyTabFandomOptions();
  applyTabTypeOptions();
  applyTabBrandOptions();
  if (appMode === "inventory") {
    enforceFixedDropdownDefaults();
  } else {
    enforceWishlistColumns();
    enforceWishlistDropdownDefaults();
  }
  pruneRowCells();
  ensureRowCells();
  sortRows();
  warmPhotoSrcCache();
  renderTable();
  applyReadOnlyMode();
  renderTabs();
  renderModeSwitcher();
  renderFooter();
  prefetchPhotoSources();
};

const renderModeSwitcher = () => {
  if (!modeSwitcher) return;
  modeSwitcher.innerHTML = "";
  if (PLATFORM === "mobile") {
    if (!currentUser) {
      modeSwitcher.style.display = "none";
      return;
    }
    Object.assign(modeSwitcher.style, {
      display: "flex",
      justifyContent: "center",
      padding: "12px 0 4px",
      margin: "0",
      background: "linear-gradient(90deg, #eeeeee, #e1e1e1)",
    });
  } else {
    modeSwitcher.style.display = "none";
    const sheetHeader = document.querySelector(".sheet-header");
    if (sheetHeader) {
      const prev = sheetHeader.querySelector("#mode-switcher-inline");
      if (prev) prev.remove();
    }
    if (!currentUser) return;
  }
  const container = document.createElement("div");
  Object.assign(container.style, {
    display: "inline-flex",
    borderRadius: PLATFORM === "mobile" ? "8px" : "6px",
    overflow: "hidden",
    border: "2px solid #c62828",
    ...(PLATFORM === "desktop" ? { flexShrink: "0", alignSelf: "center" } : {}),
  });
  const modes = [
    { id: "inventory", label: "Inventory" },
    { id: "wishlist", label: "Wishlist" },
  ];
  modes.forEach((mode) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = mode.label;
    const isActive = appMode === mode.id;
    btn.className = "btn-mode-switcher" + (isActive ? " active" : "");
    btn.style.padding = PLATFORM === "mobile" ? "7px 24px" : "5px 14px";
    btn.style.fontSize = PLATFORM === "mobile" ? "0.92rem" : "0.78rem";
    if (PLATFORM === "desktop") btn.style.whiteSpace = "nowrap";
    btn.addEventListener("click", () => switchAppMode(mode.id));
    container.appendChild(btn);
  });
  if (PLATFORM === "mobile") {
    modeSwitcher.appendChild(container);
    const filterRow = document.querySelector(".filter-row");
    if (filterRow) {
      Object.assign(filterRow.style, {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
      });
      const topActions = filterRow.querySelector(".top-table-actions");
      if (topActions) {
        Object.assign(topActions.style, {
          order: "2",
          alignSelf: "flex-start",
        });
      }
    }
  } else {
    const sheetHeader = document.querySelector(".sheet-header");
    if (sheetHeader) {
      const modeRow = document.createElement("div");
      modeRow.id = "mode-switcher-inline";
      modeRow.style.display = "flex";
      modeRow.style.alignItems = "center";
      modeRow.style.gap = "10px";
      modeRow.appendChild(container);
      if (statsButton) {
        statsButton.classList.add("btn-stats-inline");
        modeRow.appendChild(statsButton);
      }
      sheetHeader.prepend(modeRow);
    }
  }
};

const enforceWishlistColumns = () => {
  if (appMode !== "wishlist") return;
  const disallowed = ["condition", "price"];
  let changed = false;
  disallowed.forEach((label) => {
    const col = state.columns.find((c) => getColumnLabel(c).trim().toLowerCase() === label);
    if (col) {
      state.columns = state.columns.filter((c) => c.id !== col.id);
      state.rows.forEach((row) => { if (row.cells) delete row.cells[col.id]; });
      if (state.sort.columnId === col.id) state.sort = { columnId: null, direction: "asc" };
      if (state.filter.columnId === col.id) state.filter.columnId = "all";
      if (state.columnWidths && state.columnWidths[col.id]) delete state.columnWidths[col.id];
      changed = true;
    }
  });
  if (globalColumns && Array.isArray(globalColumns)) {
    disallowed.forEach((label) => {
      const col = globalColumns.find((c) => getColumnLabel(c).trim().toLowerCase() === label);
      if (col) {
        globalColumns = globalColumns.filter((c) => c.id !== col.id);
        changed = true;
      }
    });
  }
  const brandIdx = state.columns.findIndex((c) => getColumnLabel(c).trim().toLowerCase() === "brand");
  if (brandIdx < 0) {
    const brandCol = { id: createId(), name: "Brand", type: "select", options: [] };
    state.columns.unshift(brandCol);
    state.rows.forEach((row) => { if (row.cells) row.cells[brandCol.id] = ""; });
    changed = true;
  } else if (brandIdx > 0) {
    const [brandCol] = state.columns.splice(brandIdx, 1);
    state.columns.unshift(brandCol);
    changed = true;
  }
  if (globalColumns && Array.isArray(globalColumns)) {
    const gBrandIdx = globalColumns.findIndex((c) => getColumnLabel(c).trim().toLowerCase() === "brand");
    if (gBrandIdx > 0) {
      const [gBrandCol] = globalColumns.splice(gBrandIdx, 1);
      globalColumns.unshift(gBrandCol);
      changed = true;
    }
  }
  if (changed) {
    setGlobalColumns(state.columns);
    saveState();
  }
};

const enforceWishlistDropdownDefaults = () => {
  const fixedDefaults = {
    size: SIZE_OPTIONS_DEFAULT.slice(),
  };
  let changed = false;
  Object.entries(fixedDefaults).forEach(([label, defaults]) => {
    const col = state.columns.find((c) => getColumnLabel(c).trim().toLowerCase() === label);
    if (!col) return;
    const current = (col.options || []).map((o) => String(o));
    const match = defaults.length === current.length && defaults.every((opt, i) => opt === current[i]);
    if (!match) {
      col.options = defaults.slice();
      changed = true;
    }
  });
  if (changed) {
    setGlobalColumns(state.columns);
    saveState();
  }
};

const normalizeDuplicateCheckText = (value) => String(value || "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const photoSimilarityCache = new Map();

const getRowValuesByLabel = (row, columns) => {
  const values = {};
  if (!row || !row.cells || !Array.isArray(columns)) return values;
  columns.forEach((column) => {
    const label = getColumnLabel(column).trim().toLowerCase();
    const raw = row.cells[column.id];
    if (raw) values[label] = String(raw).trim();
  });
  return values;
};

const sharedTokenCount = (left, right) => {
  const leftTokens = new Set(normalizeDuplicateCheckText(left).split(/\s+/).filter(Boolean));
  const rightTokens = new Set(normalizeDuplicateCheckText(right).split(/\s+/).filter(Boolean));
  let count = 0;
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) count += 1;
  });
  return count;
};

const getRowPhotoValue = (row, columns) => {
  if (!row || !row.cells || !Array.isArray(columns)) return "";
  const photoColumn = columns.find((column) => isPhotoColumn(column));
  if (!photoColumn) return "";
  return String(row.cells[photoColumn.id] || "").trim();
};

const buildTextDuplicateSignals = (wishlistValues, wishlistRow, inventoryValues, inventoryRow, chosenBrandName) => {
  const desiredBrand = String(chosenBrandName || wishlistValues.brand || "").trim();
  const wishlistName = normalizeDuplicateCheckText(wishlistValues.name);
  const wishlistType = normalizeDuplicateCheckText(wishlistValues.type);
  const wishlistFandom = normalizeDuplicateCheckText(wishlistValues.fandom);
  const wishlistBrand = normalizeDuplicateCheckText(desiredBrand);
  const wishlistTags = new Set(
    getRowTags(wishlistRow)
      .map((tag) => normalizeDuplicateCheckText(tag))
      .filter(Boolean)
  );
  const entryName = String(inventoryValues.name || "").trim();
  const entryType = String(inventoryValues.type || "").trim();
  const entryFandom = String(inventoryValues.fandom || "").trim();
  const entryBrand = String(chosenBrandName || inventoryValues.brand || "").trim();
  const tagOverlap = getRowTags(inventoryRow)
    .map((tag) => normalizeDuplicateCheckText(tag))
    .filter((tag) => tag && wishlistTags.has(tag));
  const normalizedName = normalizeDuplicateCheckText(entryName);
  const normalizedType = normalizeDuplicateCheckText(entryType);
  const normalizedFandom = normalizeDuplicateCheckText(entryFandom);
  const normalizedBrand = normalizeDuplicateCheckText(entryBrand);
  const reasons = [];
  let score = 0;

  if (wishlistBrand && normalizedBrand && wishlistBrand === normalizedBrand) {
    score += 30;
    reasons.push("same brand");
  }
  if (wishlistType && normalizedType && wishlistType === normalizedType) {
    score += 20;
    reasons.push("same type");
  }
  if (wishlistFandom && normalizedFandom && wishlistFandom === normalizedFandom) {
    score += 15;
    reasons.push("same fandom");
  }
  if (wishlistName && normalizedName) {
    if (wishlistName === normalizedName) {
      score += 45;
      reasons.push("same name");
    } else if (wishlistName.length > 3 && normalizedName.length > 3 && (wishlistName.includes(normalizedName) || normalizedName.includes(wishlistName))) {
      score += 30;
      reasons.push("very similar name");
    } else {
      const tokenOverlap = sharedTokenCount(wishlistName, normalizedName);
      if (tokenOverlap >= 2) {
        score += 20;
        reasons.push(`${tokenOverlap} shared name words`);
      } else if (tokenOverlap === 1) {
        score += 10;
        reasons.push("1 shared name word");
      }
    }
  }
  if (tagOverlap.length) {
    score += Math.min(15, tagOverlap.length * 5);
    reasons.push(`${tagOverlap.length} shared tag${tagOverlap.length === 1 ? "" : "s"}`);
  }
  return {
    score,
    reasons,
    entryName,
    entryType,
    entryBrand,
  };
};

const getPhotoSimilaritySignature = async (photoValue) => {
  const key = String(photoValue || "").trim();
  if (!key) return null;
  if (photoSimilarityCache.has(key)) return photoSimilarityCache.get(key);
  const pending = (async () => {
    const src = await getPhotoSrc(key);
    if (!src) return null;
    return new Promise((resolve) => {
      const img = new Image();
      if (/^https?:/i.test(src)) img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 8;
          canvas.height = 8;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0, 8, 8);
          const { data } = ctx.getImageData(0, 0, 8, 8);
          let sum = 0;
          let red = 0;
          let green = 0;
          let blue = 0;
          const luminance = [];
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            red += r;
            green += g;
            blue += b;
            const luma = Math.round((r * 0.299) + (g * 0.587) + (b * 0.114));
            luminance.push(luma);
            sum += luma;
          }
          const average = sum / luminance.length;
          const bits = luminance.map((value) => (value >= average ? 1 : 0));
          resolve({
            bits,
            avg: [red / 64, green / 64, blue / 64],
          });
        } catch (error) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  })();
  photoSimilarityCache.set(key, pending);
  return pending;
};

const comparePhotoSignatures = (left, right) => {
  if (!left || !right || !Array.isArray(left.bits) || !Array.isArray(right.bits)) return null;
  const bitCount = Math.min(left.bits.length, right.bits.length);
  if (!bitCount) return null;
  let distance = 0;
  for (let i = 0; i < bitCount; i += 1) {
    if (left.bits[i] !== right.bits[i]) distance += 1;
  }
  const hashSimilarity = 1 - (distance / bitCount);
  const dr = Number(left.avg?.[0] || 0) - Number(right.avg?.[0] || 0);
  const dg = Number(left.avg?.[1] || 0) - Number(right.avg?.[1] || 0);
  const db = Number(left.avg?.[2] || 0) - Number(right.avg?.[2] || 0);
  const maxDistance = Math.sqrt(3 * 255 * 255);
  const colorSimilarity = 1 - Math.min(1, Math.sqrt((dr * dr) + (dg * dg) + (db * db)) / maxDistance);
  return (hashSimilarity * 0.8) + (colorSimilarity * 0.2);
};

const buildDuplicateRiskMatches = async (wishlistRow, wishlistColumns, chosenTab) => {
  if (!chosenTab || !chosenTab.id) return [];
  const wishlistValues = getRowValuesByLabel(wishlistRow, wishlistColumns);
  let invState = null;
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}:${chosenTab.id}`);
    if (stored) invState = JSON.parse(stored);
  } catch (error) {
    invState = null;
  }
  if (!invState || !Array.isArray(invState.columns) || !Array.isArray(invState.rows)) return [];

  const wishlistPhotoValue = getRowPhotoValue(wishlistRow, wishlistColumns);
  const wishlistSignature = await getPhotoSimilaritySignature(wishlistPhotoValue);
  const candidates = await Promise.all(invState.rows.map(async (entry) => {
    const values = getRowValuesByLabel(entry, invState.columns);
    const textSignals = buildTextDuplicateSignals(wishlistValues, wishlistRow, values, entry, chosenTab.name || "");
    const entryPhotoValue = getRowPhotoValue(entry, invState.columns);
    const entrySignature = await getPhotoSimilaritySignature(entryPhotoValue);
    const visualSimilarity = comparePhotoSignatures(wishlistSignature, entrySignature);
    const reasons = [];
    let score = 0;
    let imageCompared = false;

    if (typeof visualSimilarity === "number") {
      imageCompared = true;
      const percent = Math.round(visualSimilarity * 100);
      if (visualSimilarity >= 0.9) {
        score += 70;
        reasons.push(`visual match ${percent}%`);
      } else if (visualSimilarity >= 0.84) {
        score += 55;
        reasons.push(`visual match ${percent}%`);
      } else if (visualSimilarity >= 0.78 && textSignals.score >= 20) {
        score += 45;
        reasons.push(`visual match ${percent}%`);
      } else {
        return null;
      }
    }

    if (!imageCompared) {
      if (textSignals.score < 45) return null;
      score += textSignals.score;
    } else if (textSignals.score > 0) {
      score += Math.min(20, textSignals.score);
    }

    reasons.push(...textSignals.reasons);
    return {
      name: textSignals.entryName || "Unnamed",
      brand: textSignals.entryBrand || chosenTab.name || "Unknown",
      type: textSignals.entryType || "Unknown",
      score,
      reasons: Array.from(new Set(reasons)),
      imageCompared,
    };
  }));

  return candidates
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
};

const summarizeDuplicateRiskMatches = (matches) => {
  const list = Array.isArray(matches) ? matches : [];
  const strongest = list[0] || null;
  const maxScore = strongest ? strongest.score : 0;
  const visualMatches = list.filter((match) => match.imageCompared).length;
  const riskLevel = maxScore >= 80 || (list.length >= 3 && maxScore >= 55)
    ? "High"
    : maxScore >= 55 || list.length >= 2
      ? "Medium"
      : "Low";
  return {
    flagged: list.length > 0,
    riskLevel: list.length ? riskLevel : "Clear",
    similarCount: list.length,
    visualMatchCount: visualMatches,
    strongestScore: strongest ? strongest.score : 0,
    strongestLabel: strongest ? `${strongest.name} (${strongest.brand}) - ${strongest.type}` : "",
  };
};

const openDuplicateRiskDialog = (matches, chosenBrandName) => new Promise((resolve) => {
  const topMatches = matches.slice(0, 3);
  const summary = summarizeDuplicateRiskMatches(matches);
  const esc = (str) => String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
  const dialog = document.createElement("dialog");
  dialog.className = "privacy-dialog";
  dialog.innerHTML = `
    <div class="dialog-body">
      <h3 style="margin-top:0">Duplicate Risk Check</h3>
      <div class="stats-hint">This wishlist item looks close to ${matches.length} owned item${matches.length === 1 ? "" : "s"}${chosenBrandName ? ` in ${esc(chosenBrandName)}` : ""}. Photo similarity leads when previews are available; text fields only fill the gaps.</div>
      <div class="stats-section" style="margin-top:12px">
        <div class="stats-row"><span class="stats-label">Risk level</span><span class="stats-value">${esc(summary.riskLevel)}</span></div>
        <div class="stats-row"><span class="stats-label">Similar owned items</span><span class="stats-value">${matches.length}</span></div>
        <div class="stats-row"><span class="stats-label">Photo-based matches</span><span class="stats-value">${summary.visualMatchCount}</span></div>
        <div class="stats-row"><span class="stats-label">Strongest match</span><span class="stats-value">${summary.strongestLabel ? esc(summary.strongestLabel) : "n/a"}</span></div>
      </div>
      <div class="stats-section-title" style="margin-top:12px">Closest matches</div>
      <div class="insights-action-list">${topMatches.map((match, index) => `<div class="stats-row stats-sub"><span class="stats-label">${index + 1}. ${esc(`${match.name} (${match.brand}) - ${match.type}`)}</span><span class="stats-value">Score ${match.score} · ${esc(match.reasons.join(" · "))}</span></div>`).join("")}</div>
      <div class="stats-hint" style="margin-top:12px">You can still move it. This is a pause-and-think guardrail, not a lockout.</div>
    </div>
    <div class="dialog-actions">
      <button type="button" class="btn" data-duplicate-cancel="1">Cancel</button>
      <button type="button" class="btn btn-move-confirm" data-duplicate-confirm="1">Move anyway</button>
    </div>
  `;
  document.body.appendChild(dialog);
  resetDialogScroll(dialog);
  openDialog(dialog);

  const cleanup = (result) => {
    closeDialog(dialog);
    dialog.remove();
    resolve(result);
  };

  const cancelBtn = dialog.querySelector("[data-duplicate-cancel='1']");
  const confirmBtn = dialog.querySelector("[data-duplicate-confirm='1']");
  if (cancelBtn) cancelBtn.addEventListener("click", () => cleanup(false));
  if (confirmBtn) confirmBtn.addEventListener("click", () => cleanup(true));
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    cleanup(false);
  });
});

const moveRowToInventory = async (rowId) => {
  if (appMode !== "wishlist") return;
  const row = state.rows.find((r) => r.id === rowId);
  if (!row) return;
  let invTabs = [];
  try {
    const stored = localStorage.getItem(TAB_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      invTabs = Array.isArray(parsed.tabs) ? parsed.tabs : [];
    }
  } catch (error) { /* ignore */ }
  if (!invTabs.length) return;
  invTabs.sort((a, b) => a.name.localeCompare(b.name));
  let chosenTabId = null;
  if (invTabs.length === 1) {
    chosenTabId = invTabs[0].id;
  } else {
    chosenTabId = await new Promise((resolve) => {
      const dialog = document.createElement("dialog");
      dialog.className = "privacy-dialog";
      Object.assign(dialog.style, { maxWidth: "340px", padding: "0" });
      const body = document.createElement("div");
      body.className = "dialog-body";
      const heading = document.createElement("h3");
      heading.textContent = "Move to Inventory";
      heading.style.marginTop = "0";
      body.appendChild(heading);
      const label = document.createElement("label");
      label.textContent = "Choose a tab:";
      label.style.display = "block";
      label.style.marginBottom = "6px";
      label.style.fontSize = "0.9rem";
      body.appendChild(label);
      const select = document.createElement("select");
      Object.assign(select.style, { width: "100%", padding: "6px", fontSize: "0.9rem" });
      invTabs.forEach((tab) => {
        const opt = document.createElement("option");
        opt.value = tab.id;
        opt.textContent = tab.name;
        select.appendChild(opt);
      });
      body.appendChild(select);
      dialog.appendChild(body);
      const actions = document.createElement("div");
      actions.className = "dialog-actions";
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "btn";
      cancelBtn.textContent = "Cancel";
      const moveBtn = document.createElement("button");
      moveBtn.type = "button";
      moveBtn.className = "btn btn-move-confirm";
      moveBtn.textContent = "Move";
      actions.appendChild(cancelBtn);
      actions.appendChild(moveBtn);
      dialog.appendChild(actions);
      document.body.appendChild(dialog);
      const cleanup = (result) => {
        dialog.close();
        dialog.remove();
        resolve(result);
      };
      cancelBtn.addEventListener("click", () => cleanup(null));
      moveBtn.addEventListener("click", () => cleanup(select.value));
      dialog.addEventListener("cancel", (e) => { e.preventDefault(); cleanup(null); });
      dialog.showModal();
    });
  }
  if (!chosenTabId) return;
  const wishlistColumns = state.columns;
  const cellValuesByName = {};
  wishlistColumns.forEach((col) => {
    const label = getColumnLabel(col).trim().toLowerCase();
    const val = row.cells[col.id];
    if (val) cellValuesByName[label] = val;
  });
  const chosenTab = invTabs.find((tab) => tab.id === chosenTabId);
  const duplicateMatches = await buildDuplicateRiskMatches(row, wishlistColumns, chosenTab);
  const duplicateRiskSummary = summarizeDuplicateRiskMatches(duplicateMatches);
  if (duplicateMatches.length) {
    const shouldContinue = await openDuplicateRiskDialog(
      duplicateMatches,
      chosenTab ? chosenTab.name : cellValuesByName.brand || ""
    );
    if (!shouldContinue) return;
  }
  let invState = null;
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}:${chosenTabId}`);
    if (stored) invState = JSON.parse(stored);
  } catch (error) { /* ignore */ }
  if (!invState || !Array.isArray(invState.columns)) return;
  const newRow = { id: createId(), cells: {}, tags: row.tags ? row.tags.slice() : [], createdAt: new Date().toISOString() };
  let invColOverrides = null;
  try {
    const s = localStorage.getItem(COLUMNS_KEY);
    if (s) invColOverrides = JSON.parse(s);
  } catch (error) { /* ignore */ }
  if (!invColOverrides) invColOverrides = {};
  invState.columns.forEach((col) => {
    const label = getColumnLabel(col).trim().toLowerCase();
    if (cellValuesByName[label]) {
      newRow.cells[col.id] = cellValuesByName[label];
      if (col.type === "select" && cellValuesByName[label].trim()) {
        const val = cellValuesByName[label].trim();
        const existing = (col.options || []).map((o) => String(o).toLowerCase());
        if (!existing.includes(val.toLowerCase())) {
          col.options = col.options || [];
          col.options.push(val);
          if (label === "fandom") {
            invColOverrides.fandomOptionsByTab = invColOverrides.fandomOptionsByTab || {};
            invColOverrides.fandomOptionsByTab[chosenTabId] = col.options.slice();
          }
          if (label === "type") {
            invColOverrides.typeOptionsByTab = invColOverrides.typeOptionsByTab || {};
            invColOverrides.typeOptionsByTab[chosenTabId] = col.options.slice();
          }
        }
      }
    } else {
      newRow.cells[col.id] = "";
    }
  });
  invState.rows.push(newRow);
  try {
    localStorage.setItem(`${STORAGE_KEY}:${chosenTabId}`, JSON.stringify(invState));
    localStorage.setItem(COLUMNS_KEY, JSON.stringify(invColOverrides));
  } catch (error) { /* ignore */ }
  delete savedModeState["inventory"];
  // Log the "Got it!" transfer for stats
  try {
    const gotItLog = JSON.parse(localStorage.getItem(GOT_IT_LOG_KEY) || "[]");
    const activeWishTab = tabsState.tabs.find((t) => t.id === tabsState.activeTabId);
    const obtainedAt = newRow.createdAt || new Date().toISOString();
    gotItLog.push({
      name: cellValuesByName["name"] || "Unnamed",
      fromTab: activeWishTab ? activeWishTab.name : "Wishlist",
      toTab: chosenTab ? chosenTab.name : "Inventory",
      date: obtainedAt,
      obtainedAt,
      wishlistRowId: row.id,
      inventoryRowId: newRow.id,
      inventoryTabId: chosenTabId,
      wishlistAddedAt: row.createdAt || "",
      type: cellValuesByName["type"] || "",
      brand: chosenTab ? chosenTab.name : (cellValuesByName["brand"] || ""),
      duplicateRisk: duplicateRiskSummary,
    });
    // Prune to 500 entries max, tracking trimmed count for lifetime total
    const GOT_IT_CAP = 500;
    if (gotItLog.length > GOT_IT_CAP) {
      const overflow = gotItLog.length - GOT_IT_CAP;
      gotItLog.splice(0, overflow);
      const prevTrimmed = parseInt(localStorage.getItem(GOT_IT_LOG_KEY + ":trimmed") || "0", 10);
      localStorage.setItem(GOT_IT_LOG_KEY + ":trimmed", String(prevTrimmed + overflow));
    }
    localStorage.setItem(GOT_IT_LOG_KEY, JSON.stringify(gotItLog));
  } catch (error) { /* ignore */ }
  state.rows = state.rows.filter((r) => r.id !== rowId);
  if (state.rows.length === 0) state.rows = [defaultRow()];
  saveState();
  renderTable();
  renderFooter();
};

const renderTabs = () => {
  if (!tabBar) return;
  tabBar.innerHTML = "";
  const tabContainer = (() => { const g = document.createElement("div"); g.className = "tab-grid"; return g; })();
  const canReorderTabs = !state.readOnly && !isViewerSession && PLATFORM === "desktop";
  let draggedTabId = null;
  const moveTab = (fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return;
    const fromIndex = tabsState.tabs.findIndex((tab) => tab.id === fromId);
    const toIndex = tabsState.tabs.findIndex((tab) => tab.id === toId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = tabsState.tabs.splice(fromIndex, 1);
    tabsState.tabs.splice(toIndex, 0, moved);
    saveTabsState();
    renderTabs();
  };

  tabsState.tabs.forEach((tab) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `tab-btn${tab.id === tabsState.activeTabId ? " active" : ""}`;
    btn.dataset.tabId = tab.id;
    btn.textContent = tab.name;
    const count = getTabRowCount(tab.id);
    const badge = document.createElement("span");
    badge.className = "tab-count";
    badge.textContent = count;
    btn.appendChild(badge);

    if (canReorderTabs && tabsState.tabs.length > 1) {
      btn.draggable = true;
      btn.setAttribute("aria-label", `${tab.name}. Drag to reorder tab`);
      btn.addEventListener("dragstart", (event) => {
        draggedTabId = tab.id;
        btn.classList.add("dragging");
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", tab.id);
        }
      });
      btn.addEventListener("dragover", (event) => {
        if (!draggedTabId || draggedTabId === tab.id) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
        btn.classList.add("drag-over");
      });
      btn.addEventListener("dragleave", () => {
        btn.classList.remove("drag-over");
      });
      btn.addEventListener("drop", (event) => {
        event.preventDefault();
        btn.classList.remove("drag-over");
        const fromId = draggedTabId || (event.dataTransfer ? event.dataTransfer.getData("text/plain") : "");
        moveTab(fromId, tab.id);
      });
      btn.addEventListener("dragend", () => {
        draggedTabId = null;
        btn.classList.remove("dragging");
        tabContainer.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
      });
    }

    btn.addEventListener("click", () => switchTab(tab.id));
    tabContainer.appendChild(btn);
  });
  tabBar.appendChild(tabContainer);
  {
    const controlsContainer = PLATFORM === "mobile" ? (() => { const c = document.createElement("div"); c.className = "tab-controls"; return c; })() : tabBar;
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "tab-btn add";
    addBtn.textContent = "➕ Add";
    addBtn.setAttribute("aria-label", "Add tab");
    addBtn.addEventListener("click", () => {
      openTabDialog();
    });
    controlsContainer.appendChild(addBtn);
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "tab-btn delete";
    deleteBtn.textContent = "🗑️ Delete";
    deleteBtn.setAttribute("aria-label", "Delete current tab");
    deleteBtn.addEventListener("click", () => {
      if (!tabsState.activeTabId) return;
      if (tabsState.tabs.length <= 1) return;
      openTabDeleteDialog(tabsState.activeTabId);
    });
    const renameBtn = document.createElement("button");
    renameBtn.type = "button";
    renameBtn.className = "tab-btn rename";
    renameBtn.textContent = "✏️ Edit";
    renameBtn.setAttribute("aria-label", "Rename current tab");
    renameBtn.addEventListener("click", async () => {
      if (!tabsState.activeTabId) return;
      const activeTab = tabsState.tabs.find((tab) => tab.id === tabsState.activeTabId);
      if (!activeTab) return;
      const nextName = await showTextPrompt("Rename Tab", "Tab name", activeTab.name || "");
      if (!nextName) return;
      const trimmed = nextName.trim();
      if (!trimmed) return;
      if (trimmed === activeTab.name) return;
      activeTab.name = trimmed;
      saveTabsState();
      saveState();
      renderTabs();
      renderTable();
      renderFooter();
    });
    controlsContainer.appendChild(renameBtn);
    controlsContainer.appendChild(deleteBtn);
    if (PLATFORM === "mobile") {
      tabBar.appendChild(controlsContainer);
    }
  }
  updateTabLogo();
};

const switchTab = (tabId) => {
  if (!tabId || tabId === tabsState.activeTabId) return;
  const nextTab = tabsState.tabs.find((tab) => tab.id === tabId);
  saveState();
  tabsState.activeTabId = tabId;
  saveTabsState();
  if (!canUseLocalStorage() && tabsState.embeddedData) {
    const payload = tabsState.embeddedData[tabId];
    if (payload) {
      applyStatePayload(payload);
      applyTabFandomOptions();
      applyTabTypeOptions();
      applyTabBrandOptions();
      ensureRowCells();
      if (isViewerSession) {
        state.readOnly = true;
      }
      applyViewerRedactions();
      warmPhotoSrcCache();
      renderTable();
      applyReadOnlyMode();
      renderTabs();
      prefetchPhotoSources();
      return;
    }
  }
  const existing = (() => {
    try {
      return localStorage.getItem(getStorageKey(tabId));
    } catch (error) {
      return null;
    }
  })();
  if (!existing) {
    seedTabState(tabId, createBlankStateFromCurrent());
  }
  loadState();
  normalizeNameColumnsEverywhere();
  normalizeSizeOptionsEverywhere();
  resetFilterDefault();
  if (appMode === "inventory" && removeBrandColumn()) {
    ensureRowCells();
    saveState();
  }
  if (globalColumns) {
    const previousColumns = state.columns.slice();
    ensureFandomInGlobalColumns();
    remapRowsToGlobalColumns(previousColumns);
    applyGlobalColumns();
  } else {
    ensureFandomInState(state);
    setGlobalColumns(state.columns);
  }
  applyTabFandomOptions();
  applyTabTypeOptions();
  applyTabBrandOptions();
  if (appMode === "wishlist") {
    enforceWishlistColumns();
    enforceWishlistDropdownDefaults();
  } else {
    enforceFixedDropdownDefaults();
  }
  pruneRowCells();
  ensureRowCells();
  migrateInlinePhotos();
  if (isViewerSession) {
    state.readOnly = true;
  }
  applyViewerRedactions();
  warmPhotoSrcCache();
  renderTable();
  applyReadOnlyMode();
  renderTabs();
  prefetchPhotoSources();
};

const reorderColumns = (fromId, toId) => {
  if (!fromId || !toId || fromId === toId) return;
  const fromIndex = state.columns.findIndex((col) => col.id === fromId);
  const toIndex = state.columns.findIndex((col) => col.id === toId);
  if (fromIndex === -1 || toIndex === -1) return;
  const [moved] = state.columns.splice(fromIndex, 1);
  state.columns.splice(toIndex, 0, moved);
  setGlobalColumns(state.columns);
  saveState();
  renderTable();
};

const updateRow = (id, key, value) => {
  const row = state.rows.find((item) => item.id === id);
  if (!row) return;
  if (!row.cells) row.cells = {};
  row.cells[key] = value ?? "";
  updateShirtUpdateDate();
  saveState();
  renderFooter();
};

const syncCellValue = (rowId, columnId, rawValue) => {
  const column = state.columns.find((col) => col.id === columnId);
  if (!column) return;
  if (column.type === "number") {
    const parsed = parseCurrency(rawValue);
    if (rawValue.trim() === "") {
      updateRow(rowId, columnId, "");
      return;
    }
    if (parsed !== null) {
      updateRow(rowId, columnId, parsed.toString());
      return;
    }
  }
  updateRow(rowId, columnId, rawValue);
};

const handleCellEvent = (event) => {
  const target = event.target;
  if (!target || !target.dataset) return;
  const rowId = target.dataset.rowId;
  const columnId = target.dataset.columnId;
  if (!rowId || !columnId) return;
  if (target.tagName === "SELECT" && target.value === "__add_new__") return;
  if (event.type === "input") {
    rememberEditStart(rowId, columnId);
  }
  if (event.type === "change") {
    const startValue = consumeEditStart(rowId, columnId);
    const fallbackRow = state.rows.find((item) => item.id === rowId);
    const prevValue = startValue ?? (fallbackRow && fallbackRow.cells ? fallbackRow.cells[columnId] : "");
    logRowChange(rowId, columnId, prevValue, target.value ?? "");
  }
  syncCellValue(rowId, columnId, target.value ?? "");
  const column = state.columns.find((col) => col.id === columnId);
  if (column && isShirtNameColumn(column)) scheduleNameSort();
  if (event.type === "change" && column) {
    const labelLower = getColumnLabel(column).trim().toLowerCase();
    if (labelLower === "type") {
      const typeVal = (target.value || "").trim().toLowerCase();
      const iconSrc = getTypeIconSrc(typeVal);
      const tr = target.closest("tr");
      if (tr) {
        const iconTd = tr.querySelector(".icon-cell");
        if (iconTd) {
          iconTd.innerHTML = "";
          if (typeVal) {
            iconTd.setAttribute("data-type", typeVal);
          } else {
            iconTd.removeAttribute("data-type");
          }
          if (iconSrc) {
            const img = document.createElement("img");
            img.src = iconSrc;
            img.alt = typeVal + " icon";
            iconTd.appendChild(img);
          }
        }
      }
      if (typeVal) {
        queueTypeIconPrompt(typeVal);
      }
    }
  }
};

const flushInputsToState = () => {
  const inputs = document.querySelectorAll("[data-row-id][data-column-id]");
  inputs.forEach((input) => {
    const rowId = input.dataset.rowId;
    const columnId = input.dataset.columnId;
    if (!rowId || !columnId) return;
    if (input.tagName === "SELECT" && input.value === "__add_new__") return;
    const row = state.rows.find((item) => item.id === rowId);
    if (!row) return;
    if (!row.cells) row.cells = {};
    row.cells[columnId] = input.value;
  });
};

const buildStateFromDom = () => {
  const columnMap = new Map(state.columns.map((column) => [column.id, column]));
  const storedRows = state.rows.map((row) => ({
    ...row,
    cells: { ...(row.cells || {}) },
  }));
  const storedMap = new Map(storedRows.map((row) => [row.id, row]));
  const domRows = Array.from(sheetBody.querySelectorAll("tr")).map((tr) => {
    const inputs = Array.from(tr.querySelectorAll("[data-row-id][data-column-id]"));
    const first = inputs[0];
    const rowId = first && first.dataset.rowId ? first.dataset.rowId : createId();
    const base = storedMap.get(rowId) || { id: rowId, cells: {} };
    const cells = { ...(base.cells || {}) };
    inputs.forEach((input) => {
      const columnId = input.dataset.columnId;
      if (!columnId) return;
      const column = columnMap.get(columnId);
      const rawValue = input.value;
      if (column && column.type === "number") {
        const parsed = parseCurrency(rawValue);
        cells[columnId] = parsed === null ? "" : parsed.toString();
        return;
      }
      cells[columnId] = rawValue;
    });
    return { ...base, id: rowId, cells };
  });
  const rows = domRows.length ? domRows : storedRows;
  return {
    ...serializeState(),
    columns: state.columns,
    rows,
  };
};

const sortAndRenderPreserveFocus = () => {
  const active = document.activeElement;
  const rowId = active && active.dataset ? active.dataset.rowId : null;
  const columnId = active && active.dataset ? active.dataset.columnId : null;
  const selectionStart = active && typeof active.selectionStart === "number" ? active.selectionStart : null;
  const selectionEnd = active && typeof active.selectionEnd === "number" ? active.selectionEnd : null;
  sortRows();
  renderRows();
  renderFooter();
  if (rowId && columnId) {
    const selector = `[data-row-id="${rowId}"][data-column-id="${columnId}"]`;
    const next = sheetBody.querySelector(selector);
    if (next) {
      next.focus();
      if (selectionStart !== null && selectionEnd !== null && typeof next.setSelectionRange === "function") {
        next.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  }
};

const scheduleNameSort = () => {
  if (sortTimer) window.clearTimeout(sortTimer);
  sortTimer = window.setTimeout(() => {
    sortAndRenderPreserveFocus();
  }, 250);
};

const onPhotoUpload = (id, columnId, file) => {
  if (!file) return;
  (async () => {
    try {
      const row = state.rows.find((item) => item.id === id);
      const prevValue = row && row.cells ? row.cells[columnId] : "";
      const rawBlob = file instanceof Blob ? file : new Blob([file]);
      const rawExt = file.name && file.name.includes(".")
        ? file.name.split(".").pop()
        : "jpg";
      const compressed = await compressImage(rawBlob, rawExt);
      const blob = compressed.blob;
      const extension = compressed.extension;
      if (supabase && currentUser) {
        const path = await uploadPhotoToSupabase(blob, extension);
        if (path) {
          logRowChange(id, columnId, prevValue, `supa:${path}`);
          updateRow(id, columnId, `supa:${path}`);
          renderRows();
          return;
        }
      }
      const photoId = await savePhotoBlob(blob);
      logRowChange(id, columnId, prevValue, `idb:${photoId}`);
      updateRow(id, columnId, `idb:${photoId}`);
      renderRows();
    } catch (error) {
      console.error("Failed to save photo", error);
      const reader = new FileReader();
      reader.onload = () => {
        logRowChange(id, columnId, prevValue, String(reader.result || ""));
        updateRow(id, columnId, String(reader.result || ""));
        renderRows();
      };
      reader.readAsDataURL(file);
    }
  })();
};

const deleteRow = (id) => {
  const target = state.rows.find((row) => row.id === id);
  if (target) {
    addEventLog("Deleted row", getRowName(target), snapshotRow(target));
    addToDeletedRows([target], tabsState.activeTabId, getActiveTabName(), appMode);
  }
  state.rows = state.rows.filter((row) => row.id !== id);
  if (state.rows.length === 0) {
    state.rows.push(defaultRow());
  }
  updateShirtUpdateDate();
  saveState();
  renderRows();
  renderFooter();
};

const updateDeleteSelectedState = () => {
  const selectableRows = Array.from(sheetBody.querySelectorAll(".row-select"));
  const anyChecked = sheetBody.querySelector(".row-select:checked");
  const allChecked = selectableRows.length > 0 && selectableRows.every((input) => input.checked);
  if (deleteSelectedButton) {
    deleteSelectedButton.disabled = !anyChecked;
  }
  if (deleteSelectedBottomButton) {
    deleteSelectedBottomButton.disabled = !anyChecked;
  }
  if (bulkTagsButton) {
    bulkTagsButton.disabled = !anyChecked;
    bulkTagsButton.style.display = appMode === "wishlist" ? "none" : "";
  }
  if (selectAllRowsButton) {
    selectAllRowsButton.disabled = !selectableRows.length || allChecked;
    selectAllRowsButton.style.display = appMode === "wishlist" ? "none" : "";
  }
};


const deleteSelectedRows = () => {
  if (state.readOnly) return;
  const checked = Array.from(sheetBody.querySelectorAll(".row-select:checked"));
  if (checked.length === 0) return;
  const ids = checked.map((input) => input.dataset.rowId).filter(Boolean);
  const removedRows = state.rows.filter((row) => ids.includes(row.id));
  addToDeletedRows(removedRows, tabsState.activeTabId, getActiveTabName(), appMode);
  state.rows = state.rows.filter((row) => !ids.includes(row.id));
  if (state.rows.length === 0) {
    state.rows.push(defaultRow());
  }
  addEventLog("Deleted rows", formatRowNameList(removedRows), removedRows.map(snapshotRow));
  updateShirtUpdateDate();
  saveState();
  renderRows();
  renderFooter();
};

const clearRowSelections = () => {
  sheetBody.querySelectorAll(".row-select:checked").forEach((input) => {
    input.checked = false;
  });
  updateDeleteSelectedState();
};

const selectAllVisibleRows = () => {
  const selectableRows = Array.from(sheetBody.querySelectorAll(".row-select"));
  if (!selectableRows.length) return;
  selectableRows.forEach((input) => {
    input.checked = true;
  });
  updateDeleteSelectedState();
};

const restoreRowSelections = (ids) => {
  if (!ids || !ids.length) return;
  sheetBody.querySelectorAll(".row-select").forEach((input) => {
    input.checked = ids.includes(input.dataset.rowId);
  });
  updateDeleteSelectedState();
};

const deleteColumn = (id) => {
  const column = state.columns.find((col) => col.id === id);
  if (column) {
    addEventLog("Deleted column", getColumnLabel(column));
  }
  state.columns = state.columns.filter((column) => column.id !== id);
  state.rows.forEach((row) => {
    if (row.cells) delete row.cells[id];
  });
  if (state.sort.columnId === id) {
    state.sort = { columnId: null, direction: "asc" };
  }
  if (state.filter.columnId === id) {
    state.filter.columnId = "all";
    filterColumnSelect.value = "all";
  }
  saveState();
  renderTable();
  setGlobalColumns(state.columns);
};

const getColumnLabel = (column) => column.name || "Untitled";

const TYPE_ICON_STORAGE_KEY = "shirts-type-icon-map";
const PUBLIC_SHARE_KEY = "shirts-public-share-id";
const PUBLIC_SHARE_VISIBILITY_KEY = "shirts-public-share-visibility-v1";
const PUBLIC_SHARE_BASE_URL = "https://shirt-tracker.com/";
const PROFILE_NAME_PROMPT_KEY = "shirts-profile-name-prompted";
const TYPE_ICON_DEFAULTS = {
  "four-way stretch blend": "assets/icons/shirt.png",
  "bottleblend": "assets/icons/shirt.png",
  "kunuflex": "assets/icons/shirt.png",
  "spoonerkloth": "assets/icons/shirt.png",
  "party shirt": "assets/icons/shirt.png",
  "candy floss": "assets/icons/shirt.png",
  "performance hoodie": "assets/icons/hoodie.png",
  "socks": "assets/icons/socks.png",
  "comfort hoodie": "assets/icons/comfort.png",
  "hoodie": "assets/icons/comfort.png",
  "boxer brief": "assets/icons/boxers.png",
  "boxer briefs": "assets/icons/boxers.png",
  "red tag": "assets/icons/shirt.png",
  "misc": "assets/icons/backpack.png",
  "hat": "assets/icons/hat.png",
  "outwear": "assets/icons/jacket.png",
  "outerwear": "assets/icons/jacket.png",
  "joggers": "assets/icons/pant.png",
  "polo": "assets/icons/polo.png",
  "breakfast balls polo": "assets/icons/polo.png",
  "button down": "assets/icons/shirt.png",
  "jacket": "assets/icons/jacket.png",
  "hybrid shorts": "assets/icons/shorts.png",
  "bamboo shorts": "assets/icons/shorts.png",
  "bamboo": "assets/icons/shirt.png",
  "d-tech flannel": "assets/icons/flannel.png",
  "borlandflex": "assets/icons/flannel.png",
};

const loadTypeIconMap = () => {
  if (!canUseLocalStorage()) return {};
  try {
    const stored = localStorage.getItem(TYPE_ICON_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
};

const saveTypeIconMap = (map) => {
  if (!canUseLocalStorage()) return;
  try {
    localStorage.setItem(TYPE_ICON_STORAGE_KEY, JSON.stringify(map));
  } catch (error) {
    // ignore
  }
};

const getTypeValueForRow = (row, { normalize = true } = {}) => {
  const typeColumn = state.columns.find(
    (column) => getColumnLabel(column).trim().toLowerCase() === "type"
  );
  if (!typeColumn || !row || !row.cells) return "";
  const raw = String(row.cells[typeColumn.id] || "").trim();
  return normalize ? raw.toLowerCase() : raw;
};

const getTypeIconSrc = (typeValue) => {
  if (!typeValue) return "";
  const custom = loadTypeIconMap()[typeValue];
  return custom || TYPE_ICON_DEFAULTS[typeValue] || "";
};


const ICON_CHOICES = [
  { label: "Shirt", src: "assets/icons/shirt.png" },
  { label: "Flannel", src: "assets/icons/flannel.png" },
  { label: "Polo", src: "assets/icons/polo.png" },
  { label: "Socks", src: "assets/icons/socks.png" },
  { label: "Performance Hoodie", src: "assets/icons/hoodie.png" },
  { label: "Comfort Hoodie", src: "assets/icons/comfort.png" },
  { label: "Boxers", src: "assets/icons/boxers.png" },
  { label: "Hat", src: "assets/icons/hat.png" },
  { label: "Jacket", src: "assets/icons/jacket.png" },
  { label: "Pants", src: "assets/icons/pant.png" },
  { label: "Shorts", src: "assets/icons/shorts.png" },
  { label: "Misc", src: "assets/icons/backpack.png" },
];

const promptedTypeIcons = new Set();
let pendingTypeIcon = null;
let customIconDataUrl = "";

let selectedIconValue = "";

const openTypeIconDialog = (typeValue) => {
  if (!typeIconDialog || !typeIconMessage) return;
  pendingTypeIcon = typeValue;
  customIconDataUrl = "";
  selectedIconValue = "";
  typeIconMessage.textContent = `Pick an icon for "${typeValue}".`;

  const grid = document.getElementById("type-icon-grid");
  if (!grid) return;
  grid.innerHTML = "";
  grid.style.cssText = "display:grid; grid-template-columns:repeat(4, 1fr); gap:8px; padding:8px 0; max-height:260px; overflow-y:auto;";

  const tileStyle = "display:flex; flex-direction:column; align-items:center; justify-content:center; padding:8px 4px; border:2px solid #ccc; border-radius:8px; cursor:pointer; background:#fafafa; min-height:72px;";
  const selectedTileStyle = tileStyle.replace("border:2px solid #ccc", "border:2px solid #4a90d9");
  const imgStyle = "width:36px; height:36px; object-fit:contain;";
  const labelStyle = "font-size:0.7rem; margin-top:4px; text-align:center; line-height:1.1; color:#333;";

  const selectTile = (tile, value) => {
    grid.querySelectorAll("[data-icon-tile]").forEach((t) => {
      t.style.cssText = tileStyle;
    });
    tile.style.cssText = selectedTileStyle;
    selectedIconValue = value;
    const uploadRow = document.getElementById("type-icon-upload-row");
    const previewDiv = document.getElementById("type-icon-preview");
    const uploadInput = document.getElementById("type-icon-upload");
    if (value === "__custom__") {
      if (uploadRow) uploadRow.style.display = "flex";
    } else {
      if (uploadRow) uploadRow.style.display = "none";
      if (previewDiv) previewDiv.style.display = "none";
      if (uploadInput) uploadInput.value = "";
      customIconDataUrl = "";
    }
  };

  ICON_CHOICES.forEach((option) => {
    const tile = document.createElement("div");
    tile.setAttribute("data-icon-tile", "");
    tile.style.cssText = tileStyle;
    const img = document.createElement("img");
    img.src = option.src;
    img.alt = option.label;
    img.style.cssText = imgStyle;
    const label = document.createElement("span");
    label.style.cssText = labelStyle;
    label.textContent = option.label;
    tile.appendChild(img);
    tile.appendChild(label);
    tile.addEventListener("click", () => selectTile(tile, option.src));
    grid.appendChild(tile);
  });

  const customTile = document.createElement("div");
  customTile.setAttribute("data-icon-tile", "");
  customTile.style.cssText = tileStyle;
  const plusSign = document.createElement("span");
  plusSign.textContent = "+";
  plusSign.style.cssText = "font-size:24px; color:#888; line-height:1;";
  const customLabel = document.createElement("span");
  customLabel.style.cssText = labelStyle;
  customLabel.textContent = "Upload\u2026";
  customTile.appendChild(plusSign);
  customTile.appendChild(customLabel);
  customTile.addEventListener("click", () => selectTile(customTile, "__custom__"));
  grid.appendChild(customTile);

  const uploadRow = document.getElementById("type-icon-upload-row");
  const uploadInput = document.getElementById("type-icon-upload");
  const previewDiv = document.getElementById("type-icon-preview");
  if (uploadRow) uploadRow.style.display = "none";
  if (previewDiv) previewDiv.style.display = "none";
  if (uploadInput) uploadInput.value = "";
  openDialog(typeIconDialog);
};

const queueTypeIconPrompt = (typeValue) => {
  if (!currentUser || isViewerSession || state.readOnly) return;
  if (!typeValue || promptedTypeIcons.has(typeValue)) return;
  if (getTypeIconSrc(typeValue)) return;
  promptedTypeIcons.add(typeValue);
  const matchingOption = (column) => {
    if (!column || column.type !== "select") return false;
    if (getColumnLabel(column).trim().toLowerCase() !== "type") return false;
    return (column.options || []).some((option) =>
      String(option || "").trim().toLowerCase() === String(typeValue || "").trim().toLowerCase()
    );
  };
  if (!state.columns.some(matchingOption)) return;
  openTypeIconDialog(typeValue);
};

const renderColumns = () => {
  columnManager.innerHTML = "";
  if (state.columns.length === 0) {
    columnManager.textContent = "No columns yet. Use \u201cAdd Column\u201d to build your sheet.";
    return;
  }
  const list = document.createElement("div");
  list.className = "column-manager-list";
  const hiddenIds = getHiddenColumnIds();

  let dragState = null;

  const getRows = () => Array.from(list.querySelectorAll(".column-row"));

  const onPointerMove = (clientY) => {
    if (!dragState) return;
    const dy = clientY - dragState.startY;
    dragState.row.style.transform = `translateY(${dy}px)`;
    dragState.row.style.zIndex = "10";
    const rows = getRows();
    for (const other of rows) {
      if (other === dragState.row) continue;
      const rect = other.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (clientY < mid && other.compareDocumentPosition(dragState.row) & Node.DOCUMENT_POSITION_FOLLOWING) {
        list.insertBefore(dragState.row, other);
        dragState.startY = clientY;
        dragState.row.style.transform = "translateY(0)";
        break;
      }
      if (clientY > mid && other.compareDocumentPosition(dragState.row) & Node.DOCUMENT_POSITION_PRECEDING) {
        list.insertBefore(dragState.row, other.nextSibling);
        dragState.startY = clientY;
        dragState.row.style.transform = "translateY(0)";
        break;
      }
    }
  };

  const onPointerUp = () => {
    if (!dragState) return;
    dragState.row.classList.remove("dragging");
    dragState.row.style.transform = "";
    dragState.row.style.zIndex = "";
    document.removeEventListener("mousemove", dragState.onMouseMove);
    document.removeEventListener("mouseup", dragState.onMouseUp);
    document.removeEventListener("touchmove", dragState.onTouchMove);
    document.removeEventListener("touchend", dragState.onTouchEnd);
    const newOrder = getRows().map((r) => r.dataset.columnId).filter(Boolean);
    const oldOrder = state.columns.map((c) => c.id);
    let changed = false;
    for (let i = 0; i < newOrder.length; i++) {
      if (newOrder[i] !== oldOrder[i]) { changed = true; break; }
    }
    if (changed) {
      const reordered = newOrder.map((id) => state.columns.find((c) => c.id === id)).filter(Boolean);
      state.columns = reordered;
      setGlobalColumns(state.columns);
      saveState();
      renderTable();
    }
    dragState = null;
  };

  state.columns.forEach((column) => {
    const isHidden = hiddenIds.has(column.id);
    const row = document.createElement("div");
    row.className = "column-row";
    if (isHidden) {
      row.style.opacity = "0.55";
    }
    if (!state.readOnly) {
      row.dataset.columnId = column.id;
    }
    const optionsSummary = column.type === "select" && Array.isArray(column.options)
      ? column.options.join(", ")
      : "\u2014";

    // Build column row with DOM APIs only — no innerHTML with user data (XSS prevention)
    const handle = document.createElement("div");
    handle.className = "column-drag-handle";
    handle.setAttribute("aria-label", "Drag to reorder");
    handle.textContent = "\u2261";

    const meta = document.createElement("div");
    meta.className = "column-meta";
    const nameDiv = document.createElement("div");
    nameDiv.className = "column-name";
    nameDiv.textContent = getColumnLabel(column);
    const typeDiv = document.createElement("div");
    typeDiv.className = "column-type";
    typeDiv.textContent = column.type || "text";
    meta.appendChild(nameDiv);
    meta.appendChild(typeDiv);

    const optionsDiv = document.createElement("div");
    optionsDiv.className = "column-type";
    optionsDiv.textContent = optionsSummary;

    const hideLabel = isHidden ? "Show" : "Hide";
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "edit-button";
    editBtn.setAttribute("aria-label", "Edit column");
    editBtn.textContent = "Edit";
    const hideBtn = document.createElement("button");
    hideBtn.type = "button";
    hideBtn.className = "hide-button";
    hideBtn.setAttribute("aria-label", `${hideLabel} column on this tab`);
    hideBtn.textContent = hideLabel;
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.setAttribute("aria-label", "Remove column");
    deleteBtn.textContent = "Delete";

    const actions = document.createElement("div");
    actions.className = "column-actions";
    actions.appendChild(editBtn);
    actions.appendChild(hideBtn);
    actions.appendChild(deleteBtn);

    row.appendChild(handle);
    row.appendChild(meta);
    row.appendChild(optionsDiv);
    row.appendChild(actions);

    if (handle && !state.readOnly) {
      const startDrag = (clientY) => {
        const onMouseMove = (e) => { e.preventDefault(); onPointerMove(e.clientY); };
        const onMouseUp = () => onPointerUp();
        const onTouchMove = (e) => { e.preventDefault(); onPointerMove(e.touches[0].clientY); };
        const onTouchEnd = () => onPointerUp();
        dragState = { row, startY: clientY, onMouseMove, onMouseUp, onTouchMove, onTouchEnd };
        row.classList.add("dragging");
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        document.addEventListener("touchmove", onTouchMove, { passive: false });
        document.addEventListener("touchend", onTouchEnd);
      };
      handle.addEventListener("mousedown", (e) => { e.preventDefault(); startDrag(e.clientY); });
      handle.addEventListener("touchstart", (e) => { e.preventDefault(); startDrag(e.touches[0].clientY); }, { passive: false });
    }
    editBtn.addEventListener("click", () => openColumnDialog(column));
    hideBtn.addEventListener("click", () => {
      const tabId = tabsState.activeTabId;
      if (!tabId) return;
      if (!Array.isArray(columnOverrides.hiddenColumnsByTab[tabId])) {
        columnOverrides.hiddenColumnsByTab[tabId] = [];
      }
      const hidList = columnOverrides.hiddenColumnsByTab[tabId];
      const idx = hidList.indexOf(column.id);
      if (idx === -1) {
        hidList.push(column.id);
      } else {
        hidList.splice(idx, 1);
      }
      saveColumnOverrides();
      renderTable();
    });
    deleteBtn.addEventListener("click", () => deleteColumn(column.id));
    list.appendChild(row);
  });
  columnManager.appendChild(list);
};

const renderFilterOptions = () => {
  const orderedColumns = (() => {
    const ids = Array.from(sheetHeadRow.querySelectorAll("th[data-column-id]"))
      .map((th) => th.dataset.columnId)
      .filter(Boolean);
    if (ids.length === 0) return getVisibleColumns();
    return ids
      .map((id) => state.columns.find((col) => col.id === id))
      .filter(Boolean);
  })();
  const allowTagsFilter = !publicShareToken && appMode !== "wishlist";
  filterColumnSelect.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All Columns";
  filterColumnSelect.appendChild(allOption);
  orderedColumns.forEach((column) => {
    const labelLower = getColumnLabel(column).trim().toLowerCase();
    if (column.type === "photo" || labelLower === "preview" || labelLower === "price") {
      return;
    }
    const option = document.createElement("option");
    option.value = column.id;
    option.textContent = getColumnLabel(column);
    filterColumnSelect.appendChild(option);
  });
  if (allowTagsFilter) {
    const tagsOption = document.createElement("option");
    tagsOption.value = "tags";
    tagsOption.textContent = "Tags";
    filterColumnSelect.appendChild(tagsOption);
    const forSaleOption = document.createElement("option");
    forSaleOption.value = "forSale";
    forSaleOption.textContent = "For Sale";
    filterColumnSelect.appendChild(forSaleOption);
  }
  const allowedIds = new Set(orderedColumns.map((column) => column.id));
  allowedIds.add("all");
  if (allowTagsFilter) {
    allowedIds.add("tags");
    allowedIds.add("forSale");
  }
  if (!allowedIds.has(state.filter.columnId)) {
    state.filter.columnId = "all";
    state.filter.query = "";
  }
  filterColumnSelect.value = state.filter.columnId || "all";
  filterQueryInput.value = state.filter.query || "";
  updateFilterInputMode();
};

const updateFilterInputMode = () => {
  if (!filterTagsSelect || !filterQueryInput) return;
  const columnId = filterColumnSelect.value;
  if (columnId === "forSale") {
    filterTagsSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select";
    filterTagsSelect.appendChild(placeholder);
    const yesOpt = document.createElement("option");
    yesOpt.value = "yes";
    yesOpt.textContent = "Yes";
    filterTagsSelect.appendChild(yesOpt);
    const noOpt = document.createElement("option");
    noOpt.value = "no";
    noOpt.textContent = "No";
    filterTagsSelect.appendChild(noOpt);
    filterTagsSelect.value = state.filter.query || "";
    filterTagsSelect.style.display = "";
    filterQueryInput.style.display = "none";
    return;
  }
  if (columnId === "tags") {
    if (publicShareToken) {
      filterTagsSelect.style.display = "none";
      filterQueryInput.style.display = "";
      return;
    }
    const usedTags = getUsedTags()
      .map((tag) => String(tag))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    filterTagsSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = usedTags.length ? "Select tag" : "No tags yet";
    filterTagsSelect.appendChild(placeholder);
    usedTags.forEach((tag) => {
      const option = document.createElement("option");
      option.value = tag;
      option.textContent = tag;
      filterTagsSelect.appendChild(option);
    });
    filterTagsSelect.value = state.filter.query || "";
    filterTagsSelect.style.display = "";
    filterQueryInput.style.display = "none";
    return;
  }
  const optionColumn = state.columns.find((column) => column.id === columnId);
  const optionLabel = optionColumn ? getColumnLabel(optionColumn).trim().toLowerCase() : "";
  const supportsDropdown = ["condition", "type", "size", "fandom"].includes(optionLabel);
  if (optionColumn && supportsDropdown) {
    const rawOptions = Array.isArray(optionColumn.options) && optionColumn.options.length
      ? optionColumn.options
      : getUsedValuesForColumn(optionColumn.id);
    const options = sortFilterOptionsForLabel(
      optionLabel,
      rawOptions
        .map((value) => String(value))
        .filter((value) => value.trim() !== "")
    );
    filterTagsSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = options.length ? `Select ${getColumnLabel(optionColumn)}` : "No options";
    filterTagsSelect.appendChild(placeholder);
    options.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      filterTagsSelect.appendChild(option);
    });
    filterTagsSelect.value = state.filter.query || "";
    filterTagsSelect.style.display = "";
    filterQueryInput.style.display = "none";
    return;
  }
  filterTagsSelect.style.display = "none";
  filterQueryInput.style.display = "";
};

let findBarPreviousFilter = null;
let findBarPreviousPadding = "";
let openFindBar = () => {};
let closeFindBar = () => {};

if (PLATFORM === "desktop") {
  openFindBar = () => {
    if (!findBar || !findBarInput || !filterColumnSelect || !filterQueryInput) return;
    if (!findBarPreviousFilter) {
      findBarPreviousFilter = { columnId: state.filter.columnId, query: state.filter.query };
    }
    state.filter.columnId = "all";
    filterColumnSelect.value = "all";
    state.filter.query = findBarInput.value || "";
    filterQueryInput.value = state.filter.query;
    updateFilterInputMode();
    findBar.style.display = "flex";
    if (!findBarPreviousPadding) {
      findBarPreviousPadding = document.body.style.paddingTop || "";
    }
    window.requestAnimationFrame(() => {
      document.body.style.paddingTop = `${findBar.offsetHeight || 44}px`;
    });
    findBarInput.focus();
    renderTable();
  };

  closeFindBar = () => {
    if (!findBar || !findBarInput || !filterColumnSelect || !filterQueryInput) return;
    findBar.style.display = "none";
    document.body.style.paddingTop = findBarPreviousPadding;
    findBarPreviousPadding = "";
    if (findBarPreviousFilter) {
      state.filter.columnId = findBarPreviousFilter.columnId || "all";
      state.filter.query = findBarPreviousFilter.query || "";
      filterColumnSelect.value = state.filter.columnId;
      filterQueryInput.value = state.filter.query;
      updateFilterInputMode();
      findBarPreviousFilter = null;
      renderTable();
    }
  };
}

const getDefaultColumnWidth = (column) => {
  if (column.type === "photo") return 110;
  const label = getColumnLabel(column).trim().toLowerCase();
  if (label === "condition") return 120;
  if (label === "size") return 90;
  if (label === "price") return 100;
  return 170;
};

const getColumnWidth = (columnId, column) => {
  const stored = state.columnWidths ? state.columnWidths[columnId] : null;
  if (typeof stored === "number" && stored > 50) return stored;
  return getDefaultColumnWidth(column);
};

const setColumnWidth = (columnId, width) => {
  if (!state.columnWidths) state.columnWidths = {};
  state.columnWidths[columnId] = width;
  saveState();
};

const syncTableScrollSizing = PLATFORM === "desktop" ? () => {
  if (!sheetTableScroll || !sheetTable) return;
  sheetTableScroll.style.overflowX = "auto";
  sheetTableScroll.style.width = "100%";
  sheetTableScroll.style.maxWidth = "100%";
  sheetTableScroll.style.webkitOverflowScrolling = "touch";
  sheetTable.style.width = "max-content";
  sheetTable.style.minWidth = "100%";
  if (tableScrollHint) {
    const hasOverflow = sheetTableScroll.scrollWidth > sheetTableScroll.clientWidth + 1;
    tableScrollHint.style.display = hasOverflow ? "block" : "none";
  }
} : () => {};

const attachResizer = (th, col, columnId, minWidth = 80) => {
  if (state.readOnly) return;
  const resizer = document.createElement("span");
  resizer.className = "col-resizer";
  resizer.addEventListener("mousedown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = col.getBoundingClientRect().width;
    const originalDraggable = th.getAttribute("draggable");
    th.setAttribute("draggable", "false");
    const onMove = (moveEvent) => {
      const next = Math.max(minWidth, startWidth + (moveEvent.clientX - startX));
      col.style.width = `${Math.round(next)}px`;
      th.style.width = `${Math.round(next)}px`;
    };
    const onUp = () => {
      const finalWidth = Math.round(col.getBoundingClientRect().width);
      setColumnWidth(columnId, finalWidth);
      syncTableScrollSizing();
      if (originalDraggable === null) {
        th.removeAttribute("draggable");
      } else {
        th.setAttribute("draggable", originalDraggable);
      }
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
  th.appendChild(resizer);
};


const renderHeader = () => {
  sheetHeadRow.innerHTML = "";
  sheetColgroup.innerHTML = "";
  deleteSelectedButton = null;
  const iconCol = document.createElement("col");
  iconCol.style.width = "36px";
  sheetColgroup.appendChild(iconCol);
  const iconTh = document.createElement("th");
  iconTh.className = "icon-header";
  iconTh.style.width = "36px";
  sheetHeadRow.appendChild(iconTh);
  getVisibleColumns().forEach((column) => {
    const col = document.createElement("col");
    const width = getColumnWidth(column.id, column);
    col.style.width = `${width}px`;
    sheetColgroup.appendChild(col);

    const th = document.createElement("th");
    const labelLower = getColumnLabel(column).trim().toLowerCase();
    if (column.type === "photo" || labelLower === "price") {
      th.classList.add("print-hide");
    }
    th.style.width = `${width}px`;
    if (!state.readOnly) {
      th.dataset.columnId = column.id;
    }
    const thContent = document.createElement("div");
    thContent.className = "th-content";
    const thLabel = document.createElement("span");
    thLabel.className = "th-label";
    thLabel.textContent = getColumnLabel(column);
    thContent.appendChild(thLabel);
    if (state.sort.columnId === column.id) {
      const arrow = document.createElement("span");
      arrow.textContent = state.sort.direction === "desc" ? " \u25BC" : " \u25B2";
      Object.assign(arrow.style, {
        fontSize: "0.6rem",
        marginLeft: "4px",
        color: "#c62828",
      });
      thContent.appendChild(arrow);
    }
    th.style.cursor = "pointer";
    th.addEventListener("click", () => {
      if (state.sort.columnId === column.id) {
        state.sort.direction = state.sort.direction === "asc" ? "desc" : "asc";
      } else {
        state.sort.columnId = column.id;
        state.sort.direction = "asc";
      }
      saveState();
      sortRows();
      renderRows();
      renderHeader();
      renderFooter();
    });
    th.appendChild(thContent);
    attachResizer(th, col, column.id, column.type === "photo" ? 90 : 80);
    sheetHeadRow.appendChild(th);
  });
  if (!state.readOnly) {
    const actions = document.createElement("th");
    actions.className = "actions-header";
    const actionsWidth = state.columnWidths && typeof state.columnWidths.actions === "number"
      ? state.columnWidths.actions
      : 90;
    actions.style.width = `${actionsWidth}px`;
    actions.textContent = "Actions";
    actions.style.textAlign = "center";
    sheetHeadRow.appendChild(actions);
    const col = document.createElement("col");
    col.style.width = `${actionsWidth}px`;
    sheetColgroup.appendChild(col);
    deleteSelectedButton = null;
    attachResizer(actions, col, "actions", 60);
  }
  syncTableScrollSizing();
};

const sortRows = () => {
  const sortCol = state.sort.columnId
    ? state.columns.find((col) => col.id === state.sort.columnId)
    : null;
  const targetCol = sortCol || state.columns.find((col) => isShirtNameColumn(col));
  if (!targetCol) return;
  const dir = sortCol ? (state.sort.direction === "desc" ? -1 : 1) : 1;
  const isNumeric = targetCol.type === "number";
  state.rows.sort((a, b) => {
    const aVal = a.cells ? a.cells[targetCol.id] : "";
    const bVal = b.cells ? b.cells[targetCol.id] : "";
    const aEmpty = aVal === "" || aVal === null || aVal === undefined;
    const bEmpty = bVal === "" || bVal === null || bVal === undefined;
    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1;
    if (bEmpty) return -1;
    if (isNumeric) {
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      if (Number.isNaN(aNum) && Number.isNaN(bNum)) return 0;
      if (Number.isNaN(aNum)) return 1;
      if (Number.isNaN(bNum)) return -1;
      return (aNum - bNum) * dir;
    }
    return String(aVal).localeCompare(String(bVal)) * dir;
  });
};

const applyReadOnlyToInput = (input) => {
  if (!state.readOnly) return;
  input.disabled = true;
  input.setAttribute("aria-disabled", "true");
};

const createCellInput = (row, column) => {
  const value = row.cells[column.id] || "";
  const isNameColumn = isShirtNameColumn(column);
  if (column.type === "select") {
    const labelLower = getColumnLabel(column).trim().toLowerCase();
    const select = document.createElement("select");
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "";
    select.appendChild(emptyOption);
    const sortedOptions = sortFilterOptionsForLabel(
      labelLower,
      (column.options || [])
        .map((option) => String(option))
        .filter((option) => option.trim() !== "")
    );
    sortedOptions.forEach((option) => {
      const opt = document.createElement("option");
      opt.value = option;
      opt.textContent = option;
      select.appendChild(opt);
    });
    if (!state.readOnly && labelLower !== "condition" && labelLower !== "size") {
      const addNewOpt = document.createElement("option");
      addNewOpt.value = "__add_new__";
      addNewOpt.textContent = "Add new\u2026";
      select.appendChild(addNewOpt);
    }
    select.value = value;
    select.addEventListener("input", (event) => {
      if (event.target.value === "__add_new__") return;
      updateRow(row.id, column.id, event.target.value);
      if (isNameColumn) scheduleNameSort();
    });
    select.addEventListener("change", async (event) => {
      if (event.target.value === "__add_new__") {
        const newValue = await showTextPrompt("Add New " + getColumnLabel(column), "New option");
        if (newValue && newValue.trim()) {
          const trimmed = newValue.trim();
          const existing = (column.options || []).map((o) => String(o).toLowerCase());
          if (!existing.includes(trimmed.toLowerCase())) {
            column.options.push(trimmed);
            const colLabel = labelLower;
            if (colLabel === "fandom" && tabsState.activeTabId) {
              columnOverrides.fandomOptionsByTab[tabsState.activeTabId] = column.options.slice();
              saveColumnOverrides();
            }
            if (colLabel === "type" && tabsState.activeTabId) {
              columnOverrides.typeOptionsByTab[tabsState.activeTabId] = column.options.slice();
              saveColumnOverrides();
            }
            if (colLabel === "brand" && tabsState.activeTabId) {
              columnOverrides.brandOptionsByTab = columnOverrides.brandOptionsByTab || {};
              columnOverrides.brandOptionsByTab[tabsState.activeTabId] = column.options.slice();
              saveColumnOverrides();
            }
            setGlobalColumns(state.columns);
            saveState();
          }
          updateRow(row.id, column.id, trimmed);
          renderTable();
          if (labelLower === "type") {
            setTimeout(() => queueTypeIconPrompt(trimmed.toLowerCase()), 0);
          }
        } else {
          select.value = value;
        }
        return;
      }
      updateRow(row.id, column.id, event.target.value);
      if (isNameColumn) scheduleNameSort();
    });
    select.addEventListener("blur", () => {
      if (isNameColumn) sortAndRenderPreserveFocus();
    });
    select.dataset.rowId = row.id;
    select.dataset.columnId = column.id;
    applyReadOnlyToInput(select);
    return select;
  }

  if (column.type === "notes") {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "cell-notes";
    input.value = value;
    input.addEventListener("input", (event) => {
      updateRow(row.id, column.id, event.target.value);
    });
    input.dataset.rowId = row.id;
    input.dataset.columnId = column.id;
    applyReadOnlyToInput(input);
    return input;
  }

  if (column.type === "photo") {
    const wrapper = document.createElement("div");
    wrapper.className = "photo-cell";
    const preview = document.createElement("div");
    preview.className = "photo-preview";
    if (value) {
      const img = document.createElement("img");
      img.alt = "Row photo";
      preview.appendChild(img);
      preview.addEventListener("click", async () => {
        const src = await getPhotoSrc(value);
        if (src) {
        activePhotoTarget = { rowId: row.id, columnId: column.id, value };
        photoDialogImage.src = src;
        openDialog(photoDialog);
        }
      });
      img.onerror = () => {
        if (img.dataset.retried) return;
        img.dataset.retried = "1";
        photoSrcCache.delete(value);
        const cache = loadSignedUrlCache();
        delete cache[value];
        saveSignedUrlCache(cache);
        getPhotoSrc(value).then((src) => {
          if (src) img.src = src;
        });
      };
      if (photoSrcCache.has(value)) {
        img.src = photoSrcCache.get(value);
      } else {
        getPhotoSrc(value).then((src) => {
          if (src) img.src = src;
        });
      }
    } else {
      preview.textContent = "No photo";
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.addEventListener("change", (event) => {
        const file = event.target.files && event.target.files[0];
        onPhotoUpload(row.id, column.id, file);
      });
      applyReadOnlyToInput(input);
      wrapper.appendChild(preview);
      wrapper.appendChild(input);
      return wrapper;
    }
    wrapper.appendChild(preview);
    return wrapper;
  }

  if (column.type === "text") {
    if (isNameColumn) {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "cell-text";
      input.value = value;
      input.addEventListener("input", (event) => {
        updateRow(row.id, column.id, event.target.value);
        scheduleNameSort();
      });
      input.addEventListener("blur", () => {
        sortAndRenderPreserveFocus();
      });
      input.dataset.rowId = row.id;
      input.dataset.columnId = column.id;
      applyReadOnlyToInput(input);
      return input;
    }
    const textarea = document.createElement("textarea");
    textarea.className = "cell-text";
    textarea.value = value;
    textarea.addEventListener("input", (event) => {
      updateRow(row.id, column.id, event.target.value);
    });
    textarea.dataset.rowId = row.id;
    textarea.dataset.columnId = column.id;
    applyReadOnlyToInput(textarea);
    return textarea;
  }

  if (column.type === "number") {
    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "decimal";
    const parsed = parseCurrency(value);
    if (value === "") {
      input.value = "";
    } else if (parsed === null) {
      input.value = value;
    } else {
      input.value = formatCurrency(parsed);
    }
    input.addEventListener("input", (event) => {
      const raw = event.target.value;
      const parsed = parseCurrency(raw);
      if (raw.trim() === "") {
        updateRow(row.id, column.id, "");
        return;
      }
      if (parsed !== null) {
        updateRow(row.id, column.id, parsed.toString());
      }
      if (isNameColumn) scheduleNameSort();
    });
    input.addEventListener("blur", (event) => {
      const raw = event.target.value;
      const parsed = parseCurrency(raw);
      if (raw.trim() === "") {
        event.target.value = "";
        return;
      }
      if (parsed !== null) {
        event.target.value = formatCurrency(parsed);
      } else {
        event.target.value = raw;
      }
      if (isNameColumn) sortAndRenderPreserveFocus();
    });
    input.dataset.rowId = row.id;
    input.dataset.columnId = column.id;
    applyReadOnlyToInput(input);
    return input;
  }

  const input = document.createElement("input");
  input.type = "date";
  input.value = value;
  input.addEventListener("input", (event) => {
    updateRow(row.id, column.id, event.target.value);
    if (isNameColumn) scheduleNameSort();
  });
  input.addEventListener("blur", () => {
    if (isNameColumn) sortAndRenderPreserveFocus();
  });
  input.dataset.rowId = row.id;
  input.dataset.columnId = column.id;
  applyReadOnlyToInput(input);
  return input;
};

const matchesFilter = (row, column, queryLower) => {
  const value = row.cells ? row.cells[column.id] : "";
  if (column.type === "photo") {
    const hasPhoto = Boolean(value);
    const truthy = ["yes", "true", "photo", "1"];
    const falsy = ["no", "false", "none", "0"];
    if (truthy.includes(queryLower)) return hasPhoto;
    if (falsy.includes(queryLower)) return !hasPhoto;
    return false;
  }
  return String(value ?? "").toLowerCase().includes(queryLower);
};

const getRowTags = (row) => {
  if (!row || !Array.isArray(row.tags)) return [];
  return row.tags.filter((tag) => String(tag || "").trim() !== "");
};

const isForSale = (row) => getRowTags(row).some((tag) => tag.toLowerCase() === FOR_SALE_TAG.toLowerCase());

const toggleForSale = (rowId) => {
  const row = state.rows.find((r) => r.id === rowId);
  if (!row) return;
  const tags = getRowTags(row);
  if (isForSale(row)) {
    setRowTags(rowId, tags.filter((t) => t.toLowerCase() !== FOR_SALE_TAG.toLowerCase()), "for-sale");
  } else {
    setRowTags(rowId, [...tags, FOR_SALE_TAG], "for-sale");
  }
};

const matchesTagFilter = (row, queryLower) => {
  const tags = getRowTags(row);
  if (!tags.length) return false;
  return tags.some((tag) => String(tag).toLowerCase().includes(queryLower));
};

const BASE_TAG_SUGGESTIONS = [
  "Floral",
  "Christmas",
  "Cinco de Mayo",
  "Halloween",
  "Holiday",
  "Patriotic",
  "Movie",
  "Animation",
  "Original",
  "Dropzone",
];

const loadCustomTags = () => {
  if (!canUseLocalStorage()) return [];
  try {
    const stored = localStorage.getItem(CUSTOM_TAGS_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (error) {
    return [];
  }
};

const saveCustomTags = (tags) => {
  if (!canUseLocalStorage()) return;
  try {
    localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(tags));
  } catch (error) {
    // ignore
  }
};

const persistNewTags = (incoming) => {
  const baseLower = new Set(BASE_TAG_SUGGESTIONS.map((t) => t.toLowerCase()));
  const current = loadCustomTags();
  const currentLower = new Set(current.map((t) => t.toLowerCase()));
  let changed = false;
  incoming.forEach((tag) => {
    const key = String(tag || "").trim().toLowerCase();
    if (!key) return;
    if (baseLower.has(key)) return;
    if (currentLower.has(key)) return;
    current.push(String(tag).trim());
    currentLower.add(key);
    changed = true;
  });
  if (changed) {
    saveCustomTags(current);
    scheduleSync();
  }
};

const normalizeTagsInput = (value) => String(value || "")
  .split(",")
  .map((tag) => String(tag || "").trim())
  .filter((tag) => tag.length > 0);

const mergeTags = (currentTags, incomingTags) => {
  const merged = new Map();
  currentTags.forEach((tag) => {
    const key = String(tag || "").toLowerCase();
    if (key) merged.set(key, String(tag));
  });
  incomingTags.forEach((tag) => {
    const key = String(tag || "").toLowerCase();
    if (key && !merged.has(key)) merged.set(key, String(tag));
  });
  return Array.from(merged.values());
};

const getAllTags = () => {
  const merged = new Map();
  BASE_TAG_SUGGESTIONS.forEach((tag) => {
    const key = String(tag).toLowerCase();
    if (key) merged.set(key, tag);
  });
  loadCustomTags().forEach((tag) => {
    const key = String(tag).toLowerCase();
    if (key && !merged.has(key)) merged.set(key, String(tag));
  });
  state.rows.forEach((row) => {
    getRowTags(row).forEach((tag) => {
      const key = String(tag).toLowerCase();
      if (key && !merged.has(key)) merged.set(key, String(tag));
    });
  });
  return Array.from(merged.values()).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
};

const getUsedTags = () => {
  const merged = new Map();
  state.rows.forEach((row) => {
    getRowTags(row).forEach((tag) => {
      const key = String(tag).toLowerCase();
      if (key && !merged.has(key)) merged.set(key, String(tag));
    });
  });
  return Array.from(merged.values());
};

const getUsedValuesForColumn = (columnId) => {
  const merged = new Map();
  state.rows.forEach((row) => {
    const value = row && row.cells ? row.cells[columnId] : "";
    String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length)
      .forEach((item) => {
        const key = item.toLowerCase();
        if (!merged.has(key)) merged.set(key, item);
      });
  });
  return Array.from(merged.values());
};

const normalizeFilterOption = (value) => String(value || "")
  .toLowerCase()
  .replace(/[\s\-\/\.]+/g, "");

const getSizeOrderIndex = (value) => {
  const normalized = normalizeFilterOption(value);
  const groups = [
    ["xs", "extrasmall", "xsmall"],
    ["s", "small"],
    ["m", "medium"],
    ["l", "large"],
    ["xl", "xlarge", "extralarge"],
    ["2xl", "xxl", "2x", "2xlarge", "2xlarge"],
    ["3xl", "xxxl", "3x", "3xlarge", "3xlarge"],
    ["4xl", "4x", "4xlarge", "4xlarge"],
    ["5xl", "5x", "5xlarge", "5xlarge"],
    ["na", "n/a"],
  ];
  for (let i = 0; i < groups.length; i += 1) {
    if (groups[i].includes(normalized)) return i;
  }
  return null;
};

const sortFilterOptionsForLabel = (label, options) => {
  if (label === "condition" || label === "size") {
    return options.slice();
  }
  return options.slice().sort((a, b) =>
    String(a).localeCompare(String(b), undefined, { sensitivity: "base" })
  );
};

const getSelectedRowIds = () => Array.from(
  sheetBody.querySelectorAll(".row-select:checked")
).map((input) => input.dataset.rowId).filter(Boolean);

const renderTagSuggestions = (query, row) => {
  if (!tagsSuggestions) return;
  tagsSuggestions.innerHTML = "";
  const queryLower = String(query || "").trim().toLowerCase();
  const existing = new Set(getRowTags(row).map((tag) => String(tag).toLowerCase()));
  const candidates = getAllTags().filter((tag) => {
    const key = String(tag).toLowerCase();
    if (existing.has(key)) return false;
    if (!queryLower) return true;
    return key.includes(queryLower);
  });
  if (!candidates.length) return;
  candidates.forEach((tag) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "btn secondary";
    chip.textContent = tag;
    chip.style.padding = "4px 8px";
    chip.style.fontSize = "0.8rem";
    chip.addEventListener("click", () => {
      const merged = mergeTags(getRowTags(row), [tag]);
      persistNewTags([tag]);
      setRowTags(activeTagsRowId, merged, "tags-suggest");
      if (tagsInput) tagsInput.value = "";
      renderTagsDialog();
    });
    tagsSuggestions.appendChild(chip);
  });
};

const renderBulkTagSuggestions = (query) => {
  if (!bulkTagsSuggestions) return;
  bulkTagsSuggestions.innerHTML = "";
  const queryLower = String(query || "").trim().toLowerCase();
  const candidates = getAllTags().filter((tag) => {
    const key = String(tag).toLowerCase();
    if (!queryLower) return true;
    return key.includes(queryLower);
  });
  if (!candidates.length) return;
  candidates.forEach((tag) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "btn secondary";
    chip.textContent = tag;
    chip.style.padding = "4px 8px";
    chip.style.fontSize = "0.8rem";
    chip.addEventListener("click", () => {
      addBulkTags([tag]);
    });
    bulkTagsSuggestions.appendChild(chip);
  });
};

const setRowTags = (rowId, nextTags, logContext = null) => {
  const row = state.rows.find((item) => item.id === rowId);
  if (!row) return;
  const previousTags = Array.isArray(row.tags) ? row.tags : [];
  const next = Array.isArray(nextTags) ? nextTags : [];
  row.tags = next;
  updateShirtUpdateDate();
  saveState();
  scheduleSync();
  renderRows();
  renderFooter();
  if (logContext) {
    const previousKeys = new Set(previousTags.map((tag) => String(tag).toLowerCase()));
    const nextKeys = new Set(next.map((tag) => String(tag).toLowerCase()));
    const added = next.filter((tag) => !previousKeys.has(String(tag).toLowerCase()));
    const removed = previousTags.filter((tag) => !nextKeys.has(String(tag).toLowerCase()));
    const rowName = getRowName(row);
    const typeValue = getTypeValueForRow(row, { normalize: false });
    const typeLabel = typeValue ? ` - ${typeValue}` : "";
    if (added.length) {
      addEventLog("Added tags", `${rowName}${typeLabel}: ${added.join(", ")}`);
    }
    if (removed.length) {
      addEventLog("Removed tags", `${rowName}${typeLabel}: ${removed.join(", ")}`);
    }
  }
};

const renderTagsDialog = () => {
  if (!tagsDialog || !tagsList || !activeTagsRowId) return;
  const row = state.rows.find((item) => item.id === activeTagsRowId);
  if (!row) return;
  const tags = getRowTags(row);
  renderTagSuggestions(tagsInput ? tagsInput.value : "", row);
  if (tagsRowName) {
    tagsRowName.textContent = `Row: ${getRowName(row)}`;
  }
  tagsList.innerHTML = "";
  if (!tags.length) {
    const empty = document.createElement("div");
    empty.textContent = "No tags yet.";
    empty.style.color = "var(--muted)";
    empty.style.fontSize = "0.85rem";
    tagsList.appendChild(empty);
    return;
  }
  tags.forEach((tag) => {
    const chip = document.createElement("div");
    chip.style.display = "inline-flex";
    chip.style.alignItems = "center";
    chip.style.gap = "6px";
    chip.style.padding = "4px 8px";
    chip.style.border = "1px solid var(--line)";
    chip.style.borderRadius = "12px";
    chip.style.background = "#f7f7f7";
    chip.style.fontSize = "0.85rem";
    const label = document.createElement("span");
    label.textContent = tag;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "x";
    remove.style.border = "none";
    remove.style.background = "transparent";
    remove.style.cursor = "pointer";
    remove.style.fontSize = "0.85rem";
    remove.addEventListener("click", () => {
      const nextTags = tags.filter((item) => item !== tag);
      setRowTags(activeTagsRowId, nextTags, "tags-dialog");
      renderTagsDialog();
    });
    chip.appendChild(label);
    chip.appendChild(remove);
    tagsList.appendChild(chip);
  });
};

const addTagsFromInput = () => {
  if (!tagsInput || !activeTagsRowId) return;
  const incoming = normalizeTagsInput(tagsInput.value);
  if (!incoming.length) return;
  const row = state.rows.find((item) => item.id === activeTagsRowId);
  if (!row) return;
  const currentTags = getRowTags(row);
  const merged = mergeTags(currentTags, incoming);
  persistNewTags(incoming);
  setRowTags(activeTagsRowId, merged, "tags-input");
  tagsInput.value = "";
  renderTagsDialog();
};

const showTagsMainView = () => {
  if (tagsMainView) tagsMainView.style.display = "";
  if (tagsManageView) tagsManageView.style.display = "none";
  if (tagsManageButton) tagsManageButton.textContent = "Manage Tags";
  renderTagsDialog();
};

const deleteGlobalTag = (tag) => {
  const tagLower = String(tag).toLowerCase();
  const custom = loadCustomTags().filter((t) => t.toLowerCase() !== tagLower);
  saveCustomTags(custom);
  state.rows.forEach((row) => {
    const current = getRowTags(row);
    if (current.some((t) => t.toLowerCase() === tagLower)) {
      const next = current.filter((t) => t.toLowerCase() !== tagLower);
      setRowTags(row.id, next, "manage-delete");
    }
  });
  addEventLog("Deleted tag", tag);
};

const renameGlobalTag = (oldTag, newTag) => {
  const oldLower = String(oldTag).toLowerCase();
  const newTrimmed = String(newTag || "").trim();
  if (!newTrimmed || newTrimmed.toLowerCase() === oldLower) return;
  const baseLower = new Set(BASE_TAG_SUGGESTIONS.map((t) => t.toLowerCase()));
  const custom = loadCustomTags();
  if (baseLower.has(oldLower)) {
    const alreadyExists = custom.some((t) => t.toLowerCase() === newTrimmed.toLowerCase());
    if (!alreadyExists) custom.push(newTrimmed);
  } else {
    const idx = custom.findIndex((t) => t.toLowerCase() === oldLower);
    if (idx !== -1) {
      custom[idx] = newTrimmed;
    } else {
      custom.push(newTrimmed);
    }
  }
  const dupeCheck = new Map();
  custom.forEach((t) => { const k = t.toLowerCase(); if (!dupeCheck.has(k)) dupeCheck.set(k, t); });
  saveCustomTags(Array.from(dupeCheck.values()));
  state.rows.forEach((row) => {
    const current = getRowTags(row);
    if (current.some((t) => t.toLowerCase() === oldLower)) {
      const next = current.map((t) => t.toLowerCase() === oldLower ? newTrimmed : t);
      setRowTags(row.id, next, "manage-rename");
    }
  });
  addEventLog("Renamed tag", `${oldTag} → ${newTrimmed}`);
  scheduleSync();
};

const renderManageTagsView = () => {
  if (!tagsManageList) return;
  tagsManageList.innerHTML = "";
  const allTags = getAllTags();
  if (!allTags.length) {
    const empty = document.createElement("div");
    empty.textContent = "No tags to manage.";
    empty.style.color = "var(--muted)";
    empty.style.fontSize = "0.85rem";
    tagsManageList.appendChild(empty);
    return;
  }
  allTags.forEach((tag) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "8px";
    const input = document.createElement("input");
    input.type = "text";
    input.value = tag;
    input.style.flex = "1";
    input.style.padding = "4px 8px";
    input.style.fontSize = "0.85rem";
    input.style.border = "1px solid var(--line)";
    input.style.borderRadius = "4px";
    const originalTag = tag;
    const commitRename = () => {
      const newVal = input.value.trim();
      if (newVal && newVal !== originalTag) {
        renameGlobalTag(originalTag, newVal);
        renderManageTagsView();
      }
    };
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); commitRename(); }
    });
    input.addEventListener("blur", commitRename);
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "btn secondary btn-delete-tag";
    deleteBtn.addEventListener("click", () => {
      deleteGlobalTag(originalTag);
      renderManageTagsView();
    });
    row.appendChild(input);
    row.appendChild(deleteBtn);
    tagsManageList.appendChild(row);
  });
};

const applyBulkTags = (incoming, mode = "add") => {
  const ids = getSelectedRowIds();
  if (!ids.length) return;
  if (mode === "add") persistNewTags(incoming);
  const incomingLower = new Set(incoming.map((tag) => String(tag).toLowerCase()));
  ids.forEach((rowId) => {
    const row = state.rows.find((item) => item.id === rowId);
    if (!row) return;
    const nextTags = mode === "remove"
      ? getRowTags(row).filter((tag) => !incomingLower.has(String(tag).toLowerCase()))
      : mergeTags(getRowTags(row), incoming);
    setRowTags(rowId, nextTags, "bulk-tags");
  });
  if (bulkTagsInput) bulkTagsInput.value = "";
  renderBulkTagSuggestions("");
  if (bulkTagsCount) {
    bulkTagsCount.textContent = `${ids.length} rows selected`;
  }
  restoreRowSelections(ids);
  const label = mode === "remove" ? "Removed tags" : "Added tags";
  addEventLog(label, `Bulk (${ids.length} rows): ${incoming.join(", ")}`);
};

const addBulkTags = (incoming) => {
  applyBulkTags(incoming, "add");
};

const removeBulkTags = (incoming) => {
  applyBulkTags(incoming, "remove");
};

const getFilteredRows = () => {
  const query = (state.filter.query || "").trim().toLowerCase();
  if (!query) return state.rows;
  if (state.filter.columnId === "all") {
    return state.rows.filter((row) =>
      state.columns.some((column) => matchesFilter(row, column, query)) || matchesTagFilter(row, query)
    );
  }
  if (state.filter.columnId === "tags") {
    return state.rows.filter((row) => matchesTagFilter(row, query));
  }
  if (state.filter.columnId === "forSale") {
    if (query === "yes") return state.rows.filter((row) => isForSale(row));
    if (query === "no") return state.rows.filter((row) => !isForSale(row));
    return state.rows;
  }
  const column = state.columns.find((col) => col.id === state.filter.columnId);
  if (!column) return state.rows;
  return state.rows.filter((row) => matchesFilter(row, column, query));
};

const renderRows = () => {
  flushInputsToState();
  if (emptyState.textContent && !(state.rows.length === 1 && state.columns.every((col) => !state.rows[0].cells[col.id]))) {
    emptyState.textContent = "";
    emptyState.style.cssText = "";
  }
  sheetBody.innerHTML = "";
  if (state.columns.length === 0) {
    return;
  }
  const rowsToRender = getFilteredRows();
  rowsToRender.forEach((row) => {
    const tr = document.createElement("tr");
    const iconTd = document.createElement("td");
    iconTd.className = "icon-cell";
    iconTd.setAttribute("data-label", "");
    const typeValue = getTypeValueForRow(row);
    const iconSrc = getTypeIconSrc(typeValue);
    if (typeValue) iconTd.setAttribute("data-type", typeValue);
    if (!state.readOnly && currentUser && !isViewerSession) {
      iconTd.style.cursor = "pointer";
    }
    if (iconSrc) {
      const img = document.createElement("img");
      img.src = iconSrc;
      img.alt = `${typeValue} icon`;
      iconTd.appendChild(img);
    }
    tr.appendChild(iconTd);
    let conditionTd = null;
    getVisibleColumns().forEach((column) => {
      const td = document.createElement("td");
      td.setAttribute("data-label", getColumnLabel(column));
      const labelLower = getColumnLabel(column).trim().toLowerCase();
      if (column.type === "photo" || labelLower === "price") {
        td.classList.add("print-hide");
      }
      if (labelLower === "condition") conditionTd = td;
      const cellEl = createCellInput(row, column);
      if (isShirtNameColumn(column) && isForSale(row)) {
        const wrapper = document.createElement("div");
        cellEl.style.borderBottom = "none";
        cellEl.style.borderBottomLeftRadius = "0";
        cellEl.style.borderBottomRightRadius = "0";
        wrapper.appendChild(cellEl);
        const badge = document.createElement("span");
        badge.textContent = "FOR SALE";
        Object.assign(badge.style, {
          display: "block",
          padding: "2px 8px",
          fontSize: "0.65rem",
          fontWeight: "700",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          background: "#2e7d32",
          color: "#fff",
          borderRadius: "0 0 4px 4px",
          fontFamily: "'Work Sans', 'Trebuchet MS', sans-serif",
        });
        wrapper.appendChild(badge);
        td.appendChild(wrapper);
      } else {
        td.appendChild(cellEl);
      }
      tr.appendChild(td);
    });

  if (!state.readOnly) {
    const actions = document.createElement("td");
    actions.setAttribute("data-label", "Actions");
    actions.className = "actions-cell";
    const actionsWrap = document.createElement("div");
    actionsWrap.style.display = "flex";
    actionsWrap.style.flexDirection = "column";
    actionsWrap.style.alignItems = "center";
    actionsWrap.style.gap = "6px";
    const tagsButton = document.createElement("button");
    tagsButton.type = "button";
    tagsButton.className = "btn-icon" + (getRowTags(row).length ? " has-tags" : "");
    tagsButton.textContent = "Tags";
    tagsButton.style.marginRight = "0";
    tagsButton.dataset.rowId = row.id;
    tagsButton.addEventListener("click", () => openTagsDialog(row.id));
    const checkbox = document.createElement("input");
    checkbox.className = "row-select";
    checkbox.type = "checkbox";
    checkbox.setAttribute("aria-label", "Select row");
    checkbox.dataset.rowId = row.id;
    checkbox.addEventListener("change", updateDeleteSelectedState);
    if (appMode !== "wishlist") {
      actionsWrap.appendChild(tagsButton);
      const saleBtn = document.createElement("button");
      saleBtn.type = "button";
      saleBtn.className = "btn-icon for-sale" + (isForSale(row) ? " active" : "");
      saleBtn.textContent = "For Sale";
      saleBtn.style.marginRight = "0";
      saleBtn.addEventListener("click", () => toggleForSale(row.id));
      actionsWrap.appendChild(saleBtn);
    }
    if (appMode === "wishlist") {
      const moveBtn = document.createElement("button");
      moveBtn.type = "button";
      moveBtn.className = "btn-icon got-it";
      moveBtn.textContent = "Got It!";
      moveBtn.style.marginRight = "0";
      moveBtn.addEventListener("click", () => moveRowToInventory(row.id));
      actionsWrap.appendChild(moveBtn);
    }
    actionsWrap.appendChild(checkbox);
    actions.appendChild(actionsWrap);
    tr.appendChild(actions);
  }

    // --- Wear tracking: shared control builder ---
    const buildWearControls = (targetRow) => {
      const inner = document.createElement("div");
      inner.className = "wear-panel-inner";
      const wc = targetRow.wearCount || 0;
      const lw = targetRow.lastWorn || null;

      const countStat = document.createElement("span");
      countStat.className = "wear-stat";
      countStat.innerHTML = `<span class="wear-stat-label">Total wears:</span> <span class="wear-stat-value">${wc}</span>`;
      inner.appendChild(countStat);

      const dateStat = document.createElement("span");
      dateStat.className = "wear-stat";
      dateStat.innerHTML = `<span class="wear-stat-label">Last worn:</span> <span class="wear-stat-value">${lw ? new Date(lw).toLocaleDateString() : "Never"}</span>`;
      inner.appendChild(dateStat);

      const dateInput = document.createElement("input");
      dateInput.type = "date";
      dateInput.className = "wear-date-input";
      dateInput.value = new Date().toISOString().slice(0, 10);
      dateInput.max = new Date().toISOString().slice(0, 10);
      inner.appendChild(dateInput);

      const logBtn = document.createElement("button");
      logBtn.type = "button";
      logBtn.className = "btn-log-wear";
      logBtn.textContent = "Log Wear";
      let undoTimer = null;
      let selectionTimer = null;
      logBtn.addEventListener("click", () => {
        if (logBtn.classList.contains("undo")) {
          // Undo: restore previous state
          clearTimeout(undoTimer);
          clearTimeout(selectionTimer);
          targetRow.wearCount = logBtn._prevCount;
          targetRow.lastWorn = logBtn._prevLastWorn;
          targetRow.wearLog = logBtn._prevWearLog;
          saveState();
          renderRows();
          return;
        }
        // Capture previous state for undo
        logBtn._prevCount = targetRow.wearCount || 0;
        logBtn._prevLastWorn = targetRow.lastWorn || null;
        logBtn._prevWearLog = targetRow.wearLog ? targetRow.wearLog.slice() : [];
        // Apply wear
        const chosen = dateInput.value || new Date().toISOString().slice(0, 10);
        const wornDate = new Date(chosen + "T12:00:00").toISOString();
        const todayKey = localDateKeyFromDate(new Date());
        const queueKey = getInsightsQueueKey({
          name: getRowName(targetRow),
          tab: getActiveTabName(),
          type: getTypeValueForRow(targetRow),
        });
        targetRow.wearCount = (targetRow.wearCount || 0) + 1;
        targetRow.lastWorn = wornDate;
        // Append to wearLog (lifetime — no trim)
        if (!targetRow.wearLog) targetRow.wearLog = [];
        targetRow.wearLog.push(wornDate);
        saveState();
        // Update display inline (avoid full re-render during undo window)
        countStat.querySelector(".wear-stat-value").textContent = String(targetRow.wearCount);
        dateStat.querySelector(".wear-stat-value").textContent = new Date(wornDate).toLocaleDateString();
        logBtn.textContent = "Undo";
        logBtn.classList.add("undo");
        clearTimeout(selectionTimer);
        if (appMode === "inventory" && queueKey) {
          selectionTimer = setTimeout(() => {
            trackInsightsQueueSelection(queueKey, todayKey);
          }, 5000);
        }
        undoTimer = setTimeout(() => {
          logBtn.textContent = "Log Wear";
          logBtn.classList.remove("undo");
        }, 5000);
      });
      inner.appendChild(logBtn);
      return inner;
    };

    // --- Wear tracking: mobile inline card section (before actions) ---
    if (PLATFORM === "mobile" && appMode === "inventory" && !state.readOnly) {
      const wearTd = document.createElement("td");
      wearTd.className = "wear-card-section";
      wearTd.setAttribute("data-label", "Wear Tracking");
      wearTd.appendChild(buildWearControls(row));
      const actionsCell = tr.querySelector(".actions-cell");
      if (actionsCell) {
        tr.insertBefore(wearTd, actionsCell);
      } else {
        tr.appendChild(wearTd);
      }
    }

    sheetBody.appendChild(tr);

    // --- Wear tracking: desktop expandable sub-row ---
    if (PLATFORM === "desktop" && appMode === "inventory" && !state.readOnly) {
      const wearTr = document.createElement("tr");
      wearTr.className = "wear-panel-row";
      const colSpan = getVisibleColumns().length + 2;
      const wearTd = document.createElement("td");
      wearTd.className = "wear-panel-cell";
      wearTd.setAttribute("colspan", String(colSpan));
      wearTd.appendChild(buildWearControls(row));
      wearTr.appendChild(wearTd);
      sheetBody.appendChild(wearTr);

      // Toggle below Condition column (falls back to icon cell if Condition is hidden)
      const toggleParent = conditionTd || iconTd;
      const wearToggle = document.createElement("button");
      wearToggle.type = "button";
      wearToggle.className = "wear-toggle";
      wearToggle.textContent = "\u25B6";
      wearToggle.setAttribute("aria-label", "Toggle wear details");
      toggleParent.appendChild(wearToggle);

      wearToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = wearTr.classList.toggle("open");
        wearToggle.textContent = isOpen ? "\u25BC" : "\u25B6";
      });
    }
  });
  updateDeleteSelectedState();
    };

const renderFooter = () => {
  const rowsToRender = getFilteredRows();
  totalCountEl.textContent = `Total items: ${rowsToRender.length}`;
  if (state.readOnly) {
    totalCostEl.textContent = "";
    positionTotalCount();
    return;
  }
  const priceColumn = state.columns.find(
    (column) => column.type === "number" && getColumnLabel(column).trim().toLowerCase() === "price"
  );
  const priceHidden = priceColumn && getHiddenColumnIds().has(priceColumn.id);
  if (!priceColumn || priceHidden) {
  totalCostEl.textContent = "";
  totalCostEl.style.display = "none";
  positionTotalCount();
  return;
}
  const prices = [];
  rowsToRender.forEach((row) => {
    const raw = row.cells ? row.cells[priceColumn.id] : "";
    const parsed = parseCurrency(raw);
    if (parsed !== null) prices.push(parsed);
  });
  const sum = prices.reduce((acc, p) => acc + p, 0);
  const avg = prices.length ? sum / prices.length : 0;
  totalCostEl.style.display = "";
  totalCostEl.innerHTML = "";
  const lines = [
    `Total: ${formatCurrency(sum)}`,
    `Avg: ${formatCurrency(avg)}`,
  ];
  if (PLATFORM === "mobile") {
    Object.assign(totalCostEl.style, {
      display: "flex",
      flexDirection: "column",
    });
    lines.forEach((text) => {
      const span = document.createElement("span");
      span.textContent = text;
      totalCostEl.appendChild(span);
    });
  } else {
    lines.forEach((text, i) => {
      const span = document.createElement("span");
      span.textContent = text;
      totalCostEl.appendChild(span);
      if (i < lines.length - 1) {
        const sep = document.createElement("span");
        sep.textContent = " | ";
        Object.assign(sep.style, { color: "#ccc", margin: "0 2px" });
        totalCostEl.appendChild(sep);
      }
    });
  }
  positionTotalCount();
};

const renderTable = () => {
  if (state.columns.length === 0) {
    emptyState.textContent = "Your sheet is empty. Add a column to start tracking shirts.";
    emptyState.style.cssText = "";
  } else if (state.rows.length === 1 && state.columns.every((col) => !state.rows[0].cells[col.id])) {
    emptyState.textContent = "";
    Object.assign(emptyState.style, {
      textAlign: "center",
      padding: "32px 20px 24px",
    });
    const heading = document.createElement("div");
    Object.assign(heading.style, {
      fontSize: "1.1rem",
      fontWeight: "700",
      color: "#444",
      marginBottom: "6px",
      letterSpacing: "0.02em",
    });
    heading.textContent = "Welcome to Shirt Tracker!";
    const body = document.createElement("div");
    Object.assign(body.style, {
      fontSize: "0.88rem",
      fontWeight: "400",
      color: "#888",
      lineHeight: "1.5",
    });
    body.textContent = PLATFORM === "mobile"
      ? "Start by filling in your first row below. Tap the ? button in the bottom-right corner anytime for help."
      : "Start by filling in your first row below. Click the ? button in the bottom-right corner anytime for help.";
    emptyState.appendChild(heading);
    emptyState.appendChild(body);
  } else {
    emptyState.textContent = "";
    emptyState.style.cssText = "";
  }
  renderColumns();
  renderHeader();
  renderFilterOptions();
  sortRows();
  renderRows();
  renderFooter();
};

const escapeCsv = (value) => {
  const safe = String(value ?? "");
  if (/["]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  if (/[\n,]/.test(safe)) {
    return `"${safe}"`;
  }
  return safe;
};

const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const exportCsv = () => {
  if (state.columns.length === 0) return;
  const exportState = buildStateFromDom();
  const exportColumns = exportState.columns.filter((column) => {
    const labelLower = getColumnLabel(column).trim().toLowerCase();
    return column.type !== "photo" && labelLower !== "preview";
  });
  const headers = exportColumns.map((column) => escapeCsv(getColumnLabel(column)));
  headers.push(escapeCsv("Tags"));
  const lines = [headers.join(",")];
  exportState.rows.forEach((row) => {
    const cells = exportColumns.map((column) => {
      const value = row.cells ? row.cells[column.id] : "";
      return escapeCsv(value || "");
    });
    const tags = getRowTags(row).join(", ");
    cells.push(escapeCsv(tags));
    lines.push(cells.join(","));
  });
  downloadFile(lines.join("\n"), "shirt-tracker.csv", "text/csv;charset=utf-8;");
  addEventLog("Exported CSV");
};

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const getStatsExportBaseName = (stats) => {
  const mode = stats && stats.isInventory ? "inventory" : "wishlist";
  const stamp = new Date().toISOString().replace(/[:]/g, "-").replace(/\..+$/, "");
  return `shirt-tracker-${mode}-stats-${stamp}`;
};

const buildStatsCsvRows = (stats) => {
  const rows = [["Section", "Metric", "Value", "Details"]];
  const push = (section, metric, value, details = "") => {
    rows.push([section, metric, value, details]);
  };
  const pushPairs = (section, metricPrefix, pairs) => {
    (pairs || []).forEach(([label, count]) => {
      push(section, `${metricPrefix}: ${label}`, String(count));
    });
  };

  push("Summary", "Mode", stats.isInventory ? "Inventory" : "Wishlist");
  push("Summary", "Total items", String(stats.totalItems || 0));
  push("Summary", "Generated at", new Date().toISOString());

  if (stats.isInventory) {
    push("Pricing", "Total value", String(stats.totalCost || 0));
    push("Pricing", "Mean price", String(stats.meanPrice || 0));
    push("Pricing", "Median price", String(stats.medianPrice || 0));
    push("Pricing", "Price std deviation", String(stats.priceStdDev || 0));
  }

  (stats.perTab || []).forEach((tab) => {
    push("Tabs", `Items in ${tab.name}`, String(tab.count || 0));
    if (stats.isInventory && tab.stats && typeof tab.stats.totalCost === "number") {
      push("Tabs", `Value in ${tab.name}`, String(tab.stats.totalCost || 0));
    }
  });

  pushPairs("Tallies", "Type", stats.typeTally);
  pushPairs("Tallies", "Fandom", stats.fandomTally);
  pushPairs("Tallies", "Size", stats.sizeTally);
  pushPairs("Tallies", "Condition", stats.conditionTally);
  pushPairs("Tallies", "Tag", stats.topTags);

  if (stats.isInventory) {
    (stats.topRotationScore || []).forEach((item, idx) => {
      const tieTag = item.isTie ? " (tie)" : "";
      const score = (item.rotationScorePoints || 0) / 100;
      push("Wear", `Top rotation #${idx + 1}${tieTag}`, score.toFixed(2), `${item.name} (${item.tab})${item.type ? ` - ${item.type}` : ""}, wears=${item.wearCount || 0}`);
    });
    (stats.costPerWear || []).forEach((item, idx) => {
      push("Wear", `Best CPW #${idx + 1}`, String(item.cpw || 0), `${item.name} (${item.tab})`);
    });
    (stats.unwornOverSixMonths || []).forEach((item) => {
      push("Wear", "Unworn > 6 months", String(item.daysSince || "Never"), `${item.name} (${item.tab})`);
    });
    (stats.brandByDayOfWeek || []).forEach((item) => {
      push("Wear", `Top brand on ${item.day}`, item.brand || "-", String(item.count || 0));
    });
    (stats.brandByMonth || []).forEach((item) => {
      push("Wear", `Top brand in ${item.month}`, item.brand || "-", String(item.count || 0));
    });
  }

  (stats.allRecentlyAdded || []).forEach((item) => {
    push("Recently added", item.name || "Unnamed", item.createdAt || "", `${item.tab || ""}${item.type ? ` | ${item.type}` : ""}`);
  });

  const adv = stats.advanced || {};
  if (stats.isInventory && adv.closetHealth) {
    push("Advanced", "Closet health score", String(adv.closetHealth.score || 0));
    push("Advanced", "Recency %", String(adv.closetHealth.recencyPct || 0));
    push("Advanced", "Never worn %", String(adv.closetHealth.neverWornPct || 0));
    push("Advanced", "Inactive value %", String(adv.closetHealth.inactiveValuePct || 0));
    push("Advanced", "CPW efficiency %", String(adv.closetHealth.cpwEffPct || 0));
  }
  (adv.firstWearLagAll || []).forEach((item) => {
    push("Advanced", "First-wear lag (days)", String(item.firstWearLagDays || 0), `${item.name} (${item.tab})`);
  });
  (adv.brandUtilization || []).forEach((item) => {
    push("Advanced", `Brand utilization: ${item.brand}`, String(item.utilizationPct || 0), `inventory=${item.inventory}, worn365=${item.wornLast365}`);
  });

  return rows.map((cols) => cols.map((col) => escapeCsv(col)).join(",")).join("\n");
};

const exportStatsJson = (stats) => {
  const payload = {
    generatedAt: new Date().toISOString(),
    version: APP_VERSION,
    mode: stats.isInventory ? "inventory" : "wishlist",
    stats,
  };
  downloadFile(JSON.stringify(payload, null, 2), `${getStatsExportBaseName(stats)}.json`, "application/json;charset=utf-8;");
  addEventLog("Exported stats JSON");
};

const exportStatsCsv = (stats) => {
  const csv = buildStatsCsvRows(stats);
  downloadFile(csv, `${getStatsExportBaseName(stats)}.csv`, "text/csv;charset=utf-8;");
  addEventLog("Exported stats CSV");
};

const exportStatsPdf = (stats, options = {}) => {
  const isFullExport = !!options.full;
  const modeLabel = stats.isInventory ? "Inventory" : "Wishlist";
  const generatedAt = new Date();
  const adv = stats.advanced || {};

  const renderKvTable = (rows) => {
    if (!rows.length) return "";
    return `<table class="kv-table"><tbody>${rows.map((item) => `<tr><th>${escapeHtml(item.label)}</th><td>${escapeHtml(item.value)}</td></tr>`).join("")}</tbody></table>`;
  };

  const renderSimpleTable = (headers, rows) => {
    if (!rows.length) return `<div class="empty-note">No data yet.</div>`;
    return `
      <table class="data-table">
        <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((cols) => `<tr>${cols.map((col) => `<td>${escapeHtml(col)}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    `;
  };

  const tallyLine = (pairs) => {
    if (!Array.isArray(pairs) || !pairs.length) return "No data yet.";
    const maxItems = isFullExport ? pairs.length : 10;
    return pairs.slice(0, maxItems).map(([label, count]) => `${label} (${count})`).join(", ");
  };

  const summaryRows = [
    { label: "Mode", value: modeLabel },
    { label: "Generated", value: generatedAt.toLocaleString() },
    { label: "App version", value: APP_VERSION },
    { label: "Total items", value: String(stats.totalItems || 0) },
  ];
  if (stats.isInventory) {
    summaryRows.push({ label: "Total value", value: formatCurrency(stats.totalCost || 0) });
    summaryRows.push({ label: "Mean price", value: formatCurrency(stats.meanPrice || 0) });
    summaryRows.push({ label: "Median price", value: formatCurrency(stats.medianPrice || 0) });
    if (adv.closetHealth) {
      summaryRows.push({ label: "Closet health score", value: String(adv.closetHealth.score || 0) });
    }
  }

  const tabRows = (stats.perTab || []).map((tab) => {
    const value = stats.isInventory && tab.stats ? formatCurrency(tab.stats.totalCost || 0) : "-";
    return [tab.name || "Unnamed", String(tab.count || 0), value];
  });

  const topWornRows = (stats.topRotationScore || []).map((item, index) => [
    String(index + 1),
    `${item.name || "Unnamed"} (${item.tab || ""})${item.type ? ` - ${item.type}` : ""}${item.isTie ? " (tie)" : ""}`,
    ((item.rotationScorePoints || 0) / 100).toFixed(2),
    String(item.wearCount || 0),
  ]);

  const firstWearLagRows = (adv.firstWearLagAll || []).slice(0, isFullExport ? (adv.firstWearLagAll || []).length : 15).map((item, index) => [
    String(index + 1),
    `${item.name || "Unnamed"} (${item.tab || ""})`,
    String(item.firstWearLagDays || 0),
    item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "",
    item.firstWearAt ? new Date(item.firstWearAt).toLocaleDateString() : "",
  ]);

  const recentRows = (stats.allRecentlyAdded || []).slice(0, isFullExport ? (stats.allRecentlyAdded || []).length : 25).map((item) => [
    item.name || "Unnamed",
    item.tab || "",
    item.type || "",
    item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "",
    item.price !== null && item.price !== undefined && item.price > 0 ? formatCurrency(item.price) : "",
  ]);

  const unwornRows = (stats.unwornOverSixMonths || []).slice(0, isFullExport ? (stats.unwornOverSixMonths || []).length : 40).map((item, index) => [
    String(index + 1),
    `${item.name || "Unnamed"} (${item.tab || ""})${item.type ? ` - ${item.type}` : ""}`,
    String(item.daysSince === null ? "Never" : item.daysSince),
  ]);

  const wearEventRows = (stats.wearEvents || []).slice(0, isFullExport ? (stats.wearEvents || []).length : 100).map((event, index) => [
    String(index + 1),
    event.name || "Unnamed",
    event.tab || "",
    event.type || "",
    event.wornAt ? new Date(event.wornAt).toLocaleString() : "",
  ]);

  const brandUtilRows = (adv.brandUtilization || []).slice(0, isFullExport ? (adv.brandUtilization || []).length : 40).map((item) => [
    item.brand || "",
    String(item.inventory || 0),
    String(item.wornLast365 || 0),
    `${item.utilizationPct || 0}%`,
    item.avgCpw === null || item.avgCpw === undefined ? "n/a" : formatCurrency(item.avgCpw),
  ]);

  const spendWearRows = (adv.monthlySpendVsWear || []).slice(0, isFullExport ? (adv.monthlySpendVsWear || []).length : 24).map((item) => [
    item.label || "",
    String(item.added || 0),
    formatCurrency(item.spend || 0),
    String(item.wears || 0),
    item.spendPerWear === null || item.spendPerWear === undefined ? "n/a" : formatCurrency(item.spendPerWear),
  ]);

  const typeRotationRows = (adv.typeRotationBalance || []).slice(0, isFullExport ? (adv.typeRotationBalance || []).length : 30).map((item) => [
    item.type || "",
    String(item.inventoryCount || 0),
    String(item.wearCount || 0),
    `${(item.inventoryPct || 0).toFixed(1)}%`,
    `${(item.wearPct || 0).toFixed(1)}%`,
    `${(item.deltaPct || 0).toFixed(1)}%`,
  ]);

  const seasonalityRows = (adv.seasonalityByMonth || []).map((item) => [
    item.month || "",
    item.type || "-",
    String(item.count || 0),
  ]);

  const tagPerformanceRows = (adv.tagPerformance || []).slice(0, isFullExport ? (adv.tagPerformance || []).length : 40).map((item) => [
    item.tag || "",
    String(item.samples || 0),
    (item.avgWears || 0).toFixed(1),
    item.avgCpw === null || item.avgCpw === undefined ? "n/a" : formatCurrency(item.avgCpw),
  ]);

  const topBrandStreakRows = ((adv.repeatWearStreaks && adv.repeatWearStreaks.topBrandStreaks) || []).map((item, index) => [
    String(index + 1),
    item.label || "",
    `${item.streak || 0} days`,
  ]);

  const topTypeStreakRows = ((adv.repeatWearStreaks && adv.repeatWearStreaks.topTypeStreaks) || []).map((item, index) => [
    String(index + 1),
    item.label || "",
    `${item.streak || 0} days`,
  ]);

  const section = (title, body) => `<section class="report-section"><h2>${escapeHtml(title)}</h2>${body}</section>`;

  const printable = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Shirt Tracker ${escapeHtml(modeLabel)} Stats Report</title>
  <style>
    body { font-family: "Georgia", "Times New Roman", serif; margin: 24px; color: #141414; line-height: 1.4; }
    h1 { margin: 0 0 8px 0; font-size: 24px; }
    h2 { margin: 0 0 10px 0; font-size: 16px; }
    .meta { margin: 0 0 16px 0; font-size: 12px; color: #555; }
    .report-section { margin: 0 0 18px 0; page-break-inside: avoid; }
    .kv-table, .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .kv-table th, .kv-table td, .data-table th, .data-table td { border: 1px solid #cfcfcf; padding: 6px 8px; text-align: left; vertical-align: top; }
    .kv-table th { width: 28%; background: #f5f5f5; }
    .data-table thead th { background: #f5f5f5; }
    .inline-note { margin: 0; font-size: 12px; }
    .empty-note { font-size: 12px; color: #666; }
    .footer-note { margin-top: 18px; font-size: 11px; color: #666; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <h1>Shirt Tracker ${escapeHtml(modeLabel)} Stats Report</h1>
  <div class="meta">Generated ${escapeHtml(generatedAt.toLocaleString())} | Version ${escapeHtml(APP_VERSION)}</div>
  ${section("Summary", renderKvTable(summaryRows))}
  ${section("Top Tallies", `${renderKvTable([
    { label: "Top types", value: tallyLine(stats.typeTally) },
    { label: "Top fandoms", value: tallyLine(stats.fandomTally) },
    { label: "Size breakdown", value: tallyLine(stats.sizeTally) },
    { label: "Condition breakdown", value: stats.isInventory ? tallyLine(stats.conditionTally) : "Wishlist mode" },
    { label: "Top tags", value: tallyLine(stats.topTags) },
  ])}<p class="inline-note">This report shows key highlights. Use JSON export for a full machine-readable payload.</p>`)}
  ${section("Tab Breakdown", renderSimpleTable(["Tab", "Items", "Value"], tabRows))}
  ${stats.isInventory ? section("Wear Highlights", `${renderSimpleTable(["#", "Shirt", "Rotation Score", "Wear Count"], topWornRows)}${renderKvTable([
    { label: "Longest unworn", value: stats.longestUnworn ? `${stats.longestUnworn.name} (${stats.longestUnworn.tab}) - ${stats.longestUnworn.daysSince} days` : "No data" },
    { label: "Unworn over 6 months", value: String((stats.unwornOverSixMonths || []).length) },
  ])}`) : ""}
  ${stats.isInventory ? section(`Advanced First-Wear Lag (${isFullExport ? "All" : "Top 15"})`, renderSimpleTable(["#", "Shirt", "Days to First Wear", "Added On", "First Worn"], firstWearLagRows)) : ""}
  ${stats.isInventory ? section(`Unworn Over 6 Months (${isFullExport ? "All" : "Top 40"})`, renderSimpleTable(["#", "Shirt", "Days Since"], unwornRows)) : ""}
  ${stats.isInventory ? section(`Wear Events (${isFullExport ? "All" : "Latest 100"})`, renderSimpleTable(["#", "Name", "Brand", "Type", "Worn At"], wearEventRows)) : ""}
  ${stats.isInventory ? section(`Brand Utilization (${isFullExport ? "All" : "Top 40"})`, renderSimpleTable(["Brand", "Inventory", "Worn 90d", "Utilization", "Avg CPW"], brandUtilRows)) : ""}
  ${stats.isInventory ? section(`Monthly Spend vs Wear (${isFullExport ? "All" : "Latest 24"})`, renderSimpleTable(["Month", "Added", "Spend", "Wears", "Spend/Wear"], spendWearRows)) : ""}
  ${stats.isInventory ? section(`Type Rotation Balance (${isFullExport ? "All" : "Top 30 by delta"})`, renderSimpleTable(["Type", "Inventory", "Wears", "Inv %", "Wear %", "Delta"], typeRotationRows)) : ""}
  ${stats.isInventory ? section("Seasonality by Month", renderSimpleTable(["Month", "Top Type", "Count"], seasonalityRows)) : ""}
  ${stats.isInventory ? section(`Tag Performance (${isFullExport ? "All" : "Top 40"})`, renderSimpleTable(["Tag", "Samples", "Avg Wears", "Avg CPW"], tagPerformanceRows)) : ""}
  ${stats.isInventory ? section("Repeat Wear Streaks (Brands)", renderSimpleTable(["#", "Brand", "Streak"], topBrandStreakRows)) : ""}
  ${stats.isInventory ? section("Repeat Wear Streaks (Types)", renderSimpleTable(["#", "Type", "Streak"], topTypeStreakRows)) : ""}
  ${section(`Recently Added (${isFullExport ? "All" : "Latest 25"})`, renderSimpleTable(["Name", "Brand", "Type", "Date Added", "Price"], recentRows))}
  <div class="footer-note">${isFullExport ? "Full export includes all available stats sections in print-friendly tables." : "Need every field and row? Use Export PDF (full, all stats) or Export JSON."}</div>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.width = "1px";
  iframe.style.height = "1px";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.style.border = "0";

  const cleanup = () => {
    window.setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 1000);
  };

  let didPrint = false;
  iframe.onload = () => {
    if (didPrint) return;
    try {
      const frameDoc = iframe.contentDocument;
      const frameWindow = iframe.contentWindow;
      if (!frameWindow || !frameDoc) {
        cleanup();
        return;
      }
      const marker = frameDoc.getElementById("stats-pdf-export-root");
      if (!marker) {
        return;
      }
      didPrint = true;
      frameWindow.focus();
      frameWindow.print();
      addEventLog(isFullExport ? "Opened full stats PDF print dialog" : "Opened stats PDF print dialog");
    } catch (error) {
      alert("Unable to open print dialog for PDF export.");
    } finally {
      cleanup();
    }
  };

  iframe.srcdoc = printable.replace("<body>", "<body id=\"stats-pdf-export-root\">");
  document.body.appendChild(iframe);
};

const openStatsExportDialog = (stats) => {
  latestStatsSnapshot = stats;
  let dialog = document.getElementById("stats-export-dialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "stats-export-dialog";
    dialog.innerHTML = `
      <div class="dialog-body">
        <h3>Export Stats</h3>
        <div class="stats-export-options">
          <button type="button" class="btn" id="stats-export-pdf">Export PDF (summary)</button>
          <button type="button" class="btn secondary" id="stats-export-pdf-full">Export PDF (full, all stats)</button>
          <button type="button" class="btn secondary" id="stats-export-csv">Export CSV (tabular)</button>
          <button type="button" class="btn secondary" id="stats-export-json">Export JSON (complete)</button>
        </div>
        <div class="stats-export-note">Summary PDF is concise. Full PDF includes all available stats sections in print-friendly tables (can be very large).</div>
      </div>
      <div class="dialog-actions">
        <button type="button" class="btn" id="stats-export-close">Close</button>
      </div>
    `;
    document.body.appendChild(dialog);

    const closeButton = dialog.querySelector("#stats-export-close");
    const pdfButton = dialog.querySelector("#stats-export-pdf");
    const fullPdfButton = dialog.querySelector("#stats-export-pdf-full");
    const csvButton = dialog.querySelector("#stats-export-csv");
    const jsonButton = dialog.querySelector("#stats-export-json");
    if (closeButton) {
      closeButton.addEventListener("click", () => closeDialog(dialog));
    }
    if (pdfButton) {
      pdfButton.addEventListener("click", () => {
        if (!latestStatsSnapshot) return;
        exportStatsPdf(latestStatsSnapshot, { full: false });
      });
    }
    if (fullPdfButton) {
      fullPdfButton.addEventListener("click", () => {
        if (!latestStatsSnapshot) return;
        exportStatsPdf(latestStatsSnapshot, { full: true });
      });
    }
    if (csvButton) {
      csvButton.addEventListener("click", () => {
        if (!latestStatsSnapshot) return;
        exportStatsCsv(latestStatsSnapshot);
      });
    }
    if (jsonButton) {
      jsonButton.addEventListener("click", () => {
        if (!latestStatsSnapshot) return;
        exportStatsJson(latestStatsSnapshot);
      });
    }
  }

  openDialog(dialog);
  resetDialogScroll(dialog);
};

const detectCsvDelimiter = (line) => {
  const sample = line || "";
  const counts = {
    ",": (sample.match(/,/g) || []).length,
    "\t": (sample.match(/\t/g) || []).length,
    ";": (sample.match(/;/g) || []).length,
  };
  const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  const best = sorted[0];
  if (!best || counts[best] === 0) return ",";
  return best;
};

const parseCsvLine = (line, delimiter = ",") => {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        cells.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  cells.push(current);
  return cells;
};

const isPreviewColumn = (column) => {
  if (!column) return false;
  if (column.type === "photo") return true;
  const labelLower = getColumnLabel(column).trim().toLowerCase();
  return labelLower === "preview";
};

const importCsv = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".csv,text/csv";
  input.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
      if (lines.length < 2) {
        alert("CSV file is empty or has no data rows.");
        return;
      }
      const delimiter = detectCsvDelimiter(lines[0]);
      const headerCells = parseCsvLine(lines[0], delimiter);
      const columnMap = [];
      let tagsIndex = -1;
      const selectableColumns = [];
      headerCells.forEach((header, index) => {
        const headerLower = header.trim().toLowerCase();
        if (headerLower === "tags") {
          tagsIndex = index;
          columnMap.push(null);
          selectableColumns.push({ index, label: "Tags" });
          return;
        }
        const match = state.columns.find(
          (col) => getColumnLabel(col).trim().toLowerCase() === headerLower
        );
        if (match && isPreviewColumn(match)) {
          columnMap.push(null);
          return;
        }
        columnMap.push(match || null);
        if (match) {
          selectableColumns.push({ index, label: getColumnLabel(match) });
        }
      });
      if (columnMap.every((col) => col === null) && tagsIndex === -1) {
        alert("No CSV columns matched your current columns. Check that the CSV header names match.");
        return;
      }
      const selection = await showCsvImportDialog(selectableColumns, tagsIndex);
      if (!selection) return;
      const selectedIndices = selection.selected;
      const importMode = selection.mode;
      const includeTags = tagsIndex !== -1 && selectedIndices.has(tagsIndex);
      const shouldUseIndex = (index) => selectedIndices.has(index);
      let nameColumn = null;
      let nameCsvIndex = -1;
      let forceRowOrderMatch = false;
      if (importMode !== "append") {
        nameColumn = state.columns.find((column) => isShirtNameColumn(column));
        if (!nameColumn) {
          alert("No Name column exists to match rows for overwrite or fill-empty.");
          return;
        }
        nameCsvIndex = columnMap.findIndex((column) => column && column.id === nameColumn.id);
        if (nameCsvIndex === -1) {
          alert("CSV must include a Name column to match rows for overwrite or fill-empty.");
          return;
        }
        const selectedDataCount = [...selectedIndices].filter((idx) => idx !== tagsIndex && columnMap[idx] !== null).length;
        const onlyNameSelected = selectedDataCount === 1 && selectedIndices.has(nameCsvIndex);
        forceRowOrderMatch = onlyNameSelected;
      }
      let importedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const cells = parseCsvLine(lines[i], delimiter);
        let useExisting = false;
        let row = null;
        if (importMode === "append") {
          row = defaultRow();
        } else {
          let matchIndex = -1;
          if (forceRowOrderMatch) {
            const rowIndex = i - 1;
            matchIndex = rowIndex < state.rows.length ? rowIndex : -1;
          } else {
            const csvName = (cells[nameCsvIndex] || "").trim();
            const csvNameLower = csvName.toLowerCase();
            if (csvNameLower !== "") {
              matchIndex = state.rows.findIndex((existingRow) => {
                const rawValue = existingRow.cells ? existingRow.cells[nameColumn.id] : "";
                const nameValue = rawValue === null || rawValue === undefined ? "" : String(rawValue).trim();
                return nameValue.toLowerCase() === csvNameLower;
              });
            }
            if (matchIndex === -1) {
              const rowIndex = i - 1;
              const candidate = state.rows[rowIndex];
              if (candidate) {
                const rawValue = candidate.cells ? candidate.cells[nameColumn.id] : "";
                const nameValue = rawValue === null || rawValue === undefined ? "" : String(rawValue).trim();
                if (nameValue === "") {
                  matchIndex = rowIndex;
                }
              }
            }
          }
          if (matchIndex === -1) {
            continue;
          }
          useExisting = true;
          row = state.rows[matchIndex];
        }
        if (!row.cells) row.cells = {};
        let hasData = false;
        if (includeTags && cells[tagsIndex]) {
          const tagValues = cells[tagsIndex].split(",").map((t) => t.trim()).filter(Boolean);
          if (tagValues.length) {
            if (importMode === "overwrite" || !row.tags || row.tags.length === 0) {
              row.tags = tagValues;
              hasData = true;
            }
          }
        }
        cells.forEach((cellValue, index) => {
          if (!shouldUseIndex(index)) return;
          if (index === tagsIndex) return;
          const column = columnMap[index];
          if (!column) return;
          if (isPreviewColumn(column)) return;
          const trimmed = cellValue.trim();
          if (!trimmed) return;
          if (importMode === "overwrite") {
            row.cells[column.id] = trimmed;
            hasData = true;
          } else if (importMode === "fill-empty") {
            const existingValue = row.cells[column.id];
            if (!existingValue || String(existingValue).trim() === "") {
              row.cells[column.id] = trimmed;
              hasData = true;
            }
          } else {
            row.cells[column.id] = trimmed;
            hasData = true;
          }
          if (column.type === "select" && trimmed) {
            const existing = (column.options || []).map((o) => String(o).toLowerCase());
            if (!existing.includes(trimmed.toLowerCase())) {
              column.options.push(trimmed);
              const colLabel = getColumnLabel(column).trim().toLowerCase();
              if (colLabel === "fandom" && tabsState.activeTabId) {
                columnOverrides.fandomOptionsByTab[tabsState.activeTabId] = column.options.slice();
                saveColumnOverrides();
              }
              if (colLabel === "type" && tabsState.activeTabId) {
                columnOverrides.typeOptionsByTab[tabsState.activeTabId] = column.options.slice();
                saveColumnOverrides();
              }
            }
          }
        });
        if (hasData) {
          if (!useExisting) state.rows.push(row);
          importedCount++;
        }
      }
      if (importedCount === 0) {
        alert("No rows were imported. The CSV may be empty or have no matching data.");
        return;
      }
      setGlobalColumns(state.columns);
      sheetBody.innerHTML = "";
      saveState();
      renderTable();
      const actionLabel = importMode === "append" ? "Imported" : "Updated";
      addEventLog("Imported CSV", actionLabel + " " + importedCount + " rows");
      alert(actionLabel + " " + importedCount + " row" + (importedCount !== 1 ? "s" : "") + " from CSV.");
    };
    reader.readAsText(file);
  });
  input.click();
};

const formatCurrency = (value) => {
  const amount = Number.parseFloat(value);
  if (Number.isNaN(amount)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const parseCurrency = (value) => {
  if (value === null || value === undefined) return null;
  const cleaned = String(value)
    .replace(/\$/g, "")
    .replace(/,/g, "")
    .trim();
  if (cleaned === "") return null;
  const amount = Number.parseFloat(cleaned);
  if (Number.isNaN(amount)) return null;
  return amount;
};



const addRow = () => {
  state.rows.push(defaultRow());
  ensureRowCells();
  updateShirtUpdateDate();
  saveState();
  sortRows();
  renderRows();
};

addRowButton.addEventListener("click", addRow);
addRowBottomButton.addEventListener("click", addRow);

goTopButton.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

goBottomButton.addEventListener("click", () => {
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
});

deleteSelectedBottomButton.addEventListener("click", () => {
  deleteSelectedRows();
});


if (window.__TAURI__ && window.__TAURI__.event) {
  if (PLATFORM === "desktop") {
    window.__TAURI__.event.listen("menu-export-csv", () => {
      exportCsv();
    });
    window.__TAURI__.event.listen("menu-import-csv", () => {
      importCsv();
    });
    window.__TAURI__.event.listen("menu-event-log", () => {
      openEventLogDialog();
    });
  }
  if (PLATFORM === "mobile") {
    window.__TAURI__.event.listen("menu-share-csv", () => {
      exportCsv();
    });
  }
  window.__TAURI__.event.listen("menu-about", () => {
    openDialog(aboutDialog);
  });
}

publicShareToken = getShareTokenFromUrl();
publicShareVisibility = loadPublicShareVisibility();
updatePublicShareSummary();

if (supabase) {
  if (publicShareToken) {
    applyPublicShareMode();
    loadPublicShareState(publicShareToken);
  }
  setAuthLoading(true);
  supabase.auth.getSession()
    .then(({ data }) => {
      if (publicShareToken) {
        updateAppUpdateDate();
        updateFooterVersionLine();
        applyPublicShareMode();
        loadPublicShareState(publicShareToken);
        return;
      }
      currentUser = data.session ? data.session.user : null;
      isViewerSession = false;
      document.body.setAttribute("data-viewer", currentUser ? "pending" : "false");
      setAuthStatus();
      setAuthLoading(false);
      updateBackupStatusFromStorage();
      updateAppUpdateDate();
      updateLastActivity();
      handleInactivityCheck();
      if (currentUser) {
        handleUserSwitch(currentUser.id);
        enforcePasswordSet(currentUser);
        loadRemoteState();
        initAdminLink();
      }
    })
    .catch((error) => {
      console.warn("Auth session error", error);
      currentUser = null;
      isViewerSession = false;
      document.body.setAttribute("data-viewer", "false");
      setAuthStatus();
      setAuthLoading(false);
      updateBackupStatusFromStorage();
      updateAppUpdateDate();
      updateFooterVersionLine();
    });
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "TOKEN_REFRESHED") return;
    setAuthLoading(true);
    if (publicShareToken) {
      updateAppUpdateDate();
      updateFooterVersionLine();
      applyPublicShareMode();
      loadPublicShareState(publicShareToken);
      return;
    }
    currentUser = session ? session.user : null;
    isViewerSession = false;
    document.body.setAttribute("data-viewer", currentUser ? "pending" : "false");
    setAuthStatus();
    setAuthLoading(false);
    updateLastActivity();
    handleInactivityCheck();
    if (currentUser) {
      handleUserSwitch(currentUser.id);
      enforcePasswordSet(currentUser);
      loadRemoteState();
      initAdminLink();
    }
  });
} else {
  document.body.setAttribute("data-viewer", "false");
  setAuthStatus();
  setAuthLoading(false);
  updateBackupStatusFromStorage();
  updateAppUpdateDate();
  updateFooterVersionLine();
}

["mousemove", "keydown", "touchstart", "click", "scroll"].forEach((eventName) => {
  window.addEventListener(eventName, () => {
    updateLastActivity();
  }, { passive: true });
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    flushPendingSyncIfNeeded();
  }
});
window.addEventListener("pagehide", () => {
  flushPendingSyncIfNeeded();
});
if (PLATFORM === "desktop") {
  window.addEventListener("resize", () => {
    syncTableScrollSizing();
  });
}
window.setInterval(() => {
  handleInactivityCheck();
}, 5 * 60 * 1000);


const executeClearAll = () => {
  lastClearSnapshot = state.rows.map((row) => ({
    ...row,
    cells: { ...(row.cells || {}) },
    tags: row.tags ? row.tags.slice() : [],
    wearLog: row.wearLog ? row.wearLog.slice() : [],
  }));
  undoClearButton.disabled = false;
  state.rows = [defaultRow()];
  ensureRowCells();
  addEventLog("Cleared all rows", "", lastClearSnapshot.map(snapshotRow));
  updateShirtUpdateDate();
  saveState();
  sortRows();
  renderRows();
  renderFooter();
};

clearAllButton.addEventListener("click", () => {
  if (state.readOnly) return;
  openDialog(clearConfirmDialog);
});

undoClearButton.addEventListener("click", () => {
  if (!lastClearSnapshot || lastClearSnapshot.length === 0) return;
  state.rows = lastClearSnapshot.map((row) => ({
    ...row,
    cells: { ...(row.cells || {}) },
    tags: row.tags ? row.tags.slice() : [],
    wearLog: row.wearLog ? row.wearLog.slice() : [],
  }));
  ensureRowCells();
  addEventLog("Undid clear");
  updateShirtUpdateDate();
  saveState();
  sortRows();
  renderRows();
  renderFooter();
  lastClearSnapshot = null;
  undoClearButton.disabled = true;
});

clearConfirmCancel.addEventListener("click", () => {
  closeDialog(clearConfirmDialog);
});

clearConfirmNext.addEventListener("click", () => {
  closeDialog(clearConfirmDialog);
  openDialog(clearFinalDialog);
});

clearFinalCancel.addEventListener("click", () => {
  closeDialog(clearFinalDialog);
});

clearFinalConfirm.addEventListener("click", () => {
  closeDialog(clearFinalDialog);
  executeClearAll();
});

addColumnButton.addEventListener("click", () => {
  openColumnDialog();
});

columnTypeInput.addEventListener("change", (event) => {
  columnOptionsRow.style.display = event.target.value === "select" ? "block" : "none";
});

cancelColumnButton.addEventListener("click", () => {
  closeDialog(columnDialog);
});

tabCancelButton.addEventListener("click", () => {
  closeDialog(tabDialog);
});

tabDeleteCancel.addEventListener("click", () => {
  closeDialog(tabDeleteDialog);
  pendingDeleteTabId = null;
});

tabDeleteConfirm.addEventListener("click", () => {
  if (!pendingDeleteTabId) return;
  const removeId = pendingDeleteTabId;
  const removedTab = tabsState.tabs.find((tab) => tab.id === removeId);
  pendingDeleteTabId = null;
  tabsState.tabs = tabsState.tabs.filter((tab) => tab.id !== removeId);
  sortTabs();
  if (tabsState.tabs.length === 0) {
    const fallbackTab = { id: createId(), name: "New Tab" };
    tabsState.tabs.push(fallbackTab);
  }
  tabsState.activeTabId = tabsState.tabs[0] ? tabsState.tabs[0].id : null;
  saveTabsState();
  if (removedTab) {
    addEventLog("Deleted tab", removedTab.name);
  }
  try {
    localStorage.removeItem(getStorageKey(removeId));
  } catch (error) {
    console.warn("Local storage unavailable", error);
  }
  if (tabsState.activeTabId) {
    const existing = (() => {
      try {
        return localStorage.getItem(getStorageKey(tabsState.activeTabId));
      } catch (error) {
        return null;
      }
    })();
    if (!existing) {
      seedTabState(tabsState.activeTabId, createBlankStateFromCurrent());
    }
    loadState();
    normalizeNameColumnsEverywhere();
    normalizeSizeOptionsEverywhere();
    resetFilterDefault();
    ensureRowCells();
    renderTable();
    applyReadOnlyMode();
  }
  renderTabs();
  closeDialog(tabDeleteDialog);
});

aboutCloseButton.addEventListener("click", () => {
  closeDialog(aboutDialog);
});

if (helpButton && helpDialog && helpCloseButton) {
  helpButton.addEventListener("click", () => {
    openDialog(helpDialog);
    resetDialogScroll(helpDialog);
  });
  helpCloseButton.addEventListener("click", () => {
    closeDialog(helpDialog);
  });
}

if (creditsLink && iconCreditsDialog) {
  creditsLink.addEventListener("click", (event) => {
    event.preventDefault();
    openDialog(iconCreditsDialog);
  });
}

if (legalDisclaimerLink && legalDisclaimerDialog) {
  legalDisclaimerLink.addEventListener("click", (event) => {
    event.preventDefault();
    openDialog(legalDisclaimerDialog);
    resetDialogScroll(legalDisclaimerDialog);
  });
}

if (privacyPolicyLink && privacyPolicyDialog) {
  privacyPolicyLink.addEventListener("click", (event) => {
    event.preventDefault();
    openDialog(privacyPolicyDialog);
    resetDialogScroll(privacyPolicyDialog);
  });
}

if (contactForm && !(window.__TAURI__ || window.__TAURI_INTERNALS__)) {
  const path = window.location.pathname || "/";
  const ua = navigator.userAgent || "";
  const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const isIpadDesktop = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  let actionPath = null;
  if (path === "/" || path === "") {
    actionPath = (isMobileUA || isIpadDesktop) ? "/m/" : "/d/";
  } else if (path === "/m" || path.startsWith("/m/")) {
    actionPath = "/m/";
  } else if (path === "/d" || path.startsWith("/d/")) {
    actionPath = "/d/";
  } else {
    actionPath = (isMobileUA || isIpadDesktop) ? "/m/" : "/d/";
  }
  contactForm.setAttribute("action", actionPath);
}

if (contactForm && !(window.__TAURI__ || window.__TAURI_INTERNALS__)) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(contactForm);
    const payload = new URLSearchParams(formData).toString();
    fetch(contactForm.getAttribute("action") || "/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload,
    })
      .then(() => {
        if (contactFormMessage) {
          contactFormMessage.textContent = "Thank you! If you requested a response, please allow us some time to respond.";
          contactFormMessage.style.display = "block";
        }
        contactForm.reset();
      })
      .catch(() => {
        if (contactFormMessage) {
          contactFormMessage.textContent = "Something went wrong. Please try again.";
          contactFormMessage.style.display = "block";
        }
      });
  });
}

if (PLATFORM === "desktop" && privacyContactLink && contactDialog) {
  privacyContactLink.addEventListener("click", (event) => {
    event.preventDefault();
    openDialog(contactDialog);
    closeDialog(privacyPolicyDialog);
  });
}

if (contactLink && contactDialog) {
  contactLink.addEventListener("click", (event) => {
    event.preventDefault();
    openDialog(contactDialog);
  });
}

if (iconCreditsCloseButton) {
  iconCreditsCloseButton.addEventListener("click", () => {
    closeDialog(iconCreditsDialog);
  });
}

if (legalDisclaimerCloseButton) {
  legalDisclaimerCloseButton.addEventListener("click", () => {
    closeDialog(legalDisclaimerDialog);
  });
}

if (privacyPolicyCloseButton) {
  privacyPolicyCloseButton.addEventListener("click", () => {
    closeDialog(privacyPolicyDialog);
  });
}

if (contactCloseButton) {
  contactCloseButton.addEventListener("click", () => {
    closeDialog(contactDialog);
  });
}

if (tagsAddButton) {
  tagsAddButton.addEventListener("click", () => {
    addTagsFromInput();
  });
}

if (bulkTagsButton) {
  bulkTagsButton.addEventListener("click", () => {
    openBulkTagsDialog();
  });
}

if (selectAllRowsButton) {
  selectAllRowsButton.addEventListener("click", () => {
    selectAllVisibleRows();
  });
}

if (bulkTagsAddButton) {
  bulkTagsAddButton.addEventListener("click", () => {
    if (!bulkTagsInput) return;
    const incoming = normalizeTagsInput(bulkTagsInput.value);
    if (!incoming.length) return;
    addBulkTags(incoming);
  });
}

if (bulkTagsRemoveButton) {
  bulkTagsRemoveButton.addEventListener("click", () => {
    if (!bulkTagsInput) return;
    const incoming = normalizeTagsInput(bulkTagsInput.value);
    if (!incoming.length) return;
    removeBulkTags(incoming);
  });
}

if (bulkTagsInput) {
  bulkTagsInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const incoming = normalizeTagsInput(bulkTagsInput.value);
      if (!incoming.length) return;
      addBulkTags(incoming);
    }
  });
  bulkTagsInput.addEventListener("input", () => {
    renderBulkTagSuggestions(bulkTagsInput.value);
  });
  bulkTagsInput.addEventListener("focus", () => {
    renderBulkTagSuggestions(bulkTagsInput.value);
  });
}

if (bulkTagsCloseButton) {
  bulkTagsCloseButton.addEventListener("click", () => {
    closeDialog(bulkTagsDialog);
    bulkTagsSelectedIds = [];
    clearRowSelections();
  });
}

if (bulkTagsDialog) {
  bulkTagsDialog.addEventListener("close", () => {
    bulkTagsSelectedIds = [];
    clearRowSelections();
  });
}

if (tagsInput) {
  tagsInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addTagsFromInput();
    }
  });
  tagsInput.addEventListener("input", () => {
    if (!activeTagsRowId) return;
    const row = state.rows.find((item) => item.id === activeTagsRowId);
    if (!row) return;
    renderTagSuggestions(tagsInput.value, row);
  });
  tagsInput.addEventListener("focus", () => {
    if (!activeTagsRowId) return;
    const row = state.rows.find((item) => item.id === activeTagsRowId);
    if (!row) return;
    renderTagSuggestions(tagsInput.value, row);
  });
}

if (tagsCloseButton) {
  tagsCloseButton.addEventListener("click", () => {
    showTagsMainView();
    closeDialog(tagsDialog);
    activeTagsRowId = null;
  });
}

if (tagsManageButton) {
  tagsManageButton.addEventListener("click", () => {
    if (tagsManageView && tagsManageView.style.display === "none") {
      if (tagsMainView) tagsMainView.style.display = "none";
      tagsManageView.style.display = "";
      tagsManageButton.textContent = "Back";
      renderManageTagsView();
    } else {
      showTagsMainView();
    }
  });
}

if (resetFreshButton) {
  resetFreshButton.addEventListener("click", async () => {
    if (!confirm("Reset all data to fresh defaults? This cannot be undone.")) return;
    if (!confirm("Are you sure? This will overwrite your current data.")) return;
    try {
      if (typeof applyFreshUserDefaults === "function") {
        applyFreshUserDefaults();
      }
      saveTabsState();
      saveState();
      updateTabLogo();
      await syncToSupabase();
      renderTabs();
      renderTable();
      renderFooter();
    } catch (error) {
      if (PLATFORM === "mobile") {
        showToast("Reset failed. Please try again.");
      } else {
        alert("Reset failed. Please try again.");
      }
      console.error("Fresh reset failed", error);
    }
  });
}

authActionButton.addEventListener("click", async () => {
  if (currentUser) {
    await flushPendingSyncIfNeeded();
    supabase.auth.signOut();
  } else {
    authMessage.textContent = supabase
      ? ""
      : "Sync is unavailable. Please restart the app.";
    openDialog(authDialog);
  }
});

syncNowButton.addEventListener("click", async () => {
  if (!supabase || !currentUser) return;
  const originalLabel = syncNowButton.textContent;
  syncNowButton.disabled = true;
  syncNowButton.textContent = "Syncing...";
  try {
    await migrateLocalPhotosToSupabase();
    await syncToSupabase();
  } finally {
    syncNowButton.textContent = originalLabel;
    syncNowButton.disabled = false;
  }
});

verifyBackupButton.addEventListener("click", async () => {
  if (!supabase || !currentUser) {
    setBackupStatus("Sign in to check cloud backup.");
    renderSyncDiagnostics();
    return;
  }
  const originalLabel = verifyBackupButton.textContent;
  verifyBackupButton.disabled = true;
  verifyBackupButton.textContent = "Checking...";
  setBackupStatus("Checking cloud backup...");
  try {
    const { data, error } = await supabase
      .from("shirt_state")
      .select("updated_at")
      .eq("user_id", currentUser.id)
      .maybeSingle();
    if (error || !data || !data.updated_at) {
      setBackupStatus("No cloud backup found yet.");
      return;
    }
    const cloudTime = Date.parse(data.updated_at);
    if (!Number.isNaN(cloudTime)) {
      setBackupTimestamp(LAST_CLOUD_UPDATE_KEY, cloudTime);
    }
    const localSync = getBackupTimestamp(LAST_SYNC_KEY);
    const cloudText = formatDateTime(cloudTime);
    const toleranceMs = 2 * 60 * 1000;
    if (!localSync || cloudTime + toleranceMs >= localSync) {
      setBackupStatus(`Cloud backup OK. Last cloud update: ${cloudText} (May lag local changes)`);
    } else {
      setBackupStatus(`Local changes not in cloud yet. Last cloud update: ${cloudText}`);
    }
    renderSyncDiagnostics();
  } finally {
    verifyBackupButton.textContent = originalLabel;
    verifyBackupButton.disabled = false;
  }
});

if (advancedDiagnosticsLink) {
  advancedDiagnosticsLink.addEventListener("click", (event) => {
    event.preventDefault();
    renderSyncDiagnostics();
    openDialog(syncDiagnosticsDialog);
    resetDialogScroll(syncDiagnosticsDialog);
  });
}

if (syncDiagnosticsCloseButton) {
  syncDiagnosticsCloseButton.addEventListener("click", () => {
    closeDialog(syncDiagnosticsDialog);
  });
}

if (exportCsvButton) exportCsvButton.addEventListener("click", () => exportCsv());
if (importCsvButton) importCsvButton.addEventListener("click", () => importCsv());

if (authSendButton) authSendButton.addEventListener("click", async () => {
  if (authNameRow) authNameRow.style.display = "block";
  const email = authEmailInput ? authEmailInput.value.trim() : "";
  const password = authPasswordInput ? authPasswordInput.value : "";
  const name = authNameInput ? authNameInput.value.trim() : "";
  if (!name || !email || !password) {
    if (authMessage) authMessage.textContent = "Enter name, email, and password to create an account.";
    return;
  }
  if (!supabase) {
    if (authMessage) authMessage.textContent = "Auth unavailable. Check your connection.";
    return;
  }
  if (authMessage) authMessage.textContent = "Creating account...";
  authSendButton.disabled = true;
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });
    if (authMessage) {
      authMessage.textContent = error
        ? error.message
        : "Account created. Check your email to confirm, then sign in.";
    }
  } finally {
    authSendButton.disabled = false;
  }
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (authNameRow) authNameRow.style.display = "none";
  const email = authEmailInput ? authEmailInput.value.trim() : "";
  const password = authPasswordInput ? authPasswordInput.value : "";
  if (!email || !password) {
    if (authMessage) authMessage.textContent = "Enter email and password to sign in.";
    return;
  }
  if (!supabase) {
    if (authMessage) authMessage.textContent = "Auth unavailable. Check your connection.";
    return;
  }
  if (authMessage) authMessage.textContent = "Verifying...";
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (authMessage) authMessage.textContent = error.message;
    return;
  }
  closeDialog(authDialog);
});

if (profileNameSkipButton) {
  profileNameSkipButton.addEventListener("click", async () => {
    setPromptedProfileName();
    if (supabase && currentUser) {
      try {
        await supabase.auth.updateUser({ data: { display_name_skipped: true } });
        currentUser.user_metadata = {
          ...(currentUser.user_metadata || {}),
          display_name_skipped: true,
        };
      } catch (error) {
        // localStorage fallback is already set
      }
    }
    closeDialog(profileNameDialog);
  });
}
if (profileNameSaveButton) {
  profileNameSaveButton.addEventListener("click", async () => {
    if (!supabase || !currentUser) {
      closeDialog(profileNameDialog);
      return;
    }
    const name = profileNameInput ? profileNameInput.value.trim() : "";
    if (!name) {
      setPromptedProfileName();
      closeDialog(profileNameDialog);
      return;
    }
    await supabase.auth.updateUser({ data: { full_name: name } });
    currentUser.user_metadata = {
      ...(currentUser.user_metadata || {}),
      full_name: name,
    };
    updateHeaderSubtitle();
    setPromptedProfileName();
    closeDialog(profileNameDialog);
  });
}
if (profileNameInput) {
  profileNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (profileNameSaveButton) profileNameSaveButton.click();
    }
  });
}
if (profileNameDialog) {
  profileNameDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    if (profileNameSkipButton) profileNameSkipButton.click();
  });
}
if (authActionSignedOutButton && authActionButton) {
  authActionSignedOutButton.addEventListener("click", () => {
    authActionButton.click();
  });
}
if (requestAccessLink) {
  requestAccessLink.addEventListener("click", (event) => {
    event.preventDefault();
    if (!requestAccessDialog) return;
    openDialog(requestAccessDialog);
    if (requestAccessName) requestAccessName.focus();
  });
}
if (requestAccessClose) {
  requestAccessClose.addEventListener("click", () => {
    closeDialog(requestAccessDialog);
  });
}
if (requestAccessForm) {
  requestAccessForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = requestAccessName ? requestAccessName.value.trim() : "";
    const emailEl = document.getElementById("request-access-email");
    const email = emailEl ? emailEl.value.trim() : "";
    if (!name || !email) return;
    if (requestAccessMessage) requestAccessMessage.textContent = "";
    if (requestAccessSubmit) requestAccessSubmit.disabled = true;
    try {
      const payload = { name, email };
      if (requestAccessBot && requestAccessBot.value) payload["bot-field"] = requestAccessBot.value;
      const res = await fetch("/.netlify/functions/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (requestAccessMessage) requestAccessMessage.textContent = data.error || "Something went wrong. Please try again.";
        return;
      }
      requestAccessForm.reset();
      if (requestAccessDialog) closeDialog(requestAccessDialog);
      if (requestAccessThanks) openDialog(requestAccessThanks);
    } catch {
      if (requestAccessMessage) requestAccessMessage.textContent = "Something went wrong. Please try again.";
    } finally {
      if (requestAccessSubmit) requestAccessSubmit.disabled = false;
    }
  });
}
if (requestAccessThanksClose) {
  requestAccessThanksClose.addEventListener("click", () => {
    closeDialog(requestAccessThanks);
  });
}
let passwordRequired = false;
const clearInviteHash = () => {
  if (!hasInviteFlow()) return;
  clearInviteFlow();
  history.replaceState(null, "", window.location.pathname + window.location.search);
};
const enforcePasswordSet = (user) => {
  if (!user || !setPasswordDialog) return;
  if (!hasInviteFlow()) return;
  if (user.user_metadata && user.user_metadata.password_set === true) {
    clearInviteFlow();
    return;
  }
  passwordRequired = true;
  if (setPasswordMessage) setPasswordMessage.textContent = "Please set a password to continue.";
  if (setPasswordInput) setPasswordInput.value = "";
  if (setPasswordConfirm) setPasswordConfirm.value = "";
  openDialog(setPasswordDialog);
  resetDialogScroll(setPasswordDialog);
};
if (setPasswordDialog) {
  setPasswordDialog.addEventListener("cancel", (event) => {
    if (passwordRequired) event.preventDefault();
  });
}
if (setPasswordForm) {
  setPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabase || !currentUser) return;
    const password = setPasswordInput ? setPasswordInput.value : "";
    const confirm = setPasswordConfirm ? setPasswordConfirm.value : "";
    if (!password || !confirm) {
      if (setPasswordMessage) setPasswordMessage.textContent = "Enter and confirm your new password.";
      return;
    }
    if (password !== confirm) {
      if (setPasswordMessage) setPasswordMessage.textContent = "Passwords do not match.";
      return;
    }
    if (setPasswordMessage) setPasswordMessage.textContent = "Saving password...";
    if (setPasswordSave) setPasswordSave.disabled = true;
    try {
      const { error } = await supabase.auth.updateUser({
        password,
        data: { password_set: true },
      });
      if (error) {
        if (setPasswordMessage) setPasswordMessage.textContent = error.message;
        return;
      }
      if (currentUser) {
        currentUser.user_metadata = {
          ...(currentUser.user_metadata || {}),
          password_set: true,
        };
      }
      passwordRequired = false;
      clearInviteHash();
      closeDialog(setPasswordDialog);
      if (profileNameDialog) {
        openDialog(profileNameDialog);
        resetDialogScroll(profileNameDialog);
      }
    } finally {
      if (setPasswordSave) setPasswordSave.disabled = false;
    }
  });
}
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", (event) => {
    event.preventDefault();
    if (resetPasswordMessage) resetPasswordMessage.textContent = "";
    if (resetPasswordEmailInput) {
      resetPasswordEmailInput.value = authEmailInput ? authEmailInput.value.trim() : "";
    }
    openDialog(resetPasswordDialog);
  });
}

if (authCloseButton) {
  authCloseButton.addEventListener("click", () => {
    closeDialog(authDialog);
  });
}
if (resetPasswordCloseButton) {
  resetPasswordCloseButton.addEventListener("click", () => {
    closeDialog(resetPasswordDialog);
  });
}
if (resetPasswordSendButton) {
  resetPasswordSendButton.addEventListener("click", async () => {
    if (!supabase) return;
    const email = resetPasswordEmailInput ? resetPasswordEmailInput.value.trim() : "";
    if (!email) {
      if (resetPasswordMessage) resetPasswordMessage.textContent = "Enter your email to continue.";
      return;
    }
    if (resetPasswordMessage) resetPasswordMessage.textContent = "Sending reset link...";
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (resetPasswordMessage) {
      resetPasswordMessage.textContent = error
        ? error.message
        : "Reset link sent. Check your email.";
    }
  });
}
if (PLATFORM === "desktop") {
  if (!editProfileNameButton) {
    const authRow = document.querySelector(".header-row.auth-row");
    if (authRow) {
      editProfileNameButton = document.createElement("button");
      editProfileNameButton.type = "button";
      editProfileNameButton.id = "edit-profile-name";
      editProfileNameButton.className = "btn secondary compact";
      editProfileNameButton.textContent = "Edit Profile Name";
      authRow.insertBefore(editProfileNameButton, authRow.firstChild);
    }
  }
  if (editProfileNameButton) {
    editProfileNameButton.style.display = "inline-flex";
    editProfileNameButton.style.alignItems = "center";
    editProfileNameButton.style.justifyContent = "center";
    editProfileNameButton.addEventListener("click", () => {
      if (!profileNameDialog || !profileNameInput) return;
      profileNameInput.value = getUserDisplayName() || "";
      openDialog(profileNameDialog);
    });
  }
}

if (copyShareLinkButton) {
  copyShareLinkButton.addEventListener("click", () => {
    copyPublicShareLink();
    if (PLATFORM === "mobile") {
      showToast("Copied!");
    }
  });
}
if (shareColumnsButton) {
  shareColumnsButton.addEventListener("click", () => {
    openShareColumnsDialog();
  });
}
if (shareColumnsCancel) {
  shareColumnsCancel.addEventListener("click", () => {
    closeDialog(shareColumnsDialog);
  });
}
if (shareColumnsSave) {
  shareColumnsSave.addEventListener("click", () => {
    saveShareColumnsSelection();
  });
}
if (PLATFORM === "mobile") {
  scheduleCopyShareSizing();
  setupCopyShareSizingObserver();
}
if (shareColumnsDialog) {
  shareColumnsDialog.addEventListener("change", (event) => {
    if (event.target && event.target.name === "share-columns-mode") {
      updateShareColumnsCheckboxes();
    }
  });
}

tabForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = tabNameInput.value.trim();
  if (!name) return;
  saveState();
  const tab = { id: createId(), name };
  tabsState.tabs.push(tab);
  sortTabs();
  tabsState.activeTabId = tab.id;
  saveTabsState();
  addEventLog("Added tab", name);
  seedTabState(tab.id, createBlankStateFromCurrent());
  loadState();
  normalizeNameColumnsEverywhere();
  normalizeSizeOptionsEverywhere();
  resetFilterDefault();
  ensureRowCells();
  renderTable();
  applyReadOnlyMode();
  renderTabs();
  closeDialog(tabDialog);
});

columnForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = columnNameInput.value.trim();
  const type = columnTypeInput.value;
  if (!name) return;
  const options = type === "select"
    ? columnOptionsInput.value
        .split(",")
        .map((opt) => opt.trim())
        .filter(Boolean)
    : [];
  if (columnEditId) {
    const column = state.columns.find((col) => col.id === columnEditId);
    if (column) {
      const previousOptions = Array.isArray(column.options) ? column.options.slice() : [];
      column.name = name;
      column.type = type;
      column.options = options;
      addEventLog("Edited column", name);
      if (type === "select") {
        const normalized = options.map((opt) => opt.trim());
        const normalizedLower = normalized.map((opt) => opt.toLowerCase());
        state.rows.forEach((row) => {
          const current = row.cells ? row.cells[column.id] : "";
          if (current) {
            const trimmed = String(current).trim();
            const index = normalizedLower.indexOf(trimmed.toLowerCase());
            if (index !== -1) {
              row.cells[column.id] = normalized[index];
              return;
            }
            const prevIndex = previousOptions
              .map((opt) => String(opt).trim().toLowerCase())
              .indexOf(trimmed.toLowerCase());
            if (prevIndex !== -1 && normalized[prevIndex]) {
              row.cells[column.id] = normalized[prevIndex];
              return;
            }
            row.cells[column.id] = "";
          }
        });
      }
      const label = getColumnLabel(column).trim().toLowerCase();
      if (label === "fandom" && tabsState.activeTabId) {
        columnOverrides.fandomOptionsByTab[tabsState.activeTabId] = options.slice();
        saveColumnOverrides();
      }
      if (label === "type" && tabsState.activeTabId) {
        columnOverrides.typeOptionsByTab[tabsState.activeTabId] = options.slice();
        saveColumnOverrides();
      }
    }
  } else {
    state.columns.push({
      id: createId(),
      name,
      type,
      options,
    });
    addEventLog("Added column", name);
  }
  ensureRowCells();
  setGlobalColumns(state.columns);
  saveState();
  closeDialog(columnDialog);
  renderTable();
});


closePhotoDialogButton.addEventListener("click", () => {
  closeDialog(photoDialog);
});

clearPhotoDialogButton.addEventListener("click", () => {
  if (!activePhotoTarget) return;
  const { rowId, columnId, value } = activePhotoTarget;
  activePhotoTarget = null;
  updateRow(rowId, columnId, "");
  if (photoSrcCache.has(value)) {
    photoSrcCache.delete(value);
  }
  closeDialog(photoDialog);
  renderRows();
});

typeIconSkipButton.addEventListener("click", () => {
  pendingTypeIcon = null;
  closeDialog(typeIconDialog);
});

const typeIconUpload = document.getElementById("type-icon-upload");
if (typeIconUpload) {
  typeIconUpload.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (file.size > 200 * 1024) {
      alert("Image is too large. Please use an image under 200KB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      customIconDataUrl = e.target.result;
      const previewDiv = document.getElementById("type-icon-preview");
      const previewImg = document.getElementById("type-icon-preview-img");
      if (previewImg) previewImg.src = customIconDataUrl;
      if (previewDiv) previewDiv.style.display = "block";
    };
    reader.readAsDataURL(file);
  });
}

typeIconSaveButton.addEventListener("click", () => {
  if (!pendingTypeIcon) return;
  if (!selectedIconValue) {
    alert("Please select an icon first.");
    return;
  }
  const map = loadTypeIconMap();
  if (selectedIconValue === "__custom__") {
    if (!customIconDataUrl) {
      alert("Please upload an image first.");
      return;
    }
    map[pendingTypeIcon] = customIconDataUrl;
  } else {
    map[pendingTypeIcon] = selectedIconValue;
  }
  saveTypeIconMap(map);
  pendingTypeIcon = null;
  customIconDataUrl = "";
  selectedIconValue = "";
  closeDialog(typeIconDialog);
  renderRows();
  scheduleSync();
});

eventLogClearButton.addEventListener("click", () => {
  saveEventLog([]);
  if (eventLogSearch) eventLogSearch.value = "";
  renderEventLog();
});

if (eventLogSearch) {
  eventLogSearch.addEventListener("input", () => {
    renderEventLog(eventLogSearch.value);
  });
}

eventLogCloseButton.addEventListener("click", () => {
  closeDialog(eventLogDialog);
});

if (eventLogLink) {
  eventLogLink.addEventListener("click", (event) => {
    event.preventDefault();
    openEventLogDialog();
  });
}

if (recycleBinCloseButton) {
  recycleBinCloseButton.addEventListener("click", () => {
    closeDialog(recycleBinDialog);
  });
}
if (recycleBinEmptyAllButton) {
  let emptyAllArmed = false;
  let emptyAllTimer = null;
  const emptyAllOriginalText = recycleBinEmptyAllButton.textContent;
  recycleBinEmptyAllButton.addEventListener("click", () => {
    if (emptyAllArmed) {
      clearTimeout(emptyAllTimer);
      emptyAllArmed = false;
      recycleBinEmptyAllButton.textContent = emptyAllOriginalText;
      emptyRecycleBin();
      return;
    }
    emptyAllArmed = true;
    recycleBinEmptyAllButton.textContent = "Are you sure?";
    emptyAllTimer = setTimeout(() => {
      emptyAllArmed = false;
      recycleBinEmptyAllButton.textContent = emptyAllOriginalText;
    }, 3000);
  });
}
if (recycleBinLink) {
  recycleBinLink.addEventListener("click", () => {
    openRecycleBinDialog();
  });
}

const collectAllStats = () => {
  const tabs = tabsState.tabs;
  const allRows = [];
  const perTabRows = [];

  tabs.forEach((tab) => {
    let rows;
    let cols;
    if (tab.id === tabsState.activeTabId) {
      rows = state.rows;
      cols = state.columns;
    } else {
      try {
        const stored = localStorage.getItem(getStorageKey(tab.id));
        if (!stored) return;
        const parsed = JSON.parse(stored);
        rows = Array.isArray(parsed.rows) ? parsed.rows : [];
        cols = Array.isArray(parsed.columns) ? parsed.columns : [];
      } catch (error) {
        return;
      }
    }
    const entries = rows.map((row) => ({ row, columns: cols, tabName: tab.name }));
    perTabRows.push({ name: tab.name, id: tab.id, count: rows.length, entries });
    entries.forEach((e) => allRows.push(e));
  });

  const isInventory = appMode === "inventory";

  const findColumn = (cols, name) =>
    cols.find((c) => (c.name || "").trim().toLowerCase() === name.toLowerCase());

  const getCellValue = (entry, colName) => {
    const col = findColumn(entry.columns, colName);
    return col && entry.row.cells ? (entry.row.cells[col.id] || "").trim() : "";
  };

  const toLocalDateKey = (dateObj) => `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
  const wearAnalyticsStartMs = new Date("2026-03-01T00:00:00").getTime();
  const getAnalyticsWearData = (row) => {
    const rawWearLog = Array.isArray(row?.wearLog) && row.wearLog.length
      ? row.wearLog
      : (row?.lastWorn ? [row.lastWorn] : []);
    const wearLog = rawWearLog
      .map((stamp) => new Date(stamp).getTime())
      .filter((ms) => Number.isFinite(ms) && ms >= wearAnalyticsStartMs)
      .sort((a, b) => a - b)
      .map((ms) => new Date(ms).toISOString());
    return {
      wearLog,
      wearCount: wearLog.length,
      lastWorn: wearLog.length ? wearLog[wearLog.length - 1] : null,
    };
  };

  // --- Reusable stat helpers (work on any row subset) ---
  const tallyFrom = (subset, colName) => {
    const counts = {};
    subset.forEach((entry) => {
      const val = getCellValue(entry, colName);
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const pricingFrom = (subset) => {
    const PRICE_RANK_COUNT = 10;
    const cheapestExcludedTypes = new Set(["socks", "boxer briefs", "hat", "misc"]);
    const prices = [];
    const priceItems = [];
    if (isInventory) {
      subset.forEach((entry) => {
        const raw = getCellValue(entry, "Price");
        const parsed = parseCurrency(raw);
        if (parsed !== null && parsed > 0) {
          const name = getCellValue(entry, "Name") || "Unnamed";
          const type = getCellValue(entry, "Type") || "";
          prices.push(parsed);
          priceItems.push({ name, tab: entry.tabName || "", type, price: parsed });
        }
      });
      priceItems.sort((a, b) => b.price - a.price);
    }
    const totalCost = prices.reduce((sum, p) => sum + p, 0);
    const meanPrice = prices.length ? totalCost / prices.length : 0;
    const medianPrice = (() => {
      if (!prices.length) return 0;
      const sorted = prices.slice().sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    })();
    const cheapestPool = priceItems.filter((item) => !cheapestExcludedTypes.has(String(item.type || "").trim().toLowerCase()));
    return {
      totalCost,
      meanPrice,
      medianPrice,
      top5Expensive: priceItems.slice(0, PRICE_RANK_COUNT),
      top5Cheapest: cheapestPool.length ? cheapestPool.slice(-PRICE_RANK_COUNT).reverse() : [],
    };
  };

  const tagsFrom = (subset) => {
    const tagCounts = {};
    subset.forEach((entry) => {
      const tags = Array.isArray(entry.row.tags) ? entry.row.tags : [];
      tags.forEach((tag) => {
        const t = String(tag || "").trim();
        if (t) tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    });
    return Object.entries(tagCounts).filter(([tag]) => tag !== "Original").sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  const buildStatsFor = (subset) => {
    const pricing = pricingFrom(subset);
    return {
      ...pricing,
      typeTally: tallyFrom(subset, "Type").slice(0, 5),
      fandomTally: tallyFrom(subset, "Fandom").slice(0, 5),
      sizeTally: tallyFrom(subset, "Size"),
      conditionTally: isInventory ? tallyFrom(subset, "Condition") : [],
      topTags: tagsFrom(subset),
    };
  };

  // --- Cross-tab aggregate stats ---
  const globalStats = buildStatsFor(allRows);
  const totalItems = allRows.length;

  // --- Name stats ---
  let longestName = { name: "", length: 0 };
  let shortestName = { name: "", length: Infinity };
  allRows.forEach((entry) => {
    const name = getCellValue(entry, "Name");
    if (!name) return;
    if (name.length > longestName.length) longestName = { name, length: name.length };
    if (name.length < shortestName.length) shortestName = { name, length: name.length };
  });
  if (shortestName.length === Infinity) shortestName = { name: "", length: 0 };

  // --- Per-tab stats (with value ranking, excluding hidden columns) ---
  const perTab = perTabRows
    .sort((a, b) => b.count - a.count)
    .map((tab) => {
      const hiddenIds = columnOverrides.hiddenColumnsByTab[tab.id];
      const hidden = new Set(Array.isArray(hiddenIds) ? hiddenIds : []);
      const filtered = hidden.size > 0
        ? tab.entries.map((e) => ({ row: e.row, columns: e.columns.filter((c) => !hidden.has(c.id)), tabName: e.tabName }))
        : tab.entries;
      return { name: tab.name, id: tab.id, count: tab.count, stats: buildStatsFor(filtered) };
    });

  // --- Value per tab (Inventory only — sorted by value descending) ---
  const valuePerTab = [];
  if (isInventory) {
    perTabRows.forEach((tab) => {
      let tabTotal = 0;
      tab.entries.forEach((entry) => {
        const parsed = parseCurrency(getCellValue(entry, "Price"));
        if (parsed !== null && parsed > 0) tabTotal += parsed;
      });
      if (tabTotal > 0) valuePerTab.push({ name: tab.name, value: tabTotal });
    });
    valuePerTab.sort((a, b) => b.value - a.value);
  }

  // --- Tag coverage ---
  let taggedCount = 0;
  allRows.forEach((entry) => {
    const tags = Array.isArray(entry.row.tags) ? entry.row.tags : [];
    if (tags.some((t) => String(t || "").trim())) taggedCount++;
  });
  const tagCoverage = totalItems > 0 ? Math.round((taggedCount / totalItems) * 100) : 0;

  // --- Price distribution histogram (Inventory only) ---
  const priceBuckets = [
    { label: "$0 \u2013 $10", min: 0, max: 10, count: 0 },
    { label: "$10 \u2013 $25", min: 10, max: 25, count: 0 },
    { label: "$25 \u2013 $50", min: 25, max: 50, count: 0 },
    { label: "$50 \u2013 $100", min: 50, max: 100, count: 0 },
    { label: "$100+", min: 100, max: Infinity, count: 0 },
  ];
  const allPrices = [];
  if (isInventory) {
    allRows.forEach((entry) => {
      const parsed = parseCurrency(getCellValue(entry, "Price"));
      if (parsed !== null && parsed > 0) {
        allPrices.push(parsed);
        for (const bucket of priceBuckets) {
          if (parsed >= bucket.min && (parsed < bucket.max || (bucket.max === Infinity && parsed >= bucket.min))) {
            bucket.count++;
            break;
          }
        }
      }
    });
  }

  // --- Price standard deviation ---
  let priceStdDev = 0;
  if (allPrices.length > 1) {
    const mean = allPrices.reduce((s, p) => s + p, 0) / allPrices.length;
    const variance = allPrices.reduce((s, p) => s + (p - mean) * (p - mean), 0) / allPrices.length;
    priceStdDev = Math.sqrt(variance);
  }

  // --- Items added per month (createdAt-based) ---
  const monthlyAdds = {};
  const allDatedItems = [];
  perTabRows.forEach((tab) => {
    tab.entries.forEach((entry) => {
      if (entry.row.createdAt) {
        const d = new Date(entry.row.createdAt);
        if (!Number.isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          monthlyAdds[key] = (monthlyAdds[key] || 0) + 1;
          allDatedItems.push({
            date: d,
            tab: tab.name,
            name: getCellValue(entry, "Name") || "Unnamed",
            type: getCellValue(entry, "Type") || "",
            brand: getCellValue(entry, "Brand") || "",
            price: parseCurrency(getCellValue(entry, "Price")),
          });
        }
      }
    });
  });
  const itemsPerMonth = Object.entries(monthlyAdds)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => {
      const [y, m] = month.split("-");
      const label = new Date(Number(y), Number(m) - 1).toLocaleDateString(undefined, { year: "numeric", month: "short" });
      return { label, count };
    });

  // --- Purchase streak and no-buy streak (both day-based) ---
  let currentStreak = 0;
  let longestStreak = 0;
  let noBuyCurrentDays = 0;
  let noBuyLongestDays = 0;
  if (allDatedItems.length) {
    // Get unique calendar dates (YYYY-MM-DD) when items were added, sorted ascending
    const addDateSet = new Set();
    allDatedItems.forEach(({ date }) => {
      addDateSet.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`);
    });
    const sortedAddDates = Array.from(addDateSet).sort();
    const toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const todayStr = toDateStr(new Date());

    // --- Current purchase streak: consecutive days with adds, counting backward from today ---
    let pStreak = 0;
    const checkDate = new Date();
    for (let i = 0; i < 3650; i++) {
      if (addDateSet.has(toDateStr(checkDate))) {
        pStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        // Today has no adds — check if yesterday continues
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    currentStreak = pStreak;

    // --- Longest purchase streak: longest run of consecutive add-dates ---
    let run = 1;
    let best = 1;
    for (let i = 1; i < sortedAddDates.length; i++) {
      const gap = Math.floor((new Date(sortedAddDates[i] + "T00:00:00") - new Date(sortedAddDates[i - 1] + "T00:00:00")) / 86400000);
      if (gap === 1) {
        run++;
      } else {
        run = 1;
      }
      if (run > best) best = run;
    }
    longestStreak = sortedAddDates.length > 0 ? best : 0;

    // --- No-buy streak: days since last add ---
    const lastAddDate = sortedAddDates[sortedAddDates.length - 1];
    if (lastAddDate < todayStr) {
      noBuyCurrentDays = Math.floor((new Date(todayStr + "T00:00:00") - new Date(lastAddDate + "T00:00:00")) / 86400000);
    }

    // --- Longest no-buy streak: largest gap between consecutive add dates ---
    for (let i = 1; i < sortedAddDates.length; i++) {
      const gap = Math.floor((new Date(sortedAddDates[i] + "T00:00:00") - new Date(sortedAddDates[i - 1] + "T00:00:00")) / 86400000) - 1;
      if (gap > noBuyLongestDays) noBuyLongestDays = gap;
    }
    if (noBuyCurrentDays > noBuyLongestDays) noBuyLongestDays = noBuyCurrentDays;
  }

  // --- Collection diversity index (Shannon entropy on types + fandoms) ---
  const shannonEntropy = (tally) => {
    const total = tally.reduce((s, [, c]) => s + c, 0);
    if (total === 0) return 0;
    let entropy = 0;
    tally.forEach(([, count]) => {
      const p = count / total;
      if (p > 0) entropy -= p * Math.log2(p);
    });
    return entropy;
  };
  const fullTypeTally = tallyFrom(allRows, "Type");
  const fullFandomTally = tallyFrom(allRows, "Fandom");
  const typeEntropy = shannonEntropy(fullTypeTally);
  const fandomEntropy = shannonEntropy(fullFandomTally);
  const maxTypeEntropy = fullTypeTally.length > 1 ? Math.log2(fullTypeTally.length) : 1;
  const maxFandomEntropy = fullFandomTally.length > 1 ? Math.log2(fullFandomTally.length) : 1;
  const typeDiversity = maxTypeEntropy > 0 ? Math.round((typeEntropy / maxTypeEntropy) * 100) : 0;
  const fandomDiversity = maxFandomEntropy > 0 ? Math.round((fandomEntropy / maxFandomEntropy) * 100) : 0;

  // --- Rarity score (types/fandoms that appear only once) ---
  const rareTypes = fullTypeTally.filter(([, c]) => c === 1).map(([name]) => name);
  const rareFandoms = fullFandomTally.filter(([, c]) => c === 1).map(([name]) => name);
  // --- Whale-tagged items ---
  const whaleItems = [];
  perTabRows.forEach((tab) => {
    tab.entries.forEach((entry) => {
      const tags = Array.isArray(entry.row.tags) ? entry.row.tags : [];
      if (tags.some((t) => String(t || "").trim().toLowerCase() === "whale")) {
        const name = getCellValue(entry, "Name") || "Unnamed";
        const type = getCellValue(entry, "Type") || "";
        const analyticsWear = getAnalyticsWearData(entry.row);
        whaleItems.push({
          name,
          tab: tab.name,
          type,
          wearCount: analyticsWear.wearCount,
          lastWorn: analyticsWear.lastWorn || "",
        });
      }
    });
  });

  // --- Name word frequency ---
  const wordCounts = {};
  const stopWords = new Set(["the", "a", "an", "and", "or", "of", "in", "on", "for", "to", "with", "is", "at", "by", "from", "it", "its", "no", "not", "but", "be", "as", "do", "my", "so"]);
  allRows.forEach((entry) => {
    const name = getCellValue(entry, "Name");
    if (!name) return;
    name.split(/[\s\-\/\(\)\[\]:,]+/).forEach((word) => {
      const w = word.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (w.length < 2 || stopWords.has(w)) return;
      wordCounts[w] = (wordCounts[w] || 0) + 1;
    });
  });
  const topWords = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // --- Recently added (rows with createdAt) ---
  allDatedItems.sort((a, b) => b.date - a.date);
  const allRecentlyAdded = allDatedItems.map((item) => {
    const analyticsWear = getAnalyticsWearData(item.row || {});
    return {
      name: item.name,
      tab: item.tab,
      type: item.type,
      brand: item.brand,
      createdAt: item.date.toISOString(),
      price: item.price,
      wearCount: analyticsWear.wearCount,
      lastWorn: analyticsWear.lastWorn || "",
    };
  });
  const top5RecentlyAdded = allDatedItems.slice(0, 5).map((item) => {
    const analyticsWear = getAnalyticsWearData(item.row || {});
    return {
      name: item.name,
      tab: item.tab,
      type: item.type,
      brand: item.brand,
      createdAt: item.date.toISOString(),
      price: item.price,
      wearCount: analyticsWear.wearCount,
      lastWorn: analyticsWear.lastWorn || "",
    };
  });

  // --- Recently deleted ---
  const deletedEntries = loadDeletedRows();
  const recentlyDeleted = deletedEntries.slice(0, 5).map((entry) => {
    const name = getRowNameFromEntry(entry);
    const date = entry.deletedAt ? new Date(entry.deletedAt).toLocaleDateString() : "";
    const tab = entry.fromTabName || "";
    const cols = Array.isArray(entry.columns) ? entry.columns : [];
    const typeCol = cols.find((c) => c.name === "Type");
    const type = (typeCol && entry.row && entry.row.cells) ? String(entry.row.cells[typeCol.id] || "").trim() : "";
    return { name, date, tab, type };
  });

  // --- Wear-based stats (Inventory only) ---
  const excludedWearTypes = new Set([
    "chinos",
    "boxer briefs",
    "socks",
    "hat",
    "shorts",
    "hybrid shorts",
    "joggers",
    "misc",
    "outerwear",
    "bamboo shorts",
  ]);
  const isWearExcludedType = (typeVal) => excludedWearTypes.has(String(typeVal || "").trim().toLowerCase());
  const wornItems = [];
  const unwornOverSixMonths = [];
  if (isInventory) {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 6);
    const cutoffMs = cutoffDate.getTime();
    perTabRows.forEach((tab) => {
      tab.entries.forEach((entry) => {
        const analyticsWear = getAnalyticsWearData(entry.row);
        const wc = analyticsWear.wearCount;
        const lw = analyticsWear.lastWorn || null;
        const name = getCellValue(entry, "Name") || "Unnamed";
        const typeVal = getCellValue(entry, "Type");
        const isWearable = !isWearExcludedType(typeVal);
        const priceRaw = getCellValue(entry, "Price");
        const price = parseCurrency(priceRaw);
        if (wc >= 1) {
          const item = { name, tab: tab.name, wearCount: wc, lastWorn: lw, type: typeVal, price, wearLog: analyticsWear.wearLog };
          wornItems.push(item);
        }
        if (isWearable) {
          const lwDate = lw ? new Date(lw) : null;
          const lwMs = lwDate ? lwDate.getTime() : NaN;
          if (!lw || Number.isNaN(lwMs) || lwMs < cutoffMs) {
            const daysSince = !lw || Number.isNaN(lwMs) ? null : Math.floor((Date.now() - lwMs) / 86400000);
            unwornOverSixMonths.push({
              name,
              tab: tab.name,
              type: typeVal,
              lastWorn: lw,
              daysSince,
            });
          }
        }
      });
    });
  }
  // Longest unworn: item with oldest lastWorn date
  let longestUnworn = null;
  if (wornItems.length) {
    const withDate = wornItems.filter((i) => i.lastWorn);
    if (withDate.length) {
      withDate.sort((a, b) => new Date(a.lastWorn) - new Date(b.lastWorn));
      const oldest = withDate[0];
      const daysSince = Math.floor((Date.now() - new Date(oldest.lastWorn).getTime()) / 86400000);
      longestUnworn = { name: oldest.name, tab: oldest.tab, type: oldest.type || "", daysSince, lastWorn: oldest.lastWorn };
    }
  }
  // Cost per wear: Price / wearCount, sorted ascending (best value first)
  const costPerWear = wornItems
    .filter((i) => i.price !== null && i.price > 0)
    .map((i) => ({ name: i.name, tab: i.tab, type: i.type || "", cpw: i.price / i.wearCount, wearCount: i.wearCount, price: i.price }))
    .sort((a, b) => a.cpw - b.cpw)
    .slice(0, 5);
  const recencyBonusFromLastWorn = (lastWorn) => {
    if (!lastWorn) return 0;
    const ageDays = Math.floor((Date.now() - new Date(lastWorn).getTime()) / 86400000);
    if (Number.isNaN(ageDays)) return 0;
    if (ageDays <= 30) return 5;
    if (ageDays <= 90) return 4;
    if (ageDays <= 180) return 3;
    if (ageDays <= 365) return 2;
    return 1;
  };
  const rotationRanked = wornItems
    .map((item) => {
      const recencyBonus = recencyBonusFromLastWorn(item.lastWorn);
      const priceValue = item.price !== null && item.price > 0 ? item.price : 0;
      const priceBonusPoints = Math.round(Math.log10(priceValue + 1) * 25);
      const rotationScorePoints = (item.wearCount * 60) + (recencyBonus * 40) + priceBonusPoints;
      return { ...item, recencyBonus, priceBonusPoints, rotationScorePoints };
    })
    .sort((a, b) => b.rotationScorePoints - a.rotationScorePoints || b.price - a.price || b.wearCount - a.wearCount || new Date(b.lastWorn || 0) - new Date(a.lastWorn || 0) || a.name.localeCompare(b.name));
  const topRotationScore = rotationRanked.slice(0, 5);
  const tieCounts = new Map();
  topRotationScore.forEach((item) => {
    tieCounts.set(item.rotationScorePoints, (tieCounts.get(item.rotationScorePoints) || 0) + 1);
  });
  topRotationScore.forEach((item) => {
    item.isTie = (tieCounts.get(item.rotationScorePoints) || 0) > 1;
  });
  unwornOverSixMonths.sort((a, b) => {
    if (a.daysSince === null && b.daysSince === null) return a.name.localeCompare(b.name);
    if (a.daysSince === null) return -1;
    if (b.daysSince === null) return 1;
    return b.daysSince - a.daysSince || a.name.localeCompare(b.name);
  });
  // Last 5 worn: the 5 most recently worn items, sorted most-recent-first
  const last5Worn = wornItems
    .filter((i) => i.lastWorn)
    .sort((a, b) => new Date(b.lastWorn) - new Date(a.lastWorn))
    .slice(0, 5);
  // Wear log events keyed by local calendar date (lifetime)
  const wearEvents = [];
  wornItems.forEach((item) => {
    item.wearLog.forEach((dateStr) => {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return;
      wearEvents.push({
        name: item.name,
        tab: item.tab,
        type: item.type,
        wornAt: d.toISOString(),
        dateKey: toLocalDateKey(d),
      });
    });
  });
  wearEvents.sort((a, b) => new Date(b.wornAt) - new Date(a.wornAt));
  // Most worn brand by day of week (from wearLog data, lifetime)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const brandByDay = Array.from({ length: 7 }, () => ({})); // [{ brand: count }, ...]
  wornItems.forEach((item) => {
    item.wearLog.forEach((dateStr) => {
      const d = new Date(dateStr);
      const day = d.getDay(); // 0=Sun .. 6=Sat
      brandByDay[day][item.tab] = (brandByDay[day][item.tab] || 0) + 1;
    });
  });
  const brandByDayOfWeek = dayNames.map((name, i) => {
    const counts = brandByDay[i];
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return { day: name, brand: entries.length ? entries[0][0] : null, count: entries.length ? entries[0][1] : 0 };
  });

  // Most worn brand by month (from wearLog data, lifetime)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const brandByMo = Array.from({ length: 12 }, () => ({}));
  wornItems.forEach((item) => {
    item.wearLog.forEach((dateStr) => {
      const d = new Date(dateStr);
      const mo = d.getMonth(); // 0=Jan .. 11=Dec
      brandByMo[mo][item.tab] = (brandByMo[mo][item.tab] || 0) + 1;
    });
  });
  const brandByMonth = monthNames.map((name, i) => {
    const counts = brandByMo[i];
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return { month: name, brand: entries.length ? entries[0][0] : null, count: entries.length ? entries[0][1] : 0 };
  });

  // --- Advanced stats ---
  const median = (values) => {
    if (!values.length) return 0;
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };
  const wearableUniverse = [];
  if (isInventory) {
    perTabRows.forEach((tab) => {
      tab.entries.forEach((entry) => {
        const name = getCellValue(entry, "Name") || "Unnamed";
        const type = getCellValue(entry, "Type") || "Unknown";
        if (isWearExcludedType(type)) return;
        const price = parseCurrency(getCellValue(entry, "Price"));
        const analyticsWear = getAnalyticsWearData(entry.row);
        const wearCount = analyticsWear.wearCount;
        const lastWorn = analyticsWear.lastWorn || null;
        const wearLog = analyticsWear.wearLog;
        wearableUniverse.push({
          rowId: entry.row.id,
          tabId: tab.id,
          name,
          tab: tab.name,
          type,
          price,
          condition: getCellValue(entry, "Condition") || "",
          fandom: getCellValue(entry, "Fandom") || "",
          wearCount,
          lastWorn,
          wearLog,
          createdAt: entry.row.createdAt || null,
          tags: Array.isArray(entry.row.tags) ? entry.row.tags : [],
        });
      });
    });
  }

  const nowMs = Date.now();
  const firstWearLagAll = [];
  const adoptionDays = [];
  const neverWornSinceAdded = [];
  let itemsWithCreatedAt = 0;
  wearableUniverse.forEach((item) => {
    if (!item.createdAt) return;
    const createdMs = new Date(item.createdAt).getTime();
    if (Number.isNaN(createdMs)) return;
    itemsWithCreatedAt++;
    let firstWearMs = null;
    item.wearLog.forEach((stamp) => {
      const ms = new Date(stamp).getTime();
      if (Number.isNaN(ms) || ms < createdMs) return;
      if (firstWearMs === null || ms < firstWearMs) firstWearMs = ms;
    });
    if (firstWearMs === null) {
      neverWornSinceAdded.push({
        ...item,
        daysSinceAdded: Math.max(0, Math.floor((nowMs - createdMs) / 86400000)),
      });
      return;
    }
    const firstWearLagDays = Math.floor((firstWearMs - createdMs) / 86400000);
    adoptionDays.push(firstWearLagDays);
    firstWearLagAll.push({
      ...item,
      firstWearLagDays,
      firstWearAt: new Date(firstWearMs).toISOString(),
    });
  });
  firstWearLagAll.sort((a, b) => b.firstWearLagDays - a.firstWearLagDays || a.name.localeCompare(b.name));
  const firstWearLag = firstWearLagAll.slice(0, 10);

  const neverWornSinceAddedSorted = neverWornSinceAdded
    .sort((a, b) => (b.daysSinceAdded || 0) - (a.daysSinceAdded || 0) || a.name.localeCompare(b.name));

  const newItemAdoption = {
    itemsWithCreatedAt,
    wornAfterAddCount: adoptionDays.length,
    medianDaysToFirstWear: adoptionDays.length ? median(adoptionDays) : null,
    adoptionRatePct: itemsWithCreatedAt ? Math.round((adoptionDays.length / itemsWithCreatedAt) * 100) : 0,
    neverWornSinceAddedTotal: neverWornSinceAddedSorted.length,
    neverWornSinceAdded: neverWornSinceAddedSorted.slice(0, 12),
  };

  const monthlyMap = {};
  allDatedItems.forEach((item) => {
    const key = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap[key]) monthlyMap[key] = { key, added: 0, spend: 0, wears: 0 };
    monthlyMap[key].added += 1;
    if (item.price !== null && item.price > 0) monthlyMap[key].spend += item.price;
  });
  wearEvents.forEach((event) => {
    const d = new Date(event.wornAt);
    if (Number.isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap[key]) monthlyMap[key] = { key, added: 0, spend: 0, wears: 0 };
    monthlyMap[key].wears += 1;
  });
  const monthlySpendVsWear = Object.values(monthlyMap)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((m) => {
      const [y, mo] = m.key.split("-");
      const label = new Date(Number(y), Number(mo) - 1).toLocaleDateString(undefined, { year: "numeric", month: "short" });
      return {
        label,
        added: m.added,
        spend: m.spend,
        wears: m.wears,
        spendPerWear: m.wears > 0 ? m.spend / m.wears : null,
      };
    });

  const brandRollup = {};
  wearableUniverse.forEach((item) => {
    if (!brandRollup[item.tab]) {
      brandRollup[item.tab] = { brand: item.tab, inventory: 0, wornLast365: 0, totalWears: 0, cpwSum: 0, cpwCount: 0 };
    }
    const bucket = brandRollup[item.tab];
    bucket.inventory += 1;
    bucket.totalWears += item.wearCount;
    if (item.lastWorn) {
      const age = Math.floor((nowMs - new Date(item.lastWorn).getTime()) / 86400000);
      if (!Number.isNaN(age) && age <= 365) bucket.wornLast365 += 1;
    }
    if (item.price !== null && item.price > 0 && item.wearCount > 0) {
      bucket.cpwSum += item.price / item.wearCount;
      bucket.cpwCount += 1;
    }
  });
  const brandUtilization = Object.values(brandRollup)
    .map((item) => ({
      ...item,
      utilizationPct: item.inventory > 0 ? Math.round((item.wornLast365 / item.inventory) * 100) : 0,
      avgCpw: item.cpwCount > 0 ? item.cpwSum / item.cpwCount : null,
    }))
    .sort((a, b) => a.utilizationPct - b.utilizationPct || b.inventory - a.inventory);

  const invTypeCounts = {};
  wearableUniverse.forEach((item) => {
    invTypeCounts[item.type] = (invTypeCounts[item.type] || 0) + 1;
  });
  const wearTypeCounts = {};
  wearEvents.forEach((event) => {
    const key = event.type || "Unknown";
    wearTypeCounts[key] = (wearTypeCounts[key] || 0) + 1;
  });
  const invTypeTotal = Object.values(invTypeCounts).reduce((s, c) => s + c, 0);
  const wearTypeTotal = Object.values(wearTypeCounts).reduce((s, c) => s + c, 0);
  const typeKeys = Array.from(new Set([...Object.keys(invTypeCounts), ...Object.keys(wearTypeCounts)]));
  const typeRotationBalance = typeKeys
    .map((type) => {
      const invCount = invTypeCounts[type] || 0;
      const wearCount = wearTypeCounts[type] || 0;
      const invPct = invTypeTotal > 0 ? (invCount / invTypeTotal) * 100 : 0;
      const wearPct = wearTypeTotal > 0 ? (wearCount / wearTypeTotal) * 100 : 0;
      return {
        type,
        inventoryCount: invCount,
        wearCount,
        inventoryPct: invPct,
        wearPct,
        deltaPct: wearPct - invPct,
      };
    })
    .sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));

  let totalWearableValue = 0;
  let inactive90Value = 0;
  let inactive180Value = 0;
  let inactive365Value = 0;
  let inactive90Count = 0;
  let inactive180Count = 0;
  let inactive365Count = 0;
  wearableUniverse.forEach((item) => {
    const value = item.price !== null && item.price > 0 ? item.price : 0;
    totalWearableValue += value;
    const lwMs = item.lastWorn ? new Date(item.lastWorn).getTime() : NaN;
    const age = Number.isNaN(lwMs) ? Infinity : Math.floor((nowMs - lwMs) / 86400000);
    if (age > 90) {
      inactive90Count += 1;
      inactive90Value += value;
    }
    if (age > 180) {
      inactive180Count += 1;
      inactive180Value += value;
    }
    if (age > 365) {
      inactive365Count += 1;
      inactive365Value += value;
    }
  });
  const inactiveCapital = {
    totalWearableValue,
    inactive90Count,
    inactive180Count,
    inactive365Count,
    inactive90Value,
    inactive180Value,
    inactive365Value,
  };

  const longestConsecutiveStreak = (dateKeys) => {
    if (!dateKeys.length) return 0;
    const sorted = Array.from(new Set(dateKeys)).sort();
    let best = 1;
    let run = 1;
    for (let i = 1; i < sorted.length; i++) {
      const gap = Math.floor((new Date(sorted[i] + "T00:00:00").getTime() - new Date(sorted[i - 1] + "T00:00:00").getTime()) / 86400000);
      if (gap === 1) run += 1;
      else run = 1;
      if (run > best) best = run;
    }
    return best;
  };
  const brandDates = {};
  const typeDates = {};
  wearEvents.forEach((event) => {
    if (!brandDates[event.tab]) brandDates[event.tab] = [];
    brandDates[event.tab].push(event.dateKey);
    const typeKey = event.type || "Unknown";
    if (!typeDates[typeKey]) typeDates[typeKey] = [];
    typeDates[typeKey].push(event.dateKey);
  });
  const topBrandStreaks = Object.entries(brandDates)
    .map(([brand, days]) => ({ label: brand, streak: longestConsecutiveStreak(days) }))
    .sort((a, b) => b.streak - a.streak || a.label.localeCompare(b.label))
    .slice(0, 5);
  const topTypeStreaks = Object.entries(typeDates)
    .map(([type, days]) => ({ label: type, streak: longestConsecutiveStreak(days) }))
    .sort((a, b) => b.streak - a.streak || a.label.localeCompare(b.label))
    .slice(0, 5);
  const repeatWearStreaks = { topBrandStreaks, topTypeStreaks };

  const monthTypeCounts = Array.from({ length: 12 }, () => ({}));
  wearEvents.forEach((event) => {
    const d = new Date(event.wornAt);
    if (Number.isNaN(d.getTime())) return;
    const month = d.getMonth();
    const key = event.type || "Unknown";
    monthTypeCounts[month][key] = (monthTypeCounts[month][key] || 0) + 1;
  });
  const seasonalityByMonth = monthNames.map((month, idx) => {
    const entries = Object.entries(monthTypeCounts[idx]).sort((a, b) => b[1] - a[1]);
    return { month, type: entries.length ? entries[0][0] : null, count: entries.length ? entries[0][1] : 0 };
  });

  const tagRollup = {};
  wearableUniverse.forEach((item) => {
    item.tags.forEach((rawTag) => {
      const tag = String(rawTag || "").trim();
      if (!tag || tag === "Original") return;
      if (!tagRollup[tag]) tagRollup[tag] = { tag, samples: 0, wearSum: 0, cpwSum: 0, cpwCount: 0 };
      const bucket = tagRollup[tag];
      bucket.samples += 1;
      bucket.wearSum += item.wearCount;
      if (item.price !== null && item.price > 0 && item.wearCount > 0) {
        bucket.cpwSum += item.price / item.wearCount;
        bucket.cpwCount += 1;
      }
    });
  });
  const tagPerformance = Object.values(tagRollup)
    .filter((t) => t.samples >= 2)
    .map((t) => ({
      tag: t.tag,
      samples: t.samples,
      avgWears: t.samples ? t.wearSum / t.samples : 0,
      avgCpw: t.cpwCount ? t.cpwSum / t.cpwCount : null,
    }))
    .sort((a, b) => b.avgWears - a.avgWears || b.samples - a.samples)
    .slice(0, 12);

  const wornLast365 = wearableUniverse.filter((item) => {
    if (!item.lastWorn) return false;
    const age = Math.floor((nowMs - new Date(item.lastWorn).getTime()) / 86400000);
    return !Number.isNaN(age) && age <= 365;
  }).length;
  const neverWornCount = wearableUniverse.filter((item) => !item.lastWorn && item.wearCount === 0).length;
  const recencyPct = wearableUniverse.length ? Math.round((wornLast365 / wearableUniverse.length) * 100) : 0;
  const neverWornPct = wearableUniverse.length ? Math.round((neverWornCount / wearableUniverse.length) * 100) : 0;
  const inactiveValuePct = totalWearableValue > 0 ? Math.round((inactive365Value / totalWearableValue) * 100) : 0;
  const pricedWorn = wearableUniverse.filter((item) => item.price !== null && item.price > 0 && item.wearCount > 0);
  const cpwEffPct = pricedWorn.length
    ? Math.round((pricedWorn.filter((item) => (item.price / item.wearCount) <= 20).length / pricedWorn.length) * 100)
    : 50;
  const closetHealthScore = Math.max(0, Math.min(100,
    Math.round((recencyPct * 0.35) + ((100 - neverWornPct) * 0.25) + ((100 - inactiveValuePct) * 0.2) + (cpwEffPct * 0.2))
  ));
  const advanced = {
    firstWearLag,
    firstWearLagAll,
    newItemAdoption,
    monthlySpendVsWear,
    brandUtilization,
    typeRotationBalance,
    inactiveCapital,
    repeatWearStreaks,
    seasonalityByMonth,
    tagPerformance,
    closetHealth: {
      score: closetHealthScore,
      recencyPct,
      recencyWindowDays: 365,
      neverWornPct,
      inactiveValuePct,
      inactiveValueWindowDays: 365,
      cpwEffPct,
    },
  };

  let wishlistConversion = {
    lifetimeTotal: 0,
    trackedCount: 0,
    linkedInventoryCount: 0,
    legacyCount: 0,
    buyGateReviewedCount: 0,
    duplicateFlaggedCount: 0,
    flaggedFirstWearPct: null,
    clearFirstWearPct: null,
    flaggedRepeatWearPct: null,
    clearRepeatWearPct: null,
    firstWearCount: 0,
    repeatWearCount: 0,
    firstWearPct: null,
    repeatWearPct: null,
    medianWishlistToGotItDays: null,
    medianGotItToFirstWearDays: null,
    topBrands: [],
    topTypes: [],
    items: [],
  };
  if (!isInventory) {
    let gotItLog = [];
    try {
      gotItLog = JSON.parse(localStorage.getItem(GOT_IT_LOG_KEY) || "[]");
    } catch (error) { /* ignore */ }
    const trimmedCount = parseInt(localStorage.getItem(GOT_IT_LOG_KEY + ":trimmed") || "0", 10);
    const inventoryEntriesById = new Map();
    try {
      const storedTabs = localStorage.getItem(TAB_STORAGE_KEY);
      const parsedTabs = storedTabs ? JSON.parse(storedTabs) : null;
      const inventoryTabs = parsedTabs && Array.isArray(parsedTabs.tabs) ? parsedTabs.tabs : [];
      inventoryTabs.forEach((tab) => {
        if (!tab || !tab.id) return;
        try {
          const storedState = localStorage.getItem(`${STORAGE_KEY}:${tab.id}`);
          const parsedState = storedState ? JSON.parse(storedState) : null;
          if (!parsedState || !Array.isArray(parsedState.rows) || !Array.isArray(parsedState.columns)) return;
          parsedState.rows.forEach((row) => {
            if (!row || !row.id) return;
            inventoryEntriesById.set(String(row.id), {
              row,
              columns: parsedState.columns,
              tabName: tab.name || "",
            });
          });
        } catch (error) { /* ignore */ }
      });
    } catch (error) { /* ignore */ }

    const buildTopConverters = (items, key) => Object.values(items.reduce((acc, item) => {
      const label = String(item[key] || "").trim();
      if (!label) return acc;
      if (!acc[label]) {
        acc[label] = { label, obtainedCount: 0, firstWearCount: 0, repeatWearCount: 0, rate: 0 };
      }
      acc[label].obtainedCount += 1;
      if (item.firstWearAt) acc[label].firstWearCount += 1;
      if (item.repeatWear) acc[label].repeatWearCount += 1;
      return acc;
    }, {})).map((item) => ({
      ...item,
      rate: item.obtainedCount ? Math.round((item.firstWearCount / item.obtainedCount) * 100) : 0,
    }))
      .sort((a, b) => b.rate - a.rate || b.obtainedCount - a.obtainedCount || a.label.localeCompare(b.label))
      .slice(0, 3);

    const dayMs = 86400000;
    const nowMs = Date.now();
    const trackedItems = [];
    const linkedItems = [];
    const wishlistToGotItSamples = [];
    const gotItToFirstWearSamples = [];
    const pctFor = (items, key) => {
      if (!items.length) return null;
      const yesCount = items.filter((item) => Boolean(item[key])).length;
      return Math.round((yesCount / items.length) * 100);
    };

    gotItLog.forEach((entry) => {
      if (!entry || typeof entry !== "object") return;
      const inventoryRowId = String(entry.inventoryRowId || "").trim();
      if (!inventoryRowId) return;
      const obtainedAt = String(entry.obtainedAt || entry.date || "").trim();
      const wishlistAddedAt = String(entry.wishlistAddedAt || "").trim();
      const inventoryEntry = inventoryEntriesById.get(inventoryRowId) || null;
      let wearCount = 0;
      let firstWearAt = "";
      let gotItToFirstWearDays = null;

      if (inventoryEntry) {
        const analyticsWear = getAnalyticsWearData(inventoryEntry.row);
        wearCount = analyticsWear.wearCount;
        const wearLog = analyticsWear.wearLog;
        const obtainedMs = obtainedAt ? new Date(obtainedAt).getTime() : NaN;
        const wearTimes = wearLog
          .map((stamp) => new Date(stamp).getTime())
          .filter((ms) => Number.isFinite(ms))
          .sort((a, b) => a - b);
        const firstWearMs = Number.isFinite(obtainedMs)
          ? wearTimes.find((ms) => ms >= obtainedMs)
          : wearTimes[0];
        if (Number.isFinite(firstWearMs)) {
          firstWearAt = new Date(firstWearMs).toISOString();
          if (Number.isFinite(obtainedMs) && firstWearMs >= obtainedMs) {
            gotItToFirstWearDays = Math.floor((firstWearMs - obtainedMs) / dayMs);
            gotItToFirstWearSamples.push(gotItToFirstWearDays);
          }
        }
      }

      let wishlistToGotItDays = null;
      const wishlistAddedMs = wishlistAddedAt ? new Date(wishlistAddedAt).getTime() : NaN;
      const obtainedMs = obtainedAt ? new Date(obtainedAt).getTime() : NaN;
      if (Number.isFinite(wishlistAddedMs) && Number.isFinite(obtainedMs) && obtainedMs >= wishlistAddedMs) {
        wishlistToGotItDays = Math.floor((obtainedMs - wishlistAddedMs) / dayMs);
        wishlistToGotItSamples.push(wishlistToGotItDays);
      }

      const repeatWear = wearCount >= 2;
      const duplicateRisk = entry && entry.duplicateRisk && typeof entry.duplicateRisk === "object"
        ? {
          flagged: Boolean(entry.duplicateRisk.flagged),
          riskLevel: String(entry.duplicateRisk.riskLevel || (entry.duplicateRisk.flagged ? "Flagged" : "Clear")),
          similarCount: Math.max(0, Number(entry.duplicateRisk.similarCount || 0)),
          visualMatchCount: Math.max(0, Number(entry.duplicateRisk.visualMatchCount || 0)),
          strongestLabel: String(entry.duplicateRisk.strongestLabel || ""),
        }
        : null;
      let status = "Inventory row missing";
      if (inventoryEntry) {
        if (firstWearAt && repeatWear) {
          status = `Repeat worn${gotItToFirstWearDays === null ? "" : ` · first wear in ${gotItToFirstWearDays}d`} · ${wearCount} wears`;
        } else if (firstWearAt) {
          status = gotItToFirstWearDays === null ? "Worn once" : `First worn in ${gotItToFirstWearDays}d`;
        } else if (Number.isFinite(obtainedMs)) {
          const daysSince = Math.max(0, Math.floor((nowMs - obtainedMs) / dayMs));
          status = `Not worn yet · ${daysSince}d since got it`;
        } else {
          status = "Not worn yet";
        }
      }

      const item = {
        name: String(entry.name || "Unnamed"),
        brand: String(entry.brand || entry.toTab || (inventoryEntry ? inventoryEntry.tabName : "") || ""),
        type: String(entry.type || (inventoryEntry ? getCellValue(inventoryEntry, "Type") : "") || ""),
        obtainedAt,
        wishlistAddedAt,
        wishlistToGotItDays,
        firstWearAt,
        gotItToFirstWearDays,
        wearCount,
        repeatWear,
        inventoryFound: Boolean(inventoryEntry),
        duplicateRisk,
        riskLabel: duplicateRisk
          ? (duplicateRisk.flagged ? `${duplicateRisk.riskLevel} risk` : "Clear buy gate")
          : "Legacy",
        status,
      };
      trackedItems.push(item);
      if (item.inventoryFound) linkedItems.push(item);
    });

    trackedItems.sort((a, b) => new Date(b.obtainedAt || 0) - new Date(a.obtainedAt || 0) || a.name.localeCompare(b.name));
    const firstWearCount = linkedItems.filter((item) => item.firstWearAt).length;
    const repeatWearCount = linkedItems.filter((item) => item.repeatWear).length;
    const reviewedItems = linkedItems.filter((item) => item.duplicateRisk);
    const flaggedItems = reviewedItems.filter((item) => item.duplicateRisk && item.duplicateRisk.flagged);
    const clearItems = reviewedItems.filter((item) => item.duplicateRisk && !item.duplicateRisk.flagged);
    wishlistConversion = {
      lifetimeTotal: gotItLog.length + trimmedCount,
      trackedCount: trackedItems.length,
      linkedInventoryCount: linkedItems.length,
      legacyCount: gotItLog.filter((entry) => !String(entry?.inventoryRowId || "").trim()).length + trimmedCount,
      buyGateReviewedCount: reviewedItems.length,
      duplicateFlaggedCount: flaggedItems.length,
      flaggedFirstWearPct: pctFor(flaggedItems, "firstWearAt"),
      clearFirstWearPct: pctFor(clearItems, "firstWearAt"),
      flaggedRepeatWearPct: pctFor(flaggedItems, "repeatWear"),
      clearRepeatWearPct: pctFor(clearItems, "repeatWear"),
      firstWearCount,
      repeatWearCount,
      firstWearPct: linkedItems.length ? Math.round((firstWearCount / linkedItems.length) * 100) : null,
      repeatWearPct: linkedItems.length ? Math.round((repeatWearCount / linkedItems.length) * 100) : null,
      medianWishlistToGotItDays: wishlistToGotItSamples.length ? Math.round(median(wishlistToGotItSamples)) : null,
      medianGotItToFirstWearDays: gotItToFirstWearSamples.length ? Math.round(median(gotItToFirstWearSamples)) : null,
      topBrands: buildTopConverters(linkedItems, "brand"),
      topTypes: buildTopConverters(linkedItems, "type"),
      items: trackedItems,
    };
  }

  return {
    totalItems,
    isInventory,
    ...globalStats,
    longestName,
    shortestName,
    perTab,
    valuePerTab,
    tagCoverage,
    taggedCount,
    priceBuckets,
    priceStdDev,
    itemsPerMonth,
    currentStreak,
    longestStreak,
    noBuyCurrentDays,
    noBuyLongestDays,
    typeDiversity,
    fandomDiversity,
    rareTypes,
    rareFandoms,
    whaleItems,
    topWords,
    recentlyAdded: top5RecentlyAdded,
    allRecentlyAdded,
    recentlyDeleted,
    longestUnworn,
    costPerWear,
    topRotationScore,
    unwornOverSixMonths,
    last5Worn,
    wearEvents,
    wearableItems: wearableUniverse,
    brandByDayOfWeek,
    brandByMonth,
    advanced,
    wishlistConversion,
  };
};

const openWearHistoryDialog = (wearEvents, options = {}) => {
  const events = Array.isArray(wearEvents) ? wearEvents.slice() : [];
  events.sort((a, b) => new Date(b.wornAt) - new Date(a.wornAt));
  const title = String(options.title || "Wear History");
  const emptySummary = String(options.emptySummary || "No wear history logged yet.");

  let dialog = document.getElementById("wear-history-dialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "wear-history-dialog";
    dialog.innerHTML = `
      <div class="dialog-body">
        <h3>Wear History</h3>
        <div id="wear-history-summary" class="stats-hint"></div>
        <div id="wear-history-list" class="wear-history-list"></div>
      </div>
      <div class="dialog-actions">
        <button type="button" id="wear-history-close" class="btn">Close</button>
      </div>
    `;
    document.body.appendChild(dialog);

    const closeButton = dialog.querySelector("#wear-history-close");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        closeDialog(dialog);
      });
    }
  }

  const titleEl = dialog.querySelector("h3");
  const summary = dialog.querySelector("#wear-history-summary");
  const list = dialog.querySelector("#wear-history-list");
  if (!list) return;
  if (titleEl) titleEl.textContent = title;
  list.textContent = "";

  if (events.length === 0) {
    if (summary) summary.textContent = emptySummary;
    const empty = document.createElement("div");
    empty.className = "stats-hint";
    empty.textContent = "No shirts have been logged yet.";
    list.appendChild(empty);
    openDialog(dialog);
    resetDialogScroll(dialog);
    return;
  }

  if (summary) {
    summary.textContent = `${events.length} total wear ${events.length === 1 ? "log" : "logs"}`;
  }

  events.forEach((event, index) => {
    const item = document.createElement("div");
    item.className = "wear-history-item";

    const left = document.createElement("span");
    left.className = "wear-history-name";
    left.textContent = `${index + 1}. ${event.name} (${event.tab})${event.type ? ` - ${event.type}` : ""}`;

    const right = document.createElement("span");
    right.className = "wear-history-date";
    right.textContent = new Date(event.wornAt).toLocaleDateString();

    item.appendChild(left);
    item.appendChild(right);
    list.appendChild(item);
  });

  openDialog(dialog);
  resetDialogScroll(dialog);
};

const openUnwornSixMonthsDialog = (items) => {
  const listItems = Array.isArray(items) ? items.slice() : [];

  let dialog = document.getElementById("unworn-six-months-dialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "unworn-six-months-dialog";
    dialog.innerHTML = `
      <div class="dialog-body">
        <h3>Not Worn In Past 6 Months</h3>
        <div id="unworn-six-months-summary" class="stats-hint"></div>
        <div id="unworn-six-months-list" class="wear-history-list"></div>
      </div>
      <div class="dialog-actions">
        <button type="button" id="unworn-six-months-close" class="btn">Close</button>
      </div>
    `;
    document.body.appendChild(dialog);

    const closeButton = dialog.querySelector("#unworn-six-months-close");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        closeDialog(dialog);
      });
    }
  }

  const summary = dialog.querySelector("#unworn-six-months-summary");
  const list = dialog.querySelector("#unworn-six-months-list");
  if (!list) return;
  list.textContent = "";

  if (listItems.length === 0) {
    if (summary) summary.textContent = "Everything has been worn in the past 6 months.";
    const empty = document.createElement("div");
    empty.className = "stats-hint";
    empty.textContent = "No shirts to show.";
    list.appendChild(empty);
    openDialog(dialog);
    resetDialogScroll(dialog);
    return;
  }

  if (summary) {
    summary.textContent = `${listItems.length} ${listItems.length === 1 ? "shirt" : "shirts"}`;
  }

  listItems.forEach((item, index) => {
    const rowEl = document.createElement("div");
    rowEl.className = "wear-history-item";

    const left = document.createElement("span");
    left.className = "wear-history-name";
    left.textContent = `${index + 1}. ${item.name} (${item.tab})${item.type ? ` - ${item.type}` : ""}`;

    const right = document.createElement("span");
    right.className = "wear-history-date";
    right.textContent = item.lastWorn
      ? `${item.daysSince} ${item.daysSince === 1 ? "day" : "days"} ago`
      : "Never";

    rowEl.appendChild(left);
    rowEl.appendChild(right);
    list.appendChild(rowEl);
  });

  openDialog(dialog);
  resetDialogScroll(dialog);
};

const openAllAddedDialog = (addedItems, isInventoryMode) => {
  const items = Array.isArray(addedItems) ? addedItems.slice() : [];

  let dialog = document.getElementById("all-added-dialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "all-added-dialog";
    dialog.innerHTML = `
      <div class="dialog-body">
        <h3>All Added Shirts</h3>
        <div id="all-added-summary" class="stats-hint"></div>
        <div id="all-added-list" class="added-history-list"></div>
      </div>
      <div class="dialog-actions">
        <button type="button" id="all-added-close" class="btn">Close</button>
      </div>
    `;
    document.body.appendChild(dialog);

    const closeButton = dialog.querySelector("#all-added-close");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        closeDialog(dialog);
      });
    }
  }

  const summary = dialog.querySelector("#all-added-summary");
  const list = dialog.querySelector("#all-added-list");
  if (!list) return;
  list.textContent = "";

  if (!items.length) {
    if (summary) summary.textContent = "No added shirts found.";
    const empty = document.createElement("div");
    empty.className = "stats-hint";
    empty.textContent = "No rows with created dates are available.";
    list.appendChild(empty);
    openDialog(dialog);
    resetDialogScroll(dialog);
    return;
  }

  if (summary) summary.textContent = `${items.length} ${items.length === 1 ? "shirt" : "shirts"}`;

  const head = document.createElement("div");
  head.className = "added-history-item added-history-head";
  head.innerHTML = "<span>Name</span><span>Brand</span><span>Type</span><span>Date Added</span><span>Price</span>";
  list.appendChild(head);

  items.forEach((item) => {
    const rowEl = document.createElement("div");
    rowEl.className = "added-history-item";
    const brandLabel = isInventoryMode ? item.tab : (item.brand || "");
    const dateLabel = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "";
    const priceLabel = item.price !== null && item.price !== undefined ? formatCurrency(item.price) : "\u2014";
    const values = [
      item.name || "Unnamed",
      brandLabel || "\u2014",
      item.type || "\u2014",
      dateLabel || "\u2014",
      priceLabel,
    ];
    values.forEach((value) => {
      const cell = document.createElement("span");
      cell.textContent = value;
      rowEl.appendChild(cell);
    });
    list.appendChild(rowEl);
  });

  openDialog(dialog);
  resetDialogScroll(dialog);
};

const openWishlistConversionDialog = (funnel) => {
  const items = funnel && Array.isArray(funnel.items) ? funnel.items.slice() : [];

  let dialog = document.getElementById("wishlist-conversion-dialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "wishlist-conversion-dialog";
    dialog.innerHTML = `
      <div class="dialog-body">
        <h3>Wishlist Conversion Funnel</h3>
        <div id="wishlist-conversion-summary" class="stats-hint"></div>
        <div id="wishlist-conversion-list" class="added-history-list"></div>
      </div>
      <div class="dialog-actions">
        <button type="button" id="wishlist-conversion-close" class="btn">Close</button>
      </div>
    `;
    document.body.appendChild(dialog);

    const closeButton = dialog.querySelector("#wishlist-conversion-close");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        closeDialog(dialog);
      });
    }
  }

  const summary = dialog.querySelector("#wishlist-conversion-summary");
  const list = dialog.querySelector("#wishlist-conversion-list");
  if (!list) return;
  list.textContent = "";

  if (!items.length) {
    if (summary) summary.textContent = "No tracked wishlist conversions yet.";
    const empty = document.createElement("div");
    empty.className = "stats-hint";
    empty.textContent = "Newly obtained wishlist items will start appearing here once they are moved with Got It!.";
    list.appendChild(empty);
    openDialog(dialog);
    resetDialogScroll(dialog);
    return;
  }

  if (summary) {
    const firstWearLabel = funnel && typeof funnel.firstWearPct === "number"
      ? `${funnel.firstWearPct}% first-wear rate`
      : "No first-wear data yet";
    const gateLabel = funnel && typeof funnel.duplicateFlaggedCount === "number"
      ? `${funnel.duplicateFlaggedCount} duplicate-flagged`
      : "No buy-gate data yet";
    summary.textContent = `${items.length} tracked conversion${items.length === 1 ? "" : "s"} · ${firstWearLabel} · ${gateLabel}`;
  }

  const head = document.createElement("div");
  head.className = "added-history-item added-history-head";
  head.innerHTML = "<span>Name</span><span>Brand</span><span>Type</span><span>Risk</span><span>Obtained</span><span>Status</span>";
  list.appendChild(head);

  items.forEach((item) => {
    const rowEl = document.createElement("div");
    rowEl.className = "added-history-item";
    const obtainedLabel = item.obtainedAt ? new Date(item.obtainedAt).toLocaleDateString() : "\u2014";
    const values = [
      item.name || "Unnamed",
      item.brand || "\u2014",
      item.type || "\u2014",
      item.riskLabel || "Legacy",
      obtainedLabel,
      item.status || "\u2014",
    ];
    values.forEach((value) => {
      const cell = document.createElement("span");
      cell.textContent = value;
      rowEl.appendChild(cell);
    });
    list.appendChild(rowEl);
  });

  openDialog(dialog);
  resetDialogScroll(dialog);
};

const openFirstWearLagDialog = (items) => {
  const listItems = Array.isArray(items) ? items.slice() : [];

  let dialog = document.getElementById("first-wear-lag-dialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "first-wear-lag-dialog";
    dialog.innerHTML = `
      <div class="dialog-body">
        <h3>First-Wear Lag (All Shirts)</h3>
        <div id="first-wear-lag-summary" class="stats-hint"></div>
        <div id="first-wear-lag-list" class="wear-history-list"></div>
      </div>
      <div class="dialog-actions">
        <button type="button" id="first-wear-lag-close" class="btn">Close</button>
      </div>
    `;
    document.body.appendChild(dialog);

    const closeButton = dialog.querySelector("#first-wear-lag-close");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        closeDialog(dialog);
      });
    }
  }

  const summary = dialog.querySelector("#first-wear-lag-summary");
  const list = dialog.querySelector("#first-wear-lag-list");
  if (!list) return;
  list.textContent = "";

  if (!listItems.length) {
    if (summary) summary.textContent = "No first-wear lag data available.";
    const empty = document.createElement("div");
    empty.className = "stats-hint";
    empty.textContent = "No first-wear lag data available.";
    list.appendChild(empty);
    openDialog(dialog);
    resetDialogScroll(dialog);
    return;
  }

  if (summary) {
    summary.textContent = `${listItems.length} ${listItems.length === 1 ? "shirt" : "shirts"} with add date + first wear date`;
  }

  listItems.forEach((item, index) => {
    const rowEl = document.createElement("div");
    rowEl.className = "wear-history-item";

    const left = document.createElement("span");
    left.className = "wear-history-name";
    left.textContent = `${index + 1}. ${item.name} (${item.tab}) - ${item.type}`;

    const right = document.createElement("span");
    right.className = "wear-history-date";
    const createdLabel = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Unknown add date";
    const firstWearLabel = item.firstWearAt ? new Date(item.firstWearAt).toLocaleDateString() : "Unknown first wear";
    const lagDays = item.firstWearLagDays || 0;
    right.textContent = `${lagDays}d to first wear | added ${createdLabel} | first worn ${firstWearLabel}`;

    rowEl.appendChild(left);
    rowEl.appendChild(right);
    list.appendChild(rowEl);
  });

  openDialog(dialog);
  resetDialogScroll(dialog);
};

const openAdvancedStatsDialog = (stats) => {
  let dialog = document.getElementById("advanced-stats-dialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "advanced-stats-dialog";
    dialog.innerHTML = `
      <div class="dialog-body">
        <h3>Advanced Stats</h3>
        <div id="advanced-stats-content" class="advanced-stats-content"></div>
      </div>
      <div class="dialog-actions">
        <button type="button" id="advanced-stats-close" class="btn">Close</button>
      </div>
    `;
    document.body.appendChild(dialog);

    const closeButton = dialog.querySelector("#advanced-stats-close");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        closeDialog(dialog);
      });
    }
  }

  const content = dialog.querySelector("#advanced-stats-content");
  if (!content) return;
  content.textContent = "";
  const s = stats || {};

  const esc = (str) => String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
  const section = (title, bodyHtml) => `<div class="stats-section"><div class="stats-section-title">${esc(title)}</div>${bodyHtml}</div>`;
  const row = (label, value) => `<div class="stats-row"><span class="stats-label">${esc(label)}</span><span class="stats-value">${esc(value)}</span></div>`;
  const sub = (label, value) => `<div class="stats-row stats-sub"><span class="stats-label">${esc(label)}</span><span class="stats-value">${esc(value)}</span></div>`;
  const hint = (text) => `<div class="stats-hint">${esc(text)}</div>`;

  if (!stats || !stats.isInventory) {
    content.innerHTML = `<div class="stats-hint">Advanced stats are currently available in Inventory mode.</div>`;
    openDialog(dialog);
    resetDialogScroll(dialog);
    return;
  }

  const adv = stats.advanced || {};
  const behavior = buildBehaviorInsights(stats, buildWearNextQueue(stats, loadInsightsSnoozes()));
  const rotationModel = behavior?.rotationModel || { graceCount: 0, adjustedBacklogPct: 0, topBrandDominance: null, parkedValueSplit: { intentional: { count: 0, value: 0 }, uncertain: { count: 0, value: 0 } } };
  const workLane = buildTaggedLaneStats(s.wearableItems || [], ["workappropriate", "work appropriate"]);
  const formalLane = buildTaggedLaneStats(s.wearableItems || [], ["formal"]);
  let html = "";

  if (s.isInventory) {
    const nowMs = Date.now();
    const yearStartMs = new Date(new Date().getFullYear(), 0, 1).getTime();
    const yearlyWearEvents = (s.wearEvents || []).filter((event) => {
      const ms = new Date(event.wornAt).getTime();
      return Number.isFinite(ms) && ms >= yearStartMs && ms <= nowMs;
    });
    const uniqueWornThisYear = new Set(yearlyWearEvents.map((event) => `${event.name}||${event.tab}||${event.type || ""}`)).size;
    const parkedItems = (s.wearableItems || []).filter((item) => {
      if (!item?.lastWorn) return true;
      const ms = new Date(item.lastWorn).getTime();
      if (!Number.isFinite(ms)) return true;
      return Math.floor((nowMs - ms) / 86400000) > 365;
    });
    const parkedValue = parkedItems.reduce((sum, item) => sum + Math.max(0, Number(item?.price || 0)), 0);
    const topBrandCounts = {};
    yearlyWearEvents.forEach((event) => {
      const brand = String(event.tab || "Unknown");
      topBrandCounts[brand] = (topBrandCounts[brand] || 0) + 1;
    });
    const topBrandEntry = Object.entries(topBrandCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] || null;
    const activeBrandsThisYear = Object.keys(topBrandCounts).length;
    const activeRecentAdds = (s.allRecentlyAdded || []).filter((item) => Number(item?.wearCount || 0) > 0).length;
    const recentAddsTotal = (s.allRecentlyAdded || []).length;
    const recentActivationPct = recentAddsTotal ? Math.round((activeRecentAdds / recentAddsTotal) * 100) : 0;
    const recentUnwornCount = (s.allRecentlyAdded || []).filter((item) => Number(item?.wearCount || 0) === 0).length;
    let story = "Today’s story: your collection breadth looks healthy right now.";
    if ((s.allRecentlyAdded || []).length >= 4 && recentUnwornCount >= Math.ceil((s.allRecentlyAdded || []).length * 0.5)) {
      story = "Today’s story: new additions are outpacing first wears, so the closet is expanding faster than it is getting activated.";
    } else if (topBrandEntry && yearlyWearEvents.length) {
      const pct = Math.round((topBrandEntry[1] / yearlyWearEvents.length) * 100);
      if (pct >= 35) story = `Today’s story: recent wear is leaning heavily into ${topBrandEntry[0]}, which is carrying ${pct}% of this year’s logged wears.`;
    } else if (parkedItems.length >= Math.max(12, Math.round((s.wearableItems || []).length * 0.25))) {
      story = "Today’s story: a noticeable slice of closet value is parked long-term, so the next best move is revisiting one or two in-season deep cuts.";
    }
    html += section("Collector snapshot",
      hint(story) +
      `<div class="insights-score-grid">
         <div class="insights-score-card"><div class="insights-score-title">Total items</div><div class="insights-score-value">${s.totalItems}</div><div class="insights-score-note">Across ${s.perTab.length} ${s.perTab.length === 1 ? "brand tab" : "brand tabs"}</div></div>
         <div class="insights-score-card"><div class="insights-score-title">Worn this year</div><div class="insights-score-value">${uniqueWornThisYear}</div><div class="insights-score-note">Unique wearable items touched in ${new Date().getFullYear()}</div></div>
         <div class="insights-score-card"><div class="insights-score-title">Never worn</div><div class="insights-score-value">${s.advanced?.newItemAdoption?.neverWornSinceAddedTotal || 0}</div><div class="insights-score-note">Items still waiting for a first wear</div></div>
         <div class="insights-score-card"><div class="insights-score-title">Parked value</div><div class="insights-score-value">${formatCurrency(parkedValue)}</div><div class="insights-score-note">${parkedItems.length} wearable item${parkedItems.length === 1 ? "" : "s"} parked over 365d</div></div>
         <div class="insights-score-card"><div class="insights-score-title">Active brands</div><div class="insights-score-value">${activeBrandsThisYear}</div><div class="insights-score-note">${topBrandEntry ? `${topBrandEntry[0]} leads current wear activity.` : "No brand wear data yet."}</div></div>
         <div class="insights-score-card"><div class="insights-score-title">Fresh activation</div><div class="insights-score-value">${recentActivationPct}%</div><div class="insights-score-note">${activeRecentAdds}/${recentAddsTotal} recent additions already entered rotation.</div></div>
         <div class="insights-score-card"><div class="insights-score-title">Work-ready lane</div><div class="insights-score-value">${workLane.total} items · ${workLane.activePct}% active</div><div class="insights-score-note">Top brand: ${workLane.topBrand} · top type: ${workLane.topType}</div></div>
         <div class="insights-score-card"><div class="insights-score-title">Formal lane</div><div class="insights-score-value">${formalLane.total} items · ${formalLane.activePct}% active</div><div class="insights-score-note">Top brand: ${formalLane.topBrand} · top type: ${formalLane.topType}</div></div>
       </div>`
    );
  }

  if (adv.closetHealth) {
    const recencyWindow = Number(adv.closetHealth.recencyWindowDays || 365);
    const inactiveWindow = Number(adv.closetHealth.inactiveValueWindowDays || 365);
    const healthRead = adv.closetHealth.score >= 75 ? "Collector rotation looks strong right now." : adv.closetHealth.score >= 55 ? "Collector rotation is stable, but there is room to wake up more parked value." : "Collector rotation is getting sticky, so breadth and parked value need attention.";
    html += section("Closet health score",
      hint(`A 0-100 snapshot of collector rotation health. Higher is better, based on yearly closet reach, never-worn share, parked value, and cost-per-wear efficiency. ${healthRead}`) +
      row("Score", `${adv.closetHealth.score}/100`) +
      sub(`Worn in last ${recencyWindow} days`, `${adv.closetHealth.recencyPct}%`) +
      sub("Never worn", `${adv.closetHealth.neverWornPct}%`) +
      sub(`Value parked >${inactiveWindow}d`, `${adv.closetHealth.inactiveValuePct}%`) +
      sub("Items <= $20 CPW", `${adv.closetHealth.cpwEffPct}%`)
    );
  }

  if (Array.isArray(adv.firstWearLag) && adv.firstWearLag.length) {
    const slowest = adv.firstWearLag[0] || null;
    let body = hint(slowest ? `${slowest.name} is your slowest adopter right now at ${slowest.firstWearLagDays || 0} days to first wear.` : "Higher days means slower adoption after adding.");
    adv.firstWearLag.forEach((item, idx) => {
      const firstWearLabel = item.firstWearAt ? new Date(item.firstWearAt).toLocaleDateString() : "Unknown";
      body += sub(`${idx + 1}. ${item.name} (${item.tab}) - ${item.type}`, `${item.firstWearLagDays || 0} days | first worn ${firstWearLabel}`);
    });
    if (Array.isArray(adv.firstWearLagAll) && adv.firstWearLagAll.length > adv.firstWearLag.length) {
      body += `<button type="button" id="advanced-first-wear-lag-link" class="stats-link-button">View full first-wear lag list</button>`;
    }
    html += section("First-wear lag outliers", body);
  }

  if (adv.newItemAdoption) {
    let body = "";
    const adjustedBacklog = Math.max(0, Number(adv.newItemAdoption.neverWornSinceAddedTotal || 0) - Number(rotationModel.graceCount || 0));
    body += row("Items with add date", String(adv.newItemAdoption.itemsWithCreatedAt || 0));
    body += row("Adoption rate", `${adv.newItemAdoption.adoptionRatePct || 0}%`);
    const medianDays = adv.newItemAdoption.medianDaysToFirstWear;
    body += row("Median days to first wear", medianDays === null ? "n/a" : `${Math.round(medianDays)} days`);
    const never = Array.isArray(adv.newItemAdoption.neverWornSinceAdded) ? adv.newItemAdoption.neverWornSinceAdded : [];
    const neverTotal = Number.isFinite(adv.newItemAdoption.neverWornSinceAddedTotal)
      ? adv.newItemAdoption.neverWornSinceAddedTotal
      : never.length;
    body += row("Never worn since added", String(neverTotal));
    body += row("Grace-window unworn (<120d)", String(rotationModel.graceCount || 0));
    body += row("Adjusted backlog", `${adjustedBacklog} (${rotationModel.adjustedBacklogPct || 0}%)`);
    body += hint(adjustedBacklog <= 6 ? "Fresh adds are still mostly within grace, so backlog pressure looks controlled." : "A meaningful chunk of unworn items now sits outside the grace window, so adoption is lagging behind intake.");
    if (never.length) {
      body += `<div class="stats-section-title" style="margin-top:8px">Never worn since added (top ${never.length})</div>`;
      never.forEach((item, idx) => {
        body += sub(`${idx + 1}. ${item.name} (${item.tab}) - ${item.type}`, "Unworn");
      });
    }
    html += section("New item adoption", body);
  }

  if (Array.isArray(adv.monthlySpendVsWear) && adv.monthlySpendVsWear.length) {
    let body = "";
    const scoredMonths = adv.monthlySpendVsWear.slice(-12).map((m) => {
      const verdict = m.added >= Math.max(3, m.wears + 2)
        ? "Heavy intake"
        : m.wears >= Math.max(3, m.added * 2)
          ? "Wear-first"
          : m.spendPerWear !== null && m.spendPerWear <= 25
            ? "Efficient"
            : "Balanced";
      return { ...m, verdict };
    });
    const strongestMonth = scoredMonths.slice().sort((a, b) => a.added - b.added || b.wears - a.wears || a.label.localeCompare(b.label))[0] || null;
    const weakestMonth = scoredMonths.slice().sort((a, b) => b.added - b.wears - (a.added - a.wears) || b.spend - a.spend)[0] || null;
    body += hint(`Strongest month: ${strongestMonth ? `${strongestMonth.label} (${strongestMonth.verdict})` : "n/a"}. Heaviest intake month: ${weakestMonth ? `${weakestMonth.label} (${weakestMonth.verdict})` : "n/a"}.`);
    scoredMonths.forEach((m) => {
      const cpw = m.spendPerWear === null ? "n/a" : `${formatCurrency(m.spendPerWear)}/wear`;
      body += sub(m.label, `${m.verdict} | ${formatCurrency(m.spend)} | ${m.added} added | ${m.wears} wears | ${cpw}`);
    });
    html += section("Monthly spend vs wear value", body);
  }

  if (Array.isArray(adv.brandUtilization) && adv.brandUtilization.length) {
    let body = "";
    const strongestBrand = adv.brandUtilization.slice().sort((a, b) => b.utilizationPct - a.utilizationPct || b.totalWears - a.totalWears)[0] || null;
    const weakestBrand = adv.brandUtilization[0] || null;
    const crowdingNote = rotationModel.topBrandDominance && rotationModel.topBrandDominance.sharePct >= 35
      ? `${rotationModel.topBrandDominance.label} is over-carrying the year at ${rotationModel.topBrandDominance.sharePct}% of wears.`
      : "No brand is crowding the closet too aggressively right now.";
    body += hint(`Strongest reach: ${strongestBrand ? strongestBrand.brand : "n/a"}. Weakest reach: ${weakestBrand ? weakestBrand.brand : "n/a"}. ${crowdingNote}`);
    adv.brandUtilization.slice(0, 10).forEach((brand) => {
      const cpw = brand.avgCpw === null ? "n/a" : formatCurrency(brand.avgCpw);
      body += sub(brand.brand, `${brand.utilizationPct}% active (365d) | ${brand.inventory} items | ${brand.totalWears} wears | avg CPW ${cpw}`);
    });
    html += section("Brand rotation reach", body);
  }

  if (Array.isArray(adv.typeRotationBalance) && adv.typeRotationBalance.length) {
    let body = "";
    const mostOver = adv.typeRotationBalance.slice().sort((a, b) => b.deltaPct - a.deltaPct)[0] || null;
    const mostUnder = adv.typeRotationBalance.slice().sort((a, b) => a.deltaPct - b.deltaPct)[0] || null;
    body += hint(`Most overrepresented in wear: ${mostOver ? `${mostOver.type} (${mostOver.deltaPct >= 0 ? "+" : ""}${mostOver.deltaPct.toFixed(1)}%)` : "n/a"}. Most underused: ${mostUnder ? `${mostUnder.type} (${mostUnder.deltaPct.toFixed(1)}%)` : "n/a"}.`);
    adv.typeRotationBalance.slice(0, 10).forEach((t) => {
      const delta = `${t.deltaPct >= 0 ? "+" : ""}${t.deltaPct.toFixed(1)}%`;
      body += sub(t.type, `inventory ${t.inventoryPct.toFixed(1)}% vs wear ${t.wearPct.toFixed(1)}% (${delta})`);
    });
    html += section("Type rotation balance", body);
  }

  if (adv.inactiveCapital) {
    const body =
      hint(`Intentional parked pieces: ${rotationModel.parkedValueSplit.intentional.count}. Uncertain parked pieces: ${rotationModel.parkedValueSplit.uncertain.count}.`) +
      row("Parked >180d", `${adv.inactiveCapital.inactive180Count} items | ${formatCurrency(adv.inactiveCapital.inactive180Value)}`) +
      row("Parked >365d", `${adv.inactiveCapital.inactive365Count} items | ${formatCurrency(adv.inactiveCapital.inactive365Value)}`) +
      row("Total wearable value", formatCurrency(adv.inactiveCapital.totalWearableValue));
    html += section("Parked value", body);
  }

  if (adv.repeatWearStreaks) {
    let body = "";
    const brandStreaks = Array.isArray(adv.repeatWearStreaks.topBrandStreaks) ? adv.repeatWearStreaks.topBrandStreaks : [];
    const typeStreaks = Array.isArray(adv.repeatWearStreaks.topTypeStreaks) ? adv.repeatWearStreaks.topTypeStreaks : [];
    if (brandStreaks.length) {
      body += `<div class="stats-section-title" style="margin-top:8px">By brand</div>`;
      brandStreaks.forEach((sItem) => {
        body += sub(sItem.label, `${sItem.streak} ${sItem.streak === 1 ? "day" : "days"}`);
      });
    }
    if (typeStreaks.length) {
      body += `<div class="stats-section-title" style="margin-top:8px">By type</div>`;
      typeStreaks.forEach((sItem) => {
        body += sub(sItem.label, `${sItem.streak} ${sItem.streak === 1 ? "day" : "days"}`);
      });
    }
    html += section("Repeat-wear streaks", body || `<div class="stats-hint">No streak data yet.</div>`);
  }

  if (Array.isArray(adv.seasonalityByMonth) && adv.seasonalityByMonth.length) {
    let body = "";
    const quietMonths = adv.seasonalityByMonth.filter((m) => !m.type || !m.count).map((m) => m.month);
    body += hint(quietMonths.length ? `Missed or quiet seasonal windows: ${quietMonths.join(", ")}.` : "Every month has at least one clear wear lane logged." );
    adv.seasonalityByMonth.forEach((m) => {
      body += sub(m.month, m.type ? `${m.type} (${m.count})` : "—");
    });
    html += section("Seasonality snapshot (top type by month)", body);
  }

  if (Array.isArray(adv.tagPerformance) && adv.tagPerformance.length) {
    let body = "";
    const sleeperTag = adv.tagPerformance.slice().sort((a, b) => ((b.avgWears / Math.max(1, b.samples)) - (a.avgWears / Math.max(1, a.samples))) || a.tag.localeCompare(b.tag))[0] || null;
    const overloadedTag = adv.tagPerformance.slice().sort((a, b) => ((b.samples - b.avgWears) - (a.samples - a.avgWears)) || b.samples - a.samples)[0] || null;
    body += hint(`Sleeper tag: ${sleeperTag ? sleeperTag.tag : "n/a"}. Most overloaded tag: ${overloadedTag ? overloadedTag.tag : "n/a"}.`);
    adv.tagPerformance.forEach((tag) => {
      const cpw = tag.avgCpw === null ? "n/a" : `${formatCurrency(tag.avgCpw)}/wear`;
      body += sub(`${tag.tag} (${tag.samples})`, `${tag.avgWears.toFixed(1)} avg wears | ${cpw}`);
    });
    html += section("Tag performance", body);
  }

  if (workLane.total || formalLane.total) {
    let body = hint("Special-purpose coverage tracks how deep these tagged lanes are and how alive they still are in real wear activity.");
    if (workLane.total) {
      body += row("Work-ready lane", `${workLane.total} items | ${workLane.active365} active in 365d | ${workLane.neverWorn} never worn`);
      body += sub("Work-ready leaders", `${workLane.topBrand} brand | ${workLane.topType} type`);
    }
    if (formalLane.total) {
      body += row("Formal lane", `${formalLane.total} items | ${formalLane.active365} active in 365d | ${formalLane.neverWorn} never worn`);
      body += sub("Formal leaders", `${formalLane.topBrand} brand | ${formalLane.topType} type`);
    }
    html += section("Occasion lanes", body);
  }

  content.innerHTML = html || `<div class="stats-hint">Not enough data yet to calculate advanced stats.</div>`;

  const firstWearLagLink = content.querySelector("#advanced-first-wear-lag-link");
  if (firstWearLagLink) {
    firstWearLagLink.addEventListener("click", () => {
      openFirstWearLagDialog(adv.firstWearLagAll || adv.firstWearLag || []);
    });
  }

  openDialog(dialog);
  resetDialogScroll(dialog);
};

const localDateKeyFromDate = (dateObj) => `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;

const loadInsightsSnoozes = () => {
  let parsed = {};
  try {
    parsed = JSON.parse(localStorage.getItem(INSIGHTS_SNOOZE_KEY) || "{}");
  } catch (error) {
    parsed = {};
  }
  if (!parsed || typeof parsed !== "object") return {};
  const todayKey = localDateKeyFromDate(new Date());
  const next = {};
  Object.entries(parsed).forEach(([key, until]) => {
    const normalized = String(until || "");
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized) && normalized >= todayKey) {
      next[key] = normalized;
    }
  });
  if (Object.keys(next).length !== Object.keys(parsed).length) {
    try {
      localStorage.setItem(INSIGHTS_SNOOZE_KEY, JSON.stringify(next));
    } catch (error) {
      // ignore
    }
  }
  return next;
};

const saveInsightsSnoozes = (value) => {
  try {
    localStorage.setItem(INSIGHTS_SNOOZE_KEY, JSON.stringify(value || {}));
  } catch (error) {
    // ignore
  }
};

const getInsightsQueueKey = (item) => `${String(item.name || "").trim().toLowerCase()}||${String(item.tab || "").trim().toLowerCase()}||${String(item.type || "").trim().toLowerCase()}`;

const normalizeInsightsQueueActivity = (value) => {
  const next = (!value || typeof value !== "object" || Array.isArray(value)) ? {} : { ...value };
  if (!next.__daily || typeof next.__daily !== "object" || Array.isArray(next.__daily)) next.__daily = {};
  Object.keys(next).forEach((key) => {
    if (key === "__daily") return;
    const entry = next[key];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      delete next[key];
      return;
    }
    next[key] = {
      exposures: Number(entry.exposures || 0),
      selections: Number(entry.selections || 0),
      snoozes: Number(entry.snoozes || 0),
      softPasses: Number(entry.softPasses || 0),
      exposureDays: Number(entry.exposureDays || 0),
      selectionDays: Number(entry.selectionDays || 0),
      snoozeDays: Number(entry.snoozeDays || 0),
      softPassDays: Number(entry.softPassDays || 0),
      lastExposureDate: String(entry.lastExposureDate || ""),
      lastSelectedDate: String(entry.lastSelectedDate || ""),
      lastSnoozeDate: String(entry.lastSnoozeDate || ""),
      lastSoftPassDate: String(entry.lastSoftPassDate || ""),
    };
  });
  return next;
};

const loadInsightsQueueActivity = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(INSIGHTS_QUEUE_ACTIVITY_KEY) || "{}");
    return normalizeInsightsQueueActivity(parsed);
  } catch (error) {
    return normalizeInsightsQueueActivity({});
  }
};

const saveInsightsQueueActivity = (value) => {
  try {
    localStorage.setItem(INSIGHTS_QUEUE_ACTIVITY_KEY, JSON.stringify(normalizeInsightsQueueActivity(value || {})));
  } catch (error) {
    // ignore
  }
};

const pruneInsightsQueueDailyActivity = (activity, keepDays = 90) => {
  const next = normalizeInsightsQueueActivity(activity);
  const threshold = Date.now() - (Math.max(1, keepDays) * 86400000);
  Object.keys(next.__daily).forEach((dateKey) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      delete next.__daily[dateKey];
      return;
    }
    const ms = new Date(`${dateKey}T12:00:00`).getTime();
    if (Number.isNaN(ms) || ms < threshold) delete next.__daily[dateKey];
  });
  return next;
};

const trackInsightsQueueExposure = (queueItems, dateKey) => {
  if (!Array.isArray(queueItems) || !queueItems.length) return;
  const todayKey = localDateKeyFromDate(new Date());
  if (dateKey !== todayKey) return;
  const next = pruneInsightsQueueDailyActivity(loadInsightsQueueActivity());
  if (!next.__daily[todayKey] || typeof next.__daily[todayKey] !== "object") {
    next.__daily[todayKey] = { exposures: 0, selections: 0 };
  }
  queueItems.forEach((item) => {
    const key = String(item?.key || "");
    if (!key) return;
    if (!next[key] || typeof next[key] !== "object") {
      next[key] = { exposures: 0, selections: 0, snoozes: 0, softPasses: 0, exposureDays: 0, selectionDays: 0, snoozeDays: 0, softPassDays: 0, lastExposureDate: "", lastSelectedDate: "", lastSnoozeDate: "", lastSoftPassDate: "" };
    }
    if (next[key].lastExposureDate === todayKey) return;
    next[key].exposures = (next[key].exposures || 0) + 1;
    next[key].exposureDays = (next[key].exposureDays || 0) + 1;
    next[key].lastExposureDate = todayKey;
    next.__daily[todayKey].exposures = (next.__daily[todayKey].exposures || 0) + 1;
  });
  saveInsightsQueueActivity(next);
};

const trackInsightsQueueSelection = (queueKey, dateKey) => {
  const key = String(queueKey || "");
  if (!key) return;
  const todayKey = localDateKeyFromDate(new Date());
  if (dateKey !== todayKey) return;
  const next = pruneInsightsQueueDailyActivity(loadInsightsQueueActivity());
  if (!next.__daily[todayKey] || typeof next.__daily[todayKey] !== "object") {
    next.__daily[todayKey] = { exposures: 0, selections: 0 };
  }
  if (!next[key] || typeof next[key] !== "object") {
    next[key] = { exposures: 0, selections: 0, snoozes: 0, softPasses: 0, exposureDays: 0, selectionDays: 0, snoozeDays: 0, softPassDays: 0, lastExposureDate: "", lastSelectedDate: "", lastSnoozeDate: "", lastSoftPassDate: "" };
  }
  if (next[key].lastSelectedDate === todayKey) {
    saveInsightsQueueActivity(next);
    return;
  }
  next[key].selections = (next[key].selections || 0) + 1;
  next[key].selectionDays = (next[key].selectionDays || 0) + 1;
  next[key].lastSelectedDate = todayKey;
  next.__daily[todayKey].selections = (next.__daily[todayKey].selections || 0) + 1;
  saveInsightsQueueActivity(next);
};

const trackInsightsQueueSnooze = (queueKey, dateKey) => {
  const key = String(queueKey || "");
  if (!key) return;
  const todayKey = localDateKeyFromDate(new Date());
  if (dateKey !== todayKey) return;
  const next = pruneInsightsQueueDailyActivity(loadInsightsQueueActivity());
  if (!next.__daily[todayKey] || typeof next.__daily[todayKey] !== "object") {
    next.__daily[todayKey] = { exposures: 0, selections: 0 };
  }
  if (!next[key] || typeof next[key] !== "object") {
    next[key] = { exposures: 0, selections: 0, snoozes: 0, softPasses: 0, exposureDays: 0, selectionDays: 0, snoozeDays: 0, softPassDays: 0, lastExposureDate: "", lastSelectedDate: "", lastSnoozeDate: "", lastSoftPassDate: "" };
  }
  next[key].snoozes = (next[key].snoozes || 0) + 1;
  if (next[key].lastSnoozeDate !== todayKey) {
    next[key].snoozeDays = (next[key].snoozeDays || 0) + 1;
    next[key].lastSnoozeDate = todayKey;
  }
  saveInsightsQueueActivity(next);
};

const trackInsightsQueueSoftPass = (queueKey, dateKey) => {
  const key = String(queueKey || "");
  if (!key) return;
  const todayKey = localDateKeyFromDate(new Date());
  if (dateKey !== todayKey) return;
  const next = pruneInsightsQueueDailyActivity(loadInsightsQueueActivity());
  if (!next.__daily[todayKey] || typeof next.__daily[todayKey] !== "object") {
    next.__daily[todayKey] = { exposures: 0, selections: 0 };
  }
  if (!next[key] || typeof next[key] !== "object") {
    next[key] = { exposures: 0, selections: 0, snoozes: 0, softPasses: 0, exposureDays: 0, selectionDays: 0, snoozeDays: 0, softPassDays: 0, lastExposureDate: "", lastSelectedDate: "", lastSnoozeDate: "", lastSoftPassDate: "" };
  }
  next[key].softPasses = (next[key].softPasses || 0) + 1;
  if (next[key].lastSoftPassDate !== todayKey) {
    next[key].softPassDays = (next[key].softPassDays || 0) + 1;
    next[key].lastSoftPassDate = todayKey;
  }
  saveInsightsQueueActivity(next);
};

const defaultNoBuyGamifyState = () => ({
  xp: 0,
  level: 1,
  revision: 0,
  updatedAt: "",
  currentStreak: 0,
  longestStreak: 0,
  lastNoBuyDate: "",
  lastBuyDate: "",
  lastBuyReason: "",
  buyCredits: 0,
  cooldownUntil: "",
  totalBuysLogged: 0,
  totalRecoveriesCompleted: 0,
  noBuyDaysTotal: 0,
  lastXpDate: "",
  lastSyncDate: "",
  lastObservedStreak: 0,
  activeRecovery: null,
  buyLog: [],
  actionLog: [],
  snapshots: [],
  dailyCheckins: [],
});

const computeNoBuyLevel = (xp) => {
  const safeXp = Math.max(0, Number(xp || 0));
  return Math.floor(Math.sqrt(safeXp / 100)) + 1;
};

const normalizeNoBuyGamifyState = (value) => {
  const base = defaultNoBuyGamifyState();
  const raw = (!value || typeof value !== "object" || Array.isArray(value)) ? {} : value;
  const out = {
    ...base,
    xp: Math.max(0, Number(raw.xp || 0)),
    level: Math.max(1, Number(raw.level || 1)),
    revision: Math.max(0, Number(raw.revision || 0)),
    updatedAt: String(raw.updatedAt || ""),
    currentStreak: Math.max(0, Number(raw.currentStreak || 0)),
    longestStreak: Math.max(0, Number(raw.longestStreak || 0)),
    lastNoBuyDate: String(raw.lastNoBuyDate || ""),
    lastBuyDate: String(raw.lastBuyDate || ""),
    lastBuyReason: String(raw.lastBuyReason || ""),
    buyCredits: Math.max(0, Number(raw.buyCredits || 0)),
    cooldownUntil: String(raw.cooldownUntil || ""),
    totalBuysLogged: Math.max(0, Number(raw.totalBuysLogged || 0)),
    totalRecoveriesCompleted: Math.max(0, Number(raw.totalRecoveriesCompleted || 0)),
    noBuyDaysTotal: Math.max(0, Number(raw.noBuyDaysTotal || 0)),
    lastXpDate: String(raw.lastXpDate || ""),
    lastSyncDate: String(raw.lastSyncDate || ""),
    lastObservedStreak: Math.max(0, Number(raw.lastObservedStreak || 0)),
    activeRecovery: raw.activeRecovery && typeof raw.activeRecovery === "object" && !Array.isArray(raw.activeRecovery)
      ? {
          startedAt: String(raw.activeRecovery.startedAt || ""),
          goalType: String(raw.activeRecovery.goalType || "wear_items"),
          target: Math.max(1, Number(raw.activeRecovery.target || 3)),
          progress: Math.max(0, Number(raw.activeRecovery.progress || 0)),
          deadline: String(raw.activeRecovery.deadline || ""),
          completedAt: String(raw.activeRecovery.completedAt || ""),
        }
      : null,
    buyLog: Array.isArray(raw.buyLog)
      ? raw.buyLog
          .slice(-120)
          .map((entry) => ({
            dateKey: String(entry?.dateKey || ""),
            at: String(entry?.at || ""),
            reason: String(entry?.reason || ""),
          }))
      : [],
    actionLog: Array.isArray(raw.actionLog)
      ? raw.actionLog
          .slice(-300)
          .map((entry) => ({
            at: String(entry?.at || ""),
            type: String(entry?.type || ""),
            reason: String(entry?.reason || ""),
          }))
      : [],
    snapshots: Array.isArray(raw.snapshots)
      ? raw.snapshots
          .slice(-60)
          .map((entry) => ({
            at: String(entry?.at || ""),
            source: String(entry?.source || ""),
            xp: Math.max(0, Number(entry?.xp || 0)),
            level: Math.max(1, Number(entry?.level || 1)),
            currentStreak: Math.max(0, Number(entry?.currentStreak || 0)),
            longestStreak: Math.max(0, Number(entry?.longestStreak || 0)),
            buyCredits: Math.max(0, Number(entry?.buyCredits || 0)),
            totalBuysLogged: Math.max(0, Number(entry?.totalBuysLogged || 0)),
            totalRecoveriesCompleted: Math.max(0, Number(entry?.totalRecoveriesCompleted || 0)),
            lastBuyReason: String(entry?.lastBuyReason || ""),
            actionLogCount: Math.max(0, Number(entry?.actionLogCount || 0)),
            buyLogCount: Math.max(0, Number(entry?.buyLogCount || 0)),
          }))
      : [],
    dailyCheckins: Array.isArray(raw.dailyCheckins)
      ? raw.dailyCheckins
          .slice(-120)
          .map((entry) => ({
            dateKey: String(entry?.dateKey || ""),
            tempted: Boolean(entry?.tempted),
            trigger: String(entry?.trigger || ""),
          }))
      : [],
  };
  out.level = computeNoBuyLevel(out.xp);
  if (!out.updatedAt) {
    out.updatedAt = String(out.lastSyncDate || out.lastXpDate || out.lastBuyDate || "");
  }
  const purchaseEventsFromActionLog = Array.isArray(out.actionLog)
    ? out.actionLog.filter((entry) => String(entry?.type || "") === "purchase").length
    : 0;
  const purchaseEventsFromBuyLog = Array.isArray(out.buyLog) ? out.buyLog.length : 0;
  out.totalBuysLogged = Math.max(
    0,
    Number(out.totalBuysLogged || 0),
    purchaseEventsFromActionLog,
    purchaseEventsFromBuyLog
  );

  const purchaseCandidates = [];
  const actionPurchaseCandidates = [];
  if (Array.isArray(out.actionLog)) {
    out.actionLog.forEach((entry, idx) => {
      if (String(entry?.type || "") !== "purchase") return;
      const at = String(entry?.at || "");
      const ms = new Date(at).getTime();
      if (!Number.isFinite(ms)) return;
      actionPurchaseCandidates.push({
        ms,
        order: idx,
        dateKey: localDateKeyFromDate(new Date(ms)),
        reason: String(entry?.reason || ""),
      });
    });
  }

  // Prefer actionLog for authoritative latest purchase reason; fallback to buyLog for legacy snapshots.
  if (actionPurchaseCandidates.length) {
    purchaseCandidates.push(...actionPurchaseCandidates);
  } else if (Array.isArray(out.buyLog)) {
    out.buyLog.forEach((entry, idx) => {
      const atRaw = String(entry?.at || "");
      const dateKey = String(entry?.dateKey || "");
      let ms = new Date(atRaw).getTime();
      if (!Number.isFinite(ms) && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        ms = new Date(`${dateKey}T12:00:00`).getTime();
      }
      if (!Number.isFinite(ms)) return;
      purchaseCandidates.push({
        ms,
        order: idx,
        dateKey: /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? dateKey : localDateKeyFromDate(new Date(ms)),
        reason: String(entry?.reason || ""),
      });
    });
  }
  if (purchaseCandidates.length) {
    purchaseCandidates.sort((a, b) => a.ms - b.ms || a.order - b.order);
    const latest = purchaseCandidates[purchaseCandidates.length - 1];
    out.lastBuyDate = String(latest.dateKey || out.lastBuyDate || "");
    out.lastBuyReason = String(latest.reason || out.lastBuyReason || "");
  }

  if (out.currentStreak > out.longestStreak) out.longestStreak = out.currentStreak;
  return out;
};

const markNoBuyStateUpdated = (state) => {
  const safe = normalizeNoBuyGamifyState(state || {});
  safe.revision = Math.max(0, Number(safe.revision || 0)) + 1;
  safe.updatedAt = new Date().toISOString();
  return safe;
};

const mergeNoBuyGamifyState = (localValue, remoteValue) => {
  const local = normalizeNoBuyGamifyState(localValue || {});
  const remote = normalizeNoBuyGamifyState(remoteValue || {});

  const toMs = (value) => {
    const str = String(value || "");
    if (!str) return NaN;
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return new Date(`${str}T12:00:00`).getTime();
    return new Date(str).getTime();
  };

  const compareByFreshness = (a, b) => {
    if (a.revision !== b.revision) return a.revision - b.revision;
    const aMs = toMs(a.updatedAt || a.lastSyncDate || a.lastXpDate || a.lastBuyDate);
    const bMs = toMs(b.updatedAt || b.lastSyncDate || b.lastXpDate || b.lastBuyDate);
    if (Number.isFinite(aMs) && Number.isFinite(bMs) && aMs !== bMs) return aMs - bMs;
    if (Number.isFinite(aMs) && !Number.isFinite(bMs)) return 1;
    if (!Number.isFinite(aMs) && Number.isFinite(bMs)) return -1;
    return 0;
  };
  const primary = compareByFreshness(remote, local) >= 0 ? remote : local;
  const secondary = primary === remote ? local : remote;

  const merged = normalizeNoBuyGamifyState(primary);
  merged.xp = Math.max(local.xp, remote.xp);
  merged.level = computeNoBuyLevel(merged.xp);
  merged.longestStreak = Math.max(local.longestStreak, remote.longestStreak, merged.currentStreak);
  merged.noBuyDaysTotal = Math.max(local.noBuyDaysTotal, remote.noBuyDaysTotal);
  merged.totalBuysLogged = Math.max(local.totalBuysLogged, remote.totalBuysLogged);
  merged.totalRecoveriesCompleted = Math.max(local.totalRecoveriesCompleted, remote.totalRecoveriesCompleted);

  // Authoritative logs come from the freshest side so deletions propagate.
  merged.actionLog = Array.isArray(primary.actionLog) ? primary.actionLog.slice(-300) : [];
  merged.buyLog = Array.isArray(primary.buyLog) ? primary.buyLog.slice(-120) : [];
  merged.dailyCheckins = Array.isArray(primary.dailyCheckins) ? primary.dailyCheckins.slice(-120) : [];
  merged.snapshots = Array.isArray(primary.snapshots) ? primary.snapshots.slice(-60) : [];

  if (secondary.activeRecovery && !secondary.activeRecovery.completedAt && (!merged.activeRecovery || merged.activeRecovery.completedAt)) {
    merged.activeRecovery = { ...secondary.activeRecovery };
  }
  return normalizeNoBuyGamifyState(merged);
};

const pushNoBuySnapshot = (state, source = "") => {
  const safe = normalizeNoBuyGamifyState(state);
  const entry = {
    at: new Date().toISOString(),
    source: String(source || "manual"),
    xp: safe.xp,
    level: safe.level,
    currentStreak: safe.currentStreak,
    longestStreak: safe.longestStreak,
    buyCredits: safe.buyCredits,
    totalBuysLogged: safe.totalBuysLogged,
    totalRecoveriesCompleted: safe.totalRecoveriesCompleted,
    lastBuyReason: safe.lastBuyReason,
    actionLogCount: Array.isArray(safe.actionLog) ? safe.actionLog.length : 0,
    buyLogCount: Array.isArray(safe.buyLog) ? safe.buyLog.length : 0,
  };
  safe.snapshots.push(entry);
  safe.snapshots = safe.snapshots.slice(-60);
  return safe;
};

const loadNoBuyGamifyState = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(NO_BUY_GAMIFY_KEY) || "{}");
    return normalizeNoBuyGamifyState(parsed);
  } catch (error) {
    return normalizeNoBuyGamifyState({});
  }
};

const saveNoBuyGamifyState = (state) => {
  try {
    localStorage.setItem(NO_BUY_GAMIFY_KEY, JSON.stringify(normalizeNoBuyGamifyState(state)));
  } catch (error) {
    // ignore
  }
};

const getNoBuyMilestones = () => [7, 14, 30, 60, 90];

const noBuyReasonLabel = (value) => {
  const key = String(value || "").trim().toLowerCase();
  const map = {
    sale: "Sale",
    gooddeal: "Good deal",
    rarefind: "Rare find",
    fomo: "FOMO",
    boredom: "Boredom",
    drop: "New drop",
    gotpaid: "Got paid/Extra money",
    marketed: "Marketed",
    promo: "Promo/Sale",
    other: "Other",
  };
  if (map[key]) return map[key];
  if (!key) return "Other";
  return key.replace(/[-_]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
};

const noBuyReasonGroup = (value) => {
  const key = String(value || "").trim().toLowerCase();
  if (["boredom", "fomo", "drop"].includes(key)) return "impulse";
  if (["sale", "gooddeal", "rarefind", "gotpaid", "marketed", "promo"].includes(key)) return "planned";
  return "other";
};

const getNoBuyReasonGroupLabel = (group) => {
  if (group === "impulse") return "Impulse pressure";
  if (group === "planned") return "Planned pressure";
  return "Other pressure";
};

const getNoBuyNextMilestone = (streak) => {
  const safeStreak = Math.max(0, Number(streak || 0));
  const next = getNoBuyMilestones().find((day) => day > safeStreak);
  return next || null;
};

const getNoBuyTriggerSummary = (state, lookbackDays = 30) => {
  const safe = normalizeNoBuyGamifyState(state);
  const threshold = Date.now() - (Math.max(1, Number(lookbackDays) || 1) * 86400000);
  const counts = {};
  safe.dailyCheckins.forEach((entry) => {
    if (!entry?.tempted) return;
    const key = String(entry.dateKey || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
    const ms = new Date(`${key}T12:00:00`).getTime();
    if (!Number.isFinite(ms) || ms < threshold) return;
    const trigger = String(entry.trigger || "other").trim() || "other";
    counts[trigger] = (counts[trigger] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
};

const getNoBuyTrendSummary = (state, lookbackDays = 30) => {
  const safe = normalizeNoBuyGamifyState(state);
  const nowMs = Date.now();
  const windowDays = Math.max(1, Number(lookbackDays) || 1);
  const threshold = nowMs - (windowDays * 86400000);
  const compareWindowDays = Math.min(7, windowDays);
  const recentThreshold = nowMs - (compareWindowDays * 86400000);
  const priorThreshold = recentThreshold - (compareWindowDays * 86400000);
  const counts = {};
  const recentCounts = {};
  const priorCounts = {};
  const bump = (map, key) => {
    map[key] = (map[key] || 0) + 1;
  };
  const track = (label, ms) => {
    bump(counts, label);
    if (ms >= recentThreshold) bump(recentCounts, label);
    else if (ms >= priorThreshold) bump(priorCounts, label);
  };

  safe.dailyCheckins.forEach((entry) => {
    if (!entry?.tempted) return;
    const key = String(entry.dateKey || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
    const ms = new Date(`${key}T12:00:00`).getTime();
    if (!Number.isFinite(ms) || ms < threshold) return;
    const trigger = String(entry.trigger || "other").trim() || "other";
    const label = `Temptation: ${noBuyReasonLabel(trigger)}`;
    track(label, ms);
  });

  const purchaseActions = Array.isArray(safe.actionLog)
    ? safe.actionLog.filter((entry) => String(entry?.type || "") === "purchase")
    : [];

  if (purchaseActions.length) {
    purchaseActions.forEach((entry) => {
      const ms = new Date(String(entry?.at || "")).getTime();
      if (!Number.isFinite(ms) || ms < threshold) return;
      const reason = String(entry?.reason || "other").trim() || "other";
      const label = `Purchase: ${noBuyReasonLabel(reason)}`;
      track(label, ms);
    });
  } else {
    // Fallback for older state snapshots that predate actionLog purchases.
    safe.buyLog.forEach((entry) => {
      const atMs = new Date(String(entry?.at || "")).getTime();
      const key = String(entry?.dateKey || "");
      const dateMs = /^\d{4}-\d{2}-\d{2}$/.test(key) ? new Date(`${key}T12:00:00`).getTime() : NaN;
      const ms = Number.isFinite(atMs) ? atMs : dateMs;
      if (!Number.isFinite(ms) || ms < threshold) return;
      const reason = String(entry?.reason || "other").trim() || "other";
      const label = `Purchase: ${noBuyReasonLabel(reason)}`;
      track(label, ms);
    });
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => {
      const recent = Number(recentCounts[label] || 0);
      const prior = Number(priorCounts[label] || 0);
      const direction = recent > prior ? "rising" : recent < prior ? "cooling" : "steady";
      return { label, count, recent, prior, direction };
    });
};

const getNoBuyPressureSummary = (state, lookbackDays = 30) => {
  const safe = normalizeNoBuyGamifyState(state);
  const threshold = Date.now() - (Math.max(1, Number(lookbackDays) || 1) * 86400000);
  const groups = {
    impulse: { count: 0, reasons: {} },
    planned: { count: 0, reasons: {} },
    other: { count: 0, reasons: {} },
  };
  safe.dailyCheckins.forEach((entry) => {
    if (!entry?.tempted) return;
    const key = String(entry.dateKey || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
    const ms = new Date(`${key}T12:00:00`).getTime();
    if (!Number.isFinite(ms) || ms < threshold) return;
    const reason = String(entry.trigger || "other").trim() || "other";
    const group = noBuyReasonGroup(reason);
    groups[group].count += 1;
    groups[group].reasons[reason] = (groups[group].reasons[reason] || 0) + 1;
  });
  Object.values(groups).forEach((group) => {
    const top = Object.entries(group.reasons).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] || null;
    group.topReason = top ? noBuyReasonLabel(top[0]) : "none";
  });
  return groups;
};

const createNoBuyRecoveryMission = (state, nowIso) => {
  const safe = normalizeNoBuyGamifyState(state);
  if (safe.activeRecovery && !safe.activeRecovery.completedAt) return safe;
  const start = Number.isFinite(new Date(nowIso).getTime()) ? new Date(nowIso) : new Date();
  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() + 7);
  safe.activeRecovery = {
    startedAt: start.toISOString(),
    goalType: "wear_idle_items",
    target: 3,
    progress: 0,
    deadline: deadline.toISOString(),
    completedAt: "",
  };
  return safe;
};

const isNoBuyCooldownActive = (state) => {
  const safe = normalizeNoBuyGamifyState(state);
  if (!safe.cooldownUntil) return false;
  const ms = new Date(safe.cooldownUntil).getTime();
  return Number.isFinite(ms) && ms > Date.now();
};

const startNoBuyCooldown = (state, hours = 24) => {
  const safe = normalizeNoBuyGamifyState(state);
  if (isNoBuyCooldownActive(safe)) return safe;
  const nowIso = new Date().toISOString();
  const until = new Date();
  until.setHours(until.getHours() + Math.max(1, Number(hours) || 24));
  safe.cooldownUntil = until.toISOString();
  safe.actionLog.push({ at: nowIso, type: "cooldown", reason: `${Math.max(1, Number(hours) || 24)}h` });
  safe.actionLog = safe.actionLog.slice(-300);
  return markNoBuyStateUpdated(safe);
};

const logNoBuyBuyEvent = (state, reason = "") => {
  const safe = normalizeNoBuyGamifyState(state);
  const todayKey = localDateKeyFromDate(new Date());
  const cleanReason = String(reason || "other").trim() || "other";
  const nowIso = new Date().toISOString();
  safe.totalBuysLogged += 1;
  safe.lastBuyDate = todayKey;
  safe.lastBuyReason = cleanReason;
  safe.buyLog.push({ dateKey: todayKey, at: nowIso, reason: cleanReason });
  safe.buyLog = safe.buyLog.slice(-120);
  safe.actionLog.push({ at: nowIso, type: "purchase", reason: cleanReason });
  safe.actionLog = safe.actionLog.slice(-300);
  safe.currentStreak = 0;
  safe.lastObservedStreak = 0;
  safe.cooldownUntil = "";
  if (safe.buyCredits > 0) safe.buyCredits -= 1;
  const withRecovery = createNoBuyRecoveryMission(safe, new Date().toISOString());
  const touched = markNoBuyStateUpdated(withRecovery);
  return pushNoBuySnapshot(touched, "buy");
};

const recordNoBuyCheckin = (state, tempted, trigger = "") => {
  const safe = normalizeNoBuyGamifyState(state);
  const todayKey = localDateKeyFromDate(new Date());
  const nextTrigger = tempted ? (String(trigger || "other").trim() || "other") : "";
  const nowIso = new Date().toISOString();
  const existing = safe.dailyCheckins.find((entry) => entry.dateKey === todayKey);
  if (existing) {
    existing.tempted = Boolean(tempted);
    existing.trigger = nextTrigger;
  } else {
    safe.dailyCheckins.push({ dateKey: todayKey, tempted: Boolean(tempted), trigger: nextTrigger });
    safe.dailyCheckins = safe.dailyCheckins.slice(-120);
  }
  if (tempted) {
    safe.actionLog.push({ at: nowIso, type: "temptation", reason: nextTrigger || "other" });
    safe.actionLog = safe.actionLog.slice(-300);
    return pushNoBuySnapshot(markNoBuyStateUpdated(safe), "tempted");
  }
  return pushNoBuySnapshot(markNoBuyStateUpdated(safe), "clear-temptation");
};

const syncNoBuyGamifyStateFromStats = (stats) => {
  const safeStats = stats || {};
  const safe = loadNoBuyGamifyState();
  const todayKey = localDateKeyFromDate(new Date());
  const currentStreak = Math.max(0, Number(safeStats.noBuyCurrentDays || 0));
  if (safe.lastXpDate !== todayKey && currentStreak > 0) {
    let xpGain = 10;
    if (currentStreak >= 7) xpGain += 5;
    if (currentStreak >= 14) xpGain += 10;
    if (currentStreak >= 30) xpGain += 20;
    if (currentStreak >= 60) xpGain += 20;
    safe.xp += xpGain;
    safe.noBuyDaysTotal += 1;
    safe.lastXpDate = todayKey;
    safe.lastNoBuyDate = todayKey;
    if (safe.noBuyDaysTotal > 0 && safe.noBuyDaysTotal % 10 === 0) safe.buyCredits += 1;
  }
  // Manual-only buy logging: do NOT auto-log buys from streak drops.
  // Users can add gifted/traded shirts without triggering buy events.
  safe.currentStreak = currentStreak;
  if (currentStreak > safe.longestStreak) safe.longestStreak = currentStreak;
  safe.lastObservedStreak = currentStreak;
  safe.level = computeNoBuyLevel(safe.xp);
  safe.lastSyncDate = todayKey;
  saveNoBuyGamifyState(safe);
  return safe;
};

const exportNoBuyLogJson = (state) => {
  const safe = normalizeNoBuyGamifyState(state || {});
  const payload = {
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    noBuy: {
      xp: safe.xp,
      level: safe.level,
      currentStreak: safe.currentStreak,
      longestStreak: safe.longestStreak,
      buyCredits: safe.buyCredits,
      totalBuysLogged: safe.totalBuysLogged,
      totalRecoveriesCompleted: safe.totalRecoveriesCompleted,
      lastBuyDate: safe.lastBuyDate,
      lastBuyReason: safe.lastBuyReason,
      actionLog: safe.actionLog,
      buyLog: safe.buyLog,
      dailyCheckins: safe.dailyCheckins,
      snapshots: safe.snapshots,
    },
  };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const stamp = localDateKeyFromDate(new Date());
  anchor.href = href;
  anchor.download = `no-buy-log-${stamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(href), 0);
};

const buildNoBuyActionEntries = (state, limit = 10) => {
  const safe = normalizeNoBuyGamifyState(state || {});
  const fromActionLog = Array.isArray(safe.actionLog)
    ? safe.actionLog
        .filter((entry) => entry && typeof entry === "object")
        .map((entry, idx) => ({
          at: String(entry.at || ""),
          type: String(entry.type || ""),
          reason: String(entry.reason || "other"),
          source: "actionLog",
          sourceIndex: idx,
        }))
    : [];
  const sortedActionLog = fromActionLog
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  if (sortedActionLog.length) {
    return Number.isFinite(limit) ? sortedActionLog.slice(0, limit) : sortedActionLog;
  }

  const fallback = [];
  if (Array.isArray(safe.buyLog)) {
    safe.buyLog.forEach((entry) => {
      const dateKey = String(entry?.dateKey || "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return;
      fallback.push({
        at: `${dateKey}T12:00:00`,
        type: "purchase",
        reason: String(entry?.reason || "other"),
        source: "buyLog",
        dateKey,
      });
    });
  }
  if (Array.isArray(safe.dailyCheckins)) {
    safe.dailyCheckins.forEach((entry) => {
      if (!entry?.tempted) return;
      const dateKey = String(entry?.dateKey || "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return;
      fallback.push({
        at: `${dateKey}T12:00:00`,
        type: "temptation",
        reason: String(entry?.trigger || "other"),
        source: "dailyCheckins",
        dateKey,
      });
    });
  }
  const sortedFallback = fallback
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return Number.isFinite(limit) ? sortedFallback.slice(0, limit) : sortedFallback;
};

const openNoBuyHistoryWindow = (entries) => {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const esc = (str) => String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
  const rows = safeEntries.length
    ? safeEntries.map((entry, idx) => {
        const whenMs = new Date(entry.at).getTime();
        const whenLabel = Number.isFinite(whenMs) ? new Date(whenMs).toLocaleString() : "Unknown date";
        const typeLabel = entry.type === "purchase"
          ? "Buy logged"
          : entry.type === "cooldown"
            ? "Cooldown started"
            : "Temptation logged";
        return `<tr><td>${idx + 1}</td><td>${esc(typeLabel)}</td><td>${esc(whenLabel)}</td><td>${esc(noBuyReasonLabel(entry.reason || "other"))}</td></tr>`;
      }).join("")
    : `<tr><td colspan="4">No no-buy history logged yet.</td></tr>`;
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>No-Buy Full History</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #111; background: #fff; }
    h1 { margin: 0 0 8px; font-size: 1.4rem; }
    p { margin: 0 0 16px; color: #555; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #d7d7d7; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; }
    tbody tr:nth-child(even) { background: #fafafa; }
  </style>
</head>
<body>
  <h1>No-Buy Full History</h1>
  <p>${esc(`${safeEntries.length} logged action${safeEntries.length === 1 ? "" : "s"} sorted newest first.`)}</p>
  <table>
    <thead>
      <tr><th>#</th><th>Action</th><th>When</th><th>Reason</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

  const historyWindow = window.open("", "_blank");
  if (!historyWindow) return false;
  historyWindow.document.open();
  historyWindow.document.write(html);
  historyWindow.document.close();
  return true;
};

const deleteNoBuyLogEntry = (state, descriptor = {}) => {
  const safe = normalizeNoBuyGamifyState(state || {});
  const source = String(descriptor.source || "");
  const type = String(descriptor.type || "");
  const reason = String(descriptor.reason || "");
  const at = String(descriptor.at || "");
  const dateKey = String(descriptor.dateKey || "");
  const index = Number(descriptor.index);

  if (source === "actionLog" && Number.isInteger(index) && index >= 0 && index < safe.actionLog.length) {
    safe.actionLog.splice(index, 1);
  }

  const targetDateKey = /^\d{4}-\d{2}-\d{2}$/.test(dateKey)
    ? dateKey
    : (() => {
        if (!at) return "";
        const ms = new Date(at).getTime();
        if (!Number.isFinite(ms)) return "";
        return localDateKeyFromDate(new Date(ms));
      })();

  if (type === "purchase") {
    let removed = false;
    const exactAt = String(at || "");
    safe.buyLog = safe.buyLog.filter((entry) => {
      if (removed) return true;
      if (exactAt && String(entry?.at || "") !== exactAt) return true;
      if (String(entry?.dateKey || "") !== targetDateKey) return true;
      if (String(entry?.reason || "") !== reason) return true;
      removed = true;
      return false;
    });
    if (removed && safe.totalBuysLogged > 0) safe.totalBuysLogged -= 1;

    const latestBuy = safe.buyLog
      .slice()
      .sort((a, b) => {
        const aMs = new Date(String(a.at || `${a.dateKey || ""}T12:00:00`)).getTime();
        const bMs = new Date(String(b.at || `${b.dateKey || ""}T12:00:00`)).getTime();
        return aMs - bMs;
      })
      .slice(-1)[0] || null;
    safe.lastBuyDate = latestBuy ? String(latestBuy.dateKey || "") : "";
    safe.lastBuyReason = latestBuy ? String(latestBuy.reason || "") : "";
  }

  if (type === "temptation") {
    safe.dailyCheckins = safe.dailyCheckins.map((entry) => {
      if (String(entry?.dateKey || "") !== targetDateKey) return entry;
      if (!entry?.tempted) return entry;
      if (String(entry?.trigger || "") !== reason) return entry;
      return { dateKey: String(entry.dateKey || ""), tempted: false, trigger: "" };
    });
  }

  return pushNoBuySnapshot(markNoBuyStateUpdated(safe), "delete-log");
};

const progressNoBuyRecoveryOnWear = () => {
  const safe = loadNoBuyGamifyState();
  if (!safe.activeRecovery || safe.activeRecovery.completedAt) return;
  const deadlineMs = new Date(safe.activeRecovery.deadline).getTime();
  if (Number.isFinite(deadlineMs) && deadlineMs < Date.now()) {
    saveNoBuyGamifyState(safe);
    return;
  }
  safe.activeRecovery.progress = Math.min(safe.activeRecovery.target, (safe.activeRecovery.progress || 0) + 1);
  if (safe.activeRecovery.progress >= safe.activeRecovery.target) {
    safe.activeRecovery.completedAt = new Date().toISOString();
    safe.totalRecoveriesCompleted += 1;
    safe.xp += 50;
    safe.level = computeNoBuyLevel(safe.xp);
  }
  saveNoBuyGamifyState(markNoBuyStateUpdated(safe));
};

const safePercent = (numerator, denominator) => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
};

const toDateMsFromWearEvent = (event) => {
  const direct = new Date(event?.wornAt).getTime();
  if (!Number.isNaN(direct)) return direct;
  const key = String(event?.dateKey || "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    const fromKey = new Date(`${key}T12:00:00`).getTime();
    if (!Number.isNaN(fromKey)) return fromKey;
  }
  return null;
};

const toWeekStartKey = (ms) => {
  if (!Number.isFinite(ms)) return "";
  const d = new Date(ms);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return localDateKeyFromDate(d);
};

const normalizeCounts = (counts) => {
  const entries = Object.entries(counts || {});
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  if (!total) return {};
  const out = {};
  entries.forEach(([label, count]) => {
    out[label] = count / total;
  });
  return out;
};

const distributionDrift = (aCounts, bCounts) => {
  const a = normalizeCounts(aCounts);
  const b = normalizeCounts(bCounts);
  const labels = new Set([...Object.keys(a), ...Object.keys(b)]);
  if (!labels.size) return 0;
  let sumAbs = 0;
  labels.forEach((label) => {
    sumAbs += Math.abs((a[label] || 0) - (b[label] || 0));
  });
  return Math.min(1, sumAbs / 2);
};

const topCounts = (counts, limit) => Object.entries(counts || {})
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .slice(0, limit)
  .map(([label, count]) => ({ label, count }));

const medianOf = (values) => {
  if (!Array.isArray(values) || !values.length) return null;
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
};

const buildBehaviorInsights = (stats, queue = []) => {
  const nowMs = Date.now();
  const dayMs = 86400000;
  const monthNow = new Date(nowMs).getMonth();
  const wearEvents = Array.isArray(stats?.wearEvents) ? stats.wearEvents : [];
  const wearableItems = Array.isArray(stats?.wearableItems) ? stats.wearableItems : [];
  const itemLookup = {};
  wearableItems.forEach((item) => {
    const key = getInsightsQueueKey(item);
    if (!itemLookup[key]) itemLookup[key] = item;
  });

  const recentEvents = wearEvents
    .map((event) => ({ ...event, wornMs: toDateMsFromWearEvent(event) }))
    .filter((event) => Number.isFinite(event.wornMs));

  const normalizeTagKey = (tag) => String(tag || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const hasTag = (item, tagKey) => {
    const tags = Array.isArray(item?.tags) ? item.tags : [];
    return tags.some((tag) => normalizeTagKey(tag) === tagKey);
  };
  const hasAnyTag = (item, keys) => {
    const tags = Array.isArray(item?.tags) ? item.tags : [];
    const set = new Set(tags.map(normalizeTagKey));
    return keys.some((key) => set.has(key));
  };
  const isWhaleTagged = (item) => hasTag(item, "whale");
  const isProtectedTagged = (item) => hasAnyTag(item, ["whale", "sentimental", "archive"]);

  const holidayTagKeys = ["holiday", "christmas", "xmas", "halloween", "hanukkah", "valentine", "valentines", "stpatricks", "july4", "july4th", "usa", "thanksgiving", "easter", "mardigras", "mardi", "margigras", "diadelosmuertos", "dayofthedead", "cincodemayo", "cinco"];
  const holidayMonths = new Set([1, 2, 3, 4, 6, 9, 10, 11]);
  const isOutOfWindowHoliday = (item) => hasAnyTag(item, holidayTagKeys) && !holidayMonths.has(monthNow);
  const isSeasonalExempt = (item) => {
    const typeText = `${String(item?.type || "")} ${String(item?.name || "")}`.toLowerCase();
    const flannelOffSeason = monthNow >= 5 && monthNow <= 7 && isFlannelLikeText(typeText);
    return isOutOfWindowHoliday(item) || flannelOffSeason;
  };

  const annualWindowMs = nowMs - (365 * dayMs);
  const twoYearWindowMs = nowMs - (730 * dayMs);
  const covered365Count = wearableItems.filter((item) => {
    const ms = item?.lastWorn ? new Date(item.lastWorn).getTime() : NaN;
    return Number.isFinite(ms) && ms >= annualWindowMs;
  }).length;
  const covered730Count = wearableItems.filter((item) => {
    const ms = item?.lastWorn ? new Date(item.lastWorn).getTime() : NaN;
    return Number.isFinite(ms) && ms >= twoYearWindowMs && ms < annualWindowMs;
  }).length;
  const dormantCount = Math.max(0, wearableItems.length - covered365Count - covered730Count);
  const annualCoveragePct = safePercent(covered365Count, wearableItems.length);

  const backlogEligible = wearableItems.filter((item) => {
    if (isProtectedTagged(item)) return false;
    if (isSeasonalExempt(item)) return false;
    if (!item?.createdAt) return false;
    const createdMs = new Date(item.createdAt).getTime();
    return Number.isFinite(createdMs) && createdMs <= (nowMs - (120 * dayMs));
  });
  const neverWornEligible = backlogEligible.filter((item) => Number(item?.wearCount || 0) <= 0);
  const adjustedBacklogPct = safePercent(neverWornEligible.length, backlogEligible.length);
  const graceCount = wearableItems.filter((item) => {
    if (!item?.createdAt) return false;
    const createdMs = new Date(item.createdAt).getTime();
    return Number.isFinite(createdMs) && createdMs > (nowMs - (120 * dayMs));
  }).length;
  const seasonalExemptCount = wearableItems.filter((item) => isSeasonalExempt(item)).length;
  const recent90UniqueTouches = new Set(recentEvents
    .filter((event) => event.wornMs >= (nowMs - (90 * dayMs)) && event.wornMs <= nowMs)
    .map((event) => getInsightsQueueKey({ name: event.name, tab: event.tab, type: event.type }))).size;
  const actualTouchesPerMonth = Math.max(1, Math.round((recent90UniqueTouches / 3) * 10) / 10);
  const expectedTouchesPerMonth = Math.max(6, Math.min(24, Math.round(Math.max(actualTouchesPerMonth, covered365Count / 12 || 0, wearableItems.length * 0.04))));

  const coverageScore = Math.max(0, Math.min(100, Math.round(((annualCoveragePct - 35) / 40) * 100)));
  const tierATargetMid = 58;
  const tierBTargetMid = 30;
  const tierCTargetMid = 12;
  const tierAPct = safePercent(covered365Count, wearableItems.length);
  const tierBPct = safePercent(covered730Count, wearableItems.length);
  const tierCPct = safePercent(dormantCount, wearableItems.length);
  const tierPenalty = Math.abs(tierAPct - tierATargetMid) + Math.abs(tierBPct - tierBTargetMid) + Math.abs(tierCPct - tierCTargetMid);
  const tierBalanceScore = Math.max(0, Math.min(100, 100 - Math.round(tierPenalty * 0.9)));
  const recent365BrandCounts = {};
  recentEvents.forEach((event) => {
    if (!Number.isFinite(event.wornMs) || event.wornMs < annualWindowMs || event.wornMs > nowMs) return;
    const brand = String(event.tab || "Unknown").trim() || "Unknown";
    recent365BrandCounts[brand] = (recent365BrandCounts[brand] || 0) + 1;
  });
  const topBrandDominanceEntry = Object.entries(recent365BrandCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] || null;
  const topBrandDominance = topBrandDominanceEntry
    ? {
      label: topBrandDominanceEntry[0],
      count: topBrandDominanceEntry[1],
      sharePct: safePercent(topBrandDominanceEntry[1], recentEvents.filter((event) => Number.isFinite(event.wornMs) && event.wornMs >= annualWindowMs && event.wornMs <= nowMs).length),
    }
    : null;
  const parkedIntentional = { count: 0, value: 0 };
  const parkedUncertain = { count: 0, value: 0 };
  wearableItems.forEach((item) => {
    const lastWornMs = item?.lastWorn ? new Date(item.lastWorn).getTime() : NaN;
    const daysSince = Number.isNaN(lastWornMs) ? Infinity : Math.max(0, Math.floor((nowMs - lastWornMs) / dayMs));
    if (daysSince < 365) return;
    const value = Number(item?.price || 0);
    if (isProtectedTagged(item) || isSeasonalExempt(item)) {
      parkedIntentional.count += 1;
      if (value > 0) parkedIntentional.value += value;
      return;
    }
    parkedUncertain.count += 1;
    if (value > 0) parkedUncertain.value += value;
  });

  const weekly = {};
  recentEvents.forEach((event) => {
    const ageDays = Math.floor((nowMs - event.wornMs) / dayMs);
    if (!Number.isFinite(ageDays) || ageDays < 0 || ageDays > 7 * 12) return;
    const weekKey = toWeekStartKey(event.wornMs);
    if (!weekKey) return;
    if (!weekly[weekKey]) weekly[weekKey] = { typeCounts: {}, total: 0 };
    const type = String(event.type || "Unknown").trim() || "Unknown";
    weekly[weekKey].typeCounts[type] = (weekly[weekKey].typeCounts[type] || 0) + 1;
    weekly[weekKey].total += 1;
  });
  const weeklyKeys = Object.keys(weekly).sort();
  const weeklyDrifts = [];
  for (let i = 1; i < weeklyKeys.length; i += 1) {
    const prev = weekly[weeklyKeys[i - 1]].typeCounts;
    const next = weekly[weeklyKeys[i]].typeCounts;
    weeklyDrifts.push(Math.round(distributionDrift(prev, next) * 100));
  }
  const volatilityScore = weeklyDrifts.length
    ? Math.round(weeklyDrifts.reduce((sum, value) => sum + value, 0) / weeklyDrifts.length)
    : 0;
  const volatilityLabel = volatilityScore < 18 ? "Stable" : volatilityScore < 36 ? "Shifting" : "Volatile";

  const split = {
    weekday: { brandCounts: {}, typeCounts: {}, tagCounts: {}, total: 0 },
    weekend: { brandCounts: {}, typeCounts: {}, tagCounts: {}, total: 0 },
  };
  recentEvents.forEach((event) => {
    const ageDays = Math.floor((nowMs - event.wornMs) / dayMs);
    if (!Number.isFinite(ageDays) || ageDays < 0 || ageDays > 120) return;
    const day = new Date(event.wornMs).getDay();
    const bucket = day === 5 || day === 6 || day === 0 ? split.weekend : split.weekday;
    const brand = String(event.tab || "Unknown").trim() || "Unknown";
    const type = String(event.type || "Unknown").trim() || "Unknown";
    bucket.brandCounts[brand] = (bucket.brandCounts[brand] || 0) + 1;
    bucket.typeCounts[type] = (bucket.typeCounts[type] || 0) + 1;
    bucket.total += 1;
    const key = getInsightsQueueKey({ name: event.name, tab: event.tab, type: event.type });
    const tags = Array.isArray(itemLookup[key]?.tags) ? itemLookup[key].tags : [];
    tags.forEach((tag) => {
      const clean = String(tag || "").trim();
      if (!clean || clean.toLowerCase() === "original") return;
      bucket.tagCounts[clean] = (bucket.tagCounts[clean] || 0) + 1;
    });
  });
  const personaSimilarity = Math.max(0, 100 - Math.round(distributionDrift(split.weekday.typeCounts, split.weekend.typeCounts) * 100));

  const makeTopLabel = (counts) => {
    const top = topCounts(counts, 1)[0];
    return top ? `${top.label} (${top.count})` : "n/a";
  };

  const coreStartMs = nowMs - (180 * dayMs);
  const priorStartMs = nowMs - (60 * dayMs);
  const windowStartMs = nowMs - (30 * dayMs);
  const baselineTypeCounts = {};
  const windowTypeCounts = {};
  const priorTypeCounts = {};
  recentEvents.forEach((event) => {
    if (event.wornMs < coreStartMs || event.wornMs > nowMs) return;
    const type = String(event.type || "Unknown").trim() || "Unknown";
    if (event.wornMs < priorStartMs) baselineTypeCounts[type] = (baselineTypeCounts[type] || 0) + 1;
    else if (event.wornMs < windowStartMs) priorTypeCounts[type] = (priorTypeCounts[type] || 0) + 1;
    else windowTypeCounts[type] = (windowTypeCounts[type] || 0) + 1;
  });
  const coreTypes = new Set(topCounts(baselineTypeCounts, 3).map((item) => item.label));
  const countCore = (counts) => Object.entries(counts).reduce((sum, [label, count]) => sum + (coreTypes.has(label) ? count : 0), 0);
  const windowTotal = Object.values(windowTypeCounts).reduce((sum, count) => sum + count, 0);
  const priorTotal = Object.values(priorTypeCounts).reduce((sum, count) => sum + count, 0);
  const windowExploration = windowTotal - countCore(windowTypeCounts);
  const priorExploration = priorTotal - countCore(priorTypeCounts);
  const explorationPct = safePercent(windowExploration, windowTotal);
  const priorExplorationPct = safePercent(priorExploration, priorTotal);

  const acquisitionWindowMs = nowMs - (180 * dayMs);
  const acquisitionRows = wearableItems
    .map((item) => {
      if (!item?.createdAt) return null;
      const createdMs = new Date(item.createdAt).getTime();
      if (Number.isNaN(createdMs) || createdMs < acquisitionWindowMs || createdMs > nowMs) return null;
      const wearLog = Array.isArray(item.wearLog) ? item.wearLog : [];
      const wearMsList = wearLog
        .map((stamp) => new Date(stamp).getTime())
        .filter((ms) => Number.isFinite(ms) && ms >= createdMs)
        .sort((a, b) => a - b);
      const firstWearMs = wearMsList.length ? wearMsList[0] : null;
      const firstWearDays = firstWearMs === null ? null : Math.max(0, Math.floor((firstWearMs - createdMs) / dayMs));
      const wearsIn30 = wearMsList.filter((ms) => ms <= (createdMs + (30 * dayMs))).length;
      return {
        name: String(item.name || "Unnamed"),
        tab: String(item.tab || "Unknown"),
        type: String(item.type || "Unknown"),
        firstWearDays,
        adopted30: firstWearDays !== null && firstWearDays <= 30,
        rewear30: wearsIn30 >= 2,
      };
    })
    .filter(Boolean);
  const firstWearDaysList = acquisitionRows.map((row) => row.firstWearDays).filter((value) => value !== null);
  const adoption30Count = acquisitionRows.filter((row) => row.adopted30).length;
  const rewear30Count = acquisitionRows.filter((row) => row.rewear30).length;
  const adoptionRate30 = safePercent(adoption30Count, acquisitionRows.length);
  const rewearRate30 = safePercent(rewear30Count, acquisitionRows.length);
  const medianFirstWearDays = medianOf(firstWearDaysList);
  const medianComponent = medianFirstWearDays === null ? 0 : Math.max(0, 100 - Math.min(100, Math.round(medianFirstWearDays * 2.5)));
  const acquisitionScore = acquisitionRows.length
    ? Math.round((adoptionRate30 * 0.5) + (medianComponent * 0.3) + (rewearRate30 * 0.2))
    : 0;

  const fatigueLookbackMs = nowMs - (90 * dayMs);
  const fatigueRecentMs = nowMs - (45 * dayMs);
  const themeBuckets = {};
  let priorThemeTotal = 0;
  let recentThemeTotal = 0;
  recentEvents.forEach((event) => {
    if (event.wornMs < fatigueLookbackMs || event.wornMs > nowMs) return;
    const isRecent = event.wornMs >= fatigueRecentMs;
    const key = getInsightsQueueKey({ name: event.name, tab: event.tab, type: event.type });
    const tags = Array.isArray(itemLookup[key]?.tags) ? itemLookup[key].tags : [];
    const fandom = String(itemLookup[key]?.fandom || "").trim();
    const themes = [];
    if (fandom) themes.push(`fandom:${fandom}`);
    tags.forEach((tag) => {
      const clean = String(tag || "").trim();
      if (!clean || clean.toLowerCase() === "original") return;
      themes.push(`tag:${clean}`);
    });
    themes.forEach((theme) => {
      if (!themeBuckets[theme]) themeBuckets[theme] = { prior: 0, recent: 0 };
      if (isRecent) {
        themeBuckets[theme].recent += 1;
        recentThemeTotal += 1;
      } else {
        themeBuckets[theme].prior += 1;
        priorThemeTotal += 1;
      }
    });
  });
  const fatigueThemes = Object.entries(themeBuckets)
    .map(([theme, counts]) => {
      const priorShare = priorThemeTotal ? (counts.prior / priorThemeTotal) : 0;
      const recentShare = recentThemeTotal ? (counts.recent / recentThemeTotal) : 0;
      const drop = priorShare - recentShare;
      const minSamples = counts.prior + counts.recent;
      if (counts.prior < 4 || minSamples < 6 || drop < 0.05 || priorShare < 0.08) return null;
      const rawLabel = theme.includes(":") ? theme.split(":")[1] : theme;
      return {
        label: rawLabel,
        family: theme.startsWith("fandom:") ? "Fandom" : "Tag",
        priorShare: Math.round(priorShare * 100),
        recentShare: Math.round(recentShare * 100),
        drop: Math.round(drop * 100),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.drop - a.drop || a.label.localeCompare(b.label))
    .slice(0, 5);

  const queueActivity = pruneInsightsQueueDailyActivity(loadInsightsQueueActivity());
  const dailyActivity = queueActivity.__daily || {};
  const frictionDays = Object.entries(dailyActivity)
    .map(([dateKey, day]) => {
      const exposures = Number(day?.exposures || 0);
      const selections = Number(day?.selections || 0);
      if (exposures <= 0) return null;
      const acceptance = selections / exposures;
      return {
        dateKey,
        exposures,
        selections,
        acceptance,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    .slice(-28);
  const frictionAvgAcceptance = frictionDays.length
    ? Math.round((frictionDays.reduce((sum, day) => sum + day.acceptance, 0) / frictionDays.length) * 100)
    : 0;
  const highFrictionDays = frictionDays.filter((day) => day.exposures >= 5 && day.acceptance < 0.2).length;
  const worstFrictionDay = frictionDays.length
    ? frictionDays.slice().sort((a, b) => a.acceptance - b.acceptance || b.exposures - a.exposures)[0]
    : null;

  const weekdayFriction = {};
  frictionDays.forEach((day) => {
    const ms = new Date(`${day.dateKey}T12:00:00`).getTime();
    if (Number.isNaN(ms)) return;
    const label = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(ms).getDay()];
    if (!weekdayFriction[label]) weekdayFriction[label] = { accept: 0, exposures: 0 };
    weekdayFriction[label].accept += day.selections;
    weekdayFriction[label].exposures += day.exposures;
  });
  const weekdayFrictionRows = Object.entries(weekdayFriction)
    .map(([label, row]) => ({ label, acceptance: safePercent(row.accept, row.exposures), exposures: row.exposures }))
    .sort((a, b) => a.acceptance - b.acceptance || b.exposures - a.exposures)
    .slice(0, 3);

  const comebackCandidates = wearableItems
    .map((item) => {
      if (isProtectedTagged(item) || isSeasonalExempt(item)) return null;
      const wearCount = Number(item?.wearCount || 0);
      const key = getInsightsQueueKey(item);
      const name = String(item?.name || "Unnamed");
      const tab = String(item?.tab || "Unknown");
      const type = String(item?.type || "Unknown");
      const lastWornMs = item?.lastWorn ? new Date(item.lastWorn).getTime() : NaN;
      const daysSince = Number.isNaN(lastWornMs) ? null : Math.max(0, Math.floor((nowMs - lastWornMs) / dayMs));
      const price = Number(item?.price || 0);
      if (wearCount < 2 || daysSince === null || daysSince < 150) return null;
      const score = Math.round(Math.min(84, wearCount * 6) + Math.min(96, daysSince * 0.28) + Math.min(24, Math.log10(price + 1) * 10));
      return {
        key,
        name,
        tab,
        type,
        wearCount,
        daysSince,
        score,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 5);

  const benchPressure = wearableItems
    .map((item) => {
      if (isProtectedTagged(item) || isSeasonalExempt(item)) return null;
      const key = getInsightsQueueKey(item);
      const activity = queueActivity[key];
      if (!activity || (activity.exposures || 0) < 4) return null;
      const exposures = Number(activity.exposures || 0);
      const selections = Number(activity.selections || 0);
      const snoozes = Number(activity.snoozes || 0);
      const softPasses = Number(activity.softPasses || 0);
      const selectionRate = exposures > 0 ? selections / exposures : 0;
      const skips = Math.max(0, exposures - selections);
      const browseAllowance = Math.min(skips, Math.floor(Number(activity.exposureDays || 0) * 0.6));
      const adjustedSkips = Math.max(0, skips - browseAllowance - softPasses);
      const lastExposureMs = /^\d{4}-\d{2}-\d{2}$/.test(String(activity.lastExposureDate || ""))
        ? new Date(`${activity.lastExposureDate}T12:00:00`).getTime()
        : NaN;
      const lastSelectedMs = /^\d{4}-\d{2}-\d{2}$/.test(String(activity.lastSelectedDate || ""))
        ? new Date(`${activity.lastSelectedDate}T12:00:00`).getTime()
        : NaN;
      const lastSnoozeMs = /^\d{4}-\d{2}-\d{2}$/.test(String(activity.lastSnoozeDate || ""))
        ? new Date(`${activity.lastSnoozeDate}T12:00:00`).getTime()
        : NaN;
      const lastSoftPassMs = /^\d{4}-\d{2}-\d{2}$/.test(String(activity.lastSoftPassDate || ""))
        ? new Date(`${activity.lastSoftPassDate}T12:00:00`).getTime()
        : NaN;
      const daysSinceSeen = Number.isNaN(lastExposureMs) ? null : Math.max(0, Math.floor((nowMs - lastExposureMs) / dayMs));
      const daysSincePicked = Number.isNaN(lastSelectedMs) ? null : Math.max(0, Math.floor((nowMs - lastSelectedMs) / dayMs));
      const daysSinceSnoozed = Number.isNaN(lastSnoozeMs) ? null : Math.max(0, Math.floor((nowMs - lastSnoozeMs) / dayMs));
      const daysSinceSoftPass = Number.isNaN(lastSoftPassMs) ? null : Math.max(0, Math.floor((nowMs - lastSoftPassMs) / dayMs));
      const pressureScore = Math.round(
        (adjustedSkips * 4)
        + Math.max(0, (1 - selectionRate) * 26)
        + Math.min(16, Number(activity.exposureDays || 0) * 1.2)
        + (snoozes * 18)
        + Math.min(18, Number(activity.snoozeDays || 0) * 6)
        + (daysSincePicked !== null && daysSincePicked > 21 ? 8 : 0)
        + (daysSinceSnoozed !== null && daysSinceSnoozed <= 14 ? 8 : 0)
        - Math.min(14, softPasses * 4)
        - (daysSinceSoftPass !== null && daysSinceSoftPass <= 7 ? 6 : 0)
      );
      if (snoozes === 0 && exposures < 7) return null;
      if (selectionRate >= 0.4 && snoozes === 0 && pressureScore < 55) return null;
      if (adjustedSkips < 2 && snoozes === 0) return null;
      return {
        key,
        name: String(item?.name || "Unnamed"),
        tab: String(item?.tab || "Unknown"),
        type: String(item?.type || "Unknown"),
        exposures,
        selections,
        skips,
        adjustedSkips,
        snoozes,
        softPasses,
        selectionRate,
        pressureScore,
        exposureDays: Number(activity.exposureDays || 0),
        snoozeDays: Number(activity.snoozeDays || 0),
        softPassDays: Number(activity.softPassDays || 0),
        daysSinceSeen,
        daysSincePicked,
        daysSinceSnoozed,
        daysSinceSoftPass,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.pressureScore - a.pressureScore || b.exposures - a.exposures || a.name.localeCompare(b.name))
    .slice(0, 8);

  const wearsLast60 = recentEvents.filter((event) => event.wornMs >= (nowMs - (60 * dayMs)) && event.wornMs <= nowMs).length;
  const collectionDailyCadence = wearsLast60 > 0 ? (wearsLast60 / 60) : 0.12;
  const valueRecoveryCandidates = wearableItems
    .map((item) => {
      if (isProtectedTagged(item) || isSeasonalExempt(item)) return null;
      const price = Number(item?.price || 0);
      if (!Number.isFinite(price) || price <= 0) return null;
      const wearCount = Math.max(0, Number(item?.wearCount || 0));
      const currentCpw = price / Math.max(1, wearCount);
      const targetCpw = Math.max(8, Math.min(20, price / 10));
      const targetWearCount = Math.ceil(price / targetCpw);
      const additionalWears = Math.max(0, targetWearCount - wearCount);
      if (additionalWears <= 0) return null;
      const lastWornMs = item?.lastWorn ? new Date(item.lastWorn).getTime() : NaN;
      const daysSince = Number.isNaN(lastWornMs) ? null : Math.max(0, Math.floor((nowMs - lastWornMs) / dayMs));
      if (wearCount > 0 && daysSince !== null && daysSince < 150) return null;
      if (wearCount === 0 && item?.createdAt) {
        const createdMs = new Date(item.createdAt).getTime();
        const daysSinceAdded = Number.isFinite(createdMs) ? Math.max(0, Math.floor((nowMs - createdMs) / dayMs)) : null;
        if (daysSinceAdded !== null && daysSinceAdded < 120) return null;
      }
      if (currentCpw < (targetCpw * 1.35) && additionalWears < 3) return null;
      const itemDailyCadence = Math.max(0.03, collectionDailyCadence * 0.1);
      const etaDays = Math.ceil(additionalWears / itemDailyCadence);
      const recoveryPressure = Math.round((currentCpw * 1.35) + (additionalWears * 3.5) + Math.min(24, Number(daysSince || 0) * 0.18));
      return {
        key: getInsightsQueueKey(item),
        name: String(item?.name || "Unnamed"),
        tab: String(item?.tab || "Unknown"),
        type: String(item?.type || "Unknown"),
        currentCpw,
        targetCpw,
        additionalWears,
        etaDays,
        recoveryPressure,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.recoveryPressure - a.recoveryPressure || b.currentCpw - a.currentCpw || a.name.localeCompare(b.name))
    .slice(0, 8);
  const totalRecoveryWears = valueRecoveryCandidates.reduce((sum, item) => sum + item.additionalWears, 0);

  const confidenceRows = wearableItems
    .map((item) => {
      if (isProtectedTagged(item)) return null;
      const wearLog = Array.isArray(item?.wearLog) ? item.wearLog : [];
      const wearTimes = wearLog
        .map((stamp) => new Date(stamp).getTime())
        .filter((ms) => Number.isFinite(ms))
        .sort((a, b) => a - b);
      const wearCount = Math.max(Number(item?.wearCount || 0), wearTimes.length);
      if (wearCount <= 0) return null;
      const gaps = [];
      for (let i = 1; i < wearTimes.length; i += 1) {
        gaps.push(Math.max(0, Math.floor((wearTimes[i] - wearTimes[i - 1]) / dayMs)));
      }
      const medianGap = medianOf(gaps);
      const lastWornMs = item?.lastWorn ? new Date(item.lastWorn).getTime() : (wearTimes.length ? wearTimes[wearTimes.length - 1] : NaN);
      const daysSince = Number.isNaN(lastWornMs) ? null : Math.max(0, Math.floor((nowMs - lastWornMs) / dayMs));
      const queueKey = getInsightsQueueKey(item);
      const activity = queueActivity[queueKey] || null;
      const snoozes = Number(activity?.snoozes || 0);
      const reasons = [];
      let score = 0;
      score += Math.min(50, wearCount * 7);
      if (wearCount <= 1) reasons.push("low repeat depth");
      else if (wearCount <= 3) reasons.push("still building repeat depth");
      if (medianGap === null) score += 12;
      else if (medianGap <= 180) score += 24;
      else if (medianGap <= 365) score += 20;
      else if (medianGap <= 540) score += 16;
      else if (medianGap <= 730) score += 12;
      else score += 8;
      if (medianGap !== null && medianGap > 540) reasons.push("very long repeat gap");
      if (daysSince !== null) {
        if (daysSince <= 365) score += 22;
        else if (daysSince <= 730) score += 14;
        else if (daysSince <= 1095) score += 7;
        if (daysSince > 730) reasons.push("long time since last wear");
      }
      if (snoozes > 0) {
        score -= Math.min(12, snoozes * 4);
        reasons.push(snoozes === 1 ? "recently snoozed" : `snoozed ${snoozes}x`);
      }
      if (!reasons.length) reasons.push("collector-normal spacing");
      return {
        key: queueKey,
        name: String(item?.name || "Unnamed"),
        tab: String(item?.tab || "Unknown"),
        type: String(item?.type || "Unknown"),
        wearCount,
        medianGap,
        daysSince,
        snoozes,
        reasonText: reasons.slice(0, 2).join(" · "),
        confidenceScore: Math.max(0, Math.min(100, Math.round(score))),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.confidenceScore - a.confidenceScore || a.name.localeCompare(b.name));
  const avgConfidence = confidenceRows.length
    ? Math.round(confidenceRows.reduce((sum, row) => sum + row.confidenceScore, 0) / confidenceRows.length)
    : 0;
  const lowConfidence = confidenceRows.filter((row) => row.confidenceScore <= 32).slice(0, 5);

  const typePerformance = {};
  wearableItems.forEach((item) => {
    const key = getInsightsQueueKey(item);
    const activity = queueActivity[key];
    if (!activity) return;
    const type = String(item?.type || "Unknown").trim() || "Unknown";
    if (!typePerformance[type]) typePerformance[type] = { exposures: 0, selections: 0 };
    typePerformance[type].exposures += Number(activity.exposures || 0);
    typePerformance[type].selections += Number(activity.selections || 0);
  });
  const typePerfRows = Object.entries(typePerformance)
    .map(([type, row]) => {
      const exposures = Number(row.exposures || 0);
      const selections = Number(row.selections || 0);
      const rate = exposures > 0 ? (selections / exposures) : 0;
      return { type, exposures, selections, rate };
    })
    .filter((row) => row.exposures >= 4)
    .sort((a, b) => b.rate - a.rate || b.exposures - a.exposures);
  const adaptiveBoosts = typePerfRows.filter((row) => row.rate >= 0.35).slice(0, 3);
  const adaptiveSuppressions = typePerfRows.slice().sort((a, b) => a.rate - b.rate || b.exposures - a.exposures).filter((row) => row.rate <= 0.16).slice(0, 3);

  const protectedKeySet = new Set(wearableItems.filter((item) => isProtectedTagged(item)).map((item) => getInsightsQueueKey(item)));
  const seasonalExemptKeySet = new Set(wearableItems.filter((item) => isSeasonalExempt(item)).map((item) => getInsightsQueueKey(item)));

  const getMarketplaceMatches = (item) => {
    const tags = Array.isArray(item?.tags) ? item.tags : [];
    const normalized = tags.map(normalizeTagKey);
    const set = new Set(normalized);
    const matches = [];
    if (set.has("bst")) matches.push("bst");
    if (set.has("ebay")) matches.push("ebay");
    if (set.has("mercari")) matches.push("mercari");
    if (set.has("xxchange")) matches.push("xxchange");
    return matches;
  };

  const marketplaceTagStats = {
    bst: { label: "BST", count: 0, neverWorn: 0, inactive180: 0, totalValue: 0, avgCpw: null, avgWears: null, strongKeepers: 0, cpwSamples: [], wearSamples: [] },
    ebay: { label: "eBay", count: 0, neverWorn: 0, inactive180: 0, totalValue: 0, avgCpw: null, avgWears: null, strongKeepers: 0, cpwSamples: [], wearSamples: [] },
    mercari: { label: "Mercari", count: 0, neverWorn: 0, inactive180: 0, totalValue: 0, avgCpw: null, avgWears: null, strongKeepers: 0, cpwSamples: [], wearSamples: [] },
    xxchange: { label: "XXChange", count: 0, neverWorn: 0, inactive180: 0, totalValue: 0, avgCpw: null, avgWears: null, strongKeepers: 0, cpwSamples: [], wearSamples: [] },
  };

  const confidenceByKey = {};
  confidenceRows.forEach((row) => {
    if (row?.key) confidenceByKey[row.key] = row;
  });

  const benchByKey = {};
  benchPressure.forEach((row) => {
    if (row?.key) benchByKey[row.key] = row;
  });

  const recoveryByKey = {};
  valueRecoveryCandidates.forEach((row) => {
    if (row?.key) recoveryByKey[row.key] = row;
  });

  wearableItems.forEach((item) => {
    const price = Number(item?.price || 0);
    const wearCount = Math.max(0, Number(item?.wearCount || 0));
    const lastWornMs = item?.lastWorn ? new Date(item.lastWorn).getTime() : NaN;
    const daysSince = Number.isNaN(lastWornMs) ? null : Math.max(0, Math.floor((nowMs - lastWornMs) / dayMs));
    const matches = getMarketplaceMatches(item);
    matches.forEach((id) => {
      const bucket = marketplaceTagStats[id];
      if (!bucket) return;
      bucket.count += 1;
      if (wearCount === 0) bucket.neverWorn += 1;
      if (daysSince !== null && daysSince >= 180) bucket.inactive180 += 1;
      if (price > 0) {
        bucket.totalValue += price;
        bucket.cpwSamples.push(price / Math.max(1, wearCount));
      }
      bucket.wearSamples.push(wearCount);
      const confidenceHit = confidenceByKey[getInsightsQueueKey(item)] || null;
      if (wearCount >= 3 && ((daysSince !== null && daysSince <= 365) || (confidenceHit && confidenceHit.confidenceScore >= 60))) {
        bucket.strongKeepers += 1;
      }
    });
  });

  Object.values(marketplaceTagStats).forEach((bucket) => {
    if (bucket.cpwSamples.length) {
      const avg = bucket.cpwSamples.reduce((sum, value) => sum + value, 0) / bucket.cpwSamples.length;
      bucket.avgCpw = Math.round(avg * 10) / 10;
    }
    if (bucket.wearSamples.length) {
      const avg = bucket.wearSamples.reduce((sum, value) => sum + value, 0) / bucket.wearSamples.length;
      bucket.avgWears = Math.round(avg * 10) / 10;
    }
    delete bucket.cpwSamples;
    delete bucket.wearSamples;
  });

  const sellSuggestions = wearableItems
    .map((item) => {
      if (isProtectedTagged(item) || isSeasonalExempt(item)) return null;
      if (item?.createdAt) {
        const createdMs = new Date(item.createdAt).getTime();
        if (Number.isFinite(createdMs) && createdMs > (nowMs - (30 * dayMs))) return null;
      }
      const key = getInsightsQueueKey(item);
      const wearCount = Math.max(0, Number(item?.wearCount || 0));
      const price = Number(item?.price || 0);
      const lastWornMs = item?.lastWorn ? new Date(item.lastWorn).getTime() : NaN;
      const daysSince = Number.isNaN(lastWornMs) ? null : Math.max(0, Math.floor((nowMs - lastWornMs) / dayMs));
      let score = 0;
      const reasons = [];
      if (wearCount === 0) {
        score += 55;
        reasons.push("never worn");
      }
      if (daysSince !== null && daysSince >= 365) {
        score += 40;
        reasons.push(`${daysSince}d idle`);
      } else if (daysSince !== null && daysSince >= 180) {
        score += 28;
        reasons.push(`${daysSince}d inactive`);
      }
      const benchHit = benchByKey[key] || null;
      if (benchHit) {
        score += Math.min(35, Math.round(benchHit.pressureScore * 0.35));
        reasons.push(`bench pressure ${benchHit.pressureScore}`);
      }
      const confidenceHit = confidenceByKey[key] || null;
      if (confidenceHit && confidenceHit.confidenceScore <= 32) {
        score += Math.round((36 - confidenceHit.confidenceScore) * 0.6);
        reasons.push(`confidence ${confidenceHit.confidenceScore}`);
      }
      const recoveryHit = recoveryByKey[key] || null;
      if (recoveryHit) {
        score += Math.min(26, Math.round(recoveryHit.currentCpw));
        reasons.push(`${Math.round(recoveryHit.currentCpw)}/wear`);
      }
      const marketMatches = getMarketplaceMatches(item);
      if (marketMatches.length) {
        score += 8;
        reasons.push(`tagged ${marketMatches.map((id) => marketplaceTagStats[id]?.label || id).join("/")}`);
      }
      if (daysSince !== null && daysSince <= 30) score -= 25;

      if (score < 45) return null;
      const actionLabel = score >= 78 ? "Sell candidate" : "Review";
      return {
        key,
        name: String(item?.name || "Unnamed"),
        tab: String(item?.tab || "Unknown"),
        type: String(item?.type || "Unknown"),
        score,
        actionLabel,
        reasons,
        daysSince,
        wearCount,
        price,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || b.price - a.price || a.name.localeCompare(b.name))
    .slice(0, 3);

  const queueByKey = {};
  (Array.isArray(queue) ? queue : []).forEach((item) => {
    if (!item?.key || queueByKey[item.key]) return;
    queueByKey[item.key] = item;
  });
  const reactivationSeeds = [];
  comebackCandidates.forEach((item) => {
    if (protectedKeySet.has(String(item?.key || "")) || seasonalExemptKeySet.has(String(item?.key || ""))) return;
    if (item?.key) reactivationSeeds.push({ key: item.key, reason: `Comeback ${item.daysSince}d idle` });
  });
  benchPressure.slice(0, 5).forEach((item) => {
    if (protectedKeySet.has(String(item?.key || "")) || seasonalExemptKeySet.has(String(item?.key || ""))) return;
    if (item?.key) reactivationSeeds.push({ key: item.key, reason: `Bench pressure ${item.pressureScore}` });
  });
  valueRecoveryCandidates.slice(0, 5).forEach((item) => {
    if (protectedKeySet.has(String(item?.key || "")) || seasonalExemptKeySet.has(String(item?.key || ""))) return;
    if (item?.key) reactivationSeeds.push({ key: item.key, reason: `Recovery ${Math.round(item.currentCpw)}/wear` });
  });
  const playbook = [];
  const used = new Set();
  reactivationSeeds.forEach((seed) => {
    if (playbook.length >= 7 || !seed?.key || used.has(seed.key)) return;
    const qItem = queueByKey[seed.key];
    const source = qItem || wearableItems.find((item) => getInsightsQueueKey(item) === seed.key);
    if (!source) return;
    used.add(seed.key);
    playbook.push({
      key: seed.key,
      name: String(source.name || "Unnamed"),
      tab: String(source.tab || "Unknown"),
      type: String(source.type || "Unknown"),
      reason: seed.reason,
    });
  });

  return {
    volatility: {
      score: volatilityScore,
      label: volatilityLabel,
      weeklyDrifts,
      latestShift: weeklyDrifts.length ? weeklyDrifts[weeklyDrifts.length - 1] : 0,
    },
    persona: {
      similarity: personaSimilarity,
      weekday: {
        total: split.weekday.total,
        topBrand: makeTopLabel(split.weekday.brandCounts),
        topType: makeTopLabel(split.weekday.typeCounts),
        topTag: makeTopLabel(split.weekday.tagCounts),
      },
      weekend: {
        total: split.weekend.total,
        topBrand: makeTopLabel(split.weekend.brandCounts),
        topType: makeTopLabel(split.weekend.typeCounts),
        topTag: makeTopLabel(split.weekend.tagCounts),
      },
    },
    exploration: {
      pct: explorationPct,
      trend: explorationPct - priorExplorationPct,
      coreTypes: Array.from(coreTypes),
      windowTotal,
    },
    rotationModel: {
      closetSize: wearableItems.length,
      annualCoveragePct,
      covered365Count,
      tierA: { count: covered365Count, pct: tierAPct },
      tierB: { count: covered730Count, pct: tierBPct },
      tierC: { count: dormantCount, pct: tierCPct },
      coverageScore,
      tierBalanceScore,
      expectedTouchesPerMonth,
      actualTouchesPerMonth,
      eligibleBacklogCount: backlogEligible.length,
      neverWornEligibleCount: neverWornEligible.length,
      adjustedBacklogPct,
      graceCount,
      seasonalExemptCount,
      topBrandDominance,
      parkedValueSplit: {
        intentional: parkedIntentional,
        uncertain: parkedUncertain,
      },
    },
    acquisition: {
      score: acquisitionScore,
      eligibleAdds: acquisitionRows.length,
      adoptionRate30,
      rewearRate30,
      medianFirstWearDays,
    },
    fatigue: {
      count: fatigueThemes.length,
      themes: fatigueThemes,
    },
    friction: {
      avgAcceptance: frictionAvgAcceptance,
      highFrictionDays,
      worstDay: worstFrictionDay,
      weekdayRows: weekdayFrictionRows,
      totalDays: frictionDays.length,
    },
    valueRecovery: {
      candidates: valueRecoveryCandidates,
      totalRecoveryWears,
      cadencePerDay: collectionDailyCadence,
    },
    confidence: {
      avgConfidence,
      lowConfidence,
      totalTracked: confidenceRows.length,
    },
    adaptive: {
      boosts: adaptiveBoosts,
      suppressions: adaptiveSuppressions,
      sampleSize: typePerfRows.length,
    },
    reactivation: {
      playbook,
    },
    sellSuggestions,
    marketplaceTags: marketplaceTagStats,
    comebackCandidates,
    benchPressure,
  };
};

const normalizeHolidayTagKey = (value) => String(value || "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "");

const isFlannelLikeText = (text) => {
  const normalized = String(text || "").toLowerCase();
  return normalized.includes("flannel") || normalized.includes("borlandflex");
};

const isHoodieLikeText = (text) => String(text || "").toLowerCase().includes("hoodie");

const buildTaggedLaneStats = (items, aliases, options = {}) => {
  const allItems = Array.isArray(items) ? items : [];
  const aliasSet = new Set((Array.isArray(aliases) ? aliases : [])
    .map((value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, ""))
    .filter(Boolean));
  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const taggedItems = allItems.filter((item) => {
    const tags = Array.isArray(item?.tags) ? item.tags : [];
    return tags.some((tag) => aliasSet.has(String(tag || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "")));
  });
  const active365 = taggedItems.filter((item) => {
    if (!item?.lastWorn) return false;
    const ms = new Date(item.lastWorn).getTime();
    return Number.isFinite(ms) && Math.floor((nowMs - ms) / 86400000) <= 365;
  }).length;
  const neverWorn = taggedItems.filter((item) => Number(item?.wearCount || 0) <= 0).length;
  const brandCounts = {};
  const typeCounts = {};
  taggedItems.forEach((item) => {
    const brand = String(item?.tab || "Unknown");
    const type = String(item?.type || "Unknown");
    brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  const topBrand = Object.entries(brandCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] || null;
  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] || null;
  const activePct = taggedItems.length ? Math.round((active365 / taggedItems.length) * 100) : 0;
  return {
    total: taggedItems.length,
    active365,
    activePct,
    neverWorn,
    topBrand: topBrand ? topBrand[0] : "n/a",
    topType: topType ? topType[0] : "n/a",
  };
};

const getLastMondayOfMay = (year) => {
  const d = new Date(year, 4, 31);
  while (d.getDay() !== 1) d.setDate(d.getDate() - 1);
  return d;
};

const getNthWeekdayOfMonth = (year, monthIndex, weekday, occurrence) => {
  const d = new Date(year, monthIndex, 1);
  while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
  d.setDate(d.getDate() + ((Math.max(1, Number(occurrence) || 1) - 1) * 7));
  return d;
};

const getThanksgivingDate = (year) => {
  const d = new Date(year, 10, 1);
  while (d.getDay() !== 4) d.setDate(d.getDate() + 1);
  d.setDate(d.getDate() + 21);
  return d;
};

const getEasterDate = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + (2 * e) + (2 * i) - h - k) % 7;
  const m = Math.floor((a + (11 * h) + (22 * l)) / 451);
  const month = Math.floor((h + l - (7 * m) + 114) / 31) - 1;
  const day = ((h + l - (7 * m) + 114) % 31) + 1;
  return new Date(year, month, day);
};

const getMardiGrasDate = (year) => {
  const easter = getEasterDate(year);
  const mardiGras = new Date(easter);
  mardiGras.setDate(easter.getDate() - 47);
  return mardiGras;
};

const getHanukkahStartDate = (year) => {
  try {
    const fmt = new Intl.DateTimeFormat("en-u-ca-hebrew", { day: "numeric", month: "long" });
    const start = new Date(year, 10, 15);
    for (let i = 0; i < 62; i += 1) {
      const probe = new Date(start);
      probe.setDate(start.getDate() + i);
      const heb = fmt.format(probe).toLowerCase();
      if (heb.includes("25") && heb.includes("kislev")) {
        return probe;
      }
    }
  } catch (error) {
    // fallback below
  }
  return new Date(year, 11, 10);
};

const buildWearNextQueue = (stats, snoozes, options = {}) => {
  const items = Array.isArray(stats?.wearableItems) ? stats.wearableItems : [];
  const activeSnoozes = snoozes || {};
  const defaultNow = new Date();
  const simDateKey = options && /^\d{4}-\d{2}-\d{2}$/.test(String(options.simDateKey || ""))
    ? String(options.simDateKey)
    : "";
  const now = simDateKey ? new Date(`${simDateKey}T12:00:00`) : defaultNow;
  const safeNow = Number.isNaN(now.getTime()) ? defaultNow : now;
  const nowMs = safeNow.getTime();
  const todayKey = localDateKeyFromDate(safeNow);
  const monthIndex = safeNow.getMonth();
  const dayOfMonth = safeNow.getDate();
  const dayOfWeek = safeNow.getDay(); // Sun=0..Sat=6
  const year = safeNow.getFullYear();
  const isColdMonth = [0, 1, 2, 3, 8, 9, 10, 11].includes(monthIndex);
  const isWarmMonth = !isColdMonth;
  const isSummerMonth = [5, 6, 7].includes(monthIndex); // Jun, Jul, Aug
  const isPeakHeatMonth = [6, 7].includes(monthIndex); // Jul, Aug
  const isMayFlowersMonth = monthIndex === 4;
  const isMickeyMonday = dayOfWeek === 1;
  const isTagPopTuesday = dayOfWeek === 2;
  const isWhaleWednesday = dayOfWeek === 3;
  const isFloralFriday = dayOfWeek === 5;
  const isNationalFlannelDay = monthIndex === 1 && dayOfMonth === 10;

  const dateOnlyFrom = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const daysBetween = (a, b) => Math.floor(Math.abs(dateOnlyFrom(a).getTime() - dateOnlyFrom(b).getTime()) / 86400000);
  const presidentsDay = getNthWeekdayOfMonth(year, 1, 1, 3);
  const memorialDay = getLastMondayOfMay(year);
  const flagDay = new Date(year, 5, 14);
  const cincoDeMayo = new Date(year, 4, 5);
  const thanksgivingDay = getThanksgivingDate(year);
  const easterDay = getEasterDate(year);
  const mardiGrasDay = getMardiGrasDate(year);
  const hanukkahStart = getHanukkahStartDate(year);
  const holidayWindowDays = 7;
  const holidayProfiles = [
    {
      id: "usa",
      label: "USA holiday",
      dates: [presidentsDay, memorialDay, flagDay, new Date(year, 6, 4)],
      aliases: ["usa", "us", "america", "american", "patriotic"],
    },
    {
      id: "july4",
      label: "July 4",
      dates: [new Date(year, 6, 4)],
      aliases: ["july4", "july4th", "4thofjuly", "independenceday"],
    },
    {
      id: "stpatricks",
      label: "St. Patrick's Day",
      dates: [new Date(year, 2, 17)],
      aliases: ["stpatricksday", "stpatricks", "stpatrickday", "stpatricksday"],
    },
    {
      id: "valentines",
      label: "Valentine's Day",
      dates: [new Date(year, 1, 14)],
      aliases: ["valentinesday", "valentines", "valentine"],
    },
    {
      id: "cincodemayo",
      label: "Cinco de Mayo",
      dates: [cincoDeMayo],
      aliases: ["cincodemayo", "cinco", "5demayo"],
    },
    {
      id: "mardigras",
      label: "Mardi Gras",
      dates: [mardiGrasDay],
      aliases: ["mardigras", "mardi", "mardigrasday", "margigras"],
    },
    {
      id: "easter",
      label: "Easter",
      dates: [easterDay],
      aliases: ["easter", "eastersunday"],
    },
    {
      id: "thanksgiving",
      label: "Thanksgiving",
      dates: [thanksgivingDay],
      aliases: ["thanksgiving", "thanks"],
    },
    {
      id: "hanukkah",
      label: "Hanukkah",
      dates: [hanukkahStart],
      aliases: ["hanukkah", "chanukah", "chanukkah"],
    },
    {
      id: "christmas",
      label: "Christmas",
      dates: [new Date(year, 11, 25)],
      aliases: ["christmas", "xmas"],
    },
    {
      id: "halloween",
      label: "Halloween",
      dates: [new Date(year, 9, 31)],
      aliases: ["halloween", "spooky"],
    },
    {
      id: "diadelosmuertos",
      label: "Dia de los Muertos",
      dates: [new Date(year, 10, 2)],
      aliases: ["diadelosmuertos", "diadelosmuerto", "dayofthedead", "muertos"],
    },
  ];

  return items
    .map((item) => {
      const name = item.name || "Unnamed";
      const nameLower = String(name || "").trim().toLowerCase();
      const nameKey = nameLower.replace(/[^a-z0-9]+/g, "");
      const tab = item.tab || "Unknown";
      const type = item.type || "Unknown";
      const typeLower = String(type || "").trim().toLowerCase();
      const typeKey = typeLower.replace(/[^a-z0-9]+/g, "");
      const lastWorn = item.lastWorn || null;
      const wearCount = item.wearCount || 0;
      const price = item.price !== null && item.price !== undefined ? item.price : null;
      const condition = String(item.condition || "").trim().toLowerCase();
      const fandom = String(item.fandom || "").trim().toLowerCase();
      const tags = Array.isArray(item.tags) ? item.tags : [];
      const tagSet = new Set(tags.map((tag) => String(tag || "").trim().toLowerCase()).filter(Boolean));
      const normalizedTagKeys = new Set(tags.map(normalizeHolidayTagKey).filter(Boolean));
      const fandomKey = normalizeHolidayTagKey(fandom);
      const isFloralItem = tagSet.has("floral") || normalizedTagKeys.has("floral");
      const isWhaleItem = tagSet.has("whale") || normalizedTagKeys.has("whale");
      const isLongSleeveTagged = tagSet.has("long sleeve") || normalizedTagKeys.has("longsleeve");
      const isMickeyDisneyItem = nameKey.includes("mickey")
        || nameKey.includes("disney")
        || fandomKey.includes("mickey")
        || fandomKey.includes("disney")
        || normalizedTagKeys.has("mickey")
        || normalizedTagKeys.has("disney");
      const isStarWarsItem = fandomKey === "starwars"
        || normalizedTagKeys.has("starwars")
        || nameKey.includes("starwars");
      const createdAt = item.createdAt || null;
      const key = getInsightsQueueKey({ name, tab, type });
      const snoozeUntil = activeSnoozes[key] || "";
      const isSnoozed = snoozeUntil && snoozeUntil >= todayKey;
      const lwMs = lastWorn ? new Date(lastWorn).getTime() : NaN;
      const daysSince = Number.isNaN(lwMs) ? null : Math.max(0, Math.floor((nowMs - lwMs) / 86400000));
      const lastWornToday = lastWorn ? localDateKeyFromDate(new Date(lastWorn)) === todayKey : false;
      const createdMs = createdAt ? new Date(createdAt).getTime() : NaN;
      const daysSinceAdded = Number.isNaN(createdMs) ? null : Math.max(0, Math.floor((nowMs - createdMs) / 86400000));

      let score = 0;
      const breakdown = [];
      const addScore = (label, points) => {
        if (!points) return;
        score += points;
        breakdown.push({ label, points });
      };

      if (wearCount === 0) {
        // New and never-worn items should be surfaced aggressively.
        addScore("Never worn baseline", 170);
        if (daysSinceAdded !== null) addScore("Unworn age pressure", Math.min(65, Math.floor(daysSinceAdded / 4)));
        if (condition === "nwt" || condition === "nwot") {
          addScore(`${condition.toUpperCase()} bonus`, 70);
        }
      }

      if (daysSince !== null) addScore("Days since last wear", Math.min(140, daysSince));
      if (daysSince !== null && daysSince >= 90) addScore("90+ day idle bonus", 20);
      if (daysSince !== null && daysSince >= 180) addScore("180+ day idle bonus", 30);

      if (price !== null && price > 0) {
        const rawValuePoints = Math.min(24, Math.round(Math.log10(price + 1) * 10));
        let valuePoints = rawValuePoints;
        // High-value Whale/Holiday items should be less aggressively prioritized.
        if (isWhaleItem) valuePoints = Math.round(valuePoints * 0.25);
        if (tagSet.has("holiday") || normalizedTagKeys.has("holiday")) valuePoints = Math.round(valuePoints * 0.45);
        addScore("Item value signal", valuePoints);
        const valueDampener = valuePoints - rawValuePoints;
        addScore("Tag value dampener", valueDampener);
      }

      if (isWhaleItem) addScore("Whale baseline penalty", -28);

      if (isColdMonth && isFlannelLikeText(typeLower)) {
        addScore("Flannel in cold-month season", 34);
      }
      if (isColdMonth && isHoodieLikeText(typeLower)) {
        addScore("Hoodie in cold-month season", 32);
      }
      if (isSummerMonth && isFlannelLikeText(typeLower)) {
        addScore("Flannel summer penalty", -170);
      }
      if (isPeakHeatMonth && isFlannelLikeText(typeLower)) {
        addScore("Flannel peak-heat penalty", -120);
      }
      if (isWarmMonth && isLongSleeveTagged) {
        addScore("Warm-month long-sleeve penalty", -26);
      }
      if (isWarmMonth && isHoodieLikeText(typeLower) && isLongSleeveTagged) {
        addScore("Warm-month hoodie long-sleeve penalty", -22);
      }

      const summerPriorityKeys = [
        "kunuflex",
        "bamboo",
        "polo",
        "fourwaystretchblend",
        "spoonerkloth",
        "candyfloss",
        "bottleblend",
      ];
      const hasSummerPriorityMatch = summerPriorityKeys.some((key) =>
        typeKey.includes(key) || nameKey.includes(key) || normalizedTagKeys.has(key)
      );
      if (isSummerMonth && hasSummerPriorityMatch) {
        addScore("Summer fabric/style boost", 72);
      }
      if (isPeakHeatMonth && hasSummerPriorityMatch) {
        addScore("Peak-heat fabric/style boost", 36);
      }

      // Date-aware thematic boosts (queue naturally changes day to day).
      if (isMayFlowersMonth && isFloralItem) {
        addScore("May Flowers daily floral boost", 60);
      }
      if (isFloralItem && isFloralFriday) {
        addScore("Floral Friday boost", 42);
      }
      if (isTagPopTuesday && wearCount === 0) {
        addScore("Tag Pop Tuesday unworn boost", 46);
      }
      if (isTagPopTuesday && (condition === "nwt" || condition === "nwot")) {
        addScore("Tag Pop Tuesday NWT boost", 34);
      }
      if (isNationalFlannelDay && isFlannelLikeText(typeLower)) {
        addScore("National Flannel Day boost", 78);
      }

      const holidayDistances = holidayProfiles.map((profile) => {
        const minDays = profile.dates.reduce((innerBest, d) => {
          const diff = daysBetween(safeNow, d);
          return diff < innerBest ? diff : innerBest;
        }, Infinity);
        return { profile, days: minDays };
      });
      const activeHolidayProfiles = holidayDistances.filter((entry) => entry.days <= holidayWindowDays);
      const matchedHolidayProfiles = holidayProfiles.filter((profile) =>
        profile.aliases.some((alias) => normalizedTagKeys.has(normalizeHolidayTagKey(alias)))
      );
      const hasGenericHolidayTag = tagSet.has("holiday") || normalizedTagKeys.has("holiday");
      const matchedActiveHoliday = activeHolidayProfiles
        .filter((entry) => matchedHolidayProfiles.some((profile) => profile.id === entry.profile.id))
        .sort((a, b) => a.days - b.days)[0] || null;

      // Only apply generic holiday baseline penalty when outside any holiday window.
      if (hasGenericHolidayTag && !activeHolidayProfiles.length) {
        addScore("Holiday baseline penalty", -16);
      }

      if (matchedHolidayProfiles.length) {
        if (matchedActiveHoliday) {
          const boost = Math.max(45, 125 - (matchedActiveHoliday.days * 11));
          addScore(`${matchedActiveHoliday.profile.label} proximity boost`, boost);
        } else {
          // Strongly suppress specific holiday shirts when they do not match the simulated/current holiday window.
          const penalty = activeHolidayProfiles.length ? -220 : -110;
          addScore("Out-of-season specific holiday penalty", penalty);
        }
      }

      if (hasGenericHolidayTag) {
        if (activeHolidayProfiles.length) {
          addScore("Generic holiday support boost", 22);
        } else {
          addScore("Generic holiday out-of-season penalty", -55);
        }
      }

      if (isStarWarsItem && monthIndex === 4 && dayOfMonth === 4) {
        addScore("Star Wars day boost (May 4)", 120);
      }
      if (isMickeyMonday && isMickeyDisneyItem) {
        addScore("Mickey Monday boost", 52);
      }
      if (isWhaleWednesday && isWhaleItem) {
        addScore("Wednesday Whale boost", 58);
      }

      if (lastWornToday) addScore("Already worn today penalty", -200);
      if (isSnoozed) addScore("Snoozed item penalty", -600);

      const reasonParts = [];
      if (wearCount === 0) reasonParts.push("Never worn");
      else if (daysSince !== null) reasonParts.push(`${daysSince}d since last wear`);
      else reasonParts.push("No wear date logged");
      if (price !== null && price > 0) reasonParts.push(`Value ${formatCurrency(price)}`);
      if (condition === "nwt" || condition === "nwot") reasonParts.push(condition.toUpperCase());
      if (isColdMonth && isFlannelLikeText(typeLower)) reasonParts.push("Flannel season boost");
      if (isColdMonth && isHoodieLikeText(typeLower)) reasonParts.push("Hoodie season boost");
      if (isSummerMonth && isFlannelLikeText(typeLower)) reasonParts.push("Flannel summer penalty");
      if (isWarmMonth && isLongSleeveTagged) reasonParts.push("Warm-month long-sleeve penalty");
      if (isSummerMonth && hasSummerPriorityMatch) reasonParts.push("Summer fabric boost");
      if (isMayFlowersMonth && isFloralItem) reasonParts.push("May floral boost");
      if (isFloralItem && isFloralFriday) reasonParts.push("Friday floral boost");
      if (matchedActiveHoliday) reasonParts.push(`${matchedActiveHoliday.profile.label} boost`);
      if (matchedHolidayProfiles.length && !matchedActiveHoliday) reasonParts.push("Out-of-season holiday penalty");
      if (hasGenericHolidayTag && activeHolidayProfiles.length) reasonParts.push("Holiday window boost");
      if (isNationalFlannelDay && isFlannelLikeText(typeLower)) reasonParts.push("National Flannel Day boost");
      if (isTagPopTuesday && (wearCount === 0 || condition === "nwt" || condition === "nwot")) reasonParts.push("Tag Pop Tuesday boost");
      if (isStarWarsItem && monthIndex === 4 && dayOfMonth === 4) reasonParts.push("May 4 boost");
      if (isMickeyMonday && isMickeyDisneyItem) reasonParts.push("Mickey Monday boost");
      if (isWhaleWednesday && isWhaleItem) reasonParts.push("Wednesday Whale boost");
      if (isWhaleItem) reasonParts.push("Whale deprioritized");
      if (hasGenericHolidayTag && !activeHolidayProfiles.length) reasonParts.push("Holiday deprioritized");
      if (daysSince !== null && daysSince >= 180) reasonParts.push("Long idle gap");

      const hasThemeBoost = (isMayFlowersMonth && isFloralItem)
        || (isFloralItem && isFloralFriday)
        || (isMickeyMonday && isMickeyDisneyItem)
        || (isWhaleWednesday && isWhaleItem)
        || (isNationalFlannelDay && isFlannelLikeText(typeLower))
        || (isStarWarsItem && monthIndex === 4 && dayOfMonth === 4)
        || (isTagPopTuesday && (wearCount === 0 || condition === "nwt" || condition === "nwot"));

      let lane = "Rotation pick";
      if (wearCount === 0) lane = "First wear";
      else if (matchedActiveHoliday || hasThemeBoost || (isSummerMonth && hasSummerPriorityMatch) || (isColdMonth && isFlannelLikeText(typeLower)) || (isColdMonth && isHoodieLikeText(typeLower))) lane = "Seasonal window";
      else if (price !== null && price >= 120 && daysSince !== null && daysSince >= 180) lane = "Value wear";
      else if (daysSince !== null && daysSince >= 365) lane = "Deep cut";
      else if (wearCount >= 2 && daysSince !== null && daysSince >= 120) lane = "Safe return";
      const laneKey = String(lane || "rotation-pick").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const laneHint = lane === "First wear"
        ? "New pickup ready for an intentional first spin."
        : lane === "Seasonal window"
          ? "Timing, weather, or event logic makes this a smart moment."
          : lane === "Value wear"
            ? "High-value piece that is worth bringing back on purpose."
            : lane === "Deep cut"
              ? "Long-idle favorite that deserves a fresh look."
              : lane === "Safe return"
                ? "Proven shirt with enough distance to feel fresh again."
                : "Well-rounded pick from the current rotation mix.";

      return {
        key,
        rowId: item.rowId || null,
        tabId: item.tabId || null,
        name,
        tab,
        type,
        lane,
        laneKey,
        laneHint,
        score,
        reason: reasonParts.join(" · "),
        breakdown,
        snoozeUntil,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 10);
};

const markQueueItemWornToday = (queueItem) => {
  if (!queueItem || !queueItem.tabId || !queueItem.rowId) return false;
  const wornDate = new Date(`${new Date().toISOString().slice(0, 10)}T12:00:00`).toISOString();
  const applyWearToRow = (row) => {
    if (!row) return false;
    row.wearCount = (row.wearCount || 0) + 1;
    row.lastWorn = wornDate;
    if (!Array.isArray(row.wearLog)) row.wearLog = [];
    row.wearLog.push(wornDate);
    return true;
  };

  const rowLabel = `${queueItem.name || "Unnamed"} (${queueItem.tab || "Unknown"}) - ${queueItem.type || "Unknown"}`;

  if (tabsState.activeTabId === queueItem.tabId) {
    const target = state.rows.find((row) => row.id === queueItem.rowId);
    if (!applyWearToRow(target)) return false;
    updateShirtUpdateDate();
    saveState();
    renderRows();
    renderFooter();
    addEventLog("Logged wear", rowLabel);
    progressNoBuyRecoveryOnWear();
    return true;
  }

  try {
    const stored = localStorage.getItem(getStorageKey(queueItem.tabId));
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    if (!parsed || !Array.isArray(parsed.rows)) return false;
    const target = parsed.rows.find((row) => row.id === queueItem.rowId);
    if (!applyWearToRow(target)) return false;
    localStorage.setItem(getStorageKey(queueItem.tabId), JSON.stringify(parsed));
    updateShirtUpdateDate();
    scheduleSync();
    addEventLog("Logged wear", rowLabel);
    progressNoBuyRecoveryOnWear();
    return true;
  } catch (error) {
    return false;
  }
};

const heatmapLevelClass = (count, maxCount) => {
  if (!count || maxCount <= 0) return "level-0";
  const ratio = count / maxCount;
  if (ratio <= 0.25) return "level-1";
  if (ratio <= 0.5) return "level-2";
  if (ratio <= 0.75) return "level-3";
  return "level-4";
};

const renderInsightsHeatmap = (stats, year, brandFilter, mount) => {
  if (!mount) return;
  const esc = (str) => String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
  const wearEvents = Array.isArray(stats?.wearEvents) ? stats.wearEvents : [];
  const filteredEvents = wearEvents.filter((event) => {
    const dateKey = String(event.dateKey || "");
    if (!dateKey.startsWith(`${year}-`)) return false;
    if (brandFilter && brandFilter !== "all" && event.tab !== brandFilter) return false;
    return true;
  });

  const countByDate = {};
  const itemKeys = new Set();
  const brandCounts = {};
  filteredEvents.forEach((event) => {
    const key = String(event.dateKey || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
    countByDate[key] = (countByDate[key] || 0) + 1;
    itemKeys.add(getInsightsQueueKey({ name: event.name, tab: event.tab, type: event.type }));
    const brand = String(event.tab || "Unknown").trim() || "Unknown";
    brandCounts[brand] = (brandCounts[brand] || 0) + 1;
  });
  const maxCount = Math.max(0, ...Object.values(countByDate));
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthTotals = monthNames.map((month, idx) => ({ month, count: 0, idx }));
  Object.entries(countByDate).forEach(([dateKey, count]) => {
    const monthIdx = Number(dateKey.slice(5, 7)) - 1;
    if (monthIdx >= 0 && monthIdx < 12) monthTotals[monthIdx].count += Number(count || 0);
  });
  const strongestMonth = monthTotals.slice().sort((a, b) => b.count - a.count || a.idx - b.idx)[0] || null;
  const quietestMonth = monthTotals.slice().sort((a, b) => a.count - b.count || a.idx - b.idx)[0] || null;
  const topBrand = Object.entries(brandCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] || null;

  let html = "";
  html += `<div class="stats-hint">${filteredEvents.length ? `${filteredEvents.length} total wear ${filteredEvents.length === 1 ? "log" : "logs"} in ${year}.` : `No wear logs found for ${year} with the current filter.`}</div>`;
  if (filteredEvents.length) {
    const summaryParts = [
      `${itemKeys.size} unique item${itemKeys.size === 1 ? "" : "s"}`,
      strongestMonth ? `peak ${strongestMonth.month} (${strongestMonth.count})` : "",
      quietestMonth ? `quietest ${quietestMonth.month} (${quietestMonth.count})` : "",
      topBrand ? `top brand ${topBrand[0]} (${topBrand[1]})` : "",
    ].filter(Boolean);
    html += `<div class="stats-hint">${summaryParts.join(" · ")}</div>`;
  }
  html += `<div class="insights-month-grid-wrap">`;
  for (let month = 0; month < 12; month += 1) {
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthStartMon = (firstDay.getDay() + 6) % 7;
    const cells = Array.from({ length: 42 }, () => null);
    let monthCount = 0;
    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const idx = monthStartMon + (day - 1);
      const count = countByDate[dateKey] || 0;
      monthCount += count;
      cells[idx] = { day, count, dateKey };
    }

    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    html += `<div class="insights-month"><div class="insights-month-title"><span>${monthNames[month]}</span>${monthCount > 0 ? `<button type="button" class="insights-month-summary" data-insights-heat-month="${esc(monthKey)}">${monthCount}</button>` : `<span>${monthCount}</span>`}</div><div class="insights-heatmap-weekdays"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div><div class="insights-month-grid">`;
    cells.forEach((cell) => {
      if (!cell) {
        html += `<div class="insights-heat-cell empty"></div>`;
        return;
      }
      const cls = heatmapLevelClass(cell.count, maxCount);
      const title = `${cell.dateKey}: ${cell.count} ${cell.count === 1 ? "wear" : "wears"}`;
      if (cell.count > 0) {
        html += `<button type="button" class="insights-heat-cell ${cls} is-clickable" data-insights-heat-date="${esc(cell.dateKey)}" title="${esc(`${title} • Click to view`)}">${cell.day}</button>`;
      } else {
        html += `<div class="insights-heat-cell ${cls}" title="${esc(title)}">${cell.day}</div>`;
      }
    });
    html += `</div></div>`;
  }
  html += `</div>`;
  mount.innerHTML = html;
  const heatButtons = mount.querySelectorAll("[data-insights-heat-date]");
  heatButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const dateKey = String(button.getAttribute("data-insights-heat-date") || "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return;
      const dayEvents = filteredEvents.filter((event) => String(event.dateKey || "") === dateKey);
      const dateLabel = new Date(`${dateKey}T12:00:00`).toLocaleDateString();
      const filterLabel = brandFilter && brandFilter !== "all" ? ` for ${brandFilter}` : "";
      openWearHistoryDialog(dayEvents, {
        title: `Wear History · ${dateLabel}${filterLabel}`,
        emptySummary: `No wear history logged for ${dateLabel}${filterLabel}.`,
      });
    });
  });
  const monthButtons = mount.querySelectorAll("[data-insights-heat-month]");
  monthButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const monthKey = String(button.getAttribute("data-insights-heat-month") || "");
      if (!/^\d{4}-\d{2}$/.test(monthKey)) return;
      const monthEvents = filteredEvents.filter((event) => String(event.dateKey || "").startsWith(`${monthKey}-`));
      const dateLabel = new Date(`${monthKey}-01T12:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" });
      const filterLabel = brandFilter && brandFilter !== "all" ? ` for ${brandFilter}` : "";
      openWearHistoryDialog(monthEvents, {
        title: `Wear History · ${dateLabel}${filterLabel}`,
        emptySummary: `No wear history logged for ${dateLabel}${filterLabel}.`,
      });
    });
  });
};

const topCountEntry = (counts) => {
  const entries = Object.entries(counts || {});
  if (!entries.length) return null;
  entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return { label: entries[0][0], count: entries[0][1] };
};

const topCountEntries = (counts, limit) => {
  const entries = Object.entries(counts || {});
  if (!entries.length) return [];
  entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return entries.slice(0, Math.max(0, Number(limit) || 0)).map(([label, count]) => ({ label, count }));
};

const longestConsecutiveDateRun = (dateKeys) => {
  if (!Array.isArray(dateKeys) || !dateKeys.length) return 0;
  const sorted = Array.from(new Set(dateKeys)).sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const prevMs = new Date(`${sorted[i - 1]}T00:00:00`).getTime();
    const currMs = new Date(`${sorted[i]}T00:00:00`).getTime();
    if (Number.isNaN(prevMs) || Number.isNaN(currMs)) continue;
    const gap = Math.floor((currMs - prevMs) / 86400000);
    if (gap === 1) run += 1;
    else run = 1;
    if (run > best) best = run;
  }
  return best;
};

const buildStyleDnaPeriod = (stats, startMs, endMs) => {
  const wearEvents = Array.isArray(stats?.wearEvents) ? stats.wearEvents : [];
  const wearableItems = Array.isArray(stats?.wearableItems) ? stats.wearableItems : [];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const itemLookup = {};
  const itemWearTimes = {};
  wearableItems.forEach((item) => {
    const key = getInsightsQueueKey(item);
    if (!itemLookup[key]) itemLookup[key] = item;
    const wearLog = Array.isArray(item.wearLog) ? item.wearLog : [];
    const stamps = wearLog
      .map((stamp) => new Date(stamp).getTime())
      .filter((ms) => !Number.isNaN(ms))
      .sort((a, b) => a - b);
    itemWearTimes[key] = stamps;
  });

  const brandCounts = {};
  const typeCounts = {};
  const fandomCounts = {};
  const tagCounts = {};
  const dayCounts = {};
  const itemCounts = {};
  const spotlightCandidates = [];
  const wearDateKeys = [];
  let totalWears = 0;

  wearEvents.forEach((event) => {
    const wornMs = new Date(event.wornAt).getTime();
    if (Number.isNaN(wornMs) || wornMs < startMs || wornMs > endMs) return;

    totalWears += 1;
    const brand = String(event.tab || "Unknown").trim() || "Unknown";
    const type = String(event.type || "Unknown").trim() || "Unknown";
    brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    typeCounts[type] = (typeCounts[type] || 0) + 1;

    const day = new Date(wornMs).getDay();
    dayCounts[dayNames[day]] = (dayCounts[dayNames[day]] || 0) + 1;
    if (event.dateKey) wearDateKeys.push(event.dateKey);

    const key = getInsightsQueueKey({ name: event.name, tab: event.tab, type: event.type });
    if (!itemCounts[key]) {
      itemCounts[key] = {
        name: event.name || "Unnamed",
        tab: event.tab || "Unknown",
        type: event.type || "Unknown",
        count: 0,
      };
    }
    itemCounts[key].count += 1;

    const meta = itemLookup[key] || null;
    const fandom = String(meta?.fandom || "").trim();
    if (fandom) fandomCounts[fandom] = (fandomCounts[fandom] || 0) + 1;
    const tags = Array.isArray(meta?.tags) ? meta.tags : [];
    tags.forEach((tag) => {
      const clean = String(tag || "").trim();
      if (!clean || clean.toLowerCase() === "original") return;
      tagCounts[clean] = (tagCounts[clean] || 0) + 1;
    });

    // Spotlight wear: highlight a single meaningful wear event even when monthly repeats are rare.
    const wearTimes = itemWearTimes[key] || [];
    let previousWearMs = null;
    for (let i = 0; i < wearTimes.length; i += 1) {
      if (wearTimes[i] < wornMs) previousWearMs = wearTimes[i];
      else break;
    }
    const gapDays = previousWearMs === null ? null : Math.max(0, Math.floor((wornMs - previousWearMs) / 86400000));
    const value = meta && meta.price !== null && meta.price !== undefined && meta.price > 0 ? meta.price : 0;
    const condition = String(meta?.condition || "").trim().toLowerCase();

    let impactScore = 0;
    if (gapDays === null) impactScore += 80;
    else impactScore += Math.min(140, gapDays);
    impactScore += Math.min(26, Math.round(Math.log10(value + 1) * 10));
    if (condition === "nwt" || condition === "nwot") impactScore += 30;

    const lowerTags = new Set(tags.map((tag) => String(tag || "").trim().toLowerCase()));
    const wornDate = new Date(wornMs);
    const wornDay = wornDate.getDay();
    const wornMonth = wornDate.getMonth();
    const wornDayOfMonth = wornDate.getDate();
    if (lowerTags.has("floral") && wornDay === 5) impactScore += 24;
    if (String(meta?.fandom || "").trim().toLowerCase() === "star wars" && wornMonth === 4 && wornDayOfMonth === 4) impactScore += 36;
    if (String(event.name || "").toLowerCase().includes("mickey") && wornDay === 1) impactScore += 24;
    if (lowerTags.has("whale") && wornDay === 3) impactScore += 24;

    const reasons = [];
    if (gapDays === null) reasons.push("First wear logged");
    else reasons.push(`${gapDays}d gap before wear`);
    if (condition === "nwt" || condition === "nwot") reasons.push(condition.toUpperCase());
    if (value > 0) reasons.push(`Value ${formatCurrency(value)}`);

    spotlightCandidates.push({
      name: event.name || "Unnamed",
      tab: event.tab || "Unknown",
      type: event.type || "Unknown",
      impactScore,
      reason: reasons.join(" · "),
    });
  });

  let addsCount = 0;
  let addsSpend = 0;
  wearableItems.forEach((item) => {
    if (!item.createdAt) return;
    const createdMs = new Date(item.createdAt).getTime();
    if (Number.isNaN(createdMs) || createdMs < startMs || createdMs > endMs) return;
    addsCount += 1;
    if (item.price !== null && item.price !== undefined && item.price > 0) {
      addsSpend += item.price;
    }
  });

  const topItem = Object.values(itemCounts)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))[0] || null;
  const spotlightWear = spotlightCandidates
    .sort((a, b) => b.impactScore - a.impactScore || a.name.localeCompare(b.name))[0] || null;

  return {
    totalWears,
    uniqueItems: Object.keys(itemCounts).length,
    topBrand: topCountEntry(brandCounts),
    topType: topCountEntry(typeCounts),
    topFandom: topCountEntry(fandomCounts),
    topTag: topCountEntry(tagCounts),
    topTags: topCountEntries(tagCounts, 3),
    topDay: topCountEntry(dayCounts),
    topItem,
    spotlightWear,
    longestStreak: longestConsecutiveDateRun(wearDateKeys),
    addsCount,
    addsSpend,
  };
};

const formatWrappedTop = (entry) => {
  if (!entry || !entry.label) return "n/a";
  return `${entry.label} (${entry.count || 0})`;
};

const buildWrappedStorySlides = (periodLabel, dna) => {
  const title = `${periodLabel} Wrapped`;
  if (!dna || dna.totalWears === 0) {
    return [{
      title,
      stat: "No wear activity yet",
      narration: "Start logging wears and this recap will automatically turn into a narrated story.",
    }];
  }

  const topBrand = dna.topBrand?.label || "n/a";
  const topType = dna.topType?.label || "n/a";
  const topDay = dna.topDay?.label || "n/a";
  const topDayCount = Number(dna.topDay?.count || 0);
  const spotlightLabel = dna.spotlightWear
    ? `${dna.spotlightWear.name} (${dna.spotlightWear.tab}) - ${dna.spotlightWear.type}`
    : "No standout wear signal yet";
  const topTags = Array.isArray(dna.topTags)
    ? dna.topTags.map((tag) => `${tag.label} (${tag.count})`).join(" · ")
    : "";
  const collectorLesson = dna.addsCount > dna.uniqueItems
    ? "Adds outpaced unique wears, so the smartest move next period is to revive a couple of existing favorites before buying further into the same lane."
    : dna.uniqueItems >= Math.max(12, Math.round(dna.totalWears * 0.65))
      ? "Your rotation breadth stayed healthy, so the best move next period is to keep that spread alive with one deliberate deep cut."
      : "A few lanes carried most of the period, so the best move next period is to give one overlooked in-season piece a protected slot.";

  return [
    {
      title,
      stat: `${dna.totalWears} wears across ${dna.uniqueItems} items`,
      narration: `You logged ${dna.totalWears} wears across ${dna.uniqueItems} unique items. Insight: this is your collector breadth baseline, not a pressure test. Recommendation: next period, intentionally bring one overlooked piece back into the mix when the season or mood fits.`,
    },
    {
      title: "Signature profile",
      stat: `${formatWrappedTop(dna.topBrand)} · ${formatWrappedTop(dna.topType)}`,
      narration: `Your signature lane this period was ${topBrand} + ${topType}. Peak day was ${topDay} with ${topDayCount} logged wear${topDayCount === 1 ? "" : "s"}. Recommendation: use this as your home base, then rotate one contrast piece in when you want range without losing your core vibe.`,
    },
    {
      title: "Spotlight wear",
      stat: spotlightLabel,
      narration: dna.spotlightWear
        ? `Why this popped: ${dna.spotlightWear.reason}. Insight: spotlight combines dormancy gap, item value, and condition/event boosts to identify meaningful collector wears. Recommendation: give one long-idle favorite another intentional slot this season.`
        : "No standout wear signal yet. Recommendation: when the right occasion shows up, bring back one high-value or long-idle piece to create a stronger spotlight signal.",
    },
    {
      title: "Momentum",
      stat: `${dna.longestStreak} day streak · ${dna.addsCount} adds · ${formatCurrency(dna.addsSpend)} spend`,
      narration: `Momentum tracks consistency (streak), intake (adds), and investment (spend). You peaked at a ${dna.longestStreak}-day streak with ${dna.addsCount} add${dna.addsCount === 1 ? "" : "s"}. Recommendation: if adds are rising faster than wears, use the queue to deliberately bring an existing piece back before buying into the same lane again.`,
    },
    {
      title: "Top tags",
      stat: topTags || "n/a",
      narration: topTags
        ? "These tags describe your strongest wearable themes this period. Insight: repeated tags reveal reliable collector identities. Recommendation: pair one top tag with a less-used tag on a future wear to widen range without losing the plot."
        : "No dominant tag signal yet. Recommendation: add intentional tags to future wears so your story mode can detect stronger style patterns.",
    },
    {
      title: "Flavor check",
      stat: `${dna.topFandom?.label || "n/a"} fandom · ${dna.topTag?.label || "n/a"} tag`,
      narration: `Flavor check is your style identity snapshot, not a score. It combines fandom signal (${dna.topFandom?.label || "n/a"}) with your strongest tag signal (${dna.topTag?.label || "n/a"}) to show what your closet "voice" sounded like this period. Recommendation: keep one flavor anchor, then rotate one deep-cut alternative when you want freshness without losing identity.`,
    },
    {
      title: "Collector lesson",
      stat: `${dna.uniqueItems} unique items · ${dna.addsCount} adds`,
      narration: collectorLesson,
    },
  ];
};

const buildWrappedPeriodOptions = (stats, now = new Date()) => {
  const wearEvents = Array.isArray(stats?.wearEvents) ? stats.wearEvents : [];
  const wearableItems = Array.isArray(stats?.wearableItems) ? stats.wearableItems : [];
  const nowMs = now.getTime();
  const candidateTimes = [];

  wearEvents.forEach((event) => {
    const wornMs = new Date(event?.wornAt).getTime();
    if (Number.isFinite(wornMs)) candidateTimes.push(wornMs);
  });
  wearableItems.forEach((item) => {
    const createdMs = new Date(item?.createdAt).getTime();
    if (Number.isFinite(createdMs)) candidateTimes.push(createdMs);
  });

  const earliestMs = candidateTimes.length ? Math.min(...candidateTimes) : nowMs;
  const earliestDate = new Date(earliestMs);
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const earliestMonthStart = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
  const monthOptions = [];
  const yearOptions = [];

  for (let cursor = new Date(currentMonthStart); cursor >= earliestMonthStart; cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)) {
    const startMs = cursor.getTime();
    const nextMonthStartMs = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1).getTime();
    monthOptions.push({
      key: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`,
      label: cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
      startMs,
      endMs: Math.min(nowMs, nextMonthStartMs - 1),
    });
  }

  for (let year = now.getFullYear(); year >= earliestDate.getFullYear(); year -= 1) {
    const startMs = new Date(year, 0, 1).getTime();
    const nextYearStartMs = new Date(year + 1, 0, 1).getTime();
    yearOptions.push({
      key: String(year),
      label: String(year),
      startMs,
      endMs: Math.min(nowMs, nextYearStartMs - 1),
    });
  }

  return {
    month: monthOptions.length ? monthOptions : [{ key: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`, label: now.toLocaleDateString(undefined, { month: "long", year: "numeric" }), startMs: currentMonthStart.getTime(), endMs: nowMs }],
    year: yearOptions.length ? yearOptions : [{ key: String(now.getFullYear()), label: String(now.getFullYear()), startMs: new Date(now.getFullYear(), 0, 1).getTime(), endMs: nowMs }],
  };
};

const openInsightsDialog = (stats, options = {}) => {
  let dialog = document.getElementById("insights-dialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "insights-dialog";
    dialog.innerHTML = `
      <div class="dialog-body">
        <h3>Insights</h3>
        <div id="insights-content" class="insights-content"></div>
      </div>
      <div class="dialog-actions">
        <button type="button" id="insights-close" class="btn">Close</button>
      </div>
    `;
    document.body.appendChild(dialog);

    const bindClick = (el, handler) => {
      if (!el) return;
      el.addEventListener("click", handler);
    };
    const closeButton = dialog.querySelector("#insights-close");
    bindClick(closeButton, () => {
      closeDialog(dialog);
    });
  }

  const content = dialog.querySelector("#insights-content");
  if (!content) return;
  content.textContent = "";

  const esc = (str) => String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
  const section = (title, bodyHtml) => `<div class="stats-section"><div class="stats-section-title">${esc(title)}</div>${bodyHtml}</div>`;
  const toneClass = (tone) => (tone === "good" ? "tone-good" : tone === "bad" ? "tone-bad" : "");
  const insightValue = (valueHtml, tone) => `<div class="insights-score-value${toneClass(tone) ? ` ${toneClass(tone)}` : ""}">${valueHtml}</div>`;

  if (!stats || !stats.isInventory) {
    content.innerHTML = `<div class="stats-hint">Insights are currently available in Inventory mode.</div>`;
    openDialog(dialog);
    if (!options.preserveScroll) {
      resetDialogScroll(dialog);
    }
    return;
  }

  const activeSimDateKey = /^\d{4}-\d{2}-\d{2}$/.test(String(options.simDateKey || ""))
    ? String(options.simDateKey)
    : localDateKeyFromDate(new Date());
  dialog.setAttribute("data-sim-date-key", activeSimDateKey);
  const snoozes = loadInsightsSnoozes();
  const queue = buildWearNextQueue(stats, snoozes, { simDateKey: activeSimDateKey });
  const behavior = buildBehaviorInsights(stats, queue);
  const health = stats.advanced?.closetHealth || null;
  const inactive = stats.advanced?.inactiveCapital || null;
  const adoption = stats.advanced?.newItemAdoption || null;

  const now = new Date();
  const monthStartMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const yearStartMs = new Date(now.getFullYear(), 0, 1).getTime();
  const nowMs = now.getTime();
  const monthLabel = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const yearLabel = String(now.getFullYear());
  const wrappedPeriodOptions = buildWrappedPeriodOptions(stats, now);
  const monthDna = buildStyleDnaPeriod(stats, monthStartMs, nowMs);
  const yearDna = buildStyleDnaPeriod(stats, yearStartMs, nowMs);
  const workLane = buildTaggedLaneStats(stats?.wearableItems || [], ["workappropriate", "work appropriate"], { nowMs });
  const formalLane = buildTaggedLaneStats(stats?.wearableItems || [], ["formal"], { nowMs });

  const renderDnaCard = (title, dna) => {
    if (!dna || dna.totalWears === 0) {
      return `<div class="insights-score-card"><div class="insights-score-title">${esc(title)}</div><div class="insights-score-note">No wear activity logged yet for this period.</div></div>`;
    }
    const spotlightLabel = dna.spotlightWear
      ? `${dna.spotlightWear.name} (${dna.spotlightWear.tab}) - ${dna.spotlightWear.type}`
      : "n/a";
    const peakDayLabel = dna.topDay
      ? `${dna.topDay.label} (${dna.topDay.count} wear${dna.topDay.count === 1 ? "" : "s"})`
      : "n/a";
    return `<div class="insights-score-card">
      <div class="insights-score-title">${esc(title)}</div>
      <div class="insights-score-value">${dna.totalWears} wears · ${dna.uniqueItems} items</div>
      <div class="insights-score-note">Top brand: ${esc(dna.topBrand ? `${dna.topBrand.label} (${dna.topBrand.count})` : "n/a")}</div>
      <div class="insights-score-note">Top type: ${esc(dna.topType ? `${dna.topType.label} (${dna.topType.count})` : "n/a")}</div>
      <div class="insights-score-note">Spotlight wear: ${esc(spotlightLabel)}</div>
      <div class="insights-score-note">${esc(dna.spotlightWear ? dna.spotlightWear.reason : "No standout wear signal yet")}</div>
      <div class="insights-score-note">Peak day (most logged wears): ${esc(peakDayLabel)} · Best streak: ${dna.longestStreak} days</div>
      <div class="insights-score-note">Adds: ${dna.addsCount} · Spend: ${formatCurrency(dna.addsSpend)}</div>
      <div class="insights-score-note">Top fandom: ${esc(dna.topFandom ? dna.topFandom.label : "n/a")} · Top tag: ${esc(dna.topTag ? dna.topTag.label : "n/a")}</div>
    </div>`;
  };

  const renderBehaviorInsights = () => {
    const volatility = behavior?.volatility || { score: 0, label: "n/a", weeklyDrifts: [], latestShift: 0 };
    const persona = behavior?.persona || null;
    const exploration = behavior?.exploration || { pct: 0, trend: 0, coreTypes: [], windowTotal: 0 };
    const rotationModel = behavior?.rotationModel || {
      closetSize: 0,
      annualCoveragePct: 0,
      covered365Count: 0,
      tierA: { count: 0, pct: 0 },
      tierB: { count: 0, pct: 0 },
      tierC: { count: 0, pct: 0 },
      coverageScore: 0,
      tierBalanceScore: 0,
      expectedTouchesPerMonth: 0,
      actualTouchesPerMonth: 0,
      eligibleBacklogCount: 0,
      neverWornEligibleCount: 0,
      adjustedBacklogPct: 0,
      graceCount: 0,
      seasonalExemptCount: 0,
      topBrandDominance: null,
      parkedValueSplit: { intentional: { count: 0, value: 0 }, uncertain: { count: 0, value: 0 } },
    };
    const fatigue = behavior?.fatigue || { count: 0, themes: [] };
    const friction = behavior?.friction || { avgAcceptance: 0, highFrictionDays: 0, worstDay: null, weekdayRows: [], totalDays: 0 };
    const valueRecovery = behavior?.valueRecovery || { candidates: [], totalRecoveryWears: 0, cadencePerDay: 0.12 };
    const confidence = behavior?.confidence || { avgConfidence: 0, lowConfidence: [], totalTracked: 0 };
    const adaptive = behavior?.adaptive || { boosts: [], suppressions: [], sampleSize: 0 };
    const reactivation = behavior?.reactivation || { playbook: [] };
    const sellSuggestions = Array.isArray(behavior?.sellSuggestions) ? behavior.sellSuggestions : [];
    const marketplaceTags = behavior?.marketplaceTags || {
      bst: { label: "BST", count: 0, neverWorn: 0, inactive180: 0, totalValue: 0, avgCpw: null },
      ebay: { label: "eBay", count: 0, neverWorn: 0, inactive180: 0, totalValue: 0, avgCpw: null },
      mercari: { label: "Mercari", count: 0, neverWorn: 0, inactive180: 0, totalValue: 0, avgCpw: null },
      xxchange: { label: "XXChange", count: 0, neverWorn: 0, inactive180: 0, totalValue: 0, avgCpw: null },
    };
    const marketplaceRows = [marketplaceTags.bst, marketplaceTags.ebay, marketplaceTags.mercari, marketplaceTags.xxchange];
    const comeback = Array.isArray(behavior?.comebackCandidates) ? behavior.comebackCandidates : [];
    const bench = Array.isArray(behavior?.benchPressure) ? behavior.benchPressure : [];
    const driftPreview = Array.isArray(volatility.weeklyDrifts) && volatility.weeklyDrifts.length
      ? volatility.weeklyDrifts.slice(-6).join(" · ")
      : "n/a";
    const trendLabel = exploration.trend === 0
      ? "flat"
      : exploration.trend > 0
        ? `+${exploration.trend} pts vs prior 30d`
        : `${exploration.trend} pts vs prior 30d`;
    const benchAvgRate = bench.length
      ? Math.round(bench.reduce((sum, item) => sum + item.selectionRate, 0) * 100 / bench.length)
      : 0;
    const fatigueLead = Array.isArray(fatigue.themes) && fatigue.themes.length
      ? `${fatigue.themes[0].label} (-${fatigue.themes[0].drop} pts)`
      : "n/a";
    const frictionWorstLabel = friction.worstDay
      ? `${friction.worstDay.dateKey} (${Math.round(friction.worstDay.acceptance * 100)}%)`
      : "n/a";
    const recoveryLead = Array.isArray(valueRecovery.candidates) && valueRecovery.candidates.length
      ? `${valueRecovery.candidates[0].name} (${Math.round(valueRecovery.candidates[0].currentCpw)}/wear)`
      : "n/a";
    const confidenceLead = Array.isArray(confidence.lowConfidence) && confidence.lowConfidence.length
      ? `${confidence.lowConfidence[0].name} (${confidence.lowConfidence[0].confidenceScore})`
      : "n/a";
    const adaptiveBoostLabel = Array.isArray(adaptive.boosts) && adaptive.boosts.length
      ? `${adaptive.boosts[0].type} (${Math.round(adaptive.boosts[0].rate * 100)}%)`
      : "n/a";
    const playbookCount = Array.isArray(reactivation.playbook) ? reactivation.playbook.length : 0;
    const sellLead = sellSuggestions.length
      ? `${sellSuggestions[0].name} (${sellSuggestions[0].actionLabel})`
      : "n/a";
    const marketSummary = marketplaceRows
      .map((row) => `${row.label} ${row.count}`)
      .join(" · ");
    const marketValueTotal = marketplaceRows
      .reduce((sum, row) => sum + Number(row.totalValue || 0), 0);
    const marketplaceTaggedCount = marketplaceRows.reduce((sum, row) => sum + Number(row.count || 0), 0);
    const marketplaceKeeperCount = marketplaceRows.reduce((sum, row) => sum + Number(row.strongKeepers || 0), 0);
    const marketplaceInactiveCount = marketplaceRows.reduce((sum, row) => sum + Number(row.inactive180 || 0), 0);
    const marketplaceAvgWears = marketplaceTaggedCount
      ? Math.round((marketplaceRows.reduce((sum, row) => sum + (Number(row.avgWears || 0) * Number(row.count || 0)), 0) / marketplaceTaggedCount) * 10) / 10
      : 0;
    const marketplaceKeeperPct = marketplaceTaggedCount ? Math.round((marketplaceKeeperCount / marketplaceTaggedCount) * 100) : 0;
    const dominanceLabel = rotationModel.topBrandDominance
      ? `${rotationModel.topBrandDominance.label} (${rotationModel.topBrandDominance.sharePct}% of last-year wears)`
      : "No dominant brand lane yet";

    const volatilityTone = volatility.score <= 24 ? "good" : volatility.score >= 44 ? "bad" : "";
    const personaTone = persona && persona.similarity >= 70 ? "good" : persona && persona.similarity < 45 ? "bad" : "";
    const explorationTone = exploration.pct >= 12 && exploration.pct <= 58 ? "good" : exploration.pct < 6 || exploration.pct > 72 ? "bad" : "";
    const benchTone = bench.length <= 2 ? "good" : bench.length >= 6 ? "bad" : "";
    const fatigueTone = fatigue.count <= 1 ? "good" : fatigue.count >= 4 ? "bad" : "";
    const frictionTone = friction.avgAcceptance >= 24 ? "good" : friction.avgAcceptance < 12 ? "bad" : "";
    const recoveryTone = valueRecovery.totalRecoveryWears <= 14 ? "good" : valueRecovery.totalRecoveryWears >= 34 ? "bad" : "";
    const confidenceTone = confidence.avgConfidence >= 70 ? "good" : confidence.avgConfidence < 45 ? "bad" : "";
    const adaptiveTone = adaptive.sampleSize >= 5 ? "good" : adaptive.sampleSize <= 1 ? "bad" : "";
    const playbookTone = playbookCount <= 3 ? "good" : playbookCount >= 7 ? "bad" : "";
    const sellTone = sellSuggestions.length <= 1 ? "good" : sellSuggestions.length >= 3 ? "bad" : "";
    const coverageTone = rotationModel.coverageScore >= 65 ? "good" : rotationModel.coverageScore < 35 ? "bad" : "";
    const adjustedBacklogTone = rotationModel.adjustedBacklogPct <= 18 ? "good" : rotationModel.adjustedBacklogPct >= 34 ? "bad" : "";

    const comebackByKey = {};
    comeback.forEach((item) => {
      if (!item?.key) return;
      comebackByKey[item.key] = item;
    });
    const benchByKey = {};
    bench.forEach((item) => {
      if (!item?.key) return;
      benchByKey[item.key] = item;
    });
    const coreTypes = new Set(Array.isArray(exploration.coreTypes) ? exploration.coreTypes : []);

    const wildcard = queue
      .map((item) => {
        let score = Number(item.score || 0);
        const reasons = [];
        const comebackHit = comebackByKey[item.key] || null;
        const benchHit = benchByKey[item.key] || null;
        const isCoreType = coreTypes.has(String(item.type || ""));

        if (comebackHit) {
          score += Math.min(48, (Number(comebackHit.daysSince) || 0) * 0.35) + 10;
          reasons.push(`${comebackHit.daysSince}d idle comeback candidate`);
        }
        if (benchHit) {
          score += Math.round((1 - (benchHit.selectionRate || 0)) * 36) + Math.min(16, (benchHit.exposures || 0) * 2);
          reasons.push(`high bench pressure (${benchHit.exposures}x seen)`);
        }
        if (monthDna?.topBrand?.label && item.tab === monthDna.topBrand.label) {
          score += 12;
          reasons.push("matches current top brand lane");
        }
        if (monthDna?.topType?.label && item.type === monthDna.topType.label) {
          score += 10;
          reasons.push("matches current top type lane");
        }
        if (exploration.pct < 22 && !isCoreType) {
          score += 18;
          reasons.push("pushes exploration beyond core types");
        }
        if (exploration.pct > 48 && isCoreType) {
          score += 10;
          reasons.push("stabilizes after high exploration");
        }
        if (volatility.label === "Volatile" && isCoreType) {
          score += 14;
          reasons.push("calms volatile rotation pattern");
        }
        if (volatility.label === "Stable" && !isCoreType) {
          score += 12;
          reasons.push("adds novelty to stable pattern");
        }

        return {
          ...item,
          wildcardScore: Math.round(score),
          wildcardReasons: reasons,
        };
      })
      .sort((a, b) => b.wildcardScore - a.wildcardScore || a.name.localeCompare(b.name))[0] || null;

    const wildcardReasonText = wildcard
      ? (wildcard.wildcardReasons.length ? wildcard.wildcardReasons.slice(0, 2).join(" · ") : "high combined queue priority signal")
      : "n/a";

    return section(
      "Behavior & coaching",
      `<div class="stats-hint">Why rotation patterns shifted and what to do next, calibrated for a large collector closet rather than a daily-uniform wardrobe.</div>
      <div class="insights-score-grid">
        <div class="insights-score-card">
          <div class="insights-score-title">Rotation volatility</div>
          ${insightValue(`${volatility.score}/100 (${esc(volatility.label)})`, volatilityTone)}
          <div class="insights-score-note">Week-to-week type drift (last 12 weeks). Higher means sharper rotation swings.</div>
          <div class="insights-score-note">Recent drift points: ${esc(driftPreview)}</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">Weekday vs weekend persona</div>
          ${insightValue(persona ? `${persona.similarity}% match` : "n/a", personaTone)}
          <div class="insights-score-note">Weekday: ${esc(persona ? `${persona.weekday.topBrand} · ${persona.weekday.topType}` : "n/a")}</div>
          <div class="insights-score-note">Weekend: ${esc(persona ? `${persona.weekend.topBrand} · ${persona.weekend.topType}` : "n/a")}</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">Style exploration ratio</div>
          ${insightValue(`${exploration.pct}% exploratory wears`, explorationTone)}
          <div class="insights-score-note">Core style baseline: ${esc(exploration.coreTypes.length ? exploration.coreTypes.join(" · ") : "n/a")}</div>
          <div class="insights-score-note">Trend: ${esc(trendLabel)}</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">Bench pressure</div>
          ${insightValue(`${bench.length} queued-but-skipped items`, benchTone)}
          <div class="insights-score-note">Average selection rate: ${benchAvgRate}%</div>
          <div class="insights-score-note">High pressure now leans more on explicit snoozes and repeated real passes, not casual queue browsing.</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">Annual coverage index</div>
          ${insightValue(`${rotationModel.coverageScore}/100 (${rotationModel.annualCoveragePct}% touched)`, coverageTone)}
          <div class="insights-score-note">${rotationModel.covered365Count}/${rotationModel.closetSize} wearable items worn at least once in the last 365 days.</div>
          <div class="insights-score-note">Collector-normal target pace: ~${rotationModel.expectedTouchesPerMonth} unique touches per month.</div>
          <div class="insights-score-note">Your recent pace: ~${rotationModel.actualTouchesPerMonth} unique touches per month.</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">Wildcard pick of the week</div>
          <div class="insights-score-value">${wildcard ? esc(wildcard.name) : "n/a"}</div>
          <div class="insights-score-note">${wildcard ? `${esc(wildcard.tab)} · ${esc(wildcard.type || "Unknown")} · score ${wildcard.wildcardScore}` : "No eligible item yet. Add wear data or queue signals to generate a wildcard."}</div>
          <div class="insights-score-note">Why this pick: ${esc(wildcardReasonText)}.</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">Opportunity-adjusted backlog</div>
          ${insightValue(`${rotationModel.neverWornEligibleCount}/${rotationModel.eligibleBacklogCount} (${rotationModel.adjustedBacklogPct}%)`, adjustedBacklogTone)}
          <div class="insights-score-note">Excludes <120d adds, Whale/sentimental/archive items, and out-of-season exempt pieces.</div>
          <div class="insights-score-note">Grace window items (not penalized yet): ${rotationModel.graceCount}.</div>
          <div class="insights-score-note">Target pace is learned from your recent collector cadence, not a generic closet rule.</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">Theme fatigue detector</div>
          ${insightValue(`${fatigue.count} fading theme${fatigue.count === 1 ? "" : "s"}`, fatigueTone)}
          <div class="insights-score-note">Lead fade: ${esc(fatigueLead)}</div>
          <div class="insights-score-note">Signals where previously strong fandom/tag themes are cooling off in recent wear windows.</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">Decision friction</div>
          ${insightValue(`${friction.avgAcceptance}% queue acceptance`, frictionTone)}
          <div class="insights-score-note">${friction.highFrictionDays} high-friction day${friction.highFrictionDays === 1 ? "" : "s"} in last ${friction.totalDays} tracked days</div>
          <div class="insights-score-note">Worst day: ${esc(frictionWorstLabel)}</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">Value recovery forecast</div>
          ${insightValue(`${valueRecovery.totalRecoveryWears} wears to recover`, recoveryTone)}
          <div class="insights-score-note">Collector cadence: ${valueRecovery.cadencePerDay.toFixed(2)} wears/day</div>
          <div class="insights-score-note">Lead recovery target: ${esc(recoveryLead)}</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">Outfit confidence curve</div>
          ${insightValue(`${confidence.avgConfidence}/100 avg confidence`, confidenceTone)}
          <div class="insights-score-note">Items tracked: ${confidence.totalTracked} · low-confidence picks: ${Array.isArray(confidence.lowConfidence) ? confidence.lowConfidence.length : 0}</div>
          <div class="insights-score-note">Most fragile signal: ${esc(confidenceLead)}</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">Top brand lane</div>
          ${insightValue(esc(dominanceLabel), rotationModel.topBrandDominance && rotationModel.topBrandDominance.sharePct >= 38 ? "bad" : rotationModel.topBrandDominance && rotationModel.topBrandDominance.sharePct <= 24 ? "good" : "")}
          <div class="insights-score-note">Helps catch variety drift when one brand quietly starts carrying too much of the year.</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">Adaptive queue profile</div>
          ${insightValue(`${adaptive.sampleSize} type signals`, adaptiveTone)}
          <div class="insights-score-note">Top boost: ${esc(adaptiveBoostLabel)}</div>
          <div class="insights-score-note">Uses actual queue selection rates to suggest what to amplify or cool down.</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">7-day reactivation plan</div>
          ${insightValue(`${playbookCount} planned wears`, playbookTone)}
          <div class="insights-score-note">Built from comeback, bench pressure, and value-recovery priorities.</div>
          <div class="insights-score-note">Goal: re-activate dormant value without queue overload.</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">Sell / review shortlist</div>
          ${insightValue(`${sellSuggestions.length} candidate${sellSuggestions.length === 1 ? "" : "s"}`, sellTone)}
          <div class="insights-score-note">Top pick: ${esc(sellLead)}</div>
          <div class="insights-score-note">Blend of inactivity, bench pressure, confidence risk, and cost-per-wear drag, with review-first handling for borderline cases.</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">Marketplace tags</div>
          <div class="insights-score-value">${esc(marketSummary)}</div>
          <div class="insights-score-note">Tagged value: ${formatCurrency(marketValueTotal)}</div>
          <div class="insights-score-note">Tracks inventory load, inactivity, and value tied up in marketplace-marked items.</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">Marketplace keepers</div>
          ${insightValue(`${marketplaceKeeperPct}% keeper rate`, marketplaceKeeperPct >= 45 ? "good" : marketplaceKeeperPct <= 20 ? "bad" : "")}
          <div class="insights-score-note">${marketplaceKeeperCount}/${marketplaceTaggedCount || 0} tagged items still perform like clear keepers.</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">Marketplace drag</div>
          ${insightValue(`${marketplaceInactiveCount} parked · ${marketplaceAvgWears} avg wears`, marketplaceInactiveCount <= 2 ? "good" : marketplaceInactiveCount >= 6 ? "bad" : "")}
          <div class="insights-score-note">Shows how many marketplace-tagged pieces are sitting idle instead of earning their spot.</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">Work-ready coverage</div>
          ${insightValue(`${workLane.total} items · ${workLane.active365} active`, workLane.activePct >= 60 ? "good" : workLane.total && workLane.activePct <= 30 ? "bad" : "")}
          <div class="insights-score-note">${workLane.neverWorn} never worn · top brand ${esc(workLane.topBrand)} · top type ${esc(workLane.topType)}</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">Formal coverage</div>
          ${insightValue(`${formalLane.total} items · ${formalLane.active365} active`, formalLane.activePct >= 60 ? "good" : formalLane.total && formalLane.activePct <= 30 ? "bad" : "")}
          <div class="insights-score-note">${formalLane.neverWorn} never worn · top brand ${esc(formalLane.topBrand)} · top type ${esc(formalLane.topType)}</div>
        </div>
      </div>
      <div class="stats-section-title" style="margin-top:8px">Collector-normal rotation model</div>
      <div class="stats-hint">These metrics are calibrated for large low-frequency closets (1-2 wears per item/year) instead of daily-use assumptions.</div>
      <div class="insights-action-list">
        <div class="stats-row stats-sub"><span class="stats-label">Tier A (worn last 365d)</span><span class="stats-value">${rotationModel.tierA.count} items (${rotationModel.tierA.pct}%)</span></div>
        <div class="stats-row stats-sub"><span class="stats-label">Tier B (worn 366-730d ago)</span><span class="stats-value">${rotationModel.tierB.count} items (${rotationModel.tierB.pct}%)</span></div>
        <div class="stats-row stats-sub"><span class="stats-label">Tier C (dormant >730d)</span><span class="stats-value">${rotationModel.tierC.count} items (${rotationModel.tierC.pct}%)</span></div>
        <div class="stats-row stats-sub"><span class="stats-label">Tier balance score</span><span class="stats-value">${rotationModel.tierBalanceScore}/100</span></div>
        <div class="stats-row stats-sub"><span class="stats-label">Seasonal exemptions this cycle</span><span class="stats-value">${rotationModel.seasonalExemptCount} items</span></div>
        <div class="stats-row stats-sub"><span class="stats-label">Top brand lane</span><span class="stats-value">${esc(dominanceLabel)}</span></div>
      </div>
      <div class="stats-section-title" style="margin-top:8px">Comeback candidates</div>
      <div class="stats-hint">Historically strong items now cooling off over a real collector interval; useful when you want safe re-entry pieces without overreacting to normal rotation gaps (protected archive/sentimental/Whale items are excluded).</div>
      ${comeback.length
    ? `<div class="insights-action-list">${comeback.map((item, idx) => `<div class="stats-row stats-sub"><span class="stats-label">${idx + 1}. ${esc(item.name)} (${esc(item.tab)}) - ${esc(item.type)}</span><span class="stats-value">${item.daysSince}d idle · ${item.wearCount} wears</span></div>`).join("")}</div>`
    : `<div class="stats-hint">No strong comeback candidates yet. This list appears after an item has both solid history and a cooldown gap.</div>`}
      <div class="stats-section-title" style="margin-top:8px">Theme fatigue watchlist</div>
      <div class="stats-hint">Detects fandom/tag themes that were strong earlier but dropped in recent wear share.</div>
      ${Array.isArray(fatigue.themes) && fatigue.themes.length
    ? `<div class="insights-action-list">${fatigue.themes.map((theme, idx) => `<div class="stats-row stats-sub"><span class="stats-label">${idx + 1}. ${esc(theme.label)} (${esc(theme.family)})</span><span class="stats-value">${theme.priorShare}% -> ${theme.recentShare}% (${theme.drop}pt drop)</span></div>`).join("")}</div>`
    : `<div class="stats-hint">No strong fatigue signals yet. This fills in once a theme was previously dominant and then cooled.</div>`}
      <div class="stats-section-title" style="margin-top:8px">Decision friction heatmap (last 28 days)</div>
      <div class="stats-hint">Shows where queue suggestions and actual choices diverge, by acceptance rate and weekday hotspots.</div>
      ${Array.isArray(friction.weekdayRows) && friction.weekdayRows.length
    ? `<div class="insights-action-list">${friction.weekdayRows.map((row, idx) => `<div class="stats-row stats-sub"><span class="stats-label">${idx + 1}. ${esc(row.label)} friction hotspot</span><span class="stats-value">${row.acceptance}% acceptance (${row.exposures} exposures)</span></div>`).join("")}</div>`
    : `<div class="stats-hint">Not enough queue telemetry yet for friction hotspots. This populates as queue exposures and selections accumulate.</div>`}
      <div class="stats-section-title" style="margin-top:8px">Value recovery targets</div>
      <div class="stats-hint">High cost-per-wear items that still look meaningfully under-realized for a collector closet. Recent wears and brand-new additions are intentionally filtered out.</div>
      ${Array.isArray(valueRecovery.candidates) && valueRecovery.candidates.length
    ? `<div class="insights-action-list">${valueRecovery.candidates.slice(0, 5).map((item, idx) => `<div class="stats-row stats-sub"><span class="stats-label">${idx + 1}. ${esc(item.name)} (${esc(item.tab)}) - ${esc(item.type)}</span><span class="stats-value">${Math.round(item.currentCpw)}/wear -> ${Math.round(item.targetCpw)}/wear · +${item.additionalWears} wears (~${item.etaDays}d)</span></div>`).join("")}</div>`
    : `<div class="stats-hint">No value recovery backlog right now. Items here appear when cost-per-wear is still far above target.</div>`}
      <div class="stats-section-title" style="margin-top:8px">Outfit confidence low-signal items</div>
      <div class="stats-hint">Items with weak repeat confidence based on actual repeat evidence, very long gaps, and explicit queue push-away signals. Collector-normal yearly spacing is treated more gently here.</div>
      ${Array.isArray(confidence.lowConfidence) && confidence.lowConfidence.length
    ? `<div class="insights-action-list">${confidence.lowConfidence.map((item, idx) => `<div class="stats-row stats-sub"><span class="stats-label">${idx + 1}. ${esc(item.name)} (${esc(item.tab)}) - ${esc(item.type)}</span><span class="stats-value">Confidence ${item.confidenceScore} · ${esc(item.reasonText || "low signal")} · ${item.daysSince === null ? "no recent wear" : `${item.daysSince}d since wear`}</span></div>`).join("")}</div>`
    : `<div class="stats-hint">Confidence curve is healthy. Low-signal list appears when a worn item drifts into weak repeat confidence.</div>`}
      <div class="stats-section-title" style="margin-top:8px">Adaptive queue recommendations</div>
      <div class="stats-hint">Type-level boost/cool suggestions derived from actual queue exposure vs selection outcomes.</div>
      ${(Array.isArray(adaptive.boosts) && adaptive.boosts.length) || (Array.isArray(adaptive.suppressions) && adaptive.suppressions.length)
    ? `<div class="insights-action-list">${(adaptive.boosts || []).map((row, idx) => `<div class="stats-row stats-sub"><span class="stats-label">Boost ${idx + 1}: ${esc(row.type)}</span><span class="stats-value">${Math.round(row.rate * 100)}% pick rate (${row.exposures} exposures)</span></div>`).join("")}${(adaptive.suppressions || []).map((row, idx) => `<div class="stats-row stats-sub"><span class="stats-label">Cool ${idx + 1}: ${esc(row.type)}</span><span class="stats-value">${Math.round(row.rate * 100)}% pick rate (${row.exposures} exposures)</span></div>`).join("")}</div>`
    : `<div class="stats-hint">Need more queue telemetry for adaptive tuning. Keep using Wear-next and Worn today to train this section.</div>`}
      <div class="stats-section-title" style="margin-top:8px">7-day reactivation playbook</div>
      <div class="stats-hint">A one-week sequence built from pressure/recovery signals to restart dormant rotation without dragging protected collector pieces into the plan.</div>
      ${Array.isArray(reactivation.playbook) && reactivation.playbook.length
    ? `<div class="insights-action-list">${reactivation.playbook.map((item, idx) => `<div class="stats-row stats-sub"><span class="stats-label">Day ${idx + 1}: ${esc(item.name)} (${esc(item.tab)}) - ${esc(item.type)}</span><span class="stats-value">${esc(item.reason)}</span></div>`).join("")}</div>`
    : `<div class="stats-hint">No playbook generated yet. It appears once queue + comeback + pressure signals have enough overlap.</div>`}
      <div class="stats-section-title" style="margin-top:8px">Sell / review shortlist</div>
      <div class="stats-hint">Multi-factor candidates for potential offloading, combining inactivity, confidence risk, pressure, and CPW drag. Borderline cases are framed as review first, not automatic sell calls (protected archive/sentimental/Whale items are excluded).</div>
      ${sellSuggestions.length
    ? `<div class="insights-action-list">${sellSuggestions.map((item, idx) => `<div class="stats-row stats-sub"><span class="stats-label">${idx + 1}. ${esc(item.name)} (${esc(item.tab)}) - ${esc(item.type)}</span><span class="stats-value">${esc(item.actionLabel)} · score ${item.score} · ${item.daysSince === null ? "no last-worn date" : `${item.daysSince}d idle`} · ${item.wearCount} wears</span></div>`).join("")}</div>`
    : `<div class="stats-hint">No strong sell signals right now. This shortlist appears when multi-factor risk is high enough.</div>`}
      <div class="stats-section-title" style="margin-top:8px">Marketplace tag details</div>
      <div class="stats-hint">Breaks down marketplace-tagged inventory by load, inactivity, value concentration, and whether tagged pieces still perform well enough to keep.</div>
      <div class="insights-action-list">${marketplaceRows.map((row, idx) => `<div class="stats-row stats-sub"><span class="stats-label">${idx + 1}. ${esc(row.label)}</span><span class="stats-value">${row.count} items · ${row.neverWorn} never worn · ${row.inactive180} inactive >180d · ${formatCurrency(row.totalValue || 0)} value · ${row.avgWears === null ? "n/a" : `${row.avgWears} avg wears`} · ${row.strongKeepers} keeper${row.strongKeepers === 1 ? "" : "s"}</span></div>`).join("")}</div>
      <div class="stats-section-title" style="margin-top:8px">Bench pressure watchlist</div>
      <div class="stats-hint">Items repeatedly shown in queue but consistently skipped; pressure score ranks intervention urgency. Use Not today when a pass is about timing, not rejection.</div>
      ${bench.length
    ? `<div class="insights-action-list">${bench.slice(0, 5).map((item, idx) => `<div class="stats-row stats-sub"><span class="stats-label">${idx + 1}. ${esc(item.name)} (${esc(item.tab)}) - ${esc(item.type)}</span><span class="stats-value">Pressure ${item.pressureScore} · snoozed ${item.snoozes}x · not today ${item.softPasses || 0}x · adjusted skips ${item.adjustedSkips} · chosen ${Math.round(item.selectionRate * 100)}%</span></div>`).join("")}</div>`
    : `<div class="stats-hint">No bench pressure yet. Once queue exposures build up, this watchlist flags items that are repeatedly passed over.</div>`}
      `
    );
  };

  let html = "";
  html += section(
    "Personal style DNA (Wrapped)",
    `<div class="stats-hint">Auto-refreshes daily. A compact collector recap of your monthly and yearly style behavior.</div>
     <div class="insights-score-grid">
       ${renderDnaCard(`${monthLabel} Wrapped`, monthDna)}
       ${renderDnaCard(`${yearLabel} Wrapped`, yearDna)}
     </div>
     <div class="insights-story-launch">
       <button type="button" class="btn secondary" id="insights-story-play">Play story</button>
     </div>
     <div id="insights-story-root" class="insights-story-root" aria-live="polite"></div>`
  );
  html += renderBehaviorInsights();

  if (health) {
    const scorecardRotationModel = behavior?.rotationModel || { parkedValueSplit: { intentional: { count: 0, value: 0 }, uncertain: { count: 0, value: 0 } } };
    const grade = health.score >= 85 ? "A" : health.score >= 70 ? "B" : health.score >= 55 ? "C" : health.score >= 40 ? "D" : "F";
    const neverWornCount = Number.isFinite(adoption?.neverWornSinceAddedTotal)
      ? adoption.neverWornSinceAddedTotal
      : (Array.isArray(adoption?.neverWornSinceAdded) ? adoption.neverWornSinceAdded.length : 0);
    const wearableItems = Array.isArray(stats.wearableItems) ? stats.wearableItems : [];
    const nowForRotation = Date.now();
    const recencyWindow = Number(health.recencyWindowDays || 365);
    const inactiveWindow = Number(health.inactiveValueWindowDays || 365);
    const wornLast365Count = wearableItems.filter((item) => {
      if (!item || !item.lastWorn) return false;
      const ageDays = Math.floor((nowForRotation - new Date(item.lastWorn).getTime()) / 86400000);
      return !Number.isNaN(ageDays) && ageDays <= recencyWindow;
    }).length;
    const noBuyCurrent = Number.isFinite(stats.noBuyCurrentDays) ? stats.noBuyCurrentDays : 0;
    const noBuyLongest = Number.isFinite(stats.noBuyLongestDays) ? stats.noBuyLongestDays : 0;
    const neverWornPctOfWearables = wearableItems.length
      ? Math.round((neverWornCount / wearableItems.length) * 100)
      : 0;
    const healthTone = health.score >= 60 ? "good" : health.score < 38 ? "bad" : "";
    const idleRatio = wearableItems.length ? ((inactive?.inactive365Count || 0) / wearableItems.length) : 0;
    const idleTone = idleRatio <= 0.16 ? "good" : idleRatio >= 0.42 ? "bad" : "";
    const adoptionLagDays = adoption?.medianDaysToFirstWear === null || adoption?.medianDaysToFirstWear === undefined
      ? null
      : Math.round(adoption.medianDaysToFirstWear);
    const adoptionTone = adoptionLagDays === null ? "" : adoptionLagDays <= 14 ? "good" : adoptionLagDays >= 40 ? "bad" : "";
    const backlogTone = neverWornPctOfWearables <= 24 ? "good" : neverWornPctOfWearables >= 48 ? "bad" : "";
    const rotationTone = health.recencyPct >= 20 ? "good" : health.recencyPct < 8 ? "bad" : "";
    const noBuyTone = noBuyCurrent >= 14 ? "good" : "";
    html += section(
      "Closet audit scorecard",
      `<div class="stats-hint">Action-oriented checkup of rotation health, backlog risk, and idle value (calibrated for large low-frequency closets).</div>
      <div class="insights-score-grid">
        <div class="insights-score-card">
          <div class="insights-score-title">Health score</div>
          ${insightValue(`${health.score}/100 (${grade})`, healthTone)}
          <div class="insights-score-note">${health.recencyPct}% worn in last ${recencyWindow} days · ${health.neverWornPct}% never worn</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">Parked value</div>
          ${insightValue(`${formatCurrency(inactive?.inactive365Value || 0)}`, idleTone)}
          <div class="insights-score-note">${inactive?.inactive365Count || 0} items parked over ${inactiveWindow} days</div>
          <div class="insights-score-note">Intentional: ${scorecardRotationModel.parkedValueSplit.intentional.count} · uncertain: ${scorecardRotationModel.parkedValueSplit.uncertain.count}</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">Adoption lag</div>
          ${insightValue(`${adoptionLagDays === null ? "n/a" : `${adoptionLagDays}d`}`, adoptionTone)}
          <div class="insights-score-note">${adoption?.adoptionRatePct || 0}% adoption rate from add date to first wear</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">Backlog risk</div>
          ${insightValue(`${neverWornCount}`, backlogTone)}
          <div class="insights-score-note">Items never worn since add date (full total)</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">365-day rotation</div>
          ${insightValue(`${wornLast365Count}/${wearableItems.length || 0}`, rotationTone)}
          <div class="insights-score-note">${health.recencyPct}% of wearable items were worn in the last ${recencyWindow} days</div>
        </div>
        <div class="insights-score-card">
          <div class="insights-score-title">No-buy streak</div>
          ${insightValue(`${noBuyCurrent} days`, noBuyTone)}
          <div class="insights-score-note">Longest no-buy streak: ${noBuyLongest} days</div>
        </div>
      </div>
      <div class="stats-section-title" style="margin-top:8px">Recommended next actions</div>
      <div class="stats-hint">This is your collector game plan: make intentional wears first, then review parked value, then chip away at true adoption backlog.</div>
      <div class="insights-action-list">
        <div>
          <div class="stats-row stats-sub"><span class="stats-label">1. Wear-next queue</span><span class="stats-value">${queue.length} suggestions</span></div>
          <div class="stats-hint">Ranked by recency gap, never-worn pressure, season/date signals, and value/condition boosts. Suggested move: use it when you want a deliberate pick, not as a guilt list.</div>
        </div>
        <div>
          <div class="stats-row stats-sub"><span class="stats-label">2. Parked >${inactiveWindow}d</span><span class="stats-value">${inactive?.inactive365Count || 0} items · ${formatCurrency(inactive?.inactive365Value || 0)}</span></div>
          <div class="stats-hint">These items have been parked for a long collector cycle. Intentional parked value: ${scorecardRotationModel.parkedValueSplit.intentional.count} items. Uncertain parked value: ${scorecardRotationModel.parkedValueSplit.uncertain.count} items.</div>
        </div>
        <div>
          <div class="stats-row stats-sub"><span class="stats-label">3. Never-worn backlog</span><span class="stats-value">${neverWornCount} items (${neverWornPctOfWearables}% of wearables)</span></div>
          <div class="stats-hint">Added but never worn items are adoption risk. Suggested move: schedule one intentional first wear when the season, occasion, or mood is right.</div>
        </div>
      </div>`
    );
  }

  if (queue.length) {
    html += section(
      "Wear next queue",
      `<div class="stats-hint">Priority mix: time since last wear, never-worn pressure, and item value. Each pick carries a lane and a quick explanation so the queue feels intentional. "Why this ranked" shows the full score math. Snooze hides an item for 3 days.</div>
      <div class="insights-controls insights-queue-sim-controls">
        <label for="insights-queue-sim-date" class="insights-sim-label">Simulate date</label>
        <input id="insights-queue-sim-date" class="insights-queue-sim-date" type="date" value="${esc(activeSimDateKey)}">
        <button type="button" class="btn secondary" id="insights-queue-sim-today">Use today</button>
      </div>
      <div class="stats-hint insights-queue-preview-date">Ranking preview date: ${new Date(`${activeSimDateKey}T12:00:00`).toLocaleDateString()}</div>
      <div class="insights-queue-list">
        ${queue.map((item, idx) => `
          <div class="insights-queue-item">
            <div class="insights-queue-head">
              <div class="insights-queue-label">${idx + 1}. ${esc(item.name)} (${esc(item.tab)}) - ${esc(item.type || "Unknown")}</div>
              <div class="insights-queue-score lane-${esc(item.laneKey || "rotation-pick")}">${esc(item.lane || "Rotation pick")} · ${Math.round(item.score)}</div>
            </div>
              <div class="stats-hint insights-queue-lane-hint">${esc(item.laneHint || "")}</div>
              <div class="insights-queue-meta">
                <span>${esc(item.reason)}</span>
                <div class="insights-queue-actions">
                  <button type="button" class="insights-queue-snooze" data-insights-explain-toggle="insights-explain-${idx}">Why this ranked</button>
                  <button type="button" class="insights-queue-snooze" data-insights-mark-worn="${idx}">Worn today</button>
                  <button type="button" class="insights-queue-snooze" data-insights-soft-pass="${esc(item.key)}">Not today</button>
                  <button type="button" class="insights-queue-snooze" data-insights-snooze="${esc(item.key)}">Snooze</button>
                </div>
              </div>
            <div class="insights-queue-explain is-hidden" id="insights-explain-${idx}">
              ${(Array.isArray(item.breakdown) ? item.breakdown : []).map((line) => `
                <div class="insights-queue-breakdown-row">
                  <span>${esc(line.label)}</span>
                  <span class="insights-queue-breakdown-points ${line.points >= 0 ? "positive" : "negative"}">${line.points >= 0 ? "+" : ""}${Math.round(line.points)}</span>
                </div>
              `).join("")}
              <div class="insights-queue-breakdown-row total">
                <span>Total priority score</span>
                <span class="insights-queue-breakdown-points ${item.score >= 0 ? "positive" : "negative"}">${item.score >= 0 ? "+" : ""}${Math.round(item.score)}</span>
              </div>
            </div>
          </div>`).join("")}
      </div>`
    );
  } else {
    html += section("Wear next queue", `<div class="stats-hint">Queue is clear for now. Log fresh wears or remove snoozes to regenerate suggestions.</div>`);
  }

  const wearEvents = Array.isArray(stats.wearEvents) ? stats.wearEvents : [];
  const years = Array.from(new Set(wearEvents
    .map((event) => {
      const key = String(event.dateKey || "");
      return /^\d{4}-\d{2}-\d{2}$/.test(key) ? Number(key.slice(0, 4)) : null;
    })
    .filter((year) => year !== null)))
    .sort((a, b) => b - a);
  const selectedYear = years.length ? years[0] : new Date().getFullYear();
  const brands = Array.from(new Set(wearEvents.map((event) => event.tab).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  html += section(
    "Wear calendar heatmap",
    `<div class="stats-hint">Daily wear intensity map for spotting dead zones and strong rotation months. Click a day for that date, or a month total for the full month.</div>
     <div class="insights-controls">
       <select id="insights-heatmap-year">${(years.length ? years : [selectedYear]).map((year) => `<option value="${year}">${year}</option>`).join("")}</select>
       <select id="insights-heatmap-brand"><option value="all">All brands</option>${brands.map((brand) => `<option value="${esc(brand)}">${esc(brand)}</option>`).join("")}</select>
     </div>
     <div id="insights-heatmap-body"></div>`
  );

  content.innerHTML = html;

  const snoozeButtons = content.querySelectorAll("[data-insights-snooze]");
  snoozeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.getAttribute("data-insights-snooze");
      if (!key) return;
      const next = loadInsightsSnoozes();
      const until = new Date();
      until.setDate(until.getDate() + 3);
      next[key] = localDateKeyFromDate(until);
      saveInsightsSnoozes(next);
      trackInsightsQueueSnooze(key, localDateKeyFromDate(new Date()));
      openInsightsDialog(collectAllStats(), { simDateKey: activeSimDateKey });
    });
  });

  const softPassButtons = content.querySelectorAll("[data-insights-soft-pass]");
  softPassButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.getAttribute("data-insights-soft-pass");
      if (!key) return;
      const next = loadInsightsSnoozes();
      const until = new Date();
      until.setDate(until.getDate() + 1);
      next[key] = localDateKeyFromDate(until);
      saveInsightsSnoozes(next);
      trackInsightsQueueSoftPass(key, localDateKeyFromDate(new Date()));
      openInsightsDialog(collectAllStats(), { simDateKey: activeSimDateKey });
    });
  });

  const explainButtons = content.querySelectorAll("[data-insights-explain-toggle]");
  explainButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const panelId = button.getAttribute("data-insights-explain-toggle");
      if (!panelId) return;
      const panel = document.getElementById(panelId);
      if (!panel) return;
      const isHidden = panel.classList.contains("is-hidden");
      panel.classList.toggle("is-hidden", !isHidden);
      button.textContent = isHidden ? "Hide scoring" : "Why this ranked";
    });
  });

  const wornTodayButtons = content.querySelectorAll("[data-insights-mark-worn]");
  wornTodayButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (state.readOnly || isViewerSession) return;
      const idx = Number(button.getAttribute("data-insights-mark-worn"));
      const item = Number.isFinite(idx) ? queue[idx] : null;
      if (!item) return;
      if (!markQueueItemWornToday(item)) return;
      trackInsightsQueueSelection(item.key, localDateKeyFromDate(new Date()));
      openInsightsDialog(collectAllStats(), { simDateKey: activeSimDateKey });
    });
  });

  const simDateInput = content.querySelector("#insights-queue-sim-date");
  if (simDateInput) {
    simDateInput.addEventListener("change", () => {
      const nextKey = /^\d{4}-\d{2}-\d{2}$/.test(String(simDateInput.value || ""))
        ? String(simDateInput.value)
        : localDateKeyFromDate(new Date());
      openInsightsDialog(collectAllStats(), { simDateKey: nextKey });
    });
  }
  const simTodayButton = content.querySelector("#insights-queue-sim-today");
  if (simTodayButton) {
    simTodayButton.addEventListener("click", () => {
      openInsightsDialog(collectAllStats(), { simDateKey: localDateKeyFromDate(new Date()) });
    });
  }

  const yearSelect = content.querySelector("#insights-heatmap-year");
  const brandSelect = content.querySelector("#insights-heatmap-brand");
  const heatmapBody = content.querySelector("#insights-heatmap-body");
  const rerenderHeatmap = () => {
    const selected = yearSelect ? Number(yearSelect.value) : selectedYear;
    const brand = brandSelect ? brandSelect.value : "all";
    renderInsightsHeatmap(stats, selected, brand, heatmapBody);
  };
  const bindChange = (el, handler) => {
    if (!el) return;
    el.addEventListener("change", handler);
  };
  bindChange(yearSelect, rerenderHeatmap);
  bindChange(brandSelect, rerenderHeatmap);
  rerenderHeatmap();
  trackInsightsQueueExposure(queue, activeSimDateKey);

  const storyRoot = content.querySelector("#insights-story-root");
  const storyPlayButton = content.querySelector("#insights-story-play");
  if (storyRoot && storyPlayButton) {
    let storyOpen = false;
    let storyPeriod = "month";
    let storyIndex = 0;
    const storySelection = {
      month: wrappedPeriodOptions.month[0]?.key || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      year: wrappedPeriodOptions.year[0]?.key || String(now.getFullYear()),
    };
    const dnaCache = {
      [`month:${storySelection.month}`]: monthDna,
      [`year:${storySelection.year}`]: yearDna,
    };

    const getActiveStoryOption = () => {
      const optionsForPeriod = wrappedPeriodOptions[storyPeriod] || [];
      const selectedKey = storySelection[storyPeriod];
      return optionsForPeriod.find((option) => option.key === selectedKey) || optionsForPeriod[0] || null;
    };

    const getStoryDna = (period, option) => {
      if (!option) return buildStyleDnaPeriod(stats, nowMs, nowMs);
      const cacheKey = `${period}:${option.key}`;
      if (!dnaCache[cacheKey]) {
        dnaCache[cacheKey] = buildStyleDnaPeriod(stats, option.startMs, option.endMs);
      }
      return dnaCache[cacheKey];
    };

    const renderStory = () => {
      if (!storyOpen) {
        storyRoot.classList.remove("is-open");
        storyRoot.innerHTML = "";
        storyPlayButton.textContent = "Play story";
        return;
      }

      const activeOption = getActiveStoryOption();
      const activeLabel = activeOption?.label || (storyPeriod === "year" ? yearLabel : monthLabel);
      const slides = buildWrappedStorySlides(activeLabel, getStoryDna(storyPeriod, activeOption));
      const periodOptions = wrappedPeriodOptions[storyPeriod] || [];
      if (storyIndex < 0) storyIndex = 0;
      if (storyIndex >= slides.length) storyIndex = slides.length - 1;

      storyPlayButton.textContent = "Restart story";
      storyRoot.classList.add("is-open");
      storyRoot.innerHTML = `
        <div class="insights-story-periods" role="tablist" aria-label="Story period">
          <button type="button" class="insights-story-period ${storyPeriod === "month" ? "is-active" : ""}" data-insights-story-period="month" role="tab" aria-selected="${storyPeriod === "month" ? "true" : "false"}">Month Wrapped</button>
          <button type="button" class="insights-story-period ${storyPeriod === "year" ? "is-active" : ""}" data-insights-story-period="year" role="tab" aria-selected="${storyPeriod === "year" ? "true" : "false"}">Year Wrapped</button>
        </div>
        <div class="insights-controls">
          <label class="insights-sim-label" for="insights-story-history-select">${storyPeriod === "month" ? "Choose month" : "Choose year"}</label>
          <select id="insights-story-history-select" class="insights-queue-sim-date">${periodOptions.map((option) => `<option value="${esc(option.key)}" ${option.key === storySelection[storyPeriod] ? "selected" : ""}>${esc(option.label)}</option>`).join("")}</select>
        </div>
        <div class="insights-story-shell" tabindex="0">
          <div class="insights-story-track">
            ${slides.map((slide, idx) => `<article class="insights-story-slide ${idx === storyIndex ? "is-active" : ""}" data-insights-story-slide="${idx}">
              <div class="insights-story-step">Slide ${idx + 1} of ${slides.length}</div>
              <div class="insights-story-title">${esc(slide.title)}</div>
              <div class="insights-story-stat">${esc(slide.stat)}</div>
              <div class="insights-story-narration">${esc(slide.narration)}</div>
            </article>`).join("")}
          </div>
          <div class="insights-story-controls">
            <button type="button" class="btn secondary" data-insights-story-prev ${storyIndex === 0 ? "disabled" : ""}>Back</button>
            <div class="insights-story-dots">${slides.map((_, idx) => `<button type="button" class="insights-story-dot ${idx === storyIndex ? "is-active" : ""}" data-insights-story-dot="${idx}" aria-label="Go to slide ${idx + 1}"></button>`).join("")}</div>
            <button type="button" class="btn secondary" data-insights-story-next ${storyIndex >= slides.length - 1 ? "disabled" : ""}>Next</button>
          </div>
          <div class="insights-story-footer">
            <button type="button" class="insights-queue-snooze" data-insights-story-exit>Exit story</button>
          </div>
        </div>
      `;

      const bindStoryClick = (selector, handler) => {
        const el = storyRoot.querySelector(selector);
        if (!el) return;
        el.addEventListener("click", handler);
      };

      bindStoryClick("[data-insights-story-prev]", () => {
        storyIndex -= 1;
        renderStory();
      });
      bindStoryClick("[data-insights-story-next]", () => {
        storyIndex += 1;
        renderStory();
      });
      bindStoryClick("[data-insights-story-exit]", () => {
        storyOpen = false;
        renderStory();
      });

      const periodButtons = storyRoot.querySelectorAll("[data-insights-story-period]");
      periodButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const next = button.getAttribute("data-insights-story-period");
          if (next !== "month" && next !== "year") return;
          storyPeriod = next;
          storyIndex = 0;
          renderStory();
        });
      });

      const historySelect = storyRoot.querySelector("#insights-story-history-select");
      if (historySelect) {
        historySelect.addEventListener("change", () => {
          storySelection[storyPeriod] = String(historySelect.value || storySelection[storyPeriod] || "");
          storyIndex = 0;
          renderStory();
        });
      }

      const dotButtons = storyRoot.querySelectorAll("[data-insights-story-dot]");
      dotButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const nextIdx = Number(button.getAttribute("data-insights-story-dot"));
          if (!Number.isFinite(nextIdx)) return;
          storyIndex = nextIdx;
          renderStory();
        });
      });

      const shell = storyRoot.querySelector(".insights-story-shell");
      if (shell) {
        shell.focus();
        shell.addEventListener("keydown", (event) => {
          if (event.key === "ArrowLeft" && storyIndex > 0) {
            event.preventDefault();
            storyIndex -= 1;
            renderStory();
            return;
          }
          if (event.key === "ArrowRight" && storyIndex < slides.length - 1) {
            event.preventDefault();
            storyIndex += 1;
            renderStory();
            return;
          }
          if (event.key === "Escape") {
            event.preventDefault();
            storyOpen = false;
            renderStory();
          }
        });
      }
    };

    storyPlayButton.addEventListener("click", () => {
      storyOpen = true;
      storyIndex = 0;
      renderStory();
    });
  }

  openDialog(dialog);
  if (options.preserveScroll) {
    const body = dialog.querySelector(".dialog-body");
    if (body) body.scrollTop = Math.max(0, Number(options.scrollTop || 0));
  } else {
    resetDialogScroll(dialog);
  }
};

const openNoBuyGameDialog = (stats) => {
  let dialog = document.getElementById("no-buy-game-dialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "no-buy-game-dialog";
    dialog.innerHTML = `
      <div class="dialog-body">
        <h3>No-Buy Challenge</h3>
        <div id="no-buy-game-content" class="insights-content"></div>
      </div>
      <div class="dialog-actions">
        <button type="button" class="btn" id="no-buy-game-close">Close</button>
      </div>
    `;
    document.body.appendChild(dialog);
    const closeBtn = dialog.querySelector("#no-buy-game-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        closeDialog(dialog);
      });
    }
  }

  const content = dialog.querySelector("#no-buy-game-content");
  if (!content) return;

  const sourceStats = stats || collectAllStats();
  const gamify = syncNoBuyGamifyStateFromStats(sourceStats);
  const nextMilestone = getNoBuyNextMilestone(gamify.currentStreak);
  const daysToMilestone = nextMilestone === null ? 0 : Math.max(0, nextMilestone - gamify.currentStreak);
  const cooldownActive = isNoBuyCooldownActive(gamify);
  const cooldownLabel = cooldownActive
    ? `${Math.max(1, Math.ceil((new Date(gamify.cooldownUntil).getTime() - Date.now()) / 3600000))}h left`
    : "inactive";
  const trends = getNoBuyTrendSummary(gamify, 30);
  const topTrend = trends.length ? `${trends[0].label} (${trends[0].count})` : "none";
  const pressureSummary = getNoBuyPressureSummary(gamify, 30);
  const topTriggerSummary = getNoBuyTriggerSummary(gamify, 14);
  const topTrigger = topTriggerSummary[0] || null;
  const recentActions = buildNoBuyActionEntries(gamify, 10);
  const fullActionHistory = buildNoBuyActionEntries(gamify, Number.POSITIVE_INFINITY);
  const recovery = gamify.activeRecovery;
  const recoveryActive = recovery && !recovery.completedAt;
  const recoveryDaysLeft = recoveryActive
    ? Math.max(0, Math.ceil((new Date(recovery.deadline).getTime() - Date.now()) / 86400000))
    : null;
  const recoveryRemaining = recoveryActive
    ? Math.max(0, Number(recovery.target || 0) - Number(recovery.progress || 0))
    : 0;
  const recoveryLabel = recoveryActive
    ? `${recovery.progress}/${recovery.target} by ${new Date(recovery.deadline).toLocaleDateString()}`
    : "none";
  const recoveryUrgencyLabel = recoveryActive
    ? recoveryRemaining <= 1
      ? `${recoveryRemaining} wear left`
      : `${recoveryRemaining} wears left`
    : "No active recovery";
  const recoveryUrgencyNote = recoveryActive
    ? recoveryDaysLeft <= 0
      ? "Recovery deadline is today"
      : `${recoveryDaysLeft} day${recoveryDaysLeft === 1 ? "" : "s"} until deadline`
    : "Complete to gain +50 XP";
  const nowMs = Date.now();
  const weekThreshold = nowMs - (7 * 86400000);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const cleanWeekTemptations = gamify.dailyCheckins.filter((entry) => {
    if (!entry?.tempted) return false;
    const key = String(entry.dateKey || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
    const ms = new Date(`${key}T12:00:00`).getTime();
    return Number.isFinite(ms) && ms >= weekThreshold;
  }).length;
  const cleanMonthBuys = (() => {
    const purchaseActions = Array.isArray(gamify.actionLog)
      ? gamify.actionLog.filter((entry) => String(entry?.type || "") === "purchase")
      : [];
    return purchaseActions.filter((entry) => {
      const ms = new Date(String(entry?.at || "")).getTime();
      return Number.isFinite(ms) && ms >= monthStart.getTime();
    }).length;
  })();
  const cleanBadgeLabel = cleanMonthBuys === 0 && cleanWeekTemptations === 0
    ? "Clean month + clean week"
    : cleanMonthBuys === 0
      ? "Clean month"
      : cleanWeekTemptations === 0
        ? "Clean week"
        : "Pressure active";
  const cleanBadgeNote = cleanMonthBuys === 0
    ? `${cleanWeekTemptations} temptation day${cleanWeekTemptations === 1 ? "" : "s"} in last 7 days`
    : `${cleanMonthBuys} buy${cleanMonthBuys === 1 ? "" : "s"} logged this month`;
  const topStreakKiller = (() => {
    const purchaseTrend = trends.find((entry) => String(entry.label || "").startsWith("Purchase:"));
    if (purchaseTrend) return purchaseTrend.label.replace(/^Purchase:\s*/, "");
    if (topTrigger) return noBuyReasonLabel(topTrigger.label);
    return "n/a";
  })();
  const bossTriggerLabel = topTrigger ? noBuyReasonLabel(topTrigger.label) : "Quiet";
  const bossTriggerGroup = topTrigger ? getNoBuyReasonGroupLabel(noBuyReasonGroup(topTrigger.label)) : "No recent pressure";
  const riskDrivers = [];
  if (topTrigger && topTrigger.count > 0) riskDrivers.push(noBuyReasonLabel(topTrigger.label));
  if (!cooldownActive && (pressureSummary.impulse.count + pressureSummary.planned.count) >= 2) riskDrivers.push("no cooldown buffer");
  if (recoveryActive) riskDrivers.push("post-buy recovery window");
  const riskLabel = riskDrivers.length ? riskDrivers.slice(0, 2).join(" + ") : "Low pressure";
  const riskNote = pressureSummary.impulse.count > pressureSummary.planned.count
    ? `Impulse pressure leads ${pressureSummary.impulse.count}-${pressureSummary.planned.count} over planned pressure in the last 30 days.`
    : pressureSummary.planned.count > pressureSummary.impulse.count
      ? `Planned pressure leads ${pressureSummary.planned.count}-${pressureSummary.impulse.count} over impulse pressure in the last 30 days.`
      : "Impulse and planned pressure are balanced right now.";
  const bestMoveToday = (() => {
    if (recoveryActive && recoveryRemaining > 0) return `Best move today: finish ${recoveryRemaining === 1 ? "the last recovery wear" : `${recoveryRemaining} more recovery wears`} before buying.`;
    if (!cooldownActive && (pressureSummary.impulse.count + pressureSummary.planned.count) >= 2) return "Best move today: start cooldown before browsing marketplaces or drops.";
    if (nextMilestone && daysToMilestone <= 2 && gamify.currentStreak > 0) return `Best move today: protect the streak, you are ${daysToMilestone} day${daysToMilestone === 1 ? "" : "s"} from ${nextMilestone}d.`;
    if (pressureSummary.planned.count > pressureSummary.impulse.count && pressureSummary.planned.count > 0) return `Best move today: avoid search feeds and deal hunting, ${pressureSummary.planned.topReason} is your main pressure lane.`;
    if (pressureSummary.impulse.count > 0) return `Best move today: step away from quick-hit browsing, ${pressureSummary.impulse.topReason} is your main impulse trigger.`;
    return "Best move today: keep the streak quiet and only open the app if you are logging a win, not chasing a shirt.";
  })();
  const buysLoggedDisplay = Math.max(
    Number(gamify.totalBuysLogged || 0),
    Array.isArray(gamify.buyLog) ? gamify.buyLog.length : 0,
    Array.isArray(gamify.actionLog)
      ? gamify.actionLog.filter((entry) => String(entry?.type || "") === "purchase").length
      : 0
  );
  const esc = (str) => String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");

  content.innerHTML = `
    <div class="stats-hint">Daily anti-buy loop: build streak XP, use cooldown before impulse buys, and complete recovery missions if you buy.</div>
    <div class="insights-score-grid">
      <div class="insights-score-card">
        <div class="insights-score-title">Risk right now</div>
        <div class="insights-score-value">${esc(riskLabel)}</div>
        <div class="insights-score-note">${esc(riskNote)}</div>
      </div>
      <div class="insights-score-card">
        <div class="insights-score-title">Current streak</div>
        <div class="insights-score-value">${gamify.currentStreak} days</div>
        <div class="insights-score-note">Longest streak: ${gamify.longestStreak} days</div>
      </div>
      <div class="insights-score-card">
        <div class="insights-score-title">XP & level</div>
        <div class="insights-score-value">Lv${gamify.level} · ${gamify.xp} XP</div>
        <div class="insights-score-note">Total no-buy days banked: ${gamify.noBuyDaysTotal}</div>
      </div>
      <div class="insights-score-card">
        <div class="insights-score-title">Buy credits</div>
        <div class="insights-score-value">${gamify.buyCredits}</div>
        <div class="insights-score-note">Earn 1 credit per 10 no-buy days</div>
      </div>
      <div class="insights-score-card">
        <div class="insights-score-title">Next milestone</div>
        <div class="insights-score-value">${nextMilestone ? `${nextMilestone}d` : "Complete"}</div>
        <div class="insights-score-note">${nextMilestone ? `${daysToMilestone} day${daysToMilestone === 1 ? "" : "s"} to go` : "All milestones reached"}</div>
      </div>
      <div class="insights-score-card">
        <div class="insights-score-title">Cooldown</div>
        <div class="insights-score-value">${cooldownLabel}</div>
        <div class="insights-score-note">Use a 24h pause before committing to a buy</div>
      </div>
      <div class="insights-score-card">
        <div class="insights-score-title">Recovery mission</div>
        <div class="insights-score-value">${esc(recoveryUrgencyLabel)}</div>
        <div class="insights-score-note">${esc(recoveryUrgencyNote)}</div>
      </div>
      <div class="insights-score-card">
        <div class="insights-score-title">Clean badge</div>
        <div class="insights-score-value">${esc(cleanBadgeLabel)}</div>
        <div class="insights-score-note">${esc(cleanBadgeNote)}</div>
      </div>
      <div class="insights-score-card">
        <div class="insights-score-title">Boss trigger</div>
        <div class="insights-score-value">${esc(bossTriggerLabel)}</div>
        <div class="insights-score-note">${esc(bossTriggerGroup)}${topTrigger ? ` · ${topTrigger.count} hit${topTrigger.count === 1 ? "" : "s"} in 14d` : ""}</div>
      </div>
    </div>

    <div class="stats-section-title" style="margin-top:8px">Best move today</div>
    <div class="stats-hint">${esc(bestMoveToday)}</div>

    <div class="stats-section-title" style="margin-top:8px">Actions</div>
    <div class="insights-controls no-buy-actions-row" style="margin-top:4px">
      <button type="button" class="btn secondary" id="nobuy-start-cooldown">Start 24h cooldown</button>
      <button type="button" class="btn secondary" id="nobuy-log-buy">Log buy now</button>
      <button type="button" class="btn secondary" id="nobuy-checkin-tempted">Tempted today</button>
      <button type="button" class="btn secondary" id="nobuy-checkin-clear">No temptation today</button>
      <button type="button" class="btn secondary" id="nobuy-export-log">Export log JSON</button>
    </div>
    <div class="no-buy-select-row" style="margin-top:8px">
      <div class="no-buy-select-group">
        <label class="insights-sim-label" for="nobuy-trigger">Temptation trigger</label>
        <select id="nobuy-trigger" class="insights-queue-sim-date">
          <option value="" selected disabled>Select reason</option>
          <option value="sale">Sale</option>
          <option value="gooddeal">Good deal</option>
          <option value="rarefind">Rare find</option>
          <option value="fomo">FOMO</option>
          <option value="boredom">Boredom</option>
          <option value="drop">New drop</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div class="no-buy-select-group">
        <label class="insights-sim-label" for="nobuy-buy-reason">Buying reason</label>
        <select id="nobuy-buy-reason" class="insights-queue-sim-date">
          <option value="" selected disabled>Select reason</option>
          <option value="gooddeal">Good deal</option>
          <option value="rarefind">Rare find</option>
          <option value="boredom">Boredom</option>
          <option value="gotpaid">Got paid/Extra money</option>
          <option value="marketed">Marketed</option>
          <option value="promo">Promo/Sale</option>
          <option value="other">Other</option>
        </select>
      </div>
    </div>

    <div class="stats-section-title" style="margin-top:8px">Recent button log</div>
    <div class="stats-hint">Last 10 logged no-buy actions, including cooldown starts, temptations, and purchases.</div>
    <div class="insights-controls" style="justify-content:flex-start; margin-top:6px">
      <button type="button" class="btn secondary" id="nobuy-open-full-history">Open full history</button>
    </div>
    ${recentActions.length
      ? `<div class="insights-action-list">${recentActions.map((entry, idx) => {
          const whenMs = new Date(entry.at).getTime();
          const whenLabel = Number.isFinite(whenMs)
            ? new Date(whenMs).toLocaleString()
            : "Unknown date";
          const typeLabel = entry.type === "purchase"
            ? "Buy logged"
            : entry.type === "cooldown"
              ? "Cooldown started"
              : "Temptation logged";
          const toneClass = entry.type === "purchase" ? "tone-bad" : entry.type === "cooldown" ? "" : "tone-good";
          return `<div class="stats-row stats-sub"><span class="stats-label ${toneClass}">${idx + 1}. ${esc(typeLabel)}</span><span class="stats-value ${toneClass}">${esc(whenLabel)} · ${esc(noBuyReasonLabel(entry.reason || "other"))}</span><button type="button" class="btn secondary no-buy-log-delete" data-nobuy-delete="1" data-nobuy-source="${esc(entry.source || "")}" data-nobuy-index="${Number.isInteger(entry.sourceIndex) ? entry.sourceIndex : ""}" data-nobuy-type="${esc(entry.type || "")}" data-nobuy-at="${esc(entry.at || "")}" data-nobuy-reason="${esc(entry.reason || "")}" data-nobuy-date="${esc(entry.dateKey || "")}">Delete</button></div>`;
        }).join("")}</div>`
      : `<div class="stats-hint">No button activity yet.</div>`}

    <div class="stats-section-title" style="margin-top:8px">Trends (30d)</div>
    ${trends.length
      ? `<div class="insights-action-list">${trends.slice(0, 6).map((entry, idx) => `<div class="stats-row stats-sub"><span class="stats-label">${idx + 1}. ${esc(entry.label)}</span><span class="stats-value">${entry.count} · ${esc(entry.direction)}</span></div>`).join("")}</div>`
      : `<div class="stats-hint">No trend data yet. Use Tempted today and Log buy now to capture both temptation and purchase reasons.</div>`}

    <div class="stats-section-title" style="margin-top:8px">Pressure mix (30d)</div>
    <div class="insights-action-list">
      <div class="stats-row stats-sub"><span class="stats-label">${getNoBuyReasonGroupLabel("impulse")}</span><span class="stats-value">${pressureSummary.impulse.count} · lead ${esc(pressureSummary.impulse.topReason)}</span></div>
      <div class="stats-row stats-sub"><span class="stats-label">${getNoBuyReasonGroupLabel("planned")}</span><span class="stats-value">${pressureSummary.planned.count} · lead ${esc(pressureSummary.planned.topReason)}</span></div>
    </div>

    <div class="stats-section-title" style="margin-top:8px">Status summary</div>
    <div class="insights-action-list">
      <div class="stats-row stats-sub"><span class="stats-label">Top trend</span><span class="stats-value">${esc(topTrend)}</span></div>
      <div class="stats-row stats-sub"><span class="stats-label">Buys logged</span><span class="stats-value">${buysLoggedDisplay}</span></div>
      <div class="stats-row stats-sub"><span class="stats-label">Top streak killer</span><span class="stats-value">${esc(topStreakKiller)}</span></div>
      <div class="stats-row stats-sub"><span class="stats-label">Last buy reason</span><span class="stats-value">${esc(gamify.lastBuyReason ? noBuyReasonLabel(gamify.lastBuyReason) : "n/a")}</span></div>
      <div class="stats-row stats-sub"><span class="stats-label">Recoveries completed</span><span class="stats-value">${gamify.totalRecoveriesCompleted}</span></div>
      <div class="stats-row stats-sub"><span class="stats-label">Recovery state</span><span class="stats-value">${esc(recoveryLabel)}</span></div>
    </div>
  `;

  const refresh = () => openNoBuyGameDialog(collectAllStats());
  const startCooldownBtn = content.querySelector("#nobuy-start-cooldown");
  const logBuyBtn = content.querySelector("#nobuy-log-buy");
  const temptedBtn = content.querySelector("#nobuy-checkin-tempted");
  const clearBtn = content.querySelector("#nobuy-checkin-clear");
  const exportBtn = content.querySelector("#nobuy-export-log");
  const fullHistoryBtn = content.querySelector("#nobuy-open-full-history");
  const triggerSelect = content.querySelector("#nobuy-trigger");
  const buyReasonSelect = content.querySelector("#nobuy-buy-reason");

  if (startCooldownBtn) {
    startCooldownBtn.addEventListener("click", () => {
      const next = startNoBuyCooldown(loadNoBuyGamifyState(), 24);
      saveNoBuyGamifyState(next);
      if (currentUser && !isViewerSession && !state.readOnly) scheduleSync();
      refresh();
    });
  }
  if (logBuyBtn) {
    logBuyBtn.addEventListener("click", () => {
      const reason = buyReasonSelect ? String(buyReasonSelect.value || "other") : "other";
      const next = logNoBuyBuyEvent(loadNoBuyGamifyState(), reason);
      saveNoBuyGamifyState(next);
      if (currentUser && !isViewerSession && !state.readOnly) scheduleSync();
      refresh();
    });
  }
  if (temptedBtn) {
    temptedBtn.addEventListener("click", () => {
      const trigger = triggerSelect ? String(triggerSelect.value || "other") : "other";
      const next = recordNoBuyCheckin(loadNoBuyGamifyState(), true, trigger);
      saveNoBuyGamifyState(next);
      if (currentUser && !isViewerSession && !state.readOnly) scheduleSync();
      refresh();
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      const next = recordNoBuyCheckin(loadNoBuyGamifyState(), false, "");
      saveNoBuyGamifyState(next);
      if (currentUser && !isViewerSession && !state.readOnly) scheduleSync();
      refresh();
    });
  }
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      exportNoBuyLogJson(loadNoBuyGamifyState());
    });
  }
  if (fullHistoryBtn) {
    fullHistoryBtn.addEventListener("click", () => {
      openNoBuyHistoryWindow(fullActionHistory);
    });
  }

  const deleteButtons = content.querySelectorAll("[data-nobuy-delete='1']");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const source = String(button.getAttribute("data-nobuy-source") || "");
      const indexRaw = button.getAttribute("data-nobuy-index");
      const index = indexRaw === null || indexRaw === "" ? NaN : Number(indexRaw);
      const type = String(button.getAttribute("data-nobuy-type") || "");
      const at = String(button.getAttribute("data-nobuy-at") || "");
      const reason = String(button.getAttribute("data-nobuy-reason") || "");
      const dateKey = String(button.getAttribute("data-nobuy-date") || "");
      const next = deleteNoBuyLogEntry(loadNoBuyGamifyState(), {
        source,
        index: Number.isFinite(index) ? index : null,
        type,
        at,
        reason,
        dateKey,
      });
      saveNoBuyGamifyState(next);
      if (currentUser && !isViewerSession && !state.readOnly) scheduleSync();
      refresh();
    });
  });

  openDialog(dialog);
  resetDialogScroll(dialog);
};

const openStatsDialog = () => {
  if (!statsDialog || !statsContent) return;
  const s = collectAllStats();
  const modeLabel = s.isInventory ? "Inventory" : "Wishlist";
  if (statsTitle) statsTitle.textContent = `${modeLabel} Stats`;

  const esc = (str) => String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const row = (label, value) => `<div class="stats-row"><span class="stats-label">${esc(label)}</span><span class="stats-value">${esc(value)}</span></div>`;
  const sub = (label, value) => `<div class="stats-row stats-sub"><span class="stats-label">${esc(label)}</span><span class="stats-value">${esc(value)}</span></div>`;
  const section = (content) => `<div class="stats-section">${content}</div>`;
  const toLocalDateKey = (dateObj) => `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;

  const barChart = (tally, maxItems) => {
    if (!tally.length) return "";
    const top = tally.slice(0, maxItems || tally.length);
    const maxCount = top[0][1];
    return `<div class="stats-bar-chart">${top.map(([label, count]) => {
      const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
      return `<div class="stats-bar-row"><span class="stats-bar-label">${esc(label)}</span><div class="stats-bar-track"><div class="stats-bar-fill" style="width:${pct}%"></div></div><span class="stats-bar-count">${count}</span></div>`;
    }).join("")}</div>`;
  };

  const bucketChart = (buckets) => {
    const maxCount = Math.max(...buckets.map((b) => b.count));
    if (maxCount === 0) return "";
    return `<div class="stats-bar-chart">${buckets.map((b) => {
      const pct = maxCount > 0 ? Math.round((b.count / maxCount) * 100) : 0;
      return `<div class="stats-bar-row"><span class="stats-bar-label">${esc(b.label)}</span><div class="stats-bar-track"><div class="stats-bar-fill" style="width:${pct}%"></div></div><span class="stats-bar-count">${b.count}</span></div>`;
    }).join("")}</div>`;
  };

  const renderTallySection = (title, tally, maxItems) => {
    if (!tally.length) return "";
    return section(`<div class="stats-section-title">${esc(title)}</div>${barChart(tally, maxItems)}`);
  };

  const renderCollapsibleSection = (title, valueLabel, bodyHtml) => {
    if (!bodyHtml) return "";
    return section(`<details class="stats-tab-details"><summary class="stats-tab-summary"><span class="stats-label">${esc(title)}</span><span class="stats-value">${esc(valueLabel || "")}</span></summary><div class="stats-tab-body">${bodyHtml}</div></details>`);
  };

  const progressBar = (pct, label) => {
    return `<div class="stats-progress"><div class="stats-progress-track"><div class="stats-progress-fill" style="width:${Math.min(pct, 100)}%"></div></div><span class="stats-progress-label">${esc(label)}</span></div>`;
  };

  const renderPricing = (stats) => {
    if (!s.isInventory || !stats.top5Expensive.length) return "";
    const topValueShare = stats.totalCost > 0
      ? Math.round((stats.top5Expensive.reduce((sum, item) => sum + Math.max(0, Number(item.price || 0)), 0) / stats.totalCost) * 100)
      : 0;
    let block = row("Total value", formatCurrency(stats.totalCost));
    block += row("Mean price", formatCurrency(stats.meanPrice));
    block += row("Median price", formatCurrency(stats.medianPrice));
    if (stats.priceStdDev > 0) {
      block += row("Std deviation", formatCurrency(stats.priceStdDev));
    }
    block += `<div class="stats-hint" style="margin-top:8px">${topValueShare >= 35 ? `A few grails are carrying ${topValueShare}% of total closet value.` : "Closet value is spread fairly evenly across the collection."}</div>`;
    block += `<div class="stats-section-title" style="margin-top:8px">Top 10 most expensive</div>`;
    stats.top5Expensive.forEach((item, i) => {
      const brand = item.tab || "Unknown";
      const type = item.type || "Unknown";
      const label = `${i + 1}. ${item.name} (${brand}) - ${type}`;
      block += sub(label, formatCurrency(item.price));
    });
    if (stats.top5Cheapest.length) {
      block += `<div class="stats-section-title" style="margin-top:8px">Top 10 cheapest (excluding Socks, Boxer Briefs, Hat, Misc)</div>`;
      stats.top5Cheapest.forEach((item, i) => {
        const brand = item.tab || "Unknown";
        const type = item.type || "Unknown";
        const label = `${i + 1}. ${item.name} (${brand}) - ${type}`;
        block += sub(label, formatCurrency(item.price));
      });
    }
    return section(block);
  };

  let html = "";

  // --- Item counts ---
  let countBlock = row("Total items", s.totalItems);
  if (PLATFORM === "desktop") {
    // Desktop: expandable per-tab details with full breakdown
    if (s.perTab.length > 1) {
      s.perTab.forEach((tab) => {
        const tabStats = tab.stats;
        let inner = "";
        if (s.isInventory && tabStats.top5Expensive.length) {
          inner += row("Value", formatCurrency(tabStats.totalCost));
        }
        inner += renderTallySection("Types", tabStats.typeTally, 5);
        inner += renderTallySection("Fandoms", tabStats.fandomTally, 5);
        inner += renderTallySection("Sizes", tabStats.sizeTally);
        if (s.isInventory) inner += renderTallySection("Condition", tabStats.conditionTally);
        if (tabStats.topTags.length) inner += renderTallySection("Tags", tabStats.topTags);
        countBlock += `<details class="stats-tab-details"><summary class="stats-tab-summary"><span class="stats-label">${esc(tab.name)}</span><span class="stats-value">${tab.count}</span></summary><div class="stats-tab-body">${inner}</div></details>`;
      });
    } else if (s.perTab.length === 1) {
      countBlock += sub(s.perTab[0].name, s.perTab[0].count);
    }
  }
  if (PLATFORM === "mobile") {
    // Mobile: flat list of tab counts
    s.perTab.forEach((tab) => { countBlock += sub(tab.name, tab.count); });
  }
  html += section(countBlock);

  // --- Pricing (Inventory) ---
  if (PLATFORM === "desktop") {
    html += renderPricing(s);
  }
  if (PLATFORM === "mobile") {
    // Mobile: compact pricing — totals only, no top 5 lists or std dev
    if (s.isInventory && s.top5Expensive.length) {
      let block = row("Total value", formatCurrency(s.totalCost));
      block += row("Mean price", formatCurrency(s.meanPrice));
      block += row("Median price", formatCurrency(s.medianPrice));
      html += section(block);
    }
  }

  if (PLATFORM === "desktop") {
    // --- Value per tab (Inventory) ---
    if (s.isInventory && s.valuePerTab.length > 1) {
      const totalVal = s.valuePerTab.reduce((sum, t) => sum + t.value, 0);
      let block = `<div class="stats-section-title">Value by tab</div>`;
      s.valuePerTab.forEach((tab) => {
        const pct = totalVal > 0 ? Math.round((tab.value / totalVal) * 100) : 0;
        block += sub(tab.name, `${formatCurrency(tab.value)} (${pct}%)`);
      });
      html += section(block);
    }

    // --- Names ---
    if (s.longestName.name || s.shortestName.name) {
      let nameBlock = "";
      if (s.longestName.name) nameBlock += row("Longest name", `${s.longestName.name} (${s.longestName.length})`);
      if (s.shortestName.name) nameBlock += row("Shortest name", `${s.shortestName.name} (${s.shortestName.length})`);
      html += section(nameBlock);
    }

    // --- Price distribution histogram (Inventory) ---
    if (s.isInventory && s.priceBuckets.some((b) => b.count > 0)) {
      html += section(`<div class="stats-section-title">Price distribution</div>${bucketChart(s.priceBuckets)}`);
    }
  }

  // --- Bar charts for aggregate tallies ---
  if (s.isInventory) html += renderTallySection("Condition breakdown", s.conditionTally);
  html += renderTallySection("Top types", s.typeTally, 5);
  html += renderTallySection("Top fandoms", s.fandomTally, 5);
  html += renderTallySection("Size breakdown", s.sizeTally);
  if (s.topTags.length) html += renderTallySection("Top tags", s.topTags);

  // --- Tag coverage (inventory only) ---
  if (s.isInventory && s.totalItems > 0) {
    let tagBlock = row("Items tagged", `${s.taggedCount} / ${s.totalItems}`);
    tagBlock += progressBar(s.tagCoverage, `${s.tagCoverage}% coverage`);
    html += section(tagBlock);
  }

  if (PLATFORM === "desktop") {
    // --- Collection / Wishlist diversity index ---
    if (s.typeDiversity > 0 || s.fandomDiversity > 0) {
      const divTitle = s.isInventory ? "Collection diversity" : "Wishlist diversity";
      let divBlock = `<div class="stats-section-title">${divTitle}</div>`;
      divBlock += `<div class="stats-hint">How evenly spread your ${s.isInventory ? "collection" : "wishlist"} is. Low = you have a clear favorite. High = wide variety across the board.</div>`;
      if (s.typeDiversity > 0) {
        const typeLabel = s.typeDiversity >= 80 ? "Generalist" : s.typeDiversity >= 50 ? "Balanced" : "Specialist";
        divBlock += row("Types", `${s.typeDiversity}% \u2014 ${typeLabel}`);
        divBlock += progressBar(s.typeDiversity, "");
      }
      if (s.fandomDiversity > 0) {
        const fandomLabel = s.fandomDiversity >= 80 ? "Generalist" : s.fandomDiversity >= 50 ? "Balanced" : "Specialist";
        divBlock += row("Fandoms", `${s.fandomDiversity}% \u2014 ${fandomLabel}`);
        divBlock += progressBar(s.fandomDiversity, "");
      }
      html += section(divBlock);
    }

    // --- Whales ---
    if (s.whaleItems.length) {
      let whaleBlock = `<div class="stats-section-title">Whales</div>`;
      whaleBlock += row("Total whales", String(s.whaleItems.length));
      const whalesWorn365 = s.whaleItems.filter((item) => {
        if (!item?.lastWorn) return false;
        const ms = new Date(item.lastWorn).getTime();
        return Number.isFinite(ms) && Math.floor((Date.now() - ms) / 86400000) <= 365;
      }).length;
      const whalesParked = s.whaleItems.length - whalesWorn365;
      whaleBlock += `<div class="stats-hint">${whalesWorn365} worn in the last 365 days · ${whalesParked} parked intentionally as collector anchors.</div>`;
      s.whaleItems.forEach((item) => {
        const type = item.type ? ` - ${item.type}` : "";
        const status = item.lastWorn
          ? `${Math.max(0, Math.floor((Date.now() - new Date(item.lastWorn).getTime()) / 86400000))}d ago`
          : "Parked";
        whaleBlock += sub(`${item.name} (${item.tab})${type}`, status);
      });
      html += section(whaleBlock);
    }

    // --- Name word frequency (Inventory only) ---
    if (s.isInventory && s.topWords.length) {
      html += renderCollapsibleSection("Common words in names", `${s.topWords.length} tracked`, barChart(s.topWords, 10));
    }

    // --- Items added per month (Inventory only) ---
    if (s.isInventory && s.itemsPerMonth.length) {
      let monthBlock = `<div class="stats-section-title">Items added per month</div>`;
      monthBlock += bucketChart(s.itemsPerMonth.map((m) => ({ label: m.label, count: m.count })));
      monthBlock += `<div class="stats-section-title" style="margin-top:8px">Purchase streaks</div>`;
      monthBlock += row("Current streak", `${s.currentStreak} ${s.currentStreak === 1 ? "day" : "days"}`);
      if (s.longestStreak > 0) {
        monthBlock += row("Longest streak", `${s.longestStreak} ${s.longestStreak === 1 ? "day" : "days"}`);
      }
      monthBlock += `<div class="stats-section-title" style="margin-top:8px">Days without purchase</div>`;
      monthBlock += row("Current no-buy streak", `${s.noBuyCurrentDays} ${s.noBuyCurrentDays === 1 ? "day" : "days"}`);
      if (s.noBuyLongestDays > 0) {
        monthBlock += row("Longest no-buy streak", `${s.noBuyLongestDays} ${s.noBuyLongestDays === 1 ? "day" : "days"}`);
      }
      html += section(monthBlock);
    }

  }

  // --- Wear tracking stats (Inventory only) ---
  if (s.isInventory && (s.topRotationScore.length || s.longestUnworn || s.last5Worn.length || s.unwornOverSixMonths.length)) {
    let wearBlock = `<div class="stats-section-title">Wear tracking</div>`;
    wearBlock += `<div class="stats-hint">${s.longestUnworn ? `Longest current cold spot is ${s.longestUnworn.daysSince} days.` : "Wear tracking is active."} ${s.last5Worn.length ? "Recent logs are flowing, so this section is reflecting live rotation behavior." : "Add a wear log to bring this section to life."}</div>`;
    const todayKey = toLocalDateKey(new Date());
    if (s.longestUnworn) {
      const longestType = s.longestUnworn.type ? ` - ${esc(s.longestUnworn.type)}` : "";
      wearBlock += row("Longest unworn", `${esc(s.longestUnworn.name)} (${esc(s.longestUnworn.tab)})${longestType} — ${s.longestUnworn.daysSince} days`);
    }
    if (s.topRotationScore.length) {
      wearBlock += `<div class="stats-section-title" style="margin-top:8px">Top rotation score</div>`;
      wearBlock += `<div class="stats-hint">Score blends wears, recency, and price.<br>Score = wears*60 + recency*40 + round(log10(price+1)*25)</div>`;
      s.topRotationScore.forEach((item, i) => {
        const type = item.type ? ` - ${item.type}` : "";
        const tieTag = item.isTie ? " (tie)" : "";
        wearBlock += sub(`${i + 1}. ${item.name} (${item.tab})${type}${tieTag}`, `Score ${((item.rotationScorePoints || 0) / 100).toFixed(2)} · ${item.wearCount} wears`);
      });
    }
    if (s.last5Worn.length) {
      wearBlock += `<div class="stats-section-title" style="margin-top:8px">Last 5 worn</div>`;
      s.last5Worn.forEach((item, i) => {
        const date = new Date(item.lastWorn).toLocaleDateString();
        const type = item.type ? ` - ${item.type}` : "";
        wearBlock += sub(`${i + 1}. ${item.name} (${item.tab})${type}`, date);
      });
    }
    if (s.wearEvents.length) {
      wearBlock += `<div class="stats-section-title" style="margin-top:8px">Worn on date</div>`;
      wearBlock += `<div class="stats-date-lookup"><input id="stats-worn-date-input" class="stats-date-input" type="date" value="${todayKey}" max="${todayKey}"><div id="stats-worn-date-results" class="stats-date-results"></div><button type="button" id="stats-wear-history-link" class="stats-link-button">View full wear history</button></div>`;
    }
    if (s.unwornOverSixMonths.length) {
      wearBlock += `<button type="button" id="stats-unworn-six-months-link" class="stats-link-button">View shirts not worn in past 6 months</button>`;
    }
    if (s.costPerWear.length) {
      wearBlock += `<div class="stats-section-title" style="margin-top:8px">Best cost per wear</div>`;
      s.costPerWear.forEach((item, i) => {
        const type = item.type ? ` - ${item.type}` : "";
        wearBlock += sub(`${i + 1}. ${item.name} (${item.tab})${type}`, `${formatCurrency(item.cpw)}/wear (${item.wearCount} wears)`);
      });
    }
    // Most worn brand by day of week
    const hasAnyBrand = s.brandByDayOfWeek.some((d) => d.brand);
    if (hasAnyBrand) {
      wearBlock += `<div class="stats-section-title" style="margin-top:8px">Top brand by day of week</div>`;
      const maxCount = Math.max(...s.brandByDayOfWeek.map((d) => d.count));
      // Reorder to start on Monday: Mon(1) Tue(2) Wed(3) Thu(4) Fri(5) Sat(6) Sun(0)
      const ordered = [1, 2, 3, 4, 5, 6, 0].map((i) => s.brandByDayOfWeek[i]);
      wearBlock += `<div class="stats-bar-chart">`;
      ordered.forEach((d) => {
        const pct = d.count && maxCount ? Math.round((d.count / maxCount) * 100) : 0;
        const label = d.brand ? `${d.brand} (${d.count})` : "—";
        wearBlock += `<div class="stats-bar-row"><span class="stats-bar-label" style="min-width:36px">${d.day}</span><div class="stats-bar-track"><div class="stats-bar-fill" style="width:${pct}%"></div></div><span class="stats-bar-value">${label}</span></div>`;
      });
      wearBlock += `</div>`;
    }
    // Most worn brand by month
    const hasAnyMonthBrand = s.brandByMonth.some((d) => d.brand);
    if (hasAnyMonthBrand) {
      wearBlock += `<div class="stats-section-title" style="margin-top:8px">Top brand by month</div>`;
      const maxMonthCount = Math.max(...s.brandByMonth.map((d) => d.count));
      wearBlock += `<div class="stats-bar-chart">`;
      s.brandByMonth.forEach((d) => {
        const pct = d.count && maxMonthCount ? Math.round((d.count / maxMonthCount) * 100) : 0;
        const label = d.brand ? `${d.brand} (${d.count})` : "—";
        wearBlock += `<div class="stats-bar-row"><span class="stats-bar-label" style="min-width:36px">${d.month}</span><div class="stats-bar-track"><div class="stats-bar-fill" style="width:${pct}%"></div></div><span class="stats-bar-value">${label}</span></div>`;
      });
      wearBlock += `</div>`;
    }
    html += section(wearBlock);
  }

  // --- Recently added ---
  if (s.recentlyAdded.length) {
    let addedBlock = `<div class="stats-section-title">Recently added</div>`;
    const recentWornCount = s.recentlyAdded.filter((item) => Number(item?.wearCount || 0) > 0).length;
    const recentUnwornCount = s.recentlyAdded.length - recentWornCount;
    addedBlock += `<div class="stats-hint">${recentWornCount} already entered rotation · ${recentUnwornCount} still waiting for a first wear.</div>`;
    s.recentlyAdded.forEach((item) => {
      const date = new Date(item.createdAt).toLocaleDateString();
      // Wishlist: show Brand column value; Inventory: show tab name (which IS the brand)
      const brandLabel = !s.isInventory ? (item.brand || "Unknown") : (item.tab || "Unknown");
      const typeLabel = item.type || "Unknown";
      const label = `${item.name} (${brandLabel}) - ${typeLabel}`;
      const right = Number(item?.wearCount || 0) > 0
        ? `${date} · Worn ${Math.max(1, Number(item.wearCount || 0))}x`
        : `${date} · Unworn`;
      addedBlock += sub(label, right);
    });
    addedBlock += `<button type="button" id="stats-all-added-link" class="stats-link-button">View all added shirts</button>`;
    html += section(addedBlock);
  }

  // --- Recently deleted (Inventory only) ---
  if (s.isInventory && s.recentlyDeleted.length) {
    let delBlock = "";
    s.recentlyDeleted.forEach((item) => {
      const brand = item.tab || "Unknown";
      const type = item.type || "Unknown";
      const label = `${item.name} (${brand}) - ${type}`;
      delBlock += sub(label, item.date);
    });
    html += renderCollapsibleSection("Recently deleted", `${s.recentlyDeleted.length} recent`, delBlock);
  }

  // --- Wishlist-only: Items obtained & Most recent "Got it!" ---
  if (!s.isInventory) {
    let gotItLog = [];
    try {
      gotItLog = JSON.parse(localStorage.getItem(GOT_IT_LOG_KEY) || "[]");
    } catch (error) { /* ignore */ }
    const funnel = s.wishlistConversion || {};
    const lifetimeTotal = typeof funnel.lifetimeTotal === "number" ? funnel.lifetimeTotal : gotItLog.length;
    const topBrand = Array.isArray(funnel.topBrands) && funnel.topBrands.length
      ? `${funnel.topBrands[0].label} (${funnel.topBrands[0].rate}% · ${funnel.topBrands[0].firstWearCount}/${funnel.topBrands[0].obtainedCount})`
      : "n/a";
    const topType = Array.isArray(funnel.topTypes) && funnel.topTypes.length
      ? `${funnel.topTypes[0].label} (${funnel.topTypes[0].rate}% · ${funnel.topTypes[0].firstWearCount}/${funnel.topTypes[0].obtainedCount})`
      : "n/a";
    let wishBlock = "";
    wishBlock += row("Items obtained", String(lifetimeTotal));
    if (gotItLog.length > 0) {
      const last = gotItLog[gotItLog.length - 1];
      const lastDate = last.date ? new Date(last.date).toLocaleDateString() : "";
      wishBlock += row("Most recent 'Got it!'", `${esc(last.name)} \u00B7 ${lastDate}`);
    }
    wishBlock += row("Tracked conversions", String(funnel.trackedCount || 0));
    if (funnel.legacyCount) {
      wishBlock += row("Legacy obtained items", String(funnel.legacyCount));
    }
    wishBlock += row(
      "Worn at least once",
      funnel.linkedInventoryCount
        ? `${funnel.firstWearCount}/${funnel.linkedInventoryCount} (${funnel.firstWearPct}%)`
        : "n/a"
    );
    wishBlock += row(
      "Worn 2+ times",
      funnel.linkedInventoryCount
        ? `${funnel.repeatWearCount}/${funnel.linkedInventoryCount} (${funnel.repeatWearPct}%)`
        : "n/a"
    );
    wishBlock += row(
      "Median add -> got it",
      funnel.medianWishlistToGotItDays === null ? "n/a" : `${funnel.medianWishlistToGotItDays}d`
    );
    wishBlock += row(
      "Median got it -> first wear",
      funnel.medianGotItToFirstWearDays === null ? "n/a" : `${funnel.medianGotItToFirstWearDays}d`
    );
    wishBlock += row("Top converting brand", topBrand);
    wishBlock += row("Top converting type", topType);
    wishBlock += row(
      "Buy gate reviewed",
      funnel.buyGateReviewedCount ? `${funnel.buyGateReviewedCount} tracked buys` : "n/a"
    );
    wishBlock += row(
      "Duplicate-flagged buys",
      funnel.buyGateReviewedCount ? `${funnel.duplicateFlaggedCount}/${funnel.buyGateReviewedCount}` : "n/a"
    );
    wishBlock += row(
      "Flagged first-wear rate",
      funnel.flaggedFirstWearPct === null ? "n/a" : `${funnel.flaggedFirstWearPct}%`
    );
    wishBlock += row(
      "Clear-buy first-wear rate",
      funnel.clearFirstWearPct === null ? "n/a" : `${funnel.clearFirstWearPct}%`
    );
    wishBlock += row(
      "Flagged repeat-wear rate",
      funnel.flaggedRepeatWearPct === null ? "n/a" : `${funnel.flaggedRepeatWearPct}%`
    );
    wishBlock += row(
      "Clear-buy repeat-wear rate",
      funnel.clearRepeatWearPct === null ? "n/a" : `${funnel.clearRepeatWearPct}%`
    );
    wishBlock += `<div class="stats-hint" style="margin-top:8px">Conversion metrics use newer Got It! logs with stable wishlist-to-inventory links. Older obtained history still counts toward lifetime totals but may not have precise funnel data.</div>`;
    wishBlock += `<div style="margin-top:8px"><button type="button" class="btn secondary" id="stats-wishlist-funnel-link">View conversion details</button></div>`;
    html += section(wishBlock);
  }

  statsContent.innerHTML = html;

  const wornDateInput = statsContent.querySelector("#stats-worn-date-input");
  const wornDateResults = statsContent.querySelector("#stats-worn-date-results");
  const wearHistoryLink = statsContent.querySelector("#stats-wear-history-link");
  const unwornSixMonthsLink = statsContent.querySelector("#stats-unworn-six-months-link");
  const allAddedLink = statsContent.querySelector("#stats-all-added-link");
  const wishlistFunnelLink = statsContent.querySelector("#stats-wishlist-funnel-link");
  if (wornDateInput && wornDateResults) {
    const renderWornDateMatches = () => {
      const selectedDate = wornDateInput.value;
      if (!selectedDate) {
        wornDateResults.innerHTML = `<div class="stats-hint">Pick a date to see what was worn.</div>`;
        return;
      }
      const matches = s.wearEvents.filter((event) => event.dateKey === selectedDate);
      if (!matches.length) {
        wornDateResults.innerHTML = `<div class="stats-hint">No shirts logged for this date.</div>`;
        return;
      }

      const grouped = {};
      matches.forEach((event) => {
        const key = `${event.name}||${event.tab}||${event.type || ""}`;
        const ts = new Date(event.wornAt).getTime();
        if (!grouped[key]) grouped[key] = { name: event.name, tab: event.tab, type: event.type || "", count: 0, latest: ts };
        grouped[key].count += 1;
        if (ts > grouped[key].latest) grouped[key].latest = ts;
      });

      const ranked = Object.values(grouped)
        .sort((a, b) => b.latest - a.latest || a.name.localeCompare(b.name));
      let out = row("Shirts worn", String(ranked.length));
      ranked.forEach((item, i) => {
        const label = `${i + 1}. ${item.name} (${item.tab})${item.type ? ` - ${item.type}` : ""}`;
        out += sub(label, `${item.count} ${item.count === 1 ? "wear" : "wears"}`);
      });
      wornDateResults.innerHTML = out;
    };

    wornDateInput.addEventListener("input", renderWornDateMatches);
    wornDateInput.addEventListener("change", renderWornDateMatches);
    renderWornDateMatches();
  }
  if (wearHistoryLink) {
    wearHistoryLink.addEventListener("click", () => {
      openWearHistoryDialog(s.wearEvents);
    });
  }
  if (unwornSixMonthsLink) {
    unwornSixMonthsLink.addEventListener("click", () => {
      openUnwornSixMonthsDialog(s.unwornOverSixMonths);
    });
  }
  if (allAddedLink) {
    allAddedLink.addEventListener("click", () => {
      openAllAddedDialog(s.allRecentlyAdded, s.isInventory);
    });
  }
  if (wishlistFunnelLink) {
    wishlistFunnelLink.addEventListener("click", () => {
      openWishlistConversionDialog(s.wishlistConversion);
    });
  }
  if (statsAdvancedButton) {
    statsAdvancedButton.onclick = () => {
      openAdvancedStatsDialog(s);
    };
  }
  if (statsInsightsButton) {
    statsInsightsButton.onclick = () => {
      openInsightsDialog(s);
    };
  }
  if (statsNoBuyButton) {
    statsNoBuyButton.onclick = () => {
      openNoBuyGameDialog(s);
    };
  }
  if (statsExportButton) {
    statsExportButton.onclick = () => {
      openStatsExportDialog(s);
    };
  }

  openDialog(statsDialog);
  resetDialogScroll(statsDialog);
};

const renderChangelog = () => {
  if (!changelogList) return;
  changelogList.textContent = "";

  const renderRelease = (release) => {
    const section = document.createElement("div");
    section.style.marginBottom = "18px";
    const heading = document.createElement("div");
    heading.style.fontWeight = "700";
    heading.style.fontSize = "0.95rem";
    heading.style.marginBottom = "4px";
    heading.textContent = "v" + release.version + "  \u2014  " + release.date;
    section.appendChild(heading);
    const list = document.createElement("ul");
    list.style.margin = "4px 0 0 0";
    list.style.paddingLeft = "20px";
    list.style.fontSize = "0.85rem";
    list.style.lineHeight = "1.6";
    release.changes.forEach((change) => {
      const li = document.createElement("li");
      li.textContent = change;
      list.appendChild(li);
    });
    section.appendChild(list);
    return section;
  };

  // Always show the latest version
  if (CHANGELOG.length > 0) {
    changelogList.appendChild(renderRelease(CHANGELOG[0]));
  }

  // Older versions behind a toggle
  if (CHANGELOG.length > 1) {
    const toggle = document.createElement("a");
    toggle.href = "#";
    toggle.textContent = "Show older versions";
    toggle.style.display = "inline-block";
    toggle.style.marginTop = "4px";
    toggle.style.fontSize = "0.85rem";
    toggle.style.color = "#555";
    toggle.style.cursor = "pointer";
    toggle.style.textDecoration = "underline";

    const olderContainer = document.createElement("div");
    olderContainer.style.display = "none";
    olderContainer.style.marginTop = "14px";
    CHANGELOG.slice(1).forEach((release) => {
      olderContainer.appendChild(renderRelease(release));
    });

    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      const isHidden = olderContainer.style.display === "none";
      olderContainer.style.display = isHidden ? "block" : "none";
      toggle.textContent = isHidden ? "Hide older versions" : "Show older versions";
    });

    changelogList.appendChild(toggle);
    changelogList.appendChild(olderContainer);
  }
};

if (changelogCloseButton) {
  changelogCloseButton.addEventListener("click", () => {
    closeDialog(changelogDialog);
  });
}

if (changelogLink) {
  changelogLink.addEventListener("click", (event) => {
    event.preventDefault();
    renderChangelog();
    openDialog(changelogDialog);
    if (changelogDialog) changelogDialog.scrollTop = 0;
  });
}

if (statsCloseButton) {
  statsCloseButton.addEventListener("click", () => {
    closeDialog(statsDialog);
  });
}

if (statsButton) {
  statsButton.addEventListener("click", () => {
    openStatsDialog();
  });
}

// --- Admin Panel (lazy-loaded from server) ---
// The admin UI code is NOT shipped to the browser. It is fetched from a
// server-side function (admin-ui) only after the caller's JWT is verified
// as belonging to the admin. Non-admins never download the code at all.

let adminCheckStarted = false;
const initAdminLink = async () => {
  if (!supabase || !currentUser) return;
  if (adminCheckStarted) return;
  adminCheckStarted = true;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) { adminCheckStarted = false; return; }
    const res = await fetch(NETLIFY_BASE + "/.netlify/functions/admin-ui", {
      method: "GET",
      headers: { Authorization: "Bearer " + token },
    });
    if (res.status === 403) return;           // confirmed not admin — lock permanently
    if (res.status !== 200) { adminCheckStarted = false; return; } // transient error — allow retry
    const jsText = await res.text();
    // Bridge passes block-scoped references to the global-scope <script>.
    // The injected IIFE reads from this object then immediately deletes it.
    window.__adminBridge = {
      openDialog, closeDialog, resetDialogScroll,
      changelogLink, NETLIFY_BASE, APP_VERSION,
      supabase, currentUser,
    };
    const script = document.createElement("script");
    script.textContent = jsText;
    document.body.appendChild(script);
  } catch (e) {
    adminCheckStarted = false;
  }
};

// --- End Admin Panel ---

filterColumnSelect.addEventListener("change", (event) => {
  state.filter.columnId = event.target.value;
  const optionColumn = state.columns.find((column) => column.id === state.filter.columnId);
  const optionLabel = optionColumn ? getColumnLabel(optionColumn).trim().toLowerCase() : "";
  if (state.filter.columnId === "tags" || state.filter.columnId === "forSale" || ["condition", "type", "size", "fandom"].includes(optionLabel)) {
    state.filter.query = "";
  }
  updateFilterInputMode();
  saveState();
  renderTable();
});

const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const debouncedFilterRender = debounce(() => { saveState(); renderTable(); }, 150);

filterQueryInput.addEventListener("input", (event) => {
  state.filter.query = event.target.value;
  debouncedFilterRender();
});

if (filterTagsSelect) {
  filterTagsSelect.addEventListener("change", (event) => {
    state.filter.query = event.target.value;
    saveState();
    renderTable();
  });
}

if (PLATFORM === "desktop") {
  if (findBarInput) {
    findBarInput.addEventListener("input", (event) => {
      state.filter.columnId = "all";
      filterColumnSelect.value = "all";
      state.filter.query = event.target.value;
      filterQueryInput.value = state.filter.query;
      updateFilterInputMode();
      saveState();
      renderTable();
    });
    findBarInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeFindBar();
      }
    });
  }

  if (findBarCloseButton) {
    findBarCloseButton.addEventListener("click", () => {
      closeFindBar();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && findBar && findBar.style.display !== "none") {
      event.preventDefault();
      closeFindBar();
      return;
    }
    const isFindShortcut = (event.key === "f" || event.key === "F") && (event.ctrlKey || event.metaKey);
    if (!isFindShortcut) return;
    event.preventDefault();
    openFindBar();
  });
}

clearFilterButton.addEventListener("click", () => {
  state.filter = { columnId: "all", query: "" };
  saveState();
  renderTable();
});

toggleColumnsButton.addEventListener("click", () => {
  const isHidden = columnManager.classList.toggle("hidden");
  toggleColumnsButton.textContent = isHidden ? "Edit Columns" : "Hide Columns";
});


sheetBody.addEventListener("click", (event) => {
  if (!currentUser || isViewerSession || state.readOnly) return;
  const iconTd = event.target.closest(".icon-cell");
  if (!iconTd) return;
  const typeVal = iconTd.getAttribute("data-type");
  if (!typeVal) return;
  openTypeIconDialog(typeVal);
});
sheetBody.addEventListener("input", handleCellEvent);
sheetBody.addEventListener("change", handleCellEvent);
sheetBody.addEventListener("focusin", (event) => {
  const target = event.target;
  if (!target || !target.dataset) return;
  const rowId = target.dataset.rowId;
  const columnId = target.dataset.columnId;
  rememberEditStart(rowId, columnId);
});
sheetBody.addEventListener("focusout", (event) => {
  const target = event.target;
  if (!target || !target.dataset) return;
  const rowId = target.dataset.rowId;
  const columnId = target.dataset.columnId;
  const key = getEditKey(rowId, columnId);
  if (!editStartValues.has(key)) return;
  const startValue = editStartValues.get(key);
  const currentValue = target.value ?? "";
  if (String(startValue ?? "") === String(currentValue)) {
    editStartValues.delete(key);
  }
});



try {
  const savedMode = localStorage.getItem(APP_MODE_KEY);
  if (savedMode === "wishlist") appMode = "wishlist";
} catch (error) { /* ignore */ }
if (appMode === "wishlist") {
  initWishlistMode();
} else {
  loadTabsState();
  loadColumnOverrides();
}
if (!tabsState.activeTabId && tabsState.tabs[0]) {
  tabsState.activeTabId = tabsState.tabs[0].id;
  saveTabsState();
}
loadState();
purgeExpiredDeletedRows();
normalizeNameColumnsEverywhere();
normalizeSizeOptionsEverywhere();
resetFilterDefault();
if (PLATFORM === "desktop") {
  (() => {
    const hint = document.getElementById("filter-hint");
    if (hint) {
      const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
      hint.textContent = isMac ? "(⌘F to find)" : "(Ctrl+F to find)";
    }
  })();
}
loadShirtUpdateDate();
updateHeaderTitle();
updateHeaderSubtitle();
if (PLATFORM === "desktop") {
  applyDesktopHeaderInlineLayout();
}
if (appMode === "inventory" && removeBrandColumn()) {
  ensureRowCells();
  saveState();
}
if (globalColumns) {
  const previousColumns = state.columns.slice();
  ensureFandomInGlobalColumns();
  remapRowsToGlobalColumns(previousColumns);
  applyGlobalColumns();
} else {
  ensureFandomInState(state);
  if (appMode === "wishlist" && !state.columns.length) {
    state.columns = getWishlistDefaultColumns();
    state.rows = [defaultRow()];
    setGlobalColumns(state.columns);
    saveState();
  } else {
    setGlobalColumns(state.columns);
  }
}
applyTabFandomOptions();
applyTabTypeOptions();
applyTabBrandOptions();
if (appMode === "wishlist") {
  enforceWishlistColumns();
  enforceWishlistDropdownDefaults();
} else {
  enforceFixedDropdownDefaults();
}
pruneRowCells();
ensureRowCells();
migrateInlinePhotos();
columnManager.classList.add("hidden");
toggleColumnsButton.textContent = "Edit Columns";
sortRows();
renderTable();
applyReadOnlyMode();
renderTabs();
renderModeSwitcher();
if (tabsState.activeTabId) {
  const existing = (() => {
    try {
      return localStorage.getItem(getStorageKey(tabsState.activeTabId));
    } catch (error) {
      return null;
    }
  })();
  if (!existing) {
    saveState();
  }
}
} catch (error) {
  try {
    showFatalError(error?.message || String(error));
  } catch (_error) {
    // ignore
  }
}
