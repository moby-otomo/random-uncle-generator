# Random Uncle Generator repository guardrails

This repository is the standalone home of the Random Uncle Generator. Preserve its existing application behaviour, generation logic, and canonical taxonomy exclusions unless a task explicitly authorizes product changes.

- Treat the Unclesinspace archive as external, authoritative, read-only creative data.
- Never infer the archive from this repository's filesystem depth. Resolve it only through the absolute `UNCLES_ARCHIVE_ROOT` configuration handled by `scripts/archive-config.mjs`.
- Never write to the canonical Taxonomy Numbering Ledger. Ledger synchronization may only read the archive and update `app/generated-ledger.ts` in this repository.
- Keep normal automated tests independent of the live archive; use `tests/fixtures/archive` or temporary data.
- Use `npm run verify-ledger` for explicit read-only comparison with the configured real ledger and `npm run sync-ledger` for explicit regeneration of the repository snapshot.
- Preserve `db/`, `examples/d1/`, `app/chatgpt-auth.ts`, and the existing public starter assets until their ownership is resolved in a separate cleanup task.
