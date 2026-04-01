# Apartman Yonetim Sistemi

Project: Apartman Yonetim Sistemi

## Deploy
GitHub -> Vercel -> Custom Domain

## Structure
- `index.html` = landing page
- `basvuru.html` = form
- `site.html` = apartman sayfasi
- `css/` = statik stiller (hazir)
- `js/` = statik scriptler (hazir)

## Vercel Routing
Bu projede `vercel.json` ile su route yapisi kullanilir:
- `/basvuru` -> `basvuru.html`
- `/apartman-adi` gibi tek segment URL'ler -> `site.html`

## Firebase (Opsiyonel)
Bu repoda aktif Firebase baglantisi bulunmuyor. Eklenecekse config degerlerini environment variable olarak yonetin.

Ornek placeholder:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  projectId: "YOUR_PROJECT_ID"
};
```

## Google Sheets Entegrasyonu (Opsiyonel)
Mevcut form gorunumunu bozmadan Google Sheets'e veri yazmak icin:

1. Google Sheets acin.
2. `Extensions -> Apps Script` menusu ile script editore girin.
3. Bu repodaki `google-sheets-apps-script.gs` icerigini yapistirin.
4. `Deploy -> New deployment -> Web app`:
   - Execute as: `Me`
   - Who has access: `Anyone`
5. Olusan Web App URL'sini kopyalayin.
6. `basvuru.html` icinde `GOOGLE_SHEETS_WEB_APP_URL` sabitine bu URL'yi yazin.

Not: Bu entegrasyon aktif olsa da form Formspree'ye gondermeye devam eder.

## GitHub Deploy Talimati
1. GitHub repo olustur
2. Bu klasoru repo icine yukle
3. Vercel -> Import Git Repository
4. Domain bagla
