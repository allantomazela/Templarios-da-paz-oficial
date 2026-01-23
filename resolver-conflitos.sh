#!/bin/bash

# Script para resolver conflitos de merge automaticamente
# Mantém a versão Supabase (incoming) para todos os arquivos financeiros

echo "========================================"
echo "Resolvendo Conflitos de Merge"
echo "========================================"
echo ""

# Verificar se estamos em um merge
if ! git merge HEAD > /dev/null 2>&1; then
    if [ -d ".git/MERGE_HEAD" ] || git status --porcelain | grep -q "^UU\|^AA\|^DD"; then
        echo "✓ Merge em andamento detectado"
    else
        echo "❌ Não há conflitos de merge ativos."
        echo "Execute este script durante um merge em andamento."
        exit 1
    fi
fi

echo ""
echo "Resolvendo conflitos (aceitando versão Supabase)..."
echo ""

# Lista de arquivos com conflitos
arquivos=(
    "src/components/financial/ContributionsList.tsx"
    "src/components/financial/BankAccounts.tsx"
    "src/components/financial/IncomeList.tsx"
    "src/components/financial/ExpenseList.tsx"
    "src/components/financial/FinancialOverview.tsx"
    "src/components/financial/CategoryList.tsx"
    "src/components/financial/CashFlowReport.tsx"
    "src/components/financial/CharityCollection.tsx"
    "src/components/financial/BudgetsAndGoals.tsx"
)

resolvidos=0
erros=0

for arquivo in "${arquivos[@]}"; do
    if [ -f "$arquivo" ]; then
        echo "  → $arquivo"
        if git checkout --theirs "$arquivo" && git add "$arquivo" 2>/dev/null; then
            echo "    ✓ Resolvido"
            ((resolvidos++))
        else
            echo "    ✗ Erro ao resolver"
            ((erros++))
        fi
    else
        echo "  → $arquivo (não encontrado)"
    fi
done

echo ""
echo "========================================"
echo "Resultado:"
echo "  Resolvidos: $resolvidos"
echo "  Erros: $erros"
echo "========================================"
echo ""

# Verificar se ainda há conflitos
if git diff --check > /dev/null 2>&1; then
    echo "⚠️  Ainda há conflitos restantes:"
    git diff --check
    echo ""
    echo "Execute 'git status' para ver os arquivos com conflitos."
else
    echo "✓ Todos os conflitos foram resolvidos!"
    echo ""
    echo "Próximos passos:"
    echo "  1. Verifique os arquivos: git status"
    echo "  2. Finalize o merge: git commit -m 'merge: resolver conflitos mantendo versão Supabase'"
    echo "  3. Envie para GitHub: git push origin main"
fi

echo ""
