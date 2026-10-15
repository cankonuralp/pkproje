/* S.A.Y RAPOR HARİTASI (550; sunum 546 K6 — reisim 2026-10-14: "S.A.Y. de herhangi bir kısıt kural vb olmasını istemiyorum oradan direk haiku ile
   konuşmak aynı claude kullanır gibi oradan onu kullanabilmek istiyorum"; karar "diğer önerilerini kabul ediyorum") — saf. 384'teki özetin
   (yalnız adlar ve sayılar) yerine: açık raporun YAZILABİLİR yerleri, kimlikleriyle ve ŞU ANKİ değerleriyle (kaydedilmemiş değişiklikler dahil).
   Haiku istenen girişi "rapora_yaz" aracıyla bu kimliklerle verir; ekran uygular (raporlar/say-doldur.ts komutlariUygula — aynı kimlikler; kilit
   tests/say-rapor-haritasi.test.ts: haritadaki her yer uygulanır). Künye (firma, müşteri, tesis, adres, SGK, İSG-KATİP, rapor no) GİTMEZ —
   rapora yazmak için gerekmez. Çok büyük raporda metin sınırlı (tablonun fazla satırları sayıyla).
   557 (sunum 557 · 2. tur — reisim 2026-10-14: "el ile girebildiğim değerleri say asistan ile giremiyor"): elle girilebilen her yer haritada —
   künye (YERİ ve kilidi; DEĞERİ GİTMEZ: müşteri / kişi bilgisi S.A.Y isteğine konmaz — değeri kişinin kendi mesajından), kontrol tarihleri, çoklu
   seçim, tablonun uygunluk notu / satır sonucu + gerekçesi / satır silme, ölçüm cihazları (seçilebilir kodlarla).
   556 (sunum 556 · 2. tur): formüllü kutular da haritada, değerleri formülle (ekrandaki gibi; formül kayıttan gelen bilgiyi okumaz — künye
   gitmez); kayıttan gelen formüllü alanın yeri var, değeri gitmez. */
import { kilitliKunye } from "../../format/kunye.ts";
import { formulUygula } from "../../format/formul.ts";
import { Cevaplar, KUNYE_ALAN_ADI, KUNYE_ALANLARI, type FormatTanimi } from "../../format/tanim.ts";
import type { OkunacakAlan } from "../../format/deger.ts";
import { ELLE_GEREKCE, ELLE_SONUC } from "../../format/motor.ts";
import { bilgiAlanlari, ekipmanAlanlari, ekipmanAnahtari, testAlanlari } from "../raporlar/doldur.ts";
import { TARIH_ADI, TARIH_ANAHTARLARI, tarihYazimi } from "../raporlar/say-doldur.ts";

/* ── 561 (reisim 2026-10-15: "rapor teknik yönetici onayında olduğu için değiştiremiyordu ama açıkta rapor göremiyorum dedi"): S.A.Y, adresteki
   raporu (saha raporu, onay ekranı) SUNUCUDA bulur — ekranın bağı yalnız yazılabilir raporda geldiği için onaydaki / başkasının raporunda "açık
   rapor yok" diyordu. Bağlama künyesiz kimliği (numara, tür, durum) ve yazılamıyorsa nedeni girer; harita yalnız yazılabilir raporda. ── */
