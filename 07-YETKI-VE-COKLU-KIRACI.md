# 07 · YETKİ VE ÇOK KİRACILI VERİ İZOLASYONU

---

## Kiracı yolu tek bir üreticiden çıkar

**Kural:** Kiracıya ait veri yolunu hiçbir yerde elle birleştirme; kök sabiti ve yol üreticisi tek
yerde tanımlansın, istemci ve sunucu **aynı** sabiti kullansın.

**Neden:** Elle yazılan her yol, bir gün yanlış kiracıya yazma hatasıdır. Tek üretici, izolasyonu
kod incelemesinde gözle doğrulanabilir kılar.

**Referans kod:** `src/js/03-firebase-tenant-sirketler.js:28-34`
```js
/*  takipet/companies/{id}  → şirket kataloğu {name, createdAt, active}
    takipet/data/{id}/...   → o şirketin İZOLE verisi (equips, reports, users...) */
const TENANT_ROOT='takipet';
function companyDataPath(cid){ return `${TENANT_ROOT}/data/${cid}`; }
```
Sunucu aynası — `functions/index.js:50` (aynı `TENANT_ROOT` sabiti).

**Yeni projeye uyarlama:** İlişkisel veritabanında karşılığı "her sorguda kiracı kimliği zorunlu"
kuralıdır; bunu tek bir veri erişim katmanında zorla (satır seviyesi güvenlik / zorunlu `WHERE`).
Kiracı kimliğini istemcinin gönderdiği gövdeden değil, **oturumdan** al.

---

## Yetki kimlik biletine gömülür, adlar gömülmez, bütçe ölçülür

**Kural:** Kullanıcının rol seviyesi ve yazma yetkileri kimlik jetonuna kısa anahtarlarla yazılsın
(rol/departman **adı** değil, anahtarı). Jeton boyutu sınıra yaklaşınca uyarı üretilsin.

**Neden:** Güvenlik kuralının her istekte veritabanı okuması pahalıdır; jetondaki yetki bunu
bedavaya getirir. Ama jeton boyutu sınırı aşarsa jeton hiç üretilemez ve **giriş komple kırılır** —
bu sessiz ve felaket bir hatadır.

**Referans kod:** `functions/index.js:308-340`
```js
/* KİMLİK BİLETİ BÜTÇESİ — Firebase özel alanları 1000 baytla sınırlar, aşarsa bilet üretilemez ve giriş
   komple kırılır. … Bu yardımcı biletin TAMAMINI ölçer, 850 baytı geçince loga yazar. */
async function writeClaims(cid, user){
  const pws = WRITE_PERMS.filter(p => eff.includes(p));
  const out = { rl };
  if (pws.length) out.pw = '|' + pws.join('|') + '|';
  /* DEPARTMAN CLAIM'LERİ — kısa tutuluyor (rol/departman ADI ASLA bilete yazılmaz, yalnız anahtar).
     dp = kullanıcının departmanı · dm = müdürü OLDUĞU departman (kurallar bunu okur). */
  try { const n = JSON.stringify(out).length; if (n > 700) console.warn('[claim-bütçe]', cid, n, 'bayt'); } catch (e) {}
```

**Yeni projeye uyarlama:** JWT kullanan her projeye doğrudan taşınır. İki ayrıntı: (1) yetkileri
ayraçlı tek dizgede tutmak (`|a|b|`) kural motorlarında güvenli "içerir" sorgusu sağlar — dizinin
desteklenmediği yerlerde işe yarar; (2) jeton **yenilenene kadar** eski yetkiyi taşır; yetki
düşürme işlemlerinde jeton iptali/yenilemesi planlanmalı.

---

## Yetki kararının önceliği tek yerde, tek sırayla verilir

**Kural:** "Bu kullanıcı bunu yapabilir mi?" sorusuna cevap veren tek bir fonksiyon olsun ve
öncelik sırası açıkça yazılsın: en üst yönetici → sahiplik istisnası → kişiye özel yetki →
rol yetkisi → varsayılan.

