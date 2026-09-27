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
- Rapor arşivi (reisim 2026-09-22): **5 yıl yeterli, sonra silinecek.** Bu, anayasa 4.12'nin istisnasıdır ve
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
| 6 | Rapor Şablonları (kodda) | Firma × ekipman türü: kontrol kriterleri + PDF formatı, sürümlü; site içi düzenleyici yok |
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
  Kullanıcılar). Menüde yok: 6 Rapor Şablonları (kodda), 16 PDF Üretimi (sunucu işi), 17 Müşteri Paneli (müşterinin
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
  M8'de reisim'le kararlaştırılacak; §8.3 o zaman güncellenir.
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
- **SGK DETSİS no tek yerde, tesiste** (M2); sözleşmede ve raporda oradan görünür (B).
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
- **Tek sayfa** (74). **Tesiste açık plan varken ikinci plan açılır** (77); o plandaki ekipman bu plana alınamaz.
- **Kapsam** (78): kontrolü eşik içinde gelen ve ilk kontrolü yapılacak kayıtlı ekipman seçili gelir (eşik firma ayarı, başlangıç 30 gün).
  **"Sahada kaydedilecek yeni ekipman" alanı kalktı**: yeni ekipmanı denetçi sahada plana ekler; **kapsam boş da** plan açılır.
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
- Şablon **kodda**, site içinde düzenlenmez; önizleme salt okunur. PDF sunucuda üretilir (§8.3); önizleme onun iskeleti, ekrana göre akar.
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
**"Onayı geri al"** (102): onaylanıp imza bekleyen rapor yeniden kuyruğa döner · **"Düzelt (R1)"** (103): imzalı raporun düzeltmesi yeni
sürümle, önceki sürüm saklanır · Planlar'daki rapor rozeti **"İmza bekliyor" / "Müşteriye açık"** (106; iki tablonun durum sütunu genişledi) ·
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

 (2026-09-18 araştırması; kaynaklar bölüm 10)

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
2. **Veri:** PostgreSQL + satır seviyesi güvenlik (firma ve müşteri izolasyonu veritabanında) + dosya deposu
   (fotoğraf/PDF). Gerekçe: rapor arşivi ve süzme ilişkisel iş; dışa aktarım standart; güvenlik sunucuda.
   **2026-09-18 revizyon (reisim: "illa bir şey kurmaya gerek var mı? localhost ve yerel depolama"):** Supabase ve
   Docker **kalktı**. Yerelde kurulum yok: PostgreSQL projeyle birlikte gelen gömülü sürümle çalışır (npm paketi,
   ilk `npm install`'da iner, veriler proje klasöründe), dosyalar yerel klasörde, giriş/kimlik bizim kodumuzda.
   Yayında aynı yazılım: yönetilen PostgreSQL + S3 uyumlu dosya deposu; tek yapılandırma dosyası değişir.
3. **8.3 Rapor çıktısı:** sunucuda üretilen PDF; şablonlar **firma × ekipman türü başına kodda** (§3), sürümlü;
   Bakanlık formatlarını birebir üretir. Site içinde şablon düzenleyici yok.
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
   Depo **herkese açık** (`github.com/cankonuralp/pkproje`), GitHub Pro yok.
   Sonuç: kaynak kodun tamamı ve buradaki ürün kurgusu kamuya açıktır; sır/anahtar asla koda yazılmaz, gerçek veri
   asla depoya girmez (CLAUDE.md §8 tarama kuralı). Kural dosyaları 2026-09-22'de kök klasöre taşındı ve
   yayımlandı; önceki ürünün alan adı ve gerçek müşteri adı metinden çıkarıldı.
9. **8.9 Arka plan işleri — KARAR (2026-09-22):** kalibrasyon ve eğitim uyarıları, yedek, 5 yıl silme, toplu PDF
   için **PostgreSQL üstünde iş kuyruğu** (pg-boss). **Ayrı servis yok** — kurulum yükü doğurmaz. İhtiyaç doğan
   modülde kurulur.
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
12. **8.12 Görsel kimlik — KARAR (reisim 2026-09-23):**
   · **Ürün adı: probata.** Slogan: *Periyodik Kontrol Yönetimi*. Firma alt alan adları `<firma>.probata.com.tr`
     biçiminde düşünülür (alan adının alınması ayrı iş).
   · **Logo paketi:** `probata-logo/` (reisim hazırladı). SVG'ler yalnız yol/şekil taşır, yazılar eğriye çevrili;
     dört renk (renkli · koyu zemin · siyah · beyaz) × dört yerleşim (işaret · yatay · yatay sloganlı · dikey) +
     favicon, iOS ve PWA ikonları. Kullanım kuralları paketteki `OKU-BENI.md`'de: site üst çubuğu yatay-renkli
     (koyu zeminde koyu-zemin), PDF üst bilgisi yatay-sloganlı, koruma alanı işaret yüksekliğinin ¼'ü, ekranda
     en küçük yatay logo 120 px; renk değiştirme, esnetme, gölge YASAK.
   · **Renkler (marka):** Petrol **#0F2A3D** · Onay yeşili **#1FA37A** · Kâğıt (zemin) **#F5F3EE** · Slogan
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
   yazılır, site içi düzenleyici yoktur. Önceki "firma PDF formatını yükler" yorumum **düzeltildi**.
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
14. SGK sicil numarası → müşteride değil **tesiste**. 15. Rapor şablonları → **kodda**, firma × ekipman türü.
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
- **Rapor durumları (kronolojik):** **Yeni** (denetçi açar, yazar, kaydeder) → **Teknik yönetici onayında** ("Gönder") → **Muayene uzmanı onayı**
  (onaydan dönen rapor, denetçi "İmzala" der) → **İmzaya gönderildi** → **Tamamlandı**. İmza yolu firmaya göre kurulur. Geri gönderilen rapor
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
→ **Kararlar:** izin talebini firma yöneticisi onaylar ya da gerekçeyle reddeder (Personel › İzin talepleri; bekleyen üstte, yıllık izinde
kalan hak yanında, aşıyorsa uyarı); ölçüm metodu (formattaki: üç uçlu, çevrim empedansı, klamp) ekipman türünde seçilir, raporda türden
okunur, seçilmez. Planlar'da "en üstte" sorusu (denetimdeki plan hep üstte mi, "Denetimde" süzgeci seçili mi gelsin) cevaplanmadı; sıralama aynı.

**Otuz ikinci tur (2026-09-28, reisim birebir):** *"raporların çıktıları ön izleme olarak baktığımda sana verdiğim pdfler gibi gözükmüyor hala ?
Sanki uygulamanın temasına göre bir pdf oluşuyor birebir aynı pdf çıktısı olmalı final raporu ayrıca planlarda en son planlar konuştuğumuz gibi
değil verdiğim formatları kullanacağımız ekipmanların kontrolleri olan planlar olsun ya da ben yapabileyim. Fonksiyonlar çalışsın"* · *"Ama neden
en üstte değil en yeni onlar açıldı neye göre üstte değil en son açılan plan en üste olursa en son onlar açıldıysa neden en üstte değiller"*
→ **Kararlar:** (a) Planlar'ın varsayılan sırası planın **açıldığı zaman**, en son açılan üstte (önceki "en yeni" başlangıç tarihi olarak
anlaşılmıştı); son formatlarla açılmış örnek plan en son açılan → en üstte. (b) Formatlı türde final rapor ve ön izleme resmî PDF'in birebir
sayfa düzeninde (siyah-beyaz A4, başlık tablosu, bölüm tabloları, onay kutuları), uygulama temasından bağımsız. (c) Plan aç → Planlar → kabul →
denetim → ekipman → rapor → onay zinciri sayfalar arasında çalışır (maket tarayıcıda saklar); reisim kendi planını açıp yürütebilir.

**Açık kalanlar:** ~~Ana sayfada İSGGM duyuruları~~ (2026-09-27: makette eklendi; okuma işi uygulamada) (reisim 2026-09-26: *"Ana sayfada isgüm duyurularını gösterebilir miyiz ? Bunu
yapılacaklar listesine ekle"*; öneri: ÇSGB İSGGM duyurular sayfası — https://www.csgb.gov.tr/isggm/duyurular/ — sunucuda günde birkaç kez
okunur (pg-boss işi, §8.9), Ana sayfada son 5 duyuru başlık + tarih + kaynağa bağlantı; yalnız ekranda, bildirim yok; sayfa RSS vermiyorsa
sayfa yapısı değişince okuma bozulabilir → okunamazsa sessiz kalmaz, "duyurular alınamadı" yazar; maket sırası Ana sayfa revizesinde) · **modül modül gözden geçirme** (M1–M5 ve M13 onaylandı — Ekipmanlar kalktı, Sözleşmeler birleşti; M6 Plan aç 2. tur incelemede) · **toplu maket çalışması** (M1–M16 + toplu bakış, `MAKET-PLANI.md`; sorular §3.6'da, 32'den) · **önizlemede örnek veri kipi** (öneri, §3.3) · ~~rol × modül görünürlüğü~~ (karar 2026-09-25: başlangıç düzeni + firma yöneticisi değiştirir) · **gerçek sunucunun sağlayıcısı**
(Türkiye, §8.8) ·
alan adının alınması · e-imza yöntemi (8.4) · v1 ekipman grupları · 5 yıl sonrası silme
mekanizması · **zimmette birden çok cihaz varsa süzgeç** (§3) · ~~kontrol metodu standardının seçim yeri~~ (2026-09-27: ekipman türünde seçilir, raporda türden okunur) · **§3.1 ve §3.2'deki "öneri" maddeleri** (planlama saat dağıtımı,
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
- Emsal ürünler: https://opwire.app/iso-17020-periyodik-kontrol-yazilimi/ · https://17020muayene.vidco.com.tr/ · https://akuple.com/asansor-kontrol-yazilimi/ · https://ensyazilim.com/

## 11 · Değişiklik günlüğü
- 2026-09-28 (104): **Planlar sırası: en son açılan üstte** (§9 otuz ikinci tur): varsayılan sıra açılış zamanı; P-0926-040 en son açılan
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
