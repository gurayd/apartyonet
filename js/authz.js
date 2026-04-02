window.APARTYONET_ROLES = {
  SITE_MANAGER: "site_manager",
  ASSISTANT_MANAGER: "assistant_manager",
  RESIDENT: "resident"
};

window.normalizeEmail = function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
};

window.slugifySiteId = function slugifySiteId(name) {
  return (name || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

window.getCurrentUserProfile = async function getCurrentUserProfile(db, uid) {
  if (!db || !uid) return null;
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  const role = data.role || "";
  const siteId = data.siteId || "";
  const status = data.status || "inactive";
  return {
    uid: snap.id,
    email: normalizeEmail(data.email || ""),
    displayName: data.displayName || "",
    role,
    siteId,
    unitId: data.unitId || "",
    status,
    raw: data
  };
};

window.canAccess = function canAccess(module, role) {
  const roles = window.APARTYONET_ROLES;
  const matrix = {
    admin_panel: [roles.SITE_MANAGER, roles.ASSISTANT_MANAGER],
    user_management: [roles.SITE_MANAGER],
    demo_panel: [roles.SITE_MANAGER, roles.ASSISTANT_MANAGER, roles.RESIDENT],
    edit_application: [roles.SITE_MANAGER, roles.ASSISTANT_MANAGER],
    resident_panel: [roles.RESIDENT]
  };
  return (matrix[module] || []).includes(role);
};

window.enforceSiteScope = function enforceSiteScope(query, siteId) {
  if (!query || !siteId) return query;
  return query.where("siteId", "==", siteId);
};

window.formatRoleLabel = function formatRoleLabel(role) {
  if (role === "site_manager") return "Site Yöneticisi";
  if (role === "assistant_manager") return "Yönetici Yardımcısı";
  if (role === "resident") return "Kat Sakini";
  return "Tanımsız";
};

window.isProfileActive = function isProfileActive(profile) {
  return !!(profile && profile.status === "active");
};
