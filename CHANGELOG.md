# Changelog

## 2026-11-16

### Hinzugefügt
- Repo angelegt, Seite aufgeteilt in `index.html`, `css/style.css`, `js/app.js`, `js/pokemon.js`.
- Speicherung in Firebase Firestore für GitHub Pages (ohne Account für Mitspieler), lokaler Modus als Rückfall.
- Pokémon-Suche über alle 649 deutschen Namen, tippfehlertolerant und per Dex-Nummer.
- Level-Caps aller Arenaleiter, Top Vier, N und G-Cis mit änderbaren Werten; aktueller Cap im Run-Bereich.
- Auswertung: Gesamtstand pro Spieler, Run-Verlauf, häufigste Run-Enden, gefährlichste Routen.
- Backup kopieren, als Datei speichern und einspielen.
- GitHub Pages aktiviert (Branch `main`, Ordner `/`).
- Firebase-Projekt `soul-link-weiss-schwarz` angelegt (Firestore in Frankfurt, Regeln gesetzt), Werte in `config.js` eingetragen.

### Geändert
- Ein Spitzname pro Route statt pro Spieler; Pokémon pro Spieler ist optional. Alte Einträge werden übernommen.

## Vor dem Repo (claude.ai-Artifact)

- Dashboard mit Routen, Fängen, Toden, Friedhof, Gesamtliste, Run-Zähler (Run, Death, Encounter) und Pastell-Design.
