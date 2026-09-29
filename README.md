# LP Diagnóstico Gratuito para Clínicas (Receita Oculta)

Quiz de 7 perguntas que estima a receita parada na base de pacientes de uma clínica, captura nome e WhatsApp e mostra o diagnóstico completo. Feito em **Next.js + TypeScript + Tailwind CSS** e publicado no **Cloudflare Workers** (OpenNext), no mesmo padrão das outras LPs da Genos. Endereço: **[genosgroup.com.br/receitaoculta](https://genosgroup.com.br/receitaoculta)**.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # e preencha as variáveis (ver "Planilha")
npm run dev                  # http://localhost:3000/receitaoculta
```

- `http://localhost:3000/receitaoculta#resultado-exemplo` abre a tela de resultado com respostas fictícias (não envia nada).
- `http://localhost:3000/receitaoculta/card` mostra o card 1080×1350 de exemplo.
- `npm run preview` roda o build dentro do runtime do Worker (mais próximo da produção).

## Variáveis de ambiente

| Variável | Uso |
| --- | --- |
| `SHEETS_WEBHOOK_URL` | URL do App da Web do Apps Script que grava os leads na planilha (termina em `/exec`). |
| `SHEETS_WEBHOOK_TOKEN` | Token gerado pela função `configurar` do Apps Script. |

Sem elas o site funciona, mas `/api/lead` responde 503 e o lead fica guardado no navegador da pessoa para reenvio automático na próxima visita.

## Estrutura

```
src/
  app/
    layout.tsx          metadados e fontes (Bricolage Grotesque, Manrope, IBM Plex Mono)
    page.tsx            o quiz
    card/page.tsx       card 1080×1350 do diagnóstico (imagem para o WhatsApp)
    api/lead/route.ts   valida o lead, recalcula o resultado e grava na planilha
    globals.css         tema do Tailwind (cores, raios, animações)
  components/quiz/      uma tela por arquivo (Intro, QuestionScreen, Processing, Capture, ResultScreen)
  lib/
    quiz/config.ts      perguntas e parâmetros de negócio (pontos médios, taxas, score, gargalos)
    quiz/calc.ts        motor de cálculo (roda no navegador e no Worker)
    lead.ts             contrato e validações compartilhadas entre formulário e API
    sheet-row.ts        colunas da planilha
    tracking.ts         UTMs, click IDs e eventos no dataLayer
apps-script/Code.gs     script que recebe os leads na planilha
```

Os parâmetros do cálculo (pontos médios de cada faixa, taxas dos cenários, pesos do índice, temperatura do lead) ficam todos em `src/lib/quiz/config.ts`.

## Planilha

Os leads vão para uma planilha do Google por um Apps Script publicado como App da Web. O fluxo é navegador → `/api/lead` (Worker) → Apps Script → planilha. A URL do Apps Script e o token ficam só no Worker.

1. Crie a planilha e abra **Extensões > Apps Script**.
2. Cole o conteúdo de `apps-script/Code.gs` e salve.
3. Selecione a função `configurar` e clique em **Executar** (autorize o acesso). No **Registro de execução** aparece o token; copie.
4. **Implantar > Nova implantação**, tipo **App da Web**: *Executar como*: **Eu**; *Quem pode acessar*: **Qualquer pessoa**. Copie a URL que termina em `/exec`.
5. Configure os secrets do Worker:
   ```bash
   npx wrangler secret put SHEETS_WEBHOOK_URL     # cole a URL /exec
   npx wrangler secret put SHEETS_WEBHOOK_TOKEN   # cole o token
   ```
   (ou no painel: *Workers > lp-form-diagnostico-gratuito-clinicas > Settings > Variables and Secrets*, como **Secret**).

A aba **Leads** é criada pelo `configurar` e o cabeçalho completo nasce com o primeiro lead.

**Colunas: a planilha decide.** Depois do cabeçalho criado, só as colunas que estão nele são preenchidas. Pode apagar as que não quer e reordenar à vontade; nada quebra e elas não voltam sozinhas. Para trazer uma coluna de volta, digite o nome exato dela no cabeçalho ou rode `restaurarColunas` pelo editor, que devolve todas as que o site envia e estão faltando. A única que não pode sair é **ID do diagnóstico**: é ela que impede linhas duplicadas, e se for apagada volta sozinha no fim.

Se o código do Apps Script mudar, cole a versão nova, salve e publique uma **nova versão** da mesma implantação (*Implantar > Gerenciar implantações > lápis > Versão: Nova versão > Implantar*), para a URL continuar a mesma. Para trocar o token, rode `trocarToken` e atualize o secret.

**O que vai para cada linha:** data/hora, código do diagnóstico, nome, WhatsApp, as 7 respostas, índice, classificação, temperatura (HOT/QUENTE/MORNO/FRIO), maturidade, base estimada e inativa, os 3 cenários em R$, os 3 gargalos, `utm_source`/`medium`/`campaign`/`content`/`term`/`id`, `gclid`/`gbraid`/`wbraid`/`fbclid`/`fbc`/`fbp`, página de entrada, referrer, tempo no quiz, a mensagem pronta para o WhatsApp, o link do card, o texto do consentimento, IP, navegador e versão do quiz.

## Segurança

- **Nenhum segredo no navegador:** a URL do Apps Script e o token ficam só como secrets do Worker; o Apps Script recusa chamadas sem o token.
- **O servidor não confia no navegador:** a API valida cada campo (respostas só entre as opções existentes, nome e WhatsApp com as mesmas regras do formulário, UTMs com tamanho limitado) e **recalcula** índice, cenários e gargalos a partir das respostas antes de gravar.
- **Antispam:** honeypot invisível, tempo mínimo de quiz, checagem de origem (só aceita envios da própria LP), limite de 10 envios por minuto por IP (binding `ratelimits` do Worker) e limite de tamanho do corpo.
- **Planilha:** gravação com lock, deduplicação pelo código do diagnóstico (reenvios não duplicam linhas) e proteção contra injeção de fórmula (`=`, `+`, `-`, `@`).
- **Cabeçalhos:** CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS e COOP, em `next.config.ts`. A CSP já libera GTM, Google Analytics e Pixel da Meta para quando as tags forem instaladas.
- O card (`/receitaoculta/card`) só aceita o nome como texto livre (validado); os valores são recalculados das respostas, então não dá para gerar um card com números inventados.

## Rastreamento

Nenhuma tag é carregada por enquanto. Os eventos do funil já vão para o `window.dataLayer`, prontos para um GTM: `quiz_started`, `question_N_answered`, `lead_form_viewed`, `locked_score_clicked`, `lead_form_error`, `lead_submitted`, `result_viewed`, `diagnostic_requested`, `whatsapp_clicked`, `quiz_abandoned`. Se o Pixel da Meta for instalado, o `Lead` sai com `eventID = <código>-lead` (para deduplicar com a API de Conversões).

## Deploy (Cloudflare Workers)

O site roda no Cloudflare Workers com o adaptador [OpenNext](https://opennext.js.org/cloudflare) (`wrangler.jsonc` e `open-next.config.ts`). O Worker se chama `lp-form-diagnostico-gratuito-clinicas`.

- **Automático:** cada push na `main` publica pelo GitHub Actions (`.github/workflows/deploy.yml`). O repositório precisa dos segredos `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` em *Settings > Secrets and variables > Actions*.
- **Manual:** `npx wrangler login` e depois `npm run deploy`.
  - No Windows, o `opennextjs-cloudflare deploy` pode falhar ao iniciar o runtime local (`workerd`: *access violation*). Nesse caso, depois do build, publique direto com o wrangler: `npm run cf:build` e então `OPEN_NEXT_DEPLOY=true npx wrangler deploy` (no PowerShell: `$env:OPEN_NEXT_DEPLOY="true"; npx wrangler deploy`). Sempre que possível, prefira o deploy automático (Linux).
- **Endereço:** `genosgroup.com.br/receitaoculta`. O Next serve tudo sob o `basePath` `/receitaoculta` (`src/lib/site.ts`) e a rota `genosgroup.com.br/receitaoculta*` aponta para este Worker (Cloudflare > *Workers Routes* da zona `genosgroup.com.br`), não no `wrangler.jsonc`, como no ebook. O resto do domínio continua no Worker `lp-genos-principal`. No `workers.dev` (`https://lp-form-diagnostico-gratuito-clinicas.group-656.workers.dev`), a raiz redireciona para `/receitaoculta`.
