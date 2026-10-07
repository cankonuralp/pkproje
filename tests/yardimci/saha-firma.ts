/* TEST YARDIMCISI — sahada raporu olan uydurma firma (357; tests/foto-oku.test.ts firmaKur deseni): müşteri + tesis, iki denetçi (personeliyle),
   planlama, firma yöneticisi, elektrik yöneticisi, ekipman türü (ZPKR02 yayında) + ekipman, plan (denetçi kabul etti) ve denetçinin Yeni raporu.
   Hepsi modülün kendi işlevleriyle; ham SQL yalnız kayıt tohumu (müşteri, personel, hesap, tür). */
import assert from "node:assert/strict";
import { planKabul, planIci } from "../../src/modules/planlar/server/plan-ici.ts";
import { bugunTr, planAc, type Kisi } from "../../src/modules/planlar/server/planlar.ts";
import { taslakBaslat, yayinla } from "../../src/modules/rapor-format/server/formatlar.ts";
import { raporOlustur } from "../../src/modules/raporlar/server/raporlar.ts";
import { kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import type { Depo } from "../../src/server/dosya/depo.ts";

export interface SahaFirmasi { yon: Kisi; elk: Kisi; plan: Kisi; den1: Kisi; den2: Kisi; den1Personel: string; tur: string; rapor: string }
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };

export async function sahaFirmasi(havuz: Havuz, depo: Depo, firma: string, ek: string): Promise<SahaFirmasi> {
  const f = await kiraciIcinde(havuz, firma, async (db) => {
    const q = async (sql: string, p: unknown[] = []) => (await db.sorgu<{ id: string }>(sql, p)).rows[0].id;
    const m = await q("INSERT INTO musteri (unvan, kisa, eposta, tel) VALUES ('Deneme Sanayi A.Ş.', 'Deneme', $1, '0312 000 00 00') RETURNING id::text", [`iletisim@${ek}.example`]);
    const tesis = await q("INSERT INTO tesis (musteri_id, ad, adres, il, ilce, sgk) VALUES ($1, 'Merkez', 'Deneme Cad. 1', 'Ankara', 'Çankaya', $2) RETURNING id::text", [m, "2".repeat(26)]);
    const per = (ad: string) => q("INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ($1, '2024-01-01', 'elk-muh', '123') RETURNING id::text", [ad]);
    const h = async (eposta: string, rol: string, personel: string | null = null) => kisi(await q(
      "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, 'Deneme', $2, 'etkin', $3) RETURNING id::text", [`${eposta}@${ek}.example`, [rol], personel]), rol);
    const p1 = await per("Deneme Bir"), p2 = await per("Deneme İki");
    const den1 = await h("den1", "denetci", p1), den2 = await h("den2", "denetci", p2);
    const plan = await h("plan", "planlama"), yon = await h("yon", "firma_yoneticisi"), elk = await h("elk", "elektrik_yonetici");
    const tur = await q("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('EP', 'Elektrik panosu', 'elektrik', 'e', 12) RETURNING id::text");
    const ekp = await q("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, 'EP-A1', 'x') RETURNING id::text", [tesis, tur]);
    return { yon, elk, plan, den1, den2, p1, tesis, tur, ekp };
  });
  await kiraciIcinde(havuz, firma, async (db) => {
    const t = tamam(await taslakBaslat(db, f.yon, f.tur, "sablon:ZPKR02", null));
    tamam(await yayinla(db, f.yon, t.id, t.surum, ""));
  }, { hesapId: f.yon.id });
  const bugun = bugunTr();
  const plan = tamam(await kiraciIcinde(havuz, firma, (db) => planAc(db, depo, f.plan, firma,
    { tesis: f.tesis, baslangic: bugun, bitis: bugun, ekip: [{ personel: f.p1, isgNo: "ISG-1", kaydet: false }] }), { hesapId: f.plan.id })).id;
  const v = (await kiraciIcinde(havuz, firma, (db) => planIci(db, f.den1, plan), { hesapId: f.den1.id }))!;
  tamam(await kiraciIcinde(havuz, firma, (db) => planKabul(db, f.den1, plan, v.surum, true), { hesapId: f.den1.id }));
  const rapor = tamam(await kiraciIcinde(havuz, firma, (db) => raporOlustur(db, f.den1, plan, f.ekp), { hesapId: f.den1.id })).id;
  return { yon: f.yon, elk: f.elk, plan: f.plan, den1: f.den1, den2: f.den2, den1Personel: f.p1, tur: f.tur, rapor };
}
