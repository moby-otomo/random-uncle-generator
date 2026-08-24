import { stat } from "node:fs/promises";
import path from "node:path";

export const ARCHIVE_ROOT_ENV = "UNCLES_ARCHIVE_ROOT";
export const CANONICAL_LEDGER_RELATIVE_PATH =
  "01_CONSTRUCTION-des-ONTOLOGIES/Taxonomy_Numbering_Ledger/CORE_TaxonomyNumberingLedger_v01.txt";

function configurationHint() {
  return `Set ${ARCHIVE_ROOT_ENV} to the absolute path of the Unclesinspace archive (for example, ${ARCHIVE_ROOT_ENV}=/absolute/path/to/Unclesinspace).`;
}

async function requirePathKind(targetPath, expectedKind, description) {
  let targetStat;

  try {
    targetStat = await stat(targetPath);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`${description} was not found or is not accessible at ${targetPath}. ${configurationHint()} (${detail})`);
  }

  const isExpectedKind = expectedKind === "directory" ? targetStat.isDirectory() : targetStat.isFile();
  if (!isExpectedKind) {
    throw new Error(`${description} must be a ${expectedKind}, but ${targetPath} is not one. ${configurationHint()}`);
  }
}

export async function resolveArchiveConfig(env = process.env) {
  const configuredRoot = env[ARCHIVE_ROOT_ENV]?.trim();

  if (!configuredRoot) {
    throw new Error(`${ARCHIVE_ROOT_ENV} is required; no archive location will be inferred from the repository path. ${configurationHint()}`);
  }

  if (!path.isAbsolute(configuredRoot)) {
    throw new Error(`${ARCHIVE_ROOT_ENV} must be an absolute path, but received ${JSON.stringify(configuredRoot)}. ${configurationHint()}`);
  }

  const archiveRoot = path.normalize(configuredRoot);
  const ledgerPath = path.join(archiveRoot, ...CANONICAL_LEDGER_RELATIVE_PATH.split("/"));

  await requirePathKind(archiveRoot, "directory", "The configured Unclesinspace archive root");
  await requirePathKind(ledgerPath, "file", "The canonical Taxonomy Numbering Ledger");

  return Object.freeze({ archiveRoot, ledgerPath });
}
