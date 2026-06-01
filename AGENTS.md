# quickMeds Backend Agent Instruction





QuickMeds is NestJS GraphQL monorepo migrated from real estate platform into a Pharmacy shop platform


##READ FIRST

Before changing code, read the current ai handoff docs


- `docs/ai/BACKEND_MIGRATION.md:`
- `docs/ai/DECISIONS.md`
- `docs/ai/COMPLETED_TASKS.md`
- `docs/ai/NEXT_STEPS.md`

## Project Shape

- Backend apps are `quickmeds-api` and petoria-batch.
- Keep the existing NestJS resolver/service/module pattern based on MVC and DI.
- Keep DTOs, enums, schemas under `apps/quickmeds-api/src/libs`.
- Keep shared modules reusable: auth, member, like, view, comment, follow, board article, socket.

## Domain Rules

- Use quickMeds/product terminology for the main catalog entity.
- Do not reintroduce property or real-estate fields.
- Keep `MemberType.USER`, `MemberType.AGENT` and `MemberType.ADMIN` unchanged.
- Pharmacy ownership continues to use `MemberType.AGENT`  unless a later migration explicitly changes it.
- Pharmacy enum values are:
- `pharmacyType`: `RETAIL` `HOSPITAL` `COMPOUNDING` `ONLINE`
- `pharmacyStatus`: `HOLD` `ACTIVE` `CLOSED` `DELETE`

## Workflow
1. Anylyze before editing.
2. Keep changes small and consistent with existing project patterns.
3. Do not remove working logic unless it is replaced safely.
4. Update `docs/ai/COMPLETED_TASKS.md` after major completed work.
5. Add or update focused test when behaviour changes


## Validation

```bash
npx tsc -p app/quickmeds-api/tsconfig.app.json --noEmit
npx tsc -p app/quickmeds-batch/tsconfig.app.json --noEmit
npm run build

`npm run lint` runs ESLint with `--fix`, so use it only when file rewriting is acceptable!







_