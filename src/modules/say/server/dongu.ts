/* S.A.Y'IN İŞ DÖNGÜSÜ (2026-10-23 BAŞTAN — reisim: "say asistanı direk claude da haiku nasıl çalışıyor ise direk o şekilde çalıştıramaz mıyız",
   "herhangi bir kısıt kurma tamamen temiz kurulum yap, hiç bir kısıtı olmasın"). Uç src/app/api/say (akışlı yanıt, satır satır olay).
   · Soru → konuşmaya (server/say.ts soruyuEkle) → yapay zekâ AKIŞLA (src/server/yz/akis.ts): düşünme özeti ve cevap yazıldıkça ekrana; cevap
     konuşmaya OLDUĞU GİBİ (düşünme ve imzası dahil), yazısı görünen geçmişe.
   · Araç çağrıları: sunucu araçları (uygulamanın işlemleri — islemler / islem; ekran_durumu) BURADA çalışır, sonuç konuşmaya girer, döngü sürer.
     Ekranın araçları (rapora yazma, okuma, geri alma, kaydetme, gönderme, format) ekrana döner ("ekran" olayı); ekran yapar, sonucu "sonuc" ile
     getirir, döngü kaldığı yerden sürer. Aynı cevapta ekran aracından ÖNCE gelen sunucu işlemi şimdi çalışır (sonucu ekranınkiyle birlikte
     konuşmaya — yz_konusma_is.bekleyen), SONRA gelen ekranın işini bekler (SIRA_BEKLER — S.A.Y sonucu görüp yeniden çağırır).
   · Tur, adım, süre sınırı yok: barındırmanın işlev süresi dolmak üzereyse "devam" olayı — ekran hemen yeni istekle sürdürür (konuşma her adımda
     kaydedildiği için iş kaybolmaz). Aynı kişinin iki penceresi aynı anda yazamaz (yz_konusma_is).
   · Yetki: kişi, firma, depo, adres OTURUMDAN (islemOrtami); işlemi yürütücü kişinin yetkisiyle çalıştırır; ekranın gönderdiği sonuçlar yalnız
     bekleyen araç çağrılarına bağlanır ve S.A.Y'a veri olarak gider (yetki vermez). Yürütücü yalnız BU cevabın komutlarıyla çağrılır. */
import { z } from "zod";
import { depo } from "../../../server/dosya/depo.ts";
import { dosyaIndirilebilir } from "../../../server/dosya/dosya.ts";
import { DOSYA_ERISIMI } from "../../../server/dosya/erisim.ts";
import { epostalariSonraGonder } from "../../../server/eposta/sonra.ts";
import { hataKaydet } from "../../../server/hata/kaydet.ts";
import { oturumIslemi, type IstekOturumu } from "../../../server/kimlik/istek.ts";
import { firmaAdresi } from "../../../server/kiraci/istek.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { anthropicAkis, type AkisYaniti } from "../../../server/yz/akis.ts";
import { acikKayit, islemOzeti, okumaKomutu, sunucuKomutu, type IslemOrtami } from "../../../server/yz/islem.ts";
import { bekleyenAl, bekleyenYaz, isAl, isBirak, konusmaEkle, konusmaKilidi, konusmaOku, konusmaSonu, type AracSonucu } from "../../../server/yz/konusma.ts";
import { fotoGosterAraci, fotoPaftaAraci } from "./gorsel.ts";
import { beceriDizini, beceriMetni, becerileriOku } from "../beceriler.ts";
import { bitisDenetimi, denetimNotu, sorunVar } from "../bitis-denetimi.ts";
import { acikSonuclar, konusmaDuzelt } from "../../../server/yz/konusma-denetim.ts";
import type { SohbetIletisi } from "../../../server/yz/sohbet.ts";
import { aracCagrilari, aracCagrisi, betaReddi, cevapMetni, EKRAN_ARAC_ADLARI, GORSEL_ARAC_ADLARI, sayAraclari, sayIstegi, sayMaliyeti, saySistemi, sonucIcerigi, sunucuKomutuMu,
  type SayKomutu } from "../../../server/yz/say.ts";
