/**
 * Motor de cálculo do diagnóstico. Roda no navegador (para mostrar o resultado)
 * e no Worker (que recalcula tudo antes de gravar na planilha, sem confiar no cliente).
 */
import {
  CALCULO,
  FAIXAS,
  GARGALOS,
  GARGALOS_RESERVA,
  PERGUNTAS,
  SCORE,
  TEMPERATURA,
  type QuestionId,
} from "./config";

export type Answers = Record<QuestionId, string>;

export type Severidade = "ok" | "warn" | "crit";

export type Cenario = { taxa: number; pacientes: number; receita: number };

export type Resultado = {
  base: number;
  pctInativo: number;
  ticket: number;
  ticketCalculo: number;
  baseReativavel: number;
  cenarios: { conservador: Cenario; intermediario: Cenario; alta: Cenario };
  score: number;
  partes: Record<QuestionId, number>;
  classificacao: string;
  faixaIdx: number;
  maturidade: { nome: string; sev: Severidade };
  estrutura: { dedicado: string; crm: string; sev: Severidade };
  gargalos: [string, string, string];
  temperatura: string;
};

export const QUESTION_IDS = PERGUNTAS.map((p) => p.id);

export function labelDe(pid: QuestionId, oid: string): string {
  const p = PERGUNTAS.find((x) => x.id === pid);
  return p?.opcoes.find((o) => o[0] === oid)?.[1] ?? "";
}

/** Confere se todas as perguntas foram respondidas com uma opção existente. */
export function respostasValidas(value: unknown): value is Answers {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return PERGUNTAS.every((p) => typeof r[p.id] === "string" && p.opcoes.some((o) => o[0] === r[p.id]));
}

/**
 * Respostas compactadas em um dígito por pergunta (índice da opção), na ordem das perguntas.
 * Usado no link do card para não aceitar textos livres na URL.
 */
export function codificarRespostas(r: Answers): string {
  return PERGUNTAS.map((p) => p.opcoes.findIndex((o) => o[0] === r[p.id])).join("");
}

export function decodificarRespostas(code: string): Answers | null {
  if (!/^\d+$/.test(code) || code.length !== PERGUNTAS.length) return null;
  const r: Partial<Answers> = {};
  for (let i = 0; i < PERGUNTAS.length; i++) {
    const opcao = PERGUNTAS[i].opcoes[Number(code[i])];
    if (!opcao) return null;
    r[PERGUNTAS[i].id] = opcao[0];
  }
  return r as Answers;
}

function arred(v: number) {
  const a = CALCULO.arredondarPara || 1;
  return Math.round(v / a) * a;
}

export function calcular(r: Answers): Resultado {
  const c = CALCULO;
  const base = c.basePontoMedio[r.base];
  const pct = c.percentualInativo[r.inativos];
  const ticket = c.ticketPontoMedio[r.ticket];
  const ticketCalculo = ticket * (c.fatorTicketReativacao || 1);
  const baseReativavel = Math.round(base * pct);
  const cen = (taxa: number): Cenario => {
    const pacientes = Math.round(baseReativavel * taxa);
    return { taxa, pacientes, receita: arred(pacientes * ticketCalculo) };
  };
  const cenarios = {
    conservador: cen(c.cenarios.conservador),
    intermediario: cen(c.cenarios.intermediario),
    alta: cen(c.cenarios.alta),
  };

  // Score
  const partes = {} as Record<QuestionId, number>;
  let total = 0;
  for (const k of Object.keys(SCORE) as QuestionId[]) {
    const v = SCORE[k][r[k]] || 0;
    partes[k] = v;
    total += v;
  }
  const score = Math.max(0, Math.min(100, Math.round(total)));
  const faixaIdx = Math.max(0, FAIXAS.findIndex((f) => score >= f[0] && score <= f[1]));
  const classificacao = FAIXAS[faixaIdx][2];

  // Lacuna estrutural -> maturidade (8..50)
  const lacuna = partes.ultima_campanha + partes.dedicado + partes.cadencia + partes.crm;
  const maturidade: Resultado["maturidade"] =
    lacuna <= 14
      ? { nome: "Estruturada", sev: "ok" }
      : lacuna <= 26
        ? { nome: "Em desenvolvimento", sev: "warn" }
        : lacuna <= 38
          ? { nome: "Inicial", sev: "warn" }
          : { nome: "Inexistente", sev: "crit" };
  const estrutura: Resultado["estrutura"] = {
    dedicado: ({ sim: "Pessoa dedicada", divide: "Função compartilhada", nao: "Sem responsável" } as Record<string, string>)[r.dedicado],
    crm: ({ sim: "com CRM", parcial: "CRM parcial", nao: "sem CRM" } as Record<string, string>)[r.crm],
    sev: r.dedicado === "nao" || r.crm === "nao" ? "crit" : r.dedicado === "sim" && r.crm === "sim" ? "ok" : "warn",
  };

  // Gargalos (top 3 por severidade), completando com os de reserva
  const gs = GARGALOS.filter((g) => r[g[0]] === g[1])
    .sort((a, b) => b[2] - a[2])
    .map((g) => g[3]);
  for (let i = 0; gs.length < 3; i++) gs.push(GARGALOS_RESERVA[i]);
  const gargalos = gs.slice(0, 3) as [string, string, string];

  // Temperatura
  const t = TEMPERATURA.find((x) => score >= x.scoreMin && cenarios.intermediario.receita >= x.intermediarioMin);

  return {
    base,
    pctInativo: pct,
    ticket,
    ticketCalculo,
    baseReativavel,
    cenarios,
    score,
    partes,
    classificacao,
    faixaIdx,
    maturidade,
    estrutura,
    gargalos,
    temperatura: t?.nome ?? "FRIO",
  };
}
