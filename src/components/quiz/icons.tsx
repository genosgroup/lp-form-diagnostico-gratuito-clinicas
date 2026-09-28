import type { ReactNode, SVGProps } from "react";
import type { QuestionId } from "@/lib/quiz/config";

/* ---------- ícones das opções (traço 24x24, estilizados por .ico-stroke) ---------- */

const I = {
  // pessoas / lugares (tamanho da base)
  pessoa: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></>,
  dupla: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20v-1a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v1" /><path d="M15.5 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M18 14.3a5 5 0 0 1 3.5 4.7v1" /></>,
  grupo: <><circle cx="12" cy="7.5" r="3" /><circle cx="5" cy="9.5" r="2.2" /><circle cx="19" cy="9.5" r="2.2" /><path d="M7 20v-1a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v1" /><path d="M1.8 19v-.6A3 3 0 0 1 4.8 15.4h1" /><path d="M22.2 19v-.6a3 3 0 0 0-3-3h-1" /></>,
  clinica: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M12 7v5M9.5 9.5h5" /><path d="M10 21v-4h4v4" /></>,
  predios: <><rect x="2.5" y="9" width="8" height="12" rx="1.5" /><rect x="10.5" y="3" width="11" height="18" rx="1.5" /><path d="M14 7h1M17.5 7h.5M14 11h1M17.5 11h.5M14 15h1M17.5 15h.5M5.5 13h2M5.5 17h2" /></>,
  cidade: <><path d="M2 21h20" /><rect x="3" y="11" width="5" height="10" rx="1" /><rect x="9.5" y="4" width="6" height="17" rx="1" /><rect x="17" y="8" width="4.5" height="13" rx="1" /><path d="M12.5 8v.01M12.5 12v.01M12.5 16v.01M5.5 15v.01M19.2 12v.01M19.2 16v.01" /></>,
  // dinheiro (ticket)
  moeda: <><circle cx="12" cy="12" r="8.5" /><path d="M14.6 9.4c-.5-.9-1.5-1.4-2.6-1.4-1.5 0-2.6.8-2.6 2s1.1 1.7 2.6 2 2.6.8 2.6 2-1.1 2-2.6 2c-1.1 0-2.1-.5-2.6-1.4M12 6.5v1.5M12 16v1.5" /></>,
  moedas: <><circle cx="9" cy="9" r="6" /><path d="M17.8 10.8A6 6 0 1 1 10.8 17.8" /><path d="M8 7h1.2v4" /></>,
  cedula: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6 12h.01M18 12h.01" /></>,
  cedulas: <><rect x="2" y="9" width="17" height="11" rx="2" /><circle cx="10.5" cy="14.5" r="2.3" /><path d="M5.5 6h13.5a2 2 0 0 1 2 2v8.5" /></>,
  joia: <><path d="M6 3h12l4 6-10 12L2 9Z" /><path d="M11 3 8 9l4 12 4-12-3-6" /><path d="M2 9h20" /></>,
  // ajuda
  duvida: <><circle cx="12" cy="12" r="9" /><path d="M9.2 9a3 3 0 0 1 5.8 1c0 2-3 2.6-3 4.2" /><path d="M12 17.5h.01" /></>,
  // tempo (última campanha)
  calOk: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /><path d="m9 15.5 2 2 4-4" /></>,
  calRel: <><path d="M21 10V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" /><path d="M16 3v4M8 3v4M3 10h18" /><circle cx="17.5" cy="17.5" r="4" /><path d="M17.5 15.8v1.9l1.2.8" /></>,
  ampulheta: <><path d="M6 3h12M6 21h12" /><path d="M7 3v3a5 5 0 0 0 10 0V3" /><path d="M7 21v-3a5 5 0 0 1 10 0v3" /></>,
  historico: <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5" /><path d="M12 7.5V12l3 2" /></>,
  calX: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /><path d="m10 13.5 4 4M14 13.5l-4 4" /></>,
  // equipe
  pessoaOk: <><circle cx="9" cy="8" r="4" /><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1" /><path d="m16 11 2 2 4-4" /></>,
  pessoaDiv: <><circle cx="8" cy="8" r="3.5" /><path d="M2 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1" /><path d="M16 6h6M16 10h6M18 14h4" /></>,
  pessoaX: <><circle cx="9" cy="8" r="4" /><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1" /><path d="m17 8 5 5M22 8l-5 5" /></>,
  // follow-up
  listaOk: <><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17" /><path d="M11 6h10M11 12h10M11 18h10" /></>,
  listaMeia: <><path d="m3 6 1.5 1.5L7 5" /><rect x="3" y="10.5" width="4" height="4" rx="1" /><rect x="3" y="16.5" width="4" height="4" rx="1" /><path d="M11 6h10M11 12.5h7M11 18.5h5" /></>,
  msgX: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /><path d="m9.5 7.5 5 5M14.5 7.5l-5 5" /></>,
  // CRM
  kanban: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 7v7M12 7v4M16 7v9" /></>,
  planilha: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" /></>,
  caderno: <><path d="M5 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5Z" /><path d="M9 3v18" /><path d="M3 7h4M3 12h4M3 17h4" /><path d="M12.5 8h3.5" /></>,
};

