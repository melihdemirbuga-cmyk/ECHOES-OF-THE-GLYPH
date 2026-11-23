# Entwicklungsplan und Abnahme

## Überarbeitung 1.2

Details stehen in UPGRADE-1.2.md. QWER und Leertaste wirken beim Loslassen zum Mauszeiger. Die Minimap ist rautenförmig und verwendet eine inverse Projektion für die Navigation. Die untere Leiste besitzt drei gespeicherte Größen. Kostenbilder haben Hover-Details; Materialbelegungen sind in der Kampftasche ausgeschlossen. Kapitel und Auftrag sind neu gerahmt, Händlerdialoge schließen per X.

Normale Gegner bilden Gruppen mit zwei bis drei Mitgliedern und erneuern sich nach 120 aktiven Sekunden außerhalb der Nähe des Spielers. Autoangriffe treffen das gewählte Ziel mit 62 Prozent Klingenschaden. Ressourcen erneuern sich nach 60–120 Sekunden. Heilende Rastobjekte und Heilung durch Reisen sind entfernt. Sichere Spawnkorrektur und A*-Wegsuche beheben den Krypta-Wandfehler.

- 67 Logikprüfungen bestanden, einschließlich Spawnfreiheit aller fünf Gebiete, Gegner-Wegsuche, Taschenmigration, Wiedererwachen ohne neue Tränke und neuen Ressourcenzeiten.
- 13 vollständige Browserprüfungen bestanden: darunter tatsächliches Loslassen aller fünf Fähigkeitstasten ohne Linksklick, Karten-Navigation, Leistengrößen, Kosten-Hover, Materialschutz, Händler-X, Reise ohne Regeneration, Gegnererneuerung und Verfolgung durch den Krypta-Durchgang. Der vollständige Kampagnenpfad mit geheimem Ende bleibt geprüft.
- TypeScript- und Produktionsbuild erfolgreich. Neue Kapitel-, HUD-, Händler-, Material- und Krypta-Ansichten unter `artifacts/v3-*.png` gerendert und angesehen; keine JavaScript- oder Shaderfehler in diesem visuellen Lauf.
- Produktionsserver mit Version 1.2.0 neu gestartet. Release-Prüfung bestanden: Start, Einstellungen, Tastaturfokus, Inventar, Speichern/Fortsetzen und ausschließlich lokale Requests; keine JavaScript-/Shaderfehler und keine Entwicklungshooks.

Die folgenden Abschnitte dokumentieren frühere Fassungen.

## Überarbeitung 1.1

Die Spielwelt und die Oberfläche wurden nach den Rückmeldungen überarbeitet. Details: UPGRADE-1.1.md. Bildquelle und Generierungsprompt: ASSET-NACHWEIS.md.

- 36 neue Bildsymbole; Bildkacheln und Hover-Informationen statt dauerhafter Inventartextlisten.
- Rote Schmiedekosten, ausdrückliche Du-hast-Goldanzeige, goldener Herstellungsbereich und große X-Schaltflächen.
- QWER mit linker Zielbestätigung; Rechtsklick-Bewegung über A*-Wegsuche und fortlaufende Autoangriffe.
- Sechs persistente Taschenfelder mit Drag-and-drop und Hotkeys 1–6.
- Echte 3D-Draufsicht für Minimap und Tab-Karte; Figuren-, Ziel- und Laufwegmarkierungen.
- Feinere Glyphenzellen, erhaltene Oberflächenkonturen, höhere Figurenlesbarkeit und Verdeckungsausblendung.
- Ressourcen-Countdowns beim Interagieren.

Die bisherige Abnahme der ersten Version bleibt unten als Verlauf erhalten. Der aktuelle Stand hat 60 bestandene Logiktests und 7 bestandene Browserprüfungen einschließlich Kampagne, neuer Maussteuerung, Bildern, Hover-Details, Tasche, Schmiede und Rohstoff-Countdown.

Ausgangslage: leerer Projektordner. Beide übergebenen Prompts sind die Produktanforderungen. Umsetzung als lokal ausführbares TypeScript-/Three.js-Spiel, ohne Backend oder fremde Spielassets.

1. Fundament: Vite, echte 3D-Geometrie, GPU-Glyphenatlas, Tiefenkanten, stabile Glyphenklassifikation.
2. Spielbarer Kern: Kamera, Kollisionen, Animationen, Kampf, Gegnerzustände, Tod und Rast.
3. RPG: datengetriebene Ausrüstung, tatsächliche Werte, Beute, Schmiede, Ressourcen, Erfahrung.
4. Geschichte: Edda, Orin, Miro, Veyra; fünf kompakte Regionen; deterministische Rätsel und Enden.
5. Präsentation: deutsche Oberfläche, Karten, Journal, synthetisiertes Audio, Touch-Steuerung.
6. Prüfung: Logiktests, Produktionsbuild, Browserprüfung, durchgängiger Kampagnenpfad.

## Umgesetzt

