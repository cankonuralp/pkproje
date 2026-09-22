# 02 · GÖRSEL SİSTEM — token, bileşen, web/mobil ayrımı

---

## Tüm renk/ölçü değerleri token, tema token'ı yeniden tanımlar

**Kural:** Renk, yarıçap, gölge, süre ve yazı ailesi `:root` altında değişken olarak tanımlansın;
koyu tema **aynı değişkenleri** yeniden tanımlasın. Bileşenlerde çıplak renk kodu yazılmasın.

**Neden:** Tema geçişi tek yerden döner; bir değişken çevrilmeyi unutulursa hata tek bir yerde ve
gözle görülür olur (kaynak projede gölge değişkenlerinden biri unutulmuş ve koyu temada mavi hale
bırakmıştı — düzeltmesi tek satır oldu).

**Referans kod:** `src/style.css:8-27`
```css
:root{
  --bg:#F5F7FA; --bg2:#EEF1F8; --card:#FFFFFF;
  --accent:#6C8EF5; --accent2:#5B7DE8;
  --txt:#111827; --txt2:#6B7280; --txt3:#7E8797; /* txt3 koyulaştırıldı (2026-07-05): … WCAG kontrastının çok altındaydı */
  --brd:#E5E7EB;
  --sh1:0 1px 6px rgba(0,0,0,.07); --sh2:0 4px 20px rgba(108,142,245,.13);
  --sans:'Inter',…; --r4:4px; --r8:8px; --r12:12px; --r16:16px; --r20:20px;
  --dur:.2s; --ease:cubic-bezier(.4,0,.2,1);
  color-scheme: light;
}
```
`src/style.css:37`
```css
--sh3:0 8px 40px rgba(0,0,0,.5);   /* iki kardeşi çevrilmiş, bu unutulmuştu → koyu temada mavi hale */
```

**Yeni projeye uyarlama:** Ad kümesini olduğu gibi al (arka plan / kart / metin üç kademe /
kenarlık / vurgu / durum renkleri + yumuşak zemin + koyu yazı üçlüsü). Renk **değerlerini** kendi
paletinle değiştir; kademe sayısını değiştirme, kod onu bekler.

---

## `color-scheme` bildirilmeden koyu tema tamamlanmış sayılmaz

**Kural:** Koyu tema eklerken `color-scheme` bildirimini de çevir.

**Neden:** Tarayıcının kendi çizdiği parçalar (açılır liste, tarih seçici, onay kutusu, kaydırma
çubuğu) CSS renklerini değil bu bildirimi okur. Bildirilmeyince koyu temada bu öğeler beyaz çizilir
ve hata "bazı yerler beyaz kalıyor" diye aylarca gezinir.

**Referans kod:** `src/style.css:24-27`
```css
/* ⛔ DENETİM BULGUSU (2026-09-09): color-scheme HİÇ bildirilmemişti → yerli açılır liste,
   tarih seçici, onay kutusu ve kaydırma çubuğu koyu temada BEYAZ çiziliyordu (tarayıcının
   kendi çizimleri bu bildirimi okur, CSS renklerimizi değil). Palet DEĞİŞMİYOR. */
color-scheme: light;
```

**Yeni projeye uyarlama:** Doğrudan geçerli, tek satır. Temayı `data-theme` gibi bir öznitelikle
değiştiriyorsan her iki blokta da bildir.

---

## Tanımsız değişken sessiz değil yıkıcıdır — bütünlük testi kur

**Kural:** Kullanılan her `var(--x)` için tanım var mı diye tarayan bir test yaz; çalışma anında
JS ile kurulan değişkenler testte açıkça beyan edilsin.

**Neden:** `font:700 12px/1 var(--sans)` içinde `--sans` tanımsızsa kısayolun **tamamı** geçersiz
olur; öğe 700/12px değil, miras 400/16px alır. Aynı şey `border:1px solid var(--line)` için de
geçerlidir — kenarlık hiç çizilmez. Hata konsolda görünmez.

