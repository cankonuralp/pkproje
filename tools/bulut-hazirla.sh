#!/usr/bin/env bash
# Bulut oturumu hazırlığı (MAKET-PLANI.md §5). YALNIZ bulut VM'inde koşar (Ubuntu 24.04, root, CLAUDE_CODE_REMOTE=true);
# yerel makinede koşmaz. Kurar: Node 24 → /opt/node24 (sağlama toplamıyla) · ölçüm için başsız Chrome for Testing +
# puppeteer-core → /opt/olcum (depoya bağımlılık olarak GİRMEZ) · depo bağımlılıkları (npm ci). İkinci kez koşunca kurulu olanı atlar.
# Yazıldığı gün (2026-09-24) Windows'ta koşturulamadı: ilk bulut oturumunda çıktısı okunarak doğrulanır.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  echo "Bu betik yalnız bulut oturumunda koşar (CLAUDE_CODE_REMOTE=true değil)." >&2
  exit 1
fi
KOK="$(git rev-parse --show-toplevel)"

# 1) Node 24 (package.json engines >=24; bulutta hazır gelen en yeni sürüm 22)
if [ ! -x /opt/node24/bin/node ]; then
  SURUM="$(curl -fsSL https://nodejs.org/dist/index.json \
    | python3 -c 'import sys, json; print(next(r["version"] for r in json.load(sys.stdin) if r["version"].startswith("v24.")))')"
  PAKET="node-${SURUM}-linux-x64.tar.xz"
  curl -fsSL "https://nodejs.org/dist/${SURUM}/${PAKET}" -o "/tmp/${PAKET}"
  (cd /tmp && curl -fsSL "https://nodejs.org/dist/${SURUM}/SHASUMS256.txt" | grep " ${PAKET}\$" | sha256sum -c -)
  mkdir -p /opt/node24
  tar -xJf "/tmp/${PAKET}" -C /opt/node24 --strip-components=1
fi
for arac in node npm npx; do ln -sf "/opt/node24/bin/${arac}" "/usr/local/bin/${arac}"; done
export PATH="/opt/node24/bin:${PATH}"
echo "node $(node -v) · npm $(npm -v)"

# 2) Ölçüm: puppeteer-core + başsız Chrome for Testing (storage.googleapis.com — bulutun "Trusted" listesinde)
mkdir -p /opt/olcum
if [ ! -d /opt/olcum/node_modules/puppeteer-core ]; then
  npm install --prefix /opt/olcum --no-audit --no-fund puppeteer-core
fi
if ! find /opt/olcum -type f -name chrome-headless-shell | grep -q .; then
  (cd /opt/olcum && npx -y @puppeteer/browsers install chrome-headless-shell@stable --path /opt/olcum --install-deps)
fi
CHROME="$(find /opt/olcum -type f -name chrome-headless-shell | head -1)"
echo "chrome: ${CHROME} · $("${CHROME}" --version 2>/dev/null || echo 'SÜRÜM OKUNAMADI')"
echo "puppeteer-core $(node -p "require('/opt/olcum/node_modules/puppeteer-core/package.json').version")"

# 3) Depo bağımlılıkları (CI ile aynı komut)
(cd "${KOK}" && npm ci --no-audit --no-fund)

echo "HAZIR. Komutları PATH=/opt/node24/bin:\$PATH önekiyle koş (kabuk durumu çağrılar arasında korunmaz)."
