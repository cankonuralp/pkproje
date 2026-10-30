---
ad: eski-rapordan-envanter
tarif: Geçmiş yılın ya da başka firmanın rapor PDF'inden ekipman envanterini ve kalıcı özelliklerini çıkarır, plana ve raporlara aktarır; eski sonuçları almaz.
ne_zaman: "Eski raporlara bakarak kur", "geçen yılın raporundan tüpleri al", "bu PDF'teki ekipmanları plana ekle" istendiğinde.
---

# B09 · Eski rapordan envanter

## Adımlar

1. **PDF'i oku:**
   - rapor türü,
   - tesis bilgisi (adres, SGK — değeri karşılaştırma için),
   - envanter tablosu.
2. **Tabloyu satır satır çıkar** ve aralıklarla özetle. Örnek: "1–80 KKT 6 kg · 81–110 CO2 5 kg · 111–120 tekerlekli KKT 50 kg ·
   marka X".
3. **Tesisle karşılaştır:**
   - `tesis_getir`: adres ve tesis aynı mı?
   - Farklıysa yazmadan sor. Eski rapor yanlış olabilir ya da tesis değişmiş olabilir.
4. **Özeti sun:** toplam adet, tür dağılımı, bölüm / konum, eksik bilgi.
5. **Aktar:**
   - **Tablolu tür** (tüp, dolap, raf): raporu aç → `rapor_yaz` + `satir_ekle` (adet = toplam, numara sütunu sırayla) → aralık
     aralık değerler.
   - **Tekil tür** (fan, kompresör …): `plan_ekipmanlar_ekle` ile plana, sonra her raporun ekipman alanlarına.
6. **Sayıları doğrula:** toplam ve tür başına adetler PDF'tekiyle eşit mi?

## Kurallar

- **Eski sonuç yeni sonuç değildir.** Eski rapordaki "uygun / uygun değil", ölçüm sonuçları ve son kontrol tarihi alınmaz.
- **Kalıcı bilgiler alınır:** marka, model, imal yılı, kapasite, dolum tarihi, hidrostatik test tarihi gibi bilgiler. Saha
  notları bunlarla çelişirse saha notu geçerlidir.
- Seçim sütunlarına değer seçenek listesinden yazılır (B05).
- Tablonun satır sınırı aşılıyorsa söyle.
