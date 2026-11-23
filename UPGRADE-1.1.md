# Version 1.1 — Lesbarkeit und direkte Kommandos

Die Überarbeitung setzt die 13 Rückmeldungen zur ersten Fassung zusammenhängend um.

1. **Eigene Bilder:** 36 gemalte Fantasy-Symbole für Klingen, Gewänder, Relikte, Materialien, Tränke, Gold, Attribute und Fähigkeiten. Die Bilddatei und der vollständige Generierungsprompt sind in ASSET-NACHWEIS.md dokumentiert.
2. **Bildinventar:** Gegenstandsnamen, Werte, Vergleiche und Attributwirkungen erscheinen am Bild beim Darüberfahren oder Tastaturfokus. Häkchen und Mengen bleiben unmittelbar sichtbar.
3. **Minimap:** maßstäbliche Draufsicht derselben 3D-Welt mit tatsächlicher Architektur, Wegen und Hindernissen; Positionsmarkierungen, sichtbarer Kameraausschnitt und geplanter Laufweg. Rechtsklick setzt ein Ziel und berechnet einen begehbaren Weg.
4. **Weltlesbarkeit:** Fine-Glyphenzellen wurden von 5,5 auf 2,35 CSS-Pixel verkleinert. Mehr Geometrieschattierung bleibt erhalten; Beleuchtung, Farben und Tiefenkanten wurden neu abgestimmt. Nema erhielt zusätzliche Gewandsegmente, Metallnähte, Schulterstücke und Schmuck; Truhen und Erzadern zusätzliche Geometrie.
5. **Schmiede:** Du-hast-Goldanzeige; rote Minuskosten mit Zutatenbildern; getrennte Arbeitsbereiche für Verbesserungen und Herstellung. Neue Gegenstände sind im goldenen Herstellungsbereich hervorgehoben. Vollständige Eigenschaften und Rezepte stehen am Bild. Der Handel trennt rote Kaufpreise von grünen Verkaufserlösen.
6. **Schließen:** große X-Schaltflächen für Inventar, Schmiede, Handel und Karte.
7. **Untere Leiste:** eigenes MOBA-inspiriertes Layout mit bebilderten Fähigkeiten, tatsächlichen Ressourcen und Abklingzeiten, Nema-Porträt und sechs Taschenfeldern. Keine League-of-Legends-Grafiken wurden übernommen.
8. **Interaktive Elemente:** sichtbare Rahmen, erhobene Aktionsflächen, Fokus-, Hover- und Druckzustände sowie klare deaktivierte Zustände.
9. **Erzadern:** ein erneuter Interaktionsversuch zeigt den verbleibenden Countdown. Der Interaktionshinweis zählt mit, solange Nema in Reichweite steht.
10. **QWER und Linksklick:** Q Klinge, W Glutklinge, E Echo-Puls, R Schriftwall. Erst wählen, dann mit Linksklick ausrichten und ausführen. Der Glyphenschritt hat ein eigenes Bild, Abklingzeit und Ausdauerkosten und bleibt über Space erreichbar.
11. **Autoangriffe:** Rechtsklick auf einen Gegner oder seine Lebensanzeige lässt Nema heranlaufen und wiederholt angreifen. Tod, ein neuer Laufbefehl oder S beendet den Autoangriff. Neue Rechtsklick-Kommandos brechen einen noch vorbereiteten Klingenschlag ab.
12. **Tasche:** sechs belegbare Felder, Tasten 1–6, Heiltrank anfangs in Feld 1. Gegenstände werden per Drag-and-drop zugewiesen. Auch Ausrüstung und Materialien können als Schnellzugriff abgelegt werden; Belegungen bleiben gespeichert. Verkaufte Ausrüstung hinterlässt keine ungültigen Verknüpfungen.
13. **Große Karte und Verdeckung:** Tab verwendet dieselbe genaue Weltaufnahme wie die Minimap. Kronen sind in der Karte ausgeblendet; verdeckende Kronen und Architektur werden in der Spielansicht vor Figuren und wichtigen Objekten durchsichtig.

Da **E** jetzt eine Fähigkeit auswählt, ist die Interaktion auf **F** umgezogen. Pfeiltasten bleiben als direkte Bewegungsalternative erhalten. Das Mausrad verändert die Kameranähe. Bestehende Spielstände behalten ihren Fortschritt und bekommen die neue Taschenstruktur automatisch ergänzt.

## Prüfung

Zusätzlich zu den bisherigen RPG-Prüfungen testen neue Logiktests Wege um Mauern, blockierte Ziele, Eckenschnitte, Positionen dicht an einer Wand und sichere Taschenbelegungen. Browserprüfungen testen echte Rechts- und Linksklicks, Heranlaufen und wiederholte Angriffe bis zum Tod, Abbruch durch neue Befehle, Minimap-Navigation um die Kapelle, QWER-Zielbestätigung, Hover-Details, Drag-and-drop, Taschen-Hotkeys, persistente Belegung, tatsächliche Schmiedekosten und Erz-Countdowns.

Der gesamte fünfteilige Kampagnenpfad wird weiterhin mit kontrollierten Weg- und Kampffix­turen geprüft. Das überprüft den vollständigen Zustandsfluss, ersetzt aber keinen langen manuellen Balancing-Durchlauf. Mobilprüfungen verwenden Browser-Emulation, kein reales Mobiltelefon.
