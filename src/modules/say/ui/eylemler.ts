"use server";
/* S.A.Y SUNUCU EYLEMLERİ (380) — kişi ve kiracı oturumdan (istemciden kimlik alınmaz); başka kökenden gelen istek ve oturumsuz çağrı reddedilir.
   İstemciden gelen yalnız soru metni, hızlı sorunun adı ve bulunulan sayfanın adresi (yer adı sunucuda modül kaydından çıkarılır — kayıt bilgisi
   taşımaz). Yapay zekâ çağrısı veritabanı işleminin dışında.
   522: ekli soru FormData ile (dosyalar + soru, adres, rapor); tür, adet ve boy sunucuda (server/ek.ts), dosya saklanmaz.
   550: kuralla cevaplanan hızlı sorular kalktı (yalnız "Fotoğrafları oku ve gir" — ekranda); rapordayken canlı ekipman bilgisi de gelir (harita);
   internet araması hizmetçe kabul edilmezse (400) soru aramasız bir kez yeniden gönderilir.
   557: rapordayken kontrol tarihleri ve ölçüm cihazı satırları da gelir (harita); sayIsSonucuEylemi — ekranın yaptığı işin sonucu, S.A.Y cevabı
   onunla yazar (çağrı düşerse sonucu sunucu yazar).
   2026-10-15 (pkproje §9 "S.A.Y CLAUDE GİBİ"): (A) sayIsSonucuEylemi döngünün bir turu — S.A.Y yeni iş isterse komutlar ekrana döner, ekran yapar
   ve yine buraya gelir (tur sınırı yok); (D) S.A.Y aracı çağırmadan "yaptım" dediyse cevap gösterilmez, aynı eylemde bir düzeltme turu gider
   (duzelt). Bir eylemdeki çağrılar sayfanın işlev süresine sığsın diye ortak bir bitiş zamanı paylaşır (BITIS_MS).
   2026-10-16 (S.A.Y 1. adım incelemesi): sorunun ekleri döngünün turlarına da gider (sayIsSonucuEkliEylemi — saklanmaz); tur reddedilir ya da
   düşerse işin yarıda kaldığı nedeniyle yazılır (sayIsYarim; ekran turu hiç gönderemediyse sayIsYarimEylemi); düzeltme turu yalnız istekte iş
   yapan araç varken; bitiş zamanı geçtiyse çağrı yapılmaz (işlev süresi aşılmasın); ayırmadan sonra beklenmeyen bir hata olursa açık ayırmalar
   bırakılır (ay sonuna kadar "ayrılan"da kalmasın).
   2026-10-16 (pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım a — reisim: "sayfalarda gezmesine gerek yok", "bu sayfa açık değil falan demesin"): S.A.Y'ın
   işlem çağrıları (islem / islemler) BU EYLEMDE, SUNUCUDA çalışır (src/server/yz/islem.ts yürütücüsü, katalog src/modules/say/islem-katalogu.ts):
   kişi, firma ve yetki oturumdan; sonuç S.A.Y'a döner ve döngü aynı eylemde sürer. Ekran komutu (rapora yazma, format, okuma, kaydet …) gelince
   komutlar ekrana döner — aynı cevaptaki işlemlerin sonuçları "hazir"da; eylemin süresi azaldıysa iş "devam" ile ekranın yeni turuna geçer.
   Ekranın gönderdiği adımlardaki işlemler yeniden ÇALIŞTIRILMAZ (yalnız konuşmaya girer). Veri değiştiren işlem çalıştıysa yanıt "yenile" der.
   2026-10-16 (2. adım a incelemesi): aynı cevapta ekran komutundan sonraki işlem ekranın işini bekler (sıra — SIRA_BEKLER); e-posta kuyruğa
   yazılınca iş ekranın yeni turunda sürer (yanıttan sonraki gönderime süre kalsın); sunucu iş yaptıktan sonra beklenmeyen hata eylemi düşürmez
   (yapılanlar yazılır, adımlar ve "yenile" döner); ekranın "kaydedilmemiş" bilgisi işlemlere gider (açık raporu ezen işlem önce kaydı ister). */
