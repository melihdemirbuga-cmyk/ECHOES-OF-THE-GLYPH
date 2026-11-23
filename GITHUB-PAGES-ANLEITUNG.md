# ECHOES OF THE GLYPH auf GitHub Pages

Vorbereitet am 23. November 2026. Die Anpassungen wurden ausschließlich in diesem lokalen Spielordner vorgenommen. Es wurde nichts hochgeladen, kein entfernter Repository-Inhalt verändert und kein Push ausgeführt.

Vorgesehene Spieladresse nach deiner Veröffentlichung:

**https://melihdemirbuga-cmyk.github.io/ECHOES-OF-THE-GLYPH/**

## 1. Was untersucht wurde

| Bestandteil | Ergebnis und Verwendung |
|---|---|
| `package.json`, `package-lock.json`, installierte Pakete | Vite 7.3.8, TypeScript 5.9.3 und Three.js 0.180.0; npm mit unveränderten, festgelegten Paketversionen. Node.js ab 22.12 passt dazu. |
| `src/core`, `src/data`, `src/narrative`, `src/loot`, `src/persistence` | Spielablauf, sämtliche fünf Kapitel, Kämpfe, Beute und Spielstände laufen vollständig im Browser. Kein Backend und keine Datenbank erforderlich. |
| `src/world`, `src/characters`, `src/rendering` | Modelle, Umgebung, Animationen, Shader, Effekte und Glyphentextur entstehen aus dem vorhandenen Code bzw. Canvas. Keine separat nachzuladenden GLTF-, OBJ- oder Modelldateien. |
| `src/ui`, `src/style.css`, `src/ui-v2.css` | Vorhandene Oberfläche bleibt erhalten. Vite verarbeitet den CSS-Pfad zum Bildatlas und schreibt den Unterpfad in den Build. |
| `public/assets/glyph-icons-v2.png` | Der originale Bildatlas mit allen Gegenstands- und Fähigkeitssymbolen. Wird unverändert nach `dist/assets/` kopiert. |
| `public/favicon.svg` | Originales Browser-Symbol; wird ebenfalls unverändert in den Build übernommen. |
| `src/audio/AudioManager.ts` | Klänge werden mit Web Audio synthetisiert. Keine Audio-Dateien oder externen Musikdienste nötig. |
| `scripts`, beide `.cmd`-Dateien | Lokale Start-, Stopp- und Prüfwerkzeuge. GitHub Pages führt diese Dateien nicht aus. Der Windows-Start bleibt nutzbar. |
| `tests`, Konfigurationsdateien | Vorhandene Logik- und Browsertests bleiben erhalten. Die Entwicklung läuft weiterhin am bisherigen lokalen Pfad. |
| `dist`, `node_modules`, `.runtime`, `.reference`, `artifacts`, `test-results` | Build, installierte Werkzeuge, Prozessdaten, Referenzen und Prüfberichte. Für Git ignoriert; keine dieser Dateien wurde gelöscht. |
| Referenzvideo, Referenz-JPG und ältere ZIP-Archive im Hauptordner | Dienen als Vorlagen bzw. lokale Sicherungen und werden vom Spiel nicht geladen. Sie bleiben vorhanden, werden aber nicht versehentlich mit hochgeladen. |

Alle 59 relativen Quellcode-Importe wurden einschließlich ihrer Groß-/Kleinschreibung geprüft. Die Browser-Quellen enthalten keine Abhängigkeit von Windows-Laufwerksnamen oder `file://`-Adressen. Im Vergleich zum bisherigen lokalen Release wurde innerhalb von `src` ausschließlich die Audio-Kompatibilität angepasst. Grafik, Inhalte, Spielregeln und Steuerung wurden nicht verändert.

## 2. Geänderte und neue Dateien

