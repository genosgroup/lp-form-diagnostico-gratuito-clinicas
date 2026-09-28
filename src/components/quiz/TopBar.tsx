import { ChevronLeft } from "./icons";

type Props = { current: number; total: number; onBack: () => void };

/** Topo fixo com "Voltar" e o progresso das perguntas. */
export default function TopBar({ current, total, onBack }: Props) {
  const feitas = Math.min(current, total);
  return (
    <div className="sticky top-[env(safe-area-inset-top,0px)] z-[5] -mx-5 flex flex-col gap-3 bg-[linear-gradient(var(--color-bg)_70%,transparent)] px-5 pt-3.5 pb-1.5">
      <div className="flex min-h-11 items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar para a pergunta anterior"
          className="-ml-2 inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-ctl border-0 bg-transparent pr-3.5 pl-2 text-[15px] font-semibold text-muted hover:bg-surface hover:text-text"
        >
          <ChevronLeft className="size-5" />
          Voltar
        </button>
        <span className="font-mono text-[13px] tracking-[0.08em] text-muted tabular-nums" aria-live="polite">
          {current > total ? (
            <>
              <b className="font-semibold text-text">Diagnóstico</b> pronto
            </>
          ) : (
            <>
              <b className="font-semibold text-text">{current}</b> de {total}
            </>
          )}
        </span>
      </div>
      <div
        className="h-1 overflow-hidden rounded bg-surface-2"
        role="progressbar"
        aria-label="Progresso do diagnóstico"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={feitas}
      >
        <i
          className="block h-full rounded bg-[linear-gradient(90deg,var(--color-orange),var(--color-amber))] transition-[width] duration-[450ms] ease-soft"
          style={{ width: `${(feitas / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
