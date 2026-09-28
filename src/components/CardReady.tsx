"use client";

import { useEffect } from "react";

/** Marca <html data-ready="1"> quando as fontes carregam: sinal para a ferramenta de screenshot do card. */
export default function CardReady() {
  useEffect(() => {
    const pronto = () => document.documentElement.setAttribute("data-ready", "1");
    if (document.fonts?.ready) document.fonts.ready.then(pronto);
    else setTimeout(pronto, 400);
  }, []);
  return null;
}
