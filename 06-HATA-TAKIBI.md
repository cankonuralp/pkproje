# 06 · HATA TAKİBİ — zırh, yakalama, kısma, doğrulama

---

## Her ekran çizimi kendi zırhında koşar

**Kural:** Ekran çizim fonksiyonlarını doğrudan çağırma; her birini `try/catch` sarmalayan tek bir
yardımcıdan geçir. Hata konsola ve hata kaydına düşsün, **ekran ayakta kalsın**.

**Neden:** Tek bozuk kayıt veya beklenmedik bir istisna, sayfayı sessizce kilitliyordu; yenileme de
aynı yerde kırıldığı için kullanıcı uygulamaya hiç giremiyordu.

**Referans kod:** `src/js/09-yetki-navigasyon-durum.js:101-110`
```js
// RENDER ZIRHI (2026-08-16): tek bozuk kayıt/beklenmedik throw sayfayı sessizce kilitliyordu
// (F5 de aynı yerde kırılıyordu) — projenin kendi "render'ları try/catch'e al" kuralı dispatcher'a
// da uygulanır; hata konsola + errorLogs'a düşer, ekran ayakta kalır.
const _rz=f=>{ try{ f(); }catch(err){ console.error('[render:'+name+']', err);
  try{ if(typeof logClientError==='function') logClientError(err, 'render:'+name); }catch(_e){} } };
if(name==='home')        _rz(renderHome);
if(name==='mahal')       _rz(renderMahalPage);
```

**Yeni projeye uyarlama:** React/Vue tarafında karşılığı hata sınırı (error boundary) bileşenidir;
**ekran başına bir sınır** kur, uygulamanın tepesine tek bir tane değil. Aynı zırhı liste hücresi
üreticisinde de uygula (bkz. `02-GORSEL-SISTEM.md` tablo üreticisi).

---

## Yakalanmayan hata ve reddedilen söz (promise) küresel olarak yakalanır

**Kural:** `error` ve `unhandledrejection` olaylarını tek yerde dinle; ikisi de aynı kayıt yoluna
gitsin.

**Neden:** Asenkron kodda hataların çoğu yakalanmamış söz reddi olarak gelir; yalnız `error`
dinlemek, arızaların yarısını görünmez bırakır.

**Referans kod:** `src/js/08-kilit-save-giris-hata.js:772-781`
```js
function setupErrorTracking(){
  window.addEventListener('error', (e)=>{
    try{ logAppError(e.message||'Bilinmeyen hata', (e.filename||'')+':'+(e.lineno||''), e.error&&e.error.stack); }catch(_){}
  });
  window.addEventListener('unhandledrejection', (e)=>{
    const msg=(e.reason&&(e.reason.message||e.reason.toString()))||'Promise hatası';
    logAppError(msg, 'unhandledrejection', e.reason&&e.reason.stack);
  });
}
```

**Yeni projeye uyarlama:** Doğrudan taşınır. Hazır bir hata izleme servisi kullanacaksan bile bu
iki dinleyiciyi **kendi** kaydına da bağla — servis erişilemediğinde iz tamamen kaybolmasın.

---

## Aynı hata kısılır, gürültü elenir

**Kural:** Aynı mesaj için kayıt sıklığını sınırla (anahtar başına zaman penceresi) ve senin
sorunun olmayan bilinen gürültüyü (izin reddi, ağ kopması, kota, tarayıcı/SDK iç hataları)
kaydetme.

**Neden:** Bir döngüde patlayan hata saniyede yüzlerce kayıt yazar; hem maliyet üretir hem de
gerçek hatayı gömer. Gürültü filtresi olmazsa sağlık eşikleri boşuna tetiklenir.

**Referans kod:** `src/js/08-kilit-save-giris-hata.js:786-798`
```js
// Aynı mesajı 60 sn içinde tekrar loglama (spam önleme)
const key=String(message).slice(0,80);
if(_errorLogThrottle[key] && now-_errorLogThrottle[key]<60000) return;
// Bağlantı/izin hatalarını loglama (gürültü)
if(m.includes('permission_denied')||m.includes('network error')||m.includes('quota')) return;
// Firebase SDK'nın iOS Safari IndexedDB gürültüsü — zararsız (SDK yakalar/yeniden dener) …
if(m.includes('in-progress transaction')||m.includes('indexeddb')|| … ) return;
```

**Yeni projeye uyarlama:** Doğrudan taşınır. Filtre listesine eklediğin her kalemin yanına
**neden zararsız olduğunu** yaz; yoksa liste zamanla gerçek hataları da yutar.

---

## Hata kaydı bağlamıyla birlikte yazılır

**Kural:** Kayıtta mesaj ve yığın izinin yanında kiracı, kullanıcı, cihaz, sayfa ve zaman bulunsun;
yığın izinin ilk satırı (mesajın kopyası) atılıp birkaç kare tutulsun ve kırpılsın.

**Neden:** Bağlamsız hata kaydı "bir yerde bir şey oldu" demektir. Kırpma olmadan tek bir hata
kaydı kilobaytlarca yer kaplar.

