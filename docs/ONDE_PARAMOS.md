# Onde paramos

Arquivo de continuidade. Leia isto no início de uma sessão e atualize ao terminar uma mudança pedida.

`ESTADO_ATUAL.md` descreve uma fase antiga do projeto. Este arquivo é a referência de onde o trabalho parou.

## Última mudança concluída

| Campo | Valor |
|-------|--------|
| Data | 10/11/2026 |
| Commit | 12b914d |

**O que ficou pronto:** correção da tarja preta na impressão da folha A4 de visitantes. O fundo da página (`html`/`body`) e do documento passam a forçar branco na impressão, inclusive com o app em tema dark; removido o `break-inside` agressivo no bloco inteiro que podia gerar artefato após as assinaturas. Arquivos: `src/lib/attendance-signature-sheet.ts`, `src/main.css`.

## Banco

Sem mudança de banco nesta correção.

## Onde continuar

Reimprimir a folha de visitantes (preferencialmente com tema dark ativo) e confirmar que não há tarja após Venerável/Chanceler. Depois: Admitir Otacilio e Luciano com data 14/11 e imprimir a folha do quadro.

## Como ver isto de novo

```bash
npm run onde-paramos
```
