"""Static preflight checks for the Ethio Influencer Pro Odoo module."""

from __future__ import annotations

import ast
import csv
import py_compile
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
MODULE_DIR = REPO_ROOT / "apps" / "odoo_addons" / "ethio_influencer_pro"

EXPECTED_MODEL_FILES = [
    "industry.py",
    "res_partner.py",
    "influencer.py",
    "campaign.py",
    "message.py",
    "contract.py",
    "payment.py",
    "notification.py",
    "social_account.py",
]

EXPECTED_VIEW_FILES = [
    "views/industry_views.xml",
    "views/res_partner_views.xml",
    "views/influencer_views.xml",
    "views/campaign_views.xml",
    "views/message_views.xml",
    "views/contract_views.xml",
    "views/payment_views.xml",
    "views/notification_views.xml",
    "views/social_account_views.xml",
    "views/menu_views.xml",
]

EXPECTED_ACCESS_MODELS = [
    "model_influencer_industry",
    "model_influencer_profile",
    "model_influencer_campaign",
    "model_influencer_message",
    "model_influencer_contract",
    "model_influencer_payment",
    "model_influencer_notification",
    "model_influencer_social_account",
]


def fail(message: str, failures: list[str]) -> None:
    failures.append(message)
    print(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[ OK ] {message}")


def read_manifest(failures: list[str]) -> dict:
    manifest_path = MODULE_DIR / "__manifest__.py"
    try:
        return ast.literal_eval(manifest_path.read_text(encoding="utf-8"))
    except Exception as exc:
        fail(f"Manifest is not valid Python literal data: {exc}", failures)
        return {}


def imported_modules(init_path: Path, failures: list[str]) -> set[str]:
    try:
        tree = ast.parse(init_path.read_text(encoding="utf-8"), filename=str(init_path))
    except SyntaxError as exc:
        fail(f"{init_path.relative_to(REPO_ROOT)} has syntax error: {exc}", failures)
        return set()

    imports: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom) and node.level == 1:
            imports.update(alias.name for alias in node.names)
    return imports


def check_structure(failures: list[str]) -> None:
    if MODULE_DIR.exists():
        ok(f"Module folder exists: {MODULE_DIR}")
    else:
        fail(f"Module folder missing: {MODULE_DIR}", failures)
        return

    required_paths = [
        "__init__.py",
        "__manifest__.py",
        "models/__init__.py",
        "security/ir.model.access.csv",
        "views",
    ]
    for rel_path in required_paths:
        path = MODULE_DIR / rel_path
        if path.exists():
            ok(f"Found {rel_path}")
        else:
            fail(f"Missing {rel_path}", failures)

    for filename in EXPECTED_MODEL_FILES:
        path = MODULE_DIR / "models" / filename
        if path.exists():
            ok(f"Found models/{filename}")
        else:
            fail(f"Missing models/{filename}", failures)

    for rel_path in EXPECTED_VIEW_FILES:
        path = MODULE_DIR / rel_path
        if path.exists():
            ok(f"Found {rel_path}")
        else:
            fail(f"Missing {rel_path}", failures)


def check_import_chain(failures: list[str]) -> None:
    root_imports = imported_modules(MODULE_DIR / "__init__.py", failures)
    if "models" in root_imports:
        ok("__init__.py imports models")
    else:
        fail("__init__.py must include: from . import models", failures)

    model_imports = imported_modules(MODULE_DIR / "models" / "__init__.py", failures)
    for filename in EXPECTED_MODEL_FILES:
        module_name = filename.removesuffix(".py")
        if module_name in model_imports:
            ok(f"models/__init__.py imports {module_name}")
        else:
            fail(f"models/__init__.py missing import for {module_name}", failures)


def check_manifest(failures: list[str]) -> None:
    manifest = read_manifest(failures)
    data_files = manifest.get("data", [])
    depends = manifest.get("depends", [])

    for dependency in ["base", "mail"]:
        if dependency in depends:
            ok(f"Manifest depends includes {dependency}")
        else:
            fail(f"Manifest depends missing {dependency}", failures)

    if data_files and data_files[0] == "security/ir.model.access.csv":
        ok("Manifest loads security/ir.model.access.csv first")
    else:
        fail("Manifest should load security/ir.model.access.csv first", failures)

    for rel_path in EXPECTED_VIEW_FILES:
        if rel_path in data_files:
            ok(f"Manifest includes {rel_path}")
        else:
            fail(f"Manifest missing {rel_path}", failures)

    bad_separators = [path for path in data_files if "\\" in path]
    if bad_separators:
        fail(f"Manifest paths must use forward slashes: {bad_separators}", failures)
    else:
        ok("Manifest data paths use forward slashes")


def check_access_csv(failures: list[str]) -> None:
    access_path = MODULE_DIR / "security" / "ir.model.access.csv"
    try:
        with access_path.open(newline="", encoding="utf-8") as handle:
            rows = list(csv.DictReader(handle))
    except Exception as exc:
        fail(f"Could not read access CSV: {exc}", failures)
        return

    expected_header = [
        "id",
        "name",
        "model_id:id",
        "group_id:id",
        "perm_read",
        "perm_write",
        "perm_create",
        "perm_unlink",
    ]
    if rows and list(rows[0].keys()) == expected_header:
        ok("Access CSV header is valid")
    else:
        fail("Access CSV header is invalid", failures)

    present_models = {row.get("model_id:id") for row in rows}
    for model_id in EXPECTED_ACCESS_MODELS:
        if model_id in present_models:
            ok(f"Access CSV includes {model_id}")
        else:
            fail(f"Access CSV missing {model_id}", failures)


def check_xml_and_python(failures: list[str]) -> None:
    xml_ids: dict[str, Path] = {}
    for xml_path in sorted((MODULE_DIR / "views").glob("*.xml")):
        rel_path = xml_path.relative_to(MODULE_DIR)
        try:
            root = ET.parse(xml_path).getroot()
        except ET.ParseError as exc:
            fail(f"{rel_path} is invalid XML: {exc}", failures)
            continue

        if root.tag == "odoo":
            ok(f"{rel_path} has <odoo> root")
        else:
            fail(f"{rel_path} root must be <odoo>", failures)

        for element in root.iter():
            xml_id = element.attrib.get("id")
            if not xml_id:
                continue
            if xml_id in xml_ids:
                fail(
                    f"Duplicate XML id {xml_id} in {rel_path} and "
                    f"{xml_ids[xml_id].relative_to(MODULE_DIR)}",
                    failures,
                )
            else:
                xml_ids[xml_id] = xml_path

    for py_path in sorted((MODULE_DIR / "models").glob("*.py")):
        try:
            py_compile.compile(str(py_path), doraise=True)
            ok(f"{py_path.relative_to(MODULE_DIR)} compiles")
        except py_compile.PyCompileError as exc:
            fail(f"{py_path.relative_to(MODULE_DIR)} does not compile: {exc}", failures)


def main() -> int:
    failures: list[str] = []
    check_structure(failures)
    check_import_chain(failures)
    check_manifest(failures)
    check_access_csv(failures)
    check_xml_and_python(failures)

    if failures:
        print(f"\nPreflight failed with {len(failures)} issue(s).")
        return 1

    print("\nPreflight passed. The module is statically ready for Odoo upgrade.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
