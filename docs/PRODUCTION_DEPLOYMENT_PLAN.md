# InfluencerLink ET Production Deployment Plan

Date: May 20, 2026

## 1. Deployment Goal

Move InfluencerLink ET from local development to a publicly accessible production environment where the web app, PWA, and future Android wrapper use a stable HTTPS domain. Production should keep Odoo secure, backed up, and reachable by the Next.js server while preserving Odoo-backed data, role-based access, admin permissions from `base.group_system`, and all existing marketplace workflows.

Do not deploy with local-only URLs, development credentials, or committed secrets. Production must keep browser users away from direct Odoo service credentials; only server-side Next.js code should use `ODOO_USERNAME` and `ODOO_PASSWORD`.

## 2. Recommended Production Architecture

### Option A: Single VPS

One VPS runs:

- Odoo 18
- PostgreSQL
- Next.js app from `apps/web`
- Nginx reverse proxy
- SSL certificates from Let's Encrypt

This is the recommended MVP architecture for early Ethiopian demos and first production pilots. It is simpler to operate, cheaper, and avoids exposing Odoo across the public internet except through Nginx.

### Option B: Split Deployment

- Odoo + PostgreSQL on a VPS
- Next.js on Vercel or a separate Node server
- Nginx and SSL on the Odoo VPS

This can scale better later, but it requires secure Odoo network access from the Next.js host, stricter firewall rules, and careful CORS/callback planning. Use this when managed frontend hosting, separate teams, or higher traffic require it.

Recommendation: start with Option A unless managed hosting is explicitly preferred.

## 3. Production Domains

Recommended MVP domains:

- `https://app.influencerlink.et` -> Next.js app
- `https://odoo.influencerlink.et` -> Odoo backend/admin

Alternative layout:

- `https://influencerlink.et` -> marketing site or app
- `https://api.influencerlink.et` -> Next.js app/API if separated later
- `https://odoo.influencerlink.et` -> Odoo backend/admin

HTTPS is required for production cookies, PWA install behavior, Android wrapper production use, and future OAuth/social callbacks. The PWA and Capacitor app must use the HTTPS production URL, not `localhost` or `http://192.168.0.188:3000`.

## 4. Server Requirements

Minimum VPS for MVP:

- Ubuntu 22.04 LTS or Ubuntu 24.04 LTS
- 2 vCPU
- 4 GB RAM
- 60 GB SSD
- PostgreSQL installed
- Nginx installed
- Node.js LTS
- Python and Odoo dependencies installed
- Swap enabled if RAM is low

Better reliability target:

- 4 vCPU
- 8 GB RAM
- 100 GB SSD
- Automated backups with off-server storage

Odoo is heavier than the Next.js app. PostgreSQL health and backups are critical because marketplace, contracts, payment state, notifications, and verification records live in Odoo/PostgreSQL.

## 5. Odoo Production Setup

Install Odoo 18 on the server and configure PostgreSQL. Deploy the custom addon to a stable production path:

```text
/opt/odoo/custom_addons/ethio_influencer_pro
```

Set `addons_path` so the production custom addons directory appears before any stale or old copies. This is important because the local QA pass found that a duplicate stale module in `C:\custom_addons` can cause old code loading when path order is wrong.

Example Odoo upgrade command:

```bash
./odoo-bin -c /etc/odoo/odoo.conf -d production_db -u ethio_influencer_pro --stop-after-init
```

Important production `odoo.conf` keys:

```ini
[options]
addons_path = /opt/odoo/odoo/addons,/opt/odoo/custom_addons
db_host = False
db_port = False
db_user = odoo
db_password = strong_database_password
admin_passwd = strong_odoo_master_password
proxy_mode = True
logfile = /var/log/odoo/odoo-server.log
```

For multi-worker production Odoo, size workers to available RAM and CPU. A small MVP server can start conservatively and add workers after baseline monitoring:

```ini
workers = 2
limit_memory_soft = 1342177280
limit_memory_hard = 1677721600
```

Production Odoo checklist:

- Create PostgreSQL database, for example `production_db`.
- Install or restore the production database.
- Copy `ethio_influencer_pro` to `/opt/odoo/custom_addons/ethio_influencer_pro`.
- Confirm `addons_path` points to the intended addon copy first.
- Restart Odoo after Python changes.
- Upgrade `ethio_influencer_pro` after model, view, access, or data changes.
- Confirm Odoo admin users belong to `base.group_system` only when they should receive app admin access.

## 6. Next.js Production Setup

Deploy the web app from `apps/web`.

Install and build:

```bash
cd apps/web
npm ci
npm run build
```

Start:

```bash
npm run start
```

Use a process manager such as PM2 or systemd. PM2 example:

```bash
pm2 start npm --name influencerlink-web -- run start
pm2 save
pm2 startup
```

Systemd example start command:

```ini
ExecStart=/usr/bin/npm run start
WorkingDirectory=/opt/influencer-link-et/apps/web
Environment=NODE_ENV=production
```

