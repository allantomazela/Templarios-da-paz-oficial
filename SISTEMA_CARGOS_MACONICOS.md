# Sistema de Gestão de Cargos Maçônicos

## 📋 Visão Geral

Sistema completo para gerenciar os cargos da diretoria da loja maçônica, com permissões específicas de acesso aos módulos do sistema baseadas no cargo ocupado.

## 🎯 Cargos Disponíveis

1. **Venerável Mestre** - Acesso total ao sistema (equivalente a admin)
2. **Secretário** - Acesso aos módulos: Secretaria, Agenda, Biblioteca
3. **Chanceler** - Acesso aos módulos: Chanceler, Agenda
4. **Tesoureiro** - Acesso ao módulo: Financeiro
5. **Orador** - Acesso ao módulo: Relatórios (apenas visualização)

## 🗄️ Estrutura do Banco de Dados

### Tabelas Criadas

1. **`lodge_positions`** - Cargos atuais da diretoria
   - `id` (UUID)
   - `position_type` (ENUM: veneravel_mestre, orador, secretario, chanceler, tesoureiro)
   - `user_id` (UUID - referência ao usuário)
   - `start_date` (DATE - início do mandato)
   - `end_date` (DATE - fim do mandato, padrão: 2 anos)
   - `created_at`, `updated_at`

2. **`lodge_position_history`** - Histórico de todos os cargos
   - Mesma estrutura, mas sem `updated_at`
   - Usado para rastreamento de mudanças

### Funções SQL Criadas

- `has_active_position(user_id, position_type)` - Verifica se usuário tem cargo ativo
- `get_user_current_position(user_id)` - Retorna cargo atual do usuário
- `has_module_permission(user_id, module)` - Verifica permissão de módulo

## 🔐 Sistema de Permissões

### Mapeamento de Permissões

```typescript
POSITION_PERMISSIONS = {
  veneravel_mestre: ['*'], // Acesso total
  secretario: ['secretariat', 'agenda', 'library'],
  chanceler: ['chancellor', 'agenda'],
  tesoureiro: ['financial'],
  orador: ['reports'],
}
```

### Como Funciona

1. **Master Admin** (`allantomazela@gmail.com`) sempre tem acesso total, independente de cargo
2. **Venerável Mestre** tem acesso total (equivalente a admin)
3. Outros cargos têm acesso apenas aos módulos especificados
4. O sistema verifica tanto **roles** (admin, editor, member) quanto **cargos** para determinar acesso

## 📁 Arquivos Criados/Modificados

### Novos Arquivos

1. **`supabase/migrations/20250103000000_create_lodge_positions.sql`**
   - Migration completa com tabelas, índices, RLS policies e funções

2. **`src/stores/useLodgePositionsStore.ts`**
   - Store Zustand para gerenciar cargos
   - Funções: `fetchPositions`, `assignPosition`, `removePosition`, `hasPermission`, etc.

3. **`src/components/admin/LodgePositionsManager.tsx`**
   - Componente completo para gestão de cargos
   - Interface para atribuir, editar e remover cargos
   - Visualização de histórico

### Arquivos Modificados

1. **`src/components/RoleGuard.tsx`**
   - Adicionado suporte para verificação de permissões baseadas em cargos
   - Novo parâmetro `requiredModule` para verificar acesso a módulos específicos

2. **`src/App.tsx`**
   - Rotas protegidas com `requiredModule` para cada módulo
   - Inicialização do store de cargos após autenticação

3. **`src/components/AppSidebar.tsx`**
   - Menu lateral agora mostra apenas módulos permitidos baseado no cargo
   - Verificação de permissões antes de exibir links

4. **`src/pages/Admin.tsx`**
   - Nova aba "Cargos Maçônicos" para gestão de cargos

## 🚀 Como Usar

### 1. Aplicar Migration

```bash
# A migration já foi criada em:
supabase/migrations/20250103000000_create_lodge_positions.sql
```

Aplique a migration no seu projeto Supabase através do dashboard ou CLI.

### 2. Atribuir Cargos

1. Acesse **Admin > Cargos Maçônicos**
2. Clique em **"Atribuir Cargo"**
3. Selecione:
   - **Cargo**: Venerável Mestre, Secretário, Chanceler, Tesoureiro ou Orador
   - **Usuário**: Selecione um usuário aprovado
   - **Data de Início**: Data de início do mandato
   - **Data de Término**: Data de término (padrão: 2 anos após início)

