# 05 · VERİ GÜVENLİĞİ — kayıp önleme, birleştirme, yedek, geri yükleme

Bu dosyanın tek cümlelik özeti: **"son yazan kazanır" bir veri kaybı tasarımıdır.**
Aşağıdaki kurallar onu adım adım söker.

---

## Toplu kaydetme, açık bir beyaz listeyle yazar

**Kural:** "Bellekteki her şeyi yaz" deme. Yazılacak dallar tek tek sayılsın, yalnız **değişenler**
gönderilsin ve listeden çıkarılan her dalın **neden** çıkarıldığı aynı yerde yazsın.

**Neden:** Kapalı (implicit) yazım, bellekte eksik/bayat duran her dalı sunucudaki gerçeğin üstüne
yazar. Ayrıca tam yazım tüm dinleyicilere tüm veriyi yeniden indirtir.

**Referans kod:** `src/js/07-global-paneller.js:310-330`
```js
// Veriyi Firebase'e kaydet — KOTA DOSTU: yalnız DEĞİŞEN dallar yazılır.
// (Eski tam-yazım her kayıtta TÜM veriyi gönderiyor, tüm açık dinleyicilere TÜM veriyi yeniden indirtiyordu)
async function save(){
  if(companyFrozen()){ toast('🔒 Bu şirket donduruldu — değişiklik kaydedilemez.', 5000); return false; }
  const payload={
    /* users: ÇIKARILDI (2026-09-14) — kullanıcı LİSTESİ save() ile yazılmaz. Tam liste yazımı bayat diziyle
       sunucunun eklediği/sildiği kullanıcıyı eziyor … Her değişiklik kendi yolundan: userPatchSafe … */
    mahals:   S.mahals,
    // reports: ÇIKARILDI (2026-08-09) — anahtarlı-map: raporlar artık … TEK-ÇOCUK yazılır
    // logs: ÇIKARILDI (TIER 2) — lazy; … save() boş S.logs ile ezmesin.
    /* notifications ÇIKARILDI: tam-dizi yazımı eşzamanlı bildirimi eziyor / silinmişi diriltip
       mükerrer push'a yol açıyordu → tek yol notifMutateSafe transaction'ı */
```

**Yeni projeye uyarlama:** Doğrudan taşınır. Çıkarılan dalların gerekçesini **silme** — bir sonraki
geliştirici "eksik kalmış" diye geri ekler ve hata geri gelir.

---

## Yetkisi olmayan kullanıcının yükünden o dal silinir

**Kural:** Sunucu kuralları zaten koruyor olsa bile, istemci de yetkisiz dalı yükten çıkarsın.

**Neden:** Atomik güncellemede **tek** yetkisiz dal, tüm kaydı reddettirir. Kullanıcı hiç
dokunmadığı bir alan yüzünden "kaydedilemedi" hatası alır; veri kaybı yaşanmasa da iş durur.

**Referans kod:** `src/js/07-global-paneller.js:356-360` ve `:366-372`
```js
// RBAC: yetki/config dalları yalnız yetkilinin save()'ine girsin.
// Sunucu .validate zaten zorlar (yetki-yükseltme kapalı); bu istemci süzgeci, yetkisiz kullanıcının
// yükleme yarışında bu dalları (değişmese bile) atomik update()'e katıp TÜM kaydı düşürmesini önler.
if(!isSuperAdmin()){ delete payload.quotaLimits; delete payload.retention; }
if(!canManageRoles()){ delete payload.customRoles; }
…
if(!(lvl>=2||canDo('manage_workorders'))) delete payload.workOrders;
```

**Yeni projeye uyarlama:** Doğrudan taşınır. Kural: **istemci süzgeci güvenlik değil kullanılabilirlik
içindir**; güvenlik her zaman sunucudadır (bkz. `07-YETKI-VE-COKLU-KIRACI.md`).

---

## Tek satır değişikliği transaction ile yamalanır

**Kural:** Bir listedeki tek kaydın birkaç alanı değişiyorsa listenin tamamını yazma. Sunucunun
**güncel** hâlinde kaydı kimliğiyle bul, yalnız verilen alanları yaz. Kayıt sunucuda yoksa işlemi
iptal et.

