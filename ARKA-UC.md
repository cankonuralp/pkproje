# ARKA UÇ KURGUSU — probata (TASLAK, ONAY BEKLİYOR · 2026-10-01)

> Reisim (2026-10-01, birebir): *"Tamam şimdi backend kurgusunu yapalım nasıl siteyi yazarken layzload, gerekli verileri jsona yazıp ordan
> okuma, blob görsel koruma yedekleme raporları arşivleme vb aklıma gelmeyen listelemediğim ne varsa siteyi gez nerde nasıl ni kurgu yapmalıyız
> tasarla ve bana sun en önemli kritik şeylerden bazılarıda çevrimdışı çalışma ve fotoğraftan okuyup sigorta vs yazmak bir de rapor sayfasında pop
> up sohbet tuşu koyup S.A.Y chat diye bir şey yapmayı planlıyorum sadece kanul edilip rapor yazılmay başlayan planlarda olsun … her kullanıcı
> kendi hesabından girip kendi tokenlarını harcayacak aynı şey sigorta topraklama noktası vs yazarken fotoğraftan okuma yapacak sistem içinde
> geçerli ve çevrimdışı çalışmaya gelince çevrimdışı yazılan raporlar çevrimdışı kuyruğunda olacak , çevrimdışı iken ram de kaydolacak çevrimiçi
> olunca gönderilebilecek uygulama olarakta çıkacağız … Aklıma gelmeyen bir şey varsa yardım et."*
>
> **Ne bu belge:** kod yazılmadan önceki arka uç tasarımı. Bağlayıcı olanlar yerinde duruyor ve tekrar edilmiyor: yığın ve kararlar
> `pkproje.md` §8, sunucu ve veri tasarrufu kuralları **`09-SUNUCU-VE-VERI.md` (A1–G5, onaylı)**. Bu belge onları modül modül uygular,
> eksik kalan yerleri (çevrimdışı, yapay zekâ, uygulama mağazası, yedek, işletim) tasarlar ve **senin kararını isteyen yerleri** (§0) ayırır.
> Kod, bütün maketler onaylanınca tek seferde yazılır (§9 otuz altıncı tur); bu belge o kodun haritasıdır.

---

## 0 · Senin kararını isteyenler (önerimle)

