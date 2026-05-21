from odoo import fields, models


class InfluencerMessage(models.Model):
    """Campaign-scoped message for invitations and lightweight replies."""

    _name = "influencer.message"
    _description = "Influencer Campaign Message"
    _order = "created_at desc, id desc"

    name = fields.Char(string="Subject", required=True)
    campaign_id = fields.Many2one(
        "influencer.campaign",
        string="Campaign",
        required=True,
        ondelete="cascade",
    )
    sender_partner_id = fields.Many2one(
        "res.partner",
        string="Sender",
        required=True,
    )
    receiver_partner_id = fields.Many2one(
        "res.partner",
        string="Receiver",
    )
    influencer_id = fields.Many2one(
        "influencer.profile",
        string="Influencer",
    )
    message_type = fields.Selection(
        selection=[
            ("invitation", "Invitation"),
            ("reply", "Reply"),
            ("update", "Update"),
            ("system", "System"),
        ],
        string="Message Type",
        default="reply",
        required=True,
    )
    body = fields.Text(string="Message Body", required=True)
    is_read = fields.Boolean(string="Read", default=False)
    read_at = fields.Datetime(string="Read At")
    created_at = fields.Datetime(
        string="Created At",
        default=fields.Datetime.now,
        readonly=True,
    )
    direction = fields.Selection(
        selection=[
            ("business_to_influencer", "Business to Influencer"),
            ("influencer_to_business", "Influencer to Business"),
            ("system", "System"),
        ],
        string="Direction",
        required=True,
        default="business_to_influencer",
    )
    campaign_status = fields.Selection(
        related="campaign_id.status",
        string="Campaign Status",
        readonly=True,
    )
    campaign_name = fields.Char(
        related="campaign_id.name",
        string="Campaign Name",
        readonly=True,
    )
