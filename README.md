# ECHOES OF THE GLYPH — Die vergessene Schrift · Version 1.2

Ein lokal spielbares, deutschsprachiges 3D-Action-RPG in einer Welt aus Licht und Schrift. Nema, die letzte Glyphenhüterin, sucht drei Erinnerungssiegel und die Wahrheit hinter Avars Großer Auslöschung.

## Sofort spielen unter Windows

1. **`SPIEL STARTEN.cmd` doppelklicken.** Der fertige Produktionsbuild ist in `dist/` enthalten. Der Starter öffnet den Browser auf **http://127.0.0.1:4173**.
2. **Neue Geschichte** wählen. Per Rechtsklick laufen und vor der Kapelle Edda ansprechen (F).
3. Nach dem Spielen kann `SPIEL BEENDEN.cmd` den lokalen Hintergrundserver schließen.

Voraussetzungen: Node.js 22.12 oder neuer sowie ein aktueller Browser mit WebGL2 und eingeschalteter Hardwarebeschleunigung. Auf dem Entwicklungsrechner wurden Node 22.13.1 und Microsoft Edge verwendet. Zum Spielen sind keine npm-Installation, Netzwerkverbindung, Konten, API-Schlüssel oder kostenpflichtigen Dienste nötig. Das Spiel läuft ausschließlich auf der Loopback-Adresse des eigenen Rechners.

Der Spielstand gehört zum Browser und zur Adresse. Entwicklungsserver (Port 5173) und fertige Version (Port 4173) haben getrennte Browser-Speicher. Über **Pause → Spielstand exportieren/importieren** kann der Fortschritt übertragen werden. Der Import ersetzt den aktuellen Spielstand.

## Steuerung

| Eingabe | Aktion |
|---|---|
| Rechtsklick auf Boden | Automatisch dorthin laufen; Hindernisse werden umlaufen |
| Rechtsklick auf Gegner | In Reichweite laufen und wiederholt angreifen; neuer Rechtsklick beendet den Befehl |
| Q / Shift + Q | Halten zum Zielen, loslassen für leichten / schweren Klingenschlag |
| W | Loslassen: Glutklinge zum Mauszeiger |
| E | Loslassen: Echo-Puls |
| R | Loslassen: Schriftwall |
| Leertaste | Loslassen: Glyphenschritt zum Mauszeiger, 25 Ausdauer und 2,5 Sekunden Abklingzeit |
| S | Laufen und Autoangriff stoppen |
| Pfeiltasten | Direkte Bewegung relativ zum Bildschirm |
| B halten | Blocken; genaues Timing pariert normale Nahkämpfer |
| Shift | Sprinten |
| F | Interagieren / Dialog weiterlesen |
| 1–6 | Taschenfelder verwenden; Heiltrank liegt anfangs auf 1 |
| I | Inventar, Ausrüstung und Attribute |
| Tab | Karte und Questjournal |
| C | Nemas umkreisende Nahansicht; erneut C zum Weiterspielen |
| Mausrad | Kamera näher / weiter |
| Esc | Zielauswahl abbrechen / Pause / Menü schließen |

Auf Touch-Geräten erscheinen ein virtueller Stick sowie Interaktions-, Angriffs-, Magie- und Ausweichtasten. Die Fähigkeitsbilder im HUD führen die jeweilige Fähigkeit direkt aus. Menüs lassen sich mit Tab und Enter bedienen. Da E nun Echo-Puls wirkt, liegt die Interaktion einheitlich auf F.

## Bildinventar, Schmiede und Karten

Inventar, Attribute und Schmiede nutzen 36 eigene gemalte Bildsymbole. Gegenstandsnamen, Eigenschaften, Vergleiche und Attributwirkungen erscheinen beim Darüberfahren oder Tastaturfokus. Ausrüstung wird durch Anklicken angelegt; Verbrauchsgegenstände werden benutzt. Ein grünes Häkchen zeigt angelegte Ausrüstung. Große X-Schaltflächen schließen die Menüs.

