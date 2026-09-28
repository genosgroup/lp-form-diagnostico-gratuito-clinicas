import { TIME_ZONE } from "./site";

export function fmtN(n: number) {
  return Math.round(n).toLocaleString("pt-BR");
}

export function fmtBRL(n: number) {
  return "R$ " + fmtN(n);
}

export function pac(n: number) {
  return fmtN(n) + (Math.round(n) === 1 ? " paciente" : " pacientes");
}

export function pctTxt(p: number) {
  return Math.round(p * 100) + "%";
}

/** "ana DE souza" -> "Ana de Souza" */
export function nomeBonito(n: string) {
  return String(n || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => (i > 0 && /^(da|de|do|das|dos|e)$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

export function primeiroNome(n: string) {
  const p = String(n || "").trim().split(/\s+/)[0] || "";
  return p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : "";
}

/** "28 de setembro de 2026" */
export function dataExtenso(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: TIME_ZONE });
}

/** "28/09/2026" */
export function dataCurta(d: Date) {
  return d.toLocaleDateString("pt-BR", { timeZone: TIME_ZONE });
}

/** Código exibido ao lead, sem o prefixo: RO-7K4F-2QX -> 7K4F-2QX */
export function codigoCurto(id: string) {
  return String(id || "").replace(/^RO-/, "");
}
