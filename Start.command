#!/bin/bash
# Startet die Kursauswahl. Holt vorher die neueste Version von GitHub.
# Daten (Ordner data) und Einstellungen (.env) werden dabei nie verändert.
cd "$(dirname "$0")" || exit 1

REPO="another-human-being/Kursauswahl"
BRANCH="main"

update() {
  [ -f .no-update ] && { echo "  Automatische Updates sind aus (.no-update)."; return; }
  command -v curl >/dev/null 2>&1 || return
  local TMP SRC OLD NEW
  TMP=$(mktemp -d) || return
  if curl -fsSL --max-time 20 "https://codeload.github.com/$REPO/tar.gz/refs/heads/$BRANCH" -o "$TMP/src.tgz" 2>/dev/null \
     && tar -xzf "$TMP/src.tgz" -C "$TMP" 2>/dev/null; then
    SRC=$(find "$TMP" -mindepth 1 -maxdepth 1 -type d | head -1)
    if [ -f "$SRC/server.js" ] && [ -f "$SRC/public/index.html" ] && node --check "$SRC/server.js" 2>/dev/null; then
      OLD=$(cat version.txt 2>/dev/null)
      NEW=$(cat "$SRC/version.txt" 2>/dev/null)
      [ -f "$SRC/Start.command" ] && mv "$SRC/Start.command" "$TMP/Start.command"
      rm -rf "$SRC/data" "$SRC/.env"
      if cp -R "$SRC"/. ./; then
        if [ -f "$TMP/Start.command" ] && ! cmp -s "$TMP/Start.command" Start.command; then
          cp "$TMP/Start.command" .Start.new && chmod +x .Start.new && mv .Start.new Start.command
        fi
        if [ "$OLD" != "$NEW" ]; then echo "  Aktualisiert auf Version $NEW"; else echo "  Version $NEW, aktuell"; fi
      else
        echo "  Update konnte nicht kopiert werden, starte die vorhandene Version."
      fi
    else
      echo "  Update unvollständig, starte die vorhandene Version."
    fi
  else
    echo "  GitHub nicht erreichbar, starte die vorhandene Version."
  fi
  rm -rf "$TMP"
}

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  Node.js fehlt. Bitte von https://nodejs.org die LTS-Version installieren"
  echo "  und danach Start.command erneut öffnen."
  echo ""
  read -r -p "  Enter zum Schließen"
  exit 1
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "  Node.js $NODE_MAJOR ist zu alt, mindestens Version 18 nötig (https://nodejs.org)."
  read -r -p "  Enter zum Schließen"
  exit 1
fi

echo ""
update

if [ ! -f .env ]; then
  echo ""
  read -r -s -p "  Mistral-API-Key einfügen (Enter = ohne KI starten): " KEY
  echo ""
  printf "MISTRAL_API_KEY=%s\nMISTRAL_MODEL=mistral-small-latest\nPORT=4321\n" "$KEY" > .env
  chmod 600 .env
fi

PORT=$(grep -E '^PORT=' .env | cut -d= -f2)
PORT=${PORT:-4321}
(sleep 1 && open "http://localhost:$PORT") &
exec node server.js
