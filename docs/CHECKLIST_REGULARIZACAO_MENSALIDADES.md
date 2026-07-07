# Checklist — Regularização de mensalidades (planilha → sistema)

Use este guia para migrar o controle da planilha Excel para o sistema, irmão a irmão, sem duplicar receita no caixa.

**Data de início do controle em produção:** 18/06/2026  
**Corte no sistema:** a partir de **jun/2026** os pagamentos entram na tesouraria; **jan–mai/2026** é só controle (histórico).

---

## Antes de começar (uma vez)

- [ ] Abrir a planilha do tesoureiro anterior e anotar, por irmão: mês/ano em aberto e mês/ano já quitado.
- [ ] Confirmar valor padrão e dia de vencimento em **Financeiro → Mensalidades** (configuração rápida no topo).
- [ ] Para cada mês de **jun/2026 em diante** que ainda não foi gerado: **Gerar do mês** (cria pendências para todos os irmãos).
- [ ] **Não** usar "Gerar do mês" para jan–mai/2026 — o sistema bloqueia; use o **cronograma** do irmão.
- [ ] Exportar ou imprimir **Financeiro → Relatórios → Mensalidades → Irmãos em atraso** (referência inicial).
- [ ] Guardar cópia da planilha com data (backup antes de alterar o sistema).

### Onde fazer cada coisa no sistema

| Ação | Caminho |
|------|---------|
| Regularizar histórico (jan–mai/2026) | Financeiro → Mensalidades → selecionar irmão → **Ver cronograma** → seção histórica |
| Lançar pagamento de um mês | Cronograma → **Lançar** na linha do mês |
| Pagar vários meses no mesmo PIX | Cronograma → marcar meses → **Registrar pagamento na tesouraria** |
| Lançamento avulso | **Registrar pagamento → Mensalidade** |
| Conferir atrasos | Relatórios → **Mensalidades** → Irmãos em atraso |
| Extrato de um irmão | Relatórios → **Mensalidades** → Extrato por irmão |

---

## Regra rápida por tipo de mês

| Período | Status em aberto | Ao quitar (já estava pago na planilha) | Ao quitar (pagamento novo agora) |
|---------|------------------|----------------------------------------|----------------------------------|
| **jan–mai/2026** | Cronograma → marcar **não pago** → salvar | Cronograma → marcar **pago** → salvar (sem conta; não entra no caixa) | Se o PIX for novo: avaliar com tesouraria; em geral histórico = só controle |
| **jun/2026 em diante** | **Gerar do mês** ou lançamento **Pendente/Atrasado** | **Só controle** ou **Vincular receita existente** se o valor já foi lançado no caixa | **Pago** + conta bancária + data do PIX |

---

## Checklist por irmão

Repita para cada irmão da planilha. Marque conforme for concluindo.

### Identificação

- [ ] **Irmão:** _________________________________
- [ ] **ID / observação na planilha:** _________________________________
- [ ] Planilha consultada em: ___/___/2026

### Conferência na planilha

Liste todos os meses com situação conhecida:

| Mês/ano | Planilha: Pago / Em aberto | Valor (R$) | Observação |
|---------|----------------------------|------------|------------|
| ___/2026 | | | |
| ___/2026 | | | |
| ___/2026 | | | |
| ___/2026 | | | |

**Total em aberto na planilha:** R$ __________ (**___** mês(es))

### Passo A — Meses históricos (jan–mai/2026)

- [ ] Abrir **Ver cronograma** do irmão
- [ ] Na seção de regularização histórica, para cada mês da planilha:
  - [ ] Planilha **pago** → marcar **pago** → salvar
  - [ ] Planilha **em aberto** → marcar **não pago** → salvar (vira **Atrasado**, sem tesouraria)
- [ ] Conferir nota automática: *"Regularização histórica (pré-produção — não entra na tesouraria)"*

### Passo B — Meses de produção (jun/2026 em diante)

Para cada mês em aberto na planilha:

- [ ] Existe lançamento no sistema? (aba **Por irmão** ou cronograma)
  - [ ] **Não** → **Gerar do mês** (se for o mês corrente da loja) **ou** criar manualmente com status **Atrasado**
  - [ ] **Sim** → conferir se status bate com a planilha (Pago / Pendente / Atrasado)

### Passo C — Quitação (quando houver pagamento ou ajuste)

Escolha **uma** opção por mês quitado:

#### C1 — Pagou só este mês (PIX ou dinheiro novo)

- [ ] Cronograma → **Lançar** na linha do mês
- [ ] Status **Pago**
- [ ] Conta bancária
- [ ] Data do pagamento = data que entrou no banco
- [ ] Modo tesouraria: **Padrão** (gera receita)

#### C2 — Pagou vários meses de uma vez (ex.: 2 mensalidades no mesmo PIX)

- [ ] Cronograma → **Selecionar todos em aberto** (ou marcar só os meses quitados)
- [ ] **Registrar pagamento na tesouraria** (quitação em lote)
- [ ] Conta bancária + data do PIX
- [ ] Conferir: uma receita por mês de referência (normal)

