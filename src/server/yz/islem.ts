/* S.A.Y İŞLEM KATALOĞU VE YÜRÜTÜCÜSÜ — çekirdek (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım a — reisim: "zaten kaynak kodun içinde,
   sayfalarda gezmesine gerek yok", "bu sayfa açık değil falan demesin"). Uygulamanın sunucu işlevleri — tuşların çağırdığı işlevler ve sayfaların
   okuma işlevleri — S.A.Y'ın aracı olur. Her modül çağrılabilen işlemlerini kendi dosyasında bildirir (src/modules/<modül>/say-islemleri.ts; tek kayıt
   src/modules/say/islem-katalogu.ts): ad, tek satır tarif, girdi şeması (modülün VAR OLAN zod şemasından — kopyası değil; JSON şeması zod'dan
   üretilir), oku / yaz, çalıştırıcı (modülün VAR OLAN işlevini oturumdaki kişiyle çağırır — tuşun çağırdığının aynısı). Yetki, kurallar, sürüm
   kilidi ve değer denetimi o işlevin içinde; burada yeni kural yok.
   · ARAÇ BİÇİMİ (B): iki GENEL araç — "islemler" (katalogdan işlem ve şema) + "islem" (ad + girdi → çalıştır) (src/server/yz/say.ts ISLEM_ARACLARI).
     Her işlem ayrı araç olsaydı: araç listesi her modülle büyür (bütün modüller gelince yüzü aşan araç, on binlerce token şema her istekte), Haiku'nun
     doğru aracı seçmesi zorlaşır, sayfaya göre değişen araç listesi önbellek önekini bozar. İki genel araçla tanımlar her istekte AYNI (önbellek öneki
     sabit), işlemlerin dizini önbellekli talimatta (katalogDizini), şemalar yalnız gerektiğinde konuşmaya girer. Bedeli: yeni bir işlemin şeması için
     bir tur — geçersiz girdide şema sonuçla kendiliğinden döner (çoğu zaman o tur da gerekmez).
   · YÜRÜTÜCÜ SUNUCUDA (islemYurut): işlem katalogda olmalı; girdi işlemin zod şemasıyla doğrulanır — geçmezse çalıştırıcı ÇAĞRILMAZ, alan alan
     nedenler ve şema döner; kişi, firma ve yetki ORTAMDAN (oturumdan; girdideki hiçbir alan kimlik olmaz); her işlem kendi veritabanı işleminde
     (beklenmeyen hata işlemi geri alır, S.A.Y'a nedeniyle döner); sonuç kısa JSON (büyük metinler kırpılır, listeler sayfalı — "sonraki").
     Ekranın gönderdiği adımlardaki işlemler YENİDEN çalıştırılmaz — yürütücü yalnız yapay zekâ hizmetinin bu eylemde döndürdüğü çağrıyı çalıştırır.
   · Sır / anahtar yazan işlemler (Firma ayarları › yapay zekâ anahtarı, e-posta anahtarı) kataloğa KONMAZ: girdi sohbet geçmişine ve yapay zekâ
     sağlayıcısına gider. */
import { z } from "zod";
import { hatalar, type DogrulamaHatalari } from "../../sema/ortak.ts";
import type { Sorgulayici } from "../db/kiraci.ts";
import type { Depo } from "../dosya/depo.ts";
import type { YetkiHesabi } from "../yetki/canDo.ts";
import type { IsOzeti, SayKomutu } from "./say.ts";

