# RUN_LOCAL.md — Smeta AI mobil ilovani lokal ishga tushirish

Nol holatdan ilovani ko'rish uchun aniq qadamlar. **Windows'da iOS Simulator
yo'q** — shuning uchun uch yo'l: (A) **Chrome/brauzer** (eng tez), (B) **Expo Go**
jismoniy telefonda, (C) **Android emulyator** (Android Studio kerak).

## 0. Talablar
- **Node 20 LTS yoki 22** tavsiya (Expo SDK 52 rasman shularni qo'llaydi).
  Node 24 ham ishlaydi — lekin faqat `apps/mobile/package.json` dagi pin qilingan
  versiyalar bilan (pastdagi "Muammolar" ga qarang).
- Backend uchun: Docker (yoki lokal Postgres) — asosiy repo README bo'yicha.

## 1. Backendni lokal ishga tushirish
Ildizda (`smeta-ai/`):
```bash
docker compose up -d db          # yoki lokal Postgres
npm install
npm run db:migrate -w @smeta/api
npm run db:seed -w @smeta/api    # demo ma'lumot (ixtiyoriy)
npm run dev:api                  # API → http://localhost:4000
```
Telefonda test qilsangiz `.env` da `WEB_ORIGIN` muhim emas (mobil `Origin`
yubormaydi — CORS o'tadi). AI/voice uchun `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`
bo'lmasa demo rejim ishlaydi.

## 2. LAN IP ni aniqlash (telefon/emulyator localhost'ni ko'rmaydi!)
```bash
ipconfig            # Windows → "IPv4 Address", masalan 192.168.1.100
```

## 3. Mobil `.env`
`apps/mobile/.env` yarating:
```
EXPO_PUBLIC_API_URL=http://192.168.1.100:4000
```
> **Android emulyator** host'ni `10.0.2.2` orqali ko'radi — kod buni avtomatik
> almashtiradi (`src/lib/env.ts`). **Chrome (web)** da `localhost:4000` ham bo'ladi.

## 4. Ilovani ishga tushirish
```bash
cd apps/mobile
npm install
```

### A) Chrome / brauzer (eng tez ko'rish)
```bash
npx expo start --web
# yoki: npx expo start  → so'ng terminalda 'w' bosing
```
Brauzerda `http://localhost:8081` ochiladi. Web'da token `localStorage` da
saqlanadi (native'da Keychain/Keystore).

### B) Expo Go — jismoniy telefon (iOS ham, Android ham)
1. App Store/Play'dan **Expo Go** o'rnating.
2. Telefon va kompyuter **bir Wi-Fi** da bo'lsin.
3. `npx expo start` → QR kod chiqadi → Expo Go bilan skanerlang.
4. `.env` da **LAN IP** bo'lishi shart (localhost emas).

### C) Android emulyator (Android Studio kerak)
1. Android Studio → SDK + AVD (masalan Pixel 7, API 34) o'rnating; `ANDROID_HOME`
   ni sozlang.
2. Emulyatorni ishga tushiring, so'ng: `npx expo start` → `a` bosing
   (yoki `npx expo run:android`).

### iOS Simulator
macOS + Xcode kerak (Windows'da imkonsiz). macOS bo'lmasa: **Expo Go** (B) yoki
bulutda **EAS Build**: `npx eas build -p ios --profile preview`.

## 5. Smoke test oqimi
Login → Dashboard (statlar) → Loyihalar → loyiha ochish → KPI/smetalar.
(Seed'dagi demo login: asosiy repo `apps/api/prisma/seed.ts` ga qarang —
`demo1234`.)

## 6. Tez-tez uchraydigan muammolar
| Belgi | Sabab / yechim |
|-------|----------------|
| `metro/src/lib/TerminalReporter is not exported` | metro 0.84 tortilgan. **Yechim:** `package.json` da `nativewind` **4.1.23** (aniq) + `react-native-css-interop` **0.1.22** pin qilingan; `metro` **0.81.5** bo'lishi kerak. `npm ls metro` bilan tekshiring. |
| `Cannot find module 'react-native-reanimated/plugin'` | Reanimated yo'q yoki babel'ga qo'shilmagan. `npx expo install react-native-reanimated`; `babel.config.js` da plugin **oxirgi** bo'lsin. |
| `Unable to resolve react-native-css-interop/jsx-runtime` | css-interop nested. `react-native-css-interop: 0.1.22` to'g'ridan-to'g'ri dep sifatida (hoist). |
| Ilova API'ga ulanmaydi | `.env` da localhost ishlatilgan — **LAN IP** qo'ying; backend ishlab turganini va portni tekshiring. |
| Android'da tarmoq xatosi | `10.0.2.2` (emulyator) yoki LAN IP (jismoniy). |
| Kirill (ru) matn | Standart shriftlar kirillni qo'llaydi; maxsus shrift qo'shilsa kirill subset tekshiring. |

## 7. Foydali buyruqlar
```bash
npm run typecheck                # tsc --noEmit (butun mobil kod)
npx expo export --platform web   # web bundle tekshiruvi (dist/ ga)
npx expo start -c                # Metro keshni tozalab ishga tushirish
```
