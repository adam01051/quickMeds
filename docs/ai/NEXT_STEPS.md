# Next Steps

## Current Priority

1. Replace or remove demo pharmacy records before production and verify real-world branch details with operators.
2. Add authenticated GraphQL smoke coverage for owner create/edit, favorites, and recently visited.
3. Add an approved verified-only public filter.
4. Keep current-location distance search deferred.

Pharmacy discovery is authoritative. Do not introduce medicine catalog, inventory, prescription, or price-comparison features.

## Priority Order

1. Plan MongoDB data migration from old property-era documents to pharmacy-era documents if existing data must be preserved.
2. Inventory the Next.js frontend repo and update GraphQL operations to the new pharmacy API.
3. Add focused GraphQL smoke tests for pharmacy create/search/update/like/favorites/visited.
4. Decide whether board articles should become health articles in a later phase.

## Backend Cleanup

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Add pharmacy smoke tests | Cover `createPharmacy`, `getPharmacy`, `getPharmacies`, `updatePharmacy`, `likeTargetPharmacy`, favorites, and visited. |
| P0 | Plan MongoDB backfill | Map `properties` to `pharmacies`, `memberProperties` to `memberPharmacies`, and social `PROPERTY` groups to `PHARMACY`. |
| P1 | Add migration runbook | Include backup, dry-run, backfill, rollback, and verification queries. |
| P1 | Review pharmacy filters | Confirm `pharmacyLocation`, delivery, insurance, and text filters match frontend requirements. |
| P2 | Consider health article migration | ER model includes health articles, while backend still has board articles. |

## Frontend Migration

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Replace old Property GraphQL calls | Use `createPharmacy`, `getPharmacy`, `getPharmacies`, `getAgentPharmacies`, and admin pharmacy operations. |
| P0 | Regenerate GraphQL types | Old `Property*` types are removed by the breaking backend rename. |
| P1 | Migrate route labels and navigation | Replace property/agent language with pharmacy owner/pharmacy terminology. |
| P1 | Migrate pharmacy cards/detail forms | Use pharmacy name, address, type, delivery fee, medication count, insurance, delivery, images, and description. |

## Validation

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Keep TypeScript checks in migration checklist | `npx tsc -p apps/quickmeds-api/tsconfig.app.json --noEmit` and batch equivalent. |
| P0 | Keep build check | Run `npm run build` after implementation work. |
| P1 | Add e2e smoke tests | Cover pharmacy catalog, pharmacy detail, saved pharmacies, and owner pharmacy pages. |
# Delivery And Hours Follow-up

- Run the pharmacy-hours migration in each deployment environment.
- Monitor owner completion of missing working hours.
- Current-location distance search remains deferred.

## Next Backend Work After June 14 Checkpoint

1. Add the approved verified-only public inquiry filter while preserving admin-only verification control.
2. Design coordinate-radius/current-location search, distance output, indexes, limits, and invalid-coordinate behavior before enabling frontend controls.
3. Improve structured Uzbekistan city/district/address data and search beyond the current region enum plus text field.
4. Add authenticated integration smoke coverage for owner create/edit, favorites, and recently visited.
5. Confirm, replace, or remove all demo owners/pharmacies before production.
6. Keep medicine catalog, inventory, prescription, and price-comparison workflows outside the pharmacy-discovery scope.
7. Add an authenticated GraphQL smoke test that creates a pharmacy comment and confirms it remains first in the filtered query.
8. Complete an authenticated Admin Users smoke check covering member list, search, type/status filters, pagination, and member updates.
9. Restart the API server after deploying the chatbot module and smoke test `POST /api/v1/chatbot/message` for missing-provider, platform-support, out-of-scope, medical-advice, and local rate-limit prompts.
10. Configure backend-only `GEMINI_API_KEY` and optional `GEMINI_MODEL` before expecting live Gemini assistant answers.
