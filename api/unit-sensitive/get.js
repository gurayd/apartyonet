const {
  json,
  decryptPayload,
  firestoreDocToJs,
  getFirestoreDocument,
  assertWriterAuthorization
} = require("../_unit-sensitive-lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return json(res, 405, { ok: false, message: "Method not allowed" });

  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const idToken = String(body.idToken || "");
    const siteId = String(body.siteId || "").trim();
    const unitId = String(body.unitId || "").trim();
    if (!idToken || !siteId || !unitId) {
      return json(res, 400, { ok: false, message: "Eksik parametre." });
    }

    await assertWriterAuthorization(idToken, siteId);
    const docPath = `site_panels/${encodeURIComponent(siteId)}/unit_private/${encodeURIComponent(unitId)}`;
    const doc = await getFirestoreDocument(docPath, idToken);
    if (!doc) return json(res, 200, { ok: true, tcKimlikNo: "", birthDate: "" });

    const row = firestoreDocToJs(doc);
    if (!row.ciphertext || !row.iv) {
      return json(res, 200, { ok: true, tcKimlikNo: "", birthDate: "" });
    }
    const payload = await decryptPayload(String(row.ciphertext || ""), String(row.iv || ""));
    return json(res, 200, {
      ok: true,
      tcKimlikNo: String(payload.tcKimlikNo || ""),
      birthDate: String(payload.birthDate || "")
    });
  } catch (err) {
    return json(res, 500, { ok: false, message: err && err.message ? err.message : "Okunamadı." });
  }
};
