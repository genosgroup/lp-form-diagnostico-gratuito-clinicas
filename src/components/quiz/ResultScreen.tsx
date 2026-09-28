"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Logo from "@/components/Logo";
import { cn, eyebrow, fine, hDisplay, panel, panelTitle } from "@/components/ui";
import { codigoCurto, dataExtenso, fmtBRL, fmtN, pac, pctTxt, primeiroNome } from "@/lib/format";
import { CALCULO, FAIXAS_CURTAS, NOTAS } from "@/lib/quiz/config";
import { labelDe, type Answers, type Resultado, type Severidade } from "@/lib/quiz/calc";
import { PRIVACY_URL, WHATSAPP_GENOS } from "@/lib/site";
import { ArrowDown, Calendar, WhatsApp } from "./icons";

type Props = {
  resultado: Resultado;
  respostas: Answers;
  nome: string;
  leadId: string;
  amostra: boolean;
  onCtaClick: () => void;
};

/* ---------- índice (meia-lua) ---------- */

const GAUGE_R = 120;
const GAUGE_C = Math.PI * GAUGE_R;
const TICKS = [30, 50, 70, 85].map((v) => {
  const a = Math.PI * (1 - v / 100);
  const p = (r: number) => [150 + r * Math.cos(a), 150 - r * Math.sin(a)].map((n) => n.toFixed(1));
  const [x1, y1] = p(GAUGE_R - 20);
  const [x2, y2] = p(GAUGE_R - 12);
  return { x1, y1, x2, y2 };
});

function Gauge({ score }: { score: number }) {
  const [animado, setAnimado] = useState(false);
  const numRef = useRef<HTMLElement>(null);

  // Ponteiro e número sobem juntos; o estado final fica sempre visível ao término.
  useEffect(() => {
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        setAnimado(true);
        const el = numRef.current;
        if (!el) return;
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
          el.textContent = String(score);
          return;
        }
        const t0 = performance.now();
        const tick = (t: number) => {
          const k = Math.min(1, (t - t0) / 1000);
          el.textContent = String(Math.round(score * (1 - Math.pow(1 - k, 3))));
          if (k < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <div className="relative aspect-[2/1.12] w-full max-w-[300px]">
      <svg viewBox="0 0 300 168" aria-hidden className="size-full overflow-visible">
        <defs>
          <linearGradient id="gg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FF6B1F" />
            <stop offset="1" stopColor="#FFB266" />
          </linearGradient>
        </defs>
        <path d="M30 150 A120 120 0 0 1 270 150" fill="none" stroke="#2A2520" strokeWidth={18} strokeLinecap="round" />
        <path
          d="M30 150 A120 120 0 0 1 270 150"
          fill="none"
          stroke="url(#gg)"
          strokeWidth={18}
          strokeLinecap="round"
          strokeDasharray={GAUGE_C.toFixed(1)}
          strokeDashoffset={(animado ? GAUGE_C * (1 - score / 100) : GAUGE_C).toFixed(1)}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)" }}
        />
        {TICKS.map((t, i) => (
          <line key={i} {...t} stroke="#453D35" strokeWidth={2} strokeLinecap="round" />
        ))}
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex items-baseline justify-center gap-1">
        <b ref={numRef} className="font-display text-[72px] leading-[0.9] font-extrabold tracking-[-0.04em] tabular-nums">
          0
        </b>
        <span className="font-mono text-[15px] text-muted">/100</span>
      </div>
    </div>
  );
}

/* ---------- peças menores ---------- */

const SEV: Record<Severidade, string> = {
  crit: "text-crit bg-[rgba(255,106,92,0.12)]",
  warn: "text-warn bg-[rgba(242,184,75,0.12)]",
  ok: "text-ok bg-[rgba(108,203,143,0.12)]",
};

function Sev({ sev, children }: { sev: Severidade; children: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-bold whitespace-nowrap before:size-[7px] before:rounded-full before:bg-current before:content-['']",
        SEV[sev],
      )}
    >
      {children}
    </span>
  );
}