| Datei | Änderung und Grund |
|---|---|
| `vite.config.ts` | Produktionsbasis ist `/ECHOES-OF-THE-GLYPH/`. Damit funktionieren Skripte, CSS, Vorladeverweise und öffentliche Assets auf der Projektseite. Die bestehende Three.js-Aufteilung bleibt erhalten. |
| `index.html` | Das Favicon verwendet `%BASE_URL%`, damit es sowohl lokal als auch unter dem Pages-Unterpfad geladen wird. Der vorhandene Einstieg `src/main.ts` wird von Vite gebündelt. |
| `package.json` | Der Entwicklungsbefehl setzt ausdrücklich `--base /`, um bestehende lokale Werkzeuge und Browsertests unverändert zu halten. `npm run test:pages` prüft den fertigen Pages-Build. |
| `.npmrc` | Speichert die schon zuvor erforderliche Option `legacy-peer-deps=true`. Dadurch funktioniert ein einfaches `npm ci` auch im Workflow mit der vorhandenen Sperrdatei. Enthält keine Zugangsdaten. |
| `.github/workflows/deploy.yml` | Vollständiger Build und Deployment beim Push auf `main`, zusätzlich manuell startbar. Offizielle Actions sind an geprüfte Commit-IDs gebunden. |
| `scripts/serve.mjs` | Der vorhandene lokale Server versteht zusätzlich den Pages-Unterpfad. Die bisherige Adresse `http://127.0.0.1:4173/` bleibt verwendbar. |
| `src/audio/AudioManager.ts` | Ohne Web-Audio-Unterstützung bleibt das Spiel lautlos spielbar. Fehlt nur der Stereo-Panner, werden die vorhandenen Klänge ohne räumliche Verteilung ausgegeben. In unterstützten Browsern bleibt der Klang unverändert. |
| `scripts/pages-smoke.mjs` | Startet selbst eine lokale Vite-Preview, prüft Produktionspfade, Original-Assets, alle fünf Kapitel, Menüs, Spielstände und Audio-Fallbacks und beendet die Preview wieder. |
| `.gitignore` | Ergänzt lokale Berichte, Caches, temporäre Dateien, Umgebungsdateien, typische Schlüsseldateien, Referenzmedien und alte Release-ZIPs. `src`, `public`, `.github`, `.npmrc` und die Sperrdatei bleiben ausdrücklich uploadfähig. |
| `README.md` | Verweist auf diese Anleitung und erklärt den zusätzlichen Pages-Betrieb sowie die lokale Preview-Adresse. |
| `GITHUB-PAGES-ANLEITUNG.md` | Diese Anleitung mit Upload, Aktivierung, Prüfungen und späteren Updates. |

`dist/` wurde neu gebaut und enthält die fertige `index.html`, JavaScript, CSS, den Bildatlas und das Favicon. Es wird nicht ins Git-Repository eingecheckt, sondern von GitHub Actions bei jedem Build erzeugt. Es gibt keine zweite Spielkopie, keinen separaten Hosting-Ordner und keinen erforderlichen `gh-pages`-Branch.

Der bisher nicht versionierte Ordner hat jetzt eine **lokale Git-Verwaltung auf `main`**. Es wurden keine Dateien gestaged, keine Commits angelegt und keine Remote-Adresse eingerichtet. Die vorhandenen Spielstände im Browser wurden nicht bearbeitet.

## 3. Mit GitHub Desktop hochladen

1. Öffne **GitHub Desktop → File → Add local repository → Choose** und wähle genau diesen vorhandenen Spielordner: `C:\Users\melih\Desktop\ECHOES OF THE GLYPH`.
2. Klicke **Add repository**. Unter **Current branch** steht bereits `main`.
3. Kontrolliere **Changes**: `src`, `public`, `.github/workflows/deploy.yml`, `.npmrc`, `package.json`, `package-lock.json` und die übrigen Projektdateien sollen enthalten sein. `node_modules`, `dist`, Prozessdaten, Prüfberichte und alte ZIPs sollen fehlen.
4. Trage beispielsweise **„GitHub Pages vorbereiten“** als Zusammenfassung ein und klicke **Commit to main**. Der Projektordner selbst ist die Repository-Wurzel; `package.json` und `index.html` dürfen nicht in einem zusätzlichen Unterordner landen.
5. Bei einem **neuen GitHub-Repository**: Klicke **Publish repository**. Wähle dein Konto `melihdemirbuga-cmyk` und als Namen exakt **`ECHOES-OF-THE-GLYPH`**. Für eine öffentliche Veröffentlichung deaktiviere **Keep this code private** und bestätige die Veröffentlichung. Der lokale Ordnername mit Leerzeichen muss dafür nicht geändert werden.
6. Ist der Ordner bereits mit dem gewünschten Repository verbunden, verwendest du stattdessen **Push origin**. Ein bereits vorhandenes Repository mit eigener Historie sollte über seinen vorhandenen GitHub-Desktop-Checkout aktualisiert werden: die hier angepassten Projektdateien übernehmen, dessen `.git`-Verwaltung erhalten und dort committen und pushen. Die Vorbereitung hat absichtlich keine entfernte Historie abgerufen oder überschrieben.

