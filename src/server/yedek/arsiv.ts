/* PROBATA'NIN AYLIK ARŞİV YEDEĞİ (2026-11-03; sunum: "aylık dosya firmanın Drive'ı bağlı olsun olmasın her ay probata'nın kendi deposuna da yazılır ve
   saklama süresi boyunca durur"). Firmanın kendi işleminde, gece işinin ilk adımı:
   1. Bu yılın tam kopyası yoksa alınır (özellik açıldığında bir kez, sonra her yılbaşı) — değişiklik kaydı ondan önceki veriyi bilmez.
   2. Biten her ayın değişiklikleri aylık dosyaya yazılır ve o aya kadarki değişiklik kaydı silinir (ikisi aynı işlemde: dosya yazılmadan kayıt gitmez).
   3. Son 12 ay tutulur (2026-11-04, K3; reisim: "supabase de sadece 1 yıllık" — uzun süreli yedek firmanın Drive'ında): 12 aydan eski aylık
      dosyalar ve geçen yıldan eski tam kopyalar silinir (geçen yılın tam kopyası, o yılın son aylarının tabanı olarak kalır).
   Dosyalar tek dosya yolunun anahtarıyla (modül "yedek_arsiv") ama dosya kaydı olmadan — kimse indiremez; kayıt yedek_arsiv'de. */
import { createHash, randomUUID } from "node:crypto";
import type { Sorgulayici } from "../db/kiraci.ts";
import type { Depo } from "../dosya/depo.ts";
import { dosyaAnahtari } from "../dosya/anahtar.ts";
import { ayDosyasi, tamKopya } from "./veri.ts";
import { ayAraligi, donemi } from "./yol.ts";

export const ARSIV_MODULU = "yedek_arsiv";
/** probata arşivinde tutulan ay sayısı (K3) */
export const ARSIV_AY = 12;
export interface ArsivOzeti { tam: number; ay: number; silinen: number }

async function firmaKimligi(db: Sorgulayici): Promise<string> {
  const r = (await db.sorgu<{ id: string | null }>("SELECT gecerli_firma()::text AS id")).rows[0]?.id;
  if (!r) throw new Error("Firma bağlamı yok");
  return r;
}

/** depo kovasının tek dosya sınırı 30 MB (supabase.ts) — arşiv 25 MB'lık parçalarla yazılır */
export const ARSIV_PARCA = 25 * 1024 * 1024;

/** arşive yazar; kaydın kimliğini döner (2026-11-04: geri yüklemeden önceki hâl de buradan — tur "once") */
export async function arsivYaz(db: Sorgulayici, depo: Depo, tur: "tam" | "ay" | "once", donem: string, bayt: Uint8Array): Promise<string> {
  const id = randomUUID(), firmaId = await firmaKimligi(db), anahtarlar: string[] = [];
  for (let i = 0; i < Math.max(1, bayt.length); i += ARSIV_PARCA) {
    const anahtar = dosyaAnahtari({ firmaId, modul: ARSIV_MODULU, kayitId: id, dosyaId: randomUUID() });
    await depo.yaz(anahtar, bayt.subarray(i, i + ARSIV_PARCA), db, "application/zip");
    anahtarlar.push(anahtar);
  }
  await db.sorgu("INSERT INTO yedek_arsiv (id, tur, donem, anahtarlar, boyut, sha256) VALUES ($1, $2, $3, $4, $5, $6)",
    [id, tur, donem, anahtarlar, bayt.length, createHash("sha256").update(bayt).digest("hex")]);
  return id;
}

