# Backend Migration

## Original Project Summary

Nestar was a NestJS GraphQL monorepo originally shaped around a real-estate marketplace. The backend exposes a decorator-generated GraphQL schema, Mongoose schemas, and two Nest applications:

| Original app | Purpose |
| --- | --- |
| `nestar-api` | Main GraphQL/API application |
| `nestar-batch` | Scheduled batch/ranking application |

The real-estate domain is still represented by `Property`, `Agent`, property search filters, property lifecycle states, and MongoDB collections such as `properties`.

## New Project Summary

quickMeds is the target pharmacy marketplace backend. The current state is a safe branding and project-identifier migration, not a business-domain migration. Project/app identifiers now use `quickMeds` for human-facing labels and `quickmeds` for package/tooling-safe identifiers.

## Backend Migration Goal

The migration goal is to move from a real-estate platform to a pharmacy marketplace in phases:

1. Complete safe project rename from Nestar to quickMeds.
2. Preserve existing GraphQL and MongoDB contracts while clients are still compatible with old APIs.
3. Later migrate business concepts from properties/agents to products/pharmacies/vendors with an explicit compatibility strategy.

## Naming Changes

| Area | Before | After | Status |
| --- | --- | --- | --- |
| Package name | `nestar` | `quickmeds` | Completed |
| API app folder | `apps/nestar-api` | `apps/quickmeds-api` | Completed |
| Batch app folder | `apps/nestar-batch` | `apps/quickmeds-batch` | Completed |
| Nest project key | `nestar-api` | `quickmeds-api` | Completed |
| Nest project key | `nestar-batch` | `quickmeds-batch` | Completed |
| Runtime API label | `Welcome to Nestar api server!` | `Welcome to quickMeds api server!` | Completed |
| Runtime batch label | `welcome to nestar batch api server!` | `Welcome to quickMeds batch api server!` | Completed |
| Mongo URI app label | `appName=Nestar` | `appName=quickMeds` | Completed |

## Module Changes

| Module area | Current state | Migration note |
| --- | --- | --- |
| App shell | App folders and Nest project paths use `quickmeds-*`. | Safe rename completed. |
| Property module | `PropertyModule`, `PropertyService`, and `PropertyResolver` remain. | Domain migration pending. |
| Member/agent model | `MemberType.AGENT`, `getAgents`, and `AgentsInquiry` remain. | Role model migration pending. |
| Batch module | Batch app renamed, but `BATCH_TOP_PROPERTIES` and `BATCH_TOP_AGENTS` remain. | Batch business logic unchanged. |
| Likes/views/comments | Shared groups still include `PROPERTY`. | Cross-module domain migration pending. |
| Notifications | Notification schema still has `propertyId`. | Product notification migration pending. |

## GraphQL Changes

GraphQL schema generation remains decorator-based through NestJS. No checked-in `.graphql` or `.gql` schema files were found.

| GraphQL surface | Current state | Compatibility note |
| --- | --- | --- |
| Object types | `Property`, `Properties`, `Member` remain unchanged. | Existing clients remain compatible. |
| Inputs | `PropertyInput`, `PropertyUpdate`, `PropertiesInquiry`, `AgentPropertiesInquiry` remain unchanged. | Product-specific inputs are future work. |
| Operations | `createProperty`, `getProperty`, `getProperties`, `getAgentProperties`, `likeTargetProperty` remain unchanged. | No frontend/API breaking change was introduced. |
| Enums | `PropertyType`, `PropertyStatus`, `PropertyLocation`, `MemberType.AGENT` remain unchanged. | Real-estate terminology is still exposed. |

## MongoDB Collection And Schema Changes

No MongoDB collection or schema contract was renamed during the safe rename.

| MongoDB surface | Current state | Migration note |
| --- | --- | --- |
| `properties` collection | Still used by `PropertySchema`. | Preserve until data migration is designed. |
| `members` collection | Still used by `MemberSchema`. | Member role semantics still include `AGENT`. |
| Model names | `Property`, `Member`, `Like`, `View`, `Comment` remain. | No Mongoose model rename yet. |
| URI host/path | Preserved. | Only `appName` label changed to `quickMeds`. |
| Indexes | Property unique index remains on property fields. | Product inventory indexing is future work. |

## Compatibility Notes

- Existing GraphQL clients that call property/agent operations should continue to work.
- Existing MongoDB data remains readable because collection names and schema field names were not changed.
- The backend still exposes real-estate terminology; this is intentional until the business-domain migration phase.
- Future product/pharmacy renames should either provide compatibility aliases or ship as a documented breaking API version.
