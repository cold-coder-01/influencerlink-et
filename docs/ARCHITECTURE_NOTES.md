# Architecture Notes

InfluencerLink ET keeps page files focused on orchestration: read route input, call `lib/` data helpers, pass data to UI, and render loading, empty, or error states.

- Odoo normalization and defensive field handling should live in `apps/web/lib/`.
- Permission checks should use `apps/web/lib/permissions.ts`; API routes must not bypass ownership checks.
- Shared display formatting should use `apps/web/lib/formatters.ts`.
- Repeated route strings should use `apps/web/lib/routes.ts` where practical.
- Platform labels and badge styles should use `apps/web/lib/platform-utils.ts`.
- Match score and ROI calculations should use `apps/web/lib/match-utils.ts`.
- API route response shapes should use `apps/web/lib/api-response.ts` when it is safe to adopt.

API routes that return campaign or influencer-owned records must keep ownership domains in place and must not return all records when partner or profile identifiers are missing.

## Shared UI Components

Page-level dashboard and portal structure should use `apps/web/components/ui/PageHeader.tsx` for consistent title, subtitle, eyebrow, and action placement.

- Repeated glass panels and dashboard cards should use `GlassCard`.
- KPI/stat panels should use `KpiCard`.
- Empty and error states should use `EmptyState` and `ErrorState`.
- Forms should prefer shared `FormField`, `TextInput`, and `SelectInput` components when it is safe for existing controlled state and validation.
- Buttons, link-style actions, back links, badges, and search/filter shells should use the shared UI components where practical.
- Shared UI components should use `apps/web/lib/cn.ts` for simple class merging.
