# Odoo Setup

## Project Summary

InfluencerLink ET uses a Next.js frontend backed by Odoo 18 through JSON-RPC.

| Item | Value |
| --- | --- |
| Odoo version | Odoo 18 |
| Local database | `influencer_link_db` |
| Custom module | `ethio_influencer_pro` |
| Custom addons path | `C:\Users\mame computer\Documents\influencer-link-et\apps\odoo_addons` |
| Local Odoo URL | `ODOO_URL=http://localhost:8069` |
| Local Odoo database | `ODOO_DB=influencer_link_db` |

## Required Module

The `ethio_influencer_pro` module must be installed in Odoo. Upgrade it after any model, view, security, or data XML changes.

The module manifest loads:

- `security/ir.model.access.csv`
- `data/industry_data.xml`
- `views/industry_views.xml`
- `views/res_partner_views.xml`
- `views/influencer_views.xml`
- `views/social_account_views.xml`
- `views/notification_views.xml`
- `views/campaign_views.xml`
- `views/message_views.xml`
- `views/contract_views.xml`
- `views/payment_views.xml`
- `views/menu_views.xml`

## Required Odoo Models

| Model | Purpose |
| --- | --- |
| `influencer.industry` | Industry taxonomy and ROI weighting. |
| `influencer.profile` | Creator profiles, linked industries, audience metrics, and ROI score. |
| `influencer.social.account` | MVP social account submissions, manual verification status, and future official API sync fields. |
| `influencer.notification` | In-app notifications for marketplace events and review updates. |
| `influencer.campaign` | Campaign briefs, ownership, influencer assignment, and escrow-ready fields. |
| `influencer.message` | Campaign invitations and lightweight business/influencer replies. |
| `influencer.contract` | Campaign agreements, deliverables, contract values, and MVP signature tracking. |
| `influencer.payment` | MVP payment and escrow tracking tied to contracts and campaigns. |
| `res.partner` | Business owner company/contact records and influencer contacts. |
| `res.users` | Login accounts. Signup creates portal users when configured. |

## Required Menu Areas

The current module exposes these Odoo menus:

- `InfluencerLink ET`
- `Marketplace`
- `Influencers`
- `Campaigns`
- `Social Accounts`
- `Notifications`
- `Messages`
- `Contracts`
- `Payments`
- `Configuration`
- `Industries`

## Upgrade Steps

1. Restart Odoo after Python model changes.
2. Open Odoo Apps.
3. Upgrade `ethio_influencer_pro`.
4. Refresh the browser and restart the Next.js dev server if needed.
5. If the frontend reports missing fields, upgrade the Odoo module before debugging frontend code.

XML-only view or menu changes still require a module upgrade. Python field changes usually require both an Odoo restart and a module upgrade.

After adding or changing `influencer.social.account`, `influencer.notification`, `influencer.message`, `influencer.contract`, or `influencer.payment`, restart Odoo and upgrade `ethio_influencer_pro` so the model, access rights, views, and menu are registered.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Field does not exist | Odoo model was changed but the module was not upgraded. | Restart Odoo, upgrade `ethio_influencer_pro`, then refresh the frontend. |
| Menu does not appear | `menu_views.xml` was not loaded or module upgrade did not run. | Upgrade the module and confirm the user has internal access. |
| API returns `502` | Next.js could not connect to Odoo or Odoo JSON-RPC returned an error. | Check `ODOO_URL`, `ODOO_DB`, service credentials, Odoo process status, and server logs. |
| Campaign brief fields not saved | Campaign fields are missing in Odoo or the module is stale. | Upgrade `ethio_influencer_pro`; confirm `business_name`, `campaign_goal`, `budget_range`, and related fields exist. |
| Login works but role, partner id, or profile id is missing | Session identity could not resolve `res.users.partner_id` or influencer profile by `partner_id`. | Confirm the Odoo user has a partner, and influencers have an `influencer.profile` linked through `partner_id`. |
| Odoo module not upgraded | Stale registry or database state. | Restart Odoo, update Apps list if needed, then upgrade `ethio_influencer_pro`. |

Do not put real Odoo passwords or production credentials in documentation.
