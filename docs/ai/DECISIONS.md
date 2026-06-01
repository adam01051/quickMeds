# Architectural Decisions

## Decisions

| Decision | Why | Risks | Alternatives |
| --- | --- | --- | --- |
| Perform a safe rename layer before domain migration. | It reduces blast radius and proves project wiring can move from Nestar to quickMeds without altering behavior. | Real-estate terminology remains visible after the rename. | Rename branding and domain concepts in one large change, which is faster but much riskier. |
| Preserve GraphQL business APIs during the rename. | Frontend and external clients can keep using existing operations while backend project identifiers change. | The API still exposes `Property`, `Agent`, and real-estate fields. | Introduce new product APIs immediately and require clients to migrate at the same time. |
| Preserve MongoDB model, schema, and collection names. | Existing data remains compatible and no data migration is required for the safe rename. | Database names no longer match the target product domain. | Rename collections immediately and write migration scripts in the same pass. |
| Use `quickMeds` for human labels and `quickmeds` for tooling identifiers. | Human-facing text keeps the intended brand casing, while package and Nest project identifiers stay lowercase/tool-safe. | Mixed casing must be used carefully in docs and config. | Use one all-lowercase spelling everywhere, losing the brand casing in prose. |
| Rename app folders and Nest project keys. | Folder/project names are visible project identifiers and should no longer carry Nestar branding. | Import paths and build scripts can break if any old path is missed. | Keep folders named `nestar-*` temporarily, which avoids path churn but leaves old branding in the repo. |
| Defer product/pharmacy schema redesign. | Product schema, role model, prescription rules, stock status, and pharmacy workflows require product decisions. | Migration remains incomplete until a second phase is planned and executed. | Guess product fields now, increasing the chance of rework. |
| Document frontend migration from the backend repo. | The backend repo contains the GraphQL contract and domain terminology that the frontend must consume. | The actual Next.js file paths cannot be verified until the frontend repo is inspected. | Wait to document frontend work until the frontend repo is available. |
| Validate rename with lint and builds. | The rename touched package scripts, Nest project keys, app folders, and imports, so compile validation is necessary. | Lint can auto-fix unrelated style issues because the repo lint script uses `--fix`. | Run only static scans, which would miss TypeScript/Nest project failures. |

## Remaining Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Real-estate GraphQL names remain public. | Frontend UI and API clients still see `Property`, `Agent`, `beds`, `rooms`, and similar terms. | Introduce client aliases first, then backend aliases or versioned API names. |
| MongoDB collection rename is not planned yet. | Future product data may be stored in legacy `properties` fields. | Design a data migration and compatibility strategy before schema changes. |
| Role model is still `USER`, `AGENT`, `ADMIN`. | Pharmacy/vendor permissions cannot be accurately represented yet. | Define the target role model before changing authorization guards. |
| Batch ranking still scores properties and agents. | quickMeds ranking behavior will not match product marketplace needs. | Redesign ranking after product and vendor schemas are decided. |
| Frontend repo has not been inspected. | Route/component mappings are based on backend concepts, not actual frontend files. | Run a frontend inventory before implementation. |
