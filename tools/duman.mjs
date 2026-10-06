/* DUMAN TESTİ (350; 09-G5, 06 "her teslimden sonra canlıya karşı duman testi koşulur") — canlı siteyi DIŞARIDAN yoklar; salt okunur (yalnız GET,
   oturum yok, parola yok, veri yazılmaz). Çıkış kodu 0 = hepsi geçti.
     node tools/duman.mjs [firma adresi] [yönetim adresi]
   Varsayılan: https://probata-deneme.vercel.app ve https://probata-yonetim.vercel.app (deneme yayını).
   Denetimler: sağlık ucu (veritabanı, göç güncel, RLS, Supabase API rolleri kapalı, uygulama rolü kısıtlı) · giriş sayfası + güvenlik başlıkları
   (CSP nonce'lu, HSTS, çerçeveye gömülmez, nosniff) · oturumsuz sayfa girişe yönlenir · anonim dosya isteği 403 · oturumsuz tanım dizini 403 ·
   firma adresinde /yonetim yok · yönetim adresinde yalnız /yonetim (firma ekranı ve API 404 — önceden yükleme başlığıyla da). */
const FIRMA = (process.argv[2] ?? "https://probata-deneme.vercel.app").replace(/\/$/, "");
const YONETIM = (process.argv[3] ?? "https://probata-yonetim.vercel.app").replace(/\/$/, "");
const sonuclar = [];
const denet = async (ad, is) => {
  try {
    const r = await is();
    sonuclar.push([r === true, ad, r === true ? "" : String(r)]);
  } catch (h) {
    sonuclar.push([false, ad, h instanceof Error ? h.message : String(h)]);
  }
};
const al = (url, basliklar = {}) => fetch(url, { redirect: "manual", headers: { "User-Agent": "probata-duman/1", ...basliklar } });

await denet("sağlık ucu: bütün denetimler", async () => {
  const r = await al(`${FIRMA}/api/saglik`);
  const j = await r.json();
  const dusen = Object.entries(j.denetimler ?? {}).filter(([, v]) => v !== true).map(([k]) => k);
  return r.status === 200 && j.durum === "tamam" ? true : `HTTP ${r.status}, düşen: ${dusen.join(", ") || "?"} (sürüm ${j.surum})`;
});
await denet("giriş sayfası 200 + güvenlik başlıkları", async () => {
  const r = await al(`${FIRMA}/giris`);
  const h = (k) => r.headers.get(k) ?? "";
  const eksik = [
    !/script-src[^;]*'nonce-/.test(h("content-security-policy")) && "CSP nonce",
    !/frame-ancestors 'none'/.test(h("content-security-policy")) && "frame-ancestors",
    !/max-age=\d{8,}/.test(h("strict-transport-security")) && "HSTS",
    h("x-content-type-options") !== "nosniff" && "nosniff",
    h("x-frame-options") !== "DENY" && "X-Frame-Options",
  ].filter(Boolean);
  return r.status === 200 && !eksik.length ? true : `HTTP ${r.status}; eksik: ${eksik.join(", ")}`;
});
await denet("oturumsuz sayfa girişe yönlenir", async () => {
  const r = await al(`${FIRMA}/planlar`);
  const yer = r.headers.get("location") ?? "";
  return [303, 307, 308].includes(r.status) && /\/giris/.test(yer) ? true : `HTTP ${r.status} → ${yer}`;
});
await denet("anonim dosya isteği 403", async () => {
  const r = await al(`${FIRMA}/api/dosya/00000000-0000-4000-8000-000000000000`);
  return r.status === 403 ? true : `HTTP ${r.status}`;
});
await denet("oturumsuz tanım dizini 403", async () => {
  const r = await al(`${FIRMA}/api/tanim/dizin`);
  return r.status === 403 ? true : `HTTP ${r.status}`;
});
await denet("firma adresinde /yonetim yok (404)", async () => {
  const r = await al(`${FIRMA}/yonetim/giris`);
  return r.status === 404 ? true : `HTTP ${r.status}`;
});
await denet("yönetim girişi açılır (200)", async () => {
  const r = await al(`${YONETIM}/yonetim/giris`);
  return r.status === 200 ? true : `HTTP ${r.status}`;
});
await denet("yönetim adresinde firma ekranı ve API yok (404, önceden yükleme başlığıyla da)", async () => {
  const yollar = [["/planlar", {}], ["/api/surum", {}], ["/api/surum", { "next-router-prefetch": "1" }], ["/api/saglik", { Purpose: "prefetch" }]];
  const kotu = [];
  for (const [y, b] of yollar) { const r = await al(`${YONETIM}${y}`, b); if (r.status !== 404) kotu.push(`${y} ${JSON.stringify(b)} → ${r.status}`); }
  return kotu.length ? kotu.join("; ") : true;
});
await denet("yönetim paneli oturumsuz girişe yönlenir", async () => {
  const r = await al(`${YONETIM}/yonetim`);
  const yer = r.headers.get("location") ?? "";
  return [303, 307, 308].includes(r.status) && /\/yonetim\/giris/.test(yer) ? true : `HTTP ${r.status} → ${yer}`;
});

for (const [tamam, ad, neden] of sonuclar) console.log(`${tamam ? "✔" : "✖"} ${ad}${neden ? ` — ${neden}` : ""}`);
const dusen = sonuclar.filter(([t]) => !t).length;
console.log(dusen ? `\n${dusen}/${sonuclar.length} denetim DÜŞTÜ` : `\n${sonuclar.length}/${sonuclar.length} denetim geçti`);
process.exit(dusen ? 1 : 0);
