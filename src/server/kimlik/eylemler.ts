"use server";
/* GİRİŞ / ÇIKIŞ SUNUCU EYLEMLERİ (09-E1–E3). Next sunucu eylemleri kökeni (Origin ↔ Host) zaten denetler; burada AYRICA denetlenir (CSRF iki
   katman). Girdi ortak şemayla doğrulanır; yanıt hesabın var olup olmadığını söylemez. Başarılı girişte çerez yazılır ve yalnız site içi
   dönüş adresine gidilir (açık yönlendirme yok). Müşteri kullanıcısı da aynı ekrandan girer (karar 35, 0030): e-posta bir müşteri girişiyse
   müşteri girişi denenir, ayrı çerez yazılır, panele (/portal) gidilir. */
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { parola as parolaSemasi, z } from "../../sema/ortak.ts";
import { havuz } from "../db/havuz.ts";
import { istekKiracisi } from "../kiraci/istek.ts";
import { ayniKoken, istemciIp } from "./koken.ts";
import { CEREZ, cerezAyari, guvenliDonus, istekOturumu, MUSTERI_CEREZ, musteriIstekOturumu } from "./istek.ts";
import { musteriCikis, musteriGirisiMi, musteriGirisYap, musteriParolaDegistir } from "./musteri.ts";
import { cikisYap, girisYap, parolaDegistir } from "./oturum.ts";

export interface GirisDurumu { hata?: string; eposta?: string; yonlendir?: string }

const GirisSemasi = z.object({
  eposta: z.string().trim().toLowerCase().max(254),
  parola: z.string().max(200),
  donus: z.string().max(200).optional(),
  hatirla: z.literal("1").optional(),
});