import type { Sorgulayici } from "../../../server/db/kiraci";
import { epostalariSonraGonder } from "../../../server/eposta/sonra";
import { depo } from "../../../server/dosya/depo";
import { hataKaydet } from "../../../server/hata/kaydet";
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { firmaAdresi } from "../../../server/kiraci/istek";
import { islemOzeti, sunucuKomutu, type IslemOrtami } from "../../../server/yz/islem";
import { anthropicCagir, type OkumaIstegi, type OkumaYaniti } from "../../../server/yz/okuma";
import type { SohbetIletisi } from "../../../server/yz/sohbet";
import { duzeltmeIstegi, isAraciVar, SAHTE_YEDEK, sahteYapildi, sunucuKomutuMu, type IsOzeti, type SayAdimi } from "../../../server/yz/say";
import { EK_EN_COK_ADET, EK_EN_COK_BAYT } from "../ek-sinir";
import { ISLEM_DIZINI, ISLEM_KATALOGU, modulAdi } from "../islem-katalogu";
import { EK_BOY_HATASI, sayEkleriOku, type SayEkDosyasi } from "../server/ek";
import { canliOku, kurucuOku, sayBirak, sayDurumu, sayEkAyir, sayGecmisi, sayIsSonucuHazirla, sayIsSonucuKaydet, sayIsYarim, sayOneri, sayRaporCevabi,
  saySorHazirla, saySorKaydet, sayTemizle, type SayDurum, type SayEkCagri, type SayIsHazir, type SaySorHazir, type SayYaniti } from "../server/say";

const RED: SayYaniti = { durum: "red", neden: "Oturumunuz kapandı. Sayfayı yenileyip yeniden giriş yapın." };
const yolAl = (v: unknown) => (typeof v === "string" && v.startsWith("/") && v.length <= 300 ? v : "/");
/** bir eylemdeki yapay zekâ çağrılarının toplam süresi (sayfaların işlev süresi 55 sn — (uygulama)/layout.tsx; iki veritabanı işlemine pay) ve
    tek çağrının en çok süresi (okuma.ts varsayılanı); kalan süre EN_AZ_MS'den azsa çağrı yapılmaz */
const BITIS_MS = 50_000, CAGRI_MS = 45_000, EN_AZ_MS = 5_000;
/** 2026-10-16 (2. adım a): sunucu işlemlerinden sonra bu eylemde yeni çağrı için en az kalan süre — azsa iş ekranın yeni turuna geçer ("devam";
    sınır değil — iş sürer, yalnız eylemin işlev süresi aşılmasın) */
const DEVAM_MS = 30_000;
const SURE_DOLDU: OkumaYaniti = { durum: "hata", neden: "Yapay zekâ zamanında yanıt vermedi; biraz sonra yeniden deneyin.", ucret: "yok" };
/** 2026-10-16: ekran döngünün turunu gönderemedi (bağlantı, süre) — iletinin nedeni (sunucunun metni) */
const ULASILAMADI = "işin sonucu S.A.Y'a ulaştırılamadı (bağlantı koptu ya da süre doldu).";

async function oturum() {
  if (!(await ayniKoken())) return null;
  return istekOturumu();
}

export async function sayDurumEylemi(): Promise<SayDurum | null> {
  const o = await oturum();
  return o ? oturumIslemi(o, (db) => sayDurumu(db)) : null;
}

export async function sayGecmisEylemi(): Promise<SohbetIletisi[]> {
  const o = await oturum();
  return o ? oturumIslemi(o, (db) => sayGecmisi(db)) : [];
}

/** rapor ekranının yaptığı iş (542): ekran işin sayılarını gönderir, metni sunucu kurar */
export async function sayRaporEylemi(girdi: unknown): Promise<SayYaniti> {
  const o = await oturum();
  if (!o) return RED;
  return oturumIslemi(o, (db) => sayRaporCevabi(db, girdi));
}

/** öneri kartı: Uygula / Vazgeç (yalnız kişinin kendi iletisinde, bir kez) */
export async function sayOneriEylemi(id: unknown, durum: unknown): Promise<boolean> {
  const o = await oturum();
  if (!o || typeof id !== "string" || (durum !== "uygulandi" && durum !== "vazgecildi")) return false;
  return oturumIslemi(o, (db) => sayOneri(db, id, durum));
}

