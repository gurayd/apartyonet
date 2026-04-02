# Apartman Yonetim Sistemi

Project: Apartman Yonetim Sistemi

## Deploy
GitHub -> Vercel -> Custom Domain

## Structure
- `index.html` = landing page
- `basvuru.html` = form
- `login.html` = yonetici giris
- `admin.html` = basvurular admin paneli
- `site.html` = apartman sayfasi
- `css/` = statik stiller (hazir)
- `js/` = statik scriptler (hazir)

## Vercel Routing
Bu projede `vercel.json` ile su route yapisi kullanilir:
- `/basvuru` -> `basvuru.html`
- `/apartman-adi` gibi tek segment URL'ler -> `site.html`

## Firebase
Bu repoda basvuru formu Firebase Firestore'a veri yazar.

### Giris ve Rol Modeli
- `login.html` Firebase Authentication ile e-posta/sifre girisi yapar.
- Giris sonrasi `users/{uid}` profili okunur.
- Rol bazli yonlendirme:
  - `site_manager` ve `assistant_manager` -> `admin.html`
  - `resident` -> `demo.html`
- `users/{uid}` alanlari: `email`, `displayName`, `role`, `siteId`, `unitId`, `status`, `createdAt`
- `sites/{siteId}` dokumani tenant (site) tanimini tutar.

### Admin Panel
- `admin.html` sadece yonetici rollerine aciktir.
- Basvurular `siteId` bazli filtrelenir.
- Site yoneticisi kullanici yonetimi yapabilir (kullanici olustur/rol-guncelle).

### Firestore Rules
Bu repoda `firestore.rules` dosyasi vardir. Kurallari Firebase Console > Firestore Database > Rules ekranina yapistirin veya Firebase CLI ile yayinlayin.

Beklenen kural mantigi:
- `basvurular` icin `create`: acik (form gonderimi)
- `basvurular` icin `read/update`: ayni `siteId` icinde aktif rol bazli
- `users` ve `sites`: rol + `siteId` bazli yetkilendirme
- diger dokumanlar: kapali

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
