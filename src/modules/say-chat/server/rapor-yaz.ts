/* S.A.Y CHAT · BEKLEYENLER İÇİN RAPOR YAZ (525; pkproje §3.10 m.12, m.19, m.21–22; maket 521 maket-saychat.js ekran 10 — reisim 2026-10-13: "onayılıyorum,
   yap bitir"). Kişinin kayıtları sırayla rapor TASLAĞI olur; her kayıt kendi veritabanı işleminde (biri olmazsa öteki etkilenmez, kayıt bekler):
   · koşullar raporu açan işlevlerde aynen: plan günü, tamamlanmış planda yeni rapor yok (519), günlük süre / mesai (ENGEL 3 — sığmayan açılmaz),
     rapor numarası sunucuda (internet); "Yeni ekle"de ekipman kodu bu anda istenir (m.19 — biçim ve firmada eşsizlik plan içi "Ekipman ekle" ile
     aynı denetim; kullanım yeri mesajın "Kullanım yeri" satırından), ekipman plana eklenir;
   · mesajın değerleri raporun alanlarına (türüne uymayan yazılmaz, adı söylenir), not → uzman yorumu; ekipman fotoğrafları raporun fotoğraf
     bölümüne, okunacak fotoğraflar o bölüme OKUMA fotoğrafı olarak (belgede yok); 542 (reisim 2026-10-14: "etiket fotoğrafını koysun daha sonra
     raporu gönderirken yapay zeka okuyacak"): etiket fotoğrafı, mesajda boş kalan bilgi varsa ve formatta ekipman bilgileri fotoğraftan
     doldurulabiliyorsa raporun ekipman bilgilerine OKUMA fotoğrafı olarak konur ve okunur (yalnız boş alanlara girer);
   · rapor açılınca kayıt sohbetten SİLİNİR (fotoğrafları çöpe — kopyaları raporda); raporun üstüne "S.A.Y Chat kaydından oluşturuldu" şeridi.
   549 (sunum 546 K2): ekipmanın kişinin kendi Yeni raporu varsa yeni rapor açılmaz — kayıt O RAPORUN BOŞ alanlarına girer (dolu alan değişmez,
   adı şeritte), fotoğraflar o rapora eklenir.
   Okunacak fotoğrafların yapay zekâyla okunması eylemde (çağrı işlemin DIŞINDA) — okunanlar raporda bekler (raporlar/server/oneri.ts), rapor açılınca boş alanlara girer (542). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaCope, kayitDosyasi } from "../../../server/dosya/dosya.ts";
import { sil, tablo } from "../../../server/db/yazici.ts";
import { yzHazirMi } from "../../../server/yz/kullanim.ts";
import { TAMAMLANDI_RAPOR } from "../../planlar/sema.ts";
import { bugunTr } from "../../planlar/server/planlar.ts";
import { yeniEkipman } from "../../planlar/server/plan-ici.ts";
import { formatSurumuOku } from "../../rapor-format/server/formatlar.ts";
import { sahaTanimi } from "../../../format/tablo.ts";
import { raporOneriYaz } from "../../raporlar/server/oneri.ts";
import { mesaiDurumu } from "../../raporlar/server/plan-baglanti.ts";
import { chatRaporuDoldur, raporOlustur } from "../../raporlar/server/raporlar.ts";
import { okumaHedefleri } from "../../raporlar/say-doldur.ts";
import { dagit, type ChatFoto, type ChatTanimi } from "../sema.ts";
import { chatKapisi, DOSYA_SAY_CHAT, type Kisi } from "./kayitlar.ts";

const KAYIT = tablo({ ad: "say_chat_kayit", sutunlar: ["mesaj"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** "Oluşturmadan önce" koşulları (panel gösterir; raporu açan işlevler yine denetler) */
export async function raporKosullari(db: Sorgulayici, p: { durum: string; baslangic: string; personelId: string | null }): Promise<{ engel: string | null; mesai: string }> {
  const bugun = bugunTr();
  if (p.durum === "tamamlandi") return { engel: TAMAMLANDI_RAPOR, mesai: "" };
  if (p.baslangic > bugun) return { engel: "Plan günü gelmedi: rapor plan gününde oluşturulur.", mesai: "" };
  const m = p.personelId ? await mesaiDurumu(db, p.personelId, bugun) : null;
  if (!m || !m.acik) return { engel: null, mesai: "Mesai takibi kapalı: günlük süre sınırı yok." };
  if (m.dolu) return { engel: "Günlük süre doldu: bugün yeni rapor oluşturulamaz.", mesai: "" };
  return { engel: null, mesai: `Günlük süre: bugün ${m.toplam} dk kullanıldı, sınır ${m.normal + m.hak} dk — sığmayan rapor açılmaz, kaydı bekler.` };
}