import { FORMAT_ARACI } from "../../rapor-format/say-kurucu.ts";
import { ISLEM_DIZINI, ISLEM_KATALOGU, modulAdi, SAYFA_KATALOGU } from "../islem-katalogu.ts";
import { SAY_KILAVUZU } from "../yardim.ts";
import { isDerinligi } from "../sablonlar.ts";
import { cagriAyir, cagriBirak, cagriKapat, canliOku, ekranDurumuMetni, gorunenYaz, kullaniciIletisiEkle, kurucuOku, sayBaglami, sayKapisi, SINIR_DOLDU, soruyuEkle, YARIDA, type AcikKayitOkuyucu,
  type SayBaglami, type SayEkrani } from "./say.ts";

/** ekrana giden olaylar (satır başına bir JSON) */
export type SayOlayi =
  | { t: "ileti"; ileti: SohbetIletisi }
  | { t: "metin"; d: string }
  | { t: "dusunce"; d: string }
  | { t: "asama"; ad: string }
  | { t: "ekran"; araclar: { id: string; ad: string; komut: SayKomutu | null }[]; yenile: boolean }
  | { t: "devam"; yenile: boolean }
  | { t: "bitti"; yenile: boolean }
  | { t: "hata"; neden: string; yenile: boolean };

/** talimat ve araçlar: konuşma boyunca aynı (düşünmeler geçerli kalsın) */
const BECERILER = becerileriOku();
const SISTEM = saySistemi(SAY_KILAVUZU, ISLEM_DIZINI, beceriDizini(BECERILER));
const ARACLAR = sayAraclari(FORMAT_ARACI);
/** bir isteğin işi (kişinin S.A.Y işi bu süre içinde yenilenir) ve yeni çağrıya başlamak için gereken en az süre */
const IS_SURESI = 360, DEVAM_MS = 60_000;
const BASKA_PENCERE = "S.A.Y başka bir pencerenizde bir işi sürdürüyor; o bitince yeniden deneyin.";
/** aynı cevapta ekranın işinden SONRA gelen işlem bekler (S.A.Y'ın çağırdığı sıra korunur) */
export const SIRA_BEKLER = "Yapılmadı: aynı cevapta bundan önce ekranda yapılacak bir iş vardı (sıra korunur); ekranın sonucunu gördükten sonra bu işlemi yeniden çağır.";
const OKUNAMADI = "Bu araç çağrısının girdisi okunamadı; girdiyi aracın tarifine göre yeniden ver.";
const ASAMA: Record<string, string> = { rapora_yaz: "Rapora yazıyor", fotograflari_oku: "Okuyor", geri_al: "Geri alıyor", raporu_kaydet: "Kaydediyor",
  onaya_gonder: "Onaya gönderiyor", formati_duzenle: "Formata yazıyor", ekran_durumu: "Ekrana bakıyor", islemler: "Uygulamada arıyor", islem: "Uygulamada çalışıyor" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const Ozet = z.object({
  yazildi: z.number().int().min(0), ayni: z.number().int().min(0), bekliyor: z.number().int().min(0).default(0), satir: z.number().int().min(0).default(0),
  yapilan: z.array(z.string()).default([]), yazilamadi: z.array(z.object({ ad: z.string(), neden: z.string() })).default([]),
  /* 2026-10-31 (kalem 4): ekranın hazırladığı formun görüntüsünün dosyası (form_goster) */
  gorsel: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/).optional(),
});
export const SayIstekGirdisi = z.object({
  is: z.string().regex(UUID),
  tur: z.enum(["soru", "sonuc", "devam"]),
  soru: z.string().default(""),
  ekler: z.array(z.string().regex(UUID)).default([]),
  sonuclar: z.array(z.object({ id: z.string().min(1), ozet: Ozet })).default([]),
  yol: z.string().startsWith("/"),
  raporNo: z.string().nullable().default(null),
  canli: z.unknown().optional(),
  /* 2026-10-31 (kalem 8): hazır öneri (şablon kimliği + formun değerleri) */
  sablon: z.object({ id: z.string().regex(/^S\d{1,2}$/), girdiler: z.record(z.string().max(40), z.union([z.string().max(500), z.boolean()])) }).nullable().default(null),
  kurucu: z.unknown().optional(),
  kaydedilmemis: z.boolean().default(false),
});

