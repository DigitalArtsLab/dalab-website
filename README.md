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

1. Die **Live-Seite** (<https://michaellankes.github.io/dalab-website/>) im
   Browser öffnen. Der Admin-Zugang ist versteckt:
   **am Computer einfach das Wort `admin` tippen** (nicht in ein Eingabefeld,
   einfach auf der Seite) – oder **am Handy/Tablet 5× schnell auf das
   „DIGITAL ARTS LAB“-Logo im Footer tippen**.
2. Passwort eingeben (Standard: `dalab2026` – bitte ändern, siehe unten).
3. Inhalte bearbeiten. Änderungen sind zunächst nur lokal im Browser gespeichert.
4. **VERÖFFENTLICHEN** klicken → die Änderung geht direkt ins GitHub-Repo und
   ist nach ~1 Minute online. Beim ersten Mal wird ein GitHub-Token abgefragt,
   siehe [Veröffentlichen direkt aus dem CMS](#veröffentlichen-direkt-aus-dem-cms).
   Alternativ **EXPORTIEREN** und die Datei von Hand ins Repo laden.

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

Empfohlener Weg: Bild in den passenden Unterordner von `images/` legen (z.B.
`images/team/maxi.jpg`) und im Admin-Formular den Pfad eintragen
(`images/team/maxi.jpg`). So bleibt die HTML-Datei klein.

Alternativ gibt es den Upload-Button – dabei wird das Bild verkleinert und
direkt in die Datei eingebettet (praktisch für schnelle Tests, macht die Datei
aber größer).

Aktuell verweisen **alle** Bilder auf Pfade, es ist kein einziges Bild in die
HTML eingebettet. Bitte so lassen: dadurch ist `index.html` rund 30 KB statt
790 KB, die Bilder werden vom Browser zwischengespeichert und erst geladen,
wenn sie sichtbar werden. Ob sich versehentlich wieder ein eingebettetes Bild
eingeschlichen hat, verrät:

```bash
grep -c base64 index.html
```

Ein gesetztes Bild wird über **✕ BILD ENTFERNEN** im Bearbeiten-Formular wieder
losgeworden.

Das Hero-Logo hat im CMS einen eigenen Bereich (links: **HERO LOGO**) mit
Vorschau, Upload und „Standard-Logo wiederherstellen“. Sauberer als der Upload
ist es, `images/hero/DAlabLogo.png` im Repo direkt zu ersetzen und danach
`make-images.ps1` laufen zu lassen, damit Vorschaubild und Favicons zum neuen
Logo passen.

## Vor dem Live-Gang

Checkliste dessen, was noch echte Inhalte braucht. Alles davon ist über das
CMS pflegbar, nichts davon erfordert Code.

**Rechtstexte** – siehe [Impressum, Datenschutz, Kontakt](#impressum-datenschutz-kontakt).
15 Felder sind mit `[ZU ERGÄNZEN]` markiert.

**Eigene Domain** (falls gewünscht) – siehe
[Veröffentlichen über GitHub Pages](#veröffentlichen-über-github-pages);
anschließend die drei Adressen im `<head>` umstellen, siehe
[Link-Vorschau und Favicon](#link-vorschau-und-favicon).

**Platzhalter-Inhalte, die aktuell öffentlich sichtbar sind:**

| Bereich | Was noch drinsteht |
| --- | --- |
| News | Eintrag „Test 1“ (2025), ohne Beschreibung und Text |
| Publikationen | Eintrag „Test“ (2024), Autoren „A. B., C. D.“ |
| Projekte | „Broach AI“ und „Theaterautomat“: Status, Team, Partner und beide Beschreibungen leer |
| Projekte | „LudaViz“ nennt als Team „Prof. Dr. X. Y.“, „Expanded“ nennt „Team Member 2“ |
| Team | 7 von 9 Personen ohne E-Mail und ohne Biografie |
| Team | Michi und Juergen haben Dummy-Adressen (`x.y@fh-ooe.at`, `tm1@fh-ooe.at`) und „Bio.“ als Text |
| Team | Alle Namen sind Kurzformen – für eine Forschungsgruppe nach außen vermutlich eher vollständige Namen mit Titel |

**Zu klären:** Das Projekt heißt im CMS „Broach AI“, die Bilddatei
`images/projects/BroschAI.png`. Eine der beiden Schreibweisen ist falsch.

## Impressum, Datenschutz, Kontakt

Die drei Links im Footer öffnen jeweils ein Overlay. Die Texte stehen direkt in
`index.html` (nach dem Kommentar `<!-- Legal pages. -->`).

**Sie sind noch nicht fertig.** Alle Stellen, die mit `[ZU ERGÄNZEN: ...]`
markiert sind, müssen ausgefüllt werden – Impressum und Datenschutzerklärung
sind für eine FH-Einrichtung in Österreich rechtlich verpflichtend
(§ 5 ECG, § 25 MedienG, Art. 13 DSGVO). Die Struktur bildet die
Pflichtangaben ab, die Inhalte müssen von der FH kommen:

```bash
grep -n "ZU ERGÄNZEN" index.html
```

Am einfachsten ist es, die zentralen Texte der FH OÖ zu übernehmen oder darauf
zu verlinken und den Text vor dem Live-Gang von der Rechtsabteilung freigeben
zu lassen. Was inhaltlich schon stimmt und geprüft ist: die Seite setzt keine
Cookies, lädt nichts von Drittanbietern und holt die Schriften vom eigenen
Server – der entsprechende Absatz im Datenschutztext ist also korrekt.

## Link-Vorschau und Favicon

Beim Teilen der Adresse (Slack, LinkedIn, Mastodon, WhatsApp …) zeigen die
Dienste Titel, Beschreibung und `images/og-image.png`. Titel und Beschreibung
stehen als `<meta>`-Tags im `<head>` von `index.html`.

Die Adressen `canonical`, `og:url` und `og:image` im `<head>` zeigen aktuell auf
`https://michaellankes.github.io/dalab-website/`. **Bei einem Umzug auf eine
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
4. Die Seite läuft aktuell unter `https://michaellankes.github.io/dalab-website/`
   (Repo `michaellankes/dalab-website`). Zieht sie in eine Org oder auf eine
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

Voraussetzung: Die Person ist als **Collaborator** mit Schreibrecht im Repo
eingetragen (Repo → Settings → Collaborators).

1. Auf GitHub anmelden, dann
   <https://github.com/settings/personal-access-tokens/new> öffnen.
2. Token name: z.B. `DA Lab Website`. Expiration: 1 Jahr (danach einfach ein
   neues anlegen – das CMS meldet sich, wenn das alte nicht mehr gilt).
3. Repository access: **Only select repositories** → `dalab-website`.
4. Permissions → Repository permissions → **Contents: Read and write**.
   Sonst nichts.
5. **Generate token**, den angezeigten Text kopieren (wird nur einmal gezeigt)
   und im CMS einfügen.

**Falls das Repo in Schritt 3 nicht auswählbar ist:** Fine-grained Tokens
können nur Repos des *eigenen* Kontos oder einer *Organisation* ansprechen.
Solange das Repo unter einem persönlichen Konto (`michaellankes/…`) liegt,
können eingeladene Kolleg:innen es dort nicht auswählen. Zwei Auswege:

- **Classic Token** verwenden: <https://github.com/settings/tokens/new>,
  Scope **`public_repo`** anhaken (reicht, das Repo ist öffentlich), Ablauf
  setzen, generieren. Funktioniert sofort, gilt aber für alle öffentlichen
  Repos der Person – etwas weniger eng gefasst.
- **Besser auf Dauer:** das Repo in eine GitHub-Organisation übertragen
  (z.B. `Digital-Media` oder eine eigene Lab-Org, wie es das alte Lab mit
  `DigitalMediaLab-AT` gemacht hat). Dann funktionieren Fine-grained Tokens
  für alle Mitglieder. Beim Umzug muss **eine** Zeile in
  `assets/js/app.js` angepasst werden – die Konstante `PUBLISH`
  (`owner`, ggf. `repo`) – und die drei Adressen im `<head>`
  (siehe [Link-Vorschau und Favicon](#link-vorschau-und-favicon)).

### Sicherheit

- Das Token ist ein Schlüssel zum Repo. **Nicht weitergeben, nicht auf
  fremden oder geteilten Rechnern eintragen.** Auf einem geteilten Rechner
  nach der Arbeit über 🔑 → TOKEN ENTFERNEN löschen.
- Ablaufdatum setzen (1 Jahr). Ein verlorenes Token auf GitHub unter
  Settings → Developer settings → Personal access tokens widerrufen.
- Das Admin-Passwort des CMS bleibt, was es war: ein Sichtschutz. Die echte
  Zugangskontrolle ist jetzt GitHub – wer kein Token hat, kann nichts
  veröffentlichen, egal ob er das Passwort kennt.

### Was beim Veröffentlichen passiert

1. Das CMS holt den aktuellen Stand der `index.html` aus dem Repo.
2. Es vergleicht drei Stände: *womit du angefangen hast*, *was du jetzt hast*
   und *was im Repo liegt*. Nur **deine** Änderungen werden auf den Repo-Stand
   übertragen – Einträge, die jemand anderes inzwischen geändert oder ergänzt
   hat, bleiben erhalten. Zwei Leute können also gleichzeitig an
   verschiedenen Dingen arbeiten.
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
Sicherheit – bei einer rein statischen Website kann technisch versierte Person
den Check im Quellcode umgehen. Das ist hier aber unkritisch: Das Admin-Menü
ändert nur die lokale Ansicht im Browser der jeweiligen Person, niemals die
Website selbst. Auf den Server kommt nur, was ihr selbst per Export + Upload
einspielt.

## CSS neu bauen (nur nötig, wenn neue Tailwind-Klassen ins HTML/JS kommen)

```bash
npm install tailwindcss@3
npx tailwindcss -c tailwind.config.js -i input.css -o assets/css/style.css --minify
```

Beide Build-Dateien (`tailwind.config.js`, `input.css`) liegen mit im Ordner.

Die eigenen Styles am Ende von `input.css` (Cursor, Modals, Admin-UI, mobile
Navigation) sind normales CSS und werden von Tailwind unverändert
durchgereicht – sie stehen deshalb identisch am Ende von
`assets/css/style.css`. Wer dort etwas ändert, muss es in **beiden** Dateien
tun, solange kein Rebuild läuft.

