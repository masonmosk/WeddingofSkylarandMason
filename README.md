# Wedding Weekend Site — Carmel, May 2–4, 2027

A single-file static site (`index.html`) with the itinerary, travel info, things to do, FAQ and an RSVP form. Images and the looping hero video (`hero.mp4`, with `hero-poster.jpg` as its first frame) live in `images/`. `qr.html` generates the QR code for the invitations. No build step.

## 1. Personalize

Open `index.html` and edit the `CONFIG` block near the bottom:

```js
rsvpEndpoint: '',      // Google Apps Script URL (step 2)
rsvpEmail: '',         // fallback email if no endpoint is set
```

Placeholders to confirm as plans firm up: welcome dinner venue/time, ceremony beach (currently Carmel River State Beach), hotel booking/group rate, RSVP deadline (March 1, 2027), registry.

## 2. Collect RSVPs in a Google Sheet

Sheet: **Wedding RSVPs — Mason & Skylar** (Google Drive).

1. Open the sheet → **Extensions → Apps Script**. Replace the code with the contents of `rsvp-apps-script.gs` and save.
2. **Deploy → New deployment** → type **Web app**. Execute as: *Me*. Who has access: *Anyone*. Authorize when prompted.
3. Copy the web app URL (ends in `/exec`) into `rsvpEndpoint` in `index.html`, commit, push.

Each RSVP becomes a row; if the same email submits again, their row is updated rather than duplicated.
If you edit the script later, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.

### Manager view

The footer's **Manager** link (or `/#manager`) shows RSVPs, headcounts per event, search and CSV export. The PIN is checked by the Apps Script against the `MANAGER_PIN` Script Property (Apps Script → Project Settings → Script Properties) — it is never in this repo. Eight wrong PINs lock it for 15 minutes.

## 3. Deploy to Vercel

In Vercel: **Add New → Project → Import** this GitHub repo. Framework preset: *Other*, no build command, output directory left blank. Every push to `main` redeploys automatically.

Optionally attach a custom domain in the project's **Settings → Domains**.

## 4. Make the QR code

Open `https://<your-site>/qr.html`. It pre-fills the site URL. Click **Download PNG** and send it to your stationer. Test-scan it from the printed proof before the full print run.
