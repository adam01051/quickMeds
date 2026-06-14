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
# Delivery Fees And Hours

- Delivery fees are integer UZS amounts. New delivery-enabled pharmacies default to 3000; free delivery remains valid.
- Explicit `open24Hours` is authoritative. Otherwise owners may provide one interval per weekday in `Asia/Tashkent`.
- Missing hours are allowed and never treated as open. `openedAt` remains the establishment date.

# Demo Pharmacy Data

- Demo branches use real OpenStreetMap names, addresses, coordinates, and published hours where available.
- Delivery, insurance, unpublished hours, and fees are explicitly demo-only values recorded in `pharmacyDesc`.
- Demo records remain unverified because only admins may set `verifiedAt`.
- Demo owners use normal signup and pharmacy creation logic; no frontend hardcoded pharmacy records are allowed.

# June 14, 2026 Backend Decisions

- Operating status is backend-computed truth. Frontends must not infer Open now or 24/7 from `openedAt`, descriptions, or visual labels.
- Delivery fees remain persisted integer UZS values. Pickup-only pharmacies store `0`, while delivery-enabled `0` means Free.
- Missing operating hours are valid and never imply that a pharmacy is open.
- The five Tashkent demo records remain development-only, unverified records and must be confirmed, replaced, or removed before production.
- Public visual migrations may hide legacy fields such as medication count, rank, views, and likes without removing the backend fields during the same micro-phase.
- Only one backend process should bind port `3007`; `EADDRINUSE` indicates a duplicate launcher, not a GraphQL contract failure.
- `CommentsInquiry.search.commentGroup` is an optional additive filter; pharmacy-detail callers use `PHARMACY`, while existing callers may continue omitting it.
- Missing member lookup data must not remove an otherwise active comment from public query results.
