---
name: tasarim-kalibi
description: ⛔⛔ TASARIM KALIBI — referans Ekipmanlar ekranı; ölçülmüş sayılarla masaüstü/mobil kuralları
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 143efef1-a37a-4eec-926e-cf1a71f8dbf8
  modified: 2026-09-12T14:05:03.268Z
---

> ## ⛔ BU DOSYA HAKKINDA (aktarım tamamlandı, 2026-09-22)
>
> Bu, **pkproje'nin tasarım kalıbıdır**. Metin bir üretim projesinin tasarım kalıbından aynen geldi.
> `ANAYASA.md` bölüm 2 (görsel/UI işi) bu dosyayı tam okumayı şart koşar — ikisi birlikte çalışır.
>
> Kullanım:
> - **1–19 arası sayılar kaynak projenin ölçümüdür** (düğme ≤123px, süzgeç satırı 38px, etiket 11px gibi).
>   Bu projede kendi referans ekranımızı ölçerek belirleyeceğiz; **ölçmeden kopyalanmaz**.
> - **Yöntem aynen geçerlidir:** onaylanmış gerçek bir ekranı referans al, ölçümü yaz, kabul edilen
>   ve reddedilen örneği birlikte bırak, kuralı ölçen bir testle mekanik olarak zorla.
> - Bileşen adları (`.suz-satir`, `uzunTus`, `data-secim` …) o projenin adlarıdır; karşılıklarını
>   bu projede kuracağız — taşınan şey **tek üretici** disiplinidir, isimler değil.
> - Koddaki kanıtı için `02-GORSEL-SISTEM.md` ile birlikte okunur.


⛔⛔ **reisim 2026-09-11:** *"hala ekran tasarımlarında çok fazla boşluk bırakıyor, kullanışsız kalıyor. Bakımı kaydet tuşu mesela mobil için yapılmış gibi — web görünümünde neden o kadar geniş bi tuşa ihtiyacımız olsun? bu ve benzeri hataları sürekli yapıyorsun... belirlediğimiz bir tasarım kalıbı yok mu? eğer yok ise belirleyelim; şu an **ekipmanlar ekranından oldukça memnunum**, orayı örnek olarak kullanabilirsin."*

## ✅ UYGULAMA ÇEKLİSTİ — her görsel işte (reisim 2026-09-15: *"genel tasarım şablonumuza uyacağız"*)
**Koddan önce** (uyum beyanına yazılır, anayasa 0.12):
1. **Yüzey tipi** → liste/tablo · nesne sayfası · form · modal · süzgeç satırı · PDF · e-posta · uzun iş tuşu → aşağıdaki
   hangi kurallar (1–17) + anayasa 2.x maddeleri, numarayla.
2. **Mevcut üretici/sınıf** → **seçim alanı `data-secim` (kalıp 19)** · `filterBarHtml`/`filterBarDoldur` · `kipAnahtariHtml` · `_eqRoz`/`_eqSade` · `uzunTus` ·
   `showPdfDoc`/`pdfBaslik`/`pdfSec` · `mailTemplate` · `frmKolonla` · `pagerHTML` · `_czKimlikHtml` · `.btn*` ·
   `.form-input`/`.form-select` · `.fb-chip` · `.empty-state`. İkincisi AÇILMAZ; karşılığı yoksa kural 16.
3. **Maket masaüstü + mobil AYRI, onay** (anayasa 2.1–2.2). Palet dokunulmaz; kullanılan her `var(--x)` tanımlı mı grep (2.9).
4. **Ölçüm planı** → 1920 + **1080 (tablet yatay, panel katlı/açık)** + 375 · açık + koyu tema · verisi olan şirket; ölçülemeyecek olan baştan yazılır.
**Teslimde** (kanıt özetinin kalıp satırı): uygulanan kural numaraları + ölçümler — kart = kap genişliği (kenar ≤ 1 px) ·
düğme ≤ içerik (en genişi px) · satır 38 px · yatay taşma 0 · sert kırpma 0 · ve/veya var · süzgeç içerik yokken görünür ·
iki tema · komşu ekranlar (anayasa 13.4). Ölçülemeyen **"ölçülemedi"** diye yazılır (telefon), tahmin yazılmaz.

