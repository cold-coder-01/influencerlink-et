# Permissions

InfluencerLink ET uses role-aware signed sessions and server-side permission helpers in `apps/web/lib/permissions.ts`.

## Roles

| Role | Meaning |
| --- | --- |
| `business_owner` | Business account that creates and manages campaigns. |
| `influencer` | Creator account linked to an `influencer.profile`. |
| `admin` | Odoo system administrator mapped from `base.group_system`. Admin behavior is only active where implemented. |

Legacy `business` session roles are normalized to `business_owner`.

## Role Mapping

Password login authenticates against Odoo through JSON-RPC, then resolves the app role from real Odoo data:

1. If the authenticated `res.users` record belongs to Odoo external group `base.group_system`, the session role is `admin`.
2. Otherwise, if the user's linked partner has an `influencer.profile`, the session role is `influencer`.
3. Otherwise, the session role is `business_owner`.

The app intentionally does not treat every internal user (`base.group_user`) as admin. It also does not use hardcoded admin emails, personal accounts, or fixed user ids. To grant admin access, assign the Odoo user to the system administrator group in Odoo.

To confirm the current session role during development, sign in and request:

```text
GET /api/me
```

The response should include `data.role: "admin"` for a true Odoo system administrator.

## Session Fields

| Field | Purpose |
| --- | --- |
| `uid` | Odoo `res.users` id. |
| `email` | Login email. |
| `role` | Raw session role. |
| `normalizedRole` | Derived role used by layouts and UI. |
| `partnerId` | Odoo `res.partner` id for business ownership and profile lookup. |
| `profileId` / `influencerProfileId` | Odoo `influencer.profile` id for influencer ownership. |
| `displayName` | Derived display label for the dashboard shell. |

## Business Owner

Business owners can:

- Access `/dashboard`
- Access `/industries`
- Access `/influencers`
- Access `/campaigns`
- Access `/analytics`
- Access `/messages`
- Access `/notifications`
- Access `/contracts`
- Access `/payments`
- Access `/settings`
- Create campaigns
- View own campaigns where `influencer.campaign.partner_id = session.partnerId`
- Create, view, update, and sign contracts for own campaigns
- Create payment records for own accepted/active contracts
- View own payment records and mark requested payments as deposited or cancelled
- View public influencer profile data
- View sanitized verified or pending social account data for a selected influencer
- Update their own partner profile image through `/api/profile/avatar`

Business owners cannot edit influencer profiles through the current app.

## Influencer

Influencers can:

- Access `/influencer/dashboard`
- Access `/influencer/profile`
- Access `/influencer/social-accounts`
- Access `/influencer/campaigns`
- Access `/influencer/notifications`
- Access `/influencer/contracts`
- Access `/influencer/earnings`
- Access `/influencer/settings`
- View their own influencer profile where `influencer.profile.id = session.profileId`
- View assigned campaigns where `influencer.campaign.influencer_id = session.profileId`
- View and sign contracts where `influencer.contract.influencer_id = session.profileId`
- View assigned payment and earning records where `influencer.payment.influencer_id = session.profileId`
- Create and update their own draft, pending, or rejected social account submissions
- Update their own partner profile image through `/api/profile/avatar`

Influencers cannot:

- Create business campaigns
- Create contracts
- Create or update payment records
- Edit core contract fields
- Access `/dashboard`
- Access business analytics
- Mark their own social accounts as verified
- See or edit social OAuth token fields

## Admin

Admins can access `/admin`, `/admin/verifications`, and `/admin/verifications/[id]` to manually review social account submissions. Admins can call `PATCH /api/social-accounts/[id]/verify`; business owners and influencers receive `403`.

## Enforcement Rules

Frontend navigation is not security. Sidebar and topbar links are role-aware for usability, but API routes and server-side data loading enforce access.

Campaign ownership is enforced with these Odoo domains:

| Role | Campaign domain |
| --- | --- |
| `business_owner` | `[["partner_id", "=", session.partnerId]]` |
| `influencer` | `[["influencer_id", "=", session.profileId]]` |
| `admin` | `[]` |

If `partnerId` or `profileId` is missing, the app must not return all records. Current campaign list behavior returns an empty list for missing ownership identity, and detail routes return `403` when ownership does not match.

Contract access follows these ownership checks:

| Role | Contract access |
| --- | --- |
| `business_owner` | `business_partner_id = session.partnerId` or campaign owner matches `session.partnerId`. |
| `influencer` | `influencer_id = session.profileId`. |
| `admin` | All contracts. |

Missing `partnerId` or `profileId` must return an empty contract list and must block signing.

Payment access follows these checks:

| Role | Payment access |
| --- | --- |
| `business_owner` | `business_partner_id = session.partnerId` or related campaign owner matches `session.partnerId`. |
| `influencer` | `influencer_id = session.profileId`. |
| `admin` | All payments. |

Missing `partnerId` or `profileId` must return an empty payment list and must block payment creation or status updates. Influencers are read-only for payments.

Social account access follows these checks:

| Role | Social account access |
| --- | --- |
| `business_owner` | Sanitized verified or pending data for a requested influencer profile. |
| `influencer` | Own records where `influencer.social.account.influencer_id = session.profileId`. Missing `profileId` returns an empty list. |
| `admin` | All social accounts, including manual verification actions. |

Social account token fields are reserved for future OAuth/API sync work and are not returned by frontend API responses.

Notification access follows these checks:

| Role | Notification access |
| --- | --- |
| `business_owner` | Notifications where `recipient_partner_id = session.partnerId`. |
| `influencer` | Notifications where `recipient_influencer_id = session.profileId`. |
| `admin` | Admin/system notifications through the list API, and ownership-bypassed read checks for admin tooling. |

Missing `partnerId` or `profileId` returns an empty notification list and must never expand to all notifications.

Profile avatar access follows the signed session only. `GET /api/profile/avatar`
and `PATCH /api/profile/avatar` use `session.partnerId`; they do not accept a
partner id from the client and cannot update another user's `res.partner` image.

## Protected Layouts

| Area | Behavior |
| --- | --- |
| `app/(dashboard)/layout.tsx` | No session redirects to `/login`; influencer redirects to `/influencer/dashboard`; business owner/admin allowed. |
| `app/(influencer)/layout.tsx` | No session redirects to `/login`; business owner redirects to `/dashboard`; influencer/admin allowed. |
| `app/(admin)/admin/layout.tsx` | No session redirects to `/login`; business owner redirects to `/dashboard`; influencer redirects to `/influencer/dashboard`; only admin allowed. |
