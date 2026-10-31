/* S.A.Y PDF GÖNDERİM UCU (2026-10-31; reisim'in kabulü: "PDF gönderim ayrı uç (Chromium)" — S.A.Y'ın ucu Chromium taşımaz). S.A.Y'ın pdf_gonder aracını
   EKRAN çağırır (kullanıcının oturumuyla): eğitim katılım formunu ya da zimmet teslim formunu imzaya, ön bilgilendirme formunu ve sözleşmeyi müşteriye
   gönderir — ekranın tuşlarının işlevleriyle (aynı yetki, aynı PDF). Kapılar: aynı köken, oturum; yetki modülde. */
import { egitimPdf, sozlesmePdf, zimmetPdf } from "../../../../belge/pdf";
import { katilimFormuGonder } from "../../../../modules/egitimler/server/egitimler";
import { zimmetFormuGonder } from "../../../../modules/personel/server/dosyalar";
import { onBilgiGonder } from "../../../../modules/planlar/server/onbilgi";
import { ONBILGI_KAYNAK } from "../../../../modules/planlar/server/plan-ici";
import { sozlesmeGonder } from "../../../../modules/sozlesmeler/server/sozlesmeler";
import { depo } from "../../../../server/dosya/depo";
import { epostalariSonraGonder } from "../../../../server/eposta/sonra";
import { hataKaydet } from "../../../../server/hata/kaydet";
import { istekOturumu, oturumIslemi } from "../../../../server/kimlik/istek";
import { ayniKoken } from "../../../../server/kimlik/koken";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const yanit = (govde: object, status = 200) => Response.json(govde, { status, headers: { "Cache-Control": "no-store" } });
const NEDEN: Record<string, string> = { yok: "Kayıt bulunamadı ya da görünmüyor.", yetkisiz: "Bu işlem için yetkiniz yok.", cakisma: "Kayıt bu arada değişti; yeniden deneyin." };
type Sonuc = { durum: string; bildirim?: string; neden?: string; hatalar?: Record<string, string>; adet?: number; id?: string };
const cevap = (r: Sonuc, tamam: string) => (r.durum === "tamam" ? { tamam: true, bildirim: r.bildirim ?? tamam }
  : { tamam: false, neden: r.neden ?? (r.hatalar ? Object.values(r.hatalar)[0] : undefined) ?? NEDEN[r.durum] ?? "Gönderilemedi." });

export async function POST(istek: Request) {
  if (!(await ayniKoken())) return yanit({ hata: "koken" }, 403);
  const o = await istekOturumu();
  if (!o) return yanit({ hata: "oturum" }, 401);
  let g: { tur?: unknown; id?: unknown; kime?: unknown };
  try { g = await istek.json(); } catch { return yanit({ tamam: false, neden: "İstek okunamadı." }, 400); }
  const id = typeof g.id === "string" && UUID.test(g.id) ? g.id : null;
  if (!id) return yanit({ tamam: false, neden: "Kayıt kimliği geçersiz." }, 400);
  const f = o.kiraci.firmaId;
  try {
    switch (g.tur) {
      case "katilim": return yanit(cevap(await oturumIslemi(o, (db) => katilimFormuGonder(db, depo(), o, f, id, egitimPdf)), "Katılım formu katılımcıların imzasına gönderildi."));
      case "zimmet": return yanit(cevap(await oturumIslemi(o, (db) => zimmetFormuGonder(db, depo(), o, f, id, zimmetPdf)), "Zimmet teslim formu imzaya gönderildi."));
      case "onbilgi": {
        const r = await onBilgiGonder((is) => oturumIslemi(o, is), depo(), o, f, id);
        if (r.durum === "tamam") epostalariSonraGonder(o.kiraci, ONBILGI_KAYNAK, id);
        return yanit(cevap(r, "Ön bilgilendirme formu gönderildi."));
      }
      case "sozlesme": {
        const kime = Array.isArray(g.kime) ? g.kime.slice(0, 20).filter((x): x is string => typeof x === "string") : [];
        const r = await oturumIslemi(o, (db) => sozlesmeGonder(db, depo(), o, f, id, { kime }, sozlesmePdf));
        if (r.durum === "tamam" && r.adet) epostalariSonraGonder(o.kiraci, "sozlesme", r.id);
        return yanit(cevap(r, `Sözleşme ${r.durum === "tamam" ? r.adet ?? 0 : 0} alıcıya gönderildi.`));
      }
      default: return yanit({ tamam: false, neden: "Belge türü: katilim, zimmet, onbilgi ya da sozlesme." }, 400);
    }
  } catch (h) {
    void hataKaydet({ kaynak: "sunucu", mesaj: h instanceof Error ? h.message : String(h), yigin: h instanceof Error ? h.stack ?? null : null, yer: "say.pdf", alan: o.kiraci.kisaAd, hesap: o.id });
    return yanit({ tamam: false, neden: h instanceof Error && h.name === "DosyaHatasi" ? h.message : "PDF hazırlanamadı; yeniden deneyin." });
  }
}
