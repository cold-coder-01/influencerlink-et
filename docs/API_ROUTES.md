# API Routes

All API routes live under `apps/web/app/api`. Auth routes are intentionally public where noted. Protected routes use the signed session cookie from `lib/auth-session.ts` and helpers from `lib/permissions.ts`.

Common safe error shapes:

| Status | Body |
| --- | --- |
| `401` | `{ "success": false, "error": "Authentication required" }` |
| `403` | `{ "success": false, "error": "You do not have permission to access this resource" }` |
| `404` | `{ "success": false, "error": "Resource not found" }` |
| `502` | `{ "success": false, "error": "Could not connect to Odoo" }` |

Some auth validation errors use a `message` key because the login/signup forms already consume that shape.

## Auth

| Route | Purpose | Required role/session | Odoo model used | Main response shape | Common errors |
| --- | --- | --- | --- | --- | --- |
| `POST /api/auth/login` | Authenticate an Odoo user and create the app session cookie. | Public. Request chooses business owner or influencer login flow. | `res.users`, `influencer.profile` for influencer identity resolution. | `{ success, message, redirectTo, uid }` plus session cookie. | `400`, `401`, `502` |
| `POST /api/auth/signup` | Create a partner, portal user, and optional influencer profile. | Public. | `res.partner`, `res.users`, `influencer.industry`, optional `influencer.profile`. | `{ success, message, redirectTo, partner, profile, user }` plus session cookie. | `400`, `409`, `502` |
| `GET /api/me` | Return current session identity. | Any signed-in user. | None directly. | `{ success: true, data: { role, displayName, email, partnerId, influencerProfileId, uid } }` | `401` |
| `GET /api/profile/avatar` | Return the signed-in user's own partner profile image. | Any signed-in user with `session.partnerId`. | `res.partner`. | `{ success: true, data: { displayName, email, image } }` where `image` is a data URL or `null`. | `400`, `401`, `404`, `502` |
| `PATCH /api/profile/avatar` | Upload or replace the signed-in user's own profile image. Accepts form-data `image` as JPEG, PNG, or WebP up to 2 MB. | Any signed-in user with `session.partnerId`. The route never accepts a client-supplied partner id. | `res.partner`. | `{ success: true, data: { displayName, email, image } }` | `400`, `401`, `404`, `502` |

## Industries

| Route | Purpose | Required role/session | Odoo model used | Main response shape | Common errors |
| --- | --- | --- | --- | --- | --- |
| `GET /api/industries` | Return active industry overview cards with profile-derived stats. | Any signed-in user. | `influencer.industry`, `influencer.profile`. | `{ success: true, data: Industry[] }` | `401`, `502` |
| `GET /api/industries/[id]` | Return one industry and matching influencers. | Any signed-in user. | `influencer.industry`, `influencer.profile`. | `{ success: true, data: { industry, influencers, stats } }` | `401`, `404`, `502` |

## Influencers

| Route | Purpose | Required role/session | Odoo model used | Main response shape | Common errors |
| --- | --- | --- | --- | --- | --- |
| `GET /api/influencers` | Intended marketplace list endpoint. | Not implemented in the current codebase. | N/A | N/A | N/A |
| `GET /api/influencers/[id]` | Return one influencer profile. | Any signed-in user. Business owner/admin can view public profile data; influencer profile editing is not implemented by this route. | `influencer.profile`, `influencer.industry`. | `{ success: true, data: InfluencerDetail }` | `401`, `404`, `502` |

## Social Accounts

| Route | Purpose | Required role/session | Odoo model used | Main response shape | Common errors |
| --- | --- | --- | --- | --- | --- |
| `GET /api/social-accounts` | Return social accounts visible to the current user. Influencers see only `session.profileId`; business owners may pass `?influencerId=` for sanitized marketplace data; admins see all and can filter with `status`, `platform`, `q`, `limit`, and `offset`. Missing influencer profile id returns an empty list. | Signed-in user. | `influencer.social.account`. | `{ success: true, data: InfluencerSocialAccount[] }` without token fields. | `401`, `403`, `502` |
| `POST /api/social-accounts` | Submit a social account for manual review. User-submitted verified status and token fields are ignored. | `influencer` for own profile, or `admin`. | `influencer.social.account`. | `{ success: true, data: InfluencerSocialAccount }` | `400`, `401`, `403`, `502` |
| `GET /api/social-accounts/[id]` | Return one social account after ownership checks. | Signed-in user with access. | `influencer.social.account`. | `{ success: true, data: InfluencerSocialAccount }` | `401`, `403`, `404`, `502` |
| `PATCH /api/social-accounts/[id]` | Update non-token account details. Influencers can update own draft, pending, or rejected records. | Owning influencer or admin. | `influencer.social.account`. | `{ success: true, data: InfluencerSocialAccount }` | `400`, `401`, `403`, `404`, `502` |
| `DELETE /api/social-accounts/[id]` | Delete an own draft, pending, or rejected account, or any account as admin. | Owning influencer or admin. | `influencer.social.account`. | `{ success: true, data: { id } }` | `401`, `403`, `404`, `502` |
| `POST /api/social-accounts/[id]/sync/youtube` | Fetch public YouTube channel metrics through the official YouTube Data API and update the Odoo social account with channel id, subscribers when public, video count, average views, `last_synced_at`, `verification_method=api_sync`, and `verification_status=needs_review`. | Owning influencer or admin. Business owners are blocked. | `influencer.social.account`. | `{ success: true, data: InfluencerSocialAccount }` | `400`, `401`, `403`, `404`, `500`, `502` |
| `POST /api/social-accounts/[id]/sync/telegram` | Fetch Telegram chat identity and member count through the official Telegram Bot API and update the Odoo social account with chat id, member count in `followers_count`, `last_synced_at`, `verification_method=api_sync`, and `verification_status=needs_review`. | Owning influencer or admin. Business owners are blocked. | `influencer.social.account`. | `{ success: true, data: InfluencerSocialAccount }` | `400`, `401`, `403`, `404`, `500`, `502` |
| `PATCH /api/social-accounts/[id]/verify` | Admin-only manual review action for `verified`, `rejected`, `needs_review`, or `pending`. | `admin`. | `influencer.social.account`. | `{ success: true, data: InfluencerSocialAccount }` | `400`, `401`, `403`, `404`, `502` |