/** işlemi yapan kişi — oturumdaki hesap (rolleri ve firma matrisi veritabanından) */
export interface IslemKisisi extends YetkiHesabi { ad: string }
/** çalıştırıcının ortamı: HEPSİ sunucudan (oturum, kiracı, depo) — girdiden değil */
export interface IslemBaglami {
  db: Sorgulayici;
  kim: IslemKisisi;
  firmaId: string;
  depo: () => Depo;
  /** firmanın adresi (e-postadaki bağlantılar) — yoksa null */
  kok: string | null;
  /** ekranda açık ve yazılabilir rapor (sunucunun bu turda doğruladığı): ona işlemle değil ekranın aracıyla yazılır (kaydedilmemiş değişiklikler) */
  ekrandakiRapor: string | null;
  /** 2026-10-16 (2. adım a incelemesi): ekranda kaydedilmemiş değişiklik var (ekranın bildirdiği — yetki değil; yalnız kişinin kendi ekranı
      korunur): açık rapora da yazan işlem (künye güncelle, durum değiştir) önce ekranın kaydını ister — yoksa ekranın Kaydet'i sürüm çakışması alır */
  kaydedilmemis: boolean;
  /** kuyruğa yazılan e-postaların yanıttan sonra gönderimi (plan açılınca — eylemin yaptığı gibi) */
  epostaGonder: (kaynak: string, id: string) => void;
}
/** yürütücünün ortamı: işlemi kiracı işleminde koşturan (oturumIslemi) + çalıştırıcının ortamı + beklenmeyen hatanın kaydı */
export interface IslemOrtami extends Omit<IslemBaglami, "db" | "kaydedilmemis"> {
  islet: <T>(is: (db: Sorgulayici) => Promise<T>) => Promise<T>;
  hata?: (e: unknown, ad: string) => void;
  kaydedilmemis?: boolean;
}
/** degisiklik: false — yazma işlemi çalıştı ama hiçbir şey değişmedi (ör. rapor_yaz'da girişler zaten öyleydi): iş sayılmaz (döngünün güvenliği
    ve sahte "yaptım" denetimi doğru görsün, sayfa boşuna yenilenmesin) */
export type IslemCevabi =
  | { tamam: true; bildirim?: string; sonuc?: Record<string, unknown>; degisiklik?: false }
  | { tamam: false; neden: string; hatalar?: DogrulamaHatalari; uyarilar?: Record<string, string>; eksikler?: string[] };

export interface Islem {
  /** araçta kullanılan ad (küçük harf, rakam, alt çizgi; katalogda tekil) */
  ad: string;
  /** modülün §3.1 numarası (dizinde gruplanır) */
  modul: number;
  /** tek satır Türkçe tarif (önbellekli dizinde) */
  tarif: string;
  tur: "oku" | "yaz";
  /** girdi şeması — modülün şemasından (kilit: tests/say-islem-katalog.test.ts) */
  girdi: z.ZodType;
  /** girdinin türediği VAR OLAN şemalar (modülün sema.ts'i, src/sema/ortak.ts, liste süzgeci) — her biri (ya da alanları) girdinin ağacında */
  kaynak: readonly z.ZodType[];
  /** çağrılan modül işlevi (kilit: modülün sunucu dosyasının dışa açtığı işlev; çalıştırıcı onu çağırır) */
  islev: (...a: never[]) => unknown;
  /** veri: şemadan geçmiş girdi; ham: girdinin kendisi (modül işlevi kendi şemasıyla yeniden doğrular — dönüşüm iki kez uygulanmasın) */
  calistir: (b: IslemBaglami, veri: unknown, ham: unknown) => Promise<IslemCevabi>;
}
/** işlem bildirimi (tür çıkarımı için; katalogda tür silinir) */
export function islem<S extends z.ZodType>(t: Omit<Islem, "girdi" | "calistir"> & {
  girdi: S; calistir: (b: IslemBaglami, veri: z.output<S>, ham: z.input<S>) => Promise<IslemCevabi>;
}): Islem {
  return t as unknown as Islem;
}