- **Phase A — Kampf:** tatsächliche HP und Rüstung, Nahkampf, schwere Angriffe, Magie, Ausdauer, Block/Parieren, Ausweichschutz, Gegnerzustände, Tod und Wiederbelebung, XP und Attribute.
- **Phase B — Inventar:** eindeutige Instanzen, vier Slots, reale Ausrüstungswerte, persistente Truhen, garantierte Questgegenstände, gewichtete Zusatzbeute und Gold.
- **Phase C — Schmiede:** Quest-Reparatur, Upgrades bis +5, Waffen- und Rüstungswerte, Herstellungsrezepte, Handel und aktiv zu sammelnde Ressourcen mit Wiederherstellungszeit.
- **Phase D — Geschichte:** drei Hauptschritte in der Kapelle, Edda und Orin, drei Nebenquests, bedingte Dialoge, Journal, Kapitelabschluss und persistente Entscheidungen.
- **Phase E — Spielkern:** echte 3D-Kapelle, Nema, zehn Animationszustände, GPU-Glyphenatlas mit Dichtekalibrierung, Tiefenkanten und Hysterese, drei Render-Modi, synthetische Klänge, Speicherstände und Touch-Steuerung.
- **Phase F — kompakte Fortsetzung:** vier weitere Regionen mit jeweils eigener Geometrie, Rätseln und Boss; drei Siegel; alternative Glockenreparatur; Avar mit drei Phasen und durch Echo brechbarem Schriftwall; drei eigenständige Epiloge.
- **Auslieferung:** Produktionsbuild in `dist/`, Doppelklick-Starter und Stopper für Windows, unabhängiger lokaler Standardbibliothek-Server, vollständiger Quellcode und Release-Archiv.

## Visueller Vergleich mit der Referenz

Die Vorlage verwendet eine lange dunkle Kirche, steile Dachflächen, warme hohe Fenster, Zäune, einen alten Baum und eine helle Halo-Figur. Diese Merkmale sind als eigenständige räumliche Geometrie umgesetzt. Die Spielkapelle besitzt zusätzlich einen Glockenaufbau und einen ausgebauten Friedhof. Die Kamera ist eine orthografische 3/4-Ansicht; die eigentliche Figurennahansicht lässt sich mit C aufrufen. Verborgene Echo-Objekte zeigen ein schwaches räumliches Flimmern, bevor sie aufgedeckt werden.

Prüfbilder liegen in `artifacts/`: Hauptmenü, Kapelle, Nema-Nahansicht, alle Folgeregionen, mobiles Layout und geheimer Epilog. Die gelieferten Referenzdateien werden nicht als Spielassets verwendet.

## Grenzen des Builds

Die Kapitel sind eine kompakte abgeschlossene Kampagne. Der mehrstündige Inhaltsumfang der Vorlagen wird nicht als erreicht behauptet. Einzelne weitergehende Ziele — separate Dolch-/Stab-Spielweisen, komplexes mehrstöckiges Labyrinth, vollständige Navmesh-Pfadplanung, Material-ID- und Bewegungsvektor-Pässe, Sprachausgabe und aufwendige Filmsequenzen — sind offen. Konkrete Einzelheiten stehen in README.md.

## Testabnahme · 22. November 2026

- **50 Vitest-Prüfungen bestanden.** Unter anderem Schadens- und Rüstungsformel, echte Ausrüstungsboni, atomare Upgrades, Truhen, gewichtete Beute, Farming-Zeit, Heilung, XP/Attribute, Importvalidierung, Questbedingungen, Glockenentscheidungen, alle drei Endbedingungen und Erreichbarkeit sämtlicher Interaktionsziele in allen fünf Gebieten.
- **3 Playwright-Browserprüfungen bestanden.** Reale Tastatureingaben, Bewegung, Treffer, Schaden, Ausweichschutz, Inventar und Pause; zusammenhängender Kampagnenpfad mit geheimem Ende und anschließendem Neuladen; 390 × 844-Touch-Layout mit benutzbaren Magie-Schaltflächen und allen drei Glyphenmodi.
- **Produktionsbuild erfolgreich.** TypeScript-Prüfung und Vite-Bündelung; lokale Three.js-Laufzeit und Assets.
- **Release-Smoke-Test bestanden.** Start auf Port 4173, Hauptmenü, neues Spiel, Einstellungen, native Tab-Reihenfolge, Escape, Inventar und Fortsetzen nach dem Neuladen. Keine JavaScript-/Shaderfehler. Netzwerkzugriffe auf den lokalen Spielserver beschränkt. Entwicklungszugänge im Produktionsbuild nicht vorhanden.
- **Visuelle Prüfung:** Hauptmenü, Kapelle, Figurennahansicht, Wald, Krypta, Turm, Nichts, mobile Oberfläche und Epilog gerendert und angesehen. Vier Standbilder des gelieferten Videos wurden zum Vergleich lokal extrahiert.
- **Paketprüfung:** Der Windows-Starter startet den Release-Server ohne npm-Abhängigkeiten; der Gesundheitsendpunkt bestätigt die Spielversion. Die Abhängigkeiten meldeten nach dem Versionsabgleich keine bekannten npm-Audit-Funde.

Der Browser-Kampagnentest benutzt kontrollierte Weg- und Kampffix­turen, um den gesamten Zustandsfluss reproduzierbar in kurzer Zeit zu prüfen. Er ist kein vollständiger manueller Durchlauf mit normalen Kampfzeiten. Langzeitbalancing, reale Mobilhardware und eine allgemeine 60-/30-FPS-Zusage bleiben außerhalb dieser Abnahme.

