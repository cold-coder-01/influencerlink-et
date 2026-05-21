from odoo import api, fields, models


class InfluencerProfile(models.Model):
    """Influencer profile with sector-aware ROI scoring for Ethiopia."""

    _name = "influencer.profile"
    _description = "Influencer Profile"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "roi_multiplier desc, avg_views desc, name"

    name = fields.Char(required=True, tracking=True)
    partner_id = fields.Many2one(
        "res.partner",
        string="Contact",
        tracking=True,
        help="Optional linked contact record for the influencer or their agency.",
    )
    industry_ids = fields.Many2many(
        "influencer.industry",
        "influencer_profile_industry_rel",
        "profile_id",
        "industry_id",
        string="Industries",
        tracking=True,
        help="Sectors where this influencer has relevant content history.",
    )
    handle = fields.Char(
        tracking=True,
        help="Primary creator handle shown to businesses.",
    )
    platform = fields.Char(
        tracking=True,
        help="Primary creator platform, such as YouTube, TikTok, Instagram, or Telegram.",
    )
    follower_count = fields.Integer(
        string="Followers",
        tracking=True,
        help="Latest verified follower or subscriber count from a connected platform.",
    )
    total_view_count = fields.Integer(
        string="Total Views",
        tracking=True,
        help="Latest verified lifetime view count from a connected platform.",
    )
    verified_metrics_at = fields.Datetime(
        string="Metrics Verified At",
        readonly=True,
        tracking=True,
        help="When creator metrics were last refreshed from an official platform API.",
    )
    social_account_ids = fields.One2many(
        "influencer.social.account",
        "influencer_id",
        string="Connected Social Accounts",
    )
    avg_views = fields.Integer(
        string="Average Views",
        tracking=True,
        help="Average views per campaign-relevant post, reel, or short video.",
    )
    addis_audience_pct = fields.Float(
        string="Addis Audience %",
        tracking=True,
        help="Percentage of the influencer audience located in Addis Ababa.",
    )
    regional_audience_pct = fields.Float(
        string="Regional Audience %",
        tracking=True,
        help="Percentage of audience outside Addis Ababa but within Ethiopia.",
    )
    performance_metrics = fields.Json(
        default=dict,
        help=(
            "Industry-specific metrics for matching, such as textile aesthetic "
            "score, beverage conversion rate, or real-estate lead quality."
        ),
    )
    roi_multiplier = fields.Float(
        string="ROI Multiplier",
        compute="_compute_roi_multiplier",
        store=True,
        readonly=True,
        digits=(16, 2),
        help=(
            "Estimated value multiplier based on Ethiopian audience density and "
            "the average ROI weight of the influencer's industries."
        ),
    )

    @api.depends(
        "avg_views",
        "addis_audience_pct",
        "regional_audience_pct",
        "industry_ids",
        "industry_ids.industry_weight",
    )
    def _compute_roi_multiplier(self):
        """Estimate ROI from local reach and sector demand weights."""
        baseline_local_views = 10000.0
        for influencer in self:
            addis_ratio = max(influencer.addis_audience_pct or 0.0, 0.0) / 100.0
            regional_ratio = max(influencer.regional_audience_pct or 0.0, 0.0) / 100.0
            weighted_reach_ratio = addis_ratio + (regional_ratio * 0.65)
            local_reach = max(influencer.avg_views or 0, 0) * weighted_reach_ratio

            weights = influencer.industry_ids.mapped("industry_weight")
            industry_weight = sum(weights) / len(weights) if weights else 1.0

            influencer.roi_multiplier = (
                local_reach / baseline_local_views
            ) * industry_weight
