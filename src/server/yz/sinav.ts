/* S.A.Y KAYITTAN OYNATMA SINAVI — ÇEKİRDEK (2026-11-10; reisim: "1 ve 2 ve 4 5 i yap" — liste 5; sunum yerel/sunum/say-ogrenme.html "Kayıttan oynatma
   sınavı": "S.A.Y'a aynı istek verilir, işlemlerin cevabı kayıttan gelir, gerçek veriye dokunulmaz. S.A.Y aynı doğru adımları seçiyorsa geçer"). SAF: ağ
   ve veritabanı yok; yapay zekâ çağrısı dışarıdan verilir (sinavKos'un cagir'ı — testte taklit).
   Kayıt: say_arge.icerik (olcum.ts argeIcerigi — { rol, bloklar }; düşünme, görüntü, belge ve araç kimlikleri YOK, sonuçlar kırpık).
   · kayitMesajlari: kaydı yapay zekâ hizmetinin mesajlarına çevirir — araç çağrılarına sıra kimliği verilir, sonuçlar sıradaki çağrılarla eşlenir;
     eşleşmeyen yerde kayıt orada kesilir (uydurulmaz). İnternet araması çağrısı geçmişten çıkar (sonucu kayıtta yok).
   · sinavSorulari: SORU = kullanıcının yazdığı bir mesajdan hemen sonraki ilk karar (S.A.Y işe hangi araçla başladı). Araç döngüsünün içindeki
     adımlar soru olmaz: kayıtta düşünme blokları yok, hizmet döngünün ortasından düşünme açıkken sürdürülmesini kabul etmez — o adımlar üretimle
     aynı istekle sorulamaz.
   · karsilastir: beklenenin ilk aracı gelen araçların içindeyse (ya da ikisi de araçsız cevapsa) geçer; yardımcı araçlar (işlem / beceri dizinine
     bakma, ekranı okuma) karşılaştırmadan önce atılır — sırası işi değiştirmez.
   · sinavKos: soruları sırayla sorar; çağrı düşerse soru "sorulamadı" sayılır (kalmış sayılmaz), sınav GECME_ORANI ve üstünde geçer.
   Bağlanacak yer (yapılmadı): Yönetim'de "Sınavı koş" — kayıtları firma_yonetim_say_arge okur; çağrının kimin anahtarıyla yapılacağı reisim'in kararı.
   Kilit tests/say-sinav.test.ts; olumsuz kanıt tests/bozan/say-sinav.bozan.ts. */

export interface KayitBlogu { type: string; text?: unknown; name?: unknown; input?: unknown; hata?: unknown }
export interface KayitIletisi { rol: string; bloklar: readonly KayitBlogu[] }
export type SinavMesaji = { role: "user" | "assistant" | "system"; content: string | Record<string, unknown>[] };
export interface SinavSorusu { sira: number; soru: string; mesajlar: SinavMesaji[]; beklenen: string[] }

/** bir kayıttan en çok soru (maliyet sınırı: her soru bir yapay zekâ çağrısı) */
export const SINAV_SORU_EN_COK = 8;
/** sınavın geçme oranı (sorulabilen sorular içinde) */
export const GECME_ORANI = 0.8;
/** işi değiştirmeyen yardımcı araçlar: dizine / beceriye bakma, ekranı okuma */
export const YARDIMCI_ARACLAR: ReadonlySet<string> = new Set(["islemler", "beceri_oku", "ekran_durumu"]);
const ARAMA = "web_search";

const metin = (x: unknown): string => (typeof x === "string" ? x : "");
const ad = (x: unknown): string | null => (typeof x === "string" && /^[a-z][a-z0-9_]{0,63}$/.test(x) ? x : null);

