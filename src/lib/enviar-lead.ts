/**
 * Envio do lead para /api/lead. Se a rede ou a planilha falharem, o lead fica
 * guardado neste navegador e é reenviado na próxima visita (a planilha ignora
 * IDs repetidos, então reenviar é seguro).
 */
import type { LeadRequest, LeadResponse } from "./lead";

const PENDENTES_KEY = "ro_pendentes";
const PENDENTE_VALIDADE_MS = 7 * 24 * 60 * 60 * 1000;

type Pendente = { lead: LeadRequest; em: number };

function lerPendentes(): Pendente[] {
  try {
    const l = JSON.parse(localStorage.getItem(PENDENTES_KEY) || "[]") as Pendente[];
    return Array.isArray(l) ? l.filter((p) => p && p.lead && Date.now() - p.em < PENDENTE_VALIDADE_MS) : [];
  } catch {
    return [];
  }
}

function salvarPendentes(l: Pendente[]) {
  try {
    if (l.length) localStorage.setItem(PENDENTES_KEY, JSON.stringify(l.slice(-3)));
    else localStorage.removeItem(PENDENTES_KEY);
  } catch {}
}

function guardarPendente(lead: LeadRequest) {
  salvarPendentes([...lerPendentes().filter((p) => p.lead.lead_id !== lead.lead_id), { lead, em: Date.now() }]);
}

/** "ok": gravado · "retry": falha temporária (fica pendente) · "rejected": dados recusados (não adianta reenviar). */
type Resultado = "ok" | "retry" | "rejected";

async function post(lead: LeadRequest): Promise<Resultado> {
  try {
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
      keepalive: true,
      signal: AbortSignal.timeout(20_000),
    });
    const data = (await res.json().catch(() => null)) as LeadResponse | null;
    if (res.ok && data?.ok) return "ok";
    return res.status >= 500 || res.status === 429 ? "retry" : "rejected";
  } catch {
    return "retry";
  }
}

export async function enviarLead(lead: LeadRequest): Promise<boolean> {
  const r = await post(lead);
  if (r === "retry") guardarPendente(lead);
  return r === "ok";
}

export async function reenviarPendentes() {
  const l = lerPendentes();
  salvarPendentes(l);
  for (const p of l) {
    const r = await post(p.lead);
    if (r !== "retry") salvarPendentes(lerPendentes().filter((x) => x.lead.lead_id !== p.lead.lead_id));
  }
}
