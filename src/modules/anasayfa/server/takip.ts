/* YAN MENÜ TAKİP BALONLARI (339; maket maket-ortak.js takipHtml + maket-veri.js MV.TAKIP — T6, reisim 2026-09-28: "cihazlarda süresi geçen cihaz
   sayısı kırmızı balon, yaklaşan sarı balon … diğer modüllerde de benzer takip"; 35. tur 163: bekleyen sarı, süresi geçen kırmızı; N9: raporlar
   "kişiye göre"). Modül başına kırmızı / sarı sayı; 0 olan balon çizilmez. Sayılar modüllerin kendi, YETKİYE DUYARLI işlevlerinden (görmediği
   modülün balonu yok; "kendi" düzeyi yalnız kendisininki). Ana sayfa gibi başka modülün tablosuna dokunmaz. Bildirim değildir (anayasa 1.3).
   337–339 incelemesi (U4 / N5 / 236): balon kişinin KENDİ işi — Planlar yalnız ekibinde olduğu planlar (planı atanan kabul eder), Onaylar yalnız
   onaylayabildiği raporlar (firma yöneticisi onaylamaz), Araçlar Araçlar modülünden (kilometre + belge; yönetici hepsi, sürücü kendi aracı). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { hesabinPersoneli } from "../../../server/kimlik/hesap.ts";
import { duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { giderListesi } from "../../muhasebe/server/giderler.ts";
import { faturaListesi } from "../../muhasebe/server/muhasebe.ts";
import { aracTakip } from "../../araclar/server/araclar.ts";
import { onayListeleri } from "../../onaylar/server/onaylar.ts";
import { anaPlanlar, isgEksikPlanlar, type IsgEksikPlan } from "../../planlar/server/anasayfa-baglanti.ts";
import { kendiYeniRaporlarim } from "../../raporlar/server/anasayfa-baglanti.ts";
import { izinTalepleri } from "../../talepler/server/talepler.ts";
import { uyariListesi } from "../../uyarilar/server/uyarilar.ts";
import { bugunTr, type Kisi } from "./anasayfa.ts";

export interface TakipBalonu { kirmizi: number; sari: number; ad: { kirmizi: string; sari: string } }
/** modül (§3.1 numarası) → balon */
export type MenuTakip = Record<number, TakipBalonu>;

const saatGecti = (iso: string | null, saat: number) => !!iso && Date.now() - Date.parse(iso) > saat * 36e5;

/** 449: Sözleşmeler balonunun planları — kişinin gördüğü açık planlardan İSG-KATİP ID'si eksik / bitmiş olanlar (balonla AYNI süzgeç;
    Sözleşmeler sayfası gösterir: "1 yazıyor ama sebebini anlayamıyorum") */
export async function isgEksikTakip(db: Sorgulayici, kim: Kisi & YetkiHesabi): Promise<IsgEksikPlan[]> {
  if (duzey(kim, 13) === "yok" || duzey(kim, 12) === "yok") return [];
  const d = duzey(kim, 13), hep = d === "gor" || d === "yaz", ben = await hesabinPersoneli(db, kim.id);
  return isgEksikPlanlar(db, (await anaPlanlar(db)).filter((p) => hep || (!!ben && p.ekip.includes(ben))));
}

