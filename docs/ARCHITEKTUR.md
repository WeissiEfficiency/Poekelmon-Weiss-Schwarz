# Architektur

## Überblick

Statische Seite ohne Build. `index.html` lädt `config.js`, `js/pokemon.js` und `js/app.js`. Beim Start wählt `app.js` einen Speicher-Adapter:

| Modus | Bedingung | Speicher |
|---|---|---|
| Firebase | `config.js` enthält echte Werte (nicht `DEIN-PROJEKT`) | Firestore, live für alle |
| Artifact | Seite läuft auf claude.ai (`window.claude` vorhanden) | Artifact-Datenbank |
| Lokal | sonst, oder wenn Firebase nicht lädt | `localStorage` dieses Browsers |

Alle Adapter bieten dieselben Funktionen: `watchDoc`, `watchCol`, `merge`, `set`, `del`. Der Rest der App kennt den Modus nicht.

## Datenmodell

Drei Sammlungen, Spieler-Schlüssel `p0` (Hagenau), `p1` (Weissi), `p2` (Zinni).

**`meta/main`**
```
players: { p0: { name } , ... }
run:     { no, status: "run"|"lost"|"won", enders: { p0: bool, ... }, where, cause }
tally:   { p0: { run, death, enc }, ... }      // Basiswerte abgeschlossener Runs
caps:    { beaten: { g1: bool, ... }, lv: { g1: Zahl, ... } }   // lv = manuelle Abweichung
backupAt: ISO-Zeitpunkt der letzten Sicherung oder ""      // gesetzt von „Backup kopieren“ / „Als Datei speichern“
```

**`routes/<id>`** (eine pro Route)
```
order, name, nick, extra?, hint?, custom?
cells:  { p0: { sp, st: ""|"alive"|"dead"|"miss" }, ... }   // sp = Pokémon, optional
killer: Spielerindex 0–2 oder -1                              // Encounter getötet von
deaths: { p0: bool, ... }                                     // Tod bei
cause
```
Ältere Routen haben den Spitznamen in `cells.pX.nick`; `nickOf()` liest ihn als Rückfall.

**`history/<id>`** (eine pro abgeschlossenem Run, angelegt bei „Neuer Run starten“)
```
no, status, enders, where, cause, endedAt, badges, lastCap, links,
deadLinks: [{ route, nick, mons[3], killer, deaths, cause }],
perPlayer: { p0: { run, death, enc }, ... }
```

## Designs (Themes)

Drei Designs mit denselben Bausteinen: `pastell` (Standard), `tsundere`, `pokedex`. Umschalter oben rechts (`#themeSeg`), gesetzt als `<html data-theme="…">`, gemerkt pro Gerät in `localStorage` (`soullink-theme`), nicht in der Datenbank. Ein kleines Skript im `<head>` setzt das Attribut vor dem ersten Zeichnen.
- **Farben, Schriften, Formen**: nur über CSS-Variablen in `:root` (z. B. `--ink`, `--surface`, `--hdr`, `--mark`) und je Theme einen Block `:root[data-theme=…]` am Ende von `css/style.css`. Keine festen Farben in Bausteinen, neue Flächen bekommen eine Variable.
- **Sprüche**: `THEME_TXT` in `js/app.js` (Untertitel, Run-Zeile, leerer Friedhof), abgerufen mit `tt(key)`.
- Neues Theme: Eintrag in `THEMES` und `THEME_TXT`, Knopf in `#themeSeg`, CSS-Block. Schriften im Google-Fonts-Link in `index.html` (werden nur geladen, wenn sie genutzt werden).

## Anmeldung und Rechte (nur Firebase-Modus)

Lesen ist offen. Zum Schreiben meldet man sich oben rechts mit Google an (`signInWithPopup`, Rückfall auf Redirect).
- **Admin**: UID steht in `config.js` (`adminUid`) und in `firestore.rules` (`isAdmin`). Sieht zusätzlich Backup, Backup-Erinnerung und „Schreibrechte“.
- **Freigeschaltet**: Google-E-Mail (kleingeschrieben, bestätigt) steht in `access/main.emails` (max. 10). Darf alles außer Backup.
- **Sonst**: nur lesen (`body.ro`, Eingabefelder deaktiviert).

