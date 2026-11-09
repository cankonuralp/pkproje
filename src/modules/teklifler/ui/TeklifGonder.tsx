"use client";
/* TEKLİFİ GÖNDER (2026-11-09; reisim: "teklif gönderme işi de mail ile olsun teklif gönder diyince ön izleme ile müşterinin mailine gönderilecek mail düzenlenebilsin
   vs detaylandırırsın benim mantığıma göre"): tuş pencereyi açar, veri açılınca sunucudan gelir. Alıcı müşterinin e-postasıyla dolu (en çok 5), konu ve ileti hazır
   metinle dolu, ikisi de düzenlenir. Önizleme: "E-posta" (Kimden, Kime, Konu, Ek + yazılan ileti, yazdıkça) · "Teklif belgesi" (giden PDF'le aynı çizici).
   Taslakta "Gönderildi olarak işaretle" de pencerede: teklif elden ya da başka yolla verildiyse. Karar sunucuda. */
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import "../../../belge/belge.css";
import { belgeCizimi, teklifDegerleri } from "../../../belge/katalog";
import { teklifBelgesi } from "../../../belge/teklif";
import { BelgeOnizleme } from "../../../components/belge-onizleme/BelgeOnizleme";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { aliciHatalari, aliciId, Alicilar, doluAlicilar } from "../../../components/eposta/Alicilar";
import { Alan, Girdi, ipucuId, Segment } from "../../../components/form/Form";
import { Pencere } from "../../../components/pencere/Pencere";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import { GONDER_EN_COK } from "../sema";
import type { TeklifGonderimVerisi } from "../server/gonderim";
import type { TeklifKarti } from "../server/teklifler";
import { teklifEpostaGonderEylemi } from "./belge-eylemler";
import { teklifGonderEylemi, teklifGonderimVerisiEylemi } from "./eylemler";
import stil from "./teklifler.module.css";

const ON = "tgw", KONU = "tgw-konu", ILETI = "tgw-ileti";

export function TeklifGonderTusu({ t }: { t: TeklifKarti }) {
  const bildir = useBildir();
  const [acik, setAcik] = useState(false);
  const [veri, setVeri] = useState<TeklifGonderimVerisi | null>(null);
  const [bekliyor, baslat] = useTransition();
  const ac = () => baslat(async () => {
    const v = await teklifGonderimVerisiEylemi(t.id);
    if (!v) { bildir("Teklif gönderilemiyor. Sayfayı yenileyip yeniden deneyin."); return; }
    setVeri(v); setAcik(true);
  });
  const yeniden = t.durum === "gonderildi";
  return (
    <>
      <Tus tur={yeniden ? "ikincil" : "birincil"} ikon="send" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={ac}>{yeniden ? "Yeniden gönder" : "Teklifi gönder"}</Tus>
      {acik && veri && <GonderPenceresi key={t.surum} t={t} v={veri} kapat={() => setAcik(false)} />}
    </>
  );
}

