# Permissões para Membros Comuns

**Data:** 19/01/2025  
**Status:** ✅ **IMPLEMENTADO**

---

## 📋 Permissões Configuradas

Membros comuns (`role: 'member'`) agora têm acesso às seguintes funcionalidades:

### ✅ Agenda (Visualização)
- **Acesso:** Permitido para membros
- **Permissões:**
  - ✅ Visualizar eventos
  - ✅ Visualizar calendário
  - ✅ Filtrar eventos
  - ❌ Criar eventos (apenas admin/editor)
  - ❌ Editar eventos (apenas admin/editor)
  - ❌ Excluir eventos (apenas admin/editor)

### ✅ Biblioteca (Acesso Baseado no Grau)
- **Acesso:** Permitido para membros
- **Permissões:**
  - ✅ Visualizar conteúdo baseado no grau maçônico
  - ✅ Aprendiz: Acessa apenas material de Grau I
  - ✅ Companheiro: Acessa material de Grau I e Grau II
  - ✅ Mestre: Acessa todo o conteúdo
  - ❌ Gerenciar conteúdo (apenas admin/editor)

### ✅ Mídia e Notícias (Visualização)
- **Acesso:** Permitido para membros
- **Permissões:**
  - ✅ Visualizar notícias e eventos publicados
  - ✅ Visualizar conteúdo do site
  - ❌ Criar publicações (apenas admin/editor)
  - ❌ Editar publicações (apenas admin/editor)
  - ❌ Excluir publicações (apenas admin/editor)

---

## 🔧 Alterações Implementadas

### 1. RoleGuard (`src/components/RoleGuard.tsx`)
- ✅ Ajustado para permitir membros sem verificar cargo quando `allowedRoles` inclui 'member'
- ✅ Membros não precisam de cargo específico para acessar módulos básicos

### 2. Rotas (`src/App.tsx`)
- ✅ Agenda: Adicionado 'member' em `allowedRoles`, removido `requiredModule`
- ✅ Biblioteca: Adicionado 'member' em `allowedRoles`, removido `requiredModule`
- ✅ Mídia e Notícias: Adicionado 'member' em `allowedRoles`

### 3. Sidebar (`src/components/AppSidebar.tsx`)
- ✅ Adicionadas verificações `canSeeAgenda`, `canSeeLibrary`, `canSeeMedia`
- ✅ Membros agora veem os itens no menu lateral

### 4. Página Agenda (`src/pages/Agenda.tsx`)
- ✅ Botões de criar/editar ocultos para membros
- ✅ Apenas visualização permitida

### 5. NewsManager (`src/components/admin/NewsManager.tsx`)
- ✅ Botão "Nova Publicação" oculto para membros
- ✅ Botões de editar/excluir ocultos na tabela
- ✅ Exibe "Somente visualização" para membros

### 6. EventDetailsSheet (`src/components/agenda/EventDetailsSheet.tsx`)
- ✅ Botões de editar/excluir ocultos para membros
- ✅ Footer com ações só aparece para admin/editor

---

## 🧪 Como Testar

### Teste 1: Login como Membro
1. Faça login com uma conta de membro comum
2. Verifique se aparecem no menu:
   - ✅ Agenda
   - ✅ Biblioteca
   - ✅ Mídia e Notícias

### Teste 2: Agenda
1. Acesse `/dashboard/agenda`
2. ✅ Deve ver o calendário e eventos
3. ❌ Não deve ver botão "Novo"
4. ❌ Não deve ver botões de editar/excluir ao clicar em evento

### Teste 3: Biblioteca
1. Acesse `/dashboard/library`
2. ✅ Deve ver conteúdo baseado no grau
3. ✅ Se for Aprendiz, só vê material de Grau I
4. ✅ Se for Companheiro, vê Grau I e II
5. ✅ Se for Mestre, vê tudo

### Teste 4: Mídia e Notícias
1. Acesse `/dashboard/admin/media`
2. ✅ Deve ver lista de notícias/eventos
3. ❌ Não deve ver botão "Nova Publicação"
4. ❌ Não deve ver botões de editar/excluir
5. ✅ Deve ver "Somente visualização" na coluna de ações

---

## 📝 Estrutura de Permissões

### Roles do Sistema
- **admin**: Acesso total a tudo
- **editor**: Pode criar/editar conteúdo, mas não gerencia usuários
- **member**: Acesso de visualização a Agenda, Biblioteca e Mídia

### Módulos por Role

| Módulo | Admin | Editor | Member |
|--------|-------|--------|--------|
| Secretaria | ✅ | ✅ | ❌ |
| Financeiro | ✅ | ✅ | ❌ |
| Chanceler | ✅ | ✅ | ❌ |
| Relatórios | ✅ | ✅ | ✅* |
| **Agenda** | ✅ | ✅ | ✅ (visualização) |
| **Biblioteca** | ✅ | ✅ | ✅ (baseado no grau) |
| **Mídia e Notícias** | ✅ | ✅ | ✅ (visualização) |
| Admin Usuários | ✅ | ❌ | ❌ |
| Config. Site | ✅ | ✅ | ❌ |

*Relatórios: membros podem ver se tiverem cargo de Orador

---

## 🔒 Segurança

- ✅ Membros não podem criar/editar/excluir conteúdo
- ✅ Biblioteca filtra conteúdo por grau maçônico
- ✅ RLS (Row Level Security) no banco protege dados
- ✅ RoleGuard verifica permissões em todas as rotas
- ✅ UI oculta ações não permitidas

---

**Status:** ✅ **IMPLEMENTADO E TESTADO**
