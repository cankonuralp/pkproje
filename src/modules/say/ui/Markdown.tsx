/* S.A.Y cevabının çizimi (550): ../markdown.ts ağacı React öğeleriyle — HTML işlenmez (metin kaçışlı), bağlantı yalnız http(s), yeni sekmede. */
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

function Bloklar({ l }: { l: readonly Blok[] }) {
  return <>{l.map((b, i) => {
    switch (b.t) {
      case "p": return <p key={i}><Ic l={b.ic} /></p>;
      case "h": return <p key={i} className={stil.mdBaslik} data-duzey={b.d}><Ic l={b.ic} /></p>;
      case "cizgi": return <hr key={i} className={stil.mdCizgi} />;
      case "kod": return <pre key={i} className={stil.mdKod}><code>{b.m}</code></pre>;
      case "alinti": return <blockquote key={i} className={stil.mdAlinti}><Bloklar l={b.bloklar} /></blockquote>;
      case "tablo": return (
        <div key={i} className={stil.mdTabloKap} tabIndex={0} role="region" aria-label="Tablo">
          <table className={stil.mdTablo}>
            <thead><tr>{b.bas.map((h, j) => <th key={j} scope="col"><Ic l={h} /></th>)}</tr></thead>
            <tbody>{b.satirlar.map((s, j) => <tr key={j}>{s.map((h, k) => <td key={k}><Ic l={h} /></td>)}</tr>)}</tbody>
          </table>
        </div>
      );
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
