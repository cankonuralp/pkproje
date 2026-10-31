/* PLANLAR — S.A.Y'IN ÇAĞIRABİLDİĞİ İŞLEMLER (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım a; çekirdek src/server/yz/islem.ts). Her işlem
   modülün VAR OLAN işlevini oturumdaki kişiyle çağırır — Planlar ekranının tuşları ve sayfalarıyla aynı işlev, aynı yetki ve kural (plan_ac
   planlama / yönetici, kabul / red yalnız plandaki denetçi, ekipman ekle plan kabul edilmiş ya da denetimdeyken …); girdi modülün şemasından
   (sema.ts, src/sema/ortak.ts kimlik / surum, liste süzgeci). Burada yeni kural yok; sonuç kısa (listeler sayfalı). Ekipman kaydı (tesisin kalıcı
   ekipmanı) planın içinden yazılır — ayrı ekranı yok (reisim 2026-09-26).
   2026-10-16 (2. adım a incelemesi): plan_kabul'da beyan özeti ŞART (tuşun eylemi ve çevrimdışı plan.kabul gibi — metin okunmadan kabul yok);
   plan_ac sonucu ekranın gösterdiği uyarıları taşır (planKarti — engel değil, bilgi); plan_kunye_guncelle ekranda açık, kaydedilmemiş raporu
   ezmez (önce ekranın kaydı — EKRAN_KAYDEDILMEMIS). */
import { kimlik, surum, z } from "../../sema/ortak.ts";
import { sanalBolumler } from "../../format/tablo.ts";
import type { FormatTanimi } from "../../format/tanim.ts";
import { turKarti } from "../ekipman-turleri/server/turler.ts";
import { yayindakiFormat } from "../rapor-format/server/formatlar.ts";
import { SuzgecDurumuSemasi } from "../../server/liste/liste.ts";
import { EK_NO, ekBelgesi, EKRAN_KAYDEDILMEMIS, ekranRaporuKirli, GORUNMEZ, islem, kirp, sayfaBilgisi, sayfala, trIcerir, yazmaCevabi, type Islem, type SayfaTanimi, type IslemCevabi, type IslemBaglami } from "../../server/yz/islem.ts";
import { KunyeGirdisi, NotGirdisi, PLAN_DURUM, PlanAcGirdisi, RedGirdisi, SayEkipmanGirdisi, YeniEkipmanGirdisi } from "./sema.ts";
import { planSayfasi } from "./server/liste.ts";
import {
  ekipmanPasif, ekipmanSil, kayitliEkle, kontrolListesi, kunyeDuzenle, kunyeGuncelle, notEkle, planIci, planKabul, planReddet, planSil, planTamamla,
  sayEkipmanlarEkle, tamamlamaGeriAl,
  sahaTaramaYukle, sahaFormuOlustur, sahaTaramaKaldir,
} from "./server/plan-ici.ts";
import { planAc, planAcVerisi, planKarti, tesisPlanBilgisi } from "./server/planlar.ts";

import { doldurmaCevabi, doldurmaHazirla } from "../../server/yz/doldurma.ts";
import { ElleDegerGirdisi } from "../rapor-format/sema.ts";
import { onBilgiDoldur, planBelgeleri, sahaFormuDoldur } from "./server/plan-ici.ts";

const MODUL = 13;
const PLAN_ID = z.object({ plan: kimlik });
const PLAN_SURUM = z.object({ plan: kimlik, surum });
const durumAdi = (d: keyof typeof PLAN_DURUM) => PLAN_DURUM[d][0];

