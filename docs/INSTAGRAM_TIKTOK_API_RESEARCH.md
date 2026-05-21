# Instagram / TikTok API Research

## 1. Purpose

YouTube and Telegram sync are already MVP-ready through official APIs. YouTube uses the YouTube Data API, and Telegram uses the Telegram Bot API. Instagram and TikTok are the next social sync candidates, but both require OAuth, app setup, permission approval, and careful product scoping before implementation.

This document defines a safe official path for Instagram and TikTok integrations in InfluencerLink ET. It is research and planning only. Do not implement API calls, OAuth routes, scraping, unofficial wrappers, or fake synced metrics in this task.

## 2. Executive Summary

- Instagram should use the official Meta Instagram Platform, choosing between Instagram API with Instagram Login and Instagram API with Facebook Login based on the final data needs.
- Useful Instagram metrics usually require an Instagram Professional account, either Business or Creator.
- TikTok should use TikTok Developers products: Login Kit for OAuth and Display API for creator profile/videos where approved.
- TikTok API for Business may matter later for advertiser, ads, TikTok One Creator Marketplace, or brand account workflows, but it is not the basic creator verification path.
- No scraping, unofficial API wrappers, headless browser collection, or public-profile scraping should be used.
- Manual verification must remain as the fallback for Instagram/TikTok until official access is approved and reliable.

## 3. Instagram Official API Research

Relevant official products:

- Instagram Platform / Instagram Graph API.
- Instagram API with Instagram Login for Instagram-authenticated professional account flows where current Meta docs support the needed scopes.
- Instagram API with Facebook Login if the integration needs connected Meta assets, Facebook Pages, or permission paths that still depend on Facebook Login.

Account requirements:

- Useful insights normally require an Instagram Professional account: Business or Creator.
- Some Facebook Login paths may require the Instagram Professional account to be connected to a Facebook Page.
- Personal Instagram accounts are limited and should not be treated as a reliable source for marketplace metrics.

App requirements:

- Meta Developer App.
- Valid OAuth redirect URI.
- App review for required permissions before production use with accounts outside the app team/test users.
- Business verification may be needed for production/advanced access scopes.
- Privacy policy, terms, screencast, data-use explanation, and visible in-app flow are likely needed for review.

Possible permissions/scopes to research against current Meta docs before implementation:

- `instagram_basic`
- `instagram_manage_insights`
- `pages_show_list`
- `pages_read_engagement`
- `business_management` if the chosen Facebook Login path needs it
- `instagram_business_basic`
- `instagram_business_manage_insights`

Possible data:

- Instagram account id.
- Username/handle.
- Profile URL when available or derivable.
- Media count.
- Follower count for eligible professional accounts.
- Media insights.
- Reach, impressions, and engagement depending on permission and API path.
- Audience demographics/location may be restricted and should be treated as optional.

Limitations:

- Data availability depends on account type, login path, current Meta API version, and approved permissions.
- Personal accounts are usually too limited for analytics-grade sync.
- App Review is required for production access to non-developer/tester accounts.
- Tokens expire and need refresh handling.
- The app cannot fetch arbitrary public influencer data without authorization.
- Do not assume follower lists, private account data, or unrestricted audience demographics are available.

## 4. TikTok Official API Research

Relevant official products:

- Login Kit for OAuth.
- Display API for creator profile and video display metadata.
- Content Posting API only if InfluencerLink ET later adds creator publishing workflows.
- TikTok API for Business only if advertiser, ads, brand, Organic API, or TikTok One Creator Marketplace use cases are needed later.

App requirements:

- TikTok Developer account.
- Registered app with client key and client secret.
- App approval for Login Kit and TikTok API products.
- Exact OAuth redirect URI registered in the app configuration.
- Granted scopes, then user authorization for those scopes.

Scopes to research:

- `user.info.basic`
- `video.list`
- Additional Display API scopes available in TikTok docs at implementation time.

