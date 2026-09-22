# 04 · GÖRSEL VARLIK — sıkıştırma, blob, önbellek, koruma

Bu dosyadaki kurallar birlikte çalışır: **yüklerken küçült → iki boy sakla → yetkiyle indir →
blob'a çevir → önbellekle → yer tutucudan otomatik doldur.** Biri atlanırsa diğerleri işe yaramaz.

---

## Görsel, yüklenmeden önce istemcide sıkıştırılır

**Kural:** Kullanıcının seçtiği/çektiği görseli olduğu gibi yükleme; tuvale çizip en uzun kenarı
sınırla, JPEG'e çevir ve öyle yükle. Saydam PNG'ler için zemini beyazla doldur.

**Neden:** Telefon kamerası 4–12 MB üretir; bu hem yükleme kotasını hem de her görüntülemede
indirme kotasını çarpar. Saydam zemin doldurulmazsa JPEG'de siyah lekeye döner.

**Referans kod:** `src/js/13-ekipman-belge-yukleme.js:144-162`
```js
/* Resim sıkıştırma (canvas ile, max 1600px + jpeg %75) */
function compressImage(file, maxDim=1600, quality=0.75){
  …
  if(width>maxDim||height>maxDim){ … }
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,width,height);
  ctx.drawImage(img,0,0,width,height);
  canvas.toBlob(b=>{ b?resolve(b):reject(new Error('sıkıştırma hatası')); }, 'image/jpeg', quality);
```

**Yeni projeye uyarlama:** Sayıları işine göre seç (belge fotoğrafı 1600/0.75 iyi bir başlangıç).
Sunucu tarafında yeniden boyutlandırma varsa bile **istemci sıkıştırması kalsın** — asıl kazanç
yükleme tarafında ve zayıf sahada.

---

## Her görselin bir de küçük kopyası yüklenir

**Kural:** Tam boy yüklerken yanına küçük bir önizleme kopyası at (yol adına sabit bir ek koyarak).
Liste ve önizlemeler küçüğü, büyüt/PDF/yazdır tam boyu kullansın. Küçük kopya üretimi hata verirse
yükleme **kırılmasın**.

**Neden:** Liste ekranı 30 fotoğrafı tam boy indirirse hem yavaş hem pahalıdır. Adı yoldan
türetmek, ayrı bir eşleme tablosu tutmayı gereksiz kılar; eski kayıtlar da otomatik olarak tam
boya düşer.

**Referans kod:** `src/js/02-state-yardimci.js:494-514`
```js
/* THUMBNAIL: tam boy url'in yolundan _thumb türetip minik kopyayı indirir; yoksa (eski foto /
   uzantısız) TAM BOY'a düşer. YALNIZ liste/inceleme önizlemelerinde kullanılır — tıkla-büyüt ve
   PDF/yazdır HEP tam boy … → kalite kaybı yok. */
function _thumbBase(s){ return s.replace(/(\.[a-z0-9]+)$/i, '_thumb$1'); }
/* Yüklerken tam boyun yanına minik kopya at (best-effort — hata yüklemeyi KIRMAZ). */
async function uploadThumb(path, blob){
  const tb=await compressImage(blob, 240, 0.55);
  await _storage.ref(tp).put(tb, {contentType:'image/jpeg'});
  }catch(e){ /* thumb best-effort */ }
```

**Yeni projeye uyarlama:** Doğrudan taşınır. "Yoksa tam boya düş" davranışı, geçmiş veriyi göç
ettirmeden yeni sistemi devreye almanı sağlar — bu kalıbı başka yerlerde de kullan.

---

## Kalıcı genel indirme bağlantısı üretme

**Kural:** Depolama sağlayıcısının "herkese açık kalıcı bağlantı" üreten fonksiyonunu kullanma.
Veritabanında yalnız **yol** tut; dosyayı kullanıcının kimliğiyle indir.

**Neden:** Kalıcı token'lı bağlantı, ele geçiren herkese süresiz ve yetkisiz erişim verir; üstelik
bağlantıyı iptal etmenin tek yolu dosyayı taşımaktır.

**Referans kod:** `src/js/02-state-yardimci.js:516-521`
```js
/* TOKEN'SIZ indirme URL'i (token sızıntısı kapanışı, 2026-07-17): getDownloadURL her
   dosyaya KALICI public token bağlar — URL'i ele geçiren, yetkisiz de olsa süresiz erişir.
   Uygulama dosyayı zaten yetki+AppCheck REST ile çekiyor …; DB'deki URL yalnız PATH taşıyıcısı.
   … Eski token'lar gece bakımında topluca sökülür. */
function storagePlainUrl(path){ … return 'https://…/o/'+encodeURIComponent(path)+'?alt=media'; }
```

