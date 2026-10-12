# Kursauswahl

Bewerbungen für die Start-up Challenge (und andere Kurse des Gründungszentrums) auswählen und Zu-/Absagen vorbereiten. Läuft lokal auf einem Mac. Bewerberdaten verlassen den Rechner nur, um sie von Mistral auslesen zu lassen.

## Einmalig einrichten

1. **Node.js** installieren (LTS-Version von https://nodejs.org), falls noch nicht vorhanden.
2. Ordner an einen festen Ort legen, z. B. `Dokumente/Kursauswahl`.
3. Im Terminal installieren (lädt alles nach `~/Dokumente/Kursauswahl`):
   ```
   mkdir -p ~/Dokumente/Kursauswahl && curl -fsSL https://raw.githubusercontent.com/another-human-being/Kursauswahl/main/Start.command -o ~/Dokumente/Kursauswahl/Start.command && chmod +x ~/Dokumente/Kursauswahl/Start.command
   ```
   Danach **Start.command** per Doppelklick starten. Es lädt beim ersten Start den Rest herunter.
4. Beim ersten Start nach dem **Mistral-API-Key** gefragt werden und ihn einfügen. Er wird in `.env` gespeichert.
5. Beim ersten Anlegen eines Mail-Entwurfs fragt macOS, ob das Terminal **Mail steuern** darf. Mit *OK* bestätigen.

## Ablauf

- **/import**: In Apple Mail den Bewerbungsordner auswählen, *Postfach › Postfach exportieren …* und den exportierten Ordner ins Feld ziehen. Mistral liest Name, Studiengang, Abschluss, Semester und Motivation aus. Rot markierte Einträge kurz gegen die Originalmail prüfen.
- **/auswahl**: Im Meeting zuerst den *Durchgang* (Pfeiltasten: → ja, ← nein, ↓ später, Z rückgängig), danach auf dem *Board* die „später"-Fälle entscheiden und die Warteliste sortieren.
- **/mails**: Pro Gruppe „Entwürfe anlegen". Die Mails landen als Entwürfe in Apple Mail und werden dort geprüft und abgeschickt. Danach „alle versendet" markieren.
- **/erste-sitzung**: Am Mittwoch Anwesenheit abhaken, „Nachrücken lassen", dann unter /mails die Nachrücker-Entwürfe anlegen.
- **/auswertung**: Übersicht nach Abschluss, Studiengang, Semester, Motivationslänge und Geschlecht.
- **/einstellungen**: Kurs, Plätze, Termine, Absender, Mailtexte, Export und Löschen.

## Updates

Start.command holt bei jedem Start die neueste Version von GitHub. Nichts herunterladen, nichts ersetzen. Der Ordner `data` und die Datei `.env` werden dabei nie angefasst. Ohne Internet startet die vorhandene Version. Wer Updates abschalten will, legt im Ordner eine leere Datei `.no-update` an. Die aktuelle Version steht unter /einstellungen.

## Daten

- Alles liegt in `data/state.json`, dazu tägliche Sicherungen der letzten 14 Tage in `data/backups/`.
- Der Server ist nur auf diesem Mac erreichbar (`127.0.0.1`), nicht im Netzwerk.
- Nach Kursende unter /einstellungen **Alle Daten löschen**.
- Geschlecht wird aus dem Vornamen geschätzt und kann pro Person korrigiert werden.
- Doppelte Schreibweisen von Studiengängen unter /einstellungen zusammenführen; die Regel gilt auch für spätere Importe.
- Ein erneuter Import derselben Mails legt keine Duplikate an, lädt aber fehlende Originaltexte nach.

## Ohne Doppelklick starten

```
cd Pfad/zum/Ordner
npm start
```
Dann http://localhost:4321 öffnen.
