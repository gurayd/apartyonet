const FIREBASE_API_KEY = process.env.FIREBASE_WEB_API_KEY || "AIzaSyC5D36t8qeWlXXCwvJdt_uZ7jjk3-R8oVk";
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "apartyonet-af6d3";
const DEFAULT_UNIT_SENSITIVE_KEY = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";
const UNIT_SENSITIVE_KEY = process.env.UNIT_SENSITIVE_KEY || DEFAULT_UNIT_SENSITIVE_KEY;

function json(res, status, payload) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.send(JSON.stringify(payload));
}

function b64ToBytes(base64) {
  return Uint8Array.from(Buffer.from(base64, "base64"));
}

function bytesToB64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

function assertEncryptionKey() {
  const keyBytes = b64ToBytes(UNIT_SENSITIVE_KEY);
  if (keyBytes.length !== 32) {
    throw new Error("UNIT_SENSITIVE_KEY must be 32-byte base64.");
  }
  return keyBytes;
}

async function importAesKey() {
  const keyBytes = assertEncryptionKey();
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encryptPayload(payloadObj) {
  const key = await importAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(payloadObj));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return {
    alg: "AES-GCM",
    iv: bytesToB64(new Uint8Array(iv)),
    ciphertext: bytesToB64(new Uint8Array(encrypted))
  };
}

async function decryptPayload(ciphertextB64, ivB64) {
  const key = await importAesKey();
  const ciphertext = b64ToBytes(ciphertextB64);
  const iv = b64ToBytes(ivB64);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return JSON.parse(Buffer.from(new Uint8Array(decrypted)).toString("utf8"));
}

function firestoreValue(value) {
  if (value == null) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    if (Number.isInteger(value)) return { integerValue: String(value) };
    return { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((v) => firestoreValue(v)) } };
  }
  if (typeof value === "object") {
    const fields = {};
    Object.keys(value).forEach((k) => {
      fields[k] = firestoreValue(value[k]);
    });
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function firestoreFieldsFromObject(obj) {
  const fields = {};
  Object.keys(obj || {}).forEach((k) => {
    fields[k] = firestoreValue(obj[k]);
  });
  return fields;
}

function firestoreValueToJs(v) {
  if (!v || typeof v !== "object") return null;
  if (Object.prototype.hasOwnProperty.call(v, "stringValue")) return v.stringValue;
  if (Object.prototype.hasOwnProperty.call(v, "booleanValue")) return !!v.booleanValue;
  if (Object.prototype.hasOwnProperty.call(v, "doubleValue")) return Number(v.doubleValue || 0);
  if (Object.prototype.hasOwnProperty.call(v, "integerValue")) return Number(v.integerValue || 0);
  if (Object.prototype.hasOwnProperty.call(v, "nullValue")) return null;
  if (v.arrayValue && Array.isArray(v.arrayValue.values)) return v.arrayValue.values.map((x) => firestoreValueToJs(x));
  if (v.mapValue && v.mapValue.fields) {
    const out = {};
    Object.keys(v.mapValue.fields).forEach((k) => {
      out[k] = firestoreValueToJs(v.mapValue.fields[k]);
    });
    return out;
  }
  return null;
}

function firestoreDocToJs(doc) {
  const out = {};
  const fields = (doc && doc.fields) || {};
  Object.keys(fields).forEach((k) => {
    out[k] = firestoreValueToJs(fields[k]);
  });
  return out;
}

async function fetchJson(url, options) {
  const resp = await fetch(url, options);
  const text = await resp.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch (_) {
    data = null;
  }
  return { resp, data, text };
}

async function verifyIdToken(idToken) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_API_KEY)}`;
  const { resp, data } = await fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken })
  });
  if (!resp.ok || !data || !Array.isArray(data.users) || !data.users[0]) {
    throw new Error("Geçersiz oturum.");
  }
  const user = data.users[0];
  return {
    uid: String(user.localId || ""),
    email: String((user.email || "")).trim().toLowerCase()
  };
}

async function getFirestoreDocument(path, idToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(FIREBASE_PROJECT_ID)}/databases/(default)/documents/${path}?key=${encodeURIComponent(FIREBASE_API_KEY)}`;
  const { resp, data } = await fetchJson(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${idToken}` }
  });
  if (resp.status === 404) return null;
  if (!resp.ok) {
    const msg = data && data.error && data.error.message ? data.error.message : "Firestore read failed";
    throw new Error(msg);
  }
  return data;
}

async function patchFirestoreDocument(path, payload, idToken) {
  const fieldPaths = Object.keys(payload || {})
    .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
    .join("&");
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(FIREBASE_PROJECT_ID)}/databases/(default)/documents/${path}?key=${encodeURIComponent(FIREBASE_API_KEY)}${fieldPaths ? `&${fieldPaths}` : ""}`;
  const body = JSON.stringify({ fields: firestoreFieldsFromObject(payload) });
  const { resp, data } = await fetchJson(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`
    },
    body
  });
  if (!resp.ok) {
    const msg = data && data.error && data.error.message ? data.error.message : "Firestore write failed";
    throw new Error(msg);
  }
  return data;
}

async function assertWriterAuthorization(idToken, siteId) {
  const sessionUser = await verifyIdToken(idToken);
  if (!sessionUser.uid) throw new Error("Oturum doğrulanamadı.");
  const userDoc = await getFirestoreDocument(`users/${encodeURIComponent(sessionUser.uid)}`, idToken);
  if (!userDoc) throw new Error("Kullanıcı profili bulunamadı.");
  const profile = firestoreDocToJs(userDoc);
  const role = String(profile.role || "");
  const profileSiteId = String(profile.siteId || "");
  const isActive = String(profile.status || "") === "active";
  const canWrite = role === "super_admin"
    || (role === "admin" && profileSiteId === siteId)
    || (role === "site_manager" && profileSiteId === siteId);
  if (!isActive || !canWrite) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  return { sessionUser, profile };
}

module.exports = {
  json,
  encryptPayload,
  decryptPayload,
  firestoreDocToJs,
  getFirestoreDocument,
  patchFirestoreDocument,
  assertWriterAuthorization
};
