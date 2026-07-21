# RELEASE.md — Smeta AI mobil: build, OTA va do'kon (STAGE 5)

## 0. Assetlar
`assets/` da placeholder brend PNG'lar bor (navy+purple). **Brendli dizayn bilan
almashtiring** (`scripts/gen-assets.mjs` — placeholder generatori):
- `icon.png` 1024×1024, `adaptive-icon.png` 1024×1024 (Android), `splash.png`,
  `favicon.png` (web).

## 1. EAS loyihasini ulash (bir marta)
```bash
cd apps/mobile
npm i -g eas-cli
eas login
eas init            # projectId yaratadi (app.config extra.eas.projectId ga yoziladi)
```
> **Push uchun MUHIM:** `eas init` bergan `projectId` bo'lmasa, dev/preview/prod
> build'da `getExpoPushTokenAsync` ishlamaydi (Expo Go'da ishlaydi). `src/lib/push.ts`
> uni `Constants` dan avtomatik oladi.

## 2. Build profillari (`eas.json`)
| Profil | Nima | API URL |
|--------|------|---------|
| `development` | dev-client (native debug) | LAN IP (`.env`) |
| `preview` | internal APK/IPA (test) | `https://smeta-ai.uz` |
| `production` | do'kon relizi (autoIncrement) | `https://smeta-ai.uz` |

```bash
eas build -p android --profile preview      # test APK
eas build -p ios     --profile preview      # macOS'siz — bulutda IPA (TestFlight)
eas build -p android --profile production
eas build -p ios     --profile production
```
> **iOS (macOS'siz):** EAS bulutda quradi; TestFlight/qurilma uchun Apple Developer
> akkaunti kerak. Tez sinov uchun **Expo Go + `npx expo start`** (RUN_LOCAL.md).

## 3. OTA update (EAS Update)
JS/asset o'zgarishlarini do'konsiz yetkazish (`runtimeVersion: appVersion`):
```bash
eas update --branch production --message "tavsif"
```
Native o'zgarish (yangi modul) bo'lsa — qayta build shart.

## 4. Do'konga yuborish
```bash
eas submit -p android --profile production   # Google Play
eas submit -p ios     --profile production   # App Store
```
Metadata (nom, tavsif, kalit so'zlar, ekran suratlari 6.7"/5.5", maxfiylik siyosati
URL — web'dagi `/privacy`, `/terms`) — do'kon konsollarida.

## 5. Reliz oldidan checklist
- [ ] `npm run typecheck` (tsc) toza · `npx expo export --platform web` toza
- [ ] Assetlar brendli (placeholder emas)
- [ ] `.env` / EAS `env` da to'g'ri `EXPO_PUBLIC_API_URL` (prod domen)
- [ ] `eas init` projectId (push uchun)
- [ ] Deep-linking sxemasi `smetaai://` (referral/marketing havolalar)
- [ ] Sirlar repoda yo'q (`.env` .gitignore'da ✅)

## 6. Qolgan sifat ishlari (keyingi iteratsiya)
- **Testlar:** API client unit (`format.ts`/`estimate.ts`/`cart.ts` sof mantiq),
  kritik oqim uchun Maestro smoke (login→loyiha→smeta).
- **Offline:** TanStack Query persist (AsyncStorage) — smetani offline ko'rish,
  qoralama navbat.
- **A11y:** barcha ikon-tugmalarga `accessibilityLabel`, tegish maydonlari ≥44pt
  (`hitSlop`), kontrast tekshiruvi. (Button/VoiceButton/savat FAB'da boshlandi.)
- **Kuzatuv:** Sentry (crash) va analitika (web'dagi GA'ga mos).
