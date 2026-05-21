# Odoo Module Troubleshooting

This project uses Odoo 18 with the custom module `ethio_influencer_pro`.
Do not uninstall the module, delete the database, or wipe business data to fix
module loading problems.

## Root Cause Found On 2026-05-15

The active Windows service is `odoo-server-18.0`. It is managed by NSSM and
starts:

```powershell
C:\Program Files\Odoo 18.0.20260220\python\python.exe "C:\Program Files\Odoo 18.0.20260220\server\odoo-bin" -c "C:\Program Files\Odoo 18.0.20260220\server\odoo.conf"
```

The active config file is:

```text
C:\Program Files\Odoo 18.0.20260220\server\odoo.conf
```

The project addons path must be before any stale duplicate module folder:

```text
C:\Users\mame computer\Documents\influencer-link-et\apps\odoo_addons
```

A duplicate module folder was found at:

```text
C:\custom_addons\ethio_influencer_pro
```

That duplicate was older than the workspace module and did not include the
`influencer.social.account` model/view files. Because `C:\custom_addons`
appeared before the project addons path, Odoo could load the stale copy first.
The log then showed:

```text
Object influencer.social.account doesn't exist
```

Keep the workspace module as the source of truth:

```text
C:\Users\mame computer\Documents\influencer-link-et\apps\odoo_addons\ethio_influencer_pro
```

To fix the active config order, open PowerShell as Administrator and run:

```powershell
cd "C:\Users\mame computer\Documents\influencer-link-et"
.\scripts\fix_odoo_addons_path.ps1
```

The desired `addons_path` order is:

```text
c:\program files\odoo 18.0.20260220\server\odoo\addons, C:\Users\mame computer\Documents\influencer-link-et\apps\odoo_addons, C:\custom_addons
```

## Why Changes May Not Appear

- The running Odoo service is using a different config file than expected.
- `addons_path` does not include the project addons folder.
- A duplicate module folder earlier in `addons_path` shadows the workspace copy.
- A Python model file is not imported in `models/__init__.py`.
- A view XML file is missing from `__manifest__.py`.
- `security/ir.model.access.csv` is missing or references the wrong `model_*` ID.
- XML has a parse or view validation error.
- Odoo was not restarted after Python model changes.
- The module was not upgraded after XML, manifest, model, or access changes.
- Apps list was not updated after adding a new module.
- The browser is showing old UI assets.

## Static Preflight Check

Run this before upgrading the module:

```powershell
cd "C:\Users\mame computer\Documents\influencer-link-et"
python .\scripts\check_odoo_module.py
```

The script checks module structure, imports, manifest data, access CSV rows, XML
well-formedness, duplicate XML IDs, and Python compilation.

## Expected Module Structure

The module folder is:

```text
apps/odoo_addons/ethio_influencer_pro
```

Required files:

```text
__init__.py
__manifest__.py
models/__init__.py
security/ir.model.access.csv
views/
```

Expected model files:

```text
models/industry.py
models/influencer.py
models/campaign.py
models/message.py
models/contract.py
models/payment.py
models/social_account.py
```

Expected view files:

```text
views/industry_views.xml
views/influencer_views.xml
views/campaign_views.xml
views/message_views.xml
views/contract_views.xml
views/payment_views.xml
views/social_account_views.xml
views/menu_views.xml
```

## Import Chain

The module root `__init__.py` must import models:

```python
from . import models
```

The `models/__init__.py` file must import every model file that defines Odoo
models:

```python
from . import industry
from . import res_partner
from . import influencer
from . import social_account
from . import campaign
from . import message
from . import contract
from . import payment
```

Odoo will not register a model, table, fields, access model ID, or views for a
Python file that is not imported.

## Manifest Data

`__manifest__.py` must load security first and menus last:

```python
"data": [
    "security/ir.model.access.csv",
    "data/industry_data.xml",
    "views/industry_views.xml",
    "views/res_partner_views.xml",
    "views/influencer_views.xml",
    "views/social_account_views.xml",
    "views/campaign_views.xml",
    "views/message_views.xml",
    "views/contract_views.xml",
    "views/payment_views.xml",
    "views/menu_views.xml",
]
```

Use forward slashes in manifest paths.

## Access CSV

`security/ir.model.access.csv` must use this exact header:

```text
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
```

Expected model IDs:

```text
model_influencer_industry
model_influencer_profile
model_influencer_campaign
model_influencer_message
model_influencer_contract
model_influencer_payment
model_influencer_social_account
```

For MVP internal user access, use:

```text
base.group_user,1,1,1,1
```

If a row fails with a missing `model_*` external ID, first check that the model
file is imported by `models/__init__.py`.

## Correct Workflow After Python Model Changes

1. Run the static preflight checker.
2. Stop or restart the Odoo service so Python files are reloaded.
3. Run a command-line module upgrade.
4. Check `C:\Program Files\Odoo 18.0.20260220\server\odoo.log`.
5. Start Odoo normally if it is stopped.
6. Refresh the browser.

## Correct Workflow After XML-Only Changes

1. Run the static preflight checker.
2. Upgrade the module from the command line or Apps UI.
3. Refresh the browser.
4. Check the Odoo log if the change does not appear.

## Command-Line Upgrade

From PowerShell:

```powershell
cd "C:\Program Files\Odoo 18.0.20260220\server"
& "C:\Program Files\Odoo 18.0.20260220\python\python.exe" "C:\Program Files\Odoo 18.0.20260220\server\odoo-bin" -c "C:\Program Files\Odoo 18.0.20260220\server\odoo.conf" -d influencer_link_db -u ethio_influencer_pro --stop-after-init
```

If the service config has not yet been reordered, use an explicit workspace-first
addons path for the upgrade:

```powershell
& "C:\Program Files\Odoo 18.0.20260220\python\python.exe" "C:\Program Files\Odoo 18.0.20260220\server\odoo-bin" -c "C:\Program Files\Odoo 18.0.20260220\server\odoo.conf" --addons-path "c:\program files\odoo 18.0.20260220\server\odoo\addons,C:\Users\mame computer\Documents\influencer-link-et\apps\odoo_addons,C:\custom_addons" --no-http -d influencer_link_db -u ethio_influencer_pro --stop-after-init
```

If the Windows service is already running and the command conflicts on the HTTP
port, stop `odoo-server-18.0`, run the upgrade command, then start the service.

## Odoo UI Verification

Enable Developer Mode, then verify:

```text
Settings -> Technical -> Database Structure -> Models
Settings -> Technical -> Database Structure -> Fields
Settings -> Technical -> User Interface -> Views
Settings -> Technical -> User Interface -> Menu Items
Apps -> Update Apps List
```

Expected models:

```text
influencer.industry
influencer.profile
influencer.campaign
influencer.message
influencer.contract
influencer.payment
influencer.social.account
```

Expected menus under Ethio Influencer Pro:

```text
Industries
Influencers
Campaigns
Messages
Contracts
Payments
Social Accounts
```
