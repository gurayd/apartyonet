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

## GitHub Deploy Talimati
1. GitHub repo olustur
2. Bu klasoru repo icine yukle
3. Vercel -> Import Git Repository
4. Domain bagla
