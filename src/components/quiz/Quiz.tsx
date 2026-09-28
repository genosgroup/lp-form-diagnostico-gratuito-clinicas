"use client";

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { AVANCO_AUTOMATICO_MS, PERGUNTAS, PROCESSAMENTO_MS } from "@/lib/quiz/config";
import { calcular, labelDe, type Answers, type Resultado } from "@/lib/quiz/calc";
import { gerarLeadId, normalizarTel, type LeadRequest, type Tracking } from "@/lib/lead";
import { nomeBonito } from "@/lib/format";
import { coletarTracking, track } from "@/lib/tracking";
import { enviarLead, reenviarPendentes } from "@/lib/enviar-lead";
import TopBar from "./TopBar";
import Intro from "./Intro";
import QuestionScreen from "./QuestionScreen";
import Processing from "./Processing";
import Capture from "./Capture";
import ResultScreen from "./ResultScreen";

type Step = "intro" | "q" | "proc" | "cap" | "res";
type Dir = "fwd" | "back";
/** `n` muda a cada troca de tela, para remontar e reanimar a entrada. */
type Tela = { step: Step; idx: number; dir: Dir; n: number };
/** Estado guardado no histórico do navegador (o Next acrescenta os campos internos dele). */
type HistState = { passo?: Step; idx?: number };

const TOTAL = PERGUNTAS.length;

/** Prévia do resultado com respostas fictícias: abra a página com #resultado-exemplo (nada é enviado). */
const EXEMPLO: Answers = {
  base: "1501-3000",
  ticket: "1001-2500",
  inativos: "60-90",
  ultima_campanha: "12m+",
  dedicado: "divide",
  cadencia: "nao",
  crm: "parcial",
};
const RESULTADO_EXEMPLO = calcular(EXEMPLO);

function assinarHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Quiz() {
  const [tela, setTela] = useState<Tela>({ step: "intro", idx: 0, dir: "fwd", n: 0 });
  const [respostas, setRespostas] = useState<Partial<Answers>>({});
  const [locked, setLocked] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [nome, setNome] = useState("");
  /** Código do diagnóstico exibido no resultado (o ref abaixo guarda o mesmo valor para os handlers). */
  const [codigo, setCodigo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const exemplo = useSyncExternalStore(
    assinarHash,
    () => window.location.hash === "#resultado-exemplo",
    () => false,
  );

  const leadId = useRef<string | null>(null);
  const iniciadoEm = useRef<number | null>(null);
  const tracking = useRef<Tracking>({});
  const travado = useRef(false);
  const enviado = useRef(false);
  const abandonoEnviado = useRef(false);

  const { step, idx } = tela;

  function ir(proximo: Step, dir: Dir = "fwd", i?: number) {
    setTela((t) => ({ step: proximo, idx: i ?? t.idx, dir, n: t.n + 1 }));
  }

  function pushHist(passo: Step, i?: number) {
    try {
      history.pushState({ passo, idx: i } satisfies HistState, "");
    } catch {}
  }

  function irIntro(dir: Dir) {
    ir("intro", dir);
  }

  function irPergunta(i: number, dir: Dir, semHist = false) {
    travado.current = false;
    setLocked(false);
    ir("q", dir, i);
    if (!semHist) pushHist("q", i);
  }

  function irProcessamento(r: Answers) {
    setResultado(calcular(r));
    ir("proc");
  }

  function irCaptura(dir: Dir = "fwd", semHist = false) {
    ir("cap", dir);
    if (!semHist) pushHist("cap");
    track("lead_form_viewed", { score_band: resultado?.classificacao }, leadId.current);
  }

  function comecar() {
    if (!iniciadoEm.current) {
      iniciadoEm.current = Date.now();
      leadId.current = gerarLeadId();
      track("quiz_started", {}, leadId.current);
    }
    irPergunta(0, "fwd");
  }

  function responder(id: string) {
    if (travado.current) return;
    travado.current = true;
    setLocked(true);
    const p = PERGUNTAS[idx];
    const novas = { ...respostas, [p.id]: id };
    setRespostas(novas);
    track(`question_${idx + 1}_answered`, { question_id: p.id, answer_id: id, answer_label: labelDe(p.id, id) }, leadId.current);
    setTimeout(() => {
      if (idx < TOTAL - 1) irPergunta(idx + 1, "fwd");
      else irProcessamento(novas as Answers);
    }, AVANCO_AUTOMATICO_MS);
  }

  function voltar() {
    if (step === "q") {
      if (idx > 0) irPergunta(idx - 1, "back", true);
      else irIntro("back");
    } else if (step === "cap") {
      irPergunta(TOTAL - 1, "back", true);
    }
  }

  async function enviar(dados: { nome: string; whatsapp: string; website: string }) {
    if (!resultado) return;
    setSubmitting(true);
    const nomeFinal = nomeBonito(dados.nome);
    const id = leadId.current ?? (leadId.current = gerarLeadId());
    setNome(nomeFinal);
    setCodigo(id);

    const payload: LeadRequest = {
      lead_id: id,
      nome: nomeFinal,
      whatsapp: normalizarTel(dados.whatsapp),
      respostas: respostas as Answers,
      tracking: tracking.current,
      segundos_no_quiz: iniciadoEm.current ? Math.round((Date.now() - iniciadoEm.current) / 1000) : 0,
      website: dados.website,
    };
    // O resultado aparece mesmo se a planilha falhar: o lead fica pendente e é reenviado depois.
    await Promise.all([enviarLead(payload), esperar(700)]);

    enviado.current = true;
    const x = resultado;
    track(
      "lead_submitted",
      { score: x.score, classificacao: x.classificacao, temperatura: x.temperatura, cenario_intermediario: x.cenarios.intermediario.receita },
      id,
    );
    try {
      window.fbq?.("track", "Lead", { content_name: "Diagnóstico Receita Oculta" }, { eventID: id + "-lead" });
    } catch {}
    ir("res");
    pushHist("res");
    track("result_viewed", { score: x.score, classificacao: x.classificacao, temperatura: x.temperatura }, id);
    setSubmitting(false);
  }

  function passoAtual() {
    if (step === "q") return "question_" + (idx + 1);
    if (step === "cap") return "lead_form";
    if (step === "proc") return "processing";
    return step;
  }

  /* ---------- eventos globais ---------- */

  const aoTeclar = useEffectEvent((e: KeyboardEvent) => {
    if (step !== "q" || e.metaKey || e.ctrlKey || e.altKey) return;
    const n = parseInt(e.key, 10);
    const k = !isNaN(n) ? n - 1 : e.key.length === 1 ? "abcdef".indexOf(e.key.toLowerCase()) : -1;
    const p = PERGUNTAS[idx];
    if (k >= 0 && k < p.opcoes.length) {
      e.preventDefault();
      responder(p.opcoes[k][0]);
    } else if (e.key === "Escape" || e.key === "Backspace") {
      e.preventDefault();
      voltar();
    }
  });

  const aoVoltarNoNavegador = useEffectEvent((e: PopStateEvent) => {
    if (step === "res" || step === "proc") return; // depois do envio, o voltar não reabre o quiz
    const s = (e.state ?? null) as HistState | null;
    if (!s?.passo || s.passo === "intro") irIntro("back");
    else if (s.passo === "q") irPergunta(s.idx ?? 0, "back", true);
    else if (s.passo === "cap" && resultado) irCaptura("back", true);
  });

  const aoSair = useEffectEvent((visivel: boolean) => {
    if (visivel) {
      abandonoEnviado.current = false;
      return;
    }
    if (!iniciadoEm.current || enviado.current || abandonoEnviado.current) return;
    abandonoEnviado.current = true;
    track(
      "quiz_abandoned",
      {
        abandon_step: passoAtual(),
        questions_answered: Object.keys(respostas).length,
        seconds_in_quiz: Math.round((Date.now() - iniciadoEm.current) / 1000),
      },
      leadId.current,
    );
  });

  useEffect(() => {
    tracking.current = coletarTracking();
    reenviarPendentes();
    const onKey = (e: KeyboardEvent) => aoTeclar(e);
    const onPop = (e: PopStateEvent) => aoVoltarNoNavegador(e);
    const onHide = () => aoSair(false);
    const onVis = () => aoSair(document.visibilityState !== "hidden");
    document.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tela.n]);

  /* ---------- telas ---------- */

  let conteudo: ReactNode = null;
  if (exemplo)
    conteudo = (
      <ResultScreen resultado={RESULTADO_EXEMPLO} respostas={EXEMPLO} nome="Ana Exemplo" leadId="RO-EXEMPLO" amostra onCtaClick={() => {}} />
    );
  else if (step === "intro") conteudo = <Intro onStart={comecar} />;
  else if (step === "q")
    conteudo = <QuestionScreen question={PERGUNTAS[idx]} selected={respostas[PERGUNTAS[idx].id]} locked={locked} onAnswer={responder} />;
  else if (step === "proc" && resultado) conteudo = <Processing resultado={resultado} durationMs={PROCESSAMENTO_MS} onDone={() => irCaptura()} />;
  else if (step === "cap")
    conteudo = (
      <Capture
        submitting={submitting}
        onSubmit={enviar}
        onLockedClick={() => track("locked_score_clicked", {}, leadId.current)}
        onInvalid={(campos) => track("lead_form_error", { campos }, leadId.current)}
      />
    );
  else if (step === "res" && resultado && codigo)
    conteudo = (
      <ResultScreen
        resultado={resultado}
        respostas={respostas as Answers}
        nome={nome}
        leadId={codigo}
        amostra={false}
        onCtaClick={() => {
          track("diagnostic_requested", { temperatura: resultado.temperatura, score: resultado.score }, codigo);
          track("whatsapp_clicked", { origem: "cta_plano_reativacao" }, codigo);
        }}
      />
    );

  return (
    <>
      <div className="page-glow" aria-hidden />
      <div className="page-grid" aria-hidden />
      <main className="relative z-[1] mx-auto flex min-h-full max-w-[560px] flex-col px-5 pb-7 min-[720px]:max-w-[600px]">
        {!exemplo && (step === "q" || step === "cap") && <TopBar current={step === "q" ? idx + 1 : TOTAL + 1} total={TOTAL} onBack={voltar} />}
        <div key={exemplo ? "exemplo" : tela.n} className={`flex flex-1 flex-col ${tela.dir === "back" ? "animate-enter-back" : "animate-enter"}`}>
          {conteudo}
        </div>
      </main>
    </>
  );
}