export interface RaporYazIstegi { kayit: string; kod: string | null }
export type KayitRaporSonucu =
  | { kayit: string; durum: "tamam"; rapor: { id: string; no: string }; okumalar: { bolum: string; dosya: string; tur: "alan" | "tablo" }[] }
  | { kayit: string; durum: "hata"; neden: string; alan?: "kod" };

type KayitDb = { id: string; plan_id: string; ekipman_id: string | null; tur_id: string | null; mesaj: string[]; tanim: ChatTanimi | null; fotolar: ChatFoto[] };

/** tek kaydın raporu (kendi işleminde çağrılır) */
export async function chatRaporYaz(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, planId: string, istek: RaporYazIstegi): Promise<KayitRaporSonucu> {
  const hata = (neden: string, alan?: "kod"): KayitRaporSonucu => ({ kayit: istek.kayit, durum: "hata", neden, ...(alan ? { alan } : {}) });
  const p = await chatKapisi(db, kim, planId);
  if (!p) return hata("S.A.Y Chat bu planda kapalı.");
  if (!UUID.test(istek.kayit)) return hata("Kayıt bulunamadı.");
  const k = (await db.sorgu<KayitDb>("SELECT id::text, plan_id::text, ekipman_id::text, tur_id::text, mesaj, tanim, fotolar FROM say_chat_kayit WHERE cihaz_id = $1 FOR UPDATE",
    [istek.kayit])).rows[0];
  if (!k || k.plan_id !== p.id) return hata("Kayıt bulunamadı (silinmiş ya da raporu yazılmış).");
  if ((!k.ekipman_id && !k.tur_id) || !k.tanim) return hata("Kaydın ekipmanı seçilmedi; kaydı açıp ekipmanı seçin.");
  if (!k.fotolar.some((f) => f.rol === "ekipman")) return hata("Kayıtta ekipman fotoğrafı yok; kaydı açıp fotoğraf ekleyin.");
  const d = dagit(k.tanim, k.mesaj);
  const ad = new Map(k.tanim.satirlar.map((s) => [s.alan, s.ad]));
  /* ekipman: plandaki ya da yeni (kod şimdi; kullanım yeri ve seri no mesajdan) */
  let ekipmanId = k.ekipman_id;
  if (!ekipmanId) {
    if (!istek.kod?.trim()) return hata("Ekipman kodunu yazın (etiketteki; firmada eşsiz).", "kod");
    const y = await yeniEkipman(db, kim, p.id, { kod: istek.kod, tur: k.tur_id, seri: (d.degerler["e:seri"] ?? "").slice(0, 30) || null,
      konum: (d.degerler["e:konum"] ?? "").slice(0, 60) || null });
    if (y.durum !== "tamam" || !y.id) {
      const h = y.durum === "gecersiz" ? y.hatalar : null;
      return h?.kod ? hata(h.kod, "kod") : hata(y.durum === "red" ? y.neden : h ? Object.values(h)[0] ?? "Ekipman eklenemedi." : "Ekipman plana eklenemedi.");
    }
    ekipmanId = y.id;
  }
  /* 549: kişinin kendi Yeni raporu varsa o rapor (yalnız boş alanlar); başka rapor varsa kayıt bekler */
  const varOlan = p.raporlar.find((x) => x.ekipmanId === ekipmanId);
  if (varOlan && !varOlan.benimTaslak) return hata("Bu ekipmanın raporu sizin Yeni raporunuz değil; kayıt yazılamaz.");
  const r = varOlan ? { durum: "tamam" as const, id: varOlan.id } : await raporOlustur(db, kim, p.id, ekipmanId);
  if (r.durum !== "tamam") {
    return hata(r.durum === "red" ? r.neden : r.durum === "gecersiz" ? Object.values(r.hatalar)[0] ?? "Rapor açılamadı." : r.durum === "yetkisiz" ? "Rapor açma yetkiniz yok." : "Rapor açılamadı.");
  }
  const format = (await db.sorgu<{ format_id: string; no: string }>("SELECT format_id::text, no FROM rapor WHERE id = $1", [r.id])).rows[0];
  /* 2026-10-24: serbest tablo sanal bölümlerine açık (raporlar ile aynı) */
  const ham = format ? (await formatSurumuOku(db, format.format_id))?.tanim ?? null : null;
  const tanim = ham ? sahaTanimi(ham) : null;
  const bolumler = tanim?.bolumler ?? [];
  /* fotoğraflar: kaydın dosyaları okunur, rapora kopyalanır (tür, EXIF, sınır yine raporun fotoğraf yolunda) */
  const oku = async (f: ChatFoto) => {
    const x = await kayitDosyasi(db, DOSYA_SAY_CHAT, k.id, f.dosya);
    return x ? { ad: f.ad, bayt: await depo.oku(x.anahtar, db) } : null;
  };
  const fotolar = (await Promise.all(k.fotolar.filter((f) => f.rol === "ekipman").map(oku))).filter((x): x is { ad: string; bayt: Uint8Array } => !!x);
  const acik = new Set(k.tanim.okunacak.filter((o) => o.acik).map((o) => o.k));
  const okumalar = (await Promise.all(k.fotolar.filter((f) => f.rol === "okunacak" && f.k && acik.has(f.k)).map(async (f) => {
    const x = await oku(f); return x ? { ...x, bolum: f.k! } : null;
  }))).filter((x): x is { ad: string; bayt: Uint8Array; bolum: string } => !!x);
  /* 542: etiket — mesajda boş kalan bilgi varsa ve formatın ekipman bilgileri fotoğraftan doldurulabiliyorsa okunur (yalnız boş alanlara girer) */
  const etiket = k.fotolar.find((f) => f.rol === "etiket");
  const bosSatir = k.tanim.satirlar.some((s) => s.alan !== "yorum" && !d.degerler[s.alan]);
  if (etiket && bosSatir && tanim && okumaHedefleri(tanim).has("ekipman")) {
    const x = await oku(etiket);
    if (x) okumalar.unshift({ ...x, ad: "Etiket fotoğrafı.jpg", bolum: "ekipman" });
  }
  const doldu = await chatRaporuDoldur(db, depo, kim, firmaId, r.id, {
    degerler: Object.entries(d.degerler).map(([anahtar, deger]) => ({ anahtar, ad: ad.get(anahtar) ?? (anahtar === "yorum" ? "Not" : anahtar), deger })),
    fotolar, okumalar, yalnizBos: !!varOlan,
  });
  if (doldu.durum !== "tamam") return hata("Rapor açıldı ama mesaj yazılamadı; raporu açıp elle doldurun.");
  /* kayıt silinir, fotoğrafları çöpe (kopyaları raporda) */
  await sil(db, KAYIT, k.id, { kim: kim.ad, ne: "say_chat.rapor_yazildi" });
  for (const f of k.fotolar) await dosyaCope(db, f.dosya, { kim: kim.ad, ne: "say_chat.rapor_yazildi" });
  /* şerit: ne geldi, ne okundu */
  const okunacakAd = [...new Set(doldu.okuma.map((o) => (o.bolum === "ekipman" ? "etiket" : bolumler.find((b) => b.id === o.bolum)?.ad ?? o.bolum)))];
  const yz = await yzHazirMi(db);
  const metin = [
    `Mesajdan ${doldu.yazilan} bilgi geldi${doldu.foto ? `, ${doldu.foto} ekipman fotoğrafı rapora geçti` : ""}.`,
    doldu.dolu.length ? `Raporda dolu olduğu için değişmeyen: ${doldu.dolu.join(", ")}.` : "",
    doldu.fotoBolumuYok ? "Formatta fotoğraf bölümü olmadığı için ekipman fotoğrafları eklenmedi." : "",
    doldu.atlanan.length ? `Biçime uymadığı için yazılmayan: ${doldu.atlanan.join(", ")}.` : "",
    okunacakAd.length ? (yz ? `Yapay zekâ okudu: ${okunacakAd.join(", ")} — değerler boş alanlara girdi (emin olunmayan sarı); kontrol edip kaydedin.`
      : `Fotoğraflar (${okunacakAd.join(", ")}) rapora eklendi; S.A.Y'a “Fotoğrafları oku ve gir” deyince okunur.`) : "",
  ].filter(Boolean).join(" ");
  await raporOneriYaz(db, kim, r.id, "", "bilgi", { metin });
  return {
    kayit: istek.kayit, durum: "tamam", rapor: { id: r.id, no: format?.no ?? "" },
    okumalar: yz ? doldu.okuma.map((o) => ({ ...o, tur: bolumler.find((b) => b.id === o.bolum)?.blok === "olcum" ? "tablo" as const : "alan" as const })) : [],
  };
}
