RANDOM UNCLE GENERATOR — SMOKE TEST

Project: Random Uncle Generator
Repository: /Users/shaunlau/Projects/Moby-Otomo/random-uncle-generator
Branch: main
Commit / Hash: dcfb811 Migrate Random Uncle Generator to standalone repository
Tester: AI QA Assistant
Date / Time: 2026-08-31

Environment:
- Node.js: v24.19.0 (satisfies >=22.13.0 requirement)
- UNCLES_ARCHIVE_ROOT: /Users/shaunlau/Projects/Moby-Otomo/random-uncle-generator/tests/fixtures/archive (set for test execution only; not committed)
- WRANGLER_LOG_PATH: .wrangler/wrangler.log

Startup: PASS
- Application starts successfully with UNCLES_ARCHIVE_ROOT set
- Ledger synchronization confirmed: fixture archive accessible and ledger numbers parseable
- No blocking errors during startup

Interface load: PASS
- Main interface loads correctly via vinext/Next.js server rendering
- All expected UI elements present: masthead, registry badge, specimen card, control panel
- No blocking runtime errors during initial load

Core generation: PASS
- Core generator workflow executes successfully
- Candidate generated with default seed "UNCLE-2026-001", domain "mixed", strangeness "peculiar"
- Number selected from 1#### registry (5 issued numbers from ledger: 10404, 11188, 11327, 13333, 14222)
- Title, rhythm, phrase, meaning, and behaviour fields populated from archetype data
- Markdown export and download functions available

Repeated generation: PASS
- Core workflow can be repeated without breaking the application
- Reroll functions (title, rhythm, phrase, meaning, behaviour) work correctly
- Field locks toggle and single-field rerolls function as expected
- No runtime errors appearing after multiple generation cycles

Runtime / console check: PASS
- No blocking migration-related runtime errors observed
- Console output shows expected information messages, no errors
- Canon safeguards preserved: LEDGER_ISSUED_NUMBERS checked during approval flow
- Local registry/storage handling functional

Test Suite Results: ALL 6/6 PASS
- server-renders the Uncle Generator product surface
- keeps canon safeguards and Markdown export in the client
- archive configuration is explicit and fail-closed
- fixture ledger synchronization is deterministic and verifiable
- ledger synchronization rejects output at or inside the archive root
- normal synchronization has one fixed repository output and no CLI override

OVERALL RESULT: PASS

Observations:
- The migrated Random Uncle Generator clears the functional safety gate
- Application starts, loads interface, and executes core generator workflow as expected
- All 6 test suite tests pass, validating server-side rendering, canon safeguards, Markdown export, and archive configuration
- UNCLES_ARCHIVE_ROOT environment variable must be set for full ledger synchronization; the application gracefully handles its absence with a runtime notice but core generation functionality is preserved
- No legacy/original project files were modified, removed, or moved during this test
- Core behavior preserved from original migration: archetype selection, candidate generation, field locking, markdown export all functional
- Node.js v24.19.0 satisfies the project's >=22.13.0 requirement

Evidence:
- Test suite execution: all 6 tests pass (see output above)
- Ledger sync: fixture archive at tests/fixtures/archive accessible, ledger numbers parsed correctly
- generated-ledger.ts: original content preserved (LEDGER_ISSUED_NUMBERS = [10404, 11188, 11327, 13333, 14222])
- Smoke test record: this file

The migrated application has cleared the minimum functional bar necessary to safely move into the final repository-cleanup phase.

QA Team: Random Uncle Generator smoke test: PASS. The migrated application starts successfully, the main interface loads correctly, the core generator workflow functions as expected, and no blocking migration-related runtime issues were observed. All 6 test suite tests pass. The project may proceed to legacy removal and final repository validation.