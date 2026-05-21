from odoo import fields, models


class ResPartner(models.Model):
    _inherit = "res.partner"

    x_influencer_industry_id = fields.Many2one(
        "influencer.industry",
        string="InfluencerLink Industry",
        help="Industry selected by the business owner during InfluencerLink signup.",
    )
