/* DUMAN TESTİ (350; 09-G5, 06 "her teslimden sonra canlıya karşı duman testi koşulur") — canlı siteyi DIŞARIDAN yoklar; salt okunur (yalnız GET,
   oturum yok, parola yok, veri yazılmaz). Çıkış kodu 0 = hepsi geçti.
     node tools/duman.mjs [firma adresi] [yönetim adresi]
   Varsayılan: https://deneme.probata.com.tr ve https://yonetim.probata.com.tr (582, 2026-10-15: probata.com.tr; eski vercel.app adresleri 308 ile yönlenir).
   Denetimler: sağlık ucu (veritabanı, göç güncel, RLS, Supabase API rolleri kapalı, uygulama rolü kısıtlı) · giriş sayfası + güvenlik başlıkları
   (CSP nonce'lu, HSTS, çerçeveye gömülmez, nosniff) · oturumsuz sayfa girişe yönlenir · anonim dosya isteği 403 · oturumsuz tanım dizini 403 ·
   firma adresinde /yonetim yok · /favicon.ico simgeye yönlenir (409) · yönetim adresinde yalnız /yonetim (firma ekranı ve API 404 — önceden yükleme başlığıyla da).
   FIRMA-VT FV7 (2026-10-15): sağlık ucu firma adresinde o firmanın veritabanını da denetler ("firma_vt" — bütün denetimler doğru olmalı). Ortamda
   PROBATA_DUMAN_SIR varsa (değeri yayının PROBATA_SAGLIK_SIR'ı — CRON_SECRET DEĞİL: o gece işlerini de açar, bu makineye konmaz; yalnız bu makinenin
   ortamında, koda / komut satırına yazılmaz) /api/saglik/projeler de yoklanır: her kendi projeli firma veritabanı — sorunlu 0 olmalı. Sır yalnız
   https://<ad>.probata.com.tr adresine ya da yerel http adrese gönderilir (yazım hatalı / benzer alan adına gitmez), biçimi önce denetlenir (en az 32
   görünür ASCII karakter — satır sonu ya da boşluk varsa istek yapılmaz: fetch'in başlık hatası sırrı iletisine yazardı), yönlendirme izlenmez,
   çıktıya yazılmaz (istek hatasında yalnız hata kodu). Yoksa bu denetim atlanır (sayıya girmez, "atlandı" satırı). 2026-10-15 (FV7 incelemesi):
   önce her https adresine gidiyordu, biçim denetimi yoktu (gömülü satır sonu sırrı hata iletisiyle çıktıya düşürüyordu). */
const FIRMA = (process.argv[2] ?? "https://deneme.probata.com.tr").replace(/\/$/, "");
const YONETIM = (process.argv[3] ?? "https://yonetim.probata.com.tr").replace(/\/$/, "");
const DUMAN_SIR = (process.env.PROBATA_DUMAN_SIR ?? "").trim();
/** sırlı isteğin gidebileceği adresler: ürünün alt adresleri (https) ve yerel geliştirme / test (http) */
const SIRLI_ADRES = /^(?:https:\/\/[a-z0-9-]+\.probata\.com\.tr|http:\/\/(?:127\.0\.0\.1|localhost|[a-z0-9-]+\.localhost)(?::\d{1,5})?)$/;
/** sırrın biçimi: en az 32 görünür ASCII karakter (boşluk, satır sonu, NUL yok — zamanliYetkili de 32'den kısasını kabul etmez) */
const SIR_BICIMI = /^[\x21-\x7e]{32,}$/;
const sonuclar = [];
const atlananlar = [];
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
    /* 489: deneme ortamının gevşetmesi (PROBATA_E2E_YAYIN) canlıya sızmadı — http istekleri https'e çevrilir */
    !/upgrade-insecure-requests/.test(h("content-security-policy")) && "upgrade-insecure-requests",
  ].filter(Boolean);
  return r.status === 200 && !eksik.length ? true : `HTTP ${r.status}; eksik: ${eksik.join(", ")}`;
});
await denet("simge: /favicon.ico sitenin simgesine yönlenir (404 değil)", async () => {
  const r = await al(`${FIRMA}/favicon.ico`);
  return (r.status === 308 || r.status === 301) && /\/icon\.svg$/.test(r.headers.get("location") ?? "") ? true : `HTTP ${r.status} → ${r.headers.get("location")}`;
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
/* 489: geliştirme vitrini canlıda kapalı (deneme ortamının gevşetmesi sızmadı) */
await denet("geliştirme vitrini yok (404)", async () => {
  const r = await al(`${FIRMA}/vitrin`);
  return r.status === 404 ? true : `HTTP ${r.status}`;
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
/* FV7: her kendi projeli firma veritabanı (yalnız sırla). Sır yalnız ürünün https alt adresine ya da yerel adrese; yönlendirme izlenmez (al: manual) */
const PROJELER = "proje sağlığı: her kendi projeli firma veritabanı (sorunlu 0)";
if (DUMAN_SIR) {
  await denet(PROJELER, async () => {
    if (!SIRLI_ADRES.test(FIRMA)) return "sır yalnız https://<ad>.probata.com.tr ya da yerel http adrese gönderilir — istek yapılmadı";
    if (!SIR_BICIMI.test(DUMAN_SIR)) return "PROBATA_DUMAN_SIR biçimi geçersiz (en az 32 görünür ASCII karakter; boşluk / satır sonu yok) — istek yapılmadı";
    let r;
    try {
      r = await al(`${FIRMA}/api/saglik/projeler`, { Authorization: `Bearer ${DUMAN_SIR}` });
    } catch (h) {
      /* hata iletisi isteğin başlığını (sırrı) taşıyabilir — yalnız hata kodu yazılır */
      const kod = h?.cause?.code ?? h?.code;
      return `istek gönderilemedi${typeof kod === "string" && /^[A-Z0-9_]{2,40}$/.test(kod) ? ` (${kod})` : ""}`;
    }
    const j = await r.json().catch(() => ({}));
    const sayi = (x) => (Number.isInteger(x) ? x : "?");
    return r.status === 200 && j.sorunlu === 0 && Number.isInteger(j.toplam) && j.tamam === j.toplam
      ? true : `HTTP ${r.status}, toplam ${sayi(j.toplam)}, tamam ${sayi(j.tamam)}, sorunlu ${sayi(j.sorunlu)}`;
  });
} else atlananlar.push(`${PROJELER} — PROBATA_DUMAN_SIR yok`);

for (const [tamam, ad, neden] of sonuclar) console.log(`${tamam ? "✔" : "✖"} ${ad}${neden ? ` — ${neden}` : ""}`);
for (const ad of atlananlar) console.log(`– atlandı: ${ad}`);
const dusen = sonuclar.filter(([t]) => !t).length;
console.log(dusen ? `\n${dusen}/${sonuclar.length} denetim DÜŞTÜ` : `\n${sonuclar.length}/${sonuclar.length} denetim geçti`);
process.exit(dusen ? 1 : 0);
