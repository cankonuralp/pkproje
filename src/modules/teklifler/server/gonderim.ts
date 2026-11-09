/* TEKLİFİ E-POSTAYLA GÖNDER (2026-11-09; reisim: "teklif gönderme işi de mail ile olsun teklif gönder diyince ön izleme ile müşterinin mailine gönderilecek
   mail düzenlenebilsin vs detaylandırırsın benim mantığıma göre"). Pencere açılınca alıcı (müşterinin e-postası), hazır konu / ileti, gönderilecek belge
   gelir; kişi düzenler, gönderir. Aynı işlemde: taslak "gönderildi" olur (geçerlilik bugünden), teklif PDF'i tek dosya yolundan saklanır, alıcı başına ekli
   e-posta kuyruğa yazılır — biri düşerse hepsi geri alınır, gönderilmemiş teklif "gönderildi" görünmez. Gönderilmiş teklif yeniden gönderilir (durum ve
   belge değişmez); süresi dolan, kabul ya da red edilen gönderilmez. Gönderen tuşa basan kişi (sunucuda oturumdan). Gönderimi çağıran tetikler. */
import { eksikElleAlanlar } from "../../../belge/doldurma.ts";
import type { TeklifBelgesiVerisi } from "../../../belge/teklif.ts";
import { dogrula } from "../../../sema/ortak.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { belgeEpostala } from "../../../server/eposta/belge-gonder.ts";
import { adresler } from "../../../server/eposta/eposta.ts";
import { firmaGonderimi } from "../../../server/eposta/firma.ts";
import { kimdenKur } from "../../../server/eposta/kimden.ts";
import { hesapGonderen } from "../../../server/kimlik/hesap.ts";
import { bitisGunu, teklifEpostasi, TeklifEpostaGirdisi } from "../sema.ts";
import { bugunTr } from "../yaklasan.ts";
import { DOSYA_TEKLIF, etkinDurum, teklifBelgesiVerisi, teklifDegistirir, teklifGonder, teklifKarti, type Kisi, type TeklifKarti, type Yazma } from "./teklifler.ts";
import { tesislerinMuayenesi } from "./yaklasan.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export class TeklifPdfHatasi extends Error {
  override name = "DosyaHatasi";
}
export type TeklifPdfUretici = (v: TeklifBelgesiVerisi) => Promise<Uint8Array>;

async function hazirMetin(db: Sorgulayici, kim: Kisi, t: TeklifKarti, v: TeklifBelgesiVerisi) {
  const gonderen = await hesapGonderen(db, kim.id);
  const e = teklifEpostasi({ firma: v.firma.ad, no: t.no, unvan: v.musteri.unvan, ilgili: v.musteri.ilgili, tesisler: t.tesisler.map((x) => x.ad), tutar: t.tutar, kdv: t.kdv,
    gecerlilik: t.gecerlilik, muayene: await tesislerinMuayenesi(db, t.tesisler.map((x) => x.id)), gonderen: gonderen?.ad ?? kim.ad });
  return { ...e, gonderen };
}

export interface TeklifGonderimVerisi {
  no: string; kime: string; konu: string; govde: string;
  /** e-postanın Kimden'i; gönderim kurulu değilse null — ileti sırada bekler */
  kimden: string | null;
  /** gönderilmiş teklifi yeniden gönderme */
  yeniden: boolean;
  /** elle doldurulacak boş yerler */
  bos: string[];
  /** gönderilecek belgenin verisi (taslakta gönderilmiş hâliyle: bugünün tarihi, geçerlilik sonu, taslak yazısı yok) */
  belge: TeklifBelgesiVerisi;
}
/** gönderme penceresinin verisi; gönderemeyene ya da gönderilemeyecek teklifte null */
export async function teklifGonderimVerisi(db: Sorgulayici, kim: Kisi, id: string, depo: Depo | null = null): Promise<TeklifGonderimVerisi | null> {
  const t = await teklifKarti(db, kim, id);
  if (!t?.izin.eposta) return null;
  const v = await teklifBelgesiVerisi(db, kim, id, depo);
  if (!v) return null;
  const { konu, govde, gonderen } = await hazirMetin(db, kim, t, v);
  const g = await firmaGonderimi(db), k = g ? kimdenKur(g.firma, gonderen) : null;
  const bugun = bugunTr();
  return {
    no: t.no, kime: adresler([v.musteri.eposta])[0] ?? "", konu, govde, kimden: k?.tamam ? k.kimden : null, yeniden: t.durum === "gonderildi",
    bos: v.format ? eksikElleAlanlar(v.format, v.elle).map((a) => a.ad) : [],
    belge: t.durum === "taslak" ? { ...v, durum: "gonderildi", tarih: bugun, bitis: bitisGunu(bugun, t.gecerlilik) } : v,
  };
}

/** gönder: yalnız "yaz"; surum: görülen sürüm (null: S.A.Y — güncel). Alıcı ve metin denetimi PDF'ten önce. */
export async function teklifEpostaGonder(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, id: string, surum: number | null, girdi: unknown, uret: TeklifPdfUretici): Promise<Yazma> {
  if (!teklifDegistirir(kim)) return { durum: "yetkisiz" };
  const g = dogrula(TeklifEpostaGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const kime = adresler(g.veri.kime);
  if (kime.length !== g.veri.kime.length) return { durum: "gecersiz", hatalar: { kime: "Geçerli bir e-posta adresi yazılmalı." } };
  if (!UUID.test(id)) return { durum: "yok" };
  const x = (await db.sorgu<{ durum: "taslak" | "gonderildi" | "kabul" | "red"; gonderildi: string | null; gecerlilik: number; surum: number }>(
    "SELECT durum, gonderildi::text, gecerlilik, surum FROM teklif WHERE id = $1 FOR UPDATE", [id])).rows[0];
  if (!x) return { durum: "yok" };
  if (surum !== null && x.surum !== surum) return { durum: "cakisma" };
  const d = etkinDurum(x);
  if (d === "taslak") {
    const r = await teklifGonder(db, kim, id, x.surum);
    if (r.durum !== "tamam") return r;
  } else if (d !== "gonderildi") return { durum: "red", neden: d === "suresi" ? "Teklifin geçerliliği doldu; yenisi kopyalanır." : "Yalnız taslak ya da gönderilmiş teklif e-postayla gönderilir." };
  /* durum yazıldıktan sonra okunur: belge gönderilmiş hâliyle (tarih, geçerlilik sonu, taslak yazısı yok) */
  const t = await teklifKarti(db, kim, id), v = await teklifBelgesiVerisi(db, kim, id, depo);
  if (!t || !v) return { durum: "yok" };
  let pdf: Uint8Array;
  try { pdf = await uret(v); }
  catch { throw new TeklifPdfHatasi("Teklifin PDF'i üretilemedi; biraz sonra yeniden deneyin."); }
  const hazir = await hazirMetin(db, kim, t, v);
  const e = await belgeEpostala(db, depo, { ad: kim.ad, id: kim.id }, firmaId, { pdf, dosyaAdi: `${t.no}.pdf`, modul: DOSYA_TEKLIF, kayitId: id, kime,
    konu: g.veri.konu ?? hazir.konu, govde: g.veri.govde ?? hazir.govde, kaynak: "teklif", kaynakId: id, gonderen: hazir.gonderen });
  return { durum: "tamam", id, no: t.no, bildirim: `${t.no}: ${e.kuyruk.length} kişiye e-posta gönderiliyor.` };
}
