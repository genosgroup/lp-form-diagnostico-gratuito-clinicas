/**
 * Parâmetros gerais da LP. Nada aqui é segredo: tudo vai para o navegador.
 * Segredos (URL e token da planilha) ficam só no Worker; ver .env.example.
 */

/**
 * A LP responde em genosgroup.com.br/diagnostico: a rota `genosgroup.com.br/diagnostico*`
 * aponta para este Worker (painel da Cloudflare) e o Next serve tudo sob este basePath.
 */
export const BASE_PATH = "/diagnostico";
export const SITE_URL = "https://genosgroup.com.br";

/** Caminho de um arquivo de public/ (o <img> não recebe o basePath sozinho). */
export function asset(path: string) {
  return `${BASE_PATH}${path}`;
}

export const QUIZ_VERSION = "receita-oculta-v1.0";

/** WhatsApp da Genos (DDI + DDD + número, só dígitos) que recebe o CTA final. */
export const WHATSAPP_GENOS = "5521985237650";

export const PRIVACY_URL = "https://genosgroup.com.br/politica-de-privacidade/";

/** Texto exibido junto ao botão de envio; também é gravado na planilha como prova do consentimento. */
export const CONSENT_TEXT =
  "Ao clicar em “Ver meu diagnóstico”, você concorda em receber contato da Genos Group pelo WhatsApp sobre este diagnóstico.";

export const TIME_ZONE = "America/Sao_Paulo";
