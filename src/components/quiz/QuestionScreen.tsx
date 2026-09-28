import { NIVEIS, type Question } from "@/lib/quiz/config";
import { cn, eyebrow } from "@/components/ui";
import { Check, OPTION_ICONS } from "./icons";

type Props = {
  question: Question;
  selected?: string;
  locked: boolean;
  onAnswer: (id: string) => void;
};

const LAYOUT = {
  grid: "grid grid-cols-2 gap-2.5",
  grid3: "grid grid-cols-2 gap-2.5 min-[560px]:grid-cols-3",
  rows: "flex flex-col gap-2.5",
};

/** Barrinha de nível: onde a opção cai na escala (só nas perguntas de faixa). */
function Nivel({ qid, oid, sel }: { qid: Question["id"]; oid: string; sel: boolean }) {
  const n = NIVEIS[qid];
  const nivel = n?.niveis[oid];
  if (!n || !nivel) return null;
  return (
    <span className="grid w-full max-w-[120px] gap-[3px]" style={{ gridTemplateColumns: `repeat(${n.total}, 1fr)` }} aria-hidden>
      {Array.from({ length: n.total }, (_, i) => (
        <i
          key={i}
          className={cn(
            "block h-1 rounded-[2px] transition-colors duration-200",
            i >= nivel ? "bg-surface-3" : sel ? "bg-orange" : "bg-[#6E4631] group-hover:bg-orange",
          )}
        />
      ))}
    </span>
  );
}

export default function QuestionScreen({ question: p, selected, locked, onAnswer }: Props) {
  const isGrid = p.layout !== "rows";
  const impar = isGrid && p.opcoes.length % 2 === 1;

  return (
    <section className="flex flex-1 flex-col gap-[22px] pt-[18px] pb-2">
      <span className={eyebrow}>{p.tema}</span>
      <h2 id="qTitle" className="m-0 font-display text-[clamp(27px,7.4vw,36px)] leading-[1.1] font-bold tracking-[-0.02em] text-balance">
        {p.titulo}
      </h2>
      {p.dica && <p className="-mt-2 mb-0 text-[15px] text-muted">{p.dica}</p>}

      <div role="radiogroup" aria-labelledby="qTitle" className={cn("mt-1", LAYOUT[p.layout])}>
        {p.opcoes.map(([id, label], k) => {
          const sel = selected === id;
          // Cartão largo: todas as opções no layout "rows" e a última de um grid ímpar (ocupa a linha toda).
          const wide = !isGrid || (impar && k === p.opcoes.length - 1);
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={sel}
              onClick={() => onAnswer(id)}
              style={{ animationDelay: `${k * 35}ms` }}
              className={cn(
                "group relative flex w-full animate-rise cursor-pointer rounded-card border text-left text-[16px] leading-tight font-semibold text-text",
                "transition-[border-color,background-color,transform] duration-150 ease-soft active:scale-[0.99]",
                wide
                  ? "min-h-[76px] flex-row items-center gap-3.5 py-3.5 pr-[46px] pl-3.5"
                  : "min-h-[136px] flex-col items-start justify-start gap-3.5 p-3.5",
                wide && isGrid && "col-span-full",
                sel
                  ? "border-orange bg-[linear-gradient(160deg,rgba(255,107,31,0.2),rgba(255,107,31,0.12))]"
                  : "border-line bg-surface hover:border-line-2 hover:bg-[#1C1916]",
                locked && "pointer-events-none",
              )}
            >
              <span
                className={cn(
                  "flex size-[46px] flex-none items-center justify-center rounded-[13px] border transition-[translate,background-color,border-color,color] duration-200 ease-soft group-hover:-translate-y-0.5",
                  sel ? "animate-pop border-orange bg-orange text-ink" : "border-line bg-surface-2 text-amber group-hover:border-line-2 group-hover:bg-[#29231E]",
                )}
              >
                <svg viewBox="0 0 24 24" aria-hidden focusable={false} className="ico-stroke size-6">
                  {OPTION_ICONS[p.id][id]}
                </svg>
              </span>
              <span className={cn("flex w-full flex-col", wide ? "gap-2" : "mt-auto gap-2.5")}>
                <span className="flex-1">{label}</span>
                <Nivel qid={p.id} oid={id} sel={sel} />
              </span>
              <span
                aria-hidden
                className={cn(
                  "absolute flex size-5 items-center justify-center rounded-full border-[1.5px] transition-all duration-[180ms] ease-soft",
                  wide ? "top-1/2 right-3.5 -mt-2.5" : "top-3 right-3",
                  sel ? "border-orange bg-orange" : "border-line-2",
                )}
              >
                <Check
                  strokeWidth={3.2}
                  className={cn("size-[11px] text-ink transition-all duration-[180ms] ease-soft", sel ? "scale-100 opacity-100" : "scale-50 opacity-0")}
                />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
