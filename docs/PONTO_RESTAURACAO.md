# Ponto de restauração — baseline 29/06/2026 (PWA)

Documento atualizado após validação do deploy **PWA** (ícones instaláveis, prompt iOS/Android, geração de ícones a partir do logo).

## Identificadores do ponto seguro

| Item | Valor |
|------|--------|
| **Tag Git (antes do PWA)** | `restore-point-2026-06-29-pre-pwa` → commit `8b60001` |
| **Branch de backup (pré-PWA)** | `restore/baseline-2026-06-29-pre-pwa` |
| **Tag Git (após PWA validado)** | `restore-point-2026-06-29` |
| **Branch de backup (pós-PWA)** | `restore/baseline-2026-06-29` |
| **Versão package.json** | `0.0.79` |

### Restaurar produção ao estado **antes** do PWA

```bash
git fetch origin --tags
git checkout restore-point-2026-06-29-pre-pwa
npm install --legacy-peer-deps
npm run build
# Deploy manual ou Actions conforme docs/DEPLOY-CHECKLIST.md
```

### Restaurar ao baseline **com PWA** (após este deploy)

```bash
git fetch origin --tags
git checkout restore-point-2026-06-29
npm install --legacy-peer-deps
npm run build
```

> Atualize `STABLE_COMMIT` em `.github/workflows/rollback-emergency.yml` após confirmar o site em produção.

---

# Ponto de restauração — baseline 26/06/2026

Documento de referência após validação geral do sistema e criação de tag/branch de restauração, em resposta aos incidentes de deploy do dia **25/06/2026**.

## Identificadores do ponto seguro

| Item | Valor |
|------|--------|
| **Tag Git** | `restore-point-2026-06-26` |
| **Branch de backup** | `restore/baseline-2026-06-26` |
| **Commit de referência (código estável pós-rollback)** | `a6175de` — *fix(deploy): apply stable nginx and full GET smoke test after rollback* |
| **Commit anterior de emergência (24/06)** | `47b511d` — usado no rollback manual de 25/06 |
| **Versão package.json** | `0.0.79` |

## Como restaurar (sem alterar banco de dados)

### 1. Restaurar apenas o código (local ou CI)

```bash
git fetch origin --tags
git checkout restore-point-2026-06-26
npm install --legacy-peer-deps
npm run build
```

### 2. Rollback de emergência no servidor (GitHub Actions)

1. Repositório → **Actions** → **Rollback emergência (24/06/2026)**
2. **Run workflow** (disparo manual)
3. O workflow faz checkout do commit estável configurado, build e deploy no Vultr

> Após este baseline, atualize `STABLE_COMMIT` em `.github/workflows/rollback-emergency.yml` se criar um novo ponto de restauração.

### 3. Restaurar Nginx no servidor (sem redeploy do front)

```bash
# No servidor (via SSH), conforme scripts existentes:
bash scripts/rollback-server-production.sh docs/nginx-templarios-stable.conf
```

Config estável documentada em `docs/nginx-templarios-stable.conf` e `docs/DEPLOY_TROUBLESHOOTING.md`.

### 4. Banco de dados (Supabase)

**Não** reverter migrations automaticamente em produção. O ponto de restauração cobre **frontend + deploy + nginx**. Para o banco:

- Migrations aplicadas permanecem; revert exige plano manual no Supabase Dashboard ou migration de rollback dedicada.
- Antes de migrations destrutivas, exportar snapshot no Supabase (Settings → Database → Backups).

---

## Validação executada em 26/06/2026

| Verificação | Resultado |
|-------------|-----------|
| TypeScript (`tsc --noEmit`) | OK |
| Testes unitários (`npm run test`) | OK — 67 testes, 16 arquivos |
| Build produção (`npm run build`) | OK — após `npm install --legacy-peer-deps` |
| Linter (`npm run lint`) | OK — 0 erros, 6 avisos (hooks/exhaustive-deps) |
| Working tree Git | Limpa, `main` sincronizada com `origin` |

---

## Checklist por módulo

| Módulo | Rota / entrada | Bibliotecas / componentes críticos | Status |
|--------|----------------|-------------------------------------|--------|
| **Site público** | `/` → `Index.tsx` | SEO, contato, veneráveis | OK |
| **Autenticação** | `/login`, `/reset-password` | `useAuthStore.ts`, RLS profiles | OK |
| **Dashboard** | `/dashboard` | `DashboardLayout`, métricas | OK |
| **Secretaria** | `/dashboard/secretariat` | Irmãos, atas, candidatos, documentos | OK |
| **Financeiro** | `/dashboard/financial` | Mensalidades, tesouraria, taxas de grau, ágape financeiro | OK |
| **Chancelaria** | `/dashboard/chancellor` | Presença, certificado visitante, sólidos, graus | OK |
| **Ágape** | `/dashboard/agape` | Consumo, fechamento mensal, cobranças | OK |
| **Relatórios** | `/dashboard/reports` | GOB, balancete, relatórios customizados | OK |
| **Agenda** | `/dashboard/agenda` | Eventos, check-in | OK |
| **Biblioteca** | `/dashboard/library` | Itens por grau | OK |
| **Perfil / Cadastro** | `/dashboard/profile` | Cadastro completo do irmão, avatar | OK |
| **Meus pagamentos** | `/dashboard/payments` | Extrato unificado (mensalidade, ágape, taxas) | OK |
| **Administração** | `/dashboard/admin` | Usuários, aprovações, auditoria | OK |
| **Configurações** | `/dashboard/settings` | Institucional, tema, SEO | OK |
| **Check-in QR** | `/checkin/*`, `/checkin-templo` | Geofence, tokens | OK |

---

## Incidente 25/06/2026 — lições aprendidas

1. **Deploy / cache / nginx** — Várias alterações de nginx, cache de `index.html` e entrega de assets JS causaram site inacessível ou em branco para clientes externos. Rollback para `47b511d` (24/06) + correções nginx estáveis.
2. **Sempre validar build** antes de deploy: `npm install --legacy-peer-deps && npm run build && npm run test`.
3. **Smoke test externo** — O deploy atual valida download HTTP do bundle principal (ver `deploy.yml`).
4. **Não misturar** alterações de infraestrutura (nginx, Cloudflare) com features de negócio no mesmo deploy quando possível.

---

## Criar um novo ponto de restauração (futuro)

```bash
# 1. Validar
npm install --legacy-peer-deps
npm run test
npm run build

# 2. Anotar commit atual
git rev-parse HEAD

# 3. Criar tag e branch (substituir DATA)
git tag -a restore-point-AAAA-MM-DD -m "Baseline validado: testes + build OK"
git branch restore/baseline-AAAA-MM-DD

# 4. Publicar
git push origin main
git push origin restore-point-AAAA-MM-DD restore/baseline-AAAA-MM-DD

# 5. Atualizar STABLE_COMMIT em rollback-emergency.yml e este documento
```

---

## Contatos e referências

- Deploy: `docs/DEPLOY-CHECKLIST.md`
- Troubleshooting: `docs/DEPLOY_TROUBLESHOOTING.md`
- Padrão pós-save: `docs/PADRAO_ATUALIZACAO_APOS_SAVE.md`
