import Logo from "@/components/Logo";
import { codigoCurto, fmtN } from "@/lib/format";
import type { Resultado } from "@/lib/quiz/calc";
import { cn } from "@/components/ui";
import { Alert, ArrowDown } from "@/components/quiz/icons";

type Props = { nome: string; codigo: string; data: string; resultado: Resultado };

// No card o "R$" leva espaço comum: a imagem vai para o WhatsApp, fora do HTML.
const brl = (v: number) => "R$ " + fmtN(v);

/** Fonte menor para valores longos, para caberem na coluna. */
function tamValor(v: number, base: number) {
  const n = brl(v).length;
  return n <= 10 ? base : n <= 12 ? base - 6 : base - 12;
}

const label = "font-mono text-[21px] tracking-[0.14em] text-muted uppercase";

function Etapa({ w, rotulo, valor, final }: { w: string; rotulo: string; valor: string; final?: boolean }) {
  return (
    <div
      style={{ width: w }}
      className={cn(
        "flex h-[58px] items-center justify-between rounded-2xl border px-[30px]",
        final ? "border-transparent bg-[linear-gradient(90deg,var(--color-orange),#FF8A3D)]" : "border-[#332D27] bg-surface",
      )}
    >
      <span className={cn("font-mono text-[20px] tracking-[0.1em] whitespace-nowrap uppercase", final ? "text-[rgba(26,13,5,0.75)]" : "text-muted")}>
        {rotulo}
      </span>
      <b className={cn("font-display text-[29px] font-bold tracking-[-0.01em] whitespace-nowrap tabular-nums", final && "text-ink")}>{valor}</b>
    </div>
  );
}

const Seta = () => (
  <div className="flex h-[18px] items-center justify-center text-orange">
    <ArrowDown strokeWidth={2.4} className="size-[18px]" />
  </div>
);

function Cenario({ nome, valor, base, destaque }: { nome: string; valor: number; base: number; destaque?: boolean }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-2.5 rounded-[20px] px-[22px] py-5",
        destaque ? "border-2 border-orange bg-[linear-gradient(180deg,rgba(255,107,31,0.16),rgba(255,107,31,0.04))]" : "border border-[#332D27] bg-surface",
      )}
    >
      <div className={cn("font-mono text-[17px] tracking-[0.14em] uppercase", destaque ? "text-amber" : "text-muted")}>{nome}</div>
      <b className="font-display font-bold tracking-[-0.02em] whitespace-nowrap tabular-nums" style={{ fontSize: tamValor(valor, base) }}>
        {brl(valor)}
      </b>
    </div>
  );
}