## 📐 REFERANS: Ekipmanlar ekranı (canlı ölçüm, 1920px)
| Ölçüt | Değer |
|---|---|
| Kap | tam genişlik (1670px), `max-width` YOK, 22px yan boşluk |
| **Düğme genişliği** | **70 düğme — en genişi 123px; hiçbiri 320px'i geçmiyor** |
| Düğme yüksekliği | 38–39px birincil · 30–31px küçük · 26px ikon |
| Tablo satırı | 32px (yoğun) |
| Kolonlar | içeriğe göre: 169/101/162/95/108/41 |
| Yazı | h2 18px/800 · bölüm etiketi 11px/700 |

## ❌ REDDEDİLEN: Bakım penceresi (düzeltmeden önce, 1080px)
`Bakımı Kaydet` **1036×48** · `Kapat` 1036×48 · checklist satırı 1036×44 ·
yönerge 1036×55 · parça/özet 1036×80 · **foto ekle 253×253** · Yapan/Tarih/Tutar 339px ×3
→ mobil düzenin masaüstüne uzatılmışı. **Düzeltme sonrası:** Kaydet 151×40, Vazgeç 85×40, iki kolon 509|509, foto 95×95, alanlar 237/132/120.

## ⛔ KURALLAR (kilit haritası kural 17'de — "hepsi kilitli" iddiası 2026-09-15'te bayat çıktı: 6 kilitsizdi)
1. **Düğme içeriği kadar geniştir.** `.btn-full` MOBİL aracıdır; masaüstünde `width:auto`. 184 çağrıyı tek tek düzeltmek yerine kural **sınıfın kendisinde** → bundan sonra yazılan her `.btn-full` de doğru doğar.
2. **Eylem çubuğu sağa yaslı**, düğmeler yan yana, içerik genişliğinde. Mobilde tek sütun, tam genişlik, yapışkan. ⛔ **Yapışkan olan ÇUBUĞUN TAMAMIDIR,
   tek düğme değil** (2026-09-15 üç genişlik ölçümü: `#bkm-kaydet`/`#kb-gonder` sticky ebeveyni içinde kayıp "Vazgeç"in üstüne biniyordu) → `.bkm-eylem`
   sticky + opak zemin; telefon kuralı taban kuralın ARDINDA (3.2). Kilit `tests/uc-genislik-2026-09-15`.
