/* SAHA LİSTESİNDEN RAPOR (2026-11-08; kurallar ../saha-listesi.ts) — kuyruktan "rapor.saha" (islem-baglanti.ts): rapor raporOlustur ile açılır (plan günü, günlük süre, yetki,
   ekipmanın bu planda raporu var mı aynen; ölçüm cihazı kendiliğinden seçilir, bilgiler tesis kaydından ve önceki rapordan), cevaplar ve saat tek kayıtla yazılır (raporKaydet),
   sohbetten seçilen fotoğraflar kopyalanır. Yazma başarısızsa açılan rapor kalmaz (taslak silinir, iş yeniden denenebilir). Yapay zekâ yok. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dogrula } from "../../../sema/ortak.ts";
import { turKarti } from "../../ekipman-turleri/server/turler.ts";
import { raporIcinPlan } from "../../planlar/server/plan-ici.ts";
import { sahaFotolari, sahaFotolariIsaretle } from "../../say-chat/server/mesajlar.ts";
import { sahaBaslangici, sahaCevaplari, SahaRaporuGirdisi } from "../saha-listesi.ts";
import { saatPlani } from "../saat-plani.ts";
import { planGunu } from "../tamamla.ts";
import { mesaiBaslangici } from "./plan-baglanti.ts";
import { fotoEkle, raporKaydet, raporOlustur, raporSil, sahaRaporu, type Kisi, type RaporYazma } from "./raporlar.ts";

/** türün süresi boşsa (say-islemleri VARSAYILAN_SURE_DK ile aynı — reisim 2026-10-31) */
const VARSAYILAN_SURE_DK = 15;
const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
const metinle = (o: Record<string, string | null>) => Object.fromEntries(Object.entries(o).map(([k, x]) => [k, x ?? ""]));

/** kişinin o günkü son raporunun bitiş saati ("SS:DD"); yoksa null */
async function sonBitis(db: Sorgulayici, personelId: string, gun: string): Promise<string | null> {
  return (await db.sorgu<{ s: string | null }>(
    `SELECT to_char(max(bit) AT TIME ZONE 'Europe/Istanbul', 'HH24:MI') AS s FROM rapor
     WHERE personel_id = $1 AND silindi IS NULL AND (bit AT TIME ZONE 'Europe/Istanbul')::date = $2::date`, [personelId, gun])).rows[0]?.s ?? null;
}

export async function sahaRaporuAc(db: Sorgulayici, dosya: { depo: Depo; firmaId: string }, kim: Kisi, girdi: unknown): Promise<RaporYazma> {
  const g = dogrula(SahaRaporuGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: { rapor: "Saha listesi satırı okunamadı." } };
  const v = g.veri;
  const y = await raporOlustur(db, kim, v.plan, v.ekipman);
  if (y.durum !== "tamam") return y;
  const s = await sahaRaporu(db, kim, y.id);
  const plan = await raporIcinPlan(db, kim, v.plan);
  if (!s || !plan?.personelId) return { durum: "yok" };
  const gun = planGunu(GUN.format(new Date()), { baslangic: plan.baslangic, bitis: plan.bitis });
  const sure = (await turKarti(db, kim, s.tur.id))?.sure ?? VARSAYILAN_SURE_DK;
  const [p] = saatPlani({ gun, baslangic: sahaBaslangici(await mesaiBaslangici(db), await sonBitis(db, plan.personelId, gun)), ara: 0, raporlar: [{ id: y.id, sure, periyot: s.tur.periyot }] });
  const { cevaplar } = sahaCevaplari(s.tanim, s.cevaplar, v);
  const k = await raporKaydet(db, kim, y.id, s.surum, {
    ekipman: metinle(s.ekipmanBilgi),
    tarih: { ...metinle(s.tarih), bas: p!.bas.replace(" ", "T"), bit: p!.bit.replace(" ", "T"), sonraki: p!.sonraki, rapor: gun },
    cevaplar,
  });
  if (k.durum !== "tamam") {
    /* yarım rapor kalmaz: kullanıcı nedeni görür, satırı düzeltip yeniden gönderir */
    await raporSil(db, kim, y.id, (await sahaRaporu(db, kim, y.id))?.surum ?? s.surum);
    return k;
  }
  /* sohbetteki fotoğraflar: bölümün fotoğrafı olarak; sığmayan rapor açılmasına engel olmaz (fotoğraf mesajı işlenmemiş kalır, sohbette durur) */
  const bolum = s.tanim.bolumler.find((x) => x.blok === "foto")?.id;
  if (bolum && v.sohbet.length) {
    const konan: string[] = [];
    for (const f of await sahaFotolari(db, dosya.depo, v.sohbet)) {
      const guncel = await sahaRaporu(db, kim, y.id);
      if (!guncel) break;
      const r = await fotoEkle(db, dosya.depo, kim, dosya.firmaId, y.id, guncel.surum, { bolum, madde: null }, { ad: f.ad, bayt: f.bayt });
      if (r.durum === "tamam") konan.push(f.cihaz);
    }
    if (konan.length) await sahaFotolariIsaretle(db, kim, konan, { id: plan.id, no: plan.no });
  }
  return { ...y, bildirim: `${s.no} · ${s.ekipman.kod}` };
}