/** işlemin ortamı: kişi, firma, depo, adres ve e-posta OTURUMDAN (yapay zekânın ya da ekranın girdisinden değil); her işlem kendi kiracı işleminde.
    kaydedilmemis: ekranın bildirdiği (yetki değil — yalnız kişinin kendi ekranı korunur) */
function islemOrtami(o: IstekOturumu, s: { ekrandakiRapor: string | null; kaydedilmemis: boolean }): IslemOrtami {
  return {
    islet: <T,>(is: (db: Sorgulayici) => Promise<T>) => oturumIslemi(o, is),
    kim: o, firmaId: o.kiraci.firmaId, depo, kok: firmaAdresi(o.kiraci.kisaAd), ekrandakiRapor: s.ekrandakiRapor, kaydedilmemis: s.kaydedilmemis,
    epostaGonder: (kaynak, id) => { epostalariSonraGonder(o.kiraci, kaynak, id); },
    hata: (e, ad) => hataYaz(o, e, `say.islem.${ad}`),
  };
}
/** K2 + M4 (2026-10-31): açık kaydın notu — modülün OKUMA işlemi (acikKayit yalnız tur "oku"), kişi ve firma oturumdan, sorunun veritabanı işleminde */
function acikKayitOkuyucu(o: IstekOturumu): AcikKayitOkuyucu {
  return (db, _kim, yol) => acikKayit(ISLEM_KATALOGU, SAYFA_KATALOGU, { db, kim: o, firmaId: o.kiraci.firmaId,
    depo: () => { throw new Error("açık kayıt okumasında depo yok"); }, kok: null, ekrandakiRapor: null, kaydedilmemis: false, epostaGonder: () => {} }, yol);
}
function hataYaz(o: IstekOturumu, e: unknown, yer: string): void {
  void hataKaydet({ kaynak: "sunucu", mesaj: e instanceof Error ? e.message : String(e), yigin: e instanceof Error ? e.stack ?? null : null,
    yer, alan: o.kiraci.kisaAd, hesap: o.id });
}
const dizi = (x: unknown): Record<string, unknown>[] => (Array.isArray(x) ? x.filter((b): b is Record<string, unknown> => !!b && typeof b === "object") : []);

