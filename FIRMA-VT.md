# FİRMA-VT — her firmaya ayrı veritabanı (sunum 579, onaylı 2026-10-15)

> Reisim: *"supabase ve resend bağlantılarını firma açarken biz buradan panelden yapalım daha sonra müşteri uğraşmasın …
> resend ve supabase ayarları firma ayarları kısmından değiştirilemesin"*. Sunum 579 onaylandı (2026-10-15 15:44 UTC); kararlar pkproje.md §9
> (yetmiş birinci tur): K1 ikisi · K2 firmanın alan adı, Kimden = tuşa basan kişi · K3 yanıt adresi + gizli kopya firmada · K4 yapay zekâ anahtarı
> isteğe bağlı · K5 deneme firması ortak projede · K6 probata.com.tr.
>
> Bu dosya tasarımın kendisidir (iki bağımsız tasarım + hakem birleşimi, kaynak kodla doğrulandı). Ölçüm 2026-10-15: ortak projede göçler
> `postgres` rolüyle uygulanmış (current_user = session_user = postgres, firma tablosunun sahibi postgres, BYPASSRLS) → §2 A2 kesin: göç
> yürütücüsünün birincil yolu Management API. Kalem durumu §6 tablosunda; her kalem yapıldıkça pkproje.md §11'e işlenir.

## 1 · İki tasarımın karşılaştırması

| Ölçüt | A (en az değişiklik) | B (temiz ayrım) | Seçim |
|---|---|---|---|
| Merkez nerede | Bugünkü ortak proje, tek göç zinciri | Ayrı `probata-merkez` projesi, ikinci zincir; 0097 merkez tablolarını firma zincirinden siler | **A.** B'de yönetici ve yönetim izi aktarımı, geri alınamaz DROP, 15+ test dosyası ve ek 10 $/ay var; şimdi kazancı yok. `havuz()` adı korunduğu için ayrı merkez sonra da mümkün. |
| Yanlış yönlendirme kilidi | Veritabanında `vt_firma_dogrula`, `set_config` ile aynı sorguda | Havuz etiketi (WeakMap) + `vt_dogrula`; yayında etiketsiz havuz reddedilir | **A'nın veritabanı kilidi** + B'nin firma tablosu tetiği. Etiket karmaşa katıyor, veritabanı kilidi zaten yetiyor. |
| Göç yürütücüsü | Oturum kipinde pg bağlantısı; her koşuda kullan-at sahip parolası (PATCH) | Management API `database/query`, tek çağrı, `SET LOCAL ROLE postgres` | **B.** Bu yol canlıda fiilen kullanılıyor (aşağıda düzeltme A2). |
| Göç dağıtımı nerede | Vercel derleme adımı, `denetle` → `uygula` | GitHub Actions `yayin` işi + Vercel yayın kancası | **A.** Sır tek yerde (Vercel) kalır, herkese açık depoya ortam sırrı girmez. |
| Gece işi | İsteğe bağlı `havuzBul`; ölçek sonra | Firma başına birleşik adım, adalet sırası, saatlik | **Önce A, sonra B** (ayrı kalem, eşikle). |
| E-posta | Merkezde asıl kayıt + firmada kilitli kopya; alana kısıtlı anahtar | Merkezde asıl; kilitli genel gönderen `bildirim@alan`; `eu-west-1` | **İkisinin birleşimi** (§5.8). |
| Test bedeli | 134 test dosyasından 133'ü değişmez (sayılar doğru ölçülmüş) | 15 dosya değişir, 14 yeni kilit | **A.** |

---

## 2 · Kaynak kodla doğrulanan düzeltmeler

### A'daki hatalar

1. **`firma_bul` çelişkisi.** A, `firma_bul`'a `vt='ortak'` koşulu ekleyip "firma veritabanında kendi satırını bulur" diyor. Ama firma veritabanındaki satır `vt='kendi'` olacak, yani bulunmaz.
   - Doğrusu: `AND (vt='ortak' OR id = (SELECT firma_id FROM vt_kimlik))`.
   - `firma_bul`'u artık yalnız testler ve `firmaKimligi` kullanıyor.
2. **"Management API'nin rolü belirsiz" yanlış.** `pkproje.md` §11 293'te şu yazıyor: *"Claude'a bağlı Supabase eklentisi BYPASSRLS'li `postgres` rolüyle"*. Bugünkü 95 göçün hepsi o eklentiyle, yani Management API'nin sorgu ucuyla uygulandı; 0008'in kendi doğrulaması da orada geçti.
   - Bu yüzden birincil yol Management API olmalı.
   - "Her koşuda sahip parolasını PATCH ile değiştir" fikri bırakılmalı. Eşzamanlı derlemeler yarışır, havuzcunun parola önbelleği bilinmiyor, gereksiz bir parça.
   - Kesin teyit için tek sorgu yeter, yeni hesap gerekmez: `SELECT current_user, session_user` ve `SELECT tableowner FROM pg_tables WHERE tablename='firma'`. Eklentiyle ortak projede, salt okunur koşulur.
3. **Faz B'deki "oturum düzeyinde `pg_advisory_lock`".** İşlem kipi havuzcuda ve HTTP API'de oturum tutulamaz. Kilit merkezde `is_basla('goc_dagitim')` ile alınmalı.
4. **`PROBATA_VT_YEREL_IZIN=1` bayrağı.** Yayında yanlışlıkla açık kalabilir. B'nin kuralı daha iyi: firmanın sunucusu 127.0.0.1 olabilir yalnız merkez de yerel ise. Yeni bayrak gerekmez.
5. **`vt_firma_dogrula` ortakta "satır yoksa hata" diyor.** Bu, olmayan firma kimliğiyle çağıran testleri bozabilir; aramada bulamadım ama dışlayamam.
   - Ortakta yalnız `vt='kendi'` olan satır reddedilsin.
   - Olmayan kimlikte RLS boş döner, 71 yabancı anahtar da yazmayı engeller; bugünkü davranış aynen kalır.
6. **`havuz-kapsami` izin listesi eksik.** `src/server/dosya/depo.ts` `vtDepo(havuz)` ile çağrısız başvuru yapıyor; `havuz()` aramasında görünmüyor. `src/server/yonetim/eylemler.ts` de listede yok. Kilit, çağrıyı değil `db/havuz` içe aktarmasını denetlemeli.
7. **`yonetim_firmalar()`'a sütun eklemek** dönüş tipini değiştirir. `CREATE OR REPLACE` bunu yapamaz; önce `DROP FUNCTION IF EXISTS`, sonra yeniden `GRANT`.
8. **Vercel derlemesi fra1'de koşmuyor** (varsayılan derleme bölgesi). Göç metni ve sağlık sayıları kişisel veri taşımadığı için sorun değil; not düşülmeli.

### B'deki hatalar

1. `vercel.json "main": false` yazıyor; gerçek anahtar `git.deploymentEnabled.main`.
2. `INSERT INTO vt_kimlik … ON CONFLICT DO NOTHING` hatalı. 0095 her veritabanına `'ortak'` satırını tohumlar; yeni projede INSERT çakışır ve satır `'ortak'` kalır. Doğrusu `UPDATE vt_kimlik SET tur='firma', firma_id=$1 WHERE tur='ortak'`.
3. `vt_kimlik.firma_id`'ye yabancı anahtar konursa kurulum sırası kırılır, çünkü kimlik firma satırından önce yazılır. Yabancı anahtar olmamalı.
4. "102 test dosyası değişmez" ile merkez tablolarını firma zincirinden silmek çelişiyor. `yonetim`, `duyuru`, `hata`, `gece-cop`, `saglik` testleri ve yönetim e2e'leri aynı veritabanına dayanıyor.

### İkisinin de kaçırdıkları

