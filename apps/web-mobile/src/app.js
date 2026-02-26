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
const APP_VERSION = "2.0.5";
const IS_WEB_BUILD = true;
const LAST_COMMIT_DATE = "2026-02-04T10:36:12-05:00";
const APP_VERSION_KEY = "shirts-app-version";
const APP_UPDATE_KEY = "shirts-app-update-date";
const SIGNED_OUT_GREETING_KEY = "shirts-signed-out-greeting";
const SIGNED_URL_CACHE_KEY = "shirts-signed-url-cache";
const SIGNED_URL_TTL_MS = 50 * 60 * 1000;
const WISHLIST_STORAGE_KEY = "wishlist-db-v1";
const WISHLIST_TAB_STORAGE_KEY = "wishlist-tabs-v1";
const WISHLIST_COLUMNS_KEY = "wishlist-columns-v1";
const APP_MODE_KEY = "shirts-app-mode";
const CURRENT_USER_KEY = "shirts-current-user";
const CUSTOM_TAGS_KEY = "shirts-custom-tags-v1";
const FOR_SALE_TAG = "For Sale";

const CHANGELOG = /* __CHANGELOG_INJECT__ */ [];

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
});

const PHOTO_DB = "shirt-tracker-photos";
const PHOTO_STORE = "photos";
const photoSrcCache = new Map();