Bilder von Kampftränken und wechselbarer Ausrüstung lassen sich aus dem Inventar in die sechs Taschenfelder ziehen. Materialien und Questgegenstände bleiben im Inventar; ältere Materialbelegungen werden beim Laden ohne Bestandsverlust entfernt. Die Tasche ist ein Schnellzugriff auf die vorhandenen Gegenstände; sie erzeugt keine Kopien. Zum Entfernen einer Belegung das Taschenbild auf „Belegung lösen“ ziehen. Die Belegung wird mitgespeichert und bei älteren Spielständen automatisch ergänzt.

An der Schmiede zeigt **„Du hast … Gold“** den eigenen Bestand. **Rote Minusbeträge** sind Kosten. Beim Handel zeigen **grüne Plusbeträge** Verkaufserlöse. Die Herstellung neuer Gegenstände ist als eigener goldener Arbeitsbereich von Verbesserungen getrennt. Zutaten und ihre Mengen sind als Bildsymbole sichtbar. Auch die Kostenbilder selbst zeigen beim Darüberfahren Verwendung, Verbrauch und eigenen Bestand. Das Händlergespräch lässt sich mit dem X oben rechts oder Escape verlassen.

Die rautenförmig projizierte Minimap und die beschriftete Tab-Draufsicht zeigen dieselbe maßstäbliche Aufnahme der tatsächlichen 3D-Welt mit Architektur, Wegen und Hindernissen. Figuren, Truhen, Rohstoffe, Ziele und geplante Laufwege werden an ihren tatsächlichen Weltpositionen eingetragen. Rechtsklick auf die Minimap oder die große Karte setzt einen Laufbefehl. Fähigkeitstasten werden zum Zielen gehalten und beim Loslassen zum Mauszeiger ausgelöst, auch über der Minimap. Baumkronen werden in dieser Kartendarstellung ausgeblendet; in der Spielwelt werden verdeckende Kronen vor Figuren und nahen wichtigen Objekten transparent.

Beim erneuten Interagieren mit einer erschöpften Eisenader wird die verbleibende aktive Spielzeit als Minuten:Sekunden angezeigt. Der Countdown steht außerdem am Interaktionshinweis.

Die untere Leiste beginnt in der Größe **Klein**. In den Einstellungen stehen **Sehr klein**, **Klein** und **Normal** zur Wahl. Kapitelnummer und Name sind dauerhaft golden gerahmt; jeder Kapitelbeginn besitzt außerdem eine eigene mittige Einblendung. Das aktuelle Ziel steht unter **Auftrag der Schicksalsschrift**.

## Spielinhalt

- Fünf kompakte, verbundene Regionen: Kapelle, Wisperwald, Krypta, Glockenturm und Nichts.
- Eine vom Anfang bis zum Epilog abschließbare Geschichte mit drei Enden.
- Edda, Orin, Miro und Veyra mit zustandsabhängigen Dialogen; Miro begleitet Nema nach dem Kennenlernen beim weiteren Reisen.
- Drei Nebenquests: Ilyas Name, Orins letzte Glut und Miros Lied. Sie sind zusammen mit den drei persönlichen Briefen und Orins bewahrter Erinnerung Voraussetzung für das dritte Ende.
- Vier normale Gegnertypen und fünf Bosse. Wurzeln, Projektile, Energiewellen, Teleportation, Glocken-Doppelwellen und Avars vorangekündigte Auslöschung besitzen echte Trefferlogik.
- Drei Magiefähigkeiten, Schaden und Rüstung, leichte/schwere Klingenangriffe, Ausdauer, Ausweichen, Block und Parieren.
- XP, maximal 20 Level und frei vergebbare Attribute mit tatsächlichen Auswirkungen.
- Individuelle Ausrüstungsinstanzen, vier Slots, sechs Klingen, drei Gewänder, Talismane und Relikte.
- Persistente Truhen, garantierte Questbeute, gewichtete zusätzliche Gegnerbeute, Gold, Ressourcen, Handel und Herstellung.
- Waffen- und Rüstungsupgrades bis +5 mit echten Gold- und Materialkosten; kostenlose erste Quest-Reparatur.
- Fünf Verbrauchsgegenstände mit Bestandsverbrauch und tatsächlicher Wirkung.
- Ressourcen wachsen nach 60 Sekunden (Harz), 90 Sekunden (Eisen) oder 120 Sekunden (Glutkern) aktiver Spielzeit nach und müssen erneut gesammelt werden. Normale Gegner erscheinen in Gruppen aus zwei bis drei Gegnern und erneuern sich nach zwei Minuten außerhalb von zwölf Metern um Nema. Besiegte Bosse und der Questgeist bleiben besiegt. Historische Questnachweise bleiben erhalten.
- Vollständig heilende Raststeine sind entfernt. Gebietstransfers regenerieren keine Ressourcen. Tod führt zum Gebietseingang und entfernt weder Ausrüstung noch Questfortschritt oder XP; Heiltränke werden nicht kostenlos ergänzt.
- Autoangriffe treffen nur den gewählten Gegner mit 62 Prozent des normalen Klingenschadens vor Rüstung. Q behält den vollen Klingenschaden und den Schwung gegen mehrere Gegner.
- Automatisches Speichern, Wiederaufnahme, JSON-Export und validierter Import.
- Originale Web-Audio-Synthese für Atmosphäre und Effekte; keine fremde Musik oder heruntergeladenen Spielassets.

