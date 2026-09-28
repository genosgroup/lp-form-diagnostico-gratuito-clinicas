/**
 * Parâmetros gerais da LP. Nada aqui é segredo: tudo vai para o navegador.
 * Segredos (URL e token da planilha) ficam só no Worker; ver .env.example.
 */

export const QUIZ_VERSION = "receita-oculta-v1.0";

/** WhatsApp da Genos (DDI + DDD + número, só dígitos) que recebe o CTA final. */
export const WHATSAPP_GENOS = "5521985237650";

export const PRIVACY_URL = "https://genosgroup.com.br/politica-de-privacidade/";

/** Texto exibido junto ao botão de envio; também é gravado na planilha como prova do consentimento. */
export const CONSENT_TEXT =
  "Ao clicar em “Ver meu diagnóstico”, você concorda em receber contato da Genos Group pelo WhatsApp sobre este diagnóstico.";

export const TIME_ZONE = "America/Sao_Paulo";