/** kaydedilmemis (2026-10-16, D): ekranda kaydedilmemiş değişiklik var — iş veri değiştirirse sayfa yenilenmez, S.A.Y söyler */
export async function saySorEylemi(soru: unknown, yol: unknown, raporNo?: unknown, canli?: unknown, kurucu?: unknown, kaydedilmemis?: unknown): Promise<SayYaniti> {
  const bitis = Date.now() + BITIS_MS;
  const o = await oturum();
  return o ? sor(o, soru, yol, raporNo, canli, [], kurucu, bitis, kaydedilmemis === true) : RED;
}

/** 522: formdaki ekler ("ek", en çok 4 dosya, toplam 4 MB) — tür içerikten (server/ek.ts) */
async function ekleriAl(form: FormData): Promise<SayEkDosyasi[] | { durum: "red"; neden: string }> {
  const dosyalar = form.getAll("ek").filter((d): d is File => d instanceof File);
  if (!dosyalar.length) return { durum: "red", neden: "Ek seçin." };
  if (dosyalar.length > EK_EN_COK_ADET) return { durum: "red", neden: `Bir soruya en çok ${EK_EN_COK_ADET} ek konur.` };
  if (dosyalar.reduce((t, d) => t + d.size, 0) > EK_EN_COK_BAYT) return { durum: "red", neden: EK_BOY_HATASI };
  return sayEkleriOku(await Promise.all(dosyalar.map(async (d) => ({ bayt: new Uint8Array(await d.arrayBuffer()), ad: d.name }))));
}
const jsonAl = (v: FormDataEntryValue | null): unknown => { try { return JSON.parse(String(v ?? "null")); } catch { return null; } };

/** 522: ekli soru — form: soru, yol, raporNo, canli (JSON), ek (en çok 4 dosya, toplam 4 MB) */
export async function sayEkliSorEylemi(form: FormData): Promise<SayYaniti> {
  const bitis = Date.now() + BITIS_MS;
  const o = await oturum();
  if (!o) return RED;
  const ekler = await ekleriAl(form);
  if ("durum" in ekler) return ekler;
  const raporNo = form.get("raporNo");
  return sor(o, String(form.get("soru") ?? ""), form.get("yol"), typeof raporNo === "string" && raporNo ? raporNo : undefined, jsonAl(form.get("canli")), ekler,
    jsonAl(form.get("kurucu")), bitis, form.get("kaydedilmemis") === "1");
}

type Oturum = NonNullable<Awaited<ReturnType<typeof oturum>>>;

/** yapay zekâ çağrısı, eylemin bitiş zamanına göre (tek çağrı en çok CAGRI_MS, kalan süreyi aşmaz; kalan EN_AZ_MS'den azsa çağrı yapılmaz —
    2026-10-16: 5 sn tabanı bitişi aşıp işlevin 55 sn'sini geçebiliyordu). K7: internet araması bu modelde kabul edilmezse (400 — araç) aramasız bir
    kez daha (ayırma aynı; ücret yalnız gerçek çağrıdan) */
async function cagir(istek: OkumaIstegi, anahtar: string, bitis: number): Promise<OkumaYaniti> {
  const sure = () => Math.min(CAGRI_MS, bitis - Date.now());
  if (sure() < EN_AZ_MS) return SURE_DOLDU;
  let y = await anthropicCagir(istek, anahtar, sure());
  if (y.durum === "hata" && y.kod === 400 && /web_search|tool/i.test(y.ileti ?? "")) {
    const araclar = ((istek.govde.tools ?? []) as { name?: string }[]).filter((t) => t.name !== "web_search");
    const govde: Record<string, unknown> = { ...istek.govde, tools: araclar };
    if (!araclar.length) delete govde.tools;
    if (araclar.length !== ((istek.govde.tools ?? []) as unknown[]).length) y = sure() < EN_AZ_MS ? SURE_DOLDU : await anthropicCagir({ govde } satisfies OkumaIstegi, anahtar, sure());
  }
  return y;
}