function GonderPenceresi({ t, v, kapat }: { t: TeklifKarti; v: TeklifGonderimVerisi; kapat: () => void }) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [kime, setKime] = useState<string[]>([v.kime]);
  const [konu, setKonu] = useState(v.konu);
  const [govde, setGovde] = useState(v.govde);
  const [kimeH, setKimeH] = useState<Record<number, string>>({});
  const [h, setH] = useState<Record<string, string>>({});
  const [genel, setGenel] = useState<string | null>(null);
  const [gorunum, setGorunum] = useState<"posta" | "belge">("posta");
  const belge = useMemo(() => belgeCizimi("teklif", v.belge, teklifDegerleri, teklifBelgesi), [v.belge]);
  const dolu = doluAlicilar(kime);
  const gonder = () => baslat(async () => {
    if (!dolu.length) { setKimeH({ 0: "En az bir e-posta yazılmalı." }); setGenel(null); document.getElementById(aliciId(ON, 0))?.focus(); return; }
    const r = await teklifEpostaGonderEylemi(t.id, t.surum, { kime: dolu.map(([x]) => x), konu, govde });
    if (!r.tamam) {
      const yeni = aliciHatalari(dolu, r.hatalar ?? {});
      setKimeH(yeni); setH(r.hatalar ?? {}); setGenel(r.genel ?? null);
      const ilk = Object.keys(yeni).map(Number).sort((a, b) => a - b)[0];
      document.getElementById(ilk !== undefined ? aliciId(ON, ilk) : r.hatalar?.konu ? KONU : r.hatalar?.govde ? ILETI : "")?.focus();
      return;
    }
    kapat(); bildir(r.bildirim ?? "E-posta gönderiliyor."); router.refresh();
  });
  const isaretle = () => baslat(async () => {
    const r = await teklifGonderEylemi(t.id, t.surum);
    if (!r.tamam) { setGenel(r.genel ?? Object.values(r.hatalar ?? {})[0] ?? "İşlem yapılamadı."); return; }
    kapat(); bildir(r.bildirim ?? "Kaydedildi."); router.refresh();
  });
  return (
    <Pencere acik baslik={`${v.yeniden ? "Yeniden gönder" : "Teklifi gönder"} · ${v.no}`} onKapat={() => { if (!bekliyor) kapat(); }} odak={`#${aliciId(ON, 0)}`} genis
      alt={<>
        <Tus tur="ikincil" disabled={bekliyor} onClick={kapat}>Vazgeç</Tus>
        {!v.yeniden && <Tus tur="ikincil" disabled={bekliyor} onClick={isaretle}>Gönderildi olarak işaretle</Tus>}
        <Tus ikon="send" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={gonder}>Gönder</Tus>
      </>}>
      {genel && <Serit tur="hata" ikon="circle-alert">{genel}</Serit>}
      {!v.kimden && <Serit tur="uyari" ikon="triangle-alert">Firmanın e-posta gönderimi henüz açık değil; e-posta sırada bekler, açılınca gider.</Serit>}
      {v.bos.length > 0 && <Serit tur="uyari" ikon="triangle-alert">Elle doldurulacak {v.bos.length} yer boş: {v.bos.join(", ")}.</Serit>}
      <form className={stil.gonderForm} onSubmit={(e) => { e.preventDefault(); gonder(); }}>
        <Alicilar on={ON} liste={kime} hatalar={kimeH} enCok={GONDER_EN_COK} degistir={setKime} hataTemizle={setKimeH} />
        <Alan id={KONU} etiket="Konu" zorunlu hata={h.konu}>
          <Girdi id={KONU} maxLength={200} value={konu} hata={!!h.konu} onChange={(e) => setKonu(e.target.value)} />
        </Alan>
        <Alan id={ILETI} etiket="İleti" zorunlu hata={h.govde}>
          <textarea id={ILETI} className={stil.ileti} maxLength={5000} value={govde} aria-invalid={!!h.govde || undefined} aria-describedby={ipucuId(ILETI)} onChange={(e) => setGovde(e.target.value)} />
        </Alan>
      </form>
      <div className={stil.onizlemeSecim}>
        <Segment ad="Önizleme" deger={gorunum} kapali={false} secenekler={[["posta", "E-posta"], ["belge", "Teklif belgesi"]]} degistir={setGorunum} />
      </div>
      {gorunum === "posta"
        ? (
          <section className={stil.posta} aria-label="E-postanın önizlemesi">
            <dl className={stil.postaBas}>
              {v.kimden && <><dt>Kimden</dt><dd>{v.kimden}</dd></>}
              <dt>Kime</dt><dd>{dolu.map(([x]) => x).join(", ") || "—"}</dd>
              <dt>Konu</dt><dd>{konu.trim() || "—"}</dd>
              <dt>Ek</dt><dd>{v.no}.pdf</dd>
            </dl>
            <p className={stil.postaGovde}>{govde}</p>
          </section>
        )
        : <BelgeOnizleme ek={stil.belgeOnizleme} etiket="Teklif belgesinin önizlemesi">{belge}</BelgeOnizleme>}
    </Pencere>
  );
}
