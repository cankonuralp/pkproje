/* S.A.Y CHAT → S.A.Y (2026-11-07; beceri B02 §8; sunum claude.ai 2PiEskE9jDqF5kSefutRBC). "Chatten oku": kişinin KENDİ sohbetinden (RLS) kapsam
   (kapsam.ts) → mesajlar sırayla → S.A.Y'ın malzemesi. KANALA ÖZEL OKUMA YOLU YOK: fotoğraf ve belge S.A.Y'ın bugünkü eki olur (yz_ek; F / M numarası,
   foto_goster, foto_pafta, rapor_foto_ekle, belge yuvası bunlarla), fotoğrafın ön okuması S.A.Y'ın ön okumasıyla (say/server/on-okuma-cagri.ts onOkumaYap) —
   fotoğraf başına BİR KEZ (ilk okumada; sonuç mesajda saklanır, konuşma kapanıp yeniden okunursa yeniden çağrılmaz). Aynı konuşmada aynı mesaj ikinci kez
   eklenmez (yz_ek.chat_mesaj).
   · hazırla (işlemin DIŞINDA — ağ çağrısı açık işlem tutmaz): ön okuma (aynı anda 4), belgenin yapay zekâ hizmetine yüklenmesi; sonra ekler mesaj sırasıyla.
   · oku (kendi işleminde): döküm (dokum.ts) + belgelerin kendisi blok olarak; okunan aralık bas / bit (chat_isle bununla).
   · işle: aralıktaki işlenmemiş mesajlar plana işlendi (plan kişinin görebildiği — planKarti); geri alınabilir. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaYukle } from "../../../server/dosya/dosya.ts";
import { anthropicDosyaYukle } from "../../../server/yz/akis.ts";
import { chatEkleri, DOSYA_SAY_EK, DOSYA_YOK, ekKaydet, ekleriAl, ekOkumaYaz, type NumaraliEk } from "../../../server/yz/konusma.ts";
import { xlsxSayfalari } from "../../../components/disa/oku.ts";
import { ekBasligi, malzemeOzeti, type OnOkuma } from "../../say/malzeme.ts";
import { sayEkiHazirla } from "../../say/server/ek.ts";
import { onOkumaYap } from "../../say/server/on-okuma-cagri.ts";
import { sayKapisi } from "../../say/server/say.ts";
import { planKarti } from "../../planlar/server/planlar.ts";
import { kapsamSec, type Kapsam } from "../kapsam.ts";
import { aralikMetni, chatDokumu, type DokumMesaji } from "../dokum.ts";
import type { ChatIsleGirdisi, ChatOkuGirdisi } from "../sema.ts";
import { DOSYA_SAY_CHAT, eskiDosyalariTemizle, isaretGeriAl, isaretle, mesajlariOku, onOkumaYaz, type Kisi, type MesajSatiri } from "./mesajlar.ts";

type Islet = <T>(is: (db: Sorgulayici) => Promise<T>) => Promise<T>;
const AYNI_ANDA = 4;
const iki = (n: number) => String(n).padStart(2, "0");
const iso = (m: MesajSatiri) => m.zaman.toISOString();
const kapsami = (v: ChatOkuGirdisi): Kapsam => ({ bas: v.bas ?? null, bit: v.bit ?? null, gun: v.gun ?? null, sozcuk: v.sozcuk ?? null, islenmis: v.islenmis === true });
const kapsamMesajlari = (l: readonly MesajSatiri[]) => l.map((m) => ({ ...m, zaman: iso(m) }));

async function secilenler(db: Sorgulayici, v: ChatOkuGirdisi): Promise<{ secilen: MesajSatiri[]; disarida: number; nasil: string }> {
  const l = await mesajlariOku(db, { tumu: true, islenmemis: v.islenmis !== true });
  const bul = new Map(l.map((m) => [m.id, m]));
  const k = kapsamSec(kapsamMesajlari(l), kapsami(v));
  return { secilen: k.secilen.map((m) => bul.get(m.id)!), disarida: k.disarida, nasil: k.nasil };
}

/** dosyanın baytları (kişinin kendi mesajının dosyası — mesaj RLS'de görünüyorsa) */
async function dosyaBaytlari(db: Sorgulayici, depo: Depo, dosya: string): Promise<{ bayt: Uint8Array; tur: string; ad: string } | null> {
  const d = (await db.sorgu<{ anahtar: string; tur: string; ad: string }>("SELECT anahtar, tur, ad FROM dosya WHERE id = $1 AND modul = $2 AND cop IS NULL",
    [dosya, DOSYA_SAY_CHAT])).rows[0];
  return d ? { bayt: await depo.oku(d.anahtar, db), tur: d.tur, ad: d.ad } : null;
}

