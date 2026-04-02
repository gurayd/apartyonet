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

### Admin Panel
- `login.html` Firebase Authentication ile giris yapar.
- Basarili giriste `admin.html` sayfasina yonlendirir.
- `admin.html` Firestore'dan `basvurular` koleksiyonunu listeler.
- Admin e-posta kisiti: `guraydinsel@gmail.com`

### Firestore Rules
Bu repoda `firestore.rules` dosyasi vardir. Kurallari Firebase Console > Firestore Database > Rules ekranina yapistirin veya Firebase CLI ile yayinlayin.

Beklenen kural mantigi:
- `basvurular` icin `create`: acik (form gonderimi)
- `basvurular` icin `read/update/delete`: sadece admin e-posta
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
