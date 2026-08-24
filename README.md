# Random Uncle Generator v1

Random Uncle Generator is a standalone Moby Otomo application for producing seeded, provisional Gentlemen Uncle encyclopedic entries. This repository preserves the existing application, behaviour, generation logic, and canonical number exclusions while separating the app from the physical layout of the Unclesinspace archive.

The Unclesinspace archive remains the external, authoritative source of creative taxonomy data. This application reads its canonical Taxonomy Numbering Ledger but never writes to the archive.

## Requirements

- Node.js 22.13 or newer
- npm
- For development, production builds, startup, or real-ledger verification: local read access to the Unclesinspace archive

Install dependencies from the lockfile:

```bash
npm ci
```

## Configure the external archive

Set `UNCLES_ARCHIVE_ROOT` to the absolute path of the Unclesinspace archive root. The application derives this ledger path from it:

```text
01_CONSTRUCTION-des-ONTOLOGIES/
Taxonomy_Numbering_Ledger/
CORE_TaxonomyNumberingLedger_v01.txt
```

For a local configuration, copy the example and replace its placeholder without committing the result:

```bash
cp .env.example .env.local
```

```dotenv
UNCLES_ARCHIVE_ROOT=/absolute/path/to/Unclesinspace
```

The npm ledger commands load `.env.local` when it exists. A value already exported in the shell takes precedence. The path must be absolute; when the variable, archive directory, or canonical ledger is missing, synchronization fails with an actionable error. There is no fallback to the former monolithic relative-directory layout.

## Development

```bash
npm run dev
```

Open `http://localhost:3000/`. Development, production build, and start commands synchronize `app/generated-ledger.ts` from the configured canonical ledger before launching. Ledger changes are picked up on the next command invocation; the running app does not continuously watch the archive.

The generated module is a repository-owned snapshot of unavailable `1####` numbers. It lets the client protect canonical numbers without accessing the archive at runtime. Synchronization reads the archive and writes only `app/generated-ledger.ts` in this repository.

## Tests

```bash
npm test
npm run lint
npm run typecheck
```

Normal automated tests do not read or write the real Unclesinspace archive. They use the immutable minimal ledger under `tests/fixtures/archive`, generate test output only in a temporary directory, and build against the committed `app/generated-ledger.ts` snapshot.

## Real-ledger synchronization and verification

With `UNCLES_ARCHIVE_ROOT` configured, regenerate the repository snapshot explicitly:

```bash
npm run sync-ledger
```

To compare the committed/generated snapshot with the real canonical ledger without writing either the archive or this repository, run:

```bash
npm run verify-ledger
```

Verification fails if `app/generated-ledger.ts` is missing or differs from what the configured ledger would generate. If it fails because the canonical ledger changed, run `npm run sync-ledger`, review the repository diff, rerun verification, and commit the updated snapshot when appropriate.

## What the generator does

- Generates a coherent Uncle premise from curated behavioural archetypes.
- Assigns a candidate five-digit `1####` number while excluding canonical and local reservations.
- Supports field locks, individual rerolls, domain and strangeness controls, register selection, and Canonical Reliability levels.
- Records local candidate approvals and extra exclusions only in browser storage.
- Copies or downloads a formatted Markdown dossier.

Local approval is not canonical issuance. Exported files retain `ledger_status: unreserved`. Before filing a dossier, recheck and reserve the number in the canonical Taxonomy Numbering Ledger, review the generated Chinese working phrase with a competent human speaker, and make the final editorial and canon decision.

## Preserved cleanup candidates

The migration intentionally retains `db/`, `examples/d1/`, `app/chatgpt-auth.ts`, and the potentially unused public starter assets. Their ownership or future use is uncertain, so any cleanup belongs in a separate, explicitly authorized task.