/** 2026-10-16: bu eylemin açık ayırmaları — kayıt bitmeden beklenmeyen bir hata olursa bırakılır (çağrı yapıldıysa ücretli: sonucu bilinmiyor);
    sayac: ilk çağrı mesajı sayar, aynı mesajın ek çağrıları (düzeltme, döngü turu) saymaz */
interface AcikAyirma { ay: string; ust: number; ucret: "yok" | "bilinmiyor"; sayac: "mesaj" | "yok" }
async function ayirmalariBirak(o: Oturum, acik: AcikAyirma[]): Promise<void> {
  for (const a of acik.splice(0)) {
    try { await oturumIslemi(o, (db) => sayBirak(db, a, a.ucret, a.sayac)); } catch { /* veritabanına ulaşılamıyor — asıl hata yukarı gider */ }
  }
}

/** D (2026-10-15 — bir cevapta S.A.Y aracı çağırmadan "Yaptım" dedi): cevap araç çağırmadan iş yapıldığını söylüyorsa (ve bu mesajın işinde yapılan
    bir şey yoksa) kullanıcıya gösterilmez — S.A.Y'a düzeltme turu gider (işi yap ya da nedenini söyle); düzeltilmiş cevap yeni iş isterse döngü
    sürer. Ayırması ayrı; düzeltme yapılamazsa (sınır, süre, çağrı düştü) sahte cevap yerine doğru olan (SAHTE_YEDEK) yazılır. 2026-10-16: yalnız
    istekte iş yapan bir araç varken (isAraciVar — araçsız istekte "yazdım" bilgi veren cevaptır); düşen düzeltme çağrısı mesajı yeniden saymaz.
    2. adım a (kasıtlı): bu eylem her istekte işlem dizinini verir — "islemler" / "islem" her sayfada iş yapan araç, denetim her sayfada */
async function duzelt(o: Oturum, h: { istek: OkumaIstegi; anahtar: string; ay: string; ust: number }, govde: unknown, yapildi: boolean, bitis: number,
  acik: AcikAyirma[]): Promise<{ govde: unknown; ek: SayEkCagri }> {
  if (!isAraciVar(h.istek.govde) || !sahteYapildi(govde, yapildi)) return { govde, ek: { onceki: [], ust: 0 } };
  const yedek = { govde, ek: { onceki: [], ust: 0, yedek: SAHTE_YEDEK } };
  if (bitis - Date.now() < EN_AZ_MS) return yedek;
  const ust = await oturumIslemi(o, (db) => sayEkAyir(db, h.ay, h.ust));
  if (ust === null) return yedek;
  const a: AcikAyirma = { ay: h.ay, ust, ucret: "bilinmiyor", sayac: "yok" };
  acik.push(a);
  const y = await cagir(duzeltmeIstegi(h.istek, govde), h.anahtar, bitis);
  if (y.durum === "hata") {
    await oturumIslemi(o, (db) => sayBirak(db, a, y.ucret, "yok"));
    acik.splice(acik.indexOf(a), 1);
    return yedek;
  }
  return { govde: y.govde, ek: { onceki: [govde], ust } };
}

async function sor(o: Oturum, soru: unknown, yol: unknown, raporNo: unknown, canli: unknown, ekler: SayEkDosyasi[], kurucuHam: unknown, bitis: number,
  kaydedilmemis = false): Promise<SayYaniti> {
  if (typeof soru !== "string") return { durum: "red", neden: "Sorunuzu yazın." };
  const yer = yolAl(yol), no = typeof raporNo === "string" ? raporNo : null;
  const h = await oturumIslemi(o, (db) => saySorHazirla(db, o, soru, yer, new Date(), no, canliOku(canli), ekler, kurucuOku(kurucuHam), ISLEM_DIZINI));
  if (h.durum !== "hazir") return h;
  return surdur(o, { tur: "soru", h }, { yol: yer, ekler, bitis, taban: { raporNo: no && no.length <= 60 ? no : null, canli, kurucu: kurucuHam, kaydedilmemis }, onceki: [] });
}

