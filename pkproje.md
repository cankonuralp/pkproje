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
  yüklerken hangi standarda göre yaptığını kendi seçecek"*. **Açık soru:** seçim rapor anında mı yapılır, ekipman
  türü düzeyinde mi tanımlanır. (Not: "standartlar sistemde yüklü olacak, herkes erişebilecek" sözü aynı gün
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
| 3 | Müşteri & Tesis | Müşteri; tesis (adres, SGK işyeri sicil no); müşteri kullanıcıları (e-posta) |
| 4 | Standart Kütüphanesi | Firma başına; firma kendi yükler; kontrol metodu standardı buradan seçilir |
| 5 | Ekipman Türü Kataloğu | Ek-III grubu, branş, periyot, standart(lar), yetkili meslekler, akreditasyon gereği, Bakanlık format kodu |
| 6 | Rapor Şablonları (kodda) | Firma × ekipman türü: kontrol kriterleri + PDF formatı, sürümlü; site içi düzenleyici yok |
| 7 | Ekipman | Tesise bağlı, kalıcı; özellik değerleri; rapor geçmişi; sonraki kontrol tarihi; durum (kullanılabilir / kullanılamaz) |
| 8 | Ölçüm Cihazı | Ad, seri no, envanter no, kalibrasyon tarihi, sertifika, ara kontrol; 30 gün uyarı |
| 9 | Zimmet | Varlık: cihaz, araç, diğer. Her teslim ayrı kayıt: teslim eden → alan, tarih-saat, fotoğraflar, zimmet formu. Anlık "kimde" + tam geçmiş |
| 10 | Eğitim Takibi | Personel eğitimleri, belge, tekrar süresi, bitmeden uyarı |
| 11 | Teklif | Müşteri, tesis, kalemler (ekipman türü × adet × birim fiyat), durum |
| 12 | Sözleşme | Firmalar arası iş sözleşmesi + İSG-KATİP kayıtları (no, onay tarihi, yetkili kişi, tesis) |
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
sunumunun son turu onaylanınca Planlar + plan içi dondurulur: sayıları (34 / 44 px, kart eşiği 960 px, sayfa ekipman 10 · rapor 20)
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

#### Maket M1 — Kullanıcı ve Rol · Personel (modül 1, 2) — ONAY BEKLİYOR
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
Açık soru yok — 32–43 ve 159 cevaplandı (§9, on ikinci tur). 2. turun kendisi reisim'in incelemesini bekliyor.
**Ölçüm (2026-09-25, bulut, 2. tur + zimmet formu):** 27 durum × 1920 · 1080 · 375 × açık/koyu = **162/162 temiz**, 1080'de çekmece açık 2/2; etkileşim
**35/35**, telefon 108/108 (rol seçicisi, eksik bilgi çipi, rol kaydetme, yetkisiz meslekte uyarılı inspector, hesap aç → geçici parola → kart, yeni geçici
parola, hesabı kapat, rol yetkilerini düzenle / kaydet / önerilene dön, yöneticinin sabit hücresi, özlük belgesi, eski Kullanıcılar
bağlantısı, geçici parolayla giriş, Ana sayfa rol anahtarı ve onay kuyruğu sırası). Ölçerken düzeltilen: telefonda zimmetteki uzun varlık
adı 93 px taşıyordu (kısa kimlik bağlantı, ad alt satırda) · özlük notundaki satır içi bağlantı 16 px küçük hedefti (kaldırıldı) · telefonda
rol yetkileri çubuğuna üç tuş sığmıyordu ("Önerilen düzene dön" tablonun üstüne alındı).
1. tur (2026-09-24): 18 durum 108/108, etkileşim 17/17 (Kullanıcılar ayrı ekrandı).

#### Maket M2 — Müşteri ve Tesis (modül 3) — ONAY BEKLİYOR
Ekranlar (`maket/musteriler.html`): **liste** (tesis sayısı ve illeri, ekipman, portal kullanıcısı, en yakın kontrol, açık
uygunsuzluk; çipler: kontrolü 30 gün içinde · İSG-KATİP kaydı olmayan tesis · portal kullanıcısı yok · açık uygunsuzluk; il
seçicisi; arama tesis adını da bulur) · **müşteri sayfası** (bilgi yüzleri, müşteri bilgileri, tesisler, portal kullanıcıları) ·
**tesis sayfası** (işyeri bilgileri — raporun işyeri bölümü buradan dolar, İSG-KATİP kayıtları ve açık plan için uygun / geç
onay, plan) · pencereler: **müşteri ekle / düzenle · tesis ekle / düzenle · portal kullanıcısı ekle**.
**Varsayımlar:**
- Bakış **planlama ekibi** (öneri tablosunda Müşteriler'i değiştirir). Planlar maketindeki 9 müşteri ve tesis aynı adlarla.
- Müşteri **vergi no ile eşsiz** (aynı müşteri iki kez açılmaz; şahıs şirketinde 11 hane). Tesis **SGK işyeri sicil no ile eşsiz**
  (26 hane rakam; biçim birincil kaynakta doğrulanmadı). SGK no tesiste (reisim 2026-09-22).
- Tesisin adresi **raporun adresi**; il ve ilçe şimdilik serbest metin.
- İSG-KATİP kayıtları tesis sayfasında görünür, girişi M5'te; "açık plan için" sütunu plan kabulündeki kuralın aynısı
  (onay ≤ kontrol − 1 gün).
- **Portal kullanıcısı** müşteriye bağlı, e-postayla davet edilir; kapsam **bütün tesisler** (varsayılan) ya da **seçili tesisler**.
  Başka müşterinin hiçbir kaydı görünmez (§3).
- "En yakın kontrol" tesislerin sonraki kontrol tarihlerinin en yakını (sonradan ekipmanlardan hesaplanır, M3); 30 gün içi uyarı.
- Açık uygunsuzluk sayısı müşteride (M9 / M11'den beslenir). Müşteri ve tesis **silme** makette yok (soru 48).
- Faz 2 bağlantıları müşteri sayfasında (2026-09-24, M12–M14 gelince): **Teklif** · **İş sözleşmesi** · **Açık alacak** yüzleri o müşteriye
  süzülü listeyi açar; faturası olmayan müşteride alacak yüzü tıklanmaz (boş liste gösterilmez, anayasa 2.6).
**Sorular (M2):**
44. Portal kullanıcısının kapsamı: **bütün tesisler** mi, **tesis başına** da kısıtlanabilsin mi (öneri: ikisi de, varsayılan bütün
    tesisler)? *(Bağımlılık: M11 Müşteri Paneli, soru 35.)*
45. Müşteride **vergi no zorunlu** ve eşsiz olsun mu? Şahıs şirketinde 11 haneli numara kişisel veri — saklansın mı?
46. Tesiste **SGK işyeri sicil no zorunlu** ve eşsiz olsun mu (raporda zorunlu alan, Ek-III 1.7.1)?
47. Bir tesis **tek müşteriye** mi ait (öneri), yoksa aynı adreste birden çok müşteri (ortak alan, kiracı işletme) olabilir mi?
48. Raporu olan müşteri / tesis **silinmez, pasif olur** (öneri) — uygun mu?
49. "Kontrolü yaklaşan" eşiği **30 gün** mü (kalibrasyon uyarısıyla aynı), firma ayarı mı?
50. İl / ilçe **seçim listesi** mi (81 il, aramalı), serbest metin mi?
**Ölçüm (2026-09-24, bulut):** 8 durum × 1920 · 1080 · 375 × açık/koyu = **48/48 temiz**, çekmece 2/2; etkileşim **11/11** (toplu bakış
öncesi faz 2 yüzleriyle yeniden: 48/48, **14/14**).
Ölçerken düzeltilen: 1080'de tesis bilgisindeki 26 haneli SGK no (bölünmez kimlik) 26 px taşıyordu → bilgi listesinde iki sütun
genişlik ("cift") · boş değerli "Teklif ve sözleşme" yüzü kaldırıldı. Form alanı üreticisi ortak dosyaya alındı (Personel formu da
ona geçti, M1 yeniden ölçüldü 108/108).

#### Maket M3 — Ekipman Türü Kataloğu · Ekipman (modül 5, 7) — ONAY BEKLİYOR
Ekranlar: **ekipman türleri** (`maket/ekipman-turleri.html`: katalog — Ek-III grubu, branş, periyot, Bakanlık formatı, rapor
şablonu, akreditasyon; çipler: format zorunlu · akreditasyon · şablonu yok · standart seçilmemiş · **tür sayfası**: kontrol
kuralları, kontrol metodu standartları, yetkili meslekler, rapor şablonu · tür ekle / düzenle) · **ekipmanlar**
(`maket/ekipmanlar.html`: firma geneli sicil, 10'ar sayfa; çipler: kullanılamaz · hafif kusurlu · kontrolü geçmiş · 30 gün içinde ·
ilk kontrol bekliyor; müşteri / tesis / tür seçicileri; tesis, müşteri ve tür sayfalarındaki yüzlerden süzgeçli gelinir ·
**ekipman sayfası**: etiket bilgileri (Ek-III 1.7.2.1), tür kuralları, rapor geçmişi, kod geçmişi · ekipman ekle · etiket
düzenle · kodu değiştir).
**Varsayımlar:**
- Katalog 24 tür: Planlar maketinin 14 türü (aynı kod ve ad; Planlar artık ortak katalogdan okur) + §4.8 ve Ek-2'den kule kren, LPG
  tankı, yangın algılama, transformatör, yapı iskelesi, mobil kren, yürüyen merdiven, asılı erişim donanımı, sütunlu çalışma
  platformu, mekanik pres. **Standart atamaları örnektir** (doğrulanmadı; firma kendi kütüphanesinden seçer).
- **Yetkili meslekler türün Ek-III grubundan türetilir** (§4.6 birebir); tür başına ayrıca daraltma yok.
- Periyot tür düzeyinde (çoğu 12 ay, iskele 6); **sonraki kontrol = son imzalı kontrol + periyot** (inspector gerekçeyle değiştirir —
  ekranı M8).
- Kusur sınıflandırması (hafif / ağır) yalnız Bakanlık formatı **yürürlükte** olan türde (§4.5, Ek-III 1.9.1); taslak formatta yok.
- Rapor şablonu kodda (sürüm + yürürlük); **şablonu olmayan türde ekipman eklenir ama rapor açılamaz**.
- Ekipman ekranındaki kodlar Planlar maketindeki kodların **aynısı** (aynı algoritma; HT-1001 …); ortak veride 143 ekipman.
- Ekipman durumu son **imzalı** rapora göre: Kullanılabilir · **Kullanılamaz** (ağır kusur, giderilene kadar) · Kontrolü geçti ·
  İlk kontrol bekliyor · **Raporu onayda** (bu yılın kontrolü yapıldı, imza bekleniyor — "geçti" denmez).
- **Kodu değiştir** yalnız yönetici, gerekçe zorunlu, eski kod geçmişte kalır ve **yeniden verilmez** (karar 19'un genişletilmesi).
- Ekipman firma genelindeki listeden de eklenebilir (planlama); silme yok.
**Sorular (M3):**
51. Tür kataloğu **her firmanın kendisinin** mi (firma tür ekler), yoksa **bizim tuttuğumuz ortak katalog** mu? Rapor şablonu kodda
    olduğundan yeni tür de fiilen bizim işimiz — "Tür ekle" firmaya açık kalsın mı?
52. Yetkili meslekler **grup düzeyinde** mi (öneri), tür başına daraltılabilsin mi? *(soru 38 ile bağlı)*
53. Periyot yalnız tür düzeyinde mi; ekipman düzeyinde **istisna** (3 yılda bir test basıncı, 10 yılda yeniden değerlendirme, §4.7)
    gerekir mi?
54. **Tahmini kontrol süresi** türde tutulsun mu (plan saat önerisi için, §3.1 öneri)?
55. Ekipman **firma genelindeki Ekipmanlar ekranından** da eklenebilsin mi, yoksa yalnız plan açarken (planlama) ve sahada (inspector)?
56. Eski ekipman kodu **yeniden verilmesin** (öneri) — uygun mu?
57. Ekipman sökülünce / satılınca: **"Hizmet dışı"** durumu (raporları kalır, plana alınamaz) önerisi uygun mu?
**Ölçüm (2026-09-24, bulut):** 10 durum × 1920 · 1080 · 375 × açık/koyu = **60/60 temiz**, çekmece 2/2; etkileşim **14/14**.
Ölçerken bulunup düzeltilen: 1080'de akreditasyon rozeti sığmıyordu (listede kısa ad) · pencerede iç içe kaydırma alttaki tuş
çubuğunun altında kalıyordu (kaldırıldı) · 143 ekipmanda sayfalayıcı 15 tuşla iki satıra taşıyordu (7'den fazla sayfada "1 … 7 8 9 …
15", telefonda "1 … 8 … 15") · **onaylı Planlar maketinden beri "önceki sayfa" tuşu boştu** (`chevron-left` ikon dosyasında yoktu →
eklendi; iki yeni kilit: maket betiklerindeki her ikon adı dosyada olmalı + ölçümde çizilen her ikonun karşılığı) · raporu onayda
olan ekipman "Kontrolü geçti" görünüyordu · müşteri değişince başka müşterinin tesisi seçili kalıyordu (liste sessizce boşalıyordu).

#### Maket M4 — Ölçüm Cihazı · Zimmet · kalibrasyon uyarısı (modül 8, 9, 20 kısmı) — ONAY BEKLİYOR
Ekranlar: **ölçüm cihazları** (`maket/olcum-cihazlari.html`: liste üstünde kalibrasyon uyarı şeridi — geçenler kişi adıyla, 30 gün
içinde bitenler; "Göster" çipi uygular · çipler: kalibrasyonu geçmiş · 30 gün içinde · kalibrasyonda · ara kontrol gecikti · depoda ·
**cihaz sayfası**: cihaz bilgileri (rapora dolar, Ek-III 1.7.4), kalibrasyon kayıtları + sertifika, ara kontroller · pencereler:
cihaz ekle · kalibrasyon kaydı · ara kontrol) · **zimmetler** (`maket/zimmetler.html`: **Kimde** (anlık; kişiye göre adresten) ·
**Hareketler** (tam geçmiş, 20'şer) · **varlık sayfası**: fotoğraflı teslim geçmişi · **teslim penceresi**).
**Varsayımlar:**
- Varlık = **cihaz · araç · diğer** (saha tableti, KKD seti). Kimde = son teslimin alanı: kişi · **Depo** · **Kalibrasyonda**.
  Depo tarafında yetkili planlama ekibinden (Zeynep Arslan); kalibrasyona gönderim de bir hareket.
- Kalibrasyon geçerliliği sertifikadaki bitiş; **ara kontrol 6 ayda bir** (yapan branş yöneticisi) — ikisi de varsayım.
- Kalibrasyon durumları: Geçerli · 30 gün içinde · Kalibrasyonu geçti · Kalibrasyonda. **Uyarı yalnız ekranda** (liste şeridi, çip,
  cihaz ve varlık sayfasında şerit); e-posta ya da anlık bildirim YOK (anayasa 1.3). M10 Uyarılar'da toplanır.
- Kalibrasyonu geçen cihaz zimmette kalabilir; o kişinin raporları onaya **gönderilemez** (§3) — şerit bunu kişi adıyla söyler.
- **Cihaz türü → ekipman grupları**: rapora yalnız ilgili gruptaki zimmetli cihazlar gelir (§3'teki açık soruya öneri).
- Teslimde **en az 1 fotoğraf**, araçta **kilometre** zorunlu; kaydedince zimmet formu oluşur, **teslim alan kendi ekranından onaylar**
  (o zamana kadar "Onay bekliyor"); depoya iade ve laboratuvara gönderim onay istemez. Kişiye aynı varlık yeniden teslim edilemez.
- Sertifika dosyası (PDF) zorunlu; sonuç "Uygun değil" ise cihaz kullanımdan çekilir. Laboratuvardan dönen cihaz depoya girer.
- Ayrılan personelin zimmeti iadeyle depoya döner. Plaka il kodu **00** (gerçek olamaz), laboratuvar adları uydurma.
**Sorular (M4):**
58. Zimmette birden çok cihaz varsa rapora hangileri gelir: **hepsi** mi, **cihaz türünün ekipman gruplarına göre süzülmüş** mü (öneri),
    inspector rapor anında çıkarabilir mi? *(§3 açık soru; bağımlılık: M8 Saha ve Rapor.)*
59. Kalibrasyonu geçen cihaz **zimmette kalabilir** mi (öneri), yoksa bitiş günü teslim / kullanım mı engellensin?
60. **Ara kontrol** periyodu (öneri 6 ay) ve yapan kişi: firma ayarı mı, cihaz başına mı?
61. Zimmet formunun onayı: **uygulama içi onay** (öneri) mı, ıslak imzalı form mu, ikisi de mi?
62. Teslimde **fotoğraf zorunlu** mu (öneri: en az 1; araçta dört yönden önerilir)?
63. **Depo sorumlusu** kim: planlama ekibi mi, ayrı bir rol mü? *(Bağımlılık: soru 32 rol tablosu.)*
64. Araçlar için ek takip (muayene, sigorta, bakım tarihi) istenir mi, yoksa yalnız "kimde"?
65. Kalibrasyon uyarı eşiği 30 gün: **cihaz başına** değişebilsin mi?
**Ölçüm (2026-09-24, bulut):** 10 durum × 1920 · 1080 · 375 × açık/koyu = **60/60 temiz**, çekmece 2/2; etkileşim **12/12**.
Ölçerken düzeltilen: `list-checks` ikonu dosyada yoktu (M3'te kurulan çalışma anı ikon denetimi yakaladı) · telefonda iki arama ipucu
kesikti · seçim alanında kırpılan değerin tam metni (title) yoktu (ortak üreticide, bütün maketler için).

#### Maket M5 — İSG-KATİP kaydı (modül 12, kısım) — ONAY BEKLİYOR
Ekran: **İSG-KATİP kayıtları** (`maket/sozlesmeler.html`; menüde Sözleşmeler — iş sözleşmesi sekmesi M13'te gelir). Liste üstünde
**plan kabulünü durduran eksikler** (kabul bekleyen planda atanmış inspector için kayıt yok ya da onay geç; "Kayıt ekle" tesis ve
kişi dolu açar, "Kaydı aç") · liste: tesis · inspector · sözleşme no · onay tarihi · açık plan · plan kabulü için (Uygun · Geç onay +
en geç tarih · —) · çipler: açık plana bağlı · geç onay · seçiciler: inspector · müşteri → tesis · görünüm (güncel · önceki · hepsi) ·
adresten kişiye (personel kartındaki yüz) ve tesise göre (tesis sayfasındaki yüz) · **kayıt penceresi**: ekle (tesis, inspector,
sözleşme no, onay tarihi; seçilen tesiste kabul bekleyen plan varsa canlı denetim) · düzenle (kişi × tesis sabit) · önceki kayıt salt okunur.
**Varsayımlar:**
- Kayıt **kişi × tesis** (§4.6). Kişi × tesis için **tek güncel kayıt**: yeni sözleşme girilince eskisi "önceki kayıt" olur, silinmez.
- Kuralın **tek kaynağı** plan kabul kilidi (§3.2 2a): onay tarihi ≤ kontrol − 1 gün. Tesis sayfasının "açık plan için" sütunu ve bu
  sayfa aynı işlevi okur. Denetim yalnız kişinin **atandığı** planda; kabul edilmiş planda kilit şeridi gösterilir.
- Sözleşme no **zorunlu, biçimi serbest** (makette S-YYYY-NNNN uydurma), iki kayıtta aynı numara olamaz; onay tarihi GG.AA.YYYY, geçerli
  tarih. **Belge yüklenmez, geçerlilik aralığı yok** (reisim 2026-09-22) — pencerede bilgi şeridiyle söylenir.
- Inspector listesi: etkin personelden **mesleği yetkili kişi olabilenler** (inspector rolü şart değil; sözleşme yetkili kişiyle).
- Kaydı **planlama ekibi girer** (Zeynep Arslan); inspector kendi kayıtlarını görür (rol × modül önerisi "kendi", M1).
- Kabul edilmiş planın dayanağı olan kayıt düzenlenebilir: değişiklik hareket kaydına yazılır, **yapılmış kabul geri alınmaz**.
- Kişi × tesis kaydın kimliğidir, eklendikten sonra değişmez (yanlışsa yeni kayıt). Makette silme yok.
- Eksik uyarısı **yalnız ekranda** (anayasa 1.3); M10 Uyarılar'da toplanır.
**Sorular (M5):**
66. **Kaydı kim girer**: planlama ekibi mi (öneri), inspector kendi sözleşmesini mi, ikisi de mi?
67. **Yenileme**: kişi × tesis için yeni sözleşme girilince eskisi "önceki kayıt" olsun mu (öneri), yoksa aynı anda birden çok güncel
    kayıt tutulabilsin mi?
68. **Sözleşme no biçimi**: İSG-KATİP'in verdiği numaranın biçimini doğrulayamadım — serbest metin mi kalsın (öneri), biçim denetimi mi?
69. **Onay tarihi ileri olabilir mi?** Öneri: bugünden ileri tarih girilemez. Not: Planlar maketindeki P-0926-038 örneğinde onay 25 Eyl,
    maketin "bugün"ü 23 Eyl — örnek kendi içinde tutarsız; öneri onaylanırsa örnek, onayı bugünü geçmeyen bir geç onayla değiştirilir.
70. Kabul edilmiş planın dayanağı olan kayıt **değiştirilebilsin mi** (öneri: evet, hareket kaydına yazılır, kabul geri alınmaz), kilitlensin mi?
71. **Silme**: yanlış girilen kayıt silinebilsin mi (öneri: hiçbir planın dayanağı olmayan kayıt silinebilir, dayanak olan silinemez)?
72. Sözleşmenin **azami 6 ay geçerliliği** (§4.4; birincil metinde doğrulanmadı): aralık denetimi yok kararı durur; yalnız bilgi olarak
    "onaydan 6 ay geçti" işareti istenir mi?
73. Planlar'daki kabul kilidi sebebi ("Bu tesis için İSG-KATİP kaydı yok") bu sayfaya **bağlansın mı** (inspector'a görüntüleme, planlamaya
    "Kayıt ekle")? Planlar dondurulduğu için makette dokunulmadı.
**Ölçüm (2026-09-24, bulut):** 11 durum × 1920 · 1080 · 375 × açık/koyu = **66/66 temiz**, çekmece 2/2; etkileşim **14/14**; olumsuz
kanıt 2/2. Ölçerken düzeltilen: telefonda arama ipucu kesikti (kısaltıldı) · `#/isg/yeni?tesis=…` adresindeki ön dolgu liste süzgecine
de uygulanıyordu · sözleşme no şerit içinde satır sonunda bölünüyordu · telefonda kart beş satırdan "etiket: değer" satırlarına indi
(matris kartıyla aynı desen). Personel kartındaki İSG-KATİP sayısı artık önceki kayıtları saymıyor (M1 yeniden ölçüldü: 108/108, 17/17);
tesis sayfasının sütunu bu kuralı okuyor (M2 yeniden ölçüldü: 48/48, 11/11).

#### Maket M6 — Plan aç (modül 13, planlama ekibi) — ONAY BEKLİYOR
Ekran: **Plan aç** (`maket/plan-ac.html`; müşteri ve tesis sayfalarındaki "Plan aç" buraya gelir, müşteri/tesis dolu). Tek sayfa, beş
bölüm sırayla dolar: **1 Müşteri ve tesis** (açık plan ve İSG-KATİP kaydı olmayan tesis uyarısı) · **2 Tarih ve saat** (başlangıç,
saat aralığı, kapsamın tahmini süresi, açıklama) · **3 Inspector** (adaylar tablosu: bu tesis ve tarih için İSG-KATİP, EKİPNET,
kapsamda yetkili ekipman sayısı, aynı gün başka plan / saat çakışması, "Kabul edebilir / Kabul edemez" + sebep) · **4 Kapsam**
(tesisin kayıtlı ekipmanı: süzgeç, 10'ar sayfa, "Kontrolü gelenleri seç", başka açık plandaki ekipman seçilemez; **sahada kaydedilecek
yeni ekipman** tür × adet) · **5 Özet ve kabul ön koşulları** (proje no önizlemesi, tür başına kapsam ve ekipte yetkili kişi, kişi
kişi kabul koşulları + İSG-KATİP kaydına bağlantı) · **plan açıldı** ekranı (eksikli kişi şeridi, "Yeni plan aç").
**Varsayımlar:**
- **Sihirbaz değil tek sayfa**: ön koşullar birbirine bağlı (tarih İSG uygunluğunu, kapsam yetki eşleşmesini değiştirir), hepsi aynı
  anda görünsün. Bölüm tesis seçilmeden boş durum söyler ("Önce tesis seçin").
- Tesis seçilince tarih = tesisin **sonraki kontrolü** (geçmişse bugün); kontrolü **30 gün** içinde gelen ve ilk kontrolü yapılacak
  ekipman **seçili gelir**. Başka **açık planın** kapsamındaki ekipman seçilemez (aynı ekipman iki açık planda olmaz).
- Adaylar: inspector rolü olan etkin kişiler. Kabul koşulları Planlar'daki kilidin aynısı (§3.2 madde 2): İSG-KATİP (M5, tek kural),
  EKİPNET, firma yetkilendirmesi (M1); ek olarak giriş daveti kabul edilmemişse. **Eksikler planı açmayı engellemez**, kabulü durdurur;
  özet ve plan açıldı ekranı eksik kişiyi adıyla ve düzeltme bağlantısıyla söyler.
- Türe yetkili = meslek Ek-III grubuna izin veriyor **ve** firma o gruba yetkilendirmiş (2c öneri); kapsamdaki bir türe ekipte yetkili
  kimse yoksa özet uyarır (ekip düzeyinde; kişi tüm türlere yetkili olmak zorunda değil).
- Aynı gün başka plan bilgi, **saat çakışması uyarı**; engel değil. Tahmini süre tür sürelerinden (M3), yalnız ipucu.
- Kapsam tür başına **planlanan = seçili kayıtlı + sahada kaydedilecek yeni** (Planlar'daki "planlanan / planda" sayıları buradan doğar).
- Proje no kaydedince sunucu verir (§3.5); ekranda önizleme (P-0926-040). Plan açılınca ekipteki inspector'ların Planlar'ına "Kabul
  bekliyor" düşer, hareket kaydına yazılır; bildirim yok (anayasa 1.3). Açıklama plan içinde görünür, müşteri görmez.
- Makette sayfalar arası kayıt taşınmaz: açılan plan Planlar maketinin listesinde görünmez (ekranda yazılı).
**Sorular (M6):**
74. Plan açma **tek sayfa** mı (öneri, makette) yoksa adım adım sihirbaz mı?
75. Eksiği olan inspector (İSG-KATİP, EKİPNET, yetki) plana **atanabilsin mi** (öneri: evet, kabul durur) yoksa seçim engellensin mi?
76. Aynı inspector'ın **aynı saatte** başka planı varsa: uyarı (öneri) mı, engel mi?
77. Tesiste **açık plan varken** ikinci plan açılabilsin mi (ör. ayrı branş)? Öneri: açılabilir, aynı ekipman iki açık planda olamaz.
78. Kontrolü gelen ekipman **otomatik seçili** gelsin mi, eşik **30 gün** mü (öneri)?
79. Ekipte **sorumlu inspector** ayrımı olsun mu (öneri: hayır, Planlar'daki gibi ekip eşit)?
80. Planlar ekranına planlama ekibi için **"Plan aç" tuşu** eklensin mi? (Planlar dondu; makette giriş müşteri ve tesis sayfalarından.)
81. Plan açılırken **müşteri** bilgilendirilsin mi (ör. müşteri panelinde "planlanan kontrol" satırı)? Bildirim kurulmadı. *(Bağımlılık: M11.)*
**Ölçüm (2026-09-24, bulut):** 10 durum × 1920 · 1080 · 375 × açık/koyu = **60/60 temiz**, çekmece 2/2; etkileşim **12/12**; olumsuz kanıt
2/2. Ölçerken düzeltilen: telefonda açıklama ipucu kesikti · üstteki iki kısa bölüm geniş ekranda kabı doldurmuyordu (üç sütunlu
ızgarada üçüncü sütun boş kalıyordu; iç ızgaraya alındı) · ölçüm aracı form bölümündeki listeyi sayfa kenarıyla kıyaslıyordu
(`tools/olc-maket.js`: çerçeve artık bölümün iç genişliği; Planlar 54/54, M1 108/108 yeniden ölçüldü). M2'nin "Plan aç" denemesi artık
bu sayfaya gider (48/48, 11/11).

#### Maket M7 — Standart Kütüphanesi · Rapor şablonu önizlemesi (modül 4, 6) — ONAY BEKLİYOR
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
82. Kontrol metodu standardı: **tür düzeyinde atanıp rapor anında türün standartlarından seçilsin** (öneri) mi, yalnız biri mi? *(§3 açık soru.)*
83. Standart yükleme ve yeni sürüm yetkisi: **branş yöneticisi + firma yöneticisi** (öneri) mi? Okuma herkese açık mı?
84. Yeni sürüm yüklenince türler **kendiliğinden yeni sürüme** geçsin mi (öneri), yoksa tür tür onaylansın mı?
85. Standart dosyasının açılması **kayda geçsin mi** (kim, ne zaman; telifli belge)?
86. **Belge önizlemesi** yeni desen (kalıp 16): kâğıt ortada, en çok 880 px, metin bir basamak küçük, telefonda akar — uygun mu? (M9 PDF de
    bu desenle.)
87. Akreditasyon markası rapor başlığında **her raporda** mı, yalnız **akreditasyon kapsamındaki türlerde** mi?
88. Bakanlık formatı olmayan türlerde firma formatı Ek-III 1.7 sırasıyla (makette) yeterli mi; firma **kendi form kodunu** mu kullanır?
89. Şablon önizlemesini **inspector** da görsün mü (sahada neyi dolduracağını görmek için), yoksa yalnız yöneticiler mi?
**Ölçüm (2026-09-24, bulut):** 11 durum × 1920 · 1080 · 375 × açık/koyu = **66/66 temiz**, çekmece 2/2; etkileşim **12/12**. Ölçerken
düzeltilen: telefonda akreditasyon markası yeri ve 26 haneli SGK sicil no taşıyordu (belge metni bir basamak küçüldü) · telefonda künye
logoların arasına sıkışıp e-posta ve akreditasyon no bölünüyordu (künye alta alındı, no bölünmez) · örnek rapor geçen yılın tarihini bu
yılın şablon sürümüyle gösteriyordu (örnek bugün tarihli yapıldı). Ekipman türü sayfasındaki "Standart kütüphanesi" artık türe göre
süzülmüş listeye gider (M3 60/60, 14/14 yeniden).

#### Maket M8 — Saha ve Rapor (modül 14) — ONAY BEKLİYOR
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
- Taslak her değişiklikte kaydedilir (makette "son kayıt" satırı); çevrimdışı kuyruk sonraki fazda (§8.1).
- Planlar maketinde tek değişiklik: rapor satırındaki "Raporu düzenle / aç" tuşu bu ekrana giden bağlantı oldu (görünüş aynı).
**Sorular (M8):**
90. Onaya gönderme: eksik varken **tuş pasif + eksik listesi** (öneri) mi, tuş açık ve basınca eksikleri göstermek mi?
91. Kalibrasyonu geçmiş cihaz kilidi: yalnız **bu gruba uygun** cihaz mı kilitler (öneri), zimmetteki herhangi bir geçmiş cihaz mı? *(soru 58–59 ile bağlı)*
92. Sigorta okuma: **emin olunmayan satırlar toplu onaya girmesin** (öneri) mi? Okunan pano fotoğrafı rapora ek olarak saklansın mı?
93. Pano sigortaları bölümü hangi türlerde: **elektrik grubunun tamamı** (makette) mı, yalnız pano ve iç tesisat mı?
94. Her kusurlu maddeye **ayrı fotoğraf** bağlansın mı?
95. Sonraki kontrol tarihini değiştirmek: **gerekçe yeter** (öneri) mi, yönetici onayı da mı?
96. Geri gönderilen raporda yöneticinin gerekçesi üstte kalır; yeniden gönderilince **gerekçe geçmişi** raporda saklansın mı (öneri: evet)?
97. Sahada bağlantı durumu (çevrimdışı / eşitlendi) ekranda **ayrıca** gösterilsin mi, yoksa "son kayıt" satırı yeter mi?
**Ölçüm (2026-09-24, bulut):** 10 durum × 1920 · 1080 · 375 × açık/koyu = **60/60 temiz**, çekmece 2/2; etkileşim **15/15** (Planlar'dan
geçiş dahil). Ölçerken düzeltilen: 375'te üç seçenekli seçim satırı 8 px, "Giderilene kadar kullanılamaz" seçeneği 66 px taşıyordu
(telefonda seçenek iç boşluğu daraldı; seçenek "Kullanılamaz" oldu, açıklaması altında) · önceki raporun numarası satır sonunda bölünüyordu.
Planlar (54/54, 15/15) ve M7 (66/66, 12/12; kriter ve test listesi ortak veriye taşındı) yeniden ölçüldü.

#### Maket M9 — Raporlar · Onaylar · İmza · PDF (modül 14, 15, 16) — ONAY BEKLİYOR
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
98. Son imza yöntemi: **aracı imza servisi**, **indir-imzala-yükle**, ikisi de (firma ayarı, makette ikisi) mi?
99. **Toplu imza** (birden çok raporu tek seferde) olsun mu (öneri: evet)?
100. Branş yöneticisi yokken **vekil** (başka yönetici) onaylayabilsin mi?
101. Geri gönderirken **hangi bölümün** hatalı olduğu işaretlensin mi, yoksa serbest gerekçe (makette) yeter mi?
102. Onaylanan rapor imzalanana kadar **düzenlenemez** (öneri); değişiklik gerekirse yönetici "onayı geri al" mı?
103. İmzalı raporun düzeltmesi: **revizyon** (aynı numara + R1, eski sürüm saklanır; §3.2 madde 7 önerisi) uygun mu?
104. Müşteriye açılma **imza anında** (öneri) mı, planın bütün raporları bitince toplu mu?
105. Onaylayan yöneticinin adı **PDF'te** yer alsın mı (Ek-III istemiyor; 17020 gözden geçirme kaydı sistemde tutuluyor)?
106. Planlar'daki rapor rozeti de **İmza bekliyor / Müşteriye açık** diye ayrılsın mı?
**Ölçüm (2026-09-24, bulut):** 10 durum × 1920 · 1080 · 375 × açık/koyu = **60/60 temiz**, çekmece 2/2; etkileşim **12/12**. Ölçerken
düzeltilen: rapor numarasındaki küçük harfli ek, sayfa adresinde tanınmıyordu (rapor ve onay ekranı açılmıyordu). M7 şablon önizlemesi
belge üreticisine bağlandı (66/66, 12/12), Planlar denemesi hâlâ maketi olmayan modüle çevrildi (15/15), M8 yeniden (15/15).

#### Maket M10 — Uyarılar (modül 20) — ONAY BEKLİYOR
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
107. Uyarı **yalnız ekranda** (öneri) mı kalsın; e-posta ya da anlık bildirim istenirse kime, hangi uyarı için?
108. Başka uyarılar eklensin mi: ara kontrol gecikmesi (M4) · İSG-KATİP eksikleri (M5) · müşterinin **kontrolü yaklaşan ekipmanı** (planlama
     için) · 24 saati geçen onay (M9) · imza bekleyen rapor (M9)?
109. Eğitim tekrarı eşiği **60 gün** (öneri) mi; eğitim türü başına ayrı mı?
110. "Okundu / gizle" olmasın, **koşul kalkınca düşsün** (öneri) — uygun mu?
**Ölçüm (2026-09-24, bulut):** 5 durum × 1920 · 1080 · 375 × açık/koyu = **30/30 temiz**, çekmece 2/2; etkileşim **6/6**. Telefonda kart
"etiket: değer" satırlarına indirildi (M5 deseni).

#### Maket M11 — Müşteri Paneli (modül 17) — ONAY BEKLİYOR
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
111. Müşteri **aynı giriş sayfasından** (öneri) mı girer, ayrı adresten mi?
112. Panelde hangi marka: **probata** (makette) mı, **muayene firmasının logosu** mu, ikisi de mi?
113. Excel'deki bağlantı **paneldeki rapora** (giriş ister; öneri) mı gitsin?
114. Uygunsuzluk **nasıl giderildi** sayılır: yalnız sonraki / ikinci kontrol raporuyla (öneri) mı; müşteri "giderdim" deyip fotoğraf yükleyebilsin mi?
115. Müşteri **kendi kullanıcılarını** ekleyebilsin mi, yoksa yalnız firma mı açar? *(soru 35 ile bağlı)*
116. Panelde **planlanan kontrol** tarihi (açık plan) ve sonraki kontrol takvimi gösterilsin mi? *(soru 81 ile bağlı)*
117. Onaydaki / taslak raporların **varlığı da gizli** kalsın (öneri) mı?
**Ölçüm (2026-09-24, bulut):** 8 durum × 1920 · 1080 · 375 × açık/koyu = **48/48 temiz**, çekmece 2/2 (firma ekranında); etkileşim **6/6**.
Gözle bulunup düzeltilen (ölçüm yakalamıyor): telefonda **belge tablolarında kelimeler harf ortasından bölünüyordu** ("Yap ıldı") — ortak
belge stili düzeltildi, M7 (66/66) ve M9 (60/60) yeniden ölçüldü; Excel önizlemesi telefonda iki sütuna indi.

#### Maket M12 — Teklifler (modül 11, faz 2) — ONAY BEKLİYOR
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
118. Teklif no biçimi **T-AAYY-SIRA** (öneri) uygun mu?
119. Fiyat listesi **firma ayarı** (öneri) mı; müşteriye özel fiyat / iskonto olsun mu?
120. KDV %20 sabit mi; tevkifat, iskonto gibi muhasebe kalemleri gerekir mi? *(M14 ile bağlı)*
121. Teklif müşteriye **nasıl iletilir**: PDF indirip elle (makette) mi, sistemden e-posta mı? Müşteri **panelden kabul** edebilsin mi?
122. Kabul edilen teklifin adedini **aşan rapor** (sahada eklenen ekipman): ek teklif mi, aynı birim fiyatla otomatik mi (öneri: aynı fiyat,
     muhasebede "teklif dışı" işaretli)?
123. Teklif **tesis başına** (makette) mı, çok tesisli tek teklif mi?
124. Geçerliliği biten gönderilmiş teklif **kendiliğinden "süresi doldu"** olsun mu (öneri: evet)?
**Ölçüm (2026-09-24, bulut):** 9 durum × 1920 · 1080 · 375 × açık/koyu = **54/54 temiz**, çekmece 2/2; etkileşim **10/10** (teklif → plan aç
geçişi dahil).

#### Maket M13 — Sözleşmeler: firmalar arası iş sözleşmesi (modül 12, faz 2) — ONAY BEKLİYOR
Ekran: **İş sözleşmeleri** (`maket/is-sozlesmeleri.html`, planlama Zeynep Arslan): modül 12 tek menü öğesi, **iki sekme** — İSG-KATİP
kayıtları (M5, `sozlesmeler.html`) · iş sözleşmeleri. Liste (no, müşteri / tesis, süre + kalan gün, dayanak teklif, durum; çipler: imza
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
125. Firmalar arası iş sözleşmesi **sistemde kayıt + imzalı PDF** (makette) olarak mı tutulsun, yalnız "imzalandı" işareti mi yeter?
126. Sözleşme no biçimi **IS-AAYY-SIRA** (öneri) uygun mu?
127. Sözleşme metni **firmanın şablonundan kodda** üretilsin mi (rapor şablonu gibi, §8.3), yoksa firma kendi metnini yükleyip yalnız
     imzalısını mı saklasın?
128. Sözleşme **teklif başına** mı (makette; kapsam teklifin tesisi), müşteri başına **çerçeve sözleşme** (bütün tesisler, yıllık) mı?
129. Varsayılan **12 ay** ve **kendiliğinden yenileme** seçeneği uygun mu?
130. Plan, iş sözleşmesi **müşteri imzası beklerken açılabilir** mi (makette IS-0926-007 bekliyor, P-0926-039 açılmış), yoksa plan açma
     bunu da **engellesin** mi (İSG-KATİP kaydı gibi)?
131. İmzalı iş sözleşmesi **yüklensin** (makette), İSG-KATİP kaydında dosya **yüklenmesin** (M5) — ikisi farklı kalsın mı?
132. Bitişe **60 gün** kala şerit + çip (öneri) uygun mu; **Uyarılar**'a (M10) da düşsün mü?
133. Ödeme vadesi **sözleşmede** mi (makette), müşteri kartında mı? *(M14 ile bağlı)*
134. Müşteri paneli (M11) **sözleşmeyi göstersin** mi; müşteri panelden imzalayabilsin mi?
**Ölçüm (2026-09-24, bulut):** 8 durum × 1920 · 1080 · 375 × açık/koyu = **48/48 temiz**, çekmece 2/2; etkileşim **11/11** (sekme geçişi,
teklif → sözleşme formu, yenileme teklifi bağlantısı dahil). M5 (başlık + sekme) yeniden: 66/66, 14/14; M12 (bağlantı) yeniden: 54/54, 10/10.

#### Maket M14 — Muhasebe (modül 18, faz 2) — ONAY BEKLİYOR
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
135. Fatura **probata'da mı kesilsin** (e-Fatura / e-Arşiv entegratörüne bağlanarak), yoksa firmanın muhasebe programında kesilip
     **numarası mı yazılsın** (makette)? Muhasebe programına aktarım dosyası gerekir mi?
136. Faturalama **iş (plan) başına** mı (makette), müşteri başına **aylık toplu fatura** mı?
137. Muhasebeyi kim görür ve yazar: firma yöneticisi (öneri) mi, ayrı bir **"Muhasebe" rolü** mü? *(soru 33 ile bağlı)*
138. Fatura **imzalı raporlarla kısmen** kesilebilsin mi (makette: imzası sürenler sonraki faturaya kalır), yoksa **bütün raporlar
     imzalanınca tek fatura** mı?
139. İş **tahsilat tamamlanınca kendiliğinden** mi kapansın (makette), elle "İşi kapat" ile mi?
140. Vadesi geçen alacak **Uyarılar**'a (M10) ve **müşteri kartına** (M2) da düşsün mü? *(yalnız ekranda, bildirim yok)*
141. Tahsilat yöntemleri yeterli mi; **çekin vadesi** ayrıca izlensin mi?
142. Müşteri paneli (M11) **faturaları ve açık alacağı** göstersin mi?
143. Teklifi olmayan işte **fiyat listesi**, teklif dışı rapor faturada **ayrı işaretli kalem** (makette) — uygun mu? *(soru 122 ile bağlı)*
**Ölçüm (2026-09-24, bulut):** 10 durum × 1920 · 1080 · 375 × açık/koyu = **60/60 temiz**, çekmece 2/2; etkileşim **14/14** (fatura kaydet,
kayıtlı no reddi, tahsilat fazlası reddi, tahsilat → iş kapandı, Raporlar'a geçiş dahil). Planlar yeniden 54/54, 15/15 (süzgeç düzeltmesi;
"hazır olmayan modül" denemesi artık Performans); M13 yeniden 48/48, 11/11.

#### Maket M15 — Performans ve Raporlama (modül 19, faz 2) — ONAY BEKLİYOR
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
144. **Gün başı** ölçüsü rapor ÷ çalışılan gün (makette) uygun mu; kişi ya da branş için **günlük hedef** (ör. 8 rapor) tanımlansın mı?
145. **Kazanç** hangisi: raporlanan (makette, birim fiyat), faturalanan mı, tahsil edilen mi?
146. **Sayılan rapor:** onaya gönderilen + imzalı (makette) mı, yalnız imzalı mı?
147. Çok kişili planda kazanç **raporu yazana** (makette) mı, **ekibe paylaştırılsın** mı?
148. Kim neyi görür: yönetici hepsini, branş yöneticisi kendi branşını, inspector yalnız kendini (rol × modül önerisi) — **inspector kazancı
     görsün** mü?
149. Ek ölçüler gerekir mi: kabul / red edilen plan, ortalama onay süresi, geri gönderme oranı, uygunsuzluk oranı?
150. Dönemler (bu ay · bu yıl · geçen yıl) yeterli mi; **tarih aralığı** ve **Excel'e aktarma** gerekir mi?
151. Grafik biçimi: **yatay çubuk** (makette, yeni desen) uygun mu; zaman çizgisi (dikey sütun / çizgi) ister misiniz?
**Ölçüm (2026-09-24, bulut):** 6 durum × 1920 · 1080 · 375 × açık/koyu = **36/36 temiz**, çekmece 2/2; etkileşim **9/9** (dönem, branş,
sütun sıralama, görünüm, arama, kişiye geçiş, dönemin korunması, menüden açılış). Planlar ("hazır olmayan modül" artık Eğitimler) 15/15,
M14 14/14 yeniden.

#### Maket M16 — Eğitim Takibi (modül 10, faz 2) — ONAY BEKLİYOR
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
152. Eğitim kaydını **kim girer**: yönetici (makette) mi; personel kendi eğitimini belgesiyle girip yönetici **onaylasın** mı?
153. Eğitim türleri ve **tekrar süreleri** (makette örnek: temel İSG 12 ay, yüksekte çalışma 12, ilk yardım 36, 17020 bilgilendirme 24,
     elektrikte güvenli çalışma 12, yangın 12): firmanın gerçek listesi nedir; süreler kodda mı, firma ayarı mı?
154. **Kim hangi eğitimi almalı** (rol / meslek / branş başına zorunlu eğitim) tanımlansın mı; eksik zorunlu eğitim listede ayrıca görünsün mü?
155. Sertifika **zorunlu** mu (makette isteğe bağlı)?
156. Tekrar eşiği **60 gün** (makette, M10 ile aynı) uygun mu; tür başına farklı olsun mu?
157. Tekrarı geçen eğitim **plan kabulünü engellesin** mi (makette yalnız uyarı; §3.2 madde 2'deki koşullara eklenir)?
158. Bakanlık **yetkili kişi eğitimi** belgesi personel kartında (M1) kalsın mı, burada eğitim türü olarak da izlensin mi?
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
| 1 | Periyodik kontrol raporu | Saha ve Rapor, PDF (M7–M9) | var (maket, Ek-III 1.7 sırası) | firma × ekipman türü şablonu; Bakanlık formatı zorunlu türlerde biçim Bakanlığınki, firma yalnız künye / logo |
| 2 | **Zimmet teslim formu** | Personel kartı › Zimmetindekiler (M1) | **var — `KM-FR-ZMT-01` (2026-09-25)** | başlık, sütunlar, taahhüt metni, imza alanları, logo |
| 3 | Tarafsızlık ve çıkar çatışması beyanı | Planlar › plan kabulü (§3.4) | var (varsayılan metin) | beyan metni (firmanın kalite el kitabından) |
| 4 | Teklif belgesi | Teklifler (M12) | maket (liste + sayfa), PDF biçimi yok | başlık, kalem tablosu, koşullar, imza |
| 5 | İş sözleşmesi metni | Sözleşmeler (M13) | yok — soru 127 (kodda şablon mu, firma kendi metnini mi yükler) | metnin tamamı |
| 6 | Uygunsuzluklar Excel'i | Müşteri paneli (M11) | var (maket önizlemesi) | sütunlar ve sırası |
| 7 | Özlük dosyası belge türleri | Personel kartı (M1) | var (iş sözleşmesi, diploma, oda kaydı, EKİPNET belgesi, kimlik, sağlık raporu, diğer) | tür listesi |
| 8 | Numara ve form kodu önekleri | rapor no, form kodları (§3.5) | var (firma kısa kodu) | kısa kod (firma ayarı) |

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
Müşteri (işveren; adres, iletişim) · **Tesis** (adres, **SGK işyeri sicil numarası** — reisim onayı 2026-09-22:
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

**Açık kalanlar:** **modül modül gözden geçirme** (M1 2. tur incelemede; sırada M2) · **toplu maket çalışması** (M1–M16 + toplu bakış, `MAKET-PLANI.md`; sorular §3.6'da, 32'den) · **önizlemede örnek veri kipi** (öneri, §3.3) · ~~rol × modül görünürlüğü~~ (karar 2026-09-25: başlangıç düzeni + firma yöneticisi değiştirir) · **gerçek sunucunun sağlayıcısı**
(Türkiye, §8.8) ·
alan adının alınması · e-imza yöntemi (8.4) · v1 ekipman grupları · 5 yıl sonrası silme
mekanizması · **zimmette birden çok cihaz varsa süzgeç** (§3) · **kontrol metodu standardının seçim yeri**
(rapor anı mı, ekipman türü mü — §3) · **§3.1 ve §3.2'deki "öneri" maddeleri** (planlama saat dağıtımı,
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
