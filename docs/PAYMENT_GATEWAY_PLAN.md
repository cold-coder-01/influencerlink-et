# Payment Gateway Plan

## 1. Goal

InfluencerLink ET currently has an Odoo-backed payment and escrow tracker. The `influencer.payment` model records contract payment state, method labels, amounts, platform fees, transaction references, deposit timestamps, release timestamps, and notes. It does not move money.

Future payment gateway integration should let business owners deposit real money against an existing Odoo payment record. Influencer payouts should remain tracked in Odoo first, with manual release before any payout automation is added. The first production-safe integration must not bypass Odoo records, permissions, auditability, or the current MVP escrow tracking lifecycle.

## 2. Recommended Integration Order

### Phase 1: Manual Bank / CBE Transfer Verification

- Easiest operationally for first production.
- No external API dependency.
- Business owner enters or uploads a transfer reference against the Odoo payment.
- Admin or approved reviewer verifies the bank/CBE transfer before marking `payment_status = deposited`.
- Keeps the MVP tracking model intact while the team builds reconciliation habits.

### Phase 2: Chapa Checkout Integration

- Use Chapa hosted checkout or payment initiation, not direct card handling.
- Link Chapa `tx_ref` to `influencer.payment.id`.
- Verify payment by callback/webhook plus server-to-server transaction verification.
- Update `influencer.payment.payment_status` to `deposited` only after verification.
- Keep Chapa API keys server-side only.

### Phase 3: Telebirr Merchant/API Integration

- Requires Telebirr merchant onboarding and official API credentials from Ethio telecom or the official Telebirr merchant/developer channel.
- Use only official Telebirr documentation for signing, encryption, certificates, request formats, and callback verification.
- Verify callbacks and transaction status before updating Odoo.

### Phase 4: Payout Automation / Settlement

- Keep payout release manual first.
- Add automated payout only after compliance, operational, security, and refund/dispute review.
- Preserve Odoo as the payment source of truth.

EthSwitch or national payment gateway options can be researched as future infrastructure. They are not immediate MVP dependencies unless InfluencerLink ET receives direct merchant access, official integration documentation, and a support path.

## 3. Why Not Direct Gateway First?

Payments need more than a checkout button. A production payment system needs security, reconciliation, retries, partial failures, refunds, dispute handling, idempotency, and audit trails. Starting with manual verification and then hosted checkout reduces operational risk while the product proves demand.

Money should not be auto-released to influencers from a client redirect or single callback. Release should remain admin-controlled and tied to contract and campaign completion conditions until the business workflow is mature.

## 4. Required Payment Flow

Business owner:

```text
Contract accepted
-> Create payment request
-> Choose method
-> Pay via manual/CBE, Chapa, or Telebirr
-> payment_status becomes requested
-> gateway callback or admin verification
-> payment_status becomes deposited
-> campaign completed
-> payout/release decision
-> payment_status becomes released
```

Influencer earnings view should show:

- `requested`: expected or pending payment.
- `deposited`: money recorded as in escrow.
- `released`: payout recorded as released.

Admin should be able to verify deposits, fail payments, refund payments, release payouts, and reconcile records.

## 5. Chapa Integration Plan

Planned environment variables:

```env
CHAPA_SECRET_KEY=change_me
CHAPA_PUBLIC_KEY=change_me
CHAPA_WEBHOOK_SECRET=change_me
CHAPA_RETURN_URL=https://app.example.com/payments
CHAPA_CALLBACK_URL=https://app.example.com/api/payments/chapa/webhook
```

Future API routes:

| Route | Purpose |
| --- | --- |
| `POST /api/payments/[id]/chapa/initiate` | Create a Chapa hosted checkout request for an authorized payment. |
| `POST /api/payments/chapa/webhook` | Receive Chapa webhook/callback events. |
| `GET /api/payments/chapa/verify?tx_ref=...` | Server-side verification/recovery endpoint for a transaction reference. |

Planned flow:

