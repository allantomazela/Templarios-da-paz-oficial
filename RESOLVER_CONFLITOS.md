# 🔧 Scripts para Resolver Conflitos de Merge

Este diretório contém scripts para resolver automaticamente os conflitos de merge nos componentes financeiros, mantendo a versão Supabase (incoming).

## 📋 Arquivos

- **`resolver-conflitos.ps1`** - Script PowerShell para Windows
- **`resolver-conflitos.sh`** - Script Bash para Linux/Mac/Git Bash

## 🚀 Como Usar

### Windows (PowerShell)

1. **Abra o PowerShell** na pasta do projeto:
   ```powershell
   cd "d:\Aplicativos\sitetemplariosoficial\Templarios-da-paz-oficial"
   ```

2. **Se necessário, permita a execução de scripts:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **Execute o script:**
   ```powershell
   .\resolver-conflitos.ps1
   ```

### Linux/Mac/Git Bash

1. **Dê permissão de execução:**
   ```bash
   chmod +x resolver-conflitos.sh
   ```

2. **Execute o script:**
   ```bash
   ./resolver-conflitos.sh
   ```

## ✅ O que o script faz

1. ✅ Verifica se há um merge em andamento
2. ✅ Aceita a versão Supabase (incoming) para todos os arquivos financeiros:
   - `ContributionsList.tsx`
   - `BankAccounts.tsx`
   - `IncomeList.tsx`
   - `ExpenseList.tsx`
   - `FinancialOverview.tsx`
   - `CategoryList.tsx`
   - `CashFlowReport.tsx`
   - `CharityCollection.tsx`
   - `BudgetsAndGoals.tsx`
3. ✅ Adiciona os arquivos resolvidos ao staging
4. ✅ Verifica se ainda há conflitos restantes

## 📝 Próximos Passos Após Executar

Após executar o script com sucesso:

1. **Verifique o status:**
   ```bash
   git status
   ```

2. **Finalize o merge:**
   ```bash
   git commit -m "merge: resolver conflitos mantendo versão Supabase"
   ```

3. **Envie para o GitHub:**
   ```bash
   git push origin main
   ```

## ⚠️ Importante

- O script **mantém a versão Supabase** (incoming) para todos os arquivos financeiros
- Se você precisar manter alguma alteração da versão HEAD, resolva manualmente
- Sempre verifique o resultado com `git status` antes de fazer commit

## 🔄 Comando Alternativo (Uma Linha)

Se preferir executar diretamente sem o script:

### PowerShell:
```powershell
$files = @("src/components/financial/ContributionsList.tsx", "src/components/financial/BankAccounts.tsx", "src/components/financial/IncomeList.tsx", "src/components/financial/ExpenseList.tsx", "src/components/financial/FinancialOverview.tsx", "src/components/financial/CategoryList.tsx", "src/components/financial/CashFlowReport.tsx", "src/components/financial/CharityCollection.tsx", "src/components/financial/BudgetsAndGoals.tsx"); foreach ($f in $files) { git checkout --theirs $f; git add $f }; Write-Host "Conflitos resolvidos! Execute: git commit -m 'merge: resolver conflitos'"
```

### Bash:
```bash
for f in src/components/financial/ContributionsList.tsx src/components/financial/BankAccounts.tsx src/components/financial/IncomeList.tsx src/components/financial/ExpenseList.tsx src/components/financial/FinancialOverview.tsx src/components/financial/CategoryList.tsx src/components/financial/CashFlowReport.tsx src/components/financial/CharityCollection.tsx src/components/financial/BudgetsAndGoals.tsx; do git checkout --theirs "$f" && git add "$f"; done && echo "Conflitos resolvidos! Execute: git commit -m 'merge: resolver conflitos'"
```