/* ── 2026-10-16 (2. adım a): BU EYLEMDEKİ DÖNGÜ — yapay zekâ çağrısı → (sunucu komutları burada çalışır → sonuç S.A.Y'a → yeni çağrı)* → cevap
   ya da ekran komutları. Her çağrı kendi ayırmasıyla (kapanış gerçek maliyetle; ilk çağrı mesajı sayar, ötekiler saymaz) ── */
type Hazir = { tur: "soru"; h: SaySorHazir } | { tur: "is"; h: SayIsHazir };
/** sonraki turun girdisi için: ekranın gönderdiği alanlar (rapor no, canlı hâl, format taslağı, kaydedilmemiş) ve önceki adımları (ÇALIŞTIRILMAZ) */
interface DonguYeri { yol: string; ekler: SayEkDosyasi[]; bitis: number; taban: Record<string, unknown>; onceki: unknown[] }

/** işlemin ortamı: kişi, firma, depo, adres ve e-posta OTURUMDAN (yapay zekânın girdisinden değil); her işlem kendi kiracı işleminde. kaydedilmemis:
    ekranın bildirdiği (yetki değil — yalnız kişinin kendi ekranı korunur); epostaSirada: işlem e-posta kuyruğa yazdı (gönderim yanıttan sonra) */
function islemOrtami(o: Oturum, s: { ekrandakiRapor: string | null; kaydedilmemis: boolean; epostaSirada: () => void }): IslemOrtami {
  return {
    islet: <T,>(is: (db: Sorgulayici) => Promise<T>) => oturumIslemi(o, is),
    kim: o, firmaId: o.kiraci.firmaId, depo, kok: firmaAdresi(o.kiraci.kisaAd), ekrandakiRapor: s.ekrandakiRapor, kaydedilmemis: s.kaydedilmemis,
    epostaGonder: (kaynak, id) => { s.epostaSirada(); epostalariSonraGonder(o.kiraci, kaynak, id); },
    hata: (e, ad) => hataYaz(o, e, `say.islem.${ad}`),
  };
}
function hataYaz(o: Oturum, e: unknown, yer: string): void {
  void hataKaydet({ kaynak: "sunucu", mesaj: e instanceof Error ? e.message : String(e), yigin: e instanceof Error ? e.stack ?? null : null,
    yer, alan: o.kiraci.kisaAd, hesap: o.id });
}

/** tek yapay zekâ çağrısı ve kaydı (soru: ilk çağrı — düşerse soru geçmişte kalır, red; tur: döngünün devamı — düşerse yapılanlar + neden yazılır) */
async function cagriTuru(o: Oturum, x: Hazir, bitis: number): Promise<SayYaniti> {
  const h = x.h;
  const acik: AcikAyirma[] = [{ ay: h.ay, ust: h.ust, ucret: "bilinmiyor", sayac: x.tur === "soru" ? "mesaj" : "yok" }];
  try {
    const y = await cagir(h.istek, h.anahtar, bitis);
    if (y.durum === "hata") {
      acik.length = 0;
      if (x.tur === "is") return await oturumIslemi(o, (db) => sayIsSonucuKaydet(db, x.h, null, y.ucret, { onceki: [], ust: 0 }, y.neden));
      await oturumIslemi(o, (db) => sayBirak(db, h, y.ucret));
      return { durum: "red", neden: y.neden };
    }
    const d = await duzelt(o, h, y.govde, x.tur === "is" ? x.h.yapildi : false, bitis, acik);
    const r = await oturumIslemi(o, (db) => (x.tur === "is" ? sayIsSonucuKaydet(db, x.h, d.govde, "yok", d.ek) : saySorKaydet(db, x.h, d.govde, d.ek)));
    acik.length = 0;
    return r;
  } catch (e) {
    await ayirmalariBirak(o, acik);
    throw e;
  }
}

/** 2026-10-16 (2. adım a incelemesi): aynı cevapta ekran komutundan SONRA gelen işlem ekranın işi bitmeden çalışmaz — S.A.Y'ın çağırdığı sıra korunur
    (ör. onaya_gonder → plan_tamamla, raporu_kaydet → plan_kunye_guncelle); yapılmadı nedeniyle döner, S.A.Y ekranın sonucunu görünce yeniden çağırır */