/** Pizza com a fatia do percentual (inativos). */
function pizza(p: number) {
  const a = 2 * Math.PI * p;
  const x = 12 + 9 * Math.sin(a);
  const y = 12 - 9 * Math.cos(a);
  return (
    <>
      <circle cx="12" cy="12" r="9" />
      <path className="f" d={`M12 12V3A9 9 0 ${p > 0.5 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}Z`} />
    </>
  );
}

export const OPTION_ICONS: Record<QuestionId, Record<string, ReactNode>> = {
  base: { ate500: I.pessoa, "501-1500": I.dupla, "1501-3000": I.grupo, "3001-5000": I.clinica, "5001-10000": I.predios, "10000+": I.cidade },
  ticket: { ate500: I.moeda, "501-1000": I.moedas, "1001-2500": I.cedula, "2501-5000": I.cedulas, "5000+": I.joia },
  inativos: { lt30: pizza(0.2), "30-60": pizza(0.45), "60-90": pizza(0.75), "90+": pizza(0.94), nao_sei: I.duvida },
  ultima_campanha: { "3m": I.calOk, "3-6m": I.calRel, "6-12m": I.ampulheta, "12m+": I.historico, nunca: I.calX },
  dedicado: { sim: I.pessoaOk, divide: I.pessoaDiv, nao: I.pessoaX },
  cadencia: { sim: I.listaOk, parcial: I.listaMeia, nao: I.msgX, nao_sei: I.duvida },
  crm: { sim: I.kanban, parcial: I.planilha, nao: I.caderno },
};

/* ---------- ícones de interface ---------- */

type IconProps = SVGProps<SVGSVGElement>;

const stroke = (w: number): IconProps => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: w,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
});

export const ChevronLeft = (p: IconProps) => <svg {...stroke(2.2)} {...p}><path d="M15 18l-6-6 6-6" /></svg>;
export const ArrowRight = (p: IconProps) => <svg {...stroke(2.6)} {...p}><path d="M5 12h14M13 5l7 7-7 7" /></svg>;
export const ArrowDown = (p: IconProps) => <svg {...stroke(2.6)} {...p}><path d="M12 4v16M5 13l7 7 7-7" /></svg>;
export const ArrowDownShort = (p: IconProps) => <svg {...stroke(2.6)} {...p}><path d="M12 5v14M6 13l6 6 6-6" /></svg>;
export const Check = ({ strokeWidth = 2.4, ...p }: IconProps) => <svg {...stroke(Number(strokeWidth))} {...p}><path d="M20 6 9 17l-5-5" /></svg>;
export const Lock = (p: IconProps) => <svg {...stroke(2.4)} {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
export const Calendar = (p: IconProps) => <svg {...stroke(2.2)} {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>;
export const Alert = (p: IconProps) => <svg {...stroke(2.2)} {...p}><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>;
export const WhatsApp = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable={false} {...p}>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" />
  </svg>
);
