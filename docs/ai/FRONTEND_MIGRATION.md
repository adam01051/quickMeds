# Frontend Migration Plan

## Current Authority

QuickMeds is a pharmacy-discovery platform. The public catalog entity is a Pharmacy, not a medicine or generic Product. Medicine catalog, inventory, prescription, and price-comparison workflows are out of scope.

The historical compatibility plan below is retained only as migration context. Its proposed Product/medicine terminology and stale Property GraphQL operations are superseded by the implemented Pharmacy contract and canonical frontend `/pharmacies` routes.

## Context

No Next.js frontend source was inspected in this backend repo. This plan maps the known Nestar backend concepts and likely frontend surfaces to quickMeds pharmacy marketplace concepts. Treat it as the starting checklist for the actual frontend repository audit.

## Step-By-Step Plan

| Step | Task | Output |
| --- | --- | --- |
| 1 | Inventory routes, page files, shared components, GraphQL documents, and UI copy in the Next.js repo. | Exact list of Nestar frontend surfaces. |
| 2 | Add a temporary terminology map so UI labels can change before backend API names change. | UI can say quickMeds/product/pharmacy while still calling current GraphQL operations. |
| 3 | Introduce GraphQL client aliases or adapter functions for property operations. | Frontend code can use product-oriented names without breaking backend compatibility. |
| 4 | Migrate listing/detail/admin pages from property terminology to product terminology. | User-facing experience reflects pharmacy marketplace. |
| 5 | Migrate agent-facing pages to pharmacy/vendor terminology. | Seller workflows match quickMeds domain. |
| 6 | Update filters, forms, validation messages, and empty states. | Real-estate fields are removed from visible UI once backend supports replacements. |
| 7 | Run frontend typecheck, lint, build, and smoke tests. | Verified frontend migration. |

## Route And Component Mapping

| Old Nestar frontend concept | quickMeds target | Notes |
| --- | --- | --- |
| Home page real-estate hero/listings | Pharmacy marketplace home/catalog entry | Replace listing language with medicine/product discovery. |
| Property listing page | Product catalog page | Filters should move from location/type/beds/rooms/square to category/brand/form/stock/prescription. |
| Property detail page | Product detail page | Replace property facts with dosage/form/package/stock/pharmacy data. |
| Agent list page | Pharmacy/vendor list page | `Agent` remains backend terminology for now; UI should use pharmacy/vendor labels. |
| Agent profile page | Pharmacy/vendor profile page | Show store/pharmacy details instead of real-estate agent profile. |
| Favorite properties | Saved products | Backend may still call `getFavorites`. |
| Visited properties | Recently viewed products | Backend may still call `getVisited`. |
| Admin property management | Admin product inventory | Product schema migration required before full replacement. |
| Property create/edit form | Product create/edit form | Backend currently requires real-estate fields, so this needs backend phase 2. |

## GraphQL Query And Mutation Rename Plan

During the compatibility phase, keep backend GraphQL operations unchanged and rename only frontend-local symbols.

| Current backend operation/type | Frontend alias now | Future backend target |
| --- | --- | --- |
| `getProperties` | `getProducts` | `getProducts` |
| `getProperty` | `getProduct` | `getProduct` |
| `createProperty` | `createProduct` | `createProduct` |
| `updateProperty` | `updateProduct` | `updateProduct` |
| `removePropertyByAdmin` | `removeProductByAdmin` | `removeProductByAdmin` |
| `getAllPropertiesByAdmin` | `getAllProductsByAdmin` | `getAllProductsByAdmin` |
| `getAgentProperties` | `getVendorProducts` | `getVendorProducts` |
| `likeTargetProperty` | `saveProduct` or `toggleSavedProduct` | `toggleSavedProduct` |
| `Property` | `Product` | `Product` |
| `PropertiesInquiry` | `ProductsInquiry` | `ProductsInquiry` |

## UI Terminology Changes

| Nestar term | quickMeds term | Migration note |
| --- | --- | --- |
| Property | Product or medicine | Use `Product` for catalog entities. |
| Properties | Products | Use in list headings and admin UI. |
| Agent | Pharmacy, vendor, or seller | Pick one after role model decision. |
| Listing | Product listing | Acceptable during transition. |
| Property type | Product category | Replace apartment/villa/house with medicine categories. |
| Property location | Pharmacy location or service area | Decide whether products or pharmacies own location. |
| Beds | Dosage, strength, or package count | Requires backend schema decision. |
| Rooms | Form, quantity, or package size | Requires backend schema decision. |
| Square | Package size or volume | Do not reuse square-foot UI. |
| Rent | Subscription, delivery option, or remove | Likely remove unless business requires subscription. |
| Barter | Promotion or negotiable flag, or remove | Pharmacy marketplace likely should remove. |
| Sold | Out of stock or discontinued | Map only after inventory lifecycle is defined. |
| constructedAt | Manufactured date or expiration date | Expiration is likely more relevant. |

## Frontend Compatibility Notes

- UI copy can be migrated before backend GraphQL names if the client uses aliases/adapters.
- Do not change backend operation names from the frontend repo without a backend compatibility phase.
- Avoid exposing real-estate field labels to users once quickMeds branding is visible.
- Keep a temporary compatibility layer small and easy to delete after backend GraphQL migration.

## June 14, 2026 Frontend Integration Status

The active frontend now consumes the Pharmacy GraphQL contract and canonical `/pharmacies` routes. It supports persisted UZS delivery fees, owner schedules, explicit 24/7 status, Open-now filters, verified-status display, favorites, comments, and pharmacy detail information.

Completed visual migrations that required no backend changes:

- shared public desktop Warm Civic Pharmacy navbar;
- responsive pharmacy detail page;
- catalog-specific pharmacy-service card;
- catalog loading, error, empty, image-fallback, favorite, and detail states.

Deferred frontend/backend integration:

- verified-only public filtering;
- current-location radius/distance search;
- structured city/district search;
- remaining Nestar catalog shell, Favorites/Recently Visited cards, owner/admin presentation, mobile navigation/catalog, and footer content.