/** 2026-10-31 (kalem 4): ekranın hazırladığı görüntü (kişinin indirebildiği JPEG — dosya erişim kaydıyla) → görüntü bloğu; okunamazsa yok */
async function gorselBlogu(db: Sorgulayici, kisi: IstekOturumu, dosyaId: string): Promise<Record<string, unknown> | null> {
  const d = await dosyaIndirilebilir(db, kisi, dosyaId, DOSYA_ERISIMI);
  if (!d || d.tur !== "image/jpeg" || d.boyut > 5_000_000) return null;
  return { type: "image", source: { type: "base64", media_type: "image/jpeg", data: Buffer.from(await depo().oku(d.anahtar, db)).toString("base64") } };
}
/** ekranın getirdiği sonuçlar: konuşmanın sonu cevapsız araç çağrıları olmalı; ekran araçlarının sonucu ekrandan, ötekiler bekleyenden. Dönen: red nedeni */
async function sonuclariEkle(db: Sorgulayici, kisi: IstekOturumu, sonuclar: readonly { id: string; ozet: z.output<typeof Ozet> }[]): Promise<string | null> {
  await konusmaKilidi(db);
  const son = await konusmaSonu(db);
  const acikta = son?.rol === "assistant" ? aracCagrilari(dizi(son.icerik)) : [];
  if (!acikta.length) return "Bu işin sonucu artık beklenmiyor (iş başka bir pencerede sürdü ya da bitti).";
  const bekleyen = await bekleyenAl(db);
  const bloklar = await Promise.all(acikta.map(async (a) => {
    const e = EKRAN_ARAC_ADLARI.has(a.name) ? sonuclar.find((x) => x.id === a.id) : undefined;
    if (e && a.name === "form_goster" && e.ozet.gorsel) {
      const { gorsel, ...ozet } = e.ozet;
      const g = await gorselBlogu(db, kisi, gorsel);
      return { type: "tool_result", tool_use_id: a.id, content: [...(g ? [g] : []), { type: "text", text: sonucIcerigi({ ...ozet, yazilamadi: [...ozet.yazilamadi] }) }] };
    }
    if (e) return { type: "tool_result", tool_use_id: a.id, content: sonucIcerigi({ ...e.ozet, yazilamadi: [...e.ozet.yazilamadi] }) };
    if (bekleyen[a.id] !== undefined) return { type: "tool_result", tool_use_id: a.id, content: bekleyen[a.id] };
    return { type: "tool_result", tool_use_id: a.id, content: "Yapılmadı: ekranın sonucu gelmedi.", is_error: true };
  }));
  await konusmaEkle(db, "user", bloklar);
  return null;
}

/** tek yapay zekâ çağrısı: hizmet düşünme denetimi betasını tanımazsa aynı istek onsuz */
async function cagir(model: Parameters<typeof sayIstegi>[0]["model"], mesajlar: Record<string, unknown>[], anahtar: string, yaz: (x: SayOlayi) => void):
  Promise<AkisYaniti> {
  /* işin derinliği (şablondan; iş boyunca aynı — talimat ve araçlar konuşma boyunca aynı) */
  const derinlik = isDerinligi(mesajlar as { role: string; content: unknown }[]);
  const dinle = {
    metin: (d: string) => yaz({ t: "metin", d }),   // 2026-10-26 (reisim: "çok açıklama var"): düşünme özeti artık ekrana gönderilmez (İngilizce iç düşünce); balonda yalnız aşama yazar
    blokBasladi: (b: Record<string, unknown>) => {
      if (b.type === "server_tool_use") yaz({ t: "asama", ad: "İnternette arıyor" });
      else if (b.type === "tool_use") yaz({ t: "asama", ad: ASAMA[String(b.name)] ?? "Çalışıyor" });
      else if (b.type === "thinking") yaz({ t: "asama", ad: "Düşünüyor" });
      else if (b.type === "text") yaz({ t: "asama", ad: "Yazıyor" });
    },
  };
  const i = sayIstegi({ model, sistem: SISTEM, araclar: ARACLAR, mesajlar, derinlik });
  const y = await anthropicAkis(i.govde, anahtar, i.betalar, dinle);
  if (y.durum === "hata" && y.kod === 400 && betaReddi(y.ileti)) {
    const b = sayIstegi({ model, sistem: SISTEM, araclar: ARACLAR, mesajlar, betasiz: true, derinlik });
    return anthropicAkis(b.govde, anahtar, b.betalar, dinle);
  }
  return y;
}

