# Poekelmon Weiss Schwarz – Soul Link

Dashboard für eine Pokémon-Soul-Link-Challenge in **Pokémon Schwarz/Weiß (deutsche Version)** zu dritt: . Es zeigt Routen und Fänge, wer welchen Encounter getötet hat, Tode, Run-Zähler, Level-Caps und eine Auswertung über alle Runs. Alle drei sehen live denselben Stand.

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
- Design Pokédex für alle; der Admin kann zusätzlich Pastell oder Lovecraft wählen (gemerkt pro Gerät)

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

### 1b. Google-Anmeldung (Schreibrechte)

1. **Authentication > Anmeldemethode > Google** aktivieren, Support-E-Mail wählen.
2. **Authentication > Einstellungen > Autorisierte Domains**: `weissiefficiency.github.io` hinzufügen.
3. Auf der Seite einmal als Admin anmelden. Die Firebase-UID (Konsole: **Authentication > Nutzer**) in `config.js` (`adminUid`) und in `firestore.rules` (`isAdmin`) eintragen, Regeln neu veröffentlichen.
4. Im Dashboard unter **Schreibrechte** die Google-E-Mails der Mitspieler eintragen und speichern.

### 2. GitHub Pages

Im Repo **Settings > Pages**: Source **Deploy from a branch**, Branch **main**, Ordner **/ (root)**, **Save**. Nach 1 bis 2 Minuten ist die Seite unter der Adresse oben erreichbar.

### 3. Daten aus claude.ai umziehen

Im alten Dashboard auf claude.ai ganz unten **Daten sichern und umziehen > Backup kopieren**. Auf der GitHub-Seite im selben Bereich einfügen und **Backup einspielen** (zweimal klicken zum Bestätigen).

## Gut zu wissen

- Die Firebase-Werte und die Admin-UID in `config.js` sind öffentlich, das ist bei Firebase-Webseiten normal.
- Lesen kann jeder mit dem Link. Schreiben kann nur, wer mit Google angemeldet ist und freigeschaltet ist (Admin oder E-Mail unter **Schreibrechte**). Backup und Schreibrechte sieht nur der Admin. Die E-Mails stehen in Firestore (`access/main`), nicht im Repo.
- Die Regeln in `firestore.rules` lassen nur Daten in der Form des Dashboards zu (bekannte Felder, begrenzte Textlängen). Run-Daten und Run-Verlauf lassen sich nicht löschen, einzelne Routen schon. Neue Felder müssen auch in `firestore.rules` ergänzt und dort neu veröffentlicht werden, sonst schlägt Speichern fehl.
- Kosten: Das Projekt läuft im kostenlosen Spark-Tarif ohne Zahlungsart. Beim Tageslimit stoppt das Speichern bis zum nächsten Tag, es entstehen keine Kosten. Nicht auf den Blaze-Tarif wechseln.
- Automatisches Backup: Die GitHub Action **Backup** (`.github/workflows/backup.yml`) läuft täglich um 03:17 UTC, liest die Daten mit `tools/backup.py` und committet sie nach `backups/` (`latest.json` plus eine Datei pro Tag mit Änderungen). Von Hand starten: **Actions > Backup > Run workflow**, lokal: `python3 tools/backup.py`. Einspielen wie jedes Backup über **Backup einspielen** (Inhalt von `backups/latest.json` einfügen oder Datei wählen). Die Freischaltliste ist nicht im Backup.
- Die Backups liegen öffentlich im Repo (nur Spielernamen, Pokémon, Routen, Zähler). Die Seite erinnert den Admin nur noch, wenn sich Daten geändert haben und seit 7 Tagen kein Backup (automatisch oder von Hand) entstanden ist.
- GitHub pausiert zeitgesteuerte Actions in Repos, in denen 60 Tage lang nichts passiert. Dann kommt eine Mail, und die Action lässt sich unter **Actions** wieder einschalten.
- Der kostenlose Firebase-Tarif (Spark) reicht für drei Spieler.

Mehr zum Aufbau: [docs/ARCHITEKTUR.md](docs/ARCHITEKTUR.md). Was als Nächstes kommt: [docs/BACKLOG.md](docs/BACKLOG.md).