const loadSignedUrlCache = () => {
  if (!canUseLocalStorage()) return {};
  try {
    const stored = localStorage.getItem(SIGNED_URL_CACHE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
};

const saveSignedUrlCache = (cache) => {
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
let isSyncing = false;
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
    if (photoSrcCache.has(value)) return photoSrcCache.get(value);
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
    if (photoSrcCache.has(value)) return photoSrcCache.get(value);
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
        const cached = getCachedSignedUrl(value);
        if (cached) {
          photoSrcCache.set(value, cached);
          return;
        }
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
const publicShareLinkInput = document.getElementById("public-share-link");
const copyShareLinkButton = document.getElementById("copy-share-link");
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
const clearFilterButton = document.getElementById("clear-filter");
const totalCountEl = document.getElementById("total-count");
const totalCostEl = document.getElementById("total-cost");
const footerActions = document.getElementById("footer-actions");
const footerStats = document.getElementById("footer-stats");
const totalsPanel = document.getElementById("totals-panel");
const shirtUpdateDateInput = document.getElementById("shirt-update-date");
const appUpdateDateInput = document.getElementById("app-update-date");
const footerVersionLine = document.getElementById("footer-version-line");
const aboutVersion = document.getElementById("about-version");
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
const bulkTagsButton = document.getElementById("bulk-tags");
const appTitleEl = document.getElementById("app-title");
const appSubtitleEl = document.getElementById("app-subtitle");
const signedOutGreetingEl = document.querySelector(".signedout-greeting");
const tabLogoPanel = document.getElementById("tab-logo-panel");
const topControls = document.getElementById("top-controls");
const dangerZone = document.querySelector(".danger-zone");
const authRow = document.getElementById("auth-action-inline-cell") || document.getElementById("auth-action-cell");
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
  btn.textContent = "?";
  Object.assign(btn.style, {
    position: "fixed",
    bottom: "18px",
    right: "18px",
    zIndex: "9999",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "1px solid #bbb",
    background: "#f5f5f5",
    color: "#888",
    fontSize: "16px",
    fontFamily: "'Work Sans','Trebuchet MS',sans-serif",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0",
    lineHeight: "1",
  });
  btn.addEventListener("touchstart", () => {
    btn.style.background = "#e8e8e8";
    btn.style.borderColor = "#999";
    btn.style.color = "#555";
  }, { passive: true });
  btn.addEventListener("touchend", () => {
    btn.style.background = "#f5f5f5";
    btn.style.borderColor = "#bbb";
    btn.style.color = "#888";
  }, { passive: true });
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
  tabsState.tabs.sort((a, b) => a.name.localeCompare(b.name));
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
    scheduleCopyShareSizing();
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
  if (publicShareToken) return;
  if (!document.body) return;
  if (isLoading) {
    document.body.setAttribute("data-auth", "loading");
  } else if (document.body.getAttribute("data-auth") === "loading") {
    document.body.setAttribute("data-auth", "signed-out");
  }
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
    authActionButton.style.setProperty("display", "none", "important");
    if (authActionSignedOutButton) {
      authActionSignedOutButton.textContent = "Sign In";
      authActionSignedOutButton.style.display = "inline-flex";
    }
    positionAuthAction();
    syncAuthActionSizing();
    if (syncNowButton) syncNowButton.disabled = true;
    if (verifyBackupButton) verifyBackupButton.disabled = true;
    updateUnsavedStatus();
    updateHeaderSubtitle();
    updateSignedOutGreeting();
    positionViewerBadge();
    positionTotalCount();
    updateFooterVersionLine();
    return;
  }
  if (currentUser) {
    document.body.setAttribute("data-auth", "signed-in");
    state.readOnly = false;
    clearReadOnlyMode();
    try {
      localStorage.removeItem(SIGNED_OUT_GREETING_KEY);
    } catch (error) {
      // ignore
    }
    authActionButton.textContent = "Sign Out";
    authActionButton.classList.remove("auth-signed-out");
    authActionButton.classList.add("auth-signed-in");
    positionAuthAction();
    syncAuthActionSizing();
    authActionButton.style.setProperty("display", "inline-flex", "important");
    if (authActionSignedOutButton) {
      authActionSignedOutButton.style.display = "none";
    }
    if (syncNowButton) syncNowButton.disabled = false;
    if (verifyBackupButton) verifyBackupButton.disabled = false;
    updateUnsavedStatus();
    updateHeaderSubtitle();
    updateSignedOutGreeting();
    positionViewerBadge();
    positionTotalCount();
    updatePublicShareLink();
    updatePublicShareSummary();
    maybePromptProfileName();
  } else {
    document.body.setAttribute("data-auth", "signed-out");
    document.body.setAttribute("data-viewer", "false");
    authActionButton.textContent = "Sign In";
    authActionButton.classList.remove("auth-signed-in");
    authActionButton.classList.add("auth-signed-out");
    authActionButton.style.setProperty("display", "none", "important");
    if (authActionSignedOutButton) {
      authActionSignedOutButton.textContent = "Sign In";
      authActionSignedOutButton.style.display = "inline-flex";
    }
    positionAuthAction();
    syncAuthActionSizing();
    authActionButton.style.setProperty("display", "none", "important");
    if (syncNowButton) syncNowButton.disabled = true;
    if (verifyBackupButton) verifyBackupButton.disabled = true;
    updateUnsavedStatus();
    updateHeaderSubtitle();
    updateSignedOutGreeting();
    positionViewerBadge();
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
  dialog.style.display = "block";
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
  dialog.style.display = "none";
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

const applyDialogFallback = (dialog) => {
  if (!dialog) return;
  if (typeof dialog.showModal !== "function") {
    dialog.style.display = "none";
  }
};

document.querySelectorAll("dialog").forEach((dialog) => {
  applyDialogFallback(dialog);
});

const openEventLogDialog = () => {
  if (eventLogSearch) eventLogSearch.value = "";
  renderEventLog();
  openDialog(eventLogDialog);
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
  if (syncNowButton) syncNowButton.disabled = true;
  if (verifyBackupButton) verifyBackupButton.disabled = true;
  updateUnsavedStatus();
  updateHeaderSubtitle();
  updateSignedOutGreeting();
  positionViewerBadge();
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

const showToast = (message) => {
  if (!message) return;
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

const positionAuthAction = () => {
  if (!authActionButton) return;
  authActionButton.classList.remove("auth-compact");
  const authSlot = document.getElementById("auth-action-cell");
  if (authSlot && authActionButton.parentElement !== authSlot) {
    authSlot.appendChild(authActionButton);
  }
};

const syncAuthActionSizing = () => {
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
  syncCopyShareSizing();
  requestAnimationFrame(syncCopyShareSizing);
  setTimeout(syncCopyShareSizing, 80);
};

const setupCopyShareSizingObserver = () => {
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
    const blankSlot = document.createElement("div");
    blankSlot.setAttribute("aria-hidden", "true");

    const rows = [
      [addColumnButton, editColumnsButton],
      [chooseColumnsButton, copyShareButton],
      [syncNowButton, authActionButton],
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
    cell.style.flex = "1 1 0";
    cell.style.maxWidth = "50%";
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

requestAnimationFrame(applyMobileHeaderInlineLayout);

const positionViewerBadge = () => {
};

const positionTotalCount = () => {
  if (!totalCountEl || !totalCostEl || !totalsPanel) return;
  if (totalCountEl.parentElement !== totalsPanel) {
    totalsPanel.appendChild(totalCountEl);
  }
  if (totalCostEl.parentElement !== totalsPanel) {
    totalsPanel.appendChild(totalCostEl);
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

let pendingLogoTabId = null;
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
    if (supabase && currentUser) {
      const extension = (file.name.split(".").pop() || "png").toLowerCase();
      const path = await uploadLogoToSupabase(file, extension);
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
    reader.readAsDataURL(file);
  });
  tabLogoPanel.appendChild(changeButton);
  tabLogoPanel.appendChild(fileInput);
  if (renderId !== tabLogoRenderId) return;
};

const updateHeaderTitle = () => {
  if (!appTitleEl) return;
  const shortVersion = getShortVersion();
  appTitleEl.innerHTML = `<img src="assets/shirt-tracker.png" alt="Shirt Tracker" width="3292" height="952" style="max-width:min(500px, 90vw); width:100%; height:auto;">`;
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

const updateSignedOutGreeting = () => {
  if (!signedOutGreetingEl) return;
  if (signedOutGreetingEl.dataset && signedOutGreetingEl.dataset.static === "true") {
    return;
  }
  if (document.body.getAttribute("data-auth") === "signed-out") {
    let message = "Hiya, Pal!";
    try {
      if (localStorage.getItem(SIGNED_OUT_GREETING_KEY) === "swell") {
        message = "See ya real soon!";
      }
    } catch (error) {
      // ignore
    }
    signedOutGreetingEl.textContent = message;
    return;
  }
  signedOutGreetingEl.textContent = "Hiya, Pal!";
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
    version: "2.0.5",
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
  if (payload.publicShareId) {
    savePublicShareId(payload.publicShareId);
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
  renderTable();
  applyReadOnlyMode();
  renderTabs();
  renderModeSwitcher();
  renderFooter();
  prefetchPhotoSources();
};

const scheduleSync = () => {
  if (!supabase || !currentUser) return;
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(syncToSupabase, 1200);
};

const syncToSupabase = async () => {
  if (!supabase || !currentUser || isSyncing || isViewerSession) return;
  isSyncing = true;
  try {
    if (!photoMigrationDone) {
      await migrateLocalPhotosToSupabase();
      photoMigrationDone = true;
    }
    const payload = buildCloudPayload();
    const updatedAt = new Date().toISOString();
    await supabase.from("shirt_state").upsert({
      user_id: currentUser.id,
      data: payload,
      updated_at: updatedAt,
    });
    const parsedUpdatedAt = Date.parse(updatedAt);
    setBackupTimestamp(LAST_SYNC_KEY, Number.isNaN(parsedUpdatedAt) ? Date.now() : parsedUpdatedAt);
    setBackupTimestamp(LAST_CLOUD_UPDATE_KEY, parsedUpdatedAt);
    updateUnsavedStatus();
  } catch (error) {
    console.warn("Sync failed", error);
  } finally {
    isSyncing = false;
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
    positionViewerBadge();
    positionAuthAction();
    positionTotalCount();
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
          const path = await uploadPhotoToSupabase(blob, "jpg");
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
    if (input.id === "filter-column" || input.id === "filter-query") {
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
    if (input.id === "filter-column" || input.id === "filter-query") {
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
  activeTypeFilter = new Set();
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
  const container = document.createElement("div");
  Object.assign(container.style, {
    display: "inline-flex",
    borderRadius: "8px",
    overflow: "hidden",
    border: "2px solid #c62828",
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
    Object.assign(btn.style, {
      padding: "7px 24px",
      fontSize: "0.92rem",
      fontWeight: isActive ? "700" : "500",
      border: "none",
      cursor: "pointer",
      background: isActive ? "#c62828" : "#fff",
      color: isActive ? "#fff" : "#c62828",
      transition: "background 0.15s, color 0.15s",
      outline: "none",
      letterSpacing: "0.03em",
    });
    btn.addEventListener("click", () => switchAppMode(mode.id));
    container.appendChild(btn);
  });
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
      moveBtn.className = "btn";
      moveBtn.textContent = "Move";
      Object.assign(moveBtn.style, { background: "#2e7d32", color: "#fff", fontWeight: "600" });
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
  let invState = null;
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}:${chosenTabId}`);
    if (stored) invState = JSON.parse(stored);
  } catch (error) { /* ignore */ }
  if (!invState || !Array.isArray(invState.columns)) return;
  const newRow = { id: createId(), cells: {}, tags: row.tags ? row.tags.slice() : [] };
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
  state.rows = state.rows.filter((r) => r.id !== rowId);
  if (state.rows.length === 0) state.rows = [defaultRow()];
  saveState();
  renderTable();
  renderFooter();
};

const renderTabs = () => {
  if (!tabBar) return;
  tabBar.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "tab-grid";
  tabsState.tabs
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((tab) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `tab-btn${tab.id === tabsState.activeTabId ? " active" : ""}`;
    btn.textContent = tab.name;
    btn.addEventListener("click", () => switchTab(tab.id));
    grid.appendChild(btn);
  });
  tabBar.appendChild(grid);
  {
    const controls = document.createElement("div");
    controls.className = "tab-controls";
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "tab-btn add";
    addBtn.textContent = "➕ Add";
    addBtn.setAttribute("aria-label", "Add tab");
    addBtn.addEventListener("click", () => {
      openTabDialog();
    });
    controls.appendChild(addBtn);
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
    controls.appendChild(renameBtn);
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
    controls.appendChild(deleteBtn);
    tabBar.appendChild(controls);
  }
  updateTabLogo();
};

const switchTab = (tabId) => {
  if (!tabId || tabId === tabsState.activeTabId) return;
  const nextTab = tabsState.tabs.find((tab) => tab.id === tabId);
  activeTypeFilter = new Set();
  saveState();
  tabsState.activeTabId = tabId;
  saveTabsState();
  if (!canUseLocalStorage() && tabsState.embeddedData) {
    const payload = tabsState.embeddedData[tabId];
    if (payload) {
      applyStatePayload(payload);
      enforceFandomRules();
      ensureRowCells();
      if (isViewerSession) {
        state.readOnly = true;
      }
      applyViewerRedactions();
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
      const blob = file instanceof Blob ? file : new Blob([file]);
      if (supabase && currentUser) {
        const extension = file.name && file.name.includes(".")
          ? file.name.split(".").pop()
          : "jpg";
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
  const anyChecked = sheetBody.querySelector(".row-select:checked");
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
};


const deleteSelectedRows = () => {
  if (state.readOnly) return;
  const checked = Array.from(sheetBody.querySelectorAll(".row-select:checked"));
  if (checked.length === 0) return;
  const ids = checked.map((input) => input.dataset.rowId).filter(Boolean);
  const removedRows = state.rows.filter((row) => ids.includes(row.id));
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
    deleteBtn.className = "btn secondary";
    Object.assign(deleteBtn.style, {
      padding: "4px 10px",
      fontSize: "0.8rem",
      color: "#c62828",
      borderColor: "#c62828",
    });
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
    getVisibleColumns().forEach((column) => {
      const td = document.createElement("td");
      td.setAttribute("data-label", getColumnLabel(column));
      const labelLower = getColumnLabel(column).trim().toLowerCase();
      if (column.type === "photo" || labelLower === "price") {
        td.classList.add("print-hide");
      }
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
    tagsButton.className = "btn-icon";
    tagsButton.textContent = "Tags";
    tagsButton.style.marginRight = "0";
    if (getRowTags(row).length) {
      tagsButton.style.background = "#dbe9ff";
      tagsButton.style.borderColor = "#8eb6ff";
      tagsButton.style.color = "#234aa3";
      tagsButton.style.fontWeight = "600";
    }
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
      saleBtn.className = "btn-icon";
      saleBtn.textContent = "For Sale";
      saleBtn.style.marginRight = "0";
      saleBtn.style.fontSize = "0.72rem";
      if (isForSale(row)) {
        Object.assign(saleBtn.style, {
          background: "#e8f5e9",
          borderColor: "#66bb6a",
          color: "#2e7d32",
          fontWeight: "600",
        });
      }
      saleBtn.addEventListener("click", () => toggleForSale(row.id));
      actionsWrap.appendChild(saleBtn);
    }
    if (appMode === "wishlist") {
      const moveBtn = document.createElement("button");
      moveBtn.type = "button";
      moveBtn.className = "btn-icon";
      moveBtn.textContent = "Got It!";
      Object.assign(moveBtn.style, {
        marginRight: "0",
        background: "#e8f5e9",
        borderColor: "#66bb6a",
        color: "#2e7d32",
        fontWeight: "600",
        fontSize: "0.78rem",
      });
      moveBtn.addEventListener("click", () => moveRowToInventory(row.id));
      actionsWrap.appendChild(moveBtn);
    }
    actionsWrap.appendChild(checkbox);
    actions.appendChild(actionsWrap);
    tr.appendChild(actions);
  }

  sheetBody.appendChild(tr);
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
  totalCostEl.style.display = "flex";
  totalCostEl.style.flexDirection = "column";
  totalCostEl.innerHTML = "";
  const totalSpan = document.createElement("span");
  totalSpan.textContent = `Total: ${formatCurrency(sum)}`;
  totalCostEl.appendChild(totalSpan);
  const avgSpan = document.createElement("span");
  avgSpan.textContent = `Avg: ${formatCurrency(avg)}`;
  totalCostEl.appendChild(avgSpan);
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
    body.textContent = "Start by filling in your first row below. Tap the ? button in the bottom-right corner anytime for help.";
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
  window.__TAURI__.event.listen("menu-share-csv", () => {
    exportCsv();
  });
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
window.setInterval(() => {
  handleInactivityCheck();
}, 5 * 60 * 1000);


const executeClearAll = () => {
  lastClearSnapshot = state.rows.map((row) => ({
    id: row.id,
    cells: { ...(row.cells || {}) },
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
    id: row.id,
    cells: { ...(row.cells || {}) },
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
      showToast("Reset failed. Please try again.");
      console.error("Fresh reset failed", error);
    }
  });
}

authActionButton.addEventListener("click", () => {
  if (currentUser) {
    try {
      localStorage.setItem(SIGNED_OUT_GREETING_KEY, "swell");
    } catch (error) {
      // ignore
    }
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
  } finally {
    verifyBackupButton.textContent = originalLabel;
    verifyBackupButton.disabled = false;
  }
});

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
if (editProfileNameButton) {
  editProfileNameButton.addEventListener("click", () => {
    if (!profileNameDialog || !profileNameInput) return;
    profileNameInput.value = getUserDisplayName() || "";
    openDialog(profileNameDialog);
  });
}

if (copyShareLinkButton) {
  copyShareLinkButton.addEventListener("click", () => {
    copyPublicShareLink();
    showToast("Copied!");
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

scheduleCopyShareSizing();
setupCopyShareSizingObserver();
if (shareColumnsSave) {
  shareColumnsSave.addEventListener("click", () => {
    saveShareColumnsSelection();
  });
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

const renderChangelog = () => {
  if (!changelogList) return;
  changelogList.textContent = "";
  CHANGELOG.forEach((release) => {
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
    changelogList.appendChild(section);
  });
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
  });
}

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

filterQueryInput.addEventListener("input", (event) => {
  state.filter.query = event.target.value;
  saveState();
  renderTable();
});

if (filterTagsSelect) {
  filterTagsSelect.addEventListener("change", (event) => {
    state.filter.query = event.target.value;
    saveState();
    renderTable();
  });
}

clearFilterButton.addEventListener("click", () => {
  state.filter = { columnId: "all", query: "" };
  activeTypeFilter = new Set();
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
normalizeNameColumnsEverywhere();
normalizeSizeOptionsEverywhere();
resetFilterDefault();
loadShirtUpdateDate();
updateHeaderTitle();
updateHeaderSubtitle();
applyMobileHeaderInlineLayout();
window.addEventListener("resize", applyMobileHeaderInlineLayout);
window.addEventListener("orientationchange", applyMobileHeaderInlineLayout);
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
