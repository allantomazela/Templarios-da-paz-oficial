# Onde paramos

Arquivo de continuidade. Leia isto no início de uma sessão e atualize ao terminar uma mudança pedida.

`ESTADO_ATUAL.md` descreve uma fase antiga do projeto. Este arquivo é a referência de onde o trabalho parou.

## Última mudança concluída

| Campo | Valor |
|-------|--------|
| Data | 10/11/2026 |
| Commit | alteração local ainda não commitada |

**O que ficou pronto:** controle de materiais na Chancelaria (aba **Materiais**). Catálogo com rituais, pins, aventais, luvas etc.; entrada/saída/ajuste atômico via RPC; histórico por item; alerta de estoque baixo; saída pode vincular irmão. Migração `lodge_materials_inventory` aplicada no **Templários Oficial** com seed inicial. Arquivos: `MaterialsManager.tsx`, `lodge-materials.ts`, `lodge-materials-api.ts`, `supabase/migrations/20261110160000_lodge_materials_inventory.sql`.

## Banco

Em 10/11/2026 a migração `lodge_materials_inventory` foi aplicada no Supabase **Templários Oficial**.

## Onde continuar

Chanceler: abrir **Materiais**, registrar as quantidades reais (entrada/ajuste) e usar saída nas entregas. Depois: Admitir Otacilio e Luciano com data 14/11.

## Como ver isto de novo

```bash
npm run onde-paramos
```
