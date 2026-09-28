/**
 * Contrato entre o formulário (navegador) e a rota /api/lead (Worker).
 * As validações daqui rodam dos dois lados, para o servidor nunca recusar
 * um lead que o formulário aceitou (e vice-versa).
 */
import type { Answers } from "./quiz/calc";

/** Parâmetros de origem guardados junto com o lead. */
export const TRACKING_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
  "fbc",
  "fbp",
  "landing_page",
  "referrer",
] as const;

export type TrackingKey = (typeof TRACKING_KEYS)[number];
export type Tracking = Partial<Record<TrackingKey, string>>;

export const TRACKING_MAX_LENGTH = 500;

export type LeadRequest = {
  lead_id: string;
  nome: string;
  /** Só dígitos, com DDD e sem o 55. */
  whatsapp: string;
  respostas: Answers;
  tracking: Tracking;
  segundos_no_quiz: number;
  /** Honeypot: campo invisível que só robôs preenchem. */
  website: string;
};

export type LeadResponse = { ok: true } | { ok: false; error: "invalid" | "forbidden" | "rate_limited" | "unavailable" };

/** Formato do código do diagnóstico: RO-XXXX-XXX, sem 0/O/1/I/L. */
export const LEAD_ID_PATTERN = /^RO-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{3}$/;

const LEAD_ID_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function gerarLeadId() {
  const n = new Uint8Array(7);
  crypto.getRandomValues(n);
  let out = "";
  for (let i = 0; i < 7; i++) {
    out += LEAD_ID_ALPHABET[n[i] % LEAD_ID_ALPHABET.length];
    if (i === 3) out += "-";
  }
  return "RO-" + out;
}

/** Remove caracteres de controle e espaços repetidos. */
export function limparTexto(v: string) {
  return v.replace(/[\u0000-\u001f\u007f-\u009f]/g, " ").replace(/\s+/g, " ").trim();
}

export const NOME_MAX = 80;

/** Nome: 2 a 80 caracteres, com pelo menos 2 letras e sem cara de fórmula ou HTML. */
export function nomeValido(v: string) {
  const s = limparTexto(v);
  return (
    s.length >= 2 &&
    s.length <= NOME_MAX &&
    (s.match(/\p{L}/gu) ?? []).length >= 2 &&
    !/[<>]/.test(s) &&
    !/^[=+\-@]/.test(s)
  );
}

export function soDigitos(v: string) {
  return v.replace(/\D/g, "");
}

/** Só os dígitos do telefone com DDD, sem o 55 do país. */
export function normalizarTel(v: string) {
  return soDigitos(v).replace(/^55(?=\d{10,11}$)/, "");
}

/** Celular ou fixo brasileiro com DDD (10 ou 11 dígitos; celular começa com 9). Aceita o 55 na frente. */
export function telValido(v: string) {
  const d = normalizarTel(v);
  if (!(d.length === 10 || d.length === 11)) return false;
  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  if (d.length === 11 && d[2] !== "9") return false;
  return true;
}

/** Máscara (21) 99999-9999 aplicada enquanto a pessoa digita. */
export function mascaraTel(v: string) {
  const d = normalizarTel(v).slice(0, 11);
  if (d.length <= 2) return d.length ? "(" + d : "";
  if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
  if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
  return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
}
