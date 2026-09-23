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

/* tema ilk boyamadan ÖNCE kurulur (yanıp sönme yok): kayıtlı tercih, yoksa cihazın teması. Maketle aynı anahtar. */
const TEMA_BETIGI = `(function(){var d=document.documentElement,t;try{t=localStorage.getItem("probata-tema")}catch(e){}
d.setAttribute("data-tema",t==="acik"||t==="koyu"?t:(matchMedia("(prefers-color-scheme: dark)").matches?"koyu":"acik"))})()`;

export default function KokDuzen({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_BETIGI }} />
      </head>
      <body>
        <Kabuk>{children}</Kabuk>
      </body>
    </html>
  );
}
