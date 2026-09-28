"use client";

import { useEffect, useRef } from "react";
import Logo from "@/components/Logo";
import { fine, hDisplay, lead } from "@/components/ui";
import { ArrowRight, Check } from "./icons";

// Curvas do gráfico (viewBox 320x100): "com a base reativada" sobe com altos e baixos; a atual fica rente ao chão.
const POT_LINE =
  "M0.0 88 C14.6 88 14.6 76 29.1 76 C43.7 76 43.7 81 58.2 81 C72.8 81 72.8 64 87.3 64 C101.8 64 101.8 71 116.4 71 C130.9 71 130.9 56 145.5 56 C160.0 56 160.0 62 174.5 62 C189.1 62 189.1 45 203.6 45 C218.1 45 218.1 52 232.7 52 C247.2 52 247.2 33 261.8 33 C276.4 33 276.4 39 290.9 39 C305.4 39 305.4 10 320.0 10";
const POT_AREA =
  POT_LINE +
  " L320.0 86 C305.4 86 305.4 85 290.9 85 C276.4 85 276.4 87 261.8 87 C247.2 87 247.2 86 232.7 86 C218.1 86 218.1 85 203.6 85 C189.1 85 189.1 88 174.5 88 C160.0 88 160.0 86 145.5 86 C130.9 86 130.9 87 116.4 87 C101.8 87 101.8 85 87.3 85 C72.8 85 72.8 89 58.2 89 C43.7 89 43.7 86 29.1 86 C14.6 86 14.6 88 0.0 88 Z";
const NOW_LINE =
  "M0.0 88 C14.6 88 14.6 86 29.1 86 C43.7 86 43.7 89 58.2 89 C72.8 89 72.8 85 87.3 85 C101.8 85 101.8 87 116.4 87 C130.9 87 130.9 86 145.5 86 C160.0 86 160.0 88 174.5 88 C189.1 88 189.1 85 203.6 85 C218.1 85 218.1 86 232.7 86 C247.2 86 247.2 87 261.8 87 C276.4 87 276.4 85 290.9 85 C305.4 85 305.4 86 320.0 86";

const SUBIDA = 2800;
const TOPO = 3000;
const SAIDA = 450;

/**
 * Gráfico da abertura: a linha "com a base reativada" sobe, mostra "Receita oculta"
 * ao passar da metade, espera 3 s no topo e recomeça.
 */
