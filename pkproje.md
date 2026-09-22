# pkproje.md — Periyodik Kontrol Uygulaması: alan bilgisi, ürün kurgusu, kararlar

> ⛔ Bu dosya projenin **kalıcı alan bilgisi ve ürün kurgusudur**. `ANAYASA.md` 0.13 gereği her
> oturum başında, anayasa ve tasarım kalıbıyla birlikte TAM okunur. Yerinde düzenlenir (anayasa 12.1), her
> ekleme tarih taşır. Buradaki hiçbir madde reisim onaylamadan **yapılacak iş** değildir; onay durumu her
> bölümde ayrıca yazar. Gerçek müşteri/firma adı bu dosyaya girmez (anayasa 5.8, 10.3).

Oluşturma: 2026-09-18 · Son güncelleme: 2026-09-18

---

## 1 · Reisim'in tarifi (2026-09-17, birebir)

> "periyodik kontrol için anlaşılan firmaya 'planlama sorumlusu' plan oluşturup oradaki ekipmanları ve firma
> bilgilerini girerek planı ilgili personeller için açacak, personeller gidip sahada ilgili denetlemeleri yaparken
> şu yolu izleyecekler, fiziksel muayenelerin haricinde yazılım üzerinde, tablette ilgili plana girdikten sonra,
> ekipman ekle diyerek ilgili ekipmanı ekleyecek (ileriki yıllarda aynı rapor tekrar oluşturulabilsin zaman
> kaybedilmesin diye), ekipmandan rapor oluştur deyip raporu oluşturduktan sonra ilgili checklistleri doldurup
> uygunluk belirleyip fotoğraf ekleyip raporu teknik yöneticisine onaya gönderecek, onaydan gelen raporu e-imza
> ile imzalayacak (e-imza süreci başka bir konu, daha sonra netleştireceğiz; çok yöntem var ama isteğim
> müşterinin nasıl isterse öyle yapması) sonra müşteriye bir id parola verilecek ve girdiğinde kendi raporlarına
> oradan erişebilecek ama sadece kendi raporlarını görüp indirecek … ölçüm cihazı ekleme, kalibrasyon tarihi
> belirleme, kalibrasyon tarihi gelince uyarma, kalibrasyon tarihi geçmiş cihazla rapor yapmaya izin vermeme,
> fotoğraf yükleme zorunluluğu … muayene personellerinin standartlara vs de ulaşabilmesini istiyorum."

Önceki cevaplardan (2026-09-17): çok kullanıcılı · roller var · şirketler (kiracı = periyodik kontrol firması)
var · firmanın müşterileri de giriş yapar · yayın hedefine göre kurulur · her rapor **5 yıl** arşivlenir · yedek,
kontrol firmasının istediği yerde tutulur · **tam kurgu bitmeden tek satır kod yazılmaz.**

Kelime sözlüğü (bu projede): **firma** = bizim müşterimiz olan periyodik kontrol / muayene kuruluşu (kiracı) ·
**müşteri** = firmanın hizmet verdiği işveren/işyeri · **yetkili kişi** = periyodik kontrol yapmaya yetkili
muayene personeli (EKİPNET kayıt numaralı) · **plan** = bir müşteri için açılan kontrol işi.

---

## 2 · Aktörler ve roller (taslak — onay bekliyor)

| Aktör | Nerede çalışır | Ne yapar |
|---|---|---|
| Planlama sorumlusu | Ofis, masaüstü | Müşteri ve ekipman bilgisini girer, plan açar, personel atar |
| Yetkili kişi (muayene personeli) | Saha, tablet/telefon | Plana girer, ekipman ekler, rapor oluşturur, checklist + fotoğraf, onaya gönderir, onaylanan raporu e-imzalar |
| Teknik yönetici | Ofis, masaüstü | Raporu inceler, onaylar ya da gerekçeyle geri gönderir |
| Müşteri kullanıcısı | Portal, her cihaz | Yalnız kendi raporlarını görür ve indirir |
| Firma yöneticisi (varsayım) | Ofis | Kullanıcı/rol, ölçüm cihazı, kalibrasyon, şablon ve firma ayarları |
| Süper yönetici (bizim taraf, varsayım) | Ofis | Firma (kiracı) açar/kapatır, kotalar |

