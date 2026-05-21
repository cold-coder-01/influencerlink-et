from odoo import api, fields, models
from odoo.exceptions import ValidationError


class InfluencerContract(models.Model):
    """MVP campaign agreement between a business and influencer."""

    _name = "influencer.contract"
    _description = "Influencer Campaign Contract"
    _order = "created_at desc, id desc"

    name = fields.Char(
        string="Contract Reference",
        required=True,
        default="Contract",
    )
    campaign_id = fields.Many2one(
        "influencer.campaign",
        string="Campaign",
        required=True,
        ondelete="cascade",
    )
    business_partner_id = fields.Many2one(
        "res.partner",
        string="Business Owner",
    )
    influencer_id = fields.Many2one(
        "influencer.profile",
        string="Influencer",
    )
    contract_status = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("sent", "Sent"),
            ("accepted", "Accepted"),
            ("rejected", "Rejected"),
            ("active", "Active"),
            ("completed", "Completed"),
            ("cancelled", "Cancelled"),
        ],
        string="Contract Status",
        default="draft",
        required=True,
    )
    contract_type = fields.Selection(
        selection=[
            ("campaign_agreement", "Campaign Agreement"),
            ("content_promotion", "Content Promotion"),
            ("brand_ambassador", "Brand Ambassador"),
            ("affiliate", "Affiliate"),
            ("other", "Other"),
        ],
        string="Contract Type",
        default="campaign_agreement",
        required=True,
    )
    contract_value = fields.Monetary(string="Contract Value")
    currency_id = fields.Many2one(
        "res.currency",
        default=lambda self: self.env.company.currency_id,
    )
    start_date = fields.Date(string="Start Date")
    end_date = fields.Date(string="End Date")
    deliverables = fields.Text(string="Deliverables")
    terms = fields.Text(string="Terms & Conditions")
    business_signed = fields.Boolean(string="Business Signed", default=False)
    influencer_signed = fields.Boolean(string="Influencer Signed", default=False)
    business_signed_at = fields.Datetime(string="Business Signed At")
    influencer_signed_at = fields.Datetime(string="Influencer Signed At")
    created_at = fields.Datetime(
        string="Created At",
        default=fields.Datetime.now,
        readonly=True,
    )
    notes = fields.Text(string="Internal Notes")
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

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            campaign = self.env["influencer.campaign"].browse(vals.get("campaign_id"))
            if campaign.exists():
                vals.setdefault("business_partner_id", campaign.partner_id.id)
                vals.setdefault("influencer_id", campaign.influencer_id.id)
                if not vals.get("name") or vals.get("name") == "Contract":
                    vals["name"] = "CONTRACT / %s" % campaign.name
            if vals.get("business_signed") and vals.get("influencer_signed"):
                vals.setdefault("contract_status", "accepted")

        return super().create(vals_list)

    def write(self, vals):
        result = super().write(vals)
        for contract in self:
            if (
                contract.business_signed
                and contract.influencer_signed
                and contract.contract_status in ("draft", "sent")
            ):
                super(InfluencerContract, contract).write(
                    {"contract_status": "accepted"}
                )
        return result

    @api.constrains("start_date", "end_date")
    def _check_contract_dates(self):
        for contract in self:
            if (
                contract.start_date
                and contract.end_date
                and contract.end_date < contract.start_date
            ):
                raise ValidationError("End Date cannot be before Start Date.")
