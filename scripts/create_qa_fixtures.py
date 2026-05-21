"""Create local-only QA fixture data for InfluencerLink ET.

This script is intentionally limited to clearly fake QA records. It reads Odoo
connection settings from environment variables and defaults to the local dev
database used by the app.
"""

from __future__ import annotations

import os
import sys
import xmlrpc.client
from dataclasses import dataclass
from typing import Any


QA_PASSWORD = "qa_test_password_123"
QA_NOTE = "QA fixture record. Safe to edit/delete."

BUSINESS_EMAIL = "qa.business@example.test"
BUSINESS_OWNER_NAME = "QA Business Owner"
BUSINESS_NAME = "QA Test Brand ET"

INFLUENCER_EMAIL = "qa.influencer@example.test"
INFLUENCER_NAME = "QA Influencer Creator"
INFLUENCER_HANDLE = "@qa_creator_et"


@dataclass(frozen=True)
class OdooConfig:
    url: str
    db: str
    username: str
    password: str


class OdooClient:
    def __init__(self, config: OdooConfig) -> None:
        self.config = config
        base_url = config.url.rstrip("/")
        self.common = xmlrpc.client.ServerProxy(f"{base_url}/xmlrpc/2/common")
        self.models = xmlrpc.client.ServerProxy(f"{base_url}/xmlrpc/2/object")
        uid = self.common.authenticate(
            config.db,
            config.username,
            config.password,
            {},
        )
        if not uid:
            raise RuntimeError("Could not authenticate to Odoo with the configured credentials.")
        self.uid = uid

    def execute(self, model: str, method: str, *args: Any, **kwargs: Any) -> Any:
        return self.models.execute_kw(
            self.config.db,
            self.uid,
            self.config.password,
            model,
            method,
            list(args),
            kwargs,
        )

    def fields(self, model: str) -> dict[str, dict[str, Any]]:
        return self.execute(model, "fields_get", attributes=["type", "required"])

    def search(self, model: str, domain: list[Any], limit: int = 0) -> list[int]:
        kwargs: dict[str, Any] = {}
        if limit:
            kwargs["limit"] = limit
        return self.execute(model, "search", domain, **kwargs)

    def create(self, model: str, values: dict[str, Any]) -> int:
        return self.execute(model, "create", values)

    def write(self, model: str, ids: list[int], values: dict[str, Any]) -> bool:
        if not ids:
            return True
        return self.execute(model, "write", ids, values)


def config_from_env() -> OdooConfig:
    return OdooConfig(
        url=os.environ.get("ODOO_URL", "http://127.0.0.1:8069"),
        db=os.environ.get("ODOO_DB", "influencer_link_db"),
        username=os.environ.get("ODOO_USERNAME", "admin"),
        password=os.environ.get("ODOO_PASSWORD", "admin"),
    )


def filter_fields(
    available_fields: dict[str, dict[str, Any]],
    values: dict[str, Any],
) -> dict[str, Any]:
    return {key: value for key, value in values.items() if key in available_fields}


def upsert(
    odoo: OdooClient,
    model: str,
    domain: list[Any],
    values: dict[str, Any],
) -> int:
    ids = odoo.search(model, domain, limit=1)
    if ids:
        odoo.write(model, ids, values)
        return ids[0]
    return odoo.create(model, values)


def get_external_id(odoo: OdooClient, module: str, name: str) -> int | None:
    records = odoo.execute(
        "ir.model.data",
        "search_read",
        [["module", "=", module], ["name", "=", name]],
        fields=["res_id"],
        limit=1,
    )
    return records[0]["res_id"] if records else None


def ensure_partner(
    odoo: OdooClient,
    *,
    email: str,
    name: str,
    is_company: bool,
    function: str | None = None,
    industry_id: int | None = None,
) -> int:
    fields = odoo.fields("res.partner")
    values = filter_fields(
        fields,
        {
            "name": name,
            "email": email,
            "comment": QA_NOTE,
            "company_type": "company" if is_company else "person",
            "is_company": is_company,
            "function": function or False,
            "x_influencer_industry_id": industry_id or False,
        },
    )
    return upsert(odoo, "res.partner", [["email", "=", email]], values)


