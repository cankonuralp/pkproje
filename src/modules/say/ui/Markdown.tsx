/* S.A.Y cevabının çizimi (550): ../markdown.ts ağacı React öğeleriyle — HTML işlenmez (metin kaçışlı), bağlantı yalnız http(s), yeni sekmede. */
import { TabloSayfalari, useSayfa } from "../../../components/liste/Sayfalayici";
import type { Blok, Satir } from "../markdown";
import { markdown } from "../markdown";
import stil from "./say.module.css";

function Ic({ l }: { l: readonly Satir[] }) {
  return <>{l.map((x, i) => {
    switch (x.t) {
      case "y": return <span key={i}>{x.m}</span>;
      case "br": return <br key={i} />;
      case "k": return <code key={i} className={stil.kod}>{x.m}</code>;
      case "b": return <strong key={i}><Ic l={x.ic} /></strong>;
      case "i": return <em key={i}><Ic l={x.ic} /></em>;
      case "a": return <a key={i} href={x.href} target="_blank" rel="noopener noreferrer nofollow"><Ic l={x.ic} /></a>;
    }
  })}</>;
}

/** cevaptaki tablo — 2026-10-16: 20'den çok satır sayfalı (useSayfa; satır anahtarı genel sıra). ad: bölgenin ve sayfalayıcının adı — cevapta
    birden çok tablo varsa sırasıyla ("Tablo 2"; ekran okuyucuda ayırt edilsin) */
function MdTablo({ b, ad }: { b: Extract<Blok, { t: "tablo" }>; ad: string }) {
  const sy = useSayfa(b.satirlar.length);
  return <>
    <div className={stil.mdTabloKap} tabIndex={0} role="region" aria-label={ad}>
      <table className={stil.mdTablo}>
        <thead><tr>{b.bas.map((h, j) => <th key={j} scope="col"><Ic l={h} /></th>)}</tr></thead>
        <tbody>{sy.dilim(b.satirlar).map((s, j) => <tr key={sy.bas + j}>{s.map((h, k) => <td key={k}><Ic l={h} /></td>)}</tr>)}</tbody>
      </table>
    </div>
    <TabloSayfalari s={sy} ad={ad} />
  </>;
}

function Bloklar({ l }: { l: readonly Blok[] }) {
  const tablolar = l.filter((b) => b.t === "tablo");
  return <>{l.map((b, i) => {
    switch (b.t) {
      case "p": return <p key={i}><Ic l={b.ic} /></p>;
      case "h": return <p key={i} className={stil.mdBaslik} data-duzey={b.d}><Ic l={b.ic} /></p>;
      case "cizgi": return <hr key={i} className={stil.mdCizgi} />;
      case "kod": return <pre key={i} className={stil.mdKod}><code>{b.m}</code></pre>;
      case "alinti": return <blockquote key={i} className={stil.mdAlinti}><Bloklar l={b.bloklar} /></blockquote>;
      case "tablo": return <MdTablo key={i} b={b} ad={tablolar.length > 1 ? `Tablo ${tablolar.indexOf(b) + 1}` : "Tablo"} />;
      case "ul": case "ol": {
        const ic = b.maddeler.map((m, j) => <li key={j}><Ic l={m.ic} />{m.alt && <Bloklar l={[m.alt]} />}</li>);
        return b.t === "ol" ? <ol key={i} className={stil.madde} start={b.bas}>{ic}</ol> : <ul key={i} className={stil.madde}>{ic}</ul>;
      }
    }
  })}</>;
}

/** başlıklar sohbet içinde paragraf görünümünde (sayfanın başlık sırası bozulmasın — erişilebilirlik) */
export function Markdown({ metin }: { metin: string }) {
  return <Bloklar l={markdown(metin)} />;
}