1. **Statik RLS kilidi.** `tests/yardimci/denetimler.ts` içindeki `rlsEksikTablolar`, `firma_id` taşıyan her yeni tabloda üç ifadeyi DÜZ METİN olarak arar: `ALTER TABLE x ENABLE …`, `ALTER TABLE x FORCE …` ve `CREATE POLICY w ON x`.
   - Etkilenen tablolar: `vt_kimlik`, `firma_vt`, `firma_kurulum`, `eposta_alan`, `firma_gonderim`.
   - `format()` döngüsüyle yazılırsa kilit düşer.
   - Sağlıktaki `politikasiz` denetimi de bu tablolara politika ister.
2. **Ham yazma kilidi.** `hamYazma` kuralı yüzünden `src/modules/yonetim/server/kurulum.ts` INSERT/UPDATE içeremez. Merkez yazımı SQL işlevleriyle ya da `src/server/yonetim/` çekirdek yardımcılarıyla yapılmalı.
   - `.query(` yalnız `src/server/db` içinde geçebilir.
   - Management API istemcisi (`fetch`) bu kurala takılmaz.
3. **Rapor kodu tekliği** bugün yalnız açılışta denetleniyor. 0001'de `rapor_kodu` UNIQUE değil; `firmaKoduYaz` firmalar arası denetim yapmıyor. Gerileme yok, açık soru olarak kalır.
4. **Resend uç adresi.** PAT ve Resend ana anahtarını taşıyan istemcilerde uç adresi değiştirme (`PROBATA_SUPABASE_YONETIM_UC`) yalnız yerel adreste kabul edilmeli. Bugünkü `PROBATA_EPOSTA_UC`'de böyle bir sınır yok.

### Haritalardaki küçük yanlışlar
- `havuz.ts:148-171` yanlış; doğrusu 48–54.
- `havuzKur` 38. değil 92. satırda.
- İmzalı adres 900 sn (`dosya.ts IMZA_SURESI`). CLAUDE.md'deki "5 dk" yazısı eski.

---

## 3 · Karar özeti

1. **Merkez = ortak proje**, tek göç zinciri. Firma veritabanı aynı zinciri taşır; merkez tabloları orada boş durur.
2. **`firma` tablosu kayıt olarak kalır.** Yeni `firma.vt` sütunu `'ortak'|'kendi'` alır. Kendi projeli firmanın bağlantısı merkezde `firma_vt` satırında, şifreli durur.
   - `yonetim_izi.hedef_firma` yabancı anahtarı, kısa ad tekliği ve 0050'deki LOCK aynen çalışır.
3. **Yanlış yönlendirme üç kilitle durdurulur:**
   1. Çözüm yalnız Host başlığından yapılır.
   2. Veritabanı kimliği (`vt_firma_dogrula`) her `kiraciIcinde`'de, ek gidiş-dönüş olmadan denetlenir.
   3. RLS ve 71 yabancı anahtar aynen kalır; firma veritabanında `firma` tablosuna konan tetik başka firma satırı eklenmesini engeller.
4. **Tek boğaz:** `istekKiracisi` → `firmaCoz` (önbellekli) → `kiraciHavuzu(kiraci)`. Modüller, `depo()`'nun 60 çağrısı ve `kiraciIcinde` imzası değişmez.
5. **Göç:** `GocYurutucu` soyutlanır.
   - Birincil yol Management API: tek çağrıda `BEGIN; SET LOCAL ROLE postgres; <göç>; INSERT INTO goc…; COMMIT`.
   - Yedek yol `pg.Client`.
   - Dağıtım Vercel derleme adımında; varsayılan `denetle`, ölçümden sonra `uygula`.
6. **Yönetim işleri:**
   - Ortak firma: 0050 işlevleri aynen, atomik.
   - Kendi projeli firma: önce firma tarafı işlev (uygulama bağlantısı + `SET LOCAL ROLE probata_yonetim`), sonra merkez izi.
   - PAT yalnız kurulumda ve göçte kullanılır.
7. **E-posta:**
   - probata'nın tek Resend hesabı; alan adı `eu-west-1` bölgesinde.
   - Firmaya o alana kısıtlı `sending_access` anahtarı.
   - Kilitli genel gönderen `<genel_yerel>@<alan>`; Rapor e-postası yalnız yanıt adresi olur.

---

## 4 · Veri yerleşimi

| Tablo / işlev | Yer | Not |
|---|---|---|
| `firma` | ikisi | Merkezde her firma için satır: ortak firmada bütün veri, kendi projelide yalnız kayıt (`ilk_hesap` NULL). Firma veritabanında aynı UUID'li tek satır; `durum` kopyası ikinci dondurma kilididir. |
| `vt_kimlik` (yeni, tek satır) | ikisi | Ortakta `'ortak'`, firma veritabanında `'firma'` + firma_id. Uygulama rolüne hak verilmez. |
| `firma_vt` (yeni) | merkez | ref, havuzcu sunucusu, kapı, şifreli uygulama parolası, şifreli Storage gizli anahtarı, kova, `surum`, kurulum durumu, son göç, son sağlık, `goc_disi`. Politika yalnız `probata_yonetim`. |
| `firma_kurulum` (yeni) | merkez | Adım, durum, kira (`kira_bitis`), deneme sayısı, maskeli hata, şifreli geçici girdi (`db_pass`, yapay zekâ anahtarı). "tamam" olunca girdi boşaltılır. |
| `eposta_alan` (yeni) | merkez | Alan, `resend_id`, bölge, durum, DNS kayıtları, `genel_yerel`, anahtar kimliği. Asıl kaynak burası. |
| `firma_gonderim` (yeni) | firma | Alan, genel gönderen ve durumun kilitli kopyası. Uygulama rolü yalnız okur; yazan yalnız `firma_yonetim_gonderim`. |
| `yonetici`, `yonetim_oturum`, `yonetim_kilit`, `yonetim_ayar`, `yonetim_izi` | merkez | Değişmez; firma veritabanında boş durur. |
| `hata_kaydi`, `duyuru`, `duyuru_durumu`, `is_calisma` | merkez | Değişmez. Ana sayfa duyuruyu merkezden okur. |
| `goc` | ikisi | Her veritabanının kendi kaydı; merkezde ayrıca `firma_vt.son_goc / goc_sayisi`. |
| Kiracı tabloları (hesap, oturum, musteri_*, plan, rapor, denetim_izi, firma_sir, firma_ayar, eposta kuyruğu, islem, yz_*, depo_nesne …) | firma | Ortak firmalarınki ortakta (K5). Kendi projelide `depo_nesne` boş kalır. |
| RLS, `gecerli_firma()`, roller, 0000/0008/0009/0010 | ikisi | Göçle kurulur, aynen kalır. |
| `firma_sir 'yapay_zeka_anahtari'`, `'eposta_anahtari'` | firma | Ek doğrulama verisi (AAD) firma kimliğine bağlı; iki tarafta aynı UUID olduğu için çözülür. Yönetim yalnız firma tarafı işlevle yazar. |
| PAT, Resend ana anahtarı, `PROBATA_SIR_ANAHTARI`, `CRON_SECRET` | Vercel ortamı | Veritabanında durmaz. |

---

## 5 · Konu konu kararlar

### 5.1 Yönlendirme

- **`src/server/db/merkez.ts` (yeni):**
  - `firmaCoz(h, kisaAd)` → `SELECT firma_coz($1)`.
  - `firmaCozId(h, id)`.
  - `merkezOku(h, is)`: kiracısız okuma, duyuru için.
- **`firma_coz(text) → jsonb`** (SECURITY DEFINER; `GRANT EXECUTE … TO probata_uygulama`):
  - Ortak firma: `{id, vt:'ortak'}`.
  - Kendi projeli firma: `{id, vt:'kendi', ref, sunucu, kapi, vt_ad, kullanici, parola(şifreli), depo_url, depo_gizli(şifreli), kova, surum}`.
  - Yalnız `durum='etkin'` olan firmalar, ve kendi projelide yalnız `kurulum='tamam'` ve `goc_disi=false` iken.