/* ── modül işlevlerinin sonucu → S.A.Y'ın cevabı (iletiler tuşların eylemleriyle aynı anlamda) ── */
const NEDEN: Readonly<Record<string, string>> = {
  yetkisiz: "Bu işlem için yetkiniz yok.",
  cakisma: "Kayıt bu arada değişti (sürüm eşleşmedi); kaydı yeniden getirip güncel sürümle dene.",
  yok: "Kayıt bulunamadı ya da bu kullanıcı göremiyor.",
};
export const GORUNMEZ = NEDEN.yok;
/** 2026-10-16 (2. adım a incelemesi): işlem ekranda açık raporun sunucudaki hâlini de değiştirecek ve ekranda kaydedilmemiş değişiklik var — önce
    ekranın kaydı (yoksa sürüm ilerler, ekranın Kaydet'i çakışma alır, kaydedilmemiş değişiklik kaybolur) */
export const EKRAN_KAYDEDILMEMIS = "Ekranda açık raporun kaydedilmemiş değişikliği var ve bu işlem o rapora da yazar: önce raporu_kaydet ile kaydet, "
  + "sonra bu işlemi yeniden çağır.";
/** etkilenen raporlar arasında ekranda açık, kaydedilmemiş değişikliği olan rapor var mı */
export const ekranRaporuKirli = (b: Pick<IslemBaglami, "ekrandakiRapor" | "kaydedilmemis">, raporlar: readonly string[]): boolean =>
  b.kaydedilmemis && !!b.ekrandakiRapor && raporlar.includes(b.ekrandakiRapor);
const hataOzeti = (h: Readonly<Record<string, string>>) => Object.entries(h).map(([k, x]) => (k === "_" ? x : `${k}: ${x}`)).join("; ");
/** modülün yazma sonucu ({ durum: tamam | gecersiz | uyari | eksik | red | yetkisiz | cakisma | yok }) → cevap. tamam: başarıdaki bildirim / sonuç */
export function yazmaCevabi(r: { durum: string } & Record<string, unknown>, tamam: { bildirim?: string; sonuc?: Record<string, unknown> } = {}): IslemCevabi {
  switch (r.durum) {
    case "tamam": {
      const sonuc = tamam.sonuc ?? Object.fromEntries(["id", "no", "surum", "sonraki"].filter((k) => r[k] !== undefined && r[k] !== null).map((k) => [k, r[k]]));
      const bildirim = tamam.bildirim ?? (typeof r.bildirim === "string" ? r.bildirim : undefined);
      return { tamam: true, ...(bildirim ? { bildirim } : {}), ...(Object.keys(sonuc).length ? { sonuc } : {}) };
    }
    case "gecersiz": {
      const h = (r.hatalar ?? {}) as DogrulamaHatalari;
      return { tamam: false, neden: `Girdi geçersiz: ${hataOzeti(h)}`, hatalar: h };
    }
    case "uyari": {
      /* 2026-10-16 (2. adım a incelemesi): yönlendirmesiz — S.A.Y'a soru sordurmaz (reisim: onay sorusu yok); kaydetmenin yolu yalnız bilgi */
      const u = (r.uyarilar ?? {}) as Record<string, string>;
      return { tamam: false, neden: `Uyarı (engel değil): ${hataOzeti(u)} Kaydetmek için aynı girdiyle onay: true.`, uyarilar: u };
    }
    case "eksik": {
      const l = Array.isArray(r.eksikler) ? (r.eksikler as { ad?: unknown }[]).map((x) => String(x.ad ?? "")).filter(Boolean) : [];
      return { tamam: false, neden: `Zorunlu alanlar eksik (${l.length}): ${l.slice(0, 50).join(", ")}${l.length > 50 ? " …" : ""}`, eksikler: l };
    }
    case "red": return { tamam: false, neden: typeof r.neden === "string" ? r.neden : "İşlem yapılamadı." };
    default: return { tamam: false, neden: NEDEN[r.durum] ?? "İşlem yapılamadı." };
  }
}

