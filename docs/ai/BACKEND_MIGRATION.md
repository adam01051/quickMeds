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