- **`src/server/kiraci/kayit-onbellek.ts` (saf):** olumlu sonuç `PROBATA_KAYIT_ONBELLEK_SN` (5–60, varsayılan 15) saniye, olumsuz sonuç 5 sn, en çok 2 000 kayıt (LRU). Yönetim işlemi aynı örnekteki önbelleği hemen boşaltır.
- **`src/server/kiraci/istek.ts`:** `IstekKiracisi { firmaId; kisaAd; vt?: FirmaVtKaydi }`. `vt` isteğe bağlı olduğu için elle kurulan nesneler ve testler bozulmaz.
- **`src/server/db/firma-havuzu.ts` (yeni):** `kiraciHavuzu(k)` ortak firmaya `merkezHavuzu()`, kendi projeliye `firmaHavuzu(k.vt)` döner. `firmaHavuzuKimlikle(id)` arka plan için.
- **Değişen çağrılar:**
  - `src/server/kimlik/istek.ts` (4 çağrı), `src/server/kimlik/eylemler.ts` (6 çağrı), `src/server/eposta/sonra.ts:11`, `src/app/(uygulama)/page.tsx:20`, `src/app/(uygulama)/ekipman-turleri/page.tsx:25`.
  - Bunlarda `havuz()` yerine kiracının havuzu kullanılır.
  - `havuz()` adı `merkezHavuzu()` olur; dokunulan dosyalar zaten bunlar.
- **`kiraciIcinde`** (`src/server/db/kiraci.ts:122`), aynı sorguya ek:
  ```sql
  SELECT set_config('app.firma_id',$1,true), set_config('app.hesap_id',$2,true), vt_firma_dogrula($1::uuid)
  ```
  - Firma veritabanında `vt_kimlik.firma_id <> p` ise hata `42501`.
  - Ortakta yalnız `EXISTS(firma WHERE id=p AND vt='kendi')` ise hata.
  - Dondurulmuş firmayı reddetmez: `tests/yonetim.test.ts:247-249` bunu bekliyor.
- **Dondurmanın ikinci kilidi** (pencere ≤ 15 sn):
  - `oturumOku` ve `musteriOturumOku` sorgularına `JOIN firma f ON f.id=o.firma_id AND f.durum='etkin'` eklenir.
  - `girisYap` ve `musteriGirisYap` aynı koşulu arar.
  - `firma`'ya SELECT hakkı ve `firma_kendi` politikası zaten açık.

### 5.2 Bağlantı

- **`src/server/db/baglanti.ts` (saf):**
  - `baglantiDenetle(ayar, {merkezYerel})` `ortamdanBaglanti`'nın denetimini paylaşır.
  - Uzak sunucuda TLS ve `SUPABASE_KOK_2021` zorunlu.
  - Sunucu adı izin listesi: `^aws-\d{1,2}-eu-central-1\.pooler\.supabase\.com$`.
  - 127.0.0.1 yalnız merkez yereldeyse kabul edilir.
  - `kayittanBaglanti(kayit, anahtar)` parolayı çözer, kullanıcıyı `probata_uygulama.<ref>` biçiminde kurar.
- **Havuzlar:**
  - Firma başına `max = PROBATA_FIRMA_HAVUZ` (1–5, varsayılan 3); bağlanma ve boşta bekleme 5 sn.
  - Örnek başına en çok `PROBATA_FIRMA_HAVUZ_SAYI` (32) havuz; LRU'dan atılan havuzun `end()`'i `waitUntil` ile beklenir.
  - Anahtar `${firmaId}:${ref}:${surum}`.
  - `vercelBosBekle` her havuzun `release` olayına takılır.
- **Parola hatası (`28P01`) ya da bağlantı reddi:** kayıt önbelleği ve havuz düşürülür, bir kez yeniden denenir. Parola yenilemesi kesintisiz geçer.

### 5.3 Sırlar

- **`src/server/ayar/aes.ts` (yeni, saf):** `aesSifrele(duz, ek, anahtar)` / `aesCoz`. `sir.ts` bunları bugünkü `probata:sir:v1:<firmaId>:<ad>` ekiyle çağırır; çıktı birebir aynı kalır.
- **Bağlantı sırlarının eki:** `probata:baglanti:v1:<firmaId>:<ref>:<ad>`, ad ∈ `uygulama_parolasi | depo_gizli | kurulum_sahip | kurulum_yz`. Satır başka firmaya kopyalanırsa ya da ref değişirse çözülmez.
- **`IstekKiracisi` yalnız şifreli metni taşır.** Çözme havuz ya da depo kurulurken, bir kez yapılır.

### 5.4 Roller ve parolalar

- **Roller göçle kurulur:** 0001, 0030, 0050; 0009 süre sınırlarını verir.
- **Kurulumda tek ek ifade:** `ALTER ROLE probata_uygulama LOGIN PASSWORD 'SCRAM-SHA-256$4096:…'`.
  - Özet `src/server/db/scram.ts` (yeni, saf; RFC 7677 örneğiyle test edilir) ile istemcide hesaplanır; düz parola API günlüğüne gitmez.
  - Sıra: önce şifreli "bekleyen" sürüm merkeze yazılır → ALTER → `surum++`.
- **Sahip parolası (`db_pass`):** proje açma isteğinden ÖNCE üretilir ve `firma_kurulum.girdi`'ye şifreli yazılır; kurulum bitince silinir.
  - Göç Management API ile yapıldığı için saklanmaz.
  - Acil durumda `PATCH /v1/projects/{ref}/database/password` kullanılır.
- **Göçü koşan rol her projede `postgres`.** Her çağrı `SET LOCAL ROLE postgres` ile başlar. 0000 `ALTER DEFAULT PRIVILEGES` ile koşan rolün varsayılanlarını değiştirdiği için bu şart.

### 5.5 Göç, yayın, sağlık

- **`src/server/db/goc.ts`:** `gocleriUygula(yurutucu, klasor)`; `GocYurutucu = { kayitli(): Promise<Map<ad, ozet>>; uygula(goc): Promise<void> }`.
  - `pgYurutucu(client)`: bugünkü davranış; testler ve gömülü veritabanı bunu kullanır.
  - `yonetimApiYurutucu(ref)` (`src/server/dis/supabase-yonetim.ts`): göç başına tek çağrı. Ad kalıp denetiminden geçmiş, özet onaltılık olduğu için değerler metne güvenle gömülür.
  - Göçlerde `BEGIN/COMMIT/CONCURRENTLY` yok (taradım). Hepsi tek işlemde koşabilir.
- **`scripts/goc-dagit.ts`, `vercel.json` `buildCommand`:** `node scripts/goc-dagit.ts --zorunlu && node scripts/next.ts build` (`--zorunlu` FV4 incelemesinde eklendi, 2026-10-15 — §6.1). Kip `PROBATA_GOC_DAGIT`:
  - **`denetle`** (varsayılan; PAT gerekmez): merkez ve `goc_hedefleri()` dolaşılır; uygulama rolüyle `saglik_denetimi()` okunur; `son_goc = SON_GOC` ve `goc_sayisi = GOC_SAYISI` değilse çıkış kodu 1. Bugünkü elle akışa da yayın kapısı olur.
  - **`uygula`:**
    1. Merkezde `is_basla('goc_dagitim')` kilidi alınır; ikinci derleme düşmez, 120 sn'ye kadar bekler.
    2. Bütün hedeflerde özet denetimi yapılır; tek fark varsa hiçbirine başlanmaz.
    3. Önce ortak, sonra açılış sırasıyla öteki projeler; ilk hatada durulur.
    4. Sonunda yeniden `denetle` ve `firma_vt.son_goc` yazımı.
  - **Kural (yazılı):** göçler geriye uyumlu yazılır; önce göç, sonra kod.
