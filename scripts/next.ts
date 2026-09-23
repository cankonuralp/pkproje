/* Next.js'i BU PROJENİN kurallarıyla çalıştıran tek yol (npm betikleri buradan geçer):
   · NEXT_TELEMETRY_DISABLED=1 — anonim kullanım bildirimi kapalı; üçüncü tarafa veri gitmez (anayasa 5.2).
   · --webpack — reisim'in Windows makinesinde Uygulama Denetimi ilkesi Next'in yerel derleyicisini
     (next-swc.win32-x64-msvc.node) engelliyor; WebAssembly derleyiciyle Turbopack çalışmıyor (2026-09-23 ölçüldü).
     Yerel ve CI aynı paketleyiciyle derlensin diye her yerde webpack. */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const NEXT = createRequire(import.meta.url).resolve("next/dist/bin/next");

export function nextCalistir(komut: "dev" | "build" | "typegen", ek: Record<string, string> = {}, argumanlar: string[] = []): Promise<number> {
  return new Promise((coz) => {
    const cocuk = spawn(process.execPath, [NEXT, komut, "--webpack", ...argumanlar], {
      stdio: "inherit",
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", ...ek },
    });
    cocuk.on("exit", (kod) => coz(kod ?? 1));
  });
}

// doğrudan çağrılırsa: node scripts/next.ts build
if (import.meta.main) {
  const komut = process.argv[2];
  if (komut !== "dev" && komut !== "build" && komut !== "typegen") {
    console.error("Kullanım: node scripts/next.ts dev|build|typegen");
    process.exit(2);
  }
  process.exit(await nextCalistir(komut, {}, process.argv.slice(3)));
}