/** Excel → S.A.Y'ın tablo metni (ekranın S.A.Y ekindeki gibi: sayfa başlığı, noktalı virgüllü satırlar) */
async function excelMetni(b: Uint8Array): Promise<Uint8Array> {
  const hucre = (x: string) => (/[;"\n\r]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x);
  const sayfalar = await xlsxSayfalari(b);
  return new TextEncoder().encode(sayfalar.map((s) => [`## Sayfa: ${s.ad || "(adsız)"}`, ...s.satirlar.map((r) => r.map(hucre).join(";"))].join("\n")).join("\n\n"));
}

async function sirayla<T>(l: readonly T[], n: number, is: (x: T) => Promise<void>): Promise<void> {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, l.length) }, async () => { while (i < l.length) await is(l[i++]!); }));
}

/** chat_oku'nun hazırlığı (işlemin DIŞINDA): seçilen fotoğrafların ön okuması (bir kez), belgelerin hizmete yüklenmesi, sonra ekler mesaj sırasıyla */
export async function chatOkuHazirla(o: { islet: Islet; depo: () => Depo; kim: Kisi; firmaId: string; hata?: (e: unknown, ad: string) => void },
  v: ChatOkuGirdisi): Promise<void> {
  const { secilen } = await o.islet(async (db) => { await eskiDosyalariTemizle(db, o.kim); return secilenler(db, v); });
  const medya = secilen.filter((m) => m.tur !== "yazi" && m.dosya && !m.dosya_silindi);
  if (!medya.length) return;
  const bagli = await o.islet((db) => chatEkleri(db, medya.map((m) => m.id)));
  const eksik = medya.filter((m) => !bagli.has(m.id));
  if (!eksik.length) return;
  const okuma = new Map<string, OnOkuma>();
  /* 1) ön okuma (yalnız hiç okunmamış fotoğraf) — aynı anda AYNI_ANDA */
  await sirayla(eksik.filter((m) => m.tur === "foto" && !m.on_okuma), AYNI_ANDA, async (m) => {
    try {
      const d = await o.islet((db) => dosyaBaytlari(db, o.depo(), m.dosya!));
      const x = d ? await onOkumaYap(o.islet, d.bayt, d.tur) : null;
      if (x) { okuma.set(m.id, x); await o.islet((db) => onOkumaYaz(db, o.kim, m.id, x as unknown as Record<string, unknown>)); }
    } catch (e) { o.hata?.(e, "chat_oku.on_okuma"); }
  });
  /* 2) belgeler hizmete (S.A.Y'ın ekiyle aynı: PDF kendisi, Word metni, Excel tablo metni) */
  const belgeDosyasi = new Map<string, { dosya: string; tur: NumaraliEk["tur"]; mime: string; boyut: number; pdf: Uint8Array | null; ad: string }>();
  const belgeler = eksik.filter((m) => m.tur === "belge");
  if (belgeler.length) {
    const k = await o.islet((db) => sayKapisi(db));
    if (k.durum === "acik") {
      await sirayla(belgeler, AYNI_ANDA, async (m) => {
        try {
          const d = await o.islet((db) => dosyaBaytlari(db, o.depo(), m.dosya!));
          if (!d) return;
          const xlsx = d.tur.includes("spreadsheetml");
          const e = sayEkiHazirla(xlsx ? await excelMetni(d.bayt) : d.bayt, m.dosya_ad ?? d.ad, xlsx);
          if ("durum" in e) return;
          const y = await anthropicDosyaYukle(e.bayt, e.dosyaAdi, e.mime, k.anahtar);
          if (y.durum === "tamam") belgeDosyasi.set(m.id, { dosya: y.id, tur: e.tur, mime: e.mime, boyut: d.bayt.length, pdf: e.tur === "pdf" ? e.bayt : null, ad: e.ad });
        } catch (e) { o.hata?.(e, "chat_oku.belge"); }
      });
    }
  }
  /* 3) ekler mesaj SIRASIYLA (F / M numarası sohbetin sırası); fotoğrafın kopyası S.A.Y ekinin deposunda (foto_goster, rapora fotoğraf bundan) */
  for (const m of eksik) {
    try {
      await o.islet(async (db) => {
        if ((await chatEkleri(db, [m.id])).size) return;
        if (m.tur === "foto") {
          const d = await dosyaBaytlari(db, o.depo(), m.dosya!);
          if (!d) return;
          const ek = await ekKaydet(db, { dosya: DOSYA_YOK, ad: m.dosya_ad ?? d.ad, tur: "foto", mime: d.tur, boyut: d.bayt.length, cekim: m.cekim?.slice(0, 16) ?? null }, m.id);
          await dosyaYukle(db, o.depo(), { firmaId: o.firmaId, modul: DOSYA_SAY_EK, kayitId: ek, ad: m.dosya_ad ?? d.ad, bayt: d.bayt, izinli: ["jpeg", "png"],
            kim: o.kim.ad, yukleyen: o.kim.id });
          const x = okuma.get(m.id) ?? (m.on_okuma as OnOkuma | null);
          if (x) await ekOkumaYaz(db, ek, x);
          return;
        }
        const b = belgeDosyasi.get(m.id);
        if (!b) return;
        const ek = await ekKaydet(db, { dosya: b.dosya, ad: b.ad, tur: b.tur, mime: b.mime, boyut: b.boyut, cekim: null }, m.id);
        if (b.pdf) await dosyaYukle(db, o.depo(), { firmaId: o.firmaId, modul: DOSYA_SAY_EK, kayitId: ek, ad: b.ad, bayt: b.pdf, izinli: ["pdf"], kim: o.kim.ad, yukleyen: o.kim.id });
      });
    } catch (e) { o.hata?.(e, "chat_oku.ek"); }
  }
}

