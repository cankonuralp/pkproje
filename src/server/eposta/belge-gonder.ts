/* BELGEYİ E-POSTAYLA GÖNDER (2026-10-25, belge doldurma; reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir
   olmalı, bir müşteri için sözleşme açtığımda el ile girilmesi gereken yerleri girip öyle gönderebilmeliyim"; göç 0105) — programın bastığı belge
   (sözleşme, ön bilgilendirme formu …) TEK DOSYA YOLUNDAN saklanır (dosyaYukle: tür baytlardan, anahtar tek üreticiden, iz; modül ve kayıt
   ÇAĞIRANIN — dosyayı kim açar, o modülün erişim kaydı söyler) ve alıcı başına EKLİ e-posta kuyruğa yazılır (eposta.ts). İkisi çağıranın işleminde:
   biri düşerse ikisi de geri alınır. Gönderimi çağıran sonra tetikler (sonra.ts — yanıttan sonra). Yetki ÇAĞIRANDA. Geçerli alıcı yoksa hiçbir şey
   yazılmaz, hata fırlatılır (çağıran alıcıyı önce adresler() ile denetler). */
import type { Sorgulayici } from "../db/kiraci.ts";
import type { Depo } from "../dosya/depo.ts";
import { dosyaYukle } from "../dosya/dosya.ts";
import { adresler, epostaKuyruga } from "./eposta.ts";

export interface BelgeEpostasi {
  /** basılmış PDF */
  pdf: Uint8Array;
  /** ekin (ve saklanan dosyanın) adı */
  dosyaAdi: string;
  /** dosyanın bağlandığı modül ve kayıt (tek dosya yolu; erişim kaydı o modülün) */
  modul: string; kayitId: string;
  kime: readonly string[]; konu: string; govde: string;
  /** e-postanın kaynağı (plan içi listesi bununla okur) */
  kaynak: string; kaynakId: string;
  /** tuşa basan kişi (hesapGonderen) — yoksa otomatik e-posta */
  gonderen: { ad: string; eposta: string } | null;
}

export async function belgeEpostala(db: Sorgulayici, depo: Depo, kim: { ad: string; id: string }, firmaId: string, o: BelgeEpostasi): Promise<{ kuyruk: string[]; dosyaId: string }> {
  if (!adresler(o.kime).length) throw new Error("belge e-postasının geçerli alıcısı yok");
  const y = await dosyaYukle(db, depo, { firmaId, modul: o.modul, kayitId: o.kayitId, ad: o.dosyaAdi, bayt: o.pdf, izinli: ["pdf"], kim: kim.ad, yukleyen: kim.id });
  if (!y.tamam) throw new Error(`belge saklanamadı (${y.neden})`);
  const kuyruk = await epostaKuyruga(db, { kime: o.kime, konu: o.konu, govde: o.govde, kaynak: o.kaynak, kaynakId: o.kaynakId, gonderen: o.gonderen,
    ek: { dosyaId: y.id, ad: y.ad } }, { kim: kim.ad, ne: `${o.kaynak}.eposta`, gerekce: y.ad });
  return { kuyruk, dosyaId: y.id };
}
