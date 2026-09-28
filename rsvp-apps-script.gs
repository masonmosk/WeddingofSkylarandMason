/**
 * RSVP receiver for the wedding site.
 * Paste into the RSVP sheet via Extensions → Apps Script, then Deploy → New deployment → Web app
 * (Execute as: Me · Who has access: Anyone). Put the web-app URL in CONFIG.rsvpEndpoint in index.html.
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

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(COLUMNS.map(c => c[1]));

    const d = JSON.parse(e.postData.contents);
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
