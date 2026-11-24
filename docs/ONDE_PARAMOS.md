# Onde paramos

Arquivo de continuidade. Leia isto no início de uma sessão e atualize ao terminar uma mudança pedida.

`ESTADO_ATUAL.md` descreve uma fase antiga do projeto. Este arquivo é a referência de onde o trabalho parou.

## Última mudança concluída

| Campo | Valor |
|-------|--------|
| Data | 23/11/2026 |
| Commit | alteração local ainda não commitada |

**O que ficou pronto:** ponto de restauração de produção `restore-point-2026-11-23` (commit `f199ae7`), branch `restore/baseline-2026-11-23`, `STABLE_COMMIT` atualizado no workflow de rollback e registro em `docs/PONTO_RESTAURACAO.md`.

**Arquivos:** `docs/PONTO_RESTAURACAO.md`, `.github/workflows/rollback-emergency.yml`.

## Onde continuar

Novas implementações a partir deste baseline; em imprevisto, restaurar pela tag ou pelo Actions de rollback.

## Como ver isto de novo

```bash
npm run onde-paramos
```
