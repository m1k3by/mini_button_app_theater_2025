# Theater Sound Board 🎭

Eine ultra-schnelle, minimalistische Sound Board Web-App für mobile Geräte.

## Features

✅ 4 große Buttons für Sound-Wiedergabe  
✅ Individuelle Start-Zeitpunkte für jeden Sound einstellbar  
✅ Persistente Speicherung (localStorage)  
✅ Keine Datenbank erforderlich  
✅ Optimiert für mobile Geräte  
✅ Responsive Design  
✅ Vercel-ready

## Verwendung

### Einstellungen konfigurieren

1. Klicke auf das Zahnrad-Symbol (⚙️) oben rechts
2. Für jeden Sound kannst du festlegen:
   - **Name**: Beschriftung des Buttons
   - **URL**: Link zur Audio-Datei (z.B. von einem Cloud-Speicher)
   - **Startzeit**: Ab welcher Sekunde soll das Lied starten
3. Klicke auf "Speichern"

### Sounds abspielen

- Tippe auf einen Button (1-4), um den Sound abzuspielen
- Der aktive Button wird grün hervorgehoben
- Mit dem "Stop"-Button kannst du die Wiedergabe stoppen

### Audio-Dateien hosten

Du kannst deine Audio-Dateien auf verschiedenen Plattformen hosten:

- **Vercel Blob**: Ideal für Vercel-Hosting
- **GitHub**: Als öffentliche Dateien in einem Repository
- **Dropbox/Google Drive**: Mit öffentlichem Link
- **Cloudflare R2**: Kostenloser Object Storage

## Deployment auf Vercel

### Option 1: Über Git (empfohlen)

1. Erstelle ein GitHub Repository
2. Push diesen Code dorthin:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/DEIN-USERNAME/REPO-NAME.git
   git push -u origin main
   ```
3. Gehe zu [vercel.com](https://vercel.com)
4. Klicke auf "Import Project"
5. Wähle dein Repository aus
6. Deploy!

### Option 2: Über Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option 3: Drag & Drop

1. Gehe zu [vercel.com](https://vercel.com)
2. Ziehe den Projektordner in die Vercel-Oberfläche
3. Deploy!

## Lokales Testen

Öffne einfach die `index.html` in einem Browser. Für ein besseres mobile Testing:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve

# PHP
php -S localhost:8000
```

Dann öffne `http://localhost:8000` auf deinem Handy (im gleichen WLAN).

## Technologie

- **Vanilla JavaScript** - Keine Dependencies, ultra-schnell
- **localStorage** - Persistente Speicherung ohne Backend
- **CSS Grid** - Modernes, responsives Layout
- **Static HTML** - Sofort einsatzbereit

## Browser-Kompatibilität

✅ iOS Safari  
✅ Android Chrome  
✅ Alle modernen Desktop-Browser

## Lizenz

MIT - Frei verwendbar für alle Zwecke
