const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const originalTs = require.extensions[".ts"];
require.extensions[".ts"] = (loaded, filename) => loaded._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, esModuleInterop: true },
}).outputText, filename);
const { checkPhone } = require("../src/lib/phone.ts");
const { countryCode, searchCountries, locationOptions } = require("../src/lib/locations.ts");
const { invoicePhoneError } = require("../src/lib/validators.ts");
if (originalTs) require.extensions[".ts"] = originalTs; else delete require.extensions[".ts"];

test("phone parsing normalizes local format and honors explicit foreign prefixes", () => {
  assert.equal(checkPhone("0300 1234567", "Pakistan").number, "+923001234567");
  assert.equal(checkPhone("+1 (202) 555-0123", "PK").number, "+12025550123");
  assert.equal(checkPhone("+49301234567890").number, "+49301234567890");
  assert.ok(checkPhone("0300 1234567").error);
  for (const value of ["+92300123", "+920001234567", "+493012345678901", "+923001234567 ext 1"]) {
    assert.ok(checkPhone(value).error, value);
  }
  assert.equal(checkPhone("").error, undefined);
});

test("mobile-specific checks retain landline support for general phone fields", () => {
  assert.equal(checkPhone("+442079460018").number, "+442079460018");
  assert.ok(checkPhone("+442079460018", undefined, true).error);
  assert.equal(checkPhone("+923001234567", undefined, true).number, "+923001234567");
});

test("ISO aliases and country searches use a small bounded local list", () => {
  assert.equal(countryCode("Pakistan"), "PK");
  assert.equal(countryCode("uk"), "GB");
  assert.equal(searchCountries("Pakistan")[0].code, "PK");
  assert.ok(searchCountries("").length <= 50);
});

test("invoice contact checks use each party's country", () => {
  assert.equal(invoicePhoneError({ exporter: { country: "PK", tel: "0300 1234567" } }), null);
  assert.ok(invoicePhoneError({ exporter: { country: "US", tel: "0300 1234567" } }));
  assert.ok(invoicePhoneError({ contactPhone: "+92300123" }));
  assert.equal(invoicePhoneError({ contact: "Accounts office" }), null);
});

test("city lookups share requests, cache results and encode queries safely", async () => {
  const original = global.fetch;
  let calls = 0;
  let requested;
  global.fetch = async (url) => {
    calls++; requested = String(url);
    return { ok: true, json: async () => [{ code: "1", name: "Lahore" }] };
  };
  try {
    const [a,b] = await Promise.all([locationOptions("city", "PK", "Punjab", "Lah&test"), locationOptions("city", "PK", "Punjab", "Lah&test")]);
    assert.deepEqual(a,b); assert.equal(calls,1);
    await locationOptions("city", "PK", "Punjab", "Lah&test");
    assert.equal(calls,1);
    const url = new URL(requested, "http://localhost");
    assert.equal(url.searchParams.get("q"), "Lah&test");
    assert.equal(url.searchParams.get("state"), "Punjab");
  } finally { global.fetch = original; }
});
