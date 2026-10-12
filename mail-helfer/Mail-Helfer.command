#!/bin/bash
# Startet den Mail-Helfer der Kursauswahl. Per Doppelklick ausführen.
cd "$(dirname "$0")" || exit 1
REPO="another-human-being/Kursauswahl"

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  Node.js fehlt. Bitte von https://nodejs.org die LTS-Version installieren und erneut starten."
  read -r -p "  Enter zum Schließen"; exit 1
fi

# Neueste Version holen (ohne Internet läuft die vorhandene)
for f in helfer.js mail-draft.applescript; do
  curl -fsSL --max-time 15 "https://raw.githubusercontent.com/$REPO/main/mail-helfer/$f" -o ".$f.new" 2>/dev/null \
    && [ -s ".$f.new" ] && mv ".$f.new" "$f" || rm -f ".$f.new"
done

if [ ! -f .env ]; then
  echo ""
  echo "  Teamlink einfügen (zu finden in der Kursauswahl unter /einstellungen) und Enter drücken:"
  read -r LINK
  URL=$(printf "%s" "$LINK" | sed -E 's|^(https://[^/#]+).*|\1|')
  TOKEN=$(printf "%s" "$LINK" | sed -nE 's|.*#k=([A-Za-z0-9_-]+).*|\1|p')
  if [ -z "$TOKEN" ] || [ "${URL#https://}" = "$URL" ]; then
    echo "  Das sieht nicht wie ein Teamlink aus (https://…/#k=…)."; read -r -p "  Enter zum Schließen"; exit 1
  fi
  umask 077
  printf "KURSAUSWAHL_URL=%s\nTEAM_TOKEN=%s\n" "$URL" "$TOKEN" > .env
fi

exec node helfer.js
