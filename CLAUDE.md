# CLAUDE.md

Soul-Link-Dashboard für Pokémon Schwarz/Weiß (deutsch) mit drei Spielern (Hagenau, Weissi, Zinni). Statische Seite ohne Build-Schritt, läuft auf GitHub Pages, speichert live in Firebase Firestore.

**Einstieg in jede Session:** `docs/BACKLOG.md`, Abschnitt „Aktueller Stand“.

## Befehle

- Lokal starten: `python3 -m http.server 8000`, dann http://localhost:8000
- Syntax prüfen: `node --check js/app.js && node --check js/pokemon.js`
- Deploy: Push auf `main`, GitHub Pages veröffentlicht automatisch.

## Dateien

- `index.html`: Markup aller Bereiche
- `css/style.css`: Design (Pastell-Sticker-Look, Tokens in `:root`)
- `js/app.js`: gesamte Logik (Speicher-Adapter, Rendering, Zähler, Suche)
- `js/pokemon.js`: 649 deutsche Pokémon-Namen, Index + 1 = Dex-Nummer
- `config.js`: Firebase-Werte; Platzhalter `DEIN-PROJEKT` = lokaler Modus
- `firestore.rules`: Firestore-Regeln, werden in der Firebase-Konsole eingefügt (nicht automatisch)

## Konventionen

- Kein Framework, kein Build, keine npm-Abhängigkeiten. Firebase compat SDK wird nur geladen, wenn `config.js` ausgefüllt ist.
- UI-Texte und Doku auf Deutsch, Spielbegriffe mit deutschen Namen (Orte, Pokémon, Trainer). Code-Bezeichner englisch.
- Datenmodell siehe `docs/ARCHITEKTUR.md`. Neue Felder immer mit Standardwert in `defMeta()` bzw. beim Anlegen von Routen ergänzen, alte Daten müssen weiter laden (z. B. `nickOf()` liest Spitznamen aus Altdaten). Neue Felder außerdem in `firestore.rules` erlauben und die Regeln in der Firebase-Konsole neu veröffentlichen, sonst lehnt Firestore jedes Speichern des Dokuments ab.
- Schreibzugriffe nur über `patchRoute()` / `patchMeta()` (gebündelt, 450 ms Verzögerung), nie direkt aus Render-Funktionen.
- Schreibrechte im Firebase-Modus: Google-Anmeldung, Admin-UID in `config.js` und `firestore.rules`, Freigaben in `access/main` (siehe `docs/ARCHITEKTUR.md`). Admin-only-Bereiche über `applyRole()` steuern.
- Die gleiche Seite läuft auch als claude.ai-Artifact (Speicher-Adapter `makeArtifactStore`). Nichts einbauen, das nur mit Firebase funktioniert, ohne den Artifact- und Lokal-Modus zu bedenken.

## Nach Änderungen

Backlog und CHANGELOG aktualisieren; Architektur nur bei Struktur- oder Datenmodelländerungen.