**Reisim kararı (2026-09-22):** bir kişinin birden fazla rolü olabilir (planlama sorumlusu = teknik yönetici
olabilir; hazırlayanın kendi raporunu onaylaması da engellenmez). Roller kişiye küme olarak atanır, ekran
yetkisi rollerin birleşimidir. Müşteri tarafı: hesap **e-posta ile** açılır, müşteri kendi tüm raporlarını görür;
**bir müşterinin birden çok tesisi olabilir** (tesis = ekipmanın bulunduğu yer, rapordaki adres).
Her kiracı firma kendi alt alan adında çalışır ve kendi müşterilerine oradan hitap eder:
`ahmet.<ürün>.com.tr`, `mehmet.<ürün>.com.tr` (reisim örneği; ürün adı ve alan adı sonra). Müşteri portalı da
firmanın alt alan adı altındadır.

---

## 3 · Ana akış ve rapor durumları (taslak — onay bekliyor)

Plan açıldı → sahada ekipman eklendi/seçildi → rapor oluşturuldu (**taslak**) → checklist + ölçümler +
uygunluk + fotoğraf → **onay bekliyor** → teknik yönetici: **onaylandı** / **geri gönderildi** (gerekçe) →
**imzalandı** (e-imza) → **müşteriye açıldı** (portalda görünür) → arşiv.

