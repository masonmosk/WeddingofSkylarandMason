# Wedding Weekend Site — Carmel, May 2–4, 2027

A single-file static site (`index.html`) with the itinerary, travel info, things to do, FAQ and an RSVP form. Images and the looping hero video (`hero.mp4`, with `hero-poster.jpg` as its first frame) live in `images/`. `qr.html` generates the QR code for the invitations. No build step.

## 1. Personalize

Open `index.html` and edit the `CONFIG` block near the bottom:

```js
rsvpEndpoint: '',      // Google Apps Script URL (step 2)
rsvpEmail: '',         // fallback email if no endpoint is set
```

Placeholders to confirm as plans firm up: welcome dinner venue/time, ceremony beach (currently Carmel River State Beach), hotel booking/group rate, RSVP deadline (March 1, 2027), registry.

## 2. Collect RSVPs in a Google Sheet (free, ~5 min)

1. Create a Google Sheet named **Wedding RSVPs**. Add headers in row 1:
   `submitted | name | email | attending | guests | arrival | events | hotel | dietary | note`
2. **Extensions → Apps Script**, replace the code with:

   ```js
   function doPost(e) {
     const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
     const d = JSON.parse(e.postData.contents);
     const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
     sheet.appendRow(headers.map(h => d[h] ?? ''));
     return ContentService.createTextOutput('ok');
   }
   ```
3. **Deploy → New deployment → Web app**. Execute as: *Me*. Who has access: *Anyone*.
4. Copy the web app URL into `rsvpEndpoint` in `index.html`.

Every RSVP becomes a new row. Guests who resubmit create a new row, so the latest row per name is their current answer.

## 3. Deploy to Vercel

In Vercel: **Add New → Project → Import** this GitHub repo. Framework preset: *Other*, no build command, output directory left blank. Every push to `main` redeploys automatically.

Optionally attach a custom domain in the project's **Settings → Domains**.

## 4. Make the QR code

Open `https://<your-site>/qr.html`. It pre-fills the site URL. Click **Download PNG** and send it to your stationer. Test-scan it from the printed proof before the full print run.