**Yeni projeye uyarlama:** İmzalı ve **kısa ömürlü** bağlantı üreten sağlayıcılarda (S3 presigned)
aynı amaç ömür sınırıyla sağlanır. Yasak olan, süresiz ve yetkisiz bağlantıdır. Eski verideki
token'ları sökecek bir toplu iş planla.

---

## Dosya, kullanıcı kimliğiyle indirilip geçici blob'a çevrilir

**Kural:** Görseli `<img src="uzak-url">` ile yükleme; kimlik jetonu (+ bot koruması jetonu) ile
indir, `blob:` URL üret ve onu göster. Tüm indirmeler tek bir boğazdan geçsin ki ölçüm de tek yerde olsun.

**Neden:** Böylece sunucu güvenlik kuralları gerçekten uygulanır, paylaşılabilir kalıcı bağlantı
doğmaz (sekme kapanınca ölür) ve indirme sayacı tek noktadan tutulur.

**Referans kod:** `src/js/02-state-yardimci.js:428-461`
```js
/* ── GÜVENLİ İNDİRME (getBlob) ─ Kalıcı token'lı public download URL'i sekmede açmak yerine
   dosyayı KULLANICI YETKİSİYLE indirir (Storage güvenlik kuralları uygulanır) ve geçici blob: URL
   üretir — paylaşılamaz, sekme kapanınca ölür, kalıcı public token doğmaz. … 
   Hata/CORS durumunda eski davranışa (doğrudan url) düşer, kırılmaz. */
async function _authDownloadBlobUrl(downloadBase){
  const idToken=await user.getIdToken();
  const headers={ Authorization:'Firebase '+idToken };
  const ac=await _appCheckToken(app); if(ac) headers['X-Firebase-AppCheck']=ac;
  const resp=await fetch(downloadBase+'?alt=media', {headers});
  const blob=await resp.blob();
  /* GERÇEK … indirme sayacı — tek boğaz noktası burası (belge + foto + thumb hepsi buradan geçer). */
  try{ bumpUsage(S.activeCompanyId, 'stDown', blob.size); }catch(e){}
  return URL.createObjectURL(blob);
}
```

**Yeni projeye uyarlama:** Doğrudan taşınır. Yan fayda: blob same-origin olduğu için tuval/PDF
üretiminde CORS kirlenmesi olmaz.

---

## İndirilen blob oturum boyunca önbelleklenir

**Kural:** Kaynak URL → blob URL eşlemesini bellekte tut; aynı görsel ikinci kez indirilmesin.
Küçük ve tam boy için ayrı anahtar kullan.

**Neden:** Aynı listeye üç kez girip çıkmak, önbelleksiz üç kat indirme demektir. Ölçümü de bozar
(mükerrer sayım).

**Referans kod:** `src/js/02-state-yardimci.js:434` ve `:501-505`
```js
const _blobUrlCache = new Map();   // orijinal url → blob: url (oturum-içi, tekrar indirme yok)
…
const key='t::'+url;
const cached=_blobUrlCache.get(key) || _blobUrlCache.get('pq::'+url); if(cached) return cached;
```

**Yeni projeye uyarlama:** Sekme ömrü boyunca yeterlidir; kalıcı önbellek istiyorsan Cache API ya
da IndexedDB kullan, ama o zaman geçersiz kılma (invalidation) kuralını da yaz.

---

## Görseller yer tutucu olarak doğar, gözlemci doldurur

**Kural:** Şablon üreticileri gerçek kaynağı bir `data-*` özniteliğine yazıp `src` olarak 1×1
saydam piksel koysun; belge gözlemcisi DOM'a giren her yer tutucuyu otomatik doldursun. Hiçbir
çizim fonksiyonu görsel doldurmayı elle kancalamasın.

**Neden:** Yüzlerce çizim noktasının her birinde `await` ile görsel beklemek hem kodu kirletir hem
de listeyi geciktirir. Gözlemci deseni, yeni ekranların bedava doğru çalışmasını sağlar.

