/* RAPOR DOĞRULAMA (595 K8 — reisim: "Kanun cümlesi + rapor no + sayfa + doğrulama karekodu"): karekodun açtığı sayfanın bilgisi. OTURUMSUZ
   okunur — kapı koddur (HMAC'li, src/server/dogrulama.ts dogrulamaCoz; çağıran çözer). Yalnız imzalı sürümün kimliği: rapor no, muayene firması,
   ekipman türü ve kodu, kontrol tarihi, sonuç, imza zamanı; daha yeni imzalı revizyon varsa onun numarası. Müşteri / tesis adı, kişi adı, rapor
   içeriği ve PDF GİTMEZ (anayasa 5.1: kalıcı herkese açık dosya bağlantısı yok — imzalı kopya müşteri panelinde). 2026-10-17: imzalı PDF sayfada
   gösterilir — yalnız kısa ömürlü jetonla ayrı uçtan (raporDogrulamaPdf; dogrula-sayfa.ts). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { kayitDosyasi } from "../../../server/dosya/dosya.ts";
import { firmaBelgeKunyesi } from "../../../server/ayar/ayar.ts";
import { ekipmanEtiketi } from "../../ekipman/server/ekipman.ts";
import { turRaporBilgisi } from "../../ekipman-turleri/server/turler.ts";
import { gorunenNo } from "../sema.ts";
import { raporSonucuMu, type RaporSonucu } from "../../../format/tanim.ts";

export type RaporDogrulama =
  | { durum: "gecerli" | "yenisi_var"; no: string; firma: string; tur: string; ekipman: string; kontrol: string | null; sonuc: RaporSonucu | null;
    imzalandi: string; yeni: string | null; saklamaBitti: boolean }
  | { durum: "imzasiz"; no: string; firma: string }
  | { durum: "yok" };

export async function raporDogrulamaBilgisi(db: Sorgulayici, raporId: string, revizyon: number): Promise<RaporDogrulama> {
  const s = (await db.sorgu<{ no: string; tur_id: string; ekipman_id: string; kontrol: string | null; sonuc: string | null; imzalandi: Date; silindi: Date | null }>(
    `SELECT s.no, s.tur_id::text, s.ekipman_id::text, s.kontrol_tarihi::text AS kontrol, s.sonuc, s.imzalandi, k.silindi
     FROM rapor_surumu s LEFT JOIN saklama_silme k ON k.firma_id = s.firma_id AND k.surum_id = s.id WHERE s.rapor_id = $1 AND s.revizyon = $2`, [raporId, revizyon])).rows[0];
  if (!s) {
    /* imzaya hazırlanmış ama imzalı PDF'i yüklenmemiş (ya da silinmiş) rapor */
    const r = (await db.sorgu<{ no: string }>("SELECT no FROM rapor WHERE id = $1 AND silindi IS NULL", [raporId])).rows[0];
    return r ? { durum: "imzasiz", no: gorunenNo(r.no, revizyon), firma: (await firmaBelgeKunyesi(db, null)).ad } : { durum: "yok" };
  }
  const yeni = (await db.sorgu<{ no: string; revizyon: number }>(
    "SELECT no, revizyon FROM rapor_surumu WHERE rapor_id = $1 AND revizyon > $2 ORDER BY revizyon DESC LIMIT 1", [raporId, revizyon])).rows[0];
  const tur = await turRaporBilgisi(db, s.tur_id), ekipman = await ekipmanEtiketi(db, s.ekipman_id), firma = await firmaBelgeKunyesi(db, null);
  return {
    /* imzalı sürümün numarası revizyon ekini taşır (R1 …) */
    durum: yeni ? "yenisi_var" : "gecerli", no: s.no, firma: firma.ad, tur: tur?.ad ?? "-", ekipman: ekipman?.kod ?? "-",
    kontrol: s.kontrol, sonuc: raporSonucuMu(s.sonuc) ? s.sonuc : null, imzalandi: s.imzalandi.toISOString(),
    yeni: yeni?.no ?? null, saklamaBitti: !!s.silindi,
  };
}

/** 2026-10-17 (reisim: "rapor doğrulama ekranında raporun kendisi de gözüksün"): doğrulama sayfasının gösterdiği imzalı PDF — bu revizyonun imzalı
    sürümünün dosyası (saklama süresi dolup silindiyse null). OTURUMSUZ okunur; kapı çağıranda (kod + kısa ömürlü jeton — dogrula-sayfa.ts). */
export async function raporDogrulamaPdf(db: Sorgulayici, d: Depo, raporId: string, revizyon: number): Promise<Uint8Array | null> {
  const s = (await db.sorgu<{ dosya: string }>(
    `SELECT s.imzali_dosya::text AS dosya FROM rapor_surumu s LEFT JOIN saklama_silme k ON k.firma_id = s.firma_id AND k.surum_id = s.id
     WHERE s.rapor_id = $1 AND s.revizyon = $2 AND k.silindi IS NULL`, [raporId, revizyon])).rows[0];
  const x = s ? await kayitDosyasi(db, "rapor_imzali", raporId, s.dosya) : null;
  return x ? d.oku(x.anahtar, db) : null;
}