3. **Alanlar veri tipine göre ölçülür** — hepsi aynı boyda uzamaz (tarih 132 · tutar 120 · ad 237).
4. **Kırpma zinciri** (3 halka): her katman `min-width:0` → metni tutan yaprak BLOK + kendi `text-overflow` → tam metin `title`'da. ⛔ `text-overflow` **inline-flex/flex kapta ÇALIŞMAZ** — rozet `inline-block` olmalı.
5. **Veri yoksa gösterge de yok.** Boş ilerleme çubuğu kolonun 53px'ini yiyordu, üstelik tam da yazının en uzun olduğu durumlarda.
6. **Alt "Kapat" mobil güvencesidir** — masaüstünde gizli (23 modalın 23'ünde X var + Esc çalışıyor).
7. **Eşik HER ZAMAN 1000px + `body.has-module-sidebar`** — geri tuşu kuralıyla aynı ikili. Tek sistem, iki düzen ([[geri-tusu-web-mobil]]). **Tablet bandı 1000–1279 (2026-09-15):** içerik düzeni eşiği yine 1000, `has-module-sidebar` kalır; yan panel bu bantta DİKEYDEKİ GİBİ ☰ çekmecesi (çekmece eşiği 1279, masaüstü sabit panel ≥1280) — üçüncü düzen kabukta, içerikte değil (anayasa 2.11).
8. ⛔⛔ **ve/veya ANAHTARI HER ÇOKLU SÜZGEÇTE** (reisim 2026-09-11: *"kalıba sabitle, her yerde kullan — yeni yaptıklarında dahil göremiyorum"*). Kural: **≥ 2 seçilebilir çipi olan her süzgeç çubuğu** `kipAnahtariHtml(kes, azSecim, sahip)` taşır; `veya`=some, `ve`=every; <2 seçimde sönük; **imkânsız kesişim sessizce geçmez** (sebep notu `.fb-kip-not`); kip sıfırlamada KALIR. Tek dinleyici: `sahip` verilirse delegeli tıklama `kipDegis_<sahip>(kes)` çağırır — ekran başına `.sf-kip` bağlama yok. `filterBarHtml({ek: kipAnahtariHtml(...)})` yuvasıyla çubuğa girer. **Var (2026-09-12'den itibaren HEPSİ):** Ekipmanlar · Mahal · Raporlar · Çizelge · Dış Hizmetler · **Makine listesi · Makine olayları · Takvim · Depo stok** (reisim: *"bir hatadan bahsettiysem ilgili tüm hataları düzeltmen gerekli, başka modüllerde kullanılıyorsa onları da"*). Tekli "kip" çipleri (Personel Çalışanlar/Ayrılanlar/Hepsi, Pano dönem, Depo depo-seçici) süzgeç değil görünüm anahtarıdır — anahtar almaz.
   ⛔ **Anahtar satırdaki TÜM YÜKLEM çiplerini yönetir** (2026-09-12, reisim: *"veya'ya çevirdiğimde doğru çalışmıyor"*): Ekipmanlar'da durum + "Denetlenmeli", Raporlar'da durum + **"Sadece en son"** — hepsi aynı `yuklemler` dizisinde, ve=every / veya=some. Açılır süzgeçler (Mahal/Tür/Ay/Hazırlayan/Gün) ve arama HER ZAMAN kesişimdir. Anahtar, yönettiği çiplerden SONRA durur; ipucu yönettiği kümeyi söyler (`kipAnahtariHtml(kes, azSecim, sahip, ne)`); sönüklük sayımı tüm yüklem çiplerini sayar. Canlı: Uygunsuz∧en son 20 · Uygunsuz∪en son 123 · yüzler durum HARİÇ her şey uygulanmış tabandan sayılır.
   ⛔ **Sebep notu ÇİP ŞERİDİNE GİRMEZ** (2026-09-12, reisim: *"bug'lı seçim yapınca css çok bozuluyor"*): `.filter-chips` nowrap+overflow-x kaydırma şerididir, içine giren çok satırlı `.fb-kip-not` 138×111'e sıkışıp çipleri 117px'e gerdi. Not, Çizelge/Dış Hizmetler'deki gibi **boş listenin yerine** (`.empty-state`) yazılır; `.filter-chips{align-items:center}` önleyici — şeride ne girerse girsin çip boyu değişmez. Kilit: `tests/rapor-mail-foto-2026-09-12.test.js`.

9. ⛔⛔ **PDF YAZI ÖLÇEĞİ + KADEME** (reisim 2026-09-12: *"mahal isimleri daha büyük yazmalı, ayrımları fark etmek güç; başlık puntomuz belli değil mi? yoksa böyle bir kriterimiz yok mu?"* — ekranda vardı, PDF'te YOKTU, şimdi var). Ölçek (mm): **belge başlığı 5.2 › GRUP başlığı 4.0 (`pdfBaslik`, `.pdf-h1`) › kalem şeridi 3.1 (`.pdf-mail-eq`) › tablo 2.9 › not 2.7 › bölüm ETİKETİ 2.5 (`pdfSec`, büyük harf) › bant 2.3**. Kural: **iç içe yapıda üst kademe alttakinden hep BÜYÜK**; `pdfSec` bir etikettir, grup→kalem yapısında grubu `pdfBaslik` açar. Aynı kademe ekranda ve mailde: mahal 15px/800 › ekipman adı 13.5–14px. Kilit: `tests/pdf-baslik-olcegi-2026-09-12.test.js` (CSS'ten mm okuyup azalan sırayı doğrular).

10. ⛔⛔ **KAP TAM GENİŞLİK — HER SAYFA, MODAL, ÖNİZLEME, E-POSTA; İSTİSNASIZ** ⚠️ **ÜÇÜNCÜ UYARI 2026-09-12 gece** (mail 620 px kapaklıydı: *"mail çok kötü gözüküyor, sağ sol boşluklu … şu kenarları boş bırakma saçmalığından vazgeç artık, kaç defa demem gerekecek?"*) → `mailTemplate` kapak yok (`void maxW`, tüm mailler, tüm fonksiyonlar deploy), önizleme kartı kabı doldurur. **Teslimden önce ölç: kart genişliği = kap genişliği (kenar ≤ 1 px), 1920 ve 375'te; e-posta önizlemesi dahil.** Bir daha "okunur sütun" gerekçesiyle kapak KOYMA — reisim'in kararı geniş ekranı doldurmak. (İlk uyarı 2026-09-12 öğlen: *"ilk görsel ve benzeri ekranı tam olarak kullanmayan, hâlâ mobil tasarım kafasıyla kalmış sayfalar var"*). 1920'de ölçüldü: Ekipmanlar/Mahal 1670px'ken 20 sayfa 1400px kapağında, form sayfaları 980px'te (347px boş yan). Artık `body.has-module-sidebar #app .container{max-width:none}`; sayfa başına kapak YASAK (test `#page-* .container{max-width:Npx}` yakalar). **Genişlik alanlara değil BÖLÜMLERE gider:** form sayfalarında `frmKolonla()` `.frm-bol` başlıklı bölümleri `.frm-kol` kabına alır, `.frm-govde{column-width:440px}` çok kolonlu akış yükseklikleri dengeler; kolon <640px ise ikili alan ızgarası tek kolona iner (container query). 2026-09-09'daki "1400'de alanlar dağılıyor → 980 kapak" kararı YANLIŞ çözümdü: alanı daraltma, genişliği bölümlere ver. **Açıklama metni = göz karmaşası:** başlıkta/rozette söylenen şey satır olarak tekrarlanmaz (çizelge `.cz-bos` + lejant kaldırıldı). **Uzun liste = sayfalama YALNIZ istenen yerde:** Çizelge 10 ekipman/sayfa (alttaki akış görünsün diye). ⛔ Ekipmanlar'a eklediğim sayfalama reisim'in "o sayfa için bir şey istememiştim" sözüyle GERİ ALINDI — istenmeyen ekrana kalıp uygulama; "3. görsel" hangi ekransa o.

11. ⛔⛔ **MAİL PDF'İ TAKLİT ETMEZ — KISA ÖZET + PDF EKİ; EK DÜZ METİN, TIKLANIR GÖRÜNEN HİÇBİR ŞEY YOK** (reisim 2026-09-12 gece, `9de39bb` → `1ca04a7`). Öğleden sonraki "önizleme = mail = PDF, foto cid ile gömülü" çözümü (`658587a`) ilk gerçek gönderimde ÇÖKTÜ: *"gönderirken çok bekledi, dondu gibi"* · *"mail ekranı doldurmuyor, PDF ile birebir mi?"* · *"hâlâ mail ile PDF farklı, PDF daha güzel"*. Ders: posta istemcisi düzeni kendi kurallarıyla bozar, mail PDF'le birebir OLAMAZ. Karar: **tek kaynak PDF.** Mail = gönderen kutusu + özet cümlesi ("{tarih} tarihli denetimde **{mahal} mahalde {ekipman} ekipman** uygunsuz bulundu; toplam **{madde} uygunsuz madde**; açıklamalar ve **{foto} fotoğraf** ekteki PDF'tedir") + mahal tablosu (Mahal · Ekipman · Uygunsuz madde) + düz metin ek satırı ("Ek: ad · sayfa · MB"). ⛔ İkinci turda kalktı: PDF ikonlu ek KARTI ve "Raporları uygulamada aç" TUŞU — reisim: *"pdf görünen yere tıklayınca açılmıyor, yanıltıcı; ekte olduğu belirtilsin yeter."* Mailde tıklanır görünen ama tıklanmayan hiçbir şey olmaz. Önizleme aynı yapı, kabı doldurur (`_reportMailOzet` tek sayaç). **PDF eki:** istemci aynı belgeyi (`_reportMailPdfOpt`, "PDF'i gör" = ekte giden) `pdfBlobUret` ile görüntüleyicisiz üretir — hafif çizim **ölçek 2 / kalite .85** (7 sayfa 1,2 MB; İndir 3/.95 = 3,6 MB), `belgeler/{cid}/_mail/<zaman>-<ad>.pdf`'e yükler (KOPYA KALIR = kanıt; sunucu süpürücüsü + `tools/orphan-scan.js` `_mail`'i atlar), sunucu oradan eke alır (yalnız şirketin `_mail` yolu, `.pdf`, ≤7 MB; okunamazsa gönderim DURUR). Eski istemci `items` yollarsa sunucu özet türetir. **Gönderim ilerleme kutusu** (`#rmail-prog`): Fotoğraflar · PDF (i/n) · Yükleme (%) · Gönderim, çubuk, geçen süre; diğer tuşlar kilitli; 45 sn → "Tekrar dene"; alıcı değişikliği gönderim sırasında modalı yeniden çizmez. **PDF ÇİZİM HIZI (kök):** html2canvas her çağrıda elemanın BÜTÜN belgesini klonluyordu (3.789 düğüm → sayfa başına 1,3-2 sn, ölçekten bağımsız; foto hazırlığı 10 ms). `_pdfSayfalariCiz` artık sayfaları + stilleri + temayı **küçük iframe**'e taşıyıp orada çizer: 7 sayfa **14,1 sn → 1,4 sn**, 7 sayfada piksel farkı %0, foto 18/18 (blob src aynı kökende erişilir; iframe kurulamazsa ana sahne). Tüm İndir/Paylaş yolları bundan yararlanır. Kilit: `tests/rapor-mail-foto-2026-09-12`, `pdf-baslik-olcegi`, `uzun-tus-kilidi`.

12. ⛔⛔ **UZUN TUŞ KİLİDİ — HATA SINIFI** (reisim 2026-09-12: *"PDF indir'e tekrar bastım, 2 kere indirdi, çakışma oldu"*; *"dondu gibi algılandı"*). Uzun süren bir tuş basılabilir kalıyor ve ilerleme göstermiyorsa ikinci basış ikinci işi başlatır (iki PDF dosyası). TEK MEKANİZMA `uzunTus(btn, etiket, is)` (02-state-yardimci): WeakSet kilidi, aynı tuşa ikinci basış sessizce yok sayılır; tuş üstünde dönen simge `.tus-spin` + etiket + 3 sn sonra geçen süre; iş `ilerle(msg)` ile adımını yazar; bitince/hata olunca tuş eski hâline döner. Uygulandı: PDF görüntüleyici İndir/Paylaş (`downloadOverlayPdf(paylas, this)`; çubuk `.po-bar.mesgul` kardeş tuşları söndürür, `_pdfMesgul` İndir↔Paylaş çapraz basışı keser), Uygunsuzluk özeti gönder (modal düzeyinde `_gonderiyor` + ilerleme kutusu), Yedek İndir. **Dürüst ad:** modaldaki tuş "PDF indir" iken görüntüleyici açıyordu → "PDF'i gör" (görüntüleyicide Paylaş · İndir · Yazdır). Yeni uzun tuş = `uzunTus` ile doğar; `onclick="…(this)"` tuşu kendini yollar. Kilit: `tests/uzun-tus-kilidi-2026-09-12.test.js` (davranış testi: mesgulken ikinci çağrı `undefined`, iş bir kez koşar).

13. ⛔⛔ **GÖZLEMCİ YARIŞI — PDF/YAZDIRMA ÖNCESİ GÖRSEL HAZIRLIĞI SAHNE DOM'A GİRMEDEN** (reisim 2026-09-14: *"PDF'de görseller gözükmüyor"*, `1276bc9`). `_initSecureImgObserver` DOM'a giren her `secureImg` placeholder'ının `data-securesrc`'sini HEMEN silip blob'u SONRA getirir. `_prepImgsForPrint` sahne DOM'a girdikten sonra çağrılınca görselde ne öznitelik ne blob vardı; 1×1 saydam gif "yüklü" (naturalWidth=1) sayılıp beklenmiyordu → soğuk önbellekte (blob ~600 ms) PDF fotoğrafları BOŞ, sıcak önbellekte (benim oturumum) fark edilmiyor. Canlı kanıt: 23 adres 50 ms'de silindi, prep 0 ms, fotoğraflar 3 sn sonra geldi. Kural: (a) `_prepImgsForPrint` saydam placeholder'ı "henüz yüklenmedi" sayar ve load'ı bekler (8 sn tavan), her görsel kendi try/catch'inde; (b) `_pdfSayfalariCiz` sahneyi DOM'a eklemeden ÖNCE hazırlar; (c) `pdfBlobUret` kabı DOM'a eklemez (çift indirme yok). Ders: **sıcak önbellekle test, yarış hatasını gizler — soğuk önbellek (`_blobUrlCache.clear()`) ile de ölç.** Kilit: `tests/uzun-tus-kilidi-2026-09-12` (sıra + placeholder + kap).


14. ⛔⛔ **SÜZGEÇ SABİT — İÇERİK YOKKEN DE GÖRÜNÜR** (reisim 2026-09-14 gece: *"ekipman veya ilgili sayfada içerik yoksa süzgeç gözükmüyor olmasın, sabit olsunlar"*). Süzgeç çubuğu, çipleri, seçicileri (Mahal/Tür/Ay/Hazırlayan/Firma) ve arama kutusu kayıt sayısına ya da seçenek sayısına bakılarak GİZLENMEZ; boş listede boş durum mesajı süzgecin ALTINDA çıkar. Uygulandı: Mahal sayfası süzgeci (`8b05c84`, eskiden ekipmansız mahalde gizli, arama <8 ekipmanda gizli) · Raporlar seçicileri (`e8e2a0f`, >1 seçenek şartı) · Dış Hizmetler başlık süzgeci (`9eb7aed`, >1 hizmet şartı) ve ana çubuk (kayıt yoksa gizliydi) · rapor arşivi araması (`2fa9f90`, arşiv boşken yoktu). Aynı gün tek boy: Raporlar satırı 38 px, Mahal çipleri 38 px (bölmeli şerit kalktı, ortak .fb-chip), Dış Hizmetler başlık içi 34 px, arşiv satırı 48 px (pencere denetimleri). Yeni süzgeçte `x.length>1 ? çiz : ''` YAZMA.
15. ⛔⛔ **SÜZGEÇ SATIRI TEK ÜRETİCİ, TEK GÖRÜNÜM** (reisim 2026-09-15: *"farklı farklı yerlerde bam başka arama modülleri süzgeçler var … birisinde arama barı solda birisinde sağda, birisinde büyük birisinde küçük … tek tipe, ekipmanlardaki temel görüntü"*; maket `60b36670` onaylı, CANLI `b3d6faa`). Sıra: arama (solda 300×38, büyüteç + temizle ×) → durum çipleri → veya/ve → boşluk → seçiciler SAĞDA → Temizle; hepsi 38 px; **kart çerçevesi YOK**. Telefon ≤759: arama + Filtrele üstte, çipler yana kayar, seçiciler + Temizle Filtrele levhasında. Üretici: `filterBarHtml(cfg)` (tam satır) / `filterBarDoldur(kok,cfg)` (body.html'deki statik iskelet — üretici çıktısıyla birebir, testte karşılaştırılır; arama girdisi statik kalır, odak çalınmaz). Seçici/Temizle `click:'adlıİşlev()'` ile gelir (levha aynısını çağırır); çip dinleyicisi sınıfa değil veri niteliğine (`data:{sf:..}` → `[data-sf]`). ⛔ Elle `.eq-arac`/`.msuz`/`.fbar` kurma, `class="fb-chip'+` birleştirme yazma (test yakalar). Depo'nun elle `.fbar`'ı modül yeniden yapımında geçer. Kilit: `tests/suzgec-satiri-2026-09-15.test.js`.

16. ⛔⛔ **KALIP GENİŞLETME + REFERANS BAKIMI** (2026-09-15, boşluk kapatma). (a) Kalıpta karşılığı olmayan yeni yüzey/desen
    (sihirbaz, kiosk, karşılaştırma tablosu…) koddan ÖNCE buraya numaralı madde olarak yazılır: ölçülmüş referans + tek üretici adı +
    kilit testi; reisim onayı, sonra kod. Sohbette sözlü kural = kural değil. (b) Aynı işi yapan ikinci üretici/sınıf ailesi
    açılmaz (anayasa 2.9); mevcut üretici yetmiyorsa üretici GENİŞLETİLİR, yanına yenisi kurulmaz (süzgeç satırı dersi: 5 elle
    kurulmuş çubuk). (c) Referans tablo Ekipmanlar'ın 2026-09-11 ölçümüdür; Ekipmanlar değişince tablo yeniden ÖLÇÜLÜR, tahminle
    güncellenmez (süzgeç satırı `b3d6faa` ile değişti — kap/düğme satırları geçerli, süzgeç ölçüleri kural 15'te).
17. ⛔ **KİLİT HARİTASI — kilidi olmayan kural kural değildir.** 1 → `tasarim-kalibi` KALIP 1 · 2 → KALIP 5 (eylem çubuğu) + `uc-genislik-2026-09-15` (telefonda çubuk yapışkan, tek düğme değil) ·
    3 → `tasarim-kalibi` KURAL 3 (masaüstü `.bkm-izgara` sütunları eşit olamaz, tarih/tutar ≤160 px sabit, ad esnek, telefonda 1fr;
    2026-09-15) · 4 → KALIP 2 · 5 → KALIP 4 · rozet üretici → KALIP 3 · 6 → `tasarim-kalibi` KURAL 6 (25 modalın 23'ünde kendi
    id'sine bağlı X, confirm/prompt hariç; `openModal` alt Kapat'ı ekler; gizleme yalnız 1000px + has-module-sidebar, telefon
    bloğunda gizleme yok; Esc/X → `dismissModal`; 2026-09-15) · 7 → `tasarim-kalibi` + `olu-tiklama` + `baslik-dili` (1000px) ·
    8 → `kalip-ve-veya` + `rapor-mail-foto` · 9 → `pdf-baslik-olcegi` · 10 → `ekran-genisligi-2026-09-12` · 11 → `rapor-mail-foto` ·
    12–13 → `uzun-tus-kilidi` · 14 → `kalan-kalemler-2026-09-14` + `mahal-nesne-sayfasi` · 15 → `suzgec-satiri-2026-09-15` ·
    16 → süreç kuralı, kilit yok · 20 → AÇIK İŞ (M1 kodlanınca) · 18 → `tests/tablet-duzeni-2026-09-15` KURAL 1–6 · 19 → `tests/secim-alani-2026-09-17` (kapsam kilidi 40+3 · tek üretici · davranış · katman/klavye · tema; olumsuz kanıt 4/4). Yeni kural = yeni satır burada; kilitsiz kural açık iştir. Medya bloğu testte parantez sayan
    `medyaBlogu()` ile bulunur (anayasa 3.9: `lastIndexOf('@media')` yasak); yeni CSS kilidi bu yardımcıyı kullanır.

18. ⛔⛔ **TABLET DÜZENİ + GENİŞ IZGARA KAYDIRMA** (reisim 2026-09-15 iPad fotoğrafı; anayasa 2.11 + 3.11'in kalıp karşılığı).
    Tablet bandında (1000–1279) yan panel telefonla AYNI ☰ çekmecesi (ikon rayı YOK), içerik tam genişlik ([[tablet-duzeni-2026-09-15]]).
    `table-layout:fixed` tablo = `min-width` (sütun minimum toplamı) + `overflow-x:auto` sarmalayıcı + TABLO BÜTÜN KAYAR (yapışkan
    sütun YOK) + iki kenarda solgunluk; ay/kolon başlığı ASLA kırpılmaz, ay sütunu ≥ 80 px, gövde ≥ 11 px. **Kapsam ölçüldü:** yalnız sabit px sütunlu
    tablo (`.czl-tbl`); yüzde sütunlu `.eqg-tbl` ailesi kapla ölçeklenir ve sayfa düzeyi yapışkan başlığı olduğundan sarmalayıcıya
    ALINMAZ (anayasa 3.11).
    Üç genişlik ölçülür: 1920 · 1080 · 375. Mekanizma: `.kaydir` + `kaydirmaIpuclariniTazele` (02) + `.czl-tbl min-width:1500`.

19. ⛔⛔ **SEÇİM ALANI — TEK BİLEŞEN, YERLİ AÇILIR LİSTE YOK** (reisim 2026-09-16: *"seçenekli yerler temamıza aykırı"* — kapatma
    ekranında NEDEN alanının cihazın kendi koyu listesi; sunum `6P4r7t3FpzBWTqbaPmAxRT` onaylı 2026-09-17, CANLI `5c45eb0`).
    Üretici `src/js/42-secim-alani.js` (önek `scm-`; `sa-` süper yöneticinin, KULLANMA). İki tür: **seçmeli** `<select data-secim>` →
    yerinde temalı düğme (yerli öğenin sınıfı + satır içi stili aynen, yerli öğe `.scm-gizli` DEĞER TAŞIYICI) · **yazılabilir**
    `<input data-secim list="…">` → kutu yerinde, `list` kaldırılır, temalı öneri + "Yazıldığı gibi kullan". Masaüstü alan altı liste
    (sığmazsa üstü), >8 seçenekte arama, ↑↓ Home End Enter Esc Tab + harfle atlama · telefon ≤759 alttan levha 48 px, yazılabilirde levha
    başında yazı kutusu (visualViewport ile klavye üstü). **Mantık yerinde:** seçim yerli öğeye yazar + input/change tetikler; koddan
    `.value`/`selectedIndex` örnek düzeyi erişimciyle, innerHTML/disabled/style gözlemciyle düğmeye yansır; canlı çizen ekranın koruması
    (15 denetim: focus/mousedown/blur) sentetik olayla beslenir. Liste body'de fixed z 16000, tuşlar YAKALAMA evresinde (Esc pencereyi
    kapatmaz). **Yeni seçim alanı = `data-secim` ile yazılır**, ekran başına bağlama yok. Kapsam dışı (gerekçeli): 23-landing · 29 Makine ·
    31 Personel · 32 Güvenlik · 33 Depo · 36 Okut modu · 02 chip-select (Makine süzgeci) — yeniden yapımda bu bileşene geçerler.
    Tarih/saat seçicileri AYRI İŞ (reisim kararı 2). Kilit `tests/secim-alani-2026-09-17`.

20. ⛔ **PROBATA DESENLERİ — M1'DE DOĞDU, HER MODÜLDE AYNI** (reisim 2026-09-25, soru 42: *"Girsin her şeyimiz kayıtlı ve disipline edici
    olsun"*). Bu projenin kendi desenleri; referans ekran maket M1 (`docs/maket/personel.html`, `giris.html`, `anasayfa.html`), üreticiler
    `docs/assets/maket-ortak.js`, sınıflar `docs/assets/maket.css` (`a-` önekli). (a) **Tıklanır bilgi yüzleri** (`.a-yuzler` / `.a-yuz`):
    nesne sayfasının ve Ana sayfa'nın özet kutuları; sayı + kısa not, uyarı notu uyarı renginde, tıklanınca ilgili listeye ya da bölüme gider
    (anayasa 2.7–2.8: sayı gittiği listeyle aynı ölçütten). (b) **Form sayfası** (`.a-form-sayfa` / `.a-form-bolum`): başlıklı bölüm kartları
    kabı doldurur (kalıp 10), telefonda alttaki tuş çubuğu yapışkan (kalıp 2); zorunlu alan işaretli, hata alanın altında. (c) **Seçim alanı**
    (`MK.secim`, kalıp 19): yerli açılır liste yok. (d) **Koşul / uyarı listesi** (`.a-kosullar`, ✓ / ⚠) ve **şerit** (`MK.serit`): engel
    değil bilgi — kural ihlali uyarıdır (reisim 39). (e) **Giriş ekranı** (`.a-giris`): iki pano, telefonda marka şeridi üstte. (f) **Bağlantı
    olarak sekmeler** (`.a-sekmeler-sayfa`): aynı modülün bölümleri (Personel | Rol yetkileri); sığmayınca sekme alt satıra geçer.
    (g) **Bir kez gösterilen gizli değer** (`.a-gecici-parola`): geçici parola yalnız oluşturulduğu pencerede, kopyala + uyarı şeridi.
    Kilit: **açık iş** — desenler uygulamada ilk kodlandığı kalemde (M1 kodu) tek üreticiyle kurulur ve testle kilitlenir (kural 17'ye satır).

## 🔧 Mekanizmalar
- `_eqRoz()` / `_eqSade()` — tek rozet üreticisi, `.kirp` + `title` otomatik. Elle `<span class="eqg-roz">` yazmak testte patlar.
- `kirpikIpuclariniTazele()` (02-state-yardimci) — MutationObserver + 200ms geciktirme, **ölçerek** (`scrollWidth>clientWidth`) kırpılmış olana tam metni `title` koyar. Bugün olmayan ekran da yarın otomatik korunur.

## 📊 Sonuç (canlı, 24 ekran)
sert kırpma 33 → **0** · denetim hücresi taşması 10 → **0** · gerilmiş düğme **0** (home'daki 342px'ler KPI karosu, düğme değil) · yatay taşma **0** · en geniş düğmeler 92–196px.

✅ **Kapandı (2026-09-14, `189223f`):** Profil rol düğmeleri — "X Yetkileri" totoloji eki kalktı (bölüm başlığı zaten Rol Yetkileri), `.prof-rol › .kirp › title` kırpma zinciri (kalıp 4); 455 px ızgarada en uzun ad kırpılmadan sığıyor.

Bkz. [[onleyici-tasarim-ilkesi]] · [[masaustu-verimlilik-kurali]] · [[web-mobil-ayri-tasarim]] · [[maket-masaustu-mobil-ayri]]
