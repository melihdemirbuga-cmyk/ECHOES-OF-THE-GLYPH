# Version 1.2 — Schicksalsschrift und Kampfgruppen

Diese Version setzt die 13 Rückmeldungen zur Fassung 1.1 um.

1. **Fähigkeiten beim Loslassen:** Q, W, E, R und Leertaste halten, mit dem Mauszeiger zielen und beim Loslassen auslösen. Ein Linksklick wird nicht benötigt und feuert keine vorbereitete Fähigkeit ab. Escape oder ein neuer Rechtsklick verwirft die Vorbereitung. Ein schneller Tastendruck funktioniert ebenfalls. Anklickbare Fähigkeitsbilder bleiben als direkte Alternative verfügbar.
2. **Rautenförmige Minimap:** Die maßstäbliche Weltaufnahme wird isometrisch zur Raute mit einer mittigen oberen Spitze projiziert. Figuren, Gegner, Wege und Klickkoordinaten verwenden dieselbe Transformation. Die freie Fläche außerhalb der Raute erzeugt keinen Laufbefehl. Die große Tab-Karte bleibt eine beschriftete Draufsicht.
3. **Kleinere Leiste:** Standard ist „Klein“. Unter Einstellungen sind „Sehr klein“, „Klein“ und „Normal“ wählbar; die Wahl bleibt gespeichert.
4. **Kosteninformationen:** Gold- und Zutatenbilder an der Schmiede und Kauf-/Verkaufspreise beim Handel zeigen bei Mausberührung oder Tastaturfokus Art, Verwendung, Verbrauch und eigenen Bestand.
5. **Kampftasche:** Nur benutzbare Tränke und wechselbare Ausrüstung können auf 1–6 gelegt werden. Materialien und Questgegenstände sind nicht ziehbar; auch eine ungültige Zuweisung wird in der Spiellogik abgelehnt. Alte Materialbelegungen werden beim Laden entfernt, ohne Gegenstände zu verlieren.
6. **Auftragsanzeige:** „Auftrag der Schicksalsschrift“ besitzt einen goldenen Rahmen, ein Schriftzeichen und eine eigene Fläche für das aktuelle Ziel.
7. **Kapitel:** Kapitelnummer und deutscher Name stehen dauerhaft im goldenen Rahmen. Beim Beginn jedes Kapitels erscheint zusätzlich eine mittige, verzierte Einblendung. Wiederholende englische Ortsnamen und Untertitel entfallen.
8. **Dialog schließen:** Das Händlergespräch besitzt oben rechts ein sichtbares X. Es schließt ohne Kauf oder Schmiedevorgang; Escape schließt das Gespräch ebenfalls.
9. **Gegnergruppen:** Normale Begegnungen bestehen aus zwei bis drei Gegnern mit gemeinsamer Alarmierung. Bosse und der besondere Questgeist bleiben eigenständige Begegnungen.
10. **Erneuerungszeiten:** Harz 60 Sekunden, Eisen 90 Sekunden, Glutkerne 120 Sekunden aktive Spielzeit. Normale Gegner kehren nach 120 Sekunden zurück, sobald Nema mehr als zwölf Meter vom Gruppenplatz entfernt ist. Bosse und Questgeist bleiben besiegt; Questfortschritt wird nicht zurückgesetzt.
11. **Schwächere Autoangriffe:** Automatische Klingentreffer verwenden 62 Prozent des normalen Klingenschadens vor Rüstung und treffen nur den gewählten Gegner. Die gezielte Q-Fähigkeit und schwere Angriffe behalten ihren Schaden und den Klingenschwung gegen mehrere Ziele. Dadurch lohnen sich Fähigkeiten, Ausrüstungsverbesserungen und das erneute Sammeln von Materialien.
12. **Keine Heilsteine:** Alle fünf vollständig regenerierenden Rastobjekte sind entfernt. Auch Gebietswechsel füllen Leben und Energie nicht auf. Beim Tod erwacht Nema am Gebietseingang; Heiltränke werden dabei nicht kostenlos ergänzt.
13. **Nullhülle und Hindernisse:** Der Krypta-Spawn lag in einer Wand und wurde versetzt. Alle Gegnerpositionen werden auf freie Kollisionsflächen geprüft. Gegner benutzen eine für ihren Körperradius berechnete Wegsuche beim Verfolgen, Ausweichen und Zurückkehren; eine zusätzliche Korrektur befreit fehlerhafte Kollisionspositionen.

Bestehende Spielstände behalten ihre Geschichte, Ausrüstung, Gegenstände und Taschenbelegung für Kampfgegenstände. Die Kampagne bleibt kompakt; das neue Balancing ist durch automatisierte Kämpfe und Zustandsprüfungen abgesichert und ersetzt keinen längeren manuellen Balancing-Durchlauf.

## Hauptmenü-Korrektur

Die Kopfzeile, der Spieltitel und der Fußtext liegen jetzt in getrennten Layoutzeilen mit Mindestabständen. Dadurch überlagern sich die Schriften auch bei 100 Prozent Browsergröße und geringerer Fensterhöhe nicht. Sehr flache Fenster können das Menü scrollen. Die Darstellung wurde in sieben Fenstergrößen von 390 × 844 bis 1440 × 900 geprüft.