/** S.A.Y'ın ekipman eklemesinin cevabı: eklenenler kodlarıyla, eklenemeyenler nedeniyle */
/** 2026-10-31 (kalem 8 — K5): eklenen türde planda raporu olmayan ekipman zaten varsa sonuca "önce bunlar" uyarısı (26 Ekim: raporsuz kompresör dururken yenisi açıldı) */
async function mevcutUyarisi(b: IslemBaglami, plan: string, turler: readonly string[], c: IslemCevabi): Promise<IslemCevabi> {
  if (!c.tamam) return c;
  const p = await planIci(b.db, b.kim, plan);
  if (!p) return c;
  const raporlu = new Set(p.raporluEkipman), eklenen = new Set(((c.sonuc?.eklenen ?? []) as { id?: string }[]).map((e) => e.id));
  const bekleyen = p.ekipman.filter((e) => turler.includes(e.turId) && !raporlu.has(e.id) && !e.pasif && !eklenen.has(e.id));
  return bekleyen.length ? { ...c, sonuc: { ...c.sonuc, uyari: `Planda aynı türde raporu olmayan ekipman zaten vardı: ${bekleyen.map((e) => e.kod).join(", ")} — yeni eklediğin bunlardan biriyse eklediğini pasife al, onu kullan.` } } : c;
}
/** yayındaki formatın özeti (saf): bölüm adı ve türü; alanlar, madde sayısı, tablo sütunları, test değerleri */
function formOzeti(t: FormatTanimi): Record<string, unknown>[] {
  return t.bolumler.map((x) => ({ ad: x.ad, blok: x.blok,
    ...(x.blok === "bilgi" ? { alanlar: x.alanlar.map((a) => a.ad) } : {}),
    ...(x.blok === "liste" ? { madde: x.gruplar.reduce((n, g) => n + g.maddeler.length, 0), cevaplar: x.cevaplar } : {}),
    ...(x.blok === "olcum" ? { sutunlar: x.sutunlar.map((s) => s.ad) } : {}),
    ...(x.blok === "test" ? { degerler: x.degerler.map((d) => d.ad) } : {}),
    ...(x.blok === "tablo" ? { alanlar: sanalBolumler(x).flatMap((s) => (s.blok === "bilgi" ? s.alanlar.map((a) => a.ad) : [])) } : {}) }));
}
function ekipmanCevabi(r: Awaited<ReturnType<typeof sayEkipmanlarEkle>>): IslemCevabi {
  if (r.durum !== "tamam") return yazmaCevabi(r);
  if (!r.eklenen.length) return { tamam: false, neden: `Ekipman eklenemedi: ${r.eklenemeyen.map((x) => `${x.sira}. ${x.kod ?? ""} ${x.neden}`.trim()).join(" · ")}` };
  return { tamam: true, bildirim: r.eklenen.length === 1 ? `${r.eklenen[0].kod} eklendi.` : `${r.eklenen.length} ekipman eklendi.`,
    sonuc: { eklenen: r.eklenen, ...(r.eklenemeyen.length ? { eklenemeyen: r.eklenemeyen } : {}) } };
}

