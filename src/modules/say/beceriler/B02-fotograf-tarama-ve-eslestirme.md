---
ad: malzeme-ve-fotograf-tarama
tarif: Gelen malzemeyi (yazı, fotoğraf, belge, ekran görüntüsü, sohbet dökümü — her biçim) sırasıyla okur; fotoğrafları birlikte görüp sınıflandırır, her birini bir nota ve bir ekipmana bağlar, rapora girecek fotoğrafı seçer.
ne_zaman: Birden çok dosya, fotoğraf ya da dağınık not geldiğinde; "fotoğrafları eşleştir", "her kapıya kendi fotoğrafını koy", "hangi fotoğraf hangi ekipman" istendiğinde.
---

# B02 · Malzeme ve fotoğraf tarama

## İlke

Malzeme hangi biçimde gelirse gelsin, her fotoğrafın bir **sınıfı**, ait olduğu bir **not** ve bir **ekipmanı** vardır. Üçünü de bulmadan fotoğrafı kullanma. Tahmin ettiğin
bağlantıyı kesin gibi yazma; bildirimde "eşleştirmeden emin değilim" de.

## 1. Bütünü oku, sırayı kur

- Malzeme listesini (M01, M02 … zaman, ad, yazı, [F..]) baştan sona oku. Ortadan başlama, atlama.
- Sıra kaynağın kendisinden gelir (sohbet sırası, sayfa sırası). Yoksa çekim saatine (EXIF ya da dosya adındaki tarih-saat — WhatsApp, telefon), o da yoksa
  eklenme sırasına göre kur.
- **Önce say, sonra aç.** Malzeme özetinde fotoğrafların ön okuması (sınıf sayıları) ve çekim saatine göre genel görünüş–etiket çiftleri gelir. Ekipman sayısını
  bunlardan İLK TURDA kesinleştir, sonra hepsini tek `plan_ekipmanlar_ekle` ile saha (çekim) sırasıyla ekle. Sonradan "bir tane daha" eklemek kusurdur.
- Dosya adı ve altyazı bilgi taşır ("komp.jpeg", "T4 etiket"); kullan.
- Notlar ayrı bir yazı olarak geldiyse satır satır al; fotoğraflarla sırayı ve sayıları eşle.
- Ekran görüntüsü ya da PDF içindeki notları da aynı biçimde oku: önce yapısını (kim, ne zaman, hangi satır) çöz, sonra içeriği.
- Bağ kopuksa (fotoğraflar tek tek, notlar ayrı) bağlantıyı içerikten kur ve emin olmadığını not et.

## 2. Paftalarla bak

- `foto_pafta` ile bütün fotoğrafları 8–12'li paftalarda gör. Her karoda numara vardır.
- Paftada her fotoğrafa bir **sınıf** ver:

| Sınıf | Ne görünür | Ne için |
|---|---|---|
| E · genel görünüş | Ekipmanın kendisi, büyük kısmı ya da tamamı | Rapor fotoğrafı; tür ve durum |
| T · etiket / plaka | Yazılı tablo, CE işareti, marka logosu, seri no | Ekipman bilgisi (B03) |
| L · levha | Kapasite levhası, güvenli yükleme levhası, uyarı | Tablo ve özellik (B03) |
| Y · yük diyagramı | Kapasite–yükseklik çizelgesi | Kapasite bilgisi |
| S · liste / belge | Ekran görüntüsü, ekipman listesi, eski rapor | Eşleştirme ve sayım |
| K · kusur yakın planı | Hasar, eksik parça, sızıntı | Bulgu |
| D · diğer | Alan, koridor, ilgisiz | Gerekirse bağlam |

- Paftada ayırt edemediğin fotoğrafı `foto_goster` ile tam boy aç.

## 3. Fotoğrafı nota bağla

Şu sırayla:

1. Fotoğrafın **kendi altyazısı**.
2. Altyazı yoksa **hemen sonraki** kısa yazı. Uzman çoğu zaman önce çeker, sonra yazar.
3. O da yoksa **hemen önceki** yazı.
4. Hiçbiri yoksa **içeriği** (B04) ve **komşuları**: önceki ve sonraki fotoğraf aynı ekipmanın genel görünüşü ya da etiketi mi?

Özel durumlar:

- **Aynı kod art arda:** "T4" (E) ardından "T4" (T): biri genel görünüş, öteki etikettir. Sınıfa bakarak ayır.
- **Bir yazı, birden çok fotoğraf:** yazıdan önceki altyazısız fotoğraflar o yazının ekipmanına aittir. Ancak araya başka kodlu
  not girmemiş olmalıdır.
- **Liste notu:** "9 giriş yanı kkt ⏎ 10 rampa yanı kkt ⏎ …" gibi çok satırlı yazı fotoğraf taşımaz. Envantere satır satır
  girer.
- **Yer tutucu:** kullanıcı bir ekipman için fotoğraf yerine bir görsel verdiyse ("bunu kullan") onu kullan.

## 4. Fotoğrafı ekipmana bağla

1. Notun kodu plandaki ekipmana eşlenir (B01 adım 4).
2. **Etiket fotoğrafı:** hemen önceki ya da sonraki genel fotoğrafın ekipmanına aittir.
3. **Liste fotoğrafından eşleştirme:** uzman bir lokasyon listesinin ekran görüntüsünü verdiyse:
   - Listedeki kodları ve konumları oku.
   - Fotoğraflardaki etiket, kod ya da plaka ile eşle.
   - Konum yazımı yarıda kalmışsa (ör. "sevkiyat" bir yerden sonra yazılmamış) sıradan ve komşulardan tamamla.
   - Tamamladığın yerleri bildirimde söyle.
4. **Tutarlılık denetimi** — her eşleşmede şunlara bak:
   - Fotoğraftaki ekipman o türde mi? "T7" bir transpalet mi?
   - Etiketteki tanım türle uyuşuyor mu? ("Manuel Transpalet")
   - Genel fotoğrafla etiket fotoğrafı aynı makine gibi mi? (renk, gövde, çıkartmalar)
   - Uymuyorsa eşleşmeyi kullanma ve bildir.

## 5. Rapor fotoğrafını seç

- Her ekipmana **tek** fotoğraf: **E sınıfı**, ekipmanı en net ve en bütün gösteren.
- Etiket (T), levha (L), yük diyagramı (Y), liste (S) rapora **girmez**.
- Kusur yakın planı (K), yalnız kullanıcı isterse girer.
- **Tablolu raporlar** (tüp, dolap, raf): temsilî tek bir genel fotoğraf girer (bir tüp, bir dolap ya da raf koridoru).
- E fotoğrafı yoksa rapora fotoğraf ekleme. Bildirimde "fotoğrafı yok" listesine yaz.
- Fotoğrafı eklemeden önce raporda fotoğraf var mı bak. Kullanıcının eklediğini koru; aynı fotoğrafı ikinci kez ekleme.

## 6. Çıktı: fotoğraf envanteri

İş taslağına ya da konuşmaya şu tabloyu kur:

| Foto | Sınıf | Not | Ekipman | Rapor fotoğrafı mı | Okunan / not |
|---|---|---|---|---|---|
| F01 | E | #01 | Kapı 1 | evet | — |
| F05 | T | #05 | Forklift 1 | hayır | marka, model, seri, yıl, kapasite |

Sonunda say:

- kaç fotoğraf,
- kaçı rapora girdi,
- kaçı yalnız okundu,
- kaçı eşleşmedi.

## Yapılmayacaklar

- Fotoğrafı içeriğine bakmadan yalnız sırasına göre eşleştirmek.
- Etiket fotoğrafını rapor fotoğrafı yapmak.
- Bir ekipmana birden çok fotoğraf koymak (kullanıcı istemedikçe).
- Eşleşmeyen fotoğrafı "en yakın" ekipmana zorla bağlamak.