export interface ChatOkuSonucu {
  sonuc: Record<string, unknown>;
  /** döküm (metin) + belgelerin kendisi */
  bloklar: Record<string, unknown>[];
}
/** chat_oku (kendi işleminde): döküm ve belgeler */
export async function chatOku(db: Sorgulayici, v: ChatOkuGirdisi): Promise<ChatOkuSonucu> {
  const { secilen, disarida, nasil } = await secilenler(db, v);
  if (!secilen.length) {
    return { sonuc: { mesaj: 0, disarida, bildirim: disarida ? `Bu kapsamda mesaj yok; sohbette ${disarida} işlenmemiş mesaj var (aralık, gün ya da sözcükle okunur).`
      : "Sohbette okunacak işlenmemiş mesaj yok." }, bloklar: [] };
  }
  const bag = await chatEkleri(db, secilen.map((m) => m.id));
  const ekler = await ekleriAl(db, [...bag.values()]);
  const ekBul = new Map(ekler.map((e) => [e.id, e]));
  const l: DokumMesaji[] = secilen.map((m) => {
    const e = bag.has(m.id) ? ekBul.get(bag.get(m.id)!) ?? null : null;
    return { zaman: iso(m), tur: m.tur, metin: m.metin, ad: m.dosya_ad, numara: e ? (e.fno ? `F${iki(e.fno)}` : `M${iki(e.no)}`) : null, baslik: e ? ekBasligi(e) : null };
  });
  const say = (t: string) => secilen.filter((m) => m.tur === t).length;
  const dokum = chatDokumu(l, disarida) + (ekler.length ? `\n\n${malzemeOzeti(ekler)}` : "");
  const belgeler = ekler.filter((e) => e.tur !== "foto" && e.dosya !== DOSYA_YOK)
    .map((e) => ({ type: "document", source: { type: "file", file_id: e.dosya }, title: ekBasligi(e) }));
  return {
    sonuc: { aralik: { bas: iso(secilen[0]!), bit: iso(secilen.at(-1)!), metin: aralikMetni(l) }, nasil, mesaj: secilen.length, foto: say("foto"), yazi: say("yazi"),
      belge: say("belge"), disarida, eklenemeyen: l.filter((x) => x.tur !== "yazi" && !x.numara).length,
      sonra: "İş bitince chat_isle { plan, bas, bit, rapor } — aralık bu." },
    bloklar: [{ type: "text", text: dokum }, ...belgeler],
  };
}

export type ChatIsleSonucu = { durum: "tamam"; adet: number; no: string } | { durum: "yok" };
/** chat_isle: aralıktaki işlenmemiş mesajlar plana işlendi (geri_al: aralıktaki bu plana işlenmiş mesajların işareti kalkar) */
export async function chatIsle(db: Sorgulayici, kim: Kisi & Parameters<typeof planKarti>[1], v: ChatIsleGirdisi): Promise<ChatIsleSonucu> {
  const p = await planKarti(db, kim, v.plan);
  if (!p) return { durum: "yok" };
  const l = await mesajlariOku(db, { tumu: true, islenmemis: !v.geri_al });
  const kapsam = v.bas || v.bit ? { bas: v.bas ?? null, bit: v.bit ?? null } : {};
  const secilen = v.geri_al
    ? l.filter((m) => m.islendi_plan === p.id && (!v.bas || m.zaman >= new Date(v.bas)) && (!v.bit || m.zaman <= new Date(v.bit)))
    : kapsamSec(kapsamMesajlari(l), kapsam).secilen;
  if (v.geri_al) {
    let n = 0;
    const gorulen = new Set<string>();
    for (const m of secilen) {
      const anahtar = m.islendi?.toString() ?? "";
      if (gorulen.has(anahtar)) continue;
      gorulen.add(anahtar);
      n += await isaretGeriAl(db, kim, m.cihaz_id);
    }
    return { durum: "tamam", adet: n, no: p.no };
  }
  return { durum: "tamam", adet: await isaretle(db, kim, secilen.map((m) => m.id), { id: p.id, no: p.no }, v.rapor), no: p.no };
}