Set environment variables on the server or process manager, not in committed files. Next.js must use the production Odoo URL. If Odoo and Next.js run on the same VPS, the internal server-side `ODOO_URL` can be `http://127.0.0.1:8069` while Nginx exposes Odoo publicly at `https://odoo.influencerlink.et`. If Next.js is hosted separately, use an HTTPS Odoo URL and firewall it carefully.

The browser should never receive Odoo service credentials. Keep `ODOO_USERNAME` and `ODOO_PASSWORD` server-only.

## 7. Environment Variables

Production variables should be set in the host environment, PM2 ecosystem file, systemd drop-in, or managed hosting secret store:

```env
ODOO_URL=https://odoo.influencerlink.et
ODOO_DB=production_db
ODOO_USERNAME=service_user
ODOO_PASSWORD=strong_secret
SESSION_SECRET=long_random_secret
AUTH_SESSION_SECRET=long_random_secret
YOUTUBE_API_KEY=production_key
TELEGRAM_BOT_TOKEN=production_token
NEXT_PUBLIC_APP_URL=https://app.influencerlink.et
CHAPA_SECRET_KEY=production_secret
CHAPA_PUBLIC_KEY=production_public_key
CHAPA_WEBHOOK_SECRET=production_webhook_secret
CHAPA_RETURN_URL=https://app.influencerlink.et/payments
CHAPA_CALLBACK_URL=https://app.influencerlink.et/api/payments/chapa/webhook
TELEBIRR_APP_ID=production_app_id
TELEBIRR_APP_KEY=production_app_key
TELEBIRR_MERCHANT_CODE=production_merchant_code
TELEBIRR_NOTIFY_URL=https://app.influencerlink.et/api/payments/telebirr/callback
TELEBIRR_RETURN_URL=https://app.influencerlink.et/payments
```

Important rules:

- Do not use `admin/admin` in production.
- Prefer a dedicated Odoo service user with the minimum access that the app needs.
- `AUTH_SESSION_SECRET` or `SESSION_SECRET` must be long, random, and stable across app restarts.
- Never commit `.env.production`, `.env.local`, database passwords, API keys, bot tokens, or OAuth client secrets.
- Rotate keys if they were ever exposed.
- Add Google OAuth callback URLs later only after final production domains are chosen.
- Configure payment gateway merchant keys only in the production secret store. Chapa and Telebirr secrets must never be committed, logged, or exposed to the browser.
- Payment callback URLs must use HTTPS production domains and must verify webhook signatures/callback authenticity plus server-to-server transaction status before updating Odoo.

## 8. Nginx Reverse Proxy

Nginx should terminate HTTPS and proxy to local services.

Next.js domain:

```nginx
server {
    server_name app.influencerlink.et;

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Odoo domain:

```nginx
server {
    server_name odoo.influencerlink.et;

    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:8069;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 720s;
        proxy_connect_timeout 720s;
        proxy_send_timeout 720s;
    }

    location /websocket {
        proxy_pass http://127.0.0.1:8072;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Set `proxy_mode = True` in `odoo.conf` so Odoo respects forwarded HTTPS headers. Restrict direct access to ports `3000`, `8069`, `8072`, and PostgreSQL with firewall rules.

## 9. SSL / HTTPS

Use Certbot and Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d app.influencerlink.et -d odoo.influencerlink.et
```

HTTPS is required for:

- Secure cookies
- PWA installation
- Android production wrapper
- Future OAuth callbacks
- Telegram/Google/social integration redirects

Confirm certificate renewal:

```bash
sudo certbot renew --dry-run
```

## 10. Database Backup Strategy

Use daily PostgreSQL dumps and weekly full backups. Store at least one encrypted copy off-server. Do not store backups only on the same VPS.

Example database dump:

```bash
pg_dump production_db > /var/backups/influencerlink/production_db_$(date +%F).sql
```

Recommended schedule:

- Daily PostgreSQL dump.
- Daily Odoo filestore backup.
- Weekly full server or volume backup.
- Off-server copy to object storage, backup server, or secure external location.
- Monthly restore test into staging.

The restore process must be tested. A backup that has never been restored is only a hope with a filename.

## 11. File Storage / Attachments

Odoo stores attachments in the filestore. Database backup alone is not enough when attachments, images, documents, or future uploaded verification files exist.

Back up:

- PostgreSQL database
- Odoo filestore, usually under `/var/lib/odoo/.local/share/Odoo/filestore/production_db`
- Custom addons in `/opt/odoo/custom_addons`
- Odoo config files
- Next.js deployment configuration
- Secure environment variable records outside Git

Example filestore backup:

```bash
tar -czf /var/backups/influencerlink/filestore_$(date +%F).tar.gz /var/lib/odoo/.local/share/Odoo/filestore/production_db
```

## 12. Security Checklist

- Use HTTPS only for public traffic.
- Use a strong Odoo master password in `admin_passwd`.
- Disable default `admin/admin` and any throwaway test credentials.
- Restrict PostgreSQL to local/private network access.
- Restrict direct Odoo and Next.js ports behind Nginx.
- Allow public firewall access only to `80` and `443`, plus SSH from trusted IPs where possible.
- Protect Odoo admin access and limit who belongs to `base.group_system`.
- Use a dedicated Odoo service user if possible.
- Keep `.env.local`, `.env.production`, and secret manager exports out of Git.
- Rotate API keys and bot tokens after staff changes or suspected exposure.
- Do not expose social token fields in client responses.
- Enable unattended security updates or schedule regular patching.
- Review production auth cookies: `secure` should be true under `NODE_ENV=production`.
- Use strong SSH keys and disable password SSH login where operationally feasible.
- Monitor logs for repeated failed login attempts and API errors.
- Before enabling real payment gateways, confirm Chapa/Telebirr callback routes are HTTPS-only, rate limited where possible, signature-verified, idempotent, and backed by server-to-server amount/currency/reference verification.
- Keep escrow release admin-controlled until contract completion, refund, and dispute workflows are production-ready.

## 13. PWA / Mobile Production Setup

The PWA manifest uses relative `start_url` and `scope`, so it should work correctly once served from the production domain. Verify:

- `https://app.influencerlink.et/manifest.json` returns 200.
- Icons return 200.
- Login and dashboard routes work over HTTPS.
- Installed PWA opens the HTTPS app, not local development.

For Capacitor production, change:

```ts
server: {
  url: "http://192.168.0.188:3000",
  cleartext: true,
}
```

to:

```ts
server: {
  url: "https://app.influencerlink.et",
}
```

Remove `cleartext: true` or set cleartext off for production. The Android APK/AAB must not depend on a LAN IP.

## 14. Capacitor Production Notes

Local testing can use the LAN IP while the phone and PC are on the same network. Production must use a stable HTTPS hosted URL.

Build Android only after:

- Production app domain is stable.
- HTTPS certificate works.
- Odoo production access works from the Next.js server.
- Login, role redirects, and core flows pass on the production URL.

Android Studio or a cloud build environment is needed for APK/AAB generation. If the local PC is too weak, launch the PWA first and use a cloud Android build later.

For debug APK cloud builds, remember that Capacitor packages the configured `server.url`. A workflow-built APK will point to whatever is currently in `apps/web/capacitor.config.ts`; production sharing should use `https://app.influencerlink.et`, not `http://192.168.0.188:3000`, and production builds should not enable HTTP cleartext traffic.

## 15. CI/CD Plan

Basic Git workflow:

- Use `main` for production-ready code.
- Use an optional `staging` branch for pre-production verification.
- Tag releases after successful staging.
- Pull latest code on the server or deploy from CI.

Predeploy checks:

```powershell
python .\scripts\check_odoo_module.py
cd apps/web
npm.cmd run lint
npm.cmd run build
```

Deployment flow:

1. Pull the intended release.
2. Install dependencies with `npm ci`.
3. Run lint, build, and Odoo module static check.
4. Deploy/restart Next.js.
5. Copy updated Odoo addon files.
6. Restart Odoo if Python changed.
7. Upgrade `ethio_influencer_pro` when model/view/security/data changes occur.
8. Smoke-test `/login`, `/api/me`, admin verification, campaign list, messages, contracts, payments, and notifications.

## 16. Staging Environment

Create a staging environment before real launch:

- `https://staging-app.influencerlink.et`
- `https://staging-odoo.influencerlink.et`
- Separate staging PostgreSQL database.
- Separate staging Odoo filestore.
- Separate non-production API keys if available.

Test Odoo module upgrades in staging first. Use safe fixture data for business owners, influencers, campaigns, contracts, payments, social accounts, and notifications.

## 17. Production Launch Checklist

- [ ] Odoo 18 installed.
- [ ] PostgreSQL configured.
- [ ] Production database created or restored.
- [ ] Custom module copied to production custom addons path.
- [ ] `addons_path` points to the intended custom addon copy.
- [ ] `ethio_influencer_pro` installed/upgraded.
- [ ] Next.js app deployed.
- [ ] Production environment variables configured outside Git.
- [ ] Nginx reverse proxy configured.
- [ ] HTTPS configured and renewal tested.
- [ ] Firewall configured.
- [ ] PWA manifest verified on production domain.
- [ ] Admin login tested.
- [ ] Business owner login tested.
- [ ] Influencer login tested.
- [ ] Campaign flow tested.
- [ ] Messages tested.
- [ ] Contracts tested.
- [ ] Payments tested.
- [ ] Notifications tested.
- [ ] Social account verification tested.
- [ ] YouTube API sync tested.
- [ ] Telegram API sync tested.
- [ ] PostgreSQL backup tested.
- [ ] Odoo filestore backup tested.
- [ ] Restore process tested in staging.

## 18. Known Current Gaps Before Production

From the May 20, 2026 QA pass:

- Dedicated business-owner and influencer QA credentials are still needed.
- Safe fixture records are needed for mutation QA.
- Full campaign/message/contract/payment/notification mutation QA is still pending.
- Instagram/TikTok integrations are not implemented yet.
- Real payment gateway integration is not implemented yet.
- Android APK/AAB build is not completed.
- Full mobile viewport visual QA should be done.
- Production hosting, domains, and HTTPS are not configured yet.

Do not move to public production until role-specific QA and backup/restore testing are complete.