- **Sağlık:**
  - `/api/saglik` firma adresinde merkezi ve o firmanın veritabanını denetler; yeni alan `firma_vt` (vt_firma_dogrula). Firma listesi ya da sayısı açık uçta görünmez.
  - Yeni `/api/saglik/projeler`: `zamanliYetkili` ile korunur; 4 eşzamanlı, proje başına 5 sn; yalnız `{toplam, tamam, sorunlu}` döner. Proje başına sonuç `firma_vt.son_saglik`'e yazılır.
  - `tools/duman.mjs`: `PROBATA_DUMAN_SIR` varsa bu ucu da yoklar.

### 5.6 Gece işi

- **`firmalardaKos(havuz, ad, sure, bos, adim, havuzBul?)`:** `havuzBul` verilmezse bugünkü gibi davranır; mevcut testler aynen geçer.
  - Liste merkezden gelir (`gece_firmalari()` kendi projelileri de döndürür; `durum='etkin'` olduğu için kurulumdaki firma girmez).
  - Bağlantı hatası ya da zaman aşımı yeni `ulasilamayan` sayısına yazılır; öteki firmalar sürer.
  - `geceIsleri`, `saklamaIsi`, `epostaIsi`, `depoTasimaIsi` parametreyi alır.
- **Ölçek kalemi (FV14):** firma sayısı yaklaşık 15'i geçince ya da koşu 30 sn'yi aşınca:
  - Dört adım firma başına tek bağlantıda.
  - Sıra son başarılı koşuya göre (`is_firma_sonuc`); bugün `ORDER BY id` olduğu için sondaki firmalar aç kalıyor.
  - Saatlik zamanlama (Vercel Pro).

### 5.7 Depo

- **`depo()` bir yönlendirici döndürür:**
  - `yaz / oku / copSil / imzaliAdres` anahtarın 2. parçasındaki firma kimliğinden çözülür (`firmaCozId` + önbellek).
  - Ortak firma: bugünkü `depoSec(process.env)`.
  - Kendi projeli firma: `supabaseDepo({url: depo_url, gizli: çöz(depo_gizli), kova}, null)`; yedek yok.
  - `oksuzSay` ve `tasi` firmayı `SELECT gecerli_firma()` ile bulur; kendi projelide `tasi` sıfır döner.
  - 60 çağrı yeri değişmez.

### 5.8 E-posta (K2, K3)

- **Merkez:** `eposta_alan` (asıl kayıt). Yönetim Resend'e `POST /domains {name, region:"eu-west-1"}` gönderir, DNS kayıtlarını saklar, doğrulamayı `POST /domains/{id}/verify` ve `GET` ile dener.
- **Anahtar:** `POST /api-keys {permission:"sending_access", domain_id}`. Dönen anahtar `firma_yonetim_sir` ile firmanın `firma_sir 'eposta_anahtari'` satırına yazılır.
- **Firma:** `firma_gonderim` kilitli kopya, `firma_yonetim_gonderim` ile yazılır.
  - `firma_sir` tetiği: `current_user='probata_uygulama' AND ad='eposta_anahtari'` → red (K3 veritabanı kilidi).
  - `ayarlar.ts` `eposta` bölümünde yalnız `kopya` kabul edilir; `epostaAnahtarYaz` kalkar.
- **`kimden.ts`:**
  - Kişinin adresi alandaysa Kimden kişinin kendisi.
  - Değilse `"Ad · Firma" <genel_yerel@alan>`, yanıt kişiye.
  - Otomatik e-postada yanıt = Rapor e-postası.
  - `GENEL_ALAN_DISI` kalkar.
  - Alan doğrulanana kadar e-postalar "alan adı doğrulanmadı" nedeniyle bekler.
- **`saglayici.ts`:** açık `User-Agent: probata` başlığı, ve kuyruk satırının kimliğiyle `Idempotency-Key`.

### 5.9 Hata kaydı ve duyuru

- **Hata kaydı:** `hataKaydet` → `merkezHavuzu()`, değişmez. Alan başına sel sınırı küçük, ayrı bir kalem (FV15).
- **Duyuru:**
  - `duyurulariOku(merkezHavuzu())` aynen.
  - `anaSayfa(db, o)` artık `duyuruBolumu`'nu çağırmaz; sayfa `merkezOku(merkezHavuzu(), duyuruBolumu)` ile okuyup birleştirir.
  - Tablolara zaten SECURITY DEFINER işlevlerle (`duyuru_listesi`, `duyuru_durumu`) erişiliyor.

### 5.10 Yapay zekâ (K4)

- Anahtar firmada kalır.
- **`firma_yonetim_sir(p_firma, ad, sifreli, son4)`** her iki veritabanı türünde çalışır:
  - Kimlik doğrulaması: `vt_kimlik.tur='ortak'` ise `yonetim_kim()`, değilse `yonetim_kim_firmada()`.
  - Firma denetimi: ortakta firma `vt='ortak'` olmalı; firma veritabanında `p_firma = vt_kimlik.firma_id` olmalı.
  - Firmanın `denetim_izi`'ne "probata yönetim (<e-posta>)" düşer.
- Ardından merkezde `yonetim_izi 'ayar.yz_anahtari'` (son 4) yazılır.
- Şifreleme uygulamada `aesSifrele` ile yapılır. Son yazan geçerli.

### 5.11 Yönetim işleri

- **`src/server/yonetim/istek.ts` → `yonetimFirmaIslemi(o, firmaId, is)`:** `yonetim_firma_baglanti(id)` merkezde okunur, ardından:
  - Ortak firma: 0050 işlevleri aynen.
  - Kendi projeli firma: `yonetimFirmadaIcinde(firmaHavuzu, firmaId, is, {yoneticiEposta})` (`kiraci.ts`) şu sırayla:
    1. BEGIN
    2. `set_config('app.firma_id','')`, `set_config('app.yonetici_eposta', …)` ve `vt_firma_dogrula`
    3. `SET LOCAL ROLE probata_yonetim`
    4. `firma_yonetim_*` işlevi
    5. COMMIT
    6. Ardından merkez izi.
- **Dondurma (kendi projeli):** önce firma tarafı (`durum` kopyası, oturumlar silinir), sonra merkezde `yonetim_firma_durum`. Bu işlev 0096'da `vt='kendi'` için yalnız durum + iz yazar. Hata olursa kapalı yönde düşer; etkinleştirmede sıra tersine.
- **Güven düzeyi bugünkünün aynısı:** bugün de SQL enjeksiyonu `probata_yonetim`'e geçip `yonetici`'yi okuyabilir. Kazanç: enjeksiyonun etki alanı artık yalnız o firmanın veritabanı.

### 5.12 Kurulum

- **Dosyalar:** `src/modules/yonetim/kurulum-adim.ts` (saf), `src/modules/yonetim/server/kurulum.ts`, `src/modules/yonetim/ui/Kurulum*.tsx`.
- **Kira:** merkez işlevi `firma_kurulum_kira(id)` → `UPDATE … WHERE kira_bitis IS NULL OR kira_bitis < now()`, 90 sn.
- **İlerletme:** sayfa açıkken 3 sn'de bir `kurulumIlerletEylemi`; her çağrı 40 sn bütçeyle çalışır. Sayfa kapanırsa "Kaldığı yerden sürdür" tuşu çıkar.