#### C3 — Já estava pago na planilha / valor já estava no caixa antes do sistema

- [ ] **Não** usar conta bancária se isso duplicaria o saldo
- [ ] Modo: **Só controle — receita já lançada na tesouraria**
- [ ] **Ou** **Vincular receita existente** se já existe lançamento manual no caixa

#### C4 — Ainda em aberto (sem pagamento)

- [ ] Manter **Pendente** ou **Atrasado**
- [ ] Não informar conta bancária
- [ ] Irmão aparece em **Atrasos** e no relatório de mensalidades

### Passo D — Conferência final do irmão

- [ ] **Relatórios → Mensalidades → Extrato por irmão** — bate com a planilha?
- [ ] Quantidade de meses em atraso no sistema = planilha? (**___** vs **___**)
- [ ] Total em aberto no sistema = planilha? R$ **___** vs R$ **___**
- [ ] Nenhuma receita duplicada no caixa (histórico sem conta; produção com uma receita por quitação real)
- [ ] Observações: _________________________________________________

- [ ] **Irmão regularizado** — data: ___/___/2026 — responsável: _______________

---

## Casos frequentes

### Irmão com 2 mensalidades em atraso

1. Identifique **quais meses** (ex.: mai/2026 + jun/2026 ou jun/2026 + jul/2026).
2. **Mai/2026** → Passo A (histórico, só controle).
3. **Jun/2026** → Passo B (produção, pendência ou atraso).
4. Na hora do pagamento:
   - **Um PIX por mês** → C1 em cada mês.
   - **Um PIX pelos dois** → C2 (lote); para o mês histórico, confirme se o valor é novo ou já estava no caixa (C3 vs C1).

### Irmão em dia na planilha, mas aparece em atraso no sistema

- [ ] Falta regularização histórica (Passo A)?
- [ ] Mês de produção gerado como Pendente sem quitar na planilha?
- [ ] Pagamento marcado Pago sem vínculo correto (órfão)? Revisar no cronograma badges e modo tesouraria.

### Irmão pagou antes de 18/06/2026 mas o sistema só controla a partir de jun/2026

- Meses **antes de jun/2026**: use apenas cronograma histórico (pago/não pago).
- **Jun/2026**: se já estava pago na planilha antes do go-live, use **Só controle** ou **Vincular receita existente**, não lance receita nova.

---

## Conferência geral (após todos os irmãos)

- [ ] **Relatórios → Mensalidades → Irmãos em atraso** — lista coerente com a planilha?
- [ ] Exportar CSV do relatório de atrasos e arquivar junto com a planilha final.
- [ ] Conferir saldo do caixa: soma das mensalidades **Pago** com conta (jun/2026+) não deve incluir histórico jan–mai.
- [ ] Irmãos com **3+ meses** em atraso: revisar lista de escalonamento (comunicações automáticas, se ativas).
- [ ] Anotar pendências que ficaram para cobrança futura: _________________________________

---

## Erros a evitar

| Erro | Consequência | Correção |
|------|--------------|----------|
| Marcar histórico **Pago** com conta bancária | Duplica receita no caixa | Voltar para só controle / remover vínculo |
| Usar **Gerar do mês** antes de jun/2026 | Sistema bloqueia | Usar cronograma histórico |
| Um PIX de 2 meses, lançar só 1 mês | Irmão continua em atraso no outro mês | Quitar em lote (C2) |
| Deixar mês em aberto sem lançamento | Cronograma mostra, mas relatórios podem ficar incompletos | Criar Pendente/Atrasado ou gerar o mês |

---

## Controle de progresso

| # | Irmão | Histórico (A) | Produção (B) | Quitação (C) | Conferido (D) |
|---|-------|---------------|--------------|--------------|---------------|
| 1 | | ☐ | ☐ | ☐ | ☐ |
| 2 | | ☐ | ☐ | ☐ | ☐ |
| 3 | | ☐ | ☐ | ☐ | ☐ |
| 4 | | ☐ | ☐ | ☐ | ☐ |
| 5 | | ☐ | ☐ | ☐ | ☐ |
| 6 | | ☐ | ☐ | ☐ | ☐ |
| 7 | | ☐ | ☐ | ☐ | ☐ |
| 8 | | ☐ | ☐ | ☐ | ☐ |
| 9 | | ☐ | ☐ | ☐ | ☐ |
| 10 | | ☐ | ☐ | ☐ | ☐ |

*(Duplique as linhas conforme o número de irmãos da loja.)*

---

## Referência técnica (código)

- Corte histórico vs produção: `src/lib/membership-schedule.ts` (`MEMBERSHIP_TRACKING_START_MONTH = 6`)
- Backfill histórico: `src/lib/membership-history-backfill.ts`
- Modos de tesouraria: `src/lib/membership-control-only.ts` (`standard`, `control_only`, `link_existing`)

---

*Última atualização: junho/2026 — alinhado ao módulo Financeiro → Mensalidades e Relatórios → Mensalidades.*