/** kaydın mesajları + karar noktaları (kullanıcının yazdığı mesajdan sonraki ilk cevap). Eşleşmeyen sonuçta kayıt orada kesilir. */
export function kayitMesajlari(kayit: readonly KayitIletisi[]): { mesajlar: SinavMesaji[]; kararlar: { mesaj: number; soru: string; adlar: string[] }[] } {
  const mesajlar: SinavMesaji[] = [], kararlar: { mesaj: number; soru: string; adlar: string[] }[] = [];
  let bekleyen: string[] = [], soru: string | null = null;
  for (let i = 0; i < kayit.length; i++) {
    const m = kayit[i]!;
    const bloklar = Array.isArray(m.bloklar) ? m.bloklar : [];
    if (m.rol === "system") {
      if (bekleyen.length) break;
      const t = bloklar.filter((b) => b.type === "text").map((b) => metin(b.text)).join("\n").trim();
      if (t) mesajlar.push({ role: "system", content: t });
    } else if (m.rol === "user") {
      const sonuclar = bloklar.filter((b) => b.type === "tool_result");
      if (sonuclar.length !== bekleyen.length) break;   /* cevapsız çağrı ya da çağrısız sonuç: kayıt burada tutarsız */
      const icerik: Record<string, unknown>[] = sonuclar.map((b, k) => ({ type: "tool_result", tool_use_id: bekleyen[k]!, content: metin(b.text), ...(b.hata ? { is_error: true } : {}) }));
      const yazi = bloklar.filter((b) => b.type === "text").map((b) => metin(b.text)).filter((t) => t.trim());
      for (const t of yazi) icerik.push({ type: "text", text: t });
      if (!icerik.length) continue;
      mesajlar.push({ role: "user", content: icerik });
      /* kullanıcının yazdığı mesaj (araç sonucu taşımayan): sonraki cevap karar noktası */
      soru = !sonuclar.length && yazi.length ? yazi.join("\n").slice(0, 200) : null;
      bekleyen = [];
    } else if (m.rol === "assistant") {
      if (bekleyen.length) break;
      const icerik: Record<string, unknown>[] = [], adlar: string[] = [], kimlikler: string[] = [];
      for (const b of bloklar) {
        if (b.type === "text" && metin(b.text).trim()) icerik.push({ type: "text", text: metin(b.text) });
        else if (b.type === "tool_use") {
          const a = ad(b.name);
          if (!a) continue;
          const id = `sinav_${i}_${kimlikler.length}`;
          kimlikler.push(id); adlar.push(a);
          icerik.push({ type: "tool_use", id, name: a, input: b.input && typeof b.input === "object" ? b.input : {} });
        } else if (b.type === "server_tool_use") adlar.push(ARAMA);   /* geçmişe girmez (sonucu kayıtta yok); kararda sayılır */
      }
      if (soru !== null) kararlar.push({ mesaj: mesajlar.length, soru, adlar });
      soru = null;
      mesajlar.push({ role: "assistant", content: icerik.length ? icerik : [{ type: "text", text: "…" }] });
      bekleyen = kimlikler;
    }
  }
  return { mesajlar, kararlar };
}

/** kaydın soruları: her karar noktasında o ana kadarki konuşma + beklenen araçlar (en çok enCok; baştan) */
export function sinavSorulari(kayit: readonly KayitIletisi[], enCok = SINAV_SORU_EN_COK): SinavSorusu[] {
  const { mesajlar, kararlar } = kayitMesajlari(kayit);
  return kararlar.slice(0, Math.max(0, enCok)).map((k, sira) => ({ sira, soru: k.soru, mesajlar: mesajlar.slice(0, k.mesaj), beklenen: k.adlar }));
}

const asil = (l: readonly string[]) => l.filter((x) => !YARDIMCI_ARACLAR.has(x));
/** aynı karar mı: yardımcı araçlar atılır; ikisi de araçsızsa ya da beklenenin ilk aracı gelenlerin içindeyse geçer */
export function karsilastir(beklenen: readonly string[], gelen: readonly string[]): { gecti: boolean; beklenen: string[]; gelen: string[] } {
  const b = asil(beklenen), g = asil(gelen);
  return { gecti: b.length === 0 ? g.length === 0 : g.includes(b[0]!), beklenen: b, gelen: g };
}

export interface SoruSonucu { sira: number; soru: string; beklenen: string[]; gelen: string[] | null; gecti: boolean | null }
export interface SinavSonucu { soru: number; sorulan: number; gecen: number; kalan: number; sorulamayan: number; oran: number | null; gecti: boolean | null; sorular: SoruSonucu[] }

/** sorulardan sonuç: oran sorulabilenler içinde; hiç soru sorulamadıysa sonuç yok (null — geçti de kaldı da denmez) */
export function sinavSonucu(sorular: readonly SoruSonucu[]): SinavSonucu {
  const sorulan = sorular.filter((s) => s.gecti !== null), gecen = sorulan.filter((s) => s.gecti).length;
  const oran = sorulan.length ? gecen / sorulan.length : null;
  return { soru: sorular.length, sorulan: sorulan.length, gecen, kalan: sorulan.length - gecen, sorulamayan: sorular.length - sorulan.length, oran,
    gecti: oran === null ? null : oran >= GECME_ORANI, sorular: [...sorular] };
}

/** sınavı koş: kayıtların soruları sırayla sorulur. cagir: konuşmayı yapay zekâya verir, seçtiği araç adlarını döner (düşerse null) */
export async function sinavKos(kayitlar: readonly (readonly KayitIletisi[])[], cagir: (mesajlar: SinavMesaji[]) => Promise<string[] | null>,
  s: { soruEnCok?: number; toplamEnCok?: number } = {}): Promise<SinavSonucu> {
  const sonuclar: SoruSonucu[] = [], toplam = s.toplamEnCok ?? 24;
  for (const kayit of kayitlar) {
    for (const q of sinavSorulari(kayit, s.soruEnCok)) {
      if (sonuclar.length >= toplam) return sinavSonucu(sonuclar);
      let gelen: string[] | null;
      try { gelen = await cagir(q.mesajlar); } catch { gelen = null; }
      const k = gelen ? karsilastir(q.beklenen, gelen) : null;
      sonuclar.push({ sira: sonuclar.length, soru: q.soru, beklenen: k ? k.beklenen : asil(q.beklenen), gelen: k ? k.gelen : null, gecti: k ? k.gecti : null });
    }
  }
  return sinavSonucu(sonuclar);
}
