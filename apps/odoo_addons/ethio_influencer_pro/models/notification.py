from odoo import fields, models


class InfluencerNotification(models.Model):
    """In-app notification for marketplace activity."""

    _name = "influencer.notification"
    _description = "Influencer Notification"
    _order = "is_read asc, created_at desc, id desc"

    name = fields.Char(string="Title", required=True)
    body = fields.Text(string="Body")
    notification_type = fields.Selection(
        selection=[
            ("campaign_invitation", "Campaign Invitation"),
            ("message_received", "Message Received"),
            ("campaign_status", "Campaign Status Update"),
            ("contract_created", "Contract Created"),
            ("contract_signed", "Contract Signed"),
            ("payment_created", "Payment Created"),
            ("payment_deposited", "Payment Deposited"),
            ("social_verified", "Social Account Verified"),
            ("social_rejected", "Social Account Rejected"),
            ("social_needs_review", "Social Account Needs Review"),
            ("system", "System"),
        ],
        string="Notification Type",
        default="system",
        required=True,
    )
    recipient_partner_id = fields.Many2one(
        "res.partner",
        string="Recipient Partner",
    )
    recipient_influencer_id = fields.Many2one(
        "influencer.profile",
        string="Recipient Influencer",
    )
    recipient_role = fields.Selection(
        selection=[
            ("business_owner", "Business Owner"),
            ("influencer", "Influencer"),
            ("admin", "Admin"),
            ("system", "System"),
        ],
        string="Recipient Role",
    )
    campaign_id = fields.Many2one(
        "influencer.campaign",
        string="Campaign",
        ondelete="set null",
    )
    message_id = fields.Many2one(
        "influencer.message",
        string="Message",
        ondelete="set null",
    )
    contract_id = fields.Many2one(
        "influencer.contract",
        string="Contract",
        ondelete="set null",
    )
    payment_id = fields.Many2one(
        "influencer.payment",
        string="Payment",
        ondelete="set null",
    )
    social_account_id = fields.Many2one(
        "influencer.social.account",
        string="Social Account",
        ondelete="set null",
    )
    action_url = fields.Char(string="Action URL")
    is_read = fields.Boolean(string="Read", default=False)
    read_at = fields.Datetime(string="Read At")
    created_at = fields.Datetime(
        string="Created At",
        default=fields.Datetime.now,
        readonly=True,
    )
    priority = fields.Selection(
        selection=[
            ("low", "Low"),
            ("normal", "Normal"),
            ("high", "High"),
        ],
        string="Priority",
        default="normal",
    )
    campaign_name = fields.Char(
        related="campaign_id.name",
        string="Campaign Name",
        readonly=True,
    )
    contract_name = fields.Char(
        related="contract_id.name",
        string="Contract Name",
        readonly=True,
    )
    payment_name = fields.Char(
        related="payment_id.name",
        string="Payment Name",
        readonly=True,
    )