export const SAY_ISLEMLERI: readonly Islem[] = [
  islem({
    ad: "plan_ara", modul: MODUL, tur: "oku", girdi: SuzgecDurumuSemasi, kaynak: [SuzgecDurumuSemasi], islev: planSayfasi,
    tarif: "Görebildiğin planları arar (20'şer): ara (proje no, tesis, müşteri, adres), sec.durum (bekliyor | kabul | denetimde | tamamlandi | reddedildi), "
      + "sec.tarih (bugun | hafta | yedi), sec.brans (m | e), sayfa.",
    calistir: async (b, _v, ham) => {
      const l = await planSayfasi(b.db, b.kim, ham);
      if (!l) return { tamam: false, neden: "Bu kullanıcı Planlar'ı göremiyor." };
      return { tamam: true, sonuc: { ...sayfaBilgisi(l), planlar: l.gorunen.map((p) => ({ id: p.id, no: p.no, durum: durumAdi(p.durum), tesis: p.ad, musteri: p.musteri,
        yer: [p.ilce, p.il].filter(Boolean).join(" / ") || null, baslangic: p.baslangic, bitis: p.bitis, ekip: p.ekip })) } };
    },
  }),
  islem({
    ad: "plan_getir", modul: MODUL, tur: "oku", girdi: PLAN_ID, kaynak: [kimlik], islev: planIci,
    tarif: "Planın bilgisi: durum, sürüm, tesis, ekip, plandaki ekipman (kimlik, kod, tür, sürüm), tesiste plana alınmamış ekipman, raporlar, izinler, tarafsızlık beyanı.",
    calistir: async (b, v) => {
      const p = await planIci(b.db, b.kim, v.plan);
      if (!p) return { tamam: false, neden: GORUNMEZ };
      const raporlu = new Set(p.raporluEkipman);
      return { tamam: true, sonuc: {
        id: p.kart.id, no: p.kart.no, durum: durumAdi(p.durum), surum: p.surum, baslangic: p.kart.baslangic, bitis: p.kart.bitis, aciklama: kirp(p.kart.aciklama),
        tesis: p.kart.tesis, musteri: { id: p.kart.musteri.id, kisa: p.kart.musteri.kisa }, uyarilar: [...p.kart.turUyarilari, ...(p.kart.sozlesmeUyarisi ? [p.kart.sozlesmeUyarisi] : [])],
        ekip: p.kart.ekip.map((e) => ({ personel: e.personelId, ad: e.ad, isgNo: e.isgNo, uyarilar: e.uyarilar })),
        ekipman: p.ekipman.map((e) => ({ id: e.id, kod: e.kod, tur: e.tur, turId: e.turId, konum: e.konum, pasif: e.pasif, surum: e.surum, rapor_var: raporlu.has(e.id) })),
        tesiste_planda_olmayan: p.kayitli.map((e) => ({ id: e.id, kod: e.kod, tur: e.tur, konum: e.konum })),
        turler: p.turler.map((t) => ({ id: t.id, ad: t.ad, brans: t.brans })),
        raporlar: p.raporlar.map((r) => ({ id: r.id, no: r.no, durum: r.durum, ekipmanId: r.ekipmanId, surum: r.surum, benim: r.benim })),
        izin: p.izin, erken: p.erken, beyan_ozet: p.beyanOzet, beyan: p.durum === "bekliyor" ? kirp(p.beyan, 4_000) : null,
      } };
    },
  }),
  islem({
    ad: "plan_ac_secenekleri", modul: MODUL, tur: "oku", islev: planAcVerisi, kaynak: [SuzgecDurumuSemasi],
    girdi: z.object({ ara: SuzgecDurumuSemasi.shape.ara, denetci: SuzgecDurumuSemasi.shape.ara, sayfa: SuzgecDurumuSemasi.shape.sayfa }),
    tarif: "Plan açmak için seçenekler: etkin müşteriler ve tesisleri (ara: müşteri / tesis adı; 20'şer, sayfa), denetçiler (denetci: ad), ekipman türleri, bugün.",
    calistir: async (b, v) => {
      const d = await planAcVerisi(b.db, b.kim);
      if (!d) return { tamam: false, neden: "Bu kullanıcının plan açma yetkisi yok." };
      const m = d.musteriler.filter((x) => trIcerir([x.kisa, x.unvan, ...x.tesisler.flatMap((t) => [t.ad, t.il ?? "", t.ilce ?? ""])].join(" "), v.ara));
      const s = sayfala(m, v.sayfa);
      return { tamam: true, sonuc: { ...s.bilgi, bugun: d.bugun, musteriler: s.satirlar,
        denetciler: d.adaylar.filter((a) => trIcerir(a.ad, v.denetci)).map((a) => ({ personel: a.id, ad: a.ad, meslek: a.meslekMetin ?? a.meslek, hesap: a.hesapDurum })),
        turler: d.turler.map((t) => ({ id: t.id, ad: t.ad, brans: t.brans })) } };
    },
  }),
  islem({
    ad: "tesis_ekipmanlari", modul: MODUL, tur: "oku", islev: tesisPlanBilgisi, kaynak: [kimlik, SuzgecDurumuSemasi],
    girdi: z.object({ tesis: kimlik, sayfa: SuzgecDurumuSemasi.shape.sayfa }),
    tarif: "Tesisin kayıtlı ekipmanı (kod, tür kimliği, konum, son kontrol, pasif; 50'şer), İSG-KATİP ID'leri ve iş sözleşmeleri (plan açabilene).",
    calistir: async (b, v) => {
      const t = await tesisPlanBilgisi(b.db, b.kim, v.tesis);
      if (!t) return { tamam: false, neden: "Tesis bulunamadı ya da bu kullanıcı plan açamıyor." };
      const s = sayfala(t.ekipmanlar, v.sayfa, 50);
      return { tamam: true, sonuc: { ...s.bilgi, ekipmanlar: s.satirlar, isg: t.isg.map((x) => ({ personel: x.personelId, no: x.no, onay: x.onay, bitis: x.bitis })),
        sozlesmeler: t.sozlesmeler, yururlukte_sozlesme: t.yururlukte } };
    },
  }),
  islem({
    ad: "plan_ac", modul: MODUL, tur: "yaz", girdi: PlanAcGirdisi, kaynak: [PlanAcGirdisi], islev: planAc,
    tarif: "Plan açar: tesis, baslangic ve bitis (YYYY-AA-GG), ekip [{ personel (denetçinin personel kimliği), isgNo }], aciklama; tesisin etkin ekipmanı plana "
      + "girer (haric: alınmayacak ekipman kimlikleri), yeniEkipman [{ tur, kod, konum }] tesise de kaydedilir; ekibe e-posta gider.",
    calistir: async (b, _v, ham) => {
      const r = await planAc(b.db, b.depo(), b.kim, b.firmaId, ham, { kok: b.kok ?? undefined });
      if (r.durum !== "tamam") return yazmaCevabi(r);
      if (r.eposta) b.epostaGonder("plan", r.id);
      /* ekranda plan sayfasının gösterdiği uyarılar (İSG-KATİP, EKİPNET, meslek, sözleşme dışı gün, türe yetkili yok — engel değil) S.A.Y'a da */
      const k = await planKarti(b.db, b.kim, r.id);
      const uyarilar = k ? [...k.turUyarilari, ...(k.sozlesmeUyarisi ? [k.sozlesmeUyarisi] : []), ...k.ekip.flatMap((e) => e.uyarilar.map((u) => `${e.ad}: ${u}`))] : [];
      return yazmaCevabi(r, { bildirim: `Plan açıldı: ${r.no}.`, sonuc: { id: r.id, no: r.no, eposta: r.eposta ?? 0, ...(uyarilar.length ? { uyarilar } : {}) } });
    },
  }),
  islem({
    ad: "plan_kabul", modul: MODUL, tur: "yaz", islev: planKabul, kaynak: [kimlik, surum],
    girdi: z.object({ plan: kimlik, surum, beyan_onay: z.boolean(), beyan_ozet: z.string().min(1).max(64) }),
    tarif: "Planı kabul eder (yalnız plandaki denetçi): beyan_onay — kullanıcı tarafsızlık beyanını onayladı; beyan_ozet — plan_getir'deki beyan_ozet (zorunlu; metin değiştiyse kabul edilmez).",
    calistir: async (b, v) => yazmaCevabi(await planKabul(b.db, b.kim, v.plan, v.surum, v.beyan_onay, v.beyan_ozet)),
  }),
  islem({
    ad: "plan_reddet", modul: MODUL, tur: "yaz", girdi: RedGirdisi.extend({ plan: kimlik, surum }), kaynak: [RedGirdisi, kimlik, surum], islev: planReddet,
    tarif: "Planı reddeder (yalnız plandaki denetçi; gerekçe zorunlu).",
    calistir: async (b, v, ham) => yazmaCevabi(await planReddet(b.db, b.kim, v.plan, v.surum, { gerekce: ham.gerekce })),
  }),
  islem({
    /* 2026-10-26 (S.A.Y Faz 2 — reisim: "kodu otomatik kendisi verecek ekipmanın sabit kodu + 0-1-2"): kod isteğe bağlı; çok ekipman tek işlemde */
    ad: "plan_ekipman_ekle", modul: MODUL, tur: "yaz", girdi: SayEkipmanGirdisi.extend({ plan: kimlik }), kaynak: [SayEkipmanGirdisi, YeniEkipmanGirdisi, kimlik],
    islev: sayEkipmanlarEkle,
    tarif: "Plana yeni ekipman ekler — tesise kalıcı kayıt da açılır: tur (ekipman türü kimliği), konum, kod (isteğe bağlı; verilmezse türün kodu + tire + "
      + "sıradaki boş sayı: KMP-0, KMP-1 …).",
    calistir: async (b, v, ham) => mevcutUyarisi(b, v.plan, [ham.tur], ekipmanCevabi(await sayEkipmanlarEkle(b.db, b.kim, v.plan, [{ kod: ham.kod, tur: ham.tur, seri: ham.seri, konum: ham.konum }]))),
  }),
  islem({
    ad: "plan_ekipmanlar_ekle", modul: MODUL, tur: "yaz", girdi: z.object({ plan: kimlik, ekipmanlar: z.array(SayEkipmanGirdisi).min(1).max(200) }),
    kaynak: [SayEkipmanGirdisi, YeniEkipmanGirdisi, kimlik], islev: sayEkipmanlarEkle,
    tarif: "Plana tek işlemde çok yeni ekipman ekler (en çok 200): ekipmanlar [{ tur, konum, kod (isteğe bağlı — verilmezse KMP-0, KMP-1 …) }]; "
      + "eklenenler (kimlik, kod) ve eklenemeyenler nedeniyle döner.",
    calistir: async (b, _v, ham) => mevcutUyarisi(b, ham.plan, ham.ekipmanlar.map((e) => e.tur), ekipmanCevabi(await sayEkipmanlarEkle(b.db, b.kim, ham.plan, ham.ekipmanlar))),
  }),
  /* 2026-10-31 (kalem 8 — E10, B01 §1): tek çağrıda plan özeti — plan, ekip, plandaki (raporsuzlar ayrıca) ve tesisteki ekipman, raporlar, türlerin süresi /
     periyodu ve yayındaki formatın özeti (bölümler, alanlar, madde sayıları, tablo sütunları). Künye değeri yok. */
  islem({
    ad: "plan_hazirlik", modul: MODUL, tur: "oku", girdi: PLAN_ID, kaynak: [kimlik], islev: planIci,
    tarif: "İşe başlarken planın tek çağrıda özeti: durum, tesis, ekip, plandaki ekipman (raporu olmayanlar ayrıca), tesiste plana alınmamış ekipman, raporlar, "
      + "türlerin süresi ve periyodu, yayındaki formatın bölümleri / alanları / madde sayıları / tablo sütunları.",
    calistir: async (b, v) => {
      const p = await planIci(b.db, b.kim, v.plan);
      if (!p) return { tamam: false, neden: GORUNMEZ };
      const raporlu = new Set(p.raporluEkipman);
      const turler = [];
      for (const t of p.turler) {
        const k = await turKarti(b.db, b.kim, t.id), f = await yayindakiFormat(b.db, t.id);
        turler.push({ id: t.id, ad: t.ad, sure_dk: k?.sure ?? null, periyot_ay: k?.periyot ?? null, format: f ? formOzeti(f.tanim) : null });
      }
      const ekipman = p.ekipman.map((e) => ({ id: e.id, kod: e.kod, tur: e.tur, turId: e.turId, konum: e.konum, pasif: e.pasif, rapor_var: raporlu.has(e.id) }));
      return { tamam: true, sonuc: {
        id: p.kart.id, no: p.kart.no, durum: durumAdi(p.durum), surum: p.surum, baslangic: p.kart.baslangic, bitis: p.kart.bitis, tesis: p.kart.tesis,
        ekip: p.kart.ekip.map((e) => ({ personel: e.personelId, ad: e.ad })), ekipman, raporsuz: ekipman.filter((e) => !e.rapor_var && !e.pasif),
        tesiste_planda_olmayan: p.kayitli.map((e) => ({ id: e.id, kod: e.kod, tur: e.tur, konum: e.konum })),
        raporlar: p.raporlar.map((r) => ({ id: r.id, no: r.no, durum: r.durum, ekipmanId: r.ekipmanId, surum: r.surum })), turler,
      } };
    },
  }),
  islem({
    ad: "plan_kayitli_ekle", modul: MODUL, tur: "yaz", girdi: z.object({ plan: kimlik, ekipmanlar: z.array(kimlik).min(1) }), kaynak: [kimlik], islev: kayitliEkle,
    tarif: "Tesiste kayıtlı, plana alınmamış ekipmanı plana alır (ekipmanlar: kimlikler — plan_getir tesiste_planda_olmayan).",
    calistir: async (b, v) => yazmaCevabi(await kayitliEkle(b.db, b.kim, v.plan, v.ekipmanlar)),
  }),
  islem({
    ad: "plan_ekipman_pasif", modul: MODUL, tur: "yaz", girdi: z.object({ plan: kimlik, ekipman: kimlik, surum, pasif: z.boolean() }), kaynak: [kimlik, surum],
    islev: ekipmanPasif,
    tarif: "Plandaki ekipmanı pasife alır (pasif: true — plandan çıkar, rapor açılmaz) ya da yeniden etkinleştirir; surum ekipmanın sürümü (plan_getir).",
    calistir: async (b, v) => yazmaCevabi(await ekipmanPasif(b.db, b.kim, v.plan, v.ekipman, v.surum, v.pasif)),
  }),
  islem({
    ad: "plan_ekipman_sil", modul: MODUL, tur: "yaz", girdi: z.object({ plan: kimlik, ekipman: kimlik }), kaynak: [kimlik], islev: ekipmanSil,
    tarif: "Hiç kullanılmamış ekipmanı kesin siler (yönetici; raporu olan silinmez — pasife alınır).",
    calistir: async (b, v) => yazmaCevabi(await ekipmanSil(b.db, b.kim, v.plan, v.ekipman)),
  }),
  islem({
    ad: "plan_kunye_duzenle", modul: MODUL, tur: "yaz", girdi: z.object({ plan: kimlik, surum, kunye: KunyeGirdisi }), kaynak: [KunyeGirdisi, kimlik, surum],
    islev: kunyeDuzenle,
    tarif: "Plan bilgilerini düzenler (planlamacı): kunye { firmaAdi, adres, sgk, isg: { <personel kimliği>: İSG-KATİP SÖZLEŞME ID } } — ekibin İSG-KATİP ID'leri.",
    calistir: async (b, v, ham) => yazmaCevabi(await kunyeDuzenle(b.db, b.kim, v.plan, v.surum, ham.kunye)),
  }),
  islem({
    ad: "plan_kunye_guncelle", modul: MODUL, tur: "yaz", girdi: PLAN_ID, kaynak: [kimlik], islev: kunyeGuncelle,
    tarif: "Denetçi: planlamacının değiştirdiği plan bilgilerini kendi planına ve taslak raporlarına alır (Güncelle).",
    calistir: async (b, v) => {
      /* taslak raporlara da yazar: ekranda açık rapor bu plandaysa ve kaydedilmemiş değişikliği varsa önce ekranın kaydı */
      if (b.ekrandakiRapor && b.kaydedilmemis && ekranRaporuKirli(b, ((await planIci(b.db, b.kim, v.plan))?.raporlar ?? []).map((r) => r.id))) {
        return { tamam: false, neden: EKRAN_KAYDEDILMEMIS };
      }
      return yazmaCevabi(await kunyeGuncelle(b.db, b.kim, v.plan));
    },
  }),
  islem({
    ad: "plan_not_ekle", modul: MODUL, tur: "yaz", girdi: NotGirdisi.extend({ plan: kimlik }), kaynak: [NotGirdisi, kimlik], islev: notEkle,
    tarif: "Plana proje notu ekler (değişmez, silinmez).",
    calistir: async (b, v, ham) => yazmaCevabi(await notEkle(b.db, b.kim, v.plan, { metin: ham.metin })),
  }),
  islem({
    ad: "plan_kontrol_listesi", modul: MODUL, tur: "yaz", girdi: PLAN_SURUM.extend({ tamam: z.boolean() }), kaynak: [kimlik, surum], islev: kontrolListesi,
    tarif: "Denetimdeki planın kontrol listesini tamamlar (tamam: true) ya da yeniden açar.",
    calistir: async (b, v) => yazmaCevabi(await kontrolListesi(b.db, b.kim, v.plan, v.surum, v.tamam)),
  }),
  islem({
    ad: "plan_tamamla", modul: MODUL, tur: "yaz", girdi: PLAN_SURUM, kaynak: [kimlik, surum], islev: planTamamla,
    tarif: "Planı tamamlar (kontrol listesi tamamlanmış olmalı).",
    calistir: async (b, v) => yazmaCevabi(await planTamamla(b.db, b.kim, v.plan, v.surum)),
  }),
  islem({
    ad: "plan_tamamlama_geri_al", modul: MODUL, tur: "yaz", girdi: PLAN_SURUM, kaynak: [kimlik, surum], islev: tamamlamaGeriAl,
    tarif: "Tamamlanmış planı yeniden denetime açar.",
    calistir: async (b, v) => yazmaCevabi(await tamamlamaGeriAl(b.db, b.kim, v.plan, v.surum)),
  }),
  /* 2026-10-16 (2. adım b): planı sil — Planlar'ın "Planı sil" tuşunun işlevi */
  islem({
    ad: "plan_sil", modul: MODUL, tur: "yaz", girdi: PLAN_ID, kaynak: [kimlik], islev: planSil,
    tarif: "Hiç raporu, faturası, gideri olmayan, tamamlanmamış planı kesin siler (yönetici; ekip, ekipman satırları, notlar birlikte; ekipmanlar tesiste kalır).",
    calistir: async (b, v) => yazmaCevabi(await planSil(b.db, b.kim, v.plan)),
  }),
  /* 2026-10-31 (kalem 9 — M1 + M2; beceri B11): konuşmadaki ekin (M / F numarası) depodaki kopyası kaydın belge yuvasına — ekranın yükleme işleviyle */
  islem({
    ad: "saha_tarama_yukle", modul: MODUL, tur: "yaz", islev: sahaTaramaYukle, kaynak: [kimlik, surum],
    girdi: z.object({ plan: kimlik, form: kimlik, surum, ek: EK_NO }),
    tarif: "Konuşmadaki müşteri imzalı saha formu taramasını (ek: M03 / F02) planın saha formuna ekler: plan, form (plan_getir saha formları), surum.",
    calistir: async (b, v) => {
      const belge = await ekBelgesi(b, v.ek, ["pdf","foto"]);
      if (typeof belge === "string") return { tamam: false, neden: belge };
      return yazmaCevabi(await sahaTaramaYukle(b.db, b.depo(), b.kim, b.firmaId, v.plan, v.form, v.surum, belge), { bildirim: `${belge.ad} saha formuna eklendi.` });
    },
  }),
  /* 2026-10-31 (kalem 11 — M5 eksikleri): ekranın tuşunun işlevi */
  islem({
    ad: "saha_formu_olustur", modul: MODUL, tur: "yaz", islev: sahaFormuOlustur, kaynak: [kimlik], girdi: PLAN_ID,
    tarif: "Tamamlanan planda saha formu (yapılan ekipmanlar + firma onayı imza yerleri) oluşturur; PDF'i ekrandan indirilir.",
    calistir: async (b, v) => yazmaCevabi(await sahaFormuOlustur(b.db, b.kim, v.plan), { bildirim: "Saha formu oluşturuldu." }),
  }),
  islem({
    ad: "saha_tarama_kaldir", modul: MODUL, tur: "yaz", islev: sahaTaramaKaldir, kaynak: [kimlik, surum], girdi: z.object({ plan: kimlik, form: kimlik, surum }),
    tarif: "Saha formunun yüklenmiş taramasını kaldırır: plan, form, surum.",
    calistir: async (b, v) => yazmaCevabi(await sahaTaramaKaldir(b.db, b.kim, v.plan, v.form, v.surum), { bildirim: "Tarama kaldırıldı." }),
  }),
  /* 2026-10-31 (S.A.Y belge doldurma): ekranın "Belgeyi doldur"u — yerler ve kayıt modülün işlevleriyle (src/server/yz/doldurma.ts) */
  islem({
    ad: "on_bilgi_doldur", modul: MODUL, tur: "yaz", islev: onBilgiDoldur, kaynak: [kimlik, ElleDegerGirdisi], girdi: z.object({ plan: kimlik, degerler: ElleDegerGirdisi }),
    tarif: "Planın ön bilgilendirme formu: elle doldurulan yerlerine yazar — plan, degerler (yerin kimliği ya da adı → değer; \"\" boşaltır). degerler boşsa yazmadan yerleri listeler (ad, tür, zorunlu, dolu mu).",
    calistir: async (b, v) => {
      const h = doldurmaHazirla((await planBelgeleri(b.db, b.kim, v.plan, null))?.onBilgiDoldur ?? null, v.degerler);
      return "cevap" in h ? h.cevap : doldurmaCevabi(await onBilgiDoldur(b.db, b.kim, v.plan, h.degerler, h.surum), "Ön bilgilendirme formu");
    },
  }),
  islem({
    ad: "saha_formu_doldur", modul: MODUL, tur: "yaz", islev: sahaFormuDoldur, kaynak: [kimlik, ElleDegerGirdisi],
    girdi: z.object({ plan: kimlik, form: kimlik, degerler: ElleDegerGirdisi }),
    tarif: "Tamamlanan planın saha formu: elle doldurulan yerlerine yazar — plan, form (plan_getir saha formları), degerler (yerin kimliği ya da adı → değer; \"\" boşaltır). degerler boşsa yazmadan yerleri listeler (ad, tür, zorunlu, dolu mu).",
    calistir: async (b, v) => {
      const h = doldurmaHazirla((await planBelgeleri(b.db, b.kim, v.plan, null))?.sahaDoldur[v.form] ?? null, v.degerler);
      return "cevap" in h ? h.cevap : doldurmaCevabi(await sahaFormuDoldur(b.db, b.kim, v.plan, v.form, h.degerler, h.surum), "Saha formu");
    },
  }),
];

/** 2026-10-31 (K2 + M4): S.A.Y'ın açık kaydı bildiği ayrıntı sayfaları (src/server/yz/islem.ts acikKayit) */
export const SAY_SAYFALARI: readonly SayfaTanimi[] = [
  { desen: /^\/planlar\/([0-9a-f-]{36})(?:\/|$)/, tur: "Plan", islem: "plan_getir", girdi: (id) => ({ plan: id }) },
  { desen: /^\/raporlar\/yeni\/([0-9a-f-]{36})(?:\/|$)/, tur: "Plan", islem: "plan_getir", girdi: (id) => ({ plan: id }) },
];
