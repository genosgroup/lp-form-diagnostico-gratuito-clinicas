import type { NextConfig } from "next";
import { BASE_PATH } from "./src/lib/site";

const isDev = process.env.NODE_ENV === "development";

/*
 * Content Security Policy sem nonce (a página é estática), como no guia do Next.
 * Libera o Cloudflare Web Analytics, que a zona injeta sozinha. Os domínios do Google
 * (GTM/GA) e da Meta (Pixel) também já estão liberados para quando
 * as tags forem instaladas; nada deles é carregado hoje.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://connect.facebook.net https://static.cloudflareinsights.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.googletagmanager.com https://*.google-analytics.com https://www.facebook.com",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""} https://www.googletagmanager.com https://*.google-analytics.com https://connect.facebook.net https://www.facebook.com https://cloudflareinsights.com`,
  "frame-src https://www.googletagmanager.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Mesma URL pública: genosgroup.com.br/receitaoculta
  basePath: BASE_PATH,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // No domínio a raiz é da LP principal; isto só vale para o endereço workers.dev,
  // cuja raiz levaria a um 404.
  async redirects() {
    return [{ source: "/", destination: BASE_PATH, basePath: false, permanent: false }];
  },
};

export default nextConfig;
