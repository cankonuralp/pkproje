# pkproje.md — Periyodik Kontrol Uygulaması: alan bilgisi, ürün kurgusu, kararlar

> ⛔ Bu dosya projenin **kalıcı alan bilgisi ve ürün kurgusudur**. `ANAYASA.md` 0.13 gereği her
> oturum başında, anayasa ve tasarım kalıbıyla birlikte TAM okunur. Yerinde düzenlenir (anayasa 12.1), her
> ekleme tarih taşır. Buradaki hiçbir madde reisim onaylamadan **yapılacak iş** değildir; onay durumu her
> bölümde ayrıca yazar. Gerçek müşteri/firma adı bu dosyaya girmez (anayasa 5.8, 10.3).

Oluşturma: 2026-09-18 · Son güncelleme: 2026-09-24

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
| 1 | Kullanıcı & Rol | Giriş, çoklu rol, rol bazlı ekran yetkisi |
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

---

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

**Açık kalanlar:** **rol × modül görünürlüğü** (reisim: *"sonradan belirleriz"*) · **gerçek sunucunun sağlayıcısı**
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
