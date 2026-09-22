# 01 · MİMARİ — derleme, ad alanı, sayfa yapısı, veri dalı

---

## Dağıtım atomik olmalı: ya tamamen eski, ya tamamen yeni

**Kural:** Statik barındırmada, yayın sonrası kullanıcının elinde "yeni HTML + silinmiş eski JS"
karışımı oluşabiliyorsa, uygulamayı tek dosyada yayınla.

**Neden:** Önbellek başlıklarını kontrol edemediğin bir barındırmada parçalı/hash'li yapı,
yayından sonraki önbellek süresi boyunca beyaz ekran riski üretir. Tek dosyada güncelleme
bölünemez: tarayıcı ya eski sürümü alır (çalışır) ya yeniyi.

**Referans kod:** `scripts/build.mjs:6-9`
```js
/* TEK DOSYA NEDEN: GitHub Pages'te önbellek başlığı kontrolü yok (her şey max-age=600).
   Parçalı/hash'li yapıda deploy sonrası 10 dk, eski HTML + silinmiş eski JS = BEYAZ EKRAN
   riski doğar. Tek dosyada güncelleme ATOMİK: ya komple eski (çalışır) ya komple yeni.
   (Firebase Hosting'e geçilirse — Faz D — hash'li parçalara geçmek doğru olur.) */
```

