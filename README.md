# DA Lab Website

Die Website des **Digital Arts Lab** (FH Oberösterreich, Campus Hagenberg):

**https://digitalartslab.github.io/dalab-website/**

Die Seite ist eine einzige statische HTML-Datei, gehostet über GitHub Pages
aus diesem Repo (`DigitalArtsLab/dalab-website`). Es gibt keinen Server und
keinen Build-Schritt. Inhalte werden direkt im Browser gepflegt – über ein
verstecktes CMS auf der Seite selbst – und mit einem Klick veröffentlicht.

> **Offen vor dem Live-Gang:** die Rechtstexte und ein Teil der Inhalte sind
> noch Platzhalter. Siehe [Vor dem Live-Gang](#vor-dem-live-gang).

---

## Inhalte pflegen – der Schnellstart

1. Die **Live-Seite** (Adresse oben) im Browser öffnen – nicht eine alte
   lokale Kopie, sonst arbeitest du auf veraltetem Stand.
2. Das Wort **`admin` tippen** (einfach auf der Seite, nicht in ein
   Eingabefeld). Das geht nur mit Tastatur – Inhalte pflegt man am Computer,
   nicht am Handy.
3. Passwort eingeben. Es steht bewusst nicht in diesem README – das Repo ist
   öffentlich. Neue Redakteur:innen bekommen es persönlich.
4. Inhalte bearbeiten und **🚀 VERÖFFENTLICHEN** klicken. Die Änderung geht
   direkt ins Repo und ist nach ~1 Minute online. Beim allerersten Mal fragt
   das CMS nach einem GitHub-Token –
   siehe [Einrichtung pro Person](#einmalige-einrichtung-pro-person-2-minuten).

Änderungen sind bis zum Veröffentlichen nur lokal im eigenen Browser
gespeichert. **EXPORTIEREN** lädt den aktuellen Stand als Datei herunter –
als Sicherung oder für den [manuellen Weg](#der-manuelle-weg-ohne-token).

### Reihenfolge, Startseite und Archiv

Die Reihenfolge in der CMS-Liste ist die Reihenfolge auf der Seite. Jeder
Eintrag hat **▲ ▼**-Pfeile zum Verschieben.

- **News und Projekte:** Neue Einträge landen automatisch **oben**. Die
  Startseite zeigt die ersten 6 News bzw. 8 Projekte; alles Weitere steht im
  Archiv (Knopf „VIEW ALL … (Anzahl)“ erscheint automatisch).
- **Team:** Neue Personen werden hinten angefügt – mit den Pfeilen an die
  richtige Stelle schieben.
- **Publikationen:** Auf der Seite immer neuestes Jahr zuerst, egal in
  welcher Reihenfolge sie eingetragen wurden; die Pfeile ordnen nur innerhalb
  eines Jahres. Die Startseite zeigt die drei neuesten, das Archiv alle nach
  Jahr gruppiert, mit Jahres-Sprungleiste.

### Publikationen per DOI eintragen

Im Bearbeiten-Formular einer Publikation gibt es oben das Feld **„DOI
eingeben und Felder automatisch füllen“**: DOI (oder komplette
doi.org-Adresse) einfügen → **FELDER FÜLLEN** → Titel, Autor:innen, Jahr,
Venue und Band/Heft/Seiten werden automatisch geholt (aus Crossref bzw.
DataCite). Danach kurz prüfen – vor allem Autorennamen und ob die Venue
abgekürzt werden soll – und SAVE.

Nicht jede Publikation hat einen DOI (z.B. manche Workshopbände) – dann die
Felder einfach von Hand ausfüllen und das DOI-Feld leer lassen.

### Wenn Änderungen nicht erscheinen

Der Browser merkt sich deine bearbeitete Fassung und zeigt sie **bevorzugt
vor dem veröffentlichten Stand**. Beim Knopf VERÖFFENTLICHEN kümmert sich das
CMS selbst darum. Wer aber den manuellen Weg geht (exportieren, Datei
hochladen, Seite neu laden), sieht im eigenen Browser weiter den alten
Stand – die Website selbst ist trotzdem korrekt, alle anderen sehen die neue
Fassung.

Das CMS weist beim Öffnen darauf hin, sobald es so eine Abweichung bemerkt.
**LOKALE ÄNDERUNGEN VERWERFEN** (links im CMS unter „Weitere“) räumt den
Browserspeicher auf; danach zeigt die Seite wieder genau den
veröffentlichten Stand. Vorher exportieren, sonst sind ungesicherte
Änderungen weg.

---

## Bilder

**Der normale Weg:** Im Bearbeiten-Formular den **Upload-Button** nutzen.
Das Bild wird im Browser verkleinert (max. 1600 px) und ist sofort in der
Vorschau. Beim **VERÖFFENTLICHEN** legt das CMS es als Datei im Repo ab
(unter `images/news/`, `images/projects/` bzw. `images/team/`, der Dateiname
wird automatisch vergeben) und trägt im Eintrag nur den Pfad ein. So bleibt
die Seite klein und schnell.

**Bild austauschen** ist ein einziger Durchgang – vorheriges Löschen ist
nicht nötig:

1. Eintrag öffnen → **Upload-Button** → neues Bild wählen
2. **SAVE**
3. **VERÖFFENTLICHEN** – die alte Bilddatei im Repo wird überschrieben

Ein „Pull“ in GitHub Desktop ist dafür **nicht** nötig; das Veröffentlichen
geht direkt zu GitHub. Pull braucht nur, wer danach lokal am Repo-Ordner
weiterarbeiten will.

**Bild entfernen:** Knopf **✕ BILD ENTFERNEN** im Formular (die Datei bleibt
im Repo liegen – bei Bedarf dort löschen).

**Der manuelle Weg** (für Bilder, die schon im Repo liegen): Bild in den
passenden `images/`-Unterordner legen und im Formular den Pfad eintragen
(z.B. `images/team/maxi.jpg`). Achtung: GitHub Pages unterscheidet Groß- und
Kleinschreibung – der Pfad muss der Datei **exakt** entsprechen. Am
Windows-Rechner fällt so ein Fehler nicht auf, auf der Live-Seite fehlt das
Bild dann. (Beim Upload-Weg kann das nicht passieren.)

### Bildgröße: ein Bild reicht – aber groß genug

Es braucht keine zwei Versionen (klein/groß) pro Eintrag: Browser skalieren
verlustfrei herunter. Entscheidend ist die größte Darstellungsfläche – die
Detail-Ansicht (bis ~1200px breit, auf Retina-Displays effektiv das
Doppelte). Faustregel für Originale:

- **News-/Projektbilder: ca. 1600–2000px Breite** (JPEG oder WebP)
- **Team-Porträts: ca. 1000–1400px** Kantenlänge
- **Hero-Logo: ~500–800px** reichen (wird max. 260px breit angezeigt)

Zu kleine Originale kann keine Technik retten: Was mit 200px ankommt, bleibt
unscharf. (Bis August 2026 lag das Upload-Limit bei 800px – damals
hochgeladene Bilder wirken in der Detail-Ansicht unscharf und sollten einmal
neu vom Original hochgeladen werden.)

Das Hero-Logo hat im CMS einen eigenen Bereich (links: **HERO LOGO**) mit
Vorschau, Upload und „Standard-Logo wiederherstellen“. Nach einem
Logo-Wechsel einmal `make-images.ps1` laufen lassen, damit Vorschaubild und
Favicons zum neuen Logo passen (siehe
[Link-Vorschau und Favicon](#link-vorschau-und-favicon)).

---

## Veröffentlichen

Der Knopf **🚀 VERÖFFENTLICHEN** schreibt die Seite über die
GitHub-Schnittstelle direkt ins Repo – kein Download, kein Upload, kein
GitHub Desktop. Jeder Klick ist ein Commit unter dem GitHub-Namen der
Person; in der History sieht man also, wer wann was geändert hat, und jeder
frühere Stand lässt sich wiederherstellen.

### Einmalige Einrichtung pro Person (2 Minuten)

Jede:r Redakteur:in braucht ein persönliches **GitHub-Token**. Es wird
einmal im CMS eingetragen (links unter „Weitere“ → GITHUB-TOKEN, oder
automatisch beim ersten Klick auf VERÖFFENTLICHEN) und bleibt **nur im
eigenen Browser** gespeichert – es landet nie im Repo oder auf der Website.

Voraussetzung: Die Person ist Mitglied der Organisation `DigitalArtsLab` mit
Schreibrecht auf das Repo – oder als **Collaborator** direkt im Repo
eingetragen (Repo → Settings → Collaborators).

1. Auf GitHub anmelden, dann
   <https://github.com/settings/personal-access-tokens/new> öffnen.
2. **Resource owner: `DigitalArtsLab` auswählen** (Dropdown oben im
   Formular, nicht das eigene Konto) – nur dann ist das Lab-Repo in Schritt 4
   wählbar.
3. Token name: z.B. `DA Lab Website`. Expiration: 1 Jahr (danach einfach ein
   neues anlegen – das CMS meldet sich, wenn das alte nicht mehr gilt).
4. Repository access: **Only select repositories** → `dalab-website`.
5. Permissions → Repository permissions → **Contents: Read and write**.
   Sonst nichts.
6. **Generate token**, den angezeigten Text kopieren (wird nur einmal
   gezeigt) und im CMS einfügen.

**Falls `DigitalArtsLab` in Schritt 2 nicht angeboten wird:** Die
Organisation muss Fine-grained Tokens erlauben. Ein:e Org-Owner prüft unter
Organisation → Settings → Third-party Access → **Personal access tokens**,
dass der Zugriff zugelassen ist – am besten ohne Genehmigungspflicht, sonst
muss jedes Token einzeln freigegeben werden. Übergangsweise funktioniert
auch ein **Classic Token** (<https://github.com/settings/tokens/new>, Scope
`public_repo`) – der gilt allerdings für alle öffentlichen Repos der Person.

**Hinweis zum Umzug (August 2026):** Das Repo lag zuerst unter einem
persönlichen Konto. Fine-grained Tokens aus dieser Zeit funktionieren nicht
mehr – einmal neu anlegen wie oben, mit `DigitalArtsLab` als Resource owner.

### Der manuelle Weg (ohne Token)

1. Im CMS bearbeiten, **EXPORTIEREN** → `index.html` wird heruntergeladen.
2. Im GitHub-Repo die Datei `index.html` anklicken → Upload-Symbol → neue
   Datei per Drag & Drop hochladen → **Commit changes**.
3. Nach ~1 Minute ist die Änderung live.

### Was beim Veröffentlichen passiert

0. Hochgeladene Bilder werden zuerst als Dateien ins Repo geschrieben (ein
   Commit pro Bild) und im Eintrag durch ihren Pfad ersetzt. Schlägt das
   fehl, passiert nichts Weiteres und das Bild bleibt lokal erhalten.
1. Das CMS holt den aktuellen Stand der Seite aus dem Repo.
2. Es vergleicht drei Stände: *womit du angefangen hast*, *was du jetzt
   hast* und *was im Repo liegt*. Nur **deine** Änderungen werden
   übertragen – was jemand anderes inzwischen geändert oder ergänzt hat,
   bleibt erhalten. Zwei Leute können also gleichzeitig an verschiedenen
   Dingen arbeiten.
3. Hat jemand anderes **denselben Eintrag** geändert wie du, wird nichts
   veröffentlicht und das CMS sagt dir, welcher Eintrag betroffen ist.
   Dann: EXPORTIEREN (Sicherung), *Lokale Änderungen verwerfen*, den Eintrag
   noch einmal bearbeiten, veröffentlichen.
4. Die Datei im Repo ist immer die Vorlage – auch Design- oder
   Code-Änderungen, die jemand direkt im Repo gemacht hat, bleiben erhalten.
   Der Knopf tauscht ausschließlich die Inhalte aus.

Nach dem Veröffentlichen zeigt die Live-Seite die Änderung meist innerhalb
einer Minute; GitHub kann die alte Fassung aber **bis zu 10 Minuten**
zwischenspeichern. Das CMS weiß das und zeigt dir währenddessen deinen
veröffentlichten Stand, ohne eine falsche Warnung auszugeben.

### Sicherheit

- Das Token ist ein Schlüssel zum Repo. **Nicht weitergeben, nicht auf
  fremden oder geteilten Rechnern eintragen.** Auf einem geteilten Rechner
  nach der Arbeit über 🔑 → TOKEN ENTFERNEN löschen. Ein verlorenes Token
  auf GitHub widerrufen (Settings → Developer settings → Personal access
  tokens).
- **2-Faktor-Authentifizierung** auf GitHub für alle mit Schreibrecht – der
  GitHub-Account ist das, was hier wirklich geschützt wird.
- **Nicht jede:r braucht Schreibrecht.** Schreibzugriff nur für Leute, die
  veröffentlichen; alle anderen brauchen gar keinen Zugang, die Seite ist
  öffentlich.
- Die Seite liefert eine **Content-Security-Policy** aus (im `<head>` von
  `index.html`): Es laufen nur die eigenen Scripts, und die Seite darf nur
  mit GitHub, Crossref und DataCite reden. Das schützt die Tokens der
  Redaktion vor eingeschleustem Code. **Wird je ein neuer externer Dienst
  eingebunden, muss er dort eingetragen werden**, sonst blockiert ihn der
  Browser (sichtbar in der Browser-Konsole).

**Was im schlimmsten Fall passieren kann:** Mit einem gestohlenen
Fine-grained Token lässt sich die Website dieses einen Repos verunstalten –
mehr nicht: keine anderen Repos, kein Account-Zugriff. Jeder Stand steht in
der Git-History; zurücksetzen ist ein Klick auf GitHub („Revert“), danach
das Token widerrufen. Besucher:innen sind zu keinem Zeitpunkt gefährdet: Die
Seite setzt keine Cookies, sammelt nichts und führt keinen fremden Code aus.

---

## Vor dem Live-Gang

Was noch echte Inhalte braucht – alles über das CMS pflegbar, nichts davon
erfordert Code:

| Bereich | Was noch fehlt |
| --- | --- |
| Rechtstexte | Lab-Mailadresse, Datenschutzbeauftragte:r, Datum der Datenschutzerklärung – 11 Stellen, siehe [unten](#impressum-datenschutz-kontakt) |
| Projekte | „Thermal VR“ hat noch kein Bild |
| Projekte | „Theaterautomat“ hat noch keinen Link (Video oder Projektseite nachtragen, sobald es eine Adresse gibt) |
| Bilder | Zu klein, bitte in größer neu hochladen: LudaViz-Projektbild (800px, altes Upload-Limit), Team-Porträts von Luca (160px), Florian (200px), Lisa (200px), Lukas (388px); grenzwertig: Theaterautomat (1200px) |
| Team | 8 von 10 Personen ohne E-Mail und Biografie; Jürgen Haglers Bio ist noch der Platzhalter „Bio“ |
| Team | Pure-/Google-Scholar-Links sind bei allen noch leer (optionale Felder im Personen-Formular) |

Bereits erledigt und geprüft: alle 5 Projekte und 39 Publikationen
2021–2026 sind eingepflegt (DOIs gegen Crossref verifiziert), News und Team
sind aktuell.

**Eigene Domain** (falls gewünscht, z.B. `dalab.at`): Datei `CNAME` mit der
Domain als Inhalt ins Repo legen und die Domain per DNS auf GitHub Pages
zeigen (Repo → Settings → Pages zeigt die nötigen Einträge; GitHub-Doku:
„Managing a custom domain for your GitHub Pages site“). Danach die drei
Adressen im `<head>` umstellen, siehe
[Link-Vorschau und Favicon](#link-vorschau-und-favicon).

## Impressum, Datenschutz, Kontakt

Die drei Overlays sind über den Footer erreichbar, **Contact** zusätzlich
über das Hauptmenü. Die Texte stehen direkt in `index.html` (nach dem
Kommentar `<!-- Legal pages. -->`) und sind – wie die ganze Seite – auf
Englisch.

- **Impressum:** eingetragen ist die FH Upper Austria Research and
  Development GmbH (Roseggerstrasse 15, 4600 Wels; UID ATU 57300236,
  FN 236733m, LG Wels). Bitte einmal bestätigen lassen, dass das Digital
  Arts Lab tatsächlich unter dieser Rechtsträgerin läuft.
- **Datenschutz:** ein Entwurf für eine statische Seite auf GitHub Pages
  (keine Cookies, kein Tracking, keine Drittanbieter – alles technisch
  geprüft), mit der GmbH als Verantwortlicher. Vor dem Live-Gang von der
  FH freigeben lassen.
- **Kontakt:** Campus-Adresse Softwarepark 13, 4232 Hagenberg im Mühlkreis.

**Noch offen** – alle Stellen sind mit `[ZU ERGÄNZEN]` markiert:

- die **Lab-Mailadresse** – steht an vier Stellen (Impressum 2×,
  Datenschutz, Kontakt); am schnellsten per Suchen & Ersetzen,
- Kontakt des/der **Datenschutzbeauftragten** der FH OÖ,
- das **Datum** der Datenschutzerklärung.

```bash
grep -n "ZU ERGÄNZEN" index.html
```

---

## Technische Referenz

Ab hier wird es technisch – für die reine Inhaltspflege braucht man nichts
davon.

### Ordnerstruktur

```
dalab-website/
├── index.html          ← die Website selbst (inkl. aller Inhalte/Daten)
├── README.md           ← diese Anleitung
├── make-images.ps1     ← erzeugt Vorschaubild + Favicons aus dem Logo
├── assets/
│   ├── css/style.css   ← fertig gebautes Stylesheet (Tailwind, lokal – kein CDN)
│   ├── fonts/          ← Barlow + Inter, selbst gehostet (DSGVO-freundlich)
│   └── js/
│       ├── app.js      ← Seiten-Logik, Admin-CMS, Veröffentlichen
│       └── effects.js  ← Partikel-Animation im Hero
└── images/
    ├── hero/           ← Logo im Hero
    ├── og-image.png    ← Vorschaubild beim Teilen von Links (generiert)
    ├── favicon-32.png  ← Icon im Browser-Tab (generiert)
    ├── favicon-180.png ← Icon für den iOS-Homescreen (generiert)
    ├── news/           ← Bilder für News
    ├── projects/       ← Bilder für Projekte
    └── team/           ← Porträts
```

Gehostet wird über **GitHub Pages** direkt aus diesem Repo (Settings →
Pages: Branch `main`, Ordner `/ (root)`). Die versteckten Dateien
`.nojekyll` und `.gitattributes` gehören dazu. Zieht die Seite je auf eine
andere Adresse um, müssen die Konstante `PUBLISH` in `assets/js/app.js`
(owner/repo) und die drei Adressen im `<head>` angepasst werden.

### Adressen der Detailansichten

Projekte, News, Profile und Rechtstexte öffnen sich als Overlay, haben aber
eigene Adressen und Verlaufs-Einträge. Der **Zurück-Button schließt das
Overlay**, statt die Seite zu verlassen, und Einträge sind direkt verlinkbar:

```
…/#project/ludaviz
…/#person/michael-lankes
…/#news/welcome-to-the-digital-arts-lab
…/#imprint   (ebenso #privacy, #contact)
```

Die Adresse wird aus dem Titel/Namen gebildet (Umlaute: `Grüße` →
`gruesse`). **Wird ein Titel umbenannt, ändert sich die Adresse** – ein
vorher verschickter Link öffnet den Eintrag dann nicht mehr (die Seite lädt
normal, nur ohne Overlay). Bei zwei gleichnamigen Einträgen behält der
ältere die lesbare Adresse. Das Admin-CMS taucht bewusst nie in der
Adresszeile auf.

### Link-Vorschau und Favicon

Beim Teilen der Adresse (Slack, LinkedIn, WhatsApp …) zeigen die Dienste
Titel, Beschreibung und `images/og-image.png` – gesteuert über
`<meta>`-Tags im `<head>` von `index.html`. Die Adressen `canonical`,
`og:url` und `og:image` zeigen auf die aktuelle Live-URL; **bei einem
Domain-Umzug müssen diese drei Zeilen mitziehen**.

Vorschaubild und Favicons sind aus dem Logo generiert. Nach einem
Logo-Wechsel einmal neu erzeugen:

```bash
powershell -ExecutionPolicy Bypass -File make-images.ps1
```

### Barrierefreiheit

Als Hochschulseite fällt die Website unter das Web-Zugänglichkeits-Gesetz.
Zwei Dinge, die beim Weiterbauen leicht kaputtgehen:

- Die News-, Projekt- und Team-Karten sind `<div>`-Elemente mit
  `role="button" tabindex="0"` und `aria-label` (erzeugt in `app.js`) –
  ohne diese Attribute sind sie per Tastatur nicht mehr erreichbar.
- Der sichtbare Fokusrahmen (`:focus-visible` am Ende von `input.css` bzw.
  `style.css`) darf nicht entfernt werden.

### Mobile Navigation

Unter 1024px Fensterbreite wird das Menü zum Burger-Button; die Links
stehen dann im Panel `#mobile-nav`. Ein neuer Menüpunkt muss an **beiden**
Stellen in `index.html` ergänzt werden: Desktop-Leiste (`hidden lg:flex`)
und `#mobile-nav`.

### Code-Änderungen und Browser-Cache

`index.html` bindet Stylesheet und Scripts mit einer Versionsnummer ein
(z.B. `assets/js/app.js?v=2026-08-24d`). **Wer `app.js`, `effects.js` oder
`style.css` ändert, zählt die Version an allen drei Stellen in `index.html`
hoch** (Datum + Buchstabe reicht) – sonst laden Browser bis zu 10 Minuten
das alte Script zur neuen Seite. Inhaltspflege über das CMS braucht das
nicht.

### CSS neu bauen

Nur nötig, wenn neue Tailwind-Klassen ins HTML/JS kommen:

```bash
npm install tailwindcss@3
npx tailwindcss -c tailwind.config.js -i input.css -o assets/css/style.css --minify
```

Die eigenen Styles am Ende von `input.css` (Cursor, Modals, Admin-UI,
Team-Raster, mobile Navigation) sind normales CSS und stehen identisch am
Ende von `assets/css/style.css`. Wer dort ohne Rebuild etwas ändert, muss
es in **beiden** Dateien tun.
