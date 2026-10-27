# Onde paramos

Arquivo de continuidade. Leia isto no início de uma sessão e atualize ao terminar uma mudança pedida.

`ESTADO_ATUAL.md` descreve uma fase antiga do projeto. Este arquivo é a referência de onde o trabalho parou.

## Última mudança concluída

| Campo | Valor |
|-------|--------|
| Data | 26/10/2026 |
| Branch | `main` |

**O que ficou pronto no código publicado:** quadro de irmãos da Secretaria com abas Ativos, Desligados e In Memoriam. Desligados e In Memoriam saem da lista e da contagem do quadro ativo. Situação `in_memoriam` no cadastro, com migração `supabase/migrations/20261016120000_brothers_membership_situation_in_memoriam.sql`. A lista em si foi extraída para `src/components/secretariat/BrothersRosterViews.tsx`; `BrothersList.tsx` ficou como orquestrador (abas, filtros e CRUD).

No mesmo dia, antes disso: impressão em lote das folhas de presença na Chancelaria e afastados por saúde na folha e na chamada como Justificado, com a coluna de assinatura em branco para o Chanceler anotar à mão.

## Banco

Em 26/10/2026 o SQL `20261016120000_brothers_membership_situation_in_memoriam.sql` foi executado no Supabase **Templários Oficial** e concluiu com sucesso. A situação `in_memoriam` está aceita em `public.brothers`.

No mesmo dia, o CIM da planilha `membros_obreiros-v2.xlsx` foi gravado para o quadro. Celso de Paiva Costa ficou `338371` e José Antônio Dalanezi ficou `327932`, conferidos na imagem do Chanceler.

A folha de presença ganhou a opção **Ordem da lista**, na impressão avulsa e no lote. O padrão continua alfabético. O Chanceler pode escolher **Por grau (Mestres, Companheiros, Aprendizes)** só naquela impressão. Dentro de cada grau, a ordem segue o nome.

A Chancelaria ganhou a aba **Falas da sessão**. O Chanceler escolhe o período e marca o que vai falar: aniversário, cunha, sobrinhos, iniciação, elevação, exaltação e um conjunto curto de datas da sociedade. A lista só sai na impressão A4. A Agenda e os feriados já existentes não foram alterados. Datas pessoais só aparecem se estiverem no cadastro.

## Onde continuar

O próximo passo é o que for pedido a partir daqui.

## Como ver isto de novo

```bash
npm run onde-paramos
```