**Neden:** Aynı gece iki cihaz işlem yaptığında tam liste yazımı "son yazan kazanır" davranır ve
diğerinin güncellemesi kaybolur. İptal koşulu olmazsa, başka bir cihazın **sildiği** kayıt geri
dirilir.

**Referans kod:** `src/js/08-kilit-save-giris-hata.js:344-378`
```js
/* ══ EKİPMAN GÜVENLİ YAMA (saha: "15.08'de denetlendi, 14.08 görünüyor") ══
   … aynı gece iki cihaz denetim yaparken son-yazan-kazanır, diğer cihazın güncellemesini EZİYORDU …
   transaction ile sunucunun GÜNCEL dizisinde ekipmanı id ile bulur, YALNIZ verilen alanları yamalar…
   patch'te null değer alanı SİLER … Ekipman sunucu dizisinde yoksa ABORT */
async function _rowPatchSafe(branch, rowId, patch){
  _ref.child(branch).transaction(cur=>{
    if(!cur) return;   // dal boş → abort
    for(const k of Object.keys(cur)){
      const it=cur[k];
      if(it && it.id===rowId){ Object.keys(patch).forEach(p=>{ it[p]=patch[p]; }); return cur; }
    }
    return;   // kayıt sunucuda yok → abort (diziyi EZME; silinmiş kaydı DİRİLTME)
  })
```

**Yeni projeye uyarlama:** SQL'de karşılığı `UPDATE … SET <alanlar> WHERE id=…` (tüm satırı
yeniden yazan ORM `save()` çağrısı değil) ve "0 satır etkilendi → hata" kontrolü. Belge
veritabanlarında alan bazlı `$set`. Kuralın özü: **yazma kapsamı, değişikliğin kapsamı kadar olur.**

---

## Aynı kalıbın dört ayrı yazıcısı olur, tek "her şeyi yaz" olmaz

**Kural:** Eşzamanlı yazılan her dal için kendi güvenli yazıcısını yap: tek kayıt yaması, tek
çocuk ekleme, saf dönüştürücüyle transaction, ekle-başa-al. Genel kaydetme bunlara dokunmaz.

**Neden:** Tek bir genel yazıcı, her dalın farklı eşzamanlılık ihtiyacını karşılayamaz. Bildirimler
mükerrer push, raporlar silinmiş kaydın dirilişi, kullanıcılar oturum alanlarının sızması gibi
farklı arızalar üretir.

**Referans kod:** `src/js/08-kilit-save-giris-hata.js` — aynı dosyadaki yazıcı ailesi
```js
async function _rowPatchSafe(branch, rowId, patch){ … }        // :352
async function equipPatchSafe(equipId, patch){ … }             // :380
async function userPatchSafe(userId, patch){ … }               // :385  (tek kayıt users/{anahtar}; cihaz alanları ayıklanır)
async function saveReportSafe(…){ … }                          // :559
async function notifMutateSafe(mutator){ … }                   // :648  (saf dönüştürücü + transaction)
async function saveWorkOrderSafe(…){ … }                       // :690
```
`userPatchSafe` başlığı (`:386-390`):
```js
/* ⛔⛔ LİSTE değil TEK KAYIT yazılır — users/{anahtar}. … transaction kayıt bu arada kaydıysa/silindiyse
   İPTAL eder (başkasının kaydına yazmaz, silinmişi diriltmez). null alanı siler. */
```

**Yeni projeye uyarlama:** Yazıcı ailesini **tek dosyada** topla ve adlandırma kalıbını sabitle
(`…Safe`). Yeni bir dal eklendiğinde "bunun güvenli yazıcısı hangisi?" sorusu refleks olsun.

---

## Şekil göçü bir kez, transaction ile ve idempotent yapılır

**Kural:** Veri şeklini değiştiren göç (dizi → anahtarlı harita gibi) sıcak yolda değil, bir kerelik
ve iptal edilebilir bir transaction ile yapılsın: boşsa iptal, zaten yeni şekildeyse iptal.

**Neden:** Göçü ilk yazan kullanıcıya ödetirsen, o kullanıcı tüm defteri yeniden yazar ve tüm
cihazlara yeniden indirtir. İptal koşulu olmazsa göç her açılışta gereksiz yazma üretir.

