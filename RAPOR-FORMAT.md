# RAPOR-FORMAT.md — firmanın kendi rapor formatını kurduğu sistem (AA10)

> Reisim (2026-10-02, §9 kırk sekizinci tur, birebir): *"Bu söylediklerimi tek bir rapor özelinde değil, tüm raporları bu şekilde
> kurgulayabileceğim bir sistem tasarla ben müşteriye sunduğumda kendi rapor formatını yükleyip istediği gibi şekillendirebilecek
> kurgulayabileceği bir sistem tasarlamamız gerkeli yoksa her rapor format yüklemesinde tek tek benim uğraşmam gerekli."*
>
> **Durum: TASARIM — onay bekliyor.** Makette "Format kurucu" ekranı (Ekipman türleri › tür › Format kurucu) bu belgeyi gösterir.
> **§8.3 kararı değişiyor:** "şablonlar firma × tür başına kodda, site içi düzenleyici yok" → **"format, firmanın format kurucusunda
> tutulan sürümlü bir tanım (JSON); saha ekranı ve PDF bu tanımdan çizilir; çizen motor kodda tektir"**. Reisim onaylayınca §8.3 güncellenir.

## 0 · Neden

Bugün her türün raporu (saha ekranı + PDF) kodda elle kurulmuş: iç tesisat, topraklama, kompresör … Yeni bir firma kendi formatını
getirdiğinde ya da bir firma formatını değiştirdiğinde iş bize (koda) düşüyor. Hedef: **firma, kendi formatını kendisi kurar**; probata
yalnız yapı taşlarını (blokları) ve kuralları verir.

## 1 · Üç katman

| Katman | Ne tutar | Kim değiştirir |
|---|---|---|
| **Yapı** | Bölümler ve sırası; her bölüm bir **blok** (aşağıda) | Firma (format kurucu) |
| **Kurallar** | Zorunlu alanlar, "Uygun değil"de fotoğraf zorunlu mu, kusur derecesi (hafif / ağır) sorulur mu, ölçüm sınırları, sonuç önerisi, periyot | Firma |
| **Görünüm (PDF)** | Üst bilgi (logo, künye, form kodu, revizyon), bölüm numaralandırma, sayfa düzeni, imza alanları | Firma; Bakanlık formatlı türde zorunlu alanlar kilitli |

Motor (kodda, tek): tanımı okuyup **saha ekranını** (tablet / telefon) ve **PDF'i** aynı tanımdan çizer; doğrulamayı, otomatik sonucu ve
kusur listesini hesaplar. Firmalar arasında motor ortak, tanım firmaya özel.

## 2 · Bloklar (yapı taşları)

1. **Bilgi alanları** — etiket + alan türü: metin · sayı (birimli) · tarih · seçim (seçenekler) · çoklu seçim · evet / hayır. Kayıttan gelen
   alanlar (firma adı, adres, rapor no, İSG-KATİP, kontrol tarihleri) hazır alan olarak eklenir, raporda salt okunur.
2. **Kontrol listesi** — gruplar ve maddeler; cevap seti (Uygun · Uygun değil · Uygulanamaz ya da firmanın kendi seti); madde başına
   açıklama ve referans standart (raporda (i) penceresi — AA7); "Hepsini işaretle".
3. **Ölçüm tablosu** — satırlar (sabit ya da denetçi ekler) × sütunlar (ad, birim, giriş türü); **sınır kuralı**: en az / en çok / formül
   (ör. Zs ≤ U₀ / Ia) → satır sonucu kendiliğinden Uygun / Uygun değil; sonuç kusur listesine düşer.
4. **Test değerleri** — tek tek değer + sınır (ör. deney basıncı ≥ 1,5 × çalışma basıncı).
5. **Ölçüm cihazları** — türün cihaz türleri (zimmetten eklenir, kalibrasyon denetimi).
6. **Fotoğraflar** — en az / en çok sayı; açıklama.
7. **Kusur açıklamaları** — kendiliğinden (Uygun değil maddeler + sınır dışı ölçümler); fotoğraflı.
8. **Sonuç ve kanaat** — cümle şablonu ("… kullanılması uygundur / uygun değildir"); otomatik öneri.
9. **Not / yorum** — serbest metin (muayene uzmanı yorumu).
10. **İmza alanları** — muayene uzmanı, teknik yönetici; imza yöntemi firma ayarından.