function Cenario({ nome, sub, valor, destaque }: { nome: string; sub: string; valor: number; destaque?: boolean }) {
  return (
    <div
      className={cn(
        "@container flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-card min-[720px]:flex-col min-[720px]:items-start min-[720px]:justify-between",
        destaque
          ? "border-[1.5px] border-orange bg-[linear-gradient(135deg,rgba(255,107,31,0.2),rgba(255,107,31,0.05))] px-[18px] py-5 min-[720px]:-translate-y-1.5"
          : "border border-line bg-surface px-[18px] py-4",
      )}
    >
      <div className="flex min-w-0 flex-[1_1_150px] flex-col gap-[3px]">
        <span className={cn("font-mono text-[11.5px] font-semibold tracking-[0.12em] uppercase", destaque ? "text-amber" : "text-muted")}>
          {nome}
          {destaque && (
            <span className="mt-[5px] table rounded-[5px] bg-orange px-[7px] py-0.5 font-mono text-[10px] tracking-[0.1em] text-ink uppercase">
              referência
            </span>
          )}
        </span>
        <span className="text-[13px] text-dim">{sub}</span>
      </div>
      <span
        className={cn(
          "font-display font-bold tracking-[-0.02em] whitespace-nowrap tabular-nums",
          destaque ? "text-[32px] min-[720px]:text-[clamp(19px,15.5cqi,28px)]" : "text-[26px] min-[720px]:text-[clamp(17px,15.5cqi,24px)]",
        )}
      >
        {fmtBRL(valor)}
      </span>
    </div>
  );
}

function Etapa({ w, rotulo, valor, final }: { w: string; rotulo: string; valor: string; final?: boolean }) {
  return (
    <div
      style={{ width: w }}
      className={cn(
        "flex items-center justify-between gap-2.5 rounded-[12px] border px-4 py-3",
        final ? "border-transparent bg-[linear-gradient(90deg,var(--color-orange),var(--color-orange-2))]" : "border-line bg-surface",
      )}
    >
      <span className={cn("font-mono text-[11px] leading-[1.3] tracking-[0.08em] uppercase", final ? "text-[rgba(26,13,5,0.72)]" : "text-muted")}>
        {rotulo}
      </span>
      <b className={cn("font-display text-[19px] font-bold whitespace-nowrap tabular-nums", final && "text-ink")}>{valor}</b>
    </div>
  );
}

const Seta = () => (
  <div className="flex h-[18px] items-center text-orange">
    <ArrowDown className="size-3.5" />
  </div>
);

function XrayItem({ k, children }: { k: string; children: ReactNode }) {
  return (
    <li className="flex items-start justify-between gap-3.5 border-t border-line py-[13px] first:border-t-0 first:pt-0 last:pb-0">
      <span className="flex-[0_0_38%] text-[14.5px] text-muted">{k}</span>
      <span className="flex flex-col items-end gap-[3px] text-right text-[15px] font-bold">{children}</span>
    </li>
  );
}

const small = "text-[12.5px] font-medium text-dim";

export function linkWhatsapp(nome: string, leadId: string) {
  const txt = `Olá! ${nome ? `Sou ${primeiroNome(nome)}, ` : ""}fiz o Diagnóstico de Receita Oculta (nº ${codigoCurto(leadId)}) e quero meu plano de reativação.`;
  return `https://wa.me/${WHATSAPP_GENOS}?text=${encodeURIComponent(txt)}`;
}

