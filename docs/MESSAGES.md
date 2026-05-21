# Messages

Task 14 adds a lightweight Odoo-backed campaign conversation layer. It is intentionally limited to invitations and replies around `influencer.campaign`; contracts, payments, social verification, and notifications are separate modules.

## Odoo Model

Model: `influencer.message`

Fields:

| Field | Type | Purpose |
| --- | --- | --- |
| `name` | Char | Message subject. |
| `campaign_id` | Many2one `influencer.campaign` | Required campaign thread owner; cascades on campaign delete. |
| `sender_partner_id` | Many2one `res.partner` | Required sender partner. |
| `receiver_partner_id` | Many2one `res.partner` | Optional receiver partner. |
| `influencer_id` | Many2one `influencer.profile` | Optional influencer profile for filtering. |
| `message_type` | Selection | `invitation`, `reply`, `update`, or `system`. |
| `body` | Text | Required message body. |
| `is_read` | Boolean | Read state for MVP inboxes. |
| `read_at` | Datetime | Optional read timestamp. |
| `created_at` | Datetime | Creation timestamp, defaulted by Odoo. |
| `direction` | Selection | `business_to_influencer`, `influencer_to_business`, or `system`. |
| `campaign_status` | Related | Readonly campaign status helper. |
| `campaign_name` | Related | Readonly campaign name helper. |

Ordering is `created_at desc, id desc`.

## API Routes

| Route | Purpose |
| --- | --- |
| `GET /api/messages` | Returns messages visible to the current session. |
| `POST /api/messages` | Creates a campaign message from a request body with `campaignId`, `subject`, `body`, and optional `messageType`. |
| `GET /api/campaigns/[id]/messages` | Returns one campaign conversation in ascending conversation order. |
| `POST /api/campaigns/[id]/messages` | Creates a reply for the campaign in the URL. |

## Permissions

All message routes require a signed session.

- Business owners can view and create messages only for campaigns where `campaign.partner_id = session.partnerId`.
- Influencers can view and create messages only for campaigns assigned to their profile.
- Admins can view all messages and create system messages.
- Missing `partnerId` or `influencerProfileId` returns an empty message list for list endpoints, never all messages.
- Campaign-level access uses the same ownership checks as the campaign lifecycle routes.

## Campaign Lifecycle

Sending an invitation still creates a campaign with `status = pending`. After campaign creation succeeds, the frontend creates an `influencer.message` with `message_type = invitation` tied to that campaign.

If the campaign is created but message creation fails, the UI reports: `Campaign was created, but invitation message could not be sent.`

## MVP Limits

- No push/email/SMS notification delivery yet.
- No read receipt automation beyond the stored fields.
- No attachments.
- No contracts, payments, or social account verification.
- Odoo record rules are intentionally deferred; frontend-facing security is enforced by Next.js API routes.

TODO: Real notifications will be added after notification module.