Die Bedienfolge für Hinzufügen und Veröffentlichen entspricht der [GitHub-Desktop-Anleitung](https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-an-existing-project-to-github-using-github-desktop). Für GitHub Free ist Pages für öffentliche Repositories verfügbar; private Pages-Veröffentlichungen hängen vom Kontotarif ab. Siehe [GitHub Pages und eigene Workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## 4. GitHub Pages einmalig aktivieren

1. Öffne das Repository `ECHOES-OF-THE-GLYPH` auf GitHub.
2. Gehe zu **Settings → Pages**.
3. Wähle unter **Build and deployment → Source** den Eintrag **GitHub Actions**.
4. Öffne **Actions → Spiel auf GitHub Pages veröffentlichen**.
5. Falls der erste Push schon vor der Pages-Aktivierung erfolgte, starte einmal **Run workflow → Branch: main → Run workflow**. Ein vorher wegen deaktiviertem Pages fehlgeschlagener Lauf benötigt keine Änderung an den Spieldateien.

Ist Pages bereits vor einem späteren Push aktiv, startet der Workflow automatisch. Eine Branch-Veröffentlichung aus `/docs` oder `dist` ist nicht erforderlich. Diese Einrichtung folgt der [Vite-Anleitung für GitHub Pages](https://vite.dev/guide/static-deploy.html#github-pages) und der [offiziellen Workflow-Konfiguration von GitHub](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## 5. Was der Workflow ausführt

Der Build-Job checkt das Projekt aus, richtet Node.js 22 ein, installiert mit `npm ci`, führt `npm test` und `npm run build` aus und lädt ausschließlich `dist` als Pages-Artefakt hoch. Anschließend veröffentlicht der davon abhängige Deployment-Job dieses Artefakt in der Umgebung `github-pages`.

Der Build benötigt nur Lesezugriff auf Code und Pages-Metadaten; der Deployment-Job hat die erforderlichen Pages- und OIDC-Rechte. Es muss kein persönlicher Zugriffsschlüssel in eine Datei eingetragen werden. Der automatisch bereitgestellte Workflow-Token genügt. Gleichzeitige Veröffentlichungen werden geordnet.

## 6. Veröffentlichung kontrollieren

1. Unter **Actions** müssen **Prüfen und bauen** sowie **Auf Pages veröffentlichen** erfolgreich abgeschlossen sein.
2. Der Deployment-Schritt und **Settings → Pages** zeigen anschließend die veröffentlichte Adresse an.
3. Öffne **https://melihdemirbuga-cmyk.github.io/ECHOES-OF-THE-GLYPH/** mit abschließendem Schrägstrich.
4. Prüfe Hauptmenü, Neues Spiel, Inventarbilder, die Karte, Steuerung und Ton nach dem Startklick. Im Browser-Netzwerkprotokoll dürfen die Skripte und Bilder keine 404-Antworten liefern.
5. Lade die Seite erneut und kontrolliere **Reise fortsetzen**. Bei einem Update kann `Strg + F5` alte Browser-Dateien erneuern.

Ein 404 auf der Startseite deutet meist auf noch nicht aktiviertes Pages, einen anderen Repository-Namen oder einen noch nicht abgeschlossenen Deployment-Lauf hin. Fehler im Installations- oder Build-Schritt stehen direkt im jeweiligen Actions-Protokoll. Der konfigurierte Basis-Pfad passt genau zum oben genannten Repository-Namen.

## 7. Lokal weiterentwickeln und prüfen

Im vorhandenen Projektordner:

```powershell
npm ci
npm test
npm run build
npm run test:pages
```

`test:pages` verwendet Microsoft Edge und startet für die Dauer des Tests selbst die lokale Preview auf Port 5175. Edge muss für diesen optionalen Browsertest installiert sein; alternativ kann `PLAYWRIGHT_CHANNEL` auf einen bereits verfügbaren Playwright-Browser gesetzt werden. Der GitHub-Build benötigt Edge nicht.

Für eine interaktive Pages-Preview:

```powershell
npm run preview
```

Öffne dann **http://127.0.0.1:5173/ECHOES-OF-THE-GLYPH/**. Beenden mit `Strg + C`.

Für die Entwicklung bleibt **`npm run dev` → http://127.0.0.1:5173/** unverändert. Die bisherigen 13 Playwright-Tests laufen bei gestartetem Entwicklungsserver mit `npm run test:browser`.

**`SPIEL STARTEN.cmd` und `SPIEL BEENDEN.cmd` bleiben nutzbar.** Der Windows-Starter verwendet weiterhin den lokalen Produktionsserver auf Port 4173 und benötigt keine npm-Abhängigkeiten, wenn `dist` bereits vorhanden ist. Nach einem frischen Git-Checkout wird `dist` einmal mit `npm ci` und `npm run build` erzeugt. Zum Spielen auf der veröffentlichten Pages-Seite brauchen Besucher weder Node.js noch die `.cmd`-Dateien oder einen eigenen Server.

## 8. Spielstände und Browser-Unterstützung

Das Speicherformat und der vorhandene Speicher-Schlüssel bleiben erhalten. Die lokale Adresse und die GitHub-Adresse haben jedoch getrennte Browser-Speicher. Übertrage einen vorhandenen Fortschritt mit **Pause → Spielstand exportieren** aus der lokalen Fassung und **Spielstand importieren** auf Pages. Der Import ersetzt den dortigen Spielstand. Browser-Einstellungen können dauerhaftes Speichern blockieren; der vorhandene JSON-Export bleibt die unabhängige Sicherung.

WebGL2 und Hardwarebeschleunigung sind weiterhin erforderlich. Ein Ersatzrenderer würde Grafik und Funktionsumfang verändern und wurde deshalb nicht eingebaut. Die bereits vorhandene verständliche Fehlermeldung bleibt erhalten. Ohne Audio-Unterstützung läuft das Spiel weiter; fehlt nur Stereo-Panning, bleiben die Klänge ohne räumliche Verteilung verfügbar. Die normale Audio-Aktivierung erfolgt weiterhin nach dem Startklick.

## 9. Spätere Änderungen veröffentlichen

Ändere die Quelldateien in diesem Projekt, prüfe sie lokal und verwende anschließend in GitHub Desktop **Commit to main → Push origin**. Der Workflow baut und veröffentlicht die neue Fassung automatisch. `dist` wird nicht von Hand hochgeladen und es sind keine weiteren Hosting-Dateien zu bearbeiten.

## 10. Tatsächlich durchgeführte Prüfungen

- Frische Installation mit `npm ci --prefer-offline --no-audit --no-fund`; die eingecheckte `.npmrc` wurde dabei verwendet.
- 67 vorhandene Logikprüfungen bestanden.
- Alle 13 vorhandenen Playwright-Browserprüfungen bestanden, einschließlich Steuerung, Kampf, Oberfläche, mobilem Layout und vollständigem Kapitelpfad bis zum geheimen Ende mit kontrollierten Fixtures.
- TypeScript-Prüfung und vollständiger Vite-Produktionsbuild bestanden.
- `dist/index.html`, eingebundene JavaScript-/CSS-Dateien, Vorladeverweise und CSS-Assetpfade geprüft; alle liegen unter dem vorgesehenen Basis-Pfad.
- Bildatlas und Favicon stimmen bytegenau mit den Originalen in `public` überein.
- Lokale Vite-Preview unter `/ECHOES-OF-THE-GLYPH/`: alle fünf Kapitel per gültigem Spielstand-Import geladen und gerendert; Menüs, Inventar, Tooltips, Karte, Export, Import und Fortsetzen geprüft. Dies ist eine Prüfung des Produktionsbuilds und kein vollständiger Kampagnendurchlauf mit normalen Kampfzeiten.
- Audio-Fallbacks ohne AudioContext und ohne Stereo-Panner im Browser geprüft.
- Keine fehlgeschlagenen Ressourcenanfragen, keine JavaScript-/Shaderfehler und keine Anfragen an fremde Hosts im Pages-Prüflauf. Entwicklungszugänge sind im Produktionsbuild nicht vorhanden.
- Workflow-YAML geparst und Auslöser, Job-Abhängigkeiten, Rechte, Build-Befehle, Artefaktpfad und fünf festgelegte offizielle Action-Versionen geprüft. Die Action-Dateien an den verwendeten Commit-IDs waren erreichbar.
- Alle 59 relativen Quellcode-Importe stimmen einschließlich Groß-/Kleinschreibung; keine Windows-Dateipfad-Abhängigkeiten in den Browser-Quellen.
- Lokaler Windows-Starter nach Server-Neustart geprüft; Startseite und Bildatlas unter dem Pages-Unterpfad antworten mit HTTP 200.
- Zusätzliche Prüfung des bisherigen lokalen Produktionsstarts bestanden: Hauptmenü, neues Spiel, Einstellungen, Tastaturfokus, Inventar und Speichern/Fortsetzen; keine Konsolenfehler und ausschließlich lokale Anfragen.
- `.gitignore` mit Git geprüft: notwendige Quelldateien, Bildatlas, Workflow und `.npmrc` werden berücksichtigt; Build, Abhängigkeiten, Laufzeitdaten, lokale Umgebungsdateien, Berichte und alte ZIPs werden ausgeschlossen.

Der lokale Pages-Prüflauf schreibt `artifacts/github-pages-pruefung.json` und ein Prüfbild. Diese erzeugten Dateien sind absichtlich nicht Teil des Git-Uploads.

**Noch nicht ausgeführt:** Upload, Push, Actions-Ausführung auf GitHub und die tatsächliche öffentliche Veröffentlichung. Dafür fehlt absichtlich ein Remote-Auftrag; diese Schritte führst du wie oben beschrieben selbst aus. Getestet wurde lokal mit Node.js 22.13.1 und Microsoft Edge. Andere reale Browser und Mobilgeräte sowie der spätere Linux-Runner wurden hier nicht ausgeführt. Der vorhandene Hinweis zur Größe des Three.js-Bündels ist eine Build-Warnung; der Build wird erfolgreich erstellt.