| # | Adım | Ne yapar |
|---|---|---|
| 0 | `kayit` | `yonetim_firma_kayit_ac`: firma (`vt='kendi'`, `durum='kurulum'`), `firma_vt`, `firma_kurulum`, yönetim izine niyet kaydı |
| 1 | `proje` | Önce `GET /v1/projects` ile `probata-<kisa_ad>-<id8>` adı aranır (proje açmada tekrar koruması yok). Yoksa `db_pass` şifreli yazılır, sonra `POST /v1/projects {region_selection:{type:"specific",code:"eu-central-1"}, desired_instance_size:"micro"}` |
| 2 | `hazir` | `/health?services=db,pooler,storage` → hepsi `ACTIVE_HEALTHY` olana dek yoklanır |
| 3 | `ssl` | `PUT /ssl-enforcement` |
| 4 | `goc` | `yonetimApiYurutucu`; `goc_dagitim` kilidi beklenir |
| 5 | `vt_kimlik` | `UPDATE vt_kimlik SET tur='firma', firma_id=$1 WHERE tur='ortak'` |
| 6 | `rol` | §5.4'teki SCRAM sırası |
| 7 | `havuzcu` | `GET /config/database/pooler` (işlem kipi) → izin listesi denetimi |
| 8 | `depo` | `probata_depo` adlı gizli anahtar (yoksa `POST /api-keys?reveal=true`), özel kova |
| 9 | `dene` | Uygulama rolüyle: `vt_firma_dogrula`, `saglik_denetimi()` hepsi doğru; Storage'a deneme nesnesi yaz, oku, sil |
| 10 | `firma` | Sahip olarak `firma_kur(...)`; parola yerine kullanılamaz rasgele bir özet konur |
| 11 | `eposta` (isteğe bağlı) | §5.8 |
| 12 | `yz` (isteğe bağlı) | `firma_yonetim_sir` |
| 13 | `tamam` | `etkin`; "Yöneticiye geçici parola oluştur" tuşu (parola bir kez görünür) |

- **`INIT_FAILED`:** "Projeyi kaldır ve yeniden dene" tuşu, yalnız hiç etkin olmamış ve ad kalıbı tutan kurulumda.
- **Yeniden denenebilir hatalar** (429, 5xx, `COMING_UP`, bağlantı): en çok 5 kez.
- **Kalıcı hatalar** "Sürdür" ister: 402 (plan / ödeme), 403 (anahtar yetkisi), göç hatası, sertifika uyuşmazlığı, sunucu adı izin dışı.

---

## 6 · Kalem listesi

Her kalem tek commit; `son-goc.ts` her göçte güncellenir.