**Referans kod:** `tests/css-degisken-butunlugu.test.js:1-12`
```js
/* ⛔⛔ TANIMSIZ `var(--x)` SESSİZ DEĞİL YIKICIDIR. …
   NEREDEN GELDİ: maket/sunum HTML'leri kendi `:root{--sans:…}` tanımını yapıyor …
   Maketten koda satır kopyalarken TANIM kopyalanmadı … Beş ayrı tarihte tekrarlandı. */
```

**Yeni projeye uyarlama:** Maket/prototip dosyalarından koda satır kopyalamak bu hatanın ana
kaynağı. Testi **ilk günden** kur; maket ile ürün ayrı token kümesi taşıdığı sürece risk sürer.

---

## Kısayol özelliğinde `inherit` kullanma

**Kural:** `font:`, `border:`, `background:` gibi kısayollarda değer olarak `inherit` yazma;
gereken özellikleri ayrı ayrı yaz.

**Neden:** `inherit` kısayolun **içinde** geçerli bir değer değildir; bildirimin tamamı düşer ve
öğe tarayıcı varsayılanına iner (13,33px / 400). Kaynak projede üç düğme aylarca sistem yazısıyla
çizildi, kimse fark etmedi çünkü "yakın" görünüyordu.

**Referans kod:** `tests/kestirimci-revize-2026-09-16.test.js:25-30`
```js
test('🔴 SINIF KİLİDİ: `font:… inherit` kısayolu GEÇERSİZDİR — yeni kullanım yasak (ratchet…)', () => {
  const v = f[1].replace(/var\([^)]*\)/g, 'VAR').trim();   // var(--x,inherit) geri dönüşü geçerlidir
  return v !== 'inherit' && /\binherit\b/.test(v);
```

**Yeni projeye uyarlama:** Doğrudan geçerli. Testi tarama olarak kurmak beş dakikalık iş; elle
gözle bulmak imkânsız.

---

## Liste görünümü tek üreticiden çıkar (tablo ↔ kart)

**Kural:** Masaüstünde tablo, telefonda kart olan her liste **tek** bir üreticiden geçsin; sütun
tanımında her sütunun mobil rolü belirtilsin.

**Neden:** Ekran başına elle yazılan tablo/kart ikilisi zamanla ayrışır: birinde sütun eksilir,
diğerinde başlık değişir. Tek üretici, mobil davranışı bir veri alanına indirger.

**Referans kod:** `src/js/02-state-yardimci.js:163-180`
```js
/* ── TABLO ↔ KART (mobil ayrımı standardı, 2026-08-25) ────────────────────────────
   cfg = { cols:[{ad, hucre(satir,i), r?:bool, mob?:'ust'|'sub'|'alt'|'cip'|'gizle'}],
           rows:[...], tr?:(satir,i)=>'onclick=... ', bos?:'metin', tblCls?:'' }
   mob rolleri: ust=kart başlığı · sub=gri alt satır · alt=alt şerit · cip=rozet · gizle=düşür
   ⛔ Yazdırma/PDF tablolarında KULLANILMAZ (A4 sayfalama motoru kart düzenini kaldırmaz). */
function tabloKart(cfg){
  const bos=(cfg&&cfg.bos)||'Kayıt yok';
  if(!rows.length) return '<div class="prs-row-sub" style="padding:10px 6px">'+safe(bos)+'</div>';
  const hucre=(c,r,i)=>{ try{ return c.hucre(r,i); }catch(e){ return ''; } };
```
Hücre üreticisinin `try/catch` ile sarılması da kural: **tek bozuk satır tüm listeyi düşürmez.**

**Yeni projeye uyarlama:** Bileşen tabanlı projede aynı sözleşme prop olarak taşınır
(`columns[].mobileRole`). "Boş liste metni" ve "hücre hatası yutulur" davranışlarını da taşı.

---

