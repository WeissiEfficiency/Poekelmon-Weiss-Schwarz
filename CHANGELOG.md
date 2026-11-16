# Changelog

## 2026-11-16

### Hinzugefügt
- Routen erscheinen nacheinander: Sichtbar sind die bisher bearbeiteten Routen und die nächste offene. Sobald dort ein Spitzname, ein Pokémon oder ein Zustand eingetragen ist, kommt die nächste dazu. „Alle Routen zeigen“ und „Route hinzufügen“ stehen jetzt unter der Liste; Filter und Suche zeigen weiter alle passenden Routen.
- Designs: Pokédex (Rot/Weiß, Pixelschrift, Textboxen, KP-Balken) ist Standard für alle. Der Admin kann oben rechts zusätzlich Pastell (bisheriges Design) oder Lovecraft (Tiefsee-Nacht, Pergament, alte Druckschrift, blinzelndes Auge) wählen; die Wahl merkt sich sein Gerät.

### Behoben
- Handy: Der Run-Kasten war rechts abgeschnitten („Neuer Run starten“, „Gewonnen“).
- Automatisches Backup: GitHub Action sichert täglich mit `tools/backup.py` nach `backups/` (nur bei Änderungen). Die Backup-Erinnerung berücksichtigt das automatische Backup.
- Google-Anmeldung: Schreiben nur noch für den Admin und freigeschaltete Google-E-Mails, ohne Anmeldung nur lesen. Backup und neuer Bereich „Schreibrechte“ nur für den Admin.
- Backup-Erinnerung: Hinweis oben auf der Seite, wenn die letzte Sicherung fehlt oder älter als 7 Tage ist; Datum der letzten Sicherung im Backup-Bereich (neues Feld `meta.backupAt`).
- Strengere Firestore-Regeln: nur bekannte Felder und begrenzte Textlängen, Run-Daten und Run-Verlauf nicht löschbar.
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