def ensure_portal_user(
    odoo: OdooClient,
    *,
    email: str,
    name: str,
    partner_id: int,
) -> int:
    portal_group_id = get_external_id(odoo, "base", "group_portal")
    values: dict[str, Any] = {
        "name": name,
        "login": email,
        "email": email,
        "password": QA_PASSWORD,
        "partner_id": partner_id,
    }
    if portal_group_id:
        values["groups_id"] = [(6, 0, [portal_group_id])]

    user_ids = odoo.search("res.users", [["login", "=", email]], limit=1)
    if user_ids:
        odoo.write("res.users", user_ids, values)
        return user_ids[0]
    return odoo.create("res.users", values)


def main() -> int:
    config = config_from_env()
    print(f"Connecting to Odoo at {config.url} database {config.db} as {config.username}")
    odoo = OdooClient(config)

    industry_id = upsert(
        odoo,
        "influencer.industry",
        [["name", "=", "QA Beverage"]],
        {
            "name": "QA Beverage",
            "industry_weight": 80,
            "icon": "coffee",
            "active": True,
        },
    )

    business_partner_id = ensure_partner(
        odoo,
        email=BUSINESS_EMAIL,
        name=BUSINESS_NAME,
        is_company=True,
        function=BUSINESS_OWNER_NAME,
        industry_id=industry_id,
    )
    business_user_id = ensure_portal_user(
        odoo,
        email=BUSINESS_EMAIL,
        name=BUSINESS_OWNER_NAME,
        partner_id=business_partner_id,
    )

    influencer_partner_id = ensure_partner(
        odoo,
        email=INFLUENCER_EMAIL,
        name=INFLUENCER_NAME,
        is_company=False,
        industry_id=industry_id,
    )
    influencer_user_id = ensure_portal_user(
        odoo,
        email=INFLUENCER_EMAIL,
        name=INFLUENCER_NAME,
        partner_id=influencer_partner_id,
    )

    profile_fields = odoo.fields("influencer.profile")
    profile_values = filter_fields(
        profile_fields,
        {
            "name": INFLUENCER_NAME,
            "partner_id": influencer_partner_id,
            "user_id": influencer_user_id,
            "handle": INFLUENCER_HANDLE,
            "platform": "youtube",
            "follower_count": 25000,
            "followers": 25000,
            "avg_views": 7000,
            "avg_food_views": 7000,
            "addis_audience_pct": 65,
            "addis_audience_percent": 65,
            "regional_audience_pct": 20,
            "location_focus": "bole",
            "industry_id": industry_id,
            "industry_ids": [(6, 0, [industry_id])],
            "performance_metrics": {
                "qa_fixture": True,
                "note": QA_NOTE,
                "addis_audience_percent": 65,
            },
        },
    )
    influencer_profile_id = upsert(
        odoo,
        "influencer.profile",
        [["partner_id", "=", influencer_partner_id]],
        profile_values,
    )

    campaign_values = {
        "name": "QA Campaign Test",
        "partner_id": business_partner_id,
        "influencer_id": influencer_profile_id,
        "industry_id": industry_id,
        "promo_code": "QA-CAMPAIGN-TEST",
        "status": "pending",
        "business_name": BUSINESS_NAME,
        "campaign_goal": "brand_awareness",
        "platform": "youtube",
        "budget_range": "10000_25000",
        "location_focus": "bole",
        "description": "Safe QA campaign for testing only.",
        "campaign_notes": QA_NOTE,
    }
    campaign_id = upsert(
        odoo,
        "influencer.campaign",
        [["promo_code", "=", "QA-CAMPAIGN-TEST"]],
        campaign_values,
    )

    message_id = upsert(
        odoo,
        "influencer.message",
        [["name", "=", "QA Invitation Message"], ["campaign_id", "=", campaign_id]],
        {
            "name": "QA Invitation Message",
            "campaign_id": campaign_id,
            "sender_partner_id": business_partner_id,
            "receiver_partner_id": influencer_partner_id,
            "influencer_id": influencer_profile_id,
            "message_type": "invitation",
            "direction": "business_to_influencer",
            "body": f"{QA_NOTE} Invitation from QA business to QA influencer.",
            "is_read": False,
        },
    )

    contract_id = upsert(
        odoo,
        "influencer.contract",
        [["name", "=", "QA Contract Test"]],
        {
            "name": "QA Contract Test",
            "campaign_id": campaign_id,
            "business_partner_id": business_partner_id,
            "influencer_id": influencer_profile_id,
            "contract_status": "sent",
            "contract_type": "campaign_agreement",
            "contract_value": 10000,
            "deliverables": f"{QA_NOTE} One QA-only YouTube/Telegram deliverable.",
            "terms": f"{QA_NOTE} QA-only terms for local testing.",
            "notes": QA_NOTE,
        },
    )

    payment_id = upsert(
        odoo,
        "influencer.payment",
        [["name", "=", "QA Payment Test"]],
        {
            "name": "QA Payment Test",
            "campaign_id": campaign_id,
            "contract_id": contract_id,
            "business_partner_id": business_partner_id,
            "influencer_id": influencer_profile_id,
            "payment_status": "requested",
            "payment_type": "escrow",
            "amount": 10000,
            "platform_fee": 1000,
            "payment_method": "manual_bank",
            "notes": QA_NOTE,
        },
    )

    social_account_id = upsert(
        odoo,
        "influencer.social.account",
        [["name", "=", "QA YouTube Account"], ["influencer_id", "=", influencer_profile_id]],
        {
            "name": "QA YouTube Account",
            "influencer_id": influencer_profile_id,
            "platform": "youtube",
            "handle": INFLUENCER_HANDLE,
            "profile_url": "https://www.youtube.com/@qa_creator_et",
            "verification_status": "pending",
            "verification_method": "manual",
            "followers_count": 25000,
            "avg_views": 7000,
            "audience_location": "Addis Ababa",
            "audience_addis_percent": 65,
            "notes": QA_NOTE,
        },
    )

    business_notification_id = upsert(
        odoo,
        "influencer.notification",
        [["name", "=", "QA Business Notification"], ["recipient_partner_id", "=", business_partner_id]],
        {
            "name": "QA Business Notification",
            "body": f"{QA_NOTE} Business owner notification fixture.",
            "notification_type": "campaign_status",
            "recipient_partner_id": business_partner_id,
            "recipient_role": "business_owner",
            "campaign_id": campaign_id,
            "action_url": f"/campaigns/{campaign_id}",
            "priority": "normal",
        },
    )

    influencer_notification_id = upsert(
        odoo,
        "influencer.notification",
        [
            ["name", "=", "QA Influencer Notification"],
            ["recipient_influencer_id", "=", influencer_profile_id],
        ],
        {
            "name": "QA Influencer Notification",
            "body": f"{QA_NOTE} Influencer notification fixture.",
            "notification_type": "campaign_invitation",
            "recipient_influencer_id": influencer_profile_id,
            "recipient_role": "influencer",
            "campaign_id": campaign_id,
            "message_id": message_id,
            "contract_id": contract_id,
            "payment_id": payment_id,
            "social_account_id": social_account_id,
            "action_url": f"/influencer/campaigns/{campaign_id}",
            "priority": "normal",
        },
    )

    print("QA fixtures are ready:")
    print(f"- Business owner login: {BUSINESS_EMAIL} / {QA_PASSWORD}")
    print(f"- Influencer login: {INFLUENCER_EMAIL} / {QA_PASSWORD}")
    print(f"- Industry ID: {industry_id}")
    print(f"- Business partner/user IDs: {business_partner_id} / {business_user_id}")
    print(f"- Influencer partner/user/profile IDs: {influencer_partner_id} / {influencer_user_id} / {influencer_profile_id}")
    print(f"- Campaign/message/contract/payment IDs: {campaign_id} / {message_id} / {contract_id} / {payment_id}")
    print(f"- Social account ID: {social_account_id}")
    print(f"- Notification IDs: {business_notification_id}, {influencer_notification_id}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Could not create QA fixtures: {exc}", file=sys.stderr)
        raise SystemExit(1)
