# QA Fixtures

Date: May 20, 2026

## Purpose

These fixtures create local-only, clearly fake QA users and records for full mutation testing without changing existing business data. Every record is prefixed with `QA` where the model has a visible name field, and notes use:

```text
QA fixture record. Safe to edit/delete.
```

Do not run this against production. Do not replace real data with mock data in the app. These records still use real Odoo login, permissions, and model flows.

## Test Credentials

Business owner:

```text
Name: QA Business Owner
Business: QA Test Brand ET
Email: qa.business@example.test
Password: qa_test_password_123
```

Influencer:

```text
Name: QA Influencer Creator
Handle: @qa_creator_et
Email: qa.influencer@example.test
Password: qa_test_password_123
Platform: YouTube
Followers: 25000
Avg views: 7000
Addis audience: 65%
```

The `.test` email domain is reserved for testing and should never be a real user identity.

## Records Created

The fixture script creates or updates only these QA records:

- `influencer.industry`: `QA Beverage`, `industry_weight = 80`, `icon = coffee`
- `res.partner`: `QA Test Brand ET`, linked to the business-owner portal user
- `res.users`: `qa.business@example.test`
- `res.partner`: `QA Influencer Creator`, linked to the influencer portal user
- `res.users`: `qa.influencer@example.test`
- `influencer.profile`: `QA Influencer Creator`, linked to the influencer partner
- `influencer.campaign`: `QA Campaign Test`, status `pending`, promo code `QA-CAMPAIGN-TEST`
- `influencer.message`: `QA Invitation Message`, invitation from business to influencer
- `influencer.contract`: `QA Contract Test`, status `sent`, value `10000`
- `influencer.payment`: `QA Payment Test`, status `requested`, method `manual_bank`
- `influencer.social.account`: `QA YouTube Account`, status `pending`, method `manual`
- `influencer.notification`: `QA Business Notification`
- `influencer.notification`: `QA Influencer Notification`

## Run Setup

From the repository root:

```powershell
python .\scripts\create_qa_fixtures.py
```

The script reads local Odoo settings from environment variables:

```powershell
$env:ODOO_URL = "http://127.0.0.1:8069"
$env:ODOO_DB = "influencer_link_db"
$env:ODOO_USERNAME = "admin"
$env:ODOO_PASSWORD = "admin"
python .\scripts\create_qa_fixtures.py
```

If the same QA records already exist, the script updates those QA records instead of creating duplicates. It does not delete existing records and does not touch non-QA records.

## Reset Or Remove QA Records

Preferred reset:

1. Run `python .\scripts\create_qa_fixtures.py` again to restore the QA fixture baseline.
2. Use the UI to mutate records during QA.
3. Run the script again before the next pass.

Manual removal, local database only:

1. In Odoo, search each affected model for names beginning with `QA`.
2. Confirm the record uses `.test` emails or the QA note.
3. Delete only the QA records listed in this document.
4. Do not delete production-like records or records without the QA prefix/note.

## Business Owner Checklist

1. Login with `qa.business@example.test`.
2. Confirm `/api/me` returns `role = business_owner`.
3. Open `/dashboard`.
4. Open `/campaigns`.
5. Create a campaign.
6. Send invitation.
7. Reply in messages.
8. Create contract.
9. Sign contract.
10. Create payment.
11. Mark payment deposited.
12. Check notifications.

## Influencer Checklist

1. Login with `qa.influencer@example.test`.
2. Confirm `/api/me` returns `role = influencer`.
3. Open `/influencer/dashboard`.
4. Open `/influencer/campaigns`.
5. Accept campaign.
6. Reply message.
7. Sign contract.
8. View earnings.
9. Add social account.
10. Sync YouTube/Telegram if env is configured.
11. Check notifications.

## Admin Checklist

1. Login as Odoo admin.
2. Confirm `/api/me` returns `role = admin`.
3. Open `/admin/verifications`.
4. Verify/reject QA social account.
5. Confirm notification appears for influencer.

## Sync QA Notes

YouTube and Telegram sync should only be run when local environment variables are configured. Use the QA social account or a newly created QA account, never an existing production-like social account. Sync may update public metrics, verification method, verification status, and notifications.
