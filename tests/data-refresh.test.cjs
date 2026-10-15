const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const { QueryClient, QueryObserver, focusManager, onlineManager } = require("@tanstack/react-query");

function loadSource(relative, mocks = {}) {
  const filename = path.resolve(__dirname, relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
  }).outputText;
  const loaded = new Module(filename, module);
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = loaded.require.bind(loaded);
  loaded.require = (name) => name in mocks ? mocks[name] : originalRequire(name);
  loaded._compile(compiled, filename);
  return loaded.exports;
}

const refresh = loadSource("../src/lib/data-refresh.ts");
const api = loadSource("../src/lib/api-client.ts", {
  "@/lib/data-refresh": refresh,
  "@/lib/auth-token": { getAccessToken: () => null, setTokens() {}, clearTokens() {} },
});

async function until(check) {
  for (let i = 0; i < 200; i++) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  assert.fail("Refresh did not complete");
}

function setup(t) {
  const client = new QueryClient({ defaultOptions: { queries: { ...refresh.freshQueryDefaults, retry: false, gcTime: Infinity } } });
  const unsubscribe = refresh.subscribeToDataChanges(client);
  t.after(() => { unsubscribe(); client.clear(); });
  return client;
}

test("a successful API save updates every visible module and stales hidden screens", async (t) => {
  const client = setup(t);
  let value = 1;
  for (const key of [["screen", "catalog"], ["screen", "inventory"], ["detail", "order"]]) {
    const observer = new QueryObserver(client, { queryKey: key, queryFn: async () => value });
    t.after(observer.subscribe(() => {}));
  }
  await until(() => client.isFetching() === 0);
  client.setQueryData(["screen", "finance"], 1);
  t.mock.method(global, "fetch", async () => { value = 2; return new Response(JSON.stringify({ saved: true })); });
  await api.apiPut("/catalog/products/example", {});
  await until(() => client.getQueryData(["detail", "order"]) === 2);
  assert.equal(client.getQueryData(["screen", "catalog"]), 2);
  assert.equal(client.getQueryData(["screen", "inventory"]), 2);
  assert.equal(client.getQueryData(["screen", "finance"]), 1);
  assert.equal(client.getQueryState(["screen", "finance"]).isInvalidated, true);
});

test("reads and failed saves do not trigger refresh; a 204 deletion does", async (t) => {
  const client = setup(t);
  let reads = 0;
  const observer = new QueryObserver(client, { queryKey: ["screen"], queryFn: async () => ++reads });
  t.after(observer.subscribe(() => {}));
  await until(() => reads === 1 && client.isFetching() === 0);
  t.mock.method(global, "fetch", async (_url, init) => init.method === "GET"
    ? new Response("{}") : new Response(JSON.stringify({ detail: "Conflict" }), { status: 409 }));
  await api.apiGet("/catalog/products");
  await assert.rejects(api.apiPost("/catalog/products", {}), /Conflict/);
  await new Promise((resolve) => setTimeout(resolve, 15));
  assert.equal(reads, 1);
  global.fetch = async () => new Response(null, { status: 204 });
  await api.apiDelete("/catalog/products/example");
  await until(() => reads === 2);
});

test("returning to a cached screen fetches again even within the old 30 second window", async (t) => {
  const client = setup(t);
  let value = 1;
  const options = { queryKey: ["screen", "catalog"], queryFn: async () => value };
  const first = new QueryObserver(client, options);
  const leave = first.subscribe(() => {});
  await until(() => first.getCurrentResult().data === 1);
  leave();
  value = 2;
  const returned = new QueryObserver(client, options);
  t.after(returned.subscribe(() => {}));
  await until(() => returned.getCurrentResult().data === 2);
});

test("an older in-flight response cannot overwrite values refreshed after a save", async (t) => {
  const client = setup(t);
  let finishOld;
  let calls = 0;
  client.setQueryData(["screen"], 1);
  const observer = new QueryObserver(client, {
    queryKey: ["screen"],
    queryFn: () => ++calls === 1 ? new Promise((resolve) => { finishOld = resolve; }) : Promise.resolve(2),
  });
  t.after(observer.subscribe(() => {}));
  await until(() => !!finishOld);
  refresh.notifyDataChanged();
  await until(() => observer.getCurrentResult().data === 2);
  finishOld(1);
  await new Promise((resolve) => setTimeout(resolve, 15));
  assert.equal(client.getQueryData(["screen"]), 2);
});

test("focus and reconnect fetch current values even for a screen with a longer cache time", async (t) => {
  const client = setup(t);
  client.mount();
  t.after(() => { client.unmount(); focusManager.setFocused(undefined); onlineManager.setOnline(true); });
  let value = 1;
  const observer = new QueryObserver(client, {
    queryKey: ["company"], staleTime: 300_000, queryFn: async () => value,
  });
  t.after(observer.subscribe(() => {}));
  await until(() => observer.getCurrentResult().data === 1);
  focusManager.setFocused(false);
  value = 2;
  focusManager.setFocused(true);
  await until(() => observer.getCurrentResult().data === 2);
  onlineManager.setOnline(false);
  value = 3;
  onlineManager.setOnline(true);
  await until(() => observer.getCurrentResult().data === 3);
});

test("writes in one action are combined and unsubscribing cancels queued refreshes", async (t) => {
  const client = setup(t);
  const invalidate = t.mock.method(client, "invalidateQueries", async () => {});
  refresh.notifyDataChanged();
  refresh.notifyDataChanged();
  await until(() => invalidate.mock.callCount() === 1);
  const other = new QueryClient();
  const otherInvalidate = t.mock.method(other, "invalidateQueries", async () => {});
  const unsubscribe = refresh.subscribeToDataChanges(other);
  refresh.notifyDataChanged();
  unsubscribe();
  await new Promise((resolve) => setTimeout(resolve, 15));
  assert.equal(otherInvalidate.mock.callCount(), 0);
  other.clear();
});
