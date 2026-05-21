# InfluencerLink ET

## InfluencerLink ET Documentation

- [Local setup](docs/LOCAL_SETUP.md)
- [Production deployment plan](docs/PRODUCTION_DEPLOYMENT_PLAN.md)
- [Odoo setup](docs/ODOO_SETUP.md)
- [Odoo module troubleshooting](docs/ODOO_MODULE_TROUBLESHOOTING.md)
- [Field mapping](docs/FIELD_MAPPING.md)
- [API routes](docs/API_ROUTES.md)
- [Permissions](docs/PERMISSIONS.md)
- [Social accounts](docs/SOCIAL_ACCOUNTS.md)
- [Instagram / TikTok API research](docs/INSTAGRAM_TIKTOK_API_RESEARCH.md)
- [Admin verification dashboard](docs/ADMIN_VERIFICATION.md)
- [Notifications](docs/NOTIFICATIONS.md)
- [Campaign lifecycle](docs/CAMPAIGN_LIFECYCLE.md)
- [Messages](docs/MESSAGES.md)
- [Contracts](docs/CONTRACTS.md)
- [Payments / Escrow](docs/PAYMENTS.md)
- [Payment gateway plan](docs/PAYMENT_GATEWAY_PLAN.md)
- [Android build path](docs/ANDROID_BUILD_PATH.md)
- [Architecture notes](docs/ARCHITECTURE_NOTES.md)

## Android Debug Builds

The lightest Android path is PWA-first testing from Android Chrome. For APK testing without installing Android Studio on a weak PC, use the manual GitHub Actions workflow in `.github/workflows/android-debug-build.yml`; it builds and uploads a debug APK artifact.