Planned future Instagram/TikTok routes are documented in [Instagram / TikTok API Research](INSTAGRAM_TIKTOK_API_RESEARCH.md). They are not implemented yet and should not be treated as available API routes.

| Planned route | Purpose |
| --- | --- |
| `GET /api/social-accounts/instagram/connect` | Future Instagram OAuth start route. |
| `GET /api/social-accounts/instagram/callback` | Future Instagram OAuth callback route. |
| `POST /api/social-accounts/[id]/sync/instagram` | Future Instagram metrics sync route. |
| `POST /api/social-accounts/instagram/webhook` | Optional future Instagram webhook route. |
| `GET /api/social-accounts/tiktok/connect` | Future TikTok Login Kit OAuth start route. |
| `GET /api/social-accounts/tiktok/callback` | Future TikTok Login Kit OAuth callback route. |
| `POST /api/social-accounts/[id]/sync/tiktok` | Future TikTok profile/video sync route. |

## Campaigns

| Route | Purpose | Required role/session | Odoo model used | Main response shape | Common errors |
| --- | --- | --- | --- | --- | --- |
| `GET /api/campaigns` | Return campaigns visible to the current user. | Signed-in user. Business owner sees `partner_id = session.partnerId`; influencer sees `influencer_id = session.profileId`; admin sees all. | `influencer.campaign`. | `{ success: true, data: Campaign[] }` | `401`, `502` |
| `POST /api/campaigns` | Create a campaign brief. | `business_owner` or `admin`. | `influencer.campaign`. | `{ success: true, data: { id, message, warning? } }` | `400`, `401`, `403`, `502` |
| `GET /api/campaigns/[id]` | Return one campaign if the current user owns or is assigned to it. | Signed-in user with ownership. Admin can view all. | `influencer.campaign`. | `{ success: true, data: Campaign }` | `401`, `403`, `404`, `502` |
| `GET /api/campaigns/[id]/messages` | Return campaign messages in conversation order. | Signed-in user with campaign ownership or assignment. Admin can view all. | `influencer.message`, `influencer.campaign`. | `{ success: true, data: CampaignMessage[] }` | `401`, `403`, `404`, `502` |
| `POST /api/campaigns/[id]/messages` | Create a campaign reply using the campaign id from the URL. | Signed-in user with campaign ownership or assignment. Admin can create system messages. | `influencer.message`, `influencer.campaign`, `influencer.profile`. | `{ success: true, data: CampaignMessage }` | `400`, `401`, `403`, `404`, `502` |

## Messages

| Route | Purpose | Required role/session | Odoo model used | Main response shape | Common errors |
| --- | --- | --- | --- | --- | --- |
| `GET /api/messages` | Return messages visible to the current user. Missing business partner/profile identity returns an empty list. | Signed-in user. Business owner sees messages for owned campaigns; influencer sees messages for assigned campaigns; admin sees all. | `influencer.message`. | `{ success: true, data: CampaignMessage[] }` | `401`, `502` |
| `POST /api/messages` | Create a campaign invitation or reply. | Signed-in user with campaign ownership or assignment. | `influencer.message`, `influencer.campaign`, `influencer.profile`. | `{ success: true, data: CampaignMessage }` | `400`, `401`, `403`, `404`, `502` |

## Notifications

