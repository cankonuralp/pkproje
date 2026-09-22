# 03 · PERFORMANS & GEÇ YÜKLEME

---

## Veri dal dal dinlenir, tek düğümden değil

**Kural:** Canlı veri aboneliğini kökten değil, dal başına kur; kaydetme de yalnız değişen dalı yazsın.

**Neden:** Tek düğüm dinleyicisi her küçük değişiklikte **tüm** veriyi yeniden indirir. Bu, kaynak
projede bir numaralı kota tüketicisiydi.

**Referans kod:** `src/js/03-firebase-tenant-sirketler.js:536-538`
```js
/* KOTA DOSTU: veri DAL DAL dinlenir. Eski tek-node dinleyicisi HER değişimde
   TÜM şirket verisini yeniden indiriyordu (kota yiyici #1) — artık hangi dal
   değişirse yalnız o dal iner. save() da yalnız değişen dalı yazar. */
```

**Yeni projeye uyarlama:** SQL tarafında karşılığı "tek büyük JOIN yerine ekranın gerçekten
kullandığı tabloları çek". Gerçek zamanlı bir kaynak kullanıyorsan abonelik granülerliğini ilk
günden dal bazlı kur — sonradan bölmek çok daha pahalı.

---

## Sınırsız büyüyen dal açılışta inmez

**Kural:** Zamanla sınırsız büyüyen veri (kayıt defteri, üretim/olay geçmişi, duruşlar) uygulama
açılışında yüklenmesin; yalnız onu gösteren ekran açıldığında çekilsin.

**Neden:** Açılış maliyeti kullanıcı sayısı değil **veri yaşı** ile büyür; altı ay sonra uygulama
"yavaşladı" diye şikâyet gelir ve nedeni bulunamaz.

**Referans kod:** `src/js/08-kilit-save-giris-hata.js:517-523`
```js
/* ══ TIER 2 (2026-08-14): logs + production BOOT'ta canlı-dinlenmez (lazy) ═══════════
   Sınırsız büyüyen bu 2 dal artık boot'ta İNMEZ. logs UI'da GÖSTERİLMEZ (yalnız yedek);
   production Makine analiz/detayda gösterilir → orada lazy çekilir. activity CANLI KALIR
   (300-cap küçük + her aksiyonda yazılıyor; get-append onu her aksiyonda indirtir = amacı bozar). */
```
Katman listesi — `src/js/03-firebase-tenant-sirketler.js:542-544` (`COMPANY_BRANCHES` sonundaki not:
"TIER 2 … 'logs'+'production' ÇIKTI. TIER 3 … 'stops' ÇIKTI → boot'ta inmez").

**Yeni projeye uyarlama:** Karar ölçütünü yaz: *bu dal kullanıcı sayısıyla mı, zamanla mı büyür?*
Zamanla büyüyen her şey geç yüklenir. Küçük ve üst sınırı olan veriyi (örn. son 300 hareket) geç
yüklemeye çevirmek **ters teper** — her işlemde yeniden indirtir.

---

## Geç yüklenen dalı, toplu kaydetme yazmaz

**Kural:** Bir dal geç yükleniyorsa, genel kaydetme yükünden **çıkar**; o dala yalnız kendi özel
güvenli yazıcısı dokunsun. Ayrıca "bu dal en az bir kez yüklendi mi" bayrağı tutulsun.

**Neden:** Bellekte boş duran bir dalı toplu kaydetme yazarsa sunucudaki gerçek veriyi **siler**.
Bu, geç yüklemenin en sık ve en pahalı yan etkisidir.

**Referans kod:** `src/js/08-kilit-save-giris-hata.js:521-523`
```js
/* ⛔ GÜVENLİ YAZMA: save() bu dalları ARTIK YAZMAZ (payload'dan çıkarıldı) → boş S ile ezme YOK.
   logs → appendLogSafe (get+başa-ekle+set, saveNotifSafe deseni); production → saveProductionSafe */
```
Bayrak — `src/js/03-firebase-tenant-sirketler.js:549`
```js
let _branchLoaded=new Set();   // dinleyicisi EN AZ BİR KEZ ateşlenmiş dallar — save() yüklenmemiş dalı YAZMAZ (boş state ile ezme fixi)
```

**Yeni projeye uyarlama:** Doğrudan taşınır ve **en kritik maddedir**. Kuralı teste bağla: geç
yüklenen dal adı, toplu yazma yükünde geçemez.

---

## Geç yükleme sırasında kiracı/şirket değişimi yarışı kapatılır

**Kural:** Ağ isteği uçuştayken aktif bağlam (şirket, kullanıcı, kayıt) değişebilir; `await`
dönüşünde bağlamı **yeniden doğrula**, değiştiyse gelen veriyi yazma ve "yüklendi" işaretleme.

**Neden:** A şirketinin verisi B şirketinin belleğine yazılırsa kiracı sızıntısı olur. Dahası, B
"yüklendi" işaretlenirse kendi verisini bir daha hiç çekmez.

