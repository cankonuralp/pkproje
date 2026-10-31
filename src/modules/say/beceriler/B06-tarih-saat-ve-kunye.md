---
ad: tarih-saat-ve-kunye
tarif: Planın raporlarına kontrol tarihini, başlangıç-bitiş saatlerini ve sonraki kontrol tarihini çakışmasız dağıtır; SGK/DETSİS gibi künye bilgilerini planda ve raporlarda toplu günceller.
ne_zaman: "Tarihleri … yap", "saatleri 10:00'dan başlat, 10 dakika arayla", "X'i 14:20–15:00 yap", "ikisi de aynı saatte olsun", "SGK/DETSİS … olsun", "firma bilgilerini güncelle" istendiğinde.
---

# B06 · Tarih, saat ve künye

## 1. Tarih ve saat

### Kural sırası

1. **Kullanıcının verdiği her değer aynen uygulanır:** gün, başlangıç saati, aralık, rapora özel saat, "aynı saat olsun".
2. Verilmeyen değerler şöyle tamamlanır:
   - **Gün:** kullanıcının dediği gün; yoksa fotoğrafların / belgelerin S.A.Y'a verildiği gün (bugün).
   - **Başlangıç:** kullanıcı vermediyse Firma ayarları › Mesai başlangıcı (sunucu kendisi alır).
   - **Süre:** türün süresi (`tur_getir` / `plan_hazirlik`). Süre tanımlı değilse 15 dakika (tablolu raporda da; satır başı süre sonra gelecek).
   - **Sıra:** sahadaki gezi sırası (notların sırası); yoksa planın ekipman sırası.
   - **Aralık:** bir raporun bitişi, sonrakinin başlangıcıdır. Kullanıcı "10 dakika arayla" dediyse her rapor 10 dakika sürer ve
     art arda gelir.
3. **Sonraki kontrol tarihi:** kontrol günü + türün periyodu (ay). Kullanıcı başka bir tarih ya da periyot verdiyse onu kullan.

### Uygulama

- `raporlara_yaz` bitişi yazılmamış raporların saatini kendisi planlar (tamamla); ayrıca gerekiyorsa `rapor_saat_plani`. Hesabı sunucu yapar;
  saatleri kendin hesaplayıp yazma. Bitiş saati de yazılır.
- Araç yoksa her raporun `tarih:` yerlerine `rapor_yaz` ile yaz ve sonuçları geri oku.

### Çakışma ve sınırlar

- Saatleri değiştirdikten sonra planın **öteki raporlarıyla** çakışma kaldı mı bak ve söyle.
- Kullanıcı bilerek aynı saati istediyse ("ikisi de 15:00–16:00") çakışmaya izin ver; ama ilk seferde söyle.
- "X, Y ile aynı olsun" komutu saati de kapsıyor gibi görünse ve çakışma doğuracak olsa bile, saati sıradaki boş aralığa koy ve
  söyle. Kullanıcı "saat de aynı" derse aynı yap.
- Mesai dışına (planın günlük çalışma saati) taşıyorsa bildir.
- Kullanıcıya her raporun başlangıç ve bitişini tablo olarak ver. Gruplanabilenleri grupla, ör. "T3–T14: 12:00–14:00, 10'ar
  dakika".

## 2. Künye (SGK / DETSİS, firma adı, adres, İSG-KATİP)

### İlke

Künyenin değeri sana gelmez. Değeri **kullanıcının kendi mesajından** ya da şablon formundan alırsın ve aynen yazarsın: hane hane,
boşluk ve tire olmadan, verildiği gibi.

### Yol

1. Plan künyesini düzenle: `plan_kunye_duzenle` (planlamacı yetkisi). Kunye { sgk, firmaAdi, adres, isg }.
2. Denetçi olarak plandaki taslak raporlara al: `plan_kunye_guncelle`.
3. Rapora özel künye yeri (`k:`) yazılabilir durumdaysa ve kullanıcı yalnız o raporu istediyse oraya yaz.
4. Kullanıcı tesis kartının da güncellenmesini isterse `tesis_kaydet`. İstemezse tesis kartına dokunma; ama bildirimde "tesis
   kartında farklı olabilir" de.
5. Yetki yoksa (planlamacı değilse) yapılamadığını ve kimin yapabileceğini söyle.

### Denetim

- Yazdıktan sonra plandaki taslak raporların künyesinin güncellendiğini `plan_denetle` ile doğrula. Denetim değeri göstermez,
  yalnız "aynı / farklı / boş" der.
- Gönderilmiş raporların künyesi değişmez. Bunlar için B07'deki geri gönderme ya da revize yolunu söyle.

## 3. Sık komutlar

| Komut | Yapılacak |
|---|---|
| "Tarihleri 27.10.2026'ya göre ayarla" | Bütün raporlarda gün 27.10.2026; saatler mevcut sırayla ya da süreye göre; sonraki kontrol bir periyot sonra. |
| "Kapıları 10:00'dan başlayarak 10 dakika arayla gir, saatleri söyle" | Kapı raporları 10:00, 10:10 …; her biri 10 dakika. Saat tablosu. |
| "Pompa 14:20–15:00, tüp ve dolap 15–16" | Pompa aynen. Tüp ve dolap için: "ikisi aynı mı, bölünsün mü?" belirsizse çakışmasız böl ve söyle; "ikisi de aynı" denirse aynı. |
| "SGK … olacak şekilde ayarla" | Plan künyesi → taslak raporlar → doğrulama. |
