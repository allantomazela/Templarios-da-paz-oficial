# Onde paramos

Arquivo de continuidade. Leia isto no início de uma sessão e atualize ao terminar uma mudança pedida.

`ESTADO_ATUAL.md` descreve uma fase antiga do projeto. Este arquivo é a referência de onde o trabalho parou.

## Última mudança concluída

| Campo | Valor |
|-------|--------|
| Data | 29/10/2026 |
| Commit | f845caa |

**O que ficou pronto:** o título "Certificado de Presença" ficou centralizado, em creme sobre a faixa vinho da logo (`#5b0303`), no lugar do azul. A impressão voltou ao cartão de 20×15 cm, centralizado na A4 paisagem, para a borda não ser cortada. A captura da impressão e do PDF passou a PNG em escala maior, para as duas logos saírem mais nítidas. Arquivos: `src/components/chancellor/VisitorCertificateDocument.tsx`, `src/main.css` e `src/lib/visitor-certificate-export.ts`.

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