## Grafik

Die gesamte Welt besteht aus echten Three.js-Meshes, Lichtquellen, Schatten und einer orthografischen 3D-Kamera. Nema besitzt eine hierarchisch animierte Figur mit räumlichem Halo, Gewand, Gelenken und Klinge. Das Dach der Kapelle, die Fenster, die Bäume und die Treppen im Turm sind Geometrie.

Der Renderer besteht aus drei GPU-Durchläufen:

1. Beleuchtete Szene in ein Render-Target mit Tiefentextur.
2. Mehrpunkt-Abtastung je Glyphenzelle, Helligkeit, gerichtete Kanten und Tiefenkanten. Ein Ping-Pong-Verlauf stabilisiert ähnliche Glyphenklassen. Der lokale Glyphenatlas wird nach gemessener Pixeldichte sortiert. Das kleine geordnete Dithering verändert sich nicht zufällig pro Frame.
3. GPU-Abtastung des Schriftatlas, Übernahme der Szenenfarben, leichte Lichtstreuung und Vignette. Die HTML-Oberfläche bleibt davon getrennt.

**Feine Schrift** verwendet sehr kleine Glyphenzellen und klare Oberflächenkonturen; **Filmische Schrift** zeigt größere Glyphen; **Betonte Konturen** erhält zusätzlich mehr feine Geometrieschattierung. **Automatisch** reduziert bei längeren Framezeiten die Renderauflösung und Schatten; **Leicht** deaktiviert Schatten. Leistengröße, Lautstärke, Atmosphäre, Zoom, Bewegung und Schadenszahlen sind einstellbar. C pausiert die Kampfsimulation für die Nahansicht.

## Entwicklung und Tests

```powershell
npm ci --legacy-peer-deps
npm run dev
npm test
npm run test:browser
npm run build
```

Der Entwicklungsserver läuft auf http://127.0.0.1:5173. Browser-Tests setzen diesen laufenden Server und Microsoft Edge voraus. `npm run preview` zeigt den Build ebenfalls auf Port 5173. Der Doppelklick-Starter verwendet den unabhängigen Standardbibliothek-Server auf Port 4173.

`--legacy-peer-deps` umgeht einen Fehler der hier vorhandenen npm-10-Peer-Auflösung bei optionalen Vitest-Erweiterungen. Alle tatsächlich verwendeten Versionen stehen exakt in `package.json` und `package-lock.json`.

Die Logiktests prüfen Schaden, Ausrüstung, Heilung, Level, Gold, Schmiede, Loot, Persistenz, Rätsel, Questbedingungen, beide Glockenentscheidungen und alle Endbedingungen. Die fünf Karten werden zusätzlich mit einer Wegsuche auf erreichbare Interaktionsziele geprüft.

