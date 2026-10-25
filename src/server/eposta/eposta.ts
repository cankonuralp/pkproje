/* E-POSTA KUYRUĞU (432; göç 0077) — sistemden giden her e-posta önce buraya yazılır (alıcı başına bir satır: alıcılar birbirini görmez), sonra
   gönderilir (gonder.ts: yanıttan sonra; gece işi bekleyenleri yeniden dener). Modüller e-postayı YALNIZ buradan yazar; gönderimi çekirdek yapar.
   Bildirim yalnız reisim'in açtığı yerde (anayasa 1.3): 2026-10-09 plan açılınca ekip + bilgilendirme listesi.
   536 (reisim 2026-10-13: "kim mail gönder tuşuna basarsa onun mailinden gitmeli"): kuyruğa yazılırken tuşa basan kişinin adı ve e-postası (o
   anki hâli; göç 0087) satıra yazılır — Kimden gönderilirken bundan kurulur (kimden.ts); gönderen yoksa otomatik e-posta. Gönderen SUNUCUDA
   oturumdaki hesaptan (hesapGonderen), istemciden alınmaz.
   2026-10-25 (belge doldurma; reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir olmalı, bir müşteri için sözleşme
   açtığımda el ile girilmesi gereken yerleri girip öyle gönderebilmeliyim"; göç 0105): TEK PDF EKİ — tek dosya yolunda saklanmış dosyanın kimliği
   ve adı (ek_dosya + ek_ad, ikisi birlikte); ek de metin gibi yazıldığı gibi kalır (tetik). Baytlar gönderilirken depodan okunur (gonder.ts);
   okunamazsa e-posta eksiz GİTMEZ. Belgeyi saklayıp ekli e-postayı yazan ortak yol: belge-gonder.ts. */
import type { Sorgulayici } from "../db/kiraci.ts";
import { ekle, tablo, type Iz } from "../db/yazici.ts";

export const EPOSTA = tablo({ ad: "eposta", sutunlar: ["kime", "konu", "govde", "kaynak", "kaynak_id", "durum", "deneme", "son_hata", "gonderildi", "gonderen_ad", "gonderen_eposta",
  "ek_dosya", "ek_ad"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** sade e-posta biçimi (boşluk yok, tek @, noktalı alan adı); veritabanı CHECK'i küçük harf ve uzunluğu ayrıca denetler */
export const EPOSTA_BICIMI = /^[^\s@<>(),;:"\\]+@[^\s@<>(),;:"\\]+\.[^\s@<>(),;:"\\]{2,}$/;

/** adresleri küçük harfe çevirir, biçimi bozukları ve tekrarları atar (sıra korunur) */
export function adresler(l: readonly (string | null | undefined)[]): string[] {
  const g = new Set<string>();
  for (const x of l) {
    const a = (x ?? "").trim().toLowerCase();
    if (a.length <= 254 && EPOSTA_BICIMI.test(a)) g.add(a);
  }
  return [...g];
}

/** ekin gönderilecek adı: denetim karakteri, yol ayracı ve tırnak atılır, en çok 200 karakter (0105 CHECK) */
export const ekAdi = (ad: string) => ad.normalize("NFC").replace(/[\u0000-\u001f\u007f/\\"]/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);

export interface EpostaGirdisi {
  kime: readonly string[]; konu: string; govde: string; kaynak: string; kaynakId: string | null; gonderen?: { ad: string; eposta: string } | null;
  /** 2026-10-25 (göç 0105): tek PDF eki — tek dosya yolundaki dosyanın kimliği ve gönderilecek adı */
  ek?: { dosyaId: string; ad: string } | null;
}

/** alıcı başına bir kayıt yazar ("bekliyor"); yazılanların kimlikleri döner. Geçersiz adres yazılmaz. */
export async function epostaKuyruga(db: Sorgulayici, e: EpostaGirdisi, iz: Iz): Promise<string[]> {
  const l = adresler(e.kime);
  const idler: string[] = [];
  /* gönderen: adres biçimi bozuksa (eski kayıt) otomatik sayılır — Firma bilgileri › Rapor e-postasından gider */
  const g = e.gonderen ? adresler([e.gonderen.eposta])[0] : undefined, ad = e.gonderen?.ad.trim().slice(0, 120);
  const gonderen = g && ad ? { gonderen_ad: ad, gonderen_eposta: g } : { gonderen_ad: null, gonderen_eposta: null };
  /* ek: kimliği bozuk ya da adı boşsa yazılmaz — eksiz e-posta sessizce kuyruğa girmesin (çağıranın hatası; işlem bütünüyle geri alınır) */
  const ekAd = e.ek ? ekAdi(e.ek.ad) : "";
  if (e.ek && (!UUID.test(e.ek.dosyaId) || !ekAd)) throw new Error("e-posta eki geçersiz (dosya kimliği ya da adı)");
  const ek = e.ek ? { ek_dosya: e.ek.dosyaId, ek_ad: ekAd } : {};
  for (const kime of l) {
    const r = await ekle(db, EPOSTA, { kime, konu: e.konu.slice(0, 300), govde: e.govde.slice(0, 20000), kaynak: e.kaynak,
      kaynak_id: e.kaynakId && UUID.test(e.kaynakId) ? e.kaynakId : null, ...gonderen, ...ek }, iz);
    idler.push(r.id);
  }
  return idler;
}

export interface EpostaDurumu {
  id: string; kime: string; durum: "bekliyor" | "gonderildi" | "hata"; deneme: number; sonHata: string | null; gonderildi: string | null; olustu: string;
  /** 2026-10-25: kaynağı (plan · onbilgi …) ve eki (varsa) */
  kaynak: string; ek: { dosyaId: string; ad: string } | null;
}

/** bir kaydın (plan …) e-postaları, yazılış sırasıyla; kaynak tek ya da aynı kayda bağlı birkaç kaynak (plan + onbilgi). Yetki ÇAĞIRANDA. */
export async function kaynakEpostalari(db: Sorgulayici, kaynak: string | readonly string[], kaynakId: string): Promise<EpostaDurumu[]> {
  if (!UUID.test(kaynakId)) return [];
  const kaynaklar = typeof kaynak === "string" ? [kaynak] : [...kaynak];
  return (await db.sorgu<{ id: string; kime: string; durum: EpostaDurumu["durum"]; deneme: number; son_hata: string | null; gonderildi: Date | null; olustu: Date;
    kaynak: string; ek_dosya: string | null; ek_ad: string | null }>(
    `SELECT id::text, kime, durum, deneme, son_hata, gonderildi, olustu, kaynak, ek_dosya::text, ek_ad FROM eposta
       WHERE kaynak = ANY ($1::text[]) AND kaynak_id = $2 ORDER BY olustu, kime`, [kaynaklar, kaynakId])).rows
    .map((x) => ({ id: x.id, kime: x.kime, durum: x.durum, deneme: x.deneme, sonHata: x.son_hata, gonderildi: x.gonderildi?.toISOString() ?? null,
      olustu: x.olustu.toISOString(), kaynak: x.kaynak, ek: x.ek_dosya && x.ek_ad ? { dosyaId: x.ek_dosya, ad: x.ek_ad } : null }));
}
