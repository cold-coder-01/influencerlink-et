# Payments / Escrow

Task 16 adds MVP payment and escrow tracking backed by Odoo. It does not integrate a real payment gateway or automated payout rail.

For the production gateway roadmap, see [Payment Gateway Plan](PAYMENT_GATEWAY_PLAN.md). The recommended order is manual bank/CBE verification first, Chapa hosted checkout second, Telebirr merchant/API integration after official onboarding, and payout automation only after security and compliance review.

## Odoo Model

Model: `influencer.payment`

Core fields:

| Field | Purpose |
| --- | --- |
| `name` | Payment reference, defaulting to `PAY / <contract>`. |
| `campaign_id` | Optional related campaign. |
| `contract_id` | Optional related contract. |
| `business_partner_id` | Business owner partner. |
| `influencer_id` | Assigned influencer profile. |
| `payment_status` | `draft`, `requested`, `deposited`, `released`, `failed`, `refunded`, `cancelled`. |
| `payment_type` | `escrow`, `direct`, `milestone`, `bonus`. |
| `amount` | Gross payment amount. |
| `currency_id` | Company currency by default. |
| `platform_fee` | Marketplace fee. |
| `net_amount` | Stored computed value: `amount - platform_fee`. |
| `payment_method` | Manual method label: bank, Telebirr, CBE, Chapa, cash, or other. |
| `transaction_reference` | Manual reference entered when deposited. |
| `deposited_at` / `released_at` | Manual lifecycle timestamps. |
| `due_date` | Optional expected payment date. |
| `notes` | Internal payment notes. |

The model validates that `amount` and `platform_fee` are not negative, and that `platform_fee` does not exceed `amount`.

## Lifecycle

MVP status flow:

1. Business owner creates an escrow payment from an accepted or active contract.
2. The record starts as `requested`.
3. Business owner can mark their own requested payment as `deposited`.
4. Business owner can cancel their own requested payment.
5. Admin can release a deposited payment to `released`.
6. Admin can mark valid failures/refunds for operational correction.

No funds move automatically. The UI is a tracking layer for manual escrow operations.

## API Routes

| Route | Purpose |
| --- | --- |
| `GET /api/payments` | Returns visible payment records for the current user. |
| `POST /api/payments` | Creates a requested escrow payment from a contract. |
| `GET /api/payments/[id]` | Returns one payment after ownership checks. |
| `PATCH /api/payments/[id]` | Updates editable draft/requested payment fields. |
| `PATCH /api/payments/[id]/status` | Performs allowed status transitions. |

## Permissions

Business owner:

- Can create payments only for their own accepted or active contracts.
- Can view payments where `business_partner_id = session.partnerId` or the related campaign belongs to them.
- Can update own `draft` or `requested` payments.
- Can move own `requested` payments to `deposited` or `cancelled`.
- Cannot release payouts.

Influencer:

- Can view payments where `influencer_id = session.profileId`.
- Cannot create payments.
- Cannot edit payment fields or statuses.

Admin:

- Can view, create, and update all payments.
- Can release, refund, fail, or otherwise perform valid operational transitions.

Missing `partnerId` or `profileId` returns an empty list and never broadens access.

## UI

- Business owner payment list: `/payments`
- Business owner payment detail: `/payments/[id]`
- Business owner creation form: `/payments/new?contractId=<id>`
- Contract detail action: shows `Create Escrow Payment` when the contract is accepted/active and has no payment; otherwise shows `View Payment`.
- Influencer earnings: `/influencer/earnings`

## Limitations

Current MVP limitations:

- No Telebirr integration.
- No CBE integration.
- No Chapa integration.
- No bank reconciliation.
- No automated payout.
- No invoice PDF generation.
- Duplicate payment prevention is UI-level only where a contract detail finds an existing payment; the Odoo model does not enforce one payment per contract.

Future integration TODO:

- Telebirr collection and confirmation callbacks.
- CBE or bank transfer reconciliation.
- Chapa checkout and webhook handling.
- Escrow ledger/audit model.
- Automated payout workflow after campaign completion.
- Invoice and receipt PDF generation.
