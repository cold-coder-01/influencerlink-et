# Notifications

InfluencerLink ET uses Odoo-backed MVP in-app notifications for marketplace activity. This does not send email, SMS, push, WhatsApp, or external provider notifications.

## Odoo Model

Model: `influencer.notification`

Core fields:

| Field | Purpose |
| --- | --- |
| `name` | Notification title. |
| `body` | Optional body text. |
| `notification_type` | Event type such as campaign invitation, message received, contract signed, payment deposited, or social verification update. |
| `recipient_partner_id` | Business owner recipient partner. |
| `recipient_influencer_id` | Influencer recipient profile. |
| `recipient_role` | `business_owner`, `influencer`, `admin`, or `system`. |
| `campaign_id`, `message_id`, `contract_id`, `payment_id`, `social_account_id` | Related records for context. |
| `action_url` | App route to open from the notification. |
| `is_read`, `read_at` | Read state. |
| `created_at` | Creation timestamp. |
| `priority` | `low`, `normal`, or `high`. |

Odoo internal users can manage notifications from `Ethio Influencer Pro > Marketplace > Notifications`.

## Types

Supported notification types:

- `campaign_invitation`
- `message_received`
- `campaign_status`
- `contract_created`
- `contract_signed`
- `payment_created`
- `payment_deposited`
- `social_verified`
- `social_rejected`
- `social_needs_review`
- `system`

## API Routes

| Route | Purpose |
| --- | --- |
| `GET /api/notifications` | Return notifications visible to the current user. Supports `unreadOnly=true` and `limit`. |
| `POST /api/notifications` | Admin-only system notification creation endpoint. Normal event notifications are created server-side by existing workflow APIs. |
| `PATCH /api/notifications/[id]/read` | Mark one owned notification as read. |
| `PATCH /api/notifications/read-all` | Mark all current user unread notifications as read. |

## Permissions

- Business owners see notifications where `recipient_partner_id = session.partnerId`.
- Influencers see notifications where `recipient_influencer_id = session.profileId`.
- Missing `partnerId` or `profileId` returns an empty list, never all notifications.
- Admins can read admin/system notifications from the API and can create system notifications.
- Mark-read actions enforce ownership before writing.

## Event Triggers

Notifications are created after successful workflow writes:

- Campaign invitation message sent.
- New campaign message received.
- Campaign status changed.
- Contract created.
- Contract signed.
- Payment requested.
- Payment marked deposited.
- Social account verified.
- Social account rejected.
- Social account marked needs review.

Notification creation is best-effort and must not break the primary workflow if it fails.

## UI

- Business owners view notifications at `/notifications`.
- Influencers view notifications at `/influencer/notifications`.
- The topbar notification badge calls `/api/notifications?unreadOnly=true&limit=5` and falls back to no badge on error.

## MVP Limitations

This is in-app only. Future additions:

- Email notifications.
- SMS and WhatsApp delivery.
- Push notifications.
- Digest and preference controls.
- Notification audit and deduplication rules.
