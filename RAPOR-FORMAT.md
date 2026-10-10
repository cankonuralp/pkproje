# RAPOR-FORMAT.md — firmanın kendi rapor formatını kurduğu sistem (AA10)

> Reisim (2026-10-02, §9 kırk sekizinci tur, birebir): *"Bu söylediklerimi tek bir rapor özelinde değil, tüm raporları bu şekilde
> kurgulayabileceğim bir sistem tasarla ben müşteriye sunduğumda kendi rapor formatını yükleyip istediği gibi şekillendirebilecek
> kurgulayabileceği bir sistem tasarlamamız gerkeli yoksa her rapor format yüklemesinde tek tek benim uğraşmam gerekli."*
>
> **Durum: ONAYLI (2026-10-02, reisim: *"Tamam yapalım"*).** Makette "Format kurucu" ekranı (Ekipman türleri › tür › Format kurucu) bu belgeyi gösterir.
> **§8.3 kararı değişti:** "şablonlar firma × tür başına kodda, site içi düzenleyici yok" → **"format, firmanın format kurucusunda
> tutulan sürümlü bir tanım (JSON); saha ekranı ve PDF bu tanımdan çizilir; çizen motor kodda tektir"**. §8.3 güncellendi (pkproje.md).

## 0 · Neden

Bugün her türün raporu (saha ekranı + PDF) kodda elle kurulmuş: iç tesisat, topraklama, kompresör … Yeni bir firma kendi formatını
getirdiğinde ya da bir firma formatını değiştirdiğinde iş bize (koda) düşüyor. Hedef: **firma, kendi formatını kendisi kurar**; probata
yalnız yapı taşlarını (blokları) ve kuralları verir.

## 1 · Üç katman

| Katman | Ne tutar | Kim değiştirir |
|---|---|---|
| **Yapı** | Bölümler ve sırası; her bölüm bir **blok** (aşağıda) | Firma (format kurucu) |
| **Kurallar** | Zorunlu alanlar, "Uygun değil"de fotoğraf zorunlu mu, kusur derecesi (hafif / ağır) sorulur mu, ölçüm sınırları, sonuç önerisi, periyot | Firma |
| **Görünüm (PDF)** | Üst bilgi (logo, künye, form kodu, revizyon), bölüm numaralandırma, sayfa düzeni, imza alanları | Firma; Bakanlık formatlı türde zorunlu alanlar kilitli |

Motor (kodda, tek): tanımı okuyup **saha ekranını** (tablet / telefon) ve **PDF'i** aynı tanımdan çizer; doğrulamayı, otomatik sonucu ve
kusur listesini hesaplar. Firmalar arasında motor ortak, tanım firmaya özel.

## 2 · Bloklar (yapı taşları)

1. **Bilgi alanları** — etiket + alan türü: metin · sayı (birimli) · tarih · seçim (seçenekler) · çoklu seçim · evet / hayır. Kayıttan gelen
   alanlar (firma adı, adres, rapor no, İSG-KATİP, kontrol tarihleri) hazır alan olarak eklenir, raporda salt okunur.
2. **Kontrol listesi** — gruplar ve maddeler; cevap seti (Uygun · Uygun değil · Uygulanamaz ya da firmanın kendi seti); madde başına
   açıklama ve referans standart (raporda (i) penceresi — AA7); "Hepsini işaretle".
3. **Ölçüm tablosu** — satırlar (sabit ya da denetçi ekler) × sütunlar (ad, birim, giriş türü); **sınır kuralı**: en az / en çok / formül
   (ör. Zs ≤ U₀ / Ia) → satır sonucu kendiliğinden Uygun / Uygun değil; sonuç kusur listesine düşer.
