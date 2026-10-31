---
ad: saha-notlarindan-plan-raporlari
tarif: Saha bilgisinden (yazılı not, fotoğraf, etiket, liste, belge, ekran görüntüsü, sohbet dökümü — hangi biçimde gelirse) bir planın ekipmanlarını eşler, raporlarını açar, doldurur, fotoğraflarını ekler ve kaydeder.
ne_zaman: "Notlara / fotoğraflara / bu belgelere göre raporları hazırla", "plandaki ekipmanları oluştur ve doldur", saha bilgisi ya da çok fotoğraf eklenip planın raporları istendiğinde; benzer her "dağınık bilgiden sisteme işle" işinde.
---

# B01 · Saha bilgisinden plan raporları

Bu, ana iş akışıdır. Kanal fark etmez: bilgi WhatsApp'tan, S.A.Y Chat'ten, PDF'ten, ekran görüntüsünden ya da yazılı bir mesajdan
gelebilir. Yöntem aynıdır:

1. bütünü oku,
2. görüntüye bak,
3. formu oku,
4. sistemle eşle,
5. yap,
6. doğrula,
7. bildir.

Ayrıntılar öteki becerilerdedir:

- B02 malzeme ve fotoğraf tarama,
- B03 etiket okuma,
- B04 ekipman tanıma,
- B05 rapor doldurma (formu insan gibi okuma dahil),
- B06 tarih-saat ve künye,
- B07 denetim ve gönderim.

## Amaç

Uzman sahada bilgiyi dağınık bırakır. Sen, uzmanın gördüğüne sadık kalarak:

- bilgiyi bütün olarak anlar, plandaki her ekipmanı karşılığıyla eşlersin;
- raporlarını açar, formun doğru yerlerine yazar, fotoğraflarını ekler ve kaydedersin;
- sonucu tek bir özetle bildirirsin.

Onaya göndermezsin (B07).

## Girdiler ve öncelik

**Kullanıcının bu konuşmadaki açık sözü > şablon formundaki değerler > notlar ve etiketler (bugünkü durum) > ekipmanın mevcut
kaydı (geçmiş) > boş.**

Hiçbir kaynakta olmayan değer yazılmaz.

## Adımlar

### 1. Kapsam

0. **Hangi plan?**
   - Sayfa notunda açık plan varsa o plandır; arama yapma.
   - Yoksa ve kullanıcı söylemediyse bugünkü kabul edilmiş planlarını listele ve sor.
   - Planı fotoğraflardan tahmin etme.
1. `plan_hazirlik` çağır. Yoksa şunları çağır: `plan_getir`, `tesis_ekipmanlari`, plandaki türler için `tur_getir`, gerekirse
   `rapor_getir`.
   - Bir işlem yetki hatası verirse aynı işi başka girdiyle zorlama (ör. kimlik yerine ad).
   - Elindeki öteki kaynakla sürdür: `plan_getir` plandaki ve tesisteki ekipmanı da verir.
   - Yetki gerçekten gerekiyorsa söyle.
2. Planın durumuna bak:
   - Kabul edilmemişse ya da plan günü gelmemişse rapor açılamaz. Kullanıcıya söyle.
   - Planı kendiliğinden kabul etme; tarafsızlık beyanı kullanıcının onayıdır.
3. Şunları bir arada tut:
   - teklif kalemleri ve adetleri,
   - plandaki ve tesisteki ekipmanlar (kod, tür, konum, kayıtlı bilgiler),
   - açılmış raporlar ve durumları,
   - türlerin form yapısı.

### 2. Bütünü oku (B02)

1. Gelen her şeyi (malzeme listesi: yazılar, fotoğraflar, belgeler, ekran görüntüleri) baştan sona, sırasıyla oku.
2. Fotoğraflara önce birlikte bak (pafta) ve sınıflandır.
3. Her bilgiyi ve fotoğrafı bir nota ve bir ekipmana bağla.
4. Sıra ya da bağ kopuksa içerikten kur ve emin olmadığını not et.

### 3. Envanteri kur

Notta geçen her ekipman için bir satır aç:

| Alan | İçerik |
|---|---|
| tür | B04'e göre |
| not kodu | uzmanın yazdığı ("T3", "Ekp 2", "YD 4", "15") |
| plandaki ekipman | kimlik ve kod; yoksa "yeni" |
| konum | nottan |
| özellikler | nottan ve etiketten (B03) |
| bulgular | nottan, uzmanın sözleriyle |
| genel fotoğraf | rapora girecek tek fotoğraf |
| etiket fotoğrafları | yalnız okumak için |

**Tablolu türler** (yangın söndürme cihazları, yangın dolapları, raflar ve benzerleri) tek ekipman ve tek rapordur. Notlardaki her
tüp, dolap ya da raf bu raporun tablosunda bir satırdır.

Envanteri `is_taslagi_yaz` ile kaydet; araç yoksa konuşmada tablo olarak tut.

### 4. Karşılaştır ve eşle