| # | Konu | Önerim | Neden |
|---|---|---|---|
| K1 | **Yapay zekâda veri yurt dışına çıkar.** Claude'un çalıştığı yer yalnız "ABD" ya da "küresel" seçilebiliyor; Türkiye / AB seçeneği yok (Anthropic belgesi, `inference_geo`). 09-G3 "veri yurt dışına çıkmaz" diyor. | Yapay zekâ **firma ayarıyla açılır** (başlangıçta kapalı); açan firma yurt dışı aktarımı kabul eder (KVKK: standart sözleşme / açık rıza — hukukçuya teyit). Gönderilen veri **en aza** iner (§5.4). 09-G3'e bu istisna yazılır. | Fotoğraftan okuma ve S.A.Y chat bunsuz yapılamaz; §8.10 pano fotoğrafı için bunu zaten kabul etmişti, chat rapor içeriği (müşteri adı, adres) taşır. |
| K2 | **"Her kullanıcı kendi token'ını harcasın."** Claude.ai abonelikleri (Pro / Max) başka bir uygulamanın içinde kullanılamaz; uygulamalar Anthropic **API anahtarıyla** çalışır ve ayrı ücretlenir. | **Firma kendi API anahtarını** Firma ayarları'na girer (şifreli saklanır, ekranda gösterilmez); harcama firmanın Anthropic hesabından. Biz **kişi başına** kullanımı sayarız, firma kişi başı aylık sınır koyar. İsteyen kullanıcı kendi anahtarını da girebilir (seçenek). | Denetçiye API anahtarı aldırmak sahada zor; firma tek anahtarla yönetir, kişi başı sayaç "herkes kendi harcamasını görür"ü karşılar. |
| K3 | **Model** | S.A.Y chat ve fotoğraftan okuma için başlangıçta **Claude Opus 5.5** ($4 / $20 milyon token); maliyet sorun olursa **Sonnet 5.5** ($2 / $10) — seçim firma ayarı, ölçümle karar. | Fiyat farkı 2 kat; doğruluk farkını kendi örnek fotoğraflarımızla ölçmeden ucuza inmeyiz (§5.5 deneme seti). |
| K4 | **"RAM'e kaydet" yerine cihaz deposu.** RAM uygulama kapanınca, telefon belleği boşaltınca, pil bitince silinir; sahada rapor kaybı demek. | Çevrimdışı yazılan her şey **cihazın kalıcı deposuna** yazılır (tarayıcıda IndexedDB, mağaza uygulamasında SQLite), şifreli. RAM yalnız ekranda açık olanı tutar. | Senin istediğin "çevrimiçi olunca gönder" aynen kalır; yalnız bekleme yeri kalıcı olur. |
| K5 | **Mağaza uygulaması: sarmalayıcı** | Aynı kod **Capacitor** ile iOS / Android uygulaması olur (kamera, dosya, SQLite, arka planda gönderme eklentileriyle); masaüstü tarayıcıda PWA. | iPhone'da PWA'nın arka plan gönderimi yok ve tarayıcı depoyu boşaltabiliyor; saha için uygulama şart. Tek kod tabanı kalır. |
| K6 | **S.A.Y chat ne yapabilir** | **Öneri verir, kendisi yazmaz.** Raporu okur, soruları cevaplar, "şu alanı şöyle doldur" önerisini **onay düğmesiyle** gösterir; denetçi onaylamadan rapora hiçbir şey yazılmaz (sigorta okumadaki §8.10 kuralıyla aynı). | Rapor imzalı resmî belge; sorumluluk denetçide kalmalı. |
| K7 | **probata'nın firmalardan ücret alması (abonelik)** | Ayrı modül olarak tasarlanır (§9.1); şu an hiçbir yerde yok. | Ürünün gelir tarafı; firma açma, dondurma, plan sınırları buna bağlı. |
| K8 | **Kayıp / çalınan cihaz** | Yönetici, kişinin oturumlarını uzaktan kapatır; uygulama bir sonraki bağlantıda cihazdaki çevrimdışı veriyi siler; çevrimdışı oturum en çok **7 gün** geçerli. | Cihazda müşteri ve rapor verisi durur (KVKK). |

---

## 1 · Genel yapı

```
 Tarayıcı (masaüstü, PWA)  ─┐                                   ┌─ PostgreSQL (RLS: firma + müşteri)   — Türkiye
 Mağaza uygulaması (Capacitor)├─ HTTPS ─ Next.js sunucu (Türkiye) ┼─ Dosya deposu (S3 uyumlu, kapalı)   — Türkiye
   · cihaz deposu (IndexedDB /│   · sayfalar (iş mantığı yok)      ├─ pg-boss arka plan işleri (aynı veritabanı)
     SQLite, şifreli)         │   · /api/* modül uçları            ├─ E-posta (Türkiye'deki servis)
   · çıkış kuyruğu            │   · tek erişim katmanı (kiraciIcinde)├─ Mobil imza / e-imza sağlayıcısı
                              │   · tek yetki (canDo)               └─ Yapay zekâ (Claude API) — YURT DIŞI (K1), yalnız firma açarsa
```

- **Sunucu tek, modüler** (§8.11): her modül `src/modules/<modül>/server` içinde kendi tabloları + dışa açtığı işlevler; başka modülün
  tablosuna dokunmaz. Sayfa ve API uçları modül işlevini çağırır, kural taşımaz.
- **İstemci iki biçimde, tek kod**: masaüstünde sunucu tarafı çizilen sayfalar (hızlı açılış); saha ekranları (Planlar, plan içi, saha raporu,
  zimmet, kendi taleplerim) **istemcide çizilir ve çevrimdışı çalışır** — bunlar mağaza uygulamasının da çekirdeği.
- **Tek API sözleşmesi**: istemci ↔ sunucu yalnız JSON uçlarıyla konuşur (sayfalar da aynı uçları kullanır). Sürüm başlığı taşır (§4.7).

## 2 · Veri — nerede durur, nasıl okunur

### 2.1 Kural: firma verisi veritabanında, sabit tanımlar JSON'da
Senin "gerekli verileri JSON'a yazıp oradan okuma" fikrin doğru yerde çok iyi, yanlış yerde tehlikeli. Ayrım:

