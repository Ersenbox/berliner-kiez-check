# KiezCheck Berlin – Kurulum ve İşletme Rehberi

Berlin mahalle rehberi: işletmeler kendi kaydını girer, yapay zekâ kontrol edip üç dile çevirir, sen sadece para kazandıran kısma odaklanırsın.

© 2026 DeindigitalerhelferCenter

---

## 1. Sistem nasıl çalışıyor?

```
İşletme formu doldurur (foto + bilgiler)
        │
        ▼
Worker: spam kontrolü (honeypot + saatte 5 kayıt sınırı)
        │
        ├─► Adres → koordinat (OpenStreetMap Nominatim)
        └─► Claude Haiku: uygun mu? + DE/TR/EN açıklama
        │
        ├─ Uygun ve AUTO_APPROVE=1 → hemen yayında
        └─ Şüpheli / KI yok → admin.html'de onay bekler
        │
        ▼
İşletme bir düzenleme bağlantısı alır → istediği zaman
düzenler veya "Öne çıkar" (19 € / 49 €) → Stripe → otomatik aktif
        │
        ▼
Google: /k/neukoelln/fruehstueck gibi SEO sayfaları + sitemap.xml
Gelir: öne çıkarma + AdSense (web) + AdMob (Android)
```

Dosyalar:

| Dosya | Görev |
|---|---|
| `worker.js` | Tüm API, Stripe, admin, SEO sayfaları, sitemap |
| `schema.sql` | D1 veritabanı |
| `wrangler.toml` | Cloudflare ayarları |
| `public/index.html` | Ana uygulama (PWA, DE/TR/EN, harita, kayıt formu) |
| `public/admin.html` | Onay paneli |
| `public/sw.js`, `manifest.json`, `icon.svg` | PWA / çevrimdışı |
| `public/vendor/` | Leaflet ve Archivo fontu yerel (Google Fonts yok → DSGVO) |
| `android/capacitor.config.json` | APK için |

---

## 2. Kurulum (yaklaşık 1 saat)

```bash
npm i -g wrangler
wrangler login

# Veritabanı
wrangler d1 create kiezcheck          # çıkan database_id'yi wrangler.toml'a yaz
wrangler d1 execute kiezcheck --remote --file=schema.sql

# Fotoğraf deposu
wrangler r2 bucket create kiezcheck-photos

# Gizli anahtarlar
wrangler secret put ADMIN_TOKEN           # uzun rastgele şifre (en az 32 karakter)
wrangler secret put ANTHROPIC_API_KEY     # console.anthropic.com
wrangler secret put STRIPE_SECRET_KEY     # sk_live_...
wrangler secret put STRIPE_WEBHOOK_SECRET # whsec_... (adım 3'ten)

wrangler deploy
```

Sonra Cloudflare Dashboard → Workers → kiezcheck → Settings → Domains → `kiezcheck.de` ekle.

`public/index.html` içinde `CFG` bölümünü doldur: Impressum ve Datenschutz linkleri, AdSense bilgileri, fiyatlar.

**Güncelleme:** Kodu değiştirdikten sonra sadece `wrangler deploy`. Arayüzde büyük değişiklik yaptıysan `public/sw.js` içindeki `kiezcheck-v1` → `v2` yap (eski önbellek temizlensin).

---

## 3. Stripe (öne çıkarma ödemeleri)

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://kiezcheck.de/api/stripe-webhook`
3. Event: `checkout.session.completed`
4. Signing secret'ı `STRIPE_WEBHOOK_SECRET` olarak kaydet
5. Settings → Invoices → alt bilgi: *„Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."* (Kleinunternehmer)

Sistem her ödemede otomatik fatura oluşturur, kayıt 30/90 gün öne çıkar, süre bitince kendiliğinden normale döner. Aynı ödeme iki kez işlenmez.

---

## 4. Reklam