## Süzgeç/arama satırı tek üretici, sabit sıra, sabit yükseklik

**Kural:** Arama kutusu, çipler, ve/veya anahtarı ve seçiciler her ekranda aynı üreticiden, aynı
sırayla ve aynı yükseklikte çizilsin. Süzgeç satırı, içerik boşken de görünür kalsın.

**Neden:** Ölçüldüğünde aynı üründe arama kutusu bir ekranda solda 300px, diğerinde sağda 867px,
çipler 30 ve 38px karışıktı. Kullanıcı her ekranda yeniden öğreniyordu.

**Referans kod:** `src/style.css:2350-2357`
```css
/* … "birisinde arama barı solda birisinde sağda, birisinde büyük birisinde küçük … tek tipe"
   SIRA: arama → çipler → veya/ve → boşluk → seçiciler SAĞDA → Temizle. HEPSİ 38 px. Kart çerçevesi YOK. */
.suz-satir{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 12px;min-width:0}
.suz-satir .suz-ara{flex:0 1 300px;min-width:190px;height:38px;…}
```
Üretici — `src/js/02-state-yardimci.js:1911-1920`
```js
function filterBarHtml(cfg){
  return '<div class="suz-satir"…>'
    + (c.bas?'<div class="suz-bas">'+c.bas+'</div>':'')
    + _fbAraHtml(c.search)
    + '<button … class="fb-filterbtn suz-filtrele'+(f.on?' fb-on':'')+'"…>'
    + '<div class="suz-cipler"…>'+_fbCiplerHtml(c)+'</div>'
    + '<div class="suz-secici"…>'+_fbSecicilerHtml(c)+'</div>'
  + '</div>' + _fbAktifHtml(c);
}
```

**Yeni projeye uyarlama:** Sıra ve ölçüleri kendi tasarımına göre belirle ama **bir kere** belirle
ve üreticiyi tek yap. Yeni ekran eklerken "elle süzgeç kurma" yasağını teste bağla.

---

## Yerli (native) seçim alanı yerine temalı tek bileşen — ama mantık yerinde kalır

**Kural:** Cihazın kendi açılır listesi tasarımına uymuyorsa temalı bir bileşenle değiştir; fakat
**yerli öğeyi kaldırma** — gizli değer taşıyıcısı olarak yerinde kalsın, bileşen değeri ona yazıp
olayları tetiklesin. Bileşen, belge gözlemcisiyle kendiliğinden kurulsun.

**Neden:** Tasarım uğruna yerli öğeyi söken bileşenler, mevcut tüm kaydetme/okuma kodunu bozar.
Değer taşıyıcısı yerinde kalırsa `.value` okuyan, `change` dinleyen hiçbir kod değişmez; ekran
başına bağlama kodu da yazılmaz.

**Referans kod:** `src/js/42-secim-alani.js:5-18`
```js
/* İKİ TÜR, TEK ÜRETİCİ:
     · SEÇMELİ     <select data-secim>          → alanın yerinde temalı düğme; yerli öğe GİZLİ DEĞER TAŞIYICI kalır
     · YAZILABİLİR <input data-secim list="…">  → yazı kutusu yerinde kalır; yerli öneri kapatılır, temalı öneri açılır
   ⛔ MANTIK YERİNDE: kaydetme/okuma kodu yerli öğenin `.value`'sunu okur, `change`/`input` dinler …
   ⛔ KENDİLİĞİNDEN DOĞAR: belge gözlemcisi `[data-secim]` taşıyan her yeni öğeyi kurar; ekran başına bağlama yok.
   ⛔ KATMAN: liste body'ye eklenir (fixed, z 16000) — pencere (10050+) ve onay kutusu (15000) üstünde … */
```
Kurulum — `src/js/42-secim-alani.js:374-385`
```js
new MutationObserver(kayitlar => { … if(n.hasAttribute('data-secim')) _scmKur(n); … }).observe(document.body,{childList:true,subtree:true});
document.querySelectorAll('[data-secim]').forEach(_scmKur);
```

