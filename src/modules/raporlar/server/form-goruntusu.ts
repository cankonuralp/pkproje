/* FORMUN GÖRÜNTÜSÜ (2026-10-31, kalem 4 — K6; sunum "S.A.Y'a tam yetenek", karar 3: ayrı uç /api/say/form, Chromium, 60 sn). 26 Ekim'de parçalı formda
   (tank / basınç kaynağı bölümleri, ikisinde de marka, seri no) tankın bilgisi öteki bölüme yazıldı; metin yerleşimi yetmediğinde S.A.Y formu bir insan
   gibi görür: raporun BASILI belgesi, her yazılabilir yer kutusunda kendi kimliğiyle ([e:marka], [a:k_c2], [t:<tablo>:<satır>:<sütun>], [d:<değer>]).
   Belge çizici aynı (src/belge — PDF'le birebir); yalnız değerler kimlikle değişir. Görüntü raporun dosyası olarak depoda (raporu gören açar); S.A.Y'a
   ekranın aracı sonucu olarak gider. Yetki raporBelgesiVerisi'nde (raporu gören). */
import { belgeGoruntusu } from "../../../belge/pdf.ts";
import type { BelgeVerisi } from "../../../belge/veri.ts";
import { sanalBolumler } from "../../../format/tablo.ts";
import type { Bolum, FormatTanimi } from "../../../format/tanim.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaYukle } from "../../../server/dosya/dosya.ts";
import type { Kisi } from "../../anasayfa/server/anasayfa.ts";
import { FORM_DOSYA } from "./form-dosya.ts";
import { raporBelgesiVerisi } from "./raporlar.ts";

const EKIPMAN = ["marka", "model", "seri", "imal", "konum", "amac", "bolum"] as const;

/** belgenin değerleri yer kimlikleriyle (saf): ekipman bilgisi, alanlar, ölçüm tablosu hücreleri (en az bir satır), test değerleri */
export function isaretliVeri(v: BelgeVerisi): BelgeVerisi {
  const c = structuredClone(v.cevaplar);
  const ekipman = { ...v.ekipman };
  for (const k of EKIPMAN) ekipman[k] = `[e:${k}]`;
  const bolumler = (t: FormatTanimi): Bolum[] => t.bolumler.flatMap((b) => (b.blok === "tablo" ? [b, ...sanalBolumler(b)] : [b])) as Bolum[];
  for (const b of bolumler(v.tanim)) {
    if (b.blok === "bilgi") for (const a of b.alanlar) { if (!a.ekipman) c.alan[a.id] = `[a:${a.id}]`; }
    else if (b.blok === "olcum") {
      const satirlar = c.tablo[b.id]?.length ? c.tablo[b.id]! : [{}];
      c.tablo[b.id] = satirlar.map((_, i) => Object.fromEntries(b.sutunlar.map((s) => [s.id, `[t:${b.id}:${i + 1}:${s.id}]`])));
    } else if (b.blok === "test") for (const d of b.degerler) c.deger[d.id] = `[d:${d.id}]`;
  }
  return { ...v, ekipman, cevaplar: c, kesin: false };
}

export type FormGoruntusu = { tamam: true; dosya: string; sayfa: number; sayfaSayisi: number } | { tamam: false; neden: string };
/** raporun basılı formunun işaretli sayfa görüntüsü → raporun dosyası (S.A.Y'ın ekranı sonucu S.A.Y'a verir) */
export async function formGoruntusu(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, id: string, sayfa: number): Promise<FormGoruntusu> {
  const s = await raporBelgesiVerisi(db, depo, kim, id);
  if (!s) return { tamam: false, neden: "Rapor bulunamadı ya da görme yetkiniz yok." };
  const g = await belgeGoruntusu(isaretliVeri(s.belge), sayfa);
  const y = await dosyaYukle(db, depo, { firmaId, modul: FORM_DOSYA, kayitId: id, ad: `${s.no} form ${g.sayfa}.jpg`, bayt: g.jpeg, izinli: ["jpeg"], kim: kim.ad, yukleyen: kim.id });
  return y.tamam ? { tamam: true, dosya: y.id, sayfa: g.sayfa, sayfaSayisi: g.sayfaSayisi } : { tamam: false, neden: "Formun görüntüsü kaydedilemedi." };
}
