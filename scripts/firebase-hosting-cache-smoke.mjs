import assert from "node:assert/strict";

const hostingOrigin = "http://127.0.0.1:5000";
const expectedShellCacheControl = "no-cache, no-store, must-revalidate";

const fetchPage = async (path) => {
  const response = await fetch(`${hostingOrigin}${path}`);
  assert.equal(response.status, 200, `${path} should return HTTP 200`);
  return response;
};

const rootResponse = await fetchPage("/");
assert.equal(
  rootResponse.headers.get("cache-control"),
  expectedShellCacheControl,
  "The root SPA shell should always be revalidated",
);

const rootHtml = await rootResponse.text();
const mainScriptMatch = rootHtml.match(/src="(\/static\/js\/main\.[^"]+\.js)"/);
assert.ok(mainScriptMatch, "The built SPA shell should reference a hashed main script");

const directIndexResponse = await fetchPage("/index.html");
assert.equal(
  directIndexResponse.headers.get("cache-control"),
  expectedShellCacheControl,
  "A direct index.html request should always be revalidated",
);

const deepLinkResponse = await fetchPage("/player/friends");
assert.equal(
  deepLinkResponse.headers.get("cache-control"),
  expectedShellCacheControl,
  "A rewritten SPA deep link should always be revalidated",
);

const mainScriptResponse = await fetchPage(mainScriptMatch[1]);
assert.notEqual(
  mainScriptResponse.headers.get("cache-control"),
  expectedShellCacheControl,
  "Fingerprint-named JavaScript should not inherit the SPA shell cache policy",
);

console.log("Firebase Hosting SPA cache smoke test passed.");