const RAPOR_YOLU = /^\/(?:raporlar|onaylar)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;
/** adresteki raporun kimliği (saha raporu /raporlar/<id>, onay ekranı /onaylar/<id>; sorgu ve # atılır) — yoksa null */
export function yoldakiRapor(yol: string): string | null {
  return RAPOR_YOLU.exec(yol.split(/[?#]/)[0])?.[1] ?? null;
}
/** bağlamdaki açık rapor satırı: numara, tür, durum; yazılamıyorsa nedeni (elle de değiştirilemez); yazılabilir ama ekran bağlanmadıysa (harita
    yok — onaya gönderme cihazda bekliyor ya da sayfa yenilenmeli) o */
export function acikRaporMetni(d: { no: string; turAd: string; durumAd: string; yazilabilir: boolean; neden: string | null }, harita: boolean): string {
  const l = [`Sayfada açık rapor: ${d.no} (${d.turAd}) · durum: ${d.durumAd}.`];
  if (!d.yazilabilir) l.push(`Bu rapora şu an yazılamaz; kullanıcı da elle değiştiremez: ${d.neden ?? "rapor düzenlenemez"}.`);
  else if (!harita) l.push("Bu rapor ekranda şu an düzenlenemiyor (onaya gönderme işlemi cihazda bekliyor olabilir ya da sayfa yenilenmeli); rapora yazılamaz.");
  return l.join("\n");
}

/** haritanın en çok uzunluğu (karakter) ve tablo başına gösterilen satır */
export const HARITA_SINIRI = 60_000;
const TABLO_SATIR = 120;
const tirnak = (s: string) => (s ? `"${s.replace(/\s+/g, " ").slice(0, 300)}"` : "—");
const tur = (a: Pick<OkunacakAlan, "tur" | "secenekler" | "birim">) => a.tur === "secim" ? `seçim: ${(a.secenekler ?? []).join(" / ")}`
  : a.tur === "evet" ? "evet / hayır" : a.tur === "tarih" ? "tarih" : a.tur === "yil" ? "yıl" : a.tur === "sayi" ? `sayı${a.birim ? `, ${a.birim}` : ""}` : "yazı";

/** ekranın canlı hâli — tarih ve cihazlar 557'de (yoksa haritada o bölüm yok) */
export interface CanliRapor { cevaplar: unknown; ekipman: unknown; tarih?: unknown; cihazlar?: unknown }
interface CanliCihaz { turId: string; turAd: string; secili: string | null; secenekler: { id: string; kod: string; ad: string }[] }
const yazi = (x: unknown, n: number) => (typeof x === "string" ? x.slice(0, n) : "");
/** istemciden gelen cihaz satırları (yalnız biçim; sayı sınırlı) */
function cihazlarOku(x: unknown): CanliCihaz[] {
  if (!Array.isArray(x)) return [];
  return x.slice(0, 20).flatMap((c): CanliCihaz[] => {
    if (!c || typeof c !== "object") return [];
    const o = c as Record<string, unknown>;
    const turId = yazi(o.turId, 60), turAd = yazi(o.turAd, 120);
    if (!turId || !turAd) return [];
    const secenekler = (Array.isArray(o.secenekler) ? o.secenekler : []).slice(0, 40).flatMap((s): CanliCihaz["secenekler"] => {
      const p = s && typeof s === "object" ? s as Record<string, unknown> : {};
      return yazi(p.id, 60) && yazi(p.kod, 40) ? [{ id: yazi(p.id, 60), kod: yazi(p.kod, 40), ad: yazi(p.ad, 120) }] : [];
    });
    return [{ turId, turAd, secili: yazi(o.secili, 60) || null, secenekler }];
  });
}

/** canlı cevaplar şemaya uymuyorsa null (bağlam eklenmez) */
export function raporHaritasi(t: FormatTanimi, turAd: string, canli: CanliRapor): string | null {
  const g = Cevaplar.safeParse(canli.cevaplar);
  if (!g.success) return null;
  /* 556: formüllü kutuların değeri (kayıttan gelen alanın yazılanı hesaba da girmez — künye gitmez) */
  const kaynakli = new Set(t.bolumler.flatMap((b) => (b.blok === "bilgi" ? b.alanlar.filter((a) => a.kaynak).map((a) => a.id) : [])));
  const ekipmanHam = canli.ekipman && typeof canli.ekipman === "object" ? canli.ekipman as Record<string, unknown> : {};
  const c = formulUygula(t, { ...g.data, alan: Object.fromEntries(Object.entries(g.data.alan).filter(([k]) => !kaynakli.has(k))) },
    { ekipman: Object.fromEntries(Object.entries(ekipmanHam).flatMap(([k, x]) => (typeof x === "string" ? [[k, x.slice(0, 200)]] : []))) });
  const ekipmanDegeri = (id: string) => {
    const e = ekipmanHam[id];
    return typeof e === "string" ? e : "";
  };
  const alanDegeri = (id: string) => (ekipmanAnahtari(id) ? ekipmanDegeri(id) : (() => { const v = c.alan[id]; return Array.isArray(v) ? v.join(", ") : v ?? ""; })());
  const satir = (yer: string, a: Pick<OkunacakAlan, "ad" | "tur" | "secenekler" | "birim">, deger: string) => `- ${yer} · ${a.ad} (${tur(a)}) = ${tirnak(deger)}`;
  const l: string[] = [`Ekipman türü: ${turAd.slice(0, 160)}.`, "Raporun yazılabilir yerleri (yer kimliği · ad (tür) = şu anki değer; — boş):",
    "Sayı kutularına elle olduğu gibi sayı olmayan yazı da yazılır (ör. -)."];
  /* 557: künye — yer ve kilit; değer gitmez */
  const kilit = kilitliKunye(t);
  l.push("## Firma bilgileri (künye) — değerleri gönderilmez; kullanıcı yazarsa yazılır");
  for (const a of KUNYE_ALANLARI) l.push(`- k:${a} · ${KUNYE_ALAN_ADI[a]} (yazı${kilit.has(a) ? "; kilitli — elle de değiştirilemez" : ""})`);
  const tarih = canli.tarih && typeof canli.tarih === "object" ? canli.tarih as Record<string, unknown> : null;
  if (tarih) {
    l.push("## Kontrol tarihleri");
    for (const k of TARIH_ANAHTARLARI) {
      const v = yazi(tarih[k], 16);
      l.push(`- tarih:${k} · ${TARIH_ADI[k]} (${k === "bas" || k === "bit" ? "tarih ve saat: GG.AA.YYYY SS:DD" : "tarih: GG.AA.YYYY"}) = ${tirnak(/^\d{4}-\d{2}-\d{2}/.test(v) ? tarihYazimi(v) : "")}`);
    }
  }
  const ekipman = ekipmanAlanlari(t, true);
  if (ekipman.alanlar.length) {
    l.push(`## ${ekipman.baslik}`);
    for (const a of ekipman.alanlar) l.push(satir(`e:${a.id}`, a, alanDegeri(a.id)));
  }
  let sonucVar = false, notVar = false;
  for (const b of t.bolumler) {
    if (b.blok === "bilgi" && b.id !== ekipman.tam?.id) {
      const alanlar = bilgiAlanlari(b, true);
      if (!alanlar.length) continue;
      l.push(`## ${b.ad}`);
      for (const a of alanlar) l.push(kaynakli.has(a.id) ? `- a:${a.id} · ${a.ad} (yazı; kayıttan — değeri gönderilmez)`
        : satir(ekipmanAnahtari(a.id) ? `e:${a.id}` : `a:${a.id}`, a, alanDegeri(a.id)));
      /* 557: çoklu seçim (virgülle birden çok) */
      for (const a of b.alanlar) if (a.tur === "coklu" && !a.kaynak) l.push(`- a:${a.id} · ${a.ad} (çoklu seçim: ${(a.secenekler ?? []).join(" / ")}; virgülle) = ${tirnak(alanDegeri(a.id))}`);
    } else if (b.blok === "test") {
      l.push(`## ${b.ad}`);
      for (const a of testAlanlari(b, true)) l.push(satir(`d:${a.id}`, a, c.deger[a.id] ?? ""));
    } else if (b.blok === "olcum") {
      const sutunlar = b.sutunlar;
      l.push(`## ${b.ad} — tablo; hücre kimliği t:${b.id}:<satır no>:<sütun kimliği> (satır 1'den; son satırdan sonraki numara yeni satır açar)`);
      l.push(`Sütunlar: ${sutunlar.map((s) => `${s.id} = ${s.ad}${s.birim ? ` (${s.birim})` : ""} [${s.giris === "secim" ? `seçim: ${(s.secenekler ?? []).join(" / ")}` : s.giris === "evet" ? "evet / hayır" : s.giris === "sayi" ? "sayı" : "yazı"}]`).join("; ")}`);
      /* 557: satırın uygunluk notu ya da elle sonucu + gerekçesi; satır silme */
      const notlar = b.notlar ?? [];
      l.push(notlar.length
        ? `Uygunluk notu: t:${b.id}:<satır no>:not (Not-1 … Not-${notlar.length}: ${notlar.map((x, i) => `Not-${i + 1} ${x.metin.slice(0, 60)}`).join("; ")})`
        : `Satır sonucu elle: t:${b.id}:<satır no>:sonuc (uygun / uygun değil / kurala göre) ve gerekçesi t:${b.id}:<satır no>:gerekce (yazı)`);
      l.push(`Satır silmek: t:${b.id}:<satır no> = sil`);
      const satirlar = c.tablo[b.id] ?? [];
      if (!satirlar.length) l.push("- satır yok");
      satirlar.slice(0, TABLO_SATIR).forEach((s, i) => l.push(`- ${i + 1}. satır: ${sutunlar.map((x) => `${x.id}=${tirnak(s[x.id] ?? "")}`).join(", ")}${
        notlar.length ? `, not=${s.not ? `"Not-${s.not}"` : "—"}` : s[ELLE_SONUC] ? `, sonuc="${s[ELLE_SONUC] === "uygun" ? "uygun" : "uygun değil"}", gerekce=${tirnak(s[ELLE_GEREKCE] ?? "")}` : ""}`));
      if (satirlar.length > TABLO_SATIR) l.push(`- … ve ${satirlar.length - TABLO_SATIR} satır daha`);
    } else if (b.blok === "liste") {
      l.push(`## ${b.ad} — kontrol listesi; madde cevabı m:<kimlik> (${b.cevaplar.join(" / ")}), kusur açıklaması m:<kimlik>#not, derecesi m:<kimlik>#derece (hafif / ağır)`);
      for (const gr of b.gruplar) for (const m of gr.maddeler) {
        const x = c.madde[m.id];
        l.push(`- m:${m.id} · ${m.metin.slice(0, 200)} = ${x?.c ? tirnak(x.c) : "—"}${x?.derece ? ` (${x.derece === "agir" ? "ağır" : "hafif"} kusur)` : ""}${x?.not ? ` not ${tirnak(x.not)}` : ""}`);
      }
    } else if (b.blok === "sonuc") sonucVar = true;
    else if (b.blok === "not") notVar = true;
  }
  if (sonucVar) l.push("## Sonuç", `- sonuc · Sonuç (uygun / uygun değil) = ${c.sonuc === "uygun" ? "\"uygun\"" : c.sonuc === "uygun_degil" ? "\"uygun değil\"" : "—"}`);
  if (notVar) l.push("## Uzman yorumu", `- yorum · Muayene uzmanının yorumu (yazı) = ${tirnak(c.yorum)}`);
  /* 557: ölçüm cihazları — seçilebilir cihazın koduyla (boş: kaldır) */
  const cihazlar = cihazlarOku(canli.cihazlar);
  if (cihazlar.length) {
    l.push("## Ölçüm cihazları (zimmetteki cihazın koduyla seçilir; boş değer kaldırır)");
    for (const x of cihazlar) {
      const secili = x.secenekler.find((s) => s.id === x.secili);
      l.push(`- cihaz:${x.turId} · ${x.turAd} = ${secili ? tirnak(secili.kod) : "—"}; seçilebilir: ${x.secenekler.length ? x.secenekler.map((s) => `${s.kod}${s.ad ? ` (${s.ad})` : ""}`).join(", ") : "yok"}`);
    }
  }
  const metin = l.join("\n");
  return metin.length > HARITA_SINIRI ? `${metin.slice(0, HARITA_SINIRI)}\n… (rapor uzun; geri kalanı kısaltıldı)` : metin;
}
