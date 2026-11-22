# Onde paramos

Arquivo de continuidade. Leia isto no início de uma sessão e atualize ao terminar uma mudança pedida.

`ESTADO_ATUAL.md` descreve uma fase antiga do projeto. Este arquivo é a referência de onde o trabalho parou.

## Última mudança concluída

| Campo | Valor |
|-------|--------|
| Data | 22/11/2026 |
| Commit | d614dbc |

**O que ficou pronto:** módulo **Prancha** (saco de propostas) — formulário com impressão/PDF, envio ao Venerável e caixa restrita ao VM + admin geral. Migration no Supabase já aplicada.

**Arquivos:** `LodgePranchaPage.tsx`, `LodgePranchaNew.tsx`, `LodgePranchaDocument.tsx`, `lodge-prancha*.ts`, `20261122200000_lodge_pranchas.sql`, `App.tsx`, `AppSidebar.tsx`, `Dashboard.tsx`.

## Onde continuar

Validar no site após o deploy: Nova prancha → imprimir → enviar; abrir caixa como VM/admin. Opcional: alinhar layout à imagem-modelo e numeração sequencial.

## Como ver isto de novo

```bash
npm run onde-paramos
```