function GraficoReceita() {
  const potRef = useRef<SVGPathElement>(null);
  const clipRef = useRef<SVGRectElement>(null);
  const growRef = useRef<SVGGElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const chipRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const pot = potRef.current;
    const rect = clipRef.current;
    const grow = growRef.current;
    const dot = dotRef.current;
    const chip = chipRef.current;
    if (!pot || !rect || !grow || !dot || !chip || !pot.getTotalLength) return;

    const L = pot.getTotalLength();
    const pontoEmX = (x: number) => {
      let lo = 0;
      let hi = L;
      for (let n = 0; n < 18; n++) {
        const m = (lo + hi) / 2;
        if (pot.getPointAtLength(m).x < x) lo = m;
        else hi = m;
      }
      return pot.getPointAtLength(hi);
    };
    const pos = (x: number, op: number) => {
      const p = pontoEmX(Math.max(0.5, Math.min(319.5, x)));
      dot.style.left = (p.x / 320) * 100 + "%";
      dot.style.top = p.y + "%";
      dot.style.opacity = String(op);
    };
    const chipOn = (on: boolean) => (chip.dataset.on = String(on));

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      rect.setAttribute("width", "324");
      pos(320, 1);
      chipOn(true);
      return;
    }

    const ciclo = SUBIDA + TOPO + SAIDA;
    const t0 = performance.now();
    let raf = 0;
    const frame = (t: number) => {
      const p = Math.max(0, t - t0) % ciclo;
      if (p < SUBIDA) {
        const u = p / SUBIDA;
        const k = 1 - Math.pow(1 - u, 1.7);
        const x = 320 * k;
        rect.setAttribute("width", String(Math.max(0, x + 2)));
        grow.style.opacity = "1";
        pos(x, 1);
        chipOn(k > 0.5);
      } else if (p < SUBIDA + TOPO) {
        rect.setAttribute("width", "324");
        grow.style.opacity = "1";
        pos(320, 1);
        chipOn(true);
      } else {
        const f = 1 - (p - SUBIDA - TOPO) / SAIDA;
        grow.style.opacity = String(f);
        dot.style.opacity = String(f);
        chipOn(false);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative mt-1.5 h-28">
      <svg viewBox="0 0 320 100" preserveAspectRatio="none" aria-hidden focusable={false} className="block size-full overflow-visible">
        <defs>
          <linearGradient id="mcGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FF6B1F" stopOpacity=".38" />
            <stop offset="1" stopColor="#FF6B1F" stopOpacity=".06" />
          </linearGradient>
          <pattern id="mcHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
            <rect width="2" height="7" fill="rgba(255,138,61,.28)" />
          </pattern>
          <clipPath id="mcClip">
            <rect ref={clipRef} x="-2" y="-20" width="324" height="140" />
          </clipPath>
        </defs>
        <line x1="0" y1="99" x2="320" y2="99" stroke="#2A2520" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <g ref={growRef} clipPath="url(#mcClip)">
          <path d={POT_AREA} fill="url(#mcGrad)" />
          <path d={POT_AREA} fill="url(#mcHatch)" />
          <path
            ref={potRef}
            d={POT_LINE}
            fill="none"
            stroke="var(--color-orange)"
            strokeWidth={2.4}
            strokeDasharray="6 5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className="animate-dash"
          />
        </g>
        <path d={NOW_LINE} fill="none" stroke="#8A8077" strokeWidth={2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <span
        ref={chipRef}
        data-on="false"
        className="absolute top-[73%] left-[58%] -translate-x-1/2 -translate-y-1/2 scale-90 rounded-full border border-[rgba(255,107,31,0.45)] bg-[rgba(13,12,11,0.85)] px-[9px] py-1 font-mono text-[10.5px] tracking-[0.1em] whitespace-nowrap text-amber uppercase opacity-0 transition-[opacity,scale] duration-[350ms] ease-soft data-[on=true]:scale-100 data-[on=true]:opacity-100"
      >
        Receita oculta
      </span>
      <span ref={dotRef} className="absolute top-[88%] left-0 -mt-[5px] -ml-[5px] size-2.5 animate-ping-dot rounded-full bg-orange" />
    </div>
  );
}

const chip = "inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-2 px-3 py-[7px] text-[13px] font-semibold text-muted";

export default function Intro({ onStart }: { onStart: () => void }) {
  return (
    <section className="flex flex-1 flex-col justify-center gap-[30px] pt-6 pb-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Logo className="h-[34px]" />
        <span className="font-mono text-[12px] font-semibold tracking-[0.18em] text-muted uppercase">Diagnóstico gratuito</span>
      </div>

      <h1 className={`${hDisplay} text-[clamp(40px,11vw,60px)]`}>
        Quanto dinheiro pode estar <em className="text-orange not-italic">parado</em> na base da sua clínica?
      </h1>
      <p className={lead}>
        Descubra em menos de 60 segundos o potencial estimado de receita que pode existir entre pacientes que já conhecem sua clínica.
      </p>

      <div className="flex flex-col gap-3 rounded-panel border border-line bg-[rgba(24,21,19,0.8)] px-5 py-[18px]" aria-hidden>
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-[11.5px] tracking-[0.14em] text-muted uppercase">Receita parada estimada</span>
          <span className="font-display text-[34px] font-bold tracking-[-0.02em] text-text tabular-nums">
            R$&nbsp;<span className="animate-blink text-orange">??.???</span>
          </span>
        </div>
        <GraficoReceita />
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-muted">
          <span className="inline-flex items-center gap-[7px]">
            <i className="inline-block h-0 w-4 border-t-2 border-[#8A8077]" />
            Faturamento atual
          </span>
          <span className="inline-flex items-center gap-[7px]">
            <i className="inline-block h-0 w-4 border-t-2 border-dashed border-orange" />
            Com a base reativada
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        <div className="flex flex-wrap gap-2">
          <span className={chip}>
            <Check className="size-3.5 text-orange" />
            Diagnóstico gratuito
          </span>
          <span className={chip}>7 perguntas</span>
          <span className={chip}>menos de 60 segundos</span>
        </div>
        <button className="btn-primary" type="button" onClick={onStart}>
          Descobrir meu potencial
          <ArrowRight />
        </button>
        <p className={fine}>Estimativa baseada nas informações fornecidas. Não representa garantia de faturamento.</p>
      </div>
    </section>
  );
}