export async function menuTakip(db: Sorgulayici, kim: Kisi & YetkiHesabi): Promise<MenuTakip> {
  const t: MenuTakip = {}, bugun = bugunTr();
  const gor = (m: Parameters<typeof duzey>[1]) => duzey(kim, m) !== "yok";
  const hepsi = (m: Parameters<typeof duzey>[1]) => { const d = duzey(kim, m); return d === "gor" || d === "yaz"; };
  const koy = (no: number, kirmizi: number, sari: number, ad: TakipBalonu["ad"]) => { if (kirmizi > 0 || sari > 0) t[no] = { kirmizi, sari, ad }; };

  /* uyarılar ve kaynak modülleri: ölçüm cihazı kalibrasyonu (8), eğitim tekrarı (Dökümanlar 4) — Uyarılar düzeyiyle süzülü */
  const u = gor(20) ? (await uyariListesi(db, kim)) ?? [] : [];
  const say = (tur: string | null, d: "gecti" | "yakin") => u.filter((x) => (tur === null || x.tur === tur) && x.durum === d).length;
  koy(20, say(null, "gecti"), say(null, "yakin"), { kirmizi: "süresi geçen uyarı", sari: "yaklaşan uyarı" });
  if (gor(8)) koy(8, say("kal", "gecti"), say("kal", "yakin"), { kirmizi: "süresi geçen cihaz", sari: "süresi yaklaşan cihaz" });
  if (gor(4)) koy(4, say("egt", "gecti"), say("egt", "yakin"), { kirmizi: "eğitim tekrarı geçen", sari: "eğitim tekrarı yaklaşan" });
  /* araçlar (23): Araçlar modülünden — kilometre durumu + belgeler (karar 236) */
  const ar = gor(23) ? await aracTakip(db, kim) : null;
  if (ar) koy(23, ar.kirmizi, ar.sari, { kirmizi: "süresi geçen araç belgesi (muayene, sigorta, kasko) ya da geçen hafta girilmeyen kilometre",
    sari: "süresi yaklaşan araç belgesi ya da bu hafta bekleyen kilometre" });

  /* planlar (13): kabul bekleyen — yalnız kişinin ekibinde olduğu planlar (planı atanan kabul eder; U4); plan günü gelmiş olan kırmızı */
  if (gor(13)) {
    const hep = hepsi(13), ben = await hesabinPersoneli(db, kim.id);
    const planlar = (await anaPlanlar(db)).filter((p) => hep || (!!ben && p.ekip.includes(ben)));
    const bek = planlar.filter((p) => p.durum === "bekliyor" && !!ben && p.ekip.includes(ben)), gec = bek.filter((p) => p.baslangic <= bugun).length;
    koy(13, gec, bek.length - gec, { kirmizi: "plan günü gelmiş, kabul bekleyen plan", sari: "kabul bekleyen plan" });
    /* sözleşmeler (12): açık planda İSG-KATİP ID'si eksik ya da bitmiş (görebildiği planlar) — 449: hangi planlar olduğu Sözleşmeler sayfasında */
    if (gor(12)) koy(12, (await isgEksikPlanlar(db, planlar)).reduce((n, p) => n + p.eksik, 0), 0, { kirmizi: "açık planda İSG-KATİP SÖZLEŞME ID'si eksik ya da bitmiş", sari: "" });
  }

  /* raporlar (14, kişiye göre): kendi geri gönderilen (kırmızı) · onaya gönderilmemiş Yeni (sarı); imza bekleyen Onaylar'da */
  if (gor(14)) {
    const r = await kendiYeniRaporlarim(db, kim.id);
    koy(14, r.geri, r.yeni, { kirmizi: "size geri gönderilen rapor", sari: "onaya gönderilmemiş raporunuz" });
  }

  /* onaylar (15): imzasını bekleyen raporları + onay kuyruğundan ONAYLAYABİLDİKLERİ (branş yöneticisi; N5) + diğer belgeler; 24 saati geçen kırmızı */
  const o = gor(15) ? await onayListeleri(db, kim) : null;
  if (o) {
    const kuyruk = o.kuyruk.filter((x) => x.izin.onayla);
    const gec = o.imzaBekleyen.filter((x) => saatGecti(x.onay, 24)).length + kuyruk.filter((x) => saatGecti(x.gonderildi, 24)).length;
    koy(15, gec, o.imzaBekleyen.length + kuyruk.length - gec + o.belgeBekleyen,
      { kirmizi: "24 saati geçen imza / onay bekleyen rapor", sari: "imzanızı ya da onayınızı bekleyen rapor / belge" });
  }

  /* talepler (21): size iletilen bekleyen — izin (karar veren) ve masraf formu (Muhasebe'yi değiştiren) */
  if (gor(21)) {
    const izin = (await izinTalepleri(db, kim))?.filter((x) => x.durum === "bekliyor").length ?? 0;
    const masraf = hepsi(18) && duzey(kim, 18) === "yaz" ? ((await giderListesi(db, kim)) ?? []).filter((g) => g.kaynak === "form" && g.durum === "bekliyor").length : 0;
    koy(21, 0, izin + masraf, { kirmizi: "", sari: "size iletilen bekleyen talep" });
  }

  /* muhasebe (18): vadesi geçen fatura */
  if (hepsi(18)) koy(18, ((await faturaListesi(db, kim)) ?? []).filter((f) => f.durum === "gecikti").length, 0, { kirmizi: "vadesi geçen fatura", sari: "" });
  return t;
}
