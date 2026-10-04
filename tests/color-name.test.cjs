const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../src/lib/color-name.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
}).outputText;
const loaded = new Module(filename, module);
loaded._compile(compiled, filename);
const { colorFromName } = loaded.exports;

test("saved colours use the catalogue API's name/hex response", () => {
  assert.equal(colorFromName(" PINK ", [{ name: "pink", hex: "#f39be3" }]), "#f39be3");
  assert.equal(colorFromName("sky blue", [{ name: "Sky-Blue", hex: "#87ceeb" }]), "#87ceeb");
});

test("missing or malformed names do not crash the lookup", () => {
  assert.equal(colorFromName(undefined), null);
  assert.equal(colorFromName(null), null);
  assert.equal(colorFromName(""), null);
  assert.equal(colorFromName("cream", [null, {}, { name: undefined }, { value: "pink", hex: "#ff00ff" }]), "#FFFDD0");
});

test("invalid saved hex falls back to an apparel colour alias", () => {
  assert.equal(colorFromName("burgundy", [{ name: "Burgundy", hex: "invalid" }]), "#800020");
});
