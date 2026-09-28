import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  LEAD_ID_PATTERN,
  TRACKING_KEYS,
  TRACKING_MAX_LENGTH,
  limparTexto,
  nomeValido,
  normalizarTel,
  telValido,
  type LeadRequest,
  type LeadResponse,
  type Tracking,
} from "@/lib/lead";
import { calcular, respostasValidas } from "@/lib/quiz/calc";
import { montarLinha } from "@/lib/sheet-row";

/** Binding de rate limit do Worker (declarado no wrangler.jsonc). */
type RateLimiter = { limit(options: { key: string }): Promise<{ success: boolean }> };

declare global {
  interface CloudflareEnv {
    LEAD_RATE_LIMITER?: RateLimiter;
  }
}

/** Corpo máximo aceito: o lead legítimo tem ~2 KB. */
const MAX_BODY_BYTES = 16 * 1024;
/** Ninguém responde 7 perguntas e passa pela tela de análise em menos que isso. */
const MIN_SECONDS_IN_QUIZ = 5;

function json(body: LeadResponse, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function clientIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    ""
  );
}

/** Só aceita envios feitos a partir da própria LP (bloqueia formulários de outros sites). */
function mesmaOrigem(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") !== "cross-site";
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

async function dentroDoLimite(ip: string) {
  let limiter: RateLimiter | undefined;
  try {
    limiter = getCloudflareContext().env.LEAD_RATE_LIMITER;
  } catch {
    // `next dev` roda fora do Worker: sem binding, sem limite.
    return true;
  }
  if (!limiter || !ip) return true;
  const { success } = await limiter.limit({ key: ip });
  return success;
}

function lerTracking(value: unknown): Tracking {
  const out: Tracking = {};
  if (!value || typeof value !== "object") return out;
  const src = value as Record<string, unknown>;
  for (const k of TRACKING_KEYS) {
    const v = src[k];
    if (typeof v === "string" && v.trim()) out[k] = limparTexto(v).slice(0, TRACKING_MAX_LENGTH);
  }
  return out;
}

/** Valida o corpo e devolve o lead normalizado, ou null se algo não bater. */
function lerLead(body: unknown): LeadRequest | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.lead_id !== "string" || !LEAD_ID_PATTERN.test(b.lead_id)) return null;
  if (typeof b.nome !== "string" || !nomeValido(b.nome)) return null;
  if (typeof b.whatsapp !== "string" || !telValido(b.whatsapp)) return null;
  if (!respostasValidas(b.respostas)) return null;
  const segundos = typeof b.segundos_no_quiz === "number" && Number.isFinite(b.segundos_no_quiz) ? Math.round(b.segundos_no_quiz) : 0;

  return {
    lead_id: b.lead_id,
    nome: limparTexto(b.nome),
    whatsapp: normalizarTel(b.whatsapp),
    respostas: {
      base: b.respostas.base,
      ticket: b.respostas.ticket,
      inativos: b.respostas.inativos,
      ultima_campanha: b.respostas.ultima_campanha,
      dedicado: b.respostas.dedicado,
      cadencia: b.respostas.cadencia,
      crm: b.respostas.crm,
    },
    tracking: lerTracking(b.tracking),
    segundos_no_quiz: Math.max(0, Math.min(segundos, 86_400)),
    website: typeof b.website === "string" ? b.website : "",
  };
}

export async function POST(request: Request) {
  if (!mesmaOrigem(request)) return json({ ok: false, error: "forbidden" }, 403);

  const ip = clientIp(request);
  if (!(await dentroDoLimite(ip))) return json({ ok: false, error: "rate_limited" }, 429);

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ ok: false, error: "invalid" }, 415);
  }
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return json({ ok: false, error: "invalid" }, 413);

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return json({ ok: false, error: "invalid" }, 413);
    body = JSON.parse(text);
  } catch {
    return json({ ok: false, error: "invalid" }, 400);
  }

  const lead = lerLead(body);
  if (!lead) return json({ ok: false, error: "invalid" }, 400);

  // Robôs: responde como se tivesse dado certo, mas não grava nada.
  if (lead.website.trim() !== "" || lead.segundos_no_quiz < MIN_SECONDS_IN_QUIZ) {
    console.warn("[lead] descartado como robô", { honeypot: lead.website !== "", segundos: lead.segundos_no_quiz });
    return json({ ok: true });
  }

  const url = process.env.SHEETS_WEBHOOK_URL;
  const token = process.env.SHEETS_WEBHOOK_TOKEN;
  if (!url || !token) {
    console.error("[lead] SHEETS_WEBHOOK_URL/SHEETS_WEBHOOK_TOKEN não configurados");
    return json({ ok: false, error: "unavailable" }, 503);
  }

  // O resultado é recalculado aqui a partir das respostas: o que vai para a planilha não depende do navegador.
  const resultado = calcular(lead.respostas);
  const linha = montarLinha(lead, resultado, {
    agora: new Date(),
    origin: new URL(request.url).origin,
    ip,
    userAgent: (request.headers.get("user-agent") ?? "").slice(0, TRACKING_MAX_LENGTH),
  });

  try {
    // O Apps Script responde com um redirect para o resultado; o fetch segue sozinho.
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, lead: linha }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!res.ok || !data?.ok) {
      console.error("[lead] planilha recusou o lead", res.status, data?.error);
      return json({ ok: false, error: "unavailable" }, 502);
    }
  } catch (error) {
    console.error("[lead] falha ao chamar a planilha", error);
    return json({ ok: false, error: "unavailable" }, 502);
  }

  return json({ ok: true });
}