**Neden:** Yetki kontrolü ekranlara dağılırsa her ekran başka bir sıra uygular; en sık sonuç, üst
yöneticinin kendi sisteminden kilitlenmesidir.

**Referans kod:** `src/js/02-state-yardimci.js:231-250`
```js
function canDo(action){
  if(!S.cur) return false;
  if(S.cur.isSuper) return true;                       // Süper admin her zaman tam yetkili (kilitlenmeyi önler)
  if(S.cur.memberOwner && S.cur.mid){                  // sahibi olduğu şirkette süper gibi
    const c=S.companies.find(x=>x.id===S.activeCompanyId);
    if(c && c.mid===S.cur.mid) return true;
  }
  if(S.cur.perms && Array.isArray(S.cur.perms)) return S.cur.perms.includes(action);   // kişiye özel override
  if(S.cur.role==='admin'){ … return true; }
  // Diğer roller …
}
```

**Yeni projeye uyarlama:** Doğrudan taşınır. Sahiplik istisnasını (kaynak projede "üye sahibinin
ikincil şirkette kullanıcı kaydı yoktur") kendi modelinde **açıkça** tanımla; bu tip istisnalar
sonradan eklendiğinde her yeri gözden geçirmek gerekir.

---

## İstemci yetkisi kolaylık, sunucu kuralı güvenliktir

**Kural:** Her yetki kararının sunucu tarafında bağımsız bir karşılığı olsun. İstemci kontrolünü
"kullanıcı boşuna denemesin" diye yap, güvenliği ona dayandırma.

**Neden:** İstemci kodu kullanıcının elindedir. Kaynak projede sunucu kuralları dal bazında hem
rolü hem de modül aboneliğini kontrol eder; istemci süzgeci yalnız kullanılabilirlik içindir.

**Referans kod:** `database.rules.json:445-446` (dal bazlı okuma/yazma; kiracı + silinmişlik +
modül aboneliği + yetki dizgesi bir arada)
```json
".read":  "auth != null && (auth.token.isSuper === true || ((auth.token.cid === $cid || …) && !root.child('takipet/companies/'+$cid+'/_deleted').exists() && root.child('takipet/companies/'+$cid+'/modules/depo').val() === true && auth.token.pw != null && (auth.token.pw.contains('|dep_view|') || …)))",
".write": "… auth.token.pw.contains('|dep_manage|') …"
```
İstemci tarafının kendi yorumu bunu zaten söylüyor — `src/js/07-global-paneller.js:357-358`:
```js
// Sunucu .validate zaten zorlar (yetki-yükseltme kapalı); bu istemci süzgeci … kullanılabilirlik içindir
```

**Yeni projeye uyarlama:** Doğrudan taşınır. Kuralları **veri dalı/tablo bazında** yaz; "giriş
yapmış herkes okur" tek satırı, çok kiracılı bir üründe en pahalı hatadır.

---

## Kök seviyesinde okuma açılmaz; erişim daima daraltılarak verilir

**Kural:** Kuralların kökünde `".read": true` benzeri bir açıklık bulunmasın. Erişim her düğümde
ayrı ayrı ve en dar biçimde verilsin; gizli düğümler açıkça kapatılsın.

**Neden:** Üstte verilen okuma izni alttaki tüm kısıtları geçersiz kılar — bir kez açıldığında
altındaki yüzlerce kural anlamsızlaşır.

**Referans kod:** `database.rules.json:5,23,282`
```json
".read": "auth != null && auth.token.isSuper === true",
".read": "auth != null && (auth.token.isSuper === true || ((auth.token.cid === $cid || …) && !root.child('takipet/companies/'+$cid+'/_deleted').exists()))",
".read": false,
```

**Yeni projeye uyarlama:** Doğrudan taşınır. Kuralları gözden geçirirken önce **en üstteki**
izinlere bak; çoğu güvenlik açığı alt dallarda değil, üstte verilmiş geniş bir izindir.

---

## Askıya alınmış/silinmiş kiracıya yazma tek bayrakla kapanır

**Kural:** Kiracıyı dondurmak/silmek için her ekranı dolaşma; kiracı kaydındaki tek bir bayrağı
hem sunucu kuralı hem istemci kaydetme yolu kontrol etsin.

**Neden:** Kötüye kullanım veya ödeme sorunu anında durdurulabilmeli; ekran ekran kapatma hem yavaş
hem eksiktir.

**Referans kod:** Sunucu — `database.rules.json:23-24` (`!root.child('takipet/companies/'+$cid+'/_deleted').exists()`)
İstemci — `src/js/07-global-paneller.js:314-316`
```js
// DONDURMA (2026-07-14): şirket dondurulduysa yazma kapalı (süper admin de dahil — çözmek için
// önce companies/{cid}/active=true yapar). Sorunlu/abuse şirketi anında durdurur.
if(companyFrozen()){ toast('🔒 Bu şirket donduruldu — değişiklik kaydedilemez.', 5000); return false; }
```

**Yeni projeye uyarlama:** Doğrudan taşınır. Bayrağı **en üst yönetici için de** geçerli kıl;
istisna bırakırsan bir gün o istisnadan yazılır.

---

## Rol tanımı dört aynada birden yaşar ve test onları bağlar

**Kural:** Yeni bir rol eklemek birden fazla yeri ilgilendiriyorsa (istemci varsayılanları, sunucu
yetki üretimi, bildirim hedefleme, güvenlik kuralları) bu aynaları birbirine bağlayan bir test yaz.

**Neden:** Bu projede iki rol istemciye eklenip sunucuya eklenmedi: istemci izin veriyor, kural
reddediyor, kullanıcı hiçbir şey yazamıyordu — ve **hiçbir ekran "yazamadın" demiyordu.**

**Referans kod:** `tests/role-mirrors.test.js:1-9`
```js
/* ROL AYNALARI (2026-08-19) — bir rol eklemek DÖRT yeri birden ilgilendiriyor:
     1. istemci  DEFAULT_ROLE_PERMS + ROLE_LEVEL   (01-config)
     2. sunucu   WRITE_DEFAULT_PERMS + ROLE_LEVEL_SRV   (functions — yazma claim'i `pw`)
     3. sunucu   PUSH_DEFAULT_PERMS + PUSH_ROLE_LEVEL   (functions — bildirim hedefi)
     4. database.rules.json                              (dal bazlı yazma kuralları)
   … Hata sessizdi çünkü hiçbir ekran "yazamadın" demiyordu. Bu testler aynaları birbirine bağlar */
```

**Yeni projeye uyarlama:** Doğrudan taşınır. Genel kural: **aynı gerçeğin birden fazla kopyası
varsa, kopyaları bir test bağlar.** Kopya sayısını azaltabiliyorsan önce onu yap.

---

## Yazma reddi kullanıcıya görünür olmalı

**Kural:** Sunucu bir yazmayı reddettiğinde ekran sessiz kalmasın; kullanıcıya "kaydedilmedi" bilgisi
verilsin ve kayıt tutulsun.

**Neden:** Yukarıdaki rol aynası hatası aylarca fark edilmedi çünkü arayüz başarısız yazmayı
sessizce yutuyordu. Kullanıcı verisinin kaydedildiğini sanması, kaybetmesinden beterdir.

**Referans kod:** Aynı dosya — `tests/role-mirrors.test.js:7-8` ("Hata sessizdi çünkü hiçbir ekran
'yazamadın' demiyordu"). Kaydetme yolunun açık geri dönüşü — `src/js/07-global-paneller.js:316`
(`return false` + kullanıcıya mesaj).

**Yeni projeye uyarlama:** Yazma sonucu **her zaman** kontrol edilsin; "ateşle ve unut" yalnız
gerçekten önemsiz kayıtlar için (etkinlik günlüğü gibi) ve yorumla gerekçelendirilerek kullanılsın.
