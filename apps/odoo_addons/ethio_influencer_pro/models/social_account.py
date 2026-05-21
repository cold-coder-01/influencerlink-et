from odoo import api, fields, models
from odoo.exceptions import ValidationError


class InfluencerSocialAccount(models.Model):
    """MVP social account verification records for influencer profiles."""

    _name = "influencer.social.account"
    _description = "Influencer Social Account"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "verification_status asc, platform asc, id desc"

    name = fields.Char(string="Account Name", required=True, tracking=True)
    influencer_id = fields.Many2one(
        "influencer.profile",
        string="Influencer",
        required=True,
        ondelete="cascade",
        index=True,
        tracking=True,
    )
    influencer_name = fields.Char(
        string="Influencer Name",
        related="influencer_id.name",
        store=True,
        readonly=True,
    )
    influencer_platform = fields.Char(
        string="Influencer Platform",
        related="influencer_id.platform",
        store=True,
        readonly=True,
    )
    platform = fields.Selection(
        [
            ("tiktok", "TikTok"),
            ("instagram", "Instagram"),
            ("youtube", "YouTube"),
            ("telegram", "Telegram"),
            ("facebook", "Facebook"),
            ("linkedin", "LinkedIn"),
            ("x_twitter", "X / Twitter"),
            ("other", "Other"),
        ],
        string="Platform",
        required=True,
        tracking=True,
    )
    handle = fields.Char(string="Handle / Username", required=True, tracking=True)
    profile_url = fields.Char(string="Profile URL")
    platform_account_id = fields.Char(string="Platform Account ID", index=True)
    verification_status = fields.Selection(
        [
            ("draft", "Draft"),
            ("pending", "Pending Review"),
            ("verified", "Verified"),
            ("rejected", "Rejected"),
            ("needs_review", "Needs Review"),
        ],
        string="Verification Status",
        default="pending",
        required=True,
        tracking=True,
    )
    verification_method = fields.Selection(
        [
            ("manual", "Manual Review"),
            ("oauth", "OAuth"),
            ("api_sync", "API Sync"),
            ("document", "Document Proof"),
        ],
        string="Verification Method",
        default="manual",
        required=True,
        tracking=True,
    )
    followers_count = fields.Integer(string="Followers", tracking=True)
    following_count = fields.Integer(string="Following", tracking=True)
    media_count = fields.Integer(string="Media Count", tracking=True)
    avg_views = fields.Integer(string="Average Views", tracking=True)
    avg_likes = fields.Integer(string="Average Likes", tracking=True)
    avg_comments = fields.Integer(string="Average Comments", tracking=True)
    engagement_rate = fields.Float(string="Engagement Rate", tracking=True)
    audience_location = fields.Char(string="Audience Location")
    audience_addis_percent = fields.Float(string="Addis Audience %", tracking=True)
    last_synced_at = fields.Datetime(string="Last Synced At", tracking=True)
    verified_at = fields.Datetime(string="Verified At", tracking=True)
    rejection_reason = fields.Text(string="Rejection Reason")
    notes = fields.Text(string="Internal Notes")
    access_token = fields.Char(string="Access Token")
    refresh_token = fields.Char(string="Refresh Token")
    token_expiry = fields.Datetime(string="Token Expiry")

    @api.constrains(
        "audience_addis_percent",
        "followers_count",
        "avg_views",
        "avg_likes",
        "avg_comments",
        "engagement_rate",
    )
    def _check_metric_ranges(self):
        for account in self:
            if not 0 <= (account.audience_addis_percent or 0) <= 100:
                raise ValidationError("Addis Audience % must be between 0 and 100.")

            negative_fields = [
                ("followers_count", "Followers"),
                ("avg_views", "Average Views"),
                ("avg_likes", "Average Likes"),
                ("avg_comments", "Average Comments"),
                ("engagement_rate", "Engagement Rate"),
            ]
            for field_name, label in negative_fields:
                if (account[field_name] or 0) < 0:
                    raise ValidationError("%s cannot be negative." % label)