## 3 · Kurallar (format başına)

- Alan / madde / ölçüm bazında **zorunlu**; zorunlu boşken Onaya gönder uyarır ve alanı işaretler (bugünkü davranış).
- **"Uygun değil" maddede fotoğraf zorunlu** — aç / kapa (başlangıçta kapalı; reisim AA9).
- **Kusur derecesi** (hafif / ağır) sorulur mu — aç / kapa (başlangıçta kapalı; reisim AA9). Açıksa hafif kusur devri (V4) çalışır.
- **Sonuç önerisi**: herhangi Uygun değil / sınır dışı → "Uygun değil"; firma seçerse denetçi değiştirir.
- **Periyot** ve sonraki kontrol tarihi (türden).
- Bakanlık formatlı türde (ZPKR01 …): Bakanlığın zorunlu alanları **kilitli** — silinemez, yalnız sırası / görünümü değişir; eksikse yayınlanmaz
  (bu tek engel: resmî formatın kendisi).

## 4 · Başlangıç yolları

1. **Hazır şablondan** — probata kitaplığı (Bakanlık formatları + genel türler); firma kopyalar, değiştirir.
2. **Boş** — bölüm bölüm kurar.
3. **Kendi formatını yükle** — firma PDF / Word formatını yükler; **yapay zekâ taslak çıkarır** (başlıklar → bölümler, madde listeleri →
   kontrol listesi, tablolar → ölçüm tablosu, sütun başlıkları → alanlar). Taslak **öneri**dir; firma format kurucuda düzeltir, yayınlar
   (K1: yapay zekâ firma ayarıyla açık olmalı; kapalıysa 1 ya da 2).

## 5 · Sürüm ve yayın

- Format **taslak** → **yayınla** (v1, v2 …; değişiklik notu). Açık raporlar başladıkları sürümle kalır; yeni raporlar yeni sürümle açılır
  (bugünkü "Formatı güncelle" — 211 — taslak raporu yeni sürüme taşır).
- Yayın öncesi denetim: boş bölüm, sınırı olmayan ölçüm sütunu, cevap seti olmayan liste, kilitli alan eksik → liste hâlinde söylenir.
- Eski sürümler saklanır (imzalı raporun PDF'i hangi sürümle çizildiyse o sürümle yeniden üretilebilir).

## 6 · Ekran (format kurucu)

- **Sol**: bölüm listesi (sırala, ekle, sil, kopyala). **Orta**: seçili bölümün düzenleyicisi (bloğa göre). **Sağ**: canlı önizleme —
  saha ekranı (tablet / telefon) ↔ PDF sayfası.
- Üstte: tür adı · sürüm · taslak / yayında · **Yayınla** · **Kurallar** · **Görünüm**.
- Telefonda kurucu açılmaz (masaüstü işi); önizleme açılır.

## 7 · Veri

- `rapor_format` (firma, tür, sürüm, durum, tanım JSON, yayınlayan, tarih, not) — kiracı süzgeçli (RLS).
- Rapor, açıldığı format sürümünü taşır (`format_surum`); cevaplar bölüm / alan kimlikleriyle saklanır (sıra değişse de bozulmaz).
- Tanım JSON şeması sürümlü; motor eski şemayı okur (göç).

## 8 · Bugünkü maketle ilişkisi

- Bugünkü türler (iç tesisat ZPKR02, topraklama ZPKR01, kompresör …) kitaplıkta **hazır şablon** olur; elle kurulmuş ekranlar motorun
  ilk deneme setidir (motor aynı ekranı tanımdan çizebilmeli — ölçülerek).
- AA9 (fotoğraf zorunluluğu ve kusur derecesi kalktı) bu sistemde **kural** olur: başlangıçta kapalı, firma isterse açar.

## 9 · Yapım sırası (kod aşamasında)

1. Tanım şeması + motor (saha ekranı) — bugünkü 3 türü tanımdan çizip ekran görüntüsüyle karşılaştır.
2. PDF motoru aynı tanımdan.
3. Format kurucu (yapı → kurallar → görünüm), sürüm / yayın.
4. Kitaplık (hazır şablonlar).
5. Yapay zekâyla taslak çıkarma (en son; öneri).
