import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Kabuk } from "../components/kabuk/Kabuk";
import "../styles/yazi.css";
import "../styles/tokens.css";
import "../styles/temel.css";

export const metadata: Metadata = {
  title: { default: "probata", template: "%s · probata" },
  description: "Periyodik Kontrol Yönetimi",
  // firma paneli arama motorlarına açılmaz
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F3EE" },
    { media: "(prefers-color-scheme: dark)", color: "#0F2A3D" },
  ],
};

/* tema ve yan menü daraltması ilk boyamadan ÖNCE kurulur (yanıp sönme yok): kayıtlı tercih, yoksa cihazın teması;
   menü yalnız "dar" kayıtlıysa daralır (kural yalnız geniş bantta etkili, Kabuk.module.css). Maketle aynı anahtarlar. */
const ILK_BOYAMA_BETIGI = `(function(){var d=document.documentElement,t,m;try{t=localStorage.getItem("probata-tema");m=localStorage.getItem("probata-menu")}catch(e){}
d.setAttribute("data-tema",t==="acik"||t==="koyu"?t:(matchMedia("(prefers-color-scheme: dark)").matches?"koyu":"acik"));if(m==="dar")d.setAttribute("data-menu","dar")})()`;

export default function KokDuzen({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ILK_BOYAMA_BETIGI }} />
      </head>
      <body>
        <Kabuk>{children}</Kabuk>
      </body>
    </html>
  );
}
