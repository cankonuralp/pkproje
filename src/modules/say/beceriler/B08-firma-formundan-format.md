---
ad: firma-formundan-format
tarif: Firmanın kendi rapor formundan (PDF / Word) bir ekipman türünün format taslağını kurar ya da eksiklerini tamamlar; kontrol metodu standartlarını ve ölçüm cihazı türlerini bağlar.
ne_zaman: "Bu forma göre formatı kur / düzenle", "vinci bu dosyaya göre düzenle", "standartları ve cihazları bağla" istendiğinde.
---

# B08 · Firma formundan format

## 1. Hazırlık

1. Türü bul: `tur_ara` → `tur_getir`. Tür yoksa `tur_kaydet` ile aç.
2. Sürümler: `format_surumleri`. **Yayındaki sürüm değişmez.** Açık taslak varsa onu düzenle; yoksa yayındaki sürümden taslak
   başlat.
3. Form dosyası:
   - **PDF varsa:** `format_pdf_kur` ile şablonu PDF'ten kur. Formatı elle çizme.
   - **Yalnız Word varsa:** kullanıcıdan PDF olarak kaydedip eklemesini iste. Kullanıcı Word'le sürdürmek isterse Word metninden
     (tablolar "|" ile) eksikleri `formati_duzenle` ile tamamla.

## 2. Formu ayrıştır

Formdaki her parçayı probata'daki yerine ayır:

| Formda | probata'da |
|---|---|
| Firma ve rapor bilgileri (unvan, rapor no, tarih, SGK, sözleşme) | Firma bilgileri bölümü (çoğu hazırdır); eksik satır `firma_satiri` |
| Teknik özellikler | Ekipman bilgileri bölümüne alan (`oge_ekle`, tür ve birim ile) |
| Kontrol maddeleri | Kontrol listesi, formdaki gruplarıyla (`grup_ekle`, sonra `oge_ekle` + `grup`) |
| Test ve yük değerleri | Test bölümü (`bolum_ekle tur: test`, `oge_ekle`) |
| Notlar, uygunsuzluklar | Kusur açıklamaları (hazır bölüm) |
| Referans standartlar, kullanılan cihazlar | Türün bağlantıları (§5) ve metot satırı |
| Sonuç cümlesi | Sonuç bölümü (yalnız sözcükler değişebilir) |

## 3. Karşılaştır, yalnız eksiği ekle

1. Haritayı oku: açık taslakta `ekran_durumu`, değilse `format_getir`.
2. Var olanı tekrar ekleme; yalnız eksik olanı ekle.
3. Yalnız "önce sun" istendiyse şunları göster ve bekle (yoksa sormadan uygula):
   - eklenecek alanlar,
   - gruplar ve grup başına madde sayısı,
   - test değerleri,
   - standartlar,
   - cihazlar.

## 4. Uygula

- Açık taslakta `formati_duzenle`, değilse `format_taslak_duzenle`.
- Sıra: **önce gruplar, sonra maddeler (grup adıyla), sonra alanlar, en son test bölümü.** Grup sonradan eklenirse mevcut maddeler
  o gruba taşınmaz.
- Geri oku ve say: alan sayısı, grup başına madde sayısı, test değerleri. Formdakiyle eşit değilse tamamla.
- **Sıra: format kesinleşir → bir kez yayınlanır → raporlar açılır.** İş rapor gerektiriyorsa raporları açmadan ÖNCE `format_yayin_denetle` →
  `format_yayinla` (onay sormadan). Yayın notunu boş bırakırsan sunucu değişikliklerin özetini yazar; "1" gibi anlamsız not yazma.
- **Yeni öğe isteğe bağlıdır** (zorunlu yalnız kullanıcı isterse). Formatta zaten olan bilgiyi tekrar ekleme (ör. "Kaldırma kapasitesi" varken "Beyan kapasitesi").
  **Test değeri uygulanan yüktür, beyan edilen değer değildir.**

## 5. Standartlar ve ölçüm cihazları

1. Mevcut bağlantılar: `tur_getir`. Seçenekler: `tur_baglanti_secenekleri`.
2. **Standart:**
   - **Türün KENDİ standardını** ara (`tur_baglanti_secenekleri` her standardın bağlı olduğu türleri gösterir). Aynı gruptaki başka türün standardını
     kopyalama (ör. kule krenin standardı araç liftine bağlanmaz). Kütüphanede yoksa bildir.
   - Kütüphanede ya da Bakanlık listesinde olan numara bağlanır.
   - Hiçbirinde olmayan numara için PDF gerekir; kullanıcıdan Dokümanlar › Standartlar'a yüklemesini iste ya da
     `tur_standart_ekle` ile ekle.
3. **Yönetmelik standart değildir** (ör. iş ekipmanları yönetmeliği). Metot satırında yazı olarak kalır; bildirimde söyle.
4. **Cihaz türü:** `cihaz_turleri`. Katalogda yoksa `cihaz_turu_kaydet` ile ekle, sonra bağla. `tur_baglanti_secenekleri` firmadaki cihaz sayısını
   verir: cihazı olmayan türü bağlarsan raporlara cihaz seçilemez — bildirimin "Kalan engel" satırına yaz.
5. Bağla: `tur_baglanti_kaydet`. Listenin tamamı yazılır, türün sürümüyle. Sonra doğrula.

## 6. Tuzaklar

- **İki sütunlu madde tablosu:** bir satırda iki madde yan yana gelir (`1 | … | 14 | …`). Sol ve sağı ayır, numaraya göre sırala.
- **Başlık satırları** (`No | GENEL KONTROLLER | Sonuç`) madde değil, grup adıdır.
- **Formun kendi işaretleri** ("*": ölçüm isteyen madde) madde metnine girmez. "Diğer…" gibi boş satırlar eklenmez.
- **Varsayılan adlar bırakılmaz:** "Yeni madde", "Yeni alan".
- **Cevap seçenekleri:** "U / UD / X (Özellik yok)" → Uygun / Uygun değil / Uygulanamaz.
- **Test yükü sınırları anma yüküne (P) bağlıdır** (ör. dinamik 1,1 × P, statik 1,25 × P). Formülle bağlanabiliyorsa bağla;
  bağlanamıyorsa sınırı boş bırak ve söyle.
- **Benzer adla eşleştirme yapma:** "Lazermetre" ≠ "Şerit metre". Numarayı harfiyen eşleştir: TS EN 12464-1 ≠ TS ISO 9927-1.
- **Kaydedilmemiş taslak:** açık taslakta iş bitince taslağı kaydet / yayınla (iş gerektiriyorsa); kullanıcıya bırakma.

## 7. Bildirim

Şunları bildir:

- eklenen alanlar,
- gruplar ve madde sayıları,
- test değerleri,
- bağlanan / eklenemeyen standartlar ve cihazlar (nedeniyle),
- elle yapılması gerekenler (ör. sonuç cümlesi),
- yayınlandıysa sürümü ve yayın notu.