**Yeni projeye uyarlama:** Bileşen kütüphanesi kullanıyorsan hazırı vardır; taşınacak olan üç
kısıt: (1) değer taşıyıcısı ve olaylar değişmez, (2) katman sırası pencerelerin üstünde, (3)
telefonda alttan levha + 48px satır. Tarih/saat alanlarını da unutma — cihazın kendi penceresini
açan tek alan kalsa tema tutarsız görünür.

---

## Kırpılan metin başlıksız bırakılmaz

**Kural:** Metni kabına sığmayan öğeye tam metni `title` olarak koy; sığmaya başlayınca kaldır.
Tarama, çizim sonrası gözlemciyle tetiklensin.

**Neden:** Katalogdan gelen (uzunluğu müşteriye bağlı) etiketler kesiliyor ve kullanıcı tam
değeri hiçbir yerde göremiyordu. Düğme etiketleri CSS ile üç nokta alamıyor — hiç olmazsa tam
metin kaybolmuyor.

**Referans kod:** `src/js/02-state-yardimci.js:2184-2201`
```js
const KIRP_SEC = 'td,.kirp,.eqg-roz,.eqg-sade,.nm,.ir-val,.bkm-md em,.yon-sat em,.btn';
function kirpikIpuclariniTazele(){
  kap.querySelectorAll(KIRP_SEC).forEach(x=>{
    const kirpik = x.scrollWidth - x.clientWidth > 1;
    if(kirpik){ … x.setAttribute('title', tam); x.dataset.kirpIp='1'; }
    else if(x.dataset.kirpIp==='1'){ x.removeAttribute('title'); delete x.dataset.kirpIp; }
  });
}
function kirpikIpucuPlanla(){ clearTimeout(_kirpZaman); _kirpZaman = setTimeout(kirpikIpuclariniTazele, 200); }
```

**Yeni projeye uyarlama:** Doğrudan taşınır. İki ayrıntı: (1) yalnız **kendi koyduğun** ipucunu
kaldır (`data-*` işareti), (2) gözlemciyi geciktir (debounce) yoksa her çizimde tüm ağacı ölçersin.

---

## Uzun süren her işlem tuşu kilitler ve süreyi gösterir

**Kural:** Ağ/dosya işi başlatan tuş, iş bitene kadar kilitlensin; üzerinde dönen simge, adım
metni ve birkaç saniye sonra geçen süre görünsün; ikinci basış sessizce yok sayılsın. Genişliği
sabitlensin ki düzen zıplamasın.

**Neden:** Kilitlenmeyen tuş çift kayıt üretir; geri bildirim vermeyen tuş kullanıcıya "çalışmadı"
dedirtip üçüncü kez bastırır.

**Referans kod:** `src/js/02-state-yardimci.js:1206-1222`
```js
/* • tuş kilitlenir; üstünde dönen simge + etiket + 3 sn sonra geçen süre;
   • aynı tuşa ikinci basış HİÇBİR ŞEY başlatmaz (mesgulken sessizce yok sayılır);
   • iş `ilerle(msg)` ile adımını yazar; bitince ya da hata olunca tuş eski hâline döner. */
const _tusMesgul=new WeakSet();
async function uzunTus(btn, etiket, is){
  if(btn && _tusMesgul.has(btn)) return undefined;
  …
  if(btn){ … try{ if(btn.offsetWidth) btn.style.minWidth=btn.offsetWidth+'px'; }catch(e){} yaz(); sayac=setInterval(()=>yaz(),1000); }
  try{ return await is(yaz); }
  finally{ if(btn){ … btn.innerHTML=eski.html; } }
}
```
İlgili ders — ilerleme metni yazılırken tuş **yeniden yaratılmaz**: `src/js/02-state-yardimci.js:1232-1234`
```js
/* İlerleme güncellemesi: YALNIZ metin alanını yaz. Tuşu yeniden yaratmıyoruz —
   eskiden her ilerleme olayında innerHTML ile yeniden kuruluyordu ve parmağın
   inip kalkması arasına denk gelirse basış YUTULUYORDU. */
```

