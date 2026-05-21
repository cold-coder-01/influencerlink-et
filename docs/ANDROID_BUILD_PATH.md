# Android Build Path

Date: May 20, 2026

InfluencerLink ET currently uses a mobile-responsive Next.js app, PWA install support, and a Capacitor Android wrapper in `apps/web/android`. The current Capacitor app id is `com.influencerlink.et`, the app name is `InfluencerLink ET`, and the generated Android project includes the Gradle wrapper (`apps/web/android/gradlew` and `apps/web/android/gradlew.bat`).

The current `apps/web/capacitor.config.ts` points the Android wrapper at the local development server:

```ts
server: {
  url: "http://192.168.0.188:3000",
  cleartext: true,
}
```

That LAN URL and `cleartext: true` are development-only. Any APK built from this config will try to open that exact server URL at runtime. Before sharing an APK outside the local Wi-Fi network, change the URL to the HTTPS production app domain:

```ts
server: {
  url: "https://app.influencerlink.et",
}
```

Production APK/AAB builds should use HTTPS and should not depend on `localhost`, a LAN IP, or HTTP cleartext traffic.

## Option 1: PWA First, No APK

This is the recommended immediate path for MVP testing on a weak PC.

1. Start or deploy the web app.
2. Open the local or production URL in Android Chrome.
3. Use Chrome's install/Add to Home Screen option.
4. Test the installed PWA from the Android home screen.

This requires no Android Studio, no Android SDK, and no APK build. It is the fastest path for demos and early user feedback. Production PWA install should use HTTPS, preferably `https://app.influencerlink.et`, so install behavior, secure cookies, and future OAuth/social flows work reliably.

## Option 2: Local CLI APK Build Without Android Studio UI

This path builds an APK from the command line. The Android Studio UI is not required, but Android SDK command-line tools are still required.

Required tools:

- Java JDK 17 or another JDK compatible with the Android Gradle plugin.
- Android SDK command-line tools.
- Android platform-tools.
- Android build-tools.
- The Gradle wrapper already generated in `apps/web/android`.

The generated Android project currently uses Android Gradle plugin `8.13.0`, `compileSdkVersion = 36`, and `targetSdkVersion = 36` in `apps/web/android/variables.gradle`. If those versions change later, install the matching Android SDK platform/build tools.

Windows setup:

1. Install JDK 17.
2. Install Android SDK command-line tools.
3. Set environment variables:
   - `JAVA_HOME` to the JDK install path.
   - `ANDROID_HOME` or `ANDROID_SDK_ROOT` to the Android SDK path.
   - Add `%ANDROID_HOME%\platform-tools` to `PATH`.
4. Accept Android SDK licenses:

```powershell
sdkmanager --licenses
```

5. Install Android SDK packages matching this project:

```powershell
sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0"
```

6. Build and sync the web app:

```powershell
cd apps\web
npm.cmd run build
npx.cmd cap sync android
```

7. Build a debug APK with the Gradle wrapper:

```powershell
cd android
.\gradlew.bat assembleDebug
```

8. Find the APK at:

```text
apps/web/android/app/build/outputs/apk/debug/app-debug.apk
```

The debug APK is for testing only. It is not suitable for Play Store upload and should not be treated as a production release.

## Option 3: Cloud Build / GitHub Actions

This is the recommended APK path when the local PC is too weak for Android tooling.

Push the project to GitHub and run the manual `Android Debug APK` workflow from the Actions tab. The workflow in `.github/workflows/android-debug-build.yml`:

- Checks out the repository.
- Sets up Node.js, Java 17, and Android SDK command-line tools.
- Installs `apps/web` dependencies.
- Runs `npm run lint`.
- Runs `npm run build`.
- Runs `npx cap sync android`.
- Runs `./gradlew assembleDebug`.
- Uploads `app-debug.apk` as a workflow artifact.

Because this Capacitor app uses `server.url`, the debug APK can build without converting the Next.js app to a static export. At runtime, the APK will load whatever URL is configured in `apps/web/capacitor.config.ts`. If the config still points to `http://192.168.0.188:3000`, the cloud-built APK will only work on devices that can reach that local LAN server. Before sharing the APK outside the development Wi-Fi network, change `server.url` to `https://app.influencerlink.et` and keep production traffic on HTTPS.

## Later Release AAB Plan

Debug APKs are not for Play Store distribution. A Play Store release usually needs a signed Android App Bundle (`.aab`).

Release signing will require:

- `upload-keystore.jks`
- Key alias
- Keystore password
- Key password
- Gradle signing configuration

Never commit the keystore, `key.properties`, passwords, or signing secrets. Store release signing values in GitHub Secrets or another secure secret manager. The `.gitignore` rules protect common keystore and signing property filenames, but secret handling still needs discipline during release setup.

When release signing is configured later, the release build command will be:

```bash
./gradlew bundleRelease
```

The expected release AAB output is:

```text
apps/web/android/app/build/outputs/bundle/release/app-release.aab
```

Do not implement release signing until the production domain, HTTPS deployment, Play Store account, package name, and keystore ownership plan are final.