/* ── sonucun kısa biçimi (kırpma ve sayfalama — sınır değil, sayfalı okuma) ── */
/** uzun metni kırpar (sonuna "…") */
export const kirp = (s: string | null | undefined, n = 2_000): string | null => (s === null || s === undefined ? null : s.length > n ? `${s.slice(0, n)}…` : s);
/** modülün sayfalı listesinin sayıları → S.A.Y'ın imleci (sonraki: istenecek sayfa; son sayfadaysa null) */
export const sayfaBilgisi = (l: { adet: number; sayfa: number; sayfaSayisi: number }) =>
  ({ toplam: l.adet, sayfa: l.sayfa, sayfa_sayisi: l.sayfaSayisi, sonraki: l.sayfa < l.sayfaSayisi ? l.sayfa + 1 : null });
/** modül işlevi bütün listeyi döndürüyorsa (ekran da öyle okuyor) S.A.Y'a sayfa sayfa */
export function sayfala<T>(l: readonly T[], sayfa: number, boy = 20): { satirlar: T[]; bilgi: ReturnType<typeof sayfaBilgisi> } {
  const sayfaSayisi = Math.max(1, Math.ceil(l.length / boy)), s = Math.min(Math.max(1, Math.trunc(sayfa) || 1), sayfaSayisi);
  return { satirlar: l.slice((s - 1) * boy, s * boy), bilgi: sayfaBilgisi({ adet: l.length, sayfa: s, sayfaSayisi }) };
}
/** uzun metin S.A.Y'a sayfa sayfa (satır sınırında; sınır değil — "sonraki" ile hepsi okunur): istenen sayfa ve imleç */
export function metinSayfasi(metin: string, sayfa: number, boy = 60_000): { metin: string; bilgi: { sayfa: number; sayfa_sayisi: number; sonraki: number | null } } {
  const sayfalar: string[] = [];
  let p = "";
  for (const satir of metin.split("\n")) {
    if (p && p.length + 1 + satir.length > boy) { sayfalar.push(p); p = ""; }
    p = p ? `${p}\n${satir}` : satir;
  }
  sayfalar.push(p);
  const s = Math.min(Math.max(1, Math.trunc(sayfa) || 1), sayfalar.length);
  return { metin: sayfalar[s - 1], bilgi: { sayfa: s, sayfa_sayisi: sayfalar.length, sonraki: s < sayfalar.length ? s + 1 : null } };
}
/** Türkçe küçük harfle "içerir" (aranan boşsa her şey) — ekranın arama kutusuyla aynı anlam */
export const trIcerir = (metin: string, aranan: string | null | undefined): boolean =>
  !aranan?.trim() || metin.toLocaleLowerCase("tr").includes(aranan.trim().toLocaleLowerCase("tr"));

