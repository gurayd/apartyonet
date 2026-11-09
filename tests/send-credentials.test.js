const assert = require("node:assert/strict");
const test = require("node:test");
const handler = require("../api/send-credentials");

const token = "test.header.signature";
const email = "manager@example.com";
const webhook = "https://example.invalid/mail";
const application = { purpose: "application", to_email: email, site_name: "Test <Site>", password: "Secret&12" };
const admin = { ...application, purpose: "admin", site_id: "test-site", manager_uid: "manager-uid" };

async function request(method, authorization, body) {
  const res = {
    code: null,
    headers: {},
    status(code) { this.code = code; return this; },
    setHeader(key, value) { this.headers[key] = value; return this; },
    send(value) { this.body = JSON.parse(value); }
  };
  await handler({ method, headers: { authorization }, body }, res);
  return res;
}

function mockServices(t, { role = "admin", applicantEmail = email, age = 0, siteId = "test-site" } = {}) {
  const sent = [];
  const previous = process.env.APARTYONET_CREDENTIALS_WEBHOOK;
  process.env.APARTYONET_CREDENTIALS_WEBHOOK = webhook;
  t.after(() => {
    if (previous === undefined) delete process.env.APARTYONET_CREDENTIALS_WEBHOOK;
    else process.env.APARTYONET_CREDENTIALS_WEBHOOK = previous;
  });
  const doc = (values) => Response.json({
    fields: Object.fromEntries(Object.entries(values).map(([key, stringValue]) => [key, { stringValue }]))
  });
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url.startsWith("https://identitytoolkit.googleapis.com/")) {
      assert.equal(JSON.parse(options.body).idToken, token);
      return Response.json({ users: [{ localId: "caller-uid", email: applicantEmail, createdAt: String(Date.now() - age) }] });
    }
    if (url.includes("/users/caller-uid?")) return doc({ role, siteId, status: "active" });
    if (url.includes("/users/manager-uid?")) return doc({ role: "site_manager", siteId, email });
    if (url === webhook) {
      sent.push(Object.fromEntries(options.body));
      return Response.json({ ok: true });
    }
    throw new Error("Unexpected request");
  });
  return sent;
}

test("rejects GET and unauthenticated POST without calling services", async () => {
  const get = await request("GET");
  assert.equal(get.code, 405);
  assert.equal(get.headers.Allow, "POST");
  assert.equal((await request("POST", "", application)).code, 401);
});

test("sends new applicant mail only to the authenticated account", async (t) => {
  const sent = mockServices(t);
  assert.equal((await request("POST", "Bearer " + token, application)).code, 200);
  assert.deepEqual(sent, [{
    action: "send_credentials", to_email: email, site_name: "Test &lt;Site&gt;",
    username: email, password: "Secret&amp;12", login_url: "https://apartyonet.com/login.html"
  }]);
  assert.equal((await request("POST", "Bearer " + token, { ...application, to_email: "other@example.com" })).code, 403);
  assert.equal(sent.length, 1);
});

test("rejects application mail for old accounts", async (t) => {
  const sent = mockServices(t, { age: 11 * 60 * 1000 });
  assert.equal((await request("POST", "Bearer " + token, application)).code, 403);
  assert.equal(sent.length, 0);
});

test("sends to a manager in the admin's site but not an arbitrary email or site", async (t) => {
  const sent = mockServices(t);
  assert.equal((await request("POST", "Bearer " + token, admin)).code, 200);
  assert.equal((await request("POST", "Bearer " + token, { ...admin, to_email: "other@example.com" })).code, 403);
  assert.equal((await request("POST", "Bearer " + token, { ...admin, site_id: "other-site" })).code, 403);
  assert.equal(sent.length, 1);
});

test("site managers cannot use the admin mail flow", async (t) => {
  const sent = mockServices(t, { role: "site_manager" });
  assert.equal((await request("POST", "Bearer " + token, admin)).code, 403);
  assert.equal(sent.length, 0);
});