export default function ResultScreen({ resultado: x, respostas: r, nome, leadId, amostra, onCtaClick }: Props) {
  const c = x.cenarios;
  const primeiro = primeiroNome(nome);
  const inativoTxt =
    r.inativos === "nao_sei"
      ? `Estimativa conservadora de ${pctTxt(x.pctInativo)} (você marcou “Não sei”)`
      : `${labelDe("inativos", r.inativos)} da base (usamos ${pctTxt(x.pctInativo)})`;
  const ticketNota = CALCULO.fatorTicketReativacao !== 1 ? ` · ajustado para ${fmtBRL(x.ticketCalculo)} no retorno` : "";

  return (
    <section className="flex flex-1 flex-col gap-[18px] pt-[22px] pb-3">
      {amostra && (
        <div className="rounded-lg bg-amber px-3 py-2 text-center font-mono text-[12px] tracking-[0.06em] text-ink">Exemplo com respostas fictícias</div>
      )}

      <header className="flex flex-col gap-2 pb-1.5">
        <Logo className="mb-1.5 h-7 self-start" />
        <span className={eyebrow}>Diagnóstico de Receita Oculta</span>
        <h2 className={`${hDisplay} text-[clamp(30px,8.4vw,42px)]`}>{primeiro}, veja o que está parado na base da sua clínica.</h2>
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[14px] text-muted">
          <span className="inline-flex items-center gap-[7px]">
            Diagnóstico nº{" "}
            <b className="rounded-md border border-line-2 bg-surface-2 px-2 py-[3px] font-mono text-[13px] font-semibold tracking-[0.06em] text-text">
              {codigoCurto(leadId)}
            </b>
          </span>
          <span className="inline-flex items-center gap-[7px]">
            <Calendar className="size-[15px] text-orange" />
            {dataExtenso(new Date())}
          </span>
        </div>
      </header>

      <section className={panel} aria-labelledby="tScore">
        <h3 className={panelTitle} id="tScore">
          Índice de oportunidade
        </h3>
        <div className="flex flex-col items-center gap-2.5">
          <Gauge score={x.score} />
          <div className="grid w-full max-w-[300px] grid-cols-5 gap-1">
            {FAIXAS_CURTAS.map((f, i) => (
              <div key={f} className="flex flex-col items-center gap-[5px]">
                <i className={cn("block h-1.5 w-full rounded-[3px]", i === x.faixaIdx ? "bg-[linear-gradient(90deg,var(--color-orange),var(--color-amber))]" : "bg-surface-3")} />
                <span className={cn("font-mono text-[10px] whitespace-nowrap", i === x.faixaIdx ? "text-amber" : "text-dim")}>{f}</span>
              </div>
            ))}
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,107,31,0.4)] bg-[rgba(255,107,31,0.2)] px-3.5 py-2 text-[14px] font-extrabold tracking-[0.04em] text-amber uppercase before:size-2 before:rounded-full before:bg-orange before:content-['']">
            {x.classificacao}
          </span>
          <p className="m-0 max-w-[40ch] text-center text-[14.5px] text-muted">{NOTAS[x.faixaIdx]}</p>
        </div>
      </section>

      <section className={panel} aria-labelledby="tFin">
        <h3 className={panelTitle} id="tFin">
          Resultado financeiro estimado
        </h3>
        <div className="flex flex-col gap-2.5 min-[720px]:grid min-[720px]:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)] min-[720px]:items-stretch">
          <Cenario
            nome="Cenário conservador"
            sub={`${pac(c.conservador.pacientes)} · ${pctTxt(c.conservador.taxa)} da base reativável`}
            valor={c.conservador.receita}
          />
          <Cenario
            nome="Cenário intermediário"
            sub={`${pac(c.intermediario.pacientes)} · ${pctTxt(c.intermediario.taxa)} da base reativável`}
            valor={c.intermediario.receita}
            destaque
          />
          <Cenario nome="Cenário alta performance" sub={`${pac(c.alta.pacientes)} · ${pctTxt(c.alta.taxa)} da base reativável`} valor={c.alta.receita} />
        </div>
        <p className={`${fine} border-l-2 border-line-2 pl-3`}>
          Estes valores representam simulações matemáticas baseadas nas informações fornecidas e não constituem promessa ou garantia de faturamento.
        </p>
      </section>

      <section className={panel} aria-labelledby="tFun">
        <h3 className={panelTitle} id="tFun">
          Da base ao potencial
        </h3>
        <div className="flex flex-col items-center">
          <Etapa w="100%" rotulo="Base total" valor={fmtN(x.base)} />
          <Seta />
          <Etapa w="92%" rotulo="Potencialmente inativa" valor={fmtN(x.baseReativavel)} />
          <Seta />
          <Etapa w="84%" rotulo={`Reativados (${pctTxt(c.intermediario.taxa)})`} valor={fmtN(c.intermediario.pacientes)} />
          <Seta />
          <Etapa w="76%" rotulo="Potencial de receita" valor={fmtBRL(c.intermediario.receita)} final />
        </div>
      </section>

      <section className={panel} aria-labelledby="tXr">
        <h3 className={panelTitle} id="tXr">
          Raio-x da operação
        </h3>
        <ul className="m-0 flex list-none flex-col p-0">
          <XrayItem k="Tamanho estimado da base">
            ~{fmtN(x.base)} pacientes<small className={small}>Faixa informada: {labelDe("base", r.base)}</small>
          </XrayItem>
          <XrayItem k="Base potencialmente inativa">
            ~{fmtN(x.baseReativavel)} pacientes<small className={small}>{inativoTxt}</small>
          </XrayItem>
          <XrayItem k="Ticket médio">
            {fmtBRL(x.ticket)}
            <small className={small}>
              Faixa informada: {labelDe("ticket", r.ticket)}
              {ticketNota}
            </small>
          </XrayItem>
          <XrayItem k="Estrutura comercial">
            <Sev sev={x.estrutura.sev}>{x.estrutura.dedicado}</Sev>
            <small className={small}>
              {x.estrutura.crm} · follow-up: {labelDe("cadencia", r.cadencia).toLowerCase()}
            </small>
          </XrayItem>
          <XrayItem k="Maturidade da reativação">
            <Sev sev={x.maturidade.sev}>{x.maturidade.nome}</Sev>
            <small className={small}>Última campanha: {labelDe("ultima_campanha", r.ultima_campanha).toLowerCase()}</small>
          </XrayItem>
        </ul>
      </section>

      <section className={panel} aria-labelledby="tGa">
        <h3 className={panelTitle} id="tGa">
          Maiores gargalos, por prioridade
        </h3>
        <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
          {x.gargalos.map((g, i) => (
            <li
              key={g}
              className={cn(
                "flex items-start gap-3.5 rounded-card px-4 py-3.5",
                i === 0 ? "border border-[rgba(255,107,31,0.3)] bg-[linear-gradient(90deg,rgba(255,107,31,0.14),var(--color-surface-2))]" : "bg-surface-2",
              )}
            >
              <span className="flex-none pt-0.5 font-mono text-[13px] font-semibold text-orange">0{i + 1}</span>
              <p className="m-0 text-[15.5px] leading-[1.4] font-semibold">{g}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-3.5 rounded-panel border border-[rgba(255,107,31,0.35)] bg-surface bg-[radial-gradient(420px_220px_at_100%_0%,rgba(255,107,31,0.28),transparent_70%)] px-5 py-[26px]">
        <h3 className={`${hDisplay} text-[clamp(26px,7vw,32px)]`}>{primeiro}, quer transformar esse potencial em um plano de ação?</h3>
        <p className="m-0 max-w-[44ch] text-[15.5px] leading-[1.55] text-muted text-pretty">
          Podemos analisar sua operação e mostrar como estruturar uma campanha de reativação para os próximos 30 dias.
        </p>
        <a className="btn-primary" href={linkWhatsapp(nome, leadId)} target="_blank" rel="noopener noreferrer" onClick={onCtaClick}>
          <WhatsApp />
          Quero meu plano de reativação
        </a>
      </section>

      <footer className="flex flex-col items-center gap-1.5 pt-2.5 text-center">
        <Logo className="mx-auto h-[26px] opacity-90" />
        <p className={fine}>
          Assessoria de crescimento para clínicas ·{" "}
          <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="text-muted">
            Política de Privacidade
          </a>
        </p>
      </footer>
    </section>
  );
}
