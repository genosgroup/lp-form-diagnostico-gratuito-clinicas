/** Estilos de texto que se repetem entre as telas. */

export const eyebrow = "font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-orange";

export const hDisplay = "m-0 font-display font-bold leading-[1.02] tracking-[-0.025em] text-balance";

export const lead = "m-0 max-w-[44ch] text-[17px] leading-[1.55] text-muted text-pretty";

export const fine = "m-0 text-[12.5px] leading-normal text-dim";

export const panel = "flex flex-col gap-4 rounded-panel border border-line bg-[rgba(24,21,19,0.88)] px-5 py-[22px]";

export const panelTitle = "m-0 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-muted";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