| # | Kalem | Değişen / yeni dosya | Göç (idempotent) | Kilit testi | Olumsuz kanıt (bozan) | Uçtan uca | Dış hesap |
|---|---|---|---|---|---|---|---|
| FV1 | Veritabanı kimliği + yanlış yönlendirme kilidi | `db/kiraci.ts` (tek satır) | **0095_vt_kimlik**: `vt_kimlik` (tek satır, CHECK, FK yok, düz RLS ifadeleri, yalnız yönetim politikası, `'ortak'` tohumu); `firma.vt` (`'ortak'`); `vt_firma_dogrula`; `firma_bul` koşulu; `firma` ekleme tetiği | `tests/vt-kimligi.test.ts`: ortakta `vt='kendi'` firma hata verir; firma veritabanında başka kimlik hata verir; olmayan kimlik bugünkü gibi; dondurulmuş firma çalışır; `vt_kimlik` uygulamaya kapalı | `vt-kimligi.bozan.ts` (`kiraciIcinde`'den doğrulama çıkarılır) | Yok | Hayır |
| FV2 | Merkez kaydı, şifreleme, SCRAM | `ayar/aes.ts`, `ayar/sir.ts`, `db/scram.ts`, `db/baglanti.ts`, `db/merkez.ts` | **0096_merkez_kaydi**: `firma_vt`, `firma_kurulum` (düz RLS), durum `'kurulum'`, `firma_coz`, `firma_coz_id`, `yonetim_firma_baglanti`, `goc_hedefleri`, `yonetim_firma_kayit_ac`, `firma_kurulum_kira`/adım işlevleri; `yonetim_firmalar` DROP+CREATE; `yonetim_firma_durum`/`gecici_parola` kendi dalı | `firma-baglanti.test.ts` (saf: izin listesi, TLS, ek veri, RFC 7677); `merkez-kaydi.test.ts` (PG) | `firma-baglanti.bozan.ts` (ek veriden ref çıkar; izin listesi kalkar) | Yok | Hayır |
| FV3 | Firma başına havuz + yönlendirme | `db/firma-havuzu.ts`, `kiraci/kayit-onbellek.ts`, `kiraci/istek.ts`, kimlik ×3, `eposta/sonra.ts`, iki sayfa, `havuz()`→`merkezHavuzu()` | — | `tests/yardimci/coklu-vt.ts` (merkez + kendi-A AYRI kümede + kendi-B aynı kümede); `firma-vt.test.ts` (A'nın verisi yalnız A'da; çapraz havuz hata; önbellek, LRU, 28P01; dondurmada önbellek bayatken giriş red); `havuz-kapsami.test.ts` (içe aktarma izin listesi) | `firma-vt.bozan.ts` (çözücü hep ilk havuzu verir), `havuz-kapsami.bozan.ts` | `e2e-sunucu.ts`'e "kendi" firması (ikinci veritabanı) + `e2e/firma-vt.spec.ts` | Hayır |
| FV4 | Göç dağıtıcı (denetle) | `scripts/goc-dagit.ts`, `vercel.json` buildCommand | — | `goc-dagit.test.ts` (geride kalan proje → çıkış 1) | var | Yok | Hayır |
| FV5 | Depo yönlendirici | `dosya/depo.ts` | — | `depo-yonlendirme.test.ts` (sahte Storage, yedeksiz) | var | `firma-vt.spec`: dosya yükle / indir | Hayır |
| FV6 | Arka plan + duyuru | `is/firmalar.ts`, `is/gece.ts`, `raporlar/server/saklama.ts`, gece ucu, `anasayfa.ts`, `page.tsx`, `duyuru/okuma.ts` | — | `gece-firma-vt.test.ts` (`ulasilamayan`; kilit merkezde) | var | Yok | Hayır |
| FV7 | Sağlık her projede (yapıldı, 2026-10-15) | `saglik.ts`, `db/saglik.ts`, `/api/saglik`, `/api/saglik/projeler`, `tools/duman.mjs` | — | `saglik-coklu.test.ts` (PG: açık uç liste sızdırmaz, firma veritabanı denetlenir, projeler sayıları + `son_saglik`), `saglik-coklu-saf.test.ts` (sahte havuz, uçların metni, duman alt süreçte) | `saglik-coklu.bozan.ts`, `saglik-coklu-saf.bozan.ts` | `e2e/api.spec.ts` (yedi anahtar her adreste; projeler ucu sırla) + duman testi | Hayır |
| FV8 | Management API istemcisi + `GocYurutucu` + `uygula` kipi | `dis/supabase-yonetim.ts` (429 bekleme, maskeleme, uç adresi yalnız yerel), `db/goc.ts`, `hata/maske.ts` (`sbp_`, `sb_secret_`, `re_`) | — | `tests/yardimci/sahte-supabase-yonetim.ts`; `goc-dagit.test.ts` (özet farkında hiçbir projeye başlanmaz; 2. projede düşerse 3.'ye dokunulmaz; eşzamanlı iki koşu); `yonetim-anahtari.test.ts` (ortam adları yalnız `src/server/dis/**` ve `scripts/`; istemci zinciri içe aktarmaz) | var | Yok | Hayır (sahte) |
| FV9 | Firma tarafı yönetim + K4 | `db/kiraci.ts` (`yonetimFirmadaIcinde`), `yonetim/istek.ts`, `modules/yonetim/server/yonetim.ts`, UI (YZ anahtarı: değiştir / kaldır / bu ay) | **0097_firma_tarafi_yonetim**: `yonetim_kim_firmada`, `firma_kur` (yalnız sahip), `firma_yonetim_durum`, `firma_yonetim_gecici_parola`, `firma_yonetim_sir`, `firma_yonetim_ozet` | `yonetim-firmada.test.ts` (merkezde reddedilir; uygulama rolü doğrudan çağıramaz; iz iki tarafta) | var | `yonetim.spec`: YZ anahtarı | Hayır |
| FV10 | Kurulum makinesi + ekranlar (probata örgütü) | §5.12 dosyaları; Firma ayarları › Depolama salt okunur (bilgi `IstekKiracisi`'nden); `SUPABASE_ADIMLAR` K1'e göre (e2e 6 adım kilidi tarih + gerekçeyle) | (gerekirse kurulum işlevleri) | `firma-kurulum.test.ts` (her adımda kesip sürdürme; `POST /v1/projects` tek kez; 429; kalıcı hata; günlükte sır yok) | Adla arama ve kira kaldırılır → düşmeli | `yonetim.spec`: Firma aç → ilerleme → sürdür → giriş | Hayır (sahte). PAT yokken "kendi proje" seçeneği kapalı ve açıklamalı |
| FV11 | E-posta K2 + K3 | `dis/resend-yonetim.ts`, `eposta/{firma,kimden,saglayici}.ts`, `firma-ayarlari` (sunucu + UI + `RESEND_ADIMLAR`), yönetim UI (DNS kayıtları, Doğrula) | **0098_eposta_gonderim**: `eposta_alan`, `firma_gonderim`, `firma_yonetim_gonderim`, `firma_sir` tetiği | `eposta-alan.test.ts` (kimden; K3 sunucuda ve veritabanında; User-Agent); `firma-ayarlari` testleri güncellenir | var | `firma-ayarlari.spec` güncellenir | Kod CI'da; canlı için Resend + DNS |
| FV12 | D-ölçüm + düzeltme | Bulgulara göre | — | — | — | — | **Evet** (§7, 4. adım) |
| FV13 | Firmanın kendi örgütü + bakımda | Örgüt listesi (`GET /v1/organizations`), `goc_disi` (gerekçeli, izli), uyarılar | (gerekirse) | Sahte API | var | Yönetim | Canlıda gerçek firma örgütü |
| FV14 | Gece ölçeği | §5.6 | `is_firma_sonuc` | `gece-coklu.test.ts` | var | — | Saatlik zamanlama için Vercel Pro |
| FV15 | Hata defterine alan başına sel sınırı | `hata_yaz` | Yeni göç | `hata.test` ekleri | var | — | Hayır |

FV1–FV11 dış hesap olmadan, CI'da tam doğrulanır. FV1–FV9 canlıda davranış değiştirmez: deneme firması `'ortak'` kalır.

### 6.1 FV3–FV4 ve FV7'den sonraki kalemlere devredilenler (2026-10-15, FV3 incelemesi; FV4 ve FV7 eklemeleri aynı gün)

Kendi projeli firma yayında yok (FV10 ile açılır); aşağıdakiler yalnız sınamada ve uçtan uçta görünür, kalemleri gelince kapanır.

- **FV4 (yapıldı) — canlıda ilk yayında bakılacak:** Vercel derleme günlüğünde `[göç dağıtıcı] TAMAM: 1 veritabanı güncel.` görülmeli.
  - Derleme komutu `--zorunlu` verir (FV4 incelemesi): veritabanı ayarı (`PROBATA_VT_*`) derlemeye gelmezse kapı `atlandı` demez, 1 döner; Vercel'in `VERCEL` sistem değişkenine dayanmaz ("Automatically expose System Environment Variables" kapalı olsa da). `atlandı` yalnız bayraksız ve `VERCEL`'siz koşuda (CI, yerel) çıkar.
  - Davranış özeti (`src/server/db/goc-dagit.ts`): kip yalnız `denetle`; merkez + kurulumu tamam her kendi projeli firma, uygulama rolüyle, READ ONLY; ulaşılamayan ya da reddeden firma çıkış 1 (atlanmaz); dondurulmuş firma denetlenir; bakımdaki (`goc_disi`) listede yok, yalnız sayısı yazılır.
  - Geçici hata (57P01, 57P03, 53300, ECONNRESET, ETIMEDOUT, zaman aşımı, kopma) merkezde ve her firmada 2,5 sn sonra bir kez yeniden denenir; kalıcı sonuç (parola, yetki, eksik işlev, göç farkı) denenmez. Bütün denetim en çok 120 sn; dolarsa 1.
  - Derleme günlüğüne adıyla yalnız sorunlu firma yazılır; güncel, kurulumdaki, bakımdaki firmalar sayıyla. Vercel'de "Build Logs and Source Protection" açık kalmalı; `vercel.json`'a `public` yazılmaz (kilit `yayinKapisiEksikleri`).
  - Ana anahtar yalnız verilen ortamdan okunur (`anahtarOku`; `sir.ts anaAnahtar`'ın `process.env` varsayılanına düşmez).
  - Denetleme merkeze YAZMAZ (`firma_vt.son_goc / goc_sayisi` boş kalır). Gerekçe: bu adım her derlemede, sonradan düşen derlemede de koşar; "son göç" uygulanan göçün kaydı olmalı.
  - Uçtan uçta ve CI'da koşmaz (CI `node scripts/next.ts build`'i doğrudan çağırır); betik gerçek veritabanıyla `tests/goc-dagit.test.ts`'te alt süreçte sınanır.
- **FV7 (yapıldı) — davranış özeti** (`src/server/saglik.ts`, `src/server/db/saglik.ts`):
  - `/api/saglik`: yeni denetim `firma_vt`. Firma adresinde kiracının havuzu (`kiraciHavuzu`; ortak firmada merkez), kiracı işleminde `vt_firma_dogrula` + altı denetim firmanın veritabanında (göç güncel dahil), READ ONLY, sunucuda ve istemcide 5 sn. Kökte, yönetim adresinde (ara katman /api'yi zaten 404 yapar), bilinmeyen / kapalı firmada `firma_vt` doğru — yedi anahtar her zaman; firma listesi ve sayısı bu uçtan okunmaz. Uç yazmaz.
    - **Ne sızar, ne sızmaz (FV7 incelemesi, iddia daraltıldı):** sağlıklı durumda yanıt adrese göre ayırt edilmez. Firmanın veritabanı düşük ya da göçü geride iken o adreste `firma_vt=false` (merkezin altısı doğru) + 503 döner; bu, adresin kendi veritabanlı firma olduğunu ve o anki sorununu ele verir (ortak firmanın denetimi merkezde koşar). Firmanın varlığı zaten giriş sayfasından görülür; ikinci veritabanı işinin süresi de ayırt ettirebilir. Onaylı tasarım `firma_vt`'yi bu uçta ister (§5.5); firmaya özgü ayrıntıyı yalnız sırlı projeler ucuna bırakmak ayrı bir tasarım kararı olur.
    - **Yük (FV7 incelemesi):** merkez ve firma denetimi örnek başına tek uçuş; süre sınırı tek uçuşun DIŞINDA (`sureli(tekUcus(…))` — süresi dolan iş askıdayken gelen istek yeni bağlantı açmaz, aynı işi bekler; önce içindeydi, süre dolunca ikinci işlem açılıyordu). Firma sonucu örnek başına önbellekte: sağlam 10 sn, sorunlu 30 sn (`SAGLIK.olumluSn / olumsuzSn`; firma kimliğiyle, en çok 2 000 — LRU). Oturumsuz uç art arda istekle firma veritabanına bağlantı, havuz kurulumu (LRU) ve bozuk parolada hatalı parola denemesi doğuramaz — örnek başına 30 sn'de bir deneme. Merkez denetimi önbelleksiz (350'den beri); 5 sn süre sınırı eklendi.
  - `/api/saglik/projeler`: `PROBATA_SAGLIK_SIR` (duman testi; yalnız bu ucu açar) ya da `CRON_SECRET` (zamanlayıcı — FV14) ile; değilse 401. FV7 incelemesi (en az yetki): önce yalnız `CRON_SECRET`'le açılıyordu — duman makinesine konan sır gece işlerini de tetikleyebiliyordu; artık o makineye yalnız `PROBATA_SAGLIK_SIR` konur. `goc_hedefleri()` merkezde `merkezOku` içinde (READ ONLY + `vt_merkez_dogrula`, işlem içinde yönetim rolü). Kurulumu bitmemiş proje yoklanmaz ve sayılmaz; bakımdaki listede yok; dondurulmuş yoklanır. 4 aynı anda, proje başına 5 sn, projeler evresi 35 sn: tek bitiş zamanı — proje ancak süresi bitişe sığarsa başlar (sığmayan sorunlu sayılır, yazılmaz); süresi dolan projenin arkadaki işi (bağlantı kapanışı) bitene dek o işçi yeni projeye geçmez (açık firma bağlantısı en çok 4). Merkez okuma ve yazma da süre sınırlı (istemcide + sunucuda `statement_timeout`, 5 sn): uç en çok 5 + 35 + 5 = 45 sn (`maxDuration` 50 — PDF uçlarının 60'lık Chromium işlev grubuna girmesin). Yanıt yalnız `{toplam, tamam, sorunlu}`; sorunlu varsa 503, merkez okunamaz / yazılamazsa 503 + kısa ileti.
  - `firma_vt.son_saglik` (+ `son_saglik_zaman`): `{durum, denetimler (altısı + kimlik), neden (sınıf + kod; hata iletisi yok), goc {son, sayi}, surum}` — tek UPDATE, yönetim rolüyle; göç dağıtıcı bu sütunları yazmaz. `goc` firmanın veritabanından gelir, biçimi denetlenir (FV7 incelemesi — FV13'te veritabanının sahibi firma olabilir): ad göç dosyası biçiminde ve en çok 89 karakter, sayı 0–100 000 tam sayı; değilse `null`. Yönetim rolü `firma_vt`'nin bütün sütunlarını okur; UPDATE hakkı `son_goc / goc_sayisi / son_saglik / son_saglik_zaman`'da (0096).
  - `tools/duman.mjs`: `PROBATA_DUMAN_SIR` (değeri `PROBATA_SAGLIK_SIR`; `CRON_SECRET` değil) varsa projeler ucu da yoklanır (sorunlu 0 ve tamam = toplam). Sır yalnız `https://<ad>.probata.com.tr` ya da yerel http adrese gider (FV7 incelemesi: önce her https adrese); biçimi önce denetlenir — en az 32 görünür ASCII karakter, değilse istek yapılmaz (gömülü satır sonunda fetch'in başlık hatası sırrı iletisine yazıyordu); istek hatasında yalnız hata kodu yazılır; yönlendirme izlenmez; yoksa "atlandı" (sayıya girmez — 11/11 aynı).
  - **Deneme makinesinde ilk koşu:** `saglik-coklu.test.ts`, `bozan/saglik-coklu.bozan.ts` ve `e2e/api.spec.ts`'in iki FV7 testi PC'de koşulmadı. "Ulaşılamayan firma" senaryoları artık hiç dinlenmeyen sabit kapı 1'i kullanır (önce `bosKapi()` — başka test dosyasının kümesiyle kapı yarışı). FV4 testlerinde (`goc-dagit.test.ts:144`, `bozan/goc-dagit.bozan.ts:94`) aynı desen duruyor; FV4'e bu incelemede dokunulmadı.
  - **Açık / devredilen:** projeler yoklamasının zamanlaması yok (yalnız duman ya da elle; `vercel.json` crons yalnız gece işi — kilit `yayinKapisiEksikleri`); saatlik yoklama FV14 ile (Vercel Pro). `son_saglik`'in yönetim ekranında gösterimi FV13 (bakımda / ulaşılamayan firma ekranı) ile. Kodsuz hatanın günlükteki nedeni yalnız "bağlantı kurulamadı" (ileti sırsızlık için yazılmaz). Uçtan uçta kendi veritabanlı firmanın sağlığı ve projeler ucu `e2e/api.spec.ts`'te; PC'de koşulmadı, deneme makinesi koşar.
- **FV8:**
  - `uygula` bugün açık hata (`kipOku` → `gocDagit` 1). Uygulanınca `tests/goc-dagit-saf.test.ts` "uygula → 1" beklentisi ve `tests/bozan/goc-dagit-saf.bozan.ts` 2 tarih + gerekçeyle değişir.
  - `firma_vt.son_goc / goc_sayisi` yazımı `uygula`'nın sonundaki yeniden denetlemede yapılır (yönetim rolünün sütun hakkı 0096'da hazır).
  - `goc_hedefleri()` kurulumdaki firmayı da (`ref` var, bağlantı yok) döndürür; `denetle` onu atlar, `uygula` Management API ile ref üzerinden göç uygulayabilir.
- **FV10:** göç dağıtıcı kurulumu bitmemiş firmayı ATLAR (uygulama parolası / havuzcu henüz yok; `firma_coz` çözmez). Kurulum bir yayının iki yanına düşerse firma eski şemayla açılmasın diye kurulumun `dene` adımı `saglik_denetimi()`'nin `son_goc / goc_sayisi`'nı ÇALIŞAN kodun `SON_GOC / GOC_SAYISI`'yla karşılaştırmalı; tutmazsa `goc` adımına döner.
- **FV13:** ulaşılamayan firma bütün yayını durdurur (kapalı yön). Çaresi "bakımda" (`goc_disi` + gerekçe); ekranı FV13'te. O güne kadar `goc_disi` yalnız sahip bağlantısıyla yazılır.
  - **Bakımdan çıkarma açığı (FV4 incelemesi):** bakımdaki firma hiçbir göç denetiminden geçmez; `goc_disi=false` yapılınca `firma_coz` onu hemen çözer ve çalışan kod eski şemayla açılır (eksik bir RLS sıkılaştırma göçü de olabilir). Kural: bakımdan çıkarma ancak o firmanın `saglik_denetimi()` `son_goc / goc_sayisi`'sı ÇALIŞAN kodun `SON_GOC / GOC_SAYISI`'yla tutunca (ya da FV8'in `uygula`'sından sonra) yapılır; tutmazsa `goc_disi` kalır. FV13'ün ekranı bu denetimi yapmadan çıkarmaz. O güne kadar elle çıkarmada aynı denetim elle yapılır.
  - Görünürlük bugün: göç dağıtıcı her derlemede `n firma bakımda (göç dışı) — denetlenmedi` satırını yazar (yalnız sayı).

- **FV5:** veritabanı deposu (`vtDepo`) istek işlemi dışında merkezde okur; kendi projeli firmanın dosyası bu yoldan okunamaz. `e2e/firma-vt.spec.ts`'e dosya yükle / indir adımı eklenir.
- **FV6:**
  - `e2e/api.spec.ts` "gece işi" beklentisi (`GECE_DURUMU`, `KENDI_VT_FIRMA_SAYISI`) yeniden `tamam` / 200 / `hatali_firma = 0` olur. Bugün uçtan uçtaki kendi veritabanlı firma merkezde `vt_firma_dogrula`'ya takılır (42501, veri karışmaz), iş "hata" biter.
  - `src/app/(uygulama)/page.tsx`: duyuru okuması bugün yalnız ortak firmanın sayfasından tetiklenir (`!o.kiraci.vt`); duyuru merkezden okununca (§5.9) koşul kalkar (kilit `tests/havuz-kapsami.test.ts`).
- **FV9:**
  - Kendi projeli firmada "Dondur" bugün yalnız merkezi yazar (0096 `yonetim_firma_durum`): firma veritabanındaki durum kopyası "etkin" kalır, oturumlar silinmez. Dondurmanın ikinci kilidi (`ETKIN_FIRMA`) o firmada henüz işlemez: öteki örneklerde ≤ 15 sn giriş / oturum sürer, etkinleştirmede eski oturumlar geri gelir.
  - `tests/firma-vt.test.ts` dondurma testindeki elle durum yazımı (sahip bağlantısı) yönetim işlemine çevrilir.

---

## 7 · Canlıya geçiş sırası

1. **Ölçüm (eklentiyle, salt okunur, ortak projede):** `SELECT current_user, session_user`, `firma` tablosunun sahibi, `PROBATA_VT_SUNUCU`'nun kalıbı. Sonuç `postgres` çıkarsa FV8'in birincil yolu kesinleşir.
2. **FV1, FV2, FV9 ve FV11 göçleri** bugünkü akışla uygulanır: Supabase'e `goc` kaydıyla → main ileri sarma → Vercel. Her birinden sonra sağlık "tamam" ve duman 11/11. Deneme firması `vt='ortak'` olduğu için davranış aynı kalır.
3. **FV4 ile birlikte** `vercel.json` derleme komutu değişir. O andan sonra ortak proje geride kalırsa yayın durur. Yeni ortam değişkeni gerekmez: merkez bağlantısı ve `PROBATA_SIR_ANAHTARI` derlemede zaten var.
4. **Dış hesaplar:**
   - Supabase'te ayrı bir "probata otomasyon" kullanıcısı; probata örgütü Pro.
   - Klasik PAT → `PROBATA_SUPABASE_YONETIM_ANAHTARI`; ayrıca `PROBATA_SUPABASE_ORGUT=<slug>`.
   - Atılacak bir deneme projesinde FV12 ölçümleri:
     - proje açılış süresi;
     - havuzcu kullanıcı biçimi ve `probata_uygulama.<ref>` girişi;
     - kök sertifika aynı mı;
     - `sb_secret` anahtarı açma;
     - kasıtlı hatalı göçle geri alma davranışı;
     - 0008 doğrulaması.
   - Sonra `PROBATA_GOC_DAGIT=uygula`.
5. **Resend Pro** → `PROBATA_RESEND_ANAHTARI`. `probata.com.tr` alınır; Vercel'e kök, `*.probata.com.tr` ve `yonetim.probata.com.tr` eklenir (Vercel ad sunucuları ya da `_acme-challenge` NS devri + `*` CNAME). `PROBATA_ANA_ALAN` ve `PROBATA_YONETIM_ALAN` güncellenir.
6. **Gerçek veriden önce** Claude'a bağlı Supabase eklentisi otomasyon hesabından ayrı tutulur ve yalnız ortak projeye, salt okunur daraltılır (§11 293'teki açık madde artık daha geniş).
7. **İlk gerçek firma** panelden açılır.

**Yeni ortam değişkenleri:**
- `PROBATA_FIRMA_HAVUZ` (3), `PROBATA_FIRMA_HAVUZ_SAYI` (32), `PROBATA_KAYIT_ONBELLEK_SN` (15)
- `PROBATA_GOC_DAGIT` (`denetle`|`uygula`)
- `PROBATA_SUPABASE_YONETIM_ANAHTARI`, `PROBATA_SUPABASE_ORGUT`, `PROBATA_RESEND_ANAHTARI`, `PROBATA_DUMAN_SIR` (isteğe bağlı)
- Yalnız test: `PROBATA_SUPABASE_YONETIM_UC`, `PROBATA_RESEND_YONETIM_UC` (yerel adres dışında reddedilir)

---

## 8 · Riskler ve açık sorular (önerilen varsayılanlarla)

**Riskler**
1. **Merkez tek hata noktası.** Önbellek 15 sn kısa kesintiyi örter. Ayrı merkez projesine geçiş sonra yapılabilir.
2. **Göç yarıda kalırsa** ileri giden projeler geri alınmaz. Geriye uyumlu göç kuralı bunu karşılar.
3. **Firmanın kendi örgütünde sahip firmadır.** RLS, değişmezlik tetikleri ve saklama süresi firmaya karşı korumaz; bu sözleşme konusudur.
4. **PAT, tek ana anahtar ve Resend ana anahtarı Vercel ortamında** duruyor; derleme sırasında `npm ci` kurulum betikleri de bunları görür. Ana anahtar artık bütün veritabanı parolalarını da açıyor.
5. **Bağlantı sayısı** = örnek × firma × 3. LRU ile sınırlı; ölçülmedi.
6. **Tek Resend hesabının itibarı ortak.** Saniyede 10 istek sınırı bütün takım için geçerli; Pro'da 10 alan adı.
7. **İki veritabanına dokunan işler atomik değil.** Her işlev idempotent, sıra kapalı yönde, ve tutarsızlıkta "Yeniden dene" tuşu var.

**Açık sorular**

| # | Soru | Önerilen varsayılan |
|---|---|---|
| 1 | Erişimi kopan firma bütün yayını durdursun mu? | Hayır. Yönetim gerekçeyle `goc_disi` ("bakımda") koyar, o firma kapanır, yayın sürer. |
| 2 | PAT türü? | Ayrı otomasyon kullanıcısı + klasik PAT. Kapsamı o kullanıcının üye olduğu örgütlerle sınırlı; kapsamlı PAT her yeni firma örgütünde yeniden açılmak zorunda. |
| 3 | Kurulum sayfa kapanınca da ilerlesin mi? | Hayır. Yalnız sayfa açıkken ve "Sürdür" tuşuyla. |
| 4 | Ortakta yeni firma açma? | Yalnız yerel, test ve e2e'de; yayında gizli. |
| 5 | Dondurulan firmanın projesi duraklatılsın mı? | Hayır. Ücretli planda duraklatma yok; yalnız erişim kesilir. |
| 6 | Rapor kodu firmalar arası eşsiz mi? | Bugünkü gibi kalsın (yalnız açılışta denetlenir); ayrı bir kalem olabilir. |
| 7 | Genel gönderen adresi? | `bildirim@<alan>`, Yönetim'de kilitli; Rapor e-postası yanıt adresi olur. |
| 8 | Göç dağıtımı GitHub Actions'ta mı olsun? | Hayır, Vercel derlemesinde. Vercel derlemesi sorun çıkarırsa B'nin `yayin` işi yedek seçenek. |
| 9 | Firma tarafı yönetim işlevlerine imzalı belirteç? | Şimdi değil; güven düzeyi bugünküyle aynı. |
| 10 | Ana anahtar döndürme (`v2.` halkası)? | Bu işin kapsamında değil; ayrı kalem. |
| 11 | Firma silme / proje kaldırma? | Kapsam dışı. Yalnız hiç etkin olmamış kurulumda "Projeyi kaldır" var. |

**Okunan başlıca dosyalar:**
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\db\havuz.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\db\kiraci.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\db\goc.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\db\gomulu.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\db\saglik.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\db\son-goc.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\db\is.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\db\gocler\0000_dis_erisim_once.sql`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\db\gocler\0001_cekirdek.sql`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\db\gocler\0045_*.sql`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\db\gocler\0050_yonetim.sql`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\db\gocler\0053_yz_ayirma_saglik.sql`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\db\gocler\0069_gece_cop.sql`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\db\gocler\0070_duyuru.sql`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\kiraci\istek.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\kimlik\istek.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\kimlik\eylemler.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\kimlik\oturum.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\kimlik\musteri.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\ayar\sir.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\ayar\ayar.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\dosya\depo.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\dosya\supabase.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\is\firmalar.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\is\gece.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\app\api\is\gece\route.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\saglik.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\eposta\firma.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\eposta\kimden.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\eposta\saglayici.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\duyuru\okuma.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\numara\numara.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\server\yonetim\istek.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\modules\yonetim\server\yonetim.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\modules\firma-ayarlari\server\ayarlar.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\modules\firma-ayarlari\sema.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\modules\anasayfa\server\anasayfa.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\src\app\(uygulama)\page.tsx`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\tests\yardimci\supabase.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\tests\yardimci\kume.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\tests\yardimci\denetimler.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\tests\yardimci\vt-hiz.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\tests\kiraci-izolasyonu.test.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\tests\kiraci-suzgeci.test.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\tests\yonetim.test.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\tests\ayar.test.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\scripts\e2e-sunucu.ts`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\vercel.json`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\.github\workflows\ci.yml`
- `C:\Users\canko\OneDrive\Masaüstü\pkproje\pkproje.md` (§11 293)