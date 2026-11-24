# Onde paramos

Arquivo de continuidade. Leia isto no início de uma sessão e atualize ao terminar uma mudança pedida.

`ESTADO_ATUAL.md` descreve uma fase antiga do projeto. Este arquivo é a referência de onde o trabalho parou.

## Última mudança concluída

| Campo | Valor |
|-------|--------|
| Data | 23/11/2026 |
| Commit | alteração local ainda não commitada |

**O que ficou pronto:** correção do crash TipTap na prancha/atas — `underline` duplicado (já incluso no StarterKit 3) removido; `getHTML` protegido contra editor destruído; `immediatelyRender: false`.

**Arquivos:** `LodgePranchaBodyEditor.tsx`, `RichTextEditor.tsx`.

## Onde continuar

Validar Nova Prancha e editor de atas sem warning de underline nem ErrorBoundary; depois commit/push se aprovado.

## Como ver isto de novo

```bash
npm run onde-paramos
```
