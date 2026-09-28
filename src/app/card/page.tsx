import type { Metadata, Viewport } from "next";
import DiagnosticCard from "@/components/DiagnosticCard";
import CardReady from "@/components/CardReady";
import { dataCurta } from "@/lib/format";
import { LEAD_ID_PATTERN, limparTexto, nomeValido } from "@/lib/lead";
import { calcular, decodificarRespostas, type Answers } from "@/lib/quiz/calc";

/*
 * Card 1080×1350 do diagnóstico, para gerar a imagem enviada pelo WhatsApp.
 * O link completo é gravado na planilha (coluna "Link do card"):
 *   /card?n=<nome>&c=<RO-XXXX-XXX>&d=<dd/mm/aaaa>&r=<um dígito por resposta>
 * Só o nome é texto livre (validado); números e gargalos são recalculados das respostas,
 * então não dá para montar um card com valores inventados.
 * Quando as fontes carregam, <html data-ready="1"> sinaliza a ferramenta de screenshot.
 */

export const metadata: Metadata = {
  title: "Card Receita Oculta",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 1080 };

const EXEMPLO: Answers = {
  base: "1501-3000",
  ticket: "1001-2500",
  inativos: "60-90",
  ultima_campanha: "12m+",
  dedicado: "divide",
  cadencia: "nao",
  crm: "parcial",
};

const primeiro = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function CardPage({ searchParams }: PageProps<"/card">) {
  const q = await searchParams;
  const respostas = decodificarRespostas(primeiro(q.r));
  const nome = primeiro(q.n);
  const codigo = primeiro(q.c);
  const data = primeiro(q.d);

  const dados = respostas
    ? {
        nome: nomeValido(nome) ? limparTexto(nome) : "Sua clínica",
        codigo: LEAD_ID_PATTERN.test(codigo) ? codigo : "",
        data: /^\d{2}\/\d{2}\/\d{4}$/.test(data) ? data : "",
        resultado: calcular(respostas),
      }
    : { nome: "Ana Exemplo", codigo: "RO-EXEMPLO", data: dataCurta(new Date()), resultado: calcular(EXEMPLO) };

  return (
    <>
      <DiagnosticCard {...dados} />
      <CardReady />
    </>
  );
}
