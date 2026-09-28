/**
 * Monta a linha que vai para a planilha. Roda só no Worker (rota /api/lead).
 *
 * As chaves são os títulos das colunas: o Apps Script cria o cabeçalho na
 * primeira gravação, na ordem abaixo, e acrescenta no fim qualquer coluna nova.
 */
import { BASE_PATH, CONSENT_TEXT, PRIVACY_URL, QUIZ_VERSION, TIME_ZONE } from "./site";
import { codigoCurto, dataCurta, fmtBRL, fmtN, pctTxt } from "./format";
import type { LeadRequest } from "./lead";
import { codificarRespostas, labelDe, type Resultado } from "./quiz/calc";

export type SheetRow = Record<string, string | number>;

function dataHora(d: Date) {
  return d.toLocaleString("pt-BR", { timeZone: TIME_ZONE, dateStyle: "short", timeStyle: "medium" }).replace(",", "");
}

/** Texto pronto para o time mandar pelo WhatsApp (mesmo resumo que o lead vê na tela). */
export function mensagemWhatsapp(nome: string, x: Resultado) {
  const c = x.cenarios;
  return (
    `*Diagnóstico de Receita Oculta · ${nome}*\n\n` +
    `Índice de oportunidade: *${x.score}/100* (${x.classificacao.toLowerCase()})\n\n` +
    `Base estimada: ~${fmtN(x.base)} pacientes\n` +
    `Potencialmente inativos: ~${fmtN(x.baseReativavel)} (${pctTxt(x.pctInativo)})\n\n` +
    "Simulação de receita com reativação:\n" +
    `• Conservador (${pctTxt(c.conservador.taxa)}): ${fmtBRL(c.conservador.receita)}\n` +
    `• Intermediário (${pctTxt(c.intermediario.taxa)}): *${fmtBRL(c.intermediario.receita)}*\n` +
    `• Alta performance (${pctTxt(c.alta.taxa)}): ${fmtBRL(c.alta.receita)}\n\n` +
    `Principais gargalos:\n1. ${x.gargalos[0]}\n2. ${x.gargalos[1]}\n3. ${x.gargalos[2]}\n\n` +
    "_Simulação matemática baseada nas suas respostas. Não constitui promessa ou garantia de faturamento._"
  ).replace(/\u00a0/g, " ");
}

/** Link do card 1080×1350 (imagem do diagnóstico para enviar no WhatsApp). */
export function cardUrl(origin: string, lead: LeadRequest, agora: Date) {
  const q = new URLSearchParams({
    n: lead.nome,
    c: lead.lead_id,
    d: dataCurta(agora),
    r: codificarRespostas(lead.respostas),
  });
  return `${origin}${BASE_PATH}/card?${q.toString()}`;
}

export function montarLinha(lead: LeadRequest, x: Resultado, meta: { agora: Date; origin: string; ip: string; userAgent: string }): SheetRow {
  const r = lead.respostas;
  const c = x.cenarios;
  const t = lead.tracking;
  const nbsp = (s: string) => s.replace(/\u00a0/g, " ");

  return {
    "Data/hora": dataHora(meta.agora),
    "ID do diagnóstico": codigoCurto(lead.lead_id),
    Nome: lead.nome,
    WhatsApp: "55" + lead.whatsapp,

    "Base de pacientes": nbsp(labelDe("base", r.base)),
    "Ticket médio": nbsp(labelDe("ticket", r.ticket)),
    "Base inativa (+6 meses)": nbsp(labelDe("inativos", r.inativos)),
    "Última campanha de reativação": labelDe("ultima_campanha", r.ultima_campanha),
    "Atendimento dedicado": labelDe("dedicado", r.dedicado),
    "Follow-up estruturado": labelDe("cadencia", r.cadencia),
    CRM: labelDe("crm", r.crm),

    "Índice de oportunidade": x.score,
    Classificação: x.classificacao,
    Temperatura: x.temperatura,
    "Maturidade da reativação": x.maturidade.nome,
    "Base estimada": x.base,
    "Base potencialmente inativa": x.baseReativavel,
    "Ticket considerado (R$)": x.ticketCalculo,
    "Cenário conservador (R$)": c.conservador.receita,
    "Cenário intermediário (R$)": c.intermediario.receita,
    "Cenário alta performance (R$)": c.alta.receita,
    "Pacientes reativados (intermediário)": c.intermediario.pacientes,
    "Gargalo 1": x.gargalos[0],
    "Gargalo 2": x.gargalos[1],
    "Gargalo 3": x.gargalos[2],

    utm_source: t.utm_source ?? "",
    utm_medium: t.utm_medium ?? "",
    utm_campaign: t.utm_campaign ?? "",
    utm_content: t.utm_content ?? "",
    utm_term: t.utm_term ?? "",
    utm_id: t.utm_id ?? "",
    gclid: t.gclid ?? "",
    gbraid: t.gbraid ?? "",
    wbraid: t.wbraid ?? "",
    fbclid: t.fbclid ?? "",
    fbc: t.fbc ?? "",
    fbp: t.fbp ?? "",
    "Página de entrada": t.landing_page ?? "",
    Referrer: t.referrer ?? "",

    "Tempo no quiz (s)": lead.segundos_no_quiz,
    "Mensagem para WhatsApp": mensagemWhatsapp(lead.nome, x),
    "Link do card": cardUrl(meta.origin, lead, meta.agora),
    "Consentimento WhatsApp": CONSENT_TEXT,
    "Política de privacidade": PRIVACY_URL,
    IP: meta.ip,
    "Agente de usuário": meta.userAgent,
    "Versão do quiz": QUIZ_VERSION,
  };
}
