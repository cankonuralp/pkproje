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
· **Tamamlanmış planda** var olan raporlar düzenlenir; **yeni rapor (kopya dahil) oluşturulmaz** ve **ekipman ekleme kapalı** — önce tamamlama geri
  alınır; "Rapor oluştur" / "Kaydet ve kopyala" görünür, basınca nedeni üstte kısa uyarıyla söylenir. (12; 2026-10-12 reisim: *"tamamlamayı geri
  almadan yeni rapor oluşturulmasın, uyarı çıksın rapor oluştur diyince"* — eskiden "raporlar … oluşturulur") 
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
| Ekipman kodu | A–Z, 0–9, tire · 3–20 · önek serbest (18) | HT-1001 | **personel, etiketten elle** (S.A.Y verilmezse tesisin sıradaki numarasını verir) | **tesis içinde eşsiz** (17 değişti — 2026-11-02 reisim: "tesise göre değişsin kodlar, aynı firmada başka tesiste olan ekipmanlar bizi ilgilendirmez"; göç 0115) · aynı tesiste çakışan kod kaydedilmez, eski kod aynı tesiste başkasına verilmez · numara tesiste devam eder, yeni tesiste 1'den (düzen — ayraç, hane — firmanın) · sayı bölümü 0 olamaz (2026-11-01) · değiştirme yalnız yönetici, eski kod geçmişte kalır (19) |
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

### 3.10 · S.A.Y Chat ve S.A.Y asistana ek (reisim 2026-10-12, bulut oturumunda 7 tur; maket 2026-10-13) — ONAYLANDI 2026-10-13 (reisim: *"onayılıyorum, yap bitir"*; 18–24 dahil)
Ön model: `docs/maket/say-chat-onmodel.html` (12 ekran + "Konuşulan kurallar"; asıl maket işlenince kaldırılabilir). Asıl maket: plan içi
(`docs/maket/planlarim.html#/plan/1` — sağ altta S.A.Y'ın yanında **S.A.Y Chat**; `docs/assets/maket-saychat.js`), Ekipman türleri › tür sayfası
(**S.A.Y Chat ayarları**; `maket-turler.js`), saha raporu (sohbetten açılan taslak; `maket-rapor.js`), S.A.Y paneli (ataç; `maket-say.js`).
KOD-GECIS K5'te dört kalem: 522 ek · 523 ayarlar · 524 kayıtlar · 525 rapor yaz. *(öneri)* işaretliler benim (onaylı); ötekiler reisim'in.

**S.A.Y Chat — kararlar**
1. **Yer:** S.A.Y asistan tuşunun yanında "S.A.Y Chat" tuşu. Plana girince o planın sohbeti açılır; geçmiş plana bağlı.
2. **Kişiye özel:** sohbeti yalnız kaydı yazan denetçi görür (plan sorumlusu, teknik yönetici, yönetici GÖREMEZ) → yetki "kendi", RLS'te sahibi süzgeci.
3. **Akış:** fotoğraf çek → "Ekipman seçin" → pencerede **Plandan seç** (plandaki ekipmanlar: kod · tür · yer; rapor o ekipmana yazılır) ya da
   **Yeni ekle** (rapor formatı kurulmuş türler; rapor yazılırken plana yeni ekipman olarak eklenir). **2026-10-14 değişti (549, sunum 546 K1–K2 —
   reisim: "plandan seç diyince plandaki ekipmanlar gözükmüyor"):** listede plandaki BÜTÜN ekipman; branşınki önce; başka branşın ekipmanı / türü
   UYARIYLA seçilir (engel değil); kişinin kendi Yeni raporu olan ekipman seçilir — kayıt o raporun BOŞ alanlarına girer; başkasının ya da onaya
   gitmiş raporu olan, pasif, formatsız ekipman nedeniyle görünür, seçilmez. (Eski: yalnız branşına uygun ve raporsuz.)
4. **Yönerge** (sağ üst): numaralı etiket bilgisi satırları (ör. 1. Marka 2. Model 3. Sn 4. İmal yılı 5. Kullanım yeri 6. Şebeke gerilimi 7. Not);
   yazı alanı değil, yalnız sırayı gösterir; altında "Etiket fotoğrafı" tuşu.
5. **Mesaj:** etiket yazılmaz; n. satır = yönergenin n. maddesi; mesaj kutusu numaralı satırlı; "-" ya da boş satır = bilinmiyor (alan boş);
   fazla satırlar nota eklenir; Not → Muayene uzmanı yorumu. Satırları alana dağıtmak KURALLA, yapay zekâ yok; altta her satırın nereye düştüğü
   işaretle gösterilir.
6. **Hazır değer:** ayarda satıra hazır değer verilebilir (ör. Şebeke gerilimi → 220 V); mesaj kutusunda o satır dolu ve "hazır" işaretli gelir,
   denetçi üstüne yazıp değiştirir, dokunmazsa hazır değer kalır.
7. **Okunacak fotoğraflar:** kayıtta türün ayarındaki başlıklar altında (Pano sigortaları (linye), Fonksiyon testleri, Potansiyel dengeleme …) test
   tablosu / ölçüm ekranı fotoğrafı; sohbette başlığıyla görünür. Rapor yazılırken yapay zekâ okur *(öneri: çekerken değil, rapor yazılırken)*
   (mevcut "Fotoğraftan doldur" altyapısı: raporlar/server/alan-oku.ts, formatın bölüm ayarı doldur.foto); değerler o bölüme ÖNERİ olarak düşer,
   denetçi onaylar; okuma fotoğrafı olarak saklanır, belgeye BASILMAZ; çevrimdışıyken bekler.
8. **Bir kayıt = bir ekipman.** Ek fotoğraf Gönder'den önce eklenir; Gönder = bu ekipman bitti.
9. **Çevrimdışı:** kayıtlar cihazda birikir ("Cihazda" / "Gönderildi"), bağlantı gelince gider (mevcut çevrimdışı kuyruk).
10. **Düzeltme:** rapor yazılana kadar kayıt geçmişten açılıp değiştirilir (ekipman, fotoğraflar, mesaj, okunacak fotoğraflar) ya da silinir.
11. **Etiketten okuma** (isteğe bağlı): fotoğraf eklenirken uyarı ("yapay zekâ kullanır, firmanın kotasından harcar, bu ay x / y"); "Oku ve mesaja
    yaz" ya da "Okumadan geç"; okunanlar mesaja öneri olarak yazılır; çevrimdışıyken sırada bekler; etiket fotoğrafı rapora KONMAZ.
12. **"Bekleyenler için rapor yaz (n)":** kayıtlar sırayla rapor taslağı olur; önce koşullar: plan günü, günlük süre / mesai, internet (rapor
    numarası sunucuda), yapay zekânın okuyacağı fotoğraf sayısı + kota. Rapor oluşunca kayıt sohbetten SİLİNİR, ekipman fotoğrafları rapora geçer.

**S.A.Y Chat ayarları** (Ekipman türleri › tür sayfası, tıklayınca açılan bölüm)
13. Mesaj satırları: sıra · telefonda yazan ad · rapordaki alan (formatın alanlarından: ekipman bilgileri, ölçüm / test değerleri, Muayene uzmanı
    yorumu) · hazır değer (isteğe bağlı) · yukarı / aşağı · sil · "Satır ekle".
14. Okunacak fotoğraflar: başlıklar formatta fotoğraftan doldurması açık bölümlerden; aç / kapa · sil · "Başlık ekle".
15. Sağda "Telefonda böyle görünür"; bölümün kendi Kaydet / Vazgeç'i. Yeni türde satırlar formatın ekipman bilgisi alanlarından, başlıklar
    fotoğraftan doldurması açık bölümlerden hazır gelir.
16. Değişiklik yeni kayıtlarda geçerli; gönderilmiş kayıt gönderildiği andaki tanımla okunur (kayıt tanım sürümünü taşır). Düzenleyen: ekipman
    türünü düzenleyebilen roller.

**S.A.Y asistana fotoğraf ve belge** (src/modules/say)
17. Yazma kutusunun yanında ataç → Fotoğraf çek · Galeriden seç · Belge ekle (PDF, Word); eklenenler gönderilmeden önce kutunun üstünde küçük
    görüntü / ad + boyut, × ile çıkar; gönderilen mesajda da görünür. Altta "Ekler yapay zekâya gider, kotadan harcar · en çok 4 MB"; tür içerikten
    denetlenir. Altyapı: rapor-format/server/yz.ts formatBelgesi (PDF / fotoğraf / Word, 4 MB), src/server/yz/word.ts, components/foto/kucult.ts,
    src/server/yz/kullanim.ts. *(öneri: dosya saklanmaz, yalnız o soruda okunur; sohbet geçmişinde adı kalır)*

**Makette eklediğim ayrıntılar** *(öneri — onayında değişebilir)*
18. S.A.Y Chat tuşu yalnız plan içinde ve plan kabul / denetimde / tamamlandı iken görünür; S.A.Y ile S.A.Y Chat aynı anda açılmaz (aynı yerde panel).
19. Yeni ekle'de ekipman kodu sahada sorulmaz; **rapor yazılırken** istenir (etiketteki kod, firmada eşsiz — plan içindeki "Ekipman ekle" kod
    denetimiyle aynı); kullanım yeri mesajın "Kullanım yeri" satırından gelir.
20. Gönder için en az bir ekipman fotoğrafı gerekir; başka bir kayıtta olan ekipman "Plandan seç" listesinde görünmez.
21. Tamamlanmış planda sohbet açık kalır, kayıt tutulur; "Bekleyenler için rapor yaz" koşullarda durur (519: tamamlanmış planda yeni rapor yok).
22. Günlük süre yetmezse sığan raporlar açılır, kalan kayıtlar bekler. Yapay zekâ kapalıysa etiket okunmaz; okunacak fotoğraflar raporda okuma
    fotoğrafı olarak saklanır, açılınca okunur (bugünkü "Fotoğraf ekle (yapay zekâ okur)" kapalı kipiyle aynı).
23. Makette "Makette bakış" ile planın denetçileri arasında geçilir (branşa göre listeler denensin); uygulamada herkes yalnız kendi sohbetini görür.
    Makette fotoğrafın yalnız adı kalır; görüntüsü o oturumda görünür.
24. Veri taslağı (kodda): `say_chat_kayit` (firma, plan, yazan hesap, ekipman: plan ekipmanı ya da yeni tür, fotoğraflar, mesaj satırları,
    okunacak fotoğraflar, etiket, tanım sürümü, durum, zaman — RLS sahibi süzgeci, rapor yazılınca silinir) · `say_chat_ayar` (firma × tür, sürümlü:
    satırlar, okunacak başlıklar; yayınlanan sürüm değişmez).

**Yayından sonra eklenen** (reisim 2026-10-13: *"say chatte fotoğraf işaretine tıklayınca galeriden veya pc den de fotoğraf yükleyebilmek olsun"*)
25. **Fotoğraf tuşu iki yol açar** (527): her S.A.Y Chat fotoğraf tuşu (yeni kayıt "Fotoğraf ekle", ekipman "+ ek", "Etiket fotoğrafı", okunacak
    başlığın "Fotoğraf ekle") küçük menü açar: **Fotoğraf çek** (telefonda kamera) · **Galeriden / bilgisayardan seç** (etiket dışında birden çok
    fotoğraf). Uymayan (JPEG / PNG değil, 2 MB üstü) ve kayıttaki yeri aşan (ekipman 12, başlık başına 6) fotoğraf eklenmez, adıyla söylenir. Menü S.A.Y
    ataç menüsünün düzeninde, üst katmanda yüzer; Esc yalnız menüyü kapatır.
26. **S.A.Y Chat ayarları kendi sayfasında** (529; reisim 2026-10-13: *"say chat ayarları burda kötü durmuş görüpte anlamadım bile ne olduğunu
    gözümün önünde olmasına rağmen hemde, ikinci görselde attığım yere diğer tuşların yanına koy tuşa basınca ilgili sayfaya gitsin ve düzenleme
    yapalım"*): m.15'teki "tür sayfasında tıklayınca açılan bölüm" kalktı. Düzenleme `/ekipman-turleri/<tür>/say-chat` sayfasında (solda mesaj satırları
    ve okunacak fotoğraflar kartları, sağda "Telefonda böyle görünür", altta Vazgeç / Kaydet). Açıldığı yerler: **Format kurucunun tuşları** (Sürüm
    sayfası'nın yanında "S.A.Y Chat ayarları") ve tür sayfasındaki kısa **"S.A.Y Chat ayarları"** bölümü (ne olduğu, satır sırası, okunacak fotoğraflar;
    "Düzenle", yazamayana "Görüntüle"). Sayfada taslak varsa "Format kurucu"ya dönüş tuşu.

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
   taşımaz. (Reisim'in ikinci önceliği — §1.1.) **2026-10-14 (542, sunum 541 onaylı):** fotoğraf okunmadan eklenir; S.A.Y'a "Fotoğrafları
   oku ve gir" denince okunur ve değerler BOŞ alanlara girer (emin olunmayan sarı işaretli); öneri kartı kalktı — inspector kontrol eder,
   **Kaydet demeden rapora yazılmaz**; dolu alan sorulmadan değişmez.
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
⚠️ **2026-10-17 DEĞİŞTİ** (§11 "İMZA YOLLARI"): imza yolları toplu indir → imzala → yükle + servis sağlayıcı API'si (firma seçmez, probata kurulumda
kurar, firma başına farklı servis); operatöre doğrudan mobil imza ve kendi e-imza aracımız sonraya, aynı yapıya bir sağlayıcı olarak.
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
**Aynı gün sonra (reisim: *"rapor düzenlemede sadece saha ekranı gözüksün o ekranda düzenleme yapılamasın … sadece sahada personelin nasıl göreceği
gözüksün"*; *"kağıttan düzenleyebiliyoruz ama sahadaki görüntü nasıl oluyor düzenleyemiyoruz burası çok karmaşık bir çözüm öner"*; *"bahsettiğim
fotoğraf mekanizması vs eklenmemişti bile … söylediğim hiç bir şeyi es geçme"*):** (1) DEĞİŞTİ → saha ekranı salt önizleme, tek düzenleme yeri kâğıt,
sahaya özgü ayarlar kâğıtta (§11 483); (2) (3) (4) YAPILDI (§11 484 — bölüm ayarı "Fotoğraftan doldur" / "Excel'den yükle"; fotoğraf belgede
görünmez); (5) (6) açık (hata listesi 46; madde 29 ile birlikte, önce maket).
**Aynı gün sonra (ekran görüntüleriyle; reisim: *"test tablosu veya bu ekran görüntüsündeki gibi linye girme tablo doldurma alanlarında nerde fotoğraf
ekleme tuşu? … buralarda yapay zekanın okuması için fotoğraf ekleme tuşu olsun yapay zeka okusun diye raporda gözükmesin raporda sadece fotoğraflar
sekmesinde eklenen fotoğraflar gözüksün, format yapıcıda da ai için fotoğraf ekleme tuşu olsun … ayrıca test tablosu olan yerler de, son satırı
kopyala, satırları otomatik sırala, gibi tuşlar da olsun … tip seçin kısmına tıklayınca saçma sapan başa atıp … Lütfen şu siteyi tüm açılardan
tam kusursuz hale getirecek detaylı inceleme yap"*; *"rcd testleri tablosunda uygun uygun değil otomatik geliyor ? neden elle seçilmiyor ? neye göre
otomatik uygun uygun değil diyor ?"*; hata listesi 38 *"silinemiyor hala ekipman bilgileri tablosu"*, 40 *"alt başlık ekleyince seçenekler çıksın
illa üst başlıktaki formatta olması gerekmiyor"*):** YAPILDI (§11 486) — "Fotoğraf ekle (yapay zekâ okur)" tuşu formatta açık bölümde HER ZAMAN
(yapay zekâ kapalıysa fotoğraf okunmadan saklanır, açılınca "Oku"; belgede yalnız Fotoğraflar bölümünün fotoğrafları); kâğıtta tuşlar bölümün altında
görünür, "+ … koy" / ×; tabloda satır "Kopyala", "Son satırı kopyala", "Sırala"; Tip listesinin başa atması düzeldi; "Sonuç neye göre çıkar?"
açıklaması; ekipman bilgileri bölümü bütünüyle silinir; alt başlık türü seçilir. **Açık soru:** ölçüm tablosunun Sonuç'u şimdi yalnız kurala göre
(Bakanlık kriteri: ör. RCD testi IΔ ≤ IΔn ve TΔ ≤ 200 ms) — denetçi gerekçe yazarak elle değiştirebilsin mi? (öneri: evet, "kural sonucu" yanında
gösterilir) → 2026-10-11 reisim önerileri kabul etti: YAPILDI (§11 488). Aynı gün reisim: satırın kopyala işareti ve "Sırala" kalksın → kalktı (488).
**2026-10-11 akşam — hata listesi 29 + 46 + 9 maketi ONAYLANDI, bir değişiklikle** (maket https://claude.ai/artifact/TgA7oTqRojdEe7qAfjqAfJ;
reisim: *"maketi onaylıyorum ama bu da çok karmaşık olmuş, şöyle yapalım mevcuttaki sistemi koruyalım gelişmiş seçenekler tuşu olsun ve tıklayınca
buraya gitsin"*; karar formunda K1 = "bugünkü gibi yalnız kâğıt"): format kurucu **bugünkü gibi açılır** (Kâğıt · Saha ekranı · Belge önizlemesi,
değişmeden); üstte **"Gelişmiş seçenekler"** tuşu makettekine götürür (parça kutusu + sürükle-bırak, formül, serbest metin, Bakanlık ve firmanın
parçaları, yapay zekâya anlat, belgeden başlat, sağda ayarlar). Önerim (cevapta): gelişmiş ayrı bir format değil, AYNI taslağın ikinci görünümü —
orada yapılan kâğıtta görünür, geri dönünce hiçbir şey kaybolmaz; varsayılan her zaman kâğıt; telefonda tuş yok (K9). Öteki sorular cevapsız →
önerilerim (K2–K11): dokun-yerleştir de, formül evet, Bakanlık parçaları tek tek, firmanın parçaları, yapay zekâ önerisi onaysız yazılmaz, belgeden
başlat sıranın sonunda, koşullu bölüm sonraki tur, madde 9 → A (sahada üstte katlanır "Kayıttan gelenler" kartı), sıra: önce madde 9.
**Aynı akşam — madde 9 DEĞİŞTİ** (reisim, A seçeneğinin sunumuna: *"hayır böyle olmaz kayıttan geliyor diye değiştirilemez olmasın kayıttan
gelenlerde değiştirilebilir olsun sadece sgk no ve isg katip no değiştirilemez olsun ve format yapıcıda bu belirlenebilir olsun belki başka bir firma
onuda değiştirilebilir isteyecek bu çok ta önemli bi konu değilmiş, bu söylediklerime göre hareket et ve elindeki işleri bitir kalan işleri
sırala"*): "Kayıttan gelenler" kartı YOK. Saha raporunda kayıttan gelen bilgiler (firma adı, adres, e-posta, telefon, metot ve kapsam; formatın
kayıttan alanları) denetçi tarafından raporun kendi kopyasında değiştirilebilir; **SGK ve İSG-KATİP başlangıçta kilitli**; hangi alanın kilitli
olduğu formatın ayarı (format yapıcıda açılıp kapanır). Rapor no, ekipman kodu ve türü kayıt bilgisi değil raporun kimliği — değişmez (numara
kesintisizliği, ekipman bağı). Sıra: madde 9 → Geri al / Yinele → Gelişmiş seçenekler → formül + serbest metin → parçalar → yapay zekâya anlat →
belgeden başlat; bitince kalan işler sıralanır.

**2026-10-15 — sunum 579 ONAYLANDI: firma kurulumu panelden** (reisim birebir: *"supabase ve resend bağlantılarını firma açarken biz buradan panelden
yapalım daha sonra müşteri uğraşmasın. supabase ve resend dışında aı apı key de buradan girilsin firma ayarlardan değiştirebilsin tabi yine ama ben de
buradan müdahele edebileyim, ayrıca resend ve supabase ayarları firma ayarları kısmından değiştirilemesin"*; karar formu 15:44 UTC "Onaylıyorum"):
· **K1 ikisi** — her yeni firmanın veritabanı + dosya deposu AYRI Supabase projesi; varsayılan probata'nın örgütünde (firma hiçbir şey yapmaz; isteyen
firmaya proje sonradan devredilir), isteyen firma kendi örgütünde (probata'yı ekibine davet eder). Proje Yönetim › Firma aç'ta panelden açılır (Supabase
Management API; OAuth yok). Bu, 513'teki "firma kendi Supabase hesabını bağlar" akışının yerini alır. · **K2 firmanın alan adı** — reisim notu: *"resend
için tek seçenek var ve o da firmaların kendi mail adresleri ile mail atılması … planlamacı mail gönder dediğinde planlamacının mail adresinden, denetçi mail
at dediğinde kendi mail adresinden veya pazarlamacı mail at dediği zaman kendi mail adresinden gitmeli"*. probata'nın TEK Resend hesabı, firmanın alan adı
panelden eklenir (DNS kayıtları panelde); kişinin adresi o alan adındaysa Kimden kişinin kendisi, değilse (Gmail vb.) firmanın genel adresinden kişinin
adıyla, yanıt kişiye. Bu, 536'daki "her firma kendi Resend hesabı"nın yerini alır. · **K3** Firma ayarlarında Supabase ve gönderim bağlantısı KİLİTLİ
(salt okunur); yanıt adresi (Rapor e-postası) ve gizli kopya firmada. · **K4** yapay zekâ anahtarı firma açarken isteğe bağlı; Yönetim'den girilir /
değiştirilir / kaldırılır, firma da değiştirir, iki taraf denetim izinde. · **K5** bugünkü deneme firması ortak projede kalır. · **K6** alan adı
probata.com.tr (reisim alacak; *"moda-enerji.probata.com.tr gibi urlleri atayabilecek miyim"* → evet: *.probata.com.tr joker, ad sunucuları Vercel'e,
firma başına DNS işi yok). Tasarım ve kalemler: `FIRMA-VT.md` (FV1–FV15).

**2026-10-15 akşam — S.A.Y CLAUDE GİBİ: SINIRSIZ, SAYFA GEZMEDEN, HER İŞİ YAPAR (sunum 584 REDDEDİLDİ)** (reisim birebir, sırasıyla: *"bunu yapmayı red
etti aynı claud gibi çalıssın demiştim … claud ekranda istediği gibi gezebiliyor"*; *"sayfada gezinme vs ne demek zaten direk database den, backendden
herşeyi görüpte yapıyor … adam zaten bizim kodun içinde"*; *"sik sik duruyor tekrar tekrar soruyor"*, *"yap işte yap dedim"*; *"saçma sapan sınırlar
koyma, ben sana ne dedim aynı ben normal chatte kullanıyormuşum gibi kullanabileyim, sadece site ile alakasız sorulara cevap vermesin (kahve falına bak,
ayılar ne yer, vb vb gibi.) tek sınırımız bu … nasıl ben chrome extension ile istediğim her şeyi yaptırabiliyorum clauda aynı şekilde yapabilsin"*;
*"sunum 584 ü red ediyorum dediğme odaklan sik sok kurallar getirme"*; *"herhangi bir tabloda 20 den sonrası sayfalı olacak … diğer sayfalara doğru
aksın"*; *"eğer yaptığı değişikliklerden sonra f5 yapılması gerekiyorsa vs claud bunu haber veriyor"*; *"onaylıyorum … sayfada gezme cart curta gerek
kalmasın bu sayfa açık değil falan demesin"*). KARAR: (1) S.A.Y iş bitene kadar araç çağırmayı sürdürür, "devam edeyim mi" demez; tur / adım / giriş
/ uzunluk sınırı YOK; tek komutla çok satır; aracı çağırmadan "yaptım" derse sunucu yakalar, işi yaptırır ya da nedenini söyletir. (2) Uygulamanın
sunucu işlevleri (tuşların çağırdığı işlevler + sayfaların okuma işlevleri) S.A.Y'ın aracı olur; sayfa gezmez, "sayfa açık değil" demez — rapor
ekranda açıksa forma yazar (istenirse kaydeder / onaya gönderir), açık değilse doğrudan kaydeder; kullanıcının oturumu ve sunucunun bugünkü denetimi
aynen (ayrı kural yok); e-imza kullanıcının cihazında. İşten sonra açık sayfa kendiliğinden yenilenir; ekranda kaydedilmemiş değişiklik varsa S.A.Y
söyler. (3) Bütün tablo ve listelerde 20 satırdan sonrası sayfalı (rapor ölçüm tabloları dahil), yeni satır sonraki sayfaya akar. Tek kural: site
dışı soruya cevap yok. Sıra: (1) → (3) → (2); FV kalemleri arada sürer. Bu kararla S.A.Y'ın okuma işlemleri kullanıcının görebildiği müşteri, kişi, plan ve rapor
bilgisini (firmanın kendi yapay zekâ anahtarıyla) Claude'a gönderir — ARKA-UC.md §5.4'teki "müşteri / kişi bilgisi gönderilmez" ilkesinin S.A.Y için yerine
geçer (reisim: *"zaten direk database den, backendden herşeyi görüpte yapıyor"*). Sır / anahtar yazan işlemler S.A.Y'a verilmez (anahtar sohbete girmesin).

**2026-10-16 — SONUÇ KURALI FORMAT YAPICIDA, HESAP LİSTESİ SADE** (reisim birebir, pano sigortaları (linye) tablosunun kurucu ekran görüntüsüyle:
*"saha ekranında doldururken kurala göre otomatik uygun uygun değil diyor, ama ilgili ayar buradan yapılamıyor ? ben göremiyorum sanki o kısım koda
gömülmüş gibi, eğer böyle bi özellik koyabileceksek format yapıcıya koyalım yoksa otomatik uygun uygun değil olayını kaldıralım, hesaplama tuşuna basınca
bir sürü değer çıkıyor bunları şöyle yapalım, her birimin kendi tablosundaki değerler çıksın, diğer değerler diğer olarak gözüksün tıklayıp açılan
listeden seçilebilsin"*; öneriye: *"onaylıyorum"*). KARAR: (1) ölçüm tablosunun Sonuç kuralı kurucuda tablonun ayarında "Sonuç kuralı" olarak görünür ve
formül dilinde (EĞER, VE …) düzenlenir; bugün kodda duran Bakanlık hesapları (linye, RCD / selektivite, nokta Zs, PD, zemin — format/motor.ts
satirDegerlendir, hesap.ts) aynı sonucu veren formüle çevrilip hazır gelir; formül silinirse o tabloda otomatik sonuç yok (denetçi elle seçer); sütun
sınırları ve "seçilirse uygun değil" seçenekleri bugünkü gibi. (2) Hesap (formül) tuşunun listesinde yalnız o tablonun / bölümün kendi değerleri
görünür; ötekiler "Diğer" açılır listesinde (aranabilir); işaretler ve işlevler aynen.

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

- **2026-11-10 — Resend kuruldu (deneme firması):** reisim: *"resend hesabı açtık halledelim o işi hızlıca"*, *"sen deneme şirketi için işlem yap bakalım"*. Tam yetkili anahtar Vercel'de (PROBATA_RESEND_ANAHTARI, reisim ekledi); Yönetim › Deneme Muayene › E-posta gönderimi: alan adı probata.com.tr, genel adres bilgi@probata.com.tr; Resend'in dört DNS kaydı (DKIM TXT resend._domainkey · MX send · SPF TXT send · CNAME rsend) Vercel DNS'e girildi, "Doğrulandı"; gönderme anahtarı firmaya yazıldı (Firma ayarları › E-posta "Bağlı"). Gönderim açılmadan önce sırada bekleyen 19 eski e-posta (9 Ekim – 7 Kasım; 16'sı uydurma .example adresine) "hata" olarak işaretlendi, gönderilmedi (geri alınabilir). Deneme e-postası GÖNDERİLMEDİ: deneme hesabının adresi uydurma. Not: Vercel aynı sürümün yeniden yayınını kod değişmediği için atlar (ignoreCommand) — ortam değişkeni eklenince yayın için .md dışı bir değişiklik gerekir. Resend ücretsiz plan: tek alan adı, günde 100 e-posta. Açık: uydurma (.example) adreslere gönderim sağlayıcıya gitmeden durdurulmalı mı (geri dönen ileti oranı hesabı riske atar) — reisim kararı.
- **2026-11-10 — probata sign gömülü penceresinin kapanışı:** reisim (sign bağlantı rehberi §4): *"imzalandi, reddedildi ya da toplu_bitti gelince ~3 saniye sonra pencereyi kendiliğinden kapat ve rapor listesini tazele … kapat gelince pencereyi hemen kapat"*. Önceki hâlde "kapat" haberi tanınmıyordu (sign'ın bitiş ekranındaki "Kapat" tuşu pencereyi kapatmıyordu) ve bitiş haberi pencereyi bitiş ekranı görünmeden kapatıyordu. Şimdi: bitiş haberi 3 sn sonra, "kapat" hemen; "kapali" (bağlantı geçersiz) pencereyi kapatmaz — nedeni sign'ın sayfasında okunur. Her kapanışta liste tazelenir; 4 sn sonra bir kez daha (tek imzada yalnız durum hâlâ bekliyorsa). Toplu imzanın adresi sign'ın kök adresinde (…/gomulu-toplu/<firma>): köken açılan adresten okunduğu için kural değişmedi, kilide örneği eklendi. Haber yalnız ekranı günceller; raporun durumu webhook / Durumu yenile ile değişir. Kilit tests/sign-gomulu, bozan sign-gomulu.
- **2026-11-10 — S.A.Y: başka plandaki yarım rapor sunucuda taşınır:** reisim: *"1 ve 2 ve 4 5 i yap"* (liste 1: kontrol günü, eski raporların tek tek okunması). Sekizinci koşuda (7 Kasım) aynı ekipmanların raporu başka planda yarım duruyordu; S.A.Y içeriği yeni plana taşımak için eski 8 raporu tek tek okudu (8 rapor_getir) ve kontrol gününü de onlardan aldı — bitiş denetimi yakaladı, saatler yeniden yazıldı (rapor başına 2 kayıt). Şimdi: rapor_ac `baska_plandan: true` → sunucu, AYNI yazanın o ekipmandaki başka plandaki tamamlanmamış son raporunun ekipman bilgilerini, bilgi alanlarını ve madde seçimlerini yeni rapora taşır (kopyalama kuralı; tarih, saat, fotoğraf, ölçüm / test değeri, sonuç taşınmaz; başkasının yarım raporu taşınmaz); ekranın "Rapor oluştur"u değişmedi. Talimat: eski raporları kopya için okuma, eski rapordaki tarihi yazma. Gerçek S.A.Y koşusuyla ölçülmedi (sıradaki deneme: aynı 18 fotoğraf).
- **2026-11-10 — Onaylar › Diğer belgeler probata sign ile (göç 0125):** reisim: *"1 ve 2 ve 4 5 i yap"* (liste 2: zimmet, eğitim, bordro, araç tutanağı). Firmada probata sign bağlıysa kişinin imzasını bekleyen belgede **İmzala** sign'ın imza ekranını probata'nın içinde açar (raporun penceresi); **PDF ile imzala** (indir → imzala → yükle) yedek yol olarak kalır, **Geri gönder** hep açık. sign bağlı değilken ekran aynı ("Onayla ve imzala"). Yol rapor imzasıyla aynı: gönderilen PDF sign'a (e-imza, 7 gün), bağlantılar şifreli saklanır; pencere kapanınca sonuç sign'dan sorulur, ayrıca sign'ın bildirimi (webhook) rapor isteği bulamazsa belgeye bakar; imzalı PDF bugünkü yükleme denetiminden geçer (taban, kriptografik imza, nitelikli), iş imzacının hesabıyla. Reddedildi / iptal / süresi doldu / denetimden geçmedi: belge bekler, nedeni Durum sütununda. Toplu imza yok (her belge ayrı). Gerçek e-imzayla denenmedi.
- **2026-11-10 — Güvenlik testi ve giriş hız sınırı:** reisim: *"1 ve 2 ve 4 5 i yap"* (liste 6: güvenlik ve kullanım testi; Vercel'de giriş sayfası ve API için hız sınırı kuralı). **Vercel güvenlik duvarı:** "Rate limit POST to login paths" kuralı yayında — `/giris`, `/yonetim/giris`, `/portal/giris` adreslerine aynı IP'den dakikada en çok 30 POST, aşan 403 (panelden kuruldu; canlıda 36 istekle denendi: 30 geçti, 6 reddedildi; GET etkilenmez). Hobby planı TEK hız sınırı kuralına izin veriyor: `/api` için ikinci kural (dakikada 600) eklenemedi — Pro'ya geçilince eklenir. **Canlı denetim (deneme.probata.com.tr, oturumsuz):** sayfalar girişe yönlenir; `/api/dosya`, `/api/islem`, `/api/say`, `/api/say/ek` 403; zamanlı işler ve `/api/saglik/projeler` 401; imzasız sign bildirimi 401; başka kökenden POST 403; `/yonetim`, `/vitrin`, `/.env` 404; başlıklar tam (nonce'lu CSP, HSTS 2 yıl, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP). **Supabase güvenlik danışmanı:** yalnız bilgi düzeyi — politikasız RLS'li üç iç tablo (duyuru, goc, is_calisma; tasarım gereği uygulama rolüne kapalı). **Paketler:** `npm audit` iki yüksek bulgu — zod 4.6.5 → 4.6.7 (büyük koleksiyonda bellek tüketimi), sharp 0.34.5 → 0.35.5 (libvips / libheif açıkları; S.A.Y'ın görüntü araçları kullanıcı fotoğrafı işliyor) — güncellendi, denetim 0. Yapılmayan: sızma testi (yetkili kullanıcıyla yetki yükseltme denemeleri) ve kullanım testi ekran ekran yapılmadı; bunlar CI'ın yetki / kiracı / tarama kilitlerine dayanıyor.
- **2026-11-10 / 11 — S.A.Y kayıttan oynatma sınavı: yazıldı, KALDIRILDI:** 10 Kasım gecesi çekirdeği yazıldı (kayıtlı konuşmadan soru kurma, ilk kararı karşılaştırma; hiçbir yere bağlanmadı). 11 Kasım reisim: *"bu sınav işi kafama yatmadı komple kaldıralım daha önce yaptığımız gibi devam ederiz"* — kod ve testleri silindi (`src/server/yz/sinav.ts`, `tests/say-sinav.test.ts`, `tests/bozan/say-sinav.bozan.ts`). S.A.Y'ın temel kurallarındaki değişiklik eskisi gibi gerçek işle denenir (reisim'in denemesi + say_istek ölçümü). Kendi işinden öğrenme (firma hafızası, göç 0121) duruyor; sınav onun parçası değildi. Yeniden önerilmez.
- **2026-11-10 — KARAR: probata'nın kendi yapay zekâ anahtarı Yönetim'den girilir, Vercel'den değil:** reisim: *"neden vercele apı key gireceğiz ? ne alaka ? şirketler haricinde yönetim kısmından kendi apı keyimizi girdiğimiz bir yer olsun ordan girelim vercel falan uğraşmaya gerek yok süresi bittikçe tekrar girmek için uğraştırma beni, buna göre kurgula işi ama şimdilik bu api keyin girileceği sayfayı tasarlamayla falan uğraşma"*. Kurgu: probata'nın kendi hesabından yapılacak yapay zekâ çağrıları için anahtar, firmalardan bağımsız, Yönetim panelinde tek yerden girilir ve değiştirilir (şifreli saklanır, ekranda son 4 hane); ortam değişkeni istenmez. Sayfa şimdi yapılmaz; bugün bu anahtarı isteyen bir iş de yok (sınav 11 Kasım'da kaldırıldı). Bundan sonra reisim'den Vercel'e anahtar girmesi istenmez; yeni bir dış hizmet anahtarı gerekirse yeri Yönetim'dir.

- **2026-11-09 — Telefonda belge önizlemesi, yaklaşan muayeneler, e-postayla teklif:** reisim: *"telefonda pdf ön izlemesi ekrana sığmıyor, düzelt, senesi yaklaşan aranması gereken müşteriler için teklifler de teklif hazırla tuşunun yanına yaklaşan muayeneler tuşu olsun ve orada sadece gelecek muayenesine son 2 ay kalan müşteriler - tesisler gözüksün uyarı balonu olsun, ilgili yer de teklif gönderme işi de mail ile olsun teklif gönder diiynce ön izleme ile müşterinin mailine gönderilecek mail düzenlenebilsin vs detaylandırırsın benim mantığıma göre"*. **Önizleme:** programın ürettiği belge bütün ekranlarda kaba sığar (components/belge-onizleme, tek üretici). **Yaklaşan muayeneler** (/teklifler/yaklasan): tesis başına, bir ekipmanının sonraki muayenesi son 2 aya girince; tarihi geçen 2 ay daha "geçti" olarak kalır (aranmadan kaybolmasın; karar benim, "detaylandır" dedi), açık planı olan yok. Satırda aranacak kişi + telefon, bu dönemin teklifi (muayeneden en çok 3 ay önce hazırlanmış), "Teklif hazırla" (tesisin ekipmanı fiyat listesiyle dolu, geçerlilik 30 gün). Balon tuşta ve yan menüde, yalnız teklifi hazırlayacak kişiye ("yaz" düzeyi), yalnız teklif bekleyenleri sayar: teklif yok, taslak, süresi dolmuş — kırmızı tarihi geçen, sarı yaklaşan. **Teklifi gönder** (121 "PDF elle iletilir" kalktı): pencere alıcı (müşterinin e-postası, en çok 5), düzenlenebilir konu ve ileti, önizleme (E-posta · Teklif belgesi); gönderince aynı işlemde teklif "gönderildi", PDF saklanır, ekli e-posta kuyruğa; PDF düşerse hepsi geri alınır. Gönderilmiş teklif "Yeniden gönder"; elden verilen için pencerede "Gönderildi olarak işaretle". Giden e-postalar teklif sayfasında. S.A.Y: teklif_yaklasan, pdf_gonder tur teklif. Gönderim Resend kurulana kadar sırada bekler (pencerede uyarı).

- **2026-11-08 — S.A.Y Chat düzeltmeleri, Saha listesi kalktı:** reisim (ekran görüntüsüyle): *"fiyat yazmasın, yukarıdan plan değiştir, bir fotoğraftan işlendi işareti kalkınca hepsinden kalkıyor, işlendiği belli olacak şekilde iki adet tik vs olabilir, saha listesi ne işe yarıyor anlamadım ve gerek yok, eskisi gibi direk rapor oluşturma modu olsun yukarıda onun tuşu olsun, rapor modu, chat modu diye ayrım olsun"*, *"geçmişi silme tuşu yok o da olsun"*. Aynı gün kurulan Saha listesi (sunum 4ApGDVAfUgvm8C5nTSRVbh) ve iş tutarı kalktı. Üstte plan seçimi + Geçmişi sil; işlenmiş mesajda çift tik + plan no; işaret mesaj menüsünden, yalnız o mesajdan kalkar. **Rapor modu:** sunum HBwuL3s9G693uopxSzTbjH, reisim 2026-11-09 *"Evet, önerilerle"* (K1 satırlar formattan, ayar sayfası yok · K2 yapay zekâ yalnız "Bekleyenler için rapor yaz"da, etiket boş satırlara · K3 test tablosu fotoğrafları raporda · K4 kayıt cihazda birikir, rapor yazma bağlantı ister · K5 kayıt rapor bağlantısıyla kalır, Geçmişi sil yalnız Chat · K6 panel son modda açılır). Yeni ekipmanın kodunu sunucu verir.
