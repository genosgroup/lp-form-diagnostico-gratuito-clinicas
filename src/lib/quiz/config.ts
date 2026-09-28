/**
 * Perguntas e parâmetros de negócio do diagnóstico.
 * Tudo que muda o cálculo mora aqui; o motor fica em ./calc.ts.
 */

export type QuestionId = "base" | "ticket" | "inativos" | "ultima_campanha" | "dedicado" | "cadencia" | "crm";

/** Arranjo das opções: grid = cartões em 2 colunas (3 no desktop em grid3); rows = cartões largos. */
export type QuestionLayout = "grid" | "grid3" | "rows";

export type Question = {
  id: QuestionId;
  tema: string;
  titulo: string;
  dica?: string;
  layout: QuestionLayout;
  opcoes: ReadonlyArray<readonly [id: string, label: string]>;
};

export const PERGUNTAS: readonly Question[] = [
  {
    id: "base",
    tema: "Base de pacientes",
    titulo: "Aproximadamente quantos pacientes existem hoje na sua base?",
    dica: "Considere todos os pacientes cadastrados no sistema.",
    layout: "grid3",
    opcoes: [
      ["ate500", "Até 500"],
      ["501-1500", "501 a 1.500"],
      ["1501-3000", "1.501 a 3.000"],
      ["3001-5000", "3.001 a 5.000"],
      ["5001-10000", "5.001 a 10.000"],
      ["10000+", "Mais de 10.000"],
    ],
  },
  {
    id: "ticket",
    tema: "Ticket médio",
    titulo: "Qual é aproximadamente o ticket médio dos tratamentos realizados na clínica?",
    layout: "grid",
    opcoes: [
      ["ate500", "Até R$ 500"],
      ["501-1000", "R$ 501 a R$ 1.000"],
      ["1001-2500", "R$ 1.001 a R$ 2.500"],
      ["2501-5000", "R$ 2.501 a R$ 5.000"],
      ["5000+", "Mais de R$ 5.000"],
    ],
  },
  {
    id: "inativos",
    tema: "Inatividade",
    titulo: "Quanto da sua base você estima que esteja há mais de 6 meses sem comprar?",
    layout: "grid",
    opcoes: [
      ["lt30", "Menos de 30%"],
      ["30-60", "30% a 60%"],
      ["60-90", "60% a 90%"],
      ["90+", "Mais de 90%"],
      ["nao_sei", "Não sei"],
    ],
  },
  {
    id: "ultima_campanha",
    tema: "Reativação",
    titulo: "Quando sua clínica realizou a última campanha estruturada para reativar pacientes antigos?",
    layout: "grid",
    opcoes: [
      ["3m", "Últimos 3 meses"],
      ["3-6m", "3 a 6 meses"],
      ["6-12m", "6 a 12 meses"],
      ["12m+", "Mais de 12 meses"],
      ["nunca", "Nunca fizemos"],
    ],
  },
  {
    id: "dedicado",
    tema: "Atendimento",
    titulo: "Existe alguém dedicado só ao atendimento e acompanhamento dos pacientes?",
    dica: "Quem responde e acompanha quem procura a clínica pelo WhatsApp, telefone ou redes.",
    layout: "rows",
    opcoes: [
      ["sim", "Sim, temos uma pessoa dedicada"],
      ["divide", "Existe, mas divide com outras funções"],
      ["nao", "Não temos ninguém dedicado"],
    ],
  },
  {
    id: "cadencia",
    tema: "Follow-up",
    titulo: "Quando um paciente não fecha ou para de responder, existe uma sequência estruturada de acompanhamento?",
    layout: "grid",
    opcoes: [
      ["sim", "Sim"],
      ["parcial", "Parcialmente"],
      ["nao", "Não"],
      ["nao_sei", "Não sei"],
    ],
  },
  {
    id: "crm",
    tema: "CRM",
    titulo: "A clínica utiliza CRM ou algum processo estruturado para acompanhar esses pacientes?",
    layout: "rows",
    opcoes: [
      ["sim", "Sim"],
      ["parcial", "Parcialmente"],
      ["nao", "Não"],
    ],
  },
];

export const CALCULO = {
  // Pontos médios usados para cada faixa de resposta
  basePontoMedio: { ate500: 350, "501-1500": 1000, "1501-3000": 2250, "3001-5000": 4000, "5001-10000": 7500, "10000+": 12000 } as Record<string, number>,
  ticketPontoMedio: { ate500: 350, "501-1000": 750, "1001-2500": 1750, "2501-5000": 3750, "5000+": 6000 } as Record<string, number>,
  // nao_sei = parâmetro conservador
  percentualInativo: { lt30: 0.2, "30-60": 0.45, "60-90": 0.75, "90+": 0.92, nao_sei: 0.3 } as Record<string, number>,
  // Taxa de conversão sobre a base reativável
  cenarios: { conservador: 0.03, intermediario: 0.05, alta: 0.08 },
  // 1.0 = fórmula original. Ex.: 0.6 se o paciente reativado costuma voltar para procedimentos menores
  fatorTicketReativacao: 1.0,
  // Arredonda os valores em R$ para evitar falsa precisão
  arredondarPara: 100,
};

