"use client";

import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { CONSENT_TEXT, PRIVACY_URL } from "@/lib/site";
import { NOME_MAX, mascaraTel, nomeValido, telValido } from "@/lib/lead";
import { cn, eyebrow, hDisplay, lead } from "@/components/ui";
import { ArrowDownShort, Lock } from "./icons";

type Props = {
  submitting: boolean;
  onSubmit: (dados: { nome: string; whatsapp: string; website: string }) => void;
  onLockedClick: () => void;
  onInvalid: (campos: string[]) => void;
};

function reduzMovimento() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Índice escondido: fica sorteando e parando em valores diferentes, sem nunca revelar o score real. */
function useIndiceIsca() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let ultimo = 0;
    const isca = () => {
      let v;
      do v = 25 + Math.floor(Math.random() * 74);
      while (Math.abs(v - ultimo) < 12);
      ultimo = v;
      return v;
    };
    if (reduzMovimento()) {
      el.textContent = String(isca());
      return;
    }
    const giros: ReturnType<typeof setInterval>[] = [];
    const girar = (ms: number) => {
      const t0 = Date.now();
      const fim = isca();
      const iv = setInterval(() => {
        if (Date.now() - t0 > ms) {
          clearInterval(iv);
          el.textContent = String(fim);
          return;
        }
        el.textContent = String(10 + Math.floor(Math.random() * 90));
      }, 55);
      giros.push(iv);
    };
    girar(1200);
    const loop = setInterval(() => girar(650), 2200);
    return () => {
      clearInterval(loop);
      giros.forEach(clearInterval);
    };
  }, []);
  return ref;
}

const inputBase =
  "h-14 rounded-[12px] border bg-bg-2 px-4 text-[17px] text-text transition-[border-color,box-shadow] duration-150 placeholder:text-dim focus:shadow-[0_0_0_3px_rgba(255,107,31,0.2)] focus:outline-none";