const SIRA_BEKLER = "Yapılmadı: aynı cevapta bundan önce ekranda yapılacak bir iş vardı (sıra korunur); ekranın sonucunu gördükten sonra bu işlemi yeniden çağır.";
/** 2026-10-16 (2. adım a incelemesi): sunucu işlem yaptıktan sonra eylem beklenmedik biçimde düşerse yapılanlar kaybolmasın (iletinin nedeni) */
const BEKLENMEYEN_YARIM = "beklenmeyen bir sorun oldu; S.A.Y işi sürdüremedi.";

/** döngüyü bu eylemde sürdürür: sunucu komutlarını çalıştırır, sonucu S.A.Y'a döndürür; ekran komutu gelince (ya da süre azalınca, e-posta
    kuyruğa yazılınca) ekrana bırakır. Sunucu işlem yaptıktan sonra beklenmeyen bir hata olursa eylem düşmez: yapılanlar sayılarla yazılır ("İş yarıda
    kaldı"), adımlar ve "yenile" ekrana döner (yoksa kişi işin yapıldığını öğrenmez, aynı isteği yineleyince iş iki kez yapılır) */
async function surdur(o: Oturum, ilk: Hazir, d: DonguYeri): Promise<SayYaniti> {
  const sunucu: SayAdimi[][] = [], iletiler: SohbetIletisi[] = [];
  let x = ilk, yenile = false, eposta = false;
  const kaydedilmemis = d.taban.kaydedilmemis === true;
  const ekle = (l: readonly SohbetIletisi[]) => { for (const m of l) if (!iletiler.some((y) => y.id === m.id)) iletiler.push(m); };
  const yanit = (ek: Partial<Extract<SayYaniti, { durum: "tamam" }>> = {}): SayYaniti =>
    ({ durum: "tamam", iletiler, ...(sunucu.length ? { adimlar: sunucu } : {}), ...(yenile ? { yenile: true } : {}), ...ek });
  try {
    for (;;) {
      const r = await cagriTuru(o, x, d.bitis);
      if (r.durum !== "tamam") return r;
      ekle(r.iletiler);
      yenile ||= !!r.yenile;
      const komutlar = r.komutlar ?? [];
      if (!komutlar.length) return yanit();
      /* sunucu komutları (işlemler) burada, S.A.Y'ın sırasıyla; ekran komutlarının yeri null — ondan sonraki işlem ekranın işini bekler */
      const ortam = islemOrtami(o, { ekrandakiRapor: x.h.rapor ?? null, kaydedilmemis, epostaSirada: () => { eposta = true; } });
      const hazir: (IsOzeti | null)[] = [];
      let ekranda = false;
      for (const k of komutlar) {
        if (!sunucuKomutuMu(k)) { ekranda = true; hazir.push(null); continue; }
        hazir.push(ekranda && k.tur === "islem" ? islemOzeti(k.ad || "islem", null, { tamam: false, neden: SIRA_BEKLER })
          : await sunucuKomutu(ISLEM_KATALOGU, ortam, k, modulAdi));
      }
      yenile ||= komutlar.some((k, i) => k.tur === "islem" && (hazir[i]?.yazildi ?? 0) > 0);
      if (ekranda) return yanit({ komutlar, hazir });
      sunucu.push(komutlar.map((k, i) => ({ komut: k, ozet: hazir[i] as IsOzeti })));
      /* süre azaldıysa ya da e-posta kuyruğa yazıldıysa iş ekranın yeni turunda sürer: eylemin işlev süresi aşılmasın, yanıttan sonraki e-posta
         gönderimine (after) süre kalsın — yoksa gönderim gece işini bekler */
      if (eposta || d.bitis - Date.now() < DEVAM_MS) return yanit({ komutlar: [], devam: true });
      const girdi = { ...d.taban, adimlar: [...d.onceki, ...sunucu] };
      const s = await oturumIslemi(o, (db) => sayIsSonucuHazirla(db, o, girdi, d.yol, new Date(), d.ekler, ISLEM_DIZINI));
      if (s.durum !== "hazir") {
        const y = await oturumIslemi(o, (db) => sayIsYarim(db, o, girdi, d.yol, s.neden));
        if (y.durum === "tamam") ekle(y.iletiler);
        return y.durum === "tamam" || sunucu.length ? yanit() : y;
      }
      x = { tur: "is", h: s };
    }
  } catch (e) {
    if (!sunucu.length) throw e;
    hataYaz(o, e, "say.surdur");
    try {
      const y = await oturumIslemi(o, (db) => sayIsYarim(db, o, { ...d.taban, adimlar: [...d.onceki, ...sunucu] }, d.yol, BEKLENMEYEN_YARIM));
      if (y.durum === "tamam") ekle(y.iletiler);
    } catch { /* ileti de yazılamadı — yapılanlar (adımlar) ve yenileme yine ekrana döner */ }
    return yanit();
  }
}

