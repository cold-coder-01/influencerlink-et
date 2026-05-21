from odoo import api, fields, models
from odoo.exceptions import ValidationError


class InfluencerCampaign(models.Model):
    """Partner campaign with escrow-ready financial tracking."""

    _name = "influencer.campaign"
    _description = "Influencer Campaign"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "create_date desc, name"

    name = fields.Char(required=True, tracking=True)
    partner_id = fields.Many2one(
        "res.partner",
        string="Commercial Partner",
        required=True,
        tracking=True,
        help="Business owner or company funding the campaign.",
    )
    influencer_id = fields.Many2one(
        "influencer.profile",
        tracking=True,
        help="Influencer selected for this campaign.",
    )
    industry_id = fields.Many2one(
        "influencer.industry",
        required=True,
        tracking=True,
        help="Sector this campaign belongs to.",
    )
    currency_id = fields.Many2one(
        "res.currency",
        default=lambda self: self.env.company.currency_id,
        required=True,
    )
    escrow_balance = fields.Monetary(
        currency_field="currency_id",
        tracking=True,
        help="Amount funded through escrow before Chapa settlement.",
    )
    escrow_status = fields.Selection(
        selection=[
            ("pending", "Pending"),
            ("funded", "Funded"),
            ("released", "Released"),
            ("refunded", "Refunded"),
        ],
        default="pending",
        required=True,
        tracking=True,
    )
    promo_code = fields.Char(
        required=True,
        copy=False,
        tracking=True,
        help="Unique code for attribution and campaign tracking.",
    )
    business_name = fields.Char(string="Business Name", tracking=True)
    campaign_goal = fields.Selection(
        selection=[
            ("brand_awareness", "Brand Awareness"),
            ("product_launch", "Product Launch"),
            ("lead_generation", "Lead Generation"),
            ("store_visit", "Store Visit"),
            ("sales_conversion", "Sales Conversion"),
            ("strategic_partnership", "Strategic Partnership"),
        ],
        string="Campaign Goal",
        tracking=True,
    )
    platform = fields.Selection(
        selection=[
            ("tiktok", "TikTok"),
            ("instagram", "Instagram"),
            ("youtube", "YouTube"),
            ("telegram", "Telegram"),
            ("multi_platform", "Multi-platform"),
        ],
        string="Desired Platform",
        tracking=True,
    )
    budget_range = fields.Selection(
        selection=[
            ("under_10000", "Under 10,000 ETB"),
            ("10000_25000", "10,000 - 25,000 ETB"),
            ("25000_50000", "25,000 - 50,000 ETB"),
            ("50000_100000", "50,000 - 100,000 ETB"),
            ("100000_plus", "100,000+ ETB"),
        ],
        string="Budget Range",
        tracking=True,
    )
    location_focus = fields.Selection(
        selection=[
            ("bole", "Addis Ababa - Bole"),
            ("kazanchis", "Kazanchis"),
            ("piassa", "Piassa"),
            ("megenagna", "Megenagna"),
            ("cmc", "CMC"),
            ("mexico", "Mexico"),
            ("four_kilo", "4 Kilo"),
            ("ethiopia_wide", "Ethiopia-wide"),
        ],
        string="Location Focus",
        tracking=True,
    )
    start_date = fields.Date(string="Start Date", tracking=True)
    end_date = fields.Date(string="End Date", tracking=True)
    description = fields.Text(string="Campaign Description")
    status = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("pending", "Pending"),
            ("active", "Active"),
            ("completed", "Completed"),
            ("cancelled", "Cancelled"),
        ],
        string="Status",
        default="draft",
        tracking=True,
    )
    roi_multiplier = fields.Float(string="Estimated ROI Multiplier", tracking=True)
    campaign_notes = fields.Text(string="Internal Notes")

    _sql_constraints = [
        (
            "promo_code_unique",
            "unique(promo_code)",
            "The campaign promo code must be unique.",
        ),
    ]

    @api.constrains("start_date", "end_date")
    def _check_campaign_dates(self):
        for campaign in self:
            if (
                campaign.start_date
                and campaign.end_date
                and campaign.end_date < campaign.start_date
            ):
                raise ValidationError("End Date cannot be before Start Date.")
