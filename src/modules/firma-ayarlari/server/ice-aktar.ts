/* TOPLU İÇE AKTARMA — sunucu (337; maket firma-ayarlari "Toplu içe aktarma (ilk kurulum)"; göç 0047). Yetki: Firma ayarları "değiştirir" (modül 22).
   Satırlar istemcide okunur ama denetim burada YENİDEN yapılır (istemcinin "Eklenecek" dediğine güvenilmez): kayıtlı veri modüllerin bağlantılarından,
   kural ice-aktar.ts'te. İçe aktar: geçerli satırlar TEK işlemde eklenir (biri düşerse hiçbiri girmez), oluşturulan kayıtların listesiyle içe aktarma
   kaydı yazılır (veritabanı: liste yalnız bu işlemde oluşturulmuş kayıtlar). Geri al: yalnız son içe aktarma, kayıtlar kullanılmadıysa
   (veritabanı işlevi; kullanılmışsa hiçbiri silinmez). Öteki modüllerin tablolarına dokunmaz. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, izYaz, tablo, type Iz } from "../../../server/db/yazici.ts";
import { z } from "../../../sema/ortak.ts";
import { aracIceAktar, aracPlakalari } from "../../araclar/server/ice-aktar-baglanti.ts";
import { ekipmanIceAktar, ekipmanKodlari } from "../../ekipman/server/ice-aktar-baglanti.ts";
import { turOzetleri } from "../../ekipman-turleri/server/turler.ts";
import { musteriIceAktar, musteriIceAktarimBilgisi, tesisIceAktar } from "../../musteriler/server/ice-aktar-baglanti.ts";
import { cihazIceAktar, cihazIceAktarimBilgisi } from "../../olcum-cihazlari/server/ice-aktar-baglanti.ts";
import { personelIceAktar, personelIceAktarimBilgisi } from "../../personel/server/ice-aktar-baglanti.ts";
import { IA_SINIR, IA_TUR, IA_TURLER, iaDenetle, iaVeriSatirlari, type IaBilgi, type IaSatir, type IaTur } from "../ice-aktar.ts";
import { ayarlarYazar, type Kisi } from "./ayarlar.ts";

const KAYIT = tablo({ ad: "ice_aktarim", sutunlar: ["tur", "dosya", "adet", "atlanan", "kayitlar", "kim"], gizli: ["kayitlar"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const bugun = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

/** istemciden gelen: tür, dosya adı, okunan ham satırlar (başlık dahil olabilir) */
const Girdi = z.object({
  tur: z.enum(IA_TURLER, { error: "Ne yükleneceğini seçin." }),
  dosya: z.string().trim().min(1).max(200),
  /* ham satırlar okuyucunun sınırına kadar (boş satırlar da gelir); veri satırı sınırı boşlar atıldıktan sonra (denetle) */
  satirlar: z.array(z.array(z.string().max(IA_SINIR.hucre * 4)).max(50)).max(IA_SINIR.ham),
});
/** ekranda satır: değerler (kimlikler) istemciye gitmez */
export type IaSatirOzeti = Omit<IaSatir, "deger">;
export type IaSonuc =
  | { durum: "tamam"; satirlar: IaSatirOzeti[] }
  | { durum: "aktarildi"; bildirim: string }
  | { durum: "gecersiz"; neden: string } | { durum: "red"; neden: string } | { durum: "yetkisiz" };

async function bilgi(db: Sorgulayici, tur: IaTur): Promise<IaBilgi> {
  const b: IaBilgi = { bugun: bugun(), musteriler: [], tesisler: [], musteriEpostalari: [], ekipmanKodlari: [], ekipmanTurleri: [], cihazKodlari: [], cihazTurleri: [],
    personelAdlari: [], personelEpostalari: [], plakalar: [] };
  if (tur === "musteri" || tur === "ekipman") {
    const m = await musteriIceAktarimBilgisi(db);
    Object.assign(b, { musteriler: m.musteriler, tesisler: m.tesisler, musteriEpostalari: m.epostalar });
  }
  if (tur === "ekipman") Object.assign(b, { ekipmanKodlari: await ekipmanKodlari(db), ekipmanTurleri: (await turOzetleri(db)).map(({ id, ad, kod }) => ({ id, ad, kod })) });
  if (tur === "cihaz") { const c = await cihazIceAktarimBilgisi(db); Object.assign(b, { cihazKodlari: c.kodlar, cihazTurleri: c.turler }); }
  if (tur === "personel") { const p = await personelIceAktarimBilgisi(db); Object.assign(b, { personelAdlari: p.adlar, personelEpostalari: p.epostalar }); }
  if (tur === "arac") b.plakalar = await aracPlakalari(db);
  return b;
}

