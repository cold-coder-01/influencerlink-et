from odoo import api, fields, models
from odoo.exceptions import ValidationError


class InfluencerPayment(models.Model):
    """MVP payment and escrow tracker for influencer contracts."""

    _name = "influencer.payment"
    _description = "Influencer Payment"
    _order = "created_at desc, id desc"

    name = fields.Char(
        string="Payment Reference",
        required=True,
        default="Payment",
    )
    campaign_id = fields.Many2one(
        "influencer.campaign",
        string="Campaign",
        ondelete="set null",
    )
    contract_id = fields.Many2one(
        "influencer.contract",
        string="Contract",
        ondelete="set null",
    )
    business_partner_id = fields.Many2one(
        "res.partner",
        string="Business Owner",
    )
    influencer_id = fields.Many2one(
        "influencer.profile",
        string="Influencer",
    )
    payment_status = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("requested", "Payment Requested"),
            ("deposited", "Deposited to Escrow"),
            ("released", "Released to Influencer"),
            ("failed", "Failed"),
            ("refunded", "Refunded"),
            ("cancelled", "Cancelled"),
        ],
        string="Payment Status",
        default="draft",
        required=True,
    )
    payment_type = fields.Selection(
        selection=[
            ("escrow", "Escrow"),
            ("direct", "Direct Payment"),
            ("milestone", "Milestone Payment"),
            ("bonus", "Bonus"),
        ],
        string="Payment Type",
        default="escrow",
        required=True,
    )
    amount = fields.Monetary(string="Amount", currency_field="currency_id")
    currency_id = fields.Many2one(
        "res.currency",
        default=lambda self: self.env.company.currency_id,
    )
    platform_fee = fields.Monetary(
        string="Platform Fee",
        currency_field="currency_id",
    )
    net_amount = fields.Monetary(
        string="Net Amount",
        currency_field="currency_id",
        compute="_compute_net_amount",
        store=True,
    )
    payment_method = fields.Selection(
        selection=[
            ("manual_bank", "Manual Bank Transfer"),
            ("telebirr", "Telebirr"),
            ("cbe", "CBE"),
            ("chapa", "Chapa"),
            ("cash", "Cash"),
            ("other", "Other"),
        ],
        string="Payment Method",
        default="manual_bank",
        required=True,
    )
    transaction_reference = fields.Char(string="Transaction Reference")
    deposited_at = fields.Datetime(string="Deposited At")
    released_at = fields.Datetime(string="Released At")
    due_date = fields.Date(string="Due Date")
    notes = fields.Text(string="Notes")
    created_at = fields.Datetime(
        string="Created At",
        default=fields.Datetime.now,
        readonly=True,
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
    contract_status = fields.Selection(
        related="contract_id.contract_status",
        string="Contract Status",
        readonly=True,
    )
    campaign_status = fields.Selection(
        related="campaign_id.status",
        string="Campaign Status",
        readonly=True,
    )

    @api.depends("amount", "platform_fee")
    def _compute_net_amount(self):
        for payment in self:
            payment.net_amount = (payment.amount or 0.0) - (
                payment.platform_fee or 0.0
            )

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            contract = self.env["influencer.contract"].browse(vals.get("contract_id"))
            if contract.exists():
                vals.setdefault("campaign_id", contract.campaign_id.id)
                vals.setdefault("business_partner_id", contract.business_partner_id.id)
                vals.setdefault("influencer_id", contract.influencer_id.id)
                if not vals.get("name") or vals.get("name") == "Payment":
                    vals["name"] = "PAY / %s" % contract.name
            elif vals.get("campaign_id"):
                campaign = self.env["influencer.campaign"].browse(vals["campaign_id"])
                if campaign.exists():
                    vals.setdefault("business_partner_id", campaign.partner_id.id)
                    vals.setdefault("influencer_id", campaign.influencer_id.id)
                    if not vals.get("name") or vals.get("name") == "Payment":
                        vals["name"] = "PAY / %s" % campaign.name

        return super().create(vals_list)

    @api.constrains("amount", "platform_fee")
    def _check_amounts(self):
        for payment in self:
            if payment.amount < 0:
                raise ValidationError("Amount cannot be negative.")
            if payment.platform_fee < 0:
                raise ValidationError("Platform Fee cannot be negative.")
            if payment.platform_fee > payment.amount:
                raise ValidationError("Platform Fee cannot exceed Amount.")

    def action_mark_requested(self):
        self.write({"payment_status": "requested"})

    def action_mark_deposited(self):
        self.write(
            {
                "payment_status": "deposited",
                "deposited_at": fields.Datetime.now(),
            }
        )

    def action_mark_released(self):
        self.write(
            {
                "payment_status": "released",
                "released_at": fields.Datetime.now(),
            }
        )

    def action_cancel(self):
        self.write({"payment_status": "cancelled"})
