# Social Accounts

Task 17 adds an MVP social account verification workflow for `influencer.profile`.

For the official Instagram/TikTok research path, see [Instagram / TikTok API Research](INSTAGRAM_TIKTOK_API_RESEARCH.md). The recommended approach is to keep manual verification and existing YouTube/Telegram sync as MVP, then add Instagram and TikTok only through official OAuth/API products after production HTTPS, app review materials, and approved scopes are ready.

## Odoo Model

Model: `influencer.social.account`

One influencer can have many social accounts through `influencer_id`.

Core fields:

| Field | Purpose |
| --- | --- |
| `name` | Account display name. |
| `influencer_id` | Required owner profile. Deletes with the influencer profile. |
| `platform` | TikTok, Instagram, YouTube, Telegram, Facebook, LinkedIn, X / Twitter, or Other. |
| `handle` / `profile_url` | Creator-facing account identity. |
| `platform_account_id` | Future stable platform id for official integrations. |
| `verification_status` | `draft`, `pending`, `verified`, `rejected`, or `needs_review`. Defaults to `pending`. |
| `verification_method` | `manual`, `oauth`, `api_sync`, or `document`. Defaults to `manual`. |
| Metric fields | Followers, following, media count, average views/likes/comments, engagement rate, audience location, Addis audience percent, sync and verification timestamps. |
| Admin fields | Rejection reason and internal notes. |
| Future token fields | `access_token`, `refresh_token`, `token_expiry`. |

Validation prevents negative followers/views/likes/comments/engagement rate and keeps Addis audience percent between 0 and 100.

## API Routes

| Route | Purpose |
| --- | --- |
| `GET /api/social-accounts` | Influencers receive their own accounts; admins receive all; business owners can pass `?influencerId=` for sanitized marketplace data. Missing influencer profile id returns an empty list. |
| `POST /api/social-accounts` | Influencers submit their own account for manual review. Admins may create for a target influencer. User-submitted verified status is ignored. |
| `GET /api/social-accounts/[id]` | Returns one account after permission checks. |
| `PATCH /api/social-accounts/[id]` | Influencers may update their own draft, pending, or rejected account details. Admins may update all. |
| `DELETE /api/social-accounts/[id]` | Influencers may delete their own draft, pending, or rejected accounts. Admins may delete all. |
| `POST /api/social-accounts/[id]/sync/youtube` | Syncs public YouTube channel metrics through the official YouTube Data API. Owning influencers can sync their own YouTube account; admins can sync any YouTube account. |
| `POST /api/social-accounts/[id]/sync/telegram` | Syncs Telegram public channel/group identity and member count through the official Telegram Bot API. Owning influencers can sync their own Telegram account; admins can sync any Telegram account. |
| `PATCH /api/social-accounts/[id]/verify` | Admin-only manual verification endpoint for `verified`, `rejected`, `needs_review`, or `pending`. |

All responses are sanitized by `apps/web/lib/social-accounts.ts`. Token fields are never returned to frontend responses.

## Permissions

- Influencers can create, view, update, and delete only their own eligible social accounts.
- Influencers cannot mark themselves verified.
- Business owners can view sanitized verified or pending marketplace account data for a selected influencer.
- Admins can view, create, update, delete, and verify all accounts.
- Owning influencers and admins can trigger YouTube and Telegram sync. Business owners cannot trigger private sync.
- Missing `profileId` never expands into all social accounts.

## YouTube API Sync

The YouTube MVP sync uses the official YouTube Data API `channels.list` endpoint with a server-side API key. Configure:

```env
YOUTUBE_API_KEY=change_me
```

The per-account sync route accepts only existing `youtube` social accounts. It identifies the channel from `platform_account_id` first, then a `/channel/{id}` profile URL, then an `@handle` in `profile_url` or `handle`. The API key stays on the server and is never returned to frontend responses.

Synced fields:

| Odoo field | Source |
| --- | --- |
| `platform_account_id` | YouTube channel id. |
| `followers_count` | `subscriberCount` when subscribers are public. Hidden subscriber counts leave the stored value unchanged. |
| `media_count` | `videoCount`. |
| `avg_views` | `viewCount / videoCount`, rounded, when calculable. |
| `last_synced_at` | Current server timestamp. |
| `verification_method` | `api_sync`. |
| `verification_status` | `needs_review`. |

The MVP intentionally does not automatically mark API-synced accounts as `verified`; admins still review the matched account and metrics. The existing OAuth connect flow under `/api/social/youtube/start` and `/api/social/youtube/callback` remains available for creator-owned channel reads, requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, and now also leaves connected accounts in `needs_review`. The new per-account sync route is the documented MVP path for public stats.

Notification TODO: the sync route does not create an admin/influencer notification yet. Manual review actions still use the existing social verification notification flow.

## Telegram MVP Sync

The Telegram MVP sync uses the official Telegram Bot API with a server-side bot token. Configure:

```env
TELEGRAM_BOT_TOKEN=change_me
```

The per-account sync route accepts only existing `telegram` social accounts. It supports handles and links in these formats:

- `@channelname`
- `channelname`
- `https://t.me/channelname`
- `t.me/channelname`

Inputs are normalized to `@channelname` before calling Telegram. The route calls only official Bot API endpoints:

- `getChat`
- `getChatMemberCount`

Synced fields:

| Odoo field | Source |
| --- | --- |
| `platform_account_id` | Telegram chat id from `getChat`. |
| `followers_count` | Member count from `getChatMemberCount`. |
| `last_synced_at` | Current server timestamp. |
| `verification_method` | `api_sync`. |
| `verification_status` | `needs_review`. |

Limitations:

- The bot may need access to the channel or group.
- Private groups and channels may not work unless the bot is added and allowed to read the chat.
- Some metadata may not be available from the Bot API.
- No scraping is used.
- API sync does not automatically verify the account; admins still review it.

Notification TODO: Create notification after Telegram sync when notification targeting for admin review queue is finalized.

## UI

- Influencers manage accounts at `/influencer/social-accounts`.
- `/influencer/profile` shows connected social accounts and links to management.
- `/influencers/[id]` shows verified social accounts to business owners.
- Admins review accounts at `/admin/verifications` and `/admin/verifications/[id]`.
- Internal Odoo users can review accounts through the `Ethio Influencer Pro > Marketplace > Social Accounts` menu.

## MVP Limitations

This module does not scrape social platforms. YouTube has an official API-key MVP sync for public channel statistics. Telegram has an official Bot API MVP sync for chat identity and member count. TikTok, Instagram, Facebook, LinkedIn, and X API sync are not implemented yet. Metrics entered manually through the MVP form remain submissions for review, not automatically verified platform metrics.

Future work:

- Instagram Graph API.
- TikTok API.
- OAuth token encryption and stricter secret storage.
- Review audit trail.
