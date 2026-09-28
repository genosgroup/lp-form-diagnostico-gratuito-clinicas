/**
 * Recebe os leads da LP "Diagnóstico de Receita Oculta" e grava na planilha.
 *
 * Instalação (detalhes no README, seção "Planilha"):
 *   1. Na planilha: Extensões > Apps Script, cole este arquivo e salve.
 *   2. Rode a função `configurar` uma vez (autorize) e copie o token do log.
 *   3. Implantar > Nova implantação > App da Web
 *        Executar como: Eu · Quem pode acessar: Qualquer pessoa
 *   4. No Worker, configure os secrets SHEETS_WEBHOOK_URL (URL /exec) e
 *      SHEETS_WEBHOOK_TOKEN (o token do passo 2).
 *
 * A URL do app fica só no Worker e toda chamada precisa do token; sem ele,
 * nada é gravado.
 */

const SHEET_NAME = 'Leads';
const ID_HEADER = 'ID do diagnóstico';
const TOKEN_PROPERTY = 'LEAD_TOKEN';
const MAX_CELL = 5000;

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const token = PropertiesService.getScriptProperties().getProperty(TOKEN_PROPERTY);
    if (!token || typeof body.token !== 'string' || !igual_(body.token, token)) {
      return resposta_({ ok: false, error: 'unauthorized' });
    }
    const lead = body.lead;
    if (!lead || typeof lead !== 'object' || Array.isArray(lead) || !lead[ID_HEADER]) {
      return resposta_({ ok: false, error: 'invalid' });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const sheet = aba_();
      const headers = cabecalho_(sheet, Object.keys(lead));
      // O site reenvia leads que falharam; o mesmo ID nunca vira duas linhas.
      if (jaExiste_(sheet, headers, lead[ID_HEADER])) return resposta_({ ok: true, duplicate: true });
      sheet.appendRow(headers.map(function (h) { return celula_(lead[h]); }));
    } finally {
      lock.releaseLock();
    }
    return resposta_({ ok: true });
  } catch (err) {
    console.error(err);
    return resposta_({ ok: false, error: 'server' });
  }
}

/** Rode uma vez pelo editor: cria a aba e gera o token (se ainda não houver). */
function configurar() {
  const props = PropertiesService.getScriptProperties();
  let token = props.getProperty(TOKEN_PROPERTY);
  if (!token) {
    token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    props.setProperty(TOKEN_PROPERTY, token);
  }
  aba_();
  console.log('Token (use em SHEETS_WEBHOOK_TOKEN): ' + token);
}

/** Troca o token. Depois atualize o secret SHEETS_WEBHOOK_TOKEN no Worker. */
function trocarToken() {
  PropertiesService.getScriptProperties().deleteProperty(TOKEN_PROPERTY);
  configurar();
}

function aba_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Garante que todas as chaves do lead existam como coluna; as novas entram no fim. */
function cabecalho_(sheet, keys) {
  const lastCol = sheet.getLastColumn();
  const headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String) : [];
  const novas = keys.filter(function (k) { return headers.indexOf(k) === -1; });
  if (novas.length) {
    sheet.getRange(1, headers.length + 1, 1, novas.length).setValues([novas]).setFontWeight('bold');
    return headers.concat(novas);
  }
  return headers;
}

function jaExiste_(sheet, headers, id) {
  const col = headers.indexOf(ID_HEADER) + 1;
  const lastRow = sheet.getLastRow();
  if (col < 1 || lastRow < 2) return false;
  return !!sheet.getRange(2, col, lastRow - 1, 1).createTextFinder(String(id)).matchEntireCell(true).findNext();
}

/**
 * Evita injeção de fórmula (texto começando com = + - @) e mantém números longos,
 * como o WhatsApp, como texto.
 */
function celula_(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  const s = String(v).slice(0, MAX_CELL);
  if (/^[=+\-@\t\r]/.test(s) || /^\d{8,}$/.test(s)) return "'" + s;
  return s;
}

function igual_(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function resposta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
