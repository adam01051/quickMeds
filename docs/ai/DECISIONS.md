# Architectural Decisions

## Decisions

| Decision | Why | Risks | Alternatives |
| --- | --- | --- | --- |
| Complete a breaking `Property` to `Pharmacy` backend rename. | The requested backend target is a pharmacy marketplace and old property APIs no longer match the domain. | Existing clients using `Property*` GraphQL operations will break until updated. | Keep compatibility aliases temporarily, rejected for this phase. |
| Keep `MemberType.USER`, `MemberType.AGENT`, and `MemberType.ADMIN`. | The user explicitly requested member types remain unchanged. | `AGENT` now semantically means pharmacy owner, which can be confusing. | Add `PHARMACY_OWNER`, rejected for this phase. |
| Rename `memberProperties` to `memberPharmacies`. | Owner counters and ranking should match the pharmacy domain. | Existing member documents need backfill if old counts must be preserved. | Expose both fields temporarily, rejected for this phase. |
| Use `pharmacies` as the canonical collection. | The backend model and collection should match the ER model and GraphQL domain. | Existing `properties` collection data is not read by the new API. | Keep old collection name internally, rejected for this phase. |
| Replace shared `PROPERTY` social groups with `PHARMACY`. | Likes, views, comments, and notifications now target pharmacies. | Existing social documents with `PROPERTY` group need migration if retained. | Support both groups, rejected for this phase. |
| Keep board article/member shared modules reusable. | The migration is scoped to property-to-pharmacy behavior. | Article naming remains separate from the ER model's health article wording. | Rename board articles now, deferred. |

## Remaining Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| No MongoDB backfill has been implemented. | Old `properties`, `PROPERTY` social rows, and `memberProperties` counts will not appear in the new API. | Plan and run a data migration before production rollout. |
| Frontend GraphQL operations are now stale. | The Next.js app must update to `Pharmacy*` types and operations. | Inventory frontend GraphQL documents and regenerate types. |
| `MemberType.AGENT` is domain-ambiguous. | Future maintainers may mistake pharmacy owners for real estate agents. | Document the semantic meaning until a later role migration is approved. |
| Lint uses `--fix`. | Running lint may rewrite unrelated files. | Prefer TypeScript/build checks unless rewriting is acceptable. |
