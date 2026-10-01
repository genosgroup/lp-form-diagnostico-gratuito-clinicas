/**
 * Rastreamento no navegador: origem do visitante (UTMs e click IDs) e eventos do funil.
 * Cada evento vai para três destinos: o window.dataLayer (para um GTM futuro
 * encontrar tudo pronto), o GA4 e o Pixel da Meta.
 *
 * O GA4 entrou depois: por um tempo esta página carregou sem tag nenhuma, e
 * estes eventos eram empilhados no dataLayer que ninguém lia. Mandar para os
 * três não custa nada e evita que a página volte a medir no vazio se uma das
 * tags for removida.
 */
import { QUIZ_VERSION } from "./site";
import { TRACKING_KEYS, TRACKING_MAX_LENGTH, type Tracking } from "./lead";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

const URL_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id", "gclid", "gbraid", "wbraid", "fbclid"] as const;
const STORAGE_KEY = "ro_origem";

function lerCookie(nome: string) {
  const c = document.cookie.split(";").map((s) => s.trim()).find((s) => s.startsWith(nome + "="));
  return c ? decodeURIComponent(c.slice(nome.length + 1)) : undefined;
}

function limitar(t: Tracking): Tracking {
  const out: Tracking = {};
  for (const k of TRACKING_KEYS) {
    const v = t[k];
    if (typeof v === "string" && v) out[k] = v.slice(0, TRACKING_MAX_LENGTH);
  }
  return out;
}

/**
 * Lê a origem da visita. Vale o primeiro acesso da sessão: se a pessoa recarregar
 * a página sem os parâmetros, as UTMs de quando ela chegou continuam valendo.
 */
export function coletarTracking(): Tracking {
  let t: Tracking = {};
  try {
    const q = new URLSearchParams(window.location.search);
    const daUrl: Tracking = {};
    for (const k of URL_KEYS) {
      const v = q.get(k);
      if (v) daUrl[k] = v;
    }
    const salvo = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null") as Tracking | null;
    if (Object.keys(daUrl).length || !salvo) {
      t = { ...daUrl, landing_page: window.location.href, referrer: document.referrer || "" };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(limitar(t)));
    } else {
      t = salvo;
    }
  } catch {
    // sessionStorage bloqueado: fica só com o que está na URL agora.
    t = { landing_page: window.location.href, referrer: document.referrer || "" };
  }
  try {
    const fbp = lerCookie("_fbp");
    const fbc = lerCookie("_fbc");
    if (fbp) t.fbp = fbp;
    if (fbc) t.fbc = fbc;
    else if (t.fbclid) t.fbc = "fb.1." + Date.now() + "." + t.fbclid;
  } catch {}
  return limitar(t);
}

export function track(evento: string, params: Record<string, unknown> = {}, leadId?: string | null) {
  const ev = { event: evento, ...params, lead_id: leadId ?? undefined, quiz_version: QUIZ_VERSION, ts: new Date().toISOString() };
  try {
    (window.dataLayer = window.dataLayer || []).push(ev);
  } catch {}
  try {
    window.gtag?.("event", evento, params);
  } catch {}
  try {
    window.fbq?.("trackCustom", evento, params);
  } catch {}
}
