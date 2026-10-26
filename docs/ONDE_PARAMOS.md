# Onde paramos

Arquivo de continuidade. Leia isto no início de uma sessão e atualize ao terminar uma mudança pedida.

`ESTADO_ATUAL.md` descreve uma fase antiga do projeto. Este arquivo é a referência de onde o trabalho parou.

## Última mudança concluída

| Campo | Valor |
|-------|--------|
| Data | 26/10/2026 |
| Commit de produto | `501912e` (16/10/2026 14:47), `main` igual a `origin/main` |
| Esta sessão | registro de continuidade, ainda sem commit |

**O que ficou pronto no código publicado:** quadro de irmãos da Secretaria com abas Ativos, Desligados e In Memoriam. Desligados e In Memoriam saem da lista e da contagem do quadro ativo. Situação `in_memoriam` no cadastro, com migração `supabase/migrations/20261016120000_brothers_membership_situation_in_memoriam.sql`. A lista em si foi extraída para `src/components/secretariat/BrothersRosterViews.tsx`; `BrothersList.tsx` ficou como orquestrador (abas, filtros e CRUD).

No mesmo dia, antes disso: impressão em lote das folhas de presença na Chancelaria e afastados por saúde na folha e na chamada como Justificado, com a coluna de assinatura em branco para o Chanceler anotar à mão.

## Onde continuar

Não havia tarefa pela metade no código. O próximo passo é o que for pedido a partir daqui.

Conferir, se ainda não foi feito no Supabase de produção, se a migração `20261016120000_brothers_membership_situation_in_memoriam.sql` já foi aplicada.

## Como ver isto de novo

```bash
npm run onde-paramos
```