/** 557 → A: ekranın yaptığı işin sonucu — döngünün bütün adımları (yazılan, zaten öyle olan, eklenen satır, yazılamayan + neden) ve ekranın canlı
    hâli. S.A.Y yeni iş isterse komutlar döner (ekran yapar, yine buraya gelir); bitirirse cevabı yazılır (çağrı düşerse sonucu sunucu yazar) */
export async function sayIsSonucuEylemi(girdi: unknown, yol: unknown): Promise<SayYaniti> {
  const bitis = Date.now() + BITIS_MS;
  const o = await oturum();
  if (!o) return RED;
  return isSonucu(o, girdi, yolAl(yol), [], bitis);
}

/** 2026-10-16: sorunun ekleriyle döngü turu — form: girdi (JSON), yol, ek (sorunun ekleri; yine saklanmaz) — S.A.Y kaynağı her turda görür */
export async function sayIsSonucuEkliEylemi(form: FormData): Promise<SayYaniti> {
  const bitis = Date.now() + BITIS_MS;
  const o = await oturum();
  if (!o) return RED;
  const ekler = await ekleriAl(form);
  if ("durum" in ekler) return ekler;
  return isSonucu(o, jsonAl(form.get("girdi")), yolAl(form.get("yol")), ekler, bitis);
}

async function isSonucu(o: Oturum, girdi: unknown, yol: string, ekler: SayEkDosyasi[], bitis: number): Promise<SayYaniti> {
  const h = await oturumIslemi(o, (db) => sayIsSonucuHazirla(db, o, girdi, yol, new Date(), ekler, ISLEM_DIZINI));
  /* 2026-10-16: tur reddedildi (sınır doldu, S.A.Y kapandı, anahtar yok) — önceki turlarda yapılanlar ekranda: sayılarla + nedeni yazılır */
  if (h.durum !== "hazir") return oturumIslemi(o, (db) => sayIsYarim(db, o, girdi, yol, h.neden));
  /* 2. adım a: ekranın adımları yalnız konuşmaya girer (hazırlıkta okundu); sonraki turlar onlara bu eylemin sunucu adımlarını ekler */
  const taban = (girdi && typeof girdi === "object" && !Array.isArray(girdi) ? girdi : {}) as Record<string, unknown>;
  return surdur(o, { tur: "is", h }, { yol, ekler, bitis, taban, onceki: Array.isArray(taban.adimlar) ? taban.adimlar : [] });
}

/** 2026-10-16: ekran döngünün turunu gönderemedi (bağlantı koptu, işlev süresi doldu) — yapay zekâ çağrılmadan yapılanlar sayılarla + "İş yarıda
    kaldı" (nedeni sunucunun metni); S.A.Y zaten cevap yazdıysa yazılmaz */
export async function sayIsYarimEylemi(girdi: unknown, yol: unknown): Promise<SayYaniti> {
  const o = await oturum();
  if (!o) return RED;
  return oturumIslemi(o, (db) => sayIsYarim(db, o, girdi, yolAl(yol), ULASILAMADI));
}

export async function sayTemizleEylemi(): Promise<{ durum: "tamam"; silinen: number } | { durum: "red"; neden: string }> {
  const o = await oturum();
  if (!o) return { durum: "red", neden: "Oturumunuz kapandı." };
  return { durum: "tamam", silinen: await oturumIslemi(o, (db) => sayTemizle(db)) };
}
