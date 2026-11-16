# Backlog

## Aktueller Stand

Seite ist fertig und als Repo angelegt. GitHub Pages ist aktiv (https://weissiefficiency.github.io/Poekelmon-Weiss-Schwarz/) und speichert live in Firebase (Projekt `soul-link-weiss-schwarz`, Firestore in Frankfurt, Regeln aus `firestore.rules` veröffentlicht). Offen ist nur noch, das Backup aus dem claude.ai-Dashboard einzuspielen (T-003) und dann den Link zu verschicken (T-004).

**Nächster Schritt:** T-003.

## Aufgaben

| ID | Aufgabe | Prio | Status | Meilenstein |
|---|---|---|---|---|
| T-001 | Firebase-Projekt anlegen, Regeln aus `firestore.rules` setzen, Werte in `config.js` | hoch | erledigt | M1 |
| T-002 | GitHub Pages aktivieren (Settings > Pages > main, root) | hoch | erledigt | M1 |
| T-003 | Backup aus claude.ai kopieren und auf der GitHub-Seite einspielen | hoch | offen | M1 |
| T-004 | Link an Hagenau und Zinni schicken, gemeinsam testen | mittel | offen | M1 |
| T-005 | Dupe-Hinweis, wenn eine Art im Run schon gefangen wurde (falls ihr die Regel spielt) | niedrig | Idee | M2 |
| T-006 | Automatischer Smoke-Test (Playwright) für Eintragen, Tod, Neuer Run | niedrig | Idee | M2 |
| T-007 | Regelmäßiges Backup erinnern (z. B. Hinweis, wenn letzte Sicherung alt ist) | niedrig | Idee | M2 |

## Erledigt

- Routen, Fänge, Tode, Friedhof, Gesamtliste
- Run-Zähler (Run, Death, Encounter) mit Startwerten aus der Google-Tabelle
- Level-Caps, Auswertung, Backup, Pokémon-Suche
- Ein Spitzname pro Route
