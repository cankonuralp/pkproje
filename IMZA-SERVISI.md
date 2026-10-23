# İMZA SERVİSİ — YÖNLENDİRME (2026-10-17)

> **E-imza platformu ayrı proje: `probata-sign`** (GitHub `cankonuralp/probata-sign`, **özel** depo). Platformun tasarımının tek kaynağı orada
> **`TASARIM.md`**. Bu dosya yalnız yönlendirme ve probata'da kalanın kaydı.
>
> Reisim (2026-10-17): *"bu ayrı bir çalışma gibi düşün evet sign.probatadan yayınlayacağız ama probatanın kaynak kodlarına bunları bulaştırma
> ileride probata ile bağ kurmamız gerekirse kurarız"*. Aynı gün önce: *"ayrı bir dosya açalım, bu dosyada e imza servisi ve doğrulama servisini
> bir yandan geliştirelim …"* — o tasarım (bu dosyanın eski hâli) probata-sign'a taşındı.

---

## 1 · Ne nerede

| Konu | Yeri |
|---|---|
| İmza platformu: belge yükle → imzala → indir, API + bildirim, başka sitelere gömülü imza penceresi, `sign.probata.com.tr` | **probata-sign `TASARIM.md`** |
| İmza yolları (USB e-imza eklentisi + yardımcı program, mobil imza operatörleri), beş katmanlı imza motoru (PAdES, zaman damgası, DSS, arşiv damgası, tazeleme) | **probata-sign `TASARIM.md`** |
| Kalemler ES1–ES6, adresler, veri ve kiracılık, yasal / ticari ön koşullar, açık kararlar | **probata-sign `TASARIM.md`** |
| İmza üreten kod (CMS kurulumu, yer tutucu, artımlı ek, DSS + belge damgası, zaman damgası istemcisi, iptal kanıtının ağdan alınması) | **probata-sign** — probata'dan 2026-10-17'de çıktı |
| Yüklenen imzalı PDF'in kriptografik denetimi | **probata** (§2) |
| Rapor doğrulama (karekod, doğrulama sayfası) — probata'dan 2026-10-17'de KALKTI | **probata-sign** (§4) |

**probata ile bağ:** probata ileride platforma **sıradan bir API müşterisi** olarak bağlanır (`pkproje.md` §11 İMZA YOLLARI (4)'teki sağlayıcı
arayüzüyle: dene · gönder · durum · al · iptal). O güne kadar probata platformun kodunu içe aktarmaz, platform probata'nın kodunu içe aktarmaz.

---

## 2 · probata'da kalan: yüklenen imzalı PDF'in denetimi (ES1)

Kod içi başvurular bu kalemi "IMZA-SERVISI.md ES1" diye anar.