Die Playwright-Tests prüfen echte Tastatureingaben, Bewegung, Treffer, Schaden, Ausweichschutz, Inventar, Mobilmenüs, Touch-Schaltflächen und die drei Glyphenmodi. Ein zusätzlicher Kampagnenlauf verbindet sämtliche Kapitel und das geheime Ende mit kontrollierten Positionen und verkürzten Kämpfen. Er ersetzt keinen mehrstündigen manuellen Balancing- oder Hardwaretest. Entwicklungshilfen sind ausschließlich unter Vites Entwicklungsmodus mit `?test=1` verfügbar und im Produktionsbuild nicht aktiviert.

## Architektur

| Ordner | Verantwortung |
|---|---|
| `src/core` | Spielschleife, Eingaben, zentrale und testbare RPG-Logik |
| `src/data` | Ausrüstung, Gegner, Balancing, Karten und Interaktionen |
| `src/rendering` | Glyphenpipeline und gepoolte Partikel |
| `src/world` | 3D-Level, Kollisionen, Höhen und Weltobjekte |
| `src/characters` | Prozedurales Modell und zehn Animationszustände |
| `src/narrative` | Dialoge, Questfolgen, Entscheidungen und Epiloge |
| `src/loot` | Gewichtete Beute und garantierte Kerngegenstände |
| `src/audio` | Originale synthetisierte Klänge |
| `src/persistence` | Versionierter, validierter Browser-Spielstand |
| `src/ui` | Menüs, HUD, Karte, Inventar und Journal |
| `tests` | Vitest- und Playwright-Prüfungen |
| `scripts` | Start, Stopp, Release-Server und visuelle Prüfwerkzeuge |

## Umfang und Grenzen

Dies ist eine **kompakte, abgeschlossene Indie-Kampagne**, keine mehrstündige Großproduktion. Die fünf Regionen besitzen jeweils eine kleine Karte. Die Grundlagen aus beiden Prompts sind zu einer durchgängigen spielbaren Fassung verbunden; die langen Spielzeit- und Inhaltsziele der Vorlagen werden damit nicht als vollständig erreicht behauptet.

- Figuren und Umgebung sind stilisierte prozedurale Modelle. Animationen sind prozedural, keine motion-captured oder extern erstellten Skelettanimationen.
- Die Waffenfamilie umfasst Klingen und ein schweres Schwert. Separate Dolch- und Stab-Spielweisen sind nicht implementiert.
- Es gibt keine Sprachausgabe, frei generierten Laufzeit-Quests, Mehrspielerfunktion oder aufwendigen Filmsequenzen.
- Der Turm besitzt echte Höhen und Stufen auf einer breiten Hauptroute; kein komplexes mehrstöckiges Innenraum-Labyrinth.
- Gegner nutzen eine endliche Zustandsmaschine und eine zwischengespeicherte A*-Wegsuche mit Körperradius; keine vollständige Navmesh-Pfadplanung.
- Die Glyphenklassifikation berücksichtigt Farbe, Licht, Bild- und Tiefenkanten; eigene Material-ID- und Bewegungsvektor-Pässe sind nicht vorhanden.
- 60 FPS auf Desktop und 30 FPS auf Mobilgeräten sind Zielwerte, keine allgemeine Hardwaregarantie. Ein echtes Mobilgerät und ein längerer manueller Balancing-Durchlauf wurden nicht geprüft.
- Der Spielstand wird lokal im gewählten Browser gespeichert. Gelöschte Browserdaten entfernen ihn; der JSON-Export ist die unabhängige Sicherung.

Die Referenzbilder und das Video dienten zur visuellen Inspiration. Sie sind nicht Teil der Spielassets oder des Release-Archivs. Lizenzhinweise stehen in `LICENSE` und `THIRD_PARTY_LICENSES.txt`.



Die Änderungen dieser Fassung sind in [UPGRADE-1.2.md](UPGRADE-1.2.md) beschrieben.