**Yeni projeye uyarlama:** Doğrudan taşınır. `finally` bloğu şart: hata durumunda tuş kilitli
kalırsa kullanıcı ekranı yeniler ve veri kaybı riski doğar.

---

## Mobil ayrı tasarımdır; eşik sınıfla yönetilir, ekran ekran değil

**Kural:** Masaüstü/mobil farkını her ekranda ayrı medya sorgusuyla çözme; iki taşıyıcı sınıf
(geniş/dar) ve kabuk durumunu anlatan bir gövde sınıfı kur, kuralı **sınıfın kendisine** yaz.

**Neden:** Bu projede blok genişliğindeki düğme sınıfı 184 yerde kullanılıyordu; tek tek düzeltmek
yama olurdu. Kural sınıfa konunca bundan sonra yazılan her kullanım da doğru doğdu.

**Referans kod:** `src/style.css:618-634`
```css
/* ══ DÜĞME GENİŞLİĞİ — MOBİLDE BLOK, MASAÜSTÜNDE İÇERİK KADAR ══════════════
   ⛔⛔ ÖNLEYİCİ TASARIM: "çözümler yama olmayacak … oluşabilecek sorunlar için de önleyici"
      `.btn-full` 184 yerde kullanılıyor — tek tek düzeltmek yamadır. Kuralı SINIFIN KENDİSİNE koyuyoruz…
   ⛔ EŞİK 1000px + has-module-sidebar: … masaüstü kabuk varken içerik genişliği, mobil/kioskta parmak hedefi. */
@media(min-width:1000px){
  body.has-module-sidebar .btn-full{width:auto;flex:0 0 auto;min-height:40px}
  body.has-module-sidebar .modal-bottom-close{display:none}
}
```
Görünüm ayrımı — `src/style.css:2437-2438`
```css
.mk-only-wide{display:none}
@media(min-width:760px){.mk-only-wide{display:block}.mk-only-narrow{display:none}}
```

**Yeni projeye uyarlama:** Eşik sayılarını kendin seç ama **az sayıda** eşik kullan ve adlandır
(dar / geniş / kabuklu). Kaynak projede beş eşik birikmişti; yeni projede ikiden üçe kadar tut.
Kural: *aynı ekranı iki kez tasarla* — daraltılmış masaüstü mobil tasarım değildir.

---

## Boş durum bir bileşendir, boş ekran değil

**Kural:** Veri yokken ekran boş kalmasın: ikon rozeti + başlık + açıklama düzeni tek sınıftan
gelsin; liste üreticileri de boş metnini parametre olarak alsın.

**Neden:** Boş ekran kullanıcıya "bozuk" hissi verir; her ekranın kendi boş metnini yazması ise
tutarsız dil üretir.

**Referans kod:** `src/style.css:760-775`
```css
/* ── EMPTY (2026-07-06 modernizasyon: yumuşak ikon rozeti + hiyerarşi + yumuşak giriş) ── */
.empty-state{ text-align:center;padding:44px 24px;color:var(--txt3);
  display:flex;flex-direction:column;align-items:center; animation:empty-in .4s var(--ease); }
.empty-icon{ width:76px;height:76px;margin-bottom:16px; … background:var(--bg2);border-radius:50%; }
.empty-state .empty-title{font-size:15.5px;font-weight:700;color:var(--txt2);margin-bottom:4px}
```
Liste tarafı — `src/js/02-state-yardimci.js:170-172` (`bos:'metin'` parametresi)

**Yeni projeye uyarlama:** Doğrudan taşınır. Ek olarak boş durumun **üç hâlini** ayır: hiç veri
yok · süzgeç sonucu boş · hata. Üçü aynı metni gösterirse kullanıcı süzgeci temizlemeyi denemez.
