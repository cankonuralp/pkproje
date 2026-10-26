/* S.A.Y CHAT · ETİKETTEN OKUMA (524; pkproje §3.10 m.11 — "isteğe bağlı: fotoğraf eklenirken uyarı (yapay zekâ kullanır, firmanın kotasından harcar,
   bu ay x / y); Oku ve mesaja yaz ya da Okumadan geç; okunanlar mesaja öneri olarak yazılır; etiket fotoğrafı rapora KONMAZ"). Fotoğraftan alan
   okumayla (src/server/yz/alanlar.ts) aynı istek ve üç adım: hazırlık (işlem içinde: plan ekibinde, firmada yapay zekâ açık, API anahtarı, fotoğraf
   JPEG / PNG en çok 5 MB konum bilgisi silinmiş, kişinin sınırı → en kötü maliyet AYRILIR) → çağrı (işlem DIŞINDA) → kapanış (ayırma gerçek maliyetle,
   S.A.Y mesajı sayılır — rapor yok, yz_okuma'ya yazılmaz). Okunacak alanlar kaydın mesaj satırlarının ADLARI (yorum hariç); yapay zekâya ad ve tür
   gider — müşteri / kişi bilgisi gitmez. Değer kayda yazılmaz: ekran boş satırlara öneri olarak koyar, denetçi değiştirir. */
import { ayarOku } from "../../../server/ayar/ayar.ts";
import { sirKullan } from "../../../server/ayar/sir.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { jpegTemizle, pngTemizle, turBul } from "../../../server/dosya/tur.ts";
import { alanEnCokMaliyet, alanIstegi, alanYanitiCoz, type OkunacakAlan } from "../../../server/yz/alanlar.ts";
import { yzAyi, yzAyir, yzAyirmaBirak, yzSohbetKapat } from "../../../server/yz/kullanim.ts";
import { maliyetHesapla, type OkumaIstegi, type YzModel } from "../../../server/yz/okuma.ts";
import { z } from "zod";
import { AD_EN_COK, SATIR_EN_COK } from "../sema.ts";
import { chatKapisi, type Kisi } from "./kayitlar.ts";

export const ETIKET_EN_BUYUK = 5 << 20;
const ELLE = "Satırları elle yazabilirsiniz.";
const Satirlar = z.array(z.object({ ad: z.string().trim().min(1).max(AD_EN_COK), alan: z.string().max(80) })).min(1).max(SATIR_EN_COK);

export interface EtiketHazir { durum: "hazir"; istek: OkumaIstegi; anahtar: string; model: YzModel; ay: string; ust: number; alanlar: OkunacakAlan[] }
export type EtiketRed = { durum: "red"; neden: string };

export async function etiketHazirla(db: Sorgulayici, kim: Kisi, planId: string, satirlarGirdi: unknown, bayt: Uint8Array, simdi = new Date()): Promise<EtiketHazir | EtiketRed> {
  if (!(await chatKapisi(db, kim, planId))) return { durum: "red", neden: "S.A.Y Chat bu planda kapalı." };
  const s = Satirlar.safeParse(satirlarGirdi);
  if (!s.success) return { durum: "red", neden: "Kaydın satırları okunamadı; ekipmanı yeniden seçin." };
  /* satır numarasıyla (s<i>) — yorum satırı etikette yazmaz */
  const alanlar: OkunacakAlan[] = s.data.map((x, i) => ({ id: `s${i}`, ad: x.ad, tur: x.alan === "e:imal" ? "yil" as const : "metin" as const, alan: x.alan }))
    .filter((x) => x.alan !== "yorum").map(({ alan: _a, ...x }) => x);
  if (!alanlar.length) return { durum: "red", neden: `Etikette okunacak satır yok. ${ELLE}` };
  const yz = (await ayarOku(db, "yapay_zeka")).deger;
  if (!yz.acik) return { durum: "red", neden: `Yapay zekâ firmada kapalı (probata yönetimi tanımlar). ${ELLE}` };
  const anahtar = await sirKullan(db, "yapay_zeka_anahtari");
  if (!anahtar) return { durum: "red", neden: `Yapay zekâ API anahtarı girilmedi (probata yönetimi tanımlar). ${ELLE}` };
  const tur = turBul(bayt, ["jpeg", "png"]);
  if (tur !== "jpeg" && tur !== "png") return { durum: "red", neden: "Yalnız JPEG ya da PNG fotoğraf." };
  if (bayt.length > ETIKET_EN_BUYUK) return { durum: "red", neden: "Fotoğraf çok büyük (en çok 5 MB)." };
  let temiz: Uint8Array;
  try { temiz = tur === "jpeg" ? jpegTemizle(bayt) : pngTemizle(bayt); } catch { return { durum: "red", neden: "Fotoğraf bozuk; başka bir fotoğraf deneyin." }; }
  const ay = yzAyi(simdi), ust = alanEnCokMaliyet(yz.model);
  if (!(await yzAyir(db, ay, yz.sinir, ust))) return { durum: "red", neden: `Bu ay yapay zekâ sınırınız doldu; probata yönetimi artırabilir. ${ELLE}` };
  return { durum: "hazir", istek: alanIstegi({ model: yz.model, baslik: "Ekipman etiketi (künye levhası)", alanlar, resim: temiz, tur }), anahtar, model: yz.model, ay, ust, alanlar };
}

export type EtiketSonucu = { durum: "tamam"; okunan: { i: number; deger: string; guven: string }[]; bildirim: string } | EtiketRed;

/** kapanış (kendi işleminde): ayırma gerçek maliyetle kapanır, S.A.Y mesajı sayılır; okunanlar satır numarasıyla */
export async function etiketKapat(db: Sorgulayici, h: Pick<EtiketHazir, "model" | "ay" | "ust" | "alanlar">, govde: unknown, bugun = new Date()): Promise<EtiketSonucu> {
  const { okunan, giris, cikis, durum } = alanYanitiCoz(govde, h.alanlar, bugun);
  await yzSohbetKapat(db, { ay: h.ay, ust: h.ust, maliyet: maliyetHesapla(h.model, giris, cikis) });
  if (durum === "ret") return { durum: "red", neden: `Yapay zekâ bu fotoğrafı okumadı. ${ELLE}` };
  const l = okunan.map((x) => ({ i: Number(x.alan.slice(1)), deger: x.deger, guven: x.guven })).filter((x) => Number.isInteger(x.i));
  return { durum: "tamam", okunan: l, bildirim: l.length ? `${l.length} bilgi okundu; mesajın boş satırlarına yazıldı, kontrol edin.` : `Etikette bilgi okunamadı. ${ELLE}` };
}

export async function etiketBirak(db: Sorgulayici, h: Pick<EtiketHazir, "ay" | "ust">, ucret: "yok" | "bilinmiyor"): Promise<void> {
  await yzAyirmaBirak(db, h.ay, h.ust, ucret === "bilinmiyor", "mesaj");
}