Ob jemand freigeschaltet ist, erkennt die Seite daran, dass sie `access/main` lesen darf (`onAuth()`). Die Rolle setzt `setCanWrite()` / `applyRole()`; bei Wechsel werden die Routenzeilen neu gebaut. Im Artifact- und Lokal-Modus gibt es keine Anmeldung, dort bleibt alles wie zuvor.

**`access/main`**
```
emails: [ "name@gmail.com", ... ]   // nur Admin schreibt, lesbar für Freigeschaltete
```

## Firestore-Regeln

`firestore.rules` prüft bei jedem Schreiben zuerst `isWriter()` (siehe oben) und dann jedes Dokument gegen dieses Datenmodell: nur bekannte Felder, Textlängen begrenzt, Status-Werte aus festen Listen, Routen-IDs `r00`–`r99` oder `c…`, `meta` nur als `main`. `meta` und `history` sind nicht löschbar, `history` ist nach dem Anlegen unveränderlich (gleiche Daten erneut schreiben ist erlaubt, damit Backups eingespielt werden können). Ein neues Feld braucht deshalb drei Stellen: Standardwert in `defMeta()` bzw. beim Anlegen der Route, `firestore.rules`, und die Regeln neu in der Firebase-Konsole veröffentlichen.

## Backups

- **Von Hand**: „Backup kopieren“ / „Als Datei speichern“ (nur Admin) setzen `meta.backupAt`.
- **Automatisch**: GitHub Action `.github/workflows/backup.yml` ruft täglich `tools/backup.py` auf. Das Skript liest `meta`, `routes`, `history` über die Firestore-REST-API (Lesen ist offen, Projekt-ID und API-Key aus `config.js`), schreibt im Exportformat von `exportData()` (`app`, `version`, `exportedAt`, `meta`, `routes`, `history`, zusätzlich `source: "auto"`) nach `backups/latest.json` und `backups/JJJJ-MM-TT.json` und nur, wenn sich der Inhalt geändert hat. Leere Routen brechen ab, damit kein leeres Backup das letzte gute ersetzt.
- **Erinnerung**: `renderBk()` lädt `config.js autoBackupUrl` (raw.githubusercontent.com, unabhängig vom Pages-Build) und zeigt den Hinweis nur, wenn das jüngere der beiden Backups mindestens 7 Tage alt ist (`BK_DAYS`) und die aktuellen Daten vom automatischen Backup abweichen (`autoBkCurrent()`, Vergleich per `canon()` ohne `backupAt`).

## Zählung

Angezeigter Gesamtstand = `tally` (Basis) + Live-Werte des aktuellen Runs:
- Run +1 für jeden markierten Run-Ender, wenn der Status „Verloren“ ist
- Death +1 je toter Route, bei der der Spieler unter „Tod bei“ markiert ist
- Encounter +1 je toter Route, bei der der Spieler „Encounter getötet von“ ist

Manuelles Ändern schreibt `tally = gewünschter Wert − Live-Wert`. „Neuer Run starten“ addiert die Live-Werte in `tally`, legt `history` an und leert Routen und Caps.

## Schreiben

`patchRoute()` und `patchMeta()` sammeln Änderungen und schreiben nach 450 ms als Teil-Update (Merge). Während ein Schreibvorgang läuft, werden eingehende Snapshots für dieses Dokument ignoriert, damit Eingaben nicht überschrieben werden. Gleichzeitiges Bearbeiten verschiedener Felder durch mehrere Spieler funktioniert; beim selben Feld gewinnt der letzte.

## Pokémon-Suche

`search()` normalisiert Umlaute und Sonderzeichen und bewertet: exakter Treffer, Präfix, Teilstring, lautähnliche Schreibweise (ph/f, ck/k, z/s …), dann Tippfehler per Damerau-Levenshtein. Gen-5-Pokémon bekommen einen kleinen Bonus. Zahlen suchen nach Dex-Nummer.