/** Card 1080×1350 do "Diagnóstico de Receita Oculta", para virar imagem e ir pelo WhatsApp. */
export default function DiagnosticCard({ nome, codigo, data, resultado: x }: Props) {
  const R = 98;
  const C = 2 * Math.PI * R;
  const off = C * (1 - x.score / 100);
  const tamNome = nome.length > 40 ? 50 : nome.length > 28 ? 58 : nome.length > 18 ? 70 : 82;
  const [prefixo, ...resto] = x.classificacao.split(" ");
  const topo = [codigo && "Nº " + codigoCurto(codigo), data].filter(Boolean).join(" · ");
  const c = x.cenarios;

  return (
    <div className="relative flex h-[1350px] w-[1080px] flex-col gap-[30px] overflow-hidden bg-bg px-[72px] pt-16 pb-14 font-body leading-[normal] text-text">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(620px 460px at 100% 0%, rgba(255,107,31,.20), transparent 70%), radial-gradient(520px 380px at 0% 100%, rgba(255,178,102,.07), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)",
          backgroundSize: "54px 54px",
          maskImage: "linear-gradient(180deg, #000 0%, transparent 55%)",
        }}
      />

      <header className="relative flex items-center justify-between font-mono text-[22px] tracking-[0.14em] text-muted uppercase">
        <Logo className="h-[52px]" />
        <span>{topo}</span>
      </header>

      <div className="relative flex flex-col gap-3.5">
        <div className="font-mono text-[24px] font-semibold tracking-[0.16em] text-orange uppercase">Diagnóstico de Receita Oculta</div>
        <h1 className="m-0 line-clamp-2 font-display leading-[1.02] font-bold tracking-[-0.02em] text-balance" style={{ fontSize: tamNome }}>
          {nome}
        </h1>
      </div>

      <section className="relative flex items-center gap-11 rounded-[28px] border border-[#332D27] bg-[rgba(24,21,19,0.85)] px-9 py-7">
        <div className="relative size-[200px] flex-none">
          <svg viewBox="0 0 230 230" className="size-full -rotate-90">
            <defs>
              <linearGradient id="rcg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#FF6B1F" />
                <stop offset="1" stopColor="#FFB266" />
              </linearGradient>
            </defs>
            <circle cx="115" cy="115" r={R} fill="none" stroke="#2A2520" strokeWidth={18} />
            <circle
              cx="115"
              cy="115"
              r={R}
              fill="none"
              stroke="url(#rcg)"
              strokeWidth={18}
              strokeLinecap="round"
              strokeDasharray={C.toFixed(1)}
              strokeDashoffset={off.toFixed(1)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <b className="font-display text-[78px] leading-[0.95] font-extrabold tracking-[-0.03em]">{x.score}</b>
            <span className="font-mono text-[20px] text-muted">/100</span>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          <div className={label}>Índice de oportunidade</div>
          <div className="font-display text-[50px] leading-[1.02] font-bold tracking-[-0.015em]">
            {prefixo} <em className="text-orange not-italic">{resto.join(" ")}</em>
          </div>
          <div className="mt-1.5 grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <i
                key={i}
                className={cn(
                  "block h-3 rounded-md",
                  i === x.faixaIdx
                    ? "bg-[linear-gradient(90deg,var(--color-orange),var(--color-amber))]"
                    : i < x.faixaIdx
                      ? "bg-[rgba(255,107,31,0.35)]"
                      : "bg-surface-2",
                )}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="relative flex flex-col items-center">
        <Etapa w="100%" rotulo="Base total" valor={fmtN(x.base) + " pacientes"} />
        <Seta />
        <Etapa w="90%" rotulo="Base potencialmente inativa" valor={fmtN(x.baseReativavel)} />
        <Seta />
        <Etapa w="80%" rotulo="Pacientes reativados*" valor={fmtN(c.intermediario.pacientes)} />
        <Seta />
        <Etapa w="70%" rotulo="Potencial de receita*" valor={brl(c.intermediario.receita)} final />
      </section>

      <section className="relative grid grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)_minmax(0,1fr)] items-stretch gap-4">
        <Cenario nome="Conservador" valor={c.conservador.receita} base={40} />
        <Cenario nome="Intermediário*" valor={c.intermediario.receita} base={46} destaque />
        <Cenario nome="Alta performance" valor={c.alta.receita} base={40} />
      </section>

      <section className="relative flex items-start gap-6 rounded-[20px] bg-surface-2 px-7 py-[22px]">
        <div className="flex size-[52px] flex-none items-center justify-center rounded-[14px] bg-[rgba(255,107,31,0.14)] text-orange">
          <Alert className="size-7" />
        </div>
        <div>
          <div className={label}>Principal gargalo</div>
          <p className="mt-1.5 mb-0 text-[27px] leading-[1.25] font-semibold">{x.gargalos[0]}</p>
        </div>
      </section>

      <footer className="relative mt-auto flex items-end justify-between gap-6 text-[18px] leading-[1.4] text-[#6F665D]">
        <span>*Cenário intermediário. Simulação matemática baseada nas respostas informadas. Não constitui promessa ou garantia de faturamento.</span>
        <span className="font-mono tracking-[0.08em] whitespace-nowrap">genosgroup.com.br</span>
      </footer>
    </div>
  );
}
