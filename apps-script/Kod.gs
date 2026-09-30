/**
 * Věštírna u Jolandy — backend v Google Apps Scriptu
 *
 * Co to dělá:
 *  1) doPost  – přijme objednávku z webu, zapíše ji do Google Sheetu,
 *               pošle vám mail s celým výkladem a odkazem „Odeslat výklad zákazníkovi“,
 *               a zákazníkovi pošle potvrzení, že objednávka dorazila.
 *  2) doGet   – když v mailu kliknete na odkaz (až uvidíte platbu na účtu),
 *               odešle celý výklad zákazníkovi a v Sheetu si to poznamená.
 *
 * NASAZENÍ (5 minut):
 *  1. Vytvořte nový Google Sheet (např. „Věštírna – objednávky“).
 *  2. Rozšíření → Apps Script. Smažte ukázkový kód a vložte celý tento soubor.
 *  3. Níže v CONFIG vyplňte OWNER_EMAIL a vymyslete si vlastní TOKEN.
 *  4. Nasadit → Nové nasazení → typ „Webová aplikace“:
 *       Spustit jako: Já
 *       Kdo má přístup: Kdokoli
 *     Potvrďte oprávnění (Google jednou varuje, že aplikace není ověřená → Rozšířené → Přejít).
 *  5. Zkopírujte URL nasazení (končí /exec) a vložte ji do CONFIG.endpoint v index.html.
 *
 * Pozn.: po každé úpravě kódu musíte vytvořit NOVOU VERZI nasazení,
 * jinak běží pořád ta stará.
 */

var CONFIG = {
  OWNER_EMAIL: 'ales.cermak79@gmail.com',   // kam chodí objednávky
  SENDER_NAME: 'Věštírna u Jolandy',        // jméno odesílatele
  TOKEN: 'zmente-me-na-neco-nahodneho',     // tajný klíč v odkazu pro odeslání výkladu
  SHEET_NAME: 'Objednávky'
};

var HEADERS = ['Přijato','VS','Jméno','E-mail','Datum narození','Znamení','Oblast',
               'Doplňující odpovědi','Otázka','Karty','Cena','Výklad','Odesláno zákazníkovi'];

/* ---------- příjem objednávky ---------- */
function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (!d || !d.email || !d.vs) return json({ok: false, error: 'chybí data'});

    var sh = sheet();
    sh.appendRow([
      new Date(), "'" + d.vs, d.name || '', d.email, d.birth || '', d.znameni || '',
      d.focusLabel || d.focus || '', (d.topics || []).join(' | '), d.question || '',
      (d.cards || []).join(' | '), d.price || '', d.reading || '', ''
    ]);

    notifyOwner(d);
    confirmCustomer(d);
    return json({ok: true});
  } catch (err) {
    return json({ok: false, error: String(err)});
  }
}

/* ---------- odeslání výkladu po potvrzení platby ---------- */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.a !== 'send') return html('Věštírna u Jolandy', 'Backend běží. Objednávky přicházejí přes POST.');
  if (p.t !== CONFIG.TOKEN) return html('Neplatný odkaz', 'Klíč v odkazu nesedí. Zkuste odkaz z mailu znovu.');

  var sh = sheet(), rows = sh.getDataRange().getValues();
  for (var i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][1]).replace(/^'/, '') === String(p.vs)) {
      if (rows[i][12]) return html('Už odesláno', 'Výklad pro VS ' + p.vs + ' byl odeslán ' + rows[i][12] + '.');
      MailApp.sendEmail({
        to: rows[i][3],
        name: CONFIG.SENDER_NAME,
        replyTo: CONFIG.OWNER_EMAIL,
        subject: 'Tvůj výklad od Jolandy',
        body: rows[i][11]
      });
      var when = Utilities.formatDate(new Date(), 'Europe/Prague', 'd. M. yyyy H:mm');
      sh.getRange(i + 1, 13).setValue(when);
      return html('Odesláno', 'Výklad pro VS ' + p.vs + ' právě odešel na ' + rows[i][3] + '.');
    }
  }
  return html('Nenalezeno', 'Objednávku s VS ' + p.vs + ' jsem v tabulce nenašel.');
}

