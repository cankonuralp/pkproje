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

### Yeni kalıplar (2026-11-05)

| Kullanıcı der ki | Mantık | Probata'da |
|---|---|---|
| Gün söylemedi, plan belli | Kontrol planın gününde yapılır. | Sunucu kendisi yapar: bugün planın günleri içindeyse bugün, değilse planın ilk günü. `gun` verme. |
| "B bloktaki raporlar 15:00–15:45, A bloktaki raporlar 15:15–16:00" | Uzman bir bloğun ekipmanına birlikte bakar; pencere bloğundur, raporun değil. | Her bloğun **bütün** raporları o pencereyi alır: blok başına tek `raporlara_yaz`, ortak girişler `tarih:bas` = "GG.AA.YYYY 15:00", `tarih:bit` = "GG.AA.YYYY 15:45". `plan_denetle` bu raporlar için "saati … ile çakışıyor" der; kullanıcının isteğidir, bildirimde bir kez söyle. "Önce sun" dendiyse bu yorumu sunumda bir cümleyle söyle. Pencere içinde sıralı bölünme istenirse `rapor_saat_plani` (baslangic 15:00, raporlar sure_dk ile). Pencere söylenmeyen raporlar §1'deki gibi art arda gider (her biri türün süresi kadar). |
| "Saatler 09'da başlasın, YTP 30 dk, diğerleri 10 dk" | Uzmanın verdiği süre türün süresinden önce gelir. | `raporlara_yaz` (ya da `rapor_saat_plani`): baslangic "09:00", raporlar saha sırasıyla, YTP'nin `sure_dk` 30, ötekilerin 10. |
| "Süreyi planda bulunan diğer rapora göre ayarla" | İki kontrol aynı ziyarette art arda yapıldı. | Diğer raporun bitişini oku (`rapor_getir` tarih). `rapor_saat_plani`: gun = o raporun günü, baslangic = onun bitişi, süre türün süresi. |

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

### Yeni kalıplar (2026-11-05)

**Mantık:** SGK numarası tesisindir; bir plandaki bütün raporlar aynı künyeyi taşır. Raporun künyesi açılırken plandan kopyalanır; SGK ve
İSG-KATİP raporda kilitlidir. Künyeyi değiştirmenin yolu raporlar değil plandır (yukarıdaki Yol).

- **SGK numarası görselle gelirse** (ekran görüntüsü, fotoğraf): rakamları tek tek oku ve hane sayısını say. Probata'da SGK 26 hanedir. 26 değilse ya
  da okuyamadığın hane varsa en iyi okumanla yaz, şüpheli işaretle ve bildirimde hane sorununu söyle. "Tüm raporlarda" demek plan künyesi demektir: Yol 1–2 (ekranda Plan bilgileri › Düzenle, sonra
  Güncelle).
- **"SGK, adres ve İSG-KATİP'i plandaki diğer rapora göre ayarla":** plandaki raporların künyesi zaten aynı plandan gelir; künyeyi rapordan rapora
  kopyalayan ayrı bir işlem yoktur. Planlamacı plan bilgisini sonradan değiştirdiyse `plan_kunye_guncelle` ile taslak raporlara al. `plan_denetle`
  ile künyenin boş olmadığını doğrula.

## 3. Sık komutlar

| Komut | Yapılacak |
|---|---|
| "Tarihleri 27.10.2026'ya göre ayarla" | Bütün raporlarda gün 27.10.2026; saatler mevcut sırayla ya da süreye göre; sonraki kontrol bir periyot sonra. |
| "Kapıları 10:00'dan başlayarak 10 dakika arayla gir, saatleri söyle" | Kapı raporları 10:00, 10:10 …; her biri 10 dakika. Saat tablosu. |
| "Pompa 14:20–15:00, tüp ve dolap 15–16" | Pompa aynen. Tüp ve dolap ikisi de 15:00–16:00 (aynı pencere; 2026-11-05 onayı, §1 "Yeni kalıplar"). "Bölünsün" denirse pencere içinde sırayla böl. |
| "SGK … olacak şekilde ayarla" | Plan künyesi → taslak raporlar → doğrulama. |