/* ── katalog ── */
const AD = /^[a-z][a-z0-9_]{2,60}$/;
/** kayıt: adlar tekil ve biçimli, tarif tek satır (bozuksa uygulama açılmaz — kilit testte de) */
export function katalogKur(l: readonly Islem[]): readonly Islem[] {
  const gor = new Set<string>();
  for (const t of l) {
    if (!AD.test(t.ad)) throw new Error(`S.A.Y işlem adı biçimsiz: ${t.ad}`);
    if (gor.has(t.ad)) throw new Error(`S.A.Y işlem adı iki kez: ${t.ad}`);
    if (!t.tarif.trim() || /\n/.test(t.tarif)) throw new Error(`S.A.Y işleminin tarifi tek satır olmalı: ${t.ad}`);
    if (!t.kaynak.length) throw new Error(`S.A.Y işleminin girdisi modülün şemasından türemeli: ${t.ad}`);
    gor.add(t.ad);
  }
  return Object.freeze([...l]);
}
const semalar = new WeakMap<Islem, Record<string, unknown>>();
/** girdinin JSON şeması (zod'dan; girdi tarafı — dönüşümlerden önceki biçim) */
export function islemSemasi(t: Islem): Record<string, unknown> {
  let s = semalar.get(t);
  if (!s) {
    s = z.toJSONSchema(t.girdi, { io: "input", unrepresentable: "any" }) as Record<string, unknown>;
    delete s.$schema;
    semalar.set(t, s);
  }
  return s;
}
/** önbellekli talimattaki dizin: modül modül "- ad (oku / yaz): tarif" — sıra kayıttaki sıra (her istekte aynı metin) */
export function katalogDizini(l: readonly Islem[], modulAdi: (no: number) => string): string {
  const gruplar = new Map<number, Islem[]>();
  for (const t of l) gruplar.set(t.modul, [...(gruplar.get(t.modul) ?? []), t]);
  /* 2026-10-26 (reisim: "haikuyu eğitmemiz lazım"): yalnız adlar, modül başına bir satır — 148 işlemin tarifi talimatı 25 000 karaktere çıkarıyordu,
     küçük model işiyle ilgisiz listede kayboluyordu; tarif ve şema islemler aracıyla (adlar) */
  return [...gruplar].map(([no, x]) => `${modulAdi(no)}: ${x.map((t) => t.ad).join(", ")}`).join("\n");
}
/** "islemler" aracı: adlarla istenen işlemler şemalarıyla; modül / sözle süzülen az sayıdaysa (en çok 8) şemalarıyla, çoksa ad ve tarifle */
export function islemleriListele(l: readonly Islem[], s: { adlar?: readonly string[]; modul?: string; ara?: string }, modulAdi: (no: number) => string): Record<string, unknown> {
  const ozet = (t: Islem, sema: boolean) => ({ ad: t.ad, modul: modulAdi(t.modul), tur: t.tur, tarif: t.tarif, ...(sema ? { girdi: islemSemasi(t) } : {}) });
  if (s.adlar?.length) {
    const bulunan = s.adlar.map((a) => l.find((t) => t.ad === a)).filter((t): t is Islem => !!t);
    const yok = s.adlar.filter((a) => !l.some((t) => t.ad === a));
    return { islemler: bulunan.map((t) => ozet(t, true)), ...(yok.length ? { bilinmeyen: yok } : {}) };
  }
  const secilen = l.filter((t) => trIcerir(modulAdi(t.modul), s.modul) && (trIcerir(t.ad, s.ara) || trIcerir(t.tarif, s.ara)));
  const sema = (!!s.modul || !!s.ara) && secilen.length <= 8;
  return { islemler: secilen.map((t) => ozet(t, sema)), ...(sema ? {} : { not: "Şema için adlar ile iste." }) };
}

/* ── yürütücü ── */
const BEKLENMEYEN = "Beklenmeyen bir sorun oldu; işlem yapılmadı (veritabanı işlemi geri alındı).";
/** 2026-10-16 (2. adım b): çalıştırıcı işi GERİ ALDIRIP nedenini söyletmek isterse (modül işlevi yarıda kalınca hata fırlatıyorsa — ör. eski sürüme
    geri dönüş yayınlanamadı: GeriDonusIptal) bunu fırlatır: veritabanı işlemi geri alınır, S.A.Y'a cevap olduğu gibi döner (hata kaydı yok) */
export class IslemGeriAl extends Error {
  cevap: IslemCevabi;
  constructor(cevap: IslemCevabi) { super("işlem geri alındı"); this.cevap = cevap; }
}
/** bir işlemi çalıştırır: katalogda mı → girdi şemadan geçiyor mu (geçmezse çalıştırıcı çağrılmaz) → kiracı işleminde, ORTAMIN kişisi ve firmasıyla */
export async function islemYurut(katalog: readonly Islem[], o: IslemOrtami, ad: string, girdi: unknown):
  Promise<{ islem: Islem | null; cevap: IslemCevabi; sema?: Record<string, unknown> }> {
  const t = katalog.find((x) => x.ad === ad) ?? null;
  if (!t) return { islem: null, cevap: { tamam: false, neden: `Böyle bir işlem yok: "${ad}". Dizine ya da islemler aracına bak.` } };
  const g = t.girdi.safeParse(girdi ?? {});
  if (!g.success) {
    const h = hatalar(g.error);
    return { islem: t, cevap: { tamam: false, neden: `Girdi şemaya uymuyor: ${hataOzeti(h)}`, hatalar: h }, sema: islemSemasi(t) };
  }
  try {
    const cevap = await o.islet((db) => t.calistir({ db, kim: o.kim, firmaId: o.firmaId, depo: o.depo, kok: o.kok, ekrandakiRapor: o.ekrandakiRapor,
      kaydedilmemis: o.kaydedilmemis === true, epostaGonder: o.epostaGonder }, g.data, girdi ?? {}));
    return { islem: t, cevap };
  } catch (e) {
    if (e instanceof IslemGeriAl) return { islem: t, cevap: e.cevap };
    o.hata?.(e, t.ad);
    return { islem: t, cevap: { tamam: false, neden: BEKLENMEYEN } };
  }
}

