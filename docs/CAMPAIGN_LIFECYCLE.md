# Campaign Lifecycle

InfluencerLink ET uses a small MVP campaign lifecycle so business owners and
influencers can understand what state a campaign is in and which action comes
next.

## MVP Flow

```text
Draft -> Invitation Sent -> Active -> Completed
```

Cancellation can happen from:

- Draft
- Invitation Sent
- Active

For MVP, an influencer decline maps to `cancelled`. There is no separate
`rejected` status yet.

## Statuses

| Status | UI label | Meaning |
| --- | --- | --- |
| `draft` | Draft | The campaign brief is being prepared and has not yet been sent to the influencer. |
| `pending` | Invitation Sent | The campaign invitation has been sent and is waiting for the influencer's response. |
| `active` | Active | The influencer has accepted the campaign and work is in progress. |
| `completed` | Completed | The campaign work is finished and ready for reporting or payment follow-up. |
| `cancelled` | Cancelled | The campaign was stopped before completion. |

## Status Changes

| Role | Allowed transitions |
| --- | --- |
| Business owner | `draft -> pending`, `draft -> cancelled`, `pending -> active`, `pending -> cancelled`, `active -> completed`, `active -> cancelled` |
| Influencer | `pending -> active`, `pending -> cancelled`, `active -> completed` |
| Admin | Any status can move to any other status. |

Business owners can update only campaigns where
`influencer.campaign.partner_id` matches their session partner. Influencers can
update only campaigns where `influencer.campaign.influencer_id` matches their
session profile. Admins can update any campaign.

## Business Owner Actions

| Current status | Actions |
| --- | --- |
| Draft | Send Invitation, Cancel Campaign |
| Invitation Sent | Mark Active, Cancel Campaign |
| Active | Mark Completed, Cancel Campaign |
| Completed | No lifecycle action |
| Cancelled | No lifecycle action |

## Influencer Actions

| Current status | Actions |
| --- | --- |
| Draft | No lifecycle action |
| Invitation Sent | Accept Campaign, Decline |
| Active | Mark Completed |
| Completed | No lifecycle action |
| Cancelled | No lifecycle action |

## Future Statuses

The following statuses may be useful after Messages, Contracts, Payments, and
content review workflows exist. They are not part of the current MVP and should
not be introduced into Odoo yet:

- `accepted`
- `rejected`
- `content_submitted`
- `revision_requested`
- `approved`
- `paid`
