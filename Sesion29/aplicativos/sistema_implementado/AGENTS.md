# Agent Instructions

## Source of Truth

Before modifying the application, read:

1. `specs/2_requirements.md`
2. `specs/3_technical_spec.md`
3. `specs/modelo_fisico.sql`

These files define the expected behavior, technical conventions, and database structure of the project.

`specs/modelo_logico.dbml` defines the portable logical model; the SQL file implements its rules for SQLite.

## Rules

- Implement only functionality defined in `specs/2_requirements.md`.
- Follow the technical conventions defined in `specs/3_technical_spec.md`.
- Keep the implementation consistent with `specs/modelo_fisico.sql`.
- Do not invent features, requirements, entities, or business rules.
- Do not implement functionality explicitly marked as out of scope.
- Keep the implementation simple and proportional to the project.
- Avoid unnecessary dependencies and architectural layers.
- Prefer existing project patterns before introducing new ones.

## Database

- Fundamental data constraints defined in `specs/modelo_fisico.sql` must be enforced by the database whenever technically possible.
- Application validation may complement database constraints but must not replace them.
- Do not modify the database structure unless required by the specifications.

## Data Model

`specs/modelo_logico.dbml` is a readable representation of the database model.

If the database model changes:

- Update `specs/modelo_fisico.sql`.
- Update `specs/modelo_logico.dbml`.

Both must remain consistent.

## Specification Changes

If product behavior, scope, business rules, or acceptance criteria change:

- Update `specs/2_requirements.md`.

If reusable technical conventions, technologies, or project structure change:

- Update `specs/3_technical_spec.md`.

If the database structure changes:

- Update `specs/modelo_fisico.sql`.
- Update `specs/modelo_logico.dbml`.

## Consistency

The specifications and implementation must remain consistent.

When there is a conflict between implementation and specification, treat the specification as the source of truth until it is intentionally updated.
