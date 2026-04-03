window.APARTYONET_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
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
  const status = data.status || "active";
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
    admin_panel: [roles.SUPER_ADMIN, roles.ADMIN],
    user_management: [roles.SUPER_ADMIN],
    demo_panel: [roles.SUPER_ADMIN, roles.ADMIN, roles.SITE_MANAGER, roles.ASSISTANT_MANAGER, roles.RESIDENT],
    edit_application: [roles.SUPER_ADMIN, roles.ADMIN],
    resident_panel: [roles.RESIDENT]
  };
  return (matrix[module] || []).includes(role);
};

window.enforceSiteScope = function enforceSiteScope(query, siteId) {
  if (!query || !siteId || siteId === "*") return query;
  return query.where("siteId", "==", siteId);
};

window.formatRoleLabel = function formatRoleLabel(role) {
  if (role === "super_admin") return "Süper Yönetici";
  if (role === "admin") return "Admin";
  if (role === "site_manager") return "Site Yöneticisi";
  if (role === "assistant_manager") return "Yönetici Yardımcısı";
  if (role === "resident") return "Kat Sakini";
  return "Tanımsız";
};

window.isProfileActive = function isProfileActive(profile) {
  return !!(profile && profile.status === "active");
};

window.isBootstrapAdminEmail = function isBootstrapAdminEmail(email) {
  return normalizeEmail(email) === "guraydinsel@gmail.com";
};

window.ensureBootstrapAdminProfile = async function ensureBootstrapAdminProfile(db, user) {
  if (!db || !user || !user.uid || !isBootstrapAdminEmail(user.email)) return null;
  const ref = db.collection("users").doc(user.uid);
  const snap = await ref.get();
  if (snap.exists) {
    const data = snap.data() || {};
    const needsPatch =
      data.role !== APARTYONET_ROLES.SUPER_ADMIN ||
      data.siteId !== "*" ||
      data.status !== "active" ||
      normalizeEmail(data.email || "") !== normalizeEmail(user.email);
    if (needsPatch) {
      await ref.set({
        email: normalizeEmail(user.email),
        displayName: data.displayName || user.displayName || "ApartYönet Admin",
        role: APARTYONET_ROLES.SUPER_ADMIN,
        siteId: "*",
        unitId: "",
        status: "active",
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      const patched = await ref.get();
      return { uid: patched.id, ...patched.data() };
    }
    return { uid: snap.id, ...data };
  }
  const payload = {
    email: normalizeEmail(user.email),
    displayName: user.displayName || "ApartYönet Admin",
    role: APARTYONET_ROLES.SUPER_ADMIN,
    siteId: "*",
    unitId: "",
    status: "active",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  await ref.set(payload, { merge: true });
  return { uid: user.uid, ...payload };
};
