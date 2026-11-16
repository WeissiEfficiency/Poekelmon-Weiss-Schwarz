# Poekelmon Weiss Schwarz – Soul Link

Dashboard für eine Pokémon-Soul-Link-Challenge in **Pokémon Schwarz/Weiß (deutsche Version)** zu dritt: Hagenau, Weissi und Zinni. Es zeigt Routen und Fänge, wer welchen Encounter getötet hat, Tode, Run-Zähler, Level-Caps und eine Auswertung über alle Runs. Alle drei sehen live denselben Stand.

**Live:** `https://weissiefficiency.github.io/Poekelmon-Weiss-Schwarz/` (sobald GitHub Pages aktiv ist)

Hagenau und Zinni brauchen keinen Account, sie öffnen nur den Link. Wer den Link hat, kann eintragen.

## Funktionen

- Routen von Avenitia bis zur Höhle der Prüfung, eigene Routen ergänzbar, Fossil als Extra-Encounter
- Ein Spitzname pro Route (gilt für alle drei Pokémon des Links), Pokémon pro Spieler optional mit Suche über alle 649 deutschen Namen (tippfehlertolerant, auch per Dex-Nummer)
- Zustand pro Spieler: lebt, tot, nicht gefangen; stirbt einer, sterben die verbundenen mit
- Beim toten Link: wer den Encounter getötet hat, bei wem das Pokémon im Kampf gefallen ist (Death), Ursache
- Run-Nummer und Gesamtstand Run, Death, Encounter pro Spieler (zählt automatisch, von Hand änderbar)
- Level-Caps aller Arenaleiter, Top Vier, N und G-Cis zum Abhaken
- Gesamtliste, Friedhof, Auswertung mit Run-Verlauf
- Backup als Text oder Datei, Umzug zwischen Speicherorten

## Lokal starten

```bash
python3 -m http.server 8000
```

Dann <http://localhost:8000> öffnen. Ohne ausgefüllte `config.js` speichert die Seite nur im Browser (oben rechts steht dann „Nur auf diesem Gerät gespeichert“).

## Einrichtung (einmalig)

### 1. Firebase (Datenbank)

1. <https://console.firebase.google.com> > **Projekt erstellen**, Name z. B. `soullink`, Google Analytics aus.
2. **Erstellen > Firestore Database > Datenbank erstellen**, Standort `eur3 (europe-west)`, **Produktionsmodus**.
3. Tab **Regeln**: Inhalt von `firestore.rules` einfügen, **Veröffentlichen**.
4. **Zahnrad > Projekteinstellungen > Deine Apps > `</>`** (Web-App), Name eingeben, **App registrieren** (ohne Hosting).
5. Die Werte aus `firebaseConfig` in `config.js` eintragen und committen.

### 2. GitHub Pages

Im Repo **Settings > Pages**: Source **Deploy from a branch**, Branch **main**, Ordner **/ (root)**, **Save**. Nach 1 bis 2 Minuten ist die Seite unter der Adresse oben erreichbar.

### 3. Daten aus claude.ai umziehen

Im alten Dashboard auf claude.ai ganz unten **Daten sichern und umziehen > Backup kopieren**. Auf der GitHub-Seite im selben Bereich einfügen und **Backup einspielen** (zweimal klicken zum Bestätigen).

## Gut zu wissen

- Die Firebase-Werte in `config.js` sind öffentlich, das ist bei Firebase-Webseiten normal. Die Regeln erlauben nur die drei Sammlungen `meta`, `routes` und `history`.
- Ab und zu **Als Datei speichern** im Backup-Bereich, falls jemand aus Versehen etwas löscht.
- Der kostenlose Firebase-Tarif (Spark) reicht für drei Spieler.

Mehr zum Aufbau: [docs/ARCHITEKTUR.md](docs/ARCHITEKTUR.md). Was als Nächstes kommt: [docs/BACKLOG.md](docs/BACKLOG.md).
