const {
  json,
  encryptPayload,
  patchFirestoreDocument,
  assertWriterAuthorization
} = require("../_unit-sensitive-lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return json(res, 405, { ok: false, message: "Method not allowed" });

  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const idToken = String(body.idToken || "");
    const siteId = String(body.siteId || "").trim();
    const unitId = String(body.unitId || "").trim();
    const tcKimlikNo = String(body.tcKimlikNo || "").replace(/\D/g, "").slice(0, 11);
    const birthDate = String(body.birthDate || "").trim();

    if (!idToken || !siteId || !unitId) {
      return json(res, 400, { ok: false, message: "Eksik parametre." });
    }

    const { sessionUser } = await assertWriterAuthorization(idToken, siteId);
    const encrypted = await encryptPayload({
      tcKimlikNo,
      birthDate
    });

    const docPath = `site_panels/${encodeURIComponent(siteId)}/unit_private/${encodeURIComponent(unitId)}`;
    await patchFirestoreDocument(docPath, {
      alg: encrypted.alg,
      iv: encrypted.iv,
      ciphertext: encrypted.ciphertext,
      updatedAtIso: new Date().toISOString(),
      updatedBy: String(sessionUser.email || "")
    }, idToken);

    return json(res, 200, { ok: true });
  } catch (err) {
    return json(res, 500, { ok: false, message: err && err.message ? err.message : "Kaydedilemedi." });
  }
};