**Yeni projeye uyarlama:** Önbellek başlığını kontrol edebildiğin bir barındırmada (uzun ömürlü
hash'li varlıklar + kısa ömürlü HTML) bu kural gereksizdir; parçalı yapı serbesttir. Kararı
barındırma belirler, alışkanlık değil. **Kaynak projedeki yorum bunu zaten yazmış** — kuralın
kendi sona erme koşulunu taşıması iyi bir alışkanlıktır.

---

## Modül sırası dosya adından gelir, elle listeden değil

**Kural:** Birleştirme sırası dosya adı sıralamasıyla belirlensin; yeni dosya eklemek için
hiçbir listeyi güncellemek gerekmesin. Geçici dosyalar ad kuralıyla dışlansın.

**Neden:** Elle tutulan modül listesi er geç kaynakla ayrışır; unutulan dosya sessizce yayına
girmez ve hata "tanımsız fonksiyon" olarak çok uzakta patlar.

**Referans kod:** `scripts/shell.mjs:12-18`
```js
/* Uygulama JS modülleri — AD SIRASINA göre (01-, 02-, ...). Global scope korunur;
   _ ile başlayan dosyalar (geçici/deneme) alınmaz. */
export function jsModuleNames() {
  return readdirSync(join(SRC, 'js'))
    .filter(f => f.endsWith('.js') && !f.startsWith('_'))
    .sort();
}
```

**Yeni projeye uyarlama:** İçe/dışa aktarımı olan bir projede bu iş zaten paketleyicide çözülür;
taşınacak olan **numaralı ad öneki** disiplinidir: yükleme sırası önemliyse sıra dosya adında görünsün.

---

## Her modül birleştirilmeden önce tek tek sözdizimi denetiminden geçer

**Kural:** Birleştirmeden önce her kaynak dosyayı ayrı ayrı ayrıştır; hata birleşik çıktının
satırında değil, **sorumlu dosyada** raporlansın ve derleme dursun.

**Neden:** 40+ dosyanın birleştiği bir çıktıda "satır 18422'de beklenmeyen simge" hiçbir şey
anlatmaz. Dosya bazlı doğrulama, hatayı saniyeler içinde yerine oturtur.

**Referans kod:** `scripts/build.mjs:24-41`
```js
for (const name of modules) {
  const code = readModule(name);
  try {
    transformSync(code, { minify: false, target: 'es2019' }); // sadece parse/doğrulama
  } catch (e) {
    const loc = e.errors?.[0]?.location;
    console.error(`❌ SYNTAX HATASI ${name}${loc ? ` (satır ${loc.line}, sütun ${loc.column})` : ''}:`);
    process.exit(1);
  }
  parts.push(code);
}
```

**Yeni projeye uyarlama:** Paketleyici bunu zaten yapıyorsa tekrar etme; yapmıyorsa (elle
birleştirme, şablon üretimi, SQL/HTML gömme) aynı kapıyı kur. Kural: **derleme sessizce kısmi
çıktı üretmez.**

---

## Küçültme kimlik adlarını değiştiremez (satır içi olay bağlayıcı varsa)

**Kural:** Kodda satır içi `onclick="fn()"` gibi metin tabanlı referanslar varsa, küçültmede
tanımlayıcı yeniden adlandırmayı **kapat**; sadece boşluk ve sözdizimi sıkıştır.

**Neden:** Tanımlayıcılar kısaltıldığında HTML içindeki metin referanslar güncellenmez; uygulama
derlenir, yüklenir ve ilk tıklamada "tanımsız" hatası verir. Bu açık, ancak canlıda görülür.

**Referans kod:** `scripts/build.mjs:45-55`
```js
// 2) Güvenli minify (adlar KORUNUR — global scope + inline onclick mimarisi şart koşar)
const r = transformSync(app, {
  minifyWhitespace: true, minifySyntax: true, minifyIdentifiers: false,
  legalComments: 'none', target: 'es2019',
});
minNote = `minify: ${(before / 1024).toFixed(0)}KB → ${(app.length / 1024).toFixed(0)}KB (adlar korundu)`;
```

**Yeni projeye uyarlama:** Olay bağlamayı JS tarafında yapan bir projede bu kısıt gereksizdir;
tam küçültme serbest. Ama **yan fayda**: adlar korunduğu için üretimdeki yığın izleri okunabilir
kalır (bkz. `06-HATA-TAKIBI.md`).

---

## Çıktıya sürüm damgası göm

**Kural:** Derleme çıktısına derleme zamanı damgası koy ve teşhis/hata kayıtlarıyla birlikte
sunucuya gönder.

**Neden:** Sahadaki bir cihazın eski sürümü çalıştırdığını başka türlü anlayamazsın; "bende
olmuyor" raporlarının yarısı bayat önbellektir.

**Referans kod:** `scripts/build.mjs:42-44`
```js
// Sürüm damgası (2026-07-07): resumeSession teşhis paketiyle sunucuya gider —
// sahadaki bir cihazın ESKİ bundle çalıştırdığını loglardan görebilmek için.
const buildStamp = new Date().toISOString().replace(/[-:]/g,'').slice(0,13);
app = `const TE_BUILD='${buildStamp}';\n` + app;
```

**Yeni projeye uyarlama:** Damga olarak commit kısa karması daha iyidir (hangi kodun çalıştığını
kesin söyler). Damgayı hata kaydının içine de koy.

---

## Üçüncü parti kütüphane kendi sunucumuzdan, sürüm adıyla iner

**Kural:** Dış CDN'den çalışma anında kütüphane çekme; dosyayı kendi kökenine kopyala, **dosya
adına sürümü yaz** ve sonsuz önbelleklenebilir yap. Kaynak dosya yoksa derleme gürültüyle ölsün.

**Neden:** Bu projede QR çözücü, tuşa basıldığı anda dış CDN'den iniyordu — yani personel tam da
bodrumdayken. Kendi kökenimizden ve sürümlü adla sunulunca hem çevrimdışı çalıştı hem de bayat
önbellek imkânsız hâle geldi.

**Referans kod:** `scripts/build.mjs:121-131`
```js
/* 6b) VENDOR — jsQR KENDİ ORIJİNİMİZDEN (Faz 0, 2026-09-02) ───────────────────────
   ⛔ … QR çözücü **Okut tuşuna basıldığı an** cdn.jsdelivr.net'ten iniyordu — yani personel
   tam da bodrumdayken. Artık kendi sunucumuzdan iniyor ve `Cache-Control: immutable` ile …
   ⛔ DOSYA ADINDA SÜRÜM VAR: immutable ancak böyle güvenli — yükseltme yeni URL demektir…
   ⛔ npm paketi devDependency: node_modules silinip `npm i` koşulmazsa build BURADA ÖLÜR —
   sessizce eksik dosyayla yayına çıkmaktansa gürültülü çökmek doğru. */
```

**Yeni projeye uyarlama:** Aynen geçerli. Ek olarak kütüphane sürümünü **iki yerde** (derleme ve
kullanan modül) tutmak zorunda kalıyorsan ikisini bir testle birbirine kilitle — kaynak projede
`tests/faz0-cevrimdisi-qr.test.js` bunu yapıyor.

---

## Tek küresel ad alanı varsa çakışma testle kapatılır

**Kural:** Küresel kapsam paylaşan bir mimaride, aynı adın iki yerde tanımlanmasını bir test
yasaklasın; tarama deseninin hâlâ çalıştığını da aynı test doğrulasın.

**Neden:** İkinci `function x(` hata vermez — sonraki dosya öncekini ezer ve eski işlevi çağıran
her ekran **sessizce** bozulur. Üst düzey `let/const` çifti ise yüklemede sözdizimi hatası verir,
uygulama hiç açılmaz.

**Referans kod:** `tests/kuresel-ad-cakismasi.test.js:4-8` ve `:39-45`
```js
/*  1) İkinci `function x(` HATA VERMEZ — sonraki dosya öncekini ezer, eski işlevi çağıran her
       ekran sessizce bozulur. Üst düzey `let/const` çifti ise yüklemede SyntaxError → uygulama
       hiç açılmaz. `var` çifti yasal ama aynı sessiz ezme. */
assert.ok(isl >= 2000, 'üst düzey işlev sayısı ' + isl + ' — tarama deseni tutmuyor olabilir');
const cift = [...nerede].filter(([, y]) => y.length > 1)…
assert.deepEqual(cift, [], 'AYNI AD BİRDEN FAZLA ÜST DÜZEY TANIMDA (sonraki öncekini ezer):\n' + …);
```

**Yeni projeye uyarlama:** Modül sistemi olan projelerde bu risk yoktur; yerine **aynı isimli
dışa aktarım / aynı id / aynı CSS seçicisi** taramaları konur. Taşınacak asıl fikir alt satırdaki
güvenlik ağıdır: *tarama bir şey bulamıyorsa, tarama bozulmuş olabilir* — desenin hâlâ eşleştiğini
alt sınır iddiasıyla kanıtla.

---

## Ekranlar sayfa; pencere (modal) ayrı bir katman

**Kural:** Tüm ekranlar aynı kapta `.page` olarak dursun, tek biri `active` olsun; geçiş tek bir
fonksiyondan yapılsın ve o fonksiyon oturum durumunu, geçmişi, kaydırmayı ve gezinme vurgusunu
tek yerde yönetsin.

**Neden:** Sayfa geçişi çok işi aynı anda yapar (kaydedilmemiş veriyi boşaltma, kiosk kilidi,
yenileme sonrası aynı sayfada kalma). Dağıtılırsa her ekran birini unutur.

**Referans kod:** `src/js/09-yetki-navigasyon-durum.js:68-90`
```js
function showPage(name, push=true){
  const prevPage=S.page;
  if(typeof isBakimCihazi==='function' && isBakimCihazi() && name!=='makine'){ name='makine'; push=false; }
  if(prevPage==='repairs' && name!=='repairs'){ try{ if(typeof _repFlush==='function') _repFlush(); }catch(e){} }
  try{ sessionStorage.setItem('te_page', name);   // F5 sonrası aynı sayfada kal
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  …
  if(name!==prevPage) window.scrollTo(0,0);   // yalnız SAYFA DEĞİŞİNCE başa sar …
```

**Yeni projeye uyarlama:** Yönlendirici (router) kullanan projede bu mantık "route guard +
navigation hook" olur. Taşınan kural: **geçişin yan etkileri tek yerde toplanır.**

---

## Pencere mi tam sayfa mı: aynı içerik, tek anahtar

**Kural:** Aynı içeriği bazen pencere bazen tam sayfa göstermek gerekiyorsa, iki ayrı ekran yazma;
tek pencereye bir "tam sayfa" sınıfı ekleyip çıkar. Pencereler üst üste açılabiliyorsa katman
sırası açılışta hesaplansın.

**Neden:** İçeriğin iki kopyası zamanla ayrışır. Katman sırası elle yazılan z-index'lerle
yönetilirse, üst üste açılan ikinci pencere ilkinin altında kalır.

**Referans kod:** `src/js/22-modal-tema-events-baslat.js:31-33` ve `:44-46`
```js
// Süper admin aracı TAM SAYFA modu (openSuperTool işaretler) — açılan modalı popup yerine sayfa yap
if(typeof _gToolMode!=='undefined'){ ov.classList.toggle('gtool-page', !!_gToolMode); _gToolMode=false; }
…
// Açılan modal en üste gelsin (üst üste açılan modallar için)
_modalZ+=10;
ov.style.zIndex=_modalZ;
```
Aynı fonksiyon erişilebilirliği de merkezîleştirir:
```js
try{ a11yLabels(ov); }catch(e){}   // dinamik render edilen form alanlarına erişilebilir ad ver
try{ markDialog(ov); }catch(e){}   // role=dialog + odak modala girsin (Esc/Tab tuzağı buna bağlı)
```

**Yeni projeye uyarlama:** Bileşen tabanlı projede aynı bileşen `variant="page|modal"` alır.
Odak tuzağı, Esc davranışı ve erişilebilir ad **pencere açan tek fonksiyonun** işi olmalı.

---

## Yeni veri dalı = dört ayna aynı anda

**Kural:** Veri modeline yeni bir dal eklenirken dört yeri birlikte güncelle: (1) yüklenecek dallar
listesi, (2) biçim (dizi/harita) listesi, (3) yazma yükü (payload), (4) sunucu tarafı güvenlik
kuralı. Biri unutulursa sistem **hatasız ama yanlış** çalışır.

**Neden:** Bu projede yazma yükü unutulduğunda kaydetme işlevi başarı döndürüp hiçbir şey
yazmıyordu; biçim listesi unutulduğunda ekran sessizce boş açılıyordu.

**Referans kod:**
- Dal listeleri — `src/js/03-firebase-tenant-sirketler.js:542,546`
  ```js
  const COMPANY_BRANCHES = […];   // hangi dallar yüklenir
  const ARRAY_BRANCHES   = […];   // hangileri dizi olarak ele alınır
  ```
- Yazma yükü — `src/js/07-global-paneller.js:314` (`async function save()` içinde dallar **açıkça** sayılır)
- Sunucu kuralı — `database.rules.json:21-25` (`data/$cid` altında dal bazlı `.read`/`.write`)

**Yeni projeye uyarlama:** Ayna sayısı mimarine göre değişir (şema, tip tanımı, göç dosyası,
yetki matrisi). İlk iş: **aynaların listesini yaz** ve yeni dal eklerken o listeyi izleyen bir test
kur. Kaynak projede rol tarafının aynasını `tests/role-mirrors.test.js` tutuyor.
