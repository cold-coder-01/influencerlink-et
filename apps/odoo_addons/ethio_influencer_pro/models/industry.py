from odoo import fields, models


class InfluencerIndustry(models.Model):
    """Sector taxonomy used for dynamic discovery and ROI weighting."""

    _name = "influencer.industry"
    _description = "Influencer Industry"
    _order = "name"

    name = fields.Char(required=True, translate=True)
    icon = fields.Char(
        help="Icon key consumed by the frontend, for example briefcase or home.",
    )
    industry_weight = fields.Float(
        default=1.0,
        required=True,
        help=(
            "ROI weighting for this sector in the Ethiopian market. Higher values "
            "represent sectors where influencer reach is expected to convert more "
            "strongly."
        ),
    )
    active = fields.Boolean(default=True)