1. Business owner creates an `influencer.payment` record.
2. Business owner clicks Pay with Chapa.
3. Server creates a checkout/payment request with a unique `tx_ref` linked to `payment.id`.
4. User is redirected to Chapa hosted checkout.
5. Chapa callback or webhook is received by the server.
6. Server verifies the transaction server-to-server using the official Chapa verification endpoint.
7. If paid and valid, update `payment_status = deposited`.
8. Store `transaction_reference`.
9. Create a payment deposited notification for the influencer.
10. Never trust the client return redirect alone.

Required security:

- Verify webhook/callback authenticity using the official webhook verification strategy.
- Verify transaction server-to-server before changing status.
- Verify amount and currency match the Odoo payment.
- Verify `tx_ref` belongs to the expected payment.
- Make webhook handling idempotent so repeated events cannot double-update or double-notify.
- Log failures safely without storing secrets or sensitive payment payloads in plain logs.
- Keep `CHAPA_SECRET_KEY` server-side only.

## 6. Telebirr Integration Plan

Telebirr merchant/API onboarding is required before implementation. Exact request signing, certificate, encryption, merchant identifiers, and callback verification rules must come from official Ethio telecom/Telebirr merchant documentation.

Planned environment variables:

```env
TELEBIRR_APP_ID=change_me
TELEBIRR_APP_KEY=change_me
TELEBIRR_PUBLIC_KEY=change_me
TELEBIRR_MERCHANT_CODE=change_me
TELEBIRR_NOTIFY_URL=https://app.example.com/api/payments/telebirr/callback
TELEBIRR_RETURN_URL=https://app.example.com/payments
```

Future API routes:

| Route | Purpose |
| --- | --- |
| `POST /api/payments/[id]/telebirr/initiate` | Create a signed Telebirr payment order for an authorized payment. |
| `POST /api/payments/telebirr/callback` | Receive Telebirr payment notification/callback. |
| `GET /api/payments/telebirr/status` | Verify or recover status for a Telebirr order. |

Planned flow:

1. User chooses Telebirr.
2. Server creates a signed payment order using official Telebirr credentials.
3. User completes payment in Telebirr.
4. Callback/notification is received by the server.
5. Server verifies signature and transaction status using official rules.
6. Update the Odoo payment status to `deposited`.
7. Notify influencer and business owner as appropriate.

Limitations:

- Requires merchant approval.
- Exact credentials and signing depend on official Telebirr documentation.
- No unofficial code should be copied blindly.
- Implementation should wait until sandbox or merchant test access exists.

## 7. Manual Bank / CBE Transfer Plan

For first production:

- Use `payment_method = manual_bank` or `payment_method = cbe`.
- Business owner enters:
  - `transaction_reference`.
  - Deposit date.
  - Amount paid.
  - Optional screenshot/receipt later.
- Admin or business reviewer confirms the deposit against bank/CBE evidence.
- Set `payment_status = deposited` after verification.
- Notify the influencer that escrow is deposited.

Future improvements:

- Receipt upload.
- Bank statement reconciliation.
- Admin approval queue.
- Clear reviewer identity and verification timestamp.

## 8. Odoo Model Gap Analysis

The current `influencer.payment` model is enough for MVP tracking. Real gateway integration will likely need additional fields, but they should be added in a later implementation task after route design and provider choice are finalized.

Possible future fields:

| Field | Purpose |
| --- | --- |
| `gateway_provider` | Normalized provider name such as `manual`, `chapa`, or `telebirr`. |
| `gateway_checkout_url` | Hosted checkout URL for redirect recovery. |
| `gateway_transaction_id` | Provider transaction id. |
| `gateway_reference` | Provider reference distinct from internal `transaction_reference`. |
| `gateway_status` | Last raw provider status. |
| `gateway_payload_json` | Sanitized provider payload for audit/debugging. |
| `callback_received_at` | Timestamp of latest callback. |
| `verified_at` | Timestamp of server-side verification. |
| `verified_by_partner_id` | Manual verifier or admin partner. |
| `receipt_attachment_id` | Future receipt upload attachment. |
| `failure_reason` | Human-safe failure reason. |
| `refund_reason` | Refund explanation. |
| `payout_reference` | Manual or provider payout reference. |
| `payout_released_by` | Admin/user that released payout. |
| `idempotency_key` | Idempotent initiation/callback handling key. |

Do not add these fields until the gateway implementation task needs them.