export default function Capture({ submitting, onSubmit, onLockedClick, onInvalid }: Props) {
  const [nome, setNome] = useState("");
  const [whats, setWhats] = useState("");
  const [website, setWebsite] = useState("");
  const [erros, setErros] = useState<{ nome?: string; whats?: string }>({});
  const nomeRef = useRef<HTMLInputElement>(null);
  const whatsRef = useRef<HTMLInputElement>(null);
  const scoreRef = useIndiceIsca();

  function irParaNome() {
    onLockedClick();
    nomeRef.current?.focus();
    nomeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const novos: typeof erros = {};
    if (!nomeValido(nome)) novos.nome = nome.trim().length < 2 ? "Digite seu nome." : "Confira o nome digitado.";
    if (!telValido(whats)) novos.whats = "Confira o número com DDD. Ex.: (21) 99999-9999";
    setErros(novos);
    if (novos.nome || novos.whats) {
      (novos.nome ? nomeRef : whatsRef).current?.focus();
      onInvalid([novos.nome && "f-nome", novos.whats && "f-whats"].filter(Boolean) as string[]);
      return;
    }
    onSubmit({ nome, whatsapp: whats, website });
  }

  return (
    <section className="flex flex-1 flex-col gap-[22px] pt-3.5 pb-2">
      <span className={eyebrow}>Diagnóstico pronto</span>
      <h2 className={`${hDisplay} text-[clamp(30px,8.4vw,40px)]`}>Encontramos oportunidades na sua base.</h2>
      <p className={lead}>Preencha abaixo para ter acesso ao seu diagnóstico completo.</p>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1 rounded-card border border-line bg-surface px-4 py-3.5">
          <span className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase">Gargalos encontrados</span>
          <span className="font-display text-[21px] font-bold tracking-[-0.01em]">3</span>
        </div>
        <div className="flex flex-col gap-1 rounded-card border border-line bg-surface px-4 py-3.5">
          <span className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase">Cenários calculados</span>
          <span className="font-display text-[21px] font-bold tracking-[-0.01em]">3</span>
        </div>
        <div
          role="button"
          tabIndex={0}
          aria-label="Seu índice de oportunidade já foi calculado. Preencha abaixo para ver."
          onClick={irParaNome}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              irParaNome();
            }
          }}
          className="relative col-span-full flex animate-glow cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-card border border-[rgba(255,107,31,0.45)] bg-[linear-gradient(120deg,rgba(255,107,31,0.14),rgba(24,21,19,0.95)_60%)] px-[18px] py-4 hover:border-orange"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="font-mono text-[11px] tracking-[0.12em] text-text uppercase">Seu índice de oportunidade</span>
            <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-[rgba(255,107,31,0.35)] bg-[rgba(255,107,31,0.14)] px-2.5 py-[5px] text-[12.5px] font-bold text-amber">
              <Lock className="size-[13px]" />
              Desbloqueie abaixo
              <ArrowDownShort className="size-[13px] animate-nudge" />
            </span>
          </span>
          <span className="flex flex-none items-baseline gap-[3px] text-amber blur-[6px] select-none [text-shadow:0_0_18px_rgba(255,107,31,0.9)]" aria-hidden>
            <b ref={scoreRef} className="min-w-[2ch] text-right font-display text-[44px] leading-none font-extrabold tracking-[-0.03em] tabular-nums">
              73
            </b>
            <small className="font-mono text-[14px]">/100</small>
          </span>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 animate-shine bg-[linear-gradient(105deg,transparent_35%,rgba(255,210,170,0.16)_50%,transparent_65%)] [transform:translateX(-110%)]"
          />
        </div>
      </div>

      <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
        <div className="flex flex-col gap-[7px]">
          <label htmlFor="inNome" className="text-[14px] font-bold text-text">
            Seu nome
          </label>
          <input
            ref={nomeRef}
            id="inNome"
            name="nome"
            type="text"
            autoComplete="name"
            placeholder="Como podemos te chamar?"
            maxLength={NOME_MAX}
            value={nome}
            aria-invalid={!!erros.nome}
            aria-describedby={erros.nome ? "errNome" : undefined}
            onChange={(e) => {
              setNome(e.target.value);
              if (erros.nome && nomeValido(e.target.value)) setErros((x) => ({ ...x, nome: undefined }));
            }}
            className={cn(inputBase, erros.nome ? "border-crit" : "border-line-2 focus:border-orange")}
          />
          {erros.nome && (
            <span id="errNome" className="text-[13px] text-crit">
              {erros.nome}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-[7px]">
          <label htmlFor="inWhats" className="text-[14px] font-bold text-text">
            WhatsApp
          </label>
          <input
            ref={whatsRef}
            id="inWhats"
            name="whatsapp"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="(21) 99999-9999"
            maxLength={16}
            value={whats}
            aria-invalid={!!erros.whats}
            aria-describedby={erros.whats ? "errWhats" : undefined}
            onChange={(e) => {
              const v = mascaraTel(e.target.value);
              setWhats(v);
              if (erros.whats && telValido(v)) setErros((x) => ({ ...x, whats: undefined }));
            }}
            className={cn(inputBase, erros.whats ? "border-crit" : "border-line-2 focus:border-orange")}
          />
          {erros.whats && (
            <span id="errWhats" className="text-[13px] text-crit">
              {erros.whats}
            </span>
          )}
        </div>

        {/* Honeypot: invisível para pessoas; robôs que preenchem tudo acabam aqui. */}
        <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
          <label htmlFor="inSite">Site</label>
          <input id="inSite" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>

        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <span className="size-[18px] animate-spin-btn rounded-full border-[2.5px] border-[rgba(26,13,5,0.3)] border-t-ink" />
              Gerando sua análise
            </>
          ) : (
            "Ver meu diagnóstico"
          )}
        </button>
        <p className="m-0 text-center text-[12px] leading-normal text-pretty text-dim">
          {CONSENT_TEXT}{" "}
          <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="text-muted">
            Política de Privacidade
          </a>
        </p>
      </form>
    </section>
  );
}