**Referans kod:** `src/js/08-kilit-save-giris-hata.js:524-531`
```js
async function ensureBranchLoaded(name){
  if(… _branchLoaded.has(name)) return true;   // zaten yüklü
  if(!_ref || !_fbConnected) return false;     // offline: çekemeyiz (bağlanınca tekrar denenir)
  const _cid=S.activeCompanyId, _r=_ref;   // ŞİRKET-GEÇİŞ YARIŞI (inceleme): get() uçuştayken şirket değişebilir
  const snap=await _r.child(name).get();
  if(S.activeCompanyId!==_cid || _ref!==_r) return false;   // await sırasında şirket DEĞİŞTİ → A'nın verisini B'ye YAZMA …
```

**Yeni projeye uyarlama:** Her `await` sonrası bağlam doğrulaması genel bir kuraldır (React'te
`AbortController` / "stale closure" karşılığı). Kural cümlesi: **await'ten önce doğru olan, sonrasında
doğru olmak zorunda değildir.**

---

## Geç yüklenen veri de ölçüme girer

**Kural:** Açılıştan çıkarılan bir veri, sonradan indiğinde de kullanım sayacına yazılsın.

**Neden:** Aksi hâlde ölçüm "iyileşti" der ama gerçek maliyet aynı kalır; optimizasyon kendi
başarısını yanlış ölçer.

**Referans kod:** `src/js/08-kilit-save-giris-hata.js:532-533`
```js
/* lazy indirme de sayaca girsin — yoksa "boot'tan çıkardım" denen dal ölçümde GÖRÜNMEZ olur */
try{ bumpUsage(_cid, 'dbDown', new Blob([JSON.stringify(snap.exists()?snap.val():null)]).size); }catch(e){}
```

**Yeni projeye uyarlama:** Doğrudan taşınır. Sayaç anahtarlarını (indirme/yükleme/işlev çağrısı)
baştan ayır; sonradan ayırmak geçmiş veriyi karşılaştırılamaz yapar.

---

## Sayım ekranları özet sayaçtan beslenir

**Kural:** Kart/gösterge ekranları için ham veriyi indirme; kayıt sırasında güncellenen küçük bir
özet düğümü tut ve panolar onu okusun. Özette **değişmeyen alan** (zaman damgası gibi) tutma.

**Neden:** Yönetim panosu bütün kiracıların verisini indirmek zorunda kalırsa maliyet kiracı
sayısıyla çarpılır. Özete zaman damgası konursa, veri değişmese bile her kaydetmede yazma tetiklenir.

**Referans kod:** `src/js/02-state-yardimci.js:1128-1131`
```js
/* Bu şirketin özet sayaçları (_stats) — süper admin/üye paneli kartları TÜM şirket
   verisini indirmek yerine bu yarım KB'lık özeti okur. Her kayıtta güncel yazılır;
   gece bakımı da sunucuda tazeler. 'at' alanı BİLEREK yok: değişmeyen veride
   save() fark görmesin, boşuna yazmasın. */
```

**Yeni projeye uyarlama:** İstemcinin yazdığı özet **tahmindir**; gerçeği periyodik olarak sunucu
tazelemeli (kaynak projede gece bakımı yapıyor). İki kaynak çeliştiğinde sunucu kazanır.

---

## Liste hafif indeksten, detay tıklanınca

**Kural:** Ağır kayıtların listesi için yalnız birkaç alanlık bir indeks tut; tam gövde
(form cevapları, fotoğraflar, ekler) ancak detay/PDF/dışa aktarım açıldığında insin. Yerel
silmeler indeksin bayat kopyasına karşı kısa ömürlü bir "mezar taşı" süzgeciyle korunsun.

**Neden:** Liste ekranı, defterin tamamını indirmek zorunda kalırsa ekran açılışı veri yaşıyla
büyür. Sunucu indeksi gecikmeli tazeliyorsa, az önce silinen kayıt listeye geri gelir ve
tıklandığında "açılamadı" hatası verir.

**Referans kod:** `src/js/08-kilit-say…` → `src/js/08-kilit-save-giris-hata.js:479-483`
```js
/* ÖZET KAYNAĞI: sayım/kırılım/liste ekranları için rapor kümesi — hafif indeks + CANLI
   yarımlar + bu cihazın yazdıkları. … tam defter (formAnswers/foto/tüp) İNMEZ.
   Yalnız indekste bulunan ~11 alanı kullanan yerler bunu çağırmalı; gövde gereken yerler
   (PDF/CSV/detay) ensureReportsLoaded ile tam deftere gider. */
```
Mezar taşı — `src/js/08-kilit-save-giris-hata.js:493-500`
```js
/* ── MEZAR TAŞI … Silme yerelde anında düşürülüyordu AMA … bayat indeksle listeye GERİ geliyordu
   → tıkla → "Rapor açılamadı". … TTL bilerek KISA (90sn) … Restore + şirket değişimi süzgeci sıfırlar. */
const RPT_TOMB_MS=90000;
```

**Yeni projeye uyarlama:** İndeksin hangi alanları taşıdığını **tek yerde** yaz ve listeyi çizen
kodun o alanların dışına çıkmadığını testle kilitle. Yoksa listeye eklenen yeni bir sütun, sessizce
tam defteri indirtmeye başlar.