**Web (AdSense):**
- AdSense'e `kiezcheck.de`'yi ekle. Onay için sitede yeterli gerçek içerik olmalı → önce 50–100 kayıt topla, sonra başvur.
- `index.html` → `CFG.ADSENSE_CLIENT` ve `CFG.ADSENSE_SLOT`; `wrangler.toml` → aynı değerler (SEO sayfaları için).
- `public/ads.txt` dosyası oluştur (AdSense sana içeriğini verir).
- **Zorunlu:** AdSense → Privacy & messaging → AB için Google'ın onaylı çerez onay formunu (CMP) aç. AB'de bu olmadan reklam gösterilmemeli.

**Android (AdMob):**
- AdSense WebView içindeki uygulamalarda kullanılamaz, bu yüzden uygulamada otomatik gizlenir.
- AdMob'da banner birimi oluştur, ID'yi `CFG.ADMOB_BANNER`'a yaz. Onay formu (UMP) kod içinde hazır.

---

## 5. APK (Android)

```bash
mkdir kiezcheck-app && cd kiezcheck-app
npm init -y
npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor-community/admob
cp ../android/capacitor.config.json .
mkdir www && echo '<meta http-equiv="refresh" content="0;url=https://kiezcheck.de">' > www/index.html
npx cap add android
npx cap sync
npx cap open android      # Android Studio → Build → Generate Signed Bundle
```

AdMob App-ID'yi `android/app/src/main/AndroidManifest.xml` içine eklemeyi unutma (`com.google.android.gms.ads.APPLICATION_ID`).

Uygulama canlı siteyi yüklediği için güncellemelerde yeni APK gerekmez.

**Google Play riski:** Sadece bir web sitesini gösteren uygulamalar "minimum işlevsellik" gerekçesiyle reddedilebilir. Başvurmadan önce PWA'nın çevrimdışı çalışması, haritası ve konum özellikleri iyi anlatılmalı; ileride push bildirimi ("Mahallende yeni açılan yerler") eklemek bu riski azaltır. Başlangıçta web + PWA (ana ekrana ekle) yeterli.

---

## 6. Günlük iş yükü (1–2 kişi)

| İş | Süre | Kim |
|---|---|---|
| `admin.html` → bekleyen kayıtları onayla/reddet | Günde 5–10 dk | Sen veya çalışan |
| Esnaf ziyareti / telefon ile kayıt toplama | Haftada 3–5 saat | Çalışan |
| Instagram/TikTok'ta haftalık "Kiez'de yeni" paylaşımı | Haftada 1 saat | Çalışan |
| Teknik bakım | Ayda 1 saat | Sen |

KI kontrolü açıkken normal kayıtların çoğu otomatik yayına girer; sadece şüpheliler seni bekler.

---

## 7. Gerçekçi gelir modeli

Ana gelir **öne çıkarma**, reklam ek gelirdir. Yerel bir rehberde reklam geliri trafiğe bağlıdır ve AB'de onay vermeyen kullanıcılar nedeniyle düşer; ciddi AdSense geliri ancak ayda on binlerce sayfa görüntülemesiyle başlar. Öne çıkarma ise ilk aydan para getirir.

Örnek hedef (tahmin, garanti değil):

| Ay | Ücretsiz kayıt | Öne çıkaran işletme | Aylık gelir (yaklaşık) |
|---|---|---|---|
| 1–2 | 50–100 | 3–5 | 60–100 € |
| 3–6 | 300 | 15–25 | 300–500 € + reklam |
| 6–12 | 800+ | 40–60 | 800–1.200 € + reklam |

**Ek gelir fikirleri (kod gerektirmez):**
- Doğrudan banner satışı: bir mahallenin en üst alanı için yerel işletmeye aylık 49–99 €
- "Esnaf Paketi" ile birleştirme: öne çıkarma + sosyal medya içeriği
- Affiliate: taşınma, internet, sigorta (önceki KiezCheck planındaki ortaklar)

**Maliyetler (yaklaşık):** Cloudflare başlangıçta ücretsiz katmanda kalır; Claude Haiku kayıt başına bir sentin çok altında; domain yılda ~10 €; Stripe kart başına küçük bir komisyon.