/* ---------- maily ---------- */
function notifyOwner(d) {
  var link = ScriptApp.getService().getUrl() + '?a=send&vs=' + encodeURIComponent(d.vs) +
             '&t=' + encodeURIComponent(CONFIG.TOKEN);
  var body =
    'NOVÁ OBJEDNÁVKA VÝKLADU\n\n' +
    'Jméno: ' + (d.name || '') + '\n' +
    'E-mail: ' + d.email + '\n' +
    'Narozen/a: ' + (d.birth || '') + ' (' + (d.znameni || '') + ')\n' +
    'Oblast: ' + (d.focusLabel || d.focus || '') + '\n' +
    (d.topics && d.topics.length ? 'Doplnil/a: ' + d.topics.join(' | ') + '\n' : '') +
    'Karty: ' + (d.cards || []).join(' | ') + '\n' +
    'Otázka: ' + (d.question || '') + '\n\n' +
    'ČEKÁ SE PLATBA: ' + (d.price || '') + ' Kč, VS ' + d.vs + '\n\n' +
    'Až platbu uvidíte na účtu, klikněte na tento odkaz a výklad odejde zákazníkovi:\n' +
    link + '\n\n' +
    '--- CELÝ VÝKLAD (můžete ho před odesláním upravit přímo v tabulce, sloupec „Výklad“) ---\n\n' +
    (d.reading || '');

  MailApp.sendEmail({
    to: CONFIG.OWNER_EMAIL,
    name: CONFIG.SENDER_NAME,
    subject: 'Objednávka výkladu · VS ' + d.vs + ' · ' + (d.name || ''),
    body: body
  });
}

function confirmCustomer(d) {
  var body =
    'Milý/á ' + (d.name || '') + ',\n\n' +
    'tvoje otázka dorazila a karty už leží na stole. Jakmile se platba připíše, ' +
    'Jolanda výklad dopíše a pošle ti ho na tuto adresu — nejpozději do 24 hodin.\n\n' +
    'Tvoje otázka:\n„' + (d.question || '') + '“\n\n' +
    'Vytažené karty:\n' + (d.cards || []).join('\n') + '\n\n' +
    'Platba: ' + (d.price || '') + ' Kč, variabilní symbol ' + d.vs + '\n' +
    'Kdyby se cokoli zadrhlo, odpověz na tento e-mail a uveď variabilní symbol.\n\n' +
    'Věštírna u Jolandy\n' +
    'Výklad je určen pro zábavu a inspiraci, nenahrazuje odbornou radu.';

  MailApp.sendEmail({
    to: d.email,
    name: CONFIG.SENDER_NAME,
    replyTo: CONFIG.OWNER_EMAIL,
    subject: 'Karty leží na stole · VS ' + d.vs,
    body: body
  });
}

/* ---------- pomocné ---------- */
function sheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(CONFIG.SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}
function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function html(title, text) {
  return HtmlService.createHtmlOutput(
    '<meta charset="utf-8"><body style="font-family:system-ui,sans-serif;background:#140a17;color:#f2e6d2;padding:40px">' +
    '<h1 style="font-weight:400">' + title + '</h1><p>' + text + '</p></body>');
}

/* Ruční test: spusťte tuto funkci v editoru, ať Google vyžádá oprávnění
   a ať si ověříte, že vám maily chodí. */
function test() {
  doPost({postData: {contents: JSON.stringify({
    name: 'Testovací Aleš', email: CONFIG.OWNER_EMAIL, birth: '1979-05-14', znameni: 'Býk',
    focusLabel: 'práce a peníze', topics: ['O co jde? Vlastní projekt'],
    question: 'Testovací otázka.', cards: ['Co bylo: Kniha', 'Kde stojíš: Měsíc', 'Kam to míří: Koruna'],
    vs: '1234567890', price: 149, reading: 'Testovací text výkladu.'
  })}});
}