export async function girisEylemi(_onceki: GirisDurumu, form: FormData): Promise<GirisDurumu> {
  if (!(await ayniKoken())) return { hata: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const kiraci = await istekKiracisi();
  if (!kiraci) return { hata: "Bu adreste kayıtlı bir firma yok." };
  const g = GirisSemasi.safeParse({ eposta: form.get("eposta"), parola: form.get("parola"), donus: form.get("donus") || undefined, hatirla: form.get("hatirla") || undefined });
  if (!g.success || !g.data.eposta || !g.data.parola) return { hata: "E-posta ve parola yazılmalı.", eposta: String(form.get("eposta") ?? "").slice(0, 254) };
  const h = await headers();
  const HATALI = "E-posta ya da parola yanlış. 5 hatalı denemeden sonra giriş 15 dakika kilitlenir.";
  const KILITLI = "Çok sayıda hatalı deneme yapıldı; giriş 15 dakika kilitlendi. Daha sonra yeniden deneyin.";
  if (await musteriGirisiMi(havuz(), kiraci.firmaId, g.data.eposta)) {
    const m = await musteriGirisYap(havuz(), kiraci.firmaId, {
      eposta: g.data.eposta, parola: g.data.parola, ip: await istemciIp(), tarayici: h.get("user-agent") ?? undefined, hatirla: g.data.hatirla === "1",
    });
    if (!m.tamam) return { eposta: g.data.eposta, hata: m.neden === "kilitli" ? KILITLI : HATALI };
    (await cookies()).set(MUSTERI_CEREZ, m.belirtec, cerezAyari(m.bitis, m.hesap.hatirla));
    const md = guvenliDonus(g.data.donus) && g.data.donus.startsWith("/portal") ? g.data.donus : "/portal";
    return { yonlendir: m.hesap.durum === "ilk" ? `/giris/parola?donus=${encodeURIComponent(md)}` : md };
  }
  const sonuc = await girisYap(havuz(), kiraci.firmaId, {
    eposta: g.data.eposta, parola: g.data.parola, ip: await istemciIp(), tarayici: h.get("user-agent") ?? undefined, hatirla: g.data.hatirla === "1",
  });
  if (!sonuc.tamam) {
    return {
      eposta: g.data.eposta,
      hata: sonuc.neden === "kilitli" ? KILITLI : HATALI,
    };
  }
  (await cookies()).set(CEREZ, sonuc.belirtec, cerezAyari(sonuc.bitis, sonuc.hesap.hatirla));
  /* yönlendirme istemcide TAM sayfa geçişiyle (eylem içinden yönlendirilen sayfa yeni çerezi aynı istekte görmüyor — 2026-10-04 e2e yakaladı) */
  const donus = guvenliDonus(g.data.donus) ? g.data.donus : "/";
  /* geçici parolayla ilk giriş: parola değiştirme önerilir ("Şimdi değil" ile geçilebilir — karar 34) */
  if (sonuc.hesap.durum === "ilk") return { yonlendir: `/giris/parola${donus !== "/" ? `?donus=${encodeURIComponent(donus)}` : ""}` };
  return { yonlendir: donus };
}

export interface ParolaDurumu { hata?: { p1?: string; p2?: string; genel?: string }; yonlendir?: string }

/** geçici parolayla ilk girişte yeni parola (maket giris.html #/gecici). Oturumdaki hesap için; kiracı ve hesap istemciden alınmaz. */
export async function parolaBelirleEylemi(_onceki: ParolaDurumu, form: FormData): Promise<ParolaDurumu> {
  if (!(await ayniKoken())) return { hata: { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." } };
  const o = await istekOturumu();
  if (!o) return { yonlendir: "/giris?neden=oturum" };
  const p1 = String(form.get("p1") ?? ""), p2 = String(form.get("p2") ?? "");
  const s = parolaSemasi.safeParse(p1);
  if (!s.success) return { hata: { p1: s.error.issues[0]?.message ?? "En az 10 karakter; harf ve rakam içermeli." } };
  if (p1 !== p2) return { hata: { p2: "İki parola aynı değil." } };
  const h = await headers();
  const r = await parolaDegistir(havuz(), o.kiraci.firmaId, o.id, { yeni: p1, ip: await istemciIp(), tarayici: h.get("user-agent") ?? undefined, hatirla: o.hatirla });
  if (!r.tamam) {
    return { hata: r.neden === "ayni" ? { p1: "Yeni parola geçici parolayla aynı olamaz." } : { genel: "Parola değiştirilemedi. Yeniden giriş yapıp deneyin." } };
  }
  (await cookies()).set(CEREZ, r.belirtec, cerezAyari(r.bitis, o.hatirla));
  const donus = String(form.get("donus") ?? "");
  return { yonlendir: guvenliDonus(donus) ? donus : "/" };
}

export async function cikisEylemi(): Promise<void> {
  if (!(await ayniKoken())) redirect("/");
  const kiraci = await istekKiracisi();
  const c = await cookies();
  if (kiraci) {
    await cikisYap(havuz(), kiraci.firmaId, c.get(CEREZ)?.value);
    await musteriCikis(havuz(), kiraci.firmaId, c.get(MUSTERI_CEREZ)?.value);
  }
  c.delete(CEREZ);
  c.delete(MUSTERI_CEREZ);
  redirect("/giris?neden=cikis");
}

/** müşteri: geçici parolayla ilk girişte yeni parola (aynı ekran /giris/parola). Oturumdaki müşteri girişi için; kiracı ve giriş istemciden alınmaz. */
export async function musteriParolaEylemi(_onceki: ParolaDurumu, form: FormData): Promise<ParolaDurumu> {
  if (!(await ayniKoken())) return { hata: { genel: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." } };
  const o = await musteriIstekOturumu();
  if (!o) return { yonlendir: "/giris?neden=oturum" };
  const p1 = String(form.get("p1") ?? ""), p2 = String(form.get("p2") ?? "");
  const s = parolaSemasi.safeParse(p1);
  if (!s.success) return { hata: { p1: s.error.issues[0]?.message ?? "En az 10 karakter; harf ve rakam içermeli." } };
  if (p1 !== p2) return { hata: { p2: "İki parola aynı değil." } };
  const h = await headers();
  const r = await musteriParolaDegistir(havuz(), o.kiraci.firmaId, o.id, { yeni: p1, ip: await istemciIp(), tarayici: h.get("user-agent") ?? undefined, hatirla: o.hatirla });
  if (!r.tamam) {
    return { hata: r.neden === "ayni" ? { p1: "Yeni parola geçici parolayla aynı olamaz." } : { genel: "Parola değiştirilemedi. Yeniden giriş yapıp deneyin." } };
  }
  (await cookies()).set(MUSTERI_CEREZ, r.belirtec, cerezAyari(r.bitis, o.hatirla));
  const donus = String(form.get("donus") ?? "");
  return { yonlendir: guvenliDonus(donus) && donus.startsWith("/portal") ? donus : "/portal" };
}