/** bir isteğin işi. yaz: ekrana olay (bağlantı koptuysa yutulur — iş sürer, konuşma kaydedilir); bitis: bu isteğin işlev süresinin sonu */
export async function sayAkisi(o: IstekOturumu, ham: unknown, yaz: (x: SayOlayi) => void, bitis: number): Promise<void> {
  const g = SayIstekGirdisi.safeParse(ham);
  if (!g.success) { yaz({ t: "hata", neden: "İstek okunamadı; sayfayı yenileyip yeniden deneyin.", yenile: false }); return; }
  const v = g.data;
  const ekran: SayEkrani = { yol: v.yol, raporNo: v.raporNo && v.raporNo.length <= 60 ? v.raporNo : null, canli: canliOku(v.canli), kurucu: kurucuOku(v.kurucu) };
  if (!(await oturumIslemi(o, (db) => isAl(db, v.is, IS_SURESI)))) { yaz({ t: "hata", neden: BASKA_PENCERE, yenile: false }); return; }
  /* duraklat: hizmet uzun süren internet aramasında cevabı böldü (pause_turn) — aynı cevap sürdürülür, konuşmanın sonu S.A.Y'ın iletisi olsa da */
  let yenile = false, ilk = v.tur === "soru", duraklat = false;
  try {
    if (v.tur === "soru") {
      const s = await oturumIslemi(o, (db) => soruyuEkle(db, o, { metin: v.soru, ekler: v.ekler, ekran, okuyucu: acikKayitOkuyucu(o), sablon: v.sablon }));
      if (s.durum === "red") { yaz({ t: "hata", neden: s.neden, yenile }); return; }
      yaz({ t: "ileti", ileti: s.ileti });
    } else if (v.tur === "sonuc") {
      const r = await oturumIslemi(o, (db) => sonuclariEkle(db, o, v.sonuclar));
      if (r) { yaz({ t: "hata", neden: r, yenile }); return; }
    }
    for (;;) {
      if (bitis - Date.now() < DEVAM_MS) { yaz({ t: "devam", yenile }); return; }
      const h = await oturumIslemi(o, async (db) => {
        if (!(await isAl(db, v.is, IS_SURESI))) return { durum: "red" as const, neden: BASKA_PENCERE };
        const k = await sayKapisi(db);
        if (k.durum === "red") return k;
        /* konuşmanın sonu cevapsız araç çağrısıysa (iş kesilmişti) kapanır; sonu S.A.Y'ın cevabıysa yapılacak iş yok */
        const son = await konusmaSonu(db);
        if (son?.rol === "assistant" && !duraklat) {
          if (!aracCagrilari(dizi(son.icerik)).length) return { durum: "bitti" as const };
          await kullaniciIletisiEkle(db, []);
        }
        /* K1 (2026-10-31): bozuk kalmış konuşma (aynı çağrıya iki sonuç, öksüz sonuç) okurken onarılır; onarım hata kaydına */
        const d = konusmaDuzelt((await konusmaOku(db)).map((m) => ({ role: m.rol, content: m.icerik })), YARIDA);
        if (d.duzeltmeler.length) hataYaz(o, new Error(`S.A.Y konuşması onarıldı: ${d.duzeltmeler.join(", ")}`), "say.konusma");
        const mesajlar: Record<string, unknown>[] = d.mesajlar.map((m) => ({ role: m.role, content: m.content }));
        const a = await cagriAyir(db, k.model, k.sinir, JSON.stringify(mesajlar).length / 2 + SISTEM.length / 2);
        if (!a) return { durum: "red" as const, neden: SINIR_DOLDU };
        return { durum: "hazir" as const, k, mesajlar, a, b: await sayBaglami(db, o, ekran, acikKayitOkuyucu(o)) };
      });
      if (h.durum === "bitti") { yaz({ t: "bitti", yenile }); return; }
      if (h.durum === "red") { yaz({ t: "hata", neden: h.neden, yenile }); return; }
      yaz({ t: "asama", ad: "Düşünüyor" });
      const y = await cagir(h.k.model, h.mesajlar, h.k.anahtar, yaz);
      if (y.durum === "hata") {
        /* K1b (2026-10-31): reddedilen istek hata kaydına — kod, hizmetin hata metni (maskeli), ileti sayısı, istek boyu */
        hataYaz(o, new Error(`Yapay zekâ isteği reddedildi (${y.kod ?? "bağlantı"}): ${y.ileti ?? y.neden} · ileti ${h.mesajlar.length} · boy ${JSON.stringify(h.mesajlar).length}`),
          "say.istek");
        await oturumIslemi(o, (db) => cagriBirak(db, h.a, y.ucret === "bilinmiyor"));
        yaz({ t: "hata", neden: y.neden, yenile });
        return;
      }
      const m = y.mesaj;
      const c = sayMaliyeti(h.k.model, m.usage);
      const ileti = await oturumIslemi(o, async (db) => {
        await cagriKapat(db, h.a, c.maliyet, ilk ? 1 : 0);
        if (!m.content.length) return null;
        await konusmaKilidi(db);
        await konusmaEkle(db, "assistant", m.content);
        const metin = cevapMetni(m.content);
        return metin ? gorunenYaz(db, { kim: "say", metin, yer: h.b.yer, ek: h.b.raporId ? { rapor: h.b.raporId } : h.b.formatId ? { format: h.b.formatId } : null }) : null;
      });
      ilk = false;
      if (!m.content.length) { yaz({ t: "hata", neden: "Cevap boş geldi; isteğinizi başka türlü yazmayı deneyin.", yenile }); return; }
      if (ileti) yaz({ t: "ileti", ileti });
      duraklat = m.stop_reason === "pause_turn";
      if (duraklat) continue;
      if (m.stop_reason !== "tool_use") {
        if (m.stop_reason === "refusal" && !ileti) { yaz({ t: "hata", neden: "Yapay zekâ bu isteğe cevap vermedi.", yenile }); return; }
        /* 2026-10-31 (L3): rapora yazan iş bittiyse ve denetlenmediyse sunucu denetler, sonucu konuşmaya ekler, S.A.Y sürer (bir işte en çok iki kez) */
        if (m.stop_reason === "end_turn" && await bitirmedenDenetle(o, h.b, v.kaydedilmemis, yaz)) continue;
        yaz({ t: "bitti", yenile });
        return;
      }
      const r = await araclariYap(o, m.content, h.b, v.kaydedilmemis, yaz);
      yenile ||= r.yenile;
      if (r.ekran.length) {
        await oturumIslemi(o, (db) => bekleyenYaz(db, r.sonuclar));
        yaz({ t: "ekran", araclar: r.ekran, yenile });
        return;
      }
      /* K1: yalnız hâlâ açık çağrıların sonucu yazılır — bu arada başka yol (yeni soru) kapattıysa ikinci sonuç yazılmaz */
      await oturumIslemi(o, async (db) => {
        await konusmaKilidi(db);
        const son = await konusmaSonu(db);
        const l = son?.rol === "assistant" ? acikSonuclar(son.icerik, r.sonuclar) : [];
        if (l.length) await konusmaEkle(db, "user", l.map(([id, s]) => ({ type: "tool_result", tool_use_id: id, content: s })));
      });
    }
  } finally {
    try { await oturumIslemi(o, (db) => isBirak(db, v.is)); } catch { /* süresi dolunca kendiliğinden bırakılır */ }
  }
}

