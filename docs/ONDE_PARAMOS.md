# Onde paramos

Arquivo de continuidade. Leia isto no início de uma sessão e atualize ao terminar uma mudança pedida.

`ESTADO_ATUAL.md` descreve uma fase antiga do projeto. Este arquivo é a referência de onde o trabalho parou.

## Última mudança concluída

| Campo | Valor |
|-------|--------|
| Data | 22/11/2026 |
| Commit | 416df53 |

**O que ficou pronto:** texto da prancha em preto (sobrepõe a regra global branca dos `p`) e quebra de linha dentro do painel do modelo (`min-width: 0` + `overflow-wrap`), sem alterar o editor TipTap nem o fluxo de salvar/imprimir.

**Arquivos:** `main.css`, `lodge-prancha-print-style.ts`, `LodgePranchaDocument.tsx`.

## Onde continuar

Validar prévia/impressão (cor preta + wrap no limite do painel) após o deploy.

## Como ver isto de novo

```bash
npm run onde-paramos
```