Kurallar (reisim'in sözünden türeyen, ürün kuralı olarak):
- Kalibrasyon (reisim 2026-09-22): tarihi geçmiş cihazla rapor **oluşturulabilir ama oluştururken uyarır**; bu
  raporu **yönetici onayına göndermek engellenir** (sunucuda da zorlanır, anayasa 7). Kalibrasyon bitişine
  **30 gün** kala uyarı.
- Fotoğraf **zorunlu**: rapor başına **en az 1** (reisim 2026-09-22); onaya gönderirken denetlenir.
- Müşteri yalnız **kendi** raporlarını görür/indirir; başka müşteri, başka firma hiçbir yoldan görünmez.
- Ekipman kaydı **kalıcıdır**; sonraki yıl aynı ekipmandan yeni rapor açılır, önceki rapor geçmiş olarak durur.
- Standart kütüphanesi (reisim 2026-09-22): belgeler **firmanın kendi PDF'leri**; her firma kendi belgelerini
  yükler, yetkili kişi sahada okur. Reisim ayrıca "firmanın PDF formatını yükleyebilmeliyiz" dedi → yorumum:
  firma başına **rapor şablonu/antet** (doküman no · revizyon · yayım · yürürlük künyesi) de firma tarafından
  tanımlanır. Yanlışsa reisim düzeltir.
- Rapor arşivi (reisim 2026-09-22): **5 yıl yeterli, sonra silinecek.** Bu, anayasa 4.12'nin istisnasıdır ve
  reisim'in açık kararıyla doğar; silme mekanizması (önce çöp kutusu + gecikmeli temizlik, geri alınabilir pencere)
  ayrı kalemde önerilecek. Mevzuat işverene "ekipman kullanıldığı sürece" der (4.7); işverenin kendi kopyası
  müşteri portalından indirilmiş PDF'tir.
- Yedek (reisim 2026-09-22): **firmanın bulut sürücüsüne** (standart biçim: veritabanı dökümü + PDF/JSON), otomatik zamanlı.
- Rapor numarası (reisim 2026-09-22): `XX-AAYY-SIRA-rasgele` → ilk iki harf **kiracı firmanın kısa kodu**
  (firma ayarı), sonraki dörtlü **ay+yıl**, sonra sıra numarası, sonra kısa rasgele ek. Reisim örneği:
  `ME-0626-767-224d1`.
- İSG-KATİP sözleşme numarası (reisim 2026-09-22): **zorunlu alan.** Sözleşme sisteme yüklenmeyeceği için
  **tarih aralığı denetimi YOK**; yalnız numara girilir. İleride istenirse sözleşme başlangıç/bitiş tarihleri elle
  girilir ve aralık dışı rapor için uyarı eklenir (ayrı kalem).
- E-imza yöntemi firma seçer (bkz. 8.4); imzasız rapor mevzuatta geçersizdir, ürün de "imzasız yayın" yapmaz.

---

## 4 · Mevzuat bulguları (2026-09-18 araştırması; kaynaklar bölüm 10)

### 4.1 Çerçeve
- **İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği** (RG 25/4/2013, 28628). Son büyük
  değişiklik **23/12/2025, RG 33116**, aynı gün yürürlükte. Bu değişiklikle **Ek-III bütünüyle yenilendi.**
- ⚠️ Yeni Ek-III'ün RG eki taranmış görüntü PDF; bu makinede OCR yok → **yeni Ek-III metnini birebir okuyamadım.**
  Aşağıdaki 1.x maddeleri **2024 sürümünden birebir** (pypdf ile çıkarıldı), 2025 eklemeleri ikincil
  kaynaklardan. Yeni metin edinilince bu bölüm yeniden doğrulanır (açık iş).
- Yalnız **Ek-III tablolarındaki** ekipmanlar periyodik kontrole tabidir; tablo dışı ekipmana rapor yazılırsa
  **şekil ve sözleşme şartı aranmaz** (7/6 ek cümle, 2025).
- Bakanlığın resmi yayın kanalı: **isekipmanlari.csgb.gov.tr** (rapor formatları, kriterler, askıya alınanlar).

### 4.2 Rapor bölümleri (Ek-III 1.7, 2024 metni birebir; ürün şablonunun asgari iskeleti)
1.7.1 Genel bilgiler: işyeri adı, adres, iletişim, kontrol tarihi, **işe başlama ve bitiş saati**, **bir sonraki
periyodik kontrol tarihi**, kontrol metodu · 1.7.1.1 Metot: standart no/adı, yoksa üretici metodu, o da yoksa
risk değerlendirmesi · 1.7.2 Ekipman bilgileri · 1.7.2.1 Etiket bilgileri: ad, marka, model, imal yılı, seri no,
izlenebilirlik · 1.7.2.2 Tespit edilen bilgiler: ölçülen değerler, kullanım yeri ve amacı · 1.7.3 Test değerleri ·
1.7.4 **Ölçüm aletleri**: ad, seri no, **kalibrasyon bilgileri** · 1.7.5 Muayene kriterleri ve testler (sınır
değerle kıyas) · 1.7.6 Kusur açıklamaları · 1.7.7 Notlar (uygunsuzluk buraya yazılamaz) · 1.7.8 Sonuç ve kanaat
(kullanılabilir / giderilene kadar kullanılamaz, açıkça) · 1.7.9 Yetkili kişi: ad soyad, meslek, **EKİPNET kayıt
no**, **nüsha sayısı**, imza. **İmzasız rapor geçersiz.**
2025 ile eklendiği bildirilen alanlar (ikincil kaynak): raporu hazırlayanın Bakanlık kayıt no, işyeri **SGK
sicil no**, **İSG-KATİP sözleşme numarası**, başlangıç/bitiş **tarih ve saati**, rapor tarihi.
1.8 Çok branşlı kontrolde ortak rapor müştereken imzalanır ya da branş başına ayrı rapor.

### 4.3 İmza ve elektronik ortam
- İşveren sonuçları **ıslak imzalı** kayıt altına alır; **5070 sayılı Kanuna uygun güvenli e-imza** ile imzalanıp
  elektronik saklanan kayıtlar da geçerli (7/2-c, 2025 metni birebir).
- Ürün sonucu: nihai belge **PDF**; imza ya 5070 uyumlu e-imza (PAdES) ya da ıslak imza + tarama. Yöntem
  firma seçimi (bölüm 8.4).

### 4.4 Sözleşme ve EKİPNET
- **İSG-KATİP üzerinden sözleşme olmadan rapor düzenlenemez**, düzenlenirse geçersiz; yetkili kişinin yetkisi
  **1 ay** askıya alınır (14/A-8, 2025; önceden 6 ay). Sözleşme, kontrolden **en geç 1 gün önce** karşılıklı
  onaylanmış olmalı (Bakanlık duyurusu). Sözleşme talebini **işveren (müşteri) başlatır, hizmet veren onaylar**;
  azami geçerlilik 6 ay (Riskmatik rehberi; birincil metinde doğrulamadım).
- **EKİPNET** = İSG-KATİP içindeki kayıt/takip modülü (4/d, 2025). EKİPNET kayıt numarası raporda zorunlu
  (17/6/2021'den beri). EKİPNET'e rapor **yükleme** zorunluluğu var mı → **doğrulanamadı** (kullanım kılavuzu
  bulunamadı; e-Devlet girişli). Ürün (reisim 2026-09-22): sözleşme numarası zorunlu, aralık denetimi yok (bkz. 3).

### 4.5 Kusur sınıflandırması ve uygunsuz ekipman
- Bakanlık formatı yayımlanan ekipmanlarda kusur **hafif / ağır**. Hafif → sonraki kontrole kadar giderilir,
  giderilmezse ağır sayılır. Ağır → giderilmeden çalıştırılamaz. Format yayımlanmamış ekipmanda bu derecelendirme
  **yapılmaz** (1.9.1).
- Uygunsuz rapor alan ekipman giderildikten sonra **ikinci kontrol → ikinci rapor** (1.9). Ürün: "yeniden
  kontrol" raporu öncekine bağlı doğar.
- Her kusur raporda **ayrı ayrı** yazılır (14/A-1-d); yapılan muayene/test **fiilen yapıldığı** kayıt altına alınır
  (14/A-1-ç) → checklist maddesi "yapıldı/yapılmadı/uygulanamaz" taşımalı.

### 4.6 Kim kontrol yapabilir
- Yetkili kişi: Bakanlık eğitimi + kayıt (EKİPNET). Ekipman grubuna göre **meslek kısıtı** var (ör. basınçlı
  kaplar: makine/metalürji/mekatronik mühendisi, ilgili teknik öğretmen, makine teknikeri — 2.1.6). Ürün:
  personel **yetkinlik matrisi** (ekipman grubu × kişi); yetkisiz gruba rapor açılamaz (öneri).
- Ekipmanın **bakımını yapan** kişi kontrolünü yapamaz (14/A-2). OSGB'ler periyodik kontrol yapamaz (14/A-3).
- Tahribatsız muayene: TS EN ISO 9712 **en az seviye 2** personel; NDT raporu periyodik kontrol raporunun
  **ekinde** saklanır (1.12, 2.1.3) → rapora ek dosya bağlama.
- Akreditasyon zorunlu ekipmanlar (Ek-2): kule kren, LPG tesisatı, yürüyen merdiven, asılı erişim donanımı +
  **1/1/2027'den itibaren** engelli kaldırma platformu, buhar kazanı, kablolu taşıma tesisatı, sütunlu çalışma
  platformu. TÜRKAK 17020 akrediteleri yeni düzenlemeye kadar "ekipman muayene kuruluşu" sayılır (Geçici 6).

### 4.7 Periyot ve saklama
- Periyot: tablo bazlı, "standartta süre yoksa azami" (çoğu **1 yıl**; yapı iskelesi ve katodik koruma **6 ay**;
  bazı basınçlı kaplarda **10 yıl** sonunda yeniden değerlendirme). Basınçlı kap/kaldırma: hidrostatik/yük testi
  **yılda bir** işletme değeriyle, **3 yılda bir** ya da önemli onarım sonrası test basıncıyla. Ekipmanın imal
  yılındaki standart esas (1.4.1). Ürün: **ekipman türü kataloğu** periyot + standart + meslek kısıtı taşır;
  "sonraki kontrol tarihi" otomatik önerilir, yetkili kişi değiştirebilir (gerekçeyle).
- Saklama: raporlar **iş ekipmanı kullanıldığı sürece** saklanır (1.6); bakım/onarım kayıtları ekipman ömrü boyunca
  (1.3.4). İnternette dolaşan "**en az 10 yıl**" iddiasını yönetmelik metninde **bulamadım** (doğrulanamadı).
  Seyyar ekipman işletme dışına çıkınca **son rapor ekipmanla birlikte** bulunur (7/3) → portalda ekipman başına
  QR/erişim faydalı (öneri).

### 4.8 Bakanlık zorunlu rapor formatları (isekipmanlari.csgb.gov.tr/dokumanlar.aspx)
Zorunlu: ZPKR01 AG topraklama · ZPKR02 elektrik iç tesisat · ZPKR03 yıldırımdan korunma · ZPKR04 yangın algılama
· ZPKR05 transformatör 1-36 kV (hepsi **1/9/2025**) · ZPKR06 kule kren (**1/1/2026**) · ZPKR07 asılı erişim
donanımı (**1/2/2026**) · ZPMR01 LPG tankı muayene · ZYDR01 LPG yeterlilik (**18/7/2025**). Taslak: KR01 ısıtma
kazanı · KR02 mobil kren · KR03 sütunlu platform · KR05 forklift/transpalet · KR07 silindirik kazan · KR09 köprülü
ve portal kren · KR11 hava tankı · YS01 yangın söndürme cihazı. Kural: format yayımlandıysa rapor **"şeklen ve
içerik olarak eksiksiz"** o formatta; akredite kuruluş logosu + ticari ad + **TÜRKAK markası** bulunur.
Ürün sonucu: **şablon motoru** Bakanlık formatlarını birebir üretebilmeli; şablon = kod + sürüm + yürürlük
tarihi; eski tarihli rapor eski sürümle açılır. Formatların PDF'leri indirilip incelenecek (açık iş, onay sonrası).

### 4.9 TS EN ISO/IEC 17020 ve TÜRKAK R50.01 (rehber Ekim 2023, metin okundu)
- Kayıtlar: muayenenin **ne zaman, hangi metot ve dokümanla, hangi öge** üzerinde yapıldığı açık olmalı;
  enspektörün tüm gözlemleri kayıt altında; **acil düzeltici faaliyet** gerektiren bulgu sahada müşteriye bildirilir.
- Personel: **yetkinlik matrisi** (ad, unvan, meslek, öğrenim, tecrübe, yetkilendirildiği alan/alt alan/tür, vekil).
- Ekipman: **kalibrasyon + ara kontrol** (kullanımdaki kontroller) kayıtları; kalibrasyon ≠ doğrulama.
- Rapor formatı 17020 + ILAC P15 + yasal şartlara uygun; **muayenelerin kontrol ve onayı** süreçtir (onay akışı).
- Tarafsızlık (A tipi: dış müşteriye rapor), şikâyet/itiraz kaydı, KVKK.
- R50.01 **saklama yılı vermiyor**; 17020 standart metnine erişemedim → firma başına ayarlanabilir süre (taban 5 yıl).

---

## 5 · Emsal ürünler (herkese açık sayfalardan; 2026-09-18)
Opwire (17020 uyumlu, çevrimdışı mobil, takvim/bildirim, özel şablon, tek tıkla PDF, 5070 e-imza, müşteri
portalı, kalite/doküman yönetimi, faturalama) · Vidco 17020 (iş emri, teklif, mobil + çevrimdışı, **toplu
e-imza**, **QR kodlu rapor**, müşteri portalı, cihaz bakım/kalibrasyon, personel/organizasyon, SMS/e-posta,
ISO 27001) · Akuple (asansör, iOS/Android saha) · ENLAB (kontrol + kalibrasyon + hijyen tek platform).
Ortak çekirdek: **planlama/iş emri → saha (çevrimdışı) → rapor → e-imza → müşteri portalı**, yanında cihaz
kalibrasyonu ve kalite dokümanları. Bizim farkımızı reisim belirler; anayasa 10.1 (yapboz): şema cömert, ekran cimri.

## 6 · Emsal uygulama incelemesi — YEREL DOSYADA
Sahada kullanılan bir muayene uygulaması reisim'in oturumunda incelendi (2026-09-18/22). Çözümleme
**depoya girmez** (reisim 2026-09-22: *"bu incelemeyi github'ta paylaşma"*); `yerel/` klasöründeki inceleme dosyasında
dosyasında durur, `.gitignore` ile depo dışındadır. Oradan çıkan ve bizim kararımıza dönüşen maddeler
bu dosyanın ilgili bölümlerine (akış, veri modeli, rapor şablonu) kendi cümlemizle yazılır.

## 7 · Veri modeli çekirdeği (taslak — onay bekliyor)
Firma (kiracı) · Kullanıcı + rol · Müşteri (işveren; SGK sicil, adres, iletişim) · Tesis/adres (müşterinin birden
çok yeri olabilir — soru) · Ekipman (tür kataloğuna bağlı; etiket bilgileri; müşteri+tesise bağlı; kalıcı) ·
Ekipman türü kataloğu (Ek-III grubu, periyot, standartlar, meslek kısıtı, Bakanlık format kodu) · Plan (müşteri,
tarih aralığı, atanan personel, İSG-KATİP sözleşme no) · Rapor (ekipman + plan + durum + sürümlenmiş şablon +
checklist cevapları + ölçümler + kusurlar + fotoğraflar + kullanılan cihazlar + sonraki kontrol tarihi + imza
kaydı) · Checklist/şablon (sürümlü) · Ölçüm cihazı (seri no, kalibrasyon tarihi, sertifika dosyası, ara kontrol) ·
Standart kütüphanesi (belge + erişim yetkisi) · Dosya (fotoğraf, PDF, NDT eki, kalibrasyon sertifikası) ·
Müşteri kullanıcısı (portal) · Denetim izi (kim, ne zaman, neyi).

## 8 · Teknik kararlar (reisim 2026-09-17: "sen ona göre doğru tercihleri yap" — seçildi, onaya sunuluyor)
1. **Dil/çerçeve:** TypeScript + SvelteKit. Tarayıcı uygulaması; sahada tablet/telefon için **PWA + çevrimdışı
   kuyruk** (fabrika/bodrum; emsallerin hepsi çevrimdışı çalışıyor). Çevrimdışı, riskli iş sınıfı → faz listesinin
   sonunda (anayasa 10.6), ama şema ilk günden buna göre.
2. **Veri:** PostgreSQL + satır seviyesi güvenlik (firma ve müşteri izolasyonu veritabanında) + dosya deposu
   (fotoğraf/PDF). Gerekçe: rapor arşivi ve süzme ilişkisel iş; dışa aktarım standart; güvenlik sunucuda.
   **2026-09-18 revizyon (reisim: "illa bir şey kurmaya gerek var mı? localhost ve yerel depolama"):** Supabase ve
   Docker **kalktı**. Yerelde kurulum yok: PostgreSQL projeyle birlikte gelen gömülü sürümle çalışır (npm paketi,
   ilk `npm install`'da iner, veriler proje klasöründe), dosyalar yerel klasörde, giriş/kimlik bizim kodumuzda.
   Yayında aynı yazılım: yönetilen PostgreSQL + S3 uyumlu dosya deposu; tek yapılandırma dosyası değişir.
3. **Rapor çıktısı:** sunucuda üretilen PDF; şablon sürümlü; Bakanlık formatlarını birebir üretir.
4. **E-imza:** açık karar. Seçenekler: (a) 5070 e-imza, yetkili kişinin token/kartı ile masaüstünde imza (PAdES);
   (b) mobil imza; (c) bulut imza servisi; (d) ıslak imza + tarama. Ürün hepsini "imza yöntemi" olarak tanır,
   firma seçer. Yöntemler reisim'le ayrı kalem.
5. **Test:** Node yerleşik koşucu (`node --test`, Node 24 TypeScript'i doğrudan koşar); tarayıcı uçtan uca için
   sonra Playwright. Kilit/ratchet/olumsuz kanıt disiplini anayasadaki gibi.
6. **Yerel geliştirme:** hiçbir kurulum yok (Node 24 + npm zaten var); `npm install` → `npm run dev` → tarayıcıda
   localhost. Veritabanı ve dosyalar proje klasöründe; Docker/Supabase yok (2026-09-18 kararı, madde 2).
7. Bildirim (kalibrasyon uyarısı, onay bekleyen rapor): mekanizma hazır durur, **açılması reisim kararı** (anayasa 1.3).
8. **Barındırma (2026-09-22, reisim: "projeyi GitHub Pages'te yayınlayıp kontrolleri oradan yaparız"):** GitHub
   Pages yalnız sabit dosya sunar: sunucu, veritabanı, giriş, PDF üretimi orada **çalışmaz**; siteye tek özel alan
   adı bağlanır, kiracı başına `ahmet.<ürün>.com.tr` alt alan adları **desteklenmez**. Karar: Pages = **maket,
   prototip ve önizleme** ortamı (örnek veriyle). Gerçek uygulamanın evi, reisim sitenin tam işleyişini anlattıktan
   sonra seçilir: (a) sunuculu barındırma + PostgreSQL (mevcut yığın; alt alan adları ve sunucu tarafı doğal) ·
   (b) statik ön yüz + bulut veri hizmeti (önceki proje deseni; sunucu yok ama sorgu/alt alan adı kısıtları).
   **Karar (reisim 2026-09-22):** depo **herkese açık** (`github.com/cankonuralp/pkproje`), GitHub Pro yok.
   Sonuç: kaynak kodun tamamı ve buradaki ürün kurgusu kamuya açıktır; sır/anahtar asla koda yazılmaz, gerçek veri
   asla depoya girmez (CLAUDE.md §8 tarama kuralı). Kural dosyaları 2026-09-22'de kök klasöre taşındı ve
   yayımlandı; önceki ürünün alan adı ve gerçek müşteri adı metinden çıkarıldı.

## 9 · Sorular ve reisim'in cevapları (2026-09-22; kararlar 2, 3, 6, 7, 8'e işlendi)
1. Roller → bir kişinin birden fazla rolü olabilir; kendi raporunu onaylama engellenmez.
2. Müşteri → e-posta ile hesap; tüm raporlarını görür; birden çok tesisi olabilir.
3. Kalibrasyon → 30 gün önce uyarı; geçmiş cihazla rapor açılır ama uyarır, onaya gönderilemez.
4. Fotoğraf → rapor başına en az 1.
5. Standartlar → firmanın kendi PDF'leri, firma başına yüklenir; firma PDF formatı (şablon) da firma başına.
6. İSG-KATİP sözleşme no → zorunlu; aralık denetimi yok (sözleşme yüklenmiyor).
7. Rapor no → `XX-AAYY-SIRA-rasgele` (örn. `ME-0626-767-224d1`).
8. Ekipman grupları → henüz karar yok; **önce iskelet** (reisim: "şu an iskelet oluşturmalıyız").
9. Arşiv → 5 yıl yeterli, sonra silinir (anayasa 4.12 istisnası, reisim kararı).
10. Yedek → firmanın bulut sürücüsü.
11. Emsal uygulamanın PDF çıktısını indirme izni verildi; çözümleme yerel dosyada (§6).
12. Tablet → ayrı uygulama değil; aynı web uygulaması, tablete uyarlanmış biçemle.
**Açık kalanlar:** ürün adı ve alan adı · e-imza yöntemi (8.4) · v1 ekipman grupları · 5 yıl sonrası silme
mekanizması · "firma PDF formatı" yorumumun doğrulanması (3).

## 10 · Kaynaklar (2026-09-18)
- ÇSGB duyurusu, 23/12/2025 değişikliği: https://www.csgb.gov.tr/isggm/duyurular/24122025/
- RG 33116 metni (PDF, okundu): https://www.turmob.org.tr/arsiv/mbs/resmigazete/33116-1.pdf ·
  HTML: https://www.resmigazete.gov.tr/eskiler/2025/12/20251223-1.htm · Ek-III eki (taranmış, OKUNAMADI):
  https://www.resmigazete.gov.tr/eskiler/2025/12/20251223-1-1.pdf
- Yönetmelik birleşik metin (2024 sürümü, PDF, okundu): https://yonetimhizmetleri.diyanet.gov.tr/Documents/İş%20Ekipmanlarının%20Kullanımında%20Sağlık%20ve%20Güvenlik%20Şartları%20Yönetmeliği.pdf
- Bakanlık iş ekipmanları portalı ve dokümanlar: https://isekipmanlari.csgb.gov.tr/ · https://isekipmanlari.csgb.gov.tr/dokumanlar.aspx ·
  LPG duyurusu: https://isekipmanlari.csgb.gov.tr/detay.aspx?d=1039 · zorunlu formlar: https://isekipmanlari.csgb.gov.tr/detay.aspx?d=1040
- Karşılaştırmalı analizler: https://tetkik.com.tr/2025/12/25/is-ekipmanlarinin-kullaniminda-saglik-ve-guvenlik-sartlari-yonetmeligi-23-aralik-2025-degisikligi-karsilastirmali-ve-analitik-degerlendirme/ ·
  https://artidanismanlik.com.tr/2025/12/26/is-ekipmanlari-yonetmeligi-2025-degisikligi/ · https://www.alomaliye.com/2025/12/23/is-ekipmanlarinin-kullaniminda-saglik-ve-guvenlik-sartlari-degisiklik-23-12-2025/
- Rapor içeriği rehberleri: https://isgbys.com/blog/is-ekipmanlari-periyodik-kontrol · https://fqcstandard.com.tr/nitelikli-bir-periyodik-kontrol-raporu-nasil-olmali/ ·
  https://www.asisttech.com.tr/asisttech/blog/periyodik-kontrol-muayene-raporlarinda-hangi-bilgiler-yer-almalidir/
- İSG-KATİP sözleşme akışı: https://www.riskmatik.com/blog/periyodik-kontrol-sozlesmesi-isg-katip-rehberi · EKİPNET: https://www.turkiye.gov.tr/acshb-is-ekipmanlari-takip-programi
- TÜRKAK R50.01 (Ekim 2023, PDF okundu): https://www.turkak.org.tr/resimler/ek1-%20r50-01-rehberi-ekim-2023.pdf
- Emsal ürünler: https://opwire.app/iso-17020-periyodik-kontrol-yazilimi/ · https://17020muayene.vidco.com.tr/ · https://akuple.com/asansor-kontrol-yazilimi/ · https://ensyazilim.com/

## 11 · Değişiklik günlüğü
- 2026-09-18: dosya oluşturuldu (reisim'in tarifi, mevzuat araştırması, emsaller, teknik karar taslağı, açık sorular).
- 2026-09-18 (2): emsal uygulama incelendi (yerel dosya); teknik karar 8.2/8.6 revize:
  Docker/Supabase kalktı, yerelde kurulumsuz gömülü PostgreSQL; iki öncelikli yenilik (çevrimdışı, görselden veri) not edildi.
- 2026-09-22: reisim'in 12 cevabı işlendi (bölüm 2, 3, 4.4, 9); emsal PDF çıktısı incelendi (yerel); kiracı alt alan adı,
  rapor no kuralı, 5 yıl sonrası silme, bulut yedek kararları eklendi. CLAUDE.md yazıldı (onay bekliyor).
- 2026-09-22 (2): reisim sırayı değiştirdi: önce git + GitHub + Pages, sonra sitenin tam işleyişi. Yerel depo kuruldu;
  barındırma notu §8.8 (Pages = önizleme; gerçek ev açık karar).
- 2026-09-22 (3): GitHub'a bağlandı (`cankonuralp/pkproje`, herkese açık). `AKTARIM-KITI/` klasörü kaldırıldı,
  dosyalar köke taşındı; önceki ürünün alan adı ve gerçek müşteri adı temizlendi.
- 2026-09-22 (4): reisim iki karar verdi. (a) **Anayasa ve kalıp = site yapma yöntemimizdir**; siteye/ürüne ait
  kararlar oraya yazılmaz → 2026-09-22'de eklediğim anayasa bölüm 14 ve kalıp 20–27 **geri alındı**, iki dosya
  aktarıldığı hâline döndü. Ürün kararları bu dosyada tutulur. (b) Fotoğraf konumu/EXIF gibi şeylere
  **dokunulmayacak**. (c) Emsal uygulama incelemesi **GitHub'da paylaşılmaz** → bölüm 6 `yerel/` klasörüne
  taşındı, depo geçmişi bu içerikten temizlendi. Ana hedef: **müşterimizin işini kolaylaştırmak.**