4. **Test değerleri** — tek tek değer + sınır (ör. deney basıncı ≥ 1,5 × çalışma basıncı).
5. **Ölçüm cihazları** — türün cihaz türleri (zimmetten eklenir, kalibrasyon denetimi).
6. **Fotoğraflar** — en az / en çok sayı; açıklama.
7. **Kusur açıklamaları** — kendiliğinden (Uygun değil maddeler + sınır dışı ölçümler); fotoğraflı.
8. **Sonuç ve kanaat** — cümle şablonu ("… kullanılması uygundur / uygun değildir"); otomatik öneri.
9. **Not / yorum** — serbest metin (muayene uzmanı yorumu).
10. **İmza alanları** — muayene uzmanı, teknik yönetici; imza yöntemi firma ayarından.

**2026-10-09 (426; reisim: *"bir kullanıcı da bu ve benzeri rapor formatlarını isterse kendi eli ile format yapıcıdan yapabileceği şekilde format
yapıcıyı düzenle"*):** ölçüm tablosu sütunu ve test değeri **seçmeli** olabilir; seçeneklerden hangilerinin **"uygun değil"** sayılacağı ve kusurun
**ağır** olup olmadığı formatta yazılır (ZPKR04 U / UD / UG tablosu, ZPKR05 "Not 1: Uygun / Not 2: Yetersiz"). Sınır kuralına **kesin küçük / kesin
büyük** eklendi (ZPKR05 RB < 2 Ω). Sonuç bölümünün **sabit metni** (Bakanlık formatlarındaki "ağır kusurlar tanımı", "açıklamalar") PDF'e basılır;
Bakanlık şablonunda kilitlidir. Madde, grup ve formatın tamamı için **talimat** (kontrolün nasıl yapılacağı) — saha ekranında ünlemden açılır,
PDF'e basılmaz.

**2026-10-09 (427):** hazır şablonlara ZPKR03 (yıldırımdan korunma), ZPKR04 (yangın algılama ve uyarı), ZPKR05 (trafo) eklendi. Bölüme **üst başlık**
(aynı üst başlıklı ardışık bölümler belgede ve saha ekranında N.1, N.2 — resmî formdaki 4.1 / 5.1 gibi) ve **numarasız** işareti (Fotoğraflar);
2. bölümün başlığı formatın ekipman bölümünün adı (ZPKR04 "Tesis bilgileri"). Numaralar belge ile saha ekranında tek kaynaktan
(`src/format/duzen.ts`). Kilitli bölümde üst başlık ve numarasızlık da özdür (değiştirilirse ENGEL).

## 3 · Kurallar (format başına)

- Alan / madde / ölçüm bazında **zorunlu**; zorunlu boşken Onaya gönder uyarır ve alanı işaretler (bugünkü davranış).
- **"Uygun değil" maddede fotoğraf zorunlu** — aç / kapa (başlangıçta kapalı; reisim AA9).
- **Kusur derecesi** (hafif / ağır) sorulur mu — aç / kapa (başlangıçta kapalı; reisim AA9). Açıksa hafif kusur devri (V4) çalışır.
- **Sonuç önerisi**: herhangi Uygun değil / sınır dışı → "Uygun değil"; firma seçerse denetçi değiştirir.
- **Periyot** ve sonraki kontrol tarihi (türden).
- Bakanlık formatlı türde (ZPKR01 …): Bakanlığın zorunlu alanları **işaretli** (kilit simgesi). ~~Silinemez, yalnız sırası / görünümü değişir;
  eksikse yayınlanmaz (bu tek engel: resmî formatın kendisi).~~ **2026-10-10 (470, reisim hata listesi 38: *"başlık komple silmek vb hala imkansız
  biraz daha serbestlik lütfen"*; genel ilke "kural uyarıdır, engel değil"):** Bakanlık bölümü ve öğesi de silinir, adı ve özellikleri değişir —
  silmeden önce sorulur; yayında Bakanlık formatından ayrılan yerler **uyarı** listesinin başında (yayın durmaz). Sabit kalan: ölçüm cihazları
  bölümü (459) ve firma bilgileri.

## 4 · Başlangıç yolları

1. **Hazır şablondan** — probata kitaplığı (Bakanlık formatları + genel türler); firma kopyalar, değiştirir.
2. **Boş** — bölüm bölüm kurar.
3. **Kendi formatını yükle** — firma PDF / Word formatını yükler; **yapay zekâ taslak çıkarır** (başlıklar → bölümler, madde listeleri →
   kontrol listesi, tablolar → ölçüm tablosu, sütun başlıkları → alanlar). Taslak **öneri**dir; firma format kurucuda düzeltir, yayınlar
   (K1: yapay zekâ firma ayarıyla açık olmalı; kapalıysa 1 ya da 2).

## 5 · Sürüm ve yayın

- Format **taslak** → **yayınla** (v1, v2 …; değişiklik notu). Açık raporlar başladıkları sürümle kalır; yeni raporlar yeni sürümle açılır
  (bugünkü "Formatı güncelle" — 211 — taslak raporu yeni sürüme taşır).
- Yayın öncesi denetim: boş bölüm, sınırı olmayan ölçüm sütunu, cevap seti olmayan liste, kilitli alan eksik → liste hâlinde söylenir.
- Eski sürümler saklanır (imzalı raporun PDF'i hangi sürümle çizildiyse o sürümle yeniden üretilebilir).
- **2026-10-10 (471; maket kararı k5):** sürüm sayfası formatın kimliğini söyler — yayınlanma (kim, ne zaman), bu sürümle yazılan rapor sayısı,
  doküman kodu, bölüm · madde, sürüm notu; **önceki sürüme göre değişenler** (taslak yayındaki sürümle, sürüm N bir öncekiyle; öğeler kimlikle
  eşlenir — `src/modules/rapor-format/fark.ts`); önizleme Belge ↔ Saha ekranı; kurallar; öteki sürümler. Tek "Düzenle". Eski teknik listeler
  (Görünüm, Bakanlık alanı sayısı) kalktı.

## 6 · Ekran (format kurucu)

- **Sol**: bölüm listesi (sırala, ekle, sil, kopyala). **Orta**: seçili bölümün düzenleyicisi (bloğa göre). **Sağ**: canlı önizleme —
  saha ekranı (tablet / telefon) ↔ PDF sayfası.
- Üstte: tür adı · sürüm · taslak / yayında · **Yayınla** · **Kurallar** · **Görünüm**.
- Telefonda kurucu açılmaz (masaüstü işi); önizleme açılır.
- **2026-10-09 (426):** her öğe "Düzenle" ile açılır — alan türü / seçenekleri / birimi / zorunluluğu; madde metni, grubu, standardı, açıklaması,
  talimatı; sütun / değer türü, seçenekleri, uygun değil sayılanlar, ağırlığı, sınırı. Kontrol listesinde grup ekle / adlandır / talimat / boşsa
  sil, maddeyi seçilen gruba ekle, cevap seti; ölçüm tablosunda uygunluk notları (Not-1 …; kusur / ağır); sonuçta sabit metin; "Belge":
  form kodu, başlık, metot ve kapsam (dayanak), genel muayene talimatı. Kilitli (Bakanlık) öğede yalnız talimat yazılır; form kodu ve başlık
  değişmez. Saf işlevler `src/modules/rapor-format/kurucu.ts`, ekran `ui/KurucuDuzenleyici.tsx`.
- **2026-10-10 (472; maket kararları k1–k4):** üç görünüm — **Kâğıt** (açılışta; 451) · **Saha ekranı** · **Belge önizlemesi**, üçü aynı taslak.
  Saha ekranı gerçek saha ekranı örnek raporla (çerçeve sayfası `src/app/(cerceve)/ekipman-turleri/[id]/sablon/[sid]/saha`; aygıt Tablet / Telefon,
  varsayılan tablet); "Düzenle" kipinde orada da yerinde düzenlenir (ad, ekle, çıkar) ve kâğıda geçer; "Denetçi gibi dene". Görünüm ayarı
  `cevap`: madde cevabı açılır liste ya da yan yana tuşlar (format başına; belgeye etkisi yok). Ekran `ui/SahaGorunumu.tsx` + `ui/SahaCerceve.tsx`,
  kullanım özeti `kullanim.ts`.
- **2026-10-10 (483; reisim: *"rapor düzenlemede sadece saha ekranı gözüksün o ekranda düzenleme yapılamasın … sadece sahada personelin nasıl
  göreceği gözüksün"*; *"kağıttan düzenleyebiliyoruz ama sahadaki görüntü nasıl oluyor düzenleyemiyoruz burası çok karmaşık bir çözüm öner"*):
  **tek düzenleme yeri kâğıt.** Saha ekranı salt önizleme (aygıt + "Denemeyi temizle"; denetçi gibi denenir, hiçbir şey kaydedilmez); 472'nin
  "Düzenle" kipi ve saha ekranındaki yerinde düzenleme kalktı. Sahaya özgü ayarlar kâğıtta, öğenin ya da formatın ayarı olarak: madde cevabının
  biçimi "Kurallar, saha ekranı ve genel muayene talimatı"nda; bölümün fotoğraftan / Excel'den doldurulması bölümün ayarında (484).
- **2026-10-10 (484; reisim: *"test tablosu olarak kullanılan yerlere excelden yükle ve fotoğraf ekleme özelliği olsun fotoğraf eklenince belgede
  gözükmeyecek yapay zeka buradan okuma yapıp tabloyu dolduracak, aynı şekilde ekipman bilgilerinde de olsun bunu istediğim başlığa da
  ekleyebiliyim rapor tasarımcısında da olsun"*):** bölümün **doldur** ayarı (`{ foto, excel }`; bilgi / ölçüm tablosu / test bölümünde) — kâğıtta
  bölüm ayarlarında iki kutu, başlıkta "Fotoğraf · Excel" işareti; verilmemişse ölçüm tablosu ve ekipman bölümü açık, öteki kapalı (`doldurma`).
  Sahada: **Fotoğraftan doldur** (tabloda satır satır — 351; alanlı bölümde alan alan — 385'in genel hâli) yapay zekâyla okur, değerler ÖNERİ,
  denetçi uygular; fotoğraf raporda **okuma fotoğrafı** olarak durur, **belgede (PDF) görünmez**; firmada yapay zekâ kapalıysa yerine nereden
  açılacağı yazar. **Excel'den yükle** (.xlsx / .csv; tablo başlık satırıyla, alanlar "Alan | Değer"; türüne uymayan yazılmaz) + **Excel şablonu**.

## 7 · Veri

- `rapor_format` (firma, tür, sürüm, durum, tanım JSON, yayınlayan, tarih, not) — kiracı süzgeçli (RLS).
- Rapor, açıldığı format sürümünü taşır (`format_surum`); cevaplar bölüm / alan kimlikleriyle saklanır (sıra değişse de bozulmaz).
- Tanım JSON şeması sürümlü; motor eski şemayı okur (göç).

## 8 · Bugünkü maketle ilişkisi

- Bugünkü türler (iç tesisat ZPKR02, topraklama ZPKR01, kompresör …) kitaplıkta **hazır şablon** olur; elle kurulmuş ekranlar motorun
  ilk deneme setidir (motor aynı ekranı tanımdan çizebilmeli — ölçülerek).
- AA9 (fotoğraf zorunluluğu ve kusur derecesi kalktı) bu sistemde **kural** olur: başlangıçta kapalı, firma isterse açar.

## 9 · Yapım sırası (kod aşamasında)

1. Tanım şeması + motor (saha ekranı) — bugünkü 3 türü tanımdan çizip ekran görüntüsüyle karşılaştır.
2. PDF motoru aynı tanımdan.
3. Format kurucu (yapı → kurallar → görünüm), sürüm / yayın.
4. Kitaplık (hazır şablonlar).
5. Yapay zekâyla taslak çıkarma (en son; öneri).
