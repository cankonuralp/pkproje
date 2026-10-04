"use client";
/* PROJE NOTLARI (maket planlarim.html 5. tur; karar 27): plandaki denetçiler ve planlama ekibi yazar ve görür, müşteri görmez; not değişmez,
   silinmez. En yeni üstte; son 6, "Tümünü göster". Hareket kaydı tutulur ama plan içinde gösterilmez (5. tur: "hareketler kısmını kaldır"). */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Tus } from "../../../components/tus/Tus";
import { zamanNo } from "../sema";
import { notEkleEylemi } from "./eylemler";
import stil from "./planlar.module.css";

export function ProjeNotlari({ planId, notlar }: { planId: string; notlar: { id: string; metin: string; yazan: string; zaman: string }[] }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [metin, setMetin] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [hepsi, setHepsi] = useState(false);
  const gorunen = hepsi ? notlar : notlar.slice(0, 6);
  const ekle = () => baslat(async () => {
    const r = await notEkleEylemi(planId, metin);
    if (r.tamam) { setMetin(""); setHata(null); bildir(r.bildirim ?? "Not eklendi."); router.refresh(); return; }
    setHata(r.hatalar?.metin ?? r.genel ?? "Not eklenemedi.");
  });
  return (
    <section className={stil.notlar} aria-labelledby="proje-notlari">
      <div className={stil.altBas}><h2 className={stil.adimBaslik} id="proje-notlari">Proje notları</h2><span className={stil.altInline}><b>{notlar.length}</b> not</span></div>
      <div className={stil.notForm}>
        <label className="gizli" htmlFor="not-girdi">Proje notu</label>
        <textarea id="not-girdi" className={stil.not} maxLength={500} value={metin} placeholder="Proje notu ekleyin" aria-invalid={!!hata || undefined}
          aria-describedby={hata ? "not-hata" : undefined} onChange={(e) => { setMetin(e.target.value); setHata(null); }} />
        <Tus tur="ikincil" ikon="plus" disabled={!metin.trim() || bekliyor} onClick={ekle}>Notu ekle</Tus>
      </div>
      {hata && <p className={stil.uyari} id="not-hata">{hata}</p>}
      {notlar.length > 0 && (
        <ol className={stil.gecmis}>
          {gorunen.map((n) => (
            <li key={n.id}>
              <span className={stil.gecmisZaman}>{zamanNo(n.zaman)}</span>
              <span className={stil.gecmisNe}><b>{n.yazan}</b><span className={stil.notMetin}>{n.metin}</span></span>
            </li>
          ))}
        </ol>
      )}
      {notlar.length > 6 && <Tus tur="ikincil" className={stil.hepsiTus} onClick={() => setHepsi(!hepsi)}>{hepsi ? "Son 6 notu göster" : `Tümünü göster (${notlar.length})`}</Tus>}
    </section>
  );
}