**Referans kod:** `src/js/08-kilit-save-giris-hata.js:328-341`
```js
/* BİR KERELİK PROAKTİF GÖÇ: reports dalı hâlâ DİZİ şekilliyse anahtarlı map'e çevir —
   collab sıcak yolu böylece oturum-içi göç transaction'ı … ÖDEMESİN. Zaten map/boşsa ABORT
   (gereksiz yazma yok); idempotent. Fire-and-forget, sahayı bloklamaz. */
await _ref.child('reports').transaction(cur=>{
  if(!cur) return;                       // boş dal → abort
  const arrayish = Array.isArray(cur) || Object.keys(cur).some(k=>/^\d+$/.test(k));
  if(!arrayish) return;                  // zaten anahtarlı map → abort (no-op)
  return reportsToMap(cur);
});
```

**Yeni projeye uyarlama:** Şemalı veritabanlarında bu iş göç dosyasıdır; yine de "iki kez koşarsa
ne olur" sorusunu her göç için cevapla. Kural: **her göç idempotent olmalıdır.**

---

## Yedek katmanlı ve artımlıdır

**Kural:** Yedeği tek bir günlük kopyaya bırakma: saatlik (kısa geçmiş) + günlük (uzun geçmiş) +
"en son" kopyası tut. Saatlik turda yalnız **değişmiş** kiracıları oku, kalanını bir önceki
kopyadan devral. Nadir değişen büyük dalları günlük tam tura bırak.

**Neden:** Her saat tam yedek, veritabanı okuma maliyetinin en büyük kalemine dönüşür. Ama günde
bir yedek de "bugün girilen her şey" riski demektir.

**Referans kod:** `functions/index.js:2398-2410`
```js
/* PER_CID  : şirket anahtarlı → yalnız _touch DAMGALI şirketler okunur (data + hr + sec).
   GLOBALS  : küçük ve/veya taze kalması şart olanlar → her saat okunur.
   DAILY    : büyük ve saatlik tazeliği gerekmeyenler (log/çöp/evrak ağacı) → gece 03:00 TAM çapada …
   ⛔ DAILY dallara "okunmadıysa SİL" kolu UYGULANMAZ — bir turda boş görünen dal yedekten uçardı. */
const PER_CID_BRANCHES = ['data', 'hr', 'sec', 'dep'];
exports.r2BackupRtdb = onSchedule({ schedule: '0 * * * *', timeZone: 'Europe/Istanbul', … }, async () => {
```
Artımlılığın anahtarı, kiracı başına değişiklik damgası (`_touch`) ve son tur zamanıdır (`:2423-2425`):
```js
const lastTs = Number((await db().ref(`${TENANT_ROOT}/backups/_r2HourlyTs`).once('value')).val()) || 0;
const changed = Object.entries(touch).filter(([, ts]) => Number(ts) > lastTs - 300000).map(([cid]) => cid);   // 5dk pay
```

**Yeni projeye uyarlama:** Yönetilen yedeği olan bir veritabanı kullanıyorsan (RDS snapshot vb.) bu
iş sağlayıcıdadır; yine de **uygulama seviyesinde** dışa aktarım tut — sağlayıcı yedeği yanlış
yazılmış veriyi de sadakatle saklar. "5 dakika pay" gibi saat kayması payını unutma.

---

## Otomatik yedek, ilk girişte tetiklenir ve gün işaretiyle korunur

**Kural:** Günlük yedek yalnız zamanlayıcıya bağlı kalmasın; o gün ilk giren kullanıcı, yedek
alınmamışsa tetiklesin. Tekrarı, gün anahtarı tutan bir işaretle engelle.

**Neden:** Zamanlayıcı başarısız olduğunda tek uyarı "yedek yok"tur ve bunu ancak felakette
öğrenirsin. İlk giriş tetikleyicisi ikinci bir ağ örer.

**Referans kod:** `src/js/06-yedekleme-cop-kutusu.js:230-239`
```js
async function autoBackupIfNeeded(){
  const todayKey=trBackupDayKey();
  const metaSnap=await _db.ref(`${TENANT_ROOT}/backups/_lastAutoDay`).once('value');
  if(lastDay===todayKey) return; // bugünün yedeği zaten alınmış (gece bakımı genelde almıştır)
  await backupSystem(); // sunucu Storage'a yazar + gün işaretini kendisi koyar
}
/* Şirket bazlı günlük otomatik yedek — HERHANGİ bir kullanıcı o gün ilk girince alınır.
   (Süper admin girmese bile şirket verisi her gün yedeklenir.) */
```

