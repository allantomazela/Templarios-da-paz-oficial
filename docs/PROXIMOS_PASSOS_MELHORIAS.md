# Próximos passos de melhorias

Documento de roadmap técnico para evolução do projeto Templários da Paz, alinhado à manutenibilidade e escalabilidade.

---

## 1. Testes

| Prioridade | Melhoria | Descrição |
|------------|----------|-----------|
| Alta | Aumentar cobertura de testes | Hoje há poucos arquivos de teste (`use-dialog`, `utils`, `visitor-attendance`). Priorizar: stores críticos (`useNewsStore`, `useAuthStore`, `useFinancialStore`), `async-utils` (`withTimeout`, `toErrorMessage`) e fluxos de upload. |
| Média | Testes de integração | Testar fluxos completos (ex.: login → dashboard, criar notícia → salvar) com Testing Library, mantendo mocks do Supabase. |
| Média | CI: cobertura mínima | Adicionar no workflow `deploy.yml` um passo que falhe se a cobertura cair abaixo de um limite (ex.: `vitest run --coverage` + threshold). |

---

## 2. UX e performance

| Prioridade | Melhoria | Descrição |
|------------|----------|-----------|
| Alta | Estados de loading consistentes | Revisar páginas e formulários que ainda não exibem skeleton/spinner ou mensagem clara durante carregamento e após timeout (ex.: listas longas em Financeiro, Agape, Atas). |
| Média | Virtualização de listas | Em listas longas (notícias, mídia, membros, financeiro), usar virtualização (ex.: `react-window` ou `@tanstack/react-virtual`) para manter FPS e tempo de resposta. |
| Média | Contador de caracteres em outros campos | Replicar o padrão do conteúdo de notícias (limite + contador) em outros campos ricos ou de texto longo (ex.: descrição de eventos, atas). |
| Baixa | PWA / offline | Revisar `sw.js` e `manifest.webmanifest`: cache de assets, comportamento offline e mensagem amigável quando não houver rede. |

---

## 3. Segurança e resiliência

| Prioridade | Melhoria | Descrição |
|------------|----------|-----------|
| Alta | Rate limiting no front | Em telas sensíveis (login, reset de senha, envio de formulários públicos), adicionar debounce/throttle ou limite de tentativas por minuto para reduzir abuso. |
| Média | Sanitização de HTML | Onde houver conteúdo rico (TipTap/HTML) exibido para outros usuários, garantir sanitização (ex.: DOMPurify) para mitigar XSS. |
| Média | CORS e headers | Confirmar no backend/Supabase que CORS e headers de segurança (CSP, etc.) estão alinhados ao uso em produção; documentar no README ou em `docs/`. |
| Baixa | Timeouts padronizados | Centralizar valores de timeout (upload, news, outras operações) em constantes ou config por ambiente, reutilizando `withTimeout` onde fizer sentido. |

---

## 4. Código e manutenção

| Prioridade | Melhoria | Descrição |
|------------|----------|-----------|
| Alta | Dividir arquivos > 300 linhas | Identificar páginas ou componentes que passem de ~300 linhas e extrair subcomponentes ou hooks (ex.: `Agenda.tsx`, `Financial.tsx`, `Chancellor.tsx`). |
| Média | Padronizar tratamento de erros | Ampliar o uso de `toErrorMessage` e do logger em stores e serviços que ainda retornem ou exibam erros de forma ad hoc. |
| Média | Tipos Supabase | Manter `src/lib/supabase/types.ts` em sync com o schema (via Supabase CLI ou script) para evitar erros em tempo de desenvolvimento. |
| Baixa | Documentar ErrorBoundary | Registrar em README ou em `docs/` onde o `ErrorBoundary` é usado e qual fallback o usuário vê; considerar boundary por rota ou por seção crítica. |

---

## 5. DevOps e ambiente

| Prioridade | Melhoria | Descrição |
|------------|----------|-----------|
| Média | Variáveis de ambiente | Garantir que todas as variáveis usadas em build (Vite) estejam documentadas (ex.: em README ou `docs/env.md`) e que o CI use apenas secrets, sem valores em claro. |
| Média | Deploy: rollback | Definir procedimento (ou script) para rollback rápido em produção (ex.: manter último build anterior ou tag e re-deploy). |
| Baixa | Preview por PR | Opcional: job no GitHub Actions que faça build (e, se possível, deploy em ambiente de preview) em PRs da branch `main`. |

---

## 6. Funcionalidades e produto

| Prioridade | Melhoria | Descrição |
|------------|----------|-----------|
| Conforme demanda | Notificações em tempo real | Se fizer sentido para o negócio, usar Supabase Realtime em listas ou avisos para atualização sem refresh. |
| Conforme demanda | Filtros e busca | Em listas grandes (membros, notícias, financeiro), adicionar filtros por data, status ou busca por texto para reduzir carga e melhorar uso. |
| Conforme demanda | Acessibilidade (a11y) | Revisar fluxos principais (login, navegação, formulários) com foco em teclado, leitores de tela e contraste; corrigir pontos críticos e documentar. |

---

## Ordem sugerida de execução

1. **Curto prazo:** testes nos stores e em `async-utils`; estados de loading e timeouts padronizados; rate limiting em login/reset.
2. **Médio prazo:** quebrar arquivos grandes; virtualização de listas; sanitização de HTML; documentação de env e ErrorBoundary.
3. **Longo prazo:** cobertura mínima no CI; preview por PR; melhorias de PWA e a11y conforme prioridade do produto.

---

*Atualizado com base no estado do repositório e nas melhorias já aplicadas (async-utils, fluxo de notícias, lint, CI).*
