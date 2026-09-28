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
 *
 * Colunas: a planilha decide. Na aba vazia, o primeiro lead cria o cabeçalho
 * completo; depois disso, só as colunas que estão no cabeçalho são preenchidas.
 * Pode apagar ou reordenar colunas à vontade. Para trazer uma de volta, digite
 * o nome exato dela no cabeçalho ou rode `restaurarColunas`. A coluna
 * "ID do diagnóstico" é sempre mantida, porque é ela que evita linhas duplicadas.
 */

const SHEET_NAME = 'Leads';
const ID_HEADER = 'ID do diagnóstico';
const TOKEN_PROPERTY = 'LEAD_TOKEN';
const COLUNAS_PROPERTY = 'COLUNAS_DO_SITE';
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
      const keys = Object.keys(lead);
      const headers = cabecalho_(sheet, keys);
      // Guarda as colunas que o site envia, para o `restaurarColunas`.
      PropertiesService.getScriptProperties().setProperty(COLUNAS_PROPERTY, JSON.stringify(keys));
      // O site reenvia leads que falharam; o mesmo ID nunca vira duas linhas.
      if (jaExiste_(sheet, headers, lead[ID_HEADER])) return resposta_({ ok: true, duplicate: true });
      sheet.appendRow(headers.map(function (h) { return h ? celula_(lead[h]) : ''; }));
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

/** Rode pelo editor para trazer de volta, no fim do cabeçalho, as colunas do site que foram apagadas. */
function restaurarColunas() {
  const salvas = JSON.parse(PropertiesService.getScriptProperties().getProperty(COLUNAS_PROPERTY) || '[]');
  if (!salvas.length) {
    console.log('Ainda não chegou nenhum lead depois desta versão do script; nada a restaurar.');
    return;
  }
  const sheet = aba_();
  const headers = lerCabecalho_(sheet);
  const faltando = salvas.filter(function (k) { return headers.indexOf(k) === -1; });
  if (faltando.length) sheet.getRange(1, headers.length + 1, 1, faltando.length).setValues([faltando]).setFontWeight('bold');
  console.log(faltando.length ? 'Colunas restauradas: ' + faltando.join(', ') : 'Nenhuma coluna faltando.');
}

function lerCabecalho_(sheet) {
  const lastCol = sheet.getLastColumn();
  return lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); }) : [];
}

/**
 * A planilha decide as colunas: só as que estão no cabeçalho são preenchidas, em qualquer ordem.
 * Numa aba vazia, cria o cabeçalho completo. A coluna do ID é recriada se for apagada.
 */
function cabecalho_(sheet, keys) {
  const headers = lerCabecalho_(sheet);
  if (headers.every(function (h) { return !h; })) {
    sheet.getRange(1, 1, 1, keys.length).setValues([keys]).setFontWeight('bold');
    return keys.slice();
  }
  if (headers.indexOf(ID_HEADER) === -1) {
    sheet.getRange(1, headers.length + 1).setValue(ID_HEADER).setFontWeight('bold');
    return headers.concat([ID_HEADER]);
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
