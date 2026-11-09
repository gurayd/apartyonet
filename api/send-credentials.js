const {
  json, verifyIdToken, assertWriterAuthorization, getFirestoreDocument, firestoreDocToJs
} = require("./_unit-sensitive-lib");

const LOGIN_URL = "https://apartyonet.com/login.html";
const NEW_ACCOUNT_WINDOW_MS = 10 * 60 * 1000;

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, message: "Method not allowed" });
  }

  const idToken = /^Bearer ([\w.-]+)$/i.exec(req.headers.authorization || "")?.[1];
  if (!idToken) return json(res, 401, { ok: false, message: "Oturum gerekli." });

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const siteName = String(body.site_name || "").trim();
  const email = String(body.to_email || "").trim().toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email) || email.length > 254 ||
      password.length < 6 || password.length > 128 || siteName.length > 200) {
    return json(res, 400, { ok: false, message: "Gecersiz e-posta veya hesap bilgisi." });
  }

  try {
    if (body.purpose === "application") {
      const user = await verifyIdToken(idToken);
      const age = Date.now() - user.createdAt;
      if (!user.uid || user.email !== email || !(age >= 0 && age <= NEW_ACCOUNT_WINDOW_MS)) {
        return json(res, 403, { ok: false, message: "Bu hesap icin e-posta gonderilemez." });
      }
    } else if (body.purpose === "admin") {
      const siteId = String(body.site_id || "");
      const managerUid = String(body.manager_uid || "");
      if (!/^[a-z0-9-]{1,200}$/.test(siteId) || !/^[\w-]{1,128}$/.test(managerUid)) {
        return json(res, 400, { ok: false, message: "Gecersiz site veya yonetici." });
      }
      const { profile } = await assertWriterAuthorization(idToken, siteId);
      if (!["admin", "super_admin"].includes(profile.role)) {
        return json(res, 403, { ok: false, message: "Bu islem icin yetkiniz yok." });
      }
      const doc = await getFirestoreDocument(`users/${encodeURIComponent(managerUid)}`, idToken);
      const manager = doc ? firestoreDocToJs(doc) : {};
      if (manager.role !== "site_manager" || manager.siteId !== siteId ||
          String(manager.email || "").toLowerCase() !== email) {
        return json(res, 403, { ok: false, message: "Bu hesap icin e-posta gonderilemez." });
      }
    } else {
      return json(res, 400, { ok: false, message: "Gecersiz islem." });
    }
  } catch (_) {
    return json(res, 403, { ok: false, message: "Oturum veya yetki dogrulanamadi." });
  }

  const webhook = process.env.APARTYONET_CREDENTIALS_WEBHOOK;
  if (!webhook) return json(res, 503, { ok: false, message: "E-posta servisi yapilandirilmamis." });

  try {
    const response = await fetch(webhook, {
      method: "POST",
      body: new URLSearchParams({
        action: "send_credentials",
        to_email: email,
        site_name: escapeHtml(siteName),
        username: escapeHtml(email),
        password: escapeHtml(password),
        login_url: LOGIN_URL
      }),
      signal: AbortSignal.timeout(10000)
    });
    if (response.ok && (await response.json()).ok === true) return json(res, 200, { ok: true });
  } catch (_) {
    // The upstream response can include sensitive fields.
  }
  return json(res, 502, { ok: false, message: "E-posta servisi yanit vermedi." });
};
