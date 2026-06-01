# Next Steps

## Priority Order

1. Decide the target product and pharmacy/vendor domain model.
2. Define GraphQL compatibility policy for property-to-product migration.
3. Plan MongoDB data migration and collection/schema strategy.
4. Inventory the Next.js frontend repo.
5. Implement backend domain migration in small, tested phases.

## Backend Cleanup

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Define product schema | Decide product category, brand, form, dosage/strength, package size, price, stock, prescription requirement, images, description, and lifecycle status. |
| P0 | Define role model | Decide whether `AGENT` becomes pharmacy, vendor, pharmacist, seller, or a combination. |
| P0 | Define GraphQL compatibility policy | Choose between aliases, versioned operations, or breaking rename. |
| P1 | Map property fields to product fields | Identify fields to keep, rename, remove, or migrate. |
| P1 | Plan shared enum migration | Replace `PROPERTY` groups only after comments/likes/views/notifications compatibility is designed. |
| P1 | Redesign batch ranking | Replace property/agent ranking with product/vendor ranking. |
| P2 | Remove real-estate terminology from logs and comments | Do after behavior-level names are changed. |

## Frontend Migration

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Inspect the Next.js repo | Inventory routes, GraphQL documents, generated types, components, stores, and UI copy. |
| P0 | Add frontend terminology map | Let UI say quickMeds/product/pharmacy while backend remains compatible. |
| P1 | Add GraphQL adapter aliases | Wrap `getProperties` as `getProducts`, `createProperty` as `createProduct`, and similar aliases. |
| P1 | Migrate route labels and navigation | Replace property/agent language in menus, page titles, breadcrumbs, and buttons. |
| P1 | Migrate product cards/detail screens | Replace beds/rooms/square/rent/barter UI with product-specific fields once backend supports them. |
| P2 | Remove temporary aliases | Do this after backend GraphQL operations are renamed or versioned. |

## Testing

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Add GraphQL smoke tests for existing compatibility | Ensure property/agent operations still work before domain migration. |
| P0 | Add build/lint checks to migration checklist | Keep `npm run lint`, `npm run build`, and project-specific Nest builds. |
| P1 | Add domain migration tests | Cover product create/update/search once schema is introduced. |
| P1 | Add Mongo migration dry-run tests | Validate data transforms before touching production data. |
| P2 | Add frontend e2e smoke tests | Cover catalog, product detail, saved products, vendor/pharmacy pages, and admin inventory. |

## Documentation

| Priority | Task | Notes |
| --- | --- | --- |
| P0 | Keep migration docs updated after each phase | Update these docs when backend or frontend migration work lands. |
| P1 | Add API compatibility matrix | Track old GraphQL names, new aliases, deprecation state, and removal date. |
| P1 | Add Mongo migration runbook | Include backup, dry-run, migration, rollback, and verification steps. |
| P2 | Add frontend migration screenshots/checklist | Useful once the Next.js repo is available. |