async function denetle(db: Sorgulayici, kim: Kisi, girdi: unknown): Promise<{ hata: IaSonuc } | { tur: IaTur; dosya: string; l: IaSatir[] }> {
  if (!ayarlarYazar(kim)) return { hata: { durum: "yetkisiz" } };
  const g = Girdi.safeParse(girdi);
  if (!g.success) return { hata: { durum: "gecersiz", neden: `Dosya okunamadı ya da çok büyük (en çok ${IA_SINIR.satir.toLocaleString("tr")} veri satırı, 50 sütun).` } };
  const satirlar = iaVeriSatirlari(g.data.tur, g.data.satirlar);
  if (!satirlar.length) return { hata: { durum: "gecersiz", neden: "Dosyada veri satırı yok." } };
  if (satirlar.length > IA_SINIR.satir) return { hata: { durum: "gecersiz", neden: `En çok ${IA_SINIR.satir.toLocaleString("tr")} satır; dosyayı bölün.` } };
  return { tur: g.data.tur, dosya: g.data.dosya, l: iaDenetle(g.data.tur, satirlar, await bilgi(db, g.data.tur)) };
}

/** satır satır denetim (içe aktarmadan önce ekranda) */
export async function iceAktarDenetle(db: Sorgulayici, kim: Kisi, girdi: unknown): Promise<IaSonuc> {
  const d = await denetle(db, kim, girdi);
  if ("hata" in d) return d.hata;
  return { durum: "tamam", satirlar: d.l.map(({ deger: _, ...x }) => x) };
}

/** içe aktar: geçerli satırlar tek işlemde; içe aktarma kaydı oluşturulan kayıtlarla */
export async function iceAktar(db: Sorgulayici, kim: Kisi, girdi: unknown): Promise<IaSonuc> {
  const d = await denetle(db, kim, girdi);
  if ("hata" in d) return d.hata;
  const ok = d.l.filter((x) => x.ok && x.deger);
  if (!ok.length) return { durum: "red", neden: "İçe aktarılacak geçerli satır yok." };
  const iz: Iz = { kim: kim.ad, ne: `ice_aktar.${d.tur}`, gerekce: d.dosya };
  const kayitlar: { t: string; id: string }[] = [];
  const yeniMusteri = new Map<string, string>();
  for (const s of ok) {
    const x = s.deger!;
    switch (x.t) {
      case "musteri": {
        let mid: string;
        if ("id" in x.musteri) mid = x.musteri.id;
        else {
          const var_ = yeniMusteri.get(x.musteri.anahtar);
          if (var_) mid = var_;
          else { mid = await musteriIceAktar(db, iz, x.musteri.yeni); yeniMusteri.set(x.musteri.anahtar, mid); kayitlar.push({ t: "musteri", id: mid }); }
        }
        kayitlar.push({ t: "tesis", id: await tesisIceAktar(db, iz, mid, x.tesis) });
        break;
      }
      case "ekipman": kayitlar.push({ t: "ekipman", id: await ekipmanIceAktar(db, iz, x) }); break;
      case "cihaz": kayitlar.push({ t: "cihaz", id: await cihazIceAktar(db, iz, x) }); break;
      case "personel": kayitlar.push({ t: "personel", id: await personelIceAktar(db, iz, x) }); break;
      case "arac": kayitlar.push({ t: "arac", id: await aracIceAktar(db, iz, x) }); break;
    }
  }
  const atlanan = d.l.length - ok.length;
  await ekle(db, KAYIT, { tur: d.tur, dosya: d.dosya, adet: ok.length, atlanan, kayitlar: JSON.stringify(kayitlar), kim: kim.ad }, iz);
  return { durum: "aktarildi", bildirim: `${IA_TUR[d.tur].ad}: ${ok.length} kayıt içe aktarıldı${atlanan ? `; ${atlanan} satır atlandı.` : "."}` };
}

const GERI_RED: Record<string, string> = {
  yok: "İçe aktarma bulunamadı.", geri: "Bu içe aktarma zaten geri alındı.", son_degil: "Yalnız son içe aktarma geri alınır.",
  kullanildi: "Geri alınamaz: içe aktarılan kayıtlar kullanılmaya başlandı (plan, rapor, teklif, zimmet, hesap ya da dosya). Kayıtları tek tek düzeltin ya da pasife alın.",
};
/** geri al (dene: yalnız dener, silmez — "geri alınabilir mi"). Veritabanı işlevi: yalnız son içe aktarma, kayıtlar kullanılmadıysa */
export async function iceAktarimGeriAl(db: Sorgulayici, kim: Kisi, id: string, dene: boolean): Promise<IaSonuc> {
  if (!ayarlarYazar(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id)) return { durum: "red", neden: GERI_RED.yok };
  const s = (await db.sorgu<{ s: string }>("SELECT ice_aktarim_geri_al($1::uuid, $2, $3) AS s", [id, kim.ad, dene])).rows[0].s;
  if (s === "olur") return { durum: "aktarildi", bildirim: "" };
  if (s !== "tamam") return { durum: "red", neden: GERI_RED[s] ?? GERI_RED.yok };
  const a = (await db.sorgu<{ tur: IaTur; adet: number }>("SELECT tur, adet FROM ice_aktarim WHERE id = $1", [id])).rows[0];
  await izYaz(db, { kim: kim.ad, ne: "ice_aktar.geri_al", nesne: "ice_aktarim", nesneId: id });
  return { durum: "aktarildi", bildirim: `${IA_TUR[a.tur].ad}: içe aktarma geri alındı (${a.adet} satır).` };
}
