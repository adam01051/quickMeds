# Backend Migration

## Current Project Summary

QuickMeds is a NestJS GraphQL monorepo migrated from the original Nestar real-estate platform into a pharmacy marketplace backend. The safe project rename is complete, and the backend catalog ownership domain has now been migrated from real-estate `Property` terminology to pharmacy terminology.

| App | Purpose |
| --- | --- |
| `quickmeds-api` | Main GraphQL/API application |
| `quickmeds-batch` | Scheduled batch/ranking application |

## Completed Backend Domain Migration

| Area | Before | After | Status |
| --- | --- | --- | --- |
| Main catalog module | `PropertyModule` | `PharmacyModule` | Completed |
| Main catalog service/resolver | `PropertyService`, `PropertyResolver` | `PharmacyService`, `PharmacyResolver` | Completed |
| Main catalog DTOs | `Property`, `Properties`, `PropertyInput`, `PropertyUpdate` | `Pharmacy`, `Pharmacies`, `PharmacyInput`, `PharmacyUpdate` | Completed |
| Main catalog enums | `PropertyType`, `PropertyStatus`, `PropertyLocation` | `PharmacyType`, `PharmacyStatus`, `PharmacyLocation` | Completed |
| Mongoose model/collection | `Property`, `properties` | `Pharmacy`, `pharmacies` | Completed |
| Owner counter | `memberProperties` | `memberPharmacies` | Completed |
| Shared social groups | `PROPERTY` | `PHARMACY` | Completed |
| Batch ranking | top properties | top pharmacies | Completed |

## GraphQL Changes

This phase is a breaking API rename. Old `Property*` GraphQL types and operations were intentionally removed instead of kept as compatibility aliases.

| Removed | Current |
| --- | --- |
| `createProperty` | `createPharmacy` |
| `getProperty` | `getPharmacy` |
| `getProperties` | `getPharmacies` |
| `getAgentProperties` | `getAgentPharmacies` |
| `getAllPropertiesByAdmin` | `getAllPharmaciesByAdmin` |
| `updateProperty` | `updatePharmacy` |
| `updatePropertyByAdmin` | `updatePharmacyByAdmin` |
| `removePropertyByAdmin` | `removePharmacyByAdmin` |
| `likeTargetProperty` | `likeTargetPharmacy` |

## Pharmacy Model

The pharmacy schema follows the ER model fields:

- `pharmacyType`: `RETAIL`, `HOSPITAL`, `COMPOUNDING`, `ONLINE`
- `pharmacyStatus`: `HOLD`, `ACTIVE`, `CLOSED`, `DELETE`
- `pharmacyLocation`, `pharmacyAddress`, `pharmacyName`
- `pharmacyDeliveryFee`, `pharmacyLatitude`, `pharmacyLongitude`, `pharmacyMedicationCount`
- `pharmacyViews`, `pharmacyLikes`, `pharmacyComments`, `pharmacyRank`
- `pharmacyImages`, `pharmacyDesc`, `acceptsInsurance`, `hasDelivery`
- `memberId`, `verifiedAt`, `deletedAt`, `openedAt`

## Compatibility Notes

- `MemberType.USER`, `MemberType.AGENT`, and `MemberType.ADMIN` remain unchanged.
- `MemberType.AGENT` is still the pharmacy owner role.
- Existing MongoDB `properties` documents are not automatically migrated into `pharmacies`; production rollout needs a separate data migration/backfill plan if old data must be preserved.
- Frontend and external clients must update GraphQL calls to the new pharmacy API names.
# Delivery And Hours Migration

Run `npm run migrate:pharmacy-hours -- --dry-run`, review counts, back up the database, then run `npm run migrate:pharmacy-hours`. Verify missing timezone/24-hour/schedule fields are zero and non-delivery fees are zero. Restore the pre-migration backup for rollback.

## Tashkent Demo Data Procedure

- `migrate:pharmacy-hours` now reports fractional delivery fees and normalizes fractional delivery-enabled fees to `3000 UZS`.
- The legacy `QuickCare Pharmacy` fractional fee was normalized from `3.5` to `3000`.
- The tracked fallback image is `uploads/pharmacy/default-pharmacy.webp`; ordinary runtime uploads remain ignored.
- Five demo owners were created through `signup`, then one pharmacy per owner was created through authenticated `createPharmacy`.
- Re-running the seed procedure must query stable owner nicknames and pharmacy name/address pairs first and skip existing records.
- Before production, replace or remove the demo records and verify all public facts with the pharmacy operators.

## June 14, 2026 Migration State

- The delivery-fee and operating-hours migration has been implemented and executed against the development database.
- Verification dry-run reports zero missing timezone, 24/7, schedule, invalid delivery-fee, or fractional delivery-fee work.
- The legacy `QuickCare Pharmacy` fractional delivery fee was normalized to integer UZS.
- Five Tashkent demo owners and pharmacies exist for frontend visual validation and cover 24/7, missing-hours, standard, closed-day, overnight, free-delivery, paid-delivery, pickup-only, and insurance combinations.
- No permanent demo-data seed framework was added; records were created through normal GraphQL signup and create-pharmacy behavior.
- The backend-hosted fallback image remains required while demo pharmacy records reference it.
- Before production, back up the database, remove or verify demo records, and rerun the pharmacy-hours migration in dry-run mode.
