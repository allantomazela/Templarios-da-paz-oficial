# Script para resolver conflitos de merge automaticamente
# Mantém a versão Supabase (incoming) para todos os arquivos financeiros

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Resolvendo Conflitos de Merge" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos em um merge
$mergeStatus = git status --porcelain | Select-String "^UU|^AA|^DD"
if (-not $mergeStatus) {
    Write-Host "❌ Não há conflitos de merge ativos." -ForegroundColor Yellow
    Write-Host "Execute este script durante um merge em andamento." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Merge em andamento detectado" -ForegroundColor Green
Write-Host ""

# Lista de arquivos com conflitos
$arquivos = @(
    "src/components/financial/ContributionsList.tsx",
    "src/components/financial/BankAccounts.tsx",
    "src/components/financial/IncomeList.tsx",
    "src/components/financial/ExpenseList.tsx",
    "src/components/financial/FinancialOverview.tsx",
    "src/components/financial/CategoryList.tsx",
    "src/components/financial/CashFlowReport.tsx",
    "src/components/financial/CharityCollection.tsx",
    "src/components/financial/BudgetsAndGoals.tsx"
)

Write-Host "Resolvendo conflitos (aceitando versão Supabase)..." -ForegroundColor Yellow
Write-Host ""

$resolvidos = 0
$erros = 0

foreach ($arquivo in $arquivos) {
    if (Test-Path $arquivo) {
        Write-Host "  → $arquivo" -ForegroundColor Gray
        try {
            git checkout --theirs $arquivo
            git add $arquivo
            $resolvidos++
            Write-Host "    ✓ Resolvido" -ForegroundColor Green
        } catch {
            Write-Host "    ✗ Erro ao resolver" -ForegroundColor Red
            $erros++
        }
    } else {
        Write-Host "  → $arquivo (não encontrado)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Resultado:" -ForegroundColor Cyan
Write-Host "  Resolvidos: $resolvidos" -ForegroundColor Green
Write-Host "  Erros: $erros" -ForegroundColor $(if ($erros -gt 0) { "Red" } else { "Green" })
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se ainda há conflitos
$conflitosRestantes = git diff --check
if ($conflitosRestantes) {
    Write-Host "⚠️  Ainda há conflitos restantes:" -ForegroundColor Yellow
    Write-Host $conflitosRestantes
    Write-Host ""
    Write-Host "Execute 'git status' para ver os arquivos com conflitos." -ForegroundColor Yellow
} else {
    Write-Host "✓ Todos os conflitos foram resolvidos!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Cyan
    Write-Host "  1. Verifique os arquivos: git status" -ForegroundColor White
    Write-Host "  2. Finalize o merge: git commit -m 'merge: resolver conflitos mantendo versão Supabase'" -ForegroundColor White
    Write-Host "  3. Envie para GitHub: git push origin main" -ForegroundColor White
}

Write-Host ""
