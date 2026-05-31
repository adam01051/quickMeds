# Useful Prompts

## Prompts From This Session

### Repository Real-Estate Audit

```text
Analyze the repo and list all real-estate-specific modules, DTOs, enums, GraphQL schemas, and UI labels that need to change for a pharmacy marketplace. Do not edit files yet. Return a migration checklist.
```

### Safe Rename Layer

```text
safe rename layer(No business logic change)
rename all visible project/app identifiers from Nestar to quickMeds. DO NOT change domain logic. Keep apis and database collections unchanged. update package names, envirinment labels constants. run lint and typecheck after refactoring. please plan first
```

### Documentation Generation

```text
Create a new folder: docs
Inside it, generate these markdown files:

BACKEND_MIGRATION.md
DECISIONS.md
FRONTEND_MIGRATION.md
COMPLETED_TASKS.md
NEXT_STEPS.md
PROMPTS.md

Use everything completed and discussed in this Codex session.
Each file must summarize the current Nestar -> quickMeds migration state.
Do not change application source code.
Only create documentation files.
Be precise and technical.
Use markdown tables where useful.
```

## Reusable Prompts For Next Codex Session

### Backend Pharmacy-Domain Migration Plan

```text
Analyze the current quickMeds backend and create a decision-complete plan to migrate the real-estate Property/Agent domain to a pharmacy marketplace Product/Pharmacy or Product/Vendor domain. Do not edit files. Include DTOs, enums, resolvers, services, Mongoose schemas, batch jobs, and compatibility risks.
```

### GraphQL Compatibility Strategy

```text
Design a GraphQL compatibility strategy for renaming property APIs to product APIs in quickMeds. Keep existing clients working during migration. Include old operation names, new operation names, alias/deprecation strategy, resolver implementation approach, and test cases. Do not edit files.
```

### MongoDB Migration Script Plan

```text
Inspect the quickMeds Mongoose schemas and propose a MongoDB migration plan from real-estate property fields to pharmacy product fields. Include collection strategy, field mapping, indexes, backup/dry-run/rollback steps, and validation queries. Do not edit files.
```

### Frontend Next.js Audit

```text
Analyze the Next.js frontend repo for Nestar real-estate terminology. List routes, components, GraphQL documents, generated types, UI labels, and state/store names that need to migrate to quickMeds pharmacy marketplace terminology. Do not edit files. Return a prioritized checklist.
```

### Frontend UI Terminology Migration

```text
Create a frontend migration plan to replace Nestar real-estate UI terminology with quickMeds pharmacy marketplace terminology. Include route mapping, component mapping, copy changes, form/filter changes, GraphQL adapter aliases, and validation steps. Do not edit files.
```

### Validation Checklist

```text
After the quickMeds migration changes, run and summarize validation: old-name scans, lint, build/typecheck, Nest project builds, GraphQL smoke tests, and MongoDB compatibility checks. Report failures with file paths and exact next fixes.
```