## 9. API Route Plan

Future routes:

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/payments/[id]/manual/confirm` | `POST` | Confirm manual/CBE transfer after verification. |
| `/api/payments/[id]/chapa/initiate` | `POST` | Initiate Chapa checkout. |
| `/api/payments/chapa/webhook` | `POST` | Receive Chapa webhook/callback. |
| `/api/payments/chapa/verify` | `GET` | Verify Chapa transaction by `tx_ref`. |
| `/api/payments/[id]/telebirr/initiate` | `POST` | Initiate Telebirr payment order. |
| `/api/payments/telebirr/callback` | `POST` | Receive Telebirr callback. |
| `/api/payments/telebirr/status` | `GET` | Verify Telebirr status. |
| `/api/payments/[id]/release` | `POST` | Admin-controlled payout release. |
| `/api/payments/[id]/refund` | `POST` | Admin-controlled refund workflow. |

Callback routes may need to be publicly reachable for providers, but public reachability must not mean trust. They must verify signatures, references, amount, currency, and provider status before mutating Odoo.

## 10. Permission Plan

Business owner:

- Create payment for own accepted or active contract.
- Initiate payment for own payment.
- Add or update manual transaction reference while payment is still pending.
- Cannot release payout.
- Cannot mark gateway payment deposited without verified provider evidence.

Influencer:

- View assigned payments and earnings.
- Cannot initiate business deposit.
- Cannot mark deposited.
- Cannot release payout.

Admin:

- Verify manual deposits.
- Mark failed/refunded.
- Release payout.
- Audit and reconcile payment records.

## 11. Status Transition Plan

Current MVP transitions:

```text
draft -> requested -> deposited -> released
requested -> cancelled
deposited -> refunded
any admin-controlled failure -> failed
```

Future statuses to consider:

- `pending_gateway`
- `awaiting_verification`
- `disputed`
- `payout_processing`

Do not change statuses now. Add future statuses only when UI, permissions, notifications, and Odoo migration behavior are planned together.

## 12. Security Checklist

- Keep gateway secrets server-side only.
- Require HTTPS in production.
- Verify webhook signatures or official callback authenticity.
- Perform server-to-server transaction verification.
- Validate amount and currency before updating Odoo.
- Use idempotency for initiation and callbacks.
- Maintain audit logs for state changes.
- Never trust client-side payment success redirects.
- Rate limit callback and verification endpoints where possible.
- Do not expose tokens, keys, or provider secrets in logs or client responses.
- Do not release payment without contract and campaign completion conditions.
- Preserve existing payment permissions.
- Store only sanitized provider payloads if audit payload storage is added.

## 13. Reconciliation Plan

- Compare Odoo payments against provider dashboards daily.
- Recover failed callbacks through provider verification endpoints.
- Use manual admin review for mismatched amount, currency, reference, or status.
- Export CSV from Odoo/provider dashboards for finance review.
- Add bank statement import or assisted reconciliation later.

## 14. Notifications Plan

When payment is requested:

- Notify business owner/admin if operational follow-up is needed.

When payment is deposited:

- Notify influencer.

When payment failed or refunded:

- Notify business owner and influencer.

When payment is released:

- Notify influencer.

## 15. Production Readiness Checklist For Payments

Before real integration:

- [ ] Production HTTPS is live.
- [ ] Real merchant account is approved.
- [ ] Sandbox credentials are tested.
- [ ] Test transactions pass end to end.
- [ ] Webhook/callback endpoint is reachable from provider.
- [ ] Webhook verification is implemented.
- [ ] Server-to-server verification is implemented.
- [ ] Odoo backup and restore process is tested.
- [ ] Payment audit logs exist.
- [ ] Refund policy is written.
- [ ] Terms and contract language cover escrow, fees, refunds, disputes, and payout timing.
- [ ] Admin reconciliation workflow exists.

## 16. Recommended MVP Decision

Start production with manual bank/CBE transfer verification. Add Chapa hosted checkout next because it can keep card/mobile collection outside the app while Odoo remains the source of truth. Add Telebirr after merchant onboarding and official API documentation are available. Keep escrow release manual and admin-controlled at first.