**Referans kod:** `src/js/02-state-yardimci.js:619-633`
```js
function secureImg(url, attrs){        // TAM BOY (tıkla-büyüt kaynağı, PDF)
  return `<img data-securesrc="${safe(url||'')}" src="${_TRANSPARENT_PX}" ${attrs||''}/>`;
}
function secureThumbImg(url, attrs){   // MİNİK önizleme (liste/inceleme); yoksa tam boya düşer
  return `<img data-thumbsrc="${safe(url||'')}" src="${_TRANSPARENT_PX}" ${attrs||''}/>`;
}
```
`src/js/02-state-yardimci.js:659-665`
```js
/* DOM'a eklenen her secureImg placeholder'ını otomatik hidrate eder — her render'ı
   tek tek kancalamaya gerek yok. initApp'te bir kez kurulur. */
const SEL='img[data-securesrc],img[data-thumbsrc]';
document.querySelectorAll(SEL).forEach(_hydrateSecureImg);   // mevcutlar
const obs=new MutationObserver(…);
```

**Yeni projeye uyarlama:** Bileşen tabanlı projede bu bir `<SecureImage src=…>` bileşenidir; kural
aynı kalır — **kaynak URL asla doğrudan `src`'ye yazılmaz.**

---

## Yazdırma/PDF öncesi görseller bekleyerek hazırlanır

**Kural:** Görselleri tuvale çizen (PDF/yazdırma) her akış, sahneyi DOM'a **eklemeden önce** tüm
görselleri blob'a çevirip yüklenmelerini beklesin. Yer tutucu piksel "yüklendi" sayılmasın; her
görsel kendi hata koruması içinde olsun ve toplam bekleme tavanı bulunsun.

**Neden:** Gözlemci, yer tutucunun veri özniteliğini hemen siler ama blob'u sonra getirir. Sahne
araya girerse ne öznitelik ne blob vardır; 1×1 saydam piksel "yüklü" sayılır ve **soğuk önbellekte**
PDF fotoğrafları boş çıkar. Sıcak önbellekte fark edilmediği için bu hata aylarca gizlenebilir.

**Referans kod:** `src/js/02-state-yardimci.js:637-653`
```js
/* ⛔ GÖZLEMCİ YARIŞI ("PDF'de görseller gözükmüyor"). _hydrateSecureImg DOM'a giren placeholder'ın
   data-securesrc'sini HEMEN siler, blob'u SONRA getirir. … 1×1 saydam gif "yüklü" (naturalWidth=1)
   sayılıp beklemeden geçiliyordu; soğuk önbellekte (blob ~600 ms) PDF fotoğrafları boş çıktı. …
   İki koruma: (1) her görsel kendi try/catch'inde …; (2) saydam placeholder "henüz yüklenmedi"
   sayılır … (8 sn tavan). Çağıranlar sahneyi DOM'a eklemeden ÖNCE hazırlar. */
const bekliyor=el=>!(el.complete && el.naturalWidth) || el.getAttribute('src')===_TRANSPARENT_PX;
```

**Yeni projeye uyarlama:** Doğrudan taşınır. Genel ders: **görsel hazırlığını soğuk önbellekle
test et.** Sıcak önbellekte geçen her yarış hatası sahada patlar.

---

## Çevrimdışı yüklenen görsel, kuyruktan gösterilir

**Kural:** Çevrimdışı alınan dosyalar bir kuyrukta (IndexedDB) beklerken kayda bağlanıyorsa,
görüntüleyici uzak indirme başarısız olduğunda **kuyruğa baksın** ve oradaki veriden göstersin.

**Neden:** Saha kullanıcısı fotoğrafı çekiyor, kaydediyor, ekrana geri dönüyor ve boş kare
görüyordu: dosya henüz yüklenmediği için uzak indirme hata veriyordu — oysa veri cihazdaydı.

**Referans kod:** `src/js/02-state-yardimci.js:462-468`
```js
/* ⛔ SAHA: "çektiğim fotoğraflar yüklenmiyor, yükleyip çıktığımda tekrar girdiğimde gözükmüyor".
   KÖK: çevrimdışı çekilen foto IndexedDB KUYRUĞUNDA (blob) duruyor ve rapora URL'iyle bağlanıyor;
   ama görüntüleyici yalnız Storage'dan indirmeyi deniyordu … ÇÖZÜM: indirme başarısızsa KUYRUĞA BAK …
   Yükleme tamamlanınca kuyruk kaydı düşer ve sonraki açılışta Storage'dan gelir — tek kod yolu. */
```

**Yeni projeye uyarlama:** Çevrimdışı desteği olan her projeye doğrudan taşınır. Anahtar cümle:
**tek kod yolu** — "çevrimdışıysa başka ekran" yerine aynı görüntüleyici iki kaynağı dener.
