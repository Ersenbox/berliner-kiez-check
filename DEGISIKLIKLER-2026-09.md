# Değişiklik Protokolü – Eylül 2026

## Dokunulmayanlar (kontrol toplamıyla doğrulandı)
- `berliner-kiez/index.html` (orijinal Quiz)
- `berliner-kiez/images/` – 18 görselin tamamı

## Yeni dosyalar
| Dosya | İçerik |
|---|---|
| `werbung.js` | Sponsorlar, gösterim/tıklama sayacı, abonelik paketleri, iş ilanları, reklam talepleri, haber proxy'si |
| `schema-002-werbung.sql` | Yeni tablolar + `listings` tablosuna 6 yeni sütun (sadece ekleme) |
| `seed-sponsoren.sql` | 7 reklam veren |
| `public/werben.html` | Paketler ve talep formu (DE/TR/EN) |
| `public/quiz/index.html` | Orijinal Quiz'in KiezCheck'e bağlı kopyası |
| `public/assets/kiez/` | 18 görselin WebP kopyası (aynı boyut, 18,5 MB → 4,0 MB) + 13 adet 800 px mobil kopya (~130 KB) |
| `public/assets/sponsors/` | 7 banner (ekran görüntülerinden) |
| `public/vendor/fonts/plus-jakarta-sans-*`, `public/vendor/confetti/` | Quiz için yerel font ve konfeti |

## Mevcut dosyalarda cerrahi değişiklikler (silinen çalışan özellik yok)
**worker.js** – import satırı; Tiergarten; yeni API rotaları; `PUB` alan listesine yeni sütunlar; sıralama: Orta/Büyük paket Berlin genelinde üstte; kupon filtresi; kayıt/düzenlemede WhatsApp + kupon alanları; checkout'a abonelik ve iş ilanı; webhook'a abonelik olayları; admin'e yeni bölümler; sitemap'e quiz + werben. Eski 30/90 gün ödeme yolu çalışmaya devam ediyor (test edildi).

**public/index.html** – Sponsor şeridi; sekmeler (Betriebe, Gutscheine, Jobs, Merkliste, Notruf, Quiz, Werben); liste arasında sponsor kartı (yoksa AdSense); kayıtta WhatsApp, kupon, ♡ kaydet; formda WhatsApp + kupon alanları; paket seçimi (19 € → 49/69/89 €) eski 30/90 gün butonlarının yerine; kayıt sonrası IT-Rechtbox; iş ilanı formu; acil numaralar; Tiergarten.

**public/admin.html** – Sponsorlar, Jobs, Werbeanfragen bölümleri eklendi; mevcut onay ekranı aynen.

**public/sw.js** – önbellek sürümü v2, yeni sayfalar. **public/manifest.json** – kısayollar.

## Quiz kopyasında (`public/quiz/index.html`) yapılanlar
Entegrasyon listesindeki B1–B14, B16, B17 + sponsor alanları (sonuç ekranı, Services sekmesi) + WebP görseller. **B15 (reklam vaatleri) yapılmadı** – onayını bekliyor.

## Test sonucu
46 API testi + tarayıcı testleri (masaüstü, mobil, TR/DE/EN) başarılı, JavaScript hatası yok.