4. Clique em **"Atribuir"**

### 3. Gerenciar Cargos

- **Editar**: Clique no ícone de edição ao lado do cargo
- **Remover**: Clique no ícone de lixeira (o cargo será movido para histórico)
- **Ver Histórico**: Clique no botão "Histórico" para ver cargos anteriores

### 4. Troca de Diretoria (a cada 2 anos)

Quando ocorrer a troca de diretoria:

1. Atribua os novos cargos normalmente
2. O sistema automaticamente:
   - Move o cargo antigo para o histórico
   - Atribui o novo cargo
   - Atualiza as permissões dos usuários

## 🔒 Segurança

### Master Admin

O usuário master (`allantomazela@gmail.com`) sempre tem:
- Acesso total a todos os módulos
- Permissão para gerenciar cargos
- Bypass de todas as verificações de permissão

### Row Level Security (RLS)

- **Visualização**: Todos os usuários autenticados podem ver cargos atuais
- **Gestão**: Apenas admins podem criar, editar ou remover cargos
- **Histórico**: Todos podem visualizar, apenas admins podem inserir

## 📊 Fluxo de Permissões

```
Usuário faz login
    ↓
Sistema verifica:
    1. É Master Admin? → Acesso total
    2. Tem cargo ativo? → Verifica permissões do cargo
    3. Tem role admin/editor? → Verifica permissões da role
    ↓
Acesso concedido/negado baseado nas verificações
```

## 🎨 Interface

### Componente de Gestão

O componente `LodgePositionsManager` oferece:

- **Tabela de Cargos Atuais**: Lista todos os cargos ativos
- **Histórico**: Visualização de cargos anteriores
- **Dialog de Atribuição**: Formulário completo para atribuir/editar cargos
- **Validação**: Validação de datas e usuários
- **Feedback**: Toasts de sucesso/erro

### Badges Visuais

- **Venerável Mestre**: Badge destacado (default)
- **Outros cargos**: Badge outline

## 🔄 Integração com Sistema Existente

O sistema de cargos **complementa** o sistema de roles existente:

- **Roles** (admin, editor, member): Permissões gerais do sistema
- **Cargos**: Permissões específicas por módulo baseadas na função maçônica

Um usuário pode ter:
- Role: `member`
- Cargo: `secretario`
- Resultado: Acesso ao módulo Secretaria mesmo sendo apenas "member"

## 📝 Notas Importantes

1. **Mandato de 2 anos**: O sistema assume mandatos de 2 anos, mas permite configuração personalizada
2. **Cargo único por tipo**: Apenas um usuário pode ocupar cada cargo por vez
3. **Histórico automático**: Cargos removidos são automaticamente movidos para histórico
4. **Validação de datas**: O sistema valida que a data de término é posterior à data de início
5. **Usuários aprovados**: Apenas usuários com status `approved` podem receber cargos

## 🐛 Troubleshooting

### Cargo não aparece no menu

- Verifique se o cargo está ativo (data atual entre start_date e end_date)
- Verifique se o usuário está logado com o ID correto
- Verifique se o store foi inicializado (`fetchPositions()`)

### Permissão negada mesmo com cargo

- Verifique se o cargo está dentro do período válido
- Verifique se o módulo está mapeado corretamente em `POSITION_PERMISSIONS`
- Verifique se o `RoleGuard` está usando `requiredModule` corretamente

### Erro ao atribuir cargo

- Verifique se o usuário está aprovado (`status = 'approved'`)
- Verifique se as datas são válidas
- Verifique se não há conflito com cargo existente do mesmo tipo

## 🎯 Próximos Passos Sugeridos

1. **Notificações**: Enviar notificação quando cargo está próximo do vencimento
2. **Relatórios**: Relatório de histórico de cargos por usuário
3. **Exportação**: Exportar lista de cargos para PDF/Excel
4. **Dashboard**: Widget mostrando cargos atuais no dashboard principal
5. **Auditoria**: Log de todas as alterações de cargos

---

**Desenvolvido para ARLS Templários da Paz**  
*Sistema de gestão completo e escalável*

