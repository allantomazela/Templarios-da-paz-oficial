# Próximos Passos - Aplicação de Migrações

Este documento contém as instruções para aplicar as migrações SQL necessárias para habilitar as funcionalidades de avisos privados, mensalidades e doações.

## 📋 Migrações Criadas

### 1. Avisos Privados
**Arquivo:** `supabase/migrations/20250102000000_add_private_announcements.sql`
- ✅ Adiciona campo `is_private` na tabela `announcements`
- ✅ Atualiza política RLS para permitir que membros vejam apenas avisos públicos

### 2. Tabela de Mensalidades (Contributions)
**Arquivo:** `supabase/migrations/20250102010000_create_contributions_table.sql`
- ✅ Cria tabela `contributions` para armazenar mensalidades
- ✅ Campos: `id`, `brother_id`, `month`, `year`, `amount`, `status`, `payment_date`
- ✅ Políticas RLS: irmãos veem apenas suas próprias mensalidades; admin/editor veem todas

### 3. Tabela de Doações (Charity Donations)
**Arquivo:** `supabase/migrations/20250102020000_create_charity_donations_table.sql`
- ✅ Cria tabela `charity_donations` para armazenar doações ao Tronco de Beneficência
- ✅ Campos: `id`, `brother_id`, `amount`, `description`, `created_at`
- ✅ Políticas RLS: irmãos veem apenas suas próprias doações; admin/editor veem todas

## 🚀 Como Aplicar as Migrações

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Para cada arquivo de migração:
   - Abra o arquivo `.sql` no editor
   - Copie todo o conteúdo
   - Cole no SQL Editor do Supabase
   - Clique em **Run** ou pressione `Ctrl+Enter`
   - Verifique se não há erros

### Opção 2: Via Supabase CLI

Se você tem o Supabase CLI instalado:

```bash
# Certifique-se de estar na raiz do projeto
cd D:\Aplicativos\sitetemplariosoficial\Templarios-da-paz-oficial

# Aplique as migrações pendentes
supabase db push

# Ou aplique uma migração específica
supabase migration up
```

### Opção 3: Via Supabase MCP (se disponível)

Se você estiver usando o MCP do Supabase, pode aplicar as migrações diretamente através das ferramentas disponíveis.

## 📝 Ordem de Aplicação

Aplique as migrações na seguinte ordem:

1. **Primeiro:** `20250102000000_add_private_announcements.sql`
2. **Segundo:** `20250102010000_create_contributions_table.sql`
3. **Terceiro:** `20250102020000_create_charity_donations_table.sql`

## ✅ Verificação Pós-Migração

Após aplicar as migrações, verifique:

### 1. Tabela `announcements`
```sql
-- Verificar se a coluna is_private foi adicionada
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'announcements' 
AND column_name = 'is_private';
```

### 2. Tabela `contributions`
```sql
-- Verificar se a tabela foi criada
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'contributions';

-- Verificar estrutura
\d contributions
```

### 3. Tabela `charity_donations`
```sql
-- Verificar se a tabela foi criada
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'charity_donations';

-- Verificar estrutura
\d charity_donations
```

### 4. Políticas RLS
```sql
-- Verificar políticas RLS das novas tabelas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('contributions', 'charity_donations', 'announcements')
ORDER BY tablename, policyname;
```

## 🧪 Testes Após Aplicação

### Teste 1: Avisos Privados
1. Faça login como **admin/editor**
2. Crie um aviso e marque como "Privado"
3. Faça login como **membro comum**
4. Verifique que o aviso privado não aparece na lista
5. Verifique que avisos públicos aparecem normalmente

### Teste 2: Mensalidades
1. Faça login como **admin/editor**
2. Acesse a área financeira e crie uma mensalidade para um irmão
3. Faça login como o **irmão** correspondente
4. Acesse "Meus Pagamentos" e verifique se a mensalidade aparece
5. Verifique se outros irmãos não veem essa mensalidade

### Teste 3: Doações
1. Faça login como **admin/editor**
2. Registre uma doação ao Tronco de Beneficência para um irmão
3. Faça login como o **irmão** correspondente
4. Acesse "Meus Pagamentos" > "Tronco de Beneficência"
5. Verifique se a doação aparece corretamente

## 🔧 Estrutura das Tabelas

### Tabela `contributions`
```sql
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY,
  brother_id UUID REFERENCES profiles(id),
  month INTEGER (1-12),
  year INTEGER (2000-2100),
  amount NUMERIC(10, 2),
  status TEXT ('Pago' | 'Pendente' | 'Atrasado'),
  payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(brother_id, month, year)
);
```

### Tabela `charity_donations`
```sql
CREATE TABLE public.charity_donations (
  id UUID PRIMARY KEY,
  brother_id UUID REFERENCES profiles(id),
  amount NUMERIC(10, 2),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

## 📌 Notas Importantes

1. **Referência de Irmãos:** As tabelas `contributions` e `charity_donations` referenciam `profiles.id` (não `brothers.id`), pois o sistema usa `auth.uid()` que corresponde ao ID do perfil.

2. **RLS (Row Level Security):** Todas as tabelas têm RLS habilitado:
   - Irmãos podem ver apenas seus próprios registros
   - Admin/Editor podem ver e gerenciar todos os registros

3. **Validações:**
   - `contributions.month`: deve estar entre 1 e 12
   - `contributions.year`: deve estar entre 2000 e 2100
   - `contributions.amount` e `charity_donations.amount`: devem ser >= 0
   - `contributions.status`: deve ser 'Pago', 'Pendente' ou 'Atrasado'
   - `contributions`: UNIQUE(brother_id, month, year) - um irmão não pode ter duas mensalidades para o mesmo mês/ano

4. **Triggers:** Ambas as tabelas têm triggers para atualizar automaticamente o campo `updated_at` quando um registro é modificado.

## 🐛 Solução de Problemas

### Erro: "function is_admin_or_editor() does not exist"
**Solução:** A função `is_admin_or_editor()` deve existir. Verifique se a migração `20251227130000_fix_rls_policies.sql` foi aplicada.

### Erro: "relation 'profiles' does not exist"
**Solução:** A tabela `profiles` deve existir. Verifique se a migração `20251222100000_create_profiles_and_rbac.sql` foi aplicada.

### Erro: "duplicate key value violates unique constraint"
**Solução:** Isso pode acontecer ao tentar criar duas mensalidades para o mesmo irmão no mesmo mês/ano. Verifique os dados antes de inserir.

## 📞 Suporte

Se encontrar problemas ao aplicar as migrações:
1. Verifique os logs de erro no Supabase Dashboard
2. Confirme que todas as migrações anteriores foram aplicadas
3. Verifique se as tabelas `profiles` e `announcements` existem
4. Confirme que a função `is_admin_or_editor()` está disponível

---

**Última atualização:** 02/01/2025
**Status:** ✅ Migrações criadas e prontas para aplicação
