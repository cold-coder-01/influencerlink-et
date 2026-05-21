# InfluencerLink ET - Product Blueprint

## 1. Executive Vision
A premium B2B marketplace for the Ethiopian economy. InfluencerLink ET connects
commercial partners across industries with digital influencers through
data-driven matching and escrow-protected payments.

- **Visual Style:** Habesha Noir: charcoal, gold, and glassmorphism.
- **Market Focus:** Ethiopia, with Chapa, Telebirr, and local business logic.

## 2. Dynamic Backend Architecture: Odoo 18
The backend uses a Taxonomy Engine so the platform is not locked to one sector.

### Core Models

#### `influencer.industry`
The master list of sectors, such as Beverage, Textile, Real Estate, Craft, and
Agri-Tech.

- `name`
- `icon`
- `industry_weight`: Used in ROI calculations.

#### `influencer.profile`
The influencer record used by the discovery and matching engine.

- `industry_ids`: Many2many. An influencer can work in multiple sectors.
- `performance_metrics`: JSON field for industry-specific data, such as
  aesthetic score for textiles or conversion rate for beverages.
- `roi_multiplier`: Computed from geographic reach and linked industry weights.

#### `influencer.campaign`
The commercial partner campaign record.

- `partner_id`: The business owner.
- `industry_id`: The sector for this campaign.
- `escrow_balance`: Monetary balance for Chapa-integrated funding.
- `escrow_status`: Pending, Funded, Released, or Refunded.
- `promo_code`: Unique tracking string.

## 3. Intelligent Match System
The system calculates compatibility rather than only listing profiles.

- **Geographic Density:** Prioritizes Addis Ababa versus regional reach.
- **Industry Alignment:** Checks whether the influencer's content history
  matches the partner's industry.
- **Value-per-Birr:** Predicts how much revenue 1 ETB of spend can return for a
  specific industry.

## 4. Frontend Architecture: Next.js 15

- **Adaptive Discovery Engine:** Sidebar filters are generated from
  `influencer.industry` records.
- **Glassmorphism UI:** Premium cards using Tailwind `backdrop-blur`.
- **Partner Dashboard:** Mission Control for business owners to track campaign
  ROI.

## 5. Integration Suite

- **Financials:** Chapa API for secure escrow. The platform takes a 15% service
  fee automatically when a campaign completes.
- **Communications:** Telegram API for real-time alerts. For example, when a
  showroom owner requests a textile influencer, both parties receive a Telegram
  bot notification.