/** bitirmeden denetim (bitis-denetimi.ts): gerekiyorsa plan_denetle kişinin yetkisiyle çalışır, sonucu konuşmaya kullanıcı tarafında not olarak girer */
async function bitirmedenDenetle(o: IstekOturumu, b: SayBaglami, kaydedilmemis: boolean, yaz: (x: SayOlayi) => void): Promise<boolean> {
  const d = await oturumIslemi(o, async (db) => bitisDenetimi((await konusmaOku(db)).map((m) => ({ role: m.rol, content: m.icerik }))));
  if (!d) return false;
  yaz({ t: "asama", ad: "Denetliyor" });
  const ozet = await okumaKomutu(ISLEM_KATALOGU, islemOrtami(o, { ekrandakiRapor: b.raporId, kaydedilmemis }), "plan_denetle",
    { ...(d.plan ? { plan: d.plan } : {}), ...(d.raporlar.length ? { raporlar: d.raporlar } : {}) });
  /* sorun yoksa S.A.Y'ın yazdığı bildirim kalır (ikinci kez yazdırılmaz) */
  if (!sorunVar(ozet.sonuc)) return false;
  return oturumIslemi(o, async (db) => {
    await konusmaKilidi(db);
    if ((await konusmaSonu(db))?.rol !== "assistant") return false;
    await konusmaEkle(db, "user", [{ type: "text", text: denetimNotu(ozet.sonuc ?? "denetim sonucu alınamadı") }]);
    return true;
  });
}