**Referans kod:** `src/js/08-kilit-save-giris-hata.js:799-812`
```js
// Yığın izi (stack): ilk satır mesajın kopyası → at; sonraki kareler yeri gösterir
// (minify'da adlar KORUNDUĞU için fonksiyon adları okunur). ~600 karaktere kırp.
const entry={
  msg:String(message).slice(0,300), where:String(where||'').slice(0,200), ...(st?{stack:st}:{}),
  company:…, companyId:…, user:…, device:(navigator.userAgent||'').slice(0,160), ts:now, at:nowStr()
};
```

**Yeni projeye uyarlama:** Derleme damgasını da ekle (bkz. `01-MIMARI.md`). Küçültme yapıyorsan ya
adları koru ya kaynak haritası üret — okunamayan yığın izinin değeri yoktur.

---

## Hata defteri sınırlıdır ve yalnız yetkili okur

**Kural:** Hata kayıtları için üst sınır belirle ve budamayı yap; defteri okuma yetkisini en üst
role bırak. Budamayı esas olarak sunucuda yap, istemci yalnız yedek olsun.

**Neden:** Sınırsız defter büyür ve hem maliyet hem sızıntı riski üretir (kayıtlarda kullanıcı ve
kiracı adı geçer). İstemci budaması yetkisiz kullanıcıda **sessizce** başarısız olur.

**Referans kod:** `src/js/08-kilit-save-giris-hata.js:770` ve `:814-824`
```js
const MAX_ERROR_LOGS=100;
…
// Son MAX_ERROR_LOGS tutma budaması: errorLogs'u sadece süper admin OKUYABİLİR —
// normal kullanıcıda okuma izni yok (sessizce başarısız oluyordu). Budama artık gece bakımında
// sunucuda; süper admin oturumunda istemci de yedek olarak yapar.
const items=[]; snap.forEach(ch=>{ items.push({k:ch.key,ts:ch.val().ts||0}); }); // push return edilirse forEach İLK kayıtta durur
```

**Yeni projeye uyarlama:** Doğrudan taşınır. Yan not: yukarıdaki yorumda geçen "geri dönerse
döngü durur" tuzağı platforma özgüdür — kendi veri katmanının yineleme tuzaklarını da koda yaz.

---

## Yazmayan ikinci bir hata kanalı bulunsun

**Kural:** Sunucuya yazmayan, konsola basan ve son N kaydı bellekte tutan hafif bir kaydedici de
olsun. Yalnızca `typeof x === 'function'` kapısının arkasında çağrılan bir kaydedici **tanımlı**
olduğundan emin ol.

**Neden:** Her yeni yazma yolu yeni maliyet ve yeni yetki sorusu demektir; çizim hatalarının çoğu
için bellekte son 20 kayıt yeterlidir. Kaynak projede bu fonksiyon üç yerden çağrılıyordu ama hiç
tanımlı değildi — koruma kapısı yüzünden hata da vermiyordu: **sessizce hiçbir şey yapmıyordu.**

**Referans kod:** `src/js/02-state-yardimci.js:1475-1493`
```js
/* … HİÇBİR YERDE TANIMLI DEĞİLDİ. Çağrılar `typeof ... === 'function'` kapısının arkasındaydı,
   bu yüzden hata vermiyor — sessizce HİÇBİR ŞEY yapmıyordu. Bir ekran çizilirken patlasa iz kalmıyordu.
   ⛔ Sunucuya yazmıyor (yeni yazma yolu = yeni maliyet + yeni yetki sorusu): konsola yazar
   ve son 20 kaydı bellekte tutar; destek anında `_istemciHatalari` ile okunabilir. */
window._istemciHatalari = window._istemciHatalari || [];
function logClientError(err, nerede){ … if(window._istemciHatalari.length > 20) window._istemciHatalari.shift(); … }
```

**Yeni projeye uyarlama:** Doğrudan taşınır. Genel ders: **"varsa çağır" kapıları sessiz ölüm
üretir.** Böyle bir kapı yazıyorsan, hedefin gerçekten tanımlı olduğunu bir testle doğrula.

---

## Her teslimden sonra canlıya karşı duman testi koşulur

**Kural:** Yayın sonrası, canlı sistemi dışarıdan yoklayan küçük bir betik koş: servisler ayakta
mı, site dönüyor mu, yedek taze mi, veri bütünlüğü koruyucuları geçiyor mu. Çıkış kodu sonucu söylesin.

**Neden:** Birim testleri kodun doğruluğunu ölçer, canlı yapılandırmayı değil. Yanlış dağıtılan
kural, biten bir anahtar veya duran zamanlayıcı yalnız canlıda görülür.

**Referans kod:** `tools/smoke.js:1-10`
```js
/* TakipEt DUMAN + REGRESYON TESTİ — her teslim sonrası: `node tools/smoke.js`
   1) login callable ayakta mı  2) getBackup callable ayakta mı  3) canlı site 200+boyut
   … veri bütünlüğü regresyon guard'ları:
   4) gece yedeği taze mi (son 36 saat)
   5) katalog bütünlüğü (her şirketin data/users düğümü var)
   6) ÖKSÜZ AUTH DÜĞÜMÜ YOK … 7) DÜZ-METİN ŞİFRE SIZINTISI YOK …
   Çıkış kodu 0 = hepsi geçti. */
```

**Yeni projeye uyarlama:** Doğrudan taşınır ve ucuzdur. Listeye **veri bütünlüğü** iddialarını da
koy (yukarıdaki 4–7 maddesi gibi); sadece "site 200 dönüyor" demek yanıltıcıdır.
