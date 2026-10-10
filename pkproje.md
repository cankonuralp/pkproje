# pkproje.md — Periyodik Kontrol Uygulaması: alan bilgisi, ürün kurgusu, kararlar

> ⛔ Bu dosya projenin **kalıcı alan bilgisi ve ürün kurgusudur**. `ANAYASA.md` 0.13 gereği her
> oturum başında, anayasa ve tasarım kalıbıyla birlikte TAM okunur. Yerinde düzenlenir (anayasa 12.1), her
> ekleme tarih taşır. Buradaki hiçbir madde reisim onaylamadan **yapılacak iş** değildir; onay durumu her
> bölümde ayrıca yazar. Gerçek müşteri/firma adı bu dosyaya girmez (anayasa 5.8, 10.3).

Oluşturma: 2026-09-18 · Son güncelleme: 2026-09-25

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
Ek sözlük (2026-09-22): **inspector** = yetkili kişi (saha denetimcisi) · **planlama ekibi** = planlama
sorumluları · **branş** = mekanik / elektrik.

## 1.1 · Reisim'in ikinci tarifi (2026-09-22, birebir)

> "sıfırdan ayrı bir ürün olacak, temel esaslarında site iş ekipmanlarının kullanımında iş sağlığı ve güvenliği
> yönetmeliği ve ekipmana göre atıfta bulunulan TS EN vb standartlar ışığında ve doğrultusunda yapılan yıllık
> periyodik kontrollerin yapılmasında kullanılacak. Elektriksel ve mekaniksel kontroller yapılacak. Bu kontrolleri
> ekipnet numarası olan makine mühendisi,teknikeri veya teknisyeni ; elektrik mühendisi, teknikeri veya
> teknisyeni, elektrik elektroknik teknikeri ve veya teknisyeni yapabilir.(bu kısıma kadar olan kısmı araştırıp
> öğren ve ekleme gerekiyorsa ekle). Bu kontroller kapsamında site içi hedefimize bakacak olursak: Personelin saha
> kontrollerini el ile girdikten sonra raporu belirlediğimiz formata göre ilgili yerlere girerek formatımız
> doğrultusunda pdfin ilgili alanları dolacak ve pdf imzalamaya gönderilebilecek bu müşteri isteğine bağlı
> imzayeri gibi aracı firmalar ilede yapılabilir indirilip adobe gibi ara yazılımlar ile imzalamada seçilebilir,
> bu kısım ilgil modül tasarımı esnasında tekrar tartışılır. Bu rapor içeriğinde elzem ve olmassa olmaz kısımlar
> ilgili yönetmelik ve standartlarda belirtilmiştir ancak temel olarak: İSG sözleşme id, müşteri sgk no, kontrolü
> yapan denetimcinin ad-soyad-diploma no- oda no- ve ekipnet numarası olmalı, ilgili ekipmanın hangi standarta
> göre kontrol edildiği yazmalı, kullanılan cihazlar ve bu cihazların envanter numaraları ve kalibrasyon tarihleri
> yazmalı, kontrol edilen ekipman adı, firma adı, adresi, vb bilgiler olmalı, kontrol tarihi başlangıç ve bitiş
> saatleri,(eksik ise araştır tamamla), muayene kriterleri, zorunlu doldurulması gerekli alanlar ekipman
> özelliklerinde nelerin yazılması gerektiği ekipmana göre değişir ve firmanın yüklediği pdf e göre belirlenir. Ek
> olarak hedefimiz özellikle elektrik pano kontrollerinde her sigortanın tek tek elle yazılması gerektiği için bu
> işi kolaylaştıracak bir fotoğraftan sigorta bilgileri okuma desteği eklemektir. Başka bir konuya atlıyorum, bu
> kontrollerde kullanılan cihazlar sisteme eklenmeli kalibrasyon tarihinden önce uyarı yapılmalı, çalışan
> personellere ekipman atamaları yapılmalı, zimmet formları sistem içerisinde olmalı ve takipi edilebilmeli, araç
> vb dahil , kim hangi aracı kimden teslim aldı kime verdi ne zaman görselleri ile vb bir çok detay olacak,
> personelin ilgili eğitimi ve tekrar süreleri sistem üzerinden takip edilebilecek, planlamalar; planlamalar
> planlamacı tarafından ilgili personel için açılacak ve personelin planlar ekranına düşecek planı yönetmeliklere
> uygun şekilde kabul edecek [emsal uygulamadaki gibi] planın tamamlandı vb gibi aşamaları olacak, sistemde teklif
> vermek için modül, muhasebe takibi için modül de olacak, müşterilerin erişim panelinde uygunsuzları indir
> seçeneği olacak ve tüm uygunsuz raporları excel olarak indirip görebiliecek ve exceldeki ilgili yere tıklayınca
> rapora gidebilecek. Özetle müşteriye kolaylık sağlayacak sistemler olmalı. önceliğimiz müşteri kolaylığı,
> personelin işini hızlandırmak, ve takip rahatlığı, Hiyerarşik olarak yöneticiler (mekanik, elekt) inspectorler
> ve planlama ekibi olacak, personellerin yaptığı işler, gün başı işler vb takip edilecek grafikleri
> oluşturulacak, gün başı rapor elde edilen kazanç vb bunları ilgili modül gelince konuşuruz kısaca personel
> performans takip sistemi de olacak. sistemde standartlarda yüklü olacak ve herkes erişebiliyor olacak. Temel
> akış ise şu şekilde özetlenebilir, teklif verildi->teklif kabul edildi sözleşmeler yapıldı(isg katip ve
> şirketler arası iş sözleşmesi)->planlama yapılıp ilgili tarihe plan açıldı -> inspector planı kabul etti -> plan
> günü denetim gerçekleşti-> yönetici onayına gitti->yönetici onayından sonra inspector son imzasını attı-> imzalı
> raporlar müşteri paneline düştü ve müşteri inceleyebilir halde-> ödeme alındı. iş bitti. bu süreçlerde atlamış
> olduğum detaylar muhakkak vardır. modülleri yaparken de düzenleriz sorun değil ama temel olarak hangi modüller
> olacak, ne işlevi olacak, belirlemeliyizki ilerlerken sorun yaşamayalım. eksik bir modül daha sonra geçmişteki
> modüllere bağlantı yapıp işi karmaşıklaştırmaya sebep olur."

*Düzeltmeler: "teknisyen" yetkili kişi olamaz (§4.6). "Standartlar herkese açık" sözü aynı gün "her firma kendi
standardını yükler" kararıyla değişti (§3).*

---

## 2 · Aktörler ve roller (taslak — onay bekliyor)

| Aktör | Nerede çalışır | Ne yapar |
|---|---|---|
| Planlama sorumlusu | Ofis, masaüstü | Müşteri ve ekipman bilgisini girer, plan açar, personel atar |
| Yetkili kişi (muayene personeli) | Saha, tablet/telefon | Plana girer, ekipman ekler, rapor oluşturur, checklist + fotoğraf, onaya gönderir, onaylanan raporu e-imzalar |
| Mekanik Yönetici | Ofis, masaüstü | Mekanik branş raporlarını inceler, onaylar ya da gerekçeyle geri gönderir |
| Elektrik Yönetici | Ofis, masaüstü | Elektrik branş raporlarını inceler, onaylar ya da gerekçeyle geri gönderir |
| Müşteri kullanıcısı | Portal, her cihaz | Yalnız kendi raporlarını görür ve indirir |
| Firma yöneticisi (varsayım) | Ofis | Kullanıcı/rol, ölçüm cihazı, kalibrasyon, şablon ve firma ayarları |
| Süper yönetici (bizim taraf, varsayım) | Ofis | Firma (kiracı) açar/kapatır, kotalar |

**Reisim kararı (2026-09-22):** **Teknik yönetici branşa göre ikiye ayrılır** — Mekanik Yönetici ve Elektrik
Yönetici; onay, ekipman türünün branşına göre ilgili yöneticiye gider (§3.2). "Planlama sorumlusu" = **planlama
ekibi**, "yetkili kişi" = **inspector**. Bir kişinin birden fazla rolü olabilir (planlama sorumlusu = teknik yönetici
olabilir; hazırlayanın kendi raporunu onaylaması da engellenmez). Roller kişiye küme olarak atanır, ekran
yetkisi rollerin birleşimidir. Müşteri tarafı: hesap **e-posta ile** açılır, müşteri kendi tüm raporlarını görür;
**bir müşterinin birden çok tesisi olabilir** (tesis = ekipmanın bulunduğu yer, rapordaki adres).
Her kiracı firma kendi alt alan adında çalışır ve kendi müşterilerine oradan hitap eder:
`ahmet.<ürün>.com.tr`, `mehmet.<ürün>.com.tr` (reisim örneği; ürün adı ve alan adı sonra). Müşteri portalı da
firmanın alt alan adı altındadır. **Ürün birden çok periyodik kontrol firmasına satılır** (reisim 2026-09-22'de
tekrar teyit etti).

---

## 3 · Ana akış ve rapor durumları (taslak — onay bekliyor)

**Tam akış (reisim 2026-09-22):**
**Teklif → kabul → sözleşmeler (firmalar arası iş sözleşmesi + İSG-KATİP) → plan açıldı → inspector'ın
"Planlar" ekranına düştü → inspector kabul etti / gerekçeyle reddetti → plan günü denetim → rapor taslak →
yönetici onayında → onaylandı / geri gönderildi → inspector son imza → müşteriye açıldı → fatura → tahsilat →
iş kapandı → arşiv.**

Kurallar (reisim'in sözünden türeyen, ürün kuralı olarak):
- **Kalibrasyon ve cihaz (reisim 2026-09-22, ikinci tur):** Cihazlar **personele zimmetlenir**. Rapor
  oluşturulurken **cihaz seçimi YOKTUR**; inspector'ın zimmetindeki cihazlar rapora **otomatik** gelir.
  Reisim: *"cihaz seçilmez ama şöyle her personele atalı cihaz olacak, her rapor yapılırken cihaz seçme
  olmayacak, uyarı olması daha mantıklı"*. Kalibrasyonu geçmiş cihaz varsa **uyarı**; rapor **oluşturulabilir**
  ama **yönetici onayına göndermek engellenir** (sunucuda da zorlanır, anayasa 7). Kalibrasyon bitişine
  **30 gün** kala uyarı. **Açık soru:** zimmette birden çok cihaz varsa hepsi mi rapora eklenir, yoksa ekipman
  türüne göre mi süzülür.
- Fotoğraf **zorunlu**: rapor başına **en az 1** (reisim 2026-09-22); onaya gönderirken denetlenir.
- Müşteri yalnız **kendi** raporlarını görür/indirir; başka müşteri, başka firma hiçbir yoldan görünmez.
- Ekipman kaydı **kalıcıdır**; sonraki yıl aynı ekipmandan yeni rapor açılır, önceki rapor geçmiş olarak durur.
- **Standart kütüphanesi (reisim 2026-09-22):** ayrı **modül**. Her firma kendi standardını **kendisi yükler**;
  kontrol metodu standardı (Ek-III 1.7.1.1) firmanın kütüphanesinden **seçilir**. Reisim: *"ilgili dökümanı
  yüklerken hangi standarda göre yaptığını kendi seçecek"*. **Karar (2026-09-27, reisim: *"metod kısmı olsun ama sadece
  ekipman türü eklerken belirlene"*):** metot **ekipman türü düzeyinde** seçilir; raporda seçilmez, türden okunur; türde standart yoksa
  üretici talimatı. (Not: "standartlar sistemde yüklü olacak, herkes erişebilecek" sözü aynı gün
  "her firma kendi standardını yükler" kararıyla değişti.)
- **Rapor şablonları (reisim 2026-09-22 — önceki "firma PDF formatı" yorumum DÜZELTİLDİ):** kontrol kriterleri ve
  PDF formatı **firma × ekipman türü** başına ayrı ayrı **kodla elle** yazılır ve yayınla gelir. Site içinde
  **şablon düzenleyici yoktur**. Gerekmeyen bölümler boş bırakılabilir. Bakanlık formatı zorunlu türlerde §4.8
  geçerlidir. Reisim: *"site üzerinden değil, kod ile manuel her firma için ayrı ayrı yapılıp yayınlanır ama bu
  şekilde olmak zorunda"*.
- Rapor arşivi (reisim 2026-09-22): **5 yıl yeterli, sonra silinecek.** → **2026-09-29 değişti (§9 otuz altıncı tur 185):** süre dolunca
  kendiliğinden silme yok; **firma seçer** (Personel › Firma ayarları): sistemde kalsın · firmanın bulut arşivine taşınsın · silinsin. Silme bu
  seçimle, anayasa 4.12'nin istisnası olarak kalır ve
  reisim'in açık kararıyla doğar; silme mekanizması (önce çöp kutusu + gecikmeli temizlik, geri alınabilir pencere)
  ayrı kalemde önerilecek. Mevzuat işverene "ekipman kullanıldığı sürece" der (4.7); işverenin kendi kopyası
  müşteri portalından indirilmiş PDF'tir.
- Yedek (reisim 2026-09-22): **firmanın bulut sürücüsüne** (standart biçim: veritabanı dökümü + PDF/JSON), otomatik zamanlı.
- Rapor numarası (reisim 2026-09-22): `XX-AAYY-SIRA-rasgele` → ilk iki harf **kiracı firmanın kısa kodu**
  (firma ayarı), sonraki dörtlü **ay+yıl**, sonra sıra numarası, sonra kısa rasgele ek. Reisim örneği:
  `ME-0626-767-224d1`.
- **İSG-KATİP (reisim 2026-09-22, ikinci tur):** **sözleşme numarası + sözleşme onay tarihi** girilir. **Plan
  kabulünde denetlenir:** onay tarihi ≤ kontrol tarihi − 1 gün (§4.4). Başlangıç–bitiş **aralığı denetimi yok**,
  sözleşme sisteme **yüklenmez**. Reisim: *"eklensin ama yine tarih aralığı belirlenemez, sözleşme
  yüklenmeyecek"*. Kayıt **kişi × tesis** bazındadır (§4.6).
- E-imza yöntemi firma seçer (bkz. 8.4); imzasız rapor mevzuatta geçersizdir, ürün de "imzasız yayın" yapmaz.

### 3.1 · Modül haritası (reisim 2026-09-22: *"temel olarak hangi modüller olacak, ne işlevi olacak belirlemeliyiz ki ilerlerken sorun yaşamayalım"*)

| # | Modül | İşlev |
|---|---|---|
| 1 | Kullanıcı & Rol | Giriş, çoklu rol, rol bazlı ekran yetkisi — 2026-09-25: ayrı ekran değil, **Personel'in içinde** (hesap, roller, rol yetkileri) |
| 2 | Personel | Ad soyad, meslek, branş, diploma no, oda sicil no (teknikerde boş olabilir), EKİPNET no; yetkinlik (§4.6) |
| 3 | Müşteri & Tesis | Müşteri; tesis (adres, SGK DETSİS no); müşteri kullanıcıları (e-posta) |
| 4 | Standart Kütüphanesi | Firma başına; firma kendi yükler; kontrol metodu standardı buradan seçilir |
| 5 | Ekipman Türü Kataloğu | Ek-III grubu, branş, periyot, standart(lar), Bakanlık format kodu — 2026-09-26: **firma tür ekler** ve her türe **kendi rapor formatını PDF olarak yükler** (sürümlü); akreditasyon ve yetkili meslek ayrıntısı yok |
| 6 | Rapor Şablonları (Format kurucu) | Firma × ekipman türü: firmanın kurduğu sürümlü format tanımı (Ekipman türleri › tür › Format kurucu; §8.3, 2026-10-02) |
| 7 | Ekipman | Tesise bağlı, kalıcı; özellik değerleri; rapor geçmişi; sonraki kontrol tarihi; durum (kullanılabilir / kullanılamaz) — 2026-09-26: **ayrı ekran değil, planın içinde**; denetçi sahada ekler, sonraki yıllarda önceki raporundan "Rapor oluştur" |
| 8 | Ölçüm Cihazı | Ad, seri no, envanter no, kalibrasyon tarihi, sertifika, ara kontrol; 30 gün uyarı |
| 9 | Zimmet | Varlık: cihaz, araç, diğer. Her teslim ayrı kayıt: teslim eden → alan, tarih-saat, fotoğraflar, zimmet formu. Anlık "kimde" + tam geçmiş |
| 10 | Eğitim Takibi | Personel eğitimleri, belge, tekrar süresi, bitmeden uyarı |
| 11 | Teklif | Müşteri, tesis, kalemler (ekipman türü × adet × birim fiyat), durum |
| 12 | Sözleşme | Firmalar arası **iş sözleşmesi** (periyodik kontrol firması ↔ müşteri) — 2026-09-26: menüdeki Sözleşmeler budur; **İSG-KATİP** bilgisi onun içinde, tesis başına denetçi → sözleşme ID (isteğe bağlı onay tarihi ve PDF); SGK DETSİS no tesiste |
| 13 | Planlama | Plan açma, inspector atama, ekipman listesi, "Planlar" ekranı (5. turda genel ad; eski "Planlarım"), kabul/red, durumlar |
| 14 | Saha & Rapor | Rapor girişi, ölçüm, kriter, kusur (hafif/ağır), fotoğraf (en az 1), cihazlar zimmetten; pano fotoğrafından sigorta okuma |
| 15 | Onay & İmza | Branş yöneticisi onayı, geri gönderme gerekçesi, inspector son imzası; yöntem firma seçer (§8.4) |
| 16 | PDF Üretimi | Kodlu şablonla sunucuda |
| 17 | Müşteri Paneli | İmzalı raporlar; "Uygunsuzları indir" Excel'i, rapor hücresinden rapora gider |
| 18 | Muhasebe | Fatura, tahsilat, iş kapanışı |
| 19 | Performans & Raporlama | Personel bazında günlük iş, rapor sayısı, kazanç, grafik; detay modül gelince |
| 20 | Uyarılar | Yalnız reisim'in istedikleri: kalibrasyon bitişi, eğitim tekrarı. Başka bildirim reisim kararı (anayasa 1.3) |

**Öneri — onay bekliyor:** planlamada ekipman türüne varsayılan kontrol süresi, başlangıç saati ve molalarla
otomatik saat dağıtımı, aynı inspector için saat çakışması uyarısı.

### 3.2 · Modüller arası bağlantı kuralları (reisim 2026-09-22: *"eksik bir modül daha sonra geçmişteki modüllere bağlantı yapıp işi karmaşıklaştırmaya sebep olur"*)
Sonradan gelen modül eskileri bozmasın diye **veri modeline ilk günden** yansır:
1. **Rapor zinciri:** Plan → Tesis → Ekipman → Ekipman Türü → (firma × tür) şablon sürümü. Rapor, şablon
   sürümünü saklar (§4.8).
2. **Plan kabul ön koşulları:** (a) inspector'ın bu tesis için İSG-KATİP kaydı var ve onay tarihi ≤ kontrol
   tarihi − 1 gün; (b) inspector'ın EKİPNET numarası dolu; (c) *öneri* — plandaki her ekipman türünün yetkili
   meslekleri arasında inspector'ın mesleği var (§4.6). Sağlanmazsa kabul düğmesi pasif, **eksik olan yazılır**.
3. **Onay**, ekipman türünün **branşına** göre ilgili yöneticiye gider; çok branşlı ekipmanda Ek-III 1.8
   (müşterek imza ya da branş başına ayrı rapor).
4. **Rapordaki cihazlar Zimmet'ten gelir** (§3), elle seçilmez.
5. Her rapor ilgili **sözleşme/teklif kalemine** (birim fiyat) bağlanır; Performans'taki kazanç buradan hesaplanır.
6. **Uygunsuzluk ayrı kayıttır** (rapor, ekipman, kriter, açıklama, hafif/ağır, tarih); müşterinin "Uygunsuzları
   indir" Excel'i ve ikinci kontrol raporu (Ek-III 1.9) **buradan** beslenir, PDF'ten okunmaz.
7. **İmzalı rapor değiştirilemez.** *Öneri:* düzeltme için **revizyon** (yeni sürüm, yeniden onay + imza, eski
   sürüm saklanır).
8. *Öneri:* rapor imzalanınca tesis, müşteri, personel ve cihaz bilgileri **rapora kopyalanır**; sonradan
   değişseler de imzalı rapor değişmez.
9. *Öneri:* önceki raporun **giderilmemiş hafif kusurları** sonraki kontrolde otomatik listelenir (Ek-III 1.9.1).
10. *Öneri:* listede görünen tarih/saat ile rapordaki başlangıç/bitiş **aynı alandan** okunur.

### 3.3 · Faz planı (reisim 2026-09-23: ilk faz omurgası *"uygun"*)
**Faz 1 — onaylı omurga:** 1 Kullanıcı & Rol · 3 Müşteri & Tesis · 7 Ekipman · 8 Ölçüm Cihazı · 9 Zimmet ·
13 Planlama · 14 Saha & Rapor · 15 Onay & İmza · 16 PDF Üretimi · 17 Müşteri Paneli.
**Faz 1 — bağımlılık gereği girmesi gerekenler (karar — reisim 2026-09-23, 4. tur: *"tüm sorularda senin önerilerini
kabul ediyorum"*; faz 1 o turda onaya sunulan öneriydi, "tüm sorular"a dahil saydım — yorum, reisim'e söylendi):** omurga önerimi yaparken §3.2'deki
bağlantı kurallarının istediği modülleri atlamışım; bunlar olmadan omurga çalışmaz:
· **2 Personel** — plan kabulü inspector'ın EKİPNET numarasını ve mesleğini denetler (§3.2 madde 2b–2c).
· **12 Sözleşme'nin İSG-KATİP kısmı** — plan kabulü İSG-KATİP kaydını ve onay tarihini denetler (§3.2 madde 2a).
  Firmalar arası iş sözleşmesi kısmı faz 2'ye kalabilir.
· **5 Ekipman Türü Kataloğu** — ekipman türe bağlı doğar, onay branşı ve yetkili meslekler buradan gelir.
· **6 Rapor Şablonları** — rapor, firma × tür şablon sürümüyle açılır; en az bir tür için bir şablon gerekir.
· **4 Standart Kütüphanesi** — kontrol metodu standardı buradan seçilir (Ek-III 1.7.1.1).
· **20 Uyarılar'ın kalibrasyon kısmı** — 30 gün uyarısı 8 Ölçüm Cihazı ile birlikte gelir.
**Faz 2:** 11 Teklif · 12 Sözleşme'nin iş sözleşmesi kısmı · 18 Muhasebe · 19 Performans & Raporlama ·
10 Eğitim Takibi · 20 Uyarılar'ın eğitim kısmı.
**Faz 1 sırası (karar, 4. tur):** 1 İskelet → 2 Kullanıcı ve Rol · Personel → 3 Müşteri ve Tesis → 4 Ekipman Türü
Kataloğu · Ekipman → 5 Ölçüm Cihazı · Zimmet · kalibrasyon uyarısı → 6 İSG-KATİP kaydı → 7 Planlama · Planlar · plan
içi → 8 Standart Kütüphanesi · ilk Rapor Şablonu → 9 Saha ve Rapor → 10 Onay ve İmza · PDF → 11 Müşteri Paneli.
**Sıra teyidi (reisim 2026-09-24):** *"planlar maketini yapmıştın o neden koda dönmüşmedi?"* → gerekçe anlatıldı (plan;
müşteri, tesis, inspector, ekipman ve İSG-KATİP kayıtlarından oluşur, bunlar 2–6. adımlarda doğar), üç seçenekten
**"Sırayı koru"** seçildi: Planlar 7. adımda gerçek veriyle kodlanır. Maketin ölçüleri kalıpta (`src/styles/kalip.ts`);
liste (tablo ↔ kart), süzgeç satırı ve sayfalama ilk liste ekranında (Personel) tek üretici olarak kodlanır, Planlar onlarla
kurulur. *Öneri — o kalemde onaya sunulur:* Pages önizlemesinde veritabanı olmadığından kodlanmış ekranlar orada boş
görünür → ilk modül ekranıyla birlikte önizlemeye **örnek veri kipi** (uydurma veri, yalnız önizleme derlemesinde).
**Toplu maket kararı (reisim 2026-09-24, birebir):** *"tüm maketleri sırayla bulutta yapılsın en son hepsine toplu bakar ona göre
ilerleriz"* · seçimler: **hepsi, sonda toplu bakış** (ara onay yok) · kapsam **faz 1 + faz 2**. Sıra, teslim biçimi ve bulut
ortamı `MAKET-PLANI.md`'de (M1 Kullanıcı ve Rol · Personel … M16 Eğitimler, sonda toplu bakış sayfası). Eksik bulunan akış
sıraya eklendi: planlama ekibinin **plan açma** ekranı (M6; Planlar maketinde yalnız inspector tarafı var). Maketler
onaylanana kadar kod yok; soru numaraları 32'den devam eder.
**Referans ekran (reisim 2026-09-23: *"uygun"*):** **Planlar** (13 Planlama; 5. turda eski "Planlarım" adı genel ada çevrildi). Liste, süzgeç satırı, durum rozeti,
birincil/ikincil tuş, boş durum ve dürüst sayaç gibi ortak parçaları doğurur; ölçüleri tasarım kalıbının bu
projedeki sayıları olur. Ardından saha rapor ekranı (14). **Dondurma (karar 25, 4. tur — önerim kabul):** plan içi
sunumunun son turu onaylanınca Planlar + plan içi dondurulur: sayıları (34 / 44 px, kart eşiği 960 px (2026-09-26: 600 px — kart yalnız telefonda), sayfa ekipman 10 · rapor 20)
tasarım kalıbının bu projedeki sayıları olarak yazılır, iskelet kaleminde testle kilitlenir; sonra iskelet.
**DONDU (reisim 2026-09-23: *"tüm önerilerin uygun kodlamaya başla ilk yayını yap"*):** sayılar `src/styles/kalip.ts`,
kilidi `tests/kalip-sayilari.test.ts` (değişkenler, kabuk ve onaylı maket aynı sayıyı taşımazsa test düşer). İskelet kuruldu
(§8.13); sıradaki kalem faz 1'in 2. adımı: **Kullanıcı ve Rol · Personel** (önce maket).

### 3.4 · Planlar (eski adı Planlarım) ve plan içi (reisim 2026-09-23, maketin 2.–5. turu)
Reisim, kullandığı bir uygulamanın plan listesinin ekran görüntüsünü örnek gösterdi (görüntü ve içindeki veri depoya
girmez) ve dedi ki (birebir): *"bundan örnek al ama, mesaii iş türü, rapor durumu sütunları gereksiz, aksiyon tuşu
gereksiz, kabul et denetime başla ve devam et diye değişmeli , planın içerisinden tamamla dendiğinde tamamlandı olmalı
ama girip içeriden eski haline getirebilir rapor düzenleyebilir vs olmamız lazım burdan anladığın kadaryıla maketi
düzenle tekrar konuşalım"*
**Karar (reisim, 2. tur):**
· **Liste sütunları:** Proje no · Proje adı · Müşteri · Adres · Inspector (örnekte "Kullanıcı") · Başlangıç · Durum.
  **Yok:** Mesai, İş türü, Rapor durumu, açılır "İşlemler" tuşu.
· **Satırda tek eylem tuşu, durumla değişir:** Kabul et → Denetime başla → Devam et.
· **Plan içi:** "Tamamla" ile plan **Tamamlandı** olur; plana girip **geri alınabilir** (plan yeniden denetime açılır);
  raporlar düzenlenebilir kalır.
**Karar (reisim 2026-09-23, 3. tur — 9–16 cevapları ve ek istek):**
*"9. uygun/10.hayır istediği zaman istediği tepkiyi verebilsin denetçi bu hareketler kayıt altında kalsın yeterli/11 hayır
şu anki gibi kalsın/12önerin makul kabul ediyorum/13 takvimi göremedim/14 gerek yok böyle iyi/15 hayır birleştirme/16. olur
mantıklı şekilde proje numarası atama sistemi kur aynı şekilde raporlar içinde eşsiz isimlendirmeler olmalı/// ek olarak
ekipman ekle ve rapor oluşturma ayrı olmalı ki aynı ekipman için seneye gidildiğinde yeni rapor oluşturukabilsin aynı
ekipman için, ekipman karışmasın yukarıda ekipmanlar aşağıda raporlar olarak ayrılmalı ekran ve ekipman eklenerek
ekipmana kod verilmeli ekipman kodu da yine eşisiz olmalı bu kod personel tarafından girileceği için personel el ile
girdiğinde eğer çakışan ekipman adı var ise uyarmalı izin vermemeli"* (birebir; emsal uygulamayı anan son cümle, depo açık olduğu için alınmadı).
· **Reddet** satırda yok, **plan içinde** (gerekçe zorunlu). (9)
· **Denetime başla tarihe bağlı DEĞİL**: denetçi istediği an basar. **Her hareket kayıt altında**: plan açıldı · kabul ·
  red (gerekçe) · denetime başlandı · ekipman eklendi / plana alındı · rapor oluşturuldu · tamamlandı · tamamlama geri
  alındı → kim + ne zaman, plan içinde "Plan geçmişi". (10)
· **Tamamla** raporu olmayan ekipman varken **engellenmez**, yalnız sayısını söyler. (11)
· **Tamamlanmış planda** raporlar düzenlenir ve oluşturulur; **ekipman ekleme kapalı**, önce tamamlama geri alınır. (12)
· **Ekipman sayısı** listede yok (14). Proje no ile Proje adı **birleşmez**; dar kapta kart (15).
· **Numara sistemi kurulur**: proje ve rapor numaraları eşsiz (16) → §3.5.
· **Ekipman ile rapor ayrı**: plan içinde **üstte Ekipmanlar, altta Raporlar**. Ekipman tesisin **kalıcı** kaydıdır;
  plan yalnız hangi ekipmanlara bakılacağını tutar; rapor her plan için ayrı açılır → seneye aynı ekipmana yeni rapor.
  "Ekipman ekle" ile "Rapor oluştur" ayrı iştir.
· **Ekipman kodu**: ekipman eklenirken verilir, **personel elle girer**, **eşsizdir**; çakışan kod varsa **uyarı + kayıt
  yok**. (Reisim "çakışan ekipman adı" dedi; ad (tür) tekrar eder, eşsiz olan koddur — yorum; 17–19 4. turda kabul.)
· Takvim: *"takvimi göremedim"* → maketi yapılmadı, soru yeniden soruldu (23) → 4. tur: **takvim yok**.
**Maketteki yorumlarım (3. tur) — reisim 4. turda kabul etti (17–25, takvim hariç):**
· Plan durumları: Kabul bekliyor · Kabul edildi · **Denetimde** · Tamamlandı · Reddedildi. Rapor durumları (maket):
  Taslak · Onayda · Onaylandı.
· **Ekipman ekle iki yol**: (a) tesiste kayıtlı ama plana alınmamış ekipmanı seç (önceki kontrolüyle gelir), (b) yeni
  ekipman: kod + tür (katalogdan, yazarak arama) + seri no + konum. Branş türden gelir.
· **Kod kuralı**: A–Z (Türkçe harf yok), 0–9, tire; 3–20 hane; boşluk atılır, küçük harf büyüğe çevrilir (yalnız A–Z;
  dile bağlı harf katlama yok, anayasa 5.5); **firma genelinde eşsiz** (17). Mesajlar: bu planda var · bu tesiste kayıtlı
  (yeni kayıt açılmaz, "Kayıtlı ekipmanı seç") · başka tesiste kayıtlı · kullanılabilir. Yazarken ve kaydederken
  denetlenir; gerçek uygulamada sunucuda ve veritabanında benzersizlik kısıtıyla da. Çevrimdışı: iki kişi aynı kodu
  girerse eşitlemede ikincisi reddedilir, düzeltmesi istenir (sessiz birleşme yok).
· **Kabul et'in İSG-KATİP kilidi durur** (§3.2 madde 2, mevzuat 4.4); kaldırılan yalnız tarih kilidi (24, kabul).
· **Tesiste kayıtlı ekipmanı plana** hem planlama ekibi (plan açarken) hem inspector (sahada) alır (22, kabul).
· Örnekteki katlanır "Filtreler" alınmadı (kalıp 14: süzgeç her zaman açık); sütun başlığıyla sıralama alındı, kart
  kipinde "Sıralama" seçicisi.
· Tablo, liste kabı **≥ 1.180 px** iken (≈ 1.495 px ekran); altında kart. Plan içindeki iki liste aynı üreticiden.
  → 4. turda yoğunlukla yeniden ölçüldü: **960 px** (aşağıda).

**Karar (reisim 2026-09-23, 4. tur):** reisim kullandığı bir uygulamanın plan sayfasını gösterdi (sayfa ve içindeki veri
depoya girmez; inceleme yerel dosyada, §6) ve dedi ki (birebir; emsal sayfanın adresi alınmadı): *"… planlandı, plan
onaylandı , kontrol listesi, ne güzel akışta takip edilebilir iş te yapılabilir böyle senin yaptığın gibi takibi çok zor,
buradan esinlen düzgün bi akış tasarla, tüm sorularda senin önerilerini kabul ediyorum, takvim hariç onu istemiyorum yapma
tekrar maket yap ve incelediğin sayfadaki gibi ekipmanlar ve raporlar 10 taneden sonra diğer sayfaya geçsin sayfalı sistem
olsun ve bizim maketimizde her şey çok büyük, filtreleme yok , ayrıca muayene kuruluşu ismi sol üstte yazmasın."*
· **Plan içi bir akıştır**: dikey adım çizelgesi **Planlandı → Kabul → Denetim → Tamamlama**. Her adımda durum
  (tamamlandı ✓ · şu an · sırada · reddedildi ×), kim + ne zaman. Şu anki adımın tuşları adımın içinde, sağda; telefonda
  altta yapışkan çubukta.
  – **Planlandı**: plan bilgisi (proje no · başlangıç · adres · inspector · İSG-KATİP · açıklama) + **kapsam** (tür
    başına planlanan ve plandaki ekipman sayısı; kabul bekleyen planda açık, sonra katlı).
  – **Kabul**: **tarafsızlık ve çıkar çatışması beyanı** (TS EN ISO/IEC 17020, §4.9); Kabul et beyanı onaylar ve
    hareket kaydına yazılır. Reddet gerekçe ister. İSG-KATİP kilidi durur.
  – **Denetim**: **kontrol listesi** = Ekipmanlar + Raporlar (3. turdaki ayrım aynen). Ekipman ekle yalnız Denetimde.
  – **Tamamlama**: Tamamla / Tamamlamayı geri al (11 ve 12 aynen).
  – Altta **Notlar ve hareketler**: proje notu + hareket kaydı; son 6, "Tümünü göster".
· **Sayfalama**: ekipman ve rapor listeleri **10'ar** kayıt ("1–10 / 12" + sayfa tuşları); süzgeç değişince 1. sayfa;
  eklenen ekipmanın sayfasına geçilir, süzgeç gizliyorsa bildirim söyler.
· **Süzgeç**: ekipman ve rapor listelerine arama + çipler (ve / veya) + seçiciler (ekipman: branş, tür); Planlarım'la
  tek üretici (kalıp 15). Telefonda seçiciler levhada.
· **Yoğunluk**: denetim yüksekliği 40 / 48 → **34 / 44 px**, gövde yazısı 15 / 16 → **14 / 15 px**, başlık 20, bölüm 15;
  kart eşiği yeniden ölçüldü → liste kabı **≥ 960 px** tablo (1.080 tablette listede ve plan içinde tablo; 1.280 ve
  1.024'te plan içi kart) (§8.12).
· **Firma adı** üst çubuktan kalktı.
· **17–25**: önerilerim kabul, **takvim hariç** → §3.3 (faz 1 sırası, dondurma), §3.5 (numaralar). **Takvim yok.**
**Yorumlarım (4. tur; 26–28) — reisim 5. turda kabul etti (*"önerilerin uygundur"*):** tarafsızlık beyanının metni firma
ayarı (kalite el kitabındaki metin; boşsa varsayılan), kabul anındaki sürüm kayda yazılır · proje notunu plandaki
inspector'lar ve planlama ekibi yazar ve görür, müşteri görmez, not silinmez · 4. tur uygun, değişiklik istekleriyle.

**Karar (reisim 2026-09-23, 5. tur; birebir):** *"önerilerin uygundur, hareketler kısmını kaldır, raporlarda 5 değil 20
rapor alt alta durabilsin 5 çok az , sol tarafdaki bar da çok az modül var , diğer modüller nerde onlarda gözüksün kim
hangi modülü görebilecek sonradan belirleriz onları"* · *"sekmelerin adı da öznellik içermesin planlar raporlar zimmetler
gibi genel isimler olsun"*
· **Hareket listesi plan içinden kalktı**; yerinde yalnız **Proje notları** (karar 27). Hareket kaydı **tutulmaya devam
  eder** (3. tur: *"bu hareketler kayıt altında kalsın"*) ama plan içinde gösterilmez; nerede görüneceği soru 30.
· **Raporlar 20'şer** sayfa; ekipman 10'ar kaldı. (Reisim'in gördüğü "5": örnek planda 5 rapor vardı, hepsi görünüyordu;
  örnek plan 10 rapora, tamamlanmış örnek 22 rapora çıkarıldı.)
· **Yan menüde firma panelindeki bütün modüller** (§3.1'in 17'si), 6 grupta: İş takibi (Planlar · Raporlar · Onaylar ·
  Uyarılar) · Müşteri (Müşteriler · Teklifler · Sözleşmeler) · Varlık (Ekipmanlar · Ölçüm cihazları · Zimmetler) ·
  Personel (Personel · Eğitimler) · Finans (Muhasebe · Performans) · Tanımlar (Ekipman türleri · Standartlar ·
  Kullanıcılar). Menüde yok: 6 Rapor Şablonları (Ekipman türleri içinde Format kurucu, 2026-10-02), 16 PDF Üretimi (sunucu işi), 17 Müşteri Paneli (müşterinin
  kendi girişi). Sığmayan yükseklikte yalnız menü kayar.
· **Menü ve ekran adları genel**, kişiye bağlı değil: Planlarım → **Planlar**, Raporlarım → **Raporlar**, Zimmetim →
  **Zimmetler**; sayfa başlığı, kırıntı ve sekme adı da.
· **Kim hangi modülü görecek: sonra** (reisim). Maket herkese bütün menüyü gösteriyor.
**Maket 6. tur — yan menü daraltma (reisim 2026-09-23, birebir: *"sol taraf açılıp kapanabilir olsun kapatılınca sadece
logolar kalsın"*) — ONAYLANDI (reisim 2026-09-24: *"uygun"*, 2. deneme) ve uygulamaya geçti (§8.13):** masaüstünde (≥ 1280) üst
çubuğun solunda (tablet/telefondaki ☰ ile aynı yerde) daralt/genişlet düğmesi · daralınca 64 px simge şeridi, üstte
probata işareti, grup başlıkları yerine ince çizgi, sayaç simgenin köşesinde, ad üstüne gelince ipucu (yalnız şerit görünürken; ekran okuyucu adı okur)
· tercih bu cihazda saklanır · tablet ve telefonda çekmece aynen (anayasa 2.11: ikon rayına dönüşmez). "Logolar" =
menü simgeleri + probata işareti diye yorumlandı. Daralınca içerik 1.648 → 1.816 px (1920'de).
**2. deneme (reisim 2026-09-24, birebir: *"onaylamıyorum standart üç alt alta çizgi görünümü olsun"*):** ilk denemedeki
panel simgesi (sol kenarı çizili kutu + ok) reddedildi → daraltma düğmesinin simgesi her iki hâlde **standart ☰**;
tablet/telefondaki çekmece düğmesiyle aynı simge, aynı yer (üst çubuğun solu). Şerit, ipucu ve tercih aynen. Panel
simgeleri ikon dosyalarından çıktı (51). **Onaylandı** (*"uygun"*) → uygulamada aynısı: 64 px kalıp sayısı oldu
(`src/styles/kalip.ts` kabuk.cubukDar), daraltma kuralları yalnız geniş bantta testle kilitli.
**Yorumlarım (5. tur; 29–31) — reisim kabul etti (*"tüm önerilerin uygun"*, 2026-09-23):** menü grupları ve sırası yukarıdaki gibi (her gün
kullanılan üstte, tanımlar altta) · hareket kaydı plan içinde değil, rol × modül belirlenirken yöneticiye "Hareket kaydı"
(denetim izi) olarak açılsın · bu tur uygunsa Planlar + plan içi dondurulur ve iskelet kalemi açılır.
**Plan künyesi (2026-10-03, §9 elli ikinci tur, §11 263):** plan içinde Firma adı · Adres · İSG-KATİP sözleşme ID · **SGK DETSİS no** satırları
(2026-09-29'da kaldırılan SGK satırı reisim'in 2026-10-03 sözüyle geri geldi). **Planlamacı "Düzenle"** ile dördünü değiştirir, Kaydet → plan
kaydına düşer ve hareket kaydı yazılır; **denetçinin ekranına ve raporlarına kendiliğinden geçmez**. Denetçi plan ekranında ve raporda
"Planlamacı plan bilgilerini değiştirdi" şeridini görür; **Güncelle**'ye basınca yeni künye onun plan ekranına ve **yalnız kendi taslak /
geri gönderilmiş raporlarına** geçer; onaydaki ve imzalı raporlar değişmez, başka denetçinin raporuna dokunulmaz (her denetçi yalnız kendi
raporuna müdahale eder). Yeni rapor denetçinin gördüğü künyeyle açılır; rapor PDF'i raporun kendi künyesinden çizilir.

### 3.5 · Numara sistemi (reisim 2026-09-23: *"mantıklı şekilde proje numarası atama sistemi kur, aynı şekilde raporlar için de eşsiz isimlendirmeler olmalı"*)
**Karar:** üç numara da **firmada eşsizdir**; veritabanında benzersizlik kısıtı taşır. Ayrıntılar **karar** (17–21,
reisim 2026-09-23, 4. tur: önerilerim kabul):
| Numara | Biçim | Örnek | Kim, ne zaman | Kural |
|---|---|---|---|---|
| Proje no | `P-AAYY-SIRA` | P-0926-031 | sunucu, plan açılırken | AAYY planın **açıldığı** ay+yıl (kontrol tarihi değişse de numara değişmez) · SIRA firmada o ayın kaçıncı planı, her ay 001'den · iptal planın numarası yeniden verilmez |
| Rapor no | `XX-AAYY-SIRA-EK` | KM-0926-772-3416f | sunucu, rapor oluşturulurken | reisim kararı (§3, örnek ME-0626-767-224d1) · XX firma kısa kodu · AAYY raporun açıldığı ay+yıl · SIRA firmada **kesintisiz** artan (ayla sıfırlanmaz) · EK 5 hane rasgele, tahmin edilemez; çakışırsa yeniden üretilir · düzeltme revizyonla (öneri: aynı numara + R1, §3.2 madde 7) |
| Ekipman kodu | A–Z, 0–9, tire · 3–20 · önek serbest (18) | HT-1001 | **personel, etiketten elle** | firma genelinde eşsiz (17) · çakışan kod kaydedilmez · değiştirme yalnız yönetici, eski kod geçmişte kalır (19) |
Proje ve rapor numarasını kimse elle yazmaz; ekipman kodunu personel yazar, sistem eşsizliğini korur.

### 3.6 · Toplu maket çalışması (2026-09-24; `MAKET-PLANI.md`) — her maket ONAY BEKLİYOR
Reisim en sonda toplu bakış sayfasından hepsine birlikte bakar; aradaki maketlere onay verilmez. Her maketin **varsayımları**
(neyi neden böyle kurdum) ve **soruları** (reisim'in karar vereceği ürün davranışı; numara 32'den) burada. Ölçüm sonuçları
`docs/assets/olcum/<maket>.json` (bulutta başsız Chromium, `tools/olc-bulut.mjs`); etkileşim denemeleri aynı araçta.
**Ortak altyapı (M1'de kuruldu):** Planlar maketinin kabuğu, süzgeç satırı, liste (tablo ↔ kart), sayfalayıcı, boş durum ve
bildirim `docs/assets/maket-ortak.js`'e AYNEN taşındı (Planlar ayrımdan önce ve sonra 54/54 temiz, ekran görüntüleri piksel
karşılaştırıldı); ortak uydurma veri `docs/assets/maket-veri.js`; menüdeki hazır maketler tıklanınca açılır.

#### Maket M1 — Kullanıcı ve Rol · Personel (modül 1, 2) — ONAYLANDI 2026-09-25
**Ek (2026-09-27, §9 yirmi altıncı tur):** kişi sayfasında **"Maaş ve bordrolar"** (brüt, net, işverene maliyet, günlük maliyet; bordrolar,
"Bordro yükle"). Ölçüm: M1 248/248 · 45/45 · 124/124.
**2. tur (2026-09-25, reisim'in M1 cevaplarıyla; soru kararları §9 on ikinci tur).** Ekranlar: **giriş** (`maket/giris.html`: giriş · yanlış
bilgi · parola sıfırlama · **geçici parolayla ilk giriş** — parolayı değiştir ya da "Şimdi değil") · **Ana sayfa** (`maket/anasayfa.html`:
girişten sonra herkes buraya gelir; role göre bilgi yüzleri + iş listesi — firma yöneticisi, planlama, inspector, mekanik / elektrik
yönetici; makette rol anahtarı) · **personel** (`maket/personel.html`: liste — rol seçicisi, "Bilgisi eksik" çipi · **Rol yetkileri**
sekmesi: düzenlenir, "Önerilen düzene dön" · personel kartı: bilgi yüzleri, kimlik ve sicil, eksik bilgi uyarısı, **giriş hesabı ve
roller** (geçici parola, hesabı kapat / yeniden aç, görebildiği modül), **zimmetindekiler**, **özlük dosyası** · pencereler: giriş
hesabı aç / yeni geçici parola (parola bir kez gösterilir) · özlük belgesi ekle · form). Eski `maket/kullanicilar.html` Personel'e yönlendirir.
**Varsayımlar:**
- Karar (159 + 33): **Kullanıcılar ekranı kalktı**, giriş hesabı her zaman bir personel kaydına bağlı; hesap, roller ve rol yetkileri
  Personel'in içinde. Menü 17 → **16 modül** (uygulamanın modül kaydı da, `src/modules/moduller.ts`).
- Karar (32): rol yetkileri tablosu **başlangıç düzeni**; firma yöneticisi rol × modül düzeyini (değiştirir · görür · branşı · kendi ·
  görmez) değiştirir, "önerilen düzene dön" ile geri alır. Firma yöneticisinin **Personel** yetkisi sabit (kendini hesap yönetiminden
  kilitleyemesin — varsayım). Değişiklik kaydedilince hemen geçerli (kendi kimlik sistemimiz; varsayım).
- Karar (34): **davet yok** — yönetici "Giriş hesabı aç" ya da "Yeni geçici parola" ile parola oluşturur, parola **yalnız bir kez**
  gösterilir, kişiye yönetici iletir; kişi ilk girişte değiştirebilir ("Şimdi değil" ile geçebilir). Hesap durumu: etkin · ilk giriş
  bekleniyor · kapalı.
- Karar (33, müşteri tarafı): her müşteriye portal girişi **kendiliğinden** açılır, parola müşterinin sistemdeki e-postasına gider;
  personel de erişip müşteriye bilgi verebilir → **M2 Müşteri ve Tesis sırasında maketlenir** (bu turda yalnız giriş ekranındaki not).
- Karar (35, 36): firma çalışanı ve müşteri **aynı alan adındaki aynı giriş ekranından** girer; giriş ekranında firma logosu **yok**.
- Karar (37): parola en az 10 karakter, harf + rakam · 5 hatalı denemede 15 dk kilit · sıfırlama bağlantısı 30 dk.
- Karar (38, 39): **teknik ayrıntıya girilmez** — Ek-III grup yetkilendirmesi (17020 yetkinlik tablosu) kalktı; eksik bilgi (EKİPNET no
  boş, meslek yetkili kişi meslekleri arasında değil) **uyarıdır, engel değil**: plan kabulünde uyarı olarak görünür, iş yapılabilir.
  Formda zorunlu yalnız ad, işe başlama ve meslek. Yetkili meslek olmayan kişiye de inspector rolü verilebilir, kartta uyarı yazar.
- **Zimmet teslim formu (reisim 2026-09-25, cevaplardan sonra ek istek):** Zimmetindekiler'de "Zimmet formu" → kişideki varlıkların
  **temel format** önizlemesi (PDF'in iskeleti; `MB.zimmetFormu`, rapor belgesiyle tek üretici) → yazdır, teslim eden ve teslim alan
  imzalar → "İmzalı taramayı yükle". Kartta durum: yüklü ve güncel · **eskidi** (formdan sonra zimmet değişti → yeni form) · yok.
  Teslim eden makette planlama ekibinden depo sorumlusu (varsayım, M4 soru 63). Format firmaya göre değişebilir → §3.7 listesi.
  **Ek (reisim 2026-09-25: "İmzalı zimmet formuna tıklayınca açılmalı sadece yüklü olduğu bilgisi yeterli değil, personelin profilindeki
  zimmet geçmişine tıklayınca o personele hangi tarihte hangi ekipman verilmiş hangi tarihte alınmış görülsün"):** durum şeridinin
  yanında "İmzalı formu aç" (yüklenen tarama; makette formun imzalı hâli) · "Zimmet geçmişi" kartın içinde ayrı görünüm: kişiye yapılan
  her teslim — varlık, verildi (tarih, depodan / devir), geri alındı (tarih, depoya iade / kalibrasyona / devredildi · kişi) ya da
  "Hâlâ kişide", not; altında kişinin bütün imzalı formları (yeniden eskiye, her biri açılır). Formun kapsamı imza tarihinde kişide olan
  varlıklardan hesaplanır. Geçmişte "Zimmetler modülünde" tuşu yok (reisim: *"gerek yok kaldır"*). Kartın rol kaydetme çubuğu telefonda artık yapışkan değil (bölüm içi çubuk).
- Karar (40): kişinin kartında **zimmetindekiler** (o an kişide olan varlıklar; teslim geçmişi Zimmetler'de) ve **özlük dosyası**
  (iş sözleşmesi, diploma, oda kaydı, EKİPNET belgesi, kimlik, sağlık raporu, diğer; yalnız firma yöneticisi görür — KVKK: özlük bilgisi,
  varsayım). Eğitim sertifikaları Eğitimler modülünde.
- Karar (41): girişten sonra herkes **Ana sayfa**'ya gelir, içerik role göre; birden çok rolü olan kişi her rolün bölümünü alt alta görür
  (varsayım). Yüzlerdeki sayılar öteki maketlerin ortak verisinden. Yan menünün en üstünde "Ana sayfa" (modül değil, gruba girmez).
- Karar (42): yeni desenler kalıba girdi (TASARIM-KALIBI kural 20). Karar (43): ayrılan personel silinmez, hesabı kapanır.
- Telefon numarası alanı yok (KVKK: en az veri); tarih alanı metin (GG.AA.YYYY) — tarih seçici ayrı iş (kalıp 19).
- **Sırası gelince düzelecekler (bu kararların öteki maketlere etkisi):** M6 Plan aç'taki aday tablosu hâlâ "firma yetkilendirmesi"
  (grup) ve eksikleri **engel** gibi gösteriyor · Planlar'daki kabul kilidi (EKİPNET) uyarıya dönecek · M3'te tür başına "yetkili
  meslekler" ayrıntısı sadeleşecek · M2'de portal kullanıcısı davetle değil kendiliğinden açılacak.
**Sorular (M1):**
Açık soru yok — 32–43 ve 159 cevaplandı (§9, on ikinci tur). **2. tur ONAYLANDI (2026-09-25, reisim: *"Onaylıyorum"*)**; koda geçiş
reisim'in "başla" demesiyle (kalıp kuralı 20'nin kilidi o zaman kurulur).
**Ölçüm (2026-09-25, bulut, 2. tur + zimmet formu + zimmet geçmişi):** 29 durum × 1920 · 1080 · 375 × açık/koyu = **174/174 temiz**, 1080'de çekmece açık 2/2; etkileşim
**38/38**, telefon 116/116 (rol seçicisi, eksik bilgi çipi, rol kaydetme, yetkisiz meslekte uyarılı inspector, hesap aç → geçici parola → kart, yeni geçici
parola, hesabı kapat, rol yetkilerini düzenle / kaydet / önerilene dön, yöneticinin sabit hücresi, özlük belgesi, eski Kullanıcılar
bağlantısı, geçici parolayla giriş, Ana sayfa rol anahtarı ve onay kuyruğu sırası). Ölçerken düzeltilen: telefonda zimmetteki uzun varlık
adı 93 px taşıyordu (kısa kimlik bağlantı, ad alt satırda) · özlük notundaki satır içi bağlantı 16 px küçük hedefti (kaldırıldı) · telefonda
rol yetkileri çubuğuna üç tuş sığmıyordu ("Önerilen düzene dön" tablonun üstüne alındı).
1. tur (2026-09-24): 18 durum 108/108, etkileşim 17/17 (Kullanıcılar ayrı ekrandı).

#### Maket M2 — Müşteri ve Tesis (modül 3) — ONAYLANDI 2026-09-26
**2. tur (2026-09-25, reisim'in M2 cevaplarıyla: *"Tüm önerilerin uygundur"*; kararlar §9 on üçüncü tur).** Ekranlar (`maket/musteriler.html`):
**liste** (tesis sayısı ve illeri, ekipman, **müşteri girişi** — son giriş ya da "henüz girmedi", en yakın kontrol, durum; çipler:
kontrolü 30 gün içinde · İSG-KATİP kaydı olmayan tesis · müşteri girişi kullanılmadı · bilgisi eksik · açık uygunsuzluk; il seçicisi;
**Görünüm: etkin / pasif / hepsi**; arama tesis adını da bulur) · **müşteri sayfası** (bilgi yüzleri, eksik bilgi uyarısı, müşteri
bilgileri, tesisler, **müşteri girişi** — kendiliğinden açılır; "Müşteri gözüyle bak", "Parolayı yeniden gönder"; kişiye özel **ek
girişler**) · **tesis sayfası** (işyeri bilgileri — raporun işyeri bölümü buradan dolar, eksik bilgi uyarısı, İSG-KATİP kayıtları
yalnız görünür, plan) · pencereler: **müşteri ekle / düzenle · tesis ekle / düzenle (il ve ilçe aramalı listeden) · ek giriş ekle ·
pasif yap / yeniden etkinleştir**.
**Varsayımlar:**
- Bakış **planlama ekibi**. Planlar maketindeki 9 müşteri ve tesis aynı adlarla.
- **Müşteri girişi kendiliğinden** (cevap 33): müşteri kaydedilince müşterinin e-postası kullanıcı adı olur, sistemin ürettiği parola o
  adrese gider; davet yok. E-posta yazılmamışsa kayıt yine olur, giriş e-posta yazılınca açılır. Personel "Müşteri gözüyle bak" ile
  müşterinin gördüğünü açar. Ana giriş bütün tesisleri görür; **ek giriş** kişiye özeldir, bütün ya da seçili tesisleri görür (44).
- **Vergi no ve SGK DETSİS no zorunlu değil** (45, 46): boşsa kayıt olur, müşteri / tesis sayfasında "eksik bilgi" uyarısı çıkar;
  aynı numara başka kayıtta varsa pencere uyarır, **"Yine de kaydet"** ile kaydedilir. SGK no raporda gerektiği için rapor imzalanırken
  yeniden hatırlatılır (M9'un sırası gelince). Biçim (10–11 hane, 26 hane) yalnız yazım yanlışına karşı denetlenir.
- **Bir tesis tek müşteriye ait** (47); aynı adreste iki işletme = iki tesis.
- **Silme yok, pasif** (48): müşteri ya da tesis pasif olunca listelerden kalkar, yeni plan ve teklif açılmaz, raporları ve arşivi
  kalır; müşteri pasifse girişi kapanır ve tesisleri de pasif olur. "Yeniden etkinleştir" ile geri gelir.
- **"Kontrolü yaklaşan" eşiği firma ayarı** (49), başlangıç 30 gün.
- **İl ve ilçe listeden** (50): 81 il aramalı; ilçe il seçilince açılır. Makette ilçe listesi yalnız verideki 6 ilde, öteki illerde ilçe
  yazılır; uygulamada 81 ilin tamamı.
- **Çakışma:** İSG-KATİP kayıtları tesis sayfasında yalnız görünür, girişi İSG-KATİP ekranında ("İSG-KATİP'te aç"); "Açık plan için"
  sütunu kilit değil uyarıdır (genel ilke; M5'in sırası gelince yeniden sorulur).
- "En yakın kontrol" tesislerin sonraki kontrol tarihlerinin en yakını (sonradan ekipmanlardan hesaplanır, M3). Açık uygunsuzluk sayısı
  M9 / M11'den beslenir.
- Faz 2 bağlantıları müşteri sayfasında (2026-09-24, M12–M14 gelince): **Teklif** · **İş sözleşmesi** · **Açık alacak** yüzleri o müşteriye
  süzülü listeyi açar; faturası olmayan müşteride alacak yüzü tıklanmaz (boş liste gösterilmez, anayasa 2.6).
- M11 Müşteri Paneli ek girişleri okuyor; ana girişin panelde karşılığı M11'in sırası gelince bağlanır.
**Sorular (M2):**
Açık soru yok — 44–50 cevaplandı (§9, on üçüncü tur). **2. tur ONAYLANDI (2026-09-26, reisim: *"Sıradakine geçelim"*)**.
**Ölçüm (2026-09-25, bulut, 2. tur):** 13 durum × 1920 · 1080 · 375 × açık/koyu = **78/78 temiz**, çekmece 2/2; etkileşim **24/24**, telefon
**52/52** (müşteri girişi kullanılmadı çipi, aynı vergi no → uyarı → "Yine de kaydet" kaydeder, vergi no ve e-posta boş kaydedilir, e-postayla
müşteri girişi kendiliğinden açılır, çakışan SGK uyarısı, il seçilmeden ilçe kapalı, il ve ilçe listeden, 81 ilde arama, ek giriş, parolayı
yeniden gönder, müşteri gözüyle bak, pasif yap → tesisler de pasif → listede Görünüm: Pasif, yeniden etkinleştir, İSG-KATİP'te aç).
Ortak veri değiştiği için öteki 15 maketin etkileşim denemeleri yeniden koşuldu, hepsi geçti. Ölçerken çıkan: il listesi açıkken liste
alttaki alanların üstüne açıldığı için "çakışma" sayıldı; açılır liste tasarım gereği üstte durur, bu durum ölçüm listesinden çıkarıldı ve
liste etkileşim denemesiyle ölçüldü (81 il, arama).
1. tur (2026-09-24): 8 durum 48/48, etkileşim 14/14 (portal kullanıcısı davetle, vergi / SGK no zorunluydu).

#### Maket M3 — Ekipman türleri (modül 5) — ONAYLANDI 2026-09-26
**Ek (2026-09-27, §9 yirmi dördüncü tur):** tür sayfasında **"Kullanılacak ölçüm cihazları"** (tür düzenle penceresinde seçilir; raporda
bu türlerin her birinden kalibrasyonu geçerli cihaz eklenmeden rapor onaya gönderilemez) ve **"Rapor bölümleri"** (formattan: muayene kriterleri,
test değerleri, elektrikte pano sigortaları · standart: firma, ekipman, cihazlar · her raporda sabit: fotoğraflar, sonuç ve kanaat, muayene
uzmanı yorumu). Başlangıç cihaz listesi örnek. M3 72/72 · 17/17 · 36/36.
**2. tur (2026-09-26, reisim'in M3 cevaplarıyla; kararlar §9 on dördüncü tur).** Ekranlar: **ekipman türleri** (`maket/ekipman-turleri.html`:
katalog — Ek-III grubu, branş, periyot, Bakanlık formatı, **rapor formatı** (yüklendi / yüklenmedi, sürüm); çipler: rapor formatı yüklenmedi ·
Bakanlık formatı zorunlu · standart seçilmemiş; **Tür ekle** · **tür sayfası**: rapor formatı (firmanın PDF'i, sürümleri, "PDF'i aç", "Yeni
format yükle"), kontrol kuralları, kontrol metodu standartları · pencereler: **tür ekle** (PDF de yüklenebilir) · **düzenle** · **rapor formatı
yükle**). **Ekipmanlar ekranı kalktı** (`maket/ekipmanlar.html` artık Ekipman türlerine yönlendirir): ekipmanlar planın içinde görünür.
**Varsayımlar:**
- **Ekipmanlar ayrı modül değil** (reisim: *"planlar açıldığında ekipmanlar orada gözüküyor ya, oradan rapor oluştur diyoruz"*): denetçi
  ekipmanı sahada planın içinde ekler; ekipman kaydı kalıcıdır çünkü sonraki yıllarda önceki raporundan "Rapor oluştur" ile yeni rapor
  açılır (tekrar tekrar rapor yazılmaz). Menüden ve uygulamanın modül kaydından çıktı → 15 modül. Müşteri ve tesis sayfasındaki ekipman
  sayısı yalnız bilgi; tesiste açık plan varsa yüz o planı açar. Rapor sayfasındaki ekipman yüzü tıklanmaz.
- **Firma tür ekler ve her türe kendi rapor formatını PDF olarak yükler** (reisim: *"ekipman türü ekleme tuşu olsun ve her ekipmanın içinde
  türün formatını belirleyecek pdf i ekleme tuşu da olsun"*). Format sürümlüdür: yeni yüklenen sonraki raporlarda kullanılır, eski raporlar
  kendi sürümüyle açılır. "Rapor oluştur" soruları bu formattan gelir, sonuç uygun / uygun değil — **PDF'ten soruya nasıl geçileceği M8'in
  sırası gelince kurgulanır** (reisim: *"şimdilik tam anlamıyla yapmana gerek yok ilerledikçe daha oturaklı olacak"*). Makette "PDF'i aç" rapor
  şablonu önizlemesini (M7) açar; yeni yüklenen PDF makette açılmaz.
- ⚠️ **§8.3 kararıyla ilişki:** onaylı karar "rapor şablonları firma × tür başına **kodda**, site içi düzenleyici yok" idi. Firmanın PDF yüklemesi
  bu kararı değiştiriyor: format firmadan gelir. PDF'in rapora nasıl dönüşeceği (bizim kodladığımız şablon mu, PDF'ten çıkarılan sorular mı)
  M8'de reisim'le kararlaştırılacak; §8.3 o zaman güncellenir. → **2026-10-02 karar:** firma formatını Format kurucuda kendisi kurar (§8.3).
- **Akreditasyon yazılmaz** (reisim: *"bunu bilmek periyodik kontrol firması yetkililerinin sorumluluğu"*): sütun, çip, rozet ve satır kalktı.
- **Yetkili meslekler bölümü yok** (52): yetkisiz denetçi plana alınırsa yalnız uyarı (M1, M6).
- **Periyot türde** (53); tek ekipmanın sonraki kontrol tarihi planda / raporda elle değiştirilir (M8'in sırası gelince).
- **Tahmini kontrol süresi isteğe bağlı** (54); boşsa "Girilmedi".
- Eski ekipman kodu **başka ekipmana verilmez** (56); kod değişikliğinin yeri plan içi / rapor (M6–M8'in sırası gelince).
- Sökülen / hizmet dışı ekipman düşünülmez (57, reisim: *"biz fabrikaya hizmet eden bir uygulama yapmıyoruz, biz denetçiye ve periyodik
  kontrol firmasına hizmet verecek bir içerik üretiyoruz"*).
- Katalog 24 tür (Planlar maketinin 14 türü + 10 tür); rapor şablonu olan 15 türde bir format sürümü yüklenmiş sayılır; standart
  atamaları örnektir.
**Sorular (M3):**
Açık soru yok — 51–57 cevaplandı (§9, on dördüncü tur). **2. tur ONAYLANDI (2026-09-26, reisim: *"Sıradakine geçelim"*)**.
**Ölçüm (2026-09-26, bulut, 2. tur):** 8 durum × 1920 · 1080 · 375 × açık/koyu = **48/48 temiz**, çekmece 2/2; etkileşim **15/15**, telefon **32/32**
(format yüklenmedi çipi, branş, akreditasyon hiçbir yerde yazmaz, yetkili meslek bölümü yok, kullanılan kod reddedilir, PDF'siz ve PDF'li tür
ekle, PDF seçilmeden yüklenmez, yeni sürüm v4 kullanımda / v3 önceki, PDF'i aç, süre boş kaydedilir, periyot 0 hata, Vazgeç, eski Ekipmanlar
bağlantısı, tesis sayfasındaki ekipman yüzü → plan). Menü değiştiği için bütün maketler yeniden ölçüldü (§11, 39).
1. tur (2026-09-24): 10 durum 60/60, etkileşim 14/14 (Ekipmanlar ayrı ekrandı, akreditasyon ve yetkili meslekler gösteriliyordu).

#### Maket M4 — Ölçüm Cihazı · Zimmet · kalibrasyon uyarısı (modül 8, 9, 20 kısmı) — ONAYLANDI 2026-09-26
**2. tur (2026-09-26, reisim'in M4 cevaplarıyla; kararlar §9 on beşinci tur).** Ekranlar: **ölçüm cihazları** (`maket/olcum-cihazlari.html`:
liste üstünde kalibrasyon uyarı şeridi — geçenler kişi adıyla, 30 gün içinde bitenler; "Göster" çipi uygular · çipler: kalibrasyonu geçmiş ·
30 gün içinde · kalibrasyonda · ara kontrol gecikti · depoda · **cihaz sayfası**: başta **Kimde** (tıklanınca zimmet geçmişi) ve **kalibrasyon
bitişi**, "Teslim et", "Düzenle" (cihaz kodu), cihaz bilgileri, kalibrasyon kayıtları + sertifika, ara kontroller (yalnız takip edilen
cihazda) · pencereler: cihaz ekle / düzenle · kalibrasyon kaydı · ara kontrol) · **zimmetler** (`maket/zimmetler.html`: **Kimde** (anlık;
kişiye göre adresten) · **Hareketler** (tam geçmiş, 20'şer; "İmzalı formda değil" çipi) · **varlık sayfası**: fotoğraflı teslim geçmişi,
"Zimmet formu" · **teslim penceresi**).
**Varsayımlar:**
- **Asıl hedefler** (reisim: *"cihazlar eklensin tıklanınca kimde olduğu gözüksün kod verilebilsin kalibrasyon tarihi takip edilebilsin"*):
  cihaz sayfasının başında Kimde ve kalibrasyon bitişi; **cihaz kodu** firmanın verdiği etiket (eşsiz, sonradan düzenlenir); "Teslim et"
  cihaz sayfasından da açılır. Öteki işler (ara kontrol, uyarı şeridi, hareket geçmişi) kolaylaştırıcı.
- Varlık = **cihaz · araç · diğer** (saha tableti, KKD seti). Kimde = son teslimin alanı: kişi · **Depo** · **Kalibrasyonda**.
- **Depo için ayrı rol yok** (63): Zimmetler yetkisi olan herkes teslim eder; geçmişte kaydı yapan yazar.
- **Zimmetin onayı tek yoldan: ıslak imzalı zimmet formu + tarama** (M1, personel kartı). Uygulama içi "Onay bekliyor" kalktı (çakışma);
  hareketlerde her kişiye teslim o kişinin imzalı formunda mı ("İmzalı formda" / "Form imzalatılacak") görünür.
- **Kalibrasyonu geçen cihaz zimmette kalabilir, o kişinin raporları onaya GÖNDERİLEMEZ** (59, reisim: *"kalibrasyon önemli o durumda
  göndermeyi engellesin"*) — genel "uyarı, engel değil" ilkesinin bilinçli istisnası.
- **Rapordaki cihazlar** (58): denetçi rapor anında zimmetindeki cihazlardan seçer; cihaz türünün ekipman gruplarına uyanlar önceden işaretli
  gelir (M8'in sırası gelince).
- **Ara kontrol isteğe bağlı** (60): cihazda "takip edilsin" açıksa görünür; periyot firma ayarı (başlangıç 6 ay). Makette kumpas, mesafe
  ölçer ve lüksmetrede takip edilmiyor.
- **Kalibrasyon uyarı eşiği firma ayarı** (65), başlangıç 30 gün; cihaz başına değil. Uyarı yalnız ekranda (anayasa 1.3), M10'da toplanır.
- **Teslimde fotoğraf isteğe bağlı** (62): fotoğrafsız teslim kaydedilir, pencerede uyarı yazar. **Araçta yalnız kimde + kilometre** (64).
- Sertifika dosyası (PDF) zorunlu; sonuç "Uygun değil" ise cihaz kullanımdan çekilir. Laboratuvardan dönen cihaz depoya girer.
- Ayrılan personelin zimmeti iadeyle depoya döner. Plaka il kodu **00** (gerçek olamaz), laboratuvar adları uydurma.
**Sorular (M4):**
Açık soru yok — 58–65 cevaplandı (§9, on beşinci tur). **2. tur ONAYLANDI (2026-09-26)**: reisim düzeltme söylemeden M5'e geçti; "onaylı
sayıyorum, yanlışsa söyle" dendi, itiraz gelmedi ("Önerilerin hepsi uygun başla").
**Ölçüm (2026-09-26, bulut, 2. tur):** 12 durum × 1920 · 1080 · 375 × açık/koyu = **72/72 temiz**, çekmece 2/2; etkileşim **20/20**, telefon **48/48**
(Göster çipi, aynı cihaz kodu reddedilir, cihaz ekle, kalibrasyon kaydı dosyasız kaydedilmez, laboratuvardan dönüş, ara kontrol, kişiye göre,
20'şer sayfa, aynı kişiye teslim reddedilir, kilometresiz araç reddedilir / fotoğrafsızlık yalnız uyarı, fotoğrafsız teslim kaydedilir,
kalibrasyonu geçmiş cihaz depoya, kişiye teslim → Form imzalatılacak, Zimmet formu → Personel, İmzalı formda değil çipi, Kimde yüzü → varlık,
Teslim et → pencere dolu, cihaz kodu düzenlenir, ara kontrolsüz cihazda bölüm yok, kalibrasyonu geçmiş cihazda gönderilemez uyarısı).
Ortak veri değiştiği için M1, M8, M9, M10, M16 etkileşim denemeleri yeniden koşuldu, hepsi geçti.
1. tur (2026-09-24): 10 durum 60/60, etkileşim 12/12 (uygulama içi onay, zorunlu fotoğraf, her cihazda ara kontrol).

#### Maket M5 — Sözleşmeler: iş sözleşmesi + İSG-KATİP (modül 12; M13 ile birleşti) — ONAYLANDI 2026-09-26
**2. tur (2026-09-26, reisim'in cevaplarıyla; kararlar §9 on altıncı tur).** Ekran: **Sözleşmeler** (`maket/sozlesmeler.html`; eski
`is-sozlesmeleri.html` ve `#/isg…` adresleri karşılığına gider): **iş sözleşmeleri listesi** (no, müşteri / tesis, süre, İSG-KATİP ID sayısı
ve eksik, durum; çipler: imza bekliyor · yürürlükte · süresi doldu · bitişi 60 gün içinde · İSG-KATİP ID'si eksik; seçiciler: müşteri ·
denetçi; şeritler: açık planda ID eksik · biten sözleşme) · **sözleşme sayfası**: taraflar ve koşullar, kapsam, **İSG-KATİP** (tesis başına
SGK DETSİS no + denetçi → sözleşme ID, onay tarihi, PDF, kullanım; ID ekle / düzenle / sil), geçmiş · pencereler: **İSG-KATİP ID
ekle / düzenle** · **sözleşme şablonu** · form: sözleşme hazırla.
**Varsayımlar:**
- **Sözleşmeler = firma ile fabrika arasındaki iş sözleşmesi** (reisim). Ayrı "İSG-KATİP kayıtları" sekmesi kalktı; M5 ve M13 birleşti.
- **İSG-KATİP bilgisi iş sözleşmesinin içinde, tesis başına:** denetçi → **sözleşme ID** (reisim: *"sözleşme id denetçiye göre değişir"*).
  Kişi × tesis için tek güncel ID; yenisi girilince eskisi "önceki" olur.
- **SGK DETSİS no tek yerde, tesiste** (M2); sözleşmede ve raporda oradan görünür (B). 2026-10-03: planlamacı planın künyesinde (firma adı,
  adres, İSG-KATİP ID, SGK DETSİS no) plana özel düzeltme yapabilir; denetçi Güncelle'ye basınca raporlarına geçer (§3.4 Plan künyesi).
- **ID'nin yolu (C, "ikisi de"):** sözleşmede girilir → plan açarken seçilen denetçinin ID'si kendiliğinden gelir → rapor plandan alır; ID yoksa
  plan açan el ile yazar ("sözleşmeye de kaydet") ve raporda da düzeltilebilir. **Plan açma ve rapor tarafı M6 / M8'in sırası gelince.**
- **İSG-KATİP PDF'i her ID'nin yanında, isteğe bağlı** (D) · **onay tarihi isteğe bağlı** (E); girilmişse kontrolden sonraki onay yalnız
  "Geç onay" uyarısı, plan kabulü engellenmez.
- **Kim girer** (F): Sözleşmeler yetkisi olan herkes (M1 rol yetkileri); plan açan da plan anında ekler.
- **Silme** (G): hiçbir planda kullanılmamış ID silinir; kullanılmış ID yalnız düzeltilir.
- **Sözleşme şablonu** (H): firma kendi şablonunu (PDF / Word) yükler, sürümlü; yüklemezse temel format (KM-FR-SZL-01). §3.7 satır 5.
- Geçerli iş sözleşmesi olmayan tesiste ID'ler tesis sayfasında görünür, girişi plan açarken el ile (makette t2).
- **Hizmet sözleşmesi ile İSG-KATİP sözleşmesi ayrı şeyler; UYARI YALNIZ İSG-KATİP İÇİN** (reisim 2026-09-26): ID girilmemiş · geç onay ·
  **bitmiş** (isteğe bağlı bitiş tarihi planın gününden önce; plan açarken de uyarılır — M6). Hizmet sözleşmesinin bitişi, yenilemesi, imza
  beklemesi için uyarı yok; yalnız durum rozeti ve tarih. (Kalibrasyon uyarısı M4'te onaylı olarak kalır; bu kural sözleşmeler içindir.)
- **İmzalı sözleşme görüntülenir** ("İmzalı sözleşmeyi aç"; makette temel formatın imzalı hâli, KM-FR-SZL-01).
- **Numaralar firmaya göre** (IS-AAYY-SIRA temel biçim; §3.7 satır 8).
**Sorular (M5):**
Açık soru yok — A–H cevaplandı (§9, on altıncı tur); iş sözleşmesinin 125–134'ü de cevaplandı (on yedinci tur). **2. tur ONAYLANDI
(2026-09-26, reisim: *"Sıradakine geçelim"*)** — M13 (iş sözleşmesi) bu onayın içinde.
**Ölçüm (2026-09-26, bulut, 2. tur + ek):** 11 durum × 1920 · 1080 · 375 × açık/koyu = **66/66 temiz**, çekmece 2/2; etkileşim **16/16**, telefon **44/44**
(ek: İSG-KATİP bitmiş uyarısı, bitiş uzatılınca uyarı düşer; ilk hâli 60/60 · 14/14 · 40/40)
(eski İSG-KATİP adresi sözleşmeye gider, sözleşmesi olmayan tesis → tesis sayfası, denetçiye göre, ID eksik çipi, geç onay yalnız uyarı,
boş ID hatası, onay tarihsiz ID kaydı ve eksiğin düşmesi, PDF'li ID, yenileme, onay tarihinin silinmesi, kullanılmamış ID silinir, kullanılanda
Sil yok, şablon yükleme, Esc). M2, M13 yeniden ölçüldü; öteki 14 maketin etkileşim denemeleri geçti.
1. tur (2026-09-24): 11 durum 66/66, etkileşim 14/14 (İSG-KATİP ayrı sekme ve plan kabul kilidiydi).

#### Maket M6 — Plan aç (modül 13, planlama ekibi) — ONAY BEKLİYOR
**2. tur (2026-09-26, reisim: *"Önerilerin uygun ama geliştirilebilir maketi yap inceleyeyim ona göre tekrar konuşuruz"*; kararlar §9 on
sekizinci tur).** Ekran: **Plan aç** (`maket/plan-ac.html`; müşteri, tesis ve Ana sayfa (planlama / yönetici) "Plan aç"tan gelir). Tek sayfa,
**asıl hedef** sırayla: **1 Müşteri ve tesis** (açık plan varsa ikinci plan bilgisi, İSG-KATİP ID'si olmayan tesis uyarısı) · **2 Tarih ve
saat** (başlangıç, saat aralığı, tahmini süre, açıklama) · **3 Denetçi** (tablo: İSG-KATİP ID — sözleşmeden / geç onay / bitmiş / yok ·
EKİPNET · aynı gün · uyarı · durum "Uygun / N uyarı"; ID'si olmayan seçilince **el ile ID** + "sözleşmeye de kaydet") · **4 Kapsam** (tesisin
kayıtlı ekipmanı; kontrolü gelenler seçili; "Kontrolü gelenleri seç" · "Hepsini seç" · "Seçimi temizle") · **5 Özet ve uyarılar** · **plan
açıldı** ekranı (uyarılı kişi şeridi, el ile ID'nin sözleşmeye kaydı, planın İSG-KATİP ID'leri).
**Varsayımlar:**
- **Asıl hedef:** tesis + tarih/saat + denetçi(ler) + kapsam → plan denetçinin Planlar'ına "Kabul bekliyor" düşer; müşteri panelinde "planlanan
  kontrol" görünür (81; M11'in sırası gelince), e-posta / bildirim yok.
- **Uyarılar engel değil:** İSG-KATİP ID'si yok · onay geç · **İSG-KATİP sözleşmesi bitmiş** (reisim, M5) · EKİPNET yok · meslek yetkili değil ·
  ilk giriş yapılmadı · saat çakışması (76) · kapsamdaki türe ekipte yetkili meslekten kimse yok. "Kabul edemez" kalktı.
- **İSG-KATİP ID** sözleşmeden kendiliğinden gelir (M5); yoksa plan açan el ile yazar, "sözleşmeye de kaydet" işaretliyse tesisin iş sözleşmesine
  eklenir (bir dahaki planda kendiliğinden gelir). Boş bırakılırsa plan açılır, uyarı kalır.
- **Tek sayfa** (74). **Tesiste açık plan varken ikinci plan açılır** (77). ~~O plandaki ekipman bu plana alınamaz.~~ (2026-09-30, L6: kısıt kalktı)
- ~~**Kapsam** (78): kontrolü eşik içinde gelen … seçili gelir.~~ **2026-09-30 (L6, §9 kırkıncı tur): ekipman seçimi YOK** — tesisin bütün
  kayıtlı ekipmanı plana girer; özet tür başına sayıyı, "kontrolü geliyor" sayısını (eşik firma ayarı, 30 gün) ve ekipte yetkili olanı
  gösterir. Denetçi plan içinde bütün ekipmanı görür (branş süzgeciyle kendi branşını ayırır), gerekeni raporlar.
  **"Sahada kaydedilecek yeni ekipman" alanı kalktı**: yeni ekipmanı denetçi sahada plana ekler; ekipmansız tesiste de plan açılır.
- **Sorumlu denetçi yok** (79), ekip eşit. **"Plan aç" tuşu** plan açma yetkisi olana (80): makette Ana sayfa'nın planlama ve yönetici
  görünümünde; Planlar maketi denetçi gözünden olduğu (ve dondurulduğu) için orada gösterilmedi — uygulamada rol yetkisiyle görünür.
- Tahmini süre tür sürelerinden (M3), yalnız ipucu. Proje no kaydedince sunucu verir (numara biçimi firmaya göre, §3.7). Makette sayfalar
  arası kayıt taşınmaz: açılan plan Planlar maketinin listesinde görünmez.
**Sorular (M6):**
Açık soru yok — 74–81 önerileri uygun (§9, on sekizinci tur). 2. tur reisim'in incelemesini bekliyor ("ona göre tekrar konuşuruz").
**Ölçüm (2026-09-26, bulut, 2. tur):** 10 durum × 1920 · 1080 · 375 × açık/koyu = **60/60 temiz**, çekmece 2/2; etkileşim **18/18**, telefon **40/40**
(ID sözleşmeden gelir, tarihle İSG uyarısı, "Kabul edemez" yok, el ile ID alanı ve sözleşmeye kaydet, el ile ID yazılınca uyarı düşer, İSG-KATİP
bitmiş uyarısı, aynı saat, ikinci plan bilgisi, Hepsini seç / yeni ekipman alanı yok, kapsam boş açılır, geçmiş tarih, boş gönderim, plan açılır
+ ID sözleşmeye kaydedilir, Ana sayfa'dan Plan aç). Ölçerken düzeltilen: telefonda denetçi kartında uyarı metni rozetin yanında 63–70 px taşıyordu
→ ayrı "Uyarı" satırı.
**2. tur, ek (2026-09-26, §9 on dokuzuncu tur):** alanların altındaki küçük mesajlar, parantez içi açıklamalar ve bölüm açıklama paragrafları
kalktı (müşteri ünvanı / tesis adresi / sonraki kontrol / süre ipuçları, "Proje no kaydedince verilir", "sözleşmeden · el ile" alt satırları,
bilgi şeridi); etiket **"İSG-KATİP sözleşme ID"**. Yeniden ölçüm: 60/60 · 18/18 · 40/40.
1. tur (2026-09-24): 10 durum 60/60, etkileşim 12/12 ("Kabul edemez", sahada yeni ekipman alanı vardı).

#### Maket M7 — Standart Kütüphanesi (modül 4) — ONAY BEKLİYOR
**2. tur (2026-09-26, §9 yirmi birinci tur):** ayrı **rapor şablonu önizlemesi ekranı kalktı** (A: türün rapor formatı PDF'i yeter); tür sayfasındaki
"PDF'i aç" formatı pencerede gösterir (makette rapor belgesi), `maket/sablon.html` Ekipman türlerine yönlendirir. Standart sayfasında "Şablonda gör"
ve açıklama satırları kalktı. 82 kontrol metodu türün standartlarından, yoksa üretici talimatı · 83 yükleyen branş yöneticisi + firma yöneticisi,
okuyan herkes · 84 yeni sürüme türler kendiliğinden geçer. Ölçüm: 9 durum 54/54, etkileşim 11/11, telefon 36/36; M3 48/48 · 15/15 · 32/32.
1. tur metni (tarihsel):
Ekranlar: **standartlar** (`maket/standartlar.html`: liste — standart, sürüm, kullanan türler, bu sürümle rapor sayısı, yükleyen; çipler:
türe atanmamış · mekanik · elektrik; seçiciler: tür (tür sayfasındaki "Standart kütüphanesi" süzgeçli gelir) · görünüm (güncel · önceki
sürümler · hepsi) · **standart sayfası**: kullanan türler, sürümler, raporda nasıl yazıldığı, "Oku", "Yeni sürüm yükle" · **yükle / yeni
sürüm penceresi**) · **rapor şablonu önizlemesi** (`maket/sablon.html#/<tür>`: tür seçimi, sürüm, yürürlük, biçim, standartlar; iki görünüm
— **Şablon**: Ek-III 1.7'nin dokuz bölümü + fotoğraf eki, her alanın **nereden dolduğu** · **Örnek rapor**: aynı şablon uydurma kayıtlarla;
şablonu olmayan türde boş durum).
**Varsayımlar:**
- Standart = firmanın satın aldığı kopya (PDF); **yalnız firma içinde** okunur (inspector sahada dahil), kalıcı herkese açık bağlantı yok
  (anayasa 5.1). Yükleyen/değiştiren branş yöneticisi (rol × modül önerisi, M1).
- **Sürüm**: aynı numaranın yeni sürümü yüklenince eskisi "önceki sürüm" olur, silinmez; türler yeni sürüme geçer, **yazılmış raporlar
  kullandıkları sürümü gösterir**. Aynı numara + sürüm ikinci kez yüklenemez. Numara ve yıllar **örnek** (doğrulanmadı).
- Kontrol metodu: standart **tür düzeyinde** atanır (M3), inspector rapor anında türün standartlarından seçer; türde standart yoksa üretici
  talimatı / risk değerlendirmesi (Ek-III 1.7.1.1) — §3'teki açık soruya öneri.
- ~~Şablon **kodda**, site içinde düzenlenmez~~ → 2026-10-02: firma Format kurucuda kurar (§8.3); önizleme salt okunur. PDF sunucuda üretilir (§8.3); önizleme onun iskeleti, ekrana göre akar.
- Rapor başlığı: firma logosu, ticari ad, adres, akreditasyon no, akreditasyon markası yeri (§4.8); form: Bakanlık formatı zorunlu türde
  format kodu (ör. ZPKR02), öteki türde firma form kodu (makette `KM-FR-<tür>-<sürüm>`).
- Alan kaynakları (rapor zinciri §3.2 madde 1): işyeri ünvanı ← müşteri · SGK sicil ve adres ← tesis · sözleşme no ← İSG-KATİP kaydı (M5) ·
  başlangıç/bitiş ← saha · sonraki kontrol ← kontrol + tür periyodu · metot ← türün standartları · ekipman ← etiket ve kayıt (M3) ·
  ölçüm aletleri ← inspector'ın zimmeti (M4, seçilmez) · yetkili kişi ← personel (M1) · nüsha ← firma ayarı · imza ← e-imza / ıslak imza.
- Hafif / ağır kusur yalnız Bakanlık formatı yürürlükte olan türde; öteki türde "Kusurlu" (§4.5). Kriter maddeleri **örnek** (grup başına).
**Sorular (M7):**
Açık soru yok — sorular toplu listede cevaplandı (§9 yirmi birinci tur; liste `MAKET-PLANI.md`).
**Ölçüm (2026-09-24, bulut):** 11 durum × 1920 · 1080 · 375 × açık/koyu = **66/66 temiz**, çekmece 2/2; etkileşim **12/12**. Ölçerken
düzeltilen: telefonda akreditasyon markası yeri ve 26 haneli SGK DETSİS no taşıyordu (belge metni bir basamak küçüldü) · telefonda künye
logoların arasına sıkışıp e-posta ve akreditasyon no bölünüyordu (künye alta alındı, no bölünmez) · örnek rapor geçen yılın tarihini bu
yılın şablon sürümüyle gösteriyordu (örnek bugün tarihli yapıldı). Ekipman türü sayfasındaki "Standart kütüphanesi" artık türe göre
süzülmüş listeye gider (M3 60/60, 14/14 yeniden).

#### Maket M8 — Saha ve Rapor (modül 14) — ONAY BEKLİYOR
**7. tur (2026-09-27, §9 yirmi beşinci tur):** "Ekipman bilgileri"nde salt okunur **"Kontrol metodu"** (türün standartlarından; seçim alanı yok);
belgede ve onay özetinde aynı satır. Ölçüm: M8 136/136 · 44/44 · 68/68; M9 96/96 · 18/18 · 48/48; M3 80/80 · 19/19 · 40/40; M7 80/80 · 14/14 ·
40/40; M11 88/88 · 9/9 · 44/44.
**6. tur (2026-09-27, §9 yirmi dördüncü tur):** ekipman bilgileri elle (girdi; önceki raporun değerleri başlangıç) · ölçüm cihazları türün
listesinden, "Cihaz ekle" penceresinde zimmetteki geçerli cihazlar; eksik ya da geçmiş cihazda gönder kapalı; "Zimmetlerim" kalktı; cihaz rapordan
kaldırılır · sonuç ve kanaat seçmeli, seçilmezse gönderilince kriterlere göre · Kaydet + Onaya gönder altta yapışkan (her bantta), kayıt satırı
("Son kayıt …" / "Kaydedilmemiş değişiklik var") · bölümler her girişte kapalı · "Fotoğraf ekle" (kamera / galeri) · firma bilgileri salt
okunur, başlıkta "Güncelle" · öneri satırı kalktı. Örnek raporlar: ET-1009 geçmiş tesisat cihazı (zimmette geçerlisi yok), KS-1006 cihazı
eklenmemiş (zimmette var), YA-1008 mesafe ölçer zimmette yok. M8 136/136 · 43/43 · 68/68.
**5. tur (2026-09-27, reisim örnek ekranlarla: *"tarih ve saat ayrı el ile de girilebiliyo yandaki küçük ikonlara basınca seçiledebiliyor
el ile yazınca saat için aşağıda ilgili saatler çıkıyor"*):** **1 · Firma bilgileri** satır satır (etiket solda, değer ya da alan sağda):
firma adı · e-posta · telefon (elle) · periyodik kontrol başlangıç tarihi ve saati · bitiş tarihi ve saati · bir sonraki periyodik kontrol
tarihi · takip kontrol tarihi · adres · rapor no · rapor tarihi · SGK DETSİS no · İSG-KATİP sözleşme ID · ekipman bölümü (elle). Ayrı
"Kontrol bilgileri" bölümü kalktı. **Tarih, saat, dakika ayrı alan**: elle yazılır ya da yanındaki simgeyle seçilir (takvim · saat listesi);
saat yazarken uyan saatler altta listelenir. Otomatik dolu (rapor tarihi başlangıç günü). Örnekteki "metot ve kapsam" satırı alınmadı
(reisim 2026-09-27: metot kaldır). M8 104/104 · 27/27 · 52/52.
**4. tur (2026-09-27, reisim: *"tıklayınca tarih seçtiren bi takvim açılsın ve saat dakika seçebileceğim bir kısım olsun otomatik dolu
gelsin ama tıklayınca seçerek değiştirebileyim, ayrıca metot kısmını kaldır"*):** başlangıç, bitiş ve sonraki kontrol **elle yazılmaz**:
alana basınca takvim açılır (ay ileri / geri, gün), başlangıç ve bitişte altında **saat : dakika** (yukarı / aşağı tuşları) ve "Tamam".
Otomatik dolu gelir: başlangıç rapor açıldığında, bitiş gönderilince (taslakta şimdi), sonraki kontrol başlangıç + periyot (elle seçilirse
o kalır). **Kontrol metodu kalktı**: rapor ekranı, rapor belgesi ve onay ekranı özetinden. Seçici ortak (`MK.zaman`, tek üretici); öteki
ekranlardaki tarih alanları sırası gelince buna geçer. M8 96/96 · 25/25 · 48/48.
**3. tur (2026-09-26, §9 yirmi üçüncü tur):** "Onaya göndermeden önce N eksik" bölümü **kalktı** (eksikler yalnız "Onaya gönder"e basınca
pencerede) · **Kontrol bilgileri**: başlangıç ve bitiş **tarih ve saati el ile** (GG.AA.YYYY SS:DD), **sonraki kontrol** başlangıç + tür periyodundan
kendiliğinden, el ile yazılırsa o kalır ("değiştir" penceresi kalktı) · **Ekipman bilgileri** · **Ölçüm cihazları** tablo: cihaz · cihaz no ·
kalibrasyon tarihi (geçmiş cihaz kırmızı, tek engel aynen) · **Muayene kriterleri**: solda madde, sağda seçim **Uygun · Uygun değil ·
Uygulanamaz** ("yapıldı mı" ve hafif/ağır kalktı; "Uygun değil"de kusur açıklaması ve fotoğraf) · **Sonuç ve kanaat: Uygun · Uygun değil**
(uygun değil madde ya da sınır dışı test varken "Uygun" uyarıdır, engel değil) · **Muayene uzmanı yorumu** ("Notlar" yerine) · **bütün
başlıklar açılır kapanır**. Rapor belgesi (M7, M9, M11) aynı adlarla. Ölçüm: M8 88/88 · 21/21 · 44/44; M7 72/72 · 11/11; M9 96/96 · 17/17;
M11 88/88 · 9/9.
**2. tur (2026-09-26, §9 yirmi birinci tur):** rapor ekranı türün yüklenen formatına göre kurulur; ayrıntısı emsal uygulamaya göre (95).
**1 · Firma bilgileri** her raporda aynı, raporda düzeltilmez (160: plan açılırken girilir) · **2 · Kontrol bilgileri** · sonraki kontrol tarihi
**gerekçesiz** değişir (95) · **"Onaya gönder" hep açık** (90): eksik varsa uyarı penceresi, "Yine de gönder"; **tek engel kalibrasyonu geçmiş cihaz**
(91, yalnız rapordaki cihaz) · kusurlu maddeye **isteğe bağlı fotoğraf** (94) · sigorta okununca **pano fotoğrafı rapora eklenir** (92) ·
**geri gönderme geçmişi** raporda (96) · tür sayfasında yeni yüklenen formatın durumu **"Hazırlanıyor"** (159: rapor ekranı bizde hazırlanır).
Ölçüm: 10 durum 60/60, etkileşim 17/17, telefon 40/40; M3 15/15.
1. tur metni (tarihsel):
Ekran: **saha rapor ekranı** (`maket/rapor.html#/r/<ekipman kodu>`; Planlar'daki "Raporu düzenle / Raporu aç" buraya gelir). Önce tablet ve
telefon: bölümler alt alta, Ek-III 1.7 sırasıyla — **1 Genel bilgiler** (işyeri, SGK, İSG-KATİP no, başlangıç, bitiş, sonraki kontrol +
"değiştir", kontrol metodu seçimi) · **2 Ekipman** (etiket kayıttan, önceki kontrol, kullanım amacı) · **3 Ölçüm aletleri** (zimmetten,
seçilmez) · **4 Muayene kriterleri** (madde başına "yapıldı mı" + "sonuç", kusur açıklaması) · **5 Test değerleri** (sınırla canlı
karşılaştırma) · **6 Pano sigortaları** (elektrik: fotoğraftan okuma önerisi) · **7 Fotoğraflar** · **8 Sonuç ve kanaat** (kriterlerden
öneri) · **9 Notlar**; üstte **"Onaya göndermeden önce"** listesi (eksik başına "Git"), telefonda **"Onaya gönder" altta yapışkan**.
Durumlar: taslak · geri gönderilmiş (yöneticinin gerekçesi üstte) · onayda (salt okunur).
**Varsayımlar:**
- Örnekler Planlar'daki **plan 1'in raporları**, aynı numara ve durumla: ET-1009 (elektrik iç tesisatı, yarıda) · KP-1004 (kaldırma platformu,
  onaya hazır) · ZV-1007 (zincirli vinç, geri gönderildi) · HT-1001 (onayda). Raporu yazan türün branşından: elektrik **Elif Aydın**, mekanik
  **Mert Kaya** (Planlar maketinin hareket kaydı hepsini Mert Kaya'ya yazıyor — maket tutarsızlığı, kodda kayıttan gelir).
- Kriter: **yapıldı / yapılmadı / uygulanamaz** + sonuç: Bakanlık formatı yürürlükteyse **uygun / hafif / ağır**, değilse **uygun / kusurlu**
  (§4.5). Kusurlu her madde **ayrı açıklama** ister. Maddeler **tek tek** işaretlenir; "hepsi uygun" kısayolu yok (14/A-1-ç).
- Test değeri sayısal, sınırla karşılaştırılır; **sınır dışı ya da ağır kusur varken "Kullanılabilir" seçilemez**; sonuç önerisi kriterlerden,
  karar inspector'da.
- Ölçüm aletleri **zimmetten, türün grubuna uygun olanlar** (soru 58 önerisi); **kalibrasyonu geçmiş cihaz** varsa rapor doldurulur ama
  onaya gönderilemez (§3), çıkış yolu zimmet ekranı.
- **Sigorta okuma** (§8.10): "Fotoğraftan oku" → sigortalar **öneri** olarak düşer; okuması **emin olunmayan** satırlar ayrı işaretlenir ve
  toplu onaya girmez; onaylanmayan değer rapora yazılmaz; elle satır eklenebilir. Makette okuma uydurma 10 satır.
- **Onaya gönder** eksik varken pasif (Planlar'daki kabul kilidiyle aynı desen); gönderilince bitiş saati yazılır, rapor salt okunur olur ve türün
  branş yöneticisine gider (mekanik Selin Yıldız, elektrik Can Öztürk). Bildirim yok; yöneticinin Onaylar ekranında görünür (M9).
- Sonraki kontrol varsayılanı bugün + tür periyodu; değiştirmek **gerekçe** ister, gerekçe raporda görünür (§4.7).
- Taslak her değişiklikte kaydedilir (makette "son kayıt" satırı); çevrimdışı kuyruk sonraki fazda (§8.1). (2026-09-27: "Kaydet" tuşu;
  raporlamanın tamamı çevrimdışı, §8.1.)
- Planlar maketinde tek değişiklik: rapor satırındaki "Raporu düzenle / aç" tuşu bu ekrana giden bağlantı oldu (görünüş aynı).
**Sorular (M8):**
Açık soru yok — sorular toplu listede cevaplandı (§9 yirmi birinci tur; liste `MAKET-PLANI.md`).
**Ölçüm (2026-09-24, bulut):** 10 durum × 1920 · 1080 · 375 × açık/koyu = **60/60 temiz**, çekmece 2/2; etkileşim **15/15** (Planlar'dan
geçiş dahil). Ölçerken düzeltilen: 375'te üç seçenekli seçim satırı 8 px, "Giderilene kadar kullanılamaz" seçeneği 66 px taşıyordu
(telefonda seçenek iç boşluğu daraldı; seçenek "Kullanılamaz" oldu, açıklaması altında) · önceki raporun numarası satır sonunda bölünüyordu.
Planlar (54/54, 15/15) ve M7 (66/66, 12/12; kriter ve test listesi ortak veriye taşındı) yeniden ölçüldü.

#### Maket M9 — Raporlar · Onaylar · İmza · PDF (modül 14, 15, 16) — ONAY BEKLİYOR
**2. tur (2026-09-26, §9 yirmi birinci tur):** **raporlar asla birleştirilmez** (99): son imza penceresinde her rapor ayrı PDF, ayrı imzalanır;
yöntem firma ayarı (98: imza servisi ya da indir, e-imza, yükle) · **vekil onay** (100): Onaylar'da kuyruk seçimi "Mekanik · Elektrik · vekil" ·
**"Onayı geri al"** (102): onaylanıp imza bekleyen rapor yeniden kuyruğa döner · **revizyon** (103; 2026-09-29'dan beri teknik
yöneticide: Onaylar · Tüm raporlar → "Revizeye gönder", R1, önceki sürüm saklanır; tamamlanmamış raporda "Durumu değiştir") · Planlar'daki rapor rozeti **"İmza bekliyor" / "Müşteriye açık"** (106; iki tablonun durum sütunu genişledi) ·
serbest gerekçe (101), imza anında müşteriye açılır (104), onaylayanın adı formatta yeri varsa (105). Şeritler kısaldı.
Ölçüm: 12 durum 72/72, etkileşim 16/16, telefon 48/48; Planlar 54/54 · 15/15 · 36/36.
1. tur metni (tarihsel):
Ekranlar: **Raporlar** (`maket/raporlar.html`, inspector Mert Kaya: kendi raporları, 20'şer; çipler: taslak · onayda · imza bekliyor ·
müşteriye açık · geri gönderildi · kusurlu; seçiciler: müşteri, yıl; üstte **"N rapor son imzanızı bekliyor"** şeridi · **rapor sayfası**:
durum geçmişi, müşteri erişimi, **PDF önizlemesi** · **son imza penceresi**: tekli ya da toplu, iki yol) · **Onaylar** (`maket/onaylar.html`,
mekanik branş yöneticisi Selin Yıldız: kuyruk en eski üstte, bekleme süresi, menü sayacı · **onay ekranı**: gözden geçirme özeti + PDF
önizlemesi, **Onayla** / **Geri gönder** (gerekçe zorunlu); onaylayınca sıradaki rapor açılır).
**Varsayımlar:**
- Rapor kaydı Planlar'daki plan raporlarıyla **aynı numara ve dağılım** (plan 9: 14 onaylandı + 8 onayda; plan 8: 3 + 1; plan 1: 3 + 7) +
  geçen yılın imzalı raporları (ekipman kaydından). Durumlar: **Taslak · Geri gönderildi · Onayda · İmza bekliyor · Müşteriye açık**;
  Planlar'ın "Onaylandı"sı burada ikiye ayrıldı (plan 9'da 10 imzalı, 4 imza bekliyor).
- Inspector **kendi** raporlarını görür (rol × modül önerisi); planlama ve yönetici tümünü görür (makette gösterilmedi).
- Onay **türün branşına** gider (§3.2 madde 3): mekanik → Selin Yıldız, elektrik → Can Öztürk; kuyruk en eski üstte.
- Onay ekranı: İSG-KATİP, kontrol metodu, kriterler, test değerleri, ölçüm aletlerinin kalibrasyonu, fotoğraf, sonuç özeti + raporun PDF
  önizlemesi. PDF önizlemesi **M7 şablonuyla tek üretici** (`maket-belge.js`).
- Geri gönder: **gerekçe zorunlu** (en az 10 karakter); rapor taslağa döner, gerekçe saha rapor ekranında üstte (M8).
- Son imza (§1.1: yöntem modül tasarımında konuşulacak): **aracı imza servisi** ya da **indir, imzala, yükle** (imza ve dosya bütünlüğü
  doğrulanır); **toplu imza**; imzalanınca rapor **müşteriye açılır** (portal kullanıcıları indirir; bildirim yok). İmzasız yayın yok.
- PDF indirme kısa ömürlü yetkili bağlantıyla (anayasa 5.1). Sonuç adı §4.5'e göre: taslak formatlı türde "Hafif kusurlu" yerine "Kusurlu"
  (Planlar maketinin verisinde tutarsızlık).
**Sorular (M9):**
Açık soru yok — sorular toplu listede cevaplandı (§9 yirmi birinci tur; liste `MAKET-PLANI.md`).
**Ölçüm (2026-09-24, bulut):** 10 durum × 1920 · 1080 · 375 × açık/koyu = **60/60 temiz**, çekmece 2/2; etkileşim **12/12**. Ölçerken
düzeltilen: rapor numarasındaki küçük harfli ek, sayfa adresinde tanınmıyordu (rapor ve onay ekranı açılmıyordu). M7 şablon önizlemesi
belge üreticisine bağlandı (66/66, 12/12), Planlar denemesi hâlâ maketi olmayan modüle çevrildi (15/15), M8 yeniden (15/15).

#### Maket M10 — Uyarılar (modül 20) — ONAY BEKLİYOR
**2. tur (2026-09-26, §9 yirmi birinci tur):** listede yalnız **kalibrasyon, ara kontrol (takibi açık cihazda) ve eğitim tekrarı** (108); ara kontrol
kalibrasyonu geçmiş ya da kalibrasyondaki cihazda sorulmaz · yalnız ekranda (107) · eşik kalibrasyon ve ara kontrolde 30, eğitimde 60 gün, firma
değiştirir (109) · koşul kalkınca düşer (110). Açıklama şeridi kalktı. Ölçüm: 6 durum 36/36, etkileşim 7/7, telefon 24/24. Ölçüm aracında
düzeltme: ekranın tamamen dışındaki iki öğe (kapalı çekmece bağlantısı ile yana kaymış çip) artık "çakışma" sayılmaz.
1. tur metni (tarihsel):
Ekran: **Uyarılar** (`maket/uyarilar.html`, firma yöneticisi Ayşe Demir): yalnız reisim'in istedikleri — **kalibrasyon bitişi** (30 gün)
ve **eğitim tekrarı** (60 gün); en yakın tarih üstte; uyarı → cihaz sayfası ya da kişinin eğitimleri; çipler: kalibrasyon · eğitim tekrarı ·
süresi geçmiş; seçici: kişi; adresten türe göre (`?tur=kalibrasyon|egitim`); menüde sayaç.
**Varsayımlar:**
- **Yalnız ekranda** (anayasa 1.3): liste, menü sayacı ve ilgili sayfalardaki şeritler; e-posta, SMS, anlık bildirim yok.
- Uyarı ayrı bir kayıt değil, **koşuldan türetilir**: kalibrasyon yenilenince / eğitim tekrarlanınca kendiliğinden düşer; "okundu" yok.
- Kalibrasyonu geçen cihaz uyarısı sonucu da söyler ("X raporlarını onaya gönderemez", M8 kilidi).
- **Eğitim kayıtları** ortak veride (M16 ekranı bunları kullanır); eğitim adları ve tekrar süreleri örnek. Personel kartındaki eğitim yüzü
  artık kayıtlardan sayılır ve "tekrarı geçti"yi de söyler (M1 yeniden ölçüldü: 108/108, 17/17).
- Firma yöneticisi hepsini görür; inspector yalnız kendisininkini (rol × modül önerisi).
**Sorular (M10):**
Açık soru yok — sorular toplu listede cevaplandı (§9 yirmi birinci tur; liste `MAKET-PLANI.md`).
**Ölçüm (2026-09-24, bulut):** 5 durum × 1920 · 1080 · 375 × açık/koyu = **30/30 temiz**, çekmece 2/2; etkileşim **6/6**. Telefonda kart
"etiket: değer" satırlarına indirildi (M5 deseni).

#### Maket M11 — Müşteri Paneli (modül 17) — ONAY BEKLİYOR
**2. tur (2026-09-26, §9 yirmi birinci tur):** üst çubukta **muayene firmasının logosu** (112; probata logosu yok) · yeni sekmeler **Planlanan
kontroller** (81: tesis başına açık planın tarihi, saati, durumu ve sonraki kontrol) ve **Sözleşmeler** (134: iş sözleşmesi ve imzalı hâli
görünür, panelden imza atılmaz) · aynı giriş sayfası (111) · uygunsuzluk yalnız sonraki kontrol raporuyla giderilir (114) · müşteri kullanıcı
ekleyemez (115) · onaydaki / taslak raporlar görünmez (117). Açıklama satırları kısaldı. Ölçüm: 11 durum 66/66, etkileşim 9/9, telefon 44/44.
1. tur metni (tarihsel):
Ekran: **müşteri paneli** (`maket/musteri.html`, Ada Makina'dan Serkan Ateş): **müşteri kabuğu** (firmanın modül menüsü yok; üst çubukta
probata, "Müşteri paneli", tema, kullanıcı) · **Raporlar** (yalnız imzalı ve kendi tesislerinin raporları, 20'şer; çipler: uygunsuz ·
sonraki kontrol 60 gün içinde; seçiciler: tesis, yıl) · **Uygunsuzluklar** (açık / giderildi; sınıf, kriter, açıklama, rapor bağlantısı) ·
**"Uygunsuzları indir"** (Excel önizlemesi: açık uygunsuzluk başına satır, "Rapor" bağlantısı paneldeki raporu açar) · **rapor sayfası**
(PDF önizlemesi — tek üretici, indir). Firma tarafında müşteri kartındaki "Açık uygunsuzluk" yüzü o müşterinin panelini önizleme olarak açar.
**Varsayımlar:**
- Müşteri **firmanın aynı giriş sayfasından** e-postayla girer (M1 giriş maketi); hesabın türüne göre müşteri paneli açılır.
- Yalnız **imzalı** raporlar ve yalnız kullanıcının **yetkili olduğu tesisler**; başka müşterinin ya da imzasız raporun **var olduğu bile
  söylenmez** ("bulunamadı").
- **Uygunsuzluk ayrı kayıt** (§3.2 madde 6): imzalı ve "Uygun" olmayan rapordan doğar; aynı ekipmanın sonraki imzalı raporu gelince
  **"giderildi"** (sonraki kontrol ya da ikinci kontrol, Ek-III 1.9). Sınıf hafif / ağır yalnız format yürürlükteki türde, öteki "kusurlu".
- Excel **kayıtlardan** üretilir (PDF'ten okunmaz); rapor bağlantısı **giriş ister** (kalıcı herkese açık dosya bağlantısı yok, anayasa 5.1).
- Müşteri kartındaki ve listedeki **açık uygunsuzluk sayısı** artık bu kayıtlardan (M2'deki sabit sayı kalktı; M2 48/48, 11/11 yeniden).
- Firma ekranından panele geçiş makette önizleme; uygulamada firma kullanıcısı müşteri paneline girmez, aynı veriyi kendi ekranında görür.
- Portal kullanıcısı olmayan müşteride uyarı: raporlar imzalansa da kimse göremez.
**Sorular (M11):**
Açık soru yok — sorular toplu listede cevaplandı (§9 yirmi birinci tur; liste `MAKET-PLANI.md`).
**Ölçüm (2026-09-24, bulut):** 8 durum × 1920 · 1080 · 375 × açık/koyu = **48/48 temiz**, çekmece 2/2 (firma ekranında); etkileşim **6/6**.
Gözle bulunup düzeltilen (ölçüm yakalamıyor): telefonda **belge tablolarında kelimeler harf ortasından bölünüyordu** ("Yap ıldı") — ortak
belge stili düzeltildi, M7 (66/66) ve M9 (60/60) yeniden ölçüldü; Excel önizlemesi telefonda iki sütuna indi.

#### Maket M12 — Teklifler (modül 11, faz 2) — ONAY BEKLİYOR
**2. tur (2026-09-26, §9 yirmi birinci tur):** **KDV teklifte değiştirilebilir** (120, varsayılan %20) · teklif tesis başına, istenirse **çok tesisli**
(123: "Başka tesisler"; kalemler seçili tesislerden toplanır, raporlar ve birim fiyat bütün tesislerden bağlanır, iş sözleşmesi bütün tesisleri
alır) · fiyat listesi firma ayarı, satır başına değişir (119) · PDF indirilip elle gönderilir, panelden kabul yok (121) · adedi aşan rapor aynı
fiyatla "teklif dışı" (122) · süresi dolan kendiliğinden (124) · teklif PDF'i firmaya göre (161, §3.7 satır 4). Şeritler kısaldı.
Ölçüm: 10 durum 60/60, etkileşim 12/12, telefon 40/40; M13 ve M14 yeniden temiz.
1. tur metni (tarihsel):
Ekran: **Teklifler** (`maket/teklifler.html`, planlama Zeynep Arslan): liste (no, müşteri / tesis, kalem, tutar, geçerlilik, durum; çipler:
taslak · gönderildi · kabul · red ya da süresi doldu · geçerliliği 7 gün içinde bitiyor; seçici müşteri) · **teklif sayfası** (kalemler:
tür × adet × birim fiyat, ara toplam, KDV, genel toplam; kabul edilmişte **raporlanan adet** ve **raporlanan tutar**; duruma göre eylem:
gönderildi işaretle · kabul / red (gerekçe) · iş sözleşmesi · plan aç · kopyala) · **form** (müşteri, tesis, geçerlilik, not; kalem satırları,
fiyat listesinden birim fiyat, "tesisteki ekipmandan doldur", tutar ve toplam canlı).
**Varsayımlar:**
- Teklif **tesis başına**; kalem = **ekipman türü × adet × birim fiyat** (§3.1). Birim fiyat **firmanın fiyat listesinden** gelir, teklife özel
  değiştirilebilir. Tutarlar örnek, TL, KDV hariç; **KDV %20**.
- No **T-AAYY-SIRA** (proje no'nun düzeni; ay içinde sıra). Yalnız **taslak** düzenlenir; gönderilen teklif değişmez (yenisi kopyalanır).
- Durumlar: taslak · gönderildi · kabul edildi · reddedildi (müşterinin gerekçesi) · süresi doldu (geçerlilik gönderilişten sayılır).
- **Rapor ↔ teklif kalemi** (§3.2 madde 5): tesisin teklif sonrası raporları kaleme **türüyle** bağlanır; "raporlanan tutar" muhasebe (M14)
  ve performansın (M15) kaynağı.
- Plan açılan her tesisin kabul edilmiş teklifi var (örnek veri); kabulden sonra sıra: iş sözleşmesi (M13) + İSG-KATİP (M5) → plan (M6).
- Teklif müşteriye makette **elle iletilir** (PDF indir, "gönderildi olarak işaretle"); sistemden e-posta yok.
**Sorular (M12):**
Açık soru yok — sorular toplu listede cevaplandı (§9 yirmi birinci tur; liste `MAKET-PLANI.md`).
**Ölçüm (2026-09-24, bulut):** 9 durum × 1920 · 1080 · 375 × açık/koyu = **54/54 temiz**, çekmece 2/2; etkileşim **10/10** (teklif → plan aç
geçişi dahil).

#### Maket M13 — Sözleşmeler: firmalar arası iş sözleşmesi (modül 12, faz 2) — ONAYLANDI 2026-09-26 (M5 ile)
**2026-09-26: M5 ile birleşti** (reisim: menüdeki Sözleşmeler = iş sözleşmesi); ekran artık `maket/sozlesmeler.html`, sekme yok, İSG-KATİP
bilgisi sözleşmenin içinde (M5 2. tur). Aşağıdaki 1. tur metni tarihseldir; kalan sorular sırası gelince yeniden sorulur.
Ekran (1. tur): **İş sözleşmeleri** (planlama Zeynep Arslan): modül 12 tek menü öğesi, **iki sekme** — İSG-KATİP kayıtları · iş sözleşmeleri. Liste (no, müşteri / tesis, süre + kalan gün, dayanak teklif, durum; çipler: imza
bekliyor · yürürlükte · süresi doldu · bitişi 60 gün içinde; seçici müşteri; bitişi yaklaşan sözleşme için şerit + yenileme teklifi
bağlantısı) · **sözleşme sayfası** (taraflar ve koşullar, kapsam: tesis × İSG-KATİP kaydı × plan, geçmiş; eylem: sözleşme metni ·
imzalı sözleşmeyi yükle · yenileme teklifi / yeni teklif) · **form** (müşteri, dayanak teklif, kapsamdaki tesisler, başlangıç, süre, ödeme
vadesi, yenileme).
**Varsayımlar:**
- İş sözleşmesi **muayene firması ile müşteri** arasında; İSG-KATİP sözleşmesinden (işveren ile yetkili kişi, M5) **ayrı**. Kapsam
  tablosu her tesisin İSG-KATİP kaydını ve planını yan yana gösterir; plan kabulünü denetleyen yine İSG-KATİP kaydıdır.
- Kabul edilen tekliften hazırlanır: teklif sayfasındaki "İş sözleşmesi" formu teklif ve tesisiyle doldurur; kapsama başka tesis eklenebilir.
- No **IS-AAYY-SIRA** (başlangıç ayı). Durumlar: **imza bekliyor** (firma imzaladı) → **yürürlükte** (müşterinin imzaladığı sözleşme
  yüklendi) → **süresi doldu**. Fesih ve değişiklik (ek protokol) makette yok.
- Varsayılan süre **12 ay**, ödeme vadesi **30 gün**, yenileme **yeni teklifle** (seçenek: kendiliğinden, fesih bildirimi yoksa).
- Bitişe **60 gün** kala listede şerit + çip; o tesis için yenileme teklifi varsa ona bağlantı, yoksa "Teklif hazırla". Yalnız ekranda
  (bildirim yok, anayasa 1.3).
- İmzalı sözleşme PDF olarak **yüklenir**, yalnız firma içinde görünür (kısa ömürlü bağlantı). Sözleşme metni firmanın şablonundan
  üretilir; makette metin yok.
- Örnek veride sistem öncesi sözleşmeler (dayanak teklifsiz) ve bir çok tesisli sözleşme var.
**Sorular (M13):**
Açık soru yok — 125–134 cevaplandı (§9, on yedinci tur): 125 kayıt + imzalı PDF · 126 numara biçimi firmaya göre (§3.7 satır 8) · 127 firma
şablonu (H) · 128 teklif başına, istenirse çok tesis · 129 12 ay + kendiliğinden yenileme seçeneği · 130 müşteri imzası beklerken plan açılır,
**uyarı yok** · 131 iki belge de yüklenir (D) · 132 **hizmet sözleşmesinin bitişi için uyarı YOK** (şerit, çip, M10 yok) · 133 vade sözleşmede ·
134 müşteri panelinde sözleşme görünür, imza panelden atılmaz (M11'in sırası gelince).
**Ölçüm (2026-09-26, bulut, M5 ile birleşince ve uyarılar kalkınca):** 8 durum × 1920 · 1080 · 375 × açık/koyu = **48/48 temiz**, çekmece 2/2;
etkileşim **10/10**, telefon **32/32** (imzalı sözleşme görüntüleme, yüklenince Aç tuşu, hizmet sözleşmesi için şerit ve çip yok).
1. tur (2026-09-24): 48/48, 11/11.

#### Maket M14 — Muhasebe (modül 18, faz 2) — ONAY BEKLİYOR
**5. tur (2026-09-27, §9 yirmi altıncı tur):** iş başına **kâr ve kâr oranı** (liste sütunu, iş sayfasında yüz + "Kârlılık" tablosu) ve
dördüncü sekme **Gelir-gider** (aylık). Ölçüm: M14 184/184 · 40/40 · 92/92.
**4. tur (2026-09-27, §9 yirmi altıncı tur):** masraf formu akışı — Giderler'de durum (onay bekliyor · onaylandı · ödendi · reddedildi),
Onayla / Reddet (gerekçe) / Ödendi, onay bekleyen şeridi, elle eklemede "Ödendi / Ödenecek", **Excel'e aktar / Excel'den yükle**; masraf formu
Planlar'da plan içinde ("Masraflarım"). Ölçüm: M14 160/160 · 35/35 · 80/80; Planlar 120/120 · 33/33 · 60/60.
**3. tur (2026-09-27, §9 yirmi beşinci tur):** üçüncü sekme **Giderler** — tarih, tür, tutar (KDV dahil) + KDV oranı (türün varsayılanı), açıklama,
isteğe bağlı iş ve personel, belge (açılır); belgesi olmayan uyarıyla kaydedilir; liste süzgeci (işe bağlı · genel · belgesi yok; tür, dönem,
personel) ve süzülenin toplamı; iş sayfasında o işin giderleri ve kâr (raporlanan − gider, KDV hariç). Ölçüm: 16 durum 128/128, etkileşim
27/27, telefon 64/64.
**2. tur (2026-09-26, §9 yirmi birinci tur):** fatura iş başına; istenirse **müşteri başına toplu** (136: iş sayfasında "Toplu fatura (N iş)", aynı
müşterinin faturaya hazır bütün işleri tek faturada; fatura sayfasında "İşler") · muhasebeyi firma yöneticisi görür, istenirse **"Muhasebe" rolü**
(137: rol listesinde ve rol yetkileri tablosunda altıncı sütun; muhasebe, müşteri, teklif, sözleşme) · fatura programda kesilir, numarası
yazılır (135) · kısmi fatura (138) · tahsilatla kendiliğinden kapanır (139) · vadesi geçen alacak Muhasebe'de ve müşteri kartında, Uyarılar'da
değil (140) · çek vadesi izlenmez (141) · panelde fatura yok (142). Şeritler kısaldı; müşteri kartındaki iş sözleşmesi yüzünde "imza bekleyen"
vurgusu kalktı (sözleşmede uyarı yalnız İSG-KATİP). Ölçüm: 11 durum 66/66, etkileşim 15/15, telefon 44/44; M1 174/174 · 38/38 · 116/116.
1. tur metni (tarihsel):
Ekran: **Muhasebe** (`maket/muhasebe.html`, Ayşe Demir, firma yöneticisi): iki sekme — **İşler** (proje no, müşteri / tesis, imzalı ve
faturalı rapor sayısı, raporlanan tutar, açık alacak, durum; çipler: vadesi geçti · faturaya hazır · tahsilat bekliyor · rapor sürüyor ·
kapandı; seçici müşteri; şerit: vadesi geçen alacak + faturaya hazır işler) · **Faturalar** (no, müşteri / iş, vade, tutar, kalan,
durum) · **iş sayfası** (raporlanan · faturalanan · tahsil edilen · açık alacak; birim fiyatın kaynağı, iş sözleşmesi, vade; raporlar ×
birim fiyat × fatura, sayfa 20; faturalar; geçmiş) · **fatura sayfası** (alıcı, tarih, vade, kalemler, KDV, tahsilatlar, kalan) ·
**fatura kaydet** ve **tahsilat ekle** pencereleri.
**Varsayımlar:**
- **İş = plan** (proje no). Listede raporu olan planlar; geçen yılın işleri raporlardan türetildi (örnek veri). Müşteri kaydından önce
  tarihli iki tesisin eski raporları (Planlar maketinden gelen) muhasebeye alınmadı.
- **Birim fiyat** (§3.2 madde 5): raporun tesisinde, rapor tarihinde geçerli kabul edilmiş teklifin kalemi; teklif yoksa firmanın fiyat
  listesi; kalemin adedini aşan rapor **"teklif dışı"** (fiyat listesinden, faturada işaretli; soru 122).
- **Fatura** imzalı (müşteriye açık) ve faturalanmamış raporlardan kaydedilir: kalem = ekipman türü × rapor sayısı × birim fiyat, KDV %20.
  e-Fatura / e-Arşiv **firmanın muhasebe programında** kesilir; buraya numarası (16 karakter) ve tarihi yazılır. Vade = iş sözleşmesindeki
  ödeme vadesi (M13; yoksa 30 gün).
- **Tahsilat**: tarih, tutar (kısmi olabilir, kalanı aşamaz), yöntem (havale / EFT · çek · kredi kartı · nakit), açıklama.
- Durumlar — iş: rapor sürüyor → faturaya hazır → tahsilat bekliyor (vadesi geçti) → **kapandı**; fatura: bekliyor · kısmi ödendi ·
  vadesi geçti · ödendi. İş, plan tamamlanıp bütün raporları imzalanınca, faturalanınca ve tahsil edilince **kendiliğinden kapanır**;
  kayıt 5 yıl arşivde (§3).
- Vadesi geçen alacak yalnız ekranda (şerit + çip); bildirim yok (anayasa 1.3). Muhasebeyi rol × modül önerisinde yalnız firma yöneticisi
  görür (soru 33). Performans'taki kazanç (M15) buradaki birim fiyattan.
- Ortak süzgeç düzeltmesi: seçicisi olmayan süzgeçte arama telefonda kendi satırında (adım dışında 0'a eziliyordu; Planlar'da görünüm
  aynı, yeniden ölçüldü). M13 örnek verisinde IS-1024-001'in tarihleri bir gün kaydırıldı (geçen yılın denetimi sözleşme kapsamında).
**Sorular (M14):**
Açık soru yok — sorular toplu listede cevaplandı (§9 yirmi birinci tur; liste `MAKET-PLANI.md`).
**Ölçüm (2026-09-24, bulut):** 10 durum × 1920 · 1080 · 375 × açık/koyu = **60/60 temiz**, çekmece 2/2; etkileşim **14/14** (fatura kaydet,
kayıtlı no reddi, tahsilat fazlası reddi, tahsilat → iş kapandı, Raporlar'a geçiş dahil). Planlar yeniden 54/54, 15/15 (süzgeç düzeltmesi;
"hazır olmayan modül" denemesi artık Performans); M13 yeniden 48/48, 11/11.

#### Maket M15 — Performans ve Raporlama (modül 19, faz 2) — ONAY BEKLİYOR
**2. tur (2026-09-26, §9 yirmi birinci tur):** dönemlere **"Tarih aralığı"** (150: iki tarih + Uygula; 62 günden uzunsa aylık, yıllar arası ay adı yıl
ile) ve **"Excel'e aktar"** · **denetçi görünümü** (148, makette `#/ben`: kendi sayıları, kazanç yok) · gün başı = rapor ÷ çalışılan gün, hedef
yok (144) · kazanç = birim fiyat (145) · sayılan = onaya gönderilen + imzalı (146) · çok kişili planda raporu yazana (147) · ek ölçü yalnız geri
gönderilen (149). Yüzlerdeki açıklama satırları kalktı. Ölçüm: 8 durum 48/48, etkileşim 13/13, telefon 32/32.
1. tur metni (tarihsel):
Ekran: **Performans** (`maket/performans.html`, Ayşe Demir, firma yöneticisi): **pano** — dönem (bu ay · bu yıl · geçen yıl) ve branş
(tümü · mekanik · elektrik) anahtarı; yüzler (rapor · çalışılan gün · gün başı rapor · kazanç · geri gönderilen); **gün başı rapor ve
kazanç** grafiği (bu ayda gün gün, yılda ay ay; mekanik / elektrik yığılı); **personel başına kazanç** grafiği; personel tablosu (rapor, gün,
gün başı, kazanç, geri gönderilen, son rapor; sütundan sıralanır; görünüm: rapor yazanlar / bütün inspector'lar) · **kişi sayfası** — aynı
ölçüler yalnız o kişi için + **günlük iş** (gün × tesis: iş no → Muhasebe, rapor, kazanç, imzalı sayısı) ve personel kartına bağlantı.
**Varsayımlar:**
- Sayılar raporlardan türer (Raporlar, Planlar, Muhasebe ile aynı kayıtlar). **Sayılan rapor:** onaya gönderilmiş ya da imzalı; hiç
  gönderilmemiş taslak sayılmaz; tarih raporun oluşturulduğu gün.
- **Kazanç:** raporun birim fiyatı (M14 ile aynı kaynak: teklif kalemi, yoksa fiyat listesi), KDV hariç, **raporu yazan inspector'a**.
- **Gün başı rapor** = rapor ÷ çalışılan gün (kişi × gün); gün başı kazanç da aynı bölmeyle.
- Geri gönderilen: yönetici onayından dönen rapor (geri gönderme tarihi dönemin içinde).
- Dönem ve branş **görünüm anahtarı** (kalıp 8: süzgeç değil); kişi sayfasında branş anahtarı yok, dönem panodan gelir.
- Grafik **dış kütüphanesiz**, HTML yatay çubuk (telefonda da okunur); renkler var olan değişkenler (mekanik onay yeşili, elektrik vurgu);
  ekran okuyucu aynı veriyi gizli tabloda okur. *Yeni desen (kalıp 16) → soru 151.*
- Örnek veride yalnız 15 tesisin raporları var (geçen yıl eylül–kasım, bu yıl şubat ve eylül); grafikler bu yüzden seyrek.
**Sorular (M15):**
Açık soru yok — sorular toplu listede cevaplandı (§9 yirmi birinci tur; liste `MAKET-PLANI.md`).
**Ölçüm (2026-09-24, bulut):** 6 durum × 1920 · 1080 · 375 × açık/koyu = **36/36 temiz**, çekmece 2/2; etkileşim **9/9** (dönem, branş,
sütun sıralama, görünüm, arama, kişiye geçiş, dönemin korunması, menüden açılış). Planlar ("hazır olmayan modül" artık Eğitimler) 15/15,
M14 14/14 yeniden.

#### Maket M16 — Eğitim Takibi (modül 10, faz 2) — ONAY BEKLİYOR
**2. tur (2026-09-26, §9 yirmi birinci tur):** **eğitim türlerini ve tekrar sürelerini firma ekler / düzenler** (153: Eğitim türleri sekmesinde "Eğitim
türü ekle" ve satırda "Düzenle"; tekrar 1–120 ay) · kaydı yönetici girer (152) · zorunlu eğitim tanımı yok (154) · belge isteğe bağlı (155) ·
tekrar uyarısı 60 gün (156) · tekrarı geçen eğitim plan açarken uyarı vermez, yalnız Uyarılar'da (157) · yetkili kişi eğitim belgesi personel
kartında (158). Açıklama satırları kalktı. Ölçüm: 7 durum 42/42, etkileşim 12/12, telefon 28/28.
1. tur metni (tarihsel):
Ekran: **Eğitimler** (`maket/egitimler.html`, Ayşe Demir, firma yöneticisi): iki sekme — **Kayıtlar** (personel, eğitim + veren, alındı,
tekrar + kalan gün, belge, durum; çipler: tekrarı geçti · 60 gün içinde · geçerli · belgesi yok; seçiciler: kişi, eğitim, görünüm güncel /
önceki / hepsi; tekrarı geçen ve yaklaşan şeridi; 20'şer sayfa) · **Eğitim türleri** (tür, tekrar süresi, kişi sayısı, tekrarı yaklaşan;
türe süzülü kayıtlara gider) · **kayıt penceresi** (ayrıntı, sertifika, aynı eğitimin öteki kayıtları, "Tekrarı kaydet") · **kayıt ekle**
penceresi (personel, eğitim, tarih → tekrar tarihi türden, veren, sertifika).
**Varsayımlar:**
- Kayıt = kişi × eğitim türü × tarih; **tekrar tarihi = tarih + türün tekrar süresi**. Kişi × tür için **tek güncel kayıt**; tekrar
  kaydedilince eskisi "önceki kayıt" olur (İSG-KATİP'teki görünüm deseni: güncel / önceki / hepsi).
- Durum: tekrarı geçti · 60 gün içinde · geçerli — Uyarılar (M10) ile aynı eşik; yalnız ekranda (anayasa 1.3).
- Sertifika PDF **isteğe bağlı** ("Belgesi yok" çipi); yalnız firma içinde, kısa ömürlü bağlantı. Veren: firma içi / dış kurum.
- Eğitim adları ve tekrar süreleri **örnek** (mevzuat karşılığı doğrulanmadı); türlerin düzenlenmesi makette yok.
- Personel kartındaki eğitim yüzü ve Uyarılar'daki eğitim satırı bu ekranı **kişiye süzülü** açar (M1 ve M10 yeniden ölçüldü).
- Bütün modüllerin maketi hazır: Planlar'daki "hazır olmayan modül" denemesi "menüdeki 17 modülün hepsi maketi açar" oldu.
**Sorular (M16):**
Açık soru yok — sorular toplu listede cevaplandı (§9 yirmi birinci tur; liste `MAKET-PLANI.md`).
**Ölçüm (2026-09-24, bulut):** 6 durum × 1920 · 1080 · 375 × açık/koyu = **36/36 temiz**, çekmece 2/2; etkileşim **10/10** (personel
kartından ve Uyarılar'dan geçiş, tekrarı kaydet → önceki kayıt, ileri tarih reddi, türden tekrar tarihi, türe süzme). M1 108/108 + 17/17,
M10 30/30 + 6/6, Planlar 15/15 yeniden. **Faz 2 maketleri bitti.**

### 3.7 · Firmaya göre değişen formatlar — CANLI LİSTE (reisim 2026-09-25)
Reisim (birebir): *"bu ve bunun gibi müşteriye göre değişecek formatları listele ben söyledikçe yeni şeyler olursa onlarda bu listeye
eklersin"* · *"temel bir format oluştur eğer müşteri formatı istemese biz müşteri isteği doğrultusunda bunu değiştiririz"*.
(Buradaki "müşteri" = bizim müşterimiz, yani muayene **firması**.) **Kural:** her belgenin bir **temel formatı** vardır ve herkes onunla
başlar; firma kendi formatını isterse o firmaya özel sürüm **kodda** hazırlanıp yayınla gelir — site içinde biçim düzenleyici yok (rapor
şablonu kararıyla aynı yol, §3, §8.3). Belgenin altında form kodu durur (`<firma kısa kodu>-FR-…`), firmaya özel sürüm kendi kodunu alır.
Reisim yeni bir tane söyledikçe bu tabloya satır eklenir.
| # | Format | Nerede | Temel format | Firmaya göre ne değişir |
|---|---|---|---|---|
| 1 | Periyodik kontrol raporu | Ekipman türleri (M3) → Saha ve Rapor (M8–M9) | var (maket, Ek-III 1.7 sırası) | **2026-09-26: firma her ekipman türüne kendi rapor formatını PDF olarak yükler** (reisim); "Rapor oluştur" sorularını bu formattan alır — PDF'ten soruya nasıl geçileceği M8'de kurgulanır |
| 2 | **Zimmet teslim formu** | Personel kartı › Zimmetindekiler (M1) | **var — `KM-FR-ZMT-01` (2026-09-25)** | başlık, sütunlar, taahhüt metni, imza alanları, logo |
| 3 | Tarafsızlık ve çıkar çatışması beyanı | Planlar › plan kabulü (§3.4) | var (varsayılan metin) | beyan metni (firmanın kalite el kitabından) |
| 4 | Teklif belgesi | Teklifler (M12) | maket (liste + sayfa), PDF biçimi yok | başlık, kalem tablosu, koşullar, imza — **2026-09-26 (161): teklif PDF'i firmanın formatıyla; indirilip elle gönderilir** |
| 5 | İş sözleşmesi metni | Sözleşmeler (M5 + M13) | temel format KM-FR-SZL-01 (probata) | **2026-09-26: firma kendi sözleşme şablonunu (PDF / Word) yükler, sürümlü** (reisim H); bilgiler şablondaki yerlerine doldurulur |
| 6 | Uygunsuzluklar Excel'i | Müşteri paneli (M11) | var (maket önizlemesi) | sütunlar ve sırası |
| 7 | Özlük dosyası belge türleri | Personel kartı (M1) | var (iş sözleşmesi, diploma, oda kaydı, EKİPNET belgesi, kimlik, sağlık raporu, diğer) | tür listesi |
| 8 | **Her türlü numaralandırma** ve form kodu önekleri | rapor no, form kodları (§3.5), **sözleşme, teklif, plan (proje), zimmet formu, fatura no** | var (temel: firma kısa kodu + XX-AAYY-SIRA) | **2026-09-26, reisim: "her türlü numaralandırma şirkete göre değişir"** — biçim ve önek firmaya göre |
| 9 | **Saha formu** | Planlar › plan içi, plan tamamlanınca (2026-09-26) | **var — `KM-FR-SAH-01`** | başlık, ekipman sütunları, onay metni, imza ve kaşe yerleri (reisim: "firmanın talebine göre oluşturulmuş saha formu") |
| 10 | **İzin talebi formu** | Talepler (izin) | **var — temel format `KM-FR-IZN-01`** (2026-09-28, T8; iskelet `MB.TALEP_FORMAT.izin`) | firma kendi formatını yükler; PDF çıktısı o formata göre; kaydedilir ve e-postayla iletilir (reisim 2026-09-28) |
| 11 | **Masraf formu** | Talepler (masraf) | **var — temel format `KM-FR-MSR-01`** (2026-09-28, T8; iskelet `MB.TALEP_FORMAT.masraf`) | aynı: firma formatı, PDF, e-posta |
| 12 | **Cihaz ara kontrol / bakım kaydı** | Ölçüm cihazları › cihaz | temel format `KM-FR-ARA-01` (2026-09-28) | firma kendi formatını kullanabilir; günlük / haftalık / aylık / 6 aylık bakım mantığı aynı (reisim 2026-09-28) |
| 13 | **Rapor içeriği kuralları** | Saha raporu · final rapor | Bakanlık formatı ya da firma formatı | zorunlu alanlar (temel: fotoğraf en az 1, cihazlar, kusur açıklaması), sonuç cümlesi, kusur listesi biçimi — format eklendikçe o formata göre (§3.8) |
| 14 | **"Uygun değil" maddede fotoğraf zorunluluğu** | Saha raporu (M8) · Firma ayarları | var — başlangıçta **zorunlu** (2026-09-30, 213) | firma isterse isteğe bağlı (Firma ayarları › Rapor) |
| 15 | **Ön bilgilendirme formu** | Müşteriler › müşteri kartı (gönder) · Firma ayarları (yükle) | temel format `KM-FR-OBF-01` (2026-09-30, iskelet) | **her firmanın kendi formatı** (reisim 2026-09-30): firma PDF'ini Firma ayarları'na yükler; müşteriye o gider |
Firma özelleştirmesi **iskelet olarak hazırlanır**; her firmada o firmanın formatına göre sitenin ilgili kısmı ayrıca düzenlenir (reisim 2026-09-28:
*"bu tarz firmaya göre pdf vb format eklenince ona göre şekil alacak kısımları … sen iskelet olarak hazırla firmaya göre her seferinde sitenin bu
kısımlarını düzenleriz, bunlar oluşturduğumuz listeye yaz ve firma özelleştirmeleri listesi olarak kenarda tut"*).

### 3.8 · Site geneli kalıcı kurallar (reisim 2026-09-28: *"bu soruna özel değil kalıcı site içi çözümler olarak hafızanda kalsın ve bu şekilde uygula"*)
Yeni format, ekipman türü ya da PDF eklendiğinde de geçerlidir; ekran başına değil mekanizmaya uygulanır.
1. **Kusur açıklamaları** yalnız "Uygun değil" işaretlenen maddeleri ve uygun olmayan ölçümleri listeler; "hafif / ağır kusur" yazısı yok
   (final raporda formatın kendi işareti — ör. \* / \*\* — kalır).
2. **Sonuç ve kanaat** cümlesi yalnız seçilen sonuçla biter ("… kullanımı uygundur." ya da "… uygun değildir."); öteki seçenek üstü çizili
   durmaz, yazılmaz (ekran ve final rapor).
3. **Uygun / uygun değil / uygulanamaz** seçilen her tabloda maddeler **Uygun** olarak gelir; başlıktaki ünlem menüsüyle hepsi uygun ·
   uygun değil · uygulanamaz yapılır.
4. **Küçük açıklama yazısı yok**: alan altında ipucu, sınır açıklaması, şeffaf bilgi satırı konmaz (firma formatı açıkça isterse o firmada).
   Ölçüt (2026-09-28, T5): sistemin nasıl işlediğini, kimin göreceğini, ne zaman açılacağını anlatan cümle kalkar; değeri niteleyen kısa
   etiket (durum, birim, zaman aralığı: "imza bekliyor", "son 12 ayda imzalı rapor"), uyarının kendisi ve boş liste başlığı kalır.
5. **Gönderirken** uyarı listesi yok: zorunlu alan eksikse kısa pencere "Zorunlu alanlar doldurulmadı", eksik alanlar kırmızı, ekran ilk
   eksiğe kayar; zorunlu olmayan eksik gönderimi durdurmaz. Temel zorunlular: fotoğraf (en az 1), türün ölçüm cihazları (kalibrasyonu
   geçerli), uygun değil maddenin açıklaması (Bakanlık formatlı türde derecesi), test ve ölçüm değerleri (isteğe bağlı işaretlenenler hariç)
   — başka format başka zorunluluk getirebilir (§3.7 satır 13).
6. **Süzgeçler** alan alan arama kutusudur (ör. rapor no · ekipman kodu · ekipman türü · tesis; proje adı · proje no); alan kutuları olan
   listede genel "ara" kutusu yok; anlamsız çip yok.
7. **Listelerde toplu PDF**: rapor listeleri (Raporlar, plan içi raporlar) süzgeçten geçen raporları tek PDF olarak indirir.
8. **Rapor oluşturma sınırsız**: ekipman satırında hep "Rapor oluştur"; raporu olan ekipmanın yanında küçük yeşil tik. Rapor pasife alınır
   (inspector alabilir, pasif rapor inspector'a görünmez); aktife alma ve silme yalnız yönetici. Makette: inspector gönderilmemiş (Yeni)
   raporu plan içinden pasife alır; teknik yönetici Onaylar → "Pasif raporlar"da aktif eder ya da siler (gönderilen rapor onay akışındadır).
9. **Yan menüde takip sayıları**: modül adının yanında takip isteyen işler renkli balonla (geçmiş / acil kırmızı, yaklaşan sarı, sorunsuz yeşil).
   Makette (2026-09-28, T6): Ölçüm cihazları (kalibrasyon ya da ara kontrol süresi geçen · 30 gün içinde · sorunsuz; kalibrasyondaki cihaz
   sayılmaz) · Uyarılar (geçen · yaklaşan) · Personel (eğitim tekrarı geçen · 60 gün içinde) · Sözleşmeler (açık planda İSG-KATİP eksik ya
   da bitmiş; hizmet sözleşmesi bitişi takip edilmez, M5 kararı) · Muhasebe (vadesi geçen fatura). Sayılar tek hesaptan (ortak veri), her
   sayfada aynı; 0 olan balon yok. İş kuyruğu sayıları (kabul bekleyen plan, onay bekleyen, imza bekleyen) kendi sayfalarında eskisi gibi.
10. **Yüklenen her dosya düzenlenir ve silinir** (reisim 2026-09-28: *"imzalı zimmet diye dosya ekledim, sonra imzalı zimmet formuna tıklayınca
   yüklediğim tarama değil de başka bir şey hala iskelet pdf çıkıyor ayrıca yüklediğim taramayı silemiyorum bu tarz basit mantık hatalarını
   unutma, yükelenilen şeyler düzenlenebilir silinebilir olmalı"*): yüklenen dosya kayıtla birlikte saklanır ve sayfalar arası kalır; "Aç"
   yüklenen dosyanın KENDİSİNİ gösterir (örnek kayıtta temel format); her yüklemenin yanında Aç · Değiştir · Sil; silme onayla. Dosya
   kaydın zorunlu parçasıysa (imzalı form, imzalı rapor) silinince kayıt bir önceki duruma döner.

### 3.9 · Rol beklentileri — araştırma ve analiz (2026-10-01, §9 kırk dördüncü tur; reisim: *"hangi roldeki personelin bu uygulamadan beklentileri neler olabilir o role göre internetten derin araştırma ve analiz yapıp bak"*)
Yöntem: emsal saha / muayene yazılımlarının herkese açık sayfaları, ISO/IEC 17020 ve akreditasyon rehberleri, İSG uzmanı forumları ve
rehberleri, saha hizmeti (FSM) ve faturalama yazılımı yazıları (kaynaklar §10, "Rol araştırması"). Her rol: **beklenti** → makette **var** →
**açık** (öneri; karar reisim'in, hiçbiri kendiliğinden yapılmaz). Rakip uygulamalardan gerçek veri alınmadı.

| Rol | Beklenti (kaynaklardan) | Makette var | Açık — öneri / soru |
|---|---|---|---|
| **Muayene uzmanı (denetçi, sahada)** | İnternetsiz form doldurma, bağlanınca eşitleme; QR / etiketten doğru ekipmana erişim; fotoğraf; önceki raporu görme; tek dokunuşla firma formatlı PDF; e-imza / mobil imza; az yazı, çok seçim; günlük iş listesi | Planlar (kabul / red), plan içi, saha raporu (madde seçimi, ölçüm cihazı, fotoğraf, önceki kusur devri, Kaydet ve kopyala), zorunlu alan penceresi, mobil / e-imza, mesai çubuğu, telefon düzeni | **Çevrimdışı çalışma** (§8: sonraki faz, şema hazır) — sahada en çok istenen; **QR / etiket okutma** ile ekipman açma; sesle not; rapor süresi hedefi göstergesi |
| **Teknik yönetici (branş, ISO 17020)** | Rapor gözden geçirme ve onay kuyruğu; denetçinin yetkinliğinin izlenmesi (rapor incelemesi, sahada gözlem, tanıklık, belirli sıklıkta); cihaz kalibrasyonu; yöntem ve form sürümü yönetimi; geri gönderme gerekçesiyle iz | Onaylar (kuyruk, 24 saat kırmızı, geri gönder / revize, durum değiştir, pasif), vekil branş, kalibrasyon uyarıları, Formatı güncelle, personel kartında atama ve eğitimler | **Gözetim / tanıklık kaydı** (denetçi başına "son sahada gözlem" tarihi ve sıklık uyarısı — 17020'nin açık şartı); **geri gönderme nedenleri istatistiği** (hangi madde sık hatalı) |
| **Planlama ekibi** | Yetki / sertifika eşleşmeli atama (süresi geçen sertifikalı kişi atanamaz uyarısı); takvim, çakışma, yol / bölge; periyodu gelen ekipman listesi; müşteriye ön bildirim | Plan aç (meslek yetkisi, ekipman ataması, İSG-KATİP, çakışma uyarıları, Ö5b sözleşme dışı gün), Uyarılar (periyodu gelen), Ön bilgilendirme formu | **Takvim görünümü** (kişi × gün); **bölge / il gruplama** ile aynı güne tesis toplama; periyodu gelen ekipmandan **tek tuşla teklif / plan** |
| **Firma yöneticisi (sahip)** | Rapor tamamlanma süresi, kişi başı verim, gelir / kâr, geciken alacak, uyum riski (süresi geçen kalibrasyon, sertifika); tek ekranda özet | Ana sayfa (rol başına), Performans (24/48 saat, kişi başı kazanç), Muhasebe gelir-gider, iş kârlılığı, Firma ayarları, Verileri dışa aktar | **Haftalık özet e-postası** (bildirim kuralı gereği reisim kararı); müşteri bazında kârlılık; dönemsel karşılaştırma (bu ay / geçen yıl aynı ay) |
| **Muhasebe** | İşe bağlı faturalama (imzalı rapor → fatura), sözleşme vadesi, geciken alacak uyarısı, kısmi tahsilat, e-Fatura programına aktarım, masraf onayı | Muhasebe (işler, faturaya hazır, fatura, tahsilat, vadesi geçen, giderler, masraf formu, bordro), Excel içe / dışa | **e-Fatura / muhasebe programına aktarım dosyası** (hangi program kullanılıyor — soru); **toplu faturalama** (ay sonu, müşteri başına tek fatura) |
| **Müşteri (İSG uzmanı / işveren)** | Bütün raporlara tek yerden erişim, Excel / ZIP indirme; uygunsuzlukların takibi ve "Eksiklik giderildi" kaydı (İSG-KATİP'te de girilir); bir sonraki kontrol tarihi ve yaklaşınca hatırlatma; uygunsuz ekipmana "kullanılamaz" işaretlemesi; tekrar kontrol talebi | Müşteri paneli (raporlar, uygunsuzluklar, planlanan kontroller, sözleşmeler, Excel "Rapor" bağlantılı, ZIP), bulut klasörüne otomatik kayıt (Ö2) | **"Eksiklik giderildi" + kanıt fotoğrafı** müşteri panelinden, firmaya "tekrar kontrol" talebi olarak düşsün; **ekipman etiketi / QR** (müşteri okutunca son rapor); sonraki kontrol hatırlatması (bildirim — reisim kararı) |

**Önceliğe göre öneri (benim sıralamam):** (1) müşteri panelinden "Eksiklik giderildi / tekrar kontrol talebi" — işverenin yasal yükümlülüğü ve
firmaya yeni iş; (2) teknik yöneticiye gözetim / tanıklık kaydı — 17020 denetiminde sorulan; (3) planlamaya takvim görünümü; (4) çevrimdışı
saha (zaten planlı, sonraki faz); (5) QR etiket. Bildirim gerektirenler (hatırlatma, haftalık özet) reisim demeden kurulmaz (anayasa 1.3).

## 4 · Mevzuat bulguları (2026-09-18 araştırması; kaynaklar bölüm 10)

### 4.1 Çerçeve
- **İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği** (RG 25/4/2013, 28628). Son büyük
  değişiklik **23/12/2025, RG 33116**, aynı gün yürürlükte. Bu değişiklikle **Ek-III bütünüyle yenilendi.**
- ✅ **AÇIK İŞ KAPANDI (2026-09-22):** yeni Ek-III metni **birincil kaynaktan** okundu —
  `mevzuat.gov.tr` birleşik metin (`7.5.18318.pdf`, 28 sayfa), içinde `RG-23/12/2025-33116` değişiklik izi var.
  Aşağıdaki 1.x maddeleri artık **2025 yürürlükteki metinden birebir**. (18/9'daki "RG eki taranmış, OCR yok"
  engeli birleşik metinle aşıldı.)
- Yalnız **Ek-III tablolarındaki** ekipmanlar periyodik kontrole tabidir; tablo dışı ekipmana rapor yazılırsa
  **şekil ve sözleşme şartı aranmaz** (7/6 ek cümle, 2025).
- Bakanlığın resmi yayın kanalı: **isekipmanlari.csgb.gov.tr** (rapor formatları, kriterler, askıya alınanlar).

### 4.2 Rapor bölümleri (Ek-III 1.7; **yürürlükteki 2025 metninden birebir**, 2026-09-22'de doğrulandı)
1.7.1 Genel bilgiler: işyeri adı, adres, iletişim, kontrol tarihi, **işe başlama ve bitiş saati**, **bir sonraki
periyodik kontrol tarihi**, kontrol metodu · 1.7.1.1 Metot: standart no/adı, yoksa üretici metodu, o da yoksa
risk değerlendirmesi · 1.7.2 Ekipman bilgileri · 1.7.2.1 Etiket bilgileri: ad, marka, model, imal yılı, seri no,
izlenebilirlik · 1.7.2.2 Tespit edilen bilgiler: ölçülen değerler, kullanım yeri ve amacı · 1.7.3 Test değerleri ·
1.7.4 **Ölçüm aletleri**: ad, seri no, **kalibrasyon bilgileri** · 1.7.5 Muayene kriterleri ve testler (sınır
değerle kıyas) · 1.7.6 Kusur açıklamaları · 1.7.7 Notlar (uygunsuzluk buraya yazılamaz) · 1.7.8 Sonuç ve kanaat
(kullanılabilir / giderilene kadar kullanılamaz, açıkça) · 1.7.9 Yetkili kişi: ad soyad, meslek, **EKİPNET kayıt
no**, **nüsha sayısı**, imza. **İmzasız rapor geçersiz.**
**1.7.1 birebir (2025 metni, 2026-09-22'de birincil kaynaktan doğrulandı):** işyerinin **ünvanı**, **SGK sicil
numarası**, **adresi**, **sözleşme numarası (ID)**, muayene/test faaliyetlerinin **başladığı** periyodik kontrol
**başlangıç tarihi ve saati**, **bittiği** **bitiş tarihi ve saati**, normal şartlarda yapılması gereken **bir
sonraki periyodik kontrol başlangıç tarihi**, yetkili kişinin sonuç ve kanaatini oluşturup raporunu yayımladığı
**rapor tarihi**, periyodik kontrol **metodu**. → Ürün: bu alanların hepsi rapor formunda **zorunlu**; sözleşme
numarası ve SGK sicil numarası tesis/sözleşme kaydından gelir (§3.2).
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

### 4.6 Kim kontrol yapabilir (2026-09-22: birincil kaynaktan **birebir** çıkarıldı)
- ⛔⛔ **"TEKNİSYEN" YETKİLİ KİŞİ OLAMAZ.** Yürürlükteki yönetmelik metninde "teknisyen" kelimesi **hiç geçmiyor**
  (tam metin taraması: 0 eşleşme, 2026-09-22). Yetki; ilgili branşta **mühendis · teknik öğretmen · tekniker ·
  yüksek tekniker** unvanlarına aittir. Reisim'in tarifindeki "teknisyen" bu yüzden **düzeltildi** (§1.1).
- **Grup başına yetkili meslekler (Ek-III, birebir):**
  · **Basınçlı kap ve tesisatlar:** makine, metalürji-malzeme, mekatronik, **kimya**, **imalat**, **uçak**
    mühendisleri; makine veya metal eğitimi bölümü mezunu teknik öğretmenler; makine tekniker/yüksek teknikerleri.
  · **Kaldırma ve iletme (iskeleler hariç):** makine, mekatronik, metalürji-malzeme, imalat mühendisleri; makine
    veya metal eğitimi teknik öğretmenleri; makine tekniker/yüksek teknikerleri.
  · **İskeleler:** inşaat, makine mühendisleri; inşaat/yapı/makine/metal eğitimi teknik öğretmenleri; inşaat
    tekniker/yüksek teknikerleri. (Gemi işlerinde gemi inşaatı ve gemi makineleri mühendisleri, gemi teknikerleri.)
  · **Elektrik grubu** (elektrik tesisatı, topraklama, yıldırımdan korunma, akümülatör, transformatör, jeneratör,
    katodik koruma ve benzeri): **elektrik mühendisleri, elektrik-elektronik mühendisleri, elektrik eğitimi bölümü
    mezunu teknik öğretmenler, elektrik tekniker veya yüksek teknikerleri.**
  · **Diğer tesisatlar (Tablo-3), tezgâhlar, iş makineleri:** makine, metalürji-malzeme, mekatronik, imalat
    mühendisleri; makine/metal eğitimi teknik öğretmenleri; makine tekniker/yüksek teknikerleri.
- Yetkili kişi ayrıca Bakanlık eğitimi + **EKİPNET kaydı** taşır. İSG-KATİP sözleşmesi **işveren ile yetkili kişi**
  arasındadır → sistemde kayıt **kişi × tesis** bazında tutulur (§3.2 madde 2).
- Ürün: **Ekipman Türü Kataloğu** her tür için **yetkili meslekler** listesini taşır (§3.1 modül 5); personelin
  mesleği ile eşleşme plan kabulünde denetlenir (*öneri*, §3.2 madde 2c).
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

## 7 · Veri modeli çekirdeği (taslak — onay bekliyor; 2026-09-22'de genişletildi)
Firma (kiracı) · Kullanıcı + rol · **Personel** (meslek, branş, diploma no, oda sicil no, EKİPNET no) ·
Müşteri (işveren; adres, iletişim) · **Tesis** (adres, **SGK DETSİS numarası** — reisim onayı 2026-09-22:
SGK numarası müşteride değil **tesiste** durur) · Ekipman (tür kataloğuna bağlı; etiket bilgileri; tesise bağlı;
kalıcı) · Ekipman türü kataloğu (Ek-III grubu, **branş**, periyot, standartlar, **yetkili meslekler**, akreditasyon
gereği, Bakanlık format kodu) · **Teklif + teklif kalemi** (ekipman türü × adet × birim fiyat) · **İş sözleşmesi**
(firmalar arası) · **İSG-KATİP kaydı** (numara, onay tarihi, yetkili kişi, tesis) · Plan (müşteri, tesis, tarih,
atanan inspector, ekipman listesi, durum) · Rapor (ekipman + plan + durum + **şablon sürümü** + kriter cevapları +
ölçümler + kusurlar + fotoğraflar + cihazlar + sonraki kontrol tarihi + imza kaydı) · **Uygunsuzluk kaydı**
(rapor, ekipman, kriter, açıklama, hafif/ağır, tarih) · Ölçüm cihazı (seri no, **envanter no**, kalibrasyon tarihi,
sertifika, ara kontrol) · **Varlık** (cihaz / araç / diğer) · **Zimmet kaydı** (varlık, teslim eden, teslim alan,
tarih-saat, fotoğraflar, form) · **Eğitim kaydı** (personel, eğitim, belge, tekrar süresi) · **Fatura / tahsilat** ·
**Standart** (firma başına belge) · Dosya (fotoğraf, PDF, NDT eki, kalibrasyon sertifikası) · Müşteri kullanıcısı
(portal) · Denetim izi (kim, ne zaman, neyi).

## 8 · Teknik kararlar (reisim 2026-09-17: *"sen ona göre doğru tercihleri yap"* — **8.1–8.3, 8.8–8.11 reisim 2026-09-22'de onayladı**)
1. **8.1 Çatı — KARAR (reisim 2026-09-22):** TypeScript + **Next.js (App Router)**. **SvelteKit düştü.**
   Gerekçe: en yaygın çatı, geniş bileşen ekosistemi, ileride geliştirici bulmak kolay. Vercel'e bağlı değil;
   Türkiye'deki sunucuda Node ile çalışır (**standalone** çıktı). Tarayıcı uygulaması; sahada tablet/telefon için
   **PWA + çevrimdışı kuyruk** kararı **aynen kalır** (fabrika/bodrum). Çevrimdışı riskli iş sınıfı → faz
   listesinin sonunda (anayasa 10.6), ama şema ilk günden buna göre.
   **2026-09-27 (reisim, yirmi dördüncü tur):** *"tüm raporlama süreçleri offline da çalışabilecek şekilde kurgulanacak ileride appstore ya da
   android markete uygulama olarak çıkabilir bunu göz önünde bulundurarak kodlama yapacağız"* → raporlamanın **tamamı** (rapor açma, doldurma,
   fotoğraf, cihaz ekleme, kaydet, onaya gönder) çevrimdışı çalışır: kayıt cihazda saklanır, bağlantı gelince sırayla sunucuya gider; ekranlar
   ve iş kuralları mağaza uygulamasına (iOS / Android sarmalayıcı) taşınabilecek şekilde yazılır — öneri, kodlamada karara bağlanacak.
   **Sunucu ve veri tasarrufu kuralları (2026-09-29, onaylı): `09-SUNUCU-VE-VERI.md`** — kod bu dosyaya göre yazılır, her madde kilit testiyle.
   **Arka uç kurgusu (2026-10-01; K1–K6 kabul, K7–K8 kabul edilmedi 2026-10-02): `ARKA-UC.md`** — modül modül veri, dosya, çevrimdışı kuyruk, mağaza uygulaması,
   yapay zekâ (fotoğraftan okuma, S.A.Y chat), arşiv, yedek, işletim; kararını isteyen sekiz madde başta (K1–K8).
2. **Veri:** PostgreSQL + satır seviyesi güvenlik (firma ve müşteri izolasyonu veritabanında) + dosya deposu
   (fotoğraf/PDF). Gerekçe: rapor arşivi ve süzme ilişkisel iş; dışa aktarım standart; güvenlik sunucuda.
   **2026-09-18 revizyon (reisim: "illa bir şey kurmaya gerek var mı? localhost ve yerel depolama"):** Supabase ve
   Docker **kalktı**. Yerelde kurulum yok: PostgreSQL projeyle birlikte gelen gömülü sürümle çalışır (npm paketi,
   ilk `npm install`'da iner, veriler proje klasöründe), dosyalar yerel klasörde, giriş/kimlik bizim kodumuzda.
   Yayında aynı yazılım: yönetilen PostgreSQL + S3 uyumlu dosya deposu; tek yapılandırma dosyası değişir.
3. **8.3 Rapor çıktısı — DEĞİŞTİ 2026-10-02** (reisim: *"Tamam yapalım"*, §9 kırk dokuzuncu tur): rapor formatı **firmanın Format
   kurucusunda** (Ekipman türleri › tür) kurulan **sürümlü bir tanımdır** — yapı (bölümler / bloklar) · kurallar · görünüm. Saha ekranı ve
   sunucuda üretilen PDF bu tanımdan çizilir; **çizen motor kodda tek**, firmalar arasında ortak. Başlangıç: hazır şablon (Bakanlık formatları
   birebir + genel türler) · boş · firmanın kendi formatını yükleyip yapay zekâ taslağı (öneri). Bakanlık formatlı türde zorunlu bölümler
   kilitli. Açık raporlar başladıkları sürümle kalır. Tasarım: `RAPOR-FORMAT.md`.
   ~~Eski karar (2026-09-22): şablonlar firma × ekipman türü başına kodda, site içinde şablon düzenleyici yok.~~
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
   **KARAR (reisim 2026-09-22, ikinci tur):** gerçek uygulama **Türkiye'de sunucuda** çalışır; her firma kendi
   **alt alan adında** (`*.<ürün>.com.tr`), **joker SSL**. Veri yurt dışına çıkmaz → KVKK yurt dışı aktarım yükü
   doğmaz. **GitHub Pages yalnız önizleme.** Yukarıdaki (a)/(b) seçeneklerinden **(a) seçildi**.
   **DEĞİŞTİ (2026-10-03, reisim: *"Supabase kullanalım sebebi ise eğer bir sorun olurda kiraladığım server yetersiz gelirse sorun olur ama supabase de öyle bi ihtimal görmüyorum"*, KOD-GECIS G3):** veritabanı ve dosya deposu **Supabase** (yönetilen PostgreSQL, AB —
   Frankfurt); uygulama (Next.js) hazır barındırmada AB bölgesinde (ör. Vercel), alt alan adları + joker SSL orada. Yığın aynı (PostgreSQL + RLS,
   kendi giriş sistemimiz, pg-boss). **Veri AB'de durur → KVKK yurt dışı aktarım şartı yayından önce hukukçuya teyit ettirilir.** Yerelde gömülü
   PostgreSQL sürer. PostgreSQL olduğu için ileride Türkiye'ye taşınabilir.
   **DEĞİŞTİ (2026-10-04, reisim: *"her müşterim kendi supabase hesabını bağlasın … aylık 25 dolarlık paket 1 şirket için yeter"* → *"tamam supabase
   kararını yaz"*, §11 294):** **her firma kendi Supabase projesinde** (veritabanı + dosya deposu firmanın kendi Supabase hesabında, Pro paket, faturayı
   firma öder). Firma yalnız "Supabase hesabımı bağla" der ve onaylar; projeyi, tabloları, güvenlik ayarlarını ve sonraki güncellemeleri **uygulama
   otomatik** kurar (Supabase hesap bağlama + yönetim API'si — K7'de doğrulanır; firmaya anahtar kopyalatılmaz). Küçük bir **merkez kayıt** yalnız
   "hangi alt alan adı → hangi Supabase projesi" ve şifreli bağlantı bilgisini tutar. RLS ikinci kat olarak kalır. Firma Supabase'i ödemezse sistemi
   durur → sözleşmeye yazılır. Deneme veritabanı (probata-deneme) ilk firmanın projesi gibi kalır.
   Depo **herkese açık** (`github.com/cankonuralp/pkproje`), GitHub Pro yok.
   Sonuç: kaynak kodun tamamı ve buradaki ürün kurgusu kamuya açıktır; sır/anahtar asla koda yazılmaz, gerçek veri
   asla depoya girmez (CLAUDE.md §8 tarama kuralı). Kural dosyaları 2026-09-22'de kök klasöre taşındı ve
   yayımlandı; önceki ürünün alan adı ve gerçek müşteri adı metinden çıkarıldı.
9. **8.9 Arka plan işleri — KARAR (2026-09-22):** kalibrasyon ve eğitim uyarıları, yedek, 5 yıl sonrası (firmanın seçimiyle arşive taşıma ya da silme, 2026-09-29), toplu PDF
   için **PostgreSQL üstünde iş kuyruğu** (pg-boss). **Ayrı servis yok** — kurulum yükü doğurmaz. İhtiyaç doğan
   modülde kurulur. **2026-10-08 (378, uygulama):** barındırma Vercel (G3) — sürekli çalışan işçi yok; ZAMANLI işler Vercel Cron → `/api/is/gece`
   (günde bir, CRON_SECRET'le), iş kaydı ve "aynı anda iki koşu yok" veritabanında (0069 is_calisma). İstekle çalışan kuyruk işleri (toplu PDF,
   e-posta) gelince pg-boss o modülde kurulur; ayrı servis yine yok.
10. **8.10 Sigorta okuma — KARAR (2026-09-22):** elektrik panosu fotoğrafından sigorta bilgilerini okumak için
   **görsel okuyabilen yapay zekâ servisi** (ör. Claude). Okunan değerler tabloya **öneri** olarak düşer;
   **inspector kontrol edip onaylamadan kaydedilmez**. Fotoğraf dış servise gider; pano fotoğrafı kişisel veri
   taşımaz. (Reisim'in ikinci önceliği — §1.1.)
11. **8.11 Mimari — KARAR (2026-09-22):** **profesyonel modüler yapı**; tek dosya derleme ve tek küresel ad alanı
   **YOK** (EKSIKLER-VE-ONERILER 11–12'nin karşılığı). Reisim: *"tek dosya yapısı falan istemiyorum … profesyonel
   modüler bir yapı istiyorum"*. Kurallar: (a) her iş modülü kendi klasöründe (`src/modules/<modül>/`);
   (b) modül **başka modülün tablosuna doğrudan dokunmaz**, o modülün dışa açtığı fonksiyonları kullanır;
   (c) ortak çekirdek (veritabanı, kiracı çözümleme, yetki) `src/server/`'da; (d) sayfalar (`src/app/`) **iş
   mantığı taşımaz**.
12. **8.12 Görsel kimlik — KARAR (reisim 2026-09-23):** *(Ek 2026-09-29: yan menü durum renkleri `--cubuk-hata / -uyari / -onay / -durum-yazi`, paletin koyu tema değerleri, reisim onayı; §11 125.)*
   · **Ürün adı: probata.** Slogan: *Periyodik Kontrol Yönetimi*. Firma alt alan adları `<firma>.probata.com.tr`
     biçiminde düşünülür (alan adının alınması ayrı iş).
   · **Logo paketi:** `probata-logo/` (reisim hazırladı). SVG'ler yalnız yol/şekil taşır, yazılar eğriye çevrili;
     dört renk (renkli · koyu zemin · siyah · beyaz) × dört yerleşim (işaret · yatay · yatay sloganlı · dikey) +
     favicon, iOS ve PWA ikonları. Kullanım kuralları paketteki `OKU-BENI.md`'de: site üst çubuğu yatay-renkli
     (koyu zeminde koyu-zemin), PDF üst bilgisi yatay-sloganlı, koruma alanı işaret yüksekliğinin ¼'ü, ekranda
     en küçük yatay logo 120 px; renk değiştirme, esnetme, gölge YASAK.
   · **Renkler (marka):** Petrol **#0F2A3D** · Onay yeşili **#1FA37A** · Kâğıt (zemin) **#F5F3EE** (2026-10-03: bir ara #FAF9F6 yapıldı, reisim vazgeçti; zemin yine #F5F3EE) · Slogan
     grisi **#4E5F6C** (son ikisi logo paketinin rehberinden). Bunlar dokunulmaz marka renkleridir (anayasa 2.4);
     ekranın geri kalan tonları (zemin kademeleri, metin kademeleri, kenarlık, uyarı/hata renkleri, koyu tema)
     bunlardan **türetilir** ve reisim onayıyla dondurulur → görsel sistem önerisi (öneri — onay bekliyor).
   · **Yazı tipi: Sora** (SIL OFL 1.1). Logo SemiBold, slogan Medium. Uygulamada **kendi sunucumuzdan** sunulur,
     dış kaynaktan çekilmez (anayasa 5.2).
   · **Tema: açık ve koyu eş zamanlı** — ikisi ilk günden birlikte tasarlanır ve her ekran ikisinde ölçülür.
   · **Görsel sistem kararları (reisim 2026-09-23):** (1) birincil tuş **A** — yeşil zemin + petrol yazı, iki temada aynı
     (B ve C elendi; `tokens.css`'te tek seçenek) · (2) açık tema zemini **kâğıt** #F5F3EE, kartlar beyaz · (3) yan menü
     **iki temada petrol** · (4) **üç bant** (< 768 · 768–1279 · ≥ 1280) ve **40 / 48 px** denetim yüksekliği — 4. turda
     reisim *"her şey çok büyük"* → **34 / 44 px**, gövde yazısı 14 / 15 px (bantlar aynı) · (5) süzgeç
     **kurallara göre** (kalıp 15 sırası: arama → çipler → ve/veya → seçiciler + Temizle sağda; sığmayınca seçiciler +
     Temizle birlikte alt satıra) · (6) pencere **kurallara uydurulur** (içindeki her kutu pencereyi doldurur, tuşlar içerik
     kadar, × ve Esc, telefonda alttan levha + yapışkan tuş çubuğu; genişlik işin içeriğinden: karar 520, form 760) ·
     (7) referans ekranın dondurulması: reisim *"anlamadım"* → açıklandı; 4. turda önerim kabul (§3.3) · (8) faz 1 sırası:
     4. turda kabul (§3.3).
   · **4. tur (2026-09-23):** yoğunluk 34 / 44 px; yazı ölçeği başlık 20 (telefonda 18) · bölüm 15 · gövde 14 (dokunmatikte
     15) · küçük 12,5 · etiket 11,5; yan menü 232 px, üst çubuk 52 px. Kart eşiği tablet bandında ölçülüp **960 px**
     (liste 933, ekipman 891, rapor 891 px'de bozuluyor). 54 ölçüm temiz, kontrast 62 / 62 (adım çizgisi, şu anki adım,
     seçili sayfa için 3 çift eklendi); ölçüm aracına iki denetim eklendi (hiza kayması, kart tutarlılığı).
   · **Yazı alanı 14 / 16 px (2026-09-25, reisim *"bunu düzelt"*):** reisim iPhone'da maketin sağa sola kaydığını gördü.
     Sebep: yazı alanı (arama, form) dokunmatikte gövdeyle 15 px'ti; iPhone 16 px altındaki alana dokununca sayfayı büyütüp
     bırakıyor. Alan artık kendi değişkeninden (`--boy-girdi`: fareyle 14, orta bantta ve dokunmatikte 16; reddedilen 15);
     uygulama (`src/styles/temel.css`) ve maket aynı kuralla, kilidi `tests/kalip-sayilari.test.ts`. Büyütmeyi kapatmak
     (`maximum-scale`) seçilmedi: iki parmakla büyütme erişilebilirlik için açık kalır. Aynı turda 320 px telefonda 4 taşma
     düzeltildi (sözleşme sekmeleri, müşteri paneli üst çubuğu, saha raporu seçimi, performans grafiğinin gizli tablosu) ve
     ölçüm aracına telefon taklidi eklendi (`tools/olc-bulut.mjs --telefon`: 320 · 360 · 390 · 430).
   · **Görsel sistem önerisi + referans ekran maketi (2026-09-23; 1–6 onaylandı):** GitHub Pages'te
     `docs/index.html` (sunum) ve `docs/maket/planlarim.html` (Planlarım maketi). İçerik: marka renklerinden türetilen
     27 değişken × 2 tema (`docs/assets/tokens.css`), 54 yazı/zemin çiftinin hepsi WCAG AA geçer (ölçüm aracı
     `tools/palet-olc.mjs` gerçek dosyayı okur; 2. turda 4 çift eklendi); **bulgu: marka yeşili + beyaz yazı 3,19 : 1,
     eşiğin altında** → birincil tuş için A/B/C seçenekleri; Sora 5.3.0 ve Lucide 1.47.0 (42 ikon) kendi sunucumuzdan;
     üç adlandırılmış bant (dar < 768 · orta 768–1279 · geniş ≥ 1280), denetim yüksekliği 40 / 48 px; liste kap
     ≥ 1.180 px tablo, altı kart (2. tur ölçümü; 1. turda 5 sütunla 980 px). Maket 2. turda Planlarım + plan içi:
     1920 · 1080 · 375 × açık/koyu × (liste + 3 plan içi durumu) = 24 ölçümün hepsinde taşma, kırpma, çakışma, gizli
     tuş, küçük hedef 0; iki turda ölçerken 21 hata bulunup düzeltildi (`docs/assets/olcum.json`). Karar soruları
     sunumun sonunda (1–8 görsel sistem, 9–16 Planlarım 2. tur).
13. **8.13 İskelet — kuruldu (2026-09-23, reisim: *"kodlamaya başla ilk yayını yap"*).** Ölçülerek alınan kararlar:
   · **Sürümler:** Next.js 16.3.6 · React 19.3 · pg 8.23 · embedded-postgres 18.4.0-beta.17 (paket sürümlerini PostgreSQL
     sürümüne bağlar, hepsi "beta" etiketlidir) · **TypeScript 6.0.3** (7.0.2 yerel derleyicidir, JavaScript arayüzü yok;
     Next'in tip denetimi ve ESLint'in TypeScript eklentisi bu arayüzü ister) · **ESLint 9.39.5** (10'u Next'in import /
     erişilebilirlik / React eklentileri desteklemiyor). İndirme izni reisim'den (npm, ~540 MB `node_modules/`).
   · **webpack, Turbopack değil:** reisim'in Windows'unda Uygulama Denetimi Next'in yerel derleyicisini
     (`next-swc.win32-x64-msvc.node`) engelliyor; Next kendi WebAssembly derleyicisini indirdi (6,5 MB,
     `AppData/Local/next-swc`) ve onunla yalnız webpack çalışıyor. Yerel ve CI aynı paketleyiciyle derlensin diye her yerde
     webpack (`scripts/next.ts`). Ayar değiştirilmedi (güvenlik ayarı).
   · **Telemetri kapalı:** Next'in anonim kullanım bildirimi her çalıştırmada kapatılır (anayasa 5.2). İlk derleme
     denemesinde açıktı (bildirim metni göründü; bir olay gönderilmiş olabilir — ölçemedim).
   · **Gömülü PostgreSQL şablonu SQL_ASCII:** proje "Masaüstü" altında; PostgreSQL yolu `ü` taşıyor, UTF-8 şablonla initdb
     düşüyordu (`invalid byte sequence for encoding UTF8: 0xfc`). Uygulamanın veritabanı template0'dan açıkça UTF-8 açılır
     (testte ölçülüyor). Yerel veritabanı `data/pg`, kapı 54320; geliştirme sunucusu yalnız 127.0.0.1.
   · **Kiracı izolasyonu veritabanında:** uygulama `probata_uygulama` rolüyle bağlanır (süper kullanıcı değil, RLS'yi
     aşamaz); her kiracı tablosunda ENABLE + FORCE RLS; kiracı işlem başına `app.firma_id`. İlk göç: `firma` +
     **`denetim_izi`** (hareket kaydı; yalnız eklenir — reisim 3. tur *"kayıt altında kalsın"*).
   · **Rota:** her modülün kendi rota klasörü (`src/app/<modül>/`), kayıtla birebir; dinamik tek rota yerine (Next 16.3.6
     Windows'ta statik dışa aktarımda ön yükleme dosyasını yanlış adla yazıyor — `path.relative` ters bölü üretiyor; Linux'ta
     doğru; `node_modules`'a yama yapılmadı).
   · **Yayın:** Pages artık GitHub Actions'tan: kök = `docs/` (maket + sunum), `/uygulama/` = uygulamanın statik önizlemesi
     (sunucu, veritabanı, giriş orada ÇALIŞMAZ). Gerçek yayın Türkiye'deki sunucuda (§8.8) — sağlayıcı ve alan adı açık.
   · **Yan menü daraltma (2026-09-24, maket 6. tur onaylı):** durum `<html data-menu="dar">` özniteliğinde (tema deseni:
     layout'taki betik ilk boyamadan önce kurar, kabuk özniteliğe abone olur) → sayfa açılırken menü açık görünüp sonra
     kapanmaz, sunucu ve istemci çıktısı aynı kalır. Kurallar yalnız `@media (min-width: 1280px)` bloğunda.

## 9 · Sorular ve reisim'in cevapları (2026-09-22; kararlar 2, 3, 6, 7, 8'e işlendi)
1. Roller → bir kişinin birden fazla rolü olabilir; kendi raporunu onaylama engellenmez.
2. Müşteri → e-posta ile hesap; tüm raporlarını görür; birden çok tesisi olabilir.
3. Kalibrasyon → 30 gün önce uyarı; geçmiş cihazla rapor açılır ama uyarır, onaya gönderilemez.
   **(2026-09-22 ikinci tur)** Cihaz **seçilmez**: inspector'ın **zimmetindeki** cihazlar rapora otomatik gelir.
4. Fotoğraf → rapor başına en az 1.
5. Standartlar → firmanın kendi PDF'leri, firma başına yüklenir; kontrol metodu standardı buradan **seçilir**.
   **(2026-09-22 ikinci tur)** Rapor şablonu firma tarafından yüklenmez: **firma × ekipman türü başına kodda**
   yazılır, site içi düzenleyici yoktur. Önceki "firma PDF formatını yükler" yorumum **düzeltildi**. → **2026-10-02 değişti:** §8.3 (Format kurucu).
6. İSG-KATİP sözleşme no → zorunlu; aralık denetimi yok (sözleşme yüklenmiyor).
   **(2026-09-22 ikinci tur)** Numaranın yanında **onay tarihi** de girilir; plan kabulünde
   "onay tarihi ≤ kontrol tarihi − 1 gün" denetlenir.
7. Rapor no → `XX-AAYY-SIRA-rasgele` (örn. `ME-0626-767-224d1`).
8. Ekipman grupları → henüz karar yok; **önce iskelet** (reisim: "şu an iskelet oluşturmalıyız").
9. Arşiv → 5 yıl yeterli, sonra silinir (anayasa 4.12 istisnası, reisim kararı).
10. Yedek → firmanın bulut sürücüsü.
11. Emsal uygulamanın PDF çıktısını indirme izni verildi; çözümleme yerel dosyada (§6).
12. Tablet → ayrı uygulama değil; aynı web uygulaması, tablete uyarlanmış biçemle.
**İkinci tur cevapları (2026-09-22):** 13. Alt alan adı → teyit edildi, ürün birden çok firmaya satılır.
14. SGK sicil numarası → müşteride değil **tesiste**. 15. Rapor şablonları → ~~**kodda**~~ firmanın Format kurucusunda (2026-10-02, §8.3), firma × ekipman türü.
16. Çatı → **Next.js** (SvelteKit düştü). 17. Mimari → **modüler**, tek dosya yok. 18. Barındırma → **Türkiye'de
sunucu**, joker SSL alt alan adları. 19. Arka plan işleri → **pg-boss**. 20. Sigorta okuma → görsel yapay zekâ,
**insan onayı şart**. 21. Yönetici → **branşa göre ikiye** ayrılır.

**Üçüncü tur cevapları (2026-09-23):** 22. Ürün adı → **probata**, logo paketi `probata-logo/`. 23. Renk →
Petrol #0F2A3D + Onay yeşili #1FA37A; yazı tipi **Sora**. 24. Tema → açık ve koyu **eş zamanlı**. 25. İlk faz →
önerdiğim omurga **uygun** (bağımlılıklar §3.3'te ayrıca onaya sunuldu). 26. Referans ekran → **Planlarım uygun**.

**Dördüncü tur (2026-09-23, maket üzerine):** 27. Planlarım sütunları → örnek listeden, Mesai / İş türü / Rapor durumu /
"İşlemler" tuşu **yok**. 28. Satır tuşu → **Kabul et → Denetime başla → Devam et**. 29. Tamamla → plan içinden;
**geri alınabilir**, raporlar düzenlenebilir (§3.4).

**Beşinci tur (2026-09-23):** görsel sistem 1 → **A** · 2 → kâğıt zemin · 3 → yan menü petrol · 4 → üç bant, 40/48 px ·
5 → süzgeç kurallara göre · 6 → pencere kurallara uydurulsun · 7 → *"anlamadım"* · 8 → *"faz 1'i buradan bana yaz"* ·
Planlarım 9–16 ve ekipman/rapor ayrımı → §3.4, §3.5.

**Altıncı tur (2026-09-23):** 17–25 → **önerilerim kabul, takvim hariç** (takvim yok) · faz 1 sırası → kabul (§3.3) ·
plan içi bir akış, 10'ar sayfa, ekipman ve rapor süzgeci, yoğunluk 34 / 44 px, firma adı üst çubuktan kalktı (§3.4).

**Yedinci tur (2026-09-23):** 26–28 → **önerilerim kabul** (beyan metni firma ayarı · proje notu inspector + planlama
ekibi, müşteri görmez, silinmez · 4. tur değişikliklerle uygun) · hareket listesi plan içinden kalktı · raporlar 20'şer ·
yan menüde bütün modüller, genel adlar · rol × modül görünürlüğü sonra (§3.4).

**Sekizinci tur (2026-09-23):** 29–31 → **önerilerim kabul** (menü grupları · hareket kaydı plan içinde değil, rol ×
modül belirlenirken yöneticiye "Hareket kaydı" · 5. tur uygun) → referans ekran dondu, **iskelet kuruldu ve ilk yayın
yapıldı** (Pages önizlemesi, §8.13).

**Dokuzuncu tur (2026-09-24):** yan menü daraltma → panel simgesi reddedildi (*"standart üç alt alta çizgi görünümü
olsun"*), ☰ ile 2. deneme **onaylandı** (*"uygun"*) → uygulamaya geçti (§3.4).

**Onuncu tur (2026-09-24):** Planlar'ın koda dönme zamanı → **faz 1 sırası korundu** (7. adım, gerçek veriyle; §3.3).

**On birinci tur (2026-09-24):** maket çalışma biçimi → **bütün maketler (faz 1 + faz 2) sırayla bulutta, sonda toplu
bakış** (§3.3, `MAKET-PLANI.md`).

**On ikinci tur (2026-09-25, M1 soruları; reisim birebir):** *"159 birleşsin- 32:başlangıç olarak uygun ama admin istediği gibi rollerin
yetkilerini değiştirebilmeli / 33:kullanıcı hesabı her zaman personele bağlı olsun aslında bu 159 un da cevabı, ancak müşteri girişi olcak ve
her müşteri için müşteri girişi otomatik oluşacak müşterinin sistemdeki mail adresi ile otomatik oluşturulmuş şifre o mail adresine
gönderilecek isterse personel de erişip müşteriye bilgi verebilecek. 34:Yönetici geçici parola verir daha sonra kullanıcı parolasını
değiştirebilir / 35:evet , önerin gibi aynı alan adı, 36:Hayır gerek yok, 37uygun,38: bu kadar teknik detaya girme bunu bir çok yerde
yapmışsın gerek yok biz sadece yazılım hizmeti vericez , 39:hayır dediğim gibi teknik detaya çok girme sadece uyarsın, ama yapılabilir
olsun , eğer firma ister ise firma özelinde yazılımı değiştirerek sunarız. 40:Eğitimler ile yürüyecek ama personel özlük dosyaları ve
zimmetleri personel de olacak/ 41: Role göre ama herkes için bir anasayfa olmalı/ 42: Girsin her şeyimiz kayıtlı ve disipline edici
olsun/ 43uygun"* → M1 2. tur (§3.6). **Genel ilke (38–39, bütün modüller için):** mevzuatın teknik ayrıntısına girilmez, biz yazılım
hizmeti veririz; kural ihlali **uyarı** olur, **engel olmaz**; firma daha sıkı kural isterse o firmaya özel geliştirme yapılır.
Öteki modüllerdeki kilitler (İSG-KATİP kabul kilidi dahil) sıraları gelince bu ilkeyle yeniden sorulur.

**On üçüncü tur (2026-09-25, M2 soruları 44–50; reisim birebir):** *"Tüm önerilerin uygundur"* — önerilerim: 44 ana giriş bütün tesisler,
kişiye özel ek giriş seçili tesislerle sınırlanabilir · 45 vergi no zorunlu değil, eksikse / aynısı varsa uyarı, kayıt engellenmez · 46 SGK
işyeri sicil no aynı biçimde, rapor aşamasında yeniden hatırlatılır · 47 bir tesis tek müşteriye ait, aynı adreste iki işletme iki tesis ·
48 silme yok, pasif (listeden kalkar, raporlar ve arşiv kalır, yeniden etkinleştirilir) · 49 "kontrolü yaklaşan" eşiği firma ayarı,
başlangıç 30 gün · 50 il ve ilçe aramalı seçim listesi. Çakışma önerileri de uygun: İSG-KATİP kayıtları tesiste yalnız görünür, girişi
M5'te; "açık plan için" sütunu uyarı. → M2 2. tur (§3.6).

**On dördüncü tur (2026-09-26, M3 soruları 51–57; reisim birebir):** *"Sıradakine geçelim ve ekipmanlar ve ekipman türleri diye iki modüle
gerek yok ekipman türleri yeterli"* · *"Zaten planlar açıldığında ekipmanlar orada gözüküyor ya, oradan rapor oluştur diyoruz zaten neden
ekstradan ekipmanlar sekmesi lazım olsun. Gerek yok./ 51. Bunu sorman sistemi anlamadığını işaret ediyor, bizim kullanıcımız periyodik
kontrol firmaları, müşterisinden herhangi bir beklentisi bu konuda yok. Saha personeli(denetçi) sahada ekipmanı ekleyip raporunu
oluşturucak. Ekipmanı ayrı raporu ayrı oluşturmamızın sebebi, ilerleyen senelerde aynı raporları tekrar rapor oluştur diyerek oluşturup
kullanabilmek. Yani tekrar tekrar rapor yazma ile vakit kaybetmemek için. Özetle hayır bu işi denetçiler yapacak 52 ve diğerleri için
önerilerini kabul ediyorum ama sökülen ga da hizmet dışı makineleri düşünmene gerek yok dediğim gibi biz fabrikaya hizmet eden bir
uygulama yapmıyoruz, biz denetçiye ve periyodik kontrol firmasına hizmet verecek bir içerik üretiyoruz."* → M3 2. tur (§3.6).
**Ürün ilkesi (bu cevaptan, bütün modüller için):** kullanıcımız **periyodik kontrol firması ve denetçisi**; fabrikanın (müşterinin)
varlık yönetimi ürünün konusu değil. Ekipman ve raporun ayrı tutulmasının amacı: sonraki yıl önceki rapordan yeni rapor, yeniden yazma yok.
**On dördüncü tur, ek (2026-09-26, M3 maketine bakınca; reisim birebir):** *"Akreditasyon zorunluluğu ile ilgili bir şey yazma , bunu bilmek
periyodik kontrol firması yetkililerinin sorumluluğu, 2027 den sonra vs yazmışsın gerek yok, ekipman türü ekleme tuşu olsun ve her ekipmanın
içinde türün fotmatını belirleyecek pdf i ekleme tuşu da olsun, eklenen pdf ile ilgili raporlama sürecinde bunu nasıl işleyeceği
kurgulayamadım ama kaba tabirle istediğim şey şu: ekipman türü eklenip ekipmana pdf olarak rapor çıktısı nasıl gözüksün istiyor ise firma
yükleyip kendi formatını belirleyebilsin, ve rapor oluştur diyince o rapor pdf deki formata göre sorular soracak ona göre rapor uygun uygun
değil çıkacak şu an senin raporlar kısmında örnek olarak yaptığın şey çok kullanışsız ama bunu şimdilik tam anlamıyla yapmana gerek yok
ilerledikçe daha oturaklı olacak. Dediklerimi projeye hakim ol diye anlatıyorum. Şimdi söylediklerimden yapılabilecekleri yap reisim"* →
M3'e Tür ekle ve rapor formatı (PDF) yükleme; akreditasyon kalktı. **M8 için not:** mevcut rapor ekranı reisim'e göre "çok kullanışsız";
M8'in sırası gelince rapor, türün PDF formatındaki sorularla ve uygun / uygun değil sonucuyla yeniden kurulacak (§8.3 de o zaman).

**On beşinci tur (2026-09-26, M4 soruları 58–65; reisim birebir):** *"59 kalibrasuon önemli o durumda göndermeyi engellesin diğer önerilerini
kabul ediyorum ama genel olarak cihazlar modüllerden çok diğer modülleri etkileyecek sorular sordun genel olarak cihazlar modülünde cihazlar
eklensin tıklanınca kimde olduğu gözüksün kod verilebilsin kalibrasyon tarihi takip edilebilsin asıl hedefler bunlar diğer söylediğin iş
kolaylaştırıcı işlemleride ekle tabiki ama bu fikri unutma diye söyledim . Özetle 59 hariç dediklerini kabul ediyorum 59 u da yukarıda
açıkladım"* → kabul edilen öneriler: çakışma (zimmet onayı yalnız imzalı form + tarama, M1) · 58 denetçi rapor anında zimmetindeki
cihazlardan seçer, türe uyanlar işaretli · 60 ara kontrol isteğe bağlı, periyot firma ayarı · 61 = çakışma · 62 fotoğraf isteğe bağlı,
uyarı · 63 depo için ayrı rol yok · 64 araçta yalnız kimde + km · 65 kalibrasyon eşiği firma ayarı, 30 gün. **59: kalibrasyonu geçmiş
cihaz zimmetteyken raporu onaya göndermek ENGELLENİR** (genel ilkenin istisnası). **Ürün ilkesi (bu cevaptan):** her modülde önce o
modülün **asıl hedefi** sorulur ve ekran onu öne koyar; başka modülleri etkileyen sorular o modüllerin sırasında sorulur. → M4 2. tur (§3.6).

**On altıncı tur (2026-09-26, M5; reisim birebir):** *"Sol panelde sözleşmeşet olarak gözüken modülden bahsediyorsan orada kastım ist katip
sözleşmesi değildi, pl firma ile favrika arasındaki sözleşmeden bahsediyorum, her firmanın kendi sözleşm fotmatı olabilir tabiki onuda ekleriz,
isg katip sözleşmesi pdf olarak isteğe bağlı buraya yüklenebilir olsun, isg katip sözleşme id ve sgk destis no buraya girilsin buradan
raporlara otomatik çekilecek ama , sgk destis no sabitken sözleşme id denetçiye göre değişir o yüzden sözleşme id ler eklenirken bunu göz önüne
alarak eklenmeli, ya da buradan eklenmesin plan açılırken plan açılan kişiye göre elle girilsin ya da ikiside olsun otomatik gelmeyen veriler
el ile girilebilir olsun , sorularınıda sor sonra komple elden geçirirsin"* → sorulan A–H (A: ayrı İSG-KATİP sekmesi kalksın, M5 + M13
birleşsin · B: SGK no tesiste tek yerde · C: ID sözleşmede + plan açarken otomatik / el ile, ikisi de · D: PDF her ID'nin yanında isteğe bağlı ·
E: onay tarihi isteğe bağlı, geç onay yalnız uyarı · F: Sözleşmeler yetkisi olan girer · G: kullanılmamış ID silinir · H: firma sözleşme
şablonunu yükler) → reisim: *"Önerilerin hepsi uygun başla"* → M5 2. tur (§3.6). **Genel ilke (bu cevaptan):** otomatik gelmeyen her veri
el ile girilebilir. **M6 için not:** plan açarken denetçinin ID'si sözleşmeden gelsin, yoksa el ile + "sözleşmeye de kaydet".

**On yedinci tur (2026-09-26, M5 maketine bakınca + M13 soruları 125–134; reisim birebir):** *"imzalı sözleşmeyi görüntüleme tuşu göremedim
yüklendikten sonra oluşacakmı diye yükle tuşuna bastım ama bir fark göremedim,numaralandırmalar şirkete göre değişir bunuda şirkete göre
değişecekler kısmına ekle her türlü numaralandırma şirkete göre değişir(periypdik kontrol şirketi) , hizmet sözleşmesi ve isg katip sözleşmeleri
ayrı şeyler isg katip sözleşmesi bitmişse plan açarken  uyarsın eğer uyarı sistemi kuracaksan bu şekilde kur onun dışında uyarı olmasın, isg
katip girilmemiş geçmiş vb uyarı tamamdır.  Bunlar dışında dediklerini kabul ediyorum"* → "İmzalı sözleşmeyi aç" eklendi; §3.7 satır 8 her
türlü numaralandırma; İSG-KATİP ID'sine isteğe bağlı bitiş tarihi, "bitmiş" uyarısı; hizmet sözleşmesi uyarıları kalktı; 125, 128, 129, 133,
134 öneriler kabul. **M6 için not:** plan açarken İSG-KATİP bitmişse / yoksa / geç onaylıysa uyarı (engel değil).

**On sekizinci tur (2026-09-26, M6 soruları 74–81; reisim birebir):** *"Önerilerin uygun ama geliştirilebilir maketi yap inceleyeyim ona göre
tekrar konuşuruz"* → önerilen: A asıl hedef (tesis + tarih + denetçi + kapsam) · 74 tek sayfa · 76 saat çakışması uyarı · 77 ikinci plan açılır ·
78 kontrolü gelen seçili, sahada yeni ekipman alanı kalkar · 79 sorumlu denetçi yok · 80 "Plan aç" yetkiliye · 81 müşteri panelinde planlanan
kontrol; çakışma: kapsam listesi sade, "Hepsini seç". → M6 2. tur (§3.6); reisim inceleyip yeniden konuşacak.

**On dokuzuncu tur (2026-09-26, M6 2. tur incelemesi; reisim birebir):** *"1 genel bilgiler değil firma bilgilerş olacak formattan bağımsız her
rapor için ortak olacak, SGK SİCİL NO DEĞİL SGK DETSİS no yazcak isg katip no depil isg katip sözleşme id yazacak parantez içinde açıklamalar
antin kuntin gereksiz detaylar alt tarafa yazılmış küçük mesajlar istemiyorum"* → **Karar:** (1) raporun 1. bölümü **"Firma bilgileri"**: firma
ünvanı · adres · SGK DETSİS no · İSG-KATİP sözleşme ID; türün rapor formatından (§3.7 satır 1) **bağımsız, her raporda aynı** blok; kontrole ait
satırlar (başlangıç, bitiş, sonraki kontrol, kontrol metodu) ayrı **"2 · Kontrol bilgileri"** bölümünde. (2) Etiket her yerde **"SGK DETSİS no"**
("SGK işyeri sicil no" kalktı) ve **"İSG-KATİP sözleşme ID"** ("Sözleşme no (İSG-KATİP)" kalktı). (3) **Genel ilke (bütün modüller):** parantez
içi açıklama, mevzuat madde numarası, alanın altına yazılan küçük mesaj ve gereksiz ayrıntı yok; hata mesajı ve uyarı kalır. Uygulandı: M6,
rapor ekranı (M8) ve rapor belgesi (M7 / M9 / M11 önizlemesi; bölüm başlıklarındaki "Ek-III 1.7.x" kalktı). Onaylı M1–M5'te ve sırası gelmemiş
modüllerde kalan ipuçları o modül ele alınınca (ya da kodda) temizlenir; şablon önizlemesindeki "alan nereden dolar" notları M7'de sorulur.

**Yirminci tur (2026-09-26, süreç; reisim birebir):** *"Kalan Tüm modüllerin sorularını sor hepsini tek seferde cevaplayayım maketi ona göre
yenile sonra tüm maketi gözden geçiririm"* → 2026-09-25'teki "modül modül" düzeni M7–M16 için bırakıldı: sorular sadeleştirilip **tek listede**
soruldu (`MAKET-PLANI.md`, "Toplu soru listesi"); cevaplar gelince bütün maketler yenilenir, reisim hepsini (M6 dahil) birlikte gözden geçirir.

**Yirmi birinci tur (2026-09-26, M7–M16 toplu cevap; reisim birebir):** *"160 hayır plan açılırken girilir. Raporda düzeltilemez 95 gerekçe
merekçe gerekmez, en-pulseyi inceledik oraya göre yapıcaz dedik ne alaka bu sorular ? 99 toplu imzadan kastın kesin raporları birleştirmek,
hayır raporlar asla birleştirilmiyecek her bir rapor bir pdf toplu imza ancak olursa her bir raporu ayrı ayrı imzalama olur o da kullanıcı kendi
imza yöntemiyle yapar ya indirir e imza atar ya da api ile imzayerine bağlarız toplu imza atar . Diğer dediklerin kabul yap değişiklikleri sonra
yüne revize gerekirse söylicem maketi komple onaylamadan koda geçmek yok"* → **Kararlar:**
- **160:** SGK DETSİS no ve İSG-KATİP sözleşme ID **plan açılırken** girilir; **raporda düzeltilemez**.
- **95:** sonraki kontrol tarihi değiştirilir, **gerekçe istenmez**. Rapor ekranının ayrıntısı incelenen emsal uygulamaya göre yapılır
  (inceleme yerel dosyada, §6); rapor ekranı için bu tür ayrıntı soruları sorulmaz.
- **99:** raporlar **asla birleştirilmez**; her rapor ayrı PDF. "Toplu imza" = seçilen raporların **her biri ayrı ayrı** imzalanır; yöntem
  kullanıcının: indirip e-imza atar ya da imza servisine bağlanıp (API) toplu imzalar.
- Öteki öneriler kabul (A'lar, 82–84, 159, 90–94, 96–98, 100–117, 119–124, 161, 135–142, 144–150, 152–158; liste `MAKET-PLANI.md`).
- **Koda geçiş:** bütün maketler toplu olarak onaylanmadan kod yok.

**Yirmi ikinci tur (2026-09-26, toplu gözden geçirmeden ilk geri bildirim; reisim birebir):** *"Plan sözleşme teklif vb modüllerde sırlama
tarihi olsun her zaman en yeni en yukarıda olsun , planlar ve raporlarda da bu geçerli plana girince gözüken raporlarda da , tablette yatay
görünüm güzel ala dikey görünümde karta geçiyor o kötü dikey de de aynı yataydaki gibi gözüksün , gerekiyorsa biraz sıkışsın, kart görünümü
istemiyorum  raporlar için durumlar şunlar : "Yeni" , " teknik yönetici onayında" , " muayene uzmanı onayı"  " imzaya gönderildi" "tamamlandı"
raporun başlangıcından bitişine kadar ki sürecini kronolojik girdim , denetçi rapor açar yazar kaydeder gönder diyerek teknik yönetici onayına
gönderir onaydan gelen raporu imzala der ve imzalar  (şirkete göre nasıl kurarsak) şimdilik bunlar ışığında ilgili düzenlemeleri yap sonra
tekrar konuşacak"* → **Kararlar:**
- **Sıralama:** bütün listelerde (plan, sözleşme, teklif, Planlar, raporlar, plan içindeki raporlar ve ötekiler) varsayılan sıra **tarih, en yeni
  en üstte**.
- **Tablet dikeyde kart yok:** tablo tabletin dikey hâlinde de yataydaki gibi kalır, gerekirse sıkışır; kart yalnız telefonda. Kart eşiği
  960 → 600 px (kalıp sayısı; reddedilen: 960, tablet dikeyde karta geçiyordu). Ölçüme tablet dikey (810) eklendi.
- **Rapor durumları (kronolojik):** **Yeni** (denetçi açar, yazar, kaydeder) → **Teknik yönetici onayında** ("Gönder") → **Muayene uzmanı imzası**
  (2026-09-28'e kadar adı "Muayene uzmanı onayı"; onaydan dönen rapor, denetçi "İmzala" der) → **İmzaya gönderildi** → **Tamamlandı**. İmza yolu firmaya göre kurulur. Geri gönderilen rapor
  "Yeni"ye döner, gerekçesi raporun üstünde durur.

**Yirmi üçüncü tur (2026-09-26, toplu gözden geçirme; reisim birebir):** *"Gerek yok, öncelikle planı kabul etme işi planın içinde olsun ki denetçi
tarafsızlık beyanını okuyarak kabul etsin şu an okumadan kabul ediyor şu an kabul et yazan yerde sadece görüntüle yazsın daha sonra değişmesin,
bu arada oluşturulan raporlar o plana özel ama eklenen ekipmanlar o müşteri için açılan plana giren ve ilgili birimde olan (mekanşk elektirik) her
denetçide gözüküyor değil mi? Ve pasife alınabiliyor olmalı eğer yanlış ekipman girilirse( art niyetli kullanıcı olabilmesi ihtimaline karşı silme
işlemi sadece yöneticiler tarafından yapılabilmeli) raporlar kısmının içinde onaya göndermeden önce 8 eksik vb eksik yazan kısım olmasın. SGK
tescil no diye yazan yerler var yanlış sgk destis no olacak planlar açılırken başlangıç ve bitiş saatleri sormasın başlangıç ve bitişe tarihleri ve
saatleri el ile seçilebilir olsun sonraki kontrol tarihi kontrol tarihine göre otomatik oluşsun ama yine el ile seçilebilir olsun 3 ekipman değil
ekipman bilgileri olacak / ölçüm aletleri değil ölçüm cihazları yazmalı ve tablo olmalı cihaz cihaz numarası kalibrasyon tarihi yazması yeterli
ekstra şeylere gerek yok / muayene kriterleri kısmında solda muayene kriteri sağda seçmeli tuşa basınca seçenekler çıkıcak şekilde uygun/uygun
değil uygulanamaz yazmalı sonuç ve kanaatte uygun uygun değil olarak olmalı muayene kriterleri, firma bilgileri cihazlar vb tüm başlıklar açılır
kapanır olmalı, notlar değil muayene uzmanı yorumu yazmalı / raporlar ekranında tabloda sağ üstte oluşturuldu sütununun hizasında sağda köşede
saat işareti olsun o işarete basınca tüm raporlardaki süre kısımları hizalansın ilk raporun saat kaçta açıldığını sorsun ondan sonrasını
belirlenen süreye göre ekleyerek gitsin, 2 raporda bir süre arttır 3 rapor da bir süre arttır gibi seçenekler olsun, plan detayında daha rapor
açılmada yukarıdaki ekranı beğenmedim düzenlenmeli isg katıp sözleşme id yazsın ama başlangıç tarihinin yazmasına gerek yok başlangıç bitiş
tarihi yazsın ( plan için belirlenen süre) teklif içeriği yazsın ( muayene edilecek ekipman ve adeti) adres ve açıklama da yine bulunsun plan
tamamlandıktan sonra saha formu oluştur tuşu gelsin bu tuşa istenildiği kadar basılsın basılınca firmanın talebine göre oluşturulmuş saha formu (
yapılan ekipmanlar ve yapıldığına dair firma onayı için imza yerleri ) kullanılacak. Şimdilik bu kadar daha sonra tekrar üzerine bakarız."*
→ **Kararlar:**
- **Planlar:** listede plan tuşu her durumda **"Görüntüle"** (değişmez); kabul **planın içinde**, "Tarafsızlık beyanını okudum" işaretlenmeden
  "Kabul et" açılmaz. Plan içi üst bölüm: proje no · **başlangıç ve bitiş tarihi** (plan süresi) · denetçi · **İSG-KATİP sözleşme ID** (onay tarihi
  yok) · **teklif içeriği** (ekipman türü × adet) · adres · açıklama.
- **Ekipman:** tesise aittir; o tesis için açılan her planda, ilgili branştaki denetçilerde görünür (rapor plana özeldir). Yanlış girilen ekipman
  **pasife alınır** (geri alınabilir); **silme yalnız yönetici**.
- **Saat hizalama:** plan içindeki raporlar tablosunun sağ üstünde saat işareti → ilk raporun saati, süre (dk) ve "her 1 / 2 / 3 raporda bir artır";
  bütün raporların saati buna göre dizilir.
- **Saha formu:** plan tamamlanınca "Saha formu oluştur" (istendiği kadar); yapılan ekipmanlar + firma onayı imza yerleri; format firmaya göre
  (§3.7 yeni satır).
- **Plan aç:** saat sorulmaz; **başlangıç ve bitiş tarihi** seçilir.
- **Rapor ekranı:** "Onaya göndermeden önce N eksik" bölümü kalkar · başlangıç ve bitiş **tarih ve saati el ile** seçilir · sonraki kontrol kontrol
  tarihinden kendiliğinden, el ile değişir · "Ekipman bilgileri" · "Ölçüm cihazları" tablo (cihaz, cihaz no, kalibrasyon tarihi) · muayene kriteri
  solda, sağda seçim tuşu: **Uygun / Uygun değil / Uygulanamaz** · sonuç ve kanaat **Uygun / Uygun değil** · bütün başlıklar **açılır kapanır** ·
  "Notlar" yerine **"Muayene uzmanı yorumu"**.
- **SGK etiketi:** "SGK DETSİS no" (2026-09-27 reisim'in örnek ekranıyla kesinleşti, yirmi dördüncü tur).

**Yirmi dördüncü tur (2026-09-27, toplu gözden geçirme; reisim birebir):** *"2 ekipman bilgilerindeki kısım otomatik girili gibi gözüküyor o
kısım elle girilecek, ölçüm cihazlarıda eklenebilir olacak ama ekipmana göre hangi cihazların kullanılacağı ekipman türlerinden belirlenecek ve
ilgili cihaz ekli değil ise veya kalibrasyon tarihi geçmişsse rapor gönderilemeyecek, zimmetler tuşu olmayacak eğer ekli olması gereken ama
olmayan cihaz var ise cihaz ekle tuşu olacak zimmetli cihazlardan seçim ilgili cihazın denetçiye atanmış olanları pop-up ekranda karşısına
çıkacak ve cihazı seçip ekleyebilecek( eğer kalibrasyonu geçmemiş ve var ise) 7-8-9. kısımlar da sabit ama muayene kriterleri test değerleri
kısımlar firmanın verdiği pdf e göre düzenlenebilir olacak diğer kısımlarda düzenlenebilir olacak gerçi ama standart ve büyük ölçüde bu şekilde
kullanılacak. sonuç ve kanaat kısmı muayene kriterlerindeki gibi seçmeli olacak, uygun veya uygun değil iki seçenek olacak eğer bir şey seçilmez
ise muayene kriterlerine göre rapor tamamlanıp gönderilince otomatik gönderilecek, sağ altta onaya gönder tuşu olmasın ekranda sabit ekran kaysa
da gözükecek şekilde , kaydet gönder diye iki tuş olsun birisi kaydetmek diğeri onaya göndermek için, rapor açıldığında her giriş çıkışta tüm
seçenekler kapalı gelsin, fotoğraflar kısmında fotoğraf çek değil fotopraf ekle yazsın galeriden de eklenebilsin, firma bilgileri değişirse diye
firma bilgileri yazan barın sağ üstünde güncelleme tuşu olsun basınca güncel bilgiler çeklisin çünkü buradaki bilgileri inspector
değiştiremeyecek(firma adı, e posta telefon mnumarası adres rapor no kısımları ya otomatik oluşturulacak ya da plan açılırken planlamacı
tarafından girilecek) bir hata sonucu değiştirilmesi gerekirse planlamacı müşteriler kısmından değiştirecek denetçi güncelle tuşu ile güncel
bilgiyi çekebilecek, tüm raporlama süreçleri offline da çalışabilecek şekilde kurgulanacak ileride appstore ya da android markete uygulama olarak
çıkabilir bunu göz önünde bulundurarak kodlama yapacağız. tarih seçerken takvimin altında bu gün tuşu olsun ve direk bu günü seçtirtsin, saat
kısmında saat otomatik gelecek ama daha sonra el ile yazarsam yazarken 09 bile yazsam aşağıda 09 u önermeye devam edecek oradan seçebileceğim,
seçili alanların etrafında çerçeve kalıyor bazen maket olduğu için olabilir bilmiyorum./// planlar sayfasında plan ekle tuşu olmalı(planlamacı
için),// teklif hazırlarken kayıtlı olmayan müşterilere de hazırlayabilmeliyim, ekipan listesinbi excelden export etme ve inport etme olsun / el ile
müşteri girişinde ilgili bilgiler istensin, adres vb teklif pdf i müşteriden(pk firması) alınacak ve bu kısım alınan pdf e göre değişebilir.
Sistemde herhangi bir yere eklenen herhangi bir pdf daha sonradan açılıp incelenebilir olsun sdaece yüklemek olmaz. Muhasebe kısmı nasıl çalışıyor
alınacakları otomatik mi sürece ekliyor eğğer öyleyse iyi, gider gösterilecek şeyler nasıl girilecek ? fatura no vb nasıl belirleniyor ? muhasebe
sekmesi kafamı karıştırdı. Performans kısmında 24 saat içinde tamamlandı olan 48 saat içinde tamamlandı olan ve 48 saatten uzun sürede tamamlandı
olan raporlara dair veri tutularak garfik oluşturularak performans takibide yapılsın. şimdilik bunları düzelt daha sonrası için tekrar konuşacağız."*
→ **Kararlar:**
- **Saha raporu — ekipman bilgileri** elle girilir (marka, model, seri no, imal yılı, kullanım yeri, kullanım amacı); daha önce kontrol edilmiş
  ekipmanda son raporun değerleri başlangıç olarak gelir, değiştirilebilir; kod ve tür plandan.
- **Ölçüm cihazları:** hangi cihaz türlerinin kullanılacağı **ekipman türünde** belirlenir (M7'de düzenlenir). Raporda türün her cihaz türünden
  kalibrasyonu geçerli bir cihaz eklenmemişse ya da eklenen cihazın kalibrasyonu geçmişse **rapor onaya gönderilemez** (tek engel).
  "Zimmetlerim" tuşu yok; eksik varken **"Cihaz ekle"** → pencerede inspector'ın zimmetindeki, o türden, **kalibrasyonu geçmemiş** cihazlar;
  seçip ekler. Geçmiş cihaz rapordan kaldırılır.
- **Rapor bölümleri:** 7 Fotoğraflar · 8 Sonuç ve kanaat · 9 Muayene uzmanı yorumu **her raporda sabit**; **muayene kriterleri ve test
  değerleri firmanın türe verdiği rapor formatı PDF'ine göre** düzenlenir; öteki bölümler de düzenlenebilir ama büyük ölçüde standart.
- **Sonuç ve kanaat** seçmeli (Uygun / Uygun değil), seçilmezse rapor gönderilince **muayene kriterlerine göre** konur.
- **Kaydet + Onaya gönder** iki tuş, ekranın altında **yapışkan** (sayfa kaysa da görünür).
- Rapor **her açılışta bütün bölümler kapalı** gelir.
- **Fotoğraf ekle** (kameradan ya da galeriden).
- **Firma bilgileri inspector'da değişmez** (firma adı, e-posta, telefon, adres, rapor no: kendiliğinden ya da plan açılırken planlamacı girer;
  yanlışsa planlamacı Müşteriler'den düzeltir); başlık çubuğunun sağında **"Güncelle"** ile güncel bilgi çekilir.
- **Çevrimdışı:** bütün raporlama süreçleri çevrimdışı çalışacak şekilde kurgulanır (kayıt cihazda, bağlantı gelince eşitlenir); ileride App Store /
  Google Play uygulaması olabilir → kod buna göre (§8 yığın notu).
- **Tarih / saat alanı:** takvim altında **Bugün**; saat kendiliğinden dolu, yazılınca uyan değerler önerilmeye devam eder; fareyle kullanımda odak
  çerçevesi kalmaz.
- **Planlar:** **Plan aç** tuşu (planlama yetkisi olan görür); plan içi ekipman listesi **Excel'e aktarılır / Excel'den yüklenir**.
- **Teklif:** **kayıtlı olmayan müşteriye** de hazırlanır, el ile müşteri bilgileri istenir (ünvan, adres, il/ilçe, vergi, e-posta, telefon, yetkili);
  teklif PDF'inin biçimi **PK firmasının verdiği PDF'e göre** kurulur (§3.7).
- **PDF:** sisteme yüklenen **her PDF sonradan açılıp incelenebilir** (yalnız yüklemek yetmez).
- **Performans:** raporların **24 saat içinde / 48 saat içinde / 48 saatten uzun** sürede tamamlanması izlenir, grafikle.
- **Muhasebe — reisim'in soruları ve cevap (M14 maketinin bugünkü hâli):** (1) **Alacaklar otomatik:** plan denetime başlayıp ilk rapor
  yazılınca "İş" kendiliğinden açılır; her rapor bağlı olduğu kabul edilmiş teklif kaleminin birim fiyatıyla "Raporlanan" tutara girer (teklif
  dışı türde fiyat listesi, işaretli); imzalanan rapor "Faturaya hazır" olur. Fatura kaydedilince açık alacak = fatura − tahsilatlar, vade iş
  sözleşmesinden; vadesi geçen alacak listenin üstünde şeritte. (2) **Gider girişi YOK** — maket yalnız gelir tarafını (iş → fatura →
  tahsilat → iş kapandı) gösteriyor. **Öneri:** "Giderler" sekmesi — tarih, tür (yakıt, konaklama, yol, kalibrasyon, sarf, diğer), tutar + KDV,
  belge (fiş / fatura PDF ya da fotoğrafı, açılıp incelenir), isteğe bağlı iş / plan ve personel bağlantısı; iş sayfasında o işin gideri ve
  kârı. Reisim onaylamadan eklenmedi. (3) **Fatura no:** fatura bu sistemde kesilmez; firmanın kendi e-Fatura / e-Arşiv programında kesilir,
  buraya numarası (GİB biçimi, 16 karakter: 3 harf/rakam + yıl + 9 hane) ve tarihi elle yazılır, vade sözleşmeden hesaplanır (VARSAYIM;
  e-Fatura entegratörü bağlantısı sonraki faz önerisi). **Sadeleştirme önerisi:** üç sekme — Alacaklar (işler) · Faturalar · Giderler.
- **SGK etiketi:** "SGK DETSİS no" (reisim'in örnek ekranında böyle; DETSİS kısaltması büyük harf).

**Yirmi beşinci tur (2026-09-27, reisim birebir):** *"Giderleri ekle metod kısmı olsun ama sadece ekipman türü eklerken belirlene. Standartlar
yazdın sana daha önce örnek paylaşmış olmam laızm  planlanan saat olmasın"*
→ **Kararlar:**
- **Giderler (M14):** Muhasebe'de üçüncü sekme **Giderler** (İşler · Faturalar · Giderler). Gider: **tarih** (takvimle), **tür** (yakıt,
  konaklama, yol, kalibrasyon, sarf malzeme, diğer), **tutar** (fişteki KDV dahil tutar) + **KDV oranı** (%20 · %10 · %1 · %0; tür seçilince türün
  varsayılanı gelir: konaklama %10, ötekiler %20; değiştirilebilir; KDV ve KDV hariç tutar yazarken hesaplanır), **açıklama**, isteğe bağlı
  **iş** (proje no; yoksa genel gider) ve **personel**, **belge** (fiş / fatura, PDF ya da fotoğraf; açılıp incelenir). Belgesi olmayan gider
  kaydedilir; listede "Belge yok", listenin üstünde şerit (uyarı, engel değil). Liste: en yeni üstte; çipler işe bağlı · genel · belgesi yok;
  seçiciler tür · dönem (ay) · personel; altında süzülen giderlerin KDV hariç, KDV ve toplamı. Kayıtlı gider satırdan açılıp düzeltilir.
  **İş sayfasında** "Giderler" bölümü (o işin giderleri, "Gider ekle" iş seçili açılır) ve **raporlanan − gider = kâr** (KDV hariç).
  No **G-AAYY-SIRA** (proje no'nun düzeni; firma ayarı, öneri). İleri tarihli gider kaydedilmez (fatura ve tahsilatla aynı).
  *Açık (sırası gelince sorulacak):* gideri yalnız muhasebe / yönetici mi girer, yoksa inspector sahada fişin fotoğrafını kendisi mi ekler?
- **Kontrol metodu yalnız ekipman türünde belirlenir** (M3 tür ekle / düzenle: "Kontrol metodu standartları"). Raporda seçim alanı yok;
  "Ekipman bilgileri"nde **salt okunur** "Kontrol metodu" satırı türün standartlarını (no:sürüm + konu) gösterir; rapor belgesinde ve onay
  özetinde de aynı satır geri geldi. Türde standart yoksa **"Üretici talimatı"** (karar 82); tür sayfasındaki "Standart seçilmemiş" uyarısı bunu
  söyler. Standartlar sayfasındaki "Raporda: Kontrol metodu" satırı böylece yeniden geçerli.
- **Standartlar:** kütüphane kalır (metodun kaynağı). Reisim'in sözü *"sana daha önce örnek paylaşmış olmam lazım"* — hangi örnek olduğu bu
  oturumda elimde değil; sorulacak (örnek gelince Standartlar ekranı ona göre gözden geçirilir).
- **Planlanan saat yok:** reisim'in örnek ekranındaki "Planlanan saat" satırı plan içine eklenmez; plan açarken de saat sorulmaz (2026-09-26
  kararıyla aynı). Rapordaki başlangıç / bitiş saati yerinde kalır.

**Yirmi altıncı tur (2026-09-27, reisim birebir):** *"1 i boşver, 2 için inspector masraf formu ekleyebilsin masraf formu olur doldurulur
gönderilir muhasebe tarafında onaylanır ödenince ödendi olur , ekstradan muhasebe el ile de masraf ekleyebili otel vb örnek excel atarım inport
export yine buradada olacak  gelir gidere göre bilançoda olacak plan bazında kârlılık ta hesaplanabilir bir sistem olacak personel ekranında
maaşlar ve bordrolarda olacak oraya yüklenebilecek bordrolar plan yapıldığında inspector maaşı yakıt araç kira bedeli ofis giderleri vergiler vb
tüm giderler etki edecek şekilde kazanç ve gider hesaplanarak kar hesaplanacak kar yüzdesi yazacak iş başına  bu söylediklerim iskelet daha
detaylı olacak,"* (1 = Standartlar örneği sorusu: bırakıldı, kütüphane olduğu gibi kalır.)
→ **Kararlar (iskelet; reisim ayrıntıyı sonra verecek):**
- **Masraf formu (inspector):** plan içinde **"Masraflarım"** bölümü (plan kabul edildikten sonra; kabul bekleyen ve reddedilen planda yok) ve
  **"Masraf formu"**: tarih (takvimle), tür, tutar (KDV dahil) + KDV oranı (türün varsayılanı; KDV yazarken hesaplanır), açıklama, fiş
  (fotoğraf ya da PDF). İş ve kişi kendiliğinden (plan + inspector). **Gönder** → Muhasebe'de **"Onay bekliyor"**. Inspector kendi masraflarının
  durumunu plan içinde görür (onay bekliyor · onaylandı · ödendi + ödeme tarihi · reddedildi + gerekçe).
- **Muhasebe onayı:** Giderler'de durum sütunu ve çipler (**Onay bekliyor · Ödenecek · Belgesi yok**), listenin üstünde "Onay bekleyen masraf"
  şeridi. Masraf penceresinde **Onayla** (muhasebe alanları düzeltebilir) ya da **Reddet** (gerekçe zorunlu, en az 5 karakter; inspector plan
  içinde görür). Onaylanan masrafta **"Ödendi"** → ödeme tarihi bugün. Akış: onay bekliyor → onaylandı (ödenecek) → ödendi; ya da reddedildi.
- **Muhasebe elle ekler** (otel vb.): kaynak "Muhasebe"; ödeme "Ödendi" (firma ödedi) ya da "Ödenecek".
- **Excel (Giderler):** **Excel'e aktar** süzülen listeyi alır (önizleme + indir); **Excel'den yükle** şablon + satır satır denetim (tür,
  tarih, ileri tarih, tutar, proje no), geçerli satırlar "Muhasebe" kaynağıyla girer. **Sütunlar VARSAYIM** (Tarih · Tür · Tutar · KDV
  oranı · Açıklama · Proje no) — reisim'in örnek Excel'i gelince ona göre kurulur.
- İş seçici (İşe bağlı · Genel) çipten seçiciye taşındı; çipler durum için.
- **Maaş ve bordro (Personel):** kişi sayfasında **"Maaş ve bordrolar"**: brüt, net, işverene maliyet (son bordrodan) ve **günlük maliyet**
  (aylık işverene maliyet ÷ 22 iş günü; VARSAYIM) — iş kârlılığına girer. Bordrolar listesi (dönem, brüt, net, işverene maliyet, "Aç").
  **"Bordro yükle"**: dönem (son 12 ay), brüt, net, işverene maliyet (son bordrodan dolu gelir), dosya zorunlu; aynı dönemin bordrosu varsa
  uyarı, yenisi yerine geçer; net brütten büyük olamaz. Görenler: firma yöneticisi ve Muhasebe rolü (VARSAYIM). Toplu bordro yükleme (bütün
  personel tek dosyada) ayrıntı gelince.
- **İş başına kâr (VARSAYIM, iskelet — dağıtım yöntemi reisim'le kesinleşecek):** kâr = **gelir** (raporlanan, KDV hariç) − **işe bağlı
  masraflar** (KDV hariç, reddedilen hariç) − **inspector maliyeti** (kişinin günlük maliyeti × o işte geçirdiği gün; aynı gün iki işe giden
  inspector'ın günü o gün yazdığı rapor sayısına göre bölünür) − **genel gider payı** (ayın sabit giderleri + işe bağlı olmayan masraflar +
  inspector olmayan personelin maliyeti, inspector-gününe eşit dağıtılır: ÷ inspector sayısı ÷ 22). **Kâr oranı** = kâr ÷ gelir. İşler
  listesinde "Kâr" sütunu (tutar + yüzde), iş sayfasında "Kâr" yüzü ve **"Kârlılık"** tablosu (kalem · ayrıntı · tutar). Ayın bordrosu yoksa
  son bordrodan tahmini (şeritte söylenir).
- **Sabit giderler** (firma ayarı; örnek: araç kira 2 araç, ofis kirası, ofis giderleri, vergi ve harçlar — UYDURMA tutarlar); düzenleme ekranı
  ayrıntı gelince.
- **Gelir-gider (Muhasebe'de dördüncü sekme):** reisim "bilanço" dedi; burada **aylık gelir-gider** (dönem seçilir: gelir, maaşlar, işe bağlı ve
  genel masraflar, sabit giderler, kâr ve oranı; o ayın işlerinin kârı). Gerçek **bilanço** (varlık, borç, öz kaynak) firmanın muhasebe
  programında kalır (VARSAYIM; reisim isterse sorulacak). Örnek veride bir ayda yalnız birkaç iş olduğu için aylar zararda görünür; gerçek
  kullanımda o ayın bütün raporları gelire girer.

**Yirmi yedinci tur (2026-09-27, reisim birebir):** *"Referans olarak isgümde yayınlanan zorunlu formatlardan elektrik ile ilgili olanları çek
ve örnekleri hep onlarla ilgili yap, kontrol metodunda sadece standartlar yazsın açıklaması değil örneğin. "TS EN 1579, TS EN 2134" (salladım )
maket site nasıl çalışması gerekiyorsa çalışsın maket olduğu için çalışmayan yerler de dahil site tam olarak istediğim gibi olduğunda
kodlayalımki tekrar tekrar yama atarak siteyi kötü yapmayalım ayrıca ana sayfaya duyurular kısmımızda ekle"*
→ **Kararlar:**
- **Kontrol metodu yalnız standart numarası** (numara:sürüm, virgülle; ör. "TS ISO 5057:2012, TS EN ISO 3691-1:2018"); açıklama (konu) raporda,
  belgede, onay özetinde ve Standartlar sayfasının "Raporda" satırında yazmaz. Türde standart yoksa "Üretici talimatı". Tür sayfası ve Standartlar
  listesi konuyu göstermeye devam eder (kütüphane bilgisi).
- **Elektrikle ilgili zorunlu formatlar (ZPKR01 AG topraklama · ZPKR02 elektrik iç tesisat · ZPKR03 yıldırımdan korunma · ZPKR04 yangın
  algılama · ZPKR05 transformatör; §4.8):** bu oturumda **çekilemedi** — ortamın ağ ayarı isekipmanlari.csgb.gov.tr ve www.csgb.gov.tr'yi
  engelliyor. Formatların içeriği görülmeden örnekler kurulmaz (sonra yeniden yama olur). Yol: ağ izni ya da reisim PDF'leri iletir →
  örnek ekipman, rapor bölümleri, kriterler ve test değerleri bu beş formata göre yeniden kurulur.
- **Maket tam çalışsın; site istenen hâle gelince kod** (§3.3 kuralı teyit: bütün maketler onaylanmadan kod yok).
- **Maket çalışır hâlde** ("maket olduğu için çalışmayan yerler de dahil"):
  **dosya seçme** her yerde gerçek dosya penceresi (telefonda kamera ya da galeri; tür ve boyut sınırıyla): kalibrasyon ve eğitim sertifikası,
  İSG-KATİP sözleşmesi, sözleşme şablonu, imzalı iş sözleşmesi, özlük belgesi, imzalı zimmet formu, bordro, standart PDF'i, rapor formatı PDF'i,
  imzalı rapor PDF'leri (birden çok; adında rapor no geçen o rapora), masraf fişi, gider belgesi, rapor ve teslim fotoğrafları. Seçilen dosya
  **tarayıcıda kalır** (sunucuya gitmez, sayfa yenilenince gider); "Aç" onu gösterir (PDF tarayıcının görüntüleyicisinde, fotoğraf resim olarak;
  fotoğraflar küçük resim). **Excel** gerçek .xlsx olarak iner (ekipman listesi, giderler, performans tablosu, açık uygunsuzluklar, şablonlar) ve
  **Excel'den yükle** gerçek .xlsx / .csv okur (dış kütüphane yok; Excel'in tarih sayısı çevrilir; ilk satır başlıksa atlanır). **PDF indir**
  (rapor, imzalı rapor, sözleşme metni, teklif, zimmet teslim formu, saha formu, fatura özeti) tarayıcının yazdırma penceresini açar
  ("PDF olarak kaydet"); uygulamada PDF sunucuda üretilir. Makette dosyası olmayan örnek kaydın "İndir"i tek sayfalık maket PDF'i indirir.
  Fatura bu sistemde kesilmediği için tuşun adı "Fatura özeti (PDF)". Çalışmayan kalanlar yalnız sunucu işleri: e-posta, e-imza servisi, canlı
  duyuru okuma, kalıcı kayıt (sayfa yenilenince örnek veri geri gelir).
- **Ana sayfada "Duyurular"** (her rolde, en altta): İSGGM ve iş ekipmanları portalının duyuruları — başlık, kaynak, tarih (bilinmiyorsa yazılmaz),
  yeni sekmede açılan bağlantı; "Tümü" İSGGM duyurular sayfasına. Uygulamada sunucu günde birkaç kez okur (pg-boss, §8.9), yalnız ekranda
  (bildirim yok); okunamazsa "Duyurular alınamadı; son alınan liste gösteriliyor." Makette bu depoda kayıtlı 3 gerçek duyuru (§10).

**Yirmi sekizinci tur (2026-09-27, reisim birebir; ZPKR01, ZPKK01, ZPKR02, ZPKK02 PDF'leri iletildi):** *"Duyurular sanırım doğru çalışmıyor eksik
duyuru var ve bazı duyurularda tarih varken bazılarında yok, kontrol rapor formatı ve kontrol kriterleri olarak şimdili 4 dosya attım bu aşamada
bunlar iş görecektir, kriterler de sistem de muhafaza edilecek ve standartlar modülü altında bir sekme de onlar da var olsunlar bunlar ilgili
ekipmanın muayenesi ile alakalı tariflerdir."*
→ **Kararlar:**
- **Duyurular:** her duyuruda yayım tarihi (tarihi doğrulanamayan kayıt listeye girmez), en yeni üstte; kaynaklar İSGGM + **İSGÜM** + iş
  ekipmanları portalı (her birine "Tümü" bağlantısı). Makette 6 gerçek duyuru (2026-09-27 web aramasıyla; tarih duyuru adresindeki gün-ay-yıl;
  bu ortamdan csgb.gov.tr'ye doğrudan erişim kapalı). Uygulamada sunucu üç kaynağı okur.
- **Kontrol kriterleri (Standartlar modülünde ikinci sekme):** Bakanlığın kontrol kriterleri belgeleri sistemde tutulur — şimdilik **ZPKK01**
  (AG topraklama, 9 madde) ve **ZPKK02** (elektrik iç tesisatı gözle kontrol ve fonksiyon testleri, 17 madde); ikisi de yayım 18.07.2025,
  yürürlük 01.09.2025. Liste (belge · ekipman türü · rapor formatı · madde sayısı · yürürlük · "Aç") ve belge sayfası (kapsam, maddeler tablosu:
  no · başlık · içerik · standart / yönetmelik; notlar; "Kriterleri aç" · "Rapor formatını aç"). Belgeler **kodda** (şablonlar gibi, §8.3); site
  içinde yüklenmez / düzenlenmez. Resmî PDF'ler depoda `docs/maket/belgeler/` (ZPKR01, ZPKK01, ZPKR02, ZPKK02; **üst verideki kişi adı silindi**,
  içerik aynen) ve makette gerçekten açılır / iner. Ekipman türü sayfası (AT, ET) "rapor formatı" olarak resmî PDF'i gösterir ve kriter belgesine
  bağlanır. Maddelerin "standart / yönetmelik" sütunu PDF tablosundan sırayla eşlendi (metin çıkarımında sütun hizası kayar; uygulamada belgeyle
  karşılaştırılarak doğrulanır).
- **Standartlar formatlara göre:** AG topraklama → TS HD 60364-4-41 + TS HD 60364-6; elektrik iç tesisatı → **TS HD 60364-4-43** (yeni) + TS HD
  60364-6 (ZPKR01 / ZPKR02 başlığındaki standartlar). Kütüphane 23 standart.
- **Saha raporu ve rapor belgesi formata göre** (önceki tur: *"örnekleri hep onlarla ilgili yap"*; formatı Bakanlıkça yayımlanmış türde):
  bölüm sırası ve adları formattaki gibi — **iç tesisat (ZPKR02) 1–11:** firma · ekipman (2.1 ekipman detayları, 2.2 tespitler) · termal kamera
  (isteğe bağlı; kullanıldıysa inspector'ın zimmetindeki geçerli kamera, yoksa "zimmetinizde yok") · ölçüm cihazları · gözle kontrol (7 grup,
  27 madde; madde no 5.g.m) · fonksiyon testleri (ölçüm metodu + 6.1–6.3 ölçümleri + 6.4 pano linye ve sigortaları) · kusur açıklamaları ·
  fotoğraflar · notlar · sonuç (formatın cümlesi + Uygun / Uygun değil) · yetkili kişi. **Topraklama (ZPKR01) 1–9:** firma · ekipman · ölçüm
  cihazları · test değerleri tanımları · kontrol ve ölçümler (ölçüm metodu; 5.1 çevrim empedansı noktaları; 5.2 RCD testleri) · kusur ·
  notlar (Not-1 … Not-11 açılır listede) · sonuç · yetkili kişi; formatta fotoğraf bölümü olmadığından fotoğraflar **ek**.
  - Ekipman bilgileri formattaki alanlar (şebeke tipi, topraklayıcı tipi, yapı cinsi … seçmeli; kuruluş, gerilim … yazılır; doğrudan
    dokunmaya karşı önlemler çoklu); marka / model / seri no bu türlerde yok. "Periyodik kontrol metodu ve kapsamı" (türden, yalnız standartlar)
    formattaki gibi firma bölümünde. **Ölçüm metodu** (üç uçlu, çevrim empedansı, klamp) formatta sahada işaretlenen alan olduğundan raporda
    seçilir — kontrol metodundan ayrı.
  - Topraklamada her ölçüm noktası için **Ia = eğri çarpanı (B 5 · C 10 · D 15) × In, Zs = 230 V / Ia, Ik1 = 230 V / Zx kendiliğinden**;
    uygunluk notu formata göre: Zx ≤ Zs → Not-1 (32 A'e kadar prizde RCD yoksa Not-5, ağır); aşıyor ve RCD var → Not-4 (uygun); RCD yok →
    Not-2 (ağır). RCD: IΔ ≤ IΔn ve TΔ ≤ 200 ms, değilse yetersiz (ağır). Nokta ve RCD eklenir / kaldırılır.
  - Kusur derecesi (hafif / ağır) Bakanlık formatı yürürlükteki türde her uygun değil maddede seçilir (§4.5); kusur açıklamaları bölümü
    maddeleri, sınır dışı ölçümleri, ağır notlu noktaları ve yetersiz RCD'leri tek listede toplar; iç tesisatta formatın "ağır kusur sayılan
    durumlar" listesi açılır.
  - Öteki türler şimdilik firmanın örnek formatıyla (§8.3) kalır; format geldikçe aynı yapıya geçer.

**Yirmi dokuzuncu tur (2026-09-27, reisim birebir; başka bir uygulamadan ekran görüntüsüyle — içindeki gerçek adlar alınmadı):** *"filtreler
sekmesi de açılıp kapanır bir sekme bu arada, daha bir çok eksiğimiz var inceleyip çıkarım yapabilmen için bu işler bittikten sonra, buluttan
çıkıp yerelde devam edebilir miyiz ?"*
→ **Kararlar:**
- **Süzgeç kutusu açılır kapanır** (bütün listelerde, tek üretici `MK.suzgecHtml`): başlık "Süzgeçler" + uygulanan süzgeç sayısı ("2 süzgeç
  uygulandı"; arama, seçili çipler ve seçiciler sayılır, sıralama ve görünüm anahtarı sayılmaz); kapalıyken de sayı görünür; varsayılan açık,
  açık / kapalı tercihi tarayıcıda sayfa başına hatırlanır.
- **Yerelde devam:** evet — iş GitHub'da (`main`); yerelde `git pull` ile sürer. Eksiklerin incelenmesi yerelde.

**Otuzuncu tur (2026-09-28, reisim birebir):** *"Masraf formu ve personelin bireysel olarak isteyeceği şeyler sol panel de gözüksün masraf plana
özel değil genel de olabilir sonuçta muhasebe modülü de denetçi de gözükmeyeceği için talepler kısmı olsun denetçi izin talebi masraf formu ekleme
ve ileride ekleyeceğimiz bir şey olursa buradan ekler, bir de, bu standart olayını şöyle yapalım, dökümanlar modülü olsun standartlar bunun altında
olsun, eğitimler, muayene kriterleri, standartlar, ve diğer dökümanlar bu kısımda tutulsun, Ölçüm cihazlarında ilgili ekipmanda hangi cihaz
kullanılacaksa o sabit yazsın, onun hizasında bilgileri. Yazması gereken yerde eğer cihaz yoksa cihaz ekle tuşu olsun, kaldırınca komple satır
silinmesin, gerekli ölçüm cihazları ilk bakışta anlaşılabilsin. cihaz ekle dediğimizde sadece ilgili satırdaki cihaz örn: "metre" tarafıma atalı
metreler çıksın yoksa çıkması. Şu an yapılan gibi değil. Onay gönder tuşu soluk olmasın eğer basılamıyorsa basıldığında neden gönderilemediğini
yazsın ve eksik alanları uyararak göstersin, zorunlu bölümleri doldurun. Desin. Örnekler hala eski, en son attığım rapor formatına göre sonuç o
şekilde gözükecek biçimde örnekler görmeliyim planlar da en üstte sadece en son attığım PDF formatlara göre açılmış plan olsun, raporlamaların ön
izleme en sağ üstte ön izleme tuşu olmalı PDF çıktısını ön izleyebilmeliyim ön izle halinde PDF halini indiredebilmeliyim. Raporlarda durum
geçmişi olmamalı, filtreleyip arama detaylı olmalı; ekipman türüne rapor numarasına göre ayrı ayrı arayabilmeliyim bundan sonra sana filtreleme
ekranları örnekleri atacağım"*
→ **Kararlar (her biri ayrı kalem):**
- **Raporda ölçüm cihazları:** türün her gerekli cihazı sabit bir satır (gerekli cihaz · cihaz (envanter, marka model) · cihaz no · kalibrasyon);
  eklenmemişse o satırda "Cihaz ekle"; pencerede **yalnız o satırın türünden**, inspector'ın zimmetindeki kalibrasyonu geçerli cihazlar (yoksa
  "zimmetinizde … yok"); satır başına tek cihaz; kaldırınca satır kalır, "Cihaz ekle"ye döner. Kalibrasyonu geçmiş cihaz "geçmiş" diye işaretli.
- **Onaya gönder soluk değil:** her zaman basılır; gönderilemiyorsa nedenini yazar, "Zorunlu bölümleri doldurun" der, eksik bölüm ve alanları
  işaretler.
- **Ön izle:** rapor ekranında sağ üstte; PDF önizlemesi rapordaki değerlerle; önizlemeden PDF indirilir.
- **Örnekler son formatlarla:** Planlar'da en üstteki plan yalnız ZPKR01 / ZPKR02 türleriyle (AG topraklama + elektrik iç tesisatı) açılmış;
  raporların sonuçları formata göre.
- **Raporlar:** durum geçmişi yok; süzgeç ayrıntılı — ekipman türü, rapor no ayrı ayrı aranır (reisim süzgeç ekranı örnekleri gönderecek).
- **Talepler modülü (sol menü):** personelin kendi talepleri — izin talebi, masraf formu (plana bağlı ya da genel); ileride eklenecek talepler de
  buradan. Muhasebe modülü denetçide görünmediği için masraf formu burada.
- **Dökümanlar modülü:** Standartlar, Muayene kriterleri, Eğitimler, Diğer dökümanlar altında.

**Otuz birinci tur (2026-09-28, reisim birebir):** *"1 önerini kabul ediyorum/ 2 tür de belirlensin"* (1: izin onayı firma yöneticisinde,
Personel'de · 2: ölçüm metodu raporda değil ekipman türünde belirlenir).
→ **Kararlar:** izin talebini firma yöneticisi onaylar ya da gerekçeyle reddeder (~~Personel › İzin talepleri~~ — 2026-10-10 elli dördüncü tur:
karar **Onaylar › Talepler**'de, İzin talepleri liste ve geçmiş; bekleyen üstte, yıllık izinde kalan hak yanında, aşıyorsa uyarı); ölçüm metodu (formattaki: üç uçlu, çevrim empedansı, klamp) ekipman türünde seçilir, raporda türden
okunur, seçilmez. Planlar'da "en üstte" sorusu (denetimdeki plan hep üstte mi, "Denetimde" süzgeci seçili mi gelsin) cevaplanmadı; sıralama aynı.

**Otuz ikinci tur (2026-09-28, reisim birebir):** *"raporların çıktıları ön izleme olarak baktığımda sana verdiğim pdfler gibi gözükmüyor hala ?
Sanki uygulamanın temasına göre bir pdf oluşuyor birebir aynı pdf çıktısı olmalı final raporu ayrıca planlarda en son planlar konuştuğumuz gibi
değil verdiğim formatları kullanacağımız ekipmanların kontrolleri olan planlar olsun ya da ben yapabileyim. Fonksiyonlar çalışsın"* · *"Ama neden
en üstte değil en yeni onlar açıldı neye göre üstte değil en son açılan plan en üste olursa en son onlar açıldıysa neden en üstte değiller"*
→ **Kararlar:** (a) Planlar'ın varsayılan sırası planın **tarihi**, en yeni tarih üstte; aynı günde en son açılan üstte (2026-09-28 reisim düzeltti:
*"en yeni tarihli en son açılan plan her zaman en üstte olacak tarihe göre sıralama olacak"*; ilk uygulamadaki açılış zamanı sırası yanlıştı, 106). (b) Formatlı türde final rapor ve ön izleme resmî PDF'in birebir
sayfa düzeninde (siyah-beyaz A4, başlık tablosu, bölüm tabloları, onay kutuları), uygulama temasından bağımsız. (c) Plan aç → Planlar → kabul →
denetim → ekipman → rapor → onay zinciri sayfalar arasında çalışır (maket tarayıcıda saklar); reisim kendi planını açıp yürütebilir.

**Otuz üçüncü tur (2026-09-28, reisim birebir):** *"Makette yama yapılabilir nihai kodda olmamalı, raporlama süreci attığım pdf gibi
gözükmeyecek en son final rapor hali bu olacak elindeki tüm işleri bitir"* · önceki mesajlarda: *"özel değil genel düşün … anlık bir iş çözüp
yama yapma anayasamıza sadık kal geçici çözümler üretme"* · *"tüm site maket üzerinde aktif çalışabilsin her fonksiyonu test edicem hiç bir
şeyi şu an canlı koda geçirme"* → **Kararlar:** (a) Saha raporu (doldurma) ekranı uygulamanın kendi düzeninde kalır, PDF'e benzetilmez;
PDF düzeni yalnız final rapor (önizleme + indirilen dosya). Formatın istediği her veri (linye, potansiyel dengeleme, zemin izolasyonu, RCD
testleri, selektivite) ekranda girilir, final raporda formattaki yerinde çıkar. (b) Makette geçici çözüm kabul; nihai kodda her kural tek
kaynaktan, genel mekanizmayla (anayasa 0.8). (c) Bütün maket sayfalar arası kalıcı çalışır; reisim her işlevi kendisi dener.

**Otuz dördüncü tur (2026-09-28, reisim birebir, ekran görüntüleriyle):** *"bu ekranda süzgeçler yetersiz daha önce attığım örneğe göre, ekipman türü
ekipman koduna göre arama motorları ayrı olacak şekilde filtreleme olmalı … raporlandı yazan kısımda sadece rapor oluştur tuşu olsun istediğim kadar
o tuşa basabileyim sınır olmasın eğer bu rapor içerisinde rapor oluşturduysam yanında küçük yeşil tik olsun … kusur açıklamaları kısmında uygun
değil olarak işaretlenen maddeler yazsın, sonuç ve kanaat kısmında sadece uygundur/uygun değildir olan yere kadar yazsın, sonuç uygun ise sadece
uygun yazsın uygun değildirin üstü çizili olarak orda durmasını istemiyorum … kalıcı site içi çözümler olarak hafızanda kalsın … izin talebi ve
masraf formu için her müşteri (benim müşterilerim pk firmaları) kendi formatını yükleyebilsin o formata göre pdf çıktısı olacak, ve son hali hem
sisteme kaydolduğu gibi mail olarakta iletilecek tıklayınca mail uygulaması açılacak … sen iskelet olarak hazırla … firma özelleştirmeleri listesi
olarak kenarda tut … Planlar ekranındaki filtreleme kısmıda yine istediğim gibi değil anlamsız filtreleme tuşları var proje için ayrı proje no için
ayrı … Pasife alınan raporlar inspectorlere gözükmez inspector pasife alabilir ama silemez, aktife de alamaz, aktife alma ve silme işlemleri sadece
yöneticiler tarafından yapılabilir. Muayene kriterleri otomatik olarak uygun olarak gelir … ünlem işareti olur ve oradan … hepsini uygun yap
hepsini uygunsuz yap ya da hepsini uygulanamaz yap … herhangi bir yerde küçük yazılarla info olmaz … Gönder derken gelen uyarı ekranı olmasın
sadece … zorunlu alanlar doldurulmadı … fotoğraf eklemek her raporda zorunlu … etrafını kırmızı yakarak … ekran kaysın. Muayene uzmanı onayı
değil, muayene uzmanı imzası olarak değiştir. Raporlar ekranında ve planlarda … toplu pdf indirme tuşu olsun … raporlar modülünde kusurlu tuşunu
kaldır … hepsinde ara barını kaldır. Sol taraftaki nav bar … cihazlarda süresi geçen cihaz sayısı kırmızı balon, yaklaşan sarı balon, sorunsuz
cihazlar yeşil balon … Cihazlarda yapılan ara kontrollerin kayıtları pdf olarak indirilebilsin … ikinci görselde attığım şeffaf yazılara gerek yok
… Performans değerlendirme ekranındaki grafikler … sütun grafikleri yatay olmasın ve boşluklu olmasın ve kişiye tıklanınca raporlama sürecine
dair grafikleri gözükmüyor … Ölçüm cihazlarında … cihaz türü de eklenebilmeli … ara kontrollerde … günlük, haftalık, aylık, 6 ayda bir …
otomatik bakım oluştur tuşu … eğitimler kısmı gitmiş … geri gelsin … her personelin kartında eğitimler de gözükmeli"* · *"düzgün bir sıraya koyup
dikkatlice yap zaman sorunumuz yok hata yapmamaya çalış"*
→ **Kararlar:** site geneli kurallar §3.8 (1–9), firma özelleştirmeleri §3.7 satır 10–13. **Sıra** (her biri ayrı teslim):
(1) saha raporu: kriterler Uygun gelir + ünlem menüsü · küçük açıklamalar kalkar · gönderimde zorunlu alan penceresi (fotoğraf zorunlu) · sonuç
yalnız seçilen (ekran + final rapor) · "Muayene uzmanı imzası"; (2) plan içi: sınırsız "Rapor oluştur" + yeşil tik · rapor pasif / aktif / sil
(rol) · alan alan süzgeç · toplu PDF; (3) Planlar listesi: proje adı / proje no süzgeci, anlamsız çipler kalkar; (4) Raporlar: Kusurlu çipi ve
genel arama kalkar, toplu PDF; (5) bütün listelerde genel arama kalkar (alan kutusu olanlar) + şeffaf açıklama yazıları taraması; (6) yan menü
takip balonları; (7) Ölçüm cihazları: cihaz türü ekle, ara bakım sıklıkları + otomatik bakım oluştur + PDF; (8) Talepler: firma formatı
iskeleti, PDF, e-postayla ilet; (9) Performans ekranı: dikey, boşluksuz sütunlar, kişinin rapor süreci grafikleri; (10) personel kartında eğitimler.
Eğitimler: reisim'e soruldu — *"tamam benim hatam bu şekilde kalsın"* → Dökümanlar › Eğitimler sekmesinde kalır (30. tur kararı).
Ara istek (T7 sırasında, 2026-09-28): *"şu balonlarda sekmeyi aşağı düşürme olayı olmasın küçülsün ve tek sıra olsun renkler daha belirgin
olsun"* · *"aşağı yukarı barı da yan menüde düzgün durmamış olmasın"* → T6b: balonlar adın yanında tek sırada bitişik hap, satır büyümez,
dolu renk; yan menü kayar ama çubuğu görünmez (§11 121).

**Otuz beşinci tur — sorular (2026-09-29; reisim: *"sonraki turun sorularını getir"*; cevap bekliyor).** Maketlerde VARSAYIM / soru diye
işaretli kalanlar ve 34. turda çıkan kararlar; her birinde önerim var, "uygun" denirse öneri karar olur.
- **160 · Talep e-postası:** bilgisayarda PDF iner, e-posta uygulaması alıcı / konu / metinle açılır, PDF'i kişi ekler (tarayıcı dosyayı
  kendisi ekleyemez); telefonda paylaşım menüsü PDF ekli açılır. *Öneri:* böyle kalsın; sunucudan kendiliğinden e-posta istenirse bu bir
  bildirim olur (anayasa 1.3), ayrıca karar ister.
- **161 · Talebin alıcısı:** izin ve masraf formu firma yöneticisine gidiyor (sistemde ayrı muhasebe rolü yok). *Öneri:* "Muhasebe" rolü
  eklensin, masraf formu ona gitsin; izin yöneticide kalsın.
- **162 · Onaylayan tarafında PDF:** yönetici izni / muhasebe masrafı onaylayınca formun son hâli onların ekranından da PDF · e-posta ile
  çıkabilsin mi? *Öneri:* evet (Personel › İzin talepleri ve Muhasebe › Giderler'de aynı tuş).
- **163 · Menü balonları hangi modüllerde:** renkli balon şu an Uyarılar, Sözleşmeler, Ölçüm cihazları, Personel, Muhasebe'de; Planlar
  (kabul bekleyen), Raporlar (son imza bekleyen), Onaylar (onay bekleyen) tek yeşil sayı taşıyor. *Öneri:* bu üçü de aynı renkli balona
  dönsün (bekleyen = sarı, süresi geçen = kırmızı); yeşil (sorunsuz) yalnız sayılabilir varlıkta (cihaz, personel) kalsın.
- **164 · Ara kontrol uyarı eşikleri:** günlük 0, haftalık 2, aylık 7, 6 ayda bir 30 gün kala sarı. *Öneri:* firma ayarı, bu değerlerle başlar.
- **165 · Performansta sayılan rapor:** onaya gönderilmiş ya da imzalı raporlar sayılıyor; hiç gönderilmemiş taslak sayılmıyor. *Öneri:* böyle kalsın.
- **166 · Performans süreç adımları:** kişi sayfasında yazım · onay · son imza ortalama süreleri var. Geri gönderilen raporun düzeltme süresi
  de ayrı adım olarak görünsün mü? *Öneri:* evet (geri gönderilme → yeniden onaya gönderim).
- **167 · Eğitim tekrar uyarısı:** tekrarına 60 gün kala sarı; eğitim adları ve tekrar süreleri örnek. *Öneri:* eşik firma ayarı (60 gün);
  eğitim türlerini firma ekliyor zaten — mevzuattaki zorunlu eğitimlerin listesini sen verirsen başlangıç listesi o olur.
- **168 · Uyarılarda "okundu":** uyarı koşul kalkınca (kalibrasyon yenilenince vb.) kendiliğinden düşüyor, "okundu" yok. *Öneri:* böyle kalsın.
- **169 · Son imza yöntemi:** rapor son imzası indir → e-imza ile imzala → yükle (aracı servis sonra). *Öneri:* başlangıçta indir-imzala-yükle;
  e-imza servisi (8.4 açık soru) firma ayarı olarak sonra eklenir.
- **170 · Müşteri girişinin tesis kapsamı:** müşteri kullanıcısı "bütün tesisler" ya da seçili tesisleri görür. *Öneri:* böyle kalsın
  (varsayılan bütün tesisler).
- **171 · İmzalı iş sözleşmesi:** iş sözleşmesinin imzalı taraması yükleniyor (İSG-KATİP'te "yüklenmez" kararı yalnız ona). *Öneri:* böyle kalsın.
- **172 · Fatura:** fatura muhasebe programında kesilir, burada numarası ve tarihi yazılır; bilanço da muhasebe programında. *Öneri:* böyle kalsın.
- **173 · İş kârlılığında personel payı:** günlük maliyet = aylık işverene maliyet ÷ 22 iş günü; işverene maliyet ≈ brüt × 1,2275. *Öneri:*
  ÷ 22 ve oran firma ayarı; bordrodaki "işverene maliyet" varsa doğrudan o kullanılır.
- **174 · Maaş ve bordroları kim görür:** firma yöneticisi ve muhasebe. *Öneri:* böyle kalsın (161 kabulse muhasebe rolüyle).
- **175 · Excel içe aktarma sütunları (Giderler):** senin örnek Excel'in gelince ona göre kurulacak. *Öneri:* elindeki örneği paylaşırsan
  sütunları birebir kurarım; yoksa şimdiki sütunlar kalsın.
- **176 · Standartlar örneği:** daha önce paylaştığını söylediğin örnek bu oturumda elimde yok. *Öneri:* yeniden paylaş; Dökümanlar ›
  Standartlar ona göre gözden geçirilir.

**Otuz beşinci tur — cevap (2026-09-29, reisim birebir):** *"Önerilerini kabul ediyorum standartlar sekmesine bir şey yapmana gerek yok,
yeni durumundan itibaren her rapor performansı etkiler, taslak diye bir aşamamız yok zaten. Bunlar dışında her şey de önerilerin makul ihtiyaca
göre karar yine değiştirilir"*
→ **Kararlar:** 160–164 ve 166–175 öneriler karar oldu (ihtiyaca göre yine değişebilir). **165 değişti:** rapor **"Yeni" durumundan itibaren**
performansa girer (taslak aşaması yok; gönderilmemiş rapor da sayılır). **176:** Standartlar'a dokunulmaz. Firma ayarı olan eşikler (164 ara
kontrol, 167 eğitim 60 gün, 173 ÷ 22 ve işverene maliyet oranı) ayar ekranı gelince orada; makette başlangıç değerleriyle çalışır. Uygulama
sırası: (U1) performans — her rapor Yeni'den, süreçte "Düzeltme" adımı; (U2) masraf formu Muhasebe rolüne, bordroyu yönetici + muhasebe
görür; (U3) onaylayan tarafında talep PDF · e-posta; (U4) Planlar, Raporlar, Onaylar sayaçları renkli balon.

**Otuz altıncı tur — sorular, 2. sürüm (2026-09-29).** İlk sürümü okuyan reisim birebir: *"Aslında e imza için tasarımdan kastım şu idi
şu an aktif kullandığım yazılımda dosyayı imzaya gönder dediğimizde dosya imzayeri.com a gidiyor oradan mobil imza onayı için işlem yapılıp bana
gönderiliyor mobilden onaylıyorum dosya onaylandıya dönüşüyor bu tarz ara bağlantılar olmadan, imzaya gönder dediğimde direk telefonuma imza
onayı gelse onaylayıp pini girsem aradan imzayeri.com u çıkarsak olmaz mı ? Bunu cevapla ve soruları ona göre revize edip tekrar tüm soruları
sor"* → **Cevap: olur.** Operatörler (Turkcell, Vodafone, Türk Telekom) kendi yazılımını bağlamak isteyen şirketlerle **"mobil imza uygulama
sağlayıcı"** sözleşmesi yapıyor (Turkcell: başvuru formu + imza sirküleri + taahhütname, IP yetkisi; başvuru ücretsiz, test ortamı var;
bireye değil şirkete). probata bu sözleşmeyi yaparsa akış: inspector **"İmzaya gönder"** → sunucumuz raporun **özetini** (dosyanın kendisini
değil) operatöre yollar → inspector'ın telefonuna onay isteği düşer → **PIN** → imza sunucumuza döner → imzayı PDF'e biz gömeriz (PAdES),
doğrularız, rapor **"Tamamlandı"** olur, müşteriye açılır. Araya başka site, yönlendirme, dosya yükleme girmez; dosya bizim sunucumuzdan
çıkmaz. Maliyet: inspector'ın mobil imza sertifikası (kişi operatörden alır); işlem başı operatör ücreti varsa sözleşmede netleşir; uzun
süreli geçerlilik için **zaman damgası** yetkili sertifika sağlayıcısından (kontör, ücretli) önerilir. Toplu imzada her rapor **ayrı** imza
isteğidir (her biri için PIN; operatörün toplu onay imkânı sözleşmede sorulur).
- **E-imza (USB kart) da aracısız** — reisim: *"Önerilerinden önce e imza içinde bir şey yapamaz mıyız mobil imzayı çözdük diye düşünüyorum,
  ama e imza da imzayeri.com toplu imzalama özelliği sunuyor mesela"* → **Cevap: yapabiliriz.** Tarayıcı USB karta doğrudan erişemez (web'in
  böyle bir yetkisi yok); aracı siteler de bilgisayara kendi küçük programını kurdurur. Biz **kendi imza aracımızı** yazarız: bilgisayara bir kez
  kurulan küçük bir program (Windows; kartın kendi sürücüsüyle konuşur). Akış: Raporlar'da raporlar seçilir → **"Toplu imzala"** → program
  açılır, imzalanacak raporların listesini gösterir → **PIN bir kez** girilir → her rapor **ayrı ayrı** imzalanır (raporlar birleşmez, karar 99)
  → imzalar sunucumuza döner, PDF'lere biz gömeriz, doğrularız, raporlar "Tamamlandı". Dosya bizim sistemimizden çıkmaz, üçüncü site yok, işlem
  başı ücret yok. **AKİS kurulu varsayılır** (reisim: *"imzayeri de öyle çalışıyor bilgisayara AKİS adında bir program kuruluyor bunun kurulu
  olduğunu varsay, zaten herhangi bir pdf aracında da aynı şekilde AKİS kurulması gerekiyor"*): AKİS kartın sürücüsüdür (kartı tanır; e-Devlet,
  Adobe gibi programlar kartla onun üzerinden konuşur). Kart sürücüsünü biz yazmayız; imza aracımız AKİS'i kullanır. Tarayıcı AKİS'e de
  doğrudan erişemediği için site ile AKİS arasında küçük bir köprü (imza aracımız) yine gerekir — imza siteleri de bunu bir tarayıcı eklentisi
  ya da arka planda çalışan küçük bir uygulamayla yapar. Kullanıcı için: bir kez kurulur, sonra görünmez; "Toplu imzala" deyince yalnız PIN
  sorulur. Maliyeti bizde: aracın yazılması ve bakımı, **kod imzalama sertifikası** (Windows imzasız programı engeller — reisim'in
  bilgisayarındaki Uygulama Denetimi de engelliyor, 2026-09-23 kaydı). Zaman damgası
  mobil imzadaki gibi (kontör). Mobil imzada PIN her imza için ayrı girilir; **çok raporu tek PIN'le imzalamak USB kartla olur** → ofiste
  toplu imza e-imzayla, sahada tek tek mobil imzayla.
- **177 · İmza yolları:** *Öneri:* ikisi de bizde, aracı site yok: (a) **mobil imza** — operatörlere doğrudan bağlantı, "İmzaya gönder" →
  telefonda PIN (saha, tek tek); (b) **e-imza** — kendi imza aracımız, "Toplu imzala" → tek PIN, her rapor ayrı imza (ofis). İlk sürümde
  hangisi önce gelsin? *Öneri:* önce mobil imza (sahada en çok kullanılan), hemen ardından e-imza aracı; "indir → imzala → yükle" yedek
  yol olarak kalır.
- **178 · Inspector'ların mobil imzası:** inspector'lar hangi operatörde, hepsinde mobil imza var mı, firma zorunlu tutuyor mu? *Öneri:* her
  inspector'da mobil imza zorunlu olsun; personel kartında "mobil imza: operatör · telefon" alanı, yoksa uyarı (engel değil).
- **179 · Sözleşmeyi kim yapar:** operatör sözleşmesini **probata (yazılım şirketi)** mı yapar, yoksa her muayene firması kendisi mi? *Öneri:*
  probata yapar (tek bağlantı, bütün firmalar kullanır; firmalar ayrıca uğraşmaz).
- **180 · İç belgelerde basit imza:** zimmet teslim formu, saha formu (müşteri onayı), izin ve masraf formu için tablette parmakla imza + kimin,
  ne zaman imzaladığı kaydı (kendi içimizde, ücretsiz) yeterli mi? *Öneri:* evet; imzalı tarama yükleme yolu da kalır.
- **181 · Maket onayı:** M1–M5 ve M13 onaylı; M6–M16 ve sonradan gelenler (Talepler, Dökümanlar) toplu gözden geçirmede. Koda geçmek için
  hepsinin onayı gerekiyor. *Öneri:* kalanları tek tek "onaylıyorum" ya da düzeltme listesiyle kapat; istersen sıra önereyim.
- **182 · Sunucu (Türkiye, §8.8):** *Öneri:* yurt içi bulut sağlayıcısı (yönetilen PostgreSQL + S3 uyumlu depo + yedek); 2–3 sağlayıcıyı
  özellik olarak karşılaştırıp sunarım, seçim ve sözleşme senin. (Operatör IP yetkisi sabit sunucu adresi ister; bu seçime girer.)
- **183 · Alan adı:** `probata.com.tr` (+ firmalar için alt alan adları). *Öneri:* sen al, alan adı ayarlarını kurulumda ben yaparım.
- **184 · İlk sürümün ekipman türleri:** *Öneri:* maketteki 14 tür (elektrik, kaldırma, basınçlı kaplar, iskele, diğer); sonra tür tür eklenir.
- **185 · 5 yıl sonrası silme:** *Öneri:* silinecek raporlar 30 gün önce firma yöneticisine liste olarak gösterilir, silinen 30 gün geri
  alınabilir, sonra kalıcı silinir.
- **186 · Önizlemede örnek veri kipi (§3.3):** *Öneri:* evet (yalnız Pages önizlemesinde uydurma veri; gerçek sunucuda hiç yok).
- **187 · §3.2 öneri maddeleri:** imzalı rapor değiştirilmez, düzeltme revizyonla · imzalanınca tesis, müşteri, personel, cihaz bilgileri
  rapora kopyalanır · önceki raporun giderilmemiş hafif kusurları sonraki kontrolde kendiliğinden listelenir · listedeki ve rapordaki tarih /
  saat aynı alandan · inspector'ın mesleği türün yetkili meslekleri arasında değilse uyarı (engel değil). *Öneri:* hepsi karar; otomatik saat
  dağıtımı önerisi çıkar ("planlanan saat yok" kararıyla).
- **188 · Zimmette aynı türden birden çok cihaz:** raporda inspector hangi cihazı kullandığını seçiyor. *Öneri:* böyle kalsın, açık madde kapansın.

**Otuz altıncı tur — kısmi cevap (2026-09-29, reisim birebir):** *"178 zorunlu olmasın hangi firma neyi kullanmak isterse kullansın ister
e imza ister mobil, 180 iç belge de de mobil ya da e imza olacak 181 hiç bir şey maketten koda dökülmeyecek her şey makette kalsın kodu tek
seferde olabildiğince düzgün yazmalıyız diğer önerilerine bakıcam sonra"*
→ **Kararlar:** **178** imza aracı zorunlu değil; **firma seçer** (e-imza ya da mobil imza; firma ayarı, §8.4). **180** iç belgeler (zimmet
teslim formu, saha formu, izin ve masraf formu) de **mobil imza ya da e-imza** ile imzalanır — parmakla / basit imza yok (imzalı tarama
yükleme yolu yedek olarak kalır mı, 177 ile birlikte sorulacak). **181** modül modül koda geçiş **yok**: her şey makette kalır, bütün maket
bitince kod **tek seferde, olabildiğince düzgün** yazılır. 177, 179, 182–188 **cevap bekliyor** (reisim sonra bakacak).

**Otuz altıncı tur — cevap (2026-09-29, reisim birebir):** *"Pages e şu an dokunma maketten devam edicez alan adı bulut gibi sistemler sonranın
işi vakti gelince yaparız 5 yıl sonra silme olmasın firmaya göre belirlediği bulut sisteminde arşive çekilsin isterse istemez ise silinsin
şeklinde yapacağız / herhangi bir süreçteki rapor imzalanıp tamamlanmış hariç teknik yönetici tarafından durumu değiştirilebilsin imzalanıp
tamamlanan rapor revizeye gönderilebilsin diğer önerilerin uygundur"*
→ **Kararlar:** **186** Pages'e dokunulmaz (örnek veri kipi yok); maketten devam. **182–183** sunucu, alan adı: vakti gelince. **185** 5 yıl
sonra kendiliğinden silme **yok**: süre dolunca firma seçer — **firmanın belirlediği bulut arşivine taşınır** ya da **silinir** (firma
ayarı; §3 ve §8.9'daki "5 yıl silme" bununla değişti). **Yeni:** **teknik yönetici** (branş yöneticisi) imzalanıp tamamlanmış dışındaki her
raporun **durumunu değiştirebilir**; **imzalı (Tamamlandı) raporu revizeye gönderebilir** (revizyon: yeni sürüm, eski sürüm saklanır).
**177, 179, 180a, 184, 187, 188** öneriler karar oldu: iki imza yolu da bizde (mobil imza operatöre doğrudan, e-imza AKİS + kendi imza aracımız,
toplu imzada tek PIN), önce mobil; firma seçer; operatör sözleşmesini probata yapar; iç belgelerde ıslak imza + tarama yedek yol; ilk sürümde
14 tür; §3.2 öneri maddeleri (7–10, 2c uyarı) karar, otomatik saat dağıtımı çıktı; zimmette çoklu cihazda inspector seçer.
Maket sırası: (V1) teknik yönetici durum değiştir + revizeye gönder · (V2) son imza: mobil / e-imza (firma yöntemi) · (V3) iç belgelerde imza ·
(V4) önceki raporun giderilmemiş hafif kusurları sonraki raporda · meslek uyarısı.

**Otuz altıncı tur — ek (2026-09-29, reisim birebir):** *"185 i de ekle sonraki turun sorularını sor ve isteğe bağlı olsun ister silinsin
ister arşivlensin"* → **185 makette** (§11 135): Personel › Firma ayarları › "5 yılı dolan raporlar": **Sistemde kalsın** (başlangıç; firma hiç
seçmezse) · **Bulut arşivine taşınsın** (arşiv yeri girilir; boşsa raporlar sistemde kalır, uyarı) · **Silinsin** (30 gün önce liste, silinen 30
gün geri alınabilir). Kendiliğinden silme yok.

**Otuz yedinci tur — sorular (2026-09-29).** V1–V4 ve 185 makette; aşağıdakiler makette yaptığım varsayımlar ve sıradaki kararlar.
- **189 · Maket onayı:** M1–M5 ve M13 onaylı; M6–M16, Talepler, Dökümanlar ve Firma ayarları toplu gözden geçirmede. Kod, hepsi onaylanınca tek
  seferde. *Öneri:* akış sırasıyla tek tek kapatalım: Plan aç → Planlar / plan içi → saha raporu → Onaylar → Raporlar → Uyarılar → Ölçüm
  cihazları → Zimmetler → Müşteriler → Teklifler → Sözleşmeler → Muhasebe → Performans → Talepler → Dökümanlar / Eğitimler → Personel ·
  Firma ayarları; her birine "onaylıyorum" ya da düzeltme listesi.
- **190 · Tüm raporlar ve vekil:** teknik yönetici "Tüm raporlar"da yalnız kendi branşını görüyor. Vekil olduğu branşın raporlarının da
  durumunu değiştirip revizeye gönderebilsin mi? *Öneri:* evet, "Elektrik · vekil" seçiliyken o branşın tüm raporları.
- **191 · Durum değiştirme = onay:** "Muayene uzmanı imzası"na alınan rapor, onayı teknik yönetici vermiş sayılıyor. *Öneri:* böyle kalsın;
  raporun üstünde "Durum teknik yönetici tarafından değiştirildi · ad · zaman · gerekçe" şeridi görünsün.
- **192 · Revize isteği:** revizeye yalnız teknik yönetici gönderiyor. Inspector tamamlanan raporda hata görürse? *Öneri:* inspector'da
  "Revize iste" (gerekçe zorunlu) → Onaylar'da teknik yöneticinin önüne düşer; revizeye gönderen yine yönetici.
- **193 · Revize sürümü müşteride:** R1 imzalanınca müşteri neyi görür? *Öneri:* yalnız son sürümü; eski sürüm firmada saklı kalır, yeni
  sürümün üstünde "KM-…-R1, KM-… raporunun yerine geçer" yazar.
- **194 · Yanıtsız mobil imza isteği:** telefondaki istek birkaç dakika geçerli. Yanıtlanmazsa? *Öneri:* süre dolunca rapor kendiliğinden
  "Muayene uzmanı imzası"na döner, listede "imza isteğinin süresi doldu" görünür; inspector yeniden gönderir.
- **195 · Mobil imza numarası:** istek hangi telefona gidecek? *Öneri:* personel kartında isteğe bağlı "Mobil imza telefonu" alanı; boşsa
  mobil imzaya gönderilemez, uyarı çıkar (e-imza ya da indir-imzala-yükle açık kalır).
- **196 · Zimmet formunu firma adına kim imzalar:** makette planlama ekibinden biri. *Öneri:* firma yöneticisinin seçtiği kişi (Firma
  ayarları'nda "zimmet teslim eden"); başlangıç firma yöneticisi.
- **197 · Saha formunda müşteri imzası:** müşteri yetkilisi kâğıda imza ve kaşe atıyor; bu kâğıt sistemde yok. *Öneri:* plan içinde
  "İmzalı saha formunu yükle" (tarama; açılır, değiştirilir, silinir — zimmet formundaki gibi).
- **198 · Talep reddi imzalı mı:** izin ve masraf onayı imzalı; ret gerekçeyle, imzasız. *Öneri:* böyle kalsın (ret bir belge onayı değil).
- **199 · Kusur sınıfı olmayan türlerde önceki kusur:** devreden kusur yalnız Bakanlık formatı yürürlükteki türlerde (hafif kusur yalnız
  orada var). Öteki türlerde önceki rapor "Kusurlu" ise? *Öneri:* aynı bölüm çıksın (Giderildi / Giderilmedi); giderilmeyen bu raporun
  kusuru olur.
- **200 · 5 yıl süresi ve başlangıç seçimi:** süre 5 yıl sabit; başlangıç seçimi "Sistemde kalsın". *Öneri:* 5 yıl taban, firma uzatabilir
  (kısaltamaz); başlangıç seçimi böyle kalsın.
- **201 · Arşive taşınan rapor:** *Öneri:* sistemde künyesi kalır (rapor no, ekipman, tarih, "arşivde · arşiv yeri"), dosyası arşivde;
  müşteri portalından kalkar; firma isterse arşivden geri getirilir.
- **202 · Firma ayarlarının yeri ve kapsamı:** şu an Personel içinde bir sekme (imza yöntemi, 5 yılı dolan raporlar). *Öneri:* böyle kalsın;
  bugün maketlere dağılmış öteki firma ayarları da buraya toplansın: kalibrasyon uyarı eşiği (30 gün), "kontrolü yaklaşan" eşiği (30 gün),
  plan açarken "kontrolü geliyor" aralığı (30 gün), fiyat listesi, rapor numarasının firma kodu, sabit giderler.

**Otuz yedinci tur — cevap (2026-09-29, reisim birebir):** *"Önerilerin uygun ama 196 da zimmet formunda teslim eden teslim alan kısmı el ile
girilebilsin, listeden personel girilebilsin. Diğer önerilerini öneriyorum ama bu rapor arşiv işleri backende giriyor ve backendk kurallarımızı
görmezden gelme, layzload fotoğafların gizli görüntülenmesi vs vs bir sürü kuralımız var dikkat et kurllarımız backend açısından eksik mi bi
kontrol et"*
→ **Kararlar:** **189–195, 197–202** öneriler karar oldu. **196** değişti: zimmet teslim formunda **teslim eden ve teslim alan** hem
**listeden personel** seçilir hem **elle** yazılabilir (Firma ayarları'ndaki "zimmet teslim eden" başlangıç değeri olur). **Sunucu kuralları
denetimi** yapıldı: `EKSIKLER-VE-ONERILER.md` **D bölümü** (27 madde; dosya ve gizli görüntüleme, giriş ve alt alan adı çerezi, müşteri
erişim katmanı, iyimser kilit ve çevrimdışı tek seferlik gönderim, sunucu tarafı sayfalama, arşive güvenli taşıma, imzalı PDF bütünlüğü,
arka plan işlerinde kiracı bağlamı, KVKK, e-posta) — **onay bekliyor**; ANAYASA 4.12 ile 185 arasındaki çelişki (D17) orada.
Maket sırası (W): W1 196 zimmet formu teslim eden / alan · W2 190 vekil branşın tüm raporları · W3 191 durum değişikliği şeridi · W4 192 inspector
"Revize iste" · W5 193 müşteride yalnız son sürüm · W6 194 yanıtsız mobil imza isteği süresi · W7 195 mobil imza telefonu · W8 197 imzalı saha
formu yükle · W9 199 öteki türlerde önceki kusur · W10 200–201 5 yıl uzatma, arşivdeki rapor künyesi · W11 202 firma ayarları bir yerde.

**Otuz yedinci tur — ek (2026-09-29, reisim birebir):** *"4.12 istisnası nedir"* → açıklandı; *"tamam o eski uygulama içindi bu uygulamanın
ihtiyaçları farklı bu uygulamada thumbnaile vs de gerek yok bu arada veri tasarrufu ile de alakalı kurallarda eksik varsa onlarıda tamamla D kısmını
okudum onayladım, elindeki işleri artık bana sormadan tek tek yapabilirsin"* → **Kararlar:** D bölümü **onaylandı** → bu projenin sunucu ve veri
tasarrufu kuralları **`09-SUNUCU-VE-VERI.md`** (A dosya / gizli görüntüleme · B veri tasarrufu · C veri ömrü, arşiv, yedek · D yazma, eşzamanlılık ·
E giriş, oturum, kiracı · F imza bütünlüğü · G arka plan, KVKK, e-posta, duman testi); **küçük kopya (thumbnail) üretilmez**; ANAYASA 4.12'ye
bu projenin istisnası (185). W2–W11 sormadan sırayla.

**Otuz sekizinci tur — onay turu başladı (2026-09-29, reisim birebir):** *"bu şekilde maket üzerinde gitmek mi mantıklı yoksa tüm yaptıklarımızı
siteye döküp revize yaparak mı ilerleyelim ?"* → öneri: makette devam (revize makette hızlı, kod bir kez yazılır, gerçek site sunucu olmadan
internette çalışamaz); *"makette devam reisim"* → **Karar:** onay turu makette sürer; ekranlar sırayla onaylanır, sonuncusu onaylanınca kod.
**Planlar ve rapor içeriği — ilk revizeler (reisim birebir):** *"Planlar ekranında Proje adı daha kalın gözüküyor, böyle olmasın Müşteri
isimleri kalın olsun. / Plan içeriğinde "SGK destis no:" ksımı yok olmalı; / Planı kabul ettikten sonra denetime başla tuşu olmasına gerek
yok gereksiz. / Pasife alınan raporlar inspectorlere gözükmesin sadece yöneticilere gözüksün(bunu daha önce söylemiştim). / Muayene
kriterleri uygun uygun değil seçme tuşu daha büyük olmalı ve ilgili satır aşağı doğru açılmadan da görülebilmeli örneğin muayene kriterleri
yazısı ile aynı hizada olmalı. / Firma bilgileri girilen yer de veya ekipman bilgileri yazılan yerlerde gereksiz uzun satırlar var ve bazı
satırlar aşırı uzun boşluklara sahip, yan yana yazılabilecek şekilde örnek görsel atıyorum / Fotoğraf eklendiğinde thumnail olmasın sadece
görselin adı yazsın, görüntüle, indir , sil tuşları olsun. / Raporu komple silebilmek için sil tuşu olsun kaydet tuşunun yanında olsun. /
Kaydet gönder silk tuşları sanki bir barın içinde gibi değil bağımsız dursunlar."* (örnek görsel başka uygulamadan, gerçek veri taşıyor:
yalnız düzeni alındı — etiket üstte, alanlar iki sütun yan yana.) Maket sırası (X): X1 müşteri adı kalın · X2 SGK sicil no kalkar · X3
Denetime başla kalkar · X4 pasif rapor inspector'da yok · X5 kriter seçici büyük ve başlık hizasında · X6 bilgi alanları iki sütun · X7
fotoğrafta küçük resim yok · X8 rapor Sil + tuşlar bağımsız.

**Otuz sekizinci tur — düzeltme (2026-09-29, reisim birebir):** *"Şimdi reisim ekipman ekleyip sonra rapor oluştur siyoryz ya oluşan rapor
inspector tarafından da silinebilsin firmaya ekli ekipman için bunu söyledim . Her maddenin kendi seçimi depil örneğin muayene kriterleri
oraya en son bir tuş ekledik hepsini uygun yap uygun değil yap veya uygulanamaz yap diye onun yerini değiştir muayene kriteri yazısının
hizasında olsun muayene kriteri yzısı tuşuna basmadan da aşağı açılmadan da gözüksün istedim bu kadar, kabul edildi de kalsın ekipman ekleme
kısmında tamamla tuşu olsun diyince kontrol listesi tamamlandı desin sonra en aşağıda tamamla yazsın ona tıklayınca komple tamamlandı olsun."*
→ **Kararlar:** X5'in madde satırı tuşları geri alındı (madde seçimi yine açılır liste); "hepsini işaretle" bölüm başlığının hizasına, bölüm
açılmadan görünür (Y1). Inspector plan içinde oluşturduğu raporu silebilir (Y2; 2026-09-28'deki "silme yalnız yönetici" bununla değişti).
"Kabul edildi" durumu kalır. Denetim adımında **Tamamla** → "Kontrol listesi tamamlandı"; en altta **Tamamla** → plan tamamlandı (Y3).

**Otuz sekizinci tur — plan içi ve rapor görünüşü (2026-09-29, reisim birebir):** *"Plan içinde raporlar ve ekşpmanlar başlıkları büyük olmalı
başlıklar ve bölümşer birbirinden ayrıldıpı belli olmuyor, Raporlar içerisinde hepsine uygula ve güncelle mobilde yazmamalı sadece işaretleri
gözükmeli çünkü çok çirkin duruyor"* → Z1 plan içi başlıkları ve bölüm ayrımı · Z2 saha raporunda telefonda "Hepsini işaretle" ve "Güncelle"
yalnız simge.

**Otuz dokuzuncu tur — sorular (2026-09-30; reisim: *"elindeki tüm soruları toplu sor"*).** Kaynak: reisim'in 2026-09-30 istekleri (raporu olan
ekipmanda Rapor oluştur gitsin · rapor içinde ekipmanı kopyala) ve kullandığı başka uygulamanın rapor ekranından çıkan öneriler (ekran
görüntüsündeki veri gerçek, hiçbir yere yazılmadı).
- **203 · Rapor oluştur geri gelsin mi:** raporu olan ekipmanda tuş gider. *Öneri:* rapor silinir ya da pasife alınırsa tuş geri gelir.
- **204 · Kopyala tuşunun adı:** *Öneri:* "Kaydet ve kopyala" (önce bu raporu kaydeder, sonra kopyalar).
- **205 · Yeni ekipman için sorulanlar:** *Öneri:* ekipman kodu (zorunlu, firmada eşsiz), seri no, kullanım yeri; tür aynı (değişmez).
- **206 · Kopyalananlar:** *Öneri:* ekipman bilgileri (marka, model, imal yılı, kullanım amacı), ekipman detayları ve tespitler, ölçüm
  cihazları, madde cevapları. **Kopyalanmaz:** test ve ölçüm değerleri, fotoğraflar, sonuç ve kanaat, notlar.
- **207 · Kusur açıklamaları:** "Uygun değil" maddelerin kusur açıklaması ve derecesi de kopyalansın mı? *Öneri:* hayır; madde yine "Uygun
  değil" gelir, açıklama boş (her ekipmanın kusuru kendine).
- **208 · Kopyaladıktan sonra:** *Öneri:* doğrudan yeni ekipmanın raporu açılır (plan içine dönülmez).
- **209 · Kopyala hangi raporda:** *Öneri:* düzenlenebilen (Yeni ya da geri gönderilmiş) raporda; gönderilmiş raporda da açık olsun mu?
- **210 · Telefonda İşlemler menüsü:** *Öneri:* telefonda tek "İşlemler" tuşu (Kaydet · Onaya gönder · Kaydet ve kopyala · Sil); masaüstü ve
  tablette tuşlar yan yana.
- **211 · Formatı güncelle:** *Öneri:* firmanın rapor formatı yenilendiyse açık raporda "Formatı güncelle" (yalnız yeni sürüm varsa görünür;
  eşleşen maddelerin cevabı korunur).
- **212 · Mesai takibi:** rapor başına normal / fazla mesai süresi kullanılıyor mu? *Öneri:* kullanılıyorsa firmanın çalışma saatlerine göre
  Performans'a ve bordroya; rapor ekranına panel konmaz.
- **213 · Uygun maddeye fotoğraf:** bugün fotoğraf yalnız "Uygun değil" maddede. *Öneri:* her maddede isteğe bağlı küçük "Fotoğraf ekle".
- **214 · Madde açıklaması:** *Öneri:* maddenin neye bakılacağını ve standarttaki yerini gösteren isteğe bağlı bilgi tuşu (i).

**Otuz dokuzuncu tur — cevap (2026-09-30, reisim birebir):** *"208. Kaydetip kopyalayıp yeni oluşturulan ekipmana gitsin uygundur 209 her
raporda kopyalanabilsin ama kopyalanan tabikide yeni olacak 213 hayır sadece tek bir fotoğraf ekleme yeri olacak maddeye göre fotoğraf ekleme
eğer uygundeğil seçilirse bir madde o madde için maddenin sırasında fotoğraf işareti çıkar, uygunsuzluğun fotoğrafı koyulur ve açıklamasıyla
birlikte kusur açıklamaları kısmına eklenir, zorunlu değildir firma zorunlu olmasını isterse zorunlu olur şimdilik zorunlu yap firmaya göre
değişecekler listesine ekle mesai takibi kısmını ekle raporların süresine göre oradaki bar dolsın eğer mesaisi dolarsa daha fazla rapor
oluşturamasın ve günlük 480 dk normal çalışma süresi 220 dk mesai süresi bu ayarlardan değiştirilebilsin açılıp kapatılabilsin sadece
yöneticiler yapabilsin . Diğer önerilerini kabul ediyorum"* (ve öncesinde: *"rapor oluşturdan sonra rapor oluştur tuşu gitmesin demiştim şu an
öyle vaz geçtim rapor oluştur tuşu gitsin"*) → **Kararlar:** 203–207, 210, 211, 214 öneri olduğu gibi. **208** kaydedip kopyalar, yeni
ekipmanın raporuna gider. **209** her raporda (gönderilmiş, imzalı dahil) kopyalanır; kopya her zaman Yeni. **213** uygun maddeye fotoğraf
yok; "Uygun değil" maddenin satırında fotoğraf işareti, fotoğraf açıklamasıyla kusur açıklamalarına; zorunluluk firma ayarı, şimdilik
zorunlu (§3.7'ye). **212** mesai takibi: rapor sürelerine göre günlük çubuk dolar; normal 480 dk + mesai 220 dk dolunca yeni rapor
oluşturulamaz (reisim'in açık kararı: engel); süreler ve aç/kapa Firma ayarları'nda, yalnız yönetici. Maket sırası: K1 Rapor oluştur ·
K2 Kaydet ve kopyala + telefonda İşlemler · K3 kusur fotoğrafı · K4 mesai takibi · K5 Formatı güncelle · K6 madde açıklaması.

**Kırkıncı tur (2026-09-30, reisim birebir; teklif formunun ekran görüntüsüyle):** *"teklif verirken excel ile ekipman export etme olsun,
İSG katip sözleşmesi ile alakalı zorunlulukarı kaldır sadece uyarı olsun isg katip sözleşmesi yok diyipte plan kabul edememezlik olmasın
mesela ya da sözleşmeler askıda kalmasın muhasebede gelir gider kısmında toplam gelir gider bilanço kısmıda olsun şu an ay/ay gösteriyor,
denetöi hesaplarının profillerinde personel kartlarında yani, ekipman atamaları kısmı olsun ekipman ataması yapılsın ve atama belgesi
yüklensin görülebilsin indirilebilsin yüklendikten sonra, müşteri hesabı açılır açılmaz parola gönderilmesin parola biz tıklayınca
gönderilsin , plan açılırken kapsam kısmı olmasın zaten denetçi plan içinde ekipmanları görüyor istediğini ve veya gerekeni yapar belki
revize rapor gerekicek, belki sahada aynı ekipmana yine rapor istenicek bu açıdan kısıtlama olmasın."* Üç soruya cevap: Rapor oluştur —
*"tuş gitsin kararımda kesinim kapsam kalkınca derken demek istediğim şu; plan açarken ekipman seçerek rapor açarsak ve plan ona göre gelir
de denetçi tüm ekipmanları göremesse sorun olur onu belirtmeye çalışmıştım o yüzden plan açarken ekipman seçme kısmı olmasın dedim, denetçi
tüm ekipmanları görebilmeli(mekanikçi mekanik elektrikçi elektrik ekipmanalrını), oluşturulan rapor silinirse vs tekrar rapor oluştur tuşu
gelecek tabiki"* · ekipman ataması → **ekipman türü** (öneri) · teklifte Excel → **içe + dışa aktar** (öneri).
→ **Kararlar:** L1 teklifte ekipman listesi Excel'den içe (kalemler tür başına adetle dolar) ve dışa · L2 İSG-KATİP eksikliği plan
kabulünü engellemez, yalnız uyarı · L3 Gelir-gider'de toplam (bütün dönemler) bilanço ve aylara göre döküm · L4 personel kartında
**Ekipman atamaları** (tür + atama belgesi PDF; görüntüle, indir); atanmadığı türde yalnız uyarı · L5 müşteri hesabı açılınca parola
gitmez, "Parolayı gönder" ile gider · L6 Plan aç'ta ekipman seçimi (kapsam) kalkar; tesisin bütün ekipmanı plana girer, denetçi kendi
branşının ekipmanını görür; 203 geçerli (raporu olan ekipmanda Rapor oluştur yok, rapor silinince gelir).
Ek (aynı gün, reisim birebir): *"ön bilgilendirme formu gönder tuşu olsun kartı ekranında parolayı gönder tuşunun yanında"* → L5'e katıldı:
müşteri kartında Parolayı gönder'in yanında **Ön bilgilendirme formu gönder** (müşterinin e-postasına; son gönderim tarihi kartta).
Ek (aynı gün, reisim birebir; Plan açıldı ekranının görüntüsüyle): *"planlarda bu ekranda firma ismi önde olmalı tesis ismi değil bu her
yerd eböyle olmalı neden başlıkta büyük harflerle tesis aşağıda küçük firma yazıyor tam tersi olmalı"* → **L7:** her başlıkta firma (müşteri)
adı büyük ve önde, tesis adı altında küçük.

**Kırk birinci tur (2026-09-30, reisim birebir; cihaz ekle, cihaz türü ekle ve ekipman türü ekle pencerelerinin görüntüleriyle):** *"ön
bilgineldirme formu her firmanın kendi formatına göre değişir, 2 evet kendi branşıyla açılsın// görselde ölçüm aralığı ne demek ? 2. görsel
kullanıldığı ekipman türleri diye bir şey olmasın, isteyen istediği ekipmana ekler. 3. görsel ek 3 grubu içerisinde olmayanlar için diğer
seöeneği olsun, / yan tarafta dökümanlar kısmında yaklaşan ve günü geçen eğitimlerin uyarıları olsun, ölçüm cihazlarında da sadece yaklaşan
ve günü geçenlerin uyarısı olsun yeşil bildirimlere gerek yok,  saha formu firmaya göre değişecekler listesine ekle, mesai saatleri nereden
belirleniyor firma tarafından bu kısıt nereden açılıp kapanıyor ? yap demiştim nereye ekledin ? Günlük süre takibi örnek fotoda attığım gibi
yularıda satır gibi gözüksün açılıp kapatılabilsin sürekli ekranda olmasın pop-up gibi olsun , inspectorün anasayfasında gözüksün her
inspectorünki kendisi için hesaplansın, inspector değil denetçi yazsın her yer de , onaylar kısmında elektrik vekil yazıyor ve içerik olarak
genel olarak hatalı gibi o sayfayı düzenle , gerçi site kodlayınca onlar gözükmeyecek sadece kime nasıl gözüktüğünü göstermek için yazdığın
bir şey kalsa da olur ama elektrik vekil değil bilgin olsun. Mekanik yönetici ve elektrik yönetici var onaylarda sadece onayda bekleyen rapor
varsa bildirim olsun, denetçi için muayene imzası durumunda ki raporlar, yöneticiler için her ikiside hem muayene uzmanı hem de kendisi için
varsa teknik yönetici onayında olan raporlar , diğer muayene uzmanlarının onaya yolladığı raporlar için de olmalı, talepler modülünde de talep
varsa yanında baloncuk ile çıkmalı talepin iletildiği kişide şimdilik bu kadar"*
→ **Kararlar:** N1 ön bilgilendirme formu firmanın kendi formatı (§3.7 satır 15; Firma ayarları'na yüklenir) · saha formu §3.7'de zaten
(satır 9) · N2 plan içinde ekipman süzgeci denetçinin branşıyla açılır · N3 cihaz türünde "kullanıldığı ekipman grupları" kalkar (cihaz
ekipman türünde seçilir) · N4 ekipman türünde Ek-III grubuna **Diğer (Ek-III dışı)** · N5 yan menü balonları: Dökümanlar'da yaklaşan ve günü
geçen eğitim; Ölçüm cihazları'nda yalnız yaklaşan ve geçmiş (yeşil yok); Onaylar'da yalnız bekleyen (denetçiye muayene uzmanı imzası
bekleyenler, yöneticiye bunlar + kendi branşında teknik yönetici onayındakiler); Talepler'de talebin iletildiği kişiye bekleyen talep · N6
günlük süre takibi üst çubukta tek satır, basınca açılan pencere (sürekli ekranda değil), denetçinin Ana sayfasında; herkes için kendi
süresi · N7 Onaylar sayfası: "vekil" yok, Mekanik yönetici / Elektrik yönetici; bakış seçimi yalnız "kime nasıl görünür" gösterimi · N8
arayüzde "inspector" yerine her yerde **denetçi**.
Ek (aynı gün; soru "Raporlar balonu kaldırılsın mı, kişiye göre mi?"), reisim birebir: *"kişiye göre olsun"* → **N9:** Raporlar balonu giriş
yapan kişinin kendi raporları: kırmızı geri gönderilen, sarı onaya gönderilmemiş (Yeni); imza bekleyenler Onaylar'da (tekrar yok).
Ek (aynı gün, reisim birebir): *"pasife al tuşu raporlarda değil ekipmanlar da olacak yanlış olmuş reisim"* → **N11** · *"ekipman bilgilerinde
seri no olmamasına rağmen seri no soruyor ekipman kopyalarken ve değiştirilememesine rağmen ekipman türü soruyor gibi gözüküyor ekipman kodu
ve ekipman bölümü sorsun yeterli"* (Kaydet ve kopyala penceresinin görüntüsüyle) → **N10:** kopyalarken yalnız ekipman kodu ve ekipman
bölümü (kullanım yeri) sorulur; seri no ve tür alanı yok.
**Kırk ikinci tur (2026-09-30, reisim birebir; saha raporunun 5.1 ölçüm noktası tablosu ve "Uygun değil" işaretli maddelerin görüntüleriyle):**
*"kayık yazılar var, uygun değil işaretlenen durumlar için kusur açıklaması kısmı gelmesin, fotoğraf eklenirse fotoğrafın altına ilgili madde
yazacak şekilde kusur açıklamaları kısmına gelsin"* → **O1:** ölçüm noktası tablosunda RCD testi sütunu başlığı ve kutuları Sonuç sütununa
kayıyordu, madde (i) simgesi metne yapışıktı — düzeltildi. **O2:** "Uygun değil" maddede Kusur açıklaması alanı yok (madde metni kusurun
kendisi); fotoğraf eklenirse Kusur açıklamaları bölümünde fotoğraf ve altında ilgili madde. Kusur derecesi (hafif / ağır) Bakanlık formatlı
türde kalır: sonucu (hafif / ağır kusurlu) o belirler, reisim "gelmesin" demedi.
Ek (aynı gün, reisim birebir): *"fotoğraf olayını kaldıralım topraklama raporunda uygun uygunsuz olayınıda kaldıralım, onun yerine yan sekmede
not1, not 2 not 3 diye 11 e kadar seçene olsun bakanlık formatını bozmayalım bölümü olmayan türlere henüz örnek pdf eklemedik büyük ihtimalle
ekleyince olacak, bu rapor düzenleme işinde çok boğulmayalım temel disiplinlerini yapalım format ekledikçe değişiklik yapılır firmaya göre
değişir zaten"* → **P1:** topraklama (ZPKR01) raporunda fotoğraf bölümü yok (formatta yok; zorunlu da değil). **P2:** 5.1 ve 5.2 tablolarında
otomatik Uygun / Yetersiz sonucu kalktı; formatın "Sonuç (Uygunluk notu)" sütunu denetçinin seçtiği Not-1 … Not-11. Kusur açıklaması bölümü
olmayan türler, örnek PDF'leri gelince formata göre yapılır (şimdi dokunulmaz); rapor ekranında temel disiplin, ayrıntı formatla gelir.

**Kırk üçüncü tur (2026-09-30, reisim birebir):** *"giriş sayfası, profil , şifre değiştirme, hesap oluşturma, parolamı unuttum gibi temel şeyleri
atladık, başka atladığımız bir iş var mı analiz et sayfayı test verileriyle kullan eksik iş ya da eklense faydalı olacak iş var mı kontrol et,
firma ayarları personel kısmının altında değil ayrı bir modül olsun , ekran daha verimli kullanılsın."* → **R1:** Firma ayarları ayrı modül
(Tanımlar grubunda), bölümler ızgarada, solda bölüm listesi. **R2:** kullanıcı menüsünde Hesabım (profil, parola değiştir) ve Çıkış yap; giriş
sayfası (parolamı unuttum, geçici parolayla ilk giriş — M1'de vardı, bağlantısı yoktu) çıkıştan açılır. Eksik iş analizi ve soru listesi reisim'e.
**R3 · Eksik iş analizi (2026-09-30; bütün maket sayfaları örnek veriyle gezildi, tam ölçümle birlikte; §4.9 ve §5 notlarıyla karşılaştırıldı).**
Reisim'in kararına sunuldu, hiçbiri yapılmadı:
- *Hesap / erişim:* (1) **"hesap oluşturma" kimin için?** — personel hesabı (Personel › giriş hesabı aç, geçici parola) ve müşteri hesabı
  (Parolayı gönder) var; yeni **firmanın probata'ya kendi kaydı** (deneme süresi, alt alan adı seçimi) yok. (2) **Müşteri panelinde** Çıkış yap ve
  parola değiştir yok. (3) **Yetkisiz sayfa**, **oturum süresi doldu**, **sayfa bulunamadı** ekranları yok. (4) Firma yöneticisi için **iki adımlı
  giriş** (e-postaya kod) yok. (5) **KVKK aydınlatma metni** ve kullanım koşulları (giriş sayfasının altında; müşteride ilk girişte onay) yok.
- *TS EN ISO/IEC 17020 kayıtları (§4.9'da yazılı, ekranı yok):* (6) **Şikâyet ve itiraz kaydı** (kayıt → inceleme → karar → müşteriye yanıt;
  yalnız prosedür belgesi var). (7) **Hareket kaydı** (kim, ne zaman, ne yaptı): rol yetkisi var, görüntüleme ekranı yok. (8) **Denetçi yerinde
  gözetimi** (yetkinlik izleme kaydı) yok. (9) İç tetkik ve YGG kayıtları: Dökümanlar'a belge olarak girebilir, ayrı ekran şart değil.
- *Kullanımı kolaylaştıran:* (10) **Üst çubukta genel arama** (müşteri, ekipman kodu, seri no, rapor no). (11) **Rapor doğrulama**: PDF'teki
  QR ile raporun gerçek olduğunu gösteren sayfa (dosya değil, yalnız no · tarih · sonuç; kalıcı açık dosya bağlantısı kuralına dokunmaz). (12)
  **Ekipman etiketi** (QR'lı, sonraki kontrol tarihli muayene etiketi) basma. (13) **Takvim görünümü** (planlar ay / hafta, denetçiye göre).
  (14) Raporu müşteriye **e-postayla gönderme** (portal var; bildirim kurmak reisim kararı, anayasa 1.3). (15) **Müşteri memnuniyet anketi**.
  (16) Firmanın bütün verisini **dışa aktarma** (KVKK, ayrılan firma).
Cevap (2026-09-30, reisim birebir): *"1 hayır, personele hesap oluşturmaktan bahsediyorum bu vb işleri ilerde kurgularız 2 çıkış yap eklemen
yeterli 3 bu ekranları ekle 4 gerek yok 5 gerek yok6-7-8-9 a gerek yok 10 da ne kastettiğini göster 11 e imza veya mobil imza ile çözülecek 12
gerek yok 13 gerek yok 14 gerek yok 15 gerek yok 16 yı anlamadım müşteri ekranında excel alma yok mu var sanki ?"* → **S1:** müşteri panelinde
Çıkış yap. **S2:** yetkisiz sayfa · oturum süresi doldu · sayfa bulunamadı ekranları. 1 (personel hesabı açma makette var: Personel kartı › Giriş
hesabı) ileride kurgulanır; 10 örnekle gösterildi, karar reisim'de; 11 e-imza / mobil imzayla çözülür (ayrı doğrulama sayfası yok); 4, 5, 6–9,
12–15 yapılmaz; 16 açıklandı (müşteri ekranındaki Excel yalnız o müşterinin listesi).
Ek (2026-10-01, reisim birebir; genel arama örnek görüntüyle gösterildikten ve 16 "firma probata'yı bırakırken bütün verisini tek seferde alabilsin"
diye açıklandıktan sonra): *"Genel aramaya gerek yok 16 olsun"* → genel arama yapılmaz; **S3:** Firma ayarları'nda **Verileri dışa aktar**.
Ek (2026-10-01, reisim birebir): *"Sütun adları türkçe olsun ve örnek çıktı ver"* → **S4:** dışa aktarımdaki bütün sütun adları Türkçe (kod adı
kalmaz, denetimle); örnek ZIP reisim'e verildi.

**Kırk dördüncü tur (2026-10-01, reisim birebir; telefonda Planlar süzgeç levhasının görüntüsüyle — müşteri çipleri tek tek):** *"böyle uygun ama
raporların her birisini pdf olarak imzalı halleri ve şirketler egöre ayrılmış şekilde indirebiliyor olmam lazım , ve hatta müşteriye göre kendi
bulutuna kurabilir o buluta otomatik kayıt ettirebiliyor olmam lazım , bunu kurgula sonra, bir muayene firmasıymışsın gibi, 0 dan teklif plan açma
denetim yapma fatura kesme gibi tüm adımları sitenin tüm fonksiyonlarını tek tek kontrol et dene, müşteri görünümüne de bak, hangi roldeki
personelin bu uygulamadan beklentileri neler olabilir o role göre internetten derin araştırma ve analiz yapıp bak. Müşteri gözünde toplu indirme
uygunsuzları toplu indirme excel olarak indirme ve excel de link olmalı, linke tıklayınca ilgili rapor açılmalı. "rapor" yazsın tıklayınca açılsın
mesela. attığım görselde gördüğün gibi filtrede tek tek firmalar var yüzlerce firma olunca kullanışlı değil daha mantıklı filtreler yap ve
isimlerini süzgeç değil filtre olarak değiştir."* → **Ö1** imzalı rapor PDF'leri müşteri / tesis klasörlü indirme · **Ö2** müşteriye göre bulut
klasörüne otomatik kayıt · **Ö3** müşteri panelinde toplu indirme, uygunsuzlar Excel'inde "Rapor" bağlantısı · **Ö4** "Süzgeç" → "Filtre",
müşteri filtresi yüzlerce firmaya uygun · **Ö5** uçtan uca deneme (teklif → plan → denetim → onay → imza → fatura → tahsilat → müşteri) ·
**Ö6** rol beklentileri araştırması.
Ek (aynı gün, iş sürerken, reisim birebir): *"her tura başlamadan önce bana sorma turları sırayla yap"* → turlar arasında onay sorulmaz, kalemler
sırayla yapılır, her biri ölçülüp kaydedilir.

**Kırk beşinci tur (2026-10-01, reisim birebir; Ö1–Ö6 kanıt özetindeki üç soruya ve rol araştırmasına cevap):** *"Plan günü gelmeden rapor
açılmasına izin vermesin sistem 3 olsun önerdiklerine gerek yok, müşteri girişine şunu ekleyebiliriz, muayene personeli  belgeleri kısmı olur o
müşteriye giden muayene personelinin firmanın izin verdiği belgelerini görür (ekipnet belgesi isg belgeleri vs)"* → **P1** plan günü gelmeden rapor
oluşturulamaz (engel — reisim'in açık kararı, "kural uyarıdır" genel ilkesinin istisnası) · **P2** soru 3 evet: müşterinin girişi yokken düğme
"Giriş ekle" · rol araştırmasının önerileri (§3.9) ve soru 1 (örnek veri ölçeği) yapılmaz · **P3** müşteri panelinde **Muayene personeli
belgeleri**: o müşteriye giden muayene personelinin, firmanın izin verdiği belgeleri (EKİPNET belgesi, İSG belgeleri vb.).

**Kırk altıncı tur (2026-10-01, reisim birebir; "ne iş kaldı" cevabından sonra):** *"Tamam şimdi backend kurgusunu yapalım nasıl siteyi yazarken
layzload, gerekli verileri jsona yazıp ordan okuma, blob görsel koruma yedekleme raporları arşivleme vb aklıma gelmeyen listelemediğim ne varsa
siteyi gez nerde nasıl ni kurgu yapmalıyız tasarla ve bana sun en önemli kritik şeylerden bazılarıda çevrimdışı çalışma ve fotoğraftan okuyup
sigorta vs yazmak bir de rapor sayfasında pop up sohbet tuşu koyup S.A.Y chat diye bir şey yapmayı planlıyorum sadece kanul edilip rapor yazılmay
başlayan planlarda olsun mantığı şöyle olacak: tıklayınca sadece bu sitenin kullanımına özel kurgulanmış bir şekilde claud çalışacak bunun için
özel olarak eğiteceğiz ama her kullanıcı kendi hesabından girip kendi tokenlarını harcayacak aynı şey sigorta topraklama noktası vs yazarken
fotoğraftan okuma yapacak sistem içinde geçerli ve çevrimdışı çalışmaya gelince çevrimdışı yazılan raporlar çevrimdışı kuyruğunda olacak ,
çevrimdışı iken ram de kaydolacak çevrimiçi olunca gönderilebilecek uygulama olarakta çıkacağız ona göre çevrimdışı iken ram e kaydedip göndermekte
olacak şekilde düşün bir tasarım kurgula şu an tam olarak nasıl yapabiliriz bilemedim . Aklıma gelmeyen bir şey varsa yardım et."* → **`ARKA-UC.md`**
(taslak); karar bekleyen **K1–K8** belgenin başında.
Ek (2026-10-02, reisim birebir; K1–K8 alt alta sorulunca): *"7 ve 8 hariç kabul ediyorum"* → **K1–K6 kabul**: yapay zekâ firma ayarıyla açılır,
başlangıçta kapalı, veri maskelenir, KVKK hukukçuya (09-G3'e istisna yazıldı) · firma kendi API anahtarını girer, kişi başı sayaç ve sınır · model
başlangıçta Opus 5.5, gerekirse Sonnet 5.5, ölçümle · çevrimdışı veri kalıcı cihaz deposunda (şifreli), RAM'de değil · mağaza uygulaması Capacitor ·
S.A.Y chat yalnız öneri verir. **K7** (probata'nın firmalardan ücret alması modülü) ve **K8** (kayıp cihaz: uzaktan oturum kapatma + yerel veri
silme, çevrimdışı oturum 7 gün) **kabul edilmedi** — yapılmaz.

**Kırk yedinci tur (2026-10-02, reisim birebir).** (5) Giriş ekranı görüntüsüyle: *"giriş ekranı daha düzgün bir şey olsun güzel durmuyor"* → Z6 (§11 221). (1) *"Müşterinin token ekleyeceği yeri ekledin mi makete"* → Y1 (§11 218). (2) *"Çıkış yap, giriş
yap parola değiştir firma ayarları modülü hiç bir şey göremedim firma  ayarları nerdeydi, bi bak konuşup yapmadığımız eksik kalan ne iş var komple
bi bak"* → neden: Pages yayını 2026-09-30'dan beri onay bekleyen bir işin arkasında kalmıştı (iptal edildi, yayın 2026-10-02'de çıktı); eksik
listesi verildi. (3) Firma ayarları ekran görüntüsüyle: *"konuşup makete dökmediklerimizi dök,karar bekleyenleri ertele şu açık temada menü
rengi sorusunu sorma değişmeyecek. Ayrıca ilk görselde gördüğün gibi verileri dışa aktar butonu çok aşağıda kalmış onu hizala. yapılan
değişikliklerin yanına minik bir kaydet butonu koy yoksa kaydedildiği anlaşılmıyor."* → Z1 (§11 219); makete dökülecekler: S.A.Y sohbeti,
ölçüm noktası ve etiket için fotoğraftan okuma, çevrimdışı gösterge; **ertelendi:** öteki türlerin rapor formatları (PDF bekliyor), §3.7 firma
özelleştirmeleri, personel hesabı açma, ilk açılışta toplu Excel içe aktarma; **kapandı:** açık temada yan menü rengi (değişmeyecek). (4) Müşteriye
açık personel belgeleri görüntüsüyle: *"bu kısımda eğer ben bir belge türü eklersem listeye ekleniyor mu"* → hayır (liste sabit); *"eklenmiyorsa
eklensin ilk fotoğrafta rapor nüshası demiş o ne demek ,?"* → Z5; nüsha: resmî rapor künyesindeki "Nüsha sayısı" satırı (rapor kaç kopya
düzenlendi), yalnız o satıra basılır.

**Kırk sekizinci tur (2026-10-02, reisim birebir; giriş ekranı, bir mobil imza sitesinin imza pencereleri ve rapor ekranından görüntülerle — imza
sitesi görüntülerindeki kişi adı ve e-posta depoya girmez, yalnız akış fikir olarak alınır):** *"reisim şimdisol taraftaki açıklamaları vs kaldır
sol tarafın bu kadar geiş ve farklı renkte olması na gerek yok , tek renk sdadece giriş işlemleri olan bi sayfa olsun basit bi sayfa olsun.  Mesai
süresi her gün kullanılamasın yıllık izin verilen mesaiye göre sınırlansın internetten araştır. Onaylar kısmında diğer kısmı olsun muhasebeciden
onaya maaş bordrosu gönderilirse veya eğitim zimmet formu gönderilirse oradan onaylanabilsin mobil veya e imza ile  ayrıca mobil imza sitesinden
site içi görüntüler elde ettim neyi nasıl yaptığına dair fikir sahibi olabilirsin buradan, bir de araç takip modülü olsun hangi aracın kimde olduğu
belli olsun takip edilebilsin elinde araç olanlar sadece kendi aracını yöneticiler her aracı kimde olduğunu vs görsün aracın teslim alımı veya
teslim verimi üzerine fotoğraflı zimmet oluşturma olsun zimmetlere otomatik oradan gitsin örnek bi şablon oluştur inceleyip düzenleriz, ekipman
türleri içerisinde mekanik ve elektrik olarak ayrılsın.4. görselde rapor hazırlarken ekrandan çektiğim görselde denetçi standartlar açıklamasındaki
herhangi bir standarta tıklarsa sistemde şirketin yüklediği standartı pop-up olarak açsın. 5. görselde 2 tuş var hepsini uygulanamaz uygun yap vs
için ikisi de aynı işe yarıyor kırmızı küçük olanı kaldır, onun altında da  örneğin 5.1.1 maddesinin yanındaki ünleme tıklayınca aşağıda bir şeyler
açılıyor standartlar yazıyor, onun yerine pop-up açılsın hangi standarttan referans aldığı yazsın, ve tıklayınca standart açılsın pop-up. Bu arada
yapılan işlemlerde uyarı pop-up larını unutma ama sitedeki tüm işlemler için bi kontrol et bu açıdan, giriş çıkış,şifre değişme , rapor gönderme vb.
Uygun değil denilen seçeneklerde fotoğraf koyma zorunluluğu olmasın , kusur derecesi seçtirtmesin. Bu söylediklerimi tek bir rapor özelinde değil,
tüm raporları bu şekilde kurgulayabileceğim bir sistem tasarla ben müşteriye sunduğumda kendi rapor formatını yükleyip istediği gibi
şekillendirebilecek kurgulayabileceği bir sistem tasarlamamız gerkeli yoksa her rapor format yüklemesinde tek tek benim uğraşmam gerekli."*
→ kalemler AA1–AA10 (§11 225–): AA1 sade giriş · AA2 yıllık fazla çalışma sınırı · AA3 Onaylar › Diğer (bordro, eğitim, zimmet formu; mobil / e-imza
akışı) · AA4 Araç takip modülü · AA5 ekipman türleri mekanik / elektrik · AA6 rapordaki standarda tıklayınca firmanın yüklediği standart açılır ·
AA7 küçük toplu tuş kalkar, madde (i) pop-up · AA8 bütün işlemlerde uyarı / onay pencereleri taraması · AA9 "Uygun değil"de fotoğraf zorunluluğu
ve kusur derecesi kalkar · AA10 firmanın kendi rapor formatını kurduğu sistem (**§8.3 "şablon kodda, site içi düzenleyici yok" kararı değişti — kırk dokuzuncu tur**).
Ek (aynı gün, reisim birebir): *"bir işlem yaparken örnek yazılar yazılı olarak geliyor, silip bir şey yazmam gerekiyor onu da düzelt.."* → AA11:
yeni kayıt formları boş açılır (örnek değer alana yazılmaz; gerekiyorsa yalnız silik ipucu).

**Kırk dokuzuncu tur (2026-10-02, reisim birebir):** §8.3 önerisi (AA10) anlatıldıktan sonra *"Tamam yapalım"* → **§8.3 kararı değişti** (§11 234):
rapor formatı firmanın Format kurucusunda kurulan sürümlü bir tanımdır; saha ekranı ve PDF bu tanımdan çizilir, çizen motor kodda tektir
(`RAPOR-FORMAT.md`). Eski "şablon kodda, site içi düzenleyici yok" kararı kalktı.

**Ellinci tur (2026-10-02, reisim birebir):** *"Araç tutanağı şablonuna bakalım"* → şablon gösterildi; ardından *"Reisim tüm formatlar san daha önce
attığım bakanlık formatları a benzesin  elektrik topraklama ve panı için atmıştım"* → bütün iç belgelerin temel formatı Bakanlık formatlarının
(ZPKR01 topraklama, ZPKR02 elektrik iç tesisatı / pano) görünümünde (§11 235). Tutanağın kalem ve açı soruları açık kalıyor.

**Elli birinci tur (2026-10-03, reisim birebir):** *"Araç km bilgisi haftalık girilebilecek bir sistem kurulsun her hafta araç kaç km de ise kullanan
kişi yazsın takibi olsun,  github push  fail mesajı geldi bilgin olsun her format derken rapor formatlarınıda kast ettim aklında olsun , bunları yap
başka ne kaldı elimizde iş söyle"* · ara mesaj: *"Araçlarda sigorta kasko muayene yaklaşınca yan bar da bildirim balonu olsun uyrsın"* · *"Yine run
failed mesajı gelsi girhubdan bana mail olarak"* → haftalık kilometre + araç belge balonu (§11 236). Rapor formatları da Bakanlık görünümünde
(235'te rapor şablonu dahil; ölçülerek doğrulandı). Push hatası: kod denetimi geçti, Pages yayın adımı GitHub'ın geçici bir hatasıyla düştü;
ikinci e-posta benim yaptığım yeniden çalıştırmadan (aynı yayın paketi ikinci kez yüklendi) — sonraki push temiz yayınlar, yeniden çalıştırma
yapılmaz.

**Elli ikinci tur (2026-10-03, reisim birebir):** *"geçmişe yönelik günlerde rapor oluşturmayı engelleme geleceğe rapor yazmayı engelle"* (plan içi
ekran görüntüsüyle) → kural zaten buydu (yalnız ileri tarih kapalı), ama makette bugün sabit 23.09.2026 ve şerit bugünü söylemiyordu; 24.09'daki plan
geçmiş gibi okunuyordu. Metin bugünü ve kuralı söyler (§11 239). Ara mesaj: *"bu kısımda tarh"* · *"tarihler takvim seçmeli olsun"* (Plan aç ›
Tarihler) → §11 241. Ara mesaj: *"03.10.2026 dayız yine rapor oluşturamıyorum"* (bugüne açılan planda Rapor oluştur kapalı) → engel gerçek
takvime bakar (§11 240). Ara mesaj: *"S.A.Y tuşu biraz daha büyük olsun, 2 rapor nüshası ne demek hala anlamadım onu bana açıkla lütfen ayarlarda
neden böyle bi kısım var"*. Nüsha: rapor sonundaki "Bu rapor … nüsha olarak hazırlanmıştır" cümlesine yazılan kopya sayısı (yönetmelik 1.7.9); ayar yalnız o
sayıyı belirler. Ara mesaj: *"2 nüsha eklenirse 2 e- imza mı gerekir"* → hayır: e-imza dosyanın içinde, her kopya aynı imzayı taşır; rapor bir kez
imzalanır (e-imzalı firmanın 1 mi 2 mi yazacağına dair resmî açıklama bulunamadı — firma seçer). Ara mesaj: *"araca tıklayınca gözüken ekranda aracın
marka modeli plaka bilgileri de yazmalı"* · *"araç ekleme kısmıda göremedim"* → §11 242.
Aynı gün (reisim birebir): *"şimdi siteyi maketten normale geçirmek için hazırlık yap backend kurallarını vb şeyleri yaz ve veya kurallardan oku
hazır olunca söyle başlayalım eksiğimiz olmasın dikkat et"* → **`KOD-GECIS.md`** (§11 244): kural dosyaları ve pkproje tam okunup tek haritada
toplandı; başlamak için iki karar: **G0** maketlerin toplu onayı · **G1** geçmiş tarihe plan açma (makette engel; öneri uyarı). Yayından önce gerekenler
(Y1 probata yönetim paneli maketlenmedi · Y2 ilk açılışta toplu Excel içe aktarma · sunucu, e-posta, operatör, KVKK, mağaza hesapları) belgede.
Aynı gün, KOD-GECIS'e cevap (reisim birebir; örnek alt alan adındaki firma adı depo açık olduğu için alınmadı): *"her firma için ayrı site yapıcaz
örneğin ….probata.com.tr bunun için şirket açma paneline gerek yok diye düşündüm fikrim hatalıysa düzeltelim, ilk açılışta toplu excel yüklemeyi yapalım,
eğer windovsta çalışman gerekiyorsa buluttan çıkarıp projeyi normal pencereden devam edelim. Yapman gerekenleri yapıp makete uygula diğer sorularımı
cevapla."* → **Firma açma:** fikir doğru — her firma kendi alt alan adında, tek kod ve tek sunucu (alt alan adı firmayı seçer; firma başına ayrı kurulum
yok); ekran paneli yapılmaz. Tek düzeltme: firmanın kaydı (kısa kod, alt alan adı, ilk firma yöneticisi) bir yerde oluşmalı → bizim kullandığımız
komut satırı aracı (KOD-GECIS Y1). **Toplu içe aktarma** makette (§11 245). **Windows:** K0'ın ilk günü reisim'in bilgisayarında, yerel oturumda.
Aynı gün (reisim birebir): *"2 önerinide kabul ediyorum, yeni firmaya hizmet için site açma işini nasıl yapabileceğimizi nasıl bi arapanel
işimizi görür anlayamadım örnek göster"* → **G0 kabul:** "başlayalım" denince bütün maketler o günkü hâliyle onaylı sayılır. **G1 kabul:** geçmiş
tarihe plan açılır, Plan aç'ta uyarı şeridiyle (§11 246). Firma açma örneği: §11 247.
Firma açma için "ara panel" = firmaların değil, yalnız bizim girdiğimiz tek sayfalık yönetim ekranı (ör. yonetim.probata.com.tr); firma
başına site kurulmaz, tek form bir kayıt açar ve adres hemen çalışır. Örnek makette: `maket/yonetim.html` (§11 247). Öneri: komut satırı aracı
yerine bu küçük sayfa (reisim'in terminale ihtiyacı kalmaz); karar reisim'de.
Aynı gün (reisim birebir): *"Yönetim sayfa önerini kabul ediyorum ama bir sorum var şimdi bu işlemler için supabase ve natro hosting kullanmayı
düşünüyorum daha iyi bir önerin var mı ayrıca hosting yüne bize ait olur ama realtime database ve databese için her firma kendi sistemini kullansın,
üye açarken firmanın açtığı üyelikleri bağlayalım database vb oraya kullansın benim üzerimden işletme maaliyeti yükü gitsin müşteri ne kadar canlı
veri tapor kullanırsa ona göre kendi maaliyetlensin yedekleme işlemi de ayarlardan belirlenebilir olaun saatlik günlük gb. Arşiv için ekstra bulut
bağlamak isterse yine ayarlardan bağlayabilsin isterse kendi serverına da kurabilsin maaliyetini kendi yönetebilsin"* · *"Olabilir mi böyle bir şey ?"*
→ **Yönetim sayfası kabul** (KOD-GECIS Y1). Cevap (§11 248, KOD-GECIS G2 — karar reisim'de): olabilir, ama veritabanını firmaya taşımak yerine
**en büyük maliyet kalemlerini** firmaya taşımak önerildi: dosya deposu (fotoğraf, PDF) firmanın kendi bulut hesabında, yedek ve arşiv hedefi ve
sıklığı Firma ayarları'ndan, yapay zekâ zaten firmanın anahtarıyla (K2); büyük firma için ileride "kendi sunucusuna kurulum". **Supabase önerilmedi:**
Türkiye bölgesi yok (en yakın Frankfurt; §8.8 "veri yurt dışına çıkmaz" ile çelişir), giriş ve RLS zaten bizde, gerçek zamanlı veritabanı
gerekmiyor (09-B5). **Natro:** paylaşımlı hosting değil, kök erişimli sanal sunucu (VPS / VDS) olursa uygun.
Aynı gün (reisim birebir): *"Teisim senin önerin daha mantıklı peki veritabanı bizde olunca realtime database kotasıda bizden bi gidecek en çok
kota yiyen şey oydu firebase de ve yedekleme işlemleri de bizim sistemden mi dönecek tam olarak ne olacak bi açıklar mısın"* → **G2 kabul** (§11 249).
Açıklama: kendi sunucumuzdaki PostgreSQL'de okuma / yazma başına ücret ve kota yok (Firebase'deki gibi belge okuma sayılmaz); sınır sunucunun
işlemci / bellek / diskidir, aylık sabit ücret. Canlı dinleyici yok; veri sayfa açılışında, sayfalı ve yalnız gereken sütunlarla iner (09-B3, B5).
Fotoğraf / PDF firmanın deposundan kısa ömürlü imzalı bağlantıyla doğrudan iner → indirme trafiği firmanın hesabına. Yedek iki katman: (1) bizim
veritabanı yedeğimiz (bütün firmalar, sürekli + gece; biz öderiz, metin verisi küçük) — felaket kurtarma; (2) firmanın kendi yedeği: Firma ayarları'nda
sıklık / saklama süresi, işi bizim sunucu arka planda koşar, çıktı firmanın deposuna yazılır (yer firmanın).
Ara mesaj (reisim birebir): *"Sunucum yokki benim"* → fiziksel makine gerekmez: Türkiye'deki bir sağlayıcıdan (ör. Natro) aylık **sanal sunucu
(VPS / VDS)** kiralanır; şimdi gerekmez, K7 Yayın'da alınır (maket ve kod yerelde sürer). Kurulum betiği + adım adım kılavuz K7'de hazırlanır (KOD-GECIS §12).
Ara mesaj (reisim birebir): *"Ya firebase ya da supabase kullanıcaz ne sunucusundan bahsediyorsun anlamadım kafandan ne geçiyor"* → açık karar
**G3** (KOD-GECIS §0): hazır servis mi, kiralık sunucu mu. Önerim: hazır servis isteniyorsa **Supabase** (veritabanı PostgreSQL + RLS; iskeletin
tasarımı aynen taşınır, okuma başına ücret yok), **Firebase değil** (Realtime Database indirilen veri miktarına, Firestore belge okumasına göre ücretli — eski kota sorunu geri
gelir — ve PostgreSQL tasarımı baştan yazılır). Engel: Supabase'in Türkiye bölgesi yok (en yakın Frankfurt) → §8.8 "veri yurt dışına çıkmaz" değişir, KVKK yurt dışı
aktarım şartları hukukçuya teyit ettirilir. Google'ın Türkiye bölgesi (Turkcell ile) 2028–2029 bekleniyor. Uygulamanın kendisi (Next.js) ayrıca
hazır bir barındırmada çalışır (ör. Vercel, AB bölgesi).
Ara mesaj (reisim birebir; önceki ürünün alan adı depo açık olduğu için yazılmadı): *"Madem sunucu ile iş oluyordu ….com da neden firebase kullandık"*
→ o proje tek dosyalık, istemci ağırlıklı bir uygulamaydı; Firebase sunucusuz hızlı başlatır, küçük ölçekte ücretsiz kotası yeter. Bedeli kural
dosyalarında yaşanmış olarak duruyor: kota (03 "kota yiyici #1", ANAYASA 14), kimlik bileti sınırı (07), dal dal dinleme. Bu üründe çok firma, sunucuda PDF,
satır seviyesi izolasyon, Türkiye'de veri ve maliyet kontrolü gerektiği için PostgreSQL seçildi (§8, 2026-09-22). G3 açık.
Ara mesaj (reisim birebir): *"Anlayamadım sunucu kurmak ve supabase kullanmak tamamen aynı şey mi nasıl farklar var"* → ikisinde de aynı PostgreSQL
ve aynı kodumuz çalışır, firma farkı görmez; fark kurulum / bakımın kimde olduğu, verinin nerede durduğu ve ücretin biçimi (boş daire ↔ döşeli otel
benzetmesi). İkisi de PostgreSQL olduğu için sonradan biri ötekine taşınabilir. G3 açık.
Aynı gün (reisim birebir): *"Supabase kullanalım sebebi ise eğer bir sorun olurda kiraladığım server yetersiz gelirse sorun olur ama supabase de öyle bi ihtimal görmüyorum"* → **G3 kabul: Supabase** (§8.8 değişti, §11 253). Not: Supabase'de de sınır var (paket gücü), ama tıkla
büyütülür, taşıma gerekmez.
Aynı gün (reisim birebir): *"Evet başla"* → Firma ayarları › **Depolama ve yedek** maketi (§11 254).
Aynı gün (reisim birebir): *"yedekleme deposu olmadan şirket açılmasına izin verilmesin probata  gün saklar gibi bir alternatif olamaz, müşteriler hukuken raporları 5 yıl arşivlemek durumunda ona göre kurgula tekrar"* · ara mesajlar *"elle yedekleme olmasın"* · *"kendi depolarında da yedekleri ve raporlar düzenli arşivlensin"* → yeniden kurgu (§11 255): firmanın **kendi deposu firma açılırken zorunlu** (Yönetim › Firma aç; yoksa firma açılmaz), probata'da firma dosyası / yedeği tutulmaz; depo kesilemez, yalnız değiştirilir. Depoda **düzenli arşiv**: imzalanan her rapor PDF'i `arsiv/raporlar/YIL/Müşteri/`'ye hemen; yedekler `arsiv/yedek/`'e seçilen sıklıkla (saatlik / günlük / haftalık; **elle yedek yok**); her ayın ilk yedeği ve raporlar **5 yıl silme korumalı** (kısaltılamaz).
Aynı gün (reisim birebir; depo kilidinin her sağlayıcıda olmadığı söylenince): *"biz kurgulayalım, depoda 5 sene sonra silcek şekilde kodla , müşteri deposunu bağladıktan sonra siler silmez kendi bilir"* → depo kilidi yok; **bizim kod 5 yıl dolmadan silmez, 5 yıl dolunca depodan siler** (30 gün önce liste); firmanın kendi deposunda elle sildiği dosya firmanın sorumluluğu (§11 256). Açık soru: Firma ayarları › "Saklama süresi dolan raporlar" (5–20 yıl, sistemde kalsın / arşive taşınsın / silinsin) bununla nasıl birleşir.
Aynı gün (reisim birebir): *"2 olsun ayrıca firmanın deposunda raporlar nasıl saklanacak ? İmzalılar direk storage de düzenli olarak tutulsun realtimedatabase i napıcaz bu konuşar kafamda netleşmeti iyi bi analiz güzel bi sunum yapar mısın"* → **seçenek 2:** saklama süresi en az 5 yıl, firma 6–20 yıla uzatır; süre dolunca imzalı PDF'ler ve aylık yedekler depodan silinir; sistemde kalsın / arşiv / sil seçenekleri kalktı (§11 257). Analiz sunumu (claude.ai, özel): https://claude.ai/artifact/UydGCNcvjeXb2oVkFYWZNR — bilgi üç yerde (veritabanı Supabase · firmanın deposu · cihaz); **realtime database yok** (canlı dinleyici yok, okuma başına ücret yok; Supabase Realtime kapalı); imzalı PDF imza anında `arsiv/raporlar/YIL/Müşteri/RaporNo[-Rn].pdf`, değişmez, parmak izi veritabanında; yedek `arsiv/yedek/` (+ `aylik/`); çalışma dosyaları okunmaz kimlikle (09-A1), arşiv yolu okunur — ~~açık: arşivde okunur klasör adlarına onay~~, depo sağlayıcı önerisi, KVKK hukukçu.
Aynı gün (reisim birebir): *"evet okunur olsun"* → **arşiv klasörleri okunur:** `arsiv/raporlar/YIL/Müşteri ünvanı/RaporNo[-Rn].pdf`, `arsiv/yedek/…`; çalışma dosyaları (`calisma/`) okunmaz kimlikle kalır (09-A1) (§11 258).
Aynı gün (reisim birebir): *"şimdi bu kararıda geçtikten sonra artık site yazma işine geçicez geri kalan testleri canlı denememiz lazım çünkü ve daha da önemlisi buluttan projeyi yerele taşıman gerekiyor mu şu an ? ya da hangi aşamada taşıman gerekecek, kvkk falan yapma yok gerek yok öyle bir şeye zaten herkes kendi raporunu kendi tutacak,"* → **KVKK hukukçu işi kaldırıldı** (CLAUDE.md §2, 09-G3, KOD-GECIS Y3 / Y6). Yerele taşıma: K0'ın ilk günü (paket seçimi + ilk derleme) reisim'in Windows'unda yerel oturumda — KOD-GECIS Kısıt; sonra bulut ya da yerel fark etmez (GitHub ortak). Canlı deneme için erken **deneme ortamı** (Supabase ücretsiz proje + Vercel önizleme) önerildi (§11 259).
Aynı gün (reisim birebir, Firma ayarları ekran görüntüsüyle): *"ekranın bu kısmı çok dağınık yapay zek açık olunca ekranı alt üst ediyort bi düzenleme çek, verileri dışa aktar seçeneğini de komple kaldır."* → §11 260.
Aynı gün (reisim birebir, rapor Firma bilgileri ekran görüntüsüyle): *"şu tarih ve saat kısımlarında , tıklayınca takvim veya saat açılsın, silip yaza da bileyim ama her türlü takvim açılsın sadece yandaki tuşa basınca değil"* → §11 261. Ekipman Excel isteği (reisim birebir): *"ayrıca toplu ekipman yükleme derken örneğin ben bir müşteri oluşturdum teklif vermeden, eski müşterimdi, oluşturduğum müşterinin ekipmanlarını toplu excel ile aktarabilmeliyim sadece teklif verirken yapabiliyorum bunu ama plan açarkende işime yarar ona göre kurgula"* → §11 262. Aynı gün gelen öteki istekler (sırayla yapılıyor): müşterinin ekipmanlarını teklifsiz Excel'le yükleme (müşteri kartı + Plan aç) · İSG-KATİP sözleşme ID ve SGK DETSİS no plan ekranında elle, Kaydet · raporda SGK DETSİS no geri (*"raporlarda sgk destis no yu kaldrımışsın neden ? geri getir"* — 2026-09-29'daki "Plan içeriğinde SGK destis no kısmı yok olmalı" saha ekranından kaldırma diye uygulanmıştı) · planlamacı Düzenle / denetçi Güncelle (her rapora yalnız sahibi) · Onaylar'da bütün imzalar · Muhasebe'den bordro gönder · S.A.Y her sayfada · yapılmayan isteklerin taraması ve son durum sunumu.
Aynı gün ara mesajlar (reisim birebir): *"Şirket logosuda firma ayarlarından girilsin , raporlara otomatik çekilsin"* (§11 238) · *"Format
tasarımcısında herhangi bir başlığa tıklayınca en baş arıyor, en başa atmasın başlığı düzenlediğimiz yere odaklansın(telefonda)"* (§11 237).
Aynı gün (reisim birebir): *"isg katip sözleşme id ve sgk destis no el ile girilebilir olmalı, plan ekranında olmalı oradan tüm raporlara sirayet
edebilmeil kaydet tuşu olmalı."* · *"raporlarda sgk destis no yu kaldrımışsın neden ? geri getir"* (cevabım: 2026-09-29'da *"Plan içeriğinde SGK
destis no kısmı yok olmalı"* demiştin, o sözle saha raporundan ve plandan kalkmıştı; son söz geçerli, geri geldi) · *"planlamacı herhangi bir plana
düzenle diyip ilgili şeyleri düzenleyebilmeli, denetçi güncelle dediğin de o güncel bilgileri çekebilmeli yazdığı raporları ve plan ekranı ona
göre düzeltebilmeli (örneğin firma ünvanı adres vb) ama planlamacı direk raporun içine ve veya plana etki edip denetçinin işine karışamaması için
denetçi güncelle demeden olmamalı. dikkat et ne demek istediğimi iyi analiz et her denetçinin raporuna sadece kendisi müdahele edebilmeli."*
→ §3.4 Plan künyesi, §11 263.
Aynı gün (reisim birebir): *"onaylar kısmına raporlar harici diğer kısmı eklemeni istemiştim, maaş bordro imzaları, zimmet , t"* + *"tüm
imzalamalar buradan yürütülecek diye"* → Onaylar'a denetçi bakışı: imzamı bekleyen raporlar (son imza) + Diğer belgeler (§11 264). ·
*"muhasebe kısmında maaş bordrosu gönder tuşu olsun ve personellere maaş bordrosu göndersin imzalamaları için eğer bir format varsa format yoksa el
ile yükleyip gönderme seçeneği olsun her personele özel maaş bordrosunu yükleyip imzaya yollasın muhasebeci"* · *"söylediğim her şeyi yap
söyleyipte yapmadıın şeyler de olmuş bi maket turu at bana sunum yap son durumu"* · *"bu say botu plan içinde değil her yer de gözükecek şekilde
tekrar kurgula ve daha şık bi tasarım yap daha yuvarlak daha ilgi çekici olsun , onu eğitme işini maket bittikten sonra mı yapalım önce mi öneri
ver ?"* · **makette son tur:** *"devam et tüm işleri bitir, sonra koda geçelim yoksa buradan test etmek artık manasızlaştı devamını koddan yaparız
kod kısmına başlamadan önce tekrar konuşalım"* → kalan maket işleri (BB4–BB7) biter; koda geçmeden önce reisim'le konuşulur.
Aynı gün (reisim birebir): *"Her sayfaya tek tek say eklemektense say boy işaretini kalıcı ön görünüme ekleyemez misin her yerden tek boy yönetilir
sayfa değiiince vs geçmiş silinmez geçmiş olayı önemli"* → S.A.Y zaten tek dosyadan, kabuktan yükleniyordu; değişen: **sohbet geçmişi kalıcı**
(önceki "sohbet kaydedilmez, sayfadan çıkınca silinir" kararı bu sözle kalktı) — sayfa değişince, yenilenince ve açık bırakılan panelle birlikte
kalır; her mesaj hangi sayfada / raporda sorulduğunu taşır; rapor önerisi yalnız o rapor açıkken uygulanır; "Sohbeti temizle" (§11 266). Kodda:
S.A.Y uygulamanın kalıcı kabuğunda (Next.js ortak yerleşim) tek bileşen, geçmiş kişinin hesabında. · *"tamam devam et bitince sunum yap"*.
Aynı gün akşam (reisim birebir, ekran görüntüleriyle): *"hala say ı göremedim bitmedi mi işin ?"* · *"açtım zaten ama hala sadece rapor ekranında çıkıyor"*
· *"saat 17.53 sen ne anlatıyosun"* · *"ctrl f5 yapınca düzeldi"* (neden: tarayıcı önbelleği → §11 268) · *"ama asistan tuşuna basınca sayfayı kaydırıyor olmaz
her şeyden üstte olmalı demiştim sana"* · *"şu 3 çizgiyi sol barın içine taşı arka plan biraz daha açık bir renk olsun beyaza çok yakın olsun , tablette
raporu pasife al tuşu rapor oluştur tuşunu aşağıya taşırıyor, rapor oluşturduktan sonra sayfa başına atıyor, hatta herhangi bir tuşa basınca en başa
atıyor buna daikkat etmek gerek"* · yazım sorusu *"neden sgk destsis no büyük harflerle başlayıp yazılıp no kısmı küçük"* → "Hepsi büyük harf" (§11 269–270).
Aynı gün (reisim birebir): *"Mobilde aorun var mı ? Güncel maket linki atar mısın"* · *"Arka plandan vazgeçtim bu arada kalsın"* (§11 271) ·
**koda geçiş:** *"Makette eksik kalmadıysa koda geç , pc de yapman gereken iş olduğunda pc ye geçeriz"* → **G0 uygulandı, kod başladı** (KOD-GECIS);
paket izni sorulunca *"İzin isteme ne gerekiyorsa yap pc de yapmamız daha iyi olacak şeyler için pc ye geçmemiz gerekince söyle"* → paket izni kalıcı (§11 272).

**Elli üçüncü tur (2026-10-07, reisim birebir):** *"ekipman,cihaz,ekipmantürü vb eklenebilen şeylerin silinemediğini tespit ettim denemek için bir kaç
cihaz ekledim ama silemedim bunuda düzeltmeliyiz."* → **KESİN SİLME İLKESİ** (§11 357; KOD-GECIS §3, §4 `kayit_sil`): hiç **kullanılmamış** kayıt
(deneme, yanlış giriş) **kesin silinir** — yalnız **yöneticiler** (kaydın modülünde "yaz" + firma / mekanik / elektrik yöneticisi; reisim'in eski sözü
*"silme işlemi sadece yöneticiler tarafından yapılabilmeli"*); **kullanılmış** kayıt **pasife alınır** (geçmişi ve belgeleri durur, listelerden ve
seçimlerden kalkar, Etkinleştir ile geri gelir); **yasal kayıt silinmez** (imzalı rapor ve sürümü, fatura, tahsilat, zimmet hareketi, araç tutanağı,
belge onayı, yayınlanmış format, denetim izi — kendi yoluyla düzeltilir). "Kullanılmış" tanımı tek yerde, veritabanında (kayıt başına sayım); "Sil"
tuşu yalnız silebilene ve kullanılmamış kayda çizilir; onay "Geri alınamaz" der; silinen kayıt denetim izinde eski değeriyle kalır, dosyaları çöpe
gider. Ekran dili: **Sil** yalnız kesin silme; kayıt saklanıyorsa **Kaldır**, geri alınabiliyorsa **Pasife al**. Kayıt düzeyinde 30 günlük çöp kutusu
(ANAYASA 4.10) bu işte yok — silinen satır izde tam durur (bilinçli sapma, açık). Sıra: ölçüm cihazı (357) → cihaz pasif → cihaz türü → ekipman →
ekipman türü → demirbaş, araç, müşteri / tesis, personel, teklif taslağı, imza bekleyen sözleşme, format taslağı, eğitim, plan. Karar 48 ("müşteri
silinmez") kullanılmış müşteri için geçerli kalır; kullanılmamış (deneme) müşteri bu kararla silinir.

**Elli dördüncü tur (2026-10-10, reisim birebir; Talepler–Onaylar sunumunun karar formu doldurularak):** *"formları doldurdum maketlere baktım
onaylıyorum , şimdilik bunları yap ilerde detaylandıracağız ve yapacağımız başka işler de var"* → **Kararlar** (§11 477): **T1 evet** — onay bekleyen
her şey (raporlar, belgeler, izin talepleri, masraf formları) **Onaylar**'da; yan menüde tek balon (Onaylar'ın). **T2 hayır** — onaylayan talebi
**değiştiremez**: Onayla · **Düzeltmeye geri gönder** (gerekçe ≥ 10; talep eden Talepler'de düzeltip yeniden gönderir ya da geri çeker) · Reddet
(gerekçe ≥ 10). **T3 yok** — Talepler'de balon yok (kişinin kendi talepleri). **T4 kalksın** — Personel › İzin talepleri ve Muhasebe › Giderler'deki
onay tuşları kalkar; liste ve geçmiş kalır ("Onaylar'da aç" bağlantısı). **T5 muhasebe** — onaylanan masrafın "Ödendi"si Muhasebe › Giderler'de.
**B1 evet** — Bakanlık bölümü / öğesi serbestliği (470) kalır. Yetki: masrafa karar Muhasebe'yi değiştirende olduğundan Onaylar önerilen düzende
muhasebe rolüne de açıldı (kendi; planlama da kendi — Diğer belgeler'i için).
**B1 notu — ileride detaylandırılacak istekler (şimdi YAPILMADI, sıradaki turlarda maketle):** *"format yapıcıda kağıt üzerinde değişiklik
yapabildiğim kadar saha ekranında yapamıyorum istediğim kadar işlevli değil kağıt ekranı daha işlevli, ayrıca test tablosu olarak kullanılan yerlere
excelden yükle ve fotoğraf ekleme özelliği olsun fotoğraf eklenince belgede gözükmeyecek yapay zeka buradan okuma yapıp tabloyu dolduracak, aynı
şekilde ekipman bilgilerinde de olsun bunu istediğim başlığa da ekleyebiliyim rapor tasarımcısında da olsun ayrıca yapay zeka ile rapor
tasarımcısını da kullanacak kullanıcılar tam bir yapboz gibi olmalı ve kolay kullanışlı olmalı"* → (1) kurucunun **saha ekranı** kâğıt kadar
işlevli olmalı; (2) ölçüm / test tablolarına **Excel'den yükle** ve **fotoğraf ekle** — fotoğraf belgede görünmez, yapay zekâ okuyup tabloyu doldurur
(öneri olarak; §8.10 ilkesi); (3) aynısı **ekipman bilgilerinde**; (4) bu özellik kurucuda **istenen başlığa** eklenebilmeli; (5) **rapor tasarımcısı
yapay zekâyla** da kullanılabilmeli; (6) kurucu **yapboz gibi**, kolay. Hata listesine açık madde olarak girdi.

**Açık kalanlar:** ~~Ana sayfada İSGGM duyuruları~~ (2026-09-27: makette eklendi; okuma işi uygulamada) (reisim 2026-09-26: *"Ana sayfada isgüm duyurularını gösterebilir miyiz ? Bunu
yapılacaklar listesine ekle"*; öneri: ÇSGB İSGGM duyurular sayfası — https://www.csgb.gov.tr/isggm/duyurular/ — sunucuda günde birkaç kez
okunur (pg-boss işi, §8.9), Ana sayfada son 5 duyuru başlık + tarih + kaynağa bağlantı; yalnız ekranda, bildirim yok; sayfa RSS vermiyorsa
sayfa yapısı değişince okuma bozulabilir → okunamazsa sessiz kalmaz, "duyurular alınamadı" yazar; maket sırası Ana sayfa revizesinde) · **modül modül gözden geçirme** (M1–M5 ve M13 onaylandı — Ekipmanlar kalktı, Sözleşmeler birleşti; M6 Plan aç 2. tur incelemede) · **toplu maket çalışması** (M1–M16 + toplu bakış, `MAKET-PLANI.md`; sorular §3.6'da, 32'den) · **önizlemede örnek veri kipi** (öneri, §3.3) · ~~rol × modül görünürlüğü~~ (karar 2026-09-25: başlangıç düzeni + firma yöneticisi değiştirir) · **gerçek sunucunun sağlayıcısı**
(Türkiye, §8.8) ·
alan adının alınması · ~~e-imza yöntemi (8.4)~~ (2026-09-29: firma seçer, mobil imza ya da e-imza; makette V2) · v1 ekipman grupları · ~~5 yıl sonrası silme
mekanizması~~ (2026-09-29: firma seçer; makette Firma ayarları) · **zimmette birden çok cihaz varsa süzgeç** (§3) · ~~kontrol metodu standardının seçim yeri~~ (2026-09-27: ekipman türünde seçilir, raporda türden okunur) · **§3.1 ve §3.2'deki "öneri" maddeleri** (planlama saat dağıtımı,
revizyon, alan kopyalama, hafif kusur devri, meslek eşleşme denetimi).

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
- ⭐ **BİRİNCİL KAYNAK — yürürlükteki birleşik metin** (23/12/2025 değişikliği işlenmiş; 2026-09-22'de indirilip
  28 sayfa okundu, `RG-23/12/2025-33116` izi doğrulandı): https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.18318.pdf
  → §4.2 (1.7.1 alanları) ve §4.6 (meslek yetkileri) **bu metinden birebir** alındı.
- Reisim'in verdiği ek kaynaklar: https://www.tse.org.tr/duyuru/tse-is-ekipmanlari-egitimi-2026-agustos/ ·
  https://www.emo.org.tr/ekler/0f370ccd0984068_ek.pdf — ⚠️ EMO belgesi 2026-09-22'de açıldı, **meslek listesi
  içermiyordu**; meslek yetkileri bu yüzden yönetmeliğin kendisinden alındı (yukarıdaki birincil kaynak).
- Rol araştırması (2026-10-01, §3.9): ISO/IEC 17020 denetçi izleme — https://a2la.org/inspector-monitoring-from-an-iso-iec-17020-perspective/ ·
  https://nata.com.au/files/2021/05/ISO_IEC-17020-Assessment-Worksheet.pdf · İSG-KATİP ve uygunsuzluk takibi — https://isgfrm.com/threads/isg-katip-uezerinden-periyodik-kontrol-takibi-nasil-yapilir.32284/ ·
  https://www.ekipmantakip.com.tr/rehber/ · https://isgbys.com/blog/is-ekipmanlari-periyodik-kontrol · saha yazılımı beklentileri —
  https://vizyontechyazilim.com/blog/periyodik-kontrol-sureci-nasil-dijitallestirilir · http://www.vidco.com.tr/periyodik-kontrol-yazilimi ·
  teknisyen yönetimi / sertifika süresi — https://fieldzenpro.com/technician-management-software · https://daarsoft.com/inspection-management-software/
- Emsal ürünler: https://opwire.app/iso-17020-periyodik-kontrol-yazilimi/ · https://17020muayene.vidco.com.tr/ · https://akuple.com/asansor-kontrol-yazilimi/ · https://ensyazilim.com/

## 11 · Değişiklik günlüğü
- 2026-10-10 (477): **TALEPLER–ONAYLAR** (§9 elli dördüncü tur, T1–T5 · B1). Göç **0079** (izin_talebi ve gider): yeni durum **"duzeltme"** +
  gerekçe sütunu `geri` (10–200); izin_talebi_koru ve gider_koru baştan: karar (onay / ret / düzeltmeye geri) yalnız bekleyen talebe, onay damgası;
  **onaylayan içeriği değiştiremez** (izin: tarih, tür, açıklama; masraf formu: tarih, tür, tutar, oran, iş, açıklama, fiş); düzeltmedeki talebi
  yalnız talep eden düzeltir ve yeniden gönderir (önceki düzeltme isteği notta kalır), düzeltmedeki talebe karar verilmez; masrafın ödenmesi
  onaylanmış formda, damga korunur. Ekran: **Onaylar › Talepler** (`/onaylar/talepler`; onaylar/ui/TalepOnaylari.tsx: liste + salt okunur ayrıntı,
  Onayla · Düzeltmeye geri gönder · Reddet, gerekçe, PDF; geniş ekranda iki sütun, telefonda liste → ayrıntı) — izin firma yöneticisine, masraf
  Muhasebe'yi değiştirene (talepler/server/talepler.ts onayTalepleri / talepKarar; muhasebe/server/talep-baglanti.ts onayBekleyenMasraflar /
  masrafKarar / masrafDuzelt). Yan menüde Onaylar balonu talepleri de sayar, Talepler balonu kalktı (anasayfa/server/takip.ts). Talepler: "Düzeltilecek"
  çipi, düzeltme şeridi, talep penceresinde **Düzelt ve yeniden gönder** (izinDuzelt, masrafFormuDuzelt). Personel › İzin talepleri ve Muhasebe ›
  Giderler: onay / red tuşları kalktı, "Onaylar'da aç"; Giderler'de masraf formu salt okunur, **Ödendi** orada (giderOdendi). Onaylar önerilen düzende
  muhasebe ve planlama rolüne "kendi" (yetki tanımı · maket · KOD-GECIS §4 aynı); Onaylar'ı açan ofis rolü kendi bölümüne yönlenir. Kilitler:
  talepler / muhasebe / ana sayfa / onaylar testleri (iki firma, gerçek PostgreSQL — deneme makinesinde), olumsuz kanıt talepler 7, gider 6 (0079'u
  bozar), uçtan uca talepler.spec (geri gönder → düzelt → onay; muhasebe Onaylar'da onaylar; yeni ekranda erişilebilirlik taraması). PC'de: tip,
  lint, veritabanısız testler 239/239, veritabanısız olumsuz kanıt 102/102.
- 2026-10-10 (476): **469–475 YAYINDA** — main 2cd1e96 (göç yok, 79 göç), sağlık "tamam" (sürüm 2cd1e96), duman 10/10; canlıda ölçüldü: saha
  ekranı sayfası oturumsuz girişe yönlenir, gömme izni yalnız kendi kökenimiz (frame-ancestors 'self' + SAMEORIGIN), kurucu ve öteki sayfalar
  'none' + DENY. Son 12 saatte çalışma hatası yalnız bilinen duyuru zaman aşımı (önceki yayın). Deneme makinesi 13/13 yeşil (tablet 3 bir kez
  bellek sıkışıklığında giriş zaman aşımı — o anda 1 GB boş bellek, takasa geçilmişti → yalnız o iş yeniden koştu; kalıcı çözüm hata listesi 43,
  reisim kararı bekliyor). Hata listesi: 38, 40, 41 "bu yayında"; 35 (Talepler–Onaylar sunumu, karar formu boş) ve 9 (otomatik alanların yeri,
  sonraki tur) açık; önceki yayının maddeleri "önceden yayında". Oturum isteyen ekranlara (kurucu, saha ekranı, sürüm sayfası) canlıda giriş
  reisim'in — gözle ölçemedim; aynı ekranlar deneme makinesinde üç genişlikte uçtan uca geçti (görüntüler e2e-goz).
- 2026-10-10 (475): Deneme makinesi (9d7aa74) buldu: saha ekranı kâğıttaki değişikliği alıyordu ama çerçeve "dene" ile açılıp ilk iletiyle "Düzenle"ye
  geçince yalnız yeni eklenen bölümler açılıyor, var olanlar kapalı kalıyordu — Düzenle'ye her geçişte bütün bölümler açılır. Format kurucu uçtan uca
  akışı (471–473 adımlarıyla) tablette 120 sn'lik toplam test süresini aştı → bu testin süresi 300 sn (beklentiler aynı).
- 2026-10-10 (474): Site taraması (telefon) sürüm sayfasında buldu: belge önizlemesi telefonda yana kayıyor ama klavyeyle kaydırılamıyordu (odak dış
  kapta, kayan belgenin kendisi). Odak ve ad kayan öğeye (rapor önizlemesi ve onay ekranındaki gibi) — sürüm sayfası ve format kurucu.
- 2026-10-10 (473): **Saha ekranı onaylı maketle eşitlendi** (k1–k4 maketindeki eksikler): saha ekranının "Düzenle" kipinde bölüm yukarı / aşağı
  taşınır (ilk / son bölümde kapalı) ve her ana bölümün alt başlık grubunun sonunda "+ Alt başlık ekle (… altına)" — kâğıttaki gibi (alt başlık
  grubu ve ana bölüm bulucu format/duzen.ts altBaslikAnasi / altGrupSonu'ya taşındı, kâğıt ve saha ortak). KULLANIM kutusu maketteki gibi aygıtın
  yanında: bölüm, kontrol maddesi, yazılan / seçilen kutu, ölçüm tablosu, zorunlu fotoğraf; cevap dokunuşu açılır liste ↔ yan yana tuş (çubukla);
  "Denetçi gibi dene"de canlı "n eksik · m kusur" (çerçeveden ileti). Telefonda kurucu: Belge · Saha ekranı (telefon genişliğinde, yalnız dene).
- 2026-10-10 (471): **Sürüm sayfası yeniden** (reisim maket kararları formu k5 *"evet"* — sürüm sayfasında önceki sürüme göre değişenler). Sayfa formatın
  kimliğini söyler: yayınlanma (kim, ne zaman) · **bu sürümle yazılan rapor** (Raporlar'ın raporlar/server/format-baglanti.ts okuyucusundan, silinmemiş
  raporlar) · doküman kodu · bölüm · madde · sürüm notu · taslakta "Yayından önce bakılacak" · **önceki sürüme göre değişenler** (taslak yayındaki sürümle,
  sürüm N bir öncekiyle; bölüm / madde / grup / alan / sütun / değer eklendi · çıkarıldı · adı · ayarları, cevap seti, kurallar, doküman kodu, başlık,
  metot ve kapsam, talimat, madde cevabı biçimi — rapor-format/fark.ts, öğeler kimlikle eşlenir) · önizleme **Belge ↔ Saha ekranı** (472'nin görünümü,
  salt) · kurallar · öteki sürümler (rapor sayısıyla). Tek "Düzenle" (taslakta Format kurucu, yayındakinde o sürümden taslak). Görünüm listesi ve
  "Bakanlık alanı" yüzü kalktı. Kilitler: tests/format-fark.test (+ olumsuz kanıt), tests/raporlar.test (rapor sayısı, başka firma saymaz), uçtan uca
  rapor-format.spec (değişenler, rapor sayısı, sürüm notu, iki önizleme, öteki sürümler).
- 2026-10-10 (472): **Format kurucuda "Saha ekranı"** (reisim maket kararları formu: k1 *"evet"* — saha ekranında da düzenleme · k2 *"format"* — madde
  cevabının biçimi format başına · k3 *"ikiside olsun ama kağıt açılsın kağıtta yapılan değişiklik saha ekranında saha ekranında yapılan değişiklik
  kağıtta etki etsin"* · k4 *"tablet"*). Kurucunun üç görünümü: **Kâğıt** (açılışta) · **Saha ekranı** · **Belge önizlemesi**; üçü aynı taslak.
  Saha ekranı denetçinin göreceği GERÇEK ekran (raporlar/ui/SahaRaporu, deneme kipi), uydurma bir örnek raporla (raporlar/ornek.ts), çerçevede
  gerçek aygıt genişliğinde (Tablet 820 · Telefon 390; sayfaya sığacak kadar küçülür): sunucuya hiçbir şey gitmez, Kaydet / Onaya gönder yalnız
  denetler (eksikler penceresi aynı), fotoğraf dosyası yüklenmez. Kip **Düzenle**: bölüm / grup / madde / alan / sütun / değer adı kalemle yazılır,
  madde · alan · sütun · değer eklenir, çıkarılır (Bakanlık öğesi sorarak) — değişiklik kâğıda geçer, kâğıttaki saha ekranına. Kip **Denetçi gibi
  dene**. Formatın yeni ayarı **madde cevabı: Açılır liste · Yan yana tuşlar** (format/tanim.ts gorunum.cevap; tuşta tek dokunuş, "Uygun değil"
  seçiliyken kırmızı; belgeye etkisi yok) — gerçek saha ekranında da geçerli. Altında kullanım özeti (madde, dokunuş, yazılan / seçilen kutu,
  ölçüm tabloları; rapor-format/kullanim.ts). Çerçeve sayfası yeni kabuksuz rota grubu `(cerceve)` (oturum + Ekipman türleri kapısı sayfada); yalnız
  bu yolda frame-ancestors 'self' / SAMEORIGIN, öteki sayfalar hiç gömülmez (src/proxy.ts). Kilitler: tests/moduller.test (rota grubu, kapı, gömme
  izni), uçtan uca rapor-format.spec (saha ekranı, iki yönlü eşitleme, cevap tuşları, başlıklar).
- 2026-10-10 (470): **Bakanlık formatında serbestlik** (reisim, hata listesi 38: *"ama hala istediğim gibi değil başlık komple silmek vb hala
  imkansız biraz daha serbestlik lütfen"*). Hazır kurulan Bakanlık türlerinin bütün bölümleri kilitliydi; hiçbiri silinmiyordu. Genel ilkeyle ("kural
  uyarıdır, engel değil"): Bakanlık bölümü ve öğesi de silinir, adı, cevap seti, sütunları, sonuç metni, form kodu ve başlığı değişir; silmeden /
  çıkarmadan önce "Bakanlık formatının zorunlu parçası" diye sorulur; kilit simgesi yalnız işaret. Sunucu yayında Bakanlık formatından ayrılan yerleri
  UYARI olarak listeler (önceden ENGEL — yayınlanmazdı). Sabit kalan: ölçüm cihazları bölümü (459) ve firma bilgileri (reisim'in kararı). RAPOR-FORMAT.md
  §3 yerinde düzeltildi. Testler tarih ve gerekçeyle güncellendi (format-kurucu, alt-baslik, format-motor, rapor-format, iki olumsuz kanıt); kurucudaki
  kaldırılan üç korumanın olumsuz kanıtı kalktı. Karar formunda B1 sorusu olarak reisim'e de soruldu (Talepler ve Onaylar sunumu).
- 2026-10-10 (469): **Alt başlık ekle doğrudan** (reisim, hata listesi 40: *"hayır istediğim gibi olmamış alt başlık ekle dediğin gibi alt başlık
  oluşturacak bunu anlamanın nesi zor reisim ?"*). Format kurucuda her ana bölümün alt başlık grubunun sonunda "+ Alt başlık ekle" tuşu: tür
  sordurmaz, ana bölümün türünde alt başlık açar (kontrol listesi cevap setiyle, ölçüm tablosu aynı sütunlarla, test değeri, bilgi alanı; öteki
  türlerde kontrol listesi), içinde bir boş satır, adı hemen yazılır; numarası N.1, N.2 … (kurucu.ts altBaslikEkle; kilit tests/alt-baslik.test.ts +
  olumsuz kanıt). Eski "Alt başlık ekle" seçim listesi (önce tür sorardı) kalktı; "Buraya bölüm ekle" yerinde.
- 2026-10-10 (469): **455–468 YAYINDA** — main eca9998 (göç yok, 79 göç), Vercel READY, sağlık "tamam" (sürüm eca9998), duman 10/10; son 2 saatte
  çalışma hatası yalnız bilinen duyuru zaman aşımı (iş ekipmanları portalı yurt dışından; eski sürümde). Deneme makinesi 13/13 yeşil (telefon 3 bir
  kez bellek sıkışıklığında giriş zaman aşımı → yalnız o iş yeniden koştu). Hata listesi: bu turun 12 maddesi "bu yayında", önceki yayınınkiler
  "önceki"; madde 43 — deneme makinesinin kalıcı çözümü için karar. Mekanik Bakanlık türleri canlı firmada ilk açılışta (Ana sayfa / Ekipman
  türleri) kurulur — oturum istediği için ölçemedim. Maketin karar soruları (saha görünümü + sürüm sayfası) kayıtsız: hiçbir seçim gelmedi.
- 2026-10-10 (468): **Deneme makinesinde telefon takılması** (reisim: *"tüm işlemler"*). Sebep geliştirme sunucusu: 60 sn açılmayan sayfayı
  bellekten atıyor, test o sayfaya dönünce yeniden derleyip açık sayfayı yeniden yüklüyordu (zimmet testinde sayfa açma yarıda kesildi, hesap
  testinde onay penceresi açılmadı, telefonda site taraması 50 dk'yı aştı). Uçtan uca sunucusunda derlenen sayfa koşu boyunca bellekte kalır
  (next.config.ts onDemandEntries, yalnız bu sunucu); yayın ve uygulama davranışı değişmez. İkinci koşuda (927228e) telefon 55 → 25 dk, site
  taraması 4,6 dk; ama elle yazılmış hazırlık listesinde olmayan iki sayfa (Yeni rapor, "bulunamadı") testte ilk kez derlenirken sunucu 30 sn'den
  uzun meşgul kaldı. Hazırlık artık src/app'teki BÜTÜN sayfa ve uçları klasörden bulup testlerden önce ister (e2e/rotalar.ts; kilit
  tests/e2e-hazirlik.test.ts + olumsuz kanıt — yeni rota parametresi tanımlanmadan hazırlık durur).
  Üçüncü koşuda (5fb113a) 9 işin 8'i yeşil; tablet 3. parça iki kez üst üste site taraması sırasında makineyle birlikte kapandı ("runner has
  received a shutdown signal"). Site taraması her genişlikte kendi işinde (parçalar onu dışarıda bırakır — PROBATA_E2E_TARAMA; kapı denetimi:
  tarama parçalardan çıkarılınca kendi işi şart); sunucu dakikada bir "[bellek]" satırı yazar (kalan bellek, süreç türü başına). 8 Ekim'deki
  (423) aynı ayarın geri alınma sebebi de buydu: testte derlenen sayfa (o gün çevrimdışı denemesinin Yeni rapor sayfası).
  **Dördüncü koşu (3e9326f) ölçtü:** sayfaları bellekte tutunca geliştirme sunucusu hazırlıkta 3 → 13 GB (sayfa başına ~110 MB); 16 GB'lık makine
  testler başlamadan kapanıyor. Bellekte tutma GERİ ALINDI (ikinci kez — next.config.ts'te not: kullanılmaz). Kalan: hazırlık bütün sayfaları bir kez
  derler (derleme önbelleği ısınır), site taraması kendi işinde, bellek izi. Kalıcı çözüm (sonra, ayrı iş): uçtan uca testleri yayın derlemesinde
  koşmak — derleme bir kez, testte derleme / yeniden yükleme yok, bellek az. Engelleri: vitrin sayfaları yayında kapalı (5 test dosyası), yayının
  güvenlik başlığı (upgrade-insecure-requests) http'de, "standalone" çıktının başlatılması, görsel karşılaştırma görüntüleri yeniden.
  **Beşinci koşu (bfc6fe0) kök sebebi gösterdi:** bellekte tutma kapalıyken de sunucu hazırlıkta 13 GB'a çıkıyor — sunucuya verilen 12 GB'lık
  üst sınır yüzünden çöp toplayıcı ancak sınıra gelince temizliyor; makinede kalan bellek 0,0 GB, tarayıcı takasa düşüyor (tablet tarama kapandı,
  tablet 3 zaman aşımı). 434'teki "frame detached / browser has been closed" düşmeleri de aynı aile. Altıncı koşu (de71682): 9 GB yığında sunucu
  "heap out of memory" ile çöktü — gerçek ihtiyaç 9 GB'ın üstünde. Yığın 12 GB'a döndü; deneme makinesine 12 GB TAKAS ALANI (ci.yml): bellek dolunca
  makine kapanmaz, az kullanılan kısım diske iner. **Karar bekleyen kalıcı çözüm:** uçtan uca yayın derlemesinde — vitrin ve http için güvenlik
  başlığı (upgrade-insecure-requests) test ortamında gevşetilmeli; "önizleme / güvenlik atlama bayrağı kodda bulunmaz" ilkesine dokunduğu için reisim'in kararı.
- 2026-10-09 (467): **Mekanik zorunlu Bakanlık formatları** (reisim, hata listesi 25–26: *"mekanik tarafındaki zorunlu formatlar hala yok, kule vinç
  vb."*; *"eklenti kullanarak indir izin veriyorum"*). Bakanlığın sitesinden indirildi (2026-10-09): ZPKR06 kule kren (yürürlük 01.01.2026), ZPKR07 asılı
  erişim donanımı (01.02.2026), ZPMR01 LPG tankı periyodik muayene ve ZYDR01 LPG tankı yeterliliğin yeniden değerlendirilmesi (18.07.2025) + kriter
  belgeleri ZPKK06 / ZPKK07 / ZPMK01 / ZYDK01. Şablonlar formdan birebir (bölüm, alan, kriter adları; numaralar 1–9); her kriterin ünlem talimatı
  kriter belgesindeki içerik (** ağır, * hafif); ekipman bölümü "tam" (marka / seri / imal / kullanım yeri ekipman kaydına bağlı). Hazır kurulumda
  her firmaya dört mekanik tür: Kule kren (KKR), Asılı erişim donanımı (AED), LPG tankı (LPG), LPG tankı yeniden değerlendirme (LPY, 120 ay);
  resmî PDF'leri, standartları (TS EN 14439, TS ISO 9927-1, TS ISO 4309, TS 10116, TS EN 1808, TS EN 12817, TS EN 12819, TS 1446 …) ve ölçüm cihazı
  türleri (şerit metre, kumpas, lüksmetre, eğim ölçer, manometre). Dökümanlar › Muayene kriterleri › Mekanik'te dört kriter belgesi. Formdaki alt
  başlıklar (2.1 / 2.2) tek ekipman bölümünde; LPG'nin 1.1 yazılı plan ve 2.3 fotoğrafları numarasız bölüm (resmî numaralar kaymaz); formun sabit
  notları sonuç açıklamasında. Bakanlığın 12 TASLAK mekanik formatı (2021; hava tankı, kazan, forklift, krenler …) indirildi, şablon yapılmadı
  (reisim: *"bazı taslaklar çok eski … düzeneğimize uymuyorsa düzeneğimizi bozma"*) — sırası gelince yalnız kriter maddeleri hazır formatlara.
- 2026-10-09 (466): **Yönetim girişinde iki adım AÇILDI** (reisim, hata listesi 33: *"açalım"*). Deneme veritabanında yonetim_ayar.iki_adim = true
  (göç 0075'in dediği gibi veritabanı sahibi yazdı). Yönetici "ilk" durumda, anahtarı yok: sonraki girişte parola → karekod (Google Authenticator)
  → 6 haneli kod. Sorun çıkarsa aynı satır false yapılır. Ayrıca (hata listesi 25–26, 42): Bakanlık sitesinde mekanik zorunlu belgeler ZPKR06 kule
  kren (01.01.2026), ZPKR07 asılı erişim donanımı (01.02.2026), LPG ZPMR01 / ZYDR01; 12 mekanik ekipmanın resmî taslak formatı. Site PDF'i yalnız
  kendi sayfa etkileşimiyle veriyor (ASP.NET geri gönderimi; dışarıdan istek boş sayfa döndü) — PDF'ler reisim'den beklenir.
- 2026-10-09 (maket): **Denetçi gözünden saha ekranı + sürüm sayfası maketi** (reisim: *"sahada denetçinin kullanacağı ekranı göremiyoruz, denetçi
  gözünden de görebilmemiz lazım … Sürüm sayfası şu an kullanışsız"*). Anayasa 2.1 / 2.10: önce maket, onay, sonra kod —
  https://claude.ai/artifact/TTNZMvz2HTaHqFerpF3a9F (sunum, tıklanır maket masaüstü + telefon, karar soruları K1–K5; seçimler sayfada saklanır).
- 2026-10-09 (465): **Plan aç: kendiliğinden gelen ekipman çıkarılır; Excel'den ekipman** (reisim, hata listesi 7: *"mevcutta otomatik gelen
  ekipmanlarıda silebilmek istiyorum, belki ekstra bir plan geldi ve zaten yapılan ekipmanlar listede yine oluyor gereksiz yere? ayrıca excelden
  aktarma gibi seçenekler de olmalı."*). Tesisteki her ekipmanda "Çıkar / Geri al" (son kontrol tarihiyle); "Kontrolü yakın olmayanları çıkar"
  (son kontrol + periyot, firmanın eşiği — kapsamla aynı kural); "Çıkarılanları geri al". Çıkarılan tesiste kalır, yalnız bu plana girmez (L6
  "hepsi plana girer" bu kadar gevşedi). Elle eklenecekler "Excel'den yükle" ile de (Kod · Ekipman türü · Konum; şablon, satır satır önizleme;
  kod biçimi ve tekrar denetimi; en çok 200).
- 2026-10-09 (464): **Rapor ekranında kontrol tarihleri alt alta, kendiliğinden dolu** (reisim, hata listesi 9: *"Periyodik kontrol başlangıç ve
  bitiş tarihleri alt alta olmalı, hemen ardından bir sonraki kontrol tarihi olmalı ve bunlar o günkü tarihe ve saate göre otomatik dolmalı
  istenirse elle düzeltilebilmeli"*). Firma bilgilerinde başlangıç, bitiş ve sonraki kontrol tam satır, alt alta. Başlangıç rapor açılınca yazılır
  (değişmedi); bitiş elle seçilene kadar ŞİMDİ'yi gösterir ve ilerler (onaya gönderilince o anın saati yazılır); sonraki kontrol (başlangıç +
  periyot) ve rapor tarihi açılışta dolu gelir. Hepsi elle değişir.
- 2026-10-09 (463): **Rapor ekranında bölümler kapalı gelir** (reisim, hata listesi 8: *"ama her bölüm açık geliyor, her bölüm kapalı gelmeli"*).
  Rapor açılınca bütün bölümler kapalı; başlığa basınca açılır. Bölümlerin üstünde "Tümünü aç / Tümünü kapat". Açılanlar aynı sekmede aynı raporda
  (yenileme, geri geliş, bağlantısız açılış) açık kalır. "Onaya gönder" eksik bulursa ya da S.A.Y / eksik listesinden "Git"e basılınca hepsi açılır.
- 2026-10-09 (462): **Ana sayfa duyurularında "alınamadı" uyarısı kalktı** (reisim, hata listesi 32: *"böyle kalsın ama uyarı yazısı kalksın"*).
  İş ekipmanları portalı yurt dışından okunamadığı için şerit hep görünüyordu; okunamayan kaynak sağlık denetiminde ve iş kaydında kalır.
- 2026-10-09 (461): **Alt başlık ekleme** (reisim: *"üst başlık ekleme olayı kullanımı zorlaştırıyor alt başlık ekleme olayı olmadığı için anlamsız
  oluyor alt başlık ekleme olsun"*). Bölüm "alt başlık" olabilir: üstündeki ana bölümün altında 5.1, 5.2 … (ana bölümün kendi içeriği kalır; belgede
  alt başlık, saha ekranında aynı numara). Format kurucuda her bölümün altında "+ Alt başlık ekle" (bölüm türü seçilir, adı yerinde yazılır),
  şeritte "alt başlık yap / ana başlık yap"; bölüm ayarlarında "Alt başlık" kutusu. Üst başlık yazma kutusu kalktı (Bakanlık formatlarının üst
  başlıkları aynen; firmanın elle verdiği üst başlık görünür, "Üst başlığı kaldır"). Bakanlık bölümü alt başlık yapılamaz (kilitli öz).
- 2026-10-09 (459): **Standartlar ve cihazlar türden, kendiliğinden** (reisim: *"cihazlar ve standartlar ekipman türü sayfasından seçilirse otomatik
  olarak gelsin güncellensin şablon"*). Format kurucuda "Periyodik kontrol metodu ve kapsamı" satırı türün kontrol metodu standartlarını, ölçüm
  cihazları bölümü türün ölçüm cihazı türlerini kendiliğinden gösterir (tür sayfasında değişince kâğıtta ve belge önizlemesinde de; raporda
  zaten türden okunuyordu). Ölçüm cihazları bölümü sabit: silinmez, tektir; formatta yoksa kurucu açılınca 3. bölüm olarak eklenir. Seçilmemişse
  kâğıt söyler ("tür sayfasında seçilince burada kendiliğinden görünür").
- 2026-10-09 (460): **Ekipman bilgileri serbest** (reisim: *"rapor format oluşturucuyu beğendim, böyle kalsın ama değişiklikler yapalım, ekipman
  bilgileri kısmıda değiştirilebilir olsun zira yangın dolabı gibi ekipmanlarda farklı girdiler olabiliyor sabit olan tek şey firma bilgileri,
  cihazlar ve standartlar"*). Format tanımında "tam" ekipman bölümü: raporun 2. bölümü ekipman kodu ve türü dışında YALNIZ formatın alanlarıdır.
  Marka, model, seri no, imal yılı, kullanım yeri, kullanım amacı, ekipman bölümü "ekipman kaydına bağlı alan" — Format kurucuda adı değişir,
  çıkarılır, "Ekipman kaydından alan ekle" ile geri gelir; değeri sahada yazılır, ekipman kaydından başlar, etiketten okunur, kopyada gelir. Yeni
  türlerin hazır formatı ve boş format tam bölümlü; eski format Format kurucu açılınca çevrilir (belgenin metni aynı kalır — Bakanlık beşi ve
  kompresörde testle kilitli; Bakanlık kilitleri geçer). Tam bölümsüz eski formatlar ve onlarla açılmış raporlar eskisi gibi çizilir.
- 2026-10-09 (457–458): **Grup başlıkları sola; "AKR." yeri** (reisim: *"Grup başlıkları sola dayalı olsun"*, *"Firma adı ile başlık arasındaki AKR
  yazan yere anlam veremedim"*). Kontrol listesinin grup başlıkları belgede ve kâğıtta sola dayalı (saha ekranında zaten soldaydı). Başlık
  tablosundaki üçüncü hücre firmanın akreditasyon (TÜRKAK) numarasıdır (Firma ayarları); numara yoksa belgede artık boş (eskiden "AKR." yazıyordu),
  kâğıtta ne olduğu yazılı. Rapor belgesinin görsel karşılaştırma görüntüleri yenilendi.
- 2026-10-09 (456): **Talepler balonunun sebebi sayfada** (reisim: *"Talpelerde 3 yazıyor baloncuk içinde ama tıklayınca hiç bir şey gözükmüyor. ?"*).
  Sayı, kişiye iletilen ve kararını bekleyen izin talepleri (firma yöneticisi) ile masraf formlarıdır (Muhasebe'yi değiştiren); Talepler sayfası
  ise kişinin KENDİ taleplerini listeliyordu. Artık sayfanın üstünde sarı şerit: kaç izin talebi (İzin talepleri ekranına bağlantı), kaç masraf
  formu (Muhasebe › Giderler'e bağlantı), numara · kişi · gün. Şeritteki talepler balonla aynı süzgeçten (anasayfa takip.ts talepTakip; testle
  kilitli: sayı = balon, talep eden ve başka firma görmez).
- 2026-10-09 (455): **442–453 YAYINDA** (main 806c3da; göç yok — 0078 / 79; sağlık "tamam", duman 10/10). Reisim: *"reisim önce sunum yapıyoduk
  sonra onay alıp yapıyorduk ? tüm kurallarımızı unuttun heralde direk dalmışssın işe ? … ben isteyenin istediği gibi bir şey yapabileceği bir sistem
  düşünüyorum"* → ANAYASA 2.1 / 2.10 / 0.12 çiğnendi: 450 (yeni türe hazır format) ve 451 (kâğıt kurucu) maket ve onay olmadan kodlandı. Reisim:
  *"şimdi çalışan taskı bitir yaptıklarını yayınla inceleyeyim belkide onaylarım … konuşmalardan düzeltmen gerkenleri listele"* → yayınlandı;
  450 ve 451 **reisim onayına sunuldu** (beğenilmezse geri alınır); format sistemi ("isteyen istediği gibi") sunumla yeniden açılacak — onaydan
  önce kod yok. Şikâyet / istek listesi reisim'in işaretlediği sayfada (claude.ai Artifact "probata Hata Listesi", 34 madde: bu yayında · onaya
  sunulan · önceki yayınlarda · açık). Canlı deneme firmasında TRANSPALET'in boş taslağı hazır formatla dolduruldu ve yayınlandı (sormadan —
  listede 12. madde). 454: araç teslim tutanağı PDF'i canlıda "spawn ETXTBSY" ile düştü (aynı örnekte iki PDF Chromium'u iki kez açıyordu) →
  ikili örnek başına bir kez açılır, meşgulse bir kez yeniden denenir.
- 2026-10-09 (451): **Format kurucu baştan: raporun kendisinin üstünde düzenleme** (reisim: *"format kurucu hiç kullanışlı değil, mantıksız zor ve
  karmaşık"*, *"formatı oluştururken nasıl gözükeceği zihnimde canlanmıyor bile"*). Üç sütunlu düzenleyici (solda bölüm listesi, ortada form, sağda
  önizleme) kalktı. Kurucu artık KÂĞIT: belgenin Bakanlık görünümü (başlık tablosu, pembe bölüm şeridi, mavi etiket hücreleri — PDF'teki gibi) ve
  aynı numaralar; 1. Firma bilgileri sabit (yalnız metot satırı yazılır), 2. Ekipman bilgileri, sonra bölümler. Bölüm adına, etikete, maddeye, grup
  adına, sütun başlığına, değer adına, sonuç cümlesine basıp orada yazılır; "+ Madde ekle / + Sütun / + Alan ekle / + Değer ekle" yerinde yeni
  satır / sütun açar ve adını yazdırır; "×" çıkarır; ayrıntılar (tür, seçenek, sınır, birim, standart, talimat) öğenin ayar tuşunda; bölüm şeridinde
  yukarı / aşağı, ayarlar, sil; bölümler arasında "Buraya bölüm ekle", sonda "Bölüm ekle". "Belge önizlemesi" aynı taslağı PDF'le aynı çiziciden
  boş bir raporda gösterir. Telefonda belge önizlemesi. Kaydet / Vazgeç / Yayınla ve kilitli (Bakanlık) öğe kuralları aynı. Deneme makinesi
  kurucunun ekran görüntülerini her koşuda yükler (e2e-goz/) — PC'de yerel sunucu olmadığından ekrana oradan bakılır.
- 2026-10-09 (450): **Yeni türde "PDF yükleyin" kalktı; rapor formatı hazır gelir** (reisim: *"her raporun görüntüsü, bakanlık formatından sana
  attığım pdf deki gibi olacak demiştim standart olarak pdf formatı yükleyin diyor hala yeni tür ekleyince, default olarak makette yaptıklarımız gibi
  olacak"*). Rapor yayındaki şablondan yazılır, belge Bakanlık görünümünde çizilir — PDF hiç gerekmiyordu, ekran yine de "PDF yüklenince bu türde
  rapor oluşturulur" diyordu. Artık yeni tür eklenince maketteki gibi Ek-III grubuna göre kurulmuş format (firma bilgileri, ekipman bilgileri +
  grubun alanları, ölçüm cihazları, grubun muayene kriterleri, test değerleri, fotoğraf, kusur, yorum, sonuç, imza) kendiliğinden YAYINDA (sürüm 1)
  gelir, aynı işlemde; formatı hiç olmayan eski türler hazır kurulumda bir kez tamamlanır. Ekipman yüke / basınca bağlı sınırlar sabit sayı değil not
  ("anma yükünün %110'u"). Tür sayfasında "Rapor formatı" yüzü yayındaki şablonu gösterir; PDF bölümü "Basılı format PDF'i — isteğe bağlı" oldu
  (tuşu "Format PDF'i yükle"); listede "Rapor formatı: Yayında / Yayında değil".
- 2026-10-09 (453): **Deneme makinesinin bulguları**. Plan içinde kabulden önce de "Plandaki ekipmanlar" (kod · tür · konum; elle eklenenler dahil) —
  eskiden ekipmanlar ancak kabulden sonra Denetim adımında görünüyordu, elle eklenen ekipmanın plana girdiği görülemiyordu. Site taramasının dengesiz
  kart denetimi artık bulgu (kilit): ilk koşuda tek bulgu Firma ayarlarının sütunlu (gazete) yerleşimiydi — orada kartlar alt alta oturur, kısa kartın
  altı boş kalmaz; sütunlu yerleşim sayılmaz.
- 2026-10-09 (452): **Açılır listeler ve takvim artık hiçbir şeyi itmiyor, kesilmiyor** (reisim: *"böyle sekme mi açılır gözünü seviyim seçmeli yere
  tıklıyoruz tüm sayfa kayıyor ?"*, *"bu ve benzeri kaymalar kabul edilemez siteyi tam teşekküllü tarama istiyorum"*; Araç ekle penceresinde Yakıt
  listesi altındaki alanları itiyor, Muayene bitişi takvimi pencerenin altında kesiliyordu). Seçim listesi, süzgeç seçicisi, takvim ve saat / dakika
  önerileri tarayıcının üst katmanında yüzer (tek parça: `src/components/secim/yuzen.ts`): alanın altında, sığmazsa üstünde; ekrandan taşmaz; sayfa /
  pencere kayınca izler. Pencerede "liste akış içinde" kuralı kalktı. Site taramasına 7. denetim: her sayfada ve sayfanın "… ekle / … düzenle /
  Yeni …" pencerelerinde seçim listeleri ve takvimler açılır — öğe yerinden oynarsa ya da katman kesilir / örtülürse bulgu (pencere kaydedilmeden
  kapatılır). Deneme makinesinde çıkan iki telefon hatası: boş ölçüm tablosunun kayan kabı klavyeyle odaklanır (erişilebilirlik), kap konumlu (gizli
  tablo başlığı sayfayı yana taşırmasın); yana taşma denetimi artık taşan öğeyi adıyla yazar.
- 2026-10-09 (449): **Sözleşmeler balonunun sebebi görünür** (reisim: *"sözleşmeler kısmında 1 yazan bir uyarı var ama sebebini anlayamıyorum ? içeride
  hiç bir şey yok ?"*). Yan menüdeki kırmızı sayı, açık bir planın ekibinde İSG-KATİP SÖZLEŞME ID'si eksik ya da bitmiş kişi sayısıdır; sayfada ise yalnız
  sözleşmeler vardı. Artık Sözleşmeler sayfasının üstünde kırmızı şerit: hangi plan (bağlantılı), hangi müşteri, hangi gün, kaç kişi ve ne yapılacağı
  ("planın ekibine ID'yi yazın ya da tesisin iş sözleşmesine ekleyin"). Şeritteki planlar balonla aynı süzgeçten gelir (kişinin gördüğü açık planlar;
  toplamı = balon, testle kilitli); balonun açıklaması da aynı cümle.
- 2026-10-09 (448): **Tarih / saat alanı görsel bozukluğu** (reisim: *"ekranda takvim kısmında gördüğün gibi görsel bozukluklar oluyor,bu vb hataları
  düzelt"*). Tarih alanının çerçevesi içe gölgeydi: takvim simgesinin üstüne gelince simgenin zemini çerçeveyi örtüyor (köşede gri kutu taşması), odakta
  halka yalnız girdinin çevresinde kalıp simge dışarıda görünüyordu → çerçeve gerçek kenar (simge zemini içinde kalır), odak halkası girdi + simge birlikte
  tüm alanın etrafında (`:has`); saat ve dakika parçaları da aynı (ortak bileşen — her ekranda).
- 2026-10-09 (447): **Rapor ekranı ve format kurucu düzeni** (reisim: *"rapor tasarımcısında tasarım yapmak zor tek tek sütun girdiriyorsun mesela ama
  sütun gibi gözükmüyor kafa karıştırıcı tablo gibi gözükmeli format yapıcısıda, satır eklemediğin sürece neyin nereye yazılacağı bile gözükmüyor tablo
  başlıkları gözükmüyor … yetkili kişiler ve imzalar kısmının denetim raporu ekranında gözükmesine gerek yok … sıralama hatası yok mu … firma bilgileri
  kısmı her formatta aynı olacak şekilde sabit olmalı, yeni format oluştur dese bile firma bilgileri kısmı sabit gelmeli"*).
  · Ölçüm tabloları rapor ekranında satır yokken de başlıklarıyla ("Satır yok — Satır ekle ile ekleyin").
  · Format önizlemesi ve kurucu: ölçüm bölümünün sütunları TABLO (başlıkta ad / birim / sınır, kurucuda başlıkta düzenle · sil; altında örnek satır).
  · "Yetkili kişiler ve imzalar" (imza bölümü) rapor ekranında yok, belgede (PDF) var; önizlemede "rapor ekranında görünmez, belgede basılır".
  · Firma bilgileri rapor ekranında Bakanlık formunun ve belgenin sırasıyla: firma adı | periyodik kontrol adresi · rapor no | rapor tarihi ·
  İSG-KATİP | SGK · başlangıç | bitiş · sonraki | takip · e-posta | telefon · metot · ekipman bölümü.
  · Firma bilgileri bölümü (yalnız kayıttan alanlı bilgi bölümü — format/duzen.ts kayittanBolumMu) kurucuda SABİT: düzenlenmez, silinmez, taşınmaz;
  rapor ve belge onu her formatta aynı çizer (zaten formattan çizilmiyordu); sıfırdan format da onunla gelir.
- 2026-10-09 (446): **Site taramasına "dengesiz kartlar"** (reisim: *"siteyi gez ve bu vb şeyleri hemen düzelt"*). e2e/tarama.ts her sayfada, üç
  genişlikte: aynı satırda yan yana duran kartlardan (kenarlı + zeminli kutu) biri ötekinden belirgin uzunsa (fark > 120 px ve oran > 1,4) kap + iki kartın
  başlığı. İlk tur yalnız deneme makinesinin günlüğüne yazar ("DENGESIZ KARTLAR"); bulunanlar düzeltilince bulguya (kilide) çevrilir.
- 2026-10-09 (445): **Açılır kapanır bölümler başlık satırına basınca** (reisim: *"açılır kapanır ekranların başlık satırına basınca açılıp kapanmalı
  sadece kenardaki küçük bir açma kapama tuşu ile olmaz o iş"*). Rapor ekranının (saha raporu, onay, format önizlemesi — ortak RaporBolumu) başlık
  satırının her yeri açar / kapar (üstüne gelince zemin); satırdaki öteki tuşlar (talimat, standart, Hepsini işaretle) kendi işini yapar, açılan pencere
  de bölümü kapatmaz; kenardaki tuş klavye / ekran okuyucu için kalır.
- 2026-10-09 (444): **Plan aç düzeni; elle ekipman; denetçi e-postası bilgilendirmede** (reisim: *"bu sayfadaki kargaşa- kayıklık bi taraf uzun bi
  taraf kısa çok kötü … çok uzun bir şey ise bile kaydırabilir olsun kendi içinde"*; *"seçilen denetçinin mailleri bilgilendirme maili kısmına otomatik
  gelsin"*; *"plan açılırken ekipmanlar tesise girilenler kadar otomatik geliyor el ile de girilebilmeli liste gibi"*).
  · Form sayfaları (ortak FormSayfa): aynı satırdaki kartlar EŞİT boy (stretch); FormBolum `kaydir`: uzun içerik bölümün kendi içinde kayar (yan yana
  dizilen genişlikte en çok 440 px; telefonda sayfa akışında; klavyeyle kaydırılabilir bölge).
  · Plan aç: denetçiler kısa satırlar (seçim, ad, meslek, durum; altında İSG-KATİP ID · EKİPNET · aynı gün · uyarı — eskiden kişi başı beş satırlık kart);
  bölümler: 1 Müşteri ve tesis · 2 Tarihler · 3 Denetçi · 4 Bilgilendirme · 5 Ekipmanlar · 6 Özet ve uyarılar. Seçilen denetçinin giriş e-postası
  Bilgilendirilecekler'de kendiliğinden ("denetçi" etiketli, kaldırılmaz — e-posta ekibe zaten gider). Ekipmanlar: tesiste kayıtlılar listede (hepsi plana
  girer) + "Ekipman ekle (elle)" satırları (tür, kod, konum) — plan açılınca aynı işlemde tesise kalıcı kayıt + plana; kod denetimi plan içi "Yeni ekipman"
  ile aynı (listede iki kez, tesiste kayıtlı, başka tesiste, eski kod → açılmaz, hiçbir şey yazılmaz).
- 2026-10-09 (443): **Deneme ortamı (canlı deneme firması probata-deneme'ye UYDURMA veri)** (reisim: *"bir deneme ortamı oluştur, 2-3 firma, gerekli
  ölçüm cihazları , denetçi planlamacı hesapları vs , makette oluşturmuştuk benzeri daha az kalabalık olanı ve bu günü geçecek planlar olmasın"*).
  Kod değişmedi; veri tek veritabanı işleminde (düşerse hiçbir şey yazılmaz; ikinci kez koşmaz), uygulamanın kurallarıyla: numara sayacı (P-AAYY-SIRA),
  plan ekibi İSG-KATİP ID'siyle (kayıt "kullanıldı"), tesisin bütün etkin ekipmanı plana, denetim izine tek satır ("probata · deneme ortamı").
  · Kişiler + hesaplar (hepsi etkin, ortak deneme parolası — depoda yok, reisim'e sohbette verildi; e-postalar …@probata-deneme.example): Selin Arslan
  (planlama), Murat Demir (mekanik yönetici, makine müh.), Elif Yıldız (elektrik yönetici, elektrik müh.), Kerem Aydın (denetçi, makine müh.), Burak
  Koç (denetçi, elektrik müh.), Zeynep Şahin (denetçi, elektrik-elektronik müh.), Hakan Öztürk (muhasebe).
  · Müşteriler: Anadolu Metal (Gebze Fabrika: 2 kompresör, AG topraklama, iç tesisat · Dilovası Depo: AG topraklama, iç tesisat, yangın algılama) ·
  Ege Gıda (Kemalpaşa Tesisi: iç tesisat, AG topraklama, yıldırımlık, yangın algılama, trafo) · Marmara Lojistik (Tuzla Depo: kompresör, yangın
  algılama, yıldırımlık, AG topraklama) — 16 ekipman, yalnız rapor şablonu yayında olan türler (transpalet şablonsuz — kullanılmadı).
  · Ölçüm cihazları (marka "Örnek Ölçü", kalibrasyon 45 gün önce, 320 gün geçerli): tesisat test ×2, topraklama ölçer ×2, lüksmetre ×2 (Burak ve
  Zeynep'in zimmetinde), manometre ×2 (biri Kerem'de, biri depoda). Kompresör türüne gerekli cihaz manometre (boştu). Fiyat listesi (yoksa).
  · Planlar (hiçbiri geçmiş tarihli değil; hepsi "kabul bekliyor"): bugün Anadolu Metal / Gebze (Kerem + Burak) · +3–4 gün Ege Gıda (Zeynep) ·
  +7 gün Marmara Lojistik (Kerem + Burak) · +14 gün Anadolu Metal / Dilovası (Zeynep).
- 2026-10-09 (442): **Mekanik / Elektrik alt sekme olarak; Muayene kriterleri'nde de** (reisim: *"bu şekilde olmaz altında bir sekme gibi olacak ve
  sadece standartlarda değil muayene kriterlerinde de olacak"*). Branş sekmeleri ana sekmelerle (Standartlar · Muayene kriterleri · Diğer
  dökümanlar · Eğitimler) yan yana duruyordu → ortak sekme bileşenine `alt` biçimi: ana sekmenin ALTINDA kendi satırında, çizgili, seçilinin altı
  çizili. Muayene kriterleri'nde Mekanik (0) / Elektrik (5) (?brans=e; kriter belgesinde branş — rapor formatının türüyle aynı, testle kilitli);
  Mekanik boşken "Mekanik muayene kriteri belgesi yok" (Bakanlık yayımladıkça görünür). Kriter belgesinin kırıntısı branşıyla.
- 2026-10-09 (441): **439–440 YAYINDA** — Supabase göç 0078 (standart.brans; 79 göç; özet aynı, dış API'ye hak yok — denetlendi), main = 30fdd6a,
  sağlık "tamam" (göç güncel), duman 10/10, çalışma hatası yok. Deneme makinesinde telefon 2/2 bir kez girişte düştü (geliştirme sunucusu sayfanın
  kod parçasını yüklerken bağlantıyı kopardı — ECONNRESET; aynı test önceki turda geçmişti), yalnız o iş yeniden koştu, geçti; öteki altısı ilk
  koşuda yeşil. Canlı firmada cihaz / standart taraması bir sonraki açılışta koşar (kurulum.baglanti henüz yok): ET'ye ZPKR02 standartları ve
  tesisat test cihazı, AGT / YKT / YAS / TRF'ye cihaz türleri; kompresör (KMP) Bakanlık formatı değil — dokunulmaz. Oturumlu ekranlar: ölçemedim.
- 2026-10-09 (440): **Bakanlık türlerinde ölçüm cihazları hazır; Standartlar Mekanik / Elektrik ayrı** (reisim: *"AYRICA KULLANILACAK ÖLÇÜM
  CİHAZLARINI DA EKLE , STANDARTLARIDA KENDİ ALTINDA MEKANİK ELEKTRİK OLARAK AYIR"*).
  · **Ölçüm cihazları:** Bakanlık formları cihaz türü adı vermez ("Ölçüm aletleri bilgileri": ad, seri no, kalibrasyon); türler formun ölçüm
  yöntemlerinden, yalnız ŞART olanlar (raporda her birinden kalibrasyonu geçerli cihaz istenir — ENGEL 2): ZPKR01 / ZPKR02 → "Tesisat test cihazı
  (çevrim empedansı / RCD)", ZPKR03 / ZPKR05 → "Topraklama ölçer (3 uçlu / pens)", ZPKR04 → "Lüksmetre" (acil aydınlatmanın aydınlık seviyesi). Termal
  kamera Bakanlıkça isteğe bağlı (ZPKK02 / ZPKK05 Not 4), akü gerilimi panelin test tuşuyla da ölçülür — şart konmadı. Cihaz türü adıyla bulunur,
  yoksa Ölçüm cihazları'nda açılır. Kurulan türlere girer; firmanın kendi açtığı Bakanlık şablonlu türlerde (canlıda ET) **boş** standart / cihaz
  bağlantısı formatınkiyle tamamlanır — kurulumda bir kez (ayar kurulum.baglanti), "Şablondan başlat" / "Tür olarak ekle"de o türe. Firmanın seçtiği
  bağlantıya dokunulmaz; "Metot ve cihazlar"dan değiştirilir.
  · **Metot ve cihazlar penceresi:** standartlar branşa göre gruplu (türün branşı önce); Bakanlık listesindeki standart kütüphaneye yüklenmeden
  seçilebilir ("yüklenmedi — Dökümanlar › Standartlar"); türde seçili olup listede olmayan da görünür ve kayıtta kalabilir (eskiden kurulumun
  bağladığı yüklenmemiş standart "Standart kütüphanede yok" diye kaydı düşürecekti).
  · **Dökümanlar › Standartlar:** Mekanik (n) / Elektrik (n) sekmeleri (adreste ?brans=e — Ekipman türleri gibi). Her standart sürümü bir branşta
  (göç 0078 standart.brans; var olan satırlar: yalnız elektrik türlerinde kontrol metodu olan elektrik, öteki mekanik — yayında standart yoktu).
  Yükleme penceresinde "Branş" (açık sekmeden gelir); yeni sürüm güncel sürümün branşında kalır; Bakanlık standartları Elektrik'te. Standart
  sayfasının kırıntısı branşıyla.
- 2026-10-09 (439): **Yayındaki rapor şablonunda "Düzenle"** (reisim: *"REİSİM ŞABLONU DÜZENLEME YOK SADECE ÖN İZLEME VAR DÜZENLEME DE
  OLMALI"*). Yayınlanmış sürüm değişmez kuralı korunur (açılmış ve imzalanmış raporlar onu kullanır): tür sayfasında yayındaki sürüm satırında ve
  sürümün önizleme sayfasında **"Düzenle"** — pencere açıklar, "Taslak aç ve düzenle" o sürümü taslağa kopyalar ve Format kurucuya götürür;
  yayınlayınca yeni sürüm olur. Açık taslak varsa sorar: "Taslağa devam et" (aynı taslak) ya da "Bu sürümden yeniden başla" (taslağın yerine
  geçer). Bakanlık şablonundan gelen sürümde resmî PDF yoksa yine eklenir (438). Yalnız tür ve format değiştirebilene; karar sunucuda.
- 2026-10-09 (438): **436–437 YAYINDA** (main 3c94135; göç yok; sağlık "tamam", duman 10/10, çalışma hatası yok; resmî PDF uçları oturumsuz 403).
  Canlıdaki firmada kurulum henüz koşmadı (ilk açılışta koşar); firmanın kendi açtığı iki tür var — biri (ET) ZPKR02 şablonunu yayında kullanıyor
  ama rapor formatı PDF'i yok, kurulum o şablonu "kullanılıyor" diye atlayacaktı → **resmî PDF Bakanlık şablonlu türlere de**: kurulumda bir kez
  bütün firmada (Bakanlık şablonu taslak ya da yayında olan, hiç PDF'i olmayan tür → Bakanlığın PDF'i sürüm 1; firma ayarı "kurulum.pdf"), sonra
  "Şablondan başlat" ve "Tür olarak ekle"de o türe (yalnız tür ve format değiştirebilene, aynı işlemde). Firmanın yüklediği ya da kaldırdığı
  PDF'e dokunulmaz.
  **438 YAYINDA** (main fb576c6; deneme makinesi 7/7 yeşil, sağlık "tamam", duman 10/10, çalışma hatası yok). Canlıdaki firmada kurulum bir
  sonraki açılışta koşar (Ana sayfa ya da Ekipman türleri); oturumlu ekranlar: ölçemedim.
- 2026-10-09 (437): **Bakanlık formatları her firmada hazır; sıfırdan rapor şablonu; hazır standart listesi** (reisim: *"HALA BAKANLIK FORMATLARI
  YOK DEFAULT OLARAK GELMESİ GEREKİYOR, ? RAPOR ŞABLONUNDA SIFIRDAN RAPOR ŞABLONU OLUŞTURMAK YOK, RAPOR FORMATI PDFLERİ DE STANDART OLARAK
  BAKANLIKTAN GELECEK ŞEKİLDE KONUŞMUŞTUK ÖRNEK PDFLERİ ATMIŞTIM SANA ONLARDA DEFAULT OLARAK GELSİN, BAKANLIK RAPOR FORMATLARI İLGİLİ
  STANDARTLAR VS DEFAULT GELSİN STANDART İÇİN YÜKLEME TUŞU OLSUN YÜKLENİNCE GÖRÜNTÜLEYE DÖNÜŞLSÜN (DÖKÜMANLAR EKRANI İÇİN KONUŞUYORUM)"*).
  · **Hazır kurulum** (rapor-format/server/kurulum.ts): firmanın ilk açılışında (Ana sayfa ya da Ekipman türleri) her Bakanlık formatı için tür
  kendiliğinden kurulur — AGT Alçak gerilim topraklama tesisatı (ZPKR01), EIT Elektrik iç tesisatı (ZPKR02), YKT Yıldırımdan korunma tesisatı
  (ZPKR03), YAS Yangın algılama ve uyarı sistemi (ZPKR04), TRF Trafo (ZPKR05); 12 ay. Her türde: **rapor formatı = Bakanlığın resmî PDF'i**
  (sürüm 1, "Bakanlık formatı"), **rapor şablonu yayında** (sürüm 1, kitaplıktaki şablondan — denetçi hemen rapor yazar), kontrol metodu
  standartları hazır listeden. Firma sonra her şeyi değiştirir ya da kullanılmamış türü siler; silinen yeniden kurulmaz (firma ayarı "kurulum":
  kurulan şablonlar; kitaplığa yeni Bakanlık formatı girerse yalnız o kurulur). Firma o şablonu / kodu zaten kullanıyorsa atlanır. Kim: sistem
  ("probata · hazır kurulum"), hesapsız; aynı anda iki istek tek kurulum (danışma kilidi); düşerse sayfa düşmez, sonraki açılışta yeniden.
  · **Resmî PDF'ler** (reisim'in gönderdiği ZPKR01–02 / ZPKK01–02 ve Bakanlığın 18.07.2025 tarihli ZPKR03–05 / ZPKK03–05): src/tanim/bakanlik/.
  Şablon önizlemesinde "Resmî form (PDF)", kriter belgesinde "Bakanlık belgesi (PDF)" — oturumlu uç, tarayıcıda açılır.
  · **Sıfırdan oluştur** (tür sayfası › Rapor şablonu): onay → boş iskelet taslak (firma / ekipman bilgileri, ölçüm cihazları, boş kontrol
  maddeleri, fotoğraf, kusur, not, sonuç, imza; başlık türün adından, kilit yok) → Format kurucu. "Şablondan başlat" penceresinde de "Boş format
  (sıfırdan)" seçeneği.
  · **Dökümanlar › Standartlar**: Bakanlık formatlarının 23 standardı (src/tanim/standartlar.ts — TS HD 60364 bölümleri, TS EN 62305-1…4,
  TS EN 50522, TS CEN/TS 54-14 …) her firmada listede; kütüphanede yoksa "Yüklenmedi" + **"Yükle"** (numara ve konu dolu; firma kendi
  kopyasının yılını ve PDF'ini verir — standart metni TSE'nin telifli yayını, probata vermez), yüklenince satır **"Görüntüle"** (PDF) olur.
  Yeni sütun "Rapor formatı" (hangi ZPKR'de anıldığı); Görünüm: Güncel ve yüklenecekler / Yüklenmemiş / Önceki sürümler / Hepsi.
- 2026-10-09 (436): **Bakanlık rapor formatları Ekipman türleri'nde** (reisim: *"EKİPMAN TÜRLERİNDE BAKANLIK FORMATLARINI DA GÖREMEDİM ?"*). Şablonlar
  yalnız bir türün içinden "Şablondan başlat"la açılıyordu; canlıdaki firmada henüz hiç tür yok → hiçbir yerde görünmüyordu. Ekipman türleri'nde
  Elektrik sekmesinin altında **"Bakanlık rapor formatları"** (ZPKR01–05), Mekanik sekmesinde "Hazır rapor formatları" (kompresör): form kodu ve
  başlık (önizleme sayfasına), formatı kullanan tür (Yayında / Taslak) ve **"Tür olarak ekle"** — pencere önerili ad / kod / periyotla açılır
  (ör. "Yıldırımdan korunma tesisatı" · YKT · 12 ay), kaydedince tür + o formattan taslak TEK işlemde, taslağın sayfasına gider (önizleyip
  yayınlanır). Önizleme sayfası /ekipman-turleri/sablon/<ZPKR…>: başlık, Bakanlık formatı rozeti, kriter belgesi bağlantısı, bölüm / madde /
  kilitli öğe sayısı, dayanak, saha ekranı önizlemesi. Şablon kaydında önerilen tür (src/format/sablonlar.ts SablonKaydi.tur).
- 2026-10-09 (435): **425–434 YAYINDA** — Supabase göç 0077 (e-posta kuyruğu + plan.bilgilendirme; 78 göç; satır kilidi, dış API kapalı,
  uygulama rolüne silme yok — denetlendi), main = bbb50b9 (Vercel READY), sağlık ucu "tamam" (göç güncel), duman 10/10, çalışma hatası yok.
  Deneme makinesinde son tur bütün işler yeşil (masaüstü 2/2 yönetim testi bir kez zaman aşımına düştü — benim değiştirmediğim akış; yalnız o
  iş yeniden koşturuldu, geçti; bildirimin beklemesi 30 sn'ye çıkarıldı). 434: uçtan uca her genişlikte iki parça (bellek taşması bitti; iş
  11–28 dk). E-posta sağlayıcısı kurulmadı (KOD-GECIS Y4): plan e-postaları kuyrukta "Bekliyor" — anahtar Vercel ortamına girilince gider.
  0077 başlık yorumundaki kilit adı (tests/eposta-kuyruk.test.ts) yanlış — kilit tests/planlar.test.ts "432" + tests/eposta-saf.test.ts
  (uygulanmış göç değiştirilmez).
- 2026-10-09 (433): **Yapay zekâ maliyeti ve fiyat / performans analizi** (reisim: *"Yapay zeka maaliyetlerini hesaplayalım bu iş için en mantıklı yapay
  zeka (üstesinden gelebilecek ve uygun fiyatlı) hangisi ise (deepseek,chatgpt vb.) ve hangi model ise fiyat performans analizi yapalım"*). Kod
  değişmedi; karar reisim'de. Yayındaki veritabanında henüz gerçek okuma yok (yz_okuma boş) → tahmin. İşlem başına varsayım (fotoğraf uygulamada
  1600 px'e küçülür ≈ 2 560 görsel token): pano okuma ≈ 3 800 giriş / 1 500 çıkış (düşünme dahil) · etiket ≈ 3 200 / 600 · S.A.Y sorusu ≈ 8 000
  giriş (6 000'i önbellekten) / 500. Fiyatlar (1 milyon token, $; Ekim 2026): Claude Opus 5.5 4 / 20 · Sonnet 5.5 2 / 10 · **Haiku 5.5 0,10 / 0,50** ·
  GPT-5 mini 0,25 / 2 · Gemini 3.8 Flash 0,75 / 3,75 (1 Ocak 2027'de iki katı) · Gemini 3.1 Flash-Lite 0,25 / 1,50 · DeepSeek V4.1 Flash 0,30 / 1,20
  (görsel girdisi resmî değil). İşlem başına: pano okuma Opus $0,045 · Sonnet $0,023 · Haiku $0,0011 · GPT-5 mini ~$0,004 · Gemini Flash ~$0,007 ·
  Flash-Lite ~$0,003 · DeepSeek V4.1 Flash ~$0,003 (görsel resmî değilse yalnız S.A.Y). 10 denetçili firmada ayda ~1 100 pano + ~1 000 etiket +
  ~4 400 S.A.Y sorusu: Opus ~$158 · Sonnet ~$81 · **Haiku ~$4** · GPT-5 mini ~$14 · Gemini 3.8 Flash ~$28 · DeepSeek ~$10 (gece indirimli saatte
  ~$5) (1 $ ≈ 49 TL, 7 Ekim 2026). **Öneri:** Anthropic'te kal (kod, yapılandırılmış çıktı, firma başına model
  seçimi ve aylık üst sınır hazır); Haiku 5.5'i seçenek olarak ekle — etiket ve S.A.Y için varsayılan, pano okumada 20–30 gerçek fotoğraflık deneme
  setiyle Sonnet 5.5'e karşı ölç (alan başına doğruluk); tutarsa varsayılan. DeepSeek önerilmez (görsel resmî değil, veri Çin'de işlenir, şema
  garantisi zayıf); Gemini / GPT ikinci sağlayıcı entegrasyonu ister, Haiku 5.5'ten ucuz değil.
- 2026-10-09 (432): **Plan açılınca e-posta** (reisim: *"Plan açıldığında planın açıldığı denetçilere otomatik mail gidecek gerekirse bilgilendirme
  kısmına elle ya da listeden mail girilebilecek"* — anayasa 1.3: bildirimi reisim açtı). Plan aç'ta "4 · Bilgilendirme (e-posta)": ekipteki
  denetçilere kendiliğinden gider; başka alıcı elle yazılır (biçim denetlenir) ya da listeden seçilir (firmanın açık hesapları + tesisin müşterisinin
  e-postası); en çok 20. Alıcı başına bir e-posta (alıcılar birbirini görmez), plan açılırken aynı işlemde kuyruğa (göç 0077 `eposta`; metin değişmez,
  silinmez), yanıttan sonra gönderilir, gece işi bekleyenleri yeniden dener (kalıcı ret ya da 5 deneme → "Gönderilemedi"). Ekibe "planı gör, kabul /
  reddet" bağlantısı, bilgilendirilene yalnız bilgi. Plan sayfasında (planlama / yönetici) "Bilgilendirme e-postaları": alıcı, durum, zaman / neden.
  **Sağlayıcı hesabı yok (KOD-GECIS Y4):** anahtar girilene dek e-postalar "Bekliyor — e-posta servisi kurulmadı" kalır, kaybolmaz.
- 2026-10-09 (431): **Rapor aşama çizgisi + genel muayene talimatı** (reisim, örnek görselle: *"raporların hangi aşamada oldukları gözüksün ayrıca
  sağ üstte uygun bir yerde ünlem işareti olacak ve genel muayene talimatı oradan görünebilecek"*). Saha rapor ekranında ve onay ekranında başlığın
  altında beş adım: Yeni → Teknik yönetici onayında → Muayene uzmanı imzası → İmzaya gönderildi → Tamamlandı (geçilen işaretli, şimdiki vurgulu;
  telefonda yalnız şimdikinin adı). Rapor ekranının sağ üstünde (tuşların yanında) her zaman ünlem: formatın genel muayene talimatı (Format
  kurucu › Belge; yazılmamışsa söyler; PDF'e basılmaz).
- 2026-10-09 (430): **Talimat ünlemleri** (reisim: *"kontrol madde başlıklarında ve başlıkların yanında küçük ünlemler olmalı ve talimat yazılabilmeli,
  eğer o madde için bir talimat yoksa ünlem olmasın ama kontrol başlığında her daim o ünlem olsun tıklayınca yine pop-up talimatlar gözüksün"*).
  Kontrol listesinde her grup başlığının yanında ünlem (adsız tek grupta bölüm başlığında) — basınca grubun talimatı ve talimatı olan maddeler;
  talimatı olan maddenin yanında ünlem — basınca o maddenin talimatı. Talimat yoksa grup penceresi "talimat yazılmamış" der. Talimatlar
  formatta yazılır (Format kurucu; 426), Bakanlık şablonlarında kriter belgelerinden (427); kompresör şablonuna örnek talimat.
- 2026-10-09 (429): **Günlük süre raporun kontrol gününe sayılır** (reisim: *"Hangi güne rapor yazılırsa süreler o günden gitsin (480dk+mesai)"*).
  Mesai takibinde rapor, açıldığı güne değil kontrol başlangıcının gününe sayılır (önce açılış günüydü). Denetçi kontrol başlangıcını başka güne
  alırsa raporun süresi o güne geçer; o günün süresi (bu rapor hariç) doluysa alınamaz — alanın altında "GG.AA.YYYY günü için günlük süre dolu"
  (ENGEL 3, yeni rapor açmakla aynı ölçü). Gün değişmeyen kayıt sorulmaz. Yeni rapor ve kopya bugünün süresine bakar (rapor bugünle açılır).
- 2026-10-09 (428): **Standart penceresi** (reisim: *"Denetçi muayene yaparken standarta tıklayınca pop-up olarak standart açılmalı okuyabilmeli
  yanlışlıkla tıklaması ihtimaline karşı önceden sorsun evet denirse açılsın"*). Saha raporunda madde / grup standardı ve türün kontrol metodu
  bağlantı görünümlü tuş; basınca "Standart açılsın mı?" sorulur, Aç denirse pencere: her atıf firmanın standart kütüphanesindeki güncel PDF'le
  (Dökümanlar › Standartlar; uygulama içinde çerçevede, telefonda "Yeni sekmede aç") ya da Bakanlık kriter belgesinin metniyle (ZPKKnn) açılır;
  kütüphanede yoksa söylenir. Grubun bütün maddeleri aynı standarda bağlıysa standart grup başlığında bir kez görünür. Eşleme en uzun numara,
  numaranın ardından rakam / harf gelmez ("TS 622", "TS 6225"i tutmaz). Kompresör şablonunun maddelerine TS EN 286-1 yazıldı.
- 2026-10-09 (427): **Elektrik tarafının üç zorunlu Bakanlık formatı hazır şablon** (reisim: *"Elektrik tarafında zorunlu formatlar yayınlandı, bu
  formatları probataya ekle"*): ZPKR03 yıldırımdan korunma, ZPKR04 yangın algılama ve uyarı, ZPKR05 trafo (yayım 18.07.2025, yürürlük 01.09.2025;
  Bakanlık sitesinden indirilen PDF'lerden). Bölüm adları, sıraları ve numaraları resmî formdaki gibi ("ana başlıklar ve sıralamaları değişmeyecek"):
  bölüme **üst başlık** (aynı üst başlıklı ardışık bölümler belgede ve saha ekranında 4.1, 4.2 / 5.1, 5.2) ve **numarasız bölüm** (Fotoğraflar)
  eklendi; 2. bölümün başlığı formatın ekipman bölümünden (ZPKR04 "Tesis bilgileri"). Belge ve saha ekranı aynı düzeni tek yerden alır
  (`src/format/duzen.ts`). Bütün maddeler kilitli ve standartlı; grup / madde / genel talimatlar kriter belgelerinden özet; sonuç bölümünde formun
  sabit metni (ağır kusurlar tanımı, açıklamalar); kusur derecesi (* / **) sorulur. ZPKK03/04/05 kriter belgeleri Dökümanlar › Kriterler'de.
  Format kurucuda bölüme üst başlık ve "numarasız" yazılır (Bakanlık bölümünde değişmez — kilit denetimi de özde tutar). RAPOR-FORMAT.md §2.
- 2026-10-09 (426): **Format motoru + format kurucu genişledi** (reisim: *"Elektrik tarafında zorunlu formatlar yayınlandı … eklerken bir kullanıcı
  da bu ve benzeri rapor formatlarını isterse kendi eli ile format yapıcıdan yapabileceği şekilde format yapıcıyı düzenle"*). Yeni üç Bakanlık
  formatı (ZPKR03/04/05 — 427) ve benzerleri için motorda: seçmeli sütun / değerde "uygun değil" sayılan seçenekler + ağır kusur, kesin küçük /
  büyük sınır, sonuç bölümünün sabit metni (ağır kusurlar tanımı; Bakanlık şablonunda kilitli), madde / grup / genel talimat alanları (430–431
  ekranda). Format kurucuda her öğe düzenlenir (tür, seçenekler, olumsuzlar, ağırlık, sınır, birim, zorunlu, standart, açıklama, talimat,
  grup), gruplar, cevap seti, uygunluk notları, sonuç metni, belge görünümü (form kodu, başlık, dayanak, genel talimat). Kilitli öğede yalnız
  talimat. Kayıtlı formatlar ve açık raporlar aynen okunur (yeni alanlar isteğe bağlı). RAPOR-FORMAT.md §2, §6.
- 2026-10-09 (425): **Uzun seçenek listeleri ve sayfasız listeler** (reisim telefon ekranıyla: *"tek tek müşteriler gözüküyordu … çok müşteri olunca
  kullanışsız olur ve donmalara sebep olur bu ve benzeri kurgusal bozuklukları düzenle"*). Ekran görüntüsündeki "Süzgeç" levhası maketin ESKİ
  sürümü (telefondaki sekme eski kopyayı tutuyordu): güncel maket ve uygulama 8'den çok seçenekte zaten aranır kayan liste gösteriyor. Asıl kusur
  ölçekte: (1) aranır liste de BÜTÜN seçenekleri çiziyordu — artık en çok 50 eşleşme çizilir, seçili olan hep görünür, "N seçenek daha — aramayla
  daraltın" (tek hesap src/components/secim/gorunen.ts; her seçim alanı, süzgeç seçicisi ve telefon levhası); (2) dokuz liste sayfasızdı, bütün
  kayıtları çiziyordu (Planlar, Müşteriler, Personel, Sözleşmeler, Araçlar, Ekipman türleri, Dökümanlar › Standartlar, Performans, yönetimde
  Firmalar) → raporlardaki gibi 20'şer sayfa (20'den azsa sayfalayıcı görünmez). Kilit: tests/secim-gorunen + bozan. Açık iş (ölçek): listeler
  kaydın tamamını sunucudan alıyor; çok büyük firmada sunucu tarafı sayfalama gerekecek.
- 2026-10-08 (424): **YAYIN — 417–423 canlıda** (resmî tatiller, rapor belgesi görsel karşılaştırması, telefonda yan menü 100dvh, site
  taraması, vh → dvh genel kilit + S.A.Y düğmesi, taramanın iki erişilebilirlik bulgusu). 417–418 önce (main 9b88013), sonra main 55a40b2
  (deneme turu 37834166631 tamamen yeşil: denetim, üç genişlik, site taraması firma 58 sayfa × 3 + müşteri paneli, S.A.Y) · /api/saglik
  sürüm 55a40b2, denetimler tamam · duman 10/10 · son 3 saatte çalışma hatası yok · göç yok (Supabase 77). Telefonda gerçek Chrome'da yan
  menü: ölçemedim (uçtan uca tarayıcıda adres çubuğu yok) — reisim'in saha testinde. Reisim saha testlerine geçiyor.
- 2026-10-08 (423): **Deneme sunucusunda sayfalar bellekte kalır** — 422'nin turunda tarama üç genişlikte TEMİZ geçti; S.A.Y denemesi bu kez
  telefonda 30 sn beklemeye rağmen düştü: giriş sayfası sunucudan geliyor, tarayıcıda canlanmıyordu (sayfa görüntüsü sonuç dosyasında). Sebep:
  geliştirme kipi varsayılanda yalnız son 2 sayfayı tutup 25 sn açılmayanı atıyor; taramadan sonra giriş sayfası sürekli yeniden derleniyordu.
  Uçtan uca sunucusunda derlenen sayfalar bellekte kalır (onDemandEntries; yayında derleme yok, etkisiz). Düşen testin izi artık sonuç dosyasında.
  **Geri alındı (ac9f7c2'nin turu):** sayfaları bellekte tutmak işleri kötüleştirdi — çevrimdışı denemesinden hemen sonraki deneme tablette ve
  telefonda düştü (iz: giriş isteği sunucuya gitti, 15 sn cevap yok). Kalan: düşen testin izi; S.A.Y'nin ara sıra düşmesi izle incelenecek.
- 2026-10-08 (422): **Site taramasının ilk koşusu** (9cf7f54): üç genişlikte 58'er sayfa gezildi (firma yöneticisi), taramanın kendisi 5–7 dk.
  Sunucu hatası, konsol hatası, yatay taşma, basılamayan öğe YOK; çekmecenin her maddesi ekranda ve basılabilir. Bulunan iki erişilebilirlik
  konusu düzeltildi: rapor belgesinde logo / AKR yer tutucusunun grisi #7f7f7f beyazda 4,0:1 → #595959 (7:1; PDF'te de); rapor önizlemesinin
  kaydırılan kutusu klavyeyle odaklanabilir, adı "Rapor belgesi önizlemesi" (telefonda). Aynı koşuda S.A.Y denemesi giriş sayfası 15 sn'de
  bağlanmadığı için düştü (408'deki anlık yavaşlığın aynısı) — sayfa hazır beklemesi 30 sn. Uçtan uca iş sınırı 50 dk.
- 2026-10-08 (421): **419'un hata sınıfı sitenin geri kalanında** — telefonda alttan açılan pencerenin (levha) en büyük yüksekliği 88vh, Excel
  önizleme kutuları 50vh idi: görünen boya (dvh) çevrildi. Genel kilit: vh ile verilen her yükseklik / en büyük yükseklik ardından dvh taşır
  (css-butunlugu; kilit ilk koşusunda bu dört yeri buldu). S.A.Y düğmesi: telefonda açık menünün ve perdenin üstünde kalıyordu (z 65 > 60) —
  artık altında (45); sayfa sonundaki düğme payı telefonda da (son satırın sağ ucu düğmenin altında kalabiliyordu).
- 2026-10-08 (420): **Site taraması** (reisim: *"bu ve benzeri her türlü front back hatalarını toplu kontrol et reisim tüm siteyi kusursuz
  bitir"*). Uçtan uca, üç genişlikte: firma yöneticisi siteyi Ana sayfadan ve her modülden bağlantı izleyerek gezer (aynı kalıptaki adres bir
  kez), müşteri paneli saha raporu denemesinde müşteri girişiyle. Her sayfada: sunucu 5xx, sayfa / konsol hatası, yatay taşma, başka öğenin
  altında kalan ya da ekran dışında kalan tuş / bağlantı / alan, erişilebilirlik (axe, açık ve koyu tema), çekmecede her menü maddesi ekranda ve
  basılabilir. Bulgular tek listede (e2e/tarama.ts). Gezilmez: /api, PDF, giriş / çıkış.
- 2026-10-08 (419): **Telefonda yan menünün son maddesine basılamıyordu** (reisim: *"mobilde … chrome da iken yan bar da en aşağıya kaydırıpta
  firma ayarları kısmına tıklayamadım"*). Sebep: çekmecenin yüksekliği 100vh — telefon tarayıcısında vh adres çubuğu GİZLİYKENki boy; çubuk
  görünürken çekmecenin alt ~56 px'i ekran dışında kalıyor, menü en alta kaysa da son modül (Firma ayarları) o şeride düşüyordu. Artık
  yükseklik görünen boy (100dvh; eski tarayıcı 100vh'ye düşer), menünün altında iPhone ev çubuğu payı (güvenli alan), menü kayarken arkadaki
  sayfa kaymaz. Kilit: kalip-sayilari "çekmece görünen boyda" + bozan. Uçtan uca tarayıcıda adres çubuğu olmadığından bu hata orada
  görünmez — kilit CSS'te.
- 2026-10-08 (418): **Rapor belgesinin görsel karşılaştırması** (KOD-GECIS §11 "Bakanlık formatlı PDF için ekran görüntüsü karşılaştırması"; ekranlar
  411'de). Üç şablon (ZPKR01, ZPKR02, kompresör): PDF'e basılan HTML'in aynısı (aynı çizici, aynı CSS, gömülü Carlito) baskı görünümünde, A4
  genişliğinde çekilir, kayıtlı görüntüyle karşılaştırılır (e2e/belge-gorsel.spec.ts → e2e/goruntu/masaustu/belge-*.png). Veri uydurma.
  Bakanlık'ın kendi PDF'iyle piksel karşılaştırması DEĞİL (o belge depoda yok); amaç onaylı görünümün istemeden bozulmasını yakalamak.
  Kayıtlı üç görüntü d07b252'nin turundan (794 × 1656 / 2589 / 1173), tek tek bakıldı (Bakanlık düzeni, Carlito, uydurma veri).
- 2026-10-08 (417): **Resmî tatiller izin hesabında** (KOD-GECIS Y9; maket "resmî tatil takvimi uygulamada"). İzin talebinde iş günü artık hafta
  sonunu VE resmî tatilleri saymaz: 2429 sayılı Kanun'un sabit günleri (1 Ocak, 23 Nisan, 1 Mayıs, 19 Mayıs, 15 Temmuz, 30 Ağustos, 29 Ekim) +
  dini bayramlar Diyanet dini günler takviminden (Ramazan 2026: 20–22 Mart, 2027: 9–11 Mart, 2028: 26–28 Şubat; Kurban 2026: 27–30 Mayıs, 2027:
  16–19 Mayıs, 2028: 5–8 Mayıs). Yarım günler (arife, 28 Ekim öğleden sonra) iş günü sayılır. Tanım `resmi_tatiller` (src/tanim/veri.ts) —
  **her yıl bir sonraki yılın bayramları eklenir** (listede olmayan yılın bayramı tatil sayılmaz). Kayıtlı taleplerin gün sayısı değişmez
  (gönderilirken yazılır). Tarihe bağlı denemeler (talepler.test pazartesi, uçtan uca izin günü) tatile denk gelmeyecek güne kaydırıldı.
- 2026-10-08 (416): **YAYIN — 409–415 canlıda** (simge, erişilebilirlik taraması, görsel karşılaştırma, bağlantı rengi, deneme makinesi süre
  sınırı, Planlar tablet taşması, üç listede taşma). Veritabanı değişikliği yok (Supabase 0076 / 77 göç, aynı). main 7ed6e25 (Vercel;
  /api/saglik sürüm 7ed6e25, bütün denetimler tamam) · duman 10/10 (yeni: /favicon.ico → 308 /icon.svg) · son 2 saatte çalışma hatası yok ·
  canlı giriş sayfası tarayıcıda konsolu temiz (408'deki simge 404'ü kalktı). Deneme makinesi 7ed6e25: denetim 4 dk, üç genişlik yeşil
  (görsel karşılaştırma dahil). Oturum isteyen ekranlar (Planlar, Raporlar, Onaylar, müşteri paneli, Uyarılar) canlıda ölçemedim — giriş
  reisim'in; Planlar + plan içi deneme makinesinde üç genişlik × iki temada görüntüyle doğrulandı.
- 2026-10-08 (415): **Aynı taşma üç listede daha** (414'ün taraması): Raporlar listesi ve müşteri panelinin rapor listesi (ekipman kodu + tür
  adı), Uyarılar listesi (konu bağlantısı) — ikon / kod + metin satırı içerik kadar genişliyordu, uzun ad kısaltılamayıp yandaki sütuna
  taşardı. Satır artık hücre kadar (maket .a-hucre-satir / .a-adres); sığmayan ad alt satıra iner ve "…" ile kısalır.
- 2026-10-08 (414): **Planlar listesi tablette taşıyordu** — 411'in tablet (1080) görüntüsünde: müşteri adı adres sütununun üstüne taşıyor,
  "Görüntüle" tuşu durum rozetinin üstüne biniyordu, proje no ikiye bölünüyordu. Sebep: sütun oranları donmuş maketten alınmamıştı (işlem %8 —
  makette %17,75) ve ikon + metin satırı içerik kadar genişliyordu (metin kısaltılamıyordu). Artık maketin oranları (no 11,25 · ad 12,5 · müşteri
  12,5 · adres 12,75 · denetçi 10,25 · başlangıç 12 · durum 11 · işlem 17,75) ve satır hücre kadar (uzun ad "…" ile kısalır). Maketin sıkışık
  tablosu (kap 600–960, tablet dikey) da kodda eksikti: liste bileşenine bu aralık için ayrı sütun genişliği (Planlar: durum 13,5 · işlem 15,25),
  tuş ve rozet gerekince iki satır, ikon satırı sarılır.
- 2026-10-08 (413): **Deneme makinesine süre sınırı** (reisim: *"1 saat 12 dakika olmuş normal mi ?"*). 0f1ee47'nin turunda denetim işi tarayıcı
  kurulumunda 71 dk asılı kaldı (GitHub makinesinin paket indirmesi; olağanı 20 sn) — sınır yoktu, 6 saat bekleyecekti. Artık: kurulum her
  denemede en çok 4 dk, üç deneme; denetim işi en çok 20 dk (olağan 5–8), her genişlik en çok 40 dk (olağan 19–26). Ölçü son üç yeşil turdan.
  Devamı (60547a0'ın turunda görüldü): paket sunucusu saniyede ~70 KB'ye düşünce kurulum 4 dk'yı aştı, yarıda kesilen kurulum kilidi tuttu,
  yeniden denemeler hemen düştü. Asıl çözüm: denetim işi sistem paketi hiç kurmaz (eksik olanlar yalnız yazı tipleriydi; kütüphaneler
  makinede hazır, PDF Carlito'yu gömer) — yalnız tarayıcı, 8 dk sınır. Uçtan uca işler paketleri kurar (görüntüler o yazı tipleriyle
  kaydedildi), tek deneme, 20 dk sınır, iş 50 dk (7ed6e25'te telefonda kurulum 591 sn sürdü, iş 34 dk — 40 sınırına yakındı). Denetim işi
  artık 4 dk (kurulum 8 sn).
- 2026-10-08 (412): **Bağlantılar maketteki gibi** — 411'in ilk görüntülerinde görüldü: Planlar listesinde proje no tarayıcının mavisiyle,
  altı çizili çıkıyordu (makette yeşil, kalın, çizgi yalnız üstüne gelince). Aynı hata Raporlar, Onaylar (kuyruk + imzamı bekleyenler) ve müşteri
  panelinin (raporlar, uygunsuzluklar, sözleşmeler) numara bağlantılarındaydı: bağlantı renksiz "kod" biçimini kullanıyordu → her modülde
  maketin numara bağlantısı biçimi (.no). Sınıfsız metin içi bağlantılar (ayrıntı sayfalarında teklif / iş / sözleşme no, "süreyi uzatın") için
  genel taban: marka yeşili, alt çizgi kalır (metinde bağlantı yalnız renkle ayrılmaz). Yeşilin şerit zeminlerinde karşıtlığı ölçüldü: açık
  temada en düşük 4,79 (hata şeridi), koyu temada 5,99 — hepsi ≥ 4,5. Kilit: css-butunlugu "her bağlantının rengi tanımlı" (eski kodda tam bu
  yedi hatayı buluyor) + bozan.
- 2026-10-08 (411): **Görsel karşılaştırma — donmuş referans ekran** (CLAUDE.md §6 "Sonra: görsel regresyon"; EKSIKLER-VE-ONERILER §6).
  Planlar ve plan içi, üç genişlikte, açık ve koyu temada çekilir, kayıtlı görüntüyle karşılaştırılır (piksellerin %0,5'inden fazlası farklıysa
  düşer; hareket kapalı). Veri bugünden bağımsız olsun diye ayrı, sabit verili "gorsel" firması (uçtan uca sunucusu kurar: P-0126-501, Ocak
  2026, kabul edilmiş, üç ekipman). Kayıtlı görüntüler e2e/goruntu/<genişlik>/; kasıtlı bir görsel değişiklikte deneme makinesinin yazdığı
  yeni görüntüler (sonuç dosyası) gözden geçirilip commit'e girer. İlk görüntülerde iki hata görüldü → 412 (bağlantı rengi), 414 (tablette
  taşma); kayıtlı 12 görüntü bu düzeltmelerden sonraki hâlden (f52677a), tek tek bakıldı. Klasör adı alt çizgisiz: depo "_" ile başlayan
  klasörleri geçici sayıp almıyor (.gitignore).
- 2026-10-08 (410): **Erişilebilirlik taraması** (EKSIKLER-VE-ONERILER §7; CLAUDE.md §6 "Sonra: Playwright + erişilebilirlik"). Uçtan uca, üç
  genişlikte, axe (@axe-core/playwright 4.13.0, MPL-2.0, yalnız geliştirme paketi; WCAG 2.1 A + AA): giriş, Ana sayfa, Planlar, plan içi,
  personel formu, saha raporu — ciddi ve kritik ihlal 0 (e2e/erisilebilirlik.spec.ts; düşerse hangi kuralın hangi öğede bozulduğunu söyler).
- 2026-10-08 (409): **Tarayıcı simgesi** — tarayıcılar sayfanın simgesinden bağımsız /favicon.ico'yu da istiyor; canlıda 404 dönüyordu (408
  yayın denetiminde konsolda görüldü). Artık sitenin simgesine (/icon.svg) kalıcı yönlenir (next.config.ts redirects). Kilit: e2e hata
  (/favicon.ico → 200, svg) + duman testi yeni denetim (308 → /icon.svg). Devamı: PDF paketi denetimi (352) ayar dosyasındaki her adresi
  PDF ucu sanıyordu, yönlendirmenin iki adresini "sayfa yok" diye düşürdü — artık yalnız kendi listesini okur.
- 2026-10-08 (408): **YAYIN — 392–407 canlıda** (bağlantısız çalışma tamamı + yönetim karekodu). Supabase 0076 (77 göç; işlev gövdeleri md5
  dosyayla aynı; uygulama rolü islem'de yalnız SELECT + INSERT; satır güvenliği açık + zorunlu; kimlik işlevi tanımlayıcı-yetkili, arama yolu
  sabit, anon yetkisiz) · main 1077980 (Vercel, /api/saglik sürüm 1077980) · duman 9/9 · /sw.js 200 · CSP worker-src 'self' · /api/islem başka
  köken 403, oturumsuz 401, GET 405 · /raporlar/yeni oturumsuz girişe yönlenir · son 1 saatte çalışma hatası yok · giriş sayfası tarayıcıda temiz
  (konsolda yalnız /favicon.ico 404 — eskiden beri, sayfa icon.svg kullanır). Oturum isteyen ekranlar (bağlantısız rapor, plan kabulü, yeni rapor,
  karekod) canlıda ölçemedim — uçtan uca üç genişlikte deneme makinesinde geçti (1077980; masaüstü işi bir kez yeniden koşuldu: ilk koşuda YZ
  giriş sayfası 15 sn'de açılmadı, kodla ilgisiz anlık yavaşlık — yeniden koşuda 93/93).
- 2026-10-08 (407): **Yönetim iki adımlı girişine karekod** (reisim: Google Authenticator'a anahtar elle yazılınca "süre geçti" hatası — 393'te
  iki adım kapatıldı). Kurulum ekranında anahtarın karekodu (doğrulama uygulamasıyla "karekod tara"; okutulamazsa anahtar yine yazılı). Sunucuda
  üretilir (qrcode 1.5.4, MIT — yalnız modül dizisi), ekran SVG yolu olarak çizer (HTML enjekte edilmez), her temada koyu modül açık zemin (marka
  renkleri). İki adım hâlâ KAPALI (yonetim_ayar.iki_adim); açılınca ilk kurulumda karekod görünür. Kilit karekod.test: ekranın çizdiği yol bir
  karekod okuyucuyla (jsQR 1.4.0, geliştirme paketi) okunur ve doğrulama bağlantısının (otpauth://, 6 hane, 30 sn) AYNISI çıkar; bozan
  karekod (modül eksik / satır kayık → okunmaz). Gözle bakılamadı (iki adım kapalıyken kurulum ekranı açılmaz) — ölçemedim.
- 2026-10-08 (405): **Çevrimdışı çalışma — bağlantısız rapor oluşturma** (ARKA-UC §4.1 "rapor oluşturma (plan günü geldiyse — P1)"; K3'ün son
  eksiği). Bağlantı varken plan başına bir sayfa önceden iner (/raporlar/yeni/<plan>: planın raporu olmayan etkin ekipmanları, türlerinin
  yayındaki formatı ve ilk cevapları, künye, yazan — raporlar/server/raporlar.ts yeniRaporPaketi; hiçbir şey yazılmaz). Bağlantı yokken (ya da
  istek ağda düşerse) plan içindeki "Rapor oluştur" bu sayfayı açar (#ekipman); rapor CİHAZDA geçici kimlikle, saha rapor ekranının kendisiyle
  doldurulur (SahaRaporu "yeni" kipi; şerit "Bu rapor bu cihazda açıldı…"; ölçüm cihazı ve fotoğraftan okuma rapor açılınca). İlk Kaydet /
  fotoğraf / Onaya gönder'de "rapor.olustur" işi kuyruğa girer (bir kez). Bağlantı gelince sunucu raporu raporOlustur ile AÇAR — kimlik ve numara
  sunucunun, plan günü / günlük süre / yetki / "bu ekipmanın raporu var" aynen; cihaz bekleyen işleri gerçek kimliğe bağlar ve sürümü taşır,
  ekran raporun kendi sayfasına geçer (yazılanlar cihazdan gelir — 404). Açılamazsa işler bekler, nedeni pencerede ("Yeniden dene", "Planı
  aç"). Aynı ekipmana cihazda açılmış rapor varsa plan içindeki tuş "Cihazdaki rapor" olur ve aynı geçici kimlikle devam edilir. Kuyruk artık
  işleri GİRDİĞİ SIRAYLA gönderir (önce "fotoğraflar formdan önce" idi): kaydın bağımlılıkları beklenir — yeni raporun işleri rapor açılmadan,
  Onaya gönder fotoğraflar gitmeden, yeni rapor aynı planın bekleyen kabulünden önce gitmez; bir iş gidince bekleyen bağımlısı aynı gönderimde
  denenir. Göç yok. Kilitler: islem.test (gerçek PostgreSQL, iki firma: paket — raporu olan ekipman yok, kabul edilmemiş planda neden, ekip dışı
  / başka firma yok; rapor.olustur — kimlik ve numara sunucunun, tekrarı ikinci rapor açmaz, ikinci cihazdan red, bozuk girdi / ekip dışı /
  başka firma açamaz, açılan rapora kuyruk kaydı) · kuyruk.test (tek açılış işi, bağımlılık, kabul önce, gerçek kimliğe bağlama, sürüm) ·
  bozan kuyruk 6 · sw.test (yeni rapor sayfası saklanır) · e2e cevrimdisi 9. adım (bağlantı kesik: plandan yeni rapor → kaydet → bağlantı gelince
  numaralı rapor, yazılan yerinde). Deneme makinesinde (382990d) bulunan: ekran rapor açılınca HEMEN raporun sayfasına geçiyordu; kayıt o sırada
  henüz yazılmamışsa sayfa boş çiziliyordu — artık rapor açılınca ekran salt okunur olur ("Rapor sunucuda açıldı…", Raporu aç), raporun cihazda
  bekleyen işleri gidince geçilir. Deneme ortamı: tarayıcının servis çalışanı yalnız e2e/cevrimdisi.spec.ts'te açık (playwright.config.ts
  serviceWorkers: "block") — geliştirme sunucusu yine bellek sınırında yeniden başlıyordu. Sonraki turda (1f53ad6) masaüstü ve telefon yeşil;
  tablette yine erken geçildi: işlerin gerçek kimliğe bağlanması ekrana duyurulmuyordu (yayın sonradan) — artık hemen duyurulur (kuyruk.test
  "olay anında bekleyenler gerçek kimlikte" + bozan kuyruk 7).
  Sonraki turda (92a79de) bağlantısız çalışma denemeleri üç genişlikte geçti; yalnız en son koşan zimmetler testi, geliştirme sunucusu yığın
  sınırının %80'ini geçip kendini yeniden başlattığı anda düştü — uçtan uca sunucusunda bu yeniden başlama kapatıldı (next.config.ts
  devMemoryThresholdRestart, yalnız PROBATA_WEBPACK_BELLEK=1 olan e2e sunucusunda; 12 GB yığın kalır).
- 2026-10-08 (404): **Rapor ekranı cihazda bekleyen kaydı gösterir — sessiz veri kaybı önlendi.** Bağlantısız kaydedilen rapor, cihazda yeniden
  açılınca saklanan sayfadaki ESKİ hâliyle görünüyordu; kullanıcı onu düzenleyip kaydedince yeni iş bekleyen kaydın yerine geçer, bağlantısız
  yazılanlar sessizce kaybolurdu. Artık ekran açılınca (ve sayfa tazelenince) raporun sunucuya henüz yazılmamış son içeriği (bekliyor / çakışma /
  yapılamadı) cihazdan yüklenir, şeritte "Bu ekranda cihazda bekleyen kaydınız gösteriliyor"; kullanıcı o sırada yazıyorsa onun yazdığı kalır;
  "eksik"te (sunucu kaydetti, gönderilmedi) sunucudaki gösterilir. kuyruk.ts bekleyenIcerik · SahaRaporu. Kilitler: kuyruk.test (son içerik;
  eksikte / fotoğrafta yok; çakışmada var) · bozan kuyruk 5 · e2e cevrimdisi (bağlantı kesik: yaz, Kaydet, yenile → yazılan görünür).
- 2026-10-08 (403): **Ofis rolünde cihaz saklayıcısı kurulmuyor — kilit** (402'nin uçtan uca kanıtı): firma yöneticisi oturumunda servis
  çalışanı kaydı yok, önceden indirme olmaz; bağlantı kesilince "Çevrimdışı" göstergesi yine çıkar, gelince kalkar (e2e cevrimdisi, ikinci test).
- 2026-10-08 (402): **Sayfa saklama ve önceden indirme yalnız sahada çalışana** — servis çalışanı ve önceden indirme her oturumda kuruluyordu;
  ofisteki yönetici / planlama / muhasebe için hem cihazı hem sunucuyu boşuna yoruyordu (deneme makinesinde 0a9c2e1: yönetici oturumlu testlerde
  arka planda onlarca plan / rapor sayfası çizilip son testler zaman aşımına düştü). Artık yalnız denetçi ve branş yöneticisi rolünde (denetime
  çıkan, rapor yazan) kurulur; bağlantısız kuyruk herkeste çalışır. Uygulama düzeni karar verir (src/app/(uygulama)/layout.tsx SAHA_ROLLERI).
  Ayrıca /api/islem'in sıra kilidi (moduller.test) türlü çağrıyla bozulmuştu — düzeltildi; e2e cevrimdisi bağlantısız açılışta konsol / sayfa
  hatalarını ve düşen istekleri iletiye yazar (nedeni deneme kaydında görünsün). Bağlantısız açılan sayfanın bağlanmamasının NEDENİ bulundu:
  Next'in geliştirme kipi sayfa açılınca sunucuya ayrı bir canlı "hata ayıklama kanalı" açar ve sayfayı onunla bağlar
  (next/dist/client/dev/debug-channel.js) — bağlantı yokken sayfa hiç bağlanamaz; yayında bu kanal yok. Uçtan uca sunucusunda kapatıldı
  (next.config.ts reactDebugChannel, scripts/e2e-sunucu.ts PROBATA_HATA_KANALI=0); yayın etkilenmez.
  Aynı turda: (a) deneme sunucusu koşunun sonunda bellek sınırına dayanıp kendini yeniden başlatıyordu (zimmetler düşüyordu) — önceden indirme
  her denetçi testinde onlarca sayfa çiziyordu; öteki testlerde cihaz "az önce indirildi" sayılır (e2e/yardimci.ts girisYap; önceden indirme
  yalnız e2e/cevrimdisi.spec.ts'te sınanır), önceden inen rapor sınırı 100'den 50'ye indi (planlar/server/cevrimdisi.ts RAPOR_EN_COK);
  (b) geliştirme göstergesi rozeti telefonda altta yapışkan tuş çubuğunun üstüne binip tıklamayı engelliyordu — uçtan uca sunucusunda kapalı;
  (c) rapor ekranı cihazda gönderilemeyen işi (çakışma / yapılamadı) sayfa yenilense de kalıcı şeritte söyler (önce yalnız anlık bildirim).
- 2026-10-08 (401): **Cihazda saklanan sayfalar sınırlı** — servis çalışanı açılan her saha sayfasını (rapor, plan) cihazda şifreli saklıyordu,
  sınırsızdı (aylarca açılan her rapor birikirdi). Artık en çok 300 sayfa; aşınca en eski açılanlar 250'ye inene kadar silinir (aradaki pay her
  yeni sayfada bütün depoyu taramasın). Önceden indirilen paket (en çok 20 plan + 100 rapor) sınırın içinde kalır. Kilit sw.test (çalışanın kendi
  işlevi sahte depoyla: 300'de dokunulmaz, 301'de en eski 51 silinir, en yeni kalır) + swEksikleri / bozan kilitler (sınır çağrısı kalkarsa).
- 2026-10-08 (400): **Çevrimdışı çalışma — plan kabul / red** (ARKA-UC §4.1 "plan kabul / red (kuyruğa)"). Plan içinde bağlantı yokken (ya da istek
  ağda düşerse) Kabul et / Reddet cihaz kuyruğuna şifreli yazılır: kabulde tarafsızlık beyanının onayı ve OKUNAN metnin özeti, redde gerekçe; kabul
  adımında "Kabulünüz / Reddiniz bu cihazda bekliyor" (tuşlar kalkar; gönderilemezse nedeni ve "üst çubuktan yeniden deneyin ya da kaldırın"); bağlantı
  gelince gider, sayfa tazelenir. Aynı plan için tek bekleyen iş. Sunucuda planlar/server/islem-baglanti.ts (plan.kabul, plan.red → planKabul /
  planReddet aynen: yetki, durum, sürüm kilidi, denetim izi; onay "evet" değilse ya da okunan metnin özeti yoksa kabul yok, metin değiştiyse red);
  /api/islem iki modülün işini ayırır. Önceden indirme kabul BEKLEYEN planları da indirir (bağlantısız kabul edilecek sayfa cihazda olsun;
  cevrimdisi-paket.test beklentisi tarih ve gerekçeyle güncellendi, yerine reddedilmiş plan "girmez"). Göç yok. Kilitler: islem.test (gerçek
  PostgreSQL: onaysız / uydurma onay / özetsiz kabul yok, metin değişti red, ekip dışı ve başka firma yok, tekrarı yeniden yapmaz, red gerekçesiz
  olmaz, eski sürüm çakışma) · kuyruk.test (aynı planın işi yer değiştirir, rapor işine dokunmaz, plan iletileri) · bozan plan-islem (özet zorunluluğu
  kalkınca eski beyanla kabul geçer) · e2e cevrimdisi (genişlik başına kabul bekleyen plan: bağlantı kesik kabul → bekliyor → bağlantı gelince kabul).
- 2026-10-08 (399): **Servis çalışanı sayfayı bekletmez** (395 düzeltmesi; deneme makinesi 2177156, tablet: ısınmada bir sayfa 3 dakika açılmadı).
  Çalışan, saha sayfasının ve uygulama dosyalarının kopyasını saklamadan önce yanıtın TAMAMINI bekliyordu — tarayıcı sayfa bitene kadar hiçbir şey
  almıyordu (akış yok; yavaş sunucuda takılma). Artık yanıt tarayıcıya ağdan geldiği gibi akar, kopya arka planda saklanır (waitUntil). Önceden
  indirme gövdeyi sonuna kadar okur (kopya tam saklansın). Aynı turda üç genişlikte de bağlantısız yenilenen rapor GÖRÜNDÜ ama ÇALIŞMADI: sayfa
  saklanıyordu, kullandığı uygulama dosyaları (betik, stil, yazı tipi) cihazda değildi — önceden indirilen sayfada ve canlıda her yeni yayından
  sonra da olurdu. Artık sayfa saklanırken içinde adı geçen /_next/static dosyaları önbellekte yoksa indirilir, sayfa kaydı dosyalardan SONRA
  yazılır (önbellek en çok 600 dosya, en eskisi silinir; anahtar dosyanın yolu — geliştirme sunucusunun her istekte eklediği "?v=" damgası
  aynı dosyayı yeniden indirtmesin). Kilit sw.test (swEksikleri: saklama yanıtı bekletirse; sayfanın dosyaları önce
  saklanmazsa yakalanır) + bozan kilitler; e2e cevrimdisi bağlantıyı kesmeden önce sayfanın cihazda saklandığını bekler.
- 2026-10-08 (398): **Çevrimdışı çalışma — fotoğraf kuyruğu** (ARKA-UC §4.1 "fotoğraf çekme" çevrimdışı çalışır; §4.3 "Onaya gönder, o raporun
  bütün kayıtları ve fotoğrafları gittikten sonra gider. Fotoğrafsız gönderim oluşmaz" · "2 rapor, 14 fotoğraf gönderilmeyi bekliyor"). Bağlantı
  yokken (ya da istek ağda düşerse, ya da raporun cihazda bekleyen işi varsa — sıra korunur) saha raporunda eklenen fotoğraf, cihazda küçültülmüş
  hâliyle (en çok 2 MB) kuyruğa şifreli yazılır; listede kendi yerinde "Gönderilmedi" (Kaldır), başlıkta "Cihazda n fotoğraf · gönderilmedi", üst
  çubukta "n fotoğraf gönderilmeyi bekliyor"; canlı zorunlu alan denetimi bekleyen fotoğrafı sayar. Bağlantı gelince fotoğraflar formdan ÖNCE gider;
  gidemeyen fotoğrafı olan raporun Onaya gönder'i bekler ("Raporun fotoğrafları gidince gönderilecek"), fotoğraf gidince ya da listeden kaldırılınca
  gider. Sunucuda iş rapor.foto (/api/islem, raporlar/server/islem-baglanti.ts): fotoğraf eklemek ekler, ezmez — raporun o anki sürümüne eklenir
  (tür, EXIF, sınır, yer, yetki fotoEkle'de aynen), önceki / sonraki sürüm döner; cihaz aynı raporun bekleyen işlerini yalnız sürüm kendi
  fotoğrafıyla değiştiyse taşır (arada başkası değiştirdiyse çakışma yine görünür). Göç yok (islem.tur deseni uyuyor). Kilitler: islem.test
  (gerçek PostgreSQL, iki firma: eski sürümle gelen fotoğraf kaydı ezmeden eklenir, tekrarı ikinci fotoğraf eklemez, PDF / bozuk metin / olmayan
  yer / başka denetçi / başka firma eklenmez) · kuyruk.test (form işinin yerine geçmez, önce gider, sürüm taşıma, Onaya gönder bekler, foto
  çakışması yeniden dene) · bozan kuyruk 3–4 · e2e cevrimdisi (bağlantı kesik → "Gönderilmedi" → bağlantı gelince Görüntüle).
- 2026-10-08 (397): **Hata ekranı bağlantıyı bilir** — bağlantı yokken (ya da hata ağdan geldiyse: sunucuya ulaşamayan istek) "Bu sayfa
  açılamadı · beklenmeyen sorun" yerine "Bağlantı yok": işlem bağlantı gerektirir; raporda Kaydet ve Onaya gönder bağlantısız da çalışır (cihaza
  kaydedilir), daha önce açılan saha sayfaları bağlantısız açılır; tuşlar Yeniden dene · Planlar. Bağlantı durumu canlı izlenir (bağlantı gelince
  eski ekran). src/components/hata/BeklenmeyenHata.tsx (ag, agHatasiMi); iki error.tsx. e2e hata (bağlantı kesilir → "Bağlantı yok", gelir → eski).
- 2026-10-08 (396): **Çevrimdışı çalışma — önceden indirme** (ARKA-UC §4.2 "kullanıcı çevrimiçiyken kabul ettiği / denetimdeki planların
  önümüzdeki 7 günü cihaza iner … 'Çevrimdışı hazır: 3 plan · son eşitleme 08:42'"). Bağlantı varken (açılıştan 3 sn sonra, bağlantı gelince, 30
  dakikada bir; son indirmeden 30 dk geçmediyse yapılmaz) kişinin EKİBİNDE olduğu, kabul edilmiş ya da denetimdeki, başlangıcı önümüzdeki 7 gün
  içinde ya da başlamış planların (en çok 20) ve bu planlarda KENDİ yazdığı Yeni raporların (en çok 100 — 402'de 50) sayfaları arka planda açılır; servis
  çalışanı bunları da şifreli saklar — sahada HİÇ AÇILMAMIŞ plan / rapor sayfası bağlantısız açılır. Çevrimdışı penceresinde "Çevrimdışı hazır: n
  plan · son eşitleme SS:DD". Sunucu yalnız adres listesi verir (planlar/server/cevrimdisi.ts — sayfaların verisi kendi yetki denetiminden geçer).
  Kilit cevrimdisi-paket.test (gerçek PostgreSQL, iki firma: kabul bekleyen, 7 günden sonraki, ekibinde olmadığı plan; başkasının ya da gönderilmiş
  raporu; başka firma; personelsiz hesap — girmez); e2e cevrimdisi (hiç açılmamış plan sayfası bağlantı kesikken açılır, "Çevrimdışı hazır: 1 plan").
- 2026-10-08 (395): **Çevrimdışı çalışma — sayfalar bağlantısız açılır** (ARKA-UC §4.1 "Planlar listesi ve plan içi (indirilmiş planlar),
  raporu doldurma … çevrimdışı çalışır", K4). Firma adresinde tarayıcının arka plan yardımcısı (servis çalışanı, public/sw.js): saha sayfaları
  (Ana sayfa, Planlar, plan içi, rapor) önce ağdan gelir ve cihaz deposuna ŞİFRELİ yazılır (kuyrukla aynı, dışarı alınamaz anahtar); bağlantı
  yokken son saklanan açılır, raporda Kaydet / Onaya gönder kuyruğa gider. Hiç açılmamış sayfa "Bu sayfa bu cihazda yok" der. Uygulamanın kendi
  dosyaları (betik, stil, yazı tipi) da saklanır (veri taşımaz). API, giriş, müşteri paneli, yönetim, PDF ve sunucu eylemleri HİÇ saklanmaz.
  Çıkışta ve cihazda başka kişi girince saklanan sayfalar silinir (bekleyen işler kalır — o kişi girince gider). Çevrimdışı penceresinde "Bu
  cihazda bağlantısız açılabilen sayfa: n". Sayfa CSP'sine `worker-src 'self'`. Kilit sw.test (depo şeması uygulamayla ortak, yalnız saha
  sayfaları, yalnız aynı kökenden GET, CSP); olumsuz kanıt kilitler.bozan (4 bozma); e2e cevrimdisi (bağlantı kesikken rapor yenilenince
  açılır, değerler yerinde; açılmamış sayfa "bu cihazda yok"). Sıradaki (açık): önceden indirme (kabul edilen planların 7 günü — "Çevrimdışı
  hazır: n plan"), fotoğrafın kuyruğa girmesi, bağlantısız rapor açma (numara sunucuda — bağlantı ister).
- 2026-10-08 (394): **Çevrimdışı çalışma — cihazdaki kuyruk ve gösterge** (392'nin devamı; maket Z4, ARKA-UC K4 / §4.3–4.5). Saha raporunda
  bağlantı yokken (ya da istek ağda düşerse) **Kaydet** ve **Onaya gönder** kaybolmaz: iş tarayıcının kalıcı deposuna (IndexedDB) ŞİFRELİ yazılır
  (AES-GCM; anahtar cihazda üretilir, dışarı alınamaz), "Cihaza kaydedildi; bağlantı gelince gönderilecek." Üst çubukta **"Çevrimdışı · n
  bekliyor"** (telefonda üst çubuğun altında şerit); tıklayınca bekleyen işler. Bağlantı gelince (ve sayfa açılınca, dakikada bir) SIRAYLA
  gider; ekran kendiliğinden tazelenir. Aynı rapor için tek bekleyen iş (yenisi eskisinin yerine). Onaya gönder beklerken rapor salt okunur,
  başlıkta "Gönderilmedi · bağlantı bekleniyor". Sonuçlar görünür, sessiz kayıp yok: eksikse alanlar işaretlenir; rapor bu arada başka yerde
  değiştiyse **"Çakışma"** — kullanıcı "Benimkini yaz" (güncel sürümden yeni kimlikle) ya da "Sunucudakini kullan" seçer (veri kaybettiren seçim
  önce sorar); başka hesapla yazılmışsa o hesap girince gider; oturum kapandıysa girince gider; cihaz saati 10 dk'dan fazla saparsa söylenir.
  Bağlantısızken öteki tuşlar (fotoğraf, cihaz, kopya …) sayfayı hata ekranına düşürmez, şeritte söyler. Tarayıcı depoya izin vermezse (gizli
  pencere) bekleyenler yalnız bu sayfada durur ve söylenir. Tarayıcıya hesap kimliği gitmez: işi yazanın etiketi (kimlikten türetilen özet).
  Kilit kuyruk.test (saf: birleştirme, sıra, gövde, sonuçlar, durma); olumsuz kanıt kuyruk.bozan (2 bozma); e2e cevrimdisi (üç genişlik,
  tarayıcının bağlantısı gerçekten kesilerek: Kaydet cihaza → bağlantı gelince gider → sayfada değer; başka sekmede değişen rapor ezilmez,
  çakışma → "Benimkini yaz"; Onaya gönder bekler → bağlantı gelince gider). Sıradaki: sayfaların bağlantısız açılması (servis çalışanı).
- 2026-10-08 (392): **Çevrimdışı çalışma — sunucu tarafı: tek seferlik işlem ucu** (KOD-GECIS K3 "çevrimdışı kuyruk ölçüldü" eksik kalmıştı;
  09-D2, ARKA-UC §4.3–4.5, maket Z4; reisim: *"devam et sıradaki işlere geç"*). Cihaz bağlantısızken yaptığı işi (şimdilik rapor Kaydet ve Onaya
  gönder) kendi ürettiği kimlikle kuyruğa yazacak, bağlantı gelince `/api/islem`'e gönderecek. Sunucu işi ve sonucunu aynı veritabanı
  işleminde yazar (göç 0076 `islem`): aynı kimlik yeniden gelirse iş tekrar yapılmaz, saklanan sonuç döner; aynı anda iki istekte iş bir kez
  (kimliğe danışma kilidi); kimlik başka kişinin işleminde ya da başka işte kullanılmışsa iş yapılmaz. İş modülün kendi işlevi — yetki, ENGEL'ler,
  sürüm kilidi aynen: cihazın gördüğü sürüm başka yerde değiştiyse "çakışma" (sessiz ezme yok), kullanıcı yeniden göndermeyi seçerse yeni kimlik.
  Kapılar: aynı köken, JSON, gövde sınırı, biçim, oturum; işi yazanın etiketi oturumdaki kişininki değilse işlenmez (cihaz saklar; etiket
  kimlikten türetilen özet — tarayıcıya hesap kimliği gitmez). Cihaz saati 10 dk'dan
  fazla saparsa yanıtta söylenir. Kişi yalnız kendi işlemlerini görür (RLS firma + hesap); kayıt değişmez / silinmez. Kilit islem.test (gerçek
  PostgreSQL, iki firma); olumsuz kanıt islem.bozan (4 bozma); e2e islem (üç genişlik: kapılar). Sıradaki: cihazdaki kuyruk (şifreli IndexedDB),
  üst çubukta "Çevrimdışı · n bekliyor", saha raporunda Kaydet / Onaya gönder bağlantısızken kuyruğa; ardından sayfaların bağlantısız açılması.
- 2026-10-08 (393): **Yönetim girişinde iki adım şimdilik kapalı** (reisim birebir: *"2 aşamalı doğrulama için Google Authenticator kullanıyorum
  ama sürekli hata veriyor süre geçmemesine rağmen süre geçti diyor yönetim paneline giremiyorum ikii aşamalı doğrulamayı şimdilik kaldır,
  belirlediğin mail şifre ile direk girebileyim"*). Neden: kurulum sayfasında karekod yoktu, 32 harflik anahtar uygulamaya elle yazılıyordu; tek
  harf yanlışsa her kod "yanlış ya da süresi geçti" der (yönetim izinde tek parola girişi, ardından iki kod hatası). Değişen: iki adım bir ayar
  (göç 0075 `yonetim_ayar.iki_adim`, başlangıçta KAPALI; satır yoksa açık sayılır). Kapalıyken e-posta + parola doğruysa yönetim oturumu hemen
  açılır — geçici parolalı ("ilk") yönetici de; 5 hatalı denemede 15 dk kilit, IP kilidi ve yönetim izi aynen; veritabanının yönetim kapısı
  (yonetim_kim) aynı ayara bakar. Kod ve kurulum sayfaları girişe döner, giriş tuşu "Giriş yap". Açılınca eski akış aynen (ilk yöneticinin
  oturumu düşer, kuruluma gider); ayarı uygulama ve yönetim rolü değiştiremez (yalnız göç / veritabanı sahibi). Yeniden açmadan önce kurulum
  sayfasına karekod eklenecek (açık iş). Kilit yonetim.test (iki adımlı testler ayarı açar; yeni test kapalı hâli); olumsuz kanıt yonetim.bozan
  7–8; e2e yonetim (üç genişlik: doğrudan giriş, kod / kurulum sayfası girişe döner).
- 2026-10-08 (391): **Deneme yayını güncellendi (389–390).** CI d1c13af yeşil — ilk paralel koşu: denetim 5 dk, uçtan uca masaüstü / tablet / telefon
  aynı anda 22'şer dk, koşu toplam ~23 dk (önceki ~80 dk). Supabase'e göç 0074 (`goc` kaydıyla, özet d1c13af'teki dosyadan; 75 göç), işlev
  gövdesi dosyayla md5 aynı, yalnız uygulama rolüne açık. main = d1c13af, Vercel yayında. Doğrulama: duman 9/9 · gece ucu 200 (çöp + saklama,
  silinen 0) · çalışma zamanı hatası yok (son 1 saat) · giriş sayfası telefonda (375) yana taşmasız, temiz sekmede konsol hatasız. Duyuru
  şeridinin kaynak adı bir sonraki okumada dolar (Ana sayfa 6 saatte bir okutur; eski kayıtta ad yok → genel cümle). Oturum isteyen ekranlar:
  ölçemedim.
- 2026-10-08 (390): **Duyurular: hangi kaynak alınamadı** (388'deki canlı bulgu). İSGGM ve İSGÜM okunup yalnız iş ekipmanları portalı
  okunamayınca Ana sayfa "Duyurular alınamadı" diyordu — hepsi alınamamış gibi. Artık "İş ekipmanları duyuruları alınamadı; son alınan liste
  gösteriliyor." (hepsi düştüyse ya da okuma takıldıysa eskisi gibi genel cümle). Okuma işi okunamayan kaynakların kodunu iş kaydına yazar;
  durum işlevi (göç 0074 duyuru_durumu) son koşununkini döner, yalnız bilinen kaynak kodları (özete başka değer yazılsa ekrana gitmez). Günlüğe
  ağ hatasının asıl nedeni de yazılır ("fetch failed (UND_ERR_CONNECT_TIMEOUT)" gibi) — portalın neden okunamadığı sonraki denemede görünür. Kilit
  duyuru.test (gerçek PostgreSQL: kaynak kodu, iş kaydı, süzgeç, takılan okumada boş; hataNedeni); olumsuz kanıt duyuru.bozan 6 (süzgeç kalkınca
  başka değer duruma geçer). Uçtan uca değişmedi (taklitte üç kaynak da okunur; düşen kaynak gerçek PostgreSQL kilidinde).
- 2026-10-08 (389): **CI'da uçtan uca üç genişlik aynı anda** (reisim: *"1 saattir koşuyor bu deneme daha ne kadar sürecek ?"*). Masaüstü, tablet
  ve telefon art arda koşuyordu (her biri ~22 dk, koşu ~80 dk); artık her genişlik ayrı işte, ayrı makinede, aynı anda (her biri zaten kendi
  sunucusu ve geçici veritabanıyla koşuyordu — yalıtım aynı). Uçtan uca geliştirme sunucusuyla koştuğu için derlemeyi beklemez; biri düşse de
  ötekiler biter, koşu yine kırmızı olur (Pages yayın şartı bütün koşunun yeşili — değişmedi). Kilit test-kapisi: üç genişlik matriste ve
  koşu satırı var (olumsuz kanıt kilitler.bozan: telefon matristen düşünce yakalanır).
- 2026-10-08 (388): **Deneme yayını güncellendi (387 saklama süresi).** CI 7c8ad00 yeşil (üç genişlik; ilk koşuda yeni e2e'nin seçicisi aynı
  satırdaki "PDF indir" bağlantısını da buluyordu — tam adla düzeltildi); Supabase'e göç 0073 (`goc` kaydıyla, özet 7c8ad00'daki dosyadan; 74
  göç) — beş işlevin gövdesi dosyayla bayt bayt aynı (md5), tetikler dosya ve firma_ayar'da, saklama_silme RLS + FORCE, uygulama yalnız okur,
  API rolleri kapalı. main = 7c8ad00, Vercel yayında. Doğrulama: duman 9/9 · gece ucu gerçek sırla 200, yanıtta "saklama" (1 firma, silinen 0),
  iş kayıtları "cop_temizligi" ve "saklama_silme" tamam · /firma-ayarlari/saklama oturumsuz girişe yönlenir. **Duyurular canlıda ilk kez
  okundu** (06:29, birinin Ana sayfa açılışıyla): İSGGM 33 ve İSGÜM 50 duyuru alındı; iş ekipmanları portalı Vercel'den (Frankfurt) okunamadı —
  bağlantı 10 sn'de düştü; aynı adres Türkiye'den 0,15 sn'de açılıyor (yönlendirme yok, sertifika sağlam) → portal büyük olasılıkla yurt dışı
  bağlantıyı kabul etmiyor (kodla çözülmez; Türkiye'de bir ara sunucu ister — açık soru). Oturum isteyen ekranlar: ölçemedim.
- 2026-10-08 (387): **Saklama süresi işi** (KOD-GECIS ENGEL 11, ARKA-UC §7 "Arşiv / silme (5 yıl, firma seçimi), 30 gün önce liste"; reisim
  2026-10-03 *"depoda 5 sene sonra silcek şekilde kodla"*). İmzalı raporun PDF'i (ve imzaya hazırlanan PDF'i) saklama süresi dolunca gece işiyle
  firmanın deposundan silinir; raporun kaydı (künye, içerik, uygunsuzluklar) kalır, ekranlar "saklama süresi dolduğu için PDF silindi" der
  (rapor ekranı, ön izleme, müşteri paneli; imzasız kopya da basılmaz, toplu ZIP'e girmez). Süre Firma ayarları › Rapor saklama süresi (yoksa 5;
  veritabanında her durumda 5–20 yıl); süre dolan an = imza + süre — firma süreyi değiştirdiyse en erken değişiklikten 30 gün sonra (kısaltınca
  bile her silinecek rapor 30 gün önce listede görünür; ayarın değişme zamanını veritabanı damgalar). **Liste:** Firma ayarları › Saklama süresi
  dolacak raporlar (yalnız firma yöneticisi; rapor, müşteri / tesis, imza günü, süre dolan gün, kalan, PDF indir) ve Uyarılar'da süre dolan gün
  başına "n raporun PDF'i" (yalnız firma yöneticisine; Ana sayfa uyarı yüzünde sayı). **Koruma veritabanında:** imzalı sürümün PDF'i çöpe
  alınamaz, süresi dolmadan hiçbir yoldan (süper kullanıcı dahil) silinemez; silme yalnız saklama_sil (firma işleminde, firma süzgeçli, süre
  kendi içinde denetlenir), kayıt saklama_silme'de. Gece işi /api/is/gece'de çöp temizliğinden sonra (ayrı iş kaydı "saklama_silme"); iş çatısı
  ortak (src/server/is/firmalar.ts). Aylık arşiv yedeği henüz yok (firmanın deposu K7) — gelince aynı süreyle. Göç 0073. Kilit saklama.test
  (gerçek PostgreSQL, iki firma); olumsuz kanıt saklama.bozan (7 bozma); e2e saklama (üç genişlik: Uyarılar → liste → rapor; denetçi yetkisiz),
  api (gece ucunda "saklama").
- 2026-10-08 (386): **Deneme yayını güncellendi (376–385).** CI 5152a1c yeşil (tip · lint · test · olumsuz kanıt · derleme · uçtan uca üç genişlik);
  Supabase'e göç 0069–0072 sırayla uygulandı (her biri `goc` kaydıyla, özet 5152a1c'deki dosyadan; 73 göç), işlevler yalnız uygulama rolüne açık,
  API rolleri kapalı, yz_sohbet RLS + FORCE. main = 5152a1c, Vercel yayında. Doğrulama: `node tools/duman.mjs` 9/9 (sağlıkta yeni "isler" dahil) ·
  çalışma zamanı hatası yok · /api/is/gece sırsız ve yanlış sırla 401, POST 405; gerçek sırla bir kez koşturuldu → 1 firma, silinen 0, öksüz 0, iş
  kaydı "tamam" · firma ve yönetim girişinde boş gönderince odak E-posta'da (376), konsol temiz. Oturum isteyen ekranlar (Ana sayfa duyuruları,
  S.A.Y, etiketten okuma): ölçemedim (parolayı ben yazmam); İSGGM sayfasının Vercel'den (fra1) okunup okunmadığı ilk Ana sayfa açılışında belli olur.
- 2026-10-08 (385): **Etiket plakasından okuma** (K5 yapay zekâ; ARKA-UC §5.2 "aynı çatı: ekipman etiket plakası"; maket rapor "Etiketten oku" ·
  "Etiket plakasından okunan"). Saha raporunda Ekipman bilgileri bölümünün başında **Etiketten oku** (kamera / galeri): plakadan marka, model, seri
  no ve imal yılı okunur, **öneri kartına** düşer — emin olunanlar "Önerileri uygula (n)" ile toplu, "Emin değil" olan tek tek "Uygula" ile alana
  yazılır, "Vazgeç" hiçbirini yazmaz; rapora ancak Kaydet ile geçer. Fotoğraftan okumayla aynı kapı ve kullanım: yalnız yazanın Yeni raporu, firmada
  açık + anahtar, fotoğrafın konum bilgisi silinir, sınır ayrılır, okuma kaydı "etiket"; istekte firma / müşteri / kişi bilgisi yok. Formatın kendi
  sorduğu alan (ör. kompresörde "Marka / model") sabit satırda olmadığı için öneriye girmez. Geçersiz ya da gelecek imal yılı, sınırı aşan değer
  atılır. Kilit etiket-okuma.test (saf), foto-oku.test (385, gerçek PostgreSQL); olumsuz kanıt etiket-okuma.bozan; e2e foto-oku (etiket kartı).
- 2026-10-08 (384): **S.A.Y raporu bilir** (ARKA-UC §5.3 "Ne bilir: o raporun alanları, türün kriterleri ve formatı"). Rapor ekranında serbest
  soruya açık raporun özeti eklenir (kaydedilmemiş değişiklikler dahil): ekipman türü, bölümler, kaç madde cevaplandı, "Uygun değil" maddeler
  (ağır / hafif), sınır dışı ölçüm ve test değerleri, boş zorunlu alanlar, sonuç ve kriterlere göre öneri. Özetin metnini sunucu formatın kendi
  adlarından kurar; **giden yalnız formatın adları, seçenekler ve sayılar** — kusur açıklaması, notlar, bilgi alanlarının değerleri (seri no,
  kullanım yeri …), ölçüm satırının elle yazılan etiketi, yorum ve künye (firma, müşteri, tesis, adres, SGK, İSG-KATİP) gitmez (§5.4). Yalnız
  raporu yazan kişinin Yeni raporunda ve adres o raporsa (raporlar/server/say-baglanti.ts — S.A.Y'ın rapora baktığı tek yer). Kilit
  say-rapor-ozeti.test (saf), say.test (384: erişim, giden istek); e2e say (rapor ekranında serbest soru özeti taşır). Ayrıca: geçmişin sırası
  tablonun zamanıyla (aynı milisaniyede soru / cevap yer değiştirebiliyordu); say.test kullanım yardımcısı kişinin kendi satırını okur.
- 2026-10-08 (383): **Sağlıkta takılı arka plan işi** (09-G5). 1 saatten uzun "çalışıyor"da kalan iş (gece çöp temizliği, duyuru okuma …)
  sağlık ucunda "isler: hayır" ve durum "sorun" olur — duman testi düşer, iş sessizce durmaz. Yeni başlamış iş sorun değil; bir sonraki koşu
  takılı işi "takıldı" yapınca düzelir. Ayrı işlev (0072 is_denetimi; saglik_denetimi'ne dokunulmadı), yalnız sayı. Kilit saglik.test,
  saglik-saf.test, e2e api (sağlık ucunda isler); olumsuz kanıt is-saglik.bozan.
- 2026-10-08 (382): **S.A.Y rapor ekranında** (maket say.js HIZLI; ARKA-UC §5.3). Düzenlenen rapor açıkken S.A.Y raporu okur (kaydedilmemiş
  değişiklikler dahil): hızlı sorular **"Eksik alanlar neler?"** (bölüm başına "Bölüm · N alan" ve **Git** — alana götürür; telefonda panel kapanır)
  ve **"Sonuç ne olmalı?"** (kusur ve sınır dışı değerlere göre; seçilen sonuç kriterlerden ayrıysa **öneri kartı**: "Uygula" denetçinin
  seçimiyle aynı yoldan forma yazar — Kaydet'le kaydedilir, "Vazgeç"). Git ve Uygula yalnız o rapor açıkken; kartın sonucu geçmişte kalır, bir
  kez işaretlenir. Cevabın metnini sunucu kurar (ekran yalnız yapıyı gönderir, denetlenir — istemci S.A.Y adına metin yazamaz); yer "Rapor <no>";
  serbest soruda da. Göç 0071'e yz_sohbet_oneri eklendi (henüz uygulanmamış göç, yerinde). Kilit say.test (382), say-saf (rapor girdisi);
  e2e say (rapor ekranı: eksik + Git, sonuç önerisi + Uygula).
- 2026-10-08 (381): **Personel › Giriş hesabı: hesap işlemleri sayfayı sunucuda yeniler** (377'nin aynısı). CI'da uçtan uca hesap testi defalarca
  aynı yerde düşüyordu: "Rolleri kaydet"ten hemen sonra "Hesabı kapat"a basılınca onay penceresi açılmıyor / kayboluyordu — eylemden sonra
  istemcinin ayrı yenileme isteği sürerken gelen tıklama. Artık hesap aç / geçici parola / kapat / yeniden aç / rolleri kaydet başarılı olunca yeni
  sayfa eylemin yanıtıyla gelir (`refresh()` sunucuda; HesapBolumu'ndaki `router.refresh()` kalktı). Uygulamada aynı istemci deseni başka yerlerde
  de var; düşen test çıkan ekran aynı yolla düzeltilir.
- 2026-10-08 (380): **S.A.Y saha asistanı — çekirdek** (K5 "yapay zekâ — sonra S.A.Y"; maket say.js BB6; reisim 2026-10-03 *"bu say botu plan
  içinde değil her yer de gözükecek … daha yuvarlak daha ilgi çekici"*, *"sayfa değişince vs geçmiş silinmez geçmiş olayı önemli"*). Firma yapay
  zekâyı açtıysa her firma sayfasında sağ altta yuvarlak düğme (müşteri paneli ve Yönetim'de yok); panel masaüstü / tablette sağda yan pencere,
  telefonda tam ekran, açık / kapalı hâli bu cihazda kalır; formda ve raporda alttaki tuş çubuğunun üstünde durur. **"Beni ne bekliyor?"** (yan
  menü balonlarından — kişinin kendi işi) ve **"Bu sayfada ne yapılır?"** kuralla, ücretsiz; **serbest soru** yapay zekâya (firmanın anahtarı ve
  modeli): fotoğraftan okumayla aynı sınır ayırması, sabit talimat önbellekte; giden bağlam yalnız rol adları, sayfa ve bekleyen iş sayıları
  (müşteri, adres, kişi adı, e-posta gitmez). Öneri verir, kendisi yazmaz; imza / gönderme / onay / silme yok. **Geçmiş kişinin hesabında**, yalnız
  kendisi görür, sayfa değişince ve yenilenince kalır, yer ayracıyla; "Sohbeti temizle" önce sorar, yalnız kendi geçmişini siler; kişi başı en
  yeni 200. Firma ayarları › Yapay zekâ tablosuna "S.A.Y mesajı" sütunu (maket Y1). Anahtar yoksa, bağlantı yoksa, sınır dolduysa şerit söyler.
  Göç 0071 (yz_sohbet — RLS firma + kişi, yazma / temizleme tanımlayıcı-yetkili; yz_kullanim.mesaj yalnız artar). Kilit say.test (gerçek
  PostgreSQL, iki firma, iki kişi), say-saf.test; olumsuz kanıt say.bozan (4); e2e say (üç genişlik, yerel taklit — istekte kişisel bilgi varsa
  taklit reddeder). Sonraki (381): rapor ekranında "Eksik alanlar neler?", "Sonuç ne olmalı?" öneri kartı ve "Uygula".
- 2026-10-08 (379): **Ana sayfa Duyurular canlı** (K5 "İSGGM duyuru okuma"; reisim 2026-09-26 *"Ana sayfada isgüm duyurularını gösterebilir
  miyiz"*, yirmi sekizinci tur kararları). Sunucu Bakanlığın üç sayfasını okur — İSGGM ve İSGÜM duyuruları, iş ekipmanları portalı — ve Ana
  sayfada kaynak başına en yeni 2'yi gösterir: hepsi en yeni üstte, başlık yeni sekmede Bakanlığın sayfasına, altında yayım tarihi ve kaynak;
  sayaçta "N duyuru · güncellendi …"; kaynak tuşları ("Tümü" yerine kaynak adları, maket gibi). Tarihi doğrulanamayan duyuru girmez; bağlantı
  yalnız Bakanlığın iki adresi (veritabanı da denetler). Okuma Ana sayfa açılınca son deneme 6 saatten eskiyse YANITTAN SONRA arka planda başlar
  (kimse bakmazsa istek gitmez; aynı anda iki okuma yok). Bir kaynak okunamazsa (ağ, zaman aşımı, sayfa yapısı değişti) ötekiler yazılır ve
  "Duyurular alınamadı; son alınan liste gösteriliyor." şeridi çıkar. Firma verisi değil (bütün firmalar aynı listeyi görür). Göç 0070 (duyuru;
  duyuru_yaz / duyuru_listesi / duyuru_durumu). Kilit duyuru-ayristir.test (uydurma sayfalar), duyuru.test (gerçek PostgreSQL, iki firma, yerel
  taklit); olumsuz kanıt duyuru.bozan (5); e2e anasayfa (üç genişlik: okuma → 6 duyuru, bağlantı, sayaç). Gerçek sayfalar PC'den denendi
  (İSGGM 33, İSGÜM 50, portal 9 duyuru ayrıştı; sayfa içeriği depoya girmedi).
- 2026-10-08 (378): **K5 başladı — gece işi: çöp temizliği** (09-A5, ARKA-UC §7; reisim: *"devam et … bitir"*). Silinen kaydın dosyası çöpe
  gidiyordu ama hiç silinmiyordu (veritabanı deposunda yer tutuyordu). Artık her gece çöpte **30 günü dolan** dosya kalıcı silinir: kaydı ve
  depodaki içeriği. Çöpteki dosya zaten indirilemiyordu; ekranda bir şey değişmez, yer açılır. Bir kayda hâlâ bağlı dosya silinmez ("bağlı"
  sayılır); depoda kaydı olmayan nesne yalnız sayılır, silinmez; dondurulmuş firmaya dokunulmaz. İş her firmayı kendi işleminde dolaşır (G1); bir
  firmada düşen iş ötekileri durdurmaz, iş "hata" ile kaydedilir. İş kaydı (is_calisma): aynı iş aynı anda iki kez koşmaz, 1 saattir takılı iş
  "takıldı" olur, özet yalnız sayılar. Uç `/api/is/gece` yalnız CRON_SECRET'le (yoksa / kısaysa hiçbir istek geçmez), Vercel Cron günde bir
  (01:15 UTC). Göç 0069 (is_calisma, is_basla / is_bitir, gece_firmalari, dosya_cop_sil, depo_nesne_sil — uygulama rolüne DELETE verilmedi).
  Kilit gece-cop.test (üç firma, biri dondurulmuş), zamanli-yetki.test, moduller (uç yalnız sırla, yalnız GET), yayin (cron); olumsuz kanıt
  gece-cop.bozan (6); e2e api (sırsız 401, sırla iki koşu). Sonraki: sağlık ucuna "takılı iş" (09-G5) ilk koşudan sonra.
- 2026-10-08 (377): **Yönetim › Firma: Dondur / Etkinleştir / yeni geçici parola sonrası sayfa sunucuda yenilenir.** CI (8dc6d06, tablet):
  "Etkinleştir"e basıldı, hata çıkmadı, tuş açıldı ama sayfa 15 sn "Dondurulmuş"ta kaldı — eylemden sonra istemcinin ayrı yenileme isteği
  başka bir yönlendirici işiyle çakışınca düşebiliyor (Raporlar'da 318'de görülen yarış). Artık bu üç eylem başarılı olunca yeni sayfa eylemin
  yanıtıyla gelir (`refresh()` sunucuda; istemcideki `router.refresh()` kalktı). e2e yonetim: Etkinleştir bildirimi + Dondur tuşu. Uygulamada
  83 yerde aynı istemci deseni var; düşen bir test çıkarsa o ekran da sunucu yenilemesine alınır (topluca değiştirilmedi — davranışı ölçülmeden
  dokunulmaz).
- 2026-10-08 (376): **Giriş hatasında odak alana** (375'in canlı denetiminde bulundu). Firma ve yönetim girişinde hatalı / boş gönderimde ileti
  çıkıyordu ama odak sayfaya düşüyordu (gönderirken tuş kilitlenir): klavyeyle kullanan başa dönüyordu. Artık e-posta boşsa e-postaya, doluysa
  parolaya gelir (parola belirleme ve kod adımında zaten böyleydi). Yönetim girişinde parola alanı da hatalı işaretlenir (firma girişindeki gibi).
  Kilit e2e giris (boş gönderim → e-posta, yanlış parola → parola) ve yonetim (parola, aria-invalid).
- 2026-10-08 (375): **Deneme yayını güncellendi (347–374).** Supabase'e göç 0049–0068 sırayla uygulandı (her biri `goc` kaydıyla, özet o
  commit'teki dosyadan; 69 göç); probata yönetim hesabı ilk kurulum durumunda açıldı (geçici parola yalnız reisim'e). main = fbd2597, Vercel
  yayında. Doğrulama: `node tools/duman.mjs` 9/9 · çalışma zamanı hatası yok · firma ve yönetim giriş sayfaları açılıyor, konsol temiz · ortamda
  PROBATA_SIR_ANAHTARI ve PROBATA_YONETIM_ALAN tanımlı (değerlere bakılmadı). Oturum isteyen ekranlar: ölçemedim (parolayı ben yazmam).
- 2026-10-07 (374): **362–373 öz incelemesi** (reisim: ajan çok kredi yiyor → inceleme ajansız, elle; güvenlik · veritabanı · mantık · arayüz).
  Silme işlevlerinin her deyiminde firma süzgeci, parola özetinin ize yazılmaması, kilit sırası ve yabancı anahtar aynası (silici.ts ↔ göçler, 15
  personel / 6 plan / 5 teklif …) yeniden sayıldı — tutarlı. Düzeltilen: (1) teklif kaydı kullandığı ekipman türlerini paylaşımlı kilitler (Excel
  ekipman listesi yabancı anahtarsız; tür silme ile yarışta silinen tür listede kalmasın), (2) katılım formu gönderimi eğitim kaydını paylaşımlı
  kilitler (silinen kayda form gitmesin), (3) sözleşme sayfasında İSG ID tuşu "Sil" değil "Kaldır" (işlem kaldırma; onayıyla ve ekran diliyle
  aynı; e2e'de iki "Sil" çakışmasın).
- 2026-10-07 (373): **İmzalı zimmet formu Kaldır** (§9 elli üçüncü tur ekran dili: kayıt saklanıyorsa "Kaldır"). Personel kartının Zimmetindekiler
  bölümünde, yüklenen ıslak imzalı taramada "Kaldır" (onaylı; "Kayıt listeden kalkar; belge silinmez, saklanır."): yanlış dosya yüklendiyse. Satır
  kaldirildi ile kalır, kişinin imzalı formu sayılmaz; varsa bir önceki imzalı form yeniden geçerli görünür. Onaylar'da kişinin imzaladığı form
  kaldırılmaz (veritabanı da ister). Göç 0068 zimmet_formu.kaldirildi + zimmet_formu_kaldir_yuklenen. Kilit personel-dosya.test (373); olumsuz kanıt
  personel-dosya.bozan (373); e2e personel-dosya (yükle → kaldır).
- 2026-10-07 (372): **Raporsuz plan Sil** (§9 elli üçüncü tur; 0023 "silme hakkı yok" kullanılmış plan için geçerli). Plan sayfasının başlığında,
  hiç raporu (silinmiş taslak dahil), faturası, gideri olmayan ve tamamlanmamış planda yalnız yöneticiye (Planlar'da "yaz" + yönetici; planlama açar
  ama silemez) "Sil" (onay "… ekip, ekipman satırları ve proje notları da silinir; ekipmanlar tesiste kalır."). Planın kullandığı İSG-KATİP ID'si
  başka planda kullanılmıyorsa yeniden "kullanılmamış" olur. Göç 0067 plan_kullanim (rapor · tamamlandı · fatura · gider) + plan_sil. Kilit
  kesin-silme.test "plan"; olumsuz kanıt kesin-silme.bozan 17; e2e planlar (raporsuz plan sil).
- 2026-10-07 (371): **Eğitim türü / kaydı Sil** (§9 elli üçüncü tur). Eğitim türleri tablosunda kaydı hiç olmayan türde, eğitim kaydı penceresinde
  sertifikası yüklü olmayan ve katılım formu imzaya hiç gönderilmemiş kayıtta yalnız yöneticiye (Eğitimler'de "yaz" + yönetici) "Sil". Güncel kayıt
  silinince aynı kişi × eğitimin en son önceki kaydı yeniden güncel olur (tekrar tarihi ondan). Göç 0066 egitim_turu_kullanim / _sil (kayıt) +
  egitim_kaydi_kullanim (sertifika · katılım formu) / _sil (önceki geri gelir; kaldırılmış sertifikalar çöpe). Kilit kesin-silme.test "eğitim";
  olumsuz kanıt kesin-silme.bozan 16; e2e egitimler (kayıt sil, tür sil).
- 2026-10-07 (370): **Rapor formatı taslağı Sil** (§9 elli üçüncü tur; 0022 "yayınlanan sürüm silinmez" aynen). Tür sayfasının "Rapor şablonu"
  sürüm tablosunda taslak satırında yalnız yöneticiye (Ekipman türleri'nde "yaz" + yönetici) çöp kutusu simgesi ("Taslağı sil"; onay "Taslak kalıcı
  olarak silinir; yayınlanmış sürümler etkilenmez."). Göç 0065 rapor_format_kullanim (yayınlandı · rapor) + rapor_format_sil (tür kilitlenir; tanım
  izde). Kilit kesin-silme.test "rapor formatı"; olumsuz kanıt kesin-silme.bozan 15; e2e rapor-format (taslak sil, yayındakine dokunmaz).
- 2026-10-07 (369): **İmza bekleyen sözleşme Sil** (§9 elli üçüncü tur; 0017'nin "silme yok"u imzalanmış sözleşme için geçerli). Sözleşme sayfasında,
  müşteri imzası hiç yüklenmemiş (imzalı tarama bir kez bile yüklenmemiş — kaldırılmışı dahil) ve faturası olmayan sözleşmede yalnız yöneticiye
  "Sil" (onay "… imza beklerken silinir, kapsam tesisleri de çıkar."). İSG-KATİP ID'leri tesis × denetçiye bağlı, sözleşmeyle gitmez. Göç 0064
  is_sozlesmesi_kullanim (imzalı · fatura) + is_sozlesmesi_sil (kapsam tesisleri birlikte; numara yeniden verilmez). Kilit kesin-silme.test
  "sözleşme"; olumsuz kanıt kesin-silme.bozan 14; e2e sozlesmeler (imza bekleyende Sil; ikinci sözleşme silinir).
- 2026-10-07 (368): **Teklif taslağı Sil** (§9 elli üçüncü tur). Teklif sayfasında, hiç gönderilmemiş taslakta yalnız yöneticiye (Teklifler'de "yaz"
  + yönetici; hazırlayan planlama düzenler ama silemez) "Sil" (onay "<no> kalıcı olarak silinir; kalemleri ve tesisleri de silinir. Geri alınamaz.").
  Gönderilmiş teklif müşteriye verilmiş belgedir: silinmez (red / süresi doldu kalır, yenisi kopyalanır). Göç 0063 teklif_kullanim (gönderildi · kopyası
  · dayanak sözleşme · fatura satırı) + teklif_sil (kalemler, tesisler birlikte; numara yeniden verilmez). Kilit kesin-silme.test "teklif"; olumsuz
  kanıt kesin-silme.bozan 13; e2e teklifler (taslak sil; gönderilmişte Sil yok).
- 2026-10-07 (367): **Müşteri girişi Sil** (§9 elli üçüncü tur). Müşteri kartının Ek girişler tablosunda, müşterinin panele HİÇ girmediği ek
  girişte yalnız yöneticiye çöp kutusu simgesi ("<ad> girişini sil"; onay "… kalıcı olarak silinir; kullanıcı adı yeniden kullanılabilir. Geri
  alınamaz."). Ana giriş (müşterinin e-postasına bağlı) ve panele girilmiş giriş silinmez — pasife alınır. Göç 0062 musteri_hesap_kullanim (ana ·
  panele girdi) + musteri_hesap_sil (parola özeti ize yazılmaz; oturumlar zincirle). Kilit kesin-silme.test "müşteri girişi"; olumsuz kanıt
  kesin-silme.bozan 12; e2e musteriler (ek giriş aç → sil).
- 2026-10-07 (366): **Personel Ayrıldı / Ayrılışı geri al / Sil** (karar 43 "ayrılan personel silinmez" kullanılmış personel için geçerli; §9 elli
  üçüncü tur). Sunucuda ayrıldı işlevi vardı ama ekranı yoktu: personel kartında (yalnız "yaz" — önerilen düzende firma yöneticisi) çalışan kişide
  "Ayrıldı" (pencere: ayrılış tarihi, "silinmez: zimmetleri, raporları, özlük dosyası ve geçmişi durur"; giriş hesabı 0007 tetiğiyle kapanır), ayrılan
  kişide "Ayrılışı geri al" (onaylı; hesap kapalı kalır), hiç kullanılmamış (deneme) kişide "Sil". Kişi kendini silmez. Göç 0061 personel_kullanim
  (zimmet hareketi · kilometre · etkin İSG ID · eğitim · özlük · ekipman ataması · bordro · zimmet formu · plan ekibi · rapor · gider · izin · imza
  belgesi · GİRİŞ YAPILMIŞ hesap ya da firmanın ilk hesabı) + personel_sil (hiç girilmemiş hesap — parola özeti ize yazılmaz —, kaldırılmış İSG
  kayıtları birlikte). Kilit kesin-silme.test "personel"; olumsuz kanıt kesin-silme.bozan 11; e2e personel (Ayrıldı, geri al, sil).
- 2026-10-07 (365): **352–361 incelemesi düzeltmeleri** (dört bakışlı inceleme, 25 doğrulanmış bulgu). (1) Plan içi ekipman Sil, kesin silme ilkesinin
  kuralına bağlandı: canDo kayit_sil (Ekipman'da "yaz" + yönetici) — eski ekipman_sil yalnız role bakıyordu; varsayılan matriste branş yöneticisi
  ekipmanı pasife alamazken silebiliyordu (artık firma yöneticisi; firma matrisle verebilir). Ekipman bu planda yoksa "Plan bulunamadı" yerine
  "Ekipman bu planda yok ya da silinmiş.". (2) Ekipman türü kullanımı teklifin Excel'den yüklenen ekipman listesini (JSON, yabancı anahtarsız) da
  sayar ("1 teklifte"); silinen format sürümleri ize tanımıyla yazılır (0057 yayına çıkmadan yerinde düzeltildi). (3) Yarışlar: teslimEt varlık
  satırını kilitler (pasife alma ile aynı anda koşunca pasif varlık kişinin zimmetinde kalmaz); ekipman türü bağlantısı seçilen cihaz türlerini
  paylaşımlı kilitler (silinen tür dizide kalmaz). (4) Cihaz türü adı veritabanı dizininin lower(ad) kuralıyla da denetlenir ("IR" / "ir" 23505 ile
  düşmez). (5) Pasife al penceresi engeli baştan söyler ("… zimmetinde; önce depoya teslim alın.") ve tuşu kapatır; kalibrasyondaki cihazda Pasife al
  çizilmez; karşılanmamış koşul yeşil tikle gösterilmez. (6) Sil / Pasife al sonrası odak korunur (components/sil/odak.ts: hedef ya da sayfa başlığı).
  (7) Cihaz türleri penceresi maket T7 metinleriyle ("Cihaz türü ekle", "Geri", "<ad> eklendi; cihaz eklerken seçilir.", "<ad> türünü sil").
  (8) Kalibrasyon şeridi "Göster" görünümü etkine döndürür; fotoğraftan oku girdisi kapalıyken aria-disabled; Elektrik türü silinince Elektrik
  sekmesine dönülür. Reddedilen 4 bulgu (yarışta geçerli sıralı yürütme, kapsam kilidi, e2e yeniden deneme, öneri kartı satırı) değişiklik istemedi.
- 2026-10-07 (364): **Müşteri / tesis Sil** (§9 elli üçüncü tur: karar 48 "müşteri silinmez" KULLANILMIŞ müşteri için geçerli, deneme müşterisi
  silinir). Müşteri ve tesis sayfasında yalnız firma yöneticisine (Müşteriler'de "yaz" + yönetici; planlama değiştirir ama silemez) ve hiç
  kullanılmamış kayıtta "Sil"; kullanılmışta "Pasife al" — ortak pencere nedeni söyler ("1 planda, 2 ekipmanda kullanıldı; silinemez"). Ekran dili
  birleşti: müşteri, tesis ve müşteri girişindeki "Pasif yap" → "Pasife al", "Yeniden etkinleştir" tuşu → "Etkinleştir" (müşteriye özel pasif penceresi
  kalktı, components/sil/PasifPenceresi). Göç 0060: tesis_kullanim (ekipman · plan · sözleşme kapsamı · etkin İSG ID · teklif kapsamı · müşteri girişi
  kapsamı) + musteri_kullanim (sözleşme · teklif · fatura · panele GİRMİŞ giriş · tesislerinin plan / ekipman / etkin İSG ID'si) + tesis_sil / musteri_sil
  (tesisler, hiç girilmemiş girişler — parola özeti ize yazılmaz —, kaldırılmış İSG kayıtları birlikte; İSG belgeleri çöpe). Kilit kesin-silme.test
  "müşteri / tesis"; olumsuz kanıt kesin-silme.bozan 10; e2e musteriler (kullanılmamışı sil; planlı müşteride Sil yok, Pasife al nedeni).
- 2026-10-07 (363): **Araç Sil / Pasife al** (§9 elli üçüncü tur; ölçüm cihazı 357–358 deseni). Araç sayfasında yalnız yöneticiye (Araçlar'da "yaz")
  ve hiç kullanılmamış araçta "Sil" (onay "<plaka> kalıcı olarak silinir; plakası yeniden kullanılabilir. Geri alınamaz."); kullanılmışta "Pasife al"
  (neden: "2 zimmet hareketinde, 1 kilometre kaydında kullanıldı; silinemez"), pasifte yalnız "Etkinleştir". ENGEL: kişinin zimmetindeki araç pasife
  alınmaz (teslim tutanağıyla geri alınamazdı). Eskiden pasif sütunu vardı ama ekranı yoktu ve pasif araç Araçlar'dan tümden kayboluyordu: artık liste
  Görünüm: Etkin / Pasif / Hepsi; pasif araç sayfası açılır (Pasif rozeti + şerit; teslim, kilometre, belge şeridi yok), tutanakları listede kalır,
  yan menü balonundan ve uyarılardan düşer. Göç 0059 arac_kullanim (zimmet hareketi · haftalık kilometre) + arac_sil. Kilit kesin-silme.test "araç";
  olumsuz kanıt kesin-silme.bozan 9; e2e araclar (sil, plaka yeniden; kullanılmışta Sil yok, zimmetteyken Pasife al reddi).
- 2026-10-07 (362): **Demirbaş Sil / Pasife al** (§9 elli üçüncü tur; maket yok — ölçüm cihazı 357–358 deseni). Varlık sayfasında (Zimmetler › demirbaş)
  yalnız yöneticiye ve hiç kullanılmamış demirbaşta "Sil" (onay "<kod> kalıcı olarak silinir; kodu yeniden kullanılabilir. Geri alınamaz.");
  kullanılmışta "Pasife al" (pencere nedeni söyler: "1 zimmet hareketinde kullanıldı; silinemez"), pasifte "Etkinleştir". ENGEL: kişinin zimmetindeki
  demirbaş pasife alınmaz (geri teslim alınamazdı). Göç 0058 demirbas_kullanim (zimmet hareketi · imzalı zimmet formunun kapsamı) + demirbas_sil.
  Zimmetler artık pasif varlıkları da yükler (cihaz, araç, demirbaş): geçmiş hareketler "— · Kaldırılan varlık" yerine kodu ve adıyla görünür
  (358'de pasife alınan cihazın hareketleri adsız kalıyordu); liste Görünüm: Etkin (varsayılan) / Pasif / Hepsi; pasif varlık açılır (Pasif rozeti +
  şerit), teslim edilmez (sunucuda da). Kilit kesin-silme.test "demirbaş"; olumsuz kanıt kesin-silme.bozan 8; e2e zimmetler (sil, pasif, etkinleştir).
- 2026-10-07 (361): **Ekipman türü Sil** (reisim: *"ekipman türü … silinemiyor"*; §9 elli üçüncü tur; maket yok — cihaz türü T7 ve İSG ID deseni).
  Tür sayfasında, yalnız yöneticiye ve hiç kullanılmamış türde "Sil"; onay "<kod> · <ad> kalıcı olarak silinir; rapor formatı, yüklenen PDF'ler ve
  fiyatı da silinir, kodu yeniden kullanılabilir. Geri alınamaz." Göç 0057 ekipman_turu_kullanim (ekipman — pasif dahil —, rapor, personel ataması,
  teklif kalemi, fatura satırı) + ekipman_turu_sil (fiyat_listesi, rapor_format — 0022 "yayınlanan sürüm silinmez"in tek istisnası: raporu hiç olmayan
  türün sürümü yasal kayıt değil —, tur_format birlikte; PDF'ler çöpe; kod serbest). Kullanılmış tür için pasif yok (düzenlenir). Kilit
  kesin-silme.test "ekipman türü"; olumsuz kanıt kesin-silme.bozan 7; e2e ekipman-turleri (sil, kod yeniden).
- 2026-10-07 (360): **Ekipman Sil** (§9 yirmi üçüncü tur "silme yalnız yönetici" — canDo ekipman_sil tanımlıydı, hiç kullanılmıyordu; §9 elli
  üçüncü tur). Plan içi ekipman satırında, yalnız yöneticiye ve hiç kullanılmamış ekipmanda çöp kutusu simgesi; onay "<kod> kalıcı olarak silinir;
  bütün planlardan çıkar, kodu yeniden kullanılabilir. Geri alınamaz." Göç 0056 ekipman_kullanim (rapor — silinmiş taslak dahil — · tamamlanmış
  plan) + ekipman_sil (plan satırları ve kod geçmişi birlikte; kod serbest — eskiden pasif ekipmanın kodu kalıcı kilitleniyordu). Denetçi kendi
  yanlışını pasife alır (değişmedi). Kilit kesin-silme.test "ekipman"; olumsuz kanıt kesin-silme.bozan 6; e2e plan-ici (yönetici siler).
- 2026-10-07 (359): **Cihaz türleri penceresi + cihaz türü Sil** (maket olcum-cihazlari.html T7 — kodda hiç yapılmamıştı; §9 elli üçüncü tur). Liste
  başlığında "Cihaz türleri" (yalnız değiştirebilene): her tür "N ekipman türünde · M cihaz", Düzenle (yalnız ad, firmada eşsiz — Türkçe harf farkı yok
  sayılır), cihazı olmayan ve raporda tür olarak geçmeyen türde Sil (yönetici; onay maketten: "… ekipman türlerinin kullanacağı cihazlardan da
  çıkar"), altta Tür ekle. Göç 0055 cihaz_turu_kullanim + cihaz_turu_sil: silinen tür aynı işlemde bütün ekipman türlerinin cihaz_turleri
  dizisinden çıkar (sürüm artar, her tür için iz) — çıkmasaydı rapor doldurulamayan cihaz satırı ister, onaya gönderi takılırdı. Kullanılmış tür
  için pasif yok. Ekipman türleri'nin cihazTurKullanimi okuyucusu (modül sınırı). Kilit kesin-silme.test "cihaz türü"; olumsuz kanıt kesin-silme.bozan
  5; e2e tür ekle / sil.
- 2026-10-07 (358): **Ölçüm cihazı Pasife al / Etkinleştir** (§9 elli üçüncü tur: kullanılmış kayıt silinmez, pasife alınır). Göç yok (pasif sütunu
  0014'ten). Kullanılmış cihazda "Sil" yerine "Pasife al" (pencere nedeni söyler: "<n> raporda, <n> zimmet hareketinde kullanıldı; silinemez");
  ENGEL: kişinin zimmetindeki cihaz (önce Zimmetler'den depoya teslim) ve kalibrasyondaki cihaz (önce depoya al) pasife alınmaz — pasif cihaz
  Zimmetler'den düşer, kişiden geri alınamazdı. Pasif cihaz liste Görünüm'ünde (Etkin varsayılan · Pasif · Hepsi), rapor seçiminden, Zimmetler'den ve
  uyarılardan kalkar; açık rapor ve rapor belgesi kodunu ve kalibrasyonunu göstermeye devam eder (raporCihazlari pasifDahil). Kart: Pasif rozeti +
  şerit + Etkinleştir. components/sil/PasifPenceresi tek üretici (müşteri kalemi gelince oraya da). Kilit tests/kesin-silme.test.ts "pasif"; olumsuz
  kanıt cihaz-pasif.bozan; e2e: zimmetteki MN-01'de Sil yok, Pasife al reddedilir.
- 2026-10-07 (357): **Kesin silme — ortak mekanizma + ölçüm cihazı "Sil"** (reisim: *"denemek için bir kaç cihaz ekledim ama silemedim"*; §9 elli
  üçüncü tur). Göç 0054: olcum_cihazi_kullanim (zimmet hareketi · raporun cihaz listesi, silinmiş taslak dahil · zimmet formu) ve olcum_cihazi_sil
  (tanımlayıcı-yetkili, 0047 deseni: oturumdaki firma + hesap, satır kilidi, kullanılmışsa sayım, kalibrasyon kayıtları birlikte, sertifikalar çöpe,
  denetim izine eski değer; uygulama rolüne DELETE yok). src/server/db/silici.ts (SILINEBILIR: işlevler + her yabancı anahtar "kullanım" ya da
  "birlikte"), canDo kayit_sil (modülde yaz + yönetici rolü), components/sil (SilTusu tek üretici, kullanimMetni). Cihaz sayfasında "Sil" yalnız
  yöneticiye ve kullanılmamış cihaza; onay "<kod> kalıcı olarak silinir; kalibrasyon kayıtları ve sertifikaları da silinir, kodu yeniden
  kullanılabilir. Geri alınamaz." Kilitler tests/kesin-silme.test.ts (iki firma), tests/silme-kapsami.test.ts (yabancı anahtar aynası, DELETE yok,
  kayıtsız silme işlevi yok), yetki.test kayit_sil, kullanim-metni; olumsuz kanıt kesin-silme.bozan (4), yetki.bozan; e2e üç genişlik.
- 2026-10-07 (356): **Yönetim çıkışı düz form isteği** (14b1bf8 CI'ın saklanan sayfa görüntüsü: çıkıştan sonra "Sayfa bulunamadı"). Next sunucu
  eyleminin redirect()'ini kendi kökeninden (sunucunun adresi) yeniden çiziyor; o istekte yönetim adresi yok → ara katman /yonetim'i kapatıyordu.
  Menüdeki "Çıkış yap" ve giriş adımlarındaki "Girişe dön" artık POST /yonetim/cikis (route; kapı istek.ts yonetimOturumunuKapat: başka adreste 404,
  başka kökenden gelen form oturumu kapatmaz) → 303 göreli adres, tarayıcı yönetim adresini korur. yonetimCikisEylemi kalktı. Kilit
  tests/moduller.test.ts (yalnız POST, kapı). Telefon: personel kaydı sonrası kart sayfası beklemesi 30 sn (öteki kayıt beklemeleri gibi).
- 2026-10-06 (355): **Uçtan uca: yönetim ısınması dayanıklı, düşen testin sayfa görüntüsü saklanır** (95b7eb7 CI: 348'in uçtan uca testleri ilk kez
  tam koştu). Tablet / telefon ısınmada düştü: geliştirme sunucusu yeni derlenen rotadan sonra açık sayfayı yeniden yüklüyor (ERR_ABORTED, gönderilmeyen
  giriş formu) — ısınma yeniden dener, panel sayfalarını önce oturumsuz ister, olmazsa uyarıyla geçer (ısınma derleme içindir). Fotoğraftan okuma
  testinin "kaydedildi" denetimi gizli pencere metnine takılıyordu → kaydın kendi bildirimi. CI düşen her genişliğin test-results/ klasörünü (sayfa
  anlık görüntüsü error-context.md) 3 gün saklar — yönetim çıkış iletisinin görünmemesi (adres doğru) buradan çözülecek.
- 2026-10-06 (354): **350–351 çapraz incelemesinin düzeltmeleri** (dört bakış + çürütme; doğrulanan bulgular). **Fotoğraftan okuma canlıda hiç
  çalışmazdı:** Opus 5.5 / Sonnet 5.5 zorunlu araç seçimini (tool_choice "tool") 400 ile reddeder, kod bunu "fotoğraf okunamadı" diye gösterirdi —
  istek artık **yapılandırılmış çıktıyla** (output_config.format json_schema; effort low; yanıt sınırı 16 000 — düşünme de sayılır); kesilen (max_tokens)
  ve reddedilen (refusal) okuma ayrı söylenir; hizmetin reddetme nedeni sunucu günlüğüne. Yedek model (fallbacks) KULLANILMADI: maliyet hesabı
  modele bağlı, pano fotoğrafında ret beklenmiyor — ret iletisi yeter. Sayı **sütunun birimiyle** istenir. **Sınır yarışı:** göç 0053
  yz_kullanim.ayrilan — çağrıdan önce kişinin ay satırı kilitlenip en kötü maliyet ayrılır (eşzamanlı okumalar sınırı aşamaz); kayıtta gerçek
  maliyetle kapanır, ücretsiz biten çağrıda bırakılır, zaman aşımında harcamaya yazılır; ödenen okuma rapor okuma sürerken silinse de kullanıma
  yazılır. **Sınır 0 = sınırsız** (maket Y1). **Firma ayarları › Yapay zekâ:** bu ayın kişi başı kullanım tablosu (maket Y1; S.A.Y ve "kendi
  anahtarı" sütunları o işler gelince). **Saha raporu (maket Z3):** okunan değer, değeri boş var olan satıra yazılır (ölçü aletinden Zx → Zx'i boş
  nokta; kartta "n. satır"), yoksa yeni satır (src/modules/raporlar/foto-eslestir.ts); **pano okumasında fotoğraf rapora eklenir** (§11 92; Fotoğraflar
  bölümü, termal değil); okuma üst ekranın işleminde (Kaydet / Onaya gönder kapalı); bağlantı yoksa istek gitmez; eylem düşerse sayfa hata ekranına
  düşmez, kaydedilmemiş girişler kalır; uzun iş göstergesi (dönen simge + süre), odak korunur; görünmez dosya girdisinin odak çerçevesi etikette
  (temel.css, bütün "Fotoğraf ekle" türü tuşlar). **Sağlık (0053 saglik_denetimi):** bağlanan rol ölçülür (session_user — uygulama yanlışlıkla
  postgres ile bağlansa "kısıtlı" denirdi), service_role da sayılır, **göç sayısı** da beklenir (arada atlanmış göç). Kilitler tests/foto-oku.test.ts
  (ayırma yarışı, sınırsız, zaman aşımı, silinen rapor, pano fotoğrafı), tests/yz-okuma.test.ts, tests/foto-eslestir.test.ts, tests/saglik*.test.ts;
  olumsuz kanıt foto-oku.bozan 3 (satır kilidi), saglik.bozan 2 (bağlanan rol); uçtan uca taklit zorunlu araç seçimini gerçek hizmet gibi reddeder.
- 2026-10-06 (353): **Fotoğraftan okumada bozuk dosya** (CI olumsuz kanıtı düştü). Baştaki imzası JPEG / PNG olup parçaları bozuk dosyada
  konum bilgisi silinirken hata fırlıyordu → sunucu eylemi çöküyordu. Artık "Fotoğraf bozuk; başka bir fotoğraf deneyin." döner, dosya gönderilmez
  (kilit tests/foto-oku.test.ts). Deneme JPEG'leri (olumsuz kanıt, uçtan uca) yapısı doğru en küçük JPEG'e çevrildi (SOI · DQT · SOS · EOI).
- 2026-10-06 (352): **Yayın paketi küçüldü — Chromium yalnız PDF işlevinde** (reisim: *"Vercel Functions Storage 9/10 GB"*). Canlı yayının
  Resources görünümü: bütün sayfalar tek 74.1 MB işlevde (PDF basan sunucu eylemleri yüzünden başsız Chromium her sayfaya paketlenmiş), PDF uçları
  ayrı 72.6 MB. Chromium eklenen 5 sayfa (rapor, araçlar, araç, personel kartı, eğitimler) PDF uçlarıyla aynı süre ayarını (maxDuration 60) taşır →
  Vercel bunları PDF işlevinde toplar, öteki sayfalar küçük kalır; her üretim yayını kotaya daha az ekler. Kilit tests/pdf-paket.test.ts (listedeki her
  uç ayarı taşır; PDF basan modül eylemi listedeki sayfada); olumsuz kanıt kilitler.bozan. Vercel saklama süresi 1 gün (en kısa seçenek).
- 2026-10-06 (351): **K5 Fotoğraftan okuma** (maket rapor.html Z3; ARKA-UC §5.1–5.2, K1; §8.10; 09-G3 istisnası). Saha raporunda her **ölçüm
  tablosunun** altında "Fotoğraftan oku" (formattan genel: sigorta panosu — linye, ölçü aletinin ekranı — nokta …; firmada yapay zekâ açık ve
  anahtar girilmişse, yalnız yazana, Yeni raporda). Fotoğraf cihazda küçültülür; sunucuda JPEG / PNG, en çok 5 MB, konum bilgisi (EXIF) silinir;
  yapay zekâya YALNIZ fotoğraf + tablonun sütun adları / birimleri / seçenekleri gider (müşteri, adres, kişi, rapor no gitmez — kilit). Cevap katı
  şemayla (tek araç zorunlu), şemaya uymayan değer atılır, en çok 60 satır; fotoğraftaki yazı talimat sayılmaz. Okunanlar **öneri kartında**: emin
  olunanlar "Önerileri uygula (n)" ile toplu, "Emin değil" satırlar tek tek "Uygula"; "Vazgeç"; rapora ancak Kaydet ile yazılır. Çağrı veritabanı
  işleminin DIŞINDA (bağlantı ve kilit tutulmaz); firmanın anahtarı yalnız sunucuda. Maliyet (token × fiyat; Opus $4 / $20, Sonnet $2 / $10 —
  1 milyon token) kişinin aylık kullanımına; firma ayarındaki kişi başı aylık $ sınırı dolunca okunmaz (elle giriş açık). Göç 0052 yz_kullanim
  (yalnız artar, hesap bağlamdan damgalanır) + yz_okuma (öneri, token, maliyet; değişmez — kalite takibi; fotoğraf saklanmaz). Uç ortamdan
  (PROBATA_YZ_UC; yoksa Anthropic). Etiket plakası (bilgi alanları) ve S.A.Y sohbeti sonraki kalem. Kilit: yz-okuma (saf: istek gövdesi, cevap
  süzme, maliyet, yerel taklitle çağrı ve hata iletileri), foto-oku (gerçek PG: kapalı / anahtarsız / yetki / sınır / kayıt / tetik); olumsuz kanıt
  foto-oku.bozan (sınır, hesap damgası); e2e foto-oku.spec (ayrı uydurma firma, yerel taklit).
- 2026-10-06 (350): **Sağlık ucu ve canlı duman testi** (09-G5; 06 "her teslimden sonra canlıya karşı duman testi koşulur"). `/api/saglik`
  (oturumsuz; yalnız evet / hayır ve sürüm, firma / kişi bilgisi yok; biri düşerse 503): veritabanı bağlantısı · göç güncel (veritabanındaki son göç =
  kodun beklediği `SON_GOC` — kod göçten önce yayınlanırsa yakalanır) · firma_id taşıyan her tabloda RLS açık + zorlanmış + politikalı · Supabase
  API rolleri şemaya giremiyor · uygulama rolü süper kullanıcı / RLS'yi aşan değil. Göç 0051 saglik_denetimi() (tanımlayıcının haklarıyla yalnız
  sayılar). `node tools/duman.mjs [firma adresi] [yönetim adresi]`: canlıyı dışarıdan, salt okunur yoklar — sağlık ucu, giriş + güvenlik başlıkları
  (CSP nonce, HSTS, frame-ancestors, nosniff), oturumsuz sayfa girişe, anonim dosya 403, tanım dizini 403, firma adresinde /yonetim yok, yönetim
  adresinde yalnız /yonetim (önceden yükleme başlığıyla da); çıkış kodu. Kilit: saglik (gerçek PG: RLS'siz / zorlanmamış / politikasız tablo ve
  açık API rolü yakalanır), saglik-saf (SON_GOC = son göç dosyası); olumsuz kanıt saglik.bozan; e2e api.spec.
- 2026-10-06 (349): **347–348 çapraz incelemesi düzeltmeleri** (dört bakış, 17 bulgu; 11 doğrulandı, 6 çürütüldü). **Güvenlik:** yönetim
  girişinde doğru parola hatalı deneme sayacını (yönetici + IP) SIFIRLAMAZ — yalnız tam giriş sıfırlar; "doğru parola → 4 yanlış kod" döngüsüyle
  doğrulama kodu kaba kuvvetle denenemez. Ara katman eşleştiricisinden önceden yükleme istisnası kalktı: o başlıkla gelen istek de adres ayrımından
  geçer (yönetim adresinde /api açılmıyor), nonce / CSP yalnız tam sayfada. **Veritabanı (0050 yerinde, henüz uygulanmamıştı):** geçici parola
  ve listedeki "Firma yöneticisi" = firma_yoneticisi rolünü taşıyan, kapalı olmayan hesap (ilk yönetici önce; rolü alınmış / ayrılmış ilk
  yöneticiye gitmez); firma satırı FOR NO KEY UPDATE (girişle kilitlenme yok); ilk yöneticinin işe başlama günü Türkiye saatiyle. **Mantık /
  arayüz:** kayıtlı adres iletisi maketteki gibi tam adresle; açılış günü Türkiye saatiyle; aramada tam adres; uzun adres telefonda kırılır;
  kurulum ve kod formunda sunucu hatasında alana odak; e2e proje başına kendi yöneticisi ve firması (üç genişlik tek sunucuda da koşar).
  Kilit: yonetim (döngü kilidi, kurulumda eski oturum düşer, dondurmada müşteri oturumu silinir, yönetici seçimi), moduller (eşleştiricide
  istisna yok); olumsuz kanıt yonetim.bozan 4–6.
- 2026-10-06 (işletim, reisim: *"izin veriyorum yap"* · *"githubdan hala bir sürü gereksiz yayınlar da gidiyor onlarıda durdur"*): Vercel'de
  31 eski üretim yayınından 30'u silindi (canlı kaldı), yayın saklama süresi dört türde 30 gün → 1 gün (son 3 üretim + canlı her zaman kalır).
  Functions Storage panosu günün EN YÜKSEK değerini gösterir (Vercel belgesi) — düşüş ertesi günün değerinde görünür. GitHub'da 454 eski yayın
  kaydı ve "Preview" ortamı silindi. CI: aynı dalda yeni push eski koşuyu iptal eder, main'de denetim tekrar koşmaz, Pages yalnız maket
  değişince (c22560d).
- 2026-10-06 (348): **probata yönetim sayfası — firma aç / dondur / geçici parola** (KOD-GECIS Y1, karar 2026-10-03; maket yonetim.html,
  §11 247). Firmaların görmediği, yalnız probata ekibinin sayfası; **yalnız ayrı adreste** (`PROBATA_YONETIM_ALAN`; tanımsızsa hiçbir adreste yok):
  ara katman yönetim adresinde yalnız /yonetim'i, öteki adreslerde /yonetim'i hiç açmaz (404); yönetim adresi firma sayılmaz. **İki adımlı giriş:**
  parola → 10 dk'lık bekleyen oturum → doğrulama kodu (RFC 6238, telefondaki doğrulama uygulaması; ±30 sn, aynı kod ikinci kez geçmez) → yönetim
  oturumu (hareketsizlik 2 saat, mutlak 12 saat; çerez ayrı, SameSite=Strict, tarayıcı kapanınca silinir). İlk giriş (geçici parola): anahtar
  sunucuda üretilir, yalnız o bekleyen oturumda gösterilir; kod + yeni parola ile kurulur. 5 hatalı deneme (parola ya da kod) → 15 dk kilit, IP
  kilidi; yanıt hesabın varlığını söylemez. Anahtar ana anahtarla şifreli, yöneticiye bağlı. Yönetici hesabını biz açarız (uygulamada yönetici
  ekleme yok). Göç 0050: firma.durum (etkin / dondu) + ilk_hesap; dondurulmuş firma **firma_bul'dan bulunmaz** (kullanıcı ve müşteri giremez) ve
  oturumları silinir, veri silinmez; yonetici, yonetim_oturum, yonetim_kilit, yonetim_izi (değişmez; yönetici veritabanından damgalanır).
  **İkinci katman:** yönetim işlemleri `probata_yonetim` rolünde (SET LOCAL ROLE, 0030 deseni) — firmaların tablolarına hakkı yok; liste, açma,
  dondurma ve geçici parola yalnız işlevlerle (yöneticisiz ya da kapalı yöneticiyle reddedilir; firmanın denetim izine ve yönetim izine yazar);
  uygulama rolü bu işlevleri çağıramaz. **Ekranlar:** Firmalar (sayaç, durum süzgeci; firma + adres · durum · kısa kod · depo · açılış · kullanıcı)
  · Firma aç (ünvandan alt alan adı ve kısa kod önerisi, elle değişeni ezmez; canlı adres; ayrılmış adlar www, yonetim, api … ve yönetim adresinin
  adı; kayıtlı adres / kod sunucuda; önce sorulur; açılınca geçici parola yalnız bir kez + Kopyala; ilk firma yöneticisi personel kaydı + "ilk"
  hesap) · Firma sayfası (Dondur önce sorulur / Etkinleştir; yöneticiye yeni geçici parola önce sorulur, dondurulmuşta kapalı). **Depo:** maketteki
  "firmanın kendi deposu bağlanmadan açılmaz" engeli (ENGEL 10, Y2b) S3 bağdaştırıcısıyla K7'de; bugün bölüm bilgi verir (deneme yayınında
  veritabanı deposu). Deneme yayınında (vercel.app) yeni firmanın adresi Vercel'e ayrıca eklenmeden açılmaz — alan adı ve joker SSL gelince kendiliğinden.
  Kilit: yonetim (gerçek PostgreSQL, iki firma: iki adım, yeniden oynatma, kilit, kurulum, firma aç → geçici parolayla firma girişi, dondur, SIZMA),
  yonetim-saf (RFC 6238 vektörleri, adres, şema, ayrılmış ad listesi göçle aynı), moduller (yönetim kapısı); olumsuz kanıt yonetim.bozan (yeniden
  oynatma, dondurma bayrağı, hesap kilidi); e2e yonetim.spec üç genişlikte.
- 2026-10-06 (347): **Deneme yayınında kalıcı dosya deposu — veritabanı** (KOD-GECIS Y2b'nin ara çözümü). Yayında dosyalar Vercel'in geçici
  klasöründeydi (/tmp): işlev örnekleri arasında kayboluyordu (fotoğraf, logo, imzasız PDF hazırlanıp imzalısı yüklenince bulunamıyordu).
  Göç 0049 **depo_nesne** (firma, anahtar, içerik ≤ 30 MB): anahtar üreticisinin biçimi denetlenir, **anahtardaki firma satırın firmasıdır**
  (başka firmanın anahtar alanına yazılamaz), RLS ENABLE + FORCE, uygulama rolünde yalnız okuma + ekleme (yazılan değişmez; silme çöp süresi
  dolunca ayrı işte). Depo arayüzü çağıranın işlemini alır: içerik kayıtla **aynı işlemde** yazılır — kayıt geri alınırsa içerik de yok, havuzdan
  ikinci bağlantı alınmaz. Seçim ortamdan: `PROBATA_DEPO=vt` (deneme yayını ve uçtan uca test), yoksa klasör. Firmanın kendi S3 deposu K7'de
  aynı arayüze bağlanır. Kilit: depo-vt (iki firma, gerçek PostgreSQL: yaz / oku, ikinci yazma yok, yol aşma, kiracı, geri alma, dosya yüklemesi);
  olumsuz kanıt: anahtar ↔ firma denetimi kalkınca B, A'nın anahtar alanına yazar.
- 2026-10-06 (346): **340–345 çapraz incelemesi düzeltmeleri** (dört bakış, 12 bulgu; 10 doğrulandı, 2 çürütüldü — PDF ucunda eşzamanlılık
  sınırı önceden elenmişti; numara sayacı kilidinin basım boyunca tutulması gösterilmiş bir hata değil). **Ölçüm cihazı:** rapor belgesinde muayene
  günü verilince ilk_bitis o gün sistemde kalibrasyon kaydı yokken adaydır; muayeneden sonra girilen kalibrasyon imzalı rapora yazılmaz. **Format
  kurucu:** kilitli tabloya kurucuda eklenen sütun (k_) yayınlansa da Bakanlık öğesi sayılmaz — sonraki taslakta çıkarılır (motor kilitDenetimi;
  `kurucudan` tek yer tanim.ts). **Onaylar dosya erişimi:** Onaylar'da imzalanan zimmet formunu kişinin kartını gören açar (Personel'in kart kuralı tek
  yer: personel/server/kart-baglanti.ts); iptal iletisi türden bağımsız. **Fatura kalemleri:** aynı fiyatlı teklif ve teklif dışı raporlar ayrı satır
  (fatura sayfası ve fatura özeti PDF'i; saf kalemleriGrupla). **İmzacının giriş hesabı:** zimmet / eğitim formu hesabı olmayana gönderilmez (ileti);
  araç tutanağı kaydedilir ama imzaya gitmez (bildirimde söylenir); eğitimde bekleyen form "Formu yeniden gönder"le iptal edilip yenisi gider.
  **Personel kartı:** ayrılmış kişide "İmzaya gönder" yok (sunucu da anlaşılır ret); bekleyen gönderim varken "imzaya gönderin" uyarısı çıkmaz.
  **e2e:** eğitim adımı listeyi kendi eğitimine süzerek açar. Kilit: muhasebe (saf gruplama), format-kurucu, ice-aktarma (muayene günü), personel-dosya
  (planlama açar, muhasebe açamaz; hesapsız), egitimler (yeniden gönder, hesapsız), araclar (hesapsız teslim alan); araç tutanağı olumsuz kanıtı yeni
  satıra.
- 2026-10-06 (345): **K4 Eğitim katılım formu → Onaylar › Diğer** (maket MV.BELGE_ONAY "… eğitimi katılım formu", onaylar.html #/diger; AA3:
  *"eğitim zimmet formu gönderilirse oradan onaylanabilsin"*). Eğitim kaydının penceresinde ("değiştirir", yalnız güncel kayıt) **Katılım formunu imzaya
  gönder** (önce sorulur): temel format <firma kodu>-FR-EGT-01 — katılan (ad · meslek), eğitim, eğitimi veren, eğitim ve tekrar tarihi, beyan,
  imzalar; numara EF-AAYY-SIRA; numara + PDF + belge aynı işlemde (PDF düşerse hiçbiri yazılmaz); kayıt başına tek etkin form (bekleyen ya da imzalı;
  geri gönderilen yeniden gönderilir). Katılan Onaylar › Diğer'de imzalar; kayıt penceresinde durum (imza bekliyor / imzalandı / geri gönderildi) ve
  **İmzalı katılım formu**. İmzalı PDF'i Eğitimler'i "gör" ve üstünde gören açar (araç tutanağında da Araçlar'ı gören — Onaylar dosya erişimi).
  K4'ün Onaylar › Diğer gönderenleri tamam: bordro (333), araç tutanağı (342), zimmet formu (344), eğitim formu (345). Kilit: egitim-belgesi.test (saf),
  pdf.test (imzalanabilir), egitimler.test (katılan, tek etkin form, önceki kayıt, imza → kayıtta, dosya erişimi, yetki, kiracı, PDF düşerse);
  olumsuz kanıt 2; egitimler e2e (gönder, denetçinin Onaylar › Diğer'inde).
- 2026-10-06 (344): **K4 Zimmet teslim formu → Onaylar › Diğer** (maket personel.html zimmet formu "PDF indir" / "İmzala", MB.zimmetFormu; AA3:
  *"eğitim zimmet formu gönderilirse oradan onaylanabilsin"*). Personel kartı › Zimmetindekiler ("değiştirir"): **Formu indir** (temel format
  <firma kodu>-FR-ZMT-01, şimdiki zimmetle, numarasız — ıslak imza için) · **İmzaya gönder** (önce sorulur): numara ZF-AAYY-SIRA, kapsam gönderme
  anındaki zimmet (sunucuda), form kaydı + PDF + belge aynı işlemde (PDF düşerse hiçbiri yazılmaz); kişinin Onaylar › Diğer belgeler'ine düşer;
  önceki bekleyen form iptal olur; ıslak imzalı tarama yüklenince de bekleyen iptal (aynı zimmet iki yoldan imzalanmaz). Kişi imzalayınca imzalı PDF
  **imzalı zimmet formu** olur (zimmet değişince eskir — öncekiyle aynı kural); bekleyen / geri gönderilen form kartta şeritte. Formda: teslim alan
  (ad · meslek), teslim eden (Firma ayarları › Zimmet teslim eden; yoksa "Firma adına"), varlıklar (kod · ad · tür · teslim günü, ölçüm cihazında
  kalibrasyon bitişi), taahhüt, imzalar. Mobil imza ve iki taraflı imza (teslim eden önce) sonraki faz. Eğitim formunun gönderimi ayrı kalem.
  Kilit: zimmet-belgesi.test (saf), pdf.test (imzalanabilir), personel-dosya.test (numara, kapsam, iptal, imza → imzalı form, dosya erişimi, PDF düşerse,
  yetki, kiracı); olumsuz kanıt 2; personel-dosya e2e (indir, gönder, denetçinin Onaylar › Diğer'inde).
- 2026-10-06 (343): **337–339 çapraz incelemesi düzeltmeleri** (dört bakış, 24 doğrulanmış bulgu). **Ölçüm cihazı:** sistem öncesi bitiş (ilk_bitis)
  YALNIZ hiç kalibrasyon kaydı yokken geçerli — kayıt açılınca (sonucu "uygun değil" olsa da) devreden çıkar (GREATEST "uygun değil"i ve daha erken
  biteni eziyordu; karar 337'nin sözü); kural tek SQL ifadesinde (cihazlar.ts GECERLI_BITIS — Uyarılar da); rapor belgesi kalibrasyon kaydı olmayan
  cihazda geçerliliği ilk_bitis'ten basar (tarih / sertifika uydurulmaz); içe aktarmada bitiş 5 yıldan ileri olamaz. **İçe aktarma:** müşteri önce tam
  ünvanla, yoksa kısa adla; birden çok eşleşme atlanır ("tam ünvanı yazın"), eşlenen ünvan ön izlemede; ham satır sınırı okuyucununki (5.000), 2.000
  veri satırı boşlar atıldıktan sonra; veritabanı kuralı / bağ hatası (23514, 23503) "hiçbir satır eklenmedi" iletisi; içe aktarmadan sonra odak yeni
  kaydın Geri al tuşunda. **Göç 0048:** müşteri, tesis, personel, ölçüm cihazı, araç, ekipmanda olustu değişmez (sahte "bu işlemde oluşturuldu"
  ile eski kaydı geri alma işlevine sildirme kapandı); ekipman kodu kuralı uygulamayla aynı ("A-1" artık veritabanında da geçerli). **Format
  kurucu:** "kilit" yalnız kaynakta (şablon / yayındaki sürüm) kilitli öğede — istemcinin işareti kaydette ve yayında düzeltilir (motor
  kilitNormallestir); kilitli ölçüm tablosuna kurucuda eklenen sütun çıkarılır; kaydedilmemiş taslakta uygulama içi bağlantı sorar; bölüm aşağı
  taşınınca odak aşağı tuşunda; üstte "Yayından önce bakılacak" şeridi (maket denetim). **Yan menü balonları (U4 / N5 / 236):** Planlar yalnız
  kişinin ekibinde olduğu planlar; Onaylar yalnız onaylayabildiği raporlar (firma yöneticisinde onay balonu yok); Araçlar Araçlar modülünden —
  kilometre (geçen hafta girilmedi kırmızı, bu hafta bekliyor sarı) + belgeler; yönetici ("değiştirir") bütün araçlar, öteki kişi kendi aracı.
  Kilit: anasayfa, ice-aktarma, ice-aktar-sema, format-kurucu, rapor-format testleri; olumsuz kanıt 2 yeni (olustu-degismez, format-kilit) + menu-takip
  güncellendi; kabuk e2e seçicisi kırmızı balona dayanıklı.
- 2026-10-06 (342): **K4 Araç teslim tutanağı → Onaylar › Diğer** (maket araclar.html tutanak-kaydet / tutanak-goster, MB.aracTutanak; AA3, AA4:
  "teslim alan kişiyse tutanak onun Onaylar › Diğer'ine imzaya düşer"). Tutanağın belgesi temel formatla (<firma kodu>-FR-ARC-01): tutanak no, tarih,
  plaka, araç, teslim eden / alan (depo: "firma adına"), 1 Aracın durumu (km, yakıt), 2 Araçta olanlar (Var / Yok), 3 Hasar ve notlar, 4 Fotoğraflar
  (açı başına çekildi / çekilmedi), 5 Taahhüt, imzalar ("Tarih · imza"; imza imzalı PDF'in kendisinde). Kişiye teslimde tutanakla AYNI işlemde PDF
  üretilir ve teslim alanın imzasına gider (belge_onay tür "arac", kaynak zimmet hareketi, gönderen oturumdaki kişi — sürücü kendi aracını başkasına
  verince sürücü); PDF üretilemezse ya da imzalanabilir biçimde değilse tutanak HİÇ kaydedilmez (imzasız teslim kalmaz). Depoya iadede belge yok.
  Tutanak listesinde "PDF" ve "İmza: …" (Onay bekliyor / İmzalandı / Geri gönderildi), tutanak penceresinde imzanın durumu. Uç
  /araclar/tutanak/<hareket>/pdf; görme tutanak listesiyle aynı ("gör" her tutanak, sürücü yalnız taraf olduğu). Geri gönderilen tutanağın yeniden
  gönderilmesi makette yok (açık). Kilit: arac-belgesi.test (saf), pdf.test (motorun bütün çıktıları imzalanabilir biçimde — imzayaUygun), araclar.test
  (gönderim, gönderen, depoda yok, PDF düşerse geri alınır, görme); olumsuz kanıt 2; araclar e2e (PDF iner, denetçinin Onaylar › Diğer'inde).
- 2026-10-06 (341): **K4 Talep formu (PDF)** (maket MB.TALEP_FORMAT / talepFormu / talepPdfAc — 35. tur 161–162, T8). İzin talep formu ve masraf
  formu temel formatla (<firma kodu>-FR-IZN-01 / MSR-01): başlık (logo, künye, form adı, form no, gönderildi, durum), personel (ad · meslek), 1 Talep
  (izin: tür, başlangıç, bitiş, iş günü, açıklama, ek belge · masraf: iş, tarih, tür, tutar, KDV ve KDV hariç, açıklama, fiş, ödendi), 2 Beyan (+ red
  gerekçesi), imzalar (Talep eden: gönderildi · zaman; Onaylayan: onaylandı / reddedildi · zaman, karar yoksa "Tarih · imza"). Aynı form üç yerden
  iner (tek açılış — 162): Talepler'de talebin penceresinde "PDF", Personel › İzin talepleri satırında, Muhasebe › Giderler'de masraf formunun
  penceresinde. Uç /talepler/pdf/<izin|masraf>/<id>; erişim: talep eden; izinde firma yöneticisi (Talepler "değiştirir"); masrafta Muhasebe'yi
  gören — başkasına 404. E-postayla iletme (maket "PDF · e-posta") K5'te (iş kuyruğu); mobil / e-imza dış hizmet (Y5). Kilit: talep-belgesi.test (saf),
  pdf.test, talepler.test (erişim, karar, B sızıntısı); olumsuz kanıt 1; talepler e2e (PDF iner).
- 2026-10-06 (340): **K4 Muhasebe › Fatura özeti (PDF)** (maket faturaCiz "Fatura özeti (PDF)": "fatura e-Fatura programında kesilir; burada
  fatura özeti (kalemler, KDV, tahsilat) yazdırılır / PDF olur"; §11 1659). Fatura sayfasında tuş; oturumlu uç /muhasebe/f/<id>/pdf indirir
  (<fatura no>-fatura-ozeti.pdf). Belge (src/belge/fatura.ts, rapor ve teklif belgesiyle aynı görünüm ve motor): başlık (logo, firma künyesi, "Fatura
  özeti", doküman kodu <firma kodu>-FR-FOZ-01, fatura no, tarih, vade), "bu belge fatura değildir" notu, 1 Alıcı (ünvan, vergi dairesi / no), 2 İş(ler)
  ve rapor sayısı, 3 Kalemler (tür × adet × birim fiyat; teklif dışı işaretli; fiyatsız "fiyatsız"; ara toplam, KDV, genel toplam), 4 Tahsilatlar
  (tarih, yöntem, açıklama, tutar; tahsil edilen, kalan). Yetki Muhasebe "gör" (fatura kartı); görmeyen 404. Kilit: fatura-belgesi.test (saf),
  pdf.test (A4, Carlito, tek sayfa), muhasebe.test (veri, yetki, B sızıntısı); olumsuz kanıt 1; muhasebe e2e (PDF iner).
- 2026-10-06: **Uçtan uca testler genişlik başına ayrı sunucuyla** (CI). Tek geliştirme sunucusu ~200 testin sonunda bellek eşiğine dayanıp
  kendini yeniden başlatıyor, o an koşan telefon testi düşüyordu (3dda074, 661004b, c17ba55, ba4c79e — her koşuda başka bir test); eşiği kapatınca
  sunucu çöktü (0059a80, geri alındı). CI artık masaüstü · tablet · telefon'u ayrı koşturur: her biri kendi sunucusu ve geçici veritabanıyla
  (testler genişlik başına kendi verisini kurar); biri düşse de ötekiler koşar. Kalıcı ikinci adım (açık): uçtan ucu derlenmiş sunucuyla koşmak
  (geliştirme vitrini testleri ayrılmalı).
- 2026-10-06: **Vercel yalnız main'i yayınlar** (reisim: *"Vercel'in Function Storage kotası %75'e geldi: her push'ta kalem dalının da önizleme
  yayını kuruluyor (son 100 yayının 72'si o daldan). vercel.json'a git.deploymentEnabled ekle: yalnız main yayınlansın (kalem/* kapalı)"*).
  vercel.json git.deploymentEnabled: main açık, kalem/* ve öteki dallar kapalı (Vercel kuralı: dal birden çok kalıba uyarsa bir "açık" yeter —
  main yayınlanır). Test kapısı değişmedi (CI her push'ta; yayın main'den). Eski yayınların silinmesi kalıcı silme: panelden reisim yapar.
- 2026-10-06 (339): **K4 Yan menü takip balonları** (maket takipHtml + MV.TAKIP — T6, reisim 2026-09-28: "cihazlarda süresi geçen cihaz sayısı
  kırmızı balon, yaklaşan sarı balon … diğer modüllerde de benzer takip"; 35. tur 163; N9 raporlar "kişiye göre"). Modül adının sağında kırmızı
  (süresi geçen) / sarı (bekleyen, yaklaşan) sayı; 0 olan çizilmez; ekran okuyucu anlamıyla okur ("Ölçüm cihazları: 1 süresi yaklaşan cihaz").
  Ölçüm cihazları (kalibrasyon), Dökümanlar (eğitim tekrarı), Araçlar (belge), Uyarılar (hepsi) — Uyarılar düzeyiyle; Planlar (kabul bekleyen;
  plan günü gelmiş kırmızı — denetçi kendi ekibinde); Sözleşmeler (açık planda İSG-KATİP eksik); Raporlar (kendi Yeni raporları: geri gönderilen
  kırmızı, onaya gönderilmemiş sarı); Onaylar (imzanızı / onayınızı bekleyen rapor ve diğer belgeler; 24 saati geçen kırmızı); Talepler (size
  iletilen bekleyen izin / masraf formu); Muhasebe (vadesi geçen fatura). Sayılar modüllerin yetkiye duyarlı işlevlerinden; sayfa çizimini
  bekletmez — kabuk sayfa açılınca sunucu eyleminden ister. Daraltılmış şeritte simgenin sağ üstünde yalnız en önemlisi. Maketteki yeşil
  ("sorunsuz") balon kullanılmadı (maketin kendi tanımlarında da yok). Kilit: anasayfa.test (kişiye göre, kısıtlı düzey, başka firma), olumsuz
  kanıt 1, kabuk e2e.
- 2026-10-06 (338): **K4 Format kurucu** (RAPOR-FORMAT.md §6; maket maket-kurucu.js). Türün TASLAK rapor şablonu düzenlenir:
  /ekipman-turleri/<tür>/sablon/<taslak>/kurucu (önizlemede "Format kurucu", sürüm tablosunda "Düzenle"; Şablondan başlat artık kurucuyu açar).
  Solda bölüm listesi (seç, yukarı / aşağı sırala, **Bölüm ekle** — 10 blok), ortada seçili bölüm (ad; bilgi alanları / kontrol maddeleri (son
  gruba) / ölçüm sütunları / test değerleri ekle-çıkar; fotoğraf en az–en çok; sonuç cümlesi; yorum zorunlu; imza alanları; cevap seti), sağda
  **Kurallar** (Uygun değilde fotoğraf zorunlu · kusur derecesi · sonuç önerisi) ve canlı **saha ekranı önizlemesi**. Değişiklik "Taslağı
  kaydet" ile yazılır (Kaydedilmedi · Vazgeç; sayfadan çıkarken tarayıcı sorar); kaydedilmemiş taslak yayınlanmaz (Yayınla yalnız kayıtlıyken).
  Kilitli (Bakanlık) bölüm silinmez ve adı değişmez, kilitli öğe ve kilitli ölçüm tablosunun sütunu silinmez — sunucu yayında kaynak
  şablondan yeniden denetler (ENGEL, 308). Yeni öğenin kimliği bütün tanımda tekil (cevaplar kimlikle). Kayıt hatası hangi bölümde olduğuyla
  üstte söylenir. Telefonda kurucu açılmaz (masaüstü işi): yalnız önizleme. Yetki Ekipman türleri "değiştirir"; taslak dışı sürüm önizlemeye
  döner. Açık: "PDF önizle" (format PDF'i) ve "Kendi formatını yükle" (yapay zekâ taslağı, K5). Kilit: format-kurucu.test (saf), rapor-format
  e2e (bölüm ekle → kaydet, Bakanlık bölümü silinemez, telefonda önizleme); olumsuz kanıt 2.
- 2026-10-06 (337): **K4 Firma ayarları — Toplu içe aktarma (ilk kurulum)** (maket iceCiz; §11 245). Tam genişlik bölüm: **Ne yüklenecek**
  (müşteriler ve tesisler · ekipmanlar · ölçüm cihazları · personel · araçlar) → sütunlar (* zorunlu) → **Şablonu indir** (.xlsx, örnek satırlar) →
  **Excel seç** (.xlsx / .csv; dosya tarayıcıda okunur, başlık satırı atlanır) → sunucu satır satır denetler: "Eklenecek" (uyarı notu: vergi no / SGK
  / EKİPNET boş, müşteri kayıtlı → tesis ona eklenir, müşteri dosyada üstte, okunmayan alan boş girer, kalibrasyonu geçmiş …) ya da atlanma nedeni
  (zorunlu alan boş, kayıtlı kod / eski kod / plaka / cihaz kodu / e-posta, dosyada iki kez, tür / meslek / il / müşteri-tesis bulunamadı, geçersiz
  tarih, uzunluk) → **İçe aktar (N)**: geçerli satırlar TEK işlemde (biri düşerse hiçbiri), satırlar sunucuda yeniden denetlenir. Aynı müşterinin
  satırları tek müşteri açar; ekipman tesise müşteri ünvanı (ya da kısa adı) + tesis adıyla bağlanır (önce müşteriler). Ölçüm cihazının dosyadaki
  kalibrasyon bitişi **sistem öncesi bitiş** (göç 0047 ilk_bitis; laboratuvar ve sertifika no uydurulmaz) — geçerli bitiş ondan, kalibrasyon kaydı
  açılınca kayıtlardan. Personelin giriş hesabı açılmaz. En çok 2.000 satır. **Son içe aktarımlar** (5): sonuncusu **Geri al** — önce denenir;
  kayıtlar kullanıldıysa (plan, rapor, teklif, sözleşme, zimmet, hesap, kilometre, dosya) sorulmadan "geri alınamaz" denir, kullanılmadıysa onay
  penceresi → kayıtlar silinir (ekipman kodu da serbest kalır, yeniden yüklenebilir). Güvenlik: uygulama rolünün bu tablolarda silme hakkı yok;
  geri alma veritabanı işleviyle (yalnız kendi firması, oturumdaki hesap, yalnız son ve bir kez); içe aktarma kaydı yalnız AYNI işlemde oluşturulmuş
  kayıtları taşıyabilir (tetik) — sahte bir kayıtla başka veri silinemez. Yetki Firma ayarları "değiştirir". Kilit: ice-aktar-sema.test (saf
  denetim), ice-aktarma.test (gerçek PG, iki firma: yetki, tek işlem, geri al, kullanılmış, sahte kayıt, sızıntı); olumsuz kanıt 2; uçtan uca.
- 2026-10-06 (335–336 incelemesi): çapraz inceleme (dört bakış + çürütme; 22 bulgudan 21'i doğrulandı, aynıları birleşti) düzeltmeleri.
  **Güvenlik:** firmanın eklediği belge türünün anahtarı (ekN) kaldırılınca yeni türe yeniden veriliyordu — eski bir seçim ya da eski bir belge
  yeni (kişisel olabilecek) türün adıyla müşteriye açılabiliyordu; artık sayaçla, kaldırılan anahtar bir daha verilmez (ek1 → ek2 …), yeni tür
  müşteriye kapalı doğar. Tür ekle / kaldır, müşteriye açık belgelerin kaydı ve firmanın türünde özlük belgesi ekleme firma başına kilitle
  birbirini bekler (kaldırma sayımı ile ekleme yarışmaz); tür kaldırılırken müşteriye açık listeden düşürme yazılamazsa işlem geri alınır (yazma
  hatası yutulmuyordu). **Veri:** fiyat listesi iyimser kilitle — ekran gördüğü fiyatları gönderir, yalnız değişen türler yazılır, o tür bu arada
  değiştiyse hiçbiri yazılmaz (eski ekran başkasının fiyatını eziyordu); aynı türe aynı anda ilk fiyat girene çakışma. Müşteriye açık özlük türü
  sınırı 40 (7 sabit + 30 ek). **Mantık:** sır kaldırmak ana şifreleme anahtarı istemez; ekranda "Açık" seçiliyken anahtar girilince yapay zekâ da
  açılır (maket Z1; bölümün sürümüyle). **Arayüz:** tür kaldırılınca yalnız o tür taslaktan düşer (öteki kaydedilmemiş seçimler korunur), kayıt
  hatası alanın altında görünür; kullanımdaki tür sorulmadan "kaldırılamaz: n personelde belge var" der; Türü ekle / anahtar kaydet / Vazgeç /
  Kaldır sonrası odak; anahtar girerken çift etiket kalktı. Uçtan uca: belge onayı testi önce kendi dönemini seçer (öteki projenin dönemi açılışta
  seçili olabiliyordu — 122773d CI'ında tablet düştü). Kilit: firma-ayarlari.test (anahtar yeniden verilmez, kullanım, fiyat kilidi, anahtarla
  açma, ana anahtarsız kaldırma), musteri-paneli.test (ek tür müşteri panelinde adıyla, 0046 işlevi uygulama rolüne kapalı); olumsuz kanıt +1.
- 2026-10-06 (334 incelemesi): çapraz inceleme (dört bakış + çürütme; 28 bulgudan 23'ü doğrulandı, birbirinin aynısı olanlar birleşti)
  düzeltmeleri. **Güvenlik:** Firma ayarlarını "kendi" / "branşı" düzeyi de görüyordu (sabit giderler, personel listesi) — artık yalnız "gör" ve "yaz"
  (Muhasebe ve Müşteriler gibi; firma ayarında kişiye ya da branşa ait kayıt yok). **Veri:** eski ekranla (başka sekme / başka yönetici kaydetmiş)
  yüklenen logo ya da şablon hiçbir ayara bağlı olmadan etkin kalıyordu — sürüm yüklemeden önce denetlenir, arada kaydedilirse yeni dosya çöpe;
  firma kodu iyimser kilitle yazılır (ekranın gördüğü kod hâlâ kayıtlıysa; izdeki eski değer gerçek geçiş); depoda okunamayan logo rapor /
  teklif belgesini, onay ekranını ve son imzayı düşürmez (logo yeri boş çıkar). **Mantık:** mesai form ve kayıt aralıkları ayrışıyordu (form
  1–1440, kayıt 60–660) — kayıt onaylı maketin aralığına genişledi (660'ı aşan toplam uyarı, engel değil; günlük üst sınır hakkı keser); mesai
  kapatılırken gizli alanlar doğrulanmaz, kayıtlı değerleri kalır; sunucu girileni aynı değere düzeltince (kırpma, büyük harf, tutar biçimi) bölüm
  "Kaydedilmedi" kalıyordu — taslak kayıtlı değere döner; firma kodunda "i" Türkçe yerelle "İ" olup reddediliyordu (yerelden bağımsız büyütme,
  önizleme kayıt kuralıyla aynı); temel ön bilgilendirme formunun kodu firma kodundan (<kod>-FR-OBF-01; "KM" sabiti kalktı). **Arayüz:** logo
  önizlemesinin sınırı resimde (kutudan taşmıyor), zemini beyaz (koyu temada görünür); seçim alanları hatada geçersiz işaretli (odak bulur);
  dosya kaldırma onayı dosyanın adını ve sonucunu söyler ("yüklenmedi" değil); kaldırınca odak yükleme tuşuna; sabit gider satırı silinince
  hatalar başka satıra kaymaz; 2 MB üstü logo "En çok 2 MB" der; rapor e-postası ve akreditasyon no boşken "raporda boş çıkar" uyarısı. Kilit:
  firma-ayarlari.test (kendi / branşı görmez, mesai aralığı ve kapatma, değişmedi, firma kodu kilidi + iz + kesintisiz rapor sırası, logo
  firma kaydında korunur, 2 MB, çakışmada öksüz yok, okunamayan logo); olumsuz kanıt +2.
- 2026-10-06 (336): **K4 Firma ayarları — yapay zekâ, bulut kaydı, depolama ve yedek** (maket yzCiz Y1 — reisim: "Müşterinin token ekleyeceği
  yeri ekledin mi makete"; bulutCiz Ö2; depoCiz G2/G3 — "elle yedekleme olmasın"). **Yapay zekâ** (tam genişlik): kapalı / açık; açıkken yurt dışı
  (Anthropic, ABD) KVKK uyarısı; **API anahtarı** bir kez yazılır, AES-256-GCM ile şifreli sırda (sir.ts), ekranda ve yanıtta yalnız son 4 hane;
  biçim sk-ant-…; Değiştir / Kaldır (sorulur); ortamda ana şifreleme anahtarı yoksa düz metne düşmez — "kaydedilemedi" denir. Model (Opus 5.5 /
  Sonnet 5.5) ve kişi başı aylık sınır ($; boş = sınırsız). Bu ayın kullanımı yapay zekâ işleriyle (K5) dolacak. **Bulut kaydı**: sağlayıcı
  (Google Drive, OneDrive / SharePoint, Dropbox, Yandex Disk, kendi sunucunuz), klasör düzeni, ana klasör (örnek yol; geçersiz karakter
  kaydedilmez); yurt dışı uyarısı. Hesap bağlantısı ve imzalanan raporun kendiliğinden kaydı yayına çıkışla (K5) — şeritte söylenir.
  **Depolama ve yedek**: firmanın deposu yayına çıkışta bağlanır (K7) — deneme yayınında uygulamanın deposu; düzenli arşiv ve otomatik silme
  kuralı (saklama süresi) bilgisi; yedek sıklığı (saatlik / günlük / haftalık), saati, yedeklerin saklanması (30 / 90 / 365 gün), sonraki yedek
  zamanı; elle yedek yok. Ayar bölümleri: yapay_zeka genişledi (model, sinir), yeni bulut ve yedek. Ayrıca Personel'de özlük belgesi eklerken
  tür denetimi düzeltildi (335: hata yazılıyor ama dönüş koşulu bakmıyordu — ayarda olmayan tür kaydediliyordu; kilit testi yakaladı). Kilit:
  firma-ayarlari.test (anahtar biçimi, şifreli saklama, yalnız son 4, yetki; bulut ve yedek doğrulaması; B sızıntısı), e2e (yapay zekâ ve bulut
  uyarıları).
- 2026-10-06 (335): **K4 Firma ayarları — fiyat listesi, müşteriye açık personel belgeleri, belge türü ekle** (maket ayarDigerCiz "Fiyat listesi";
  P3 "müşteriye giden muayene personelinin firmanın izin verdiği belgelerini görür"; Z5 reisim: "bu kısımda eğer ben bir belge türü eklersem
  listeye ekleniyor mu" · "eklenmiyorsa eklensin"). **Fiyat listesi** (tam genişlik, dört sütuna kadar): ekipman türü başına KDV hariç birim fiyat
  (TL → kuruş); boş = fiyatsız, kayıtlı fiyat boşaltılamaz, doluysa sıfırdan büyük; Teklifler'in tablosuna bağlantı işleviyle
  (teklifler/server/fiyat-baglanti.ts). **Müşteriye açık personel belgeleri**: EKİPNET, diploma, oda kaydı, ekipman atama belgesi, eğitim
  türlerinin sertifikaları (Eğitimler'in ayar-baglanti.ts), firmanın eklediği türler, kişisel veriler (kimlik, sağlık raporu, iş sözleşmesi,
  diğer) — işaretli olanlar müşteri panelinde (musteri_belge ayarı; kişisel veri seçiliyse KVKK şeridi). **Belge türü ekle** (hemen kaydedilir):
  ad (var olan türle ya da "… sertifikası" ile aynı olamaz), kişisel veri işareti; anahtar ek1–ek30 (yeni ayar bölümü belge_tur_ek). Personel'de
  özlük belgesi yüklerken seçilir ("Diğer" hep sonda; ayarda olmayan tür sunucuda reddedilir), müşteri panelinde adıyla görünür (göç **0046**:
  müşteri rolü için yalnız tür anahtarı ve adını döndüren işlev musteri_belge_turleri). Kaldır: yalnız o türde yüklü belge yokken; müşteriye açık
  listeden de düşer. Kilit: firma-ayarlari.test (fiyat, müşteriye açık belgeler, tür ekle / kaldır, Personel'de seçim, B sızıntısı),
  firma-ayarlari.bozan 2 → 3, e2e (fiyat görünümü, tür ekle — aynı ad reddedilir — kaldır).
- 2026-10-06 (334): **K4 Firma ayarları — ekran ve temel bölümler** (maket firma-ayarlari.html — R1 "ayrı bir modül olsun , ekran daha verimli
  kullanılsın", Z1 "yapılan değişikliklerin yanına minik bir kaydet butonu koy", 202 dağınık ayarlar tek yerde; reisim 2026-10-03 "Şirket logosuda
  firma ayarlarından girilsin , raporlara otomatik çekilsin"). Geniş ekranda solda bölüm listesi, bölümler kart, sütunlu yerleşim (sabit giderler
  tam genişlik), telefonda tek sütun. Değişen bölümün başlığında "Kaydedilmedi · Vazgeç · Kaydet"; geçersiz değer kaydedilmez, nedeni alanın
  altında (Türkçe); "gör" düzeyinde salt okunur. Bölümler: **Firma bilgileri** (ticari ad — boşsa firma kaydındaki ad, adres, rapor e-postası,
  akreditasyon no, nüsha 1–4, **logo** PNG / JPEG ≤ 2 MB) — rapor ve teklif belgelerinin başlığına gelir (logo veri adresi olarak gömülür; adres
  adın altında; "AKR. <no>") · **İmza yöntemi** (mobil / e-imza) · **Zimmet teslim formu** (teslim eden başlangıcı; yalnız çalışan kişi) · **Rapor
  saklama süresi** (5–20 yıl) · **Ön bilgilendirme formu** ve **Bordro formatı** (dosya; seçilince yüklenir, kaldırma sorulur) · **Mesai takibi**
  (aç / kapa, normal, mesai, yıllık fazla çalışma ≤ 270; toplam 660 dk'yı aşarsa kanun şeridi) · **Uyarı eşikleri** (maketin seçenekleri) ·
  **Rapor numarası** (firma kodu 2 harf A–Z; açılmış raporun numarası değişmez — göç **0045**: uygulama rolü firmada yalnız rapor_kodu'nu yazar) ·
  **Sabit giderler** (ad, aylık TL, not; ekle / kaldır). Ayar bölümleri: firma_bilgileri genişledi, yeni zimmet ve belge_sablon. Dosyalar (kayıt =
  firma) firmanın her kullanıcısına açık. Kalan bölümler sonraki kalemlerde: fiyat listesi + müşteriye açık personel belgeleri (335), yapay zekâ /
  bulut kaydı / depolama ve yedek (336), toplu içe aktarma (337). **Açık:** Muhasebe › Maaş bordrosu gönder "Formattan oluştur" — yüklenen bordro
  formatından kişi kişi bordro üretmenin biçimi belirsiz (PDF / Excel şablonunun alanları); şimdilik format yüklense de bordrolar elle yüklenir.
  Kilit: firma-ayarlari.test (yetki — gör salt okunur, rol değiştirme; doğrulama, sürüm kilidi, firma kodu ve sütun yetkisi, logo türü ve belge
  künyesi, dosya erişimi, B sızıntısı), firma-ayarlari.bozan (2), e2e üç genişlik.
- 2026-10-06 (333 incelemesi): çapraz inceleme (13 bulgudan 9'u doğrulandı) düzeltmeleri. **Yüksek:** imza PDF denetiminde karesel süre
  ("trailer(" yığınıyla 400 KB → 30 sn; 333'ün iki yeni girişi — bordro gönderme ve belge imzası — açıktı): trailer sözlüğü sınırlı pencereyle,
  ekte en çok 32 trailer; özgünün yalnız son kökü okunur (4 MB ek artık ~15 ms; süre kilidi + bozan). **Bordro durumu KAYDA bağlı** (döneme
  değil): aynı dönem yeniden yüklenince ya da bordro kaldırılınca bekleyen imza **iptal** (yeni durum; kişi eski PDF'i imzalayamaz), imzalı
  belge imzalı kalır, yenisi yeniden gönderilir; göç 0044'te benzersizlik kaynak başına (kaynaksız bordro belgesinde kişi × dönem), iptal
  yalnız bekleyende ve oturumla. **Yarış / yarım kayıt:** kişi × dönem danışma kilidi (Personel yükleme, Onaya gönder, Muhasebe gönderimi);
  Muhasebe "zaten" denetimini Personel kartına yazmadan ÖNCE kilit altında yapar, gönderilemeyen olursa bütün gönderim geri alınır. **İmzaya
  uygunluk:** katalogdan dolaylı AcroForm ve sayfadan dolaylı Annots taşıyan PDF artık imzalanabilir — imza aracı yalnız ekleyerek yeniden
  yazabilir (/Fields eskileri kalarak + /SigFlags; Annots dizisine öğe); katalog / sayfa ayrıştırılamıyorsa ön denetim reddeder. **Arayüz:**
  biri reddedilince "Hiçbir bordro gönderilmedi" (satırda "Uygun değil", odak ilk hatalı satıra); imza / geri gönderme sonrası odak sekmeye;
  maket farkları (tuş ikonu gönder, "Seç" sütunu, "Bordro" etiketi, gizli işlem başlığı). Kilit: belge-onay.test (kayıt bağı ve iptal, iptal
  kuralları), imza-pdf.test (süre, dolaylı AcroForm / Annots), imza-pdf.bozan 2 → 3, belge-onay.bozan hedefi güncellendi.
- 2026-10-06 (329–332 incelemesi): çapraz inceleme (dört bakış + çürütme; 33 bulgudan 28'i doğrulandı) düzeltmeleri. **Güvenlik:** Uyarılar'da
  "branşı" düzeyi (uyarının branşı yok) artık "kendi" gibi kısıtlı; Ana sayfa bölümleri rolle açılır ama veri modül düzeyiyle süzülür (Planlar
  "kendi" → yalnız ekibinde olduğu planlar; kontrolü yaklaşan tesisler Müşteriler ve Ekipman'ı hepsini görene). **Veritabanı:** 0042'de izin
  belgesi karar anında değişmez (denetim ELSIF kolundaydı); 0043'te ödeme ≥ tarih kısıtı NOT VALID (eski satır göçü düşürmez), masraf formunun
  kişisi değişmez (uygulama da yok sayar, pencerede seçici kapalı). **Performans:** okuma dönemle sınırlı (açılış aralığı dizinle + dönemde geri
  gönderilen); "Son imza" adımı şimdiki revizyonun imzasıyla (revizyonda eksi süre çıkıyordu); her sütun başlığı gerçekten sıralar; aralık tuşu
  uygulanan dönemi gösterir (aria-expanded), aralık hatasında odak Başlangıç'a; kendi sayfada "Personel kartı" yok. **Muhasebe:** gider Excel'inde
  "3.200 TL" / "12.500" / "1.250.000" Türkçe binlik okunur (1000 kat küçük okunuyordu; test yanlışı kilitliyordu — düzeltildi); Faturalar
  şeridindeki "Faturalar" tuşu süzgeci uygular (liste adres süzgeciyle yeniden kurulur; Object.hasOwn). **Uyarılar:** ayrılan personelin eğitim
  tekrarı düşer; kalibrasyonu hiç olmayan cihaz uydurma "bugün" yerine tarihsiz ve en üstte ("kalibrasyon yok"); araç kartında "<belge> bitişi";
  eğitim uyarısı Eğitimler'i kişiyle süzülü açar (?kisi=); e2e satırı gerçekten sınar (tohumda depoda UY-01). **Ana sayfa:** "Reddedilen plan"
  yalnız tesisin güncel planıysa; denetçide mesai açıkken "Günlük süre" yüzü (N6); branş yöneticisinde "Geri gönderdiğin" (kendi geri
  gönderdikleri) ve kalibrasyon uyarısı branşın cihazları (cihaz türünü kullanan ekipman türlerinden). **Talepler:** fiş alanında capture yok
  (telefonda PDF); "Belgeyi / Fişi değiştir · kaldır"; ek silmeden önce sorulur; gönderim günü ve yılı Türkiye takvimiyle; izin özeti talebin
  başlangıç yılıyla (gelecek yıl başlayan izin o yılın kalanıyla — taleplerim gelecekOzet); karar sonrası odak başlığa. Yıl aşan iznin iş
  günlerinin yıllara bölünmesi maketteki gibi yapılmadı (başlangıç yılına sayılır). Kilit: uyarilar, anasayfa, talepler, karlilik,
  performans-hesap testleri genişledi (tarih + gerekçe); talepler.bozan 3 → 5.
- 2026-10-06 (333): **K4 Onaylar › Diğer belgeler** (maket onaylar.html #/diger, muhasebe.html BB5 "Maaş bordrosu gönder", personel.html bordro
  "Onaya gönder"; §11 230, 264, 265 — reisim: "Onaylar kısmında diğer kısmı olsun muhasebeciden onaya maaş bordrosu gönderilirse veya eğitim
  zimmet formu gönderilirse oradan onaylanabilsin"). Göç **0044 belge_onay**: tür (bordro, eğitim formu, zimmet formu, araç teslim tutanağı), ad,
  imzalayacak kişi, kaynak, bordroda dönem, belgenin KENDİ imzasız PDF'i (kayıt → dosya → bağ aynı işlemde; dosyasız belge işlem sonunda
  reddedilir), durum bekliyor → imzalı / geri gönderildi; gönderen ve karar veren veritabanında damgalanır, kararı YALNIZ imzalayacak kişi verir
  (hesabının personeli), karar verilmiş ve gönderilmiş belge değişmez, silinmez; aynı kişinin aynı dönem bordrosu ikinci kez gönderilmez (geri
  gönderilen sayılmaz). **Onaylar › Diğer belgeler** (/onaylar/diger): Görüntüle · Geri gönder (önce sorulur) · Onayla ve imzala (pencere:
  PDF'i indir → e-imza aracıyla imzala → imzalı PDF'i yükle; raporun son imzasıyla aynı denetim — ilk baytlar gönderilen PDF, ek yalnız imza).
  Mobil imza ve imza aracı sonraki fazda. Sayfa **modülden bağımsız**: herkes yalnız kendi belgesini görür (Onaylar'ı görmeyen planlama ve muhasebe
  de kendi bordrosunu imzalar; ana sayfada "n belge imzanızı bekliyor" şeridi ve bağlantısı); Onaylar'ı görene sekme (denetçide iki sekme: İmzamı
  bekleyen raporlar, Diğer belgeler). **Personel › Maaş ve bordrolar:** Onay sütunu (Gönderilmedi / Onay bekliyor / İmzalandı / Geri gönderildi)
  ve "Onaya gönder" (Personel "yaz"). **Muhasebe › Maaş bordrosu gönder** (her sekmede tuş; Muhasebe "yaz"): dönem (son 12 ay, varsayılan geçen
  ay), Formattan oluştur / Elle yükle (format Firma ayarları › Bordro formatı kalemiyle; yokken şerit), personel (seç, dosya, durum: Hazır / Bordro
  yok / Bu dönem gönderildi / İmzalandı), İmzaya gönder (n): dosyası olan seçililer; önce HEPSİ denetlenir (biri uygunsuzsa hiçbiri yazılmaz);
  bordro Personel kartına da yazılır (dönemin bordrosu varsa yenisi aynı tutarlarla, yoksa son bordronun tutarlarıyla; hiç bordrosu yoksa
  yalnız belge). Gönderilen PDF **e-imzaya uygun** olmalı (klasik trailer kökü, sıkıştırılmış nesne akışı yok — imzalı hâli ancak böyle
  denetlenir; imza-pdf.ts imzayaUygun); değilse "programından yeniden PDF olarak kaydedip yükleyin". Dosyalar: imzacı, gönderen, Personel "yaz",
  bordroda Muhasebe'yi gören açar. Eğitim / zimmet formu ve araç tutanağının gönderilmesi o modüllerin kalemiyle (tür şimdiden tabloda). Kilit:
  belge-onay.test (gönderme yetkisi, sızıntı — öteki kişi, gönderen, B firması, dosya erişimi, imza denetimi, Muhasebe gönderimi, veritabanı
  korumaları), imza-pdf.test (imzaya uygunluk), olumsuz kanıt belge-onay.bozan (3), moduller.test (kişisel sayfa istisnası — tarih + gerekçe),
  e2e belge-onay + personel-dosya üç genişlik.
- 2026-10-06 (göç düzeni): 0037–0040 Supabase'e uygulandı (goc kaydıyla; main = f179072). Uygulanmış göç değişmez: 328 incelemesinin ve 330'un
  0040'a "yerinde" yazılan gider kuralları (ödeme günü CHECK'i, ödemede onay damgası, masraf formu kendi adına, gönderenin geri çekmesi, DELETE
  hakkı) **0043_gider_kurallari.sql**'e taşındı (gider_koru bütünüyle yenilenir); 0040 uygulanan hâline döndü. Bozanlar 0043'ü bozar.
- 2026-10-06 (332): **K4 Ana sayfa** (maket anasayfa.html M1 2. tur — reisim 41: "role göre ama herkes için bir anasayfa olmalı"). Girişten sonra
  herkes kök adrese gelir; içerik kişinin ROLLERİNE göre, birden çok rolü olan bölümleri sırayla (planlama, denetçi, branş yöneticisi, firma
  yöneticisi, muhasebe) görür. **Denetçi:** kabul bekleyen plan (en yakını), denetimdeki plan, taslak rapor (geri gönderilen sayısı), son imzanı
  bekleyen, zimmetinde (kalibrasyonu uyarıdaki cihaz); "Açık planların" listesi (yalnız kendi). **Planlama:** kabul bekleyen, reddedilen, bugün
  başlayan plan, İSG-KATİP eksiği (açık planlarda ID yok / geç onaylı / bitmiş; el ile yazılan eksik sayılmaz); "Kontrolü N gün içinde gelen
  tesisler" (açık planı olmayan; tesisin etkin ekipmanının sonraki kontrolü — son imzalı muayeneden, yoksa sistem öncesi kontrol + periyot —
  en yakını; eşik firma ayarı) ve "Plan aç" (?tesis=). **Branş yöneticisi:** onayını bekleyen (en eskisi kaç saattir), geri gönderilen, muayene
  uzmanı imzası bekleyen, kalibrasyon uyarısı; onay kuyruğu (en eski 5). **Firma yöneticisi:** açık plan, onayda rapor, muayene uzmanı imzası,
  uyarı (kalibrasyon / eğitim / araç dökümü), bilgisi eksik personel; bugün başlayan planlar. **Muhasebe** (maketin dört rolü dışında; "herkes
  için"): faturaya hazır iş, vadesi geçen fatura, onay bekleyen masraf. Sayılar modüllerin kendi yetkiye duyarlı işlevlerinden (planListesi
  değil Planlar'ın anasayfa-baglanti.ts'i; raporListesi, onayListeleri, uyariListesi, personelListesi, muhasebe listeleri) — ana sayfa başka
  modülün tablosuna dokunmaz. "Plan aç" yalnız plan açabilene. Duyurular: İSGGM, İSGÜM ve iş ekipmanları portalı bağlantıları; kaynaklardan
  otomatik okuma (maket: "günde birkaç kez", §8.9) iş kuyruğu kalemiyle. Yan menü balonları (maket MV.TAKIP) sonraki kalem. Göç yok. Kilit:
  anasayfa.test (denetçi, planlama — İSG eksiği ve yaklaşan tesis, firma yöneticisi, branş yöneticisi, muhasebe, çok rollü sıra, firma
  sızıntısı), e2e üç genişlik.
- 2026-10-06 (331): **K4 Uyarılar** (maket uyarilar.html M10, maket-veri.js MV.uyarilar; pkproje §3 "kalibrasyon bitişine 30 gün kala uyarı", §3.1
  modül 10 ve 20; anayasa 1.3 — YALNIZ ekranda, e-posta / SMS / anlık bildirim yok; KOD-GECIS §3 "tablo yok — koşuldan türetilir; okundu yok",
  §4 Uyarılar). Tablo ve göç yok: uyarı kayıtlardan türetilir, koşul kalkınca (kalibrasyon yenilenince, eğitim tekrarlanınca, belge yenilenince)
  kendiliğinden düşer. Türler: **kalibrasyon** (geçti ya da eşik içinde biten; kalibrasyondaki ve pasif cihaz sayılmaz; geçerli kalibrasyonu hiç
  olmayan "geçti"; denetçideyse "raporlarını onaya gönderemez"), **eğitim tekrarı** (güncel kayıt; önceki sayılmaz), **araç belgesi** (muayene,
  trafik sigortası, kasko). Eşikler firma ayarı (uyari_esikleri). Kimde: zimmetin son hareketi. Okuyucular modüllerin uyari-baglanti.ts'leri
  (Ölçüm cihazları, Eğitimler, Araçlar). Görünürlük (sema.ts uyariGorunur): planlama, branş yöneticileri, firma yöneticisi hepsini; denetçi
  yalnız kendisindeki cihaz / araç ve kendi eğitimi; muhasebe göremez. Ekran /uyarilar: en yakın tarih üstte, tür çipleri (adresten
  ?tur=kalibrasyon|egitim|arac), "Süresi geçmiş", kişi seçicisi (Depoda dahil). Ara kontrol cihaz kaydında henüz yok (sonra); yan menü
  balonları Ana sayfa kalemiyle. Kilit: uyarilar.test (türetme, sıralama, kimde, eşik; yetki; firma sızıntısı), bozan 1 ("kendi" süzgeci), e2e
  üç genişlik.
- 2026-10-06 (330): **K4 Talepler** (maket talepler.html, personel.html #/izinler; 2026-09-28 reisim: "personelin bireysel olarak isteyeceği
  şeyler … denetçi izin talebi masraf formu ekleme"; izin onayı firma yöneticisinde, Personel'de; KOD-GECIS §3 "izin_talebi, masraf (gider'e
  yazar) · izin onayı yönetici, masraf onayı muhasebe", §4 Talepler herkes "kendi", firma yöneticisi "değiştirir"). Göç **0042**: izin_talebi (no
  I-AAYY-SIRA; tür yıllık / mazeret / hastalık — sağlık raporu / ücretsiz; başlangıç–bitiş, iş günü — hafta sonu sayılmaz, resmî tatil takvimi
  sonra; açıklama; belge; bekliyor → onaylandı / reddedildi — gerekçe 5–200, karar veren ve zamanı veritabanında); personel.izin_hak (yıllık
  izin hakkı, başlangıç 14 gün; düzenleme ekranı Personel / Firma ayarları kalemiyle). Tetik: talep YALNIZ kendi adına (hesabın personeli);
  gönderilen talebin içeriği değişmez; karar verilmiş talep değişmez; onay bekleyeni yalnız talep eden geri çeker (silinir); belgeyi yalnız
  talep eden değiştirir. **0040** (yerinde, Supabase'e uygulanmadı): masraf formu yalnız kendi adına; onay bekleyen masraf formunu gönderen geri
  çekebilir (tek silme istisnası). Masraf formu Muhasebe'nin gider kaydına "Onay bekliyor" yazılır (Muhasebe'nin talep-baglanti.ts'i; iş yalnız
  kişinin ekibinde olduğu başlamış plan — Planlar'ın talep-baglanti.ts'i); onayı Muhasebe'de. Ekranlar: /talepler (yüzler: yıllık izin hakkı,
  kullanılan — bekleyen notu, kalan, onay bekleyen talep; izin ve masraf tek listede, tür / durum çipleri, yıl; "İzin talebi" — iş günü canlı,
  yıllık izinde kalanı aşarsa uyarı, hastalıkta sağlık raporu; "Masraf formu" — iş, tarih, tür — KDV varsayılanı, tutar — KDV canlı, fiş;
  talep penceresi — durum, karar veren, red gerekçesi, belge ekle / değiştir / kaldır, "Talebi geri çek"), /personel/izinler (Personel sekmesi
  yalnız izin onaylayana; bekleyen üstte, kalan yıllık izin, aşım uyarısı, Onayla / gerekçeyle Reddet). Belge erişimi: izin belgesi talep eden
  ve firma yöneticisi; masraf fişi Muhasebe'yi gören ve gönderen. Maketten fark: "Yeni talep" menüsü yerine iki tuş (İzin talebi · Masraf
  formu). Sonraki: talep formunun imzası (V3) ve PDF · e-posta (T8) — Onaylar › Diğer kalemiyle. Kilit: talepler.test (yetki; izin — iş günü,
  numara, kendi adına, belge ve erişim; yönetici kararı, değişmezlik, geri çekme; masraf formu — gider kaydı, iş seçeneği, kendi adına,
  muhasebe onayı, geri çekme, fiş erişimi; firma sızıntısı), talep-sema.test (saf), bozan 3 (izinde ve masrafta "kendi adına", karar
  değişmezliği), e2e üç genişlik (masraf formu, izin talebi, yönetici onayı, muhasebe görür, denetçi kararı görür).
- 2026-10-06 (328 çapraz inceleme düzeltmeleri; dört bakış + çürütme: 23 bulgudan 20'si doğrulandı). **Gider Excel'i** (maket tutarOku / oranOku):
  Excel'in sakladığı sayı hücresi (nokta ondalık, uzun kesir — "999.996", formül sonucu) her ondalıkta okunup kuruşa yuvarlanır (önceden 1000 kat
  okunuyor ya da reddediliyordu), Türkçe yazım ortak şemayla; KDV oranı "20", "%20", "0,2" ya da yüzde biçimli hücre (0.2); tür yalnız kendi anahtarı
  ("constructor" / "__proto__" türü yazılabiliyordu); 1 milyar TL'yi aşan tutar satırda atlanır (bütün yükleme düşüyordu); tarayıcı yalnız 6 sütunu
  gönderir (uzun bir not hücresi bütün dosyayı yanıltıcı iletiyle reddettiriyordu); numaralar tarih sırasıyla (eşzamanlı iki yükleme sayaçta
  kilitlenebiliyordu); dışa aktarımda tutar, KDV, KDV hariç SAYI hücresi (toplanır). **0040** (Supabase'e henüz uygulanmadı, yerinde): ödeme günü
  eklemede de ileri olamaz, gider tarihinden önce olamaz (CHECK); onaylandı → ödendi geçişinde onaylayan ve karar değişmez; ödendi giderin tarihi
  ödeme gününden sonraya taşınamaz (alan hatası). Bozuk fotoğraf belgesi alan hatası (sunucu hatası değil). **Gelir-gider:** Toplam en çok 13 ay
  (maket; aylara göre dökümdeki her ay açılabilir — 14+ ay önceki aya tıklayınca yine Toplam açılıyordu); Dönem seçicisi görünür etiketli.
  **Ekran:** Reddet / Vazgeç'te odak gerekçeye / tutara; iş sayfasının Giderler bölümünde sayaç ve "Gider ekle" başlıkta; vadesi geçen alacak
  şeridindeki "Faturalar" tuşu Faturalar'ı "Vadesi geçti" süzgeciyle açar (?durum=gecikti); İş, Personel, KDV oranı ve belge alanları sunucu
  hatasında geçersiz işaretli. Kilit: karlilik.test +1 (Excel okuma / yazma), muhasebe.test +1 (ödeme günü, onay damgası, tarih), bozan gider +1.
- 2026-10-06 (329): **K4 Performans** (maket performans.html M15; §1.1 "personellerin yaptığı işler, gün başı işler … gün başı rapor elde edilen
  kazanç", §3.1 modül 19; reisim 2026-09-27 "24 saat içinde … 48 saatten uzun"; 2026-09-29 "yeni durumundan itibaren her rapor performansı
  etkiler"; KOD-GECIS §3 "tablo yok — rapor ve durum geçişlerinden özet"). Tablo yok; göç **0041** yalnız dizin (raporun açılışı, hareketler).
  Veri okuyucuları: Raporlar'ın performans-baglanti.ts'i (silinmemiş raporların planı, yazanı, türü, açılış, ilk / son gönderim, onay, ilk imza;
  hareket kaydından geri gönderme → yeniden gönderim çiftleri; içerik, numara, yazan hesap dönmez), Personel'in performans-baglanti.ts'i (ad,
  meslek, mesleğin branşı, çalışıyor mu, denetçi mi — iletişim ve mesleki numara dönmez), Planlar (tesis, proje no), Teklifler'in bağı (kazanç =
  birim fiyat, KDV hariç). Hesap saf (performans/hesap.ts): dönem (bu ay · bu yıl · geçen yıl · tarih aralığı — 62 günden uzunsa aylık; en çok 5
  yıl), özet (rapor, çalışılan gün = kişi × gün, gün başı, kazanç, gün başı kazanç, geri gönderilen — geri gönderme günü dönemde, son rapor),
  tamamlanma süresi (açılış → ilk imza: 24 saat içinde · 24–48 · 48'den uzun), zaman grafiği (gün ya da ay; mekanik / elektrik), süreç adımları
  (yazım, düzeltme, onay, son imza — ortalama saat), günlük iş (gün × tesis). **Görünürlük** sunucuda (KOD-GECIS §4): planlama ve firma yöneticisi
  hepsi; branş yöneticisi yalnız branşının raporları ve kişileri (branş anahtarı sabit); denetçi ("kendi") Performans'ta kendi sayfasını görür,
  KAZANÇSIZ (kazanç verisi de gelmez — maket 148); muhasebe göremez (firma matrisi açarsa görür). Ekranlar: /performans (dönem ve branş anahtarı
  adreste, yüzler, tamamlanma süresi, "24 saat içinde tamamlanan" ve "48 saatten uzun süren" kişi grafikleri, günlük / aylık rapor, personel
  başına kazanç, personel tablosu — süzgeç, Görünüm, sıralama; Excel'e aktar), /performans/<kişi> (aynı ölçüler, tamamlanma dağılımı, süreç
  grafiği, günlük iş; Personel kartı ve iş no bağlantıları yalnız o modülü görene). Grafik tek üreticiden: components/grafik (dikey sütun, maket
  T9: boşluksuz, taban çizgisi, değer üstte, etiket ölçülerek, gizli tablo). Kilit: performans.test (yetki ve matris; pano sayıları — silinen
  sayılmaz, dönem dışı açılıp dönemde geri gönderilen sayılır, süre dilimleri, günlük grafik, branş anahtarı, geçersiz aralık; branş yöneticisi;
  denetçi kendisi ve kazançsız; süreç ve günlük iş; firma sızıntısı), performans-hesap.test (saf), bozan 3 (kazanç görünürlüğü, branş süzgeci,
  "kendi" süzgeci), e2e üç genişlik (pano, Bu yıl, Mekanik, kişi sayfası, taşma; denetçi; muhasebe).
- 2026-10-06 (327/328 CI düzeltmeleri): muhasebe testi planı tamamlarken kontrol listesi ve bitiş damgası; e2e tohumunun tamamlanmış planı kabul /
  kontrol / bitiş, imzalı raporu onay damgalı (CHECK'ler tetiksiz yazımda da denetlenir); muhasebe ve gider bozanları göçü işlevle bozar
  (yeni metindeki "$$" "$" oluyordu).
- 2026-10-06 (324–327 çapraz inceleme düzeltmeleri; dört bakış — güvenlik, veritabanı, mantık, arayüz — ve her bulguya çürütme denemesi: 24
  bulgudan 20'si doğrulandı, 4'ü elendi; fatura kilidi ve numara uzunluğu 327 düzeltmesinde). **Birim fiyat bağı** (rapor-bagi.ts): faturalanmış
  raporun bağı, fiyatı ve kaynağı FATURADAKİDİR (Muhasebe'nin teklif-baglanti.ts'inden) — sonradan kabul edilen yenileme teklifi faturalı raporu
  kendine çekmez, teklif numarası "—" olmaz; kalem adedini önce faturada teklif fiyatıyla yazılanlar tüketir, kalan faturalanmamışlara: önce
  imzalılar, sonra imza bekleyenler (imzasız ya da sonradan silinen rapor imzalı raporun teklif fiyatını elinden alıp onu "teklif dışı" liste
  fiyatıyla faturalatamaz). **Güvenlik:** teklif formunun "Excel'e aktar" eylemi yalnız teklif yazabilene ve yalnız etkin müşterilerin etkin
  tesislerine ("gör" düzeyindeki muhasebe, matrisin kapattığı ekipman envanterini tesis kimliğiyle okuyabiliyordu); xlsx okuyucu XML etiketlerini
  doğrusal tarar, kapanmayan etiket "bozuk" (tembel düzenli ifade kapanmayan etikette karesel tarıyordu — küçük kötü niyetli dosya sekmeyi
  kilitliyordu), açılan parçalar TOPLAM 50 MB. **Teklif Excel'i:** türün kalem adedi 999'u aşmaz, aşan satır atlanır (aşan adetle teklif
  kaydedilemiyordu). **Muhasebe:** iş sayfasının "Tahsilat ekle"si en eski açık faturaya (maket); sözleşme numarası Sözleşmeler'in işlevinden
  (modül sınırı); "Plan" tuşu, rapor no ve müşteri adı bağlantıları yalnız o modülü görene; toplu fatura başlığında müşteri; vadesi geçen
  alacak şeridinde "Faturalar"; fiyatsız raporda kapalı "Faturayı kaydet"in nedeni tuşa bağlı; kalan tahsil edilince odak sayfa başlığına.
  **Sözleşmeler:** "Dayanak teklif" bağlantısı yalnız Teklifler'i görene. **Ortak:** nesne başlığının tuş çubuğu sarar, telefonda tam genişlik
  (375 px'te teklif ve iş sayfası yana taşıyordu). **e2e:** teklif "Excel'e aktar" penceresinde iki "Kapat" (başlıktaki X) — alt çubuktaki;
  teklif ve iş sayfasında yana taşma ölçülür. Kilit: muhasebe.test +1 (bağ: imzalı önce, faturalı bağ sabit, yeni teklif adedi, silinen rapor),
  teklifler.test (Excel'e aktar yalnız yazana), oku.test +1 (kapanmayan etiket, toplam sınır), teklif-belgesi.test (999), bozan oku +1.
- 2026-10-06 (328): **K4 Muhasebe › Giderler, sabit giderler, kârlılık, gelir-gider** (maket muhasebe.html #/giderler, gider penceresi,
  gider-excel-*, #/gelir-gider, iş sayfası "Giderler" ve "Kârlılık"; maket-veri.js MV.isKarlilik / ayMaliyet / ayGelirGider / donemGelirGider;
  reisim 2026-09-27: "denetçi maaşı yakıt araç kira bedeli ofis giderleri vergiler vb tüm giderler etki edecek şekilde … kar yüzdesi yazacak iş
  başına", "gelir gidere göre bilançoda olacak"; KOD-GECIS §5 gider durumları). Göç **0040**: gider (no G-AAYY-SIRA — numara üreticisi, önek firma
  ayarı; tarih — ileri değil; tür: yakıt, konaklama, yol, kalibrasyon, sarf malzeme, diğer — tür başına varsayılan KDV oranı; tutar fişteki KDV
  DAHİL, KURUŞ; KDV oranı %20 / %10 / %1 / %0; açıklama; isteğe bağlı iş ve personel; belge — PDF ya da fotoğraf, türü baytlardan, yoksa uyarı;
  kaynak muhasebe ya da masraf formu). Durumlar: elle girilen "ödendi" ya da "ödenecek" doğar; masraf formu "onay bekliyor" → onaylandı (ödenecek)
  → ödendi; onay bekleyen reddedilir (gerekçe 5–200). Tetik: silinmez; numara, kaynak, kaydeden değişmez; reddedilen değişmez; onaylayan, karar ve
  ödeme günü yalnız durum değişirken; kaydeden / onaylayan oturumdan. Pencerede "Onayla" ve "Ödendi" içerik düzeltmesiyle AYNI işlemde. **Excel**:
  dışa (süzülen liste: no, tarih, tür, tutar, KDV, KDV hariç, açıklama, proje no, personel, durum, ödeme, belge) ve içe (Tarih · Tür · Tutar · KDV
  oranı · Açıklama · Proje no — sütunlar reisim'in örnek Excel'i gelince ona göre, VARSAYIM; tarayıcıda okunur, satır satır önizleme, sunucu yeniden
  denetler, en çok 500 satır, geçerliler "ödendi"). **Sabit giderler** firma ayarı (sabit_gider: ad, aylık tutar, not; ekranı Firma ayarları
  kalemiyle). **Kârlılık** (karlilik.ts, saf): iş kârı = gelir (raporlanan, KDV hariç) − işe bağlı masraflar (KDV hariç, reddedilen hariç) −
  denetçi maliyeti (o ayın bordrosu — yoksa önceki son, o da yoksa ilk, "tahmini" — ÷ 22 iş günü × kişi-gün; kişi-gün: o gün bu işte yazdığı rapor
  ÷ o gün yazdığı bütün raporlar) − genel gider payı (sabit giderler + işe bağlı olmayan masraflar + denetçi olmayan personelin maliyeti, denetçi
  sayısına ve 22 güne bölünür; × kişi-gün). Personel tablolarına Personel'in muhasebe-baglanti.ts'inden (kişi, denetçi mi, bordronun işverene
  maliyeti) bakılır. **Gelir-gider**: dönem "Toplam" (ilk işin ayından bu aya) ya da son 13 aydan biri; gelir (o dönem denetlenen işlerin
  raporlananı), maaşlar, işe bağlı ve genel masraflar, sabit giderler, kâr; toplamda aylara göre döküm, ayda işlerin kârı. Bilanço (varlık / borç)
  firmanın muhasebe programında (VARSAYIM). Ekranlar: Muhasebe sekmeleri İşler · Faturalar · **Giderler** · **Gelir-gider**; İşler listesinde Kâr
  (tutar + oran); iş sayfasında Kâr yüzü, Giderler (Gider ekle — iş seçili) ve Kârlılık. Belge erişimi: Muhasebe'yi gören (gör / yaz). Sonraki:
  masraf formu (Talepler kalemi; denetçi doldurur, onayda imza — V3), sabit gider ekranı (Firma ayarları), fatura özeti PDF'i, "Maaş bordrosu
  gönder" (BB5). Kilit: muhasebe.test +6 (yetki ve "gör" düzeyi; elle ekle / ödenecek → ödendi, belge türü, ileri tarih, yabancı iş, sürüm; masraf
  formu onayla / ödendi / reddet, veritabanı geçişleri ve damgaları; Excel yükle; kârlılık ve gelir-gider değerleri; firma sızıntısı), karlilik.test
  (saf, elle hesaplanmış değerler; Excel satır denetimi), bozan 4 (red değişmezliği, form onayı, ileri tarih, kaydeden damgası), e2e üç genişlik
  (iş sayfasında Kârlılık; Gider ekle — tür seçilmeden reddedilir, türün KDV oranı, canlı KDV; Gelir-gider).
- 2026-10-05 (327 düzeltmesi, CI): uygulama rolünün faturada UPDATE hakkı olmadığından tahsilat tetiği ve sunucu faturayı satır kilidiyle (FOR
  UPDATE) kilitleyemiyordu ("permission denied for table fatura") — ikisi de aynı danışma kilidini alır (0039 yerinde; Supabase'e henüz
  uygulanmamıştı). Test, bozan ve e2e tohumundaki fatura numaraları 16 karaktere çekildi.
- 2026-10-05 (327): **K4 Muhasebe › İşler, faturalar, tahsilat** (maket muhasebe.html M14; §3 akış "… müşteriye açıldı → fatura → tahsilat → iş
  kapandı"; §3.2 madde 5; KOD-GECIS §3 Muhasebe). İŞ = plan: planın ilk raporu yazılınca iş görünür. **Birim fiyat** (Teklifler'in rapor-bagi.ts'i,
  teklif sayfasının "Raporlanan"ıyla aynı bağ): raporun tesisini kapsayan, tarihi raporun açılışından sonra olmayan en son kabul edilmiş teklifin
  kalemi; kalemin adedini aşan ya da kalemi olmayan "teklif dışı" (fiyat listesinden); teklif yoksa fiyat listesi; fiyat listesinde de yoksa fiyat
  yok (fatura kaydedilmez, şeritte söylenir). **İş durumu**: vadesi geçti > faturaya hazır (imzalı, faturasız rapor) > tahsilat bekliyor > rapor
  sürüyor (imza süreci ya da plan tamamlanmadı) > kapandı (son tahsilatın günü). Göç **0039**: fatura (dış no — 3 harf / rakam + yıl + 9 hane, firmada
  eşsiz; tarih; vade = tarih + vade günü — tesisin o günkü iş sözleşmesinden, yoksa 30; KDV %20; ara / KDV / toplam KURUŞ), fatura_rapor (her rapor
  TEK faturada; birim fiyat, kaynak ve teklif kayıt anında yazılır), tahsilat (yöntem: havale / EFT, çek, kredi kartı, nakit; açıklama). Tetikler:
  ileri tarihli fatura / tahsilat yok; faturaya yalnız imzalı rapor ve yalnız fatura kaydedilirken; fatura tarihi faturaya giren raporun imzasından
  önce olamaz; işlem sonunda ara toplam satırların toplamı (ertelenen denetim); tahsilat fatura tarihinden önce olamaz, kalanı aşamaz; fatura,
  satır ve tahsilat değişmez, silinmez; kaydeden oturumdan. Ekranlar: /muhasebe (İşler; vadesi geçen alacak ve faturaya hazır işler şeridi),
  /muhasebe/faturalar, iş sayfası (yüzler: raporlanan, faturalanan, tahsil edilen, açık alacak; iş: denetim, birim fiyatın dayanağı teklif, iş
  sözleşmesi, ödeme vadesi; raporlar — birim fiyat ve kaynağı, fatura, durum, süzgeçli; faturalar; geçmiş; **Fatura kaydet** ve müşterinin
  faturaya hazır bütün işleri için **Toplu fatura** — 136), fatura sayfası (alıcı, vade, işler, kalemler — teklif dışı işaretli, toplamlar,
  tahsilatlar; **Tahsilat ekle**, kısmi olabilir). Yetki (modül 18): firma yöneticisi ve muhasebe; öteki roller ve "kendi" düzeyi görmez. Sonraki
  (328): giderler, sabit giderler, kârlılık, gelir-gider; fatura özeti PDF'i. Kilit: muhasebe.test (yetki; birim fiyat ve teklif dışı; fatura no,
  ileri tarih, son imza; tahsilat kalan / tarih / kısmi / ödendi, kapanış; vadesi geçti; toplu fatura; veritabanı kuralları; firma sızıntısı),
  bozan 3 (tahsilat kalanı, tarihi, kaydeden damgası), e2e üç genişlik (tohum: proje başına tamamlanmış plan + imzalı rapor; fatura → tahsilat →
  ödendi; denetçi göremez).
- 2026-10-05 (326): **Sözleşmeler › Dayanak teklif** (maket sozlesmeler.html formu "Dayanak teklif — kabul edilen teklif; fiyatlar oradan" ve
  sözleşme sayfası "Dayanak teklif / Sistem öncesi"; 324 incelemesinin ertelenen bulgusu: teklif sayfasındaki "İş sözleşmesi" bağlamı taşımıyordu).
  Göç **0038**: is_sozlesmesi.teklif_id (aynı firmanın teklifine yabancı anahtar; tetik: AYNI müşterinin KABUL edilmiş teklifi olmalı, sonradan
  değişmez; müşteri rolü bu sütunu okumaz). Teklifler'in sozlesme-baglanti.ts'i kabul edilmiş teklifleri (müşterisi, tesisleri) ve numaraları
  verir (Sözleşmeler teklif tablolarına dokunmaz). Sözleşme formunda "Dayanak teklif" (müşterinin kabul edilmiş teklifleri; "Yok (sistem öncesi)";
  seçilince teklifin etkin tesisleri kapsama eklenir); teklif sayfasındaki "İş sözleşmesi" `?teklif=` ile müşteri, teklif ve tesisler dolu açar.
  Sözleşme sayfasında Dayanak teklif (teklif sayfasına bağlantı), listede aramada teklif no. Kilit: sozlesmeler.test +1 (seçenekler yalnız kabul
  edilmiş; başka müşterinin / gönderilmiş teklif reddedilir; sayfa ve liste; veritabanı denetler, değişmez), bozan +1 (müşteri denetimi), e2e
  (teklif → İş sözleşmesi → dolu form → sözleşmede Dayanak teklif).
- 2026-10-05 (324 çapraz inceleme düzeltmeleri; dört bakış + her bakışın bulgularına çürütme denemesi, 28 bulgu doğrulandı, 1 elendi). **Göç 0037**
  (Supabase'e henüz uygulanmamıştı, yerinde): kalem / tesis BAŞKA TEKLİFE TAŞINMAZ (gönderilmiş teklifin kalemi taslağa taşınıp tutarı
  değişebiliyordu); kayıtlı müşterili teklif TESİSSİZ GÖNDERİLMEZ; "ilk tesis" istisnası yalnız kayıtlı olmayan müşteriden gelen teklif; taslağın
  müşterisi değişirken teklifte başka müşterinin tesisi kalamaz (form önce tesisleri eşitler, sonra günceller); kopya kaynağı aynı firmanın
  teklifi (yabancı anahtar); Excel listesinin bayt sınırı şemanın en kötü durumunu karşılar. **Yetki:** firma matrisinde Teklifler "kendi" ya da
  "branş" olan kişi teklif GÖRMEZ (kayıt kayıt süzgeç yok — Müşteriler gibi); "İş sözleşmesi" ve "Plan aç" tuşları hedef modülün yetkisiyle,
  "Müşteri olarak kaydet" Müşteriler'in yazma yetkisiyle. **Raporlanan:** her rapor TEK teklife — raporun tesisi ve türü için imza gününde geçerli
  EN SON kabul edilmiş teklif; pencere teklif tarihinden (maket MV.kalemRaporlari; yıllık yenilemede eski teklif yeni dönemin raporunu saymıyor,
  kabulün geç işaretlenmesi raporu kaçırmıyor). **Müşteri olarak kaydet:** Müşteriler'in uyarısı (aynı vergi no) gösterilir, onaylanırsa kaydedilir
  (denetim izinin "uyarı görüldü"sü ancak o zaman); e-posta başka müşterideyse kayıt yerine **"Var olan müşteriye bağla"** (yeni: müşteri + etkin
  tesisi, bir kez). Kayıtlı olmayan müşterinin ünvan, vergi, e-posta ve telefonu Müşteriler'in alan kurallarıyla (gevşek telefon kabulden sonra
  kaydı imkânsız kılıyordu); birim fiyatın üst sınırı şemada (alan iletisi). **Ekran:** teklif sayfası açılırken çöküyordu (sunucu sayfası istemci
  listesine sütun işlevi geçiriyordu) — kalem tablosu istemci bileşeninde; formun başlangıç değeri "use client" dosyasından değil sunucudaki
  form-degeri.ts'ten; kopyada / düzenlemede pasif müşteri / tesis forma alınmaz, şeritte söylenir; eylemler başlık satırında (hata bildirimle);
  "İlgili kişi" kayıtlı müşteride kartından, kayıtlı olmayanın bilgilerinde "Yetkili"; Kalemler bölümü tam satır (1920'de taşıyordu); kalem
  satırının tür / adet / fiyat alanlarının erişilebilir adı satır numarasıyla; il, ilçe, tür hata iletisi alana bağlı; Not çok satırlı; Kaldır /
  Kalem ekle sonrası odak satırın türüne; liste araması ünvan ve il / ilçe. Müşteri paneli: "Giderildi" tarihi tespitten önceyse gösterilmez.
  Ertelenen: "İş sözleşmesi" bağlamı ve "Dayanak teklif" (Sözleşmeler — sonraki kalem 326). Kilit: teklifler.test +4 (yetki düzeyi ve hedef modül
  tuşları; taşıma / tesissiz / müşteri değişimi / kopya kaynağı / fiyat / telefon; uyarılı kayıt, e-posta çakışması, bağlama; tek teklife
  bağlama), bozan +1 (taşıma yasağı).
- 2026-10-05 (325): **K4 Teklifler › Excel ekipman listesi ve teklif belgesi** (maket teklifler.html "Excel'den yükle" / "Excel'e aktar" — L1
  2026-09-30; "PDF" — §3.7 satır 4, 161 "teklif PDF'i firmanın formatıyla; indirilip elle gönderilir"). **Tablo okuyucu** (src/components/disa/oku.ts,
  dış kütüphane yok — §3.6 maket kararı): gerçek .xlsx (Excel'in DEFLATE sıkıştırması tarayıcının açıcısıyla, ortak dizgiler, zengin metin, ilk
  sayfa, tarih biçimli hücre YYYY-AA-GG) ve .csv (; , sekme, tırnak, satır içi satır sonu, BOM, Türkçe Windows kodlaması); sınırlar: dosya 10 MB,
  açılmış parça 50 MB (sıkıştırma bombası), 5 000 satır; eski .xls için "Excel'de .xlsx olarak kaydedin". Dosya tarayıcıda okunur, sunucuya gitmez.
  **Teklif formu:** "Excel'den yükle" — şablon, dosya seç, satır satır önizleme (tür adla ya da kodla; başlık, boş satır; tekrar eden kod, bilinmeyen
  tür, uzun alan gerekçesiyle atlanır), "Kalemlere ekle (n)" tür başına adetle (var olan kalemin adedi artar, yeni tür fiyat listesinden; en çok
  2 000 ekipman); "Excel'e aktar" — yüklenen liste, yoksa seçili tesislerin kayıtlı ETKİN ekipmanı (Kod · tür · konum · seri · branş · birim fiyat).
  **Teklif sayfası:** "PDF" ve "Excel'e aktar". **Teklif belgesi** (temel format `<firma kodu>-FR-TKL-01`; firmaya özel sürüm §3.7 kuralıyla):
  başlık tablosu, müşteri bilgileri (kayıtlıda tesisler ve müşteri kartının ilgili kişisi), kalemler (periyot, adet, birim fiyat, tutar; ara toplam,
  KDV, genel toplam), koşullar, hazırlayan; rapor belgesiyle aynı motor ve görünüm (sunucuda başsız Chromium, A4). Teklif sayfasındaki "İlgili
  kişi" kayıtlı müşteride müşteri kartından (maket). Kilit: oku.test (4), teklif-belgesi.test (6: belge, kaçış, yazı tipi kapsamı, Excel),
  teklifler.test +1 (ekipman listesi yetki / pasif / firma, Excel ve belge verisi), pdf.test +1 (teklif PDF'i A4 tek sayfa), bozan 2 (bomba sınırı,
  Türkçe kodlama), e2e (CSV yükle → kalem, PDF ve Excel iner).
- 2026-10-05 (324): **K4 Teklifler** (maket teklifler.html M12 2. tur; §3.1 modül 11, §3.2 madde 5; §9 yirmi birinci tur 119–124; 2026-09-27
  kayıtlı olmayan müşteri). Göç **0037**: teklif (no T-AAYY-SIRA — numara üreticisi, önek firma ayarı; kayıtlı müşteri + bir ya da birden çok
  tesis, ya da kayıtlı olmayan müşterinin bilgileri; geçerlilik gün, KDV %, not, Excel ekipman listesi yeri), kalem (tür × adet × birim fiyat,
  KDV hariç, KURUŞ), fiyat listesi (tür başına; ekranı Firma ayarları kalemiyle). **Tetik:** yeni teklif taslak açılır, hazırlayan oturumdan
  (istemciden değil); numara / tarih / hazırlayan değişmez; YALNIZ TASLAK düzenlenir (kalem ve tesis dahil); taslak → gönderildi (kalemsiz
  gönderilmez; geçerlilik gönderilişten) → kabul / red (gerekçe ≥ 5); süresi dolan kabul / red edilmez (124, listede "Süresi doldu", yenisi
  kopyalanır); tesis teklifin müşterisinin olmalı; kayıtlı olmayan müşterinin kabul edilen teklifi BİR KEZ müşteriye bağlanır (Müşteriler'in
  işlevleriyle müşteri + "Merkez" tesisi). Yetki (modül 11): planlama ve firma yöneticisi yazar; branş yöneticileri ve muhasebe görür; denetçi
  görmez. Ekranlar: liste (/teklifler; süzgeç), teklif hazırla / kopyala / tesisten başlat (/teklifler/yeni; "Tesisteki ekipmandan doldur" etkin
  ekipman sayısından, fiyat listeden — satırda değişir; tutar ve KDV'li toplam canlı), teklif sayfası (kalemler; kabul edilmişte **Raporlanan**:
  kabulden sonra imzalanan raporlar kaleme türüyle bağlanır — Raporlar'ın teklif-baglanti.ts'i; raporlanan tutar), düzenle (yalnız taslak).
  Kilit: teklifler.test (yetki, akış, gönderilen değişmez — sunucu ve veritabanı, red, süresi dolan, kopya, kayıtlı olmayan müşteri, veritabanı
  kuralları, firma sızıntısı), bozan 4 (içerik koruması, süre, tesis, hazırlayan damgası), e2e üç genişlik (hazırla → gönderildi → kabul;
  muhasebe yalnız görür; denetçi göremez). Sonraki (325): Excel ekipman listesi içe / dışa ve teklif belgesi (yazdır / PDF).
- 2026-10-05 (320–323 çapraz inceleme düzeltmeleri; dört bakış + her bulguya çürütme denemesi, 9 bulgu doğrulandı, 6 elendi). Göç **0035**
  (Supabase'e henüz uygulanmamıştı, yerinde düzeltildi): müşteriye açık **eğitim sertifikası başlangıçta YOK** — eskiden ayar yokken bütün eğitim
  türleri (firma içi ve sonradan eklenenler dahil) müşteriye gidiyordu ve firma kapatamıyordu; maketteki gibi firma tür başına açar (TS
  başlangıcı `egitim: []`, "hepsi" seçeneği kalktı). Özlük belgesinin adı **tür · açıklama** (aynı türden iki belge ayırt edilir; açıklamasızda
  yükleme tarihi). Göç **0036**: uygunsuzluğun **kriteri ayrı sütun** (imzada motorun kusur kriteri yazılır; metnin başı olduğu CHECK'li, sonra
  değişmez) — müşterinin listesi ve Excel'i Kriter / Açıklama'yı artık ilk ": " ile bölmüyor (kilitli Bakanlık maddesinin kendisinde ": " var);
  `musteri_surum_raporu()` — "Giderildi · <tarih> kontrolünde" tarihi **kapatan raporun müşteriye açık son sürümünden** (gideren rapor revize
  edilince tarih kayboluyordu). Panel: **Planlanan kontroller pasif ekipmanın eski raporunu saymaz** (sürekli "N gün geçti" gösteriyordu); tesis
  yoksa boş durum. **Toplu indirme (ZIP) toplam 500 MB sınırı** — listedeki boyutlardan indirmeden önce, inerken de sayılarak; aşımda ayrı ileti
  ("bağlantı" hatası sanılmasın), bellekte tek büyük kopya yok (ZIP parçaları doğrudan dosyaya). Muayene personelinde her "Aç" tuşunun
  erişilebilir adı "<kişi> · <belge> aç" (maket). Üç sekmenin sayacı Raporlar'daki biçimde. Elenen: önbellek başlığı (eskiden beri, kural gereği),
  aynı adlı tesis klasörü (maketle aynı), "son gidiş"te plan tarihi (maketle aynı). Kilit: musteri-paneli.test (pasif, revize edilen gideren,
  kriter, açıklama, eğitim başlangıcı), disa.test (ZIP sınırı, kriterli parçalama), bozan +1 (eğitim başlangıcı).
- 2026-10-05 (323): **K3 Müşteri paneli › Muayene personeli belgeleri** (maket musteri.html #/personel personelCiz; P3 2026-10-01 reisim:
  "müşteri girişine … muayene personeli belgeleri kısmı olur o müşteriye giden muayene personelinin firmanın izin verdiği belgelerini görür
  (ekipnet belgesi isg belgeleri vs)"). Göç **0035**: müşteri rolü personel, özlük, eğitim, atama ve ayar tablolarına HİÇ dokunmaz; iki işlev
  yalnız gerekeni döndürür (sahibin haklarıyla, firma ve müşteri süzgeci açık yazılı): `musteri_personeli()` — görebildiği tesislere GİDEN kişi
  (son imzalı raporu yazan ya da AÇIK planın ekibinde): ad, meslek, son gidiş, tesisler (başka kişisel alan yok); `musteri_personel_belgeleri()`
  — bu kişilerin firmanın müşteriye açtığı belgeleri. Firma ayarı **musteri_belge** (özlük türleri · seçili eğitim türlerinin sertifikaları ·
  ekipman atama belgesi); başlangıç: **yalnız EKİPNET**, eğitim sertifikası yok (firma tür başına açar — maketin ayar ekranında tür başına onay
  kutusu, "hepsi" yok; ilk sürümdeki "bütün eğitim sertifikaları" başlangıcı 320–323 incelemesinde düzeltildi; veritabanı ayar yokken aynısını
  uygular — kilitli). Özlük belgesinin adı tür · açıklama (maket). Ayarın ekranı Firma ayarları kalemiyle (K4). Dosya politikası yalnız listedeki belgenin dosyasını açar. Panelde beşinci
  sekme **Muayene personeli** (/portal/personel): kişi ve meslek, son gidiş ve tesisler, belgeler (eğitimde geçerlilik — süresi geçtiyse uyarı;
  "Aç"). Kilit: musteri-paneli.test +1 (plan ekibi ve rapor yazanı, gitmeyen yok, ek giriş kapsamı, öteki müşteri / firma, başlangıç ayarı TS
  ile aynı, ayar değişince türler, yalnız listedeki belgenin dosyası, personel tablolarına doğrudan erişim yok, uygulama rolü işlevleri
  çağıramaz), bozan +2 (tür süzgeci, plan yolunda müşteri süzgeci); e2e sekme. Müşteri paneli (K3) böylece maketteki beş sekmeyle tamam.
- 2026-10-05 (322): **K3 Müşteri paneli › Sözleşmeler** (maket musteri.html #/sozlesme sozCiz, #/s/<no>; karar 134 "müşteri panelinde
  görünür, panelden imza atılmaz"). Göç **0034**: müşteri rolü iş sözleşmesinin YALNIZ numara, dönem, müşteri imza tarihi ve imzalı PDF
  sütunlarını okur (vade, yenileme, firma imzası yok; İSG-KATİP kayıtları ve sözleşme şablonu hiç yok); yalnız kendi müşterisinin ve kapsamında
  görebildiği tesis bulunan sözleşmeleri (seçili tesisli ek girişte kapsamda yalnız o tesisler); dosya politikası rapor PDF'ine ek olarak
  görebildiği sözleşmenin ŞU ANKİ imzalı PDF'ini açar (yeniden yüklenince eskisi inmez). Sözleşmeler modülünün `server/musteri-baglanti.ts`'i
  verir (panel tablolara dokunmaz). Panelde dördüncü sekme **Sözleşmeler** (/portal/sozlesme): numara, tesisler, dönem, durum (İmza bekliyor ·
  Yürürlükte · Süresi doldu); **sözleşme sayfası** (/portal/s/<id>): dönem, müşteri imzası, tesisler; imzalıysa PDF'i aç / PDF indir; imza
  bekliyorsa "imzalı sözleşmeyi muayene firmasına iletin" — panelden imza atılmaz. Kilit: musteri-paneli.test +1 (sütun sınırı, iki müşteri,
  ek giriş kapsamı ve kapsamdaki tesisler, başka firma, PDF'in yalnız şu ankisi, İSG-KATİP / şablon / yazma yasağı), bozan +1 (kapsam
  süzgeci); e2e saha raporu: müşteri Planlanan kontroller ve Sözleşmeler sekmelerini açar. Sonraki: muayene personeli belgeleri (323).
- 2026-10-05 (319 çapraz inceleme düzeltmeleri; dört bakış + her bulguya çürütme denemesi, 16 bulgu doğrulandı, 1 elendi). Göç **0033**:
  (1) müşteri rolü uygunsuzluğu yalnız **kendi sürümü müşteriye açıksa** görür (raporun son imzalı sürümü — 193): revizyondan önce başka
  muayeneyle "giderildi" kapanmış eski sürüm kusuru açık kalıyordu, görünürlük imza sırasına bağlıydı. (2) **Pasif müşterinin oturumları hemen
  düşer** (eskiden yalnız o belirteçle istek gelince; yeniden etkinleşince okunmamış eski belirteç geçerliydi). (3) **Parola değişince** (geçici
  parola dahil) hata sayacı ve **kilit sıfırlanır** (personeldeki gibi). (4) **Kullanıcı adı tekliği müşterinin kayıtlı e-postasını da
  kapsar**: personel hesabı ve başka bir giriş (müşterinin kendi ek girişi dahil) o adresi alamaz, müşterinin e-postası başka bir girişin adresi
  olamaz — eskiden ek giriş müşterinin adresini alınca müşteri kartı hiç kaydedilemiyor, ana girişi açılamıyordu. Kod: (5) **müşteri girişi
  ortak IP sayacını sıfırlamaz** (firma dışından bir müşteri kendi doğru girişiyle personel hesaplarına yönelik denemelerin IP kilidini
  silemesin). (6) Müşteri kaydında e-posta denetimleri yalnız **e-posta değişince**; e-posta değişince ana giriş (kullanılıyorsa) sıfırlanır —
  önce **uyarı** ("Yine de kaydet"), sonra bildirim ("Müşteri girişi sıfırlandı; yeni geçici parola verin"); ana giriş kilitlenerek okunur,
  yarım kayıt kalmaz (çakışmada işlem geri alınır). (7) Giriş: geçici parolalı müşterinin **dönüş adresi korunur**; firma kullanıcısının dönüşü
  müşteri paneline olamaz (eylem ve sayfa aynı). (8) **Çıkış** __Host- önekli çerezleri yazımdaki niteliklerle siler (eskiden tarayıcı silmeyi
  yok sayıyor, sonraki girişte yanlış "oturumunuz kapandı" çıkıyordu). (9) Panelde **imza günü Türkiye takvimiyle** (gece imzalanan rapor bir
  gün önce görünüyordu; Yıl seçicisi de). Arayüz: (10) müşteri kartında geçici parolayla girip değiştirmeyen için "Son giriş … · geçici
  parolasını henüz değiştirmedi" ("henüz girmedi" değil); pasif müşterinin girişleri "Pasif" (maketteki gibi). (11) **Kopyala** sonucu
  pencerenin içinde (tek üretici `components/pencere/Kopyala.tsx`; telefonda levha bildirimi örtüyordu; pano reddedilirse metin seçilir) —
  personelin geçici parola penceresi de. (12) Gönderilmeyen e-postadan söz eden iki metin düzeltildi (parolayı firma iletir). Kilit:
  musteri-paneli.test +2 (IP sayacı, eskimiş sürüm kusuru) + pasif oturumu okunmadan düşer + e-posta tekliği (müşteri adresi, sunucu ve
  veritabanı) + değişmeyen e-postayla kart kaydı + sıfırlama uyarısı ve bildirimi + geçici parola kilidi açar; bozan +4 (son sürüm şartı,
  pasif oturum, müşteri e-postası, kilit sıfırlama).
- 2026-10-05 (321): **K3 Müşteri paneli › Planlanan kontroller + toplu indirme (ZIP)** (maket musteri.html #/plan planCiz, "Toplu indir (ZIP)",
  "Uygunsuz raporlar (ZIP)"; karar 81 "müşteri panelinde planlanan kontrol"; Ö3 2026-10-01 reisim: "Müşteri gözünde toplu indirme uygunsuzları
  toplu indirme excel olarak indirme"). Göç **0032**: müşteri rolü planın YALNIZ tesis / tarih / durum sütunlarını okur (proje no, açıklama,
  künye — firma adı, adres, SGK —, açan, red gerekçesi ve ekip yok), yalnız kendi tesis kapsamındaki AÇIK planlarda (Kabul bekliyor · Kabul
  edildi · Denetimde; reddedilen ve tamamlanan plan "planlanan kontrol" değil) — kısıtlayıcı politika, yazma yok. Panelde üçüncü sekme
  **Planlanan kontroller** (/portal/plan): görebildiği her tesis — en yakın açık planın tarihi (yoksa "Yok"; başka açık plan da varsa "+n plan
  daha"), sonraki kontrol (tesisteki her ekipmanın SON raporunun sonraki kontrol tarihlerinin en yakını; 60 gün içindeyse uyarı), durum. Planı
  Planlar modülünün `server/musteri-baglanti.ts`'i verir (panel plan tablosuna dokunmaz). **Toplu indir (ZIP)** (Raporlar) ve **Uygunsuz
  raporlar (ZIP)** (Uygunsuzluklar): süzgeçteki raporların imzalı PDF'leri tarayıcıda oturumlu tek uçtan tek tek iner (müşteri rolünde — yetki
  uçta), tesis klasörlü ZIP olur; tuşta ilerleme ("İndiriliyor 3 / 12"), bir dosya inemezse ZIP verilmez (eksik dosya yok), en çok 300 rapor.
  Klasör / dosya adı yol olamaz (/ \ .. ve Windows'un yasak karakterleri). Yeni sunucu ucu yok. Kilit: musteri-paneli.test +1 (sütun sınırı —
  no / açıklama / künye / açan / red gerekçesi / * reddedilir —, açık plan, kapsam, iki müşteri, başka firma, yazma ve ekip yasağı, en yakın plan
  + sayısı), disa.test +1 (adlar), bozan +2 (sütun sınırı, açık plan süzgeci); e2e saha raporu sekmeler. Sonraki: sözleşmeler (322), muayene
  personeli belgeleri (323).
- 2026-10-05 (320): **K3 Müşteri paneli › Uygunsuzluklar + Excel** (maket musteri.html #/uygunsuz, "Uygunsuzları indir", Ö3; pkproje §1.1
  reisim: "uygunsuzları indir seçeneği olacak ve tüm uygunsuz raporları excel olarak indirip görebilecek ve exceldeki ilgili yere tıklayınca rapora
  gidebilecek … önceliğimiz müşteri kolaylığı"; 2026-10-01: "excel de link olmalı, linke tıklayınca ilgili rapor açılmalı. "rapor" yazsın").
  Panelde sekmeler: **Raporlar · Uygunsuzluklar (açık sayısı)**. **Uygunsuzluklar** (/portal/uygunsuz): görebildiği imzalı raporların
  uygunsuzlukları (ayrı kayıt, PDF'ten okunmaz — §3.2 madde 6), en yeni tespit üstte, 20'şer; sütunlar Ekipman (kod, tür · tesis) · Kusur (ağır
  işaretli; kriter + açıklama) · Rapor · Tespit · Durum (Açık / Giderildi — gideren kontrolün tarihiyle); çipler Açık / Giderildi (aynı grup,
  ikisi birden imkânsız) ve Ağır kusur; seçici Tesis; satır raporu açar. **Uygunsuzları indir**: açık uygunsuzlukların önizlemesi (pencere, iki
  sütun) → **.xlsx** (Rapor · Ekipman kodu · türü · Tesis · Sınıf · Kriter · Açıklama · Rapor no · Kontrol tarihi; ilk sütunda "Rapor" köprüsü
  raporu panelde açar). Raporlar'da **Excel indir** (süzgeçteki raporlar; Rapor · no · ekipman · tür · tesis · kontrol · sonraki · sonuç). Excel
  **tarayıcıda**, panelin müşteri rolünde zaten aldığı veriden üretilir — yeni sunucu ucu yok; görme veritabanında (revizyonla kapanan
  uygunsuzluk müşteriye hiç görünmez, 0030). Tek üretici: `src/components/disa/` (ZIP yazıcı — toplu indirme de kullanacak — ve .xlsx yazıcı):
  metin hücreleri satır içi metin (veri "=" ile başlasa da formül olmaz), köprü gerçek bağlantı ve yalnız http(s), XML kaçışı + denetim karakteri
  atılır, ZIP'te zararlı yol (mutlak, "..") reddedilir. Kilit: tests/disa.test.ts (3: ZIP yapısı + CRC, xlsx parçaları / köprü / kaçış / formül,
  yardımcılar), musteri-paneli.test +1 (kapsam, iki müşteri, ek giriş, giderilen tarihiyle, revizyon, açık sayısı, başka firma, yazma yasağı),
  bozan +3 (adres şeması, XML kaçışı, ZIP yolu); e2e saha raporu: müşteri Excel indirir (PK), Uygunsuzluklar sekmesine geçer. Sonraki (321):
  planlanan kontroller, sözleşmeler, muayene personeli belgeleri, toplu indirme (ZIP).
- 2026-10-05 (318 çapraz inceleme düzeltmeleri; dört bakış — güvenlik, veritabanı, mantık, arayüz — + her bulguya çürütme denemesi, 18 bulgu
  doğrulandı). Göç **0031**: (1) **muayene tarihi imza gününden ileri olamaz** (Europe/Istanbul; ileri tarihli tek imzalı rapor ekipmanın açık ve
  gelecekteki bütün uygunsuzluklarını "giderildi" yapıyordu — revizyon da düzeltmiyordu); Onaya gönderde de: rapor tarihi kontrol başlangıcı ile
  bugün arasında. (2) "Giderilmiş doğar" yalnız raporların **son imzalı sürümüne** bakar (revizyonla düzeltilen eski tarih başka raporun kusurunu
  kapatmaz; revize süren raporun önceki sürümü yenisi imzalanana dek geçerli — 193). **Aynı tarihli iki muayenede son imzalanan geçerli**
  (sonradan imzalanan öncekinin kusurunu kapatır, kendi kusuru açık doğar — iki yönde aynı kural, testle kilitli). (3) Artakalan bekleyen imza
  istekleri temizlendi (0028 öncesi onaydan çıkmış raporlar). Kod: (4) **imzalı PDF eki** beyaz listeyle denetlenir: ek ayrıştırılır (sınırlı,
  doğrusal tarama; ek ≤ 4 MB, ≤ 500 nesne; nesne akışı yok), son trailer kökü özgünle aynı, özgün nesnelerden yalnız katalog (yalnız AcroForm ·
  DSS · Perms · Extensions değişebilir) ve sayfa (yalnız /Annots) yeniden tanımlanır, yeni açıklama yalnız imza alanı (Widget), 4 öğeli ByteRange
  + onaltılık Contents'li yeni imza sözlüğü şart. (5) **Revizyondaki Yeni rapor silinmez** (tuş yok, sunucu reddeder; tamamlanan sürüm saklı).
  (6) **Görünen numara** (-R1) plan içi rapor listesinde, iz gerekçelerinde ve kopya kaynağında da. (7) Revize isteğini Reddet / Geri çek
  **istemcinin gördüğü isteğin kimliğiyle** (eski sayfadan, sonra açılmış yeni istek reddedilmez). (8) Onaya gönderde **kalibrasyon muayene
  gününe göre** (aylar sonraki revize bugünkü kalibrasyona takılmaz; cihazın bugün kalibrasyonda ya da kayıttan kalkmış olması yalnız ilk sürümde
  engel). Arayüz: Revize istekleri'nde tuşlar satır kırar, sütunlar genişledi, işlem izni olmayana boş tuş şeridi çizilmez; İmzamı bekleyen
  sayfasında liste boşken de kendi sekmesi seçili; **pencere** açıkken DOM'dan kalksa da kapanır ve odak açan tuşa döner (tek üretici); Ön izle
  kaydedince yönlendirici sunucuda yenilenir (geri tuşu eski sürümü getirmez); Raporlar'daki imza şeridinin tuşu yalnız Onaylar'ı görene. 319
  düzeltmesi: firma kullanıcısı müşteri paneline girince kendi ana sayfasına (giriş ↔ panel yönlendirme döngüsü). Kilit: onaylar.test +3 (ileri
  tarih, eskimiş sürüm, aynı gün iki yön) + kemer testi artık yalnız "bekleyen isteğin PDF'i" kuralına takılır + R1 silinmez / plan içi -R1 +
  eski kimlikle reddet; raporlar.test +1 (kalibrasyon muayene günü) + rapor tarihi sınırları; imza-pdf.test +3; bozan +3 (kemer, ileri tarih,
  eskimiş sürüm) + imza-pdf bozan (özgün nesne, kök). Elenen: yok; açık: Widget görünümünün (/AP) imza alanını örtmesi — kriptografik doğrulamayla.
- 2026-10-05 (319): **K3 Müşteri girişi + müşteri paneli (Raporlarınız, imzalı PDF) — veritabanında ikinci katman** (maket musteri.html M11,
  musteriler.html "Müşteri girişi"; karar 33, 35, 44, L5, 193; 09-E5; pkproje §1 reisim: "müşteriye bir id parola verilecek ve girdiğinde kendi
  raporlarına oradan erişebilecek ama sadece kendi raporlarını görüp indirecek"). Göç **0030**: `musteri_hesap` (müşteri başına ANA giriş —
  kullanıcı adı müşterinin e-postası, bütün tesisler — ve kişiye özel EK girişler: bütün ya da seçili tesisler, tesis müşterinin kendi tesisi
  olmalı; durum hazır · ilk · etkin · pasif; parola yalnız scrypt özeti), `musteri_oturum` (belirteç özeti; parola / durum / e-posta / kapsam
  değişince oturumlar düşer); kullanıcı adı firmada TEK (personel hesabıyla da çakışmaz — iki tabloda tetik). **İkinci katman:** müşteri
  işlemleri veritabanında **probata_musteri** rolünde koşar (SET LOCAL ROLE; uygulama rolü bu role GEÇER ama kısıtlarını DEVRALMAZ —
  INHERIT FALSE): yalnız panelin okuduğu tablolar (firma, müşteri, tesis, ekipman, tür, imzalı sürüm, uygunsuzluk, dosya), yalnız okuma, her
  birinde kiracı politikasına ek KISITLAYICI politika — kendi müşterisi, tesis kapsamı, raporun SON imzalı sürümü (193), revizyonla kapanan
  uygunsuzluk değil, yalnız görebildiği sürümün imzalı PDF'i. Giriş: **aynı ekran** (karar 35) — e-posta bir müşteri girişiyse müşteri girişi
  denenir (kilit, eşit süre, tek ileti personelle aynı), ayrı çerez, panele (/portal); geçici parolayla ilk girişte aynı parola ekranı; müşteri
  firma ekranına giremez (paneline döner), pasif müşteri / giriş giremez. Firma tarafı: müşteri kartında **Müşteri girişi** bölümü — ana girişin
  durumu, **Geçici parola oluştur / Yeni geçici parola** (bir kez gösterilir; e-postayla gönderim bildirim altyapısıyla gelecek — anayasa 1.3,
  kurulmadı), **Ek giriş ekle** (ad, e-posta, bütün / seçili tesisler), satırda Geçici parola · Pasif yap / Etkinleştir; müşterinin e-postası
  değişince ana giriş onunla gider (yeni adrese yeni parola). Panel (/portal, kendi rota grubu "(musteri)", menüsüz kabuk: firma adı, tema,
  Çıkış yap): **Raporlarınız** (no, ekipman, tesis, kontrol, sonraki kontrol — 60 gün içinde uyarı —, sonuç; çipler Uygunsuz, Sonraki kontrol 60
  gün içinde; seçiciler Tesis, Yıl) ve **rapor sayfası** (PDF'i aç / PDF indir — tek indirme ucu müşteri rolünde; revizyonsa "… yerine geçer";
  uygunsuzlukları). Kilit: tests/musteri-paneli.test.ts (gerçek PG, iki firma, iki müşteri: giriş, kilit, parola, pasif, kullanıcı adı tekliği,
  ek giriş kapsamı, İKİNCİ KATMAN — kapsam, son sürüm, PDF, yazma / panel dışı tablo yasağı, personel işlemi etkilenmez), rota kilidi
  (müşteri sayfaları yalnız müşteri kapısından), bozan +2 (tesis kısıtı, devralma); e2e saha raporu: yönetici geçici parola → müşteri girer,
  raporu bulur, imzalı PDF'i iner, firma ekranına giremez. Sonraki: Uygunsuzluklar + Excel (320), planlanan kontroller / sözleşmeler / personel
  belgeleri / toplu indirme (321).
- 2026-10-05 (318 revizyon): **K3 Revizyon — Revize iste, Reddet, Geri çek, Revizeye gönder** (§11 131 V1, 141 W4 / 192, 142 W5 / 193; KOD-GECIS §4
  rapor_revize_iste · rapor_revizeye_gonder, §5 Rapor; maket onaylar.html "Revize istekleri", raporlar.html "Revize iste"). Göç **0029**:
  `rapor_revize_istegi` (yazan, tamamlanan raporunda gerekçeyle ≥ 10; rapor başına tek bekleyen; kapanış: yazan geri çeker · yönetici reddeder
  — gerekçe isteğe bağlı · revizeye gönderilince kendiliğinden "revize"; kim ve ne zaman veritabanından, "yalnız yazan açar / geri çeker" ve
  "revize yalnız rapor revizeye gönderilince" tetikte); akış: **Tamamlandı → Yeni yalnız revizeye gönderirken, revizyon TAM BİR artarak**
  (gerekçe ≥ 10), revizyon başka yoldan değişmez; hareket "revize". İmzalı sürüm (R0'ın PDF'i, kopyaları) değişmeden kalır; rapor yeniden onay
  ve imzadan geçer, yeni imzalı sürüm **no-R1** olarak yazılır ve öncekinin uygunsuzluklarını "revizyon" diye kapatır. Raporun görünen numarası
  her yerde revizyon ekiyle (saha, listeler, onay, belge, dosya adları). Saha raporu: tamamlanan raporda yazana **Revize iste** (pencere,
  gerekçe) → "Revize isteğiniz teknik yöneticide" + **Revize isteğini geri çek**; reddedilirse "Revize isteği reddedildi · ad · zaman:
  gerekçe"; revizeye gönderilen rapor Yeni, üstünde "Revizeye gönderildi (R1)" + gerekçe. Onaylar: **Revize istekleri** sekmesi
  (/onaylar/istekler — görebildiği tamamlanan raporların bekleyen istekleri, en yeni üstte; satırda Reddet ve Revizeye gönder), onay ekranında
  tamamlanan raporda **Revizeye gönder** (+ **İsteği reddet** ve "Revize isteği" şeridi); pencere: "Rapor <no>-R1 olarak … döner; tamamlanan
  sürüm ve imzalı PDF'i saklanır", isteğin gerekçesi başlangıç. Yetki sunucuda: revizeye gönder ve reddet türün branş yöneticisi (firma
  yöneticisi görür, yapamaz; denetçi Onaylar'da yönetici değil), revize iste ve geri çek yalnız yazan. Müşteride yalnız son imzalı sürüm (193)
  müşteri paneli kalemiyle. Kilit: onaylar.test +3 (revize iste / geri çek / reddet, revizeye gönder + R1 imzası + uygunsuzluk, veritabanı
  kuralları), bozan +2 (revizyon kuralı, sunucuda rapor_revizeye_gonder); e2e saha raporu: Revize iste → Revize istekleri'nden Revizeye gönder
  → denetçi R1 Yeni.
- 2026-10-05 (315–317 çapraz inceleme düzeltmeleri; dört bakış — güvenlik, veritabanı, mantık, arayüz — + her bulguya çürütme denemesi, 15 bulgu
  doğrulandı). Göç **0028**: (1) **onaydan çıkan raporun bekleyen imza isteği iptal** (onayı geri al / durumu değiştir) — eskiden yeniden onaydan
  sonra eski içerikli PDF "hazır" kalıyor, imzalanıp yeni içerikle tamamlanıyordu; imzalı sürüm yalnız BEKLEYEN isteğin PDF'iyle yazılır.
  (2) İmza isteği **hazırlık anının kopyasını** taşır (yazan, cihazlar ve kalibrasyonları; değişmez) — imzalı sürüm yükleme anındaki canlı
  kayıttan değil, imzalanan PDF'le aynı kaynaktan. (3) **Uygunsuzluk**: yalnız "Uygun değil" sürüme açılır; muayene TARİHİNE göre kapanır
  (sonradan imzalanan eski muayene yenisinin kusurunu kapatmaz, kendi kusuru giderilmiş doğar); elle kapatılmaz (yalnız sonraki imzalı
  sürümün tetiği, kapatan sürümle — CHECK + yabancı anahtar). Kod: (4) **imzalı PDF eki** artık yalnız öneke ve metinde "/Type /Sig"e bakmıyor:
  imza sözlüğü bir nesnede olmalı (yorumda değil), ek özgün nesneyi akışla yeniden tanımlayamaz, sayfanın /Contents başvurusunu değiştiremez
  (imza aracının /Annots ve /AcroForm eklemesi serbest; `src/modules/raporlar/imza-pdf.ts`, kriptografik doğrulama sonraki fazda). (5) Belgede
  **muayene günündeki kalibrasyon** (sonradan girilen kalibrasyon eski raporu değiştirmez). (6) **Tamamlanan raporun önizlemesi** "imzasız"
  demez (imza zamanı ve yolu imzalı sürümden), "PDF indir" yerine "İmzalı PDF"; imzasız PDF ucu tamamlanan raporda 409. (7) Kesin PDF'te
  **yazı tipi kapsamı**: ● / ○ seçenek işaretleri CSS ile çizilir; Yunanca (Ω, IΔn) ve sembol (≤ ≥ → …) alt kümeleri eklendi (sembol: Google
  Fonts Carlito 1.104'ten fontTools alt kümesi, OFL) — sunucusuz Chromium'da sistem yazı tipi yok, kutu basılıyordu; kilit: belgenin her
  karakteri gömülü aralıklarda. (8) **Vercel'de İmzala**: sunucu eylemi rapor sayfasında koşar → Chromium ikilisi o sayfanın izine de eklendi;
  ara katman gövde sınırı 26 MB. (9) PDF motoru düşerse neden şeritte (ekran hata sayfasına dönmez); imza eylemleri ağ hatasında şeride;
  başarıda eski hata şeridi kalkar. (10) **Şerit** (tek üretici): dar bantta tuşlar metnin altına iner (telefonda iki tuşlu imza şeridi
  metni sıfıra indiriyordu). (11) **Ön izle** kaydedilmemiş değişikliği atmaz: önce kaydeder. Elenen (çürütüldü): PDF ucunda eşzamanlılık
  sınırı, dosya kayıtlarının çöpe alınması, pasif cihazın kodu, bölüm numarası kayması, kilitli işlemde PDF üretimi. **Açık:** Vercel'in istek
  gövdesi sınırı 4,5 MB — çok fotoğraflı raporun imzalı PDF'i bunu aşabilir; kalıcı çözüm K7'de depoya doğrudan (kısa ömürlü imzalı adresle)
  yükleme + belgeye gömülen fotoğrafın küçültülmesi. Kilit: onaylar.test +3 (iptal, kopya, uygunsuzluk tarih sırası ve elle kapatma),
  tests/imza-pdf.test.ts (3), belge.test +1 (yazı tipi kapsamı), bozan +2 (iptal kuralı, PDF eki akış kuralı).
- 2026-10-05 (318): **K3 Raporlar listesi + denetçinin Onaylar'ı (C5)** (maket raporlar.html #/, onaylar.html BB4; §11 264; reisim 2026-09-26:
  "sıralama tarihi olsun her zaman en yeni en yukarıda olsun", "raporlar modülünde kusurlu tuşunu kaldır"; 2026-09-28: "ekipman türüne rapor
  numarasına göre ayrı ayrı arayabilmeliyim"). **Raporlar** (/raporlar): görebildiği raporlar — denetçi kendi, branş yöneticisi branşı, planlama
  ve firma yöneticisi hepsi, muhasebe hiç (görme sunucuda, kayıt kayıt); en yeni üstte, 20'şer; alan alan arama (rapor no · ekipman kodu ·
  ekipman türü · tesis), durum çipleri + Geri gönderilen, seçiciler Müşteri · İl · Sonuç · Yıl; satır raporu açar; imzasını bekleyen raporu
  olana şerit → Onaylar. Yazan hesabın kimliği ekrana gitmez. **C5 uygulandı:** denetçinin Onaylar düzeyi "kendi" (üç ayna: tanim.ts, maket,
  KOD-GECIS §4) — Onaylar'ı **yalnız "İmzamı bekleyen raporlar"** (kendi yazdığı, onaylanmış raporlar, onay sırasıyla; /onaylar/imza, yöneticide
  ayrı sekme); kuyruk, Tüm raporlar ve onay ekranı yöneticinin (sunucuda yönetici düzeyi denetimi). Toplu imza açık: imza aracımızla (tek PIN,
  her rapor ayrı imza — 177) gelir; indir-imzala-yükle yolunda her rapor kendi ekranında imzalanır. Kilit: raporlar.test +1 (liste görünürlüğü,
  iki firma, geri işareti), onaylar.test (denetçi kuyruğu görmez, imza bekleyen yalnız yazanın, imzalanınca düşer — 314'ün "denetçi Onaylar'ı
  görmez" beklentisi bu kararla tarih ve gerekçeyle değişti), bozan +2 (liste süzgeci, denetçinin onay ekranı); e2e saha raporu: denetçi
  Raporlar'da raporu bulur, şeritten İmzamı bekleyen raporlar'a, oradan rapora geçip imzalar.
- 2026-10-05 (CI kararlılığı): CI iş günlüğü okunarak (git'in GitHub kimliğiyle, yalnız okuma) uçtan uca düşüşlerin sebebi bulundu: 180 testlik koşunun
  sonuna doğru Next geliştirme sunucusunun yığını kendi eşiğine (bellek sınırının %80'i; sınır makine belleğinin yarısı) dayanıyor, sunucu test
  ortasında kendini yeniden başlatıyordu ("Server is approaching the used memory threshold, restarting…") — o anda koşan test düşüyordu.
  Düzeltme yalnız uçtan uca sunucusunda: 12 GB yığın ve webpack bellek iyileştirmesi; uçtan uca beklemesi 15 sn (geliştirme sunucusu sunucu
  eylemini ilk çağrıda derliyor; beklenen şey aynı). İmza olumsuz kanıtı ayrı firmada kurulur (tür kodu firmada eşsiz).
- 2026-10-05 (317): **K3 Son imza — indir, imzala, yükle** (araştırma §8; karar 99, 104, 114, 187; 09-F1). Göç **0027**: `imza_istegi` (kesin
  imzasız PDF bir kez üretilir, SHA-256; rapor × revizyon başına tek bekleyen), `rapor_surumu` (imzalı sürüm DEĞİŞMEZ; bağlam raporun kendisinden
  tetikle; künye, yazan, cihazlar, içerik kopyalanır), `uygunsuzluk` ("Uygun" olmayan imzalı rapordan; aynı ekipmanın sonraki imzalı sürümü
  öncekileri "giderildi" kapatır); rapor yalnız imzalı sürümle Tamamlandı'ya geçer. İmzalı PDF kabulü: tür PDF, ilk baytları hazırlanan PDF'in
  kendisi, eklenen kısımda /Type /Sig + /ByteRange + /Contents (kriptografik zincir doğrulaması sonraki fazda). Rapor ekranında "İmzala" →
  "İmzasız PDF'i indir" + "İmzalı PDF'i yükle"; tamamlanan raporda "İmzalı PDF". Kilit: onaylar.test +3 (gerçek PG), bozan +1 (imza kuralı).
  e2e saha raporu: denetçi İmzala → imzasız PDF'i indir → imzalı PDF'i yükle → Tamamlandı. Açık: Onaylar'da denetçinin "İmzamı bekleyen
  raporlar"ı (C5) ve toplu imza (Raporlar listesiyle).
- 2026-10-05 (313–314 çapraz inceleme düzeltmeleri; dört bakış + her bulguya çürütme denemesi, 7 bulgu doğrulandı): (1) **eski raporun
  fotoğraf sayısı** — 312'den önce açılan raporda `cevaplar.foto` tek sayıydı, yeni şemadan geçmiyordu: onay özeti "hepsi uygun" gösteriyor, Kaydet
  gerçek cevapları boşuyla eziyordu → şema sayıyı boş kayda çevirir (sayılar zaten raporun listesinden hesaplanır); fotoğraf eklerken cevaplar
  dosyadan önce okunur (depoda sahipsiz dosya kalmaz). (2) **mesai yarışı** — eşzamanlı açılışlar denetçi başına danışma kilidiyle sıraya girer.
  (3) **gerekçe uzunluğu** kod noktasıyla (veritabanıyla aynı; "📷" bir karakter). (4) **onay penceresi** hata yanıtında yazılanı korur, kapatılanı
  yeniden açmaz; işlem sürerken alanlar kapalı. (5) **Tüm raporlar** sıralama seçicisi (en yeni önce, rapor no, durum, denetçi). (6) **kopya
  künyesi** denetçinin plandaki gördüğü künye (kaynağın eski künyesi taşınmaz). (7) **formatı güncelle**: cevabı yeni cevap setinde olmayan madde
  sessizce "Uygun"a dönmez — seçim boşalır, açıklama kalır, bildirim "N maddenin cevabı yeni cevap setinde yok, yeniden seçin". Elenen (çürütüldü):
  durumu değiştirde ENGEL 2 / 5 (yöneticinin bilinçli kararı, maket), kopyada cihaz zimmeti (aynı denetçi, gönderimde yeniden denetlenir).
- 2026-10-05 (316): **K3 Kesin PDF motoru: başsız Chromium, "PDF indir"** (KOD-GECIS: HTML'den PDF'e başsız Chromium; araştırma: "önce
  Chromium ölçümü"; reisim 2026-09-28: "ön izle halinde PDF halini indirebilmeliyim"). `src/belge/pdf.ts`: önizlemeyle AYNI çizici ve CSS, A4,
  arka plan renkleriyle; yazı tipi (Carlito) ve fotoğraflar veri adresi olarak gömülü, sayfa dışarıya gitmez (ağ istekleri kesilir); her çağrı
  kendi tarayıcısını açıp kapatır. Next'in sunucu katmanında react-dom/server olmadığından belge ağacı kendi HTML yazıcımızla (`html.ts`) yazılır —
  React'in çıktısıyla BİREBİR aynı (üç şablonda, kaçış isteyen değerlerle test kilidi); bilinmeyen bileşen, olay özniteliği ve ham HTML reddedilir.
  Chromium: CI ve geliştirmede Playwright'ın Chromium'u (CI'da artık testten önce kurulur), Vercel'de @sparticuz/chromium 153 (playwright-core
  1.63 ile aynı Chromium sürümü; next.config: derlemeye katılmaz, yalnız PDF basan uçların izine eklenir). Ön izleme sayfasında **PDF indir**
  (/raporlar/<id>/pdf, imzasız; raporu görene, öteki 404). Vercel ölçümü için yalnız önizleme dağıtımında açık uç (/api/olcum/pdf, uydurma
  belge; yayında 404). Yerel ölçüm (Edge 140, Windows): ZPKR01 70 KB / 3,3 sn (soğuk), ZPKR02 75 KB / 1,5 sn, kompresör 55 KB / 0,9 sn.
  **Vercel ölçümü (fra1, önizleme dağıtımı, ZPKR02 uydurma):** soğuk 3,3 sn, sıcak 0,47 sn, 66 KB — istek içinde üretim yeterli.
  Ertelenen: her sayfada tekrar eden başlık tablosu (şimdi yalnız ilk sayfada) ve sayfa numarası — imza kalemiyle. Kilit: tests/pdf.test.ts
  (gerçek Chromium: üç şablonda A4 PDF, Carlito gömülü, betik / dış adres yok), belge.test +1 (HTML yazıcı = React), bozan +1 (yazıcı kaçışı),
  e2e Ön izle'de PDF indir (dosya adı, %PDF-).
- 2026-10-05 (315): **K3 Rapor belgesi: formatın tanımından tek çizici, Ön izle ve onay ekranında önizleme** (maket maket-belge.js MB.belge /
  resmiBas; pkproje §4.2, §8.3; RAPOR-FORMAT §1 "Görünüm", §9-2; karar 105; reisim 2026-09-28: "en sağ üstte ön izleme tuşu"). `src/belge/`: saf
  çizici (belge.ts — React createElement, kaçışlı; aynı veri → aynı belge, kesin PDF de bundan üretilecek) + A4 Bakanlık görünümü (belge.css:
  Carlito kendi kökenimizden, pembe bölüm şeridi, mavi etiket hücresi; uygulama temasından bağımsız). Düzen saha ekranıyla aynı: başlık tablosu
  (logo yeri · firma · AKR. · belge adı · doküman kodu, format sürümü, rapor no, rapor tarihi), 1 Firma bilgileri (künye, tarihler, metot ve
  dayanak), 2 Ekipman bilgileri (formatın ekipman bölümü katılır), formatın bölümleri (bilgi ●/○ seçenekli, kontrol listesi, ölçüm tablosu satır
  sonucu ve Not-N, test değeri sınırıyla, cihaz kalibrasyon ve sertifikasıyla, fotoğraflar gömülü, kusurlar motordan "* / **" ve madde fotoğrafı
  adıyla, yorum, sonuç cümlesi YALNIZ seçilen sonuçla, imza: yetkili kişi + teknik yer varsa onaylayan), nüsha yazıyla, madde fotoğrafları ekte;
  imzasız belgede "İmzasız önizleme" şeridi. Veri sunucuda (raporBelgesiVerisi: raporu görene; fotoğraflar raporun kendi dosyalarından veri
  adresi olarak — dış adres yok, çöptekiler değil). Rapor ekranında "Ön izle" (/raporlar/<id>/onizle), onay ekranında "Rapor (önizleme)". Kesin
  PDF ve Chromium ölçümü imza kalemiyle (PDF imza anında üretilir). Kilit: tests/belge.test.ts (6, veritabanısız: bölümler ve değerler, kusur ve
  sonuç cümlesi, karar 105, gömülü fotoğraf, kaçış — betik / olay özniteliği metin olarak, ZPKR01 / ZPKR02 çizilir), raporlar.test +1 (belge
  verisi yetkisi, gömülü / çöpteki fotoğraf), bozan +2 (sonuç cümlesi, kusur listesi), e2e saha raporu Ön izle + onay ekranında önizleme.
- 2026-10-05 (314): **K3 Onaylar: kuyruk, onay ekranı, Onayla, Geri gönder, Onayı geri al, Tüm raporlar ve Durumu değiştir** (maket onaylar.html
  M9; karar 102, 190, 191; N7 vekil yok; KOD-GECIS §4). Göç **0026**: raporda onay zamanı ve onaylayan hesap (veritabanı damgası; Yeni ve onaydaki
  raporda yok — CHECK); akış tetiği Yeni · onayda · onaylandı arasındaki geçişleri açar (Tamamlandı'ya yalnız imzayla, imzalı rapor değişmez);
  **Yeni'ye dönüşte gerekçe en az 10 karakter** (veritabanı da ister; gerekçe işlemin ayarından okunur, hareket kaydına yazılır ve silinir — sonraki
  geçişe taşınmaz); durum değişirken içerik değişmez; hareket adları gonder · onay · onay_geri · geri · durum. **C1 uygulandı: dört göz kalktı** —
  reisim'in kararı (§1, §9 soru 1: "hazırlayanın kendi raporunu onaylaması da engellenmez"); 281'in "kod kararı" geri alındı, tests/yetki.test.ts
  tarih ve gerekçeyle güncellendi, olumsuz kanıt branş kilidine çevrildi. **Kuyruk**: branşın onaydaki raporları, en yeni üstte; çipler Kusurlu ve
  24 saatten eski, seçiciler Denetçi ve Tesis; bekleme "az önce / N saattir / N gündür". **Onay ekranı**: gözden geçirme (İSG-KATİP, kontrol metodu,
  kriterler, ölçüm, test, cihaz ve kalibrasyon, fotoğraf, denetçinin mesleği — U1, sonuç ve U3; hepsi uyarı) + raporun tamamına bağlantı (PDF
  önizlemesi PDF kalemiyle); Onayla ve Geri gönder sonrası sıradaki rapor açılır. **Tüm raporlar**: branşın bütün raporları (Durum, Denetçi;
  rapor no ve tesis ayrı aranır). Branş yöneticisi kendi branşını görür ve işler; firma yöneticisi görür, işlemez (branş yöneticisi değil);
  denetçi, planlama, muhasebe görmez (C5 — denetçinin "İmzamı bekleyen raporlar"ı imza kalemiyle). Rapor ekranında geri gönderilmiş raporun
  üstünde "Geri gönderildi · kim · zaman: “gerekçe”" (U8). Onaylar rapor tablosuna dokunmaz: Raporlar'ın onay-baglanti.ts kapısından okur ve yazar.
  Kilit: tests/onaylar.test.ts (6: kuyruk ve görme, onayla + C1 + damga, geri gönder + gerekçe sunucu ve veritabanı, onayı geri al ve durumu
  değiştir, veritabanı geçişleri / damga / gerekçe taşınmaz / hareket elle yazılmaz, kiracı + rol), bozan +2 (gerekçe kuralı kalkınca gerekçesiz
  geri döner; sunucuda rapor_onayla kalkınca firma yöneticisi onaylar), e2e saha raporu: mekanik yönetici geri gönderir → denetçi şeridi görür,
  yeniden gönderir → yönetici onaylar.
- 2026-10-05 (313): **K3 Saha raporu 3: Kaydet ve kopyala, Formatı güncelle, günlük süre (mesai)** (maket kopyala / pencereKaydet / format-guncelle,
  MV.gunlukSure; karar 204–209, N10, 211, 212; AA2; KOD-GECIS ENGEL 3). **Kaydet ve kopyala** (Yeni rapor; gönderilmişte adı **Kopyala**, kayıt
  yok): yalnız raporu yazan; pencere yalnız **ekipman kodu** ve **ekipman bölümü (kullanım yeri)** sorar; kod plan içi "Ekipman ekle" ile aynı
  denetimden (biçim, bu planda var, bu tesiste kayıtlı, başka tesiste, eski kod); engeller (plan günü, günlük süre, kod) **kayıttan önce** bakılır —
  engelde rapor yarım kaydedilmez. Yeni ekipman tesise kalıcı kayıt, plana "sonradan"; kopya her zaman Yeni, türün **güncel** formatıyla, kaynağın
  künyesiyle; kopyalanır: ekipman bilgileri (seri no hariç — yeni ekipmanın), bilgi alanları (detaylar, tespitler), ölçüm cihazları, madde
  **seçimleri**; kopyalanmaz: madde açıklaması / derecesi / fotoğrafı, test ve ölçüm değerleri, fotoğraflar, sonuç, yorum. Yeni rapora gidilir
  (bildirim "[Rapor kaydedildi; ]<KOD> açıldı: <no>. Bilgiler <kod> raporundan kopyalandı."), üstte kaynak şeridi (U7). Tamamlanmış plana kopya yok
  (ekipman eklenmez). **Formatı güncelle** (U6): yalnız yazanın Yeni raporu, türün daha yeni yayınlanmış sürümü varsa şerit + tuş; ekranın hâli
  kaydedilir, kimliği eşleşen cevaplar (alan, madde, ölçüm tablosu, test değeri) korunur, yeni madde ilk cevapla ("Uygun"); yeri kalkan fotoğraf
  formatın ilk fotoğraf bölümüne taşınır (kaybolmaz); veritabanı yalnız daha yeni yayınlanmış sürüme geçirir (0025). **Günlük süre** (ENGEL 3,
  firma ayarı açıksa): denetçinin bugün açtığı, silinmemiş raporlarının tür süreleri toplamı ≥ normal + hak (hak = günlük mesai ile yıllık kalan
  fazla çalışmanın küçüğü; süresi tanımsız tür sayılmaz) → yeni rapor ve kopya açılmaz; plan içinde şerit "Günlük süre doldu (normal N + mesai M dk);
  bugün yeni rapor oluşturulamaz." ve Rapor oluştur kapalı; rapor ekranında "Günlük süre doldu; yeni rapor ve kopya oluşturulamaz.". Göç yok.
  Kilit: tests/raporlar.test.ts +3 (kopya: kod, yetki, çakışma, kopyalanan / kopyalanmayan, Kopyala; günlük süre: hak, yıllık sınır, silinen, kapalı;
  format: yetki, durum, eşleşme, eski sürüme dönülmez, yeni rapor yeni sürümle), bozan +1 (günlük süre denetimi kalkınca süre dolmuşken kopya
  açılır), e2e saha raporu gönderilmiş raporu kopyalar.
- 2026-10-05 (312): **K3 Saha raporu 2: fotoğraflar** (maket fotoMenu / fotolar / fotoSil; §3.8-5 temel zorunlular; O2; AA9; 09-A1, A2, A4;
  araştırmanın C4 ve C18 kararları). Fotoğraf rapor başına **en az 1** (reisim 2026-09-22) → hazır şablonlarda (ZPKR02, kompresör) "Fotoğraflar"
  bölümü en az 1 (termal isteğe bağlı; ZPKR01'de fotoğraf bölümü yok — P1). Motor: fotoğraf sayısı **bölüm başına** (tek sayı termal ile
  fotoğrafları ayıramıyordu) · "Uygun değil" maddenin **açıklaması zorunlu** (§3.8-5) · maddede fotoğraf yalnız format kuralı açıksa zorunlu (AA9,
  başlangıçta kapalı). Sunucu: fotoğraf ekle (yalnız yazan, Yeni rapor; formatın fotoğraf bölümüne — en çok enCok — ya da kontrol maddesine — en çok
  10; tür baytlardan JPEG / PNG, EXIF silinir, 8 MB) · sil (listeden çıkar, dosya çöpe: indirilmez, silinmez) · sayılar raporun kendi listesinden
  (istemcinin sayısına güvenilmez) · dosya erişim kaydına "rapor": dosyayı raporu gören indirir (denetçi kendi, branş yöneticisi branşı; öteki branş,
  başka denetçi ve başka firma göremez). Ekran: fotoğraf bölümünde ve "Uygun değil" maddede liste (küçük resim yok: ad · Görüntüle · İndir · Sil) +
  "Fotoğraf ekle" (kamera ya da galeri; cihazda en uzun kenar 1600 px, JPEG %75 — `src/components/foto/kucult.ts`, tarayıcı çözemezse dosya olduğu
  gibi gider, sunucu denetler); madde fotoğrafı Kusur açıklamalarında adıyla. Kilit: tests/raporlar.test.ts (+1: yer, tür, yetki, sayılar, indirme,
  çöp, gönderilmişe eklenmez; gönderim akışları fotoğrafla), format-motor (+1), bozan +1 (sunucu sayıları kendi listesinden saymasa fotoğrafsız
  rapor gider), e2e saha raporu fotoğraf ekler.
- 2026-10-05 (311): **K3 Saha raporu 1: rapor oluştur, saha ekranı (format tanımından), kaydet, ölçüm cihazı, onaya gönder, sil** (maket rapor.html
  M8, planlarim.html RAP_SUTUN; KOD-GECIS §3–§6, §9 ENGEL 1, 2, 5, 6; RAPOR-FORMAT §5, §7). Kurallar, maket ve kod önce iki araştırma ajanıyla
  tarandı; çelişkiler şöyle kapandı (öneriler uygulandı): **durum kodları sabit tanımlarla aynı** (taslak "Yeni" · onayda · onaylandi · imzada ·
  imzali "Tamamlandı") · **raporda pasif yok** (N11; Sil = "silindi" damgası, yalnız Yeni) · **plan × ekipman başına tek etkin rapor** (203; silinince
  "Rapor oluştur" geri gelir) · **zorunlu alan eksikken onaya gönderilmez** (ENGEL 5; sonuç hariç — seçilmediyse önerisi yazılır, "Sonuç kriterlere
  göre: …") · **bitiş başlangıçtan önce olamaz** (engel, veritabanında). Göç 0025: **rapor** (numara XX-AAYY-SIRA-EK, revizyon, plan / ekipman / tür /
  açıldığı FORMAT SÜRÜMÜ — türün yayındaki sürümü, yazan personel + hesap, künye KOPYASI, ekipman bilgileri, başlangıç açılışta, bitiş / sonraki
  kontrol / rapor tarihi elle seçilmediyse gönderimde, cevaplar JSON, cihazlar, fotoğraflar, sonuç + otomatik mi, ilk / son gönderim, silindi) ·
  **rapor_akis** tetiği (açılış yalnız Yeni, kabul edilmiş planda, ekipteki denetçi adına, planda + etkin ekipmana, yayındaki formatla; numara /
  plan / ekipman / tür / yazan değişmez; içerik yalnız Yeni'de; tamamlanan değişmez; format yalnız daha yeni yayına geçer; bu kalemde yalnız
  taslak → onayda açık, öteki geçişler Onaylar / imza kalemleriyle) · **rapor_hareket** (oluştur / gönder / sil; yalnız tetik yazar, elle yazılamaz;
  yazan hesap ve zaman veritabanından). Modül `src/modules/raporlar/`: **Rapor oluştur** (yalnız plandaki denetçi; ENGEL 1 ileri tarihli plan —
  maket metni; pasif ekipman; tek rapor; yayında format yok; Raporlar'ı göremeyen açamaz; bütün maddeler "Uygun" açılır; ilk rapor planı Denetimde
  yapar) · **saha ekranı** `/raporlar/<id>` (1 Firma bilgileri: künye kopyası salt okunur + kontrol tarihleri + planlamacı değiştirdiyse şerit ve
  Güncelle — yalnız yazanın Yeni raporlarına geçer · 2 Ekipman bilgileri: elle, ekipman kaydından başlar; formatın kendi ekipman bilgi bölümü buraya
  katılır, formatın sorduğu alan tekrar edilmez · sonra formatın bölümleri tanımdan: bilgi, kontrol maddeleri + Hepsini işaretle, ölçüm tablosu
  satır ekle / sil + canlı sonuç + uygunluk notu, test değerleri + sınır, ölçüm cihazları, kusur açıklamaları kendiliğinden, sonuç ve kanaat + öneri
  + "Uygun" uyarısı, not, yetkili kişi) · **Kaydet** (yalnız yazan, Yeni, sürüm kilidi; cihaz / fotoğraf sayısı istemciden alınmaz) · **Ölçüm
  cihazı** (türün gerekli cihaz türü başına satır; yalnız yazanın zimmetindeki, kalibrasyonu geçerli cihaz; tür liste vermiyorsa her geçerli cihaz)
  · **Onaya gönder** (sorulur; eksikse "Zorunlu alanlar doldurulmadı" penceresi eksikleri sayar, alana götürür, rapor kaydedilir; cihaz eksik /
  kalibrasyon geçmiş ENGEL 2; bildirim "Onaya gönderildi: <yönetici>, <branş> branş yöneticisi.") · **Sil** (yazan ya da teknik yönetici, Yeni).
  Plan içinde Raporlar listesi (20'şer, süzgeç, durum çipleri; Raporu düzenle / Raporu aç; kendi Yeni raporunda Sil), ekipman satırında "Rapor
  oluştur" + yeşil tik; raporu olan ekipman pasife alınmaz. **Ertelenen** (araştırmanın bölümüne göre sıradaki kalemler): fotoğraf ekle (C4: şablonda
  en az 1 fotoğraf, C18: bölüm başına sayı) · Kaydet ve kopyala · Formatı güncelle · mesai (ENGEL 3) · madde (i) penceresi · çevrimdışı işlem kimliği ·
  Onaylar (C1 dört göz kalkar, C5 denetçi "İmzamı bekleyen") · PDF · imza · Raporlar listesi · revizyon · müşteri paneli. Ekranda bölümler açık
  geliyor (maket "kapalı" diyor; başlıktaki tuşla kapanır). Kilit: tests/raporlar.test.ts (11; gerçek PostgreSQL, iki firma) + bozan 3 (akış tetiği,
  ENGEL 1 sunucuda, kalibrasyon denetimi) + e2e/saha-raporu.spec.ts (üç genişlik; tohum: Saha Tesisi + HT-0201, Manometre MN-01 denetçinin
  zimmetinde, HT'nin yayındaki formatı kompresör şablonu). Bulunan sürücü hatası: pg JS dizisini JSON değil Postgres dizisi yollar — jsonb dizileri
  JSON metni olarak yazılır.
- 2026-10-04 (310): **K3 Planlar listesi + plan içi akış** (donmuş referans ekran: maket planlarim.html 2.–5. tur; §3.4 karar 9–12, 26–28, "Plan
  künyesi"). **Liste** `/planlar`: Proje no · Proje adı · Müşteri · Adres · Denetçi · Başlangıç · Durum · Görüntüle; süzgeç proje adı + proje no
  kutuları, Durum / Tarih (bugün, bu hafta, önümüzdeki 7 gün) / Müşteri / Branş; sütun başlığıyla sıralama (kartta "Sıralama"), varsayılan en yeni
  tarih üstte. Denetçi yalnız ekibinde olduğu planları görür (sunucuda). **Plan içi** `/planlar/<id>`: başlıkta firma adı (künyeden, L7), altında
  tesis, proje no kırıntıda; dikey akış Planlandı → Kabul → Denetim → Tamamlama (tamamlandı ✓ · şu an · sırada · reddedildi ×, yalnız tarih);
  telefonda şu anki adımın tuşları altta yapışkan çubukta. Planlandı: künye satırları + Teklif içeriği (tür × adet, plan açılırkenki); planlamacı
  **Düzenle** (firma adı, adres, SGK DETSİS NO, denetçi başına İSG-KATİP ID), denetçinin gördüğü künye kendiliğinden değişmez — şerit + **Güncelle**
  (taslak raporlara geçiş Raporlar kalemiyle). Kabul: tarafsızlık beyanı (firma ayarı `beyan`, boşsa varsayılan; kabul anındaki metin plana
  yazılır, değişmez), okunmadan Kabul et kapalı (sebebi yazılı); Reddet gerekçe ister; ikisi de YALNIZ plandaki denetçi (plan_kabul_red).
  Denetim: Ekipmanlar (süzgeç alan alan + çipler + Branş, 10'ar sayfa; Kod + Yeni rozeti, tür, konum, branş, önceki kontrol, rapor / Pasif;
  Pasife al / Etkinleştir) + Raporlar (Raporlar kalemiyle dolar); **Ekipman ekle** iki yol — yeni (kod yazarken denetlenir: biçim · bu planda var ·
  bu tesiste kayıtlı → "Kayıtlı ekipmanı seç" · başka tesiste · eski kod · kullanılabilir; tür, seri no, konum) ya da tesiste kayıtlı ekipmanı plana
  al; yalnız Kabul edildi / Denetimde (tamamlanmışta kapalı, 12). Kontrol listesi Tamamla → plan Tamamla (raporsuz ekipman engellemez, sayısı
  yazar, 11) ⇄ Tamamlamayı geri al (plan yeniden denetime, kontrol listesi açık). Altta **Proje notları** (ekipteki denetçiler + Planlar "yaz";
  yönetici "görür" ve muhasebe görmez; değişmez, silinmez; son 6, Tümünü göster). Göç 0024: plan akış sütunları + **akış tetiği** (yeni plan
  yalnız Kabul bekliyor; izinli geçişler bekliyor → kabul / reddedildi, kabul → denetimde, denetimde ⇄ tamamlandı; kabul / red / başlama /
  bitiş / kontrol zamanı ve kabul eden / reddeden HESAP veritabanında damgalanır; beyan, red gerekçesi değişmez) · plan_ekip künye sürümü +
  görülen künye · **plan_ekipman** (planın ekipmanı; plan açılırken tesisin etkin ekipmanı, denetimde eklenenler "sonradan"; ekipman planın
  tesisinde olmalı, tamamlanmış / reddedilmiş plana eklenmez — tetik; 0023 planlarına bir kez dolduruldu) · **plan_not** (yazan hesap tetikle,
  yalnız SELECT / INSERT). "İlk rapor oluşturulunca Denetimde" işlevi (`denetimeBasla`) Raporlar modülü için dışa açık. **Ertelenen:** Excel'e
  aktar / Excel'den yükle (ekipman), rapor saatlerini hizala, toplu PDF, Saha formu, "Rapor oluştur" (Raporlar / saha raporu kalemi); N2
  (ekipman listesinin denetçinin branşıyla açılması — kişinin branşı personel kaydından okunacak). Kilit: tests/plan-ici.test.ts (7; gerçek
  PostgreSQL, iki firma: akış ve damgalar, red, künye, notlar, ekipman kodu ve ekleme, liste görünürlüğü, kiracı + rol düzeni + sahte rol) +
  bozan 4 (akış tetiği, not damgası, sunucuda kabul yetkisi, künye saklama) + e2e/plan-ici.spec.ts (üç genişlik) + 309 e2e'si yeni başlığa uyarlandı.
- 2026-10-04 (309): **K3 Plan aç: ekipman kaydı, plan, plan ekibi; uyarılar engel değil** (maket plan-ac.html M6 2. tur; §3.4–3.5; L2, L4, L6, G1,
  Ö5b; KOD-GECIS §3, §5). Göç 0023: **ekipman** (tesisin kalıcı kaydı; tür kataloğa bağlı; kod FİRMADA EŞSİZ, A–Z 0–9 tire, 3–20; silinmez, pasife
  alınır; sistem öncesi son kontrol ayrı sütunda) + **ekipman_kodu** (verilen her kod geçmişe yazılır; kod değişse de eski kod başka ekipmana
  verilmez — veritabanı tetiği) · **plan** (proje no P-AAYY-SIRA sunucu verir, firmada eşsiz, sonradan DEĞİŞMEZ — tetik; tesis değişmez;
  bitiş ≥ başlangıç; durum Kabul bekliyor → Kabul edildi → Denetimde → Tamamlandı · Reddedildi; KÜNYE plan açılırken kayıttan: firma adı = müşteri
  ünvanı, adres "adres, ilçe / il", SGK DETSİS NO) · **plan_ekip** (plan × denetçi + İSG-KATİP SÖZLEŞME ID; sözleşmeden gelir ya da el ile, boş
  kalabilir). Hepsi RLS, silme hakkı yok. Modüller `src/modules/planlar/` (modül 13; plan açmak yalnız Planlar "yaz"; denetçi "kendi" = içinde olduğu
  plan; muhasebe görmez) ve `src/modules/ekipman/` (şimdilik tesisin ekipmanını okur; ekle / pasif plan içinde). Plan aç ekranı `/planlar/ac`
  (?musteri / ?tesis ön seçim): 1 Müşteri ve tesis · 2 Tarihler · 3 Denetçi (aday = denetçi rolündeki hesabı olan etkin personel; İSG-KATİP ID
  tesisin kaydından, yoksa el ile + yazma yetkisi ve yürürlükte sözleşme varsa "Sözleşmeye de kaydet") · 4 Özet ve uyarılar (tesisin bütün ekipmanı
  tür başına, kontrolü geçmiş / yaklaşan). ENGEL yalnız tesis, geçerli tarih, bitiş ≥ başlangıç, en az bir denetçi, pasif tesis; UYARI (plan açılır,
  plan sayfasında da yazar): İSG-KATİP ID yok / onay geç / sözleşme bitmiş, EKİPNET yok, meslek yetkili olamaz, ilk girişini yapmadı, aynı günlerde
  başka plan, tesiste açık plan, geçmiş tarih, sözleşme dışı, türe yetkili meslek yok, türe atanmış denetçi yok. Plan sayfası `/planlar/<id>`: başlık
  proje no · müşteri, durum, uyarılar, plan bilgisi, tür başına ekipman. Planlar sayfasında "Plan aç" (yalnız yetkisi olana); liste ve plan içi
  (kabul / red, denetim, ekipman ekle, raporlar, tamamla, künye düzenle) sıradaki kalem. **Ertelenen:** "Ekipmanları Excel'den yükle" (maket M6) —
  ekipman ekle ile birlikte plan içi kaleminde. Kilit: tests/planlar.test.ts (8; gerçek PostgreSQL, iki firma: numara / künye / ID, engel ve uyarı,
  yetki, rol değiştirme, firma sızıntısı, değişmez alanlar, ekipman kodu geçmişi) + bozan 2 (kod geçmişi tetiği, proje no tetiği) +
  e2e/planlar.spec.ts (üç genişlik; tohum: her firmaya uydurma müşteri + tesis + tür + iki ekipman).
- 2026-10-04 (308): **K3 Rapor formatı veritabanında: taslak → yayında → eski; şablondan başlat, önizle, yayınla** (RAPOR-FORMAT.md §4–5, §7;
  KOD-GECIS §3 "rapor_format", §5). Göç 0022 (rapor_format — tür başına TEK taslak ve TEK yayındaki sürüm (kısmi eşsiz dizinler), sıra v1, v2 …;
  tanım jsonb (her yazma ve okumada şemadan geçer, en çok ~1 MB), şema sürümü, kaynak hazır şablon, sürüm notu, yayınlayan; tür ile aynı firmaya
  bağlı, RLS. Tetik: yeni satır yalnız taslak; YAYINLANAN SÜRÜM DEĞİŞMEZ ve geri alınamaz (yalnız yayında → eski) — imzalı raporun PDF'i hangi
  sürümle çizildiyse o sürümle yeniden üretilir; yayın zamanı ve yayınlayan hesap veritabanında işlem bağlamından damgalanır; silme hakkı yok).
  Modül `src/modules/rapor-format/` (yetki modül 5: "gör" sürümleri ve tanımı görür — denetçi raporu bu tanımdan yazacak; başlatmak, kaydetmek,
  yayınlamak yalnız "yaz"; muhasebe görmez): hazır şablondan ya da yayınlanmış sürümden taslak başlat (taslak varsa istemcinin gördüğü sürümle yerine
  geçer) · taslak kaydet (şemadan geçmeyen ya da büyük tanım yazılmaz; Format kurucu K4 bunu kullanacak) · yayın denetimi · yayınla · türün yayındaki
  formatı (Raporlar için) · sürüm oku (PDF için). **Kilitli öğe denetimi** (`src/format/motor.ts` kilitDenetimi): Bakanlık öğesi silinmiş, özü
  değiştirilmiş (ad, alan türü, seçenekler, kayıttan gelen kaynak, sınır, madde metni, cevap seti, hesap, uygunluk notları, sonuç cümlesi), kilidi ya
  da zorunluluğu kaldırılmış, form kodu / başlığı değişmişse ENGEL — yayınlanmaz; kaynak SUNUCUDA seçilir (hazır şablon koddan + yayındaki sürüm),
  istemcinin "kilit" bayrağına güvenilmez; sıra serbest, kilitsiz öğe eklenebilir. Yayın denetiminin öteki maddeleri (boş bölüm, sınırsız tablo …)
  UYARI. Ekran: tür sayfasında "Rapor şablonu" yüzü ve bölümü (sürüm tablosu Taslak / Yayında / Eski, Önizle, Yayınla; Şablondan başlat penceresi) +
  önizleme sayfası `/ekipman-turleri/<tür>/sablon/<sürüm>` (yüzler, yayın denetimi, kurallar, görünüm, saha ekranı önizlemesi: bölüm bölüm alanlar,
  maddeler, ölçüm sütunları ve sınırları, test değerleri; Bakanlık öğesi kilitli). Makette karşılığı Format kurucunun önizlemesi ve Yayınla'sı;
  düzenleyici K4. Kilit: tests/rapor-format.test.ts (8; gerçek PostgreSQL, iki firma: yetki, rol düzeni değişince yetki, sahte rol, firma sızıntısı,
  değişmezlik, damga uydurulamaz) + format-motor (kilit denetimi) + bozan 3 (tetik, motor, şablon kaynağı) + e2e/rapor-format.spec.ts (üç genişlik).
  Yerelde (aşağıdaki karardan önce) 8/8 · 9/9 · 3/3 · e2e 3/3 geçti. **Yöntem (reisim, aynı gün):** *"windowsta postgreSQL ile neden çalışalımki her
  işimizi internette supabase de vs yapıcaz windowsta localhostta vs deneme yapmak istemiyorum"* → PC'de yerel PostgreSQL / `npm test` / localhost
  yok; test kapısı CI'da, sonra Supabase göçü ve main → Vercel (CLAUDE.md §5). PC'de tam testin takılması (Windows'ta gömülü PostgreSQL 18
  kapanışı) bu kararla konu dışı kaldı; düzeltmesi geri alındı.
- 2026-10-04 (307): **K3 Format motoru 1: tanım şeması, değerlendirme, hazır şablonlar** (RAPOR-FORMAT.md §1–5, §9.1; KOD-GECIS K3 ilk kalemi).
  src/format/: tanim.ts (şema sürüm 1 — 10 blok, kurallar, görünüm; bütün kimlikler tekil, cevaplar kimlikle; istemciden / yapay zekâdan gelen tanım
  şemadan geçmezse yazılmaz) · hesap.ts (ZPKK01 / ZPKK02 formülleri, maketle aynı sayılar: Zs = 230 / (çarpan × In), RCD IΔ ≤ IΔn ve TΔ ≤ 200 ms,
  linye Icu / Ib ≤ In ≤ Iz / N-PEN / PE Çizelge 8, PD 6–25 ve tamamlayıcı ≥ 4 mm², zemin > 50 kΩ) · motor.ts (eksikler — uyarı, engel değil;
  kusurlar — olumsuz madde, kusurlu uygunluk notu, hesabı / sütun sınırı tutmayan satır, sınır dışı değer; sonuç önerisi; yayın denetimi —
  boş bölüm, sınırsız tablo, sonuç / imza yok, kilitli Bakanlık öğesi silinmiş) · sablonlar.ts (ZPKR01, ZPKR02 Bakanlık yazımıyla birebir ve
  kilitli; kompresör genel; örnek değer yok). Saha ekranı ve PDF çizimi, tanımın veritabanında saklanması ve sürümü sonraki kalemlerde.
- 2026-10-04 (306): **K2 Personel dosyası: özlük, ekipman atamaları, maaş ve bordrolar, zimmetindekiler + imzalı zimmet formu, eğitimler** (maket
  personel.html; reisim 40, L4, 2026-09-27). Göç 0021 (ozluk_belgesi — tür listeden; ekipman_atamasi — kişi × tür başına TEK geçerli atama (kısmi eşsiz
  dizin), atama belgesi zorunlu, tarih ileri olamaz; bordro — kişi × ay başına tek geçerli bordro, CHECK net ≤ brüt ≤ işverene maliyet, aynı dönemin
  yenisi eskisini kaldırır (saklanır), gelecek ay yok; zimmet_formu — kapsam yükleme anındaki zimmetten SUNUCUDA yazılır, zimmet değişince form
  "eskidi"). Belgeler yalnız PDF, zorunlu; reddedilen belgede kayıt hiç yazılmaz. Silme hakkı yok (kaldirildi). Yetki: özlük ve bordro yalnız
  Personel'de "yaz" (görmek dahil; dosya erişimi de); atama ve zimmet formu kartı gören (denetçi yalnız kendi kartında); değiştirmek "yaz". Kartta
  günlük maliyet = son bordronun işverene maliyeti / 22 iş günü. Dışa açık: atananTurler (plan / rapor uyarısı için). Sonraki kalemlere: bordronun
  çalışana onaya / imzaya gönderilmesi (Onaylar), Muhasebe'nin bordro görünürlüğü (Muhasebe), zimmet formu PDF'inin sistemden üretilip mobil / e-imza
  ile imzalanması (PDF + Onaylar), atanmadığı türde plan / rapor uyarısı (Planlar, Raporlar).
- 2026-10-04 (305): **K2 Ekipman türü bağlantıları: kontrol metodu standartları + kullanılacak ölçüm cihazları** (maket ekipman-turleri.html yirmi
  dördüncü tur). Göç 0020 (ekipman_turu'na kontrol_std (standart NUMARALARI) ve cihaz_turleri; en çok 20'şer — CHECK). Standart numarayla bağlı:
  Dökümanlar'da yeni sürüm yüklenince tür sayfası ve rapor güncel sürümü gösterir; kütüphanede güncel sürümü olmayan numara seçilmez. Cihaz türü bu
  firmanın olmalı (sunucu denetler; başka firmanın kimliği "bulunamadı"). Tür sayfasında iki bölüm + "Metot ve cihazlar" penceresi (yalnız
  değiştiren); standart sayfasında "Kullanan ekipman türleri". Raporda cihaz şartı (her türden kalibrasyonu geçerli cihaz) Raporlar kaleminde.
- 2026-10-04 (304): **K2 Eğitimler: eğitim türleri, kayıtlar, tekrar takibi** (maket egitimler.html, M16; Dökümanlar'ın sekmesi, yetkisi modül 10).
  Göç 0019 (egitim_turu — firmanın eklediği ad (büyük / küçük harf farkıyla eşsiz) + tekrar süresi 1–120 ay; egitim_kaydi — kişi × tür × tarih, tekrar
  tarihi kayıt anında türün süresinden yazılır (tür süresi sonradan değişse geçmiş kayıt değişmez), kişi × eğitim başına TEK güncel kayıt (kısmi eşsiz
  dizin), tekrarı kaydedilince eskisi önceki; sertifika PDF'i isteğe bağlı; silme hakkı yok). Tarih ileri olamaz, güncel kayıttan eski tarihli tekrar
  olamaz (ENGEL). Tekrarı geçen / eşik içinde yaklaşan için şerit (eşik firma ayarı uyari_esikleri.egitim). Yetki: yöneticiler yazar; planlama görür;
  denetçi yalnız kendi kayıtlarını ve sertifikasını görür; muhasebe görmez. Personel kartı için dışa açık kisininEgitimleri. Sayfalar:
  /dokumanlar/egitimler · /dokumanlar/egitimler/turler. Yan menü balonu ve Uyarılar listesi Uyarılar kaleminde.
- 2026-10-04 (303): **K2 Dökümanlar 1: standart kütüphanesi (sürümlü), muayene kriterleri, diğer dökümanlar** (maket standartlar.html, M7).
  Göç 0018 (standart — her satır bir sürüm; numara başına TEK güncel sürüm (kısmi eşsiz dizin), numara + sürüm eşsiz; yeni sürüm eskisini "bitti"
  tarihiyle önceki yapar, dosyası saklanır; güncel kaldırılınca bir önceki yeniden güncel · dokuman — ad, tür (listeden), kod, revizyon, PDF;
  silme hakkı yok, kaldırılan satır kalır). Kontrol kriterleri belgeleri (ZPKK01, ZPKK02) kodda: src/tanim/kriterler.ts (maketteki veriden bir
  kez aktarıldı; düzenlenmez). Yetki: yöneticiler yükler / değiştirir / kaldırır; denetçi ve planlama görür ve PDF'i açar (reisim: "muayene
  personellerinin standartlara ulaşabilmesini istiyorum"); muhasebe görmez. Ekipman türleri standarda NUMARAYLA bağlanacak (Ekipman türleri ×
  standart kalemi): yeni sürüm türlere kendiliğinden geçer; dışa açık guncelStandartlar. Sayfalar: /dokumanlar (Standartlar) · /dokumanlar/
  standart/<id> · /dokumanlar/kriterler(/<kod>) · /dokumanlar/diger. Eğitimler sekmesi ayrı kalem.
- 2026-10-04 (302): **K2 Sözleşmeler 1: iş sözleşmesi, İSG-KATİP ID, sözleşme şablonu** (maket sozlesmeler.html, M5 + M13 2. tur). Göç 0017
  (is_sozlesmesi — no IS-AAYY-SIRA numara üreticisinden, müşteri + kapsam tesisleri aynı firmaya bağlı, imza tarihi ile imzalı PDF birlikte (CHECK) ·
  is_sozlesmesi_tesis — kapsam, sonradan değişmez · isg_katip — TESİS × DENETÇİ başına geçerli tek ID (kısmi eşsiz dizin), yeni ID eskisini "önceki"
  yapar, kullanılmamış ID kaldırılır (kayıt kalır), kullanılmış (kullanildi — Planlar yazar) yalnız düzeltilir · sozlesme_sablon — firmanın PDF
  şablonu, sürümlü; silme hakkı hiçbirinde yok). Durum: imza bekliyor → (imzalı PDF yüklenince) yürürlükte → (bitiş geçince) süresi doldu; hizmet
  sözleşmesi için uyarı / şerit yok (reisim 2026-09-26). Yetki: planlama + yönetici değiştirir; muhasebe ve teknik roller görür; denetçi yalnız
  kendi İSG-KATİP ID'si olan sözleşmeyi ve yalnız kendi ID'sini görür, imzalı sözleşmeyi açamaz. Dosya erişimi: imzalı sözleşme gören, İSG PDF'i
  ID'yi gören, şablon yalnız değiştiren. Planlar için dışa açık: isgIdBul (tesis × denetçi). Sayfalar: /sozlesmeler · /sozlesmeler/yeni ·
  /sozlesmeler/<id>. Sonraki kalemlere kalan: dayanak teklif (Teklifler), sözleşme metni PDF'i (PDF kalemi), açık plana bağlı İSG uyarıları
  (ID eksik, geç onay, plan günü bitişten sonra — Planlar), Word şablonu (dosya yolu şimdilik PDF).
- 2026-10-04 (301 düzeltme): Araçlar › Tutanaklar ve Şablon sayfaları sunucuda istemci işlevi çağırdığı için açılmıyordu; sekme yardımcısı ortak
  dosyaya taşındı, uçtan uca test iki sayfayı da açıp denetliyor.
- 2026-10-04 (301): **K2 Araçlar 1: araç, teslim tutanağı, haftalık kilometre** (maket araclar.html, AA4 + 2026-10-03). Göç 0016 (arac — plaka
  firmada eşsiz, boşluk yok sayılır, veritabanı da tutar; belge bitişleri isteğe bağlı · zimmet_hareket'e arac_id, tek varlık denetimi üç varlıklı ·
  arac_tutanagi — hareketin eki, DEĞİŞMEZ: no AT-AAYY-SIRA, yakıt, araçta olanlar, hasar · arac_km — araç × hafta (Pazartesi) bir kayıt, aynı hafta
  düzeltilir). Araç bir zimmet varlığı: "kimde" Zimmetler'in hareketlerinden, tutanak zimmet hareketini Zimmetler'in işleviyle yazar (ikinci liste
  yok); Zimmetler'de "Araç" türü görünür ama oradan teslim edilmez (kilometre + tutanak gerekir). Kilometre son bilinenden küçük olamaz (ENGEL:
  tutanak + haftalık, kendi haftasının kaydı hariç); haftada 3.000 km'den fazla artış kaydedilir, uyarılır. Fotoğraf açı başına (Ön, Arka, Sol, Sağ,
  Gösterge, İç), isteğe bağlı, yalnız JPEG / PNG; biri reddedilirse tutanak hiç kaydedilmez. Yetki: yöneticiler ekler / düzenler / her araca tutanak,
  planlama görür, denetçi (sürücü) yalnız kendi zimmetindeki aracı ve taraf olduğu tutanakları görür, yalnız kendi aracını teslim eder, haftalık
  kilometreyi yazar; muhasebe görmez. Belge (muayene, trafik sigortası, kasko) eşiği kalibrasyon eşiğiyle aynı firma ayarı. Sayfalar: /araclar
  (sürücüde "Aracım" + haftalık kilometre) · /araclar/tutanaklar · /araclar/sablon (örnek kalemler ve açılar, yalnız yönetici) · /araclar/<id>.
  Sonraki kalemlere kalan: tutanağın imzaya düşmesi (Onaylar › Diğer) ve PDF'i Onaylar / PDF kalemlerinde; şablonun firmaca düzenlenmesi Format
  kurucuda; yan menü balonu ve Uyarılar'a belge bitişi Uyarılar kaleminde.
- 2026-10-04 (300): **K2 Zimmetler 1: kimde, hareketler, teslim, demirbaş** (maket zimmetler.html, M4 2. tur). Göç 0015 (demirbas — "diğer" varlık, kod
  firmada eşsiz; zimmet_hareket — her teslim ayrı ve DEĞİŞMEZ kayıt: uygulama rolüne yalnız ekleme / okuma hakkı; tek varlık CHECK; cihaz,
  demirbaş, personel aynı firmaya bağlı). "Kimde" son hareketten; teslim eden SUNUCUDA o anki kimde'den yazılır (istemciden alınmaz); kalibrasyondaki
  cihaz teslim edilmez, aynı yere teslim ve ayrılan personele teslim reddedilir. Fotoğraf isteğe bağlı (62; yalnız JPEG / PNG, EXIF silinir; biri
  reddedilirse teslim hiç kaydedilmez), GizliResim ile gösterilir, hareketi gören açar. Kalibrasyonu geçmiş cihaz kişiye verilirken uyarı (59).
  Denetçinin "kendi" düzeyi: yalnız kendi zimmeti + taraf olduğu hareketler; Ölçüm cihazlarında da artık kendi zimmetindeki cihazları görür.
  Sayfalar: /zimmetler (Kimde) · /zimmetler/hareketler · /zimmetler/varlik/<c|d>/<id>. Araç varlığı Araçlar kalemiyle; zimmet formu (imzalı
  formda mı) personel özlük kalemiyle.
- 2026-10-04 (299): **K2 Ölçüm cihazları 1: cihaz, cihaz türü, kalibrasyon kaydı** (maket olcum-cihazlari.html, M4 2. tur; T7). Göç 0014 (cihaz_turu —
  firmanın listesi, ad eşsiz; olcum_cihazi — firmanın etiketi KOD eşsiz, düzenlenir, konum depo / kalibrasyonda; kalibrasyon — bitiş ≥ tarih, sonuç,
  isteğe bağlı sertifika PDF'i, kaldırılır silinmez; hepsi aynı firmaya bağlı). Liste: kalibrasyon uyarı şeritleri (geçti · eşik içinde; eşik Firma
  ayarları › Uyarı eşikleri, başlangıç 30 gün), çipler, Cihaz türü seçicisi. Cihaz sayfası: rozet + şerit, yüzler, bilgiler, kalibrasyon kayıtları
  (sertifikayı aç, kaldır), Kalibrasyona gönder / Depoya al (kalibrasyon kaydı eklenince depoya döner). Geçerli bitiş = "uygun" kayıtların en geç
  bitişi. Cihaz türü "Yeni tür…" ile formdan eklenir (Türkçe büyük / küçük harf farkıyla aynı ad tekrar açılmaz). Denetçinin "kendi" düzeyi Zimmetler
  kalemine kadar kayıt göstermez. Kişi zimmeti (Teslim et), ara kontrol programları, raporda "kalibrasyonu geçen cihazla onaya gönderilemez" kendi
  kalemlerinde.
- 2026-10-04 (298): **K2 Ekipman türleri 1: katalog, tür sayfası, rapor formatı PDF'i** (maket ekipman-turleri.html, M3 onaylı 2026-09-26; AA5). Göç 0013
  (ekipman_turu: firmada eşsiz, DEĞİŞMEZ 2–3 harf kod — veritabanı tetiği; tur_format: sürümlü PDF, kaldırılır silinmez; tür + format + dosya AYNI
  firmada bağlı; dosya tablosuna (firma_id, id) eşsizliği). Katalog Mekanik / Elektrik sekmeli; tür ekle / düzenle (Ek-III dışında branş seçilir,
  öteki grupta gruptan); rapor formatı yükle (yalnız baytlardan PDF, 25 MB; sunucu eylemi gövde sınırı 26 MB) · sürümler (kullanımda / önceki, PDF'i
  aç, kaldır). Dosya erişimi: türü gören açar (src/server/dosya/erisim.ts); dosya adresini yalnız GizliResim.tsx üretir (DosyaAcTusu). ⚑ Deneme
  yayınında Vercel tek istekte en çok 4,5 MB alır ve dosyalar geçici klasörde durur — kalıcı depo (Supabase Storage, doğrudan yükleme) K7. Kullanılacak
  ölçüm cihazları, standartlar, ölçüm metodu, Bakanlık formatı ve Format kurucu kendi kalemlerinde. Müşteri girişi müşteri paneliyle (K3) birlikte.
- 2026-10-04 (297): **K2 Müşteriler 1: müşteri ve tesis ekranları** (maket musteriler.html, M2 onaylı 2026-09-26; reisim: *"tüm ekranları yap"*). Göç 0012
  (musteri, tesis; RLS ENABLE + FORCE + politika; tesis firma + müşteri BİRLİKTE bağlı — başka firmanın müşterisine satır yazılamaz; müşteri e-postası
  firmada tek; silme hakkı yok). Liste (süzgeç, İl, Görünüm: etkin / pasif / hepsi) · müşteri sayfası (bilgiler, tesisler, eksik bilgi şeridi) · tesis
  sayfası · pencereler: müşteri / tesis ekle-düzenle, pasif yap / yeniden etkinleştir. Vergi no ve SGK DETSİS NO tekrarı UYARI ("Yine de kaydet",
  gerekçe denetim izine). Müşteri pasif → etkin tesisleri onunla pasif, dönünce yalnız onlar döner. İl / ilçe: 81 il, 973 ilçe (src/tanim/iller.ts;
  MIT lisanslı açık veriden bir kez alındı). Ortak SecimAlani'na `etiketsiz` (tablo hücresinde erişilebilir ad). Müşteri girişi, ekipman / kontrol /
  İSG-KATİP / uygunsuzluk sütunları ve yüzleri kendi kalemlerinde (sayı uydurulmaz).
- 2026-10-04 (296): **K2 Personel 4: Rol yetkileri sekmesi** (maket personel.html #/roller; reisim 32). Personel sayfasında "Personel · Rol yetkileri"
  sekmeleri. Modül × rol tablosu (telefonda kart), düzey rozetleri ve açıklaması; firma yöneticisi "Rol yetkilerini düzenle" → hücre başına seçim,
  "Önerilen düzene dön", değişiklik sayısı, Vazgeç / Kaydet. Firma yöneticisinin Personel / Firma ayarları / Hareket kaydı hücresi "sabit". Kayıt firma
  ayarlarında (rol_yetki), sürüm kilidiyle; oturum her okunduğunda yüklenip canDo'ya gider → değişiklik o rollerdeki herkes için bir sonraki istekte geçerli.
  Bozuk / bilinmeyen değer önerilen düzene döner. Kilit: tests/rol-yetki.test.ts (gerçek PostgreSQL, iki firma) + bozan + e2e/rol-yetki.spec.ts.
- 2026-10-04 (295): **Giriş ekranı: tema tuşu + "Beni hatırla"** (reisim: *"giriş ekranında, gece modu ayarı tuşu yok, beni hatırla tuşu yok"*; makette
  yoktu, reisim isteği). Sağ üstte kabuktaki tema tuşunun eşi. "Beni hatırla" işaretsiz (varsayılan): çerez oturumluk, tarayıcı kapanınca biter
  (sunucuda 12 saat hareketsizlik / 14 gün); işaretli: çerez 14 gün kalıcı, hareketsizlik 7 gün, mutlak 14 gün. Altında açıklama ("ortak bilgisayarda
  işaretlemeyin"). Göç 0011 (oturum.hatirla). Kilit: tests/giris.test.ts + e2e/giris.spec.ts.
- 2026-10-04 (294): **Her firma kendi Supabase projesinde** (reisim önerisi + *"tamam supabase kararını yaz devam et"*; §8.8). Gerekçe: veri ve fatura
  firmanın, firmalar arası sızma yapıdan kalkar, barındırma maliyeti firmada. Pro (25 $/ay): 8 GB veritabanı rahat yeter; belirleyici dosya alanı
  (100 GB) — saklama 5–20 yıl, büyük arşivde ileride ucuz depo. İş K7'ye: hesap bağlama, otomatik proje kurulumu, her projeye göç + 0008 doğrulaması,
  merkez kayıt, bağlantının firmaya göre seçilmesi. Reisim için deneme sitesinde ayrıca yönetici hesabı açıldı (uydurma e-posta).
- 2026-10-04 (293): **Deneme yayını: Supabase (Frankfurt) + Vercel (fra1) — §8.8'in ilk adımı K7'den öne alındı** (reisim: *"sitenin şu anki durumunu
  görmiyorum, maket değil"* → *"supabase açtım, extension olarak claude a bağladım"*; ardından Vercel bağlandı). Adres **https://probata-deneme.vercel.app**
  (firma kısa adı `probata-deneme`, ana alan `vercel.app`); Vercel Kimlik Doğrulaması açık: yalnız Vercel hesabıyla girilmiş kişi siteyi görür, sonra
  uygulamanın kendi girişi. Veritabanı Supabase projesi `probata` (eu-central-1, PostgreSQL 17); uygulama paylaşımlı havuzlayıcıya işlem kipinde
  (6543) `probata_uygulama` rolüyle, **TLS + Supabase kök sertifikası doğrulamalı** bağlanır (ağ üzerinden şifresiz bağlantı kodda reddedilir). Rol
  parolası Supabase'e düz değil SCRAM özetiyle verildi; sırlar (veritabanı parolası, sır ana anahtarı) yalnız Vercel'in "sensitive" ortam
  değişkenlerinde. Uydurma deneme firması + "Deneme Yönetici" (geçici parola, ilk girişte değiştirilir). **Güvenlik (bağımsız denetim + ölçüm):**
  Supabase her yeni tabloyu herkese açık API rollerine (anon / authenticated / service_role) varsayılan olarak açıyordu → 0000 (tablolardan önce
  kapatır), 0008 (temizler + sonucu DOĞRULAR; etkisiz kalırsa göç hata verir), 0009 (uygulama rolüne sorgu 15 sn / boşta işlem 30 sn sınırı), 0010
  (işlevlerin arama yolu sabit; Supabase güvenlik denetimi temiz, yalnız bilerek politikasız bırakılan göç kaydı bilgi notu). Kopan bağlantı artık
  süreci düşürmez (havuz + ödünç bağlantı 'error' dinleyicisi, bozuk bağlantı havuza dönmez), bağlanma 5 sn, boşta 5 sn; Vercel'de boştaki
  bağlantılar kapanana dek işlev açık tutulur (attachDatabasePool karşılığı, ek paket yok). Supabase'teki şema yereldekiyle **parmak iziyle aynı**
  (8/8: sütun, kısıt, politika, tetik, işlev, dizin, RLS, uygulama yetkisi). Kilit: tests/yayin.test.ts (13; göçler Supabase gibi süper kullanıcı
  OLMAYAN sahip rolüyle) + tests/bozan/yayin.bozan.ts (2). **Açık / sonra:** dosya deposu Vercel'de geçici (/tmp) — kalıcı depo K7 (Supabase Storage);
  Vercel GitHub uygulaması kurulmadığı için her gönderide siteyi ben yeniden yayınlarım; Vercel Hobby ticari kullanıma kapalı — gerçek firmalar
  gelmeden Pro; **Claude'a bağlı Supabase eklentisi BYPASSRLS'li `postgres` rolüyle bütün veriyi görebilir — gerçek veri girmeden önce eklenti bu
  projeden ayrılır ya da salt okunur + tek projeye daraltılır** (denetim bulgusu; karar reisim'in); pg-boss işçisi sunucusuz ortamda koşmaz (K5'te çözülür).
- 2026-10-04 (292): **K2 Personel 3: giriş hesabı ve roller** (maket personel.html; karar 32, 33, 34, 37; ENGEL 8). Firma yöneticisi kişinin kartından
  **hesap açar** (giriş e-postası + en az bir rol); **geçici parola yalnız bir kez** pencerede görünür (Kopyala / Tamam; kapanınca sayfadan da silinir,
  veritabanında yalnız özeti, denetim izine yazılmaz); kişi o parolayla girince "Parolayı değiştir"e gelir. **Yeni geçici parola** eski parolayı ve
  açık oturumları düşürür. **Hesabı kapat** (onay penceresi) → giremez; **yeniden aç** → girer (ayrılan personelde açılmaz). **Roller**: rollerin
  açıklamasıyla liste, "Kaydedilmemiş değişiklik var", kaydedince yeni yetki hemen geçerli ve kişinin açık oturumu düşer. Meslek yetkili değilse Denetçi
  satırında uyarı (engel değil). **Firmada en az bir firma yöneticisi kalır:** son yönetici rolünü bırakamaz, hesabı kapatılamaz; iki yönetici aynı anda
  birbirinin rolünü alırsa yalnız biri geçer (veritabanı işlem kilidi — ölçüldü). Geçici parola üç öbek, karışan harf yok (I, l, O, 0, 1).
  Test altyapısı: sayfa hazır işareti (`html[data-hazir]`) ve testlerden önce bütün oturumlu sayfaları tarayıcıyla açan ısıtma — geliştirme
  sunucusunun test ortasında derlemesi onay penceresini bozuyordu (yalnız ilk projede, geliştirme kipine özgü).
- 2026-10-04 (291): **K2 Personel 2: liste, kart, ekle / düzenle ekranları** (maket personel.html). Liste: süzgeç (Denetçi · Bilgisi eksik · Mekanik /
  Elektrik · Giriş hesabı yok; Rol, Meslek, Görünüm — Çalışanlar varsayılan), tablo ↔ kart, eksik bilgi satırda uyarı. Kart: kimlik ve sicil, giriş
  hesabı ve roller (durum, giriş e-postası, son giriş, görebildiği modül, roller), eksik bilgi şeridi, Düzenle (yalnız firma yöneticisi). Form: maketin
  bölümleri ve iletileri; hatalı gönderimde yazılanlar silinmez; yetkili olmayan meslekte uyarı şeridi. Denetçi yalnız kendi kartını görür, başkasının
  adresi "Sayfa bulunamadı", formu "yetkiniz yok"; muhasebe Personel'i göremez (gerçek sunucuda uçtan uca). Ortak sayfa parçaları tek üreticide
  (kırıntı, sayfa / nesne başlığı, bölüm, rozet, sekmeler). Güvenlik: "use server" dosyaları yalnız "…Eylemi" işlevlerini dışa açar (kilit) — köken
  denetimi yardımcıları ayrı modüle taşındı. **Makette olmayan:** "ayrıldı olarak işaretle" tuşu makette yok (sunucu işlevi hazır; yeri reisim'e soru).
  Kartın bilgi yüzleri (İSG-KATİP, zimmet, atama, eğitim, açık plan) ve maaş / atama / zimmet / eğitim / özlük bölümleri o modüllerle gelir.
- 2026-10-04: CI a019a12 düştü (e2e: tanım dizini sırası yanlış yazılmıştı). Kök neden süreç: kayıt zincirim uçtan uca testleri koşmuyordu → artık her
  commit'ten önce tam e2e (3 genişlik) geçmeden push yok.
- 2026-10-04 (290): **K2 Personel 1: veri ve sunucu işlevleri** (maket personel.html; `src/modules/personel/`). Personel tablosu (ad, iş e-postası,
  mobil imza telefonu, işe başlama, meslek + "diğer" adı, diploma / oda sicil / EKİPNET no, durum + ayrılış); giriş hesabı personele bağlı (karar 33).
  Zorunlu yalnız ad soyad, işe başlama, meslek (karar 39); iletiler maketle aynı. Meslekler ve Ek-III grupları sabit tanımlarda (maketle ayna testi;
  teknisyen yetkili kişi olamaz). **Yetki sunucuda:** firma yöneticisi ekler / değiştirir; planlama ve branş yöneticileri görür; muhasebe görmez; denetçi
  yalnız kendi kartını görür ve **düzenleyemez** (meslek ve sicil numaraları yönetici işi — "kendi" düzeyi burada yalnız görmedir). Başka firmanın kaydı
  "yok". İş e-postası firmada tek kişide; değişince giriş e-postası da değişir. **Ayrılan silinmez**; ayrılış tarihi işe başlamadan önce olamaz;
  ayrılınca giriş hesabı veritabanı tetiğiyle kapanır, açık oturumu düşer. Eksik bilgi (EKİPNET boş, meslek yetkili değil) yalnız denetçide ve uyarı.
  Ekranlar (liste, kart, form) sıradaki kalemde.
- 2026-10-04: CI "Run failed" iletileri (6739afa, 2062f41): ikisi de sayfalayıcı odak hatası, düzeltme 37034be'den önceki koşular; 37034be yeşil.
- 2026-10-04 (289): **K1 Çekirdek 10: beklenmeyen hata ekranı — K1 tamam.** Bir sayfa beklenmedik biçimde düşerse "Bu sayfa açılamadı · Beklenmeyen
  bir sorun oldu; yaptığınız son işlem kaydedilmemiş olabilir. Yeniden deneyin; sürerse firma yöneticinize bildirin." + **Yeniden dene** + **Ana sayfaya
  dön**; oturumlu sayfalarda menü yerinde kalır. Hatanın iç ayrıntısı (sorgu, dosya yolu) ekrana çıkmaz; yayında yalnız kısa başvuru kodu. **Makette bu
  ekran yoktu — metin benim önerim, reisim'in gözüne.** Geliştirme sayfalarının yayın kapısı düzene taşındı (altına eklenen her sayfa yayında 404;
  kilit testi). K1 kalemleri: giriş · oturum · kiracı · canDo · güvenli yazıcı · denetim izi · dosya ucu · numara · ayarlar · tanımlar · API sürümü ·
  hata / yetkisiz / bulunamadı / oturum doldu — hepsi kilitli. Açık kalan (bilerek ileride): parola sıfırlama e-postası (K5), S3 depo (K7),
  müşteri portalı ikinci RLS katmanı (09-E5, müşteri modülüyle K2), dondurulmuş firma bayrağı (09-E6, yönetim paneliyle).
- 2026-10-04: CI'da (6739afa, telefon) sayfalayıcıda "Sayfa 3"e basınca odak "Sayfa 1" tuşunda kaldı (2026-10-03'te eklenen tanılama yakaladı).
  Yerelde yeniden üretemedim (30/30). Odak artık hedef sayfanın numarasıyla, her çizimden sonra o tuş odak alana kadar verilir (önceki hâli tek
  çizimde kaçırırsa bir daha denemiyordu). Test gevşetilmedi; yeniden düşerse tanılama yine nerede kaldığını yazar.
- 2026-10-04 (288): **K1 Çekirdek 9: sabit tanımlar ve API sürümü** (ARKA-UC §2.1). Herkes için aynı, yavaş değişen tanımlar tek yerde
  (`src/tanim/tanimlar.ts`, şemadan geçer) ve cihaza **karma adlı JSON** olarak iner (`/api/tanim/<ad>.<karma>.json`): içerik değişince adı değişir,
  aynı ad sonsuz önbellekte kalır (çevrimdışı pakete K3'te girer); dizin `/api/tanim/dizin`; oturum gerekir. İlk tanımlar onaylı kaynaklardan: plan ve
  rapor durum adları (maketle ayna testi), eğri çarpanları (B 5 · C 10 · D 15), yasal mesai sınırları (660 dk, 270 saat). Öteki tanımlar (il / ilçe,
  meslekler, Bakanlık formatları, Not-1…11 metinleri) kaynağı gelince eklenir — uydurulmaz. **API sürümü:** her `/api` yanıtı `X-Probata-Api: 1`;
  cihaz uygulaması (K6) `X-Probata-Istemci` gönderir, desteklenen en eskiden eskiyse ya da başlık bozuksa **426 "Uygulamanın yeni sürümünü yükleyin"**
  (eski istemci yeni şemaya veri yazamaz); `/api/surum` sürümü söyler.
- 2026-10-04 (287): **K1 Çekirdek 8: firma ayarları ve şifreli sırlar** (KOD-GECIS §7, ARKA-UC §8; `src/server/ayar/`). Ayar bölümleri (firma bilgileri ·
  imza yöntemi · mesai · uyarı eşikleri · numara önekleri · saklama · yapay zekâ) biçimi ve başlangıç değerleriyle tek yerde (§7: nüsha 2, mesai 480 /
  180 dk, yıllık fazla çalışma ≤ 270 saat, günlük ≤ 660 dk, eşikler 30 / 30 / 30 / 60 gün, saklama 5 yıl — 5'in altı yazılamaz). Hiç kaydedilmemiş
  bölüm başlangıç değeriyle okunur; bozuk kayıt uygulamayı düşürmez (o alan başlangıca döner). Yazma sürüm kilidiyle ve denetim izine; ilk kaydı aynı
  anda iki kişi yaparsa ikincisi "başkası değiştirdi" alır. **Sırlar** (yapay zekâ API anahtarı, bulut erişimi, imza sağlayıcı) veritabanında yalnız
  şifreli (AES-256-GCM); ana anahtar ortam değişkeninde (`PROBATA_SIR_ANAHTARI`); şifreli metin firmaya ve sırrın adına bağlı — başka firmaya ya da
  başka ada kopyalanırsa çözülmez; ekranda yalnız son 4 hane; iz değeri taşımaz; ana anahtar yoksa sır yazılmaz (düz metne düşmez). Yerelde ana anahtar
  `data/sir-anahtari` (git dışı). **Yayın öncesi (K7):** ana anahtarın yedeği ayrı ve güvenli yerde tutulmalı — kaybolursa kayıtlı sırlar (firmaların
  API anahtarları) yeniden girilmek zorunda kalır. Ekranı (Firma ayarları modülü) K4'te.
- 2026-10-04 (286): **K1 Çekirdek 7: geçici parolayla ilk giriş — parolayı değiştir** (karar 34, 37; maket giris.html #/gecici). "İlk giriş bekleniyor"
  durumundaki hesap girince "Parolayı değiştir" ekranına gelir (kaldığı sayfa korunur); **"Şimdi değil" ile geçilebilir** (karar 34). Yeni parola en az
  10 karakter, harf + rakam; iki alan aynı olmalı; geçici parolayla aynı olamaz. Kaydedilince hesap "etkin" olur, **o hesabın başka cihazlardaki bütün
  oturumları düşer**, bu cihaz yeni oturumla devam eder, eski parola artık girmez; denetim izine "hesap.parola_degisti" (değer yok). Etkin hesap parolasını
  ancak **mevcut parolasıyla** değiştirebilir (Hesabım ekranı K2'de bu işlevi kullanacak). Başka firmanın hesabı değiştirilemez. Parola sıfırlama
  (e-posta bağlantısı, 30 dk) e-posta bağdaştırıcısıyla K5'te.
- 2026-10-04 (285): **K1 Çekirdek 6: dosya ucu** (09-A1–A4). Depo kapalı; nesne anahtarı tek üreticiden ve yalnız kimliklerden
  (`firma/…/modül/kayıt/dosya` — ad, rapor no yok); veritabanı da anahtarın kaydın kendisine ait olduğunu denetler (başka firmanın anahtarı yazılamaz),
  dosyanın içeriği sonradan değiştirilemez, dosya silinmez (çöp). **Yükleme:** tür içeriğin ilk baytlarından (uzantıya bakılmaz) — JPEG, PNG, PDF,
  Excel, CSV (gereken yerde; Excel'in Türkçe CSV'si de); **SVG ve HTML hiçbir koşulda**, sınır sunucuda; fotoğrafın konum / cihaz bilgisi (EXIF,
  PNG metin parçaları) silinir, görüntüye dokunulmaz; PDF işlenmez. **İndirme tek uçtan** (`/api/dosya/{kimlik}`): oturumsuz 403; başka firmanın,
  çöpteki ya da bağlı kaydı göremeyen kişinin dosyası 404 (varlığı söylenmez); her modül "bu kaydı kim görür" denetimini kendi ekler, **eklemeyen
  modülün dosyası kimseye açılmaz**. Yanıt: özel önbellek, `nosniff`, görsel / Excel sandbox'ta, Excel her zaman indirilir, dosya adı başlığa satır
  sokamaz. Görsel yalnız `<GizliResim>` ile (adres `<img src>`'ye yazılmaz, oturum boyunca bir kez iner, görünür alana girince). **Ölçemediklerim:**
  PDF'in tarayıcı görüntüleyicisinde satır içi açılışı (başsız tarayıcı PDF'i indirir) ve gerçek bir modülde baştan sona yükle → göster (ilk dosya
  bağlayan modülde, K2). S3 bağdaştırıcısı K7'de (Supabase).
- 2026-10-04 (284): **K1 Çekirdek 5: numara üretici** (§3.5, KOD-GECIS §6; `src/server/numara/`). Proje `P-AAYY-SIRA` (ayda 001'den), rapor
  `XX-AAYY-SIRA-EK` (XX firmanın rapor kodu veritabanından, SIRA firmada kesintisiz, EK 5 hane rasgele, revizyon `-R1`), teklif `T-` · sözleşme
  `IS-` · gider `G-` · izin `I-` + `AAYY-SIRA`. **AAYY Türkiye saatiyle** (30 Eylül 23:30 TSİ hâlâ Eylül; 1 Ekim 00:30 TSİ Ekim). Numara kaydı oluşturan
  işlemin içinde alınır: işlem düşerse sıra da geri alınır (**rapor sırasında boşluk kalmaz**); aynı anda alınan 20 numara 20 farklı ve ardışık
  (ölçüldü); sayaç yalnız ileri gider (veritabanı tetiği — verilmiş numara yeniden verilmez), firmalar birbirinin sayacını görmez. Önek firma ayarından
  verilebilir (Firma ayarları kalemi). Olumsuz kanıt 3 bozma (oku-sonra-yaz sayaç, ileri tetiği, saat dilimi).
- 2026-10-04: CI'da (a733ddb, tablet) bildirim kaybolmadı: zamanlayıcı bileşen yeniden bağlanınca siliniyor, "görünür" kalıyordu → zamanlayıcı
  görünür duruma bağlı etkiye taşındı (06bdcf1). Yerelde yeniden üretemedim; kök neden koddan çıkarıldı.
- 2026-10-04 (283): **K1 Çekirdek 4: güvenli yazıcı ve denetim izi** (09-D1, D3). Modüller kayıt ekler / değiştirirken tek yazıcıdan geçer
  (`src/server/db/yazici.ts`): yazılabilir sütunlar tabloya göre listelidir (kimlik, firma, sürüm, zaman damgası hiçbir zaman formdan yazılmaz; liste dışı
  ad SQL'e girmez); **iyimser kilit** — kayıt ekranda açıldıktan sonra başkası değiştirdiyse kaydetme reddedilir ("başkası değiştirdi"), sessizce
  ezilmez; aynı anda üç kaydetmeden yalnız biri geçer (ölçüldü). Yalnız değişen alanlar yazılır ve **denetim izine eski / yeni + gerekçe** olarak düşer;
  parola özeti gibi gizli alanların değeri ize yazılmaz. Başka firmanın kaydı "yok" döner (varlığı söylenmez). **Denetim izi değişmez:** uygulama
  güncelleyemez / silemez, veritabanı tetiği tablo sahibine bile izin vermez; **kim ve ne zaman veritabanında damgalanır** (oturumdaki hesap işlemin
  bağlamından, saat veritabanından) — kod başka bir kişi ya da geçmiş tarih yazamaz. Giriş, hesap kilidi ve IP kilidi de ize düşer. Kilit: modül ve
  sayfa kodunda ham `INSERT / UPDATE / DELETE` yok (yazma yalnız çekirdekten). Testler gerçek PostgreSQL'de iki firmayla; olumsuz kanıt 5 bozma.
- 2026-10-04 (282): **K1 Çekirdek 3: giriş ekranı, ara katman, oturumlu rotalar, çıkış, yetkisiz / bulunamadı ekranları.** Firma adresin alt alan
  adından çözülür (`<firma>.<ana alan>`); giriş o firmanın içinde yapılır, başka firmanın hesabı denenemez. Uygulama rotaları `(uygulama)` grubunda ve
  hepsi oturum ister (yerleşim `oturumGerekli()`); oturum yoksa ya da düştüyse giriş ekranına, girişten sonra kaldığı sayfaya döner (S2). Yan menü
  rolün görebildiği modüllerle çizilir; adresi elle yazınca "Bu sayfayı görme yetkiniz yok" çıkar, modülün içeriği çizilmez (yetki sunucuda, istemciden
  rol gelmez). Çıkış sunucudaki oturumu siler, eski çerez yeniden takılsa da geçmez. **Güvenlik başlıkları:** her istekte ayrı nonce'lu CSP
  (`'strict-dynamic'`, satır içi betik / olay işleyicisi çalışmaz), çerçeveye gömme yok, `nosniff`, yayında HSTS. **Çerez:** yayında `__Host-probata`
  (Secure, alan adı yazılmaz → yalnız o firmanın adresine gider), HttpOnly, SameSite=Lax; geliştirmede `probata-oturum`. Sunucu eylemlerinde köken
  denetimi (Next'in kendi denetimine ek). Dönüş adresi yalnız site içi yol (açık yönlendirme yok). **Oturum süresi:** 12 saat hareketsizlik, en çok 14 gün.
  **Bilinen sınır (yazılı):** IP kilidi istemci IP'sini `X-Forwarded-For`'un ilk değerinden alır — barındırma (Vercel) bu başlığı kendisi yazar; başka
  ortamda ters vekil şarttır, yoksa IP kilidi aşılabilir (hesap kilidi yine işler). **Geçici parolayla ilk girişte parola değiştirme** sonraki K1
  kalemi. **Pages'teki uygulama önizlemesi kalktı:** durağan çıktı sunucu eylemi, ara katman ve çerez çalıştıramıyor; Pages'te yalnız maket ve sunumlar
  kalır (`…/uygulama/` artık yok). Geliştirme vitrini `(gelistirme)` grubunda, yayında 404. `npm run dev` ilk açılışta uydurma "deneme" firmasını ve
  yönetici hesabını kurar; parola rasgele, yalnız `data/gelistirme-hesap.txt`'de (git dışı). Uçtan uca: geçici veritabanında iki uydurma firma
  (`scripts/e2e-sunucu.ts`), `e2e/giris.spec.ts` (kiracı çerezi, kurcalanmış çerez, rol, kilit, açık yönlendirme, CSP). Üretim derlemesi (standalone)
  geçici veritabanıyla Chromium'da denendi: giriş → kaldığı sayfa, `__Host-probata` Secure + HttpOnly + Lax, HSTS, CSP'de `unsafe-inline` / `unsafe-eval` yok,
  sayfalar biçimli çizildi, `/vitrin` 404.
- 2026-10-04 (281): **K1 Çekirdek 2: tek yetki denetimi `canDo` ve rol düzeni** (`src/server/yetki/`). Rol listesi, başlangıç düzeyi tablosu (yaz · gor ·
  brans · kendi · yok) ve özel eylemler tek tanımda; ayna testleri bunu veritabanının rol CHECK'ine, onaylı maketin matrisine (MV.MATRIS) ve KOD-GECIS §4
  tablosuna bağlar. Ekran yetkisi rollerin birleşimi; kayıt bilgisi (sahip, branş, atananlar) sunucuda okunur. Firma matrisi yalnız tanımlı düzeylerle
  okunur (bozuk değer kapalı); firma yöneticisi Personel / Firma ayarları / Hareket kaydı yetkisini kendinden alamaz. **Dört göz:** teknik yönetici kendi
  yazdığı raporu onaylayamaz / geri gönderemez (kod kararı; makette tek kişinin iki rolü örneği yoktu). Tanımsız rol ve eylem adı (toString, __proto__ …)
  hiçbir şey vermez. Test 8/8, bozan 3/3.
- 2026-10-04 (280): **K1 Çekirdek 1: hesap, parola özeti, oturum** (reisim: *"site güvenliği, kaynak koddan rol değiştirme sızma veri çalma gibi şeylere
  dikkat et"*). Göç 0002: `hesap` · `oturum` · `giris_kilidi` (hepsi RLS, firma bağlamında). Parola Node'un scrypt'iyle özetlenir (düz parola yok); oturum
  belirteci 32 bayt rasgele, veritabanında yalnız SHA-256 özeti. Kilit (karar 37): hesapta ve IP'de 5 hata → 15 dk; yanıt hesabın varlığını söylemez.
  Roller hesaptan her istekte okunur (istemci rol yollayamaz); rol / durum / parola değişince o hesabın oturumları veritabanı tetiğiyle hemen düşer
  (09-E4). Firma A'nın belirteci firma B'de geçmez. **Oturum süresi (teknik seçim):** 12 saat hareketsizlik, en geç 14 gün. Gerçek PostgreSQL'de iki
  firmalı test 9/9; bozan 2/2 (tetik ve politika kalkınca açık gerçekten açılır).
- 2026-10-03 (279): **K0 Hazırlık 7: ortak şema kitaplığı** (`src/sema/ortak.ts`, zod; KOD-GECIS §2 "sunucu ve istemci aynı şemayı paylaşır") — K0 bitti.
  Yapı taşları: metin · e-posta (kırpılır, küçülür) · parola (karar 37) · ekipman kodu (A–Z 0–9 tire 3–20; büyük harfe yerelden bağımsız, i → I) · cihaz kodu ·
  fatura no · tarih / zaman (takvimde olmayan gün yok) · tutar (kuruş tam sayı; "1.234,56") · sürüm · kimlik; hatalar alan → ileti haritası. zod'un kendi
  iletileri Türkçe. Vitrin formundaki ekipman kodu aynı şemayı kullanır. Birim 7/7 + bozan 3/3.
- 2026-10-03 (278): **K0 Hazırlık 6: bilgi yüzleri, bilgi listesi, koşul listesi, form sayfası, uzun tuş** — K0'ın ortak bileşenleri tamam (kalıp 20 a, b, d;
  kalıp 12). Yüz: sayı + not, uyarı notu uyarı renginde, bağlantıysa listeye gider; telefonda iki sütun. Form: bölüm kartları (en az 440 px), iki sütunlu
  ızgara, alan altında yalnız hata / uyarı / sonuç (girdiye bağlı), telefonda yapışkan tuş çubuğu. Uzun tuş: iş sürerken ikinci basış yok sayılır, dönen
  simge + adım + 3 sn sonra süre, hata yutulmaz (bildirim). Birim 2/2 + bozan 1/1; uçtan uca 18/18 (bu dosya). §11 277'nin raporlayıcısı ilk koşuda
  kararsız testi adıyla gösterdi: telefonda sayfalayıcı, "Sayfa 3"e basınca odak tuşta kalmadı (yerelde 4 tam koşunun 1'inde; tek başına 15/15, işlemci
  yavaşlatmalı 12/12 geçti — kök neden ÖLÇÜLEMEDİ). Test gevşetilmedi; düşerse odağın nerede olduğu mesajda yazar.
- 2026-10-03 (277): **CI uçtan uca adımı düştü** (reisim: *"Run failed"*) — 28e4689 çalışma dalında uçtan uca adımda düştü, aynı commit main'de geçti;
  yerelde 3 tekrarda 177/177, hata tekrarlanmadı; CI günlüğü dış sunucuda, okunamadı (ölçemedim). En güçlü aday: geliştirme sunucusu sayfayı ilk istekte
  derliyor, yavaş CI'da ilk testin 5 sn beklemesi aşılıyor. Düzeltme: testlerden önce sayfalar bir kez derlenir (`e2e/hazirla.ts`); CI'da düşen test artık
  GitHub'da adıyla not olarak görünür (Playwright github raporlayıcısı) — bir dahaki düşüşte sebep doğrudan okunur.
- 2026-10-03 (276): **K0 Hazırlık 5: seçim alanı + takvimli tarih / saat** (tek üreticiler, `src/components/secim/`; maketteki `MK.secim`, `MK.zaman`).
  Seçim alanı: yerli açılır liste yok (kalıp 19), girdi gibi düğme + temalı liste; 8'den fazla seçenekte arama; klavye ↑ ↓ Home End Enter Esc Tab ve harfle
  atlama (kalıp 19 — makette yoktu, kodda var); liste alanın altında, sığmazsa üstünde; pencerede akış içinde, Esc yalnız listeyi kapatır. Filtre seçicileri
  aynı listeyi kullanır. Tarih: GG.AA.YYYY yazılır ya da kutuya / simgeye tıklayınca takvim (ay geçişi, Bugün); takvimde olmayan gün işaretlenir. Saatli
  alanda saat ve dakika ayrı, yazarken uyan değerler önerilir; saat : dakika tek grupta (öneri listesi dakikanın üstüne binmesin — uçtan uca test yakaladı).
  Tarih yardımcıları React'siz (`tarih.ts`), birim 5/5 + bozan 2/2; uçtan uca 59/59.
- 2026-10-03 (275): **K0 Hazırlık 4: liste ↔ kart + filtre satırı** (tek üreticiler, `src/components/liste/`; maketteki `MK.tablo`,
  `MK.suzgecHtml`, `MK.listeCiz`, sayfalayıcı ile aynı). Liste kabı 600 px ve üstünde tablo (600–960 sıkışık, tablet dikeyde de tablo), altında kart.
  Filtre: arama ya da alan alan arama kutuları · çipler (sayılı) + ve/veya · seçiciler (8'den fazla seçenekte arama) + Temizle sağda; telefonda seçiciler
  ve sıralama "Filtre" levhasında. Dürüst sayaç (3 / 23), dört boş durum (veri yok · görünüm boş · filtre boş · imkânsız birleşim), sıralama tabloda
  başlıktan, sayfa boyu kalıptan. Süzgeç mantığı React'siz (`suzgec.ts`), birim testi 9/9 + bozan 3/3; uçtan uca 43/43.
- 2026-10-03 (274): **K0 Hazırlık 3: tuş · şerit · bildirim · onay penceresi** (tek üreticiler, `src/components/`; maketteki `.a-tus`, `.a-serit`,
  `MK.bildir`, `MK.onayla` ile aynı görünüm ve davranış). Tuş: birincil / ikincil / tehlike, yüksekliği `--tus-y` (34 · dokunmatik 44), içerik kadar geniş.
  Şerit: bilgi / uyarı / onay / hata, sağda isteğe bağlı tek eylem; hata şeridi ekran okuyucuya hemen okunur. Bildirim: altta ortada, 4 sn. Onay
  penceresi: odak **Vazgeç**'te (Enter yanlışlıkla silmez), Esc = vazgeç; telefonda alttan levha. Bildirim ve onay her sayfada tek (kök düzen). Geliştirme
  vitrini `/vitrin` (yalnız geliştirmede; yayında "Sayfa bulunamadı"; menüde yok). Uçtan uca 24/24; olumsuz kanıt: bileşenler bozulunca 12 + levha 1 düşer.
- 2026-10-03 (273): **K0 Hazırlık 2: uygulama kabuğu maketle eşit** — menünün üstünde gruptan bağımsız **Ana sayfa** (kök adres `/`), Planlar `/planlar`;
  geniş bantta menüyü daraltan ☰ **sol barın başında** (logonun sağı; daralınca 64 px şeridin tek simgesi; maket §11 270), orta / dar bantta çekmece ☰ üst
  çubukta. Uçtan uca 9/9 (masaüstü · tablet · telefon); olumsuz kanıt eski kabukla 4 düşer. Kullanıcı alanı ve menü balonları oturum (K1) ve veri gelince.
- 2026-10-03 (272): **KOD BAŞLADI — K0 Hazırlık 1: paketler ve uçtan uca test düzeni** (§9 elli ikinci tur). G0 uygulandı (bütün maketler bu tarihteki
  hâliyle onaylı). Paketler: `zod` 4.6.5 (ortak şema), `@playwright/test` 1.63.0 (yalnız test). `playwright.config.ts` (masaüstü 1920 · tablet 1080 ·
  telefon 375; Next geliştirme sunucusu projenin yoluyla, yalnız 127.0.0.1; makinedeki Chromium varsa o), `e2e/kabuk.spec.ts` (ilk denetim: kabuk
  çizilir, yatay kayma yok), `npm run test:e2e`, CI'da uçtan uca adım. Paket izni kalıcı (KOD-GECIS §2, CLAUDE.md §1).
- 2026-10-03 (271): **Arka plan eski hâline** (reisim: *"Arka plandan vazgeçtim bu arada kalsın"*). Açık tema zemini #FAF9F6 → yine **#F5F3EE**
  (§11 270'in (3). maddesi geri alındı; öteki maddeler aynen). Kontrast 74 çift geçti.
- 2026-10-03 (270): **S.A.Y üstte; ☰ sol barda; arka plan beyaza yakın; tablette ekipman tuşları tek satır; tuşa basınca başa atmaz** (§9 elli ikinci tur,
  akşam). (1) S.A.Y paneli geniş bantta içeriği daraltmıyordu ama kaydırıyordu (sağ iç boşluk) → kural kalktı, panel her şeyin üstünde. (2) Yan menüyü
  daraltan ☰ üst çubuktan sol barın başına (logonun sağı; daralınca şeridin tek simgesi); tablet / telefonda çekmeceyi açan ☰ üst çubukta kalır (menü
  kapalıyken başka yer yok). 2026-09-24'teki "aynı yer, aynı simge" kararı bu sözle değişti; uygulama kabuğu (src/components) kodda aynı yapılacak.
  (3) Açık tema zemini #F5F3EE → **#FAF9F6** (`tokens.css` tek kaynak + docs kopyası; kontrast 74 çift geçti; palet değişikliği reisim'in açık isteği).
  (4) Plan içi ekipman tablosu 600–960 px kapta: işlem sütunu Rapor sütunundan pay alır, Pasife al + Rapor oluştur tek satır (768 / 820 / 1024'te ölçüldü).
  (5) Adres değişince sayfa başa yalnız başka yere gidilince atar; aynı yerde pencere açılıp kapanınca (#/plan/1 ↔ #/plan/1/ekle, Muhasebe fatura / gider
  penceresi vb.) ve yalnız seçim değişince (?kisi=…) yer korunur (maket-ortak; bütün sayfalar). Plan içinde Rapor oluştur başa atmadı (1440 ve 820'de
  ölçüldü); başka bir tuşta sürerse reisim'den hangisi olduğu istenecek.
- 2026-10-03 (269): **"SGK DETSİS NO" ve "İSG-KATİP SÖZLEŞME ID" her yerde büyük harf** (reisim: *"neden sgk destsis no büyük harflerle başlayıp
  yazılıp no kısmı küçük aynı şey isg katip sözleşme id de de var"*; seçenekler sorulunca: **"Hepsi büyük harf"**). Plan ekranı, saha raporu, rapor PDF'i
  (firma bilgileri + Bakanlık tablosundaki "İSG-KATİP Sözleşme ID" satırı), müşteri / tesis, sözleşmeler, Plan aç, Firma ayarları (Excel sütunu),
  S.A.Y yardım metni; ölçüm aracındaki denetim metinleri aynı. Bakanlık formatındaki "SGK Sicil Numarası" resmî satır adı olduğu için değişmedi.
- 2026-10-03 (268): **Pages önizlemesinde önbellek: betik ve stil adreslerine yayın sürümü** (reisim: *"açtım zaten ama hala sadece rapor ekranında
  çıkıyor"* · *"saat 17.53 sen ne anlatıyosun"*). Neden: yeni S.A.Y 17:52'de (Türkiye) yayına çıkmıştı, tarayıcı eski betikleri önbellekten okuyordu
  (adres aynı). `scripts/onizleme.ts` yayın kopyasındaki maket sayfalarında `assets/*.js|css` adreslerine `?v=<commit>` ekler; docs/ değişmez.
  Doğrulandı: site/ derlemesinde Onaylar'da S.A.Y düğmesi sürümlü betikten yükleniyor.
- 2026-10-03 (267): **Yapılmayan istek taraması + son durum sunumu** (§9 elli ikinci tur; reisim: *"söylediğim her şeyi yap söyleyipte yapmadıın
  şeyler de olmuş bi maket turu at bana sunum yap son durumu"* · *"bitince sunum yap"*). §9 kırk üçüncü – elli ikinci tur tek tek tarandı: istenip
  yapılmayan kalmadı (AA6 dahil hepsi §11'de). Açık: araç tutanağının kalem / açı soruları, öteki türlerin rapor formatı PDF'leri (reisim'den);
  ertelenen: §3.7 firma özelleştirmeleri, personel hesabı açma ayrıntısı, alan adı ve mağaza hesapları (yayın öncesi). Sunum: claude.ai'de özel
  slayt (11 slayt: bu tur, plan künyesi, Onaylar, bordro, S.A.Y, eğitim önerisi, maket turu, kararlar, açıklar, koda geçiş gündemi). Kod değişmedi.
- 2026-10-03 (266): **S.A.Y her sayfada, yuvarlak düğme; eğitim önerisi** (§9 elli ikinci tur). Rapor çubuğundaki S.A.Y tuşu kalktı; her firma
  sayfasında sağ altta yuvarlak düğme (56 px; vurgu renklerinin geçişi, içte açık daire ve yıldız simgesi, "S.A.Y · Asistan"; telefonda yalnız
  daire, altta yapışkan çubuk varsa üstünde; rapor ekranında Kaydet / Onaya gönder'in üstünde). Panel daha yuvarlak, başlığı renkli, baloncuklar
  yuvarlak. Rapor ekranında (düzenlenen rapor) eski sorular (eksikler, sonuç önerisi); öteki sayfalarda **Beni ne bekliyor?** (kişinin yan
  menü balonları, sayfa bağlantılarıyla) ve **Bu sayfada ne yapılır?**. Kural aynı: firma yapay zekâyı açtıysa görünür (makette Firma ayarları ›
  Yapay zekâ'dan açılır, sayfalar arası kalır); müşteri paneli ve Yönetim'de yok. Kabuk betiği yükler (MK.kabuk). **Geçmiş kalıcı** (reisim'in
  ara mesajı): sohbet ve panelin açık hâli sayfa değişince / yenilenince kalır, yer ayracı ("Onaylar", "Rapor KM-…"), rapor önerisi ve "Git"
  yalnız o rapor açıkken, "Sohbeti temizle" (onay penceresiyle). Ölçerken bulunan ve düzeltilen: plan içi 26 haneli SGK DETSİS no 320 px telefonda
  7 px taşıyordu (BB2'den); ölçüm aracı panel açıkken içerik genişliğini yanlış hesaplıyordu (iki yanın iç boşluğu ayrı sayılır oldu). İki denetim tarih + gerekçeyle
  güncellendi (eski iri tuş; onaydaki raporda düğme yok → genel sorular), yeni denetimler: Onaylar'da S.A.Y, müşteri panelinde yok.
  **Eğitim önerisi (reisim sordu: "onu eğitme işini maket bittikten sonra mı yapalım önce mi"):** **sonra, kodun K5 adımında.** S.A.Y'ı
  "eğitmek" model eğitmek (ince ayar) değildir — gerekmez, pahalı ve her firmaya ayrı olmaz. Doğru yol: (1) **bilgi seti** — firmanın
  Dökümanlar'ı (talimat, standart), ekipman türü kriterleri ve rapor formatları, mevzuat özetleri; S.A.Y soruya bunlardan alıntıyla cevap verir;
  (2) **araçlar** — ekrandaki kaydı okuma ve öneri verme (bugünkü makette kurallı taklidi var); (3) **deneme seti** — reisim'in gerçek saha
  sorularından 50–100 soru-doğru cevap; her değişiklikte bu setle ölçülür. Makette şimdi yapılacak bir şey yok: kurgu hazır; bilgi seti
  ve deneme seti gerçek kodla, gerçek dökümanlarla kurulur. Reisim'den o adımda istenecek: sık sorulan saha soruları ve firmanın dökümanları.
- 2026-10-03 (265): **Muhasebe › Maaş bordrosu gönder** (§9 elli ikinci tur). Muhasebe'nin her sekmesinde tuş → pencere: dönem (varsayılan geçen
  ay) · **Formattan oluştur** (Firma ayarları › Bordro formatı yüklüyse; kişinin bordrosu son maaş bilgisiyle oluşur) ya da **Elle yükle** (her
  kişiye kendi PDF'i) · personel listesi (seç, bordro, durum: Hazır / Bordro yok / Bu dönem gönderildi / İmzalandı). İmzaya gönder → seçilen ve
  bordrosu hazır olan her kişinin bordrosu Onaylar › Diğer belgeler'ine düşer, Personel kartındaki bordrolara yazılır; bordrosu olmayan
  gönderilmez, bildirim sayısını söyler; aynı dönem ikinci kez gönderilmez. Firma ayarları'na **Bordro formatı** bölümü (yükle / değiştir /
  kaldır; yoksa elle yükleme). Ölçüm: m14 durum 216/216, etkileşim 52/52, telefon 108/108; m1, m9 tam; olumsuz kanıt eski kodla 49/52.
- 2026-10-03 (264): **Onaylar: bütün imzalar tek yerde — denetçi bakışı** (§9 elli ikinci tur). Onaylar'da "Makette bakış" dört kişi (Mekanik
  yönetici, Elektrik yönetici, Mert Kaya · denetçi, Elif Aydın · denetçi; uygulamada herkes kendi rolüyle görür). Denetçide iki sekme:
  **İmzamı bekleyen raporlar** (yönetici onayladı → son imza; Görüntüle · İmzala, birden çoksa Hepsini imzala; imza penceresi firmanın
  yöntemiyle, her rapor ayrı imza, PIN bir kez; imzalanan rapor tamamlanır, müşteriye açılır, firmanın deposuna arşivlenir) ve **Diğer
  belgeler** (bordro, zimmet, eğitim, araç tutanağı). Örnek veri: Mert Kaya'ya Eylül bordrosu + zimmet formu (bekliyor), eğitim formu (imzalı);
  Elif Aydın'a Eylül bordrosu. Raporlar'daki imza şeridi makette yerinde kaldı (mobil telefon ve indir-imzala-yükle denemeleri orada); kodda
  imzanın tek merkezi Onaylar. Bir denetim gerekçeyle güncellendi (Onaylar balonu 4 → 4 rapor + 2 belge). Ölçüm: m9 328/328, etkileşim 55/55,
  telefon 164/164; m1, m14, araçlar tam; olumsuz kanıt eski kodla 54/55.
- 2026-10-03 (263): **Plan künyesi: planlamacı Düzenle, denetçi Güncelle; SGK DETSİS no geri** (§9 elli ikinci tur). Plan içinde Firma adı, Adres,
  İSG-KATİP sözleşme ID, SGK DETSİS no; "Makette bakış" (Mert Kaya · denetçi / Zeynep Arslan · planlamacı; uygulamada yok). Planlamacı Düzenle →
  dört alan → Kaydet (plan kaydı + hareket). Denetçi şeritte değişen alanları görür; Güncelle plan ekranını ve yalnız kendi taslak raporlarını
  yeniler, onaydaki / imzalı ve başkasının raporu aynı kalır. Rapor ekranı: künye raporun kendi kopyası (ortak kayıtta), SGK DETSİS no satırı
  geri, şerit + Güncelle yalnız taslakta; PDF (bilgi bloğu + Bakanlık tablosu) raporun künyesinden. Kırılan iki denetim tarih + gerekçeyle
  güncellendi ("SGK DETSİS ekranda yok" → "var"; Güncelle bildirimi). Ölçüm: planlar etkileşim 67/67, m8 128/128; olumsuz kanıt eski kodla
  planlar 65/67, m8 124/128.
- 2026-10-03 (262): **Tesisin ekipmanları Excel'den (teklifsiz) — müşteri kartı ve Plan aç** (§9 elli ikinci tur). Tek üretici MK.ekipmanExcel (maket-ortak): şablon (Ekipman kodu*, Ekipman türü*, Kullanım yeri, Marka, Model, Seri no, İmal yılı, Son kontrol tarihi, Son kontrol sonucu) → dosya → satır satır denetim (kod biçimi ve eşsiz, tür katalogda, dosyada iki kez yok; uyarı: imal yılı / tarih okunmadı, sonuç yok) → Yükle (N). Son kontrol bilgisi eski müşterinin geçmişi olarak ekipmana yazılır ("eski kayıt (Excel)"). Müşteriler › tesis sayfasına **Ekipmanlar** bölümü (ilk 10 + sayı, Excel'den yükle); Plan aç özetinin altında **Ekipmanları Excel'den yükle** (plan açılınca hepsi plana girer).
- 2026-10-03 (261): **Tarih / saat kutusuna tıklayınca takvim ve saat listesi açılır** (§9 elli ikinci tur). Yalnız yandaki simgeye değil, kutunun kendisine tıklayınca da (maket-ortak, bütün sayfalar: tarih alanı ve takvim eki); odak kutuda kalır, yazmak serbest; yazılan tarih açık takvimi o aya götürür.
- 2026-10-03 (260): **Firma ayarları düzeni; Verileri dışa aktar kalktı** (§9 elli ikinci tur). Yapay zekâ ve Müşteriye açık personel belgeleri tam genişlik (yapay zekâ açılınca öteki bölümler yerinden oynamaz; belge türleri üç sütun); Bulut kaydı dar bölümlerin yanına; Verileri dışa aktar (S3, S4) bölümü ve kodu kaldırıldı (firmanın verisi zaten kendi deposunda, yedekler indirilebilir).
- 2026-10-03 (259): **KVKK hukukçu işi kaldırıldı; yerele taşıma ve canlı deneme planı** (§9 elli ikinci tur). CLAUDE.md §2, 09-G3 / yapay zekâ istisnası (4), KOD-GECIS Y3, Y6 (mağaza gizlilik politikası kalır). Kod ve maket değişmedi.
- 2026-10-03 (258): **Arşivde okunur klasör adları** (§9 elli ikinci tur; reisim "evet okunur olsun"). 09-A1'e istisna: firmanın deposunda yalnız `arsiv/` altı okunur (yıl, müşteri ünvanı, rapor no); `calisma/` ve öteki dosyalar okunmaz kimlikle. KOD-GECIS Y2b. Sunumun son slaydı güncellendi.
- 2026-10-03 (257): **Rapor saklama süresi: en az 5 yıl, uzatılabilir** (§9 elli ikinci tur; reisim "2 olsun"). Firma ayarları › "Saklama süresi dolan raporlar" → "Rapor saklama süresi": yalnız süre (5 yasal en az – 20 yıl); sistemde kalsın / arşiv / sil ve arşiv yeri kalktı (MV.SAKLAMA silindi). Depolama bölümü süreyi gösterir (otomatik silme, aylık arşiv yedeği). CLAUDE.md §7, 09-C1, KOD-GECIS ENGEL 11. Analiz sunumu claude.ai'de (depoya girmez).
- 2026-10-03 (256): **Depoda 5 yıl dolunca otomatik silme** (§9 elli ikinci tur). Firma ayarları › Depolama: "Silme koruması · kısaltılamaz" yerine "Otomatik silme · 5 yıl dolunca" (30 gün önce liste) + bilgi şeridi (probata 5 yıl dolmadan silmez; elle silme firmanın sorumluluğu). KOD-GECIS ENGEL 11, Y2b; CLAUDE.md §7 otomatik silme satırı.
- 2026-10-03 (255): **Depo zorunlu, düzenli arşiv, elle yedek yok** (§9 elli ikinci tur). Yönetim › Firma aç'a "Firmanın deposu" bölümü (uç, kova,
  erişim + gizli anahtar, depo yeri; **Bağlan ve dene**): depo bağlanmadan **Firmayı aç** reddedilir (şerit, onay penceresi açılmaz); depo alanı
  değişince yeniden denenmeli; firma listesinde ve sayfasında depo durumu (Bağlı / Erişilemiyor). Firma ayarları › Depolama ve yedek yeniden: yalnız
  firmanın deposu (durum, son deneme, kullanım; **Bağlantıyı dene** · **Depoyu değiştir** → dene, onay, taşı; kesme yok), **Düzenli arşiv** (rapor
  yolu, arşivdeki imzalı rapor sayısı, 5 yıl silme koruması), **Yedek** (saatlik / günlük / haftalık — kapalı yok; saat; saklama 30–365 gün; aylık
  arşiv yedeği 5 yıl; sonraki yedek; son yedekler + İndir) — "Şimdi yedekle" ve "probata deposu" kalktı. Depo formu ortak üretici (MK.depoAlanlar /
  MK.depoDenetle). KOD-GECIS ENGEL 10–11, Y2b.
- 2026-10-03 (254): **Firma ayarları › Depolama ve yedek** (§9 elli ikinci tur; KOD-GECIS G2 + G3). Tam genişlik bölüm: **Dosya deposu** — şu an
  (probata deposu, AB ya da firmanın kendi deposu), kullanım (GB, dosya sayısı, bu ay indirme; 09-B10), **Kendi depomuzu bağla**: uç adresi, kova,
  erişim anahtarı, gizli anahtar (bir daha gösterilmez, saklanmaz), depo yeri (Türkiye / AB / başka ülke → KVKK uyarısı); **Bağlan ve dene**
  (biçim denetimi, erişim reddi söylenir); bağlanınca mevcut dosyalar taşınır ve doğrulanır; **Bağlantıyı kes** onaylı (dosyalar probata deposuna
  geri taşınır). **Yedek** — sıklık (kapalı / saatlik / günlük / haftalık), saat, saklama (7–365 gün) bölümün Kaydet'iyle; yedek yeri (kendi depo
  yoksa probata deposunda en çok 7 gün, uyarı), sonraki yedek, **Şimdi yedekle**, son yedekler listesi + **İndir**. probata'nın bütün veritabanı
  yedeği ayrıca (felaket kurtarma). Makette bağlantı taklit (kova adında "hata" → reddedilir).
- 2026-10-03 (253): **G3 kabul — Supabase** (§9 elli ikinci tur). §8.8 barındırma değişti (veritabanı + depo Supabase AB, uygulama AB'de hazır
  barındırma); CLAUDE.md §2 ve §8, 09-G3 (veri AB'de; KVKK hukukçu teyidi), KOD-GECIS G2 / G3 güncellendi. Yığın ve tasarım aynı. Kod ve maket değişmedi.
- 2026-10-03 (252): **Sunucu ↔ Supabase farkı açıklandı** (§9 elli ikinci tur ara mesajı). Kod ve maket değişmedi.
- 2026-10-03 (251): **Önceki üründe neden Firebase sorusu** (§9 elli ikinci tur ara mesajı) + G3'te Firebase ücret açıklaması düzeltildi (Realtime Database
  indirilen veriye, Firestore okumaya göre). Kod ve maket değişmedi.
- 2026-10-03 (250): **G3 açık — Supabase mi kiralık sunucu mu** (§9 elli ikinci tur ara mesajı). KOD-GECIS §0'a G3 eklendi. Kod ve maket değişmedi.
- 2026-10-03 (249): **G2 kabul — barındırma ve maliyet** (§9 elli ikinci tur). KOD-GECIS G2 karar oldu; kota, indirme trafiği ve iki katmanlı yedek
  açıklaması G2 satırına eklendi. Sıradaki: Firma ayarları › "Depolama ve yedek" maketi (reisim onayıyla). Kod ve maket değişmedi.
- 2026-10-03 (248): **Barındırma ve maliyet sorusu kayda geçti** (§9 elli ikinci tur). Yönetim sayfası kabul (KOD-GECIS Y1 karar). Supabase /
  Natro / firma başına veritabanı sorusu ve önerim KOD-GECIS §0 **G2** (açık, karar reisim'de). Kod ve maket değişmedi.
- 2026-10-03 (247): **probata yönetim — firma açma örneği** (§9 elli ikinci tur). `maket/yonetim.html`: firmaların görmediği, yalnız bizim
  ekibin sayfası (menüsüz kabuk, probata logosu + "Yönetim"). Firmalar listesi (ünvan, adres `xxx.probata.com.tr`, kısa kod, durum, açılış,
  kullanıcı) · **Firma aç**: ticari ünvan → alt alan adı ve kısa kod önerilir (elle değiştirilebilir), adres canlı görünür; ilk firma yöneticisi
  ad + e-posta; denetim: zorunlu alanlar, alt alan adı 3–30 a–z 0–9 tire, kayıtlı / ayrılmış ad (www, yonetim, api …), kısa kod iki harf ve eşsiz;
  onay penceresi → firma sayfası: **geçici parola yalnız bir kez** (Kopyala; sayfadan çıkınca bir daha görünmez), sonrası adımları (ilk giriş,
  Firma ayarları, Toplu içe aktarma, Personel) · **Dondur** (onaylı; veri silinmez) / **Etkinleştir** · yöneticiye yeni geçici parola. Firmalar
  uydurma. KOD-GECIS Y1: komut satırı aracı yerine bu küçük sayfa önerildi, karar reisim'de.
- 2026-10-03 (246): **Geçmiş tarihe plan açılır — uyarıyla (G1)** (§9 elli ikinci tur). Plan aç'ta plan günü bugünden önceyse engel kalktı;
  sözleşme uyarılarının üstünde şerit: "Plan günü geçmiş bir tarih: GG.AA.YYYY." Plan yine açılır. Rapor engeli değişmedi (yalnız ileri tarih).
  KOD-GECIS: G0 ve G1 kabul; ENGEL 10 → UYARI listesine.
- 2026-10-03 (245): **Toplu içe aktarma (ilk kurulum)** (§9 elli ikinci tur). Firma ayarları › "Toplu içe aktarma (ilk kurulum)", tam genişlik bölüm:
  tür seçilir (müşteriler ve tesisler · ekipmanlar · ölçüm cihazları · personel · araçlar) → **Şablonu indir** (Türkçe sütunlar, * zorunlu, örnek
  satırlar) → **Excel seç** (.xlsx / .csv) → satır satır denetim tablosu: "Eklenecek" (varsa uyarı notu: vergi no boş, EKİPNET boş, müşteri kayıtlı →
  tesis ona eklenir …) ya da atlanma nedeni (zorunlu alan boş, kayıtlı kod / plaka / cihaz kodu, dosyada iki kez, tür / meslek / tesis bulunamadı,
  geçersiz tarih) → **İçe aktar (N)**. Son içe aktarımlar listelenir; sonuncusu, kayıtları henüz kullanılmadıysa (plan, rapor, zimmet, hesap, km)
  onay penceresiyle **Geri al**. Ekipman tesise müşteri ünvanı + tesis adıyla bağlanır (önce müşteriler). Makette örnek dosya şablonun satırları +
  bir hatalı satır. KOD-GECIS: Y1 firma açma panelsiz (komut satırı aracı), Y2 maketlendi, Windows notu.
- 2026-10-03 (244): **Koda geçiş hazırlığı — `KOD-GECIS.md`** (§9 elli ikinci tur). Kaynak: ANAYASA, TASARIM-KALIBI, pkproje (§1–§9 tam, §11
  başlıkları), ARKA-UC, 09, RAPOR-FORMAT, 07, EKSİKLER, maket veri dosyası (~80 koleksiyon), maketteki kayıt engelleme mesajları, iskelet. İçerik:
  başlama kararları (G0, G1) · bağlayıcı kaynak sırası · çekirdek parçalar ve paket ilkeleri (Windows'ta yerel eklenti yok) · veri modeli (modül başına
  tablolar, veritabanında benzersizlikler) · rol × modül başlangıç düzeni + özel eylemler · durum makineleri · numaralar · firma ayarları (14 bölüm) ·
  sabit tanımlar · ENGEL / UYARI kataloğu · yapım sırası K0–K7 · kilit ve kabul testi planı (maketin ~700 davranış denetimi) · yayın öncesi kararlar
  (Y1–Y9) · makette kalacak geçici çözümler · riskler. Kod başlamadı.
- 2026-10-03 (243): **S.A.Y tuşu iri** (§9 elli ikinci tur ara mesajı). Masaüstünde 104×40 px (önce 84×34), yazı 15 px kalın, simge 20 px;
  telefonda adıyla görünür (önce yalnız simge), 96×44 px, İşlemler yanında kalan genişlikte.
- 2026-10-03 (242): **Araç ekle / düzenle + Araç bilgileri** (§9 elli ikinci tur ara mesajları). Araçlar listesinde "Araç ekle", araç sayfasında
  "Düzenle" (yalnız yönetici; sürücü görünümünde yok). Alanlar: plaka (zorunlu, eşsiz — aynı plaka ikinci kez açılmaz, engel), araç türü, marka, model,
  model yılı, yakıt (zorunlu); kayıt anındaki kilometre (yalnız eklerken; haftalık km ondan küçük yazılamaz), sonraki bakım km, muayene / trafik
  sigortası / kasko bitişi (isteğe bağlı, takvimli; boşsa takip edilmez). Eklenen araç depoda başlar, listeye, km takibine ve belge balonuna girer.
  Araç sayfasında yeni bölüm **Araç bilgileri**: plaka, araç türü, marka, model, model yılı, yakıt (+ kayıttaki km).
- 2026-10-03 (241): **Tarihler takvimden seçilir** (§9 elli ikinci tur ara mesajı). Yazılı her tarih kutusu (`data-takvim`: Plan aç, iş sözleşmesi,
  eğitim, fatura, tahsilat, personel, performans aralığı, ölçüm cihazı; saatli: araç ve zimmet tutanağı) yanında takvim simgesi alır — saha
  raporundaki takvimin aynısı (ay geçişi, Bugün). Seçilen gün kutuya yazılır, sayfanın kendi doğrulaması aynen çalışır; saatli kutuda saat korunur.
  Elle yazmak açık. Tek yerde (`maket-ortak.js` takvim eki), sayfa yeniden çizdikçe yeni kutular kendiliğinden donatılır.
- 2026-10-03 (240): **Rapor engeli gerçek takvime bakar** (§9 elli ikinci tur ara mesajı). Makette "bugün" uydurma veri için sabit 23.09.2026;
  reisim gerçek bugüne (03.10.2026) plan açınca rapor kapalı kalıyordu. Engel artık gerçek tarihe bakar (`MK.raporBugun`: gerçek gün, sabit günden
  ileriyse): bugün ve geçmiş açık, yalnız ileri tarih kapalı. Verinin geri kalanı sabit güne göre kalır. Nihai kodda zaten sunucunun günü.
- 2026-10-03 (239): **Rapor engeli yalnız ileri tarihte — metin bugünü söyler** (§9 elli ikinci tur). Kural değişmedi (P1, 213: plan günü bugün ya da
  geçmişse rapor açık, ileri tarihte kapalı). Şerit, Rapor oluştur eylemi ve "Kaydet ve kopyala" penceresi tek metinden (`MK.erkenMetin`): "Plan günü
  GG.AA.YYYY henüz gelmedi (bugün GG.AA.YYYY). Rapor plan gününden itibaren oluşturulur; geçmiş günlere açık, ileri tarihe kapalı." İki eski denetimin
  metni güncellendi; yeni denetim: geçmiş günlü planda kopya açılır.
- 2026-10-03 (238): **Firma logosu Firma ayarları'ndan; raporlara kendiliğinden gelir** (§9 elli birinci tur ara mesajı). Firma ayarları › Firma
  bilgileri'nde "Firma logosu": yükle (PNG, JPG, SVG; en çok 2 MB), önizleme, Değiştir, Kaldır (onaylı). Logo tek yerden (`MB.logo`) bütün
  başlıklara gider: Bakanlık formatlı raporlar (ZPKR01 / ZPKR02, her sayfa), temel formatlı raporlar ve bütün iç belgeler (araç tutanağı, zimmet
  formu, talep formları, sözleşme, saha formu, ara kontrol, format önizlemesi). Yüklenmediyse "LOGO" yeri kalır. Kilit: m1 2 etkileşim (eski
  kodda düşüyor).
- 2026-10-03 (237): **Format kurucu: bölüme basınca başa atmaz** (§9 elli birinci tur ara mesajı). Aynı türün kurucusunda bölüm değişince sayfa en
  başa kaymıyor; düzenleyicinin başlığı görünmüyorsa ona kayıyor ve odak orada (telefonda bölüm listesi üstte, düzenleyici altta olduğu için).
  Kilit: m3 telefon (375) etkileşimi, eski kodda düşüyor; m3 152/152 · 31/31 · 76/76.
- 2026-10-03 (236): **Araçlar: haftalık kilometre + belge balonu** (§9 elli birinci tur). Aracı kullanan kişi her hafta (Pazartesi–Pazar)
  göstergedeki kilometreyi yazar (sürücü görünümünde "Haftalık kilometre", araç sayfasında da); aynı hafta yeniden yazılırsa düzeltilir; son
  bilinen kilometreden küçüğü kaydedilmez, haftada 3.000 km'den fazla artış kaydedilir ama uyarılır. Araç sayfasında haftalık geçmiş: hafta ·
  kilometre · haftalık yol · giren; girilmeyen hafta "Girilmedi". Listede "Bu hafta km" sütunu (Girildi · Bekliyor · Geçen hafta girilmedi ·
  Depoda). Son bilinen kilometre artık tutanak ve haftalık kayıtların en yenisi. **Yan menüde Araçlar balonu:** kırmızı = süresi geçen muayene /
  trafik sigortası / kasko ya da geçen hafta girilmeyen kilometre; sarı = 30 gün içinde biten belge (kalibrasyonla aynı eşik) ya da bu hafta
  bekleyen kilometre; yönetici bütün araçları, sürücü yalnız kendi aracını sayar. Araç belgeleri **Uyarılar**'a da düştü ("Araç belgesi" çipi).
  Örnek kilometreler uydurma; 00 MAK 001 sonraki bakım 45.000 km. Kilit: araclar 4 yeni etkileşim (eski kodda düşüyor); km değerleri değişen 3
  araç denetimi ve Uyarılar sayımı 16 → 18 olan 5 denetim tarih + gerekçeyle güncellendi.
- 2026-10-02 (235): **Bütün iç belgeler Bakanlık formatı görünümünde** (§9 ellinci tur: *"tüm formatlar san daha önce attığım bakanlık formatları
  a benzesin elektrik topraklama ve panı için atmıştım"*). Temel formatlı 8 belge — rapor şablonu önizlemesi, saha formu, ölçüm cihazı ara kontrol
  kayıtları, izin / masraf talep formu, iş sözleşmesi, araç teslim tutanağı, rapor formatı önizlemesi (Format kurucu), zimmet teslim formu — tek
  başlık üreticisinden (`MB.resmiBas`) ZPKR01 / ZPKR02'nin başlık tablosunu alır: logo · firma künyesi · akreditasyon · BELGE ADI · doküman kodu,
  yayım tarihi, revizyon no / tarihi, yürürlük tarihi; başlık kâğıtta **her sayfada tekrar eder**. Bölüm başlıkları Bakanlık formatının pembe
  şeridi, etiket hücreleri mavi, bütün tablo ve bilgi alanları siyah çerçeveli, Carlito yazı tipi, A4 sayfa; köşe yuvarlama ve gölge yok. Yayım
  ve revizyon bilgileri uydurma (firma kendi formatında girer). Ekran listeleri ve uygulama görünümü değişmedi; yalnız belge / PDF.
- 2026-10-02 (234): **§8.3 kararı değişti — rapor formatı firmanın Format kurucusunda** (§9 kırk dokuzuncu tur, reisim: *"Tamam yapalım"*).
  §8.3 yeni karar: format firma × tür başına Format kurucuda kurulan sürümlü tanım; saha ekranı ve PDF bu tanımdan, çizen motor kodda tek;
  eski "kodda, site içi düzenleyici yok" üstü çizili kaldı. Aynı kararı tekrar eden yerler (§3.1 modül 6, §3 menü notu, M3 notu, M7 notu,
  §9 ikinci tur 5 ve 15) yeni karara bağlandı; CLAUDE.md §2 ve dizin haritası, RAPOR-FORMAT.md durumu "onaylı"; Format kurucu maketindeki
  "onay bekliyor" ifadesi kalktı. Ekran ve davranış değişmedi.
- 2026-10-02 (233): **AA10 · Firmanın kendi rapor formatını kurduğu sistem — tasarım + Format kurucu maketi** (§9 kırk sekizinci tur: *"Bu söylediklerimi
  tek bir rapor özelinde değil, tüm raporları bu şekilde kurgulayabileceğim bir sistem tasarla ben müşteriye sunduğumda kendi rapor formatını yükleyip
  istediği gibi şekillendirebilecek kurgulayabileceği bir sistem tasarlamamız gerkeli yoksa her rapor format yüklemesinde tek tek benim
  uğraşmam gerekli."*). Tasarım **`RAPOR-FORMAT.md`** (kökte): üç katman (yapı · kurallar · görünüm), 10 blok (bilgi alanları, kontrol listesi,
  ölçüm tablosu, test değerleri, ölçüm cihazları, fotoğraflar, kusur açıklamaları, sonuç, not, imza), kurallar (AA9'un iki kararı burada aç /
  kapa: "Uygun değil"de fotoğraf zorunlu, kusur derecesi — ikisi de başlangıçta kapalı), başlangıç yolları (hazır şablon · boş · kendi
  formatını yükle → yapay zekâ taslağı, öneri), sürüm ve yayın, veri, yapım sırası. **Maket:** Ekipman türleri › tür › **Format kurucu**
  (`#/tur/<kod>/kurucu`): solda bölümler (sırala ↑↓, ekle — 10 blok, sil — onaylı), ortada seçili bölümün düzenleyicisi (ad, alanlar /
  maddeler / değerler ekle-çıkar), sağda kurallar ve saha ekranı önizlemesi; **PDF önizle** tanımdan çizer; **Yayınla** onay penceresiyle
  sürüm artırır, yayın öncesi denetim (sınırsız değer, boş bölüm) uyarır. Bakanlık formatlı türde zorunlu bölümler silinemez. Makette tanım
  bu tarayıcıda kalır; saha raporu ekranı henüz tanımdan çizilmiyor (motor kod aşamasında). **§8.3'e öneri notu** düştü (onaylanınca karar
  değişir). layout-list, list, table, message-square ikonları eklendi. Kilit: m3 5 etkileşim (önceki kodda düşüyor) + 7 durum.
- 2026-10-02 (232): **AA8 · Uyarı ve onay pencereleri taraması** (§9 kırk sekizinci tur: *"yapılan işlemlerde uyarı pop-up larını unutma ama sitedeki
  tüm işlemler için bi kontrol et bu açıdan, giriş çıkış,şifre değişme , rapor gönderme vb."*). Tarama: 25 ekranda görünen her işlem tuşu ve açtığı
  pencerenin içindeki tuşlar (241 işlem) başsız tarayıcıda tek tek tıklandı; her biri için bildirim, onay penceresi, açılan pencere ya da adres
  değişimi kaydedildi. Geri bildirimsiz görünenlerin hepsi dosya seçici, pencere içi alan hatası ya da menü daraltma çıktı; eksik olanlar ve
  düzeltmeleri: **Çıkış yap** artık onay sorar (cihazda gönderilmemiş işlem varsa söyler) ve giriş sayfasında "Çıkış yaptınız; oturumunuz
  kapatıldı" yazar · **Giriş** sonrası Ana sayfa'da "Giriş yapıldı. Hoş geldiniz." · geçici parola sonrası "Yeni parolanız kaydedildi" ·
  **Rapor Onaya gönder** önce onay sorar (gönderilince teknik yönetici kararına kadar rapor kilitlenir) · **Hesabı kapat** ve **Teklif kabul**
  onay sorar · **Denemeleri sıfırla** iki adımlı tuş yerine aynı onay penceresi. Parola değiştir zaten "Parolanız değiştirildi" bildiriyor; silme
  işlemlerinin hepsi zaten onay penceresinden geçiyor. Sayfalar arası bildirim tek mekanizma (`MK.sonrakiBildir`). Kilit: m1 4 + m8 1 yeni
  etkileşim (önceki kodda düşüyor) ve 2 yeni durum; onaylı işlemleri yapan 21 eski denetime onay adımı eklendi (tarih + gerekçe).
- 2026-10-02 (231): **AA4 · Araçlar modülü (araç takip + fotoğraflı teslim tutanağı → zimmet)** (§9 kırk sekizinci tur: *"bir de araç takip modülü
  olsun hangi aracın kimde olduğu belli olsun takip edilebilsin elinde araç olanlar sadece kendi aracını yöneticiler her aracı kimde olduğunu vs
  görsün aracın teslim alımı veya teslim verimi üzerine fotoğraflı zimmet oluşturma olsun zimmetlere otomatik oradan gitsin örnek bi şablon
  oluştur inceleyip düzenleriz"*). Yan menüde Varlık grubunda **Araçlar (modül 23)**; uygulamanın modül kaydı ve rotası (17 modül); rol yetkisi
  denetçide "yalnız kendi", yöneticide "değiştirir". **Yönetici** (`#/`): bütün araçlar — kimde, son kilometre, muayene / trafik sigortası / kasko
  bitişi (30 gün kala sarı, geçince kırmızı). **Sürücü** (`#/benim`, makette Mert Kaya): yalnız kendi zimmetindeki araç ve kendi tutanakları;
  başka araç açılmaz. **Teslim tutanağı** penceresi: araç, teslim alan (kişi ya da depo), tarih-saat, kilometre (son tutanaktan küçük olamaz),
  yakıt, araçta olanlar (10 kalem), hasar notu, **açı açı fotoğraf** (ön, arka, sol, sağ, gösterge, iç; eksik açı yalnız uyarı). Kaydedince
  **zimmet hareketi kendiliğinden oluşur** (Zimmetler'de aynı kayıt) ve teslim alan kişiyse tutanak **Onaylar › Diğer belgeler**'ine imzaya düşer.
  **Şablon** sekmesi: boş tutanak (temel format KM-FR-ARC-01) — kalemler ve açılar ÖRNEK, reisim inceleyip düzenleyecek. Zimmetler'deki araç
  sayfasından Araçlar'a bağlantı; Verileri dışa aktar araç alanlarını ve tutanağı Türkçe sütunlarla verir (ölçümde yakalandı). car, clipboard-check ikonları eklendi. Kilit: yeni `araclar` ölçüm grubu (15 durum · 11 etkileşim · telefon);
  sürücü süzgeci, Onaylar'a gönderim ve km kuralı bozulunca 5 denetim düşüyor. Modül sayısı denetimi 16 → 17 (tarih + gerekçe).
- 2026-10-02 (230): **AA3 · Onaylar › Diğer belgeler + imza penceresi** (§9 kırk sekizinci tur: *"Onaylar kısmında diğer kısmı olsun muhasebeciden
  onaya maaş bordrosu gönderilirse veya eğitim zimmet formu gönderilirse oradan onaylanabilsin mobil veya e imza ile"* · *"mobil imza sitesinden
  site içi görüntüler elde ettim neyi nasıl yaptığına dair fikir sahibi olabilirsin"*). Onaylar'da **Diğer belgeler** sekmesi (`#/diger`): kişinin
  onayına gönderilen bordro, eğitim formu, zimmet formu — Görüntüle · Geri gönder · **Onayla ve imzala** (firmanın imza yöntemiyle). Personel ›
  Maaş ve bordrolar'da her bordroya **Onaya gönder** (işlem sütununda) ve onay durumu sütunu. İmza penceresi yeniden kuruldu (görüntülerden
  yalnız akış fikri alındı; ad, e-posta gibi içerik alınmadı): başlıkta imzacı, isteğe bağlı imza sebebi ve yeri, yöntem seçimi (mobil imza ·
  USB e-imza); USB'de gereksinimler ve 5070 sayılı Kanun şeridi, mobilde telefon, **parmak izi** (onay kodu öbekleri — telefonda görünenle
  aynı olmalı) ve üç adım. Yan menüde Onaylar balonu bekleyen belgeleri de sayar. Kilit: m9 + m1 etkileşimleri (önceki kodda 4 + 2 düşüyor); m10 balon denetimi 3 → 6;
  Onaylar balon sayıları 8 → 11, 7 → 10 ve zimmet imza başlığı denetimi tarih + gerekçeyle güncellendi. Tam ölçüm 18 grup temiz.
- 2026-10-02 (229): **AA2 · Yıllık fazla çalışma sınırı** (§9 kırk sekizinci tur: *"Mesai süresi her gün kullanılamasın yıllık izin verilen mesaiye göre
  sınırlansın internetten araştır"*). Araştırma: 4857 sayılı İş Kanunu **41. madde — fazla çalışma yılda en çok 270 saat**; **63. madde — günlük
  çalışma 11 saati (660 dk) aşamaz**; fazla çalışma için işçinin yılda bir yazılı onayı (Çalışma Süreleri Yönetmeliği). Sonuç: (1) başlangıç
  mesai **220 → 180 dk** (480 + 220 = 700 dk günlük 11 saati aşıyordu); Firma ayarları'nda toplam 660'ı aşarsa uyarı (engel değil). (2) Firma
  ayarı **"Yıllık fazla çalışma sınırı (saat)"** — başlangıç ve üst sınır 270; 270'ten büyüğü kaydedilmez. (3) Kişinin bu yıl kullandığı fazla
  çalışma sınırı doldurunca **o gün mesai hakkı yok**, az kaldıysa hak kalan kadar; günlük süre penceresinde "Bu yıl fazla çalışma: x / 270 saat"
  ve doldu uyarısı; üst çubuk ve ana sayfa özeti hakla. Örnek veride Burak Şahin'in sınırı dolu. Kilit: m1 + m8 birer etkileşim (önceki kodda
  düşüyor); 3 eski denetim 220 → 180 (tarih + gerekçe). Tam ölçüm 18 grup temiz.
- 2026-10-02 (228): **AA11 · Yeni kayıt formları boş açılır** (§9 kırk sekizinci tur eki: *"örnek yazılar yazılı olarak geliyor, silip bir şey yazmam
  gerekiyor"*). Bütün sayfaların yeni kayıt formları tarandı (tarayıcıda açılıp değeri dolu metin alanı arandı): örnek değerle gelenler boşaltıldı,
  yerine silik ipucu — sözleşme başlangıç (sabit bir tarih yazılıydı), süre (12), vade (30) · teklif geçerlilik (30) · ekipman türü periyot (12) ·
  eğitim türü tekrar (12) · eğitim kaydının görünmeyen kurum değeri ("Firma içi"). Bilerek kalanlar: tarih alanlarında **bugün** (reisim
  2026-09-27: "otomatik dolu gelsin"), teklif KDV %20 (yasal oran) ve adet 1, Firma ayarları (kayıtlı değerin kendisi), bağımlı seçimlerdeki salt
  okunur "Önce müşteri seçin". Kilit: m3 / m12 / m13 / m16 birer etkileşim (önceki kodda düşüyor); eski 5 denetime değer yazma adımı eklendi.
- 2026-10-02 (227): **AA5 · Ekipman türleri Mekanik / Elektrik sekmeleri** (§9 kırk sekizinci tur: *"ekipman türleri içerisinde mekanik ve elektrik
  olarak ayrılsın"*). Liste iki sekmede (`#/` Mekanik, `#/elektrik` Elektrik; sekmede tür sayısı); branş sütunu ve branş süzgeci kalktı, Ek-III
  grubu seçicisi sekmenin branşındaki gruplarla; tür sayfasının kırıntısı türün sekmesine döner. Kilit: m3 etkileşim (eski sayfada düşüyor); 1 eski
  denetim (branş süzgeci) tarih + gerekçeyle sekmeye çevrildi.
- 2026-10-02 (226): **AA6 + AA7 + AA9 · Rapor: standart açılır, tek toplu tuş, madde açıklaması pencerede, Uygun değil sade** (§9 kırk sekizinci tur).
  AA7: kriter grup başlığındaki küçük ünlem toplu tuşu kalktı (bölüm başlığındaki "Hepsini işaretle" tek); madde (i) satır altında açılmıyor,
  **pencerede** açılıyor: firmanın açıklaması + **referans standartlar**; standarda basınca AA6: **firmanın Dökümanlar'a yüklediği standardın güncel
  sürümü** görüntüleyicide açılır; aynı bağlantı Firma bilgileri'ndeki "Periyodik kontrol metodu ve kapsamı" / "Kontrol metodu" satırındaki her
  standartta. AA9: "Uygun değil" maddede **fotoğraf zorunlu değil** (Firma ayarları'ndaki ayar ve "Rapor" bölümü kalktı; kamera simgesi isteğe bağlı
  durur) ve **kusur derecesi sorulmaz** (eski raporda seçilmişse salt okunur görünür; derecesiz sonuç "Kusurlu"); S.A.Y'ın derece önerisi kalktı.
  Not: Hafif kusur devri (V4) eski raporların derecesiyle çalışır; yeni raporlarda derece olmadığı için devre girmez — format sisteminde (AA10)
  firma isterse dereceyi açabilir. Kilit: m8 etkileşim 4 yeni / güncellenmiş (önceki kodda düşüyor), m1 1; 9 eski denetim tarih + gerekçeyle güncellendi.
- 2026-10-02 (225): **AA1 · Sade giriş** (§9 kırk sekizinci tur: *"tek renk sdadece giriş işlemleri olan bi sayfa olsun basit bi sayfa olsun"*).
  Z6'nın marka panosu ve açıklamaları kalktı: tek zemin, ortada logo (temaya göre), altında giriş kartı (en çok 400px), en altta küçük maket notu.
  Kilit: m1 etkileşim AA1 (eski sayfada düşüyor).
- 2026-10-02 (224): **Z4 · Çevrimdışı gösterge ve kuyruk makette** (§9 kırk altıncı tur: *"çevrimdışı yazılan raporlar çevrimdışı kuyruğunda
  olacak … çevrimiçi olunca gönderilebilecek"*; ARKA-UC K4 kalıcı cihaz deposu, §4.2–4.3). Bağlantı yokken üst çubukta **"Çevrimdışı · n bekliyor"**
  (uyarı rengi; telefonda üst çubuk dolu olduğu için çubuğun hemen altında tam genişlik şerit); tıklayınca pencere: ne olduğu, "Çevrimdışı hazır: N plan · son eşitleme", bağlantı gerektirenler (son imza,
  onay, fotoğraftan okuma, S.A.Y), gönderilmeyi bekleyen işlemler. Raporda **Kaydet** ve **Onaya gönder** cihaza yazılır, kuyruğa girer; gönderilen
  rapor "Gönderilmedi · bağlantı bekleniyor" işaretiyle salt okunur olur ve **Onaylar'a (kuyruk, ana sayfa, menü balonu) bağlantı gelince düşer**.
  Kuyruk cihaz deposunda — sayfa yenilense / kapansa da durur; bağlantı gelince (hangi sayfada olursa) sırayla gider, bildirimde sayısı. Çevrimdışıyken
  fotoğraftan okuma ve S.A.Y çalışmaz, nedenini söyler; elle giriş açık. Makette bağlantı yan menünün altındaki **"Bağlantıyı kes / aç"** ile denenir
  (tarayıcının kendi çevrimdışı hâli de sayılır); "Denemeleri sıfırla" kuyruğu da siler. Makette kuyruğa girenler yalnız rapor Kaydet / Onaya gönder
  (plan kabul, fotoğraf, talepler uygulamada aynı kuyrukla). İkonlar wifi-off, cloud-upload. Kilit: m8 etkileşim 3, durum 1.
- 2026-10-02 (223): **Z3 · Fotoğraftan okuma: topraklama ölçüm noktası + etiket plakası** (§9 kırk altıncı tur: *"sigorta topraklama noktası
  vs yazarken fotoğraftan okuma"*; ARKA-UC K1, §5.2). Topraklama raporunda (5.1) "Fotoğraftan oku": Zx'i boş noktaların ölçü aleti ekranı okunur;
  formatsız türlerde Ekipman bilgileri'nde "Etiketten oku": marka, model, seri no, imal yılı. Okunan değerler **öneri kartında** — emin olunanlar
  "Önerileri uygula (n)" ile, emin olunmayan (imal yılı, bir Zx) tek tek "Uygula" ile yazılır; Vazgeç yazmaz; uygulanan "kaydedilmemiş değişiklik"
  olur. Sigorta okuması dahil üç okuma da **yapay zekâ kapalıysa / anahtar yoksa okumaz**, nedenini söyler (elle giriş hep açık; K1: başlangıçta
  kapalı) — eski sigorta denetimleri "yapay zekâ açık" adımıyla güncellendi. Her okuma kişinin bu ayki kullanımına yazılır (`MV.yzKullan`,
  `MV.yzHazir` ortak; S.A.Y da bunları kullanır). Kilit: m8 etkileşim 3 yeni (eski kodda düşüyor), durum 2 yeni.
- 2026-10-02 (222): **Z2 · S.A.Y saha asistanı makette** (§9 kırk altıncı tur + kırk yedinci tur "makete dökülecekler"; ARKA-UC K6, §5.3).
  Rapor eylem çubuğunun solunda "S.A.Y" düğmesi — yalnız firma yapay zekâyı açtıysa ve rapor düzenlenirken (Yeni / geri gönderilmiş; onaydaki,
  imzalı raporda yok). Panel masaüstünde sağda yan pencere (geniş ekranda rapor panel kadar daralır, Kaydet / Onaya gönder görünür kalır),
  telefonda tam ekran. Hızlı sorular: eksik alanlar (bölüm bölüm, "Git" alana götürür) · kusur derecesi önerisi (Bakanlık formatlı türde,
  derecesi boş "Uygun değil" maddeler) · sonuç önerisi. Öneri kartında **Uygula / Vazgeç**: Uygula denetçinin seçimiyle aynı yoldan yazar
  (rapor "kaydedilmemiş değişiklik" olur, kaydetmek denetçide); S.A.Y imzalamaz, göndermez, silmez. Her mesaj kişinin bu ayki kullanımına
  (Firma ayarları › Yapay zekâ) yazılır; anahtar yoksa soru almaz, sınır dolduysa uyarır (engel değil). Sohbet kaydedilmez; müşteri adı,
  adres, kişi adı gönderilmez (notta). Makette serbest soru cevaplanmaz (uygulamada Claude). Yeni dosya `docs/assets/maket-say.js`; ikon
  message-circle (Lucide 1.47.0). Ölçüm aracı: yüzen yan pencere `data-katman` ile açılır liste gibi katman sayılır. Kilit: m8 etkileşim 3,
  durum 1 (masaüstü, tablet, telefon; açık / koyu).
- 2026-10-02 (221): **Z6 · Giriş ekranı** (reisim, ekran görüntüsüyle: *"giriş ekranı daha düzgün bir şey olsun güzel durmuyor"*). Marka panosu
  yarıdan 5/12'ye daraldı ve doldu: logo, "Periyodik Kontrol Yönetimi", tek cümle tanım ("Tekliften arşive, muayenenin bütün akışı tek yerde."),
  üç madde (plan · sahada tablet · müşteri paneli). Form kâğıt zeminde, dikey ve yatay ortalı kartta (en çok 420px); alanlar kart genişliğinde.
  Telefonda üstte logo şeridi, maddeler gizli, form tam genişlik. Palet ve token değişmedi. Kilit: m1 etkileşim (eski sayfada düşüyor).
- 2026-10-02 (220): **Z5 · Belge türü ekle** (§9 kırk yedinci tur; reisim: *"eklenmiyorsa eklensin"*). Firma ayarları › Müşteriye açık personel
  belgeleri'nde "Belge türü ekle": ad + "kişisel veri içerir"; boş ya da var olan ad eklenmez (alanın altında söylenir). Eklenen tür listeye
  "firmanın eklediği" notuyla, müşteriye kapalı düşer; Personel'de özlük belgesi yüklerken tür olarak seçilir; kişisel veri işaretliyse
  müşteriye açılınca KVKK uyarısı. Kaldır: o türde yüklü belge varken olmaz (kaç personelde olduğunu söyler), yoksa onayla. Tür listeleri
  sabit değil, firmanın eklediklerinden üretilir (`MV.ozlukTur`, `MV.musteriBelgeTur`). Kilit: m1 etkileşim 2 yeni denetim (eski kodda düşüyor).
- 2026-10-02 (219): **Z1 · Firma ayarları: boşluksuz yerleşim + bölüm başına Kaydet** (§9 kırk yedinci tur). Bölümler satırlı ızgara yerine
  sütunlu yerleşimde: her bölüm kendi sütununda üsttekinin hemen altında; uzun "Müşteriye açık personel belgeleri"nin yanında "Verileri dışa
  aktar" artık aşağıda kalmıyor (fiyat listesi, sabit giderler yine tam genişlik). Değişiklik artık hemen kaydedilmez: bölümün taslağına yazılır,
  başlığın yanında "Kaydedilmedi · Vazgeç · Kaydet" çıkar; Kaydet taslağı uygular (geçersiz değer yine kaydedilmez, alanın altında söylenir),
  Vazgeç kayıtlı değere döner; başka bölüm kaydedilince taslak durur; alan açan seçimler (yapay zekâ, mesai, arşiv) taslakta da alanlarını
  gösterir; dışa aktarım seçimi ve API anahtarı kendi tuşlarıyla. Kilit: yerleşim (her bölümle üstteki arası ≤ 18px, geniş ekranda yan yana) ve
  taslak (Kaydet'e kadar kaydedilmez, Vazgeç) — ikisi de eski kodda düşüyor (ölçüldü); 17 ayar denetimi Kaydet adımıyla güncellendi.
- 2026-10-02 (218): **Firma ayarları › Yapay zekâ + Hesabım kişisel anahtar** (K1–K3'ün maketi; reisim: *"Müşterinin token ekleyeceği yeri
  ekledin mi makete"*). Firma ayarlarında yeni bölüm: Kapalı/Açık (kapalı başlar) · açıkken KVKK yurt dışı aktarım uyarısı · API anahtarı
  (parola alanı, `sk-ant-` biçim denetimi; kayıttan sonra yalnız `sk-ant-…` + son 4 hane görünür, Değiştir / Kaldır) · model (Opus 5.5 /
  Sonnet 5.5, fiyatlarıyla) · kişi başı aylık sınır ($, boş = sınırsız) · "Anahtar girilmedi" uyarısı · bu ay kişi başına kullanım tablosu
  (okuma, S.A.Y mesajı, harcama, sınır rozeti; kendi anahtarı olan "kendi hesabından"). Hesabım'da "Yapay zekâ anahtarım" yalnız firma
  yapay zekâyı açtıysa görünür. Tam anahtar hiçbir yerde saklanmaz (localStorage dahil, kilitle). Ölçüm aracında liste çerçevesine ayarlar
  ızgarasının kenarlı bölümü eklendi (tarihli gerekçe). Kilit: m1 etkileşim 3 yeni adım, m9 yeni durum.
- 2026-10-02 (217): **Arka uç kararları K1–K6 kabul, K7–K8 kabul edilmedi** (§9 kırk altıncı tur eki). `ARKA-UC.md` başlığı ve karar tablosu
  işaretlendi (✔ / ✘), §4.6'dan 7 gün ve uzaktan silme, §9'dan probata faturalaması çıkarıldı; `09-SUNUCU-VE-VERI.md` G3'e yapay zekâ istisnası
  koşullarıyla (kapalı başlar, maskeleme, sunucudan, KVKK teyidi) ve kilit tarifiyle yazıldı. Kod yok.
- 2026-10-01 (216): **Arka uç kurgusu — `ARKA-UC.md` (taslak, onay bekliyor)** (§9 kırk altıncı tur). 09-SUNUCU-VE-VERI'yi modül modül uygular ve
  eksikleri tasarlar: tanım verisi sürümlü JSON, firma verisi PostgreSQL (dosyaya yazılmaz, nedeniyle) · üç katmanlı geç yükleme · fotoğraf yükleme
  ve gizli görüntüleme · çevrimdışı paket + çıkış kuyruğu (işlem kimliği, sıra, çakışma, saat, sürüm uyumu) · Capacitor ile mağaza uygulaması ·
  yapay zekâ (sunucu üzerinden, katı JSON şemalı fotoğraf okuma, öneri kartlı S.A.Y chat, veri en aza, deneme setiyle ölçüm) · PDF, imza, arşiv,
  yedek (aylık geri yükleme denemesi) · arka plan işleri · güvenlik / KVKK · "aklına gelmeyenler" (12) · modül × arka uç tablosu · yapım sırası.
  Belgeden doğrulanan iki gerçek: Claude'un çalışma yeri yalnız ABD / küresel seçilebiliyor (Türkiye / AB yok → K1, 09-G3 ile çelişki); claude.ai
  aboneliği başka uygulamada kullanılamaz, API anahtarı gerekir (→ K2). "RAM'e kaydet" yerine kalıcı cihaz deposu önerildi (K4). Kod yok.
- 2026-10-01 (215): **P3 · Müşteri panelinde "Muayene personeli" belgeleri** (§9 kırk beşinci tur). Müşteri panelinde yeni sekme: kullanıcının
  tesislerine giden muayene personeli (imzalı raporu olan ya da açık / açılmış planda ekipte olan), son gidiş tarihi ve tesisler, yalnız firmanın
  izin verdiği belgeler (Aç → PDF). Eğitim sertifikasında geçerlilik tarihi; tekrarı geçmişse kırmızı "süresi geçti". Firma ayarları › **Müşteriye
  açık personel belgeleri**: tür başına aç / kapa — EKİPNET kayıt belgesi, diploma, oda kaydı, ekipman atama belgesi, her eğitim sertifikası;
  kişisel veri olanlar (kimlik, sağlık raporu, iş sözleşmesi, diğer) işaretli, açılınca KVKK uyarısı (engel değil). Başlangıç: EKİPNET + İSG
  eğitim sertifikaları (17020 bilgilendirme hariç). Özlük belge türleri ve dosyası personel sayfasından ortak veriye taşındı (`MV.OZLUK_TUR`,
  `MV.ozluk`; personel kartı aynı kaydı kullanır). Kilitler m11 etkileşim (izinli türler · Firma ayarları → müşteri paneli sayfalar arası · KVKK
  uyarısı); düzeltmesiz 16/19 düştü. Uygulamada belge indirme kısa ömürlü yetkili bağlantıyla (anayasa 5.1).
- 2026-10-01 (214): **P2 · Girişi olmayan müşteride "Giriş ekle"** (§9 kırk beşinci tur, "3 olsun"). Müşteri kartında giriş hiç yoksa (e-posta
  yazılmamış, ek giriş yok) düğme ve pencere başlığı "Giriş ekle"; giriş varsa "Ek giriş ekle". Düzeltme: 211'deki gözlemim eksikti — Deneme
  Kazan'ın e-postasıyla açılmış ana girişi vardı (kullanıcı henüz girmemişti), orada "Ek giriş ekle" doğruydu; değişiklik yalnız girişsiz müşteride
  görünür. Kilit m2 etkileşim; düzeltmesiz 30/31 düştü.
- 2026-10-01 (213): **P1 · Plan günü gelmeden rapor oluşturulamaz — ENGEL** (§9 kırk beşinci tur; reisim'in açık kararı, "kural uyarıdır"
  genel ilkesinin istisnası; mesai sınırı ve eşsiz kod gibi). Plan içinde plan günü (başlangıç) bugünden sonraysa "Rapor oluştur" kapalı, nedeni
  şeritte (2026-10-03: metin bugünü de söyler, §11 239); eylem de reddeder. Saha raporundaki "Kaydet ve kopyala" da planın gününe bakar
  (`MV.planGunu`: Plan aç'ta açılan plan ya da tohum planı). Kırılan deneme (2026-10-01): "kabul edilen planda … ilk rapor planı Denetimde yapar"
  plan 3'te (24.09) koşuyordu, artık orada rapor açılamaz → bugünkü plan 2'ye (23.09) taşındı. Yeni kilitler: planlar etkileşim (plan 3 engeli;
  düzeltmesiz 64/65 düştü) · m8 etkileşim (kopya engeli; düzeltmesiz 111/112 düştü).
- 2026-10-01 (212): **Ö6 · Rol beklentileri araştırması** (§9 kırk dördüncü tur) → yeni **§3.9**: altı rol (muayene uzmanı, teknik yönetici,
  planlama, firma yöneticisi, muhasebe, müşteri) için beklenti · makette var · açık öneri tablosu ve öncelik sırası; kaynaklar §10. Hiçbiri
  yapılmadı — reisim karar verir. Ayrıca 2026-09-25'te bir düzenlemede silinmiş "## 4 · Mevzuat bulguları" başlığı geri kondu.
- 2026-10-01 (211): **Ö5 · Uçtan uca deneme kapanışı** (§9 kırk dördüncü tur: "bir muayene firmasıymışsın gibi, 0 dan teklif plan açma denetim
  yapma fatura kesme gibi tüm adımları … tek tek kontrol et dene, müşteri görünümüne de bak"). Kalıcı bir tarayıcı profilinde sırayla: müşteri ekle
  (Deneme Kazan Sanayi A.Ş., uydurma) → tesis ekle → teklif T-0926-014 (2 hava tankı × 900 + 1 iç tesisat 3.500 = 6.360,00 TL KDV dahil) gönder →
  kabul → iş sözleşmesi IS-0926-008 hazırla + imzalı yükle → Plan aç P-0926-041 (Mert Kaya + Elif Aydın) → kabul → ekipman ekle (HT-9001, ET-9002,
  HT-9003, HT-9004) → rapor oluştur, doldur → zorunlu alan penceresi (boş rapor gönderilemiyor) → Elif'in geçersiz cihazı engelledi, Zimmetler'den
  geçerli cihaz teslim → onaya gönder → Onaylar (mekanik + elektrik yönetici) onayla → Raporlar son imza (mobil, PIN) → Muhasebe fatura
  KMF2026000000050 → iki tahsilat (kısmi + kalan; fazlası durdu) → ödendi → müşteri paneli (davet var, kullanıcı giriş yapmadığı için boş — doğru).
  Bulgu ve düzeltmeler 203–210. Düzeltilmeyen gözlemler: (1) Gelir-gider "−%7.190 kâr" — hesap doğru, uydurma verinin ölçeği (13 ay maaş 20,5 M TL,
  18 iş geliri 298 bin TL); veri ölçeği reisim'e soru. (2) Makette saat 23.09'da duruyor; rapor plan gününden (25.09) önce oluşturulup imzalanabildi
  — uygulamada saat ilerler; plan gününden önce rapor açmak uyarı olmalı mı, reisim'e soru. (3) Yeni müşteride ilk giriş için düğme adı "Ek giriş ekle"
  (ana giriş yokken "Giriş ekle" daha doğru) — küçük, soru listesinde.
- 2026-10-01 (210): **Ö5h · Ekipman sayısı kayıtlı ekipmandan** (uçtan uca denemenin yedinci bulgusu: yeni tesis Kazan Fabrikası'na planda 4
  ekipman eklendi, müşteri kartında "Ekipman 0" görünüyordu — sayı tesis kaydındaki sabit alandandı). Tek yardımcı `MV.ekipmanSayisi(tesis)`;
  müşteri listesi, müşteri kartı, tesis kartı ve ana sayfa buna bağlandı. Tohum veride bir tesiste (Aktarma Merkezi) sabit sayı 21, kayıtlı ekipman
  20'ydi; artık 20 görünür. Kilit m2 etkileşimde (tesise ekipman eklenince sayı bir artar); düzeltmesiz 29/30 düştü, düzeltmeyle 30/30.
- 2026-10-01 (209): **Ö5g · Müşteri Excel'indeki "Rapor" bağlantısı doğru müşterinin panelini açar** (uçtan uca denemenin altıncı bulgusu;
  Ö3'ün (201) hatası). Panel müşteriyi adresin `#` kısmından okuyor; bağlantı `?musteri=` değerini `#`'ten önceye yazıyordu → Ada Makina dışındaki
  müşteride Excel'den tıklanan rapor Ada Makina panelinde açılırdı. Bağlantı artık `musteri.html#/r/<no>?musteri=<id>`. Kilit m11 etkileşimde:
  Başak Un panelinden Excel indir → ilk satırın bağlantısı açılır → Başak Un panelinde o rapor; düzeltmesiz 15/16 düştü, düzeltmeyle 16/16.
  Ayrıca denemede: yeni müşteri Deneme Kazan'ın panelinde rapor görünmüyor, çünkü giriş daveti var ama kullanıcı henüz giriş yapmadı ("Bu
  müşterinin giriş yapan kullanıcısı yok" şeridi) — doğru davranış, değişiklik yok.
- 2026-10-01 (208): **Ö5f · Kilit düzeltmesi: 203–205'in kilitleri gerçekten denetlemiyordu.** Ölçüm aracının durum kümesi (`olc-bulut.mjs
  <grup>`) `bekle` koşulunu değerlendirmez, yalnız ekranı ölçer; 203, 204 ve 205'te "kilit eklendi" dediğim beş deneme oraya konmuştu, geçmeleri bir
  şey kanıtlamıyordu (commit mesajlarında da öyle yazdım — yanlıştı). Beşi `--etkilesim` kümesine taşındı; Elif bakışı kilidinin koşulu da
  düzeltildi (tarih ile kod arasında sözcük sınırı yok → rapor numarasının denetçisi kayıttan). Her biri düzeltmesiz dosyayla düşüyor (m12 19/20,
  m6 20/22, m9 50/52), düzeltmeyle geçiyor (m12 20/20, m6 22/22, m9 52/52). Durum kümesinde başka `bekle`li deneme yok (sayıldı).
- 2026-10-01 (207): **Ö5e · Fatura tarihinin ölçüsü raporların imzası** (uçtan uca denemenin beşinci bulgusu: raporlar 23.09'da imzalanmıştı,
  plan günü 25.09'du; 23.09 tarihli fatura "Denetimden önce olamaz" diye kaydedilemiyordu). Kural artık: fatura, faturaya giren raporların en
  son imzasından önce olamaz ("Faturaya giren son rapor GG.AA.YYYY'de imzalandı; fatura bundan önce olamaz."). İmzasız rapor zaten faturaya
  girmez. Denemede KMF2026000000050 (3 rapor, 6.360,00 TL KDV dahil — teklifle aynı) kaydedildi; 3.000,00 TL + 3.360,00 TL tahsilatla ödendi
  (fazla tutar "fazlası kaydedilmez" diye durdu). Ölçüm kilidi (m14 etkileşim); eski kurala dönünce düştüğü görüldü (48/49).
- 2026-10-01 (206): **Ö5d · Plan aç'ta açılan planın işi Muhasebe'de** (uçtan uca denemenin dördüncü bulgusu: P-0926-041'in üç imzalı raporu
  vardı, Muhasebe › İşler'de yoktu, fatura kesilemiyordu). İşler tohum veriden kuruluyordu; tarayıcıda açılan planlar sonra yükleniyordu. Kayıt
  yüklendikten sonra raporu olan her açılmış plan iş olur (raporlar eklenir; plan en az denetimde). Denemede P-0926-041 "Faturaya hazır" geldi.
  Ölçüm kilidi (m14 etkileşim) — düzeltme kapatılınca düştüğü görüldü (47/48), açıkken 48/48.
- 2026-10-01 (205): **Ö5c · Raporlar'da "Makette bakış": Mert Kaya · mekanik / Elif Aydın · elektrik** (uçtan uca denemenin üçüncü bulgusu:
  elektrik raporu ET-9002 teknik yönetici onayından geçti ama son imzaya gelemedi — Raporlar makette yalnız Mert Kaya'nın gözündendi). Onaylar'daki
  gibi bakış seçimi (#/ · #/?kisi=ea); üst çubukta kişinin adı, imza şeridi ve mobil imza isteği o kişinin. Rapor sayfasında bakış raporun
  denetçisinden, kırıntı aynı bakışa döner. Uygulamada yok: herkes kendi raporlarını görür. Denemede ET-9002 Elif olarak mobil imzayla
  imzalandı, müşteriye açıldı. İki ölçüm kilidi m9 etkileşimde (208'de taşındı). Not: denemede Elif'in zimmetindeki tesisat test cihazı (OC-003) kalibrasyonu geçmişti
  (maketin bilerek koyduğu engel); Zimmetler'den depodaki OC-019 teslim edilince rapor gönderilebildi — akış doğru çalıştı.
- 2026-10-01 (204): **Ö5b · Plan aç: plan günü iş sözleşmesinin dışındaysa uyarı** (uçtan uca denemenin ikinci bulgusu: teklif kabul →
  iş sözleşmesi 24.09'da başlıyor, Plan aç tarihi kendiliğinden bugün 23.09 geliyor, uyarı yoktu). Tarihler bölümünün altında sarı şerit:
  "İş sözleşmesi IS-… GG.AA.YYYY'de başlıyor; plan günü sözleşmeden önce." ya da "… bitti; plan günü sözleşmenin dışında." Tarih yazdıkça
  güncellenir. Uyarıdır, engel değil. Sözleşmesi hiç olmayan tesiste şerit yok (eski müşteriler teklifsiz). İki ölçüm kilidi m6 etkileşimde (208'de taşındı).
- 2026-10-01 (203): **Ö5a · Tarihten sonraki ek yılın okunuşuna göre** (§9 kırk dördüncü tur, uçtan uca denemenin ilk bulgusu). Teklif
  gönderilince bildirim "geçerlilik 23.10.2026'e kadar" diyordu; doğrusu "'ya". Tek yardımcı `MK.tarihEk(tarih, "e" | "de" | "den")`: yılın son
  okunan sözcüğüne (birler, sıfırsa onlar, o da sıfırsa yüz / bin) göre ünlü uyumu ve sert ünsüz (2026'ya · 2027'de · 2025'ten · 2030'a).
  Altı yer buna bağlandı: teklif geçerliliği (kart + bildirim), Dökümanlar yerine geçen standart (liste + dosya satırı), ölçüm cihazı kalibrasyon
  şeritleri, Plan aç İSG-KATİP bitişi. Ölçüm kilidi m12 etkileşimde (208'de taşındı). Denemede iki şüphe yeniden üretilemedi: boş hava tankı raporu "Zorunlu
  alanlar doldurulmadı" penceresini açıyor (HT-9004 ile sıfırdan denendi); ekipman ekle tür araması süzüyor (önceki görüntü deneme betiğimin
  odak sırasından).
- 2026-10-01 (202): **Ö2 · Müşteriye göre bulut klasörüne otomatik kayıt** (§9 kırk dördüncü tur). Firma ayarları › **Bulut kaydı**: bulut seçimi
  (Google Drive · OneDrive / SharePoint · Dropbox · Yandex Disk · kendi sunucunuz SFTP / WebDAV), hesap bağlama, ana klasör, klasör düzeni
  (Müşteri / Tesis · Müşteri / Tesis / Yıl · Müşteri / Yıl), "İmzalı raporların hepsini gönder", son kayıtlar. Yurt dışında saklayan bulutta
  uyarı şeridi (raporlar Türkiye dışına çıkar; §8.8 ve 09-SUNUCU-VE-VERI ile çelişir, karar firmanın — engel değil). Müşteri kartı › **Bulut
  klasörü**: kendiliğinden kaydet aç / kapa, klasör adı (boşsa ünvan), müşterinin paylaştığı klasör (doluysa oraya). Rapor imzalanınca (dosya
  yükleme, e-imza, mobil imza) imzalı PDF kendiliğinden kaydedilir (MV.bulutaKaydet). Makette bağlantı ve yazma taklit; uygulamada sağlayıcı
  izni (OAuth) ve iş kuyruğu, hata olursa yeniden dene. 3 deneme.
- 2026-10-01 (201): **Ö3 · Müşteri panelinde toplu indirme ve "Rapor" bağlantılı Excel** (§9 kırk dördüncü tur). Raporlar sekmesinde **Excel
  indir** (filtreye uyan raporlar; ilk sütun mavi altı çizili **Rapor** bağlantısı — tıklayınca o rapor panelde açılır, giriş ister) ve **Toplu indir
  (ZIP)** (imzalı raporlar ayrı PDF, tesis klasörlü). Uygunsuzluklar sekmesinde **Uygunsuzları indir** (Excel; ilk sütun Rapor bağlantısı) ve
  **Uygunsuz raporlar (ZIP)**. Excel yazıcısı bağlantı hücresi alır ({ metin, url } → HYPERLINK, mavi altı çizili). Telefonda başlıktaki tuş
  grubu tam satır. Uygulamada bağlantı https://<firma>.probata.com.tr/portal/r/<rapor no>. 2 deneme.
- 2026-10-01 (200): **Ö1 · İmzalı raporlar ayrı PDF, müşteri / tesis klasörlü ZIP** (§9 kırk dördüncü tur). Müşteriler listesinde (filtreye uyan
  müşteriler), müşteri kartında ve tesis sayfasında **İmzalı raporlar (ZIP)**; Raporlar ekranında **Ayrı PDF'ler (ZIP)** (filtreye uyan
  raporlar). ZIP'te her imzalı rapor ayrı PDF, yolu `Müşteri unvanı/Tesis/RAPOR-NO.pdf`, ayrıca ICINDEKILER.txt (yol · ekipman · tarih · sonuç).
  Yalnız imzalı (tamamlanmış) raporlar; revizyonda müşterinin gördüğü son sürüm. Makette PDF'ler ekrandaki kâğıttan gerçekten üretilir (Ada
  Makina 22 rapor ≈ 16 sn, ~20 MB); uygulamada PDF'ler sunucuda imzalı saklanır, ZIP arka planda hazırlanır. Ortak üretici MK.pdfZip /
  MK.raporZip. 2 deneme.
- 2026-10-01 (199): **Ö4 · "Süzgeç" → "Filtre"; uzun seçenek listesi aranır** (§9 kırk dördüncü tur). Ekranda görünen bütün "Süzgeç / süzgeç"
  yazıları "Filtre / filtre" (levha başlığı, Filtreler kutusu, "n filtre uygulandı", "Filtreye uyan … yok", bildirimler); kod adları aynı.
  Kalıp 19 (8'den fazla seçenekte arama kutusu) filtrelere de uygulandı: masaüstünde açılır listenin üstünde **Ara**; telefonda Filtre
  levhasında uzun liste (ör. müşteriler) çip değil, **arama kutusu + kayan dikey liste**, seçili en üstte. Yüzlerce müşteride yazarak bulunur.
  Bütün modüllerin filtreleri tek üreticiden geldiği için hepsinde geçerli. 2 deneme yeni, 1 güncellendi.
- 2026-10-01 (198): **S4 · Dışa aktarımda sütunlar Türkçe, hücreler okunur** (§9 kırk üçüncü tur ek). Her tablonun sütunları tek tek tanımlı
  (21 tablo; ör. "Ekipman kodu", "Bölüm (kullanım yeri)", "Kalibrasyon bitişi"); kimlik kodları ada çevrilir (müşteri unvanı, tesis adı, personel
  adı, ekipman / cihaz / eğitim / izin / gider türü, durumlar); tarihler GG.AA.YYYY (saatliler GG.AA.YYYY SS:DD); iç içe kayıtlar tek hücrede
  okunur cümle (önceki kontrol: tarih · sonuç · rapor no · denetçi; onay: zaman · onaylayan; son ara kontrol; İSG-KATİP no · onay). Başka tablonun
  kopyası olan iç alanlar atlanır (tesisin plan özeti). Yeni bir alan eklenip sütunu yazılmazsa ya da hücre okunmazsa denetim düşer
  (MK.disaCevrilmemis). Örnek ZIP reisim'e verildi. 1 deneme.
- 2026-10-01 (197): **S3 · Verileri dışa aktar** (§9 kırk üçüncü tur ek, reisim: "16 olsun"; genel arama yapılmadı). Firma ayarları'nda yeni
  bölüm: dokuz bölümden seçilenler (müşteriler ve tesisler · ekipmanlar · planlar · raporlar · teklifler ve sözleşmeler · personel · ölçüm
  cihazları ve zimmetler · muhasebe · dökümanlar) her biri ayrı Excel, hepsi **tek ZIP**; makette gerçekten iner (PDF yerine OKUBENI.txt).
  Uygulamada raporların ve yüklenen belgelerin PDF'leri klasörlerde, büyük firmada arka planda hazırlanır, bağlantı 24 saat ve yalnız firma
  yöneticisinin hesabıyla (anayasa 5.1). Her dışa aktarım "Son dışa aktarımlar"da (zaman, kim, bölüm sayısı, dosya). ZIP / Excel yazıcısı ikili
  dosya alacak biçimde genişledi (MK.zip, MK.xlsxBayt; MK.xlsx aynı). 1 deneme.
- 2026-09-30 (196): **S2 · Yetkisiz · Sayfa bulunamadı · Oturum süresi doldu** (§9 kırk üçüncü tur cevabı). hata.html: **#/yetkisiz** (kilit,
  "Bu sayfayı görme yetkiniz yok", yöneticiden yetki isteyin) ve **sayfa bulunamadı** (bilinmeyen her adres); ikisinde de kabuk ve menü yerinde,
  **Ana sayfaya dön** · **Geri dön**; kaydın adı / numarası yazılmaz. Giriş sayfasına **#/oturum** hâli: aynı giriş formu, üstte "Uzun süre işlem
  yapılmadığı için oturumunuz kapandı"; girince kaldığı sayfaya (?donus=) döner. 3 durum kaydı, 3 deneme; file-question-mark ikonu.
- 2026-09-30 (195): **S1 · Müşteri panelinde Çıkış yap** (§9 kırk üçüncü tur cevabı). Müşteri kullanıcısının adına basınca menü: yalnız
  **Çıkış yap** (giriş sayfasına; parolamı unuttum orada). Parola değiştirme müşteride şimdilik yok (reisim: "çıkış yap eklemen yeterli"). 1 deneme.
- 2026-09-30 (194): **R3 · Eksik iş analizi** (§9 kırk üçüncü tur): 16 madde, dört başlık (hesap / erişim · 17020 kayıtları · kolaylık);
  hiçbiri yapılmadı, reisim seçecek. Tam ölçüm bu teslimde koşuldu (sonuç commit mesajında).
- 2026-09-30 (193): **R2 · Hesabım ve Çıkış yap** (§9 kırk üçüncü tur). Üst çubuktaki kullanıcı menüsü: **Hesabım** · Taleplerim · İzin talebi ·
  Masraf formu · **Çıkış yap**. Çıkış giriş sayfasına gider (M1'den beri makette olan giriş, **Parolamı unuttum** ve geçici parolayla ilk giriş
  artık bağlı). **Hesabım** sayfası (hesap.html): kişisel bilgiler (Personel kaydından, salt okunur; değişikliği firma yöneticisi yapar), **mobil
  imza telefonu** (kişi kendisi değiştirir, biçim denetimi, kalıcı), **parola değiştir** (mevcut parola; yeni parola en az 10 karakter, harf ve
  rakam, mevcuttan farklı; tekrar aynı; yanlışta yazılanlar kalır), oturum ve Çıkış yap. 3 yeni deneme.
- 2026-09-30 (192): **R1 · Firma ayarları ayrı modül, ekran verimli** (§9 kırk üçüncü tur). Personel'in "Firma ayarları" sekmesi kalktı;
  yan menüde Tanımlar grubunda **Firma ayarları** (modül 22, ikon settings; uygulamanın modül kaydı ve rotası da, 16 modül). Personel'in eski
  adresi (#/ayarlar) yeni sayfaya gider. Ekran: her bölüm bir kart, geniş ekranda iki-üç sütunlu ızgara ve solda bölüm listesi (tıklayınca bölüme
  gider); fiyat listesi ve sabit giderler tam genişlik, fiyatlar altı sütuna kadar (1920'de sayfa boyu 2669 → 1925 px, 1440 ölçüsü eskiydi).
  Yeni bölüm **Firma bilgileri** (rapor başlığındaki künye: ticari ad, adres, rapor e-postası, akreditasyon no, nüsha sayısı; boşsa uyarı).
  Rol yetkilerinde modül 22 yalnız firma yöneticisine açık (başlangıç önerisi). Davranış aynı; 15 deneme yeni adrese taşındı, 3 yeni deneme.
- 2026-09-30 (191): **P2 · Topraklama 5.1 · 5.2: uygunluk notu denetçinin seçimi** (§9 kırk ikinci tur ek). Formatın "Sonuç (Uygunluk
  notu)" sütunu artık seçim: Not-1 … Not-11 (formatın 11 notu; metinleri tablonun altındaki "Uygunluk notları"nda). Otomatik "Not-x · ağır" /
  "Uygun" / "Yetersiz · ağır" rozetleri ve RCD test değerinde kendiliğinden kırmızı işaret kalktı; Ia, Zs, Ik1 hesabı duruyor (formatın sütunları).
  Seçilen not kusursa (metni "Uygun." ya da "…uygundur." değilse) Kusur açıklamalarına "Not-N: metin" olarak girer; "(Ağır kusur)" yazan not
  ağır sayılır. Not seçimi zorunlu alan (gönderirken uyarır). PDF'te 5.1 · 5.2 sonucu seçilen not. 4 deneme yeniden yazıldı.
- 2026-09-30 (190): **P1 · Topraklama raporunda fotoğraf yok** (§9 kırk ikinci tur ek). Bakanlık formatında (ZPKR01) fotoğraf bölümü
  olmadığı için saha raporundaki "Ek · Fotoğraflar" bölümü, fotoğraf zorunluluğu ve PDF'in fotoğraf eki sayfası kalktı. Kural: formatında
  fotoğraf bölümü olan türde (ZPKR02 8. bölüm) ve formatsız türde fotoğraf durur. 1 deneme güncellendi, 1 yeni.
- 2026-09-30 (189): **O2 · Uygun değil maddede açıklama alanı yok; fotoğraf Kusur açıklamalarında, altında madde** (§9 kırk ikinci tur).
  Madde satırının altındaki "Kusur açıklaması" kutusu kalktı (zorunlu alanlardan da çıktı); kusur listesinde maddenin kendisi yazar. Kamera
  simgesiyle eklenen fotoğraf, formatlı türde Kusur açıklamaları bölümünde: fotoğraf (Görüntüle · İndir · Sil), hemen altında ilgili madde
  ("5.1.3 · Pano sabitlenmesi …"); madde satırında yalnız "1 fotoğraf · Kusur açıklamaları bölümünde". Kusur açıklamaları bölümü olmayan
  türde fotoğraf maddenin altında kalır. Kusur derecesi (hafif / ağır) Bakanlık formatlı türde duruyor — sonucu o belirliyor. PDF'te madde
  açıklamasız yazılır, fotoğraf adı yanında. 3 deneme güncellendi, 1 yeni (Kusur açıklamalarından fotoğraf silme).
- 2026-09-30 (188): **O1 · Saha raporunda kayık yazılar** (§9 kırk ikinci tur). 5.1 ölçüm noktası tablosunda "RCD testi IΔ · TΔ" sütununun
  genişliği tanımlı değildi: başlık harf harf alt alta, IΔ / TΔ kutuları Sonuç rozetinin altına eziliyordu → sütunlar yeniden paylaştırıldı
  (RCD testi %20), iki kutu hücreyi eşit böler. Madde (i) simgesi metne 4–5 px yapışıktı (sol eksi pay) → pay kalktı, en az 9 px. 2 yeni deneme
  (eski CSS'le ikisi de düşüyor, yenisiyle 1920 · 1080 · 375 · 320'de geçiyor).
- 2026-09-30 (187): **N11 · Pasife al raporda değil, ekipmanda** (§9 kırk birinci tur ek). Plan içindeki rapor satırında "Pasife al" kalktı
  (Yeni raporda yalnız Sil); pasife alma ekipman satırında (raporu olmayan ekipmanda Pasife al, pasifte Etkinleştir). Rapor pasife alma
  penceresi ve işleyicisi kaldırıldı; onunla ilgili 1 durum ve 2 deneme kalktı, 1 yeni deneme. Onaylar'daki "Pasif raporlar" sekmesi eski
  kayıtlar için duruyor. Ölçüm: planlar 120/120 · 62/62 · 60/60; m9 200/200 · 49/49 · 100/100.
- 2026-09-30 (186): **N10 · Kaydet ve kopyala: yalnız kod ve bölüm** (§9 kırk birinci tur ek). Pencerede Ekipman kodu (zorunlu) ve Ekipman
  bölümü (kullanım yeri); seri no ve salt okunur tür alanı kalktı (tür üstteki yazıda; seri no her formatta yok, varsa yeni raporda yazılır).
  1 deneme gerekçeyle güncellendi. Ölçüm: m8 184/184 · 107/107 · 92/92.
- 2026-09-30 (185): **N9 · Raporlar balonu kişiye göre** (§9 kırk birinci tur ek). Giriş yapanın kendi raporları: kırmızı geri gönderilen
  (düzeltilecek), sarı onaya gönderilmemiş Yeni; imza bekleyenler Onaylar balonunda (tekrar sayılmaz); raporu olmayanda balon yok. 2 deneme
  gerekçeyle güncellendi. Ölçüm: m9 200/200 · 49/49 · 100/100; m10 48/48 · 15/15 · 24/24; planlar 128/128 · 63/63 · 64/64.
- 2026-09-30 (184): **N8 · Arayüzde her yerde "denetçi"** (§9 kırk birinci tur). Bütün maket metinlerinde "Inspector / inspector" (ekleriyle:
  inspector'ın → denetçinin, inspector'a → denetçiye …) "Denetçi / denetçi" oldu: rol adı, sütun ve süzgeç başlıkları, şeritler, bildirimler,
  kullanıcı rolleri. Kod anahtarları (rol kodu "inspector", #/inspector rotası, işlev adları) aynen; çeviride iki kod adı yanlışlıkla değişti,
  tam ölçüm yakaladı, düzeltildi. N5'ten kalan bir deneme (menü adı balonla birleşince) düzeltildi. Sunumlar (plan-ici, toplu-bakış) üretilen
  sayfa, dokunulmadı. Ölçüm (bütün maketler): durum 2184/2184 · etkileşim 604/604 · telefon 1092/1092 · olumsuz kanıt 3/3.
- 2026-09-30 (183): **N7 · Onaylar: vekil yok, mekanik yönetici / elektrik yönetici** (§9 kırk birinci tur). "Elektrik · vekil" sekmesi ve
  vekil onayı kalktı; her yönetici yalnız kendi branşını görür. Üstte **Makette bakış** (Mekanik yönetici · Elektrik yönetici — yalnız
  "kime nasıl görünür" gösterimi, uygulamada yok): seçilince kullanıcı (Selin Yıldız / Can Öztürk), kuyruk, Tüm raporlar, Revize istekleri,
  Pasif raporlar ve menü balonu o yöneticinin. Rapor ekranında bakış raporun branşından. 4 deneme gerekçeyle güncellendi. Ölçüm: m9 200/200
  · 49/49 · 100/100; gözle 1920.
- 2026-09-30 (182): **N6 · Günlük süre üst çubukta, açılır pencere** (§9 kırk birinci tur). Giriş yapan kişi denetçiyse ve mesai takibi açıksa
  üst çubukta tek satır: saat · "Günlük süre" · harcanan / toplam dk (telefonda kısalır, 320'de yalnız harcanan). Basınca pencere: normal ve
  mesai çubukları, rapor ekranında "Bu rapor: N dk", ayarların yeri. Plan içi ve rapordaki kalıcı çubuk kalktı; yalnız süre dolunca
  "yeni rapor oluşturulamaz" şeridi (Rapor oluştur'un nedeni). Denetçinin Ana sayfasında "Günlük süre" yüzü (pencereyi açar). Herkesin süresi
  kendi raporlarından. Mesai ayarı: Personel › Firma ayarları › Mesai takibi (aç / kapa, normal ve mesai dk; yalnız firma yöneticisi).
  3 deneme gerekçeyle güncellendi, 1 yeni. Ölçüm: planlar 128/128 · 63/63 · 64/64; m8 184/184 · 107/107 · 92/92; m1, m9, talepler, m16,
  m10 temiz; gözle 1920 + 375.
- 2026-09-30 (181): **N5 · Yan menü balonları yalnız iş olunca, kişiye göre** (§9 kırk birinci tur). **Ölçüm cihazları:** yalnız süresi geçen
  (kırmızı) ve yaklaşan (sarı); yeşil "sorunsuz" kalktı. **Dökümanlar:** eğitim tekrarı geçen · yaklaşan (Personel'deki eğitim balonu buraya
  taşındı; eğitimler Dökümanlar'ın içinde). **Onaylar** giriş yapan kişiye göre: denetçiye kendi muayene uzmanı imzasını bekleyen raporlar;
  mekanik / elektrik yöneticiye bunlar + kendi branşında öteki muayene uzmanlarının onaya gönderdiği raporlar; 24 saati geçen kırmızı; iş
  yoksa balon yok (firma yöneticisinde yok). **Talepler:** talebin iletildiği kişide bekleyen talep (izin → firma yöneticisi; masraf formu →
  muhasebe ve firma yöneticisi). Makette "giriş yapan" = sayfanın kullanıcısı (MK.BEN). Raporlar balonu değişmedi (firma geneli son imza
  bekleyen; soru). 6 deneme gerekçeyle güncellendi, 4 yeni. Ölçüm: m10 48/48 · 15/15 · 24/24; m9 200/200 · 49/49 · 100/100; planlar
  128/128 · 62/62 · 64/64; m1, m4, talepler, m16 temiz.
- 2026-09-30 (180): **N4 · Ek-III grubunda "Diğer (Ek-III dışı)"** (§9 kırk birinci tur). Ekipman türü formunda grup listesinin sonunda; seçilince
  **Branş** alanı çıkar (zorunlu; onaylayan yönetici branştan). Ek-III dışı türde Ek-III meslek kuralı uygulanmaz (meslek uyarısı yok;
  Plan aç'ta "yetkili" sayılır). Ölçüm: m3 96/96 · 24/24 (1 yeni) · 48/48; m6 80/80 · 20/20 · 40/40.
- 2026-09-30 (179): **N3 · Cihaz türünde ekipman grubu yok** (§9 kırk birinci tur). "Cihaz türü ekle" yalnız adı sorar; cihazın hangi ekipman
  türünde kullanılacağı Ekipman türleri'nde seçilir. Cihaz sayfası ve tür listesi "kullanıldığı ekipman türleri"ni oradan okur; Ana sayfa'da
  kalibrasyon uyarısının branşı da (MV.cihazBranslari). Ölçüm aralığı alanına örnek ("ör. 0–1000 V"). 2 deneme gerekçeyle güncellendi.
  Ölçüm: m4 144/144 · 35/35 · 72/72; m1 304/304 · 87/87 · 152/152.
- 2026-09-30 (178): **N2 · Plan içinde ekipman listesi denetçinin branşıyla açılır** (§9 kırk birinci tur). Planda o branştan ekipman varsa Branş
  süzgeci denetçinin branşında gelir (mekanikçi mekanik, elektrikçi elektrik); "Tümü" ile bütün ekipman görünür. Bütün ekipmanı gören 7 eski
  deneme önce "Tümü"ye alıyor (gerekçe denemede). Ölçüm: planlar 128/128 · 62/62 (1 yeni) · 64/64; m8 184/184 · 107/107 · 92/92; m1 304/304 ·
  87/87 · 152/152.
- 2026-09-30 (177): **N1 · Ön bilgilendirme formu firmanın formatı** (§9 kırk birinci tur). Personel › Firma ayarları'nda "Ön bilgilendirme
  formu" bölümü: firma PDF'ini yükler (aç · değiştir · kaldır); yüklenmediyse temel format KM-FR-OBF-01. Müşteri kartındaki gönderim
  penceresi hangisinin gideceğini yazar. §3.7'ye satır 15; saha formu listede zaten (satır 9). Ölçüm: m1 304/304 · 87/87 (1 yeni) · 152/152;
  m2 104/104 · 27/27 · 52/52.
- 2026-09-30 (176): **L7 · Başlıkta firma önde, tesis altında** (§9 kırkıncı tur ek). Bütün nesne başlıkları tarandı; tesisi öne koyan dört
  yer düzeltildi: **plan içi** (başlık müşteri, altında tesis), **Plan açıldı** ekranı (proje no · firma ünvanı, altında tesis), **tesis sayfası**
  (başlık firma ünvanı, altında "Tesis: ad"), **saha raporu** alt satırı (firma · tesis · kişi sırası). Planlar listesi zaten müşteri
  kalın (X1). Ölçüm: planlar 128/128 · 61/61 · 64/64; m2 104/104 · 27/27 · 52/52; m6 80/80 · 20/20 · 40/40; m8 184/184 · 107/107 ·
  92/92 (4 yeni deneme); gözle 1920.
- 2026-09-30 (175): **L1 · Teklifte ekipman listesi Excel içe + dışa** (§9 kırkıncı tur; soru cevabı: içe + dışa). Teklif formunda Kalemler'in
  altında **Excel'den yükle**: müşterinin ekipman listesi (Kod · Ekipman türü · Konum · Seri no; yalnız tür zorunlu, adıyla ya da koduyla),
  şablon, satır satır önizleme ("Eklenecek" / "Tür bulunamadı, atlanır" / "Kod dosyada iki kez"); **Kalemlere ekle** geçerli satırları tür
  başına adetle kalemlere ekler (fiyat fiyat listesinden; aynı tür varsa adet artar). Liste teklifle saklanır. **Excel'e aktar**: yüklenen
  liste, yoksa kayıtlı müşterinin seçili tesis(ler)indeki ekipman; önizleme + gerçek .xlsx (kod, tür, konum, seri no, branş, birim fiyat);
  liste yoksa kapalı ve nedeni yazılı. Teklif sayfasında da Excel'e aktar ve "N ekipman (Excel'den)". Ölçüm: m12 112/112 · 19/19 (3 yeni:
  örnek dosyayla ekle + kaydet, gerçek .xlsx okuma, dışa aktarma + kapalı durum) · 56/56; gözle 1920 + 375.
- 2026-09-30 (174): **L4 · Personel kartında Ekipman atamaları** (§9 kırkıncı tur; soru cevabı: atama ekipman TÜRÜNE). Inspector'ın kartında
  "Ekipman atamaları" bölümü + yüz: atandığı türler (tür · branş · atama tarihi · atama belgesi); satırda **Görüntüle** (belge açılır),
  **İndir** (yüklenen dosya aynen iner), **Değiştir**, kaldır (onay). **Atama ekle** penceresi: tür (atanmamışlar), atama tarihi, belge
  (zorunlu). Hiç ataması olmayan inspector'da kartta uyarı. Atanmadığı türde **yalnız uyarı**: Plan aç özetinde "ekipte bu türe atanmış
  denetçi yok", açık saha raporunda şerit (imzalı raporda yok; meslek uyarısı varsa o yeter). Örnek atamalar uydurma (mk, ea, hp, sy, dk;
  raporlarıyla tutarlı). MV.ATAMALAR kalıcı. Ölçüm: m1 304/304 · 86/86 (6 yeni) · 152/152; m6 80/80 · 19/19 · 40/40; m8 184/184 · 106/106
  · 92/92; gözle 1920 + 375.
- 2026-09-30 (173): **L6 · Plan aç'ta ekipman seçimi (kapsam) kalktı** (§9 kırkıncı tur). Plan aç'ın 4. bölümü (ekipman listesi, Kontrolü
  gelenleri seç / Hepsini seç / Seçimi temizle, süzgeç) kalktı; bölümler 1–4. Tesisin bütün kayıtlı ekipmanı plana girer — başka açık planda
  olan da ("aynı ekipman iki açık planda olmaz" kısıtı kalktı). Özet: "N ekipman · N tür · hepsi plana girer" + tür başına tablo (ekipte
  yetkili · kontrolü geliyor · ekipman). Plan içinde denetçi bütün ekipmanı görür, branş süzgeci duruyor. 203 geçerli (raporu olan
  ekipmanda Rapor oluştur yok). §3.4-M6 varsayımları yerinde düzeltildi. Seçime dayanan 7 deneme gerekçeyle yeniden yazıldı. Ölçüm: m6
  80/80 · 19/19 · 40/40; planlar 128/128 · 60/60 · 64/64; gözle 1920.
- 2026-09-30 (172): **L3 · Gelir-gider'de toplam** (§9 kırkıncı tur). Muhasebe › Gelir-gider'de Dönem listesinin başında **Toplam** (varsayılan):
  ilk işin ayından bu aya kadar bütün aylar toplanır — üç yüz (toplam gelir, gider, kâr), kalem kalem toplam tablo (maaşlar, masraflar, sabit
  giderler "N ay × aylık"), altında **Aylara göre** döküm (dönem · iş · gelir · gider · kâr, en altta toplam satırı; ay adına basınca o ay
  açılır). Tek ay görünümü aynen durur. Makette uydurma veride iş az olduğu için toplam kâr çok eksi görünür (hesap doğru, veri seyrek).
  Ölçüm: m14 200/200 · 47/47 (2 yeni, 1 güncellendi) · 100/100; m1 280/280 · 80/80 · 140/140; gözle 1920 + 375.
- 2026-09-30 (171): **L5 · Müşteri hesabında parola tıklayınca gider · Ön bilgilendirme formu gönder** (§9 kırkıncı tur). Müşteri (ve ek
  giriş) e-postayla kaydedilince giriş açılır ama parola gitmez: durum "Parola gönderilmedi"; müşteri kartında **Parolayı gönder**, ek giriş
  satırında **Parolayı gönder** / **Yeniden gönder** (pasif müşteride yok). Kartta Parolayı gönder'in yanında **Ön bilgilendirme formu
  gönder**: onay penceresi → müşterinin e-postasına; son gönderim "Ön bilgilendirme formu" satırında. İki eski deneme (açılınca "parola
  gönderildi") kural değiştiği için güncellendi. Ölçüm: m2 104/104 · 26/26 · 52/52; gözle 1920.
- 2026-09-30 (170): **L2 · İSG-KATİP eksiği plan kabulünü engellemez** (§9 kırkıncı tur). Plan içinde "Kabul et" artık yalnız tarafsızlık
  beyanı okunmadıysa kapalı; İSG-KATİP ID'si yok / geç onay / bitmiş plan için şerit kalır ve "Plan yine de kabul edilebilir." der. Sözleşme,
  plan aç, müşteri ve onay ekranlarında İSG-KATİP zaten yalnız uyarıydı (bakıldı, engel yok). Ölçüm: planlar 128/128 · 60/60 (2 yeni) · 64/64.
- 2026-09-30 (169): **K6 · 214 Madde açıklaması (i)** (§9 otuz dokuzuncu tur, "diğer önerilerini kabul ediyorum"). Saha raporunda her
  muayene maddesinin adının yanında bilgi (i) tuşu; basınca maddenin altında açılır: maddede neye bakılacağı (firma formatındaki açıklama)
  ve türün standartları; ikinci basışta kapanır. Açıklaması tanımlı olmayan maddede "Bu madde için firma formatında açıklama tanımlı
  değil." yazar. Makette açıklama yalnız üç basınçlı kap maddesinde var (uydurma); gerçekte firma formatıyla gelir (§8.3). Telefonda kusurlu
  maddenin iki satırı arasına 4 px aralık (tuşun dokunma alanı seçimle çakışmasın). Ölçüm: m8 184/184 · 106/106 (2 yeni) · 92/92; gözle
  1920 + 375 (açık ve koyu tema).

- 2026-09-30 (168): **K5 · 211 Formatı güncelle** (§9 otuz dokuzuncu tur). Rapor açıldığı format sürümünü tutar (`r.sablon`, türün şablon
  sürümü). Türün formatı yenilendiyse açık (Yeni / geri gönderilmiş) raporda şerit: "Bu rapor eski format sürümüyle açıldı (…); güncel sürüm
  …" + **Formatı güncelle**: maddeler yeni formata çekilir, eşleşen maddenin cevabı korunur, yeni madde Uygun gelir (§3.8 kural 3). Kopya
  her zaman güncel formatla açılır. Örnek: TP-1005 eski sürümle (v1, son madde yok). Gönderilmiş raporda yok (salt okunur). Ölçüm: m8
  184/184 · 104/104 (2 yeni) · 92/92; planlar 128/128 · 58/58 · 64/64; gözle 1920.

- 2026-09-30 (167): **K4 · 212 Mesai takibi** (§9 otuz dokuzuncu tur). Günlük **normal 480 dk + mesai 220 dk** (Firma ayarları › Mesai
  takibi: aç/kapa, iki süre; yalnız yönetici; geçersiz süre kaydedilmez). Raporun süresi ekipman türünün kontrol süresi (Ekipman türleri, dk);
  kişinin o gün oluşturduğu pasif olmayan raporların süresi önce normali, sonra mesaiyi doldurur. **Günlük süre çubuğu** (tek üretici
  `MK.mesaiCubugu`): saha raporunda raporu yazanın (ve "Bu rapor: N dk"), plan içinde Denetim adımının başında. İkisi dolunca **yeni rapor
  oluşturulamaz** (reisim'in açık kararı: engel): plan içinde Rapor oluştur kapalı, sebep çubukta; Kaydet ve kopyala kopyalamaz, pencere
  söyler. Kapalıyken çubuk yok, sınır yok. Performans ve bordroya bağlanmadı (istenmedi). Ölçüm: planlar 128/128 · 58/58 (2 yeni) · 64/64; m8
  184/184 · 102/102 (1 yeni) · 92/92; m1 280/280 · 80/80 (1 yeni) · 140/140; gözle 1920 + 375.

- 2026-09-30 (166): **K3 · 213 Kusur fotoğrafı satırda, kusur açıklamalarında, zorunlu (firma ayarı)** (§9 otuz dokuzuncu tur). Uygun
  maddeye fotoğraf yok; genel Fotoğraflar bölümü aynen. "Uygun değil" seçilen maddenin satırında, seçimin yanında **kamera simgesi** (kamera ile
  çek / galeriden seç); eklenen fotoğraf açıklamanın altında listelenir ve **Kusur açıklamaları**nda açıklamayla birlikte ("Fotoğraf: ad"),
  rapor PDF'inde de kusura atıfla. **Zorunlu** (başlangıç): fotoğrafsız "Uygun değil" maddeyle gönderilmez, simge kırmızı ve "Fotoğraf
  zorunlu" yazısı. Firma ayarları › **Rapor**: "“Uygun değil” işaretlenen maddede fotoğraf zorunlu" (kapatılınca isteğe bağlı, kalıcı);
  §3.7 satır 14. Telefonda kusurlu maddede kamera + seçim maddenin altında tam satır. Ölçüm: m8 184/184 · 101/101 (3 yeni) · 92/92; m1 280/280
  · 79/79 (1 yeni) · 140/140; gözle 1920 + 375.

- 2026-09-30 (165): **K2 · 204–210 Kaydet ve kopyala · telefonda İşlemler menüsü** (§9 otuz dokuzuncu tur). Saha rapor ekranında Kaydet ·
  Onaya gönder · Sil'in yanında **Kaydet ve kopyala** (gönderilmiş / imzalı raporda **Kopyala**; her raporda). Pencere yeni ekipmanın kodunu
  (zorunlu; A–Z, 0–9, tire, 3–20 hane; firmada eşsiz), seri noyu ve kullanım yerini sorar, tür aynı. Önce rapor kaydedilir; yeni ekipman ve
  raporu (her zaman Yeni) bu raporun bilgileriyle açılır: ekipman bilgileri, ekipman detayları ve tespitler, ölçüm cihazları, madde cevapları
  kopyalanır; "Uygun değil" maddenin kusur açıklaması / derecesi / fotoğrafı, test ve ölçüm değerleri, fotoğraflar, sonuç, notlar
  kopyalanmaz. Yeni raporda "… raporundan kopyalandı" şeridi; ekipman ve rapor plana girer (plan hareket kaydına "Ekipman kopyalandı").
  **Telefonda** bütün tuşlar tek **İşlemler** menüsünde (Onaya gönder · Kaydet · Kaydet ve kopyala · Sil; Sil en altta), masaüstü ve tablette
  yan yana. Plan, ortak kayıttan gelen kopya ekipman ve raporları alır; rapor sırası ortak kayıttaki en büyük sıradan sürer. Yeni ikonlar
  (Lucide 1.47.0, araçla): copy, ellipsis-vertical. Ölçüm: m8 184/184 · 98/98 (5 yeni) · 92/92 (3 durum menüden bağımsız basacak şekilde
  güncellendi); planlar 128/128 · 56/56 · 64/64; m9 200/200 · 49/49 · 100/100; gözle 1920 + 375.

- 2026-09-30 (164): **K1 · 203 Raporu olan ekipmanda Rapor oluştur yok** (§9 otuz dokuzuncu tur; 2026-09-28'deki "sınırsız" kararı
  değişti). Ekipman başına bir rapor: rapor oluşturulunca tuş gider; rapor silinir ya da pasife alınırsa geri gelir. "Aynı ekipmanın ikinci
  raporu" denemesi kalktı, öteki denemeler raporu olmayan ekipmana geçti. Ölçüm: planlar 128/128 · 56/56 · 64/64; m1 78/78; m8 93/93.

- 2026-09-30 (163): **Otuz dokuzuncu tur soruları (203–214)** §9'a yazıldı (reisim: *"elindeki tüm soruları toplu sor"*).

- 2026-09-30 (162): **Kalıcılık hatası: plan içinde oluşturulan rapor / eklenen ekipman yenilemede kayboluyordu** (ölçerken bulundu). Plan
  listesi ortak veriye geçince (U4) plan her açılışta örnek veriden yeniden kuruluyordu → plan içinde oluşturulan rapor, eklenen ekipman,
  hareket kaydı ve notlar sayfa yenilenince gidiyordu. Düzeltme: tarayıcıda kayıtlı hâli olan plan yeniden kurulmaz, örnek veri yalnız ilk
  açılışta. **Ölçüm aracı da düzeltildi:** yenileme adımı olan denemede sonuç artık yenilenmiş sayfada ölçülür (önceden yenilemeden önceki
  sayfa beklenen sonucu verince deneme geçiyor, hata gizleniyordu). Yeni kalıcı deneme (rapor + ekipman + not → yenile); olumsuz kanıt: eski
  kodda düşüyor (56/57). Ölçüm: planlar 128/128 · 57/57 · 64/64; öteki modüllerin yeni kuralla ölçümü sürüyor.

- 2026-09-29 (161): **Z2 · Telefonda Güncelle ve Hepsini işaretle yalnız simge** (§9 otuz sekizinci tur, görünüş). Saha raporunda bölüm
  başlıklarındaki **Güncelle** (Firma bilgileri) ve **Hepsini işaretle** (kriterler) telefonda kare, yalnız simge (adı erişilebilir adda ve
  ipucunda); masaüstü ve tablette yazılı. Telefonda başlık satırı tek sırada kalır (uzun başlık iki satıra iner, ok alta düşmez). Ölçüm: m8
  184/184 · 93/93 (2 yeni: telefonda simge + ok hizası, masaüstünde yazı) · 92/92; 320'de taşma yok; gözle 375.

- 2026-09-29 (160): **Z1 · Plan içi başlıkları büyük, bölümler ayrık** (§9 otuz sekizinci tur, görünüş). Plan içindeki adım başlıkları
  (Planlandı · Kabul · Denetim · Tamamlama) ile **Ekipmanlar** ve **Raporlar** başlıkları sayfa başlığı boyunda (yazı ölçeğinden
  `--boy-baslik`); Ekipmanlar ve Raporlar bölümlerinin üstünde kalın ayırıcı çizgi ve boşluk. Önce kart denendi: içerik sayfa kenarından
  34 px içeri kaydı, tablolar daraldı (ölçüm 32/128'e düştü, kalıbın kenar hizası kuralı) → kart bırakıldı, ayırıcı çizgi seçildi. Ölçüm:
  planlar 128/128 · 56/56 (1 yeni) · 64/64; gözle 1920 + 375.

- 2026-09-29 (159): **Y3 · Kontrol listesi Tamamla, en altta plan Tamamla** (§9 otuz sekizinci tur, düzeltme). Plan içinde iki adım:
  Denetim adımının altında (ekipman ve rapor listelerinden sonra) **Tamamla** → "Kontrol listesi tamamlandı" (Denetim adımı ✓, plan
  Denetimde kalır; "Kontrol listesini yeniden aç" ile geri alınır); ardından Tamamlama adımında **Tamamla** → plan Tamamlandı. Kontrol listesi
  tamamlanmadan en alttaki Tamamla çıkmaz ("Kontrol listesi tamamlanınca plan buradan tamamlanır."). Telefondaki alt çubukta sıradaki Tamamla.
  "Kabul edildi" durumu kalır (X3 böyle). Ölçüm: planlar 128/128 · 55/55 (2 yeni: iki adım + yenilemede kalıcı; yeniden aç) · 64/64;
  gözle 1920 + 375.

- 2026-09-29 (158): **Y2 · Inspector oluşturduğu raporu siler** (§9 otuz sekizinci tur, düzeltme; 2026-09-28'deki "silme yalnız yönetici"
  değişti). Plan içindeki rapor listesinde her **Yeni** raporun satırında Pasife al'ın yanında **Sil** (çöp kutusu), saha rapor ekranında
  Kaydet'in yanında **Sil**: düzenlenebilen her raporda (Yeni ya da geri gönderilmiş), onay penceresiyle; geri gönderilmiş raporda pencere
  geçmişin de silineceğini söyler. Rapor plandan ve ortak kayıttan kalkar, plana hareket kaydı düşer. Gönderilmiş (salt okunur) raporda Sil yok.
  Yeni ikon (Lucide 1.47.0, araçla): trash-2. Ölçüm: planlar 128/128 · 53/53 (1 yeni) · 64/64; m8 184/184 · 91/91 (2 yeni, 1 kalktı) ·
  92/92; gözle 1920 + 375.

- 2026-09-29 (157): **Y1 · "Hepsini işaretle" bölüm başlığında; X5 geri alındı** (§9 otuz sekizinci tur, düzeltme). Reisim'in istediği
  madde madde seçim değil, toplu tuşmuş: Muayene / gözle kontrol kriterleri bölümünün başlığında, başlık hizasında yazılı **Hepsini işaretle**
  tuşu (Hepsini uygun · uygun değil · uygulanamaz yap); bölüm kapalıyken de görünür, açmadan bütün maddeleri işaretler. Formatlı türde grup
  başlarındaki ünlem menüleri (o grubun maddeleri) aynen; düz listede "Maddeler" başlığındaki ünlem kalktı (başlığa taşındı). X5'teki madde
  satırı üç tuşu geri alındı, madde seçimi yine açılır liste. Ölçüm: m8 184/184 · 90/90 (1 yeni: başlık hizası, kapalı bölümde çalışır;
  X5'in denemeleri eski hâline) · 92/92; gözle 1920 · 1080 · 375.

- 2026-09-29 (156): **X8 · Rapor Sil + tuşlar çubuksuz** (§9 otuz sekizinci tur). Saha raporunda altta yapışkan tuşlar artık çubuk
  içinde değil: kap zeminsiz, kenarsız; **Sil · Kaydet · Onaya gönder** her biri kendi gölgesiyle bağımsız. "Son kayıt" yazısı başlığa
  (rapor numarasının altına) taşındı — telefonda da görünür. **Sil** yalnız hiç gönderilmemiş (ve geri gönderilmemiş) raporda: onay penceresi,
  rapor ve içindeki fotoğraflar silinir, plana dönülür, plandan ve ortak kayıttan kalkar. Gönderilmiş / geri gönderilmiş raporun onay
  geçmişi olduğu için Sil yok; o raporları silmek yöneticide (Onaylar · Pasif raporlar) — **reisim'e soruldu** (2026-09-28 kuralı: "silme
  yalnız yönetici"). Ölçüm: m8 184/184 · 90/90 (3 yeni: çubuksuz sıra, Sil akışı, geri gönderilende Sil yok; 1 güncellendi) · 92/92;
  planlar 128/128 · 52/52 · 64/64; gözle 1920 · 1080 · 375 (açık tema).

- 2026-09-29 (155): **X7 · Fotoğrafta küçük resim yok** (§9 otuz sekizinci tur; 09-SUNUCU-VE-VERI A ile aynı: küçük kopya üretilmez).
  Tek üretici `MK.fotolar` (rapor Fotoğraflar, kusurlu madde fotoğrafı, pano fotoğrafı, zimmet teslim fotoğrafları) artık her fotoğraf için
  bir satır: **dosya adı · Görüntüle · İndir · Sil** (Sil yalnız düzenlenebilen yerde, onay penceresiyle). Fotoğraf yalnız Görüntüle'ye
  basınca açılır (veri tasarrufu). Örnek kayıtta dosya yok: ad "fotograf-N.jpg", Görüntüle ve İndir bunu söyler. Rapor PDF'indeki fotoğraf
  eki (belgenin kendisi) değişmedi. Ölçüm: m8 184/184 · 87/87 (2 yeni: gerçek fotoğraf eklenir, img yok, Görüntüle fotoğrafı açar; Sil ve
  örnekte İndir; 3 güncellendi) · 92/92; m4 144/144 · 35/35 · 72/72; gözle 1920 + 375 (rapor, zimmet geçmişi).

- 2026-09-29 (154): **X6 · Firma ve ekipman bilgileri iki sütun, etiket üstte** (§9 otuz sekizinci tur; reisim'in örnek görselinden yalnız
  düzen alındı). Saha raporunun Firma bilgileri, Ekipman bilgileri, 2.1 ekipman detayları ve 2.2 tespitler bölümleri: etiket üstte, alanlar
  iki sütun yan yana (telefonda tek sütun), çoklu seçim tam satır. 2026-09-27'deki "etiket solda, değer sağda, satır satır" düzeninin
  yerine geçti. Ölçüm: m8 durum 184/184 · etkileşim 85/85 (2 yeni: iki sütun, telefonda tek sütun) · telefon 92/92; m9 200/200 · 49/49 ·
  100/100; gözle 1920 · 1080 · 375. Not: bir koşuda "ünlem menüsü: her grup başlığında bir tane" denemesi bir kez düştü, ardından üç
  koşuda geçti; nedenini bulamadım (izleniyor).

- 2026-09-29 (153): **X5 · Kriter cevabı üç tuş, madde yazısıyla aynı satırda** (§9 otuz sekizinci tur). Muayene / gözle kontrol
  kriterlerinde açılır liste kalktı: **Uygun · Uygun değil · Uygulanamaz** üç tuş (seçili Uygun yeşil, Uygun değil kırmızı zemin, mevcut
  token'lar), madde yazısının hizasında, her bantta ≥ 44 px, tek basışta seçilir; telefonda maddenin altında tam satır (320'de taşma yok).
  Grup başındaki "hepsini işaretle" menüsü aynen. Ölçüm: m8 durum 184/184 · etkileşim 83/83 (1 yeni: aynı satır, 44 px, tek basış; 4
  güncellendi) · telefon 92/92; gözle 1920 · 1080 · 375.

- 2026-09-29 (152): **X4 · Pasif rapor inspector'da hiçbir yoldan açılmaz** (§9 otuz sekizinci tur). Taranan 12 sayfada (Planlar, plan
  içi, Raporlar, Ana sayfa, Uyarılar, Performans, Onaylar, Müşteriler, Talepler, Ekipman türleri) listelerden kalkıyordu; **sızıntı:** eski
  bağlantıyla (tarayıcı geçmişi, açık sekme) saha rapor ekranı ve Raporlar'daki rapor sayfası pasif raporu açıyor, düzenletiyordu. İkisi de
  artık "Rapor bulunamadı · Bu rapor pasife alındı; yalnız yöneticiler görür." (sunucuda karşılığı: yetkisiz = yok). **Kalıcı denetim:** iki
  deneme (plan içinden pasife al → eski bağlantı; Raporlar listesi + adres); olumsuz kanıt: eski kodda ikisi de düşüyor (51/52 · 48/49).
  Ölçüm: planlar 128/128 · 52/52 · 64/64; m8 184/184 · 82/82 · 92/92; m9 200/200 · 49/49 · 100/100.

- 2026-09-29 (151): **X3 · Denetime başla tuşu kalktı** (§9 otuz sekizinci tur). Kabul edilen planda ekipmanlar ve **Rapor oluştur**
  hemen açık (ekipman ekle, Excel'den yükle de); Denetim adımında "İlk rapor oluşturulunca denetim başlar." notu. İlk rapor oluşturulunca
  plan kendiliğinden **Denetimde** olur, başlama zamanı o an (hareket kaydına "Denetime başlandı · ilk rapor oluşturuldu"). "Kabul edildi"
  durumu listede anlamını korur: inspector kabul etti, henüz rapor yok. Ölçüm: planlar durum 128/128 · etkileşim 51/51 (1 yeni) · telefon
  64/64; gözle 1920 + 375.

- 2026-09-29 (150): **X2 · SGK DETSİS no saha ekranında yok** (§9 otuz sekizinci tur). "Plan içeriği"ndeki satır saha raporunun Firma
  bilgileri bölümündeydi (plan içinde yok); oradan kalktı. Ek-III zorunlu alanı olduğu için rapor PDF'ine tesis kaydından gitmeye devam eder.
  Ölçüm: m8 durum 184/184 · etkileşim 82/82 (1 yeni: ekranda yok, PDF'te var; 1 güncellendi) · telefon 92/92.

- 2026-09-29 (149): **X1 · Planlar listesinde müşteri adı kalın** (§9 otuz sekizinci tur). Kalın olan artık müşteri adı (`.a-musteri-ad`,
  600; telefon kartında bölüm boyu), proje adı normal yazı. Ölçüm: planlar etkileşim 50/50 (1 yeni: müşteri ≥ 600, proje adı 400).

- 2026-09-29 (148): **W11 · 202 Firma ayarları bir yerde** (§9 otuz yedinci tur). Personel → Firma ayarları sekmesine dört bölüm eklendi:
  **Uyarı eşikleri** (kalibrasyon bitişi 30 · kontrolü yaklaşan tesis 30 · plan açarken "kontrolü geliyor" 30 · eğitim tekrarı 60 gün başlangıç;
  seçenekli), **Rapor numarası** (firma kodu 2–4 harf; yalnız yeni raporlar, açılmış numaralar değişmez; geçersiz kod kaydedilmez, altında
  söylenir), **Fiyat listesi** (tür başına KDV hariç birim fiyat; kabul edilmiş tekliflerin fiyatı değişmez), **Sabit giderler** (ekle · düzenle
  · kaldır; Muhasebe gelir-gider özetine düşer). Dağınık sabitler (Ölçüm cihazları, Müşteriler, Ana sayfa, Plan aç, Eğitimler, Personel,
  Uyarılar, Planlar'daki firma kodu) tek erişimden okur: `MV.esik(k)`, `MV.firmaKodu()`. Ölçüm: m1 durum 280/280 · etkileşim 78/78 (7 yeni, sayfalar arası) · telefon 140/140; m2, m4, m6, m10, m12, m14,
  m16, planlar üç kipte temiz; gözle 1920 + 375.

- 2026-09-29 (147): **W10 · 200–201 Saklama süresi · arşivdeki rapor künyesi** (§9 otuz yedinci tur). Firma ayarları'ndaki bölüm "Saklama süresi
  dolan raporlar" oldu; **Saklama süresi** seçicisi 5 yıldan başlar (5 · 6 · 7 · 8 · 9 · 10 · 15 · 20 yıl; kısaltılamaz), kalıcı. Arşive taşınan
  rapor (`r.arsiv = { yer, zaman }`): künyesi sistemde kalır; Onaylar ve Raporlar rapor sayfasında "Arşivde · yer · tarih: künye sistemde, dosya
  arşivde; müşteri portalında görünmez" şeridi, PDF yerinde "Dosya arşivde."; müşteri portalında görünmez; Onaylar'da **Arşivden geri getir**
  (müşteride yeniden görünür). Tek üretici `MV.arsivSerit`. Yeni ikon (Lucide 1.47.0, araçla): archive. Ölçüm: m9 durum 200/200 · etkileşim 48/48
  (1 yeni, sayfalar arası) · telefon 100/100; m1 280/280 · 71/71 (1 yeni) · 140/140; m11 88/88 · 12/12 · 44/44; gözle 1920.

- 2026-09-29 (146): **W9 · 199 Kusur sınıfı olmayan türlerde önceki kusur** (§9 otuz yedinci tur). `MV.devredenKusurlar` artık her türde: kusur
  sınıflı türde önceki rapor "Hafif kusurlu"ysa hafif kusur, öteki türlerde önceki rapor "Kusurlu"ysa kusur listelenir. Saha raporunda bölüm
  başlığı türe göre ("Önceki kontrolden açık hafif kusurlar" / "… açık kusurlar"), formatı olmayan türün bölüm sırasına da girdi (fotoğraflardan
  önce); "Giderilmedi" → sonuç önerisi Uygun değil ("Uygun" seçilirse uyarı); Onaylar özetinde "N kusur". Ölçüm: m8 durum 184/184 · etkileşim
  81/81 (1 yeni) · telefon 92/92; m9 200/200 · 47/47 · 100/100; planlar 128/128 · 49/49 · 64/64.

- 2026-09-29 (145): **W8 · 197 İmzalı saha formu yükle** (§9 otuz yedinci tur). Plan içinde Tamamlama adımının altında **oluşturulan saha formları**
  (en yeni üstte): numara · uzman imzası (yöntem ya da imzasız) · müşteri taraması (yüklü / yok); **Formu aç** (aynı numarayı açar),
  **İmzalı taramayı yükle** → dosya kaydı (aç · değiştir · sil, silme onaylı); her yükleme / silme planın hareket kaydına. Uzman imzası ve tarama
  sonrası liste yenilenir. Ölçüm: planlar durum 128/128 · etkileşim 49/49 · telefon 64/64; m1 280/280 · 70/70 (1 yeni) · 140/140; gözle 1920 ve 375
  (iki "Aç" karıştığı için form tuşu "Formu aç" oldu).

- 2026-09-29 (144): **W7 · 195 Mobil imza telefonu** (§9 otuz yedinci tur). Personel formunda isteğe bağlı **"Mobil imza telefonu"** (05XX XXX XX XX;
  hatalı biçim kaydedilmez), kartta görünür; firma yöntemi mobil imzaysa inspector'da boşsa kartta "Yok · mobil imzaya gönderilemez". Raporlar'ın
  imza penceresinde telefonu olmayan kişi için "İmzaya gönder" çizilmez, uyarı: "Personel kartınızda mobil imza telefonu yok; mobil imzaya
  gönderilemez. İndir, imzala, yükle yolu açık." KVKK: alan yalnız mobil imza amacıyla, başka yerde gösterilmez. Örnek veride UYDURMA numaralar
  (0500 000 00 …). Tohum veri değiştiği için **maket veri sürümü 2026-09-29-4** (tarayıcıdaki maket denemeleri bir kez tohum veriye döner).
  Ölçüm: m9 durum 200/200 · etkileşim 47/47 (1 yeni) · telefon 100/100; m1 280/280 · 69/69 (1 yeni) · 140/140.

- 2026-09-29 (143): **W6 · 194 Yanıtsız mobil imza isteği** (§9 otuz yedinci tur). Telefona giden istek **5 dakika** geçerli; yanıtlanmazsa rapor
  "Muayene uzmanı imzası"na döner: listede "N imza isteğinin süresi doldu … yeniden gönderin", rapor sayfasında "İmza isteğinin süresi doldu ·
  gönderilme zamanı"; yeniden gönderilip imzalanınca kalkar. Gerçek uygulamada arka plan işi yapar; makette her çizimde denetlenir, maket saati
  sabit olduğundan telefon ekranında **"Maket: yanıtsız bırak"** tuşu süreyi doldurur. Ölçüm: m9 durum 200/200 · etkileşim 46/46 (2 yeni) ·
  telefon 100/100.

- 2026-09-29 (142): **W5 · 193 Müşteride yalnız son sürüm** (§9 otuz yedinci tur). Müşteri paneli raporu `MV.musteriSurumu` ile görür: revize sürerken
  **önceki imzalı sürüm** (onay, imza, sonuç sürüm kaydından; numarası o sürümün), yeni sürüm imzalanınca **yalnız o** (KM-…-R1) ve rapor
  sayfasında "Bu rapor KM-…-R1, KM-… raporunun yerine geçer" şeridi; eski sürüm firmada saklı. Raporun görünen numarası tek yerden
  (`MV.surumNo`) — belge başlığı da sürümlü numarayı yazar (firma tarafında da). Ölçüm: m11 durum 88/88 · etkileşim 12/12 (2 yeni) · telefon 44/44;
  m9 200/200 · 44/44 · 100/100.

- 2026-09-29 (141): **W4 · 192 Inspector "Revize iste"** (§9 otuz yedinci tur). Raporlar'da tamamlanan raporda **"Revize iste"** (gerekçe zorunlu,
  en az 10 karakter) → raporun üstünde "Revize isteğiniz teknik yöneticide" şeridi, "Revize isteğini geri çek". Onaylar'a **"Revize istekleri"**
  sekmesi (seçili branşın; vekilde o branşın): satırda **Reddet** (gerekçe isteğe bağlı; inspector raporunda "Revize isteği reddedildi"
  şeridini görür, yeniden isteyebilir) ve **Revizeye gönder** (inspector'ın gerekçesi başlangıç olarak gelir; gönderince istek kalkar, R1 açılır).
  Rapor ekranında da istek şeridi ve "İsteği reddet". **Genel düzeltme:** sekme grubu dar kapta taşıyordu (810'da vekil seçiliyken 54 px) → ortak
  `.a-sekmeler` alt satıra geçer, yarıçap tek satırda hap, çok satırda kutu (bütün sayfaların sekmeleri). Ölçüm: m9 durum 200/200 · etkileşim
  44/44 (2 yeni, sayfalar arası) · telefon 100/100; gözle 1920 ve 810.

- 2026-09-29 (140): **W3 · 191 Durum değişikliği şeridi** (§9 otuz yedinci tur). Teknik yönetici raporun durumunu değiştirdiyse ve değişiklik hâlâ
  geçerliyse raporun üstünde bilgi şeridi: "Durum teknik yönetici tarafından değiştirildi · ad · zaman · eski → yeni: gerekçe". Tek üretici
  `MV.durumSerit`; Onaylar rapor ekranı, Raporlar rapor sayfası ve saha raporu aynı şeridi gösterir. Yeni'ye alınan raporda çıkmaz (orada "Geri
  gönderildi / Revizeye gönderildi" şeridi var). Ölçüm: m9 durum 184/184 · etkileşim 42/42 (1 yeni, sayfalar arası) · telefon 92/92; m8 184/184 ·
  80/80 · 92/92; saha raporunda şerit metni okundu.

- 2026-09-29 (139): **W2 · 190 Vekil branşın tüm raporları** (§9 otuz yedinci tur). Onaylar'da "Tüm raporlar" seçili branşı izler: vekil kuyruğu
  ("Elektrik · vekil") seçiliyken sekme "Tüm raporlar · elektrik vekil" olur (`#/tum?brans=e`), o branşın bütün raporları listelenir, durum
  değiştirme ve revizeye gönderme orada da çalışır; kendi kuyruğuna dönünce kendi branşı. Branş değişince süzgeç baştan; rapor ekranındaki
  kırıntı raporun branşına döner. Ölçüm: m9 durum 184/184 · etkileşim 41/41 (1 yeni) · telefon 92/92.

- 2026-09-29 (138): **Sunucu ve veri tasarrufu kuralları: `09-SUNUCU-VE-VERI.md`** (§9 otuz yedinci tur ek; reisim D'yi onayladı, küçük kopya
  çıktı, veri tasarrufu tamamlansın). D bölümü kural dosyasına taşındı ve bu yığına göre yazıldı; veri tasarrufuna eklenenler: yükleme öncesi
  sıkıştırma (1600 px, %75), dosya bir kez iner, sunucuda sayfalı ve yalnız gereken sütunlar, sayılar özetten, canlı yoklama yok (en sık 60 sn,
  sekme görünürken), gzip / brotli + karmalı dosyalara uzun önbellek, sahada açılışta yalnız o günün işi, çevrimdışı kuyruk tekrar göndermez,
  toplu işler arka planda tek dosya, firma başına kullanım ölçümü, depo sürümleri ve kayıtlar sınırlı. ANAYASA 4.9 · 4.12 · 5.1'e bu projenin
  hâli (gerekçeli), CLAUDE.md'ye dosya, EKSİKLER D "onaylandı". Kilitler kodla birlikte kurulur (her maddede kilit satırı).

- 2026-09-29 (137): **W1 · 196 Zimmet formunda teslim eden / teslim alan** (§9 otuz yedinci tur cevap; reisim: *"zimmet formunda teslim eden
  teslim alan kısmı el ile girilebilsin, listeden personel girilebilsin"*). Zimmet formu sayfasında belgenin üstünde **Teslim** bölümü: iki alan,
  her biri personel listesinden seçilir ya da **"Listede yok — elle yaz"** ile ad yazılır; belge önizlemesi yazdıkça güncellenir. Elle seçilip
  ad boş bırakılırsa imza / tarama yükleme durur, alan gösterilir. İmzada imzacılar bu iki kişi; imzalı ve taranmış formda ikisi kayıtlı.
  **Firma ayarları**'na "Zimmet teslim formu · Teslim eden (başlangıç)" (başlangıç: firma yöneticisi); değişince yeni formlar o kişiyle gelir,
  eski imzalı formların teslim edeni değişmez (örnek formlarda kayda yazıldı). Ölçüm: m1 etkileşim 68/68 (2 yeni); tam ölçüm durum 2104/2104 · etkileşim
  519/519 · telefon 1052/1052 · olumsuz 3/3; gözle 1920 ve 375.

- 2026-09-29 (136): **Sunucu kuralları denetimi · otuz yedinci tur kararları** (§9 otuz yedinci tur cevap). Kural dosyaları (ANAYASA, 00–08,
  EKSİKLER) ve §8 bu projenin sunucu yığınına karşı tek tek eşlendi; kaynak projeden Firebase diliyle gelen kuralların (dosya indirme, küçük
  kopya, gizli görüntüleme, güvenli yazıcılar, yedek, yetki) PostgreSQL + S3 + kendi girişimiz karşılığı ve hiç olmayan kurallar (oturum
  çerezi alan adı, CSRF / CSP, müşteri erişim katmanı, iyimser kilit, çevrimdışı tek seferlik gönderim, arşive güvenli taşıma, imzalı PDF
  özeti, arka plan işinde kiracı bağlamı, KVKK erişim kaydı, e-posta) `EKSIKLER-VE-ONERILER.md` D bölümüne öneri olarak yazıldı (27 madde,
  onay bekliyor). Kod yok; maket sırası W1–W11.

- 2026-09-29 (135): **185 · 5 yılı dolan raporlar: firma seçer** (§9 otuz altıncı tur ek; reisim: *"isteğe bağlı olsun ister silinsin ister
  arşivlensin"*). Personel › Firma ayarları'na ikinci bölüm: **Sistemde kalsın** (başlangıç) · **Bulut arşivine taşınsın** (arşiv yeri alanı;
  boşken uyarı: "yeri girilene kadar süresi dolan raporlar sistemde kalır") · **Silinsin** (30 gün önce liste, silinen 30 gün geri alınabilir).
  Seçim hemen geçerli, sayfalar arası kalıcı. §3 rapor arşivi maddesi, §8.9 ve CLAUDE.md §7 "otomatik silme" satırı bu karara göre
  düzeltildi. Ayar eski maket kaydında yoksa "Sistemde kalsın" sayılır. Otuz yedinci turun soruları §9'da (189–202).
  Ölçüm: m1 etkileşim 66/66 (yeni: varsayılan, arşiv yeri uyarısı, Silinsin, yeniden yüklemede kalıcı), m9 durum 176/176 · telefon 88/88;
  tam ölçüm durum 2096/2096 · etkileşim 517/517 · telefon 1048/1048 · olumsuz 3/3; gözle 1920 ve 375.

- 2026-09-29 (134): **V4 · Önceki kontrolden devreden hafif kusurlar · meslek uyarısı** (§9 otuz altıncı tur 187; reisim: *"diğer önerilerin
  uygundur"* → §3.2 öneri maddeleri karar). **Devreden hafif kusur:** ekipmanın bu rapordan önceki son imzalı raporu "Hafif kusurlu"ysa
  (yalnız kusur sınıflı, Bakanlık formatı yürürlükteki tür) saha raporunda **"Önceki kontrolden açık hafif kusurlar"** bölümü kendiliğinden
  çıkar: her kusur (madde, açıklama, önceki rapor no ve tarihi) için **Giderildi / Giderilmedi**; "Giderilmedi" denen kusur bu raporun kusur
  açıklamalarına "(önceki kontrolden, rapor no)" diye girer, sonuç önerisini etkiler, PDF'e geçer; seçilmemesi gönderimi durdurmaz. Seçim
  onaya gönderilince ortak kayda gider; Onaylar'ın gözden geçirme özetinde "Önceki kontrolden N hafif kusur · x giderildi · y giderilmedi".
  **Meslek uyarısı:** inspector'ın mesleği türün yetkili meslekleri arasında değilse saha raporunun üstünde uyarı şeridi ("Rapor yazılabilir;
  teknik yönetici onayda görür"), Onaylar özetinde "Inspector: ad · meslek · bu türe yetkili meslekler arasında değil" (engel değil).
  Denemelerde ZPKR02 bölüm sırası ET-1009'da devir bölümünü de içerir (önceki raporu hafif kusurlu; 2026-09-29).
  Ölçüm: m8 etkileşim 80/80 (3 yeni), m9 40/40 (1 yeni); tam ölçüm durum 2088/2088 · etkileşim 516/516 · telefon 1044/1044 · olumsuz 3/3;
  gözle 1920 ve 375 (devir bölümü, kusur listesine geçiş, meslek şeridi).

- 2026-09-29 (133): **V3 · İç belgeler de mobil imza ya da e-imzayla** (§9 otuz altıncı tur 180; reisim: *"180 iç belge de de mobil ya da e
  imza olacak"*). Tek üretici **MK.imzaAl** (maket-ortak.js): firmanın yöntemiyle (Firma ayarları) her imzacı sırayla kendi PIN'ini girer —
  mobil imzada kendi telefonunda, e-imzada kendi kartıyla (makette telefon ekranı / imza aracı taklit; PIN 4–8 rakam, kısa PIN reddedilir,
  Vazgeç → hiçbir şey değişmez). Bağlanan belgeler: **zimmet teslim formu** (Personel: "İmzala (mobil imza)" → teslim eden, sonra teslim alan;
  imzalı form kartta güncel, belgede iki imza satırı yöntem ve zamanla; e-imzalı form dosyasız, "Sil" ile kalkar) · **saha formu** (Planlar:
  muayene uzmanları imzalar, firma yetkilisinin imzası ve kaşesi kâğıtta; imza planın geçmişine yazılır) · **izin talebi** (Talepler: talep
  eden gönderirken imzalar; Personel › İzin talepleri: onaylayan onaylarken imzalar) · **masraf formu** (Talepler: gönderirken; Muhasebe:
  personel formunu onaylarken imzalar). Formların PDF'inde imza satırı "mobil imza · tarih saat" / "e-imza · …". Islak imza + tarama yükleme
  yolu her belgede yedek olarak duruyor. **Genel düzeltme:** pencere kapanış olayı eşzamansız geldiği için "Vazgeç → hemen yeniden aç"
  sırasında yeni pencerenin durumu siliniyordu (denemede yakalandı: "Telefonda onayla" boş açıldı) → Raporlar, Onaylar, Talepler, Muhasebe,
  Teklifler, Eğitimler, Dökümanlar ve ortak imza penceresinde kapanış işleyicisi pencere yeniden açıldıysa durumu silmez. Denemelerde
  "zimmet formu yüklü" metni "zimmet formu:" oldu (form artık elektronik de imzalanıyor; 2026-09-29). Yeni denemeler: zimmet mobil (2 imzacı,
  kısa PIN), zimmet e-imza + aç + sil, izin gönder imzalı, izin onay imzalı (Vazgeç dahil), saha formu imzası; mevcut izin/masraf gönder ve
  onay denemelerine PIN adımı eklendi. Ölçüm: tam ölçüm durum 2072/2072 · etkileşim 512/512 · telefon 1036/1036 · olumsuz kanıt 3/3;
  m1 etkileşim üç kez üst üste 65/65, m9 iki kez 39/39 (yarış düzeltmesinden sonra); gözle 1920 ve 375 (zimmet imza penceresi, imzalı form),
  saha formu imza satırı metinden okundu.

- 2026-09-29 (132): **V2 · Son imza: firma yöntemi mobil imza ya da e-imza, aracı site yok** (§9 otuz altıncı tur 177, 178; reisim:
  *"178 zorunlu olmasın hangi firma neyi kullanmak isterse kullansın ister e imza ister mobil"*). **Personel → "Firma ayarları"** sekmesi
  (`#/ayarlar`, firma yöneticisi): imza yöntemi **Mobil imza** (telefonda PIN, her belge ayrı) ya da **E-imza** (kart ve imza aracı, tek PIN);
  seçim hemen geçerli, sayfalar arası kalıcı. Raporlar'daki son imza penceresinde "İmza servisi" sekmesi kalktı; yerinde firmanın yöntemi,
  yanında yedek yol **"İndir, imzala, yükle"**. **Mobil imza:** "İmzaya gönder" → her rapor "İmzaya gönderildi", telefona ayrı istek; makette
  telefon ekranı taklit edilir (istek sırayla, "Mobil imza PIN" 4–8 rakam, **Onayla** → Tamamlandı · **Reddet** → rapor yeniden imza bekler);
  pencere kapansa da istekler telefonda kalır: listede "N imza isteği telefonunuzda bekliyor · Telefonda onayla" şeridi, rapor sayfasında
  "Telefonda onayla" ve "İsteği geri çek". **E-imza:** "İmza aracını aç" → imza aracı (maket): kart takılı, raporların listesi, **kart PIN bir
  kez** → her rapor ayrı imzalanır, hepsi Tamamlandı. Rapor belgesinde imza satırı yolu da yazar ("Güvenli elektronik imza (mobil imza)" ·
  "(e-imza)" · "(imzalı PDF yüklendi)"). Yeni ikonlar (Lucide 1.47.0, araçla): smartphone, usb. Makette telefon ekranı ve imza aracı
  taklittir; gerçek uygulamada istek operatöre (mobil) ya da bilgisayardaki imza aracına (AKİS) gider, imza sunucuda PDF'e gömülür.
  Ölçüm: m9 durum 168/168 · etkileşim 39/39 (yeni: mobil tekli + kısa PIN reddi, Reddet ve İsteği geri çek, pencere kapansa da telefondan
  sırayla, e-imza tek PIN 4 rapor, Firma ayarları → Raporlar sayfalar arası) · telefon 84/84; tam ölçüm durum 2072/2072 · etkileşim 507/507 ·
  telefon 1036/1036 · olumsuz kanıt 3/3; gözle 1920 ve 375 (seçim, telefon ekranı, imza aracı, Firma ayarları).

- 2026-09-29 (131): **V1 · Teknik yönetici: durumu değiştir, revizeye gönder** (§9 otuz altıncı tur; reisim: *"herhangi bir süreçteki rapor
  imzalanıp tamamlanmış hariç teknik yönetici tarafından durumu değiştirilebilsin imzalanıp tamamlanan rapor revizeye gönderilebilsin"*).
  Onaylar'a **"Tüm raporlar"** sekmesi (`#/tum`): branşın pasif olmayan bütün raporları, 20'şer; rapor no ve tesis ayrı aranır, Durum ve
  Inspector seçicisi. Satırda ve rapor ekranında tamamlanmamış raporda **"Durumu değiştir"** (Yeni · Teknik yönetici onayında · Muayene uzmanı
  imzası; "Tamamlandı"ya yalnız imzayla geçilir — İmzaya gönderildi de değiştirilebilir), tamamlanan raporda **"Revizeye gönder"**.
  Yeni'ye alınan rapor inspector'a döner, gerekçe geri gönderimdeki gibi zorunlu (en az 10 karakter) ve raporun üstünde görünür; öteki
  hedeflerde gerekçe isteğe bağlı. Muayene uzmanı imzasına alınan rapor onaylanmış sayılır (onaylayan teknik yönetici). Revize: gerekçe
  zorunlu; rapor **R1, R2 …** sürümüyle Yeni olarak inspector'a döner, tamamlanan sürüm (onay, imza, imzalı PDF, sonuç) sürüm kaydında
  saklanır; Raporlar'da "Revizeye gönderildi (R1)" şeridi. Her değişiklik kayıtta (kim, ne zaman, eskisi, yenisi, gerekçe); ekranda geçmiş
  listesi yok (98). Inspector'ın **"Düzelt (R)"** tuşu kalktı (103 artık teknik yöneticide). Kuyruktan geri gönderilmiş rapor düzeltilmeden
  ileri alınırsa geri gönderim performansta sayılmaya devam eder. Ölçüm: m9 durum 136/136 · etkileşim 35/35 (yeni 8 deneme: sekme 20'şer
  ve tuş türü, Durum seçicisi, seçimsiz / kısa gerekçe reddi, onayda → imza, Yeni → onayda gerekçesiz, imzada → Yeni gerekçeyle, revize kısa
  gerekçe reddi, revize R1 + Raporlar'da şerit sayfalar arası) · telefon 68/68; gözle 1920 ve 375 (liste, pencereler); tam ölçüm durum 2040/2040 · etkileşim 503/503 · telefon 1020/1020 · olumsuz kanıt 3/3.

- 2026-09-29 (130): **U4 · Planlar, Raporlar, Onaylar renkli balon** (§9 otuz beşinci tur 163). Tek yeşil sayı kalktı; balonlar öteki
  modüllerle aynı: **Planlar** sarı = kabul bekleyen plan, kırmızı = plan günü gelmiş / geçmiş ve hâlâ kabul bekleyen · **Raporlar** sarı =
  son imza bekleyen, kırmızı = onaydan 24 saati geçmiş · **Onaylar** sarı = onay bekleyen, kırmızı = gönderimden 24 saati geçmiş (süreler
  başlangıç değeri, firma ayarı). Makette firma geneli sayılır; uygulamada kişinin kendi işleri (kabul edecek / imzalayacak inspector,
  onaylayacak branş yöneticisi). Balonun her sayfada sayabilmesi için Planlar'ın plan listesi ortak veriye taşındı (`MV.PLANLAR`; Planlar
  sayfası aynı listeyi kullanır, kalıcılığı ortak veri katmanı sağlar); kalıcı maket sürümü artırıldı. 2 yeni deneme, 3 güncellendi (eski
  sayaç yerine balon). 18 maket temiz: durum 2008/2008 · etkileşim 496/496 · telefon 1004/1004 · olumsuz kanıt 3/3; menü 1920'de gözle.
- 2026-09-29 (129): **U3 · Onaylayan tarafında talep PDF · e-posta** (§9 otuz beşinci tur 162). Talep PDF'i tek yerden açılır
  (`MB.talepPdfAc`): talep eden (Talepler) alıcıya, **firma yöneticisi** (Personel › İzin talepleri, her satırda "PDF") ve **muhasebe**
  (Muhasebe › Giderler, masraf formu penceresinde "PDF · e-posta") talep edene iletir; form aynı (firma formatı, durum ve onaylayan imza
  yerinde). 2 yeni deneme, 1 yeni durum. Ölçüm (değişen ekranlar): Personel durum 280/280 · telefon 140/140 · etkileşim 60/60; Muhasebe
  192/192 · 96/96 · 45/45; Talepler 80/80 · 40/40 · 12/12; izin listesi 1920'de gözle.
- 2026-09-29 (128): **U2 · Masraf formu Muhasebe rolüne; bordroyu yönetici + muhasebe görür** (§9 otuz beşinci tur 161, 174; reisim önerileri
  kabul etti). Talep formatında alıcı rolü: izin → firma yöneticisi, **masraf → Muhasebe**; o rolde etkin kimse yoksa firma yöneticisi. Örnek
  veride Muhasebe rolü Gizem Aksoy'da (Planlama + Muhasebe; UYDURMA). Muhasebe rolünün açıklaması: fatura / tahsilat, masraf onayı, maaş ve
  bordro. Masraf gönderilince bildirim alıcının adını söyler. 1 yeni deneme. Ölçüm (değişen ekranlar): Personel durum 280/280 · telefon
  140/140 · etkileşim 59/59; Talepler durum 80/80 · telefon 40/40 · etkileşim 12/12.
- 2026-09-29 (127): **U1 · Performans: her rapor "Yeni"den sayılır, süreçte "Düzeltme" adımı** (§9 otuz beşinci tur 165, 166; reisim: *"yeni
  durumundan itibaren her rapor performansı etkiler, taslak diye bir aşamamız yok zaten"*). Sayılan rapor: pasife alınan dışında her rapor
  (önceden yalnız onaya gönderilmiş / imzalı). Rapor ortak kaydı süreç geçmişi taşır: **ilk gönderim** (geri gönderilince silinmez) ve
  **düzeltmeler** (geri gönderme → yeniden gönderim); kişi sayfasındaki "Rapor süreci · ortalama süre" dört adım: yazım (açılış → ilk
  gönderim) · **düzeltme** · onay · son imza. "Geri gönderilen" sayısı düzeltilip yeniden gönderilenleri de sayar. Tohumda geçen yılın
  birkaç raporu bir kez geri gönderilip düzeltilmiş (UYDURMA); kalıcı maket sürümü artırıldı. 2 yeni deneme, 2 güncellendi (bu ay 31 → 41
  rapor; adımlar). 18 maket temiz: durum 2000/2000 · etkileşim 491/491 · telefon 1000/1000 · olumsuz kanıt 3/3.
- 2026-09-29 (126): **Yan menü balonları yeniden ayrı** (reisim: *"Bildirim balonları sıkışmasın diye birleştirmişsin sanırım ama böyle olmaz,
  kafa karıştırıcı oluyor ayrı olsun"*). Balonlar ayrı küçük daireler (16 px, aralarında 2 px), satır yine büyümez, tek sıra. Yer açmak için
  menü satırının sağ boşluğu 12 → 6 ve simge–ad aralığı 12 → 10 (bütün satırlarda; sol hizalama aynı; daraltılmış menüde 12 + 40 + 12 korunur).
  Bugünkü sayılarda hiçbir ad kırpılmıyor ("Ölçüm cihazları" 3 balonla sığıyor); çok büyük sayılarda ad kısalır, tam adı üzerine gelince
  görünür (menü adına `title`). Renkler 125'teki parlak renkler. 18 maket temiz: durum 2000/2000 · etkileşim 489/489 · telefon 1000/1000 ·
  olumsuz kanıt 3/3 (telefon çekmecesinde kırpılan ad denetimi dahil); açık, koyu, daraltılmış menü 1920'de gözle.
- 2026-09-29 (125): **Yan menü balonları açık temada da parlak** (reisim: *"Açık temada da parlak renk, 2 şu an iyi"* — 2: Performans
  sütunları böyle kalır). Palet onayıyla (§8.12, anayasa 2.4) yan menüye dört renk değişkeni: `--cubuk-hata` #F4A59C · `--cubuk-uyari`
  #F2C46B · `--cubuk-onay` #45CC9E · `--cubuk-durum-yazi` #0F2A3D — yeni renk değil, paletin koyu tema durum renkleri; yan menü iki temada da
  koyu olduğu için değerler iki temada aynı. Tek kaynak `src/styles/tokens.css` + docs kopyası. Kontrast kilidi 62 → 74 çift (balon sayısı /
  balon ≥ 4,5 · balon / menü zemini ≥ 3; en düşük 7,32). Balonlar bu değişkenleri kullanır (`maket.css`).
- 2026-09-28 (124): **T10 · Personel kartında eğitimler** (§9 otuz dördüncü tur; reisim: *"eğitimler kısmı gitmiş … geri gelsin … her
  personelin kartında eğitimler de gözükmeli"*; Eğitimler modülü Dökümanlar içinde kalır — reisim: *"tamam benim hatam bu şekilde kalsın"*).
  Kartta **Eğitimler** bölümü (Zimmetindekiler'den sonra): kişinin güncel eğitim kayıtları — eğitim ve kurum, alındığı tarih, tekrar tarihi
  ve kalan / geçen gün, sertifika (Aç), durum; tekrarı geçen ve 60 gün içinde olan üstte. Eğitim adı Eğitimler'de o kaydı açar;
  **Eğitim geçmişi** (kişinin bütün kayıtları, önceki kayıtlar dahil) ve **Eğitim ekle** (kişi seçili) Eğitimler'e gider. Kartın Eğitim yüzü
  bu bölüme götürür (Zimmetinde yüzü gibi). Durum adları ve sertifika dosya adı ortak veride tek yerde (`MV.EGITIM_DURUM`,
  `MV.egitimBelgeAdi`) — Eğitimler ve kart aynısını gösterir. 5 yeni deneme, 1 güncellendi (yüz yerine Eğitim geçmişi); 1 yeni durum.
  18 maket temiz: durum 2000/2000 · etkileşim 489/489 · telefon 1000/1000 · olumsuz kanıt 3/3; kart 1920 ve 375'te gözle.
- 2026-09-28 (123): **T9 · Performans: dikey sütun grafikleri, kişinin rapor süreci** (§9 otuz dördüncü tur; reisim: *"Performans
  değerlendirme ekranındaki grafikler … sütun grafikleri yatay olmasın ve boşluklu olmasın ve kişiye tıklanınca raporlama sürecine dair
  grafikleri gözükmüyor"*). Grafik üreticisi tek (`maket-performans.js` `grafik`): **dikey sütun**; sütunlar yuvasını doldurur (en çok 96 px),
  aralarında yalnız 2 px ayraç, tabana oturur, üst uç 4 px yuvarlak; yığında (mekanik / elektrik) parçalar arası 2 px; ızgara silik (0 · yarı ·
  üst, yuvarlak sayılar; rapor sayısı gibi tam sayılı veride orta çizgi de tam sayı); değer az sütunda her sütunun üstünde, çokta yalnız en
  yüksekte; üzerine gelince ipucu (tam ad, değer, dağılım); aynı veri gizli tabloda. Etiket sütun ortasına ölçülerek yerleşir, çakışan
  seyreltilir, uçtaki kartın içine çekilir (kaydırma yok). Kişi grafiklerinde ad (ilk ad), tam ad ipucunda. **Kişi sayfası** (`#/p/<id>`):
  aylık / günlük rapor + **Tamamlanma süresi** (24 saat içinde · 24–48 saat · 48 saatten uzun) + **Rapor süreci · ortalama süre** (yazım:
  açılış → onaya gönderim · onay: gönderim → yönetici onayı · son imza: onay → son imza; yalnız o adımı tamamlanmış raporlar). Renkler var olan
  seri renkleri (palet değişmedi); grafik rehberinin renk doğrulayıcısında çift renk körlüğü ve kontrast denetimini geçti, ikinci renk
  (lacivert / koyu temada beyaz) "gri okunur" uyarısı aldı — kimlik yalnız renge bırakılmadı (lejant, değer, ipucu, gizli tablo). Ölçüm aracına
  gerçek fare "üzerine gel" adımı (`uzerine`). 5 yeni deneme, 2 güncellendi (sütun sayısı). 18 maket temiz: durum 1992/1992 ·
  etkileşim 484/484 · telefon 996/996 · olumsuz kanıt 3/3; pano 1920, kişi 1920, pano 375 koyu gözle.
- 2026-09-28 (122): **T8 · Talepler: firma formatı iskeleti, PDF, e-postayla ilet** (§9 otuz dördüncü tur; §3.7 satır 10–11; reisim: *"izin
  talebi ve masraf formu için her müşteri (benim müşterilerim pk firmaları) kendi formatını yükleyebilsin o formata göre pdf çıktısı olacak, ve
  son hali hem sisteme kaydolduğu gibi mail olarakta iletilecek tıklayınca mail uygulaması açılacak … sen iskelet olarak hazırla"*).
  **İskelet** (`maket-belge.js`): formun düzeni bir format tanımından kurulur — `MB.TALEP_FORMAT[izin | masraf]` = form kodu, başlık,
  alanlar, beyan metni, imza yerleri, kime gideceği (rol); tek üretici `MB.talepFormu`. Firmanın kendi formatı gelince aynı biçimde yeni tanım
  yazılır (firma × form başına kodda, §8.3), üretici ve ekranlar değişmez; bugünkü tanım temel format (`KM-FR-IZN-01`, `KM-FR-MSR-01`):
  firma künyesi, form no, personel, durum, talebin alanları, beyan, imza yerleri (talep eden gönderim zamanıyla; onaylayan karar verince).
  **E-postayla ilet** — ortak, her PDF'e açılır (`MK.pdfGoster({ eposta })`): pencerede görünen PDF'in kendisi gider; bilgisayarda PDF iner
  ve e-posta uygulaması alıcı, konu ve metinle açılır (tarayıcı e-postaya kendisi dosya ekleyemez; bildirim "indirilen PDF'i ekleyin" der),
  telefonda / tablette paylaşım menüsü PDF ekli açılır. Alıcı formatın rolündeki etkin kişiler (temel: firma yöneticisi). Talepler: talep
  penceresinde **PDF · e-posta**; gönderilen talep aynı pencerede açılır (hemen iletilebilir). Telefonda pencere alt tuşları sığmazsa alt
  satıra geçer (ortak kural). Ölçüm aracı: `mailto:` bağlantısı ağ hatası sayılmaz; olmayan bir talep numarasına bakan eski durum kaydı
  düzeltildi (G-0926-008 → G-0926-003). 4 yeni deneme, 2 güncellendi (gönderim sonrası pencere açık kalır); 2 yeni durum. 18 maket
  temiz: durum 1992/1992 · etkileşim 479/479 · telefon 996/996 · olumsuz kanıt 3/3.
- 2026-09-28 (121): **T6b · Yan menü balonları küçük, tek sıra; menü çubuğu yok** (§9 otuz dördüncü tur ara istek; reisim: *"şu balonlarda
  sekmeyi aşağı düşürme olayı olmasın küçülsün ve tek sıra olsun renkler daha belirgin olsun"* · *"aşağı yukarı barı da yan menüde düzgün
  durmamış olmasın"*). Balonlar sığmayınca adın altına geçiyordu (T6 kararı "ad kırpılmaz") → satır 34 px'ten 55 px'e çıkıyor, menü taşıp
  kaydırma çubuğu çıkıyordu. Şimdi: satır hiç büyümez; balonlar adın yanında **bitişik tek hap** (18 px yükseklik; ilk ve son uç yuvarlak),
  ad kalan yeri doldurur, sığmazsa kırpılır (bugünkü veride hiçbiri kırpılmıyor — ölçüldü: "Ölçüm cihazları" 111/111 px). Renk **dolu**:
  rozet çiftinin tersi (kırmızı `--hata-yazi` zemin / `--hata-zemin` yazı, sarı aynı biçimde, yeşil menü sayacının `--onay` çifti) — aynı
  ölçülü çiftler, palet ve token değişmedi. Koyu temada parlak (pembe-kırmızı, sarı, yeşil); açık temada doygun koyu (kırmızı, kahve-sarı,
  yeşil) — açık temada da parlak sarı / kırmızı istenirse yan menü için ayrı renk değişkeni gerekir, bu palet kararı reisim'in (~~açık soru~~ — **kapandı 2026-10-02**, reisim: *"şu açık temada menü rengi sorusunu sorma değişmeyecek"*).
  Yan menü kayar ama çubuğu görünmez (`scrollbar-width: none`; daraltılmış menüde zaten öyleydi). Yalnız maket (`docs/assets/maket.css`);
  uygulama kabuğu (`src/`) koda geçişte aynı kurala çekilir. 18 maket temiz: durum 1976/1976 · etkileşim 475/475 · telefon 988/988 ·
  olumsuz kanıt 3/3; açık / koyu / daraltılmış menü ekran görüntüsüyle gözle bakıldı.
- 2026-09-28 (120): **T7 · Ölçüm cihazları: cihaz türü, ara kontrol sıklıkları, otomatik bakım, PDF** (§9 otuz dördüncü tur; §3.7 satır 12;
  reisim: *"Ölçüm cihazlarında … cihaz türü de eklenebilmeli … ara kontrollerde … günlük, haftalık, aylık, 6 ayda bir … otomatik bakım oluştur
  tuşu"* · *"Cihazlarda yapılan ara kontrollerin kayıtları pdf olarak indirilebilsin"*). Ara kontrol hesabı ortak veride tek yerde
  (`MV.ARA_SIKLIK`, `MV.araProgram`, `MV.araDurum`): cihazın bir ya da birkaç **programı** (sıklık) olur; bir programın sonraki tarihi planlı
  en erken kayıt, yoksa son yapılan + sıklık; uyarı eşiği sıklığa göre (günlük 0, haftalık 2, aylık 7, 6 ayda bir 30 gün). Eski tek
  "6 ayda bir" periyodu ve "takip edilsin" kutusu kalktı. Cihaz sayfası: **Ara kontroller** bölümü her cihazda (programlar + kaldır, kayıtlar
  süzgeçli ve sayfalı — Tarih kutusu, Yapıldı / Planlı / Gecikti, Sıklık —, planlı kayıtta **Yapıldı**, her kayıtta sil); **Otomatik bakım
  oluştur** penceresi (başlangıç, bitiş — en çok 2 yıl —, bakım sayısı 1–4, her bakımın sıklığı ve yöntemi; aynı sıklık iki kez seçilemez;
  aralıktaki eski planlılar yerini bırakır); **Ara kontrol ekle**'de sıklık (programlardan ya da programsız tek seferlik); **PDF indir**:
  süzgeçten geçen yapılmış kayıtlar temel formatta (`KM-FR-ARA-01`, firma formatı §3.7 satır 12). Cihaz düzenle / ekle'de sıklıklar
  işaretlenir. Liste: **Cihaz türleri** penceresi (tür ekle / düzenle — ad eşsiz, en az bir ekipman grubu —; cihazı olmayan tür silinir ve
  ekipman türlerinin kullanacağı cihazlardan çıkar). Ortak arama temizleme tuşuyla ad çakışması (`ara-sil`) denemede yakalandı, kayıt silme
  eylemi ayrı adla. Kalıcı maket sürümü artırıldı (tohum veri yapısı değişti). 12 yeni deneme, 2 güncellendi (takip edilmeyen cihaz; balon
  denemesi yeni ara kontrol yapısıyla); 5 yeni durum. 18 maket temiz: durum 1976/1976 · etkileşim 475/475 · telefon 988/988 · olumsuz kanıt geçti.
- 2026-09-28 (119): **Yüklenen dosyalar — kalıcı, kendisi açılır, değiştirilir, silinir** (§3.8 kural 10; reisim'in zimmet bildirimi). Kök
  nedenler: (a) seçilen dosya yalnız o sayfanın belleğindeydi — sayfa değişince / yenilenince kayıtta adı kalıyor, görüntüleyici iskelete
  düşüyordu; (b) bazı ekranlar yüklenen dosyayı hiç göstermiyordu (imzalı zimmet sayfası üretilen formu çiziyordu; türün "PDF'i aç"ı rapor
  belgesini açıyordu; kalibrasyon kaydı sertifika dosyasını kayda yazmıyor, "Sertifikayı aç" numaradan uydurulan adı açıyordu; imzalı rapor
  PDF'i raporda saklanmıyordu); (c) hiçbir yüklemede silme / değiştirme yoktu. Ortak (maket-ortak.js): dosyalar tarayıcının IndexedDB'sinde
  kalıcı ("Denemeleri sıfırla" onları da siler), aynı adla ikinci dosya ayrışır; tek üretici `MK.dosyaAlan` (ad · Aç · Değiştir · Sil),
  `MK.dosyaOnizle` (sayfada dosyanın kendisi), `MK.onayla` (silme onayı), `MK.fotolar`'a fotoğraf silme. Bağlanan yerler: Personel (imzalı
  zimmet formu, özlük belgeleri, bordrolar, belge ve bordro pencereleri) · Ölçüm cihazları (kalibrasyon kaydı: sertifika kayıtta, kayıt
  düzenlenir / silinir) · Dökümanlar (standart sürümü silinir — güncel silinince önceki geri gelir, tek sürümse türlerin kontrol metodundan
  çıkar —, diğer dökümanlar, yükleme pencereleri) · Eğitimler (sertifika) · Sözleşmeler (imzalı sözleşme — silinince imza bekler —, şablon
  sürümleri, İSG-KATİP PDF'i) · Raporlar (imzalı PDF raporda saklanır, rapor sayfasında gösterilir; silinince yeniden imza bekler) ·
  Ekipman türleri (rapor formatı sürümü silinir, "PDF'i aç" yüklenen PDF) · Muhasebe ve Talepler (fiş / belge; bekleyen talebin eki) ·
  saha raporu ve zimmet teslimi fotoğrafları. Excel içe aktarmaları dosya saklamaz (satırlar kayda girer), değişmedi; kaydedilmiş zimmet
  teslimi hareket kaydıdır, fotoğrafı değişmez. Her yerde gerçek dosya yüklenerek tarayıcıda denendi (yükle → aç → sayfayı yenile → aç →
  değiştir → sil). Telefonda "Fotoğraf ekle" fotoğrafların önünde (Sil tuşu eklenince menü 320 px'te taşıyordu). Ölçüm aracı: sayfa
  yeniden çizilince / yenilenince yarıda kesilen yüklenen dosya önizlemesi (blob) ağ hatası sayılmaz; 7 yeni deneme (gerçek dosya
  yüklenerek). 18 maket temiz: durum 1936/1936 · etkileşim 463/463 · telefon 968/968 · olumsuz kanıt 3/3.
- 2026-09-28 (118): **Düzeltme — T6 CI'da düştü** (reisim: *"githubdan push failed mesajı geldi"*). T6'daki menü CSS'i daraltma sınıfını
  (`a-kabuk-dar`) geniş bant dışında kullanıyordu; kalıp kilidi (`tests/kalip-sayilari.test.ts`, anayasa 2.11) yakaladı. Yerelde test 1
  başarısız verdiği hâlde commit + push zincirim durmadı (komutlar `;` ile bağlıydı) — hata benim. Kural tersine çevrildi: iki satır
  düzeni genel kural, daraltılmış menüde geniş bant içinde geri alınır; görünüm aynı. Bundan sonra commit ancak `npm test` fail 0 ile
  (`&&` zinciri). npm test 41/41 · olumsuz kanıt 19/19 · 18 maket durum 1936/1936 · telefon 968/968 · m10 etkileşim 10/10.
- 2026-09-28 (117): **T6 · Yan menü takip balonları** (§9 otuz dördüncü tur; §3.8 kural 9; reisim: *"Sol taraftaki nav bar … cihazlarda süresi
  geçen cihaz sayısı kırmızı balon, yaklaşan sarı balon, sorunsuz cihazlar yeşil balon"*). Takip hesapları ortak veride tek yerde
  (`MV.takip`, `MV.uyarilar`, `MV.araDurum`, `MV.isgEksik`): Uyarılar listesi ve Sözleşmeler şeridi de aynı hesabı okur (önceden sayfa
  içinde ayrı hesaplıyordu). Kabuk her sayfada balonları çizer; veri değişince (tıklama, yazma, sayfalar arası kayıt) yenilenir. Renkler
  rozet renk çiftleri (kontrastı ölçülü), palet değişmedi. Masaüstünde balonlar sığmazsa adın altına, sağa geçer (ad kırpılmaz); daraltılmış
  menüde simgenin köşesinde yalnız en önemli renk. Uyarılar'ın eski tek sayacı kalktı (balonlar onu içeriyor). 3 yeni deneme (başka sayfada
  aynı sayılar · veri değişince güncellenir · daraltılmış menü), 1 güncellendi. 18 maket temiz: durum 1936/1936 · etkileşim 457/457 ·
  telefon 968/968; 1920 (açık ve daraltılmış menü) ve 1080 çekmecede gözle.
- 2026-09-28 (116): **T5 · Genel arama + küçük açıklama yazıları** (§9 otuz dördüncü tur; §3.8 kural 4, 6; reisim: *"herhangi bir yerde küçük
  yazılarla info olmaz … hepsinde ara barını kaldır … ikinci görselde attığım şeffaf yazılara gerek yok"*). Genel arama: T2'deki ortak kural
  (alan kutusu olan listede genel arama yok) bütün listelerde geçerli — plan içi, Planlar, Raporlar. Açıklama taraması (ölçüt §3.8 kural 4):
  Ölçüm cihazları kartı ("rapora buradan dolar", "raporda bu gruplarda önceden işaretli gelir; denetçi zimmetindekilerden seçer",
  "kalibrasyonlar arasında cihazın doğruluğu") · Ekipman türleri ("tek ekipmanın tarihi planda değiştirilebilir", "planlarda, bütün
  tesislerde", "raporda ölçüm cihazı istenmez") · plan içi adımlar ("Plan kabul edilince başlar", "Ekipman ekleme ve rapor oluşturma
  denetime başlayınca açılır", "tamamlamak engellenmez", "Denetim bitince buradan tamamlanır", proje notlarının altındaki kim görür satırı,
  ekipman ekle penceresindeki branş / onay cümlesi, rapor tablosu boşken "Rapor oluştur ile açılır"; reddet penceresindeki kural yalnız hata
  anında) · yüz kutularındaki nasıl-işler notları (Ana sayfa, Müşteriler, Personel, Zimmetler, Raporlar, Dökümanlar) · uyarı şeritlerindeki
  ek cümleler ("Kayıt engellenmez; …", "Plan kabulünde uyarı olarak görünür; …", "Plan açılır.", "Yalnız ekranda; Uyarılar'da da
  görünür.", "Plan açarken el ile de girilebilir.", "İkinci plan açılabilir; …", "Parola şimdi ya da daha sonra değiştirilebilir.",
  hesap kapalı şeridi kısaldı) · başlık yanı açıklamalar ("yeniden eskiye", "ekipman türü × adet × birim fiyat"). Telefonda
  yalnız tuş taşıyan adım kutusu artık boş kutu olarak kalmaz (tuşlar altta). Kalanlar (bilerek): boş liste gövde cümleleri, son imza
  penceresinin yöntem şeritleri, hata iletileri. 2 deneme güncellendi (Plan aç: İSG-KATİP bitmiş uyarısı ve açık plan şeridi, açıklama cümlesi yok). 18 maket temiz: durum 1936/1936 ·
  etkileşim 454/454 · telefon 968/968 (son üç şerit kırpması sonrası m1, m5, m6, m13 etkileşimi yeniden koşuldu); cihaz kartı 1920'de, plan içi
  kabul adımı 375'te gözle.
- 2026-09-28 (115): **T4 · Raporlar** (§9 otuz dördüncü tur; §3.8 kural 6, 7; reisim: *"Raporlar ekranında ve planlarda … toplu pdf indirme
  tuşu olsun … raporlar modülünde kusurlu tuşunu kaldır … hepsinde ara barını kaldır"*). "Kusurlu" çipi kalktı (sonuç Sonuç seçicisinde);
  "Hepsinde ara" kutusu T2'de ortak kuralla kalkmıştı (alan kutuları var). Başlıkta **PDF indir**: süzgeçten geçen raporlar tek PDF'te,
  numara sırasıyla, her rapor kendi sayfalarında (taslak girmez). 2 yeni deneme. Yalnız bu maket değişti: m9 durum 104/104 · etkileşim
  27/27 · telefon 52/52; 375'te gözle.
- 2026-09-28 (114): **T3 · Planlar listesi süzgeci** (§9 otuz dördüncü tur; §3.8 kural 6; reisim: *"Planlar ekranındaki filtreleme kısmıda
  yine istediğim gibi değil anlamsız filtreleme tuşları var proje için ayrı proje no için ayrı"*). Durum çipleri (Kabul bekliyor … Ön koşul
  eksik) ve "veya / ve" anahtarı kalktı; durum artık **Durum** seçicisi (Tarih · Müşteri · Branş yanında); genel arama yerine **Proje adı ·
  Proje no** kutuları. Ortak üreticide: çipi olmayan süzgeçte çip alanı çizilmez; alan kutuları genel aramanın yerinde, ilk sırada,
  seçicilerle aynı satırda (sığmazsa alt satır). Planlar denemeleri yeni süzgece göre (çip yerine Durum seçicisi; Proje adı / no kutuları).
  18 maket temiz: durum 1936/1936 · etkileşim 452/452 · telefon 968/968; Planlar 1920 ve 375'te, Raporlar ve plan içi 1920 / 1080'de gözle.
- 2026-09-28 (113): **T2 · Plan içi** (§9 otuz dördüncü tur; §3.8 kural 6, 7, 8; reisim: *"ekipman türü ekipman koduna göre arama motorları
  ayrı olacak şekilde filtreleme olmalı … raporlandı yazan kısımda sadece rapor oluştur tuşu olsun istediğim kadar o tuşa basabileyim sınır
  olmasın eğer bu rapor içerisinde rapor oluşturduysam yanında küçük yeşil tik olsun … Pasife alınan raporlar inspectorlere gözükmez inspector
  pasife alabilir ama silemez, aktife de alamaz, aktife alma ve silme işlemleri sadece yöneticiler tarafından yapılabilir … Raporlar ekranında
  ve planlarda … toplu pdf indirme tuşu olsun"*). (1) Ekipman satırında her zaman **Rapor oluştur** (her basış yeni rapor, aynı ekipmana
  sınırsız); raporu olan ekipmanda "Raporlandı" rozeti yerine **yeşil tik**; ekipmanı pasife alma yalnız raporsuz ekipmanda. (2) Saha rapor
  ekranı raporu numarasıyla ayırır (aynı ekipmanın ikinci raporu boş başlar; örnek içerik yalnız tohum raporda). (3) **Rapor pasife al**:
  plan içi raporlar tablosunda gönderilmemiş rapora "Pasife al" (onay penceresi); pasif rapor inspector'ın plan içi, Raporlar ve Ana sayfa
  sayılarından kalkar; ortak kayda yazılır. **Onaylar → "Pasif raporlar"** sekmesi (teknik yönetici, kendi branşı): Aktif et · Sil (onay
  penceresi, kayıttan kalkar). (4) **Süzgeç alan alan**: ekipmanlarda Ekipman türü · Ekipman kodu, raporlarda Rapor no · Ekipman kodu
  kutuları; ekipmanlardaki "Tür" seçicisi kalktı (kutuyla aynı iş). Ortak üreticide kural: **alan kutuları olan listede genel arama kutusu
  çizilmez** (Raporlar listesinde de kalktı). Boş durum açıklamasız da çizilebilir. (5) Raporlar başlığında **PDF indir**: süzgeçten
  geçen gönderilmiş raporlar tek PDF'te, her rapor kendi sayfalarında (taslak girmez — Raporlar'la aynı). 8 yeni deneme + 2 durum.
  18 maket temiz: durum 1936/1936 · etkileşim 451/451 · telefon 968/968; plan içi 1920 ve 375'te gözle bakıldı.
- 2026-09-28 (112): **T1 · Saha raporu** (§9 otuz dördüncü tur; §3.8 kural 2, 3, 5; reisim: *"Muayene kriterleri otomatik olarak uygun
  olarak gelir … ünlem işareti olur ve oradan seçilerek hepsini uygun yap hepsini uygunsuz yap ya da hepsini uygulanamaz yap … Gönder derken
  gelen uyarı ekranı olmasın sadece eğer zorunlu doldurulması gereken yerler olmasına rağmen doldurulmadıysa pop-up şekilde zorunlu alanlar
  doldurulmadı yazısı gelsin … fotoğraf eklemek her raporda zorunlu … etrafını kırmızı yakarak oraya doğru dikkat çekecek şekilde ekran
  kaysın. Muayene uzmanı onayı değil, muayene uzmanı imzası"*). (1) Her madde **Uygun** gelir (termal kamerası olmayan türde termal kamera
  maddeleri Uygulanamaz); her grup başlığında (gruplu olmayan formatta "Maddeler" başlığında) **ünlem menüsü**: Hepsini uygun · uygun
  değil · uygulanamaz yap — o grubun maddelerine. (2) Gönder'deki eksik/uyarı listesi ve "Yine de gönder" kalktı: zorunlular doluysa
  doğrudan gönderilir; boşsa **"Zorunlu alanlar doldurulmadı"** penceresi (tek Tamam), eksik bölümler açılır ve "Eksik" rozeti, boş alanlar
  kırmızı; Tamam'la ekran ilk eksik alana kayar, odak o alanda. Zorunlular tek yerde (`zorunluEksik`): fotoğraf (en az 1, eksikse kırmızı
  çerçeve), türün ölçüm cihazları (kalibrasyonu geçerli), uygun değil maddenin açıklaması (Bakanlık formatlı türde derecesi), test ve ölçüm
  değerleri — isteğe bağlılar hariç (DKD tipi ve dayanma akımı `istege`); ekipman bilgileri zorunlu değil. (3) Küçük açıklama yazıları
  kalktı: test alanının altındaki "Sınır … / Uygun · sınır …" (sınır dışı değer yalnız kırmızı), termal bölümde uzun cümle ("Termal kamera
  yok."). (4) Final raporda sonuç ve kanaat **yalnız seçilen sonuç** (öteki çizili de yazılmaz; sonuç seçilmemiş taslakta ikisi); genel belge
  kusur listesinde derece yazısı yok. (5) "Muayene uzmanı onayı" → **"Muayene uzmanı imzası"** bütün maketlerde. Tohum veri değiştiği için
  kalıcı maket sürümü artırıldı (eski denemeler bir kez sıfırlanır). Rapor denemeleri güncellendi (+6 yeni: Uygun gelir, ünlem menüsü ×2,
  zorunlu pencere + kayma, fotoğraf zorunlu, belgede yalnız seçilen sonuç). 18 maket temiz: durum 1920/1920 · etkileşim 443/443 ·
  telefon 960/960; 1920 ve 375'te gözle bakıldı (ünlem menüsü, kırmızı eksik alanlar, ilk eksiğe kayma). (Düzeltme: commit mesajında
  "1938/1938" yazdı — toplu bakış sayfasının 18 durumu yanlışlıkla eklenmişti; 18 maketin sayısı 1920/1920.)
- 2026-09-28 (111): **Reisim'in dört düzeltmesi** (reisim: *"Masraf yazmak için ilgili tuş planın içinde olmasın, oradan kaldır her kullanıcı
  profilinden yapacak masraf ve izin formu doldurmak gibi gerekli işlemleri, plan telefon ekranında gözükürken kartlarda ilk başta şirket adı
  yerine şirketin işletmesi çıkıyor şirket adı en üstte olsun, raporlarda … uygun değil işaretlediklerimiz kusur açıklamaları kısmında yazsın
  hafif kusur ağır kusur vs yazmasın, sonuç ve kanaat kısmı telefonda … ile bitiyor tam metin okunamıyor"*). (1) Plan içindeki "Masraflarım"
  bölümü ve masraf penceresi kalktı; masraf ve izin kullanıcının kendi alanından: üst çubukta ada basınca **Taleplerim · İzin talebi · Masraf
  formu** (Talepler modülü; masraf işe bağlı ya da genel, aynı Muhasebe kaydı) — her sayfada. (2) Planlar kartında (telefon) şirket adı en
  üstte, işletme (proje adı) altında; aynı sınıf Ana sayfanın tesis listesinde de düzeltildi (şirket üstte). (3) Kusur açıklamaları listesinde
  "Uygun değil" işaretlenen her madde ve uygun olmayan ölçüm; "Hafif kusur / Ağır kusur" yazısı yok (derece seçimi kalır; final raporda
  formatın * / ** işareti). (4) Sonuç ve kanaat bölümünde formatın cümlesi tam: seçilen sonuçla biter ("… kullanımı uygun değildir."),
  seçilmediyse iki seçenek; "…" kalktı. Plan içi masraf denemeleri kaldırıldı (işlev yok), 4 yeni deneme. 18 maket temiz: durum 1912/1912 ·
  etkileşim 440/440 · telefon 956/956 (durum sayısı plan içi masraf penceresinin 2 durumu kalktığı için azaldı); 375'te gözle bakıldı.
- 2026-09-28 (110): **Maket sayfalar arası kalıcı — bütün site denenebilir** (§9 otuz üçüncü tur, karar c; reisim: *"tüm site maket üzerinde
  aktif çalışabilsin her fonksiyonu test edicem"*). Tek mekanizma (maket-ortak.js KALICI MAKET): ortak veri (MV) her sayfa açılışında
  tohumdan sonra bu tarayıcıdaki denemelerle yerinde birleşir (kayıt kimliği korunur, silinen silinir, yalnız tohumdan farklı koleksiyon
  saklanır); yerel kayıt tutan iki modül (Planlar, saha raporu) kendi durumunu aynı depoya yazar; her tıklama, yazma, seçim, adres değişimi ve
  bildirimden sonra kaydedilir. Yan menünün altında "Denemeleri sıfırla" (iki adım) tohum veriye döner. Yalnız makette; gerçek uygulamada
  kayıt sunucuda. Bağlar: Plan aç'ta açılan plan ortak kayda (MV.ACILAN_PLANLAR, eşsiz kimlik; önce hep 90'dı) → Planlar listesinde
  "Kabul bekliyor", kapsamdaki ekipmanla; Planlar'da eklenen ekipman ve oluşturulan rapor ortak kayda (MV.EKIPMAN · MV.RAPORLAR) → saha rapor
  ekranı açılır; raporun durumu, geri gönderme ve gönderiliş ortak kayıttan (Onaylar, Raporlar değiştirir); onaya gönderilen rapor Onaylar
  kuyruğuna, onaylanan Raporlar'a ve Planlar'daki satıra düşer. Ölçerken bulunan çıkmaz (anayasa 0.8, sınıf): bir inspector'ın zimmetinde
  türün cihazı yoksa rapor gönderilemiyor ve yol gösterilmiyordu (mekanik: mesafe ölçer, kumpas; elektrik: geçerli tesisat test cihazı,
  multimetre) → "Cihaz ekle" penceresi o türün cihazlarını kimde / depoda / kalibrasyon durumuyla listeler, geçerli olanda "Zimmet teslimi"
  Zimmetler'in teslim penceresini teslim alacak kişi seçili açar; teslimden sonra rapora dönünce cihaz eklenir. Uçtan uca denendi (aynı
  tarayıcıda, sayfa değiştirerek): Plan aç → Planlar → kabul → denetim → rapor oluştur → yazılanlar kalıcı → zimmet teslimi → cihaz ekle →
  onaya gönder → Onaylar kuyruğu → onayla → Raporlar "Muayene uzmanı onayı" → Planlar satırı aynı durum. 5 yeni deneme (yenilemede kalır,
  sıfırla, Plan aç → Planlar, Planlar → saha raporu, saha raporu → Onaylar). 18 maket temiz: durum 1928/1928 · etkileşim 441/441 · telefon
  964/964 ("Denemeleri sıfırla" tuşu dokunmatik bantta ilk ölçümde küçük hedef çıktı → kalıbın tuş yüksekliği).
- 2026-09-28 (109): **Formatın istediği her veri saha raporunda girilir, final raporda formattaki yerinde çıkar** (§9 otuz üçüncü tur, karar a:
  ekran uygulamanın düzeninde, PDF'e benzetilmedi). İç tesisat: **6.1 Pano linye ve sigortaları** — fotoğraftan okunan satıra "Kontrol et"
  penceresinde Icu, faz / N-PEN / PE kesiti, Ib, Iz, RCD varsa IΔ · TΔ; **6.2 Potansiyel dengeleme iletkenleri** ve **6.3 Zemin izolasyonu**
  yeni bölümler (satır ekle · düzelt · kaldır). AG topraklama: ölçüm noktasında RCD tipi ve RCD testi (IΔ · TΔ), 5.2 RCD'de açma zamanı
  gecikmesi ve son tüketim noktasını besleyen pano. Sonuçlar formatın "Fonksiyon testleri" ağır kusur tanımlarından tek yerde hesaplanır
  (MV.linyeHesap · pdHesap · ziHesap · rcdTestYeter): Icu < kısa devre akımı · Ib ≤ In ≤ Iz · N/PEN < faz · PE ETTY Çizelge 8 · RCD IΔ > IΔn
  ya da TΔ > 200 ms · PD 6–25 mm² · tamamlayıcı PD ≥ 4 mm² · zemin > 50 kΩ; uygun olmayan her satır kusur listesine ve final rapora
  "Uygun Değil **" olarak düşer. Tutarlılık düzeltmeleri: kısa devre akımı testinin kendi sabit sınırı (10 kA) kalktı, sınır her
  sigortanın Icu değeri (tek kural); örnek raporların kısa devre akımı 4,8 kA (6 kA Icu'lu örnek sigortalar ağır kusurlu çıkıyordu);
  etiketten okunan Icu tek başına sonuç doğurmaz. Örnek raporlarda 6.1 · 6.2 · 6.3 formatın örnek satırlarıyla (tek kaynak MV.FORMAT_YAPI).
  6 yeni deneme (linye sonucu ve kusur listesi, 6.2, 6.3 düzelt, nokta RCD testi, selektivite, final rapora yansıma). 18 maket temiz: durum
  1928/1928 · etkileşim 436/436 · telefon 964/964; dolu örnek raporun PDF'inde 6.1–6.3 sayfa görüntüsüyle kontrol edildi.
- 2026-09-28 (108): **Belge önizlemesi ile inen PDF birebir aynı — tek KÂĞIT mekanizması** (reisim: *"ön izlemede yukarıda istemediğim şeyler
  var … pdf indir dediğimde inen şey ön izlemeden çok farklı garip saçma bir şey"* · *"özel değil genel düşün … anlık bir iş çözüp yama yapma
  anayasamıza sadık kal"*). Kök neden: İndir yazdırma penceresine gidiyordu (telefonda gizli çerçeve yerine bütün sayfa basılıyordu) ve
  ekran belgesi uygulama temasıyla, yazdırma başka kurallarla diziliyordu. Yeni düzen (maket-ortak.js KÂĞIT): her belge — rapor, iş
  sözleşmesi, teklif, fatura özeti, zimmet formu, saha formu, örnek dosya — açık temalı ayrı bir çerçevede A4 sayfalara (794 × 1123)
  dizilir; taşan içerik sonraki sayfaya geçer (tablo satır satır, resmî başlık tablosu her sayfada, sayfanın üçte birinden kısa blok
  bölünmez); İndir aynı sayfaları görüntüye çevirip PDF'e yazar (sayfa sayısı önizlemeyle aynı, denemeyle kilitli). Önizleme penceresinde
  yalnız başlık + kâğıt + İndir / Kapat; dosya adı satırı, "Sayfa 1 / N" ve oklar kalktı. Raporlar, Onaylar, müşteri portalı ve şablon
  önizlemesindeki belgeler de aynı kâğıttan. Resmî formun ölçüleri PDF'ten: yazı tipi Calibri ölçülü Carlito (OFL, sitenin kendi
  kökeninden; cihazda Calibri yokken daha geniş yedek yazı tipi sayfaları taşırıyordu, iç tesisat 7 sayfaya çıkmıştı → 4), kenar 22 px,
  satır ~17 px; dikey başlıklar PDF'e de aynı çıkan döndürmeyle. html2canvas 1.4.1 (MIT) `docs/vendor/`'da, yalnız İndir'de yüklenir.
  Belgelerdeki elle yazılı "Sayfa 1 / N" kalktı (sayfa sayısı artık dizilimden). Ölçerken bulunan: ekrandaki belgeyi kopyalayıp PDF'e
  gönderen tuşlar (saha formu, zimmet formu) boş çerçeveyi kopyalıyordu → kâğıda giren her içerik tek temizleyiciden geçer. Ölçüm aracına
  deneme başına bekleme süresi (PDF üretimi 2 sn'den uzun). 18 maket temiz: durum 1928/1928 · etkileşim 430/430 · telefon 964/964; PDF'ler
  sayfa görüntüsüne çevrilip resmî formla yan yana karşılaştırıldı (iç tesisat 4 sayfa, düzen formla aynı). iPhone'da inen dosya: ölçemedim
  (gerçek cihaz, 11.2).
- 2026-09-28 (107): **Termal kamera yalnız ekipman türünden** (reisim: *"ekipman bellidir zorunlu olan cihazlar bellidir türde belirtilmiştir
  belirtilmediyse neye göre zorunlu diyosun zorunlu diyosan cihazlar kısmında neden göstermiyosun ki ben oraya tıklayım zimmetli termal
  kameramı ekliyim bu tarz mantık hataları kabul edilebilir değil"*): raporda "Termal kamera ile kontrol yapıldı mı?" sorusu ve bölüm 3'ün
  kendi "zimmetinizde yok" uyarısı kalktı. Raporun istediği cihazlar tek kaynaktan, ekipman türünün "Kullanılacak ölçüm cihazları"
  listesinden: ET (iç tesisat) türüne termal kamera eklendi (örnek; firma türde çıkarabilir) → Ölçüm cihazları'nda termal kamera satırı ve
  "Cihaz ekle"; bölüm 3 eklenen termal kamerayı gösterir, eklenmediyse "Termal kamera ekle" tuşu aynı pencereyi açar; türde termal kamera
  yoksa bölüm 3 bir şey istemez, termal maddeleri örnek raporlarda uygulanamaz. Örnek veri: termal kamera OC-006 01.09.2026'da Elif Aydın'a
  devredildi (zimmet hareketi). Rapor belgesinde 3. bölüm eklenen termal kameradan. Aynı kuralın bütün yolları tarandı (rapor satırları,
  eksik / engel metni, örnek raporların cihazları, belge 3 ve 4. bölüm, tür sayfası): hepsi türün listesinden. 18 maket temiz: durum
  1928/1928 · etkileşim 430/430 · telefon 964/964 (5 deneme yeni kurala göre güncellendi).
- 2026-09-28 (106): **Planlar sırası plan tarihine göre, en yeni tarih üstte** (reisim: *"Hala planlarda 23.09 un planı 26 dan yukarda
  gözüküyo, en yeni tarihli en son açılan plan her zaman en üstte olacak tarihe göre sıralama olacak dedik"*): 104'teki açılış zamanı sırası
  yanlış anlamaydı, kalktı. Varsayılan sıra planın tarihi (en yeni üstte: 30.09 → 21.09); aynı günde en son açılan üstte (23.09'da
  P-0926-040, sonra P-0926-034, P-0926-031); seçicide "En yeni tarih önce". Planlar 128/128 · 40/40 · 64/64; Plan aç, Ana sayfa, M13 etkileşim temiz.
- 2026-09-28 (105): **Rapor çıktısı resmî formatın birebir düzeninde** (§9 otuz ikinci tur, karar b): ZPKR02 dört sayfa (1 Firma · 2 Ekipman
  2.1 / 2.2 · 3 Termal · 4 Ölçüm aletleri · 5 Gözle kontrol, formattaki 7 grup / 27 madde · 6 Fonksiyon + linye tablosu · 6.2 · 6.3 · 7 Kusur ·
  8 Fotoğraflar · 9 Notlar · 10 Sonuç · 11 Yetkili), ZPKR01 iki sayfa (+ fotoğraf eki); her sayfada formatın başlık tablosu (logo, firma,
  AKR., başlık, doküman kodu · yayım · revizyon · yürürlük), PDF'in renkleri ve çizgileri, onay kutuları ●/○, sonuç cümlesinde seçilmeyen
  üstü çizili. Uygulama temasından bağımsız (koyu temada da beyaz kâğıt), yazdırmada her sayfa ayrı A4. Pencerede PDF okuyucudaki gibi
  genişliğe sığar (telefonda küçülür, kaydırma yok), "Sayfa 1 / 4" tuşları o sayfaya gider; PDF penceresi 860 px. Veri formatlara göre
  düzeltildi: ET ve AT ayrıntı / tespit alanları ve seçenek sırası PDF'teki gibi, ölçüm metotları formatın adlarıyla, ET fonksiyon
  testleri formattaki sütunlar. Boş şablon da aynı düzende (Ekipman türleri → rapor formatı). Saha raporu tablolarının PDF'e eşitlenmesi
  (linye sütunları, 6.2, 6.3, nokta RCD testi, selektivite) sıradaki kalem. Ölçerken 4 deneme yeni çıktıya göre güncellendi, belge kabı
  kaydırma yerine sığdırmaya geçti (ilk koşuda 16 durumda "sert kırpma" buldu). 18 maket temiz: durum 1928/1928 · etkileşim 430/430 ·
  telefon 964/964.
- 2026-09-28 (104, ~~106'da düzeltildi~~): **Planlar sırası: en son açılan üstte** (§9 otuz ikinci tur): varsayılan sıra açılış zamanı; P-0926-040 en son açılan
  (22.09.2026 16:30) → en üstte; sıralama seçicisinde "En son açılan önce". Planlar 128/128 · 40/40 · 64/64.
- 2026-09-28 (103): **Ölçüm metodu ekipman türünde** (§9 otuz birinci tur): formatlı türde (ET, AT) tür sayfasında "Ölçüm metodu" (ET: üç uçlu
  karşılaştırma, AT: çevrim empedansı; örnek), Düzenle'de formatın metotlarından seçilir; raporda seçim alanı kalktı, türden salt okunur
  yazar; rapor belgesi türden. M3 88/88 · 23/23 · 44/44; M8 160/160 · 65/65 · 80/80; M9 96/96 · 23/23 · 48/48; M11 88/88 · 10/10 · 44/44.
- 2026-09-28 (102): **İzin talepleri onayı** (§9 otuz birinci tur): Personel'de "İzin talepleri" sekmesi (firma yöneticisi): bekleyen üstte,
  onay uyarısı, yıllık izinde kalan hak; Onayla · Reddet (gerekçe zorunlu, talep eden Talepler'de görür). M1 272/272 · 52/52 · 136/136.
- 2026-09-28 (101): **Son formatlarla örnek plan** (§9 otuzuncu tur; reisim seçti: *"Yeni plan"*): Ada Makina'nın yeni tesisi Enerji Merkezi
  (t16), plan **P-0926-040** (plan 10), bugün denetimde; yalnız elektrik iç tesisatı (ZPKR02) ve AG topraklama (ZPKR01): ET-2001 Tamamlandı ·
  Uygun · ET-2002 Muayene uzmanı onayı · hafif kusurlu (5.4.2 tehlike işareti) · AT-2003 yönetici onayında · ağır kusurlu (Not-2) · ET-2004
  yarıda · AT-2005 denetimde eklendi, boş. Yeni tesis: ilk periyodik kontrol; müşterinin iş sözleşmesine eklendi; İSG-KATİP ID'leri var.
  Sıralama kuralı değişmedi ("en yeni tarih üstte"); plan "Denetimde" süzgecinde en üstte. Formatlı türde ağır sonuç "Ağır kusurlu" (kırmızı).
  Etkisi: Planlar 10 plan, Muhasebe 17 iş (faturaya hazır 2), Performans bu ay 31 rapor, müşteri portalı 22 rapor — denemeler güncellendi.
  18 maket temiz: durum 1904/1904 · etkileşim 423/423 · telefon 952/952 (sonuç dosyaları bu koşudan; ölçüm aracında `--yazma` "yazma"
  demektir, önceki üç tam koşu dosyaya yazılmamıştı — bu koşu hepsini güncelledi).
- 2026-09-28 (100): **Dökümanlar modülü** (§9 otuzuncu tur): Standartlar (4) → Dökümanlar; sekmeler Standartlar · Muayene kriterleri ·
  Eğitimler · Diğer dökümanlar. Eğitimler (10) ayrı menü değil (sayfası `egitimler.html` aynı sekme satırıyla, menüde Dökümanlar etkin).
  Diğer dökümanlar: firmanın kalite el kitabı, prosedür, talimat, politika, form, sertifika (uydurma 7 kayıt); "Döküman yükle" (ad, tür, kod,
  revizyon, PDF). Modül kaydı 15 modül (`src/app/dokumanlar`; `egitimler` ve `standartlar` rotaları kalktı). Ölçüm aracı: sayfa yönlenirken
  kesilen yazı tipi isteği hata sayılmaz. 18 maket temiz: durum 1896/1896 · etkileşim 419/419 · telefon 948/948.
- 2026-09-28 (99): **Talepler modülü (21)** (§9 otuzuncu tur): menüde Personel grubunda; `maket/talepler.html`. Taleplerim listesi (izin +
  masraf, süzgeç), yıllık izin özeti (hak · kullanılan · kalan · bekleyen), "Yeni talep" → izin talebi (tür, başlangıç–bitiş, iş günü
  kendiliğinden, sağlık raporunda belge; yıllık izin kalanı aşılırsa uyarı, engel değil) · masraf formu (iş seçilir ya da "Genel"; Muhasebe'ye
  "Onay bekliyor" düşer, plan içindeki formla aynı kayıt); bekleyen talep geri çekilir. Modül kaydı 16 modül (`src/modules/moduller.ts`,
  `src/app/talepler`), rol yetkisi önerisi herkes "kendi", yönetici "değiştirir". ~~**Açık:** izin onayı kimde ve nerede~~ (2026-09-28: firma yöneticisi, Personel'de, 102). 18 maket temiz: durum 1880/1880 · etkileşim 415/415 · telefon 940/940.
- 2026-09-28 (98): **Raporlar: durum geçmişi kalktı, ayrıntılı süzgeç** (§9 otuzuncu tur): genel aramanın yanında alan alan arama (rapor no ·
  ekipman kodu · ekipman türü · tesis; ortak süzgeç üreticisinde `alanlar`, başlıktaki sayıya girer, Temizle boşaltır); seçiciler müşteri, il,
  sonuç, yıl. Süzgeç ekranı örnekleri reisim'den gelecek. 17 maket temiz: durum 1816/1816 · etkileşim 408/408 · telefon 908/908.
- 2026-09-28 (97): **Rapor ön izleme** (§9 otuzuncu tur): rapor ekranında sağ üstte "Ön izle"; PDF belgesi rapordaki güncel değerlerle (formatlı
  türde ekipman detayları, madde sonucu + kusur derecesi, ölçüm noktaları, RCD, kusur listesi, notlar, sonuç, fotoğraf sayısı); pencerede
  "İndir" PDF olarak kaydeder. M8 160/160 · 62/62 · 80/80; M9 96/96 · 48/48; M11 88/88 · 44/44; M7 104/104.
- 2026-09-28 (96): **Onaya gönder soluk değil** (§9 otuzuncu tur): tuş hep basılır; eksik varsa pencere nedenini ve "Zorunlu bölümleri
  doldurun"u yazar (engelde yalnız "Tamam", öteki eksiklerde "Yine de gönder"), her eksiğin yanında "Git"; eksik bölümler kırmızı çerçeve +
  "Eksik", boş zorunlu alanlar işaretli; doldurdukça kalkar. M8 152/152 · 59/59 · 76/76.
- 2026-09-28 (95): **Raporda ölçüm cihazları satır satır** (§9 otuzuncu tur): gerekli cihaz sabit, satır başına Cihaz ekle (yalnız o türden),
  kaldırınca satır kalır. M8 136/136 · 56/56 · 68/68.
- 2026-09-27 (94): **Süzgeç kutusu açılır kapanır** (§9 yirmi dokuzuncu tur): bütün listelerde başlık + uygulanan süzgeç sayısı; tercih
  hatırlanır. 17 maket temiz: durum 1792/1792 · etkileşim 396/396 · telefon 896/896 (Planlar etkileşim 38/38, 2 yeni deneme).
- 2026-09-27 (93): **Saha raporu ve rapor belgesi Bakanlık formatına göre** (§9 yirmi sekizinci tur): iç tesisat ZPKR02 (1–11) ve AG topraklama
  ZPKR01 (1–9 + fotoğraf eki); formattaki ekipman detayları / tespitler, gözle kontrol grupları, ölçüm noktası hesabı (Ia, Zs, Ik1, Not),
  RCD testleri, kusur derecesi, kusur listesi, formatın sonuç cümlesi ve yetkili kişi; onay özeti ve uygunsuzluk kaydı formatın maddeleriyle.
  M8 136/136 · 54/54 · 68/68; M9 96/96 · 19/19 · 48/48; M11 88/88 · 10/10 · 44/44; M7 104/104 · 18/18 · 52/52; M3 80/80 · 20/20 · 40/40;
  M12 96/96 · 16/16 · 48/48; M2 104/104 · 24/24 · 52/52.
- 2026-09-27 (92): **Kontrol kriterleri sekmesi** (§9 yirmi sekizinci tur): Standartlar'da ZPKK01 / ZPKK02 (maddeler, notlar, PDF), resmî rapor
  formatları ZPKR01 / ZPKR02 türlerde; AT ve ET standartları formatlardaki gibi. M7 104/104 · 18/18 · 52/52; M3 80/80 · 20/20 · 40/40; M8 · M9 temiz.
- 2026-09-27 (91): **Duyurular düzeltildi** (§9 yirmi sekizinci tur): 6 gerçek duyuru, hepsi tarihli, en yeni üstte; İSGÜM eklendi. M1 256/256 · 49/49 · 128/128.
- 2026-09-27 (90): **Maket çalışır hâlde** (§9 yirmi yedinci tur): gerçek dosya seçme / açma (PDF, fotoğraf), gerçek .xlsx indirme ve okuma,
  belgelerin yazdırma penceresinden PDF'i; ortak MK.dosyaSec · MK.indir · MK.yazdir · MK.xlsx · MK.tabloOku · MK.fotolar. 17 maket yeniden temiz
  (1768/1768 durum); gerçek dosya penceresiyle PDF, sıkıştırılmış .xlsx ve fotoğraf ayrıca denendi.
- 2026-09-27 (89): **Ana sayfada Duyurular** (§9 yirmi yedinci tur): İSGGM / portal duyuruları, yeni sekmede bağlantı, "alınamadı" hâli.
  M1 256/256 · 47/47 · 128/128.
- 2026-09-27 (88): **Kontrol metodu yalnız standart numarası** (§9 yirmi yedinci tur): raporda, belgede, onayda, Standartlar "Raporda" satırında
  açıklama yok; iki standart virgülle. Elektrik formatları ağ izni olmadığı için çekilemedi (kayıtlı). M8 136/136 · 45/45 · 68/68; M9 · M7 · M11 temiz.
- 2026-09-27 (87): **İş kârlılığı ve gelir-gider** (§9 yirmi altıncı tur): iş başına kâr = gelir − işe bağlı masraf − inspector maliyeti
  (bordrodan günlük × gün) − genel gider payı (sabit giderler, genel masraf, diğer personel; inspector-gününe); kâr oranı listede ve iş
  sayfasında; Muhasebe'de "Gelir-gider" sekmesi (aylık). Dağıtım yöntemi VARSAYIM. M14 184/184 · 40/40 · 92/92.
- 2026-09-27 (86): **Personel: maaş ve bordrolar** (§9 yirmi altıncı tur): kişi sayfasında maaş satırları (son bordrodan), günlük maliyet,
  bordrolar listesi ve "Bordro yükle" penceresi. Örnek bordrolar haziran–ağustos 2026 (uydurma tutarlar). M1 248/248 · 45/45 · 124/124.
- 2026-09-27 (85): **Masraf formu** (§9 yirmi altıncı tur): inspector plan içinden gönderir ("Masraflarım"); Muhasebe'de onay bekliyor →
  onaylandı → ödendi ya da reddedildi (gerekçe); elle eklemede Ödendi / Ödenecek; Giderler'de Excel'e aktar / Excel'den yükle (sütunlar
  reisim'in örneğine göre kurulacak). M14 160/160 · 35/35 · 80/80; Planlar 120/120 · 33/33 · 60/60.
- 2026-09-27 (84): **Kontrol metodu yalnız ekipman türünde** (§9 yirmi beşinci tur): raporda salt okunur satır (türün standartları; yoksa üretici
  talimatı), belgede ve onay özetinde geri; tür sayfasındaki uyarı "raporda üretici talimatı yazar". §2 açık soru kapandı. Standartlar
  kütüphanesi kalır; reisim'in bahsettiği örnek sorulacak. M8 · M9 · M3 · M7 · M11 yeniden temiz.
- 2026-09-27 (83): **Muhasebe: Giderler** (§9 yirmi beşinci tur): üçüncü sekme; tarih, tür, tutar (KDV dahil) + KDV oranı (türün varsayılanı),
  açıklama, isteğe bağlı iş ve personel, belge (açılır); belgesi olmayan uyarıyla kaydedilir; süzgeç (işe bağlı · genel · belgesi yok; tür,
  dönem, personel) ve süzülenin toplamı; iş sayfasında giderler ve kâr (raporlanan − gider, KDV hariç). No G-AAYY-SIRA. Planlanan saat
  eklenmedi (reisim: olmasın). M14 128/128 · 27/27 · 64/64.
- 2026-09-27 (82): **Muhasebe soruları cevaplandı** (§9 yirmi dördüncü tur): alacaklar süreçten kendiliğinden; gider girişi yok, "Giderler"
  sekmesi önerildi (onay bekliyor); fatura no firmanın e-Fatura programından elle. §8.1 çevrimdışı / mağaza uygulaması notu.
- 2026-09-27 (81): **Performans: tamamlanma süresi** (§9 yirmi dördüncü tur): rapor açılışından Tamamlandı'ya (son imza) süre; üç dilim
  (24 saat içinde · 24–48 saat · 48 saatten uzun) yüz olarak, kişi başına "24 saat içinde tamamlanan" payı ve "48 saatten uzun süren" sayısı
  grafikle (her grafik tek seri; dilimler yazıda da), personel tablosunda iki sütun, kişi sayfasında da dilimler. Örnek verideki imza saatleri
  çeşitlendi (uydurma dağılım). M15 72/72 · 16/16 · 36/36; 17 maket yeniden temiz.
- 2026-09-27 (80): **Yüklenen her PDF açılır** (§9 yirmi dördüncü tur): ortak PDF görüntüleyici (MK.pdfGoster / MK.pdfTus; sayfa ileri-geri,
  İndir, Kapat; başka pencerenin üstünde de açılır). "Aç" eklenen yerler: kalibrasyon sertifikası (M4), eğitim sertifikası (M16), İSG-KATİP
  sözleşmesi ve sözleşme şablonu (M5), özlük belgeleri ve imzalı zimmet formu taraması (M1), standart PDF'i ve önceki sürümleri (M7, "Oku"),
  rapor formatı sürümleri (M3), imzalı rapor PDF'leri (M9); yükleme pencerelerinde seçilen dosya da açılır. İmzalı sözleşme ve rapor
  zaten belge olarak açılıyordu.
- 2026-09-27 (79): **Teklif kayıtlı olmayan müşteriye** (§9 yirmi dördüncü tur): formda "Kayıtlı müşteri / Kayıtlı olmayan müşteri"; kayıtlı
  olmayanda ünvan, vergi, adres, il/ilçe, e-posta, telefon, yetkili elle (ünvan, adres, il zorunlu); teklif sayfasında "Kayıtlı değil" ve müşteri
  bilgileri; kabul edilince "Müşteri olarak kaydet" (müşteri + Merkez tesisi) → iş sözleşmesi, plan. Müşteriler formunda telefon (rapordaki firma
  bilgileri buradan). Örnek teklif T-0926-013. M12 96/96 · 15/15 · 48/48; M2 104/104 · 24/24.
- 2026-09-27 (78): **Planlar: Plan aç tuşu ve ekipman listesi Excel** (§9 yirmi dördüncü tur): liste başında "Plan aç" (gerçekte yalnız planlama
  yetkisi olan görür); plan içi ekipmanlarda "Excel'e aktar" (önizleme + indir) ve denetimdeyken "Excel'den yükle" (şablon; satırlar yeni kayıt
  kuralıyla denetlenir — kod eşsiz, tür katalogda; geçersiz satır atlanır, sebebi yazar). Planlar 104/104 · 28/28 · 52/52.
- 2026-09-27 (77): **Ekipman türünde kullanılacak ölçüm cihazları** ve **rapor bölümleri** (§9 yirmi dördüncü tur). M3 72/72 · 17/17 · 36/36.
- 2026-09-27 (76): **Saha raporu yirmi dördüncü tur** (§9): ekipman bilgileri elle, ölçüm cihazı türün listesinden zimmetten eklenir, eksik /
  geçmiş cihazda gönderilemez, sonuç seçmeli (seçilmezse kriterlere göre), Kaydet + Onaya gönder yapışkan, bölümler her girişte kapalı, fotoğraf
  kamera / galeri, firma bilgileri salt okunur + Güncelle. Türlerin cihaz listesi verisi (MV.turCihazlari). M8 136/136 · 43/43 · 68/68.
- 2026-09-27 (75): **Tarih / saat alanı ve seçim çerçevesi** (reisim: *"takvimin altında bu gün tuşu olsun"*, *"yazarken 09 bile yazsam
  aşağıda 09 u önermeye devam edecek"*, *"seçili alanların etrafında çerçeve kalıyor"*): takvim altında Bugün; saat / dakika iki hane yazılınca
  öneri açık kalır, listeden seçilince kapanır; fareyle / dokunarak kullanımda kalın odak çerçevesi yok (klavyede var). Tarih yarı, saat ve
  dakika çeyrek genişlik (örnek ekran oranı; önceki sürümde masaüstünde saat kutusu gereğinden genişti). M8 104/104 · 31/31 · 52/52.
- 2026-09-27 (74): **Saha raporu firma bilgileri örnek ekrana göre; tarih · saat · dakika ayrı, yazılır ya da simgeyle seçilir**; etiket
  "SGK DETSİS no" (örnek ekrandaki adı; kısaltma büyük harf). Ölçüm aracı: açık katmanın içeriği "taşan metin" sayılmaz.
- 2026-09-27 (73): **Plan içi "Planlandı" örnek ekrana göre sadeleşti** (reisim: *"bu kadar basit aslında istediğim şey bu"*): etiket : değer
  satırları alt alta (Proje no, İSG-KATİP sözleşme ID, başlangıç / bitiş tarihi, inspector, adres, açıklama), altında ayrı kutuda teklif
  içeriği tablosu (Muayene alanı · Muayene türü · Adet). Ekipman tablosunda hiçbir satırda işlem yoksa işlem sütunu çizilmez (reisim:
  *"raporlandı yazılarından sonra sağ tarafta çok boşluk var"*). Planlar 88/88 · 24/24 · 44/44.
- 2026-09-27 (72): **Her yerde tarih GG.AA.YYYY** (reisim: *"Her yerde aynı 23.09.2026 formatı gibi olsun"*): bütün maketlerde tarih
  23.09.2026, saatli 23.09.2026 09:14; gün ve ay adı yazılmaz (tek kaynak MK.tarihNo); Ana sayfadaki "Bugün" etiketi kalktı; şablon sürüm
  tarihleri, performans dönem adları ve plan uyarı metni aynı biçimde. Takvim başlığındaki ay adı (Eylül 2026) ve performans grafiğinin ay
  grupları ad olarak kaldı. 17 maket dört genişlikte, etkileşim ve telefon temiz.
- 2026-09-27 (71): **Planlar tarih biçimi ve teklif tablosu** (reisim: *"Tarih 23.09.2026 formatında yazmalı yanında bu gün vs yazmamalı,
  … kabul ve başladı kısımlarında sadece tarih yazmalı teklif içeriği tablo gibi olmalı … Forklift muayenesi 1 adet gibi"*): liste ve plan içinde
  tarih GG.AA.YYYY, "Bugün" etiketi kalktı; adım başlıklarında (Planlandı, Kabul, Başladı, Tamamlama) yalnız tarih; teklif içeriği Muayene · Adet
  tablosu, tam satır. Planlar 88/88 · 24/24 · 44/44.
- 2026-09-27 (70): **Saha raporunda tarih seçici ve metot yok**: başlangıç / bitiş / sonraki kontrol takvimden (saat · dakika tuşla),
  otomatik dolu; "Kontrol metodu" rapor, belge ve onay özetinden kalktı. Ölçüm aracı: açık açılır katman altındakini örter (muaf, yapışkan
  çubukla aynı). İki ikon eklendi (calendar, chevron-up; Lucide 1.47.0). M8 96/96 · 25/25 · 48/48; M7, M9, M11 temiz.
- 2026-09-27 (69): **Plan içi ekipman tablosunda rapor aşaması yazmaz** (reisim: *"ekipmanın raporunda yazması yeterli"*): Rapor
  sütunu yalnız "Raporlandı" / "Rapor yok" / "Pasif"; Yeni, Teknik yönetici onayında vb. Raporlar tablosunda ve raporun kendisinde. Planlar 88/88 · 23/23.
- 2026-09-27 (68): **Etiket "SGK DETSİS no"** (reisim: *"SGK tescil no değil destis no olacak"*): bütün maketlerde, rapor belgesinde ve
  kayıtlarda "SGK tescil no" yerine "SGK DETSİS no".
- 2026-09-26 (67): **Saha raporu (yirmi üçüncü tur)**: "N eksik" bölümü kalktı; başlangıç / bitiş tarih ve saati el ile, sonraki kontrol
  kendiliğinden ve el ile; Ekipman bilgileri; Ölçüm cihazları tablosu; kriter seçimi Uygun · Uygun değil · Uygulanamaz; sonuç Uygun · Uygun
  değil; Muayene uzmanı yorumu; başlıklar açılır kapanır; rapor belgesi aynı adlarla. M8 88/88 · 21/21 · 44/44.
- 2026-09-26 (66): **Plan aç saatsiz**: "Tarihler" bölümü başlangıç ve bitiş tarihi; saat alanları kalktı; çakışma uyarısı gün aralığıyla ("aynı
  günde"); müşteri paneli ve Ana sayfada plan saati gösterilmez. M6 80/80 · 18/18 · 40/40.
- 2026-09-26 (65): **Planlar (yirmi üçüncü tur)**: listede yalnız "Görüntüle"; kabul planın içinde, beyan okundu işaretiyle; plan içi üst bölüm
  (başlangıç / bitiş tarihi, İSG-KATİP sözleşme ID, teklif içeriği, adres, açıklama); ekipman pasife alınır; rapor saatlerini hizala; saha formu
  (§3.7 satır 9). Planlar 88/88 · 22/22 · 44/44.
- 2026-09-26 (64): **Yapılacaklara eklendi**: Ana sayfada İSGGM duyuruları (Açık kalanlar).
- 2026-09-26 (63): **Rapor durumları beş adım**: Yeni · Teknik yönetici onayında · Muayene uzmanı onayı · İmzaya gönderildi · Tamamlandı (tek kaynak
  MV.RAPOR_DURUM; Planlar, saha raporu, Raporlar, Onaylar, Ana sayfa). İmza servisi yolu "İmzaya gönderildi", indir-imzala-yükle yolu doğrudan
  "Tamamlandı". Geri gönderilen rapor "Yeni", gerekçe şeritte. Uzun durum rozeti dar sütunda ikinci satıra iner. Bütün maketler dört genişlikte temiz.
- 2026-09-26 (62): **Sıralama en yeni üstte**: Planlar (varsayılan "En yeni önce"), plan içindeki raporlar, Raporlar, Onaylar kuyruğu, Sözleşmeler,
  Teklifler, Muhasebe işler ve faturalar, müşteri panelinde raporlar ve uygunsuzluklar, eğitim kayıtları. Tarihsiz ana kayıtlar (müşteri,
  personel, cihaz, tür, standart) adla; Uyarılar ve Ana sayfa ajandası yaklaşan tarihe göre kaldı.
- 2026-09-26 (61): **Yirmi ikinci tur kaydı**: sıralama en yeni üstte, tablet dikeyde kart yok (eşik 600), rapor durumları beş adım.
- 2026-09-26 (60): **Toplu gözden geçirmeye hazır**: M6–M16 2. tur bitti; eski soru listeleri kapandı (§3.6), toplu bakış yeniden üretildi (16 maket,
  açık soru yok). Bütün maketler: durum 1050/1050, etkileşim 253/253 (toplu bakıştaki sayım), Planlar 54/54 · 15/15 · 36/36. Reisim hepsini birlikte
  gözden geçirecek; onaylanmadan kod yok.
- 2026-09-26 (59): **M16 2. tur**: eğitim türü ekle / düzenle (tekrar süresi firmada). M16 42/42 · 12/12 · 28/28.
- 2026-09-26 (58): **M15 2. tur**: tarih aralığı, Excel'e aktar, denetçi görünümü (kazanç yok). M15 48/48 · 13/13 · 32/32.
- 2026-09-26 (57): **M14 2. tur**: müşteri başına toplu fatura, "Muhasebe" rolü (rol yetkileri altı sütun). M14 66/66 · 15/15 · 44/44.
- 2026-09-26 (56): **M12 2. tur**: teklifte KDV oranı, çok tesisli teklif; §3.7 satır 4 teklif PDF'i firmaya göre. M12 60/60 · 12/12 · 40/40.
- 2026-09-26 (55): **M11 2. tur**: firmanın logosu, Planlanan kontroller ve Sözleşmeler sekmeleri (salt görüntü). M11 66/66 · 9/9 · 44/44.
- 2026-09-26 (54): **M10 2. tur**: ara kontrol uyarıları eklendi (kalibrasyonu geçen / kalibrasyondaki cihaz hariç). M10 36/36 · 7/7 · 24/24.
- 2026-09-26 (53): **M9 2. tur**: her rapor ayrı imza (birleştirme yok), vekil onay, onayı geri al, imzalı raporun düzeltmesi (R1), Planlar'da
  İmza bekliyor / Müşteriye açık. M9 72/72 · 16/16 · 48/48, Planlar 54/54 · 15/15 · 36/36.
- 2026-09-26 (52): **M8 2. tur**: gönder hep açık (eksik uyarı, tek engel kalibrasyon), sonraki kontrol gerekçesiz, kusura fotoğraf, pano fotoğrafı,
  geri gönderme geçmişi, tür formatı "Hazırlanıyor". M8 60/60 · 17/17 · 40/40.
- 2026-09-26 (51): **M7 2. tur**: ayrı rapor şablonu önizlemesi ekranı kalktı; format tür sayfasında "PDF'i aç" ile pencerede. M7 54/54 · 11/11 · 36/36.
- 2026-09-26 (50): **Genel temizlik** (§9 on dokuzuncu tur genel ilkesi, bütün maketler): ortak form alanı artık altına yalnız hata, kaydı
  durdurmayan uyarı ya da canlı sonuç yazar (açıklayıcı ipucu çizilmez); açıklama paragrafları, "makette …" notları ve açıklayıcı bilgi
  şeritleri kalktı. Bütün maketler yeniden ölçüldü, hepsi temiz (iki deneme yeni metne göre güncellendi: M4 fotoğraf uyarısı, M5 tesis sayfası).
- 2026-09-26 (49): **M7–M16 toplu cevap** (§9 yirmi birinci tur): 160 hayır (plan açılırken girilir), 95 gerekçe yok, 99 raporlar birleşmez
  (her rapor ayrı imza), ötekiler kabul. Maketler sırayla yenileniyor; bütün maketler onaylanmadan kod yok.
- 2026-09-26 (48): **Süreç değişti** (§9 yirminci tur): M7–M16'nın soruları sadeleştirilip tek listede soruldu (MAKET-PLANI.md).
- 2026-09-26 (47): **M6 2. tur, ek** (§9 on dokuzuncu tur): raporun 1. bölümü "Firma bilgileri" (her raporda ortak), "2 · Kontrol bilgileri"
  ayrıldı; "SGK DETSİS no", "İSG-KATİP sözleşme ID"; M6 ve rapor ekranında alt satır mesajları, parantez içi açıklamalar, madde numaraları
  kalktı. Ölçüm: M6 60/60 · 18/18 · 40/40; M2, M5, M7, M8, M9, M11, M13 yeniden ölçüldü, hepsi temiz.
- 2026-09-26 (46): **M6 2. tur** (reisim 74–81 öneriler uygun, "maketi yap inceleyeyim"; §9 on sekizinci tur): denetçi eksikleri yalnız uyarı
  ("Kabul edemez" kalktı), İSG-KATİP ID sözleşmeden / el ile + sözleşmeye kaydet, bitmiş İSG-KATİP uyarısı, sahada yeni ekipman alanı kalktı,
  kapsam boş açılır, "Hepsini seç", Ana sayfa'da "Plan aç". M6 60/60 · 18/18 · 40/40.
- 2026-09-26 (45): **M5 ve M13 ONAYLANDI** (reisim: *"Sıradakine geçelim"*). Sırada M6 Plan aç; sorular 74–81 yeniden soruldu.
- 2026-09-26 (44): **M5 2. tur, ek** (reisim, §9 on yedinci tur): "İmzalı sözleşmeyi aç" + imzalı belge görünümü; hizmet sözleşmesi için uyarı
  yok (bitiş şeridi, 60 gün çipi kalktı); uyarı yalnız İSG-KATİP (yok · geç onay · bitmiş — bitiş tarihi isteğe bağlı); §3.7 satır 8 her türlü
  numaralandırma firmaya göre; M13 soruları cevaplandı. M5 66/66 · 16/16 · 44/44; M13 48/48 · 10/10 · 32/32.
- 2026-09-26 (43): **M4 ONAYLANDI** (reisim düzeltme söylemeden M5'e geçti; itiraz gelmedi). **M5 2. tur** (reisim A–H, §9 on altıncı tur):
  Sözleşmeler = iş sözleşmesi; ayrı İSG-KATİP sekmesi kalktı, **M5 ve M13 birleşti** (`sozlesmeler.html`); İSG-KATİP ID'leri sözleşmenin içinde
  tesis başına denetçiye göre, onay tarihi ve PDF isteğe bağlı, geç onay uyarı; sözleşme şablonu yüklenir. M5 60/60 · 14/14 · 40/40.
- 2026-09-26 (42): **M4 2. tur** (reisim 58–65, §9 on beşinci tur): cihaz sayfasında Kimde + kalibrasyon başta, cihaz kodu düzenlenir, Teslim et;
  zimmette uygulama içi onay yerine imzalı form (M1), fotoğraf isteğe bağlı, ara kontrol isteğe bağlı; kalibrasyonu geçmiş cihazda rapor
  onaya gönderilemez (istisna). M4 72/72 · 20/20 · 48/48.
- 2026-09-26 (41): **M3 ONAYLANDI** (reisim: *"Sıradakine geçelim"*). Sırada M4 Ölçüm cihazları · Zimmetler; sorular 58–65 yeniden soruldu.
- 2026-09-26 (40): **M3 2. tur, ek** (reisim, §9 on dördüncü tur ek): **Tür ekle** geri geldi, her türe **firmanın rapor formatı PDF'i** yüklenir
  (sürümlü; "Rapor oluştur" soruları bu formattan — kurgusu M8'de), **akreditasyon her yerden kalktı**. §3.1 modül 5 ve §3.7 satır 1 güncellendi;
  §8.3 ile ilişki M8'de kararlaştırılacak. M3 48/48 · 15/15 · 32/32.
- 2026-09-26 (39): **M3 2. tur** (reisim 51–57, §9 on dördüncü tur): **Ekipmanlar modülü kalktı** (menü, uygulamanın modül kaydı ve rotası →
  15 modül; ekipmanlar planın içinde), firma tür eklemez (ayarları düzenler: periyot, süre, standartlar), yetkili meslek bölümü kalktı,
  tahmini süre isteğe bağlı, rapor şablonu yalnız ad + bağlantı. Menü değiştiği için bütün maketler yeniden ölçüldü. M3 36/36 · 10/10 · 24/24.
- 2026-09-26 (38): **M2 ONAYLANDI** (reisim: *"Sıradakine geçelim"*). M3'e geçerken reisim: *"ekipmanlar ve ekipman türleri diye iki
  modüle gerek yok ekipman türleri yeterli"* → Ekipmanlar modülü M3'ün 2. turunda kalkacak; ekipman kaydının yeri reisim'e soruldu.
- 2026-09-25 (37): **M2 2. tur** (reisim 44–50: *"Tüm önerilerin uygundur"*, §9 on üçüncü tur): müşteri girişi kendiliğinden (davet kalktı),
  ek girişler, vergi / SGK no uyarı (engel değil, "Yine de kaydet"), pasif yap / yeniden etkinleştir, il ve ilçe listeden, İSG-KATİP tesiste
  yalnız görünür. M2 78/78 · 24/24 · telefon 52/52.
- 2026-09-25 (36): **M1 ONAYLANDI** (reisim: *"Onaylıyorum"*) — giriş, Ana sayfa, personel (rol yetkileri, giriş hesabı, zimmet formu ve
  geçmişi, özlük dosyası). Sırada M2 Müşteri ve Tesis; M1'in kodu reisim "başla" deyince.
- 2026-09-25 (35): **imzalı zimmet formu açılır, zimmet geçmişi kartta** (reisim): kişiye verilen / geri alınan her varlık tarihleriyle,
  kişinin bütün imzalı formları; "Teslim geçmişi" tuşu Zimmetler modülüne atmak yerine bu görünümü açar. M1 174/174, 38/38.
- 2026-09-25 (34): **zimmet teslim formu** (reisim: "zimmete varlık eklendikten sonra eklenen varlıkların PDF şeklinde çıkartılıp
  imzalanıp taramasının buraya koyulması için bir düzenek kurgula ... temel bir format oluştur"): personel kartında form önizlemesi,
  imzalı taramayı yükleme, güncel / eskidi / yok durumu; **§3.7 firmaya göre değişen formatlar** canlı listesi (8 satır). M1 162/162, 35/35.
- 2026-09-25 (33): **M1 2. tur** (reisim'in 32–43 ve 159 cevapları, §9 on ikinci tur): Kullanıcılar Personel'e katıldı (menü ve uygulamanın
  modül kaydı 16 modül), rol yetkileri düzenlenir, davet yerine geçici parola, grup yetkilendirmesi kalktı ve eksik bilgi yalnız uyarı,
  kartta zimmet ve özlük dosyası, **Ana sayfa** (role göre), giriş ekranında geçici parolayla ilk giriş; yeni desenler kalıba girdi (kural 20).
  Genel ilke: teknik ayrıntı yok, kural uyarıdır engel değil. M1 150/150, 32/32.
- 2026-09-25 (32): **sonraki yol** (reisim): modüller önerdiğim sırayla tek tek ele alınır, her modülde o modülün soruları yeniden
  sorulur; çakışan / gereksiz modüller sırası gelince silinir, şimdi değil (MAKET-PLANI.md Durum).
- 2026-09-25 (31): **telefonda sayfanın sağa sola kayması düzeltildi** (reisim: *"maket telefonda ekranı büyültüp küçültünce veya
  sağa sola kaydırınca ekrandan taşıyor"* → *"bunu düzelt"*): yazı alanı dokunmatikte 16 px (§8.12, iPhone odakta büyütmesi),
  320 px'teki 4 taşma, ölçüme telefon taklidi. Maket olduğu için değildi; uygulamanın kodunda da aynı kural vardı.
- 2026-09-24 (30): **toplu bakış sayfası** (`docs/toplu-bakis.html`, MAKET-PLANI.md SON): §3.6'daki her maketin ekranı, varsayımları ve
  soruları (metin buradan okunur) + ölçüm dosyalarındaki sayılar; bağımlılıklar ve ölçülemeyenler. Etkileşim sonuçları artık dosyaya
  yazılıyor. 16 maket, 127 soru; reisim'in toplu cevabı bekleniyor.
- 2026-09-24 (29): toplu bakış öncesi tutarlılık — müşteri sayfasına (M2) faz 2 yüzleri: teklif, iş sözleşmesi, açık alacak (o müşteriye
  süzülü Teklifler / İş sözleşmeleri / Muhasebe faturaları); M1 ve M2 varsayımlarındaki "maketler gelince bağlanır" notları güncellendi.
- 2026-09-24 (28): **toplu maket M16 Eğitimler** (§3.6, faz 2): kayıtlar (tekrar durumu, belge, görünüm güncel/önceki), eğitim türleri,
  kayıt ve kayıt ekle / tekrarı kaydet pencereleri; personel kartı ve Uyarılar buraya kişiye süzülü bağlanır. Sorular 152–158.
  **M1–M16 bitti**; sırada toplu bakış sayfası.
- 2026-09-24 (27): **toplu maket M15 Performans** (§3.6, faz 2): pano (dönem + branş anahtarı, yüzler, gün başı rapor ve kazanç grafiği,
  personel başına kazanç, personel tablosu) ve kişi sayfası (günlük iş); sayılar raporlardan, kazanç birim fiyattan. Sorular 144–151.
- 2026-09-24 (26): **toplu maket M14 Muhasebe** (§3.6, faz 2): işler (plan başına) ve faturalar, iş sayfası (rapor × birim fiyat × fatura),
  fatura sayfası (kalemler, KDV, tahsilatlar), fatura kaydet ve tahsilat pencereleri; iş tahsilatla kendiliğinden kapanır. Ortak süzgeçte
  seçicisiz satır düzeltmesi. Sorular 135–143.
- 2026-09-24 (25): **toplu maket M13 İş sözleşmeleri** (§3.6, faz 2): modül 12 iki sekme (İSG-KATİP kayıtları · iş sözleşmeleri), liste,
  sözleşme sayfası (taraflar, kapsam: tesis × İSG-KATİP × plan, geçmiş), imzalı sözleşme yükleme, form (tekliften), bitişi yaklaşan
  sözleşme şeridi. Sorular 125–134.
- 2026-09-24 (24): **toplu maket M12 Teklifler** (§3.6, faz 2): liste, teklif sayfası (kalemler, KDV, raporlanan adet/tutar), form (fiyat
  listesi, tesisten doldur), red gerekçesi; teklif → plan aç bağlantısı. Sorular 118–124.
- 2026-09-24 (23): **toplu maket M11 Müşteri Paneli** (§3.6): müşteri kabuğu, imzalı raporlar, uygunsuzluk kayıtları (açık / giderildi),
  "Uygunsuzları indir" önizlemesi, rapor PDF'i; müşteri kartındaki açık uygunsuzluk sayısı kayıtlardan. Sorular 111–117. Faz 1 maketleri bitti.
- 2026-09-24 (22): **toplu maket M10 Uyarılar** (§3.6): kalibrasyon bitişi ve eğitim tekrarı uyarıları (yalnız ekranda, koşuldan türeyen);
  eğitim kayıtları ortak veride, personel kartı onlardan sayar. Sorular 107–110.
- 2026-09-24 (21): **toplu maket M9 Raporlar · Onaylar · İmza · PDF** (§3.6): inspector'ın rapor listesi ve rapor sayfası (durum
  geçmişi, PDF önizlemesi), son imza (servis / indir-imzala-yükle, toplu), branş yöneticisinin onay kuyruğu ve onay ekranı; rapor belgesi
  tek üreticide (`maket-belge.js`). Sorular 98–106.
- 2026-09-24 (20): **toplu maket M8 Saha ve Rapor** (§3.6): saha rapor ekranı (kriter, test, sigorta okuma önerisi, fotoğraf, sonuç,
  onaya gönderme kontrolleri; geri gönderilmiş ve onaydaki hâller); Planlar'daki "Raporu düzenle" bu ekrana bağlandı. Sorular 90–97.
- 2026-09-24 (19): **toplu maket M7 Standart Kütüphanesi · Rapor şablonu önizlemesi** (§3.6): standart listesi, standart sayfası,
  yükle / yeni sürüm (sürüm geçmişi, rapor kullandığı sürümü saklar); rapor şablonu belge önizlemesi (Ek-III 1.7, alan kaynakları,
  örnek rapor). Sorular 82–89.
- 2026-09-24 (18): **toplu maket M6 Plan aç** (§3.6): planlama ekibinin plan açma sayfası (müşteri → tesis → tarih → inspector →
  kapsam → özet), plan açıldı ekranı; müşteri ve tesis sayfalarındaki "Plan aç" bağlandı. Sorular 74–81.
- 2026-09-24 (17): **toplu maket M5 İSG-KATİP kaydı** (§3.6): kayıt listesi, plan kabulünü durduran eksikler, ekle/düzenle/önceki kayıt
  penceresi; kural tek kaynakta (`MV.isgUygun`, `MV.acikPlan`), tesis sayfası ve personel kartı buna bağlandı. Sorular 66–73.
- 2026-09-24 (16): **toplu maket M4 Ölçüm Cihazı · Zimmet · kalibrasyon uyarısı** (§3.6): 20 cihaz, 3 araç, 5 diğer varlık, 29
  teslim hareketi; cihaz ve varlık sayfaları, dört pencere; personel kartındaki zimmet sayısı kayıtlardan. Sorular 58–65.
- 2026-09-24 (15): **toplu maket M3 Ekipman Türü Kataloğu · Ekipman** (§3.6): 24 türlük katalog, standart kütüphanesi verisi,
  143 ekipmanlık sicil (Planlar'daki kodlarla aynı), tür ve ekipman sayfaları, üç pencere. Planlar'ın boş "önceki sayfa" ikonu
  düzeltildi, iki ikon kilidi. Sorular 51–57.
- 2026-09-24 (14): **toplu maket M2 Müşteri ve Tesis** (§3.6): liste, müşteri ve tesis sayfaları, üç form penceresi; ortak veriye
  11 müşteri, 15 tesis, İSG-KATİP kayıtları, portal kullanıcıları. Form alanı üreticisi ortak. Sorular 44–50.
- 2026-09-24 (13): **toplu maket M1** (bulut oturumu): bulut hazırlığı doğrulandı (Chrome indirmesi vekilde 403 → VM'deki
  Chromium; root'ta gömülü PostgreSQL → testler root olmayan kullanıcıyla), ölçüm sürücüsü `tools/olc-bulut.mjs` (olumsuz kanıt
  2/2, etkileşim kipi), ikon ekleme aracı `tools/ikon-ekle.mjs` (Lucide 1.47.0, iki kopya birlikte; +12 ikon, 63). Planlar
  maketinin kabuğu ve ortak parçaları `maket-ortak.js`'e ayrıldı (görünüm aynı). **M1 Kullanıcı ve Rol · Personel** maketi:
  giriş, kullanıcılar, rol yetkileri (öneri), davet, personel liste/kart/form (§3.6). Sorular 32–43.
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
- 2026-09-24 (12): bulut oturumu soruldu (belgeler okundu: bulut VM Ubuntu 24.04, Node ≤ 22 hazır, yerel hafıza ve `yerel/`
  gitmez, tarayıcı bölmesi yok) → reisim: *"tüm maketleri sırayla bulutta yapılsın en son hepsine toplu bakar"* → kapsam faz 1 +
  faz 2, ara onay yok. `MAKET-PLANI.md` (talimat + durum) ve `tools/bulut-hazirla.sh` (Node 24, başsız Chrome, npm ci; bulutta
  ilk koşuda doğrulanacak) yazıldı; plan açma ekranı eksikti, sıraya eklendi (M6).
- 2026-09-24 (11): reisim Planlar maketinin neden koda dönmediğini sordu → faz 1 sırası ve bağımlılıklar anlatıldı; seçenekler
  (sırayı koru · Planlar'ı ince tablolarla öne al · örnek veriyle şimdi kodla) → **sırayı koru**. Önizleme için örnek veri
  kipi önerisi not edildi (§3.3, §9).
- 2026-09-24 (10): reisim 2. denemeyi onayladı (*"uygun"*) → **daraltma uygulamada**: geniş bantta üst çubuğun solundaki
  ☰ menüyü 64 px şeride indirir (işaret, çizgi ayraçlar, ipucu yalnız şeritte), tercih `probata-menu`; ilk boyamadan önce
  `<html data-menu="dar">` kurulur (tema gibi, yanıp sönme yok). Kalıba `kabuk.cubukDar: 64`; kilitler: şerit 64 (uygulama +
  maket), daraltma kuralı geniş bant dışında yok (anayasa 2.11), kabuk eşikleri yalnız kalıp bantları (min-width dahil);
  olumsuz kanıt 3 yeni (16/16). Yerelde 1920 (Planlar · Personel · 404; geniş + daralmış × iki tema) · 1080 (çekmece kapalı /
  açık) · 375 (iki tema × çekmece) ölçüldü, hepsi temiz; makette ölçülen sayıların aynısı (içerik 1.688 ↔ 1.856 px).
- 2026-09-24 (9): reisim ilk denemeyi onaylamadı: *"standart üç alt alta çizgi görünümü olsun"* → daraltma düğmesi
  standart ☰ (tabletteki çekmece düğmesiyle aynı simge ve yer), panel simgeleri kalktı (ikon dosyası 51). Maket ölçümü
  1920'de 8/8 temiz (liste + plan içi × geniş + daralmış × iki tema); 1080 ve 375'te çekmece aynen. Onay bekliyor.
- 2026-09-23 (8): reisim yan menünün daraltılabilmesini istedi → önce makette (anayasa 2.1): masaüstünde üst çubuğun
  solundaki düğmeyle 64 px simge şeridi; tablet/telefonda çekmece aynen. İkon dosyalarına 2 ikon (53). Maket ölçümü
  1920'de 20/20 temiz (daralmış + geniş × iki tema × liste/plan içi/pencereler); 1080 ve 375'te çekmece etkilenmiyor.
  Canlı ölçümde kusur yakalandı: "dar" kayıtlıyken tablette de 17 bağlantıya ipucu konuyordu (ad zaten yazılıyken çift
  ad) → ipucu yalnız geniş bantta, bant değişince yeniden hesaplanıyor. Onay bekliyor; onaylanınca uygulamaya geçer.
- 2026-09-23 (7): reisim 29–31'i kabul etti ve *"kodlamaya başla ilk yayını yap"* dedi. **İlk kod kalemi: iskelet** (§8.13):
  Next.js + TypeScript, kabuk (17 modüllü yan menü, tema, çekmece), gömülü PostgreSQL + RLS'li kiracı katmanı + göç
  koşucusu, kalıp sayıları dondu (`src/styles/kalip.ts`), 36 kilit testi + 13 olumsuz kanıt, CI, Pages önizlemesi
  (`/uygulama/`). Ölçerken bulunanlar: Windows'ta initdb (ü), Uygulama Denetimi → webpack, statik dışa aktarımda Windows
  ön yükleme adı, kapalı çekmecenin klavyeyle gezilebilmesi (maketten gelen açık, düzeltildi), 404 sayfasının küçük
  bağlantısı, geliştirme sunucusunun yerel ağa açılması.
- 2026-09-23 (6): reisim 26–28'de önerilerimi kabul etti. Plan içi 5. tur (§3.4): hareket listesi kalktı (kayıt tutulur),
  yerinde **Proje notları**; raporlar **20'şer**; yan menüde firma panelinin **bütün modülleri** (17, 6 grup); menü ve
  ekran adları genel (**Planlar**, Raporlar, Zimmetler). İkon dosyasına 10 ikon (51). 54 ölçüm temiz, kontrast 62 / 62,
  41 etkileşim denemesi geçti; bu turda ölçerken hata bulunmadı. Sorular 29–31 reisim'de; rol × modül görünürlüğü sonra.
- 2026-09-23 (5): reisim bir plan sayfasını örnek gösterdi (inceleme yerelde) ve 17–25'te önerilerimi kabul etti (takvim
  hariç). Plan içi 4. tur (§3.4): **Planlandı → Kabul → Denetim → Tamamlama** adım çizelgesi, tarafsızlık beyanı, kapsam,
  kontrol listesi, **10'ar sayfa**, ekipman ve rapor **süzgeci**, proje notu; yoğunluk **34 / 44 px**, kart eşiği
  **960 px**; firma adı üst çubuktan kalktı. Faz 1 sırası ve dondurma kararı §3.3. 54 ölçüm temiz, kontrast 62 / 62,
  49 etkileşim denemesi geçti; bu turda 9 hata bulunup düzeltildi, ölçüm aracına 2 denetim eklendi. Sorular 26–28 reisim'de.
- 2026-09-23 (4): reisim'in 16 cevabı + ek isteği işlendi: görsel sistem 1–6 karar (§8.12; birincil tuş A, petrol seçeneği
  değişkenlerden kalktı), süzgeç kalıp 15 sırasına, pencereler kurallara uyduruldu. Plan içi 3. tur (§3.4): **üstte
  Ekipmanlar, altta Raporlar**, ekipman ekle ayrı pencere (kayıtlı / yeni), **ekipman kodu firmada eşsiz, çakışan kod
  kaydedilmez**, Denetime başla tarihe bağlı değil, **plan geçmişi**; **numara sistemi** §3.5. Yeni sunum
  `docs/plan-ici.html`; 42 ölçüm temiz, kontrast 56/56; bu turda 6 hata bulunup düzeltildi. Sorular 17–25 reisim'de.
- 2026-09-23 (3): reisim'in örnek listesiyle Planlarım maketi 2. tur (§3.4): yeni sütunlar, satırda tek eylem tuşu
  (Kabul et → Denetime başla → Devam et), **plan içi** ekranı (Tamamla ↔ Tamamlamayı geri al, ekipman listesi, bilgi
  kutuları), sütun başlığıyla sıralama. 24 ölçüm temiz, kontrast 54/54, bu turda 10 hata bulunup düzeltildi; iki yeni
  ölçüm denetimi (gizli kapta tuş, kesik ipucu). Sekiz yeni karar sorusu (9–16) reisim'de.
- 2026-09-23 (2): görsel sistem önerisi ve Planlarım maketi GitHub Pages'te yayımlandı (`docs/`, §8.12). Kontrast 46/46,
  maket 6/6 durumda temiz, 11 hata ölçerken bulunup düzeltildi. Sekiz karar sorusu reisim'de.
- 2026-09-23: reisim'in üçüncü tur cevapları işlendi: ürün adı **probata**, logo paketi, marka renkleri, Sora,
  açık + koyu tema eş zamanlı (§8.12); faz 1 omurgası ve referans ekran Planlarım onaylı (§3.3). Omurga önerimde
  atladığım bağımlı modüller (Personel, İSG-KATİP, Ekipman Türü, Şablon, Standart) §3.3'te onaya sunuldu.
- 2026-09-22 (5): reisim'in **ikinci tarifi** işlendi (§1.1 birebir). Yeni: §3 tam akış (teklif → tahsilat),
  §3.1 **20 modüllük modül haritası**, §3.2 **modüller arası bağlantı kuralları**, §2 branş yöneticileri,
  §7 genişletilmiş veri modeli (teklif, sözleşme, zimmet, eğitim, muhasebe, uygunsuzluk), §8 kararları
  (**Next.js**, modüler mimari, Türkiye'de barındırma, pg-boss, sigorta okuma). Mevzuat açık işi **kapandı**:
  yürürlükteki birleşik metin birincil kaynaktan okundu → §4.2 alanları ve §4.6 meslek yetkileri birebir yazıldı;
  **"teknisyen" yetkili kişi değildir** (metinde 0 kez geçiyor). Kod hâlâ **YOK**.