/** 2026-10-31 (kalem 3 — E3): görüntü araçları — kişinin kendi eklerinin depodaki kopyasından, kendi kiracı işleminde; düşerse nedeni S.A.Y'a */
async function gorselSonucu(o: IstekOturumu, ad: string, girdi: unknown): Promise<AracSonucu> {
  try {
    return await oturumIslemi(o, (db) => (ad === "foto_pafta" ? fotoPaftaAraci(db, depo(), girdi) : fotoGosterAraci(db, depo(), girdi)));
  } catch (e) {
    hataYaz(o, e, `say.${ad}`);
    return "Fotoğraf hazırlanamadı (görüntü okunamadı); ekte görülen hâline bak.";
  }
}

/** BU cevabın araç çağrıları: sunucu araçları burada (S.A.Y'ın sırasıyla), ekran araçları ekrana; ekran aracından sonraki işlem bekler */
async function araclariYap(o: IstekOturumu, icerik: readonly Record<string, unknown>[], b: SayBaglami, kaydedilmemis: boolean, yaz: (x: SayOlayi) => void):
  Promise<{ sonuclar: Record<string, AracSonucu>; ekran: { id: string; ad: string; komut: SayKomutu | null }[]; yenile: boolean }> {
  const komutlar = aracCagrilari(icerik);
  const ortam = islemOrtami(o, { ekrandakiRapor: b.raporId, kaydedilmemis });
  const sonuclar: Record<string, AracSonucu> = {}, ekran: { id: string; ad: string; komut: SayKomutu | null }[] = [];
  let ekranda = false, yenile = false;
  for (const c of komutlar) {
    const k = aracCagrisi({ type: "tool_use", id: c.id, name: c.name, input: c.input });
    if (EKRAN_ARAC_ADLARI.has(c.name)) { ekranda = true; ekran.push({ id: c.id, ad: c.name, komut: k }); continue; }
    if (ekranda) { sonuclar[c.id] = sonucIcerigi(islemOzeti(k?.tur === "islem" ? k.ad || "islem" : c.name, null, { tamam: false, neden: SIRA_BEKLER })); continue; }
    if (c.name === "ekran_durumu") { sonuclar[c.id] = ekranDurumuMetni(b); continue; }
    if (c.name === "beceri_oku") { sonuclar[c.id] = beceriMetni(BECERILER, (c.input as { ad?: unknown } | null)?.ad); continue; }
    if (GORSEL_ARAC_ADLARI.has(c.name)) { yaz({ t: "asama", ad: "Fotoğraflara bakıyor" }); sonuclar[c.id] = await gorselSonucu(o, c.name, c.input); continue; }
    if (!k || !sunucuKomutuMu(k)) { sonuclar[c.id] = OKUNAMADI; continue; }
    yaz({ t: "asama", ad: ASAMA[c.name] ?? "Çalışıyor" });
    const ozet = await sunucuKomutu(ISLEM_KATALOGU, ortam, k, modulAdi);
    if (k.tur === "islem" && ozet.yazildi > 0) yenile = true;
    sonuclar[c.id] = sonucIcerigi(ozet);
  }
  return { sonuclar, ekran, yenile };
}
