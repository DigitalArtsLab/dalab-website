# DA Lab Website

> **Offen vor dem Live-Gang:** die Rechtstexte und ein Teil der Inhalte sind
> noch Platzhalter. Siehe [Vor dem Live-Gang](#vor-dem-live-gang).

## Ordnerstruktur

```
dalab-website/
├── index.html          ← die Website selbst (inkl. aller Inhalte/Daten)
├── README.md           ← diese Anleitung
├── make-images.ps1     ← erzeugt Vorschaubild + Favicons aus dem Logo
├── assets/
│   ├── css/style.css   ← fertig gebautes Stylesheet (Tailwind, lokal – kein CDN)
│   ├── fonts/          ← Barlow + Inter, selbst gehostet (kein Google-Request, DSGVO-freundlich)
│   └── js/
│       ├── app.js      ← Seiten-Logik, Admin-CMS, Export
│       └── effects.js  ← Cursor + Partikel-Animation
└── images/
    ├── hero/           ← Logo im Hero (images/hero/DAlabLogo.png austauschen)
    ├── og-image.png    ← Vorschaubild beim Teilen von Links (generiert)
    ├── favicon-32.png  ← Icon im Browser-Tab (generiert)
    ├── favicon-180.png ← Icon für den iOS-Homescreen (generiert)
    ├── news/           ← Bilder für News
    ├── projects/       ← Bilder für Projekte
    └── team/           ← Portraits
```

## Inhalte pflegen

1. Die **Live-Seite** (<https://digitalartslab.github.io/dalab-website/>) im
   Browser öffnen. Der Admin-Zugang ist versteckt:
   **einfach das Wort `admin` tippen** (nicht in ein Eingabefeld, einfach auf
   der Seite). Das geht nur mit Tastatur – Inhalte pflegt man also am
   Computer, nicht am Handy.
2. Passwort eingeben (Standard: `dalab2026` – bitte ändern, siehe unten).
3. Inhalte bearbeiten. Änderungen sind zunächst nur lokal im Browser gespeichert.
4. **VERÖFFENTLICHEN** klicken → die Änderung geht direkt ins GitHub-Repo und
   ist nach ~1 Minute online. Beim ersten Mal wird ein GitHub-Token abgefragt,
   siehe [Veröffentlichen direkt aus dem CMS](#veröffentlichen-direkt-aus-dem-cms).
   Alternativ **EXPORTIEREN** und die Datei von Hand ins Repo laden.

### Reihenfolge, Startseite und Archiv

Die Reihenfolge in der CMS-Liste ist die Reihenfolge auf der Seite. Jeder
Eintrag hat **▲ ▼**-Pfeile, um ihn zu verschieben. Wer im Team zuerst steht,
welches Projekt vorne liegt – alles damit steuerbar.

- **News und Projekte:** Neue Einträge landen automatisch **oben**. Die
  Startseite zeigt die ersten 6 News bzw. 8 Projekte; alles Weitere steht im
  Archiv, das über den automatisch erscheinenden Knopf „VIEW ALL … (Anzahl)“
  erreichbar ist.
- **Team:** Neue Personen werden hinten angefügt – mit den Pfeilen an die
  richtige Stelle schieben.
- **Publikationen:** Auf der Seite immer neuestes Jahr zuerst, egal in welcher
  Reihenfolge sie eingetragen wurden. Die Pfeile ordnen nur innerhalb eines
  Jahres. Die Startseite zeigt die drei neuesten, das Archiv alle, nach Jahr
  gruppiert und mit Jahres-Sprungleiste oben – auch 100 Einträge bleiben so
  navigierbar.

### Publikationen per DOI eintragen

Im Bearbeiten-Formular einer Publikation gibt es oben das Feld **„DOI eingeben
und Felder automatisch füllen“**. DOI (oder die komplette doi.org-Adresse)
einfügen → **FELDER FÜLLEN** → Titel, Autor:innen, Jahr, Venue und
Band/Heft/Seiten werden aus Crossref (bzw. DataCite) geholt. Danach kurz
prüfen – vor allem Autorennamen und ob die Venue abgekürzt werden soll – und
SAVE. Die Abfrage passiert nur beim Klick und nur im Browser der bearbeitenden
Person; Besucher:innen der Seite sind davon nicht betroffen.

### Wenn hochgeladene Änderungen nicht erscheinen

Punkt 3 hat einen Haken, den man kennen muss: Der Browser merkt sich die
bearbeitete Fassung und zeigt sie **bevorzugt vor dem Inhalt der Datei**. Wer
den manuellen Weg geht (exportieren, Datei hochladen, Seite neu laden), sieht
im eigenen Browser weiter den alten Stand – die Datei auf dem Server ist
trotzdem korrekt, und alle anderen sehen die neue Fassung. (Beim Knopf
VERÖFFENTLICHEN kümmert sich das CMS selbst darum.)

Das CMS weist beim Öffnen darauf hin, sobald es eine Abweichung bemerkt. Der
Eintrag **LOKALE ÄNDERUNGEN VERWERFEN** links unten im CMS (unter „Weitere“) räumt den Browserspeicher
auf, danach zeigt die Seite wieder genau das, was in der `index.html` steht.
Vorher exportieren, sonst sind ungesicherte Änderungen weg.

## Bilder

**Der normale Weg:** Im Bearbeiten-Formular den **Upload-Button** nutzen. Das
Bild wird im Browser verkleinert (max. 1600 px) und ist sofort in der Vorschau.
Beim **VERÖFFENTLICHEN** legt das CMS es als Datei im Repo ab – unter
`images/news/`, `images/projects/` bzw. `images/team/`, Dateiname aus Titel
und ID (z.B. `images/projects/ludaviz-1787476490936.jpg`) – und trägt im
Eintrag nur noch den Pfad ein. Jedes Bild ist ein eigener kleiner Commit
(„CMS: Bild images/…“). Groß-/Kleinschreibung kann dabei nicht mehr
schiefgehen, weil das CMS den Namen selbst vergibt.

Bis zum Veröffentlichen steckt ein hochgeladenes Bild als Text in den lokalen
Daten (und in einem eventuellen Export). Das ist nur ein Zwischenzustand –
nach dem Veröffentlichen ist die `index.html` wieder klein.

**Der manuelle Weg** (für Bilder, die schon im Repo liegen, oder wenn jemand
sie selbst einsortieren will): Bild in den passenden `images/`-Unterordner
legen und im Formular den Pfad eintragen (`images/team/maxi.jpg`). Achtung:
GitHub Pages unterscheidet Groß- und Kleinschreibung – der Pfad muss der Datei
**exakt** entsprechen, am Windows-Rechner fällt ein Fehler nicht auf.

Ob sich versehentlich ein eingebettetes Bild in der veröffentlichten Datei
hält, verrät:

```bash
grep -c base64 index.html
```

Ein gesetztes Bild wird über **✕ BILD ENTFERNEN** im Bearbeiten-Formular wieder
losgeworden (die Datei bleibt im Repo – löschen bei Bedarf dort).

### Bild austauschen

Ein vorhandenes Bild zu ersetzen ist **ein** Durchgang – vorheriges Löschen
ist nicht nötig:

1. Eintrag im CMS öffnen, über den **Upload-Button** das neue Bild wählen
   (die Vorschau zeigt es sofort)
2. **SAVE**
3. **VERÖFFENTLICHEN**

Das CMS überschreibt beim Veröffentlichen die bestehende Bilddatei im Repo
(der Dateiname bleibt gleich, weil er aus dem Eintrag abgeleitet wird).
Ein „Pull“ in GitHub Desktop ist für die Website **nicht** nötig – die
Veröffentlichung geht direkt zu GitHub. Pull braucht es nur, bevor jemand
lokal am Repo-Ordner weiterarbeitet.

Hinweis für ganz frühe Bilder (vor diesem Fix, August 2026): damals musste
man die Datei auf GitHub von Hand löschen, bevor ein Ersatz ankam. Das ist
behoben – der alte Umweg ist nicht mehr nötig.

### Bildgröße: ein Bild reicht – aber groß genug

Es braucht **keine** zwei Versionen (klein/groß) pro Eintrag: Browser
skalieren verlustfrei herunter, und die Karten laden verzögert. Entscheidend
ist die größte Darstellungsfläche – die Detail-Ansicht (bis ~1200px breit,
auf Retina-Displays effektiv das Doppelte). Faustregel für Originale:

- **News-/Projektbilder: ca. 1600–2000px Breite** (JPEG oder WebP)
- **Team-Porträts: ca. 1000–1400px** Kantenlänge
- **Hero-Logo: ~500–800px** reichen (wird max. 260px breit angezeigt)

Der Upload-Button verkleinert seit August 2026 auf max. 1600px – **vorher lag
das Limit bei 800px**. Damals hochgeladene Bilder wirken in der Detail-Ansicht
unscharf und sollten einmal neu vom Original hochgeladen werden. Zu kleine
Originale kann keine Technik retten: Was mit 200px ankommt, bleibt unscharf.

Das Hero-Logo hat im CMS einen eigenen Bereich (links: **HERO LOGO**) mit
Vorschau, Upload und „Standard-Logo wiederherstellen“. Ein hochgeladenes Logo
landet beim Veröffentlichen unter `images/hero/`. Danach `make-images.ps1`
laufen lassen (bzw. `images/hero/DAlabLogo.png` ersetzen), damit Vorschaubild
und Favicons zum neuen Logo passen.

## Vor dem Live-Gang

Checkliste dessen, was noch echte Inhalte braucht. Alles davon ist über das
CMS pflegbar, nichts davon erfordert Code.

**Rechtstexte** – siehe [Impressum, Datenschutz, Kontakt](#impressum-datenschutz-kontakt).
Noch offen: Lab-Mailadresse, Datenschutzbeauftragte:r, Datum (11 Stellen mit `[ZU ERGÄNZEN]`).

**Eigene Domain** (falls gewünscht) – siehe
[Veröffentlichen über GitHub Pages](#veröffentlichen-über-github-pages);
anschließend die drei Adressen im `<head>` umstellen, siehe
[Link-Vorschau und Favicon](#link-vorschau-und-favicon).

**Platzhalter-Inhalte, die aktuell öffentlich sichtbar sind:**

| Bereich | Was noch drinsteht |
| --- | --- |
| Projekte | „Thermal VR“ hat noch kein Bild (`imageUrl` leer – Bild in `images/projects/` legen und Pfad im CMS eintragen) |
| Projekte | „Theaterautomat“ hat noch keinen Link (Video oder Landestheater-Seite im CMS nachtragen, sobald es eine Adresse gibt) |
| Bilder | Zu klein für die Detail-Ansicht, bitte in größer neu hochladen: `projects/ludaviz-proj0.jpg` (800px, altes Upload-Limit), Team-Porträts von Luca (160px), Florian (200px), Lisa (200px), Lukas (388px); grenzwertig: `projects/Theaterautoemt.jpg` (1200px) |
| Team | 8 von 10 Personen ohne E-Mail und ohne Biografie; Jürgen Haglers Bio ist noch der Platzhalter „Bio“ |
| Team | Noch niemand hat einen Pure- oder Google-Scholar-Link hinterlegt (neue, optionale Felder im Personen-Formular) |

Erledigt: News-Platzhalter ersetzt, Team auf vollständige Namen umgestellt,
Publikationsliste 2021–2026 eingepflegt (39 Einträge, DOIs gegen Crossref
verifiziert; einzig „Morigami“, MuC-Workshopband 2024, hat keinen DOI).
Alle fünf Projekte (LudaViz, Expanded Conference Series, Thermal VR,
Brosch AI – Distorted Dreams, Theaterautomat) sind mit Beschreibung, Team,
Partnern und Status eingepflegt (Schreibweise „Brosch AI“ über die
Anima-Plus-Projektseite bestätigt; FWF-Grants gegen den FWF Research Radar
geprüft).

## Impressum, Datenschutz, Kontakt

Die drei Overlays sind über den Footer erreichbar, **Contact** zusätzlich über
das Hauptmenü. Die Texte stehen direkt in `index.html` (nach dem Kommentar
`<!-- Legal pages. -->`) und sind – wie die ganze Seite – auf Englisch.

**Impressum:** übernimmt Struktur und Firmendaten des Impressums von
digitalmedialab.at – gleiche Rechtsträgerin (FH Upper Austria Research and
Development GmbH, Roseggerstrasse 15, 4600 Wels; UID ATU 57300236,
FN 236733m, LG Wels). Die dort zusätzlich genannte DVR-Nummer wurde bewusst
weggelassen: das Datenverarbeitungsregister gibt es seit der DSGVO (2018) nicht
mehr. Bitte einmal bestätigen lassen, dass auch das Digital Arts Lab unter
dieser GmbH läuft.

**Datenschutz:** digitalmedialab.at hat keinen Datenschutztext. Unserer ist ein
Entwurf für eine statische Seite auf GitHub Pages (keine Cookies, kein Tracking,
keine Drittanbieter – alles geprüft) mit der GmbH als Verantwortlicher. Vor dem
Live-Gang einmal freigeben lassen.

**Kontakt:** Campus-Adresse wie auf digitalmedialab.at (Softwarepark 13,
4232 Hagenberg im Mühlkreis).

**Was noch fehlt** – alles mit `[ZU ERGÄNZEN]` markiert:

- die **Lab-Mailadresse** (z.B. `dalab@fh-hagenberg.at`) – steht an vier
  Stellen (Impressum 2×, Datenschutz, Kontakt); am schnellsten per Suchen &
  Ersetzen von `mailto:[ZU ERGÄNZEN]` und dem jeweiligen Anzeigetext,
- Kontakt des/der **Datenschutzbeauftragten** der FH OÖ,
- das **Datum** der Datenschutzerklärung.

```bash
grep -n "ZU ERGÄNZEN" index.html
```

## Link-Vorschau und Favicon

Beim Teilen der Adresse (Slack, LinkedIn, Mastodon, WhatsApp …) zeigen die
Dienste Titel, Beschreibung und `images/og-image.png`. Titel und Beschreibung
stehen als `<meta>`-Tags im `<head>` von `index.html`.

Die Adressen `canonical`, `og:url` und `og:image` im `<head>` zeigen aktuell auf
`https://digitalartslab.github.io/dalab-website/`. **Bei einem Umzug auf eine
eigene Domain müssen diese drei Zeilen auf die neue Adresse umgestellt werden** –
sonst zeigen Link-Vorschauen weiter auf die alte github.io-Adresse.

Vorschaubild und Favicons sind aus dem Logo generiert. Wenn das Logo
ausgetauscht wird (`images/hero/DAlabLogo.png`), einmal neu erzeugen:

```bash
powershell -ExecutionPolicy Bypass -File make-images.ps1
```

## Barrierefreiheit

Als Hochschuleinrichtung fällt die Seite unter das Web-Zugänglichkeits-Gesetz.
Zwei Dinge, die beim Weiterbauen leicht kaputtgehen:

- Die News-, Projekt- und Team-Karten sind `<div>`-Elemente mit
  `role="button" tabindex="0"` und einem `aria-label` (erzeugt in `app.js`).
  Ohne diese drei Attribute sind sie per Tastatur nicht mehr erreichbar.
- Sichtbarer Fokusrahmen: die Regel `:focus-visible` am Ende von `input.css`
  bzw. `assets/css/style.css` nicht entfernen.

Bilder brauchen keinen Alternativtext, weil sie rein dekorativ neben dem
Titel stehen – der Kartentitel steht im `aria-label`.

## Mobile Navigation

Unter 1024px Fensterbreite blendet sich das Menü in der Navigationsleiste zu
einem Burger-Button ein; die Links stehen dann im Panel `#mobile-nav`. Kommt
ein neuer Menüpunkt dazu, muss er an **beiden** Stellen in `index.html`
ergänzt werden: in der Desktop-Leiste (`hidden lg:flex`) und im `#mobile-nav`.

## Veröffentlichen über GitHub Pages

Die Seite ist dafür vorbereitet, direkt aus einem GitHub-Repo gehostet zu
werden (so macht es auch das alte Digital Media Lab mit digitalmedialab.at).
Es ist kein Build-Schritt nötig, das Repo enthält einfach diesen Ordner.

**Einmalige Einrichtung:**

1. Neues Repo anlegen (z.B. in der Department-Org: `Digital-Media/dalab-website`)
   und den kompletten Inhalt dieses Ordners hochladen – auch die versteckten
   Dateien `.nojekyll` (schaltet Jekyll-Verarbeitung ab) und `.gitattributes`.
2. Repo-Settings → **Pages** → Source: Branch `main`, Ordner `/ (root)`.
   Nach ~1 Minute ist die Seite unter
   `https://<org>.github.io/dalab-website/` erreichbar (HTTPS automatisch).
3. Kolleg:innen, die Inhalte pflegen sollen, unter Settings → Collaborators
   einladen.
4. Die Seite läuft aktuell unter `https://digitalartslab.github.io/dalab-website/`
   (Repo `DigitalArtsLab/dalab-website`). Zieht sie in eine Org oder auf eine
   eigene Domain um, die drei Adressen im `<head>` von `index.html` anpassen
   (siehe [Link-Vorschau und Favicon](#link-vorschau-und-favicon)).

**Redaktions-Workflow ab dann – der normale Weg:**

1. **Live-Seite** im Browser öffnen (nicht eine alte lokale Kopie – sonst
   arbeitet man auf veraltetem Stand), `admin` tippen, im CMS bearbeiten.
2. **VERÖFFENTLICHEN** klicken. Fertig – die Änderung wird direkt ins Repo
   geschrieben und ist nach ~1 Minute live. Beim allerersten Mal fragt das CMS
   nach einem GitHub-Token, siehe [Veröffentlichen direkt aus dem CMS](#veröffentlichen-direkt-aus-dem-cms).

**Der manuelle Weg** (Fallback, oder wenn jemand kein Token anlegen möchte):

1. Im CMS bearbeiten, **EXPORTIEREN** → `index.html` wird heruntergeladen.
2. Im GitHub-Repo die Datei `index.html` anklicken → Stift-/Upload-Symbol →
   neue Datei per Drag & Drop hochladen → **Commit changes**.
3. Nach ~1 Minute ist die Änderung live.

Neue Bilder kommen auf demselben Weg in den passenden `images/`-Unterordner
(im Repo: **Add file → Upload files**). Achtung: GitHub Pages unterscheidet
Groß- und Kleinschreibung – der Pfad im CMS muss der Datei **exakt** entsprechen
(`images/team/Maxi.jpg` ≠ `images/team/maxi.jpg`). Am Windows-Rechner fällt so
ein Fehler nicht auf, auf der Live-Seite fehlt das Bild dann.

**Eigene Domain** (z.B. `dalab.at`): Datei `CNAME` mit der Domain als Inhalt
ins Repo legen, bei der Domain per DNS auf GitHub Pages zeigen
(Settings → Pages zeigt die nötigen Einträge). Die Kolleg:innen der
`DigitalMediaLab-AT`-Org haben das für digitalmedialab.at bereits einmal
eingerichtet – kurze Nachfrage spart Doku-Lektüre.

**Bonus:** Jeder Commit ist eine Sicherung. Über die History der `index.html`
lässt sich jeder frühere Stand ansehen und wiederherstellen – das ersetzt das
bisherige „Backup durch Kopien".

## Veröffentlichen direkt aus dem CMS

Der Knopf **🚀 VERÖFFENTLICHEN** im CMS schreibt die `index.html` über die
GitHub-Schnittstelle direkt ins Repo – kein Download, kein Upload, kein
GitHub Desktop. Der Commit läuft unter dem GitHub-Namen der Person, die
geklickt hat, man sieht in der History also, wer was geändert hat.

### Einmalige Einrichtung pro Person (2 Minuten)

Jede:r Redakteur:in braucht ein persönliches **GitHub-Token**. Es wird einmal
im CMS eingetragen (links unter „Weitere“ → GITHUB-TOKEN, oder automatisch beim ersten Klick auf VERÖFFENTLICHEN) und
bleibt **nur im eigenen Browser** gespeichert – es landet nie im Repo oder
auf der Website.

Voraussetzung: Die Person ist Mitglied der Organisation `DigitalArtsLab` mit
Schreibrecht auf das Repo – oder als **Collaborator** direkt im Repo
eingetragen (Repo → Settings → Collaborators).

1. Auf GitHub anmelden, dann
   <https://github.com/settings/personal-access-tokens/new> öffnen.
2. **Resource owner: `DigitalArtsLab` auswählen** (Dropdown oben im Formular,
   nicht das eigene Konto) – nur dann ist das Lab-Repo in Schritt 4 wählbar.
3. Token name: z.B. `DA Lab Website`. Expiration: 1 Jahr (danach einfach ein
   neues anlegen – das CMS meldet sich, wenn das alte nicht mehr gilt).
4. Repository access: **Only select repositories** → `dalab-website`.
5. Permissions → Repository permissions → **Contents: Read and write**.
   Sonst nichts.
6. **Generate token**, den angezeigten Text kopieren (wird nur einmal gezeigt)
   und im CMS einfügen.

**Falls `DigitalArtsLab` in Schritt 2 nicht angeboten wird:** Die Organisation
muss Fine-grained Tokens erlauben. Ein:e Org-Owner prüft unter Organisation →
Settings → Third-party Access → **Personal access tokens**, dass Zugriff per
Fine-grained Token zugelassen ist – und stellt am besten auf „ohne
Genehmigungspflicht“, sonst muss jedes Token einzeln freigegeben werden.
Übergangsweise funktioniert auch ein **Classic Token**
(<https://github.com/settings/tokens/new>, Scope `public_repo`) – der gilt
allerdings für alle öffentlichen Repos der Person.

**Nach dem Umzug in die Organisation (August 2026):** Fine-grained Tokens,
die noch für das alte Repo unter `michaellankes` angelegt wurden,
funktionieren **nicht mehr** – bitte einmal neu anlegen wie oben, mit
`DigitalArtsLab` als Resource owner. Classic Tokens laufen unverändert
weiter. Das CMS meldet ein ungültiges Token beim nächsten VERÖFFENTLICHEN.

### Sicherheit

- Das Token ist ein Schlüssel zum Repo. **Nicht weitergeben, nicht auf
  fremden oder geteilten Rechnern eintragen.** Auf einem geteilten Rechner
  nach der Arbeit über 🔑 → TOKEN ENTFERNEN löschen.
- Ablaufdatum setzen (1 Jahr). Ein verlorenes Token auf GitHub unter
  Settings → Developer settings → Personal access tokens widerrufen.
- Das Admin-Passwort des CMS bleibt, was es war: ein Sichtschutz. Die echte
  Zugangskontrolle ist jetzt GitHub – wer kein Token hat, kann nichts
  veröffentlichen, egal ob er das Passwort kennt.
- **2-Faktor-Authentifizierung** auf GitHub für alle, die Schreibrecht haben
  (Settings → Password and authentication). Das ist der wirksamste einzelne
  Schutz, weil der GitHub-Account das ist, was hier wirklich geschützt wird.
- **Nicht jede:r braucht Schreibrecht.** Collaborators mit „Write“ nur für
  Leute, die veröffentlichen; alle anderen brauchen gar keinen Zugang, die
  Seite ist öffentlich.
- Die Seite liefert eine **Content-Security-Policy** aus (im `<head>` von
  `index.html`): Es laufen nur die eigenen Scripts, und die Seite darf nur
  mit GitHub, Crossref und DataCite reden. Das schützt die Tokens der
  Redaktion davor, durch eingeschleusten Code ausgelesen zu werden. **Wird je
  ein neuer externer Dienst eingebunden, muss er dort eingetragen werden**,
  sonst blockiert der Browser ihn (sichtbar in der Browser-Konsole).

### Was im schlimmsten Fall passieren kann

Wird ein Token gestohlen, kann damit **die `index.html` dieses einen Repos
überschrieben** werden – also die Website verunstaltet. Nicht mehr: keine
anderen Repos, kein Account-Zugriff (bei Fine-grained Tokens; Classic Tokens
mit `public_repo` reichen weiter, siehe oben). Und jeder Stand ist in der
Git-History – zurücksetzen ist ein Klick auf GitHub („Revert“), danach das
Token widerrufen. Besucher:innen der Seite sind zu keinem Zeitpunkt gefährdet:
Die Seite setzt nichts, sammelt nichts und führt keinen fremden Code aus.

### Was beim Veröffentlichen passiert

0. Hochgeladene Bilder werden zuerst als Dateien ins Repo geschrieben (ein
   Commit pro Bild) und im Eintrag durch ihren Pfad ersetzt – siehe
   [Bilder](#bilder). Schlägt das fehl, passiert nichts Weiteres und das Bild
   bleibt lokal erhalten.
1. Das CMS holt den aktuellen Stand der `index.html` aus dem Repo.
2. Es vergleicht drei Stände: *womit du angefangen hast*, *was du jetzt hast*
   und *was im Repo liegt*. Nur **deine** Änderungen werden auf den Repo-Stand
   übertragen – Einträge, die jemand anderes inzwischen geändert oder ergänzt
   hat, bleiben erhalten. Zwei Leute können also gleichzeitig an
   verschiedenen Dingen arbeiten. Eine geänderte **Reihenfolge** wird ebenfalls
   übertragen; haben beide Seiten umsortiert, bleibt die Reihenfolge aus dem
   Repo und das CMS weist darauf hin.
3. Hat jemand anderes **denselben Eintrag** geändert wie du, wird **nichts**
   veröffentlicht und das CMS sagt dir, welcher Eintrag betroffen ist. Dann:
   EXPORTIEREN (Sicherung), *Lokale Änderungen verwerfen*, den Eintrag noch
   einmal bearbeiten, veröffentlichen.
4. Die Datei im Repo ist dabei immer die Vorlage – auch Design- oder
   Code-Änderungen, die jemand direkt im Repo gemacht hat, bleiben erhalten.
   Der Knopf tauscht ausschließlich den Datenblock aus.

Nach dem Veröffentlichen zeigt die Live-Seite die Änderung meist innerhalb
einer Minute; GitHub kann die alte Fassung aber **bis zu 10 Minuten**
zwischenspeichern. Das CMS weiß das und zeigt dir in der Zwischenzeit deinen
veröffentlichten Stand, ohne eine falsche Warnung auszugeben.

## Adressen der Detailansichten

Projekte, News-Artikel, Profile und die Rechtstexte öffnen sich als Overlay,
haben aber trotzdem eine eigene Adresse und einen eigenen Eintrag im
Browserverlauf. Der **Zurück-Button schließt das Overlay**, statt die Seite zu
verlassen, und einzelne Einträge lassen sich verlinken:

```
…/#project/ludaviz     ← Projekt
…/#person/michi        ← Profil
…/#news/test-1         ← News-Artikel
…/#imprint             ← Impressum (ebenso #privacy, #contact)
```

Die Adresse wird aus dem Titel bzw. Namen gebildet (Umlaute werden umgeschrieben:
`Grüße` → `gruesse`). **Das heißt: Wenn ein Titel umbenannt wird, ändert sich die
Adresse und ein vorher verschickter Link führt nicht mehr auf den Eintrag** – die
Seite lädt dann normal, nur ohne geöffnetes Overlay. Bei zwei gleichnamigen
Einträgen behält der ältere die lesbare Adresse, der neuere bekommt seine interne
ID.

Das Admin-CMS ist bewusst nicht Teil davon und taucht nie in der Adresszeile auf.

## Admin-Passwort ändern

Das Passwort steht nicht im Klartext im Code, sondern als SHA-256-Hash in
`assets/js/app.js` (Konstante `ADMIN_HASH`). Zum Ändern:

1. Website im Browser öffnen, Entwicklerkonsole öffnen (F12).
2. Diesen Befehl mit dem Wunsch-Passwort ausführen:

```js
crypto.subtle.digest('SHA-256', new TextEncoder().encode('NEUES-PASSWORT'))
  .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')))
```

3. Den ausgegebenen Hash in `assets/js/app.js` bei `ADMIN_HASH` einsetzen.

**Wichtig, ehrlich gesagt:** Der Passwortschutz ist ein Sichtschutz, keine echte
Sicherheit – bei einer rein statischen Website kann eine technisch versierte
Person den Check im Quellcode umgehen. Das ist hier aber unkritisch: Das
Admin-Menü ändert nur die lokale Ansicht im Browser der jeweiligen Person,
niemals die Website selbst. Veröffentlichen kann nur, wer ein GitHub-Token mit
Schreibrecht hat.

Zwei Regeln trotzdem: **Kein echtes Passwort wiederverwenden** (der Hash steht
öffentlich im Repo und ist bei kurzen Passwörtern knackbar – ein FH-Passwort
hätte hier nichts verloren) und das Standardpasswort einmal ändern, damit nicht
jede:r, die/der dieses README liest, das CMS aufklappen kann. Ein langer, sonst
nirgends benutzter Satz ist ideal.

## Code-Änderungen und Browser-Cache

`index.html` bindet Stylesheet und Scripts mit einer Versionsnummer ein
(`assets/js/app.js?v=2026-08-23c`). Der Browser merkt sich die Dateien sonst
bis zu 10 Minuten – wer nach einer Code-Änderung die Seite lädt, sähe die neue
`index.html` mit dem **alten** Script (Symptom: „das Formular sieht noch aus wie
vorher“). **Wer `app.js`, `effects.js` oder `style.css` ändert, zählt die
Version an allen drei Stellen im `<head>`/Ende von `index.html` hoch** (Datum +
Buchstabe reicht). Inhalte über das CMS brauchen das nicht – sie ändern nur
die `index.html`.

## CSS neu bauen (nur nötig, wenn neue Tailwind-Klassen ins HTML/JS kommen)

```bash
npm install tailwindcss@3
npx tailwindcss -c tailwind.config.js -i input.css -o assets/css/style.css --minify
```

Beide Build-Dateien (`tailwind.config.js`, `input.css`) liegen mit im Ordner.

Die eigenen Styles am Ende von `input.css` (Cursor, Modals, Admin-UI, Team-Raster, mobile
Navigation) sind normales CSS und werden von Tailwind unverändert
durchgereicht – sie stehen deshalb identisch am Ende von
`assets/css/style.css`. Wer dort etwas ändert, muss es in **beiden** Dateien
tun, solange kein Rebuild läuft.