- **`src/server/imza/` — yalnız okuma / denetim** (saf; saldırganın girdisinde sınırlı):
  - `der.ts` DER / BER okuyucu · `sertifika.ts` X.509 (5070 nitelikli işareti, zincir) · `cms.ts` CMS doğrulama (imzalı sertifika bağı, damga
    sunucusu denetimi, SHA-1 yok) · `pdf-ek.ts` PDF nesne okuyucu (xref zinciri, nesne akışı, onarım) · `iptal.ts` OCSP / iptal listesi
    çözümlemesi (ağ yok — ayrım kilidi `tests/imza-ayrim.test.ts` ağ istemcisinin adını ve ağ izini de yakalar: fetch, `node:http` / `https` /
    `net` / `tls` / `dns`; 2026-10-23).
  - `pdf-imzalar.ts` çözümleyici: her imza için bütünlük, imza değeri, imzalayan, imza / belge zaman damgası, DSS (yalnız kataloğun) ve içindeki
    iptal kanıtı, imzadan sonraki değişiklik, düzey B-B … B-LTA.
  - `yukleme.ts` `ekImzaNedeni`: eklenen imza sağlam, belgenin tamamını kapsıyor, sertifikaya bağlı, 5070 nitelikli, YÜKLEME ANINDA geçerli ve
    yükleme anında iptal edilmemiş (damga anına güvenilmez — aşağıda "İptal anı"), sonradan değişmemiş olmalı. **Bağlı:** rapor imzası, teknik
    yönetici imzası, Onaylar › Diğer. Yapı denetimini (`imzaliPdfGecerli` / `imzaliTaban`) çağıran her yükleme bunu da çağırır (kaynak kilidi
    `tests/imza-cozum.test.ts`).
  - **İptal anı (2026-10-23; probata-sign denetimi 2026-10-18, YÜKSEK — aynı hata probata'da da vardı):** DSS'teki kanıtların hepsi zamanlarıyla
    toplanır, karar imza anına göre verilir (`iptal.ts` `iptalKarari`): imza anında ya da önce "iptal" diyen sağlam kanıt — iptal anı okunamasa
    da — iptaldir, "geçerli" diyen başka kanıt bunu ezemez; "geçerli" yalnız imza anından sonra üretilmiş ve süresi dolmamışsa sayılır.
    Çözümleyici kararı damga anına göre verir; **yükleme kapısı damgaya güvenmez** (2026-10-18: damga sunucusu güvenilir listeye bağlı değil,
    geriye tarihli damga basılabilir) ve kanıtları yükleme anına göre yeniden değerlendirir — "iptal" ise ret; damga anına göre karar "iptal" ise
    de ret (yalnız ileri tarihli damgada ek ret getirir). İmza anı: sağlam imza damgası, yoksa imzayı kapsayan ilk sağlam belge damgası, yoksa
    çözüm anı; imzası tutmayan kanıt sayılmaz. Kanıtı olmayan imza bugünkü gibi kabul (kanıtı ağdan almak probata'da yok). Kilit
    `tests/iptal-zamani.test.ts` + bozan (2026-10-23 denetimi: kanıtın imza süzgeci, imza anı koşulları ve bu halka da kilitli).
- Yapı denetimi `src/modules/raporlar/`: `imza-pdf.ts` (imzalı PDF eki beyaz listede), `imza-esdeger.ts` (imza programının yeniden yazdığı ama
  içerikçe aynı PDF), `imza-kimlik.ts` (imzalayanın adı).
- **Güvenilir kök listesi yok** (resmî kaynaktan teyitle eklenecek): uydurma ama "nitelikli" işaretli bir zinciri bu denetim tek başına ayırt etmez.
- **Bağımsız inceleme (2026-10-17):** çözümleyici kaydedilmeden önce düşmanca incelendi; 9 bulgu kapatıldı (kendi anahtarıyla basılan geriye
  tarihli damga, sertifika değiştirme, DSS'in metin taramasıyla okunması ve aşırı yavaşlama, imza sonrası değişikliğin görünmemesi, bozuk girdide
  çökme).

---

## 3 · İmza yolları (probata'da, özet)

- **Bugün:** toplu indir → kendi e-imza aracıyla imzala → toplu yükle (596). Her firmada açık. Yüklenen PDF §2'nin denetiminden geçer; imza
  programının yeniden yazdığı belge de içerikçe aynıysa kabul (`imza-esdeger.ts`).
- **İki e-imza yeri** (İ5): onaylanan (muayene uzmanı) + onaylayan (teknik yönetici; firma ayarı `imza.teknik`). Art arda iki imza denetimden geçer.
- **Üçüncü taraf sağlayıcı:** şimdilik yapılmaz (`pkproje.md` §11 İMZA YOLLARI (5)).
- **probata-sign:** hazır olunca probata ona API müşterisi olarak bağlanır (§1); ayrıntı probata-sign `TASARIM.md`'de.

---

## 4 · Rapor doğrulama — probata'dan kalktı (2026-10-17)

Reisim: *"tamam bu olay komple iptal kaldır, sign.probata kurucaz eğer imza hizmetini bizden alan olursa oradan suncaz"*. probata'dan kalkanlar:
imzaya hazırlanan PDF'in şeridindeki karekod ve doğrulama bağlantısı (şerit kalır: kanun cümlesi + rapor no + sayfa), oturumsuz `/dogrula/<kod>`
sayfası, "probata doğrulama bağlantısı olmayan imzalı rapor kabul edilmez" kuralı; aynı gün doğrulama sayfası maketi de (iki tur) kaldırıldı.
Kalır: her imza programının içerikçe aynı imzalı raporu kabul (`imza-esdeger.ts`, çizimden tanır). İmzanın katman katman doğrulanması, karekod ve
doğrulama sayfası **probata-sign**'ın işi (`TASARIM.md`, genel doğrulayıcı).

---

## 5 · Test verisi ve kilitler

- İmzalı deneme PDF'i **yalnız test verisi üreticisinden:** `tests/yardimci/imza-uret/` (CMS kurulumu, yer tutucu + artımlı imza, artımlı ek
  yazıcısı, DSS + belge damgası eki) + `tests/yardimci/gercek-imza.ts` (uydurma makam / kişi / damga / OCSP / iptal listesi; gerçek kişi ve kurum
  yok). Her üretici dosyanın başında: *yalnız test verisi üretir; ürün kodu bu klasörü import edemez — imza üretimi probata-sign'da*.
- **Ayrım kilidi** `tests/imza-ayrim.test.ts` (+ `tests/bozan/imza-ayrim.bozan.ts`): `src/` hiçbir dosya `tests/`'i içe aktarmaz; `src/server/imza/`
  içinde imza üreten işlev adı (imza hazırlama / tamamlama, LTV / DSS / belge damgası eki, zaman damgası alma, iptal kanıtı alma, yer tutucu, CMS
  kurulumu) geçmez.
- **Okuyucu kilitleri:** `tests/imza-cozum.test.ts`, `tests/imza-inceleme.test.ts`, `tests/imza-ltv.test.ts` (artımlı / LTV ekli belgede okuyucu),
  `tests/imza-esdeger.test.ts`, `tests/imza-pdf.test.ts`, `tests/imza-kimlik.test.ts` + `tests/bozan/` karşılıkları.
- 2026-10-17 probata'dan çıkan testler (konusu yalnız taşınan yazıcı / ağ kodu; probata-sign'da): DSS ekinin "eksik" listesi, zaman damgası
  istemcisi, iptal kanıtının ağdan alınması; olumsuz kanıtta ek yazıcının konumu, damga istemcisinin tek kullanımlık sayısı ve izi, yer tutucunun
  boş alanı bulması, tazelemede önceki DSS'in okunması.