---

## 8. İlk 30 gün – kayıt toplama planı

1. **1. hafta:** Kendi mahallendeki 30 işletmeyi bizzat ziyaret et, telefondan birlikte kaydı gir (2 dakika). İlk 20 işletmeye 30 gün ücretsiz öne çıkarma ver (admin panelinden değil, Stripe'ta %100 kupon ile).
2. **2. hafta:** Her işletmeye A6 kart / QR kod bırak: "KiezCheck'te bizi bulun". Bu hem trafik hem güven getirir.
3. **3. hafta:** Google Search Console → sitemap gönder. Instagram'da "Neukölln'de kahvaltı: 5 yer" gibi paylaşımlar, link KiezCheck sayfasına.
4. **4. hafta:** Ücretsiz dönemi biten işletmelere ücretli öne çıkarmayı teklif et.

Boş mahalle sayfaları otomatik olarak `noindex` olur (Google'da zayıf görünmemek için), kayıt gelince kendiliğinden indekslenir.

---

## 9. Hukuki kontrol listesi (yayından önce)

Ben avukat değilim; bu liste başlangıç noktasıdır, özellikle Datenschutz metnini bir uzmana veya güvenilir bir jeneratöre (ör. e-recht24) yaptır.

- [ ] **Impressum:** tam ad, adres, e-posta, telefon
- [ ] **Datenschutzerklärung:** Cloudflare (hosting), Stripe (ödeme), Anthropic (kayıt kontrolü/çeviri), OpenStreetMap (harita karoları ve adres arama), Google AdSense/AdMob, form verileri ve saklama süresi
- [ ] **Reklam etiketi:** öne çıkarılan kayıtlar "Anzeige" olarak işaretli ✔ (kodda hazır)
- [ ] **Yorum yok:** MVP'de bilinçli olarak kullanıcı yorumu yok; sahte veya satın alınmış yorumlar yasak (UWG), yorum moderasyonu ayrıca iş yükü ve risk getirir
- [ ] **Öne çıkarma için kısa AGB:** ne satılıyor (30/90 gün üst sıra), iade, kayıt silme hakkı
- [ ] **Bildirim ve kaldırma:** Impressum'daki e-postaya gelen şikâyetleri 48 saat içinde işle, gerekirse admin panelinden sil
- [ ] **Fotoğraf hakları:** kayıt formunda onay kutusu ✔ (kodda hazır)
- [ ] **Fontlar ve harita kütüphanesi yerel** ✔ (Google Fonts kullanılmıyor)

---

## 10. Sonraki adımlar (v2)

- İşletmeye e-posta ile düzenleme bağlantısı gönderme (Cloudflare Email veya Resend)
- Push bildirimleri (Play Store için de avantaj)
- Doğrudan banner alanı yönetimi (admin panelden)
- Esnaf Sosyal Medya Ajanı ile bağlantı: "Kaydın var, sosyal medya içeriğin de bizden"
- Daha fazla mahalle (şu an 20) ve kategori (şu an 10) – `worker.js` ve `index.html` içindeki `KIEZE`/`CATS` listelerine eklemek yeterli

---

# EK: Reklam, Sponsorlar, Paketler, Kuponlar, İş İlanları (Eylül 2026)

## 11. Repo yapısı (`Ersenbox/berliner-kiez`)

```
berliner-kiez/
├── index.html          ← ORİJİNAL Quiz – DEĞİŞTİRİLMEDİ
├── images/             ← ORİJİNAL görseller – DEĞİŞTİRİLMEDİ
└── kiezcheck/          ← YENİ: KiezCheck uygulamasının tamamı
    ├── worker.js, werbung.js, wrangler.toml
    ├── schema.sql, schema-002-werbung.sql, seed-sponsoren.sql
    └── public/
        ├── index.html, admin.html, werben.html
        ├── quiz/index.html          ← Quiz'in KiezCheck'e bağlı kopyası
        ├── assets/kiez/*.webp       ← görsellerin küçültülmüş kopyaları
        └── assets/sponsors/*.webp   ← 7 reklam verenin banner'ları
```

## 12. Kurulum / güncelleme

Yeni kurulum:
```bash
cd kiezcheck
wrangler d1 execute kiezcheck --remote --file=schema.sql
wrangler d1 execute kiezcheck --remote --file=schema-002-werbung.sql
wrangler d1 execute kiezcheck --remote --file=seed-sponsoren.sql
wrangler deploy
```

KiezCheck zaten yayındaysa sadece son iki SQL dosyası + `wrangler deploy`. Mevcut kayıtlar korunur (test edildi).

**GitHub'dan otomatik yayın:** Cloudflare Dashboard → Workers → kiezcheck → Settings → Builds → GitHub reposu `Ersenbox/berliner-kiez`, **Root directory: `kiezcheck`**. Böylece her `git push` sonrası otomatik yayınlanır ve repodaki orijinal Quiz (GitHub Pages vb.) etkilenmez.

**Stripe webhook'una 3 olay daha ekle:** `invoice.paid`, `customer.subscription.deleted` (mevcut `checkout.session.completed`'e ek olarak).

## 13. Fiyatlar

| Paket | İlk 3 ay | Sonra | Ne alır |
|---|---|---|---|
| Küçük (≤5 çalışan) | 19 €/ay | 49 €/ay | Kendi Kiez + kategoride en üstte, kupon |
| Orta (6–20) | 19 €/ay | 69 €/ay | + Tüm Berlin listesinde üstte |
| Büyük (20+ / şubeler) | 19 €/ay | 89 €/ay | + Ana sayfada sponsor kartı |
| Banner sponsoru | 19 €/ay | 49–89 €/ay | Admin panelinden elle girilir |
| Acil iş ilanı | – | 29 € tek sefer | 30 gün en üstte |

İşletmeler paketleri kendileri seçip kartla öder (Stripe abonelik, 3 ay indirim kuponu otomatik oluşur). Aylık iptal: Stripe müşteri portalı veya Stripe Dashboard.

Fiyatları değiştirmek: `werbung.js` → `SUBS` ve `INTRO`, `public/index.html` → `CFG.PRICE_*`, `public/werben.html` metinleri.

## 14. Reklam verenleri yönetmek (admin.html → „Sponsoren")

- Yeni sponsor ekle, düzenle, duraklat, sil; başlangıç ve bitiş tarihi gir (bitince otomatik kaybolur)
- Hedefleme: sadece belirli Kiez'ler / kategoriler (örn. The Visit → kreuzberg + cafe)
- Yerleşim: ana sayfa şeridi, liste arası, kayıt sonrası, Kiez-Quiz
- Her sponsor için 30 günlük gösterim ve tıklama; **„Bericht kopieren"** ile reklam verene gönderilecek aylık rapor hazır
- „Jobs" sekmesi: iş ilanı onayı; „Werbeanfragen": werben.html'den gelen talepler

## 15. Açık kararlar (senin onayını bekliyor, dokunulmadı)

1. **Quiz'deki reklam vaatleri** (650 € Cashback, 150 € Bonus, 120 € Vorteil, %40, „wissenschaftlich validiert", „98% Match") – UWG riski, metinler aynen bırakıldı.
2. **Quiz'deki yedek haberler** (API çalışmazsa gösterilen sabit haberler) gerçek haber gibi görünüyor ama sabit metin. Kaldırılması veya „Beispiel" olarak işaretlenmesi önerilir.
3. **Repodaki `ad_banner_check24/o2/vattenfall/bwb.jpg`** (marka logoları) KiezCheck'te kullanılmıyor; sadece WebP kopyaları oluşturuldu.
4. **Partner linkleri** (`AFF` – `public/quiz/index.html`) takip kodu bekliyor.
5. **AdSense / AdMob** ID'leri: `CFG` bloklarında boş.
