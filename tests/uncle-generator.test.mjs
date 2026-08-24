import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { resolveArchiveConfig } from "../scripts/archive-config.mjs";
import {
  GENERATED_LEDGER_OUTPUT_PATH,
  synchronizeLedger,
} from "../scripts/sync-ledger.mjs";

const fixtureArchiveRoot = fileURLToPath(new URL("./fixtures/archive", import.meta.url));
const generatedLedgerPath = fileURLToPath(new URL("../app/generated-ledger.ts", import.meta.url));

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Uncle Generator product surface", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Random Uncle Generator<\/title>/i);
  assert.match(html, /Department of Provisional Classification/);
  assert.match(html, /Random Uncle Generator/);
  assert.match(html, /GENERATED DRAFT/);
  assert.match(html, /Gentleman Uncle No\.(?:<!-- -->)?1\d{4}/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/i);
});

test("keeps canon safeguards and Markdown export in the client", async () => {
  const source = await readFile(new URL("../app/uncle-generator.tsx", import.meta.url), "utf8");
  assert.match(source, /import \{ LEDGER_ISSUED_NUMBERS \} from "\.\/generated-ledger"/);
  assert.match(source, /Obsidian ledger synced at startup/);
  assert.match(source, /ledger_status: unreserved/);
  assert.match(source, /phrase_review_required: true/);
  assert.match(source, /Approve candidate locally/);
  assert.match(source, /Download \.md/);
  assert.match(source, /localStorage\.setItem\("uncle-generator-approvals"/);
});

test("archive configuration is explicit and fail-closed", async () => {
  await assert.rejects(resolveArchiveConfig({}), /UNCLES_ARCHIVE_ROOT is required/);
  await assert.rejects(
    resolveArchiveConfig({ UNCLES_ARCHIVE_ROOT: "tests/fixtures/archive" }),
    /must be an absolute path/,
  );

  const missingArchiveRoot = path.join(tmpdir(), `missing-uncle-archive-${process.pid}`);
  await assert.rejects(
    resolveArchiveConfig({ UNCLES_ARCHIVE_ROOT: missingArchiveRoot }),
    /archive root was not found or is not accessible/,
  );

  const emptyArchiveRoot = await mkdtemp(path.join(tmpdir(), "empty-uncle-archive-"));
  try {
    await assert.rejects(
      resolveArchiveConfig({ UNCLES_ARCHIVE_ROOT: emptyArchiveRoot }),
      /canonical Taxonomy Numbering Ledger was not found or is not accessible/,
    );
  } finally {
    await rm(emptyArchiveRoot, { recursive: true, force: true });
  }

  const config = await resolveArchiveConfig({ UNCLES_ARCHIVE_ROOT: fixtureArchiveRoot });
  assert.equal(config.archiveRoot, fixtureArchiveRoot);
  assert.equal(
    config.ledgerPath,
    path.join(
      fixtureArchiveRoot,
      "01_CONSTRUCTION-des-ONTOLOGIES",
      "Taxonomy_Numbering_Ledger",
      "CORE_TaxonomyNumberingLedger_v01.txt",
    ),
  );
});

test("fixture ledger synchronization is deterministic and verifiable", async () => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "uncle-ledger-test-"));
  const outputPath = path.join(temporaryDirectory, "generated-ledger.ts");
  const env = { UNCLES_ARCHIVE_ROOT: fixtureArchiveRoot };

  try {
    const synchronized = await synchronizeLedger({ env, outputPath });
    assert.deepEqual(synchronized.issuedNumbers, [10404, 11188]);

    const generated = await readFile(outputPath, "utf8");
    assert.match(generated, /LEDGER_ISSUED_NUMBERS = \[10404, 11188\]/);
    assert.match(
      generated,
      /LEDGER_SOURCE = "01_CONSTRUCTION-des-ONTOLOGIES\/Taxonomy_Numbering_Ledger\/CORE_TaxonomyNumberingLedger_v01\.txt"/,
    );

    const verified = await synchronizeLedger({ env, outputPath, checkOnly: true });
    assert.equal(verified.changed, false);

    await writeFile(outputPath, `${generated}\n// stale test data\n`, "utf8");
    await assert.rejects(
      synchronizeLedger({ env, outputPath, checkOnly: true }),
      /Generated ledger data is out of date/,
    );
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test("ledger synchronization rejects output at or inside the archive root", async () => {
  const env = { UNCLES_ARCHIVE_ROOT: fixtureArchiveRoot };
  const descendantOutputPath = path.join(fixtureArchiveRoot, "generated-ledger.ts");

  await assert.rejects(
    synchronizeLedger({ env, outputPath: fixtureArchiveRoot }),
    /UNCLES_ARCHIVE_ROOT is a read-only archive/,
  );
  await assert.rejects(
    synchronizeLedger({ env, outputPath: descendantOutputPath }),
    /UNCLES_ARCHIVE_ROOT is a read-only archive/,
  );
  await assert.rejects(readFile(descendantOutputPath, "utf8"), { code: "ENOENT" });
});

test("normal synchronization has one fixed repository output and no CLI override", async () => {
  assert.equal(GENERATED_LEDGER_OUTPUT_PATH, generatedLedgerPath);

  const scriptSource = await readFile(new URL("../scripts/sync-ledger.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(scriptSource, /--output/);

  const currentGeneratedLedger = await readFile(generatedLedgerPath, "utf8");
  await assert.rejects(
    synchronizeLedger({
      env: { UNCLES_ARCHIVE_ROOT: fixtureArchiveRoot },
      checkOnly: true,
    }),
    (error) => error instanceof Error && error.message.includes(generatedLedgerPath),
  );
  assert.equal(await readFile(generatedLedgerPath, "utf8"), currentGeneratedLedger);
});