1. Nottaki kodu plandaki kodla eşle: "T3" ↔ "… Trans 3", "Ekp 1" ↔ "… kapı 1", "F2" ↔ "… Forklift 2".
2. Kod adı farklıysa konumdan ve sıradan eşle ("tır boşaltma rampası" ↔ "Mal kabul 1"). Emin değilsen bildirimde yaz.
3. Say: türe göre notlardaki adet ile tekliftekini karşılaştır. Numaralandırmadaki boşlukları not et.
4. Şunları ayrı listelere koy:
   - planda olup notta olmayan ekipman: rapor açılmaz, "notta yok" listesine girer;
   - notta olup planda olmayan ekipman: plana eklenir (`plan_ekipman_ekle`). Kod uydurulmaz: kullanıcı ya da etiket vermediyse
     sunucunun verdiği kod kullanılır.
5. Mükerrer önleme: raporu olan ekipmana ikinci rapor açma. Kullanıcının kendi açtığı rapor da bu işin parçasıdır; onu da doldur.
6. **Önce sun** istendiyse (şablon kutusu ya da "önce sun" sözü) envanteri ve farkları göster, onay bekle. İstenmediyse sürdür.

### 5. Ekipman bilgileri (B03)

1. Etiketten ve nottan okunanı ekipman alanlarına (`e:` yerleri) yaz.
2. Bugünkü bilgi geçmiş kaydı geçer. Notta karşılığı olmayan alana dokunma.
3. **Makine değişmiş olabilir:** etiketteki marka, model ve seri no kayıttakinden tamamen farklıysa kimlik alanlarını yeniden yaz.
   Eski kayıttan kalan teknik değerleri (kaldırma yüksekliği, çatal boyu …) bildirimde "kontrol edilmeli" diye işaretle.

### 6. Raporları aç

`rapor_ac` ile tek çağrıda bütün ekipman dizisinin raporunu aç. Açılamayanları nedenleriyle not et.

### 7. Doldur (B05)

Önce formun yapısını çöz (B05 §0b): hangi başlık, hangi grup, hangi tablo hangi parçaya ait. Bilgiyi ait olduğu başlığın altına yaz;
emin değilsen formun görüntüsüne bak.

Sırası şöyledir:

1. tablolar,
2. maddeler (varsayılan uygun; bulgu varsa B05),
3. sonuç ve yorum,
4. tarih ve saat (B06),
5. künye (B06),
6. fotoğraf (`rapor_foto_ekle`, her rapora bir genel fotoğraf).

Açık olmayan rapora `rapor_yaz` (aynı girişler çok rapora gidiyorsa `raporlara_yaz`) ile yaz. Ekranda açık rapora `rapora_yaz` ile
yaz.

### 8. Doğrula (B07)

1. `plan_denetle` çağır; yoksa her raporu `rapor_getir` ile geri oku.
2. Sorunu düzelt ve yeniden denetle.

### 9. Bildir

Bildirim şu bölümlerden oluşur:

1. Tek cümle: kaç rapor hazırlandı, kaydedildi mi, gönderildi mi (hayır).
2. Rapor tablosu: ekipman · saat · sonuç · not. Sıradan bir raporun notu boş kalır.
3. Varsayımlar: kendi yorumunla doldurduğun her şey. Örnekler: tipi yazılmamış bir tüpün fotoğraftan anlaşılan tipi; bulgunun
   sonuç seviyesi.
4. Farklar:
   - teklif ile notlar arasındaki adet farkları,
   - notta olmayan ekipmanlar,
   - okunamayan etiketler,
   - kontrol edilmesi gereken eski değerler.
5. Karar gereken noktalar: en çok birkaç madde, her biri tek cümle.

Teknik iç ayrıntı (kimlik, işlem adı, JSON) yazma.

## Sık kullanıcı düzeltmeleri ve karşılıkları

| Kullanıcı der ki | Yapacağın |
|---|---|
| "X ve Y, Z ile aynı olsun" | Z'nin maddeleri, tabloları, sonuç ve yorumu, ekipman özellikleri (konum hariç), tarih günü ve künyesi X ve Y'ye kopyalanır. Saat çakışacaksa sıradaki boş saate koy ve söyle. Konum her ekipmanın kendi kaydında kalır; "konum da aynı" denirse kopyala. |
| "Fotoğraf olarak şunu kullan" | Verilen görseli belirtilen raporlara ekle. Görsel boş ya da siyahsa ekle ama bildirimde söyle. |
| "Sadece ekipman fotoğrafı olsun, fazlaları sil" | Her raporda yalnız genel görünüş fotoğrafı kalır, ötekileri kaldır. |
| "Sonucu uygun değil yap, şunu yaz; aynısını şuna da" | B05: sonuç ve yorum. Aynı değerler öteki rapora da. |
| "Saatleri şundan başlat, şu arayla" | B06: `rapor_saat_plani`. |
| "SGK şu olsun" | B06: künye. |

## Yapılmayacaklar

- Notta ya da etikette olmayan ölçüm, test sonucu, seri no ya da kapasite uydurmak.
- Geçen yılın sonucunu bu yılın sonucu gibi yazmak.
- Notta karşılığı olmayan ekipmana rapor açmak.
- Kullanıcının elle doldurduğu alanın üstüne, istemediği hâlde yazmak.
- Planı kabul etmek, onaya göndermek, silmek (kullanıcı istemeden).