/** tur kaydını siler (depodaki parçalarla); geri yüklemeden sonra yılın tam kopyası yenilenirken */
export async function arsivSil(db: Sorgulayici, depo: Depo, tur: "tam" | "ay" | "once", donem: string): Promise<void> {
  const e = (await db.sorgu<{ id: string; anahtarlar: string[] }>("SELECT id::text, anahtarlar FROM yedek_arsiv WHERE tur = $1 AND donem = $2", [tur, donem])).rows[0];
  if (!e) return;
  for (const a of e.anahtarlar) await depo.copSil(a, db);
  await db.sorgu("DELETE FROM yedek_arsiv WHERE id = $1", [e.id]);
}

export async function arsivOku(db: Sorgulayici, depo: Depo, tur: "tam" | "ay" | "once", donem: string): Promise<{ bayt: Uint8Array; olustu: Date } | null> {
  const r = (await db.sorgu<{ anahtarlar: string[]; olustu: Date; boyut: string; sha256: string }>(
    "SELECT anahtarlar, olustu, boyut::text, sha256 FROM yedek_arsiv WHERE tur = $1 AND donem = $2", [tur, donem])).rows[0];
  if (!r) return null;
  const parcalar: Uint8Array[] = [];
  for (const a of r.anahtarlar) parcalar.push(await depo.oku(a, db));
  const bayt = new Uint8Array(parcalar.reduce((n, x) => n + x.length, 0));
  let o = 0;
  for (const p of parcalar) { bayt.set(p, o); o += p.length; }
  if (bayt.length !== Number(r.boyut) || createHash("sha256").update(bayt).digest("hex") !== r.sha256) throw new Error("Arşiv dosyası bozuk (özet tutmuyor)");
  return { bayt, olustu: r.olustu };
}

export async function arsivAdimi(db: Sorgulayici, depo: Depo, simdi: Date): Promise<ArsivOzeti> {
  const o: ArsivOzeti = { tam: 0, ay: 0, silinen: 0 };
  const d = donemi(simdi);
  /* 1 · bu yılın tam kopyası */
  if (!(await db.sorgu("SELECT 1 FROM yedek_arsiv WHERE tur = 'tam' AND donem = $1", [String(d.yil)])).rowCount) {
    await arsivYaz(db, depo, "tam", String(d.yil), (await tamKopya(db, simdi)).bayt);
    o.tam++;
  }
  /* 2 · biten aylar (değişiklik kaydında bu aydan önceki zamanlar) */
  const aylar = (await db.sorgu<{ donem: string }>(
    `SELECT DISTINCT to_char(zaman AT TIME ZONE 'Europe/Istanbul', 'YYYY-MM') AS donem FROM yedek_degisiklik WHERE zaman < $1 ORDER BY 1`, [d.ayBasi])).rows;
  for (const { donem } of aylar) {
    const [bas, son] = ayAraligi(donem);
    if (!(await db.sorgu("SELECT 1 FROM yedek_arsiv WHERE tur = 'ay' AND donem = $1", [donem])).rowCount) {
      const f = await ayDosyasi(db, donem, simdi);
      if (f) { await arsivYaz(db, depo, "ay", donem, f.bayt); o.ay++; }
    }
    await db.sorgu("DELETE FROM yedek_degisiklik WHERE zaman >= $1 AND zaman < $2", [bas, son]);
  }
  /* 3 · 12 aydan eski arşiv */
  const esikAy = new Date(Date.UTC(d.yil, Number(d.ay.slice(5, 7)) - 1 - ARSIV_AY, 1)).toISOString().slice(0, 7);
  const eski = (await db.sorgu<{ id: string; anahtarlar: string[] }>(
    "SELECT id::text, anahtarlar FROM yedek_arsiv WHERE (tur = 'ay' AND donem < $1) OR (tur = 'tam' AND donem < $2) OR (tur = 'once' AND olustu < now() - interval '30 days')", [esikAy, String(d.yil - 1)])).rows;
  for (const e of eski) {
    for (const a of e.anahtarlar) await depo.copSil(a, db);
    await db.sorgu("DELETE FROM yedek_arsiv WHERE id = $1", [e.id]);
    o.silinen++;
  }
  return o;
}
