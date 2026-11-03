/* SIKIŞTIRILMIŞ ZIP YAZICI (2026-11-03, yedek): components/disa/zip.ts'in sunucudaki DEFLATE'li kardeşi — veri yedeği yazıdan oluşur, ZIP'te 5–10 kat
   küçülür (sunumdaki söz). Girdi parça parça yazılır (büyük tablo satır satır; bellekte yalnız sıkıştırılmış hâli durur). Ad kuralı aynı: "/" ayraçlı
   göreli yol, "..", ters bölü, boş parça, mutlak yol, aynı ad reddedilir; adlar UTF-8 (bayrak 0x0800). 4 GB / 65 535 dosya sınırı (ZIP64 yok). */
import { createDeflateRaw, crc32 } from "node:zlib";

const te = new TextEncoder();

export class SikistirilmisZip {
  private readonly parca: Uint8Array[] = [];
  private readonly merkez: Uint8Array[] = [];
  private readonly adlar = new Set<string>();
  private ofs = 0;

  /** bir dosya: yaz() ile parça parça (metin ya da bayt); bitince sıkıştırılmış hâli ZIP'e girer */
  async dosya(adMetni: string, uret: (yaz: (m: string | Uint8Array) => Promise<void>) => Promise<void>): Promise<void> {
    if (!adMetni || adMetni.startsWith("/") || adMetni.includes("\\") || adMetni.split("/").some((p) => p === ".." || p === "") || this.adlar.has(adMetni)) {
      throw new Error(`ZIP: geçersiz dosya adı: ${adMetni}`);
    }
    if (this.adlar.size >= 0xffff) throw new Error("ZIP: çok fazla dosya");
    this.adlar.add(adMetni);
    const d = createDeflateRaw({ level: 6 }), cikti: Buffer[] = [];
    d.on("data", (p: Buffer) => cikti.push(p));
    const bitti = new Promise<void>((coz, reddet) => { d.once("end", () => coz()); d.once("error", reddet); });
    let c = 0, boy = 0;
    const yaz = (m: string | Uint8Array) => new Promise<void>((coz, reddet) => {
      const b = typeof m === "string" ? te.encode(m) : m;
      if (b.length === 0) { coz(); return; }
      c = crc32(b, c); boy += b.length;
      if (boy > 0xffffffff) { reddet(new Error("ZIP: 4 GB sınırı")); return; }
      if (d.write(b)) coz(); else d.once("drain", () => coz());
    });
    await uret(yaz);
    d.end();
    await bitti;
    const sik = cikti.reduce((n, x) => n + x.length, 0), ad = te.encode(adMetni);
    if (this.ofs + 30 + ad.length + sik > 0xffffffff) throw new Error("ZIP: 4 GB sınırı");
    const yerel = new DataView(new ArrayBuffer(30));
    yerel.setUint32(0, 0x04034b50, true); yerel.setUint16(4, 20, true); yerel.setUint16(6, 0x0800, true); yerel.setUint16(8, 8, true);
    yerel.setUint16(10, 0, true); yerel.setUint16(12, 0x21, true); yerel.setUint32(14, c >>> 0, true); yerel.setUint32(18, sik, true);
    yerel.setUint32(22, boy, true); yerel.setUint16(26, ad.length, true); yerel.setUint16(28, 0, true);
    this.parca.push(new Uint8Array(yerel.buffer), ad, ...cikti);
    const m = new DataView(new ArrayBuffer(46));
    m.setUint32(0, 0x02014b50, true); m.setUint16(4, 20, true); m.setUint16(6, 20, true); m.setUint16(8, 0x0800, true); m.setUint16(10, 8, true);
    m.setUint16(12, 0, true); m.setUint16(14, 0x21, true); m.setUint32(16, c >>> 0, true); m.setUint32(20, sik, true); m.setUint32(24, boy, true);
    m.setUint16(28, ad.length, true); m.setUint32(42, this.ofs, true);
    this.merkez.push(new Uint8Array(m.buffer), ad);
    this.ofs += 30 + ad.length + sik;
  }

  /** ZIP'in tamamı tek parça */
  bayt(): Uint8Array {
    const mb = this.merkez.reduce((n, x) => n + x.length, 0), n = this.adlar.size;
    const son = new DataView(new ArrayBuffer(22));
    son.setUint32(0, 0x06054b50, true); son.setUint16(8, n, true); son.setUint16(10, n, true); son.setUint32(12, mb, true); son.setUint32(16, this.ofs, true);
    const hepsi = [...this.parca, ...this.merkez, new Uint8Array(son.buffer)];
    const cikti = new Uint8Array(hepsi.reduce((t, x) => t + x.length, 0));
    let o = 0;
    for (const x of hepsi) { cikti.set(x, o); o += x.length; }
    return cikti;
  }
}
