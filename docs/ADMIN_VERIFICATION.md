# Admin Verification Dashboard

The Admin Verification Dashboard is the internal review surface for influencer social account submissions.

## Access

Only signed-in users with normalized session role `admin` can access:

- `/admin`
- `/admin/verifications`
- `/admin/verifications/[id]`

Unauthenticated users are redirected to `/login`. Business owners are redirected to `/dashboard`, and influencers are redirected to `/influencer/dashboard`.

Admin sessions are mapped from real Odoo users. Password login checks whether the authenticated `res.users` record belongs to Odoo external group `base.group_system`; only those users become `role: "admin"`. Portal users and ordinary internal users must not be treated as admins.

Do not create a local admin bypass. For development testing, assign the test Odoo user to the system administrator group and confirm `GET /api/me` returns `data.role: "admin"`. Do not hardcode admin emails or fixed user ids in production.

## Statuses

Social account verification uses these statuses:

| Status | Meaning |
| --- | --- |
| `draft` | Saved before review submission. |
| `pending` | Waiting for internal manual review. |
| `verified` | Manually approved for marketplace trust signals. |
| `rejected` | Not accepted. A rejection reason can be recorded. |
| `needs_review` | Requires more information or further internal review. |

## Review Workflow

1. Admin opens `/admin/verifications`.
2. Admin filters by status, platform, or search term.
3. Admin opens a submission at `/admin/verifications/[id]` or uses quick actions.
4. Admin sets one of `verified`, `rejected`, `needs_review`, or `pending`.
5. Admin can add internal notes and a rejection reason when rejecting.

Review actions call:

- `PATCH /api/social-accounts/[id]/verify`

That route remains admin-only through `canVerifySocialAccount(session)`.

## Privacy

Frontend API responses and admin UI must never expose social token fields:

- `access_token`
- `refresh_token`
- `token_expiry`

The dashboard displays account identity, review status, public metrics, reviewer notes, and rejection reason only.

## MVP Limitation

Verification is manual only. The dashboard does not scrape social platforms and does not run live OAuth/API validation.

Future additions:

- Instagram Graph API.
- TikTok API.
- Review audit trail.
