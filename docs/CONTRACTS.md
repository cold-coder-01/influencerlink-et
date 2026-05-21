# Contracts

Task 15 adds a lightweight Odoo-backed contract module tied to campaigns. It is an MVP agreement tracker, not a legal e-signature, PDF generation, payment, or escrow system.

## Odoo Model

Model: `influencer.contract`

Fields:

| Field | Type | Purpose |
| --- | --- | --- |
| `name` | Char | Contract reference, defaulted from the campaign name. |
| `campaign_id` | Many2one `influencer.campaign` | Required campaign owner; cascades on campaign delete. |
| `business_partner_id` | Many2one `res.partner` | Business owner partner. |
| `influencer_id` | Many2one `influencer.profile` | Assigned influencer. |
| `contract_status` | Selection | `draft`, `sent`, `accepted`, `rejected`, `active`, `completed`, or `cancelled`. |
| `contract_type` | Selection | Campaign agreement, content promotion, brand ambassador, affiliate, or other. |
| `contract_value` | Monetary | Agreement value. |
| `currency_id` | Many2one `res.currency` | Company currency by default. |
| `start_date` / `end_date` | Date | Contract date range. |
| `deliverables` | Text | Campaign work and outputs. |
| `terms` | Text | MVP terms and conditions. |
| `business_signed` / `influencer_signed` | Boolean | Signature flags. |
| `business_signed_at` / `influencer_signed_at` | Datetime | Signature timestamps. |
| `created_at` | Datetime | Creation timestamp. |
| `notes` | Text | Internal notes. |
| `campaign_status` / `campaign_name` | Related | Readonly campaign helpers. |

Ordering is `created_at desc, id desc`.

Validation:

- `end_date` cannot be before `start_date`.
- When both parties have signed, draft/sent contracts move to `accepted`.

## API Routes

| Route | Purpose |
| --- | --- |
| `GET /api/contracts` | Returns contracts visible to the current session. |
| `POST /api/contracts` | Creates a contract for a campaign owned by the business owner or any campaign for admin. |
| `GET /api/contracts/[id]` | Returns one contract after permission checks. |
| `PATCH /api/contracts/[id]` | Updates draft/sent contract fields for the owning business owner or admin. |
| `PATCH /api/contracts/[id]/sign` | Signs as the current business owner or influencer. |

## Permissions

- Business owners can create, view, update, and sign contracts for campaigns they own.
- Influencers can view and sign contracts assigned to their influencer profile.
- Influencers cannot create contracts.
- Admins can view, create, update, and sign all contracts.
- Missing `partnerId` or `influencerProfileId` returns an empty list for list endpoints and blocks signing.

## MVP Lifecycle

1. Business owner creates a draft contract from a pending or active campaign.
2. Either party can sign the contract if they are allowed by ownership.
3. First signature moves a draft contract to `sent`.
4. When both parties have signed, the contract moves to `accepted`.
5. Later legal e-signature, PDF generation, escrow, and payment workflow can build on this record.

TODO: Integrate formal e-signature, generated agreement PDFs, payment milestones, and escrow release after the payment module.
