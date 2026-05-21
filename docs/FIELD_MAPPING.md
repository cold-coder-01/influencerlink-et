# Odoo Field Mapping

This document maps Odoo fields used by the Next.js frontend. The frontend is defensive in several places and supports legacy or future aliases. Fields marked optional/alias are not guaranteed by the current Odoo model.

## `influencer.industry`

Current Odoo model: `apps/odoo_addons/ethio_influencer_pro/models/industry.py`

| Odoo field | Current model | Frontend normalized field | Notes |
| --- | --- | --- | --- |
| `id` | Built in | `id` | Odoo record id. |
| `name` | Yes | `name` | Required, translatable. |
| `industry_weight` | Yes | `industryWeight` | Used for ROI weighting and display. |
| `icon` | Yes | `icon` | Optional icon key consumed by frontend. |
| `active` | Yes | N/A | Used in Odoo search domains. |
| N/A | Computed in frontend | `influencerCount` | Counted from linked influencer profiles. |
| N/A | Computed in frontend | `avgRoiMultiplier` | Computed from profile ROI values. |

## `res.partner`

Current Odoo model: built-in Odoo contact model.

| Odoo field | Current model | Frontend normalized field | Notes |
| --- | --- | --- | --- |
| `id` | Built in | `partnerId` | Comes from the signed session. Profile image routes never accept this id from the client. |
| `name` | Built in | `displayName` | Returned by `/api/profile/avatar` when available. |
| `email` | Built in | `email` | Returned by `/api/profile/avatar` when available. |
| `image_128` | Built in | `image` | Read by the profile avatar route and returned as a data URL or `null`. |
| `image_1920` | Built in | N/A | Written by the profile avatar upload route; Odoo derives smaller image sizes. |

## `influencer.profile`

Current Odoo model: `apps/odoo_addons/ethio_influencer_pro/models/influencer.py`

| Odoo field | Current model | Frontend normalized field | Notes |
| --- | --- | --- | --- |
| `id` | Built in | `id` | Odoo record id. |
| `name` | Yes | `name` | Required. |
| `partner_id` | Yes | Session/profile ownership support | Used by login to resolve an influencer profile from a user partner. |
| `industry_ids` | Yes | `industry`, `industryId` | Current many-to-many industry relation. |
| `industry_id` | Optional/alias | `industry`, `industryId` | Frontend supports this many-to-one alias defensively. |
| `avg_views` | Yes | `avgFoodViews` | Current model field. Signup writes this when available. |
| `avg_food_views` | Optional/alias | `avgFoodViews` | Supported defensively by frontend. |
| `addis_audience_pct` | Yes | `addisAudiencePercent` | Current model field. |
| `addis_audience_percent` | Optional/alias | `addisAudiencePercent` | Supported defensively by frontend. |
| `regional_audience_pct` | Yes | N/A | Used by Odoo compute for ROI. |
| `performance_metrics` | Yes | N/A | JSON metrics field, not directly rendered by current frontend. |
| `roi_multiplier` | Yes | `roiMultiplier` | Stored computed field in Odoo. |
| `handle` | Optional/alias | `handle` | Signup and login write/read it only if the field exists. |
| `platform` | Optional/alias | `platform` | Signup and login write/read it only if the field exists. |
| `followers` | Optional/alias | `followers` | Supported defensively. |
| `follower_count` | Optional/alias | `followers` | Supported defensively. |
| `location_focus` | Optional/alias | `locationFocus` | Supported defensively. |
| `bio` | Optional/alias | `bio` | Supported defensively. |
| `match_score` | Optional/alias | `matchScore` | If absent, frontend computes match score. |

## `influencer.campaign`

Current Odoo model: `apps/odoo_addons/ethio_influencer_pro/models/campaign.py`

| Odoo field | Current model | Frontend normalized field | Notes |
| --- | --- | --- | --- |
| `id` | Built in | `id` | Odoo record id. |
| `name` | Yes | `name` | Required campaign title. |
| `partner_id` | Yes | `partnerId` | Required. Business owner ownership check uses this field. |
| `partner_id[1]` | Yes | `partnerName` | Not currently normalized as `partnerName`; relation name may be available from Odoo. |
| `influencer_id` | Yes | `influencerId`, `influencer` | Influencer ownership check uses `influencerId`. |
| `industry_id` | Yes | `industryId`, `industry` | Required. |
| `business_name` | Yes | `businessName` | Campaign brief field. |
| `campaign_goal` | Yes | `campaignGoal` | Selection, converted to display label. |
| `platform` | Yes | `platform` | Selection, converted to display label. |
| `budget_range` | Yes | `budgetRange` | Selection, converted to display label. |
| `location_focus` | Yes | `locationFocus` | Selection, converted to display label. |
| `start_date` | Yes | `startDate` | Optional date. |
| `end_date` | Yes | `endDate` | Optional date. Odoo validates it is not before start date. |
| `description` | Yes | `description` | Campaign brief text. |
| `status` | Yes | `status` | Frontend normalizes common values. |
| `roi_multiplier` | Yes | `roiMultiplier` | Estimated campaign ROI. |
| `campaign_notes` | Yes | `campaignNotes` | Current frontend does not read this field. |
| `escrow_balance` | Yes | `escrowBalance` | Current frontend does not normalize it for campaign pages. |
| `escrow_status` | Yes | `escrowStatus` or `status` fallback | Used as status fallback in reads. |
| `promo_code` | Yes | `promoCode` | Current frontend creates it when field exists, but does not display it. |

## Selection Value Mappings

### `campaign_goal`

| Odoo value | Frontend label |
| --- | --- |
| `brand_awareness` | Brand Awareness |
| `product_launch` | Product Launch |
| `lead_generation` | Lead Generation |
| `store_visit` | Store Visit |
| `sales_conversion` | Sales Conversion |
| `strategic_partnership` | Strategic Partnership |

### `platform`

| Odoo value | Frontend label |
| --- | --- |
| `tiktok` | TikTok |
| `instagram` | Instagram |
| `youtube` | YouTube |
| `telegram` | Telegram |
| `multi_platform` | Multi-platform |

### `budget_range`

| Odoo value | Frontend label |
| --- | --- |
| `under_10000` | Under 10,000 ETB |
| `10000_25000` | 10,000 - 25,000 ETB |
| `25000_50000` | 25,000 - 50,000 ETB |
| `50000_100000` | 50,000 - 100,000 ETB |
| `100000_plus` | 100,000+ ETB |

### `location_focus`

| Odoo value | Frontend label |
| --- | --- |
| `bole` | Addis Ababa - Bole |
| `kazanchis` | Kazanchis |
| `piassa` | Piassa |
| `megenagna` | Megenagna |
| `cmc` | CMC |
| `mexico` | Mexico |
| `four_kilo` | 4 Kilo |
| `ethiopia_wide` | Ethiopia-wide |

### Campaign status

| Odoo value | Frontend label/status |
| --- | --- |
| `draft` | Draft |
| `pending` | Pending |
| `active` | Active |
| `completed` | Completed |
| `cancelled` | Cancelled |
| `funded` | Active fallback |
| `released` | Completed fallback |
| `refunded` | Cancelled fallback |