**Yeni projeye uyarlama:** Gün anahtarını **kullanıcının değil sistemin** saat diliminde hesapla
(kaynak projede sabit bölge kullanılıyor), yoksa gezen kullanıcı günde iki yedek tetikler.

---

## Yedek listesi indeksten okunur, yedeğin kendisi indirilmez

**Kural:** "Hangi yedekler var" ekranı, yedek içeriklerini değil küçük bir indeks düğümünü okusun;
seçilen yedeğin **yalnız ilgili kiracıya ait** parçası sunucudan istensin.

**Neden:** Yedek dosyaları megabaytlarca; liste ekranı için indirmek hem yavaş hem pahalıdır ve
kiracı izolasyonunu da zorlar.

**Referans kod:** `src/js/06-yedekleme-cop-kutusu.js:25-42`
```js
/* Bir şirketin SEÇİLEBİLİR yedek listesi (tarih indeksinden — koca yedekler İNMEZ). */
async function loadBackupChoices(cid){ … _db.ref(`${TENANT_ROOT}/backups/companyIndex/${cid}`) … }
/* Seçilen yedeğin İÇİNDEN yalnız bu şirketin verisini indir (sunucu Storage'dan diler) */
async function getBackupDataBySel(cid, sel){ … }
```

**Yeni projeye uyarlama:** Doğrudan taşınır. İndeks kaydında en az: anahtar, insan okunur tarih,
sıralanabilir zaman damgası, boyut.

---

## Geri yükleme veri kaybettirmez: önce öksüzleri yakala, sonra kimlik birleşimi uygula

**Kural:** Geri yükleme, yedek **sonrası** eklenen kayıtları yok etmemeli. Üç koruma birlikte
uygulanır: (1) yazmadan önce yedekte olmayan mevcut kayıtları çöp/kurtarma alanına taşı, bu adım
başarısız olursa geri yüklemeyi **durdur**; (2) kurtarma alanı olmayan dallarda kimlik birleşimi
yap (yedekteki hâl döner, fazlalıklar korunur); (3) dalın veri **şeklini** değiştirme.

**Neden:** Üçü de canlıda yaşandı: sessiz kalıcı silme, makinesi silindiği için görünmez kalan
kayıtlar, yeniden numaralanan anahtarlar yüzünden sunucunun okuyamadığı dallar.

**Referans kod:** `src/js/06-yedekleme-cop-kutusu.js:160-175`
```js
// FAZ 2a: set()'ten ÖNCE, restore'un sileceği (yedekte olmayan) mevcut kayıtları çöpe al.
// Başarısız olursa geri yüklemeyi DURDUR — mevcut veri olduğu gibi kalsın (sessiz kayıp yok).
try{ orphans=await captureRestoreOrphans(cid, bData); }
catch(e){ … toast('❌ Güvenlik için geri yükleme durduruldu …'); return; }
/* ⛔ DENETİM: birlik yalnız üç dala uygulanıyordu. machines / stops / takvimNotes / customCats / users
   yedek SONRASI eklenmişse set() onları KALICI siliyordu … yeni açılan kullanıcı bir daha giriş yapamıyordu.
   ⛔ ŞEKİL KORUNUR: dal anahtarlı (obje) tutuluyorsa diziye ÇEVRİLMEZ — çevirmek anahtarları yeniden
   numaralandırır ve sunucunun anahtarla okuduğu yerleri kırar. */
for(const k of ['workOrders','production','faults','machines','stops','takvimNotes','customCats','users']){
```
Onay metni de vaadi birebir yazar (`:150-155`): *"Yedek SONRASI eklenen kayıtlar SİLİNMEZ…"*

**Yeni projeye uyarlama:** Doğrudan taşınır. Ek olarak: geri yükleme onayında **ne olacağını**
madde madde yaz; "geri yüklenecek" demek yeterli değil, kullanıcı neyin kaybolmayacağını bilmeli.
