# Onde paramos

Arquivo de continuidade. Leia isto no início de uma sessão e atualize ao terminar uma mudança pedida.

`ESTADO_ATUAL.md` descreve uma fase antiga do projeto. Este arquivo é a referência de onde o trabalho parou.

## Última mudança concluída

| Campo | Valor |
|-------|--------|
| Data | 05/11/2026 |
| Commit | alteração local ainda não commitada |

**O que ficou pronto:** layout profissional da **Visitantes A4** — grade estável (sem absolute/break-inside por tr), linhas 7,2 mm × 25, Nome/Assinatura priorizados, 15 mm até assinaturas e 5 mm até o nome, margens 10/12/10/10. Arquivos: `VisitorSignatureSheetDocument.tsx`, `AttendanceSignatureSheetFooter.tsx`, `attendance-signature-sheet.ts`, `main.css`.

## Banco

Em 26/10/2026 o SQL `20261016120000_brothers_membership_situation_in_memoriam.sql` foi executado no Supabase **Templários Oficial** e concluiu com sucesso. A situação `in_memoriam` está aceita em `public.brothers`.

No mesmo dia, o CIM da planilha `membros_obreiros-v2.xlsx` foi gravado para o quadro. Celso de Paiva Costa ficou `338371` e José Antônio Dalanezi ficou `327932`, conferidos na imagem do Chanceler.

A folha de presença ganhou a opção **Ordem da lista**, na impressão avulsa e no lote. O padrão continua alfabético. O Chanceler pode escolher **Por grau (Mestres, Companheiros, Aprendizes)** só naquela impressão. Dentro de cada grau, a ordem segue o nome.

A Chancelaria ganhou a aba **Falas da sessão**. O Chanceler escolhe o período e marca o que vai falar: aniversário, cunha, sobrinhos, iniciação, elevação, exaltação e um conjunto curto de datas da sociedade. A lista só sai na impressão A4. A Agenda e os feriados já existentes não foram alterados. Datas pessoais só aparecem se estiverem no cadastro.

## Onde continuar

Validar a impressão **Visitantes A4** (grade completa + assinaturas) e, se estiver ok, pedir commit e push. No Chrome, desmarcar “Imprimir cabeçalhos e rodapés” e preferir escala 100%.

## Como ver isto de novo

```bash
npm run onde-paramos
```
