/**
 * RSVP receiver + manager feed for the wedding site.
 * Paste into the RSVP sheet via Extensions → Apps Script, then Deploy → New deployment → Web app
 * (Execute as: Me · Who has access: Anyone). Put the web-app URL in CONFIG.rsvpEndpoint in index.html.
 *
 * Manager PIN: Project Settings (gear) → Script Properties → add MANAGER_PIN. It lives only in
 * Google, never in this file or the website, so the public repo can't reveal it.
 *
 * Each RSVP becomes a row. If the same email RSVPs again, their row is updated instead of duplicated.
 */
const COLUMNS = [
  ['submitted', 'Submitted'],
  ['name', 'Name(s)'],
  ['email', 'Email'],
  ['attending', 'Attending'],
  ['guests', 'Guests'],
  ['arrival', 'Arriving'],
  ['events', 'Events'],
  ['hotel', 'Staying at Le Petit Pali'],
  ['dietary', 'Dietary'],
  ['note', 'Note'],
];
const MAX_FAILS = 8;          // wrong PINs allowed…
const LOCKOUT_SECONDS = 900;  // …per 15 minutes

function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  if (d.action === 'list') return listRsvps(d.pin);
  return saveRsvp(d);
}

function saveRsvp(d) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(COLUMNS.map(c => c[1]));

    const email = String(d.email || '').trim().toLowerCase();
    if (!String(d.name || '').trim() || !email) return ContentService.createTextOutput('missing name or email');

    // Store answers exactly as typed: no date/number auto-conversion, no formulas
    const row = COLUMNS.map(([key]) => {
      const v = String(d[key] ?? '').slice(0, 1000);
      return /^[=+\-@]/.test(v) ? "'" + v : v;
    });
    row[0] = new Date();

    const last = sheet.getLastRow();
    let target = 0;
    if (last > 1) {
      const emails = sheet.getRange(2, 3, last - 1, 1).getDisplayValues();
      const i = emails.findIndex(r => String(r[0]).trim().toLowerCase() === email);
      if (i >= 0) target = i + 2;
    }
    const range = sheet.getRange(target || last + 1, 1, 1, row.length);
    range.offset(0, 1, 1, row.length - 1).setNumberFormat('@');
    range.offset(0, 0, 1, 1).setNumberFormat('ddd mmm d, yyyy h:mm am/pm');
    range.setValues([row]);

    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

function listRsvps(pin) {
  const expected = PropertiesService.getScriptProperties().getProperty('MANAGER_PIN');
  if (!expected) return json({ error: 'Manager PIN has not been set up yet.' });

  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get('pin_fails') || 0);
  if (fails >= MAX_FAILS) return json({ error: 'Too many attempts. Try again in 15 minutes.' });
  if (String(pin || '') !== expected) {
    cache.put('pin_fails', String(fails + 1), LOCKOUT_SECONDS);
    return json({ error: 'Incorrect PIN.' });
  }
  cache.remove('pin_fails');

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const values = sheet.getDataRange().getDisplayValues().slice(1);
  const ts = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues() : [];
  const rows = values
    .map((r, i) => {
      const o = Object.fromEntries(COLUMNS.map(([key], c) => [key, r[c]]));
      o.submittedAt = ts[i] && ts[i][0] instanceof Date ? ts[i][0].toISOString() : '';
      return o;
    })
    .filter(o => o.name || o.email);
  return json({ rows });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
