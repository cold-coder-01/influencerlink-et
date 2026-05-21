# InfluencerLink ET Mobile App Plan

## Fastest Mobile Path

1. Keep the existing Next.js app and make the current routes mobile-first.
2. Add PWA support so users can install InfluencerLink ET from a mobile browser.
3. Wrap the hosted web app with Capacitor for Android when the responsive PWA is stable.

## Why Not React Native Immediately

React Native or Flutter would require rebuilding screens, auth flows, Odoo API integration, permissions, forms, and verification workflows. The fastest low-risk path is to reuse the working Next.js/Odoo product, improve mobile usability, and package it later.

## Packaging Android Later

Before packaging, confirm the production web app is hosted over HTTPS and that Odoo API access works from that hosted environment. Then add Capacitor, point it at the built web output or hosted URL strategy, and test on a real Android device plus emulator.

## Future Capacitor Commands

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init
npx cap add android
npm run build
npx cap sync android
npx cap open android
```

## Hosted URL And Localhost Notes

If the app uses server-rendered Next.js pages with Odoo data fetching, the mobile app may still need a hosted backend/web URL rather than only static files. For local Android emulator testing, `localhost` points to the emulator itself, so use the correct host mapping or a reachable development URL.

## Capacitor Android Local Development

Install Capacitor from the Next.js app folder:

```bash
cd apps/web
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "InfluencerLink ET" "com.influencerlink.et"
npx cap add android
```

This project uses Next.js server routes and Odoo RPC, so the Android wrapper should use a hosted or locally served web URL instead of a static export. For local development, find the PC LAN IP with `ipconfig` and use the active Wi-Fi or Ethernet IPv4 address. The current local testing URL is:

```text
http://192.168.0.188:3000
```

Do not use `localhost` for Android. On a phone or emulator, `localhost` means the Android device itself, not the development PC running Next.js and Odoo.

Run Next.js so it listens on the network:

```bash
npm.cmd run dev -- -H 0.0.0.0
```

The Capacitor config should point to the PC IP during local testing:

```ts
server: {
  url: "http://192.168.0.188:3000",
  cleartext: true,
}
```

`cleartext: true` and Android cleartext traffic are for local HTTP development only. For production, replace `server.url` with an HTTPS hosted URL and remove local-only assumptions.

## Production URL Notes

The LAN IP is only for local development and device testing:

```text
http://192.168.0.188:3000
```

For production, the Capacitor app must point to the public HTTPS app domain, for example:

```ts
server: {
  url: "https://app.influencerlink.et",
}
```

Do not ship an APK/AAB that depends on `localhost`, a LAN IP, or HTTP cleartext traffic. `cleartext: true` is a local development setting only; remove it or keep cleartext disabled for production builds. The PWA install path also needs HTTPS so browser install prompts, secure cookies, and future OAuth/social callbacks work reliably.

Cloud APK builds use the exact `server.url` committed in `apps/web/capacitor.config.ts`. If the config still points to `http://192.168.0.188:3000`, the APK artifact will build successfully but will only run where that LAN URL is reachable. Before sharing an APK outside the local Wi-Fi network, change `server.url` to `https://app.influencerlink.et` and use HTTPS without `cleartext: true`.

After changing web or native configuration, sync Android:

```bash
npx cap sync android
```

Open and run the app in Android Studio:

```bash
npx cap open android
```

Then let Gradle sync, select an emulator or connected Android phone, and press Run. If the phone cannot open the local URL, allow Node.js through Windows Firewall and confirm the phone and PC are on the same Wi-Fi.

If the PC is too weak for Android Studio, use the PWA-first path or the cloud debug APK workflow documented in `docs/ANDROID_BUILD_PATH.md`.

## Future Native Features

- Push notifications
- Camera upload
- Deep links
- Biometric login
- File upload
- Offline caching
