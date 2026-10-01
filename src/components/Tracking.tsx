import Script from "next/script";

/**
 * Medicao da LP.
 *
 * Esta pagina ficou no ar sem nenhuma das duas tags. O quiz ja chamava
 * fbq("track","Lead") e empilhava eventos no dataLayer, mas o Pixel nunca
 * era carregado e nao havia GTM nem GA4 na pagina: as chamadas caiam no
 * vazio. Era a unica pagina do dominio invisivel no Analytics e na Meta —
 * e a falha nao dava nenhum sinal, porque nada quebra na tela.
 *
 * Mesmos IDs do resto do dominio, de proposito: uma propriedade do GA4 e
 * um Pixel para a Genos inteira. Propriedade por LP parte o funil em
 * pedacos que nao somam, e Pixel por LP fragmenta o aprendizado e deixa
 * cada publico pequeno demais para a Meta otimizar.
 *
 * O content_group separa esta LP das outras paginas nos relatorios sem
 * depender de filtro por URL.
 */
const GA_ID = "G-X2G6KW4TNY";
const META_PIXEL_ID = "624880005754303";
const CONTENT_GROUP = "LP · Receita Oculta";

export default function Tracking() {
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}
gtag("set","linker",{"domains":["genosgroup.com.br"]});
gtag("js", new Date());
gtag("config", "${GA_ID}", {content_group: "${CONTENT_GROUP}"});`}
      </Script>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
      </Script>
    </>
  );
}

export function TrackingNoScript() {
  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
