"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { fmtN } from "@/lib/format";
import type { Resultado } from "@/lib/quiz/calc";
import { cn } from "@/components/ui";

const PASSOS = [
  "Analisando sua base...",
  "Calculando potencial financeiro...",
  "Avaliando estrutura comercial...",
  "Identificando oportunidades de reativação...",
];

type Status = "" | "run" | "done";

const BLOCO = {
  off: "block h-3.5 rounded-[3px] bg-surface-3 transition-colors duration-[120ms]",
  on: "block h-3.5 rounded-[3px] bg-orange transition-colors duration-[120ms]",
  ok: "block h-3.5 rounded-[3px] bg-ok transition-colors duration-[120ms]",
};
const EST_TXT = {
  idle: "font-display text-[15px] font-bold whitespace-nowrap text-dim",
  run: "font-display text-[15px] font-bold whitespace-nowrap text-muted",
  ok: "font-display text-[15px] font-bold whitespace-nowrap text-ok",
};

type RadarRefs = {
  canvas: HTMLCanvasElement;
  pct: HTMLElement;
  label: HTMLElement;
  base: HTMLElement;
  inat: HTMLElement;
  estBlocos: HTMLCollection;
  estTxt: HTMLElement;
};

/** Radar: cada ponto é um paciente; o feixe revela quem está inativo. Os contadores chegam exatamente nos valores reais. */
function rodarRadar(el: RadarRefs, res: Resultado, dur: number) {
  const cv = el.canvas;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const S = cv.clientWidth || 168;
  cv.width = S * dpr;
  cv.height = S * dpr;
  const ctx = cv.getContext("2d");
  if (!ctx) return () => {};
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const c = S / 2;
  const R = S / 2 - 4;
  const N = 110;
  const nInat = Math.round(N * res.pctInativo);
  const pts = Array.from({ length: N }, () => {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(0.04 + Math.random() * 0.96) * (R - 6);
    return { x: c + r * Math.sin(a), y: c - r * Math.cos(a), a, inativo: false, rev: 0 };
  });
  // sorteia exatamente a proporção de inativos
  pts
    .map((_, i) => i)
    .sort(() => Math.random() - 0.5)
    .slice(0, nInat)
    .forEach((i) => (pts[i].inativo = true));

  const pintaEst = (n: number, cls: "on" | "ok" = "on") => {
    for (let j = 0; j < el.estBlocos.length; j++) el.estBlocos[j].className = j < n ? BLOCO[cls] : BLOCO.off;
  };
  pintaEst(0);
  el.estTxt.textContent = "Aguardando";
  el.estTxt.className = EST_TXT.idle;

  const reduz = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const t0 = performance.now();
  let raf = 0;

  const frame = (t: number) => {
    const k = reduz ? 1 : Math.min(1, (t - t0) / dur);
    const ang = k * Math.PI * 2;
    ctx.clearRect(0, 0, S, S);
    // anéis e cruz
    ctx.strokeStyle = "#2F2A25";
    ctx.lineWidth = 1;
    [1, 0.66, 0.33].forEach((f) => {
      ctx.beginPath();
      ctx.arc(c, c, R * f, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(c, c - R);
    ctx.lineTo(c, c + R);
    ctx.moveTo(c - R, c);
    ctx.lineTo(c + R, c);
    ctx.stroke();
    // feixe
    if (k < 1) {
      if (ctx.createConicGradient) {
        const g = ctx.createConicGradient(ang - Math.PI / 2 - 0.9, c, c);
        g.addColorStop(0, "rgba(255,107,31,0)");
        g.addColorStop(0.143, "rgba(255,107,31,.28)");
        g.addColorStop(0.1432, "rgba(255,107,31,0)");
        g.addColorStop(1, "rgba(255,107,31,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(c, c, R, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(255,178,102,.9)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.lineTo(c + R * Math.sin(ang), c - R * Math.cos(ang));
      ctx.stroke();
    }
    // pontos
    let vistos = 0;
    let vistosInat = 0;
    for (const p of pts) {
      const visto = p.a <= ang || k >= 1;
      if (!visto) {
        ctx.fillStyle = "#26211D";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      vistos++;
      if (p.inativo) vistosInat++;
      p.rev = Math.min(1, p.rev + 0.08);
      if (p.inativo) {
        ctx.fillStyle = "rgba(255,107,31," + 0.25 * p.rev + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.4 + 4 * (1 - p.rev) + 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FF7A2F";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "#6F665D";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = "#FF6B1F";
    ctx.beginPath();
    ctx.arc(c, c, 3, 0, Math.PI * 2);
    ctx.fill();

    el.pct.textContent = Math.round(k * 100) + "%";
    el.label.textContent = k >= 1 ? "Análise concluída" : "Analisando informações";
    el.base.textContent = fmtN(k >= 1 ? res.base : (res.base * vistos) / N);
    el.inat.textContent = fmtN(k >= 1 ? res.baseReativavel : res.baseReativavel * (nInat ? vistosInat / nInat : 0));
    // estrutura comercial: espera, avalia (blocos oscilando) e fecha
    if (k >= 0.92) {
      pintaEst(5, "ok");
      el.estTxt.textContent = "Analisado";
      el.estTxt.className = EST_TXT.ok;
    } else if (k >= 0.45) {
      pintaEst(Math.min(5, 1 + Math.floor(((k - 0.45) / 0.47) * 5)));
      el.estTxt.textContent = "Avaliando";
      el.estTxt.className = EST_TXT.run;
    }

    if (k < 1 || pts.some((p) => p.rev < 1)) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

type Props = { resultado: Resultado; durationMs: number; onDone: () => void };

export default function Processing({ resultado, durationMs, onDone }: Props) {
  const [status, setStatus] = useState<Status[]>(() => PASSOS.map(() => ""));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const baseRef = useRef<HTMLElement>(null);
  const inatRef = useRef<HTMLElement>(null);
  const estBarRef = useRef<HTMLSpanElement>(null);
  const estTxtRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = {
      canvas: canvasRef.current,
      pct: pctRef.current,
      label: labelRef.current,
      base: baseRef.current,
      inat: inatRef.current,
      estBlocos: estBarRef.current?.children,
      estTxt: estTxtRef.current,
    };
    if (Object.values(el).some((v) => !v)) return;
    return rodarRadar(el as RadarRefs, resultado, durationMs - 350);
  }, [resultado, durationMs]);

  // Sempre chama a versão mais recente de onDone sem reiniciar a contagem.
  const aoTerminar = useEffectEvent(onDone);

  useEffect(() => {
    const passo = durationMs / PASSOS.length;
    const timers = PASSOS.map((_, n) =>
      setTimeout(() => {
        setStatus((s) => s.map((v, i) => (i < n ? "done" : i === n ? "run" : v)));
      }, n * passo),
    );
    timers.push(setTimeout(() => setStatus((s) => s.map(() => "done")), durationMs - 150));
    timers.push(setTimeout(() => aoTerminar(), durationMs + 300));
    return () => timers.forEach(clearTimeout);
  }, [durationMs]);

  return (
    <section className="flex flex-1 flex-col justify-center gap-7 py-10">
      <div className="flex flex-col gap-3 rounded-panel border border-line bg-[linear-gradient(160deg,rgba(255,107,31,0.06),var(--color-bg-2)_55%)] px-4 pt-3.5 pb-4">
        <div className="flex items-center justify-between font-mono text-[11.5px] tracking-[0.12em] text-muted uppercase tabular-nums">
          <span className="inline-flex items-center gap-2">
            <i className="size-[7px] animate-ping-live rounded-full bg-orange" />
            <span ref={labelRef}>Analisando informações</span>
          </span>
          <span ref={pctRef} className="text-amber">
            0%
          </span>
        </div>
        <div className="flex items-center gap-3.5">
          <div className="aspect-square w-[168px] max-w-[48%] flex-none">
            <canvas ref={canvasRef} aria-hidden className="block size-full" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-col gap-1 border-l-2 border-line-2 pl-3">
              <span className="font-mono text-[10px] tracking-[0.05em] text-muted uppercase">Pacientes analisados</span>
              <b ref={baseRef} className="font-display text-[26px] leading-[1.05] font-bold tracking-[-0.02em] tabular-nums">
                0
              </b>
            </div>
            <div className="flex flex-col gap-1 border-l-2 border-orange pl-3">
              <span className="font-mono text-[10px] tracking-[0.05em] text-muted uppercase">Inativos encontrados</span>
              <b ref={inatRef} className="font-display text-[26px] leading-[1.05] font-bold tracking-[-0.02em] text-amber tabular-nums">
                0
              </b>
            </div>
            <div className="flex flex-col gap-1 border-l-2 border-line-2 pl-3">
              <span className="font-mono text-[10px] tracking-[0.05em] text-muted uppercase">Estrutura comercial</span>
              <span className="flex min-h-[26px] items-center gap-2">
                <span ref={estBarRef} className="grid flex-none grid-cols-[repeat(5,9px)] gap-[3px]">
                  {Array.from({ length: 5 }, (_, i) => (
                    <i key={i} className={BLOCO.off} />
                  ))}
                </span>
                <span ref={estTxtRef} className={EST_TXT.idle}>
                  Aguardando
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <ul className="m-0 flex list-none flex-col gap-3.5 p-0" aria-live="polite">
        {PASSOS.map((txt, i) => (
          <li
            key={txt}
            className={cn(
              "flex items-center gap-3 font-mono text-[14px] transition-colors duration-[250ms]",
              status[i] === "run" ? "text-text" : status[i] === "done" ? "text-muted" : "text-dim",
            )}
          >
            <span
              className={cn(
                "flex size-5 flex-none items-center justify-center rounded-full border-2",
                status[i] === "run" && "animate-spin-fast border-line-2 border-t-orange",
                status[i] === "done" && "border-orange bg-orange",
                status[i] === "" && "border-line-2",
              )}
            >
              {status[i] === "done" && (
                <span className="h-[5px] w-2 border-b-2 border-l-2 border-ink [transform:rotate(-45deg)_translate(1px,-1px)]" />
              )}
            </span>
            {txt}
          </li>
        ))}
      </ul>
    </section>
  );
}