| Ne | Nerede | Neden |
|---|---|---|
| **Sabit / yavaş değişen tanımlar**: ekipman türleri ve kriterleri, Bakanlık formatlarının yapısı (ZPKR01 …), not metinleri (Not-1…11), il / ilçe, meslek → yetki tablosu, standart adları, rol × modül başlangıcı, form iskeletleri | **Sürümlü JSON dosyaları** (`tanim/<ad>.<karma>.json`), derlemeyle üretilir, sonsuz önbellek (09-B6), çevrimdışı pakete girer | Her açılışta veritabanına sorulmaz; değişince adı (karması) değişir, cihaz yenisini indirir. Firma özelleştirmesi (§3.7) bunun firmaya özel sürümüdür. |
| **Firma verisi**: müşteri, tesis, ekipman, plan, rapor, fotoğraf kaydı, cihaz, zimmet, personel, fatura… | **PostgreSQL** (RLS'li), JSON uçlarından sayfalı okunur | Çok kullanıcılı yazma, yetki, eşzamanlılık (09-D1), denetim izi — dosyada yapılamaz. |
| **Hesaplanan özetler**: yan menü balonları, Ana sayfa sayıları, Performans, gelir-gider | **Özet tablolar**, arka plan işi tazeler (09-B4) | Her açılışta bütün raporları saymamak. |
| **Cihazdaki çalışma kopyası** | IndexedDB / SQLite (§4) | Çevrimdışı. |

Firma verisini sunucuda JSON dosyalarına yazmak **yapılmaz**: iki kişi aynı anda yazınca biri kaybolur, yetki uygulanamaz, yedek / geri dönüş yapılamaz.

### 2.2 Tablolar (modül başına, özet)
Her tabloda `firma_id` + RLS (ENABLE + FORCE), `surum` (09-D1), `olustu / degisti / kim`. Ayrıntı modül yazılırken; burada sınırlar:

- **cekirdek**: firma, firma_ayar (anahtar-değer + şifreli sırlar), kullanici, oturum, rol_yetki, denetim_izi (yalnız ekleme), dosya (anahtar, tür, boyut, özet, bağlı kayıt).
- **musteri**: musteri, tesis, musteri_kullanici, isg_katip_kaydi. · **teklif**: teklif, teklif_kalem. · **sozlesme**: is_sozlesmesi (sürümlü şablon).
- **plan**: plan, plan_ekip, plan_ekipman, plan_not, kontrol_listesi. · **ekipman**: ekipman (kod firma içinde eşsiz — engel), ekipman_kod_gecmisi.
- **rapor**: rapor, rapor_surumu (R1, R2…), rapor_alan (formatlı alanlar JSONB), rapor_kusur, rapor_olcum (nokta, RCD, linye, 6.2, 6.3), rapor_foto,
  rapor_durum_gecis (09-D3), imza_istegi. · **uygunsuzluk**: rapor kusurundan türer, "giderildi" kaydı.
- **varlik**: olcum_cihazi, kalibrasyon, ara_kontrol, zimmet_hareketi, zimmet_formu. · **personel**: personel, ozluk_belgesi, egitim, atama, bordro (G2), izin_talebi, masraf.
- **muhasebe**: is (plan = iş), fatura, tahsilat, gider, sabit_gider. · **dokuman**: standart (sürümlü), egitim_dokumani.
- **yz** (yapay zekâ): yz_kullanim (kişi, tür, token, maliyet), yz_sohbet (yalnız firma saklamayı açtıysa), yz_okuma (fotoğraf → öneri, kabul / ret).
- **eslesme** (çevrimdışı): islem (işlem kimliği, cihaz, gövde özeti, sonuç) — aynı kimlik ikinci kez işlenmez (09-D2).

### 2.3 Geç yükleme (lazyload) — üç katman
1. **Kod**: her modül ayrı parça; sayfa açılınca o modülün kodu iner. Ağır kütüphaneler (PDF önizleme, Excel, ZIP, imza aracı, sohbet penceresi)
   yalnız düğmeye basınca iner (`import()`). Ölçüt: ilk açılış paketinin üst sınırı derlemede denetlenir (kilit).
2. **Veri**: listeler sunucuda sayfalı, yalnız sütunları (09-B3); detay tıklanınca; açılışta yalnız bugünün işi (09-B7).
3. **Görsel**: `<GizliResim>` görünür alana girince indirir (09-A3); liste ekranı fotoğraf indirmez (09-B2).

## 3 · Dosya, fotoğraf, "blob" koruma
09-A1…A5 ve B1 aynen. Uygulama ayrıntıları:
- **Yükleme yolu**: cihazda küçült (1600 px, %75, EXIF sil) → doğrudan depoya kısa ömürlü imzalı yükleme adresiyle (sunucuyu yormaz) → sunucu
  "yükleme bitti" çağrısında türü baytlardan denetler, özeti (SHA-256) yazar, kaydı bağlar. Bağlanmayan yükleme 24 saatte çöpe.
- **Görüntüleme**: yalnız `GET /api/dosya/{id}` (yetki RLS'den) → blob → `blob:` adresi; sayfadan çıkınca serbest bırakılır.
- **İmzalı PDF değişmez** (09-F1); depoda **nesne kilidi** (WORM) açık tutulabilir — öneri, 5 yıl saklama süresince silinemez.
- **Kişisel veri taşıyan dosyalar** (özlük, sağlık raporu, bordro): ayrı önek, her açılış erişim kaydına (09-G2); müşteriye açılan personel
  belgeleri yalnız firmanın izin verdiği türler (P3).

## 4 · Çevrimdışı çalışma ve mağaza uygulaması

### 4.1 Ne çevrimdışı çalışır
| Çalışır | Çalışmaz (bağlantı gelince) |
|---|---|
| Planlar listesi ve plan içi (indirilmiş planlar), plan kabul / red (kuyruğa), rapor oluşturma (plan günü geldiyse — P1), raporu doldurma, fotoğraf çekme, cihaz ekleme (zimmetteki), kusur, ölçüm, not, Kaydet, **Onaya gönder (kuyruğa)**, Kaydet ve kopyala, saha formu, masraf / izin talebi yazma | Son imza (mobil / e-imza sağlayıcıya bağlanır), teknik yönetici onayı, PDF'in kesin üretimi (önizleme cihazda yaklaşık), fotoğraftan okuma ve S.A.Y chat (yapay zekâ — §5), müşteri / teklif / muhasebe ekranları (masaüstü işi) |

### 4.2 Çevrimdışı paket (önceden indirme)
Kullanıcı çevrimiçiyken (ve her açılışta) **kabul ettiği / denetimdeki planların** önümüzdeki 7 günü cihaza iner: plan, tesis, ekipman, önceki
kontrol özeti (hafif kusur devri için), kendi zimmetindeki cihazlar, türlerin tanım JSON'ları, firma künyesi ve rapor formatı. Fotoğraflar inmez.
Ekranda "Çevrimdışı hazır: 3 plan · son eşitleme 08:42" yazar. Plan açılırken "bu plan sahada internet olmayan yerde" işareti varsa paket öne alınır.

### 4.3 Çıkış kuyruğu (outbox) — senin "çevrimdışı kuyruğu"
- Her değişiklik **işlem** olarak cihaz deposuna yazılır: `{işlem kimliği, tür (rapor.kaydet / rapor.gonder / foto.ekle …), kayıt, sürüm, gövde, zaman (cihaz)}`.
  Ekran işlemi hemen uygulanmış gösterir ("gönderilmedi" işaretiyle).
- Bağlantı gelince **sırayla** gönderilir (fotoğraflar küçük parçalar hâlinde, kalınan yerden devam). Sunucu işlem kimliğini tek kez işler (09-D2).
- **Sıra korunur**: "Onaya gönder", o raporun bütün kayıtları ve fotoğrafları gittikten sonra gider. Fotoğrafsız gönderim oluşmaz.
- **Görünür durum**: üst çubukta "2 rapor, 14 fotoğraf gönderilmeyi bekliyor"; düşen işlem kırmızı ve nedeniyle; kullanıcı yeniden dener ya da
  yöneticiye bildirir. Sessiz kayıp yok (anayasa: sessizce yutulan yazma hatası yasak).
- **Mağaza uygulamasında arka planda gönderme**: uygulama kapalıyken de bağlantı gelince kuyruk boşalır (Android'de iş zamanlayıcı, iOS'ta arka
  plan görevi — iOS süre sınırı koyar; kalan, uygulama açılınca gider).

### 4.4 Çakışma
- Rapor sahada **tek kişinin** (o raporu açan denetçi); aynı raporu iki cihazda yazmak nadir → sunucu `surum` farkında işlemi reddeder, cihaz
  "bu rapor başka yerde değiştirildi" penceresinde **iki sürümü yan yana** gösterir, kullanıcı seçer (sessiz ezme yok — 09-D1).
- Teknik yönetici raporu geri gönderdiyse ve denetçi çevrimdışı yazmaya devam ettiyse: gönderimde yeni durum gösterilir, yazılanlar kaybolmaz.
- Kural ihlalleri (plan günü, mesai sınırı, kalibrasyonu geçmiş cihaz, eşsiz kod) **cihazda da** denetlenir, **sunucuda yeniden** denetlenir;
  çelişirse sunucu kazanır ve kullanıcıya nedeniyle gösterilir.

### 4.5 Saat
Cihaz saati değiştirilebilir. Her işlem **cihaz zamanı + sunucunun aldığı zaman** ile kaydedilir; resmî alanlar (rapor tarihi, gönderim) sunucu
saatinden, cihaz saati sunucudan 10 dakikadan fazla saparsa uyarı. Saat dilimi tek: Europe/Istanbul.

### 4.6 Cihazdaki verinin güvenliği
Cihaz deposu şifreli (anahtar giriş anında türetilir, uygulama kilidinde bellekten düşer); çevrimdışı oturum en çok 7 gün; yönetici uzaktan oturumu
kapatınca bir sonraki bağlantıda yerel veri silinir (K8). Telefon kilidi / biyometri ile uygulamaya dönüş (mağaza uygulamasında).

### 4.7 Sürüm uyumu (unutulması kolay)
Mağaza uygulamasının eski sürümü haftalarca kullanılabilir ve kuyruğunda eski biçimde işlem tutar. Bu yüzden: API **sürümlü**; sunucu en az bir
önceki sürümün işlemlerini kabul eder; çok eski uygulama "güncelleyin" der ama **kuyruğunu önce gönderir**, veri kaybettirmez.

## 5 · Yapay zekâ: fotoğraftan okuma ve S.A.Y chat

### 5.1 Ortak çerçeve
- **Sunucu üzerinden** çağrılır (istemci Anthropic'e doğrudan bağlanmaz): anahtar sunucuda şifreli kalır, kullanım sayılır, sınır uygulanır,
  gönderilen veri süzülür. Resmî Anthropic SDK (TypeScript).
- **Hesap**: K2 — firmanın API anahtarı (isteğe bağlı kişisel anahtar). Kişi başı sayaç `yz_kullanim`; firma ayarında kişi başı aylık sınır;
  sınır dolunca "bu ay sınırınız doldu" (engel değil, yönetici artırır).
- **Çevrimdışı çalışmaz**: düğme "Bağlantı gelince" der; fotoğraf kuyrukta bekler, bağlantı gelince okunur, öneri gelince denetçiye bildirim
  çubuğu çıkar (ekranda; ayrı bildirim kurulmaz — anayasa 1.3).
- **"Eğitmek"**: Claude'a ince ayar (fine-tuning) yapılmaz. Uzmanlık şöyle verilir: (1) **sabit uzun talimat** — probata'nın kullanımı, rapor
  kuralları (§3.8), Bakanlık formatlarının alan anlamları, mevzuat özeti, Türkçe üslup; (2) **araçlar** — sohbetin o raporu ve planı okuyabilmesi,
  alan önerisi verebilmesi (§5.3); (3) **bilgi tabanı** — standartlar / Dökümanlar ve firma talimatları sorulduğunda ilgili parçası eklenir.
  Sabit talimat önbelleğe alınır (her mesajda yeniden ücretlenmez, ~%90 ucuz). Kalite **deneme setiyle** ölçülür (§5.5), tahminle değil.

### 5.2 Fotoğraftan okuma (sigorta, topraklama noktası, etiket plakası …)
- Akış: denetçi "Fotoğraftan oku" → fotoğraf (cihazda küçültülmüş) sunucuya → Claude'a **katı JSON şemasıyla** (yapılandırılmış çıktı) gönderilir:
  her satır `{ad, eğri, In, kutup, RCD (In, IΔn), güven: yüksek / orta / düşük, fotoğraftaki yer}` → tabloya **öneri** olarak düşer; düşük güvenli
  satır sarı, denetçi tek tek onaylar (§8.10 aynen). Onaylanmayan kaydedilmez.
- Aynı çatı: ölçüm noktası listesi (topraklama), ekipman etiket plakası (marka / model / seri / imal yılı), kalibrasyon sertifikası (cihaz no, tarih).
  Her biri ayrı şema, ayrı deneme seti.
- Kayıt: `yz_okuma` (fotoğraf, öneri, kabul edilen / düzeltilen) → hangi alanda ne sıklıkla düzeltildiği ölçülür (kalite takibi).

### 5.3 S.A.Y chat
- **Nerede**: yalnız saha raporu sayfasında, **kabul edilmiş ve raporu başlamış planlarda** (senin kuralın); sağ altta yüzen düğme → telefonda tam
  ekran levha, masaüstünde yan pencere. Firma ayarında açılıp kapanır; yalnız yetkisi verilen roller görür.
- **Ne bilir**: o raporun alanları, türün kriterleri ve formatı, ekipmanın önceki kontrol özeti, firmanın yüklediği standart / talimatlar,
  probata kullanım kılavuzu. **Bilmez**: başka müşterinin, başka raporun verisi (araçlar yalnız açık raporu döndürür — RLS sunucuda).
- **Ne yapar**: soruyu cevaplar ("bu kusur ağır mı hafif mi, hangi madde"), eksik alanları söyler, kusur açıklaması / not önerir, ölçüm değerini
  sınıra göre yorumlar. Rapora yazmak için **öneri kartı** gösterir: "Madde 4.3 → Uygun değil, açıklama: … [Uygula] [Vazgeç]" — K6.
- **Ne yapmaz**: imza, gönderme, onay, silme; başka ekrana gitme. Talimatta ve araç listesinde bu yetkiler yok.
- **Kayıt**: sohbet metni varsayılan **saklanmaz** (oturum bitince düşer); firma "saklansın" derse `yz_sohbet`'e, rapora bağlı, denetim için.
- **Güvenlik**: rapor içindeki serbest metin (müşterinin yazdığı not vb.) talimat gibi okunmaz — araç sonuçları "veri" olarak işaretlenir.

### 5.4 Gönderilen veri en aza (K1)
Fotoğrafta konum bilgisi (EXIF) yok; sohbete müşteri unvanı, adres, kişi adı, telefon, SGK / İSG-KATİP numarası **gönderilmez** (maske: "Müşteri A",
"Tesis 1"); ekipman ve teknik değerler gider. Anthropic tarafında veri saklama süresi Anthropic koşullarına bağlı — sözleşme / sıfır saklama
seçeneği firma büyüdükçe Anthropic'le ayrıca görüşülür (karar değil, not).

### 5.5 Ölçerek karar
Model, efor seviyesi ve talimat; **gerçek örnek fotoğraflardan** (reisim'in vereceği, uydurma değil — gerçek veri depoya girmez, yerel klasörde)
50–100 örneklik deneme setiyle ölçülür: satır doğruluğu, kaçırılan sigorta, yanlış değer. Hesap örneği (ölçüm değil): 1600 px fotoğraf ≈ 2.500
giriş token; Opus 5.5'te bir okuma ≈ 1–3 sent, Sonnet 5.5'te yarısı; sohbet mesajı önbellekli talimatla ≈ 1–3 sent. Gerçek sayı ölçümle yazılır.

## 6 · Rapor yaşam döngüsü, PDF, imza, arşiv, yedek
- **Durum makinesi tek yerde** (09-D3): Yeni → onayda → onaylandı (muayene uzmanı imzası) → imzaya gönderildi → Tamamlandı; geri gönder,
  revize, pasif, durum değiştir. Her geçiş denetim izine.
- **PDF sunucuda** (§8.3): firma × tür şablonu kodda; üretim arka plan işi (pg-boss) — ön izleme hızlı, kesin PDF imza öncesi üretilir, özeti
  yazılır; imzalı PDF değişmez (09-F1). Toplu PDF / ZIP / Excel işleri tek dosya (09-B9).
- **İmza**: mobil imza ve e-imza sağlayıcısıyla sunucu ↔ sağlayıcı; tek kullanımlık belirteç, istek süresi (194), sonuç denetim izine (09-F2).
- **Müşteriye açılma**: imza anında; müşteri yalnız son sürümü görür (193); bulut kaydı (Ö2) arka plan işiyle, hata olursa yeniden dener.
- **Arşiv**: 5 yıl sonra firmanın seçimi — sistemde kalır / bulut arşivine taşınır / silinir (09-C1, C2: kopyala → özet karşılaştır → sonra sil).
- **Yedek**: yönetilen PostgreSQL'de günlük tam yedek + **zaman noktasına dönüş** (en az 14 gün); haftalık uygulama düzeyi dışa aktarım (Firma
  ayarları › Verileri dışa aktar'ın sistem kopyası); depoda sürümleme; yedeklerin bir kopyası **başka bir Türkiye veri merkezinde**. **Ayda bir geri
  yükleme denemesi** (deneme ortamına) — yedek, geri yüklenebildiği ölçülmediyse yok sayılır (anayasa 0.6).

## 7 · Arka plan işleri (pg-boss, tek liste)
| İş | Ne zaman |
|---|---|
| Özet tazeleme (balonlar, Ana sayfa, Performans, gelir-gider) | kayıt değişince + saatlik |
| Kalibrasyon / ara kontrol / eğitim uyarıları | günlük |
| İmza isteği süresi (194) | dakikalık |
| PDF üretimi, toplu PDF / ZIP / Excel, dışa aktarım | istekle |
| Bulut kaydı (Ö2), yeniden deneme | imza anında |
| Arşiv / silme (5 yıl, firma seçimi), 30 gün önce liste | günlük |
| Çöp (30 gün), bağlanmamış yüklemeler (24 saat), öksüz dosya raporu (silmez — 09-A5) | gece |
| Yapay zekâ okuma kuyruğu (çevrimdışından gelen fotoğraflar) | bağlantı gelince |
| E-posta gönderimi (parola, davet, ön bilgilendirme) | istekle, yeniden deneme |
| Yedek tazeliği ve duman testi (09-G5) | saatlik |
| İSGGM duyuruları okuma | günde birkaç kez |

## 8 · Güvenlik ve KVKK (09'a ek)
- **İki adımlı giriş** firma yöneticisi ve muhasebe için (öneri; kod e-posta ya da doğrulama uygulaması).
- **Hız sınırı**: giriş, parola sıfırlama, dosya indirme, yapay zekâ uçlarında kişi + IP başına.
- **Sırlar**: API anahtarları, bulut erişimi, imza sağlayıcı bilgileri veritabanında **şifreli** (anahtar ortam değişkeninde), ekranda gösterilmez, loga yazılmaz.
- **KVKK paketi**: aydınlatma metni (firma kullanıcıları + müşteri portalı), yapay zekâ için açık rıza / yurt dışı aktarım (K1), firmalarla **veri
  işleyen sözleşmesi** (biz veri işleyeniz, firma veri sorumlusu), saklama ve imha politikası (09-C), VERBİS gerekliliği (hukukçuya).
- **Denetim izi** her yazmada; yönetici "kim neyi ne zaman değiştirdi"yi görür.

## 9 · Aklına gelmeyenler (listelemediğin ama gerekenler)
1. **probata'nın faturalaması** (K7): firma açma, deneme süresi, plan sınırı (kullanıcı / rapor / depo), ödeme, gecikince salt okunur (09-E6 dondurma).
2. **Yönetim paneli (bizim)**: firma aç / dondur, alt alan adı, firma özelleştirmesi (§3.7) yayını, destek için kayıt görüntüleme (yetkili, izli).
3. **Deneme (staging) ortamı**: yayından önce aynı yapı, uydurma veriyle; yedek geri yükleme denemesi burada.
4. **Hata ve sağlık izleme** Türkiye'de (06, 09-G3): hata kaydı, yavaş sorgu, kuyruk birikmesi, depo dolması — eşik aşılınca bize (firmaya değil) haber.
5. **E-posta altyapısı**: kendi alan adımızdan, SPF / DKIM / DMARC, Türkiye'de servis (09-G4).
6. **Mobil imza / e-imza sağlayıcı sözleşmesi** (firma seçer, biz bağlarız): test hesabı, ücret.
7. **Mağaza hesapları ve inceleme**: Apple / Google geliştirici hesabı, gizlilik beyanı, kamera / konum izin metinleri, uygulama içi hesap silme.
8. **Kamera ve fotoğraf**: uygulama içi kamera (galeriye düşmeden), fotoğrafa kayıt bilgisi (rapor no, tarih) damgası — öneri.
9. **Toplu içe aktarma**: firma ilk açılışta müşteri / tesis / ekipman / cihaz listesini Excel'den yükler (maket Excel içe aktarımları var; sunucu
   tarafında doğrulama, hata satırları raporu, geri alma).
10. **Firmadan ayrılma**: Verileri dışa aktar (S3) + hesabın kapatılması + belirli sürede silme.
11. **Performans ölçümü**: sayfa açılış süresi, API süresi, ilk paket boyutu — derlemede ve yayında ölçülür (03).
12. **Erişilebilirlik ve uçtan uca testler**: Playwright (§2 yığını), ilk ekranlar çıkınca.

## 10 · Modül × arka uç (siteyi gezerek)
| Modül | Veri / tablo | Dosya | Arka plan | Çevrimdışı | Dış servis |
|---|---|---|---|---|---|
| Giriş, Hesabım | kullanici, oturum | — | parola e-postası | oturum 7 gün | e-posta |
| Ana sayfa | özet tablolar | — | özet tazeleme | son özet | İSGGM okuma |
| Planlar + plan içi | plan, plan_ekip, plan_ekipman, not, kontrol listesi | saha formu (imzalı) | — | **evet** | — |
| Saha raporu | rapor*, kusur, ölçüm, foto, durum geçişi | fotoğraf, ön izleme | PDF | **evet** | yapay zekâ (K1) |
| Raporlar · Onaylar | rapor, imza_istegi | imzalı PDF | imza süresi, PDF, bulut | okuma (indirilmiş) | imza sağlayıcı, bulut |
| Uyarılar | kalibrasyon, eğitim | — | günlük uyarı | son liste | — |
| Müşteriler · Teklifler · Sözleşmeler | musteri, tesis, teklif, is_sozlesmesi | sözleşme PDF | e-posta | hayır | e-posta |
| Plan aç | plan + kurallar (İSG-KATİP, yetki, çakışma, sözleşme günü) | — | — | hayır | — |
| Ölçüm cihazları · Zimmetler | olcum_cihazi, kalibrasyon, zimmet_hareketi | sertifika, zimmet formu | uyarı | kendi zimmeti | — |
| Personel · Talepler | personel, ozluk (G2), egitim, atama, bordro, izin, masraf | özlük, bordro | — | kendi talebi | imza |
| Muhasebe · Performans | is, fatura, tahsilat, gider, özet | fatura özeti | özet tazeleme | hayır | — |
| Ekipman türleri · Dökümanlar | tanım JSON + firma özelleştirmesi, standart | format PDF, standart PDF | — | tanımlar pakette | — |
| Firma ayarları | firma_ayar (şifreli sırlar) | logo, ön bilgilendirme formu | dışa aktarım | hayır | bulut bağlama |
| Müşteri paneli | RLS ikinci katman (09-E5) | rapor PDF, personel belgeleri | Excel / ZIP | hayır | — |

## 11 · Yapım sırası (maket onayından sonra)
1. Çekirdek: giriş, oturum, kiracı, yetki, denetim izi, dosya ucu, tanım JSON'ları, API sürümü — kilitleriyle (09).
2. Saha omurgası: Planlar → plan içi → saha raporu → onay → imza → müşteri; **çevrimdışı ilk günden** bu omurgada (sonradan eklenmez).
3. Masaüstü modülleri: müşteri, teklif, sözleşme, plan aç, cihaz, zimmet, personel, muhasebe, performans, ayarlar.
4. Mağaza uygulaması (Capacitor) — saha omurgası çalışırken.
5. Yapay zekâ: önce fotoğraftan okuma (ölçülebilir, öneri), sonra S.A.Y chat.
6. Yayın: Türkiye sunucusu, alan adı, joker SSL, yedek + geri yükleme denemesi, izleme.
