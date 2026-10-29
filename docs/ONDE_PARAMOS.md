# Onde paramos

Arquivo de continuidade. Leia isto no início de uma sessão e atualize ao terminar uma mudança pedida.

`ESTADO_ATUAL.md` descreve uma fase antiga do projeto. Este arquivo é a referência de onde o trabalho parou.

## Última mudança concluída

| Campo | Valor |
|-------|--------|
| Data | 29/10/2026 |
| Commit | cdee23b |

**O que ficou pronto:** na Chancelaria, a Agenda da Loja separa próximas e anteriores como a Presença. Falas da sessão ganhou registro manual (data, fala, nome e observação), gravado na tabela `session_speech_notes` no Supabase Templários Oficial, com RLS só para quem gere a Chancelaria. O Controle de Graus continua editando grau e datas; desligados e In Memoriam ficam num grupo recolhido e seguem editáveis.

Arquivos: `src/components/chancellor/LodgeAgendaList.tsx`, `src/components/chancellor/SessionSpeechManualForm.tsx`, `src/components/chancellor/DegreeManager.tsx`, `src/lib/session-speech-manual.ts`, `supabase/migrations/20261029120000_session_speech_notes.sql`.

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