| Route | Purpose | Required role/session | Odoo model used | Main response shape | Common errors |
| --- | --- | --- | --- | --- | --- |
| `GET /api/notifications` | Return current-user in-app notifications. Supports `unreadOnly=true` and `limit`. Missing business partner/profile identity returns an empty list. | Signed-in user. Business owner sees `recipient_partner_id = session.partnerId`; influencer sees `recipient_influencer_id = session.profileId`; admin sees admin/system notifications. | `influencer.notification`. | `{ success: true, data: AppNotification[] }` | `401`, `502` |
| `POST /api/notifications` | Create a system notification. Normal workflow notifications are created server-side by existing APIs. | `admin`. | `influencer.notification`. | `{ success: true, data: AppNotification }` | `400`, `401`, `403`, `502` |
| `PATCH /api/notifications/[id]/read` | Mark one owned notification as read. | Signed-in owner/admin. | `influencer.notification`. | `{ success: true, data: AppNotification }` | `401`, `403`, `404`, `502` |
| `PATCH /api/notifications/read-all` | Mark all current-user unread notifications as read. Does not mark other users' notifications. | Signed-in user. | `influencer.notification`. | `{ success: true, data: { count } }` | `401`, `502` |

## Contracts

| Route | Purpose | Required role/session | Odoo model used | Main response shape | Common errors |
| --- | --- | --- | --- | --- | --- |
| `GET /api/contracts` | Return contracts visible to the current user. Missing business partner/profile identity returns an empty list. | Signed-in user. Business owner sees own campaign contracts; influencer sees assigned contracts; admin sees all. | `influencer.contract`. | `{ success: true, data: InfluencerContract[] }` | `401`, `502` |
| `POST /api/contracts` | Create a draft contract for a campaign. | `business_owner` for owned campaigns, or `admin`. Influencers are blocked. | `influencer.contract`, `influencer.campaign`. | `{ success: true, data: { id } }` | `400`, `401`, `403`, `404`, `502` |
| `GET /api/contracts/[id]` | Return one contract after ownership checks. | Signed-in user with contract ownership/assignment. Admin can view all. | `influencer.contract`. | `{ success: true, data: InfluencerContract }` | `401`, `403`, `404`, `502` |
| `PATCH /api/contracts/[id]` | Update draft/sent contract fields. | Owning business owner or admin. Influencers cannot edit core fields. | `influencer.contract`. | `{ success: true, data: InfluencerContract }` | `400`, `401`, `403`, `404`, `502` |
| `PATCH /api/contracts/[id]/sign` | Sign as business owner or influencer. When both signatures exist, status becomes `accepted`. | Owning business owner, assigned influencer, or admin. | `influencer.contract`. | `{ success: true, data: InfluencerContract }` | `400`, `401`, `403`, `404`, `502` |

## Payments

| Route | Purpose | Required role/session | Odoo model used | Main response shape | Common errors |
| --- | --- | --- | --- | --- | --- |
| `GET /api/payments` | Return payments visible to the current user. Missing business partner/profile identity returns an empty list. | Signed-in user. Business owner sees own contract/campaign payments; influencer sees assigned earnings; admin sees all. | `influencer.payment`. | `{ success: true, data: InfluencerPayment[] }` | `401`, `502` |
| `POST /api/payments` | Create a requested escrow payment for an accepted/active contract. | Owning `business_owner` or `admin`. Influencers are blocked. | `influencer.payment`, `influencer.contract`. | `{ success: true, data: { id } }` | `400`, `401`, `403`, `404`, `502` |
| `GET /api/payments/[id]` | Return one payment after ownership checks. | Signed-in user with payment ownership/assignment. Admin can view all. | `influencer.payment`. | `{ success: true, data: InfluencerPayment }` | `401`, `403`, `404`, `502` |
| `PATCH /api/payments/[id]` | Update editable draft/requested payment fields. | Owning business owner or admin. Influencers cannot edit payment fields. | `influencer.payment`. | `{ success: true, data: InfluencerPayment }` | `400`, `401`, `403`, `404`, `502` |
| `PATCH /api/payments/[id]/status` | Move payment status through the MVP escrow workflow. | Owning business owner for requested to deposited/cancelled; admin for release/refund/failure. Influencers are read-only. | `influencer.payment`. | `{ success: true, data: InfluencerPayment }` | `400`, `401`, `403`, `404`, `502` |

## Analytics

| Route | Purpose | Required role/session | Odoo model used | Main response shape | Common errors |
| --- | --- | --- | --- | --- | --- |
| `GET /api/analytics` | Return business analytics summary, status distribution, platform distribution, industry performance, and top influencers. | `business_owner` or `admin`. Influencers are blocked. | `influencer.industry`, `influencer.profile`, `influencer.campaign`. | `{ success: true, data: AnalyticsData }` | `401`, `403`, `502` |

## Social Auth Routes

The codebase also contains Google and Telegram auth route handlers:

- `GET /api/auth/google/start`
- `GET /api/auth/google/callback`
- `GET /api/auth/telegram/start`
- `POST /api/auth/telegram/callback`

These are integration-specific auth routes and should remain public where required by OAuth or webhook callback flows. Do not add role protection before confirming the provider flow.