Possible data:

- TikTok `open_id`.
- Display name.
- Avatar.
- Profile deep link if returned.
- Bio description if returned.
- Recent or selected videos through Display API.
- Video metadata such as ids, titles/descriptions, duration, cover images, share URLs, and embed links where available.
- Video metrics only if exposed by the approved endpoint/scope. Follower count may not be available in normal Display API scopes.

Limitations:

- App and scope approval are required.
- Users can grant or deny scopes.
- TikTok imposes rate limits and token lifetimes.
- Basic creator metrics are limited compared with scraping claims.
- No arbitrary public scraping.
- TikTok Research API is not the normal path for a commercial influencer marketplace unless InfluencerLink ET qualifies for that program and its use case.

## 5. Proposed Instagram Architecture

Future environment variables:

```env
INSTAGRAM_CLIENT_ID=change_me
INSTAGRAM_CLIENT_SECRET=change_me
INSTAGRAM_REDIRECT_URI=https://app.example.com/api/social-accounts/instagram/callback
META_APP_ID=change_me
META_APP_SECRET=change_me
META_WEBHOOK_VERIFY_TOKEN=change_me
```

Future routes:

| Route | Purpose |
| --- | --- |
| `GET /api/social-accounts/instagram/connect` | Start Meta/Instagram OAuth for the signed-in influencer. |
| `GET /api/social-accounts/instagram/callback` | Validate state, exchange code, fetch account identity, and store server-side token data. |
| `POST /api/social-accounts/[id]/sync/instagram` | Refresh approved Instagram metrics for an owned/admin-accessible account. |
| `POST /api/social-accounts/instagram/webhook` | Optional future webhook receiver if Meta webhooks are used. |

Future flow:

1. Influencer clicks Connect Instagram.
2. Server creates OAuth `state` and redirects to the chosen Meta OAuth flow.
3. App receives auth code.
4. Server validates `state`.
5. Server exchanges code for token.
6. Server fetches Instagram account/profile data.
7. Store or update `influencer.social.account`.
8. Store token server-side only.
9. Set `verification_status = needs_review`, not `verified`.
10. Admin reviews the matched account and metrics.
11. Future sync refreshes metrics.

## 6. Proposed TikTok Architecture

Future environment variables:

```env
TIKTOK_CLIENT_KEY=change_me
TIKTOK_CLIENT_SECRET=change_me
TIKTOK_REDIRECT_URI=https://app.example.com/api/social-accounts/tiktok/callback
```

Future routes:

| Route | Purpose |
| --- | --- |
| `GET /api/social-accounts/tiktok/connect` | Start TikTok Login Kit OAuth for the signed-in influencer. |
| `GET /api/social-accounts/tiktok/callback` | Validate state, exchange code, and store server-side token/account data. |
| `POST /api/social-accounts/[id]/sync/tiktok` | Refresh approved TikTok profile/video metadata for an owned/admin-accessible account. |

Future flow:

1. Influencer clicks Connect TikTok.
2. Server creates OAuth `state` and redirects to TikTok Login Kit.
3. Server receives code.
4. Server validates `state`.
5. Exchange code for access token.
6. Fetch profile/video list using approved Display API scopes.
7. Store or update `influencer.social.account`.
8. Store token server-side only.
9. Set `verification_status = needs_review`.
10. Admin reviews.

## 7. Odoo Model Gap Analysis

The current `influencer.social.account` model is enough for an MVP OAuth/sync start:

- `platform`
- `handle`
- `platform_account_id`
- `profile_url`
- Metric fields
- `access_token`
- `refresh_token`
- `token_expiry`
- `last_synced_at`
- `verification_status`
- `verification_method`

Potential future fields to consider later:

| Field | Purpose |
| --- | --- |
| `token_scope` | Store granted OAuth scopes for debugging and renewal decisions. |
| `token_type` | Store bearer/token type if provider returns it. |
| `refresh_token_expiry` | Track refresh token expiry separately from access token expiry. |
| `connected_at` | Timestamp for initial OAuth connection. |
| `oauth_user_id` | Provider OAuth user id when distinct from platform account id. |
| `oauth_provider` | Distinguish Meta Instagram Login, Facebook Login, TikTok Login Kit, etc. |
| `raw_profile_json` | Sanitized profile payload for audit/debugging. |
| `raw_metrics_json` | Sanitized metrics payload for audit/debugging. |
| `last_sync_error` | Human-safe latest sync error. |
| `sync_status` | `idle`, `syncing`, `failed`, `needs_reauth`, etc. |
| `sync_error_at` | Timestamp for latest sync error. |

Do not add these fields until the implementation task needs them and token encryption/storage policy is finalized.

## 8. Security Requirements

- OAuth tokens must be encrypted at rest before production if stored.
- Tokens must never be returned to frontend APIs.
- Redirect URIs must be exact and HTTPS in production.
- Use OAuth `state` for CSRF protection.
- Verify OAuth `state` in callbacks.
- Use PKCE if the provider supports or requires it.
- Store client secrets server-side only.
- Rotate secrets immediately if leaked.
- App review and permission approval are required before production use.
- Sync endpoints must require a session and existing ownership/admin checks.
- Business owners must not trigger private account sync.
- No scraping, unofficial APIs, browser automation, or public-profile scraping.
- Log provider errors without logging full tokens or sensitive payloads.

## 9. Permission Model

Influencer:

- Can connect/sync own Instagram/TikTok account.
- Cannot mark verified.
- Cannot access other influencers' accounts.

Business owner:

- Can view sanitized verified/pending public metrics.
- Cannot trigger sync.
- Cannot see tokens.

Admin:

- Can view all sanitized metadata.
- Can verify/reject.
- Can trigger sync if needed.
- Should not see raw tokens in UI.

## 10. UI Plan

Influencer `/influencer/social-accounts`:

- Show Connect Instagram button when credentials and route are implemented.
- Show Connect TikTok button when credentials and route are implemented.
- If not configured, show "Coming soon / API credentials not configured."
- If connected, show sync button.
- Show last synced and verification status.

Admin verification:

- Show source method:
  - `manual`
  - `api_sync`
  - `oauth`
- Show last sync error if a future field is added.
- Admin verifies after review.

Business influencer detail:

- Show sanitized metrics only.

## 11. Implementation Phasing

Phase 24.1: Research and docs only.

Phase 24.2: Instagram OAuth skeleton with no production scopes.

- Connect/callback routes.
- State handling.
- Token exchange.
- Store account as `needs_review`.

Phase 24.3: TikTok OAuth skeleton.

- Login Kit.
- Display API profile read.

Phase 24.4: Metric sync jobs.

- Manual sync button.
- Admin sync.
- Error handling.

Phase 24.5: Production app review and permission expansion.

## 12. Recommendation

Do not start Instagram/TikTok coding until a production HTTPS URL exists. Do not request advanced scopes before privacy policy, terms, screencasts, and app review materials are ready. Keep manual verification plus YouTube/Telegram sync as the MVP. Prepare Meta and TikTok developer apps after the deployment domain is stable, then implement OAuth skeletons before expanding metrics.

## Official References To Re-check During Implementation

- Meta Instagram Platform docs: `https://developers.facebook.com/docs/instagram-platform/`
- Meta Instagram API with Instagram Login docs: `https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/`
- Meta Instagram API with Facebook Login docs: `https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/`
- TikTok Login Kit for Web: `https://developers.tiktok.com/doc/login-kit-web/`
- TikTok Display API overview: `https://developers.tiktok.com/doc/display-api-overview/`
- TikTok Display API get started: `https://developers.tiktok.com/doc/display-api-get-started/`
- TikTok API for Business overview: `https://ads.tiktok.com/help/mobile/article?aid=11971`
