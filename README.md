# Kursauswahl

Bewerbungen für die Start-up Challenge (und andere Kurse des Gründungszentrums) im Team auswählen und Zu-/Absagen vorbereiten. Web-App für mehrere Laptops gleichzeitig, Änderungen erscheinen bei allen nach wenigen Sekunden.

## Zugang

Es gibt einen **Teamlink** (`https://…/#k=…`). Wer ihn öffnet, ist drin; der Browser merkt sich den Zugang. Unter **/einstellungen › Teamlink** lässt er sich kopieren oder durch einen neuen ersetzen. Der alte ist dann sofort ungültig, auch im Mail-Helfer.

## Ablauf

- **/import**: In Apple Mail den Bewerbungsordner auswählen, *Postfach › Postfach exportieren …* und den exportierten Ordner ins Feld ziehen. Mistral liest Name, Studiengang, Abschluss, Semester und Motivation aus. Rot markierte Einträge gegen die Originalmail prüfen.
- **/auswahl**: Zuerst der *Durchgang* (→ ja, ← nein, ↓ später, Z rückgängig), dann auf dem *Board* die „später"-Fälle entscheiden und die Warteliste sortieren.
- **Fotos**: In der Detailansicht oder direkt auf der Karte im Durchgang: Bild hineinziehen, mit ⌘V einfügen (in LinkedIn oder Google per Rechtsklick › Bild kopieren) oder eine Bild-Adresse eintragen. Fotos werden auf 640 px verkleinert gespeichert.
- **/mails**: Pro Gruppe „Entwürfe anlegen". Der Mail-Helfer legt sie in Apple Mail an, dort prüfen und senden, danach „alle versendet".
- **/erste-sitzung**: Anwesenheit abhaken, „Nachrücken lassen", dann unter /mails die Nachrücker-Entwürfe anlegen.
- **/auswertung**: Übersicht nach Abschluss, Studiengang, Semester, Motivationslänge und Geschlecht (aus Vornamen geschätzt).
- **/einstellungen**: Kurs, Plätze, Termine, Absender, Mailtexte, Studiengänge zusammenführen, Teamlink, Export, Sicherung einspielen, Löschen.

## Mail-Helfer (nur auf dem Mac, der die Mails verschickt)

Einmalig im Terminal:

```
mkdir -p ~/Documents/Mail-Helfer && cd ~/Documents/Mail-Helfer && for f in Mail-Helfer.command helfer.js mail-draft.applescript; do curl -fsSL https://raw.githubusercontent.com/another-human-being/Kursauswahl/main/mail-helfer/$f -o $f; done && chmod +x Mail-Helfer.command
```

Dann `Mail-Helfer.command` per Doppelklick starten, beim ersten Mal den Teamlink einfügen. Beim ersten Entwurf fragt macOS, ob das Terminal Mail steuern darf. Der Helfer aktualisiert sich bei jedem Start selbst.

## Technik

- `public/index.html`: die App (ohne Build-Schritt).
- `api/*.js`: Vercel-Funktionen. Sie reichen den Team-Token an die Datenbank weiter; die Datenbank (Supabase, Frankfurt) prüft jeden Zugriff selbst per Row Level Security.
- Mistral-Key liegt nur als Umgebungsvariable `MISTRAL_API_KEY` bei Vercel.
- Lokal testen: `npm run dev`, dann `http://localhost:4400/#k=<token>`.

## Datenschutz

Bewerberdaten und Fotos liegen bei Supabase (EU, Frankfurt), die App läuft bei Vercel. Vor dem Einsatz mit echten Daten mit der Datenschutzstelle klären: Auftragsverarbeitung (AV-Vertrag) und die Information der Bewerber:innen über Fotos aus fremden Quellen (DSGVO Art. 14). Nach Kursende unter /einstellungen **Alle Daten löschen**.