/* ── açık sayfa (2026-10-31, K2 + M4 — sunum "S.A.Y'a tam yetenek"): her modül kendi ayrıntı sayfalarını tanımlar (desen → modülün "_getir" okuma
   işlemi); çekirdek işlemi KİŞİNİN yetkisiyle, aynı veritabanı işleminde çalıştırır ve sonuçtan yalnız tanıtıcı alanları alır (no, kod, ad, durum,
   tarih; tesis / müşteri / tür / planın adı). Kişisel numaralar (T.C. kimlik, telefon, SGK) ve künye değerleri alana girmez, uzun rakam dizisi düşer. ── */
export interface SayfaTanimi {
  /** sayfanın yolu (sorgu ve çapa hariç); yakalanan gruplar girdiye */
  desen: RegExp;
  /** sayfa notundaki kayıt türü ("Plan", "Personel" …) */
  tur: string;
  /** modülün okuma işlemi (katalogda, tur "oku") */
  islem: string;
  girdi: (...gruplar: string[]) => Record<string, unknown>;
}
const SAYFA_ALANLARI = ["no", "kod", "plaka", "ad", "unvan", "kisa", "durum", "baslangic", "bitis", "tarih"] as const;
const SAYFA_BAGLARI = ["tesis", "musteri", "tur", "plan"] as const;
const deger = (x: unknown): string | null => {
  if (typeof x === "number" && Number.isFinite(x)) return String(x);
  if (typeof x !== "string") return null;
  const s = x.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  return s && !/\d{10,}/.test(s.replace(/[\s-]/g, "")) ? s.slice(0, 80) : null;
};
/** okuma işleminin sonucundan sayfa notunun tanıtıcı alanları (saf) */
export function sayfaOzeti(sonuc: Record<string, unknown>): [string, string][] {
  const l: [string, string][] = [];
  for (const a of SAYFA_ALANLARI) { const d = deger(sonuc[a]); if (d) l.push([a, d]); }
  for (const a of SAYFA_BAGLARI) {
    const b = sonuc[a];
    const d = b && typeof b === "object" ? deger((b as Record<string, unknown>).ad ?? (b as Record<string, unknown>).kisa ?? (b as Record<string, unknown>).unvan
      ?? (b as Record<string, unknown>).no) : null;
    if (d) l.push([a, d]);
  }
  return l;
}
/** yoldaki açık kaydın notu ("Açık kayıt: Plan · no …") — görünmüyorsa / tanım yoksa null */
export async function acikKayit(katalog: readonly Islem[], sayfalar: readonly SayfaTanimi[], b: IslemBaglami, yol: string): Promise<string | null> {
  const p = yol.split(/[?#]/)[0];
  for (const s of sayfalar) {
    const m = s.desen.exec(p);
    if (!m) continue;
    const t = katalog.find((x) => x.ad === s.islem && x.tur === "oku");
    const girdi = s.girdi(...m.slice(1));
    const g = t?.girdi.safeParse(girdi);
    if (!t || !g?.success) return null;
    /* okuma düşerse sorunun işlemi sürsün: kayıt noktasına dönülür */
    await b.db.sorgu("SAVEPOINT acik_kayit");
    try {
      const c = await t.calistir(b, g.data, girdi);
      await b.db.sorgu("RELEASE SAVEPOINT acik_kayit");
      if (!c.tamam || !c.sonuc) return null;
      const alanlar = sayfaOzeti(c.sonuc);
      const kimlik = Object.values(girdi).find((x) => typeof x === "string");
      return `Açık kayıt: ${s.tur}${alanlar.length ? ` · ${alanlar.map(([a, d]) => `${a}: ${d}`).join(" · ")}` : ""}${kimlik ? ` (kimlik ${kimlik})` : ""}. `
        + `Ayrıntı için ${s.islem}; kullanıcı "bu", "burası" derse bu kayıttır.`;
    } catch { await b.db.sorgu("ROLLBACK TO SAVEPOINT acik_kayit"); return null; }
  }
  return null;
}

/** sonucun S.A.Y'a giden özeti: oku → yalnız sonuç; yaz → "yapıldı" (yazildi 1, bildirim — iş yapıldı sayılır, döngünün güvenliği değişiklik görür);
    hiçbir şey değişmeyen yazma (degisiklik: false) → ayni 1 (iş sayılmaz); yapılamadı → neden. sonuc: tool_result'ın metni (JSON) */
export function islemOzeti(ad: string, tur: "oku" | "yaz" | null, cevap: IslemCevabi, sema?: Record<string, unknown>): IsOzeti {
  const bos = { yazildi: 0, ayni: 0, bekliyor: 0, yapilan: [] as string[], yazilamadi: [] as { ad: string; neden: string }[] };
  if (!cevap.tamam) {
    const metin = JSON.stringify({ islem: ad, durum: "hata", neden: cevap.neden, ...(cevap.hatalar ? { hatalar: cevap.hatalar } : {}),
      ...(cevap.uyarilar ? { uyarilar: cevap.uyarilar } : {}), ...(cevap.eksikler ? { eksikler: cevap.eksikler } : {}), ...(sema ? { sema } : {}) });
    return { ...bos, yazilamadi: [{ ad, neden: cevap.neden }], sonuc: metin };
  }
  const metin = JSON.stringify({ islem: ad, durum: "tamam", ...(cevap.bildirim ? { bildirim: cevap.bildirim } : {}), ...(cevap.sonuc ?? {}) });
  if (tur !== "yaz") return { ...bos, sonuc: metin };
  return cevap.degisiklik === false ? { ...bos, ayni: 1, sonuc: metin } : { ...bos, yazildi: 1, yapilan: [cevap.bildirim ?? `${ad} yapıldı`], sonuc: metin };
}

/** sunucu komutunu (islem / islemler) çalıştırır — S.A.Y'a dönen özet. Yalnız yapay zekâ hizmetinin döndürdüğü çağrı için (eylem) */
export async function sunucuKomutu(katalog: readonly Islem[], o: IslemOrtami, k: SayKomutu, modulAdi: (no: number) => string): Promise<IsOzeti> {
  if (k.tur === "islemler") {
    /* şema üretimi beklenmedik biçimde düşerse eylem düşmesin (aynı turda yapılmış işler ekrana dönsün) — S.A.Y'a nedeniyle */
    try {
      return { yazildi: 0, ayni: 0, bekliyor: 0, yapilan: [], yazilamadi: [],
        sonuc: JSON.stringify({ islem: "islemler", durum: "tamam", ...islemleriListele(katalog, k, modulAdi) }) };
    } catch (e) {
      o.hata?.(e, "islemler");
      return islemOzeti("islemler", null, { tamam: false, neden: "Beklenmeyen bir sorun oldu; işlem listesi alınamadı." });
    }
  }
  if (k.tur !== "islem") return islemOzeti("islem", null, { tamam: false, neden: "Sunucu komutu değil." });
  const r = await islemYurut(katalog, o, k.ad, k.girdi);
  return islemOzeti(k.ad || "islem", r.islem?.tur ?? null, r.cevap, r.sema);
}