/** Índice de oportunidade: potencial (base, ticket, inativos = 50 pts) + lacuna estrutural (50 pts). Máximo = 100. */
export const SCORE: Record<QuestionId, Record<string, number>> = {
  base: { ate500: 4, "501-1500": 8, "1501-3000": 12, "3001-5000": 16, "5001-10000": 19, "10000+": 20 },
  ticket: { ate500: 3, "501-1000": 6, "1001-2500": 9, "2501-5000": 12, "5000+": 15 },
  inativos: { lt30: 3, "30-60": 7, "60-90": 11, "90+": 15, nao_sei: 9 },
  ultima_campanha: { "3m": 2, "3-6m": 5, "6-12m": 9, "12m+": 12, nunca: 14 },
  dedicado: { sim: 2, divide: 7, nao: 12 },
  cadencia: { sim: 2, parcial: 7, nao: 12, nao_sei: 10 },
  crm: { sim: 2, parcial: 7, nao: 12 },
};

export const FAIXAS: ReadonlyArray<readonly [min: number, max: number, nome: string]> = [
  [0, 30, "Oportunidade baixa"],
  [31, 50, "Oportunidade moderada"],
  [51, 70, "Oportunidade relevante"],
  [71, 85, "Oportunidade alta"],
  [86, 100, "Oportunidade muito alta"],
];

export const FAIXAS_CURTAS = ["Baixa", "Moderada", "Relevante", "Alta", "Muito alta"];

/** Frase exibida abaixo do índice, uma por faixa. */
export const NOTAS = [
  "Sua base já é bem trabalhada. O ganho está em refinar o que existe.",
  "Existe espaço para recuperar pacientes com ajustes pontuais no processo.",
  "Há receita relevante parada e lacunas claras na forma de trabalhar a base.",
  "Sua base tem volume e valor, e quase nada trabalha para trazer esses pacientes de volta.",
  "Base grande, ticket alto e nenhuma estrutura de reativação. É dinheiro parado de verdade.",
];

/**
 * Temperatura do lead para o time comercial: cruza dor (score) com tamanho do prêmio
 * (cenário intermediário). Avaliadas em ordem; a primeira que bater vence.
 */
export const TEMPERATURA = [
  { nome: "HOT", scoreMin: 75, intermediarioMin: 60000 },
  { nome: "QUENTE", scoreMin: 60, intermediarioMin: 25000 },
  { nome: "MORNO", scoreMin: 45, intermediarioMin: 0 },
  { nome: "MORNO", scoreMin: 0, intermediarioMin: 25000 },
  { nome: "FRIO", scoreMin: 0, intermediarioMin: 0 },
] as const;

/** Gargalos candidatos: [pergunta, resposta, severidade, texto] */
export const GARGALOS: ReadonlyArray<readonly [QuestionId, string, number, string]> = [
  ["ultima_campanha", "nunca", 10, "Nenhuma campanha estruturada de reativação já foi feita com a base."],
  ["ultima_campanha", "12m+", 9, "Base sem campanha estruturada de reativação há mais de 12 meses."],
  ["ultima_campanha", "6-12m", 6, "Última campanha de reativação feita há mais de 6 meses."],
  ["dedicado", "nao", 9, "Ninguém dedicado ao atendimento e acompanhamento dos pacientes."],
  ["dedicado", "divide", 6, "O atendimento divide tempo com outras funções e o acompanhamento fica para depois."],
  ["cadencia", "nao", 9, "Falta de cadência estruturada para quem não fecha ou para de responder."],
  ["cadencia", "nao_sei", 8, "Sem visibilidade sobre o que acontece com o paciente que não fecha."],
  ["cadencia", "parcial", 5, "Follow-up irregular, dependente da iniciativa de cada pessoa."],
  ["crm", "nao", 8, "Sem CRM: pacientes inativos ficam invisíveis para a equipe."],
  ["crm", "parcial", 5, "CRM subutilizado no acompanhamento da base."],
  ["inativos", "90+", 8, "Mais de 90% da base está há mais de 6 meses sem comprar."],
  ["inativos", "nao_sei", 7, "A clínica não mede quantos pacientes estão inativos."],
  ["inativos", "60-90", 6, "Entre 60% e 90% da base está há mais de 6 meses sem comprar."],
];

export const GARGALOS_RESERVA = [
  "Oportunidade: segmentar a base por tratamento e tempo de inatividade.",
  "Oportunidade: medir a taxa de retorno de cada campanha de reativação.",
  "Oportunidade: automatizar gatilhos de retorno (revisão, manutenção, continuidade).",
];

/** Barrinha de nível: onde a opção cai na escala (só nas perguntas de faixa). */
export const NIVEIS: Partial<Record<QuestionId, { total: number; niveis: Record<string, number> }>> = {
  base: { total: 6, niveis: { ate500: 1, "501-1500": 2, "1501-3000": 3, "3001-5000": 4, "5001-10000": 5, "10000+": 6 } },
  ticket: { total: 5, niveis: { ate500: 1, "501-1000": 2, "1001-2500": 3, "2501-5000": 4, "5000+": 5 } },
  inativos: { total: 4, niveis: { lt30: 1, "30-60": 2, "60-90": 3, "90+": 4 } },
  ultima_campanha: { total: 5, niveis: { "3m": 1, "3-6m": 2, "6-12m": 3, "12m+": 4, nunca: 5 } },
};

/** Duração da tela de análise (radar), em milissegundos. */
export const PROCESSAMENTO_MS = 3350;
/** Pausa entre escolher uma opção e avançar para a próxima pergunta. */
export const AVANCO_AUTOMATICO_MS = 260;
